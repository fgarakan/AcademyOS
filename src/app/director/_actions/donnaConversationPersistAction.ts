'use server'

// Mega Sprint 1101-1110 — DONNA Conversation DB Persistence V1
//
// Two exported server actions for persisting DONNA conversation state to the DB.
// Tables: donna_conversation_sessions, donna_conversation_messages (migration 070)
//
// Safety:
//   - assertNotPreviewMode() at entry — no writes in preview/demo mode
//   - academyId always resolved from profiles.academy_id — never from client
//   - Any active academy_memberships role accepted (directors, coaches, parents, players)
//   - rawDb = supabase as any — tables not in generated database.types.ts
//   - All errors caught — never throws — returns { ok: false, error }
//   - Session ownership re-verified on every message append (cross-academy write prevention)
//   - Does not write to proposed_actions, audit_logs, or core operational tables
//
// Graceful degradation:
//   If migration 070 has not been applied to the live DB, both actions return
//   { ok: false, error } cleanly. The calling client uses localStorage as the
//   primary/fallback store. DB persistence is additive, never blocking.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

// ── Session action ────────────────────────────────────────────────────────────

export interface UpsertDonnaConversationSessionInput {
  activePage?: string | null
  activeWorkflow?: string | null
  title?: string | null
  currentEntityType?: string | null
  currentEntityId?: string | null
}

export interface UpsertDonnaConversationSessionResult {
  ok: boolean
  sessionId: string | null
  role: string | null
  error?: string
}

/**
 * Returns the most recent active DONNA session for the authenticated user,
 * or creates a new one if none exists.
 * academyId and role always resolved server-side.
 */
export async function upsertDonnaConversationSessionAction(
  input: UpsertDonnaConversationSessionInput,
): Promise<UpsertDonnaConversationSessionResult> {
  try {
    await assertNotPreviewMode()

    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, sessionId: null, role: null, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    if (!profile?.academy_id) return { ok: false, sessionId: null, role: null, error: 'Academy context unavailable.' }
    const academyId = profile.academy_id as string

    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (!membership?.role) return { ok: false, sessionId: null, role: null, error: 'No active membership in this academy.' }
    const role = membership.role as string

    const rawDb = supabase as any

    // Find most recent active session for this user in this academy
    const { data: existing } = await rawDb
      .from('donna_conversation_sessions')
      .select('id, active_page, active_workflow')
      .eq('academy_id', academyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const hasUpdate = input.activePage !== undefined || input.activeWorkflow !== undefined
      if (hasUpdate) {
        await rawDb
          .from('donna_conversation_sessions')
          .update({
            active_page:     input.activePage ?? existing.active_page,
            active_workflow: input.activeWorkflow ?? existing.active_workflow,
            updated_at:      new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
      return { ok: true, sessionId: existing.id as string, role }
    }

    // Create new session
    const { data: created, error: insertError } = await rawDb
      .from('donna_conversation_sessions')
      .insert({
        academy_id:          academyId,
        user_id:             user.id,
        role,
        title:               input.title ?? null,
        active_page:         input.activePage ?? null,
        active_workflow:     input.activeWorkflow ?? null,
        current_entity_type: input.currentEntityType ?? null,
        current_entity_id:   input.currentEntityId ?? null,
        metadata:            {},
      })
      .select('id')
      .single()

    if (insertError || !created?.id) {
      return { ok: false, sessionId: null, role: null, error: insertError?.message ?? 'Failed to create DONNA session.' }
    }

    return { ok: true, sessionId: created.id as string, role }
  } catch {
    return { ok: false, sessionId: null, role: null, error: 'Unexpected error creating DONNA session.' }
  }
}

// ── Message append action ─────────────────────────────────────────────────────

export interface AppendDonnaMessageInput {
  sessionId: string
  role: 'user' | 'donna' | 'system' | 'tool'
  messageText: string
  messageKind?: 'text' | 'voice' | 'system' | 'action_result' | 'error'
  intent?: string | null
  confidence?: string | null
  source?: string | null
  pagePath?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AppendDonnaMessageResult {
  ok: boolean
  messageId: string | null
  error?: string
}

/**
 * Appends a message to an existing DONNA session.
 * Re-verifies session ownership against academy_id — prevents cross-academy injection.
 */
export async function appendDonnaMessageAction(
  input: AppendDonnaMessageInput,
): Promise<AppendDonnaMessageResult> {
  try {
    await assertNotPreviewMode()

    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, messageId: null, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    if (!profile?.academy_id) return { ok: false, messageId: null, error: 'Academy context unavailable.' }
    const academyId = profile.academy_id as string

    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (!membership?.role) return { ok: false, messageId: null, error: 'No active membership in this academy.' }

    const rawDb = supabase as any

    // Re-verify session belongs to this user's academy
    const { data: session } = await rawDb
      .from('donna_conversation_sessions')
      .select('academy_id, user_id')
      .eq('id', input.sessionId)
      .eq('academy_id', academyId)
      .single()

    if (!session) return { ok: false, messageId: null, error: 'Session not found or access denied.' }

    const messageText = typeof input.messageText === 'string'
      ? input.messageText.trim().slice(0, 8000)
      : ''
    if (!messageText) return { ok: false, messageId: null, error: 'Message text is required.' }

    const now = new Date().toISOString()

    const { data: inserted, error: insertError } = await rawDb
      .from('donna_conversation_messages')
      .insert({
        session_id:   input.sessionId,
        academy_id:   session.academy_id,
        user_id:      input.role === 'user' ? session.user_id : null,
        role:         input.role,
        message_text: messageText,
        message_kind: input.messageKind ?? 'text',
        intent:       input.intent ?? null,
        confidence:   input.confidence ?? null,
        source:       input.source ?? null,
        page_path:    input.pagePath ?? null,
        metadata:     input.metadata ?? {},
      })
      .select('id, created_at')
      .single()

    if (insertError || !inserted?.id) {
      return { ok: false, messageId: null, error: insertError?.message ?? 'Failed to append DONNA message.' }
    }

    // Update last_message_at — best-effort, never blocks response
    void rawDb
      .from('donna_conversation_sessions')
      .update({ last_message_at: inserted.created_at ?? now, updated_at: now })
      .eq('id', input.sessionId)

    return { ok: true, messageId: inserted.id as string }
  } catch {
    return { ok: false, messageId: null, error: 'Unexpected error appending DONNA message.' }
  }
}

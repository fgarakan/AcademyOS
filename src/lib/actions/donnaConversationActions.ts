'use server'

// Sprint 914.3 — DONNA Conversation Server Actions V1
// Bridge between client-side DonnaVoiceReadyShell and server-side persistence helpers.
// All writes are academy-scoped — academy_id is resolved from the authenticated user,
// never trusted from the client payload.
//
// All functions:
//   - Return { ok, data/error } — never throw
//   - Degrade gracefully — the client continues on failure
//   - Are fire-and-forget safe (callers can .catch(() => {}))
//   - Do not mutate curriculum, proposed_actions, or any core table
//   - Do not bypass review queues

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  getOrCreateDonnaConversationSession,
  appendDonnaConversationMessage,
  upsertDonnaWorkingMemory,
  getRecentDonnaConversationMessages,
  type DonnaConversationSession,
  type DonnaConversationMessage,
} from '@/lib/donna/donnaConversationPersistence'
import { buildDonnaContextPacket } from '@/lib/donna/donnaContextPacketBuilder'

// ── Typed result ────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── getOrCreateDonnaSession ────────────────────────────────────────────────────

export interface GetOrCreateSessionInput {
  activePage?: string | null
  activeWorkflow?: string | null
  title?: string | null
}

export async function getOrCreateDonnaSession(
  input: GetOrCreateSessionInput,
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    // Resolve role from membership (director or coach)
    const { data: membership } = await (supabase as any)
      .from('academy_memberships')
      .select('role')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const role = membership?.role ?? 'academy_director'

    const result = await getOrCreateDonnaConversationSession(supabase as any, {
      userId: user.id,
      role,
      activePage: input.activePage ?? null,
      activeWorkflow: input.activeWorkflow ?? null,
      title: input.title ?? null,
    })

    if (!result.ok) return { ok: false, error: result.error }
    return { ok: true, data: { sessionId: result.data.id } }
  } catch {
    return { ok: false, error: 'Unexpected error creating DONNA session.' }
  }
}

// ── appendDonnaMessage ─────────────────────────────────────────────────────────

export interface AppendMessageInput {
  sessionId: string
  role: 'user' | 'donna' | 'system' | 'tool'
  messageText: string
  messageKind?: 'text' | 'voice' | 'system' | 'action_result' | 'error'
  intent?: string | null
  confidence?: string | null
  source?: string | null
  pagePath?: string | null
  // Sprint 914.8: optional structured response schema metadata
  metadata?: Record<string, unknown> | null
}

export async function appendDonnaMessage(
  input: AppendMessageInput,
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const result = await appendDonnaConversationMessage(supabase as any, {
      sessionId:    input.sessionId,
      role:         input.role,
      messageText:  input.messageText,
      messageKind:  input.messageKind ?? 'text',
      intent:       input.intent ?? null,
      confidence:   input.confidence ?? null,
      source:       input.source ?? null,
      pagePath:     input.pagePath ?? null,
      metadata:     input.metadata ?? undefined,
    })

    if (!result.ok) return { ok: false, error: result.error }
    return { ok: true, data: { messageId: result.data.id } }
  } catch {
    return { ok: false, error: 'Unexpected error persisting DONNA message.' }
  }
}

// ── upsertDonnaMemory ──────────────────────────────────────────────────────────

export interface UpsertMemoryInput {
  sessionId: string
  memoryKey: string
  memoryValue: Record<string, unknown>
  scope?: 'session' | 'workflow' | 'page' | 'entity'
}

export async function upsertDonnaMemory(
  input: UpsertMemoryInput,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const result = await upsertDonnaWorkingMemory(supabase as any, user.id, {
      sessionId:    input.sessionId,
      memoryKey:    input.memoryKey,
      memoryValue:  input.memoryValue,
      scope:        input.scope ?? 'session',
    })

    if (!result.ok) return { ok: false, error: result.error }
    return { ok: true, data: { ok: true } }
  } catch {
    return { ok: false, error: 'Unexpected error persisting DONNA working memory.' }
  }
}

// ── buildDonnaContextPacketForSession ─────────────────────────────────────────
// Sprint 914.4: Assembles a safe context packet summary for the current session.
// Full packet is built server-side; only a safe summary is returned to the client.
// Directs context, working memory values, and raw message content stay server-side.

export interface BuildContextPacketInput {
  sessionId: string
  userMessage: string
  activePage?: string | null
  activeWorkflow?: string | null
  currentEntityType?: string | null
  currentEntityId?: string | null
  directorContext?: unknown | null
  metadata?: Record<string, unknown>
}

/** Safe summary returned to the client — no raw values, no IDs, no directorCtx. */
export interface ContextPacketSummary {
  sessionId: string | null
  activePage: string | null
  activeWorkflow: string | null
  recentConversationCount: number
  workingMemoryKeys: string[]
  hasDirectorContext: boolean
  userId: string
  role: string
  assembledAt: string
}

export async function buildDonnaContextPacketForSession(
  input: BuildContextPacketInput,
): Promise<ActionResult<ContextPacketSummary>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const { data: membership } = await (supabase as any)
      .from('academy_memberships')
      .select('role, academy_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!membership?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

    const packet = await buildDonnaContextPacket(supabase as any, {
      userMessage:        input.userMessage,
      academyId:          membership.academy_id as string,
      userId:             user.id,
      role:               (membership.role as string) ?? 'academy_director',
      sessionId:          input.sessionId,
      activePage:         input.activePage ?? null,
      activeWorkflow:     input.activeWorkflow ?? null,
      currentEntityType:  input.currentEntityType ?? null,
      currentEntityId:    input.currentEntityId ?? null,
      directorContext:    input.directorContext ?? null,
      metadata:           input.metadata ?? {},
    })

    const summary: ContextPacketSummary = {
      sessionId:               packet.sessionId,
      activePage:              packet.activePage,
      activeWorkflow:          packet.activeWorkflow,
      recentConversationCount: packet.recentConversation.length,
      workingMemoryKeys:       Object.keys(packet.workingMemory),
      hasDirectorContext:      packet.directorContext !== null,
      userId:                  packet.userId,
      role:                    packet.role,
      assembledAt:             new Date().toISOString(),
    }

    return { ok: true, data: summary }
  } catch {
    return { ok: false, error: 'Unexpected error building DONNA context packet.' }
  }
}

// ── getDonnaWorkingMemoryForSession ────────────────────────────────────────────
// Sprint 914.5: Read a single working memory key for a session.
// Verifies the session is accessible to the authenticated user via RLS.
// Returns null data (not an error) when the key does not exist.

export interface GetWorkingMemoryInput {
  sessionId: string
  memoryKey: string
}

export async function getDonnaWorkingMemoryForSession(
  input: GetWorkingMemoryInput,
): Promise<ActionResult<Record<string, unknown> | null>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    // RLS scopes the query to the authenticated user's accessible sessions.
    const { data, error } = await (supabase as any)
      .from('donna_working_memory')
      .select('memory_value, expires_at')
      .eq('session_id', input.sessionId)
      .eq('memory_key', input.memoryKey)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: true, data: null }

    // Respect TTL: expired entries are treated as absent
    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      return { ok: true, data: null }
    }

    return { ok: true, data: (data.memory_value as Record<string, unknown>) ?? null }
  } catch {
    return { ok: false, error: 'Unexpected error reading DONNA working memory.' }
  }
}

// ── recallRecentDonnaMessages ──────────────────────────────────────────────────

export interface RecallMessagesInput {
  sessionId: string
  limit?: number
}

export interface RecalledMessage {
  role: string
  messageText: string
  intent: string | null
  createdAt: string
}

export async function recallRecentDonnaMessages(
  input: RecallMessagesInput,
): Promise<ActionResult<RecalledMessage[]>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const result = await getRecentDonnaConversationMessages(
      supabase as any,
      input.sessionId,
      input.limit ?? 10,
    )

    if (!result.ok) return { ok: false, error: result.error }

    const messages: RecalledMessage[] = result.data.map(m => ({
      role:        m.role,
      messageText: m.messageText,
      intent:      m.intent,
      createdAt:   m.createdAt,
    }))

    return { ok: true, data: messages }
  } catch {
    return { ok: false, error: 'Unexpected error recalling DONNA messages.' }
  }
}

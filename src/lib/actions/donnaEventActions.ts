'use server'

// Sprint 914.6 — DONNA Event Server Actions V1
// Thin server-side wrappers for donnaEventLedger helpers.
// All functions: resolve auth, academy_id server-side; return { ok, data/error };
// never throw; fire-and-forget safe.

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  logDonnaEvent,
  getRecentDonnaEvents,
  type LogDonnaEventInput,
  type DonnaEvent,
  type DonnaEventType,
} from '@/lib/donna/donnaEventLedger'

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── logDonnaEventAction ────────────────────────────────────────────────────────

export interface LogEventInput {
  eventType: DonnaEventType | string
  sessionId?: string | null
  messageId?: string | null
  entityType?: string | null
  entityId?: string | null
  visibilityScope?: 'director' | 'head_coach' | 'staff' | 'system'
  confidence?: 'high' | 'medium' | 'low' | 'partial' | null
  source?: string | null
  /** Safe, non-sensitive metadata only. No raw notes, no sensitive entity IDs. */
  metadata?: Record<string, unknown>
}

export async function logDonnaEventAction(
  input: LogEventInput,
): Promise<ActionResult<{ eventId: string | undefined }>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

    const { data: membership } = await (supabase as any)
      .from('academy_memberships')
      .select('role')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const result = await logDonnaEvent(supabase as any, {
      academyId:       profile.academy_id as string,
      actorId:         user.id,
      actorRole:       (membership?.role as string) ?? null,
      sessionId:       input.sessionId ?? null,
      messageId:       input.messageId ?? null,
      entityType:      input.entityType ?? null,
      entityId:        input.entityId ?? null,
      eventType:       input.eventType,
      visibilityScope: input.visibilityScope ?? 'director',
      confidence:      input.confidence ?? null,
      source:          input.source ?? null,
      metadata:        input.metadata ?? {},
    })

    if (!result.ok) return { ok: false, error: result.error ?? 'Failed to log event.' }
    return { ok: true, data: { eventId: result.eventId } }
  } catch {
    return { ok: false, error: 'Unexpected error logging DONNA event.' }
  }
}

// ── getRecentDonnaEventsAction ─────────────────────────────────────────────────

export async function getRecentDonnaEventsAction(
  sessionId: string,
  limit = 20,
): Promise<ActionResult<DonnaEvent[]>> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return { ok: false, error: 'Not authenticated' }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

    const result = await getRecentDonnaEvents(supabase as any, {
      academyId: profile.academy_id as string,
      sessionId,
      limit,
    })

    if (!result.ok) return { ok: false, error: result.error ?? 'Failed to read events.' }
    return { ok: true, data: result.data ?? [] }
  } catch {
    return { ok: false, error: 'Unexpected error reading DONNA events.' }
  }
}

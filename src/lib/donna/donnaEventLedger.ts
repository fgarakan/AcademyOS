// Sprint 914.6 — DONNA Event Ledger V1
// Durable event logging helpers. All functions are non-throwing and additive.
// Event logging failure never breaks DONNA behavior.
//
// Pure library — accepts DB client from caller (no 'use server').
// All writes use (db as any) since donna_events is not in generated types.

import type { DB } from '@/lib/types/db'

// ── Event type constants ───────────────────────────────────────────────────────

export const DONNA_EVENT_TYPES = {
  SESSION_STARTED:          'donna_session_started',
  MESSAGE_PERSISTED:        'donna_message_persisted',
  USER_INTENT_DETECTED:     'user_intent_detected',
  CONTEXT_PACKET_GENERATED: 'context_packet_generated',
  RECOMMENDATION_GENERATED: 'recommendation_generated',
  CONFIRMATION_REQUESTED:   'confirmation_requested',
  CONFIRMATION_ACCEPTED:    'confirmation_accepted',
  CONFIRMATION_CANCELLED:   'confirmation_cancelled',
  CURRICULUM_DRAFT_CREATED: 'curriculum_draft_created',
  REVIEW_ITEM_CREATED:      'review_item_created',
  ACTION_BLOCKED:           'action_blocked',
  APPROVAL_REQUIRED:        'approval_required',
  RECOMMENDATION_ACCEPTED:  'recommendation_accepted',
  RECOMMENDATION_REJECTED:  'recommendation_rejected',
  RECOMMENDATION_MODIFIED:  'recommendation_modified',
} as const

export type DonnaEventType = typeof DONNA_EVENT_TYPES[keyof typeof DONNA_EVENT_TYPES]

// ── Input / output types ───────────────────────────────────────────────────────

export interface LogDonnaEventInput {
  academyId: string
  actorId?: string | null
  actorRole?: string | null
  sessionId?: string | null
  messageId?: string | null
  entityType?: string | null
  entityId?: string | null
  eventType: DonnaEventType | string
  visibilityScope?: 'director' | 'head_coach' | 'staff' | 'system'
  confidence?: 'high' | 'medium' | 'low' | 'partial' | null
  source?: string | null
  /** Safe, non-sensitive POJO only. No raw notes, no IDs of sensitive entities. */
  metadata?: Record<string, unknown>
}

export interface DonnaEvent {
  id: string
  academyId: string
  actorId: string | null
  actorRole: string | null
  sessionId: string | null
  eventType: string
  visibilityScope: string
  confidence: string | null
  source: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

// ── logDonnaEvent ──────────────────────────────────────────────────────────────

/**
 * Inserts one DONNA event row. Non-throwing — returns ok/error result.
 * Never breaks DONNA if it fails. Callers should .catch(() => {}).
 */
export async function logDonnaEvent(
  db: DB,
  input: LogDonnaEventInput,
): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  try {
    const { data, error } = await (db as any)
      .from('donna_events')
      .insert({
        academy_id:       input.academyId,
        actor_id:         input.actorId ?? null,
        actor_role:       input.actorRole ?? null,
        session_id:       input.sessionId ?? null,
        message_id:       input.messageId ?? null,
        entity_type:      input.entityType ?? null,
        entity_id:        input.entityId ?? null,
        event_type:       input.eventType,
        visibility_scope: input.visibilityScope ?? 'director',
        confidence:       input.confidence ?? null,
        source:           input.source ?? null,
        metadata:         input.metadata ?? {},
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, eventId: data?.id as string | undefined }
  } catch {
    return { ok: false, error: 'Unexpected error logging DONNA event.' }
  }
}

// ── getRecentDonnaEvents ───────────────────────────────────────────────────────

/**
 * Returns recent DONNA events for a session or academy, newest-first.
 * Non-throwing.
 */
export async function getRecentDonnaEvents(
  db: DB,
  options: {
    academyId: string
    sessionId?: string | null
    eventType?: string | null
    limit?: number
  },
): Promise<{ ok: boolean; data?: DonnaEvent[]; error?: string }> {
  try {
    let query = (db as any)
      .from('donna_events')
      .select('*')
      .eq('academy_id', options.academyId)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 20)

    if (options.sessionId) query = query.eq('session_id', options.sessionId)
    if (options.eventType)  query = query.eq('event_type', options.eventType)

    const { data, error } = await query
    if (error) return { ok: false, error: error.message }

    const events: DonnaEvent[] = ((data as any[]) ?? []).map(row => ({
      id:               row.id,
      academyId:        row.academy_id,
      actorId:          row.actor_id ?? null,
      actorRole:        row.actor_role ?? null,
      sessionId:        row.session_id ?? null,
      eventType:        row.event_type,
      visibilityScope:  row.visibility_scope,
      confidence:       row.confidence ?? null,
      source:           row.source ?? null,
      metadata:         (row.metadata as Record<string, unknown>) ?? {},
      createdAt:        row.created_at,
    }))

    return { ok: true, data: events }
  } catch {
    return { ok: false, error: 'Unexpected error reading DONNA events.' }
  }
}

// Sprint 914.11 — DONNA Recommendation Feedback Loop V1
// Sprint 915.1 — Invalidate recent_recommendations cache on create
// Helpers for logging recommendations and recording director feedback.
// Non-throwing — all functions return ok/error, never break DONNA.
//
// Safety:
//   - No sensitive raw parent/player text in recommendation_text or feedback_reason
//   - No recommendation becomes an action without explicit director approval
//   - Feedback is for human analysis only — no automated learning model

import type { DB } from '@/lib/types/db'
import { onRecommendationLogged } from '@/lib/donna/donnaContextCache'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | 'operating_priority'   // from director brief / attention ranking
  | 'review_queue'         // from review queue intelligence
  | 'onboarding_guide'     // from onboarding guide
  | 'curriculum_gap'       // from curriculum gap analysis
  | 'player_attention'     // from player attention signals

export type FeedbackStatus =
  | 'accepted'   // director acted on the recommendation
  | 'rejected'   // director explicitly dismissed it
  | 'modified'   // director changed it before acting
  | 'ignored'    // no action taken
  | 'deferred'   // director decided to act later

export interface CreateDonnaRecommendationInput {
  academyId: string
  sessionId?: string | null
  eventId?: string | null
  sourceSignal: string
  recommendationType: RecommendationType
  recommendationText: string
  confidence?: 'high' | 'medium' | 'low' | 'partial' | null
  createdBy?: string | null
}

export interface DonnaRecommendation {
  id: string
  academyId: string
  sessionId: string | null
  sourceSignal: string
  recommendationType: string
  recommendationText: string
  confidence: string | null
  status: string
  createdAt: string
}

export interface RecordFeedbackInput {
  recommendationId: string
  academyId: string
  sessionId?: string | null
  feedbackStatus: FeedbackStatus
  feedbackReason?: string | null
  modifiedText?: string | null
  finalActionEventId?: string | null
  recordedBy?: string | null
}

// ── createDonnaRecommendation ──────────────────────────────────────────────────

export async function createDonnaRecommendation(
  db: DB,
  input: CreateDonnaRecommendationInput,
): Promise<{ ok: boolean; recommendationId?: string; error?: string }> {
  try {
    const { data, error } = await (db as any)
      .from('donna_recommendations')
      .insert({
        academy_id:           input.academyId,
        session_id:           input.sessionId ?? null,
        event_id:             input.eventId ?? null,
        source_signal:        input.sourceSignal,
        recommendation_type:  input.recommendationType,
        recommendation_text:  input.recommendationText,
        confidence:           input.confidence ?? null,
        created_by:           input.createdBy ?? null,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    // Invalidate recent_recommendations cache so next context packet sees fresh data
    try { onRecommendationLogged(input.academyId) } catch { /* never block on cache ops */ }
    return { ok: true, recommendationId: data?.id as string | undefined }
  } catch {
    return { ok: false, error: 'Unexpected error creating DONNA recommendation.' }
  }
}

// ── recordDonnaRecommendationFeedback ──────────────────────────────────────────

export async function recordDonnaRecommendationFeedback(
  db: DB,
  input: RecordFeedbackInput,
): Promise<{ ok: boolean; feedbackId?: string; error?: string }> {
  try {
    // Update recommendation status
    await (db as any)
      .from('donna_recommendations')
      .update({ status: input.feedbackStatus === 'accepted' ? 'acted_on' : 'dismissed' })
      .eq('id', input.recommendationId)
      .eq('academy_id', input.academyId)

    // Insert feedback row
    const { data, error } = await (db as any)
      .from('donna_recommendation_feedback')
      .insert({
        recommendation_id:      input.recommendationId,
        academy_id:             input.academyId,
        session_id:             input.sessionId ?? null,
        feedback_status:        input.feedbackStatus,
        feedback_reason:        input.feedbackReason ?? null,
        modified_text:          input.modifiedText ?? null,
        final_action_event_id:  input.finalActionEventId ?? null,
        recorded_by:            input.recordedBy ?? null,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, feedbackId: data?.id as string | undefined }
  } catch {
    return { ok: false, error: 'Unexpected error recording DONNA recommendation feedback.' }
  }
}

// ── getRecentDonnaRecommendations ──────────────────────────────────────────────

export async function getRecentDonnaRecommendations(
  db: DB,
  options: {
    academyId: string
    sessionId?: string | null
    recommendationType?: RecommendationType | null
    limit?: number
  },
): Promise<{ ok: boolean; data?: DonnaRecommendation[]; error?: string }> {
  try {
    let query = (db as any)
      .from('donna_recommendations')
      .select('*')
      .eq('academy_id', options.academyId)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 10)

    if (options.sessionId) query = query.eq('session_id', options.sessionId)
    if (options.recommendationType) query = query.eq('recommendation_type', options.recommendationType)

    const { data, error } = await query
    if (error) return { ok: false, error: error.message }

    const recs: DonnaRecommendation[] = ((data as any[]) ?? []).map(row => ({
      id:                   row.id,
      academyId:            row.academy_id,
      sessionId:            row.session_id ?? null,
      sourceSignal:         row.source_signal,
      recommendationType:   row.recommendation_type,
      recommendationText:   row.recommendation_text,
      confidence:           row.confidence ?? null,
      status:               row.status,
      createdAt:            row.created_at,
    }))

    return { ok: true, data: recs }
  } catch {
    return { ok: false, error: 'Unexpected error reading DONNA recommendations.' }
  }
}

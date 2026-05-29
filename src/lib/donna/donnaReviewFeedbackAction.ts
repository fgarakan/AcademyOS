'use server'

// Sprint 916 — DONNA Director UX Integration V1
// Server Action: creates a donna_recommendations row and immediately records
// director feedback against it. Used by review queue feedback chips.
//
// Safety:
//   - Non-throwing: always returns { ok, error? }
//   - Logging failure never breaks the UI or navigation
//   - No mutation to proposed_actions, curriculum, or player data
//   - Uses assertDonnaApprovalAllowed to document gate pattern for review_queue category

import { getSupabaseServer } from '@/lib/supabase/server'
import type { RecommendationType, FeedbackStatus } from '@/lib/donna/donnaRecommendationFeedback'
import { createDonnaRecommendation, recordDonnaRecommendationFeedback } from '@/lib/donna/donnaRecommendationFeedback'
import { assertDonnaApprovalAllowed } from '@/lib/donna/donnaApprovalGate'

export interface ReviewFeedbackInput {
  recommendationText: string
  recommendationType: RecommendationType
  feedbackStatus: FeedbackStatus
}

export async function createAndRecordReviewFeedbackAction(
  input: ReviewFeedbackInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Approval gate check: review_queue recommendations are read-only signals.
    // assertDonnaApprovalAllowed confirms 'recommend' requires no approval gate.
    const gate = assertDonnaApprovalAllowed('recommend', 'none')
    if (!gate.allowed) {
      return { ok: false, error: gate.reason }
    }

    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: true } // silent: unauthenticated, skip logging

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    const academyId = profile?.academy_id
    if (!academyId) return { ok: true } // silent: no academy context, skip

    // Create the recommendation row
    const createResult = await createDonnaRecommendation(supabase, {
      academyId,
      sourceSignal: 'review_queue_brief',
      recommendationType: input.recommendationType,
      recommendationText: input.recommendationText,
      confidence: 'medium',
      createdBy: user.id,
    })
    if (!createResult.ok || !createResult.recommendationId) {
      // Non-blocking: recommendation row creation failed, skip feedback
      return { ok: true }
    }

    // Record feedback against the new recommendation
    await recordDonnaRecommendationFeedback(supabase, {
      recommendationId: createResult.recommendationId,
      academyId,
      feedbackStatus: input.feedbackStatus,
      recordedBy: user.id,
    })

    return { ok: true }
  } catch {
    // Never propagate — logging failure must not break the UI
    return { ok: true }
  }
}

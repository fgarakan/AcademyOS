// Sprint 582 — Assessment Review Model V1
// Types and helpers for the director review and approval workflow.
// Draft-only — no DB writes. Director approval is a UI confirmation step only.
// Pure TypeScript — no DB calls, no AI calls, no side effects.

import type { PlacementRecommendationDraft, RecommendedStage } from './placementRecommendation'

export type ReviewDecision = 'approve' | 'adjust_and_approve' | 'reject' | 'defer'

export interface AssessmentReviewAction {
  decision: ReviewDecision
  reviewedBy: string
  reviewedAt: string
  adjustedStage?: RecommendedStage
  directorNotes: string
  notifyCoach: boolean
}

export interface AssessmentReviewState {
  recommendation: PlacementRecommendationDraft
  reviewAction: AssessmentReviewAction | null
  isDraftConfirmed: boolean
}

export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  approve: 'Approve recommendation',
  adjust_and_approve: 'Adjust stage and approve',
  reject: 'Reject — reassess',
  defer: 'Defer — more information needed',
}

export const REVIEW_DECISION_DESCRIPTIONS: Record<ReviewDecision, string> = {
  approve: 'Confirm the DONNA-recommended stage and mark this assessment as approved.',
  adjust_and_approve: 'Override the recommended stage with your own judgement, then approve.',
  reject: 'Decline this assessment result. A new assessment must be conducted.',
  defer: 'Hold this recommendation pending further observation or documentation.',
}

export function makeReviewAction(
  decision: ReviewDecision,
  reviewedBy: string,
  options: {
    adjustedStage?: RecommendedStage
    directorNotes?: string
    notifyCoach?: boolean
  } = {},
): AssessmentReviewAction {
  return {
    decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    adjustedStage: options.adjustedStage,
    directorNotes: options.directorNotes ?? '',
    notifyCoach: options.notifyCoach ?? false,
  }
}

export function getFinalStage(
  recommendation: PlacementRecommendationDraft,
  reviewAction: AssessmentReviewAction,
): RecommendedStage | null {
  if (reviewAction.decision === 'adjust_and_approve') {
    return reviewAction.adjustedStage ?? recommendation.recommendedStage
  }
  if (reviewAction.decision === 'approve') {
    return recommendation.recommendedStage
  }
  return null
}

export function isReviewComplete(state: AssessmentReviewState): boolean {
  return state.reviewAction !== null && state.isDraftConfirmed
}

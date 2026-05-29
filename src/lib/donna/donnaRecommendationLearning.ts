// Sprint 956 — Recommendation Feedback Learning V1
// Tracks recommendation outcomes to improve future DONNA suggestions.
// Pure TypeScript — defines the learning contract; DB writes via existing
// donnaRecommendationFeedback.ts infrastructure.

import { FEEDBACK_WEIGHTS, type RecommendationFeedbackEvent } from './donnaMemoryPolicy'

// ── Learning outcome ──────────────────────────────────────────────────────────

export interface RecommendationOutcome {
  recommendationId: string
  recommendationType: string
  sourceSignal: string
  event: RecommendationFeedbackEvent
  weight: number
  sessionId: string | null
}

export function buildRecommendationOutcome(
  recommendationId: string,
  recommendationType: string,
  sourceSignal: string,
  event: RecommendationFeedbackEvent,
  sessionId: string | null = null,
): RecommendationOutcome {
  return {
    recommendationId,
    recommendationType,
    sourceSignal,
    event,
    weight: FEEDBACK_WEIGHTS[event],
    sessionId,
  }
}

// ── Aggregate learning summary ────────────────────────────────────────────────

export interface RecommendationLearningStats {
  totalShown: number
  accepted: number
  dismissed: number
  edited: number
  completed: number
  ignored: number
  acceptanceRate: number   // (accepted + completed) / totalShown
  dismissalRate: number    // dismissed / totalShown
  netScore: number         // sum of weights
}

export function computeLearningStats(
  outcomes: RecommendationOutcome[],
): RecommendationLearningStats {
  const total = outcomes.length
  const accepted  = outcomes.filter(o => o.event === 'accepted').length
  const dismissed = outcomes.filter(o => o.event === 'dismissed').length
  const edited    = outcomes.filter(o => o.event === 'edited').length
  const completed = outcomes.filter(o => o.event === 'completed').length
  const ignored   = outcomes.filter(o => o.event === 'ignored').length
  const shown     = outcomes.filter(o => o.event === 'shown').length

  const netScore = outcomes.reduce((sum, o) => sum + o.weight, 0)

  return {
    totalShown: total,
    accepted,
    dismissed,
    edited,
    completed,
    ignored,
    acceptanceRate: total > 0 ? (accepted + completed) / total : 0,
    dismissalRate: total > 0 ? dismissed / total : 0,
    netScore,
  }
}

// ── Recommendation ranking adjustment ────────────────────────────────────────

/**
 * Returns an adjusted priority weight for a recommendation type based on historical outcomes.
 * Higher weight = surface this type more prominently.
 * Base weight is 1.0. Accepted/completed outcomes increase it; dismissed outcomes reduce it.
 */
export function getAdjustedPriorityWeight(
  recommendationType: string,
  historicalOutcomes: RecommendationOutcome[],
): number {
  const relevant = historicalOutcomes.filter(o => o.recommendationType === recommendationType)
  if (relevant.length === 0) return 1.0

  const stats = computeLearningStats(relevant)
  // Clamp between 0.3 and 1.5
  const adjusted = 1.0 + (stats.acceptanceRate - stats.dismissalRate) * 0.5
  return Math.max(0.3, Math.min(1.5, adjusted))
}

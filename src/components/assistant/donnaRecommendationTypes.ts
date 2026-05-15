// Sprint 374 — Donna Recommendation Object Model V1
// Pure types file. No React, no DB, no API calls.
// Defines the recommendation object model used by the rule-based engine (Sprint 375).

// ── Recommendation category ────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'curriculum'       // Level placement, template selection, block adjustments
  | 'communication'    // Draft parent updates, coach briefs, attendance notes
  | 'scheduling'       // Session creation, template population
  | 'player'           // Level readiness, attendance patterns, player focus
  | 'coach'            // Coach assignment, brief preparation
  | 'operations'       // Review queue, pending approvals, system health

// ── Recommendation priority ────────────────────────────────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'normal' | 'low'

// ── Recommendation action ──────────────────────────────────────────────────────
// Describes what Donna can help with when the director acts on the recommendation.

export type RecommendationActionType =
  | 'start_workflow'   // Open a Donna workflow (draft, task, etc.)
  | 'navigate'         // Route director to a page
  | 'open_review'      // Open the review queue panel
  | 'none'             // Informational only

export interface RecommendationAction {
  type: RecommendationActionType
  workflowId?: string          // For start_workflow
  destination?: string         // For navigate (approved /director routes only)
  label: string                // Button/chip label shown to director
}

// ── Core recommendation object ─────────────────────────────────────────────────

export interface DonnaRecommendation {
  id: string
  category: RecommendationCategory
  priority: RecommendationPriority
  title: string
  rationale: string            // One-sentence explanation of why this is recommended
  action: RecommendationAction
  createdAt: string            // ISO timestamp
  // Optional metadata — used for deduplication and signal tracking
  signalKey?: string           // e.g. 'pending_review_count', 'pending_placement_count'
  signalValue?: number | string
}

// ── Recommendation set ─────────────────────────────────────────────────────────

export interface DonnaRecommendationSet {
  generatedAt: string
  recommendations: DonnaRecommendation[]
  hasUrgent: boolean
}

// ── Comparison helpers ─────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

/**
 * Sort recommendations by priority (critical first) then category alphabetically.
 */
export function sortRecommendations(recs: DonnaRecommendation[]): DonnaRecommendation[] {
  return [...recs].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority]
    const pb = PRIORITY_ORDER[b.priority]
    if (pa !== pb) return pa - pb
    return a.category.localeCompare(b.category)
  })
}

/**
 * Create an empty recommendation set.
 */
export function createEmptyRecommendationSet(): DonnaRecommendationSet {
  return {
    generatedAt: new Date().toISOString(),
    recommendations: [],
    hasUrgent: false,
  }
}

/**
 * Wrap a sorted list of recommendations into a set object.
 */
export function buildRecommendationSet(recs: DonnaRecommendation[]): DonnaRecommendationSet {
  const sorted = sortRecommendations(recs)
  return {
    generatedAt: new Date().toISOString(),
    recommendations: sorted,
    hasUrgent: sorted.some(r => r.priority === 'critical' || r.priority === 'high'),
  }
}

// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Evidence Strength & Recommendation Type foundation.
//
// Evidence quality gates what DONNA is allowed to recommend.
// Reality (player outcomes) outranks structural curriculum theory.
//
// Gate rules:
//   insufficient → INVESTIGATE or MONITOR only
//   low          → no REMOVE, no MERGE
//   medium       → no REMOVE (structural-only remove is never allowed)
//   high         → all types except REMOVE (removal requires director-initiated intent)
//
// Note: REMOVE is intentionally restricted to all evidence levels.
// Removing curriculum content is a director-led decision (curriculum_remove intent).
// DONNA surfaces the signal; the director decides. Never recommend REMOVE automatically.

// ── Types ─────────────────────────────────────────────────────────────────────

/** How strong is the evidence backing a recommendation. */
export type EvidenceStrength = 'high' | 'medium' | 'low' | 'insufficient'

/**
 * What kind of curriculum change DONNA is recommending.
 * Matched to evidence strength — DONNA may not recommend destructive actions
 * (REMOVE, MERGE) without sufficient evidence.
 */
export type RecommendationType =
  | 'CREATE'       // Add new content (drill, game, assessment, progression)
  | 'IMPROVE'      // Refine or enhance an existing item
  | 'REMOVE'       // Flag an item for director-led removal (never auto-recommended)
  | 'MERGE'        // Combine near-duplicate items into one stronger item
  | 'REORDER'      // Change the sequence of items within a level
  | 'INVESTIGATE'  // Not enough evidence to act — director should investigate
  | 'MONITOR'      // Structural signal present but outcomes are good — watch only

// ── Evidence gate ─────────────────────────────────────────────────────────────

const ALLOWED_TYPES_BY_STRENGTH: Record<EvidenceStrength, ReadonlySet<RecommendationType>> = {
  high:         new Set<RecommendationType>(['CREATE', 'IMPROVE', 'MERGE', 'REORDER', 'INVESTIGATE', 'MONITOR']),
  medium:       new Set<RecommendationType>(['CREATE', 'IMPROVE', 'REORDER', 'INVESTIGATE', 'MONITOR']),
  low:          new Set<RecommendationType>(['CREATE', 'IMPROVE', 'REORDER', 'INVESTIGATE', 'MONITOR']),
  insufficient: new Set<RecommendationType>(['INVESTIGATE', 'MONITOR']),
}

/** Returns true if a recommendation type is allowed at the given evidence level. */
export function isRecommendationTypeAllowed(
  strength: EvidenceStrength,
  type: RecommendationType,
): boolean {
  return ALLOWED_TYPES_BY_STRENGTH[strength].has(type)
}

/**
 * Downgrades a recommendation type to the strongest allowed type at the given strength.
 * Used when the engine wants to recommend something stronger than evidence supports.
 */
export function clampRecommendationType(
  strength: EvidenceStrength,
  desired: RecommendationType,
): RecommendationType {
  if (isRecommendationTypeAllowed(strength, desired)) return desired
  // Downgrade path: REMOVE → INVESTIGATE, MERGE → INVESTIGATE, anything else → MONITOR
  if (desired === 'REMOVE' || desired === 'MERGE') return 'INVESTIGATE'
  return 'MONITOR'
}

// ── Evidence strength computation ─────────────────────────────────────────────

/**
 * Computes evidence strength from available player intelligence signals.
 * This is the bridge between "do we have data?" and "how confident can DONNA be?"
 */
export function computeEvidenceStrength(params: {
  playerCount:          number
  advancementEligible:  number
  hasEvidence:          boolean
  evidenceSource:       'evidence_records' | 'fallback_tables' | 'none'
  improvementSignalCount: number
}): EvidenceStrength {
  const { playerCount, hasEvidence, evidenceSource, improvementSignalCount } = params

  if (!hasEvidence || evidenceSource === 'none' || playerCount === 0) {
    return 'insufficient'
  }

  if (evidenceSource === 'evidence_records') {
    if (playerCount >= 5 && improvementSignalCount >= 2) return 'high'
    if (playerCount >= 3 || improvementSignalCount >= 1) return 'medium'
    return 'low'
  }

  // fallback_tables: assessments only — weaker signal
  if (playerCount >= 8 && improvementSignalCount >= 2) return 'medium'
  if (playerCount >= 3) return 'low'
  return 'insufficient'
}

// ── False positive guard ──────────────────────────────────────────────────────

/**
 * Returns true if player outcomes are strong enough to suppress structural gap warnings.
 * This is the "Reality Wins" gate: if players are succeeding, structural gaps are
 * monitoring items at most — not action items.
 *
 * Conditions for outcome-excellence:
 *   - playerCount > 0 (someone is actually at this level)
 *   - hasEvidence = true
 *   - advancementEligible / playerCount >= 0.4 (40%+ are ready to advance)
 *   - No weak domains reported
 *   - Evidence from real records, not fallback
 */
export function arePlayerOutcomesExcellent(params: {
  playerCount:          number
  advancementEligible:  number
  hasEvidence:          boolean
  evidenceSource:       'evidence_records' | 'fallback_tables' | 'none'
  weakDomainCount:      number
}): boolean {
  const { playerCount, advancementEligible, hasEvidence, evidenceSource, weakDomainCount } = params

  if (playerCount === 0) return false
  if (!hasEvidence)      return false
  if (evidenceSource !== 'evidence_records') return false
  if (weakDomainCount > 0) return false

  const advancementRate = advancementEligible / playerCount
  return advancementRate >= 0.4
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const EVIDENCE_STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  high:         'Strong Evidence',
  medium:       'Moderate Evidence',
  low:          'Limited Evidence',
  insufficient: 'Insufficient Evidence',
}

export const RECOMMENDATION_TYPE_LABEL: Record<RecommendationType, string> = {
  CREATE:      'Create New',
  IMPROVE:     'Improve Existing',
  REMOVE:      'Review for Removal',
  MERGE:       'Merge with Existing',
  REORDER:     'Reorder Sequence',
  INVESTIGATE: 'Investigate Further',
  MONITOR:     'Monitor Only',
}

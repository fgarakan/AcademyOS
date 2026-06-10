// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Trend detection: identifies directional changes in AcademyMemory[] over time.
// Splits the memory window into two halves and compares counts.
// Pure observation — no causation claims. Strict minimum thresholds enforced.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type {
  TrendDetectionResult,
  TrendType,
  TrendDirection,
  LearningConfidence,
} from './donnaAcademyLearningTypes'

// ── Thresholds ────────────────────────────────────────────────────────────────

const MIN_MEMORIES_FOR_TREND = 8   // minimum total records to attempt any trend
const MIN_HALF_SIZE          = 3   // minimum records in each half of the window
const CHANGE_THRESHOLD       = 1.5 // early:recent ratio must exceed this to call a direction

// ── Time split ────────────────────────────────────────────────────────────────

function splitByTime<T extends { occurredAt: string }>(
  items: T[],
): { early: T[]; recent: T[] } {
  if (items.length < 2) return { early: [], recent: [] }
  const sorted = [...items].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  const mid = Math.floor(sorted.length / 2)
  return { early: sorted.slice(0, mid), recent: sorted.slice(mid) }
}

// ── Direction resolver ────────────────────────────────────────────────────────

function resolveDirection(earlyCount: number, recentCount: number): TrendDirection {
  if (earlyCount === 0 && recentCount === 0) return 'insufficient_data'
  if (earlyCount === 0)  return 'increasing'
  if (recentCount === 0) return 'decreasing'
  const ratio = recentCount / earlyCount
  if (ratio >= CHANGE_THRESHOLD)     return 'increasing'
  if (ratio <= 1 / CHANGE_THRESHOLD) return 'decreasing'
  return 'stable'
}

// ── Confidence from total ─────────────────────────────────────────────────────

function trendConfidence(totalItems: number, direction: TrendDirection): LearningConfidence {
  if (direction === 'insufficient_data') return 'insufficient'
  if (direction === 'stable')            return 'low'
  if (totalItems >= MIN_MEMORIES_FOR_TREND) return 'low'
  return 'insufficient'
}

// ── Trend builder ─────────────────────────────────────────────────────────────

function makeTrend(
  type:            TrendType,
  headline:        string,
  direction:       TrendDirection,
  observation:     string,
  evidence:        string[],
  sourceMemoryIds: string[],
  confidence:      LearningConfidence,
): TrendDetectionResult {
  return {
    id: `trend-${type}-${Date.now()}`,
    trendType: type,
    headline,
    direction,
    observation,
    evidence,
    sourceMemoryIds,
    confidence,
  }
}

// ── Decision velocity ─────────────────────────────────────────────────────────

function detectDecisionVelocity(memories: AcademyMemory[]): TrendDetectionResult | null {
  if (memories.length < MIN_MEMORIES_FOR_TREND) return null
  const { early, recent } = splitByTime(memories)
  if (early.length < MIN_HALF_SIZE || recent.length < MIN_HALF_SIZE) return null

  const direction  = resolveDirection(early.length, recent.length)
  const confidence = trendConfidence(memories.length, direction)
  if (confidence === 'insufficient') return null

  const dirLabel = direction === 'stable' ? 'stable' : direction

  return makeTrend(
    'decision_velocity',
    `Decision rate is ${dirLabel}`,
    direction,
    `${early.length} decisions in the earlier window vs ${recent.length} in the recent window. Whether this reflects seasonal patterns or operational changes is not determinable from counts.`,
    [
      `Earlier window: ${early.length} decisions`,
      `Recent window: ${recent.length} decisions`,
    ],
    memories.slice(0, 3).map(m => m.id),
    confidence,
  )
}

// ── Override rate ─────────────────────────────────────────────────────────────

function detectOverrideRate(memories: AcademyMemory[]): TrendDetectionResult | null {
  if (memories.length < MIN_MEMORIES_FOR_TREND) return null
  const overrides = memories.filter(m => m.sourceType === 'director_override')
  if (overrides.length < 2) return null

  const { early: allEarly, recent: allRecent } = splitByTime(memories)
  const earlyOverrides  = allEarly.filter(m => m.sourceType === 'director_override').length
  const recentOverrides = allRecent.filter(m => m.sourceType === 'director_override').length

  const direction  = resolveDirection(earlyOverrides, recentOverrides)
  const confidence = trendConfidence(overrides.length, direction)
  if (confidence === 'insufficient') return null

  const dirLabel = direction === 'stable' ? 'stable' : direction

  return makeTrend(
    'override_rate',
    `Director override rate is ${dirLabel}`,
    direction,
    `${earlyOverrides} overrides in the earlier half vs ${recentOverrides} in the recent half. Override frequency does not imply correctness or incorrectness of the original proposals.`,
    [
      `Earlier window: ${earlyOverrides} overrides`,
      `Recent window: ${recentOverrides} overrides`,
      `Total: ${overrides.length}`,
    ],
    overrides.slice(0, 3).map(m => m.id),
    confidence,
  )
}

// ── Parent update cadence ─────────────────────────────────────────────────────

function detectParentUpdateCadence(memories: AcademyMemory[]): TrendDetectionResult | null {
  if (memories.length < MIN_MEMORIES_FOR_TREND) return null
  const parentUpdates = memories.filter(m => m.sourceType === 'parent_update')
  if (parentUpdates.length < 2) return null

  const { early: allEarly, recent: allRecent } = splitByTime(memories)
  const earlyUpdates  = allEarly.filter(m => m.sourceType === 'parent_update').length
  const recentUpdates = allRecent.filter(m => m.sourceType === 'parent_update').length

  const direction  = resolveDirection(earlyUpdates, recentUpdates)
  const confidence = trendConfidence(parentUpdates.length, direction)
  if (confidence === 'insufficient') return null

  const dirLabel = direction === 'stable' ? 'stable' : direction

  return makeTrend(
    'parent_update_cadence',
    `Parent communication cadence is ${dirLabel}`,
    direction,
    `${earlyUpdates} parent updates in the earlier window vs ${recentUpdates} in the recent window. Communication frequency alone does not indicate relationship quality.`,
    [
      `Earlier window: ${earlyUpdates} parent updates`,
      `Recent window: ${recentUpdates} parent updates`,
    ],
    parentUpdates.slice(0, 3).map(m => m.id),
    confidence,
  )
}

// ── Curriculum change rate ────────────────────────────────────────────────────

function detectCurriculumChangeRate(memories: AcademyMemory[]): TrendDetectionResult | null {
  if (memories.length < MIN_MEMORIES_FOR_TREND) return null
  const changes = memories.filter(m => m.sourceType === 'curriculum_change')
  if (changes.length < 2) return null

  const { early: allEarly, recent: allRecent } = splitByTime(memories)
  const earlyChanges  = allEarly.filter(m => m.sourceType === 'curriculum_change').length
  const recentChanges = allRecent.filter(m => m.sourceType === 'curriculum_change').length

  const direction  = resolveDirection(earlyChanges, recentChanges)
  const confidence = trendConfidence(changes.length, direction)
  if (confidence === 'insufficient') return null

  const dirLabel = direction === 'stable' ? 'stable' : direction

  return makeTrend(
    'curriculum_change_rate',
    `Curriculum change rate is ${dirLabel}`,
    direction,
    `${earlyChanges} curriculum changes in the earlier window vs ${recentChanges} in the recent window.`,
    [
      `Earlier window: ${earlyChanges} curriculum changes`,
      `Recent window: ${recentChanges} curriculum changes`,
    ],
    changes.slice(0, 3).map(m => m.id),
    confidence,
  )
}

// ── Promotion rate ────────────────────────────────────────────────────────────

function detectPromotionRate(memories: AcademyMemory[]): TrendDetectionResult | null {
  if (memories.length < MIN_MEMORIES_FOR_TREND) return null
  const promotions = memories.filter(m => m.sourceType === 'promotion_decision')
  if (promotions.length < 2) return null

  const { early: allEarly, recent: allRecent } = splitByTime(memories)
  const earlyPromos  = allEarly.filter(m => m.sourceType === 'promotion_decision').length
  const recentPromos = allRecent.filter(m => m.sourceType === 'promotion_decision').length

  const direction  = resolveDirection(earlyPromos, recentPromos)
  const confidence = trendConfidence(promotions.length, direction)
  if (confidence === 'insufficient') return null

  const dirLabel = direction === 'stable' ? 'stable' : direction

  return makeTrend(
    'promotion_rate',
    `Promotion rate is ${dirLabel}`,
    direction,
    `${earlyPromos} promotions in the earlier window vs ${recentPromos} in the recent window. Rate changes do not confirm the quality or correctness of promotion decisions.`,
    [
      `Earlier window: ${earlyPromos} promotions`,
      `Recent window: ${recentPromos} promotions`,
    ],
    promotions.slice(0, 3).map(m => m.id),
    confidence,
  )
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectTrends(memories: AcademyMemory[]): TrendDetectionResult[] {
  const results: TrendDetectionResult[] = []
  const push = (r: TrendDetectionResult | null) => { if (r) results.push(r) }

  push(detectDecisionVelocity(memories))
  push(detectOverrideRate(memories))
  push(detectParentUpdateCadence(memories))
  push(detectCurriculumChangeRate(memories))
  push(detectPromotionRate(memories))

  return results
}

// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Preference Extractor: builds a weighted, evidence-backed preference model
// from behavioral philosophy memory entries.
//
// Intelligence hierarchy position: Evidence layer (aggregates Memory-layer signals).
// Output: PreferenceSignal[] — each with score 0–100, confidence, direction.
//
// Score semantics:
//   50 = neutral / insufficient data
//   > 50 = positive preference (academy accepts this type of content)
//   < 50 = avoidance pattern (academy rejects / removes this type of content)
//
// V1: deterministic. Same input → same output. No LLM. No DB calls.

import type {
  PhilosophyMemoryEntry,
  PhilosophyPreferenceKey,
} from './academyPhilosophyMemory'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PreferenceDirection = 'rising' | 'falling' | 'stable' | 'unknown'

export interface PreferenceSignal {
  key:              PhilosophyPreferenceKey
  label:            string
  /** 0–100. 50 = neutral/unknown. >50 = preferred. <50 = avoided. */
  score:            number
  confidence:       'high' | 'medium' | 'low' | 'insufficient'
  evidenceCount:    number
  direction:        PreferenceDirection
  positiveSignals:  number
  negativeSignals:  number
  explanation:      string
  sourceDecisionIds: string[]
}

// ── Strength weights ──────────────────────────────────────────────────────────

const STRENGTH_WEIGHTS: Record<PhilosophyMemoryEntry['strength'], number> = {
  strong:   3,
  moderate: 2,
  weak:     1,
}

// ── Confidence calibration ────────────────────────────────────────────────────

function confidenceFromCount(n: number): PreferenceSignal['confidence'] {
  if (n >= 10) return 'high'
  if (n >= 5)  return 'medium'
  if (n >= 2)  return 'low'
  return 'insufficient'
}

// ── Score computation ─────────────────────────────────────────────────────────
//
// Weighted ratio: (weightedPos - weightedNeg) / (weightedPos + weightedNeg)
// Mapped to 0–100 range, centered at 50.

function computeScore(weightedPos: number, weightedNeg: number): number {
  const total = weightedPos + weightedNeg
  if (total === 0) return 50
  const ratio = (weightedPos - weightedNeg) / total
  return Math.max(0, Math.min(100, Math.round(50 + ratio * 50)))
}

// ── Trend direction ───────────────────────────────────────────────────────────
// Compare preference score in the most recent 90 days vs. older.

function computeDirection(
  recent: PhilosophyMemoryEntry[],
  older:  PhilosophyMemoryEntry[],
): PreferenceDirection {
  if (recent.length < 2) return 'unknown'

  let recentPos = 0; let recentNeg = 0
  for (const e of recent) {
    const w = STRENGTH_WEIGHTS[e.strength] ?? 1
    if (e.signal === 'positive') recentPos += w; else recentNeg += w
  }
  const recentScore = computeScore(recentPos, recentNeg)

  if (older.length === 0) return 'unknown'

  let olderPos = 0; let olderNeg = 0
  for (const e of older) {
    const w = STRENGTH_WEIGHTS[e.strength] ?? 1
    if (e.signal === 'positive') olderPos += w; else olderNeg += w
  }
  const olderScore = computeScore(olderPos, olderNeg)

  if (recentScore > olderScore + 6) return 'rising'
  if (recentScore < olderScore - 6) return 'falling'
  return 'stable'
}

// ── Main extractor ────────────────────────────────────────────────────────────

/**
 * Builds a weighted preference model from philosophy memory entries.
 * Returns signals sorted by distance from 50 (strongest signal first).
 */
export function extractAcademyPreferences(
  philosophyMemory: PhilosophyMemoryEntry[],
): PreferenceSignal[] {
  if (philosophyMemory.length === 0) return []

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Group entries by preference key
  const byKey: Record<string, PhilosophyMemoryEntry[]> = {}
  for (const entry of philosophyMemory) {
    if (!byKey[entry.preferenceKey]) byKey[entry.preferenceKey] = []
    byKey[entry.preferenceKey].push(entry)
  }

  const signals: PreferenceSignal[] = []

  for (const key of Object.keys(byKey) as PhilosophyPreferenceKey[]) {
    const entries = byKey[key]
    const recent  = entries.filter(e => e.learnedAt >= cutoff)
    const older   = entries.filter(e => e.learnedAt < cutoff)

    let weightedPos = 0; let weightedNeg = 0
    let rawPos = 0;      let rawNeg = 0

    for (const e of entries) {
      const w = STRENGTH_WEIGHTS[e.strength] ?? 1
      if (e.signal === 'positive') { weightedPos += w; rawPos++ }
      else                         { weightedNeg += w; rawNeg++ }
    }

    const score      = computeScore(weightedPos, weightedNeg)
    const confidence = confidenceFromCount(entries.length)
    const direction  = computeDirection(recent, older)
    const label      = entries[0].preferenceLabel

    let explanation: string
    if (confidence === 'insufficient') {
      explanation = `${label}: insufficient history to infer a clear preference (${entries.length} signal${entries.length !== 1 ? 's' : ''}).`
    } else if (score >= 70) {
      explanation = `${label}: strong positive pattern — ${rawPos} accepted, ${rawNeg} rejected.`
    } else if (score <= 30) {
      explanation = `${label}: avoidance pattern — ${rawNeg} rejected, ${rawPos} accepted.`
    } else {
      explanation = `${label}: mixed signals — ${rawPos} accepted, ${rawNeg} rejected.`
    }

    const sourceIds: string[] = []
    for (const e of entries) {
      if (e.relatedMemoryId) sourceIds.push(e.relatedMemoryId)
    }

    signals.push({
      key,
      label,
      score,
      confidence,
      evidenceCount:   entries.length,
      direction,
      positiveSignals: rawPos,
      negativeSignals: rawNeg,
      explanation,
      sourceDecisionIds: sourceIds,
    })
  }

  // Sort by signal strength (distance from neutral 50)
  return signals.sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
}

// ── Recommendation personalization ────────────────────────────────────────────

export interface PersonalizationResult {
  boostedRationale: string | null
  penaltyRationale: string | null
  /** Priority adjustment: -3 to +3. 0 = no change. */
  preferenceBoost:  number
}

const CONTENT_TO_PREFERENCE: Record<string, PhilosophyPreferenceKey> = {
  game:            'game_based_learning',
  tactical:        'tactical_focus',
  drill:           'technical_focus',
  skill:           'technical_focus',
  competition:     'competition_emphasis',
  assessment:      'assessment_rigor',
  fitness:         'fitness_emphasis',
  mental_skill:    'mental_performance',
  parent_guidance: 'parent_transparency',
  player_mission:  'player_autonomy',
}

/**
 * Adjusts a recommendation's priority and rationale based on the academy's preference model.
 * Called before surfacing any curriculum recommendation to the director.
 */
export function personalizeRecommendation(
  contentType:  string,
  preferences:  PreferenceSignal[],
): PersonalizationResult {
  const prefKey = CONTENT_TO_PREFERENCE[contentType]
  if (!prefKey) return { boostedRationale: null, penaltyRationale: null, preferenceBoost: 0 }

  const signal = preferences.find(p => p.key === prefKey)
  if (!signal || signal.confidence === 'insufficient') {
    return { boostedRationale: null, penaltyRationale: null, preferenceBoost: 0 }
  }

  if (signal.score >= 70) {
    const boost = signal.score >= 85 ? 3 : 2
    return {
      boostedRationale: `Your academy has accepted ${signal.positiveSignals} ${signal.label.toLowerCase()} items — strong historical alignment.`,
      penaltyRationale: null,
      preferenceBoost:  boost,
    }
  }

  if (signal.score <= 35) {
    const penalty = signal.score <= 20 ? -3 : -2
    return {
      boostedRationale: null,
      penaltyRationale: `Your academy has previously rejected ${signal.negativeSignals} ${signal.label.toLowerCase()} items.`,
      preferenceBoost:  penalty,
    }
  }

  return { boostedRationale: null, penaltyRationale: null, preferenceBoost: 0 }
}

// ── Preference summary helper ─────────────────────────────────────────────────

/** Returns the strongest signals above threshold (for display / DONNA narration). */
export function getTopPreferences(
  preferences:     PreferenceSignal[],
  minScore:        number = 65,
  maxResults:      number = 5,
): PreferenceSignal[] {
  return preferences
    .filter(p => p.score >= minScore && p.confidence !== 'insufficient')
    .slice(0, maxResults)
}

/** Returns the strongest avoidance patterns below threshold. */
export function getTopAvoidances(
  preferences:     PreferenceSignal[],
  maxScore:        number = 35,
  maxResults:      number = 3,
): PreferenceSignal[] {
  return preferences
    .filter(p => p.score <= maxScore && p.confidence !== 'insufficient')
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults)
}

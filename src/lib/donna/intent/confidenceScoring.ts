// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Shared confidence scoring utilities.
// Used by: donnaIntentEngine, donnaGoalEngine, donnaEntityResolver, donnaClarificationEngine.
//
// Confidence is always a number 0–1.
// 0.0 = no signal. 1.0 = definitive match.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same input → same output.
//   - Conservative: ambiguous inputs score lower, never inflated.

// ── Thresholds ────────────────────────────────────────────────────────────────

/** Minimum confidence to act without clarification. */
export const CONFIDENCE_ACT_THRESHOLD    = 0.72

/** Minimum confidence for a "likely" match — still show clarification. */
export const CONFIDENCE_LIKELY_THRESHOLD = 0.50

/** Below this: clarification required, no assumption made. */
export const CONFIDENCE_LOW_THRESHOLD    = 0.35

// ── Confidence levels ─────────────────────────────────────────────────────────

export type ConfidenceLevel = 'definitive' | 'high' | 'medium' | 'low' | 'none'

export function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.90) return 'definitive'
  if (score >= CONFIDENCE_ACT_THRESHOLD)    return 'high'
  if (score >= CONFIDENCE_LIKELY_THRESHOLD) return 'medium'
  if (score >= CONFIDENCE_LOW_THRESHOLD)    return 'low'
  return 'none'
}

export function isClarificationNeeded(score: number): boolean {
  return score < CONFIDENCE_ACT_THRESHOLD
}

export function shouldAct(score: number): boolean {
  return score >= CONFIDENCE_ACT_THRESHOLD
}

// ── Signal weights ────────────────────────────────────────────────────────────

export type SignalWeight = 'strong' | 'medium' | 'weak' | 'boost'

/** Map signal weight label to numeric contribution. */
export const SIGNAL_WEIGHT_VALUE: Record<SignalWeight, number> = {
  strong: 0.80,
  medium: 0.50,
  weak:   0.25,
  boost:  0.15,   // additive context bonus (page match, entity match, etc.)
}

// ── Signal match ──────────────────────────────────────────────────────────────

export interface WeightedSignal {
  signal: string
  weight: SignalWeight
}

export interface SignalMatchResult {
  matched: string[]
  rawScore: number      // sum of matched signal weights
  confidence: number    // normalised 0–1
  level: ConfidenceLevel
}

/**
 * Match a normalized input string against a weighted signal list.
 * rawScore is capped at 1.0 before normalization.
 * Each matched signal contributes its weight once (no double-counting).
 */
export function matchWeightedSignals(
  input: string,
  signals: WeightedSignal[],
  boostScore = 0,
): SignalMatchResult {
  const lower = input.toLowerCase().trim()
  const matched: string[] = []
  let rawScore = 0

  for (const { signal, weight } of signals) {
    if (lower.includes(signal) && !matched.includes(signal)) {
      matched.push(signal)
      rawScore += SIGNAL_WEIGHT_VALUE[weight]
    }
  }

  rawScore = Math.min(rawScore + boostScore, 1.0)
  const confidence = Math.round(rawScore * 100) / 100

  return {
    matched,
    rawScore,
    confidence,
    level: toConfidenceLevel(confidence),
  }
}

// ── Multi-candidate ranking ───────────────────────────────────────────────────

export interface ScoredCandidate<T> {
  candidate: T
  confidence: number
  matched: string[]
}

/**
 * Rank candidates by confidence descending.
 * Removes zero-confidence candidates.
 * Returns at most maxResults.
 */
export function rankCandidates<T>(
  candidates: ScoredCandidate<T>[],
  maxResults = 5,
): ScoredCandidate<T>[] {
  return candidates
    .filter(c => c.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxResults)
}

// ── Confidence explanation ────────────────────────────────────────────────────

export function buildReasoning(
  topLabel: string,
  matched: string[],
  confidence: number,
  entity: string | null,
): string {
  const levelLabel = toConfidenceLevel(confidence)
  const signalNote = matched.length > 0
    ? `Matched: ${matched.slice(0, 3).join(', ')}.`
    : 'No strong signals found.'
  const entityNote = entity ? ` Extracted entity: "${entity}".` : ''
  return `${levelLabel} confidence (${Math.round(confidence * 100)}%) for ${topLabel}. ${signalNote}${entityNote}`
}

// ── Confidence blending ───────────────────────────────────────────────────────

/**
 * Blend two confidence scores with given weights.
 * Useful when combining intent confidence + entity confidence for goal confidence.
 */
export function blendConfidence(
  scoreA: number,
  weightA: number,
  scoreB: number,
  weightB: number,
): number {
  const total = weightA + weightB
  if (total === 0) return 0
  return Math.round(((scoreA * weightA + scoreB * weightB) / total) * 100) / 100
}

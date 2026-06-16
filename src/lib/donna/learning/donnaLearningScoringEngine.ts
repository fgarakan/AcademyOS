// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 3 — Learning Scoring Engine
//
// Computes a 0–100 composite score for each LearningEntry.
// Score determines: review priority, promotion eligibility, and significance ranking.
//
// Score factors:
//   confidence        30% — how confident was DONNA's interpretation?
//   source_reliability 25% — how reliable is this learning source?
//   importance        20% — estimated impact on academy intelligence
//   evidence_quality  15% — richness of the supporting evidence
//   frequency         10% — how many times has this been observed?
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same inputs → same score.
//   - Score drives review queue ordering and promotion gate.

import type { LearningEntry } from './learningEntryModel'
import { SCORE_THRESHOLDS } from './learningEntryModel'

// ── Score weights ─────────────────────────────────────────────────────────────

const WEIGHTS = {
  confidence:          0.30,
  sourceReliability:   0.25,
  importance:          0.20,
  evidenceQuality:     0.15,
  frequency:           0.10,
} as const

// ── Evidence quality scorer ───────────────────────────────────────────────────

function scoreEvidenceQuality(evidence: string, examplePhrases: string[]): number {
  if (!evidence || evidence.trim().length === 0) return 0

  let score = 0.30  // base for having any evidence

  // Length signals richness
  const wordCount = evidence.trim().split(/\s+/).length
  if (wordCount >= 20) score += 0.30
  else if (wordCount >= 10) score += 0.20
  else if (wordCount >= 5)  score += 0.10

  // Multiple example phrases signal repeated observation
  if (examplePhrases.length >= 3) score += 0.25
  else if (examplePhrases.length === 2) score += 0.15
  else if (examplePhrases.length === 1) score += 0.10

  // Specific language signals (numbers, proper nouns, technical terms)
  const hasNumbers = /\d/.test(evidence)
  const hasSpecificTerms = /\b(orange|red|green|yellow|level|drill|footwork|backhand|forehand|serve|volley|tournament|assessment)\b/i.test(evidence)
  if (hasNumbers || hasSpecificTerms) score += 0.15

  return Math.min(score, 1.0)
}

// ── Frequency normalizer ──────────────────────────────────────────────────────

function normalizeFrequency(frequency: number): number {
  // Diminishing returns: 1 → 0.20, 3 → 0.50, 5 → 0.70, 10+ → 1.0
  if (frequency <= 0) return 0
  if (frequency >= 10) return 1.0
  return Math.min(frequency / 10 + Math.log(frequency) * 0.15, 1.0)
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export interface LearningScoreResult {
  totalScore: number                  // 0–100
  breakdown: {
    confidence: number                // 0–100 contribution
    sourceReliability: number
    importance: number
    evidenceQuality: number
    frequency: number
  }
  label: 'critical' | 'high' | 'medium' | 'low'
  promotionEligible: boolean
  reviewPriority: 'immediate' | 'standard' | 'low'
}

export function scoreLearningEntry(entry: Pick<LearningEntry,
  'confidence' | 'sourceReliability' | 'importance' | 'frequency' | 'evidence' | 'examplePhrases'
>): LearningScoreResult {
  const evidenceScore = scoreEvidenceQuality(entry.evidence, entry.examplePhrases)
  const freqScore = normalizeFrequency(entry.frequency)

  const raw =
    entry.confidence        * WEIGHTS.confidence +
    entry.sourceReliability * WEIGHTS.sourceReliability +
    entry.importance        * WEIGHTS.importance +
    evidenceScore           * WEIGHTS.evidenceQuality +
    freqScore               * WEIGHTS.frequency

  const totalScore = Math.round(Math.min(raw * 100, 100))

  const breakdown = {
    confidence:        Math.round(entry.confidence        * WEIGHTS.confidence        * 100),
    sourceReliability: Math.round(entry.sourceReliability * WEIGHTS.sourceReliability * 100),
    importance:        Math.round(entry.importance        * WEIGHTS.importance        * 100),
    evidenceQuality:   Math.round(evidenceScore           * WEIGHTS.evidenceQuality   * 100),
    frequency:         Math.round(freqScore               * WEIGHTS.frequency         * 100),
  }

  const label: LearningScoreResult['label'] =
    totalScore >= 80 ? 'critical'
    : totalScore >= 60 ? 'high'
    : totalScore >= 40 ? 'medium'
    : 'low'

  const promotionEligible = totalScore >= SCORE_THRESHOLDS.promotionMinScore

  const reviewPriority: LearningScoreResult['reviewPriority'] =
    totalScore >= SCORE_THRESHOLDS.reviewPriority ? 'immediate'
    : totalScore >= 40 ? 'standard'
    : 'low'

  return { totalScore, breakdown, label, promotionEligible, reviewPriority }
}

/**
 * Apply scoring to a LearningEntry in place. Returns the updated entry.
 */
export function applyScoreToEntry(entry: LearningEntry): LearningEntry {
  const result = scoreLearningEntry(entry)
  return {
    ...entry,
    learningScore: result.totalScore,
    promotionEligible: result.promotionEligible,
  }
}

/**
 * Sort entries by score descending.
 */
export function rankByScore(entries: LearningEntry[]): LearningEntry[] {
  return [...entries].sort((a, b) => b.learningScore - a.learningScore)
}

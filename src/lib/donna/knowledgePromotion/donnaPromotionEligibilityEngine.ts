// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 3 — Promotion Eligibility Engine
//
// Determines whether a LearningEntry is ready to become a promotion candidate.
// Eligibility is strict: only well-evidenced, approved, non-duplicate entries
// with clear contradiction status may proceed.
//
// Eligibility does NOT mean automatic promotion — a human always approves.
// This engine only says "this is ready to be reviewed for promotion."
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - All gates are documented — no silent rejections.
//   - Caller supplies contradiction context from DonnaLearningContradictionDetector.

import type { LearningEntry } from '../learning/learningEntryModel'
import { SCORE_THRESHOLDS } from '../learning/learningEntryModel'
import type { ContradictionReport } from '../learning/donnaLearningContradictionDetector'

// ── Eligibility result ────────────────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean
  entryId: string
  score: number
  gates: EligibilityGate[]
  blockedReasons: string[]
  passedCount: number
  failedCount: number
  summary: string
}

export interface EligibilityGate {
  name: string
  passed: boolean
  reason: string
  value: string | number | boolean
}

// ── Gate thresholds ───────────────────────────────────────────────────────────

const ELIGIBILITY_THRESHOLDS = {
  minLearningScore:    SCORE_THRESHOLDS.promotionMinScore,   // 70
  minSourceReliability: 0.60,                                // coach_observation base
  minFrequency:        1,                                    // at least one observation
} as const

// ── Gates ─────────────────────────────────────────────────────────────────────

function checkStatus(entry: LearningEntry): EligibilityGate {
  const passed = entry.status === 'approved' || entry.status === 'promoted'
  return {
    name: 'status',
    passed,
    reason: passed
      ? 'Entry is approved or promoted'
      : `Entry status is "${entry.status}" — must be approved first`,
    value: entry.status,
  }
}

function checkScore(entry: LearningEntry): EligibilityGate {
  const passed = entry.learningScore >= ELIGIBILITY_THRESHOLDS.minLearningScore
  return {
    name: 'learning_score',
    passed,
    reason: passed
      ? `Learning score ${entry.learningScore} ≥ ${ELIGIBILITY_THRESHOLDS.minLearningScore}`
      : `Learning score ${entry.learningScore} < ${ELIGIBILITY_THRESHOLDS.minLearningScore}`,
    value: entry.learningScore,
  }
}

function checkNotDuplicate(entry: LearningEntry): EligibilityGate {
  const passed = !entry.isDuplicate
  return {
    name: 'not_duplicate',
    passed,
    reason: passed
      ? 'Entry is not flagged as a duplicate'
      : `Entry is a duplicate of ${entry.canonicalEntryId ?? 'unknown'} — use canonical instead`,
    value: entry.isDuplicate,
  }
}

function checkSourceReliability(entry: LearningEntry): EligibilityGate {
  const passed = entry.sourceReliability >= ELIGIBILITY_THRESHOLDS.minSourceReliability
  return {
    name: 'source_reliability',
    passed,
    reason: passed
      ? `Source reliability ${entry.sourceReliability} ≥ ${ELIGIBILITY_THRESHOLDS.minSourceReliability}`
      : `Source reliability ${entry.sourceReliability} < ${ELIGIBILITY_THRESHOLDS.minSourceReliability} — source too unreliable`,
    value: entry.sourceReliability,
  }
}

function checkFrequency(entry: LearningEntry): EligibilityGate {
  const passed = entry.frequency >= ELIGIBILITY_THRESHOLDS.minFrequency
  return {
    name: 'frequency',
    passed,
    reason: passed
      ? `Frequency ${entry.frequency} ≥ ${ELIGIBILITY_THRESHOLDS.minFrequency}`
      : `Frequency ${entry.frequency} — must be observed at least once`,
    value: entry.frequency,
  }
}

function checkEvidence(entry: LearningEntry): EligibilityGate {
  const hasEvidence = entry.evidence.trim().length >= 10
  return {
    name: 'has_evidence',
    passed: hasEvidence,
    reason: hasEvidence
      ? 'Entry has supporting evidence'
      : 'Evidence is missing or too short — cannot promote without evidence',
    value: entry.evidence.length,
  }
}

function checkHasSummary(entry: LearningEntry): EligibilityGate {
  const hasSummary = entry.summary.trim().length >= 15
  return {
    name: 'has_summary',
    passed: hasSummary,
    reason: hasSummary
      ? 'Entry has a clear summary'
      : 'Summary is missing or too short — knowledge body cannot be drafted',
    value: entry.summary.length,
  }
}

function checkNoUnresolvedContradiction(
  entry: LearningEntry,
  contradictionReport: ContradictionReport | null,
): EligibilityGate {
  const unresolvedContradict = contradictionReport?.pairs.some(
    p => (p.entryIdA === entry.id || p.entryIdB === entry.id)
      && p.resolution === 'needs_director_review',
  ) ?? false

  return {
    name: 'no_unresolved_contradiction',
    passed: !unresolvedContradict,
    reason: unresolvedContradict
      ? 'Entry has an unresolved contradiction — director must resolve before promotion'
      : 'No unresolved contradictions',
    value: !unresolvedContradict,
  }
}

function checkHasConcepts(entry: LearningEntry): EligibilityGate {
  const hasConcepts = entry.concepts.length >= 1
  return {
    name: 'has_concepts',
    passed: hasConcepts,
    reason: hasConcepts
      ? `Tagged with ${entry.concepts.length} concept(s)`
      : 'No AcademyOS concepts tagged — cannot route to correct knowledge domain',
    value: entry.concepts.length,
  }
}

// ── Main eligibility check ────────────────────────────────────────────────────

/**
 * Check whether a LearningEntry is eligible to become a promotion candidate.
 * Pass the contradiction report from a recent `scanForContradictions()` call.
 */
export function checkPromotionEligibility(
  entry: LearningEntry,
  contradictionReport: ContradictionReport | null = null,
): EligibilityResult {
  const gates: EligibilityGate[] = [
    checkStatus(entry),
    checkScore(entry),
    checkNotDuplicate(entry),
    checkSourceReliability(entry),
    checkFrequency(entry),
    checkEvidence(entry),
    checkHasSummary(entry),
    checkHasConcepts(entry),
    checkNoUnresolvedContradiction(entry, contradictionReport),
  ]

  const passed = gates.filter(g => g.passed)
  const failed = gates.filter(g => !g.passed)
  const eligible = failed.length === 0

  const summary = eligible
    ? `Eligible for promotion (${passed.length}/${gates.length} gates passed)`
    : `Not eligible: ${failed.length} gate(s) failed — ${failed.map(g => g.name).join(', ')}`

  return {
    eligible,
    entryId: entry.id,
    score: entry.learningScore,
    gates,
    blockedReasons: failed.map(g => g.reason),
    passedCount: passed.length,
    failedCount: failed.length,
    summary,
  }
}

/**
 * Batch-check eligibility across all entries in the ledger.
 * Returns only the eligible entries, sorted by learningScore DESC.
 */
export function findEligibleEntries(
  entries: LearningEntry[],
  contradictionReport: ContradictionReport | null = null,
): Array<{ entry: LearningEntry; result: EligibilityResult }> {
  return entries
    .map(entry => ({ entry, result: checkPromotionEligibility(entry, contradictionReport) }))
    .filter(({ result }) => result.eligible)
    .sort((a, b) => b.entry.learningScore - a.entry.learningScore)
}

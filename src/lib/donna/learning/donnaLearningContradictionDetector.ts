// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 12 — Contradiction Detector
//
// Detects when a new learning directly contradicts an existing approved learning.
// Contradictions are surfaced in the review queue for director resolution.
//
// A contradiction exists when:
//   1. Two entries share ≥ 1 AcademyOS concept AND the same topic domain, AND
//   2. Their summaries contain contradicting sentiment markers (positive vs negative)
//      OR their key phrases have high overlap but opposite framing.
//
// Examples:
//   Approved: "Red 3 players are advanced enough for tournament play"
//   New:      "Red 3 players are not ready for competitive matches"
//   → Contradiction: both are about competitive_readiness, same group
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: only flag clear contradictions; ignore ambiguous cases.
//   - Returns a ContradictionReport; caller must update ledger state.

import type { LearningEntry } from './learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'

// ── Contradiction types ───────────────────────────────────────────────────────

export interface ContradictionPair {
  entryIdA: string         // existing approved entry
  entryIdB: string         // new or conflicting entry
  sharedConcepts: AcademyOSConcept[]
  contradictionScore: number    // 0–1 confidence that this is a real contradiction
  reason: string
  resolution: 'needs_director_review' | 'new_overrides_old' | 'old_overrides_new'
  resolutionReason: string
}

export interface ContradictionReport {
  pairs: ContradictionPair[]
  totalFound: number
  requiresReview: boolean
  summary: string
}

// ── Sentiment markers ─────────────────────────────────────────────────────────
// Simple keyword-based sentiment: true = positive, false = negative

const POSITIVE_MARKERS = [
  'ready', 'improving', 'excellent', 'strong', 'good', 'consistent',
  'advanced', 'motivated', 'engaged', 'performing', 'qualified',
  'capable', 'achieving', 'succeeding', 'thriving',
]

const NEGATIVE_MARKERS = [
  'not ready', 'struggling', 'poor', 'weak', 'inconsistent', 'behind',
  "isn't", "isn't", 'failing', 'disengaged', 'unmotivated', 'unable',
  'not performing', 'not qualified', 'not capable', "can't", "cannot",
  'lacking', 'below', 'too young',
]

function classifySentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase()
  const posCount = POSITIVE_MARKERS.filter(m => lower.includes(m)).length
  const negCount = NEGATIVE_MARKERS.filter(m => lower.includes(m)).length
  if (posCount > negCount) return 'positive'
  if (negCount > posCount) return 'negative'
  return 'neutral'
}

function sharedConcepts(a: AcademyOSConcept[], b: AcademyOSConcept[]): AcademyOSConcept[] {
  return a.filter(c => b.includes(c))
}

function topicOverlap(a: string, b: string): boolean {
  const tokA = a.toLowerCase().split(/\s+/)
  const tokB = new Set(b.toLowerCase().split(/\s+/))
  return tokA.filter(w => w.length >= 4 && tokB.has(w)).length >= 2
}

// ── Contradiction check ───────────────────────────────────────────────────────

function checkPair(a: LearningEntry, b: LearningEntry): ContradictionPair | null {
  if (a.id === b.id) return null

  const concepts = sharedConcepts(a.concepts, b.concepts)
  if (concepts.length === 0) return null

  if (a.topicDomain !== b.topicDomain) return null

  const sentA = classifySentiment(a.summary)
  const sentB = classifySentiment(b.summary)

  const isOppositeSentiment = (
    (sentA === 'positive' && sentB === 'negative') ||
    (sentA === 'negative' && sentB === 'positive')
  )

  const topicSimilar = topicOverlap(a.topic, b.topic) || a.topic.toLowerCase() === b.topic.toLowerCase()

  if (!isOppositeSentiment || !topicSimilar) return null

  const contradictionScore = Math.min(
    0.50 + concepts.length * 0.15 + (topicSimilar ? 0.10 : 0),
    1.0,
  )

  // Higher-score entry wins; tie goes to older entry
  let resolution: ContradictionPair['resolution'] = 'needs_director_review'
  let resolutionReason = 'Scores are similar — director must decide'

  const scoreDiff = Math.abs(a.learningScore - b.learningScore)
  if (scoreDiff >= 20) {
    const winner = a.learningScore >= b.learningScore ? a : b
    resolution = winner.id === b.id ? 'new_overrides_old' : 'old_overrides_new'
    resolutionReason = `Entry "${winner.id}" has significantly higher score (${winner.learningScore})`
  } else if (a.sourceType === 'brian_direct' && b.sourceType !== 'brian_direct') {
    resolution = 'old_overrides_new'
    resolutionReason = 'Brian-direct learning takes precedence'
  } else if (b.sourceType === 'brian_direct' && a.sourceType !== 'brian_direct') {
    resolution = 'new_overrides_old'
    resolutionReason = 'Brian-direct learning takes precedence'
  }

  return {
    entryIdA: a.id,
    entryIdB: b.id,
    sharedConcepts: concepts,
    contradictionScore: Math.round(contradictionScore * 100) / 100,
    reason: `Opposite sentiment on shared concepts: ${concepts.join(', ')}`,
    resolution,
    resolutionReason,
  }
}

// ── Main detector ─────────────────────────────────────────────────────────────

/**
 * Detect contradictions between a new entry and existing approved entries.
 */
export function detectContradictions(
  newEntry: LearningEntry,
  existingApproved: LearningEntry[],
): ContradictionReport {
  const pairs: ContradictionPair[] = []

  for (const existing of existingApproved) {
    if (existing.id === newEntry.id) continue
    const pair = checkPair(existing, newEntry)
    if (pair) pairs.push(pair)
  }

  pairs.sort((a, b) => b.contradictionScore - a.contradictionScore)

  const requiresReview = pairs.some(p => p.resolution === 'needs_director_review')

  const summary = pairs.length === 0
    ? 'No contradictions detected.'
    : `${pairs.length} contradiction${pairs.length === 1 ? '' : 's'} detected${requiresReview ? ' — director review required' : ''}.`

  return {
    pairs,
    totalFound: pairs.length,
    requiresReview,
    summary,
  }
}

/**
 * Run full contradiction scan across all entries in the ledger.
 * Returns all detected contradictions among approved entries.
 */
export function scanForContradictions(entries: LearningEntry[]): ContradictionReport {
  const approved = entries.filter(e => e.status === 'approved' || e.status === 'promoted')
  const allPairs: ContradictionPair[] = []
  const seen = new Set<string>()

  for (let i = 0; i < approved.length; i++) {
    for (let j = i + 1; j < approved.length; j++) {
      const a = approved[i]
      const b = approved[j]
      const pairKey = [a.id, b.id].sort().join('|')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)
      const pair = checkPair(a, b)
      if (pair) allPairs.push(pair)
    }
  }

  allPairs.sort((a, b) => b.contradictionScore - a.contradictionScore)
  const requiresReview = allPairs.some(p => p.resolution === 'needs_director_review')

  return {
    pairs: allPairs,
    totalFound: allPairs.length,
    requiresReview,
    summary: allPairs.length === 0
      ? 'No contradictions detected across approved learnings.'
      : `${allPairs.length} contradiction${allPairs.length === 1 ? '' : 's'} found${requiresReview ? ' — director review required' : ''}.`,
  }
}

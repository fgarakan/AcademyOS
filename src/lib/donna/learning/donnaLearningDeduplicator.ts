// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 5 — Learning Deduplicator
//
// Prevents the same learning from being captured multiple times.
// A "duplicate" is a new entry that is semantically equivalent to an existing
// approved or promoted entry — same concept + same conclusion.
//
// Deduplication does NOT delete entries. Instead:
//   - The new entry is flagged as isDuplicate = true
//   - The canonicalEntryId points to the existing entry
//   - The existing entry's frequency is incremented
//   - The duplicate is moved to 'archived' status
//
// This preserves audit history while preventing noise in the review queue.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.

import type { LearningEntry } from './learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'

// ── Similarity threshold ──────────────────────────────────────────────────────

// Two entries are duplicates if their combined similarity score >= this value
const DUPLICATE_THRESHOLD = 0.75

// ── Helpers ───────────────────────────────────────────────────────────────────

function conceptSimilarity(a: AcademyOSConcept[], b: AcademyOSConcept[]): number {
  if (a.length === 0 && b.length === 0) return 1.0
  if (a.length === 0 || b.length === 0) return 0.0
  const overlap = a.filter(c => b.includes(c)).length
  const union = new Set([...a, ...b]).size
  return overlap / union
}

function topicSimilarity(a: string, b: string): number {
  if (a.toLowerCase() === b.toLowerCase()) return 1.0
  const wordsA = a.toLowerCase().split(/\s+/)
  const wordsB = b.toLowerCase().split(/\s+/)
  const overlap = wordsA.filter(w => wordsB.includes(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union > 0 ? overlap / union : 0
}

function summarySimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const arrA = a.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 4)
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 4))
  if (arrA.length === 0 || wordsB.size === 0) return 0
  const wordsA = new Set(arrA)
  const overlap = Array.from(wordsA).filter(w => wordsB.has(w)).length
  return overlap / Math.max(wordsA.size, wordsB.size)
}

function combinedSimilarity(a: LearningEntry, b: LearningEntry): number {
  const conceptScore  = conceptSimilarity(a.concepts, b.concepts)  * 0.45
  const topicScore    = topicSimilarity(a.topic, b.topic)           * 0.30
  const summaryScore  = summarySimilarity(a.summary, b.summary)     * 0.25
  return conceptScore + topicScore + summaryScore
}

// ── Deduplication result ──────────────────────────────────────────────────────

export interface DeduplicationResult {
  isDuplicate: boolean
  canonicalEntryId: string | null
  similarityScore: number
  reason: string | null
}

// ── Main deduplicator ─────────────────────────────────────────────────────────

/**
 * Check if `candidate` is a duplicate of any entry in `existingEntries`.
 * Only compares against entries with status 'approved' or 'promoted'.
 *
 * Returns a DeduplicationResult. Caller is responsible for updating
 * the ledger (markDuplicate + frequency increment) if isDuplicate is true.
 */
export function checkForDuplicate(
  candidate: LearningEntry,
  existingEntries: LearningEntry[],
): DeduplicationResult {
  const candidates = existingEntries.filter(
    e => (e.status === 'approved' || e.status === 'promoted')
      && e.id !== candidate.id
      && e.academyId === candidate.academyId,
  )

  let bestMatch: LearningEntry | null = null
  let bestScore = 0

  for (const existing of candidates) {
    const score = combinedSimilarity(candidate, existing)
    if (score > bestScore) {
      bestScore = score
      bestMatch = existing
    }
  }

  if (bestScore >= DUPLICATE_THRESHOLD && bestMatch) {
    return {
      isDuplicate: true,
      canonicalEntryId: bestMatch.id,
      similarityScore: Math.round(bestScore * 100) / 100,
      reason: `Matches "${bestMatch.topic}" (score ${Math.round(bestScore * 100)}%)`,
    }
  }

  return {
    isDuplicate: false,
    canonicalEntryId: null,
    similarityScore: Math.round(bestScore * 100) / 100,
    reason: null,
  }
}

/**
 * Run deduplication across an entire batch of entries.
 * Entries earlier in the array are preferred as canonical.
 * Returns a list of DedupActions to apply to the Ledger.
 */
export interface DedupAction {
  duplicateId: string
  canonicalId: string
  similarityScore: number
}

export function deduplicateBatch(entries: LearningEntry[]): DedupAction[] {
  const actions: DedupAction[] = []
  const canonical: LearningEntry[] = []

  for (const entry of entries) {
    const result = checkForDuplicate(entry, canonical)
    if (result.isDuplicate && result.canonicalEntryId) {
      actions.push({
        duplicateId: entry.id,
        canonicalId: result.canonicalEntryId,
        similarityScore: result.similarityScore,
      })
    } else {
      canonical.push(entry)
    }
  }

  return actions
}

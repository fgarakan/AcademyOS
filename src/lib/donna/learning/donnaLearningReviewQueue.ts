// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 9 — Learning Review Queue
//
// Surfaces the most important learning entries for director review.
// Entries enter the queue when: status='reviewing' OR status='captured' with score >= 60.
//
// Ordering priorities:
//   1. High-score entries first (score DESC)
//   2. Oldest unreviewed entries (age DESC — been waiting longest)
//   3. brian_direct source always floated to top
//   4. Duplicate entries excluded from queue
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Queue is rebuilt on demand from ledger entries — not persisted separately.
//   - Caller controls page size and filtering.

import type { LearningEntry, LearningStatus } from './learningEntryModel'
import { SCORE_THRESHOLDS } from './learningEntryModel'

// ── Queue item ────────────────────────────────────────────────────────────────

export interface ReviewQueueItem {
  entry: LearningEntry
  priority: 'immediate' | 'standard' | 'low'
  ageMs: number
  ageDays: number
  reason: string              // why this appeared in the queue
  isHighScore: boolean
  isOwnerSource: boolean
}

export interface ReviewQueue {
  items: ReviewQueueItem[]
  totalCount: number
  immediateCount: number
  standardCount: number
  lowCount: number
  oldestEntryDays: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const QUEUE_ELIGIBLE_STATUSES: LearningStatus[] = ['captured', 'reviewing']

function isQueueEligible(entry: LearningEntry): boolean {
  if (entry.isDuplicate) return false
  if (!QUEUE_ELIGIBLE_STATUSES.includes(entry.status)) return false
  // Include: 'reviewing' always, 'captured' only if score >= threshold
  if (entry.status === 'captured' && entry.learningScore < SCORE_THRESHOLDS.reviewPriority) return false
  return true
}

function derivePriority(entry: LearningEntry, ageMs: number): ReviewQueueItem['priority'] {
  if (entry.sourceType === 'brian_direct') return 'immediate'
  if (entry.learningScore >= SCORE_THRESHOLDS.reviewPriority) return 'immediate'
  if (ageMs > 3 * 24 * 60 * 60 * 1000) return 'standard'  // older than 3 days
  if (entry.learningScore >= 40) return 'standard'
  return 'low'
}

function deriveReason(entry: LearningEntry, priority: ReviewQueueItem['priority']): string {
  if (entry.sourceType === 'brian_direct') return 'Brian taught DONNA directly'
  if (priority === 'immediate' && entry.learningScore >= SCORE_THRESHOLDS.reviewPriority) {
    return `High learning score (${entry.learningScore})`
  }
  if (entry.status === 'reviewing') return 'Moved to review queue'
  return 'Awaiting director review'
}

// ── Main queue builder ────────────────────────────────────────────────────────

/**
 * Build the director review queue from a set of ledger entries.
 * Pass all ledger entries — filtering is handled internally.
 */
export function buildReviewQueue(
  entries: LearningEntry[],
  options: {
    maxItems?: number
    academyId?: string
  } = {},
): ReviewQueue {
  const now = Date.now()
  const { maxItems = 50, academyId } = options

  const filtered = entries
    .filter(e => !academyId || e.academyId === academyId)
    .filter(isQueueEligible)

  const items: ReviewQueueItem[] = filtered.map(entry => {
    const ageMs = now - new Date(entry.createdAt).getTime()
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
    const priority = derivePriority(entry, ageMs)
    const reason = deriveReason(entry, priority)

    return {
      entry,
      priority,
      ageMs,
      ageDays,
      reason,
      isHighScore: entry.learningScore >= SCORE_THRESHOLDS.reviewPriority,
      isOwnerSource: entry.sourceType === 'brian_direct',
    }
  })

  // Sort: brian_direct first, then by priority rank, then score DESC, then age DESC
  const PRIORITY_RANK: Record<ReviewQueueItem['priority'], number> = {
    immediate: 0,
    standard: 1,
    low: 2,
  }

  items.sort((a, b) => {
    if (a.isOwnerSource !== b.isOwnerSource) return a.isOwnerSource ? -1 : 1
    const prioCompare = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (prioCompare !== 0) return prioCompare
    const scoreCompare = b.entry.learningScore - a.entry.learningScore
    if (scoreCompare !== 0) return scoreCompare
    return b.ageMs - a.ageMs
  })

  const limited = items.slice(0, maxItems)

  return {
    items: limited,
    totalCount: limited.length,
    immediateCount: limited.filter(i => i.priority === 'immediate').length,
    standardCount: limited.filter(i => i.priority === 'standard').length,
    lowCount: limited.filter(i => i.priority === 'low').length,
    oldestEntryDays: limited.reduce((max, i) => Math.max(max, i.ageDays), 0),
  }
}

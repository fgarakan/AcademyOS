// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 6 — Learning Timeline
//
// Tracks the lifecycle of a LearningEntry from capture to promotion.
// Provides a human-readable audit trail for the Director review UI.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Reads from the Ledger's audit log — does not maintain its own state.
//   - All timeline events are derived deterministically from audit entries.

import type { LedgerAuditEntry } from './donnaLearningLedger'

// ── Timeline event ────────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'captured'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'promoted'
  | 'archived'
  | 'clustered'
  | 'merged'
  | 'score_updated'
  | 'review_opened'

export interface TimelineEvent {
  type: TimelineEventType
  at: string                // ISO timestamp
  performedBy: string
  label: string             // human-readable
  detail: string | null
  isTerminal: boolean
}

export interface LearningTimeline {
  entryId: string
  events: TimelineEvent[]
  currentStatus: string
  ageMs: number             // milliseconds since capture
  totalEvents: number
  isComplete: boolean       // true if terminal state reached
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  added:          'Learning captured',
  status_changed: 'Status changed',
  score_updated:  'Score recalculated',
  clustered:      'Assigned to cluster',
  merged:         'Marked as duplicate',
}

function deriveType(audit: LedgerAuditEntry): TimelineEventType {
  if (audit.action === 'added') return 'captured'
  if (audit.action === 'clustered') return 'clustered'
  if (audit.action === 'merged') return 'merged'
  if (audit.action === 'score_updated') return 'score_updated'
  if (audit.action === 'status_changed') {
    switch (audit.to) {
      case 'reviewing':  return 'reviewed'
      case 'approved':   return 'approved'
      case 'rejected':   return 'rejected'
      case 'promoted':   return 'promoted'
      case 'archived':   return 'archived'
      default:           return 'review_opened'
    }
  }
  return 'review_opened'
}

function buildLabel(audit: LedgerAuditEntry, type: TimelineEventType): string {
  const base = EVENT_LABELS[audit.action] ?? audit.action
  if (type === 'approved') return `Approved by ${audit.performedBy}`
  if (type === 'rejected') return `Rejected by ${audit.performedBy}`
  if (type === 'promoted') return `Promoted to Academy Knowledge`
  if (type === 'archived') return `Archived`
  if (type === 'clustered') return `Grouped into cluster ${audit.to}`
  if (type === 'merged')    return `Merged — duplicate of ${audit.to}`
  return base
}

const TERMINAL_TYPES = new Set<TimelineEventType>(['promoted', 'archived', 'rejected'])

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a LearningTimeline from the audit log entries for a given learning entry.
 */
export function buildLearningTimeline(
  entryId: string,
  auditEntries: LedgerAuditEntry[],
): LearningTimeline {
  const sorted = [...auditEntries].sort((a, b) => a.at.localeCompare(b.at))

  const events: TimelineEvent[] = sorted.map(audit => {
    const type = deriveType(audit)
    return {
      type,
      at: audit.at,
      performedBy: audit.performedBy,
      label: buildLabel(audit, type),
      detail: audit.reason ?? null,
      isTerminal: TERMINAL_TYPES.has(type),
    }
  })

  const captureEvent = events.find(e => e.type === 'captured')
  const latestEvent = events[events.length - 1]
  const currentStatus = latestEvent?.type ?? 'captured'
  const isComplete = events.some(e => e.isTerminal)

  const captureTime = captureEvent ? new Date(captureEvent.at).getTime() : Date.now()
  const ageMs = Date.now() - captureTime

  return {
    entryId,
    events,
    currentStatus,
    ageMs,
    totalEvents: events.length,
    isComplete,
  }
}

/**
 * Human-readable age string for UI display.
 */
export function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

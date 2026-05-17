// Sprint 558 — Review Queue COO Signal Integration V1
// Metadata layer adding COO signal context to review queue items.
// Pure TypeScript — no DB writes, no execution.

import type { NBACategory } from './donnaNBAEngine'
import type { DONNAConfidence } from './donnaCOOAnswerEngine'

// ── Signal metadata ───────────────────────────────────────────────────────────

export interface ReviewQueueCOOSignal {
  source: NBACategory
  sourceLabel: string
  linkedKPI: string
  priorityReason: string
  confidence: DONNAConfidence
  urgency: 'high' | 'medium' | 'low'
}

// ── Source labels ─────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<NBACategory, string> = {
  review_queue:   'Review queue',
  coach_wrap_up:  'Coach wrap-up',
  attendance:     'Attendance',
  parent_update:  'Parent updates',
  level_readiness: 'Level readiness',
  academy_health: 'Academy health',
}

// ── KPI labels ────────────────────────────────────────────────────────────────

const KPI_LABELS: Record<NBACategory, string> = {
  review_queue:    'Director review completeness',
  coach_wrap_up:   'Coach wrap-up coverage',
  attendance:      'Player attendance rate',
  parent_update:   'Parent communication',
  level_readiness: 'Player development progression',
  academy_health:  'Overall academy health score',
}

// ── Signal builder ────────────────────────────────────────────────────────────

export function buildCOOSignal(
  source: NBACategory,
  priorityReason: string,
  confidence: DONNAConfidence,
  urgency: 'high' | 'medium' | 'low',
): ReviewQueueCOOSignal {
  return {
    source,
    sourceLabel: SOURCE_LABELS[source],
    linkedKPI: KPI_LABELS[source],
    priorityReason,
    confidence,
    urgency,
  }
}

// ── Wrap-up draft signal builder ──────────────────────────────────────────────

export function buildWrapUpCOOSignal(
  coachName: string,
  sessionLabel: string,
): ReviewQueueCOOSignal {
  return buildCOOSignal(
    'coach_wrap_up',
    `${coachName} submitted a wrap-up for ${sessionLabel}. Review before it affects player records.`,
    'partial',
    'medium',
  )
}

// ── Attendance exception signal builder ───────────────────────────────────────

export function buildAttendanceCOOSignal(
  playerName: string,
  absenceCount: number,
): ReviewQueueCOOSignal {
  return buildCOOSignal(
    'attendance',
    `${playerName} has ${absenceCount} unresolved absence${absenceCount === 1 ? '' : 's'}. Confirm or dismiss.`,
    'high',
    absenceCount >= 3 ? 'high' : 'medium',
  )
}

// ── Parent update signal builder ──────────────────────────────────────────────

export function buildParentUpdateCOOSignal(
  playerName: string,
  daysSinceLastUpdate: number | null,
): ReviewQueueCOOSignal {
  const reason = daysSinceLastUpdate !== null
    ? `${playerName}'s parent hasn't received an update in ${daysSinceLastUpdate} day${daysSinceLastUpdate === 1 ? '' : 's'}.`
    : `Parent update ready for ${playerName} — needs director approval before sending.`
  return buildCOOSignal('parent_update', reason, 'partial', 'medium')
}

// ── Level readiness signal builder ────────────────────────────────────────────

export function buildLevelReadinessCOOSignal(playerName: string): ReviewQueueCOOSignal {
  return buildCOOSignal(
    'level_readiness',
    `${playerName} has been flagged as potentially ready for level movement. Director decision required.`,
    'partial',
    'low',
  )
}

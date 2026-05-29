// Sprint 951 — Academy Intelligence Signals V1
// Defines academy-level COO signals DONNA uses for operational judgment.
// Pure TypeScript — no DB calls, no React, no mutations.
// Signal computation is read-only; all actions require director approval.

import type { DirectorBriefInput } from './donnaDirectorBrief'

// ── Signal types ──────────────────────────────────────────────────────────────

export type SignalCategory =
  | 'review_queue'           // Pending approvals and their age
  | 'wrap_up_completion'     // Coach wrap-up submission rate
  | 'attendance_exception'   // Attendance exception frequency
  | 'parent_communication'   // Parent communication gaps
  | 'curriculum_execution'   // Curriculum delivery gaps
  | 'player_evidence'        // Player evidence submission gaps

export type SignalSeverity = 'critical' | 'warning' | 'ok' | 'unknown'

export interface AcademySignal {
  category: SignalCategory
  label: string
  severity: SignalSeverity
  value: number | null
  message: string
  actionRoute: string | null
  actionLabel: string | null
}

// ── Signal builders ───────────────────────────────────────────────────────────

export function buildReviewQueueSignal(pendingReviews: number): AcademySignal {
  return {
    category: 'review_queue',
    label: 'Review Queue',
    severity: pendingReviews >= 5 ? 'critical' : pendingReviews > 0 ? 'warning' : 'ok',
    value: pendingReviews,
    message: pendingReviews === 0
      ? 'Review queue is clear.'
      : `${pendingReviews} item${pendingReviews > 1 ? 's' : ''} pending director review.`,
    actionRoute: pendingReviews > 0 ? '/director/review' : null,
    actionLabel: pendingReviews > 0 ? 'Go to Review Center' : null,
  }
}

export function buildAttendanceSignal(attendanceExceptions: number): AcademySignal {
  return {
    category: 'attendance_exception',
    label: 'Attendance Exceptions',
    severity: attendanceExceptions > 3 ? 'critical' : attendanceExceptions > 0 ? 'warning' : 'ok',
    value: attendanceExceptions,
    message: attendanceExceptions === 0
      ? 'No pending attendance exceptions.'
      : `${attendanceExceptions} attendance exception${attendanceExceptions > 1 ? 's' : ''} need director review.`,
    actionRoute: attendanceExceptions > 0 ? '/director/review' : null,
    actionLabel: attendanceExceptions > 0 ? 'Review exceptions' : null,
  }
}

export function buildPlayerDevelopmentSignal(
  stalls: number,
  highRisk: number,
): AcademySignal {
  const total = stalls + highRisk
  return {
    category: 'player_evidence',
    label: 'Player Development',
    severity: highRisk >= 3 ? 'critical' : total > 0 ? 'warning' : 'ok',
    value: total,
    message: total === 0
      ? 'No player development concerns.'
      : `${highRisk > 0 ? `${highRisk} high-risk` : ''}${highRisk > 0 && stalls > 0 ? ' + ' : ''}${stalls > 0 ? `${stalls} stalled` : ''} player${total > 1 ? 's' : ''}.`,
    actionRoute: total > 0 ? '/director/players' : null,
    actionLabel: total > 0 ? 'Review players' : null,
  }
}

export function buildCurriculumSignal(draftCount: number): AcademySignal {
  return {
    category: 'curriculum_execution',
    label: 'Curriculum Drafts',
    severity: draftCount >= 5 ? 'warning' : 'ok',
    value: draftCount,
    message: draftCount === 0
      ? 'No pending curriculum drafts.'
      : `${draftCount} curriculum draft${draftCount > 1 ? 's' : ''} pending review.`,
    actionRoute: draftCount > 0 ? '/director/review' : null,
    actionLabel: draftCount > 0 ? 'Review curriculum drafts' : null,
  }
}

// ── Full signal suite ─────────────────────────────────────────────────────────

export interface AcademySignalSuite {
  signals: AcademySignal[]
  overallSeverity: SignalSeverity
  criticalCount: number
  warningCount: number
}

export function buildAcademySignalSuite(input: DirectorBriefInput): AcademySignalSuite {
  const signals: AcademySignal[] = [
    buildReviewQueueSignal(input.pendingReviews ?? 0),
    buildAttendanceSignal(input.attendanceExceptions ?? 0),
    buildPlayerDevelopmentSignal(
      input.playerProgressStallCount ?? 0,
      input.highRiskPlayerCount ?? 0,
    ),
    buildCurriculumSignal(input.curriculumDraftCount ?? 0),
  ]

  const critical = signals.filter(s => s.severity === 'critical').length
  const warning  = signals.filter(s => s.severity === 'warning').length

  return {
    signals,
    overallSeverity: critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'ok',
    criticalCount: critical,
    warningCount: warning,
  }
}

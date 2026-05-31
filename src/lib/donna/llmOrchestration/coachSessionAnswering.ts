// Sprint 1016 — DONNA Coach / Session Question Answering V1
// Converts a live SessionContextSummary into a COO-quality, prioritized DONNA answer.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   When a director or coach is on a session page and asks DONNA about the session
//   ("what's the status of this session?", "has the wrap-up been submitted?",
//   "how many players showed up?"), this module converts the live SessionContextSummary
//   into a clear, prioritized answer.
//
// Safety invariants:
//   - No raw coach notes or observation text
//   - No individual player names (attendance counts only)
//   - No wrap-up draft content
//   - Wrap-up pending director review → routes to Review Queue (approval required)
//   - Always ends with "nothing changes until you take an explicit action"
//
// Usage (from toolResultInterpreter.ts):
//   const answer = buildSessionContextAnswer(sessionSummary)

import type { SessionContextSummary } from './sessionContextRetrieval'

// ── Answer type ───────────────────────────────────────────────────────────────

export interface SessionContextAnswer {
  /** COO-style DONNA response text */
  donnaText: string
  /** Optional primary action label */
  primaryActionLabel?: string
  /** Optional route suggestion */
  suggestedRoute?: string
  /** Optional UI element to highlight */
  highlightTargetId?: string
}

// ── Status label helpers ──────────────────────────────────────────────────────

const SESSION_STATUS_LABEL: Record<string, string> = {
  planned: 'planned',
  in_progress: 'in progress',
  completed: 'completed',
  cancelled: 'cancelled',
}

const WRAP_UP_LABEL: Record<SessionContextSummary['wrapUpStatus'], string> = {
  not_started: 'not started',
  draft_submitted: 'submitted — pending review',
  approved: 'approved',
  rejected: 'returned for revision',
}

// ── Answer builder ────────────────────────────────────────────────────────────

/**
 * Build a COO-quality DONNA answer from a live SessionContextSummary.
 *
 * Priority order:
 *   1. Needs director review → most urgent (wrap-up waiting for approval)
 *   2. Session status (if in_progress or completed)
 *   3. Attendance (if recorded)
 *   4. Wrap-up status (operational follow-through signal)
 *   5. Coach + group → context
 *   6. Template + block count → structural context
 *   7. Date/time → scheduling context
 *
 * Never returns coach notes, observation text, player names, or raw IDs.
 */
export function buildSessionContextAnswer(session: SessionContextSummary): SessionContextAnswer {
  const lines: string[] = []
  const signals: string[] = []
  let primaryActionLabel: string | undefined
  let suggestedRoute: string | undefined
  let highlightTargetId: string | undefined

  // Opening: session name and status
  const sessionLabel = session.sessionName ?? 'This session'
  const statusLabel = session.sessionStatus
    ? (SESSION_STATUS_LABEL[session.sessionStatus] ?? session.sessionStatus.replace(/_/g, ' '))
    : null
  lines.push(statusLabel ? `${sessionLabel} is ${statusLabel}.` : `${sessionLabel}.`)

  // Priority 1: needs director review
  if (session.needsDirectorReview) {
    signals.push('A coach wrap-up is waiting for your review in the Review Queue.')
    primaryActionLabel = 'Review coach wrap-up'
    suggestedRoute = '/director/review'
    highlightTargetId = 'review-queue-primary'
  }

  // Priority 2: attendance (if recorded)
  if (session.attendance.recorded) {
    const { present, absent, total } = session.attendance
    signals.push(`Attendance: ${present} of ${total} present, ${absent} absent.`)
  } else if (session.sessionStatus === 'completed') {
    signals.push('Attendance has not been recorded for this session.')
  }

  // Priority 3: wrap-up status (only if not already surfaced as director review)
  if (!session.needsDirectorReview) {
    signals.push(`Wrap-up: ${WRAP_UP_LABEL[session.wrapUpStatus]}.`)
  }

  // Context signals
  if (session.coachName) signals.push(`Coach: ${session.coachName}.`)
  if (session.groupName) signals.push(`Group: ${session.groupName}.`)
  if (session.templateName) signals.push(`Template: ${session.templateName}.`)
  if (session.blockCount > 0) {
    signals.push(`${session.blockCount} block${session.blockCount !== 1 ? 's' : ''} planned.`)
  }
  if (session.scheduledDate) {
    const timeStr = session.scheduledTime ? ` at ${session.scheduledTime}` : ''
    const durationStr = session.durationMin ? ` (${session.durationMin} min)` : ''
    signals.push(`Scheduled: ${session.scheduledDate}${timeStr}${durationStr}.`)
  }

  if (signals.length > 0) lines.push(signals.join(' '))

  lines.push('This is a read-only session summary. Nothing changes until you take an explicit action.')

  return {
    donnaText: lines.join(' '),
    primaryActionLabel,
    suggestedRoute,
    highlightTargetId,
  }
}

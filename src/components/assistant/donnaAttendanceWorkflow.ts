// Sprint 372 — Donna Attendance Exception Draft V1
// Typed workflow for attendance exceptions.
// Uses existing saveAttendanceExceptionDraftAction (already wired, goes to proposed_actions).
// No new server actions. Director must confirm before submission.

// ── Types ──────────────────────────────────────────────────────────────────────

export type AttendanceExceptionType = 'absence' | 'late' | 'early_leave'

export interface AttendanceExceptionDraft {
  id: string
  playerId?: string
  playerName?: string
  sessionId?: string
  sessionLabel?: string
  reason: string
  type: AttendanceExceptionType
  coachNotified: boolean
  createdAt: string
}

// ── Slot-filling questions ─────────────────────────────────────────────────────

export const ATTENDANCE_EXCEPTION_QUESTIONS: Array<{
  fieldId: keyof AttendanceExceptionDraft | 'session_or_group' | 'attendance_statement'
  question: string
  hint?: string
}> = [
  {
    fieldId: 'playerName',
    question: "Which player is this attendance exception for?",
    hint: "e.g., 'Marcus', 'the Orange 2 group'",
  },
  {
    fieldId: 'type',
    question: "What type of exception is this — absence, late arrival, or early leave?",
    hint: "'absence', 'late', or 'early leave'",
  },
  {
    fieldId: 'reason',
    question: "What is the reason for this exception?",
    hint: "e.g., 'family appointment', 'illness', 'tournament travel'",
  },
]

// ── ID generation ──────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  _idCounter += 1
  return `attendance_exc_${Date.now()}_${_idCounter}`
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Create an empty attendance exception draft.
 */
export function createAttendanceExceptionDraft(context: {
  playerId?: string
  playerName?: string
  sessionId?: string
  sessionLabel?: string
} = {}): AttendanceExceptionDraft {
  return {
    id: generateId(),
    playerId: context.playerId,
    playerName: context.playerName,
    sessionId: context.sessionId,
    sessionLabel: context.sessionLabel,
    reason: '',
    type: 'absence',
    coachNotified: false,
    createdAt: new Date().toISOString(),
  }
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the draft has enough information to submit.
 */
export function attendanceExceptionReadyToSubmit(draft: AttendanceExceptionDraft): boolean {
  return (
    !!draft.reason.trim() &&
    !!draft.type &&
    (!!draft.playerName || !!draft.playerId)
  )
}

// ── Formatting ─────────────────────────────────────────────────────────────────

/**
 * Format an attendance exception draft as a human-readable string for review.
 */
export function formatAttendanceException(draft: AttendanceExceptionDraft): string {
  const lines: string[] = [
    `Type: ${draft.type}`,
    `Player: ${draft.playerName ?? draft.playerId ?? 'Unknown'}`,
    `Reason: ${draft.reason || '(not yet provided)'}`,
    `Session: ${draft.sessionLabel ?? draft.sessionId ?? 'Not specified'}`,
    `Coach notified: ${draft.coachNotified ? 'Yes' : 'No'}`,
  ]
  return lines.join('\n')
}

// Sprint 372 — Donna Attendance Exception Draft V1
// Sprint 383 — Extended with naturalInput, flaggedAbsences, flaggedUnrostered fields
//              Added attendanceExceptionReadyForQueue (requires session resolution)
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
  // Sprint 383 — Natural language input fields
  naturalInput?: string       // The original natural phrase if this started from natural language
  flaggedAbsences?: string[]  // Names extracted as possibly absent
  flaggedUnrostered?: string[] // Names extracted as possibly unrostered/unexpected
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
 * Sprint 383: accepts naturalInput and pre-extracted flags.
 */
export function createAttendanceExceptionDraft(context: {
  playerId?: string
  playerName?: string
  sessionId?: string
  sessionLabel?: string
  naturalInput?: string
  flaggedAbsences?: string[]
  flaggedUnrostered?: string[]
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
    naturalInput: context.naturalInput,
    flaggedAbsences: context.flaggedAbsences,
    flaggedUnrostered: context.flaggedUnrostered,
  }
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the draft has enough field content to proceed to session selection.
 * Sprint 383: natural language drafts are considered field-ready immediately.
 */
export function attendanceExceptionReadyToSubmit(draft: AttendanceExceptionDraft): boolean {
  // Natural language draft: the original phrase is sufficient to proceed to session selection
  if (draft.naturalInput && draft.naturalInput.trim().length > 0) return true
  // Slot-filled: requires player, type, and reason
  return (
    !!draft.reason.trim() &&
    !!draft.type &&
    (!!draft.playerName || !!draft.playerId)
  )
}

/**
 * Returns true when the draft is ready to be queued for review.
 * Requires both field readiness AND a confirmed session/group ID.
 * Sprint 383: session must be resolved before the draft can be submitted.
 */
export function attendanceExceptionReadyForQueue(draft: AttendanceExceptionDraft): boolean {
  return attendanceExceptionReadyToSubmit(draft) && !!draft.sessionId
}

/**
 * Build the attendance_statement for saveAttendanceExceptionDraftAction.
 * Uses naturalInput if available; otherwise constructs from slot-filled fields.
 */
export function buildAttendanceStatement(draft: AttendanceExceptionDraft): string {
  if (draft.naturalInput && draft.naturalInput.trim()) return draft.naturalInput.trim()
  const who = draft.playerName ?? 'Unknown player'
  const typeLabel =
    draft.type === 'late' ? 'arrived late' :
    draft.type === 'early_leave' ? 'left early' :
    'was absent'
  const reasonPart = draft.reason ? `: ${draft.reason}` : ''
  return `${who} ${typeLabel}${reasonPart}`
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
  if (draft.flaggedAbsences && draft.flaggedAbsences.length > 0) {
    lines.push(`Flagged absences: ${draft.flaggedAbsences.join(', ')}`)
  }
  if (draft.flaggedUnrostered && draft.flaggedUnrostered.length > 0) {
    lines.push(`Possible unrostered: ${draft.flaggedUnrostered.join(', ')}`)
  }
  return lines.join('\n')
}

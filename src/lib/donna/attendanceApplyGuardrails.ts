// Sprint 568 — Attendance Draft Apply Guardrails V1
// Safety checks and copy preventing accidental attendance application.
// Pure TypeScript — no DB writes, no execution.

import type { RosteredAttendanceDraft } from '@/app/director/sessions/[sessionId]/attendanceExceptionDraftAction'

// ── Guardrail result ──────────────────────────────────────────────────────────

export interface AttendanceApplyGuardrailResult {
  canApply: boolean
  blockers: AttendanceApplyBlocker[]
  warnings: AttendanceApplyWarning[]
  requiresExtraConfirmation: boolean
}

export interface AttendanceApplyBlocker {
  code: string
  message: string
}

export interface AttendanceApplyWarning {
  code: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

// ── Guardrail engine ──────────────────────────────────────────────────────────

export function checkAttendanceApplyGuardrails(
  rostered: RosteredAttendanceDraft[],
  unrosteredCount: number,
  draftStatus: string,
  existingWarnings: string[],
): AttendanceApplyGuardrailResult {
  const blockers: AttendanceApplyBlocker[] = []
  const warnings: AttendanceApplyWarning[] = []

  // ── Hard blockers ──

  if (draftStatus !== 'approved') {
    blockers.push({
      code: 'NOT_APPROVED',
      message: 'This draft must be approved by a director before it can be applied.',
    })
  }

  if (rostered.length === 0 && unrosteredCount === 0) {
    blockers.push({
      code: 'EMPTY_DRAFT',
      message: 'This attendance draft contains no player data to apply.',
    })
  }

  // ── Soft warnings ──

  const unknownCount = rostered.filter(r => r.proposed_status === 'unknown').length
  if (unknownCount > 0) {
    warnings.push({
      code: 'UNKNOWN_STATUS',
      message: `${unknownCount} player${unknownCount === 1 ? '' : 's'} marked unknown will be recorded as unresolved. Follow-up required.`,
      severity: 'medium',
    })
  }

  const absentCount = rostered.filter(r => r.proposed_status === 'absent').length
  const totalCount = rostered.length
  if (totalCount > 0 && absentCount / totalCount > 0.5) {
    warnings.push({
      code: 'HIGH_ABSENCE_RATE',
      message: `More than 50% of rostered players are marked absent (${absentCount}/${totalCount}). Verify this is correct before applying.`,
      severity: 'high',
    })
  }

  if (unrosteredCount > 0) {
    warnings.push({
      code: 'UNROSTERED_ATTENDEES',
      message: `${unrosteredCount} unrostered attendee${unrosteredCount === 1 ? '' : 's'} will generate follow-up items. Their attendance will not be officially recorded until they are added to the roster.`,
      severity: 'low',
    })
  }

  if (existingWarnings.length > 0) {
    warnings.push({
      code: 'PARSER_WARNINGS',
      message: `This draft has ${existingWarnings.length} parser warning${existingWarnings.length === 1 ? '' : 's'} from when it was captured. Review these before applying.`,
      severity: 'medium',
    })
  }

  const highSeverityWarnings = warnings.filter(w => w.severity === 'high')
  const requiresExtraConfirmation = highSeverityWarnings.length > 0 || unknownCount > 0

  return {
    canApply: blockers.length === 0,
    blockers,
    warnings,
    requiresExtraConfirmation,
  }
}

// ── Guardrail copy helpers ────────────────────────────────────────────────────

export const ATTENDANCE_APPLY_GUARDRAIL_COPY = {
  notApprovedTitle: 'Director approval required',
  notApprovedBody: 'Attendance records can only be updated after a director or head coach has reviewed and approved this draft.',
  irreversibleNote: 'Applying this draft will update official attendance records. This action cannot be automatically undone.',
  unknownFollowUpNote: 'Players marked unknown will appear in the follow-up queue for manual resolution.',
  unrosteredNote: 'Unrostered attendees cannot be officially recorded until they are added to the player roster.',
} as const

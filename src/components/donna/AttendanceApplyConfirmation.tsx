'use client'

// Sprint 567 — Attendance Draft Apply Confirmation UI V1
// Confirmation dialog before applying an attendance draft to official records.
// Does not apply anything — delegates to the existing ApplyApprovedAttendanceExceptionControls.

import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AttendanceApplyConfirmationProps {
  presentCount: number
  absentCount: number
  unknownCount: number
  unrosteredCount: number
  warningCount: number
  sessionName?: string
  onConfirm: () => void
  onCancel: () => void
  isApplying?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttendanceApplyConfirmation({
  presentCount,
  absentCount,
  unknownCount,
  unrosteredCount,
  warningCount,
  sessionName,
  onConfirm,
  onCancel,
  isApplying = false,
}: AttendanceApplyConfirmationProps) {
  const totalPlayers = presentCount + absentCount + unknownCount
  const hasWarnings = warningCount > 0
  const hasUnknown = unknownCount > 0

  return (
    <div className="rounded-xl border border-status-orange/30 bg-status-orange/5 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-status-orange/20">
        <AlertTriangle className="w-4 h-4 text-status-orange shrink-0" />
        <p className="text-xs font-semibold text-status-orange">Confirm attendance apply</p>
        <button
          onClick={onCancel}
          className="ml-auto text-text-muted hover:text-text-secondary transition-colors"
          disabled={isApplying}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="px-3.5 py-3 flex flex-col gap-2">
        <p className="text-sm text-text-primary leading-snug">
          This will update attendance records for{' '}
          <span className="font-semibold">{totalPlayers} player{totalPlayers === 1 ? '' : 's'}</span>
          {sessionName ? ` in ${sessionName}` : ''}.
        </p>

        <div className="flex flex-col gap-1">
          {presentCount > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
              <p className="text-xs text-text-muted">{presentCount} marked <span className="text-status-green font-medium">present</span></p>
            </div>
          )}
          {absentCount > 0 && (
            <div className="flex items-center gap-2">
              <X className="w-3.5 h-3.5 text-status-red shrink-0" />
              <p className="text-xs text-text-muted">{absentCount} marked <span className="text-status-red font-medium">absent</span></p>
            </div>
          )}
          {unknownCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <p className="text-xs text-status-orange">{unknownCount} player{unknownCount === 1 ? '' : 's'} marked unknown — will need follow-up</p>
            </div>
          )}
          {unrosteredCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <p className="text-xs text-status-orange">{unrosteredCount} unrostered attendee{unrosteredCount === 1 ? '' : 's'} — follow-up item will be created</p>
            </div>
          )}
          {hasWarnings && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <p className="text-xs text-status-orange">{warningCount} warning{warningCount === 1 ? '' : 's'} attached to this draft</p>
            </div>
          )}
        </div>

        {(hasWarnings || hasUnknown) && (
          <p className="text-[11px] text-text-muted leading-snug border-t border-border/50 pt-2 mt-0.5">
            Review the warnings above before applying. This cannot be automatically undone.
          </p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-status-orange/20">
        <button
          onClick={onCancel}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isApplying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-status-orange text-white text-sm font-semibold hover:bg-status-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isApplying ? 'Applying…' : `Apply to ${totalPlayers} player${totalPlayers === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}

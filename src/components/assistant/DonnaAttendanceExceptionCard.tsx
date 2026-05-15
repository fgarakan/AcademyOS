'use client'

// Sprint 381 — Donna Attendance Exception Card V1
// Display card for an in-progress AttendanceExceptionDraft.
// Shows collected fields, the next question, and what's still needed.
// No DB writes here. Director must explicitly queue for review via the save action.
// "Queue for review" is intentionally not wired in Sprint 381 — session ID resolution
// is required before saveAttendanceExceptionDraftAction can be called safely.

import { X, ClipboardList } from 'lucide-react'
import type { AttendanceExceptionDraft } from './donnaAttendanceWorkflow'
import {
  ATTENDANCE_EXCEPTION_QUESTIONS,
  attendanceExceptionReadyToSubmit,
} from './donnaAttendanceWorkflow'

interface Props {
  draft: AttendanceExceptionDraft
  onDiscard: () => void
}

const TYPE_LABELS: Record<string, string> = {
  absence:     'Absence',
  late:        'Late arrival',
  early_leave: 'Early leave',
}

export function DonnaAttendanceExceptionCard({ draft, onDiscard }: Props) {
  const isReady = attendanceExceptionReadyToSubmit(draft)

  // Find the first question whose field is still unfilled
  const nextMissing = ATTENDANCE_EXCEPTION_QUESTIONS.find(q => {
    const { fieldId } = q
    if (fieldId === 'session_or_group' || fieldId === 'attendance_statement') return false
    const val = draft[fieldId as keyof AttendanceExceptionDraft]
    return !val || (typeof val === 'string' && !val.trim())
  })

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 shrink-0" style={{ color: '#FF9500' }} />
          <span className="text-xs font-semibold text-text-primary">Attendance Exception</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
            style={isReady
              ? { background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }
              : { background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)', color: '#FF9500' }
            }
          >
            {isReady ? 'Ready' : 'Collecting'}
          </span>
        </div>
        <button
          onClick={onDiscard}
          aria-label="Discard attendance exception draft"
          className="shrink-0 text-text-muted hover:text-status-red transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collected fields */}
      <div className="space-y-1">
        {draft.playerName && (
          <div className="text-[11px] text-text-muted">
            Player: <span className="text-text-secondary">{draft.playerName}</span>
          </div>
        )}
        <div className="text-[11px] text-text-muted">
          Type: <span className="text-text-secondary">{TYPE_LABELS[draft.type] ?? draft.type}</span>
        </div>
        {draft.reason && (
          <div className="text-[11px] text-text-muted">
            Reason: <span className="text-text-secondary">{draft.reason}</span>
          </div>
        )}
        {draft.sessionLabel && (
          <div className="text-[11px] text-text-muted">
            Session: <span className="text-text-secondary">{draft.sessionLabel}</span>
          </div>
        )}
      </div>

      {/* Next question prompt */}
      {nextMissing && (
        <div
          className="rounded-lg px-2.5 py-2"
          style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.18)' }}
        >
          <p className="text-[11px] text-status-orange leading-snug">{nextMissing.question}</p>
          {nextMissing.hint && (
            <p className="text-[10px] text-text-muted mt-0.5">{nextMissing.hint}</p>
          )}
        </div>
      )}

      {/* Safety notice */}
      <div
        className="rounded-lg px-2.5 py-1.5"
        style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
      >
        <p className="text-[10px] text-text-muted leading-snug">
          Donna cannot record attendance directly. Session ID confirmation is required before this can be queued for review.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscard}
          className="text-[11px] text-text-muted hover:text-status-red transition-colors underline underline-offset-2"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

'use client'

// Sprint 381 — Donna Attendance Exception Card V1
// Sprint 382 — Improved approval boundary copy
// Sprint 383 — Session/group picker, queue-for-review CTA, natural language flags
// Shows collected fields, session options, and readiness state.
// No DB writes in this component. All writes go through saveAttendanceExceptionDraftAction.

import Link from 'next/link'
import { Loader2, X, ClipboardList, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'
import type { AttendanceExceptionDraft } from './donnaAttendanceWorkflow'
import {
  ATTENDANCE_EXCEPTION_QUESTIONS,
  attendanceExceptionReadyToSubmit,
  attendanceExceptionReadyForQueue,
} from './donnaAttendanceWorkflow'
import type { AttendanceSessionOption } from './donnaAttendanceSessionResolution'
import {
  getAttendanceDraftPhase,
  formatSessionOptionLabel,
  MANUAL_PLACEHOLDER,
} from './donnaAttendanceSessionResolution'

interface Props {
  draft: AttendanceExceptionDraft
  onDiscard: () => void
  // Session resolution (Sprint 383)
  sessionOptions?: AttendanceSessionOption[]
  isLoadingSessions?: boolean
  onSelectSession?: (option: AttendanceSessionOption) => void
  // Queue for review (Sprint 383)
  onQueueForReview?: () => void
  isQueueing?: boolean
  queueResult?: { ok: boolean; message: string; safetyNotes?: string[] } | null
}

const TYPE_LABELS: Record<string, string> = {
  absence:     'Absence',
  late:        'Late arrival',
  early_leave: 'Early leave',
}

const SOURCE_LABELS: Record<string, string> = {
  existing_session:   '',
  demo_option:        ' · Demo',
  manual_placeholder: '',
}

export function DonnaAttendanceExceptionCard({
  draft,
  onDiscard,
  sessionOptions = [],
  isLoadingSessions = false,
  onSelectSession,
  onQueueForReview,
  isQueueing = false,
  queueResult = null,
}: Props) {
  const fieldsReady = attendanceExceptionReadyToSubmit(draft)
  const readyForQueue = attendanceExceptionReadyForQueue(draft)
  const phase = getAttendanceDraftPhase(fieldsReady, draft.sessionId)

  // Next missing slot-fill question (only for non-natural drafts)
  const nextMissing = draft.naturalInput
    ? null
    : ATTENDANCE_EXCEPTION_QUESTIONS.find(q => {
        const { fieldId } = q
        if (fieldId === 'session_or_group' || fieldId === 'attendance_statement') return false
        const val = draft[fieldId as keyof AttendanceExceptionDraft]
        return !val || (typeof val === 'string' && !val.trim())
      })

  const phaseLabel =
    phase === 'collecting' ? 'Collecting' :
    phase === 'choose_session' ? 'Choose session' :
    'Ready to review'

  const phaseStyle =
    phase === 'ready'
      ? { background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }
      : phase === 'choose_session'
      ? { background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.25)', color: '#0A84FF' }
      : { background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)', color: '#FF9500' }

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 shrink-0" style={{ color: '#FF9500' }} />
          <span className="text-xs font-semibold text-text-primary">Attendance Exception</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={phaseStyle}>
            {phaseLabel}
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

      {/* ── Natural language flags ── */}
      {draft.naturalInput && (
        <div
          className="rounded-lg px-2.5 py-2 space-y-1"
          style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.18)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold text-status-orange">
            From your input
          </p>
          <p className="text-[11px] text-text-secondary leading-snug italic">
            &ldquo;{draft.naturalInput.slice(0, 100)}{draft.naturalInput.length > 100 ? '…' : ''}&rdquo;
          </p>
          {draft.flaggedAbsences && draft.flaggedAbsences.length > 0 && (
            <p className="text-[11px] text-text-muted leading-snug">
              Possible absent: <span className="text-status-red font-medium">{draft.flaggedAbsences.join(', ')}</span>
              <span className="text-[9px] ml-1 text-text-muted">(needs confirmation)</span>
            </p>
          )}
          {draft.flaggedUnrostered && draft.flaggedUnrostered.length > 0 && (
            <p className="text-[11px] text-text-muted leading-snug">
              Possible unrostered: <span className="text-status-orange font-medium">{draft.flaggedUnrostered.join(', ')}</span>
              <span className="text-[9px] ml-1 text-text-muted">(director review required)</span>
            </p>
          )}
        </div>
      )}

      {/* ── Collected fields (slot-filled) ── */}
      {!draft.naturalInput && (
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
        </div>
      )}

      {/* ── Session selected ── */}
      {draft.sessionLabel && (
        <div className="text-[11px] text-text-muted">
          Session:{' '}
          <span className="text-status-green font-medium">{draft.sessionLabel}</span>
          {onSelectSession && (
            <button
              type="button"
              onClick={() => onSelectSession(MANUAL_PLACEHOLDER)}
              className="ml-1.5 text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
            >
              change
            </button>
          )}
        </div>
      )}

      {/* ── Phase: collecting — next question ── */}
      {phase === 'collecting' && nextMissing && (
        <div
          className="rounded-lg px-2.5 py-2"
          style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.18)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold text-status-orange mb-0.5">
            Continue filling
          </p>
          <p className="text-[11px] text-status-orange leading-snug">{nextMissing.question}</p>
          {nextMissing.hint && (
            <p className="text-[10px] text-text-muted mt-0.5">{nextMissing.hint}</p>
          )}
        </div>
      )}

      {/* ── Phase: choose_session — session picker ── */}
      {phase === 'choose_session' && !draft.sessionId && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-status-blue">
            Which session is this for?
          </p>

          {isLoadingSessions ? (
            <div className="flex items-center gap-1.5 py-1 text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[11px]">Loading sessions…</span>
            </div>
          ) : sessionOptions.length > 0 ? (
            <div className="space-y-1">
              {sessionOptions.map(option => (
                <button
                  key={option.sessionId}
                  type="button"
                  onClick={() => onSelectSession?.(option)}
                  className="w-full text-left rounded-lg px-2.5 py-2 transition-all hover:opacity-80"
                  style={{ background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.2)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-text-primary leading-tight">
                        {option.title}
                        {SOURCE_LABELS[option.source] && (
                          <span className="text-[9px] text-text-muted font-normal ml-1">
                            {SOURCE_LABELS[option.source]}
                          </span>
                        )}
                      </p>
                      {(option.dateLabel || option.groupLabel) && (
                        <p className="text-[10px] text-text-muted leading-tight">
                          {[option.dateLabel, option.groupLabel].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-status-blue shrink-0 -rotate-90" />
                  </div>
                </button>
              ))}
              {/* Manual placeholder */}
              <button
                type="button"
                onClick={() => onSelectSession?.(MANUAL_PLACEHOLDER)}
                className="w-full text-left rounded-lg px-2.5 py-1.5 transition-all hover:opacity-80"
                style={{ background: 'rgba(85,85,85,0.08)', border: '1px solid rgba(85,85,85,0.2)' }}
              >
                <p className="text-[11px] text-text-muted">Not sure / confirm later</p>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-text-muted italic">No recent sessions found.</p>
              <button
                type="button"
                onClick={() => onSelectSession?.(MANUAL_PLACEHOLDER)}
                className="w-full text-left rounded-lg px-2.5 py-1.5 transition-all hover:opacity-80"
                style={{ background: 'rgba(85,85,85,0.08)', border: '1px solid rgba(85,85,85,0.2)' }}
              >
                <p className="text-[11px] text-text-muted">Confirm session later</p>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Queue result ── */}
      {queueResult && (
        <div
          className="rounded-lg px-2.5 py-2 space-y-1"
          style={
            queueResult.ok
              ? { background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.2)' }
              : { background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)' }
          }
        >
          <div className="flex items-center gap-1.5">
            {queueResult.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            }
            <p className="text-[11px] font-semibold" style={{ color: queueResult.ok ? '#30D158' : '#FF3B30' }}>
              {queueResult.message}
            </p>
          </div>
          {queueResult.ok && (
            <p className="text-[10px] text-text-muted">
              View and apply in the{' '}
              <Link
                href="/director/review"
                className="underline underline-offset-2 hover:text-text-secondary transition-colors"
              >
                Review Queue
              </Link>{' '}
              when ready. Director approval required before any attendance changes.
            </p>
          )}
          {queueResult.safetyNotes && queueResult.safetyNotes.length > 0 && (
            <ul className="space-y-0.5">
              {queueResult.safetyNotes.slice(0, 3).map((n, i) => (
                <li key={i} className="text-[10px] text-text-muted">· {n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Approval boundary notice ── */}
      <div
        className="rounded-lg px-2.5 py-1.5"
        style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
      >
        <p className="text-[10px] text-text-muted leading-snug">
          Draft only. Official attendance changes require visible approval. No roster, billing, or player records are changed here.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Queue for review — only when ready and not already queued successfully */}
        {readyForQueue && !queueResult?.ok && onQueueForReview && (
          <button
            type="button"
            onClick={onQueueForReview}
            disabled={isQueueing}
            className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
          >
            {isQueueing ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Queueing…
              </span>
            ) : 'Queue for review'}
          </button>
        )}
        {/* Placeholder when session is manual/unknown */}
        {draft.sessionId === 'manual_placeholder' && (
          <span className="text-[10px] text-text-muted italic">
            Confirm session to enable review queue
          </span>
        )}
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

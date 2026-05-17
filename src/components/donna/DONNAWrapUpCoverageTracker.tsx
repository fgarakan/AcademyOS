'use client'

// Sprint 618 — DONNA Wrap-Up Coverage Tracker V1
// Shows which sessions have been wrapped up today vs still pending.
// Director view — display only, no DB writes.

import { CheckCircle2, Clock, BookOpen } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WrapUpCoverageStatus = 'complete' | 'pending' | 'overdue'

export interface SessionWrapUpItem {
  sessionId: string
  sessionLabel: string
  coachName: string | null
  scheduledAt: string
  status: WrapUpCoverageStatus
  onOpen?: () => void
  sessionHref?: string
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WrapUpCoverageStatus,
  { label: string; icon: React.ReactNode; colorClass: string; dotClass: string }
> = {
  complete: {
    label: 'Wrapped up',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    colorClass: 'text-status-green',
    dotClass: 'bg-status-green',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
    dotClass: 'bg-text-muted',
  },
  overdue: {
    label: 'Overdue',
    icon: <Clock className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
    dotClass: 'bg-status-orange',
  },
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ item }: { item: SessionWrapUpItem }) {
  const cfg = STATUS_CONFIG[item.status]

  const handleClick = () => {
    if (item.onOpen) item.onOpen()
    else if (item.sessionHref) window.location.href = item.sessionHref
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary font-medium truncate">{item.sessionLabel}</p>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          {item.coachName && <span>Coach: {item.coachName}</span>}
          <span>{item.scheduledAt}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[10px] font-medium ${cfg.colorClass}`}>{cfg.label}</span>
        {item.status !== 'complete' && (item.onOpen || item.sessionHref) && (
          <button
            type="button"
            onClick={handleClick}
            className="text-[10px] text-lime hover:text-lime/80 transition-colors"
          >
            Remind →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface DONNAWrapUpCoverageTrackerProps {
  sessions: SessionWrapUpItem[]
  dateLabel: string
  className?: string
}

export function DONNAWrapUpCoverageTracker({
  sessions,
  dateLabel,
  className = '',
}: DONNAWrapUpCoverageTrackerProps) {
  const complete = sessions.filter(s => s.status === 'complete').length
  const total = sessions.length
  const pct = total > 0 ? Math.round((complete / total) * 100) : null
  const allDone = complete === total && total > 0

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Wrap-up coverage</p>
        </div>
        <div className="flex items-center gap-2">
          {pct !== null && (
            <span className={`text-[11px] font-medium ${allDone ? 'text-lime' : 'text-status-orange'}`}>
              {pct}%
            </span>
          )}
          <span className="text-[10px] text-text-muted">{dateLabel}</span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="px-4 pt-2.5 pb-1">
          <div className="h-1 rounded-full bg-surface-raised overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${allDone ? 'bg-lime' : 'bg-status-orange'}`}
              style={{ width: `${pct ?? 0}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1">{complete}/{total} sessions wrapped up</p>
        </div>
      )}

      {/* Sessions */}
      {sessions.length > 0 ? (
        <div className="px-4 py-1">
          {sessions.map(s => <SessionRow key={s.sessionId} item={s} />)}
        </div>
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted">No sessions scheduled for {dateLabel}.</p>
        </div>
      )}
    </div>
  )
}

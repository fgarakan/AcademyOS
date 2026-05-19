import Link from 'next/link'
import { CheckCircle, Clock, ExternalLink, User } from 'lucide-react'
import type { WrapUpReviewSurfaceResult, WrapUpSessionStatus } from '@/lib/donna/wrapUpReviewSurfaceLoader'

function statusLabel(s: WrapUpSessionStatus): string {
  if (!s.wrapUpSubmitted) return 'Missing'
  if (s.wrapUpStatus === 'approved') return 'Approved'
  if (s.wrapUpStatus === 'pending_review') return 'Pending Review'
  return 'Submitted'
}

function statusColor(s: WrapUpSessionStatus): string {
  if (!s.wrapUpSubmitted) return 'text-status-orange'
  if (s.wrapUpStatus === 'approved') return 'text-lime'
  return 'text-status-green'
}

function coverageColor(pct: number): string {
  if (pct === 100) return 'text-status-green'
  if (pct >= 50) return 'text-status-orange'
  return 'text-status-red'
}

export function WrapUpCoveragePanel({ coverage }: { coverage: WrapUpReviewSurfaceResult }) {
  if (coverage.totalSessionsThisWeek === 0) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border px-4 py-4 space-y-1">
        <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Wrap-Up Coverage — Past 7 Days</p>
        <p className="text-[11px] text-text-secondary">No sessions recorded in the past 7 days.</p>
        <p className="text-[9px] text-text-muted/60 pt-1">
          Review-only — this does not change official records.
        </p>
      </div>
    )
  }

  const coveragePct = coverage.coverageRate !== null ? Math.round(coverage.coverageRate * 100) : null
  const missingSessions = coverage.sessions.filter(s => !s.wrapUpSubmitted)

  return (
    <div className="rounded-xl bg-surface-raised border border-border px-4 py-4 space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Wrap-Up Coverage — Past 7 Days</p>
        {coveragePct !== null && (
          <p className={`text-sm font-mono font-bold ${coverageColor(coveragePct)}`}>
            {coveragePct}%
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div>
          <p className="text-xl font-mono font-bold text-status-green">{coverage.wrapUpsSubmitted}</p>
          <p className="text-[9px] text-text-muted">Submitted</p>
        </div>
        <div>
          <p className={`text-xl font-mono font-bold ${coverage.wrapUpsPending > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
            {coverage.wrapUpsPending}
          </p>
          <p className="text-[9px] text-text-muted">Missing</p>
        </div>
        <div>
          <p className="text-xl font-mono font-bold text-text-muted">{coverage.totalSessionsThisWeek}</p>
          <p className="text-[9px] text-text-muted">Total</p>
        </div>
      </div>

      {/* Missing wrap-ups callout */}
      {missingSessions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest font-semibold text-status-orange">Missing wrap-ups</p>
          {missingSessions.map(s => (
            <div key={s.sessionId} className="flex items-center gap-2 py-1.5 border-t border-border">
              <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{s.sessionName}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                  <p className="text-[9px] text-text-muted font-mono">{s.scheduledDate}</p>
                  {s.coachName && (
                    <span className="flex items-center gap-0.5 text-[9px] text-text-muted">
                      <User className="w-2.5 h-2.5" />
                      {s.coachName}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/director/sessions/${s.sessionId}`}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium text-text-muted border border-border hover:border-lime/30 hover:text-lime transition-colors shrink-0"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                View
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Per-session rows (all sessions) */}
      <div className="space-y-0">
        <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted pb-1">All sessions</p>
        {coverage.sessions.map(s => (
          <div key={s.sessionId} className="flex items-center gap-2.5 py-2 border-t border-border">
            {s.wrapUpSubmitted ? (
              <CheckCircle className="w-3.5 h-3.5 text-status-green shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/director/sessions/${s.sessionId}`}
                className="text-xs text-text-primary hover:text-lime hover:underline truncate block"
              >
                {s.sessionName}
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                <p className="text-[9px] text-text-muted font-mono">{s.scheduledDate}</p>
                {s.coachName && (
                  <span className="flex items-center gap-0.5 text-[9px] text-text-muted">
                    <User className="w-2.5 h-2.5" />
                    {s.coachName}
                  </span>
                )}
              </div>
            </div>
            <p className={`text-[9px] font-semibold uppercase tracking-wide shrink-0 ${statusColor(s)}`}>
              {statusLabel(s)}
            </p>
          </div>
        ))}
      </div>

      {/* Review-only notice */}
      <p className="text-[9px] text-text-muted/60 pt-0.5 border-t border-border">
        Review-only — this does not change official records.
      </p>
    </div>
  )
}

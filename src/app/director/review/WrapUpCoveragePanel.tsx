import { CheckCircle, Clock } from 'lucide-react'
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

      {/* Per-session rows */}
      <div className="space-y-0">
        {coverage.sessions.map(s => (
          <div key={s.sessionId} className="flex items-center gap-2.5 py-2 border-t border-border">
            {s.wrapUpSubmitted ? (
              <CheckCircle className="w-3.5 h-3.5 text-status-green shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{s.sessionName}</p>
              <p className="text-[9px] text-text-muted font-mono">{s.scheduledDate}</p>
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

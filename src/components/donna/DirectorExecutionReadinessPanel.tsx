'use client'

// Sprint 608 — Director Command Center Execution Readiness V1
// Shows what's ready to execute in the director command center today.
// Summarizes pending, approved-not-applied, and recently applied actions.
// Display only — no DB writes, no mutations.

import { CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExecutionReadinessSummary {
  pendingReviewCount: number
  approvedNotAppliedCount: number
  appliedTodayCount: number
  blockedCount: number
  urgentPendingCount: number
  lastActivityAt: string | null
}

export interface DirectorExecutionReadinessPanelProps {
  summary: ExecutionReadinessSummary
  isLoading?: boolean
  className?: string
}

// ── Metric tile ───────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  colorClass,
  icon,
  note,
}: {
  label: string
  value: number
  colorClass: string
  icon: React.ReactNode
  note?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-3.5 py-3 rounded-lg bg-surface border border-border">
      <div className="flex items-center gap-1.5">
        <span className={`shrink-0 ${colorClass}`}>{icon}</span>
        <p className="text-[10px] text-text-muted">{label}</p>
      </div>
      <p className={`text-2xl font-mono font-bold ${colorClass}`}>{value}</p>
      {note && <p className="text-[10px] text-text-muted leading-snug">{note}</p>}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DirectorExecutionReadinessPanel({
  summary,
  isLoading = false,
  className = '',
}: DirectorExecutionReadinessPanelProps) {
  const {
    pendingReviewCount,
    approvedNotAppliedCount,
    appliedTodayCount,
    blockedCount,
    urgentPendingCount,
    lastActivityAt,
  } = summary

  const isAllClear = pendingReviewCount === 0 && approvedNotAppliedCount === 0 && blockedCount === 0

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-border bg-surface-raised overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-text-primary">Execution readiness</p>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted animate-pulse">Loading readiness data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface-raised overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Execution readiness</p>
        </div>
        {isAllClear && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
            <span className="text-[11px] text-status-green font-medium">All clear</span>
          </div>
        )}
        {urgentPendingCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-status-red" />
            <span className="text-[11px] text-status-red font-medium">{urgentPendingCount} urgent</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
        <MetricTile
          label="Pending review"
          value={pendingReviewCount}
          colorClass={pendingReviewCount > 0 ? 'text-status-orange' : 'text-text-muted'}
          icon={<Clock className="w-3 h-3" />}
          note={urgentPendingCount > 0 ? `${urgentPendingCount} urgent` : undefined}
        />
        <MetricTile
          label="Approved, not applied"
          value={approvedNotAppliedCount}
          colorClass={approvedNotAppliedCount > 0 ? 'text-status-blue' : 'text-text-muted'}
          icon={<CheckCircle2 className="w-3 h-3" />}
          note={approvedNotAppliedCount > 0 ? 'Ready to apply' : undefined}
        />
        <MetricTile
          label="Applied today"
          value={appliedTodayCount}
          colorClass="text-lime"
          icon={<CheckCircle2 className="w-3 h-3" />}
        />
        <MetricTile
          label="Blocked"
          value={blockedCount}
          colorClass={blockedCount > 0 ? 'text-status-red' : 'text-text-muted'}
          icon={<AlertCircle className="w-3 h-3" />}
          note={blockedCount > 0 ? 'Needs investigation' : undefined}
        />
      </div>

      {/* Last activity */}
      {lastActivityAt && (
        <div className="px-4 py-2 border-t border-border bg-surface">
          <p className="text-[10px] text-text-muted">
            Last activity: {new Date(lastActivityAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
            })}
          </p>
        </div>
      )}

      {/* Pipeline note */}
      <div className="px-4 py-2 bg-surface border-t border-border">
        <p className="text-[10px] text-text-muted">
          All actions flow through the proposed_actions pipeline.
          DONNA proposes — director approves — system executes.
        </p>
      </div>
    </div>
  )
}

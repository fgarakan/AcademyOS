'use client'

// Sprint 614 — DONNA COO Intelligence Confidence Display V1
// Shows DONNA's data quality for each COO context dimension.
// Surfaces what's live, what's partial, and what's missing.
// Display only — no DB writes.

import { CheckCircle2, AlertCircle, Ban, HelpCircle } from 'lucide-react'
import type { COOContext } from '@/lib/donna/donnaCOOAnswerEngine'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  COOFieldStatus,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  live: {
    label: 'Live data',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    colorClass: 'text-status-green',
  },
  partial: {
    label: 'Partial',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
  },
  insufficient_data: {
    label: 'No data yet',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
  },
  blocked_by_rls: {
    label: 'Access blocked',
    icon: <Ban className="w-3.5 h-3.5" />,
    colorClass: 'text-status-red',
  },
  blocked_by_schema: {
    label: 'Not configured',
    icon: <Ban className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
  },
}

// ── Dimension row ─────────────────────────────────────────────────────────────

function DimensionRow({
  label,
  status,
  value,
}: {
  label: string
  status: COOFieldStatus
  value: string
}) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0">
      <span className={`shrink-0 ${cfg.colorClass}`}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-primary">{label}</p>
        <p className="text-[10px] text-text-muted">{value}</p>
      </div>
      <span className={`text-[10px] font-medium shrink-0 ${cfg.colorClass}`}>{cfg.label}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNACOOIntelligencePanelProps {
  ctx: COOContext
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNACOOIntelligencePanel({ ctx, className = '' }: DONNACOOIntelligencePanelProps) {
  const liveCount = [
    ctx.healthScoreStatus,
    ctx.attendanceRisk.status,
    ctx.coachWrapUpCoverage.status,
    ctx.pendingReviewItems.status,
    ctx.parentUpdateBacklog.status,
    ctx.levelReadinessFlags.status,
  ].filter(s => s === 'live').length

  const totalDimensions = 6
  const allLive = liveCount === totalDimensions

  return (
    <div className={`rounded-xl border border-border bg-surface-raised overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
          <p className="text-sm font-medium text-text-primary">{DONNA_PUBLIC_NAME} intelligence</p>
        </div>
        <span className={`text-[10px] font-medium ${allLive ? 'text-status-green' : 'text-status-orange'}`}>
          {liveCount}/{totalDimensions} live
        </span>
      </div>

      {/* Dimensions */}
      <div className="px-4 py-1">
        <DimensionRow
          label="Academy health score"
          status={ctx.healthScoreStatus}
          value={ctx.academyHealthScore !== null ? `${ctx.academyHealthScore}%` : 'No score'}
        />
        <DimensionRow
          label="Attendance risk"
          status={ctx.attendanceRisk.status}
          value={`${ctx.attendanceRisk.playerCount} player${ctx.attendanceRisk.playerCount !== 1 ? 's' : ''} at risk`}
        />
        <DimensionRow
          label="Wrap-up coverage"
          status={ctx.coachWrapUpCoverage.status}
          value={`${ctx.coachWrapUpCoverage.completedToday}/${ctx.coachWrapUpCoverage.totalToday} today`}
        />
        <DimensionRow
          label="Review queue"
          status={ctx.pendingReviewItems.status}
          value={`${ctx.pendingReviewItems.count} pending, ${ctx.pendingReviewItems.urgentCount} urgent`}
        />
        <DimensionRow
          label="Parent update backlog"
          status={ctx.parentUpdateBacklog.status}
          value={`${ctx.parentUpdateBacklog.count} pending`}
        />
        <DimensionRow
          label="Level readiness flags"
          status={ctx.levelReadinessFlags.status}
          value={`${ctx.levelReadinessFlags.count} flagged`}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-surface">
        <p className="text-[10px] text-text-muted">
          {allLive
            ? `All dimensions are live. ${DONNA_PUBLIC_NAME} answers reflect real-time academy data.`
            : `Some dimensions are limited. ${DONNA_PUBLIC_NAME} will note reduced confidence in answers.`}
        </p>
      </div>
    </div>
  )
}

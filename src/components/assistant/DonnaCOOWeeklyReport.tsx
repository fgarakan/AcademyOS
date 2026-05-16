'use client'

// Sprint 496 — DONNA Weekly COO Report Integration V1
// Read-only COO report surfacing week-over-week academy operating metrics.
// Props-only data — no DB calls. DONNA voice framing at the top.

import { TrendingUp, TrendingDown, Minus, BarChart2, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface COOReportMetric {
  label: string
  thisWeek: number
  lastWeek: number | null
  unit?: string
  higherIsBetter: boolean
}

export interface COOReportSection {
  title: string
  metrics: COOReportMetric[]
}

export interface DonnaCOOReportData {
  weekLabel: string
  generatedAt: string
  donnaHeadline: string
  sections: COOReportSection[]
  topInsight: string | null
  actionRequired: boolean
  actionSummary: string | null
}

// ── Delta helpers ─────────────────────────────────────────────────────────────

function getDelta(thisWeek: number, lastWeek: number | null): number | null {
  if (lastWeek === null || lastWeek === 0) return null
  return thisWeek - lastWeek
}

function getDeltaPercent(thisWeek: number, lastWeek: number | null): number | null {
  if (lastWeek === null || lastWeek === 0) return null
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}

// ── Metric row ────────────────────────────────────────────────────────────────

function MetricRow({ metric }: { metric: COOReportMetric }) {
  const delta = getDelta(metric.thisWeek, metric.lastWeek)
  const pct = getDeltaPercent(metric.thisWeek, metric.lastWeek)
  const isPositive = delta !== null && (metric.higherIsBetter ? delta > 0 : delta < 0)
  const isNegative = delta !== null && (metric.higherIsBetter ? delta < 0 : delta > 0)

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-[12px] text-text-secondary">{metric.label}</span>

      <div className="flex items-center gap-3">
        {metric.lastWeek !== null && (
          <span className="text-[11px] text-text-muted">
            {metric.lastWeek}{metric.unit}
          </span>
        )}

        <div className="flex items-center gap-1">
          <span className="text-[13px] font-mono font-semibold text-text-primary">
            {metric.thisWeek}{metric.unit}
          </span>

          {delta !== null && (
            <span className={`flex items-center gap-0.5 text-[10px] ${
              isPositive ? 'text-status-green'
              : isNegative ? 'text-status-red'
              : 'text-text-muted'
            }`}>
              {isPositive ? <TrendingUp size={10} />
                : isNegative ? <TrendingDown size={10} />
                : <Minus size={10} />}
              {pct !== null ? `${Math.abs(pct)}%` : delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function ReportSection({
  section,
  defaultOpen = true,
}: {
  section: COOReportSection
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-raised hover:bg-surface transition-colors text-left"
      >
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-medium">
          {section.title}
        </p>
        <span className="text-[10px] text-text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 py-1">
          {section.metrics.map((metric, i) => (
            <MetricRow key={i} metric={metric} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface DonnaCOOWeeklyReportProps {
  data: DonnaCOOReportData
  className?: string
}

export function DonnaCOOWeeklyReport({ data, className }: DonnaCOOWeeklyReportProps) {
  return (
    <div className={`bg-surface border border-lime/20 rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
          <span className="text-lime text-xs font-bold">D</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">DONNA · Weekly COO Report</p>
            <BarChart2 size={11} className="text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary leading-snug">{data.donnaHeadline}</p>
        </div>
      </div>

      {/* Week label */}
      <div className="px-4 py-2 border-b border-border">
        <p className="text-[11px] text-text-muted">{data.weekLabel}</p>
        <p className="text-[10px] text-text-muted">Generated {data.generatedAt}</p>
      </div>

      {/* Top insight */}
      {data.topInsight && (
        <div className="mx-4 mt-3 mb-1 flex items-start gap-2 bg-lime/5 border border-lime/20 rounded-xl px-3 py-2">
          <p className="text-[12px] text-text-secondary leading-snug">{data.topInsight}</p>
        </div>
      )}

      {/* Action required banner */}
      {data.actionRequired && data.actionSummary && (
        <div className="mx-4 mt-2 mb-1 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="text-status-orange mt-0.5 shrink-0" />
          <p className="text-[11px] text-status-orange leading-snug">{data.actionSummary}</p>
        </div>
      )}

      {/* No action needed */}
      {!data.actionRequired && (
        <div className="mx-4 mt-2 mb-1 flex items-center gap-1.5 text-[11px] text-status-green px-1">
          <CheckCircle size={11} />
          No director action required this week.
        </div>
      )}

      {/* Sections */}
      <div className="px-4 py-3 space-y-2">
        {data.sections.map((section, i) => (
          <ReportSection key={i} section={section} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Data source note */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-text-muted italic">
          COO report — read only. Data reflects wrap-up submissions and director approvals from this week.
          Nothing changes from viewing this report.
        </p>
      </div>
    </div>
  )
}

// ── Preset section builders ───────────────────────────────────────────────────

export function buildWrapUpSection(
  sessionsCompleted: number,
  sessionsCompletedLastWeek: number | null,
  wrapUpsSubmitted: number,
  wrapUpsSubmittedLastWeek: number | null,
  observationsCreated: number,
  observationsCreatedLastWeek: number | null,
): COOReportSection {
  return {
    title: 'Coach Wrap-Ups',
    metrics: [
      {
        label: 'Sessions completed',
        thisWeek: sessionsCompleted,
        lastWeek: sessionsCompletedLastWeek,
        higherIsBetter: true,
      },
      {
        label: 'Wrap-ups submitted',
        thisWeek: wrapUpsSubmitted,
        lastWeek: wrapUpsSubmittedLastWeek,
        higherIsBetter: true,
      },
      {
        label: 'Observations created',
        thisWeek: observationsCreated,
        lastWeek: observationsCreatedLastWeek,
        higherIsBetter: true,
      },
    ],
  }
}

export function buildReviewQueueSection(
  itemsPendingReview: number,
  itemsPendingLastWeek: number | null,
  itemsApproved: number,
  itemsApprovedLastWeek: number | null,
  itemsApplied: number,
  itemsAppliedLastWeek: number | null,
): COOReportSection {
  return {
    title: 'Director Review Queue',
    metrics: [
      {
        label: 'Items pending review',
        thisWeek: itemsPendingReview,
        lastWeek: itemsPendingLastWeek,
        higherIsBetter: false,
      },
      {
        label: 'Items approved',
        thisWeek: itemsApproved,
        lastWeek: itemsApprovedLastWeek,
        higherIsBetter: true,
      },
      {
        label: 'Items applied',
        thisWeek: itemsApplied,
        lastWeek: itemsAppliedLastWeek,
        higherIsBetter: true,
      },
    ],
  }
}

'use client'

// Sprint 617 — DONNA Academy Pulse Card V1
// Compact one-glance academy health summary for the director.
// Display only — no DB writes.

import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PulseTrend = 'up' | 'down' | 'stable' | 'unknown'

export interface DONNAAcademyPulseCardProps {
  healthScore: number | null
  trend: PulseTrend
  trendNote: string | null
  urgentItems: number
  atRiskPlayers: number
  isLive: boolean
  lastUpdatedLabel: string | null
  onDrillDown?: () => void
}

// ── Trend config ──────────────────────────────────────────────────────────────

const TREND_CONFIG: Record<
  PulseTrend,
  { icon: React.ReactNode; label: string; colorClass: string }
> = {
  up: {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: 'Improving',
    colorClass: 'text-status-green',
  },
  down: {
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    label: 'Declining',
    colorClass: 'text-status-red',
  },
  stable: {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: 'Stable',
    colorClass: 'text-text-muted',
  },
  unknown: {
    icon: <Activity className="w-3.5 h-3.5" />,
    label: 'Unknown',
    colorClass: 'text-text-muted',
  },
}

// ── Score color ───────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score >= 80) return 'text-lime'
  if (score >= 60) return 'text-status-orange'
  return 'text-status-red'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAAcademyPulseCard({
  healthScore,
  trend,
  trendNote,
  urgentItems,
  atRiskPlayers,
  isLive,
  lastUpdatedLabel,
  onDrillDown,
}: DONNAAcademyPulseCardProps) {
  const trendCfg = TREND_CONFIG[trend]

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-lime" />
          <p className="text-sm font-medium text-text-primary">Academy pulse</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-lime' : 'bg-text-muted'}`} />
          <span className="text-[10px] text-text-muted">{isLive ? 'Live' : 'Demo'}</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-6 px-4 py-4 border-b border-border/50">
        <div>
          <p className="text-[10px] text-text-muted mb-0.5">Health score</p>
          <p className={`text-4xl font-mono font-bold ${scoreColor(healthScore)}`}>
            {healthScore !== null ? `${healthScore}` : '–'}
            {healthScore !== null && <span className="text-xl">%</span>}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-1.5 ${trendCfg.colorClass}`}>
            {trendCfg.icon}
            <span className="text-xs font-medium">{trendCfg.label}</span>
          </div>
          {trendNote && (
            <p className="text-[10px] text-text-muted leading-snug max-w-[140px]">{trendNote}</p>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-4 py-3">
          <p className="text-[10px] text-text-muted">Urgent items</p>
          <p className={`text-xl font-mono font-bold ${urgentItems > 0 ? 'text-status-red' : 'text-text-muted'}`}>
            {urgentItems}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] text-text-muted">At-risk players</p>
          <p className={`text-xl font-mono font-bold ${atRiskPlayers > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
            {atRiskPlayers}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2">
        {lastUpdatedLabel && (
          <p className="text-[10px] text-text-muted">Updated: {lastUpdatedLabel}</p>
        )}
        {onDrillDown && (
          <button
            onClick={onDrillDown}
            className="text-[11px] text-lime hover:text-lime/80 transition-colors ml-auto"
          >
            See details →
          </button>
        )}
      </div>
    </div>
  )
}

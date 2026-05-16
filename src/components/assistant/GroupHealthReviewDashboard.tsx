'use client'

// Sprint 500 — Group Health Review Dashboard V1
// Read-only director panel showing per-group health indicators.
// Props-only data — no DB calls. DONNA framing at the top.

import { Users, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import { getNextBestAction } from '@/lib/donna/kpiNextBestActionMap'
import type { KPISeverity } from '@/lib/donna/kpiNextBestActionMap'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GroupHealthTrend = 'up' | 'down' | 'stable' | 'no_data'

export interface GroupHealthData {
  groupId: string | null
  groupName: string
  coachName: string | null
  sessionsThisWeek: number
  attendanceRate: number | null
  wrapUpSubmissionRate: number | null
  topObservationType: 'positive' | 'concern' | 'mixed' | null
  healthTrend: GroupHealthTrend
  overallScore: 'strong' | 'stable' | 'at_risk' | 'no_data'
  flagCount: number
}

export interface GroupHealthReviewDashboardProps {
  groups: GroupHealthData[]
  overallSeverity: KPISeverity
  onViewGroup?: (groupId: string | null, groupName: string) => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const SCORE_CONFIG: Record<GroupHealthData['overallScore'], {
  label: string
  dotClass: string
  borderClass: string
  textClass: string
}> = {
  strong: {
    label: 'Strong',
    dotClass: 'bg-status-green',
    borderClass: 'border-status-green/20',
    textClass: 'text-status-green',
  },
  stable: {
    label: 'Stable',
    dotClass: 'bg-text-muted',
    borderClass: 'border-border',
    textClass: 'text-text-muted',
  },
  at_risk: {
    label: 'At risk',
    dotClass: 'bg-status-orange',
    borderClass: 'border-status-orange/30',
    textClass: 'text-status-orange',
  },
  no_data: {
    label: 'No data',
    dotClass: 'bg-border',
    borderClass: 'border-border',
    textClass: 'text-text-muted',
  },
}

const TREND_ICON: Record<GroupHealthTrend, React.ReactNode> = {
  up: <TrendingUp size={11} className="text-status-green" />,
  down: <TrendingDown size={11} className="text-status-red" />,
  stable: <Minus size={11} className="text-text-muted" />,
  no_data: <Minus size={11} className="text-text-muted" />,
}

const OBS_TYPE_LABEL: Record<NonNullable<GroupHealthData['topObservationType']>, string> = {
  positive: 'Mostly positive',
  concern: 'Mostly concerns',
  mixed: 'Mixed',
}

// ── Rate display ──────────────────────────────────────────────────────────────

function RatePill({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <span className="text-[10px] text-text-muted">{label}: —</span>
    )
  }
  const color = value >= 80 ? 'text-status-green' : value >= 60 ? 'text-status-orange' : 'text-status-red'
  return (
    <span className="text-[10px] text-text-muted">
      {label}: <span className={`font-mono font-semibold ${color}`}>{value}%</span>
    </span>
  )
}

// ── Group row ─────────────────────────────────────────────────────────────────

function GroupHealthRow({
  group,
  onViewGroup,
}: {
  group: GroupHealthData
  onViewGroup?: (groupId: string | null, groupName: string) => void
}) {
  const score = SCORE_CONFIG[group.overallScore]

  return (
    <button
      onClick={() => onViewGroup?.(group.groupId, group.groupName)}
      className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border bg-surface-raised transition-colors text-left ${score.borderClass} ${
        onViewGroup ? 'hover:border-lime/30 cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Score dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${score.dotClass}`} />

      {/* Group info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-medium text-text-primary">{group.groupName}</span>
          {group.coachName && (
            <span className="text-[10px] text-text-muted">· {group.coachName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <RatePill value={group.attendanceRate} label="Attendance" />
          <RatePill value={group.wrapUpSubmissionRate} label="Wrap-ups" />
          {group.topObservationType && (
            <span className="text-[10px] text-text-muted">
              Obs: {OBS_TYPE_LABEL[group.topObservationType]}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {TREND_ICON[group.healthTrend]}
        <span className={`text-[10px] font-medium ${score.textClass}`}>{score.label}</span>
        {group.flagCount > 0 && (
          <span className="text-[10px] bg-status-orange/10 text-status-orange border border-status-orange/30 px-1.5 py-0.5 rounded-full">
            {group.flagCount} flag{group.flagCount > 1 ? 's' : ''}
          </span>
        )}
        {onViewGroup && <ChevronRight size={12} className="text-text-muted" />}
      </div>
    </button>
  )
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryCounts({ groups }: { groups: GroupHealthData[] }) {
  const strong = groups.filter(g => g.overallScore === 'strong').length
  const stable = groups.filter(g => g.overallScore === 'stable').length
  const atRisk = groups.filter(g => g.overallScore === 'at_risk').length

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
      {strong > 0 && (
        <span className="text-[11px] text-status-green flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green inline-block" />
          {strong} strong
        </span>
      )}
      {stable > 0 && (
        <span className="text-[11px] text-text-muted flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted inline-block" />
          {stable} stable
        </span>
      )}
      {atRisk > 0 && (
        <span className="text-[11px] text-status-orange flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-orange inline-block" />
          {atRisk} at risk
        </span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function GroupHealthReviewDashboard({
  groups,
  overallSeverity,
  onViewGroup,
  className,
}: GroupHealthReviewDashboardProps) {
  const nba = getNextBestAction('group_health', overallSeverity)

  const sortedGroups = [...groups].sort((a, b) => {
    const order = { at_risk: 0, stable: 1, strong: 2, no_data: 3 }
    return order[a.overallScore] - order[b.overallScore]
  })

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Group Health</p>
            <Users size={10} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-primary leading-snug">
            {nba?.donnaSummary ?? 'Reviewing group health status.'}
          </p>
        </div>
      </div>

      {/* Summary counts */}
      {groups.length > 0 && <SummaryCounts groups={groups} />}

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            {overallSeverity === 'no_data'
              ? 'Not enough session history yet to score group health.'
              : 'No groups to review.'}
          </p>
        </div>
      )}

      {/* Group list */}
      {sortedGroups.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          {sortedGroups.map((group, i) => (
            <GroupHealthRow key={i} group={group} onViewGroup={onViewGroup} />
          ))}
        </div>
      )}

      {/* DONNA recommendation */}
      {nba && nba.recommendedAction && nba.actionCta && (
        <div className="px-4 py-3 border-t border-border bg-surface-raised">
          <p className="text-[11px] text-text-muted">{nba.recommendedAction}</p>
        </div>
      )}

      {/* Read-only note */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-text-muted italic">
          Read-only. Group health scores are derived from session and wrap-up data.
        </p>
      </div>
    </div>
  )
}

'use client'

// Sprint 501 — Coach Support Needed Dashboard V1
// Read-only director panel showing coaches who may need support.
// Props-only data — no DB calls. DONNA framing at the top.

import { User, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react'
import { getNextBestAction } from '@/lib/donna/kpiNextBestActionMap'
import type { KPISeverity } from '@/lib/donna/kpiNextBestActionMap'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachSupportLevel = 'high' | 'medium' | 'low'

export type CoachSupportFlag =
  | 'wrap_up_gap'
  | 'no_observations'
  | 'unresolved_follow_ups'
  | 'low_attendance_rate'
  | 'no_recent_activity'

export interface CoachSupportData {
  coachId: string | null
  coachName: string
  role: 'head_coach' | 'coach'
  sessionsTaught: number
  wrapUpsSubmitted: number
  wrapUpGapSessions: number
  lastActivityDate: string | null
  primaryFlag: CoachSupportFlag | null
  supportLevel: CoachSupportLevel
  observationsThisWeek: number
  unresolvedFollowUps: number
}

export interface CoachSupportNeededDashboardProps {
  coaches: CoachSupportData[]
  overallSeverity: KPISeverity
  onViewCoach?: (coachId: string | null, coachName: string) => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const SUPPORT_CONFIG: Record<CoachSupportLevel, {
  label: string
  dotClass: string
  rowClass: string
  textClass: string
}> = {
  high: {
    label: 'Needs support',
    dotClass: 'bg-status-red',
    rowClass: 'border-status-red/20 bg-status-red/5',
    textClass: 'text-status-red',
  },
  medium: {
    label: 'Check in',
    dotClass: 'bg-status-orange',
    rowClass: 'border-status-orange/20 bg-status-orange/5',
    textClass: 'text-status-orange',
  },
  low: {
    label: 'On track',
    dotClass: 'bg-status-green',
    rowClass: 'border-border bg-surface-raised',
    textClass: 'text-status-green',
  },
}

const FLAG_LABELS: Record<CoachSupportFlag, string> = {
  wrap_up_gap: 'Wrap-up gap',
  no_observations: 'No observations',
  unresolved_follow_ups: 'Unresolved follow-ups',
  low_attendance_rate: 'Low session attendance',
  no_recent_activity: 'No recent activity',
}

// ── Coach row ─────────────────────────────────────────────────────────────────

function CoachSupportRow({
  coach,
  onViewCoach,
}: {
  coach: CoachSupportData
  onViewCoach?: (coachId: string | null, coachName: string) => void
}) {
  const support = SUPPORT_CONFIG[coach.supportLevel]
  const wrapUpRate = coach.sessionsTaught > 0
    ? Math.round((coach.wrapUpsSubmitted / coach.sessionsTaught) * 100)
    : null

  return (
    <button
      onClick={() => onViewCoach?.(coach.coachId, coach.coachName)}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors text-left ${support.rowClass} ${
        onViewCoach ? 'hover:border-lime/30 cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Indicator */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${support.dotClass}`} />

      {/* Coach info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-medium text-text-primary">{coach.coachName}</span>
          <span className="text-[10px] text-text-muted capitalize">· {coach.role.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-text-muted">
          {wrapUpRate !== null && (
            <span>Wrap-ups: <span className={`font-mono font-semibold ${
              wrapUpRate >= 80 ? 'text-status-green' : wrapUpRate >= 60 ? 'text-status-orange' : 'text-status-red'
            }`}>{wrapUpRate}%</span></span>
          )}
          {coach.observationsThisWeek > 0 && (
            <span>{coach.observationsThisWeek} obs this week</span>
          )}
          {coach.primaryFlag && (
            <span className={support.textClass}>{FLAG_LABELS[coach.primaryFlag]}</span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {coach.unresolvedFollowUps > 0 && (
          <span className="text-[10px] bg-status-orange/10 text-status-orange border border-status-orange/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <MessageSquare size={9} />
            {coach.unresolvedFollowUps}
          </span>
        )}
        <span className={`text-[10px] font-medium ${support.textClass}`}>{support.label}</span>
        {onViewCoach && <ChevronRight size={12} className="text-text-muted" />}
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachSupportNeededDashboard({
  coaches,
  overallSeverity,
  onViewCoach,
  className,
}: CoachSupportNeededDashboardProps) {
  const nba = getNextBestAction('coach_support_needed', overallSeverity)

  const sortedCoaches = [...coaches].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.supportLevel] - order[b.supportLevel]
  })

  const needSupport = coaches.filter(c => c.supportLevel === 'high').length
  const checkIn = coaches.filter(c => c.supportLevel === 'medium').length

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Coach Support</p>
            <User size={10} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-primary leading-snug">
            {nba?.donnaSummary ?? 'Reviewing coaching team activity.'}
          </p>
        </div>
      </div>

      {/* Summary */}
      {coaches.length > 0 && (needSupport > 0 || checkIn > 0) && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
          {needSupport > 0 && (
            <span className="text-[11px] text-status-red flex items-center gap-1">
              <AlertCircle size={10} />
              {needSupport} need{needSupport === 1 ? 's' : ''} support
            </span>
          )}
          {checkIn > 0 && (
            <span className="text-[11px] text-status-orange">
              {checkIn} check-in{checkIn > 1 ? 's' : ''} recommended
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {coaches.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            {overallSeverity === 'no_data'
              ? 'Not enough coaching activity data yet.'
              : 'All coaches are on track.'}
          </p>
        </div>
      )}

      {/* Coach list */}
      {sortedCoaches.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          {sortedCoaches.map((coach, i) => (
            <CoachSupportRow key={i} coach={coach} onViewCoach={onViewCoach} />
          ))}
        </div>
      )}

      {/* DONNA recommendation */}
      {nba && nba.recommendedAction && nba.actionCta !== '' && (
        <div className="px-4 py-3 border-t border-border bg-surface-raised">
          <p className="text-[11px] text-text-muted">{nba.recommendedAction}</p>
        </div>
      )}

      {/* Read-only note */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-text-muted italic">
          Read-only. Derived from session and wrap-up submission history.
        </p>
      </div>
    </div>
  )
}

// Sprint 600 — DONNA Weekly Operating Loop V1
// DONNA's weekly operating brief — trends across the week.
// Pure TypeScript — no DB reads, no execution.
// Accepts pre-computed weekly stats and returns structured weekly brief.

// ── Types ─────────────────────────────────────────────────────────────────────

export type WeeklyTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data'

export interface WeeklyPlayerStat {
  playerId: string
  playerName: string
  sessionsAttended: number
  sessionsMissed: number
  observationsCount: number
  hasLevelReadinessFlag: boolean
  parentUpdateSent: boolean
}

export interface WeeklySessionStat {
  sessionId: string
  sessionLabel: string
  date: string
  hasWrapUp: boolean
  attendanceRate: number | null
}

export interface WeeklyCoachStat {
  coachId: string
  coachName: string
  sessionsLed: number
  wrapUpsCompleted: number
  observationsSubmitted: number
}

export interface WeeklyOperatingContext {
  weekLabel: string         // e.g. "May 12–16, 2026"
  weekStartDate: string
  weekEndDate: string
  sessions: WeeklySessionStat[]
  players: WeeklyPlayerStat[]
  coaches: WeeklyCoachStat[]
  reviewQueueItemsThisWeek: number
  reviewQueueItemsResolved: number
  parentMessagesSentThisWeek: number
  parentMessagesDraftedThisWeek: number
}

export interface WeeklyTrendItem {
  metric: string
  trend: WeeklyTrend
  value: string
  note: string | null
}

export interface DonnaWeeklyBrief {
  weekLabel: string
  weekStartDate: string
  weekEndDate: string
  totalSessions: number
  wrapUpCompletionRate: number | null     // 0–100
  averageAttendanceRate: number | null    // 0–100
  atRiskPlayerCount: number
  reviewQueueClearanceRate: number | null
  trends: WeeklyTrendItem[]
  topPriorityForNextWeek: string | null
  weekSummary: string
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildDonnaWeeklyBrief(ctx: WeeklyOperatingContext): DonnaWeeklyBrief {
  const { sessions, players, coaches } = ctx

  // Wrap-up completion rate
  const sessionsWithWrapUp = sessions.filter(s => s.hasWrapUp).length
  const wrapUpCompletionRate = sessions.length > 0
    ? Math.round((sessionsWithWrapUp / sessions.length) * 100)
    : null

  // Average attendance rate
  const ratedSessions = sessions.filter(s => s.attendanceRate !== null)
  const averageAttendanceRate = ratedSessions.length > 0
    ? Math.round(ratedSessions.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) / ratedSessions.length)
    : null

  // At-risk players (missed 2+ sessions)
  const atRiskPlayers = players.filter(p => p.sessionsMissed >= 2)

  // Review queue clearance
  const reviewQueueClearanceRate = ctx.reviewQueueItemsThisWeek > 0
    ? Math.round((ctx.reviewQueueItemsResolved / ctx.reviewQueueItemsThisWeek) * 100)
    : null

  // Trends
  const trends: WeeklyTrendItem[] = []

  if (wrapUpCompletionRate !== null) {
    trends.push({
      metric: 'Wrap-up completion',
      trend: wrapUpCompletionRate >= 80 ? 'improving' : wrapUpCompletionRate >= 50 ? 'stable' : 'declining',
      value: `${wrapUpCompletionRate}%`,
      note: wrapUpCompletionRate < 80 ? 'Some coaches missing wrap-ups — follow up.' : null,
    })
  }

  if (averageAttendanceRate !== null) {
    trends.push({
      metric: 'Attendance rate',
      trend: averageAttendanceRate >= 85 ? 'improving' : averageAttendanceRate >= 70 ? 'stable' : 'declining',
      value: `${averageAttendanceRate}%`,
      note: averageAttendanceRate < 70 ? 'Attendance below target — check at-risk players.' : null,
    })
  }

  if (reviewQueueClearanceRate !== null) {
    trends.push({
      metric: 'Review queue clearance',
      trend: reviewQueueClearanceRate >= 80 ? 'improving' : reviewQueueClearanceRate >= 50 ? 'stable' : 'declining',
      value: `${reviewQueueClearanceRate}%`,
      note: reviewQueueClearanceRate < 80 ? 'Review queue building up — director attention needed.' : null,
    })
  }

  // Top priority for next week
  let topPriority: string | null = null
  if (atRiskPlayers.length > 0) {
    topPriority = `Follow up with ${atRiskPlayers.length} player${atRiskPlayers.length > 1 ? 's' : ''} at attendance risk.`
  } else if (wrapUpCompletionRate !== null && wrapUpCompletionRate < 80) {
    topPriority = 'Improve coach wrap-up completion.'
  } else if (reviewQueueClearanceRate !== null && reviewQueueClearanceRate < 80) {
    topPriority = 'Clear the director review queue.'
  }

  // Week summary
  const sessionWord = sessions.length === 1 ? 'session' : 'sessions'
  let weekSummary = `${sessions.length} ${sessionWord} this week.`
  if (averageAttendanceRate !== null) {
    weekSummary += ` Average attendance ${averageAttendanceRate}%.`
  }
  if (atRiskPlayers.length > 0) {
    weekSummary += ` ${atRiskPlayers.length} player${atRiskPlayers.length > 1 ? 's' : ''} at risk.`
  }

  return {
    weekLabel: ctx.weekLabel,
    weekStartDate: ctx.weekStartDate,
    weekEndDate: ctx.weekEndDate,
    totalSessions: sessions.length,
    wrapUpCompletionRate,
    averageAttendanceRate,
    atRiskPlayerCount: atRiskPlayers.length,
    reviewQueueClearanceRate,
    trends,
    topPriorityForNextWeek: topPriority,
    weekSummary,
  }
}

// ── Trend helpers ─────────────────────────────────────────────────────────────

export const TREND_LABELS: Record<WeeklyTrend, string> = {
  improving: 'Improving',
  stable: 'Stable',
  declining: 'Declining',
  insufficient_data: 'Not enough data',
}

export const TREND_COLORS: Record<WeeklyTrend, string> = {
  improving: 'text-status-green',
  stable: 'text-text-muted',
  declining: 'text-status-orange',
  insufficient_data: 'text-text-muted',
}

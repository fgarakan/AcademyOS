// Sprint 482 — Coach KPI Summary V1
// Coach-level KPI rollup: sessions, wrap-ups, attendance, coaching hours.
// Pure TypeScript — no DB calls. Operates on pre-fetched plain-object arrays.
// Used by the coach mobile portal and DONNA coach briefing.

export interface CoachSessionRecord {
  id: string
  scheduledDate: string
  status: string
  groupId: string | null
  groupName: string | null
  hasWrapUp: boolean
  attendedCount: number | null
  scheduledCount: number | null
  durationMin: number | null
}

export interface CoachKpiSummary {
  coachId: string
  windowDays: number
  sessionsTaught: number
  sessionsWithWrapUp: number
  wrapUpRatePct: number | null
  averageAttendancePct: number | null
  totalCoachingHours: number
  groupsCoached: number
  uniqueGroupIds: string[]
  upcomingSessionCount: number
  pendingWrapUpCount: number
  summaryLine: string
}

export interface CoachKpiInput {
  coachId: string
  recentSessions: CoachSessionRecord[]
  upcomingSessions: CoachSessionRecord[]
  windowDays?: number
}

function sessionIsCompleted(status: string): boolean {
  return status === 'completed'
}

function sessionIsUpcoming(status: string): boolean {
  return status === 'planned' || status === 'in_progress'
}

export function buildCoachKpiSummary(input: CoachKpiInput): CoachKpiSummary {
  const windowDays = input.windowDays ?? 28
  const recent = input.recentSessions.filter(s => sessionIsCompleted(s.status))
  const upcoming = input.upcomingSessions.filter(s => sessionIsUpcoming(s.status))

  const sessionsTaught = recent.length
  const sessionsWithWrapUp = recent.filter(s => s.hasWrapUp).length
  const wrapUpRatePct =
    sessionsTaught > 0 ? Math.round((sessionsWithWrapUp / sessionsTaught) * 100) : null

  const sessionsWithAttendance = recent.filter(
    s => s.attendedCount !== null && s.scheduledCount !== null && s.scheduledCount > 0,
  )
  const averageAttendancePct =
    sessionsWithAttendance.length > 0
      ? Math.round(
          sessionsWithAttendance.reduce(
            (sum, s) => sum + (s.attendedCount! / s.scheduledCount!) * 100,
            0,
          ) / sessionsWithAttendance.length,
        )
      : null

  const totalCoachingHours =
    recent.reduce((sum, s) => sum + (s.durationMin ?? 60), 0) / 60

  const uniqueGroupIds = Array.from(
    new Set(recent.map(s => s.groupId).filter((id): id is string => id !== null)),
  )

  const pendingWrapUpCount = upcoming.filter(s => !s.hasWrapUp).length

  return {
    coachId: input.coachId,
    windowDays,
    sessionsTaught,
    sessionsWithWrapUp,
    wrapUpRatePct,
    averageAttendancePct,
    totalCoachingHours: Math.round(totalCoachingHours * 10) / 10,
    groupsCoached: uniqueGroupIds.length,
    uniqueGroupIds,
    upcomingSessionCount: upcoming.length,
    pendingWrapUpCount,
    summaryLine: buildCoachSummaryLine(sessionsTaught, wrapUpRatePct, averageAttendancePct),
  }
}

function buildCoachSummaryLine(
  sessionsTaught: number,
  wrapUpRatePct: number | null,
  attendancePct: number | null,
): string {
  if (sessionsTaught === 0) return 'No sessions taught in this window.'
  const parts: string[] = [`${sessionsTaught.toString()} sessions`]
  if (wrapUpRatePct !== null) parts.push(`${wrapUpRatePct.toString()}% wrap-up rate`)
  if (attendancePct !== null) parts.push(`${attendancePct.toString()}% avg attendance`)
  return parts.join(' · ')
}

export function getCoachWrapUpStatus(summary: CoachKpiSummary): 'excellent' | 'good' | 'needs_attention' | 'no_data' {
  if (summary.wrapUpRatePct === null) return 'no_data'
  if (summary.wrapUpRatePct >= 90) return 'excellent'
  if (summary.wrapUpRatePct >= 70) return 'good'
  return 'needs_attention'
}

export function getCoachAttendanceStatus(summary: CoachKpiSummary): 'healthy' | 'at_risk' | 'critical' | 'no_data' {
  if (summary.averageAttendancePct === null) return 'no_data'
  if (summary.averageAttendancePct >= 80) return 'healthy'
  if (summary.averageAttendancePct >= 65) return 'at_risk'
  return 'critical'
}

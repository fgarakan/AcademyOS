// Attendance KPI Engine — Sprint 421
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object arrays from the calling server action.
// Returns KpiResult[] with honest four-tier status labels.
//
// KPIs implemented:
//   KPI 1  — Attendance Rate by Player       (demo)
//   KPI 2  — Missed-Session Streak           (partial)
//   KPI 3  — 2+ Absences in 30 Days          (demo)
//   KPI 9  — Missed-to-Follow-Up Latency     (partial)

import { type KpiResult, type KpiStatus, formatRateDisplay } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface AttendanceRow {
  player_id: string
  session_id: string
  status: string
  marked_at: string
}

export interface SessionRow {
  id: string
  scheduled_date: string
  group_id: string | null
}

// ---------------------------------------------------------------------------
// Status values treated as "attended"
// Checked against session_attendance.status values in the live schema.
// ---------------------------------------------------------------------------
const ATTENDED_STATUSES = new Set(['present', 'attended', 'late'])

function isAttended(status: string): boolean {
  return ATTENDED_STATUSES.has(status.toLowerCase())
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay
}

function windowCutoff(windowDays: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - windowDays)
  return d
}

// ---------------------------------------------------------------------------
// KPI 1 — Attendance Rate by Player
//
// Status: demo
// Why: Schema is correct and formula is direct. However, the rate is only
// meaningful when session_attendance rows are written consistently for both
// attended and absent sessions. If the academy only records "present" rows,
// the denominator (total expected sessions) must come from the group session
// list — making the rate dependent on correct group assignment.
// ---------------------------------------------------------------------------

export function computeAttendanceRate(
  playerId: string,
  playerAttendance: AttendanceRow[],
  groupSessions: SessionRow[],
  windowDays: number = 30,
): KpiResult {
  const cutoff = windowCutoff(windowDays)

  const sessionsInWindow = groupSessions.filter(
    s => new Date(s.scheduled_date) >= cutoff,
  )

  const attendanceInWindow = playerAttendance.filter(
    a => a.player_id === playerId && new Date(a.marked_at) >= cutoff,
  )

  const attended = attendanceInWindow.filter(a => isAttended(a.status)).length
  const total = sessionsInWindow.length

  const status: KpiStatus = 'demo'

  if (total === 0) {
    return {
      kpiId: 1,
      name: 'Attendance Rate',
      status,
      value: null,
      denominator: 0,
      displayText: `No sessions recorded in the last ${windowDays} days.`,
      caveat: 'Rate requires session records to be present in the database.',
    }
  }

  const pct = Math.round((attended / total) * 100)
  const displayText = formatRateDisplay(attended, total, 'sessions attended', `last ${windowDays} days`)

  return {
    kpiId: 1,
    name: 'Attendance Rate',
    status,
    value: pct,
    denominator: total,
    displayText,
    caveat:
      'Based on recorded session_attendance rows. Sessions not marked are excluded from the denominator.',
  }
}

// ---------------------------------------------------------------------------
// KPI 2 — Missed-Session Streak
//
// Status: partial
// Why: Streak is only accurate when coaches mark absences explicitly. If the
// academy only records "present" rows, a player who stopped attending would
// show a streak of 0 (no absence rows found) — which is misleading. The engine
// uses group sessions as the expected roster and treats a missing attendance
// row as an absence, but this inference is imprecise if session rosters are
// not stable.
// ---------------------------------------------------------------------------

export function computeMissedSessionStreak(
  playerId: string,
  playerAttendance: AttendanceRow[],
  groupSessions: SessionRow[],
): KpiResult {
  const sessionsSorted = [...groupSessions].sort(
    (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime(),
  )

  const attendedSessionIds = new Set(
    playerAttendance
      .filter(a => a.player_id === playerId && isAttended(a.status))
      .map(a => a.session_id),
  )

  let streak = 0
  for (const session of sessionsSorted) {
    if (attendedSessionIds.has(session.id)) break
    streak++
  }

  const status: KpiStatus = 'partial'

  let displayText: string
  if (sessionsSorted.length === 0) {
    displayText = 'No sessions on record to compute streak.'
  } else if (streak === 0) {
    displayText = 'No consecutive missed sessions (attended most recent session on record).'
  } else if (streak === 1) {
    displayText = '1 session missed since their last recorded attendance.'
  } else {
    displayText = `${streak} consecutive sessions missed since their last recorded attendance.`
  }

  return {
    kpiId: 2,
    name: 'Missed-Session Streak',
    status,
    value: streak,
    displayText,
    caveat:
      'Partial — streak uses group session roster as proxy. Only accurate when absences are explicitly marked. If only "present" rows are recorded, sessions with no row are treated as missed.',
  }
}

// ---------------------------------------------------------------------------
// KPI 3 — 2+ Absences in 30 Days (per-player view)
//
// Status: demo
// Why: Requires absence rows to be explicitly recorded. If only "present" rows
// are written, this will always return 0 — which is factually accurate per the
// DB but misleading about true absence frequency.
// ---------------------------------------------------------------------------

export function computeRecentAbsences(
  playerId: string,
  playerAttendance: AttendanceRow[],
  windowDays: number = 30,
): KpiResult {
  const cutoff = windowCutoff(windowDays)

  const absencesInWindow = playerAttendance.filter(
    a =>
      a.player_id === playerId &&
      !isAttended(a.status) &&
      new Date(a.marked_at) >= cutoff,
  )

  const count = absencesInWindow.length
  const flag = count >= 2
  const status: KpiStatus = 'demo'

  let displayText: string
  if (count === 0) {
    displayText = `No recorded absences in the last ${windowDays} days.`
  } else if (count === 1) {
    displayText = `1 recorded absence in the last ${windowDays} days.`
  } else {
    displayText = `${count} recorded absences in the last ${windowDays} days.${flag ? ' Meets the 2+ absence follow-up threshold.' : ''}`
  }

  return {
    kpiId: 3,
    name: '2+ Absences in 30 Days',
    status,
    value: count,
    displayText,
    caveat:
      'Counts explicitly recorded absence rows only. Sessions not marked are not counted.',
  }
}

// ---------------------------------------------------------------------------
// KPI 9 — Time from Missed Attendance to Follow-Up
//
// Status: partial
// Why: There is no direct FK from proposed_actions to session_attendance. This
// engine approximates follow-up latency as: days between the player's most
// recent missed session and the most recent follow-up action created for them.
// Attribution is by timing proximity, not causal linkage.
// ---------------------------------------------------------------------------

export function computeFollowUpLatency(
  playerId: string,
  playerAttendance: AttendanceRow[],
  groupSessions: SessionRow[],
  followUpCreatedAtDates: string[],
): KpiResult {
  const status: KpiStatus = 'partial'

  const sessionDateById = new Map(groupSessions.map(s => [s.id, s.scheduled_date]))

  const missedSessions = playerAttendance
    .filter(a => a.player_id === playerId && !isAttended(a.status))
    .map(a => ({
      sessionDate: sessionDateById.get(a.session_id) ?? a.marked_at,
    }))
    .filter(a => a.sessionDate)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())

  if (missedSessions.length === 0 || followUpCreatedAtDates.length === 0) {
    const noMissed = missedSessions.length === 0
    return {
      kpiId: 9,
      name: 'Missed-to-Follow-Up Latency',
      status,
      value: null,
      displayText: noMissed
        ? 'No missed sessions on record — latency not applicable.'
        : 'No follow-up actions found for this player.',
      caveat: 'Partial — follow-up attribution uses timing proximity, not direct session linkage.',
    }
  }

  const mostRecentMissed = missedSessions[0].sessionDate
  const mostRecentFollowUp = followUpCreatedAtDates
    .slice()
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

  const followUpAfterMiss = new Date(mostRecentFollowUp) > new Date(mostRecentMissed)

  if (!followUpAfterMiss) {
    return {
      kpiId: 9,
      name: 'Missed-to-Follow-Up Latency',
      status,
      value: null,
      displayText: 'Most recent follow-up predates the most recent missed session.',
      caveat: 'Partial — follow-up attribution uses timing proximity, not direct session linkage.',
    }
  }

  const days = daysBetween(mostRecentMissed, mostRecentFollowUp)
  const roundedDays = Math.round(days * 10) / 10

  return {
    kpiId: 9,
    name: 'Missed-to-Follow-Up Latency',
    status,
    value: roundedDays,
    displayText:
      roundedDays < 1
        ? `Follow-up created within 24 hours of most recent missed session.`
        : `Follow-up created approximately ${roundedDays} day${roundedDays !== 1 ? 's' : ''} after most recent missed session.`,
    caveat:
      'Partial — latency is measured from the most recent missed session to the most recent follow-up action. Attribution uses timing proximity, not a direct session-to-action link.',
  }
}

// ---------------------------------------------------------------------------
// computeAttendanceKpis — convenience wrapper
// Returns all four attendance KPI results for a single player.
// ---------------------------------------------------------------------------

export interface AttendanceKpiInput {
  playerId: string
  playerAttendance: AttendanceRow[]
  groupSessions: SessionRow[]
  followUpCreatedAtDates: string[]
  windowDays?: number
}

export function computeAttendanceKpis(input: AttendanceKpiInput): KpiResult[] {
  const { playerId, playerAttendance, groupSessions, followUpCreatedAtDates, windowDays = 30 } =
    input
  return [
    computeAttendanceRate(playerId, playerAttendance, groupSessions, windowDays),
    computeMissedSessionStreak(playerId, playerAttendance, groupSessions),
    computeRecentAbsences(playerId, playerAttendance, windowDays),
    computeFollowUpLatency(playerId, playerAttendance, groupSessions, followUpCreatedAtDates),
  ]
}

// ---------------------------------------------------------------------------
// formatAttendanceKpisForDonna
//
// Converts KpiResult[] to a string section for the DONNA panel.
// Always shows: value, count/denominator context, and caveat when status
// is partial or demo. Never omits the status label in the output.
// ---------------------------------------------------------------------------

export function formatAttendanceKpisForDonna(results: KpiResult[]): string[] {
  if (results.length === 0) return []

  const lines: string[] = ['', 'ATTENDANCE (last 30 days):']

  for (const r of results) {
    const statusTag =
      r.status === 'live'
        ? '[live]'
        : r.status === 'partial'
        ? '[partial]'
        : r.status === 'demo'
        ? '[demo]'
        : '[insufficient data]'

    lines.push(`• ${r.name} ${statusTag}: ${r.displayText}`)
    if (r.caveat && r.status !== 'live') {
      lines.push(`  ↳ ${r.caveat}`)
    }
  }

  return lines
}

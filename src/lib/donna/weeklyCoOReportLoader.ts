// Sprint 520 — Weekly COO Report Live Adapter V1
// Read-only loader: compiles key COO metrics across the last 7 days.
// No aggregation view required. No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklyCoOReport {
  weekLabel: string
  totalSessions: number
  totalAttendanceMarked: number
  totalPresent: number
  attendanceRate: number | null
  wrapUpsSubmitted: number
  wrapUpRate: number | null
  newConcernObservations: number
  reviewQueuePending: number
  reviewQueueApprovedThisWeek: number
  newPlayers: number
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWeeklyCoOReport(
  db: DB,
  academyId: string,
): Promise<WeeklyCoOReport> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()
  const sevenDaysAgoDate = sevenDaysAgoIso.slice(0, 10)

  const weekLabel = `${sevenDaysAgo.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // 1 — sessions this week
  const { data: sessionRows } = await db
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', sevenDaysAgoDate)

  const sessions = sessionRows ?? []
  const sessionIds = sessions.map(s => s.id)
  const totalSessions = sessions.length

  // 2 — attendance
  let totalAttendanceMarked = 0
  let totalPresent = 0

  if (sessionIds.length > 0) {
    const { data: attendRows } = await db
      .from('session_attendance')
      .select('status')
      .in('session_id', sessionIds)

    for (const row of attendRows ?? []) {
      totalAttendanceMarked++
      if (row.status === 'present') totalPresent++
    }
  }

  // 3 — wrap-ups
  let wrapUpsSubmitted = 0

  if (sessionIds.length > 0) {
    const wrapUpSessionIds = new Set<string>()
    const { data: vnRows } = await db
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', sessionIds)

    for (const vn of vnRows ?? []) {
      if (vn.session_id) wrapUpSessionIds.add(vn.session_id)
    }
    wrapUpsSubmitted = wrapUpSessionIds.size
  }

  // 4 — concern observations this week
  const { count: concernCount } = await db
    .from('coach_observations')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('observation_type', 'concern')
    .gte('created_at', sevenDaysAgoIso)

  // 5 — review queue: pending now + approved this week
  const { count: pendingCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')

  const { count: approvedCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'approved')
    .gte('approved_at', sevenDaysAgoIso)

  // 6 — new players this week (by join_date)
  const { count: newPlayerCount } = await db
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .gte('join_date', sevenDaysAgoDate)

  const attendanceRate = totalAttendanceMarked > 0
    ? totalPresent / totalAttendanceMarked
    : null

  const wrapUpRate = totalSessions > 0
    ? wrapUpsSubmitted / totalSessions
    : null

  const fieldStatus: COOFieldStatus = totalSessions > 0 ? 'partial' : 'insufficient_data'

  return {
    weekLabel,
    totalSessions,
    totalAttendanceMarked,
    totalPresent,
    attendanceRate,
    wrapUpsSubmitted,
    wrapUpRate,
    newConcernObservations: concernCount ?? 0,
    reviewQueuePending: pendingCount ?? 0,
    reviewQueueApprovedThisWeek: approvedCount ?? 0,
    newPlayers: newPlayerCount ?? 0,
    fieldStatus,
  }
}

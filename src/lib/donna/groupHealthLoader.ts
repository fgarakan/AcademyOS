// Sprint 517 — Group Health Live Adapter V1
// Read-only loader: basic group health signals from sessions, attendance, and voice_notes.
// No aggregation view required. No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GroupHealthSignal = 'healthy' | 'at_risk' | 'insufficient_data'

export interface GroupHealthSummary {
  groupId: string
  groupName: string
  sessionsLast30Days: number
  presentCount: number
  totalAttendanceMarked: number
  attendanceRate: number | null
  wrapUpsSubmitted: number
  wrapUpRate: number | null
  healthSignal: GroupHealthSignal
}

export interface GroupHealthResult {
  groups: GroupHealthSummary[]
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadGroupHealth(
  db: DB,
  academyId: string,
): Promise<GroupHealthResult> {
  const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  // 1 — active groups
  const { data: groupRows } = await db
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const groups = groupRows ?? []
  if (groups.length === 0) {
    return { groups: [], fieldStatus: 'insufficient_data' }
  }

  const groupIds = groups.map(g => g.id)

  // 2 — sessions last 30 days for these groups
  const { data: sessionRows } = await db
    .from('sessions')
    .select('id, group_id')
    .eq('academy_id', academyId)
    .in('group_id', groupIds)
    .gte('scheduled_date', thirtyDaysAgoDate)

  const sessions = sessionRows ?? []
  const sessionIds = sessions.map(s => s.id)

  // sessions per group
  const sessionsPerGroup = new Map<string, string[]>()
  for (const s of sessions) {
    if (!s.group_id) continue
    const arr = sessionsPerGroup.get(s.group_id) ?? []
    arr.push(s.id)
    sessionsPerGroup.set(s.group_id, arr)
  }

  // 3 — attendance for these sessions
  const presentPerGroup = new Map<string, number>()
  const totalAttendPerGroup = new Map<string, number>()

  if (sessionIds.length > 0) {
    const { data: attendRows } = await db
      .from('session_attendance')
      .select('session_id, status')
      .in('session_id', sessionIds)

    // build session → group lookup
    const sessionToGroup = new Map<string, string>()
    for (const s of sessions) {
      if (s.group_id) sessionToGroup.set(s.id, s.group_id)
    }

    for (const row of attendRows ?? []) {
      const gid = sessionToGroup.get(row.session_id)
      if (!gid) continue
      totalAttendPerGroup.set(gid, (totalAttendPerGroup.get(gid) ?? 0) + 1)
      if (row.status === 'present') {
        presentPerGroup.set(gid, (presentPerGroup.get(gid) ?? 0) + 1)
      }
    }
  }

  // 4 — wrap-ups (voice_notes with session_id) for these sessions
  const wrapUpSessionIds = new Set<string>()

  if (sessionIds.length > 0) {
    const { data: vnRows } = await db
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', sessionIds)

    for (const vn of vnRows ?? []) {
      if (vn.session_id) wrapUpSessionIds.add(vn.session_id)
    }
  }

  // 5 — assemble per-group summaries
  const summaries: GroupHealthSummary[] = groups.map(g => {
    const groupSessionIds = sessionsPerGroup.get(g.id) ?? []
    const sessionCount = groupSessionIds.length
    const present = presentPerGroup.get(g.id) ?? 0
    const totalAttend = totalAttendPerGroup.get(g.id) ?? 0
    const wrapUps = groupSessionIds.filter(sid => wrapUpSessionIds.has(sid)).length

    const attendanceRate = totalAttend > 0 ? present / totalAttend : null
    const wrapUpRate = sessionCount > 0 ? wrapUps / sessionCount : null

    let healthSignal: GroupHealthSignal = 'insufficient_data'
    if (sessionCount > 0) {
      const goodAttendance = attendanceRate === null || attendanceRate >= 0.7
      const goodWrapUp = wrapUpRate === null || wrapUpRate >= 0.5
      healthSignal = goodAttendance && goodWrapUp ? 'healthy' : 'at_risk'
    }

    return {
      groupId: g.id,
      groupName: g.name,
      sessionsLast30Days: sessionCount,
      presentCount: present,
      totalAttendanceMarked: totalAttend,
      attendanceRate,
      wrapUpsSubmitted: wrapUps,
      wrapUpRate,
      healthSignal,
    }
  })

  const hasAnyData = sessions.length > 0
  return {
    groups: summaries,
    fieldStatus: hasAnyData ? 'partial' : 'insufficient_data',
  }
}

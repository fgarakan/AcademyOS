// Sprint 528 — Coach Wrap-Up Attendance Draft V1
// Read-only loader: returns current attendance state for a session as a draft summary.
// Used to pre-populate the wrap-up attendance step with saved attendance records.
// No writes. No migrations. RLS-scoped by academy_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unrecorded'

export interface AttendanceDraftEntry {
  playerId: string
  playerName: string
  status: AttendanceStatus
  markedAt: string | null
  markedBy: string | null
}

export interface WrapUpAttendanceDraftResult {
  entries: AttendanceDraftEntry[]
  presentCount: number
  absentCount: number
  unrecordedCount: number
  isPartiallyFilled: boolean
  hasAnyRecord: boolean
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpAttendanceDraft(
  db: DB,
  sessionId: string,
  academyId: string,
): Promise<WrapUpAttendanceDraftResult> {
  // 1 — session group_id
  const { data: session } = await db
    .from('sessions')
    .select('group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  const groupId = session?.group_id ?? null

  // 2 — rostered player IDs from group membership
  const rosteredPlayerIds: string[] = []
  if (groupId) {
    const { data: memberships } = await db
      .from('group_memberships')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('is_current', true)
      .eq('academy_id', academyId)
    for (const m of memberships ?? []) rosteredPlayerIds.push(m.player_id)
  }

  // 3 — existing attendance records for this session
  const { data: attendanceRows } = await db
    .from('session_attendance')
    .select('player_id, status, marked_at, marked_by')
    .eq('session_id', sessionId)

  const attendanceMap = new Map<string, { status: string; marked_at: string; marked_by: string | null }>()
  for (const row of attendanceRows ?? []) {
    attendanceMap.set(row.player_id, {
      status: row.status,
      marked_at: row.marked_at,
      marked_by: row.marked_by ?? null,
    })
  }

  // 4 — union of rostered + attendance player IDs
  const allPlayerIds = Array.from(
    new Set(rosteredPlayerIds.concat(Array.from(attendanceMap.keys())))
  )

  if (allPlayerIds.length === 0) {
    return {
      entries: [],
      presentCount: 0,
      absentCount: 0,
      unrecordedCount: 0,
      isPartiallyFilled: false,
      hasAnyRecord: false,
    }
  }

  // 5 — player names
  const { data: playerRows } = await db
    .from('players')
    .select('id, full_name, first_name, last_name')
    .in('id', allPlayerIds)
    .eq('academy_id', academyId)

  const nameMap = new Map<string, string>()
  for (const p of playerRows ?? []) {
    nameMap.set(
      p.id,
      (p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) || 'Player',
    )
  }

  // 6 — assemble entries
  const entries: AttendanceDraftEntry[] = allPlayerIds.map(pid => {
    const att = attendanceMap.get(pid)
    const raw = att?.status ?? 'unrecorded'
    const status: AttendanceStatus =
      raw === 'present' || raw === 'absent' || raw === 'late' || raw === 'excused'
        ? raw
        : 'unrecorded'

    return {
      playerId: pid,
      playerName: nameMap.get(pid) ?? 'Player',
      status,
      markedAt: att?.marked_at ?? null,
      markedBy: att?.marked_by ?? null,
    }
  })

  entries.sort((a, b) => a.playerName.localeCompare(b.playerName))

  const presentCount = entries.filter(e => e.status === 'present').length
  const absentCount = entries.filter(e => e.status === 'absent' || e.status === 'late' || e.status === 'excused').length
  const unrecordedCount = entries.filter(e => e.status === 'unrecorded').length
  const hasAnyRecord = attendanceMap.size > 0
  const isPartiallyFilled = hasAnyRecord && unrecordedCount > 0

  return { entries, presentCount, absentCount, unrecordedCount, isPartiallyFilled, hasAnyRecord }
}

// Sprint 527 — Coach Wrap-Up Roster Context V1
// Read-only loader: returns roster for a session's wrap-up context.
// Handles group-based sessions (group_memberships) and attendance-based fallback.
// Merges both to include unrostered attendees. No migrations. RLS-scoped.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Types ─────────────────────────────────────────────────────────────────────

export type WrapUpRosterStatus = 'present' | 'absent' | 'late' | 'excused' | 'unconfirmed'

export interface WrapUpRosterEntry {
  playerId: string
  fullName: string
  attendanceStatus: WrapUpRosterStatus
  isRostered: boolean
}

export interface WrapUpRosterResult {
  players: WrapUpRosterEntry[]
  rosterSource: 'group' | 'attendance' | 'empty'
  groupId: string | null
  totalRostered: number
  totalPresent: number
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpRoster(
  db: DB,
  sessionId: string,
  academyId: string,
): Promise<WrapUpRosterResult> {
  // 1 — session to get group_id
  const { data: session } = await db
    .from('sessions')
    .select('group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  const groupId = session?.group_id ?? null

  // 2 — existing attendance records (source of truth for who was actually there)
  const { data: attendanceRows } = await db
    .from('session_attendance')
    .select('player_id, status')
    .eq('session_id', sessionId)

  const attendanceMap = new Map<string, string>()
  for (const row of attendanceRows ?? []) {
    attendanceMap.set(row.player_id, row.status)
  }

  // 3 — player IDs: from group_memberships if group_id exists, otherwise attendance
  let rosterPlayerIds: string[] = []
  let rosterSource: WrapUpRosterResult['rosterSource'] = 'empty'

  if (groupId) {
    const { data: memberships } = await db
      .from('group_memberships')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('is_current', true)
      .eq('academy_id', academyId)

    rosterPlayerIds = (memberships ?? []).map(m => m.player_id)
    rosterSource = 'group'
  } else if (attendanceMap.size > 0) {
    rosterPlayerIds = Array.from(attendanceMap.keys())
    rosterSource = 'attendance'
  }

  // Merge: include players from attendance who aren't in the roster (unrostered attendees)
  const allPlayerIds = Array.from(
    new Set(rosterPlayerIds.concat(Array.from(attendanceMap.keys())))
  )

  if (allPlayerIds.length === 0) {
    return { players: [], rosterSource: 'empty', groupId, totalRostered: 0, totalPresent: 0 }
  }

  // 4 — player names
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

  const rosteredSet = new Set(rosterPlayerIds)

  const players: WrapUpRosterEntry[] = allPlayerIds.map(pid => {
    const raw = attendanceMap.get(pid) ?? 'unconfirmed'
    const status: WrapUpRosterStatus =
      raw === 'present' || raw === 'absent' || raw === 'late' || raw === 'excused'
        ? raw
        : 'unconfirmed'

    return {
      playerId: pid,
      fullName: nameMap.get(pid) ?? 'Player',
      attendanceStatus: status,
      isRostered: rosteredSet.has(pid),
    }
  })

  // Sort: rostered first, then alphabetical
  players.sort((a, b) => {
    if (a.isRostered !== b.isRostered) return a.isRostered ? -1 : 1
    return a.fullName.localeCompare(b.fullName)
  })

  const totalPresent = players.filter(p => p.attendanceStatus === 'present').length
  const totalRostered = players.filter(p => p.isRostered).length

  return { players, rosterSource, groupId, totalRostered, totalPresent }
}

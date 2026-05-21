// Sprint 438 — Session Attendance Data Layer V1
// Typed query helpers for session attendance management.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: string
  markedAt: string
  markedBy: string | null
  notes: string | null
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceSummary {
  sessionId: string
  total: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

// Fetch attendance records for a session.
export async function fetchSessionAttendance(
  db: SupabaseClient<Database>,
  sessionId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await db
    .from('session_attendance')
    .select('id, session_id, player_id, status, marked_at, marked_by, notes')
    .eq('session_id', sessionId)
    .order('marked_at', { ascending: true })

  if (error) return []
  return (data ?? []).map(row => ({
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    status: row.status,
    markedAt: row.marked_at,
    markedBy: row.marked_by,
    notes: row.notes,
  }))
}

// Compute attendance summary for a session.
export function computeAttendanceSummary(
  sessionId: string,
  records: AttendanceRecord[],
): AttendanceSummary {
  const present = records.filter(r => r.status === 'present').length
  const absent = records.filter(r => r.status === 'absent').length
  const late = records.filter(r => r.status === 'late').length
  const excused = records.filter(r => r.status === 'excused').length
  const total = records.length

  return {
    sessionId,
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
  }
}

// Fetch a player's attendance history across recent sessions.
export interface PlayerAttendanceHistory {
  sessionId: string
  scheduledDate: string
  status: string
  notes: string | null
}

export async function fetchPlayerAttendanceHistory(
  db: SupabaseClient<Database>,
  academyId: string,
  playerId: string,
  limitSessions = 20,
): Promise<PlayerAttendanceHistory[]> {
  const { data, error } = await db
    .from('session_attendance')
    .select('session_id, status, notes, sessions(scheduled_date)')
    .eq('player_id', playerId)
    .order('session_id', { ascending: false })
    .limit(limitSessions)

  if (error) return []

  return (data ?? []).map(row => {
    const session = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
    return {
      sessionId: row.session_id,
      scheduledDate: (session as { scheduled_date?: string } | null)?.scheduled_date ?? '',
      status: row.status,
      notes: row.notes,
    }
  })
}

// Check if attendance has already been marked for a session.
export async function hasAttendanceBeenMarked(
  db: SupabaseClient<Database>,
  sessionId: string,
): Promise<boolean> {
  const { count, error } = await db
    .from('session_attendance')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  return !error && (count ?? 0) > 0
}

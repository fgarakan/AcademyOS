// Sprint 431 — Director Session Timeline Data Layer V1
// Typed query helpers for the director session calendar and timeline view.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type SessionStatus = Database['public']['Enums']['session_status']

export interface SessionTimelineEntry {
  id: string
  name: string | null
  scheduledDate: string
  scheduledTime: string | null
  durationMin: number | null
  status: SessionStatus
  groupId: string | null
  coachId: string
  templateId: string | null
}

// Fetch sessions within a date range for the director timeline view.
export async function fetchSessionsInRange(
  db: SupabaseClient<Database>,
  academyId: string,
  startDate: string,
  endDate: string,
): Promise<SessionTimelineEntry[]> {
  const { data, error } = await db
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, duration_min, status, group_id, coach_id, template_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  if (error) return []
  return (data ?? []).map(s => ({
    id: s.id,
    name: s.name,
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time,
    durationMin: s.duration_min,
    status: s.status,
    groupId: s.group_id,
    coachId: s.coach_id,
    templateId: s.template_id,
  }))
}

// Fetch today's sessions for the director command brief.
export async function fetchTodaySessions(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<SessionTimelineEntry[]> {
  const today = new Date().toISOString().slice(0, 10)
  return fetchSessionsInRange(db, academyId, today, today)
}

// Fetch this week's sessions.
export async function fetchThisWeekSessions(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<SessionTimelineEntry[]> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return fetchSessionsInRange(
    db,
    academyId,
    monday.toISOString().slice(0, 10),
    sunday.toISOString().slice(0, 10),
  )
}

// Returns sessions grouped by date. Useful for the calendar view.
export function groupSessionsByDate(
  sessions: SessionTimelineEntry[],
): Map<string, SessionTimelineEntry[]> {
  const grouped = new Map<string, SessionTimelineEntry[]>()
  for (const session of sessions) {
    const existing = grouped.get(session.scheduledDate) ?? []
    existing.push(session)
    grouped.set(session.scheduledDate, existing)
  }
  return grouped
}

// Returns session coverage stats for a date range.
export interface SessionCoverageStats {
  total: number
  completed: number
  cancelled: number
  pending: number
  missingWrapUp: number
}

export function computeSessionCoverage(sessions: SessionTimelineEntry[]): SessionCoverageStats {
  return {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    pending: sessions.filter(s => s.status === 'planned' || s.status === 'in_progress').length,
    missingWrapUp: sessions.filter(s => s.status === 'planned').length,
  }
}

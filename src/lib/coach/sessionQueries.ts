// Sprint 437 — Coach Session Data Layer V1
// Typed query helpers for the coach sessions view.
// No select('*'). Complements coachWorkspace.ts with typed, named helpers.
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type SessionStatus = Database['public']['Enums']['session_status']

export interface CoachSessionSummary {
  id: string
  name: string | null
  scheduledDate: string
  scheduledTime: string | null
  durationMin: number | null
  status: SessionStatus
  groupId: string | null
  templateId: string | null
  sessionNotes: string | null
}

// Fetch upcoming sessions for a coach (planned + in_progress).
export async function fetchCoachUpcomingSessions(
  db: SupabaseClient<Database>,
  academyId: string,
  coachId: string,
  limit = 20,
): Promise<CoachSessionSummary[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await db
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, duration_min, status, group_id, template_id, session_notes')
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .gte('scheduled_date', today)
    .in('status', ['planned', 'in_progress'])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(limit)

  if (error) return []
  return (data ?? []).map(s => ({
    id: s.id,
    name: s.name,
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time,
    durationMin: s.duration_min,
    status: s.status,
    groupId: s.group_id,
    templateId: s.template_id,
    sessionNotes: s.session_notes,
  }))
}

// Fetch recent completed sessions for a coach (for recap review).
export async function fetchCoachRecentSessions(
  db: SupabaseClient<Database>,
  academyId: string,
  coachId: string,
  limitDays = 14,
  limit = 20,
): Promise<CoachSessionSummary[]> {
  const since = new Date(Date.now() - limitDays * 86_400_000).toISOString().slice(0, 10)

  const { data, error } = await db
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, duration_min, status, group_id, template_id, session_notes')
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .eq('status', 'completed')
    .gte('scheduled_date', since)
    .order('scheduled_date', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []).map(s => ({
    id: s.id,
    name: s.name,
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time,
    durationMin: s.duration_min,
    status: s.status,
    groupId: s.group_id,
    templateId: s.template_id,
    sessionNotes: s.session_notes,
  }))
}

// Fetch a single session with full detail.
export async function fetchSessionById(
  db: SupabaseClient<Database>,
  academyId: string,
  sessionId: string,
): Promise<CoachSessionSummary | null> {
  const { data, error } = await db
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, duration_min, status, group_id, template_id, session_notes')
    .eq('academy_id', academyId)
    .eq('id', sessionId)
    .single()

  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    scheduledDate: data.scheduled_date,
    scheduledTime: data.scheduled_time,
    durationMin: data.duration_min,
    status: data.status,
    groupId: data.group_id,
    templateId: data.template_id,
    sessionNotes: data.session_notes,
  }
}

// Check whether a coach has access to a session (owns it).
export async function verifyCoachSessionAccess(
  db: SupabaseClient<Database>,
  academyId: string,
  coachId: string,
  sessionId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .single()

  return !error && data !== null
}

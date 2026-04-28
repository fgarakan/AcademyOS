import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

type Session = Tables<'sessions'>

export type { Session }

// ── Session queries ──────────────────────────────────────────

export async function getSessionsByGroup(
  db: DB,
  groupId: string,
  from: string,
  to: string
) {
  const { data, error } = await db
    .from('sessions')
    .select(`
      *,
      session_blocks(*, session_block_exercises(*, exercises(name, category))),
      session_attendance(player_id, status)
    `)
    .eq('group_id', groupId)
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date')

  if (error) throw error
  return data
}

export async function getSessionById(db: DB, sessionId: string) {
  const { data, error } = await db
    .from('sessions')
    .select(`
      *,
      session_blocks(*, session_block_exercises(*, exercises(*))),
      session_attendance(*, players(full_name)),
      player_outcomes(*)
    `)
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

// ── Session recommendations ──────────────────────────────────

export async function getPendingSessionRecommendations(db: DB, academyId: string) {
  const { data, error } = await db
    .from('v_session_recommendation_feed')
    .select('*')
    .eq('academy_id', academyId)

  if (error) throw error
  return data
}

export async function scheduleSessionFromRecommendation(
  db: DB,
  sessionRecId: string,
  coachId: string,
  date: string,
  groupId: string,
  templateId?: string
): Promise<{ sessionId: string }> {
  const { data: sessionRec, error: fetchError } = await db
    .from('session_recommendations')
    .select('*, player_recommendations(academy_id)')
    .eq('id', sessionRecId)
    .single()

  if (fetchError) throw fetchError

  const academyId = (sessionRec.player_recommendations as any).academy_id

  const { data: session, error: createError } = await db
    .from('sessions')
    .insert({
      academy_id: academyId,
      group_id: groupId,
      coach_id: coachId,
      template_id: templateId ?? sessionRec.suggested_template_id,
      scheduled_date: date,
      duration_min: sessionRec.target_duration_min ?? 90,
      status: 'planned',
    })
    .select('id')
    .single()

  if (createError) throw createError

  await db
    .from('session_recommendations')
    .update({ status: 'scheduled', executed_session_id: session.id })
    .eq('id', sessionRecId)

  return { sessionId: session.id }
}

// ── Session outcomes ─────────────────────────────────────────

export async function recordSessionOutcome(
  db: DB,
  sessionId: string,
  playerId: string,
  academyId: string,
  recordedBy: string,
  outcome: {
    performance_rating?: number
    energy_level?: number
    engagement_level?: number
    perceived_load?: number
    notes?: string
    highlights?: string[]
    concerns?: string[]
    plan_achieved?: boolean
    recommendation_id?: string
  }
) {
  const { data, error } = await db
    .from('player_outcomes')
    .upsert({
      session_id: sessionId,
      player_id: playerId,
      academy_id: academyId,
      recorded_by: recordedBy,
      ...outcome,
    })
    .select('id')
    .single()

  if (error) throw error

  await db.rpc('process_player_outcomes', { p_session_id: sessionId })

  return data.id
}

// ── Attendance ───────────────────────────────────────────────

export async function markAttendance(
  db: DB,
  sessionId: string,
  attendance: Array<{ player_id: string; status: string; notes?: string }>,
  markedBy: string
) {
  const rows = attendance.map((a) => ({
    session_id: sessionId,
    player_id: a.player_id,
    status: a.status,
    notes: a.notes ?? null,
    marked_by: markedBy,
  }))

  const { error } = await db
    .from('session_attendance')
    .upsert(rows, { onConflict: 'session_id,player_id' })

  if (error) throw error
}

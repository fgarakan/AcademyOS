import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

export type CoachObservation = Tables<'coach_observations'>

// Local interface — regenerate database.types.ts after applying migration 039
export interface PlayerDevelopmentSummary {
  id: string
  academy_id: string
  player_id: string
  created_by: string
  updated_by: string | null
  current_strengths: string[]
  things_to_work_on: string[]
  development_focus: string | null
  coach_summary: string | null
  student_friendly_summary: string | null
  parent_summary: string | null
  show_to_student: boolean
  show_to_parent: boolean
  source: string
  created_at: string
  updated_at: string
}

// ── Coach Observations ──────────────────────────────────────────────────────

export async function getCoachObservations(
  db: DB,
  playerId: string,
  limit = 20
): Promise<CoachObservation[]> {
  const { data, error } = await db
    .from('coach_observations')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function createCoachObservation(
  db: DB,
  input: {
    academy_id: string
    player_id: string
    coach_id: string
    observation_type: string
    content: string
    is_private: boolean
  }
): Promise<CoachObservation> {
  const { data, error } = await db
    .from('coach_observations')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('No data returned from insert')
  return data as CoachObservation
}

// ── Player Development Summary ──────────────────────────────────────────────
// Uses rawDb cast because player_development_summary is not yet in database.types.ts.
// Regenerate types after applying migration 039.

export async function getPlayerDevelopmentSummary(
  db: DB,
  playerId: string
): Promise<PlayerDevelopmentSummary | null> {
  const rawDb = db as any
  const { data, error } = await rawDb
    .from('player_development_summary')
    .select('*')
    .eq('player_id', playerId)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return (data as PlayerDevelopmentSummary) ?? null
}

export async function upsertPlayerDevelopmentSummary(
  db: DB,
  input: {
    academy_id: string
    player_id: string
    created_by: string
    updated_by: string
    current_strengths?: string[]
    things_to_work_on?: string[]
    development_focus?: string | null
    coach_summary?: string | null
    student_friendly_summary?: string | null
    parent_summary?: string | null
    show_to_student?: boolean
    show_to_parent?: boolean
    source?: string
  }
): Promise<PlayerDevelopmentSummary> {
  const rawDb = db as any
  const { data, error } = await rawDb
    .from('player_development_summary')
    .upsert(input, { onConflict: 'player_id' })
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('No data returned from upsert')
  return data as PlayerDevelopmentSummary
}

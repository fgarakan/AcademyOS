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

// ── Voice Notes ────────────────────────────────────────────────────────────
// V1: transcript-first. audio_path is null. processing_status goes pending → parsed
// once the linked observation is created.

export async function createVoiceNoteWithObservation(
  db: DB,
  input: {
    academy_id: string
    player_id: string
    author_id: string
    transcript: string
    observation_type: string
    is_private: boolean
  }
): Promise<CoachObservation> {
  // 1. Insert voice_notes row (no parsed_observation_id yet)
  const { data: vnData, error: vnError } = await db
    .from('voice_notes')
    .insert({
      academy_id: input.academy_id,
      author_id: input.author_id,
      player_id: input.player_id,
      raw_input: input.transcript,
      transcript: input.transcript,
      audio_path: null,
      processing_status: 'pending',
    })
    .select()
    .single()

  if (vnError) throw vnError
  if (!vnData) throw new Error('No data returned from voice_notes insert')

  // 2. Insert coach_observations row linked to the author
  const { data: obsData, error: obsError } = await db
    .from('coach_observations')
    .insert({
      academy_id: input.academy_id,
      player_id: input.player_id,
      coach_id: input.author_id,
      observation_type: input.observation_type,
      content: input.transcript,
      is_private: input.is_private,
    })
    .select()
    .single()

  if (obsError) throw obsError
  if (!obsData) throw new Error('No data returned from coach_observations insert')

  const observation = obsData as CoachObservation

  // 3. Update voice_notes: link observation and mark parsed
  const { error: updateError } = await db
    .from('voice_notes')
    .update({
      parsed_observation_id: observation.id,
      processing_status: 'parsed',
    })
    .eq('id', vnData.id)

  if (updateError) throw updateError

  return observation
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

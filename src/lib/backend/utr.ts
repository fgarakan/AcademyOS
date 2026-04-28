import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'

// ── UTR data management ──────────────────────────────────────

export async function recordUtrRating(
  db: SupabaseClient<Database>,
  academyId: string,
  playerId: string,
  utrValue: number,
  type: 'singles' | 'doubles' = 'singles',
  source: 'manual' | 'api_sync' | 'tournament_result' = 'manual',
  status?: string
): Promise<string> {
  const { data, error } = await db
    .from('player_utr_history')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      utr_value: utrValue,
      utr_type: type,
      utr_status: status ?? null,
      source,
      captured_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  // Trigger signal processing
  await db.rpc('process_utr_update', { p_history_id: data.id })

  return data.id
}

export async function recordMatchResult(
  db: SupabaseClient<Database>,
  academyId: string,
  playerId: string,
  match: {
    match_date: string
    opponent_name?: string
    opponent_utr?: number
    result: 'win' | 'loss'
    score?: string
    tournament_name?: string
    surface?: string
  }
) {
  const { data, error } = await db
    .from('player_utr_matches')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      ...match,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function getUtrProfile(db: SupabaseClient<Database>, playerId: string) {
  const { data, error } = await db
    .from('player_utr_profiles')
    .select('*')
    .eq('player_id', playerId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getUtrHistory(
  db: SupabaseClient<Database>,
  playerId: string,
  type: 'singles' | 'doubles' = 'singles',
  limit = 12
) {
  const { data, error } = await db
    .from('player_utr_history')
    .select('*')
    .eq('player_id', playerId)
    .eq('utr_type', type)
    .order('captured_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getUtrInsights(db: SupabaseClient<Database>, playerId: string) {
  const { data, error } = await db
    .from('player_utr_insights')
    .select('*')
    .eq('player_id', playerId)
    .eq('is_active', true)
    .order('calculated_at', { ascending: false })

  if (error) throw error
  return data
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

export type VPlayerCurriculumDetail = Tables<'v_player_curriculum_detail'>
export type VCurriculumOverview = Tables<'v_curriculum_overview'>

export async function getPlayerCurriculumDomains(
  db: DB,
  playerId: string,
  academyId: string
): Promise<VPlayerCurriculumDetail[]> {
  const { data, error } = await db
    .from('v_player_curriculum_detail')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
  if (error) throw error
  return data ?? []
}

export async function getPlayerCurriculumOverview(
  db: DB,
  playerId: string,
  academyId: string
): Promise<VCurriculumOverview | null> {
  const { data, error } = await db
    .from('v_curriculum_overview')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function assignPlayerCurriculumState(
  db: DB,
  playerId: string,
  academyId: string
): Promise<string> {
  const { data, error } = await db.rpc('assign_player_curriculum_state', {
    p_player_id: playerId,
    p_academy_id: academyId,
  })
  if (error) throw error
  return data
}

export async function evaluatePlayerCurriculumAdvancement(
  db: DB,
  playerId: string,
  academyId: string
): Promise<boolean> {
  const { data, error } = await db.rpc('evaluate_player_curriculum_advancement', {
    p_player_id: playerId,
    p_academy_id: academyId,
  })
  if (error) throw error
  return data
}

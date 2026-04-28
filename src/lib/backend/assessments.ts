import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, Enums } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

type Assessment = Tables<'assessments'>

export type { Assessment }

export async function createAssessment(
  db: DB,
  academyId: string,
  playerId: string,
  assessedBy: string,
  scores: {
    technical_score: number
    tactical_score: number
    movement_score: number
    competition_score: number
    behavioral_score: number
  },
  options?: {
    type?: Enums<'assessment_type'>
    notes?: string
    strengths?: string[]
    weaknesses?: string[]
    priorities?: string[]
    is_baseline?: boolean
    promotion_ready?: boolean
    promotion_notes?: string
    scores_detail?: Record<string, Record<string, number>>
    version_id?: string
  }
) {
  const { data, error } = await db
    .from('assessments')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      assessed_by: assessedBy,
      assessed_date: new Date().toISOString().split('T')[0],
      type: options?.type ?? 'ad_hoc',
      is_baseline: options?.is_baseline ?? false,
      version_id: options?.version_id ?? null,
      ...scores,
      notes: options?.notes ?? null,
      strengths: options?.strengths ?? null,
      weaknesses: options?.weaknesses ?? null,
      priorities: options?.priorities ?? null,
      scores_detail: options?.scores_detail ?? null,
      promotion_ready: options?.promotion_ready ?? false,
      promotion_notes: options?.promotion_notes ?? null,
    })
    .select('id, overall_score')
    .single()

  if (error) throw error
  return data
}

export async function getPlayerAssessments(
  db: DB,
  playerId: string,
  limit = 10
) {
  const { data, error } = await db
    .from('assessments')
    .select('*')
    .eq('player_id', playerId)
    .order('assessed_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getPlacementRecommendations(
  db: DB,
  academyId: string,
  status?: Enums<'placement_status'>
) {
  let query = db
    .from('placement_recommendations')
    .select(`
      *,
      players(full_name, date_of_birth, gender),
      assessments(overall_score, assessed_date)
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function finalizePlacement(
  db: DB,
  recommendationId: string,
  activatorId: string
) {
  const { data, error } = await db.rpc('finalize_player_placement', {
    p_recommendation_id: recommendationId,
    p_activator_id: activatorId,
  })
  if (error) throw error
  return data
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

type VAcademyPriorityQueue = Tables<'v_academy_priority_queue'>
type VRecommendationReviewQueue = Tables<'v_recommendation_review_queue'>

export type { VAcademyPriorityQueue, VRecommendationReviewQueue }

// ── Director dashboard ───────────────────────────────────────

export async function getAcademyPriorityQueue(
  db: DB,
  academyId: string,
  options?: { urgency?: string; limit?: number }
) {
  let query = db
    .from('v_academy_priority_queue')
    .select('*')
    .eq('academy_id', academyId)

  if (options?.urgency) {
    query = query.eq('urgency', options.urgency)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data as VAcademyPriorityQueue[]
}

export async function getRecommendationReviewQueue(
  db: DB,
  academyId: string
) {
  const { data, error } = await db
    .from('v_recommendation_review_queue')
    .select('*')
    .eq('academy_id', academyId)

  if (error) throw error
  return data as VRecommendationReviewQueue[]
}

export async function getGroupSummaries(db: DB, academyId: string) {
  const { data, error } = await db
    .from('v_group_summary')
    .select('*')
    .eq('academy_id', academyId)
    .order('group_name')

  if (error) throw error
  return data
}

export async function getReassessmentPipeline(
  db: DB,
  academyId: string,
  urgency?: 'overdue' | 'due_soon' | 'upcoming'
) {
  let query = db
    .from('v_reassessment_pipeline')
    .select('*')
    .eq('academy_id', academyId)

  if (urgency) {
    query = query.eq('urgency', urgency)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getLearningSystemSummary(db: DB, academyId: string) {
  const { data, error } = await db
    .from('v_learning_system_summary')
    .select('*')
    .eq('academy_id', academyId)

  if (error) throw error
  return data
}

// ── Batch engine run ─────────────────────────────────────────

export async function scoreAllPlayers(db: DB, academyId: string) {
  const { data, error } = await db.rpc('score_academy_players', {
    p_academy_id: academyId,
  })
  if (error) throw error
  return data
}

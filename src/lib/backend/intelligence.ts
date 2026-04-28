import { getSupabaseServer, getSupabaseAdmin } from '../supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

type PlayerBehaviorProfile = Tables<'player_behavior_profiles'>
type PlayerPrediction = Tables<'player_predictions'>
type CoachingMessage = Tables<'coaching_messages'>
type RecommendationReasoning = Tables<'recommendation_reasoning'>
type VPlayerPredictionsLatest = Tables<'v_player_predictions_latest'>
type VCoachingMessagesPending = Tables<'v_coaching_messages_pending'>

// ── Recommendation Reasoning ─────────────────────────────────

export async function getRecommendationReasoning(
  recommendationId: string
): Promise<RecommendationReasoning | null> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('recommendation_reasoning')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .single()
  if (error) return null
  return data
}

export async function getPlayerReasoningHistory(
  playerId: string,
  limit = 10
): Promise<RecommendationReasoning[]> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('recommendation_reasoning')
    .select('*')
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}

// ── Behavioral Profiles ──────────────────────────────────────

export async function getBehaviorProfile(
  playerId: string
): Promise<PlayerBehaviorProfile | null> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('player_behavior_profiles')
    .select('*')
    .eq('player_id', playerId)
    .single()
  if (error) return null
  return data
}

export async function updateBehaviorProfile(
  playerId: string,
  updates: Partial<Pick<
    PlayerBehaviorProfile,
    | 'fatigue_sensitivity'
    | 'volume_response'
    | 'competition_response'
    | 'learning_preference'
    | 'pressure_tolerance'
    | 'recovery_rate'
    | 'coach_observations'
  >>
): Promise<PlayerBehaviorProfile | null> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('player_behavior_profiles')
    .update(updates)
    .eq('player_id', playerId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function calibrateBehaviorProfile(
  playerId: string,
  academyId: string
): Promise<boolean> {
  const db = getSupabaseAdmin()
  const { data, error } = await db.rpc('evaluate_behavior_profile', {
    p_player_id: playerId,
    p_academy_id: academyId,
  })
  if (error) throw error
  return data ?? false
}

// ── Predictions ──────────────────────────────────────────────

export async function getLatestPrediction(
  playerId: string
): Promise<PlayerPrediction | null> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('player_predictions')
    .select('*')
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data
}

export async function getAcademyPredictions(
  academyId: string
): Promise<VPlayerPredictionsLatest[]> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('v_player_predictions_latest')
    .select('*')
    .eq('academy_id', academyId)
  if (error) return []
  return data ?? []
}

export async function generatePredictions(
  playerId: string,
  academyId: string,
  horizonDays = 30
): Promise<string> {
  const db = getSupabaseAdmin()
  const { data, error } = await db.rpc('generate_player_predictions', {
    p_player_id: playerId,
    p_academy_id: academyId,
    p_horizon_days: horizonDays,
  })
  if (error) throw error
  return data
}

// ── Coaching Messages ────────────────────────────────────────

export async function getPendingCoachingMessages(
  academyId: string
): Promise<VCoachingMessagesPending[]> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('v_coaching_messages_pending')
    .select('*')
    .eq('academy_id', academyId)
  if (error) return []
  return data ?? []
}

export async function getPlayerCoachingMessages(
  playerId: string,
  includeSent = false
): Promise<CoachingMessage[]> {
  const db = await getSupabaseServer()
  let query = db
    .from('coaching_messages')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  if (!includeSent) {
    query = query.eq('is_sent', false)
  }
  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function reviewCoachingMessage(
  messageId: string,
  reviewerId: string,
  edits?: { short_message?: string; detailed_message?: string }
): Promise<CoachingMessage | null> {
  const db = await getSupabaseServer()
  const { data, error } = await db
    .from('coaching_messages')
    .update({
      is_reviewed: true,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      ...(edits?.short_message && { edited_short_message: edits.short_message }),
      ...(edits?.detailed_message && { edited_detailed_message: edits.detailed_message }),
    })
    .eq('id', messageId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function sendCoachingMessage(
  messageId: string,
  senderId: string
): Promise<CoachingMessage | null> {
  const db = await getSupabaseServer()

  const { data: existing } = await db
    .from('coaching_messages')
    .select('is_reviewed')
    .eq('id', messageId)
    .single<Pick<CoachingMessage, 'is_reviewed'>>()

  if (!existing?.is_reviewed) {
    throw new Error('Message must be reviewed before sending')
  }

  const { data, error } = await db
    .from('coaching_messages')
    .update({
      is_sent: true,
      sent_by: senderId,
      sent_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function generateCoachingMessage(
  recommendationId: string
): Promise<string | null> {
  const db = getSupabaseAdmin()
  const { data, error } = await db.rpc('generate_coaching_message', {
    p_recommendation_id: recommendationId,
  })
  if (error) throw error
  return data
}

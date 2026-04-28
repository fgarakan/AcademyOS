import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, Enums } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

type Player = Tables<'players'>
type PlayerProgression = Tables<'player_progression'>
type VPlayerSummary = Tables<'v_player_summary'>

// ── Player list ──────────────────────────────────────────────

export async function getPlayerSummaries(db: DB, academyId: string): Promise<VPlayerSummary[]> {
  const { data, error } = await db
    .from('v_player_summary')
    .select('*')
    .eq('academy_id', academyId)
    .order('full_name')

  if (error) throw error
  return data ?? []
}

export async function getPlayerById(db: DB, playerId: string) {
  const { data, error } = await db
    .from('players')
    .select(`
      *,
      player_progression(*),
      player_utr_profiles(*),
      player_load_aggregation(*)
    `)
    .eq('id', playerId)
    .single()

  if (error) throw error
  return data
}

// ── Signals ──────────────────────────────────────────────────

export async function getActiveSignals(db: DB, playerId: string) {
  const { data, error } = await db
    .from('player_development_signals')
    .select('*')
    .eq('player_id', playerId)
    .eq('is_active', true)
    .order('emitted_at', { ascending: false })

  if (error) throw error
  return data
}

export async function resolveSignal(
  db: DB,
  signalId: string,
  resolvedBy: string,
  note?: string
) {
  const { error } = await db.rpc('resolve_signal', {
    p_signal_id: signalId,
    p_resolved_by: resolvedBy,
    p_resolution_note: note,
  })
  if (error) throw error
}

// ── Decision engine ──────────────────────────────────────────

export async function runFullEngine(db: DB, playerId: string, academyId: string) {
  const { data, error } = await db.rpc('run_full_engine', {
    p_player_id: playerId,
    p_academy_id: academyId,
  })
  if (error) throw error
  return data
}

export async function getDecisionScore(db: DB, playerId: string) {
  const { data, error } = await db
    .from('decision_scores')
    .select('*')
    .eq('player_id', playerId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ── Priorities ───────────────────────────────────────────────

export async function getActivePriorities(db: DB, playerId: string) {
  const { data, error } = await db
    .from('player_priorities')
    .select('*')
    .eq('player_id', playerId)
    .eq('is_active', true)
    .order('priority_rank')

  if (error) throw error
  return data
}

// ── Recommendations ──────────────────────────────────────────

export async function getPlayerRecommendations(
  db: DB,
  playerId: string,
  status?: Enums<'recommendation_status'>
) {
  let query = db
    .from('player_recommendations')
    .select(`
      *,
      player_priorities(category, title, priority_rank),
      session_recommendations(*)
    `)
    .eq('player_id', playerId)
    .order('generated_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function approveRecommendation(
  db: DB,
  recommendationId: string,
  reviewerId: string,
  notes?: string
) {
  const { error } = await db
    .from('player_recommendations')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes ?? null,
    })
    .eq('id', recommendationId)

  if (error) throw error
}

export async function overrideRecommendation(
  db: DB,
  recommendationId: string,
  overrideType: 'rejected' | 'modified' | 'replaced' | 'deferred',
  overrideAction: string | undefined,
  overrideReason: string,
  overriddenBy: string
) {
  const { data, error } = await db.rpc('record_recommendation_override', {
    p_recommendation_id: recommendationId,
    p_override_type: overrideType,
    p_override_action: overrideAction ?? '',
    p_override_reason: overrideReason,
    p_overridden_by: overriddenBy,
    p_eval_window_days: 30,
  })
  if (error) throw error
  return data
}

// ── Progress snapshots + time series ─────────────────────────

export async function getProgressSnapshots(db: DB, playerId: string, limit = 10) {
  const { data, error } = await db
    .from('player_progress_snapshots')
    .select('*')
    .eq('player_id', playerId)
    .order('snapshot_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getTimeSeries(
  db: DB,
  playerId: string,
  metric: Enums<'time_series_metric'>,
  limit = 12
) {
  const { data, error } = await db
    .from('v_player_time_series_recent')
    .select('*')
    .eq('player_id', playerId)
    .eq('metric', metric)
    .lte('recency_rank', limit)
    .order('recorded_date', { ascending: true })

  if (error) throw error
  return data
}

export type { Player, PlayerProgression, VPlayerSummary }

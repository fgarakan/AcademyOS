import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ===============================
// PLAYER PROFILE
// ===============================

export async function getPlayerProfileData(
  db: DB,
  playerId: string,
  academyId: string,
  role: string
) {
  // 🚨 kill inference ONLY here
  const rawDb = db as any

  const { data: playerData, error: playerError } = await rawDb
    .from('players')
    .select('*, player_progressions(*), player_utr_profiles(*)')
    .eq('id', playerId)
    .single()

  if (playerError) throw playerError

  const { data: curriculumData } = await rawDb
    .from('player_curriculum_states')
    .select(`
      *,
      curriculum_levels(*, curriculum_stages(*)),
      player_domain_progress(*)
    `)
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .single()

  const { data: signalsData } = await rawDb
    .from('player_development_signals')
    .select('*')
    .eq('player_id', playerId)
    .eq('is_active', true)
    .order('emitted_at', { ascending: false })
    .limit(10)

  let recommendationsData: any[] = []

  if (role !== 'coach') {
    const { data } = await rawDb
      .from('player_recommendations')
      .select('*, recommendation_reasoning(*)')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .in('status', ['pending_review', 'approved'])
      .order('created_at', { ascending: false })
      .limit(5)

    recommendationsData = data ?? []
  }

  const { data: outcomesData } = await rawDb
    .from('player_outcomes')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: loadData } = await rawDb
    .from('player_load_aggregation')
    .select('*')
    .eq('player_id', playerId)
    .single()

  return {
    player: playerData,
    curriculum: curriculumData,
    signals: signalsData ?? [],
    recommendations: recommendationsData,
    outcomes: outcomesData ?? [],
    load: loadData,
  }
}

// ===============================
// OVERRIDE RECOMMENDATION
// ===============================

export async function overrideRecommendation(
  db: DB,
  recommendationId: string,
  reason: string,
  overriderId: string,
  overrideType: 'rejected' | 'modified' | 'replaced' | 'deferred' = 'rejected'
) {
  const rawDb = db as any

  const { data: rec, error: fetchError } = await rawDb
    .from('player_recommendations')
    .select('academy_id, player_id, recommendation_type, title')
    .eq('id', recommendationId)
    .single()

  if (fetchError || !rec) {
    throw fetchError ?? new Error('Recommendation not found')
  }

  const { error: insertError } = await rawDb
    .from('recommendation_overrides')
    .insert({
      recommendation_id: recommendationId,
      academy_id: rec.academy_id,
      player_id: rec.player_id,
      original_rec_type: rec.recommendation_type,
      original_title: rec.title,
      override_type: overrideType,
      override_reason: reason,
      overridden_by: overriderId,
    })

  if (insertError) throw insertError

  const { error: updateError } = await rawDb
    .from('player_recommendations')
    .update({ status: 'overridden' })
    .eq('id', recommendationId)

  if (updateError) throw updateError
}
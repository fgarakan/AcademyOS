// Sprint 991 — DONNA Player Development Context Retrieval V1
// Safe read-only retrieval of player development signals for DONNA context.
// Server-side only. RLS enforced. No raw private data returned.
//
// Returns aggregated signals only — no player names in bulk queries.
// Individual player data requires explicit director intent with player ID.

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Player development summary ────────────────────────────────────────────────

export interface PlayerDevelopmentSummary {
  totalActivePlayers: number
  playersWithCurriculumLevel: number
  playersWithoutCurriculumLevel: number
  playersNeedingPlacement: number
  advancementEligibleCount: number
  /** Distribution by curriculum stage (no player names) */
  stageDistribution: Record<string, number>
  /** Top attention flags (counts only) */
  attentionFlags: {
    assessmentOverdue: number
    noRecentObservation: number
    advancementEligible: number
  }
}

export interface PlayerDevelopmentRetrievalResult {
  summary: PlayerDevelopmentSummary
  retrievedAt: string
  errors: string[]
}

// ── Retrieval function ────────────────────────────────────────────────────────

export async function retrievePlayerDevelopmentContext(
  supabase: SupabaseClient,
  academyId: string,
): Promise<PlayerDevelopmentRetrievalResult> {
  const errors: string[] = []
  let totalActivePlayers = 0
  let playersWithCurriculumLevel = 0
  let playersWithoutCurriculumLevel = 0
  let playersNeedingPlacement = 0
  let advancementEligibleCount = 0
  let assessmentOverdue = 0

  // 1. Total active players
  try {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'active')
    totalActivePlayers = count ?? 0
  } catch { errors.push('total_active_players: failed') }

  // 2. Players with curriculum level
  try {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .not('current_level_id', 'is', null)
    playersWithCurriculumLevel = count ?? 0
    playersWithoutCurriculumLevel = Math.max(0, totalActivePlayers - playersWithCurriculumLevel)
  } catch { errors.push('curriculum_level_count: failed') }

  // 3. Pending placement
  try {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_placement')
    playersNeedingPlacement = count ?? 0
  } catch { errors.push('pending_placement: failed') }

  // 4. Advancement eligible (via view)
  try {
    const rawDb = supabase as any
    const { count } = await rawDb
      .from('v_player_curriculum_summary')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('advancement_eligible', true)
    advancementEligibleCount = count ?? 0
  } catch { errors.push('advancement_eligible: failed (view may not exist)') }

  // 5. Assessment overdue
  try {
    const now = new Date().toISOString()
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .lt('next_assessment_due', now)
    assessmentOverdue = count ?? 0
  } catch { errors.push('assessment_overdue: failed') }

  return {
    summary: {
      totalActivePlayers,
      playersWithCurriculumLevel,
      playersWithoutCurriculumLevel,
      playersNeedingPlacement,
      advancementEligibleCount,
      stageDistribution: {}, // V2: requires join with curriculum_levels
      attentionFlags: {
        assessmentOverdue,
        noRecentObservation: 0, // V2: requires coach observation join
        advancementEligible: advancementEligibleCount,
      },
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}

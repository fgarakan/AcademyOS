// Mega Sprint 2561–2590 — DONNA Academy Intelligence Loader V1
//
// Server-side DB loader. Runs 4 queries (players, curriculum states,
// recommendations, pending action count) to build a full
// AcademyIntelligencePacket without N+1 queries.
//
// Always non-fatal — returns null on any error.
// Uses rawDb = db as any pattern to prevent TS2589 on deep schema types.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildAcademyIntelligencePacket,
  type AcademyIntelligencePacket,
  type RawPlayerRow,
  type RawCurriculumStateRow,
  type RawRecRow,
} from './academyIntelligenceEngine'

export async function loadAcademyIntelligencePacket(
  supabase: SupabaseClient,
  academyId: string,
): Promise<AcademyIntelligencePacket | null> {
  try {
    const rawDb = supabase as any

    // Query 1: All active players
    const { data: playersRaw } = await rawDb
      .from('players')
      .select('id, full_name')
      .eq('academy_id', academyId)
      .eq('player_status', 'active')
      .limit(100)

    const players: RawPlayerRow[] = playersRaw ?? []
    const playerIds = players.map((p: RawPlayerRow) => p.id)

    // Query 2: Curriculum states (advancement eligibility)
    let curriculumStates: RawCurriculumStateRow[] = []
    if (playerIds.length > 0) {
      const { data: statesRaw } = await rawDb
        .from('player_curriculum_states')
        .select('player_id, advancement_eligible')
        .in('player_id', playerIds)
      if (statesRaw) curriculumStates = statesRaw
    }

    // Query 3: All active recommendations across academy
    // Join limited to playerIds to stay within RLS scope.
    // Uses sentinel UUID when no players exist to avoid an empty IN clause.
    const SENTINEL = '00000000-0000-0000-0000-000000000000'
    const { data: recsRaw } = await rawDb
      .from('player_recommendations')
      .select('id, player_id, title, recommendation_type, confidence_score, status, urgency, updated_at, expires_at')
      .eq('academy_id', academyId)
      .not('status', 'in', '("completed","expired","rejected","overridden")')
      .in('player_id', playerIds.length > 0 ? playerIds : [SENTINEL])
      .order('updated_at', { ascending: true })
      .limit(50)

    const recommendations: RawRecRow[] = recsRaw ?? []

    // Query 4: Count of pending proposed_actions
    const { count: pendingActionsCount } = await rawDb
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    return buildAcademyIntelligencePacket(
      academyId,
      players,
      curriculumStates,
      recommendations,
      pendingActionsCount ?? 0,
    )
  } catch {
    return null
  }
}

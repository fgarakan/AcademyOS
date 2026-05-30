// Sprint 990 — DONNA Academy State Retrieval V1
// Safe read-only retrieval of academy-wide operational state.
// Server-side only — uses Supabase with full RLS enforcement.
// No raw private data returned. Counts and flags only.
//
// This module provides the DB-backed version of AcademyStateSummary.
// Sprint 979 built the type; Sprint 990 wires the live query.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AcademyStateSummary } from './types'

// ── Retrieval result ──────────────────────────────────────────────────────────

export interface AcademyStateRetrievalResult {
  summary: AcademyStateSummary
  retrievedAt: string
  errors: string[]
}

// ── Main retrieval function ───────────────────────────────────────────────────

/**
 * Retrieve safe academy state from Supabase.
 * Returns counts and flags only — no player names, no coach notes.
 * All queries use the provided Supabase client which enforces RLS.
 * Errors are non-fatal — partial data is returned.
 *
 * Note: academyId is used to scope queries in addition to RLS.
 * Server-side only — never call from client components.
 */
export async function retrieveAcademyState(
  supabase: SupabaseClient,
  academyId: string,
): Promise<AcademyStateRetrievalResult> {
  const today = new Date().toISOString().slice(0, 10)
  const errors: string[] = []

  let pendingReviewCount = 0
  let todaySessionCount = 0
  let hasMissingRecaps = false
  let activePlayers = 0
  let hasPlayersNeedingPlacement = false
  let hasAdvancementEligiblePlayers = false

  // 1. Pending review count
  try {
    const { count } = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
    pendingReviewCount = count ?? 0
  } catch {
    errors.push('pending_review_count: query failed')
  }

  // 2. Today's sessions
  try {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('scheduled_date', today)
    todaySessionCount = count ?? 0
  } catch {
    errors.push('today_session_count: query failed')
  }

  // 3. Missing recaps (past sessions not completed)
  try {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .lt('scheduled_date', today)
      .in('status', ['planned', 'in_progress'])
    hasMissingRecaps = (count ?? 0) > 0
  } catch {
    errors.push('missing_recaps: query failed')
  }

  // 4. Active players count
  try {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'active')
    activePlayers = count ?? 0
  } catch {
    errors.push('active_players: query failed')
  }

  // 5. Players needing placement
  try {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_placement')
    hasPlayersNeedingPlacement = (count ?? 0) > 0
  } catch {
    errors.push('players_needing_placement: query failed')
  }

  // 6. Advancement-eligible (via view — rawDb cast for TS2589)
  try {
    const rawDb = supabase as any
    const { count } = await rawDb
      .from('v_player_curriculum_summary')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('advancement_eligible', true)
    hasAdvancementEligiblePlayers = (count ?? 0) > 0
  } catch {
    errors.push('advancement_eligible: query failed (view may not exist)')
  }

  const health: AcademyStateSummary['academyHealthSignal'] =
    pendingReviewCount >= 10 ? 'critical'
    : pendingReviewCount >= 3 || hasMissingRecaps ? 'attention_needed'
    : pendingReviewCount === 0 && !hasMissingRecaps ? 'on_track'
    : 'attention_needed'

  return {
    summary: {
      pendingReviewCount,
      todaySessionCount,
      hasMissingRecaps,
      activePlayers,
      hasPlayersNeedingPlacement,
      hasAdvancementEligiblePlayers,
      academyHealthSignal: health,
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}

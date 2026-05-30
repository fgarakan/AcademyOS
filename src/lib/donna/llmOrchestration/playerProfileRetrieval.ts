// Sprint 1003 — DONNA Player Profile Retrieval V1
// Safe read-only director-facing player profile summary.
// Server-side only — uses Supabase with full RLS enforcement.
//
// Returns director-safe signals only:
//   - Current curriculum level label (not raw ID)
//   - Player status
//   - Advancement eligibility flag
//   - Active priority count
//   - Recent session count (last 30 days)
//   - Evidence count
//   - Assessment overdue flag
//
// NEVER returns:
//   - Raw coach notes or observations
//   - Assessment scores
//   - Behavioral flags
//   - Sensitive notes
//   - Player name (LLM doesn't need it — director is already on the player page)
//   - Raw database IDs in user-facing summary
//   - Anything parent or player facing

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Output type ───────────────────────────────────────────────────────────────

export interface PlayerProfileSummary {
  /** Current curriculum level human label (e.g. "Orange 2") — safe to show */
  currentLevelLabel: string | null
  /** Player status (active, pending_placement, on_hold) */
  playerStatus: string | null
  /** Whether the player is currently marked advancement-eligible */
  advancementEligible: boolean
  /** Number of active (non-completed) priorities */
  activePriorityCount: number
  /** Number of sessions this player attended in the last 30 days */
  recentSessionCount: number
  /** Number of gate evidence records (development evidence count) */
  evidenceCount: number
  /** Whether the player has an overdue assessment */
  assessmentOverdue: boolean
}

export interface PlayerProfileRetrievalResult {
  summary: PlayerProfileSummary
  retrievedAt: string
  errors: string[]
}

// ── Retrieval function ────────────────────────────────────────────────────────

/**
 * Retrieve a director-safe player profile summary.
 * All queries use the provided Supabase client which enforces RLS.
 * academyId scopes queries in addition to RLS.
 * Partial failures are non-fatal — partial data returned with errors noted.
 * Never throws.
 */
export async function retrievePlayerProfileSummary(
  supabase: SupabaseClient,
  playerId: string,
  academyId: string,
): Promise<PlayerProfileRetrievalResult> {
  const errors: string[] = []
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const now = new Date().toISOString()

  let currentLevelLabel: string | null = null
  let playerStatus: string | null = null
  let advancementEligible = false
  let activePriorityCount = 0
  let recentSessionCount = 0
  let evidenceCount = 0
  let assessmentOverdue = false

  // 1. Player status and curriculum level (via v_player_summary or players + join)
  try {
    const rawDb = supabase as any
    const { data: player } = await rawDb
      .from('v_player_summary')
      .select('player_status, current_level_id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .single()

    if (player) {
      playerStatus = player.player_status ?? null

      // Resolve level label from curriculum_levels if level ID exists
      if (player.current_level_id) {
        const { data: level } = await supabase
          .from('curriculum_levels')
          .select('name')
          .eq('id', player.current_level_id)
          .single()
        currentLevelLabel = level?.name ?? null
      }
    }
  } catch { errors.push('player_status: query failed') }

  // 2. Advancement eligibility (from v_player_curriculum_summary)
  try {
    const rawDb = supabase as any
    const { data: curriculumRow } = await rawDb
      .from('v_player_curriculum_summary')
      .select('advancement_eligible')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .single()
    advancementEligible = curriculumRow?.advancement_eligible === true
  } catch { errors.push('advancement_eligible: query failed (view may not exist)') }

  // 3. Active priority count (player_priorities table)
  try {
    const { count } = await supabase
      .from('player_priorities')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('is_active', true)
    activePriorityCount = count ?? 0
  } catch { errors.push('active_priority_count: query failed') }

  // 4. Recent session count (sessions where this player's group is involved, last 30 days)
  // Using session_attendance as the reliable source for actual attendance
  try {
    const { count } = await supabase
      .from('session_attendance')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .gte('session_date', thirtyDaysAgo)
    recentSessionCount = count ?? 0
  } catch { errors.push('recent_session_count: query failed (session_attendance may not have session_date)') }

  // 5. Evidence count (player_gate_status — evidence submissions count)
  try {
    const { data: gateRows } = await (supabase as any)
      .from('player_gate_status')
      .select('evidence_count')
      .eq('player_id', playerId)
    if (gateRows && Array.isArray(gateRows)) {
      evidenceCount = gateRows.reduce((sum: number, row: { evidence_count: number }) => sum + (row.evidence_count ?? 0), 0)
    }
  } catch { errors.push('evidence_count: query failed (player_gate_status may not exist)') }

  // 6. Assessment overdue (next_assessment_due in the past)
  try {
    const { data: player } = await supabase
      .from('players')
      .select('next_assessment_due')
      .eq('id', playerId)
      .eq('academy_id', academyId)
      .single()
    assessmentOverdue = !!(player?.next_assessment_due && player.next_assessment_due < now)
  } catch { errors.push('assessment_overdue: query failed') }

  return {
    summary: {
      currentLevelLabel,
      playerStatus,
      advancementEligible,
      activePriorityCount,
      recentSessionCount,
      evidenceCount,
      assessmentOverdue,
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}

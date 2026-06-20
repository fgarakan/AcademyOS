'use server'

// Mega Sprint 3181–3210 — DONNA Atomic Loop Activation Engine V1
// Centralized live academy signal fetcher.
//
// Called when the DONNA panel opens (director role only).
// Returns the missing signals that buildLivePageState needs so that
// all live-state-aware completion paths, TaskResolver branches,
// PageIntelligence overrides, and RealitySnapshot sections
// receive real academy data instead of null.
//
// Rules:
//   - All queries are RLS-scoped via academy_id from server-side auth
//   - Read-only: no mutations, no proposed_actions created
//   - Returns null for any signal that could not be determined
//   - Never fabricates values
//   - All 6 queries run in parallel to minimise panel-open latency

import { getSupabaseServer } from '@/lib/supabase/server'

// ── Signal result type ─────────────────────────────────────────────────────────

export interface DonnaAcademySignals {
  /** Any players have curriculum states → spine is effectively active */
  curriculumSpineActive: boolean | null
  /** Active players without a curriculum level assigned */
  playersMissingCurriculumLevel: number | null
  /** Players in pending_placement / placement_in_progress / pending_approval */
  placementQueueCount: number | null
  /** Players with advancement_eligible = true */
  levelUpQueueCount: number | null
  /** Distinct players with at least one active development signal */
  playersNeedingAttention: number | null
  /** Active players whose last_assessed_at is null or older than 90 days */
  playersWithoutAssessment: number | null
  /** Pending-review proposed_actions with target_module = parent_communication */
  pendingParentApprovals: number | null
  /** Pending-review proposed_actions with target_module = session_wrap_up_v1 */
  pendingCoachApprovals: number | null
  /** Total active players (status = 'active') */
  activePlayerCount: number | null
  /** Active coaches + head coaches in academy_memberships */
  activeCoachCount: number | null
  /** Sessions scheduled in the next 7 days (not completed) */
  upcomingSessions: number | null
  /** Upcoming sessions with no coach assigned */
  unassignedSessions: number | null
  /** ISO timestamp of signal fetch */
  fetchedAt: string
}

// ── Empty / error result ───────────────────────────────────────────────────────

function emptySignals(): DonnaAcademySignals {
  return {
    curriculumSpineActive:        null,
    playersMissingCurriculumLevel: null,
    placementQueueCount:          null,
    levelUpQueueCount:            null,
    playersNeedingAttention:      null,
    playersWithoutAssessment:     null,
    pendingParentApprovals:       null,
    pendingCoachApprovals:        null,
    activePlayerCount:            null,
    activeCoachCount:             null,
    upcomingSessions:             null,
    unassignedSessions:           null,
    fetchedAt:                    new Date().toISOString(),
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function getDonnaAcademySignalsAction(): Promise<DonnaAcademySignals> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return emptySignals()

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    if (!profile?.academy_id) return emptySignals()

    const academyId: string = profile.academy_id
    const rawDb = supabase as any

    // Date boundaries
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString()

    const today = new Date()
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    const todayStr       = today.toISOString().split('T')[0]
    const sevenDaysStr   = sevenDaysLater.toISOString().split('T')[0]

    // ── 6 parallel queries ────────────────────────────────────────────────────

    const [
      playersResult,
      curricStatesResult,
      signalsResult,
      proposedActionsResult,
      coachCountResult,
      sessionsResult,
    ] = await Promise.all([

      // 1. Players — status, level, last assessment
      rawDb
        .from('players')
        .select('id, status, current_level_id, last_assessed_at')
        .eq('academy_id', academyId)
        .in('status', [
          'pending_placement',
          'placement_in_progress',
          'pending_approval',
          'active',
          'reassessment_due',
        ]),

      // 2. Curriculum states — who has a level, who is advancement-eligible
      rawDb
        .from('player_curriculum_states')
        .select('player_id, advancement_eligible')
        .eq('academy_id', academyId),

      // 3. Active development signals — distinct players needing attention
      rawDb
        .from('player_development_signals')
        .select('player_id')
        .eq('academy_id', academyId)
        .eq('is_active', true),

      // 4. Proposed actions — breakdown by module for approval counts
      rawDb
        .from('proposed_actions')
        .select('target_module')
        .eq('academy_id', academyId)
        .eq('status', 'pending_review'),

      // 5. Coach count
      rawDb
        .from('academy_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .in('role', ['coach', 'head_coach'])
        .eq('is_active', true),

      // 6. Upcoming sessions
      rawDb
        .from('sessions')
        .select('id, coach_id')
        .eq('academy_id', academyId)
        .gte('scheduled_date', todayStr)
        .lt('scheduled_date', sevenDaysStr)
        .not('status', 'eq', 'completed'),
    ])

    // ── Derive signals ────────────────────────────────────────────────────────

    const players = (playersResult.data ?? []) as Array<{
      id: string
      status: string
      current_level_id: string | null
      last_assessed_at: string | null
    }>

    const activePlayers = players.filter(p => p.status === 'active')
    const activePlayerCount = activePlayers.length

    const placementQueueCount = players.filter(p =>
      p.status === 'pending_placement' ||
      p.status === 'placement_in_progress' ||
      p.status === 'pending_approval'
    ).length

    const curricStates = (curricStatesResult.data ?? []) as Array<{
      player_id: string
      advancement_eligible: boolean
    }>

    // Spine active = at least one player has been assigned a curriculum state
    const curriculumSpineActive = curricStates.length > 0

    const levelUpQueueCount = curricStates.filter(s => s.advancement_eligible === true).length

    const playerIdsWithLevel = new Set(curricStates.map(s => s.player_id))
    const playersMissingCurriculumLevel = activePlayers.filter(
      p => !playerIdsWithLevel.has(p.id)
    ).length

    const playersWithoutAssessment = activePlayers.filter(p => {
      if (p.last_assessed_at === null) return true
      return p.last_assessed_at < ninetyDaysAgoStr
    }).length

    const signalRows = (signalsResult.data ?? []) as Array<{ player_id: string }>
    const playersNeedingAttention = new Set(signalRows.map(s => s.player_id)).size

    const proposedRows = (proposedActionsResult.data ?? []) as Array<{ target_module: string }>
    const pendingParentApprovals = proposedRows.filter(
      r => r.target_module === 'parent_communication'
    ).length
    const pendingCoachApprovals = proposedRows.filter(
      r => r.target_module === 'session_wrap_up_v1'
    ).length

    const activeCoachCount = coachCountResult.count ?? 0

    const sessionRows = (sessionsResult.data ?? []) as Array<{
      id: string
      coach_id: string | null
    }>
    const upcomingSessions = sessionRows.length
    const unassignedSessions = sessionRows.filter(s => s.coach_id === null).length

    return {
      curriculumSpineActive,
      playersMissingCurriculumLevel,
      placementQueueCount,
      levelUpQueueCount,
      playersNeedingAttention,
      playersWithoutAssessment,
      pendingParentApprovals,
      pendingCoachApprovals,
      activePlayerCount,
      activeCoachCount,
      upcomingSessions,
      unassignedSessions,
      fetchedAt: new Date().toISOString(),
    }

  } catch {
    return emptySignals()
  }
}

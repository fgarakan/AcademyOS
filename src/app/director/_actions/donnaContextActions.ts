'use server'

// Donna Context Retrieval Server Actions — read-only, no writes, no OpenAI, no Realtime.
// Called from DonnaAssistantButton (client component) via Server Action protocol.
// Returns deterministic summaries derived from real academy data.
// All summaries are evidence-based — no hallucination, honest fallbacks when data is missing.

import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import type {
  DonnaContextType,
  DonnaContextSummary,
} from '@/components/assistant/donnaContextTypes'
import { makeFallbackSummary } from '@/components/assistant/donnaContextTypes'

// ---------------------------------------------------------------------------
// Academy ID + authenticated user ID resolution
// Sprint 865: extended to return userId alongside academyId.
// userId is the server-side auth user id — used as the coach identity anchor.
// All existing call sites destructure only { supabase, academyId } — backward compatible.
// ---------------------------------------------------------------------------

async function resolveAcademyId(): Promise<{
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
  academyId: string | null
  userId: string | null  // Sprint 865 — authenticated user id for coach identity
}> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, academyId: null, userId: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  return { supabase, academyId: profile?.academy_id ?? null, userId: user.id }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function fetchDonnaContext(
  contextType: DonnaContextType,
  params?: { playerId?: string; coachId?: string; sessionId?: string; templateId?: string },
): Promise<DonnaContextSummary> {
  try {
    // Sprint 865: destructure userId for coach identity verification
    const { supabase, academyId, userId } = await resolveAcademyId()
    if (!academyId) {
      return makeFallbackSummary(contextType, 'Academy context is unavailable. Please sign in.')
    }

    // Sprint 865: Coach contexts require server-side authenticated user id.
    // params?.coachId is NEVER used as the identity anchor for coach-scoped queries.
    if (
      !userId &&
      (contextType === 'coach_home_context' ||
        contextType === 'coach_players_context' ||
        contextType === 'coach_session_context' ||
        contextType === 'coach_wrap_up_context')
    ) {
      return makeFallbackSummary(contextType, 'Coach identity could not be verified. Please sign in.')
    }

    switch (contextType) {
      case 'academy_overview':           return fetchAcademyOverview(supabase, academyId)
      case 'player_collection':          return fetchPlayerCollection(supabase, academyId)
      case 'player_profile':             return fetchPlayerProfile(supabase, academyId, params?.playerId)
      case 'coach_profile':              return fetchCoachContext(supabase, academyId, params?.coachId)
      case 'group_context':              return fetchGroupContext(supabase, academyId)
      case 'session_context':            return fetchSessionContext(supabase, academyId)
      case 'session_detail':             return fetchSessionDetailContext(supabase, academyId, params?.sessionId)  // Sprint 863
      case 'class_template_collection':  return fetchClassTemplateCollection(supabase, academyId)
      case 'fitness_template_collection':return fetchFitnessTemplateCollection(supabase, academyId)
      case 'curriculum_context':         return fetchCurriculumContext(supabase, academyId)
      case 'review_queue_context':       return fetchReviewQueueContext(supabase, academyId)
      case 'signals_context':            return fetchSignalsContext(supabase, academyId)
      // Sprint 865 — Coach contexts (userId verified non-null by guard above)
      case 'coach_home_context':         return fetchCoachHomeContext(supabase, academyId, userId as string)
      case 'coach_players_context':      return fetchCoachPlayersContext(supabase, academyId, userId as string)
      case 'coach_session_context':      return fetchCoachSessionContext(supabase, academyId, userId as string, params?.sessionId)
      // Sprint 866 — Coach wrap-up context (userId verified non-null by guard above)
      case 'coach_wrap_up_context':      return fetchCoachWrapUpContext(supabase, academyId, userId as string, params?.sessionId)
      // Sprint 867 — Class template detail context
      case 'class_template_detail':      return fetchClassTemplateDetailContext(supabase, academyId, params?.templateId)
      default:                           return fetchAcademyOverview(supabase, academyId)
    }
  } catch {
    return makeFallbackSummary(contextType, 'Could not load context data. Please try again.')
  }
}

// ---------------------------------------------------------------------------
// Academy overview
// ---------------------------------------------------------------------------

async function fetchAcademyOverview(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const players = await getPlayerSummaries(supabase, academyId)
  const activePlayers = players.filter(p => p.player_status === 'active').length
  const pendingCount = players.filter(p =>
    p.player_status === 'pending_placement' ||
    p.player_status === 'placement_in_progress' ||
    p.player_status === 'pending_approval'
  ).length
  const attentionCount = players.filter(p =>
    p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', weekEndStr)

  const sessionsThisWeek = (weekSessions ?? []).length
  const plannedSessions = (weekSessions ?? []).filter(s => s.status === 'planned').length
  const completedSessions = (weekSessions ?? []).filter(s => s.status === 'completed').length

  const { data: pendingActionsData } = await rawDb
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')

  const pendingActionsCount: number = pendingActionsData ?? 0

  const { data: templateData } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('academy_id', academyId)

  const allTemplates = (templateData ?? []) as Array<{ id: string; tags: string[] | null }>
  const classTemplateCount = allTemplates.filter(t => !(t.tags ?? []).includes('fitness_template:true')).length
  const fitnessTemplateCount = allTemplates.filter(t => (t.tags ?? []).includes('fitness_template:true')).length

  const { data: curricStateData } = await rawDb
    .from('player_curriculum_states')
    .select('player_id')
    .eq('academy_id', academyId)
  const playersWithLevel = (curricStateData ?? []).length
  const playersWithoutLevel = Math.max(0, activePlayers - playersWithLevel)

  const keyFacts: string[] = []
  keyFacts.push(`${players.length} player${players.length !== 1 ? 's' : ''} registered — ${activePlayers} active${pendingCount > 0 ? `, ${pendingCount} pending placement` : ''}`)
  if (attentionCount > 0) keyFacts.push(`${attentionCount} player${attentionCount !== 1 ? 's' : ''} need attention (on hold or due for reassessment)`)
  keyFacts.push(`${sessionsThisWeek} session${sessionsThisWeek !== 1 ? 's' : ''} this week${plannedSessions > 0 ? ` (${plannedSessions} planned)` : ''}${completedSessions > 0 ? `, ${completedSessions} completed` : ''}`)
  keyFacts.push(`${classTemplateCount} class template${classTemplateCount !== 1 ? 's' : ''}, ${fitnessTemplateCount} fitness template${fitnessTemplateCount !== 1 ? 's' : ''}`)
  if (playersWithLevel > 0 || activePlayers > 0) {
    keyFacts.push(`${playersWithLevel} of ${activePlayers} active player${activePlayers !== 1 ? 's' : ''} have curriculum levels assigned`)
  }

  const missingData: string[] = []
  if (playersWithoutLevel > 0) missingData.push(`${playersWithoutLevel} active player${playersWithoutLevel !== 1 ? 's' : ''} missing curriculum level`)
  if (classTemplateCount === 0) missingData.push('No class templates created yet')
  if (sessionsThisWeek === 0) missingData.push('No sessions scheduled this week')

  const nextSteps: string[] = []
  if (pendingCount > 0) nextSteps.push(`Complete placement for ${pendingCount} pending player${pendingCount !== 1 ? 's' : ''}`)
  if (playersWithoutLevel > 0 && activePlayers > 0) nextSteps.push(`Assign curriculum levels to ${playersWithoutLevel} active player${playersWithoutLevel !== 1 ? 's' : ''}`)
  if (classTemplateCount === 0 && activePlayers > 0) nextSteps.push('Create your first class template to enable session planning')
  if (sessionsThisWeek === 0 && classTemplateCount > 0) nextSteps.push('Schedule a session from an existing template this week')
  if (nextSteps.length === 0) nextSteps.push('Academy is set up — review signals for any player attention items')

  const openQuestions: string[] = []
  if (attentionCount > 0) openQuestions.push(`Which ${attentionCount} player${attentionCount !== 1 ? 's' : ''} need attention and why?`)
  if (pendingActionsCount > 0) openQuestions.push(`There are pending review items — have they been actioned?`)

  const summaryParts: string[] = []
  if (activePlayers > 0) summaryParts.push(`${activePlayers} active player${activePlayers !== 1 ? 's' : ''}`)
  if (sessionsThisWeek > 0) summaryParts.push(`${sessionsThisWeek} session${sessionsThisWeek !== 1 ? 's' : ''} this week`)
  if (classTemplateCount > 0) summaryParts.push(`${classTemplateCount} class template${classTemplateCount !== 1 ? 's' : ''}`)
  const summary = summaryParts.length > 0
    ? `Academy has ${summaryParts.join(', ')}.${pendingCount > 0 ? ` ${pendingCount} player${pendingCount !== 1 ? 's' : ''} awaiting placement.` : ''}`
    : 'Academy is being set up. Add players and create your first template to get started.'

  return {
    contextType: 'academy_overview',
    title: 'Academy Dashboard',
    summary,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: ['players', 'sessions', 'templates', 'player_curriculum_states'],
    missingData,
    safetyNotes: ['Read-only summary. No data was changed.'],
    recommendationInputsAvailable: [
      ...(activePlayers > 0 ? ['player_count', 'active_players'] : []),
      ...(sessionsThisWeek > 0 ? ['session_count'] : []),
      ...(classTemplateCount > 0 ? ['template_count'] : []),
      ...(playersWithLevel > 0 ? ['curriculum_levels'] : []),
    ],
    recommendationInputsMissing: [
      ...(playersWithoutLevel > 0 ? ['player_curriculum_levels'] : []),
      ...(classTemplateCount === 0 ? ['class_templates'] : []),
      ...(sessionsThisWeek === 0 ? ['upcoming_sessions'] : []),
    ],
    possibleSuggestionTypes: ['player_attention_signal', 'curriculum_priority_suggestion', 'session_focus_recommendation'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Player collection
// ---------------------------------------------------------------------------

async function fetchPlayerCollection(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const players = await getPlayerSummaries(supabase, academyId)
  const activePlayers = players.filter(p => p.player_status === 'active').length
  const pendingCount = players.filter(p =>
    p.player_status === 'pending_placement' ||
    p.player_status === 'placement_in_progress' ||
    p.player_status === 'pending_approval'
  ).length
  const attentionCount = players.filter(p =>
    p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length

  const playerIds = players.map(p => p.player_id).filter(Boolean) as string[]
  let playersWithLevel = 0
  if (playerIds.length > 0) {
    const { data: stateRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id')
      .eq('academy_id', academyId)
      .in('player_id', playerIds)
    playersWithLevel = (stateRows ?? []).length
  }
  const playersWithoutLevel = Math.max(0, activePlayers - playersWithLevel)

  const keyFacts: string[] = [
    `${players.length} player${players.length !== 1 ? 's' : ''} total — ${activePlayers} active`,
  ]
  if (pendingCount > 0) keyFacts.push(`${pendingCount} awaiting placement`)
  if (attentionCount > 0) keyFacts.push(`${attentionCount} need${attentionCount === 1 ? 's' : ''} attention (on hold or reassessment due)`)
  keyFacts.push(`${playersWithLevel} of ${activePlayers} active player${activePlayers !== 1 ? 's' : ''} have curriculum levels assigned`)

  const missingData: string[] = []
  if (playersWithoutLevel > 0) missingData.push(`${playersWithoutLevel} active player${playersWithoutLevel !== 1 ? 's' : ''} missing curriculum level`)
  if (players.length === 0) missingData.push('No players added yet')

  const nextSteps: string[] = []
  if (pendingCount > 0) nextSteps.push(`Complete placement for ${pendingCount} pending player${pendingCount !== 1 ? 's' : ''}`)
  else if (attentionCount > 0) nextSteps.push(`Review ${attentionCount} player${attentionCount !== 1 ? 's' : ''} who need attention`)
  else if (playersWithoutLevel > 0) nextSteps.push(`Assign curriculum levels to ${playersWithoutLevel} player${playersWithoutLevel !== 1 ? 's' : ''}`)
  else if (players.length === 0) nextSteps.push('Add your first player to begin the placement process')
  else nextSteps.push('Player directory is in good shape — check Signals for any attention items')

  return {
    contextType: 'player_collection',
    title: 'Player Directory',
    summary: players.length === 0
      ? 'No players have been added yet.'
      : `${activePlayers} active player${activePlayers !== 1 ? 's' : ''} registered.${pendingCount > 0 ? ` ${pendingCount} awaiting placement.` : ''}${attentionCount > 0 ? ` ${attentionCount} need attention.` : ''}`,
    keyFacts,
    openQuestions: attentionCount > 0
      ? [`Which ${attentionCount} player${attentionCount !== 1 ? 's' : ''} are on hold or due for reassessment?`]
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['v_player_summary', 'player_curriculum_states'],
    missingData,
    safetyNotes: ['Read-only summary. No player data was changed.'],
    recommendationInputsAvailable: [
      ...(activePlayers > 0 ? ['player_count', 'active_players'] : []),
      ...(playersWithLevel > 0 ? ['curriculum_levels_assigned'] : []),
    ],
    recommendationInputsMissing: [
      ...(playersWithoutLevel > 0 ? ['curriculum_level_for_some_players'] : []),
      ...(players.length === 0 ? ['any_players'] : []),
    ],
    possibleSuggestionTypes: ['player_attention_signal', 'curriculum_priority_suggestion', 'parent_update_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Player profile (single player)
// ---------------------------------------------------------------------------

async function fetchPlayerProfile(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  playerId: string | undefined,
): Promise<DonnaContextSummary> {
  if (!playerId) {
    return makeFallbackSummary('player_profile', 'No player ID found in the current URL. Open a specific player profile to use this summary.')
  }

  const rawDb = supabase as any

  // Basic player record — rawDb required: player_status and focus_areas not in generated types
  const { data: player } = await rawDb
    .from('players')
    .select('full_name, player_status, focus_areas, group_id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()

  if (!player) {
    return makeFallbackSummary('player_profile', 'Player record not found or access denied.')
  }

  const typedPlayer = player as { full_name: string | null; player_status: string | null; focus_areas: string[] | null; group_id: string | null }

  // Curriculum state
  const { data: curricState } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id, advancement_eligible')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .single()

  let levelName: string | null = null
  if (curricState?.current_level_id) {
    const { data: levelRow } = await rawDb
      .from('curriculum_levels')
      .select('display_name')
      .eq('id', curricState.current_level_id)
      .single()
    levelName = levelRow?.display_name ?? null
  }

  // Active priorities
  const { data: prioritiesData } = await rawDb
    .from('player_priorities')
    .select('focus_area, urgency, status')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .in('status', ['active', 'pending'])
    .limit(5)

  const priorities = (prioritiesData ?? []) as Array<{ focus_area: string; urgency: string; status: string }>

  // Recent coach notes (last 5)
  const { data: notesData } = await rawDb
    .from('coach_notes')
    .select('note_text, created_at, note_type')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(5)
  const noteCount = (notesData ?? []).length

  // Recent assessments
  const { data: assessmentData } = await rawDb
    .from('player_assessments')
    .select('id, assessed_at, overall_score')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('assessed_at', { ascending: false })
    .limit(1)
  const latestAssessment = (assessmentData ?? [])[0] ?? null

  // Session history (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: attendanceData } = await rawDb
    .from('session_attendance')
    .select('status, session_id')
    .eq('player_id', playerId)
    .gte('attended_at', thirtyDaysAgo)

  const attendanceRows = (attendanceData ?? []) as Array<{ status: string }>
  const sessionsAttended = attendanceRows.filter(r => r.status === 'present').length
  const sessionsAbsent = attendanceRows.filter(r => r.status === 'absent').length

  // Review items pending for this player
  const { data: reviewData } = await rawDb
    .from('proposed_actions')
    .select('id, action_type')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .contains('payload', { player_id: playerId })
    .limit(5)
  const pendingReviewItems = (reviewData ?? []).length

  const name = typedPlayer.full_name ?? 'This player'
  const keyFacts: string[] = []
  keyFacts.push(`Status: ${typedPlayer.player_status ?? 'unknown'}`)
  if (levelName) keyFacts.push(`Curriculum level: ${levelName}${curricState?.advancement_eligible ? ' (advancement eligible)' : ''}`)
  else keyFacts.push('No curriculum level assigned yet')
  if (priorities.length > 0) keyFacts.push(`${priorities.length} active priorit${priorities.length === 1 ? 'y' : 'ies'}`)
  if (noteCount > 0) keyFacts.push(`${noteCount} recent coach note${noteCount !== 1 ? 's' : ''} on record`)
  if (attendanceRows.length > 0) keyFacts.push(`${sessionsAttended} present, ${sessionsAbsent} absent in last 30 days`)
  if (latestAssessment) keyFacts.push(`Last assessed: ${new Date(latestAssessment.assessed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)

  const missingData: string[] = []
  if (!levelName) missingData.push('Curriculum level — needed to unlock development profile')
  if (noteCount === 0) missingData.push('Coach notes — no observations on file')
  if (attendanceRows.length === 0) missingData.push('Session attendance — no recent attendance records')
  if (!latestAssessment) missingData.push('Assessment history — no assessments recorded')

  const nextSteps: string[] = []
  if (!levelName) nextSteps.push('Assign a curriculum level via the player profile')
  else if (curricState?.advancement_eligible) nextSteps.push(`${name} is eligible for advancement — review gate evidence`)
  if (pendingReviewItems > 0) nextSteps.push(`${pendingReviewItems} pending review item${pendingReviewItems !== 1 ? 's' : ''} for this player`)
  if (nextSteps.length === 0 && noteCount === 0) nextSteps.push('Add coach observations to build the development record')
  if (nextSteps.length === 0) nextSteps.push('Review active priorities and check for any attention signals')

  const openQuestions: string[] = []
  if (typedPlayer.player_status === 'on_hold') openQuestions.push('Why is this player on hold?')
  if (typedPlayer.player_status === 'reassessment_due') openQuestions.push('When is the reassessment scheduled?')
  if (sessionsAbsent >= 2) openQuestions.push(`Player has ${sessionsAbsent} absences in 30 days — is this a concern?`)

  return {
    contextType: 'player_profile',
    title: `Player: ${name}`,
    summary: `${name} is ${typedPlayer.player_status ?? 'status unknown'}${levelName ? ` at ${levelName}` : ', no curriculum level assigned'}.${priorities.length > 0 ? ` ${priorities.length} active priorit${priorities.length === 1 ? 'y' : 'ies'}.` : ''}`,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: ['players', 'player_curriculum_states', 'player_priorities', 'coach_notes', 'session_attendance', 'player_assessments'],
    missingData,
    safetyNotes: ['Read-only summary. No player data was changed.', 'Coach notes content not shown — only count.'],
    recommendationInputsAvailable: [
      'player_status',
      ...(levelName ? ['curriculum_level'] : []),
      ...(priorities.length > 0 ? ['active_priorities'] : []),
      ...(noteCount > 0 ? ['coach_notes_count'] : []),
      ...(attendanceRows.length > 0 ? ['attendance_trend'] : []),
    ],
    recommendationInputsMissing: [
      ...(!levelName ? ['curriculum_level'] : []),
      ...(noteCount === 0 ? ['coach_observations'] : []),
      ...(!latestAssessment ? ['assessment_history'] : []),
    ],
    possibleSuggestionTypes: ['player_attention_signal', 'parent_update_suggestion', 'curriculum_priority_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Group context
// ---------------------------------------------------------------------------

async function fetchGroupContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const { data: groupData } = await rawDb
    .from('groups')
    .select('id, name, coach_id')
    .eq('academy_id', academyId)
    .order('name')
  const groups = (groupData ?? []) as Array<{ id: string; name: string; coach_id: string | null }>

  if (groups.length === 0) {
    return {
      contextType: 'group_context',
      title: 'Groups',
      summary: 'No groups have been created for this academy yet.',
      keyFacts: ['0 groups exist'],
      openQuestions: [],
      suggestedNextSteps: ['Create player groups after players have been placed and curriculum levels assigned.'],
      dataUsed: ['groups'],
      missingData: ['No groups exist yet'],
      safetyNotes: ['Read-only. No data changed.'],
      recommendationInputsAvailable: [],
      recommendationInputsMissing: ['groups', 'group_rosters'],
      possibleSuggestionTypes: ['group_composition_recommendation'],
      fetchedAt: new Date().toISOString(),
    }
  }

  // Count players per group
  const groupIds = groups.map(g => g.id)
  const { data: playerGroupData } = await rawDb
    .from('players')
    .select('group_id')
    .eq('academy_id', academyId)
    .in('group_id', groupIds)
  const groupPlayerCounts = new Map<string, number>()
  for (const row of ((playerGroupData ?? []) as Array<{ group_id: string | null }>)) {
    if (row.group_id) groupPlayerCounts.set(row.group_id, (groupPlayerCounts.get(row.group_id) ?? 0) + 1)
  }

  const keyFacts: string[] = [
    `${groups.length} group${groups.length !== 1 ? 's' : ''} created`,
  ]
  for (const group of groups.slice(0, 5)) {
    const playerCount = groupPlayerCounts.get(group.id) ?? 0
    keyFacts.push(`${group.name}: ${playerCount} player${playerCount !== 1 ? 's' : ''}`)
  }

  return {
    contextType: 'group_context',
    title: 'Groups',
    summary: `${groups.length} group${groups.length !== 1 ? 's' : ''} in this academy.`,
    keyFacts,
    openQuestions: [],
    suggestedNextSteps: ['Review group rosters on individual player profiles.'],
    dataUsed: ['groups', 'players'],
    missingData: [],
    safetyNotes: ['Read-only. No data changed.'],
    recommendationInputsAvailable: ['group_count', 'group_names'],
    recommendationInputsMissing: [],
    possibleSuggestionTypes: ['group_composition_recommendation', 'session_focus_recommendation'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Session context — Sprint 864 (deepened from 1 query to 5)
// Surfaces coach names, today's sessions, attendance counts, block gaps, wrap-up gaps.
// Safety: session_attendance and session_blocks have no academy_id column —
// both are scoped exclusively via session IDs loaded from academy-scoped Q1.
// ---------------------------------------------------------------------------

async function fetchSessionContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  // Query 1 — All sessions (enhanced: added coach_id, scheduled_time vs pre-864)
  const { data: allSessionsRaw } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, template_id, group_id, coach_id')
    .eq('academy_id', academyId)
    .order('scheduled_date', { ascending: false })

  const sessions = (allSessionsRaw ?? []) as Array<{
    id: string
    name: string | null
    scheduled_date: string
    scheduled_time: string | null
    status: string
    template_id: string | null
    group_id: string | null
    coach_id: string | null
  }>

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const sessionsThisWeek = sessions.filter(s => s.scheduled_date >= weekStartStr && s.scheduled_date < weekEndStr)
  const todaySessions = sessions.filter(s => s.scheduled_date === today && s.status !== 'cancelled')
  const upcomingSessions = sessions.filter(s => s.scheduled_date >= today && s.status !== 'cancelled')
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const plannedSessions = sessions.filter(s => s.status === 'planned')
  const sessionsWithoutTemplate = sessions.filter(s => !s.template_id)
  const sessionsWithoutGroup = sessions.filter(s => !s.group_id)
  const upcomingWithoutCoach = upcomingSessions.filter(s => !s.coach_id)

  // Query 2 — Coach names for sessions that have a coach_id (Sprint 864)
  // Scoped by unique coach IDs extracted from academy-verified Q1 sessions.
  const coachNameMap = new Map<string, string>()
  const uniqueCoachIds = Array.from(
    new Set(sessions.map(s => s.coach_id).filter(Boolean) as string[])
  )
  if (uniqueCoachIds.length > 0) {
    const { data: profilesRaw } = await rawDb
      .from('profiles')
      .select('id, full_name, first_name')
      .in('id', uniqueCoachIds)
    for (const p of ((profilesRaw ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null }>)) {
      const name = p.full_name
        ? String(p.full_name)
        : p.first_name
        ? String(p.first_name)
        : null
      if (name) coachNameMap.set(p.id, name)
    }
  }

  // Query 3 — Attendance counts for sessions in the past 7 days (Sprint 864)
  // Safety: session_attendance has no academy_id column.
  // Scoped via session IDs from Q1, which is already academy_id-scoped.
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const recentWindowIds = sessions
    .filter(s => s.scheduled_date >= sevenDaysAgo)
    .map(s => s.id)
  const attendanceBySession = new Map<string, { present: number; absent: number; total: number }>()
  if (recentWindowIds.length > 0) {
    const { data: attendanceRaw } = await rawDb
      .from('session_attendance')
      .select('session_id, status')
      .in('session_id', recentWindowIds)
    for (const row of ((attendanceRaw ?? []) as Array<{ session_id: string; status: string }>)) {
      const existing = attendanceBySession.get(row.session_id) ?? { present: 0, absent: 0, total: 0 }
      if (row.status === 'present') existing.present++
      else if (row.status === 'absent') existing.absent++
      existing.total++
      attendanceBySession.set(row.session_id, existing)
    }
  }
  const sessionsWithAttendance = recentWindowIds.filter(id => attendanceBySession.has(id)).length

  // Query 4 — Block presence for upcoming sessions (Sprint 864)
  // Identifies sessions with empty lesson plans before coaches run them.
  // Safety: session_blocks has no academy_id column.
  // Scoped via session IDs from Q1, which is already academy_id-scoped.
  const upcomingSessionIds = upcomingSessions.map(s => s.id)
  const sessionBlockCounts = new Map<string, number>()
  if (upcomingSessionIds.length > 0) {
    const { data: blocksRaw } = await rawDb
      .from('session_blocks')
      .select('session_id')
      .in('session_id', upcomingSessionIds)
    for (const row of ((blocksRaw ?? []) as Array<{ session_id: string }>)) {
      sessionBlockCounts.set(row.session_id, (sessionBlockCounts.get(row.session_id) ?? 0) + 1)
    }
  }
  const upcomingWithNoBlocks = upcomingSessionIds.filter(id => !sessionBlockCounts.has(id)).length

  // Query 5 — Wrap-up coverage for recently completed sessions (Sprint 864)
  // Identifies completed sessions where no wrap-up has been submitted at all.
  // Safety: double-scoped by academy_id (Q5 explicit) + target_object_id IN (Q1 verified IDs).
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const recentCompletedIds = completedSessions
    .filter(s => s.scheduled_date >= fourteenDaysAgo)
    .map(s => s.id)
  let completedMissingWrapUp = 0
  if (recentCompletedIds.length > 0) {
    const { data: wrapUpRaw } = await rawDb
      .from('proposed_actions')
      .select('target_object_id')
      .eq('academy_id', academyId)
      .eq('target_module', 'session_wrap_up_v1')
      .in('target_object_id', recentCompletedIds)
    const sessionsWithWrapUp = new Set(
      ((wrapUpRaw ?? []) as Array<{ target_object_id: string | null }>)
        .map(r => r.target_object_id)
        .filter(Boolean) as string[]
    )
    completedMissingWrapUp = recentCompletedIds.filter(id => !sessionsWithWrapUp.has(id)).length
  }

  // Build today's session label (name + time + coach name)
  const todayLabel: string | null = todaySessions.length > 0
    ? todaySessions.map(s => {
        const name = s.name ?? 'Unnamed session'
        const coachName = s.coach_id ? (coachNameMap.get(s.coach_id) ?? null) : null
        const timeStr = s.scheduled_time ? ` at ${s.scheduled_time.slice(0, 5)}` : ''
        return coachName ? `${name}${timeStr} (${coachName})` : `${name}${timeStr}`
      }).join('; ')
    : null

  // --- Build context ---
  const keyFacts: string[] = [
    `${sessions.length} session${sessions.length !== 1 ? 's' : ''} total`,
    `${sessionsThisWeek.length} this week, ${upcomingSessions.length} upcoming`,
    `${completedSessions.length} completed, ${plannedSessions.length} planned`,
  ]
  if (todayLabel !== null) {
    keyFacts.push(`Today: ${todayLabel}`)
  } else if (upcomingSessions.length > 0) {
    keyFacts.push('No sessions scheduled today')
  }
  if (upcomingWithoutCoach.length > 0) {
    keyFacts.push(`${upcomingWithoutCoach.length} upcoming session${upcomingWithoutCoach.length !== 1 ? 's' : ''} without a coach assigned`)
  }
  if (upcomingWithNoBlocks > 0) {
    keyFacts.push(`${upcomingWithNoBlocks} upcoming session${upcomingWithNoBlocks !== 1 ? 's' : ''} with no lesson plan blocks`)
  }
  if (sessionsWithAttendance > 0) {
    keyFacts.push(`${sessionsWithAttendance} recent session${sessionsWithAttendance !== 1 ? 's' : ''} with attendance recorded (last 7 days)`)
  }
  if (completedMissingWrapUp > 0) {
    keyFacts.push(`${completedMissingWrapUp} recently completed session${completedMissingWrapUp !== 1 ? 's' : ''} missing coach wrap-up`)
  }
  if (sessionsWithoutTemplate.length > 0) {
    keyFacts.push(`${sessionsWithoutTemplate.length} session${sessionsWithoutTemplate.length !== 1 ? 's' : ''} without a linked template`)
  }
  if (sessionsWithoutGroup.length > 0) {
    keyFacts.push(`${sessionsWithoutGroup.length} session${sessionsWithoutGroup.length !== 1 ? 's' : ''} without a group assigned`)
  }

  const missingData: string[] = []
  if (sessions.length === 0) missingData.push('No sessions created yet — generate from a class template')
  if (sessionsWithoutTemplate.length > 0) missingData.push(`${sessionsWithoutTemplate.length} session${sessionsWithoutTemplate.length !== 1 ? 's' : ''} missing template link`)
  if (upcomingWithNoBlocks > 0) missingData.push(`${upcomingWithNoBlocks} upcoming session${upcomingWithNoBlocks !== 1 ? 's' : ''} have no lesson plan blocks`)
  if (completedMissingWrapUp > 0) missingData.push(`${completedMissingWrapUp} recently completed session${completedMissingWrapUp !== 1 ? 's' : ''} missing coach wrap-up`)

  const nextSteps: string[] = []
  if (sessions.length === 0) {
    nextSteps.push('Create a session from a class template to get started')
  } else {
    if (todaySessions.length > 0) {
      nextSteps.push(`Review today's ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} and confirm coaches are ready`)
    }
    if (upcomingWithoutCoach.length > 0) {
      nextSteps.push(`Assign coaches to ${upcomingWithoutCoach.length} upcoming session${upcomingWithoutCoach.length !== 1 ? 's' : ''}`)
    }
    if (completedMissingWrapUp > 0) {
      nextSteps.push(`Check ${completedMissingWrapUp} completed session${completedMissingWrapUp !== 1 ? 's' : ''} missing wrap-ups`)
    }
    if (upcomingWithNoBlocks > 0 && nextSteps.length < 3) {
      nextSteps.push(`Add lesson plan blocks to ${upcomingWithNoBlocks} upcoming session${upcomingWithNoBlocks !== 1 ? 's' : ''}`)
    }
    if (nextSteps.length === 0 && upcomingSessions.length > 0) {
      nextSteps.push(`${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''} — review their setup before coaches run them`)
    }
    if (nextSteps.length === 0) {
      nextSteps.push('No upcoming sessions — generate one from a class template')
    }
  }

  const openQuestions: string[] = []
  if (sessionsWithoutTemplate.length > 0) {
    openQuestions.push(`${sessionsWithoutTemplate.length} session${sessionsWithoutTemplate.length !== 1 ? 's' : ''} are missing a template — were these created manually?`)
  }
  if (completedMissingWrapUp > 0) {
    openQuestions.push(`${completedMissingWrapUp} completed session${completedMissingWrapUp !== 1 ? 's' : ''} have no wrap-up — should coaches be reminded?`)
  }

  return {
    contextType: 'session_context',
    title: 'Sessions',
    summary: sessions.length === 0
      ? 'No sessions have been created yet.'
      : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} total. ${sessionsThisWeek.length} this week, ${completedSessions.length} completed.${todaySessions.length > 0 ? ` ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} today.` : ''}`,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions',
      ...(uniqueCoachIds.length > 0 ? ['profiles (coach names)'] : []),
      ...(recentWindowIds.length > 0 ? ['session_attendance'] : []),
      ...(upcomingSessionIds.length > 0 ? ['session_blocks'] : []),
      ...(recentCompletedIds.length > 0 ? ['proposed_actions (wrap-up status)'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No session data was changed.',
      'session_attendance and session_blocks scoped via session IDs from academy-verified sessions query.',
    ],
    recommendationInputsAvailable: [
      ...(sessions.length > 0 ? ['session_count', 'session_statuses'] : []),
      ...(completedSessions.length > 0 ? ['completed_sessions'] : []),
      ...(coachNameMap.size > 0 ? ['coach_names'] : []),
      ...(attendanceBySession.size > 0 ? ['attendance_data'] : []),
      ...(sessionBlockCounts.size > 0 ? ['lesson_plan_coverage'] : []),
    ],
    recommendationInputsMissing: [
      ...(sessions.length === 0 ? ['any_sessions'] : []),
      ...(sessionsWithoutTemplate.length > 0 ? ['template_links_for_some_sessions'] : []),
      ...(upcomingWithNoBlocks > 0 ? ['lesson_plan_blocks_for_upcoming'] : []),
      ...(completedMissingWrapUp > 0 ? ['wrap_up_for_completed_sessions'] : []),
    ],
    possibleSuggestionTypes: ['session_focus_recommendation', 'template_recommendation'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Class template collection
// ---------------------------------------------------------------------------

async function fetchClassTemplateCollection(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const { data: templatesRaw } = await rawDb
    .from('templates')
    .select('id, name, curriculum_level_id, total_duration_min, is_active, tags')
    .eq('academy_id', academyId)
    .order('name')

  const allTemplates = (templatesRaw ?? []) as Array<{
    id: string
    name: string
    curriculum_level_id: string | null
    total_duration_min: number | null
    is_active: boolean
    tags: string[] | null
  }>

  const classTemplates = allTemplates.filter(t => !(t.tags ?? []).includes('fitness_template:true'))
  const withLevel = classTemplates.filter(t => !!t.curriculum_level_id)
  const withoutLevel = classTemplates.filter(t => !t.curriculum_level_id)
  const withDuration = classTemplates.filter(t => t.total_duration_min != null)
  const active = classTemplates.filter(t => t.is_active)

  // Block counts
  let withLessonPlan = 0
  if (classTemplates.length > 0) {
    const tIds = classTemplates.map(t => t.id)
    const { data: blockData } = await rawDb
      .from('curriculum_class_template_blocks')
      .select('block_id')
      .in('block_id', tIds)
    if ((blockData ?? []).length > 0) withLessonPlan = classTemplates.length // approximate
  }

  // Sessions from these templates in last 30 days
  let recentSessionCount = 0
  if (classTemplates.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: recentSess } = await supabase
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .in('template_id', classTemplates.map(t => t.id))
      .gte('scheduled_date', thirtyDaysAgo)
    recentSessionCount = (recentSess ?? []).length
  }

  const keyFacts: string[] = []
  keyFacts.push(`${classTemplates.length} class template${classTemplates.length !== 1 ? 's' : ''} (${active.length} active)`)
  if (classTemplates.length > 0) {
    keyFacts.push(`${withLevel.length} of ${classTemplates.length} have a curriculum level assigned`)
    keyFacts.push(`${withDuration.length} of ${classTemplates.length} have a duration set`)
    keyFacts.push(`${recentSessionCount} session${recentSessionCount !== 1 ? 's' : ''} run from these templates in the last 30 days`)
  }
  if (withoutLevel.length > 0) keyFacts.push(`${withoutLevel.length} template${withoutLevel.length !== 1 ? 's' : ''} missing curriculum level`)

  const missingData: string[] = []
  if (classTemplates.length === 0) missingData.push('No class templates yet — create one to start session planning')
  if (withoutLevel.length > 0) missingData.push(`${withoutLevel.length} template${withoutLevel.length !== 1 ? 's' : ''} missing curriculum level`)

  const nextSteps: string[] = []
  if (classTemplates.length === 0) nextSteps.push('Create your first class template — use Academy Assistant to start a draft')
  else if (withoutLevel.length > 0) nextSteps.push(`Assign curriculum levels to ${withoutLevel.length} template${withoutLevel.length !== 1 ? 's' : ''} to unlock lesson plan generation`)
  else if (recentSessionCount === 0) nextSteps.push('Generate a session from an existing template to build coaching history')
  else nextSteps.push('Templates are being used — consider adding more levels if gaps exist')

  return {
    contextType: 'class_template_collection',
    title: 'Class Templates',
    summary: classTemplates.length === 0
      ? 'No class templates created yet.'
      : `${classTemplates.length} class template${classTemplates.length !== 1 ? 's' : ''}: ${withLevel.length} with curriculum level, ${recentSessionCount} sessions run in last 30 days.`,
    keyFacts,
    openQuestions: withoutLevel.length > 0
      ? [`Which curriculum levels should be assigned to the ${withoutLevel.length} unlabeled template${withoutLevel.length !== 1 ? 's' : ''}?`]
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['templates', 'sessions', 'curriculum_class_template_blocks'],
    missingData,
    safetyNotes: ['Read-only. No template data was changed.'],
    recommendationInputsAvailable: [
      ...(classTemplates.length > 0 ? ['template_count'] : []),
      ...(withLevel.length > 0 ? ['templates_with_curriculum'] : []),
      ...(recentSessionCount > 0 ? ['recent_session_usage'] : []),
    ],
    recommendationInputsMissing: [
      ...(classTemplates.length === 0 ? ['any_class_templates'] : []),
      ...(withoutLevel.length > 0 ? ['curriculum_levels_for_templates'] : []),
    ],
    possibleSuggestionTypes: ['template_recommendation', 'session_focus_recommendation'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Fitness template collection
// ---------------------------------------------------------------------------

async function fetchFitnessTemplateCollection(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const { data: templatesRaw } = await rawDb
    .from('templates')
    .select('id, name, total_duration_min, is_active, tags')
    .eq('academy_id', academyId)
    .order('name')

  const allTemplates = (templatesRaw ?? []) as Array<{
    id: string
    name: string
    total_duration_min: number | null
    is_active: boolean
    tags: string[] | null
  }>

  const fitnessTemplates = allTemplates.filter(t => (t.tags ?? []).includes('fitness_template:true'))
  const active = fitnessTemplates.filter(t => t.is_active)

  const typeLabels: Record<string, string> = {
    'template_type:standard': 'Standard',
    'template_type:pre_tournament': 'Pre-Tournament',
    'template_type:post_tournament': 'Post-Tournament',
    'template_type:high_intensity': 'High-Intensity',
    'template_type:low_load': 'Low-Load',
    'template_type:assessment': 'Assessment',
    'template_type:recovery': 'Recovery',
  }
  const typeCounts = new Map<string, number>()
  for (const t of fitnessTemplates) {
    for (const tag of (t.tags ?? [])) {
      if (typeLabels[tag]) typeCounts.set(typeLabels[tag], (typeCounts.get(typeLabels[tag]) ?? 0) + 1)
    }
  }

  const keyFacts: string[] = [
    `${fitnessTemplates.length} fitness template${fitnessTemplates.length !== 1 ? 's' : ''} (${active.length} active)`,
  ]
  for (const [type, count] of Array.from(typeCounts.entries())) {
    keyFacts.push(`${count} ${type} template${count !== 1 ? 's' : ''}`)
  }

  const missingData: string[] = []
  if (fitnessTemplates.length === 0) missingData.push('No fitness templates yet')

  return {
    contextType: 'fitness_template_collection',
    title: 'Fitness Templates',
    summary: fitnessTemplates.length === 0
      ? 'No fitness templates created yet.'
      : `${fitnessTemplates.length} fitness template${fitnessTemplates.length !== 1 ? 's' : ''} (${active.length} active). Guided save flow not yet wired.`,
    keyFacts,
    openQuestions: [],
    suggestedNextSteps: fitnessTemplates.length === 0
      ? ['Create a fitness template to add physical training plans alongside class templates.']
      : ['Open a fitness template to review or add blocks.'],
    dataUsed: ['templates'],
    missingData,
    safetyNotes: ['Read-only. No template data was changed.', 'Fitness template guided creation is not yet wired in Academy Assistant.'],
    recommendationInputsAvailable: fitnessTemplates.length > 0 ? ['fitness_template_count'] : [],
    recommendationInputsMissing: fitnessTemplates.length === 0 ? ['fitness_templates'] : [],
    possibleSuggestionTypes: ['fitness_focus_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Curriculum context
// ---------------------------------------------------------------------------

async function fetchCurriculumContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const { data: versionRow } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name, status, version_number, activated_at')
    .eq('academy_id', academyId)
    .in('status', ['active', 'draft'])
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const version = versionRow ?? null

  let overrideCount = 0
  if (version?.id) {
    const { count } = await rawDb
      .from('academy_curriculum_overrides')
      .select('*', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('curriculum_version_id', version.id)
      .eq('status', 'applied')
    overrideCount = count ?? 0
  }

  const { data: levelRows } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage')
    .order('sort_order', { ascending: true })
  const levelCount = (levelRows ?? []).length

  const { data: curricStateRows } = await rawDb
    .from('player_curriculum_states')
    .select('player_id, current_level_id')
    .eq('academy_id', academyId)
  const playersWithLevel = (curricStateRows ?? []).length

  const keyFacts: string[] = []
  if (version) {
    keyFacts.push(`Curriculum spine: ${version.status === 'active' ? 'Active' : 'Draft'} — ${version.name} (v${version.version_number})`)
    if (overrideCount > 0) keyFacts.push(`${overrideCount} academy customization${overrideCount !== 1 ? 's' : ''} applied`)
    else keyFacts.push('No academy customizations applied yet')
  } else {
    keyFacts.push('No curriculum spine activated yet')
  }
  keyFacts.push(`${levelCount} curriculum level${levelCount !== 1 ? 's' : ''} in the global spine (Red–High Performance)`)
  keyFacts.push(`${playersWithLevel} player${playersWithLevel !== 1 ? 's' : ''} assigned to curriculum levels`)

  const missingData: string[] = []
  if (!version) missingData.push('No curriculum version activated — start setup to activate')
  else if (version.status !== 'active') missingData.push('Curriculum version is draft — approval needed')

  const nextSteps: string[] = []
  if (!version) nextSteps.push('Start curriculum setup to activate the development spine')
  else if (version.status !== 'active') nextSteps.push('Approve the curriculum spine to activate it')
  else if (overrideCount === 0) nextSteps.push('Review level gates and add academy customizations if needed')
  else nextSteps.push('Connect templates to curriculum levels to give coaches context')

  return {
    contextType: 'curriculum_context',
    title: 'Curriculum',
    summary: !version
      ? 'No curriculum spine activated yet.'
      : `${version.name} (v${version.version_number}) is ${version.status}. ${playersWithLevel} player${playersWithLevel !== 1 ? 's' : ''} assigned to levels.`,
    keyFacts,
    openQuestions: !version
      ? ['What is your academy development philosophy? Start setup to answer this.']
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['academy_curriculum_versions', 'academy_curriculum_overrides', 'curriculum_levels', 'player_curriculum_states'],
    missingData,
    safetyNotes: ['Read-only. No curriculum data was changed.'],
    recommendationInputsAvailable: [
      ...(version?.status === 'active' ? ['active_curriculum_version'] : []),
      ...(playersWithLevel > 0 ? ['player_levels'] : []),
    ],
    recommendationInputsMissing: [
      ...(!version ? ['curriculum_version'] : []),
      ...(playersWithLevel === 0 ? ['player_curriculum_assignments'] : []),
    ],
    possibleSuggestionTypes: ['curriculum_priority_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Review queue context
// ---------------------------------------------------------------------------

async function fetchReviewQueueContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const { data: pendingActions } = await rawDb
    .from('proposed_actions')
    .select('id, action_type, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  const items = (pendingActions ?? []) as Array<{ id: string; action_type: string; target_module: string; created_at: string }>

  // Count by module type
  const wrapUps = items.filter(i => i.target_module === 'session_wrap_up_v1')
  const captures = items.filter(i => i.target_module === 'capture_v1' || i.action_type === 'voice_intake')
  const placementItems = items.filter(i =>
    i.target_module?.includes('placement') ||
    i.action_type?.includes('placement')
  )
  const other = items.filter(i =>
    i.target_module !== 'session_wrap_up_v1' &&
    i.target_module !== 'capture_v1' &&
    i.action_type !== 'voice_intake' &&
    !i.target_module?.includes('placement') &&
    !i.action_type?.includes('placement')
  )

  // Private lesson requests
  const { data: lessonRequests } = await rawDb
    .from('private_lesson_requests')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('status', 'new')
  const newLessonRequests = (lessonRequests ?? []).length

  const keyFacts: string[] = []
  if (items.length === 0 && newLessonRequests === 0) {
    keyFacts.push('Review queue is clear — no pending items')
  } else {
    if (wrapUps.length > 0) keyFacts.push(`${wrapUps.length} coach wrap-up${wrapUps.length !== 1 ? 's' : ''} awaiting review`)
    if (captures.length > 0) keyFacts.push(`${captures.length} voice/capture item${captures.length !== 1 ? 's' : ''} to review`)
    if (placementItems.length > 0) keyFacts.push(`${placementItems.length} placement item${placementItems.length !== 1 ? 's' : ''} to review`)
    if (other.length > 0) keyFacts.push(`${other.length} other pending item${other.length !== 1 ? 's' : ''}`)
    if (newLessonRequests > 0) keyFacts.push(`${newLessonRequests} new private lesson request${newLessonRequests !== 1 ? 's' : ''}`)
  }

  const totalPending = items.length + newLessonRequests
  const nextSteps: string[] = []
  if (wrapUps.length > 0) nextSteps.push(`Review ${wrapUps.length} coach wrap-up${wrapUps.length !== 1 ? 's' : ''} first — oldest are waiting longest`)
  else if (placementItems.length > 0) nextSteps.push(`Review ${placementItems.length} placement item${placementItems.length !== 1 ? 's' : ''} to activate player profiles`)
  else if (newLessonRequests > 0) nextSteps.push(`Review ${newLessonRequests} new private lesson request${newLessonRequests !== 1 ? 's' : ''}`)
  else if (totalPending === 0) nextSteps.push('Queue is clear — nothing needs your attention right now')
  else nextSteps.push(`Review ${totalPending} pending item${totalPending !== 1 ? 's' : ''} in the queue`)

  return {
    contextType: 'review_queue_context',
    title: 'Review Queue',
    summary: totalPending === 0
      ? 'Review queue is clear — no pending items.'
      : `${totalPending} item${totalPending !== 1 ? 's' : ''} awaiting director review: ${wrapUps.length > 0 ? `${wrapUps.length} wrap-up${wrapUps.length !== 1 ? 's' : ''}` : ''}${newLessonRequests > 0 ? `, ${newLessonRequests} lesson request${newLessonRequests !== 1 ? 's' : ''}` : ''}.`,
    keyFacts,
    openQuestions: wrapUps.length > 0
      ? ['Are any wrap-ups from the same coach — is there a pattern to review?']
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['proposed_actions', 'private_lesson_requests'],
    missingData: [],
    safetyNotes: ['Read-only summary. No review items were actioned.'],
    recommendationInputsAvailable: [
      ...(items.length > 0 ? ['pending_review_count', 'review_types'] : []),
      ...(wrapUps.length > 0 ? ['coach_wrap_ups'] : []),
    ],
    recommendationInputsMissing: [],
    possibleSuggestionTypes: ['player_attention_signal', 'parent_update_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Signals context
// ---------------------------------------------------------------------------

async function fetchSignalsContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  // Active players from summary view
  const { data: activePlayers } = await rawDb
    .from('v_player_summary')
    .select('player_id, full_name, level_label, group_name')
    .eq('academy_id', academyId)
    .eq('player_status', 'active')

  const allActive = (activePlayers ?? []) as Array<{
    player_id: string
    full_name: string | null
    level_label: string | null
    group_name: string | null
  }>

  const withoutGroup = allActive.filter(p => !p.group_name)
  const withoutLevel = allActive.filter(p => !p.level_label)

  // Pending wrap-ups
  const { data: wrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
  const pendingWrapUps = (wrapUpData ?? []).length

  // Attendance concerns (2+ absences in 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: recentSessions } = await rawDb
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', thirtyDaysAgo)

  const recentSessionIds = ((recentSessions ?? []) as { id: string }[]).map(s => s.id)
  let attendanceConcernCount = 0
  if (recentSessionIds.length > 0) {
    const { data: absenceData } = await rawDb
      .from('session_attendance')
      .select('player_id')
      .in('session_id', recentSessionIds)
      .eq('status', 'absent')

    const counts = new Map<string, number>()
    for (const row of ((absenceData ?? []) as { player_id: string }[])) {
      counts.set(row.player_id, (counts.get(row.player_id) ?? 0) + 1)
    }
    attendanceConcernCount = Array.from(counts.values()).filter(c => c >= 2).length
  }

  // New lesson requests
  const { data: lessonData } = await rawDb
    .from('private_lesson_requests')
    .select('id')
    .eq('academy_id', academyId)
    .eq('status', 'new')
  const newLessonRequests = (lessonData ?? []).length

  const totalSignals = withoutGroup.length + withoutLevel.length + pendingWrapUps + attendanceConcernCount + newLessonRequests

  const keyFacts: string[] = []
  if (totalSignals === 0) {
    keyFacts.push('All clear — no open signals')
  } else {
    if (withoutGroup.length > 0) keyFacts.push(`${withoutGroup.length} active player${withoutGroup.length !== 1 ? 's' : ''} without a group`)
    if (withoutLevel.length > 0) keyFacts.push(`${withoutLevel.length} active player${withoutLevel.length !== 1 ? 's' : ''} without a curriculum level`)
    if (attendanceConcernCount > 0) keyFacts.push(`${attendanceConcernCount} player${attendanceConcernCount !== 1 ? 's' : ''} with attendance concerns (2+ absences in 30 days)`)
    if (pendingWrapUps > 0) keyFacts.push(`${pendingWrapUps} coach wrap-up${pendingWrapUps !== 1 ? 's' : ''} pending review`)
    if (newLessonRequests > 0) keyFacts.push(`${newLessonRequests} new private lesson request${newLessonRequests !== 1 ? 's' : ''}`)
  }

  const nextSteps: string[] = []
  if (attendanceConcernCount > 0) nextSteps.push(`Review ${attendanceConcernCount} player${attendanceConcernCount !== 1 ? 's' : ''} with attendance concerns first`)
  else if (withoutLevel.length > 0) nextSteps.push(`Assign curriculum levels to ${withoutLevel.length} unleveled player${withoutLevel.length !== 1 ? 's' : ''}`)
  else if (pendingWrapUps > 0) nextSteps.push(`Review ${pendingWrapUps} pending wrap-up${pendingWrapUps !== 1 ? 's' : ''} in the Review Queue`)
  else if (withoutGroup.length > 0) nextSteps.push(`Assign ${withoutGroup.length} player${withoutGroup.length !== 1 ? 's' : ''} to groups`)
  else if (newLessonRequests > 0) nextSteps.push(`Review ${newLessonRequests} new lesson request${newLessonRequests !== 1 ? 's' : ''}`)
  else nextSteps.push('All clear — check back after sessions run to see new signals')

  return {
    contextType: 'signals_context',
    title: 'Signals',
    summary: totalSignals === 0
      ? 'No open signals — academy is on track.'
      : `${totalSignals} open signal${totalSignals !== 1 ? 's' : ''}: ${attendanceConcernCount > 0 ? `${attendanceConcernCount} attendance concern${attendanceConcernCount !== 1 ? 's' : ''}` : ''}${withoutLevel.length > 0 ? `, ${withoutLevel.length} player${withoutLevel.length !== 1 ? 's' : ''} without level` : ''}.`,
    keyFacts,
    openQuestions: attendanceConcernCount > 0
      ? ['Are attendance concerns related to a specific group or coach?']
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['v_player_summary', 'proposed_actions', 'session_attendance', 'private_lesson_requests'],
    missingData: recentSessionIds.length === 0 ? ['No recent sessions — attendance concerns require session data'] : [],
    safetyNotes: ['Read-only summary. No signal status was changed.'],
    recommendationInputsAvailable: [
      ...(allActive.length > 0 ? ['active_player_count'] : []),
      ...(attendanceConcernCount > 0 ? ['attendance_concerns'] : []),
      ...(pendingWrapUps > 0 ? ['pending_wrap_ups'] : []),
    ],
    recommendationInputsMissing: [
      ...(recentSessionIds.length === 0 ? ['session_history'] : []),
    ],
    possibleSuggestionTypes: ['player_attention_signal', 'attendance_risk_suggestion', 'parent_update_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Coach profile context — Sprint 452
// ---------------------------------------------------------------------------

async function fetchCoachContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  coachId?: string,
): Promise<DonnaContextSummary> {
  if (!coachId) {
    return makeFallbackSummary('coach_profile', 'No coach selected. Navigate to a specific coach profile to see coach context.')
  }

  const rawDb = supabase as any

  // Coach profile
  const { data: profileRaw } = await rawDb
    .from('profiles')
    .select('full_name, first_name')
    .eq('id', coachId)
    .maybeSingle()

  const coachName: string =
    profileRaw?.full_name
      ? String(profileRaw.full_name)
      : profileRaw?.first_name
      ? String(profileRaw.first_name)
      : 'Unknown Coach'

  // Coach membership
  const { data: membershipRaw } = await rawDb
    .from('academy_memberships')
    .select('role, is_active')
    .eq('profile_id', coachId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle()

  if (!membershipRaw?.is_active) {
    return makeFallbackSummary('coach_profile', `${coachName} is not an active member of this academy.`)
  }

  const roleLabel: string =
    membershipRaw?.role === 'head_coach'
      ? 'Head Coach'
      : membershipRaw?.role === 'academy_director'
      ? 'Director'
      : 'Coach'

  // Sessions in last 30d
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id, status')
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .gte('scheduled_date', thirtyDaysAgoStr)

  const sessions = (sessionsRaw ?? []) as Array<{ id: string; status: string }>
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'done').length

  // Observations in last 30d
  const { data: obsRaw } = await rawDb
    .from('coach_observations')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .gte('created_at', thirtyDaysAgoStr)

  const observationCount: number = Array.isArray(obsRaw) ? obsRaw.length : 0

  // Pending review items
  const { data: pendingRaw } = await rawDb
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('proposed_by_id', coachId)
    .eq('status', 'pending_review')

  const pendingCount: number = Array.isArray(pendingRaw) ? pendingRaw.length : 0

  const keyFacts: string[] = [
    `${roleLabel} — active member of this academy`,
    `${totalSessions} session${totalSessions !== 1 ? 's' : ''} coached in last 30 days (${completedSessions} completed)`,
    `${observationCount} observation${observationCount !== 1 ? 's' : ''} logged in last 30 days`,
    ...(pendingCount > 0 ? [`${pendingCount} pending review item${pendingCount !== 1 ? 's' : ''} awaiting director approval`] : []),
  ]

  const missingData: string[] = []
  if (totalSessions === 0) missingData.push('No sessions assigned in last 30 days')
  if (observationCount === 0 && totalSessions > 0) missingData.push('No observations logged in last 30 days')

  const nextSteps: string[] = []
  if (pendingCount > 0) nextSteps.push(`Review ${pendingCount} pending item${pendingCount !== 1 ? 's' : ''} from ${coachName} in the Review Queue`)
  if (observationCount === 0 && totalSessions > 0) nextSteps.push(`Ask ${coachName} to log observations after sessions`)
  if (nextSteps.length === 0) nextSteps.push(`Check ${coachName}'s full session and observation history`)

  return {
    contextType: 'coach_profile',
    title: `Coach: ${coachName}`,
    summary: `${coachName} is a ${roleLabel} with ${totalSessions} session${totalSessions !== 1 ? 's' : ''} and ${observationCount} observation${observationCount !== 1 ? 's' : ''} in the last 30 days.`,
    keyFacts,
    openQuestions: pendingCount > 0 ? [`${coachName} has ${pendingCount} pending item${pendingCount !== 1 ? 's' : ''} — have they been reviewed?`] : [],
    suggestedNextSteps: nextSteps,
    dataUsed: ['profiles', 'academy_memberships', 'sessions', 'coach_observations', 'proposed_actions'],
    missingData,
    safetyNotes: ['Read-only summary. No coach data was changed.'],
    recommendationInputsAvailable: [
      'coach_role',
      ...(totalSessions > 0 ? ['session_count', 'completion_rate'] : []),
      ...(observationCount > 0 ? ['observation_count'] : []),
    ],
    recommendationInputsMissing: [
      ...(totalSessions === 0 ? ['session_history'] : []),
      ...(observationCount === 0 ? ['observation_history'] : []),
    ],
    possibleSuggestionTypes: ['coach_execution_suggestion', 'observation_coverage_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Coach home context — Sprint 865
// Coach's own sessions and review queue items only.
// Identity: coachId MUST be the server-side authenticated user id (not URL/client param).
// Safety: sessions double-scoped (academy_id + coach_id = auth user).
//         proposed_actions double-scoped (academy_id + proposed_by_id = auth user).
// ---------------------------------------------------------------------------

async function fetchCoachHomeContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  coachId: string,  // ALWAYS resolveAcademyId().userId — never client-provided
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Query 1 — Coach's own sessions (past 30 days + upcoming)
  // Double-scoped: academy_id + coach_id = authenticated user
  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, template_id')
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .gte('scheduled_date', thirtyDaysAgo)
    .order('scheduled_date', { ascending: true })

  const sessions = (sessionsRaw ?? []) as Array<{
    id: string
    name: string | null
    scheduled_date: string
    scheduled_time: string | null
    status: string
    template_id: string | null
  }>

  const todaySessions = sessions.filter(s => s.scheduled_date === today && s.status !== 'cancelled')
  const upcomingSessions = sessions.filter(s => s.scheduled_date > today && s.status !== 'cancelled')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Query 2 — Coach's own items in the review queue
  // Double-scoped: academy_id + proposed_by_id = authenticated user
  const { data: pendingRaw } = await rawDb
    .from('proposed_actions')
    .select('id, target_module, status')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', coachId)
    .eq('status', 'pending_review')

  const pendingItems = (pendingRaw ?? []) as Array<{ id: string; target_module: string; status: string }>
  const pendingWrapUps = pendingItems.filter(i => i.target_module === 'session_wrap_up_v1')
  const otherPending = pendingItems.filter(i => i.target_module !== 'session_wrap_up_v1')

  // Build today's session label
  const todayLabel: string | null = todaySessions.length > 0
    ? todaySessions.map(s => {
        const name = s.name ?? 'Unnamed session'
        const timeStr = s.scheduled_time ? ` at ${s.scheduled_time.slice(0, 5)}` : ''
        return `${name}${timeStr}`
      }).join('; ')
    : null

  const keyFacts: string[] = []
  if (todayLabel !== null) {
    keyFacts.push(`Today: ${todayLabel}`)
  } else {
    keyFacts.push('No sessions assigned today')
  }
  keyFacts.push(`${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''} assigned`)
  keyFacts.push(`${completedSessions.length} session${completedSessions.length !== 1 ? 's' : ''} completed in last 30 days`)
  if (pendingWrapUps.length > 0) {
    keyFacts.push(`${pendingWrapUps.length} wrap-up${pendingWrapUps.length !== 1 ? 's' : ''} submitted and awaiting director review`)
  }
  if (otherPending.length > 0) {
    keyFacts.push(`${otherPending.length} other item${otherPending.length !== 1 ? 's' : ''} pending director review`)
  }

  const missingData: string[] = []
  if (sessions.length === 0) missingData.push('No sessions assigned in the last 30 days or upcoming')

  const nextSteps: string[] = []
  if (todaySessions.length > 0) {
    nextSteps.push(`Run today's ${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} — check lesson plans are ready`)
  } else if (upcomingSessions.length > 0) {
    nextSteps.push(`${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''} — review lesson plans ahead of time`)
  } else {
    nextSteps.push('No upcoming sessions assigned — check with your director')
  }
  if (completedSessions.length > 0 && pendingWrapUps.length === 0) {
    nextSteps.push('Submit wrap-ups for any recently completed sessions')
  }

  const openQuestions: string[] = []
  if (pendingWrapUps.length > 0) {
    openQuestions.push(`${pendingWrapUps.length} wrap-up${pendingWrapUps.length !== 1 ? 's' : ''} awaiting director review — any feedback expected?`)
  }

  return {
    contextType: 'coach_home_context',
    title: 'My Sessions',
    summary: sessions.length === 0
      ? 'No sessions assigned recently.'
      : `${todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} today, ` : ''}${upcomingSessions.length} upcoming, ${completedSessions.length} completed in last 30 days.`,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions (coach-owned: academy_id + coach_id)',
      'proposed_actions (coach-submitted: academy_id + proposed_by_id)',
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No session data was changed.',
      'Sessions scoped by academy_id + coach_id = authenticated user — other coaches not visible.',
      'Review queue items scoped by proposed_by_id = authenticated user — other coaches not visible.',
    ],
    recommendationInputsAvailable: [
      ...(sessions.length > 0 ? ['coach_session_count', 'session_statuses'] : []),
      ...(completedSessions.length > 0 ? ['completed_sessions'] : []),
      ...(pendingWrapUps.length > 0 ? ['pending_wrap_up_count'] : []),
    ],
    recommendationInputsMissing: [
      ...(sessions.length === 0 ? ['coach_session_history'] : []),
    ],
    possibleSuggestionTypes: ['session_focus_recommendation', 'coach_execution_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Coach players context — Sprint 865
// Players encountered by this coach through their own sessions.
// Identity: coachId MUST be the server-side authenticated user id.
// Safety: player pool derived exclusively through coach-owned session IDs.
//         session_attendance and players scoped via academy-verified chain.
// ---------------------------------------------------------------------------

async function fetchCoachPlayersContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  coachId: string,  // ALWAYS resolveAcademyId().userId — never client-provided
): Promise<DonnaContextSummary> {
  const rawDb = supabase as any

  const now = new Date()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Query 1 — Coach's own session IDs (past 60 days) — player pool anchor
  // Double-scoped: academy_id + coach_id = authenticated user
  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .gte('scheduled_date', sixtyDaysAgo)

  const coachSessionIds = ((sessionsRaw ?? []) as Array<{ id: string }>).map(s => s.id)

  if (coachSessionIds.length === 0) {
    return {
      contextType: 'coach_players_context',
      title: 'My Players',
      summary: 'No sessions coached in the last 60 days — no player history available yet.',
      keyFacts: ['No coached sessions found in the last 60 days'],
      openQuestions: [],
      suggestedNextSteps: ['Player history will appear once you have coached sessions with attendance recorded.'],
      dataUsed: ['sessions (coach-owned)'],
      missingData: ['No coached sessions in last 60 days'],
      safetyNotes: [
        'Read-only. No data changed.',
        'Player pool derived exclusively from coach-owned sessions — other coaches not visible.',
      ],
      recommendationInputsAvailable: [],
      recommendationInputsMissing: ['coached_session_history', 'attendance_records'],
      possibleSuggestionTypes: ['player_attention_signal'],
      fetchedAt: new Date().toISOString(),
    }
  }

  // Query 2 — Attendance for coach's sessions
  // Safety: session_attendance has no academy_id; scoped via coach-owned session IDs from Q1
  const { data: attendanceRaw } = await rawDb
    .from('session_attendance')
    .select('player_id, session_id, status')
    .in('session_id', coachSessionIds)

  const attendanceRows = (attendanceRaw ?? []) as Array<{ player_id: string; session_id: string; status: string }>

  // Derive unique player IDs and session counts per player
  const playerSessionIds = new Map<string, Set<string>>()
  for (const row of attendanceRows) {
    if (row.player_id) {
      const existing = playerSessionIds.get(row.player_id) ?? new Set<string>()
      existing.add(row.session_id)
      playerSessionIds.set(row.player_id, existing)
    }
  }
  const playerSessionCount = new Map<string, number>(
    Array.from(playerSessionIds.entries()).map(([id, ids]) => [id, ids.size])
  )
  const uniquePlayerIds = Array.from(playerSessionCount.keys())

  if (uniquePlayerIds.length === 0) {
    return {
      contextType: 'coach_players_context',
      title: 'My Players',
      summary: 'No attendance records found for your coached sessions.',
      keyFacts: [`${coachSessionIds.length} session${coachSessionIds.length !== 1 ? 's' : ''} coached — no attendance recorded yet`],
      openQuestions: [],
      suggestedNextSteps: ['Record attendance after each session to build your player history.'],
      dataUsed: ['sessions (coach-owned)', 'session_attendance'],
      missingData: ['No attendance records found for coached sessions'],
      safetyNotes: [
        'Read-only. No data changed.',
        'Player pool derived from session_attendance scoped via coach-owned session IDs.',
      ],
      recommendationInputsAvailable: [],
      recommendationInputsMissing: ['attendance_records'],
      possibleSuggestionTypes: ['player_attention_signal'],
      fetchedAt: new Date().toISOString(),
    }
  }

  // Query 3 — Player names (academy-scoped — explicit academy_id on players)
  const { data: playersRaw } = await rawDb
    .from('players')
    .select('id, full_name, first_name, last_name')
    .in('id', uniquePlayerIds)
    .eq('academy_id', academyId)

  const playerNameMap = new Map<string, string>()
  for (const p of ((playersRaw ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }>)) {
    playerNameMap.set(
      p.id,
      p.full_name ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown Player'),
    )
  }

  // Query 4 — Curriculum level IDs for these players (academy-scoped)
  const { data: curricStatesRaw } = await rawDb
    .from('player_curriculum_states')
    .select('player_id, current_level_id')
    .eq('academy_id', academyId)
    .in('player_id', uniquePlayerIds)

  const curricStates = (curricStatesRaw ?? []) as Array<{ player_id: string; current_level_id: string }>
  const playerLevelIdMap = new Map<string, string>(curricStates.map(cs => [cs.player_id, cs.current_level_id]))
  const uniqueLevelIds = Array.from(new Set(curricStates.map(cs => cs.current_level_id)))

  // Query 5 — Level display names (curriculum_levels is a global table — no academy_id)
  const levelNameMap = new Map<string, string>()
  if (uniqueLevelIds.length > 0) {
    const { data: levelsRaw } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name')
      .in('id', uniqueLevelIds)
    for (const l of ((levelsRaw ?? []) as Array<{ id: string; display_name: string }>)) {
      levelNameMap.set(l.id, l.display_name)
    }
  }

  const playerLevelMap = new Map<string, string>()
  for (const [playerId, levelId] of Array.from(playerLevelIdMap.entries())) {
    const name = levelNameMap.get(levelId)
    if (name) playerLevelMap.set(playerId, name)
  }

  const playersWithLevel = uniquePlayerIds.filter(id => playerLevelMap.has(id)).length
  const playersWithoutLevel = uniquePlayerIds.length - playersWithLevel

  // Top 5 most-sessioned players for keyFacts
  const topPlayers = uniquePlayerIds
    .sort((a, b) => (playerSessionCount.get(b) ?? 0) - (playerSessionCount.get(a) ?? 0))
    .slice(0, 5)

  const keyFacts: string[] = [
    `${uniquePlayerIds.length} player${uniquePlayerIds.length !== 1 ? 's' : ''} coached in the last 60 days`,
    `${playersWithLevel} of ${uniquePlayerIds.length} have curriculum levels assigned`,
  ]
  for (const playerId of topPlayers) {
    const name = playerNameMap.get(playerId) ?? 'Unknown Player'
    const count = playerSessionCount.get(playerId) ?? 0
    const level = playerLevelMap.get(playerId)
    keyFacts.push(`${name}: ${count} session${count !== 1 ? 's' : ''}${level ? ` (${level})` : ''}`)
  }
  if (uniquePlayerIds.length > 5) {
    keyFacts.push(`…and ${uniquePlayerIds.length - 5} more player${uniquePlayerIds.length - 5 !== 1 ? 's' : ''}`)
  }

  const missingData: string[] = []
  if (playersWithoutLevel > 0) {
    missingData.push(`${playersWithoutLevel} of your players have no curriculum level — ask your director to assign one`)
  }

  const nextSteps: string[] = []
  nextSteps.push(`Review your ${uniquePlayerIds.length} player${uniquePlayerIds.length !== 1 ? 's' : ''} and note any patterns across sessions`)
  if (playersWithoutLevel > 0) {
    nextSteps.push(`${playersWithoutLevel} player${playersWithoutLevel !== 1 ? 's' : ''} have no curriculum level — check with your director`)
  }

  return {
    contextType: 'coach_players_context',
    title: 'My Players',
    summary: `${uniquePlayerIds.length} player${uniquePlayerIds.length !== 1 ? 's' : ''} coached in the last 60 days. ${playersWithLevel} have curriculum levels.`,
    keyFacts,
    openQuestions: playersWithoutLevel > 0
      ? [`${playersWithoutLevel} coached player${playersWithoutLevel !== 1 ? 's' : ''} have no curriculum level — have they been placed?`]
      : [],
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions (coach-owned: academy_id + coach_id)',
      'session_attendance (scoped via coach session IDs)',
      'players (academy_id scoped)',
      'player_curriculum_states (academy_id scoped)',
      ...(uniqueLevelIds.length > 0 ? ['curriculum_levels'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only. No data changed.',
      'Player pool derived from session_attendance scoped via coach-owned session IDs — other coaches\' players not visible.',
      'Player names and curriculum levels only — no coach notes, no assessment scores, no parent data.',
      'players explicitly re-scoped by academy_id to prevent cross-academy exposure.',
    ],
    recommendationInputsAvailable: [
      ...(uniquePlayerIds.length > 0 ? ['coached_player_count', 'session_count_per_player'] : []),
      ...(playersWithLevel > 0 ? ['curriculum_levels'] : []),
    ],
    recommendationInputsMissing: [
      ...(playersWithoutLevel > 0 ? ['curriculum_levels_for_some_players'] : []),
    ],
    possibleSuggestionTypes: ['player_attention_signal', 'curriculum_priority_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Coach session context — Sprint 865
// Full coach-facing context for a single session the authenticated coach owns.
// Identity: coachId MUST be the server-side authenticated user id.
// Safety: Q1 is a triple-scoped ownership gate (id + academy_id + coach_id).
//         If Q1 returns null, the session is not owned by this coach → fallback.
//         session_blocks and session_attendance scoped via Q1-verified session ID.
// ---------------------------------------------------------------------------

async function fetchCoachSessionContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  coachId: string,  // ALWAYS resolveAcademyId().userId — never client-provided
  sessionId: string | undefined,
): Promise<DonnaContextSummary> {
  if (!sessionId) {
    return makeFallbackSummary('coach_session_context', 'No session ID found in the current URL. Open a specific session to use this summary.')
  }

  const rawDb = supabase as any

  // Query 1 — Session ownership gate
  // Triple-scoped: id = sessionId + academy_id + coach_id = authenticated user
  // Returns null if session does not exist, belongs to a different academy, or coach mismatch.
  const { data: sessionRaw } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, duration_min, location, template_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .maybeSingle()

  if (!sessionRaw) {
    return makeFallbackSummary(
      'coach_session_context',
      'Session not found or you are not assigned as the coach for this session.',
    )
  }

  const session = sessionRaw as {
    id: string
    name: string | null
    scheduled_date: string
    scheduled_time: string | null
    status: string
    duration_min: number | null
    location: string | null
    template_id: string | null
  }

  // Query 2 — Session blocks
  // Safety: session_blocks has no academy_id; scoped via sessionId verified in Q1
  const { data: blocksRaw } = await rawDb
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  const blocks = (blocksRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    duration_min: number
    order_index: number
  }>

  // Query 3 — Session attendance
  // Safety: session_attendance has no academy_id; scoped via sessionId verified in Q1
  const { data: attendanceRaw } = await rawDb
    .from('session_attendance')
    .select('player_id, status')
    .eq('session_id', sessionId)

  const attendanceRows = (attendanceRaw ?? []) as Array<{ player_id: string; status: string }>
  const presentIds = attendanceRows.filter(r => r.status === 'present').map(r => r.player_id)
  const absentIds = attendanceRows.filter(r => r.status === 'absent').map(r => r.player_id)

  // Query 4 — Player names (explicitly academy-scoped on players table)
  const allPlayerIds = attendanceRows.map(r => r.player_id).filter(Boolean)
  const playerNameMap = new Map<string, string>()
  if (allPlayerIds.length > 0) {
    const { data: playersRaw } = await rawDb
      .from('players')
      .select('id, full_name, first_name, last_name')
      .in('id', allPlayerIds)
      .eq('academy_id', academyId)
    for (const p of ((playersRaw ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }>)) {
      playerNameMap.set(
        p.id,
        p.full_name ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown Player'),
      )
    }
  }

  // --- Build context ---
  const sessionLabel = session.name ?? `Session ${session.id.slice(0, 8)}`
  const dateLabel = session.scheduled_date
    ? new Date(session.scheduled_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : 'Date unknown'

  const keyFacts: string[] = []
  keyFacts.push(`Status: ${session.status}`)
  keyFacts.push(`Date: ${dateLabel}${session.scheduled_time ? ` at ${session.scheduled_time.slice(0, 5)}` : ''}`)
  if (session.location) keyFacts.push(`Location: ${session.location}`)
  if (session.duration_min) keyFacts.push(`Duration: ${session.duration_min} min`)
  if (blocks.length > 0) {
    const blockNames = blocks.map(b => b.name).slice(0, 3).join(', ')
    keyFacts.push(`${blocks.length} block${blocks.length !== 1 ? 's' : ''}: ${blockNames}${blocks.length > 3 ? '…' : ''}`)
  } else {
    keyFacts.push('No lesson plan blocks — session may need setup')
  }
  if (attendanceRows.length > 0) {
    const parts: string[] = []
    if (presentIds.length > 0) parts.push(`${presentIds.length} present`)
    if (absentIds.length > 0) parts.push(`${absentIds.length} absent`)
    keyFacts.push(`Attendance: ${parts.join(', ')} (${attendanceRows.length} rostered)`)
  } else {
    keyFacts.push('No attendance recorded yet')
  }

  const missingData: string[] = []
  if (blocks.length === 0) missingData.push('No lesson plan blocks')
  if (attendanceRows.length === 0) missingData.push('No attendance recorded yet')

  const nextSteps: string[] = []
  if (session.status === 'planned') {
    if (blocks.length === 0) {
      nextSteps.push('No lesson plan — check with your director or generate from a template')
    } else {
      nextSteps.push('Session is planned — review lesson plan before it starts')
    }
  } else if (session.status === 'in_progress') {
    nextSteps.push('Session is in progress — record attendance and observations as you go')
  } else if (session.status === 'completed') {
    nextSteps.push('Session complete — submit a wrap-up to log what happened')
  } else {
    nextSteps.push(`Session is ${session.status} — check with your director if you have questions`)
  }

  const openQuestions: string[] = []
  if (absentIds.length > 0 && attendanceRows.length > 0) {
    const names = absentIds.slice(0, 2).map(id => playerNameMap.get(id) ?? 'Unknown').join(', ')
    openQuestions.push(
      `${absentIds.length} player${absentIds.length !== 1 ? 's' : ''} absent (${names}${absentIds.length > 2 ? '…' : ''}) — should parents be notified?`,
    )
  }
  if (!session.template_id) {
    openQuestions.push('No template linked to this session — was it created ad hoc?')
  }

  return {
    contextType: 'coach_session_context',
    title: `Session: ${sessionLabel}`,
    summary: `${sessionLabel} — ${session.status}${attendanceRows.length > 0 ? `, ${presentIds.length} of ${attendanceRows.length} present` : ', attendance not recorded'}.`,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions (ownership-verified: id + academy_id + coach_id)',
      ...(blocks.length > 0 ? ['session_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['session_attendance', 'players'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No session data was changed.',
      'Session verified as coach-owned: id + academy_id + coach_id = authenticated user.',
      'session_blocks and session_attendance scoped via ownership-verified session ID.',
      'No director-private notes, no other coaches\' data, no parent data exposed.',
    ],
    recommendationInputsAvailable: [
      'session_status',
      'session_date',
      ...(blocks.length > 0 ? ['lesson_plan_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['attendance_data'] : []),
    ],
    recommendationInputsMissing: [
      ...(blocks.length === 0 ? ['lesson_plan'] : []),
      ...(attendanceRows.length === 0 ? ['attendance_records'] : []),
    ],
    possibleSuggestionTypes: ['session_focus_recommendation', 'player_attention_signal'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Coach wrap-up context — Sprint 866
// Full coach-facing context for the wrap-up screen of a session the authenticated coach owns.
// Architecture: identical Q1–Q4 ownership gate + session detail from fetchCoachSessionContext.
// Additional Q5: proposed_actions wrap-up lookup (latest only) to show submission state.
// Identity: coachId MUST be the server-side authenticated user id.
// Safety: Q1 triple-scoped ownership gate (id + academy_id + coach_id).
//         If Q1 returns null, no further queries run → safe fallback.
//         session_blocks and session_attendance scoped via Q1-verified session ID.
//         Q5 double-scoped: academy_id + target_object_id = sessionId + proposed_by_id = coachId.
// ---------------------------------------------------------------------------

async function fetchCoachWrapUpContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  coachId: string,  // ALWAYS resolveAcademyId().userId — never client-provided
  sessionId: string | undefined,
): Promise<DonnaContextSummary> {
  if (!sessionId) {
    return makeFallbackSummary(
      'coach_wrap_up_context',
      'No session ID found in the current URL. Open a specific session wrap-up to use this summary.',
    )
  }

  const rawDb = supabase as any

  // Query 1 — Session ownership gate
  // Triple-scoped: id = sessionId + academy_id + coach_id = authenticated user
  // Returns null if session does not exist, belongs to a different academy, or coach mismatch.
  const { data: sessionRaw } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, duration_min, location, template_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .eq('coach_id', coachId)
    .maybeSingle()

  if (!sessionRaw) {
    return makeFallbackSummary(
      'coach_wrap_up_context',
      'Session not found or you are not assigned as the coach for this session.',
    )
  }

  const session = sessionRaw as {
    id: string
    name: string | null
    scheduled_date: string
    scheduled_time: string | null
    status: string
    duration_min: number | null
    location: string | null
    template_id: string | null
  }

  // Query 2 — Session blocks
  // Safety: session_blocks has no academy_id; scoped via sessionId verified in Q1
  const { data: blocksRaw } = await rawDb
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  const blocks = (blocksRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    duration_min: number
    order_index: number
  }>

  // Query 3 — Session attendance
  // Safety: session_attendance has no academy_id; scoped via sessionId verified in Q1
  const { data: attendanceRaw } = await rawDb
    .from('session_attendance')
    .select('player_id, status')
    .eq('session_id', sessionId)

  const attendanceRows = (attendanceRaw ?? []) as Array<{ player_id: string; status: string }>
  const presentIds = attendanceRows.filter(r => r.status === 'present').map(r => r.player_id)
  const absentIds  = attendanceRows.filter(r => r.status === 'absent').map(r => r.player_id)

  // Query 4 — Player names (explicitly academy-scoped)
  const allPlayerIds = attendanceRows.map(r => r.player_id).filter(Boolean)
  const playerNameMap = new Map<string, string>()
  if (allPlayerIds.length > 0) {
    const { data: playersRaw } = await rawDb
      .from('players')
      .select('id, full_name, first_name, last_name')
      .in('id', allPlayerIds)
      .eq('academy_id', academyId)
    for (const p of ((playersRaw ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }>)) {
      playerNameMap.set(
        p.id,
        p.full_name ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown Player'),
      )
    }
  }

  // Query 5 — Existing wrap-up submission (latest only)
  // Double-scoped: academy_id + target_object_id = sessionId + proposed_by_id = coachId
  // target_module = 'session_wrap_up_v1' — latest submission for this session by this coach
  const { data: wrapUpRaw } = await rawDb
    .from('proposed_actions')
    .select('id, status, created_at')
    .eq('academy_id', academyId)
    .eq('target_object_id', sessionId)
    .eq('proposed_by_id', coachId)
    .eq('target_module', 'session_wrap_up_v1')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const existingWrapUp = wrapUpRaw as {
    id: string
    status: string
    created_at: string
  } | null

  // --- Build context ---
  const sessionLabel = session.name ?? `Session ${session.id.slice(0, 8)}`
  const dateLabel = session.scheduled_date
    ? new Date(session.scheduled_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : 'Date unknown'

  const isCompleted = session.status === 'completed'
  const wrapUpSubmitted = existingWrapUp !== null
  const wrapUpPendingReview = existingWrapUp?.status === 'pending_review'
  const wrapUpApproved = existingWrapUp?.status === 'approved' || existingWrapUp?.status === 'executed'
  const wrapUpRejected = existingWrapUp?.status === 'rejected' || existingWrapUp?.status === 'clarification_needed'

  const wrapUpStatusLabel = !wrapUpSubmitted
    ? 'Not submitted'
    : wrapUpPendingReview
      ? 'Submitted — awaiting director review'
      : wrapUpApproved
        ? 'Approved by director'
        : wrapUpRejected
          ? 'Needs revision — director requested changes'
          : `Submitted (${existingWrapUp?.status ?? 'unknown'})`

  const keyFacts: string[] = []
  keyFacts.push(`Session: ${sessionLabel}`)
  keyFacts.push(`Status: ${session.status}`)
  keyFacts.push(`Date: ${dateLabel}${session.scheduled_time ? ` at ${session.scheduled_time.slice(0, 5)}` : ''}`)
  if (session.location) keyFacts.push(`Location: ${session.location}`)
  if (session.duration_min) keyFacts.push(`Duration: ${session.duration_min} min`)

  // Blocks summary
  if (blocks.length > 0) {
    const blockNames = blocks.map(b => b.name).slice(0, 3).join(', ')
    keyFacts.push(`${blocks.length} block${blocks.length !== 1 ? 's' : ''} planned: ${blockNames}${blocks.length > 3 ? '…' : ''}`)
  } else {
    keyFacts.push('No lesson plan blocks found')
  }

  // Attendance summary
  if (attendanceRows.length > 0) {
    const parts: string[] = []
    if (presentIds.length > 0) {
      const names = presentIds.slice(0, 3).map(id => playerNameMap.get(id) ?? 'Unknown').join(', ')
      parts.push(`${presentIds.length} present (${names}${presentIds.length > 3 ? '…' : ''})`)
    }
    if (absentIds.length > 0) {
      const names = absentIds.slice(0, 2).map(id => playerNameMap.get(id) ?? 'Unknown').join(', ')
      parts.push(`${absentIds.length} absent (${names}${absentIds.length > 2 ? '…' : ''})`)
    }
    keyFacts.push(`Attendance: ${parts.join('; ')}`)
  } else {
    keyFacts.push('No attendance recorded yet — record before submitting wrap-up')
  }

  // Wrap-up submission state
  keyFacts.push(`Wrap-up: ${wrapUpStatusLabel}`)

  const missingData: string[] = []
  if (attendanceRows.length === 0) missingData.push('No attendance recorded — required before wrap-up')
  if (blocks.length === 0)         missingData.push('No lesson plan blocks found')
  if (!wrapUpSubmitted && isCompleted) missingData.push('Wrap-up not submitted for completed session')

  const openQuestions: string[] = []
  if (presentIds.length > 0) {
    openQuestions.push(`Which players stood out today? Mention them in your wrap-up.`)
  }
  if (absentIds.length > 0) {
    const names = absentIds.slice(0, 2).map(id => playerNameMap.get(id) ?? 'Unknown').join(', ')
    openQuestions.push(
      `${absentIds.length} player${absentIds.length !== 1 ? 's' : ''} absent (${names}${absentIds.length > 2 ? '…' : ''}) — should a parent or director follow-up note be added?`,
    )
  }
  if (wrapUpRejected) {
    openQuestions.push('Your director requested changes to this wrap-up — review their notes and resubmit.')
  }

  const nextSteps: string[] = []
  if (attendanceRows.length === 0) {
    nextSteps.push('Record attendance before submitting your wrap-up')
  } else if (presentIds.length > 0) {
    nextSteps.push(`Confirm attendance for ${presentIds.length} present player${presentIds.length !== 1 ? 's' : ''}`)
  }
  if (!wrapUpSubmitted) {
    nextSteps.push('Complete and submit your wrap-up — describe what worked, what to adjust, and any standout moments')
    if (presentIds.length > 0) {
      nextSteps.push(`Mention any players who need attention or showed strong progress`)
    }
  } else if (wrapUpPendingReview) {
    nextSteps.push('Wrap-up submitted — waiting for director review. No further action needed unless they request changes.')
  } else if (wrapUpApproved) {
    nextSteps.push('Wrap-up approved. Session is complete — prepare for your next session.')
  } else if (wrapUpRejected) {
    nextSteps.push('Director requested changes — review their notes and resubmit your wrap-up')
  }
  if (absentIds.length > 0 && !wrapUpSubmitted) {
    nextSteps.push(`Note ${absentIds.length} absent player${absentIds.length !== 1 ? 's' : ''} in your wrap-up`)
  }

  return {
    contextType: 'coach_wrap_up_context',
    title: `Wrap-Up: ${sessionLabel}`,
    summary: `${sessionLabel} (${session.status}) — ${
      wrapUpSubmitted ? wrapUpStatusLabel : 'wrap-up not yet submitted'
    }. ${attendanceRows.length > 0 ? `${presentIds.length} of ${attendanceRows.length} present.` : 'No attendance recorded.'}`,
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions (ownership-verified: id + academy_id + coach_id)',
      ...(blocks.length > 0 ? ['session_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['session_attendance', 'players'] : []),
      ...(wrapUpSubmitted ? ['proposed_actions (wrap-up submission)'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No session data was changed.',
      'Session verified as coach-owned: id + academy_id + coach_id = authenticated user.',
      'session_blocks and session_attendance scoped via ownership-verified session ID.',
      'proposed_actions Q5 double-scoped: academy_id + target_object_id + proposed_by_id = authenticated user.',
      'No director-private notes, no other coaches\' data, no parent data exposed.',
    ],
    recommendationInputsAvailable: [
      'session_status',
      'session_date',
      ...(blocks.length > 0 ? ['lesson_plan_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['attendance_data', 'present_players', 'absent_players'] : []),
      ...(wrapUpSubmitted ? ['wrap_up_submission_status'] : []),
    ],
    recommendationInputsMissing: [
      ...(attendanceRows.length === 0 ? ['attendance_records'] : []),
      ...(!wrapUpSubmitted ? ['wrap_up_submission'] : []),
    ],
    possibleSuggestionTypes: ['session_focus_recommendation', 'player_attention_signal', 'parent_update_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Class template detail context — Sprint 867
// Fetches context for a single class template: meta, block list, curriculum level,
// recent session usage, and pending review items.
// Safety: Q1 double-scoped (id + academy_id). template_blocks has no academy_id —
// scoped via Q1-verified templateId. Sessions double-scoped (template_id + academy_id).
// proposed_actions double-scoped (academy_id + target_object_id = templateId).
// No curriculum_class_template_blocks queried — migration 062 pending on live DB.
// ---------------------------------------------------------------------------

async function fetchClassTemplateDetailContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  templateId: string | undefined,
): Promise<DonnaContextSummary> {
  if (!templateId) {
    return makeFallbackSummary(
      'class_template_detail',
      'No template ID found in the current URL. Open a specific class template to use this summary.',
    )
  }

  const rawDb = supabase as any

  // Query 1 — Template meta (double-scoped: id + academy_id)
  // Returns null if template does not exist or belongs to a different academy.
  const { data: templateRaw } = await rawDb
    .from('templates')
    .select('id, name, description, status, template_type, total_duration_min, is_active, tags, curriculum_level_id, created_at, updated_at, template_goal')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!templateRaw) {
    return makeFallbackSummary(
      'class_template_detail',
      'Template not found or access denied.',
    )
  }

  const template = templateRaw as {
    id: string
    name: string
    description: string | null
    status: string
    template_type: string | null
    total_duration_min: number | null
    is_active: boolean
    tags: string[] | null
    curriculum_level_id: string | null
    created_at: string
    updated_at: string
    template_goal: string | null
  }

  // Safety: verify this is a class template, not a fitness template.
  // Fitness templates are tagged with 'fitness_template:true' — same guard
  // used in fetchClassTemplateCollection.
  const isFitnessTemplate = (template.tags ?? []).includes('fitness_template:true')
  if (isFitnessTemplate) {
    return makeFallbackSummary(
      'class_template_detail',
      'This is a fitness template, not a class template. Open a class template for curriculum context.',
    )
  }

  // Query 2 — Template blocks
  // Safety: template_blocks has no academy_id column.
  // Scoped via templateId verified in Q1 (double-scoped at template level).
  const { data: blocksRaw } = await rawDb
    .from('template_blocks')
    .select('id, name, type, duration_min, order_index, intensity_level')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true })

  const blocks = (blocksRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    duration_min: number
    order_index: number
    intensity_level: string | null
  }>

  // Query 3 — Curriculum level name (only if curriculum_level_id is set)
  // curriculum_levels is a global table with no academy_id — that is expected.
  let levelName: string | null = null
  if (template.curriculum_level_id) {
    const { data: levelRaw } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name')
      .eq('id', template.curriculum_level_id)
      .maybeSingle()
    levelName = levelRaw?.display_name ?? null
  }

  // Query 4 — Recent session usage (past 30 days + upcoming)
  // Double-scoped: template_id + academy_id.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id, scheduled_date, status')
    .eq('template_id', templateId)
    .eq('academy_id', academyId)
    .gte('scheduled_date', thirtyDaysAgo)
    .order('scheduled_date', { ascending: false })

  const recentSessions = (sessionsRaw ?? []) as Array<{
    id: string
    scheduled_date: string
    status: string
  }>

  const pastSessions = recentSessions.filter(s => s.scheduled_date < today)
  const upcomingSessions = recentSessions.filter(s => s.scheduled_date >= today && s.status !== 'cancelled')
  const completedSessions = recentSessions.filter(s => s.status === 'completed')
  const lastUsedDate = pastSessions.length > 0
    ? new Date(pastSessions[0].scheduled_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : null

  // Query 5 — Pending review items linked to this template
  // Double-scoped: academy_id + target_object_id = templateId.
  const { data: pendingRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_type, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('target_object_id', templateId)
    .eq('status', 'pending_review')

  const pendingItems = (pendingRaw ?? []) as Array<{
    id: string
    action_type: string
    target_module: string
    created_at: string
  }>
  const pendingCount = pendingItems.length

  // --- Derived values ---
  const templateName = template.name ?? `Template ${templateId.slice(0, 8)}`
  const statusLabel = template.is_active ? 'Active' : (template.status ?? 'Unknown')
  const typeLabel = template.template_type ?? null
  const totalDuration = template.total_duration_min ?? blocks.reduce((sum, b) => sum + (b.duration_min ?? 0), 0)
  const hasBlocks = blocks.length > 0
  const blockNames = blocks.map(b => b.name).slice(0, 3).join(', ')
  const completedCount = completedSessions.length

  // --- Build context ---
  const keyFacts: string[] = []
  keyFacts.push(`Status: ${statusLabel}${typeLabel ? ` — ${typeLabel}` : ''}`)
  if (levelName) {
    keyFacts.push(`Curriculum level: ${levelName}`)
  } else {
    keyFacts.push('No curriculum level assigned yet')
  }
  if (totalDuration > 0) keyFacts.push(`Duration: ${totalDuration} min`)
  if (template.template_goal) keyFacts.push(`Goal: ${template.template_goal}`)
  if (hasBlocks) {
    keyFacts.push(`${blocks.length} block${blocks.length !== 1 ? 's' : ''}: ${blockNames}${blocks.length > 3 ? '…' : ''}`)
  } else {
    keyFacts.push('No blocks added yet — lesson plan is empty')
  }
  if (recentSessions.length > 0) {
    keyFacts.push(
      `Used ${recentSessions.length} time${recentSessions.length !== 1 ? 's' : ''} in last 30 days${
        completedCount > 0 ? ` (${completedCount} completed)` : ''
      }${lastUsedDate ? `, last on ${lastUsedDate}` : ''}`,
    )
    if (upcomingSessions.length > 0) {
      keyFacts.push(`${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''} using this template`)
    }
  } else {
    keyFacts.push('No sessions run from this template in the last 30 days')
  }
  if (pendingCount > 0) {
    keyFacts.push(`${pendingCount} pending review item${pendingCount !== 1 ? 's' : ''} linked to this template`)
  }

  const missingData: string[] = []
  if (!levelName) missingData.push('Curriculum level — needed to connect template to development pathway')
  if (!hasBlocks) missingData.push('No lesson plan blocks — template cannot be used for sessions yet')
  if (recentSessions.length === 0) missingData.push('No recent session usage — template may not be in active rotation')
  if (!template.description && !template.template_goal) missingData.push('No description or goal — coaches may not know the purpose of this template')

  const nextSteps: string[] = []
  if (!hasBlocks) {
    nextSteps.push('Add blocks to the lesson plan — this template is empty and cannot generate sessions yet')
  } else if (blocks.length < 3) {
    nextSteps.push(`Review block order — only ${blocks.length} block${blocks.length !== 1 ? 's' : ''} in the lesson plan`)
  } else {
    nextSteps.push('Review the block sequence to confirm it matches the curriculum level intent')
  }
  if (!levelName) {
    nextSteps.push('Assign a curriculum level to connect this template to the development pathway')
  }
  if (hasBlocks && recentSessions.length === 0) {
    nextSteps.push('Generate a session from this template to put it into active use')
  }
  if (upcomingSessions.length > 0) {
    nextSteps.push(`${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''} use this template — confirm blocks are ready before coaches run them`)
  }
  if (pendingCount > 0) {
    nextSteps.push(`Review ${pendingCount} pending item${pendingCount !== 1 ? 's' : ''} linked to this template in the Review Queue`)
  }
  if (nextSteps.length === 0) {
    nextSteps.push('Template looks complete — check usage signals after next session runs')
  }

  const openQuestions: string[] = []
  if (!levelName) {
    openQuestions.push('What curriculum level does this template target? Assign one to make it searchable by coaches.')
  }
  if (!hasBlocks) {
    openQuestions.push('This template has no blocks — is it still in draft?')
  } else if (blocks.length > 0 && recentSessions.length === 0) {
    openQuestions.push('Template has blocks but has not been used recently — is it still relevant to the current curriculum?')
  }
  if (pendingCount > 0) {
    openQuestions.push(`${pendingCount} pending item${pendingCount !== 1 ? 's' : ''} linked to this template — what are they waiting on?`)
  }

  const summaryParts: string[] = [`${templateName} — ${statusLabel}`]
  if (levelName) summaryParts.push(`targeting ${levelName}`)
  if (hasBlocks) summaryParts.push(`${blocks.length} block${blocks.length !== 1 ? 's' : ''}`)
  if (recentSessions.length > 0) summaryParts.push(`used ${recentSessions.length} time${recentSessions.length !== 1 ? 's' : ''} in last 30 days`)

  return {
    contextType: 'class_template_detail',
    title: `Template: ${templateName}`,
    summary: summaryParts.join(', ') + '.',
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'templates (academy_id + id scoped)',
      ...(hasBlocks ? ['template_blocks (scoped via Q1-verified templateId)'] : []),
      ...(levelName ? ['curriculum_levels'] : []),
      ...(recentSessions.length > 0 ? ['sessions (template_id + academy_id scoped)'] : []),
      ...(pendingCount > 0 ? ['proposed_actions (academy_id + target_object_id scoped)'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No template data was changed.',
      'template_blocks has no academy_id — scoped via Q1-verified templateId (academy boundary enforced at template level).',
      'Fitness template guard applied — class template detail will not surface fitness template data.',
      'curriculum_class_template_blocks not queried — migration 062 pending on live DB (documented in KNOWN_LIMITATIONS.md).',
    ],
    recommendationInputsAvailable: [
      'template_status',
      ...(levelName ? ['curriculum_level'] : []),
      ...(hasBlocks ? ['block_count', 'block_names'] : []),
      ...(recentSessions.length > 0 ? ['recent_usage_count'] : []),
      ...(totalDuration > 0 ? ['total_duration'] : []),
    ],
    recommendationInputsMissing: [
      ...(!levelName ? ['curriculum_level'] : []),
      ...(!hasBlocks ? ['lesson_plan_blocks'] : []),
      ...(recentSessions.length === 0 ? ['recent_session_usage'] : []),
    ],
    possibleSuggestionTypes: ['template_recommendation', 'session_focus_recommendation', 'curriculum_priority_suggestion'],
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Session detail context — Sprint 863
// Fetches full context for a single session: meta, coach, blocks, attendance, wrap-up.
// Safety: session query is double-scoped (id + academy_id). session_attendance has
// no academy_id column — it is scoped via session_id, which is already verified above.
// ---------------------------------------------------------------------------

async function fetchSessionDetailContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  sessionId: string | undefined,
): Promise<DonnaContextSummary> {
  if (!sessionId) {
    return makeFallbackSummary('session_detail', 'No session ID found in the current URL. Open a specific session to use this summary.')
  }

  const rawDb = supabase as any

  // Query 1 — Session meta (double-scoped: id + academy_id)
  const { data: sessionRaw } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, duration_min, location, coach_id, template_id, group_id, session_notes')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!sessionRaw) {
    return makeFallbackSummary('session_detail', 'Session not found or access denied.')
  }

  const session = sessionRaw as {
    id: string
    name: string | null
    scheduled_date: string | null
    scheduled_time: string | null
    status: string
    duration_min: number | null
    location: string | null
    coach_id: string | null
    template_id: string | null
    group_id: string | null
    session_notes: string | null
  }

  // Query 2 — Coach name
  let coachName: string | null = null
  if (session.coach_id) {
    const { data: profileRaw } = await rawDb
      .from('profiles')
      .select('full_name, first_name')
      .eq('id', session.coach_id)
      .maybeSingle()
    coachName = profileRaw?.full_name
      ? String(profileRaw.full_name)
      : profileRaw?.first_name
      ? String(profileRaw.first_name)
      : null
  }

  // Query 3 — Session blocks
  const { data: blocksRaw } = await rawDb
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index, actual_status, intensity')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  const blocks = (blocksRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    duration_min: number | null
    order_index: number
    actual_status: string | null
    intensity: string | null
  }>

  // Query 4 — Session attendance
  // NOTE: session_attendance has no academy_id column.
  // Safety is provided by the session query above (academy_id verified via session).
  const { data: attendanceRaw } = await rawDb
    .from('session_attendance')
    .select('player_id, status')
    .eq('session_id', sessionId)

  const attendanceRows = (attendanceRaw ?? []) as Array<{ player_id: string; status: string }>
  const presentIds = attendanceRows.filter(r => r.status === 'present').map(r => r.player_id)
  const absentIds = attendanceRows.filter(r => r.status === 'absent').map(r => r.player_id)
  const lateIds = attendanceRows.filter(r => r.status === 'late').map(r => r.player_id)

  // Query 5 — Player names (only if attendance exists)
  const allPlayerIds = attendanceRows.map(r => r.player_id).filter(Boolean)
  const playerNameMap = new Map<string, string>()
  if (allPlayerIds.length > 0) {
    const { data: playersRaw } = await rawDb
      .from('players')
      .select('id, full_name, first_name, last_name')
      .in('id', allPlayerIds)
      .eq('academy_id', academyId)  // explicit academy_id scope on players
    for (const p of ((playersRaw ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null }>)) {
      playerNameMap.set(
        p.id,
        p.full_name ?? ([p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown'),
      )
    }
  }

  // Query 6 — Wrap-up status (latest proposed_action for this session)
  const { data: wrapUpRaw } = await rawDb
    .from('proposed_actions')
    .select('id, status, created_at')
    .eq('academy_id', academyId)
    .eq('target_object_id', sessionId)
    .eq('target_module', 'session_wrap_up_v1')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const wrapUpStatus: string | null = wrapUpRaw?.status ?? null

  // --- Build context ---
  const sessionLabel = session.name ?? `Session ${session.id.slice(0, 8)}`
  const dateLabel = session.scheduled_date
    ? new Date(session.scheduled_date + 'T12:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : 'Date unknown'

  const completedBlocks = blocks.filter(b => b.actual_status === 'completed').length

  const keyFacts: string[] = []
  keyFacts.push(`Status: ${session.status}`)
  keyFacts.push(`Date: ${dateLabel}${session.scheduled_time ? ` at ${session.scheduled_time.slice(0, 5)}` : ''}`)
  if (coachName) keyFacts.push(`Coach: ${coachName}`)
  else if (session.coach_id) keyFacts.push('Coach profile not loaded')
  if (session.location) keyFacts.push(`Location: ${session.location}`)
  if (session.duration_min) keyFacts.push(`Duration: ${session.duration_min} min`)
  if (blocks.length > 0) {
    keyFacts.push(
      `${blocks.length} block${blocks.length !== 1 ? 's' : ''} in lesson plan${
        completedBlocks > 0 ? ` (${completedBlocks} completed)` : ''
      }`,
    )
  } else {
    keyFacts.push('No blocks in lesson plan')
  }
  if (attendanceRows.length > 0) {
    const parts: string[] = []
    if (presentIds.length > 0) parts.push(`${presentIds.length} present`)
    if (absentIds.length > 0) parts.push(`${absentIds.length} absent`)
    if (lateIds.length > 0) parts.push(`${lateIds.length} late`)
    keyFacts.push(`Attendance: ${parts.join(', ')} (${attendanceRows.length} total)`)
  } else {
    keyFacts.push('No attendance recorded')
  }
  if (wrapUpStatus) {
    keyFacts.push(`Wrap-up: ${wrapUpStatus.replace(/_/g, ' ')}`)
  } else if (session.status === 'completed') {
    keyFacts.push('No wrap-up submitted yet')
  }

  const missingData: string[] = []
  if (!session.coach_id) missingData.push('No coach assigned to this session')
  if (blocks.length === 0) missingData.push('Lesson plan empty — no blocks added')
  if (attendanceRows.length === 0 && session.status === 'completed') {
    missingData.push('No attendance recorded for completed session')
  }
  if (!wrapUpStatus && session.status === 'completed') {
    missingData.push('No coach wrap-up submitted')
  }
  if (!session.template_id) missingData.push('No template linked to this session')

  const nextSteps: string[] = []
  if (session.status === 'planned') {
    if (!session.coach_id) {
      nextSteps.push('Assign a coach before this session runs')
    } else if (blocks.length === 0) {
      nextSteps.push('Add blocks to the lesson plan before the session starts')
    } else {
      nextSteps.push('Session is planned — confirm coach has the lesson plan')
    }
  } else if (session.status === 'in_progress') {
    nextSteps.push('Session is in progress — check back after it completes')
  } else if (session.status === 'completed') {
    if (!wrapUpStatus) {
      nextSteps.push('Request coach wrap-up submission for this session')
    } else if (wrapUpStatus === 'pending_review') {
      nextSteps.push('Wrap-up is awaiting review — open the Review Queue to action it')
    } else {
      nextSteps.push('Session complete — check Signals for any player attention items')
    }
  } else {
    nextSteps.push(`Session is ${session.status} — review if any action is required`)
  }

  const openQuestions: string[] = []
  if (absentIds.length >= 2) {
    const names = absentIds.slice(0, 2).map(id => playerNameMap.get(id) ?? 'Unknown').join(', ')
    openQuestions.push(
      `${absentIds.length} player${absentIds.length !== 1 ? 's' : ''} absent (${names}${absentIds.length > 2 ? ', …' : ''}) — should parents be notified?`,
    )
  }
  if (wrapUpStatus === 'pending_review') {
    openQuestions.push('Wrap-up is in the Review Queue — what were the key coaching observations?')
  }
  if (!session.template_id && session.status !== 'cancelled') {
    openQuestions.push('No template linked — was this session created ad hoc?')
  }

  const summaryParts: string[] = [`${sessionLabel} — ${session.status}`]
  if (coachName) summaryParts.push(`coached by ${coachName}`)
  summaryParts.push(`on ${dateLabel}`)
  if (attendanceRows.length > 0) {
    summaryParts.push(`${presentIds.length} of ${attendanceRows.length} player${attendanceRows.length !== 1 ? 's' : ''} present`)
  }

  return {
    contextType: 'session_detail',
    title: `Session: ${sessionLabel}`,
    summary: summaryParts.join(', ') + '.',
    keyFacts,
    openQuestions,
    suggestedNextSteps: nextSteps,
    dataUsed: [
      'sessions',
      ...(session.coach_id ? ['profiles (coach name)'] : []),
      ...(blocks.length > 0 ? ['session_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['session_attendance', 'players'] : []),
      ...(wrapUpStatus !== null ? ['proposed_actions (wrap-up)'] : []),
    ],
    missingData,
    safetyNotes: [
      'Read-only summary. No session data was changed.',
      'session_attendance scoped via session_id — academy boundary verified by session query.',
    ],
    recommendationInputsAvailable: [
      'session_status',
      'session_date',
      ...(coachName ? ['coach_name'] : []),
      ...(blocks.length > 0 ? ['lesson_plan_blocks'] : []),
      ...(attendanceRows.length > 0 ? ['attendance_data'] : []),
      ...(wrapUpStatus ? ['wrap_up_status'] : []),
    ],
    recommendationInputsMissing: [
      ...(!session.coach_id ? ['coach_assignment'] : []),
      ...(blocks.length === 0 ? ['lesson_plan'] : []),
      ...(attendanceRows.length === 0 ? ['attendance_records'] : []),
      ...(!wrapUpStatus && session.status === 'completed' ? ['wrap_up'] : []),
    ],
    possibleSuggestionTypes: [
      'session_focus_recommendation',
      'player_attention_signal',
      'parent_update_suggestion',
    ],
    fetchedAt: new Date().toISOString(),
  }
}

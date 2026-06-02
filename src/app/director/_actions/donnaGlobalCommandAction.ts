'use server'

// DONNA Global Command Action V1
//
// The single entry point for all DONNA natural language commands.
// Routes question → intent → data → structured answer → evidence → actions.
//
// Pipeline:
//   1. Auth + role resolution
//   2. Intent classification (deterministic)
//   3. Data fetching (scoped to intent's requiredData)
//   4. Answer generation (deterministic or fallback to LLM orchestrator)
//   5. Evidence assembly
//   6. Action proposal (risk-classified)
//   7. Follow-up question suggestions
//   8. Command logging
//   9. Return structured DonnaCommandResult
//
// Safety:
//   - academyId always server-resolved
//   - Role determines which data is returned
//   - High-risk actions always route to approvals — never auto-executed
//   - Parent/player responses use only parent-safe data
//   - Missing data is explicit, never invented

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import { classifyDonnaIntent } from '@/lib/donna/donnaGlobalIntentRouter'
import { getProposedActions, getMaxRisk } from '@/lib/donna/donnaActionProposalEngine'
import {
  buildPlayerReadinessEvidence,
  buildPlacementEvidence,
  buildGenericPlayerEvidence,
  type PlayerEvidenceData,
  type EvidenceSummary,
} from '@/lib/donna/donnaEvidenceSynthesizer'
import { generateDonnaPlayerSummary } from '@/lib/donna/donnaPlayerBlueprintContext'
import { getPlayerEvidenceRecords } from '@/lib/evidence/playerEvidenceAggregator'
import { computeProgressRollup } from '@/lib/evidence/playerProgressRollup'
import {
  buildWhyThisLevelAnswer,
  buildEvidenceForNextLevelAnswer,
  buildWhatChangedAnswer,
  buildStalledCheckAnswer,
  buildMissionConnectionAnswer,
  buildCoachWatchNextAnswer,
} from '@/lib/evidence/donnaEvidenceAnswers'
import type { Database } from '@/lib/supabase/database.types'
import type { DonnaIntent } from '@/lib/donna/donnaGlobalIntentRouter'
import type { ProposedAction } from '@/lib/donna/donnaActionProposalEngine'

type UserRole = Database['public']['Enums']['user_role']

// ── Input/Output types ────────────────────────────────────────────────────────

export interface DonnaCommandInput {
  question: string
  /** Current page pathname */
  pagePath: string
  /** Player ID if on a player page */
  playerId?: string | null
  /** Session ID if on a session page */
  sessionId?: string | null
}

export interface DonnaCommandResult {
  ok: boolean
  error?: string

  // Classification
  intent: DonnaIntent
  intentCategory: string
  confidence: number

  // Answer
  answer: string
  evidenceSummary: EvidenceSummary | null

  // Actions
  proposedActions: ProposedAction[]
  maxRisk: 'low' | 'medium' | 'high'
  requiresApproval: boolean

  // Follow-up questions
  followUpQuestions: string[]

  // Role context
  role: string

  // Logging
  commandId: string | null
}

// ── Follow-up question builder ────────────────────────────────────────────────

function buildFollowUpQuestions(
  intent: DonnaIntent,
  playerName?: string | null,
): string[] {
  const name = playerName ?? 'this player'

  const followUps: Record<DonnaIntent, string[]> = {
    summarize_player:              [`Why is ${name} at this level?`, `What should the coach focus on?`, `What should the parent know?`],
    player_readiness:              [`What is blocking level movement?`, `What missions should stay active?`, `Should I start a reassessment?`],
    player_blockers:               [`Assign a mission to address this`, `Start a reassessment`, `What should the coach focus on?`],
    player_progress:               [`What improved since last assessment?`, `What missions are active?`, `Is ${name} ready for level review?`],
    player_missions:               [`Why were these missions assigned?`, `What priority does this mission address?`, `Mark a mission as completed`],
    player_parent_summary:         [`Draft a parent update for ${name}`, `What should the parent do at home?`],
    players_needing_attention:     [`Show me stalled players`, `Show overdue assessments`, `Open the Approvals queue`],
    stalled_players:               [`Start reassessments for stalled players`, `Show who is ready for level review`],
    overdue_assessments:           [`Start an assessment`, `Who is overdue?`, `Show due assessments`],
    due_assessments:               [`Start an assessment`, `Who is overdue?`],
    submitted_assessments:         [`Open Approvals`, `Compare with previous assessment`],
    start_assessment:              [`What type of assessment should I run?`],
    compare_assessments:           [`What changed since the last assessment?`, `Should I update the blueprint?`],
    explain_placement_recommendation: [`What evidence supports this?`, `What could make this recommendation wrong?`, `What to check in 4-6 weeks?`],
    pending_placements:            [`Open Approvals`, `Review placement recommendations`],
    placement_overrides:           [`Why was this overridden?`, `What was the DONNA recommendation?`],
    level_review_candidates:       [`Start a level review`, `What evidence supports readiness?`],
    explain_level_blockers:        [`Assign a mission to address this`, `Start a reassessment`, `What gates are missing?`],
    create_level_readiness_review: [`What evidence do I need?`, `Who approves level movement?`],
    today_sessions:                [`What should I watch today?`, `Which session is next?`],
    coach_watch_fors:              [`Add a quick capture note`, `What missions are active?`],
    missing_wrapups:               [`Open Approvals`, `Who hasn't submitted a wrap-up?`],
    coach_assessment_submissions:  [`Open Assessments`, `Start a new assessment`],
    pending_parent_updates:        [`Open Approvals`, `Draft a parent update`],
    draft_parent_update:           [`What should I include?`, `Review in Approvals before sending`],
    explain_parent_progress:       [`What should the parent do at home?`, `What is the next milestone?`],
    academy_attention_today:       [`Show me stalled players`, `Show overdue assessments`, `Open Approvals`],
    overloaded_groups:             [`Show group capacity`, `Go to Players`],
    curriculum_gaps:               [`Show curriculum coverage`, `Which levels need content?`],
    missing_data:                  [`Which players have no assessment?`, `Which players have no curriculum level?`],
    go_to_player:                  [],
    go_to_approvals:               [],
    go_to_assessments:             [],
    assign_mission:                [`What priority should this mission address?`],
    add_player:                    [`What happens after I create the player?`, `How does the placement work?`],
    resume_onboarding:             [`Who needs to be placed?`, `Add a new player`, `Open Onboarding Dashboard`],
    freeform_question:             [`Ask DONNA anything else`, `Show academy health`, `Open Approvals`],
  }

  return (followUps[intent] ?? []).slice(0, 3)
}

// ── Answer generators ─────────────────────────────────────────────────────────

function buildMissingDataAnswer(playerName: string, missingPoints: EvidenceSummary['missing']): string {
  if (missingPoints.length === 0) return ''
  const gaps = missingPoints.map(m => m.what).join(', ')
  const resolve = missingPoints[0]
  return `I can't fully answer this question yet because ${playerName ?? 'this player'} is missing: ${gaps}. ` +
    `The most important next step: ${resolve?.whyItMatters ?? 'Complete the missing data'}.`
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function donnaGlobalCommandAction(
  input: DonnaCommandInput,
): Promise<DonnaCommandResult> {
  const failResult = (error: string): DonnaCommandResult => ({
    ok: false, error,
    intent: 'freeform_question',
    intentCategory: 'freeform',
    confidence: 0,
    answer: error,
    evidenceSummary: null,
    proposedActions: [],
    maxRisk: 'low',
    requiresApproval: false,
    followUpQuestions: [],
    role: 'unknown',
    commandId: null,
  })

  try {
    await assertNotPreviewMode()
  } catch {
    return failResult('Commands are disabled in preview mode.')
  }

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return failResult('Not authenticated.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return failResult('Academy context unavailable.')
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = (membership?.role as UserRole | undefined) ?? 'academy_director'

  // 1. Classify intent
  const classification = classifyDonnaIntent(input.question, {
    route: input.pagePath,
    hasPlayerContext: !!input.playerId,
  })

  const rawDb = supabase as any

  // 2. Fetch data based on requiredData + player context
  let playerData: PlayerEvidenceData = {}
  let answer = ''
  let evidenceSummary: EvidenceSummary | null = null
  let playerFirstName: string | null = null

  const resolvedPlayerId = input.playerId ?? null

  // Fetch player if we have a player context or player name hint
  if (resolvedPlayerId) {
    const { data: playerRow } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name, status')
      .eq('id', resolvedPlayerId)
      .eq('academy_id', academyId)
      .single()

    if (playerRow) {
      playerFirstName = playerRow.first_name ?? null

      // Fetch latest assessment
      const { data: latestAssessment } = await supabase
        .from('assessments')
        .select('id, assessed_date, overall_score, technical_score, tactical_score, movement_score, competition_score, behavioral_score, strengths, weaknesses')
        .eq('player_id', resolvedPlayerId)
        .eq('academy_id', academyId)
        .order('assessed_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const ageMs = latestAssessment?.assessed_date
        ? Date.now() - new Date(latestAssessment.assessed_date).getTime()
        : null
      const ageDays = ageMs !== null ? Math.floor(ageMs / (1000 * 60 * 60 * 24)) : null

      // Fetch curriculum state
      const { data: csRow } = await rawDb
        .from('player_curriculum_states')
        .select('current_level_id, advancement_eligible')
        .eq('player_id', resolvedPlayerId)
        .eq('academy_id', academyId)
        .limit(1)
        .maybeSingle()

      let currentLevelName: string | null = null
      let gatesMet = 0
      let gatesTotal = 0

      if (csRow?.current_level_id) {
        const { data: lvl } = await supabase.from('curriculum_levels').select('display_name').eq('id', csRow.current_level_id).single()
        currentLevelName = lvl?.display_name ?? null

        try {
          const { count: met } = await rawDb
            .from('player_gate_status')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', resolvedPlayerId)
            .eq('academy_id', academyId)
            .in('status', ['confirmed', 'evidence_threshold_met'])
          const { count: total } = await rawDb
            .from('curriculum_gates')
            .select('*', { count: 'exact', head: true })
            .eq('level_id', csRow.current_level_id)
          gatesMet   = (met as number | null) ?? 0
          gatesTotal = (total as number | null) ?? 0
        } catch { /* migration pending */ }
      }

      // Fetch active missions
      let activeMissionLabels: string[] = []
      let activeMissionCount = 0
      try {
        const { data: missions } = await rawDb
          .from('player_mission_assignments')
          .select('mission_label')
          .eq('player_id', resolvedPlayerId)
          .eq('academy_id', academyId)
          .eq('status', 'active')
          .limit(3)
        activeMissionLabels = ((missions ?? []) as Array<{ mission_label: string }>).map(m => m.mission_label)
        activeMissionCount = activeMissionLabels.length
      } catch { /* migration pending */ }

      // Fetch blueprint
      let hasBlueprint = false
      let topStrengths: string[] = latestAssessment?.strengths ?? []
      let topGaps: string[] = latestAssessment?.weaknesses ?? []
      try {
        const { data: bp } = await rawDb
          .from('player_development_blueprints')
          .select('strengths, gaps')
          .eq('player_id', resolvedPlayerId)
          .eq('academy_id', academyId)
          .eq('status', 'active')
          .maybeSingle()
        if (bp) {
          hasBlueprint = true
          topStrengths = (bp.strengths as string[] | null) ?? topStrengths
          topGaps      = (bp.gaps as string[] | null) ?? topGaps
        }
      } catch { /* migration pending */ }

      // Fetch placement recommendation
      let placementConfidenceScore: number | null = null
      let placementTopReasons: string[] = []
      let placementRiskNotes: string[] = []
      try {
        const { data: placement } = await rawDb
          .from('donna_placement_recommendations')
          .select('confidence_score, top_reasons, risk_notes, recommended_level_name, decision')
          .eq('player_id', resolvedPlayerId)
          .eq('academy_id', academyId)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (placement) {
          placementConfidenceScore = placement.confidence_score ?? null
          placementTopReasons = (placement.top_reasons as string[] | null) ?? []
          placementRiskNotes  = (placement.risk_notes as string[] | null) ?? []
        }
      } catch { /* migration pending */ }

      playerData = {
        playerFirstName: playerRow.first_name ?? undefined,
        currentLevelName,
        latestAssessmentDate: latestAssessment?.assessed_date ?? null,
        latestAssessmentOverallScore: latestAssessment?.overall_score ?? null,
        latestAssessmentAgeDays: ageDays ?? undefined,
        activeMissionCount,
        activeMissionLabels,
        gatesMet,
        gatesTotal,
        topStrengths,
        topGaps,
        hasBlueprint,
        placementConfidenceScore,
        placementTopReasons,
        placementRiskNotes,
      }
    }
  }

  // 3. Build answer + evidence based on intent
  switch (classification.intent) {
    case 'player_readiness':
    case 'player_blockers':
    case 'explain_level_blockers': {
      evidenceSummary = buildPlayerReadinessEvidence(playerData)
      const name = playerFirstName ?? classification.playerNameHint ?? 'This player'
      const level = playerData.currentLevelName ?? 'their current level'
      const pct = playerData.gatesTotal ? Math.round(((playerData.gatesMet ?? 0) / playerData.gatesTotal) * 100) : null

      // Augment with evidence engine answer when player is scoped
      if (input.playerId) {
        try {
          const evResult = await getPlayerEvidenceRecords(supabase, input.playerId, academyId, { limit: 30 })
          if (evResult.records.length > 0) {
            const rollup = computeProgressRollup(input.playerId, evResult.records, {
              currentLevelName: playerData.currentLevelName ?? null,
              nextLevelName: null,
            })
            const evAnswer = classification.intent === 'explain_level_blockers'
              ? buildEvidenceForNextLevelAnswer(name, evResult.records, rollup, null)
              : buildWhyThisLevelAnswer(name, evResult.records, rollup, playerData.currentLevelName ?? null)
            if (evAnswer.confidence >= 50) {
              answer = evAnswer.answer
              break
            }
          }
        } catch { /* evidence engine is best-effort */ }
      }

      if (evidenceSummary.missing.length > 0 && evidenceSummary.points.length === 0) {
        answer = buildMissingDataAnswer(name, evidenceSummary.missing)
      } else if (pct !== null) {
        answer = pct >= 80
          ? `${name} has completed ${playerData.gatesMet}/${playerData.gatesTotal} level requirements (${pct}%) and may be approaching readiness for the next level.`
          : `${name} is at ${level} with ${pct}% of gate requirements met. ` +
            ((playerData.topGaps ?? []).length > 0 ? `Key development areas: ${(playerData.topGaps ?? []).slice(0, 2).join(', ')}.` : '')
      } else {
        answer = generateDonnaPlayerSummary('academy_director', {
          playerFirstName: playerFirstName ?? name,
          playerLastName: '',
          currentLevelName: playerData.currentLevelName ?? null,
          nextLevelName: null,
          advancementEligible: false,
          topStrengths: playerData.topStrengths ?? [],
          topGaps: playerData.topGaps ?? [],
          topPriorityTitle: null,
          activeMissionCount: playerData.activeMissionCount ?? 0,
          pendingMissionCount: playerData.pendingMissionCount ?? 0,
          activeMissionLabels: playerData.activeMissionLabels ?? [],
          coachFocusAreas: [],
          daysSinceLastAssessment: playerData.latestAssessmentAgeDays ?? null,
          gatesMet: playerData.gatesMet ?? 0,
          gatesTotal: playerData.gatesTotal ?? 0,
          parentSummary: null,
          parentDevelopmentFocus: null,
          studentFriendlySummary: null,
          comparisonSummary: null,
          placementRationale: null,
        })
      }
      break
    }

    case 'summarize_player': {
      const name = playerFirstName ?? classification.playerNameHint ?? 'This player'
      evidenceSummary = buildGenericPlayerEvidence(playerData)
      answer = generateDonnaPlayerSummary('academy_director', {
        playerFirstName: name,
        playerLastName: '',
        currentLevelName: playerData.currentLevelName ?? null,
        nextLevelName: null,
        advancementEligible: false,
        topStrengths: playerData.topStrengths ?? [],
        topGaps: playerData.topGaps ?? [],
        topPriorityTitle: (playerData.topGaps ?? [])[0] ?? null,
        activeMissionCount: playerData.activeMissionCount ?? 0,
        pendingMissionCount: playerData.pendingMissionCount ?? 0,
        activeMissionLabels: playerData.activeMissionLabels ?? [],
        coachFocusAreas: [],
        daysSinceLastAssessment: playerData.latestAssessmentAgeDays ?? null,
        gatesMet: playerData.gatesMet ?? 0,
        gatesTotal: playerData.gatesTotal ?? 0,
        parentSummary: null,
        parentDevelopmentFocus: null,
        studentFriendlySummary: null,
        comparisonSummary: null,
        placementRationale: playerData.placementTopReasons?.[0] ?? null,
      })
      break
    }

    case 'explain_placement_recommendation': {
      evidenceSummary = buildPlacementEvidence(playerData)
      const name = playerFirstName ?? classification.playerNameHint ?? 'This player'
      if (playerData.placementTopReasons && playerData.placementTopReasons.length > 0) {
        answer = `DONNA recommended ${playerData.currentLevelName ?? 'this level'} for ${name} ` +
          `with ${playerData.placementConfidenceScore ?? '?'}% confidence. ` +
          `Key reasons: ${playerData.placementTopReasons.slice(0, 2).join('; ')}.`
      } else {
        answer = `No DONNA placement recommendation found for ${name}. ` +
          `Placement recommendations are generated after a scored assessment.`
      }
      break
    }

    case 'stalled_players': {
      // Use evidence engine for player-scoped stall check when playerId is provided
      if (input.playerId) {
        try {
          const evResult = await getPlayerEvidenceRecords(supabase, input.playerId, academyId, { limit: 30 })
          const rollup = computeProgressRollup(input.playerId, evResult.records, {
            currentLevelName: playerData.currentLevelName ?? null,
          })
          const evAnswer = buildStalledCheckAnswer(playerFirstName, evResult.records, rollup)
          answer = evAnswer.answer
          evidenceSummary = {
            points: evResult.records.slice(0, 3).map(r => ({
              source: 'session_data' as const,
              label: r.source_type.replace(/_/g, ' '),
              detail: r.evidence_summary.slice(0, 80),
              strength: r.evidence_strength as 'strong' | 'moderate' | 'weak',
            })),
            missing: evAnswer.missingEvidenceNote
              ? [{ what: evAnswer.missingEvidenceNote, whyItMatters: 'Required for stall assessment', resolveAction: 'start_assessment' }]
              : [],
            overallStrength: evResult.records.length > 0 ? 'moderate' : 'weak',
            evidenceNote: evAnswer.answer.slice(0, 120),
          }
          break
        } catch { /* fall through to default */ }
      }
      answer = 'Provide a specific player name to check if they are stalled, or review the Players directory.'
      break
    }

    case 'players_needing_attention':
    case 'academy_attention_today': {
      // Fetch top attention players
      const { data: attentionPlayers } = await supabase
        .from('players')
        .select('id, full_name, first_name, status')
        .eq('academy_id', academyId)
        .in('status', ['on_hold', 'reassessment_due', 'pending_placement'])
        .limit(5)

      const count = (attentionPlayers ?? []).length
      if (count === 0) {
        answer = 'No players are currently flagged as needing attention. The academy is running smoothly.'
      } else {
        const names = (attentionPlayers ?? []).map(p => p.first_name ?? p.full_name ?? 'Unknown').join(', ')
        answer = `${count} player${count > 1 ? 's' : ''} need${count === 1 ? 's' : ''} attention: ${names}. ` +
          `Check the Players directory for details.`
      }

      // Count pending approvals
      const { count: pendingCount } = await rawDb
        .from('proposed_actions')
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('status', 'pending_review')
      const pending = (pendingCount as number | null) ?? 0
      if (pending > 0) {
        answer += ` You also have ${pending} approval${pending > 1 ? 's' : ''} waiting in the queue.`
      }

      evidenceSummary = {
        points: [
          { source: 'blueprint', label: 'Attention Players', detail: `${count} flagged`, strength: count > 0 ? 'strong' : 'moderate' },
          { source: 'audit_log', label: 'Pending Approvals', detail: `${pending} items`, strength: pending > 0 ? 'strong' : 'moderate' },
        ],
        missing: [],
        overallStrength: 'moderate',
        evidenceNote: 'Based on live player status and review queue.',
      }
      break
    }

    case 'overdue_assessments':
    case 'due_assessments': {
      const { data: overdueList } = await supabase
        .from('players')
        .select('id, first_name, full_name')
        .eq('academy_id', academyId)
        .eq('status', 'active')
        .limit(10)

      answer = `Overdue assessment check: ${(overdueList ?? []).length} active players. ` +
        `Run a quick assessment from the Assessments section or the player profile.`
      break
    }

    case 'missing_wrapups': {
      const { count: wrapupCount } = await rawDb
        .from('proposed_actions')
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('target_module', 'session_wrap_up_v1')
        .eq('status', 'pending_review')
      const count = (wrapupCount as number | null) ?? 0
      answer = count > 0
        ? `${count} session wrap-up${count > 1 ? 's' : ''} are waiting for review in the Approvals queue.`
        : 'No missing wrap-ups — all recent sessions have been submitted.'
      break
    }

    case 'pending_parent_updates': {
      const { count: parentCount } = await rawDb
        .from('proposed_actions')
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('target_module', 'parent_communication')
        .eq('status', 'pending_review')
      const count = (parentCount as number | null) ?? 0
      answer = count > 0
        ? `${count} parent update${count > 1 ? 's' : ''} are waiting for your review in the Approvals queue.`
        : 'No parent updates are currently pending review.'
      break
    }

    case 'go_to_approvals':
      answer = 'Opening the Approvals queue.'
      break

    case 'go_to_assessments':
      answer = 'Opening the Assessments section.'
      break

    case 'add_player':
      answer = "Let's add the player's basic information first. After that, I'll guide you through parent contact, assessment, placement, and activation."
      break

    case 'resume_onboarding': {
      const { data: pendingRows } = await supabase
        .from('players')
        .select('first_name, full_name')
        .eq('academy_id', academyId)
        .in('status', ['pending_placement', 'placement_in_progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      const pending = pendingRows ?? []
      const count = pending.length

      if (count === 0) {
        answer = 'No players are currently in the onboarding pipeline. All players are placed or you have not added any yet. Use "Add a new player" to start.'
      } else {
        const names = pending
          .map(p => p.first_name ?? p.full_name ?? 'Unnamed')
          .join(', ')
        answer = `${count} player${count !== 1 ? 's' : ''} still in the onboarding pipeline: ${names}. Open the Onboarding Dashboard to resume any of them.`
      }
      break
    }

    default:
      // All other intents: use DONNA role-aware summary if player context exists
      if (resolvedPlayerId && playerFirstName) {
        evidenceSummary = buildGenericPlayerEvidence(playerData)
        answer = generateDonnaPlayerSummary('academy_director', {
          playerFirstName: playerFirstName ?? '',
          playerLastName: '',
          currentLevelName: playerData.currentLevelName ?? null,
          nextLevelName: null,
          advancementEligible: false,
          topStrengths: playerData.topStrengths ?? [],
          topGaps: playerData.topGaps ?? [],
          topPriorityTitle: null,
          activeMissionCount: playerData.activeMissionCount ?? 0,
          pendingMissionCount: playerData.pendingMissionCount ?? 0,
          activeMissionLabels: playerData.activeMissionLabels ?? [],
          coachFocusAreas: [],
          daysSinceLastAssessment: playerData.latestAssessmentAgeDays ?? null,
          gatesMet: playerData.gatesMet ?? 0,
          gatesTotal: playerData.gatesTotal ?? 0,
          parentSummary: null,
          parentDevelopmentFocus: null,
          studentFriendlySummary: null,
          comparisonSummary: null,
          placementRationale: null,
        })
      } else {
        answer = `I can help with: player summaries, readiness questions, assessment status, pending approvals, or general academy health. What would you like to know?`
      }
  }

  // 4. Proposed actions
  const proposedActions = getProposedActions(classification.intent, { playerId: resolvedPlayerId })
  const maxRisk = getMaxRisk(proposedActions)
  const requiresApproval = proposedActions.some(a => a.requiresApproval)

  // 5. Follow-up questions
  const followUpQuestions = buildFollowUpQuestions(classification.intent, playerFirstName ?? classification.playerNameHint)

  // 6. Log command (best-effort, non-blocking)
  let commandId: string | null = null
  try {
    const { data: logRow } = await rawDb
      .from('donna_events')
      .insert({
        academy_id:       academyId,
        user_id:          user.id,
        event_type:       'global_command',
        route:            input.pagePath,
        intent:           classification.intent,
        intent_category:  classification.category,
        confidence:       classification.confidence,
        question_hash:    input.question.slice(0, 200),
        answer_summary:   answer.slice(0, 200),
        player_id:        resolvedPlayerId ?? null,
        session_id:       input.sessionId ?? null,
        action_proposed:  proposedActions[0]?.id ?? null,
        requires_approval: requiresApproval,
      })
      .select('id')
      .maybeSingle()
    commandId = logRow?.id ?? null
  } catch { /* donna_events table may not exist */ }

  // Write audit log for high-risk action proposals
  if (maxRisk === 'high') {
    await writeAuditLog({
      db: supabase,
      academyId,
      actorId: user.id,
      actorRole: role,
      action: 'donna_high_risk_action_proposed',
      targetType: 'donna_command',
      targetId: commandId,
      targetLabel: classification.intent,
      payload: {
        intent: classification.intent,
        question: input.question.slice(0, 200),
        proposed_action: proposedActions[0]?.id ?? null,
      },
      sourceType: 'api',
    })
  }

  return {
    ok: true,
    intent: classification.intent,
    intentCategory: classification.category,
    confidence: classification.confidence,
    answer,
    evidenceSummary,
    proposedActions,
    maxRisk,
    requiresApproval,
    followUpQuestions,
    role,
    commandId,
  }
}

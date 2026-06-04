import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getPlayerById } from '@/lib/backend/players'
import { getPlayerCurriculumDomains } from '@/lib/backend/curriculum'
import { CurriculumLevelPickerCard, type CurriculumLevelOption } from './CurriculumLevelPickerCard'
import { getPlayerDevelopmentSummary } from '@/lib/backend/notes'
import { assignCurriculumAction, evaluateAdvancementAction } from '@/lib/actions/curriculum'
import { addObservationAction, updateDevelopmentSummaryAction, addVoiceNoteAction, generateNoteDraftAction } from '@/lib/actions/notes'
import { PlayerProfileHeader } from '@/components/player/PlayerProfileHeader'
import { CurriculumProgressGrid } from '@/components/player/CurriculumProgressGrid'
import { PlayerCurriculumEmptyState } from '@/components/player/PlayerCurriculumEmptyState'
import { EvaluateAdvancementButton } from '@/components/player/EvaluateAdvancementButton'
import { type CoachObservationRow } from './CoachObservationsFeed'
import { NotesAIDraftSection } from './NotesAIDraftSection'
import { CoachObservationEvidenceSummary } from './CoachObservationEvidenceSummary'
import { PlayerActivePriorities, type PlayerPriorityRow } from './PlayerActivePriorities'
import { PlayerProgressionRequirements } from './PlayerProgressionRequirements'
import { PriorityRecommendationDraftButton } from './PriorityRecommendationDraftButton'
import { PriorityRecommendationDrafts, type PriorityRecommendationDraftRow } from './PriorityRecommendationDrafts'
import { createPriorityRecommendationDraftAction } from './priorityRecommendationAction'
import { DevelopmentSummarySection } from '@/components/player/DevelopmentSummarySection'
import { EditDevelopmentSummaryForm } from '@/components/player/EditDevelopmentSummaryForm'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { PlayerProfileTabs } from './_components/PlayerProfileTabs'
import { PlayerCurriculumAssignmentCard } from './PlayerCurriculumAssignmentCard'
import { PlayerCurriculumCard } from '@/components/player/PlayerCurriculumCard'
import { PlayerLevelRequirementsCard } from '@/components/player/PlayerLevelRequirementsCard'
import { resolveAcademyCurriculumContext } from '@/lib/curriculum/academyCurriculumResolution'
import { PlayerRequirementProgressReadOnly, type RequirementProgressRow } from './PlayerRequirementProgressReadOnly'
import { confirmRequirementProgressStatusAction } from './requirementProgressConfirmationAction'
import type { RequirementEvidenceDetailRow } from './types'
import { EvidenceRequirementDraftButton } from './EvidenceRequirementDraftButton'
import { GateEvidenceButton } from './GateEvidenceButton'
import { ConfirmGateButton } from './ConfirmGateButton'
import { EvidenceRequirementDrafts, type EvidenceRequirementDraftRow } from './EvidenceRequirementDrafts'
import { createEvidenceRequirementLinkDraftsAction } from './evidenceRequirementDraftAction'
import { FitnessHomeworkRecommendationButton } from './FitnessHomeworkRecommendationButton'
import { DevelopmentProfileSummaryCard } from '@/components/player/DevelopmentProfileSummaryCard'
import { LevelProgressCard } from '@/components/player/LevelProgressCard'
import { CoachPlayerSnapshot } from '@/components/player/CoachPlayerSnapshot'
import { PlayerEvidenceTimeline } from '@/components/player/PlayerEvidenceTimeline'
import { PlayerEvidenceHubHeader } from '@/components/player/PlayerEvidenceHubHeader'
import { PlayerPathwayEvidenceCards } from '@/components/player/PlayerPathwayEvidenceCards'
import { PlayerPriorityEvidenceConnection } from '@/components/player/PlayerPriorityEvidenceConnection'
import { PlayerCurriculumGateEvidencePanel } from '@/components/player/PlayerCurriculumGateEvidencePanel'
import { PlayerLevelReadinessDraftView } from '@/components/player/PlayerLevelReadinessDraftView'
import { PlayerParentSafeSummaryPreview } from '@/components/player/PlayerParentSafeSummaryPreview'
import { getPlayerEvidenceTimeline, getPlayerEvidenceSummary, getPlayerPathwayEvidence, getPlayerParentSafeSummaries } from '@/lib/players/playerEvidenceRepository'
import { PlayerQaPreviewPanel } from './PlayerQaPreviewPanel'
import { ParentGuidancePreviewPanel } from './ParentGuidancePreviewPanel'
import type { QaDrillRow, QaCoachLanguageRow, QaLearningModuleHint } from '@/lib/player/playerProgressQa'
import { buildModuleForLevelDomain, type LearningModuleDomain } from '@/lib/curriculum/learningModules'
import { detectTrainingGaps } from '@/lib/gaps/trainingGapDetection'
import { detectKnowledgeGaps } from '@/lib/gaps/knowledgeGapDetection'
import { buildDirectorGapGuidance } from '@/lib/gaps/roleSpecificGapGuidance'
import { GapGuidanceSummaryCard } from '@/components/player/GapGuidanceSummaryCard'
import { PlayerLoadTab } from '@/components/player/PlayerLoadTab'
import { PlayerCompetitionTab, type UtrProfileData, type UtrMatchRow, type UtrInsightRow } from '@/components/player/PlayerCompetitionTab'
import { PlayerTrainingExposureTimeline } from '@/components/player/PlayerTrainingExposureTimeline'
import { PlayerGapSummaryPanel } from '@/components/player/PlayerGapSummaryPanel'
import type { UtrHistoryPoint } from '@/components/player/UtrHistoryChart'
import { GuardianLinkingPanel, type LinkedGuardian } from './GuardianLinkingPanel'
import { PlayerPortalLinkPanel } from './PlayerPortalLinkPanel'
import { QuickAssessmentPanel } from './QuickAssessmentPanel'
import { QuickAssessmentHistoryCard } from './QuickAssessmentHistoryCard'
import { AssessmentHistoryCard } from './AssessmentHistoryCard'
import { PlayerCommandCenterCard } from '@/components/player/PlayerCommandCenterCard'
// Sprint 1113-1120: Development Center tabs
import { DevelopmentCenterTab } from './_components/DevelopmentCenterTab'
import { MissionsTab } from './_components/MissionsTab'
import { AssessmentsTab } from './_components/AssessmentsTab'
// Sprint 1124-1130: Constitution hero — 5 key signals above all tabs
import { PlayerProfileConstitutionHero } from './_components/PlayerProfileConstitutionHero'
// Sprint 1131-1140: Development OS completion
import { ReadinessEvidencePanel } from './_components/ReadinessEvidencePanel'
import { DevelopmentTimeline } from './_components/DevelopmentTimeline'
import { PriorityMissionEvidenceCard } from './_components/PriorityMissionEvidenceCard'
import { CollapsedDetailSection } from '@/components/donna/CollapsedDetailSection'
// Sprint 1156: DONNA command section on player profile
import { DonnaCommandSection } from '@/components/donna/DonnaCommandSection'
// Sprint 1211: Evidence Summary Panel
import { PlayerEvidenceSummaryPanel } from './_components/PlayerEvidenceSummaryPanel'
import { GateHistoryTimeline, type GateAuditEntry } from '@/components/player/GateHistoryTimeline'
import { DraftSummaryUpdateButton } from './DraftSummaryUpdateButton'
import { PlayerSessionHistoryPanel } from './PlayerSessionHistoryPanel'
import { PlacementEntryCard, type PlacementEntryData } from './PlacementEntryCard'
import { FirstDevelopmentContextCard, type FirstDevContextData } from './FirstDevelopmentContextCard'
import { PlacementCurriculumBridgeCard } from './PlacementCurriculumBridgeCard'
import { PlayerActionSummaryCard } from './_components/PlayerActionSummaryCard'
import { PlayerCurriculumConnectionBlock } from './_components/PlayerCurriculumConnectionBlock'
import { PlayerCoachNotesBlock } from './_components/PlayerCoachNotesBlock'
import { PlayerParentSummaryBlock } from './_components/PlayerParentSummaryBlock'
import { PlayerKpiDrilldownCard } from './_components/PlayerKpiDrilldownCard'
// Sprint 854 — DONNA player profile context injection
import { PlayerProfileDonnaRegistrar } from './_components/PlayerProfileDonnaRegistrar'
import { PlayerSkillPathCurriculumPreview } from '@/components/player/PlayerSkillPathCurriculumPreview'
import { PlayerCompetitionPathCurriculumPreview, type CompetitionPathPreviewData } from '@/components/player/PlayerCompetitionPathCurriculumPreview'
import { CoachWrapUpObservationsPanel } from './CoachWrapUpObservationsPanel'
// Sprint 1771 — Atomic Loop Clarity: Loop 6 parent update initiation
import { InitiateParentUpdateButton } from './InitiateParentUpdateButton'

interface PageProps {
  params: { playerId: string }
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single<Pick<Tables<'profiles'>, 'academy_id'>>()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  let player
  try {
    player = await getPlayerById(supabase, params.playerId)
  } catch {
    notFound()
  }

  if (!player) notFound()

  const domainRows = await getPlayerCurriculumDomains(supabase, params.playerId, academyId)
  const hasCurriculum = domainRows.length > 0
  const curriculumSummary = domainRows[0] ?? null

  // Resolve academy curriculum context for this player (Sprints 72 + 77)
  const academyCurriculumCtx = await resolveAcademyCurriculumContext({
    supabase,
    academyId,
    playerId: params.playerId,
  })

  const assignAction = assignCurriculumAction.bind(null, params.playerId, academyId)
  const evaluateAction = evaluateAdvancementAction.bind(null, params.playerId, academyId)

  const blockedBy = curriculumSummary?.advancement_blocked_by ?? []
  const domainCounts = {
    complete:    domainRows.filter(r => r.status === 'complete').length,
    in_progress: domainRows.filter(r => r.status === 'in_progress').length,
    regressed:   domainRows.filter(r => r.status === 'regressed').length,
    not_started: domainRows.filter(r => r.status === 'not_started').length,
  }

  // rawDb cast avoids TS2589 on multi-join selects; RLS already enforces academy scoping.
  const rawDb = supabase as any

  const developmentSummary = await getPlayerDevelopmentSummary(supabase, params.playerId)

  // Active priorities: scoped by academy_id + player_id, filtered to is_active = true.
  const { data: rawPriorities } = await rawDb
    .from('player_priorities')
    .select('id, title, description, category, status, priority_level, priority_rank, urgency, generated_at, updated_at')
    .eq('academy_id', academyId)
    .eq('player_id', params.playerId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })
  const activePriorities: PlayerPriorityRow[] = rawPriorities ?? []

  // Sprint 844: named approver resolution for active priorities.
  // audit_logs.action = 'priority_recommendation.priority.applied'
  // audit_logs.target_id = player_priorities.id (confirmed one-to-one in review/actions.ts)
  // Batched: priority IDs → audit_logs → actor IDs → profiles display_names.
  // Pattern: same as gate activity log attribution (lines ~302–325).
  // Graceful fallback: missing entries → approved_by_name stays null → "director" shown.
  // academy_id scoped throughout — no parent/player exposure.
  const priorityApproverMap = new Map<string, string>()

  if (activePriorities.length > 0) {
    const priorityIds = activePriorities.map(p => p.id)
    const { data: priorityAuditRows } = await rawDb
      .from('audit_logs')
      .select('target_id, actor_id')
      .eq('academy_id', academyId)
      .eq('action', 'priority_recommendation.priority.applied')
      .in('target_id', priorityIds)

    const auditRows = (priorityAuditRows ?? []) as Array<{ target_id: string; actor_id: string | null }>
    const approverActorIds = Array.from(new Set(
      auditRows.filter(r => r.actor_id).map(r => r.actor_id as string)
    ))

    if (approverActorIds.length > 0) {
      const { data: approverProfiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', approverActorIds)
      const approverNameMap = new Map<string, string>()
      for (const p of (approverProfiles ?? [])) {
        if (p.display_name) approverNameMap.set(p.id, p.display_name)
      }
      for (const row of auditRows) {
        if (row.actor_id && row.target_id && approverNameMap.has(row.actor_id)) {
          priorityApproverMap.set(row.target_id, approverNameMap.get(row.actor_id)!)
        }
      }
    }
  }

  const enrichedActivePriorities: PlayerPriorityRow[] = activePriorities.map(p => ({
    ...p,
    approved_by_name: priorityApproverMap.get(p.id) ?? null,
  }))

  // Progression requirements: level requirements + next level derivation.
  // curriculum_levels and v_curriculum_level_requirements are readable by all authenticated users.
  let progressionRequirements: {
    sort_order: number | null
    level_number: number | null
    min_assessment_score: number | null
    min_domains_mastered: number | null
    min_total_outcomes: number | null
    min_weeks_at_level: number | null
    requires_director_approval: boolean | null
    requires_final_assessment: boolean | null
    blocking_signal_types: string[] | null
  } | null = null
  let nextCurriculumLevel: { display_name: string; level_number: number; stage: string } | null = null

  if (curriculumSummary?.current_level_id) {
    const { data: reqData } = await rawDb
      .from('v_curriculum_level_requirements')
      .select('sort_order, level_number, min_assessment_score, min_domains_mastered, min_total_outcomes, min_weeks_at_level, requires_director_approval, requires_final_assessment, blocking_signal_types')
      .eq('level_id', curriculumSummary.current_level_id)
      .limit(1)
    progressionRequirements = reqData?.[0] ?? null

    if (progressionRequirements?.sort_order != null) {
      const { data: nextLvlData } = await rawDb
        .from('curriculum_levels')
        .select('display_name, level_number, stage, sort_order')
        .gt('sort_order', progressionRequirements.sort_order)
        .order('sort_order', { ascending: true })
        .limit(1)
      nextCurriculumLevel = nextLvlData?.[0] ?? null
    }
  }

  // Extended curriculum state: competition track level + fitness path phase (migration 052 fields).
  // These columns were added via ADD COLUMN IF NOT EXISTS — safe to query even if migration is partial.
  let competitionTrackLevelName: string | null = null
  let fitnessPathPhase: string | null = null

  if (hasCurriculum) {
    const { data: pcsRow } = await rawDb
      .from('player_curriculum_states')
      .select('competition_track_level_id, fitness_path_phase')
      .eq('player_id', params.playerId)
      .eq('academy_id', academyId)
      .limit(1)
    const pcs = pcsRow?.[0] ?? null

    fitnessPathPhase = pcs?.fitness_path_phase ?? null

    if (pcs?.competition_track_level_id) {
      const { data: ctLevel } = await rawDb
        .from('curriculum_levels')
        .select('display_name')
        .eq('id', pcs.competition_track_level_id)
        .single()
      competitionTrackLevelName = ctLevel?.display_name ?? null
    }
  }

  // Sprint 918: Competition Path curriculum preview — read-only, no migration needed.
  // Fetches the curriculum_competition_track row for the player's current curriculum level.
  let competitionPathPreview: CompetitionPathPreviewData | null = null
  if (curriculumSummary?.current_level_id) {
    const { data: ctRow } = await rawDb
      .from('curriculum_competition_track')
      .select('match_format, scoring_system, opponent_pool, tournament_cadence, win_loss_target, transition_signal')
      .eq('level_id', curriculumSummary.current_level_id)
      .maybeSingle()
    competitionPathPreview = ctRow ?? null
  }

  // Curriculum gates for current level: "Requirements to advance" (Sprint 197).
  // Read-only — gates where from_level_id = current Skill Track level.
  interface CurriculumGateRow {
    id: string
    domain: string
    criterion: string
    gate_type: string
    threshold: string
    evaluator: string
    cadence: string
    evidence_window: string | null
    sort_order: number
  }
  let levelGates: CurriculumGateRow[] = []

  if (curriculumSummary?.current_level_id) {
    const { data: gatesData } = await rawDb
      .from('curriculum_gates')
      .select('id, domain, criterion, gate_type, threshold, evaluator, cadence, evidence_window, sort_order')
      .eq('from_level_id', curriculumSummary.current_level_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    levelGates = gatesData ?? []
  }

  // Sprint 106: Fetch per-gate evidence status for this player.
  // player_gate_status not yet in database.types.ts — rawDb cast consistent with existing usage.
  interface PlayerGateStatusData {
    gate_id: string
    status: string
    evidence_count: number
    last_evidence_at: string | null
  }
  const playerGateStatuses: Record<string, PlayerGateStatusData> = {}

  if (levelGates.length > 0) {
    const gateIds = levelGates.map(g => g.id)
    const { data: gateStatusRows } = await rawDb
      .from('player_gate_status')
      .select('gate_id, status, evidence_count, last_evidence_at')
      .eq('player_id', params.playerId)
      .eq('academy_id', academyId)
      .in('gate_id', gateIds)
    for (const row of (gateStatusRows ?? []) as PlayerGateStatusData[]) {
      playerGateStatuses[row.gate_id] = row
    }
  }

  // Gate activity timeline: recent audit_logs for gate evidence and director decision events.
  // RLS on audit_logs: auth_is_director_or_head() — never exposed to parent/player portals.
  // rawDb used for consistency with the existing pattern in this file (audit_logs is typed
  // in database.types.ts but payload as Json | null conflicts with our local interface).
  let gateActivityLog: GateAuditEntry[] = []

  if (levelGates.length > 0) {
    const gateIds = levelGates.map(g => g.id)
    const { data: gateLogRows } = await rawDb
      .from('audit_logs')
      .select('id, action, actor_id, created_at, payload')
      .eq('academy_id', academyId)
      .in('action', ['gate_status.evidence_recorded', 'gate_status.director_decision'])
      .in('target_id', gateIds)
      .order('created_at', { ascending: false })
      .limit(20)

    const rawLog: Array<{
      id: string
      action: string
      actor_id: string | null
      created_at: string
      payload: Record<string, unknown> | null
    }> = gateLogRows ?? []

    // Resolve actor display names — scoped to actor IDs found in audit rows only.
    const actorIds = Array.from(
      new Set(rawLog.filter(r => r.actor_id).map(r => r.actor_id as string))
    )
    const actorNameMap = new Map<string, string>()

    if (actorIds.length > 0) {
      const { data: actorProfiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', actorIds)
      for (const p of (actorProfiles ?? [])) {
        actorNameMap.set(p.id, p.display_name)
      }
    }

    gateActivityLog = rawLog.map(row => ({
      id:                  row.id,
      action:              row.action,
      actor_id:            row.actor_id,
      actor_display_name:  row.actor_id ? (actorNameMap.get(row.actor_id) ?? 'Staff') : 'Staff',
      created_at:          row.created_at,
      payload:             row.payload,
    }))
  }

  // All 15 curriculum levels for the level picker.
  const { data: allLevelsData } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .order('sort_order', { ascending: true })
  const allCurriculumLevels: CurriculumLevelOption[] = (allLevelsData ?? []).map(
    (l: { id: string; display_name: string; stage: string }) => ({
      id: l.id,
      display_name: l.display_name,
      stage: l.stage,
    })
  )

  // Player Q&A data: drills and coach language for current level (Sprint 218, read-only)
  let qaTopDrills: QaDrillRow[] = []
  let qaCoachLanguage: QaCoachLanguageRow[] = []

  if (curriculumSummary?.current_level_id) {
    const { data: drillsData } = await rawDb
      .from('curriculum_drills')
      .select('id, name, domain, session_block, objective')
      .eq('level_min_id', curriculumSummary.current_level_id)
      .eq('is_active', true)
      .order('session_block', { ascending: true })
      .limit(5)
    qaTopDrills = drillsData ?? []

    const { data: clData } = await rawDb
      .from('curriculum_coach_language')
      .select('domain, doing_well, working_on, current_focus, next_step')
      .eq('level_id', curriculumSummary.current_level_id)
    qaCoachLanguage = clData ?? []
  }

  // Build learning module hint for Player Q&A "what_to_practice" answer (Sprint 226)
  // Uses first coach language entry to pick the most relevant domain module — no DB calls.
  let qaLearningModuleHint: QaLearningModuleHint | null = null
  if (curriculumSummary?.current_level_id && qaCoachLanguage.length > 0) {
    const firstCl = qaCoachLanguage[0]
    const validDomains: LearningModuleDomain[] = [
      'Technical', 'Tactical', 'Movement', 'Competition',
      'Mentality', 'Fitness', 'Recovery', 'Lifestyle',
    ]
    const domain = validDomains.includes(firstCl.domain as LearningModuleDomain)
      ? (firstCl.domain as LearningModuleDomain)
      : 'Technical'
    try {
      const mod = buildModuleForLevelDomain({
        levelId: curriculumSummary.current_level_id,
        levelName: curriculumSummary.current_level_name ?? 'Current Level',
        levelStage: curriculumSummary.stage ?? '',
        domain,
        gates: levelGates.map((g: any) => ({
          id: g.id, from_level_id: curriculumSummary.current_level_id!, domain: g.domain,
          criterion: g.criterion, threshold: g.threshold ?? '',
        })),
        drills: qaTopDrills.map((d: any) => ({
          id: d.id, level_min_id: curriculumSummary.current_level_id!, domain: d.domain,
          name: d.name, objective: d.objective,
        })),
        coachLang: { level_id: curriculumSummary.current_level_id!, ...firstCl },
      })
      qaLearningModuleHint = {
        mini_challenge: mod.mini_challenge,
        reflection_question: mod.reflection_question,
        try_this: mod.try_this,
      }
    } catch {
      // graceful fallback — hint stays null
    }
  }

  // Player load aggregation — one row per player (UNIQUE constraint), used for training gap detection + Fitness tab.
  const { data: loadRow } = await rawDb
    .from('player_load_aggregation')
    .select([
      'sessions_7d', 'sessions_28d', 'duration_7d_min', 'duration_28d_min',
      'skill_sessions_28d', 'fitness_sessions_28d', 'competition_sessions_28d',
      'overload_flag', 'fatigue_risk_score', 'fatigue_risk_label',
      'load_trend_7d', 'absences_7d',
      'avg_intensity_7d', 'avg_intensity_28d',
      'avg_perceived_load_7d', 'avg_perceived_load_28d',
      'high_intensity_blocks_7d', 'calculated_at',
    ].join(', '))
    .eq('player_id', params.playerId)
    .maybeSingle()
  const playerLoad = loadRow ?? null

  // UTR profile — one row per player (optional), scoped by player_id + academy_id.
  const { data: utrProfileRaw } = await rawDb
    .from('player_utr_profiles')
    .select('utr_singles, utr_doubles, utr_status, win_rate_90d, wins_90d, losses_90d, matches_played_90d, matches_played_ytd, last_match_date, last_synced_at')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .maybeSingle()
  const utrProfile: UtrProfileData | null = utrProfileRaw ?? null

  // UTR history — last 12 readings, most recent first, used for the trend chart.
  const { data: utrHistoryRaw } = await rawDb
    .from('player_utr_history')
    .select('utr_value, utr_type, utr_status, captured_at, delta_from_previous')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .order('captured_at', { ascending: false })
    .limit(12)
  const utrHistory: UtrHistoryPoint[] = (utrHistoryRaw ?? []).map((r: any) => ({
    captured_at: r.captured_at,
    utr_value: r.utr_value,
    utr_type: r.utr_type,
    delta_from_previous: r.delta_from_previous ?? null,
  }))

  // UTR matches — last 10 results, most recent first.
  const { data: utrMatchesRaw } = await rawDb
    .from('player_utr_matches')
    .select('id, match_date, opponent_name, opponent_utr, result, score, tournament_name, surface, utr_impact')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .order('match_date', { ascending: false })
    .limit(10)
  const utrMatches: UtrMatchRow[] = (utrMatchesRaw ?? []).map((r: any) => ({
    id: r.id,
    match_date: r.match_date,
    opponent_name: r.opponent_name ?? null,
    opponent_utr: r.opponent_utr ?? null,
    result: r.result,
    score: r.score ?? null,
    tournament_name: r.tournament_name ?? null,
    surface: r.surface ?? null,
    utr_impact: r.utr_impact ?? null,
  }))

  // UTR insights — active insights only, most recent first.
  const { data: utrInsightsRaw } = await rawDb
    .from('player_utr_insights')
    .select('id, insight_type, insight_text, delta, utr_current, period_days, calculated_at')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('calculated_at', { ascending: false })
    .limit(5)
  const utrInsights: UtrInsightRow[] = (utrInsightsRaw ?? []).map((r: any) => ({
    id: r.id,
    insight_type: r.insight_type,
    insight_text: r.insight_text,
    delta: r.delta ?? null,
    utr_current: r.utr_current ?? null,
    period_days: r.period_days ?? null,
    calculated_at: r.calculated_at,
  }))

  // Training exposure timeline — last 60 days of session attendance + session details.
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const { data: attendanceRows } = await rawDb
    .from('session_attendance')
    .select('session_id, status, marked_at')
    .eq('player_id', params.playerId)
    .gte('marked_at', sixtyDaysAgo)
    .order('marked_at', { ascending: false })
    .limit(30)

  interface ExposureTimelineItem {
    sessionId: string
    sessionName: string | null
    sessionDate: string
    attendanceStatus: string
    blockCount: number
    observationCount: number
  }

  const exposureTimeline: ExposureTimelineItem[] = []

  if ((attendanceRows ?? []).length > 0) {
    const attendedSessionIds = (attendanceRows as Array<{ session_id: string; status: string; marked_at: string }>)
      .map(r => r.session_id)
    const statusBySid = new Map<string, string>()
    for (const r of (attendanceRows as Array<{ session_id: string; status: string; marked_at: string }>) ?? []) {
      statusBySid.set(r.session_id, r.status)
    }

    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', attendedSessionIds)
      .eq('academy_id', academyId)
      .order('scheduled_date', { ascending: false })

    if ((sessionRows ?? []).length > 0) {
      const { data: blockCountRows } = await rawDb
        .from('session_blocks')
        .select('session_id')
        .in('session_id', attendedSessionIds)

      const blockCountBySid = new Map<string, number>()
      for (const b of (blockCountRows ?? []) as Array<{ session_id: string }>) {
        blockCountBySid.set(b.session_id, (blockCountBySid.get(b.session_id) ?? 0) + 1)
      }

      for (const sess of (sessionRows ?? [])) {
        exposureTimeline.push({
          sessionId: sess.id,
          sessionName: sess.name,
          sessionDate: sess.scheduled_date,
          attendanceStatus: statusBySid.get(sess.id) ?? 'unknown',
          blockCount: blockCountBySid.get(sess.id) ?? 0,
          observationCount: 0, // observation counts require join after enrichedObservations is available
        })
      }
    }
  }

  // Gap detection — pure helpers, no DB calls, deterministic.
  const trainingGaps = detectTrainingGaps({
    player_id: params.playerId,
    sessions_7d:              playerLoad?.sessions_7d ?? null,
    sessions_28d:             playerLoad?.sessions_28d ?? null,
    duration_28d_min:         playerLoad?.duration_28d_min ?? null,
    skill_sessions_28d:       playerLoad?.skill_sessions_28d ?? null,
    fitness_sessions_28d:     playerLoad?.fitness_sessions_28d ?? null,
    competition_sessions_28d: playerLoad?.competition_sessions_28d ?? null,
    overload_flag:            playerLoad?.overload_flag ?? null,
    fatigue_risk_score:       playerLoad?.fatigue_risk_score ?? null,
    fatigue_risk_label:       playerLoad?.fatigue_risk_label ?? null,
    load_trend_7d:            playerLoad?.load_trend_7d ?? null,
    absences_7d:              playerLoad?.absences_7d ?? null,
    current_level:            curriculumSummary?.current_level_name ?? null,
    current_stage:            curriculumSummary?.stage ?? null,
    open_gate_count:          levelGates.length,
  })

  const knowledgeGaps = detectKnowledgeGaps({
    player_id:              params.playerId,
    current_level:          curriculumSummary?.current_level_name ?? null,
    current_stage:          curriculumSummary?.stage ?? null,
    open_gates:             levelGates.map(g => ({ domain: g.domain, criterion: g.criterion })),
    has_coach_language:     qaCoachLanguage.length > 0,
    coach_language_domains: qaCoachLanguage.map(cl => cl.domain),
    available_drill_count:  qaTopDrills.length,
  })

  const directorGapGuidance = buildDirectorGapGuidance(params.playerId, trainingGaps, knowledgeGaps)

  // ─── Guardian data (Sprint 40) ───────────────────────────────────────────
  // Fetch guardians linked to this player via player_guardians + guardians tables.
  // Academy-scoped: guardians.academy_id must match.
  const { data: guardianLinkRows } = await rawDb
    .from('player_guardians')
    .select('guardian_id, guardians!player_guardians_guardian_id_fkey(id, first_name, last_name, email, relationship, profile_id, academy_id)')
    .eq('player_id', params.playerId)

  const linkedGuardians: LinkedGuardian[] = ((guardianLinkRows ?? []) as Array<{
    guardian_id: string
    guardians: {
      id: string
      first_name: string
      last_name: string
      email: string | null
      relationship: string
      profile_id: string | null
      academy_id: string
    } | null
  }>)
    .filter(row => row.guardians?.academy_id === academyId)
    .map(row => ({
      guardianId: row.guardians!.id,
      firstName: row.guardians!.first_name,
      lastName: row.guardians!.last_name,
      email: row.guardians!.email,
      relationship: row.guardians!.relationship,
      profileId: row.guardians!.profile_id,
    }))

  // ─── Player portal profile (Sprint 44) ──────────────────────────────────
  // Fetch profile linked to players.profile_id to show email/name in the panel.
  let linkedPortalEmail: string | null = null
  let linkedPortalName: string | null = null
  if (player.profile_id) {
    const { data: portalProfile } = await rawDb
      .from('profiles')
      .select('email, display_name')
      .eq('id', player.profile_id)
      .eq('academy_id', academyId)
      .single()
    if (portalProfile) {
      linkedPortalEmail = portalProfile.email ?? null
      linkedPortalName = portalProfile.display_name ?? null
    }
  }

  // ─── Recent ad-hoc assessments ────────────────────────────────────────────
  interface AdHocAssessmentRow {
    id: string
    assessed_date: string
    technical_score: number | null
    tactical_score: number | null
    movement_score: number | null
    competition_score: number | null
    behavioral_score: number | null
    notes: string | null
    assessed_by: string
  }
  const { data: adHocRows } = await rawDb
    .from('assessments')
    .select('id, assessed_date, technical_score, tactical_score, movement_score, competition_score, behavioral_score, notes, assessed_by')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .eq('type', 'ad_hoc')
    .order('created_at', { ascending: false })
    .limit(3)

  const rawAdHoc = (adHocRows ?? []) as AdHocAssessmentRow[]
  const adHocAssessorIds = Array.from(new Set(rawAdHoc.map(r => r.assessed_by)))
  const assessorNameMap = new Map<string, string>()
  if (adHocAssessorIds.length > 0) {
    const { data: assessorProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', adHocAssessorIds)
    for (const p of (assessorProfiles ?? [])) {
      assessorNameMap.set(p.id, p.display_name)
    }
  }
  const adHocAssessments = rawAdHoc.map(r => ({
    ...r,
    assessed_by_name: assessorNameMap.get(r.assessed_by) ?? null,
  }))

  // ─── Assessment history (all types, last 10) ──────────────────────────────
  interface AssessmentHistoryRow {
    id: string
    assessed_date: string
    type: 'intake' | 'quarterly' | 'reassessment' | 'promotion' | 'ad_hoc'
    overall_score: number | null
    technical_score: number | null
    tactical_score: number | null
    movement_score: number | null
    competition_score: number | null
    behavioral_score: number | null
    notes: string | null
    assessed_by: string
    is_baseline: boolean
    promotion_ready: boolean
  }
  const { data: allAssessmentRows } = await rawDb
    .from('assessments')
    .select('id, assessed_date, type, overall_score, technical_score, tactical_score, movement_score, competition_score, behavioral_score, notes, assessed_by, is_baseline, promotion_ready')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })
    .limit(10)

  const rawAllAssessments = (allAssessmentRows ?? []) as AssessmentHistoryRow[]
  const allAssessorIds = Array.from(new Set(rawAllAssessments.map(r => r.assessed_by)))
  const allAssessorNameMap = new Map<string, string>()
  if (allAssessorIds.length > 0) {
    const { data: allAssessorProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', allAssessorIds)
    for (const p of (allAssessorProfiles ?? [])) {
      allAssessorNameMap.set(p.id, p.display_name)
    }
  }
  const allAssessments = rawAllAssessments.map(r => ({
    ...r,
    assessed_by_name: allAssessorNameMap.get(r.assessed_by) ?? null,
  }))

  // ─── Sprint 169: Placement entry context ─────────────────────────────────
  // Read-only. Only exists for players created via the Sprint 168 placement pipeline.
  // No parent/player portal, no billing, no comms — internal director context only.
  let placementEntryData: PlacementEntryData | null = null
  {
    const { data: placementRec } = await rawDb
      .from('placement_recommendations')
      .select('id, status, recommended_group_id, activated_at, confidence_score')
      .eq('player_id', params.playerId)
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (placementRec) {
      let placementGroupName: string | null = null
      if (placementRec.recommended_group_id) {
        const { data: grp } = await supabase
          .from('groups')
          .select('name')
          .eq('id', placementRec.recommended_group_id)
          .single()
        placementGroupName = grp?.name ?? null
      }
      placementEntryData = {
        placementRecommendationId: placementRec.id,
        groupName: placementGroupName,
        activatedAt: placementRec.activated_at ?? null,
        playerStatus: player.status ?? null,
        confidenceScore: placementRec.confidence_score ?? null,
      }
    }
  }

  // ─── Sprint 170: First Development Context ───────────────────────────────
  // Read-only. Sourced from the executed placement_recommendation_draft proposed_action.
  // Linked via proposed_payload.created_player_id === params.playerId.
  // No writes to player_development_summary, players, or any other table.
  let firstDevContextData: FirstDevContextData | null = null
  {
    const { data: execDrafts } = await rawDb
      .from('proposed_actions')
      .select('id, proposed_payload, created_at')
      .eq('academy_id', academyId)
      .eq('target_module', 'placement_recommendation_draft')
      .eq('status', 'executed')
      .order('created_at', { ascending: false })
      .limit(20)

    const match = ((execDrafts ?? []) as Array<{ id: string; proposed_payload: any; created_at: string }>)
      .find(row => row.proposed_payload?.created_player_id === params.playerId)

    if (match) {
      const p = match.proposed_payload
      firstDevContextData = {
        currentLevel:       p?.current_level        ?? null,
        startingPathway:    p?.starting_pathway      ?? null,
        suggestedGroupType: p?.suggested_group_type  ?? null,
        firstSkillPriority: p?.first_skill_priority  ?? null,
        confidence:         p?.confidence            ?? null,
        groupName:          p?.recommended_group_name ?? null,
        assessmentSummary:  p?.assessment_summary
          ? {
              ageBand:              p.assessment_summary.age_band              ?? null,
              ballColor:            p.assessment_summary.ball_color            ?? null,
              skillObservations:    p.assessment_summary.skill_observations    ?? null,
              movementObservations: p.assessment_summary.movement_observations ?? null,
              competitiveReadiness: p.assessment_summary.competitive_readiness ?? null,
            }
          : null,
        placedAt: match.created_at ?? null,
      }
    }
  }

  // ─── Sprint 1124: Mission counts for constitution hero ────────────────────
  // Active and pending missions from player_mission_assignments (migration 076).
  // Best-effort — hero renders with zero counts if table not yet migrated.
  let profileActiveMissionCount = 0
  let profilePendingMissionCount = 0
  try {
    const { count: activeCount } = await rawDb
      .from('player_mission_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', params.playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
    const { count: pendingCount } = await rawDb
      .from('player_mission_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', params.playerId)
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
    profileActiveMissionCount  = (activeCount  as number | null) ?? 0
    profilePendingMissionCount = (pendingCount as number | null) ?? 0
  } catch { /* migration 076 not yet applied */ }

  // ─── Observations — fetched early so overviewSlot can reference them ────
  // rawDb cast avoids TS2589 on the multi-join select; RLS enforces academy scoping.
  const { data: rawObs } = await rawDb
    .from('coach_observations')
    .select([
      'id', 'coach_id', 'content', 'observation_type', 'tags', 'is_private', 'ai_entities', 'created_at',
      'profiles!coach_observations_coach_id_fkey(display_name)',
      'sessions!coach_observations_session_id_fkey(name, scheduled_date)',
    ].join(', '))
    .eq('academy_id', academyId)
    .eq('player_id', params.playerId)
    .order('created_at', { ascending: false })
    .limit(20)
  const enrichedObservations: CoachObservationRow[] = rawObs ?? []

  // ─── Tab 1: Overview ─────────────────────────────────────────────────────
  const overviewSlot = (
    <div className="space-y-6">

      {/* Sprint 1124 — Constitution Hero: 5 key signals above all detail cards */}
      <PlayerProfileConstitutionHero
        playerFirstName={player.first_name ?? ''}
        playerLastName={player.last_name ?? ''}
        playerStatus={player.status ?? null}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        currentStage={(curriculumSummary as any)?.stage ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        advancementEligible={curriculumSummary?.advancement_eligible ?? false}
        topPriorities={enrichedActivePriorities.slice(0, 3).map(p => ({
          title: p.title,
          urgency: p.urgency ?? null,
          category: p.category ?? null,
        }))}
        activeMissionCount={profileActiveMissionCount}
        pendingMissionCount={profilePendingMissionCount}
        latestAssessmentDate={allAssessments[0]?.assessed_date ?? null}
        latestAssessmentOverallScore={allAssessments[0]?.overall_score ?? null}
        playerId={params.playerId}
        academyId={academyId}
      />

      {/* Command Center — answers the 6 key director questions at a glance */}
      <PlayerCommandCenterCard
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        currentStage={curriculumSummary?.stage ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        developmentFocus={developmentSummary?.development_focus ?? null}
        doingWell={developmentSummary?.current_strengths ?? []}
        workingOn={developmentSummary?.things_to_work_on ?? []}
        activePriorityCount={activePriorities.length}
        gateCount={levelGates.length}
        assessmentCount={allAssessments.length}
        latestAssessmentDate={allAssessments[0]?.assessed_date ?? null}
        latestAssessmentScore={allAssessments[0]?.overall_score ?? null}
        advancementEligible={curriculumSummary?.advancement_eligible ?? null}
        hasCurriculumState={hasCurriculum}
      />

      {/* ── Sprint 253: Action layer ─────────────────────────────────────── */}
      {/* Action summary + clickable CTAs — kept adjacent to Command Center for above-fold contract */}
      <PlayerActionSummaryCard
        academyId={academyId}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        developmentFocus={developmentSummary?.development_focus ?? null}
        activePriorityTitle={activePriorities[0]?.title ?? null}
        latestNoteSnippet={(enrichedObservations[0] as any)?.content ?? null}
        latestNoteDate={(enrichedObservations[0] as any)?.created_at ?? null}
        hasCurriculumState={hasCurriculum}
        observationCount={enrichedObservations.length}
        advancementEligible={curriculumSummary?.advancement_eligible ?? null}
      />

      {/* Sprint 1156 — DONNA Command Section — player-context questions */}
      <DonnaCommandSection
        pagePath={`/director/players/${params.playerId}`}
        playerId={params.playerId}
        questions={[
          `Why is ${player.first_name ?? 'this player'} at this level?`,
          `What is blocking ${player.first_name ?? 'their'} progress?`,
          `What should the coach focus on?`,
          `What should the parent know?`,
        ]}
        placeholder={`Ask DONNA about ${player.first_name ?? 'this player'}…`}
      />

      {/* Sprint 1131 — Priority → Mission → Evidence cards (top 2 priorities) */}
      {enrichedActivePriorities.slice(0, 2).map(p => (
        <PriorityMissionEvidenceCard
          key={p.id}
          playerId={params.playerId}
          academyId={academyId}
          priorityTitle={p.title}
          priorityDescription={p.description ?? null}
          priorityCategory={p.category ?? null}
        />
      ))}

      {/* Sprint 1131 — Readiness Evidence Panel */}
      {hasCurriculum && (
        <ReadinessEvidencePanel
          playerId={params.playerId}
          academyId={academyId}
          currentLevelId={(curriculumSummary as any)?.current_level_id ?? null}
          currentLevelName={curriculumSummary?.current_level_name ?? null}
          nextLevelName={nextCurriculumLevel?.display_name ?? null}
          advancementEligible={curriculumSummary?.advancement_eligible ?? false}
        />
      )}

      {/* Sprint 1211 — DONNA Evidence Summary (collapsed by default) */}
      <CollapsedDetailSection label="DONNA Evidence Summary">
        <PlayerEvidenceSummaryPanel
          playerId={params.playerId}
          academyId={academyId}
          playerFirstName={player.first_name ?? null}
          currentLevelName={curriculumSummary?.current_level_name ?? null}
          nextLevelName={nextCurriculumLevel?.display_name ?? null}
          activePriorityCount={activePriorities.length}
        />
      </CollapsedDetailSection>

      {/* Sprint 1131 — Development Timeline */}
      <CollapsedDetailSection label="Development Timeline" count={0}>
        <DevelopmentTimeline playerId={params.playerId} academyId={academyId} />
      </CollapsedDetailSection>

      {/* KPI signals — Sprint 434 — collapsed by default (Phase 7 constitution pass) */}
      <CollapsedDetailSection label="Development KPIs">
        <PlayerKpiDrilldownCard playerId={params.playerId} academyId={academyId} />
      </CollapsedDetailSection>

      {/* Three operational blocks — collapsed (Phase 7) */}
      <CollapsedDetailSection label="Development Blocks">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlayerCurriculumConnectionBlock
          currentLevelName={curriculumSummary?.current_level_name ?? null}
          nextLevelName={nextCurriculumLevel?.display_name ?? null}
          hasCurriculumState={hasCurriculum}
          currentStage={curriculumSummary?.stage ?? null}
        />
        <PlayerCoachNotesBlock
          latestNote={enrichedObservations[0]
            ? {
                content: (enrichedObservations[0] as any).content,
                created_at: (enrichedObservations[0] as any).created_at,
                observation_type: (enrichedObservations[0] as any).observation_type ?? null,
              }
            : null}
          observationCount={enrichedObservations.length}
        />
        <PlayerParentSummaryBlock
          playerFirstName={player.first_name ?? null}
          currentLevelName={curriculumSummary?.current_level_name ?? null}
          currentFocus={qaCoachLanguage[0]?.current_focus ?? developmentSummary?.development_focus ?? null}
        />
      </div>
      </CollapsedDetailSection>

      {/* Two-column layout: development data left, admin/curriculum right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6 items-start">

        {/* Left column: development summary + quick assessments */}
        <div className="space-y-6">

          {/* First Development Context — Sprint 170. Placement recommendation context on Day 1. */}
          {firstDevContextData && (
            <FirstDevelopmentContextCard
              data={firstDevContextData}
              playerId={params.playerId}
              hasCurriculum={hasCurriculum}
            />
          )}

          {/* Curriculum bridge — Sprint 172B. Shown when player has no curriculum state yet. */}
          {!hasCurriculum && allCurriculumLevels.length > 0 && (
            <PlacementCurriculumBridgeCard
              playerId={params.playerId}
              academyId={academyId}
              levels={allCurriculumLevels}
            />
          )}

          {/* Development Profile Summary — internal coach view */}
          <DevelopmentProfileSummaryCard summary={developmentSummary} priorities={activePriorities} />

          {/* Quick Assessment — director ad-hoc domain rating */}
          <QuickAssessmentPanel playerId={params.playerId} />

          {/* Quick Assessment history */}
          <QuickAssessmentHistoryCard assessments={adHocAssessments} />

          {/* Full assessment history — all types, last 10 */}
          <AssessmentHistoryCard assessments={allAssessments} />

          {/* Player Info — administrative details (demoted below development data) */}
          <Card>
            <CardHeader>
              <p className="label-xs">Player Info</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Status</p>
                <p className="text-sm text-text-primary capitalize">
                  {player.status?.replace(/_/g, ' ') ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Joined</p>
                <p className="text-sm text-text-primary">{formatDate(player.join_date)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Date of birth</p>
                <p className="text-sm text-text-primary">{formatDate(player.date_of_birth)}</p>
              </div>
              {player.notes && (
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Notes</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{player.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Curriculum card — Skill Track + Competition Track + Fitness + link to /director/curriculum */}
          <PlayerCurriculumCard
            skillTrackLevelName={curriculumSummary?.current_level_name ?? null}
            skillTrackStage={curriculumSummary?.stage ?? null}
            competitionTrackLevelName={competitionTrackLevelName}
            fitnessPathPhase={fitnessPathPhase}
            nextLevelName={nextCurriculumLevel?.display_name ?? null}
            hasCurriculumState={hasCurriculum}
          />

          {/* Level Progress */}
          <LevelProgressCard
            currentLevelName={curriculumSummary?.current_level_name ?? null}
            currentStage={curriculumSummary?.stage ?? null}
            nextLevelName={nextCurriculumLevel?.display_name ?? null}
            advancementEligible={curriculumSummary?.advancement_eligible ?? null}
            hasCurriculumState={!!curriculumSummary}
            requiresDirectorApproval={progressionRequirements?.requires_director_approval ?? null}
          />

          <p className="label-xs">Coach Focus</p>

          <Card>
            <CardContent className="py-4 space-y-3">
              {curriculumSummary?.advancement_eligible ? (
                <p className="text-xs text-lime">Player meets advancement criteria.</p>
              ) : hasCurriculum ? (
                <p className="text-xs text-text-muted">
                  Open the Skill Path tab to evaluate advancement eligibility.
                </p>
              ) : (
                <p className="text-xs text-text-muted">
                  No curriculum assigned yet. Use the assignment card on the Overview tab or the Skill Path tab to get started.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Guardian / Parent Access panel (Sprint 40) */}
          <GuardianLinkingPanel
            playerId={params.playerId}
            academyId={academyId}
            linkedGuardians={linkedGuardians}
          />

          {/* Player Portal Access panel (Sprint 44) */}
          <PlayerPortalLinkPanel
            playerId={params.playerId}
            linkedProfileId={player.profile_id ?? null}
            linkedProfileEmail={linkedPortalEmail}
            linkedProfileName={linkedPortalName}
            playerName={player.full_name ?? null}
          />

          {/* Placement Entry — Sprint 169. Only shown if player was placed via pipeline. */}
          {placementEntryData && (
            <PlacementEntryCard data={placementEntryData} />
          )}

          {hasCurriculum && (
            <Card>
              <CardContent className="py-4 space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-text-muted">Domain summary</p>
                {([
                  { label: 'Complete',    count: domainCounts.complete,    color: 'text-lime' },
                  { label: 'In progress', count: domainCounts.in_progress, color: 'text-status-blue' },
                  { label: 'Regressed',   count: domainCounts.regressed,   color: 'text-status-red' },
                  { label: 'Not started', count: domainCounts.not_started, color: 'text-text-muted' },
                ] as const).map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{label}</span>
                    <span className={`text-sm font-mono font-bold ${color}`}>{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  )

  // ─── Tab 2: Skill Path ────────────────────────────────────────────────────
  // ─── Tab 3: Competition ───────────────────────────────────────────────────
  const competitionSlot = (
    <div className="space-y-6">
      {/* Sprint 918: Curriculum-derived competition path preview */}
      <PlayerCompetitionPathCurriculumPreview
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        data={competitionPathPreview}
        hasCurriculumState={hasCurriculum}
      />
      <PlayerCompetitionTab
        utrProfile={utrProfile}
        utrHistory={utrHistory}
        utrMatches={utrMatches}
        utrInsights={utrInsights}
      />
    </div>
  )

  // ─── Tab 4: Fitness / Load ────────────────────────────────────────────────
  const fitnessSlot = (
    <div className="space-y-6">
      <PlayerLoadTab load={playerLoad} />

      {/* Training Exposure Timeline — last 60 days, director-only */}
      <PlayerTrainingExposureTimeline items={exposureTimeline} playerId={params.playerId} />

      {/* At-home fitness homework recommendation — internal draft only */}
      <Card>
        <CardHeader>
          <p className="label-xs">At-Home Fitness Homework</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-[11px] text-text-muted">
            Generates an internal recommendation draft based on attendance gaps, assessments, and coach notes.
            Draft is for director review only — not published to player or parent.
          </p>
          <FitnessHomeworkRecommendationButton playerId={params.playerId} />
        </CardContent>
      </Card>
    </div>
  )

  // ─── Tab 5: Notes ─────────────────────────────────────────────────────────
  // enrichedObservations is fetched before overviewSlot above — reused here.

  // Priority recommendation drafts: pending/approved for this player, newest first.
  // rawDb cast avoids TS2589; RLS enforces academy scoping.
  const { data: rawDrafts } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('target_module', 'priority_recommendation')
    .eq('target_object_id', params.playerId)
    .in('status', ['pending_review', 'approved', 'clarification_needed'])
    .order('created_at', { ascending: false })
    .limit(5)
  const recommendationDrafts: PriorityRecommendationDraftRow[] = rawDrafts ?? []

  // Evidence link drafts: pending/approved requirement_evidence_link proposed_actions for this player.
  const { data: rawEvidenceDrafts } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('target_module', 'requirement_evidence_link')
    .eq('target_object_id', params.playerId)
    .in('status', ['pending_review', 'approved', 'clarification_needed'])
    .order('created_at', { ascending: false })
    .limit(5)
  const evidenceLinkDrafts: EvidenceRequirementDraftRow[] = rawEvidenceDrafts ?? []

  // Evidence timeline — multi-source: observations, requirement links, gate updates, assessments.
  // Uses Phase 7A repository. Errors degrade gracefully via isSchemaMissing flag.
  const timelineResult = await getPlayerEvidenceTimeline(supabase, params.playerId, academyId)
  const timelineItems = timelineResult.data ?? []
  const timelineIsSchemaMissing = timelineResult.isSchemaMissing

  // Evidence summary — aggregate counts for hub header (Sprint 1057).
  const evidenceSummaryResult = await getPlayerEvidenceSummary(supabase, params.playerId, academyId)
  const evidenceSummary = evidenceSummaryResult.data
  const evidenceSummaryIsSchemaMissing = evidenceSummaryResult.isSchemaMissing

  // Pathway evidence — skill / competition / fitness breakdown (Sprint 1058).
  const pathwayEvidenceResult = await getPlayerPathwayEvidence(supabase, params.playerId, academyId)
  const pathwayEvidence = pathwayEvidenceResult.data
  const pathwayEvidenceIsSchemaMissing = pathwayEvidenceResult.isSchemaMissing

  // Parent-safe summary data — preview for director (Sprint 1062).
  const parentSafeDataResult = await getPlayerParentSafeSummaries(supabase, params.playerId, academyId)
  const parentSafeData = parentSafeDataResult.data
  const parentSafeIsSchemaMissing = parentSafeDataResult.isSchemaMissing

  // Requirement progress: read from v_player_requirement_progress_detail.
  // New view not yet in database.types.ts — rawDb cast + local interface used.
  const { data: rawRequirementProgress } = await rawDb
    .from('v_player_requirement_progress_detail')
    .select([
      'progress_id', 'academy_id', 'player_id', 'curriculum_level_id', 'requirement_id',
      'requirement_title', 'requirement_description', 'requirement_type',
      'requirement_domain_key', 'requirement_domain_label',
      'level_display_name', 'level_number',
      'status', 'progress_value', 'evidence_count', 'last_evidence_at',
      'is_required', 'is_parent_visible', 'is_player_visible',
      'domain_display_order', 'requirement_display_order',
    ].join(', '))
    .eq('academy_id', academyId)
    .eq('player_id', params.playerId)
    .order('domain_display_order', { ascending: true })
    .order('requirement_display_order', { ascending: true })
  const requirementProgressRows: RequirementProgressRow[] = rawRequirementProgress ?? []

  // Sprint 40: fetch official requirement_evidence_links for this player's progress rows.
  const evidenceByProgressId: Record<string, RequirementEvidenceDetailRow[]> = {}

  if (requirementProgressRows.length > 0) {
    const progressIds = requirementProgressRows.map(r => r.progress_id)

    type RawEvidenceLink = {
      id: string
      requirement_id: string
      player_requirement_progress_id: string | null
      evidence_type: string
      evidence_id: string
      evidence_summary: string | null
      confidence: number | null
      weight: number | null
      created_by: string | null
      created_at: string
      is_parent_safe: boolean
    }

    const { data: rawEvidenceLinks } = await rawDb
      .from('requirement_evidence_links')
      .select('id, requirement_id, player_requirement_progress_id, evidence_type, evidence_id, evidence_summary, confidence, weight, created_by, created_at, is_parent_safe')
      .eq('academy_id', academyId)
      .eq('player_id', params.playerId)
      .in('player_requirement_progress_id', progressIds)
      .order('created_at', { ascending: false })

    const evidenceLinks: RawEvidenceLink[] = rawEvidenceLinks ?? []

    // Fetch coach_observation snippets — scoped to academy_id + player_id for security
    type ObsSnippet = { id: string; content: string; observation_type: string; created_at: string }
    const obsByEvidenceId: Record<string, ObsSnippet> = {}

    const obsEvidence = evidenceLinks.filter(e => e.evidence_type === 'coach_observation')
    if (obsEvidence.length > 0) {
      const obsIds = obsEvidence.map(e => e.evidence_id)
      const { data: rawObsSnippets } = await rawDb
        .from('coach_observations')
        .select('id, content, observation_type, created_at')
        .in('id', obsIds)
        .eq('academy_id', academyId)
        .eq('player_id', params.playerId)
      for (const obs of (rawObsSnippets ?? []) as ObsSnippet[]) {
        obsByEvidenceId[obs.id] = obs
      }
    }

    // Fetch creator display names
    type CreatorRow = { id: string; display_name: string | null }
    const creatorNameById: Record<string, string> = {}

    const creatorIds = Array.from(new Set(
      evidenceLinks.filter(e => e.created_by).map(e => e.created_by as string)
    ))
    if (creatorIds.length > 0) {
      const { data: rawCreators } = await rawDb
        .from('profiles')
        .select('id, display_name')
        .in('id', creatorIds)
      for (const c of (rawCreators ?? []) as CreatorRow[]) {
        if (c.display_name) creatorNameById[c.id] = c.display_name
      }
    }

    // Build evidenceByProgressId map with enrichments
    for (const e of evidenceLinks) {
      const obs = e.evidence_type === 'coach_observation' ? obsByEvidenceId[e.evidence_id] : undefined
      const enriched: RequirementEvidenceDetailRow = {
        id:                             e.id,
        requirement_id:                 e.requirement_id,
        player_requirement_progress_id: e.player_requirement_progress_id,
        evidence_type:                  e.evidence_type,
        evidence_id:                    e.evidence_id,
        evidence_summary:               e.evidence_summary,
        confidence:                     e.confidence,
        weight:                         e.weight,
        created_by:                     e.created_by,
        created_at:                     e.created_at,
        is_parent_safe:                 e.is_parent_safe,
        observation_content:            obs?.content ?? null,
        observation_type:               obs?.observation_type ?? null,
        observation_created_at:         obs?.created_at ?? null,
        creator_display_name:           e.created_by ? (creatorNameById[e.created_by] ?? null) : null,
      }
      const pid = e.player_requirement_progress_id
      if (pid) {
        if (!evidenceByProgressId[pid]) evidenceByProgressId[pid] = []
        evidenceByProgressId[pid].push(enriched)
      }
    }
  }

  const isOrangeBallPlayer = curriculumSummary?.stage === 'orange_development'

  const createDraftAction = createPriorityRecommendationDraftAction.bind(null, params.playerId)
  const createEvidenceDraftAction = createEvidenceRequirementLinkDraftsAction.bind(null, params.playerId)
  const confirmProgressAction = confirmRequirementProgressStatusAction.bind(null, params.playerId)

  const progressionScores = (player as any).player_progression?.[0] ?? null

  const addObsAction = addObservationAction.bind(null, params.playerId, academyId)
  const updateSummaryAction = updateDevelopmentSummaryAction.bind(null, params.playerId, academyId)
  const addVoiceNoteServerAction = addVoiceNoteAction.bind(null, params.playerId, academyId)
  const generateDraftAction = generateNoteDraftAction

  // ─── Tab 2: Skill Path ────────────────────────────────────────────────────
  // Declared here so all required variables (progressionScores, requirementProgressRows,
  // evidenceByProgressId, confirmProgressAction, createEvidenceDraftAction, etc.) are in scope.
  const skillPathSlot = (
    <div className="space-y-6">

      {/* Curriculum level picker — director assigns/changes the active curriculum level */}
      {allCurriculumLevels.length > 0 && (
        <CurriculumLevelPickerCard
          playerId={params.playerId}
          academyId={academyId}
          currentLevelId={curriculumSummary?.current_level_id ?? null}
          currentLevelName={curriculumSummary?.current_level_name ?? null}
          levels={allCurriculumLevels}
        />
      )}

      {/* Curriculum assignment — shows academy version source and overrides */}
      <PlayerCurriculumAssignmentCard
        usingAcademyVersion={academyCurriculumCtx.usingAcademyVersion}
        curriculumVersionName={academyCurriculumCtx.curriculumVersionName}
        curriculumVersionId={academyCurriculumCtx.curriculumVersionId}
        fallbackReason={academyCurriculumCtx.fallbackReason}
        levelName={academyCurriculumCtx.levelName ?? curriculumSummary?.current_level_name ?? null}
        applicableOverrides={academyCurriculumCtx.applicableOverrides}
        warnings={academyCurriculumCtx.warnings}
      />

      {/* Sprint 917: Skill Path Curriculum Preview — read-only, curriculum-derived */}
      <PlayerSkillPathCurriculumPreview
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        drills={qaTopDrills}
        gates={levelGates.map(g => ({ id: g.id, domain: g.domain, criterion: g.criterion, threshold: g.threshold }))}
        hasCurriculumState={hasCurriculum}
      />

      {/* Gap Guidance — director internal, not visible to player or parent */}
      <GapGuidanceSummaryCard guidance={directorGapGuidance} />

      {/* Gap Summary V1 — consolidated inferred gaps with confidence labels */}
      <PlayerGapSummaryPanel
        trainingGaps={trainingGaps}
        knowledgeGaps={knowledgeGaps}
        exposureTimeline={exposureTimeline}
        playerLoad={playerLoad}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
      />

      {/* Advancement action card */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <EvaluateAdvancementButton onEvaluate={evaluateAction} />

          {curriculumSummary?.advancement_eligible && (
            <p className="text-xs text-lime">Player meets advancement criteria.</p>
          )}

          {hasCurriculum && !curriculumSummary?.advancement_eligible && blockedBy.length === 0 && (
            <p className="text-xs text-text-muted">
              Run evaluation to check advancement eligibility.
            </p>
          )}

          {blockedBy.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Blocked by</p>
              <ul className="space-y-1">
                {blockedBy.map((item, i) => (
                  <li key={i} className="text-xs text-status-orange flex gap-2">
                    <span className="shrink-0">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curriculum grid or empty state */}
      {hasCurriculum ? (
        <CurriculumProgressGrid rows={domainRows} />
      ) : (
        <Card>
          <PlayerCurriculumEmptyState onAssign={assignAction} />
        </Card>
      )}

      {/* Level requirements with director gate evidence buttons and status display */}
      <PlayerLevelRequirementsCard
        gates={levelGates}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        hasCurriculumState={hasCurriculum}
        gateStatuses={playerGateStatuses}
        gateActions={Object.fromEntries(
          levelGates.map(g => [
            g.id,
            <GateEvidenceButton
              key={g.id}
              playerId={params.playerId}
              academyId={academyId}
              gateId={g.id}
              gateCriterion={g.criterion}
            />,
          ])
        )}
        confirmActions={Object.fromEntries(
          levelGates.map(g => [
            g.id,
            <ConfirmGateButton
              key={g.id}
              playerId={params.playerId}
              gateId={g.id}
              currentStatus={playerGateStatuses[g.id]?.status ?? 'not_started'}
            />,
          ])
        )}
      />

      {/* Gate History Timeline — internal audit trail, director and head coach only */}
      <GateHistoryTimeline
        entries={gateActivityLog}
        levelGates={levelGates.map(g => ({ id: g.id, criterion: g.criterion }))}
      />

      {/* Advancement score thresholds — what numbers are needed to exit this level */}
      <PlayerProgressionRequirements
        hasCurriculumState={!!curriculumSummary}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        currentStageName={curriculumSummary?.stage_name ?? null}
        advancementEligible={curriculumSummary?.advancement_eligible ?? null}
        nextLevel={nextCurriculumLevel}
        requirements={progressionRequirements}
        trackScores={progressionScores ? {
          technical_score: progressionScores.technical_score ?? null,
          tactical_score:  progressionScores.tactical_score  ?? null,
          competition_score: progressionScores.competition_score ?? null,
          movement_score:  progressionScores.movement_score  ?? null,
        } : null}
      />

      {/* Requirement progress — director read-only view with manual confirmation */}
      <PlayerRequirementProgressReadOnly
        rows={requirementProgressRows}
        hasCurriculumState={!!curriculumSummary}
        isOrangeBallPlayer={isOrangeBallPlayer}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        confirmAction={confirmProgressAction}
        evidenceByProgressId={evidenceByProgressId}
      />

      {/* Evidence link drafts — pending/approved requirement evidence links */}
      <EvidenceRequirementDrafts drafts={evidenceLinkDrafts} />

      {/* Create evidence link drafts */}
      <Card>
        <CardHeader>
          <p className="label-xs">Evidence Linking</p>
        </CardHeader>
        <CardContent className="pt-0">
          <EvidenceRequirementDraftButton onCreateDrafts={createEvidenceDraftAction} />
        </CardContent>
      </Card>

      {/* Guardrail */}
      <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
        Evidence tracking is review-based. All gate evidence and requirement links go to the director review queue before they count toward advancement. Nothing advances automatically.
      </p>

      {/* Player Q&A Preview — director-only, deterministic, read-only */}
      <PlayerQaPreviewPanel
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        currentLevelStage={curriculumSummary?.stage ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        hasCurriculumState={hasCurriculum}
        gates={levelGates}
        drills={qaTopDrills}
        coachLanguage={qaCoachLanguage}
        learningModuleHint={qaLearningModuleHint}
      />

    </div>
  )

  const notesSlot = (
    <div className="space-y-6">

      {/* Coach Snapshot — pre-session overview for coaches */}
      <CoachPlayerSnapshot
        currentFocus={developmentSummary?.development_focus ?? null}
        doingWell={developmentSummary?.current_strengths ?? []}
        workingOn={developmentSummary?.things_to_work_on ?? []}
        topPriority={activePriorities[0]?.title ?? null}
        recentNote={(enrichedObservations[0] as any)?.content ?? null}
        recentNoteDate={(enrichedObservations[0] as any)?.created_at ?? null}
        updatedAt={developmentSummary?.updated_at ?? null}
      />

      {/* Sprint 1093 — Coach Wrap-Up Observations: director-only surface for approved wrap-up observations.
          Filters enrichedObservations to ai_entities.source === 'coach_wrap_up'.
          No new DB query — reuses data already fetched above. Internal only. */}
      <CoachWrapUpObservationsPanel observations={enrichedObservations} />

      {/* Development Summary display */}
      <Card>
        <CardHeader>
          <p className="label-xs">Development Summary</p>
        </CardHeader>
        <CardContent className="pt-0">
          <DevelopmentSummarySection summary={developmentSummary} />
        </CardContent>
      </Card>

      {/* Notes workflow: Capture → Structure → Review → Apply */}
      <NotesAIDraftSection
        observations={enrichedObservations}
        existingSummary={developmentSummary}
        onGenerate={generateDraftAction}
        onApply={updateSummaryAction}
        onSubmitObservation={addObsAction}
        onSubmitVoiceNote={addVoiceNoteServerAction}
      />

      {/* Edit Development Summary form */}
      <EditDevelopmentSummaryForm summary={developmentSummary} onSubmit={updateSummaryAction} />

      {/* Curriculum source indicator for requirements — Sprint 77 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-raised text-[11px] text-text-muted">
        <span className={academyCurriculumCtx.usingAcademyVersion ? 'text-status-green' : 'text-text-muted'}>●</span>
        <span>
          Requirements source:{' '}
          <span className="font-semibold text-text-secondary">
            {academyCurriculumCtx.usingAcademyVersion
              ? academyCurriculumCtx.curriculumVersionName
              : 'Global curriculum defaults'}
          </span>
          {academyCurriculumCtx.applicableOverrides.length > 0 && (
            <span className="ml-1 text-lime">
              · {academyCurriculumCtx.applicableOverrides.length} override{academyCurriculumCtx.applicableOverrides.length > 1 ? 's' : ''} active
            </span>
          )}
        </span>
      </div>

      {/* Active priorities — read-only visibility, no mutation controls */}
      {/* Sprint 841: DONNA focus target — visible when notes tab is active */}
      {/* Sprint 844: enrichedActivePriorities includes approved_by_name from audit_logs */}
      <div data-donna-focus-id="player-active-priorities">
        <PlayerActivePriorities priorities={enrichedActivePriorities} />
      </div>

      {/* Evidence summary — derived from same observation data, no extra DB query */}
      <CoachObservationEvidenceSummary observations={enrichedObservations} />

      {/* Draft development summary update from approved internal observations */}
      <Card>
        <CardHeader>
          <p className="label-xs">Development Summary Update</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-[11px] text-text-muted">
            Assemble a draft update from recent internal observations. Draft requires director review before updating the development summary.
          </p>
          <DraftSummaryUpdateButton
            playerId={params.playerId}
            academyId={academyId}
            hasObservations={enrichedObservations.length > 0}
          />
        </CardContent>
      </Card>

      {/* Priority recommendation drafts + create button
          Sprint 841: DONNA focus target — visible when notes tab is active.
          Covers both the draft list (PriorityRecommendationDrafts) and the generate button
          so DONNA can highlight the full priority recommendation workflow in one target. */}
      <div data-donna-focus-id="player-priority-recommendation">
        <PriorityRecommendationDrafts drafts={recommendationDrafts} />

        {/* Create priority recommendation draft — deterministic, director-reviewed */}
        <Card>
          <CardHeader>
            <p className="label-xs">Priority Recommendation</p>
          </CardHeader>
          <CardContent className="pt-0">
            <PriorityRecommendationDraftButton onCreateDraft={createDraftAction} />
          </CardContent>
        </Card>
      </div>

      {/* ── Evidence Hub — Phase 7A (Sprints 1057–1062) ───────────────────────── */}
      {/* Director-only. No parent/player exposure. No writes. No automatic level movement. */}
      {/* Sprint 841: DONNA focus target — visible when notes tab is active */}
      <div className="mt-2 pt-2 border-t border-border" data-donna-focus-id="player-evidence-hub">
        <p className="label-xs text-text-muted mb-3">Evidence Hub</p>
      </div>

      {/* Evidence Hub Header — Sprint 1057: aggregate summary, director-only */}
      <PlayerEvidenceHubHeader summary={evidenceSummary} isSchemaMissing={evidenceSummaryIsSchemaMissing} />

      {/* Level Readiness Draft View — Sprint 1061: advancement readiness + DONNA draft */}
      <PlayerLevelReadinessDraftView
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        evidenceSummary={evidenceSummary}
        gates={levelGates}
        gateStatuses={playerGateStatuses}
        playerFirstName={player.first_name ?? null}
      />

      {/* Curriculum Gate Evidence Panel — Sprint 1060: per-gate status + evidence signal */}
      <PlayerCurriculumGateEvidencePanel
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        gates={levelGates}
        gateStatuses={playerGateStatuses}
      />

      {/* Priority Evidence Connection — Sprint 1059: priorities linked to supporting observations */}
      <PlayerPriorityEvidenceConnection
        priorities={activePriorities}
        observations={[
          ...(pathwayEvidence?.skillEvidence ?? []),
          ...(pathwayEvidence?.competitionEvidence ?? []),
          ...(pathwayEvidence?.fitnessEvidence ?? []),
        ]}
      />

      {/* Pathway Evidence Cards — Sprint 1058: skill / competition / fitness breakdown */}
      <PlayerPathwayEvidenceCards
        pathwayEvidence={pathwayEvidence}
        isSchemaMissing={pathwayEvidenceIsSchemaMissing}
        currentFocusSkill={qaCoachLanguage[0]?.current_focus ?? null}
        currentFocusCompetition={competitionTrackLevelName ?? null}
        currentFocusFitness={fitnessPathPhase ?? null}
      />

      {/* Evidence Timeline — Phase 7A: multi-source, typed, director-only */}
      <PlayerEvidenceTimeline items={timelineItems} isSchemaMissing={timelineIsSchemaMissing} />

      {/* ── Parent & Player view preview ──────────────────────────────── */}
      {/* Boundary label: below this line, content reflects what parents/players see */}
      <div className="mt-4 pt-4 border-t border-status-blue/20">
        <p className="label-xs" style={{ color: 'rgba(10,132,255,0.75)' }}>
          Parent &amp; player view — director preview only · Not sent automatically
        </p>
      </div>

      {/* Parent Guidance Preview — director-only, read-only, not sent */}
      <ParentGuidancePreviewPanel
        playerFirstName={player.first_name ?? null}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        currentFocus={qaCoachLanguage[0]?.current_focus ?? null}
        parentSupportTip={null}
      />

      {/* Sprint 1771 — Initiate parent update draft. Creates a proposed_action in the review
          queue. Nothing reaches the parent until the director approves and applies the draft. */}
      <Card>
        <CardHeader>
          <p className="label-xs">Initiate Parent Update</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-[11px] text-text-muted leading-relaxed">
            Creates a parent-safe development update draft for director review. Draft goes to the review queue — nothing is sent until you approve and apply it there.
          </p>
          <InitiateParentUpdateButton playerId={params.playerId} />
        </CardContent>
      </Card>

      {/* Parent-Safe Summary Preview — Sprint 1062: director sees what parents/players would see */}
      <PlayerParentSafeSummaryPreview
        parentSafeData={parentSafeData}
        isSchemaMissing={parentSafeIsSchemaMissing}
        playerFirstName={player.first_name ?? null}
        currentFocus={qaCoachLanguage[0]?.current_focus ?? null}
        nextStep={qaCoachLanguage[0]?.next_step ?? null}
        parentSupportTip={null}
      />

    </div>
  )

  // ─── Tab 6: Session History ───────────────────────────────────────────────
  // Read-only panel. Uses data already fetched above — no additional DB calls.
  // exposureTimeline: last 60 days of session attendance (Tab 4 / Fitness data).
  // enrichedObservations: applied coach_observations (Tab 5 / Notes data).
  const sessionHistorySlot = (
    <PlayerSessionHistoryPanel
      attendanceItems={exposureTimeline}
      observations={enrichedObservations}
    />
  )

  return (
    <div className="animate-fade-in p-4 sm:p-6 max-w-5xl">
      {/* Sprint 854 — Register player priority context into DonnaSessionContext.
          Renders null. Mounts with activePriorities data already fetched above.
          Clears context to null on unmount (navigation away from this player). */}
      <PlayerProfileDonnaRegistrar
        activePriorityCount={activePriorities.length}
        topPriorityTitle={activePriorities[0]?.title ?? null}
        topPriorityLevel={activePriorities[0]?.priority_level ?? null}
      />
      {/* Sprint 841: DONNA focus target — always visible, outside tabs */}
      <div data-donna-focus-id="player-profile-header">
        <PlayerProfileHeader player={player} curriculumSummary={curriculumSummary} />
      </div>
      <PlayerProfileTabs
        overview={overviewSlot}
        skillPath={skillPathSlot}
        competition={competitionSlot}
        fitness={fitnessSlot}
        notes={notesSlot}
        sessionHistory={sessionHistorySlot}
        development={<DevelopmentCenterTab playerId={params.playerId} academyId={academyId} />}
        missions={<MissionsTab playerId={params.playerId} academyId={academyId} />}
        assessments={<AssessmentsTab playerId={params.playerId} academyId={academyId} playerStage={curriculumSummary?.stage ?? null} />}
      />
    </div>
  )
}

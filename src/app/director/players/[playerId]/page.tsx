import { notFound } from 'next/navigation'
import { Trophy, Activity } from 'lucide-react'
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
import { CoachObservationsFeed, type CoachObservationRow } from './CoachObservationsFeed'
import { CoachObservationEvidenceSummary } from './CoachObservationEvidenceSummary'
import { PlayerActivePriorities, type PlayerPriorityRow } from './PlayerActivePriorities'
import { PlayerProgressionRequirements } from './PlayerProgressionRequirements'
import { PriorityRecommendationDraftButton } from './PriorityRecommendationDraftButton'
import { PriorityRecommendationDrafts, type PriorityRecommendationDraftRow } from './PriorityRecommendationDrafts'
import { createPriorityRecommendationDraftAction } from './priorityRecommendationAction'
import { DevelopmentSummarySection } from '@/components/player/DevelopmentSummarySection'
import { AddObservationForm } from '@/components/player/AddObservationForm'
import { AddVoiceNoteForm } from '@/components/player/AddVoiceNoteForm'
import { EditDevelopmentSummaryForm } from '@/components/player/EditDevelopmentSummaryForm'
import { AIDraftPanel } from '@/components/player/AIDraftPanel'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
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
import { EvidenceRequirementDrafts, type EvidenceRequirementDraftRow } from './EvidenceRequirementDrafts'
import { createEvidenceRequirementLinkDraftsAction } from './evidenceRequirementDraftAction'
import { FitnessHomeworkRecommendationButton } from './FitnessHomeworkRecommendationButton'
import { DevelopmentProfileSummaryCard } from '@/components/player/DevelopmentProfileSummaryCard'
import { LevelProgressCard } from '@/components/player/LevelProgressCard'
import { CoachPlayerSnapshot } from '@/components/player/CoachPlayerSnapshot'
import { ProgressEvidenceTimeline } from '@/components/player/ProgressEvidenceTimeline'
import { PlayerQaPreviewPanel } from './PlayerQaPreviewPanel'
import { ParentGuidancePreviewPanel } from './ParentGuidancePreviewPanel'
import type { QaDrillRow, QaCoachLanguageRow, QaLearningModuleHint } from '@/lib/player/playerProgressQa'
import { buildModuleForLevelDomain, type LearningModuleDomain } from '@/lib/curriculum/learningModules'

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

  // ─── Tab 1: Overview ─────────────────────────────────────────────────────
  const overviewSlot = (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6 items-start">

      {/* Left column: player info + development summary */}
      <div className="space-y-6">

        {/* Player Info */}
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

        {/* Development Profile Summary — internal coach view */}
        <DevelopmentProfileSummaryCard summary={developmentSummary} priorities={activePriorities} />

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
                No curriculum assigned yet. Use the Skill Path tab to get started.
              </p>
            )}
          </CardContent>
        </Card>

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
  )

  // ─── Tab 2: Skill Path ────────────────────────────────────────────────────
  // ─── Tab 3: Competition ───────────────────────────────────────────────────
  const competitionSlot = (
    <Card>
      <EmptyState
        icon={<Trophy className="w-5 h-5" />}
        title="Competition tracking coming soon"
        description="Match results, UTR history, and tournament records will appear here."
      />
    </Card>
  )

  // ─── Tab 4: Fitness / Load ────────────────────────────────────────────────
  const fitnessSlot = (
    <div className="space-y-6">
      <Card>
        <EmptyState
          icon={<Activity className="w-5 h-5" />}
          title="Fitness & load tracking coming soon"
          description="Training load, physical assessments, and conditioning metrics will appear here."
        />
      </Card>

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
  // Enriched observation query: academy_id + player_id scoped, with coach name and session context.
  // rawDb cast avoids TS2589 on the multi-join select; RLS already enforces academy scoping.
  const { data: rawObs } = await rawDb
    .from('coach_observations')
    .select([
      'id', 'content', 'observation_type', 'tags', 'is_private', 'ai_entities', 'created_at',
      'profiles!coach_observations_coach_id_fkey(display_name)',
      'sessions!coach_observations_session_id_fkey(name, scheduled_date)',
    ].join(', '))
    .eq('academy_id', academyId)
    .eq('player_id', params.playerId)
    .order('created_at', { ascending: false })
    .limit(20)
  const enrichedObservations: CoachObservationRow[] = rawObs ?? []

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

      {/* Level requirements with director gate evidence buttons */}
      <PlayerLevelRequirementsCard
        gates={levelGates}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        hasCurriculumState={hasCurriculum}
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

      {/* Development Summary display */}
      <Card>
        <CardHeader>
          <p className="label-xs">Development Summary</p>
        </CardHeader>
        <CardContent className="pt-0">
          <DevelopmentSummarySection summary={developmentSummary} />
        </CardContent>
      </Card>

      {/* AI Draft panel */}
      <AIDraftPanel
        existingSummary={developmentSummary}
        onGenerate={generateDraftAction}
        onApply={updateSummaryAction}
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
      <PlayerActivePriorities priorities={activePriorities} />

      {/* Evidence summary — derived from same observation data, no extra DB query */}
      <CoachObservationEvidenceSummary observations={enrichedObservations} />

      {/* Priority recommendation drafts — existing pending/approved drafts for this player */}
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

      {/* Progress Evidence Timeline */}
      <ProgressEvidenceTimeline items={enrichedObservations as any} />

      {/* Internal Coach Observations feed */}
      <div>
        <p className="label-xs mb-1">Internal Coach Observations</p>
        <p className="text-[11px] text-text-muted mb-4">
          Internal development evidence. Not parent-facing yet.
        </p>
        <CoachObservationsFeed observations={enrichedObservations} />
      </div>

      {/* Add Observation form */}
      <AddObservationForm onSubmit={addObsAction} />

      {/* Voice Note form */}
      <AddVoiceNoteForm onSubmit={addVoiceNoteServerAction} />

      {/* Parent Guidance Preview — director-only, read-only, not sent */}
      <ParentGuidancePreviewPanel
        playerFirstName={player.first_name ?? null}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        nextLevelName={nextCurriculumLevel?.display_name ?? null}
        currentFocus={qaCoachLanguage[0]?.current_focus ?? null}
        parentSupportTip={null}
      />

    </div>
  )

  return (
    <div className="animate-fade-in p-4 sm:p-6 max-w-5xl">
      <PlayerProfileHeader player={player} curriculumSummary={curriculumSummary} />
      <PlayerProfileTabs
        overview={overviewSlot}
        skillPath={skillPathSlot}
        competition={competitionSlot}
        fitness={fitnessSlot}
        notes={notesSlot}
      />
    </div>
  )
}

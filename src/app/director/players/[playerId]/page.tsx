import { notFound } from 'next/navigation'
import { Trophy, Activity } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getPlayerById } from '@/lib/backend/players'
import { getPlayerCurriculumDomains } from '@/lib/backend/curriculum'
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
import { PlayerRequirementProgressReadOnly, type RequirementProgressRow } from './PlayerRequirementProgressReadOnly'
import { confirmRequirementProgressStatusAction } from './requirementProgressConfirmationAction'
import type { RequirementEvidenceDetailRow } from './types'
import { EvidenceRequirementDraftButton } from './EvidenceRequirementDraftButton'
import { EvidenceRequirementDrafts, type EvidenceRequirementDraftRow } from './EvidenceRequirementDrafts'
import { createEvidenceRequirementLinkDraftsAction } from './evidenceRequirementDraftAction'

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

  const assignAction = assignCurriculumAction.bind(null, params.playerId, academyId)
  const evaluateAction = evaluateAdvancementAction.bind(null, params.playerId, academyId)

  const blockedBy = curriculumSummary?.advancement_blocked_by ?? []
  const domainCounts = {
    complete:    domainRows.filter(r => r.status === 'complete').length,
    in_progress: domainRows.filter(r => r.status === 'in_progress').length,
    regressed:   domainRows.filter(r => r.status === 'regressed').length,
    not_started: domainRows.filter(r => r.status === 'not_started').length,
  }

  // ─── Tab 1: Overview ─────────────────────────────────────────────────────
  const overviewSlot = (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6 items-start">

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

      {/* Coach Focus summary */}
      <div className="space-y-4">
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
  const skillPathSlot = (
    <div className="space-y-6">

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

    </div>
  )

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
    <Card>
      <EmptyState
        icon={<Activity className="w-5 h-5" />}
        title="Fitness & load tracking coming soon"
        description="Training load, physical assessments, and conditioning metrics will appear here."
      />
    </Card>
  )

  // ─── Tab 5: Notes ─────────────────────────────────────────────────────────
  // Enriched observation query: academy_id + player_id scoped, with coach name and session context.
  // rawDb cast avoids TS2589 on the multi-join select; RLS already enforces academy scoping.
  const rawDb = supabase as any
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

  const developmentSummary = await getPlayerDevelopmentSummary(supabase, params.playerId)

  // Active priorities: scoped by academy_id + player_id, filtered to is_active = true.
  // rawDb cast avoids TS2589; RLS enforces academy scoping at the DB level.
  const { data: rawPriorities } = await rawDb
    .from('player_priorities')
    .select('id, title, description, category, status, priority_level, priority_rank, urgency, generated_at, updated_at')
    .eq('academy_id', academyId)
    .eq('player_id', params.playerId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })
  const activePriorities: PlayerPriorityRow[] = rawPriorities ?? []

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
  // rawDb cast avoids TS2589; RLS enforces academy scoping.
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
  // Type regeneration required after migrations 041–044 are applied to live DB.
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
  // Scoped to academy_id + player_id. rawDb cast: table not yet in database.types.ts.
  // Sequential queries per AI_BACKEND_RULES.md rule 5.
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

  // Progression requirements: level requirements + next level derivation.
  // rawDb cast avoids TS2589; curriculum_levels and v_curriculum_level_requirements are
  // readable by all authenticated users (RLS: "Authenticated read" policies on both tables).
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

  const progressionScores = (player as any).player_progression?.[0] ?? null

  const addObsAction = addObservationAction.bind(null, params.playerId, academyId)
  const updateSummaryAction = updateDevelopmentSummaryAction.bind(null, params.playerId, academyId)
  const addVoiceNoteServerAction = addVoiceNoteAction.bind(null, params.playerId, academyId)
  const generateDraftAction = generateNoteDraftAction

  const notesSlot = (
    <div className="space-y-6">

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

      {/* Progression requirements — read-only curriculum level display, no mutation */}
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

      {/* Requirement progress — Sprint 35 read-only view, Sprint 39 adds manual confirmation.
          Groups by Skill / Competition / Fitness domain.
          Director/head_coach can manually confirm status. No automatic level movement. */}
      <PlayerRequirementProgressReadOnly
        rows={requirementProgressRows}
        hasCurriculumState={!!curriculumSummary}
        isOrangeBallPlayer={isOrangeBallPlayer}
        currentLevelName={curriculumSummary?.current_level_name ?? null}
        confirmAction={confirmProgressAction}
        evidenceByProgressId={evidenceByProgressId}
      />

      {/* Evidence link drafts — Sprint 36 read-only display of pending drafts.
          Draft only. No requirement_evidence_links created. No progress mutations. */}
      <EvidenceRequirementDrafts drafts={evidenceLinkDrafts} />

      {/* Create evidence link drafts — Sprint 36 deterministic matching draft only.
          No requirement status updates. No parent/player views. Director/staff only. */}
      <Card>
        <CardHeader>
          <p className="label-xs">Evidence Linking</p>
        </CardHeader>
        <CardContent className="pt-0">
          <EvidenceRequirementDraftButton onCreateDrafts={createEvidenceDraftAction} />
        </CardContent>
      </Card>

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

    </div>
  )

  return (
    <div className="animate-fade-in p-6">
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

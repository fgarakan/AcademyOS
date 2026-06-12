import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { getReassessmentPipeline } from '@/lib/backend/dashboard'

// ── Operating Partner engines ───────────────────────────────────────────────
import { classifyAcademySituation }                from '@/lib/donna/operations/academySituationAssessment'
import { buildOperatingAttentionReport }           from '@/lib/donna/operations/academyAttentionEngine'
import { buildTodayPriorities }                    from '@/lib/donna/operations/whatShouldIDoTodayEngine'
import { buildTopWins }                            from '@/lib/donna/operations/academyOpportunityEngine'
import { buildDirectorDailyBrief }                 from '@/lib/donna/operations/directorDailyBriefEngine'
import { answerAllCOOQuestions }                   from '@/lib/donna/operations/cooConversationEngine'
import { buildOperatingPartnerInputs }             from '@/lib/donna/operations/buildOperatingPartnerInputs'
import {
  buildWaitDecisions,
  buildIgnoreDecisions,
  buildActionTargets,
  buildWhatChangedResult,
} from '@/lib/donna/operations/academyChangeEngine'
import type { OperatingPartnerPhilosophyInputs } from '@/lib/donna/operations/operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from '@/lib/donna/operations/operatingPartnerOperationalContract'

// ── Command Center components ───────────────────────────────────────────────
import { AcademySituationBanner }   from './_components/AcademySituationBanner'
import { DonnaDailyBriefHero }      from './_components/DonnaDailyBriefHero'
import { DirectorCapacityMeter }    from './_components/DirectorCapacityMeter'
import { TopThreePrioritiesPanel }  from './_components/TopThreePrioritiesPanel'
import { TopThreeAlertsPanel }      from './_components/TopThreeAlertsPanel'
import { TopThreeWinsPanel }        from './_components/TopThreeWinsPanel'
import { WhatCanWaitPanel }         from './_components/WhatCanWaitPanel'
import { WhatShouldIIgnorePanel }   from './_components/WhatShouldIIgnorePanel'
import { WhatChangedPanel }         from './_components/WhatChangedPanel'
import { DonnaCOOPanel }            from './_components/DonnaCOOPanel'

// ── Legacy setup card (still used for empty academy onboarding) ─────────────
import { TodaySetupCard } from './_components/TodaySetupCard'
import { buildTodayBrief } from '@/lib/donna/today/todayBriefEngine'

// ── Helpers ─────────────────────────────────────────────────────────────────

function isPending(status: string | null): boolean {
  return (
    status === 'pending_placement' ||
    status === 'placement_in_progress' ||
    status === 'pending_approval'
  )
}

function buildDefaultPhilosophyInputs(academyId: string): OperatingPartnerPhilosophyInputs {
  return {
    academyId,
    generatedAt:    new Date().toISOString(),
    dataWindowDays: 0,
    identity: {
      dimensions: [
        { key: 'technique_focus',       label: 'Technique Focus',        finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'tactical_focus',        label: 'Tactical Focus',         finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'game_based_learning',   label: 'Game-Based Learning',    finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'competition_emphasis',  label: 'Competition Emphasis',   finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'assessment_rigor',      label: 'Assessment Rigor',       finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'coach_autonomy',        label: 'Coach Autonomy',         finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'parent_transparency',   label: 'Parent Transparency',    finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'long_term_development', label: 'Long-Term Development',  finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'retention_focus',       label: 'Retention Focus',        finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'player_wellbeing',      label: 'Player Wellbeing',       finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
      ],
      overallConfidence: 'provisional',
      narrative:         'Academy philosophy not yet configured. Complete your academy DNA to unlock philosophy-informed recommendations.',
      dataLimitations:   ['Academy DNA not configured — dimensions use default baseline scores'],
    },
    drift: {
      driftDetected:     false,
      driftSeverity:     'LOW',
      confidence:        'provisional',
      driftedDimensions: [],
      donnaMessage:      '',
      suggestedAction:   '',
    },
    preferences: { topPreferences: [], topAvoidances: [] },
    decisions: {
      totalDecisions:  0,
      overrideCount:   0,
      overrideRate:    0,
      topContentTypes: [],
      dataLimitation:  'No decision history yet.',
    },
    evolution: {
      recentPhases:    [],
      overallTheme:    'Academy is in its early operating phase.',
      summaryLine:     'No evolution history recorded yet.',
      dataLimitations: [],
    },
    overrides: [],
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DirectorCommandCenter() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">No session. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  const { data: profile } = await rawDb
    .from('profiles')
    .select('academy_id, display_name')
    .eq('id', user.id)
    .single()

  const academyId: string | null = profile?.academy_id ?? null
  const directorDisplayName: string = profile?.display_name ?? ''

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const { data: academy } = await rawDb
    .from('academies')
    .select('name, settings')
    .eq('id', academyId)
    .single()

  const academyName = (academy?.name as string | null) ?? 'Your Academy'

  const players             = await getPlayerSummaries(supabase, academyId)
  const reassessmentPipeline = await getReassessmentPipeline(supabase, academyId)

  const activePl      = players.filter(p => p.player_status === 'active')
  const activePlayers = activePl.length
  const pendingCount  = players.filter(p => isPending(p.player_status)).length
  const attentionCount = players.filter(
    p => p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length

  // Sessions
  const now       = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, scheduled_date, status, coach_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', weekEndStr)

  const todayStr      = now.toISOString().split('T')[0]
  const todaySessions = (weekSessions ?? []).filter(s => s.scheduled_date === todayStr)

  // Onboarding
  const onboardingSettings = (academy?.settings as Record<string, unknown>) ?? {}
  const hasAcademyDna = typeof onboardingSettings.academy_dna === 'object' && onboardingSettings.academy_dna !== null
  const hasOnboardingComplete = (
    typeof onboardingSettings.onboarding === 'object' &&
    onboardingSettings.onboarding !== null &&
    typeof (onboardingSettings.onboarding as Record<string, unknown>).onboarding_completed_at === 'string'
  )
  const academyDna = onboardingSettings.academy_dna as Record<string, unknown> | undefined
  const directorChallenge = typeof academyDna?.director_challenge === 'string'
    ? academyDna.director_challenge
    : undefined

  // Private lesson requests
  const { data: plrData } = await rawDb
    .from('private_lesson_requests')
    .select('id, status')
    .eq('academy_id', academyId)
  const newRequests = ((plrData ?? []) as Array<{ id: string; status: string }>)
    .filter(r => r.status === 'new').length

  // AI Suggestions
  const { data: suggestionCountData } = await rawDb
    .from('academy_suggestions')
    .select('priority, suggestion_type')
    .eq('academy_id', academyId)
    .eq('status', 'pending')
  const pendingSuggestions = (suggestionCountData ?? []) as Array<{ priority: string; suggestion_type: string }>
  const curriculumGapCount = pendingSuggestions.filter(s => s.suggestion_type === 'curriculum_gap').length

  // Curriculum coverage
  const { data: curricStateRows } = await rawDb
    .from('player_curriculum_states')
    .select('player_id, advancement_eligible, enrolled_at, current_level_id')
    .eq('academy_id', academyId)
  const typedCurricRows = (curricStateRows ?? []) as Array<{
    player_id: string
    advancement_eligible: boolean | null
    enrolled_at: string | null
    current_level_id: string | null
  }>
  const playersWithLevel     = typedCurricRows.length
  const playersWithoutLevel  = Math.max(0, activePlayers - playersWithLevel)
  const advancementReadyCount = typedCurricRows.filter(r => r.advancement_eligible === true).length

  // Stalled players
  const now180dAgo = new Date()
  now180dAgo.setDate(now180dAgo.getDate() - 180)
  const stalledRows = typedCurricRows.filter(r =>
    r.enrolled_at !== null &&
    new Date(r.enrolled_at) <= now180dAgo &&
    r.advancement_eligible !== true,
  )
  const stalledPlayerCount = stalledRows.length

  // Pending wrap-ups
  const { data: pendingWrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
  const pendingWrapUpsCount = (pendingWrapUpData ?? []).length

  // Oldest pending
  const { data: oldestPendingRows } = await rawDb
    .from('proposed_actions')
    .select('created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })
    .limit(1)
  const oldestPendingCreatedAt = ((oldestPendingRows ?? []) as Array<{ created_at: string }>)[0]?.created_at ?? null
  const oldestPendingReviewAgeDays = oldestPendingCreatedAt != null
    ? Math.floor((Date.now() - new Date(oldestPendingCreatedAt).getTime()) / 86400000)
    : null

  // Assessments in review
  const { count: assessmentsInReviewCount } = await rawDb
    .from('proposed_actions')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .in('target_module', ['assessment_studio_draft', 'placement_assessment_draft'])
  const assessmentsNeedingReview = assessmentsInReviewCount ?? 0

  // Parent updates
  const { count: parentUpdatesCount } = await rawDb
    .from('proposed_actions')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('target_module', 'parent_communication')
  const parentUpdatesPendingApproval = parentUpdatesCount ?? 0

  // Placement reviews
  const { count: placementReviewCount } = await rawDb
    .from('proposed_actions')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .in('target_module', ['placement_review', 'placement_recommendation_draft', 'level_review'])
  const activePlacementReviews = placementReviewCount ?? 0

  // Recap completion
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: completedSessionsData } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('status', 'completed')
    .gte('scheduled_date', thirtyDaysAgoStr)
  const completedSessionIds = (completedSessionsData ?? []).map((s: { id: string }) => s.id)

  let sessionsWithNote = new Set<string>()
  if (completedSessionIds.length > 0) {
    const { data: voiceNoteSessionData } = await supabase
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', completedSessionIds)
    sessionsWithNote = new Set(
      (voiceNoteSessionData ?? [])
        .map((v: { session_id: string | null }) => v.session_id)
        .filter(Boolean) as string[],
    )
  }
  const coachRecapsMissing = completedSessionIds.filter(id => !sessionsWithNote.has(id)).length

  // Templates
  const { data: templateCheckData } = await rawDb
    .from('templates')
    .select('id, tags, curriculum_level_id')
    .eq('academy_id', academyId)
    .limit(20)
  const typedTemplateRows = (templateCheckData ?? []) as Array<{ id: string; tags: string[] | null; curriculum_level_id: string | null }>
  const classTemplateCount = typedTemplateRows.filter(t => !(t.tags ?? []).includes('fitness_template:true')).length

  // Sessions exist?
  const { data: anySessionData } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .limit(1)
  const sessionsExist = (anySessionData ?? []).length > 0

  // Group capacity
  const { data: groupSummaryRaw } = await rawDb
    .from('v_group_summary')
    .select('group_id, group_name, player_count, max_players')
    .eq('academy_id', academyId)
  const groupSummaryRows = (groupSummaryRaw ?? []) as Array<{
    group_id: string | null
    group_name: string | null
    player_count: number | null
    max_players: number | null
  }>
  const overCapacityGroupCount = groupSummaryRows.filter(g =>
    g.player_count !== null && g.max_players !== null && g.player_count > g.max_players
  ).length

  // Unassigned players
  const { count: unassignedCount } = await rawDb
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('player_status', 'active')
    .is('primary_coach_id', null)
  const unassignedPlayerCount = unassignedCount ?? 0

  // Reassessment due
  const reassessmentDue = reassessmentPipeline.filter(
    r => r.urgency === 'overdue' || r.urgency === 'due_soon'
  ).length

  // Derived
  const totalPendingReviews = pendingWrapUpsCount + assessmentsNeedingReview + activePlacementReviews
  const isAcademyLive = players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist

  // ── Onboarding redirect ────────────────────────────────────────────────────
  if (!hasOnboardingComplete && !isAcademyLive) {
    redirect('/onboarding')
  }

  // ── Build Operating Partner inputs ────────────────────────────────────────
  const philosophyInputs = buildDefaultPhilosophyInputs(academyId)

  const operationalInputs: OperatingPartnerOperationalInputs = {
    academyId,
    generatedAt:    now.toISOString(),
    dataWindowDays: 30,
    players: {
      dataAvailable:            players.length > 0,
      missingData:              players.length === 0 ? ['No active player data'] : [],
      totalPlayerCount:         activePlayers,
      levelDistribution:        [],
      stallCount:               stalledPlayerCount,
      assessmentDueCount:       reassessmentDue,
      advancementEligibleCount: advancementReadyCount,
      attendanceRiskCount:      attentionCount,
      readinessBlockerCount:    0,
      playersWithoutLevel,
      playersWithoutCoach:      unassignedPlayerCount,
      hasStallData:             stalledPlayerCount > 0 || activePlayers > 0,
      hasAssessmentData:        reassessmentDue >= 0,
      hasAttendanceData:        false,
    },
    coaches: {
      dataAvailable:              completedSessionIds.length > 0,
      missingData:                completedSessionIds.length === 0 ? ['No completed sessions in last 30 days'] : [],
      totalCoachCount:            0,
      missingWrapUpCount:         coachRecapsMissing,
      missingWrapUpCoachCount:    0,
      inconsistentExecutionCount: 0,
      stagnantPlayerByCoachCount: 0,
      recentWrapUpSubmissionRate: completedSessionIds.length > 0
        ? (completedSessionIds.length - coachRecapsMissing) / completedSessionIds.length
        : 0,
      hasWrapUpData:   completedSessionIds.length > 0,
      hasExecutionData: false,
    },
    curriculum: {
      dataAvailable:              playersWithLevel > 0 || classTemplateCount > 0,
      missingData:                playersWithLevel === 0 ? ['No curriculum assignments'] : [],
      weakLevelCount:             0,
      emptyLevelCount:            0,
      missingAssessmentCount:     0,
      missingGateCount:           0,
      contentGapsByType:          {},
      bottleneckLevelCount:       curriculumGapCount > 0 ? 1 : 0,
      pendingApprovalCount:       assessmentsNeedingReview,
      playerBackedBottleneckCount: 0,
      hasCurriculumData:          classTemplateCount > 0,
      hasGateData:                false,
      hasPlayerEvidenceData:      false,
    },
    parents: {
      dataAvailable:         parentUpdatesPendingApproval >= 0,
      missingData:           [],
      totalParentCount:      0,
      communicationGapCount: parentUpdatesPendingApproval,
      updateOverdueCount:    parentUpdatesPendingApproval,
      engagementRiskCount:   0,
      retentionRiskCount:    0,
      transparencyLevel:     'standard',
      hasCommunicationData:  true,
      hasEngagementData:     false,
      hasRetentionData:      false,
    },
    business: {
      dataAvailable:             groupSummaryRows.length > 0,
      missingData:               groupSummaryRows.length === 0 ? ['Group capacity data not available'] : [],
      enrollmentTrendSignal:     players.length > 0 ? 'stable' : 'unknown',
      capacityIssueCount:        overCapacityGroupCount,
      programImbalanceSignal:    null,
      attendanceTrendLast30Days: 'unknown',
      churnRiskSignal:           stalledPlayerCount > 3 ? 'medium' : 'low',
      revenueSignal:             'unavailable',
      hasEnrollmentData:         players.length > 0,
      hasCapacityData:           groupSummaryRows.length > 0,
    },
    system: {
      dataAvailable: true,
      missingData:   [],
      pendingApprovalCount:      totalPendingReviews,
      oldestPendingAgeDays:      oldestPendingReviewAgeDays,
      onboardingIncompleteItems: [
        ...(!hasAcademyDna ? ['academy_dna'] : []),
        ...(players.length === 0 ? ['first_player'] : []),
        ...(classTemplateCount === 0 ? ['first_template'] : []),
      ],
      unreadAlertCount: 0,
      hasLiveData:      players.length > 0,
      isAcademyLive,
    },
  }

  // ── Run Operating Partner engines ─────────────────────────────────────────
  const partnerInputs = buildOperatingPartnerInputs(academyId, philosophyInputs, operationalInputs)
  const situation     = classifyAcademySituation(philosophyInputs, operationalInputs)
  const attentionReport = buildOperatingAttentionReport(partnerInputs)
  const todayResult   = buildTodayPriorities(partnerInputs, situation, attentionReport)
  const wins          = buildTopWins(partnerInputs)
  const brief         = buildDirectorDailyBrief(partnerInputs, situation, attentionReport, todayResult, wins)
  const cooAnswers    = answerAllCOOQuestions(partnerInputs, brief, situation, todayResult)

  // ── Build UI-layer decision models ────────────────────────────────────────
  const waitDecisions   = buildWaitDecisions(todayResult)
  const ignoreDecisions = buildIgnoreDecisions(attentionReport.signals, todayResult.whatToIgnore)
  const actionTargets   = buildActionTargets(todayResult.priorities)
  const whatChanged     = buildWhatChangedResult(todayResult.priorities, brief.alerts, brief.wins, 7)

  // ── Legacy brief (for setup card only) ───────────────────────────────────
  const legacyBrief = buildTodayBrief({
    isAcademyLive,
    hasAcademyDna,
    hasOnboardingComplete,
    directorChallenge,
    classTemplateCount,
    sessionsExist,
    activePlayers,
    advancementReadyCount,
    stalledPlayerCount,
    attentionCount,
    reassessmentDue,
    playersWithLevel,
    playersWithoutLevel,
    unassignedPlayerCount,
    pendingWrapUpsCount,
    assessmentsNeedingReview,
    activePlacementReviews,
    parentUpdatesPending: parentUpdatesPendingApproval,
    newRequests,
    totalPendingReviews,
    oldestPendingReviewAgeDays,
    coachRecapsMissing,
    curriculumGapCount,
    overCapacityGroupCount,
  })

  // ── Primary priority for hero ─────────────────────────────────────────────
  const primaryPriority = todayResult.priorities[0] ?? null
  const primaryTarget   = actionTargets[0] ?? null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 animate-fade-in pb-16">

      {/* Setup mode — keep existing onboarding gate */}
      {legacyBrief.setupMode ? (
        <TodaySetupCard steps={legacyBrief.setupSteps} />
      ) : (
        <>
          {/* ── Academy Weather ───────────────────────────────────────────── */}
          <AcademySituationBanner
            situation={situation}
            generatedAt={partnerInputs.generatedAt}
          />

          {/* ── Hero + Capacity ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <DonnaDailyBriefHero
              brief={brief}
              directorName={directorDisplayName}
              situation={situation}
              primaryPriority={primaryPriority}
              primaryTarget={primaryTarget}
            />
            <DirectorCapacityMeter budget={todayResult.budget} />
          </div>

          {/* ── Top 3 Priorities ─────────────────────────────────────────── */}
          <TopThreePrioritiesPanel
            priorities={todayResult.priorities}
            actionTargets={actionTargets}
          />

          {/* ── Alerts + Wins ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TopThreeAlertsPanel alerts={brief.alerts} />
            <TopThreeWinsPanel wins={brief.wins} />
          </div>

          {/* ── Decisions ────────────────────────────────────────────────── */}
          <WhatCanWaitPanel waitDecisions={waitDecisions} />
          <WhatShouldIIgnorePanel ignoreDecisions={ignoreDecisions} />

          {/* ── What Changed ─────────────────────────────────────────────── */}
          <WhatChangedPanel whatChanged={whatChanged} />

          {/* ── DONNA COO Conversations ───────────────────────────────────── */}
          <DonnaCOOPanel answers={cooAnswers} />
        </>
      )}
    </div>
  )
}

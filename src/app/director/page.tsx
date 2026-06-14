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
  buildActionTargets,
  buildWhatChangedResult,
} from '@/lib/donna/operations/academyChangeEngine'
import type { OperatingPartnerPhilosophyInputs } from '@/lib/donna/operations/operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from '@/lib/donna/operations/operatingPartnerOperationalContract'
import { buildDirectorDecisionContext }           from '@/lib/donna/operations/directorDecisionEngine'
import { buildDraftsFromDecisions, buildWorkQueueSummary } from '@/lib/donna/actions/donnaDraftBuilder'

// ── Command Center components ───────────────────────────────────────────────
import { DonnaCommandBrief }        from './_components/DonnaCommandBrief'
import type { BriefPriorityItem }   from './_components/DonnaCommandBrief'
import { DonnaAlertsAndMomentum }   from './_components/DonnaAlertsAndMomentum'
import { DirectorDecisionCenter }   from './_components/DirectorDecisionCenter'
import { WhatCanWaitPanel }         from './_components/WhatCanWaitPanel'
import { DonnaCOOPanel }            from './_components/DonnaCOOPanel'
import { PlayersNeedingAttentionPanel } from './_components/PlayersNeedingAttentionPanel'

// ── Legacy setup card (still used for empty academy onboarding) ─────────────
import { TodaySetupCard } from './_components/TodaySetupCard'
// ── Sprint 2291–2320 — DONNA Mission Control ────────────────────────────────
import { ActiveMissionCard } from './_components/ActiveMissionCard'
import { formatActiveMission } from '@/lib/donna/workflow/donnaMissionFormatter'
import type { DonnaWorkflowState } from '@/lib/donna/workflow/donnaWorkflowState'
import { buildTodayBrief } from '@/lib/donna/today/todayBriefEngine'
// ── Sprint 2381–2410 — DONNA Daily Brief + Academy Pulse V1 ─────────────────
import { buildAcademyPulse }         from '@/lib/donna/pulse/academyPulseEngine'
import { loadPriorSessionSummaries } from '@/lib/donna/memory/donnaCrossSessionMemory'
import { SinceYourLastVisitPanel }   from './_components/SinceYourLastVisitPanel'

// ── Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1 ──
import type { AcademyDailySnapshot, AcademyHealthSignal } from '@/lib/donna/coo/academyDailySnapshot'
import { buildMorningBrief }    from '@/lib/donna/coo/morningBriefEngine'
import { buildProactiveAlerts } from '@/lib/donna/coo/donnaProactiveAlerts'
import { COOHeroBanner }        from './_components/COOHeroBanner'
import { AcademyPulseTimeline } from './_components/AcademyPulseTimeline'
import type { PulseTimelineWindow } from './_components/AcademyPulseTimeline'

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

  // daysSinceLastVisit uses last_sign_in_at as a proxy for last visit.
  // Works correctly when the director logs in fresh each time; may read 0
  // on same-session refreshes. Threshold is 14 days for returning-director mode.
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
  const daysSinceLastVisit: number | null = lastSignIn
    ? Math.floor((Date.now() - lastSignIn.getTime()) / 86_400_000)
    : null

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

  // Sprint 2291–2320 — Load active mission from donna_working_memory
  const nowIso = new Date().toISOString()
  const { data: wfRow } = await rawDb
    .from('donna_working_memory')
    .select('memory_value, expires_at')
    .eq('user_id', user.id)
    .eq('memory_key', 'active_workflow_state')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const rawWfState = wfRow?.memory_value as DonnaWorkflowState | null | undefined
  const activeMission = rawWfState &&
    rawWfState.status !== 'cancelled' &&
    rawWfState.status !== 'completed'
      ? formatActiveMission(rawWfState)
      : null

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
    .select('id, coach_id')
    .eq('academy_id', academyId)
    .eq('status', 'completed')
    .gte('scheduled_date', thirtyDaysAgoStr)
  const typedCompletedSessions = (completedSessionsData ?? []) as Array<{ id: string; coach_id: string | null }>
  const completedSessionIds = typedCompletedSessions.map(s => s.id)

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

  // Per-coach missing wrap-up count (distinct coaches with at least one session missing a note)
  const sessionsMissingNote = typedCompletedSessions.filter(s => !sessionsWithNote.has(s.id))
  const missingWrapUpCoachIds = new Set(
    sessionsMissingNote.map(s => s.coach_id).filter(Boolean) as string[]
  )
  const missingWrapUpCoachCount = missingWrapUpCoachIds.size

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

  // Coach count from memberships
  const { count: coachMembershipCount } = await rawDb
    .from('academy_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .in('role', ['coach', 'head_coach'])
    .eq('is_active', true)
  const totalCoachCount = coachMembershipCount ?? 0

  // Stagnant players by coach (distinct coaches with 2+ stalled players)
  let stagnantPlayerByCoachCount = 0
  if (stalledRows.length > 0) {
    const stalledIds = stalledRows.map(r => r.player_id).slice(0, 100)
    const { data: stalledCoachData } = await rawDb
      .from('players')
      .select('id, primary_coach_id')
      .in('id', stalledIds)
    const stalledCoachRows = (stalledCoachData ?? []) as Array<{ id: string; primary_coach_id: string | null }>
    const coachStalledMap = new Map<string, number>()
    for (const p of stalledCoachRows) {
      if (p.primary_coach_id) {
        coachStalledMap.set(p.primary_coach_id, (coachStalledMap.get(p.primary_coach_id) ?? 0) + 1)
      }
    }
    stagnantPlayerByCoachCount = Array.from(coachStalledMap.values()).filter(c => c >= 2).length
  }

  // Curriculum levels (global — no academy filter; levels are shared across academies)
  const { data: curriculumLevelsData } = await rawDb
    .from('curriculum_levels')
    .select('id')
  const allLevelRows = (curriculumLevelsData ?? []) as Array<{ id: string }>
  const totalLevelCount = allLevelRows.length

  // Curriculum gates (active only)
  const { data: curriculumGatesData } = await rawDb
    .from('curriculum_gates')
    .select('from_level_id')
    .eq('is_active', true)
  const typedGatesRows = (curriculumGatesData ?? []) as Array<{ from_level_id: string | null }>

  // Per-level gate and template counts
  const gatesPerLevel = new Map<string, number>()
  for (const gate of typedGatesRows) {
    if (gate.from_level_id) {
      gatesPerLevel.set(gate.from_level_id, (gatesPerLevel.get(gate.from_level_id) ?? 0) + 1)
    }
  }
  const templatesPerLevel = new Map<string, number>()
  for (const t of typedTemplateRows) {
    if (t.curriculum_level_id) {
      templatesPerLevel.set(t.curriculum_level_id, (templatesPerLevel.get(t.curriculum_level_id) ?? 0) + 1)
    }
  }

  const missingGateCount = allLevelRows.filter(l => (gatesPerLevel.get(l.id) ?? 0) === 0).length
  const emptyLevelCount  = allLevelRows.filter(l =>
    (gatesPerLevel.get(l.id) ?? 0) === 0 && (templatesPerLevel.get(l.id) ?? 0) === 0
  ).length
  const weakLevelCount   = allLevelRows.filter(l =>
    (gatesPerLevel.get(l.id) ?? 0) > 0 && (gatesPerLevel.get(l.id) ?? 0) < 3
  ).length
  const hasGateData = curriculumGatesData !== null

  // Enrollment trend: compare last 30d enrollments vs prior 30–60d
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const thirtyDaysAgoTs = thirtyDaysAgo.getTime()
  const sixtyDaysAgoTs  = sixtyDaysAgo.getTime()
  const recentEnrollments = typedCurricRows.filter(r => {
    if (!r.enrolled_at) return false
    return new Date(r.enrolled_at).getTime() >= thirtyDaysAgoTs
  }).length
  const priorEnrollments = typedCurricRows.filter(r => {
    if (!r.enrolled_at) return false
    const t = new Date(r.enrolled_at).getTime()
    return t >= sixtyDaysAgoTs && t < thirtyDaysAgoTs
  }).length
  const enrollmentTrendSignal: 'growing' | 'stable' | 'declining' | 'unknown' =
    recentEnrollments === 0 && priorEnrollments === 0 ? 'unknown' :
    recentEnrollments > priorEnrollments    ? 'growing' :
    recentEnrollments < priorEnrollments    ? 'declining' : 'stable'

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
      attendanceRiskCount:      0,
      readinessBlockerCount:    0,
      playersWithoutLevel,
      playersWithoutCoach:      unassignedPlayerCount,
      hasStallData:             stalledPlayerCount > 0 || activePlayers > 0,
      hasAssessmentData:        reassessmentDue >= 0,
      hasAttendanceData:        false,
    },
    coaches: {
      dataAvailable:              totalCoachCount > 0,
      missingData:                totalCoachCount === 0 ? ['No coaches found in academy memberships'] : [],
      totalCoachCount,
      missingWrapUpCount:         coachRecapsMissing,
      missingWrapUpCoachCount,
      inconsistentExecutionCount: 0,
      stagnantPlayerByCoachCount,
      recentWrapUpSubmissionRate: completedSessionIds.length > 0
        ? (completedSessionIds.length - coachRecapsMissing) / completedSessionIds.length
        : 0,
      hasWrapUpData:   completedSessionIds.length > 0,
      hasExecutionData: false,
    },
    curriculum: {
      dataAvailable:              totalLevelCount > 0 || classTemplateCount > 0,
      missingData:                totalLevelCount === 0 && classTemplateCount === 0 ? ['No curriculum structure found'] : [],
      weakLevelCount,
      emptyLevelCount,
      missingAssessmentCount:     0,
      missingGateCount,
      contentGapsByType:          {},
      bottleneckLevelCount:       curriculumGapCount > 0 ? 1 : 0,
      pendingApprovalCount:       assessmentsNeedingReview,
      playerBackedBottleneckCount: curriculumGapCount,
      hasCurriculumData:          totalLevelCount > 0 || classTemplateCount > 0,
      hasGateData,
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
      enrollmentTrendSignal,
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
  const actionTargets   = buildActionTargets(todayResult.priorities)
  const whatChanged     = buildWhatChangedResult(todayResult.priorities, brief.alerts, brief.wins, 7)

  // ── Director Decision Context ─────────────────────────────────────────────
  const decisionContext = buildDirectorDecisionContext({
    todayResult,
    brief,
    whatChanged,
    actionTargets,
    daysSinceLastVisit,
  })

  // ── Work queue count for hero ─────────────────────────────────────────────
  const actionDrafts     = buildDraftsFromDecisions(decisionContext.decisions)
  const workQueueSummary = buildWorkQueueSummary(actionDrafts)

  // ── Sprint 2381–2410 — Academy Pulse + Session Memory ────────────────────
  const pulse = buildAcademyPulse(situation, brief, attentionReport)

  // ── Mega Sprint 2591–2620 — DONNA Proactive COO ──────────────────────────
  const directorFirstName = directorDisplayName.split(' ')[0] ?? directorDisplayName

  function pulseToHealthSignal(ps: typeof pulse.pulseStatus): AcademyHealthSignal {
    if (ps === 'excellent')       return 'healthy'
    if (ps === 'stable')          return 'stable'
    if (ps === 'needs_attention') return 'needs_attention'
    if (ps === 'critical')        return 'critical'
    return 'no_data'
  }

  const cooSnapshot: AcademyDailySnapshot = {
    generatedAt:         new Date().toISOString(),
    healthSignal:        pulse.dataInsufficient ? 'no_data' : pulseToHealthSignal(pulse.pulseStatus),
    healthSummary:       pulse.pulseSummary,
    topPriorities:       todayResult.priorities.slice(0, 3).map((p, i) => ({
      title:   p.title,
      urgency: (p.urgency === 'immediate' ? 'critical'
              : p.urgency === 'this_week'  ? 'medium'
              : 'low') as 'critical' | 'high' | 'medium' | 'low',
      route:   actionTargets[i]?.route ?? null,
      ageDays: oldestPendingReviewAgeDays ?? 0,
    })),
    topRisk:             brief.alerts[0]
      ? { label: brief.alerts[0].headline, route: '/director/review' }
      : null,
    topOpportunity:      brief.wins[0]
      ? { label: brief.wins[0].headline, route: null }
      : null,
    attentionCount,
    advancementCount:    advancementReadyCount,
    parentFollowupCount: parentUpdatesPendingApproval,
    pendingActionsCount: totalPendingReviews,
    whatChanged,
    directorFirstName,
  }

  const morningBrief    = buildMorningBrief(cooSnapshot)
  const proactiveAlerts = buildProactiveAlerts(cooSnapshot)

  // Pulse timeline: yesterday (inferred from changes), today (live), tomorrow (projected)
  const hasNegativeChanges = whatChanged.changes.some(c => c.changeType === 'negative')
  const hasPositiveChanges = whatChanged.changes.some(c => c.changeType === 'positive')
  const yesterdaySignal: AcademyHealthSignal = hasNegativeChanges ? 'needs_attention' : hasPositiveChanges ? 'healthy' : cooSnapshot.healthSignal
  const tomorrowSignal: AcademyHealthSignal  =
    cooSnapshot.healthSignal === 'critical'        ? 'critical' :
    cooSnapshot.healthSignal === 'needs_attention' ? 'stable'   :
    cooSnapshot.healthSignal

  const pulseYesterday: PulseTimelineWindow = {
    label:     'Yesterday',
    signal:    yesterdaySignal,
    summary:   whatChanged.hasChanges
      ? `${whatChanged.changes.length} change${whatChanged.changes.length !== 1 ? 's' : ''} detected`
      : 'No significant changes logged',
    itemCount: whatChanged.changes.length,
  }
  const pulseToday: PulseTimelineWindow = {
    label:     'Today',
    signal:    cooSnapshot.healthSignal,
    summary:   cooSnapshot.healthSummary,
    itemCount: totalPendingReviews,
  }
  const pulseTomorrow: PulseTimelineWindow = {
    label:     'Tomorrow',
    signal:    tomorrowSignal,
    summary:   tomorrowSignal === 'critical'
      ? 'Action required before it escalates further'
      : cooSnapshot.healthSignal === 'needs_attention'
        ? 'Projected stable if today\'s items are reviewed'
        : 'On track — continue current pace',
    itemCount: 0,
  }

  const allPriorityItems: BriefPriorityItem[] = todayResult.priorities.slice(0, 3).map((p, i) => ({
    title:   p.title,
    route:   actionTargets[i]?.route ?? '/director/review',
    urgency: p.urgency,
  }))

  // Load Tier 1 session memory for "Since Your Last Visit" panel
  // Non-fatal: if this fails, priorSessionContext stays null and the panel doesn't render
  let priorSessionContext = null
  try {
    priorSessionContext = await loadPriorSessionSummaries(supabase, user.id, academyId)
  } catch {
    // silent — optional enrichment only
  }

  // ── Sprint 2381B–2410B — Who Needs Attention (ranked) ────────────────────────
  // Ranking tiers: 1=High Risk · 2=Stalled Progression · 3=Overdue Assessment
  //                4=Advancement Ready · 5=General Attention
  // #1 player = "If the Director only looks at one player today, who should it be?"

  const playerNameMap = new Map<string, string>()
  for (const p of players) {
    if (p.player_id && p.full_name) {
      playerNameMap.set(p.player_id, p.full_name)
    }
  }

  interface PlayerAttentionCandidate {
    playerId: string
    name: string
    reason: string
    recommendedAction: string
    rankTier: number
    rankScore: number
    route: string
  }
  const attentionCandidates: PlayerAttentionCandidate[] = []
  const seenAttentionIds = new Set<string>()

  // Tier 1: High Risk — player is on hold (explicit director action required)
  for (const p of players) {
    if (!p.player_id || !p.full_name) continue
    if (p.player_status !== 'on_hold') continue
    if (seenAttentionIds.has(p.player_id)) continue
    seenAttentionIds.add(p.player_id)
    attentionCandidates.push({
      playerId: p.player_id,
      name: p.full_name,
      reason: 'Player is on hold — requires director decision',
      recommendedAction: 'Review player status and determine path forward',
      rankTier: 1,
      rankScore: 100,
      route: `/director/players/${p.player_id}`,
    })
  }

  // Tier 2: Stalled Progression — enrolled > 180 days, not advancement eligible
  // Sort by worst stall first (most days = most urgent)
  const stalledWithDays = stalledRows
    .map(r => ({
      player_id: r.player_id,
      stallDays: r.enrolled_at
        ? Math.floor((now.getTime() - new Date(r.enrolled_at).getTime()) / 86400000)
        : 180,
    }))
    .sort((a, b) => b.stallDays - a.stallDays)

  for (const s of stalledWithDays) {
    if (!s.player_id) continue
    const name = playerNameMap.get(s.player_id)
    if (!name) continue
    if (seenAttentionIds.has(s.player_id)) continue
    seenAttentionIds.add(s.player_id)
    attentionCandidates.push({
      playerId: s.player_id,
      name,
      reason: `Progress stalled ${s.stallDays} days`,
      recommendedAction: 'Review advancement readiness and set next milestone',
      rankTier: 2,
      rankScore: s.stallDays,
      route: `/director/players/${s.player_id}`,
    })
  }

  // Tier 3: Overdue Assessment — sorted by days_overdue descending
  const overdueByDays = reassessmentPipeline
    .filter(r => r.urgency === 'overdue')
    .sort((a, b) => (b.days_overdue ?? 0) - (a.days_overdue ?? 0))

  for (const r of overdueByDays) {
    if (!r.player_id || !r.full_name) continue
    if (seenAttentionIds.has(r.player_id)) continue
    seenAttentionIds.add(r.player_id)
    const days = typeof r.days_overdue === 'number' && r.days_overdue > 0 ? r.days_overdue : null
    attentionCandidates.push({
      playerId: r.player_id,
      name: r.full_name,
      reason: days ? `Assessment ${days} days overdue` : 'Assessment overdue',
      recommendedAction: 'Schedule reassessment and update curriculum level',
      rankTier: 3,
      rankScore: r.days_overdue ?? 0,
      route: `/director/players/${r.player_id}`,
    })
  }

  // Tier 4: Advancement Ready — promotion_ready on active players
  for (const p of activePl) {
    if (!p.player_id || !p.full_name) continue
    if (!p.promotion_ready) continue
    if (seenAttentionIds.has(p.player_id)) continue
    seenAttentionIds.add(p.player_id)
    attentionCandidates.push({
      playerId: p.player_id,
      name: p.full_name,
      reason: 'Ready for level advancement',
      recommendedAction: 'Review advancement criteria and assign next curriculum level',
      rankTier: 4,
      rankScore: 50,
      route: `/director/players/${p.player_id}`,
    })
  }

  // Tier 5: General Attention — reassessment_due status
  for (const p of players) {
    if (!p.player_id || !p.full_name) continue
    if (p.player_status !== 'reassessment_due') continue
    if (seenAttentionIds.has(p.player_id)) continue
    seenAttentionIds.add(p.player_id)
    attentionCandidates.push({
      playerId: p.player_id,
      name: p.full_name,
      reason: 'Reassessment is due',
      recommendedAction: 'Complete scheduled reassessment',
      rankTier: 5,
      rankScore: 25,
      route: `/director/players/${p.player_id}`,
    })
  }

  // Sort: tier first, then rankScore descending within tier → take top 3
  const playersNeedingAttention = attentionCandidates
    .sort((a, b) =>
      a.rankTier !== b.rankTier
        ? a.rankTier - b.rankTier
        : b.rankScore - a.rankScore,
    )
    .slice(0, 3)
    .map(({ playerId, name, reason, recommendedAction, route }) => ({
      playerId, name, reason, recommendedAction, route,
    }))

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
          {/* ── Active Mission Card — above fold when Director has a mission ─── */}
          {activeMission && (
            <ActiveMissionCard mission={activeMission} />
          )}

          {/* ── DONNA COO Hero — proactive morning brief (Sprint 2591–2620) ── */}
          <COOHeroBanner
            brief={morningBrief}
            alerts={proactiveAlerts}
            healthSignal={cooSnapshot.healthSignal}
          />

          {/* ── Academy Pulse Timeline — Yesterday / Today / Tomorrow ─────── */}
          {!pulse.dataInsufficient && (
            <AcademyPulseTimeline
              yesterday={pulseYesterday}
              today={pulseToday}
              tomorrow={pulseTomorrow}
            />
          )}

          {/* ── Since Your Last Visit — session memory panel (Sprint 2381) ─── */}
          <SinceYourLastVisitPanel priorSessionContext={priorSessionContext} />

          {/* ── DONNA Command Brief ─────────────────────────────────────────
              Unified hero: academy pulse + "3 things that matter" greeting
              + priority list + primary CTA + work queue count link. ───────── */}
          <DonnaCommandBrief
            brief={brief}
            directorName={directorDisplayName}
            situation={situation}
            generatedAt={partnerInputs.generatedAt}
            primaryPriority={primaryPriority}
            primaryTarget={primaryTarget}
            workQueuePendingCount={workQueueSummary.totalPending}
            returningDirectorMode={decisionContext.returningDirectorMode}
            returningDirectorSummary={decisionContext.returningDirectorSummary}
            daysSinceLastVisit={decisionContext.daysSinceLastVisit}
            pulse={pulse}
            allPriorityItems={allPriorityItems}
          />

          {/* ── Players Needing Attention — WHO + WHY + NEXT ACTION ────────
              Ranked: High Risk → Stalled → Overdue Assessment →
              Advancement Ready → General. #1 = highest urgency today. */}
          <PlayersNeedingAttentionPanel players={playersNeedingAttention} />

          {/* ── Top Decisions — evidence below fold (collapsed) ──────────── */}
          <details className="rounded-xl border border-border overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-raised/50 transition-colors list-none">
              <span className="text-sm font-medium text-text-secondary">Top Decisions</span>
              <span className="label-xs text-text-muted">
                {decisionContext.decisions.length} item{decisionContext.decisions.length !== 1 ? 's' : ''} · expand
              </span>
            </summary>
            <div className="border-t border-border p-5">
              <DirectorDecisionCenter decisions={decisionContext.decisions} />
            </div>
          </details>

          {/* ── Academy Signals — alerts + wins (collapsed) ──────────────── */}
          {(brief.alerts.length > 0 || brief.wins.length > 0) && (
            <details className="rounded-xl border border-border overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-raised/50 transition-colors list-none">
                <span className="text-sm font-medium text-text-secondary">Academy Signals</span>
                <span className="label-xs text-text-muted">
                  {brief.alerts.length > 0
                    ? `${brief.alerts.length} alert${brief.alerts.length !== 1 ? 's' : ''} · expand`
                    : 'expand'}
                </span>
              </summary>
              <div className="border-t border-border">
                <DonnaAlertsAndMomentum alerts={brief.alerts} wins={brief.wins} />
              </div>
            </details>
          )}

          {/* ── What Can Wait — DONNA deferrals (already collapsed) ──────── */}
          <WhatCanWaitPanel waitDecisions={waitDecisions} />

          {/* ── DONNA Strategic Questions — collapsed by default ──────────── */}
          <details className="rounded-xl border border-border overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-raised/50 transition-colors list-none">
              <span className="text-sm font-medium text-text-secondary">DONNA — Strategic Questions</span>
              <span className="label-xs text-text-muted">expand</span>
            </summary>
            <div className="border-t border-border">
              <DonnaCOOPanel answers={cooAnswers} />
            </div>
          </details>
        </>
      )}
    </div>
  )
}

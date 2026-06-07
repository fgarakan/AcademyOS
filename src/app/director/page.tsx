import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { getAcademyPriorityQueue, getReassessmentPipeline } from '@/lib/backend/dashboard'
import { computeRecapCompletionRate, type RecapCheckRow } from '@/lib/kpi/coachExecutionKpiEngine'
import { buildAttentionQueue, type AttentionQueueInput } from '@/lib/director/attentionQueue'
import { buildDashboardAttentionContext } from '@/lib/donna/proactive/dashboardAttentionContext'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'
import { loadCurriculumBottleneck } from '@/lib/donna/curriculumBottleneckLoader'
import { deriveLevelKeyFromSignal } from '@/lib/curriculum/curriculumAttentionRanking'
import { buildAcademyHealthReport } from '@/lib/donna/intelligence/academyHealthBrief'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'

import { DirectorContinueSetupPanel } from '@/components/director/DirectorContinueSetupPanel'
import { DirectorDnaStatusBadge } from './_components/DirectorDnaStatusBadge'
import { DonnaMorningBrief } from './_components/DonnaMorningBrief'
import { ImmediateAttentionFeed } from './_components/ImmediateAttentionFeed'
import { TodayOperationsPanel } from './_components/TodayOperationsPanel'
import { DevelopmentWatchList } from './_components/DevelopmentWatchList'
import type { WatchPlayer } from './_components/DevelopmentWatchList'
import { DirectorDecisionsQueue } from './_components/DirectorDecisionsQueue'
import { ProgramHealthNarrative } from './_components/ProgramHealthNarrative'
import { AcademyIntelligenceSection } from './_components/AcademyIntelligenceSection'
import { DonnaRecommendedActions } from './_components/DonnaRecommendedActions'
import { inferredConfidence, factualConfidence } from '@/lib/donna/confidenceEngine'

// ── Helpers ────────────────────────────────────────────────────

function isPending(status: string | null): boolean {
  return (
    status === 'pending_placement' ||
    status === 'placement_in_progress' ||
    status === 'pending_approval'
  )
}

// ── Page ───────────────────────────────────────────────────────

export default async function DirectorDashboard() {
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

  const players = await getPlayerSummaries(supabase, academyId)
  const priorityQueue = await getAcademyPriorityQueue(supabase, academyId, { limit: 5 })
  const reassessmentPipeline = await getReassessmentPipeline(supabase, academyId)

  // Player counts
  const activePl      = players.filter(p => p.player_status === 'active')
  const activePlayers = activePl.length
  const pendingCount  = players.filter(p => isPending(p.player_status)).length
  const attentionCount = players.filter(
    p => p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length

  const withDelta      = activePl.filter(p => p.score_delta !== null && p.score_delta !== undefined)
  const improvingCount = withDelta.filter(p => (p.score_delta ?? 0) > 0).length

  // Sessions — this week
  const now      = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, status, coach_id, group_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', weekEndStr)

  const sessionsThisWeek = (weekSessions ?? []).length

  // Today's sessions
  const todayStr     = now.toISOString().split('T')[0]
  const todaySessions = (weekSessions ?? []).filter(s => s.scheduled_date === todayStr)
  const coachCoverageGaps = todaySessions.filter(s => !s.coach_id).length

  // Onboarding settings
  const onboardingSettings = (academy?.settings as Record<string, unknown>) ?? {}
  const hasAcademyDna = typeof onboardingSettings.academy_dna === 'object' && onboardingSettings.academy_dna !== null
  const dnaSavedAt = typeof onboardingSettings.academy_dna_completed_at === 'string'
    ? onboardingSettings.academy_dna_completed_at
    : null

  // Private lesson requests
  const { data: plrData } = await rawDb
    .from('private_lesson_requests')
    .select('id, status')
    .eq('academy_id', academyId)

  const allRequests = (plrData ?? []) as Array<{ id: string; status: string }>
  const newRequests = allRequests.filter(r => r.status === 'new').length

  // AI Suggestions
  const { data: suggestionCountData } = await rawDb
    .from('academy_suggestions')
    .select('priority, suggestion_type')
    .eq('academy_id', academyId)
    .eq('status', 'pending')
  const pendingSuggestions = (suggestionCountData ?? []) as Array<{ priority: string; suggestion_type: string }>
  const pendingSuggestionsCount = pendingSuggestions.length
  const curricGapCount = pendingSuggestions.filter(s => s.suggestion_type === 'curriculum_gap').length

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
  const playersWithLevel    = typedCurricRows.length
  const playersWithoutLevel = Math.max(0, activePlayers - playersWithLevel)
  const advancementReadyCount = typedCurricRows.filter(r => r.advancement_eligible === true).length

  // Stalled players (enrolled > 180 days, not advancement-eligible)
  const now180dAgo = new Date()
  now180dAgo.setDate(now180dAgo.getDate() - 180)
  const stalledRows = typedCurricRows.filter(r =>
    r.enrolled_at !== null &&
    new Date(r.enrolled_at) <= now180dAgo &&
    r.advancement_eligible !== true,
  )
  const stalledPlayerCount = stalledRows.length

  const playerSummaryById = new Map(players.map(p => [p.player_id, p]))
  const playerProgressStalls: PlayerProgressStall[] = stalledRows
    .map(r => {
      const ps = playerSummaryById.get(r.player_id)
      const daysAtCurrentLevel = Math.floor(
        (Date.now() - new Date(r.enrolled_at!).getTime()) / 86400000,
      )
      return {
        playerId:                r.player_id,
        playerName:              ps?.full_name ?? 'Unknown Player',
        currentLevelDisplayName: ps?.level_label ?? r.current_level_id ?? null,
        daysAtCurrentLevel,
        stallSeverity:           (daysAtCurrentLevel > 270 ? 'high' : 'medium') as 'high' | 'medium',
      }
    })
    .slice(0, 5)

  // Pending coach wrap-ups
  const { data: pendingWrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
  const pendingWrapUpsCount = (pendingWrapUpData ?? []).length

  // Oldest pending review age
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

  // Assessments in review queue
  const { count: assessmentsInReviewCount } = await rawDb
    .from('proposed_actions')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .in('target_module', ['assessment_studio_draft', 'placement_assessment_draft'])
  const assessmentsNeedingReview = assessmentsInReviewCount ?? 0

  // Parent updates pending
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

  // Recap completion KPI
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
  let recapCompletionPct: number | null = null

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

    const recapChecks: RecapCheckRow[] = completedSessionIds.map(id => ({
      session_id: id,
      has_note: sessionsWithNote.has(id),
    }))

    const recapResult = computeRecapCompletionRate(recapChecks, 30)
    recapCompletionPct = recapResult.value
  }

  const coachRecapsMissing = completedSessionIds.filter(id => !sessionsWithNote.has(id)).length

  // Templates
  const { data: templateCheckData } = await rawDb
    .from('templates')
    .select('id, tags, curriculum_level_id')
    .eq('academy_id', academyId)
    .limit(20)
  const typedTemplateRows = (templateCheckData ?? []) as Array<{ id: string; tags: string[] | null; curriculum_level_id: string | null }>
  const classTemplateCount  = typedTemplateRows.filter(t => !(t.tags ?? []).includes('fitness_template:true')).length
  const fitnessTemplateCount = typedTemplateRows.filter(t => (t.tags ?? []).includes('fitness_template:true')).length

  const { data: anySessionData } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .limit(1)
  const sessionsExist = (anySessionData ?? []).length > 0

  // Alert counts
  const missingFocus    = activePl.filter(p => !p.focus_areas || p.focus_areas.length === 0).length
  const reassessmentDue = reassessmentPipeline.filter(
    r => r.urgency === 'overdue' || r.urgency === 'due_soon'
  ).length
  const totalAlerts = missingFocus + attentionCount + reassessmentDue + newRequests + pendingWrapUpsCount

  // Derived KPIs
  const curriculumExecutionPct = activePlayers > 0
    ? Math.round((playersWithLevel / activePlayers) * 100)
    : 0
  const academyHealthPct = activePlayers > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (totalAlerts / Math.max(activePlayers, 1)) * 25)))
    : 85

  // Group summary — capacity signals
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

  // Pending proposed actions
  const { data: pendingActionsRaw } = await rawDb
    .from('v_pending_proposed_actions')
    .select('action_id, action_label, expires_at, risk_level')
    .eq('academy_id', academyId)
    .limit(10)
  const pendingActionsRows = (pendingActionsRaw ?? []) as Array<{
    action_id: string | null
    action_label: string | null
    expires_at: string | null
    risk_level: string | null
  }>

  // Over-capacity groups
  const overCapacityGroups = groupSummaryRows
    .filter(g =>
      g.group_id !== null &&
      g.group_name !== null &&
      g.player_count !== null &&
      g.max_players !== null &&
      g.player_count > g.max_players,
    )
    .map(g => ({
      id: g.group_id!,
      name: g.group_name!,
      memberCount: g.player_count!,
      maxPlayers: g.max_players,
    }))

  // No-coverage group count
  const sessionGroupIds = new Set(
    (weekSessions ?? []).map(s => s.group_id).filter(Boolean) as string[],
  )
  const noCoverageGroupCount = groupSummaryRows.filter(
    g => g.group_id !== null && !sessionGroupIds.has(g.group_id),
  ).length

  // Curriculum template coverage gap
  const enrolledLevelIds = new Set(typedCurricRows.map(r => r.current_level_id).filter((id): id is string => id != null))
  const templateLevelIds = new Set(
    typedTemplateRows
      .filter(t => !(t.tags ?? []).includes('fitness_template:true') && t.curriculum_level_id != null)
      .map(t => t.curriculum_level_id as string),
  )
  const curriculumTemplateCoverageGapCount = Array.from(enrolledLevelIds).filter(id => !templateLevelIds.has(id)).length

  // Curriculum bottleneck
  let mostBlockedLevelName: string | null = null
  let mostBlockedLevelKey: string | null = null
  let mostBlockedLevelStalledCount = 0
  let mostBlockedLevelAvgCompletion = 0
  let topTaggedConcern: string | null = null
  let topTaggedConcernCount = 0
  try {
    const bottleneck = await loadCurriculumBottleneck(supabase as import('@/lib/types/db').DB, academyId)
    if (bottleneck.levelBottlenecks.length > 0) {
      const top = bottleneck.levelBottlenecks[0]
      mostBlockedLevelName          = top.levelName
      mostBlockedLevelKey           = deriveLevelKeyFromSignal(top.stage, top.levelName)
      mostBlockedLevelStalledCount  = top.stalled
      mostBlockedLevelAvgCompletion = top.avgCompletionPct
    }
    if (bottleneck.topTaggedConcerns.length > 0) {
      topTaggedConcern      = bottleneck.topTaggedConcerns[0].tag
      topTaggedConcernCount = bottleneck.topTaggedConcerns[0].count
    }
  } catch { /* non-fatal */ }

  // Academy attention + health reports
  const totalPendingReviews = pendingWrapUpsCount + assessmentsNeedingReview + activePlacementReviews
  const hasPlayers    = activePlayers > 0
  const hasTemplates  = classTemplateCount > 0
  const hasCurriculumGaps = curricGapCount > 0
  const onboardingReadinessLevel: 'not_started' | 'partial' | 'nearly_ready' | 'ready_signal' | 'unknown' =
    activePlayers === 0 && classTemplateCount === 0 ? 'not_started' :
    activePlayers === 0 || classTemplateCount === 0 ? 'partial' :
    !sessionsExist ? 'nearly_ready' :
    'ready_signal'

  const cooAttentionCtx = buildDashboardAttentionContext({
    missingWrapUps:                    coachRecapsMissing,
    highRiskPlayerCount:               attentionCount,
    pendingReviews:                    totalPendingReviews,
    attendanceExceptions:              pendingWrapUpsCount,
    advancementEligibleCount:          advancementReadyCount,
    playerProgressStallCount:          stalledPlayerCount,
    curriculumGapCount:                curricGapCount,
    curriculumDraftCount:              pendingSuggestionsCount,
    reassessmentDueCount:              reassessmentDue,
    sessionsThisWeek,
    isLive:                            sessionsExist && activePlayers > 0 && playersWithLevel > 0,
    mostBlockedLevelName,
    mostBlockedLevelKey,
    mostBlockedLevelStalledCount,
    mostBlockedLevelAvgCompletion,
    topTaggedConcern,
    oldestPendingReviewAgeDays,
    onboardingReadinessLevel,
    hasPlayers,
    hasTemplates,
    hasCurriculumGaps,
    curriculumTemplateCoverageGapCount,
    topTaggedConcernCount,
    playerProgressStalls,
  })
  const cooAttentionReport  = buildAcademyAttentionReport(cooAttentionCtx)
  const academyHealthReport = buildAcademyHealthReport(cooAttentionCtx)

  // Build attention queue for ImmediateAttentionFeed
  const attentionQueueInput: AttentionQueueInput = {
    pendingApprovals: [
      ...pendingActionsRows
        .filter(a => a.action_id !== null)
        .map(a => ({
          id: a.action_id!,
          actionLabel: a.action_label ?? 'Pending action requiring review',
          riskLevel: a.risk_level ?? null,
          expiresAt: a.expires_at ?? null,
          entityLabel: null,
        })),
      ...(pendingActionsRows.length === 0 && pendingWrapUpsCount > 0 ? [{
        id: 'pending-wrap-ups-fallback',
        actionLabel: `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''} awaiting review`,
        riskLevel: 'medium',
        expiresAt: null,
        entityLabel: null,
      }] : []),
      ...(newRequests > 0 ? [{
        id: 'lesson-requests',
        actionLabel: `${newRequests} lesson request${newRequests !== 1 ? 's' : ''} need review`,
        riskLevel: 'medium',
        expiresAt: null,
        entityLabel: null,
      }] : []),
      ...(reassessmentDue > 0 ? [{
        id: 'reassessment-due',
        actionLabel: `${reassessmentDue} player${reassessmentDue !== 1 ? 's' : ''} overdue for reassessment`,
        riskLevel: 'high',
        expiresAt: null,
        entityLabel: null,
      }] : []),
      ...(pendingCount > 0 ? [{
        id: 'pending-placement',
        actionLabel: `${pendingCount} player${pendingCount !== 1 ? 's' : ''} awaiting curriculum placement`,
        riskLevel: 'low',
        expiresAt: null,
        entityLabel: null,
      }] : []),
    ],
    highAlerts: priorityQueue.map(item => ({
      signalId:   item.player_id ?? null,
      playerId:   item.player_id ?? null,
      playerName: item.full_name ?? null,
      title:      item.primary_action ?? null,
      severity:   item.urgency === 'immediate' ? 'critical'
                : (item.urgency === 'urgent' || item.urgency === 'high') ? 'high'
                : 'medium',
    })),
    overCapacityGroups,
    curriculumGapCount: curricGapCount,
    noCoverageGroupCount,
  }
  const attentionQueue = buildAttentionQueue(attentionQueueInput)

  // ── DONNA Morning Brief content ────────────────────────────────

  // Greetings
  const hour = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Brief line derivation (decision tree per spec)
  const constitutionTotal =
    attentionCount + pendingCount + assessmentsNeedingReview +
    reassessmentDue + parentUpdatesPendingApproval + coachRecapsMissing + activePlacementReviews

  let briefLine1: string
  let briefLine2: string = ''
  let briefUrgency: 'normal' | 'urgent' = 'normal'
  let briefCtaLabel: string | undefined
  let briefCtaHref: string | undefined

  if (constitutionTotal === 0 && activePlayers === 0) {
    briefLine1 = "Start by adding players and assigning curriculum levels — then I can surface what needs attention."
    briefCtaLabel = 'Add Players'
    briefCtaHref  = '/director/players'
  } else if (cooAttentionReport.topAction) {
    briefLine1 = cooAttentionReport.topAction.label
    briefLine2 = cooAttentionReport.topAction.bestNextAction ?? cooAttentionReport.allItems[1]?.label ?? ''
    const sev  = cooAttentionReport.topAction.severity
    briefUrgency = sev === 'critical' || sev === 'high' ? 'urgent' : 'normal'
    if (cooAttentionReport.topAction.href) {
      briefCtaLabel = 'Review'
      briefCtaHref  = cooAttentionReport.topAction.href
    }
  } else if (academyHealthReport.topIssue) {
    briefLine1 = academyHealthReport.topIssue
    const s    = academyHealthReport.overallStatus
    briefUrgency = s === 'critical' || s === 'action_needed' ? 'urgent' : 'normal'
    if (academyHealthReport.recommendedRoute) {
      briefCtaLabel = 'Review'
      briefCtaHref  = academyHealthReport.recommendedRoute
    }
  } else if (constitutionTotal === 0) {
    briefLine1 = `${activePlayers} active player${activePlayers !== 1 ? 's' : ''}. No urgent items today — academy is running smoothly.`
  } else {
    const parts: string[] = []
    if (attentionCount > 0)             parts.push(`${attentionCount} player${attentionCount !== 1 ? 's' : ''} need attention`)
    if (pendingCount > 0)               parts.push(`${pendingCount} pending onboarding`)
    if (assessmentsNeedingReview > 0)   parts.push(`${assessmentsNeedingReview} assessment${assessmentsNeedingReview !== 1 ? 's' : ''} to review`)
    if (reassessmentDue > 0)            parts.push(`${reassessmentDue} player${reassessmentDue !== 1 ? 's' : ''} due for reassessment`)
    if (coachRecapsMissing > 0)         parts.push(`${coachRecapsMissing} recap${coachRecapsMissing !== 1 ? 's' : ''} missing`)
    briefLine1 = parts.slice(0, 3).join(', ') + (parts.length > 3 ? `, and ${parts.length - 3} more.` : '.')
    if (constitutionTotal > 5) briefUrgency = 'urgent'
    briefCtaLabel = 'Review Queue'
    briefCtaHref  = '/director/review'
  }

  // ── Development Watch List — derive 3 buckets ──────────────────

  // Moving fast: advancement-eligible or positive score delta
  const curricStateById = new Map(typedCurricRows.map(r => [r.player_id, r]))

  const movingFast: WatchPlayer[] = activePl
    .filter(p => {
      if (!p.player_id) return false
      const cs = curricStateById.get(p.player_id)
      return cs?.advancement_eligible === true || (p.score_delta !== null && (p.score_delta ?? 0) > 0)
    })
    .sort((a, b) => {
      const aAdv = curricStateById.get(a.player_id ?? '')?.advancement_eligible === true ? 2 : 0
      const bAdv = curricStateById.get(b.player_id ?? '')?.advancement_eligible === true ? 2 : 0
      return (bAdv + (b.score_delta ?? 0)) - (aAdv + (a.score_delta ?? 0))
    })
    .slice(0, 3)
    .map(p => {
      const cs = curricStateById.get(p.player_id ?? '')
      const isAdv = cs?.advancement_eligible === true
      return {
        playerId:        p.player_id ?? '',
        name:            p.full_name ?? 'Unknown',
        levelLabel:      p.level_label ?? null,
        signal:          isAdv
          ? 'Advancement-eligible — meets all gate criteria. Ready to move up.'
          : `Score improved ${(p.score_delta ?? 0) > 0 ? '+' : ''}${p.score_delta ?? 0} — progressing well.`,
        href:            `/director/players/${p.player_id}`,
        confidence:      isAdv ? 'high' as const : 'medium' as const,
        evidenceSummary: isAdv
          ? 'Based on gate completion records'
          : 'Based on recent assessment score delta',
      }
    })

  // Needs support: on_hold, reassessment_due, or high-severity stall
  const stallById = new Map(playerProgressStalls.map(s => [s.playerId, s]))
  const stalledPlayerIds = new Set(stalledRows.map(r => r.player_id))

  const needsSupportRaw = activePl.filter(p =>
    p.player_id !== null && (
      p.player_status === 'on_hold' ||
      p.player_status === 'reassessment_due' ||
      stalledPlayerIds.has(p.player_id!)
    )
  )

  const needsSupport: WatchPlayer[] = needsSupportRaw.slice(0, 3).map(p => {
    const stall = stallById.get(p.player_id ?? '')
    const isOnHold         = p.player_status === 'on_hold'
    const isReassessment   = p.player_status === 'reassessment_due'
    return {
      playerId:        p.player_id ?? '',
      name:            p.full_name ?? 'Unknown',
      levelLabel:      p.level_label ?? null,
      signal:          isOnHold
        ? 'On hold — needs director review before returning to program.'
        : isReassessment
          ? 'Reassessment overdue — hasn\'t been evaluated recently.'
          : stall
            ? `Stalled ${stall.daysAtCurrentLevel} days at this level — gate review may help.`
            : 'Needs attention.',
      href:            `/director/players/${p.player_id}`,
      confidence:      (isOnHold || isReassessment) ? 'high' as const : 'medium' as const,
      evidenceSummary: (isOnHold || isReassessment)
        ? 'Based on player status record'
        : stall
          ? `Based on ${stall.daysAtCurrentLevel}-day enrollment and gate records`
          : 'Based on player status',
    }
  })

  // Watch closely: pending placement (new players not yet placed)
  const watchClosely: WatchPlayer[] = players
    .filter(p => isPending(p.player_status) && p.player_id != null)
    .slice(0, 3)
    .map(p => ({
      playerId:        p.player_id!,
      name:            p.full_name ?? 'Unknown',
      levelLabel:      null,
      signal:          'Awaiting curriculum placement — cannot join a group until placed.',
      href:            `/director/players/${p.player_id}`,
      confidence:      'high' as const,
      evidenceSummary: 'Based on player onboarding status',
    }))

  // ── Expected attendance — today's groups ──────────────────────

  const todayGroupIds = new Set(
    todaySessions.map(s => s.group_id).filter(Boolean) as string[]
  )
  const expectedAttendance = groupSummaryRows
    .filter(g => g.group_id !== null && todayGroupIds.has(g.group_id!))
    .reduce((sum, g) => sum + (g.player_count ?? 0), 0)

  // ── Program health confidence ─────────────────────────────────

  const programHealthSignal = cooAttentionReport.topAction?.label ?? academyHealthReport.topIssue ?? null
  const programHealthConf = activePlayers >= 10
    ? factualConfidence(`Based on ${activePlayers} active player records and ${sessionsThisWeek} sessions this week`)
    : inferredConfidence(`Based on ${activePlayers} player records — signal will strengthen as the academy grows`)

  // ── Academy live state ────────────────────────────────────────

  const isAcademyLive = players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist

  // ── Prepared count for morning brief ─────────────────────────

  const preparedCount = pendingSuggestionsCount

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Section 1 — DONNA Morning Brief */}
      <DonnaMorningBrief
        directorName={directorDisplayName}
        academyName={academyName}
        today={today}
        timeGreeting={timeGreeting}
        healthPct={academyHealthPct}
        line1={briefLine1}
        line2={briefLine2}
        urgency={briefUrgency}
        decisionsCount={totalPendingReviews}
        preparedCount={preparedCount}
        ctaLabel={briefCtaLabel}
        ctaHref={briefCtaHref}
      />

      {/* Section 2 — Immediate Attention */}
      <ImmediateAttentionFeed items={attentionQueue.items} />

      {/* Section 3 — Today's Operations */}
      <TodayOperationsPanel
        todaySessions={todaySessions as Array<{ id: string; name: string | null; scheduled_date: string; status: string; coach_id: string | null; group_id: string | null }>}
        expectedAttendance={expectedAttendance}
        coachCoverageGaps={coachCoverageGaps}
        overCapacityGroups={overCapacityGroups}
        assessmentsDue={reassessmentDue}
        parentUpdatesPending={parentUpdatesPendingApproval}
      />

      {/* Section 4 — Development Watch List */}
      <DevelopmentWatchList
        movingFast={movingFast}
        needsSupport={needsSupport}
        watchClosely={watchClosely}
      />

      {/* Section 5 — Director Decisions Queue */}
      <DirectorDecisionsQueue
        wrapUpsCount={pendingWrapUpsCount}
        assessmentsCount={assessmentsNeedingReview}
        placementReviewsCount={activePlacementReviews}
        lessonRequestsCount={newRequests}
        totalCount={totalPendingReviews + newRequests}
        oldestPendingAgeDays={oldestPendingReviewAgeDays}
      />

      {/* Section 6 — Program Health */}
      <ProgramHealthNarrative
        healthPct={academyHealthPct}
        activePlayers={activePlayers}
        sessionsThisWeek={sessionsThisWeek}
        improvingCount={improvingCount}
        groups={groupSummaryRows.map(g => ({
          group_name:   g.group_name,
          player_count: g.player_count,
          max_players:  g.max_players,
        }))}
        overCapacityCount={overCapacityGroups.length}
        advancementReadyCount={advancementReadyCount}
        topSignal={programHealthSignal}
        confidence={programHealthConf.confidence}
        evidenceSummary={programHealthConf.evidenceSummary}
      />

      {/* Section 7 — Academy Intelligence */}
      <AcademyIntelligenceSection
        advancementReadyCount={advancementReadyCount}
        pendingCount={pendingCount}
        mostBlockedLevelName={mostBlockedLevelName}
        mostBlockedLevelStalledCount={mostBlockedLevelStalledCount}
        mostBlockedLevelAvgCompletion={mostBlockedLevelAvgCompletion}
        curriculumTemplateCoverageGapCount={curriculumTemplateCoverageGapCount}
        overCapacityGroups={overCapacityGroups}
        recapCompletionPct={recapCompletionPct}
        completedSessionCount={completedSessionIds.length}
        activePlayers={activePlayers}
      />

      {/* Section 8 — DONNA Recommended Actions */}
      <DonnaRecommendedActions
        suggestions={pendingSuggestions}
        curricGapCount={curricGapCount}
        stalledPlayerCount={stalledPlayerCount}
        advancementReadyCount={advancementReadyCount}
      />

      {/* ── Academy Setup — bottom only when incomplete ────────── */}
      {!isAcademyLive && (
        <div
          className="space-y-4 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <p className="label-xs">Academy Setup</p>
            <p className="text-xs text-text-muted mt-1">
              Complete these steps to activate your academy.
            </p>
          </div>
          {hasAcademyDna && <DirectorDnaStatusBadge savedAt={dnaSavedAt} />}
          <DirectorContinueSetupPanel
            playersExist={players.length > 0}
            classTemplatesExist={classTemplateCount > 0}
            fitnessTemplatesExist={fitnessTemplateCount > 0}
          />
        </div>
      )}

    </div>
  )
}

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { getReassessmentPipeline } from '@/lib/backend/dashboard'
import { computeRecapCompletionRate, type RecapCheckRow } from '@/lib/kpi/coachExecutionKpiEngine'
import { buildTodayBrief } from '@/lib/donna/today/todayBriefEngine'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'

import { TodaySetupCard }      from './_components/TodaySetupCard'
import { TodayHealthCard }     from './_components/TodayHealthCard'
import { TodayPrioritiesCard } from './_components/TodayPrioritiesCard'
import { TodayRisksCard }      from './_components/TodayRisksCard'
import { TodayDecisionsCard }  from './_components/TodayDecisionsCard'
import { TodayDonnaPromptsCard } from './_components/TodayDonnaPromptsCard'

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPending(status: string | null): boolean {
  return (
    status === 'pending_placement' ||
    status === 'placement_in_progress' ||
    status === 'pending_approval'
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

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

  const players             = await getPlayerSummaries(supabase, academyId)
  const reassessmentPipeline = await getReassessmentPipeline(supabase, academyId)

  // Player counts
  const activePl      = players.filter(p => p.player_status === 'active')
  const activePlayers = activePl.length
  const pendingCount  = players.filter(p => isPending(p.player_status)).length
  const attentionCount = players.filter(
    p => p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length

  // Sessions — this week
  const now       = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, scheduled_date, status, coach_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', weekEndStr)

  const todayStr      = now.toISOString().split('T')[0]
  const todaySessions = (weekSessions ?? []).filter(s => s.scheduled_date === todayStr)

  // Onboarding settings
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

  // AI Suggestions (curriculum gaps)
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

  // Stalled players (enrolled > 180 days, not advancement-eligible)
  const now180dAgo = new Date()
  now180dAgo.setDate(now180dAgo.getDate() - 180)
  const stalledRows = typedCurricRows.filter(r =>
    r.enrolled_at !== null &&
    new Date(r.enrolled_at) <= now180dAgo &&
    r.advancement_eligible !== true,
  )
  const stalledPlayerCount = stalledRows.length

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

  // Unassigned players (no primary_coach_id)
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

  // Mandatory onboarding gate — redirect new academies that haven't completed setup
  if (!hasOnboardingComplete && !isAcademyLive) {
    redirect('/onboarding')
  }

  // ── Today brief ────────────────────────────────────────────────────────────────
  const brief = buildTodayBrief({
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

  // ── Greeting ────────────────────────────────────────────────────────────────────
  const hour         = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel   = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4 animate-fade-in">

      {/* Header — greeting + academy name + date */}
      <div className="space-y-0.5">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted leading-none">
          {todayLabel}
        </p>
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight">
          {timeGreeting}{directorDisplayName ? `, ${directorDisplayName}` : ''}.
        </h1>
        <p className="text-xs text-text-muted">{academyName}</p>
      </div>

      {/* ── Setup mode ─────────────────────────────────────────────────────────── */}
      {brief.setupMode && (
        <TodaySetupCard steps={brief.setupSteps} />
      )}

      {/* ── Academy Health ─────────────────────────────────────────────────────── */}
      {!brief.setupMode && brief.academyHealth && (
        <TodayHealthCard health={brief.academyHealth} />
      )}

      {/* ── Top 3 Priorities ──────────────────────────────────────────────────── */}
      {!brief.setupMode && (
        <TodayPrioritiesCard priorities={brief.topPriorities} />
      )}

      {/* ── Top 3 Risks ───────────────────────────────────────────────────────── */}
      {!brief.setupMode && (
        <TodayRisksCard risks={brief.topRisks} />
      )}

      {/* ── Decisions Needed ──────────────────────────────────────────────────── */}
      <TodayDecisionsCard
        decisions={brief.decisionsNeeded}
        totalPendingReviews={totalPendingReviews + newRequests}
      />

      {/* ── Ask DONNA ─────────────────────────────────────────────────────────── */}
      <TodayDonnaPromptsCard prompts={brief.suggestedPrompts} />

    </div>
  )
}

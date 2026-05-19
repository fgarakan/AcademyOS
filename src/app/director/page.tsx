import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Users, Calendar, ChevronRight, Activity,
  Clock, Brain, AlertTriangle,
  GraduationCap, Sparkles, ClipboardList,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { getAcademyPriorityQueue, getReassessmentPipeline } from '@/lib/backend/dashboard'
import {
  Card, CardHeader, CardContent, CardFooter,
  EmptyState, Avatar, StatusBadge,
} from '@/components/ui'
import { urgencyToLabel } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { SetupProgressChecklist } from '@/components/onboarding/SetupProgressChecklist'
import { NextBestActionCard } from '@/components/onboarding/NextBestActionCard'
import { OnboardingProgressCard } from './OnboardingProgressCard'
import { AcademyKpiCardsSection } from './_components/AcademyKpiCardsSection'
import { DonnaExecutiveCard, type DonnaExecutivePriorityItem } from './_components/DonnaExecutiveCard'
import { AcademyHealthBadgeWithDrawer } from './_components/AcademyHealthBreakdown'
import { DirectorContinueSetupPanel } from '@/components/director/DirectorContinueSetupPanel'
import { DirectorDnaStatusBadge } from './_components/DirectorDnaStatusBadge'

// ── Helpers ────────────────────────────────────────────────────

function isPending(status: string | null): boolean {
  return (
    status === 'pending_placement' ||
    status === 'placement_in_progress' ||
    status === 'pending_approval'
  )
}

type BadgeStatus =
  | 'action_needed' | 'needs_attention' | 'check_in'
  | 'on_track' | 'complete' | 'building' | 'warning' | 'info'

function pendingStatusBadge(status: string | null): { status: BadgeStatus; label: string } {
  switch (status) {
    case 'pending_placement':     return { status: 'building',  label: 'Pending placement' }
    case 'placement_in_progress': return { status: 'building',  label: 'In progress' }
    case 'pending_approval':      return { status: 'check_in',  label: 'Pending approval' }
    default:                      return { status: 'building',  label: 'Pending' }
  }
}

function urgencyBadgeClass(urgency: string | null): string {
  switch (urgency) {
    case 'immediate': return 'bg-status-red/15 text-status-red border border-status-red/30'
    case 'urgent':    return 'bg-status-orange/15 text-status-orange border border-status-orange/30'
    case 'high':      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
    default:          return 'bg-surface-raised text-text-muted border border-border'
  }
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
  const directorDisplayName: string = profile?.display_name ?? 'Director'

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const { data: academy } = await supabase
    .from('academies')
    .select('name')
    .eq('id', academyId)
    .single()

  const academyName = academy?.name ?? 'Your Academy'

  const players = await getPlayerSummaries(supabase, academyId)
  const priorityQueue = await getAcademyPriorityQueue(supabase, academyId, { limit: 5 })
  const reassessmentPipeline = await getReassessmentPipeline(supabase, academyId)

  // Player counts
  const activePlayers   = players.filter(p => p.player_status === 'active').length
  const pendingCount    = players.filter(p => isPending(p.player_status)).length
  const attentionCount  = players.filter(
    p => p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length
  const pendingList     = players.filter(p => isPending(p.player_status)).slice(0, 5)

  // Academy improvement
  const activePl = players.filter(p => p.player_status === 'active')
  const withDelta = activePl.filter(p => p.score_delta !== null && p.score_delta !== undefined)
  const improvingCount = withDelta.filter(p => (p.score_delta ?? 0) > 0).length

  // Sessions this week
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, status, coach_id, group_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', weekEndStr)

  const sessionsThisWeek = (weekSessions ?? []).length

  // Onboarding settings
  const { data: academyWithSettings } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()
  const onboardingSettings = (academyWithSettings?.settings as Record<string, unknown>) ?? {}
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

  // AI Suggestions pending count
  const { data: suggestionCountData } = await rawDb
    .from('academy_suggestions')
    .select('priority')
    .eq('academy_id', academyId)
    .eq('status', 'pending')
  const pendingSuggestions = (suggestionCountData ?? []) as Array<{ priority: string }>
  const pendingSuggestionsCount = pendingSuggestions.length
  const highPrioritySuggestionsCount = pendingSuggestions.filter(s => s.priority === 'high').length

  // Curriculum coverage
  const { data: curricStateRows } = await rawDb
    .from('player_curriculum_states')
    .select('player_id')
    .eq('academy_id', academyId)
  const playersWithLevel = (curricStateRows ?? []).length
  const playersWithoutLevel = Math.max(0, activePlayers - playersWithLevel)

  const { data: curricGapData } = await rawDb
    .from('academy_suggestions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('status', 'pending')
    .eq('suggestion_type', 'curriculum_gap')
  const curricGapCount = (curricGapData ?? []).length

  // Advancement-ready count
  const { data: advancementReadyData } = await rawDb
    .from('player_curriculum_states')
    .select('player_id')
    .eq('academy_id', academyId)
    .eq('advancement_eligible', true)
  const advancementReadyCount = (advancementReadyData ?? []).length

  // Pending coach wrap-ups
  const { data: pendingWrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
  const pendingWrapUpsCount = (pendingWrapUpData ?? []).length

  // Checklist
  const { data: templateCheckData } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('academy_id', academyId)
    .limit(20)
  const classTemplateCount = ((templateCheckData ?? []) as Array<{ id: string; tags: string[] | null }>)
    .filter((t) => !(t.tags ?? []).includes('fitness_template:true')).length

  const { data: anySessionData } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .limit(1)
  const sessionsExist = (anySessionData ?? []).length > 0

  // Alert counts
  const missingFocus = activePl.filter(p => !p.focus_areas || p.focus_areas.length === 0).length
  const reassessmentDue = reassessmentPipeline.filter(
    r => r.urgency === 'overdue' || r.urgency === 'due_soon'
  ).length
  const totalAlerts = missingFocus + attentionCount + reassessmentDue + newRequests + pendingWrapUpsCount

  // Derived KPI values — no new DB queries
  const curriculumExecutionPct = activePlayers > 0
    ? Math.round((playersWithLevel / activePlayers) * 100)
    : 0
  // Academy health: inverse of alert ratio, clamped 0–100
  const academyHealthPct = activePlayers > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (totalAlerts / Math.max(activePlayers, 1)) * 25)))
    : 85

  // Greeting
  const hour = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // DONNA executive priority items — built from existing computed data, no new DB calls
  const donnaItems: DonnaExecutivePriorityItem[] = []

  if (pendingWrapUpsCount > 0) {
    donnaItems.push({
      id: 'wrap-ups',
      text: `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''} awaiting your review`,
      actionLabel: 'Review',
      href: '/director/review?tab=wrap-ups',
      variant: 'review',
    })
  }
  if (attentionCount > 0) {
    donnaItems.push({
      id: 'attention',
      text: `${attentionCount} player${attentionCount !== 1 ? 's' : ''} on hold or due for reassessment`,
      actionLabel: 'View Players',
      href: '/director/players',
      variant: 'urgent',
    })
  }
  if (pendingCount > 0) {
    donnaItems.push({
      id: 'placement',
      text: `${pendingCount} player${pendingCount !== 1 ? 's' : ''} waiting for curriculum placement`,
      actionLabel: 'Place Players',
      href: '/director/players',
      variant: 'review',
    })
  }
  if (newRequests > 0) {
    donnaItems.push({
      id: 'requests',
      text: `${newRequests} parent lesson request${newRequests !== 1 ? 's' : ''} need your review`,
      actionLabel: 'Open Review',
      href: '/director/review',
      variant: 'review',
    })
  }
  if (playersWithoutLevel > 0) {
    donnaItems.push({
      id: 'curriculum',
      text: `${playersWithoutLevel} active player${playersWithoutLevel !== 1 ? 's' : ''} missing a curriculum level`,
      actionLabel: 'Assign Levels',
      href: '/director/players',
      variant: 'info',
    })
  }
  if (reassessmentDue > 0 && donnaItems.length < 5) {
    donnaItems.push({
      id: 'reassessment',
      text: `${reassessmentDue} player${reassessmentDue !== 1 ? 's' : ''} overdue for reassessment`,
      actionLabel: 'View',
      href: '/director/players',
      variant: 'review',
    })
  }

  // Academy live state — all 4 setup steps complete
  const isAcademyLive = players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist

  // Highest-priority banner
  const priorityAction: { title: string; body: string; href: string; actionLabel: string } | null = (() => {
    if (pendingWrapUpsCount > 0) return {
      title: `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''} awaiting your review`,
      body: 'Approve or provide feedback before coaches move to their next session.',
      href: '/director/review?tab=wrap-ups',
      actionLabel: 'Review Wrap-Ups',
    }
    if (pendingCount > 0) return {
      title: `${pendingCount} player${pendingCount !== 1 ? 's' : ''} waiting for placement`,
      body: 'Complete placement to activate profiles and assign curriculum levels.',
      href: '/director/players',
      actionLabel: 'Place Players',
    }
    if (attentionCount > 0) return {
      title: `${attentionCount} player${attentionCount !== 1 ? 's' : ''} need attention`,
      body: 'Players on hold or due for reassessment are not progressing.',
      href: '/director/players',
      actionLabel: 'Review Players',
    }
    if (newRequests > 0) return {
      title: `${newRequests} lesson request${newRequests !== 1 ? 's' : ''} awaiting review`,
      body: 'Parent requests need director review and routing.',
      href: '/director/review',
      actionLabel: 'Review Requests',
    }
    return null
  })()

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Hero Header ────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-1">{today}</p>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight leading-tight">
            {timeGreeting}, {directorDisplayName}.
          </h1>
          <p className="text-text-secondary text-base mt-1">{academyName}</p>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <Link
              href="/director/today"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-lime transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Today&apos;s Academy
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/director/review"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Review Queue
              {pendingWrapUpsCount > 0 && (
                <span className="font-mono text-[10px] font-bold text-status-orange bg-status-orange/10 border border-status-orange/30 px-1.5 py-0.5 rounded-full">
                  {pendingWrapUpsCount}
                </span>
              )}
            </Link>
            <Link
              href="/director/donna"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-lime transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              DONNA
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        {/* Academy Health Badge */}
        <AcademyHealthBadgeWithDrawer
          healthPct={academyHealthPct}
          activePlayers={activePlayers}
          pendingWrapUpsCount={pendingWrapUpsCount}
          attentionCount={attentionCount}
          reassessmentDueCount={reassessmentDue}
          missingFocusCount={missingFocus}
          newRequestsCount={newRequests}
          pendingCount={pendingCount}
          playersWithoutLevel={playersWithoutLevel}
          curricGapCount={curricGapCount}
          highPrioritySuggestionsCount={highPrioritySuggestionsCount}
          pendingSuggestionsCount={pendingSuggestionsCount}
          sessionsThisWeek={sessionsThisWeek}
          improvingCount={improvingCount}
          advancementReadyCount={advancementReadyCount}
        />
      </div>

      {/* ── Post-DNA Continue Setup Panel (client — localStorage driven) ── */}
      <DirectorContinueSetupPanel />

      {/* ── DONNA Executive Attention Card ─────────────────── */}
      <DonnaExecutiveCard items={donnaItems} directorName={directorDisplayName} />

      {/* ── Recommended next action ───────────────────────── */}
      {priorityAction && (
        <NextBestActionCard
          variant="warning"
          title={priorityAction.title}
          body={priorityAction.body}
          actionLabel={priorityAction.actionLabel}
          actionHref={priorityAction.href}
        />
      )}

      {/* ── Academy Setup ─────────────────────────────────── */}
      {isAcademyLive ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-green/5 border border-status-green/20">
          <Sparkles className="w-4 h-4 text-status-green shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-status-green">Academy OS is live</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Players, curriculum, templates, and sessions are all connected.
            </p>
          </div>
          <Link href="/director/onboarding" className="shrink-0 text-[11px] text-text-muted hover:text-lime transition-colors">
            Setup →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="label-xs">Academy Setup</p>
            <p className="text-xs text-text-muted mt-1">
              {hasAcademyDna
                ? 'Academy DNA is saved. Complete the remaining setup steps to go live.'
                : 'Complete these steps first. Academy OS uses this information to guide curriculum, placement, sessions, and coach workflows.'}
            </p>
          </div>
          {hasAcademyDna && <DirectorDnaStatusBadge savedAt={dnaSavedAt} />}
          <OnboardingProgressCard settings={onboardingSettings} />
          <SetupProgressChecklist
            playersExist={players.length > 0}
            curriculumLevelsAssigned={playersWithLevel > 0}
            templatesExist={classTemplateCount > 0}
            sessionsExist={sessionsExist}
          />
        </div>
      )}

      {/* ── Academy Overview — 8-card KPI grid ────────────── */}
      <AcademyKpiCardsSection
        sessionsToday={sessionsThisWeek}
        attendanceExceptions={pendingWrapUpsCount}
        coachRecaps={pendingWrapUpsCount}
        levelUpCandidates={advancementReadyCount}
        parentUpdates={newRequests}
        academyHealthPct={academyHealthPct}
        curriculumExecution={curriculumExecutionPct}
        playerProgress={improvingCount}
        activePlayers={activePlayers}
      />

      {/* ── Health Chart + Live Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <AcademyHealthChartCard healthPct={academyHealthPct} totalAlerts={totalAlerts} />
        <LiveActivityCard sessions={weekSessions ?? []} pendingWrapUps={pendingWrapUpsCount} pendingPlacements={pendingCount} />
      </div>

      {/* ── Player Activity ────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <p className="label-xs">Player Activity</p>
          <p className="text-xs text-text-muted mt-1">Once players are added and placed, this section shows who needs placement, reassessment, or director attention.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Priority Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">Priority Queue</h2>
                  <p className="text-xs text-text-muted mt-0.5">Players requiring immediate attention</p>
                </div>
                {priorityQueue.length > 0 && (
                  <span className="font-mono text-lime text-xl font-bold leading-none">
                    {priorityQueue.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {priorityQueue.length === 0 ? (
                <EmptyState
                  icon={<Activity className="w-5 h-5" />}
                  title="No urgent actions"
                  description={players.length === 0 ? "Add players to start tracking priority actions, reassessments, and development needs." : "The academy is on track. Priority items appear when players need attention or reassessment."}
                  className="py-10"
                />
              ) : (
                <ul className="space-y-1">
                  {priorityQueue.map(item => {
                    if (!item.player_id) return null
                    const { label } = urgencyToLabel(item.urgency)
                    return (
                      <li key={item.player_id}>
                        <Link
                          href={`/director/players/${item.player_id}`}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors group"
                        >
                          <Avatar name={item.full_name ?? '?'} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-text-primary truncate">
                                {item.full_name ?? '—'}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${urgencyBadgeClass(item.urgency)}`}>
                                {label}
                              </span>
                            </div>
                            {item.primary_action && (
                              <p className="text-xs text-text-muted mt-0.5 truncate">
                                {item.primary_action}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-1" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
            {priorityQueue.length > 0 && (
              <CardFooter>
                <Link
                  href="/director/players/active"
                  className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
                >
                  View all active players →
                </Link>
              </CardFooter>
            )}
          </Card>

          {/* Pending Placement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">Pending Placement</h2>
                  <p className="text-xs text-text-muted mt-0.5">Players awaiting onboarding completion</p>
                </div>
                {pendingList.length > 0 && (
                  <span className="font-mono text-status-orange text-xl font-bold leading-none">
                    {pendingCount}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingList.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-5 h-5" />}
                  title="No pending placements"
                  description={players.length === 0 ? "No players have been added yet. Add your first player to begin the placement process." : "All players have completed placement. New players will appear here when onboarding."}
                  className="py-10"
                />
              ) : (
                <ul className="space-y-1">
                  {pendingList.map(player => {
                    if (!player.player_id) return null
                    const badge = pendingStatusBadge(player.player_status)
                    return (
                      <li key={player.player_id}>
                        <Link
                          href={`/director/players/${player.player_id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors group"
                        >
                          <Avatar name={player.full_name ?? '?'} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {player.full_name ?? '—'}
                            </p>
                            <StatusBadge status={badge.status} label={badge.label} size="sm" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
            {pendingList.length > 0 && (
              <CardFooter>
                <Link
                  href="/director/players"
                  className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
                >
                  View all players →
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* ── Alerts + Intelligence ────────────────────────── */}
      <div className="space-y-4">
        <div>
          <p className="label-xs">Signals + Intelligence</p>
          <p className="text-xs text-text-muted mt-1">Alerts and AI suggestions appear here once sessions, coach notes, and player activity start producing signals.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <AcademyAlertsPanel
            missingFocusCount={missingFocus}
            attentionCount={attentionCount}
            reassessmentDueCount={reassessmentDue}
            newRequestsCount={newRequests}
            pendingCount={pendingCount}
            pendingWrapUpsCount={pendingWrapUpsCount}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-lime" />
                    AI Suggestions
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Suggested actions for review</p>
                </div>
                {pendingSuggestionsCount > 0 && (
                  <span className="font-mono text-lime text-xl font-bold leading-none">
                    {pendingSuggestionsCount}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingSuggestionsCount === 0 ? (
                <EmptyState
                  icon={<Brain className="w-5 h-5" />}
                  title="No pending suggestions"
                  description="Suggestions are generated automatically from session data, coach notes, and curriculum gaps. They will appear here once your academy has activity."
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-text-secondary">
                      {pendingSuggestionsCount} suggestion{pendingSuggestionsCount !== 1 ? 's' : ''} pending review
                    </span>
                    {highPrioritySuggestionsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-orange/10 border-status-orange/20 text-status-orange">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {highPrioritySuggestionsCount} high priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted px-1">
                    Nothing changes until you review and accept each suggestion.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link
                href="/director/ai-suggestions"
                className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
              >
                {pendingSuggestionsCount > 0 ? 'Review suggestions →' : 'Open AI Suggestions →'}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* ── Curriculum Coverage ───────────────────────────── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-lime" />
            <p className="label-xs">Curriculum Coverage</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link href="/director/players" className="group">
              <div className="bg-surface-raised rounded-xl px-4 py-3 border border-border hover:border-lime/30 transition-colors">
                <p className="font-mono font-bold text-3xl text-lime leading-none">{playersWithLevel}</p>
                <p className="text-xs text-text-secondary mt-1">With curriculum level</p>
              </div>
            </Link>
            <Link href="/director/players" className="group">
              <div className={`bg-surface-raised rounded-xl px-4 py-3 border transition-colors ${playersWithoutLevel > 0 ? 'border-status-orange/30 hover:border-status-orange/50' : 'border-border hover:border-lime/30'}`}>
                <p className={`font-mono font-bold text-3xl leading-none ${playersWithoutLevel > 0 ? 'text-status-orange' : 'text-text-muted'}`}>{playersWithoutLevel}</p>
                <p className="text-xs text-text-secondary mt-1">Missing level</p>
              </div>
            </Link>
            <Link href="/director/signals" className="group hidden sm:block">
              <div className={`bg-surface-raised rounded-xl px-4 py-3 border transition-colors ${curricGapCount > 0 ? 'border-lime/20 hover:border-lime/40' : 'border-border hover:border-lime/30'}`}>
                <p className={`font-mono font-bold text-3xl leading-none ${curricGapCount > 0 ? 'text-lime' : 'text-text-muted'}`}>{curricGapCount}</p>
                <p className="text-xs text-text-secondary mt-1">Curriculum gap suggestions</p>
              </div>
            </Link>
          </div>
          {players.length === 0 && (
            <p className="text-xs text-text-muted mt-3">Add players and assign curriculum levels to see coverage stats here.</p>
          )}
        </CardContent>
      </Card>

      {/* ── First class template prompt ───────────────────── */}
      {classTemplateCount === 0 && players.length > 0 && (
        <NextBestActionCard
          variant="guide"
          title="Create your first class template"
          body="Class templates let you generate curriculum-aligned lesson plans that coaches can run on court."
          actionLabel="New Template"
          actionHref="/director/class-templates/new"
        />
      )}

      {/* ── Sessions this week ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-xs">Sessions This Week</p>
            <p className="text-xs text-text-muted mt-1">Sessions scheduled for the current week. Create sessions from class templates to build your coaching history.</p>
          </div>
          <Link
            href="/director/sessions"
            className="shrink-0 text-xs text-lime hover:opacity-80 font-medium"
          >
            View all →
          </Link>
        </div>
        <Card>
          <CardContent className="py-4">
            {(weekSessions ?? []).length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-5 h-5" />}
                title="No sessions this week"
                description="Sessions appear here once created from a class template. Schedule your first session to get started."
                className="py-6"
              />
            ) : (
              <div className="space-y-1">
                {(weekSessions ?? []).slice(0, 4).map(session => (
                  <Link
                    key={session.id}
                    href={`/director/sessions/${session.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {session.name ?? 'Untitled Session'}
                      </p>
                      <p className="text-xs text-text-muted">{formatDate(session.scheduled_date)}</p>
                    </div>
                    <SessionStatusPill status={session.status} />
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Quick Actions ──────────────────────────── */}
      <div>
        <p className="label-xs mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Calendar className="w-4 h-4 text-lime" />}
            title="View Today's Academy"
            description="Live session feed, attendance, and on-court status."
            href="/director/today"
          />
          <QuickActionCard
            icon={<ClipboardList className="w-4 h-4 text-lime" />}
            title="Session Planning"
            description="Build and manage sessions from class templates."
            href="/director/sessions"
          />
          <QuickActionCard
            icon={<Users className="w-4 h-4 text-lime" />}
            title="Player Profiles"
            description="View and manage your full player roster."
            href="/director/players"
          />
          <QuickActionCard
            icon={<Activity className="w-4 h-4 text-lime" />}
            title="Signals"
            description="Attendance concerns, missing levels, pending reviews, and lesson requests."
            href="/director/signals"
          />
        </div>
      </div>

    </div>
  )
}

// ── Academy Health Chart Card (static SVG) ─────────────────────

function AcademyHealthChartCard({ healthPct, totalAlerts }: { healthPct: number; totalAlerts: number }) {
  // Seven static data points representing the week — derived from healthPct for visual coherence
  const base = Math.max(50, healthPct - 15)
  const points: number[] = [
    base + 5, base + 2, base - 3, base + 4, base + 6, base + 3, healthPct,
  ].map(v => Math.max(10, Math.min(95, v)))

  const w = 260
  const h = 80
  const xs = points.map((_, i) => Math.round((i / (points.length - 1)) * w))
  const ys = points.map(v => Math.round(h - (v / 100) * h))
  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`

  const lineColor = healthPct >= 80 ? '#2dd4bf' : healthPct >= 60 ? '#facc15' : '#FF3B30'

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()
  const labels = dayLabels.map((_, i) => dayLabels[(today - 6 + i + 7) % 7])

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="label-xs">Academy Health This Week</p>
            <p className="text-[11px] text-text-muted mt-0.5">Derived from alert counts and activity signals</p>
          </div>
          <span className="font-mono font-bold text-2xl"
            style={{ color: lineColor }}>
            {healthPct}%
          </span>
        </div>

        {/* Sparkline */}
        <div className="w-full overflow-hidden rounded-lg mb-3" style={{ height: `${h}px` }}>
          <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#healthGrad)" />
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Terminal dot */}
            <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill={lineColor} />
          </svg>
        </div>

        {/* Day labels */}
        <div className="flex justify-between">
          {labels.map((l, i) => (
            <span key={i} className={`text-[10px] font-medium ${i === labels.length - 1 ? 'text-text-secondary' : 'text-text-muted'}`}>
              {l}
            </span>
          ))}
        </div>

        {totalAlerts > 0 && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
            <p className="text-[11px] text-yellow-400">
              {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''} affecting health score —
              <Link href="/director/signals" className="ml-1 underline underline-offset-2">review signals</Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Live Activity Card ──────────────────────────────────────────

interface SessionRow {
  id: string
  name: string | null
  scheduled_date: string
  status: string
  coach_id: string
  group_id: string | null
}

function LiveActivityCard({
  sessions,
  pendingWrapUps,
  pendingPlacements,
}: {
  sessions: SessionRow[]
  pendingWrapUps: number
  pendingPlacements: number
}) {
  interface ActivityItem {
    icon: ReactNode
    text: string
    time: string
    color: string
  }

  const items: ActivityItem[] = []

  sessions.slice(0, 3).forEach(s => {
    const isPast = new Date(s.scheduled_date) < new Date()
    items.push({
      icon: <Calendar className="w-3.5 h-3.5" />,
      text: s.name ?? 'Session',
      time: isPast ? formatDate(s.scheduled_date) : `Upcoming: ${formatDate(s.scheduled_date)}`,
      color: s.status === 'completed' ? '#30D158' : s.status === 'in_progress' ? '#C8FF00' : '#AAAAAA',
    })
  })

  if (pendingWrapUps > 0) {
    items.push({
      icon: <ClipboardList className="w-3.5 h-3.5" />,
      text: `${pendingWrapUps} coach wrap-up${pendingWrapUps !== 1 ? 's' : ''} in review queue`,
      time: 'Needs review',
      color: '#FF9500',
    })
  }

  if (pendingPlacements > 0) {
    items.push({
      icon: <Users className="w-3.5 h-3.5" />,
      text: `${pendingPlacements} player${pendingPlacements !== 1 ? 's' : ''} pending placement`,
      time: 'Awaiting action',
      color: '#FF9500',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime animate-pulse shrink-0" />
          <h2 className="font-semibold text-text-primary text-sm">Live Activity</h2>
        </div>
        <p className="text-xs text-text-muted mt-0.5">Recent operational events</p>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-5 h-5" />}
            title="No recent activity"
            description="Activity appears here as sessions run and coaches submit recaps."
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5" style={{ color: item.color }}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{item.text}</p>
                  <p className="text-[10px] text-text-muted">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/director/today" className="text-xs text-lime hover:opacity-80 font-medium">
          View today's academy →
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── Quick Action Cards ──────────────────────────────────────────

function QuickActionCard({
  icon, title, description, href,
}: {
  icon: ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-surface border border-lime/15 rounded-2xl p-5 h-full hover:border-lime/30 hover:shadow-cyan transition-all duration-150">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
        <p className="text-lime text-xs font-medium mt-3 group-hover:translate-x-0.5 transition-transform">
          Open →
        </p>
      </div>
    </Link>
  )
}

// ── Academy Alerts Panel ────────────────────────────────────────

function AcademyAlertsPanel({
  missingFocusCount,
  attentionCount,
  reassessmentDueCount,
  newRequestsCount,
  pendingCount,
  pendingWrapUpsCount,
}: {
  missingFocusCount: number
  attentionCount: number
  reassessmentDueCount: number
  newRequestsCount: number
  pendingCount: number
  pendingWrapUpsCount: number
}) {
  type Severity = 'high' | 'medium' | 'low'

  interface AlertItem {
    severity: Severity
    title: string
    why: string
    href: string
    count: number
  }

  const alerts: AlertItem[] = [
    missingFocusCount > 0 && {
      severity: 'medium' as Severity,
      title: `${missingFocusCount} player${missingFocusCount !== 1 ? 's' : ''} missing current focus`,
      why: 'Players without focus areas cannot receive targeted coaching.',
      href: '/director/players',
      count: missingFocusCount,
    },
    attentionCount > 0 && {
      severity: 'high' as Severity,
      title: `${attentionCount} player${attentionCount !== 1 ? 's' : ''} needing attention`,
      why: 'Players on hold or due for reassessment are not progressing.',
      href: '/director/players',
      count: attentionCount,
    },
    reassessmentDueCount > 0 && {
      severity: 'high' as Severity,
      title: `${reassessmentDueCount} player${reassessmentDueCount !== 1 ? 's' : ''} due for reassessment`,
      why: 'Overdue reassessments delay curriculum progression.',
      href: '/director/players',
      count: reassessmentDueCount,
    },
    pendingWrapUpsCount > 0 && {
      severity: 'medium' as Severity,
      title: `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''} awaiting review`,
      why: 'Coach session wrap-ups are in the review queue and have not been approved.',
      href: '/director/review?tab=wrap-ups',
      count: pendingWrapUpsCount,
    },
    newRequestsCount > 0 && {
      severity: 'medium' as Severity,
      title: `${newRequestsCount} private lesson request${newRequestsCount !== 1 ? 's' : ''} waiting`,
      why: 'Parent requests need director review and routing.',
      href: '/director/review',
      count: newRequestsCount,
    },
    pendingCount > 0 && {
      severity: 'low' as Severity,
      title: `${pendingCount} player${pendingCount !== 1 ? 's' : ''} pending placement`,
      why: 'New players cannot join groups until placement is complete.',
      href: '/director/players',
      count: pendingCount,
    },
  ].filter(Boolean) as AlertItem[]

  const sevColor: Record<Severity, string> = {
    high:   'bg-status-red/10 border-status-red/20 text-status-red',
    medium: 'bg-status-orange/10 border-status-orange/20 text-status-orange',
    low:    'bg-surface-raised border-border text-text-muted',
  }
  const sevLabel: Record<Severity, string> = {
    high: 'Urgent', medium: 'Review', low: 'Info',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text-primary">Academy Alerts</h2>
            <p className="text-xs text-text-muted mt-0.5">Items that need director attention</p>
          </div>
          {alerts.length > 0 && (
            <span className="font-mono text-status-orange text-xl font-bold leading-none">
              {alerts.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-5 h-5" />}
            title="All clear"
            description="No alerts at this time. Alerts appear when players miss sessions, are due for reassessment, or need coaching focus updates."
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Link key={i} href={alert.href} className="block group">
                <div className="flex items-start gap-3 px-3 py-3 rounded-xl border border-transparent hover:bg-surface-raised hover:border-border transition-all">
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevColor[alert.severity]}`}>
                    {sevLabel[alert.severity]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{alert.why}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/director/signals"
          className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
        >
          View all signals →
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── Session Status Pill ─────────────────────────────────────────

function SessionStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned:     'bg-surface-raised text-text-muted border-border',
    in_progress: 'bg-lime/10 text-lime border-lime/30',
    completed:   'bg-status-green/10 text-status-green border-status-green/30',
    cancelled:   'bg-status-red/10 text-status-red border-status-red/30',
  }
  const label: Record<string, string> = {
    planned: 'Planned', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled',
  }
  return (
    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] ?? styles.planned}`}>
      {label[status] ?? status}
    </span>
  )
}

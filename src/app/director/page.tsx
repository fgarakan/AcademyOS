import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, Calendar, ChevronRight, Activity,
  Clock, Mic, Brain, AlertTriangle, TrendingUp,
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId: string | null = profile?.academy_id ?? null

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

  // Academy improvement: average score_delta for active players
  const activePl = players.filter(p => p.player_status === 'active')
  const withDelta = activePl.filter(p => p.score_delta !== null && p.score_delta !== undefined)
  const improvingCount = withDelta.filter(p => (p.score_delta ?? 0) > 0).length
  const avgDelta = withDelta.length > 0
    ? Math.round(withDelta.reduce((s, p) => s + (p.score_delta ?? 0), 0) / withDelta.length * 10) / 10
    : null

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

  // Private lesson requests — rawDb cast since table may not be in generated types yet
  const rawDb = supabase as any
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

  // Pending coach wrap-ups awaiting director review
  const { data: pendingWrapUpData } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')
  const pendingWrapUpsCount = (pendingWrapUpData ?? []).length

  // Checklist: class template count (non-fitness)
  const { data: templateCheckData } = await rawDb
    .from('templates')
    .select('id, tags')
    .eq('academy_id', academyId)
    .limit(20)
  const classTemplateCount = ((templateCheckData ?? []) as Array<{ id: string; tags: string[] | null }>)
    .filter((t) => !(t.tags ?? []).includes('fitness_template:true')).length

  // Checklist: any session ever created
  const { data: anySessionData } = await supabase
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .limit(1)
  const sessionsExist = (anySessionData ?? []).length > 0

  // Deterministic alert count
  const missingFocus = activePl.filter(p => !p.focus_areas || p.focus_areas.length === 0).length
  const reassessmentDue = reassessmentPipeline.filter(
    r => r.urgency === 'overdue' || r.urgency === 'due_soon'
  ).length
  const totalAlerts = missingFocus + attentionCount + reassessmentDue + newRequests + pendingWrapUpsCount

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">{academyName}</p>
          <h1 className="page-title text-3xl">Command Center</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <Link href="/director/players" className="btn-lime text-sm hidden sm:inline-flex items-center gap-2">
          <Users className="w-4 h-4" />
          Players
        </Link>
      </div>

      {/* ── Setup Checklist ───────────────────────────────── */}
      <SetupProgressChecklist
        playersExist={players.length > 0}
        curriculumLevelsAssigned={playersWithLevel > 0}
        templatesExist={classTemplateCount > 0}
        sessionsExist={sessionsExist}
      />

      {/* ── Setup Complete Banner ─────────────────────────── */}
      {players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-green/5 border border-status-green/20">
          <Sparkles className="w-4 h-4 text-status-green shrink-0" />
          <div>
            <p className="text-sm font-semibold text-status-green">Academy OS is live</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Players, curriculum, templates, and sessions are all connected. Coaches have everything they need on court.
            </p>
          </div>
        </div>
      )}

      {/* ── Today's Priorities ────────────────────────────── */}
      <div>
        <p className="label-xs mb-4">Today's Priorities</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <CommandCard
            label="Active Players"
            value={activePlayers}
            sublabel="Currently training"
            href="/director/players"
            accentColor="lime"
            icon={<Users className="w-4 h-4" />}
          />
          <CommandCard
            label="Academy Improvement"
            value={avgDelta !== null ? (avgDelta > 0 ? `+${avgDelta}` : String(avgDelta)) : '—'}
            sublabel={withDelta.length > 0 ? `${improvingCount} of ${activePlayers} improving` : 'No assessment data yet'}
            href="/director/players"
            accentColor={avgDelta !== null && avgDelta > 0 ? 'green' : 'default'}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <CommandCard
            label="Sessions"
            value={sessionsThisWeek}
            sublabel="This week"
            href="/director/sessions"
            accentColor="lime"
            icon={<Calendar className="w-4 h-4" />}
          />
          <CommandCard
            label="Lesson Requests"
            value={newRequests}
            sublabel={newRequests === 1 ? '1 new request' : newRequests > 0 ? `${newRequests} new requests` : 'No new requests'}
            href="/director/review"
            accentColor={newRequests > 0 ? 'orange' : 'default'}
            icon={<GraduationCap className="w-4 h-4" />}
          />
          <CommandCard
            label="Needs Attention"
            value={totalAlerts}
            sublabel={totalAlerts > 0 ? 'Items to review' : 'All clear'}
            href="/director/signals"
            accentColor={totalAlerts > 0 ? 'red' : 'default'}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <CommandCard
            label="Coach Wrap-Ups"
            value={pendingWrapUpsCount}
            sublabel={pendingWrapUpsCount > 0 ? `${pendingWrapUpsCount} need${pendingWrapUpsCount === 1 ? 's' : ''} review` : 'No pending wrap-ups'}
            href="/director/review"
            accentColor={pendingWrapUpsCount > 0 ? 'orange' : 'default'}
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* ── Curriculum Intelligence ───────────────────────── */}
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
        </CardContent>
      </Card>

      {/* ── Next Best Action prompts ─────────────────────────── */}
      {pendingCount > 0 && (
        <NextBestActionCard
          variant="warning"
          title={`${pendingCount} player${pendingCount !== 1 ? 's' : ''} pending placement`}
          body="Complete their placement to activate profiles and assign curriculum levels."
          actionLabel="Go to Players"
          actionHref="/director/players"
        />
      )}
      {classTemplateCount === 0 && players.length > 0 && (
        <NextBestActionCard
          variant="guide"
          title="Create your first class template"
          body="Class templates let you generate curriculum-aligned lesson plans that coaches can run on court."
          actionLabel="New Template"
          actionHref="/director/class-templates/new"
        />
      )}

      {/* ── Priority panel + Pending placement ─────────────── */}
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
                description="The academy is on track. Priority items will appear here when players need attention."
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
                description="All players have completed onboarding. New players will appear here during placement."
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

      {/* ── Academy Alerts + AI Suggestions ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <AcademyAlertsPanel
          missingFocusCount={missingFocus}
          attentionCount={attentionCount}
          reassessmentDueCount={reassessmentDue}
          newRequestsCount={newRequests}
          pendingCount={pendingCount}
          pendingWrapUpsCount={pendingWrapUpsCount}
          sessions={weekSessions ?? []}
        />

        {/* AI Suggestions card */}
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
                description="Generate suggestions to surface recommended actions from current academy data."
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
              href="/director/signals"
              className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
            >
              {pendingSuggestionsCount > 0 ? 'Review suggestions →' : 'Open AI Suggestions →'}
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* ── Sessions this week ──────────────────────────────── */}
      {(weekSessions ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-text-primary">Sessions This Week</h2>
                <p className="text-xs text-text-muted mt-0.5">Scheduled and completed sessions</p>
              </div>
              <Link
                href="/director/sessions"
                className="text-xs text-lime hover:opacity-80 font-medium"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>
      )}

      {/* ── Bottom Quick Actions ────────────────────────────── */}
      <div>
        <p className="label-xs mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Users className="w-4 h-4 text-lime" />}
            title="Onboarding Flow"
            description="Add or import players and complete placement."
            href="/director/players/import"
          />
          <QuickActionCard
            icon={<BookOpen className="w-4 h-4 text-lime" />}
            title="Class Templates"
            description="Build academy class and session templates."
            href="/director/class-templates"
          />
          <QuickActionCard
            icon={<Mic className="w-4 h-4 text-lime" />}
            title="Review Queue"
            description="Review coach wrap-ups, drafts, and pending actions."
            href="/director/review"
          />
          <QuickActionCard
            icon={<Sparkles className="w-4 h-4 text-lime" />}
            title="Signals"
            description="View academy-wide signals, attendance concerns, and gaps."
            href="/director/signals"
          />
        </div>
      </div>

    </div>
  )
}

// ── Command Card ────────────────────────────────────────────────

type AccentColor = 'lime' | 'green' | 'orange' | 'red' | 'default'

const ACCENT_CLASSES: Record<AccentColor, { number: string; border: string; hover: string }> = {
  lime:    { number: 'text-lime',          border: 'border-lime/20',         hover: 'hover:border-lime/40' },
  green:   { number: 'text-status-green',  border: 'border-status-green/20', hover: 'hover:border-status-green/40' },
  orange:  { number: 'text-status-orange', border: 'border-status-orange/20',hover: 'hover:border-status-orange/40' },
  red:     { number: 'text-status-red',    border: 'border-status-red/20',   hover: 'hover:border-status-red/40' },
  default: { number: 'text-text-primary',  border: 'border-border',          hover: 'hover:border-lime/20' },
}

function CommandCard({
  label,
  value,
  sublabel,
  href,
  accentColor = 'default',
  icon,
}: {
  label: string
  value: string | number
  sublabel?: string
  href: string
  accentColor?: AccentColor
  icon?: ReactNode
}) {
  const ac = ACCENT_CLASSES[accentColor]
  return (
    <Link href={href} className="block group">
      <div className={`bg-surface rounded-2xl p-5 border ${ac.border} ${ac.hover} hover:shadow-cyan transition-all duration-150 h-full flex flex-col gap-2`}>
        <div className="flex items-center justify-between">
          <p className="label-xs">{label}</p>
          {icon && <span className={`${ac.number} opacity-60`}>{icon}</span>}
        </div>
        <p className={`font-mono font-bold leading-none text-5xl ${ac.number} ${String(value).length > 3 ? 'text-4xl' : ''}`}>
          {value}
        </p>
        {sublabel && <p className="text-text-secondary text-xs">{sublabel}</p>}
        <p className={`${ac.number} text-xs font-medium mt-auto group-hover:translate-x-0.5 transition-transform`}>
          View details →
        </p>
      </div>
    </Link>
  )
}

// ── Quick Action Card ───────────────────────────────────────────

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

// ── Academy Alerts Panel (middle section) ───────────────────────

interface SessionRow {
  id: string
  name: string | null
  scheduled_date: string
  status: string
  coach_id: string
  group_id: string | null
}

function AcademyAlertsPanel({
  missingFocusCount,
  attentionCount,
  reassessmentDueCount,
  newRequestsCount,
  pendingCount,
  pendingWrapUpsCount,
  sessions,
}: {
  missingFocusCount: number
  attentionCount: number
  reassessmentDueCount: number
  newRequestsCount: number
  pendingCount: number
  pendingWrapUpsCount: number
  sessions: SessionRow[]
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
      href: '/director/review',
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
            description="No alerts at this time. Academy is on track."
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

// ── Session status pill ─────────────────────────────────────────

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


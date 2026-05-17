import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Calendar, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Users, ClipboardList, Activity,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  Card, CardHeader, CardContent, CardFooter, EmptyState,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { DEMO_SESSIONS, DEMO_PENDING_COUNT } from '@/lib/demo/demoData'
import type { DemoSession } from '@/lib/demo/demoData'
import { TodayDonnaSuggestionChip } from './TodayDonnaSuggestionChip'
import { TodayCommandBrief } from './TodayCommandBrief'
import { loadCommandBriefLive } from '@/lib/donna/commandBriefLiveLoader'
import type { CommandBriefLiveResult } from '@/lib/donna/commandBriefLiveLoader'
import { DEMO_COMMAND_BRIEF_DATA } from '@/lib/donna/donnaDemoSeed'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string
  name: string | null
  scheduled_date: string
  scheduled_time: string | null
  status: string
  coach_id: string
  template_id: string | null
  group_id: string | null
  duration_min: number | null
}

interface SessionWithMeta extends SessionRow {
  coachName: string
  templateName: string
  blockCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getFormattedToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function sessionSortKey(s: SessionRow): string {
  return s.scheduled_time ?? '99:99'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TodaysAcademyPage({
  searchParams,
}: {
  searchParams: { demo?: string }
}) {
  const isDemoMode = searchParams.demo === '1'
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

  const academyId = profile?.academy_id ?? null

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const formattedToday = getFormattedToday()

  // ── Data source ────────────────────────────────────────────────────────────
  // Demo mode: use local static fixtures. Normal mode: query Supabase.

  let enrichedSessions: DemoSession[]
  let pending: number
  let commandBriefResult: CommandBriefLiveResult

  if (isDemoMode) {
    enrichedSessions = DEMO_SESSIONS
    pending = DEMO_PENDING_COUNT
    commandBriefResult = {
      data: DEMO_COMMAND_BRIEF_DATA,
      fieldStatus: {
        sessions: 'partial',
        attendance: 'partial',
        wrapUpCoverage: 'partial',
        attentionFlags: 'partial',
        reviewQueue: 'partial',
      },
      overallStatus: 'partial',
    }
  } else {
    const today = getTodayString()

    // ── Data fetches (parallel) ──────────────────────────────────────────────

    const [
      { data: todaySessions },
      { count: pendingCount },
      { data: activeProfiles },
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status, coach_id, template_id, group_id, duration_min')
        .eq('academy_id', academyId)
        .eq('scheduled_date', today)
        .order('scheduled_time', { ascending: true, nullsFirst: false }),
      supabase
        .from('proposed_actions')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('status', 'pending_review'),
      supabase
        .from('profiles')
        .select('id, display_name')
        .eq('academy_id', academyId),
    ])

    const sessions = (todaySessions ?? []) as SessionRow[]
    const sessionsSorted = [...sessions].sort((a, b) =>
      sessionSortKey(a).localeCompare(sessionSortKey(b))
    )

    // ── Batch: coach names ───────────────────────────────────────────────────

    const coachIds = Array.from(new Set(sessions.map(s => s.coach_id)))
    const coachMap = new Map<string, string>()
    const profileRows = activeProfiles ?? []
    for (const p of profileRows) {
      if (coachIds.includes(p.id)) {
        coachMap.set(p.id, p.display_name ?? p.id.slice(0, 8))
      }
    }

    // ── Batch: template names ────────────────────────────────────────────────

    const templateIds = Array.from(
      new Set(sessions.map(s => s.template_id).filter(Boolean) as string[])
    )
    const templateMap = new Map<string, string>()
    if (templateIds.length > 0) {
      const { data: templates } = await supabase
        .from('templates')
        .select('id, name')
        .in('id', templateIds)
      for (const t of (templates ?? [])) {
        templateMap.set(t.id, t.name ?? 'Untitled Template')
      }
    }

    // ── Batch: session block counts ──────────────────────────────────────────

    const sessionIds = sessions.map(s => s.id)
    const blockCountMap = new Map<string, number>()
    if (sessionIds.length > 0) {
      const { data: blockRows } = await supabase
        .from('session_blocks')
        .select('session_id')
        .in('session_id', sessionIds)
      for (const row of (blockRows ?? [])) {
        blockCountMap.set(row.session_id, (blockCountMap.get(row.session_id) ?? 0) + 1)
      }
    }

    // ── Enrich sessions ──────────────────────────────────────────────────────

    enrichedSessions = sessionsSorted.map(s => ({
      ...s,
      coachName: coachMap.get(s.coach_id) ?? 'Unknown coach',
      templateName: s.template_id ? (templateMap.get(s.template_id) ?? 'No template') : 'No template',
      blockCount: blockCountMap.get(s.id) ?? 0,
    })) as DemoSession[]

    pending = pendingCount ?? 0

    // ── Command Brief live loader (Sprint 512) ───────────────────────────────
    commandBriefResult = await loadCommandBriefLive(supabase, academyId)
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalToday = enrichedSessions.length
  const inProgress = enrichedSessions.filter(s => s.status === 'in_progress').length
  const completed = enrichedSessions.filter(s => s.status === 'completed').length
  const missingBlocks = enrichedSessions.filter(s => s.blockCount === 0 && s.status !== 'cancelled').length

  const riskFlags = missingBlocks + (pending > 0 ? 1 : 0)

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="page-eyebrow">Operating View</p>
          <h1 className="page-title text-3xl">Today's Academy</h1>
          <p className="font-mono text-lime text-sm mt-1">{formattedToday}</p>
        </div>
        <Link
          href="/director/review"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border hover:border-lime/30 hover:shadow-cyan transition-all"
        >
          <ClipboardList className="w-4 h-4 text-lime" />
          <span className="text-sm font-medium text-text-primary">Review Queue</span>
          {pending > 0 && (
            <span className="font-mono text-lime font-bold text-sm">{pending}</span>
          )}
        </Link>
      </div>

      {/* ── Stat strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Sessions Today"
          value={totalToday}
          sub={totalToday === 0 ? 'None scheduled' : inProgress > 0 ? `${inProgress} in progress` : 'All planned'}
          accent={totalToday > 0 ? 'lime' : 'default'}
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Completed"
          value={completed}
          sub={totalToday > 0 ? `of ${totalToday} today` : '—'}
          accent={completed === totalToday && totalToday > 0 ? 'green' : 'default'}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          label="Pending Review"
          value={pending}
          sub={pending > 0 ? 'Need approval' : 'Queue clear'}
          accent={pending > 0 ? 'orange' : 'default'}
          icon={<Clock className="w-4 h-4" />}
          href="/director/review"
        />
        <StatCard
          label="Risk Flags"
          value={riskFlags}
          sub={missingBlocks > 0 ? `${missingBlocks} session${missingBlocks !== 1 ? 's' : ''} missing blocks` : 'All clear'}
          accent={riskFlags > 0 ? 'red' : 'default'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Sessions — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <p className="label-xs">Sessions On Court Today</p>
            <p className="text-xs text-text-muted mt-1">
              All sessions scheduled for {formattedToday}.
            </p>
          </div>
          <Card>
            <CardContent className="py-4">
              {enrichedSessions.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="No sessions today"
                  description="No sessions are scheduled for today. Create a session from a class template to add it here."
                  className="py-10"
                />
              ) : (
                <div className="space-y-1">
                  {enrichedSessions.map(session => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link
                href="/director/sessions"
                className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
              >
                View all sessions →
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-4">

          {/* DONNA Command Brief — live/partial data (Sprint 512) ──────────── */}
          <div>
            <p className="label-xs">DONNA Command Brief</p>
            <p className="text-xs text-text-muted mt-1">Live academy operating summary.</p>
          </div>
          <TodayCommandBrief
            data={commandBriefResult.data}
            overallStatus={commandBriefResult.overallStatus}
          />

          {/* DONNA suggestion chips */}
          <div className="space-y-2">
            <p className="label-xs">Ask DONNA</p>
            <TodayDonnaSuggestionChip label="What needs my attention today?" />
            <TodayDonnaSuggestionChip label="Give me my daily brief." />
            <TodayDonnaSuggestionChip label="Log an attendance exception." />
            <TodayDonnaSuggestionChip label="What needs approval?" />
          </div>

          {/* Risk flags ─────────────────────────────────────────────────────── */}
          {(missingBlocks > 0 || pending > 0) && (
            <>
              <p className="label-xs">Risk Flags</p>
              <Card>
                <CardContent className="py-4 space-y-2">
                  {missingBlocks > 0 && (
                    <RiskFlag
                      severity="medium"
                      title={`${missingBlocks} session${missingBlocks !== 1 ? 's' : ''} missing blocks`}
                      why="Sessions without blocks cannot guide coaches on court."
                      href="/director/sessions"
                    />
                  )}
                  {pending > 0 && (
                    <RiskFlag
                      severity="low"
                      title={`${pending} item${pending !== 1 ? 's' : ''} pending approval`}
                      why="Drafts and wrap-ups are in the review queue."
                      href="/director/review"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick actions ──────────────────────────────────────────────────── */}
          <p className="label-xs">Quick Actions</p>
          <div className="space-y-2">
            <QuickLink
              href="/director/review"
              icon={<ClipboardList className="w-4 h-4 text-lime" />}
              label="Review Queue"
              sub={pending > 0 ? `${pending} pending` : 'All clear'}
            />
            <QuickLink
              href="/director/sessions"
              icon={<Calendar className="w-4 h-4 text-lime" />}
              label="All Sessions"
              sub="View and manage"
            />
            <QuickLink
              href="/director/players"
              icon={<Users className="w-4 h-4 text-lime" />}
              label="Players"
              sub="Directory + profiles"
            />
            <QuickLink
              href="/director/signals"
              icon={<Activity className="w-4 h-4 text-lime" />}
              label="Signals"
              sub="Academy intelligence"
            />
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

type Accent = 'lime' | 'green' | 'orange' | 'red' | 'default'

const ACCENT: Record<Accent, { num: string; border: string; hover: string }> = {
  lime:    { num: 'text-lime',          border: 'border-lime/20',          hover: 'hover:border-lime/40' },
  green:   { num: 'text-status-green',  border: 'border-status-green/20',  hover: 'hover:border-status-green/40' },
  orange:  { num: 'text-status-orange', border: 'border-status-orange/20', hover: 'hover:border-status-orange/40' },
  red:     { num: 'text-status-red',    border: 'border-status-red/20',    hover: 'hover:border-status-red/40' },
  default: { num: 'text-text-primary',  border: 'border-border',           hover: 'hover:border-lime/20' },
}

function StatCard({
  label, value, sub, accent = 'default', icon, href,
}: {
  label: string
  value: number
  sub?: string
  accent?: Accent
  icon?: ReactNode
  href?: string
}) {
  const ac = ACCENT[accent]
  const inner = (
    <div className={`bg-surface rounded-2xl p-5 border ${ac.border} ${ac.hover} hover:shadow-cyan transition-all duration-150 h-full flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className="label-xs">{label}</p>
        {icon && <span className={`${ac.num} opacity-60`}>{icon}</span>}
      </div>
      <p className={`font-mono font-bold leading-none text-5xl ${ac.num}`}>{value}</p>
      {sub && <p className="text-text-secondary text-xs">{sub}</p>}
    </div>
  )
  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return <div>{inner}</div>
}

const SESSION_STATUS_STYLES: Record<string, string> = {
  planned:     'bg-surface-raised text-text-muted border-border',
  in_progress: 'bg-lime/10 text-lime border-lime/30',
  completed:   'bg-status-green/10 text-status-green border-status-green/30',
  cancelled:   'bg-status-red/10 text-status-red border-status-red/30',
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

function SessionRow({ session }: { session: SessionWithMeta }) {
  const statusStyle = SESSION_STATUS_STYLES[session.status] ?? SESSION_STATUS_STYLES.planned
  const statusLabel = SESSION_STATUS_LABELS[session.status] ?? session.status
  const missingBlocks = session.blockCount === 0 && session.status !== 'cancelled'

  return (
    <Link
      href={`/director/sessions/${session.id}`}
      className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-surface-raised transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary truncate">
            {session.name ?? 'Untitled Session'}
          </p>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyle}`}>
            {statusLabel}
          </span>
          {missingBlocks && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-orange/10 border-status-orange/20 text-status-orange">
              No blocks
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <p className="text-xs text-text-muted">
            {session.scheduled_time
              ? session.scheduled_time.slice(0, 5)
              : formatDate(session.scheduled_date)}
            {session.duration_min ? ` · ${session.duration_min} min` : ''}
          </p>
          <p className="text-xs text-text-muted">{session.coachName}</p>
          {session.template_id && (
            <p className="text-xs text-text-muted truncate">{session.templateName}</p>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-1" />
    </Link>
  )
}

type RiskSeverity = 'high' | 'medium' | 'low'

const RISK_STYLES: Record<RiskSeverity, string> = {
  high:   'bg-status-red/10 border-status-red/20 text-status-red',
  medium: 'bg-status-orange/10 border-status-orange/20 text-status-orange',
  low:    'bg-surface-raised border-border text-text-muted',
}

const RISK_LABELS: Record<RiskSeverity, string> = {
  high: 'Urgent', medium: 'Review', low: 'Info',
}

function RiskFlag({
  severity, title, why, href,
}: {
  severity: RiskSeverity
  title: string
  why: string
  href: string
}) {
  return (
    <Link href={href} className="flex items-start gap-3 px-3 py-3 rounded-xl border border-transparent hover:bg-surface-raised hover:border-border transition-all group">
      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${RISK_STYLES[severity]}`}>
        {RISK_LABELS[severity]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{why}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-1" />
    </Link>
  )
}

function QuickLink({
  href, icon, label, sub,
}: {
  href: string
  icon: ReactNode
  label: string
  sub?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border hover:border-lime/30 hover:shadow-cyan transition-all group"
    >
      <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
    </Link>
  )
}

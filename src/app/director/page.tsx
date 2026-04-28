import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, Calendar, Brain, BarChart3, Settings,
  ChevronRight, Activity, Clock,
} from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { getAcademyPriorityQueue } from '@/lib/backend/dashboard'
import {
  Card, CardHeader, CardContent, CardFooter,
  MetricCard, EmptyState, Avatar, StatusBadge,
} from '@/components/ui'
import { urgencyToLabel } from '@/lib/utils'

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

  // Sequential queries — AI_BACKEND_RULES rule #5
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

  // Derived metrics — all from real Supabase data, no fake numbers
  const totalPlayers    = players.length
  const activePlayers   = players.filter(p => p.player_status === 'active').length
  const pendingCount    = players.filter(p => isPending(p.player_status)).length
  const attentionCount  = players.filter(
    p => p.player_status === 'on_hold' || p.player_status === 'reassessment_due'
  ).length
  const pendingList     = players.filter(p => isPending(p.player_status)).slice(0, 5)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-6 space-y-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <p className="label-xs">{academyName}</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">Command Center</h1>
        <p className="text-text-secondary text-sm mt-1">{today}</p>
      </div>

      {/* ── Snapshot metrics ───────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Players"
          value={totalPlayers}
          sublabel="All registered"
          href="/director/players"
          action="View all"
        />
        <MetricCard
          label="Active"
          value={activePlayers}
          sublabel="Currently training"
          variant="positive"
        />
        <MetricCard
          label="Pending Placement"
          value={pendingCount}
          sublabel="Awaiting onboarding"
          variant={pendingCount > 0 ? 'warning' : 'default'}
          href={pendingCount > 0 ? '/director/players' : undefined}
          action={pendingCount > 0 ? 'Review' : undefined}
        />
        <MetricCard
          label="Needs Attention"
          value={attentionCount}
          sublabel="On hold or reassessment due"
          variant={attentionCount > 0 ? 'alert' : 'default'}
        />
      </div>

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
                href="/director/players"
                className="text-xs text-lime hover:opacity-80 transition-opacity font-medium"
              >
                View all players →
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

      {/* ── Module cards ───────────────────────────────────── */}
      <div>
        <p className="label-xs mb-4">Modules</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <LiveModuleCard
            icon={<Users className="w-4 h-4 text-lime" />}
            title="Players"
            description={
              totalPlayers > 0
                ? `${totalPlayers} player${totalPlayers !== 1 ? 's' : ''} registered`
                : 'Player directory'
            }
            href="/director/players"
          />
          <ComingSoonCard icon={<BookOpen className="w-4 h-4" />} title="Curriculum" />
          <ComingSoonCard icon={<Calendar className="w-4 h-4" />} title="Sessions" />
          <ComingSoonCard icon={<Brain className="w-4 h-4" />}    title="Intelligence" />
          <ComingSoonCard icon={<BarChart3 className="w-4 h-4" />} title="Reports" />
          <ComingSoonCard icon={<Settings className="w-4 h-4" />}  title="Configuration" />
        </div>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function LiveModuleCard({
  icon, title, description, href,
}: {
  icon: ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-surface border border-lime/20 rounded-2xl p-5 h-full hover:border-lime/40 hover:shadow-lime transition-all duration-150 group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            {icon}
          </div>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
            Live
          </span>
        </div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
        <p className="text-lime text-xs font-medium mt-3 group-hover:translate-x-0.5 transition-transform">
          Open →
        </p>
      </div>
    </Link>
  )
}

function ComingSoonCard({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 opacity-50">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-muted">
          {icon}
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border">
          Soon
        </span>
      </div>
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="text-xs text-text-muted mt-1">Coming in a future release</p>
    </div>
  )
}

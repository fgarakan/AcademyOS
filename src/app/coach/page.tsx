import { Calendar, Users, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  EmptyState,
  SectionHeader,
} from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  getCoachWorkspaceSummary,
  type CoachWorkspaceSummary,
} from '@/lib/backend/coachWorkspace'

function playerInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

function formatObsType(type: string): string {
  return type.replace(/_/g, ' ')
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function CoachHome() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let summary: CoachWorkspaceSummary = {
    profile: null,
    assignedGroups: [],
    assignedPlayers: [],
    recentObservations: [],
    todaySessions: [],
  }

  if (user) {
    try {
      summary = await getCoachWorkspaceSummary(supabase, user.id)
    } catch {
      // query failed — empty state shell still renders
    }
  }

  const { profile, assignedPlayers, recentObservations, todaySessions } = summary

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const coachFirstName = profile?.display_name?.split(' ')[0] ?? null
  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Your Workspace</p>
        <h1 className="page-title">
          {coachFirstName ? `${greeting}, ${coachFirstName}` : 'Coach Hub'}
        </h1>
        <p className="page-subtitle">{today}</p>
      </div>

      {/* ── Quick stats ────────────────────────────────────────── */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-surface-raised border border-border min-w-[72px]">
          <p className="text-xl font-mono font-bold text-lime leading-none">{todaySessions.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">Today</p>
        </div>
        <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-surface-raised border border-border min-w-[72px]">
          <p className="text-xl font-mono font-bold text-lime leading-none">{assignedPlayers.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">Players</p>
        </div>
        {recentObservations.length > 0 && (
          <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-surface-raised border border-border min-w-[72px]">
            <p className="text-xl font-mono font-bold text-lime leading-none">{recentObservations.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">Notes</p>
          </div>
        )}
      </div>

      {/* ── Today ────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="TODAY" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-lime" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Today's Sessions</p>
                <p className="text-text-muted text-xs">Your session plan for today</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todaySessions.length > 0 ? (
              <ul className="space-y-1">
                {todaySessions.map(s => (
                  <li key={s.id}>
                    <Link
                      href={`/coach/sessions/${s.id}`}
                      className="flex items-center justify-between gap-2 py-2 px-1 rounded-xl hover:bg-surface-raised transition-colors group border-b border-border last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate group-hover:text-lime transition-colors">
                          {s.name ?? 'Session'}
                        </p>
                        {s.scheduled_time && (
                          <p className="text-xs text-text-muted">
                            {s.scheduled_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          s.status === 'in_progress'
                            ? 'bg-lime/10 text-lime border-lime/30'
                            : s.status === 'completed'
                            ? 'bg-status-green/10 text-status-green border-status-green/30'
                            : s.status === 'cancelled'
                            ? 'bg-status-red/10 text-status-red border-status-red/30'
                            : 'bg-surface-raised text-text-muted border-border'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Calendar className="w-5 h-5" />}
                title="No sessions scheduled yet"
                description="Sessions will appear here as soon as your director schedules them. Check back before your next court time."
                className="py-10"
              />
            )}
          </CardContent>
          <CardFooter>
            <Link href="/coach/sessions" className="text-xs text-lime hover:opacity-80 font-medium">
              View all sessions →
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* ── Players + Notes ───────────────────────────────────── */}
      <div>
        <SectionHeader title="PLAYERS & NOTES" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* My Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-text-muted" />
                  </div>
                  <p className="font-semibold text-text-primary text-sm truncate">My Players</p>
                </div>
                {assignedPlayers.length > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border shrink-0">
                    {assignedPlayers.length}{' '}
                    {assignedPlayers.length === 1 ? 'player' : 'players'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/30 shrink-0">
                    Soon
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedPlayers.length > 0 ? (
                <>
                  <ul className="space-y-3">
                    {assignedPlayers.slice(0, 5).map((p, i) => {
                      const initials = playerInitials(p.full_name)
                      const details = (
                        [p.group_name, p.level_label].filter(Boolean) as string[]
                      ).join(' · ')
                      return (
                        <li key={p.player_id ?? i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-text-secondary">
                              {initials}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {p.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {details || '—'}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  {assignedPlayers.length > 5 && (
                    <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border">
                      +{assignedPlayers.length - 5} more
                    </p>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="Players will appear here"
                  description="Your director assigns players to you. Once connected, you'll see their levels and current focus."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-text-muted" />
                  </div>
                  <p className="font-semibold text-text-primary text-sm truncate">Recent Notes</p>
                </div>
                {recentObservations.length === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/30 shrink-0">
                    Soon
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentObservations.length > 0 ? (
                <ul className="space-y-3">
                  {recentObservations.map(obs => (
                    <li
                      key={obs.id}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {obs.player_name}
                        </p>
                        <span className="text-xs text-text-muted shrink-0">
                          {formatShortDate(obs.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-secondary border border-border">
                          {formatObsType(obs.observation_type)}
                        </span>
                        {obs.is_private && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {obs.content.length > 80
                          ? obs.content.slice(0, 80) + '…'
                          : obs.content}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<FileText className="w-5 h-5" />}
                  title="No notes yet"
                  description="Notes you write during or after sessions will appear here for quick reference."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div>
        <SectionHeader title="QUICK ACTIONS" />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/coach/sessions" className="block group">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border border-lime/20 hover:border-lime/40 hover:bg-surface-raised transition-all">
              <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-lime" />
              </div>
              <span className="text-xs font-medium text-text-primary text-center leading-tight">My Sessions</span>
              <ChevronRight className="w-3 h-3 text-lime group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
          <Link href="/coach/players" className="block group">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all">
              <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
                <Users className="w-4 h-4 text-text-muted" />
              </div>
              <span className="text-xs font-medium text-text-secondary text-center leading-tight">My Players</span>
              <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-lime group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>
      </div>

    </div>
  )
}

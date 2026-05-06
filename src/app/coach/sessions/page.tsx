import Link from 'next/link'
import { Calendar, ChevronRight, CheckCircle2 } from 'lucide-react'
import {
  Card,
  CardContent,
  EmptyState,
  SectionHeader,
} from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCoachWorkspaceSummary } from '@/lib/backend/coachWorkspace'
import { formatDate } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/database.types'

type SessionRow = Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>

const STATUS_STYLES: Record<string, string> = {
  in_progress: 'bg-lime/10 text-lime border-lime/30',
  completed:   'bg-status-green/10 text-status-green border-status-green/30',
  cancelled:   'bg-status-red/10 text-status-red border-status-red/30',
  planned:     'bg-surface-raised text-text-muted border-border',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ')
}

export default async function CoachSessionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let todaySessions: Tables<'sessions'>[] = []
  let upcomingSessions: SessionRow[] = []
  let recentCompleted: SessionRow[] = []
  let coachId: string | null = null

  if (user) {
    try {
      const summary = await getCoachWorkspaceSummary(supabase, user.id)
      todaySessions = summary.todaySessions
      coachId = summary.profile?.id ?? null
    } catch {
      // query failed — empty state renders
    }

    if (coachId) {
      const todayDate = new Date().toISOString().slice(0, 10)

      // Upcoming sessions (after today)
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status')
        .eq('coach_id', coachId)
        .gt('scheduled_date', todayDate)
        .not('status', 'eq', 'cancelled')
        .order('scheduled_date', { ascending: true })
        .limit(10)
      upcomingSessions = upcoming ?? []

      // Recent completed sessions
      const { data: completed } = await supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status')
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(8)
      recentCompleted = completed ?? []
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Sessions</p>
        <h1 className="page-title">Your Sessions</h1>
        <p className="text-text-muted text-sm mt-1">{today}</p>
      </div>

      {/* ── Today ────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="TODAY" />
        <div className="space-y-2">
          {todaySessions.length > 0 ? (
            todaySessions.map(s => (
              <SessionCard key={s.id} session={s} primary />
            ))
          ) : (
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="No sessions today"
                  description="Sessions scheduled for today will appear here once the director assigns them."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Upcoming ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="UPCOMING" />
        <Card>
          <CardContent className="py-2">
            {upcomingSessions.length > 0 ? (
              <ul className="divide-y divide-border">
                {upcomingSessions.map(s => (
                  <SessionRow key={s.id} session={s} showDate />
                ))}
              </ul>
            ) : (
              <div className="py-8">
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="No upcoming sessions"
                  description="Sessions scheduled after today will appear here."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Completed ────────────────────────────────────────── */}
      {recentCompleted.length > 0 && (
        <div>
          <SectionHeader title="COMPLETED" />
          <Card>
            <CardContent className="py-2">
              <ul className="divide-y divide-border">
                {recentCompleted.map(s => (
                  <SessionRow key={s.id} session={s} showDate />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SessionCard — prominent card for Today's sessions
// ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  primary = false,
}: {
  session: Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>
  primary?: boolean
}) {
  const isActive = session.status === 'in_progress'
  return (
    <Link href={`/coach/sessions/${session.id}`} className="block">
      <div className={[
        'flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors',
        isActive
          ? 'border-lime/30 bg-lime/5 hover:bg-lime/10'
          : primary
            ? 'border-border bg-surface hover:border-lime/20'
            : 'border-border bg-surface hover:border-lime/20',
      ].join(' ')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={[
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isActive ? 'bg-lime/20' : 'bg-surface-raised border border-border',
          ].join(' ')}>
            <Calendar className={`w-4 h-4 ${isActive ? 'text-lime' : 'text-text-muted'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {session.name ?? 'Session'}
            </p>
            <p className="text-xs text-text-muted">
              {session.scheduled_time ? session.scheduled_time.slice(0, 5) : 'Time TBD'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[session.status] ?? STATUS_STYLES.planned}`}>
            {statusLabel(session.status)}
          </span>
          <span className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1">
            Open
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// SessionRow — compact list item for Upcoming / Completed
// ─────────────────────────────────────────────────────────────

function SessionRow({
  session,
  showDate = false,
}: {
  session: SessionRow
  showDate?: boolean
}) {
  const isCompleted = session.status === 'completed'
  return (
    <li>
      <Link
        href={`/coach/sessions/${session.id}`}
        className="flex items-center justify-between gap-2 py-3 group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-lime transition-colors">
              {session.name ?? 'Session'}
            </p>
            <p className="text-xs text-text-muted">
              {showDate ? formatDate(session.scheduled_date) : (session.scheduled_time?.slice(0, 5) ?? null)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[session.status] ?? STATUS_STYLES.planned}`}>
            {statusLabel(session.status)}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors" />
        </div>
      </Link>
    </li>
  )
}

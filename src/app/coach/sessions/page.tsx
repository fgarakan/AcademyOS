import Link from 'next/link'
import { Calendar } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  EmptyState,
  SectionHeader,
} from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCoachWorkspaceSummary } from '@/lib/backend/coachWorkspace'
import { formatDate } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/database.types'

export default async function CoachSessionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  type SessionSummary = Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>

  let todaySessions: Tables<'sessions'>[] = []
  let upcomingSessions: SessionSummary[] = []
  let coachId: string | null = null

  if (user) {
    try {
      const summary = await getCoachWorkspaceSummary(supabase, user.id)
      todaySessions = summary.todaySessions
      coachId = summary.profile?.id ?? null
    } catch {
      // query failed — empty state renders
    }

    // Upcoming sessions (after today) for this coach
    if (coachId) {
      const todayDate = new Date().toISOString().slice(0, 10)
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status')
        .eq('coach_id', coachId)
        .gt('scheduled_date', todayDate)
        .order('scheduled_date', { ascending: true })
        .limit(10)
      upcomingSessions = upcoming ?? []
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
        <p className="label-xs mb-1">SESSIONS</p>
        <h1 className="text-2xl font-bold text-text-primary">Sessions</h1>
        <p className="text-text-muted text-sm mt-1">{today}</p>
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
              <ul className="space-y-0">
                {todaySessions.map(s => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Calendar className="w-5 h-5" />}
                title="No sessions scheduled today"
                description="Your sessions will appear here once they are scheduled in the platform."
                className="py-10"
              />
            )}
          </CardContent>
          <CardFooter>
            <p className="text-text-muted text-xs">
              Coming soon: Attendance · Group check-in
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* ── Upcoming ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="UPCOMING" />
        <Card>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <ul className="space-y-0">
                {upcomingSessions.map(s => (
                  <SessionRow key={s.id} session={s} showDate />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Calendar className="w-5 h-5" />}
                title="No upcoming sessions"
                description="Sessions scheduled after today will appear here."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function SessionRow({
  session,
  showDate = false,
}: {
  session: Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>
  showDate?: boolean
}) {
  return (
    <li className="border-b border-border last:border-0 last:pb-0">
      <Link
        href={`/coach/sessions/${session.id}`}
        className="flex items-center justify-between gap-2 py-2 group"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-lime transition-colors">
            {session.name ?? 'Session'}
          </p>
          <p className="text-xs text-text-muted">
            {showDate
              ? formatDate(session.scheduled_date)
              : session.scheduled_time
              ? session.scheduled_time.slice(0, 5)
              : null}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            session.status === 'in_progress'
              ? 'bg-lime/10 text-lime border-lime/30'
              : session.status === 'completed'
              ? 'bg-status-green/10 text-status-green border-status-green/30'
              : session.status === 'cancelled'
              ? 'bg-status-red/10 text-status-red border-status-red/30'
              : 'bg-surface-raised text-text-muted border-border'
          }`}>
            {session.status.replace('_', ' ')}
          </span>
          <span className="text-text-muted text-xs group-hover:text-lime transition-colors">→</span>
        </div>
      </Link>
    </li>
  )
}

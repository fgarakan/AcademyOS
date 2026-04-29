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

export default async function CoachSessionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let todaySessions: Awaited<ReturnType<typeof getCoachWorkspaceSummary>>['todaySessions'] = []

  if (user) {
    try {
      const summary = await getCoachWorkspaceSummary(supabase, user.id)
      todaySessions = summary.todaySessions
    } catch {
      // query failed — empty state renders
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
              <ul className="space-y-1">
                {todaySessions.map(s => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {s.name ?? 'Session'}
                      </p>
                      {s.scheduled_time && (
                        <p className="text-xs text-text-muted">
                          {s.scheduled_time.slice(0, 5)}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
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
                  </li>
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
              Coming soon: Session plans · Attendance · Group check-in
            </p>
          </CardFooter>
        </Card>
      </div>

    </div>
  )
}

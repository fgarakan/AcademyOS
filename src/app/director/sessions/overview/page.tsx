import Link from 'next/link'
import { ArrowRight, Calendar, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'

type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

function StatusBadge({ status }: { status: SessionStatus }) {
  const config: Record<SessionStatus, { label: string; color: string }> = {
    planned: { label: 'Planned', color: 'text-status-blue' },
    in_progress: { label: 'In Progress', color: 'text-status-orange' },
    completed: { label: 'Completed', color: 'text-status-green' },
    cancelled: { label: 'Cancelled', color: 'text-text-muted' },
  }
  const { label, color } = config[status] ?? { label: status, color: 'text-text-muted' }
  return <span className={`text-xs font-medium ${color}`}>{label}</span>
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accent?: 'lime' | 'green' | 'orange' | 'red' | 'default'
}) {
  const accentColor = {
    lime: 'text-lime',
    green: 'text-status-green',
    orange: 'text-status-orange',
    red: 'text-status-red',
    default: 'text-text-primary',
  }[accent]

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center">
        <Icon className={`w-5 h-5 ${accentColor}`} />
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${accentColor}`}>{value}</p>
        <p className="text-text-muted text-xs uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function formatSessionDate(date: string, time: string | null): string {
  try {
    const d = new Date(`${date}T${time ?? '00:00'}`)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      (time ? ` ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '')
  } catch {
    return date
  }
}

export default async function SessionsOverviewPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = (profile as { academy_id: string | null } | null)?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // Week window
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  // Fetch sessions with coach/group names via rawDb to avoid type complexity
  const rawDb = supabase as any
  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select(`
      id,
      name,
      scheduled_date,
      scheduled_time,
      duration_min,
      status,
      session_notes,
      coach_id,
      group_id,
      profiles!sessions_coach_id_fkey(full_name),
      groups(name)
    `)
    .eq('academy_id', academyId)
    .gte('scheduled_date', weekStartStr)
    .lte('scheduled_date', weekEndStr)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  type SessionRow = {
    id: string
    name: string | null
    scheduled_date: string
    scheduled_time: string | null
    duration_min: number | null
    status: SessionStatus
    session_notes: string | null
    coach_id: string
    group_id: string | null
    profiles: { full_name: string | null } | null
    groups: { name: string | null } | null
  }

  const sessions: SessionRow[] = (sessionsRaw ?? []) as SessionRow[]

  // Fetch attendance counts
  const sessionIds = sessions.map(s => s.id)
  let attendanceCounts: Record<string, number> = {}

  if (sessionIds.length > 0) {
    const { data: attendance } = await rawDb
      .from('session_attendance')
      .select('session_id')
      .in('session_id', sessionIds)

    const attendanceRows = (attendance ?? []) as Array<{ session_id: string }>
    for (const row of attendanceRows) {
      attendanceCounts[row.session_id] = (attendanceCounts[row.session_id] ?? 0) + 1
    }
  }

  const totalSessions = sessions.length
  const totalParticipants = Object.values(attendanceCounts).reduce((sum, n) => sum + n, 0)
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const missingRecap = sessions.filter(s => s.status === 'completed' && !s.session_notes).length

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="label-xs text-lime mb-1">SESSIONS</p>
        <h1 className="text-2xl font-bold text-text-primary">Session Overview</h1>
        <p className="text-text-secondary text-sm mt-1">
          Sessions for the current week. See names, participants, focus, coach, and completion status.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Sessions This Week" value={totalSessions} icon={Calendar} accent="lime" />
        <SummaryCard label="Participants" value={totalParticipants} icon={Users} accent="green" />
        <SummaryCard label="Completed" value={completedSessions} icon={CheckCircle} accent="green" />
        <SummaryCard label="Missing Recap" value={missingRecap} icon={AlertCircle} accent={missingRecap > 0 ? 'orange' : 'default'} />
      </div>

      {/* Session list */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text-primary">This Week</h2>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Calendar className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-text-secondary text-sm">No sessions scheduled this week.</p>
              <p className="text-text-muted text-xs">
                {weekStartStr} – {weekEndStr}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link href="/director/sessions" className="text-xs text-lime hover:opacity-80 font-medium transition-opacity">
                  View all sessions →
                </Link>
                <Link href="/director/fitness/templates" className="text-xs text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2">
                  Generate from template
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map(session => {
                const participants = attendanceCounts[session.id] ?? 0
                const hasRecap = Boolean(session.session_notes)

                return (
                  <Link
                    key={session.id}
                    href={`/director/sessions/${session.id}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-surface-raised rounded transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Date/time */}
                      <div className="shrink-0 w-36">
                        <p className="text-text-primary text-sm font-medium">
                          {session.name ?? 'Unnamed Session'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <p className="text-text-muted text-xs">
                            {formatSessionDate(session.scheduled_date, session.scheduled_time)}
                          </p>
                        </div>
                      </div>

                      {/* Coach + group */}
                      <div className="hidden md:block min-w-0 w-36 shrink-0">
                        <p className="text-text-secondary text-xs truncate">
                          {session.profiles?.full_name ?? 'No coach'}
                        </p>
                        <p className="text-text-muted text-xs truncate">
                          {session.groups?.name ?? 'No group'}
                        </p>
                      </div>

                      {/* Participants */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <Users className="w-3 h-3 text-text-muted" />
                        <span className="text-text-secondary text-xs">{participants}</span>
                      </div>

                      {/* Status + recap */}
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={session.status} />
                        {session.status === 'completed' && (
                          <span className={`text-xs ${hasRecap ? 'text-status-green' : 'text-status-orange'}`}>
                            {hasRecap ? '✓ Recap' : '! No recap'}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors ml-4 shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/director" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

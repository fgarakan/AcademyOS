import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, Clock, ChevronRight, MessageSquare } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface CompletedSession {
  id: string
  name: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  duration_min: number | null
  session_notes: string | null
  coach_id: string
  group_id: string | null
  template_id: string | null
}

export default async function SessionArchivePage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // Completed sessions, newest first, up to 50
  const { data: raw, error } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, duration_min, session_notes, coach_id, group_id, template_id')
    .eq('academy_id', academyId)
    .eq('status', 'completed')
    .order('scheduled_date', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <BackLink />
        <p className="text-status-red text-sm">Failed to load archive: {error.message}</p>
      </div>
    )
  }

  const sessions: CompletedSession[] = (raw ?? []) as CompletedSession[]

  // Batch-fetch coach names
  const coachIds = Array.from(new Set(sessions.map(s => s.coach_id)))
  const coachMap = new Map<string, string>()
  if (coachIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', coachIds)
    for (const p of profiles ?? []) coachMap.set(p.id, p.display_name)
  }

  // Batch-fetch group names
  const groupIds = Array.from(new Set(sessions.map(s => s.group_id).filter((id): id is string => !!id)))
  const groupMap = new Map<string, string>()
  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds)
    for (const g of groups ?? []) groupMap.set(g.id, g.name)
  }

  // Group by month for timeline
  const byMonth = new Map<string, CompletedSession[]>()
  for (const s of sessions) {
    if (!s.scheduled_date) continue
    const month = s.scheduled_date.slice(0, 7) // YYYY-MM
    const list = byMonth.get(month) ?? []
    list.push(s)
    byMonth.set(month, list)
  }

  const monthEntries = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  function monthLabel(ym: string) {
    const [year, month] = ym.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <BackLink />

      <div>
        <p className="page-eyebrow">Sessions</p>
        <h1 className="page-title">Session Archive</h1>
        <p className="page-subtitle">
          {sessions.length} completed session{sessions.length !== 1 ? 's' : ''}
          {' '}— read-only history of delivered sessions with coach notes.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No completed sessions yet"
              description="Completed sessions will appear here once coaches finish and submit wrap-ups."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {monthEntries.map(([ym, monthSessions]) => (
            <div key={ym}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                  {monthLabel(ym)}
                </p>
                <span className="text-[10px] font-mono text-lime px-2 py-0.5 rounded-full border border-lime/20 bg-lime/5">
                  {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Session cards for this month */}
              <div className="relative pl-4 space-y-3">
                {/* Timeline vertical line */}
                <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

                {monthSessions.map(s => {
                  const coachName = coachMap.get(s.coach_id) ?? 'Unknown Coach'
                  const groupName = s.group_id ? (groupMap.get(s.group_id) ?? null) : null
                  const hasNotes = !!s.session_notes?.trim()

                  return (
                    <div key={s.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-4 top-3 w-2 h-2 rounded-full bg-status-green border-2 border-base" />

                      <Link href={`/director/sessions/${s.id}`}>
                        <div className="ml-2 p-3 rounded-xl border border-border bg-surface hover:border-lime/20 transition-colors group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {/* Date + time */}
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-3 h-3 text-status-green shrink-0" />
                                <p className="text-[11px] text-status-green font-medium">
                                  {formatDate(s.scheduled_date)}
                                  {s.scheduled_time && ` · ${s.scheduled_time.slice(0, 5)}`}
                                </p>
                                {s.duration_min && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                                    <Clock className="w-2.5 h-2.5" />
                                    {s.duration_min} min
                                  </span>
                                )}
                              </div>

                              {/* Session name */}
                              <p className="text-sm font-semibold text-text-primary truncate group-hover:text-lime transition-colors">
                                {s.name ?? 'Untitled Session'}
                              </p>

                              {/* Meta */}
                              <p className="text-xs text-text-muted mt-0.5">
                                {coachName}
                                {groupName && ` · ${groupName}`}
                              </p>

                              {/* Notes preview */}
                              {hasNotes && (
                                <div className="mt-2 flex items-start gap-1.5">
                                  <MessageSquare className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-text-muted line-clamp-2">
                                    {s.session_notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0 mt-2" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 50 && (
        <p className="text-center text-xs text-text-muted">
          Showing the 50 most recent completed sessions.
          Older sessions are available via direct URL.
        </p>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/director/sessions"
      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Sessions
    </Link>
  )
}

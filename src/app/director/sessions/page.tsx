import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default async function DirectorSessionsPage() {
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

  // 1. Sessions for this academy, newest first
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, status, coach_id, template_id, group_id')
    .eq('academy_id', academyId)
    .order('scheduled_date', { ascending: false })

  if (sessionsError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <p className="text-status-red text-sm">Failed to load sessions: {sessionsError.message}</p>
      </div>
    )
  }

  const sessionList = sessions ?? []

  // 2. Batch-fetch coach display names
  const coachIds = Array.from(new Set(sessionList.map(s => s.coach_id)))
  const coachMap = new Map<string, string>()
  if (coachIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', coachIds)
    for (const p of (profiles ?? [])) {
      coachMap.set(p.id, p.display_name)
    }
  }

  // 3. Batch-fetch template names
  const templateIds = Array.from(
    new Set(sessionList.map(s => s.template_id).filter((id): id is string => id !== null))
  )
  const templateMap = new Map<string, string>()
  if (templateIds.length > 0) {
    const { data: templates } = await supabase
      .from('templates')
      .select('id, name')
      .in('id', templateIds)
    for (const t of (templates ?? [])) {
      templateMap.set(t.id, t.name)
    }
  }

  // 4. Batch-fetch block counts per session
  const sessionIds = sessionList.map(s => s.id)
  const blockCountMap = new Map<string, number>()
  if (sessionIds.length > 0) {
    const { data: blocks } = await supabase
      .from('session_blocks')
      .select('session_id')
      .in('session_id', sessionIds)
    for (const b of (blocks ?? [])) {
      blockCountMap.set(b.session_id, (blockCountMap.get(b.session_id) ?? 0) + 1)
    }
  }

  // 5. Batch-fetch group names
  const groupIds = Array.from(
    new Set(sessionList.map(s => s.group_id).filter((id): id is string => id !== null))
  )
  const groupMap = new Map<string, string>()
  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds)
    for (const g of (groups ?? [])) {
      groupMap.set(g.id, g.name)
    }
  }

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader />

      {sessionList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="No sessions yet"
              description="Generate a session from a fitness template to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessionList.map(session => {
            const coachName = coachMap.get(session.coach_id) ?? 'Unknown Coach'
            const templateName = session.template_id ? (templateMap.get(session.template_id) ?? null) : null
            const blockCount = blockCountMap.get(session.id) ?? 0
            const groupName = session.group_id ? (groupMap.get(session.group_id) ?? null) : null

            return (
              <Link key={session.id} href={`/director/sessions/${session.id}`} className="block group">
                <Card hover>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-text-primary text-sm truncate">
                            {session.name ?? 'Untitled Session'}
                          </p>
                          <SessionStatusPill status={session.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatDate(session.scheduled_date)}
                          </span>
                          <span>{coachName}</span>
                          {templateName && <span>Template: {templateName}</span>}
                          {groupName
                            ? <span>Group: {groupName}</span>
                            : <span className="text-text-muted/60">No group</span>
                          }
                          {blockCount > 0 && (
                            <span>{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-text-muted text-sm shrink-0 group-hover:text-lime transition-colors">
                        →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PageHeader() {
  return (
    <div>
      <p className="page-eyebrow">Director</p>
      <h1 className="page-title">Sessions</h1>
      <p className="page-subtitle">Generated session snapshots for this academy.</p>
    </div>
  )
}

function SessionStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: 'bg-surface-raised text-text-muted border-border',
    in_progress: 'bg-lime/10 text-lime border-lime/30',
    completed: 'bg-status-green/10 text-status-green border-status-green/30',
    cancelled: 'bg-status-red/10 text-status-red border-status-red/30',
  }
  const label: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] ?? styles.planned}`}>
      {label[status] ?? status}
    </span>
  )
}

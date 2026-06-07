import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { ChevronLeft, User, ClipboardList, MessageSquare, Clock } from 'lucide-react'
import { CoachGroupAssignmentPanel } from './_components/CoachGroupAssignmentPanel'

interface PageProps {
  params: { coachId: string }
}

export default async function CoachProfilePage({ params }: PageProps) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.academy_id) return notFound()
  const academyId = callerProfile.academy_id as string

  // Verify coach is an active member of this academy
  const { data: coachMembership } = await rawDb
    .from('academy_memberships')
    .select('role, is_active, joined_at')
    .eq('profile_id', params.coachId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle()

  if (!coachMembership) return notFound()

  // Coach profile
  const { data: coachProfile } = await rawDb
    .from('profiles')
    .select('full_name, first_name, email')
    .eq('id', params.coachId)
    .maybeSingle()

  const coachName: string =
    coachProfile?.full_name
      ? String(coachProfile.full_name)
      : coachProfile?.first_name
      ? String(coachProfile.first_name)
      : 'Unknown Coach'

  const coachRole: string = coachMembership.role ?? 'coach'
  const roleLabel =
    coachRole === 'head_coach' ? 'Head Coach'
    : coachRole === 'academy_director' ? 'Director'
    : 'Coach'

  // Sessions coached in last 30d
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id, status, scheduled_date, name')
    .eq('academy_id', academyId)
    .eq('coach_id', params.coachId)
    .gte('scheduled_date', thirtyDaysAgoStr)
    .order('scheduled_date', { ascending: false })

  const sessions = ((sessionsRaw ?? []) as Array<{
    id: string
    status: string
    scheduled_date: string
    name: string | null
  }>).map(s => ({
    id: String(s.id),
    status: String(s.status ?? ''),
    scheduled_date: String(s.scheduled_date ?? ''),
    name: s.name ? String(s.name) : null,
  }))

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s =>
    s.status === 'completed' || s.status === 'done',
  ).length
  const plannedSessions = sessions.filter(s => s.status === 'planned').length
  const completionRate = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : null

  // Observations in last 30d
  const { data: obsRaw } = await rawDb
    .from('coach_observations')
    .select('id, player_id, observation_type, created_at')
    .eq('academy_id', academyId)
    .eq('coach_id', params.coachId)
    .gte('created_at', thirtyDaysAgoStr)

  const observations = (obsRaw ?? []) as Array<{
    id: string
    player_id: string
    observation_type: string
    created_at: string
  }>
  const observationCount = observations.length
  const distinctPlayersObserved = new Set<string>()
  for (const o of observations) {
    if (o.player_id) distinctPlayersObserved.add(String(o.player_id))
  }

  // Pending review items
  const { data: pendingRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_label, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', params.coachId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  const pendingActions = (pendingRaw ?? []) as Array<{
    id: string
    action_label: string
    target_module: string
    created_at: string
  }>
  const pendingCount = pendingActions.length

  // Coach group assignments — current active assignments
  const { data: assignmentsRaw } = await rawDb
    .from('coach_group_assignments')
    .select('id, group_id, role, is_active')
    .eq('academy_id', academyId)
    .eq('coach_id', params.coachId)
    .eq('is_active', true)

  const assignedGroupIds = new Set<string>(
    ((assignmentsRaw ?? []) as Array<{ group_id: string }>)
      .map(a => String(a.group_id))
  )

  // All active groups in this academy for the picker
  const { data: allGroupsRaw } = await rawDb
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const allGroups = ((allGroupsRaw ?? []) as Array<{ id: string; name: string }>)
    .map(g => ({ id: String(g.id), name: String(g.name) }))

  const assignedGroups = allGroups.filter(g => assignedGroupIds.has(g.id))

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/director"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-white text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-text-muted" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">{coachName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-widest bg-lime/10 text-lime border border-lime/20">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sessions */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 py-1">
              <Clock className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted">Sessions (30d)</p>
                <p className="text-2xl font-mono font-semibold text-lime tabular-nums mt-0.5">
                  {totalSessions}
                </p>
                {completionRate !== null && (
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {completedSessions} completed ({completionRate}%)
                    {plannedSessions > 0 ? ` · ${plannedSessions} planned` : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 py-1">
              <MessageSquare className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted">Observations (30d)</p>
                <p className={`text-2xl font-mono font-semibold tabular-nums mt-0.5 ${observationCount > 0 ? 'text-lime' : 'text-text-muted'}`}>
                  {observationCount}
                </p>
                {observationCount > 0 && (
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    across {distinctPlayersObserved.size} player{distinctPlayersObserved.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending review */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 py-1">
              <ClipboardList className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted">Pending Review</p>
                <p className={`text-2xl font-mono font-semibold tabular-nums mt-0.5 ${pendingCount > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
                  {pendingCount}
                </p>
                {pendingCount > 0 && (
                  <Link href="/director/review" className="text-[11px] text-lime hover:underline mt-0.5 block">
                    View in Review Queue →
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
            <p className="text-[11px] text-text-muted">Last 30 days · {totalSessions} session{totalSessions !== 1 ? 's' : ''}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 8).map(s => (
                <Link
                  key={s.id}
                  href={`/director/sessions/${s.id}`}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-surface-raised transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-lime transition-colors">
                      {s.name ?? 'Session'}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {new Date(s.scheduled_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded ${
                    s.status === 'completed' || s.status === 'done'
                      ? 'bg-status-green/10 text-status-green'
                      : s.status === 'planned'
                      ? 'bg-status-blue/10 text-status-blue'
                      : 'bg-border text-text-muted'
                  }`}>
                    {s.status}
                  </span>
                </Link>
              ))}
              {sessions.length > 8 && (
                <p className="text-[11px] text-text-muted px-3 pt-1">
                  +{sessions.length - 8} more session{sessions.length - 8 !== 1 ? 's' : ''} in last 30 days
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending items preview */}
      {pendingActions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-white">Pending Review Items</h2>
            <p className="text-[11px] text-text-muted">Items submitted by {coachName} awaiting director approval</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingActions.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-surface-raised">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{a.action_label}</p>
                    <p className="text-[11px] text-text-muted">{a.target_module.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-status-orange/10 text-status-orange">
                    pending
                  </span>
                </div>
              ))}
              {pendingActions.length > 5 && (
                <p className="text-[11px] text-text-muted px-3 pt-1">
                  +{pendingActions.length - 5} more pending item{pendingActions.length - 5 !== 1 ? 's' : ''} —{' '}
                  <Link href="/director/review" className="text-lime hover:underline">
                    view all in Review Queue
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group assignments — Mega Sprint 634–663 */}
      <CoachGroupAssignmentPanel
        coachId={params.coachId}
        assignedGroups={assignedGroups}
        allGroups={allGroups}
      />

      {/* Empty state */}
      {sessions.length === 0 && observationCount === 0 && pendingCount === 0 && (
        <Card>
          <CardContent>
            <div className="py-8 text-center space-y-2">
              <p className="text-text-secondary text-sm">No session or observation activity in the last 30 days.</p>
              <p className="text-text-muted text-[11px]">Assign sessions to {coachName} to start tracking activity here.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

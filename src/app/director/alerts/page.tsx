import Link from 'next/link'
import { AlertTriangle, Bell, Users, Calendar, ClipboardList, BookOpen, MessageSquare, ArrowRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'

type AlertCategory = 'players' | 'sessions' | 'curriculum' | 'private_lessons' | 'coach_notes'
type AlertSeverity = 'high' | 'medium' | 'low'

interface AlertItem {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  why: string
  action: string
  href: string
  count?: number
}

const CATEGORY_ICONS: Record<AlertCategory, React.ComponentType<{ className?: string }>> = {
  players: Users,
  sessions: Calendar,
  curriculum: BookOpen,
  private_lessons: ClipboardList,
  coach_notes: MessageSquare,
}

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  high: 'text-status-red border-status-red/30 bg-status-red/5',
  medium: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  low: 'text-status-blue border-status-blue/30 bg-status-blue/5',
}

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  high: 'bg-status-red',
  medium: 'bg-status-orange',
  low: 'bg-status-blue',
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const Icon = CATEGORY_ICONS[alert.category]
  return (
    <Link
      href={alert.href}
      className={`block border rounded-lg p-4 transition-colors hover:bg-surface-raised ${SEVERITY_COLORS[alert.severity]}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
            <p className="text-text-primary text-sm font-medium">
              {alert.title}
              {alert.count !== undefined && alert.count > 0 && (
                <span className="ml-2 font-mono text-xs">({alert.count})</span>
              )}
            </p>
          </div>
          <p className="text-text-secondary text-xs leading-relaxed">{alert.why}</p>
          <p className="text-text-muted text-xs mt-1.5 flex items-center gap-1">
            {alert.action}
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>
    </Link>
  )
}

const FILTER_TABS: Array<{ key: AlertCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'players', label: 'Players' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'private_lessons', label: 'Private Lessons' },
  { key: 'coach_notes', label: 'Coach Notes' },
]

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
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

  // Gather alert data in parallel
  const rawDb = supabase as any

  const [
    playerSummaryResult,
    priorityQueueResult,
    sessionsResult,
    reassessmentResult,
    plrResult,
  ] = await Promise.all([
    supabase
      .from('v_player_summary')
      .select('player_id, focus_areas, player_status, score_delta')
      .eq('academy_id', academyId)
      .eq('player_status', 'active'),
    supabase
      .from('v_academy_priority_queue')
      .select('player_id, open_priority_count')
      .eq('academy_id', academyId),
    supabase
      .from('sessions')
      .select('id, status, session_notes')
      .eq('academy_id', academyId)
      .eq('status', 'completed'),
    supabase
      .from('v_reassessment_pipeline')
      .select('player_id, urgency')
      .eq('academy_id', academyId),
    rawDb
      .from('private_lesson_requests')
      .select('id, status')
      .eq('academy_id', academyId)
      .eq('status', 'new'),
  ])

  const activePlayers = (playerSummaryResult.data ?? []) as Array<{
    player_id: string | null
    focus_areas: string[] | null
    player_status: string | null
    score_delta: number | null
  }>

  const priorityQueue = (priorityQueueResult.data ?? []) as Array<{
    player_id: string | null
    open_priority_count: number | null
  }>

  const completedSessions = (sessionsResult.data ?? []) as Array<{
    id: string
    status: string
    session_notes: string | null
  }>

  const reassessmentRows = (reassessmentResult.data ?? []) as Array<{
    player_id: string | null
    urgency: string | null
  }>

  const newPLRCount = ((plrResult.data as Array<{ id: string; status: string }>) ?? []).length

  // Compute counts
  const missingFocusCount = activePlayers.filter(
    p => !p.focus_areas || p.focus_areas.length === 0
  ).length

  const missingPriorityCount = priorityQueue.filter(
    p => !p.open_priority_count || p.open_priority_count === 0
  ).length

  const sessionsWithoutRecap = completedSessions.filter(s => !s.session_notes).length

  const reassessmentDue = reassessmentRows.filter(
    r => r.urgency === 'overdue' || r.urgency === 'due_soon'
  ).length

  const decliningPlayers = activePlayers.filter(
    p => p.score_delta !== null && p.score_delta < 0
  ).length

  // Build alert list
  const allAlerts: AlertItem[] = []

  if (newPLRCount > 0) {
    allAlerts.push({
      id: 'plr-new',
      severity: 'high',
      category: 'private_lessons',
      title: 'Private lesson requests waiting',
      why: 'Parents are waiting for a response. Review and route each request to the right coach.',
      action: 'Review requests',
      href: '/director/private-lessons',
      count: newPLRCount,
    })
  }

  if (reassessmentDue > 0) {
    allAlerts.push({
      id: 'reassessment-due',
      severity: 'high',
      category: 'players',
      title: 'Players due for reassessment',
      why: 'These players have not been assessed recently. Stale data limits coaching accuracy.',
      action: 'Review players',
      href: '/director/players',
      count: reassessmentDue,
    })
  }

  if (decliningPlayers > 0) {
    allAlerts.push({
      id: 'players-declining',
      severity: 'high',
      category: 'players',
      title: 'Players showing decline',
      why: 'Score delta is negative. Review their recent coach notes and priorities.',
      action: 'View improvement report',
      href: '/director/improvement',
      count: decliningPlayers,
    })
  }

  if (sessionsWithoutRecap > 0) {
    allAlerts.push({
      id: 'sessions-no-recap',
      severity: 'medium',
      category: 'sessions',
      title: 'Completed sessions missing recap',
      why: 'Session notes help coaches and the director review what was covered and plan next steps.',
      action: 'Review sessions',
      href: '/director/sessions/overview',
      count: sessionsWithoutRecap,
    })
  }

  if (missingFocusCount > 0) {
    allAlerts.push({
      id: 'missing-focus',
      severity: 'medium',
      category: 'coach_notes',
      title: 'Players missing development summary',
      why: 'Players without a focus area cannot receive targeted coaching or parent updates.',
      action: 'View active players',
      href: '/director/players/active',
      count: missingFocusCount,
    })
  }

  if (missingPriorityCount > 0) {
    allAlerts.push({
      id: 'missing-priority',
      severity: 'low',
      category: 'curriculum',
      title: 'Players missing current priority',
      why: 'These players have no open priorities in the queue, which may indicate incomplete onboarding.',
      action: 'View priority queue',
      href: '/director',
      count: missingPriorityCount,
    })
  }

  const activeCategory = (searchParams.category ?? 'all') as AlertCategory | 'all'
  const filteredAlerts = activeCategory === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.category === activeCategory)

  const highCount = allAlerts.filter(a => a.severity === 'high').length
  const mediumCount = allAlerts.filter(a => a.severity === 'medium').length

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="label-xs text-lime mb-1">INTELLIGENCE</p>
        <h1 className="text-2xl font-bold text-text-primary">Academy Alerts</h1>
        <p className="text-text-secondary text-sm mt-1">
          Items that need director attention or adjustment.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className="font-mono text-2xl font-bold text-text-primary">{allAlerts.length}</p>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">Total Alerts</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className={`font-mono text-2xl font-bold ${highCount > 0 ? 'text-status-red' : 'text-text-primary'}`}>
            {highCount}
          </p>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">High Priority</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className={`font-mono text-2xl font-bold ${mediumCount > 0 ? 'text-status-orange' : 'text-text-primary'}`}>
            {mediumCount}
          </p>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">Medium Priority</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/director/alerts' : `/director/alerts?category=${tab.key}`}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              activeCategory === tab.key
                ? 'border-lime text-lime bg-surface-raised'
                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Alert list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-text-secondary" />
            <h2 className="text-base font-semibold text-text-primary">
              {activeCategory === 'all' ? 'All Alerts' : FILTER_TABS.find(t => t.key === activeCategory)?.label ?? 'Alerts'}
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">
                {allAlerts.length === 0 ? 'No active alerts.' : 'No alerts in this category.'}
              </p>
              {allAlerts.length === 0 && (
                <p className="text-text-muted text-xs mt-1">Academy is in good shape.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
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

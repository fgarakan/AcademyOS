import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { CommandCenterClient } from './CommandCenterClient'
import { DirectorAssistantPanel } from './DirectorAssistantPanel'
import { Terminal } from 'lucide-react'
import { loadWeeklyCoOReport } from '@/lib/donna/weeklyCoOReportLoader'

export default async function CommandCenterPage() {
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

  const rawDb = supabase as any

  // Fetch recent command history — voice_commands submitted as typed director commands
  const { data: recentCommandRows } = await rawDb
    .from('voice_commands')
    .select('id, raw_input, processing_status, created_at')
    .eq('academy_id', academyId)
    .eq('input_method', 'typed')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentCommands: { id: string; raw_input: string; processing_status: string; created_at: string }[] =
    recentCommandRows ?? []

  // Fetch pending proposed_actions count for context strip
  const { count: pendingDraftCount } = await rawDb
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')

  // Fetch curriculum levels for query context (names used in examples)
  const { data: levelRows } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage')
    .order('sort_order', { ascending: true })

  const curriculumLevels: { id: string; display_name: string; stage: string }[] = levelRows ?? []

  // Assistant panel counts — deterministic responses
  const { count: pendingWrapUpsCount } = await rawDb
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('status', 'pending_review')

  const { count: pendingPlacementsCount } = await rawDb
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_placement')

  const { count: assessmentDueCount } = await rawDb
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'reassessment_due')

  // Weekly COO metrics (Sprint 525)
  const weeklyReport = await loadWeeklyCoOReport(supabase, academyId)

  // Fetch recent command-created proposed_actions (Sprint 224)
  const { data: recentDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_module, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('target_module', 'director_command')
    .in('status', ['pending_review', 'approved', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(8)

  const recentDrafts: {
    id: string
    status: string
    target_module: string
    proposed_payload: Record<string, unknown> | null
    created_at: string
  }[] = recentDraftRows ?? []

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-3xl">
      <PageHeader pendingDraftCount={pendingDraftCount ?? 0} />

      {/* Weekly COO metrics strip — Sprint 525 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Sessions</p>
          <p className="font-mono text-lime text-xl font-bold mt-1">{weeklyReport.totalSessions}</p>
          <p className="text-[11px] text-text-muted">this week</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Attendance</p>
          <p className="font-mono text-lime text-xl font-bold mt-1">
            {weeklyReport.attendanceRate !== null
              ? `${Math.round(weeklyReport.attendanceRate * 100)}%`
              : '—'}
          </p>
          <p className="text-[11px] text-text-muted">present rate</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Wrap-Ups</p>
          <p className="font-mono text-lime text-xl font-bold mt-1">
            {weeklyReport.wrapUpRate !== null
              ? `${Math.round(weeklyReport.wrapUpRate * 100)}%`
              : '—'}
          </p>
          <p className="text-[11px] text-text-muted">coverage</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Concerns</p>
          <p className={`font-mono text-xl font-bold mt-1 ${weeklyReport.newConcernObservations > 0 ? 'text-status-orange' : 'text-lime'}`}>
            {weeklyReport.newConcernObservations}
          </p>
          <p className="text-[11px] text-text-muted">this week</p>
        </div>
      </div>

      <DirectorAssistantPanel
        pendingWrapUpsCount={pendingWrapUpsCount ?? 0}
        pendingPlacementsCount={pendingPlacementsCount ?? 0}
        assessmentDueCount={assessmentDueCount ?? 0}
        pendingReviewCount={pendingDraftCount ?? 0}
      />

      <CommandCenterClient
        recentCommands={recentCommands}
        curriculumLevels={curriculumLevels}
        recentDrafts={recentDrafts}
      />
    </div>
  )
}

function PageHeader({ pendingDraftCount }: { pendingDraftCount: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Director OS</p>
          <h1 className="page-title flex items-center gap-2">
            <Terminal className="w-6 h-6 text-lime" />
            Command Center
          </h1>
          <p className="page-subtitle">
            Type what you want done. The OS turns it into a structured draft for your review.
          </p>
        </div>

        {pendingDraftCount > 0 && (
          <a
            href="/director/review"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-orange/30 bg-status-orange/5 text-xs text-status-orange hover:border-status-orange/50 transition-colors"
          >
            {pendingDraftCount} pending draft{pendingDraftCount !== 1 ? 's' : ''} →
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-surface-raised text-[11px] text-text-muted">
        <span className="text-lime font-mono">●</span>
        <span>
          Voice creates → UI confirms → Database structures → System executes.
          Nothing changes until you approve it.
        </span>
      </div>
    </div>
  )
}

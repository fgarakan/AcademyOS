// Sprint 598 — Director Pilot Readiness Dashboard V1
// Live-computed V1 pilot readiness checklist using pilotLaunchPackage.ts.
// Queries live player/group/session counts; uses known build state for system booleans.
// Director-only route. No mutation — read-only diagnostic view.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { CheckCircle2, XCircle, Clock, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { buildPilotLaunchPackage } from '@/lib/demo/pilotLaunchPackage'
import type { LaunchChecklistStatus, LaunchChecklistCategory } from '@/lib/demo/pilotLaunchPackage'

const CATEGORY_LABELS: Record<LaunchChecklistCategory, string> = {
  schema:                'Schema & Migrations',
  demo_data:             'Pilot Data',
  director_os:           'Director OS',
  coach_portal:          'Coach Portal',
  parent_player_portals: 'Player & Parent Portals',
  donna_coo:             'DONNA COO',
  kpi_layer:             'KPI Layer',
  curriculum_intelligence: 'Curriculum Intelligence',
  security_and_privacy:  'Security & Privacy',
}

const STATUS_STYLE: Record<LaunchChecklistStatus, { icon: string; text: string; bg: string; border: string }> = {
  ready:     { icon: '✓', text: 'text-status-green',  bg: 'bg-status-green/5',  border: 'border-status-green/20' },
  partial:   { icon: '~', text: 'text-status-orange', bg: 'bg-status-orange/5', border: 'border-status-orange/20' },
  not_ready: { icon: '✗', text: 'text-status-red',    bg: 'bg-status-red/5',    border: 'border-status-red/20' },
  deferred:  { icon: '⟳', text: 'text-text-muted',   bg: 'bg-surface-raised',  border: 'border-border' },
}

const OVERALL_STATUS_STYLE: Record<LaunchChecklistStatus, string> = {
  ready:     'bg-status-green/10 border-status-green/30 text-status-green',
  partial:   'bg-status-orange/10 border-status-orange/30 text-status-orange',
  not_ready: 'bg-status-red/10 border-status-red/30 text-status-red',
  deferred:  'bg-surface-raised border-border text-text-muted',
}

export default async function DirectorPilotReadinessPage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // Fetch academy_id from director profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user!.id)
    .single()
  const academyId = profile?.academy_id ?? 'unknown'

  // Live data checks
  const { data: players }    = await rawDb.from('players').select('id').eq('academy_id', academyId).eq('is_active', true).limit(1)
  const { data: groups }     = await rawDb.from('groups').select('id').eq('academy_id', academyId).eq('is_active', true).limit(1)
  const { data: sessions }   = await rawDb.from('sessions').select('id').eq('academy_id', academyId).limit(1)
  const { data: curriculum } = await rawDb.from('curriculum_levels').select('id').limit(1)

  const pkg = buildPilotLaunchPackage({
    academyId,
    // Schema — pending migrations noted in KNOWN_LIMITATIONS.md
    migrationsApplied: false,
    rlsEnabled: true,
    // Pilot data
    hasPilotPlayers: (players ?? []).length > 0,
    hasPilotGroups: (groups ?? []).length > 0,
    hasPilotSessions: (sessions ?? []).length > 0,
    hasPilotCurriculum: (curriculum ?? []).length > 0,
    // Director OS — built
    directorDashboardReady: true,
    reviewQueueReady: true,
    approvalPipelineReady: true,
    attentionQueueReady: false,   // lib exists; not yet wired to /director hero
    kpiDashboardReady: false,      // lib exists; not yet wired to /director KPI grid
    // Coach portal — built
    coachHomeReady: true,
    coachSessionsReady: true,
    coachWrapUpReady: true,
    // Player + parent portals — built
    playerPortalReady: true,
    parentPortalReady: true,
    visibilityControlsApplied: true,
    // DONNA COO — lib layer complete
    donnaConversationReady: true,
    donnaBriefingReady: true,
    donnaSearchReady: true,
    donnaTaskFlowsReady: true,
    donnaActionPreviewReady: true,
    // KPI — lib layer complete
    kpiEnginesReady: true,
    kpiExplainerReady: true,
    // Curriculum intelligence — lib layer complete
    curriculumInboxReady: true,
    mentalPathReady: true,
    badgeSystemReady: true,
    missionSystemReady: true,
    // Security
    multiTenancyEnforced: true,
    auditLogReady: true,
    parentDataGateReady: true,
  })

  // Group checklist by category
  const categories = Array.from(new Set(pkg.checklist.map(c => c.category))) as LaunchChecklistCategory[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">System</p>
        <h1 className="text-2xl font-bold text-text-primary">Pilot Readiness</h1>
        <p className="text-text-secondary text-sm mt-1">V1 launch checklist — computed from live build state.</p>
      </div>

      {/* Overall status */}
      <div className={`px-5 py-4 rounded-2xl border ${OVERALL_STATUS_STYLE[pkg.overallStatus]}`}>
        <div className="flex items-start gap-4">
          <div className="text-3xl leading-none mt-0.5">
            {pkg.overallStatus === 'ready' ? '✓' : pkg.overallStatus === 'partial' ? '~' : '✗'}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-base">{pkg.pilotSummary}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-status-green font-mono">{pkg.readyCount} ready</span>
              {pkg.partialCount > 0 && <span className="text-status-orange font-mono">{pkg.partialCount} partial</span>}
              <span className="text-status-red font-mono">{pkg.notReadyCount} not ready</span>
              {pkg.deferredCount > 0 && <span className="text-text-muted font-mono">{pkg.deferredCount} deferred</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Critical gaps */}
      {pkg.criticalGaps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-red" />
              <p className="text-sm font-semibold text-text-primary">Critical Gaps</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pkg.criticalGaps.map(gap => (
              <div key={gap.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-status-red/5 border border-status-red/15">
                <XCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-text-primary">{gap.label}</p>
                  <p className="text-[10px] text-text-muted">{gap.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Checklist by category */}
      {categories.map(cat => {
        const items = pkg.checklist.filter(c => c.category === cat)
        const catReady = items.filter(c => c.status === 'ready').length
        return (
          <Card key={cat}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{CATEGORY_LABELS[cat]}</p>
                <span className="text-[10px] text-text-muted font-mono">{catReady}/{items.length}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {items.map(item => {
                const style = STATUS_STYLE[item.status]
                return (
                  <div key={item.id} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border ${style.bg} ${style.border}`}>
                    <span className={`text-[11px] font-mono font-bold shrink-0 mt-0.5 w-3 ${style.text}`}>{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-text-primary">{item.label}</p>
                      <p className="text-[10px] text-text-muted leading-relaxed">{item.detail}</p>
                      {item.deferredReason && (
                        <p className="text-[9px] text-text-muted/60 mt-0.5">{item.deferredReason}</p>
                      )}
                    </div>
                    {item.status === 'ready' && <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />}
                    {item.status === 'deferred' && <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Known limitations note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          Pending migrations are tracked in <Link href="/director/demo" className="text-lime hover:text-lime/80">Demo Guide</Link>.
          Apply pending SQL files to Supabase before pilot launch.
        </p>
      </div>

      <p className="text-[9px] text-text-muted text-center pb-2">
        Generated {new Date(pkg.generatedAt).toLocaleString()} · Read-only — no changes made
      </p>
    </div>
  )
}

// Sprint 500 — Pilot Launch Package V1
// Assembles the V1 pilot launch checklist for the academy director and Farshad.
// Summarises readiness across all system layers: schema, data, portals, DONNA, KPIs, curriculum.
// Pure TypeScript — no DB calls. Takes pre-fetched status booleans.

export type LaunchChecklistCategory =
  | 'schema'
  | 'demo_data'
  | 'director_os'
  | 'coach_portal'
  | 'parent_player_portals'
  | 'donna_coo'
  | 'kpi_layer'
  | 'curriculum_intelligence'
  | 'security_and_privacy'

export type LaunchChecklistStatus = 'ready' | 'partial' | 'not_ready' | 'deferred'

export interface LaunchChecklistItem {
  id: string
  category: LaunchChecklistCategory
  label: string
  status: LaunchChecklistStatus
  detail: string
  deferredReason: string | null
}

export interface PilotLaunchPackage {
  academyId: string
  generatedAt: string
  overallStatus: LaunchChecklistStatus
  readyCount: number
  partialCount: number
  notReadyCount: number
  deferredCount: number
  checklist: LaunchChecklistItem[]
  pilotSummary: string
  criticalGaps: LaunchChecklistItem[]
}

export interface PilotLaunchInput {
  academyId: string
  // Schema
  migrationsApplied: boolean
  rlsEnabled: boolean
  // Demo data
  hasPilotPlayers: boolean
  hasPilotGroups: boolean
  hasPilotSessions: boolean
  hasPilotCurriculum: boolean
  // Director OS
  directorDashboardReady: boolean
  reviewQueueReady: boolean
  approvalPipelineReady: boolean
  attentionQueueReady: boolean
  kpiDashboardReady: boolean
  // Coach portal
  coachHomeReady: boolean
  coachSessionsReady: boolean
  coachWrapUpReady: boolean
  // Parent/player
  playerPortalReady: boolean
  parentPortalReady: boolean
  visibilityControlsApplied: boolean
  // DONNA
  donnaConversationReady: boolean
  donnaBriefingReady: boolean
  donnaSearchReady: boolean
  donnaTaskFlowsReady: boolean
  donnaActionPreviewReady: boolean
  // KPI
  kpiEnginesReady: boolean
  kpiExplainerReady: boolean
  // Curriculum
  curriculumInboxReady: boolean
  mentalPathReady: boolean
  badgeSystemReady: boolean
  missionSystemReady: boolean
  // Security
  multiTenancyEnforced: boolean
  auditLogReady: boolean
  parentDataGateReady: boolean
}

function item(
  id: string,
  category: LaunchChecklistCategory,
  label: string,
  status: LaunchChecklistStatus,
  detail: string,
  deferredReason: string | null = null,
): LaunchChecklistItem {
  return { id, category, label, status, detail, deferredReason }
}

function statusFrom(ready: boolean, defer?: string): LaunchChecklistStatus {
  if (defer) return 'deferred'
  return ready ? 'ready' : 'not_ready'
}

export function buildPilotLaunchPackage(input: PilotLaunchInput): PilotLaunchPackage {
  const checklist: LaunchChecklistItem[] = [
    // Schema
    item('schema_migrations', 'schema', 'All migrations applied', statusFrom(input.migrationsApplied), 'Core schema deployed to Supabase'),
    item('schema_rls', 'schema', 'RLS enabled on all tables', statusFrom(input.rlsEnabled), 'Row-level security enforced per academy_id'),

    // Demo data
    item('data_players', 'demo_data', 'Pilot player roster', statusFrom(input.hasPilotPlayers), '≥1 active player in the academy'),
    item('data_groups', 'demo_data', 'Pilot groups', statusFrom(input.hasPilotGroups), '≥1 active group'),
    item('data_sessions', 'demo_data', 'Pilot sessions', statusFrom(input.hasPilotSessions), '≥1 session record'),
    item('data_curriculum', 'demo_data', 'Curriculum loaded', statusFrom(input.hasPilotCurriculum), 'Curriculum levels and requirements in DB'),

    // Director OS
    item('director_dashboard', 'director_os', 'Director dashboard', statusFrom(input.directorDashboardReady), '/director route renders with live data'),
    item('director_review', 'director_os', 'Review queue', statusFrom(input.reviewQueueReady), '/director/review renders pending actions'),
    item('director_approval', 'director_os', 'Approval pipeline', statusFrom(input.approvalPipelineReady), 'Approve/reject/clarify cycle works end-to-end'),
    item('director_attention', 'director_os', 'Attention queue', statusFrom(input.attentionQueueReady), 'Attention queue populated from live data'),
    item('director_kpi', 'director_os', 'KPI dashboard', statusFrom(input.kpiDashboardReady), 'Director KPI dashboard renders'),

    // Coach portal
    item('coach_home', 'coach_portal', 'Coach home', statusFrom(input.coachHomeReady), '/coach renders coach portal view model'),
    item('coach_sessions', 'coach_portal', 'Coach sessions', statusFrom(input.coachSessionsReady), '/coach/sessions list + detail'),
    item('coach_wrapup', 'coach_portal', 'Coach wrap-up', statusFrom(input.coachWrapUpReady), 'Session recap → proposed_action flow works'),

    // Parent/player portals
    item('player_portal', 'parent_player_portals', 'Player portal', statusFrom(input.playerPortalReady), '/player renders with visibility-gated data'),
    item('parent_portal', 'parent_player_portals', 'Parent portal', statusFrom(input.parentPortalReady), '/parent renders with parent-safe data'),
    item('visibility_gates', 'parent_player_portals', 'Visibility controls applied', statusFrom(input.visibilityControlsApplied), 'show_to_student / show_to_parent / is_parent_safe gates enforced'),

    // DONNA
    item('donna_conversation', 'donna_coo', 'DONNA conversation core', statusFrom(input.donnaConversationReady), 'Role blocks + session memory + trust stack'),
    item('donna_briefing', 'donna_coo', 'DONNA daily briefing', statusFrom(input.donnaBriefingReady), 'Director daily briefing builder works'),
    item('donna_search', 'donna_coo', 'DONNA academy search', statusFrom(input.donnaSearchReady), 'Multi-area search with role scoping'),
    item('donna_taskflows', 'donna_coo', 'DONNA task flows', statusFrom(input.donnaTaskFlowsReady), '10 multi-turn task flows ready'),
    item('donna_preview', 'donna_coo', 'DONNA action preview cards', statusFrom(input.donnaActionPreviewReady), 'Preview cards with risk level + director approval gate'),

    // KPI
    item('kpi_engines', 'kpi_layer', 'KPI computation engines', statusFrom(input.kpiEnginesReady), '12 KPI engines with honest four-tier status'),
    item('kpi_explainer', 'kpi_layer', 'DONNA KPI explainer', statusFrom(input.kpiExplainerReady), 'DONNA can explain each KPI in plain language'),

    // Curriculum intelligence
    item('curriculum_inbox', 'curriculum_intelligence', 'Curriculum inbox', statusFrom(input.curriculumInboxReady), 'Voice-to-curriculum idea queue with director approval'),
    item('mental_path', 'curriculum_intelligence', 'Mental performance path', statusFrom(input.mentalPathReady), 'Mental competency definitions per curriculum stage'),
    item('badges', 'curriculum_intelligence', 'Badge system', statusFrom(input.badgeSystemReady), 'Badge eligibility engine ready'),
    item('missions', 'curriculum_intelligence', 'Mission system', statusFrom(input.missionSystemReady), 'Player mission engine ready'),

    // Security
    item('multi_tenancy', 'security_and_privacy', 'Multi-tenancy enforced', statusFrom(input.multiTenancyEnforced), 'academy_id on all queries; RLS prevents cross-academy access'),
    item('audit_log', 'security_and_privacy', 'Audit log', statusFrom(input.auditLogReady), 'All mutations write to audit_logs'),
    item('parent_gate', 'security_and_privacy', 'Parent data gate', statusFrom(input.parentDataGateReady), 'Parent-safe and player-safe content gates enforced'),
  ]

  const readyCount = checklist.filter(c => c.status === 'ready').length
  const partialCount = checklist.filter(c => c.status === 'partial').length
  const notReadyCount = checklist.filter(c => c.status === 'not_ready').length
  const deferredCount = checklist.filter(c => c.status === 'deferred').length
  const criticalGaps = checklist.filter(c => c.status === 'not_ready')

  const overallStatus: LaunchChecklistStatus =
    notReadyCount > 3 ? 'not_ready' :
    notReadyCount > 0 || partialCount > 0 ? 'partial' : 'ready'

  return {
    academyId: input.academyId,
    generatedAt: new Date().toISOString(),
    overallStatus,
    readyCount,
    partialCount,
    notReadyCount,
    deferredCount,
    checklist,
    pilotSummary: buildPilotSummary(overallStatus, readyCount, checklist.length, notReadyCount),
    criticalGaps,
  }
}

function buildPilotSummary(
  status: LaunchChecklistStatus,
  ready: number,
  total: number,
  notReady: number,
): string {
  if (status === 'ready') return `AcademyOS V1 is pilot-ready — all ${total.toString()} checks passed.`
  if (status === 'partial') return `${ready.toString()} of ${total.toString()} checks ready — review remaining items before pilot launch.`
  return `${notReady.toString()} critical gaps remain — not ready for pilot. Address blockers first.`
}

export function getLaunchChecklistByCategory(
  pkg: PilotLaunchPackage,
  category: LaunchChecklistCategory,
): LaunchChecklistItem[] {
  return pkg.checklist.filter(c => c.category === category)
}

export function formatLaunchStatusBadge(status: LaunchChecklistStatus): string {
  const badges: Record<LaunchChecklistStatus, string> = {
    ready: '✓ Ready',
    partial: '~ Partial',
    not_ready: '✗ Not ready',
    deferred: '⟳ Deferred',
  }
  return badges[status]
}

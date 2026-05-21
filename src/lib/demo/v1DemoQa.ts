// Sprint 499 — V1 Demo QA Harness V1
// End-to-end demo quality checks for the AcademyOS V1 pilot.
// Extends demoReadinessChecker.ts with full system-level checks.
// Pure TypeScript — no DB calls. Takes pre-fetched status booleans.

export interface DemoQaCheck {
  id: string
  category: 'data' | 'donna' | 'portal' | 'approval' | 'curriculum' | 'kpi'
  label: string
  status: 'pass' | 'warn' | 'fail' | 'skip'
  detail: string
  isBlocker: boolean
}

export interface V1DemoQaReport {
  readyForDemo: boolean
  passCount: number
  warnCount: number
  failCount: number
  blockerCount: number
  checks: DemoQaCheck[]
  summaryLine: string
  generatedAt: string
}

export interface V1DemoQaInput {
  // Data
  hasSessionData: boolean
  hasPlayerData: boolean
  hasGroupData: boolean
  hasTemplateData: boolean
  hasCurriculumData: boolean
  hasAssessmentData: boolean
  // DONNA
  donnaConversationModuleReady: boolean
  donnaKpiModelReady: boolean
  donnaBriefingModuleReady: boolean
  donnaSearchReady: boolean
  donnaTaskFlowsReady: boolean
  // Portals
  directorPortalReady: boolean
  coachPortalReady: boolean
  playerPortalReady: boolean
  parentPortalReady: boolean
  // Approval flow
  approvalPipelineReady: boolean
  reviewQueueReady: boolean
  auditLogReady: boolean
  // KPIs
  kpiEnginesReady: boolean
  kpiDashboardReady: boolean
  // Curriculum
  curriculumInboxReady: boolean
  badgeSystemReady: boolean
  missionSystemReady: boolean
}

function makeCheck(
  id: string,
  category: DemoQaCheck['category'],
  label: string,
  passed: boolean,
  detail: string,
  isBlocker: boolean,
): DemoQaCheck {
  return {
    id,
    category,
    label,
    status: passed ? 'pass' : isBlocker ? 'fail' : 'warn',
    detail,
    isBlocker: !passed && isBlocker,
  }
}

export function buildV1DemoQaReport(input: V1DemoQaInput): V1DemoQaReport {
  const checks: DemoQaCheck[] = [
    // Data checks
    makeCheck('data_sessions', 'data', 'Session data present', input.hasSessionData, 'At least one session in the academy', true),
    makeCheck('data_players', 'data', 'Player data present', input.hasPlayerData, 'At least one active player', true),
    makeCheck('data_groups', 'data', 'Group data present', input.hasGroupData, 'At least one active group', true),
    makeCheck('data_templates', 'data', 'Template data present', input.hasTemplateData, 'At least one published template', false),
    makeCheck('data_curriculum', 'data', 'Curriculum data present', input.hasCurriculumData, 'Curriculum levels and requirements loaded', true),
    makeCheck('data_assessments', 'data', 'Assessment data present', input.hasAssessmentData, 'At least one assessment record', false),

    // DONNA checks
    makeCheck('donna_conversation', 'donna', 'DONNA conversation module', input.donnaConversationModuleReady, 'Conversation state + role blocks ready', true),
    makeCheck('donna_kpi', 'donna', 'DONNA KPI model', input.donnaKpiModelReady, 'Academy KPI model and explainer ready', false),
    makeCheck('donna_briefing', 'donna', 'DONNA director briefing', input.donnaBriefingModuleReady, 'Daily briefing builder ready', false),
    makeCheck('donna_search', 'donna', 'DONNA academy search', input.donnaSearchReady, 'Multi-area search ready', false),
    makeCheck('donna_taskflows', 'donna', 'DONNA task flows', input.donnaTaskFlowsReady, '10 multi-turn task flows ready', false),

    // Portal checks
    makeCheck('portal_director', 'portal', 'Director portal ready', input.directorPortalReady, '/director route functional', true),
    makeCheck('portal_coach', 'portal', 'Coach portal ready', input.coachPortalReady, '/coach route functional', true),
    makeCheck('portal_player', 'portal', 'Player portal ready', input.playerPortalReady, '/player route functional', false),
    makeCheck('portal_parent', 'portal', 'Parent portal ready', input.parentPortalReady, '/parent route functional', false),

    // Approval flow checks
    makeCheck('approval_pipeline', 'approval', 'Approval pipeline ready', input.approvalPipelineReady, 'proposed_actions creation and approval flow', true),
    makeCheck('approval_queue', 'approval', 'Review queue ready', input.reviewQueueReady, 'Director review queue renders', true),
    makeCheck('approval_audit', 'approval', 'Audit log ready', input.auditLogReady, 'Mutations write to audit_logs', true),

    // KPI checks
    makeCheck('kpi_engines', 'kpi', 'KPI computation engines', input.kpiEnginesReady, '12 KPI engines loaded', false),
    makeCheck('kpi_dashboard', 'kpi', 'KPI dashboard builder', input.kpiDashboardReady, 'Dashboard view model builder ready', false),

    // Curriculum checks
    makeCheck('curriculum_inbox', 'curriculum', 'Curriculum inbox ready', input.curriculumInboxReady, 'Idea review queue for voice-to-curriculum', false),
    makeCheck('badge_system', 'curriculum', 'Badge system ready', input.badgeSystemReady, 'Badge eligibility engine ready', false),
    makeCheck('mission_system', 'curriculum', 'Mission system ready', input.missionSystemReady, 'Player mission engine ready', false),
  ]

  const passCount = checks.filter(c => c.status === 'pass').length
  const warnCount = checks.filter(c => c.status === 'warn').length
  const failCount = checks.filter(c => c.status === 'fail').length
  const blockerCount = checks.filter(c => c.isBlocker).length
  const readyForDemo = blockerCount === 0

  return {
    readyForDemo,
    passCount,
    warnCount,
    failCount,
    blockerCount,
    checks,
    summaryLine: buildQaSummaryLine(readyForDemo, passCount, warnCount, failCount, blockerCount),
    generatedAt: new Date().toISOString(),
  }
}

function buildQaSummaryLine(
  ready: boolean,
  pass: number,
  warn: number,
  fail: number,
  blockers: number,
): string {
  if (ready && warn === 0) return `All ${pass.toString()} checks passed — demo ready.`
  if (ready) return `${pass.toString()} passed, ${warn.toString()} warnings — demo ready with notes.`
  return `${blockers.toString()} blocker${blockers > 1 ? 's' : ''} preventing demo — resolve before proceeding.`
}

export function getDemoQaBlockers(report: V1DemoQaReport): DemoQaCheck[] {
  return report.checks.filter(c => c.isBlocker)
}

export function getDemoQaByCategory(
  report: V1DemoQaReport,
  category: DemoQaCheck['category'],
): DemoQaCheck[] {
  return report.checks.filter(c => c.category === category)
}

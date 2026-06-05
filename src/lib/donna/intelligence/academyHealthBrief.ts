// Sprint 1747 — Academy Health Brief V1
// Sprint 2016–2030 — Academy Health Activation V1
// Strategic synthesis: what matters, what to do first.
// Not analytics soup — the director should leave knowing their #1 next action.
//
// Two outputs:
//   buildAcademyHealthBrief — full context Q&A path (uses extended DirectorDonnaContext fields)
//   buildAcademyHealthReport — dashboard path (uses only dashboard-safe fields)
//
// Pure TypeScript. No DB calls. No mutations.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildAcademyIntelligenceReport } from '@/lib/donna/intelligence/academyIntelligenceEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthStatus = 'good' | 'watch' | 'action_needed' | 'critical'

interface HealthBriefSection {
  label:   string
  value:   string
  status:  HealthStatus
}

export interface AcademyHealthBrief {
  sections:               HealthBriefSection[]
  mainOpportunity:        string
  recommendedFirstAction: string
  recommendedRoute:       string | null
  confidence:             'high' | 'partial' | 'low'
  dataLimitations:        string[]
}

// ─── Executive Report types (Phase 6) ────────────────────────────────────────

export interface AcademyHealthSection {
  id:      string
  label:   string
  status:  HealthStatus
  summary: string
}

export interface AcademyHealthReport {
  overallStatus:       HealthStatus
  topIssue:            string | null
  topRecommendation:   string | null
  recommendedRoute:    string | null
  sections:            AcademyHealthSection[]
  evidence:            string[]
  limitations:         string[]
  confidence:          'high' | 'partial' | 'low'
}

// ─── buildAcademyHealthBrief section builders (full context path) ─────────────
// Uses extended DirectorDonnaContext fields — only safe for DONNA Q&A path.
// Do NOT call from director/page.tsx — use buildAcademyHealthReport instead.

function buildPlayerProgressSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const eligible  = ctx.advancementEligibleCount
  const stalled   = ctx.playerProgressStallCount
  const high      = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high').length
  const overdue   = ctx.assessmentCoverageGaps.filter(g => g.gapType === 'no_recent_assessment').length
  const noEvidence = ctx.eligibleWithoutAssessmentEvidence

  if (high >= 3) {
    return { label: 'Player Progress Health', value: `${high} players in high-severity long-term stalls`, status: 'critical' }
  }
  if (noEvidence > 0) {
    return { label: 'Player Progress Health', value: `${noEvidence} advancement-eligible player${noEvidence !== 1 ? 's' : ''} lack promotion-ready assessment evidence`, status: 'action_needed' }
  }
  if (stalled > 0 && overdue > 0) {
    return { label: 'Player Progress Health', value: `${stalled} stalled · ${overdue} overdue for assessment`, status: 'action_needed' }
  }
  if (stalled > 0) {
    return { label: 'Player Progress Health', value: `${stalled} stalled (${high} high-severity), none ready to advance`, status: stalled >= 3 ? 'action_needed' : 'watch' }
  }
  if (eligible > 0) {
    return { label: 'Player Progress Health', value: `${eligible} ready to advance — no stalls detected`, status: 'good' }
  }
  if (overdue > 0) {
    return { label: 'Player Progress Health', value: `${overdue} player${overdue !== 1 ? 's' : ''} overdue for assessment`, status: 'watch' }
  }
  return { label: 'Player Progress Health', value: 'No progression signals loaded', status: 'watch' }
}

function buildCurriculumHealthSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const gaps       = ctx.curriculumTemplateCoverageGapCount
  const drafts     = ctx.curriculumDraftCount
  const structural = ctx.curriculumGaps.length
  const stalled    = ctx.mostBlockedLevelStalledCount ?? 0
  const blocked    = ctx.mostBlockedLevelName ?? null
  const completion = ctx.mostBlockedLevelAvgCompletion ?? 0
  const concern    = ctx.topTaggedConcern ?? null

  if (stalled >= 3 && blocked) {
    return { label: 'Curriculum Health', value: `${blocked} — ${stalled} players stalled at ${completion}% completion`, status: 'critical' }
  }

  const parts: string[] = []
  if (stalled > 0 && blocked) parts.push(`${blocked} — ${stalled} player${stalled !== 1 ? 's' : ''} stalled at ${completion}% completion`)
  if (concern) parts.push(`top concern: ${concern}`)
  if (gaps > 0) parts.push(`${gaps} level${gaps !== 1 ? 's' : ''} without template`)
  if (structural > 0) parts.push(`${structural} structural gap${structural !== 1 ? 's' : ''}`)
  if (drafts > 0) parts.push(`${drafts} pending draft${drafts !== 1 ? 's' : ''}`)

  if (parts.length === 0) return { label: 'Curriculum Health', value: 'No gaps detected', status: 'good' }
  const status: HealthStatus = (stalled > 0 && blocked) || gaps > 0 || structural > 0 ? 'action_needed' : 'watch'
  return { label: 'Curriculum Health', value: parts.join(' · '), status }
}

function buildReviewApprovalSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const pending = ctx.pendingReviews
  const oldest  = ctx.oldestPendingReviewAgeDays

  if (oldest !== null && oldest >= 14) {
    return { label: 'Review & Approval Health', value: `${pending} pending — oldest item ${oldest} days old`, status: 'critical' }
  }
  if (pending === 0) return { label: 'Review & Approval Health', value: 'No pending items', status: 'good' }
  const ageNote = oldest !== null && oldest >= 7 ? ` (oldest: ${oldest}d)` : ''
  return {
    label:  'Review & Approval Health',
    value:  `${pending} pending item${pending !== 1 ? 's' : ''}${ageNote}`,
    status: pending >= 5 ? 'action_needed' : 'watch',
  }
}

function buildCoachExecutionSection(ctx: DirectorDonnaContext): HealthBriefSection {
  if (ctx.todaySessions === 0) return { label: 'Coach Execution Health', value: 'No sessions today', status: 'good' }
  const missing = ctx.missingWrapUps
  const total   = ctx.todaySessions
  if (missing === 0) return { label: 'Coach Execution Health', value: `All ${total} session${total !== 1 ? 's' : ''} wrapped up`, status: 'good' }
  const pct = Math.round(((total - missing) / total) * 100)
  const status: HealthStatus = missing >= 5 ? 'critical' : missing >= 3 ? 'action_needed' : 'watch'
  return { label: 'Coach Execution Health', value: `${missing} of ${total} wrap-ups missing (${pct}% complete)`, status }
}

function buildParentCommunicationSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const highRisk   = ctx.highRiskPlayerCount
  const medRisk    = ctx.mediumRiskPlayerCount
  const attendance = ctx.attendanceExceptions

  if (highRisk >= 3) {
    return { label: 'Parent Communication Health', value: `${highRisk} players with high-risk flags — parent outreach recommended`, status: 'action_needed' }
  }
  if (highRisk > 0 || attendance > 0) {
    const parts: string[] = []
    if (highRisk > 0) parts.push(`${highRisk} high-risk player${highRisk !== 1 ? 's' : ''}`)
    if (attendance > 0) parts.push(`${attendance} attendance exception${attendance !== 1 ? 's' : ''}`)
    return { label: 'Parent Communication Health', value: parts.join(' · '), status: 'watch' }
  }
  if (medRisk > 0) {
    return { label: 'Parent Communication Health', value: `${medRisk} player${medRisk !== 1 ? 's' : ''} on watch — no urgent outreach needed`, status: 'watch' }
  }
  return { label: 'Parent Communication Health', value: 'No active parent communication signals', status: 'good' }
}

function buildOnboardingSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const level = ctx.onboardingReadinessLevel
  switch (level) {
    case 'not_started':
      return { label: 'Onboarding Health', value: 'Academy not yet set up — no players, templates, or sessions', status: 'critical' }
    case 'partial':
      return { label: 'Onboarding Health', value: 'Setup incomplete — players or class templates still missing', status: 'action_needed' }
    case 'nearly_ready':
      return { label: 'Onboarding Health', value: 'Players and templates ready — no sessions scheduled yet', status: 'watch' }
    case 'ready_signal':
      return { label: 'Onboarding Health', value: 'Academy is fully operational', status: 'good' }
    default:
      return { label: 'Onboarding Health', value: 'Onboarding status unavailable', status: 'watch' }
  }
}

// ─── Opportunity + first action ───────────────────────────────────────────────

function deriveOpportunityAndAction(
  ctx: DirectorDonnaContext,
  sections: HealthBriefSection[],
): { opportunity: string; action: string; route: string | null } {
  const criticals = sections.filter(s => s.status === 'critical')
  const actionsNeeded = sections.filter(s => s.status === 'action_needed')

  if (criticals.length > 0) {
    const top = criticals[0]
    return {
      opportunity: `Critical issue in ${top.label.toLowerCase()}: ${top.value}`,
      action:      `Resolve this immediately — it is the highest-severity item in your academy.`,
      route:       '/director/review',
    }
  }
  if (ctx.pendingReviews >= 5 || (ctx.oldestPendingReviewAgeDays ?? 0) >= 14) {
    return {
      opportunity: 'Clear the review queue — coaches and parents may be waiting on decisions.',
      action:      `Review the ${ctx.pendingReviews} pending item${ctx.pendingReviews !== 1 ? 's' : ''} in the Review Center.`,
      route:       '/director/review',
    }
  }
  if (ctx.eligibleWithoutAssessmentEvidence > 0) {
    return {
      opportunity: `${ctx.eligibleWithoutAssessmentEvidence} player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's are' : ' is'} ready to advance but lack promotion-ready assessment evidence.`,
      action:      'Schedule assessments for advancement-eligible players before confirming level changes.',
      route:       '/director/players',
    }
  }
  if (ctx.advancementEligibleCount > 0) {
    return {
      opportunity: `${ctx.advancementEligibleCount} player${ctx.advancementEligibleCount !== 1 ? 's are' : ' is'} ready to advance.`,
      action:      'Review each eligible player\'s profile and confirm or defer advancement.',
      route:       '/director/players',
    }
  }
  if (ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high').length >= 2) {
    const n = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high').length
    return {
      opportunity: `${n} players in long-term stalls — review gate evidence to unblock them or identify curriculum gaps.`,
      action:      'Open each high-severity stalled player\'s profile and review gate evidence.',
      route:       '/director/players',
    }
  }
  if (ctx.curriculumTemplateCoverageGapCount > 0) {
    return {
      opportunity: `${ctx.curriculumTemplateCoverageGapCount} curriculum level${ctx.curriculumTemplateCoverageGapCount !== 1 ? 's' : ''} have active players but no class template.`,
      action:      'Assign class templates to the affected levels from the Templates section.',
      route:       '/director/templates',
    }
  }
  if (ctx.missingWrapUps > 0) {
    return {
      opportunity: 'Coach wrap-ups are missing for today\'s sessions — player observations aren\'t flowing in.',
      action:      `Follow up on ${ctx.missingWrapUps} missing wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} in the Sessions list.`,
      route:       '/director/sessions',
    }
  }
  if (actionsNeeded.length === 0) {
    return {
      opportunity: 'Academy signals are broadly healthy.',
      action:      'Continue monitoring assessment cadence and coach wrap-up coverage.',
      route:       null,
    }
  }
  return {
    opportunity: `${actionsNeeded.length} area${actionsNeeded.length !== 1 ? 's' : ''} need attention: ${actionsNeeded.map(s => s.label).join(', ')}.`,
    action:      `Start with: ${actionsNeeded[0].label} — ${actionsNeeded[0].value}.`,
    route:       '/director/review',
  }
}

// ─── buildAcademyHealthBrief (full context Q&A path) ─────────────────────────

export function buildAcademyHealthBrief(ctx: DirectorDonnaContext): AcademyHealthBrief {
  const sections: HealthBriefSection[] = [
    buildCurriculumHealthSection(ctx),
    buildPlayerProgressSection(ctx),
    buildReviewApprovalSection(ctx),
    buildCoachExecutionSection(ctx),
    buildParentCommunicationSection(ctx),
    buildOnboardingSection(ctx),
  ]

  const { opportunity, action, route } = deriveOpportunityAndAction(ctx, sections)

  const confidence = ctx.isLive ? 'high' : 'partial'

  const rosterSize = ctx.playerCurriculumStateSummaries?.length ?? 0
  const limitations: string[] = []
  if (rosterSize < (ctx.playerCount ?? 0)) {
    limitations.push(`Player analysis uses ${rosterSize} of ${ctx.playerCount} active players.`)
  }
  if (!ctx.playerProgressStallContextAvailable) {
    limitations.push('Player progress stall data may be incomplete.')
  }
  limitations.push('No month-over-month history — brief reflects current state only.')

  return {
    sections,
    mainOpportunity:        opportunity,
    recommendedFirstAction: action,
    recommendedRoute:       route,
    confidence,
    dataLimitations:        limitations,
  }
}

export function buildAcademyHealthBriefAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const brief = buildAcademyHealthBrief(ctx)
  const lines: string[] = []

  lines.push('**Observation:**')
  lines.push('Academy health brief — current state across all operational areas.')
  lines.push('')

  const statusIcon: Record<HealthStatus, string> = {
    critical:      '🚨',
    action_needed: '🔴',
    watch:         '🟡',
    good:          '✅',
  }

  for (const s of brief.sections) {
    lines.push(`${statusIcon[s.status]} **${s.label}:** ${s.value}`)
  }

  lines.push('')
  lines.push(`**Confidence:** ${brief.confidence === 'high' ? 'High' : 'Medium'}`)
  lines.push('')
  lines.push('**Evidence:**')
  lines.push(`• ${ctx.playerCount ?? 0} active players, ${ctx.coachCount ?? 0} coaches`)
  lines.push(`• ${ctx.pendingReviews} pending reviews, ${ctx.todaySessions} sessions today`)
  lines.push(`• ${ctx.advancementEligibleCount} advancement-eligible, ${ctx.playerProgressStallCount} stalled`)
  lines.push('')
  lines.push('**Limitations:**')
  for (const lim of brief.dataLimitations) {
    lines.push(`• ${lim}`)
  }
  lines.push('')
  lines.push('**Main Opportunity:**')
  lines.push(brief.mainOpportunity)
  lines.push('')
  lines.push('**Recommended First Action:**')
  lines.push(brief.recommendedFirstAction)

  return {
    actionId:    'academy_health_brief',
    text:        lines.join('\n'),
    confidence:  brief.confidence === 'high' ? 'high' : 'partial',
    sourceNote:  'All loaded academy context — current state snapshot',
    followUp:    brief.recommendedRoute ? 'Take me there' : null,
    href:        brief.recommendedRoute,
    isAnswerable: true,
  }
}

// ─── buildAcademyHealthReport (dashboard path) ───────────────────────────────
// Uses ONLY fields available on the director dashboard path (via buildDashboardAttentionContext).
// Safe to call from director/page.tsx. Does NOT call buildAcademyHealthBrief.

function reportCurriculumSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  const stalled    = ctx.mostBlockedLevelStalledCount ?? 0
  const blocked    = ctx.mostBlockedLevelName ?? null
  const completion = ctx.mostBlockedLevelAvgCompletion ?? 0
  const gaps       = ctx.curriculumTemplateCoverageGapCount
  const structural = ctx.curriculumGaps?.length ?? 0
  const concern    = ctx.topTaggedConcern ?? null

  if (stalled >= 3 && blocked) {
    return { id: 'curriculum', label: 'Curriculum Health', status: 'critical', summary: `${blocked} — ${stalled} players stalled at ${completion}% completion` }
  }
  const parts: string[] = []
  if (stalled > 0 && blocked) parts.push(`${blocked} — ${stalled} player${stalled !== 1 ? 's' : ''} stalled at ${completion}%`)
  if (concern) parts.push(`top concern: ${concern}`)
  if (gaps > 0) parts.push(`${gaps} level${gaps !== 1 ? 's' : ''} without template`)
  if (structural > 0) parts.push(`${structural} structural gap${structural !== 1 ? 's' : ''}`)
  if (parts.length === 0) return { id: 'curriculum', label: 'Curriculum Health', status: 'good', summary: 'No curriculum gaps detected' }
  const status: HealthStatus = (stalled > 0 && blocked) || gaps > 0 || structural > 0 ? 'action_needed' : 'watch'
  return { id: 'curriculum', label: 'Curriculum Health', status, summary: parts.join(' · ') }
}

function reportPlayerProgressSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  const stalled  = ctx.playerProgressStallCount
  const high     = (ctx.playerProgressStalls ?? []).filter(s => s.stallSeverity === 'high').length
  const eligible = ctx.advancementEligibleCount
  const overdue  = (ctx.assessmentCoverageGaps ?? []).filter(g => g.gapType === 'no_recent_assessment').length

  if (high >= 3) return { id: 'player_progress', label: 'Player Progress Health', status: 'critical', summary: `${high} players in high-severity long-term stalls` }
  if (stalled > 0 && overdue > 0) return { id: 'player_progress', label: 'Player Progress Health', status: 'action_needed', summary: `${stalled} stalled · ${overdue} overdue for assessment` }
  if (stalled >= 3) return { id: 'player_progress', label: 'Player Progress Health', status: 'action_needed', summary: `${stalled} stalled (${high} high-severity)` }
  if (stalled > 0) return { id: 'player_progress', label: 'Player Progress Health', status: 'watch', summary: `${stalled} stalled · ${eligible} ready to advance` }
  if (eligible > 0) return { id: 'player_progress', label: 'Player Progress Health', status: 'good', summary: `${eligible} ready to advance — no stalls` }
  return { id: 'player_progress', label: 'Player Progress Health', status: 'watch', summary: 'No progression signals available' }
}

function reportReviewApprovalSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  const pending = ctx.pendingReviews
  const oldest  = ctx.oldestPendingReviewAgeDays

  if (oldest !== null && oldest >= 14) return { id: 'review_approval', label: 'Review & Approval Health', status: 'critical', summary: `${pending} pending — oldest item ${oldest} days old` }
  if (pending === 0) return { id: 'review_approval', label: 'Review & Approval Health', status: 'good', summary: 'No pending items' }
  const ageNote = oldest !== null && oldest >= 7 ? ` (oldest: ${oldest}d)` : ''
  const status: HealthStatus = pending >= 5 || (oldest !== null && oldest >= 7) ? 'action_needed' : 'watch'
  return { id: 'review_approval', label: 'Review & Approval Health', status, summary: `${pending} pending item${pending !== 1 ? 's' : ''}${ageNote}` }
}

function reportCoachExecutionSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  const missing = ctx.missingWrapUps
  const total   = ctx.todaySessions
  if (total === 0) return { id: 'coach_execution', label: 'Coach Execution Health', status: 'good', summary: 'No sessions today' }
  if (missing === 0) return { id: 'coach_execution', label: 'Coach Execution Health', status: 'good', summary: `All ${total} session${total !== 1 ? 's' : ''} wrapped up` }
  const pct = Math.round(((total - missing) / total) * 100)
  const status: HealthStatus = missing >= 5 ? 'critical' : missing >= 3 ? 'action_needed' : 'watch'
  return { id: 'coach_execution', label: 'Coach Execution Health', status, summary: `${missing} of ${total} wrap-ups missing (${pct}% complete)` }
}

function reportParentCommunicationSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  const highRisk   = ctx.highRiskPlayerCount
  const attendance = ctx.attendanceExceptions

  if (highRisk >= 3) return { id: 'parent_communication', label: 'Parent Communication Health', status: 'action_needed', summary: `${highRisk} players with high-risk flags — parent outreach recommended` }
  if (highRisk > 0 || attendance > 0) {
    const parts: string[] = []
    if (highRisk > 0) parts.push(`${highRisk} high-risk player${highRisk !== 1 ? 's' : ''}`)
    if (attendance > 0) parts.push(`${attendance} attendance exception${attendance !== 1 ? 's' : ''}`)
    return { id: 'parent_communication', label: 'Parent Communication Health', status: 'watch', summary: parts.join(' · ') }
  }
  return { id: 'parent_communication', label: 'Parent Communication Health', status: 'good', summary: 'No active parent communication signals' }
}

function reportOnboardingSection(ctx: DirectorDonnaContext): AcademyHealthSection {
  switch (ctx.onboardingReadinessLevel) {
    case 'not_started': return { id: 'onboarding', label: 'Onboarding Health', status: 'critical', summary: 'Academy not yet set up — no players, templates, or sessions' }
    case 'partial':     return { id: 'onboarding', label: 'Onboarding Health', status: 'action_needed', summary: 'Setup incomplete — players or class templates still missing' }
    case 'nearly_ready': return { id: 'onboarding', label: 'Onboarding Health', status: 'watch', summary: 'Players and templates ready — no sessions scheduled yet' }
    case 'ready_signal': return { id: 'onboarding', label: 'Onboarding Health', status: 'good', summary: 'Academy is fully operational' }
    default:            return { id: 'onboarding', label: 'Onboarding Health', status: 'watch', summary: 'Onboarding status unavailable' }
  }
}

const STATUS_RANK: Record<HealthStatus, number> = { critical: 3, action_needed: 2, watch: 1, good: 0 }

export function buildAcademyHealthReport(ctx: DirectorDonnaContext): AcademyHealthReport {
  const sections: AcademyHealthSection[] = [
    reportCurriculumSection(ctx),
    reportPlayerProgressSection(ctx),
    reportReviewApprovalSection(ctx),
    reportCoachExecutionSection(ctx),
    reportParentCommunicationSection(ctx),
    reportOnboardingSection(ctx),
  ]

  const worstRank = sections.reduce((max, s) => Math.max(max, STATUS_RANK[s.status]), 0)
  const overallStatus: HealthStatus =
    worstRank === 3 ? 'critical' :
    worstRank === 2 ? 'action_needed' :
    worstRank === 1 ? 'watch' :
    'good'

  const urgentSection = sections.find(s => s.status === 'critical' || s.status === 'action_needed')
  const topIssue = urgentSection?.summary ?? null
  const topRecommendation = urgentSection
    ? deriveReportRecommendation(ctx, urgentSection)
    : null

  const recommendedRoute = urgentSection
    ? deriveReportRoute(urgentSection.id)
    : null

  const evidence: string[] = [
    `${ctx.missingWrapUps} wrap-ups missing`,
    `${ctx.pendingReviews} pending reviews`,
    `${ctx.playerProgressStallCount} players stalled`,
    `${ctx.advancementEligibleCount} ready to advance`,
  ].filter(e => !e.startsWith('0 '))

  const limitations: string[] = []
  if (!ctx.isLive) limitations.push('Academy not yet fully live — signals may be incomplete.')
  if (ctx.playerProgressStallCount > 0 && (ctx.playerProgressStalls ?? []).length === 0) {
    limitations.push('Stall details unavailable — count only.')
  }
  limitations.push('No month-over-month history — reflects current state only.')

  return {
    overallStatus,
    topIssue,
    topRecommendation,
    recommendedRoute,
    sections,
    evidence,
    limitations,
    confidence: ctx.isLive ? 'high' : 'partial',
  }
}

function deriveReportRecommendation(ctx: DirectorDonnaContext, section: AcademyHealthSection): string {
  switch (section.id) {
    case 'curriculum':
      return ctx.mostBlockedLevelKey
        ? `Review the ${ctx.mostBlockedLevelName} improvement plan and unblock stalled players.`
        : 'Review curriculum coverage and assign templates to uncovered levels.'
    case 'player_progress':
      return 'Open stalled player profiles and review gate evidence to identify the blocker.'
    case 'review_approval':
      return `Clear ${ctx.pendingReviews} pending review item${ctx.pendingReviews !== 1 ? 's' : ''} — start with the oldest.`
    case 'coach_execution':
      return `Follow up on ${ctx.missingWrapUps} missing coach wrap-up${ctx.missingWrapUps !== 1 ? 's' : ''} in Sessions.`
    case 'parent_communication':
      return 'Review high-risk player flags and determine if parent outreach is needed.'
    case 'onboarding':
      return ctx.onboardingReadinessLevel === 'not_started'
        ? 'Start by adding players and creating class templates.'
        : 'Complete the remaining setup step to make the academy fully operational.'
    default:
      return 'Review the academy dashboard for the next action.'
  }
}

function deriveReportRoute(sectionId: string): string {
  const routes: Record<string, string> = {
    curriculum:            '/director/curriculum',
    player_progress:       '/director/players',
    review_approval:       '/director/review',
    coach_execution:       '/director/sessions',
    parent_communication:  '/director/players',
    onboarding:            '/director/players',
  }
  return routes[sectionId] ?? '/director'
}

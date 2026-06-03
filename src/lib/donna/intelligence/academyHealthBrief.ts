// Sprint 1747 — Academy Health Brief V1
// Strategic synthesis: what matters, what to do first.
// Not analytics soup — the director should leave knowing their #1 next action.
//
// Structure:
//   This month: [advances, stalls, overdue assessments, coach health, curriculum, parent backlog, retention]
//   Main Opportunity: [one sentence]
//   Recommended First Action: [one clear directive]
//
// Pure TypeScript. No DB calls. No mutations.
// Every answer uses: Observation → Confidence → Evidence → Limitations → Recommendation

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildAcademyIntelligenceReport } from '@/lib/donna/intelligence/academyIntelligenceEngine'

// ─── Brief types ──────────────────────────────────────────────────────────────

interface HealthBriefSection {
  label:   string
  value:   string
  status:  'good' | 'watch' | 'action_needed'
}

export interface AcademyHealthBrief {
  sections:             HealthBriefSection[]
  mainOpportunity:      string
  recommendedFirstAction: string
  recommendedRoute:     string | null
  confidence:           'high' | 'partial' | 'low'
  dataLimitations:      string[]
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildProgressionSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const eligible = ctx.advancementEligibleCount
  const stalled  = ctx.playerProgressStallCount

  if (eligible > 0 && stalled === 0) {
    return { label: 'Player progression', value: `${eligible} ready to advance, no stalls detected`, status: 'good' }
  }
  if (eligible > 0 && stalled > 0) {
    return { label: 'Player progression', value: `${eligible} ready to advance, ${stalled} stalled`, status: 'watch' }
  }
  if (stalled > 0) {
    const high = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high').length
    return { label: 'Player progression', value: `${stalled} stalled (${high} high-severity), none ready to advance`, status: 'action_needed' }
  }
  return { label: 'Player progression', value: 'No progression signals loaded', status: 'watch' }
}

function buildAssessmentSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const overdue = ctx.assessmentCoverageGaps.filter(g => g.gapType === 'no_recent_assessment').length
  const recent  = ctx.recentAssessmentCount
  const missing = ctx.eligibleWithoutAssessmentEvidence

  if (overdue === 0 && missing === 0) {
    return { label: 'Assessment health', value: `${recent} recent, no gaps detected`, status: 'good' }
  }
  if (missing > 0) {
    return { label: 'Assessment health', value: `${missing} advancement-eligible player${missing !== 1 ? 's' : ''} lack promotion-ready evidence`, status: 'action_needed' }
  }
  return { label: 'Assessment health', value: `${overdue} player${overdue !== 1 ? 's' : ''} overdue for assessment`, status: 'watch' }
}

function buildCoachSection(ctx: DirectorDonnaContext): HealthBriefSection {
  if (ctx.todaySessions === 0) {
    return { label: 'Coach wrap-ups', value: 'No sessions today', status: 'good' }
  }
  const missing = ctx.missingWrapUps
  const total   = ctx.todaySessions
  if (missing === 0) {
    return { label: 'Coach wrap-ups', value: `All ${total} sessions wrapped up`, status: 'good' }
  }
  const pct = Math.round(((total - missing) / total) * 100)
  return { label: 'Coach wrap-ups', value: `${missing} of ${total} missing (${pct}% complete)`, status: missing >= 3 ? 'action_needed' : 'watch' }
}

function buildCurriculumSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const gaps     = ctx.curriculumTemplateCoverageGapCount
  const drafts   = ctx.curriculumDraftCount
  const structural = ctx.curriculumGaps.length

  if (gaps === 0 && structural === 0 && drafts === 0) {
    return { label: 'Curriculum health', value: 'No gaps detected', status: 'good' }
  }
  const parts: string[] = []
  if (gaps > 0)      parts.push(`${gaps} level${gaps !== 1 ? 's' : ''} without template`)
  if (structural > 0) parts.push(`${structural} structural gap${structural !== 1 ? 's' : ''}`)
  if (drafts > 0)    parts.push(`${drafts} pending draft${drafts !== 1 ? 's' : ''}`)
  return { label: 'Curriculum health', value: parts.join(', '), status: gaps > 0 || structural > 0 ? 'action_needed' : 'watch' }
}

function buildParentSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const pending  = ctx.pendingReviews
  const oldest   = ctx.oldestPendingReviewAgeDays

  if (pending === 0) {
    return { label: 'Review queue', value: 'No pending items', status: 'good' }
  }
  const ageNote = oldest !== null && oldest >= 7 ? ` (oldest: ${oldest}d)` : ''
  return {
    label:  'Review queue',
    value:  `${pending} pending item${pending !== 1 ? 's' : ''}${ageNote}`,
    status: pending >= 5 || (oldest !== null && oldest >= 14) ? 'action_needed' : 'watch',
  }
}

function buildRetentionSection(ctx: DirectorDonnaContext): HealthBriefSection {
  const highStalls    = ctx.playerProgressStalls.filter(s => s.stallSeverity === 'high').length
  const attendance    = ctx.attendanceExceptions

  if (highStalls === 0 && attendance === 0) {
    return { label: 'Retention signals', value: 'No risk signals detected', status: 'good' }
  }
  const parts: string[] = []
  if (highStalls > 0) parts.push(`${highStalls} high-severity stall${highStalls !== 1 ? 's' : ''}`)
  if (attendance > 0) parts.push(`${attendance} attendance exception${attendance !== 1 ? 's' : ''}`)
  return { label: 'Retention signals', value: parts.join(', '), status: highStalls >= 2 ? 'action_needed' : 'watch' }
}

// ─── Main opportunity + first action ─────────────────────────────────────────

function deriveOpportunityAndAction(
  ctx: DirectorDonnaContext,
  sections: HealthBriefSection[],
): { opportunity: string; action: string; route: string | null } {
  const actionNeeded = sections.filter(s => s.status === 'action_needed')

  // Priority order: review queue first (blocking coaches/parents), then progression, then assessment, then curriculum
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

  // No critical action
  if (actionNeeded.length === 0) {
    return {
      opportunity: 'Academy signals are broadly healthy.',
      action:      'Continue monitoring assessment cadence and coach wrap-up coverage.',
      route:       null,
    }
  }

  return {
    opportunity: `${actionNeeded.length} area${actionNeeded.length !== 1 ? 's' : ''} need attention: ${actionNeeded.map(s => s.label).join(', ')}.`,
    action:      `Start with: ${actionNeeded[0].label} — ${actionNeeded[0].value}.`,
    route:       '/director/review',
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildAcademyHealthBrief(ctx: DirectorDonnaContext): AcademyHealthBrief {
  const sections: HealthBriefSection[] = [
    buildProgressionSection(ctx),
    buildAssessmentSection(ctx),
    buildCoachSection(ctx),
    buildCurriculumSection(ctx),
    buildParentSection(ctx),
    buildRetentionSection(ctx),
  ]

  const { opportunity, action, route } = deriveOpportunityAndAction(ctx, sections)

  const isLive = ctx.isLive
  const confidence = isLive ? 'high' : 'partial'

  const rosterSize = ctx.playerCurriculumStateSummaries.length
  const limitations: string[] = []
  if (rosterSize < ctx.playerCount) {
    limitations.push(`Player analysis uses ${rosterSize} of ${ctx.playerCount} active players.`)
  }
  if (!ctx.playerProgressStallContextAvailable) {
    limitations.push('Player progress stall data may be incomplete.')
  }
  limitations.push('No month-over-month history — brief reflects current state only.')

  return {
    sections,
    mainOpportunity:       opportunity,
    recommendedFirstAction: action,
    recommendedRoute:      route,
    confidence,
    dataLimitations:       limitations,
  }
}

export function buildAcademyHealthBriefAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const brief = buildAcademyHealthBrief(ctx)
  const lines: string[] = []

  lines.push('**Observation:**')
  lines.push('Academy health brief — current state across all operational areas.')
  lines.push('')

  for (const s of brief.sections) {
    const icon = s.status === 'good' ? '✅' : s.status === 'watch' ? '🟡' : '🔴'
    lines.push(`${icon} **${s.label}:** ${s.value}`)
  }

  lines.push('')
  lines.push(`**Confidence:** ${brief.confidence === 'high' ? 'High' : 'Medium'}`)
  lines.push('')
  lines.push('**Evidence:**')
  lines.push(`• ${ctx.playerCount} active players, ${ctx.coachCount} coaches`)
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

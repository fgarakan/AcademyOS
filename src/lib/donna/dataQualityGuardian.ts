// Sprint 742E — DONNA Data Quality Guardian V1
// Cross-domain data completeness checker.
// Pure TypeScript — no DB calls, no mutations. Operates on DirectorDonnaContext.
//
// Surfaces data quality signals DONNA can use to honestly report health across:
//   - Player data (curriculum states, assessment coverage)
//   - Template data (unassigned templates, missing level coverage)
//   - Coach data (session coverage, missing wrap-ups)
//   - Curriculum data (structural gaps, template gaps, assessment gaps)
//   - Parent/guardian data (if available in future)
//
// Produces a ranked list of data quality issues and an overall health score.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DQDomain =
  | 'players'
  | 'curriculum'
  | 'templates'
  | 'assessments'
  | 'sessions'
  | 'coaches'
  | 'review_queue'

export type DQSeverity = 'critical' | 'warning' | 'info'

export interface DataQualitySignal {
  domain: DQDomain
  signal: string
  detail: string
  severity: DQSeverity
  recommendedAction: string
  href: string
}

export interface DataQualityReport {
  signals: DataQualitySignal[]
  criticalCount: number
  warningCount: number
  infoCount: number
  overallScore: number          // 0–100 (100 = all domains healthy)
  domainsHealthy: DQDomain[]
  domainsWithIssues: DQDomain[]
}

// ── Guardian ───────────────────────────────────────────────────────────────────

export function runDataQualityGuardian(ctx: DirectorDonnaContext): DataQualityReport {
  const signals: DataQualitySignal[] = []
  const domainsWithIssues = new Set<DQDomain>()
  const allDomains: DQDomain[] = ['players', 'curriculum', 'templates', 'assessments', 'sessions', 'coaches', 'review_queue']

  // ── Review queue ───────────────────────────────────────────────────────────

  if (ctx.pendingReviews >= 10) {
    signals.push({
      domain: 'review_queue',
      signal: 'Review backlog critical',
      detail: `${ctx.pendingReviews} items pending director decision — backlog is unusually large.`,
      severity: 'critical',
      recommendedAction: 'Clear the review queue. Coaches and players are waiting on approvals.',
      href: '/director/review',
    })
    domainsWithIssues.add('review_queue')
  } else if (ctx.pendingReviews >= 5) {
    signals.push({
      domain: 'review_queue',
      signal: 'Review queue growing',
      detail: `${ctx.pendingReviews} items awaiting director decision.`,
      severity: 'warning',
      recommendedAction: 'Review the queue before the backlog grows further.',
      href: '/director/review',
    })
    domainsWithIssues.add('review_queue')
  }

  // ── Sessions / wrap-ups ────────────────────────────────────────────────────

  if (ctx.missingWrapUps >= 3) {
    signals.push({
      domain: 'sessions',
      signal: 'Multiple sessions missing wrap-ups',
      detail: `${ctx.missingWrapUps} sessions today have no coach wrap-up. Player records cannot be updated without them.`,
      severity: 'warning',
      recommendedAction: 'Follow up with coaches to submit wrap-ups before the session data is lost.',
      href: '/director/sessions',
    })
    domainsWithIssues.add('sessions')
  } else if (ctx.missingWrapUps > 0) {
    signals.push({
      domain: 'sessions',
      signal: 'Session missing wrap-up',
      detail: `${ctx.missingWrapUps} session${ctx.missingWrapUps !== 1 ? 's' : ''} missing coach wrap-up today.`,
      severity: 'info',
      recommendedAction: 'Ask the coach to submit a wrap-up so the session is documented.',
      href: '/director/sessions',
    })
    domainsWithIssues.add('sessions')
  }

  // ── Players ────────────────────────────────────────────────────────────────

  if (ctx.playerCount === 0) {
    signals.push({
      domain: 'players',
      signal: 'No players in system',
      detail: 'No players have been added to this academy. Most DONNA intelligence requires at least some player data.',
      severity: 'critical',
      recommendedAction: 'Add players via the Players page or import from your existing roster.',
      href: '/director/onboarding/players-placement',
    })
    domainsWithIssues.add('players')
  } else if (ctx.playerProgressContextAvailable && ctx.playerCurriculumStateCount === 0) {
    signals.push({
      domain: 'players',
      signal: 'Players have no curriculum state',
      detail: `${ctx.playerCount} player${ctx.playerCount !== 1 ? 's' : ''} exist but none have a curriculum level assigned.`,
      severity: 'critical',
      recommendedAction: 'Place players through the Placement Engine to assign them curriculum levels.',
      href: '/director/players',
    })
    domainsWithIssues.add('players')
  } else if (ctx.playerProgressContextAvailable && ctx.advancementEligibleCount > 0) {
    signals.push({
      domain: 'players',
      signal: 'Advancement-eligible players awaiting action',
      detail: `${ctx.advancementEligibleCount} player${ctx.advancementEligibleCount !== 1 ? 's' : ''} flagged as advancement-eligible. Director decision needed.`,
      severity: 'warning',
      recommendedAction: 'Review advancement-eligible players and approve or defer level movement.',
      href: '/director/players',
    })
    domainsWithIssues.add('players')
  }

  // ── Curriculum ─────────────────────────────────────────────────────────────

  if (ctx.curriculumGaps.length > 0) {
    const gapCount = ctx.curriculumGaps.length
    signals.push({
      domain: 'curriculum',
      signal: 'Curriculum structural gaps',
      detail: `${gapCount} level${gapCount !== 1 ? 's' : ''} with missing gates or drills: ${ctx.curriculumGaps.slice(0, 2).join('; ')}${gapCount > 2 ? '…' : ''}`,
      severity: gapCount >= 3 ? 'critical' : 'warning',
      recommendedAction: 'Open Curriculum Builder to add gates and drills for each gap level.',
      href: '/director/curriculum/builder',
    })
    domainsWithIssues.add('curriculum')
  }

  if (ctx.curriculumTemplateCoverageGapCount > 0) {
    signals.push({
      domain: 'curriculum',
      signal: 'Curriculum-template coverage gap',
      detail: `${ctx.curriculumTemplateCoverageGapCount} level${ctx.curriculumTemplateCoverageGapCount !== 1 ? 's' : ''} have active players but no class template.`,
      severity: ctx.curriculumTemplateCoverageGapCount >= 3 ? 'critical' : 'warning',
      recommendedAction: 'Create class templates for each uncovered level.',
      href: '/director/templates',
    })
    domainsWithIssues.add('curriculum')
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  if (ctx.templateContextAvailable && ctx.templateCount === 0) {
    signals.push({
      domain: 'templates',
      signal: 'No class templates defined',
      detail: 'No active class templates found. Coaches cannot follow a structured session plan.',
      severity: 'critical',
      recommendedAction: 'Create at least one class template per active curriculum level.',
      href: '/director/templates',
    })
    domainsWithIssues.add('templates')
  } else if (ctx.templateContextAvailable) {
    const unassigned = ctx.templateSummaries.filter(t => !t.curriculumLevelId).length
    if (unassigned > 0 && ctx.templateCount > 0) {
      signals.push({
        domain: 'templates',
        signal: 'Unassigned templates',
        detail: `${unassigned} active template${unassigned !== 1 ? 's' : ''} not assigned to any curriculum level — coaches may not know which class to use them for.`,
        severity: 'info',
        recommendedAction: 'Assign each template to its curriculum level in the template editor.',
        href: '/director/templates',
      })
      domainsWithIssues.add('templates')
    }
  }

  // ── Assessments ────────────────────────────────────────────────────────────

  if (ctx.assessmentContextAvailable && ctx.eligibleWithoutAssessmentEvidence > 0) {
    signals.push({
      domain: 'assessments',
      signal: 'Level movement without assessment evidence',
      detail: `${ctx.eligibleWithoutAssessmentEvidence} advancement-eligible player${ctx.eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} have no promotion-ready assessment.`,
      severity: 'critical',
      recommendedAction: 'Run a formal assessment before approving level advancement.',
      href: '/director/players',
    })
    domainsWithIssues.add('assessments')
  }

  if (ctx.assessmentContextAvailable && ctx.assessmentCoverageGapCount > 0) {
    const overdueCount = ctx.assessmentCoverageGaps.filter(g => g.gapType === 'no_recent_assessment').length
    if (overdueCount > 0) {
      signals.push({
        domain: 'assessments',
        signal: 'Overdue assessments',
        detail: `${overdueCount} player${overdueCount !== 1 ? 's' : ''} have not been formally assessed in the last 90 days.`,
        severity: overdueCount >= 3 ? 'warning' : 'info',
        recommendedAction: 'Schedule formal assessments to keep curriculum placement current.',
        href: '/director/players',
      })
      domainsWithIssues.add('assessments')
    }
  }

  // ── Coaches ────────────────────────────────────────────────────────────────

  if (ctx.coachCount === 0) {
    signals.push({
      domain: 'coaches',
      signal: 'No coaches added',
      detail: 'No coaches have been added to this academy. Session data cannot be linked to coaches.',
      severity: 'critical',
      recommendedAction: 'Add coaches via the Coaches & Permissions setup page.',
      href: '/director/onboarding/coaches-permissions',
    })
    domainsWithIssues.add('coaches')
  }

  if (ctx.attentionItems.filter(a => a.source === 'observation' && a.risk === 'high').length >= 3) {
    signals.push({
      domain: 'coaches',
      signal: 'Multiple high-concern observations',
      detail: 'Multiple players flagged with high-concern observations. Coach follow-up needed.',
      severity: 'warning',
      recommendedAction: 'Review observations in the Players section and discuss with relevant coaches.',
      href: '/director/players',
    })
    domainsWithIssues.add('coaches')
  }

  // ── Score calculation ──────────────────────────────────────────────────────

  const criticalCount = signals.filter(s => s.severity === 'critical').length
  const warningCount = signals.filter(s => s.severity === 'warning').length
  const infoCount = signals.filter(s => s.severity === 'info').length

  // Score: start at 100, deduct 20 per critical, 8 per warning, 2 per info
  const rawScore = 100 - criticalCount * 20 - warningCount * 8 - infoCount * 2
  const overallScore = Math.max(0, Math.min(100, rawScore))

  const domainsWithIssuesArr = Array.from(domainsWithIssues)
  const domainsHealthy = allDomains.filter(d => !domainsWithIssues.has(d))

  // Sort: critical → warning → info
  const SEVERITY_ORDER: Record<DQSeverity, number> = { critical: 0, warning: 1, info: 2 }
  signals.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return {
    signals,
    criticalCount,
    warningCount,
    infoCount,
    overallScore,
    domainsHealthy,
    domainsWithIssues: domainsWithIssuesArr,
  }
}

// ── DONNA answer builder ───────────────────────────────────────────────────────

export const DATA_QUALITY_PATTERNS =
  /\b(data quality|academy health|what.{0,20}(wrong|broken|missing|incomplete|needs? fixing|needs? attention)|health (check|score|status)|how.{0,20}(complete|healthy|good).{0,20}(data|academy|system)|what (should|do) i (fix|improve|check|focus on)|fix first|where (are|is) the (gaps?|issues?|problems?)|overall (status|health)|data completeness|data gaps?|what.{0,20}missing (from|in) (my |the )?(system|academy|data))\b/i

export function buildDataQualityAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const report = runDataQualityGuardian(ctx)

  if (report.signals.length === 0) {
    return {
      actionId: 'data_quality_healthy',
      text: [
        `✅ All academy data domains look healthy (score: ${report.overallScore}/100).`,
        '',
        `Healthy domains: ${report.domainsHealthy.map(d => d.replace('_', ' ')).join(', ')}.`,
        '',
        'No critical gaps detected. Keep up the good work — consistent data input is what makes DONNA\'s intelligence reliable.',
      ].join('\n'),
      confidence: 'high',
      sourceNote: 'Live data quality scan across all loaded context domains',
      followUp: 'Take me to the Review Center',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  const criticals = report.signals.filter(s => s.severity === 'critical')
  const warnings = report.signals.filter(s => s.severity === 'warning')

  const lines: string[] = []

  if (criticals.length > 0) {
    lines.push(`🔴 **Critical (${criticals.length}):**`)
    for (const s of criticals.slice(0, 3)) {
      lines.push(`• ${s.signal} — ${s.detail}`)
    }
  }

  if (warnings.length > 0) {
    lines.push('')
    lines.push(`🟡 **Warnings (${warnings.length}):**`)
    for (const w of warnings.slice(0, 3)) {
      lines.push(`• ${w.signal} — ${w.detail}`)
    }
  }

  const topSignal = report.signals[0]
  const nextStep = `**Most urgent:** ${topSignal.recommendedAction}`

  return {
    actionId: 'data_quality_issues',
    text: [
      `Academy data quality score: **${report.overallScore}/100**`,
      `${report.criticalCount} critical · ${report.warningCount} warnings · ${report.infoCount} info`,
      '',
      ...lines,
      '',
      nextStep,
    ].join('\n'),
    confidence: ctx.isLive ? 'high' : 'partial',
    sourceNote: 'Live data quality scan',
    followUp: topSignal.href.includes('review') ? 'Take me to Review Center' : 'Take me to Players',
    href: topSignal.href,
    isAnswerable: true,
  }
}

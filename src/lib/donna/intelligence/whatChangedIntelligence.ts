// Sprint 1746 — What Changed Intelligence V1
// Answers: What changed this month? What is improving? What is getting worse?
// Pure TypeScript. No DB calls. No mutations.
// Data sources: recentDecisions, recentAssessmentCount, assessmentCount,
//               curriculumDraftCount, pendingReviews, oldestPendingReviewAgeDays.
//
// IMPORTANT DATA LIMITATION:
//   DirectorDonnaContext has no historical snapshots.
//   "Changed" signals are derived from:
//   - recentDecisions (last 15 approved/executed/rejected actions)
//   - recentAssessmentCount (assessments in last 30 days) vs assessmentCount (total loaded)
//   - curriculumDraftCount (pending curriculum changes)
//   Month-over-month comparison is NOT possible — all signals are current state.
//
// Every answer uses: Observation → Confidence → Evidence → Limitations → Recommendation

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

export type ChangePeriod = 'month' | 'quarter' | 'recent'

// ─── Change signal types ──────────────────────────────────────────────────────

interface ChangeSignal {
  label:     string
  direction: 'improving' | 'regression' | 'new_risk' | 'new_opportunity' | 'stable'
  detail:    string
}

// ─── Signal builders ──────────────────────────────────────────────────────────

function buildDecisionActivitySignals(ctx: DirectorDonnaContext): ChangeSignal[] {
  const signals: ChangeSignal[] = []
  const decisions = ctx.recentDecisions

  if (!ctx.recentDecisionContextAvailable || decisions.length === 0) return signals

  const approved  = decisions.filter(d => d.status === 'approved' || d.status === 'executed')
  const rejected  = decisions.filter(d => d.status === 'rejected')
  const wrapUps   = decisions.filter(d => d.targetModule === 'session_wrap_up_v1')
  const curriculum = decisions.filter(d => d.targetModule?.includes('curriculum'))
  const advancement = decisions.filter(d => d.targetModule?.includes('advancement') || d.actionLabel?.toLowerCase().includes('advance'))

  if (approved.length > 0) {
    signals.push({
      label:     'Director review activity',
      direction: 'improving',
      detail:    `${approved.length} action${approved.length !== 1 ? 's' : ''} approved or executed recently`,
    })
  }
  if (wrapUps.length > 0) {
    signals.push({
      label:     'Wrap-up reviews',
      direction: 'stable',
      detail:    `${wrapUps.length} coach wrap-up${wrapUps.length !== 1 ? 's' : ''} reviewed recently`,
    })
  }
  if (advancement.length > 0) {
    signals.push({
      label:     'Player advancement activity',
      direction: 'new_opportunity',
      detail:    `${advancement.length} advancement-related decision${advancement.length !== 1 ? 's' : ''} in recent activity`,
    })
  }
  if (curriculum.length > 0) {
    signals.push({
      label:     'Curriculum changes',
      direction: 'stable',
      detail:    `${curriculum.length} curriculum-related decision${curriculum.length !== 1 ? 's' : ''} in recent activity`,
    })
  }
  if (rejected.length > 0) {
    signals.push({
      label:     'Rejected actions',
      direction: 'stable',
      detail:    `${rejected.length} action${rejected.length !== 1 ? 's' : ''} rejected — director oversight functioning`,
    })
  }

  return signals
}

function buildAssessmentTrendSignal(ctx: DirectorDonnaContext): ChangeSignal | null {
  if (!ctx.assessmentContextAvailable) return null

  const recent = ctx.recentAssessmentCount
  const total  = ctx.assessmentCount

  if (total === 0) return null

  // Assess whether recent cadence is healthy (recent / total > 0.3 is a rough positive)
  const recentPct = total > 0 ? recent / total : 0

  if (recent === 0) {
    return {
      label:     'Assessment cadence',
      direction: 'regression',
      detail:    `No assessments in the last 30 days (${total} total on record)`,
    }
  }
  if (recentPct > 0.3) {
    return {
      label:     'Assessment cadence',
      direction: 'improving',
      detail:    `${recent} assessments in the last 30 days — active evaluation period`,
    }
  }
  return {
    label:     'Assessment cadence',
    direction: 'stable',
    detail:    `${recent} assessments in the last 30 days (${total} total)`,
  }
}

function buildCurriculumDraftSignal(ctx: DirectorDonnaContext): ChangeSignal | null {
  if (ctx.curriculumDraftCount === 0) return null
  return {
    label:     'Curriculum draft activity',
    direction: 'new_opportunity',
    detail:    `${ctx.curriculumDraftCount} curriculum draft${ctx.curriculumDraftCount !== 1 ? 's' : ''} pending review — coaches are proposing curriculum improvements`,
  }
}

function buildReviewQueueSignal(ctx: DirectorDonnaContext): ChangeSignal | null {
  const days = ctx.oldestPendingReviewAgeDays
  if (days === null || days < 7) return null
  return {
    label:     'Review queue age',
    direction: days >= 14 ? 'regression' : 'new_risk',
    detail:    `Oldest pending review is ${days} day${days !== 1 ? 's' : ''} old — queue may be building up`,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildWhatChangedAnswer(
  ctx: DirectorDonnaContext,
  period: ChangePeriod = 'recent',
): DonnaSafeReadAnswer {
  const periodLabel = period === 'month' ? 'this month' : period === 'quarter' ? 'this quarter' : 'recently'

  const signals: ChangeSignal[] = [
    ...buildDecisionActivitySignals(ctx),
  ]

  const assessTrend  = buildAssessmentTrendSignal(ctx)
  const draftSignal  = buildCurriculumDraftSignal(ctx)
  const queueSignal  = buildReviewQueueSignal(ctx)

  if (assessTrend) signals.push(assessTrend)
  if (draftSignal) signals.push(draftSignal)
  if (queueSignal) signals.push(queueSignal)

  const lines: string[] = []
  lines.push('**Observation:**')

  if (signals.length === 0) {
    lines.push(`I don't have enough activity data to describe what changed ${periodLabel}. Recent decision history is the primary source for this analysis.`)
  } else {
    const improving    = signals.filter(s => s.direction === 'improving')
    const regressions  = signals.filter(s => s.direction === 'regression')
    const newRisks     = signals.filter(s => s.direction === 'new_risk')
    const opportunities = signals.filter(s => s.direction === 'new_opportunity')
    const stable       = signals.filter(s => s.direction === 'stable')

    if (improving.length > 0) {
      lines.push('**Improving:**')
      for (const s of improving) lines.push(`  🟢 ${s.label}: ${s.detail}`)
    }
    if (regressions.length > 0) {
      lines.push('**Regressions:**')
      for (const s of regressions) lines.push(`  🔴 ${s.label}: ${s.detail}`)
    }
    if (newRisks.length > 0) {
      lines.push('**New risks:**')
      for (const s of newRisks) lines.push(`  🟡 ${s.label}: ${s.detail}`)
    }
    if (opportunities.length > 0) {
      lines.push('**Opportunities:**')
      for (const s of opportunities) lines.push(`  💡 ${s.label}: ${s.detail}`)
    }
    if (stable.length > 0) {
      lines.push('**Ongoing:**')
      for (const s of stable) lines.push(`  ℹ️ ${s.label}: ${s.detail}`)
    }
  }

  const hasData = ctx.recentDecisionContextAvailable && ctx.recentDecisions.length > 0
  const confidence = hasData ? 'Medium' : 'Low'

  lines.push('')
  lines.push(`**Confidence:** ${confidence}`)
  lines.push('')
  lines.push('**Evidence:**')
  if (ctx.recentDecisionContextAvailable) {
    lines.push(`• ${ctx.recentDecisions.length} recent decisions in loaded history`)
  }
  if (ctx.assessmentContextAvailable) {
    lines.push(`• ${ctx.recentAssessmentCount} assessments in last 30 days`)
  }
  lines.push(`• ${ctx.curriculumDraftCount} curriculum drafts pending`)
  lines.push(`• ${ctx.pendingReviews} items in review queue`)
  lines.push('')
  lines.push('**Limitations:**')
  lines.push('• No historical snapshots — month-over-month comparison is not possible.')
  lines.push('• "Changed" signals are derived from recent decision history, not a tracked baseline.')
  lines.push(`• Recent decisions are limited to the last ${ctx.recentDecisions.length} loaded — earlier history is not available.`)
  lines.push('')
  lines.push('**Recommendation:**')

  const firstRegression = signals.find(s => s.direction === 'regression')
  const firstRisk       = signals.find(s => s.direction === 'new_risk')
  const firstOpportunity = signals.find(s => s.direction === 'new_opportunity')

  if (firstRegression) {
    lines.push(`Address the regression first: ${firstRegression.detail}`)
  } else if (firstRisk) {
    lines.push(`Watch the risk: ${firstRisk.detail}`)
  } else if (firstOpportunity) {
    lines.push(`Act on the opportunity: ${firstOpportunity.detail}`)
  } else {
    lines.push('Academy activity appears stable. Review the queue and ensure assessment cadence continues.')
  }

  return {
    actionId:    'what_changed_intelligence',
    text:        lines.join('\n'),
    confidence:  hasData ? 'partial' : 'partial',
    sourceNote:  `Recent decisions + assessment cadence + review queue signals (${periodLabel})`,
    followUp:    ctx.pendingReviews > 0 ? 'Go to Review Center' : null,
    href:        ctx.pendingReviews > 0 ? '/director/review' : null,
    isAnswerable: true,
  }
}

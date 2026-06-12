// Sprint 920 — DONNA Insight Engine V1
// Deterministic insight detection from DirectorDonnaContext signals.
// Turns academy operating state into structured insights with evidence, recommendations,
// confidence ratings, and safe next steps.
//
// Rules:
//   - Deterministic only. No LLM. No random. Same ctx → same output.
//   - No DB calls. Uses context already loaded by loadDirectorDonnaContext.
//   - Never invents data not in ctx.
//   - If a signal is absent, no insight is emitted.
//   - No official mutation. Recommendations only.
//   - No sensitive raw notes exposed.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ── Insight shape ──────────────────────────────────────────────────────────────

export type InsightConfidence = 'high' | 'medium' | 'low'
export type InsightType =
  | 'repeated_player_issue'
  | 'repeated_group_issue'
  | 'review_queue_buildup'
  | 'curriculum_coverage_gap'
  | 'assessment_coverage_gap'
  | 'advancement_eligible_waiting'
  | 'wrap_up_coverage_low'
  | 'recommendation_rejection_pattern'
  | 'stall_detected'

export interface DonnaInsight {
  id: string
  type: InsightType
  title: string
  evidence: string
  recommendation: string
  confidence: InsightConfidence
  requiresApproval: boolean
  safeNextStep: string
  href?: string
  playerName?: string | null
}

// ── Pattern detectors ─────────────────────────────────────────────────────────

function detectRepeatedPlayerIssues(ctx: DirectorDonnaContext): DonnaInsight[] {
  const counts = new Map<string, { name: string | null; count: number }>()
  for (const item of ctx.attentionItems ?? []) {
    if (!item.playerId) continue
    const existing = counts.get(item.playerId)
    counts.set(item.playerId, {
      name: item.playerName,
      count: (existing?.count ?? 0) + 1,
    })
  }

  const insights: DonnaInsight[] = []
  for (const [playerId, { name: pName, count }] of Array.from(counts.entries())) {
    if (count < 2) continue
    const label = pName ?? 'a player'
    insights.push({
      id: `repeated_player_${playerId}`,
      type: 'repeated_player_issue',
      title: `${label} has ${count} attention signals`,
      evidence: `${count} separate attention flags for this player in recent academy data.`,
      recommendation: 'Review the player profile and check if a priority recommendation draft should be created for director review.',
      confidence: count >= 3 ? 'high' : 'medium',
      requiresApproval: true,
      safeNextStep: 'Open player profile → check observations and priorities.',
      href: `/director/players`,
      playerName: pName,
    })
  }
  return insights
}

function detectReviewQueueBuildup(ctx: DirectorDonnaContext): DonnaInsight[] {
  if ((ctx.pendingReviews ?? 0) < 5) return []
  return [{
    id: 'review_queue_buildup',
    type: 'review_queue_buildup',
    title: `${ctx.pendingReviews} items in review queue`,
    evidence: `${ctx.pendingReviews} proposed actions are pending director review.`,
    recommendation: 'Clear the review queue — focus on wrap-up approvals and attendance exceptions first.',
    confidence: ctx.pendingReviews >= 10 ? 'high' : 'medium',
    requiresApproval: false,
    safeNextStep: 'Go to Review Queue → start with "For Your Review" tab.',
    href: '/director/review',
  }]
}

function detectCurriculumCoverageGaps(ctx: DirectorDonnaContext): DonnaInsight[] {
  if ((ctx.curriculumTemplateCoverageGapCount ?? 0) === 0) return []
  const count = ctx.curriculumTemplateCoverageGapCount
  return [{
    id: 'curriculum_template_gap',
    type: 'curriculum_coverage_gap',
    title: `${count} curriculum level${count !== 1 ? 's' : ''} without session templates`,
    evidence: `${count} curriculum level${count !== 1 ? 's are' : ' is'} not covered by any session template.`,
    recommendation: 'Create or assign session templates to cover these curriculum levels so coaches have structured session plans.',
    confidence: count >= 3 ? 'high' : 'medium',
    requiresApproval: false,
    safeNextStep: 'Go to Curriculum → check coverage gaps, then visit Templates to create coverage.',
    href: '/director/curriculum',
  }]
}

function detectAssessmentCoverageGaps(ctx: DirectorDonnaContext): DonnaInsight[] {
  if ((ctx.assessmentCoverageGapCount ?? 0) === 0) return []
  const count = ctx.assessmentCoverageGapCount
  return [{
    id: 'assessment_coverage_gap',
    type: 'assessment_coverage_gap',
    title: `${count} player${count !== 1 ? 's' : ''} without recent assessment evidence`,
    evidence: `${count} advancement-eligible player${count !== 1 ? 's' : ''} lack recent assessment evidence.`,
    recommendation: 'Schedule assessment sessions or ask coaches to submit observations for these players via wrap-up.',
    confidence: 'medium',
    requiresApproval: false,
    safeNextStep: 'Go to Players → check development evidence on each player profile.',
    href: '/director/players',
  }]
}

function detectAdvancementEligibleWaiting(ctx: DirectorDonnaContext): DonnaInsight[] {
  if ((ctx.advancementEligibleCount ?? 0) === 0) return []
  const count = ctx.advancementEligibleCount
  return [{
    id: 'advancement_eligible_waiting',
    type: 'advancement_eligible_waiting',
    title: `${count} player${count !== 1 ? 's' : ''} may be ready for level advancement`,
    evidence: `${count} player${count !== 1 ? 's have' : ' has'} met advancement eligibility criteria but no level review draft has been created.`,
    recommendation: 'Review each player profile. If evidence supports advancement, DONNA can draft a level review for your approval.',
    confidence: 'medium',
    requiresApproval: true,
    safeNextStep: 'Go to Level Up → review eligibility signals per player.',
    href: '/director/level-up',
  }]
}

function detectLowWrapUpCoverage(ctx: DirectorDonnaContext): DonnaInsight[] {
  const missing = ctx.missingWrapUps ?? 0
  const total = ctx.todaySessions ?? 0
  if (missing === 0 || total === 0) return []
  const ratio = missing / total
  if (ratio < 0.5) return [] // only flag when majority missing
  return [{
    id: 'wrap_up_coverage_low',
    type: 'wrap_up_coverage_low',
    title: `${missing} of ${total} session${total !== 1 ? 's' : ''} missing wrap-ups`,
    evidence: `${missing} coach${missing !== 1 ? 'es have' : ' has'} not submitted a wrap-up for today\'s sessions.`,
    recommendation: 'Remind coaches to submit wrap-ups. Incomplete wrap-ups mean player observations and attendance are missing from the record.',
    confidence: ratio >= 0.75 ? 'high' : 'medium',
    requiresApproval: false,
    safeNextStep: 'Go to Today\'s Academy → check session wrap-up status.',
    href: '/director',
  }]
}

function detectProgressStalls(ctx: DirectorDonnaContext): DonnaInsight[] {
  const stalls = ctx.playerProgressStalls ?? []
  if (stalls.length === 0) return []
  const count = stalls.length
  return [{
    id: 'progress_stalls_detected',
    type: 'stall_detected',
    title: `${count} player${count !== 1 ? 's' : ''} showing development stall`,
    evidence: `${count} player${count !== 1 ? 's have' : ' has'} not shown recent curriculum progress signals.`,
    recommendation: 'Review observations and recent session exposure for stalled players. Consider creating a focused priority recommendation.',
    confidence: 'medium',
    requiresApproval: true,
    safeNextStep: 'Go to Players → check curriculum states for stalled players.',
    href: '/director/players',
  }]
}

// ── Engine entry point ─────────────────────────────────────────────────────────

/**
 * Generates deterministic insights from DirectorDonnaContext.
 * Returns at most `limit` insights sorted by confidence (high > medium > low).
 * Safe source only — no mutations, no raw notes.
 */
export function generateDonnaInsights(
  ctx: DirectorDonnaContext,
  limit = 5,
): DonnaInsight[] {
  const all: DonnaInsight[] = [
    ...detectRepeatedPlayerIssues(ctx),
    ...detectReviewQueueBuildup(ctx),
    ...detectAdvancementEligibleWaiting(ctx),
    ...detectCurriculumCoverageGaps(ctx),
    ...detectAssessmentCoverageGaps(ctx),
    ...detectLowWrapUpCoverage(ctx),
    ...detectProgressStalls(ctx),
  ]

  const order: InsightConfidence[] = ['high', 'medium', 'low']
  return all
    .sort((a, b) => order.indexOf(a.confidence) - order.indexOf(b.confidence))
    .slice(0, limit)
}

// ── Safe DONNA summary ─────────────────────────────────────────────────────────

/** Returns a DONNA-safe text summary of insights for display in the director brief. */
export function formatInsightsForDonna(insights: DonnaInsight[]): string {
  if (insights.length === 0) {
    return 'No new patterns detected in current academy signals.'
  }
  const lines = insights.map((ins, i) => {
    const conf = ins.confidence === 'high' ? '⚡' : ins.confidence === 'medium' ? '○' : '·'
    return `${i + 1}. ${conf} **${ins.title}** — ${ins.evidence}`
  })
  return `Detected ${insights.length} insight${insights.length !== 1 ? 's' : ''}:\n\n${lines.join('\n')}\n\nNo changes have been made. Each insight requires your review.`
}

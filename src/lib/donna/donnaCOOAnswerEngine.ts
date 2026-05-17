// Sprint 554 — DONNA Ask From Live COO Context V1
// Pure TypeScript answer engine — generates DONNA natural-language responses
// from live or partial COO data. No new DB queries. Read-only.

import type { COOFieldStatus } from './cooDataStatus'

// ── Input types ───────────────────────────────────────────────────────────────

export interface COOContext {
  academyHealthScore: number | null
  healthScoreStatus: COOFieldStatus
  attendanceRisk: {
    playerCount: number
    playerNames: string[]
    status: COOFieldStatus
  }
  coachWrapUpCoverage: {
    completedToday: number
    totalToday: number
    status: COOFieldStatus
  }
  pendingReviewItems: {
    count: number
    urgentCount: number
    status: COOFieldStatus
  }
  parentUpdateBacklog: {
    count: number
    status: COOFieldStatus
  }
  levelReadinessFlags: {
    count: number
    status: COOFieldStatus
  }
}

// ── Answer types ──────────────────────────────────────────────────────────────

export type DONNAConfidence = 'high' | 'partial' | 'insufficient' | 'blocked'

export interface DONNAAnswer {
  text: string
  confidence: DONNAConfidence
  sourceNote: string | null
  followUpSuggestion: string | null
}

// ── Confidence derivation ─────────────────────────────────────────────────────

function deriveConfidence(statuses: COOFieldStatus[]): DONNAConfidence {
  if (statuses.some(s => s === 'blocked_by_rls' || s === 'blocked_by_schema')) return 'blocked'
  if (statuses.every(s => s === 'live')) return 'high'
  if (statuses.some(s => s === 'insufficient_data')) return 'insufficient'
  return 'partial'
}

// ── What needs attention ──────────────────────────────────────────────────────

export function answerWhatNeedsAttention(ctx: COOContext): DONNAAnswer {
  const items: string[] = []

  if (ctx.pendingReviewItems.status !== 'blocked_by_rls' && ctx.pendingReviewItems.status !== 'blocked_by_schema') {
    if (ctx.pendingReviewItems.urgentCount > 0) {
      items.push(`${ctx.pendingReviewItems.urgentCount} urgent item${ctx.pendingReviewItems.urgentCount === 1 ? '' : 's'} in the review queue`)
    } else if (ctx.pendingReviewItems.count > 0) {
      items.push(`${ctx.pendingReviewItems.count} pending review item${ctx.pendingReviewItems.count === 1 ? '' : 's'}`)
    }
  }

  if (ctx.coachWrapUpCoverage.status !== 'blocked_by_rls' && ctx.coachWrapUpCoverage.status !== 'blocked_by_schema') {
    const missing = ctx.coachWrapUpCoverage.totalToday - ctx.coachWrapUpCoverage.completedToday
    if (missing > 0) {
      items.push(`${missing} session wrap-up${missing === 1 ? '' : 's'} not yet submitted`)
    }
  }

  if (ctx.attendanceRisk.status !== 'blocked_by_rls' && ctx.attendanceRisk.status !== 'blocked_by_schema') {
    if (ctx.attendanceRisk.playerCount > 0) {
      const names = ctx.attendanceRisk.playerNames.slice(0, 3).join(', ')
      const extra = ctx.attendanceRisk.playerCount > 3 ? ` and ${ctx.attendanceRisk.playerCount - 3} more` : ''
      items.push(`${ctx.attendanceRisk.playerCount} player${ctx.attendanceRisk.playerCount === 1 ? '' : 's'} with attendance risk (${names}${extra})`)
    }
  }

  if (ctx.parentUpdateBacklog.status !== 'blocked_by_rls' && ctx.parentUpdateBacklog.status !== 'blocked_by_schema') {
    if (ctx.parentUpdateBacklog.count > 0) {
      items.push(`${ctx.parentUpdateBacklog.count} parent update${ctx.parentUpdateBacklog.count === 1 ? '' : 's'} pending approval`)
    }
  }

  const confidence = deriveConfidence([
    ctx.pendingReviewItems.status,
    ctx.coachWrapUpCoverage.status,
    ctx.attendanceRisk.status,
  ])

  if (items.length === 0) {
    return {
      text: confidence === 'insufficient'
        ? "I don't have enough data yet to identify what needs attention. Make sure coaches are completing wrap-ups so I have context to work with."
        : "Nothing critical flagged right now. The academy looks clear.",
      confidence,
      sourceNote: confidence === 'insufficient' ? 'Insufficient data — more wrap-ups needed' : null,
      followUpSuggestion: null,
    }
  }

  const intro = confidence === 'high'
    ? "Here's what needs your attention:"
    : confidence === 'partial'
    ? "Based on available data, here's what I see:"
    : "I have partial data, so this may be incomplete:"

  return {
    text: `${intro}\n\n${items.map(i => `• ${i}`).join('\n')}`,
    confidence,
    sourceNote: confidence !== 'high' ? 'Some data sources are partial or missing' : null,
    followUpSuggestion: ctx.pendingReviewItems.count > 0
      ? 'Open the review queue to address the pending items.'
      : null,
  }
}

// ── Who is at risk ────────────────────────────────────────────────────────────

export function answerWhoIsAtRisk(ctx: COOContext): DONNAAnswer {
  const confidence = deriveConfidence([
    ctx.attendanceRisk.status,
    ctx.levelReadinessFlags.status,
  ])

  if (confidence === 'blocked') {
    return {
      text: "I can't access risk data right now — this may be a permissions or schema issue.",
      confidence: 'blocked',
      sourceNote: 'Blocked by RLS or schema gap',
      followUpSuggestion: null,
    }
  }

  const riskItems: string[] = []

  if (ctx.attendanceRisk.playerCount > 0) {
    const names = ctx.attendanceRisk.playerNames.slice(0, 5)
    riskItems.push(...names.map(n => `${n} — attendance concern`))
    if (ctx.attendanceRisk.playerCount > 5) {
      riskItems.push(`…and ${ctx.attendanceRisk.playerCount - 5} more with attendance flags`)
    }
  }

  if (ctx.levelReadinessFlags.count > 0) {
    riskItems.push(`${ctx.levelReadinessFlags.count} player${ctx.levelReadinessFlags.count === 1 ? '' : 's'} with level readiness flags (view player profiles for detail)`)
  }

  if (riskItems.length === 0) {
    return {
      text: confidence === 'insufficient'
        ? "I don't have enough signal to identify who's at risk. Ensure coaches are submitting wrap-ups regularly."
        : "No players flagged as at-risk right now.",
      confidence,
      sourceNote: confidence === 'insufficient' ? 'Insufficient attendance data' : null,
      followUpSuggestion: null,
    }
  }

  return {
    text: `Players currently flagged:\n\n${riskItems.map(r => `• ${r}`).join('\n')}`,
    confidence,
    sourceNote: confidence === 'partial' ? 'Risk signals are partial — some data sources missing' : null,
    followUpSuggestion: 'Review individual player profiles for full context.',
  }
}

// ── Why is academy health low ─────────────────────────────────────────────────

export function answerWhyIsHealthLow(ctx: COOContext): DONNAAnswer {
  if (ctx.healthScoreStatus === 'blocked_by_rls' || ctx.healthScoreStatus === 'blocked_by_schema') {
    return {
      text: "I can't compute the academy health score right now — this data source is blocked.",
      confidence: 'blocked',
      sourceNote: 'Academy health score blocked by schema or RLS',
      followUpSuggestion: null,
    }
  }

  if (ctx.academyHealthScore === null || ctx.healthScoreStatus === 'insufficient_data') {
    return {
      text: "I don't have enough data to calculate the academy health score yet. The most common cause is missing coach wrap-ups.",
      confidence: 'insufficient',
      sourceNote: 'Insufficient data for health score',
      followUpSuggestion: 'Ask coaches to complete their session wrap-ups.',
    }
  }

  const score = ctx.academyHealthScore
  const reasons: string[] = []

  if (score < 70) {
    const missing = ctx.coachWrapUpCoverage.totalToday - ctx.coachWrapUpCoverage.completedToday
    if (missing > 0 && ctx.coachWrapUpCoverage.status !== 'blocked_by_schema') {
      reasons.push(`${missing} session wrap-up${missing === 1 ? '' : 's'} not submitted — DONNA can't assess what happened in those sessions`)
    }
    if (ctx.attendanceRisk.playerCount > 0 && ctx.attendanceRisk.status !== 'blocked_by_schema') {
      reasons.push(`${ctx.attendanceRisk.playerCount} player${ctx.attendanceRisk.playerCount === 1 ? '' : 's'} flagged with attendance concerns`)
    }
    if (ctx.pendingReviewItems.urgentCount > 0 && ctx.pendingReviewItems.status !== 'blocked_by_schema') {
      reasons.push(`${ctx.pendingReviewItems.urgentCount} urgent review item${ctx.pendingReviewItems.urgentCount === 1 ? '' : 's'} awaiting director action`)
    }
    if (ctx.parentUpdateBacklog.count > 0 && ctx.parentUpdateBacklog.status !== 'blocked_by_schema') {
      reasons.push(`${ctx.parentUpdateBacklog.count} parent update${ctx.parentUpdateBacklog.count === 1 ? '' : 's'} not yet sent`)
    }
  }

  if (reasons.length === 0) {
    return {
      text: score >= 80
        ? `The academy health score is ${score} — that's solid. Nothing specific is driving it down.`
        : `The academy health score is ${score}. I don't have enough signal to pinpoint the cause with this data.`,
      confidence: ctx.healthScoreStatus === 'live' ? 'high' : 'partial',
      sourceNote: ctx.healthScoreStatus !== 'live' ? 'Some health data sources are partial' : null,
      followUpSuggestion: null,
    }
  }

  return {
    text: `The academy health score is ${score}. Here's what's driving it down:\n\n${reasons.map(r => `• ${r}`).join('\n')}`,
    confidence: ctx.healthScoreStatus === 'live' ? 'high' : 'partial',
    sourceNote: ctx.healthScoreStatus !== 'live' ? 'Health data is partially available' : null,
    followUpSuggestion: reasons.length > 0 ? 'Address the items above to improve the score.' : null,
  }
}

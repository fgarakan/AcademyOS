// Sprint 599 — DONNA Daily Operating Loop V1
// DONNA's view of what matters each day.
// Pure TypeScript — no DB reads, no execution.
// Accepts pre-fetched COOContext and returns structured daily brief.

import type { COOContext } from './donnaCOOAnswerEngine'
import type { NextBestAction } from './donnaNBAEngine'
import { rankNextBestActions } from './donnaNBAEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DailyLoopPhase =
  | 'pre_session'
  | 'between_sessions'
  | 'post_session'
  | 'end_of_day'

export interface DailyAttentionItem {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  headline: string
  detail: string | null
  actionRequired: boolean
  playerName: string | null
}

export interface DonnaDailyBrief {
  phase: DailyLoopPhase
  date: string
  reviewQueueCount: number
  attentionItems: DailyAttentionItem[]
  nextBestActions: NextBestAction[]
  isHealthy: boolean
  healthSummary: string
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildDonnaDailyBrief(
  ctx: COOContext,
  phase: DailyLoopPhase,
  date: string,
): DonnaDailyBrief {
  const attentionItems: DailyAttentionItem[] = []

  // Review queue pressure
  const urgentCount = ctx.pendingReviewItems.urgentCount
  const pendingCount = ctx.pendingReviewItems.count
  if (urgentCount > 0) {
    attentionItems.push({
      priority: 'critical',
      category: 'review_queue',
      headline: `${urgentCount} urgent item${urgentCount > 1 ? 's' : ''} in review queue`,
      detail: 'Director action required today.',
      actionRequired: true,
      playerName: null,
    })
  } else if (pendingCount > 0) {
    attentionItems.push({
      priority: 'medium',
      category: 'review_queue',
      headline: `${pendingCount} item${pendingCount > 1 ? 's' : ''} pending review`,
      detail: null,
      actionRequired: false,
      playerName: null,
    })
  }

  // At-risk players
  const atRiskCount = ctx.attendanceRisk.playerCount
  if (atRiskCount > 0) {
    const names = ctx.attendanceRisk.playerNames.slice(0, 3)
    for (const name of names) {
      attentionItems.push({
        priority: 'high',
        category: 'player_health',
        headline: `${name} — attendance at risk`,
        detail: 'High attendance risk — check recent history.',
        actionRequired: false,
        playerName: name,
      })
    }
    if (ctx.attendanceRisk.playerNames.length > 3) {
      attentionItems.push({
        priority: 'high',
        category: 'player_health',
        headline: `${ctx.attendanceRisk.playerNames.length - 3} more players at attendance risk`,
        detail: null,
        actionRequired: false,
        playerName: null,
      })
    }
  }

  // Wrap-up coverage gap
  const { completedToday, totalToday } = ctx.coachWrapUpCoverage
  if (totalToday > 0 && completedToday < totalToday) {
    const missing = totalToday - completedToday
    attentionItems.push({
      priority: 'medium',
      category: 'wrap_up',
      headline: `${missing} session wrap-up${missing > 1 ? 's' : ''} not yet complete`,
      detail: 'Coach wrap-ups are due.',
      actionRequired: false,
      playerName: null,
    })
  }

  // Level readiness flags
  if (ctx.levelReadinessFlags.count > 0) {
    attentionItems.push({
      priority: 'low',
      category: 'level_readiness',
      headline: `${ctx.levelReadinessFlags.count} level readiness signal${ctx.levelReadinessFlags.count > 1 ? 's' : ''} flagged`,
      detail: 'Review when ready — no action required immediately.',
      actionRequired: false,
      playerName: null,
    })
  }

  const nextBestActions = rankNextBestActions(ctx)

  const criticalCount = attentionItems.filter(i => i.priority === 'critical').length
  const highCount = attentionItems.filter(i => i.priority === 'high').length

  const isHealthy = urgentCount === 0 && atRiskCount === 0 && criticalCount === 0
  const healthSummary = isHealthy
    ? 'Academy is running smoothly today.'
    : `${criticalCount + highCount} high-priority item${criticalCount + highCount > 1 ? 's' : ''} need attention.`

  attentionItems.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  })

  return {
    phase,
    date,
    reviewQueueCount: pendingCount,
    attentionItems,
    nextBestActions: nextBestActions.slice(0, 3),
    isHealthy,
    healthSummary,
  }
}

// ── Phase label ───────────────────────────────────────────────────────────────

export const DAILY_LOOP_PHASE_LABELS: Record<DailyLoopPhase, string> = {
  pre_session: 'Morning brief',
  between_sessions: 'Between sessions',
  post_session: 'Post-session',
  end_of_day: 'End of day',
}

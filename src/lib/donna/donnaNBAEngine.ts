// Sprint 557 — DONNA Next Best Action Live Ranking V1
// Ranks the top 5 academy actions from live/partial COO context.
// No execution. Read-only ranking engine. Pure TypeScript.

import type { COOContext } from './donnaCOOAnswerEngine'
import type { DONNAConfidence } from './donnaCOOAnswerEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NBACategory =
  | 'review_queue'
  | 'coach_wrap_up'
  | 'attendance'
  | 'parent_update'
  | 'level_readiness'
  | 'academy_health'

export interface NextBestAction {
  rank: number
  category: NBACategory
  title: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
  confidence: DONNAConfidence
  actionLabel: string
  actionRoute: string | null  // null = route not yet built
  isBlocked: boolean
  blockedReason: string | null
}

// ── Ranking engine ────────────────────────────────────────────────────────────

export function rankNextBestActions(ctx: COOContext): NextBestAction[] {
  const candidates: Omit<NextBestAction, 'rank'>[] = []

  // ── Review queue urgent items ──
  if (
    ctx.pendingReviewItems.status !== 'blocked_by_rls' &&
    ctx.pendingReviewItems.status !== 'blocked_by_schema'
  ) {
    if (ctx.pendingReviewItems.urgentCount > 0) {
      candidates.push({
        category: 'review_queue',
        title: `Review ${ctx.pendingReviewItems.urgentCount} urgent item${ctx.pendingReviewItems.urgentCount === 1 ? '' : 's'}`,
        reason: 'Urgent items in the review queue require director decision.',
        urgency: 'high',
        confidence: ctx.pendingReviewItems.status === 'live' ? 'high' : 'partial',
        actionLabel: 'Open review queue',
        actionRoute: '/director/review',
        isBlocked: false,
        blockedReason: null,
      })
    } else if (ctx.pendingReviewItems.count > 0) {
      candidates.push({
        category: 'review_queue',
        title: `Clear ${ctx.pendingReviewItems.count} pending review item${ctx.pendingReviewItems.count === 1 ? '' : 's'}`,
        reason: 'Pending items are waiting for director review.',
        urgency: 'medium',
        confidence: ctx.pendingReviewItems.status === 'live' ? 'high' : 'partial',
        actionLabel: 'Open review queue',
        actionRoute: '/director/review',
        isBlocked: false,
        blockedReason: null,
      })
    }
  }

  // ── Coach wrap-up coverage ──
  if (
    ctx.coachWrapUpCoverage.status !== 'blocked_by_rls' &&
    ctx.coachWrapUpCoverage.status !== 'blocked_by_schema'
  ) {
    const missing = ctx.coachWrapUpCoverage.totalToday - ctx.coachWrapUpCoverage.completedToday
    if (missing > 0) {
      candidates.push({
        category: 'coach_wrap_up',
        title: `Follow up on ${missing} missing session wrap-up${missing === 1 ? '' : 's'}`,
        reason: `${missing} of ${ctx.coachWrapUpCoverage.totalToday} sessions today are missing wrap-ups. DONNA cannot assess those sessions.`,
        urgency: missing >= 3 ? 'high' : 'medium',
        confidence: ctx.coachWrapUpCoverage.status === 'live' ? 'high' : 'partial',
        actionLabel: 'View coaches',
        actionRoute: '/director/coaches',
        isBlocked: false,
        blockedReason: null,
      })
    }
  }

  // ── Attendance risk ──
  if (
    ctx.attendanceRisk.status !== 'blocked_by_rls' &&
    ctx.attendanceRisk.status !== 'blocked_by_schema' &&
    ctx.attendanceRisk.playerCount > 0
  ) {
    candidates.push({
      category: 'attendance',
      title: `Address attendance risk for ${ctx.attendanceRisk.playerCount} player${ctx.attendanceRisk.playerCount === 1 ? '' : 's'}`,
      reason: `${ctx.attendanceRisk.playerNames.slice(0, 2).join(', ')}${ctx.attendanceRisk.playerCount > 2 ? ` and ${ctx.attendanceRisk.playerCount - 2} more` : ''} flagged with attendance concerns.`,
      urgency: ctx.attendanceRisk.playerCount >= 3 ? 'high' : 'medium',
      confidence: ctx.attendanceRisk.status === 'live' ? 'high' : 'partial',
      actionLabel: 'View players',
      actionRoute: '/director/players',
      isBlocked: false,
      blockedReason: null,
    })
  }

  // ── Parent update backlog ──
  if (
    ctx.parentUpdateBacklog.status !== 'blocked_by_rls' &&
    ctx.parentUpdateBacklog.status !== 'blocked_by_schema' &&
    ctx.parentUpdateBacklog.count > 0
  ) {
    candidates.push({
      category: 'parent_update',
      title: `Approve ${ctx.parentUpdateBacklog.count} parent update${ctx.parentUpdateBacklog.count === 1 ? '' : 's'}`,
      reason: 'Parent updates are drafted and awaiting director approval.',
      urgency: 'medium',
      confidence: ctx.parentUpdateBacklog.status === 'live' ? 'high' : 'partial',
      actionLabel: 'Open review queue',
      actionRoute: '/director/review',
      isBlocked: false,
      blockedReason: null,
    })
  }

  // ── Level readiness flags ──
  if (
    ctx.levelReadinessFlags.status !== 'blocked_by_rls' &&
    ctx.levelReadinessFlags.status !== 'blocked_by_schema' &&
    ctx.levelReadinessFlags.count > 0
  ) {
    candidates.push({
      category: 'level_readiness',
      title: `Review ${ctx.levelReadinessFlags.count} level readiness flag${ctx.levelReadinessFlags.count === 1 ? '' : 's'}`,
      reason: 'Players are flagged as potentially ready for level movement. Director approval required.',
      urgency: 'low',
      confidence: ctx.levelReadinessFlags.status === 'live' ? 'high' : 'partial',
      actionLabel: 'View players',
      actionRoute: '/director/players',
      isBlocked: false,
      blockedReason: null,
    })
  }

  // ── Academy health low ──
  if (
    ctx.academyHealthScore !== null &&
    ctx.healthScoreStatus !== 'blocked_by_rls' &&
    ctx.healthScoreStatus !== 'blocked_by_schema' &&
    ctx.academyHealthScore < 65
  ) {
    candidates.push({
      category: 'academy_health',
      title: `Investigate academy health drop (score: ${ctx.academyHealthScore})`,
      reason: 'Academy health is below target. Review contributing factors.',
      urgency: ctx.academyHealthScore < 50 ? 'high' : 'medium',
      confidence: ctx.healthScoreStatus === 'live' ? 'high' : 'partial',
      actionLabel: 'View today',
      actionRoute: '/director/today',
      isBlocked: false,
      blockedReason: null,
    })
  }

  // ── Sort by urgency then confidence ──
  const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const confidenceOrder: Record<string, number> = { high: 0, partial: 1, insufficient: 2, blocked: 3 }

  candidates.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
  })

  return candidates.slice(0, 5).map((c, i) => ({ ...c, rank: i + 1 }))
}

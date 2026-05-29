// Sprint 958 — DONNA Proactive Alerts V1
// Safe, low-noise in-app alert generation for academy directors.
// Pure TypeScript — read-only, no DB calls, no mutations.
// Alerts recommend; they never execute. Dismiss/snooze tracked via
// existing donnaRecommendationFeedback.ts infrastructure.

import type { DirectorBriefInput } from './donnaDirectorBrief'
import { getSafetyMessage } from './donnaPersonality'

// ── Alert types ───────────────────────────────────────────────────────────────

export type ProactiveAlertType =
  | 'review_aging'            // Review queue growing or unreviewed for N days
  | 'missing_wrap_ups'        // Multiple sessions missing wrap-ups
  | 'repeated_player_concern' // Same player flagged multiple times without action
  | 'parent_summary_ready'    // Parent-safe summary waiting for director review
  | 'unresolved_clarification' // Coach clarification not responded to in N days

export type AlertUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface DonnaProactiveAlert {
  id: string
  type: ProactiveAlertType
  urgency: AlertUrgency
  headline: string
  body: string
  actionLabel: string
  actionRoute: string
  safetyNote: string | null
  dismissible: boolean
}

// ── Alert builders ────────────────────────────────────────────────────────────

export function buildReviewAgingAlert(pendingCount: number, oldestDaysAgo: number): DonnaProactiveAlert {
  const urgency: AlertUrgency = oldestDaysAgo > 7 ? 'critical' : oldestDaysAgo > 3 ? 'high' : 'medium'
  return {
    id: `review_aging_${Date.now()}`,
    type: 'review_aging',
    urgency,
    headline: `${pendingCount} review item${pendingCount > 1 ? 's' : ''} — oldest is ${oldestDaysAgo} days old`,
    body: `Your review queue has ${pendingCount} item${pendingCount > 1 ? 's' : ''} waiting. The oldest has been waiting ${oldestDaysAgo} days. Items do not take effect until you approve them.`,
    actionLabel: 'Go to Review Center',
    actionRoute: '/director/review',
    safetyNote: getSafetyMessage('approvalRequired'),
    dismissible: true,
  }
}

export function buildMissingWrapUpsAlert(sessionsWithoutWrapUp: number): DonnaProactiveAlert {
  return {
    id: `missing_wrapups_${Date.now()}`,
    type: 'missing_wrap_ups',
    urgency: sessionsWithoutWrapUp >= 3 ? 'high' : 'medium',
    headline: `${sessionsWithoutWrapUp} session${sessionsWithoutWrapUp > 1 ? 's are' : ' is'} missing wrap-ups`,
    body: `${sessionsWithoutWrapUp} completed session${sessionsWithoutWrapUp > 1 ? 's' : ''} do not have a coach wrap-up yet. Observations and attendance updates depend on these.`,
    actionLabel: 'View Sessions',
    actionRoute: '/director/sessions',
    safetyNote: null,
    dismissible: true,
  }
}

export function buildParentSummaryReadyAlert(playerCount: number): DonnaProactiveAlert {
  return {
    id: `parent_summary_ready_${Date.now()}`,
    type: 'parent_summary_ready',
    urgency: 'low',
    headline: `Parent update${playerCount > 1 ? 's' : ''} ready for ${playerCount} player${playerCount > 1 ? 's' : ''}`,
    body: `Coach-approved summaries are ready to review and send to ${playerCount} parent${playerCount > 1 ? 's' : ''}. Nothing is sent automatically — your approval is required.`,
    actionLabel: 'Review Summaries',
    actionRoute: '/director/review',
    safetyNote: getSafetyMessage('noAutoSend'),
    dismissible: true,
  }
}

// ── Alert suite from context ──────────────────────────────────────────────────

export function buildProactiveAlerts(
  input: DirectorBriefInput & {
    reviewOldestDaysAgo?: number
    sessionsWithoutWrapUp?: number
    parentSummariesReady?: number
  },
): DonnaProactiveAlert[] {
  const alerts: DonnaProactiveAlert[] = []

  const pending = input.pendingReviews ?? 0
  const oldest = input.reviewOldestDaysAgo ?? 0
  if (pending > 0 && oldest > 3) {
    alerts.push(buildReviewAgingAlert(pending, oldest))
  }

  const missingWrapUps = input.sessionsWithoutWrapUp ?? 0
  if (missingWrapUps >= 2) {
    alerts.push(buildMissingWrapUpsAlert(missingWrapUps))
  }

  const summariesReady = input.parentSummariesReady ?? 0
  if (summariesReady > 0) {
    alerts.push(buildParentSummaryReadyAlert(summariesReady))
  }

  return alerts.sort((a, b) => {
    const ORDER: Record<AlertUrgency, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return ORDER[a.urgency] - ORDER[b.urgency]
  })
}

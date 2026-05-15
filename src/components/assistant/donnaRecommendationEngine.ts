// Sprint 375 — Donna Rule-Based Recommendations V1
// Pure rule engine — no React, no DB, no API calls.
// Produces recommendations from context signals (counts, flags) provided by the caller.

import {
  type DonnaRecommendation,
  type DonnaRecommendationSet,
  buildRecommendationSet,
} from './donnaRecommendationTypes'

// ── Input signals ──────────────────────────────────────────────────────────────

export interface RecommendationSignals {
  pendingReviewCount: number       // Proposed actions awaiting director approval
  pendingPlacementCount: number    // Players in placement queue
  todaySessionCount: number        // Sessions scheduled today
  hasActiveDraft: boolean          // Whether Donna has an in-flight draft
  currentPathname: string          // Director's current route (e.g. /director/players)
}

// ── ID counter (in-memory, reset per engine call) ─────────────────────────────

let _idSeq = 0
function nextId(): string {
  _idSeq += 1
  return `rec_${Date.now()}_${_idSeq}`
}

// ── Rule definitions ──────────────────────────────────────────────────────────

/**
 * Evaluate all rules against the provided signals and return a recommendation set.
 * Rules are checked in priority order. Each produces 0 or 1 recommendation.
 */
export function evaluateRecommendations(signals: RecommendationSignals): DonnaRecommendationSet {
  const recs: DonnaRecommendation[] = []
  const now = new Date().toISOString()

  // ── Rule 1: Urgent pending reviews ─────────────────────────────────────────
  if (signals.pendingReviewCount > 5) {
    recs.push({
      id: nextId(),
      category: 'operations',
      priority: 'critical',
      title: `${signals.pendingReviewCount} items awaiting your review`,
      rationale: 'Your review queue is backed up — items may be blocking session execution.',
      action: {
        type: 'open_review',
        label: 'Open review queue',
      },
      createdAt: now,
      signalKey: 'pending_review_count',
      signalValue: signals.pendingReviewCount,
    })
  } else if (signals.pendingReviewCount > 0) {
    recs.push({
      id: nextId(),
      category: 'operations',
      priority: 'high',
      title: `${signals.pendingReviewCount} ${signals.pendingReviewCount === 1 ? 'item' : 'items'} in review queue`,
      rationale: 'Proposed actions are waiting for your approval.',
      action: {
        type: 'open_review',
        label: 'Review now',
      },
      createdAt: now,
      signalKey: 'pending_review_count',
      signalValue: signals.pendingReviewCount,
    })
  }

  // ── Rule 2: Pending player placements ──────────────────────────────────────
  if (signals.pendingPlacementCount > 3) {
    recs.push({
      id: nextId(),
      category: 'player',
      priority: 'high',
      title: `${signals.pendingPlacementCount} players need placement`,
      rationale: 'Multiple players are in the placement queue and cannot attend sessions until placed.',
      action: {
        type: 'navigate',
        destination: '/director/players',
        label: 'Go to players',
      },
      createdAt: now,
      signalKey: 'pending_placement_count',
      signalValue: signals.pendingPlacementCount,
    })
  } else if (signals.pendingPlacementCount > 0) {
    recs.push({
      id: nextId(),
      category: 'player',
      priority: 'normal',
      title: `${signals.pendingPlacementCount} ${signals.pendingPlacementCount === 1 ? 'player' : 'players'} awaiting placement`,
      rationale: 'New players need to be placed into groups before they can join sessions.',
      action: {
        type: 'navigate',
        destination: '/director/players',
        label: 'View players',
      },
      createdAt: now,
      signalKey: 'pending_placement_count',
      signalValue: signals.pendingPlacementCount,
    })
  }

  // ── Rule 3: Sessions today without template (proxy: sessions exist) ─────────
  if (signals.todaySessionCount > 0 && !signals.hasActiveDraft) {
    recs.push({
      id: nextId(),
      category: 'scheduling',
      priority: 'normal',
      title: `${signals.todaySessionCount} ${signals.todaySessionCount === 1 ? 'session' : 'sessions'} scheduled today`,
      rationale: 'Donna can draft coach briefs or attendance notes for today\'s sessions.',
      action: {
        type: 'navigate',
        destination: '/director/sessions',
        label: 'View sessions',
      },
      createdAt: now,
      signalKey: 'today_session_count',
      signalValue: signals.todaySessionCount,
    })
  }

  // ── Rule 4: No sessions + no draft + on dashboard → suggest template creation
  if (
    signals.todaySessionCount === 0 &&
    !signals.hasActiveDraft &&
    signals.currentPathname === '/director'
  ) {
    recs.push({
      id: nextId(),
      category: 'curriculum',
      priority: 'low',
      title: 'Create a class template',
      rationale: 'No sessions are scheduled today. Start by building a class template.',
      action: {
        type: 'start_workflow',
        workflowId: 'create_class_template',
        label: 'Draft a template',
      },
      createdAt: now,
    })
  }

  return buildRecommendationSet(recs)
}

// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 3 — Page Task Resolver
//
// Determines the highest-priority task for a given route.
// Answers: What needs to be done here?
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Uses static route intelligence — no live data fabrication.
//   - pendingReviews and similar signals from DonnaMessageInput can be passed
//     in to sharpen task selection when available.

import type { PageIntelligence } from './pageContextResolver'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaskUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface PageTask {
  /** Short label for this task */
  highestPriorityTask: string
  /** Why this is the highest-priority task */
  reason: string
  /** How urgent this task is */
  urgency: TaskUrgency
  /** Estimated impact of completing this task */
  estimatedImpact: string
  /** What completion looks like for this task */
  completionCriteria: string
  /** Optional navigation route to resolve this task */
  actionRoute: string | null
}

// ── Optional count signals from the brain ─────────────────────────────────────

export interface TaskSignals {
  pendingReviews?: number
}

// ── Task definitions per route ────────────────────────────────────────────────

const ROUTE_TASKS: Record<string, (signals: TaskSignals) => PageTask> = {
  '/director': (signals) => ({
    highestPriorityTask: signals.pendingReviews && signals.pendingReviews > 0
      ? `Review ${signals.pendingReviews} pending item${signals.pendingReviews > 1 ? 's' : ''} in the approval queue`
      : 'Check attention signals and review queue status',
    reason: 'Pending items in the review queue affect coaches and players the moment they are approved.',
    urgency: signals.pendingReviews && signals.pendingReviews > 5 ? 'high' : 'medium',
    estimatedImpact: 'Unblocks coaches from receiving session feedback and clears player-facing flags.',
    completionCriteria: 'Review queue cleared or triaged; attention signals reviewed.',
    actionRoute: '/director/review',
  }),

  '/director/review': (signals) => ({
    highestPriorityTask: signals.pendingReviews && signals.pendingReviews > 0
      ? `Act on ${signals.pendingReviews} pending approval${signals.pendingReviews > 1 ? 's' : ''}`
      : 'Review any items in the queue',
    reason: 'Items in the queue have no effect until the director explicitly approves, rejects, or defers each one.',
    urgency: signals.pendingReviews && signals.pendingReviews > 0 ? 'high' : 'low',
    estimatedImpact: 'Each approval immediately unblocks the associated coach or player action.',
    completionCriteria: 'All items reviewed; none older than 7 days remaining.',
    actionRoute: null,
  }),

  '/director/kpi': (_signals) => ({
    highestPriorityTask: 'Act on attention signals — open each flagged player profile',
    reason: 'Attention signals represent players at risk of falling behind or disengaging. Each has a direct action.',
    urgency: 'medium',
    estimatedImpact: 'Early intervention on attention signals prevents attendance drop and disengagement.',
    completionCriteria: 'Every flagged player has a next action recorded or a follow-up plan set.',
    actionRoute: '/director/players',
  }),

  '/director/players': (_signals) => ({
    highestPriorityTask: 'Resolve players with missing curriculum levels or unresolved attention flags',
    reason: 'Players without curriculum levels cannot track progression. Flagged players need director action.',
    urgency: 'high',
    estimatedImpact: 'Assigns development context to players currently invisible to the curriculum system.',
    completionCriteria: 'All active players have curriculum levels; no unresolved attention flags.',
    actionRoute: null,
  }),

  '/director/curriculum': (_signals) => ({
    highestPriorityTask: 'Activate the curriculum spine — define levels and assign all active players',
    reason: 'Curriculum spine is the backbone of progression tracking. Without it, player development data is unstructured and cannot drive advancement decisions.',
    urgency: 'critical',
    estimatedImpact: 'High — enables progression tracking, assessment evidence, and advancement decisions for all active players.',
    completionCriteria: 'Curriculum spine active; all players assigned a curriculum level; assessment criteria defined per level.',
    actionRoute: null,
  }),

  '/director/level-up': (_signals) => ({
    highestPriorityTask: 'Review advancement candidates — check evidence, then approve or defer',
    reason: 'Advancement-eligible players are waiting for director review. Delays beyond 14 days stall player momentum.',
    urgency: 'high',
    estimatedImpact: 'Each approved advancement moves a player to the next curriculum level and activates new development criteria.',
    completionCriteria: 'All candidates reviewed; level decisions recorded; no candidates waiting longer than 14 days.',
    actionRoute: null,
  }),

  '/director/placement': (_signals) => ({
    highestPriorityTask: 'Complete placement for all intake players',
    reason: 'Intake players cannot participate in tracked sessions or build curriculum records until placed.',
    urgency: 'critical',
    estimatedImpact: 'High — unblocks each player from the development record system.',
    completionCriteria: 'All intake players have a curriculum level and group assigned; finalize_player_placement() called for each.',
    actionRoute: null,
  }),

  '/director/parents': (_signals) => ({
    highestPriorityTask: 'Review and dispatch pending parent update drafts',
    reason: 'Families without recent updates lose confidence in the academy. Drafts approved but not sent are invisible to parents.',
    urgency: 'medium',
    estimatedImpact: 'Improves parent confidence and reduces churn risk for families with communication gaps.',
    completionCriteria: 'No pending drafts older than 3 days; all approved updates dispatched.',
    actionRoute: null,
  }),

  '/director/sessions': (_signals) => ({
    highestPriorityTask: 'Follow up on sessions missing coach wrap-ups',
    reason: 'Sessions without wrap-ups have no development record. Coaches need follow-up to close the session loop.',
    urgency: 'medium',
    estimatedImpact: 'Each wrap-up submitted creates an attendance record and session intelligence for the review queue.',
    completionCriteria: 'All completed sessions have coach wrap-ups submitted.',
    actionRoute: '/director/review',
  }),

  '/director/onboarding': (_signals) => ({
    highestPriorityTask: 'Complete all 7 onboarding steps — start with Academy DNA selection',
    reason: 'Academy DNA drives all curriculum, coaching, and assessment decisions. DONNA cannot give academy-specific guidance until it is set.',
    urgency: 'critical',
    estimatedImpact: 'High — completing onboarding unlocks full operating mode and academy-specific DONNA intelligence.',
    completionCriteria: 'All 7 steps completed; DNA model selected; first curriculum level created; first group created.',
    actionRoute: null,
  }),
}

// Dynamic route task builders
const DYNAMIC_ROUTE_TASKS: Array<{ prefix: string; build: (signals: TaskSignals) => PageTask }> = [
  {
    prefix: '/director/players/',
    build: (_signals) => ({
      highestPriorityTask: "Review player's current level and last assessment date",
      reason: 'Players without a current assessment may be misplaced. Assessment data drives advancement decisions.',
      urgency: 'medium',
      estimatedImpact: 'Ensures accurate curriculum placement and enables evidence-based advancement.',
      completionCriteria: 'Curriculum level current; assessment on file within 90 days; coach assigned; no unresolved flags.',
      actionRoute: null,
    }),
  },
  {
    prefix: '/director/groups/',
    build: (_signals) => ({
      highestPriorityTask: 'Verify coach assignment and curriculum alignment for this group',
      reason: 'Groups without coach assignments or curriculum alignment cannot run curriculum-tracked sessions.',
      urgency: 'medium',
      estimatedImpact: 'Enables curriculum-aligned session delivery and progression tracking for all players in the group.',
      completionCriteria: 'Coach assigned; curriculum level defined; all players have assigned levels.',
      actionRoute: null,
    }),
  },
]

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns the highest-priority task for a given route.
 * Uses page intelligence + optional count signals.
 */
export function resolvePageTask(
  intel: PageIntelligence,
  signals: TaskSignals = {},
): PageTask {
  const route = intel.route

  // Exact route match
  if (ROUTE_TASKS[route]) {
    return ROUTE_TASKS[route](signals)
  }

  // Dynamic route match
  for (const entry of DYNAMIC_ROUTE_TASKS) {
    if (route.startsWith(entry.prefix)) {
      return entry.build(signals)
    }
  }

  // Generic fallback from page intelligence
  return {
    highestPriorityTask: intel.recommendedNextAction,
    reason: `This page's completion depends on: ${intel.completionGoals[0] ?? 'reviewing the items shown here'}.`,
    urgency: 'medium',
    estimatedImpact: 'Moves this page toward its completion criteria.',
    completionCriteria: intel.completionGoals[0] ?? 'Items reviewed and actioned.',
    actionRoute: null,
  }
}

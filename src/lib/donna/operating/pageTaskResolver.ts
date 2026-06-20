// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 3 — Page Task Resolver
//
// Determines the highest-priority task for a given route.
// Answers: What needs to be done here?
//
// Mega Sprint 3091–3120 — Live State-Aware Completion Engine V1
// Extended to accept LivePageState signals so task selection reflects
// actual academy reality rather than static defaults.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Live state is optional — falls back to static when null.
//   - Null counts in liveState mean unknown, not zero.

import type { PageIntelligence } from './pageContextResolver'
import type { LivePageState } from './livePageState'

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
  /** Live academy state — when provided, task selection uses real counts instead of static defaults */
  liveState?: LivePageState | null
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

  '/director/review': (signals) => {
    const live = signals.liveState
    const parentApprovals = live?.pendingParentApprovals ?? null
    const total = signals.pendingReviews ?? 0

    if (parentApprovals !== null && parentApprovals > 0) {
      return {
        highestPriorityTask: `Review ${parentApprovals} parent-visible item${parentApprovals > 1 ? 's' : ''} first — these affect what families see`,
        reason: 'Parent-visible items affect family experience the moment they are approved. Review these before coach or curriculum items.',
        urgency: 'high' as TaskUrgency,
        estimatedImpact: 'High — each approval immediately updates what parents can see.',
        completionCriteria: 'All parent-visible items reviewed; remaining items triaged.',
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: total > 0
        ? `Act on ${total} pending approval${total > 1 ? 's' : ''}`
        : 'Review any items in the queue',
      reason: 'Items in the queue have no effect until the director explicitly approves, rejects, or defers each one.',
      urgency: (total > 0 ? 'high' : 'low') as TaskUrgency,
      estimatedImpact: 'Each approval immediately unblocks the associated coach or player action.',
      completionCriteria: 'All items reviewed; none older than 7 days remaining.',
      actionRoute: null,
    }
  },

  '/director/kpi': (_signals) => ({
    highestPriorityTask: 'Act on attention signals — open each flagged player profile',
    reason: 'Attention signals represent players at risk of falling behind or disengaging. Each has a direct action.',
    urgency: 'medium',
    estimatedImpact: 'Early intervention on attention signals prevents attendance drop and disengagement.',
    completionCriteria: 'Every flagged player has a next action recorded or a follow-up plan set.',
    actionRoute: '/director/players',
  }),

  '/director/players': (signals) => {
    const live = signals.liveState
    const attention = live?.playersNeedingAttention ?? null
    const noAssessment = live?.playersWithoutAssessment ?? null

    if (attention !== null && attention > 0) {
      return {
        highestPriorityTask: `Review ${attention} player${attention > 1 ? 's' : ''} with active attention flags`,
        reason: `${attention} player${attention > 1 ? 's' : ''} have signals that need follow-up. ${noAssessment !== null && noAssessment > 0 ? `Additionally, ${noAssessment} player${noAssessment > 1 ? 's' : ''} have not been assessed in 90+ days.` : ''}`.trim(),
        urgency: 'high' as TaskUrgency,
        estimatedImpact: 'Early intervention on attention signals prevents attendance drop and disengagement.',
        completionCriteria: 'Every flagged player has a next action recorded or a follow-up plan set.',
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: 'Resolve players with missing curriculum levels or unresolved attention flags',
      reason: `Players without curriculum levels cannot track progression. Flagged players need director action.${noAssessment !== null && noAssessment > 0 ? ` ${noAssessment} player${noAssessment > 1 ? 's' : ''} also have overdue assessments.` : ''}`,
      urgency: 'high' as TaskUrgency,
      estimatedImpact: 'Assigns development context to players currently invisible to the curriculum system.',
      completionCriteria: 'All active players have curriculum levels; no unresolved attention flags.',
      actionRoute: null,
    }
  },

  '/director/curriculum': (signals) => {
    const live = signals.liveState
    const spineActive = live?.curriculumSpineActive ?? null
    const missing = live?.playersMissingCurriculumLevel ?? null

    if (spineActive === false) {
      return {
        highestPriorityTask: 'Activate the curriculum spine — define and activate your curriculum levels',
        reason: 'No curriculum levels are active. Player progression cannot be tracked until the spine is live.',
        urgency: 'critical' as TaskUrgency,
        estimatedImpact: 'High — enables progression tracking for all active players.',
        completionCriteria: 'At least one curriculum level defined and active.',
        actionRoute: null,
      }
    }

    if (spineActive === true && missing !== null && missing > 0) {
      return {
        highestPriorityTask: `Assign curriculum levels to ${missing} player${missing > 1 ? 's' : ''}`,
        reason: `${missing} active player${missing > 1 ? 's' : ''} cannot track progression without a curriculum level.`,
        urgency: (missing > 5 ? 'high' : 'medium') as TaskUrgency,
        estimatedImpact: `High — unblocks ${missing} player${missing > 1 ? 's' : ''} from the development record system.`,
        completionCriteria: 'All active players have a curriculum level assigned.',
        actionRoute: null,
      }
    }

    if (spineActive === true && missing === 0) {
      return {
        highestPriorityTask: 'Review assessment criteria and coach-curriculum alignment',
        reason: 'Spine is active and all players are assigned. The next quality layer is assessment standards.',
        urgency: 'medium' as TaskUrgency,
        estimatedImpact: 'Medium — improves progression decision quality across all levels.',
        completionCriteria: 'Assessment criteria defined per level; coach alignment reviewed.',
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: 'Activate the curriculum spine — define levels and assign all active players',
      reason: 'Curriculum spine is the backbone of progression tracking. Without it, player development data is unstructured.',
      urgency: 'critical' as TaskUrgency,
      estimatedImpact: 'High — enables progression tracking, assessment evidence, and advancement decisions.',
      completionCriteria: 'Curriculum spine active; all players assigned; assessment criteria defined.',
      actionRoute: null,
    }
  },

  '/director/level-up': (signals) => {
    const live = signals.liveState
    const count = live?.levelUpQueueCount ?? null

    if (count === 0) {
      return {
        highestPriorityTask: 'No advancement candidates at this time',
        reason: 'The level-up review queue is currently empty.',
        urgency: 'low' as TaskUrgency,
        estimatedImpact: 'Low — check back after the next assessment cycle.',
        completionCriteria: 'Queue is empty. Monitor for new candidates.',
        actionRoute: null,
      }
    }

    if (count !== null && count > 0) {
      return {
        highestPriorityTask: `Review ${count} advancement candidate${count > 1 ? 's' : ''}`,
        reason: `${count} player${count > 1 ? 's are' : ' is'} eligible for advancement. Delays beyond 14 days stall player momentum.`,
        urgency: (count > 3 ? 'high' : 'medium') as TaskUrgency,
        estimatedImpact: 'Each approved advancement moves a player to the next curriculum level.',
        completionCriteria: `All ${count} candidate${count > 1 ? 's' : ''} reviewed; decisions recorded.`,
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: 'Review advancement candidates — check evidence, then approve or defer',
      reason: 'Advancement-eligible players are waiting for director review. Delays beyond 14 days stall player momentum.',
      urgency: 'high' as TaskUrgency,
      estimatedImpact: 'Each approved advancement moves a player to the next curriculum level.',
      completionCriteria: 'All candidates reviewed; no candidates waiting longer than 14 days.',
      actionRoute: null,
    }
  },

  '/director/placement': (signals) => {
    const live = signals.liveState
    const count = live?.placementQueueCount ?? null

    if (count === 0) {
      return {
        highestPriorityTask: 'Placement queue is clear — no intake players waiting',
        reason: 'All intake players have been placed and activated.',
        urgency: 'low' as TaskUrgency,
        estimatedImpact: 'Low — no action needed now.',
        completionCriteria: 'Queue empty.',
        actionRoute: null,
      }
    }

    if (count !== null && count > 0) {
      return {
        highestPriorityTask: `Complete placement for ${count} intake player${count > 1 ? 's' : ''}`,
        reason: `${count} player${count > 1 ? 's' : ''} cannot participate in tracked sessions until placed.`,
        urgency: 'critical' as TaskUrgency,
        estimatedImpact: `High — unblocks ${count} player${count > 1 ? 's' : ''} from the development record system.`,
        completionCriteria: `All ${count} intake player${count > 1 ? 's' : ''} placed; finalize_player_placement() called.`,
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: 'Complete placement for all intake players',
      reason: 'Intake players cannot participate in tracked sessions or build curriculum records until placed.',
      urgency: 'critical' as TaskUrgency,
      estimatedImpact: 'High — unblocks each player from the development record system.',
      completionCriteria: 'All intake players have a curriculum level and group assigned; finalize_player_placement() called.',
      actionRoute: null,
    }
  },

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

  '/director/onboarding': (signals) => {
    const live = signals.liveState
    const complete = live?.onboardingComplete ?? null
    const progress = live?.onboardingProgress ?? null

    if (complete === true) {
      return {
        highestPriorityTask: 'Onboarding is complete — no further setup actions required',
        reason: 'All onboarding steps have been completed. The academy is operating in full mode.',
        urgency: 'low' as TaskUrgency,
        estimatedImpact: 'Low — focus shifts to day-to-day operations and curriculum quality.',
        completionCriteria: 'Already complete.',
        actionRoute: null,
      }
    }

    const progressLabel = progress !== null ? ` (${progress}/7 complete)` : ''
    return {
      highestPriorityTask: `Continue academy onboarding${progressLabel} — next step awaits`,
      reason: 'Academy DNA drives all curriculum, coaching, and assessment decisions. DONNA cannot give academy-specific guidance until onboarding is complete.',
      urgency: 'critical' as TaskUrgency,
      estimatedImpact: 'High — completing onboarding unlocks full operating mode and academy-specific DONNA intelligence.',
      completionCriteria: 'All 7 steps completed; DNA model selected; first curriculum level created; first group created.',
      actionRoute: null,
    }
  },

  // ── Coach routes (Mega Sprint 3121–3150) ──────────────────────────────────────
  '/coach': (_signals) => ({
    highestPriorityTask: 'Check pending wrap-ups and review sessions scheduled for today',
    reason: 'Sessions without submitted wrap-ups have no development record. Each day without a wrap-up widens the coaching intelligence gap.',
    urgency: 'high' as TaskUrgency,
    estimatedImpact: 'Each wrap-up submitted creates an attendance record and session intelligence for the director review queue.',
    completionCriteria: 'All completed sessions have submitted wrap-ups; no players with unaddressed attention flags.',
    actionRoute: null,
  }),

  '/director/sessions/new': (_signals) => ({
    highestPriorityTask: 'Complete session setup — assign template, coach, group, and schedule',
    reason: 'A session is not operational until it has a template, an assigned coach, a group, and a scheduled time.',
    urgency: 'high' as TaskUrgency,
    estimatedImpact: 'Creates a trackable session with curriculum alignment and coach accountability.',
    completionCriteria: 'Template assigned; coach assigned; group confirmed; session scheduled.',
    actionRoute: null,
  }),

  // Mega Sprint 3181–3210
  '/director/coaches': (signals) => {
    const live = signals.liveState
    const coachCount = live?.activeCoachCount ?? null
    const unassigned = live?.unassignedSessions ?? null

    if (coachCount !== null && coachCount === 0) {
      return {
        highestPriorityTask: 'No active coaches yet — invite your first coach',
        reason: 'The academy has no active coaches. Sessions and curriculum delivery depend on at least one coach.',
        urgency: 'critical' as TaskUrgency,
        estimatedImpact: 'High — enables session delivery and curriculum tracking.',
        completionCriteria: 'At least one coach invited and active.',
        actionRoute: null,
      }
    }

    if (unassigned !== null && unassigned > 0) {
      return {
        highestPriorityTask: `Assign coaches to ${unassigned} unassigned session${unassigned > 1 ? 's' : ''}`,
        reason: `${unassigned} upcoming session${unassigned > 1 ? 's' : ''} have no coach assigned. Sessions cannot run without coach assignment.`,
        urgency: 'high' as TaskUrgency,
        estimatedImpact: 'Ensures session delivery accountability and curriculum tracking.',
        completionCriteria: 'All upcoming sessions have assigned coaches.',
        actionRoute: null,
      }
    }

    return {
      highestPriorityTask: 'Review active coaches and verify group assignments',
      reason: 'A coach without a group assignment creates a scheduling gap. Verify coverage before the next session cycle.',
      urgency: 'medium' as TaskUrgency,
      estimatedImpact: 'Ensures all sessions have coaching coverage and curriculum alignment.',
      completionCriteria: 'All active coaches have at least one assigned group or session.',
      actionRoute: null,
    }
  },
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
  // ── Coach session dynamic entry (Mega Sprint 3121–3150) ───────────────────────
  {
    prefix: '/coach/sessions/',
    build: (_signals) => ({
      highestPriorityTask: 'Mark attendance, add observations, then submit the wrap-up',
      reason: 'A session is only closed when the wrap-up is submitted. Until then, no development record exists for this session.',
      urgency: 'high' as TaskUrgency,
      estimatedImpact: 'High — creates a session development record for every player present.',
      completionCriteria: 'Attendance marked; at least one observation per player; wrap-up submitted.',
      actionRoute: null,
    }),
  },
  // ── Coach home fallback (must appear after /coach/sessions/) ─────────────────
  {
    prefix: '/coach/',
    build: (_signals) => ({
      highestPriorityTask: 'Submit pending wrap-ups and check players needing attention',
      reason: 'Unsubmitted wrap-ups leave sessions without development records. Players with attention signals need follow-up.',
      urgency: 'high' as TaskUrgency,
      estimatedImpact: 'Closes open session loops and surfaces players at risk.',
      completionCriteria: 'No pending wrap-ups; no unaddressed attention flags.',
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

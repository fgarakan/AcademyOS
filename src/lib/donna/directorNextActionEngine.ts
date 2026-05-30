// Sprint 968 — DONNA Director Next Action Engine V1
// Deterministic "What should I do next?" engine for the director role.
// Pure TypeScript — no DB calls, no API calls, no React, no mutations.
//
// Priority rules (V1):
//   1. Pending review items (reviewQueuePendingCount > 0)
//   2. Page-specific recommendation — curriculum
//   3. Page-specific recommendation — class template detail
//   4. Page-specific recommendation — class template list
//   5. Page-specific recommendation — sessions
//   6. Page-specific recommendation — players
//   7. Review page already clear
//   8. Fallback — academy dashboard / daily brief
//
// Live signal used in V1: reviewQueuePendingCount (already in DonnaAssistantButton state).
// All other signals are route/context-driven until V2 DB-backed next-action API.
//
// V2 improvements:
//   - Wire missingRecapCount, placementCount, advancementCount from /api/donna/brief
//   - Add per-player stall detection from player signal queries
//   - Add curriculum gap signals from coverage computation
//
// Usage:
//   const action = buildDirectorNextAction({ pendingReviews: 3, pathname: '/director' })
//   // action.summary: "Your best next action is to open the Review Queue..."
//   // action.targetFocusId: 'review-queue-card'
//   // action.targetRoute: '/director/review'

// ── Output shape ──────────────────────────────────────────────────────────────

/** Safety classification for a recommended action. */
export type DirectorNextActionSafetyLevel =
  | 'safe'            // Read-only — viewing data, no mutation possible
  | 'review_only'     // Can look and navigate; any edit goes through a draft
  | 'approval_gated'  // Requires explicit director approve/reject before anything changes

/** The resolved next-action recommendation from the engine. */
export interface DirectorNextAction {
  /** Stable identifier for this recommendation type */
  id: string
  /** Short headline shown in the DONNA panel (e.g. "Review Queue") */
  title: string
  /** Full DONNA response text — calm COO style, one clear recommendation */
  summary: string
  /** Why this action matters right now */
  why: string
  /** Route to navigate to (when not already on that page) */
  targetRoute: string
  /** data-donna-focus-id of the element to highlight — undefined when not on the target page */
  targetFocusId?: string
  /** Safety classification */
  safetyLevel: DirectorNextActionSafetyLevel
  /** Whether any action here requires explicit director approval */
  requiresApproval: boolean
  /** Short click-target label (e.g. "Open Review Queue") */
  nextStepLabel: string
  /** Priority rank — 1 is highest urgency */
  priority: number
}

// ── Input ─────────────────────────────────────────────────────────────────────

/** Signals available to the engine in V1. */
export interface DirectorNextActionInput {
  /** Pending proposed_actions items awaiting review — from DonnaAssistantButton.reviewQueuePendingCount */
  pendingReviews?: number
  /** Current page pathname */
  pathname: string
}

// ── Intent detector ───────────────────────────────────────────────────────────

// These phrases are checked before matchesDailyBriefIntent in detectAndHandleCommand,
// so they must not overlap with the daily brief phrase set in donnaIntentClassifier.ts.
//
// Daily brief catches: "what needs my attention", "what should i focus on",
// "what are my priorities", "what should i handle first", "what should i do first".
//
// This set captures the distinct "next step" / "what to do next" intent family.
const WHAT_NEXT_PHRASES = [
  'what should i do next',
  'what do i do next',
  'walk me through what to do',
  'what is the priority',
  "what's the priority",
  'what is my priority',
  'what should i work on',
] as const

/**
 * Returns true when the input text matches the "what should I do next?" intent family.
 * Does NOT overlap with matchesDailyBriefIntent phrase set.
 */
export function matchesWhatNextIntent(text: string): boolean {
  const n = text.toLowerCase().trim()
  return WHAT_NEXT_PHRASES.some(p => n.includes(p))
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Build the highest-value deterministic next-action recommendation for a director.
 * Uses the pending review count as the primary live signal, falls back to
 * route/page-context-driven guidance when no live signals are available.
 *
 * No DB calls. No mutations. No navigation side effects.
 * Highlight is the caller's responsibility (dispatch 'donna:highlight' after setDonnaFocusTarget).
 */
export function buildDirectorNextAction(input: DirectorNextActionInput): DirectorNextAction {
  const { pendingReviews = 0, pathname } = input

  // ── Priority 1: Pending review queue items ────────────────────────────────
  // The review queue is always the highest priority when there are pending items.
  // Coach wrap-ups, observations, and parent updates are all blocked until reviewed.
  if (pendingReviews > 0) {
    const n = pendingReviews
    const plural = n === 1 ? 'item' : 'items'

    // Choose the best available focus target for the current page.
    // review-queue-card exists on /director (dashboard).
    // review-queue-primary wraps the entire Tabs component on /director/review — always present.
    // attendance-exceptions-section is conditional (only renders when exceptions exist) — kept for chip use.
    const isOnDashboard = pathname === '/director' || pathname === '/director/'
    const isOnReview = pathname.startsWith('/director/review')

    const targetFocusId = isOnDashboard
      ? 'review-queue-card'
      : isOnReview
      ? 'review-queue-primary'
      : undefined

    return {
      id: 'pending_review_queue',
      title: 'Review Queue',
      summary: `Your best next action is to open the Review Queue. You have ${n} pending ${plural} waiting for your decision, and clearing them turns coach input into official player evidence. It is safe to open — nothing changes until you approve or reject an item. I'm highlighting where to start.`,
      why: `Unreviewed items block the development pipeline. Coach observations and parent updates cannot be applied to player records until you make a decision on each one.`,
      targetRoute: '/director/review',
      targetFocusId,
      safetyLevel: 'approval_gated',
      requiresApproval: true,
      nextStepLabel: 'Open Review Queue',
      priority: 1,
    }
  }

  // ── Priority 2: Curriculum page ───────────────────────────────────────────
  if (pathname === '/director/curriculum' || pathname.startsWith('/director/curriculum/')) {
    return {
      id: 'curriculum_status_review',
      title: 'Curriculum Status',
      summary: `On the Curriculum page, start by reviewing the status overview. It shows which levels are active, which need attention, and whether any content is pending your review. I'm highlighting the curriculum status section. Nothing is changed until you explicitly approve a draft.`,
      why: `The curriculum status section gives you an at-a-glance view of your academy's development spine before you make any changes — it is always safe to start here.`,
      targetRoute: '/director/curriculum',
      targetFocusId: 'curriculum-status',
      safetyLevel: 'review_only',
      requiresApproval: false,
      nextStepLabel: 'Review Curriculum Status',
      priority: 2,
    }
  }

  // ── Priority 3: Class template detail ─────────────────────────────────────
  if (
    pathname.startsWith('/director/class-templates/') &&
    pathname.length > '/director/class-templates/'.length
  ) {
    return {
      id: 'class_template_primary_action',
      title: 'Class Template',
      summary: `On this class template, your next action is to complete the primary setup step. I'm pointing to the primary action area — this is where you finalize the template structure. No live session is affected until you explicitly generate one from this template.`,
      why: `Completing the template setup makes it available for session planning. All changes here are draft-only until you apply them.`,
      targetRoute: pathname,
      targetFocusId: 'class-template-primary-action',
      safetyLevel: 'review_only',
      requiresApproval: false,
      nextStepLabel: 'Complete Template Setup',
      priority: 2,
    }
  }

  // ── Priority 4: Class template list ──────────────────────────────────────
  if (pathname === '/director/class-templates' || pathname === '/director/class-templates/') {
    return {
      id: 'class_template_list',
      title: 'Class Templates',
      summary: `On the Class Templates page, your next action is to review your existing templates or create a new one. I'm highlighting the template list. Templates define how your sessions are structured — nothing changes in a live session until you explicitly generate one from a template.`,
      why: `Keeping class templates up to date ensures coaches run sessions that match your current curriculum priorities.`,
      targetRoute: '/director/class-templates',
      targetFocusId: 'template-list',
      safetyLevel: 'review_only',
      requiresApproval: false,
      nextStepLabel: 'Review Templates',
      priority: 3,
    }
  }

  // ── Priority 5: Sessions page ─────────────────────────────────────────────
  if (pathname.startsWith('/director/sessions')) {
    return {
      id: 'sessions_attention',
      title: 'Sessions',
      summary: `On the Sessions page, your next action is to review which sessions need attention — look for sessions without a wrap-up or ones scheduled today. I'm highlighting the session list. No data changes until a coach submits a wrap-up and you approve it in the Review Queue.`,
      why: `Sessions without wrap-ups mean coach observations are not yet part of the official player record. Identifying them early keeps your development pipeline moving.`,
      targetRoute: '/director/sessions',
      targetFocusId: 'session-list',
      safetyLevel: 'review_only',
      requiresApproval: false,
      nextStepLabel: 'Review Sessions',
      priority: 3,
    }
  }

  // ── Priority 6: Players page ──────────────────────────────────────────────
  if (pathname === '/director/players' || pathname.startsWith('/director/players/')) {
    return {
      id: 'player_attention',
      title: 'Players',
      summary: `On the Players page, your next action is to scan the player list for anyone needing attention — look for players with a pending placement or no curriculum level assigned. I'm highlighting the player list. Reviewing a player profile is always safe; nothing changes until you take an explicit action.`,
      why: `Players without a curriculum level or with a pending placement are not fully integrated into your development system. Reviewing them keeps your roster accurate.`,
      targetRoute: '/director/players',
      targetFocusId: 'player-list',
      safetyLevel: 'review_only',
      requiresApproval: false,
      nextStepLabel: 'Review Player List',
      priority: 3,
    }
  }

  // ── Priority 7: Review page already clear ────────────────────────────────
  // Reached only when pendingReviews === 0 and director is on the review page.
  if (pathname.startsWith('/director/review')) {
    return {
      id: 'review_queue_clear',
      title: 'Review Queue',
      summary: `Your Review Queue appears clear — no pending items require your decision right now. This is a good time to check upcoming sessions or review player development trajectories. Use the daily brief chips to get a full picture of where to focus next.`,
      why: `A clear queue means the academy is operating smoothly. Staying ahead of incoming signals is always valuable.`,
      targetRoute: '/director',
      targetFocusId: undefined,
      safetyLevel: 'safe',
      requiresApproval: false,
      nextStepLabel: 'View Dashboard',
      priority: 4,
    }
  }

  // ── Fallback: Director dashboard or unrecognised page ─────────────────────
  // On /director itself: highlight academy-metrics-section.
  // On other pages: recommend navigating to the dashboard.
  const isOnDashboard = pathname === '/director' || pathname === '/director/'
  return {
    id: 'dashboard_review',
    title: 'Academy Dashboard',
    summary: `Your best starting point is the Academy Dashboard. It shows today's sessions, your review queue, and any player alerts in one view. I'm highlighting the academy metrics section. Open the daily brief for a full COO-style summary of your priorities.`,
    why: `The dashboard gives you a complete picture before you take any specific action — it is the safest way to orient your day.`,
    targetRoute: '/director',
    targetFocusId: isOnDashboard ? 'academy-metrics-section' : undefined,
    safetyLevel: 'safe',
    requiresApproval: false,
    nextStepLabel: 'View Academy Dashboard',
    priority: 5,
  }
}

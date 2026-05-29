// Sprint 940 — DONNA Page Element Registry V1
// Structured registry of every highlightable, explainable UI element DONNA knows about.
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.
//
// Each entry maps a data-donna-focus-id target to DONNA's explanation, priority,
// and safety level. Used by the "What should I do next?" engine (Sprint 941)
// and any Shell that can trigger highlight guidance.
//
// Authoring standard:
//   - id:           Matches the data-donna-focus-id value on the DOM element.
//   - route:        Exact route pattern (may be parameterised, e.g. /coach/sessions/[id]).
//   - roles:        Which roles DONNA shows this element guidance to.
//   - priority:     'urgent' | 'high' | 'medium' | 'low'
//   - actionType:   'review' | 'submit' | 'navigate' | 'create' | 'inspect' | 'cta'
//   - safetyLevel:  'always_safe' | 'draft_to_review' | 'approval_required'
//   - explanation:  What DONNA says when pointing to this element.
//   - href:         Optional direct link DONNA can offer as a follow-up.
//   - dataDependent: If true, only surface this element when live data confirms it's relevant.

import type { DonnaContextRole } from './donnaPersonality'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ElementPriority = 'urgent' | 'high' | 'medium' | 'low'
export type ElementActionType = 'review' | 'submit' | 'navigate' | 'create' | 'inspect' | 'cta'
export type ElementSafetyLevel = 'always_safe' | 'draft_to_review' | 'approval_required'

export interface DonnaPageElement {
  /** Matches data-donna-focus-id on the DOM element */
  id: string
  /** Human-readable label for the DONNA highlight badge */
  label: string
  /** Route pattern this element belongs to. Use [param] for parameterised segments. */
  route: string
  /** Roles that can receive DONNA guidance for this element */
  roles: readonly DonnaContextRole[]
  /** Ordering priority when ranking "what to do next" */
  priority: ElementPriority
  /** Category of action this element enables */
  actionType: ElementActionType
  /** Safety classification of the action */
  safetyLevel: ElementSafetyLevel
  /** What DONNA says when pointing to this element */
  explanation: string
  /** Optional direct link for follow-up navigation */
  href?: string
  /** True when this element should only surface when live context confirms its relevance */
  dataDependent: boolean
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const DONNA_PAGE_ELEMENTS: readonly DonnaPageElement[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR DASHBOARD — /director
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'review-queue-card',
    label: 'Review Queue',
    route: '/director',
    roles: ['director'],
    priority: 'urgent',
    actionType: 'review',
    safetyLevel: 'approval_required',
    explanation: 'Your Review Queue has pending items that need your decision before they affect any records. This is the highest-priority action on your dashboard.',
    href: '/director/review',
    dataDependent: true,
  },
  {
    id: 'player-attention-card',
    label: 'Player Attention Flags',
    route: '/director',
    roles: ['director'],
    priority: 'high',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'These players have signals that may need your attention — missing observations, attendance gaps, or stalled development. Review before your next coaching cycle.',
    href: '/director/players',
    dataDependent: true,
  },
  {
    id: 'sessions-this-week-card',
    label: 'Sessions This Week',
    route: '/director',
    roles: ['director'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Your upcoming and recent session overview. Check here to see which sessions still need a coach wrap-up submitted.',
    href: '/director/sessions',
    dataDependent: false,
  },
  {
    id: 'today-command-center',
    label: 'Daily Command Center',
    route: '/director',
    roles: ['director'],
    priority: 'high',
    actionType: 'navigate',
    safetyLevel: 'always_safe',
    explanation: 'Your daily command view — what is happening today, what needs review, and what requires your attention. Start here every morning.',
    dataDependent: false,
  },
  {
    id: 'academy-metrics-section',
    label: 'Academy Metrics',
    route: '/director',
    roles: ['director'],
    priority: 'low',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Your academy health KPIs — enrollment, attendance, and development signals at a glance.',
    dataDependent: false,
  },
  {
    id: 'alerts-placement-section',
    label: 'Alerts & Placement',
    route: '/director',
    roles: ['director'],
    priority: 'high',
    actionType: 'review',
    safetyLevel: 'approval_required',
    explanation: 'Active alerts and players waiting for placement decisions. Unresolved placements block the development pipeline.',
    href: '/director/placement',
    dataDependent: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR REVIEW CENTER — /director/review
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pending-review-list',
    label: 'Pending Review Items',
    route: '/director/review',
    roles: ['director'],
    priority: 'urgent',
    actionType: 'review',
    safetyLevel: 'approval_required',
    explanation: 'These items are waiting for your decision — approve, reject, or ask for clarification. Nothing takes effect until you act here.',
    dataDependent: true,
  },
  {
    id: 'attendance-exceptions-section',
    label: 'Attendance Exceptions',
    route: '/director/review',
    roles: ['director'],
    priority: 'high',
    actionType: 'review',
    safetyLevel: 'approval_required',
    explanation: 'Attendance exceptions need your review before they update player records. Check the reason and approve or reject each one.',
    dataDependent: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR PLAYERS — /director/players
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'player-directory-summary',
    label: 'Player Directory',
    route: '/director/players',
    roles: ['director'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Your full roster. Players without a curriculum level assigned are shown first — assign levels before onboarding is complete.',
    dataDependent: false,
  },
  {
    id: 'players-missing-level',
    label: 'Players Without Level',
    route: '/director/players',
    roles: ['director'],
    priority: 'high',
    actionType: 'cta',
    safetyLevel: 'approval_required',
    explanation: 'These players are active but have no curriculum level assigned. Assign a level so coaches can deliver structured sessions for them.',
    dataDependent: true,
  },
  {
    id: 'player-filter-bar',
    label: 'Player Filter',
    route: '/director/players',
    roles: ['director'],
    priority: 'low',
    actionType: 'navigate',
    safetyLevel: 'always_safe',
    explanation: 'Use the filter bar to narrow by attention flag, curriculum level, or group to find the players that need your focus.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR SESSIONS — /director/sessions
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'session-list',
    label: 'Session List',
    route: '/director/sessions',
    roles: ['director'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'All academy sessions. Filter to find sessions that are missing wrap-ups or need a review from the director.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR SESSION DETAIL — /director/sessions/[sessionId]
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'session-blocks',
    label: 'Session Blocks',
    route: '/director/sessions/[sessionId]',
    roles: ['director'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'The planned curriculum blocks for this session — what was scheduled to be delivered.',
    dataDependent: false,
  },
  {
    id: 'session-roster-attendance',
    label: 'Roster & Attendance',
    route: '/director/sessions/[sessionId]',
    roles: ['director'],
    priority: 'high',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Which players were expected and whether they attended. Check for attendance exceptions that need your review.',
    dataDependent: false,
  },
  {
    id: 'session-roster-intelligence',
    label: 'Class Intelligence',
    route: '/director/sessions/[sessionId]',
    roles: ['director'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Development signals for the players in this session — priorities, attention flags, and curriculum context.',
    dataDependent: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR CLASS TEMPLATES — /director/class-templates
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'create-template-button',
    label: 'New Template',
    route: '/director/class-templates',
    roles: ['director'],
    priority: 'medium',
    actionType: 'create',
    safetyLevel: 'draft_to_review',
    explanation: 'Create a new class template here — a structured session plan that coaches can use to deliver consistent training.',
    href: '/director/class-templates/new',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR CLASS TEMPLATE DETAIL — /director/class-templates/[templateId]
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'template-stepper',
    label: 'Template Builder',
    route: '/director/class-templates/[templateId]',
    roles: ['director'],
    priority: 'high',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'The multi-step template builder — name, level, blocks, and session generation. Follow the steps in order.',
    dataDependent: false,
  },
  {
    id: 'template-blocks-section',
    label: 'Template Blocks',
    route: '/director/class-templates/[templateId]',
    roles: ['director'],
    priority: 'high',
    actionType: 'create',
    safetyLevel: 'draft_to_review',
    explanation: 'Add drills, exercises, and curriculum content to the template blocks here — Step 3 of the builder.',
    dataDependent: false,
  },
  {
    id: 'template-generate-session',
    label: 'Generate Session',
    route: '/director/class-templates/[templateId]',
    roles: ['director'],
    priority: 'medium',
    actionType: 'cta',
    safetyLevel: 'draft_to_review',
    explanation: 'Generate a real session from this template — Step 5. The session goes into your session list for coaches to deliver.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR CURRICULUM BUILDER — /director/curriculum/builder
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'curriculum-builder-hero',
    label: 'Curriculum Builder',
    route: '/director/curriculum/builder',
    roles: ['director'],
    priority: 'high',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Select a pathway here to review or customise your academy\'s curriculum levels. Changes go to the review queue — nothing publishes automatically.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR NEW TEMPLATE — /director/class-templates/new
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'create-template-form',
    label: 'Template Form',
    route: '/director/class-templates/new',
    roles: ['director'],
    priority: 'high',
    actionType: 'create',
    safetyLevel: 'draft_to_review',
    explanation: 'Fill in the template name, target level, and session structure here. The template won\'t be published until you confirm.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COACH HUB — /coach
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'coach-today-sessions',
    label: "Today's Sessions",
    route: '/coach',
    roles: ['coach'],
    priority: 'urgent',
    actionType: 'navigate',
    safetyLevel: 'always_safe',
    explanation: "Your session schedule for today is here. Tap a session to open it, mark attendance, and submit your wrap-up.",
    dataDependent: false,
  },
  {
    id: 'coach-players-section',
    label: 'My Players',
    route: '/coach',
    roles: ['coach'],
    priority: 'medium',
    actionType: 'navigate',
    safetyLevel: 'always_safe',
    explanation: 'Your recent players — the athletes you have coached in the last 30 days and their current curriculum levels.',
    href: '/coach/players',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COACH SESSION DETAIL — /coach/sessions/[sessionId]
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'coach-lesson-plan',
    label: "Today's Plan",
    route: '/coach/sessions/[sessionId]',
    roles: ['coach'],
    priority: 'high',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: "Your lesson plan for this session — the curriculum focus, drills, and blocks your director has prepared. Review before you start.",
    dataDependent: true,
  },
  {
    id: 'coach-run-session',
    label: 'Run Session',
    route: '/coach/sessions/[sessionId]',
    roles: ['coach'],
    priority: 'urgent',
    actionType: 'cta',
    safetyLevel: 'always_safe',
    explanation: 'Mark attendance and track your block delivery here during the session. Tap each player to mark present, absent, or late.',
    dataDependent: false,
  },
  {
    id: 'coach-wrap-up-link',
    label: 'Session Wrap-Up',
    route: '/coach/sessions/[sessionId]',
    roles: ['coach'],
    priority: 'urgent',
    actionType: 'submit',
    safetyLevel: 'draft_to_review',
    explanation: "After the session, tap here to submit your wrap-up — what happened, who stood out, and any concerns. It goes to your director for review.",
    dataDependent: false,
  },
  {
    id: 'coach-player-watch-list',
    label: 'Player Watch List',
    route: '/coach/sessions/[sessionId]',
    roles: ['coach'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Players in this session who have active development priorities or attention flags — check these before you start so you can watch for what matters.',
    dataDependent: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COACH WRAP-UP — /coach/sessions/[sessionId]/wrap-up
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wrapup-question-card',
    label: 'Wrap-Up Question',
    route: '/coach/sessions/[sessionId]/wrap-up',
    roles: ['coach'],
    priority: 'urgent',
    actionType: 'submit',
    safetyLevel: 'draft_to_review',
    explanation: 'Answer this wrap-up question — your answer stays in draft until you submit for review. Take 30 seconds and be honest.',
    dataDependent: false,
  },
  {
    id: 'wrapup-nav-actions',
    label: 'Submit for Review',
    route: '/coach/sessions/[sessionId]/wrap-up',
    roles: ['coach'],
    priority: 'urgent',
    actionType: 'submit',
    safetyLevel: 'draft_to_review',
    explanation: 'Tap "Submit for Review" here when you\'ve answered the wrap-up questions. Your director will review it before anything affects player records.',
    dataDependent: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COACH PLAYERS — /coach/players
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'coach-player-list',
    label: 'Player List',
    route: '/coach/players',
    roles: ['coach'],
    priority: 'medium',
    actionType: 'inspect',
    safetyLevel: 'always_safe',
    explanation: 'Your players from the last 30 days — tap any player to review their current curriculum level and session history.',
    dataDependent: false,
  },
]

// ── Lookup utilities ──────────────────────────────────────────────────────────

/** Returns all registered elements for a given route + role. */
export function getPageElements(
  pathname: string,
  role: DonnaContextRole,
): DonnaPageElement[] {
  return DONNA_PAGE_ELEMENTS.filter(el => {
    if (!el.roles.includes(role)) return false
    // Match exact route or parameterised pattern
    const pattern = el.route.replace(/\[[^\]]+\]/g, '[^/]+')
    return new RegExp(`^${pattern}$`).test(pathname)
  })
}

/** Returns elements sorted by priority (urgent first, low last). */
export function getPageElementsSorted(
  pathname: string,
  role: DonnaContextRole,
): DonnaPageElement[] {
  const PRIORITY_ORDER: Record<ElementPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  return getPageElements(pathname, role).sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )
}

/** Returns the single highest-priority element for the given route + role. */
export function getTopPageElement(
  pathname: string,
  role: DonnaContextRole,
): DonnaPageElement | null {
  return getPageElementsSorted(pathname, role)[0] ?? null
}

/** Returns a count of elements at each priority level for diagnostics. */
export function getPageElementSummary(
  pathname: string,
  role: DonnaContextRole,
): { total: number; urgent: number; high: number; medium: number; low: number } {
  const els = getPageElements(pathname, role)
  return {
    total: els.length,
    urgent: els.filter(e => e.priority === 'urgent').length,
    high:   els.filter(e => e.priority === 'high').length,
    medium: els.filter(e => e.priority === 'medium').length,
    low:    els.filter(e => e.priority === 'low').length,
  }
}

/** Returns all elements with a given safety level across all routes. */
export function getElementsBySafetyLevel(level: ElementSafetyLevel): DonnaPageElement[] {
  return DONNA_PAGE_ELEMENTS.filter(el => el.safetyLevel === level) as DonnaPageElement[]
}

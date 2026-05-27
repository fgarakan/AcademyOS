// Sprint 755 — DONNA Safe UI Action Dispatcher V1
// Sprint 759 — QA certification fixes: role boundaries, blocked patterns, operator patterns,
//              draft priority, filter resolution, approvalRequired correction.
// Sprint 817 — Navigate + Highlight Runtime: focusTarget field added to DispatchResult;
//              FOCUS_TARGET_MAP populates teal-glow targets for navigate results.
//
// Structured action dispatch layer for DONNA UI operations.
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
// DONNA never directly mutates state. Returns DispatchResult for the calling component to act on.

import type { UIActionRole, UIActionSafetyClass } from './donnaUIActionRegistry'
import type { DonnaFocusTarget } from './donnaFocusTarget'
import {
  getUIActionById,
  getUIActionsForPage,
  canDonnaPerformUIAction,
} from './donnaUIActionRegistry'
import {
  evaluateUIAction,
  type MatrixPermission,
} from './donnaUIApprovalMatrix'
import {
  getOperatorById,
  getOperatorForPhrase,
  getOperatorForRoute,
} from './donnaUIGuidedOperators'

// ── Dispatch result types ─────────────────────────────────────────────────────

export type DispatchResultKind =
  | 'navigate'          // DONNA provides a route — component calls router.push()
  | 'guided_operator'   // DONNA starts a step-by-step guided operator
  | 'draft_submitted'   // Draft was created — component shows confirmation + review link
  | 'approval_routed'   // Item routed to review queue — component navigates to /director/review
  | 'filter_ready'      // DONNA provides filter params — component applies them
  | 'explanation'       // DONNA explains — no UI action needed
  | 'blocked'           // DONNA refuses — boundary response provided
  | 'clarification_needed' // DONNA asks one question before acting
  | 'operator_step'     // A specific step in an active guided operator

export interface DispatchResult {
  kind: DispatchResultKind
  actionId: string | null
  message: string              // What DONNA says to the user
  route: string | null         // For navigate/approval_routed kinds
  operatorId: string | null    // For guided_operator/operator_step kinds
  stepNumber: number | null    // For operator_step kind
  filterParams: Record<string, string> | null  // For filter_ready kind
  requiresApproval: boolean
  approvalRoute: string | null
  matrixPermission: MatrixPermission | null
  confidence: 'high' | 'partial' | 'blocked'
  safetyClass: UIActionSafetyClass | null
  /** Sprint 817 — optional teal focus target; set before router.push() for highlight-on-arrival */
  focusTarget?: DonnaFocusTarget
}

// ── Helper: blocked result ───────────────────────────────────────────────────

function blocked(refusal: string): DispatchResult {
  return {
    kind: 'blocked',
    actionId: null,
    message: refusal,
    route: null,
    operatorId: null,
    stepNumber: null,
    filterParams: null,
    requiresApproval: false,
    approvalRoute: null,
    matrixPermission: 'BLOCKED',
    confidence: 'blocked',
    safetyClass: 'always_blocked',
  }
}

// ── Intent → action resolution ────────────────────────────────────────────────

/**
 * Navigation phrase patterns — maps natural language to routes.
 * Role-scoped patterns use `roles` to restrict which roles can use them.
 * Role check applied in dispatchUIIntent; this function takes optional role to filter.
 * Ordered by specificity (more specific first).
 */
// Sprint 817: added focusTargetId — optional per-command override for the highlight target.
// When set, overrides the default from FOCUS_TARGET_MAP for this specific command pattern.
const NAV_PATTERNS: Array<{
  pattern: RegExp
  route: string
  label: string
  roles?: UIActionRole[]
  focusTargetId?: string
}> = [
  // Director-level routes
  { pattern: /review (center|queue)|pending (items|approvals)|what needs (my )?review/i, route: '/director/review', label: 'Review Center' },
  { pattern: /curriculum (builder|setup)|build (my )?curriculum/i, route: '/director/curriculum/builder', label: 'Curriculum Builder' },
  { pattern: /(?<!publish[\s\S]{0,15})curriculum(?!.*publish)/i, route: '/director/curriculum', label: 'Curriculum' },
  { pattern: /class.?templates?|session.?templates?/i, route: '/director/class-templates', label: 'Class Templates' },
  { pattern: /fitness.?templates?/i, route: '/director/fitness/templates', label: 'Fitness Templates' },
  { pattern: /onboarding|academy setup|set up (the|my) academy/i, route: '/director/onboarding', label: 'Academy Setup' },
  { pattern: /player placement|place (a |new )?player/i, route: '/director/placement', label: 'Player Placement' },
  { pattern: /level.?up|advancement/i, route: '/director/level-up', label: 'Level Up' },
  { pattern: /signals?|attention signals?/i, route: '/director/signals', label: 'Signals' },
  // Sprint 820: more specific player patterns BEFORE generic players$ pattern
  // Commands about missing/needing levels → highlight players-missing-level section
  { pattern: /players? without (levels?|curriculum)|missing (levels?|curriculum)|no (levels?|curriculum level)|players? need(ing)? (level|placement|curriculum)/i, route: '/director/players', label: 'Players Without Levels', focusTargetId: 'players-missing-level' },
  // Commands about flags/attention → highlight player-filter-bar
  { pattern: /player (flags?|alerts?|issues?)|flag(ged)? players?|players? need(ing)? attention/i, route: '/director/players', label: 'Player Attention', focusTargetId: 'player-filter-bar' },
  // Commands about placement → highlight pending-placement-section
  { pattern: /pending placement|players? (awaiting|pending) (placement|onboarding)|who needs placement/i, route: '/director/players', label: 'Pending Placement', focusTargetId: 'players-missing-level' },
  // Commands about level assignment → highlight players-missing-level
  { pattern: /assign (levels?|curriculum)|help.{0,15}(assign|set|fix).{0,15}levels?/i, route: '/director/players', label: 'Assign Levels', focusTargetId: 'players-missing-level' },
  // Generic players → highlight player-directory-summary
  { pattern: /players?(\s+list)?$/i, route: '/director/players', label: 'Players' },
  { pattern: /my players|all players|player directory|show players/i, route: '/director/players', label: 'Player Directory' },
  { pattern: /sessions?(\s+list)?$/i, route: '/director/sessions', label: 'Sessions' },
  // Commands about today / daily / home → highlight today-command-center
  { pattern: /what (do i|should i) (need to )?(do|focus on) today|what.{0,15}first/i, route: '/director', label: 'Daily Command', focusTargetId: 'review-queue-card' },
  { pattern: /dashboard|home|director home/i, route: '/director', label: 'Dashboard' },
  { pattern: /kpi|metrics?/i, route: '/director/kpi', label: 'KPIs' },
  { pattern: /coaches?|staff/i, route: '/director/coaches', label: 'Coaches' },
  { pattern: /my parents|parents (list|section)/i, route: '/director/parents', label: 'Parents', roles: ['academy_director', 'head_coach'] },
  { pattern: /settings?/i, route: '/director/settings', label: 'Settings' },
  // Player-portal routes — player role only
  { pattern: /my profile|show (my )?profile|view (my )?profile/i, route: '/player/skill-path', label: 'Skill Path', roles: ['player'] },
  { pattern: /my missions|show (my )?missions/i, route: '/player/missions', label: 'Missions', roles: ['player'] },
  { pattern: /my skill path|my skills/i, route: '/player/skill-path', label: 'Skill Path', roles: ['player'] },
  { pattern: /my wins|my achievements/i, route: '/player/celebration', label: 'Wins & Achievements', roles: ['player'] },
  // Parent-portal routes — parent role only
  { pattern: /my child'?s? progress|child'?s? progress|child'?s? development/i, route: '/parent/progress', label: "My Child's Progress", roles: ['parent'] },
  { pattern: /my child'?s? wins|child'?s? achievements/i, route: '/parent/wins', label: 'Wins & Milestones', roles: ['parent'] },
  { pattern: /coach updates|recent updates|notes from (the |my )?coach/i, route: '/parent/updates', label: 'Updates', roles: ['parent'] },
]

// Director-only routes that lower roles cannot access via DONNA nav
const DIRECTOR_ONLY_ROUTES = new Set([
  '/director/review',
  '/director/curriculum',
  '/director/curriculum/builder',
  '/director/placement',
  '/director/level-up',
  '/director/signals',
  '/director/kpi',
  '/director/coaches',
  '/director/settings',
  '/director/onboarding',
])

/**
 * Blocked phrase patterns — architecture invariants DONNA must always refuse.
 * Sprint 759: Broadened send-message and raw-notes patterns; added billing.
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; refusal: string }> = [
  {
    // Broadened: allow any words between "send" and "parent/player/mom/dad"
    pattern: /send.{0,30}(message|email|text|sms|notification).{0,30}(parent|mom|dad|family|player)/i,
    refusal: "I never send messages directly. I can draft a parent update for your review — you decide when and whether to send it.",
  },
  {
    pattern: /delete|remove|archive|destroy (the |a )?(player|session|template|curriculum|record|note)/i,
    refusal: "I can't delete or archive records. That's always a manual action in the UI. Which record were you trying to remove?",
  },
  {
    pattern: /skip (the |my )?(review|approval|queue)|bypass (the )?(review|approval)|approve.+automatically|auto.?approv/i,
    refusal: "I can't skip the review queue — it's how AcademyOS keeps your changes safe. Every consequential action goes through director review first.",
  },
  {
    // Sprint 759: Added "the" before "raw"; broader coach notes pattern
    pattern: /show.{0,20}(the |raw |private |confidential )?(raw )?(notes?|coach.?notes?)|raw.+notes?|coach notes.{0,20}(for|about)/i,
    refusal: "I don't expose raw notes or personal data. I can summarize what's relevant for your role and what you're working on.",
  },
  {
    pattern: /another (academy|school|program)|other academies|cross.?tenant/i,
    refusal: "I only have access to your academy's data. I can't access information from other academies.",
  },
  {
    pattern: /move (a |the )?(player|[a-z]+ [a-z]+) (to|into) (level|orange|red|green|yellow|purple)/i,
    refusal: "I can't move a player to a new level directly. I can draft an advancement proposal for your review — you approve it in the review queue before any level change takes effect.",
  },
  {
    // Sprint 759: billing/payment is platform_required — always blocked for all roles
    pattern: /billing|subscription (plan|tier)|change (the |my )?(plan|tier)|enterprise plan|payment method/i,
    refusal: "Billing and subscription changes require platform support. I can't modify billing plans within AcademyOS — contact support for account changes.",
  },
]

/**
 * Guided operator trigger patterns.
 * Sprint 759: Added more entry phrases per operator.
 */
const OPERATOR_PATTERNS: Array<{ pattern: RegExp; operatorId: string }> = [
  {
    pattern: /walk me through (onboarding|setup)|help me (set up|setup)|guide me through setup|start onboarding/i,
    operatorId: 'onboarding_operator',
  },
  {
    // Sprint 759: Added "open the curriculum builder" as operator trigger
    pattern: /walk me through curriculum|help me with curriculum|curriculum gaps|guide me through curriculum|open the curriculum builder|start curriculum/i,
    operatorId: 'curriculum_operator',
  },
  {
    pattern: /walk me through (a |the )?template|help me (with |create |build )a? template|guide me through template/i,
    operatorId: 'template_operator',
  },
  {
    // Sprint 759: Broadened — "start session wrap-up", "help me wrap up", "wrap up this session"
    pattern: /walk me through (a |the )?session|help me (with |plan )a? session|guide me through session|start.{0,10}wrap.?up|wrap.{0,15}(this |the )?session|help.{0,10}wrap up/i,
    operatorId: 'session_operator',
  },
  {
    // Sprint 759: Added "review this player" and "review a player" as triggers
    pattern: /walk me through (a |this )?player|help me with (a |this )?player|guide me through (the |this )?profile|review (this|a) player|assess (this|a) player|(player|profile).{0,20}(review|progress|assessment)/i,
    operatorId: 'player_operator',
  },
  {
    pattern: /walk me through (the |my |pending )?review|help me (with |review )(the |my )?(queue|review)|guide me through review/i,
    operatorId: 'review_center_operator',
  },
]

// ── Core dispatch functions ───────────────────────────────────────────────────

/**
 * Attempt to resolve a blocked phrase.
 * Returns a DispatchResult with kind='blocked' if matched, null otherwise.
 */
export function checkBlockedPhrase(
  text: string,
): DispatchResult | null {
  for (const { pattern, refusal } of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return blocked(refusal)
    }
  }
  return null
}

/**
 * Check role-boundary violations for navigation.
 * Returns blocked result if role cannot access the given route, null otherwise.
 * Sprint 759: Enforces that players/parents can't nav to director routes,
 * coaches can't nav to director-only routes.
 */
function checkRoleBoundaryForNav(
  route: string,
  role: UIActionRole,
): DispatchResult | null {
  if (role === 'player' || role === 'parent') {
    if (route.startsWith('/director') || route.startsWith('/coach')) {
      return blocked("That section is for coaches and directors only. I can help you navigate your own portal — missions, skill path, progress, or wins.")
    }
  }
  if (role === 'coach' || role === 'head_coach') {
    if (DIRECTOR_ONLY_ROUTES.has(route)) {
      return blocked("That section requires director access. I can help you with sessions, players, and templates. Your director manages the review queue and curriculum publishing.")
    }
  }
  return null
}

/**
 * Attempt to resolve a guided operator from the phrase.
 * Sprint 759: requiresApproval is always false for the launch step (launching is safe_with_context).
 * Returns a DispatchResult with kind='guided_operator' if matched, null otherwise.
 */
export function resolveGuidedOperator(
  text: string,
  currentRoute: string,
): DispatchResult | null {
  // Try phrase match first (explicit operator trigger phrases)
  for (const { pattern, operatorId } of OPERATOR_PATTERNS) {
    if (pattern.test(text)) {
      const operator = getOperatorForPhrase(text) ?? getOperatorById(operatorId) ?? null
      if (operator) {
        return {
          kind: 'guided_operator',
          actionId: null,
          message: operator.openingLine,
          route: operator.primaryRoutes[0] ?? null,
          operatorId: operator.id,
          stepNumber: 1,
          filterParams: null,
          requiresApproval: false, // Sprint 759: launching an operator is safe_with_context — no approval needed
          approvalRoute: null,
          matrixPermission: 'ALLOWED',
          confidence: 'high',
          safetyClass: 'safe_with_context',
        }
      }
    }
  }
  // Try route match as fallback
  const routeOperator = getOperatorForRoute(currentRoute)
  if (routeOperator && /guide|walk|help me|what (do i|should i) do/i.test(text)) {
    return {
      kind: 'guided_operator',
      actionId: null,
      message: routeOperator.openingLine,
      route: null,
      operatorId: routeOperator.id,
      stepNumber: 1,
      filterParams: null,
      requiresApproval: false, // Sprint 759: launching is not an approval action
      approvalRoute: null,
      matrixPermission: 'ALLOWED',
      confidence: 'high',
      safetyClass: 'safe_with_context',
    }
  }
  return null
}

// ── Sprint 817 — Focus target map ────────────────────────────────────────────
// Maps destination routes to default DONNA focus targets (teal-glow highlight on arrival).
// Each entry specifies which element DONNA points to and what DONNA says on arrival.
// targetId must match a data-donna-focus-id attribute on the destination page.
// Routes without an entry get no focus target (navigation still works, just no highlight).

const FOCUS_TARGET_MAP: Record<string, Pick<DonnaFocusTarget, 'targetId' | 'label' | 'reason'>> = {
  '/director': {
    targetId: 'today-command-center',
    label: 'Daily Command',
    reason: "Your most urgent actions are in the pulse tiles here.",
  },
  '/director/review': {
    targetId: 'pending-review-list',
    label: 'Review Center',
    reason: "Your pending items are listed here — start with the most urgent.",
  },
  '/director/players': {
    targetId: 'player-directory-summary',
    label: 'Player Directory',
    reason: "Players without a curriculum level assigned are shown at the top.",
  },
  '/director/sessions': {
    targetId: 'sessions-list',
    label: 'Sessions',
    reason: "Here are your sessions — I can help find ones with missing recaps.",
  },
  '/director/class-templates': {
    targetId: 'create-template-button',
    label: 'Template Library',
    reason: "Tap 'New Template' here to start building a class template.",
  },
  '/director/class-templates/new': {
    targetId: 'create-template-form',
    label: 'Class Template Builder',
    reason: "Fill in the template details here — I'll help with the structure.",
  },
  '/director/curriculum/builder': {
    targetId: 'curriculum-builder-hero',
    label: 'Curriculum Builder',
    reason: "Select a pathway here to start reviewing or customizing levels.",
  },
}

/**
 * Build a DonnaFocusTarget for a given route + source command.
 * Returns undefined if no focus target is defined for the route.
 *
 * Sprint 841: added prefix fallback for dynamic player profile routes
 * (/director/players/<uuid>). These can't be in FOCUS_TARGET_MAP (exact-key lookup),
 * so a startsWith check handles them. No new routing behavior is added — this only
 * activates when a dispatch result already routes to a specific player profile URL.
 *
 * Sprint 850: player profile prefix fallback is now sourceCommand-aware.
 * Notes/priority/evidence intent in sourceCommand → player-notes-tab focus.
 * Generic or absent sourceCommand → player-profile-header (unchanged default).
 */
export function buildFocusTargetForRoute(
  route: string,
  sourceCommand?: string,
): DonnaFocusTarget | undefined {
  const entry = FOCUS_TARGET_MAP[route]
  if (entry) {
    return {
      route,
      targetId: entry.targetId,
      label: entry.label,
      reason: entry.reason,
      sourceCommand,
      highlightStyle: 'teal-glow',
      // expiresAt set by setDonnaFocusTarget (8s default)
    }
  }

  // Sprint 841: dynamic player profile route — /director/players/<uuid>
  // Matches any 4-segment path under /director/players/ (list is 3 segments).
  // Sprint 850: sourceCommand-aware — notes/priority/evidence intent → player-notes-tab.
  // The Notes tab is always in the DOM (Sprint 849); section IDs inside it are only
  // mounted when Notes is active. Highlighting the tab trigger first guides the director.
  if (route.startsWith('/director/players/') && route.split('/').length === 4) {
    // Sprint 850: detect notes/priority/evidence intent from the user's command.
    // Matches: priority, priorities, evidence, note, notes, development, observation,
    //          coach, recommendation — any term that implies Notes-tab content.
    const NOTES_INTENT = /priorit|evidence|note|development|observation|coach|recommendation/i
    const notesIntent = sourceCommand ? NOTES_INTENT.test(sourceCommand) : false

    return {
      route,
      targetId: notesIntent ? 'player-notes-tab' : 'player-profile-header',
      label: notesIntent ? 'Player Notes' : 'Player Profile',
      reason: notesIntent
        ? "The Notes tab contains active priorities, recommendation drafts, coach notes, and evidence hub."
        : "Here's the player profile. Use the tabs to review priorities, notes, evidence, and session history.",
      sourceCommand,
      highlightStyle: 'teal-glow',
    }
  }

  return undefined
}

// ── Sprint 870 — Section navigation ─────────────────────────────────────────
// Routes natural language section-navigate phrases to Category 1A registry actions.
// Dynamic route params (sessionId, templateId) are extracted from currentRoute.
// Returns null when no section phrase matches (falls through to generic NAV_PATTERNS).
// Returns clarification result when phrase matches but route params can't be resolved.

/** Extract sessionId from a director session detail route. Returns null if not on that route. */
function extractDirectorSessionId(route: string): string | null {
  const m = route.match(/^\/director\/sessions\/([^/]+)/)
  return m?.[1] ?? null
}

/** Extract templateId from a director class-template detail route. Returns null if not on that route.
 *  Also returns null for /director/class-templates/new (new-template form, not a detail page). */
function extractDirectorTemplateId(route: string): string | null {
  const m = route.match(/^\/director\/class-templates\/([^/]+)/)
  const id = m?.[1] ?? null
  if (!id || id === 'new') return null
  return id
}

/** Extract sessionId from a coach session route. Returns null if not on that route. */
function extractCoachSessionId(route: string): string | null {
  const m = route.match(/^\/coach\/sessions\/([^/]+)/)
  return m?.[1] ?? null
}

type SectionNavEntry = {
  pattern: RegExp
  actionId: string
  label: string
  allowedRoles: UIActionRole[]
  /** Resolve the concrete route + focusTargetId from the current pathname.
   *  Returns null when the required dynamic param is not in the current URL. */
  resolve: (currentRoute: string) => { route: string; focusTargetId: string } | null
}

// Sprint 870 — Section navigation patterns (maps phrases to Category 1A registry actions).
// Patterns are specific to avoid false positives. Generic page nav still handled by NAV_PATTERNS.
// Role check in resolveSectionNavigation uses continue (not return) so a phrase can still
// fall through to NAV_PATTERNS when the role doesn't match the section's allowedRoles.
const SECTION_NAV_ENTRIES: SectionNavEntry[] = [
  // ── Director: sessions list ─────────────────────────────────────────────────
  {
    pattern: /sessions?\s+list|session(s)?\s+overview|all\s+sessions?\b/i,
    actionId: 'navigate_to_sessions_list',
    label: 'Sessions List',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: () => ({ route: '/director/sessions', focusTargetId: 'session-list' }),
  },
  // ── Director: session detail sections ─────────────────────────────────────
  {
    pattern: /session\s+blocks?|blocks?\s+(for|in)\s+(this|the)\s+session/i,
    actionId: 'navigate_to_session_blocks',
    label: 'Session Blocks',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorSessionId(route)
      if (!id) return null
      return { route: `/director/sessions/${id}`, focusTargetId: 'session-blocks' }
    },
  },
  {
    pattern: /session\s+attendance|roster\s+attendance|who\s+(was|is)\s+(at|in)\s+(this|the)\s+session|attendance\s+section\b/i,
    actionId: 'navigate_to_session_attendance',
    label: 'Session Attendance',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorSessionId(route)
      if (!id) return null
      return { route: `/director/sessions/${id}`, focusTargetId: 'session-roster-attendance' }
    },
  },
  {
    pattern: /roster\s+intelligence|class\s+roster\s+intelligence/i,
    actionId: 'navigate_to_session_roster_intelligence',
    label: 'Roster Intelligence',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorSessionId(route)
      if (!id) return null
      return { route: `/director/sessions/${id}`, focusTargetId: 'session-roster-intelligence' }
    },
  },
  // ── Director: template detail sections ────────────────────────────────────
  {
    pattern: /template\s+(stepper|builder\s+stepper|steps?)|show\s+(me\s+)?(the\s+)?template\s+(stepper|steps?)\b/i,
    actionId: 'navigate_to_template_stepper',
    label: 'Template Builder',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorTemplateId(route)
      if (!id) return null
      return { route: `/director/class-templates/${id}`, focusTargetId: 'template-stepper' }
    },
  },
  {
    pattern: /template\s+blocks?|block\s+builder|add\s+(drills?|content|exercises?)\s+to\s+(the\s+)?template/i,
    actionId: 'navigate_to_template_blocks',
    label: 'Template Blocks',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorTemplateId(route)
      if (!id) return null
      return { route: `/director/class-templates/${id}`, focusTargetId: 'template-blocks-section' }
    },
  },
  {
    pattern: /generate\s+(a\s+)?session|where\s+(do\s+i|to)\s+generate\s+(a\s+)?session/i,
    actionId: 'navigate_to_template_generate_session',
    label: 'Generate Session from Template',
    allowedRoles: ['academy_director', 'head_coach'],
    resolve: (route) => {
      const id = extractDirectorTemplateId(route)
      if (!id) return null
      return { route: `/director/class-templates/${id}`, focusTargetId: 'template-generate-session' }
    },
  },
  // ── Coach: hub sections ────────────────────────────────────────────────────
  {
    pattern: /today'?s?\s+sessions?|my\s+session\s+(plan|schedule)\s+today|what\s+do\s+i\s+have\s+today|coach\s+home\s+today/i,
    actionId: 'navigate_to_coach_home_today',
    label: "Today's Sessions",
    allowedRoles: ['head_coach', 'coach'],
    resolve: () => ({ route: '/coach', focusTargetId: 'coach-today-sessions' }),
  },
  {
    pattern: /my\s+players|show\s+(me\s+)?my\s+players|open\s+my\s+players|my\s+player\s+(list|directory)/i,
    actionId: 'navigate_to_coach_players',
    label: 'My Players',
    allowedRoles: ['head_coach', 'coach'],
    resolve: () => ({ route: '/coach/players', focusTargetId: 'coach-player-list' }),
  },
  // ── Coach: session detail sections ─────────────────────────────────────────
  {
    pattern: /lesson\s+plan|today'?s?\s+plan|show\s+(me\s+)?(the\s+)?lesson\s+plan|curriculum\s+for\s+(this|the)\s+session|what\s+are\s+we\s+doing\s+today/i,
    actionId: 'navigate_to_coach_lesson_plan',
    label: "Today's Plan",
    allowedRoles: ['head_coach', 'coach'],
    resolve: (route) => {
      const id = extractCoachSessionId(route)
      if (!id) return null
      return { route: `/coach/sessions/${id}`, focusTargetId: 'coach-lesson-plan' }
    },
  },
  {
    pattern: /run\s+(the\s+|this\s+)?session|session\s+execution|mark\s+attendance|blocks\s+and\s+attendance/i,
    actionId: 'navigate_to_coach_run_session',
    label: 'Run Session',
    allowedRoles: ['head_coach', 'coach'],
    resolve: (route) => {
      const id = extractCoachSessionId(route)
      if (!id) return null
      return { route: `/coach/sessions/${id}`, focusTargetId: 'coach-run-session' }
    },
  },
  {
    pattern: /wrap.?up\s+(link|cta|button)|after\s+session\s+section|where\s+(do\s+i|to)\s+(start|find)\s+(the\s+)?wrap.?up|how\s+(do\s+i|to)\s+start\s+(the\s+)?wrap.?up/i,
    actionId: 'navigate_to_coach_wrap_up_link',
    label: 'Session Wrap-Up',
    allowedRoles: ['head_coach', 'coach'],
    resolve: (route) => {
      const id = extractCoachSessionId(route)
      if (!id) return null
      return { route: `/coach/sessions/${id}`, focusTargetId: 'coach-wrap-up-link' }
    },
  },
  // ── Coach: wrap-up page sections ───────────────────────────────────────────
  {
    pattern: /wrap.?up\s+question|current\s+question\s+(in\s+)?wrap.?up|where\s+(do\s+i|to)\s+answer\s+(the\s+)?wrap.?up/i,
    actionId: 'navigate_to_wrapup_question',
    label: 'Wrap-Up Question',
    allowedRoles: ['head_coach', 'coach'],
    resolve: (route) => {
      const id = extractCoachSessionId(route)
      if (!id) return null
      return { route: `/coach/sessions/${id}/wrap-up`, focusTargetId: 'wrapup-question-card' }
    },
  },
  {
    pattern: /wrap.?up\s+(actions?|buttons?|submit|navigation)|submit\s+(for\s+)?review|finish\s+(the\s+)?wrap.?up|how\s+(do\s+i|to)\s+(submit|finish)\s+(the\s+|my\s+)?(session\s+notes?|wrap.?up)/i,
    actionId: 'navigate_to_wrapup_actions',
    label: 'Wrap-Up Actions',
    allowedRoles: ['head_coach', 'coach'],
    resolve: (route) => {
      const id = extractCoachSessionId(route)
      if (!id) return null
      return { route: `/coach/sessions/${id}/wrap-up`, focusTargetId: 'wrapup-nav-actions' }
    },
  },
]

/**
 * Sprint 870 — Resolve a section-navigation intent.
 * Maps natural language phrases to Category 1A actions (navigate-to-page-section).
 * Dynamic route params (sessionId, templateId) are extracted from currentRoute.
 *
 * Returns:
 * - navigate result (confidence: 'high') when the route can be resolved
 * - clarification result (confidence: 'partial') when phrase matches but dynamic params unavailable
 * - null when no section phrase matched (falls through to generic NAV_PATTERNS)
 *
 * Role check uses `continue` (not `return`) so a phrase can fall through to NAV_PATTERNS
 * when the matched entry's allowedRoles does not include the current role.
 */
export function resolveSectionNavigation(
  text: string,
  role: UIActionRole,
  currentRoute: string,
): DispatchResult | null {
  for (const entry of SECTION_NAV_ENTRIES) {
    if (!entry.pattern.test(text)) continue
    // Role mismatch — continue so the phrase can still be handled by NAV_PATTERNS for other roles
    if (!entry.allowedRoles.includes(role)) continue

    const resolved = entry.resolve(currentRoute)
    if (!resolved) {
      // Phrase matched and role is valid, but dynamic param (sessionId/templateId) unavailable.
      // Return a graceful clarification so DONNA doesn't silently no-op.
      const pageHint = entry.allowedRoles.includes('academy_director')
        ? 'Open a specific session or template first, then ask again.'
        : 'Open a specific session first, then ask again.'
      return {
        kind: 'clarification_needed',
        actionId: entry.actionId,
        message: `I can take you to ${entry.label}, but I need more context. ${pageHint}`,
        route: null,
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: false,
        approvalRoute: null,
        matrixPermission: null,
        confidence: 'partial',
        safetyClass: 'always_safe',
      }
    }

    // Build a focus target from the registry action's display name
    const registryAction = getUIActionById(entry.actionId)
    const focusTarget: DonnaFocusTarget = {
      route: resolved.route,
      targetId: resolved.focusTargetId,
      label: registryAction?.displayName ?? entry.label,
      reason: `DONNA highlighted ${entry.label} for you.`,
      sourceCommand: text,
      highlightStyle: 'teal-glow',
    }

    return {
      kind: 'navigate',
      actionId: entry.actionId,
      message: `Taking you to ${entry.label}.`,
      route: resolved.route,
      operatorId: null,
      stepNumber: null,
      filterParams: null,
      requiresApproval: false,
      approvalRoute: null,
      matrixPermission: 'ALLOWED',
      confidence: 'high',
      safetyClass: 'always_safe',
      focusTarget,
    }
  }
  return null
}

/**
 * Attempt to resolve a navigation intent.
 * Accepts optional role to filter role-specific patterns (e.g., player/parent portal routes).
 * Returns a DispatchResult with kind='navigate' if matched, null otherwise.
 * Sprint 817: populates focusTarget for routes that have a registered focus target.
 */
export function resolveNavigation(text: string, role?: UIActionRole): DispatchResult | null {
  for (const { pattern, route, label, roles, focusTargetId } of NAV_PATTERNS) {
    // Skip role-gated patterns when role doesn't match
    if (roles && role && !roles.includes(role)) continue
    if (pattern.test(text)) {
      // Sprint 820: use per-command focusTargetId override if present,
      // otherwise fall back to FOCUS_TARGET_MAP default for the route.
      let focusTarget = buildFocusTargetForRoute(route, text)
      if (focusTargetId && focusTarget) {
        focusTarget = { ...focusTarget, targetId: focusTargetId }
      } else if (focusTargetId) {
        focusTarget = {
          route,
          targetId: focusTargetId,
          label,
          sourceCommand: text,
          highlightStyle: 'teal-glow',
        }
      }
      return {
        kind: 'navigate',
        actionId: 'navigate_to_page',
        message: `Taking you to ${label}.`,
        route,
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: false,
        approvalRoute: null,
        matrixPermission: 'ALLOWED',
        confidence: 'high',
        safetyClass: 'always_safe',
        focusTarget,
      }
    }
  }
  return null
}

/**
 * Attempt to resolve a filter or search intent.
 * Sprint 759: New function — returns filter_ready result for filter/search phrases.
 */
export function resolveFilterIntent(text: string): DispatchResult | null {
  if (/filter (to|by)|show only|show me only/i.test(text)) {
    const groupMatch = text.match(/filter.{0,10}(to|by)\s+(.+)/i)
    const group = groupMatch?.[2]?.trim() ?? 'the selected group'
    return {
      kind: 'filter_ready',
      actionId: 'filter_player_list',
      message: `Filtering to ${group}.`,
      route: null,
      operatorId: null,
      stepNumber: null,
      filterParams: { group },
      requiresApproval: false,
      approvalRoute: null,
      matrixPermission: 'ALLOWED',
      confidence: 'high',
      safetyClass: 'always_safe',
    }
  }
  if (/search (for|player|session)|find (player|session|[a-z]+)|look (for|up)/i.test(text)) {
    const searchMatch = text.match(/(?:search for|find|look for|look up)\s+(.+)/i)
    const query = searchMatch?.[1]?.trim() ?? 'the specified item'
    return {
      kind: 'filter_ready',
      actionId: 'search_players',
      message: `Searching for ${query}.`,
      route: null,
      operatorId: null,
      stepNumber: null,
      filterParams: { query },
      requiresApproval: false,
      approvalRoute: null,
      matrixPermission: 'ALLOWED',
      confidence: 'partial',
      safetyClass: 'always_safe',
    }
  }
  return null
}

/**
 * Check if text is a creation/draft intent that should go to draft pipeline
 * BEFORE navigation patterns fire. Returns true for explicit draft/create/propose phrases.
 * Sprint 759: Prevents "create session template" from routing to nav before draft check.
 */
function isCreationOrDraftIntent(text: string): boolean {
  return /^(create|draft|propose|write|build|start|make|prepare)\b/i.test(text) ||
    /\b(draft|create|propose|write|build|make|prepare)\s+(a |an |the )?/i.test(text) ||
    /\b(attendance exception|level change|parent (update|summary|report|progress))\b/i.test(text)
}

/**
 * Attempt to resolve a draft action intent.
 * Sprint 759: Added draft patterns for templates and parent updates;
 * added /director/review as route for all draft results;
 * moved ahead of navigation in dispatchUIIntent when isCreationOrDraftIntent is true.
 */
export function resolveDraftIntent(
  text: string,
  role: UIActionRole,
): DispatchResult | null {
  // Attendance exception
  if (/absent|missed (the |a |today'?s? )?session|attendance exception|mark.+(absent|missing)/i.test(text)) {
    const evaluation = evaluateUIAction('draft_attendance_exception', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_attendance_exception',
        message: "I'll draft an attendance exception. Tell me the player's name and the reason — I'll submit it to your review queue.",
        route: '/director/review',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: true,
        approvalRoute: '/director/review',
        matrixPermission: 'DRAFT_ONLY',
        confidence: 'high',
        safetyClass: 'draft_to_review',
        // Sprint 836: highlight the Attendance Exceptions section after navigating to the review queue
        focusTarget: {
          route: '/director/review',
          targetId: 'attendance-exceptions-section',
          label: 'Attendance Exceptions',
          reason: 'Your attendance exception draft is in this section — review and approve it here.',
          sourceCommand: text,
          highlightStyle: 'teal-glow',
        },
      }
    }
    return blocked("Attendance exceptions require director or head coach access.")
  }

  // Session/class template creation — Sprint 819: navigate to builder instead of sidebar draft.
  // DONNA takes the director to the Class Template Builder workspace and highlights the form.
  // Director builds the template there; DONNA can guide step-by-step from the sidebar alongside.
  if (/(create|draft|build|make|start).{0,20}(session|class).{0,10}template/i.test(text) ||
      /\b(new|create|build|make)\s+(a\s+)?(class\s+)?template\b/i.test(text)) {
    const evaluation = evaluateUIAction('draft_class_template', role)
    if (evaluation.permitted) {
      return {
        kind: 'navigate',
        actionId: 'navigate_to_template_builder',
        message: "I brought you to the Class Template Builder. Fill in the details here — I can help guide the structure, but the template should be built in this workspace.",
        route: '/director/class-templates/new',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: false,
        approvalRoute: null,
        matrixPermission: 'ALLOWED',
        confidence: 'high',
        safetyClass: 'always_safe',
        focusTarget: {
          route: '/director/class-templates/new',
          targetId: 'create-template-form',
          label: 'Class Template Builder',
          reason: 'Fill in the template name, level, and blocks here.',
          sourceCommand: text,
          highlightStyle: 'teal-glow',
        },
      }
    }
    return blocked("Session template creation requires director or head coach access.")
  }

  // Parent update / progress update — Sprint 759: catches "draft a parent progress update" before nav fires
  if (/(draft|write|create|prepare).{0,20}parent.{0,20}(update|summary|report|progress|message)/i.test(text) ||
      /parent (progress update|progress summary|update draft)/i.test(text)) {
    const evaluation = evaluateUIAction('draft_parent_summary', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_parent_summary',
        message: "I'll draft a parent progress update for your review. Which player, and what's the main highlight? You approve and dispatch it manually from the review queue.",
        route: '/director/review',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: true,
        approvalRoute: '/director/review',
        matrixPermission: 'DRAFT_ONLY',
        confidence: 'high',
        safetyClass: 'draft_to_review',
      }
    }
    return blocked("Parent updates require director access. Coaches can flag observations for the director.")
  }

  // Coach note
  if (/note (that|about)|coaching (note|observation)|add a note|draft a note|observe/i.test(text)) {
    const evaluation = evaluateUIAction('draft_coach_note', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_coach_note',
        message: "Tell me what you observed and I'll draft a coaching note for review.",
        route: '/director/review',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: true,
        approvalRoute: '/director/review',
        matrixPermission: 'DRAFT_ONLY',
        confidence: 'high',
        safetyClass: 'draft_to_review',
      }
    }
  }

  // Player advancement / level change proposal
  if (/(advance|advancement|level (change|move|up)|promote|next level|level readiness|propose.{0,10}(level|advancement))/i.test(text) &&
      !/level.?up page|level.?up section/i.test(text)) {
    const evaluation = evaluateUIAction('draft_player_advancement', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_player_advancement',
        message: "I'll draft a player advancement proposal for your review. Which player, and which level are they ready for?",
        route: '/director/review',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: true,
        approvalRoute: '/director/review',
        matrixPermission: 'DRAFT_ONLY',
        confidence: 'high',
        safetyClass: 'draft_to_review',
      }
    }
  }

  // Curriculum change
  if (/add (a |an )?(gate|exercise|drill|level)|curriculum (change|draft|proposal)|draft.+curriculum/i.test(text)) {
    const evaluation = evaluateUIAction('draft_curriculum_item', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_curriculum_item',
        message: "Tell me what curriculum change you'd like — I'll draft it for review.",
        route: '/director/review',
        operatorId: null,
        stepNumber: null,
        filterParams: null,
        requiresApproval: true,
        approvalRoute: '/director/review',
        matrixPermission: 'DRAFT_ONLY',
        confidence: 'high',
        safetyClass: 'draft_to_review',
      }
    }
  }

  return null
}

/**
 * Master dispatch function. Resolves any user intent in priority order:
 * 1. Blocked phrases (architecture invariants — always refuse first)
 * 2. Role boundary check (role-gated nav/action)
 * 3. Guided operators (step-by-step flows)
 * 4. Creation/draft intents (before nav — prevents "create template" routing to nav)
 * 5. Navigation intents (role-checked)
 * 6. Draft intents (remaining patterns)
 * 7. Filter/search
 * 8. Approval routing (director-only)
 * 9. Clarification fallback
 */
export function dispatchUIIntent(
  text: string,
  role: UIActionRole,
  currentRoute: string,
): DispatchResult {
  // 1. Architecture invariants — always blocked regardless of role
  const blockedResult = checkBlockedPhrase(text)
  if (blockedResult) return blockedResult

  // 1.5. Parent data access boundary — before operators or nav
  // Parents can only see their child's data; bulk records are blocked.
  if (role === 'parent') {
    if (/all (session|sessions?)\s+(attendance|records|data)|session attendance (records|data)|all players|all students/i.test(text)) {
      return blocked("You can only view your child's data. Ask about your child's progress, wins, or recent updates instead.")
    }
  }

  // 2. Guided operators — before nav so "open curriculum builder" = operator, not nav
  const operator = resolveGuidedOperator(text, currentRoute)
  if (operator) {
    // Role boundary for operators
    const roleBoundary = checkRoleBoundaryForNav(operator.route ?? '', role)
    if (roleBoundary) return roleBoundary
    return operator
  }

  // 3. Creation/draft intents — before nav so "create session template" = draft, not nav
  if (isCreationOrDraftIntent(text)) {
    const draft = resolveDraftIntent(text, role)
    if (draft) return draft
  }

  // 3.5. Publish curriculum — must be before nav so "publish the curriculum" doesn't route to curriculum nav
  if (/publish (the |my |this )?curriculum|go live with curriculum/i.test(text)) {
    if (role !== 'academy_director') {
      return blocked("Publishing curriculum requires director access.")
    }
    return {
      kind: 'approval_routed',
      actionId: 'publish_curriculum',
      message: "Publishing curriculum requires your review and confirmation. I'll take you to the curriculum builder — you review the content and confirm publishing there.",
      route: '/director/curriculum/builder',
      operatorId: null,
      stepNumber: null,
      filterParams: null,
      requiresApproval: true,
      approvalRoute: '/director/curriculum/builder',
      matrixPermission: 'ROUTE_TO_REVIEW',
      confidence: 'high',
      safetyClass: 'director_approval',
    }
  }

  // 3.6. Sprint 870 — Section navigation (Category 1A: navigate to page + highlight section)
  // Runs before generic NAV_PATTERNS so section-specific phrases resolve correctly by role.
  // Fails safely: returns clarification when dynamic params (sessionId/templateId) unavailable.
  const sectionNav = resolveSectionNavigation(text, role, currentRoute)
  if (sectionNav) return sectionNav

  // 4. Navigation intents — role-filtered and boundary-checked
  const nav = resolveNavigation(text, role)
  if (nav && nav.route) {
    const roleBoundary = checkRoleBoundaryForNav(nav.route, role)
    if (roleBoundary) return roleBoundary
    return nav
  }

  // 5. Remaining draft intents (non-creation phrases like "attendance exception for Marcus")
  const draft = resolveDraftIntent(text, role)
  if (draft) return draft

  // 6. Filter / search
  const filter = resolveFilterIntent(text)
  if (filter) return filter

  // 7. Approval routing — director only
  if (/approve|review (this|the|an?)|go to review|open review/i.test(text)) {
    if (role !== 'academy_director') {
      return blocked("Approving review items requires director access. Your director manages the review queue.")
    }
    return {
      kind: 'approval_routed',
      actionId: 'approve_review_item',
      message: "I'll take you to the review queue. Approval is your click — I can't approve on your behalf.",
      route: '/director/review',
      operatorId: null,
      stepNumber: null,
      filterParams: null,
      requiresApproval: true,
      approvalRoute: '/director/review',
      matrixPermission: 'ROUTE_TO_REVIEW',
      confidence: 'high',
      safetyClass: 'director_approval',
    }
  }

  // 9. Clarification needed
  return {
    kind: 'clarification_needed',
    actionId: null,
    message: "I want to help — can you tell me more? Are you looking to navigate somewhere, start a workflow, draft something for review, or understand what's on this page?",
    route: null,
    operatorId: null,
    stepNumber: null,
    filterParams: null,
    requiresApproval: false,
    approvalRoute: null,
    matrixPermission: null,
    confidence: 'partial',
    safetyClass: null,
  }
}

// ── Validate action for role + page ──────────────────────────────────────────

/**
 * Validate whether DONNA can perform a specific action for a role on the current page.
 */
export function validateUIActionForContext(
  actionId: string,
  role: UIActionRole,
  currentRoute: string,
): {
  valid: boolean
  message: string
  matrixPermission: MatrixPermission | null
  approvalPath: string | null
} {
  const action = getUIActionById(actionId)
  if (!action) {
    return {
      valid: false,
      message: `Action '${actionId}' is not registered in the DONNA UI action registry.`,
      matrixPermission: null,
      approvalPath: null,
    }
  }

  const { allowed, reason } = canDonnaPerformUIAction(actionId, role)
  if (!allowed) {
    return {
      valid: false,
      message: reason ?? 'This action is not permitted.',
      matrixPermission: 'BLOCKED',
      approvalPath: null,
    }
  }

  // Check page guard
  if (action.pageGuard.length > 0) {
    const pageAllowed = action.pageGuard.some(guard => {
      const pattern = guard.replace(/\[.*?\]/g, '[^/]+')
      return new RegExp(`^${pattern}(/.*)?$`).test(currentRoute)
    })
    if (!pageAllowed) {
      return {
        valid: false,
        message: `This action is not available on the current page (${currentRoute}). Try navigating to ${action.pageGuard[0]} first.`,
        matrixPermission: 'BLOCKED',
        approvalPath: null,
      }
    }
  }

  const evaluation = evaluateUIAction(actionId, role)
  return {
    valid: evaluation.permitted,
    message: evaluation.reason,
    matrixPermission: evaluation.matrixPermission,
    approvalPath: evaluation.approvalPath,
  }
}

// ── Available actions for context ────────────────────────────────────────────

/**
 * Returns the list of actions DONNA can offer on the current page for the given role.
 * Used for quick action surfacing and context-aware suggestions.
 */
export function getAvailableActionsForContext(
  role: UIActionRole,
  currentRoute: string,
): Array<{
  actionId: string
  displayName: string
  safetyClass: UIActionSafetyClass
  matrixPermission: MatrixPermission
}> {
  const pageActions = getUIActionsForPage(currentRoute)
  const results = []
  for (const action of pageActions) {
    const { allowed } = canDonnaPerformUIAction(action.id, role)
    if (allowed) {
      const evaluation = evaluateUIAction(action.id, role)
      results.push({
        actionId: action.id,
        displayName: action.displayName,
        safetyClass: action.safetyClass,
        matrixPermission: evaluation.matrixPermission,
      })
    }
  }
  return results
}

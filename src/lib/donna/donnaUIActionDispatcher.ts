// Sprint 755 — DONNA Safe UI Action Dispatcher V1
// Structured action dispatch layer for DONNA UI operations.
// Resolves a user intent → validated UI action → dispatch response with approval path.
//
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
// DONNA never directly mutates state. This dispatcher returns a DispatchResult that
// the calling component uses to update UI, route the user, or present a draft.
//
// Architecture:
//   Voice/text intent
//     → resolveUIAction() — match phrase to action in registry
//     → validateUIAction() — check role and page guard
//     → buildDispatchResult() — return navigation, draft, approval route, or refusal
//     → calling component executes (router.push, setCommandResponse, etc.)
//
// This dispatcher is the anti-DOM-automation layer:
// DONNA never reaches into the page DOM to click buttons.
// Instead, it returns structured DispatchResult objects that components act on.

import type { UIActionRole, UIActionSafetyClass } from './donnaUIActionRegistry'
import {
  DONNA_UI_ACTIONS,
  getUIActionById,
  getUIActionsForPage,
  canDonnaPerformUIAction,
} from './donnaUIActionRegistry'
import {
  evaluateUIAction,
  type MatrixPermission,
} from './donnaUIApprovalMatrix'
import {
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
}

// ── Intent → action resolution ────────────────────────────────────────────────

/**
 * Navigation phrase patterns — maps natural language to routes.
 * Ordered by specificity (more specific first).
 */
const NAV_PATTERNS: Array<{ pattern: RegExp; route: string; label: string }> = [
  { pattern: /review (center|queue)|pending (items|approvals)|what needs (my )?review/i, route: '/director/review', label: 'Review Center' },
  { pattern: /curriculum (builder|setup)|build (my )?curriculum/i, route: '/director/curriculum/builder', label: 'Curriculum Builder' },
  { pattern: /curriculum/i, route: '/director/curriculum', label: 'Curriculum' },
  { pattern: /class.?templates?|session.?templates?/i, route: '/director/class-templates', label: 'Class Templates' },
  { pattern: /fitness.?templates?/i, route: '/director/fitness/templates', label: 'Fitness Templates' },
  { pattern: /onboarding|academy setup|set up (the|my) academy/i, route: '/director/onboarding', label: 'Academy Setup' },
  { pattern: /player placement|place (a |new )?player/i, route: '/director/placement', label: 'Player Placement' },
  { pattern: /level.?up|advancement/i, route: '/director/level-up', label: 'Level Up' },
  { pattern: /signals?|attention signals?/i, route: '/director/signals', label: 'Signals' },
  { pattern: /players?(\s+list)?$/i, route: '/director/players', label: 'Players' },
  { pattern: /sessions?(\s+list)?$/i, route: '/director/sessions', label: 'Sessions' },
  { pattern: /dashboard|home|director home/i, route: '/director', label: 'Dashboard' },
  { pattern: /kpi|metrics?/i, route: '/director/kpi', label: 'KPIs' },
  { pattern: /coaches?|staff/i, route: '/director/coaches', label: 'Coaches' },
  { pattern: /parents?/i, route: '/director/parents', label: 'Parents' },
  { pattern: /settings?/i, route: '/director/settings', label: 'Settings' },
]

/**
 * Blocked phrase patterns — phrases DONNA must always refuse.
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; refusal: string }> = [
  {
    pattern: /send (a |an )?(message|email|text|sms|notification) (to|for) (a |the )?(parent|mom|dad|family|player)/i,
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
    pattern: /show (me )?(raw |private |confidential )?(notes?|parent (data|info)|pii|personal)/i,
    refusal: "I don't expose raw notes or personal data. I can summarize what's relevant for your role and what you're working on.",
  },
  {
    pattern: /another (academy|school|program)|other academies|cross.?tenant/i,
    refusal: "I only have access to your academy's data. I can't access information from other academies.",
  },
  {
    pattern: /move (a |the )?(player|marcus|sofia|[a-z]+) (to|into) (level|orange|red|green|yellow|purple)/i,
    refusal: "I can't move a player to a new level directly. I can draft an advancement proposal for your review — you approve it in the review queue before any level change takes effect.",
  },
]

/**
 * Guided operator trigger patterns.
 */
const OPERATOR_PATTERNS: Array<{ pattern: RegExp; operatorId: string }> = [
  { pattern: /walk me through (onboarding|setup)|help me (set up|setup)|guide me through setup/i, operatorId: 'onboarding_operator' },
  { pattern: /walk me through curriculum|help me with curriculum|curriculum gaps|guide me through curriculum/i, operatorId: 'curriculum_operator' },
  { pattern: /walk me through (a |the )?template|help me (with |create |build )a? template|guide me through template/i, operatorId: 'template_operator' },
  { pattern: /walk me through (a |the )?session|help me (with |plan )a? session|guide me through session|start wrap.?up/i, operatorId: 'session_operator' },
  { pattern: /walk me through (a |this )?player|help me with (a |this )?player|guide me through (the |this )?profile/i, operatorId: 'player_operator' },
  { pattern: /walk me through (the |my |pending )?review|help me (with |review )(the |my )?(queue|review)|guide me through review/i, operatorId: 'review_center_operator' },
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
  }
  return null
}

/**
 * Attempt to resolve a guided operator from the phrase.
 * Returns a DispatchResult with kind='guided_operator' if matched, null otherwise.
 */
export function resolveGuidedOperator(
  text: string,
  currentRoute: string,
): DispatchResult | null {
  // Try phrase match first
  for (const { pattern, operatorId } of OPERATOR_PATTERNS) {
    if (pattern.test(text)) {
      const operator = getOperatorForPhrase(text)
      if (operator) {
        return {
          kind: 'guided_operator',
          actionId: null,
          message: operator.openingLine,
          route: operator.primaryRoutes[0] ?? null,
          operatorId: operator.id,
          stepNumber: 1,
          filterParams: null,
          requiresApproval: operator.approvalRequired,
          approvalRoute: operator.approvalRequired ? '/director/review' : null,
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
      requiresApproval: routeOperator.approvalRequired,
      approvalRoute: routeOperator.approvalRequired ? '/director/review' : null,
      matrixPermission: 'ALLOWED',
      confidence: 'high',
      safetyClass: 'safe_with_context',
    }
  }
  return null
}

/**
 * Attempt to resolve a navigation intent.
 * Returns a DispatchResult with kind='navigate' if matched, null otherwise.
 */
export function resolveNavigation(text: string): DispatchResult | null {
  for (const { pattern, route, label } of NAV_PATTERNS) {
    if (pattern.test(text)) {
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
      }
    }
  }
  return null
}

/**
 * Attempt to resolve a draft action intent.
 * Returns a DispatchResult with kind='draft_submitted' if matched, null otherwise.
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
        route: null,
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

  // Coach note
  if (/note (that|about)|coaching (note|observation)|add a note|draft a note|observe/i.test(text)) {
    const evaluation = evaluateUIAction('draft_coach_note', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_coach_note',
        message: "Tell me what you observed and I'll draft a coaching note for review.",
        route: null,
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

  // Player advancement
  if (/advance|advancement|level (change|move|up)|promote|next level/i.test(text) && !/level.?up page/i.test(text)) {
    const evaluation = evaluateUIAction('draft_player_advancement', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_player_advancement',
        message: "I'll draft a player advancement proposal for your review. Which player, and which level are they ready for?",
        route: null,
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

  // Parent update
  if (/parent (update|summary|report|communication|message draft)|draft.+parent/i.test(text)) {
    const evaluation = evaluateUIAction('draft_parent_summary', role)
    if (evaluation.permitted) {
      return {
        kind: 'draft_submitted',
        actionId: 'draft_parent_summary',
        message: "I'll draft a parent progress update. Which player, and what's the main message?",
        route: null,
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
        route: null,
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
 * 1. Blocked phrases (always refuse first)
 * 2. Guided operators (step-by-step flows)
 * 3. Navigation intents
 * 4. Draft intents
 * 5. Approval routing
 * 6. Unknown → clarification
 */
export function dispatchUIIntent(
  text: string,
  role: UIActionRole,
  currentRoute: string,
): DispatchResult {
  // 1. Check always-blocked phrases first
  const blocked = checkBlockedPhrase(text)
  if (blocked) return blocked

  // 2. Check for guided operator invocation
  const operator = resolveGuidedOperator(text, currentRoute)
  if (operator) return operator

  // 3. Check for navigation intent
  const nav = resolveNavigation(text)
  if (nav) return nav

  // 4. Check for draft intent
  const draft = resolveDraftIntent(text, role)
  if (draft) return draft

  // 5. Check for approval routing intent
  if (/approve|review (this|the|an?)|go to review|open review/i.test(text)) {
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

  // 6. Clarification needed
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
 * Returns validation result with full context for the dispatch response.
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

// ── Available actions for current context ─────────────────────────────────────

/**
 * Returns all actions DONNA can perform for a given role on the current page.
 * Useful for populating suggestion chips and guided operator step menus.
 */
export function getAvailableActionsForContext(
  role: UIActionRole,
  currentRoute: string,
): Array<{
  actionId: string
  displayName: string
  safetyClass: UIActionSafetyClass
  requiresApproval: boolean
  matrixPermission: MatrixPermission
}> {
  const pageActions = getUIActionsForPage(currentRoute)
  return pageActions
    .filter(action => {
      if (action.safetyClass === 'always_blocked') return false
      const { allowed } = canDonnaPerformUIAction(action.id, role)
      return allowed
    })
    .map(action => {
      const evaluation = evaluateUIAction(action.id, role)
      return {
        actionId: action.id,
        displayName: action.displayName,
        safetyClass: action.safetyClass,
        requiresApproval: action.requiresApproval,
        matrixPermission: evaluation.matrixPermission,
      }
    })
}

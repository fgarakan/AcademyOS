// Sprint 1076 — DONNA Action Registry Expansion V1
//
// Intent-level action registry: what the director *asked for*, not which UI mechanism executes it.
//
// Relationship to existing layers:
//   - donnaUIActionRegistry.ts (Sprint 753):  fine-grained UI surface ops (route_push, draft_submit, etc.)
//   - donnaUIActionDispatcher.ts (Sprint 755): runtime pattern-matching dispatch
//   - donnaPageChipRegistry.ts (Sprint 964):  per-route highlight/prompt chips
//   - THIS FILE: intent-level actions for DONNA to reason about at the director-request level
//
// These are orthogonal, not competing. A single DonnaAction intent (e.g. draft_parent_update)
// maps to multiple UIActions once it reaches the execution layer. DonnaAction is the
// vocabulary DONNA uses when classifying "what did the director ask me to do?"
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.
// Not wired into runtime in this sprint. Future sprint: wire matchDonnaActionIntent
// into handleDonnaCooPrompt as a pre-classifier before routeDonnaPrompt.

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaActionRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'player'
  | 'parent'

/**
 * Intent-level category of a director action.
 *
 * navigation       — DONNA navigates to a route. No state change.
 * explanation      — DONNA explains something. Read-only answer. No navigation.
 * draft            — DONNA creates a draft for director review. Goes to proposed_actions or review queue.
 * review           — DONNA surfaces review queue items or opens the approval flow.
 * mutation_request — Director has requested something that would change records. Must only produce
 *                    a draft/proposal — never executes directly. Highest safety class in this registry.
 */
export type DonnaActionCategory =
  | 'navigation'
  | 'explanation'
  | 'draft'
  | 'review'
  | 'mutation_request'

/**
 * Risk level of the action if it proceeds.
 *
 * low    — No state change possible. Navigation, explanation, read-only context.
 * medium — Creates a draft or proposed_action. Director must approve before any effect.
 * high   — Would affect player records, parent data, or curriculum. Must only produce
 *           a draft/proposal and route through the review queue. Never auto-executes.
 */
export type DonnaActionRiskLevel = 'low' | 'medium' | 'high'

// ── Action interface ──────────────────────────────────────────────────────────

export interface DonnaAction {
  /** Unique identifier — stable across sprints. Snake_case. */
  actionId: string
  /** Human-readable label for display and logging. */
  label: string
  /** Intent-level category. Determines the execution path and safety gate. */
  category: DonnaActionCategory
  /**
   * Natural language phrases that activate this action.
   * Used by matchDonnaActionIntent for case-insensitive substring matching.
   * More specific phrases should appear before broader ones.
   */
  intentPhrases: string[]
  /**
   * Target route for navigation actions. Optional for explanation/draft/review actions
   * that are page-agnostic or route the director via the review queue.
   */
  route?: string
  /** Roles that may trigger this action. DONNA refuses for unlisted roles. */
  allowedRoles: DonnaActionRole[]
  /** Risk level — determines how DONNA frames the response. */
  riskLevel: DonnaActionRiskLevel
  /**
   * Whether this action requires explicit director approval before any effect.
   * Always true for draft, review, and mutation_request categories.
   * Navigation and explanation actions that are purely read-only use false.
   */
  requiresApproval: boolean
  /**
   * What DONNA says when confirming this action to the director.
   * Null for low-risk navigation that executes without confirmation prompt.
   */
  confirmationMessage: string | null
  /**
   * What DONNA says when this action is blocked for the current role or context.
   * Null for actions that are always available to all listed roles.
   */
  blockedMessage: string | null
  /**
   * Concise description of what makes this action safe or why it is restricted.
   * Used in future wiring to explain DONNA's behavior to the director.
   */
  safetyMessage: string
  /**
   * Routes of context packs that surface this action in their commonCommands.
   * Used by getDonnaActionsForRoute to build page-relevant action suggestions.
   */
  relatedContextPackRoutes: string[]
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const DONNA_ACTIONS: DonnaAction[] = [

  // ─── Navigation actions (low risk) ───────────────────────────────────────

  {
    actionId: 'open_today',
    label: 'Open Today',
    category: 'navigation',
    intentPhrases: [
      'open today', 'go to today', 'take me to today', 'show today',
      'go to dashboard', 'open dashboard', 'home', 'go home',
    ],
    route: '/director',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Navigation only — no state change. Routes to the director daily command center.',
    relatedContextPackRoutes: ['/director'],
  },

  {
    actionId: 'open_approvals',
    label: 'Open Approvals',
    category: 'navigation',
    intentPhrases: [
      'open approvals', 'go to approvals', 'take me to approvals',
      'approvals page', 'review queue', 'go to review', 'open review',
      'what needs approval', 'pending approvals', 'what needs review',
    ],
    route: '/director/review',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'The review queue is accessible to directors only.',
    safetyMessage: 'Navigation only. Opening the review queue does not approve or reject anything.',
    relatedContextPackRoutes: ['/director', '/director/review'],
  },

  {
    actionId: 'open_players',
    label: 'Open Players',
    category: 'navigation',
    intentPhrases: [
      'open players', 'go to players', 'show players', 'take me to players',
      'player directory', 'player list', 'all players', 'my players',
    ],
    route: '/director/players',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Navigation only. No player records are changed by opening the directory.',
    relatedContextPackRoutes: ['/director', '/director/players'],
  },

  {
    actionId: 'open_sessions',
    label: 'Open Sessions',
    category: 'navigation',
    intentPhrases: [
      'open sessions', 'go to sessions', 'show sessions', 'take me to sessions',
      'sessions list', 'session directory', 'all sessions',
    ],
    route: '/director/sessions',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Navigation only. No sessions are modified by opening the sessions list.',
    relatedContextPackRoutes: ['/director', '/director/sessions'],
  },

  {
    actionId: 'open_curriculum',
    label: 'Open Curriculum',
    category: 'navigation',
    intentPhrases: [
      'open curriculum', 'go to curriculum', 'take me to curriculum',
      'curriculum page', 'show curriculum', 'view curriculum',
    ],
    route: '/director/curriculum',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'Curriculum is accessible to directors only.',
    safetyMessage: 'Navigation only. Viewing curriculum does not modify it.',
    relatedContextPackRoutes: ['/director'],
  },

  {
    actionId: 'open_parent_updates',
    label: 'Open Parent Updates',
    category: 'navigation',
    intentPhrases: [
      'open parent updates', 'go to parent updates', 'parent communication',
      'parent messages', 'parent center', 'parent section', 'show parents',
    ],
    route: '/director/parents',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'Parent communication is accessible to directors only.',
    safetyMessage: 'Navigation only. Opening the parent updates page does not send any messages.',
    relatedContextPackRoutes: ['/director', '/director/parents'],
  },

  {
    actionId: 'open_academy_health',
    label: 'Open Academy Health',
    category: 'navigation',
    intentPhrases: [
      'open academy health', 'go to academy health', 'academy health page',
      'open kpi', 'kpi page', 'kpi dashboard', 'health dashboard',
      'view metrics', 'show metrics', 'open metrics',
    ],
    route: '/director/kpi',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'Academy Health is accessible to directors only.',
    safetyMessage: 'Navigation only. No KPI data is modified by opening this page.',
    relatedContextPackRoutes: ['/director', '/director/kpi'],
  },

  {
    actionId: 'open_templates',
    label: 'Open Templates',
    category: 'navigation',
    intentPhrases: [
      'open templates', 'go to templates', 'take me to templates',
      'class templates', 'session templates', 'template library', 'show templates',
    ],
    route: '/director/class-templates',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Navigation only. No templates are modified by opening the library.',
    relatedContextPackRoutes: ['/director'],
  },

  {
    actionId: 'open_coaches',
    label: 'Open Coaches',
    category: 'navigation',
    intentPhrases: [
      'open coaches', 'go to coaches', 'show coaches', 'coach directory',
      'take me to coaches', 'staff', 'coaching staff',
    ],
    route: '/director/coaches',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'Coach management is accessible to directors only.',
    safetyMessage: 'Navigation only. No coach records are modified by opening this page.',
    relatedContextPackRoutes: ['/director'],
  },

  {
    actionId: 'open_settings',
    label: 'Open Settings',
    category: 'navigation',
    intentPhrases: [
      'open settings', 'go to settings', 'academy settings', 'preferences',
      'take me to settings', 'show settings',
    ],
    route: '/director/settings',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'Academy settings are accessible to directors only.',
    safetyMessage: 'Navigation only. Opening settings does not save any changes.',
    relatedContextPackRoutes: ['/director'],
  },

  // ─── Explanation actions (low risk) ──────────────────────────────────────

  {
    actionId: 'explain_academy_health',
    label: 'Explain Academy Health',
    category: 'explanation',
    intentPhrases: [
      'tell me about the health of my academy', 'how is my academy doing',
      'explain these kpis', 'what do these kpis mean', 'what do the kpis show',
      'which kpi needs attention', 'academy health', 'how healthy is my academy',
      'overall health', 'health score', 'explain the signals',
    ],
    route: '/director/kpi',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Read-only explanation of Academy Health dashboard signals. No data changes.',
    relatedContextPackRoutes: ['/director/kpi'],
  },

  {
    actionId: 'make_fitness_template_game_based',
    label: 'Make Fitness Template Game-Based',
    category: 'explanation',
    intentPhrases: [
      'make this more game-based', 'more game-based', 'add game elements',
      'game-like exercises', 'game situation training', 'competitive movement',
      'how to make this more fun', 'gamify this template',
    ],
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: null,
    safetyMessage: 'Explanation and guidance only. DONNA describes how to restructure the template — the director makes all block changes using the on-screen builder.',
    relatedContextPackRoutes: ['/director/fitness/templates/[templateId]'],
  },

  // ─── Draft actions (medium risk) ─────────────────────────────────────────

  {
    actionId: 'create_class_template',
    label: 'Create Class Template',
    category: 'draft',
    intentPhrases: [
      'create a class template', 'new class template', 'build a class template',
      'create a template', 'make a template', 'start a template',
      'draft a class template', 'help me create a template',
    ],
    route: '/director/class-templates/new',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'medium',
    requiresApproval: true,
    confirmationMessage: 'I\'ll take you to the Class Template Builder. Fill in the details there — nothing is saved until you publish.',
    blockedMessage: null,
    safetyMessage: 'Routes to the Class Template Builder workspace. No template is created until the director completes the form and publishes it.',
    relatedContextPackRoutes: ['/director/class-templates', '/director/class-templates/[templateId]'],
  },

  {
    actionId: 'create_fitness_template',
    label: 'Create Fitness Template',
    category: 'draft',
    intentPhrases: [
      'create a fitness template', 'new fitness template', 'build a fitness template',
      'make a fitness template', 'start a fitness template', 'draft a fitness template',
    ],
    route: '/director/fitness/templates',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'medium',
    requiresApproval: true,
    confirmationMessage: 'I\'ll take you to the Fitness Template section. Use the New Template button there — nothing is saved until you complete the builder.',
    blockedMessage: null,
    safetyMessage: 'Routes to the Fitness Templates section. No template is created until the director completes the builder and saves.',
    relatedContextPackRoutes: ['/director/fitness/templates/[templateId]'],
  },

  {
    actionId: 'draft_parent_update',
    label: 'Draft Parent Update',
    category: 'draft',
    intentPhrases: [
      'draft a parent update', 'write a parent update', 'create a parent update',
      'parent message', 'parent progress update', 'message for parents',
      'prepare a parent update', 'parent communication draft',
    ],
    route: '/director/review',
    allowedRoles: ['academy_director'],
    riskLevel: 'medium',
    requiresApproval: true,
    confirmationMessage: 'I can draft a parent-safe update for your review. Which player, and what\'s the main highlight? You approve and dispatch it from the review queue — nothing is sent automatically.',
    blockedMessage: 'Drafting parent updates requires director access. Coaches can flag observations for the director to action.',
    safetyMessage: 'Parent update drafts go to proposed_actions for director review. DONNA never sends a parent message directly. Every communication requires explicit director approval and manual dispatch.',
    relatedContextPackRoutes: ['/director/parents', '/director/review'],
  },

  {
    actionId: 'create_session_adjustment_draft',
    label: 'Create Session Adjustment Draft',
    category: 'draft',
    intentPhrases: [
      'adjust a session', 'session adjustment', 'change the session plan',
      'modify session blocks', 'update session', 'session change draft',
      'propose session adjustment',
    ],
    route: '/director/review',
    allowedRoles: ['academy_director', 'head_coach'],
    riskLevel: 'medium',
    requiresApproval: true,
    confirmationMessage: 'I\'ll draft a session adjustment proposal for your review. What would you like to change? The draft goes to the review queue — nothing is applied until you approve it.',
    blockedMessage: null,
    safetyMessage: 'Session adjustments are drafted and routed to the review queue. No session records are modified until the director explicitly applies the approved action.',
    relatedContextPackRoutes: ['/director/sessions', '/director/review'],
  },

  // ─── Review actions (low-medium risk) ────────────────────────────────────

  {
    actionId: 'review_approvals',
    label: 'Review Approvals',
    category: 'review',
    intentPhrases: [
      'review approvals', 'review pending items', 'check approvals',
      'what should i review', 'what should i approve',
      'what is waiting for approval', 'review queue summary',
      'show me what needs review', 'pending review items',
    ],
    route: '/director/review',
    allowedRoles: ['academy_director'],
    riskLevel: 'low',
    requiresApproval: false,
    confirmationMessage: null,
    blockedMessage: 'The review queue is accessible to directors only.',
    safetyMessage: 'Opens the review queue and explains pending items. No items are approved, rejected, or applied by this action.',
    relatedContextPackRoutes: ['/director', '/director/review'],
  },

  // ─── Mutation request actions (high risk) ────────────────────────────────

  {
    actionId: 'suggest_level_movement',
    label: 'Suggest Level Movement',
    category: 'mutation_request',
    intentPhrases: [
      'move a player to a new level', 'suggest level movement', 'propose level change',
      'recommend level advancement', 'advance a player', 'level up a player',
      'propose promotion', 'review level readiness', 'player ready to move up',
    ],
    route: '/director/level-up',
    allowedRoles: ['academy_director'],
    riskLevel: 'high',
    requiresApproval: true,
    confirmationMessage: 'I can prepare a level-readiness review for your consideration. Which player? This will be a proposed action in the review queue — no level change happens until you explicitly approve it.',
    blockedMessage: 'DONNA never moves a player level directly. I can draft a level-readiness proposal with supporting evidence for your review.',
    safetyMessage: 'Level movement is a high-risk action — it affects the player\'s curriculum path, coaching assignments, and potentially parent communications. DONNA only produces a draft proposal routed through proposed_actions. The director must explicitly approve via the Level Up review queue. The finalize_player_placement() pathway is the only route to activate level changes.',
    relatedContextPackRoutes: ['/director/players', '/director/level-up', '/director/review'],
  },

]

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up a DonnaAction by its actionId.
 * Returns null if the actionId is not registered.
 */
export function getDonnaActionById(actionId: string): DonnaAction | null {
  return DONNA_ACTIONS.find(a => a.actionId === actionId) ?? null
}

/**
 * Find the best-matching action for a director's prompt.
 *
 * Performs case-insensitive substring match against each action's intentPhrases.
 * Optionally filters by role — returns null for actions blocked for the given role.
 *
 * Returns the first matching action in registry order (more specific phrases are
 * declared first within each action). Returns null if no phrase matches.
 *
 * NOTE: Not wired into runtime in Sprint 1076.
 * Future wiring: call from handleDonnaCooPrompt before routeDonnaPrompt as a
 * pre-classifier for structured intent-to-action resolution.
 */
export function matchDonnaActionIntent(
  prompt: string,
  role?: DonnaActionRole,
): DonnaAction | null {
  const lower = prompt.toLowerCase().trim()
  for (const action of DONNA_ACTIONS) {
    // Role filter: if role is provided, skip actions that don't allow it
    if (role && !action.allowedRoles.includes(role)) continue
    for (const phrase of action.intentPhrases) {
      if (lower.includes(phrase.toLowerCase())) {
        return action
      }
    }
  }
  return null
}

/**
 * Get all actions relevant to a given route.
 *
 * Matches:
 * 1. Actions whose `route` exactly equals the given route
 * 2. Actions whose `relatedContextPackRoutes` includes the given route
 * 3. For dynamic routes (e.g. /director/fitness/templates/<id>), matches by prefix
 *    against relatedContextPackRoutes entries containing '[' (dynamic segments)
 *
 * Returns an empty array for routes with no registered actions.
 */
export function getDonnaActionsForRoute(route: string): DonnaAction[] {
  return DONNA_ACTIONS.filter(action => {
    // Direct route match
    if (action.route === route) return true

    // Related context pack route match
    for (const packRoute of action.relatedContextPackRoutes) {
      if (packRoute === route) return true
      // Dynamic route: '/director/fitness/templates/[templateId]' → match /director/fitness/templates/<id>
      if (packRoute.includes('[')) {
        const prefix = packRoute.slice(0, packRoute.indexOf('['))
        if (route.startsWith(prefix) && route.split('/').length === packRoute.split('/').length) {
          return true
        }
      }
    }
    return false
  })
}

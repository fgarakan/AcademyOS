// Sprint 753 — DONNA Site-Wide UI Action Registry V1
// Authoritative registry of every class of UI action DONNA can perform across AcademyOS.
// Covers all roles and all major page domains.
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
//
// This registry is the foundation for:
//   - donnaUIApprovalMatrix.ts (Sprint 753) — per-role approval gates
//   - Domain guided operators (Sprint 754) — step-by-step page operators
//   - donnaUIActionDispatcher.ts (Sprint 755) — structured action dispatch
//   - DONNA_SITE_WIDE_UI_OPERATOR_CERTIFICATION.md (Sprint 756)
//
// Relationship to existing registries:
//   - directorActionRegistry.ts (Sprint 606) — director domain actions (answer/draft/review)
//   - donnaActionTypes.ts (Sprint 1020) — base action taxonomy
//   - THIS FILE: UI surface actions (navigate, expand, filter, etc.) — orthogonal classification

// ── UI Action safety class ────────────────────────────────────────────────────

export type UIActionSafetyClass =
  | 'always_safe'         // No state change. Navigation, expand/collapse, filter — safe for any role.
  | 'safe_with_context'   // Safe when role and page guard are verified. Fills safe fields, opens builders.
  | 'draft_to_review'     // Creates a proposed_actions row — director must approve before effect.
  | 'director_approval'   // Requires explicit director sign-off before any change takes effect.
  | 'platform_required'   // Requires platform-owner authorization beyond director scope.
  | 'always_blocked'      // Must never be automated by DONNA. Explicitly refused.

// ── UI Action execution method ────────────────────────────────────────────────

export type UIActionMethod =
  | 'route_push'          // Next.js router.push() — navigate to a page
  | 'panel_toggle'        // Open or close the DONNA sidebar panel
  | 'section_toggle'      // Expand or collapse a page section
  | 'filter_apply'        // Set a filter, search term, or sort parameter
  | 'workflow_start'      // Initiate a guided multi-step workflow
  | 'builder_open'        // Open a form builder or creation wizard
  | 'draft_submit'        // Submit a draft to proposed_actions for review
  | 'form_fill'           // Populate a safe form field (non-official)
  | 'step_advance'        // Move forward one step in a wizard/onboarding flow
  | 'step_back'           // Move back one step in a wizard/onboarding flow
  | 'detail_open'         // Open a detail/review page for a record
  | 'approval_gate'       // Route to director review queue — no direct execution
  | 'blocked_refusal'     // Return a boundary response — no action taken

// ── UI Action domain ──────────────────────────────────────────────────────────

export type UIActionDomain =
  | 'navigation'
  | 'panel_control'
  | 'onboarding'
  | 'curriculum'
  | 'templates'
  | 'sessions'
  | 'players'
  | 'review_queue'
  | 'coaches'
  | 'parents'
  | 'settings'
  | 'kpi'
  | 'signals'
  | 'voice_control'
  | 'blocked'

// ── Roles ────────────────────────────────────────────────────────────────────

export type UIActionRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'player'
  | 'parent'

// ── UI Action definition ──────────────────────────────────────────────────────

export interface UIAction {
  id: string
  displayName: string
  description: string
  domain: UIActionDomain
  safetyClass: UIActionSafetyClass
  method: UIActionMethod
  allowedRoles: UIActionRole[]
  requiresApproval: boolean
  approvalRoute: '/director/review' | null
  naturalLanguageExamples: string[]
  pageGuard: string[]         // Routes where this action is valid ([] = any page)
  focusTargetId?: string      // Sprint 869 — data-donna-focus-id of the section to highlight after navigation (undefined for page-level actions)
  blockedReason: string | null
  implementationStatus: 'wired' | 'partially_wired' | 'pattern_exists' | 'not_built'
  notes: string | null
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const DONNA_UI_ACTIONS: UIAction[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 1 — NAVIGATION (always_safe, all director pages)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'navigate_to_page',
    displayName: 'Navigate to a page',
    description: 'DONNA triggers router.push() to move the director to a named page. No state mutation.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Take me to players.',
      'Open the review center.',
      'Go to curriculum.',
      'Show me sessions.',
      'Navigate to templates.',
      'Open the dashboard.',
      'Take me to onboarding.',
    ],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Nav offers already implemented via setPendingNavOffer + Yes/No confirmation in DonnaVoiceReadyShell and DonnaAssistantButton.',
  },

  {
    id: 'navigate_to_player_profile',
    displayName: 'Navigate to a specific player profile',
    description: 'DONNA routes to /director/players/[playerId]. Requires player id from context.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Open Marcus\'s profile.',
      'Show me this player.',
      'Take me to the player page.',
    ],
    pageGuard: ['/director/players', '/director/players/[playerId]'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Router exists; player id resolution from context needed.',
  },

  {
    id: 'navigate_back',
    displayName: 'Go back to the previous page',
    description: 'DONNA triggers router.back(). No state mutation.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach', 'coach', 'player', 'parent'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: ['Go back.', 'Take me back.', 'Previous page.'],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Trivial to wire; not yet surfaced as an explicit DONNA action.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 1A — NAVIGATE TO SECTION (always_safe)
  // Sprint 869 — wires Sprint 868 data-donna-focus-id targets into the registry.
  // Each action navigates to a route AND requests section highlighting.
  // Dispatcher pattern: setDonnaFocusTarget({ route, targetId: focusTargetId, label })
  // called immediately before router.push(route). DonnaHighlightBanner reads the
  // target from sessionStorage on mount and applies donna-focus-ring CSS.
  // All actions are always_safe — read-only navigation only, no mutations.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Director: Sessions list ──────────────────────────────────────────────────

  {
    id: 'navigate_to_sessions_list',
    displayName: 'Navigate to the sessions list',
    description: 'DONNA navigates to /director/sessions and highlights the session list. No state mutation.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me all sessions.',
      'Take me to sessions.',
      'Open the sessions list.',
      'Go to the session calendar.',
    ],
    pageGuard: [],
    focusTargetId: 'session-list',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/sessions. Focus target `session-list` only present when sessions exist. Sprint 868 DOM target. Sprint 870 dispatch wired (static route).',
  },

  // ── Director: Session detail sections ────────────────────────────────────────

  {
    id: 'navigate_to_session_blocks',
    displayName: 'Navigate to the session blocks section',
    description: 'DONNA navigates to the session detail page and highlights the SESSION BLOCKS section. Requires sessionId in DONNA context.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me the session blocks.',
      'Take me to the blocks for this session.',
      'Go to session blocks.',
      'What blocks are in this session?',
    ],
    pageGuard: [],
    focusTargetId: 'session-blocks',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/sessions/[sessionId]. Focus target `session-blocks` only present when blocks exist. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_session_attendance',
    displayName: 'Navigate to the session roster and attendance section',
    description: 'DONNA navigates to the session detail page and highlights the ROSTER & ATTENDANCE section.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me attendance for this session.',
      'Take me to the roster.',
      'Open attendance.',
      'Who attended this session?',
    ],
    pageGuard: [],
    focusTargetId: 'session-roster-attendance',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/sessions/[sessionId]. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_session_roster_intelligence',
    displayName: 'Navigate to the class roster intelligence section',
    description: 'DONNA navigates to the session detail page and highlights the CLASS ROSTER INTELLIGENCE section. Only visible if a group is assigned to the session.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me the class roster data.',
      'What players are in this session?',
      'Go to roster intelligence.',
      'Who needs attention in this class?',
    ],
    pageGuard: [],
    focusTargetId: 'session-roster-intelligence',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/sessions/[sessionId]. Focus target `session-roster-intelligence` only present when session has a group assigned. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  // ── Director: Template detail sections ────────────────────────────────────────

  {
    id: 'navigate_to_template_stepper',
    displayName: 'Navigate to the template builder',
    description: 'DONNA navigates to the class template detail page and highlights the builder stepper. Works from any step. Requires templateId in DONNA context.',
    domain: 'templates',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Open the template builder.',
      'Take me to this template.',
      'Go to the template.',
      'Show me the template editor.',
    ],
    pageGuard: [],
    focusTargetId: 'template-stepper',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/class-templates/[templateId]. Focus target `template-stepper` is always visible regardless of active step. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: templateId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_template_blocks',
    displayName: 'Navigate to the template block builder section',
    description: 'DONNA navigates to the class template detail page and highlights the Build Blocks section (Step 3). Focus only applies when the stepper is on Step 3.',
    domain: 'templates',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Take me to the template blocks.',
      'Show me where to add drills.',
      'Open the block builder.',
      'Help me add content to the template blocks.',
    ],
    pageGuard: [],
    focusTargetId: 'template-blocks-section',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/class-templates/[templateId]. Focus target `template-blocks-section` only present in DOM on Step 3 of the stepper. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: templateId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_template_generate_session',
    displayName: 'Navigate to the generate session section of a template',
    description: 'DONNA navigates to the class template detail page and highlights the Create Session from Template section (Step 5).',
    domain: 'templates',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me how to create a session from this template.',
      'Take me to generate session.',
      'Go to session creation.',
      'Where do I generate a session?',
    ],
    pageGuard: [],
    focusTargetId: 'template-generate-session',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /director/class-templates/[templateId]. Focus target `template-generate-session` only present on Step 5. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: templateId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  // ── Coach: Hub sections ───────────────────────────────────────────────────────

  {
    id: 'navigate_to_coach_home_today',
    displayName: "Navigate to the coach hub today's sessions",
    description: "DONNA navigates to /coach and highlights the TODAY section showing the coach's session plan for the day.",
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      "Show me today's sessions.",
      "What do I have today?",
      'Take me to my session plan.',
      'What is on my schedule?',
    ],
    pageGuard: [],
    focusTargetId: 'coach-today-sessions',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach. Focus target `coach-today-sessions` wraps the TODAY section. Sprint 868 DOM target. Sprint 870 dispatch wired (static route).',
  },

  // ── Coach: Players list ───────────────────────────────────────────────────────

  {
    id: 'navigate_to_coach_players',
    displayName: 'Navigate to the coach players list',
    description: 'DONNA navigates to /coach/players and highlights the player list. Only shows players assigned to this coach.',
    domain: 'players',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me my players.',
      'Take me to player list.',
      'Open my players.',
      'Who are my players?',
    ],
    pageGuard: [],
    focusTargetId: 'coach-player-list',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/players. Focus target `coach-player-list` wraps the full players directory. Coach-scoped — only assigned players shown. Sprint 868 DOM target. Sprint 870 dispatch wired (static route).',
  },

  // ── Coach: Session detail sections ────────────────────────────────────────────

  {
    id: 'navigate_to_coach_lesson_plan',
    displayName: "Navigate to the session's lesson plan",
    description: "DONNA navigates to the coach session page and highlights the Today's Plan section. Only visible if the session has a template. Requires sessionId in context.",
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      "Show me today's plan.",
      'What are we doing today?',
      'Go to the lesson plan.',
      'Show me the curriculum for this session.',
    ],
    pageGuard: [],
    focusTargetId: 'coach-lesson-plan',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/sessions/[sessionId]. Focus target `coach-lesson-plan` only present when session has a template. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_coach_run_session',
    displayName: 'Navigate to the run-session section',
    description: 'DONNA navigates to the coach session page and highlights the Run the Session section (blocks, exercises, and attendance panel).',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me the session execution panel.',
      'Take me to run session.',
      'Open blocks and attendance.',
      'Where do I mark attendance?',
    ],
    pageGuard: [],
    focusTargetId: 'coach-run-session',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/sessions/[sessionId]. Focus target `coach-run-session` wraps CoachSessionExecutionClient. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_coach_wrap_up_link',
    displayName: 'Navigate to the session wrap-up CTA section',
    description: 'DONNA navigates to the coach session page and highlights the After Session section containing the wrap-up CTA and status.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me where to wrap up.',
      'Take me to after session.',
      'Where do I submit my notes?',
      'How do I start wrap-up?',
    ],
    pageGuard: [],
    focusTargetId: 'coach-wrap-up-link',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/sessions/[sessionId]. Focus target `coach-wrap-up-link` wraps the After Session section with wrap-up CTA. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  // ── Coach: Wrap-up page sections ─────────────────────────────────────────────

  {
    id: 'navigate_to_wrapup_question',
    displayName: 'Navigate to the active wrap-up question',
    description: 'DONNA navigates to the session wrap-up page and highlights the current question card. Only visible in the questions phase (not after submission).',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Take me to the wrap-up question.',
      'Show me the current question.',
      'Where do I answer wrap-up?',
      'Go to wrap-up.',
    ],
    pageGuard: [],
    focusTargetId: 'wrapup-question-card',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/sessions/[sessionId]/wrap-up. Focus target `wrapup-question-card` only present in questions phase; absent after submission. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  {
    id: 'navigate_to_wrapup_actions',
    displayName: 'Navigate to the wrap-up submit actions',
    description: 'DONNA navigates to the session wrap-up page and highlights the navigation bar (Back / Skip / Submit for Review buttons).',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'route_push',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me where to submit.',
      'Take me to submit wrap-up.',
      'Where do I finish wrap-up?',
      'How do I submit my session notes?',
    ],
    pageGuard: [],
    focusTargetId: 'wrapup-nav-actions',
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Destination: /coach/sessions/[sessionId]/wrap-up. Focus target `wrapup-nav-actions` contains Back, Skip, and Submit for Review buttons. Sprint 868 DOM target. Sprint 870 dispatch wired (URL). Sprint 872 context-param fallback: sessionId from lastKnownContextParamsRef enables cross-page navigation.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 2 — PANEL CONTROL (always_safe)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'open_donna_panel',
    displayName: 'Open the DONNA assistant panel',
    description: 'DONNA panel opens via the floating button or panel state.',
    domain: 'panel_control',
    safetyClass: 'always_safe',
    method: 'panel_toggle',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: ['Open DONNA.', 'Show the assistant.'],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'donnaPanelOpen state in DonnaSessionContextProvider. Sprint 745 added sessionStorage persistence.',
  },

  {
    id: 'close_donna_panel',
    displayName: 'Close the DONNA assistant panel',
    description: 'DONNA panel closes. No state mutation.',
    domain: 'panel_control',
    safetyClass: 'always_safe',
    method: 'panel_toggle',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: ['Close DONNA.', 'Dismiss the assistant.'],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'closePanel() function in DonnaAssistantButton.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 3 — PAGE SECTION CONTROL (always_safe)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'expand_section',
    displayName: 'Expand a collapsible section',
    description: 'DONNA signals a page section to expand. No server state change.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'section_toggle',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Expand the player details.',
      'Show more.',
      'Open this section.',
    ],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Requires event/callback bridge between DONNA and page components. Architecture pattern for this is defined but not yet deployed site-wide.',
  },

  {
    id: 'collapse_section',
    displayName: 'Collapse a page section',
    description: 'DONNA signals a page section to collapse. No server state change.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'section_toggle',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: ['Collapse this.', 'Hide this section.', 'Minimize.'],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Same bridge requirement as expand_section.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 4 — FILTER / SORT / SEARCH (always_safe)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'filter_players',
    displayName: 'Filter player list by level, group, or status',
    description: 'DONNA sets a filter parameter on the players list. No DB write.',
    domain: 'players',
    safetyClass: 'always_safe',
    method: 'filter_apply',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me Orange 2 players.',
      'Filter by development level.',
      'Show players needing attention.',
      'Filter to active players only.',
    ],
    pageGuard: ['/director/players'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Player list has filter UI; DONNA filter-inject pattern not yet implemented.',
  },

  {
    id: 'filter_sessions',
    displayName: 'Filter or search sessions by date, coach, or status',
    description: 'DONNA sets a filter on the sessions list. No DB write.',
    domain: 'sessions',
    safetyClass: 'always_safe',
    method: 'filter_apply',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show today\'s sessions.',
      'Filter sessions by coach.',
      'Show pending wrap-ups.',
      'Find sessions from this week.',
    ],
    pageGuard: ['/director/sessions', '/coach/sessions'],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Session list filter exists; DONNA inject not yet wired.',
  },

  {
    id: 'filter_review_queue',
    displayName: 'Filter the review queue by type or status',
    description: 'DONNA sets a filter on the review queue. No DB write.',
    domain: 'review_queue',
    safetyClass: 'always_safe',
    method: 'filter_apply',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show only attendance exceptions.',
      'Filter to draft items.',
      'Show session wrap-ups pending review.',
    ],
    pageGuard: ['/director/review'],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Review queue has type filters; DONNA inject not yet wired.',
  },

  {
    id: 'search_global',
    displayName: 'Search AcademyOS for a player, coach, or record',
    description: 'DONNA initiates a global search. No state mutation.',
    domain: 'navigation',
    safetyClass: 'always_safe',
    method: 'filter_apply',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Search for Marcus.',
      'Find coach Sarah.',
      'Look up session 4A.',
    ],
    pageGuard: [],
    blockedReason: null,
    implementationStatus: 'pattern_exists',
    notes: 'Global search module exists at src/lib/donna/search/; not yet surfaced as DONNA action.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 5 — ONBOARDING GUIDANCE (safe_with_context)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'advance_onboarding_step',
    displayName: 'Advance the director to the next onboarding step',
    description: 'DONNA guides the director to the next setup step. No data submitted — navigational only.',
    domain: 'onboarding',
    safetyClass: 'safe_with_context',
    method: 'step_advance',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Next step.',
      'What do I do next?',
      'Continue setup.',
      'Move to the next question.',
    ],
    pageGuard: ['/director/onboarding', '/director/onboarding/interview', '/director/onboarding/curriculum'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Onboarding step state exists in DONNA onboarding flow. Navigation advance is safe but form submission still requires director action.',
  },

  {
    id: 'explain_onboarding_step',
    displayName: 'Explain the current onboarding step',
    description: 'DONNA explains what the current setup step is asking and why it matters.',
    domain: 'onboarding',
    safetyClass: 'always_safe',
    method: 'blocked_refusal',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'What is this step asking?',
      'Why does this matter?',
      'Explain this question.',
      'Walk me through this.',
    ],
    pageGuard: ['/director/onboarding', '/director/onboarding/interview', '/director/onboarding/curriculum'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Fully answered by donnaPageContextEngine + DONNA onboarding context.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 6 — BUILDER LAUNCH (safe_with_context)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'open_curriculum_builder',
    displayName: 'Open the curriculum builder',
    description: 'DONNA navigates to /director/curriculum/builder. No content created.',
    domain: 'curriculum',
    safetyClass: 'safe_with_context',
    method: 'builder_open',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Open the curriculum builder.',
      'I want to add a new level.',
      'Help me build my curriculum.',
      'Go to curriculum setup.',
    ],
    pageGuard: ['/director/curriculum'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Route exists and is navigable. Builder UI at /director/curriculum/builder.',
  },

  {
    id: 'open_template_builder',
    displayName: 'Open the session template builder',
    description: 'DONNA navigates to /director/class-templates or opens the template creation modal.',
    domain: 'templates',
    safetyClass: 'safe_with_context',
    method: 'builder_open',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Create a new session template.',
      'Open template builder.',
      'I want to build a warmup drill template.',
      'Add a template.',
    ],
    pageGuard: ['/director/class-templates', '/director/templates'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Template builder route exists; DONNA template draft flow in TemplateDraftPanel.',
  },

  {
    id: 'open_fitness_template_builder',
    displayName: 'Open the fitness template builder',
    description: 'DONNA navigates to /director/fitness/templates or opens the fitness creation modal.',
    domain: 'templates',
    safetyClass: 'safe_with_context',
    method: 'builder_open',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Create a fitness template.',
      'Open fitness builder.',
      'Build a conditioning drill.',
    ],
    pageGuard: ['/director/fitness/templates'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Route exists; DONNA fitness draft flow in fitnessDraftDonnaAnswer.ts.',
  },

  {
    id: 'open_placement_wizard',
    displayName: 'Open the player placement wizard',
    description: 'DONNA navigates to /director/placement to start the player placement flow.',
    domain: 'players',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Place a new player.',
      'Start the placement process.',
      'I need to assess a new player.',
      'Open placement.',
    ],
    pageGuard: ['/director/players', '/director/placement'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Placement wizard exists at /director/placement. DONNA can navigate there; placement itself requires director action.',
  },

  {
    id: 'open_session_wrap_up',
    displayName: 'Open the session wrap-up flow',
    description: 'DONNA navigates coach to the session wrap-up page or triggers the wrap-up workflow.',
    domain: 'sessions',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['head_coach', 'coach'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Start wrap-up.',
      'I\'m done with the session.',
      'Submit session recap.',
      'Open wrap-up.',
    ],
    pageGuard: ['/coach/sessions/[sessionId]', '/coach/recap'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'Wrap-up flow wired at /coach/recap and session page.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 7 — GUIDED FLOWS (safe_with_context)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'start_guided_onboarding',
    displayName: 'Start the academy onboarding guided flow',
    description: 'DONNA leads the director through the onboarding steps with contextual explanations at each stage.',
    domain: 'onboarding',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Help me set up the academy.',
      'Walk me through onboarding.',
      'What do I do to get started?',
      'Guide me through setup.',
    ],
    pageGuard: ['/director/onboarding'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Onboarding guidance answered; step-by-step operator defined in Sprint 754.',
  },

  {
    id: 'start_guided_curriculum',
    displayName: 'Start the curriculum guided operator',
    description: 'DONNA guides the director through reviewing or building curriculum levels, gates, and structure.',
    domain: 'curriculum',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Help me with curriculum.',
      'Walk me through setting up curriculum.',
      'Explain my curriculum gaps.',
      'Guide me through the curriculum builder.',
    ],
    pageGuard: ['/director/curriculum', '/director/curriculum/builder'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Curriculum answer engines exist; guided operator defined in Sprint 754.',
  },

  {
    id: 'start_guided_review',
    displayName: 'Start the review center guided operator',
    description: 'DONNA guides the director through pending review items one at a time.',
    domain: 'review_queue',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Help me review the queue.',
      'Walk me through pending approvals.',
      'What needs my review?',
      'Guide me through review.',
    ],
    pageGuard: ['/director/review'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Review queue DONNA integration exists; guided operator defined in Sprint 754.',
  },

  {
    id: 'start_guided_player_profile',
    displayName: 'Start the player profile guided operator',
    description: 'DONNA walks the director through a player\'s profile, development status, and next recommended actions.',
    domain: 'players',
    safetyClass: 'safe_with_context',
    method: 'workflow_start',
    allowedRoles: ['academy_director'],
    requiresApproval: false,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Walk me through this player.',
      'Explain this player\'s status.',
      'What should I do for this player?',
      'Guide me through the profile.',
    ],
    pageGuard: ['/director/players/[playerId]'],
    blockedReason: null,
    implementationStatus: 'partially_wired',
    notes: 'Player intelligence exists; guided operator defined in Sprint 754.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 8 — DRAFT ACTIONS (draft_to_review)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'draft_attendance_exception',
    displayName: 'Draft an attendance exception',
    description: 'DONNA creates a proposed_actions row for an attendance exception. Director must approve in review queue.',
    domain: 'sessions',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Mark Marcus absent today.',
      'Record an attendance exception for session 4.',
      'Note that Sofia missed this session.',
    ],
    pageGuard: ['/director/sessions/[sessionId]', '/director/sessions'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'saveAttendanceExceptionDraftAction() exists. Approval required before official record update.',
  },

  {
    id: 'draft_session_plan',
    displayName: 'Draft a session plan',
    description: 'DONNA creates a draft session plan in proposed_actions. Director reviews before activating.',
    domain: 'sessions',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Draft a session plan for tomorrow.',
      'Plan Thursday\'s session.',
      'Create a session for Orange 2.',
    ],
    pageGuard: ['/director/sessions'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'saveSessionDraftAction() in donnaDraftExecutionActions.ts.',
  },

  {
    id: 'draft_class_template',
    displayName: 'Draft a class template',
    description: 'DONNA creates a draft class template via multi-turn guided flow. Director reviews before saving.',
    domain: 'templates',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director', 'head_coach'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Create a 60-minute warmup template.',
      'Build a baseline assessment template.',
      'Draft a tournament prep template.',
    ],
    pageGuard: ['/director/class-templates'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'TemplateDraftPanel + saveFitnessTemplateDraftAction() wired. Sprint 759: head_coach added — aligns with draft_to_review matrix row (DRAFT_ONLY for head_coach).',
  },

  {
    id: 'draft_coach_note',
    displayName: 'Draft a coach note for director review',
    description: 'DONNA creates a proposed coach note for a player. Director reviews and approves.',
    domain: 'players',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director', 'head_coach', 'coach'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Note that Marcus struggled with backhand today.',
      'Add a coaching observation for Sofia.',
      'Draft a note about this player.',
    ],
    pageGuard: ['/director/players/[playerId]', '/coach/sessions/[sessionId]'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'saveCoachNoteDraftAction() in donnaDraftExecutionActions.ts.',
  },

  {
    id: 'draft_parent_summary',
    displayName: 'Draft a parent progress update',
    description: 'DONNA creates a draft parent communication. Director approves before it can be sent.',
    domain: 'parents',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Draft a progress update for Marcus\'s parent.',
      'Prepare a parent summary.',
      'Create a parent report for Sofia.',
    ],
    pageGuard: ['/director/players/[playerId]', '/director/parents'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'saveParentUpdateDraftAction() in donnaDirectorIntelligenceActions.ts. Never auto-sent — requires director sign-off.',
  },

  {
    id: 'draft_player_advancement',
    displayName: 'Draft a player level advancement proposal',
    description: 'DONNA submits a voice_commands sentinel row + proposed_actions row. Director reviews in queue before any level change.',
    domain: 'players',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Advance eligible players.',
      'Propose a level change for Marcus.',
      'Submit an advancement proposal.',
    ],
    pageGuard: ['/director/players', '/director/level-up'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'submitDonnaActionDraft() wired in DonnaVoiceReadyShell. finalize_player_placement() is the only function that activates a player — never called by DONNA directly.',
  },

  {
    id: 'draft_curriculum_item',
    displayName: 'Draft a curriculum gate or exercise',
    description: 'DONNA creates a proposed curriculum item for director review. Not official until approved.',
    domain: 'curriculum',
    safetyClass: 'draft_to_review',
    method: 'draft_submit',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Add a backhand gate to Orange 2.',
      'Propose a new exercise for Red 1.',
      'Draft a curriculum change.',
    ],
    pageGuard: ['/director/curriculum', '/director/curriculum/builder'],
    blockedReason: null,
    implementationStatus: 'wired',
    notes: 'curriculumDraftProposalDonnaAnswer.ts + saveCurriculumAdjustmentDraftAction() wired.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 9 — DIRECTOR APPROVAL REQUIRED (director_approval)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'approve_review_item',
    displayName: 'Approve a review queue item',
    description: 'DONNA can EXPLAIN a review item and NAVIGATE to it. DONNA cannot execute the approval — director must click Approve.',
    domain: 'review_queue',
    safetyClass: 'director_approval',
    method: 'approval_gate',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Approve this session wrap-up.',
      'Approve Marcus\'s advancement.',
      'Accept this proposal.',
    ],
    pageGuard: ['/director/review'],
    blockedReason: 'DONNA cannot execute approval. The director must click Approve in the review queue. DONNA routes to /director/review.',
    implementationStatus: 'wired',
    notes: 'execute_approved_action() is the only function that executes approvals — never called by DONNA directly.',
  },

  {
    id: 'move_player_level',
    displayName: 'Move a player to a new curriculum level',
    description: 'DONNA can draft a level change proposal. The actual level move requires director approval via review queue and finalize_player_placement().',
    domain: 'players',
    safetyClass: 'director_approval',
    method: 'approval_gate',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Move Marcus to Orange 2.',
      'Advance Sofia to the next level.',
      'Change this player\'s level.',
    ],
    pageGuard: ['/director/players/[playerId]', '/director/level-up'],
    blockedReason: 'DONNA drafts the proposal but cannot move the player. finalize_player_placement() is the only path — director must approve in review queue first.',
    implementationStatus: 'partially_wired',
    notes: 'Draft path wired via submitDonnaActionDraft. Execution path requires director approval.',
  },

  {
    id: 'publish_curriculum',
    displayName: 'Publish curriculum changes as official',
    description: 'DONNA cannot publish curriculum directly. Proposals go to review queue; director must approve.',
    domain: 'curriculum',
    safetyClass: 'director_approval',
    method: 'approval_gate',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Publish the curriculum.',
      'Make this curriculum official.',
      'Activate the new curriculum.',
    ],
    pageGuard: ['/director/curriculum', '/director/curriculum/builder'],
    blockedReason: 'Curriculum is published only through the director\'s explicit confirmation in the curriculum builder or review queue. DONNA routes to the review queue.',
    implementationStatus: 'partially_wired',
    notes: 'Draft path exists; publish action requires director confirmation in UI.',
  },

  {
    id: 'invite_coach_or_parent',
    displayName: 'Send an invitation to a coach, parent, or player',
    description: 'DONNA can draft an invitation proposal. Sending is always director-approved.',
    domain: 'coaches',
    safetyClass: 'director_approval',
    method: 'approval_gate',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Invite coach Sarah.',
      'Send an invite to Marcus\'s parent.',
      'Invite a new player.',
    ],
    pageGuard: ['/director/coaches', '/director/parents', '/director/players'],
    blockedReason: 'Invitations require director review before sending. DONNA drafts the proposal and routes to review.',
    implementationStatus: 'pattern_exists',
    notes: 'Invitation system not yet fully built; blocking in DONNA until implemented.',
  },

  {
    id: 'finalize_assessment',
    displayName: 'Finalize a player assessment',
    description: 'DONNA can explain assessments and navigate to the assessment page. Finalization requires director action.',
    domain: 'players',
    safetyClass: 'director_approval',
    method: 'approval_gate',
    allowedRoles: ['academy_director'],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Finalize Marcus\'s assessment.',
      'Complete the placement review.',
      'Submit the assessment result.',
    ],
    pageGuard: ['/director/placement', '/director/players/[playerId]'],
    blockedReason: 'Assessment finalization requires director confirmation. DONNA navigates to the placement page.',
    implementationStatus: 'partially_wired',
    notes: 'Placement wizard at /director/placement. DONNA explains and routes; finalization is director-only action.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 10 — ALWAYS BLOCKED (always_blocked)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'send_parent_message_direct',
    displayName: 'Send a message to a parent directly',
    description: 'DONNA never sends communications directly. All parent messages are drafted and require explicit director approval before sending.',
    domain: 'parents',
    safetyClass: 'always_blocked',
    method: 'blocked_refusal',
    allowedRoles: [],
    requiresApproval: true,
    approvalRoute: '/director/review',
    naturalLanguageExamples: [
      'Send a message to Marcus\'s mom.',
      'Email Sofia\'s parent.',
      'Notify the parents.',
    ],
    pageGuard: [],
    blockedReason: 'DONNA never auto-sends messages. All communications must be drafted, reviewed, and explicitly approved by the director before sending.',
    implementationStatus: 'wired',
    notes: 'Hard block enforced in donnaRoleBoundaries.ts and donnaBoundaryResponses.ts.',
  },

  {
    id: 'delete_record',
    displayName: 'Delete or archive an official record',
    description: 'DONNA never deletes or archives records. This is always a director-only action via the UI.',
    domain: 'blocked',
    safetyClass: 'always_blocked',
    method: 'blocked_refusal',
    allowedRoles: [],
    requiresApproval: true,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Delete this player.',
      'Remove this session.',
      'Archive this coach.',
      'Delete the template.',
    ],
    pageGuard: [],
    blockedReason: 'Deletion and archival of records is always a human-only action. DONNA explains this and does not proceed.',
    implementationStatus: 'wired',
    notes: 'Hard block in donnaSafetyRegressionPrompts.ts. Category: direct_mutation_no_approval.',
  },

  {
    id: 'expose_raw_parent_player_notes',
    displayName: 'Expose raw coach notes or parent/player PII',
    description: 'DONNA never exposes raw confidential notes or personal data. Visibility is always role-gated and approval-gated.',
    domain: 'blocked',
    safetyClass: 'always_blocked',
    method: 'blocked_refusal',
    allowedRoles: [],
    requiresApproval: true,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me Marcus\'s private notes.',
      'What did the coach write about Sofia?',
      'Read out the parent\'s contact details.',
    ],
    pageGuard: [],
    blockedReason: 'Raw notes and personal data are never exposed by DONNA. Visibility follows role boundaries and requires director approval.',
    implementationStatus: 'wired',
    notes: 'Hard block in donnaSafetyRegressionPrompts.ts. Categories: parent_data_exposure, pii_extraction.',
  },

  {
    id: 'bypass_approval_queue',
    displayName: 'Execute an action that bypasses the review queue',
    description: 'DONNA never bypasses the proposed_actions review queue for any consequential action. This is an architecture invariant.',
    domain: 'blocked',
    safetyClass: 'always_blocked',
    method: 'blocked_refusal',
    allowedRoles: [],
    requiresApproval: true,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Just do it without asking.',
      'Skip the review.',
      'Apply this immediately.',
      'Make the change now.',
    ],
    pageGuard: [],
    blockedReason: 'The review queue is an architecture invariant. execute_approved_action() is the only function that executes approved actions. DONNA never calls it directly.',
    implementationStatus: 'wired',
    notes: 'Architecture invariant from AI_BACKEND_RULES.md. Hard block in every dispatch path.',
  },

  {
    id: 'cross_tenant_data_access',
    displayName: 'Access data from another academy',
    description: 'DONNA never accesses data outside the current academy_id scope.',
    domain: 'blocked',
    safetyClass: 'always_blocked',
    method: 'blocked_refusal',
    allowedRoles: [],
    requiresApproval: true,
    approvalRoute: null,
    naturalLanguageExamples: [
      'Show me data from another academy.',
      'Compare with a different academy.',
    ],
    pageGuard: [],
    blockedReason: 'All data access is scoped to academy_id. RLS enforces this at the database level. DONNA has no cross-tenant capability.',
    implementationStatus: 'wired',
    notes: 'RLS on all tables. donnaSafetyRegressionPrompts.ts: cross_tenant_access.',
  },

]

// ── Lookup utilities ──────────────────────────────────────────────────────────

export function getUIActionById(id: string): UIAction | undefined {
  return DONNA_UI_ACTIONS.find(a => a.id === id)
}

export function getUIActionsByDomain(domain: UIActionDomain): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.domain === domain)
}

export function getUIActionsByRole(role: UIActionRole): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.allowedRoles.includes(role))
}

export function getAlwaysSafeActions(): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.safetyClass === 'always_safe')
}

export function getAlwaysBlockedActions(): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.safetyClass === 'always_blocked')
}

export function getDraftToReviewActions(): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.safetyClass === 'draft_to_review')
}

export function getDirectorApprovalActions(): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a => a.safetyClass === 'director_approval')
}

export function getUIActionsForPage(route: string): UIAction[] {
  return DONNA_UI_ACTIONS.filter(a =>
    a.pageGuard.length === 0 ||
    a.pageGuard.some(guard => {
      // Simple pattern matching: exact match or parameterized match
      const pattern = guard.replace(/\[.*?\]/g, '[^/]+')
      return new RegExp(`^${pattern}$`).test(route)
    })
  )
}

export function canDonnaPerformUIAction(
  actionId: string,
  role: UIActionRole,
): { allowed: boolean; reason: string | null } {
  const action = getUIActionById(actionId)
  if (!action) return { allowed: false, reason: 'Action not found in UI action registry.' }
  if (action.safetyClass === 'always_blocked') {
    return { allowed: false, reason: action.blockedReason ?? 'This action is always blocked.' }
  }
  if (!action.allowedRoles.includes(role)) {
    return { allowed: false, reason: `This action is not available for the ${role} role.` }
  }
  return { allowed: true, reason: null }
}

// ── Coverage summary ──────────────────────────────────────────────────────────

export interface UIActionCoverageReport {
  totalActions: number
  bySafetyClass: Record<UIActionSafetyClass, number>
  byDomain: Record<string, number>
  wiredCount: number
  partiallyWiredCount: number
  patternOnlyCount: number
  notBuiltCount: number
  blockedCount: number
}

export function getUIActionCoverageReport(): UIActionCoverageReport {
  const bySafetyClass = {} as Record<UIActionSafetyClass, number>
  const byDomain = {} as Record<string, number>
  let wired = 0, partial = 0, patternOnly = 0, notBuilt = 0, blocked = 0

  for (const action of DONNA_UI_ACTIONS) {
    bySafetyClass[action.safetyClass] = (bySafetyClass[action.safetyClass] ?? 0) + 1
    byDomain[action.domain] = (byDomain[action.domain] ?? 0) + 1
    if (action.safetyClass === 'always_blocked') blocked++
    else if (action.implementationStatus === 'wired') wired++
    else if (action.implementationStatus === 'partially_wired') partial++
    else if (action.implementationStatus === 'pattern_exists') patternOnly++
    else notBuilt++
  }

  return {
    totalActions: DONNA_UI_ACTIONS.length,
    bySafetyClass,
    byDomain,
    wiredCount: wired,
    partiallyWiredCount: partial,
    patternOnlyCount: patternOnly,
    notBuiltCount: notBuilt,
    blockedCount: blocked,
  }
}

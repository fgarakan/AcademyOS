// DONNA Page Context Registry V1
// Authoritative map of every major director page: purpose, focus targets, safe actions, approval actions.
// Used by the operator action dispatcher to know what DONNA can do on each page.
// Pure TypeScript — no DB, no API, no mutations.

export type PageId =
  | 'dashboard'
  | 'attention_queue'
  | 'players'
  | 'player_profile'
  | 'assessments'
  | 'curriculum'
  | 'templates'
  | 'sessions'
  | 'review_center'
  | 'parent_updates'
  | 'settings'

export interface PageContextEntry {
  pageId: PageId
  pageName: string
  route: string
  /** Why this page exists — what the director is trying to accomplish here */
  pagePurpose: string
  /** The single most important action on this page */
  primaryAction: string
  /** Stable data-donna-focus-id target IDs on this page */
  focusTargets: Array<{
    id: string
    label: string
    description: string
  }>
  /** Actions DONNA can perform without approval */
  safeActions: string[]
  /** Actions that require director approval before taking effect */
  approvalActions: string[]
  /** Suggested DONNA prompts for this page */
  suggestedPrompts: string[]
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const PAGE_REGISTRY: PageContextEntry[] = [
  {
    pageId: 'dashboard',
    pageName: 'Director Dashboard',
    route: '/director',
    pagePurpose: 'Understand today\'s academy health at a glance. See what needs attention, what\'s pending approval, and where to focus first.',
    primaryAction: 'Review today\'s priority queue and decide what to act on first.',
    focusTargets: [
      { id: 'primary-action-hero', label: 'Priority Queue', description: 'Today\'s most urgent academy items' },
      { id: 'todays-kpi-section', label: 'KPI Dashboard', description: 'Academy health metrics' },
      { id: 'review-queue-card', label: 'Review Queue', description: 'Items waiting for director approval' },
    ],
    safeActions: ['highlight_element', 'scroll_to_element', 'navigate', 'explain_kpi'],
    approvalActions: ['approve_pending_items', 'send_parent_communication', 'activate_player'],
    suggestedPrompts: [
      'Who needs attention?',
      'What should I do first today?',
      'What is waiting for my approval?',
      'Show me academy health.',
    ],
  },
  {
    pageId: 'attention_queue',
    pageName: 'Attention Queue',
    route: '/director/attention',
    pagePurpose: 'See all players and situations that need director attention, ranked by priority and category.',
    primaryAction: 'Identify the highest-priority player or situation and navigate to it.',
    focusTargets: [
      { id: 'attention-filter-bar', label: 'Filter Bar', description: 'Filter attention items by category' },
      { id: 'attention-items-list', label: 'Attention Items', description: 'All items requiring director action' },
    ],
    safeActions: ['highlight_element', 'apply_filter', 'navigate', 'explain_item'],
    approvalActions: ['approve_placement', 'approve_level_readiness', 'approve_parent_update'],
    suggestedPrompts: [
      'Show me players needing reassessment.',
      'Show me level readiness candidates.',
      'Show me placement reviews.',
      'Why is this player in the queue?',
      'Take me to the most urgent item.',
    ],
  },
  {
    pageId: 'players',
    pageName: 'Player Directory',
    route: '/director/players',
    pagePurpose: 'Find players, understand their development status, and identify who needs attention.',
    primaryAction: 'Find a specific player or group of players and navigate to their profile.',
    focusTargets: [
      { id: 'player-directory-summary', label: 'Directory Summary', description: 'Overview of all players' },
      { id: 'player-filter-bar', label: 'Filter Bar', description: 'Search and filter players' },
      { id: 'player-list', label: 'Player List', description: 'All players in directory' },
      { id: 'players-missing-level', label: 'Missing Level Alert', description: 'Players without a curriculum level' },
      { id: 'add-player-button', label: 'Add Player', description: 'Start onboarding a new player' },
    ],
    safeActions: ['highlight_element', 'apply_search', 'apply_filter', 'navigate', 'open_player'],
    approvalActions: ['add_player', 'assign_level', 'initiate_placement'],
    suggestedPrompts: [
      'Show me players without a level.',
      'Find Jamie.',
      'Who is in Orange Ball 2?',
      'Show me players with missing assessments.',
    ],
  },
  {
    pageId: 'player_profile',
    pageName: 'Player Profile',
    route: '/director/players/[playerId]',
    pagePurpose: 'Understand a single player\'s full development profile: curriculum, evidence, readiness, priorities, assessments.',
    primaryAction: 'Understand the player\'s current state and decide the next development action.',
    focusTargets: [
      { id: 'player-profile-header', label: 'Player Header', description: 'Player name, level, and status' },
      { id: 'player-readiness-card', label: 'Level Readiness', description: 'Evidence-based readiness signal' },
      { id: 'player-priorities-card', label: 'Development Priorities', description: 'Top development priorities' },
      { id: 'player-assessments-section', label: 'Assessments', description: 'Assessment history and studio' },
      { id: 'player-active-priorities', label: 'Active Priorities', description: 'Current development priorities' },
      { id: 'player-evidence-hub', label: 'Evidence Hub', description: 'Development evidence records' },
    ],
    safeActions: ['highlight_element', 'scroll_to_element', 'open_tab', 'explain_readiness', 'explain_priorities'],
    approvalActions: ['initiate_level_readiness_review', 'draft_parent_update', 'assign_mission'],
    suggestedPrompts: [
      'Why is this player not ready to advance?',
      'What should they work on?',
      'Show me the evidence.',
      'Show me the readiness card.',
      'What are their top priorities?',
      'Prepare a level readiness review.',
    ],
  },
  {
    pageId: 'assessments',
    pageName: 'Assessments',
    route: '/director/players/[playerId]#assessments',
    pagePurpose: 'Run and review player assessments. Understand development priorities and level readiness from evidence.',
    primaryAction: 'Run an assessment or review existing evidence to inform development decisions.',
    focusTargets: [
      { id: 'player-assessments-section', label: 'Assessments Tab', description: 'Assessment studio and history' },
      { id: 'player-readiness-card', label: 'Readiness Signal', description: 'Current level readiness from evidence' },
      { id: 'player-priorities-card', label: 'Priorities', description: 'Top development priorities' },
    ],
    safeActions: ['highlight_element', 'scroll_to_element', 'explain_assessment_purpose'],
    approvalActions: ['submit_assessment', 'initiate_level_readiness_review'],
    suggestedPrompts: [
      'What assessment should I run?',
      'Why is this player close but not ready?',
      'Show me the readiness signal.',
      'Show me what evidence is missing.',
    ],
  },
  {
    pageId: 'curriculum',
    pageName: 'Curriculum',
    route: '/director/curriculum',
    pagePurpose: 'Review and improve the academy\'s curriculum structure, levels, gates, and content coverage.',
    primaryAction: 'Identify curriculum gaps and draft improvements for director approval.',
    focusTargets: [
      { id: 'curriculum-status', label: 'Curriculum Status', description: 'Overall curriculum health' },
      { id: 'curriculum-level-tree', label: 'Level Tree', description: 'All curriculum levels and stages' },
      { id: 'curriculum-spine-insight', label: 'Spine Insight', description: 'Curriculum spine coverage analysis' },
      { id: 'curriculum-review-draft', label: 'Review Draft', description: 'Draft changes for director approval' },
      { id: 'donna-curriculum-context', label: 'DONNA Analysis', description: 'DONNA curriculum improvement analysis' },
    ],
    safeActions: ['highlight_element', 'scroll_to_element', 'explain_level', 'show_gaps', 'navigate'],
    approvalActions: ['draft_curriculum_change', 'submit_curriculum_improvement', 'publish_curriculum_version'],
    suggestedPrompts: [
      'Help me improve Orange Ball 2.',
      'What are the curriculum gaps?',
      'Show me the level tree.',
      'What is missing in Red Ball?',
      'Draft a serve rhythm focus for Orange Ball 2.',
      'Show me the impact of this change.',
    ],
  },
  {
    pageId: 'templates',
    pageName: 'Class Templates',
    route: '/director/class-templates',
    pagePurpose: 'Create and manage session templates that coaches use for their sessions.',
    primaryAction: 'Create or update a class template for a specific level.',
    focusTargets: [
      { id: 'class-template-header', label: 'Template Header', description: 'Template name and status' },
    ],
    safeActions: ['highlight_element', 'navigate', 'explain_template'],
    approvalActions: ['create_template', 'publish_template'],
    suggestedPrompts: [
      'Help me create a template for Orange Ball 2.',
      'What templates are missing?',
      'Show me templates for Red Ball.',
    ],
  },
  {
    pageId: 'sessions',
    pageName: 'Sessions',
    route: '/director/sessions',
    pagePurpose: 'Review session history, check coach wrap-ups, and understand training delivery.',
    primaryAction: 'Review recent sessions and identify coaches who need follow-up.',
    focusTargets: [
      { id: 'session-list', label: 'Session List', description: 'All sessions' },
      { id: 'new-session-button', label: 'New Session', description: 'Create a new session' },
    ],
    safeActions: ['highlight_element', 'navigate', 'explain_session'],
    approvalActions: ['approve_wrap_up', 'create_session'],
    suggestedPrompts: [
      'Show me sessions missing wrap-ups.',
      'What did coaches do this week?',
      'Show me recent sessions.',
    ],
  },
  {
    pageId: 'review_center',
    pageName: 'Review Center',
    route: '/director/review',
    pagePurpose: 'Review and approve or reject all pending actions: assessments, placements, level changes, parent updates.',
    primaryAction: 'Process pending approvals so the system can execute them.',
    focusTargets: [
      { id: 'review-queue-primary', label: 'Review Queue', description: 'All pending items for director approval' },
      { id: 'attendance-exceptions-section', label: 'Attendance Exceptions', description: 'Attendance exception drafts' },
    ],
    safeActions: ['highlight_element', 'open_tab', 'navigate', 'explain_item'],
    approvalActions: ['approve_assessment', 'approve_placement', 'approve_level_change', 'approve_parent_update'],
    suggestedPrompts: [
      'Show me what needs my approval.',
      'Open the placement reviews.',
      'Open the level readiness reviews.',
      'What is the oldest pending item?',
    ],
  },
  {
    pageId: 'parent_updates',
    pageName: 'Parent Updates',
    route: '/director/parents',
    pagePurpose: 'Review and approve parent communications before they are sent.',
    primaryAction: 'Approve or reject parent update drafts.',
    focusTargets: [],
    safeActions: ['navigate', 'explain_update'],
    approvalActions: ['approve_parent_update', 'reject_parent_update'],
    suggestedPrompts: [
      'Show me pending parent updates.',
      'Draft a parent update for Jamie.',
    ],
  },
  {
    pageId: 'settings',
    pageName: 'Settings',
    route: '/director/settings',
    pagePurpose: 'Configure academy settings, permissions, and integrations.',
    primaryAction: 'Configure academy settings.',
    focusTargets: [],
    safeActions: ['navigate', 'explain_setting'],
    approvalActions: ['change_academy_setting'],
    suggestedPrompts: [
      'Show me academy settings.',
    ],
  },
]

// ─── Lookup functions ─────────────────────────────────────────────────────────

export function getPageContext(pageId: PageId): PageContextEntry | null {
  return PAGE_REGISTRY.find(p => p.pageId === pageId) ?? null
}

export function getPageContextByRoute(route: string): PageContextEntry | null {
  // Exact match first
  const exact = PAGE_REGISTRY.find(p => p.route === route)
  if (exact) return exact
  // Prefix match for parameterized routes
  return PAGE_REGISTRY.find(p => route.startsWith(p.route.replace('/[playerId]', '').replace('/[templateId]', ''))) ?? null
}

export function getFocusTargetsForPage(pageId: PageId): PageContextEntry['focusTargets'] {
  return getPageContext(pageId)?.focusTargets ?? []
}

export function getSuggestedPromptsForPage(pageId: PageId): string[] {
  return getPageContext(pageId)?.suggestedPrompts ?? []
}

export const ALL_PAGE_IDS: PageId[] = PAGE_REGISTRY.map(p => p.pageId)

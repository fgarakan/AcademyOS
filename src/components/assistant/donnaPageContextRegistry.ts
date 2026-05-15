// Donna Page Context Registry — local TypeScript only, no DB, no API.
// Tells Academy Assistant what page the director is on, what it's for,
// what it can safely draft, and what requires approval before anything changes.
//
// Used by DonnaAssistantButton to show the "Current context" card,
// populate route-aware voice prompt suggestions, and reason about what
// safe actions are available on the current screen.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DonnaPageContext {
  /** Pattern used to match this context (may include [paramName] segments) */
  routePattern: string
  /** Human-readable screen name shown in the context card */
  screenName: string
  /** The primary object type visible on this page */
  objectType: string
  /** What this page is for — used in "Explain this screen" mode */
  purpose: string
  /** What the director should do next — used in "Guide me" mode */
  nextAction: string
  /** Donna's natural-language intro shown in the context card */
  assistantIntro: string
  /** Structured data contexts Donna can read from this page */
  readableContext: string[]
  /** Things Donna can safely draft or propose (not yet official) */
  safeDraftActions: string[]
  /** Things that require explicit director approval before taking effect */
  approvalRequiredFor: string[]
  /** Short prompts shown as voice/text suggestions on this screen */
  suggestedPrompts: string[]
  /** Actions Donna must never do on this page without approval */
  unsafeActions: string[]
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PAGE_CONTEXT_REGISTRY: DonnaPageContext[] = [
  // ── Onboarding interview ──────────────────────────────────────────────────
  {
    routePattern: '/director/onboarding/interview',
    screenName: 'Academy Setup Assistant',
    objectType: 'onboarding_interview',
    purpose:
      'Answer one question at a time to help Academy OS understand how your academy works. Your answers shape curriculum, coaching structure, and communication.',
    nextAction: 'Complete the current question using the on-screen form.',
    assistantIntro:
      'You are building your academy identity. I can explain each question, but answers must be submitted using the on-screen form — I cannot answer on your behalf.',
    readableContext: ['onboarding_progress', 'interview_questions', 'director_profile'],
    safeDraftActions: ['explain_question', 'summarize_progress'],
    approvalRequiredFor: ['save_interview_answers'],
    suggestedPrompts: [
      'What is this page?',
      'Explain this question.',
      'What should I do next?',
    ],
    unsafeActions: ['skip_questions', 'auto_answer_questions'],
  },

  // ── Onboarding curriculum ─────────────────────────────────────────────────
  {
    routePattern: '/director/onboarding/curriculum',
    screenName: 'Curriculum Setup',
    objectType: 'curriculum_setup',
    purpose:
      'Approve or customize your curriculum spine so Academy OS can connect players to levels and generate curriculum-aligned sessions.',
    nextAction: 'Review the spine and click Approve to activate it.',
    assistantIntro:
      'You are approving your curriculum spine. Once approved, it connects players, levels, sessions, and templates throughout Academy OS.',
    readableContext: ['curriculum_spine', 'level_structure', 'onboarding_progress'],
    safeDraftActions: ['explain_curriculum_level', 'summarize_spine'],
    approvalRequiredFor: ['approve_curriculum', 'modify_curriculum_spine'],
    suggestedPrompts: [
      'What is this page?',
      'What should I do next?',
      'What happens when I approve this?',
    ],
    unsafeActions: ['auto_approve_curriculum', 'modify_spine_without_approval'],
  },

  // ── Onboarding (general) ─────────────────────────────────────────────────
  {
    routePattern: '/director/onboarding',
    screenName: 'Academy Onboarding',
    objectType: 'onboarding',
    purpose:
      'Set up the foundation of Academy OS — academy identity, curriculum spine, and coaching structure.',
    nextAction: 'Continue your next setup step using the Next Best Step card.',
    assistantIntro:
      'I can guide you through each setup step and explain what each section is for. Follow the checklist — each step unlocks the next.',
    readableContext: ['onboarding_progress', 'setup_steps', 'director_profile'],
    safeDraftActions: ['explain_step', 'summarize_progress'],
    approvalRequiredFor: ['save_setup_data'],
    suggestedPrompts: [
      'What should I do next?',
      'Take me to curriculum setup.',
      'What is this page?',
    ],
    unsafeActions: ['skip_onboarding_steps', 'auto_complete_setup'],
  },

  // ── Review Queue ──────────────────────────────────────────────────────────
  {
    routePattern: '/director/review',
    screenName: 'Review Queue',
    objectType: 'review_queue',
    purpose:
      'Review and approve coach wrap-ups, voice drafts, attendance exceptions, and lesson requests before they affect players, parents, or curriculum.',
    nextAction: 'Start with items marked Needs Approval.',
    assistantIntro:
      'I can explain any review item and describe the impact of approving or rejecting it. All decisions are yours — nothing applies until you approve.',
    readableContext: [
      'pending_approvals',
      'coach_wrap_ups',
      'voice_drafts',
      'attendance_exceptions',
      'lesson_requests',
      'review_item_details',
    ],
    safeDraftActions: ['explain_review_item', 'summarize_pending_items'],
    approvalRequiredFor: ['approve_review_item', 'reject_review_item', 'apply_approved_action'],
    suggestedPrompts: [
      'What needs approval?',
      'Explain this review item.',
      'Where should I start?',
    ],
    unsafeActions: ['auto_approve_items', 'reject_without_review'],
  },

  // ── Curriculum ────────────────────────────────────────────────────────────
  {
    routePattern: '/director/curriculum',
    screenName: 'Curriculum',
    objectType: 'curriculum',
    purpose:
      "View and manage your academy's development spine — levels, drills, requirements, and their connections to players and templates.",
    nextAction: 'Review your spine or open the Curriculum Builder to customize it.',
    assistantIntro:
      'I can explain any curriculum level, show how it connects to templates and players, or help you start building a class template from this level.',
    readableContext: [
      'curriculum_levels',
      'curriculum_drills',
      'curriculum_spine',
      'level_connections',
      'player_level_distribution',
    ],
    safeDraftActions: [
      'create_class_template_draft',
      'explain_curriculum_level',
      'summarize_level_requirements',
    ],
    approvalRequiredFor: ['modify_curriculum_spine', 'publish_curriculum_changes'],
    suggestedPrompts: [
      'Create a template from this curriculum level.',
      'Help me build an Orange 2 class template.',
      'Explain how curriculum connects to templates.',
    ],
    unsafeActions: [
      'auto_modify_curriculum',
      'change_level_structure_without_approval',
    ],
  },

  // ── Class Template Detail ─────────────────────────────────────────────────
  {
    routePattern: '/director/class-templates/[templateId]',
    screenName: 'Class Template Detail',
    objectType: 'class_template',
    purpose:
      'Review and manage a specific class template — its blocks, curriculum connection, and session generation.',
    nextAction: 'Assign a curriculum level or generate a session from this template.',
    assistantIntro:
      'I can explain this template and how its blocks connect to curriculum. Generating a session or saving changes requires your approval.',
    readableContext: [
      'template_details',
      'template_blocks',
      'curriculum_connection',
      'session_history',
      'block_exercises',
    ],
    safeDraftActions: ['explain_template_structure', 'create_session_draft'],
    approvalRequiredFor: [
      'save_template_changes',
      'generate_session',
      'assign_curriculum_level',
    ],
    suggestedPrompts: [
      'Explain this template.',
      'How does this connect to curriculum?',
      'Help me generate a session from this.',
    ],
    unsafeActions: ['auto_save_template', 'auto_generate_session'],
  },

  // ── Class Templates List ──────────────────────────────────────────────────
  {
    routePattern: '/director/class-templates',
    screenName: 'Class Templates',
    objectType: 'class_template_collection',
    purpose:
      'Manage reusable class blueprints that help coaches run consistent, curriculum-aligned sessions.',
    nextAction: 'Create a template or assign a curriculum level to an existing one.',
    assistantIntro:
      'I can guide you through creating a class template step-by-step. Nothing is saved until you approve it.',
    readableContext: [
      'class_templates',
      'template_blocks',
      'curriculum_links',
      'session_generation_status',
    ],
    safeDraftActions: ['create_class_template_draft', 'recommend_template_for_group'],
    approvalRequiredFor: ['save_template', 'publish_session'],
    suggestedPrompts: [
      'Help me create a class template.',
      'Explain how templates connect to sessions.',
      'Recommend a template structure.',
    ],
    unsafeActions: ['save_template_without_approval'],
  },

  // ── Fitness Template Detail ───────────────────────────────────────────────
  {
    routePattern: '/director/fitness/templates/[templateId]',
    screenName: 'Fitness Template Detail',
    objectType: 'fitness_template',
    purpose:
      'Review and manage a specific fitness template — its exercise blocks, intensity, and physical training goals.',
    nextAction: 'Add exercises to blocks or review the template structure.',
    assistantIntro:
      'I can explain this fitness template and its blocks. I can define a fitness template draft contract, but the guided save flow is not wired yet — use the on-screen controls.',
    readableContext: [
      'fitness_template_details',
      'exercise_blocks',
      'intensity_tags',
      'physical_pathway',
      'exercise_library',
    ],
    safeDraftActions: ['explain_fitness_template', 'suggest_fitness_focus'],
    approvalRequiredFor: ['save_fitness_template', 'assign_fitness_homework'],
    suggestedPrompts: [
      'Explain this fitness template.',
      'What exercises are in this template?',
      'Suggest a fitness focus for this block.',
    ],
    unsafeActions: ['auto_assign_training', 'auto_save_template'],
  },

  // ── Fitness Templates List ────────────────────────────────────────────────
  {
    routePattern: '/director/fitness/templates',
    screenName: 'Fitness Templates',
    objectType: 'fitness_template_collection',
    purpose:
      'Manage reusable physical training blueprints for mobility, strength, speed, coordination, recovery, and tennis transfer.',
    nextAction: 'Create a fitness template or assign exercises to an existing one.',
    assistantIntro:
      'I can help you describe a fitness template. I can define the draft contract for this, but the guided save flow is not wired yet — saving still requires the on-screen controls.',
    readableContext: [
      'fitness_templates',
      'fitness_blocks',
      'intensity_tags',
      'physical_pathway',
      'exercise_library',
    ],
    safeDraftActions: ['create_fitness_template_draft', 'suggest_fitness_focus'],
    approvalRequiredFor: ['save_fitness_template', 'assign_fitness_homework'],
    suggestedPrompts: [
      'Help me create a fitness template.',
      'Explain what this template is for.',
      'Suggest a fitness focus.',
    ],
    unsafeActions: ['assign_training_without_approval'],
  },

  // ── Sessions List ─────────────────────────────────────────────────────────
  {
    routePattern: '/director/sessions',
    screenName: 'Sessions',
    objectType: 'session_collection',
    purpose:
      'View all sessions, track completion status, and review or create sessions generated from templates.',
    nextAction: 'Review this week\'s sessions or create a new session from a template.',
    assistantIntro:
      'I can explain sessions and how they connect to templates and curriculum. Session creation is not wired in the assistant yet — use the New Session button on screen.',
    readableContext: [
      'sessions',
      'session_status',
      'coach_assignments',
      'group_assignments',
      'template_connections',
    ],
    safeDraftActions: ['explain_session_status', 'create_session_draft'],
    approvalRequiredFor: ['create_session', 'cancel_session', 'reschedule_session'],
    suggestedPrompts: [
      'What sessions are happening this week?',
      'Explain how sessions connect to templates.',
      'What should I do next?',
    ],
    unsafeActions: ['auto_create_session', 'cancel_session_without_approval'],
  },

  // ── Session Detail ────────────────────────────────────────────────────────
  {
    routePattern: '/director/sessions/[sessionId]',
    screenName: 'Director Session Plan',
    objectType: 'session',
    purpose:
      'Review and finalise the plan for a single session — blocks, curriculum focus, coach briefing, roster intelligence, and adaptive suggestions. The pre-session command screen.',
    nextAction: 'Ask DONNA to draft a coach brief or identify what is missing before the session starts.',
    assistantIntro:
      'I can help you draft a coach brief, summarise what is planned for this session, flag what is missing, or identify risks before the session starts. Anything I produce needs your review before it leaves this screen.',
    readableContext: [
      'session',
      'session_blocks',
      'session_status',
      'coach_assignment',
      'template_connection',
      'player_roster',
      'curriculum_focus',
      'adaptive_suggestions',
      'coach_notes',
    ],
    safeDraftActions: [
      'draft_coach_brief',
      'summarize_session_plan',
      'identify_missing_blocks',
      'show_session_risks',
    ],
    approvalRequiredFor: [
      'publish_session_plan',
      'send_coach_brief',
      'update_session_blocks',
      'official_session_status_change',
    ],
    suggestedPrompts: [
      'Draft a coach brief for this session.',
      'What is missing from this session plan?',
      'Summarise this session for the coach.',
      'What should I review before this session?',
    ],
    unsafeActions: [
      'auto_send_coach_brief',
      'auto_modify_session_plan',
      'auto_publish_session',
      'auto_change_roster',
    ],
  },

  // ── Player Profile ────────────────────────────────────────────────────────
  {
    routePattern: '/director/players/[playerId]',
    screenName: 'Player Profile',
    objectType: 'player',
    purpose:
      "Review this player's development level, active priorities, coach notes, attendance, curriculum progress, and next recommended actions.",
    nextAction: "Review this player's next recommended action in the action summary card.",
    assistantIntro:
      'I can help summarize this player, draft a note, or prepare a parent-safe update. Anything official requires your approval before it takes effect.',
    readableContext: [
      'player_profile',
      'current_level',
      'active_priorities',
      'coach_notes',
      'attendance_summary',
      'curriculum_connection',
      'parent_safe_summary',
      'assessment_history',
      'gate_evidence',
    ],
    safeDraftActions: [
      'draft_player_note',
      'draft_parent_update',
      'draft_level_readiness_review',
      'summarize_player_progress',
    ],
    approvalRequiredFor: ['save_player_note', 'send_parent_update', 'move_player_level'],
    suggestedPrompts: [
      'Summarize this player.',
      'What needs attention?',
      'Draft a parent-safe update.',
    ],
    unsafeActions: ['send_message_without_approval', 'change_level_without_approval'],
  },

  // ── Players List ──────────────────────────────────────────────────────────
  {
    routePattern: '/director/players',
    screenName: 'Players',
    objectType: 'player_collection',
    purpose:
      'Review the full player directory — development levels, priorities, placement status, and players needing attention.',
    nextAction: 'Review players needing attention or add a new player.',
    assistantIntro:
      'I can help you find players needing attention, summarize the directory, or navigate to a specific player profile.',
    readableContext: [
      'player_directory',
      'player_statuses',
      'curriculum_levels',
      'placement_queue',
      'attention_flags',
    ],
    safeDraftActions: ['summarize_player_directory', 'flag_players_needing_attention'],
    approvalRequiredFor: ['move_player_level', 'change_player_status'],
    suggestedPrompts: [
      'Which players need attention?',
      'Find players missing a curriculum level.',
      'Summarize the player directory.',
    ],
    unsafeActions: ['auto_move_players', 'change_status_without_approval'],
  },

  // ── Signals ───────────────────────────────────────────────────────────────
  {
    routePattern: '/director/signals',
    screenName: 'Signals',
    objectType: 'signal_collection',
    purpose:
      'Review academy-wide signals — attendance concerns, curriculum gaps, players needing attention, coach wrap-up alerts, and AI suggestions.',
    nextAction: 'Start with the highest-urgency signals.',
    assistantIntro:
      'I can explain any signal and suggest what to do about it. Acting on a signal — such as contacting a parent or moving a player — requires your approval.',
    readableContext: [
      'attendance_signals',
      'curriculum_gap_signals',
      'player_attention_signals',
      'ai_suggestions',
      'pending_requests',
      'wrap_up_alerts',
    ],
    safeDraftActions: ['explain_signal', 'summarize_academy_signals', 'draft_next_steps'],
    approvalRequiredFor: ['act_on_signal', 'approve_ai_suggestion', 'send_alert'],
    suggestedPrompts: [
      'What should I look at first?',
      'Explain the most urgent signal.',
      'Summarize what needs attention.',
    ],
    unsafeActions: ['auto_act_on_signals', 'send_alerts_without_approval'],
  },

  // ── Coach Recap ───────────────────────────────────────────────────────────────
  {
    routePattern: '/coach/recap',
    screenName: 'Coach Recap',
    objectType: 'session_recap',
    purpose:
      'Guide the coach through a 6-question session recap. Answers are captured as a draft — nothing is official until the director reviews and approves.',
    nextAction: 'Complete all 6 questions and submit for director review.',
    assistantIntro:
      'I can help you structure your recap. Answer each question in your own words — I will help turn it into a clean draft for the director to review. Nothing is saved officially until approval.',
    readableContext: [
      'recap_answers',
      'session_context',
      'attendance_flags',
      'player_observations',
    ],
    safeDraftActions: [
      'structure_recap_draft',
      'suggest_attendance_note',
      'capture_player_observation',
    ],
    approvalRequiredFor: [
      'official_attendance_write',
      'player_note_submission',
      'parent_update_send',
    ],
    suggestedPrompts: [
      'Help me finish this recap.',
      'Structure my attendance note.',
      'What should I include in my follow-up?',
    ],
    unsafeActions: [
      'auto_write_attendance',
      'auto_update_player_profile',
      'auto_send_parent_message',
    ],
  },

  // ── Parent Communication Center ──────────────────────────────────────────────
  {
    routePattern: '/director/parents',
    screenName: 'Parent Communication Center',
    objectType: 'parent_communications',
    purpose:
      'Review, approve, and manage parent-safe updates drafted by DONNA from coach recaps. Nothing is sent without explicit director approval.',
    nextAction: 'Review drafts waiting for approval or ask DONNA to draft an update.',
    assistantIntro:
      "I can identify players who need a parent update, draft parent-safe content, and show you what is waiting for approval. I never send anything — that's your call.",
    readableContext: [
      'parent_updates',
      'update_status',
      'player_names',
      'approved_updates',
      'pending_drafts',
    ],
    safeDraftActions: [
      'draft_parent_update',
      'summarize_parent_safe_progress',
      'show_pending_parent_drafts',
    ],
    approvalRequiredFor: [
      'send_parent_message',
      'publish_parent_update',
    ],
    suggestedPrompts: [
      'Who needs a parent update?',
      'Draft a parent-safe update.',
      'Show pending parent drafts.',
      'What updates are waiting for approval?',
    ],
    unsafeActions: [
      'auto_send_parent_message',
      'expose_internal_notes',
      'send_without_director_approval',
    ],
  },

  // ── Level Up Review ──────────────────────────────────────────────────────────
  {
    routePattern: '/director/level-up',
    screenName: 'Level Up Review',
    objectType: 'level_readiness_pipeline',
    purpose:
      'Review evidence-based readiness for player level movement. All level changes require director approval and go through the proposed_actions pipeline.',
    nextAction: 'Ask DONNA who is overdue for assessment or needs an evidence review.',
    assistantIntro:
      'I can summarise the readiness pipeline, identify players with missing evidence, and help you prepare a level movement proposal for your approval. I never move a player automatically.',
    readableContext: [
      'reassessment_pipeline',
      'player_urgency',
      'assessment_scores',
      'days_overdue',
      'coach_assignments',
      'group_assignments',
    ],
    safeDraftActions: [
      'review_level_readiness',
      'summarize_readiness_pipeline',
      'identify_missing_evidence',
      'show_overdue_players',
    ],
    approvalRequiredFor: [
      'player_level_movement',
      'publish_readiness_decision',
      'parent_notification',
    ],
    suggestedPrompts: [
      'Who is ready for level review?',
      'What evidence is missing?',
      "Summarize this player's readiness.",
      'Who is overdue for assessment?',
    ],
    unsafeActions: [
      'auto_promote_player',
      'auto_change_level',
      'auto_notify_parent',
    ],
  },

  // ── Today's Academy ──────────────────────────────────────────────────────────
  {
    routePattern: '/director/today',
    screenName: "Today's Academy",
    objectType: 'today_overview',
    purpose:
      "See everything happening today — sessions on court, what needs attention, and what needs your approval. The morning anchor screen.",
    nextAction: 'Ask DONNA for your daily brief or open the review queue.',
    assistantIntro:
      "I can see today's sessions, what needs your attention, and your pending review items. Ask me for your daily brief, to check what needs approval, or to log an attendance exception.",
    readableContext: [
      'todays_sessions',
      'session_block_status',
      'pending_reviews',
      'attention_flags',
      'coach_assignments',
      'risk_flags',
    ],
    safeDraftActions: [
      'what_needs_attention',
      'daily_brief',
      'attendance_exception_draft',
      'capture_coach_note',
      'show_review_queue',
    ],
    approvalRequiredFor: [
      'session_status_change',
      'official_attendance_write',
      'session_creation',
    ],
    suggestedPrompts: [
      "What needs my attention today?",
      "Give me my daily brief.",
      "Log an attendance exception.",
      "What needs approval?",
    ],
    unsafeActions: [
      'auto_update_session_status',
      'bulk_attendance_write',
      'auto_session_creation',
    ],
  },

  // ── Dashboard — registered last so /director prefix doesn't shadow other routes ──
  {
    routePattern: '/director',
    screenName: 'Dashboard',
    objectType: 'academy_overview',
    purpose:
      'See what needs attention across the academy — setup progress, players, sessions, review items, and signals all in one view.',
    nextAction: 'Review what needs attention.',
    assistantIntro:
      'This is your academy command center. I can brief you on what needs attention, help you create templates, or guide you to any section.',
    readableContext: [
      'academy_status',
      'setup_progress',
      'review_items',
      'signals',
      'recent_activity',
      'player_counts',
      'session_counts',
    ],
    safeDraftActions: [
      'summarize_academy_status',
      'draft_next_steps',
      'create_class_template_draft',
    ],
    approvalRequiredFor: ['publish_changes', 'send_messages'],
    suggestedPrompts: [
      'What needs attention today?',
      'Help me create a class template.',
      'Brief me on what needs attention.',
    ],
    unsafeActions: ['change_records_without_approval', 'send_messages_without_approval'],
  },
]

// ---------------------------------------------------------------------------
// Fallback context — returned when no registered route matches
// ---------------------------------------------------------------------------

const FALLBACK_CONTEXT: DonnaPageContext = {
  routePattern: '*',
  screenName: 'Academy OS',
  objectType: 'unknown',
  purpose: 'Use this assistant to guide setup, find pages, or capture a note.',
  nextAction: 'Ask what to do next.',
  assistantIntro:
    'I can guide you through Academy OS, navigate to any section, or capture a note.',
  readableContext: [],
  safeDraftActions: [],
  approvalRequiredFor: [],
  suggestedPrompts: ['What should I do next?', 'Show me what needs attention.'],
  unsafeActions: [],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a routePattern like /director/players/[playerId] to a matching
 * prefix /director/players/ (strips the dynamic segment).
 */
function patternToMatchPrefix(pattern: string): string {
  const bracketIdx = pattern.indexOf('[')
  return bracketIdx === -1 ? pattern : pattern.slice(0, bracketIdx)
}

/**
 * Resolve the best-matching page context for a given pathname.
 *
 * Resolution order:
 *   1. Exact match against routePattern
 *   2. Prefix match using derived prefix (longest wins)
 *   3. FALLBACK_CONTEXT
 */
export function resolvePageContext(pathname: string): DonnaPageContext {
  // 1. Exact match
  const exact = PAGE_CONTEXT_REGISTRY.find(c => c.routePattern === pathname)
  if (exact) return exact

  // 2. Prefix match — derive match prefix from each pattern, take the longest
  const withPrefixes = PAGE_CONTEXT_REGISTRY.map(c => ({
    context: c,
    prefix: patternToMatchPrefix(c.routePattern),
  }))

  const prefixMatch = withPrefixes
    .filter(({ prefix }) => pathname.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]

  return prefixMatch?.context ?? FALLBACK_CONTEXT
}

/**
 * Utility — look up a context directly by routePattern (for testing or
 * contract lookups where the exact pattern is known).
 */
export function getContextByPattern(
  pattern: string,
): DonnaPageContext | undefined {
  return PAGE_CONTEXT_REGISTRY.find(c => c.routePattern === pattern)
}

export { PAGE_CONTEXT_REGISTRY, FALLBACK_CONTEXT }

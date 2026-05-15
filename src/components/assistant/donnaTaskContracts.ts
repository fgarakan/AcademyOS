// Donna Task Contract Registry — local TypeScript only, no DB, no API.
// Defines what Donna needs to collect, what it reads, and what approval
// path is required for each major task type.
//
// saveApplyMethodStatus:
//   "wired"         — the save/apply server action is built and connected
//   "not_wired_yet" — the contract is defined; the guided save flow is not wired
//
// This sprint defines the contracts.
// Guided flows for tasks marked "not_wired_yet" are built in future sprints.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaTaskId =
  | 'create_class_template'
  | 'create_fitness_template'
  | 'create_session'
  | 'populate_session_from_template'
  | 'capture_coach_note'
  | 'draft_parent_update'
  | 'draft_player_note'
  | 'review_level_readiness'
  | 'handle_attendance_exception'
  | 'adjust_curriculum'
  | 'draft_coach_communication'
  | 'create_group'
  | 'assign_player_to_group'
  | 'summarize_player_progress'
  | 'recommend_template_for_group'

export interface DonnaTaskField {
  fieldId: string
  label: string
  required: boolean
  example?: string
}

export interface DonnaTaskQuestion {
  order: number
  fieldId: string
  question: string
}

export interface DonnaTaskContract {
  taskId: DonnaTaskId
  label: string
  description: string
  requiredFields: DonnaTaskField[]
  optionalFields: DonnaTaskField[]
  questionSequence: DonnaTaskQuestion[]
  /** Object types Donna reads to complete this task */
  reads: string[]
  /** The draft type this task produces before saving */
  createsDraftType: string
  approvalRequired: boolean
  unsafeWithoutApproval: string[]
  saveApplyMethodStatus: 'wired' | 'not_wired_yet'
}

// ---------------------------------------------------------------------------
// Task Contracts
// ---------------------------------------------------------------------------

export const DONNA_TASK_CONTRACTS: Record<DonnaTaskId, DonnaTaskContract> = {

  create_class_template: {
    taskId: 'create_class_template',
    label: 'Create Class Template',
    description:
      'Guide the director through creating a reusable, curriculum-aligned class template. Collects level, duration, and focus area — generates a deterministic draft preview. Nothing saves until director approves on screen.',
    requiredFields: [
      { fieldId: 'level',           label: 'Level / Group',       required: true,  example: 'Orange 2' },
      { fieldId: 'durationMinutes', label: 'Duration (minutes)',  required: true,  example: '90' },
      { fieldId: 'focusAreas',      label: 'Focus Area',          required: true,  example: 'forehand prep' },
    ],
    optionalFields: [
      { fieldId: 'style',              label: 'Style',               required: false, example: 'competitive' },
      { fieldId: 'intensity',          label: 'Intensity',           required: false, example: 'high' },
      { fieldId: 'playerCount',        label: 'Player Count',        required: false, example: '6' },
      { fieldId: 'constraints',        label: 'Constraints',         required: false },
      { fieldId: 'template_name',      label: 'Template Name',       required: false, example: 'Orange 2 — Forehand Focus' },
      { fieldId: 'coach_instructions', label: 'Coach Instructions',  required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'level',           question: 'What level is this class template for? (e.g. Orange 2, Red 1, Yellow 3)' },
      { order: 2, fieldId: 'durationMinutes', question: 'How long is the class? (e.g. 60 minutes, 90 minutes)' },
      { order: 3, fieldId: 'focusAreas',      question: "What's the main focus area? (e.g. forehand prep, serve and return, footwork and movement)" },
      { order: 4, fieldId: 'style',           question: 'Any style preference? (e.g. competitive, technical, balanced — or skip this)' },
    ],
    reads: ['curriculum', 'class_template'],
    createsDraftType: 'class_template_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['save_template', 'publish_session'],
    saveApplyMethodStatus: 'wired',
  },

  create_fitness_template: {
    taskId: 'create_fitness_template',
    label: 'Create Fitness Template',
    description:
      'Guide the director through creating a physical training template with blocks for mobility, strength, speed, coordination, recovery, or tennis transfer.',
    requiredFields: [
      { fieldId: 'target_level_or_group', label: 'Target Level or Group',  required: true,  example: 'Orange 2 group' },
      { fieldId: 'training_goal',         label: 'Training Goal',           required: true,  example: 'Speed and agility' },
      { fieldId: 'duration',              label: 'Session Duration',        required: true,  example: '45 minutes' },
      { fieldId: 'block_categories',      label: 'Block Categories',        required: true,  example: 'Mobility, Speed, Tennis Transfer' },
      { fieldId: 'intensity',             label: 'Intensity Level',         required: true,  example: 'Moderate' },
      { fieldId: 'tennis_transfer_focus', label: 'Tennis Transfer Focus',   required: true,  example: 'Lateral movement for baseline rallying' },
    ],
    optionalFields: [
      { fieldId: 'coach_cues',        label: 'Coach Cues',        required: false },
      { fieldId: 'modifications',     label: 'Modifications',     required: false },
      { fieldId: 'recovery_notes',    label: 'Recovery Notes',    required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'target_level_or_group', question: 'Who is this fitness template for? (e.g. Orange 2 group, all Red Ball players)' },
      { order: 2, fieldId: 'training_goal',         question: 'What is the training goal? (e.g. speed, agility, coordination, recovery)' },
      { order: 3, fieldId: 'duration',              question: 'How long is the session? (e.g. 45 minutes)' },
      { order: 4, fieldId: 'block_categories',      question: 'What physical blocks should be included? (e.g. mobility, speed, strength, tennis transfer)' },
      { order: 5, fieldId: 'intensity',             question: 'What intensity should this be? (e.g. low, moderate, high)' },
      { order: 6, fieldId: 'tennis_transfer_focus', question: 'What tennis-transfer focus should it support? (e.g. lateral movement, split-step timing, first-strike footwork)' },
    ],
    reads: ['fitness_template', 'group', 'player_profile', 'assessment'],
    createsDraftType: 'fitness_template_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['save_fitness_template', 'assign_fitness_homework'],
    saveApplyMethodStatus: 'wired',
  },

  populate_session_from_template: {
    taskId: 'populate_session_from_template',
    label: 'Populate Session Blocks',
    description:
      'Copy blocks from a template into an existing planned session shell. Returns a local coach brief draft for director review. Nothing is sent to the coach automatically.',
    requiredFields: [
      { fieldId: 'session', label: 'Session', required: true, example: 'Orange 2 — 2026-05-20' },
    ],
    optionalFields: [
      { fieldId: 'template',           label: 'Template Override',  required: false, example: 'Orange 2 — Skills + Match' },
      { fieldId: 'coach_brief_focus',  label: 'Coach Brief Focus',  required: false, example: 'Focus on net approach today' },
      { fieldId: 'modifications',      label: 'Modifications',      required: false, example: 'Skip point play — extra match time' },
    ],
    questionSequence: [
      { order: 1, fieldId: 'session',          question: 'Which session should I populate with blocks?' },
      { order: 2, fieldId: 'template',         question: 'Which template should I use? (Leave blank to use the template already linked to this session)' },
      { order: 3, fieldId: 'coach_brief_focus', question: 'Any specific focus for the coach brief? (optional)' },
    ],
    reads: ['session', 'class_template', 'fitness_template', 'template_blocks'],
    createsDraftType: 'session_block_population_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['copy_blocks_without_review', 'notify_coach'],
    saveApplyMethodStatus: 'wired',
  },

  create_session: {
    taskId: 'create_session',
    label: 'Create Session',
    description:
      'Guide the director through creating a new planned session assigned to a coach and group. A template can be linked; blocks are populated separately.',
    requiredFields: [
      { fieldId: 'date',        label: 'Session Date',      required: true,  example: 'Monday 19 May' },
      { fieldId: 'coach',       label: 'Assigned Coach',    required: true,  example: 'Coach Sarah' },
      { fieldId: 'group',       label: 'Assigned Group',    required: true,  example: 'Orange Ball Group A' },
    ],
    optionalFields: [
      { fieldId: 'template',    label: 'Template',          required: false, example: 'Orange 2 — Skills + Match' },
      { fieldId: 'session_goal', label: 'Session Goal',     required: false },
      { fieldId: 'special_notes', label: 'Special Notes',   required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'group',       question: 'Which group is this session for?' },
      { order: 2, fieldId: 'coach',       question: 'Which coach will run this session?' },
      { order: 3, fieldId: 'date',        question: 'When is this session scheduled? (e.g. "Tuesday May 20" or "2026-05-20")' },
      { order: 4, fieldId: 'template',    question: 'Which template should this session use? (optional — you can skip this and assign later)' },
    ],
    reads: ['class_template', 'fitness_template', 'group', 'session'],
    createsDraftType: 'session_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['create_session', 'send_session_plan_to_coach'],
    saveApplyMethodStatus: 'wired',
  },

  capture_coach_note: {
    taskId: 'capture_coach_note',
    label: 'Capture Coach Note',
    description:
      'Help the director capture a structured observation about a player — what was seen, context, and whether it should inform curriculum or parent communication.',
    requiredFields: [
      { fieldId: 'player',      label: 'Player',           required: true,  example: 'Lucas M.' },
      { fieldId: 'observation', label: 'Observation',      required: true,  example: 'Struggled to close the net today' },
    ],
    optionalFields: [
      { fieldId: 'session_context', label: 'Session Context',   required: false },
      { fieldId: 'priority_link',   label: 'Links to Priority', required: false },
      { fieldId: 'parent_note',     label: 'Parent Note',       required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player',          question: 'Which player is this note about?' },
      { order: 2, fieldId: 'observation',     question: 'What did you observe?' },
      { order: 3, fieldId: 'priority_link',   question: 'Does this connect to an active priority for this player?' },
      { order: 4, fieldId: 'session_context', question: 'Which session was this from? (optional — leave blank if not session-specific)' },
    ],
    reads: ['player_profile', 'coach_note', 'session'],
    createsDraftType: 'coach_note_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['save_player_note_without_review', 'expose_note_to_parent'],
    saveApplyMethodStatus: 'wired',
  },

  draft_parent_update: {
    taskId: 'draft_parent_update',
    label: 'Draft Parent Update',
    description:
      'Help the director compose a parent-safe progress update for a specific player — grounded in approved evidence, not raw coach notes.',
    requiredFields: [
      { fieldId: 'player',          label: 'Player',           required: true },
      { fieldId: 'update_focus',    label: 'Update Focus',     required: true, example: 'Current focus, progress, and next steps' },
    ],
    optionalFields: [
      { fieldId: 'tone',            label: 'Tone',             required: false, example: 'Encouraging' },
      { fieldId: 'include_context', label: 'Include Context',  required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player',       question: 'Which player is this update for?' },
      { order: 2, fieldId: 'update_focus', question: 'What should this update focus on? (e.g. recent progress, upcoming focus, general encouragement)' },
    ],
    reads: ['player_profile', 'coach_note', 'attendance', 'assessment', 'player_summary'],
    createsDraftType: 'parent_update_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['send_parent_message_without_approval', 'expose_raw_coach_notes'],
    saveApplyMethodStatus: 'wired',
  },

  draft_player_note: {
    taskId: 'draft_player_note',
    label: 'Draft Player Note',
    description:
      'Help the director create a structured development note for a player — safe for the player to eventually see, curriculum-grounded.',
    requiredFields: [
      { fieldId: 'player',     label: 'Player',      required: true },
      { fieldId: 'note_focus', label: 'Note Focus',  required: true, example: 'What to work on this week' },
    ],
    optionalFields: [
      { fieldId: 'curriculum_link',  label: 'Curriculum Link', required: false },
      { fieldId: 'player_friendly',  label: 'Player-Friendly Language', required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player',     question: 'Which player is this note for?' },
      { order: 2, fieldId: 'note_focus', question: 'What should this note focus on?' },
    ],
    reads: ['player_profile', 'curriculum', 'coach_note', 'assessment'],
    createsDraftType: 'player_note_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['save_note_without_review', 'expose_to_player_without_approval'],
    saveApplyMethodStatus: 'wired',
  },

  review_level_readiness: {
    taskId: 'review_level_readiness',
    label: 'Review Level Readiness',
    description:
      'Help the director assess whether a player is ready to advance to the next curriculum level — based on gate evidence, assessment, and coach observations.',
    requiredFields: [
      { fieldId: 'player',        label: 'Player',            required: true },
      { fieldId: 'current_level', label: 'Current Level',     required: true },
      { fieldId: 'next_level',    label: 'Target Next Level', required: true },
    ],
    optionalFields: [
      { fieldId: 'gate_evidence', label: 'Gate Evidence',     required: false },
      { fieldId: 'coach_context', label: 'Coach Context',     required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player',        question: 'Which player are you reviewing for level readiness?' },
      { order: 2, fieldId: 'current_level', question: 'What is their current curriculum level?' },
      { order: 3, fieldId: 'next_level',    question: 'What level are you considering for advancement?' },
    ],
    reads: ['player_profile', 'curriculum', 'assessment', 'coach_note', 'attendance'],
    createsDraftType: 'level_readiness_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['advance_player_level_without_approval', 'send_advancement_to_parent'],
    saveApplyMethodStatus: 'wired',
  },

  handle_attendance_exception: {
    taskId: 'handle_attendance_exception',
    label: 'Record Attendance',
    description:
      'Help the director record attendance for a session — who was present, who was absent, and any unrostered visitors. Creates a proposed_actions draft for director review.',
    requiredFields: [
      { fieldId: 'session_or_group',     label: 'Session or Group',     required: true, example: "Today's Orange 2 session" },
      { fieldId: 'attendance_statement', label: 'Attendance Statement', required: true, example: 'Everyone was here except Sarah' },
    ],
    optionalFields: [],
    questionSequence: [
      { order: 1, fieldId: 'session_or_group',     question: 'Which session or group is this attendance for?' },
      { order: 2, fieldId: 'attendance_statement', question: 'Tell me what happened — e.g. "Everyone was here except Sarah" or "Jeremy showed up and is not on the roster".' },
    ],
    reads: ['session', 'group_memberships', 'players'],
    createsDraftType: 'attendance_exception_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['write_attendance_records', 'modify_roster', 'notify_parent'],
    saveApplyMethodStatus: 'wired',
  },

  adjust_curriculum: {
    taskId: 'adjust_curriculum',
    label: 'Adjust Curriculum',
    description:
      'Help the director propose a curriculum customization — adding, removing, or modifying a drill, requirement, or level element.',
    requiredFields: [
      { fieldId: 'adjustment_type',   label: 'Adjustment Type',  required: true,  example: 'Add drill' },
      { fieldId: 'target_level',      label: 'Target Level',     required: true },
      { fieldId: 'proposed_change',   label: 'Proposed Change',  required: true },
    ],
    optionalFields: [
      { fieldId: 'reason',          label: 'Reason',             required: false },
      { fieldId: 'affected_players', label: 'Affected Players',  required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'adjustment_type', question: 'What kind of curriculum adjustment are you proposing?' },
      { order: 2, fieldId: 'target_level',    question: 'Which curriculum level does this apply to?' },
      { order: 3, fieldId: 'proposed_change', question: 'What specifically should change?' },
    ],
    reads: ['curriculum', 'player_profile', 'class_template'],
    createsDraftType: 'curriculum_adjustment_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['modify_curriculum_without_approval', 'publish_curriculum_change'],
    saveApplyMethodStatus: 'wired',
  },

  draft_coach_communication: {
    taskId: 'draft_coach_communication',
    label: 'Draft Coach Communication',
    description:
      'Help the director draft a message intended for a coach. Saved as a pending-review proposed action — not sent. No coach communication infrastructure exists; this is an internal draft only.',
    requiredFields: [
      { fieldId: 'coach',         label: 'Coach',          required: true, example: 'Coach Sarah' },
      { fieldId: 'message_focus', label: 'Message Focus',  required: true, example: 'Reminder about session plan for next Tuesday' },
    ],
    optionalFields: [
      { fieldId: 'context',     label: 'Context',     required: false },
      { fieldId: 'follow_up',   label: 'Follow-up',   required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'coach',         question: 'Which coach is this message for?' },
      { order: 2, fieldId: 'message_focus', question: 'What should the message focus on?' },
    ],
    reads: ['coach_profile', 'session'],
    createsDraftType: 'coach_communication_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['send_coach_message_without_approval', 'notify_coach_automatically'],
    saveApplyMethodStatus: 'wired',
  },

  create_group: {
    taskId: 'create_group',
    label: 'Create Group',
    description:
      'Help the director define a new player group — name, level, coach assignment, and initial roster.',
    requiredFields: [
      { fieldId: 'group_name',   label: 'Group Name',       required: true,  example: 'Orange Ball Group A' },
      { fieldId: 'level',        label: 'Curriculum Level', required: true },
      { fieldId: 'coach',        label: 'Assigned Coach',   required: true },
    ],
    optionalFields: [
      { fieldId: 'players',      label: 'Initial Players',  required: false },
      { fieldId: 'schedule',     label: 'Session Schedule', required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'group_name', question: 'What should this group be called?' },
      { order: 2, fieldId: 'level',      question: 'What curriculum level is this group?' },
      { order: 3, fieldId: 'coach',      question: 'Which coach will be assigned to this group?' },
    ],
    reads: ['group', 'player_profile', 'coach_profile', 'curriculum'],
    createsDraftType: 'group_creation_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['create_group_without_review', 'auto_assign_players'],
    saveApplyMethodStatus: 'not_wired_yet',
  },

  assign_player_to_group: {
    taskId: 'assign_player_to_group',
    label: 'Assign Player to Group',
    description:
      'Help the director assign a player to a group — checking level compatibility before drafting the assignment.',
    requiredFields: [
      { fieldId: 'player', label: 'Player', required: true },
      { fieldId: 'group',  label: 'Group',  required: true },
    ],
    optionalFields: [
      { fieldId: 'start_date',  label: 'Start Date',  required: false },
      { fieldId: 'trial_basis', label: 'Trial Basis', required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player', question: 'Which player are you assigning?' },
      { order: 2, fieldId: 'group',  question: 'Which group should they join?' },
    ],
    reads: ['player_profile', 'group', 'curriculum'],
    createsDraftType: 'group_creation_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['auto_assign_player', 'place_player_in_wrong_level_group'],
    saveApplyMethodStatus: 'not_wired_yet',
  },

  summarize_player_progress: {
    taskId: 'summarize_player_progress',
    label: 'Summarize Player Progress',
    description:
      'Generate a structured progress summary for a player — covering curriculum level, active priorities, recent evidence, and coaching context.',
    requiredFields: [
      { fieldId: 'player', label: 'Player', required: true },
    ],
    optionalFields: [
      { fieldId: 'time_range',      label: 'Time Range',       required: false, example: 'Last 4 weeks' },
      { fieldId: 'summary_for',     label: 'Summary For',      required: false, example: 'Parent update, level review' },
    ],
    questionSequence: [
      { order: 1, fieldId: 'player',      question: 'Which player should I summarize?' },
      { order: 2, fieldId: 'summary_for', question: 'What is this summary for? (e.g. parent update, level review, director reference)' },
    ],
    reads: ['player_profile', 'coach_note', 'assessment', 'attendance', 'curriculum', 'player_summary'],
    createsDraftType: 'player_note_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['expose_summary_without_review', 'send_summary_to_parent'],
    saveApplyMethodStatus: 'not_wired_yet',
  },

  recommend_template_for_group: {
    taskId: 'recommend_template_for_group',
    label: 'Recommend Template for Group',
    description:
      'Suggest the best-fit class or fitness template for a group based on player levels, active priorities, curriculum requirements, and available templates.',
    requiredFields: [
      { fieldId: 'group_or_players',   label: 'Group or Players',    required: true },
      { fieldId: 'session_goal',       label: 'Session Goal',        required: true,  example: 'Skill development' },
    ],
    optionalFields: [
      { fieldId: 'recent_coach_notes',    label: 'Recent Coach Notes',    required: false },
      { fieldId: 'curriculum_priority',   label: 'Curriculum Priority',   required: false },
      { fieldId: 'available_templates',   label: 'Available Templates',   required: false },
    ],
    questionSequence: [
      { order: 1, fieldId: 'group_or_players', question: 'Which group or players should I consider?' },
      { order: 2, fieldId: 'session_goal',     question: 'What is the main goal for this session? (skill development, competition prep, or fitness)' },
      { order: 3, fieldId: 'curriculum_priority', question: 'Should I prioritize any specific curriculum area?' },
    ],
    reads: ['player_profile', 'group', 'class_template', 'curriculum', 'coach_note'],
    createsDraftType: 'template_recommendation_draft',
    approvalRequired: true,
    unsafeWithoutApproval: ['auto_schedule_session_with_template', 'send_plan_without_approval'],
    saveApplyMethodStatus: 'not_wired_yet',
  },

}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a task contract by ID. */
export function getTaskContract(taskId: DonnaTaskId): DonnaTaskContract | undefined {
  return DONNA_TASK_CONTRACTS[taskId]
}

/** Returns all task contracts that are already wired (save action exists). */
export function getWiredTaskContracts(): DonnaTaskContract[] {
  return Object.values(DONNA_TASK_CONTRACTS).filter(
    t => t.saveApplyMethodStatus === 'wired',
  )
}

/** Returns all task contracts that are contract-only (save not yet built). */
export function getUnwiredTaskContracts(): DonnaTaskContract[] {
  return Object.values(DONNA_TASK_CONTRACTS).filter(
    t => t.saveApplyMethodStatus === 'not_wired_yet',
  )
}

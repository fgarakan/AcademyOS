// Donna Draft + Approval Contract Registry — local TypeScript only, no DB, no API.
// Defines the standard shape every Donna draft uses before anything becomes official.
//
// This sprint defines the approval architecture so all future Donna actions
// follow the same pattern: draft → director reviews → director approves → system applies.
//
// saveWireStatus:
//   "wired"         — the server action for saving this draft is built and connected
//   "not_wired_yet" — the contract is defined; the save server action is not yet built

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaDraftType =
  | 'class_template_draft'
  | 'fitness_template_draft'
  | 'session_draft'
  | 'session_block_population_draft'
  | 'coach_note_draft'
  | 'parent_update_draft'
  | 'player_note_draft'
  | 'curriculum_adjustment_draft'
  | 'attendance_exception_draft'
  | 'level_readiness_draft'
  | 'coach_communication_draft'
  | 'group_creation_draft'
  | 'template_recommendation_draft'

export interface DonnaDraftContract {
  draftType: DonnaDraftType
  title: string
  summary: string
  /** The task that produces this draft, if any */
  sourceTask: string | null
  /** What data Donna reads to compose this draft */
  dataUsed: string[]
  /** Fields Donna collects from the director to build this draft */
  fieldsCollected: string[]
  /** Fields that must still be filled before this draft is complete */
  missingFields: string[]
  /** What this draft proposes to do — human-readable list */
  proposedChanges: string[]
  /** Object types that would be affected if this draft is applied */
  affectedObjects: string[]
  /** Who can see this draft before it is approved */
  visibilityImpact: string
  approvalRequired: boolean
  /** Label on the primary approval action button */
  approvalActionLabel: string
  /** Label on the cancel/discard button */
  cancelActionLabel: string
  saveWireStatus: 'wired' | 'not_wired_yet'
}

// ---------------------------------------------------------------------------
// Draft Contracts
// ---------------------------------------------------------------------------

export const DONNA_DRAFT_CONTRACTS: Record<DonnaDraftType, DonnaDraftContract> = {

  class_template_draft: {
    draftType: 'class_template_draft',
    title: 'Class Template Draft',
    summary:
      'A proposed class template with level, duration, and blocks ready for director review. Nothing is saved until the director explicitly clicks Save Template.',
    sourceTask: 'create_class_template',
    dataUsed: ['curriculum_level', 'director_input', 'block_definitions'],
    fieldsCollected: ['level', 'duration', 'blocks', 'template_name'],
    missingFields: [],
    proposedChanges: [
      'Create a new template record in the templates table',
      'Create template_blocks records for each block',
    ],
    affectedObjects: ['class_template', 'template_blocks'],
    visibilityImpact: 'Director only — draft is local until Save Template is clicked',
    approvalRequired: true,
    approvalActionLabel: 'Save Template',
    cancelActionLabel: 'Cancel Draft',
    saveWireStatus: 'wired',
  },

  fitness_template_draft: {
    draftType: 'fitness_template_draft',
    title: 'Fitness Template Draft',
    summary:
      'A proposed fitness training template with physical blocks, intensity, and tennis-transfer focus. Requires director approval before saving.',
    sourceTask: 'create_fitness_template',
    dataUsed: ['director_input', 'exercise_library', 'training_goals'],
    fieldsCollected: [
      'target_level_or_group',
      'training_goal',
      'duration',
      'block_categories',
      'intensity',
      'tennis_transfer_focus',
    ],
    missingFields: [],
    proposedChanges: [
      'Create a new fitness template record in the templates table (tagged as fitness_template:true)',
      'Create template_blocks records for each block',
    ],
    affectedObjects: ['fitness_template', 'template_blocks'],
    visibilityImpact: 'Director only — draft is local until Save Template is clicked',
    approvalRequired: true,
    approvalActionLabel: 'Save Fitness Template',
    cancelActionLabel: 'Cancel Draft',
    saveWireStatus: 'wired',
  },

  session_block_population_draft: {
    draftType: 'session_block_population_draft',
    title: 'Session Block Population Draft',
    summary:
      'Copies template_blocks into an existing planned session shell as session_blocks. A local coach brief is generated for director review only — it is never sent automatically. Director must explicitly approve before any blocks are written.',
    sourceTask: 'populate_session_from_template',
    dataUsed: ['session', 'template_blocks', 'coach_profile', 'group'],
    fieldsCollected: ['session', 'template', 'coach_brief_focus', 'modifications'],
    missingFields: [],
    proposedChanges: [
      'Copy template_blocks from the linked template into session_blocks for this session',
      'Generate a local coach brief draft for director review (not sent, not stored)',
    ],
    affectedObjects: ['session', 'session_blocks'],
    visibilityImpact: 'Director only — no coach, parent, or player is notified',
    approvalRequired: true,
    approvalActionLabel: 'Approve and Populate Blocks',
    cancelActionLabel: 'Cancel',
    saveWireStatus: 'wired',
  },

  session_draft: {
    draftType: 'session_draft',
    title: 'Session Draft',
    summary:
      'A planned session shell assigned to a coach and group with a scheduled date. Requires director approval before the session record is created. Blocks are not copied in this step — populate from the session detail page after creation.',
    sourceTask: 'create_session',
    dataUsed: ['coach_profile', 'group', 'schedule', 'class_template'],
    fieldsCollected: ['group', 'coach', 'date', 'template', 'session_goal'],
    missingFields: [],
    proposedChanges: [
      'Create a sessions record (status: planned) with coach, group, date, and optional template',
      'Session blocks are NOT copied — assign from the session detail page',
    ],
    affectedObjects: ['session'],
    visibilityImpact: 'Director only — internal planned record; coach is not notified',
    approvalRequired: true,
    approvalActionLabel: 'Create Session',
    cancelActionLabel: 'Cancel Draft',
    saveWireStatus: 'wired',
  },

  coach_note_draft: {
    draftType: 'coach_note_draft',
    title: 'Coach Note Draft',
    summary:
      'A structured observation note saved as a pending-review voice note. Deterministic tags are applied (category, source, visibility). Session linking is applied when a session is confirmed. Internal only — not visible to parents or players until director approves.',
    sourceTask: 'capture_coach_note',
    dataUsed: ['player_profile', 'session_context', 'director_input'],
    fieldsCollected: ['player', 'observation', 'priority_link', 'session_context'],
    missingFields: [],
    proposedChanges: [
      'Write a pending-review voice note — internal only',
      'Apply deterministic category/visibility tags from observation text',
      'Link to confirmed player and/or session if resolved',
    ],
    affectedObjects: ['voice_notes'],
    visibilityImpact: 'Internal only — not visible to parents or players',
    approvalRequired: true,
    approvalActionLabel: 'Save Note',
    cancelActionLabel: 'Discard Note',
    saveWireStatus: 'wired',
  },

  parent_update_draft: {
    draftType: 'parent_update_draft',
    title: 'Parent Update Draft',
    summary:
      'A proposed parent-safe progress update for a specific player. All content is reviewed and approved by the director before it is ever shared with the parent.',
    sourceTask: 'draft_parent_update',
    dataUsed: ['player_profile', 'approved_coach_notes', 'assessment', 'attendance_summary'],
    fieldsCollected: ['player', 'update_focus', 'tone'],
    missingFields: [],
    proposedChanges: [
      'Compose a parent-safe update text for review',
      'Send message only after explicit director approval',
    ],
    affectedObjects: ['parent_update', 'player_profile'],
    visibilityImpact: 'Director only until explicitly approved and sent — parent never sees draft',
    approvalRequired: true,
    approvalActionLabel: 'Save Parent Draft',
    cancelActionLabel: 'Discard Update',
    saveWireStatus: 'wired',
  },

  player_note_draft: {
    draftType: 'player_note_draft',
    title: 'Player Note Draft',
    summary:
      'Updates coach_summary and development_focus in player_development_summary. Internal only — show_to_parent and show_to_student are never touched. Does not update player level, does not send communication. Director review may still be required.',
    sourceTask: 'draft_player_note',
    dataUsed: ['player_profile', 'curriculum', 'coach_note', 'assessment'],
    fieldsCollected: ['player', 'note_focus', 'curriculum_link'],
    missingFields: [],
    proposedChanges: [
      'Update coach_summary and development_focus in player_development_summary',
      'Never modifies show_to_parent or show_to_student — player sees nothing until director explicitly enables',
    ],
    affectedObjects: ['player_development_summary'],
    visibilityImpact: 'Internal only — not visible to parents or players',
    approvalRequired: true,
    approvalActionLabel: 'Save Player Note',
    cancelActionLabel: 'Discard Note',
    saveWireStatus: 'wired',
  },

  curriculum_adjustment_draft: {
    draftType: 'curriculum_adjustment_draft',
    title: 'Curriculum Adjustment Draft',
    summary:
      'A proposed change to the curriculum spine — adding, removing, or modifying a drill, requirement, or level element. Requires director approval before any curriculum data changes.',
    sourceTask: 'adjust_curriculum',
    dataUsed: ['curriculum', 'player_profile', 'class_template'],
    fieldsCollected: ['adjustment_type', 'target_level', 'proposed_change', 'reason'],
    missingFields: [],
    proposedChanges: [
      'Propose a curriculum modification for director review',
      'No curriculum data changes until director approves',
    ],
    affectedObjects: ['curriculum'],
    visibilityImpact: 'Director only — curriculum data unchanged until approved',
    approvalRequired: true,
    approvalActionLabel: 'Submit for Review',
    cancelActionLabel: 'Discard Proposal',
    saveWireStatus: 'wired',
  },

  attendance_exception_draft: {
    draftType: 'attendance_exception_draft',
    title: 'Attendance Draft',
    summary:
      'A proposed attendance record created for director review. Creates a proposed_actions row — no session_attendance rows are written until the director explicitly applies the draft in the Review Queue.',
    sourceTask: 'handle_attendance_exception',
    dataUsed: ['session', 'group_memberships', 'players', 'director_input'],
    fieldsCollected: ['session_or_group', 'attendance_statement'],
    missingFields: [],
    proposedChanges: [
      'Create a proposed_actions draft row for director review',
      'No attendance records written until director applies in Review Queue',
      'Unrostered attendees flagged for review — not added to roster or attendance',
      'No player profiles, billing, or parent communications modified',
    ],
    affectedObjects: ['proposed_actions', 'voice_commands'],
    visibilityImpact: 'Director only — attendance data unchanged until director explicitly applies',
    approvalRequired: true,
    approvalActionLabel: 'Submit for Director Review',
    cancelActionLabel: 'Discard',
    saveWireStatus: 'wired',
  },

  level_readiness_draft: {
    draftType: 'level_readiness_draft',
    title: 'Level Readiness Review Draft',
    summary:
      'A structured assessment of whether a player is ready to advance to the next curriculum level — based on gate evidence, assessment scores, and coaching context. Requires director decision.',
    sourceTask: 'review_level_readiness',
    dataUsed: ['player_profile', 'curriculum', 'assessment', 'coach_note', 'attendance'],
    fieldsCollected: ['player', 'current_level', 'next_level', 'gate_evidence', 'coach_context'],
    missingFields: [],
    proposedChanges: [
      'Draft a level advancement recommendation for director decision',
      'Level only changes if director explicitly approves advancement',
    ],
    affectedObjects: ['player_profile', 'player_curriculum_states'],
    visibilityImpact: 'Director only — player level unchanged until director explicitly approves',
    approvalRequired: true,
    approvalActionLabel: 'Submit for Review',
    cancelActionLabel: 'Hold at Current Level',
    saveWireStatus: 'wired',
  },

  coach_communication_draft: {
    draftType: 'coach_communication_draft',
    title: 'Coach Communication Draft',
    summary:
      'An internal draft of a message intended for a coach. Saved to the Review Queue as pending director review. NOT SENT — no coach communication infrastructure exists in this system. The director must handle sending separately.',
    sourceTask: 'draft_coach_communication',
    dataUsed: ['coach_profile', 'director_input'],
    fieldsCollected: ['coach', 'message_focus', 'context', 'follow_up'],
    missingFields: [],
    proposedChanges: [
      'Create a proposed_actions draft row (status: pending_review, target_module: coach_communication)',
      'No message is sent — the draft is internal only',
    ],
    affectedObjects: ['proposed_actions', 'voice_commands'],
    visibilityImpact: 'Internal only — the coach is never notified. This draft is for director reference only.',
    approvalRequired: true,
    approvalActionLabel: 'Save as Draft',
    cancelActionLabel: 'Discard Draft',
    saveWireStatus: 'wired',
  },

  group_creation_draft: {
    draftType: 'group_creation_draft',
    title: 'Group Draft',
    summary:
      'A proposed new player group — with name, curriculum level, coach assignment, and optional initial roster. Requires director approval before the group is created.',
    sourceTask: 'create_group',
    dataUsed: ['coach_profile', 'player_profile', 'curriculum'],
    fieldsCollected: ['group_name', 'level', 'coach', 'players', 'schedule'],
    missingFields: [],
    proposedChanges: [
      'Create a groups record with name, level, and coach assignment',
      'Optionally assign initial players to the group',
    ],
    affectedObjects: ['group', 'player_profile'],
    visibilityImpact: 'Director only until approved — group does not exist until created',
    approvalRequired: true,
    approvalActionLabel: 'Create Group',
    cancelActionLabel: 'Cancel',
    saveWireStatus: 'not_wired_yet',
  },

  template_recommendation_draft: {
    draftType: 'template_recommendation_draft',
    title: 'Template Recommendation Draft',
    summary:
      'A recommendation for which class or fitness template best fits a group or player need — based on levels, priorities, curriculum requirements, and available templates.',
    sourceTask: 'recommend_template_for_group',
    dataUsed: [
      'group_players',
      'player_levels',
      'active_priorities',
      'recent_coach_notes',
      'curriculum_requirements',
      'available_templates',
    ],
    fieldsCollected: ['group_or_players', 'session_goal', 'curriculum_priority'],
    missingFields: [],
    proposedChanges: [
      'Recommend a specific template with reasoning',
      'Suggest optional modifications based on group needs',
    ],
    affectedObjects: ['group', 'class_template', 'session'],
    visibilityImpact: 'Director only — no session or template is created until director approves',
    approvalRequired: true,
    approvalActionLabel: 'Approve Recommendation',
    cancelActionLabel: 'Discard Recommendation',
    saveWireStatus: 'not_wired_yet',
  },

}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a draft contract by draft type. */
export function getDraftContract(
  draftType: DonnaDraftType,
): DonnaDraftContract | undefined {
  return DONNA_DRAFT_CONTRACTS[draftType]
}

/** Returns all draft contracts that are fully wired (save action exists). */
export function getWiredDraftContracts(): DonnaDraftContract[] {
  return Object.values(DONNA_DRAFT_CONTRACTS).filter(
    d => d.saveWireStatus === 'wired',
  )
}

/** Returns all draft contracts that are contract-only (save not yet built). */
export function getUnwiredDraftContracts(): DonnaDraftContract[] {
  return Object.values(DONNA_DRAFT_CONTRACTS).filter(
    d => d.saveWireStatus === 'not_wired_yet',
  )
}

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
  | 'coach_note_draft'
  | 'parent_update_draft'
  | 'player_note_draft'
  | 'curriculum_adjustment_draft'
  | 'attendance_exception_draft'
  | 'level_readiness_draft'
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
    saveWireStatus: 'not_wired_yet',
  },

  session_draft: {
    draftType: 'session_draft',
    title: 'Session Draft',
    summary:
      'A proposed session generated from a template — assigned to a coach and group, with a scheduled date. Requires director approval before the session is created.',
    sourceTask: 'create_session',
    dataUsed: ['class_template', 'coach_profile', 'group', 'schedule'],
    fieldsCollected: ['template', 'date', 'coach', 'group', 'session_goal'],
    missingFields: [],
    proposedChanges: [
      'Create a sessions record with template, coach, group, and date',
      'Create session_blocks from template_blocks',
    ],
    affectedObjects: ['session', 'session_blocks', 'group'],
    visibilityImpact: 'Director only until approved; coach sees it after creation',
    approvalRequired: true,
    approvalActionLabel: 'Create Session',
    cancelActionLabel: 'Cancel Draft',
    saveWireStatus: 'not_wired_yet',
  },

  coach_note_draft: {
    draftType: 'coach_note_draft',
    title: 'Coach Note Draft',
    summary:
      'A proposed observation note about a player — structured from director or coach input. Requires director review before it is saved to the player record.',
    sourceTask: 'capture_coach_note',
    dataUsed: ['player_profile', 'session_context', 'director_input'],
    fieldsCollected: ['player', 'observation', 'priority_link', 'session_context'],
    missingFields: [],
    proposedChanges: [
      'Write an observation to voice_notes or coach_notes for the player',
      'Optionally link to an active player priority',
    ],
    affectedObjects: ['player_profile', 'coach_note'],
    visibilityImpact: 'Director only until approved — not visible to parents or players',
    approvalRequired: true,
    approvalActionLabel: 'Save Note',
    cancelActionLabel: 'Discard Note',
    saveWireStatus: 'not_wired_yet',
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
    approvalActionLabel: 'Approve and Schedule',
    cancelActionLabel: 'Discard Update',
    saveWireStatus: 'not_wired_yet',
  },

  player_note_draft: {
    draftType: 'player_note_draft',
    title: 'Player Note Draft',
    summary:
      'A proposed development note for a player — intended to eventually be player-visible. Requires director approval before it is saved or shared.',
    sourceTask: 'draft_player_note',
    dataUsed: ['player_profile', 'curriculum', 'coach_note', 'assessment'],
    fieldsCollected: ['player', 'note_focus', 'curriculum_link'],
    missingFields: [],
    proposedChanges: [
      'Save a player_development_summary record for this player',
      'Set show_to_student and show_to_parent flags based on director approval',
    ],
    affectedObjects: ['player_profile', 'player_summary'],
    visibilityImpact: 'Director only until approved — player sees it only after show_to_student is set',
    approvalRequired: true,
    approvalActionLabel: 'Save Player Note',
    cancelActionLabel: 'Discard Note',
    saveWireStatus: 'not_wired_yet',
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
    approvalActionLabel: 'Apply Curriculum Change',
    cancelActionLabel: 'Discard Proposal',
    saveWireStatus: 'not_wired_yet',
  },

  attendance_exception_draft: {
    draftType: 'attendance_exception_draft',
    title: 'Attendance Exception Draft',
    summary:
      'A proposed record of an attendance exception — absence, late arrival, unrostered attendee, or make-up. Requires director review before attendance data is updated.',
    sourceTask: 'handle_attendance_exception',
    dataUsed: ['player_profile', 'session', 'attendance', 'group'],
    fieldsCollected: ['player', 'session', 'exception_type', 'reason'],
    missingFields: [],
    proposedChanges: [
      'Create or update an attendance record for this player and session',
      'Flag the exception type for director review',
    ],
    affectedObjects: ['attendance', 'session', 'player_profile'],
    visibilityImpact: 'Director only until approved — attendance count unchanged until applied',
    approvalRequired: true,
    approvalActionLabel: 'Record Exception',
    cancelActionLabel: 'Discard',
    saveWireStatus: 'not_wired_yet',
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
    approvalActionLabel: 'Approve Advancement',
    cancelActionLabel: 'Hold at Current Level',
    saveWireStatus: 'not_wired_yet',
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

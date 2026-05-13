// Donna Ecosystem Read Access Map — local TypeScript only, no DB, no API.
// Defines what Donna may read by role and object type.
//
// This is a UI/task contract layer — not the final security enforcement layer.
// RLS and server-side auth remain the authoritative security boundary.
// This map tells Donna what it is ALLOWED to surface in conversation by role.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaObjectType =
  | 'academy'
  | 'director_profile'
  | 'coach_profile'
  | 'parent_profile'
  | 'player_profile'
  | 'group'
  | 'session'
  | 'attendance'
  | 'class_template'
  | 'fitness_template'
  | 'curriculum'
  | 'coach_note'
  | 'assessment'
  | 'review_item'
  | 'signal'
  | 'parent_update'
  | 'player_summary'

export type DonnaRoleScope =
  | 'director'
  | 'coach'
  | 'parent'
  | 'player'
  | 'platform_owner'

export type DonnaReadLevel =
  | 'full'            // full access to all non-sensitive fields
  | 'assigned_only'   // only records assigned to this role (e.g. coach's own players)
  | 'safe_summary'    // only pre-approved, sanitized summaries
  | 'none'            // no access

export interface DonnaObjectAccess {
  objectType: DonnaObjectType
  directorRead: DonnaReadLevel
  coachRead: DonnaReadLevel
  parentRead: DonnaReadLevel
  playerRead: DonnaReadLevel
  /** Fields that must never be exposed outside director role */
  sensitiveFields: string[]
  /** Fields that may be shown to a parent via approved summaries */
  parentSafeFields: string[]
  /** Fields that may be shown to a player via approved summaries */
  playerSafeFields: string[]
  /** Fields/contexts that require explicit director approval before exposure */
  requiresApprovalToExpose: string[]
}

// ---------------------------------------------------------------------------
// Access map
// ---------------------------------------------------------------------------

export const DONNA_ACCESS_MAP: Record<DonnaObjectType, DonnaObjectAccess> = {

  academy: {
    objectType: 'academy',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: [
      'billing_info',
      'internal_director_notes',
      'staff_performance_records',
      'platform_settings',
    ],
    parentSafeFields: ['academy_name', 'contact_info'],
    playerSafeFields: ['academy_name'],
    requiresApprovalToExpose: ['academy_financial_data', 'staff_access_logs'],
  },

  director_profile: {
    objectType: 'director_profile',
    directorRead: 'full',
    coachRead: 'none',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: ['email', 'phone', 'auth_id', 'internal_notes'],
    parentSafeFields: ['display_name'],
    playerSafeFields: ['display_name'],
    requiresApprovalToExpose: ['contact_details_to_parents'],
  },

  coach_profile: {
    objectType: 'coach_profile',
    directorRead: 'full',
    coachRead: 'full',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: ['email', 'phone', 'auth_id', 'internal_performance_notes', 'salary'],
    parentSafeFields: ['display_name', 'assigned_groups'],
    playerSafeFields: ['display_name'],
    requiresApprovalToExpose: ['coach_contact_to_parents', 'performance_feedback'],
  },

  parent_profile: {
    objectType: 'parent_profile',
    directorRead: 'full',
    coachRead: 'none',
    parentRead: 'full',
    playerRead: 'none',
    sensitiveFields: [
      'email',
      'phone',
      'auth_id',
      'guardian_notes',
      'other_children_data',
      'payment_records',
    ],
    parentSafeFields: ['display_name', 'linked_player_names'],
    playerSafeFields: [],
    requiresApprovalToExpose: ['parent_contact_to_coaches', 'payment_status'],
  },

  player_profile: {
    objectType: 'player_profile',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: [
      'internal_director_notes',
      'raw_coach_notes',
      'unapproved_ai_interpretations',
      'other_players_data',
      'medical_notes',
      'behavioral_flags',
    ],
    parentSafeFields: [
      'current_focus',
      'approved_progress_summary',
      'next_steps',
      'attendance_summary',
      'curriculum_level_label',
    ],
    playerSafeFields: [
      'current_focus',
      'missions',
      'next_steps',
      'curriculum_level_label',
    ],
    requiresApprovalToExpose: [
      'coach_note_to_parent',
      'ai_summary_to_parent',
      'level_readiness_recommendation',
      'behavioral_note_to_parent',
    ],
  },

  group: {
    objectType: 'group',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: ['internal_notes', 'coach_performance_context'],
    parentSafeFields: ['group_name', 'session_schedule', 'coach_name'],
    playerSafeFields: ['group_name', 'session_schedule'],
    requiresApprovalToExpose: ['group_composition_to_parents', 'other_player_names'],
  },

  session: {
    objectType: 'session',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: [
      'wrap_up_raw_notes',
      'coach_observations',
      'internal_session_flags',
    ],
    parentSafeFields: ['session_date', 'session_focus_label', 'attendance_status'],
    playerSafeFields: ['session_date', 'session_focus_label'],
    requiresApprovalToExpose: ['wrap_up_to_parent', 'session_notes_to_parent'],
  },

  attendance: {
    objectType: 'attendance',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'none',
    sensitiveFields: ['absence_reason_raw', 'coach_flag_notes'],
    parentSafeFields: ['attendance_date', 'present', 'session_label'],
    playerSafeFields: [],
    requiresApprovalToExpose: ['attendance_concern_to_parent', 'absence_pattern_alert'],
  },

  class_template: {
    objectType: 'class_template',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: ['internal_design_notes', 'director_customization_context'],
    parentSafeFields: [],
    playerSafeFields: [],
    requiresApprovalToExpose: ['curriculum_link_to_parent'],
  },

  fitness_template: {
    objectType: 'fitness_template',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: ['internal_design_notes', 'intensity_calibration_notes'],
    parentSafeFields: [],
    playerSafeFields: [],
    requiresApprovalToExpose: ['training_plan_to_parent'],
  },

  curriculum: {
    objectType: 'curriculum',
    directorRead: 'full',
    coachRead: 'full',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: ['admin_customization_log', 'unpublished_curriculum_drafts'],
    parentSafeFields: ['level_name', 'level_description', 'stage'],
    playerSafeFields: ['level_name', 'current_focus_areas', 'next_milestone_label'],
    requiresApprovalToExpose: ['detailed_requirements_to_parent', 'assessment_criteria_to_player'],
  },

  coach_note: {
    objectType: 'coach_note',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: [
      'raw_observation_text',
      'coach_private_context',
      'behavioral_observations',
      'emotional_state_notes',
    ],
    parentSafeFields: [],
    playerSafeFields: [],
    requiresApprovalToExpose: [
      'coach_note_to_parent',
      'coach_note_to_player',
      'ai_structured_summary_to_parent',
    ],
  },

  assessment: {
    objectType: 'assessment',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: [
      'raw_assessment_scores',
      'internal_recommendation_reasoning',
      'placement_override_notes',
    ],
    parentSafeFields: ['assessment_date', 'level_recommendation_label', 'general_progress_note'],
    playerSafeFields: ['assessment_date', 'current_level_label'],
    requiresApprovalToExpose: [
      'placement_recommendation_to_parent',
      'detailed_scores_to_parent',
    ],
  },

  review_item: {
    objectType: 'review_item',
    directorRead: 'full',
    coachRead: 'none',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: [
      'proposed_action_payload',
      'rejection_reasoning',
      'director_review_notes',
    ],
    parentSafeFields: [],
    playerSafeFields: [],
    requiresApprovalToExpose: ['review_decision_to_coach', 'approved_action_notification'],
  },

  signal: {
    objectType: 'signal',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'none',
    playerRead: 'none',
    sensitiveFields: [
      'signal_reasoning_raw',
      'ai_interpretation_draft',
      'confidence_score',
    ],
    parentSafeFields: [],
    playerSafeFields: [],
    requiresApprovalToExpose: ['signal_alert_to_parent', 'attendance_concern_to_parent'],
  },

  parent_update: {
    objectType: 'parent_update',
    directorRead: 'full',
    coachRead: 'none',
    parentRead: 'safe_summary',
    playerRead: 'none',
    sensitiveFields: [
      'draft_update_text',
      'director_approval_status',
      'internal_update_reasoning',
    ],
    parentSafeFields: [
      'approved_update_text',
      'update_date',
      'player_focus_label',
      'next_steps',
    ],
    playerSafeFields: [],
    requiresApprovalToExpose: [
      'parent_update_before_director_approval',
      'unapproved_ai_draft',
    ],
  },

  player_summary: {
    objectType: 'player_summary',
    directorRead: 'full',
    coachRead: 'assigned_only',
    parentRead: 'safe_summary',
    playerRead: 'safe_summary',
    sensitiveFields: [
      'internal_director_summary',
      'raw_coach_observations',
      'unapproved_ai_summary',
      'behavioral_context',
    ],
    parentSafeFields: [
      'current_focus',
      'progress_highlights',
      'next_recommended_steps',
      'attendance_trend',
    ],
    playerSafeFields: [
      'current_focus',
      'missions',
      'next_steps',
      'progress_highlights',
    ],
    requiresApprovalToExpose: [
      'ai_summary_to_parent',
      'full_development_report_to_parent',
    ],
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if a given role can read any version of an object type. */
export function canRoleRead(
  objectType: DonnaObjectType,
  role: DonnaRoleScope,
): boolean {
  const access = DONNA_ACCESS_MAP[objectType]
  if (!access) return false
  const level = getRoleReadLevel(access, role)
  return level !== 'none'
}

/** Returns the read level for a specific role on an object type. */
export function getRoleReadLevel(
  access: DonnaObjectAccess,
  role: DonnaRoleScope,
): DonnaReadLevel {
  switch (role) {
    case 'director':       return access.directorRead
    case 'coach':          return access.coachRead
    case 'parent':         return access.parentRead
    case 'player':         return access.playerRead
    case 'platform_owner': return access.directorRead  // platform_owner reads at director level
    default:               return 'none'
  }
}

/** Returns the safe field list for a given role on an object type. */
export function getSafeFieldsForRole(
  objectType: DonnaObjectType,
  role: DonnaRoleScope,
): string[] {
  const access = DONNA_ACCESS_MAP[objectType]
  if (!access) return []
  switch (role) {
    case 'parent': return access.parentSafeFields
    case 'player': return access.playerSafeFields
    case 'director':
    case 'platform_owner':
      return []  // director reads all non-sensitive fields — no whitelist needed
    default:       return []
  }
}

/** Returns all object types a given role can read. */
export function getReadableObjectTypesForRole(
  role: DonnaRoleScope,
): DonnaObjectType[] {
  return (Object.keys(DONNA_ACCESS_MAP) as DonnaObjectType[]).filter(type =>
    canRoleRead(type, role),
  )
}

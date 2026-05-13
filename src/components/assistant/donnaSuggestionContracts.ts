// Donna Predictive Suggestion Contract Registry — local TypeScript only, no DB, no API.
// Defines the structure for each type of predictive suggestion Donna can eventually produce.
//
// This sprint is contract-only. No live predictions are made in this sprint.
// No database queries, no OpenAI/API, no Realtime.
//
// These contracts define:
//   - what inputs each suggestion type needs
//   - what reasoning fields it should explain
//   - what confidence levels it uses
//   - what action it leads to
//   - whether explainability is required (it always is for Academy OS)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaSuggestionType =
  | 'template_recommendation'
  | 'session_focus_recommendation'
  | 'group_composition_recommendation'
  | 'player_attention_signal'
  | 'parent_update_suggestion'
  | 'curriculum_priority_suggestion'
  | 'fitness_focus_suggestion'
  | 'attendance_risk_suggestion'

export type DonnaConfidenceLevel = 'low' | 'medium' | 'high'

export interface DonnaSuggestionInput {
  inputId: string
  label: string
  required: boolean
  source: string
}

export interface DonnaReasoningField {
  fieldId: string
  label: string
  description: string
}

export interface DonnaSuggestionContract {
  suggestionType: DonnaSuggestionType
  label: string
  description: string
  requiredInputs: DonnaSuggestionInput[]
  optionalInputs: DonnaSuggestionInput[]
  reasoningFields: DonnaReasoningField[]
  confidenceLevels: DonnaConfidenceLevel[]
  recommendedActionType: string
  createsDraftType: string
  approvalRequired: boolean
  /** true means Donna must show its reasoning before the director acts */
  explainabilityRequired: boolean
}

// ---------------------------------------------------------------------------
// Suggestion Contracts
// ---------------------------------------------------------------------------

export const DONNA_SUGGESTION_CONTRACTS: Record<
  DonnaSuggestionType,
  DonnaSuggestionContract
> = {

  template_recommendation: {
    suggestionType: 'template_recommendation',
    label: 'Template Recommendation',
    description:
      'Suggests the best-fit class or fitness template for a group or player set — based on levels, active priorities, curriculum requirements, recent evidence, and available templates.',
    requiredInputs: [
      { inputId: 'group_players',        label: 'Group Players',          required: true,  source: 'player_profile' },
      { inputId: 'player_levels',        label: 'Player Levels',          required: true,  source: 'player_curriculum_states' },
      { inputId: 'active_priorities',    label: 'Active Priorities',      required: true,  source: 'player_profile.priorities' },
      { inputId: 'available_templates',  label: 'Available Templates',    required: true,  source: 'templates' },
    ],
    optionalInputs: [
      { inputId: 'recent_coach_notes',      label: 'Recent Coach Notes',      required: false, source: 'coach_note' },
      { inputId: 'curriculum_requirements', label: 'Curriculum Requirements', required: false, source: 'curriculum' },
      { inputId: 'session_goal',            label: 'Session Goal',            required: false, source: 'director_input' },
    ],
    reasoningFields: [
      { fieldId: 'player_need_match',    label: 'Player Need Match',    description: 'How well the template addresses the active priorities of each player in the group' },
      { fieldId: 'curriculum_alignment', label: 'Curriculum Alignment', description: 'Whether the template blocks align with the curriculum level requirements for this group' },
      { fieldId: 'recent_evidence',      label: 'Recent Evidence',      description: 'What recent coach notes and session history suggest about skill gaps or development focus' },
      { fieldId: 'template_fit',         label: 'Template Fit',         description: 'How the available templates rank for this group based on the above factors' },
      { fieldId: 'missing_data',         label: 'Missing Data',         description: 'What data would improve the recommendation if it were available' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'create_template_recommendation_draft',
    createsDraftType: 'template_recommendation_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  session_focus_recommendation: {
    suggestionType: 'session_focus_recommendation',
    label: 'Session Focus Recommendation',
    description:
      'Recommends what to focus on in an upcoming session — based on shared group needs, individual priority overlap, curriculum next steps, and recent evidence.',
    requiredInputs: [
      { inputId: 'group_players',           label: 'Group Players',            required: true, source: 'player_profile' },
      { inputId: 'player_levels',           label: 'Player Levels',            required: true, source: 'player_curriculum_states' },
      { inputId: 'active_priorities',       label: 'Active Priorities',        required: true, source: 'player_profile.priorities' },
      { inputId: 'curriculum_requirements', label: 'Curriculum Requirements',  required: true, source: 'curriculum' },
    ],
    optionalInputs: [
      { inputId: 'recent_sessions',  label: 'Recent Sessions',  required: false, source: 'session' },
      { inputId: 'coach_notes',      label: 'Coach Notes',      required: false, source: 'coach_note' },
      { inputId: 'attendance',       label: 'Attendance',       required: false, source: 'attendance' },
    ],
    reasoningFields: [
      { fieldId: 'shared_group_needs',         label: 'Shared Group Needs',         description: 'Skill areas where multiple players in the group share active priorities' },
      { fieldId: 'individual_priority_overlap', label: 'Individual Priority Overlap', description: 'How many players in the group share a common curriculum gap or coaching focus' },
      { fieldId: 'curriculum_next_step',       label: 'Curriculum Next Step',       description: 'The next milestone or requirement in the curriculum spine for this group level' },
      { fieldId: 'recent_evidence',            label: 'Recent Evidence',            description: 'What recent coach notes and wrap-ups reveal about current skill gaps' },
      { fieldId: 'missing_data',               label: 'Missing Data',               description: 'What additional data would improve this recommendation' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'create_session_draft',
    createsDraftType: 'session_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  group_composition_recommendation: {
    suggestionType: 'group_composition_recommendation',
    label: 'Group Composition Recommendation',
    description:
      'Suggests optimal group compositions based on player levels, development needs, attendance patterns, and coaching capacity.',
    requiredInputs: [
      { inputId: 'all_active_players',  label: 'All Active Players',   required: true, source: 'player_profile' },
      { inputId: 'player_levels',       label: 'Player Levels',        required: true, source: 'player_curriculum_states' },
      { inputId: 'existing_groups',     label: 'Existing Groups',      required: true, source: 'group' },
      { inputId: 'coach_assignments',   label: 'Coach Assignments',    required: true, source: 'coach_profile' },
    ],
    optionalInputs: [
      { inputId: 'attendance_patterns', label: 'Attendance Patterns', required: false, source: 'attendance' },
      { inputId: 'active_priorities',   label: 'Active Priorities',   required: false, source: 'player_profile.priorities' },
    ],
    reasoningFields: [
      { fieldId: 'level_cohesion',       label: 'Level Cohesion',       description: 'Whether players in each proposed group share a compatible curriculum level range' },
      { fieldId: 'priority_alignment',   label: 'Priority Alignment',   description: 'Whether players in each group share enough priority overlap for coherent group sessions' },
      { fieldId: 'coach_capacity',       label: 'Coach Capacity',       description: 'Whether the proposed group size fits the assigned coach\'s schedule and capacity' },
      { fieldId: 'attendance_stability', label: 'Attendance Stability', description: 'Whether attendance patterns suggest the group would have consistent sessions' },
      { fieldId: 'missing_data',         label: 'Missing Data',         description: 'What data is unavailable that would improve this recommendation' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'create_group_creation_draft',
    createsDraftType: 'group_creation_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  player_attention_signal: {
    suggestionType: 'player_attention_signal',
    label: 'Player Attention Signal',
    description:
      'Flags a player who may need director attention — based on attendance drops, stalled priorities, missing curriculum level, overdue reassessment, or absence of recent coach notes.',
    requiredInputs: [
      { inputId: 'player_status',        label: 'Player Status',        required: true, source: 'player_profile' },
      { inputId: 'player_level',         label: 'Player Level',         required: true, source: 'player_curriculum_states' },
      { inputId: 'active_priorities',    label: 'Active Priorities',    required: true, source: 'player_profile.priorities' },
    ],
    optionalInputs: [
      { inputId: 'attendance_summary',   label: 'Attendance Summary',   required: false, source: 'attendance' },
      { inputId: 'last_assessment_date', label: 'Last Assessment Date', required: false, source: 'assessment' },
      { inputId: 'recent_coach_notes',   label: 'Recent Coach Notes',   required: false, source: 'coach_note' },
    ],
    reasoningFields: [
      { fieldId: 'attendance_trend',     label: 'Attendance Trend',     description: 'Whether the player has missed sessions more than expected recently' },
      { fieldId: 'priority_stagnation',  label: 'Priority Stagnation',  description: 'Whether active priorities have not received new coach note evidence in an extended period' },
      { fieldId: 'level_gap',            label: 'Level Gap',            description: 'Whether the player is active but has no curriculum level assigned' },
      { fieldId: 'reassessment_overdue', label: 'Reassessment Overdue', description: 'Whether the player is past their expected reassessment date' },
      { fieldId: 'missing_data',         label: 'Missing Data',         description: 'What additional data would improve this signal' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'view_player_profile',
    createsDraftType: 'player_note_draft',
    approvalRequired: false,
    explainabilityRequired: true,
  },

  parent_update_suggestion: {
    suggestionType: 'parent_update_suggestion',
    label: 'Parent Update Suggestion',
    description:
      'Suggests that a parent update may be due for a player — based on time since last update, significant recent progress, or upcoming level readiness review.',
    requiredInputs: [
      { inputId: 'player_profile',        label: 'Player Profile',         required: true, source: 'player_profile' },
      { inputId: 'last_parent_update',    label: 'Last Parent Update Date',required: true, source: 'parent_update' },
    ],
    optionalInputs: [
      { inputId: 'recent_assessment',     label: 'Recent Assessment',      required: false, source: 'assessment' },
      { inputId: 'recent_coach_notes',    label: 'Recent Coach Notes',     required: false, source: 'coach_note' },
      { inputId: 'level_readiness',       label: 'Level Readiness Status', required: false, source: 'player_curriculum_states' },
    ],
    reasoningFields: [
      { fieldId: 'time_since_update',     label: 'Time Since Last Update', description: 'How long it has been since a parent update was sent for this player' },
      { fieldId: 'notable_progress',      label: 'Notable Progress',       description: 'Whether recent evidence shows notable skill development worth sharing' },
      { fieldId: 'upcoming_milestone',    label: 'Upcoming Milestone',     description: 'Whether a level advancement or assessment is approaching that the parent should know about' },
      { fieldId: 'missing_data',          label: 'Missing Data',           description: 'What data is unavailable that would improve this suggestion' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'draft_parent_update',
    createsDraftType: 'parent_update_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  curriculum_priority_suggestion: {
    suggestionType: 'curriculum_priority_suggestion',
    label: 'Curriculum Priority Suggestion',
    description:
      'Suggests what curriculum areas to prioritize in upcoming sessions — based on group level distribution, gate evidence gaps, and curriculum spine requirements.',
    requiredInputs: [
      { inputId: 'group_levels',            label: 'Group Levels',             required: true, source: 'player_curriculum_states' },
      { inputId: 'curriculum_requirements', label: 'Curriculum Requirements',  required: true, source: 'curriculum' },
    ],
    optionalInputs: [
      { inputId: 'gate_evidence',    label: 'Gate Evidence',    required: false, source: 'player_gate_status' },
      { inputId: 'recent_sessions',  label: 'Recent Sessions',  required: false, source: 'session' },
      { inputId: 'coach_notes',      label: 'Coach Notes',      required: false, source: 'coach_note' },
    ],
    reasoningFields: [
      { fieldId: 'gate_gaps',              label: 'Gate Evidence Gaps',       description: 'Which curriculum gates have insufficient evidence across the group' },
      { fieldId: 'curriculum_next_steps',  label: 'Curriculum Next Steps',    description: 'What the curriculum spine says should come next for this level' },
      { fieldId: 'recent_focus_coverage',  label: 'Recent Focus Coverage',    description: 'Which curriculum areas have been covered in recent sessions vs. which are underrepresented' },
      { fieldId: 'missing_data',           label: 'Missing Data',             description: 'What data gaps reduce confidence in this suggestion' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'create_session_draft',
    createsDraftType: 'session_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  fitness_focus_suggestion: {
    suggestionType: 'fitness_focus_suggestion',
    label: 'Fitness Focus Suggestion',
    description:
      'Suggests what physical training focus area to prioritize for a group — based on assessment data, training load history, and tennis-transfer requirements.',
    requiredInputs: [
      { inputId: 'group_players',     label: 'Group Players',          required: true, source: 'player_profile' },
      { inputId: 'player_levels',     label: 'Player Levels',          required: true, source: 'player_curriculum_states' },
    ],
    optionalInputs: [
      { inputId: 'assessment_data',   label: 'Assessment Data',        required: false, source: 'assessment' },
      { inputId: 'load_history',      label: 'Training Load History',  required: false, source: 'session' },
      { inputId: 'recent_coach_notes',label: 'Recent Coach Notes',     required: false, source: 'coach_note' },
    ],
    reasoningFields: [
      { fieldId: 'physical_gap',         label: 'Physical Gap',            description: 'What physical areas are underrepresented in recent training based on session and template data' },
      { fieldId: 'tennis_transfer_need', label: 'Tennis Transfer Need',    description: 'What on-court movement or physical qualities the curriculum level requires' },
      { fieldId: 'load_balance',         label: 'Load Balance',            description: 'Whether recent training load is balanced across intensity levels or skewed toward one type' },
      { fieldId: 'missing_data',         label: 'Missing Data',            description: 'What data gaps reduce confidence in this suggestion' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'create_fitness_template_draft',
    createsDraftType: 'fitness_template_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

  attendance_risk_suggestion: {
    suggestionType: 'attendance_risk_suggestion',
    label: 'Attendance Risk Signal',
    description:
      'Flags a player or group showing attendance risk — based on consecutive absences, declining attendance rate, or patterns that historically correlate with player dropout.',
    requiredInputs: [
      { inputId: 'player_attendance',  label: 'Player Attendance',    required: true, source: 'attendance' },
      { inputId: 'player_status',      label: 'Player Status',        required: true, source: 'player_profile' },
    ],
    optionalInputs: [
      { inputId: 'recent_coach_notes', label: 'Recent Coach Notes',   required: false, source: 'coach_note' },
      { inputId: 'parent_contact',     label: 'Last Parent Contact',  required: false, source: 'parent_update' },
    ],
    reasoningFields: [
      { fieldId: 'consecutive_absences', label: 'Consecutive Absences', description: 'How many sessions in a row this player has missed' },
      { fieldId: 'attendance_rate',       label: 'Attendance Rate',       description: 'The percentage of scheduled sessions this player has attended over a defined period' },
      { fieldId: 'trend_direction',       label: 'Trend Direction',       description: 'Whether attendance is improving, stable, or declining' },
      { fieldId: 'last_parent_contact',   label: 'Last Parent Contact',   description: 'How long it has been since any communication with the parent was logged' },
      { fieldId: 'missing_data',          label: 'Missing Data',          description: 'What data gaps reduce the reliability of this signal' },
    ],
    confidenceLevels: ['low', 'medium', 'high'],
    recommendedActionType: 'draft_parent_update',
    createsDraftType: 'parent_update_draft',
    approvalRequired: true,
    explainabilityRequired: true,
  },

}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a suggestion contract by type. */
export function getSuggestionContract(
  suggestionType: DonnaSuggestionType,
): DonnaSuggestionContract | undefined {
  return DONNA_SUGGESTION_CONTRACTS[suggestionType]
}

/** Returns all suggestion types that require director approval before acting. */
export function getApprovalRequiredSuggestions(): DonnaSuggestionContract[] {
  return Object.values(DONNA_SUGGESTION_CONTRACTS).filter(
    s => s.approvalRequired,
  )
}

/** Returns all suggestion types that require explainability output. */
export function getExplainabilitySuggestions(): DonnaSuggestionContract[] {
  return Object.values(DONNA_SUGGESTION_CONTRACTS).filter(
    s => s.explainabilityRequired,
  )
}

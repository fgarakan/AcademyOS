// Sprint 242 — Voice Intake Draft Model V1
// Pure type definitions. No DB calls. No AI. No side effects.

// ── Role ─────────────────────────────────────────────────────────────────────

export type VoiceIntakeRole = 'academy_director' | 'head_coach' | 'coach'

// ── Context ──────────────────────────────────────────────────────────────────

export interface VoiceIntakeContext {
  page: 'command-center' | 'coach-session' | 'director-session' | 'other'
  session_id?: string
  group_id?: string
  academy_id: string
}

// ── Intent Types ─────────────────────────────────────────────────────────────

export type VoiceIntakeIntentType =
  // Director / Head Coach
  | 'create_session_draft'
  | 'create_group_draft'
  | 'set_group_focus'
  | 'create_player_review_request'
  | 'create_parent_safe_draft'
  | 'summarize_curriculum_gaps'
  | 'create_coach_briefing'
  | 'record_director_note'
  // Coach
  | 'record_attendance_exception'
  | 'flag_unrostered_attendee'
  | 'create_player_observation'
  | 'create_gate_evidence_draft'
  | 'create_session_recap'
  | 'create_gap_signal'
  | 'create_parent_safe_candidate'
  | 'alert_director'
  // Shared
  | 'unknown'

// ── Destination Modules ───────────────────────────────────────────────────────

export type VoiceDestinationModule =
  | 'attendance'
  | 'unrostered_attendee_review'
  | 'session_actual'
  | 'player_observation'
  | 'curriculum_evidence'
  | 'gap_engine'
  | 'parent_safe_draft'
  | 'player_mission'
  | 'director_review_queue'
  | 'session_planning'
  | 'group_planning'
  | 'coach_briefing'
  | 'curriculum_note'
  | 'director_note'

// ── Safety Flags ─────────────────────────────────────────────────────────────

export type VoiceSafetyFlag =
  | 'parent_exposure_risk'
  | 'auto_execution_requested'
  | 'level_change_requested'
  | 'parent_send_requested'
  | 'roster_mutation_requested'
  | 'billing_enrollment_risk'
  | 'cross_player_leak_risk'

// ── Extracted Entity ──────────────────────────────────────────────────────────

export interface VoiceExtractedEntity {
  type: 'player' | 'group' | 'curriculum_level' | 'session' | 'coach' | 'date' | 'focus' | 'unknown'
  value: string
  confidence: 'high' | 'medium' | 'low'
}

// ── Core Draft ────────────────────────────────────────────────────────────────

export interface VoiceIntakeDraft {
  // Identity
  role: VoiceIntakeRole
  context: VoiceIntakeContext

  // Input
  raw_transcript: string
  cleaned_summary: string

  // Classification
  detected_intents: VoiceIntakeIntentType[]
  confidence: 'high' | 'medium' | 'low'

  // Routing
  suggested_destinations: VoiceDestinationModule[]
  recommended_primary_action: string

  // Extracted context
  extracted_entities: VoiceExtractedEntity[]
  affected_players: string[]
  affected_groups: string[]
  affected_sessions: string[]
  curriculum_links: string[]
  gap_links: string[]

  // Review state
  requires_review: boolean
  safety_flags: VoiceSafetyFlag[]

  // Transparency
  what_would_change: string[]
  what_would_not_change: string[]
}

// ── Structuring Input / Result ────────────────────────────────────────────────

export interface VoiceIntakeStructureInput {
  role: VoiceIntakeRole
  transcript: string
  context: VoiceIntakeContext
}

export interface VoiceIntakeStructureResult {
  draft: VoiceIntakeDraft
  parse_warnings: string[]
}

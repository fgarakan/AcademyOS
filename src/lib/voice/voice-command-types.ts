/**
 * ACADEMY OS — VOICE COMMAND TYPES
 * TypeScript definitions for the voice-first pipeline.
 *
 * Architecture rule: Voice never directly mutates core data.
 * Pipeline: VoiceCommand → NormalizedIntent → ProposedAction → Approval → ExecutionResult
 */

// ─── INPUT ───────────────────────────────────────────────────

export type VoiceInputMethod = 'typed' | 'audio' | 'api';

export interface VoiceCommand {
  id: string;
  academy_id: string;
  issuer_id: string;
  issuer_role: UserRole;
  input_method: VoiceInputMethod;
  raw_input: string;
  audio_path?: string;           // V2: Supabase storage path
  transcript?: string;           // same as raw_input in V1; Whisper output in V2
  processing_status: VoiceProcessingStatus;
  normalized_intent?: NormalizedIntent;
  intent_confidence?: number;
  requires_clarification: boolean;
  context_snapshot?: AcademyContextSnapshot;
  created_at: string;
  processed_at?: string;
}

export type VoiceProcessingStatus =
  | 'pending'
  | 'normalizing'
  | 'normalized'
  | 'ambiguous'
  | 'failed';

// ─── INTENT ──────────────────────────────────────────────────

export type IntentType =
  | 'create_session'
  | 'modify_session'
  | 'cancel_session'
  | 'duplicate_session'
  | 'create_template'
  | 'modify_template'
  | 'create_placement_assessment'
  | 'move_player_group'
  | 'schedule_reassessment'
  | 'flag_player'
  | 'update_player_priorities'
  | 'adjust_intensity'
  | 'flag_overload'
  | 'create_program'
  | 'rebalance_schedule'
  | 'query_player'
  | 'query_group'
  | 'query_schedule'
  | 'generate_parent_update'
  | 'other';

export type TargetModule =
  | 'sessions'
  | 'templates'
  | 'players'
  | 'groups'
  | 'exercises'
  | 'assessments'
  | 'parent_updates'
  | 'placements';

export interface NormalizedIntent {
  intent_type: IntentType;
  confidence: number;                    // 0.0–1.0
  target_module: TargetModule;
  entities: Record<string, unknown>;     // extracted entities (group, date, player, etc.)
  missing_required: string[];            // fields that must be clarified
  ambiguous_fields: string[];            // fields that have multiple possible values
  is_query_only: boolean;                // true = no action, just information
}

// ─── CLARIFICATION ───────────────────────────────────────────

export type ClarificationQuestionType = 'choice' | 'confirmation' | 'input';

export interface ClarificationRequest {
  id: string;
  voice_command_id: string;
  question: string;
  question_type: ClarificationQuestionType;
  options?: string[];             // for 'choice' type
  required_fields: string[];
  response?: string;
  responded_at?: string;
  created_at: string;
}

// ─── PROPOSED ACTION ─────────────────────────────────────────

export type ActionType =
  | 'create_session'
  | 'modify_session'
  | 'cancel_session'
  | 'create_template'
  | 'modify_template'
  | 'assign_group'
  | 'create_placement_assessment'
  | 'move_player_group'
  | 'schedule_reassessment'
  | 'adjust_session_intensity'
  | 'generate_parent_update'
  | 'flag_player'
  | 'create_player'
  | 'create_exercise'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ProposedActionStatus =
  | 'pending_review'
  | 'clarification_needed'
  | 'approved'
  | 'modified'
  | 'rejected'
  | 'executed'
  | 'failed'
  | 'expired';

export interface ProposedAction {
  id: string;
  academy_id: string;
  voice_command_id: string;
  proposed_by_id: string;
  action_type: ActionType;
  action_label: string;            // human-readable: "Create session for Orange Dev on Monday"
  target_module: TargetModule;
  target_object_id?: string;
  target_object_type?: string;
  proposed_payload: Record<string, unknown>;
  risk_level: RiskLevel;
  risk_notes: string[];
  affected_count?: number;
  status: ProposedActionStatus;
  reviewer_notes?: string;
  modified_payload?: Record<string, unknown>;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// ─── APPROVAL ────────────────────────────────────────────────

export interface ActionApproval {
  action_id: string;
  approver_id: string;
  decision: 'approved' | 'modified' | 'rejected';
  modified_payload?: Record<string, unknown>;
  notes?: string;
  rejection_reason?: string;
}

// ─── EXECUTION ───────────────────────────────────────────────

export interface ExecutionResult {
  success: boolean;
  action_id: string;
  result?: Record<string, unknown>;
  objects_created?: string[];
  objects_modified?: string[];
  error?: string;
  executed_at: string;
}

// ─── CONTEXT ─────────────────────────────────────────────────

export interface AcademyContextSnapshot {
  current_date: string;
  current_week_start: string;
  active_groups: Array<{ id: string; name: string }>;
  active_coaches: Array<{ id: string; name: string }>;
  recent_sessions: Array<{ id: string; group_id: string; date: string }>;
  // snapshot of relevant academy state at time of voice command
}

// ─── SHARED TYPES ────────────────────────────────────────────

export type UserRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'player'
  | 'parent';

export type DevelopmentTrack = 'skill' | 'competition' | 'fitness' | 'combined';

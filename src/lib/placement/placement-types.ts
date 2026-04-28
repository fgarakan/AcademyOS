/**
 * ACADEMY OS — PLACEMENT ENGINE TYPES
 * TypeScript definitions for the new student placement system.
 *
 * Flow: PlacementAssessment → PlacementRecommendation → (override?) → Approval → PlayerActivationSummary
 */

import { DevelopmentTrack } from '../voice/voice-command-types';

// ─── ASSESSMENT ──────────────────────────────────────────────

export type AssessmentType = 'intake' | 'quarterly' | 'reassessment' | 'promotion' | 'ad_hoc';

/** Scores for one assessment layer. All values 0.0–10.0 */
export interface PlacementScoreLayer {
  overall: number;
  subcategories: Record<string, number>; // e.g., { forehand: 7.5, backhand: 8.0 }
}

export interface PlacementAssessment {
  id: string;
  academy_id: string;
  player_id: string;
  assessed_by: string;
  assessed_date: string;
  type: AssessmentType;
  is_baseline: boolean;

  // Four assessment layers
  technical: PlacementScoreLayer;
  tactical: PlacementScoreLayer;
  movement: PlacementScoreLayer;
  competition: PlacementScoreLayer;
  behavioral: PlacementScoreLayer;

  // Derived
  overall_score: number;

  // Narrative
  notes?: string;
  strengths: string[];
  weaknesses: string[];
  priorities: string[];

  // Promotion
  promotion_ready: boolean;
  promotion_notes?: string;

  // Voice source
  voice_command_id?: string;

  created_at: string;
}

// ─── RECOMMENDATION ──────────────────────────────────────────

export type PlacementStatus =
  | 'draft'
  | 'generated'
  | 'approved'
  | 'overridden'
  | 'rejected'
  | 'activated';

export interface PlacementRecommendation {
  id: string;
  academy_id: string;
  player_id: string;
  assessment_id?: string;
  status: PlacementStatus;

  // AI recommendation
  recommended_track: DevelopmentTrack;
  recommended_level_id: string;
  recommended_group_id: string;
  confidence_score: number;              // 0.0–1.0
  recommendation_rationale: string;
  recommendation_strengths: string[];
  recommendation_weaknesses: string[];
  recommended_priorities: string[];
  recommended_reassessment_weeks: number;

  // Human override (if set, these take precedence over recommendation)
  override_track?: DevelopmentTrack;
  override_level_id?: string;
  override_group_id?: string;
  override_reason?: string;
  overridden_by?: string;
  overridden_at?: string;

  // Approval
  approved_by?: string;
  approved_at?: string;

  // Activation
  activated_by?: string;
  activated_at?: string;

  // Source
  voice_command_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── OVERRIDE ────────────────────────────────────────────────

export interface PlacementOverride {
  recommendation_id: string;
  override_track?: DevelopmentTrack;
  override_level_id?: string;
  override_group_id?: string;
  reason: string;             // required — must explain why overriding
}

// ─── ACTIVATION ──────────────────────────────────────────────

/** Returned by finalize_player_placement() */
export interface PlayerActivationSummary {
  success: boolean;
  player_id: string;
  group_id: string;
  level_id: string;
  track: DevelopmentTrack;
  reassessment_due: string;
  activated_at: string;
  error?: string;
}

// ─── REASSESSMENT SCHEDULE ───────────────────────────────────

export interface ReassessmentSchedule {
  player_id: string;
  due_date: string;
  interval_weeks: number;
  is_overdue: boolean;
  days_until_due: number;
  last_assessed_at?: string;
}

// ─── RECOMMENDATION GENERATION INPUT ─────────────────────────

/** Passed to Claude when generating a placement recommendation */
export interface RecommendationInput {
  player: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    handedness?: string;
    notes?: string;
  };
  assessment: PlacementAssessment;
  academy: {
    levels: Array<{ id: string; level_number: number; label: string; track: DevelopmentTrack }>;
    groups: Array<{ id: string; name: string; level_id: string; max_players: number; current_count: number }>;
  };
}

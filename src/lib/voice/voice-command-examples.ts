/**
 * ACADEMY OS — VOICE COMMAND EXAMPLES
 * Sample voice commands and their expected structured payloads.
 * Used for testing, onboarding, and AI prompt engineering.
 */

import { NormalizedIntent, ProposedAction, ActionType } from './voice-command-types';

export interface VoiceCommandExample {
  input: string;
  normalized_intent: NormalizedIntent;
  proposed_action_label: string;
  proposed_payload: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high';
  clarification_needed: boolean;
  clarification_questions?: string[];
}

export const VOICE_COMMAND_EXAMPLES: VoiceCommandExample[] = [
  // ─── SESSION CREATION ──────────────────────────────────
  {
    input: "Build next week's orange-ball technical block.",
    normalized_intent: {
      intent_type: 'create_session',
      confidence: 0.82,
      target_module: 'sessions',
      entities: {
        group: 'Orange Development',
        date: 'next Monday',
        focus: 'technical',
        ball_type: 'orange',
      },
      missing_required: [],
      ambiguous_fields: ['date'], // need to resolve "next Monday" to ISO date
      is_query_only: false,
    },
    proposed_action_label: 'Create technical session for Orange Development on Monday',
    proposed_payload: {
      group_id: '[RESOLVED_GROUP_ID]',
      coach_id: '[RESOLVED_COACH_ID]',
      date: '[RESOLVED_DATE]',
      template_id: '[ORANGE_TECHNICAL_TEMPLATE_ID]',
      focus_tags: ['technical', 'orange-ball'],
    },
    risk_level: 'low',
    clarification_needed: false,
  },

  // ─── INTENSITY ADJUSTMENT ─────────────────────────────
  {
    input: "Reduce Thursday fitness intensity because matchplay is Saturday.",
    normalized_intent: {
      intent_type: 'adjust_intensity',
      confidence: 0.75,
      target_module: 'sessions',
      entities: {
        day: 'Thursday',
        track: 'fitness',
        reason: 'matchplay Saturday',
        direction: 'reduce',
      },
      missing_required: ['group', 'target_intensity'],
      ambiguous_fields: ['group'], // which group?
      is_query_only: false,
    },
    proposed_action_label: 'Reduce fitness intensity for [group] Thursday session',
    proposed_payload: {
      session_id: '[RESOLVED_SESSION_ID]',
      intensity_overrides: { fitness: 2 },
      override_note: 'Pre-matchplay day — lighter fitness load',
    },
    risk_level: 'low',
    clarification_needed: true,
    clarification_questions: [
      'Which group? (Elite-A, Performance-B, Green Development, Orange Beginners)',
      'How much lighter? (Scale 1–5. Current intensity is likely 4.)',
      'One-time change or update the template for recurring Thursdays?',
    ],
  },

  // ─── PLAYER PLACEMENT ─────────────────────────────────
  {
    input: "Create a placement assessment for Mateo, age 9, right-handed, beginner-intermediate, strong movement, inconsistent rally tolerance, good coachability.",
    normalized_intent: {
      intent_type: 'create_placement_assessment',
      confidence: 0.90,
      target_module: 'assessments',
      entities: {
        player_name: 'Mateo',
        age: 9,
        handedness: 'right',
        level_estimate: 'beginner-intermediate',
        strengths: ['movement'],
        weaknesses: ['rally_tolerance'],
        positive_traits: ['coachability'],
      },
      missing_required: ['last_name'],
      ambiguous_fields: [],
      is_query_only: false,
    },
    proposed_action_label: "Create placement assessment for Mateo (age 9)",
    proposed_payload: {
      player: {
        first_name: 'Mateo',
        date_of_birth: '[CALCULATED_FROM_AGE]',
        handedness: 'right',
      },
      assessment_draft: {
        movement: { overall: 7.5 },
        competition: { overall: 4.0 }, // limited rally tolerance
        behavioral: { overall: 8.0 }, // good coachability
        technical: { overall: 4.5 }, // beginner-intermediate estimate
        tactical: { overall: 3.5 },
      },
      initial_notes: 'Strong movement, inconsistent rally tolerance, good coachability',
    },
    risk_level: 'low',
    clarification_needed: true,
    clarification_questions: [
      "What is Mateo's last name?",
    ],
  },

  // ─── PLAYER MOVE ──────────────────────────────────────
  {
    input: "Move Sofia to Elite-A. She's been dominant in Performance-B for two months.",
    normalized_intent: {
      intent_type: 'move_player_group',
      confidence: 0.88,
      target_module: 'players',
      entities: {
        player: 'Sofia',
        target_group: 'Elite-A',
        reason: 'dominant in Performance-B for two months',
      },
      missing_required: [],
      ambiguous_fields: ['player'], // check if Sofia is unique in academy
      is_query_only: false,
    },
    proposed_action_label: "Move Sofia [LAST_NAME] to Elite-A",
    proposed_payload: {
      player_id: '[RESOLVED_PLAYER_ID]',
      group_id: '[ELITE_A_GROUP_ID]',
      reason: 'Dominant performance in Performance-B for 2+ months — promotion',
    },
    risk_level: 'medium',
    clarification_needed: false,
  },

  // ─── REASSESSMENT SCHEDULING ──────────────────────────
  {
    input: "Move Sofia's reassessment to next Friday.",
    normalized_intent: {
      intent_type: 'schedule_reassessment',
      confidence: 0.94,
      target_module: 'players',
      entities: {
        player: 'Sofia',
        date: 'next Friday',
      },
      missing_required: [],
      ambiguous_fields: ['date'], // resolve "next Friday" to ISO date
      is_query_only: false,
    },
    proposed_action_label: "Schedule reassessment for Sofia on [RESOLVED_DATE]",
    proposed_payload: {
      player_id: '[RESOLVED_PLAYER_ID]',
      date: '[RESOLVED_DATE]',
    },
    risk_level: 'low',
    clarification_needed: false,
  },

  // ─── PROGRAM BUILDING ─────────────────────────────────
  {
    input: "Create a 4-week progression focused on serve and confidence routines for Elite-A.",
    normalized_intent: {
      intent_type: 'create_program',
      confidence: 0.85,
      target_module: 'templates',
      entities: {
        group: 'Elite-A',
        duration: '4 weeks',
        focus: ['serve', 'confidence routines'],
      },
      missing_required: [],
      ambiguous_fields: [],
      is_query_only: false,
    },
    proposed_action_label: "Create 4-week serve + confidence program for Elite-A",
    proposed_payload: {
      group_id: '[ELITE_A_GROUP_ID]',
      name: 'Elite-A: Serve + Confidence — 4 Week Block',
      duration_weeks: 4,
      focus_areas: ['serve_mechanics', 'serve_placement', 'confidence', 'match_pressure'],
      template_count: 4, // one per week
    },
    risk_level: 'low',
    clarification_needed: false,
  },

  // ─── OVERLOAD FLAGGING ────────────────────────────────
  {
    input: "Flag overload where skills, competition, and fitness are all high this week.",
    normalized_intent: {
      intent_type: 'flag_overload',
      confidence: 0.91,
      target_module: 'sessions',
      entities: {
        scope: 'all groups',
        week: 'current week',
        tracks: ['skill', 'competition', 'fitness'],
        threshold: 'high',
      },
      missing_required: [],
      ambiguous_fields: [],
      is_query_only: true, // this is a query + flag, not a mutation
    },
    proposed_action_label: "Scan all groups for high-intensity overload this week",
    proposed_payload: {
      week_start: '[CURRENT_WEEK_START]',
      intensity_threshold: 4,
      tracks_to_check: ['skill', 'competition', 'fitness'],
    },
    risk_level: 'low',
    clarification_needed: false,
  },

  // ─── QUERY (no action) ────────────────────────────────
  {
    input: "Show me why Mateo is in Orange Development.",
    normalized_intent: {
      intent_type: 'query_player',
      confidence: 0.95,
      target_module: 'players',
      entities: {
        player: 'Mateo',
        query_focus: 'placement_rationale',
      },
      missing_required: [],
      ambiguous_fields: [],
      is_query_only: true,
    },
    proposed_action_label: "Show placement rationale for Mateo",
    proposed_payload: {
      player_id: '[RESOLVED_PLAYER_ID]',
      query_type: 'placement_rationale',
    },
    risk_level: 'low',
    clarification_needed: false,
  },
];

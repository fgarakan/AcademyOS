/**
 * ACADEMY OS — PROPOSED ACTION VALIDATOR
 * Validates proposed actions before they reach the approval queue.
 * This runs BEFORE storing to the database.
 * Does NOT execute anything. Does NOT modify any records.
 */

import { ActionType, ProposedAction, RiskLevel } from '../voice/voice-command-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing_clarifications: string[];
  computed_risk_level: RiskLevel;
  computed_affected_count: number;
}

/** Required fields per action type */
const REQUIRED_FIELDS: Record<ActionType, string[]> = {
  create_session: ['group_id', 'coach_id', 'date'],
  modify_session: ['session_id'],
  create_template: ['name', 'group_id'],
  modify_template: ['template_id'],
  assign_group: ['player_id', 'group_id'],
  create_placement_assessment: ['player_id'],
  move_player_group: ['player_id', 'group_id'],
  schedule_reassessment: ['player_id', 'date'],
  adjust_session_intensity: ['session_id', 'intensity'],
  generate_parent_update: ['player_id'],
  flag_player: ['player_id', 'flag_type'],
  create_player: ['first_name', 'last_name', 'date_of_birth'],
  create_exercise: ['name', 'category'],
  cancel_session: ['session_id'],
  other: [],
};

/** Actions that affect multiple objects → higher risk */
const HIGH_RISK_ACTIONS: ActionType[] = [
  'move_player_group',
  'assign_group',
  'modify_template', // affects all future sessions using this template
];

const MEDIUM_RISK_ACTIONS: ActionType[] = [
  'modify_session',
  'adjust_session_intensity',
  'schedule_reassessment',
  'cancel_session',
];

export function validateProposedAction(
  action_type: ActionType,
  payload: Record<string, unknown>,
  affected_count = 1
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing_clarifications: string[] = [];

  // Check required fields
  const required = REQUIRED_FIELDS[action_type] ?? [];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      missing_clarifications.push(field);
    }
  }

  // Date validation
  if (payload.date && typeof payload.date === 'string') {
    const parsed = new Date(payload.date);
    if (isNaN(parsed.getTime())) {
      errors.push(`Invalid date: "${payload.date}". Expected ISO format (YYYY-MM-DD).`);
    }
    if (parsed < new Date(new Date().setHours(0, 0, 0, 0))) {
      warnings.push('Date is in the past. Confirm this is intentional.');
    }
  }

  // Intensity validation
  if (payload.intensity !== undefined) {
    const intensity = Number(payload.intensity);
    if (isNaN(intensity) || intensity < 1 || intensity > 5) {
      errors.push('Intensity must be between 1 (Low) and 5 (Maximum).');
    }
  }

  // Player ID required for player-specific actions
  if (
    ['flag_player', 'generate_parent_update', 'schedule_reassessment'].includes(action_type) &&
    !payload.player_id
  ) {
    missing_clarifications.push('player_id');
  }

  // Compute risk level
  let computed_risk_level: RiskLevel = 'low';
  if (HIGH_RISK_ACTIONS.includes(action_type) || affected_count >= 6) {
    computed_risk_level = 'high';
  } else if (MEDIUM_RISK_ACTIONS.includes(action_type) || affected_count >= 2) {
    computed_risk_level = 'medium';
  }

  // High affected count warning
  if (affected_count > 20) {
    warnings.push(`This action affects ${affected_count} objects. Review carefully before approving.`);
  }

  // Template modification warning
  if (action_type === 'modify_template') {
    warnings.push(
      'Modifying a template changes all future sessions that use it. ' +
      'Existing sessions already created from this template are NOT affected.'
    );
  }

  return {
    valid: errors.length === 0 && missing_clarifications.length === 0,
    errors,
    warnings,
    missing_clarifications,
    computed_risk_level,
    computed_affected_count: affected_count,
  };
}

/** Generate a human-readable action label from action type and payload */
export function generateActionLabel(
  action_type: ActionType,
  payload: Record<string, unknown>,
  entityNames: {
    group_name?: string;
    player_name?: string;
    template_name?: string;
    session_date?: string;
    coach_name?: string;
  } = {}
): string {
  const {
    group_name = 'selected group',
    player_name = 'selected player',
    template_name = 'selected template',
    session_date = payload.date as string ?? 'scheduled date',
    coach_name = 'assigned coach',
  } = entityNames;

  switch (action_type) {
    case 'create_session':
      return `Create session for ${group_name} on ${session_date}`;
    case 'modify_session':
      return `Modify session on ${session_date} for ${group_name}`;
    case 'create_template':
      return `Create new template: "${payload.name ?? 'Untitled'}"`;
    case 'modify_template':
      return `Modify template: "${template_name}"`;
    case 'assign_group':
      return `Assign ${player_name} to ${group_name}`;
    case 'move_player_group':
      return `Move ${player_name} to ${group_name}`;
    case 'create_placement_assessment':
      return `Create placement assessment for ${player_name}`;
    case 'schedule_reassessment':
      return `Schedule reassessment for ${player_name} on ${session_date}`;
    case 'adjust_session_intensity':
      return `Adjust intensity for ${group_name} session on ${session_date}`;
    case 'generate_parent_update':
      return `Generate parent update for ${player_name}`;
    case 'flag_player':
      return `Flag ${player_name}: ${payload.flag_type ?? 'unspecified'}`;
    case 'create_player':
      return `Create player: ${player_name}`;
    case 'create_exercise':
      return `Create exercise: "${payload.name ?? 'Untitled'}"`;
    default:
      return `${action_type.replace(/_/g, ' ')} action`;
  }
}

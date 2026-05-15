// Sprint 363 — Donna Role Permission Matrix V1
// Pure utility. No React, no DB, no API.
// Defines what roles can approve what types of Donna actions.

// ── Types ──────────────────────────────────────────────────────────────────────

export type DonnaActionCategory =
  | 'curriculum'
  | 'communication'
  | 'scheduling'
  | 'player_management'
  | 'coach_management'
  | 'billing'
  | 'reporting'

// ── Permission matrix ──────────────────────────────────────────────────────────
// Maps each role to the set of action categories it can approve.

export const ROLE_PERMISSION_MATRIX: Record<string, Set<DonnaActionCategory>> = {
  academy_director: new Set<DonnaActionCategory>([
    'curriculum',
    'communication',
    'scheduling',
    'player_management',
    'coach_management',
    'billing',
    'reporting',
  ]),
  head_coach: new Set<DonnaActionCategory>([
    'curriculum',
    'scheduling',
    'reporting',
  ]),
  coach: new Set<DonnaActionCategory>([
    'reporting',
  ]),
  player: new Set<DonnaActionCategory>([]),
  parent: new Set<DonnaActionCategory>([]),
}

// ── Workflow → Category mapping ────────────────────────────────────────────────
// Maps workflowId strings to their action category.

export const WORKFLOW_CATEGORY_MAP: Record<string, DonnaActionCategory> = {
  class_template_creation: 'curriculum',
  draft_parent_update:     'communication',
  draft_coach_communication: 'communication',
  create_session:          'scheduling',
  handle_attendance_exception: 'scheduling',
  review_level_readiness:  'player_management',
  adjust_curriculum:       'curriculum',
  move_player_level:       'player_management',
  capture_coach_note:      'reporting',
  draft_player_note:       'reporting',
  create_fitness_template: 'curriculum',
  populate_session_from_template: 'scheduling',
  execute_billing:         'billing',
  send_parent_message:     'communication',
  send_coach_message:      'communication',
  update_curriculum:       'curriculum',
  record_attendance:       'scheduling',
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role can approve the given action category.
 */
export function canRoleApprove(role: string, category: DonnaActionCategory): boolean {
  const perms = ROLE_PERMISSION_MATRIX[role]
  if (!perms) return false
  return perms.has(category)
}

/**
 * Returns the minimum role string required to approve a given workflow.
 * Falls back to 'academy_director' for unknown workflows (most restrictive).
 */
export function getRequiredRoleForWorkflow(workflowId: string): string {
  const category = WORKFLOW_CATEGORY_MAP[workflowId]
  if (!category) return 'academy_director'

  // Return the least-privileged role that has access to this category
  if (ROLE_PERMISSION_MATRIX['coach']?.has(category)) return 'coach'
  if (ROLE_PERMISSION_MATRIX['head_coach']?.has(category)) return 'head_coach'
  return 'academy_director'
}

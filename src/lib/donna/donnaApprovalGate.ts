// Sprint 914.10 — DONNA Backend Approval Enforcement V1
// Defines backend approval gate helpers for DONNA operating spine.
// These helpers classify actions by required approval level and block unsafe execution.
//
// Design:
//   - Complements the existing proposed_actions state machine (migration 009)
//   - Does NOT replace Sprint 904 approve/reject paths
//   - Curriculum draft path remains pending_review only
//   - All high-risk actions require at minimum review_queue level
//
// Pure TypeScript — no DB calls, no side effects, no mutations.
// Server-side functions wrap these for actual enforcement.

// ── Approval levels ────────────────────────────────────────────────────────────

export type DonnaApprovalLevel =
  | 'none'                  // Read-only, no state change
  | 'confirmation'          // Frontend confirmation only (Sprint 912.x pattern)
  | 'review_queue'          // Must go to proposed_actions / curriculum review queue
  | 'director_approval'     // Requires explicit director approval action
  | 'platform_owner'        // Requires platform owner beyond director scope

// ── Action categories with required approval levels ───────────────────────────

const APPROVAL_REQUIREMENTS: Record<string, DonnaApprovalLevel> = {
  // Curriculum changes → review_queue (academy_curriculum_overrides pending_review)
  curriculum_edit:               'review_queue',
  curriculum_draft_create:       'review_queue',
  // Level movement → director_approval
  level_movement:                'director_approval',
  player_level_change:           'director_approval',
  // Parent/player communication → director_approval
  parent_communication:          'director_approval',
  parent_message_send:           'director_approval',
  player_summary_publish:        'director_approval',
  // Assessments → director_approval
  assessment_official_update:    'director_approval',
  placement_change:              'director_approval',
  // Templates → review_queue
  template_publish:              'review_queue',
  template_assign_session:       'review_queue',
  // Settings → director_approval or platform_owner
  academy_settings_change:       'director_approval',
  academy_wide_settings:         'platform_owner',
  // Attendance → review_queue (proposed_actions)
  attendance_exception:          'review_queue',
  // Sessions → confirmation
  session_cancel:                'confirmation',
  session_reschedule:            'confirmation',
  // Read-only
  explain:                       'none',
  summarize:                     'none',
  recommend:                     'none',
  navigate:                      'none',
  draft_preview:                 'none',
}

// ── Gate result ────────────────────────────────────────────────────────────────

export interface DonnaGateResult {
  allowed: boolean
  requiredApprovalLevel: DonnaApprovalLevel
  reason: string
  suggestedPath: string | null
}

// ── assertDonnaApprovalAllowed ────────────────────────────────────────────────

/**
 * Checks whether a DONNA action can proceed given the approval context.
 * Returns allowed=true only for actions where approval level is satisfied.
 * All high-risk actions (level_movement, parent comms, etc.) return allowed=false
 * unless the approval level has already been satisfied externally.
 */
export function assertDonnaApprovalAllowed(
  actionCategory: string,
  currentApprovalLevel: DonnaApprovalLevel = 'none',
): DonnaGateResult {
  const required = APPROVAL_REQUIREMENTS[actionCategory] ?? 'director_approval'
  const levelOrder: DonnaApprovalLevel[] = ['none', 'confirmation', 'review_queue', 'director_approval', 'platform_owner']
  const satisfies = levelOrder.indexOf(currentApprovalLevel) >= levelOrder.indexOf(required)

  if (satisfies) {
    return { allowed: true, requiredApprovalLevel: required, reason: 'Approval level satisfied.', suggestedPath: null }
  }

  const reasons: Record<DonnaApprovalLevel, string> = {
    none:              'No approval required.',
    confirmation:      'Requires director confirmation before execution.',
    review_queue:      'Must go through the Review Center before any effect.',
    director_approval: 'Requires explicit director approval — DONNA cannot execute automatically.',
    platform_owner:    'Requires platform owner authorization beyond director scope.',
  }

  const paths: Record<DonnaApprovalLevel, string | null> = {
    none:              null,
    confirmation:      '/director/donna',
    review_queue:      '/director/review',
    director_approval: '/director/review',
    platform_owner:    null,
  }

  return {
    allowed: false,
    requiredApprovalLevel: required,
    reason: reasons[required],
    suggestedPath: paths[required],
  }
}

// ── requireDonnaApproval ──────────────────────────────────────────────────────

/**
 * Returns a structured approval requirement for an action.
 * Does NOT throw — returns a gate result that callers use to decide routing.
 */
export function requireDonnaApproval(actionCategory: string): {
  requiredLevel: DonnaApprovalLevel
  isHighRisk: boolean
  canBeProposed: boolean
  approvalRoute: string | null
} {
  const required = APPROVAL_REQUIREMENTS[actionCategory] ?? 'director_approval'
  const highRiskLevels: DonnaApprovalLevel[] = ['director_approval', 'platform_owner']
  const isHighRisk = highRiskLevels.includes(required)
  const canBeProposed = required === 'review_queue' || required === 'confirmation'

  return {
    requiredLevel: required,
    isHighRisk,
    canBeProposed,
    approvalRoute: required === 'none' ? null : '/director/review',
  }
}

// ── blockUnsafeDonnaAction ────────────────────────────────────────────────────

/**
 * Returns a DONNA-safe blocked response for actions that must never proceed.
 * Used to stop execution of unsafe actions and return a clear explanation.
 */
export function blockUnsafeDonnaAction(
  actionCategory: string,
  context?: string,
): {
  blocked: boolean
  explanation: string
  safeAlternative: string | null
} {
  const gate = assertDonnaApprovalAllowed(actionCategory)

  if (gate.allowed) {
    return { blocked: false, explanation: 'Action is permitted.', safeAlternative: null }
  }

  const explanations: Record<DonnaApprovalLevel, string> = {
    none:              'This action is read-only.',
    confirmation:      'This action requires your confirmation before DONNA can proceed.',
    review_queue:      'This action must go through the Review Center. DONNA will create a draft for your review.',
    director_approval: `This action requires your explicit approval${context ? ` (${context})` : ''}. DONNA cannot execute it automatically.`,
    platform_owner:    'This action requires platform owner authorization. DONNA cannot initiate it.',
  }

  const alternatives: Record<DonnaApprovalLevel, string | null> = {
    none:              null,
    confirmation:      'Confirm the action in the DONNA conversation to proceed.',
    review_queue:      'Ask DONNA to create a draft, then approve it in the Review Center.',
    director_approval: 'Use the Review Center to approve this action after reviewing the proposal.',
    platform_owner:    null,
  }

  return {
    blocked: true,
    explanation: explanations[gate.requiredApprovalLevel],
    safeAlternative: alternatives[gate.requiredApprovalLevel],
  }
}

// ── High-risk action list (for quick checks) ───────────────────────────────────

export const HIGH_RISK_ACTION_CATEGORIES = Object.entries(APPROVAL_REQUIREMENTS)
  .filter(([, level]) => level === 'director_approval' || level === 'platform_owner')
  .map(([category]) => category)

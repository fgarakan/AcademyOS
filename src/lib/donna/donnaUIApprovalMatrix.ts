// Sprint 753 — DONNA Site-Wide UI Approval Matrix V1
// Formal role/action approval matrix for the DONNA UI Operator certification.
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
//
// This matrix answers: for each role and UI action class, what can DONNA do?
// It is the authoritative reference for the certification document.

import type { UIActionRole, UIActionSafetyClass } from './donnaUIActionRegistry'
import {
  DONNA_UI_ACTIONS,
  canDonnaPerformUIAction,
  getUIActionsByRole,
  getDraftToReviewActions,
  getDirectorApprovalActions,
  getAlwaysBlockedActions,
} from './donnaUIActionRegistry'

// ── Matrix cell ───────────────────────────────────────────────────────────────

export type MatrixPermission =
  | 'ALLOWED'         // DONNA can perform this action class for this role
  | 'DRAFT_ONLY'      // DONNA creates a draft; director must approve
  | 'ROUTE_TO_REVIEW' // DONNA explains and routes to /director/review; cannot execute
  | 'BLOCKED'         // DONNA refuses with a boundary response
  | 'NOT_APPLICABLE'  // This role does not have access to this domain

// ── The matrix ────────────────────────────────────────────────────────────────

export interface ApprovalMatrixRow {
  safetyClass: UIActionSafetyClass
  label: string
  description: string
  academy_director: MatrixPermission
  head_coach: MatrixPermission
  coach: MatrixPermission
  player: MatrixPermission
  parent: MatrixPermission
  approvalPath: string
  example: string
}

export const DONNA_UI_APPROVAL_MATRIX: ApprovalMatrixRow[] = [
  {
    safetyClass: 'always_safe',
    label: 'Always Safe',
    description: 'Navigation, panel control, expand/collapse, filter/sort/search. No state change.',
    academy_director: 'ALLOWED',
    head_coach: 'ALLOWED',
    coach: 'ALLOWED',
    player: 'ALLOWED',
    parent: 'ALLOWED',
    approvalPath: 'None — DONNA executes directly.',
    example: 'Take me to players. Open the review center. Filter to Orange 2.',
  },
  {
    safetyClass: 'safe_with_context',
    label: 'Safe With Context',
    description: 'Builder launch, guided flow start, onboarding step advance. Page and role guard must pass.',
    academy_director: 'ALLOWED',
    head_coach: 'ALLOWED',
    coach: 'ALLOWED',
    player: 'NOT_APPLICABLE',
    parent: 'NOT_APPLICABLE',
    approvalPath: 'Role + page guard verified. No approval gate for the navigation itself.',
    example: 'Help me set up the academy. Open the curriculum builder. Start wrap-up.',
  },
  {
    safetyClass: 'draft_to_review',
    label: 'Draft → Review',
    description: 'Consequential actions that create a proposed_actions row. Director reviews and approves before any official change.',
    academy_director: 'DRAFT_ONLY',
    head_coach: 'DRAFT_ONLY',
    coach: 'DRAFT_ONLY',
    player: 'BLOCKED',
    parent: 'BLOCKED',
    approvalPath: 'DONNA creates draft in proposed_actions → director approves at /director/review → execute_approved_action() fires.',
    example: 'Draft an attendance exception. Create a session template. Propose a level change.',
  },
  {
    safetyClass: 'director_approval',
    label: 'Director Approval Required',
    description: 'High-consequence actions. DONNA explains, creates draft or routes to review queue, but cannot execute.',
    academy_director: 'ROUTE_TO_REVIEW',
    head_coach: 'BLOCKED',
    coach: 'BLOCKED',
    player: 'BLOCKED',
    parent: 'BLOCKED',
    approvalPath: 'DONNA routes to /director/review. Director clicks Approve. execute_approved_action() fires.',
    example: 'Approve this review item. Move player to next level. Publish curriculum.',
  },
  {
    safetyClass: 'platform_required',
    label: 'Platform Owner Required',
    description: 'Requires platform-level access beyond academy director scope.',
    academy_director: 'BLOCKED',
    head_coach: 'BLOCKED',
    coach: 'BLOCKED',
    player: 'BLOCKED',
    parent: 'BLOCKED',
    approvalPath: 'DONNA explains this requires platform support. Cannot route within AcademyOS.',
    example: 'Change billing plan. Grant system-level permissions.',
  },
  {
    safetyClass: 'always_blocked',
    label: 'Always Blocked',
    description: 'Architecture invariants. Direct mutations, PII exposure, cross-tenant access, approval bypass.',
    academy_director: 'BLOCKED',
    head_coach: 'BLOCKED',
    coach: 'BLOCKED',
    player: 'BLOCKED',
    parent: 'BLOCKED',
    approvalPath: 'DONNA returns a hard boundary response. No action, no routing, no draft.',
    example: 'Send a message directly. Delete a record. Expose raw notes. Skip the review queue.',
  },
]

// ── Role capability summary ───────────────────────────────────────────────────

export interface RoleCapabilitySummary {
  role: UIActionRole
  roleLabel: string
  allowedActionCount: number
  draftActionCount: number
  blockedActionCount: number
  approvalRequiredCount: number
  primaryDomains: string[]
  notes: string
}

export const ROLE_CAPABILITY_SUMMARIES: RoleCapabilitySummary[] = [
  {
    role: 'academy_director',
    roleLabel: 'Academy Director',
    allowedActionCount: 0, // computed below
    draftActionCount: 0,
    blockedActionCount: 0,
    approvalRequiredCount: 0,
    primaryDomains: ['navigation', 'onboarding', 'curriculum', 'templates', 'sessions', 'players', 'review_queue', 'coaches', 'parents', 'kpi', 'signals'],
    notes: 'Full DONNA UI operator access. All draft and review paths available. Approval gates enforced for consequential actions.',
  },
  {
    role: 'head_coach',
    roleLabel: 'Head Coach',
    allowedActionCount: 0,
    draftActionCount: 0,
    blockedActionCount: 0,
    approvalRequiredCount: 0,
    primaryDomains: ['navigation', 'sessions', 'players', 'templates'],
    notes: 'DONNA guides session management, wrap-up, and player observations. Director-only actions blocked with clear explanation.',
  },
  {
    role: 'coach',
    roleLabel: 'Coach',
    allowedActionCount: 0,
    draftActionCount: 0,
    blockedActionCount: 0,
    approvalRequiredCount: 0,
    primaryDomains: ['navigation', 'sessions'],
    notes: 'DONNA guides session execution and wrap-up. Curriculum, review queue, and player level actions blocked.',
  },
  {
    role: 'player',
    roleLabel: 'Player',
    allowedActionCount: 0,
    draftActionCount: 0,
    blockedActionCount: 0,
    approvalRequiredCount: 0,
    primaryDomains: ['navigation'],
    notes: 'Only navigation and safe context reading. No draft or approval actions available.',
  },
  {
    role: 'parent',
    roleLabel: 'Parent',
    allowedActionCount: 0,
    draftActionCount: 0,
    blockedActionCount: 0,
    approvalRequiredCount: 0,
    primaryDomains: ['navigation'],
    notes: 'Only navigation. All data access role-gated. Coach notes and raw player data always blocked.',
  },
]

// ── Compute role counts ───────────────────────────────────────────────────────

for (const summary of ROLE_CAPABILITY_SUMMARIES) {
  const actions = getUIActionsByRole(summary.role)
  summary.allowedActionCount = actions.filter(
    a => a.safetyClass === 'always_safe' || a.safetyClass === 'safe_with_context'
  ).length
  summary.draftActionCount = actions.filter(a => a.safetyClass === 'draft_to_review').length
  summary.blockedActionCount = DONNA_UI_ACTIONS.filter(
    a => !a.allowedRoles.includes(summary.role) || a.safetyClass === 'always_blocked'
  ).length
  summary.approvalRequiredCount = actions.filter(a => a.requiresApproval).length
}

// ── High-risk action summary ──────────────────────────────────────────────────

export interface HighRiskActionSummary {
  actionId: string
  displayName: string
  riskReason: string
  donnaResponse: string
  approvalPath: string
}

export const HIGH_RISK_ACTIONS: HighRiskActionSummary[] = [
  {
    actionId: 'approve_review_item',
    displayName: 'Approve review item',
    riskReason: 'Executing an approval triggers execute_approved_action() — an official state change.',
    donnaResponse: 'I can show you the pending item and navigate to your review queue, but approval is your click.',
    approvalPath: '/director/review → director clicks Approve → execute_approved_action()',
  },
  {
    actionId: 'move_player_level',
    displayName: 'Move player level',
    riskReason: 'Level changes affect curriculum assignment, training plans, and parent visibility.',
    donnaResponse: 'I can draft a level change proposal. You review and approve it in the review center.',
    approvalPath: 'DONNA draft → proposed_actions → director review → finalize_player_placement()',
  },
  {
    actionId: 'publish_curriculum',
    displayName: 'Publish curriculum',
    riskReason: 'Publishing curriculum affects all players in the current cohort.',
    donnaResponse: 'I can help you build curriculum. Publishing requires your confirmation in the curriculum builder.',
    approvalPath: 'DONNA drafts changes → director confirms in builder → official curriculum updated',
  },
  {
    actionId: 'draft_parent_summary',
    displayName: 'Draft parent progress update',
    riskReason: 'Parent communications contain player data and affect trust relationship.',
    donnaResponse: 'I can draft a parent update. You review it before it\'s sent — DONNA never sends automatically.',
    approvalPath: 'DONNA draft → proposed_actions → director review → director sends manually',
  },
  {
    actionId: 'send_parent_message_direct',
    displayName: 'Send message to parent directly',
    riskReason: 'Direct outbound communication. Architecture invariant: always requires director approval.',
    donnaResponse: 'I never send messages directly. I can draft it for your review.',
    approvalPath: 'ALWAYS BLOCKED at DONNA level. Draft → director review → director sends.',
  },
  {
    actionId: 'bypass_approval_queue',
    displayName: 'Bypass review queue',
    riskReason: 'Architecture invariant violation. execute_approved_action() must never be called without prior approval.',
    donnaResponse: 'I can\'t skip the review queue. The review step is how AcademyOS keeps your academy safe.',
    approvalPath: 'ALWAYS BLOCKED. No draft, no routing, no action.',
  },
]

// ── Lookup utilities ──────────────────────────────────────────────────────────

export function getMatrixRowBySafetyClass(
  safetyClass: UIActionSafetyClass,
): ApprovalMatrixRow | undefined {
  return DONNA_UI_APPROVAL_MATRIX.find(r => r.safetyClass === safetyClass)
}

export function getRoleCapabilitySummary(role: UIActionRole): RoleCapabilitySummary | undefined {
  return ROLE_CAPABILITY_SUMMARIES.find(s => s.role === role)
}

export function canRolePerformClass(
  role: UIActionRole,
  safetyClass: UIActionSafetyClass,
): MatrixPermission {
  const row = getMatrixRowBySafetyClass(safetyClass)
  if (!row) return 'BLOCKED'
  return row[role] as MatrixPermission
}

// ── Quick validation ──────────────────────────────────────────────────────────

/**
 * Given a role and an action id, returns whether DONNA can perform the action
 * and what the approval path is.
 */
export function evaluateUIAction(
  actionId: string,
  role: UIActionRole,
): {
  permitted: boolean
  matrixPermission: MatrixPermission
  approvalPath: string
  reason: string
} {
  const { allowed, reason } = canDonnaPerformUIAction(actionId, role)
  if (!allowed) {
    return {
      permitted: false,
      matrixPermission: 'BLOCKED',
      approvalPath: 'None — action blocked.',
      reason: reason ?? 'Action not permitted.',
    }
  }

  const action = DONNA_UI_ACTIONS.find(a => a.id === actionId)
  if (!action) {
    return {
      permitted: false,
      matrixPermission: 'BLOCKED',
      approvalPath: 'None.',
      reason: 'Action not found.',
    }
  }

  const matrixRow = getMatrixRowBySafetyClass(action.safetyClass)
  const matrixPermission = matrixRow ? (matrixRow[role] as MatrixPermission) : 'BLOCKED'

  return {
    permitted: matrixPermission !== 'BLOCKED',
    matrixPermission,
    approvalPath: matrixRow?.approvalPath ?? 'Unknown.',
    reason: matrixPermission === 'DRAFT_ONLY'
      ? 'DONNA will create a draft for director review.'
      : matrixPermission === 'ROUTE_TO_REVIEW'
      ? 'DONNA will route to the director review queue.'
      : matrixPermission === 'ALLOWED'
      ? 'DONNA can perform this action directly.'
      : 'Action blocked for this role.',
  }
}

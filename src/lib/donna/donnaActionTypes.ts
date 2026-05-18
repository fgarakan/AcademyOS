// Sprint 1020 — DONNA Action Classification V1
// Full taxonomy of DONNA action types, classification rules, and metadata.
// Extends donnaRoleBoundaries (Sprint pre-1002) and donnaQuickActions (Sprint 1009).
// No DB calls. No DB writes.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'

// ── Action safety class ───────────────────────────────────────────────────────

export type DonnaActionSafetyClass =
  | 'safe_read'         // Read-only — surfaces data, no state change
  | 'draft_only'        // Creates a draft in proposed_actions — requires director review
  | 'requires_approval' // Proposes a consequential action — blocked until director approves
  | 'blocked_for_role'  // Explicitly forbidden for this role
  | 'future_capability' // Not yet built

// ── Action risk level ─────────────────────────────────────────────────────────

export type DonnaActionRiskLevel = 'none' | 'low' | 'medium' | 'high'

// ── Action domain ─────────────────────────────────────────────────────────────

export type DonnaActionDomain =
  | 'session'
  | 'attendance'
  | 'observation'
  | 'template'
  | 'curriculum'
  | 'player_profile'
  | 'parent_message'
  | 'roster'
  | 'review_queue'
  | 'academy_health'
  | 'coach_support'
  | 'wrap_up'

// ── Action definition ─────────────────────────────────────────────────────────

export interface DonnaActionDefinition {
  id: string
  label: string
  description: string
  domain: DonnaActionDomain
  safetyClass: DonnaActionSafetyClass
  riskLevel: DonnaActionRiskLevel
  allowedRoles: DonnaRole[]
  blockedRoles: DonnaRole[]
  blockedReason: string | null
  requiresApprovalFrom: 'director' | null
  proposedActionModule: string | null
  safetyNote: string | null
  href: string | null
  isBuilt: boolean
}

// ── Action registry ───────────────────────────────────────────────────────────

export const DONNA_ACTIONS: DonnaActionDefinition[] = [
  // ── Safe reads (Director) ─────────────────────────────────────────────────

  {
    id: 'summarize_today',
    label: 'Summarize today',
    description: 'Show today\'s sessions, player count, wrap-up coverage, and pending reviews.',
    domain: 'session',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/director/donna',
    isBuilt: true,
  },
  {
    id: 'show_pending_reviews',
    label: 'Show pending reviews',
    description: 'List all items awaiting director decision.',
    domain: 'review_queue',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/director/review',
    isBuilt: true,
  },
  {
    id: 'academy_risks',
    label: 'Academy risks',
    description: 'Show current risk signals: attendance gaps, missing wrap-ups, stalled players.',
    domain: 'academy_health',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/director/donna',
    isBuilt: true,
  },
  {
    id: 'inspect_player',
    label: 'Inspect a player',
    description: 'Open a player\'s development summary and recent observations.',
    domain: 'player_profile',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/director/players',
    isBuilt: true,
  },
  {
    id: 'review_templates',
    label: 'Review templates',
    description: 'Browse session templates and their curriculum alignment.',
    domain: 'template',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/director/templates',
    isBuilt: true,
  },

  // ── Coach safe reads ──────────────────────────────────────────────────────

  {
    id: 'start_session',
    label: 'Start session',
    description: 'Open today\'s session plan.',
    domain: 'session',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['coach'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/coach/sessions',
    isBuilt: true,
  },
  {
    id: 'mark_attendance',
    label: 'Mark attendance',
    description: 'Record which players are present for this session.',
    domain: 'attendance',
    safetyClass: 'safe_read',
    riskLevel: 'none',
    allowedRoles: ['coach'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: null,
    href: '/coach/sessions',
    isBuilt: true,
  },

  // ── Draft-only actions (coach) ────────────────────────────────────────────

  {
    id: 'capture_note',
    label: 'Capture a note',
    description: 'Draft a player observation for director review.',
    domain: 'observation',
    safetyClass: 'draft_only',
    riskLevel: 'low',
    allowedRoles: ['coach'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: 'director',
    proposedActionModule: 'player_observation',
    safetyNote: 'Draft goes to proposed_actions — not visible to player or parent until director approves.',
    href: '/coach/note',
    isBuilt: true,
  },
  {
    id: 'wrap_up',
    label: 'Wrap up session',
    description: 'Submit a session wrap-up summary for director review.',
    domain: 'wrap_up',
    safetyClass: 'draft_only',
    riskLevel: 'low',
    allowedRoles: ['coach'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: 'director',
    proposedActionModule: 'session_wrap_up_v1',
    safetyNote: 'Wrap-up goes to proposed_actions — director reviews before player records are updated.',
    href: '/coach/wrap-up',
    isBuilt: true,
  },

  // ── Requires approval (director) ──────────────────────────────────────────

  {
    id: 'approve_level_move',
    label: 'Approve level move',
    description: 'Approve a player\'s curriculum level advancement.',
    domain: 'curriculum',
    safetyClass: 'requires_approval',
    riskLevel: 'high',
    allowedRoles: ['director'],
    blockedRoles: ['coach'],
    blockedReason: 'Level movement requires director decision. Coaches can flag readiness, directors approve.',
    requiresApprovalFrom: 'director',
    proposedActionModule: 'level_review',
    safetyNote: 'DONNA never moves a player\'s level automatically. Director must approve.',
    href: '/director/review',
    isBuilt: true,
  },
  {
    id: 'send_parent_message',
    label: 'Send parent update',
    description: 'Approve and send a parent-safe summary to a player\'s family.',
    domain: 'parent_message',
    safetyClass: 'requires_approval',
    riskLevel: 'high',
    allowedRoles: ['director'],
    blockedRoles: ['coach'],
    blockedReason: 'Parent communications require director approval. Coaches can draft notes but not send.',
    requiresApprovalFrom: 'director',
    proposedActionModule: 'parent_communication',
    safetyNote: 'Parent send flow not built. Director reviews draft — send is deferred.',
    href: '/director/review',
    isBuilt: false,
  },

  // ── Blocked for role ──────────────────────────────────────────────────────

  {
    id: 'adjust_session',
    label: 'Adjust session structure',
    description: 'Modify the blocks or template of an active session.',
    domain: 'session',
    safetyClass: 'draft_only',
    riskLevel: 'medium',
    allowedRoles: ['coach'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: 'director',
    proposedActionModule: 'modify_session',
    safetyNote: 'Session modifications go to proposed_actions for director review.',
    href: '/coach/sessions',
    isBuilt: true,
  },

  // ── Future capabilities ───────────────────────────────────────────────────

  {
    id: 'curriculum_bottleneck_analysis',
    label: 'Curriculum bottleneck analysis',
    description: 'Identify which curriculum gates are creating the most player blockage.',
    domain: 'curriculum',
    safetyClass: 'future_capability',
    riskLevel: 'none',
    allowedRoles: ['director'],
    blockedRoles: [],
    blockedReason: null,
    requiresApprovalFrom: null,
    proposedActionModule: null,
    safetyNote: 'Requires curriculum gate migrations (041-060) to be applied.',
    href: null,
    isBuilt: false,
  },
  {
    id: 'roster_mutation',
    label: 'Modify roster',
    description: 'Move a player between groups or change their enrollment status.',
    domain: 'roster',
    safetyClass: 'requires_approval',
    riskLevel: 'high',
    allowedRoles: ['director'],
    blockedRoles: ['coach'],
    blockedReason: 'Roster changes require director approval. DONNA can flag unrostered players, but cannot modify the roster.',
    requiresApprovalFrom: 'director',
    proposedActionModule: 'move_player_group',
    safetyNote: 'DONNA never mutates the roster automatically.',
    href: '/director/players',
    isBuilt: false,
  },
]

// ── Lookups ───────────────────────────────────────────────────────────────────

const ACTION_MAP = new Map<string, DonnaActionDefinition>(
  DONNA_ACTIONS.map(a => [a.id, a]),
)

export function getDonnaAction(id: string): DonnaActionDefinition | undefined {
  return ACTION_MAP.get(id)
}

export function getDonnaActionsByDomain(domain: DonnaActionDomain): DonnaActionDefinition[] {
  return DONNA_ACTIONS.filter(a => a.domain === domain)
}

export function getDonnaActionsByRole(role: DonnaRole): DonnaActionDefinition[] {
  return DONNA_ACTIONS.filter(
    a => a.allowedRoles.includes(role) && !a.blockedRoles.includes(role),
  )
}

export function getDonnaActionsBySafetyClass(
  safetyClass: DonnaActionSafetyClass,
): DonnaActionDefinition[] {
  return DONNA_ACTIONS.filter(a => a.safetyClass === safetyClass)
}

// ── Classification ────────────────────────────────────────────────────────────

export function classifyAction(
  actionId: string,
  role: DonnaRole,
): { allowed: boolean; safetyClass: DonnaActionSafetyClass; blockedReason: string | null } {
  const action = ACTION_MAP.get(actionId)
  if (!action) {
    return { allowed: false, safetyClass: 'blocked_for_role', blockedReason: 'Unknown action.' }
  }

  if (action.blockedRoles.includes(role)) {
    return {
      allowed: false,
      safetyClass: 'blocked_for_role',
      blockedReason: action.blockedReason ?? 'This action is not available for your role.',
    }
  }

  if (!action.allowedRoles.includes(role)) {
    return {
      allowed: false,
      safetyClass: 'blocked_for_role',
      blockedReason: 'This action requires a different role.',
    }
  }

  if (action.safetyClass === 'future_capability') {
    return {
      allowed: false,
      safetyClass: 'future_capability',
      blockedReason: action.safetyNote ?? 'Not yet available.',
    }
  }

  return { allowed: true, safetyClass: action.safetyClass, blockedReason: null }
}

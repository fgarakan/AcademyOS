// Sprint 420 — Action Execution Guards V1
// Pre-execution guards that run before execute_approved_action() is called.
// Every guard must pass before execution proceeds.
// Server-side only. No DB writes.

import type { Database } from '@/lib/supabase/database.types'
import { canExecuteAction, isExpiredAction } from './proposedActionStateMachine'
import { isKillSwitchAllowed } from '@/lib/killSwitches/killSwitches'
import { logWarn } from '@/lib/observability/logger'

type ProposedAction = Database['public']['Tables']['proposed_actions']['Row']
type UserRole = Database['public']['Enums']['user_role']

const DIRECTOR_ROLES: UserRole[] = ['academy_director']
const DIRECTOR_OR_HEAD_ROLES: UserRole[] = ['academy_director', 'head_coach']

export interface ExecutionGuardResult {
  canExecute: boolean
  blockedReason: string | null
  guardsFailed: string[]
}

export interface ExecutionContext {
  executorId: string
  executorRole: UserRole
  academyId: string
  requestId?: string
}

// Run all execution guards for a proposed_action. Returns a pass/fail result.
// If any guard fails, execution must not proceed.
export function runExecutionGuards(
  action: ProposedAction,
  ctx: ExecutionContext,
): ExecutionGuardResult {
  const guardsFailed: string[] = []

  // Guard 1: Kill switch
  if (!isKillSwitchAllowed('action_execution', ctx.requestId)) {
    guardsFailed.push('kill_switch_blocked')
  }

  // Guard 2: Status — only 'approved' actions may be executed
  if (!canExecuteAction(action.status)) {
    guardsFailed.push(`invalid_status:${action.status}`)
    logWarn('execution_guard_status_fail', {
      requestId: ctx.requestId,
      actionId: action.id,
      status: action.status,
    })
  }

  // Guard 3: Expiry — action must not have passed its expiry date
  if (isExpiredAction(action.expires_at)) {
    guardsFailed.push('action_expired')
    logWarn('execution_guard_expiry_fail', {
      requestId: ctx.requestId,
      actionId: action.id,
      expiresAt: action.expires_at,
    })
  }

  // Guard 4: Academy scope — executor must be in the same academy as the action
  if (action.academy_id !== ctx.academyId) {
    guardsFailed.push('academy_mismatch')
    logWarn('execution_guard_academy_fail', {
      requestId: ctx.requestId,
      actionId: action.id,
      actionAcademyId: action.academy_id,
      executorAcademyId: ctx.academyId,
    })
  }

  // Guard 5: Role — only directors can execute approved actions
  // Head coaches may execute low-risk actions (future: configurable)
  const isHighRisk = action.risk_level === 'high'
  const canRoleExecute = isHighRisk
    ? DIRECTOR_ROLES.includes(ctx.executorRole)
    : DIRECTOR_OR_HEAD_ROLES.includes(ctx.executorRole)

  if (!canRoleExecute) {
    guardsFailed.push(`role_insufficient:${ctx.executorRole}`)
    logWarn('execution_guard_role_fail', {
      requestId: ctx.requestId,
      actionId: action.id,
      executorRole: ctx.executorRole,
      riskLevel: action.risk_level,
    })
  }

  if (guardsFailed.length > 0) {
    return {
      canExecute: false,
      blockedReason: `Execution blocked: ${guardsFailed.join(', ')}.`,
      guardsFailed,
    }
  }

  return { canExecute: true, blockedReason: null, guardsFailed: [] }
}

// Validates that the action type is in the registered allowed list.
// This is a defense-in-depth check — execute_approved_action() also validates this in the DB.
const REGISTERED_ACTION_TYPES: Database['public']['Enums']['action_type'][] = [
  'create_session',
  'modify_session',
  'cancel_session',
  'create_template',
  'modify_template',
  'assign_group',
  'create_placement_assessment',
  'move_player_group',
  'schedule_reassessment',
  'adjust_session_intensity',
  'generate_parent_update',
  'flag_player',
  'create_player',
  'create_exercise',
]

export function isRegisteredActionType(
  actionType: Database['public']['Enums']['action_type'],
): boolean {
  return REGISTERED_ACTION_TYPES.includes(actionType)
}

export function getRegisteredActionTypes(): Database['public']['Enums']['action_type'][] {
  return REGISTERED_ACTION_TYPES
}

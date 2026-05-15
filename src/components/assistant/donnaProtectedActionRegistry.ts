// Sprint 364 — Donna Protected Action Registry V1
// Centralized registry of all actions Donna can propose but never execute directly.
// Pure types + utility. No React, no API calls.
// This replaces ad-hoc protected phrase checking — existing code is NOT refactored yet
// (that is Sprint 365+). This file defines the canonical reference data.

import type { DonnaActionCategory } from './donnaRolePermissions'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ProtectedActionId =
  | 'save_template'
  | 'publish_session'
  | 'move_player_level'
  | 'send_parent_message'
  | 'send_coach_message'
  | 'update_curriculum'
  | 'record_attendance'
  | 'execute_billing'

export interface ProtectedActionDefinition {
  id: ProtectedActionId
  label: string
  description: string
  category: DonnaActionCategory
  requiredRole: string
  /** What Donna says when the director triggers the action properly */
  approvalMessage: string
  /** What Donna says when the action is attempted via voice */
  blockMessage: string
}

// ── Registry ───────────────────────────────────────────────────────────────────

export const PROTECTED_ACTION_REGISTRY: Record<ProtectedActionId, ProtectedActionDefinition> = {
  save_template: {
    id: 'save_template',
    label: 'Save Class Template',
    description: 'Saves a class template draft to the database after director approval.',
    category: 'curriculum',
    requiredRole: 'academy_director',
    approvalMessage: 'Your class template is ready to save. Use the Save button on screen — nothing saves until you click it.',
    blockMessage: 'Saving templates requires the on-screen approval button. Donna cannot save by voice.',
  },
  publish_session: {
    id: 'publish_session',
    label: 'Publish Session',
    description: 'Makes a session visible to coaches and players.',
    category: 'scheduling',
    requiredRole: 'academy_director',
    approvalMessage: 'Session ready to publish. Use the on-screen Publish button.',
    blockMessage: 'Publishing sessions requires the on-screen button. Donna cannot publish by voice.',
  },
  move_player_level: {
    id: 'move_player_level',
    label: 'Move Player Level',
    description: 'Changes a player\'s curriculum level — requires explicit director approval.',
    category: 'player_management',
    requiredRole: 'academy_director',
    approvalMessage: 'Level change ready for review. Use the on-screen approval button.',
    blockMessage: 'Moving a player\'s level requires the on-screen approval button — never by voice.',
  },
  send_parent_message: {
    id: 'send_parent_message',
    label: 'Send Parent Message',
    description: 'Sends a message to a player\'s parent or guardian.',
    category: 'communication',
    requiredRole: 'academy_director',
    approvalMessage: 'Parent message ready. Review it on screen before sending.',
    blockMessage: 'Donna cannot send parent messages directly. Review and send using the on-screen button.',
  },
  send_coach_message: {
    id: 'send_coach_message',
    label: 'Send Coach Message',
    description: 'Sends a message or brief to a coach.',
    category: 'communication',
    requiredRole: 'head_coach',
    approvalMessage: 'Coach message ready. Review and send using the on-screen button.',
    blockMessage: 'Donna cannot send coach messages directly. Use the on-screen send button.',
  },
  update_curriculum: {
    id: 'update_curriculum',
    label: 'Update Curriculum',
    description: 'Modifies curriculum content, levels, or requirements.',
    category: 'curriculum',
    requiredRole: 'academy_director',
    approvalMessage: 'Curriculum update ready. Use the on-screen Save button to apply.',
    blockMessage: 'Curriculum updates require the on-screen approval button. Donna cannot update curriculum by voice.',
  },
  record_attendance: {
    id: 'record_attendance',
    label: 'Record Attendance',
    description: 'Records session attendance for players.',
    category: 'scheduling',
    requiredRole: 'coach',
    approvalMessage: 'Attendance draft ready. Use the Submit button on screen.',
    blockMessage: 'Recording attendance requires the on-screen submit button.',
  },
  execute_billing: {
    id: 'execute_billing',
    label: 'Execute Billing',
    description: 'Processes billing or payment actions.',
    category: 'billing',
    requiredRole: 'academy_director',
    approvalMessage: 'Billing action ready for review. Use the on-screen button to proceed.',
    blockMessage: 'Billing actions require the on-screen approval button. Donna cannot execute billing by voice.',
  },
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the workflowId corresponds to a protected action.
 */
export function isProtectedAction(workflowId: string): boolean {
  return workflowId in PROTECTED_ACTION_REGISTRY
}

/**
 * Returns the block message for a protected action.
 * Falls back to a generic message if the workflowId is not in the registry.
 */
export function getBlockMessage(workflowId: string): string {
  const def = PROTECTED_ACTION_REGISTRY[workflowId as ProtectedActionId]
  return def?.blockMessage ?? 'This action requires the on-screen approval button. Donna cannot execute it by voice.'
}

/**
 * Returns the approval message for a protected action.
 * Falls back to a generic message if the workflowId is not in the registry.
 */
export function getApprovalMessage(workflowId: string): string {
  const def = PROTECTED_ACTION_REGISTRY[workflowId as ProtectedActionId]
  return def?.approvalMessage ?? 'Draft ready. Use the on-screen approval button to proceed.'
}

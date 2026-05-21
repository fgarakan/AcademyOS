// Sprint 606 — Director DONNA Action Policy V1
// Pure policy evaluation functions for the universal director action registry.
// No DB calls. No AI calls. No mutations. No side effects.
// Operates entirely on DIRECTOR_DONNA_ACTIONS from directorActionRegistry.

import {
  DIRECTOR_DONNA_ACTIONS,
  getDirectorDonnaActionById,
} from './directorActionRegistry'
import type { DirectorDonnaAction } from './directorActionTypes'

// ── Per-action policy ─────────────────────────────────────────────────────────

/**
 * Returns true if DONNA is permitted to create a draft for this action.
 * Drafts are only allowed for draft_only, review_required, and director_approval_required classes.
 * Unsafe and blocked actions are always refused regardless of context.
 */
export function canDonnaDraftAction(actionId: string): boolean {
  const action = getDirectorDonnaActionById(actionId)
  if (!action) return false
  if (action.actionClass === 'unsafe' || action.actionClass === 'blocked') return false
  if (action.implementationStatus === 'unsafe_to_automate') return false
  if (action.implementationStatus === 'blocked_by_permissions') return false
  return (
    action.actionClass === 'draft_only' ||
    action.actionClass === 'review_required' ||
    action.actionClass === 'director_approval_required'
  )
}

/**
 * Returns true if director approval is required before this action can take effect.
 * Unknown action IDs default to true (safe default — prefer over-gating to under-gating).
 */
export function doesDonnaActionRequireApproval(actionId: string): boolean {
  const action = getDirectorDonnaActionById(actionId)
  if (!action) return true
  return action.requiredApprovalLevel !== 'none'
}

// ── Registry-level policy queries ─────────────────────────────────────────────

/**
 * Returns all actions where a director approval gate is required before execution.
 */
export function getDirectorDonnaActionsRequiringApproval(): DirectorDonnaAction[] {
  return DIRECTOR_DONNA_ACTIONS.filter(a => a.requiredApprovalLevel !== 'none')
}

/**
 * Returns all actions that have no backend implementation yet.
 * Useful for sprint planning and gap tracking.
 */
export function getMissingDirectorDonnaActions(): DirectorDonnaAction[] {
  return DIRECTOR_DONNA_ACTIONS.filter(
    a =>
      a.implementationStatus === 'registry_only' ||
      a.implementationStatus === 'missing_backend',
  )
}

/**
 * Returns all actions that are blocked or marked unsafe.
 * Useful for safety audits and confirming what DONNA will always refuse.
 */
export function getUnsafeOrBlockedDirectorDonnaActions(): DirectorDonnaAction[] {
  return DIRECTOR_DONNA_ACTIONS.filter(
    a =>
      a.actionClass === 'unsafe' ||
      a.actionClass === 'blocked' ||
      a.implementationStatus === 'unsafe_to_automate' ||
      a.implementationStatus === 'blocked_by_permissions',
  )
}

// ── Coverage scoring ──────────────────────────────────────────────────────────

export interface DirectorDonnaActionCoverageScore {
  /** Total actions in the registry */
  total: number
  /** Actions where both backend and UI entry point are wired */
  wired: number
  /** Actions with some implementation (wired + not_wired + partial) */
  implemented: number
  /** Actions with no backend implementation yet */
  missing: number
  /** Actions that are blocked or unsafe by design */
  safelyBlocked: number
  /** Percentage of total actions that are fully wired */
  coveragePct: number
  /** Breakdown by action class */
  byClass: Record<string, number>
  /** Breakdown by implementation status */
  byStatus: Record<string, number>
}

export function getDirectorDonnaActionCoverageScore(): DirectorDonnaActionCoverageScore {
  const total = DIRECTOR_DONNA_ACTIONS.length

  const wired = DIRECTOR_DONNA_ACTIONS.filter(
    a => a.uiWiringStatus === 'wired',
  ).length

  const implemented = DIRECTOR_DONNA_ACTIONS.filter(
    a =>
      a.implementationStatus === 'implemented_and_wired' ||
      a.implementationStatus === 'implemented_not_wired' ||
      a.implementationStatus === 'partially_implemented',
  ).length

  const missing = DIRECTOR_DONNA_ACTIONS.filter(
    a =>
      a.implementationStatus === 'registry_only' ||
      a.implementationStatus === 'missing_backend',
  ).length

  const safelyBlocked = DIRECTOR_DONNA_ACTIONS.filter(
    a =>
      a.implementationStatus === 'unsafe_to_automate' ||
      a.implementationStatus === 'blocked_by_permissions',
  ).length

  const coveragePct = total > 0 ? Math.round((wired / total) * 100) : 0

  const byClass = DIRECTOR_DONNA_ACTIONS.reduce<Record<string, number>>((acc, a) => {
    acc[a.actionClass] = (acc[a.actionClass] ?? 0) + 1
    return acc
  }, {})

  const byStatus = DIRECTOR_DONNA_ACTIONS.reduce<Record<string, number>>((acc, a) => {
    acc[a.implementationStatus] = (acc[a.implementationStatus] ?? 0) + 1
    return acc
  }, {})

  return {
    total,
    wired,
    implemented,
    missing,
    safelyBlocked,
    coveragePct,
    byClass,
    byStatus,
  }
}

// ── Visibility safety check ───────────────────────────────────────────────────

/**
 * Returns all actions that carry a parent/player visibility risk.
 * These actions require extra care — output must be sanitized before any send path.
 */
export function getDirectorDonnaActionsWithVisibilityRisk(): DirectorDonnaAction[] {
  return DIRECTOR_DONNA_ACTIONS.filter(a => a.parentPlayerVisibilityRisk)
}

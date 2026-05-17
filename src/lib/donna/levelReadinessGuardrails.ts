// Sprint 584 — Level Readiness Approval Guardrails V1
// Guards against automatic or premature level movement.
// Pure TypeScript — no DB writes, no execution, no level change.

import type { LevelMovementDirection, LevelReadinessEvidenceItem } from '@/components/donna/LevelReadinessApplyPreview'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LevelReadinessGuardrailResult {
  canReview: boolean       // can director even start the review?
  canApprove: boolean      // can director approve this proposal?
  blockers: LevelReadinessBlocker[]
  warnings: LevelReadinessWarning[]
  requiresExtraConfirmation: boolean
}

export interface LevelReadinessBlocker {
  code: string
  message: string
}

export interface LevelReadinessWarning {
  code: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

// ── Guardrail engine ──────────────────────────────────────────────────────────

export function checkLevelReadinessGuardrails(
  direction: LevelMovementDirection,
  evidenceItems: LevelReadinessEvidenceItem[],
  readinessScore: number | null,
  proposedByRole: string,
  reviewerRole: string,
): LevelReadinessGuardrailResult {
  const blockers: LevelReadinessBlocker[] = []
  const warnings: LevelReadinessWarning[] = []

  // ── Hard blockers ──

  if (reviewerRole !== 'academy_director' && reviewerRole !== 'head_coach') {
    blockers.push({
      code: 'INSUFFICIENT_ROLE',
      message: 'Only directors and head coaches can review and approve level changes.',
    })
  }

  if (direction === 'demotion') {
    warnings.push({
      code: 'DEMOTION_REVIEW',
      message: 'Level reassignments require careful review. Ensure this has been discussed with the player and parent before approving.',
      severity: 'critical',
    })
  }

  // ── Evidence-based checks ──

  const metCount = evidenceItems.filter(e => e.met).length
  const totalCount = evidenceItems.length

  if (totalCount > 0 && metCount < totalCount) {
    const unmetCount = totalCount - metCount
    warnings.push({
      code: 'INCOMPLETE_EVIDENCE',
      message: `${unmetCount} readiness criteria not met. Director should confirm why movement is proposed despite incomplete evidence.`,
      severity: unmetCount > totalCount / 2 ? 'high' : 'medium',
    })
  }

  if (totalCount === 0) {
    warnings.push({
      code: 'NO_EVIDENCE',
      message: 'No readiness evidence attached to this proposal. Add observations or assessment evidence before approving.',
      severity: 'high',
    })
  }

  // ── Readiness score checks ──

  if (direction === 'promotion' && readinessScore !== null && readinessScore < 70) {
    warnings.push({
      code: 'LOW_READINESS_SCORE',
      message: `Readiness score is ${readinessScore}% — below the recommended 70% threshold for promotion. Director discretion required.`,
      severity: 'high',
    })
  }

  if (direction === 'demotion' && readinessScore !== null && readinessScore > 60) {
    warnings.push({
      code: 'HIGH_SCORE_DEMOTION',
      message: `Player has a ${readinessScore}% readiness score but demotion is proposed. Ensure this is intentional.`,
      severity: 'high',
    })
  }

  const criticalWarnings = warnings.filter(w => w.severity === 'critical')
  const highWarnings = warnings.filter(w => w.severity === 'high')
  const requiresExtraConfirmation = criticalWarnings.length > 0 || highWarnings.length > 0

  return {
    canReview: blockers.length === 0,
    canApprove: blockers.length === 0,  // blockers prevent both
    blockers,
    warnings,
    requiresExtraConfirmation,
  }
}

// ── Protection constants ──────────────────────────────────────────────────────

export const LEVEL_CHANGE_PROTECTION_COPY = {
  onlyFinalizePlacementAllowed: 'Level changes can only happen through the Placement workflow using the protected finalize_player_placement() function.',
  neverAutomatic: 'Level movement is NEVER automatic. A director or head coach must explicitly trigger the placement action.',
  requiresDirectorRole: 'Only directors and head coaches can approve level changes.',
  demotionSensitive: 'Level reassignments are sensitive. Discuss with player and parent before applying.',
  noLevelMovementFromWrapUp: 'Coach wrap-ups can flag level readiness but cannot trigger level movement.',
  noLevelMovementFromDONNA: 'DONNA can surface readiness signals but cannot trigger level movement.',
} as const

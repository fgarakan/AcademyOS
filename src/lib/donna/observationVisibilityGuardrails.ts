// Sprint 577 — Coach Observation Profile Update Guardrails V1
// Guards against internal/raw coach observations accidentally becoming parent or player visible.
// Pure TypeScript — no DB writes, no execution.

import type { ObservationType, ObservationVisibility } from '@/components/donna/ObservationPlayerProfilePreview'

// ── Guardrail types ───────────────────────────────────────────────────────────

export interface ObservationVisibilityGuardrailResult {
  canApply: boolean
  blockers: ObservationVisibilityBlocker[]
  warnings: ObservationVisibilityWarning[]
  requiresExtraConfirmation: boolean
}

export interface ObservationVisibilityBlocker {
  code: string
  message: string
}

export interface ObservationVisibilityWarning {
  code: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

// ── Content safety checks ─────────────────────────────────────────────────────

// Patterns that suggest raw internal language not safe for parents
const INTERNAL_LANGUAGE_PATTERNS: RegExp[] = [
  /\b(bad attitude|problem child|troublemaker|struggling hard|failing|cannot keep up)\b/i,
  /\b(parent is difficult|parent problem|parent issue|parent refuses)\b/i,
  /\b(fired|quit|drop|kick out|remove from group)\b/i,
  /\b(INTERNAL|DRAFT|DO NOT SHARE|confidential)\b/i,
]

function containsInternalLanguage(text: string): boolean {
  return INTERNAL_LANGUAGE_PATTERNS.some(p => p.test(text))
}

// ── Guardrail engine ──────────────────────────────────────────────────────────

export function checkObservationVisibilityGuardrails(
  observationText: string,
  nextStep: string,
  observationType: ObservationType,
  visibility: ObservationVisibility,
  draftStatus: string,
): ObservationVisibilityGuardrailResult {
  const blockers: ObservationVisibilityBlocker[] = []
  const warnings: ObservationVisibilityWarning[] = []

  // ── Hard blockers ──

  if (draftStatus !== 'approved') {
    blockers.push({
      code: 'NOT_APPROVED',
      message: 'Observations must be approved by a director before being applied to a player profile.',
    })
  }

  // ── Visibility-specific checks ──

  if (visibility === 'parent_safe') {
    // Check for internal language in parent-safe observations
    const fullText = `${observationText} ${nextStep}`
    if (containsInternalLanguage(fullText)) {
      blockers.push({
        code: 'INTERNAL_LANGUAGE_IN_PARENT_SAFE',
        message: 'This observation contains language that may not be appropriate for parents. Change visibility to coach_only or director, or revise the text.',
      })
    }

    if (observationType === 'concern') {
      warnings.push({
        code: 'CONCERN_MARKED_PARENT_SAFE',
        message: 'This is a concern observation marked as parent-safe. Review carefully — concern notes sent to parents require sensitive framing.',
        severity: 'high',
      })
    }
  }

  if (visibility === 'director' && containsInternalLanguage(observationText)) {
    warnings.push({
      code: 'INTERNAL_LANGUAGE_DETECTED',
      message: 'This observation may contain internal language. Confirm visibility is appropriate before applying.',
      severity: 'medium',
    })
  }

  // ── Length/quality checks ──

  if (observationText.trim().length < 10) {
    warnings.push({
      code: 'OBSERVATION_TOO_SHORT',
      message: 'This observation is very short. A meaningful note helps future coaches and the director.',
      severity: 'low',
    })
  }

  const requiresExtraConfirmation =
    visibility === 'parent_safe' || warnings.some(w => w.severity === 'high')

  return {
    canApply: blockers.length === 0,
    blockers,
    warnings,
    requiresExtraConfirmation,
  }
}

// ── Guardrail copy ────────────────────────────────────────────────────────────

export const OBSERVATION_VISIBILITY_COPY = {
  internalNoteWarning: 'This observation is internal and will not be visible to parents or players unless explicitly published.',
  parentSafeStillNeedsApproval: 'Even parent-safe observations require a separate director-approved parent update before any communication is sent to parents.',
  neverAutoVisible: 'Coach observations are never automatically visible to players or parents. Visibility is always set explicitly.',
  cannotAutoRemove: 'Applied observations cannot be automatically removed from the player profile.',
} as const

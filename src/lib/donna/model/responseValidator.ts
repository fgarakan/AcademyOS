// Sprint 4362 — DONNA Model Adapter: response validator.
//
// Validates model prose BEFORE it is surfaced. The model only ever produces a natural
// rephrasing; all structured/safety fields come from deterministic AcademyOS state, not
// from here. This guard ensures the prose is safe, bounded, and role-appropriate.
//
// Design rules:
//   - Pure TypeScript. No DB, no fetch, no side effects.
//   - Fails closed: any doubt → invalid → the adapter falls back deterministically.

import { FORBIDDEN_CONTEXT_PATTERNS, MODEL_CONFIG } from '@/lib/donna/model/modelTypes'
import { isResponseSafeForRole, type DonnaResponseRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'

export interface ModelMessageValidation {
  ok: boolean
  reason?: string
}

/**
 * Validate a model-produced message for a given role.
 * Rejects empty/oversized text, any forbidden PII/secret pattern, and — for parent/
 * player — anything that fails the role-safe language check.
 */
export function validateModelMessage(text: string, role: DonnaResponseRole): ModelMessageValidation {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, reason: 'empty_response' }
  }
  if (text.length > MODEL_CONFIG.maxMessageChars) {
    return { ok: false, reason: 'response_too_long' }
  }
  if (FORBIDDEN_CONTEXT_PATTERNS.some(p => p.test(text))) {
    return { ok: false, reason: 'forbidden_pattern_in_response' }
  }
  if ((role === 'parent' || role === 'player') && !isResponseSafeForRole(text, role)) {
    return { ok: false, reason: 'unsafe_for_role' }
  }
  return { ok: true }
}

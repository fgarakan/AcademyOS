// Sprint 367 — Parent-Safe Communication Rules V1
// Pure utility. No React, no DB, no API.
// Defines guardrails for what Donna can and cannot include in parent communications.

import type { CommunicationDraft } from './donnaCommunicationDraft'

// ── Allowed topics ─────────────────────────────────────────────────────────────

export const PARENT_SAFE_TOPICS: readonly string[] = [
  'progress update',
  'upcoming session',
  'practice schedule',
  'player development',
  'skill improvement',
  'attendance',
  'tournament preparation',
  'general encouragement',
  'home practice tips',
  'next steps',
  'equipment reminder',
  'celebration of progress',
]

// ── Blocked topics ─────────────────────────────────────────────────────────────

export const PARENT_BLOCKED_TOPICS: readonly string[] = [
  'injury details',
  'other players',
  'billing disputes',
  'level comparison',
  'coach complaints',
  'internal coach notes',
  'confidential assessments',
  'disciplinary issues',
  'financial disputes',
  'personal family matters',
]

// ── Tone rules ─────────────────────────────────────────────────────────────────

export const PARENT_TONE_RULES: readonly string[] = [
  'Use positive, supportive language when describing player progress.',
  'Avoid medical or clinical language about physical conditions.',
  'Do not compare one player to another.',
  'Keep the focus on the player, not on other families or coaches.',
  'Do not include speculative or unverified information.',
  'Use "we" language (e.g., "We noticed...") not "I" language from a coach.',
]

// ── Standard disclaimer ────────────────────────────────────────────────────────

export const PARENT_SAFE_DISCLAIMER =
  'This message was drafted by Academy OS for director review before sending. It has not been sent yet.'

// ── Detection patterns ─────────────────────────────────────────────────────────

// Simple keyword patterns for blocked topics
const BLOCKED_PATTERNS: Array<{ topic: string; keywords: string[] }> = [
  { topic: 'injury details',       keywords: ['injury', 'injured', 'medical', 'doctor', 'diagnosis', 'sprain', 'fracture', 'surgery'] },
  { topic: 'other players',        keywords: ['other player', 'another player', 'compared to', 'better than', 'worse than'] },
  { topic: 'billing disputes',     keywords: ['billing', 'payment', 'invoice', 'overdue', 'fee dispute', 'refund'] },
  { topic: 'level comparison',     keywords: ['should be', 'level behind', 'level ahead', 'more advanced', 'less advanced'] },
  { topic: 'coach complaints',     keywords: ['coach complaint', 'unhappy with coach', 'problem with coach', 'coach issue'] },
]

// ── Public API ─────────────────────────────────────────────────────────────────

export interface ParentSafeCheckResult {
  safe: boolean
  violations: string[]
  suggestions: string[]
}

/**
 * Check whether text is safe to send to a parent.
 * Returns violations and improvement suggestions.
 */
export function checkParentSafeContent(text: string): ParentSafeCheckResult {
  const lower = text.toLowerCase()
  const violations: string[] = []
  const suggestions: string[] = []

  for (const { topic, keywords } of BLOCKED_PATTERNS) {
    if (keywords.some(kw => lower.includes(kw))) {
      violations.push(`Contains blocked topic: "${topic}"`)
      suggestions.push(`Remove or rephrase content related to "${topic}".`)
    }
  }

  return {
    safe: violations.length === 0,
    violations,
    suggestions,
  }
}

/**
 * Sanitize a CommunicationDraft for parent-facing content.
 * If the body contains violations, sets status to 'blocked' and attaches violations.
 * Returns a new draft object (immutable).
 */
export function sanitizeForParent(draft: CommunicationDraft): CommunicationDraft {
  if (draft.type !== 'parent_update' && draft.type !== 'progress_summary') {
    // Only applies to parent-facing types
    return draft
  }

  const check = checkParentSafeContent(draft.body)
  if (!check.safe) {
    return {
      ...draft,
      status: 'blocked',
      violations: check.violations,
      lastModifiedAt: new Date().toISOString(),
    }
  }

  return {
    ...draft,
    violations: [],
    lastModifiedAt: new Date().toISOString(),
  }
}

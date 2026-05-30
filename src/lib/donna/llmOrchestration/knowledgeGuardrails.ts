// Sprint 989 — DONNA Knowledge → Recommendation Guardrails V1
// Enforces safety rules when Knowledge Builder content is used in DONNA recommendations.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Rules:
//   1. Knowledge content may inform recommendations but never replace data.
//   2. A recommendation based solely on knowledge (no live data) must be labeled as advisory.
//   3. Knowledge content cannot trigger level changes, parent messages, or curriculum publishes.
//   4. Deprecated knowledge entries always show a staleness warning.
//   5. Source citation is mandatory for any response using knowledge content.
//   6. Knowledge scope: if academy-specific, cite academy. If global, cite platform.

import type { KnowledgeEntry, KnowledgeCitation } from './knowledgeBuilderBridge'
import { buildCitation } from './knowledgeBuilderBridge'

// ── Guardrail rule result ─────────────────────────────────────────────────────

export interface KnowledgeGuardrailResult {
  passed: boolean
  warnings: string[]
  blockedReasons: string[]
  mustIncludeCitation: boolean
  mustLabelAsAdvisory: boolean
  safeToUse: boolean
}

// ── Blocked use cases ─────────────────────────────────────────────────────────

const KNOWLEDGE_CANNOT_TRIGGER = [
  'change_player_level',
  'send_parent_message',
  'publish_curriculum',
  'approve_review_item',
  'change_roster',
  'change_billing',
] as const

export type BlockedKnowledgeTrigger = typeof KNOWLEDGE_CANNOT_TRIGGER[number]

export function isKnowledgeBlockedForTrigger(trigger: string): boolean {
  return (KNOWLEDGE_CANNOT_TRIGGER as readonly string[]).includes(trigger)
}

// ── Guardrail evaluator ───────────────────────────────────────────────────────

/**
 * Evaluate whether Knowledge Builder entries are safe to use in a recommendation.
 * Returns guardrail result with warnings, blocks, and citation requirements.
 */
export function evaluateKnowledgeGuardrails(
  entries: KnowledgeEntry[],
  intendedTrigger?: string,
): KnowledgeGuardrailResult {
  const warnings: string[] = []
  const blockedReasons: string[] = []

  // Rule 1: Cannot trigger blocked actions
  if (intendedTrigger && isKnowledgeBlockedForTrigger(intendedTrigger)) {
    blockedReasons.push(`Knowledge content cannot trigger '${intendedTrigger}'. This action requires live data and explicit director approval.`)
  }

  // Rule 2: Deprecated entries get staleness warning
  const deprecated = entries.filter(e => e.approvalStatus === 'deprecated')
  if (deprecated.length > 0) {
    warnings.push(`${deprecated.length} knowledge ${deprecated.length === 1 ? 'entry' : 'entries'} is deprecated and may be outdated. Review carefully.`)
  }

  // Rule 3: Advisory label required when no live data backs the recommendation
  const hasLiveData = false // V1: live data retrieval not yet wired — always advisory
  const mustLabelAsAdvisory = !hasLiveData || entries.length > 0

  // Rule 4: Citation mandatory
  const mustIncludeCitation = entries.length > 0

  return {
    passed: blockedReasons.length === 0,
    warnings,
    blockedReasons,
    mustIncludeCitation,
    mustLabelAsAdvisory,
    safeToUse: blockedReasons.length === 0,
  }
}

// ── Response enricher ─────────────────────────────────────────────────────────

/**
 * Enrich a DONNA response text with required guardrail labels and citations.
 * Call after generating the response text, before showing it to the director.
 */
export function enrichResponseWithGuardrails(
  responseText: string,
  entries: KnowledgeEntry[],
  guardrails: KnowledgeGuardrailResult,
): string {
  const parts: string[] = [responseText]

  if (guardrails.mustLabelAsAdvisory) {
    parts.push('\n_This recommendation is advisory. Verify against live academy data before acting._')
  }

  if (guardrails.mustIncludeCitation && entries.length > 0) {
    const citations: KnowledgeCitation[] = entries.slice(0, 2).map(buildCitation)
    parts.push('\n' + citations.map(c => c.citationText).join('\n'))
  }

  if (guardrails.warnings.length > 0) {
    parts.push('\n⚠ ' + guardrails.warnings.join(' ⚠ '))
  }

  return parts.join('')
}

// ── Scope label helper ────────────────────────────────────────────────────────

export function getKnowledgeScopeLabel(scope: KnowledgeEntry['scope']): string {
  return scope === 'global' ? 'Platform Knowledge Library' : 'Academy Knowledge'
}

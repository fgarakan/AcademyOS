// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// Reference Resolver — converts anaphoric and demonstrative references
// in director input into explicit entity/recommendation labels before
// the input reaches the LLM.
//
// "What level is he?" → "What level is Alex Rivera?"
// "Do you think she's ready?" → "Do you think Alex Rivera is ready?"
// "Apply that recommendation." → "Apply the recommendation: Review advancement for Alex Rivera."
// "Open it." → "Open Alex Rivera's profile."
//
// This runs BEFORE context packet building and LLM call, so the LLM always
// receives explicit references — it never needs to reason about pronouns.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Non-fatal: if no context, returns original string unchanged.
//   - Never alters meaning — only substitutes explicit labels for pronouns/demonstratives.
//   - Respects word boundaries to avoid false matches inside longer words.

import type { ConversationOperatingContext } from './donnaConversationOperatingContext'
import { isContextThreadActive } from './donnaConversationOperatingContext'

// ── Pronoun patterns ─────────────────────────────────────────────────────────

// Singular pronouns (entity-level)
const SINGULAR_SUBJECT_PRONOUNS = /\b(he|she|they)\b/gi
const SINGULAR_OBJECT_PRONOUNS  = /\b(him|her|them)\b/gi
const POSSESSIVE_PRONOUNS       = /\b(his|her|their)\b/gi

// Demonstrative entity references
const DEMONSTRATIVE_ENTITY_PATTERNS: Array<{ re: RegExp; replacement: (label: string) => string }> = [
  { re: /\bthat player\b/gi,          replacement: (l) => l },
  { re: /\bthat coach\b/gi,           replacement: (l) => l },
  { re: /\bthat parent\b/gi,          replacement: (l) => l },
  { re: /\bthat student\b/gi,         replacement: (l) => l },
  { re: /\bthat kid\b/gi,             replacement: (l) => l },
  { re: /\bthat level\b/gi,           replacement: (l) => l },
  { re: /\bthat template\b/gi,        replacement: (l) => l },
  { re: /\bthat group\b/gi,           replacement: (l) => l },
]

// Demonstrative recommendation references
const DEMONSTRATIVE_REC_PATTERNS: Array<{ re: RegExp; replacement: (title: string) => string }> = [
  { re: /\bthat recommendation\b/gi,  replacement: (t) => `the recommendation: "${t}"` },
  { re: /\bthe recommendation\b/gi,   replacement: (t) => `the recommendation: "${t}"` },
  { re: /\bthat issue\b/gi,           replacement: (t) => `the issue: "${t}"` },
  { re: /\bthat flag\b/gi,            replacement: (t) => `"${t}"` },
  { re: /\bthat action\b/gi,          replacement: (t) => `the action: "${t}"` },
]

// ── Word boundary helper ──────────────────────────────────────────────────────

/** Guards against replacing pronouns inside names (e.g. "Heather", "Sheffield"). */
function replaceWithBoundary(text: string, pattern: RegExp, replacement: string): string {
  return text.replace(pattern, replacement)
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export interface ReferenceResolutionResult {
  /** The text with references resolved (may be unchanged if no resolutions applied) */
  resolvedText: string
  /** True when at least one reference was substituted */
  hadResolution: boolean
  /** Which substitutions were applied */
  resolutions: string[]
}

/**
 * Resolve anaphoric and demonstrative references in userInput using the
 * active conversation thread context.
 *
 * Returns original text unchanged when:
 *   - context is null or stale
 *   - no entity is in context
 *   - no references are detected
 *
 * This function is called in donnaOrchestratorAction BEFORE building the context packet.
 */
export function resolveReferences(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): ReferenceResolutionResult {
  if (!ctx || !isContextThreadActive(ctx) || !ctx.currentEntityLabel) {
    return { resolvedText: userInput, hadResolution: false, resolutions: [] }
  }

  const entityLabel = ctx.currentEntityLabel
  const recTitle    = ctx.currentRecommendationTitle
  const resolutions: string[] = []

  let text = userInput

  // ── 1. Demonstrative entity references ──────────────────────────────────
  for (const { re, replacement } of DEMONSTRATIVE_ENTITY_PATTERNS) {
    if (re.test(text)) {
      text = text.replace(re, replacement(entityLabel))
      resolutions.push(`"that [entity]" → "${entityLabel}"`)
      re.lastIndex = 0
    }
  }

  // ── 2. Demonstrative recommendation references ───────────────────────────
  if (recTitle) {
    for (const { re, replacement } of DEMONSTRATIVE_REC_PATTERNS) {
      if (re.test(text)) {
        text = text.replace(re, replacement(recTitle))
        resolutions.push(`"that recommendation" → "${recTitle}"`)
        re.lastIndex = 0
      }
    }
  }

  // ── 3. Singular subject pronouns (he/she/they) ───────────────────────────
  if (SINGULAR_SUBJECT_PRONOUNS.test(text)) {
    SINGULAR_SUBJECT_PRONOUNS.lastIndex = 0
    const newText = replaceWithBoundary(text, SINGULAR_SUBJECT_PRONOUNS, entityLabel)
    if (newText !== text) {
      resolutions.push(`pronoun he/she/they → "${entityLabel}"`)
      text = newText
    }
  }
  SINGULAR_SUBJECT_PRONOUNS.lastIndex = 0

  // ── 4. Singular object pronouns (him/her/them) ───────────────────────────
  if (SINGULAR_OBJECT_PRONOUNS.test(text)) {
    SINGULAR_OBJECT_PRONOUNS.lastIndex = 0
    const newText = replaceWithBoundary(text, SINGULAR_OBJECT_PRONOUNS, entityLabel)
    if (newText !== text) {
      resolutions.push(`pronoun him/her/them → "${entityLabel}"`)
      text = newText
    }
  }
  SINGULAR_OBJECT_PRONOUNS.lastIndex = 0

  // ── 5. Possessive pronouns (his/her/their) ───────────────────────────────
  if (POSSESSIVE_PRONOUNS.test(text)) {
    POSSESSIVE_PRONOUNS.lastIndex = 0
    // For possessives, use "entityLabel's" form
    const possessive = entityLabel.endsWith('s') ? `${entityLabel}'` : `${entityLabel}'s`
    const newText = replaceWithBoundary(text, POSSESSIVE_PRONOUNS, possessive)
    if (newText !== text) {
      resolutions.push(`possessive his/her/their → "${possessive}"`)
      text = newText
    }
  }
  POSSESSIVE_PRONOUNS.lastIndex = 0

  const hadResolution = resolutions.length > 0
  return { resolvedText: text, hadResolution, resolutions }
}

// ── Short-form action detection ───────────────────────────────────────────────

/**
 * Detect if the input is a short action reference ("Let's do it", "Approve it", "Do it").
 * Returns a description string for the resolved action, or null if not a match.
 *
 * Used in contextPacket.ts to add "Conversational Action Context" section.
 */
export function detectShortAction(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): string | null {
  if (!ctx || !isContextThreadActive(ctx)) return null

  const lower = userInput.toLowerCase().trim().replace(/[?!.]+$/, '')

  const isDoIt        = /^(let'?s do it|do it|do that|yes do it|proceed|go ahead|yes please|confirm)$/.test(lower)
  const isApproveIt   = /^(approve it|approve that|approve|yes approve)$/.test(lower)
  const isOpenIt      = /^(open it|open that|show me|show me that|take me there|navigate there|go there)$/.test(lower)
  const isApplyIt     = /^(apply it|apply that|apply that recommendation|use it)$/.test(lower)

  if (isDoIt || isApproveIt || isApplyIt) {
    if (ctx.currentRecommendationTitle) {
      return `The director is saying "${userInput}" in reference to the active recommendation: "${ctx.currentRecommendationTitle}". Draft a proposed_action for this recommendation.`
    }
    if (ctx.currentGoal) {
      return `The director is saying "${userInput}" in reference to: "${ctx.currentGoal}". Determine the next action.`
    }
  }

  if (isOpenIt) {
    if (ctx.currentEntityRoute) {
      return `The director is saying "${userInput}" to navigate to: ${ctx.currentEntityRoute} (${ctx.currentEntityLabel}).`
    }
    if (ctx.currentNavigationTarget) {
      return `The director is saying "${userInput}" to navigate to: ${ctx.currentNavigationTarget}.`
    }
  }

  return null
}

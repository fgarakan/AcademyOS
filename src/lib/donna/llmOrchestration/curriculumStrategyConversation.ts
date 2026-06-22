// Sprint 1018 — DONNA Strategic Curriculum Conversation Mode V1
// Detects curriculum strategy queries and provides framing for COO-quality curriculum discussions.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   When a director asks DONNA a curriculum strategy question
//   ("should we add more fitness content?", "how does our orange level compare to best practice?",
//   "what's the philosophy behind our red level progression?"), the LLM needs:
//     1. Awareness that this is a curriculum strategy discussion (not an operational question)
//     2. Explicit safety framing: DONNA proposes, DONNA does not apply
//     3. Context about what DONNA can and cannot tell the director
//     4. Guidance to use `get_curriculum_context` for grounding
//
// This module provides:
//   - isCurriculumStrategyQuery(text): boolean — detects strategy intent
//   - CURRICULUM_STRATEGY_PROMPT_SECTION: string — system prompt supplement
//   - buildCurriculumStrategyAdvice(state): string — generates a strategy framing statement

// ── Intent detection ──────────────────────────────────────────────────────────

const CURRICULUM_STRATEGY_KEYWORDS = [
  'curriculum', 'level', 'stage', 'progression', 'content', 'philosophy',
  'orange', 'red', 'green', 'yellow', 'purple',
  'fitness', 'drill', 'skill', 'technique', 'mental', 'competitive',
  'best practice', 'approach', 'structure', 'design',
  'add more', 'remove', 'change', 'update', 'improve',
  'how should we', 'should we', 'what do you think about', 'recommend',
  'coverage', 'gap', 'balance',
]

const CURRICULUM_STRATEGY_PHRASES = [
  'curriculum strategy', 'curriculum philosophy', 'curriculum design',
  'level progression', 'stage progression', 'content balance',
  'how does our', 'what does our curriculum',
  'is our curriculum', 'should our curriculum',
  'curriculum gap', 'curriculum coverage',
  'orange level', 'red level', 'green level', 'yellow level',
  'age appropriate', 'age-appropriate',
]

/**
 * Returns true if the input looks like a curriculum strategy question.
 * Conservative — false negatives are fine (LLM handles general questions).
 * False positives would only add helpful context to the system prompt.
 */
export function isCurriculumStrategyQuery(text: string): boolean {
  const lower = text.toLowerCase()
  // Check for explicit strategy phrases first
  if (CURRICULUM_STRATEGY_PHRASES.some(phrase => lower.includes(phrase))) return true
  // Check for keyword combinations (at least 2 keywords for confidence)
  const matchCount = CURRICULUM_STRATEGY_KEYWORDS.filter(kw => lower.includes(kw)).length
  return matchCount >= 2
}

// ── System prompt supplement ──────────────────────────────────────────────────

/**
 * System prompt section to inject when a curriculum strategy query is detected.
 * Informs the LLM of its role in curriculum discussions and the safety boundary.
 */
export const CURRICULUM_STRATEGY_PROMPT_SECTION = `
## Curriculum Strategy Mode
The director is asking a curriculum strategy question. Follow these rules:

1. You can discuss, analyze, and recommend curriculum approaches — but you do not apply any changes yourself.
2. Use the get_curriculum_context tool to ground your answer in the academy's actual curriculum structure.
3. Give a clear, confident recommendation in your own voice — the director decides, but don't hedge into vague "options to consider".
4. State your recommendation plainly, while acknowledging that learning philosophy varies by academy when it genuinely does.
5. If the director wants to make a change, tell them you'll prepare it as a draft for their review before anything takes effect.
6. Be honest about confidence: if you're reasoning from general principles rather than academy data, say so.
7. Don't create curriculum content items yourself — recommend what to add, then draft it for the director's review.
`.trim()

// ── Strategy framing builder ──────────────────────────────────────────────────

export interface CurriculumStrategyContext {
  totalLevels: number
  pendingDrafts: number
  hasDraft: boolean
}

/**
 * Build a grounding statement for curriculum strategy discussions.
 * Provides DONNA with a safe factual baseline before strategy reasoning.
 */
export function buildCurriculumStrategyAdvice(ctx: CurriculumStrategyContext): string {
  const parts: string[] = []

  if (ctx.totalLevels > 0) {
    parts.push(`Your curriculum currently has ${ctx.totalLevels} defined level${ctx.totalLevels !== 1 ? 's' : ''}.`)
  } else {
    parts.push('Your curriculum does not have any levels defined yet — this is a good starting point for strategy discussion.')
  }

  if (ctx.hasDraft) {
    parts.push(
      ctx.pendingDrafts === 1
        ? '1 curriculum change draft is already in the Review Queue.'
        : `${ctx.pendingDrafts} curriculum change drafts are already in the Review Queue.`,
    )
  }

  parts.push('Anything I recommend is just a draft for your review — nothing changes until you approve it.')

  return parts.join(' ')
}

// ── Conversation safety enforcer ──────────────────────────────────────────────

/**
 * Returns true if a curriculum strategy response requires the standard advisory disclaimer.
 * Always returns true in V1 — all curriculum strategy responses are advisory.
 */
export function curriculumStrategyRequiresDisclaimer(): boolean {
  return true
}

/**
 * Standard advisory disclaimer for curriculum strategy responses.
 * Append to any curriculum strategy recommendation that could be interpreted as directive.
 */
export const CURRICULUM_STRATEGY_DISCLAIMER =
  'That\'s my recommendation — you\'d review and approve any change before it takes effect.'

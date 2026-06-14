// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// Entity-aware follow-up patterns — extends donnaFollowUpResolver.ts
// to handle follow-ups that require knowing the current entity.
//
// Handles the follow-ups that the existing resolver cannot answer
// because they require entity context:
//   "Should I worry?"           → risk signal from entity health/recommendations
//   "Can I ignore it?"          → riskIfIgnored from active recommendation
//   "What happens next?"        → next action from entity context
//   "Anything else?"            → other signals or recommendations
//   "What would you do?"        → director action recommendation
//   "What changed?"             → recent signals from entity
//   "How?"                      → implementation path for current goal
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns null when input doesn't match — existing resolver continues.
//   - Only fires when entity context is active and thread is fresh.
//   - Responses are under 80 words, sound like a COO (not a chatbot).

import type { ConversationOperatingContext } from './donnaConversationOperatingContext'
import { isContextThreadActive } from './donnaConversationOperatingContext'

// ── Follow-up result ──────────────────────────────────────────────────────────

export interface EntityFollowUpResult {
  responseText: string
  navigationHref: string | null
  actionSuggested: 'draft_proposed_action' | 'navigate' | 'answer' | null
}

// ── Pattern groups ────────────────────────────────────────────────────────────

const WORRY_PATTERNS = [
  /^should i (worry|be worried|be concerned)(\?)?$/i,
  /^(is this|is it) (serious|urgent|bad|a problem)(\?)?$/i,
  /^how (bad|serious|urgent) is (this|it|that)(\?)?$/i,
]

const IGNORE_PATTERNS = [
  /^can i ignore (this|it|that)(\?)?$/i,
  /^(what if i |if i )(ignore|skip|don'?t act on) (this|it|that)(\?)?$/i,
  /^(does it matter|does this matter)(\?)?$/i,
  /^(is it safe to |can i )(wait|delay|hold off)(\?)?$/i,
]

const WHAT_NEXT_PATTERNS = [
  /^what (happens?|comes?) (next|after (this|that))(\?)?$/i,
  /^what('?s| is) (the )?next step(\?)?$/i,
  /^what do (i|we) do next(\?)?$/i,
  /^then what(\?)?$/i,
  /^(and )?then(\?)?$/i,
]

const ANYTHING_ELSE_PATTERNS = [
  /^anything else(\?)?$/i,
  /^what else(\?)?$/i,
  /^is there (anything|something) else(\?)?$/i,
  /^(any )?other (issues?|concerns?|flags?|items?)(\?)?$/i,
  /^(what|any) other (signals?|warnings?|priorities?)(\?)?$/i,
]

const WHAT_WOULD_YOU_DO_PATTERNS = [
  /^what would you do(\?)?$/i,
  /^what('?d| would) you (do|recommend|suggest)(\?)?$/i,
  /^what('?s| is) your (recommendation|suggestion|take|read)(\?)?$/i,
  /^if (you were me|it were you|this were yours)(\?)?$/i,
  /^what would you do (if you were me|in my (position|shoes))(\?)?$/i,
]

const WHAT_CHANGED_PATTERNS = [
  /^what (changed|happened|changed recently)(\?)?$/i,
  /^what'?s (new|changed|different|happened)(\?)?$/i,
  /^(any |what )?(recent )?changes?(\?)?$/i,
  /^(anything |what'?s )new(\?)?$/i,
]

const HOW_PATTERNS = [
  /^how(\?)?$/i,
  /^how do (i|we|you) do (it|that|this)(\?)?$/i,
  /^how (do i|can i|should i) (proceed|do this|do that|start|handle this|handle it)(\?)?$/i,
  /^how does (it|this|that) work(\?)?$/i,
]

// ── Pattern matcher ───────────────────────────────────────────────────────────

type PatternGroup = 'worry' | 'ignore' | 'what_next' | 'anything_else' | 'what_would_you_do' | 'what_changed' | 'how'

function detectFollowUpGroup(lower: string): PatternGroup | null {
  if (WORRY_PATTERNS.some(p => p.test(lower)))            return 'worry'
  if (IGNORE_PATTERNS.some(p => p.test(lower)))           return 'ignore'
  if (WHAT_NEXT_PATTERNS.some(p => p.test(lower)))        return 'what_next'
  if (ANYTHING_ELSE_PATTERNS.some(p => p.test(lower)))    return 'anything_else'
  if (WHAT_WOULD_YOU_DO_PATTERNS.some(p => p.test(lower)))return 'what_would_you_do'
  if (WHAT_CHANGED_PATTERNS.some(p => p.test(lower)))     return 'what_changed'
  if (HOW_PATTERNS.some(p => p.test(lower)))              return 'how'
  return null
}

// ── Response builders ─────────────────────────────────────────────────────────

function buildWorryResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this'
  const rec    = ctx.currentRecommendationTitle
  const urgency = ctx.currentRecommendationUrgency

  if (rec && (urgency === 'urgent' || urgency === 'immediate')) {
    return {
      responseText:    `Yes — the recommendation "${rec}" is flagged ${urgency}. That means it needs action soon. ${ctx.currentEntityRoute ? 'I can take you to the profile.' : 'It is in the review queue.'}`,
      navigationHref:  ctx.currentEntityRoute ?? '/director/review',
      actionSuggested: 'navigate',
    }
  }
  if (rec) {
    return {
      responseText:    `It is worth watching. There is an active recommendation for ${entity}: "${rec}". Not urgent, but worth reviewing before it escalates.`,
      navigationHref:  ctx.currentEntityRoute ?? null,
      actionSuggested: 'answer',
    }
  }
  return {
    responseText:    `Nothing critical for ${entity} right now, but stay on top of the open recommendations. I can pull up the profile if you want the full picture.`,
    navigationHref:  ctx.currentEntityRoute ?? null,
    actionSuggested: 'answer',
  }
}

function buildIgnoreResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const rec  = ctx.currentRecommendationTitle
  const type = ctx.currentRecommendationType ?? 'this'

  if (rec) {
    const riskMap: Record<string, string> = {
      advancement:  'the player stagnates at an incorrect level — motivation and development suffer',
      assessment:   'you are making advancement decisions without evidence',
      placement:    'the player remains without a clear development path',
      curriculum:   'session inconsistency continues',
      parent:       'the parent communication gap widens over time',
    }
    const risk = Object.entries(riskMap).find(([k]) => type.includes(k))?.[1]
      ?? 'the issue may compound into something harder to fix later'
    return {
      responseText:    `If you ignore it: ${risk}. It is your call — but I would not leave it longer than another week.`,
      navigationHref:  ctx.currentEntityRoute ?? '/director/review',
      actionSuggested: 'answer',
    }
  }
  return {
    responseText:    `Depends on what you are ignoring. If it is a pending recommendation, the risk grows the longer it sits. What specifically are you thinking of skipping?`,
    navigationHref:  null,
    actionSuggested: 'answer',
  }
}

function buildWhatNextResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this'
  const rec    = ctx.currentRecommendationTitle

  if (rec) {
    return {
      responseText:    `Next step: review "${rec}" in the director dashboard and decide whether to approve. That unlocks the action and gets it into the execution queue.`,
      navigationHref:  ctx.currentEntityRoute ?? '/director/review',
      actionSuggested: 'navigate',
    }
  }
  if (ctx.currentTopic === 'advancement') {
    return {
      responseText:    `Next step for ${entity}: confirm the advancement recommendation in the Review Queue. Once approved, the level change flows through automatically.`,
      navigationHref:  '/director/review',
      actionSuggested: 'navigate',
    }
  }
  return {
    responseText:    `The next step depends on what you decide for ${entity}. If you want to act, I can draft something for the review queue. Just say the word.`,
    navigationHref:  ctx.currentEntityRoute ?? null,
    actionSuggested: 'answer',
  }
}

function buildAnythingElseResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this entity'

  if (ctx.currentRecommendationTitle) {
    return {
      responseText:    `For ${entity}: the main open item is "${ctx.currentRecommendationTitle}". Beyond that, any additional signals would be on the profile page. Want me to open it?`,
      navigationHref:  ctx.currentEntityRoute ?? null,
      actionSuggested: 'navigate',
    }
  }
  return {
    responseText:    `I do not have other flags for ${entity} right now. The full picture is on the profile page — I can take you there.`,
    navigationHref:  ctx.currentEntityRoute ?? null,
    actionSuggested: 'navigate',
  }
}

function buildWhatWouldYouDoResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this'
  const rec    = ctx.currentRecommendationTitle
  const urgency = ctx.currentRecommendationUrgency

  if (rec) {
    const action = urgency === 'urgent' || urgency === 'immediate'
      ? `approve "${rec}" today — it is overdue`
      : `review "${rec}" this week — it is ready for a decision`
    return {
      responseText:    `I would ${action}. The evidence is there; waiting does not help. Want me to draft the action for your review?`,
      navigationHref:  ctx.currentEntityRoute ?? '/director/review',
      actionSuggested: 'draft_proposed_action',
    }
  }
  return {
    responseText:    `I would open ${entity}'s profile, check the current signals, and decide on any pending items before they age. Want me to take you there?`,
    navigationHref:  ctx.currentEntityRoute ?? null,
    actionSuggested: 'navigate',
  }
}

function buildWhatChangedResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this entity'

  return {
    responseText:    `Recent changes for ${entity} would be in the profile's signal history. I do not track in-session deltas here — the profile page will have the latest. Want me to open it?`,
    navigationHref:  ctx.currentEntityRoute ?? null,
    actionSuggested: 'navigate',
  }
}

function buildHowResponse(ctx: ConversationOperatingContext): EntityFollowUpResult {
  const entity = ctx.currentEntityLabel ?? 'this'
  const goal   = ctx.currentGoal ?? `the action for ${entity}`

  return {
    responseText:    `To proceed with ${goal}: I can draft a proposed action for director review. Once you approve it in the Review Queue, the system handles the rest. Want me to draft it?`,
    navigationHref:  ctx.currentEntityRoute ?? '/director/review',
    actionSuggested: 'draft_proposed_action',
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Detect and resolve an entity-contextual follow-up question.
 * Returns null if the input does not match any entity follow-up pattern,
 * or if no active entity thread exists.
 *
 * Called BEFORE the LLM path — provides deterministic answers for
 * common follow-up patterns when entity context is available.
 *
 * Note: This supplements (does not replace) donnaFollowUpResolver.ts.
 * The existing resolver handles non-entity follow-ups (brief, review queue, navigation).
 */
export function resolveEntityFollowUp(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): EntityFollowUpResult | null {
  if (!ctx || !isContextThreadActive(ctx) || !ctx.currentEntityLabel) return null

  const lower = userInput.toLowerCase().trim().replace(/[?!.]+$/, '')
  const wordCount = lower.split(/\s+/).filter(Boolean).length

  // Guard: only fire on short-to-medium inputs (≤12 words)
  if (wordCount > 12) return null

  const group = detectFollowUpGroup(lower)
  if (!group) return null

  switch (group) {
    case 'worry':           return buildWorryResponse(ctx)
    case 'ignore':          return buildIgnoreResponse(ctx)
    case 'what_next':       return buildWhatNextResponse(ctx)
    case 'anything_else':   return buildAnythingElseResponse(ctx)
    case 'what_would_you_do': return buildWhatWouldYouDoResponse(ctx)
    case 'what_changed':    return buildWhatChangedResponse(ctx)
    case 'how':             return buildHowResponse(ctx)
  }
}

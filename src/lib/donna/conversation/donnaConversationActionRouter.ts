// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// Conversational Action Router — maps short conversational commands to
// concrete DONNA actions using the current thread context.
//
// "Let's do it"    → draft proposed_action for current recommendation
// "Open it"        → navigate to current entity route
// "Show me"        → navigate to current entity route
// "Archive it"     → acknowledge — would require a review action
// "Create one"     → navigate to relevant creation page
// "Use the Green template" → route to template with context
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns null when input is not a conversational action.
//   - Returns a structured ConversationalAction for the orchestrator to execute.
//   - Never mutates — always returns "draft" or "navigate", not execute.

import type { ConversationOperatingContext } from './donnaConversationOperatingContext'
import { isContextThreadActive } from './donnaConversationOperatingContext'

// ── Conversational action result ──────────────────────────────────────────────

export type ConversationalActionType =
  | 'draft_recommendation'   // Draft a proposed_action for the active recommendation
  | 'navigate_entity'        // Navigate to the current entity's page
  | 'navigate_create'        // Navigate to a creation/builder page
  | 'navigate_review'        // Navigate to review queue
  | 'acknowledge'            // Acknowledge-only (e.g. archive — explain flow)
  | 'clarify'                // Need more information to act

export interface ConversationalActionResult {
  actionType:    ConversationalActionType
  responseText:  string
  navigationHref: string | null
  draftContext?: {
    recommendationTitle: string
    recommendationType:  string
    entityLabel:         string
  }
}

// ── Action patterns ───────────────────────────────────────────────────────────

const DO_IT_PATTERNS = [
  /^let'?s do it$/i,
  /^do it$/i,
  /^do that$/i,
  /^yes(?:,? (do it|proceed|let'?s go))?$/i,
  /^proceed$/i,
  /^go ahead$/i,
  /^confirm$/i,
  /^yes please$/i,
  /^apply (it|that)$/i,
  /^apply that recommendation$/i,
]

const APPROVE_IT_PATTERNS = [
  /^approve it$/i,
  /^approve that$/i,
  /^approve$/i,
  /^yes(?:,? approve)?$/i,
]

const OPEN_IT_PATTERNS = [
  /^open it$/i,
  /^open that$/i,
  /^show me$/i,
  /^show me (that|it|the profile)$/i,
  /^take me there$/i,
  /^go there$/i,
  /^navigate there$/i,
  /^navigate to (it|that)$/i,
  /^pull (it|that) up$/i,
  /^bring (it|that) up$/i,
  /^let me see (it|that)$/i,
]

const CREATE_PATTERNS = [
  /^create (one|it|a new one)$/i,
  /^make (one|it|a new one)$/i,
  /^new (one|template|session|drill|group)$/i,
  /^add (one|a new drill|a drill)$/i,
  /^add (it|that)$/i,
]

const REVIEW_PATTERNS = [
  /^(send|put|route) (it|that) (to review|for review|through review)$/i,
  /^review it$/i,
  /^review queue$/i,
  /^route to review$/i,
]

const ARCHIVE_DELETE_PATTERNS = [
  /^archive it$/i,
  /^archive that$/i,
  /^delete it$/i,
  /^delete that$/i,
  /^dismiss (it|that)$/i,
]

// ── Route inference for create patterns ──────────────────────────────────────

function inferCreateRoute(input: string, ctx: ConversationOperatingContext): { href: string; label: string } {
  const lower = input.toLowerCase()
  if (/drill/i.test(lower))                        return { href: '/director/curriculum', label: 'Curriculum Builder' }
  if (/template/i.test(lower))                     return { href: '/director/class-templates', label: 'Class Templates' }
  if (/session/i.test(lower))                      return { href: '/director/sessions', label: 'Sessions' }
  if (/group/i.test(lower))                        return { href: '/director/sessions', label: 'Sessions' }
  if (/player|student/i.test(lower))               return { href: '/director/players', label: 'Player Directory' }
  if (ctx.currentTopic === 'curriculum')           return { href: '/director/curriculum', label: 'Curriculum Builder' }
  if (ctx.currentEntityType === 'template')        return { href: '/director/class-templates', label: 'Class Templates' }
  return { href: '/director', label: 'Director Dashboard' }
}

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Detect and route a short conversational action command.
 * Returns null if input is not a recognized conversational action.
 *
 * This is called BEFORE the LLM in donnaOrchestratorAction so that
 * short commands are handled deterministically.
 */
export function resolveConversationalAction(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): ConversationalActionResult | null {
  if (!ctx || !isContextThreadActive(ctx)) return null

  const lower  = userInput.toLowerCase().trim().replace(/[?!.]+$/, '')
  const entity = ctx.currentEntityLabel ?? 'the selected item'
  const rec    = ctx.currentRecommendationTitle
  const route  = ctx.currentEntityRoute

  // ── 1. Do / Apply → draft recommendation action ───────────────────────────
  if (DO_IT_PATTERNS.some(p => p.test(lower)) || APPROVE_IT_PATTERNS.some(p => p.test(lower))) {
    if (rec && ctx.currentRecommendationType) {
      return {
        actionType:   'draft_recommendation',
        responseText: `I'll draft the action for "${rec}" and put it in your review queue. You can approve it there.`,
        navigationHref: '/director/review',
        draftContext: {
          recommendationTitle: rec,
          recommendationType:  ctx.currentRecommendationType,
          entityLabel:         entity,
        },
      }
    }
    if (ctx.currentGoal) {
      return {
        actionType:    'navigate_review',
        responseText:  `I'll route "${ctx.currentGoal}" to the review queue so you can approve it. Heading there now.`,
        navigationHref: '/director/review',
      }
    }
    return {
      actionType:    'clarify',
      responseText:  `I need to know what you'd like to do. Can you tell me which recommendation or action you're referring to?`,
      navigationHref: null,
    }
  }

  // ── 2. Open / Show → navigate to entity ──────────────────────────────────
  if (OPEN_IT_PATTERNS.some(p => p.test(lower))) {
    if (route) {
      return {
        actionType:    'navigate_entity',
        responseText:  `Opening ${entity}'s profile.`,
        navigationHref: route,
      }
    }
    if (ctx.currentNavigationTarget) {
      return {
        actionType:    'navigate_entity',
        responseText:  `Taking you to ${ctx.currentNavigationLabel ?? 'the relevant page'}.`,
        navigationHref: ctx.currentNavigationTarget,
      }
    }
    return {
      actionType:    'navigate_review',
      responseText:  `Opening the Review Queue.`,
      navigationHref: '/director/review',
    }
  }

  // ── 3. Create / New → navigate to creation page ──────────────────────────
  if (CREATE_PATTERNS.some(p => p.test(lower))) {
    const { href, label } = inferCreateRoute(userInput, ctx)
    return {
      actionType:    'navigate_create',
      responseText:  `Taking you to ${label} to create it.`,
      navigationHref: href,
    }
  }

  // ── 4. Route to review ────────────────────────────────────────────────────
  if (REVIEW_PATTERNS.some(p => p.test(lower))) {
    return {
      actionType:    'navigate_review',
      responseText:  rec
        ? `I'll send "${rec}" to the review queue. Opening it now.`
        : `Opening the review queue.`,
      navigationHref: '/director/review',
    }
  }

  // ── 5. Archive / Delete → acknowledge and explain ────────────────────────
  if (ARCHIVE_DELETE_PATTERNS.some(p => p.test(lower))) {
    return {
      actionType:    'acknowledge',
      responseText:  rec
        ? `To archive or dismiss "${rec}", go to the Review Queue and use the reject/override option. Want me to take you there?`
        : `Archiving and deleting go through the review queue. I can take you there.`,
      navigationHref: '/director/review',
    }
  }

  return null
}

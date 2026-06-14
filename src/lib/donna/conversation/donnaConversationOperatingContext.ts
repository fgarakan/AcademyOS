// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// ConversationOperatingContext — the thread-level memory that makes DONNA
// a natural operating partner rather than a stateless assistant.
//
// Every conversation turn produces an updated context. Every subsequent turn
// consumes it. The director never has to re-state who or what we're discussing.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - All fields optional / nullable — never block a turn due to missing context.
//   - Context is client-owned and passed round-trip through the orchestrator.
//   - TTL: 30 minutes since lastActiveAt (thread goes stale after inactivity).
//   - No private data in context — entity labels and routes only (no raw scores, no notes).

import type { EntityMemoryContext, EntityRecommendation } from '@/lib/donna/memory/donnaMemoryContextTypes'

// ── Thread TTL ────────────────────────────────────────────────────────────────

export const CONVERSATION_THREAD_TTL_MS = 30 * 60 * 1000 // 30 minutes

// ── Core type ─────────────────────────────────────────────────────────────────

export interface ConversationOperatingContext {
  // ── Active entity ─────────────────────────────────────────────────────────
  /** Entity type in the active thread */
  currentEntityType: EntityMemoryContext['entityType'] | null
  /** Human-readable entity label ("Alex Rivera", "Coach Sarah", "Orange Ball 2") */
  currentEntityLabel: string | null
  /** Navigation route to this entity ("/director/players/uuid") — never exposes raw ID alone */
  currentEntityRoute: string | null

  // ── Active recommendation ─────────────────────────────────────────────────
  /** Title of the most recently discussed recommendation */
  currentRecommendationTitle: string | null
  /** Recommendation type keyword ("advancement", "assessment", etc.) */
  currentRecommendationType: string | null
  /** Urgency of the current recommendation */
  currentRecommendationUrgency: string | null
  /** Lifecycle status of the current recommendation ("Pending Review", "Approved", etc.) */
  currentRecommendationStatus: string | null

  // ── Active topic + goal ───────────────────────────────────────────────────
  /** Domain topic being discussed ("advancement", "curriculum", "attendance", "session") */
  currentTopic: string | null
  /** Director's stated goal in natural language ("review advancement for Alex Rivera") */
  currentGoal: string | null

  // ── Active navigation target ──────────────────────────────────────────────
  /** Most recently suggested navigation route */
  currentNavigationTarget: string | null
  /** Human label for the navigation target ("Player Profile", "Review Queue") */
  currentNavigationLabel: string | null

  // ── Thread metadata ───────────────────────────────────────────────────────
  /** When the current entity thread started (ISO timestamp) */
  threadStartedAt: string | null
  /** When the last turn occurred (ISO timestamp) */
  lastActiveAt: string | null
  /** Number of turns in the current thread */
  turnCount: number
}

// ── Empty context ─────────────────────────────────────────────────────────────

export const EMPTY_CONVERSATION_CONTEXT: ConversationOperatingContext = {
  currentEntityType:              null,
  currentEntityLabel:             null,
  currentEntityRoute:             null,
  currentRecommendationTitle:     null,
  currentRecommendationType:      null,
  currentRecommendationUrgency:   null,
  currentRecommendationStatus:    null,
  currentTopic:                   null,
  currentGoal:                    null,
  currentNavigationTarget:        null,
  currentNavigationLabel:         null,
  threadStartedAt:                null,
  lastActiveAt:                   null,
  turnCount:                      0,
}

// ── TTL check ─────────────────────────────────────────────────────────────────

/** Returns true when the context is still within the 30-minute thread window. */
export function isContextThreadActive(ctx: ConversationOperatingContext): boolean {
  if (!ctx.lastActiveAt) return false
  return Date.now() - new Date(ctx.lastActiveAt).getTime() < CONVERSATION_THREAD_TTL_MS
}

// ── Topic inference ───────────────────────────────────────────────────────────

/** Infer a topic keyword from user input and entity type. */
export function inferTopic(
  userInput: string,
  entityType: EntityMemoryContext['entityType'] | null,
  existingTopic: string | null,
): string | null {
  const lower = userInput.toLowerCase()

  if (/advancement|advance|level up|move up|promote/i.test(lower))  return 'advancement'
  if (/assessment|assess|evaluate|test/i.test(lower))               return 'assessment'
  if (/attendance|absent|missed|no-show/i.test(lower))              return 'attendance'
  if (/curriculum|drill|skill|objective/i.test(lower))              return 'curriculum'
  if (/session|class|training/i.test(lower))                        return 'session'
  if (/parent|guardian|communication/i.test(lower))                 return 'parent communication'
  if (/recommendation|recommend/i.test(lower))                      return 'recommendation'
  if (/placement|place/i.test(lower))                               return 'placement'
  if (/template/i.test(lower))                                      return 'template'
  if (/wrap.?up|recap/i.test(lower))                               return 'wrap-up'
  if (/health|status|doing|going/i.test(lower) && entityType)       return `${entityType} status`

  return existingTopic
}

// ── Context updater ───────────────────────────────────────────────────────────

/**
 * Build an updated ConversationOperatingContext from the current turn.
 * Called server-side in donnaOrchestratorAction after entity resolution.
 *
 * Rules:
 *   - When a new entity arrives, the thread RESETS (new entity, new thread start).
 *   - When the same entity is confirmed again, thread continues and turnCount increments.
 *   - When no entity is detected, existing entity is preserved (thread continues).
 *   - Recommendation is updated from typedRecommendations[0] when present.
 *   - Topic is inferred from userInput; existing topic preserved when no new signal.
 */
export function updateConversationOperatingContext(
  existing: ConversationOperatingContext | null,
  params: {
    userInput:           string
    entityMemoryContext: EntityMemoryContext | null
  },
): ConversationOperatingContext {
  const ctx = existing ?? { ...EMPTY_CONVERSATION_CONTEXT }
  const { userInput, entityMemoryContext: em } = params
  const now = new Date().toISOString()

  const isNewThread = !isContextThreadActive(ctx)

  if (em) {
    // New entity detected — determine if it's a different entity (thread reset)
    const isEntityChange = ctx.currentEntityLabel !== em.entityLabel

    const firstRec: EntityRecommendation | null =
      em.typedRecommendations && em.typedRecommendations.length > 0
        ? em.typedRecommendations[0]
        : null

    return {
      currentEntityType:    em.entityType,
      currentEntityLabel:   em.entityLabel,
      currentEntityRoute:   em.entityRoute ?? null,

      currentRecommendationTitle:   firstRec?.title ?? ctx.currentRecommendationTitle,
      currentRecommendationType:    firstRec?.recommendationType ?? ctx.currentRecommendationType,
      currentRecommendationUrgency: firstRec?.urgency ?? ctx.currentRecommendationUrgency,
      currentRecommendationStatus:  firstRec?.lifecycleStatus ?? ctx.currentRecommendationStatus,

      currentTopic:            inferTopic(userInput, em.entityType, isEntityChange ? null : ctx.currentTopic),
      currentGoal:             isEntityChange ? buildGoalFromInput(userInput, em.entityLabel) : ctx.currentGoal,

      currentNavigationTarget: em.entityRoute ?? ctx.currentNavigationTarget,
      currentNavigationLabel:  em.entityLabel ?? ctx.currentNavigationLabel,

      threadStartedAt: (isEntityChange || isNewThread) ? now : (ctx.threadStartedAt ?? now),
      lastActiveAt:    now,
      turnCount:       (isEntityChange || isNewThread) ? 1 : ctx.turnCount + 1,
    }
  }

  // No entity detected — preserve existing entity, update topic and turnCount
  return {
    ...ctx,
    currentTopic:   inferTopic(userInput, ctx.currentEntityType, ctx.currentTopic),
    lastActiveAt:   now,
    turnCount:      isNewThread ? 1 : ctx.turnCount + 1,
  }
}

// ── Goal builder ──────────────────────────────────────────────────────────────

function buildGoalFromInput(userInput: string, entityLabel: string): string {
  const lower = userInput.toLowerCase()
  if (/advance|level up|promote/i.test(lower)) return `Review advancement for ${entityLabel}`
  if (/assess/i.test(lower))                  return `Review assessment for ${entityLabel}`
  if (/status|how is|how are|going/i.test(lower)) return `Get status on ${entityLabel}`
  if (/recommend/i.test(lower))              return `Review recommendations for ${entityLabel}`
  return `Discuss ${entityLabel}`
}

// ── Context summary for system prompt ────────────────────────────────────────

/**
 * Build the "## Conversation Thread" section of the system prompt.
 * Injected by contextPacket.ts when a thread context is active.
 */
export function buildConversationThreadSection(ctx: ConversationOperatingContext): string {
  if (!isContextThreadActive(ctx) || !ctx.currentEntityLabel) return ''

  const lines: string[] = ['\n## Conversation Thread Memory']
  lines.push(`Current entity: ${ctx.currentEntityLabel}${ctx.currentEntityType ? ` (${ctx.currentEntityType})` : ''}`)

  if (ctx.currentEntityRoute) {
    lines.push(`Navigate: ${ctx.currentEntityRoute}`)
  }

  if (ctx.currentRecommendationTitle) {
    lines.push(`Active recommendation: "${ctx.currentRecommendationTitle}"${ctx.currentRecommendationUrgency ? ` (${ctx.currentRecommendationUrgency})` : ''}${ctx.currentRecommendationStatus ? ` — ${ctx.currentRecommendationStatus}` : ''}`)
  }

  if (ctx.currentTopic) {
    lines.push(`Current topic: ${ctx.currentTopic}`)
  }

  if (ctx.currentGoal) {
    lines.push(`Director goal: ${ctx.currentGoal}`)
  }

  if (ctx.turnCount > 1) {
    lines.push(`Thread turns: ${ctx.turnCount}`)
  }

  lines.push('')
  lines.push('When the director uses pronouns (he, she, they, him, her, his, their) or says "that player", "that recommendation", "that issue" — they are referring to the current entity above. Do NOT ask for clarification about who they mean.')
  lines.push('When the director says "Let\'s do it", "Approve it", "Do it" — they are referring to the active recommendation above.')
  lines.push('When the director says "Open it", "Show me", "Take me there" — navigate to the entity route above.')

  return lines.join('\n')
}

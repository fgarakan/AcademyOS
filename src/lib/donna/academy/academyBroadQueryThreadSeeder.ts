// Mega Sprint 2561–2590 — DONNA Academy Broad Query Thread Seeder V1
//
// Fixes the critical "Who?" failure after broad queries.
//
// Problem: After "What should I focus on?", DONNA answers with entity names,
// but no conversation thread is seeded. "Who?" then fails because
// resolveEntityFollowUp returns null (no entity in thread).
//
// Solution: After a broad LLM answer, the server returns a suggestedEntitySeed
// (the top entity from the AcademyIntelligencePacket attention queue).
// The client calls buildThreadFromEntitySeed to seed the thread so the next
// "Who?", "Open it", or "Tell me more" works immediately.
//
// Pure TypeScript — no DB, no API, no React.

import type { ConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'

// ── Entity seed type ──────────────────────────────────────────────────────────

export interface EntitySeed {
  entityLabel: string
  entityRoute: string
  entityType:  'player' | 'coach' | 'parent'
}

// ── Thread seeder ─────────────────────────────────────────────────────────────

/**
 * Builds a minimal ConversationOperatingContext from an entity seed.
 * Used after broad academy queries to seed the thread so follow-ups work.
 */
export function buildThreadFromEntitySeed(
  seed:      EntitySeed,
  userInput: string,
): ConversationOperatingContext {
  const now = new Date().toISOString()
  return {
    currentEntityType:            seed.entityType,
    currentEntityLabel:           seed.entityLabel,
    currentEntityRoute:           seed.entityRoute,
    currentRecommendationTitle:   null,
    currentRecommendationType:    null,
    currentRecommendationUrgency: null,
    currentRecommendationStatus:  null,
    currentTopic:                 'attention',
    currentGoal:                  `Review ${seed.entityLabel}`,
    currentNavigationTarget:      seed.entityRoute,
    currentNavigationLabel:       `Open ${seed.entityLabel}`,
    threadStartedAt:              now,
    lastActiveAt:                 now,
    turnCount:                    1,
  }
}

/**
 * Applies an entity seed to an existing (or null) context.
 * Only seeds when the existing context has no current entity — never overwrites
 * an active entity thread with the broad query seed.
 */
export function applyEntitySeedToContext(
  existingCtx: ConversationOperatingContext | null,
  seed:        EntitySeed,
  userInput:   string,
): ConversationOperatingContext {
  if (existingCtx?.currentEntityLabel) {
    return existingCtx
  }
  return buildThreadFromEntitySeed(seed, userInput)
}

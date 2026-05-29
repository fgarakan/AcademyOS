// Sprint 944 — DONNA Memory + Learning Loop V1
// Defines memory categories, policy hierarchy, and safe memory helpers.
// Pure TypeScript — no DB calls, no React, no API calls.
//
// Memory policy hierarchy:
//   database  = source of truth (never overridden by memory)
//   memory    = pattern recognition and preference tracking
//   AI        = reasoning from context + memory
//   director  = final authority on all consequential decisions
//
// What memory is NOT:
//   - Memory does not change records.
//   - Memory does not override live data.
//   - Memory does not make decisions for the director.
//   - Memory does not reduce the approval requirement for risky actions.
//   - Memory does not retain or surface private coach notes or sensitive player data.

// ── Memory categories ─────────────────────────────────────────────────────────

export type DonnaMemoryCategory =
  | 'user_preference'          // Preferred language, dismissed suggestions, panel state
  | 'academy_operation'        // Recurring operational patterns: busy days, common review types
  | 'coach_behavior'           // Coach follow-through patterns: wrap-up timing, note quality
  | 'player_development'       // Development trajectory signals: stall patterns, milestone proximity
  | 'recommendation_outcome'   // Whether recommendations were accepted/rejected/ignored

// ── Memory retention policy ───────────────────────────────────────────────────

export interface DonnaMemoryRetentionPolicy {
  category: DonnaMemoryCategory
  /** What types of content are safe to store */
  safeToStore: readonly string[]
  /** What must never be stored in this category */
  neverStore: readonly string[]
  /** Maximum retention window in days (0 = session-scoped only) */
  retentionDays: number
  /** Whether this memory can influence DONNA's recommendations */
  canInfluenceRecommendations: boolean
  /** Whether this memory can be surfaced to the user */
  canBeShownToUser: boolean
  /** Whether director approval is required to act on this memory */
  requiresDirectorApproval: boolean
}

export const DONNA_MEMORY_RETENTION_POLICIES: Record<DonnaMemoryCategory, DonnaMemoryRetentionPolicy> = {
  user_preference: {
    category: 'user_preference',
    safeToStore: [
      'dismissed suggestion IDs',
      'preferred panel position',
      'last active workflow',
      'acknowledged onboarding steps',
    ],
    neverStore: [
      'private player notes',
      'coach assessments',
      'sensitive internal memos',
      'parent contact details',
    ],
    retentionDays: 90,
    canInfluenceRecommendations: true,
    canBeShownToUser: true,
    requiresDirectorApproval: false,
  },
  academy_operation: {
    category: 'academy_operation',
    safeToStore: [
      'peak session day patterns',
      'common review queue types',
      'typical wrap-up submission timing',
      'recurring curriculum gap areas',
    ],
    neverStore: [
      'individual player behavioral notes',
      'internal coach performance reviews',
      'billing or payment information',
    ],
    retentionDays: 180,
    canInfluenceRecommendations: true,
    canBeShownToUser: true,
    requiresDirectorApproval: false,
  },
  coach_behavior: {
    category: 'coach_behavior',
    safeToStore: [
      'wrap-up submission timing patterns (aggregate)',
      'observation submission frequency',
      'clarification response rate',
    ],
    neverStore: [
      'specific coach-to-player comments',
      'coach personal information',
      'subjective performance judgments',
      'anything that could be used punitively',
    ],
    retentionDays: 90,
    canInfluenceRecommendations: true,
    canBeShownToUser: false,
    requiresDirectorApproval: false,
  },
  player_development: {
    category: 'player_development',
    safeToStore: [
      'development trajectory signal (advancing/stalling/progressing)',
      'recent priority category (technical/tactical/fitness/mental)',
      'gate completion proximity (not the raw score)',
    ],
    neverStore: [
      'raw assessment scores',
      'coach internal concerns',
      'behavioral or mental health notes',
      'competition rankings',
      'parent-facing communications',
    ],
    retentionDays: 30,
    canInfluenceRecommendations: true,
    canBeShownToUser: false,
    requiresDirectorApproval: true,
  },
  recommendation_outcome: {
    category: 'recommendation_outcome',
    safeToStore: [
      'recommendation type that was accepted/rejected/ignored',
      'aggregate acceptance rate per recommendation category',
      'which signals led to accepted recommendations',
    ],
    neverStore: [
      'specific player names in outcome logs',
      'private coach notes referenced in recommendations',
      'parent-specific feedback',
    ],
    retentionDays: 180,
    canInfluenceRecommendations: true,
    canBeShownToUser: true,
    requiresDirectorApproval: false,
  },
}

// ── Memory policy core rules ──────────────────────────────────────────────────

export const DONNA_MEMORY_CORE_RULES = [
  'Database is the source of truth. Memory never overrides live data.',
  'Memory improves suggestion relevance — it does not make decisions.',
  'All consequential actions still require explicit director approval regardless of memory.',
  'Memory of a past acceptance does not mean auto-approval of a similar future action.',
  'Sensitive player and parent data is never retained in memory — only aggregate signals.',
  'Coach behavior patterns are anonymous summaries, not performance reviews.',
  'A director can request memory reset at any time — DONNA retains nothing permanently without consent.',
  'Memory confidence degrades over time — older patterns carry less weight.',
] as const

// ── Learning loop ─────────────────────────────────────────────────────────────

/**
 * Defines the feedback events that improve DONNA's recommendations over time.
 * These are the basis for the recommendation_outcome memory category.
 */
export type RecommendationFeedbackEvent =
  | 'shown'        // DONNA surfaced this recommendation
  | 'accepted'     // Director acted on it (approved / navigated / drafted)
  | 'dismissed'    // Director explicitly dismissed it
  | 'edited'       // Director modified the recommendation before acting
  | 'completed'    // The underlying action was completed (e.g., wrap-up approved)
  | 'ignored'      // Director did not interact (timeout / moved away)

export interface MemoryLearningSignal {
  event: RecommendationFeedbackEvent
  recommendationType: string
  sourceSignal: string
  /** Outcome weight: accepted/completed > edited > dismissed > ignored */
  weight: number
}

export const FEEDBACK_WEIGHTS: Record<RecommendationFeedbackEvent, number> = {
  completed: 1.0,
  accepted:  0.8,
  edited:    0.5,
  dismissed: -0.3,
  ignored:   -0.1,
  shown:     0.0,
}

// ── Memory summary builder ────────────────────────────────────────────────────

/**
 * Builds a human-readable memory summary for DONNA's context debug view.
 * Safe to show to the director — contains no sensitive data.
 */
export function buildMemorySummary(
  memoryKeys: readonly string[],
  recentOutcomes?: readonly { type: string; status: string }[],
): string {
  const parts: string[] = []

  if (memoryKeys.length > 0) {
    parts.push(`Active memory keys: ${memoryKeys.join(', ')}.`)
  } else {
    parts.push('No active memory keys for this session.')
  }

  if (recentOutcomes && recentOutcomes.length > 0) {
    const accepted = recentOutcomes.filter(o => o.status === 'accepted' || o.status === 'completed').length
    const total = recentOutcomes.length
    parts.push(`Recent recommendation outcomes: ${accepted}/${total} acted on.`)
  }

  parts.push('Memory is supplementary — database is always the source of truth.')

  return parts.join(' ')
}

// ── Policy helpers ────────────────────────────────────────────────────────────

export function getRetentionPolicy(category: DonnaMemoryCategory): DonnaMemoryRetentionPolicy {
  return DONNA_MEMORY_RETENTION_POLICIES[category]
}

/** Returns true if it is safe to store the given content type in the given memory category. */
export function isContentSafeToStore(category: DonnaMemoryCategory, contentType: string): boolean {
  const policy = DONNA_MEMORY_RETENTION_POLICIES[category]
  const lc = contentType.toLowerCase()
  const blocked = policy.neverStore.some(s => lc.includes(s.toLowerCase()))
  if (blocked) return false
  const allowed = policy.safeToStore.some(s => lc.includes(s.toLowerCase()))
  return allowed
}

/** Returns whether acting on this memory category requires director approval. */
export function memoryActionRequiresApproval(category: DonnaMemoryCategory): boolean {
  return DONNA_MEMORY_RETENTION_POLICIES[category].requiresDirectorApproval
}

/** Returns the effective weight for a feedback event. */
export function getFeedbackWeight(event: RecommendationFeedbackEvent): number {
  return FEEDBACK_WEIGHTS[event]
}

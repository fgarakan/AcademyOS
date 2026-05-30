// Sprint 983 — DONNA Memory + Recommendation Feedback Loop V1
// Tracks which DONNA recommendations were accepted, dismissed, or acted on.
// localStorage-backed (client side only) — no DB write, no server state.
//
// Purpose:
//   DONNA learns within a session and across sessions (via localStorage) which
//   recommendation types the director finds valuable. This improves future
//   recommendation ordering without any unsafe DB writes.
//
// Safety:
//   No player names, coach notes, or private data stored.
//   Only recommendation IDs, action IDs, outcome labels, and timestamps.
//   No proposed_actions created by the feedback loop.
//   No DB writes — localStorage only.
//
// Usage:
//   recordFeedback('accepted', 'pending_review_queue', 'review_queue')
//   const prefs = loadFeedbackPreferences()
//   const score = getRecommendationScore('pending_review_queue')

// ── Feedback signal types ─────────────────────────────────────────────────────

export type FeedbackOutcome =
  | 'accepted'    // Director clicked the recommended action
  | 'dismissed'   // Director dismissed the recommendation without acting
  | 'acted_on'    // Director acted on a related item (indirect acceptance)
  | 'overridden'  // Director took a different action than recommended

export interface FeedbackSignal {
  /** The recommendation action ID (e.g. 'pending_review_queue') */
  actionId: string
  /** The route where this recommendation was shown */
  pathname: string
  /** The outcome signal */
  outcome: FeedbackOutcome
  /** Unix timestamp */
  timestamp: number
}

export interface FeedbackPreferences {
  /** Map of actionId → net acceptance score (accepted + acted_on - dismissed) */
  actionScores: Record<string, number>
  /** Total signals recorded */
  totalSignals: number
  /** Last updated timestamp */
  lastUpdatedAt: number
}

// ── Storage key ───────────────────────────────────────────────────────────────

const FEEDBACK_STORAGE_KEY = 'donna:feedback:v1'
const MAX_SIGNALS_STORED = 100 // cap to avoid localStorage bloat

// ── Core signal writers ───────────────────────────────────────────────────────

/**
 * Record a feedback signal for a DONNA recommendation.
 * Writes to localStorage — safe, no DB, no private data.
 */
export function recordFeedback(
  outcome: FeedbackOutcome,
  actionId: string,
  pathname: string,
): void {
  if (typeof window === 'undefined') return

  const signal: FeedbackSignal = {
    actionId,
    pathname,
    outcome,
    timestamp: Date.now(),
  }

  try {
    const existing = loadRawSignals()
    const updated = [...existing, signal].slice(-MAX_SIGNALS_STORED)
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage unavailable or quota exceeded — silently skip
  }
}

function loadRawSignals(): FeedbackSignal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FeedbackSignal[]
  } catch {
    return []
  }
}

// ── Preference aggregation ────────────────────────────────────────────────────

/**
 * Aggregate recorded signals into preference scores.
 * No DB call. Reads from localStorage only.
 */
export function loadFeedbackPreferences(): FeedbackPreferences {
  const signals = loadRawSignals()
  const actionScores: Record<string, number> = {}

  for (const signal of signals) {
    if (!actionScores[signal.actionId]) actionScores[signal.actionId] = 0
    if (signal.outcome === 'accepted' || signal.outcome === 'acted_on') {
      actionScores[signal.actionId] += 1
    } else if (signal.outcome === 'dismissed' || signal.outcome === 'overridden') {
      actionScores[signal.actionId] -= 1
    }
  }

  return {
    actionScores,
    totalSignals: signals.length,
    lastUpdatedAt: signals.length > 0 ? signals[signals.length - 1].timestamp : 0,
  }
}

/**
 * Get the net acceptance score for a recommendation action ID.
 * Higher = more accepted; lower = more dismissed.
 * Returns 0 when no signals recorded.
 */
export function getRecommendationScore(actionId: string): number {
  const prefs = loadFeedbackPreferences()
  return prefs.actionScores[actionId] ?? 0
}

/**
 * Sort an array of recommendation action IDs by their acceptance score (highest first).
 * Pure — does not mutate the input array.
 */
export function sortByFeedbackScore<T extends { id: string }>(recommendations: T[]): T[] {
  const prefs = loadFeedbackPreferences()
  return [...recommendations].sort((a, b) => {
    const scoreA = prefs.actionScores[a.id] ?? 0
    const scoreB = prefs.actionScores[b.id] ?? 0
    return scoreB - scoreA
  })
}

/**
 * Clear all feedback signals from localStorage.
 * Safe to call — does not affect any DB records.
 */
export function clearFeedbackSignals(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(FEEDBACK_STORAGE_KEY)
  } catch {
    // localStorage unavailable — silently skip
  }
}

// ── Session-scoped feedback (RAM only) ────────────────────────────────────────

/** In-session tracking (RAM — clears when panel closes). Not persisted. */
const sessionSignals: FeedbackSignal[] = []

export function recordSessionFeedback(
  outcome: FeedbackOutcome,
  actionId: string,
  pathname: string,
): void {
  sessionSignals.push({ actionId, pathname, outcome, timestamp: Date.now() })
}

export function getSessionFeedbackSummary(): { accepted: number; dismissed: number; actionIds: string[] } {
  const accepted = sessionSignals.filter(s => s.outcome === 'accepted' || s.outcome === 'acted_on').length
  const dismissed = sessionSignals.filter(s => s.outcome === 'dismissed' || s.outcome === 'overridden').length
  const actionIds = [...sessionSignals.map(s => s.actionId)]
  return { accepted, dismissed, actionIds }
}

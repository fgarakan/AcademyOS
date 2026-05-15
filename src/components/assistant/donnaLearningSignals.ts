// Sprint 376 — Donna Learning Feedback Signals V1
// Pure in-memory signal tracker. No React, no DB, no API calls.
// Records what Donna surfaces and what the director acts on — session-only, resets on reload.
// Max 200 signals FIFO. Used by Sprint 377 preference memory for pattern detection.

// ── Signal types ───────────────────────────────────────────────────────────────

export type LearningSignalType =
  | 'recommendation_shown'     // Donna showed a recommendation
  | 'recommendation_acted'     // Director clicked an action on a recommendation
  | 'recommendation_ignored'   // Panel closed without acting (inferred on close)
  | 'workflow_started'         // Director started a Donna workflow
  | 'workflow_completed'       // Workflow reached approval/save
  | 'workflow_discarded'       // Director discarded a workflow
  | 'command_issued'           // Director typed or spoke a command Donna recognized
  | 'command_unrecognized'     // Director input did not match any known intent
  | 'review_queue_opened'      // Director opened the review queue panel
  | 'daily_brief_requested'    // Director asked for the daily brief
  | 'attention_requested'      // Director asked what needs attention

export interface LearningSignal {
  id: string
  type: LearningSignalType
  // Optional context metadata — never PII, never record-level data
  category?: string            // e.g. recommendation category, workflow type
  workflowId?: string
  recommendationId?: string
  timestamp: string            // ISO string
}

// ── In-memory store ────────────────────────────────────────────────────────────

const MAX_SIGNALS = 200

let _signals: LearningSignal[] = []
let _idCounter = 0

function nextId(): string {
  _idCounter += 1
  return `sig_${Date.now()}_${_idCounter}`
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Record a learning signal. FIFO-trims to MAX_SIGNALS.
 */
export function recordSignal(
  type: LearningSignalType,
  meta?: {
    category?: string
    workflowId?: string
    recommendationId?: string
  },
): void {
  const signal: LearningSignal = {
    id: nextId(),
    type,
    category: meta?.category,
    workflowId: meta?.workflowId,
    recommendationId: meta?.recommendationId,
    timestamp: new Date().toISOString(),
  }
  _signals.push(signal)
  if (_signals.length > MAX_SIGNALS) {
    _signals = _signals.slice(_signals.length - MAX_SIGNALS)
  }
}

/**
 * Return a shallow copy of all recorded signals (oldest first).
 */
export function getSignals(): LearningSignal[] {
  return [..._signals]
}

/**
 * Return signals filtered by type.
 */
export function getSignalsByType(type: LearningSignalType): LearningSignal[] {
  return _signals.filter(s => s.type === type)
}

/**
 * Return how many times a given signal type was recorded.
 */
export function countSignals(type: LearningSignalType): number {
  return _signals.filter(s => s.type === type).length
}

/**
 * Clear all signals. Used for testing or explicit reset.
 */
export function clearSignals(): void {
  _signals = []
}

// ── Summary helper ─────────────────────────────────────────────────────────────

export interface SignalSummary {
  totalSignals: number
  workflowsStarted: number
  workflowsCompleted: number
  workflowsDiscarded: number
  recommendationsActed: number
  recommendationsIgnored: number
  commandsIssued: number
  commandsUnrecognized: number
}

/**
 * Compute a summary of all signals for the current session.
 */
export function summarizeSignals(): SignalSummary {
  return {
    totalSignals: _signals.length,
    workflowsStarted: countSignals('workflow_started'),
    workflowsCompleted: countSignals('workflow_completed'),
    workflowsDiscarded: countSignals('workflow_discarded'),
    recommendationsActed: countSignals('recommendation_acted'),
    recommendationsIgnored: countSignals('recommendation_ignored'),
    commandsIssued: countSignals('command_issued'),
    commandsUnrecognized: countSignals('command_unrecognized'),
  }
}

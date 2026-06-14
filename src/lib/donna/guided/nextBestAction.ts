// Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
// NextBestAction — universal action model.
//
// All intelligence engines produce NextBestAction instances.
// This type is the single contract between the execution engine
// and the Director experience layer.
//
// Pure TypeScript — no DB, no side effects.

// ── Core action type ──────────────────────────────────────────────────────────

export interface NextBestAction {
  /** Stable ID for deduplication across session turns (signal-derived or synthetic). */
  id: string
  /** Short, directive headline. The "what". */
  title: string
  /** Expanded explanation. The "how". */
  description: string
  /** The "why now". One sentence. */
  reason: string
  /** 0–100: leverage relative to other available actions. */
  impactScore: number
  /** 0–100: time-sensitivity of the action. */
  urgencyScore: number
  /** 0–100: confidence in this recommendation. Derived from guidance.confidence. */
  confidenceScore: number
  /** Domain of the action: players, coaches, parents, etc. */
  domain: string
  /** Optional entity type for contextual navigation. */
  entityType: string | null
  /** Optional entity route or ID for deep linking. */
  entityId: string | null
  /** Navigation target. Null if action is on current page. */
  route: string | null
  /** Unambiguous completion test. Director can self-verify without re-asking. */
  completionCriteria: string
  /** Hint about what follows after this action is done. */
  nextActionHint: string | null
  /** Human-readable time estimate. */
  estimatedMinutes: string
}

// ── Execution state ───────────────────────────────────────────────────────────

export interface ExecutionState {
  activeActionId:    string | null
  activeActionTitle: string | null
  activeEntityId:    string | null
  activeEntityType:  string | null
  activeRoute:       string | null
  startedAt:         string | null
  completionCriteria: string | null
  executionStatus:   'idle' | 'active' | 'help_requested' | 'completed' | 'abandoned'
  lastInstruction:   string | null
  helpCount:         number
  domain:            string | null
}

/** Minimal snapshot passed from client to server per turn. */
export type ExecutionStateSnapshot = {
  activeActionId:    string | null
  activeActionTitle: string | null
  activeRoute:       string | null
  completionCriteria: string | null
  domain:            string | null
}

// ── Execution history ─────────────────────────────────────────────────────────

export interface ExecutionRecord {
  id:           string
  title:        string
  domain:       string
  status:       'completed' | 'skipped' | 'abandoned'
  completedAt:  string
  durationMs:   number
  helpRequests: number
}

// ── Factory helpers ───────────────────────────────────────────────────────────

export function createIdleExecutionState(): ExecutionState {
  return {
    activeActionId:    null,
    activeActionTitle: null,
    activeEntityId:    null,
    activeEntityType:  null,
    activeRoute:       null,
    startedAt:         null,
    completionCriteria: null,
    executionStatus:   'idle',
    lastInstruction:   null,
    helpCount:         0,
    domain:            null,
  }
}

export function executionStateFromAction(action: NextBestAction): ExecutionState {
  return {
    activeActionId:    action.id,
    activeActionTitle: action.title,
    activeEntityId:    action.entityId,
    activeEntityType:  action.entityType,
    activeRoute:       action.route,
    startedAt:         new Date().toISOString(),
    completionCriteria: action.completionCriteria,
    executionStatus:   'active',
    lastInstruction:   action.title,
    helpCount:         0,
    domain:            action.domain,
  }
}

export function snapshotFromExecutionState(state: ExecutionState): ExecutionStateSnapshot {
  return {
    activeActionId:    state.activeActionId,
    activeActionTitle: state.activeActionTitle,
    activeRoute:       state.activeRoute,
    completionCriteria: state.completionCriteria,
    domain:            state.domain,
  }
}

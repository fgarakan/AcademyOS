// Sprint 2261–2290 — DONNA Memory Activation V1
// Shared types for the four-tier DONNA memory system.
// Pure type definitions — no DB, no React, no side effects.
//
// Tier 1: Session Memory    — what we discussed recently
// Tier 2: Decision Memory   — what the director has decided
// Tier 3: Entity Memory     — the story on a specific player/entity
// Tier 4: Academy Memory    — how this academy operates

// ── Tier 1: Session Memory ────────────────────────────────────────────────────

export interface PriorSessionEntry {
  startedAt: string                // ISO timestamp
  endedAt: string | null
  sessionSummaryText: string       // one human-readable sentence
  topicsDiscussed: string[]        // domain labels: players, curriculum, review_queue, etc.
  pagesVisited: string[]           // human-readable page labels
  entitiesReferenced: string[]     // entity labels (no IDs in prompt)
  actionsCompleted: string[]       // action_labels of executed/approved proposed_actions
  actionsPending: string[]         // action_labels still pending_review at session close
  openItems: string[]              // unresolved items (max 2 for token budget)
}

export interface PriorSessionContext {
  sessions: PriorSessionEntry[]    // last 2 closed sessions, newest first
  mostRecentAt: string | null      // ISO timestamp of the most recent closed session
}

// ── Tier 2: Decision Memory ───────────────────────────────────────────────────

export interface DecisionEntry {
  date: string                     // human-readable relative date ("2 days ago", "last week")
  action: string                   // action_label, truncated to 80 chars
  outcome: 'approved' | 'rejected' | 'modified' | 'expired'
  targetArea: string | null        // curriculum / player / coach / session / other
}

export interface DecisionMemoryContext {
  recentDecisions: DecisionEntry[] // last 5 decisions across all areas
  approvalRate: number             // 0–1, fraction of decisions approved (vs. rejected)
  dominantArea: string | null      // the module type most frequently actioned
}

// ── Tier 3: Entity Memory ─────────────────────────────────────────────────────

export interface EntityMemoryContext {
  entityType: 'player' | 'group' | 'session' | 'curriculum_level'
  entityLabel: string
  operatingSummary: string | null  // from donna_entity_summaries (kind: operating)
  activePriorities: string[]       // top 2 from player_development_blueprints
  recentSignals: string[]          // last 3 signals (type + severity label)
  activeRecommendations: string[]  // urgent/immediate from player_recommendations
  recentDecisions: string[]        // last 3 proposed_actions for this entity
  lastDiscussedAt: string | null   // when DONNA last discussed this entity
}

// ── Tier 4: Academy Memory ────────────────────────────────────────────────────

export interface AcademyMemoryContext {
  academyName: string | null
  identityNarrative: string | null    // one sentence describing the academy's character
  dominantDecisionPattern: string | null  // e.g. "Approves curriculum additions quickly; often defers assessments"
  recentEvolutionSummary: string | null   // e.g. "Curriculum expansion phase — 14 additions in 90 days"
  totalApprovedDecisions: number
  approvalRatePercent: number             // 0–100
}

// ── Full memory packet ────────────────────────────────────────────────────────

export interface MemoryContextPacket {
  priorSessionContext: PriorSessionContext | null
  decisionMemoryContext: DecisionMemoryContext | null
  entityMemoryContext: EntityMemoryContext | null
  academyMemoryContext: AcademyMemoryContext | null
}

export const EMPTY_MEMORY_PACKET: MemoryContextPacket = {
  priorSessionContext: null,
  decisionMemoryContext: null,
  entityMemoryContext: null,
  academyMemoryContext: null,
}

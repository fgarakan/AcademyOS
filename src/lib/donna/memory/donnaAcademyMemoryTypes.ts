// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Canonical types for the academy memory framework.
// Pure type definitions — no imports from other donna modules.
// No DB, no React, no side effects.

// ── Memory source types ────────────────────────────────────────────────────────

export type MemorySourceType =
  | 'proposed_action'       // generic approved/rejected/executed proposed_action
  | 'promotion_decision'    // player promotion or level advancement
  | 'placement_decision'    // player placement / onboarding activation
  | 'assessment_result'     // assessment completed and actioned
  | 'coach_assignment'      // coach assigned to player
  | 'coach_wrap_up'         // coach session wrap-up reviewed
  | 'parent_update'         // parent communication approved/sent
  | 'curriculum_change'     // curriculum override or content change
  | 'director_override'     // director modified a DONNA proposal (modified_payload set)
  | 'donna_recommendation'  // a DONNA-generated recommendation (from execution plan)

// ── Memory importance ─────────────────────────────────────────────────────────

export type MemoryImportance = 'critical' | 'high' | 'medium' | 'low'

// ── Memory confidence ─────────────────────────────────────────────────────────

export type MemoryConfidence =
  | 'high'      // backed by a real DB row (proposed_action with clear fields)
  | 'medium'    // backed by DB but some fields inferred from text
  | 'low'       // partially reconstructed from limited data
  | 'inferred'  // derived from patterns, no direct DB source

// ── Entity link ───────────────────────────────────────────────────────────────

export interface MemoryEntityLink {
  entityType: 'player' | 'coach' | 'group' | 'curriculum_level' | 'academy' | 'session' | 'template'
  entityId: string | null      // null = name-only, no UUID available
  entityLabel: string          // human-readable label
}

// ── Academy memory ────────────────────────────────────────────────────────────

export interface AcademyMemory {
  id: string                   // proposed_action id or generated id
  sourceType: MemorySourceType
  headline: string             // the action_label from proposed_action (human-readable)
  summary: string              // DONNA's interpretation: what happened, what it means
  evidence: string[]           // supporting signals from reviewer_notes / risk_notes
  entityLinks: MemoryEntityLink[]
  importance: MemoryImportance
  confidence: MemoryConfidence
  occurredAt: string           // ISO date — approved_at / created_at of the decision
  overrideReason: string | null // set when director modified the original DONNA proposal
  reviewerNotes: string | null  // director's notes at approval/rejection time
  dataGaps: string[]           // what information is missing or unclear
}

// ── Timeline event ────────────────────────────────────────────────────────────

export interface MemoryTimelineEvent {
  memoryId: string
  sourceType: MemorySourceType
  headline: string
  occurredAt: string
  importance: MemoryImportance
  entityLinks: MemoryEntityLink[]
}

// ── Retrieval result ──────────────────────────────────────────────────────────

export interface MemoryRetrievalResult {
  memories: AcademyMemory[]
  timeline: MemoryTimelineEvent[]
  totalFound: number
  confidence: MemoryConfidence
  missingDataDisclosure: string | null
  queryExplainer: string         // one sentence explaining what was searched
  entityFilter: string | null    // entity name used to filter, if any
}

// ── Memory intent ─────────────────────────────────────────────────────────────

export type MemoryIntentType =
  | 'player_history'        // "what happened with Jake?"
  | 'coach_history'         // "what has Coach Danny been doing?"
  | 'entity_timeline'       // "what changed with Orange 2?"
  | 'decision_history'      // "what did we decide last time?"
  | 'override_history'      // "what did I override?"
  | 'recommendation_history' // "what did DONNA recommend?"
  | 'general_history'       // "what happened recently?"

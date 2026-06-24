// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 1 — Context source catalog.
//
// The canonical list of context sources the Context Resolver can assemble into an
// Executive Context Packet. Each source has a stable id, a human label, a token
// cost weight (used by the resolver's budgeter), and a redaction class (used by
// the permission redaction pass). This module holds NO data and makes NO calls —
// it is the vocabulary the reasoning layer and resolver agree on.
//
// Principle: reasoning decides WHICH sources are required; this catalog only
// describes what each source IS and what it costs.

// ── Source identifiers ──────────────────────────────────────────────────────────

export type ContextSourceId =
  | 'conversation_history'
  | 'current_page'
  | 'current_route'
  | 'active_workflow'
  | 'active_draft'
  | 'academy'
  | 'academy_defaults'
  | 'curriculum'
  | 'development_spine'
  | 'role'
  | 'permissions'
  | 'available_actions'
  | 'outstanding_decisions'
  | 'donna_assumptions'
  | 'navigation_target'
  | 'relevant_memory'
  | 'player_context'
  | 'coach_context'
  | 'parent_context'

// ── Redaction classes ───────────────────────────────────────────────────────────
// Drives the resolver's permission pass. 'sensitive' sources are gated by role and
// permissions; 'tenant' sources must be tenant-scoped before they may be included
// (the deferred curriculum multi-tenant RLS hole lives here — see the audit).

export type RedactionClass = 'open' | 'sensitive' | 'tenant'

// ── Freshness ───────────────────────────────────────────────────────────────────
// per_turn  — recomputed every turn (reality, drafts, page)
// session   — stable within a session (role, permissions, assumptions)
// cached    — stable across turns with a TTL (academy defaults, curriculum, spine)

export type Freshness = 'per_turn' | 'session' | 'cached'

export interface ContextSourceMeta {
  id: ContextSourceId
  label: string
  /** Relative token cost weight for the budgeter (higher = more expensive). */
  costWeight: number
  redaction: RedactionClass
  freshness: Freshness
}

export const CONTEXT_SOURCES: Record<ContextSourceId, ContextSourceMeta> = {
  conversation_history:  { id: 'conversation_history',  label: 'Conversation history',  costWeight: 4, redaction: 'open',      freshness: 'per_turn' },
  current_page:          { id: 'current_page',          label: 'Current page',          costWeight: 1, redaction: 'open',      freshness: 'per_turn' },
  current_route:         { id: 'current_route',         label: 'Current route',         costWeight: 1, redaction: 'open',      freshness: 'per_turn' },
  active_workflow:       { id: 'active_workflow',       label: 'Active workflow',       costWeight: 2, redaction: 'open',      freshness: 'per_turn' },
  active_draft:          { id: 'active_draft',          label: 'Active draft',          costWeight: 3, redaction: 'open',      freshness: 'per_turn' },
  academy:               { id: 'academy',               label: 'Academy',               costWeight: 2, redaction: 'open',      freshness: 'cached'   },
  academy_defaults:      { id: 'academy_defaults',      label: 'Academy defaults',      costWeight: 2, redaction: 'open',      freshness: 'cached'   },
  curriculum:            { id: 'curriculum',            label: 'Curriculum',            costWeight: 4, redaction: 'tenant',    freshness: 'cached'   },
  development_spine:     { id: 'development_spine',      label: 'Development Spine',     costWeight: 5, redaction: 'tenant',    freshness: 'cached'   },
  role:                  { id: 'role',                  label: 'Director role',         costWeight: 1, redaction: 'open',      freshness: 'session'  },
  permissions:           { id: 'permissions',           label: 'Permissions',           costWeight: 1, redaction: 'open',      freshness: 'session'  },
  available_actions:     { id: 'available_actions',     label: 'Available actions',     costWeight: 3, redaction: 'sensitive', freshness: 'session'  },
  outstanding_decisions: { id: 'outstanding_decisions', label: 'Outstanding decisions', costWeight: 3, redaction: 'open',      freshness: 'per_turn' },
  donna_assumptions:     { id: 'donna_assumptions',     label: 'DONNA assumptions',     costWeight: 2, redaction: 'open',      freshness: 'session'  },
  navigation_target:     { id: 'navigation_target',     label: 'Navigation target',     costWeight: 1, redaction: 'open',      freshness: 'per_turn' },
  relevant_memory:       { id: 'relevant_memory',       label: 'Relevant memory',       costWeight: 3, redaction: 'open',      freshness: 'cached'   },
  player_context:        { id: 'player_context',        label: 'Player context',        costWeight: 4, redaction: 'sensitive', freshness: 'per_turn' },
  coach_context:         { id: 'coach_context',         label: 'Coach context',         costWeight: 3, redaction: 'sensitive', freshness: 'per_turn' },
  parent_context:        { id: 'parent_context',        label: 'Parent context',        costWeight: 4, redaction: 'sensitive', freshness: 'per_turn' },
}

export const ALL_CONTEXT_SOURCE_IDS: ContextSourceId[] = Object.keys(CONTEXT_SOURCES) as ContextSourceId[]

export function sourceMeta(id: ContextSourceId): ContextSourceMeta {
  return CONTEXT_SOURCES[id]
}

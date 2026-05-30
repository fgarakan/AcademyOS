// Sprint 978 — DONNA LLM Orchestration Foundation V1
// Sprint 979 — V2 additions: ConversationTurn, ConversationHistory, PageContextSummary, AcademyStateSummary
// Core type definitions for the DONNA LLM orchestration layer.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// This file defines the complete type contract for safe LLM orchestration.
// All types are designed to prevent unsafe mutations and enforce review gates.

// ── Role types ────────────────────────────────────────────────────────────────

export type OrchestratorRole = 'academy_director' | 'head_coach' | 'coach'

// ── Safety levels ─────────────────────────────────────────────────────────────

/**
 * Safety classification for an orchestrated action or tool output.
 * These map to the same levels used in directorActionExplanation.ts.
 */
export type OrchestratorSafetyLevel =
  | 'safe'            // Read-only — no mutation possible
  | 'review_only'     // Creates a draft — no direct mutation without explicit save
  | 'approval_gated'  // Requires explicit director approve before records change
  | 'blocked'         // Never allowed — no orchestration path exists for this

// ── Allowed V1 output types ───────────────────────────────────────────────────

/**
 * The complete set of output types the LLM orchestrator may produce in V1.
 * BLOCKED outputs are listed separately in safetyContract.ts.
 *
 * V1 allowed:
 *   answer                  — text response to a question
 *   recommend_next_action   — deterministic next-action from directorNextActionEngine
 *   highlight_target        — set focus target + dispatch donna:highlight
 *   explain_action          — structured explanation from directorActionExplanation
 *   draft_proposed_action   — create a proposed_action draft for review
 *   route_to_review         — direct director to review queue
 *   ask_clarifying_question — request more context before acting
 */
export type OrchestratorOutputType =
  | 'answer'
  | 'recommend_next_action'
  | 'highlight_target'
  | 'explain_action'
  | 'draft_proposed_action'
  | 'route_to_review'
  | 'ask_clarifying_question'

// ── Tool request ──────────────────────────────────────────────────────────────

/**
 * A tool the LLM is requesting to execute.
 * Tools are validated against the safety contract before any execution.
 */
export interface OrchestratorToolRequest {
  /** The tool identifier — must match a registered safe tool */
  tool: OrchestratorToolId
  /** Parameters the tool needs — always structured, never raw text */
  params: Record<string, unknown>
  /** Rationale the LLM provides for this tool call */
  reasoning: string
  /** Safety level the LLM claims for this tool call */
  claimedSafety: OrchestratorSafetyLevel
}

/**
 * V1 registered safe tools.
 * Each tool has a defined input/output contract in the safety contract registry.
 */
export type OrchestratorToolId =
  | 'get_pending_review_count'       // Read: count of pending proposed_actions
  | 'get_next_action_recommendation' // Deterministic: buildDirectorNextAction()
  | 'get_action_explanation'         // Deterministic: buildActionExplanation()
  | 'get_review_queue_guidance'      // Deterministic: buildReviewQueueGuidance()
  | 'get_page_context'               // Read: current page label + context
  | 'set_highlight_target'           // UI: dispatch donna:highlight
  | 'draft_proposed_action'          // Write (gated): create proposed_action draft
  | 'route_to_page'                  // UI: suggest navigation (no auto-nav)

// ── Orchestrator output ───────────────────────────────────────────────────────

/**
 * A single output from the orchestrator.
 * May be text, a tool result, a highlight action, or a clarification request.
 */
export interface OrchestratorOutput {
  type: OrchestratorOutputType
  /** The primary text response to show the director */
  text: string
  /** Optional tool request the orchestrator wants to execute next */
  toolRequest?: OrchestratorToolRequest
  /** Optional focus target to highlight */
  highlightTarget?: {
    targetId: string
    label: string
    route: string
  }
  /** Optional route recommendation (not auto-navigation) */
  suggestedRoute?: string
  /** Safety level of this output */
  safetyLevel: OrchestratorSafetyLevel
  /** Whether this output requires human confirmation before any execution */
  requiresConfirmation: boolean
  /** Confidence in the output (high = deterministic; low = inferred) */
  confidence: 'high' | 'medium' | 'low'
  /** What signal drove this output (for transparency) */
  source: 'deterministic' | 'llm_inferred' | 'fallback'
}

// ── Sprint 979: Conversation history ─────────────────────────────────────────

/** A single turn in the DONNA conversation. Stored in RAM only — never persisted to DB here. */
export interface ConversationTurn {
  /** 'user' = director/coach input; 'donna' = DONNA response */
  role: 'user' | 'donna'
  /** Sanitized text content — no raw private data */
  content: string
  /** Unix timestamp for ordering */
  timestamp: number
  /** The output type that produced this DONNA turn */
  outputType?: OrchestratorOutputType
}

/** Recent conversation history — capped at 10 turns to keep context small. */
export type ConversationHistory = ConversationTurn[]

// ── Sprint 979: Page context summary ─────────────────────────────────────────

/** Safe summary of what's available on the current page for DONNA to reference. */
export interface PageContextSummary {
  /** Human-readable page label */
  pageLabel: string
  /** Current pathname */
  pathname: string
  /** Available highlight targets on this page (focus IDs) */
  highlightTargets: string[]
  /** Available prompt chips on this page */
  promptChips: string[]
  /** Whether the page has approval/review functionality */
  hasApprovalGates: boolean
  /** Whether the page is director-only */
  isDirectorOnly: boolean
}

// ── Sprint 979: Safe academy state summary ────────────────────────────────────

/**
 * Safe high-level summary of academy state for LLM context.
 * No raw player names, coach notes, or private data.
 * Counts and status flags only.
 */
export interface AcademyStateSummary {
  /** Number of pending review items (from panel state — no new DB query) */
  pendingReviewCount: number
  /** Number of sessions today (from brief or panel state) */
  todaySessionCount: number
  /** Whether any sessions are missing wrap-ups */
  hasMissingRecaps: boolean
  /** Number of active players (total — no names) */
  activePlayers: number
  /** Whether any players are pending placement */
  hasPlayersNeedingPlacement: boolean
  /** Whether any players are advancement-eligible */
  hasAdvancementEligiblePlayers: boolean
  /** Health signal from daily brief */
  academyHealthSignal: 'on_track' | 'attention_needed' | 'critical' | 'unknown'
}

// ── Safe response envelope ────────────────────────────────────────────────────

/**
 * The complete response envelope from the orchestrator.
 * All orchestration results are wrapped in this type.
 * The caller is responsible for rendering and any UI side effects.
 */
export interface OrchestratorResponse {
  /** The primary output to show */
  primaryOutput: OrchestratorOutput
  /** Optional secondary outputs (e.g., follow-up suggestions) */
  secondaryOutputs: OrchestratorOutput[]
  /** Whether any blocked action was attempted and rejected */
  hadBlockedAttempt: boolean
  /** Summary of safety decisions made during this orchestration */
  safetyAudit: string[]
  /** The orchestration context that was used */
  contextSummary: string
}

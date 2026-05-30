// Sprint 978 — DONNA LLM Orchestration Safety Contract
// Defines what the LLM orchestrator is allowed and blocked from doing.
// Pure TypeScript — no DB, no API, no React.
//
// This is the authoritative safety boundary document.
// Any output type or tool not listed as allowed is implicitly blocked.
// All risky actions are approval_gated — never safe to execute without director review.

import type { OrchestratorToolId, OrchestratorOutputType, OrchestratorSafetyLevel } from './types'

// ── Allowed output types ──────────────────────────────────────────────────────

/** V1 allowed output types with their safety level. */
export const ALLOWED_OUTPUTS: Record<OrchestratorOutputType, {
  safetyLevel: OrchestratorSafetyLevel
  description: string
  requiresConfirmation: boolean
}> = {
  answer: {
    safetyLevel: 'safe',
    description: 'Text answer to a director question. No mutation. No side effects.',
    requiresConfirmation: false,
  },
  recommend_next_action: {
    safetyLevel: 'safe',
    description: 'Next-action recommendation from deterministic engine. No mutation.',
    requiresConfirmation: false,
  },
  highlight_target: {
    safetyLevel: 'safe',
    description: 'Visual highlight of a UI element. sessionStorage write only — no DB.',
    requiresConfirmation: false,
  },
  explain_action: {
    safetyLevel: 'safe',
    description: 'Structured explanation of a recommended action. No mutation.',
    requiresConfirmation: false,
  },
  draft_proposed_action: {
    safetyLevel: 'review_only',
    description: 'Create a proposed_action draft for director review. Director must explicitly approve before execution.',
    requiresConfirmation: true,
  },
  route_to_review: {
    safetyLevel: 'safe',
    description: 'Suggest the director navigate to the review queue. No auto-navigation.',
    requiresConfirmation: false,
  },
  ask_clarifying_question: {
    safetyLevel: 'safe',
    description: 'Request more context from the director before acting.',
    requiresConfirmation: false,
  },
}

// ── Blocked output types ──────────────────────────────────────────────────────

/** V1 blocked actions — the LLM may NEVER produce outputs that result in these. */
export const BLOCKED_ACTIONS = [
  'approve_review_item',           // Director must approve — never LLM
  'reject_review_item',            // Director must reject — never LLM
  'send_parent_message',           // Parent comms require explicit director send
  'send_player_message',           // Player comms require explicit director send
  'change_player_level',           // Level movement is director-only action
  'change_roster',                 // Roster changes are director-only
  'change_billing',                // Billing is blocked entirely
  'publish_curriculum',            // Curriculum goes through review — never direct publish
  'mutate_official_record_directly', // All official record changes require approval
  'delete_record',                 // Deletion requires explicit director action
  'bypass_rls',                    // RLS bypass is never allowed
  'expose_raw_coach_notes',        // Raw coach notes never shown to parents/players
  'expose_internal_assessments',   // Internal assessments never shown without approval
] as const

export type BlockedAction = typeof BLOCKED_ACTIONS[number]

// ── Registered safe tools ─────────────────────────────────────────────────────

/** V1 tool registry — tools the orchestrator may request. */
export const SAFE_TOOL_REGISTRY: Record<OrchestratorToolId, {
  safetyLevel: OrchestratorSafetyLevel
  description: string
  requiredParams: string[]
  blockedFor: OrchestratorSafetyLevel[]
}> = {
  get_pending_review_count: {
    safetyLevel: 'safe',
    description: 'Returns the count of pending proposed_actions. Already in panel state — no new DB query.',
    requiredParams: [],
    blockedFor: [],
  },
  get_next_action_recommendation: {
    safetyLevel: 'safe',
    description: 'Calls buildDirectorNextAction() deterministically. No DB. No mutation.',
    requiredParams: ['pathname'],
    blockedFor: [],
  },
  get_action_explanation: {
    safetyLevel: 'safe',
    description: 'Calls buildActionExplanation() for a DirectorNextAction. No DB. No mutation.',
    requiredParams: ['actionId'],
    blockedFor: [],
  },
  get_review_queue_guidance: {
    safetyLevel: 'safe',
    description: 'Calls buildReviewQueueGuidance() for a guidance intent. No DB. No mutation.',
    requiredParams: ['intent'],
    blockedFor: [],
  },
  get_page_context: {
    safetyLevel: 'safe',
    description: 'Returns the current page label and context from the chip registry.',
    requiredParams: ['pathname'],
    blockedFor: [],
  },
  set_highlight_target: {
    safetyLevel: 'safe',
    description: 'Writes to sessionStorage and dispatches donna:highlight. No DB write.',
    requiredParams: ['targetId', 'label', 'route'],
    blockedFor: [],
  },
  draft_proposed_action: {
    safetyLevel: 'approval_gated',
    description: 'Creates a proposed_action draft for director review. Director must explicitly approve before execution. Goes through existing proposed_actions pipeline.',
    requiredParams: ['actionType', 'payload', 'actorId', 'academyId'],
    blockedFor: ['safe', 'review_only'], // only valid in approval_gated context
  },
  route_to_page: {
    safetyLevel: 'safe',
    description: 'Suggests navigation to a route. No auto-navigation — director clicks.',
    requiredParams: ['route'],
    blockedFor: [],
  },
}

// ── Safety validators ─────────────────────────────────────────────────────────

/** Returns true if the given tool is safe to execute in V1. */
export function isToolAllowed(toolId: OrchestratorToolId): boolean {
  return toolId in SAFE_TOOL_REGISTRY
}

/** Returns true if the given output type is allowed in V1. */
export function isOutputAllowed(outputType: OrchestratorOutputType): boolean {
  return outputType in ALLOWED_OUTPUTS
}

/** Returns true if the given action label is explicitly blocked in V1. */
export function isActionBlocked(action: string): boolean {
  return (BLOCKED_ACTIONS as readonly string[]).includes(action)
}

/** Returns the safety level for a given tool, or 'blocked' if not registered. */
export function getToolSafetyLevel(toolId: OrchestratorToolId): OrchestratorSafetyLevel {
  return SAFE_TOOL_REGISTRY[toolId]?.safetyLevel ?? 'blocked'
}

/**
 * Validate a tool request before any execution.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateToolRequest(
  toolId: OrchestratorToolId,
  params: Record<string, unknown>,
): { valid: true } | { valid: false; reason: string } {
  if (!isToolAllowed(toolId)) {
    return { valid: false, reason: `Tool '${toolId}' is not registered in V1 safe tool registry.` }
  }
  const spec = SAFE_TOOL_REGISTRY[toolId]
  for (const required of spec.requiredParams) {
    if (!(required in params) || params[required] === undefined || params[required] === null) {
      return { valid: false, reason: `Tool '${toolId}' requires parameter '${required}' which is missing.` }
    }
  }
  return { valid: true }
}

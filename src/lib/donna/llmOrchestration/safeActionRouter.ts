// Sprint 981 — DONNA Safe Action Router V1
// Routes DONNA outputs to the correct execution path based on safety level and action type.
// Pure TypeScript — no DB, no API, no React, no direct mutations.
//
// The router sits between the orchestrator output and actual execution.
// It enforces safety boundaries and routes each action to the correct handler:
//   safe         → execute immediately (UI only — no DB)
//   review_only  → create draft, show to director, wait for explicit save
//   approval_gated → create proposed_action draft, route to review queue
//   blocked      → reject with explanation
//
// Usage:
//   const routingResult = routeAction(orchestratorOutput)
//   // routingResult.path: 'immediate' | 'draft' | 'review_queue' | 'blocked'
//   // routingResult.instructions: what the UI should do next
//   // routingResult.requiresDirectorAction: whether director must act

import type { OrchestratorOutput, OrchestratorSafetyLevel } from './types'
import type { ToolCallResult } from './toolCallingContract'

// ── Routing path ──────────────────────────────────────────────────────────────

/**
 * The execution path the router has chosen for this action.
 *
 * immediate     — execute now (UI-only: highlight, navigate suggestion, text answer)
 * draft         — show director a draft, wait for explicit save
 * review_queue  — create proposed_action draft, route to review queue
 * blocked       — action is not allowed — explain why, do not execute
 */
export type ActionRoutingPath = 'immediate' | 'draft' | 'review_queue' | 'blocked'

// ── Routing result ────────────────────────────────────────────────────────────

export interface ActionRoutingResult {
  /** Which execution path was chosen */
  path: ActionRoutingPath
  /** What the UI should do next */
  instructions: ActionInstruction[]
  /** Whether the director must take an explicit action before anything proceeds */
  requiresDirectorAction: boolean
  /** Human-readable explanation of why this path was chosen */
  rationale: string
  /** Safety level of the input that drove this routing decision */
  safetyLevel: OrchestratorSafetyLevel
  /** Audit entry for this routing decision */
  auditEntry: string
}

// ── Instructions ──────────────────────────────────────────────────────────────

export type ActionInstructionType =
  | 'show_text'           // Display text in the DONNA panel
  | 'set_highlight'       // Dispatch donna:highlight
  | 'suggest_navigation'  // Show a "Go to [route]" link — no auto-navigation
  | 'show_draft_card'     // Show a draft card for director to review/save
  | 'route_to_review'     // Direct director to /director/review
  | 'show_blocked_message' // Explain why action was blocked

export interface ActionInstruction {
  type: ActionInstructionType
  /** Payload for this instruction */
  payload: Record<string, unknown>
}

// ── Route rules ───────────────────────────────────────────────────────────────

/**
 * Routing rules by output type and safety level.
 * 'immediate' = safe to execute in UI immediately.
 * 'draft'     = show draft panel, director saves explicitly.
 * 'review_queue' = route to /director/review.
 * 'blocked'   = never allowed.
 */
const ROUTING_TABLE: Record<string, ActionRoutingPath> = {
  // Output type: safety level
  'answer:safe': 'immediate',
  'answer:review_only': 'immediate', // answer is always safe to show
  'answer:approval_gated': 'immediate',
  'recommend_next_action:safe': 'immediate',
  'recommend_next_action:review_only': 'immediate',
  'recommend_next_action:approval_gated': 'draft',
  'highlight_target:safe': 'immediate',
  'explain_action:safe': 'immediate',
  'draft_proposed_action:safe': 'draft',
  'draft_proposed_action:review_only': 'draft',
  'draft_proposed_action:approval_gated': 'review_queue',
  'route_to_review:safe': 'immediate',
  'ask_clarifying_question:safe': 'immediate',
  // Anything blocked is blocked
  'any:blocked': 'blocked',
}

function lookupRoutingPath(
  outputType: string,
  safetyLevel: OrchestratorSafetyLevel,
): ActionRoutingPath {
  const key = `${outputType}:${safetyLevel}`
  return ROUTING_TABLE[key] ?? (safetyLevel === 'blocked' ? 'blocked' : 'immediate')
}

// ── Instruction builders ──────────────────────────────────────────────────────

function buildImmediateInstructions(output: OrchestratorOutput): ActionInstruction[] {
  const instructions: ActionInstruction[] = []

  // Always show the text response
  instructions.push({ type: 'show_text', payload: { text: output.text, label: output.type } })

  // Add highlight if target present
  if (output.highlightTarget) {
    instructions.push({
      type: 'set_highlight',
      payload: {
        targetId: output.highlightTarget.targetId,
        label: output.highlightTarget.label,
        route: output.highlightTarget.route,
      },
    })
  }

  // Add navigation suggestion if route present
  if (output.suggestedRoute) {
    instructions.push({
      type: 'suggest_navigation',
      payload: { route: output.suggestedRoute },
    })
  }

  return instructions
}

function buildDraftInstructions(output: OrchestratorOutput): ActionInstruction[] {
  return [
    { type: 'show_text', payload: { text: output.text, label: output.type } },
    {
      type: 'show_draft_card',
      payload: {
        draftType: output.type,
        requiresConfirmation: true,
        toolRequest: output.toolRequest ?? null,
      },
    },
  ]
}

function buildReviewQueueInstructions(output: OrchestratorOutput): ActionInstruction[] {
  return [
    { type: 'show_text', payload: { text: output.text, label: output.type } },
    {
      type: 'route_to_review',
      payload: {
        reason: 'This action requires director approval in the Review Queue.',
        suggestedRoute: '/director/review',
      },
    },
  ]
}

function buildBlockedInstructions(output: OrchestratorOutput): ActionInstruction[] {
  return [
    {
      type: 'show_blocked_message',
      payload: {
        message: 'This action is not available in DONNA V1. It requires explicit director approval through the Review Queue.',
        originalRequest: output.text,
      },
    },
  ]
}

// ── Tool call routing ─────────────────────────────────────────────────────────

/**
 * Route a tool call result to the correct execution path.
 * Used when the orchestrator returns a tool request alongside its output.
 */
export function routeToolResult(result: ToolCallResult): ActionRoutingResult {
  if (!result.ok) {
    return {
      path: 'blocked',
      instructions: [{
        type: 'show_blocked_message',
        payload: { message: `Tool '${result.tool}' failed: ${result.error}` },
      }],
      requiresDirectorAction: false,
      rationale: `Tool call failed: ${result.error}`,
      safetyLevel: 'blocked',
      auditEntry: result.auditEntry,
    }
  }

  if (result.requiresConfirmation) {
    return {
      path: 'draft',
      instructions: [{
        type: 'show_draft_card',
        payload: { tool: result.tool, data: result.data, summary: result.summary },
      }],
      requiresDirectorAction: true,
      rationale: `Tool '${result.tool}' requires director confirmation before proceeding.`,
      safetyLevel: 'approval_gated',
      auditEntry: result.auditEntry,
    }
  }

  return {
    path: 'immediate',
    instructions: [{ type: 'show_text', payload: { text: result.summary, data: result.data } }],
    requiresDirectorAction: false,
    rationale: `Tool '${result.tool}' is safe to execute immediately.`,
    safetyLevel: 'safe',
    auditEntry: result.auditEntry,
  }
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * Route an orchestrator output to the correct execution path.
 * Returns instructions for the UI — the caller handles all side effects.
 *
 * Never auto-executes approval_gated or blocked actions.
 * Always requires explicit director action for draft and review_queue paths.
 */
export function routeAction(output: OrchestratorOutput): ActionRoutingResult {
  const path = lookupRoutingPath(output.type, output.safetyLevel)

  const rationale =
    path === 'immediate' ? `Output type '${output.type}' with safety '${output.safetyLevel}' is safe to show immediately.`
    : path === 'draft' ? `Output type '${output.type}' requires director to review and explicitly save this draft.`
    : path === 'review_queue' ? `Output type '${output.type}' with '${output.safetyLevel}' safety must go through the Review Queue.`
    : `Output type '${output.type}' is blocked in V1 and cannot be executed.`

  const instructions =
    path === 'immediate' ? buildImmediateInstructions(output)
    : path === 'draft' ? buildDraftInstructions(output)
    : path === 'review_queue' ? buildReviewQueueInstructions(output)
    : buildBlockedInstructions(output)

  return {
    path,
    instructions,
    requiresDirectorAction: path !== 'immediate',
    rationale,
    safetyLevel: output.safetyLevel,
    auditEntry: `router:${path} outputType=${output.type} safety=${output.safetyLevel}`,
  }
}

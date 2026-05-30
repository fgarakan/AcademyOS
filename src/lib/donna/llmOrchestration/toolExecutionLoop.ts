// Sprint 1000 — DONNA Tool Execution Loop V1
// Safe single-tool execution loop for LLM tool requests.
// Pure TypeScript — no DB, no API, no React, no mutations (except sessionStorage for highlight).
//
// Purpose:
//   When the LLM returns a valid OrchestratorOutput with a toolRequest field,
//   this module validates, executes (if safe), and interprets the tool result,
//   producing an enhanced OrchestratorOutput with grounded data.
//
// V1 constraints:
//   - Max one tool call per user turn (no recursive loops, no agent chains)
//   - Only safe/read-only tools execute directly
//   - approval_gated tools (draft_proposed_action) do NOT execute — approval message returned
//   - Any failure returns the original LLM output unchanged (never crashes)
//   - All decisions logged to safetyAudit[]
//
// Safe tools (execute directly):
//   get_pending_review_count, get_next_action_recommendation, get_action_explanation,
//   get_review_queue_guidance, get_page_context, set_highlight_target, route_to_page
//
// Approval-gated tools (never execute directly):
//   draft_proposed_action — returns explanation that director confirmation is required

import type { OrchestratorOutput, OrchestratorToolId, OrchestratorSafetyLevel } from './types'
import type { ContextPacket } from './contextPacket'
import { executeToolCall } from './toolCallingContract'
import { interpretToolResult } from './toolResultInterpreter'
import { getToolSafetyLevel, validateToolRequest } from './safetyContract'
// Sprint 1002 — live tool set (server-side async DB execution)
import { isLiveTool } from './liveContextToolExecutor'

// ── Safe-to-execute set ───────────────────────────────────────────────────────

/**
 * V1 tools that are safe to execute directly from the tool loop.
 * All are read-only or UI-only (no DB write, no approval required).
 */
const DIRECTLY_EXECUTABLE_TOOLS: ReadonlySet<OrchestratorToolId> = new Set<OrchestratorToolId>([
  'get_pending_review_count',
  'get_next_action_recommendation',
  'get_action_explanation',
  'get_review_queue_guidance',
  'get_page_context',
  'set_highlight_target',
  'route_to_page',
])

/**
 * Returns true when the tool can be executed directly without director approval.
 * `draft_proposed_action` is the only approval_gated tool in V1 — never executes directly.
 */
export function isSafeToExecuteDirectly(toolId: OrchestratorToolId): boolean {
  return DIRECTLY_EXECUTABLE_TOOLS.has(toolId)
}

// ── Tool execution result ─────────────────────────────────────────────────────

export interface ToolLoopResult {
  /** Whether a tool was executed (false if no toolRequest or blocked) */
  executed: boolean
  /** The enhanced output after tool execution and interpretation */
  output: OrchestratorOutput
  /** What happened in the tool loop */
  auditEntry: string
}

// ── Approval-gated response builder ──────────────────────────────────────────

function buildApprovalGatedResponse(
  original: OrchestratorOutput,
  toolId: OrchestratorToolId,
): OrchestratorOutput {
  return {
    ...original,
    type: 'route_to_review',
    text: `${original.text}\n\nThis action requires your explicit approval. I've prepared the outline — you'll need to review it in the Review Queue before anything is applied. Nothing changes until you approve.`,
    safetyLevel: 'approval_gated',
    requiresConfirmation: true,
    suggestedRoute: '/director/review',
    highlightTarget: {
      targetId: 'review-queue-primary',
      label: 'Review Queue',
      route: '/director/review',
    },
    confidence: original.confidence,
    source: 'deterministic',
  }
}

// ── Tool interpretation → OrchestratorOutput converter ───────────────────────

function interpretationToOutput(
  toolId: OrchestratorToolId,
  interpretation: ReturnType<typeof interpretToolResult>,
  originalOutput: OrchestratorOutput,
): OrchestratorOutput {
  return {
    type: interpretation.shouldSuggestNavigation ? 'route_to_review' : 'answer',
    text: interpretation.donnaText,
    safetyLevel: interpretation.requiresConfirmation ? 'approval_gated' : 'safe',
    requiresConfirmation: interpretation.requiresConfirmation,
    confidence: 'high',
    source: 'deterministic',
    highlightTarget: interpretation.shouldHighlight && interpretation.targetFocusId
      ? {
          targetId: interpretation.targetFocusId,
          label: interpretation.targetRoute ?? toolId,
          route: interpretation.targetRoute ?? originalOutput.suggestedRoute ?? '/director',
        }
      : undefined,
    suggestedRoute: interpretation.suggestedRoute ?? originalOutput.suggestedRoute,
  }
}

// ── Main tool loop ────────────────────────────────────────────────────────────

/**
 * Execute the tool loop for an OrchestratorOutput that contains a toolRequest.
 * Returns either an enhanced output (with tool result) or the original output (on any failure).
 *
 * Safety invariants:
 *   - Only DIRECTLY_EXECUTABLE_TOOLS are executed
 *   - approval_gated tools return an approval-required response without executing
 *   - Any exception returns the original output unchanged
 *   - Never throws
 */
export function runToolExecutionLoop(
  output: OrchestratorOutput,
  ctx: ContextPacket,
  safetyAudit: string[],
): ToolLoopResult {
  // No toolRequest — nothing to do
  if (!output.toolRequest) {
    safetyAudit.push('ToolLoop: No toolRequest on output — skipping.')
    return { executed: false, output, auditEntry: 'no_tool_request' }
  }

  const { tool, params } = output.toolRequest

  // Step 1: Validate tool request against safety contract
  const validation = validateToolRequest(tool, params)
  if (!validation.valid) {
    safetyAudit.push(`ToolLoop: BLOCKED — ${validation.reason}`)
    return { executed: false, output, auditEntry: `blocked:${validation.reason}` }
  }

  // Step 2: Check if tool is safe to execute directly
  const toolSafetyLevel = getToolSafetyLevel(tool)

  if (toolSafetyLevel === 'approval_gated') {
    safetyAudit.push(`ToolLoop: APPROVAL REQUIRED — tool '${tool}' is approval_gated. Not executing directly.`)
    const approvalResponse = buildApprovalGatedResponse(output, tool)
    return {
      executed: false,
      output: approvalResponse,
      auditEntry: `approval_gated:${tool}`,
    }
  }

  if (!isSafeToExecuteDirectly(tool)) {
    safetyAudit.push(`ToolLoop: BLOCKED — tool '${tool}' is not in DIRECTLY_EXECUTABLE_TOOLS.`)
    return { executed: false, output, auditEntry: `not_executable:${tool}` }
  }

  // Step 3: Execute the tool
  let toolResult
  try {
    toolResult = executeToolCall(tool, params)
  } catch (err) {
    safetyAudit.push(`ToolLoop: EXCEPTION in executeToolCall('${tool}'): ${err instanceof Error ? err.message : String(err)}`)
    return { executed: false, output, auditEntry: `exception:${tool}` }
  }

  safetyAudit.push(toolResult.auditEntry)

  if (!toolResult.ok) {
    safetyAudit.push(`ToolLoop: Tool '${tool}' returned ok:false — ${toolResult.error ?? 'unknown error'}. Using original output.`)
    return { executed: false, output, auditEntry: `tool_failed:${tool}` }
  }

  // Step 4: Interpret the tool result into a DONNA response
  let interpretation
  try {
    interpretation = interpretToolResult(toolResult)
  } catch (err) {
    safetyAudit.push(`ToolLoop: EXCEPTION in interpretToolResult: ${err instanceof Error ? err.message : String(err)}`)
    return { executed: false, output, auditEntry: `interpret_exception:${tool}` }
  }

  // Step 5: Convert interpretation to OrchestratorOutput
  const enhanced = interpretationToOutput(tool, interpretation, output)
  safetyAudit.push(`ToolLoop: SUCCESS — tool='${tool}' → donnaText(${interpretation.donnaText.length} chars) shouldHighlight=${interpretation.shouldHighlight}`)

  return {
    executed: true,
    output: enhanced,
    auditEntry: `executed:${tool}`,
  }
}

// ── Sprint 1002: Async live tool execution loop ───────────────────────────────

/**
 * Async wrapper for the tool execution loop that also handles live DB-backed tools.
 * For live tools (get_academy_state, get_player_development_summary):
 *   - Uses liveContextToolExecutor.ts (server-side, dynamic import, RLS enforced)
 *   - Injects academyId from ctx.safeSignals (set by caller, never from LLM)
 * For all other tools:
 *   - Delegates to the synchronous runToolExecutionLoop()
 *
 * Never throws. Always returns ToolLoopResult.
 */
export async function runLiveToolExecutionLoop(
  output: OrchestratorOutput,
  ctx: ContextPacket,
  safetyAudit: string[],
): Promise<ToolLoopResult> {
  const fallback = { executed: false, output, auditEntry: 'no_tool_request' }

  if (!output.toolRequest) return fallback

  const { tool, params } = output.toolRequest

  // Route live tools through async executor
  if (isLiveTool(tool)) {
    const academyId = ctx.safeSignals.academyId
    if (!academyId) {
      safetyAudit.push(`LiveToolLoop: BLOCKED — academyId not available in context for live tool '${tool}'.`)
      return { executed: false, output, auditEntry: `no_academyId:${tool}` }
    }

    safetyAudit.push(`LiveToolLoop: Executing live tool '${tool}' with academyId (${academyId.slice(0, 8)}...).`)

    let liveResult
    try {
      const { executeLiveTool } = await import('./liveContextToolExecutor')
      liveResult = await executeLiveTool(tool, { ...params, academyId })
    } catch (err) {
      safetyAudit.push(`LiveToolLoop: EXCEPTION in executeLiveTool: ${err instanceof Error ? err.message : String(err)}`)
      return { executed: false, output, auditEntry: `exception:live:${tool}` }
    }

    safetyAudit.push(liveResult.auditEntry)

    if (!liveResult.ok) {
      safetyAudit.push(`LiveToolLoop: Live tool '${tool}' failed — ${liveResult.error ?? 'unknown'}. Using original output.`)
      return { executed: false, output, auditEntry: `live_failed:${tool}` }
    }

    let interpretation
    try {
      interpretation = interpretToolResult(liveResult)
    } catch (err) {
      safetyAudit.push(`LiveToolLoop: EXCEPTION in interpretToolResult: ${err instanceof Error ? err.message : String(err)}`)
      return { executed: false, output, auditEntry: `interpret_exception:live:${tool}` }
    }

    const enhanced = interpretationToOutput(tool, interpretation, output)
    safetyAudit.push(`LiveToolLoop: SUCCESS — tool='${tool}' donnaText(${interpretation.donnaText.length} chars)`)
    return { executed: true, output: enhanced, auditEntry: `live_executed:${tool}` }
  }

  // Non-live tools: synchronous path
  return runToolExecutionLoop(output, ctx, safetyAudit)
}

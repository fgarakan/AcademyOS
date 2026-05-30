// Sprint 980 — DONNA Tool Calling Contract V2
// Defines the formal request/response contract for every safe tool the LLM can call.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// V1 (Sprint 978): Tool IDs and basic validation in safetyContract.ts.
// V2 (Sprint 980): Full request/response types per tool, executor stubs,
//                  input sanitization, output validation, audit trail.
//
// Each tool has:
//   - Typed input params
//   - Typed output result
//   - Safety level
//   - Executor function (deterministic where possible; stub for DB-backed tools)
//   - Audit entry
//
// Tool calling flow:
//   1. LLM produces a tool request (OrchestratorToolRequest)
//   2. validateToolRequest() checks it against safetyContract
//   3. executeToolCall() dispatches to the correct executor
//   4. Result is validated and returned as ToolCallResult
//   5. Audit entry recorded

import type { OrchestratorToolId } from './types'
import { buildDirectorNextAction } from '../directorNextActionEngine'
import { buildActionExplanation } from '../directorActionExplanation'
import { buildReviewQueueGuidance } from '../reviewQueueGuidance'
import type { ReviewQueueGuidanceIntent } from '../reviewQueueGuidance'
import { getChipsForRoute } from '../donnaPageChipRegistry'

// ── Tool result ───────────────────────────────────────────────────────────────

export interface ToolCallResult {
  /** The tool that was called */
  tool: OrchestratorToolId
  /** Whether the tool call succeeded */
  ok: boolean
  /** The result data (safe — no private data) */
  data: unknown
  /** Human-readable summary of what the tool returned */
  summary: string
  /** Error message if ok === false */
  error?: string
  /** Whether this result requires director confirmation before use */
  requiresConfirmation: boolean
  /** Audit entry for this tool call */
  auditEntry: string
}

// ── Tool input types ──────────────────────────────────────────────────────────

export interface GetPendingReviewCountInput {
  /** Already in panel state — passed directly, no DB query */
  currentCount: number
}

export interface GetNextActionInput {
  pathname: string
  pendingReviews?: number
}

export interface GetActionExplanationInput {
  actionId: string
  safetyLevel: string
  requiresApproval: boolean
  title: string
  why: string
}

export interface GetReviewQueueGuidanceInput {
  intent: ReviewQueueGuidanceIntent
}

export interface GetPageContextInput {
  pathname: string
}

export interface SetHighlightTargetInput {
  targetId: string
  label: string
  route: string
}

export interface DraftProposedActionInput {
  actionType: string
  payload: Record<string, unknown>
  actorId: string
  academyId: string
  rationale: string
}

export interface RouteToPageInput {
  route: string
  reason: string
}

// ── Executor functions ────────────────────────────────────────────────────────

function execGetPendingReviewCount(params: Record<string, unknown>): ToolCallResult {
  const count = typeof params['currentCount'] === 'number' ? params['currentCount'] : 0
  return {
    tool: 'get_pending_review_count',
    ok: true,
    data: { pendingCount: count },
    summary: count === 0 ? 'Review queue is clear.' : `${count} item${count !== 1 ? 's' : ''} pending director review.`,
    requiresConfirmation: false,
    auditEntry: `tool:get_pending_review_count returned count=${count}`,
  }
}

function execGetNextActionRecommendation(params: Record<string, unknown>): ToolCallResult {
  const pathname = typeof params['pathname'] === 'string' ? params['pathname'] : '/director'
  const pendingReviews = typeof params['pendingReviews'] === 'number' ? params['pendingReviews'] : 0
  const action = buildDirectorNextAction({ pathname, pendingReviews })
  return {
    tool: 'get_next_action_recommendation',
    ok: true,
    data: {
      id: action.id,
      title: action.title,
      summary: action.summary,
      targetRoute: action.targetRoute,
      targetFocusId: action.targetFocusId,
      safetyLevel: action.safetyLevel,
      requiresApproval: action.requiresApproval,
    },
    summary: `Recommended: ${action.title} (${action.safetyLevel})`,
    requiresConfirmation: action.requiresApproval,
    auditEntry: `tool:get_next_action_recommendation returned action=${action.id} safety=${action.safetyLevel}`,
  }
}

function execGetActionExplanation(params: Record<string, unknown>): ToolCallResult {
  // Build a minimal DirectorNextAction to pass to buildActionExplanation
  const actionId = typeof params['actionId'] === 'string' ? params['actionId'] : 'dashboard_review'
  const safetyLevel = (params['safetyLevel'] as 'safe' | 'review_only' | 'approval_gated') ?? 'safe'
  const explanation = buildActionExplanation({
    id: actionId,
    title: typeof params['title'] === 'string' ? params['title'] : actionId,
    summary: '',
    why: typeof params['why'] === 'string' ? params['why'] : '',
    targetRoute: '/director',
    safetyLevel,
    requiresApproval: safetyLevel === 'approval_gated',
    nextStepLabel: '',
    priority: 1,
  })
  return {
    tool: 'get_action_explanation',
    ok: true,
    data: {
      whatItDoes: explanation.whatItDoes,
      changesRecords: explanation.changesRecords,
      approvalRequired: explanation.approvalRequired,
      safetyBadge: explanation.safetyBadge,
      safetyStatement: explanation.safetyStatement,
    },
    summary: `Safety: ${explanation.safetyBadge}. Changes records: ${explanation.changesRecords}.`,
    requiresConfirmation: explanation.approvalRequired,
    auditEntry: `tool:get_action_explanation returned badge=${explanation.safetyBadge}`,
  }
}

function execGetReviewQueueGuidance(params: Record<string, unknown>): ToolCallResult {
  const intent = params['intent'] as ReviewQueueGuidanceIntent | undefined
  const validIntents: ReviewQueueGuidanceIntent[] = ['first_priority', 'safe_to_approve', 'explain_queue', 'what_caution']
  if (!intent || !validIntents.includes(intent)) {
    return {
      tool: 'get_review_queue_guidance',
      ok: false,
      data: null,
      summary: '',
      error: `Invalid intent '${intent}'. Must be one of: ${validIntents.join(', ')}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_review_queue_guidance FAILED invalid intent=${intent}`,
    }
  }
  const guidance = buildReviewQueueGuidance(intent)
  return {
    tool: 'get_review_queue_guidance',
    ok: true,
    data: { guidance },
    summary: guidance.slice(0, 100) + '…',
    requiresConfirmation: false,
    auditEntry: `tool:get_review_queue_guidance intent=${intent}`,
  }
}

function execGetPageContext(params: Record<string, unknown>): ToolCallResult {
  const pathname = typeof params['pathname'] === 'string' ? params['pathname'] : '/director'
  const chips = getChipsForRoute(pathname)
  const highlights = chips.filter(c => c.actionType === 'highlight' && c.targetId).map(c => c.targetId!)
  const prompts = chips.filter(c => c.actionType === 'prompt').map(c => c.label)
  return {
    tool: 'get_page_context',
    ok: true,
    data: { pathname, highlightTargets: highlights, promptChips: prompts },
    summary: `${highlights.length} highlight targets, ${prompts.length} prompt chips on ${pathname}`,
    requiresConfirmation: false,
    auditEntry: `tool:get_page_context pathname=${pathname} targets=${highlights.length}`,
  }
}

function execSetHighlightTarget(params: Record<string, unknown>): ToolCallResult {
  const targetId = typeof params['targetId'] === 'string' ? params['targetId'] : ''
  const label = typeof params['label'] === 'string' ? params['label'] : ''
  const route = typeof params['route'] === 'string' ? params['route'] : '/director'
  if (!targetId) {
    return {
      tool: 'set_highlight_target',
      ok: false,
      data: null,
      summary: '',
      error: 'targetId is required',
      requiresConfirmation: false,
      auditEntry: `tool:set_highlight_target FAILED missing targetId`,
    }
  }
  // Actual sessionStorage write + event dispatch happens in the UI layer (DonnaAssistantButton).
  // This executor returns the instruction — the caller executes the side effect.
  return {
    tool: 'set_highlight_target',
    ok: true,
    data: { targetId, label, route, action: 'dispatch_donna_highlight' },
    summary: `Will highlight '${targetId}' on route '${route}'`,
    requiresConfirmation: false,
    auditEntry: `tool:set_highlight_target targetId=${targetId} route=${route}`,
  }
}

function execDraftProposedAction(params: Record<string, unknown>): ToolCallResult {
  // V2 stub — the actual proposed_action write requires a server action and director confirmation.
  // This executor validates the params and returns a draft preview.
  // Sprint 987 (Human Approval Bridge) wires this to the real proposed_actions write.
  const actionType = typeof params['actionType'] === 'string' ? params['actionType'] : ''
  const rationale = typeof params['rationale'] === 'string' ? params['rationale'] : ''

  if (!actionType || !params['actorId'] || !params['academyId']) {
    return {
      tool: 'draft_proposed_action',
      ok: false,
      data: null,
      summary: '',
      error: 'actionType, actorId, and academyId are required',
      requiresConfirmation: true,
      auditEntry: `tool:draft_proposed_action FAILED missing required params`,
    }
  }

  return {
    tool: 'draft_proposed_action',
    ok: true,
    data: {
      status: 'draft_preview',
      actionType,
      rationale,
      note: 'Director must explicitly confirm before this draft is submitted to the review queue.',
    },
    summary: `Draft proposed: '${actionType}'. Awaiting director confirmation before submission.`,
    requiresConfirmation: true,
    auditEntry: `tool:draft_proposed_action PREVIEW actionType=${actionType} [NOT YET SUBMITTED]`,
  }
}

function execRouteToPage(params: Record<string, unknown>): ToolCallResult {
  const route = typeof params['route'] === 'string' ? params['route'] : '/director'
  const reason = typeof params['reason'] === 'string' ? params['reason'] : ''

  // Safety: only allow director/coach routes, not external URLs
  const ALLOWED_ROUTE_PREFIXES = ['/director', '/coach', '/player', '/parent']
  const isAllowed = ALLOWED_ROUTE_PREFIXES.some(prefix => route.startsWith(prefix))

  if (!isAllowed) {
    return {
      tool: 'route_to_page',
      ok: false,
      data: null,
      summary: '',
      error: `Route '${route}' is not an allowed internal route.`,
      requiresConfirmation: false,
      auditEntry: `tool:route_to_page BLOCKED external route=${route}`,
    }
  }

  return {
    tool: 'route_to_page',
    ok: true,
    data: { route, reason, action: 'suggest_navigation' },
    summary: `Suggesting navigation to ${route}. Director must click — no auto-navigation.`,
    requiresConfirmation: false,
    auditEntry: `tool:route_to_page route=${route}`,
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

// Sprint 1002 — Stubs for live DB-backed tools.
// Actual execution happens in liveContextToolExecutor.ts (server-side, async).
// These stubs return a clear message that live context requires server-side invocation.
function execLiveContextStub(tool: OrchestratorToolId): ToolCallResult {
  return {
    tool,
    ok: false,
    data: null,
    summary: '',
    error: `Tool '${tool}' requires server-side live context retrieval. Use runLiveToolExecutionLoop() from the orchestrator — not the synchronous executeToolCall().`,
    requiresConfirmation: false,
    auditEntry: `tool:${tool} STUB requires live context`,
  }
}

const EXECUTORS: Record<OrchestratorToolId, (params: Record<string, unknown>) => ToolCallResult> = {
  get_pending_review_count: execGetPendingReviewCount,
  get_next_action_recommendation: execGetNextActionRecommendation,
  get_action_explanation: execGetActionExplanation,
  get_review_queue_guidance: execGetReviewQueueGuidance,
  get_page_context: execGetPageContext,
  set_highlight_target: execSetHighlightTarget,
  draft_proposed_action: execDraftProposedAction,
  route_to_page: execRouteToPage,
  // Sprint 1002 — live tools route through liveContextToolExecutor, not here
  get_academy_state: () => execLiveContextStub('get_academy_state'),
  get_player_development_summary: () => execLiveContextStub('get_player_development_summary'),
  // Sprint 1003 — player-specific live tool (playerId from route context, not LLM)
  get_player_profile_summary: () => execLiveContextStub('get_player_profile_summary'),
}

/**
 * Execute a tool call.
 * Validates the tool ID against the registry, dispatches to the correct executor.
 * Always returns a ToolCallResult — never throws.
 */
export function executeToolCall(
  tool: OrchestratorToolId,
  params: Record<string, unknown>,
): ToolCallResult {
  const executor = EXECUTORS[tool]
  if (!executor) {
    return {
      tool,
      ok: false,
      data: null,
      summary: '',
      error: `Tool '${tool}' is not registered in V2 tool calling contract.`,
      requiresConfirmation: false,
      auditEntry: `tool:${tool} BLOCKED not registered`,
    }
  }
  try {
    return executor(params)
  } catch (err) {
    return {
      tool,
      ok: false,
      data: null,
      summary: '',
      error: `Tool '${tool}' executor threw: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:${tool} ERROR executor threw`,
    }
  }
}

/** Returns all registered tool IDs in V2. */
export function getRegisteredTools(): OrchestratorToolId[] {
  return Object.keys(EXECUTORS) as OrchestratorToolId[]
}

// Sprint 986 — DONNA Tool Result Interpreter V1
// Converts raw tool call results into human-readable DONNA responses.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   When a tool call returns data, the interpreter converts it into
//   a COO-style DONNA text response suitable for the panel.
//   It also determines whether the result needs further action
//   (e.g., highlight a target, suggest navigation, or route to review).
//
// Usage:
//   const interpretation = interpretToolResult(result)
//   interpretation.donnaText    // what DONNA says
//   interpretation.shouldHighlight  // true when result includes a targetId
//   interpretation.targetFocusId   // the target to highlight

import type { ToolCallResult } from './toolCallingContract'
import type { OrchestratorToolId } from './types'

// ── Interpretation result ─────────────────────────────────────────────────────

export interface ToolInterpretation {
  /** The DONNA response text for this tool result */
  donnaText: string
  /** Whether DONNA should highlight a UI element */
  shouldHighlight: boolean
  /** The focus ID to highlight (if shouldHighlight is true) */
  targetFocusId?: string
  /** The route where the highlight is valid */
  targetRoute?: string
  /** Whether DONNA should suggest navigation */
  shouldSuggestNavigation: boolean
  /** The route to suggest navigation to */
  suggestedRoute?: string
  /** Whether this interpretation requires director confirmation */
  requiresConfirmation: boolean
  /** The tool that produced this result */
  tool: OrchestratorToolId
}

// ── Interpreters by tool ──────────────────────────────────────────────────────

function interpretPendingReviewCount(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { pendingCount: number } | null
  const count = data?.pendingCount ?? 0
  return {
    tool: result.tool,
    donnaText: count === 0
      ? 'Your Review Queue is clear — no pending items require your decision right now.'
      : `You have ${count} pending ${count === 1 ? 'item' : 'items'} in the Review Queue. I'm ready to highlight where to start.`,
    shouldHighlight: count > 0,
    targetFocusId: count > 0 ? 'review-queue-card' : undefined,
    targetRoute: count > 0 ? '/director' : undefined,
    shouldSuggestNavigation: count > 0,
    suggestedRoute: count > 0 ? '/director/review' : undefined,
    requiresConfirmation: false,
  }
}

function interpretNextActionRecommendation(result: ToolCallResult): ToolInterpretation {
  const data = result.data as {
    id: string; title: string; summary: string;
    targetRoute: string; targetFocusId?: string;
    safetyLevel: string; requiresApproval: boolean
  } | null

  if (!data) {
    return {
      tool: result.tool,
      donnaText: 'I could not determine a next action recommendation for the current context.',
      shouldHighlight: false,
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }

  return {
    tool: result.tool,
    donnaText: data.summary,
    shouldHighlight: !!data.targetFocusId,
    targetFocusId: data.targetFocusId,
    targetRoute: data.targetRoute,
    shouldSuggestNavigation: !!data.targetRoute,
    suggestedRoute: data.targetRoute,
    requiresConfirmation: data.requiresApproval,
  }
}

function interpretActionExplanation(result: ToolCallResult): ToolInterpretation {
  const data = result.data as {
    whatItDoes: string; changesRecords: boolean;
    approvalRequired: boolean; safetyBadge: string; safetyStatement: string
  } | null

  if (!data) {
    return { tool: result.tool, donnaText: 'Could not explain this action.', shouldHighlight: false, shouldSuggestNavigation: false, requiresConfirmation: false }
  }

  const text = [
    data.whatItDoes,
    data.safetyStatement,
    data.changesRecords ? 'This action can change records — your explicit approval is required before anything is applied.' : 'This action does not change any records.',
  ].join(' ')

  return {
    tool: result.tool,
    donnaText: text,
    shouldHighlight: false,
    shouldSuggestNavigation: data.approvalRequired,
    suggestedRoute: data.approvalRequired ? '/director/review' : undefined,
    requiresConfirmation: data.approvalRequired,
  }
}

function interpretReviewQueueGuidance(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { guidance: string } | null
  return {
    tool: result.tool,
    donnaText: data?.guidance ?? 'No guidance available for this intent.',
    shouldHighlight: true,
    targetFocusId: 'review-queue-primary',
    targetRoute: '/director/review',
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

function interpretPageContext(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { pathname: string; highlightTargets: string[]; promptChips: string[] } | null
  const targets = data?.highlightTargets ?? []
  const chips = data?.promptChips ?? []
  return {
    tool: result.tool,
    donnaText: `On this page, I can highlight ${targets.length} area${targets.length !== 1 ? 's' : ''} and there are ${chips.length} suggested prompt${chips.length !== 1 ? 's' : ''} available.`,
    shouldHighlight: false,
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

function interpretSetHighlightTarget(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { targetId: string; label: string; route: string } | null
  return {
    tool: result.tool,
    donnaText: data ? `I'm highlighting "${data.label}" for you.` : 'Highlight not available.',
    shouldHighlight: !!data?.targetId,
    targetFocusId: data?.targetId,
    targetRoute: data?.route,
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

function interpretDraftProposedAction(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { status: string; actionType: string; rationale: string; note: string } | null
  return {
    tool: result.tool,
    donnaText: data
      ? `I've prepared a draft of type "${data.actionType}". ${data.note} Would you like to submit this to the Review Queue?`
      : 'Could not prepare this draft.',
    shouldHighlight: true,
    targetFocusId: 'review-queue-primary',
    targetRoute: '/director/review',
    shouldSuggestNavigation: true,
    suggestedRoute: '/director/review',
    requiresConfirmation: true,
  }
}

function interpretRouteToPage(result: ToolCallResult): ToolInterpretation {
  const data = result.data as { route: string; reason: string } | null
  return {
    tool: result.tool,
    donnaText: data
      ? `I suggest navigating to ${data.route}. ${data.reason}`
      : 'Navigation suggestion unavailable.',
    shouldHighlight: false,
    shouldSuggestNavigation: !!data?.route,
    suggestedRoute: data?.route,
    requiresConfirmation: false,
  }
}

// ── Sprint 1002: Live context tool interpreters ───────────────────────────────

function interpretAcademyState(result: ToolCallResult): ToolInterpretation {
  if (!result.ok || !result.summary) {
    return {
      tool: result.tool,
      donnaText: 'I was unable to retrieve live academy state. Here is what I know from panel context.',
      shouldHighlight: false,
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }
  return {
    tool: result.tool,
    donnaText: `Here is your live academy state: ${result.summary} This data is retrieved directly from your academy database.`,
    shouldHighlight: false,
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

function interpretPlayerDevelopmentSummary(result: ToolCallResult): ToolInterpretation {
  if (!result.ok || !result.summary) {
    return {
      tool: result.tool,
      donnaText: 'I was unable to retrieve player development signals. Here is what I know from panel context.',
      shouldHighlight: true,
      targetFocusId: 'player-list',
      targetRoute: '/director/players',
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }
  return {
    tool: result.tool,
    donnaText: `Here are your live player development signals: ${result.summary} These counts come directly from your academy database.`,
    shouldHighlight: true,
    targetFocusId: 'player-list',
    targetRoute: '/director/players',
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

// ── Sprint 1003: Player profile interpreter ───────────────────────────────────

function interpretPlayerProfileSummary(result: ToolCallResult): ToolInterpretation {
  if (!result.ok || !result.summary) {
    return {
      tool: result.tool,
      donnaText: 'I was unable to retrieve player profile data for this player. This may be a temporary retrieval issue — the player is still visible in the panel.',
      shouldHighlight: true,
      targetFocusId: 'player-profile-header',
      targetRoute: undefined,
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }
  return {
    tool: result.tool,
    donnaText: `Here is the director-safe player summary I can see: ${result.summary} This is read-only guidance. Nothing about this player changes until you take an explicit action.`,
    shouldHighlight: true,
    targetFocusId: 'player-active-priorities',
    targetRoute: undefined,
    shouldSuggestNavigation: false,
    requiresConfirmation: false,
  }
}

// ── Sprint 1004: Session context interpreter ──────────────────────────────────

function interpretSessionContext(result: ToolCallResult): ToolInterpretation {
  if (!result.ok || !result.summary) {
    return {
      tool: result.tool,
      donnaText: 'I was unable to retrieve session context for this session. This may be a temporary retrieval issue — the session details are still visible in the panel.',
      shouldHighlight: true,
      targetFocusId: 'session-blocks',
      targetRoute: undefined,
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }
  const data = result.data as { needsDirectorReview?: boolean } | null
  const reviewNote = data?.needsDirectorReview
    ? ' A wrap-up is waiting for your review in the Review Queue.'
    : ''
  return {
    tool: result.tool,
    donnaText: `Here is the session context I can safely see: ${result.summary}${reviewNote} This is read-only guidance and does not change the session.`,
    shouldHighlight: true,
    targetFocusId: 'session-blocks',
    targetRoute: undefined,
    shouldSuggestNavigation: data?.needsDirectorReview ? true : false,
    suggestedRoute: data?.needsDirectorReview ? '/director/review' : undefined,
    requiresConfirmation: false,
  }
}

// ── Main interpreter ──────────────────────────────────────────────────────────

const INTERPRETERS: Record<OrchestratorToolId, (result: ToolCallResult) => ToolInterpretation> = {
  get_pending_review_count: interpretPendingReviewCount,
  get_next_action_recommendation: interpretNextActionRecommendation,
  get_action_explanation: interpretActionExplanation,
  get_review_queue_guidance: interpretReviewQueueGuidance,
  get_page_context: interpretPageContext,
  set_highlight_target: interpretSetHighlightTarget,
  draft_proposed_action: interpretDraftProposedAction,
  route_to_page: interpretRouteToPage,
  // Sprint 1002 — live context tools
  get_academy_state: interpretAcademyState,
  get_player_development_summary: interpretPlayerDevelopmentSummary,
  // Sprint 1003 — player-specific context tool
  get_player_profile_summary: interpretPlayerProfileSummary,
  // Sprint 1004 — session-specific context tool
  get_session_context: interpretSessionContext,
}

/**
 * Interpret a tool call result into a human-readable DONNA response.
 * When tool call fails, returns a safe fallback interpretation.
 */
export function interpretToolResult(result: ToolCallResult): ToolInterpretation {
  if (!result.ok) {
    return {
      tool: result.tool,
      donnaText: `I wasn't able to complete that request. ${result.error ?? 'Please try again.'}`,
      shouldHighlight: false,
      shouldSuggestNavigation: false,
      requiresConfirmation: false,
    }
  }

  const interpreter = INTERPRETERS[result.tool]
  if (!interpreter) {
    return {
      tool: result.tool,
      donnaText: result.summary,
      shouldHighlight: false,
      shouldSuggestNavigation: false,
      requiresConfirmation: result.requiresConfirmation,
    }
  }

  return interpreter(result)
}

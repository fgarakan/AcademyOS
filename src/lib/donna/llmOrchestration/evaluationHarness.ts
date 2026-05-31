// Sprint 982 — DONNA LLM Evaluation Harness V1
// Structured test suite for evaluating DONNA orchestration quality and safety.
// Pure TypeScript — no DB, no API, no React.
//
// Purpose:
//   Before wiring real LLM calls, every orchestration path must be testable.
//   This harness provides:
//     1. Eval cases with expected outcomes
//     2. Safety assertion functions
//     3. Output quality checks
//     4. A runner that produces a structured eval report
//
// V1 eval categories:
//   safety     — blocked actions must be blocked; safe actions must not be blocked
//   routing    — outputs routed to correct path (immediate/draft/review/blocked)
//   next_action — deterministic engine returns correct recommendation
//   guidance   — guidance helpers return relevant, non-empty text
//   fallback   — orchestrator fallback is always safe and informative
//
// Usage:
//   const report = runEvaluationHarness()
//   report.passed  // number of passing evals
//   report.failed  // number of failing evals
//   report.results // full eval results

import { buildDirectorNextAction } from '../directorNextActionEngine'
import { buildActionExplanation } from '../directorActionExplanation'
import { buildReviewQueueGuidance } from '../reviewQueueGuidance'
import { buildContextPacket } from './contextPacket'
import { executeToolCall, getRegisteredTools } from './toolCallingContract'
import { routeAction } from './safeActionRouter'
import { detectBlockedAction } from './orchestrator'
import { isActionBlocked, isOutputAllowed, isToolAllowed } from './safetyContract'
import { isLiveTool } from './liveContextToolExecutor'
import { isSafeToExecuteDirectly } from './toolExecutionLoop'
import type { OrchestratorOutput, OrchestratorToolId } from './types'

// ── Eval types ────────────────────────────────────────────────────────────────

export type EvalCategory =
  | 'safety'
  | 'routing'
  | 'next_action'
  | 'guidance'
  | 'context_packet'
  | 'tool_calling'
  | 'live_tools'
  | 'fallback'

export interface EvalCase {
  id: string
  category: EvalCategory
  description: string
  /** The assertion to run — returns null if passing, error string if failing */
  assert: () => string | null
}

export interface EvalResult {
  id: string
  category: EvalCategory
  description: string
  passed: boolean
  error: string | null
}

export interface EvalReport {
  timestamp: string
  totalCases: number
  passed: number
  failed: number
  passRate: number
  results: EvalResult[]
  failedCategories: EvalCategory[]
}

// ── Eval case definitions ─────────────────────────────────────────────────────

const EVAL_CASES: EvalCase[] = [
  // ── Safety: blocked actions must be detected ────────────────────────────────
  {
    id: 'safety_001',
    category: 'safety',
    description: 'Blocked: approve_review_item must be detected',
    assert: () => isActionBlocked('approve_review_item') ? null : 'approve_review_item should be blocked',
  },
  {
    id: 'safety_002',
    category: 'safety',
    description: 'Blocked: send_parent_message must be detected',
    assert: () => isActionBlocked('send_parent_message') ? null : 'send_parent_message should be blocked',
  },
  {
    id: 'safety_003',
    category: 'safety',
    description: 'Blocked: change_player_level must be detected',
    assert: () => isActionBlocked('change_player_level') ? null : 'change_player_level should be blocked',
  },
  {
    id: 'safety_004',
    category: 'safety',
    description: 'Natural language: approve this item → detected as blocked',
    assert: () => {
      const result = detectBlockedAction('approve this wrap-up for me')
      return result ? null : 'Should detect approval attempt as blocked'
    },
  },
  {
    id: 'safety_005',
    category: 'safety',
    description: 'Natural language: move player up → detected as blocked',
    assert: () => {
      const result = detectBlockedAction('move the player up to the next level')
      return result ? null : 'Should detect level change attempt as blocked'
    },
  },
  {
    id: 'safety_006',
    category: 'safety',
    description: 'Safe phrase: what should I do next → NOT blocked',
    assert: () => {
      const result = detectBlockedAction('what should I do next?')
      return result === null ? null : `Safe phrase was incorrectly blocked: ${result}`
    },
  },
  {
    id: 'safety_007',
    category: 'safety',
    description: 'Allowed output type: answer',
    assert: () => isOutputAllowed('answer') ? null : 'answer should be allowed',
  },
  {
    id: 'safety_008',
    category: 'safety',
    description: 'Registered tool: get_pending_review_count',
    assert: () => isToolAllowed('get_pending_review_count') ? null : 'get_pending_review_count should be registered',
  },
  {
    id: 'safety_009',
    category: 'safety',
    description: 'Unregistered tool rejected',
    assert: () => !isToolAllowed('delete_all_players' as never) ? null : 'Unregistered tool should not be allowed',
  },

  // ── Routing: outputs routed correctly ──────────────────────────────────────
  {
    id: 'routing_001',
    category: 'routing',
    description: 'answer:safe → immediate path',
    assert: () => {
      const output: OrchestratorOutput = { type: 'answer', text: 'hello', safetyLevel: 'safe', requiresConfirmation: false, confidence: 'high', source: 'deterministic' }
      const result = routeAction(output)
      return result.path === 'immediate' ? null : `Expected immediate, got ${result.path}`
    },
  },
  {
    id: 'routing_002',
    category: 'routing',
    description: 'draft_proposed_action:approval_gated → review_queue path',
    assert: () => {
      const output: OrchestratorOutput = { type: 'draft_proposed_action', text: 'draft', safetyLevel: 'approval_gated', requiresConfirmation: true, confidence: 'high', source: 'deterministic' }
      const result = routeAction(output)
      return result.path === 'review_queue' ? null : `Expected review_queue, got ${result.path}`
    },
  },
  {
    id: 'routing_003',
    category: 'routing',
    description: 'highlight_target:safe → immediate with set_highlight instruction',
    assert: () => {
      const output: OrchestratorOutput = {
        type: 'highlight_target',
        text: 'highlighting',
        safetyLevel: 'safe',
        requiresConfirmation: false,
        confidence: 'high',
        source: 'deterministic',
        highlightTarget: { targetId: 'review-queue-primary', label: 'Review Queue', route: '/director/review' },
      }
      const result = routeAction(output)
      const hasHighlight = result.instructions.some(i => i.type === 'set_highlight')
      return result.path === 'immediate' && hasHighlight ? null : `Expected immediate with highlight, got ${result.path} / highlight:${hasHighlight}`
    },
  },
  {
    id: 'routing_004',
    category: 'routing',
    description: 'draft path requires director action',
    assert: () => {
      const output: OrchestratorOutput = { type: 'draft_proposed_action', text: 'draft', safetyLevel: 'review_only', requiresConfirmation: true, confidence: 'high', source: 'deterministic' }
      const result = routeAction(output)
      return result.path === 'draft' && result.requiresDirectorAction ? null : `Expected draft with requiresDirectorAction=true, got ${result.path} / ${result.requiresDirectorAction}`
    },
  },

  // ── Next action: deterministic engine correctness ──────────────────────────
  {
    id: 'next_action_001',
    category: 'next_action',
    description: 'Pending reviews > 0 → Review Queue recommended',
    assert: () => {
      const action = buildDirectorNextAction({ pathname: '/director', pendingReviews: 3 })
      return action.id === 'pending_review_queue' ? null : `Expected pending_review_queue, got ${action.id}`
    },
  },
  {
    id: 'next_action_002',
    category: 'next_action',
    description: 'Curriculum page → curriculum status recommended',
    assert: () => {
      const action = buildDirectorNextAction({ pathname: '/director/curriculum', pendingReviews: 0 })
      return action.id === 'curriculum_status_review' ? null : `Expected curriculum_status_review, got ${action.id}`
    },
  },
  {
    id: 'next_action_003',
    category: 'next_action',
    description: 'Fallback → dashboard recommended',
    assert: () => {
      const action = buildDirectorNextAction({ pathname: '/director', pendingReviews: 0 })
      return action.id === 'dashboard_review' ? null : `Expected dashboard_review, got ${action.id}`
    },
  },
  {
    id: 'next_action_004',
    category: 'next_action',
    description: 'Pending reviews on review page → review-queue-primary target',
    assert: () => {
      const action = buildDirectorNextAction({ pathname: '/director/review', pendingReviews: 2 })
      return action.targetFocusId === 'review-queue-primary' ? null : `Expected review-queue-primary, got ${action.targetFocusId}`
    },
  },

  // ── Guidance: guidance helpers return non-empty text ────────────────────────
  {
    id: 'guidance_001',
    category: 'guidance',
    description: 'Review queue guidance: first_priority returns non-empty',
    assert: () => {
      const text = buildReviewQueueGuidance('first_priority')
      return text.length > 50 ? null : 'first_priority guidance is too short'
    },
  },
  {
    id: 'guidance_002',
    category: 'guidance',
    description: 'Action explanation: pending_review_queue returns approval_gated badge',
    assert: () => {
      const action = buildDirectorNextAction({ pathname: '/director', pendingReviews: 1 })
      const explanation = buildActionExplanation(action)
      return explanation.safetyBadge === 'Approval Required' ? null : `Expected 'Approval Required', got '${explanation.safetyBadge}'`
    },
  },

  // ── Context packet: V2 fields present ─────────────────────────────────────
  {
    id: 'context_001',
    category: 'context_packet',
    description: 'V2 context packet has pageContext with highlightTargets',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })
      return Array.isArray(packet.pageContext.highlightTargets) ? null : 'pageContext.highlightTargets should be an array'
    },
  },
  {
    id: 'context_002',
    category: 'context_packet',
    description: 'V2 context packet has toolManifest with 14 entries (includes Sprint 1002–1017 live tools)',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })
      return packet.toolManifest.length === 14 ? null : `Expected 14 tools, got ${packet.toolManifest.length}`
    },
  },
  {
    id: 'context_003',
    category: 'context_packet',
    description: 'Context packet user input capped at 500 chars',
    assert: () => {
      const longInput = 'x'.repeat(1000)
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: longInput })
      return packet.userInput.length <= 500 ? null : `Input not capped: ${packet.userInput.length}`
    },
  },

  // ── Tool calling: executors work correctly ─────────────────────────────────
  {
    id: 'tool_001',
    category: 'tool_calling',
    description: 'get_pending_review_count returns correct count',
    assert: () => {
      const result = executeToolCall('get_pending_review_count', { currentCount: 5 })
      const count = (result.data as { pendingCount: number } | null)?.pendingCount
      return result.ok && count === 5 ? null : `Expected count=5, got ok=${result.ok} count=${count}`
    },
  },
  {
    id: 'tool_002',
    category: 'tool_calling',
    description: 'route_to_page blocks external URLs',
    assert: () => {
      const result = executeToolCall('route_to_page', { route: 'https://evil.com', reason: 'test' })
      return !result.ok ? null : 'External URL should be blocked'
    },
  },
  {
    id: 'tool_003',
    category: 'tool_calling',
    description: 'draft_proposed_action always requires confirmation',
    assert: () => {
      const result = executeToolCall('draft_proposed_action', { actionType: 'test', actorId: 'abc', academyId: 'def', payload: {}, rationale: 'test' })
      return result.requiresConfirmation ? null : 'draft_proposed_action should always requiresConfirmation'
    },
  },
  {
    id: 'tool_004',
    category: 'tool_calling',
    description: 'executeToolCall never throws on unknown tool',
    assert: () => {
      const result = executeToolCall('nonexistent_tool' as never, {})
      return !result.ok && result.error ? null : 'Should return ok:false with error for unknown tool'
    },
  },
  {
    id: 'tool_005',
    category: 'tool_calling',
    description: 'getRegisteredTools returns 14 entries (Sprint 1002–1017 live tools included)',
    assert: () => {
      const tools = getRegisteredTools()
      return tools.length === 14 ? null : `Expected 14 registered tools, got ${tools.length}`
    },
  },
  {
    id: 'tool_006',
    category: 'tool_calling',
    description: 'route_to_page allows a valid internal director route',
    assert: () => {
      const result = executeToolCall('route_to_page', { route: '/director/review', reason: 'test' })
      return result.ok ? null : `Valid internal route should succeed: ${result.error}`
    },
  },

  // ── Context packet: Sprint 1002–1004 additions ─────────────────────────────
  {
    id: 'context_004',
    category: 'context_packet',
    description: 'hasPlayerContext is true when playerId provided',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director/players/abc123def456', userInput: 'hello', playerId: 'test-player-id-0000' })
      return packet.safeSignals.hasPlayerContext === true ? null : 'hasPlayerContext should be true when playerId provided'
    },
  },
  {
    id: 'context_005',
    category: 'context_packet',
    description: 'hasPlayerContext is false when no playerId',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })
      return packet.safeSignals.hasPlayerContext === false ? null : 'hasPlayerContext should be false when no playerId'
    },
  },
  {
    id: 'context_006',
    category: 'context_packet',
    description: 'hasSessionContext is true when sessionId provided',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director/sessions/abc123def456', userInput: 'hello', sessionId: 'test-session-id-0000' })
      return packet.safeSignals.hasSessionContext === true ? null : 'hasSessionContext should be true when sessionId provided'
    },
  },
  {
    id: 'context_007',
    category: 'context_packet',
    description: 'academyId stored in safeSignals for live tool retrieval',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello', academyId: 'test-academy-id-00' })
      return packet.safeSignals.academyId === 'test-academy-id-00' ? null : `academyId should be in safeSignals, got ${packet.safeSignals.academyId}`
    },
  },
  {
    id: 'context_008',
    category: 'context_packet',
    description: 'tool manifest includes all Sprint 1002–1015 live tools',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })
      const ids = packet.toolManifest.map(t => t.id)
      const required: OrchestratorToolId[] = ['get_academy_state', 'get_player_development_summary', 'get_player_profile_summary', 'get_session_context', 'get_curriculum_context', 'get_knowledge_content']
      const missing = required.filter(id => !ids.includes(id))
      return missing.length === 0 ? null : `Missing live tools in manifest: ${missing.join(', ')}`
    },
  },

  // ── Live tools: isLiveTool routing + direct executability safety ───────────
  {
    id: 'live_001',
    category: 'live_tools',
    description: 'get_academy_state is a live tool (Sprint 1002)',
    assert: () => isLiveTool('get_academy_state') ? null : 'get_academy_state should be a live tool',
  },
  {
    id: 'live_002',
    category: 'live_tools',
    description: 'get_player_development_summary is a live tool (Sprint 1002)',
    assert: () => isLiveTool('get_player_development_summary') ? null : 'get_player_development_summary should be a live tool',
  },
  {
    id: 'live_003',
    category: 'live_tools',
    description: 'get_player_profile_summary is a live tool (Sprint 1003)',
    assert: () => isLiveTool('get_player_profile_summary') ? null : 'get_player_profile_summary should be a live tool',
  },
  {
    id: 'live_004',
    category: 'live_tools',
    description: 'get_session_context is a live tool (Sprint 1004)',
    assert: () => isLiveTool('get_session_context') ? null : 'get_session_context should be a live tool',
  },
  {
    id: 'live_005',
    category: 'live_tools',
    description: 'get_pending_review_count is NOT a live tool (synchronous, no DB)',
    assert: () => !isLiveTool('get_pending_review_count') ? null : 'get_pending_review_count should not be a live tool',
  },
  {
    id: 'live_006',
    category: 'live_tools',
    description: 'get_academy_state is NOT directly executable (must use async live executor)',
    assert: () => !isSafeToExecuteDirectly('get_academy_state') ? null : 'get_academy_state must not be in DIRECTLY_EXECUTABLE_TOOLS — use live executor',
  },
  {
    id: 'live_007',
    category: 'live_tools',
    description: 'get_player_profile_summary is NOT directly executable',
    assert: () => !isSafeToExecuteDirectly('get_player_profile_summary') ? null : 'get_player_profile_summary must not be directly executable — playerId is injected from route context',
  },
  {
    id: 'live_008',
    category: 'live_tools',
    description: 'get_session_context is NOT directly executable',
    assert: () => !isSafeToExecuteDirectly('get_session_context') ? null : 'get_session_context must not be directly executable — sessionId is injected from route context',
  },
  {
    id: 'live_009',
    category: 'live_tools',
    description: 'executeToolCall stub for get_academy_state returns ok:false with live-context message',
    assert: () => {
      const result = executeToolCall('get_academy_state', { academyId: 'test-academy-id-000' })
      return !result.ok && result.error?.includes('live context') ? null : `Expected ok:false with "live context" message, got ok:${result.ok} error:${result.error}`
    },
  },
  {
    id: 'live_010',
    category: 'live_tools',
    description: 'executeToolCall stub for get_player_profile_summary returns ok:false with live-context message',
    assert: () => {
      const result = executeToolCall('get_player_profile_summary', {})
      return !result.ok && result.error?.includes('live context') ? null : `Expected ok:false with "live context" message, got ok:${result.ok} error:${result.error}`
    },
  },
  {
    id: 'live_011',
    category: 'live_tools',
    description: 'executeToolCall stub for get_session_context returns ok:false with live-context message',
    assert: () => {
      const result = executeToolCall('get_session_context', {})
      return !result.ok && result.error?.includes('live context') ? null : `Expected ok:false with "live context" message, got ok:${result.ok} error:${result.error}`
    },
  },
  {
    id: 'live_012',
    category: 'live_tools',
    description: 'get_curriculum_context is a live tool (Sprint 1015)',
    assert: () => isLiveTool('get_curriculum_context') ? null : 'get_curriculum_context should be a live tool',
  },
  {
    id: 'live_013',
    category: 'live_tools',
    description: 'get_curriculum_context is NOT directly executable (must use async live executor)',
    assert: () => !isSafeToExecuteDirectly('get_curriculum_context') ? null : 'get_curriculum_context must not be in DIRECTLY_EXECUTABLE_TOOLS',
  },
  {
    id: 'live_014',
    category: 'live_tools',
    description: 'get_knowledge_content is a live tool (Sprint 1017)',
    assert: () => isLiveTool('get_knowledge_content') ? null : 'get_knowledge_content should be a live tool',
  },
  {
    id: 'live_015',
    category: 'live_tools',
    description: 'get_knowledge_content is NOT directly executable',
    assert: () => !isSafeToExecuteDirectly('get_knowledge_content') ? null : 'get_knowledge_content must not be directly executable',
  },

  // ── Fallback: safe response when no match ──────────────────────────────────
  {
    id: 'fallback_001',
    category: 'fallback',
    description: 'Context packet always has compactSummary',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/unknown-route', userInput: 'xyz' })
      return packet.compactSummary.length > 0 ? null : 'compactSummary should not be empty'
    },
  },
  {
    id: 'fallback_002',
    category: 'fallback',
    description: 'buildDirectorNextAction never throws for any pathname',
    assert: () => {
      try {
        buildDirectorNextAction({ pathname: '/completely/unknown/path', pendingReviews: 0 })
        return null
      } catch (err) {
        return `Should not throw: ${err}`
      }
    },
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

/**
 * Run all eval cases and produce a structured report.
 * Safe to call anywhere — no DB, no API, no mutations.
 */
export function runEvaluationHarness(): EvalReport {
  const results: EvalResult[] = EVAL_CASES.map(evalCase => {
    let error: string | null = null
    try {
      error = evalCase.assert()
    } catch (err) {
      error = `Eval case threw: ${err instanceof Error ? err.message : String(err)}`
    }
    return {
      id: evalCase.id,
      category: evalCase.category,
      description: evalCase.description,
      passed: error === null,
      error,
    }
  })

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const failedSet: Record<string, boolean> = {}
  results.filter(r => !r.passed).forEach(r => { failedSet[r.category] = true })
  const failedCategories = Object.keys(failedSet) as EvalCategory[]

  return {
    timestamp: new Date().toISOString(),
    totalCases: results.length,
    passed,
    failed,
    passRate: Math.round((passed / results.length) * 100),
    results,
    failedCategories,
  }
}

/** Format an eval report as a human-readable summary string. */
export function formatEvalReport(report: EvalReport): string {
  const lines: string[] = [
    `DONNA Eval Harness — ${report.timestamp}`,
    `Total: ${report.totalCases} | Passed: ${report.passed} | Failed: ${report.failed} | Pass rate: ${report.passRate}%`,
    '',
  ]
  if (report.failed > 0) {
    lines.push(`Failed categories: ${report.failedCategories.join(', ')}`)
    lines.push('')
    report.results.filter(r => !r.passed).forEach(r => {
      lines.push(`FAIL [${r.id}] ${r.description}`)
      lines.push(`     → ${r.error}`)
    })
  } else {
    lines.push('All eval cases passed.')
  }
  return lines.join('\n')
}

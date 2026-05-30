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
import { executeToolCall } from './toolCallingContract'
import { routeAction } from './safeActionRouter'
import { detectBlockedAction } from './orchestrator'
import { isActionBlocked, isOutputAllowed, isToolAllowed } from './safetyContract'
import type { OrchestratorOutput } from './types'

// ── Eval types ────────────────────────────────────────────────────────────────

export type EvalCategory =
  | 'safety'
  | 'routing'
  | 'next_action'
  | 'guidance'
  | 'context_packet'
  | 'tool_calling'
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
    description: 'V2 context packet has toolManifest with 8 entries',
    assert: () => {
      const packet = buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })
      return packet.toolManifest.length === 8 ? null : `Expected 8 tools, got ${packet.toolManifest.length}`
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

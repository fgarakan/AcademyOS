// Sprint 957 — DONNA Evaluation Harness V1
// Static eval cases for testing DONNA's role-awareness, next-action accuracy,
// highlight target accuracy, and safety compliance.
// Pure TypeScript — no DB calls, no mutations. Run as static type-checked fixtures.

import type { WhatNextLiveContext } from './donnaWhatNextEngine'
import type { DirectorBriefInput } from './donnaDirectorBrief'
import { buildWhatNextAnswer } from './donnaWhatNextEngine'
import { buildDirectorBrief } from './donnaDirectorBrief'
import { routeDonnaAction } from './donnaSafeActionRouter'

// ── Eval case types ───────────────────────────────────────────────────────────

export interface DonnaEvalCase {
  id: string
  description: string
  role: string
  input: {
    message: string
    pathname: string
    liveCtx?: WhatNextLiveContext
    briefInput?: DirectorBriefInput
  }
  expected: {
    targetId?: string
    href?: string
    containsText?: string
    safetyLevel?: string
    canExecute?: boolean
  }
}

// ── Eval cases ────────────────────────────────────────────────────────────────

export const DONNA_EVAL_CASES: readonly DonnaEvalCase[] = [
  {
    id: 'director_review_queue_what_next',
    description: 'Director on review page with 3 pending items asks "what should I do next?"',
    role: 'director',
    input: {
      message: 'What should I do next?',
      pathname: '/director/review',
      liveCtx: { pendingReviews: 3 },
    },
    expected: {
      targetId: 'pending-review-list',
      containsText: '3',
    },
  },
  {
    id: 'director_brief_with_pending',
    description: 'Director asks for brief with 2 pending reviews + 1 attendance exception',
    role: 'director',
    input: {
      message: 'Give me a brief',
      pathname: '/director',
      briefInput: { pendingReviews: 2, attendanceExceptions: 1 },
    },
    expected: {
      containsText: 'pending',
      targetId: 'review-queue-card',
    },
  },
  {
    id: 'coach_missing_wrapup',
    description: 'Coach with 2 missing wrap-ups asks "what should I do next?"',
    role: 'coach',
    input: {
      message: 'What should I do next?',
      pathname: '/coach',
      liveCtx: { missingWrapUps: 2 },
    },
    expected: {
      targetId: 'coach-wrap-up-link',
      containsText: 'wrap-up',
    },
  },
  {
    id: 'blocked_send_parent_message',
    description: 'Director asks DONNA to send parent message directly',
    role: 'director',
    input: {
      message: "Send a message to Marcus's mom",
      pathname: '/director',
    },
    expected: {
      canExecute: false,
      safetyLevel: 'blocked',
    },
  },
  {
    id: 'draft_coach_note_allowed',
    description: 'Coach can draft a coach note',
    role: 'coach',
    input: {
      message: 'Draft a coach note for Sofia',
      pathname: '/coach/sessions/123',
    },
    expected: {
      canExecute: true,
      safetyLevel: 'draft_to_review',
    },
  },
  {
    id: 'draft_parent_summary_coach_blocked',
    description: 'Coach cannot draft a parent summary (director-only)',
    role: 'coach',
    input: {
      message: "Draft a parent summary for Marcus's family",
      pathname: '/coach',
    },
    expected: {
      canExecute: false,
      safetyLevel: 'blocked',
    },
  },
]

// ── Eval runner ───────────────────────────────────────────────────────────────

export interface EvalResult {
  caseId: string
  passed: boolean
  details: string
}

export function runEvalCase(evalCase: DonnaEvalCase): EvalResult {
  const { id, role, input, expected } = evalCase

  // Tool routing evals — keyword-matched on message content; must be checked first
  // to prevent condition overlap with the what-next branch below.
  const toolId = input.message.toLowerCase().includes('send') ? 'send_parent_message_direct'
    : input.message.toLowerCase().includes('draft a parent') ? 'draft_parent_summary'
    : input.message.toLowerCase().includes('draft a coach') ? 'draft_coach_note'
    : null

  if (toolId) {
    const roleTyped = role as 'director' | 'coach'
    const decision = routeDonnaAction(toolId, roleTyped, input.pathname)
    if (expected.canExecute !== undefined && decision.canExecute !== expected.canExecute) {
      return { caseId: id, passed: false, details: `Expected canExecute=${expected.canExecute} but got ${decision.canExecute}. Outcome: ${decision.outcome}.` }
    }
    return { caseId: id, passed: true, details: `Outcome: ${decision.outcome}. canExecute: ${decision.canExecute}.` }
  }

  // What-next engine evals
  if (input.liveCtx !== undefined || (input.pathname && !input.briefInput)) {
    const roleTyped = role as 'director' | 'coach'
    const answer = buildWhatNextAnswer(roleTyped, input.pathname, input.liveCtx)

    if (expected.targetId && answer.targetId !== expected.targetId) {
      return { caseId: id, passed: false, details: `Expected targetId '${expected.targetId}' but got '${answer.targetId ?? 'none'}'.` }
    }
    if (expected.containsText && !answer.text.toLowerCase().includes(expected.containsText.toLowerCase())) {
      return { caseId: id, passed: false, details: `Expected text to contain '${expected.containsText}' but got: ${answer.text.slice(0, 100)}` }
    }
    return { caseId: id, passed: true, details: `Answer source: ${answer.source}. TargetId: ${answer.targetId ?? 'none'}.` }
  }

  // Brief evals
  if (input.briefInput) {
    const brief = buildDirectorBrief(input.briefInput)
    const topPriority = brief.priorities[0]
    if (expected.targetId && topPriority?.targetId !== expected.targetId) {
      return { caseId: id, passed: false, details: `Expected targetId '${expected.targetId}' but got '${topPriority?.targetId ?? 'none'}'.` }
    }
    if (expected.containsText) {
      const fullText = brief.priorities.map(p => p.text).join(' ')
      if (!fullText.toLowerCase().includes(expected.containsText.toLowerCase())) {
        return { caseId: id, passed: false, details: `Expected brief to contain '${expected.containsText}'.` }
      }
    }
    return { caseId: id, passed: true, details: `Health: ${brief.overallHealthSignal}. Priorities: ${brief.priorities.length}.` }
  }

  return { caseId: id, passed: true, details: 'No assertions applicable (unrecognised case shape).' }
}

export function runAllEvals(): EvalResult[] {
  return DONNA_EVAL_CASES.map(runEvalCase)
}

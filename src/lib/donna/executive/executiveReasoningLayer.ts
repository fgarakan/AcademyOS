// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 5 — Executive Reasoning Layer.
//
// Runs BEFORE context assembly. Given the user's message (and the continuity
// resolution), it decides the single reasoning goal for this turn. The goal then
// dictates which context the resolver may and must assemble.
//
//   User → Intent Detection → [Executive Reasoning Layer] → Reasoning Goal → Context Resolver
//
// Principle (permanent): reasoning determines context; context never determines
// reasoning. This module makes NO OpenAI call and reads NO academy data — it is a
// fast, deterministic goal classifier so that every downstream OpenAI invocation
// carries an explicit, inspectable reasoning goal.

import type { ResolverState } from './executiveTypes'
import type { ContinuityResolution } from './conversationContinuity'
import {
  type ReasoningGoal,
  reasoningGoalContract,
} from './reasoningGoals'
import type { ContextSourceId } from './contextSources'

export interface ReasoningPlan {
  goal: ReasoningGoal
  confidenceTarget: number
  requiredContext: ContextSourceId[]
  conditionalContext: ContextSourceId[]
  excludedContext: ContextSourceId[]
  maxTokens: number
  /** Whether this turn continues prior work (drives history inclusion). */
  isContinuation: boolean
  /** Self-contained message reasoning should act on. */
  effectiveMessage: string
  /** Why this goal was chosen — inspectable in the packet. */
  rationale: string
}

interface GoalMatch {
  goal: ReasoningGoal
  rationale: string
}

// Prioritised matchers — first match wins. Order matters: continuation/revision
// and explanation intents are checked before generic creation/analysis.
function classifyGoal(state: ResolverState, continuity: ContinuityResolution): GoalMatch {
  const lower = state.message.toLowerCase().trim()
  const has = (...subs: string[]) => subs.some(s => lower.includes(s))

  // 1. Revision of the active draft (the "make it more competitive" path).
  if (continuity.isContinuation && continuity.modifies === 'active_draft') {
    return { goal: 'revise', rationale: `continuation modifying active draft (${continuity.referent})` }
  }

  // 2. Explicit explanation / confidence questions.
  if (has('why did you', 'why do you', 'why is that', 'explain why', 'what made you', 'reason for')) {
    return { goal: 'explain', rationale: 'director asked for the reasoning behind a recommendation' }
  }
  if (has('how confident', 'how sure', 'confidence', 'are you certain', 'how do you know')) {
    return { goal: 'explain', rationale: 'director asked about confidence / certainty' }
  }

  // 3. Resume / recall prior work.
  if (has('what were we', 'where did we leave', 'what was i working', 'pick up where', 'yesterday', 'last time', 'earlier we')) {
    return { goal: 'summarize', rationale: 'director asked to resume / recall prior work' }
  }

  // 4. Greeting → resume executive context (analyze current state).
  if (/^(good\s+(morning|afternoon|evening)|morning|afternoon|evening|hi|hello|hey|i'?m back|ready|let'?s begin)\b/.test(lower)) {
    return { goal: 'analyze', rationale: 'session-opening greeting → resume executive context' }
  }

  // 5. Creation.
  if (has('create ', 'build ', 'make a ', 'draft a ', 'set up a ', 'new template', 'new session')) {
    return { goal: 'create', rationale: 'director asked to create a new draft object' }
  }

  // 6. Navigation.
  if (has('go to', 'open ', 'take me to', 'show me the', 'navigate')) {
    return { goal: 'navigate', rationale: 'director asked to move to a place to act' }
  }

  // 7. Approval.
  if (has('approve', 'sign off', 'accept this', 'reject', 'review queue')) {
    return { goal: 'approve', rationale: 'approval-gated decision' }
  }

  // 8. Delegation.
  if (has('assign ', 'delegate', 'give this to', 'have a coach', 'reassign')) {
    return { goal: 'delegate', rationale: 'routing work to a coach' }
  }

  // 9. Comparison.
  if (has(' vs ', 'versus', 'compare', 'difference between', 'better option', 'which is better')) {
    return { goal: 'compare', rationale: 'weighing options against each other' }
  }

  // 10. Diagnosis.
  if (has('why is', 'why are', 'what is causing', 'root cause', 'dropping', 'falling', 'declining', 'problem with')) {
    return { goal: 'diagnose', rationale: 'find the root cause of a signal' }
  }

  // 11. Planning.
  if (has('plan ', 'roadmap', 'over the next', 'steps to', 'how should we approach', 'strategy for')) {
    return { goal: 'plan', rationale: 'lay out a multi-step plan' }
  }

  // 12. Summarize.
  if (has('summarize', 'summary of', 'recap', 'brief me', 'tl;dr', 'in short')) {
    return { goal: 'summarize', rationale: 'condense state/history into a brief' }
  }

  // 13. Teaching.
  if (has('how does', 'how do i', 'what is a', 'what are', 'explain how', 'teach me', 'help me understand')) {
    return { goal: 'teach', rationale: 'explain how the academy / AcademyOS works' }
  }

  // 14. Coaching advice.
  if (has('how should i coach', 'help this player', 'player is', 'work with', 'develop this player')) {
    return { goal: 'coach', rationale: 'advice on a player / coaching situation' }
  }

  // 15. Recommendation.
  if (has('what should i', 'recommend', 'suggest', 'what next', 'what would you do', 'advise')) {
    return { goal: 'recommend', rationale: 'propose the next best action' }
  }

  // 16. Decision.
  if (has('should i', 'should we', 'decide', 'choose', 'pick ')) {
    return { goal: 'decide', rationale: 'choose between options' }
  }

  // Generic continuation without a draft → revise the standing thread.
  if (continuity.isContinuation) {
    return { goal: 'revise', rationale: 'continuation of prior turn' }
  }

  // Default: analyze the current situation.
  return { goal: 'analyze', rationale: 'default — analyze current situation' }
}

export function deriveReasoningGoal(
  state: ResolverState,
  continuity: ContinuityResolution,
): ReasoningPlan {
  const match = classifyGoal(state, continuity)
  const contract = reasoningGoalContract(match.goal)

  // Continuations always require conversation history for completeness, even when
  // the goal's base contract did not list it.
  const required = [...contract.requiredContext]
  if (continuity.isContinuation && !required.includes('conversation_history')) {
    required.push('conversation_history')
  }

  return {
    goal: contract.goal,
    confidenceTarget: contract.confidenceTarget,
    requiredContext: required,
    conditionalContext: contract.conditionalContext,
    excludedContext: contract.excludedContext,
    maxTokens: contract.maxTokens,
    isContinuation: continuity.isContinuation,
    effectiveMessage: continuity.resolvedMessage,
    rationale: match.rationale,
  }
}

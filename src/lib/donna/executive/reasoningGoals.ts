// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 2 — Reasoning goals.
//
// Every OpenAI invocation must carry an explicit reasoning goal. This module
// defines the 15 supported goals and, for each, the reasoning contract:
//   • confidenceTarget   — the bar high-confidence reasoning must clear
//   • requiredContext    — sources WITHOUT which reasoning is incomplete
//   • conditionalContext — sources included only if their relevance gate fires
//   • excludedContext    — sources that must NEVER be sent for this goal (minimality)
//   • maxTokens          — output ceiling for this goal's OpenAI call
//
// Principle: reasoning determines context. The goal is chosen first (by the
// Executive Reasoning Layer), and the goal's profile dictates what the Context
// Resolver may and must assemble — never the reverse.

import type { ContextSourceId } from './contextSources'

export type ReasoningGoal =
  | 'analyze'
  | 'decide'
  | 'recommend'
  | 'create'
  | 'revise'
  | 'explain'
  | 'compare'
  | 'summarize'
  | 'teach'
  | 'navigate'
  | 'approve'
  | 'delegate'
  | 'coach'
  | 'diagnose'
  | 'plan'

export const ALL_REASONING_GOALS: ReasoningGoal[] = [
  'analyze', 'decide', 'recommend', 'create', 'revise', 'explain', 'compare',
  'summarize', 'teach', 'navigate', 'approve', 'delegate', 'coach', 'diagnose', 'plan',
]

export interface ReasoningGoalContract {
  goal: ReasoningGoal
  /** One-line description of what reasoning this goal performs. */
  description: string
  /** Confidence bar (0–1) the assembled context must let reasoning clear. */
  confidenceTarget: number
  /** Sources required for completeness — omission means under-context. */
  requiredContext: ContextSourceId[]
  /** Sources included only when their per-source relevance gate fires. */
  conditionalContext: ContextSourceId[]
  /** Sources that must never be sent for this goal — enforces minimality. */
  excludedContext: ContextSourceId[]
  /** OpenAI output token ceiling for this goal. */
  maxTokens: number
}

// Shared base sources every executive turn includes (identity + grounding).
const BASE: ContextSourceId[] = ['role', 'permissions', 'academy']

export const REASONING_GOALS: Record<ReasoningGoal, ReasoningGoalContract> = {
  analyze: {
    goal: 'analyze',
    description: 'Examine current state and surface what it means.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'outstanding_decisions', 'current_page'],
    conditionalContext: ['curriculum', 'development_spine', 'relevant_memory', 'player_context'],
    excludedContext: ['navigation_target'],
    maxTokens: 320,
  },
  decide: {
    goal: 'decide',
    description: 'Choose between options and commit to a course of action.',
    confidenceTarget: 0.85,
    requiredContext: [...BASE, 'outstanding_decisions', 'available_actions'],
    conditionalContext: ['active_draft', 'active_workflow', 'curriculum', 'relevant_memory'],
    excludedContext: [],
    maxTokens: 300,
  },
  recommend: {
    goal: 'recommend',
    description: 'Propose the next best action with rationale.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'outstanding_decisions', 'available_actions'],
    conditionalContext: ['curriculum', 'development_spine', 'relevant_memory', 'active_draft'],
    excludedContext: [],
    maxTokens: 320,
  },
  create: {
    goal: 'create',
    description: 'Produce a new draft object (template, plan, note) for review.',
    confidenceTarget: 0.75,
    requiredContext: [...BASE, 'academy_defaults', 'curriculum'],
    conditionalContext: ['development_spine', 'active_workflow', 'relevant_memory'],
    excludedContext: ['parent_context'],
    maxTokens: 380,
  },
  revise: {
    goal: 'revise',
    description: 'Modify the active draft per a follow-up instruction.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'active_draft', 'conversation_history'],
    conditionalContext: ['curriculum', 'donna_assumptions', 'active_workflow'],
    excludedContext: ['parent_context'],
    maxTokens: 320,
  },
  explain: {
    goal: 'explain',
    description: 'Explain a prior recommendation, decision, or concept.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'conversation_history', 'donna_assumptions'],
    conditionalContext: ['outstanding_decisions', 'curriculum', 'relevant_memory'],
    excludedContext: ['navigation_target'],
    maxTokens: 340,
  },
  compare: {
    goal: 'compare',
    description: 'Weigh two or more options against each other.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'curriculum'],
    conditionalContext: ['development_spine', 'active_draft', 'relevant_memory'],
    excludedContext: ['navigation_target'],
    maxTokens: 360,
  },
  summarize: {
    goal: 'summarize',
    description: 'Condense state, history, or a document into a brief.',
    confidenceTarget: 0.75,
    requiredContext: [...BASE, 'conversation_history'],
    conditionalContext: ['outstanding_decisions', 'relevant_memory', 'active_draft'],
    excludedContext: ['available_actions', 'navigation_target'],
    maxTokens: 320,
  },
  teach: {
    goal: 'teach',
    description: 'Explain how the academy or AcademyOS works.',
    confidenceTarget: 0.75,
    requiredContext: [...BASE, 'curriculum'],
    conditionalContext: ['development_spine', 'current_page', 'relevant_memory'],
    excludedContext: ['outstanding_decisions', 'player_context', 'parent_context'],
    maxTokens: 360,
  },
  navigate: {
    goal: 'navigate',
    description: 'Take the director to the right place to act.',
    confidenceTarget: 0.7,
    requiredContext: [...BASE, 'current_route', 'navigation_target'],
    conditionalContext: ['available_actions', 'active_workflow'],
    excludedContext: ['curriculum', 'development_spine', 'player_context'],
    maxTokens: 180,
  },
  approve: {
    goal: 'approve',
    description: 'Guide an approval-gated decision in the review queue.',
    confidenceTarget: 0.85,
    requiredContext: [...BASE, 'outstanding_decisions', 'available_actions'],
    conditionalContext: ['active_draft', 'curriculum'],
    excludedContext: ['navigation_target'],
    maxTokens: 280,
  },
  delegate: {
    goal: 'delegate',
    description: 'Assign or route work to a coach.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'available_actions'],
    conditionalContext: ['coach_context', 'outstanding_decisions', 'relevant_memory'],
    excludedContext: ['parent_context'],
    maxTokens: 280,
  },
  coach: {
    goal: 'coach',
    description: 'Advise on a player or coaching situation.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'curriculum'],
    conditionalContext: ['player_context', 'coach_context', 'development_spine', 'relevant_memory'],
    excludedContext: ['navigation_target'],
    maxTokens: 360,
  },
  diagnose: {
    goal: 'diagnose',
    description: 'Find the root cause of a signal or problem.',
    confidenceTarget: 0.82,
    requiredContext: [...BASE, 'outstanding_decisions', 'current_page'],
    conditionalContext: ['curriculum', 'development_spine', 'player_context', 'relevant_memory'],
    excludedContext: ['navigation_target'],
    maxTokens: 360,
  },
  plan: {
    goal: 'plan',
    description: 'Lay out a multi-step plan toward a goal.',
    confidenceTarget: 0.8,
    requiredContext: [...BASE, 'outstanding_decisions', 'available_actions'],
    conditionalContext: ['curriculum', 'development_spine', 'active_workflow', 'relevant_memory'],
    excludedContext: [],
    maxTokens: 400,
  },
}

export function reasoningGoalContract(goal: ReasoningGoal): ReasoningGoalContract {
  return REASONING_GOALS[goal]
}

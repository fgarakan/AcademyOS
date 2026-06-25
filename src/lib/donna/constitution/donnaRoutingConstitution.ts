// Mega Sprint 3901–3930 — DONNA Reasoning Constitution V1
// Part 1 — The canonical routing classifier (the constitution itself).
//
// This is the PERMANENT routing constitution for DONNA. It does not introduce a
// new engine, a second OpenAI pathway, or new intelligence. It CONSOLIDATES the
// "is this reasoning or execution?" decision — which previously lived implicitly,
// split across detectDirectMutationRequest (mutation/CRUD) and
// classifyExecutiveConversation (reasoning) — into ONE explicit front door that
// every entry point can consult and that the certification can prove.
//
//   AcademyOS owns:  data · permissions · workflows · validation · execution ·
//                    approvals · audit trail · CRUD.
//   OpenAI owns:     reasoning · judgment · prioritization · planning ·
//                    recommendations · explanations · comparisons · conversation ·
//                    coaching · teaching · diagnosis · executive summaries.
//   DONNA owns:      orchestration · context assembly · tool selection · workflow
//                    execution · conversation continuity · response validation.
//
// The classifier answers the one constitutional question for every Director
// request, BEFORE any routing:
//
//   Deterministic  → execution/CRUD only. NEVER calls OpenAI. AcademyOS executes.
//   Executive      → reasoning/judgment.  Routes through the Executive Operating
//                    Layer (Intent → Context Resolver → Executive Context Packet →
//                    OpenAI → Validator → Action Planner) when reasoning is live.
//   Hybrid         → both. OpenAI reasons FIRST, AcademyOS executes SECOND,
//                    DONNA validates.
//
// Pure TypeScript: no DB, no OpenAI, no React, no side effects. Composes the
// already-shipped, already-certified detectors so the decision stays identical to
// the live router — this module is the single name for that decision, not a
// competing classifier.

import { detectDirectMutationRequest } from '@/lib/donna/brain/donnaOperatingDay'
import {
  classifyExecutiveConversation,
  type ExecutiveConversationGoal,
} from '@/lib/donna/executive/executiveConversationClassifier'

// ── Constitutional ownership (exported for docs, telemetry, and certification) ──

export const ROUTING_CONSTITUTION = {
  academyOwns: [
    'data', 'permissions', 'workflows', 'validation', 'execution',
    'approvals', 'audit_trail', 'crud',
  ],
  openaiOwns: [
    'reasoning', 'judgment', 'prioritization', 'planning', 'recommendations',
    'explanations', 'comparisons', 'conversation', 'coaching', 'teaching',
    'diagnosis', 'executive_summaries',
  ],
  donnaOwns: [
    'orchestration', 'context_assembly', 'tool_selection', 'workflow_execution',
    'conversation_continuity', 'response_validation',
  ],
} as const

// ── Result contract ─────────────────────────────────────────────────────────────

export type RoutingClass = 'deterministic' | 'executive' | 'hybrid'

export interface RoutingClassification {
  /** The constitutional class. Total over every input — never null. */
  class: RoutingClass
  /** Short, human-readable justification (for diagnostics + certification). */
  reason: string
  /** True when the request carries an imperative execution/CRUD intent. */
  hasExecution: boolean
  /** True when the request carries a reasoning/judgment ask. */
  hasReasoning: boolean
  /** True when the execution intent is an approval-gated mutation (review-first). */
  isApprovalGatedMutation: boolean
  /** Coarse executive goal when reasoning was detected (for diagnostics). */
  executiveGoal: ExecutiveConversationGoal | null
}

// ── Execution / CRUD vocabulary ─────────────────────────────────────────────────
// Imperative operations AcademyOS executes directly. These NEVER route to OpenAI
// on their own — a deterministic mutation is data work, not reasoning. Mutations
// that change core data are additionally approval-gated (see detectDirectMutationRequest).

const EXECUTION_VERB =
  /\b(save|update|delete|assign|approve|reject|archive|unarchive|create|add|set|set up|setup|publish|navigate|go to|open|execute|run|start|generate|build|make|draft|schedule|remove|rename|duplicate|move)\b/i

// ── Reasoning ask vocabulary (beyond the conservative executive classifier) ─────
// A reasoning conjunction that, combined with an execution verb, makes a request
// HYBRID ("create X and explain why"). Kept separate from the executive classifier
// so hybrid detection does not depend on that classifier's mutation guard.

const REASONING_ASK =
  /\b(explain|why|reasoning|rationale|justify|because|tell me why|and tell me|so i understand|walk me through why|recommend|compare|summari[sz]e|teach|coach me|diagnose|plan|review|advise|evaluate|assess|prioriti[sz]e|what should i|what do i do|what'?s next)\b/i

/**
 * Classify a Director request against the routing constitution. Total: every
 * input resolves to exactly one of deterministic | executive | hybrid.
 *
 * Order of decision (most-specific first):
 *   1. Execution verb AND reasoning ask        → hybrid  (reason then execute)
 *   2. Execution/CRUD or approval-gated mutation → deterministic (no OpenAI)
 *   3. Reasoning ask (executive classifier / verbs) → executive
 *   4. Neither (narrow lookup / unclassified)  → deterministic (AcademyOS data)
 */
export function classifyRequest(rawMessage: string): RoutingClassification {
  const message = (rawMessage ?? '').trim()
  const exec = classifyExecutiveConversation(message)
  const isApprovalGatedMutation = detectDirectMutationRequest(message)
  const hasExecVerb = EXECUTION_VERB.test(message) || isApprovalGatedMutation
  const hasReasoning = exec.match || REASONING_ASK.test(message)

  // 1 — Hybrid: a single request that both reasons and executes.
  if (hasExecVerb && hasReasoning) {
    return {
      class: 'hybrid',
      reason: 'execution intent paired with a reasoning ask — reason first, execute second',
      hasExecution: true,
      hasReasoning: true,
      isApprovalGatedMutation,
      executiveGoal: exec.goal,
    }
  }

  // 2 — Deterministic execution: CRUD / mutation only. Never OpenAI.
  if (hasExecVerb) {
    return {
      class: 'deterministic',
      reason: isApprovalGatedMutation
        ? 'approval-gated mutation — routed to review, never executed by OpenAI'
        : 'direct execution/CRUD operation — AcademyOS executes, no reasoning needed',
      hasExecution: true,
      hasReasoning: false,
      isApprovalGatedMutation,
      executiveGoal: null,
    }
  }

  // 3 — Executive reasoning: judgment / planning / explanation / prioritization.
  if (hasReasoning) {
    return {
      class: 'executive',
      reason: exec.match ? `executive ${exec.goal} request` : 'reasoning ask (recommend/explain/compare/plan/teach/diagnose)',
      hasExecution: false,
      hasReasoning: true,
      isApprovalGatedMutation: false,
      executiveGoal: exec.goal,
    }
  }

  // 4 — Default: a narrow lookup or unclassified input is AcademyOS data work.
  return {
    class: 'deterministic',
    reason: 'no reasoning or execution intent detected — deterministic data answer',
    hasExecution: false,
    hasReasoning: false,
    isApprovalGatedMutation: false,
    executiveGoal: null,
  }
}

/** Convenience: the constitutional class for a message. */
export function routingClassOf(message: string): RoutingClass {
  return classifyRequest(message).class
}

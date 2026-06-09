// Sprint 1911–1960 — DONNA Unified Conversation Brain V1
// Brain decision log — dev-only, emits to console in non-production.
// Records the full routing path so engineers can trace why the brain
// chose a specific action for any given input.
//
// No DB, no API, no React, no side effects.

// ── Types ─────────────────────────────────────────────────────────────────────

export type BrainRoutingStep =
  | 'check_goal_session'
  | 'check_goal_workflow_intent'
  | 'check_guided_workflow'
  | 'check_coo_control'
  | 'check_continuity'
  | 'check_today_guidance'
  | 'check_daily_brief'
  | 'check_review_queue'
  | 'check_attention'
  | 'check_academy_overview'
  | 'check_coo_intelligence'
  | 'check_disambiguation'
  | 'check_relationship_intelligence'
  | 'check_entity_intent'
  | 'check_entity_qa'
  | 'check_evidence_followup'
  | 'check_promotion_intent'
  | 'run_intent'
  | 'run_entity'
  | 'run_goal'
  | 'check_context_pack'
  | 'check_brain_context'
  | 'build_reasoning'
  | 'build_response'
  | 'route_coo_prompt'
  | 'god_mode'

export interface BrainDecisionLog {
  inputMessage: string
  role: string
  route: string
  stepsRun: BrainRoutingStep[]
  /** Which step produced the final action */
  decidingStep: BrainRoutingStep | null
  finalAction: string
  intentDetected: string | null
  entityDetected: string | null
  goalDetected: string | null
  confidence: number
  timestampMs: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createDebugLog(
  inputMessage: string,
  role: string,
  route: string,
): BrainDecisionLog {
  return {
    inputMessage,
    role,
    route,
    stepsRun: [],
    decidingStep: null,
    finalAction: 'pending',
    intentDetected: null,
    entityDetected: null,
    goalDetected: null,
    confidence: 0,
    timestampMs: Date.now(),
  }
}

export function logStep(log: BrainDecisionLog, step: BrainRoutingStep): void {
  log.stepsRun.push(step)
}

export function finalizeLog(
  log: BrainDecisionLog,
  decidingStep: BrainRoutingStep | null,
  finalAction: string,
): void {
  log.decidingStep = decidingStep
  log.finalAction = finalAction
}

// ── Emit ─────────────────────────────────────────────────────────────────────

export function emitDebugLog(log: BrainDecisionLog): void {
  if (process.env.NODE_ENV === 'production') return
  console.groupCollapsed(
    `[DONNA Brain] "${log.inputMessage.slice(0, 60)}" → ${log.finalAction}`
  )
  console.log('Role:', log.role, '| Route:', log.route)
  console.log('Steps:', log.stepsRun.join(' → '))
  console.log('Deciding step:', log.decidingStep ?? 'none')
  if (log.intentDetected) console.log('Intent:', log.intentDetected, `(${Math.round(log.confidence * 100)}%)`)
  if (log.entityDetected) console.log('Entity:', log.entityDetected)
  if (log.goalDetected) console.log('Goal:', log.goalDetected)
  console.groupEnd()
}

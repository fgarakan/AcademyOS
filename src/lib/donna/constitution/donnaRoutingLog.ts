// Mega Sprint 3901–3930 — DONNA Reasoning Constitution V1
// Part 2 — Developer routing visibility.
//
// Objective 6: a developer must be able to see, for any DONNA turn, exactly how
// the constitution routed it. Developer-only: writes to the server console, never
// to the client, never to a user-facing field. No PII beyond the message text the
// existing executive diagnostics already echo, and only in non-production.
//
// Pure logging contract — no DB, no OpenAI, no React.

import type { RoutingClass, RoutingClassification } from './donnaRoutingConstitution'

const PREFIX = '[donna.constitution]'

/** Whether developer routing logs should emit (off in production by default). */
export function routingLogEnabled(): boolean {
  if (process.env.DONNA_ROUTING_DEBUG === '0' || process.env.DONNA_ROUTING_DEBUG === 'false') return false
  if (process.env.DONNA_ROUTING_DEBUG === '1' || process.env.DONNA_ROUTING_DEBUG === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

export interface RoutingDecisionLog {
  /** Where the turn entered (canonical_router | live_action | strategic_action). */
  entryPoint: string
  classification: RoutingClassification
  /** The concrete routing decision made (engine/stage/action id). */
  routingDecision: string
  /** Whether OpenAI was (or will be) invoked for this turn. */
  openaiInvoked: boolean
  /** deterministic | hybrid | executive | none — how execution is carried out. */
  executionMode: RoutingClass | 'none'
  /** Why a fallback path was taken, when applicable. */
  fallbackReason?: string | null
}

/** Emit a single developer-only routing-decision line. */
export function logRoutingDecision(entry: RoutingDecisionLog): void {
  if (!routingLogEnabled()) return
  const { classification: c } = entry
  // eslint-disable-next-line no-console
  console.debug(
    `${PREFIX} entry=${entry.entryPoint} class=${c.class} ` +
      `goal=${c.executiveGoal ?? 'n/a'} exec=${c.hasExecution} reason=${c.hasReasoning} ` +
      `mutationGated=${c.isApprovalGatedMutation} decision=${entry.routingDecision} ` +
      `openai=${entry.openaiInvoked ? 'YES' : 'NO'} mode=${entry.executionMode}` +
      (entry.fallbackReason ? ` fallback="${entry.fallbackReason}"` : ''),
  )
}

/** One-line, log-safe summary of a classification (for embedding in other logs). */
export function formatClassification(c: RoutingClassification): string {
  return `class=${c.class} goal=${c.executiveGoal ?? 'n/a'} exec=${c.hasExecution} reason=${c.hasReasoning}`
}

// ── Full reasoning trace (Mega Sprint 3931–3960, Objective 6) ───────────────────
// The complete developer-visible journey of a reasoning request through the ONE
// pipeline: classification → routing → context built → OpenAI → validator →
// fallback → final response source.

export interface ReasoningTrace {
  entryPoint: string
  classification: RoutingClassification
  routingDecision: string
  /** Executive Context Packet sources assembled (0 when not the executive path). */
  contextSources: number
  openaiInvoked: boolean
  /** Response Validator disposition: accepted | modified | rejected | fallback | crashed | n/a. */
  validatorDisposition: string
  executionMode: RoutingClass | 'none'
  /** Who owns the final answer: executive | legacy. */
  finalResponseSource: string
  fallbackReason?: string | null
  // ── Mega Sprint 3991–4020 — Unified Executive Context Engine developer trace ───
  /** The page DONNA detected for this turn (e.g. "Curriculum [/director/curriculum]"). */
  pageDetected?: string | null
  /** Count of UI context elements collected from the current screen. */
  uiContextCollected?: number
  /** Context sources skipped (excluded / not relevant / budget / redacted). */
  contextSourcesSkipped?: number
  /** Character size of the serialized packet sent toward OpenAI. */
  packetSizeChars?: number
  /** OpenAI request latency (ms). */
  latencyMs?: number
  // ── Mega Sprint 4141–4170 — Live Executive Activation: full-chain visibility ───
  /** The executive layer was attempted on this turn (mode ≠ off). */
  executiveAttempted?: boolean
  /** Dialogue Engine — furthest planning stage reached this turn. */
  dialogueStage?: string | null
  /** Operating Session — currently active workday objective. */
  sessionActiveObjective?: string | null
  /** Action Loop — current workflow step reduced from live UI events. */
  workflowStep?: string | null
  /** Action Loop — current blocker, if any. */
  workflowBlocker?: string | null
  /** Durable learning records reused into the packet's relevant_memory slot. */
  learningReused?: number
}

/** Emit the full reasoning-pipeline trace for one turn (developer-only). */
export function logReasoningTrace(t: ReasoningTrace): void {
  if (!routingLogEnabled()) return
  const { classification: c } = t
  // eslint-disable-next-line no-console
  console.debug(
    `${PREFIX} TRACE entry=${t.entryPoint} class=${c.class} goal=${c.executiveGoal ?? 'n/a'} ` +
      `decision=${t.routingDecision} ` +
      (t.executiveAttempted !== undefined ? `execAttempted=${t.executiveAttempted ? 'YES' : 'NO'} ` : '') +
      `contextBuilt=${t.contextSources > 0 ? `YES(${t.contextSources})` : 'NO'} ` +
      (t.contextSourcesSkipped !== undefined ? `skipped=${t.contextSourcesSkipped} ` : '') +
      (t.pageDetected ? `page="${t.pageDetected}" ui=${t.uiContextCollected ?? 0} ` : '') +
      (t.packetSizeChars !== undefined ? `packet=${t.packetSizeChars}c ` : '') +
      (t.dialogueStage ? `dialogue=${t.dialogueStage} ` : '') +
      (t.sessionActiveObjective ? `session="${t.sessionActiveObjective}" ` : '') +
      (t.workflowStep ? `workflowStep="${t.workflowStep}"${t.workflowBlocker ? `(blocked:${t.workflowBlocker})` : ''} ` : '') +
      (t.learningReused ? `learningReused=${t.learningReused} ` : '') +
      `openai=${t.openaiInvoked ? 'YES' : 'NO'} validator=${t.validatorDisposition} ` +
      (t.latencyMs !== undefined ? `latencyMs=${t.latencyMs} ` : '') +
      `mode=${t.executionMode} finalSource=${t.finalResponseSource}` +
      (t.fallbackReason ? ` fallback="${t.fallbackReason}"` : ''),
  )
}

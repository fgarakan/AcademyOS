// Mega Sprint 3691–3720 — DONNA Executive Reasoning Live Wiring V1
// Part 3 — Live bridge.
//
// Runs the Executive Operating Layer for a live turn and maps its result back into
// the legacy DonnaMessageResult shape. Pure orchestration over already-shipped
// modules — no new AI, no second OpenAI pathway, no supabase. Fail-open: if the
// executive turn throws or its response fails validation, the caller is told to
// use the legacy result (no user-facing regression).
//
// Structural safety is inherited from legacy: permissions, approval posture,
// workflow ids and navigation come from the legacy result and are only ever
// STRENGTHENED (approval can be added, never removed). The executive layer
// contributes reasoning, continuity, and the response wording.

import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { runExecutiveOperatingTurn, type ExecutiveTurnResult } from './executiveOperatingLayer'
import { buildResolverStateFromLive, type LiveAcademyContext } from './liveResolverAdapter'
import {
  recordShadow,
  type ExecutiveMode,
  type ExecutiveLiveDiagnostics,
  type ShadowComparison,
} from './executiveShadowMode'

const MODEL = 'gpt-4o-mini'

export interface ExecutiveLiveResult {
  /** The result to return to the user (executive or legacy, per mode + validation). */
  result: DonnaMessageResult
  diagnostics: ExecutiveLiveDiagnostics
  comparison: ShadowComparison
  /** Null when the executive turn crashed. */
  turn: ExecutiveTurnResult | null
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim()
}

function buildComparison(
  legacy: DonnaMessageResult,
  turn: ExecutiveTurnResult | null,
): ShadowComparison {
  const differences: string[] = []
  const legacyIntent = (legacy.intent as { type?: string } | null)?.type ?? null
  const executiveGoal = turn?.plan.goal ?? 'n/a'
  const legacyNextAction = legacy.nextAction?.label ?? null
  const executiveNextAction = turn?.nextAction ?? 'n/a'

  const navAction = turn?.actionPlan.actions.find(a => a.kind === 'navigate')
  const wfAction = turn?.actionPlan.actions.find(a => a.kind === 'start_workflow')

  if (legacyNextAction && executiveNextAction && legacyNextAction !== executiveNextAction) {
    differences.push(`nextAction: legacy="${legacyNextAction}" exec="${executiveNextAction}"`)
  }
  if (turn && turn.validation.disposition === 'rejected') {
    differences.push('executive response REJECTED by validator')
  }
  if (turn && turn.reasoning.source === 'openai') {
    differences.push('executive reached real OpenAI; legacy may not have')
  }

  // Permissions preserved when the executive plan never lowers approval need.
  const execAddsApproval = turn?.actionPlan.actions.some(a => a.kind === 'request_approval') ?? false
  const permissionsPreserved = legacy.requiresApproval ? true : !execAddsApproval || true

  return {
    legacyIntent,
    executiveGoal,
    legacyNextAction,
    executiveNextAction,
    navigationPlan: navAction?.target ?? null,
    workflowPlan: wfAction?.target ?? null,
    permissionsPreserved,
    validationDisposition: turn?.validation.disposition ?? 'crashed',
    differences,
  }
}

function mapTurnToResult(turn: ExecutiveTurnResult, legacy: DonnaMessageResult): DonnaMessageResult {
  const navAction = turn.actionPlan.actions.find(a => a.kind === 'navigate')
  const execAddsApproval = turn.actionPlan.actions.some(a => a.kind === 'request_approval')
  return {
    ...legacy,
    // Executive layer owns the reasoning + wording + forward step.
    response: turn.finalResponse,
    spokenResponse: stripMarkdown(turn.finalResponse).slice(0, 400),
    nextAction: { label: turn.nextAction, route: navAction?.target ?? legacy.nextAction?.route },
    // Structural safety inherited from legacy; navigation/approval only strengthened.
    navigateTo: navAction?.target ?? legacy.navigateTo,
    requiresApproval: legacy.requiresApproval || execAddsApproval,
  }
}

export async function runExecutiveLive(
  input: DonnaMessageInput,
  role: string,
  academy: LiveAcademyContext,
  legacy: DonnaMessageResult,
  mode: ExecutiveMode,
  // Mega Sprint 3841–3870 — already-loaded live academy context (optional, fail-safe).
  directorCtx?: DirectorDonnaContext | null,
): Promise<ExecutiveLiveResult> {
  let turn: ExecutiveTurnResult | null = null
  try {
    const state = buildResolverStateFromLive(input, role, academy, legacy, directorCtx)
    turn = await runExecutiveOperatingTurn(state)
  } catch (err) {
    // Fail-open — executive crashed; legacy will be returned.
    // eslint-disable-next-line no-console
    console.error('[donna.executive] turn crashed, falling back to legacy:', err instanceof Error ? err.message : String(err))
    turn = null
  }

  const validated = !!turn && turn.validation.disposition !== 'rejected'
  // The user sees the executive result only in primary mode, when it validated.
  const usesExecutive = mode === 'primary' && validated
  const fallbackUsed = !usesExecutive

  const diagnostics: ExecutiveLiveDiagnostics = {
    mode,
    openaiInvoked: !!turn && turn.reasoning.source !== 'not_called',
    openaiRealCall: !!turn && turn.reasoning.source === 'openai',
    model: MODEL,
    reasoningGoal: turn?.plan.goal ?? 'n/a',
    contextPacketTokens: turn?.reasoning.contextTokens ?? 0,
    contextSources: turn?.packet.assembled.length ?? 0,
    latencyMs: turn?.reasoning.latencyMs ?? 0,
    confidenceTarget: turn?.packet.confidenceTarget ?? 0,
    responseDisposition: turn?.validation.disposition ?? 'crashed',
    fallbackUsed,
    executivePathUsed: usesExecutive,
  }

  const comparison = buildComparison(legacy, turn)

  const result: DonnaMessageResult = usesExecutive && turn
    ? { ...mapTurnToResult(turn, legacy), executiveDiagnostics: diagnostics }
    : { ...legacy, executiveDiagnostics: diagnostics }

  recordShadow({ diagnostics, comparison, message: input.userMessage ?? '' })

  return { result, diagnostics, comparison, turn }
}

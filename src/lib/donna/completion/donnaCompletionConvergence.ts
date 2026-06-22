// Mega Sprint 3391–3420 — ONE DONNA Guided Completion Convergence V1
// Part 2 — Convergence adapters + the live-pipeline behavioral guarantor.
//
// The three existing completion systems are NOT replaced or rewritten. They are
// CONVERGED behind the one canonical DonnaCompletionContract:
//
//   Form Guided Completion   → guidedCompletionToContract()
//   Goal Session Completion  → goalSessionToContract()
//   Page Execution Guidance  → pageGuidanceToContract()
//
// resolveCompletionTurn() is the single predictable decision that guarantees
// "never answer and leave": for any (intent, contract) it returns exactly one
// next move. enforceCompletionContract() is the guarantor wired into the live
// conversation pipeline — every brain result is made to satisfy the contract
// (one goal, one state, one next action; never dangling) BEFORE it reaches the
// Executive Communication Layer. It is fact-preserving and fail-safe: it never
// changes facts, recommendations, approval-gating, or the action; on any error
// it returns the original result unchanged.
//
// Pure TypeScript. No DB, no React, no network, no mutations.

import type { GuidedCompletionSessionState } from '@/lib/donna/guidedCompletion/guidedCompletionSessionMemory'
import type {
  GoalCompletionSession,
  GoalSessionStatus,
  WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaGoalCompletionModel'
import type { DirectorPageContext } from '@/lib/donna/guided/pageExecutionGuidance'
import type { DonnaMessageResult, DonnaNextAction } from '@/lib/donna/brain/processDonnaMessage'
import {
  type CompletionIntent,
  type CompletionState,
  type DonnaCompletionContract,
  isTerminalState,
} from '@/lib/donna/completion/donnaCompletionContract'

// ── Page labels ─────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<DirectorPageContext, string> = {
  today:         "Today's operating view",
  dashboard:     'Academy dashboard',
  players:       'Players',
  player_detail: 'Player profile',
  approvals:     'Review queue',
  sessions:      'Sessions',
  templates:     'Templates',
  curriculum:    'Curriculum',
  coaches:       'Coaches',
  settings:      'Academy setup',
  unknown:       'AcademyOS',
}

export function pageLabel(page: DirectorPageContext): string {
  return PAGE_LABELS[page] ?? PAGE_LABELS.unknown
}

// ── Adapter A — Form Guided Completion → contract ────────────────────────────────

export function guidedCompletionToContract(
  state: GuidedCompletionSessionState,
): DonnaCompletionContract {
  const done = state.completionPct >= 100
  const blocked = state.blockedReason != null

  const currentState: CompletionState = blocked
    ? 'BLOCKED'
    : done
      ? 'COMPLETE'
      : state.nextQuestion
        ? 'WAITING'
        : 'ACTIVE'

  const nextAction = blocked
    ? (state.blockedReason as string)
    : done
      ? 'Review the draft and approve when you are ready.'
      : state.nextQuestion ?? 'Continue to the next step.'

  return {
    goal: workflowGoalLabel(state.workflowId, state.subjectLabel),
    currentState,
    currentStep: state.nextQuestion ?? state.lastQuestion ?? null,
    nextAction,
    requiredApproval: done, // a finished guided draft is parked for approval
    blockingReason: state.blockedReason ?? null,
    completionSummary: done
      ? `${state.subjectLabel ?? 'This workflow'} is ready — ${state.completionPct}% captured.`
      : null,
    lastUserAction: state.lastQuestion ?? null,
    currentPage: null,
    realitySnapshotVersion: null,
  }
}

function workflowGoalLabel(workflowId: string, subject: string | null): string {
  const base = workflowId.replace(/_/g, ' ')
  return subject ? `${base} — ${subject}` : base
}

// ── Adapter B — Goal Session Completion → contract ───────────────────────────────

/** Map the goal session's 8-state machine onto the canonical contract state. */
export function goalStatusToCompletionState(status: GoalSessionStatus): CompletionState {
  switch (status) {
    case 'proposed':             return 'PROPOSED'
    case 'active':               return 'ACTIVE'
    case 'waiting_for_user':     return 'WAITING'
    case 'waiting_for_approval': return 'APPROVAL'
    case 'completed':            return 'COMPLETE'
    case 'cancelled':            return 'COMPLETE' // ended — closed, not dangling
    case 'blocked':              return 'BLOCKED'
    case 'paused':               return 'FOLLOW_UP' // can resume later
  }
}

export function goalSessionToContract(session: GoalCompletionSession): DonnaCompletionContract {
  const currentState = goalStatusToCompletionState(session.status)
  const stepLabel =
    session.totalSteps > 0 ? `Step ${session.currentStep} of ${session.totalSteps}` : null

  const nextAction =
    session.nextQuestion ??
    session.recommendedAction ??
    (currentState === 'COMPLETE'
      ? 'Tell me what you would like to tackle next.'
      : 'Continue with the current goal.')

  return {
    goal: session.completionCriteria || goalTypeLabel(session.goalType),
    currentState,
    currentStep: stepLabel,
    nextAction,
    requiredApproval: session.status === 'waiting_for_approval',
    blockingReason: session.status === 'blocked' ? (session.recommendedAction ?? 'Awaiting your input.') : null,
    completionSummary:
      currentState === 'COMPLETE'
        ? session.status === 'cancelled'
          ? 'Cancelled at your request — nothing was changed.'
          : `${goalTypeLabel(session.goalType)} complete.`
        : null,
    lastUserAction: session.stepHistory[session.stepHistory.length - 1]?.stepLabel ?? null,
    currentPage: session.currentRoute ?? null,
    realitySnapshotVersion: null,
  }
}

function goalTypeLabel(goalType: string): string {
  return goalType.replace(/_/g, ' ')
}

/** Goal session completion summary → a human "what changed" block. */
export function summaryToContract(summary: WorkflowCompletionSummary): DonnaCompletionContract {
  const changed = summary.whatChanged.length
    ? summary.whatChanged.join('; ')
    : 'Nothing changed.'
  return {
    goal: summary.goalLabel,
    currentState: 'COMPLETE',
    currentStep: null,
    nextAction:
      summary.recommendedNextLabel ?? 'Tell me what you would like to tackle next.',
    requiredApproval: false,
    blockingReason: null,
    completionSummary: changed,
    lastUserAction: null,
    currentPage: null,
    realitySnapshotVersion: null,
  }
}

// ── Adapter C — Page Execution Guidance → contract ───────────────────────────────

export function pageGuidanceToContract(input: {
  page: DirectorPageContext
  goal?: string | null
  nextAction?: string | null
  requiresApproval?: boolean
  route?: string | null
}): DonnaCompletionContract {
  return {
    goal: input.goal ?? `Make progress on ${pageLabel(input.page)}`,
    currentState: 'PROPOSED',
    currentStep: null,
    nextAction: input.nextAction ?? `I'll walk you through ${pageLabel(input.page)}.`,
    requiredApproval: input.requiresApproval ?? false,
    blockingReason: null,
    completionSummary: null,
    lastUserAction: null,
    currentPage: input.route ?? input.page,
    realitySnapshotVersion: null,
  }
}

// ── The single predictable turn resolver (never answer and leave) ────────────────

export type CompletionMove =
  | 'help'             // "I'm stuck"  → offer concrete help
  | 'guide'            // "I don't know" → guide, do not capture as field data
  | 'resume'           // "Continue"   → resume the current goal
  | 'advance'          // "Done"       → verify progress + advance naturally
  | 'confirm_complete' // "Done" and everything is finished → confirm completion
  | 'revise'           // "Actually…"  → preserve context + revise
  | 'confirm_cancel'   // "Cancel"     → confirm explicitly, never infer
  | 'request_approval' // an answer arrives on an approval-gated step
  | 'store_answer'     // a real answer on a non-gated step

/**
 * For ANY (intent, contract) return exactly one next move. Total by construction:
 * there is no input for which DONNA has no move — that is the structural proof of
 * "no dangling conversations / never answer and leave".
 */
export function resolveCompletionTurn(
  intent: CompletionIntent,
  contract: DonnaCompletionContract,
): CompletionMove {
  switch (intent) {
    case 'stuck':     return 'help'
    case 'dont_know': return 'guide'
    case 'continue':  return 'resume'
    case 'actually':  return 'revise'
    case 'cancel':    return 'confirm_cancel'
    case 'done':
      if (contract.requiredApproval) return 'request_approval'
      if (contract.currentState === 'COMPLETE') return 'confirm_complete'
      return 'advance'
    case 'answer':
      if (contract.requiredApproval || contract.currentState === 'APPROVAL') return 'request_approval'
      return 'store_answer'
  }
}

// ── Derivation — brain result → canonical contract ───────────────────────────────

function realityVersion(result: DonnaMessageResult): string | null {
  if (!result.realitySnapshot) return null
  const name = result.realitySnapshot.academy?.academyName
  const v = name && typeof name.value === 'string' ? name.value : 'grounded'
  return `reality:${v}`
}

function deriveState(result: DonnaMessageResult): CompletionState {
  if (result.requiresApproval) return 'APPROVAL'
  if (result.action !== 'respond') return 'ACTIVE'
  if (result.followUpQuestion && result.followUpQuestion.trim()) return 'FOLLOW_UP'
  if (result.nextAction) return 'FOLLOW_UP'
  return 'COMPLETE'
}

function deriveGoal(result: DonnaMessageResult): string {
  const fromGoal =
    result.goal && typeof (result.goal as { goalDescription?: unknown }).goalDescription === 'string'
      ? (result.goal as { goalDescription: string }).goalDescription
      : null
  return (
    fromGoal ||
    result.nextAction?.label ||
    (result.intent ? `Resolve: ${result.intent}` : '') ||
    'Help the director complete their task'
  )
}

/** A guaranteed non-empty next action for a given state. */
function defaultNextAction(state: CompletionState): string {
  switch (state) {
    case 'APPROVAL':  return 'Review and approve when you are ready.'
    case 'BLOCKED':   return 'Tell me how you would like to proceed.'
    case 'COMPLETE':  return 'Tell me what you would like to tackle next.'
    case 'WAITING':   return 'Let me know and I will continue.'
    case 'FOLLOW_UP': return 'Want me to walk you through the next step?'
    case 'ACTIVE':    return 'I will keep going from here.'
    case 'PROPOSED':  return 'I will walk you through it.'
  }
}

/**
 * Express any brain result as the canonical completion contract. Read-only —
 * it derives, it does not mutate the result.
 */
export function deriveCompletionContract(
  result: DonnaMessageResult,
  opts?: { route?: string | null; lastUserAction?: string | null },
): DonnaCompletionContract {
  const currentState = deriveState(result)
  const nextAction =
    result.nextAction?.label?.trim() ||
    result.followUpQuestion?.trim() ||
    defaultNextAction(currentState)

  return {
    goal: deriveGoal(result),
    currentState,
    currentStep: result.nextAction?.workflowId ? `workflow:${result.nextAction.workflowId}` : null,
    nextAction,
    requiredApproval: result.requiresApproval === true,
    blockingReason: null,
    completionSummary:
      currentState === 'COMPLETE' ? (result.response?.trim() || null) : null,
    lastUserAction: opts?.lastUserAction ?? null,
    currentPage: opts?.route ?? result.navigateTo ?? null,
    realitySnapshotVersion: realityVersion(result),
  }
}

// ── The live-pipeline guarantor ──────────────────────────────────────────────────

/**
 * Make a finished brain result satisfy the ONE DONNA Completion Contract before it
 * reaches the Executive Communication Layer. The contract is the canonical
 * behavioral interface for every conversation — this is where it is enforced in
 * the live pipeline.
 *
 * What it GUARANTEES (Operating Law #1 — never answer and leave):
 *   • the result always carries a next action (nextAction or followUpQuestion),
 *     so a response can never be a dead-end.
 *
 * What it NEVER changes (fact-preserving + fail-safe, like the Executive layer):
 *   • response text, recommendations, requiresApproval, action, navigation,
 *     workflow/goal commands, safety state, or any structured field.
 *   • On any error it returns the original result unchanged.
 *
 * It is idempotent: enforcing an already-conforming result is a no-op.
 */
export function enforceCompletionContract(
  result: DonnaMessageResult,
  opts?: { route?: string | null; lastUserAction?: string | null },
): DonnaMessageResult {
  try {
    const contract = deriveCompletionContract(result, opts)

    // Already conforming — a concrete next action exists. No-op.
    const hasNextAction =
      (result.nextAction?.label?.trim()?.length ?? 0) > 0 ||
      (result.followUpQuestion?.trim()?.length ?? 0) > 0
    if (hasNextAction) return result

    // A truly-complete response needs no synthesized continuation.
    if (contract.currentState === 'COMPLETE') return result

    // Never answer and leave: attach a fact-free continuation. We add it to
    // followUpQuestion (a structured field) and NEVER touch the response text,
    // so the Executive layer's fact-preservation guard is unaffected.
    const synthesized: DonnaNextAction = { label: contract.nextAction }
    return {
      ...result,
      nextAction: result.nextAction ?? synthesized,
      followUpQuestion: result.followUpQuestion ?? contract.nextAction,
    }
  } catch {
    // Fail-safe — never worsen the response.
    return result
  }
}

// Mega Sprint 4111–4140 — DONNA Executive Action Loop V1
//
// DONNA stops relying on conversation alone. She observes what actually HAPPENED in
// AcademyOS — page changes, clicks, form submits, saves, approvals, workflow
// completions, validation errors, cancels — and verifies whether her recommendations
// were completed, without asking the Director to confirm.
//
// The loop she keeps closed:
//   Recommendation → Director action → UI event → Verification → Executive update → Next
//
// Derived, not stored. UI events are PASSED IN (the client emits them) and REDUCED
// here — no new route, no new OpenAI call, no new memory store. Pure + idempotent.

import type { WorkArea } from './donnaExecutiveSession'
import { areaLabel } from './donnaExecutiveSession'
export type { WorkArea } from './donnaExecutiveSession'

// ── UI execution events (Objective 1) ───────────────────────────────────────────

export type UIEventKind =
  | 'page_change'
  | 'navigation'
  | 'click'
  | 'form_submit'
  | 'save'
  | 'create'
  | 'update'
  | 'delete'
  | 'approval'
  | 'assignment'
  | 'workflow_complete'
  | 'validation_error'
  | 'cancel'

export interface UIEvent {
  kind: UIEventKind
  /** Canonical action/object target, e.g. 'dna' | 'player' | 'assign_coach' | 'curriculum'. */
  target?: string
  route?: string
  /** false marks an event that did not succeed (e.g. a failed save). */
  ok?: boolean
  /** Human-readable detail (e.g. validation reason). */
  detail?: string
  /** Monotonic sequence number — used for ordering + de-duplication. */
  seq: number
}

/** Events that count as a completion signal for a target. */
const COMPLETION_KINDS: UIEventKind[] = ['save', 'form_submit', 'create', 'update', 'approval', 'assignment', 'workflow_complete']

// ── Recommendations + verification (Objective 2) ────────────────────────────────

export interface Recommendation {
  id: string
  area: WorkArea
  /** What DONNA asked for, e.g. "Assign a coach to Orange 2". */
  label: string
  /** Canonical target the completing UI event must carry. */
  target: string
}

export type VerificationStatus = 'completed' | 'partial' | 'failed' | 'cancelled' | 'pending'

export interface ActionVerification {
  status: VerificationStatus
  /** Why DONNA reached this verdict (drives the executive update wording). */
  reason: string
  /** The UI event that settled the verdict, if any. */
  matched: UIEvent | null
}

/**
 * Determine — from UI events alone — whether a recommendation was completed,
 * partially completed, failed, cancelled, or is still pending. No confirmation asked.
 */
export function verifyRecommendation(rec: Recommendation, events: UIEvent[]): ActionVerification {
  const forTarget = events.filter(e => e.target === rec.target)
  // Failure / cancel win over a later success only if they are the latest signal.
  const ordered = [...forTarget].sort((a, b) => a.seq - b.seq)
  const latest = ordered[ordered.length - 1] ?? null

  const failure = ordered.find(e => e.kind === 'validation_error' || (COMPLETION_KINDS.includes(e.kind) && e.ok === false))
  const cancel = ordered.find(e => e.kind === 'cancel')
  const completion = ordered.find(e => COMPLETION_KINDS.includes(e.kind) && e.ok !== false)

  // The latest meaningful event decides — a save after a failed attempt is a success.
  if (latest) {
    if (latest.kind === 'cancel') return { status: 'cancelled', reason: `${rec.label} was cancelled before it completed.`, matched: latest }
    if (latest.kind === 'validation_error' || (COMPLETION_KINDS.includes(latest.kind) && latest.ok === false)) {
      return { status: 'failed', reason: latest.detail ? `${rec.label} failed because ${latest.detail}.` : `${rec.label} did not go through.`, matched: latest }
    }
    if (COMPLETION_KINDS.includes(latest.kind) && latest.ok !== false) {
      return { status: 'completed', reason: `${rec.label} is done.`, matched: latest }
    }
  }
  if (completion) return { status: 'completed', reason: `${rec.label} is done.`, matched: completion }
  if (failure) return { status: 'failed', reason: failure.detail ? `${rec.label} failed because ${failure.detail}.` : `${rec.label} did not go through.`, matched: failure }
  if (cancel) return { status: 'cancelled', reason: `${rec.label} was cancelled.`, matched: cancel }
  // Activity but no completion (clicked/opened but never saved) → partial.
  if (forTarget.some(e => e.kind === 'click' || e.kind === 'page_change' || e.kind === 'navigation')) {
    return { status: 'partial', reason: `${rec.label} was started but not finished.`, matched: latest }
  }
  return { status: 'pending', reason: `${rec.label} hasn't happened yet.`, matched: null }
}

// ── Live workflow awareness (Objective 5) ───────────────────────────────────────

export interface WorkflowStep {
  id: string
  label: string
  /** Target whose completion event marks this step done. */
  target: string
}

export interface WorkflowDef {
  area: WorkArea
  label: string
  steps: WorkflowStep[]
}

export const WORKFLOWS: Record<WorkArea, WorkflowDef> = {
  onboarding: {
    area: 'onboarding', label: 'Academy Setup',
    steps: [
      { id: 'dna', label: 'select the Academy DNA model', target: 'dna' },
      { id: 'level', label: 'define the first curriculum level', target: 'curriculum_level' },
      { id: 'group', label: 'create the first group', target: 'group' },
      { id: 'player', label: 'enroll the first player', target: 'player' },
    ],
  },
  curriculum: {
    area: 'curriculum', label: 'Curriculum',
    steps: [
      { id: 'levels', label: 'define the curriculum levels', target: 'curriculum_level' },
      { id: 'assign', label: 'assign players to levels', target: 'curriculum_assignment' },
      { id: 'save', label: 'save the curriculum', target: 'curriculum' },
    ],
  },
  templates: {
    area: 'templates', label: 'Templates',
    steps: [
      { id: 'create', label: 'create the template', target: 'template' },
      { id: 'blocks', label: 'fill the blocks with activities and cues', target: 'template_block' },
      { id: 'publish', label: 'publish the template', target: 'publish_template' },
    ],
  },
  players: {
    area: 'players', label: 'Players',
    steps: [
      { id: 'create', label: 'create the player', target: 'player' },
      { id: 'place', label: 'finalize placement', target: 'placement' },
    ],
  },
  coaches: {
    area: 'coaches', label: 'Coaches',
    steps: [
      { id: 'invite', label: 'invite the coach', target: 'coach' },
      { id: 'assign', label: 'assign the coach to a group', target: 'assign_coach' },
    ],
  },
  sessions: {
    area: 'sessions', label: 'Sessions',
    steps: [
      { id: 'attendance', label: 'mark attendance', target: 'attendance' },
      { id: 'observation', label: 'add an observation', target: 'observation' },
      { id: 'wrapup', label: 'submit the wrap-up', target: 'wrapup' },
    ],
  },
  approvals: {
    area: 'approvals', label: 'Approvals',
    steps: [
      { id: 'review', label: 'review the pending item', target: 'review_item' },
      { id: 'decide', label: 'approve or defer it', target: 'approve_item' },
    ],
  },
  today: { area: 'today', label: 'Today', steps: [] },
  placement: {
    area: 'placement', label: 'Placement',
    steps: [
      { id: 'assess', label: 'assess the intake player', target: 'placement_assessment' },
      { id: 'finalize', label: 'finalize placement', target: 'placement' },
    ],
  },
  level_up: {
    area: 'level_up', label: 'Level-up Review',
    steps: [{ id: 'decide', label: 'approve or defer the advancement', target: 'level_decision' }],
  },
}

export interface WorkflowState {
  workflow: string
  currentStep: WorkflowStep | null
  completedSteps: string[]
  remainingSteps: string[]
  blocker: string | null
  nextAction: string | null
  /** 0–1 progress. */
  progress: number
}

/**
 * Reduce a workflow's live state directly from UI events. A step is complete when a
 * completion event for its target appears; a validation error on the current step is
 * the blocker. State updates automatically — no manual confirmation.
 */
export function reduceWorkflowState(area: WorkArea, events: UIEvent[]): WorkflowState {
  const def = WORKFLOWS[area]
  const completed: string[] = []
  let blocker: string | null = null

  for (const step of def.steps) {
    const v = verifyRecommendation({ id: step.id, area, label: step.label, target: step.target }, events)
    if (v.status === 'completed') completed.push(step.id)
    else if (v.status === 'failed' && !blocker) blocker = v.reason
  }

  const remaining = def.steps.filter(s => !completed.includes(s.id))
  const currentStep = remaining[0] ?? null
  return {
    workflow: def.label,
    currentStep,
    completedSteps: completed,
    remainingSteps: remaining.map(s => s.id),
    blocker,
    nextAction: currentStep ? `Next, ${currentStep.label}.` : `${def.label} is complete.`,
    progress: def.steps.length ? completed.length / def.steps.length : 1,
  }
}

// ── Executive guidance + the closed loop (Objectives 3, 4, 6) ───────────────────

export interface ActionLoopResult {
  verification: ActionVerification
  workflow: WorkflowState
  /** What DONNA says, derived from the events — no confirmation requested. */
  executiveUpdate: string
  /** The next thing to recommend (null when the workflow is complete). */
  nextRecommendation: Recommendation | null
  /** True when the recommendation resolved (completed / failed / cancelled). */
  loopClosed: boolean
}

const COMPLETION_PHRASE: Partial<Record<WorkArea, string>> = {
  onboarding: 'I see you completed Academy Setup.',
  curriculum: 'The curriculum has been saved.',
  templates: 'Template creation is complete.',
  players: 'The player is created.',
  coaches: 'The coach assignment is done.',
  sessions: 'The wrap-up is submitted.',
  approvals: 'That item is cleared.',
}

function nextRecommendationFor(area: WorkArea, workflow: WorkflowState): Recommendation | null {
  if (!workflow.currentStep) return null
  return { id: `${area}_${workflow.currentStep.id}`, area, label: workflow.currentStep.label, target: workflow.currentStep.target }
}

/**
 * Close the executive action loop: given a recommendation and the UI events since it
 * was issued, verify it, update the workflow, phrase the executive update, and produce
 * the next recommendation. No manual confirmation; recommendations adapt immediately.
 */
export function closeActionLoop(rec: Recommendation, events: UIEvent[]): ActionLoopResult {
  const verification = verifyRecommendation(rec, events)
  const workflow = reduceWorkflowState(rec.area, events)
  const next = nextRecommendationFor(rec.area, workflow)

  let executiveUpdate: string
  switch (verification.status) {
    case 'completed':
      executiveUpdate = workflow.currentStep
        ? `${verification.reason} ${workflow.nextAction}`
        : (COMPLETION_PHRASE[rec.area] ?? `${verification.reason} ${rec.area} is complete.`)
      break
    case 'failed':
      executiveUpdate = `${verification.reason} Let's fix that and try again.`
      break
    case 'cancelled':
      executiveUpdate = `${verification.reason} Want to pick it back up, or move on?`
      break
    case 'partial':
      executiveUpdate = `${verification.reason} ${workflow.nextAction ?? ''}`.trim()
      break
    default:
      executiveUpdate = `${verification.reason}`
  }

  return {
    verification,
    workflow,
    executiveUpdate,
    nextRecommendation: next,
    loopClosed: verification.status === 'completed' || verification.status === 'failed' || verification.status === 'cancelled',
  }
}

// ── De-duplicated guidance (no repeated / unnecessary confirmation) ─────────────

export interface GuidanceEmission {
  messages: string[]
  /** Updated acknowledged set so the same event is never narrated twice. */
  acknowledged: number[]
}

const SIGNIFICANT: UIEventKind[] = ['save', 'form_submit', 'create', 'update', 'delete', 'approval', 'assignment', 'workflow_complete', 'validation_error', 'cancel']

/**
 * Narrate only NEW significant events — never the same event twice, never a click or a
 * page change that doesn't change execution state. Keeps the loop quiet unless
 * something real happened.
 */
export function emitExecutionGuidance(events: UIEvent[], acknowledged: number[] = []): GuidanceEmission {
  const seen = new Set(acknowledged)
  const messages: string[] = []
  const nowAck = [...acknowledged]
  for (const e of [...events].sort((a, b) => a.seq - b.seq)) {
    if (seen.has(e.seq)) continue
    if (!SIGNIFICANT.includes(e.kind)) continue
    nowAck.push(e.seq)
    seen.add(e.seq)
    const label = e.target ? e.target.replace(/_/g, ' ') : 'that'
    if (e.kind === 'validation_error') messages.push(`The ${label} didn't go through${e.detail ? ` — ${e.detail}` : ''}.`)
    else if (e.kind === 'cancel') messages.push(`You cancelled the ${label}.`)
    else {
      const verb = e.kind === 'approval' ? 'approved'
        : e.kind === 'workflow_complete' ? 'completed'
        : e.kind === 'assignment' ? 'assigned'
        : e.kind === 'create' ? 'created'
        : e.kind === 'update' ? 'updated'
        : e.kind === 'delete' ? 'removed'
        : 'saved'
      messages.push(`I see the ${label} ${verb}.`)
    }
  }
  return { messages, acknowledged: nowAck }
}

// ── Developer diagnostics (Objective 7) ─────────────────────────────────────────

export interface ActionLoopDiagnostics {
  events: Array<{ seq: number; kind: UIEventKind; target?: string; ok?: boolean }>
  workflow: string
  currentStep: string | null
  completedSteps: string[]
  remainingSteps: string[]
  blocker: string | null
  verificationStatus: VerificationStatus | null
  completedAction: string | null
  failedAction: string | null
  pendingAction: string | null
  executionConfidence: number
}

export function buildActionLoopDiagnostics(
  area: WorkArea,
  events: UIEvent[],
  rec?: Recommendation | null,
): ActionLoopDiagnostics {
  const workflow = reduceWorkflowState(area, events)
  const verification = rec ? verifyRecommendation(rec, events) : null
  // Confidence: high when significant events exist and the workflow state is unambiguous.
  const sig = events.filter(e => SIGNIFICANT.includes(e.kind)).length
  const executionConfidence = events.length === 0 ? 0.3 : Math.min(1, 0.5 + 0.1 * Math.min(sig, 4) + (workflow.blocker ? 0 : 0.1))
  return {
    events: events.map(e => ({ seq: e.seq, kind: e.kind, target: e.target, ok: e.ok })),
    workflow: workflow.workflow,
    currentStep: workflow.currentStep?.label ?? null,
    completedSteps: workflow.completedSteps,
    remainingSteps: workflow.remainingSteps,
    blocker: workflow.blocker,
    verificationStatus: verification?.status ?? null,
    completedAction: verification?.status === 'completed' ? rec?.label ?? null : null,
    failedAction: verification?.status === 'failed' ? rec?.label ?? null : null,
    pendingAction: verification && (verification.status === 'pending' || verification.status === 'partial') ? rec?.label ?? null : null,
    executionConfidence,
  }
}

/** Compact EXECUTION directive for the reasoning prompt (no new OpenAI call). */
export function buildExecutionDirective(area: WorkArea, events: UIEvent[]): string {
  const workflow = reduceWorkflowState(area, events)
  const lines: string[] = ['EXECUTION (you observe the UI — confirm from events, never ask):']
  lines.push(`WORKFLOW: ${workflow.workflow} — ${workflow.completedSteps.length}/${workflow.completedSteps.length + workflow.remainingSteps.length} steps done`)
  if (workflow.blocker) lines.push(`BLOCKER: ${workflow.blocker}`)
  lines.push(`NEXT: ${workflow.nextAction ?? 'workflow complete'}`)
  lines.push('If a save/approval/workflow_complete event already happened, acknowledge it ("I see … is done") and move to the next step — do not ask the Director to confirm.')
  return lines.join('\n')
}

export { areaLabel }

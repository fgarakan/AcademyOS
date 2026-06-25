// Mega Sprint 4111–4140 — DONNA Executive Action Loop V1
// Part 3 — Operating-state reconciler.
//
// The bridge that makes the Operating Session reflect REALITY, not just conversation.
// It reconciles three sources of truth — the session (from conversation), the live
// workflow state (from UI events), and verified completions — so the operating agenda
// always reflects what AcademyOS actually shows. The Director never has to say "I
// finished that"; a verified workflow-completing event marks the objective done.
//
// Reuses the existing Executive Operating Session and Executive Action Loop — adds no
// new session model, no new route, no new OpenAI call, no new store. Pure + fail-open.

import {
  type ExecutiveSession,
  type Objective,
  type OperatingAgenda,
  areaLabel,
} from './donnaExecutiveSession'
import {
  reduceWorkflowState,
  type UIEvent,
  type WorkArea,
} from './donnaExecutiveActionLoop'

export interface ReconciliationResult {
  /** The session with objective statuses + agenda updated to match verified events. */
  session: ExecutiveSession
  /** Areas whose workflow verified as fully complete this reconciliation. */
  verifiedComplete: WorkArea[]
  /** Blockers surfaced from failed validations, by area. */
  blockers: Array<{ area: WorkArea; reason: string }>
}

/**
 * Reconcile the operating session against verified UI events. An objective whose
 * workflow is fully complete (per the events) is marked completed; a failed validation
 * becomes a blocker on the agenda; the active objective and next action are recomputed
 * so the agenda always reflects the live application state. Idempotent + fail-open.
 */
export function reconcileSessionWithEvents(
  session: ExecutiveSession,
  events: UIEvent[],
): ReconciliationResult {
  if (!events.length) {
    return { session, verifiedComplete: [], blockers: [] }
  }

  const verifiedComplete: WorkArea[] = []
  const blockers: Array<{ area: WorkArea; reason: string }> = []

  // Recompute each objective's status against the events.
  const objectives: Objective[] = session.todaysObjectives.map(o => {
    const ws = reduceWorkflowState(o.area, events)
    if (ws.blocker) blockers.push({ area: o.area, reason: ws.blocker })

    // A workflow that has steps and is fully complete → the objective is done,
    // regardless of what the conversation said (reality wins).
    const hasSteps = ws.completedSteps.length + ws.remainingSteps.length > 0
    if (hasSteps && ws.remainingSteps.length === 0 && o.status !== 'completed') {
      verifiedComplete.push(o.area)
      return { ...o, status: 'completed' as const, lastProgress: `${areaLabel(o.area)} verified complete` }
    }
    return o
  })

  const completed = objectives.filter(o => o.status === 'completed')
  const paused = objectives.filter(o => o.status === 'paused')
  let active = objectives.find(o => o.status === 'active') ?? null
  // If the previously-active objective was just verified complete, hand off to the
  // most-recent paused objective so the agenda keeps moving.
  if (!active && paused.length) active = paused[paused.length - 1]
  const unfinished = objectives.filter(o => o.status !== 'completed')

  const blocker = blockers[0]?.reason ?? null
  const nextRecommendedAction =
    blocker ? `Resolve the blocker first: ${blocker}`
    : active ? `Continue ${active.label}${active.lastProgress ? ` — ${active.lastProgress}` : ''}.`
    : unfinished[0] ? `Pick up ${unfinished[0].label}.`
    : 'Everything tracked is done — tell me what’s next.'

  const agenda: OperatingAgenda = {
    ...session.agenda,
    currentPriority: (active ?? unfinished[0])?.label ?? null,
    currentTask: active?.lastProgress ?? active?.label ?? null,
    currentBlocker: blocker,
    nextAction: nextRecommendedAction,
    futureQueue: unfinished.filter(o => o.area !== active?.area).map(o => o.label),
  }

  const timeline = [...session.timeline]
  for (const area of verifiedComplete) {
    timeline.push({ turn: session.timeline.length + 1, kind: 'completed', area, detail: `${areaLabel(area)} verified complete from UI events` })
  }

  const reconciled: ExecutiveSession = {
    ...session,
    todaysObjectives: objectives,
    activeObjective: active,
    completedObjectives: completed,
    pausedObjectives: paused,
    unfinishedObjectives: unfinished,
    nextRecommendedAction,
    agenda,
    timeline,
    // Reality-grounded state is more trustworthy than conversation-only.
    confidence: Math.min(1, session.confidence + 0.05 * verifiedComplete.length),
  }

  return { session: reconciled, verifiedComplete, blockers }
}

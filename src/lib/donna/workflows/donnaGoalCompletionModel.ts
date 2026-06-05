// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// GoalCompletionSession model, session stack, and workflow completion summary.
//
// Transforms DONNA from a recommendation assistant into a guided completion operator.
//
// Core principle: DONNA does not stop at recommendations. DONNA owns guided completion.
//   DONNA thinks. UI proves. Director decides. DONNA guides to done.
//
// Stack model:
//   - One active session at a time
//   - Paused sessions preserved in LIFO order (most recently paused resumes first)
//   - Navigation continuity: state survives page changes via sessionStorage
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - sessionStorage only. 6-hour TTL. Clears on tab close.
//   - Human approval required for all mutations. DONNA never silently mutates.
//   - Short-phrase recognition handled by donnaWorkflowRegistry.

// ── Goal types ─────────────────────────────────────────────────────────────────

export type GoalType =
  | 'daily_priorities'
  | 'player_placement'
  | 'curriculum_improvement'
  | 'review_queue'
  | 'onboarding_completion'
  | 'coach_recap_review'
  | 'parent_update_review'
  | 'academy_health_action'

// ── Session status ─────────────────────────────────────────────────────────────

export type GoalSessionStatus =
  | 'proposed'             // DONNA identified the goal, not yet started by director
  | 'active'               // Director is actively working through steps
  | 'waiting_for_user'     // DONNA asked a question, awaiting director reply
  | 'waiting_for_approval' // DONNA drafted an action, awaiting director approval
  | 'completed'            // All steps done — summary shown
  | 'cancelled'            // Director said stop
  | 'blocked'              // Cannot proceed without director input
  | 'paused'               // Director interrupted — can resume later

// ── Workflow priority ──────────────────────────────────────────────────────────
// Determines which workflow DONNA selects when multiple are available.
//
// Priority order:
//   1. blocker            → player_placement, onboarding_completion
//   2. approval           → review_queue, coach_recap_review, parent_update_review
//   3. curriculum_bottleneck → curriculum_improvement
//   4. academy_health     → academy_health_action
//   5. opportunity        → daily_priorities

export type WorkflowPriority =
  | 'blocker'
  | 'approval'
  | 'curriculum_bottleneck'
  | 'academy_health'
  | 'opportunity'

// ── Active object type ─────────────────────────────────────────────────────────

export type ActiveObjectType =
  | 'player'
  | 'curriculum_level'
  | 'review_item'
  | 'session'
  | 'coach'
  | 'academy'
  | null

// ── Step record ────────────────────────────────────────────────────────────────

export interface GoalStepRecord {
  stepNumber:     number
  stepLabel:      string
  directorChoice: 'approved' | 'rejected' | 'skipped' | 'adjusted' | 'deferred' | null
  note:           string | null
  completedAt:    number | null
}

// ── Goal completion session ────────────────────────────────────────────────────

export interface GoalCompletionSession {
  sessionId:          string
  academyId:          string | null
  userId:             string | null
  role:               string
  sourceIntent:       string
  goalType:           GoalType
  status:             GoalSessionStatus
  priority:           WorkflowPriority
  currentStep:        number
  totalSteps:         number
  activeObjectType:   ActiveObjectType
  activeObjectId:     string | null
  activeObjectLabel:  string | null
  recommendedAction:  string | null
  nextQuestion:       string | null
  completionCriteria: string
  currentRoute:       string | null
  targetRoute:        string | null
  stepHistory:        GoalStepRecord[]
  createdAt:          number
  updatedAt:          number
}

// ── Workflow completion summary ────────────────────────────────────────────────

export interface WorkflowCompletionSummary {
  goalType:             GoalType
  goalLabel:            string
  whatWasCompleted:     string[]
  whatChanged:          string[]
  whatRemains:          string[]
  recommendedNextGoal:  GoalType | null
  recommendedNextLabel: string | null
  completedAt:          number
}

// ── Goal completion stack ──────────────────────────────────────────────────────

export interface GoalCompletionStack {
  active:    GoalCompletionSession | null
  paused:    GoalCompletionSession[]
  completed: WorkflowCompletionSummary[]
}

// ── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_goal_completion_stack_v1'
const TTL_MS      = 6 * 60 * 60 * 1000  // 6 hours

interface PersistedStack extends GoalCompletionStack {
  _savedAt: number
}

function emptyStack(): GoalCompletionStack {
  return { active: null, paused: [], completed: [] }
}

function readStack(): GoalCompletionStack {
  if (typeof window === 'undefined') return emptyStack()
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStack()
    const parsed = JSON.parse(raw) as PersistedStack
    if (typeof parsed._savedAt === 'number' && Date.now() - parsed._savedAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return emptyStack()
    }
    return {
      active:    parsed.active ?? null,
      paused:    parsed.paused ?? [],
      completed: parsed.completed ?? [],
    }
  } catch {
    return emptyStack()
  }
}

function writeStack(stack: GoalCompletionStack): void {
  if (typeof window === 'undefined') return
  try {
    const persisted: PersistedStack = { ...stack, _savedAt: Date.now() }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch { /* non-fatal */ }
}

// ── ID generator ───────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `gcm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// ── Public API — read ──────────────────────────────────────────────────────────

export function getGoalCompletionStack(): GoalCompletionStack {
  return readStack()
}

export function getActiveGoalSession(): GoalCompletionSession | null {
  return readStack().active
}

export function getPausedSessions(): GoalCompletionSession[] {
  return readStack().paused
}

export function getCompletedSummaries(): WorkflowCompletionSummary[] {
  return readStack().completed
}

// ── Public API — lifecycle ─────────────────────────────────────────────────────

export interface StartGoalSessionParams {
  goalType:           GoalType
  priority:           WorkflowPriority
  sourceIntent:       string
  role:               string
  completionCriteria: string
  totalSteps:         number
  targetRoute:        string | null
  academyId?:         string | null
  userId?:            string | null
  activeObjectType?:  ActiveObjectType
  activeObjectId?:    string | null
  activeObjectLabel?: string | null
  currentRoute?:      string | null
  nextQuestion?:      string | null
  recommendedAction?: string | null
}

/**
 * Start a new goal session. If one is already active, it is paused first.
 */
export function startGoalSession(params: StartGoalSessionParams): GoalCompletionSession {
  const stack = readStack()

  // Pause the currently active session if present
  const newPaused = stack.active
    ? [{ ...stack.active, status: 'paused' as GoalSessionStatus, updatedAt: Date.now() }, ...stack.paused]
    : stack.paused

  const session: GoalCompletionSession = {
    sessionId:          generateSessionId(),
    academyId:          params.academyId ?? null,
    userId:             params.userId ?? null,
    role:               params.role,
    sourceIntent:       params.sourceIntent,
    goalType:           params.goalType,
    status:             'proposed',
    priority:           params.priority,
    currentStep:        1,
    totalSteps:         params.totalSteps,
    activeObjectType:   params.activeObjectType ?? null,
    activeObjectId:     params.activeObjectId ?? null,
    activeObjectLabel:  params.activeObjectLabel ?? null,
    recommendedAction:  params.recommendedAction ?? null,
    nextQuestion:       params.nextQuestion ?? null,
    completionCriteria: params.completionCriteria,
    currentRoute:       params.currentRoute ?? null,
    targetRoute:        params.targetRoute,
    stepHistory:        [],
    createdAt:          Date.now(),
    updatedAt:          Date.now(),
  }

  writeStack({ ...stack, active: session, paused: newPaused })
  return session
}

/**
 * Transition the active session from 'proposed' to 'active'.
 * Called when the director says "yes" to begin a workflow.
 */
export function activateGoalSession(): GoalCompletionSession | null {
  const stack = readStack()
  if (!stack.active) return null
  const updated: GoalCompletionSession = { ...stack.active, status: 'active', updatedAt: Date.now() }
  writeStack({ ...stack, active: updated })
  return updated
}

/**
 * Apply a partial update to the active session.
 */
export function updateActiveSession(
  patch: Partial<Pick<GoalCompletionSession,
    | 'status'
    | 'currentStep'
    | 'activeObjectId'
    | 'activeObjectLabel'
    | 'activeObjectType'
    | 'recommendedAction'
    | 'nextQuestion'
    | 'currentRoute'
    | 'targetRoute'
  >>,
): GoalCompletionSession | null {
  const stack = readStack()
  if (!stack.active) return null
  const updated: GoalCompletionSession = { ...stack.active, ...patch, updatedAt: Date.now() }
  writeStack({ ...stack, active: updated })
  return updated
}

/**
 * Record a director step decision and advance the step counter.
 */
export function recordGoalStep(record: GoalStepRecord): GoalCompletionSession | null {
  const stack = readStack()
  if (!stack.active) return null
  const nextStep = Math.min(stack.active.currentStep + 1, stack.active.totalSteps)
  const updated: GoalCompletionSession = {
    ...stack.active,
    stepHistory: [...stack.active.stepHistory, record],
    currentStep: nextStep,
    status:      'waiting_for_user',
    updatedAt:   Date.now(),
  }
  writeStack({ ...stack, active: updated })
  return updated
}

/**
 * Pause the active session (push to paused stack).
 * Called when a new workflow interrupts, or the director says "not now".
 */
export function pauseActiveSession(): GoalCompletionSession | null {
  const stack = readStack()
  if (!stack.active) return null
  const paused: GoalCompletionSession = { ...stack.active, status: 'paused', updatedAt: Date.now() }
  writeStack({ ...stack, active: null, paused: [paused, ...stack.paused] })
  return paused
}

/**
 * Resume the most recently paused session (LIFO).
 * If there is currently an active session, it is paused first.
 */
export function resumeMostRecentPaused(): GoalCompletionSession | null {
  const stack = readStack()
  if (stack.paused.length === 0) return null

  const [toResume, ...remainingPaused] = stack.paused
  const resumed: GoalCompletionSession = { ...toResume, status: 'active', updatedAt: Date.now() }

  const newPaused = stack.active
    ? [{ ...stack.active, status: 'paused' as GoalSessionStatus, updatedAt: Date.now() }, ...remainingPaused]
    : remainingPaused

  writeStack({ ...stack, active: resumed, paused: newPaused })
  return resumed
}

/**
 * Complete the active session. Stores the summary and resumes next paused (if any).
 */
export function completeActiveSession(summary: WorkflowCompletionSummary): GoalCompletionSession | null {
  const stack = readStack()
  if (!stack.active) return null

  let nextActive: GoalCompletionSession | null = null
  let newPaused = stack.paused

  if (stack.paused.length > 0) {
    const [toResume, ...remaining] = stack.paused
    nextActive = { ...toResume, status: 'active', updatedAt: Date.now() }
    newPaused   = remaining
  }

  writeStack({
    active:    nextActive,
    paused:    newPaused,
    completed: [...stack.completed, summary],
  })

  return nextActive
}

/**
 * Cancel the active session (director said "stop").
 * Resumes next paused session if available.
 */
export function cancelActiveSession(): void {
  const stack = readStack()
  if (!stack.active) return

  let nextActive: GoalCompletionSession | null = null
  let newPaused = stack.paused

  if (stack.paused.length > 0) {
    const [toResume, ...remaining] = stack.paused
    nextActive = { ...toResume, status: 'active', updatedAt: Date.now() }
    newPaused   = remaining
  }

  writeStack({ ...stack, active: nextActive, paused: newPaused })
}

/**
 * Update the current route on the active session (called on navigation).
 * Ensures navigation continuity — workflow state is never lost on page change.
 */
export function updateSessionRoute(route: string): void {
  const stack = readStack()
  if (!stack.active) return
  writeStack({
    ...stack,
    active: { ...stack.active, currentRoute: route, updatedAt: Date.now() },
  })
}

/**
 * Clear all goal sessions (called on sign-out or explicit reset).
 */
export function clearAllGoalSessions(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* non-fatal */ }
}

// ── Completion summary builder ─────────────────────────────────────────────────

/**
 * Build a workflow completion summary from the session step history.
 *
 * Fields:
 *   whatWasCompleted — steps with approved/adjusted decisions
 *   whatChanged      — items that were approved (will need execution)
 *   whatRemains      — items that were skipped or deferred
 *   recommendedNext  — next workflow to start (from registry)
 */
export function buildCompletionSummary(
  session: GoalCompletionSession,
  goalLabel: string,
  recommendedNextGoal: GoalType | null,
  recommendedNextLabel: string | null,
): WorkflowCompletionSummary {
  const completed: string[] = []
  const changed: string[]   = []
  const remains: string[]   = []

  for (const step of session.stepHistory) {
    if (step.directorChoice === 'approved' || step.directorChoice === 'adjusted') {
      completed.push(step.stepLabel)
      changed.push(step.note ?? step.stepLabel)
    } else if (step.directorChoice === 'skipped' || step.directorChoice === 'deferred') {
      remains.push(step.stepLabel)
    } else if (step.directorChoice === 'rejected') {
      completed.push(`${step.stepLabel} (rejected)`)
    }
  }

  return {
    goalType:             session.goalType,
    goalLabel,
    whatWasCompleted:     completed,
    whatChanged:          changed,
    whatRemains:          remains,
    recommendedNextGoal,
    recommendedNextLabel,
    completedAt:          Date.now(),
  }
}

/**
 * Format a completion summary as a DONNA response message.
 */
export function formatCompletionSummaryMessage(summary: WorkflowCompletionSummary): string {
  const lines: string[] = [`**${summary.goalLabel} — Complete**`, '']

  if (summary.whatWasCompleted.length > 0) {
    lines.push('**Completed:**')
    summary.whatWasCompleted.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }

  if (summary.whatChanged.length > 0) {
    lines.push('**What changed (pending execution after approval):**')
    summary.whatChanged.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }

  if (summary.whatRemains.length > 0) {
    lines.push('**What remains (skipped or deferred):**')
    summary.whatRemains.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }

  if (summary.recommendedNextGoal && summary.recommendedNextLabel) {
    lines.push(`**Recommended next:** ${summary.recommendedNextLabel}`)
    lines.push('Would you like me to walk you through that now?')
  } else {
    lines.push("You're up to date. No more priorities waiting.")
  }

  return lines.join('\n')
}

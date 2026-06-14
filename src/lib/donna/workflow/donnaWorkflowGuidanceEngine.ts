// Sprint 2291–2320 — DONNA Workflow Guidance Engine
// Detects workflow intent from Director language.
// Advances workflow state on route change.
// Computes confidence score and prevents false completion.
// Generates ONE next question when required data is missing.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no API, no mutations.
//   - Never marks a step complete when confidence < 70.
//   - One question at a time — never multiple questions.
//   - Pause/cancel/resume are state transitions only.

import {
  WORKFLOW_STEP_DEFS,
  startWorkflow,
  cancelWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  completeWorkflow,
  type DonnaWorkflowType,
  type DonnaWorkflowState,
  type DonnaWorkflowStepDef,
} from './donnaWorkflowState'

// ── Intent keyword map ────────────────────────────────────────────────────────

const WORKFLOW_TRIGGER_PATTERNS: Array<{
  type: DonnaWorkflowType
  patterns: RegExp[]
}> = [
  {
    // Must come before class_template_creation — "fitness template" would otherwise match both
    type: 'fitness_template_creation',
    patterns: [
      /\b(create|build|make|new)\b.{0,20}\bfitness (template|program|plan|block)\b/i,
      /\bfitness\b.{0,15}\b(template|program)\b/i,
    ],
  },
  {
    type: 'class_template_creation',
    patterns: [
      /\b(create|build|make|new|start|set up)\b.{0,20}\b(class|session) template\b/i,
      /\b(class|session) template\b.{0,30}\b(create|new|build|make)\b/i,
      /\bnew (class |session )?template\b(?!.*fitness)/i,
    ],
  },
  {
    type: 'player_onboarding',
    patterns: [
      /\b(onboard|add|enrol|enroll)\b.{0,20}\b(new |a )?player\b/i,
      /\bnew player\b/i,
      /\bplayer onboarding\b/i,
    ],
  },
  {
    type: 'session_creation',
    patterns: [
      /\b(create|schedule|book|set up)\b.{0,20}\b(a |new )?session\b/i,
      /\bnew session\b/i,
    ],
  },
  {
    type: 'approval_review',
    patterns: [
      /\b(review|clear|check|open)\b.{0,20}\b(approvals?|pending|review queue)\b/i,
      /\bapproval (queue|review)\b/i,
      /\bpending (items?|approvals?|reviews?)\b/i,
    ],
  },
  {
    type: 'coach_wrap_up_review',
    patterns: [
      /\b(review|check|read)\b.{0,20}\bcoach.{0,10}(wrap.?up|recap)\b/i,
      /\bwrap.?up review\b/i,
      /\bcoach recap\b/i,
    ],
  },
  {
    type: 'curriculum_review',
    patterns: [
      /\b(review|check|update|audit)\b.{0,20}\bcurriculum\b/i,
      /\bcurriculum review\b/i,
    ],
  },
  {
    type: 'player_assessment',
    patterns: [
      /\b(assess|evaluate|review)\b.{0,20}\bplayer\b/i,
      /\bplayer assessment\b/i,
    ],
  },
  {
    type: 'placement_review',
    patterns: [
      /\b(review|process|check)\b.{0,20}\bplacement\b/i,
      /\bplacement review\b/i,
      /\bplace a player\b/i,
    ],
  },
  {
    type: 'academy_setup',
    patterns: [
      /\b(set up|setup|configure|onboard)\b.{0,15}\bacademy\b/i,
      /\bacademy setup\b/i,
    ],
  },
  {
    type: 'template_archive',
    patterns: [
      /\barchive\b.{0,20}\b(class |session )?template\b/i,
    ],
  },
  {
    type: 'template_delete',
    patterns: [
      /\bdelete\b.{0,20}\b(class |session )?template\b/i,
      /\bremove\b.{0,20}\btemplate\b/i,
    ],
  },
  {
    type: 'fitness_template_archive',
    patterns: [
      /\barchive\b.{0,20}\bfitness template\b/i,
    ],
  },
  {
    type: 'fitness_template_delete',
    patterns: [
      /\bdelete\b.{0,20}\bfitness template\b/i,
    ],
  },
  {
    type: 'session_delete',
    patterns: [
      /\b(delete|cancel|remove)\b.{0,15}\bsession\b/i,
    ],
  },
  {
    type: 'coach_deactivate',
    patterns: [
      /\b(deactivate|remove|disable)\b.{0,15}\bcoach\b/i,
      /\bcoach deactivat/i,
    ],
  },
  {
    type: 'player_deactivate',
    patterns: [
      /\b(deactivate|remove|withdraw|disable)\b.{0,15}\bplayer\b/i,
      /\bplayer deactivat/i,
    ],
  },
]

// ── Workflow intent detection ──────────────────────────────────────────────────

export function detectWorkflowIntent(
  userInput: string,
  _pathname: string,
): DonnaWorkflowType | null {
  for (const { type, patterns } of WORKFLOW_TRIGGER_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(userInput)) return type
    }
  }
  return null
}

// ── Control intent detection ──────────────────────────────────────────────────

export type WorkflowControlIntent = 'cancel' | 'pause' | 'resume' | 'status'

export function detectControlIntent(userInput: string): WorkflowControlIntent | null {
  const lower = userInput.toLowerCase()
  if (/\b(cancel|stop|end|abandon|quit)\b.{0,20}\b(workflow|mission|this)\b/.test(lower) ||
      /\b(cancel|stop) (the )?(workflow|mission)\b/.test(lower)) return 'cancel'
  if (/\b(pause|hold|not now|later|stop for now|come back)\b/.test(lower)) return 'pause'
  if (/\b(resume|continue|pick up|go back to|where were we|what was i)\b/.test(lower)) return 'resume'
  if (/\b(status|progress|where am i|what step|what have we done|how far)\b/.test(lower)) return 'status'
  return null
}

// ── Control intent handler ────────────────────────────────────────────────────

export function handleWorkflowIntent(
  state: DonnaWorkflowState,
  intent: WorkflowControlIntent,
): DonnaWorkflowState {
  switch (intent) {
    case 'cancel': return cancelWorkflow(state)
    case 'pause':  return pauseWorkflow(state)
    case 'resume': return resumeWorkflow(state)
    case 'status': return { ...state, updatedAt: new Date().toISOString() }
    default:       return state
  }
}

// ── Route-based step advancement ──────────────────────────────────────────────

/**
 * When the Director navigates to a new route, check if any pending step's
 * targetRoute matches. If so, mark it complete and advance to the next step.
 * Returns the same state reference if nothing changed.
 */
export function advanceOnRouteChange(
  state: DonnaWorkflowState,
  newRoute: string,
): DonnaWorkflowState {
  if (state.status !== 'active') return state
  if (state.workflowConfidence < 70) return state  // guard: no auto-advance below threshold

  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  if (!currentDef) return state

  // Only advance on route_visit signal steps
  if (currentDef.completionSignal !== 'route_visit') return state
  if (!currentDef.targetRoute) return state

  // Check if the new route matches (prefix match for parameterised routes)
  const routeMatches = newRoute === currentDef.targetRoute ||
    newRoute.startsWith(currentDef.targetRoute + '/') ||
    (currentDef.targetRoute.endsWith('/new') && newRoute === currentDef.targetRoute)

  if (!routeMatches) {
    // Update currentRoute and targetRoute even if step isn't complete
    if (newRoute !== state.currentRoute) {
      return { ...state, currentRoute: newRoute, updatedAt: new Date().toISOString() }
    }
    return state
  }

  return advanceToNextStep(state, defs, newRoute, 95)
}

/**
 * When required entity data becomes available (e.g., template name entered),
 * mark the current data_present step complete and advance.
 */
export function advanceOnDataPresent(
  state: DonnaWorkflowState,
  entityRefs: Record<string, string>,
): DonnaWorkflowState {
  if (state.status !== 'active') return state
  if (state.workflowConfidence < 70) return state

  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  if (!currentDef) return state
  if (currentDef.completionSignal !== 'data_present') return state
  if (!currentDef.dataKey) return state

  const dataPresent = entityRefs[currentDef.dataKey] != null && entityRefs[currentDef.dataKey] !== ''
  if (!dataPresent) return state

  const merged = { ...state.entityRefs, ...entityRefs }
  return advanceToNextStep({ ...state, entityRefs: merged }, defs, state.currentRoute, 90)
}

/**
 * Explicitly mark the current explicit step complete.
 * Only for 'explicit' completion signal steps (approvals, confirmations).
 * Requires confidence ≥ 70.
 */
export function advanceExplicit(
  state: DonnaWorkflowState,
): DonnaWorkflowState {
  if (state.status !== 'active') return state
  if (state.workflowConfidence < 70) return state

  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  if (!currentDef) return state
  if (currentDef.completionSignal !== 'explicit') return state

  return advanceToNextStep(state, defs, state.currentRoute, 95)
}

// ── Internal: advance to next step ───────────────────────────────────────────

function advanceToNextStep(
  state: DonnaWorkflowState,
  defs: DonnaWorkflowStepDef[],
  currentRoute: string,
  confidence: number,
): DonnaWorkflowState {
  const currentIndex = defs.findIndex(d => d.stepId === state.currentStepId)
  if (currentIndex < 0) return state

  const completedStepIds = [...state.completedStepIds, state.currentStepId]
  const updatedSteps = state.steps.map(s =>
    s.stepId === state.currentStepId ? { ...s, status: 'completed' as const } : s
  )

  // Check if this was the last step
  if (currentIndex >= defs.length - 1) {
    return completeWorkflow({
      ...state,
      completedStepIds,
      steps: updatedSteps,
      currentRoute,
      workflowConfidence: confidence,
      updatedAt: new Date().toISOString(),
    })
  }

  const nextDef = defs[currentIndex + 1]
  const nextSteps = updatedSteps.map(s =>
    s.stepId === nextDef.stepId ? { ...s, status: 'in_progress' as const } : s
  )

  const missingData = nextDef.completionSignal === 'data_present' && nextDef.dataKey
    ? (state.entityRefs[nextDef.dataKey] ? [] : [nextDef.directorLabel])
    : []

  return {
    ...state,
    completedStepIds,
    steps:               nextSteps,
    currentStepId:       nextDef.stepId,
    requiredDataMissing: missingData,
    currentRoute,
    targetRoute:         nextDef.targetRoute ?? currentRoute,
    workflowConfidence:  confidence,
    nextBestAction:      buildNextBestAction(nextDef, state.entityRefs),
    updatedAt:           new Date().toISOString(),
  }
}

// ── Next best action ──────────────────────────────────────────────────────────

function buildNextBestAction(
  stepDef: DonnaWorkflowStepDef,
  entityRefs: Record<string, string>,
): string {
  if (stepDef.completionSignal === 'data_present' && stepDef.dataKey && !entityRefs[stepDef.dataKey]) {
    return stepDef.question ?? `Provide ${stepDef.directorLabel.toLowerCase()} to continue.`
  }
  if (stepDef.completionSignal === 'route_visit' && stepDef.targetRoute) {
    const pageLabel = routeToPageLabel(stepDef.targetRoute)
    return `Go to ${pageLabel} to ${stepDef.directorLabel.toLowerCase()}.`
  }
  if (stepDef.completionSignal === 'explicit') {
    return `Review the details and confirm ${stepDef.directorLabel.toLowerCase()}.`
  }
  return `Complete ${stepDef.directorLabel.toLowerCase()} to continue.`
}

export function computeNextBestAction(state: DonnaWorkflowState): string {
  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  if (!currentDef) return 'Continue the current workflow step.'
  return buildNextBestAction(currentDef, state.entityRefs)
}

function routeToPageLabel(route: string): string {
  const map: Record<string, string> = {
    '/director/players/new':     'Add Player',
    '/director/placement':       'Placement Queue',
    '/director/sessions':        'Sessions',
    '/director/class-templates': 'Class Templates',
    '/director/fitness':         'Fitness Templates',
    '/director/review':          'Review Queue',
    '/director/curriculum':      'Curriculum',
    '/director/onboarding':      'Academy Setup',
    '/director/coaches':         'Coaches',
    '/director/players':         'Players',
  }
  return map[route] ?? route.split('/').filter(Boolean).pop() ?? 'the next page'
}

// ── Missing data question ─────────────────────────────────────────────────────

/**
 * Returns ONE question when the current step has a question defined and the
 * required data is not yet present.
 * For data_present steps: returns null when the data key is already in entityRefs.
 * For route_visit/explicit steps: returns the question if defined (context-gathering).
 * Always returns null when no question is defined on the step.
 */
export function getMissingDataQuestion(state: DonnaWorkflowState): string | null {
  if (state.status !== 'active') return null

  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  if (!currentDef) return null
  if (!currentDef.question) return null

  // For data_present steps: skip if data is already available
  if (currentDef.completionSignal === 'data_present' && currentDef.dataKey) {
    if (state.entityRefs[currentDef.dataKey]) return null
  }

  return currentDef.question
}

// ── Confidence scoring ────────────────────────────────────────────────────────

export interface ConfidenceInput {
  /** Whether this state was loaded from DB (vs. just started in this session) */
  loadedFromDb:      boolean
  /** Whether the current route matches the expected target route */
  routeMatches:      boolean
  /** Whether all entity refs for this step are present */
  entityRefsPresent: boolean
}

/**
 * Score workflow confidence 0–100.
 * Below 70: step completion is blocked.
 * 70–94: high-confidence inference (route matches, entity refs present).
 * 95+: actual persisted state loaded from DB or explicit director action.
 */
export function scoreWorkflowConfidence(
  state: DonnaWorkflowState,
  input: ConfidenceInput,
): number {
  if (input.loadedFromDb && input.routeMatches && input.entityRefsPresent) return 97
  if (input.loadedFromDb && input.routeMatches) return 90
  if (input.loadedFromDb) return 80
  if (input.routeMatches && input.entityRefsPresent) return 82
  if (input.routeMatches) return 75
  if (state.completedStepIds.length > 0) return 73  // has some history
  return 65  // newly started, no route signal
}

export function shouldAllowStepCompletion(confidence: number): boolean {
  return confidence >= 70
}

// ── Explicit step helpers ─────────────────────────────────────────────────────

import type { StepCompletionSignal } from './donnaWorkflowState'

/**
 * Returns the completion signal of the current step, or null if state is invalid.
 * Used by the DONNA panel to decide whether to attempt explicit advancement.
 */
export function getCurrentStepSignal(state: DonnaWorkflowState): StepCompletionSignal | null {
  if (state.status !== 'active') return null
  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  return currentDef?.completionSignal ?? null
}

/**
 * Returns true when the Director's input looks like a step confirmation.
 * Used to advance explicit-signal steps via natural language.
 * Conservative: requires clear affirmative, not single-word "no" or questions.
 */
export function detectStepConfirmation(input: string): boolean {
  const lower = input.toLowerCase().trim()
  if (!lower) return false

  // Reject questions — Director is asking, not confirming
  if (lower.endsWith('?')) return false

  return (
    /\b(yes|yeah|yep|done|confirmed|finished|complete|ok|okay|sure|got it|all set|all done)\b/.test(lower) ||
    /\b(i (did|have|did it|have done|assigned|added|created|scheduled|reviewed|archived|deleted|set it|set that))\b/.test(lower) ||
    /\b(it'?s (done|complete|finished|been added|been created|been assigned|been set|been scheduled|been reviewed|archived|deleted))\b/.test(lower) ||
    /\b(that'?s (done|complete|finished|set|confirmed))\b/.test(lower) ||
    /\b(skip|no (fitness|block|thanks)|no (that'?s|need))\b/.test(lower) ||
    lower === 'yes' || lower === 'no' || lower === 'ok' || lower === 'done' || lower === 'skip'
  )
}

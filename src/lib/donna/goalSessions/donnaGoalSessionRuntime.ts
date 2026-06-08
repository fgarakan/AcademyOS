// Mega Sprint 934–963B — DONNA Goal Session Runtime V1
//
// Coordinator between goal resolution, guided workflow registry, session memory,
// and step runner. Returns action envelopes to the surface — no UI, no DB, no LLM.
//
// Responsibilities:
//   - Detect goal session intent (trigger phrase match in guidedCompletionRegistry)
//   - Select the correct GuidedWorkflowId and navigate to the target page
//   - Ask questions in order via guidedCompletionStepRunner
//   - Track collected answers in guidedCompletionSessionMemory (sessionStorage)
//   - Detect completion and build draft summary
//   - Handle session cancel and resume
//   - Return GoalSessionResult action envelope to caller
//
// Call order in each surface:
//   1. processGoalSession() — if action !== 'no_session', render + return early
//   2. processDonnaMessage() — only if no session matched
//
// Architecture: docs/architecture/DONNA_GOAL_SESSION_RUNTIME_934.md
// Certification: docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md

import {
  detectGuidedCompletionIntent,
  getWorkflow,
} from '../guidedCompletion/guidedCompletionRegistry'
import type { GuidedWorkflowId } from '../guidedCompletion/guidedCompletionRegistry'
import {
  startGuidedCompletion,
  getCurrentGuidedCompletion,
  recordAnswer,
  clearGuidedCompletion,
} from '../guidedCompletion/guidedCompletionSessionMemory'
import {
  buildStepMessage,
  buildAcknowledgement,
  buildCompletionSummary,
  getNextStep,
  isWorkflowComplete,
  buildResumeMessage,
} from '../guidedCompletion/guidedCompletionStepRunner'
import { buildPageStatePatch } from '../pageSync/donnaPageStateSync'
import type { PageStatePatch } from '../pageSync/donnaPageStateSync'

// ── Input ──────────────────────────────────────────────────────────────────────

export interface GoalSessionInput {
  userMessage: string
  currentRoute: string
  /** Active guided workflow ID passed from the surface, or null */
  activeGuidedWorkflowId: string | null
}

// ── Action contract ────────────────────────────────────────────────────────────

export type GoalSessionAction =
  | 'goal_session_start'    // Trigger phrase matched; session opened; Step 1 shown
  | 'goal_session_step'     // Answer recorded; next step shown
  | 'goal_session_complete' // All steps done; draft summary shown
  | 'goal_session_cancel'   // Director cancelled; session cleared
  | 'goal_session_resume'   // Resume intent on active session
  | 'no_session'            // Nothing matched — caller falls through to processDonnaMessage

// ── Result ────────────────────────────────────────────────────────────────────

export interface GoalSessionResult {
  action: GoalSessionAction
  response: string
  navigateTo: string | null
  workflowId: GuidedWorkflowId | null
  draftType: string | null
  answers: Record<string, string> | null
  completionPct: number
  confidence: number
  shouldSpeak: boolean
  spokenResponse: string | null
  /** Patch to emit as donna:page-state-patch. Caller dispatches; runtime never mutates DOM. */
  pageStatePatch: PageStatePatch | null
}

// ── Cancel intent detection ────────────────────────────────────────────────────

const CANCEL_PHRASES = [
  'stop',
  'cancel',
  'never mind',
  'nevermind',
  'exit',
  'quit',
  'abort',
  'forget it',
  'stop this',
  'end this',
  'done for now',
  'stop the workflow',
  'end the workflow',
]

function isCancelIntent(lower: string): boolean {
  return CANCEL_PHRASES.some(p => lower === p || lower.startsWith(p + ' '))
}

// ── Resume intent detection ────────────────────────────────────────────────────

const RESUME_PHRASES = [
  'resume',
  'continue',
  'pick up',
  'where were we',
  'keep going',
  'go on',
  'next question',
  'continue workflow',
]

function isResumeIntent(lower: string): boolean {
  return RESUME_PHRASES.some(p => lower.includes(p))
}

// ── Null result ────────────────────────────────────────────────────────────────

function noSession(): GoalSessionResult {
  return {
    action:         'no_session',
    response:       '',
    navigateTo:     null,
    workflowId:     null,
    draftType:      null,
    answers:        null,
    completionPct:  0,
    confidence:     0,
    shouldSpeak:    false,
    spokenResponse: null,
    pageStatePatch: null,
  }
}

// ── Navigation check ───────────────────────────────────────────────────────────

function shouldNavigateTo(targetRoute: string, currentRoute: string): boolean {
  if (!targetRoute) return false
  const staticPrefix = targetRoute.split('[')[0].replace(/\/$/, '')
  return staticPrefix.length > 0 && !currentRoute.startsWith(staticPrefix)
}

// ── Draft type mapping ─────────────────────────────────────────────────────────

const WORKFLOW_DRAFT_TYPE: Record<GuidedWorkflowId, string> = {
  curriculum_builder_completion: 'curriculum_level_draft',
  academy_setup_completion:      'academy_setup_draft',
  player_onboarding_completion:  'player_profile_draft',
  assessment_completion:         'assessment_draft',
  parent_update_completion:      'parent_update_draft',
  template_builder_completion:           'class_template_draft',
  coach_creation_completion:             'coach_invite_draft',
  fitness_template_builder_completion:   'fitness_template_draft',
}

// ── Main runtime ───────────────────────────────────────────────────────────────

/**
 * Process a director message in the context of guided goal sessions.
 *
 * Returns a GoalSessionResult. If action === 'no_session', the caller should
 * fall through to processDonnaMessage. Otherwise, render the result and return early.
 *
 * This function has no side effects outside of sessionStorage.
 * It does not call any API, database, or LLM.
 */
export function processGoalSession(input: GoalSessionInput): GoalSessionResult {
  const lower = input.userMessage.toLowerCase().trim()
  const existingSession = getCurrentGuidedCompletion()

  // ── Phase 1 & 4: Active session — process answer or control phrase ─────────

  if (existingSession) {
    // Cancel
    if (isCancelIntent(lower)) {
      clearGuidedCompletion()
      return {
        action:         'goal_session_cancel',
        response:       "Okay, I've stopped. You can start a new workflow anytime.",
        navigateTo:     null,
        workflowId:     existingSession.workflowId,
        draftType:      null,
        answers:        existingSession.answers,
        completionPct:  existingSession.completionPct,
        confidence:     1.0,
        shouldSpeak:    true,
        spokenResponse: 'Okay, cancelled.',
        pageStatePatch: null,
      }
    }

    // Resume (already active — rebuild current step message)
    if (isResumeIntent(lower)) {
      const msg = buildResumeMessage(
        existingSession.workflowId,
        existingSession.answers,
        existingSession.subjectLabel,
      )
      return {
        action:         'goal_session_resume',
        response:       msg,
        navigateTo:     null,
        workflowId:     existingSession.workflowId,
        draftType:      null,
        answers:        existingSession.answers,
        completionPct:  existingSession.completionPct,
        confidence:     1.0,
        shouldSpeak:    false,
        spokenResponse: null,
        pageStatePatch: null,
      }
    }

    const workflow = getWorkflow(existingSession.workflowId)
    if (!workflow) {
      clearGuidedCompletion()
      return noSession()
    }

    // Find the current unanswered step
    const currentStepDef = workflow.requiredSteps.find(
      s => !existingSession.answers[s.fieldId] || existingSession.answers[s.fieldId].trim() === '',
    )

    // All steps were already answered before this message arrived
    if (!currentStepDef) {
      const summary = buildCompletionSummary(
        existingSession.workflowId,
        existingSession.answers,
        existingSession.subjectLabel,
      )
      clearGuidedCompletion()
      return {
        action:         'goal_session_complete',
        response:       summary.formatted,
        navigateTo:     null,
        workflowId:     existingSession.workflowId,
        draftType:      WORKFLOW_DRAFT_TYPE[existingSession.workflowId] ?? 'generic_draft',
        answers:        existingSession.answers,
        completionPct:  100,
        confidence:     1.0,
        shouldSpeak:    true,
        spokenResponse: summary.headline,
        pageStatePatch: null,
      }
    }

    // Record the answer against the current step's fieldId
    const updated = recordAnswer(currentStepDef.fieldId, input.userMessage)
    if (!updated) return noSession()

    // Build page state patch for this answer
    const patch = buildPageStatePatch({
      workflowId:      existingSession.workflowId,
      route:           input.currentRoute,
      registryFieldId: currentStepDef.fieldId,
      value:           input.userMessage,
    })

    // Check if now complete
    if (isWorkflowComplete(existingSession.workflowId, updated.answers)) {
      const summary = buildCompletionSummary(
        existingSession.workflowId,
        updated.answers,
        updated.subjectLabel,
      )
      clearGuidedCompletion()
      return {
        action:         'goal_session_complete',
        response:       summary.formatted,
        navigateTo:     null,
        workflowId:     existingSession.workflowId,
        draftType:      WORKFLOW_DRAFT_TYPE[existingSession.workflowId] ?? 'generic_draft',
        answers:        updated.answers,
        completionPct:  100,
        confidence:     1.0,
        shouldSpeak:    true,
        spokenResponse: summary.headline,
        pageStatePatch: patch,
      }
    }

    // More steps remain — acknowledge and ask next
    const nextStep = getNextStep(existingSession.workflowId, updated.answers)
    const ack = buildAcknowledgement(
      existingSession.workflowId,
      currentStepDef,
      input.userMessage,
      nextStep,
      updated.subjectLabel,
    )

    return {
      action:         'goal_session_step',
      response:       ack.formatted,
      navigateTo:     null,
      workflowId:     existingSession.workflowId,
      draftType:      null,
      answers:        updated.answers,
      completionPct:  updated.completionPct,
      confidence:     1.0,
      shouldSpeak:    false,
      spokenResponse: null,
      pageStatePatch: patch,
    }
  }

  // ── Phase 2 & 3: No active session — detect trigger and start ─────────────

  const matchedWorkflow = detectGuidedCompletionIntent(input.userMessage)

  if (!matchedWorkflow) {
    return noSession()
  }

  // Start a new session
  startGuidedCompletion(matchedWorkflow.id, null)

  const firstStep = matchedWorkflow.requiredSteps[0]
  if (!firstStep) {
    clearGuidedCompletion()
    return noSession()
  }

  const stepMsg = buildStepMessage(matchedWorkflow.id, firstStep, null)
  const openingResponse = `${matchedWorkflow.openingMessage}\n\n${stepMsg.formatted}`

  const targetRoute = matchedWorkflow.pageRoutes[0] ?? null
  const navigateTo = targetRoute && shouldNavigateTo(targetRoute, input.currentRoute)
    ? targetRoute
    : null

  return {
    action:         'goal_session_start',
    response:       openingResponse,
    navigateTo,
    workflowId:     matchedWorkflow.id,
    draftType:      null,
    answers:        {},
    completionPct:  0,
    confidence:     0.95,
    shouldSpeak:    true,
    spokenResponse: `${matchedWorkflow.label} started.`,
    pageStatePatch: null,
  }
}

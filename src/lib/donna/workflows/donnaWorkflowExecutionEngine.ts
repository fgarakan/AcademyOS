// Mega Sprint 1055–1084 — DONNA Workflow Execution Engine V1
//
// Canonical execution layer between goal session completion and server action.
//
// Lifecycle:
//   Goal Session Q&A loop           ← guidedCompletionRegistry + donnaGoalSessionRuntime
//   → Page state patches (per step) ← donnaPageSyncEvents.dispatchPageStatePatch
//   → goal_session_complete event   ← donnaPageSyncEvents.dispatchGoalSessionCompleted
//   → buildWorkflowExecutionPlan()  ← THIS FILE — plan from answers + field maps
//   → Director reviews plan UI      ← page renders plan; director confirms
//   → buildWorkflowDraftPayload()   ← THIS FILE — payload for server action
//   → Server action called          ← page calls its own action (not this engine)
//   → buildWorkflowSubmitResult()   ← page wraps its action result in this type
//   → buildWorkflowVerificationResult() ← THIS FILE — interprets submit result
//   → buildWorkflowCompletionSummary()  ← THIS FILE — DONNA completion message
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no browser APIs, no side effects.
//   - Server actions perform all mutations — this engine never mutates.
//   - Director must explicitly confirm before any save.
//   - Every execution result is verifiable from the submit result alone.
//   - Pages own form state; this engine provides the plan contract they implement.
//
// Architecture: docs/architecture/DONNA_WORKFLOW_EXECUTION_ENGINE_1055.md
// Certification: docs/qa/DONNA_WORKFLOW_EXECUTION_ENGINE_CERTIFICATION_1055.md

import {
  getWorkflow,
  getAllWorkflows,
} from '../guidedCompletion/guidedCompletionRegistry'
import type { GuidedWorkflowId } from '../guidedCompletion/guidedCompletionRegistry'
import type { GoalSessionCompletedDetail } from '../pageSync/donnaPageSyncEvents'

// ── WorkflowFieldSummary ────────────────────────────────────────────────────────

/**
 * One answer in the plan — human-readable label + raw value.
 * Shown in the review banner before director confirms.
 */
export interface WorkflowFieldSummary {
  /** Registry fieldId (e.g. 'player_name') */
  fieldId: string
  /** Human-readable label (e.g. 'Player Name') — from registry step question */
  displayLabel: string
  /** The director's raw answer */
  value: string
  /** Whether this field is required for submission */
  required: boolean
  /** Whether the field has a non-empty value */
  filled: boolean
}

// ── WorkflowExecutionPlan ──────────────────────────────────────────────────────

/**
 * The plan built from a completed goal session.
 * Shown in the page's review banner. Director must confirm this plan
 * before any server action is called.
 *
 * The plan is immutable once built. Pages show it; they do not modify it.
 */
export interface WorkflowExecutionPlan {
  /** Unique plan ID — for deduplication across re-renders */
  planId: string
  /** The workflow that produced this plan */
  workflowId: GuidedWorkflowId
  /** Draft type label (e.g. 'player_profile_draft') */
  draftType: string
  /** All answers collected by the goal session */
  answers: Record<string, string>
  /** Human-readable field summaries for the review UI */
  fields: WorkflowFieldSummary[]
  /** Whether all required fields are filled */
  readyToSubmit: boolean
  /** User-facing validation errors (empty if readyToSubmit is true) */
  validationErrors: string[]
  /** Timestamp when the plan was built */
  builtAt: number
}

// ── WorkflowDraftPayload ───────────────────────────────────────────────────────

/**
 * The payload passed to the server action when the director confirms.
 * Built from the WorkflowExecutionPlan after director confirmation.
 *
 * The page is responsible for calling its own server action with this payload.
 * The server action may use part or all of the answers.
 */
export interface WorkflowDraftPayload {
  workflowId: GuidedWorkflowId
  draftType: string
  /** All collected answers — server action picks what it needs */
  answers: Record<string, string>
  /** Plan ID — for audit log traceability */
  planId: string
  /** Timestamp when the director clicked "Confirm & Save" */
  directorConfirmedAt: number
}

// ── WorkflowValidationResult ───────────────────────────────────────────────────

/**
 * Result of validating a WorkflowExecutionPlan before displaying the confirm button.
 */
export interface WorkflowValidationResult {
  valid: boolean
  /** User-facing error messages */
  errors: string[]
  /** FieldIds of required fields that have no value */
  missingFields: string[]
}

// ── WorkflowSubmitResult ───────────────────────────────────────────────────────

/**
 * Result returned by the page after calling its server action.
 * The page wraps its action result in this shape so the engine can verify it.
 *
 * The page must construct this — the engine does not call server actions.
 */
export interface WorkflowSubmitResult {
  ok: boolean
  /** ID of the created/updated entity (player ID, template ID, etc.) */
  entityId: string | null
  /** Entity type for display ("player", "template", "assessment", etc.) */
  entityType: string
  /** Route to redirect after creation (e.g. /director/players/{id}/onboard) */
  redirectTo: string | null
  /** Error message if ok is false */
  error: string | null
}

// ── WorkflowVerificationResult ─────────────────────────────────────────────────

/**
 * Verification of a workflow submission.
 * Built from the WorkflowSubmitResult — does not require a DB call.
 *
 * "Verified" means: server action returned ok=true AND an entity ID was returned.
 * True DB existence checks are the responsibility of the server action itself.
 */
export interface WorkflowVerificationResult {
  /** True when submit was successful and entity ID is present */
  verified: boolean
  /** True when an entity ID was returned (entity was created) */
  entityExists: boolean
  /** Display label for the created entity */
  entityLabel: string | null
  /** URL path to the created entity, if known */
  checkPath: string | null
  /** Error message if verified is false */
  failureReason: string | null
  /** Timestamp of verification */
  verifiedAt: number
}

// ── WorkflowCompletionSummary ──────────────────────────────────────────────────

/**
 * The final summary DONNA delivers after a workflow completes successfully.
 * Rendered as a DONNA message in the conversation surface.
 */
export interface WorkflowCompletionSummary {
  workflowId: GuidedWorkflowId
  draftType: string
  /** Human-readable label of what was created */
  entityLabel: string | null
  /** URL path to the created entity */
  entityPath: string | null
  /** Formatted DONNA message for the conversation stream */
  donnaMessage: string
  /** Optional label for the next suggested action */
  nextSuggestedAction: string | null
  /** Route for the next suggested action */
  nextSuggestedRoute: string | null
  /** Timestamp of completion */
  completedAt: number
}

// ── Workflow metadata ──────────────────────────────────────────────────────────

interface WorkflowMeta {
  entityType: string
  entityLabel: string
  nextAction: string | null
  nextRoute: string | null
}

const WORKFLOW_META: Record<GuidedWorkflowId, WorkflowMeta> = {
  player_onboarding_completion: {
    entityType:  'player',
    entityLabel: 'Player',
    nextAction:  'Complete player onboarding',
    nextRoute:   '/director/players',
  },
  template_builder_completion: {
    entityType:  'template',
    entityLabel: 'Class Template',
    nextAction:  'View templates',
    nextRoute:   '/director/class-templates',
  },
  assessment_completion: {
    entityType:  'assessment',
    entityLabel: 'Assessment',
    nextAction:  'View player profile',
    nextRoute:   '/director/players',
  },
  parent_update_completion: {
    entityType:  'parent_update',
    entityLabel: 'Parent Update',
    nextAction:  'Review queue',
    nextRoute:   '/director/review',
  },
  curriculum_builder_completion: {
    entityType:  'curriculum_level',
    entityLabel: 'Curriculum Level',
    nextAction:  'View curriculum',
    nextRoute:   '/director/curriculum',
  },
  academy_setup_completion: {
    entityType:  'academy_setup',
    entityLabel: 'Academy Setup',
    nextAction:  'Director home',
    nextRoute:   '/director',
  },
}

// ── ID generator ───────────────────────────────────────────────────────────────

let _planCounter = 0

function generatePlanId(): string {
  _planCounter++
  return `wep_${Date.now()}_${_planCounter}`
}

// ── buildWorkflowExecutionPlan ─────────────────────────────────────────────────

/**
 * Build a WorkflowExecutionPlan from a completed goal session.
 * Called by the page when it receives a `donna:goal-session-completed` event.
 *
 * Returns null if the workflowId is not a valid GuidedWorkflowId.
 */
export function buildWorkflowExecutionPlan(
  detail: GoalSessionCompletedDetail,
): WorkflowExecutionPlan | null {
  const workflow = getWorkflow(detail.workflowId as GuidedWorkflowId)
  if (!workflow) return null

  const allSteps = [...workflow.requiredSteps, ...workflow.optionalSteps]
  const fields: WorkflowFieldSummary[] = allSteps.map(step => {
    const raw = detail.answers[step.fieldId] ?? ''
    return {
      fieldId:      step.fieldId,
      displayLabel: step.question.length > 60 ? step.question.slice(0, 57) + '...' : step.question,
      value:        raw,
      required:     step.required,
      filled:       raw.trim().length > 0,
    }
  })

  const validation = validateFields(fields)

  return {
    planId:           generatePlanId(),
    workflowId:       detail.workflowId as GuidedWorkflowId,
    draftType:        detail.draftType,
    answers:          { ...detail.answers },
    fields,
    readyToSubmit:    validation.valid,
    validationErrors: validation.errors,
    builtAt:          Date.now(),
  }
}

// ── validateWorkflowDraft ──────────────────────────────────────────────────────

/**
 * Validate a WorkflowExecutionPlan before displaying the confirm button.
 * Run this when the plan first renders to decide if the confirm button should be enabled.
 */
export function validateWorkflowDraft(plan: WorkflowExecutionPlan): WorkflowValidationResult {
  return validateFields(plan.fields)
}

function validateFields(fields: WorkflowFieldSummary[]): WorkflowValidationResult {
  const missingFields: string[] = []
  const errors: string[] = []

  for (const field of fields) {
    if (field.required && !field.filled) {
      missingFields.push(field.fieldId)
      errors.push(`"${field.displayLabel}" is required but has no answer.`)
    }
  }

  return {
    valid:         missingFields.length === 0,
    errors,
    missingFields,
  }
}

// ── buildWorkflowDraftPayload ──────────────────────────────────────────────────

/**
 * Build the payload to pass to the server action.
 * Called by the page when the director clicks "Confirm & Save".
 *
 * The plan must be readyToSubmit before calling this.
 * If not ready, return null — do not call the server action.
 */
export function buildWorkflowDraftPayload(
  plan: WorkflowExecutionPlan,
): WorkflowDraftPayload | null {
  if (!plan.readyToSubmit) return null

  return {
    workflowId:          plan.workflowId,
    draftType:           plan.draftType,
    answers:             { ...plan.answers },
    planId:              plan.planId,
    directorConfirmedAt: Date.now(),
  }
}

// ── buildWorkflowVerificationResult ───────────────────────────────────────────

/**
 * Build a verification result from the server action's response.
 * Called by the page after the server action completes.
 *
 * Verified = submit was ok AND an entity ID was returned.
 * The server action is responsible for true DB-level verification.
 */
export function buildWorkflowVerificationResult(
  submitResult: WorkflowSubmitResult,
  entityLabel?: string,
): WorkflowVerificationResult {
  const entityExists = submitResult.ok && submitResult.entityId !== null

  let checkPath: string | null = null
  if (entityExists && submitResult.redirectTo) {
    checkPath = submitResult.redirectTo
  }

  return {
    verified:      entityExists,
    entityExists,
    entityLabel:   entityLabel ?? submitResult.entityType ?? null,
    checkPath,
    failureReason: submitResult.ok ? null : (submitResult.error ?? 'Unknown error'),
    verifiedAt:    Date.now(),
  }
}

// ── buildWorkflowCompletionSummary ─────────────────────────────────────────────

/**
 * Build the final DONNA completion summary after a workflow is verified.
 * The page dispatches this as a DONNA message in the conversation stream.
 *
 * Called by the page after buildWorkflowVerificationResult confirms success.
 * The page should not call this if verification failed — show an error instead.
 */
export function buildWorkflowCompletionSummary(
  workflowId: GuidedWorkflowId,
  verification: WorkflowVerificationResult,
  answers: Record<string, string>,
): WorkflowCompletionSummary {
  const meta = WORKFLOW_META[workflowId]
  const entityLabel = verification.entityLabel ?? meta?.entityLabel ?? 'Item'

  const entityPath = verification.checkPath ?? meta?.nextRoute ?? null

  const donnaMessage = buildCompletionMessage(workflowId, entityLabel, verification, answers)

  return {
    workflowId,
    draftType:           WORKFLOW_DRAFT_TYPE[workflowId] ?? 'draft',
    entityLabel,
    entityPath,
    donnaMessage,
    nextSuggestedAction: meta?.nextAction ?? null,
    nextSuggestedRoute:  entityPath,
    completedAt:         Date.now(),
  }
}

// ── Completion message builder ─────────────────────────────────────────────────

const WORKFLOW_DRAFT_TYPE: Record<GuidedWorkflowId, string> = {
  player_onboarding_completion:  'player_profile_draft',
  template_builder_completion:   'class_template_draft',
  assessment_completion:         'assessment_draft',
  parent_update_completion:      'parent_update_draft',
  curriculum_builder_completion: 'curriculum_level_draft',
  academy_setup_completion:      'academy_setup_draft',
}

function buildCompletionMessage(
  workflowId: GuidedWorkflowId,
  entityLabel: string,
  verification: WorkflowVerificationResult,
  answers: Record<string, string>,
): string {
  if (!verification.verified) {
    return `I wasn't able to complete the ${entityLabel} creation. ${verification.failureReason ?? 'Please try again.'}`
  }

  switch (workflowId) {
    case 'player_onboarding_completion': {
      const name = answers['player_name'] ?? entityLabel
      return `**${name} has been added.** The player profile is created and ready for onboarding — level placement, group assignment, and parent link are next.`
    }
    case 'template_builder_completion': {
      const purpose = answers['template_purpose'] ?? entityLabel
      return `**Template saved.** "${purpose}" is now in your template library. Coaches can use it when scheduling sessions.`
    }
    case 'assessment_completion': {
      const player = answers['player_name'] ?? entityLabel
      return `**Assessment recorded for ${player}.** The draft is in the review queue — approve it to add it to the player's record.`
    }
    case 'parent_update_completion': {
      const player = answers['player_name'] ?? entityLabel
      return `**Parent update drafted for ${player}.** It's in the review queue — approve it before anything is sent to the parent.`
    }
    case 'curriculum_builder_completion': {
      const level = answers['level_name'] ?? entityLabel
      return `**Curriculum level "${level}" drafted.** The draft is ready for your review. Approve it to make it part of the active curriculum.`
    }
    case 'academy_setup_completion': {
      return `**Academy setup complete.** Your configuration has been saved. You can now add coaches and players.`
    }
    default:
      return `**Done.** ${entityLabel} has been saved successfully.`
  }
}

// ── getAllWorkflowMeta ─────────────────────────────────────────────────────────

/**
 * Returns all workflow metadata (id, label, entityType, nextAction) for display purposes.
 * Used in audit and dashboard views.
 */
export function getAllWorkflowMeta(): Array<{
  workflowId: GuidedWorkflowId
  label: string
  entityType: string
  nextAction: string | null
  nextRoute: string | null
}> {
  return getAllWorkflows().map(w => ({
    workflowId: w.id,
    label:      w.label,
    entityType: WORKFLOW_META[w.id]?.entityType ?? 'unknown',
    nextAction: WORKFLOW_META[w.id]?.nextAction ?? null,
    nextRoute:  WORKFLOW_META[w.id]?.nextRoute ?? null,
  }))
}

// ── formatWorkflowReviewBanner ─────────────────────────────────────────────────

/**
 * Format the plan fields as a text summary for the review banner.
 * Pages can use this or render their own UI from plan.fields.
 */
export function formatWorkflowReviewBanner(plan: WorkflowExecutionPlan): string {
  const workflow = getWorkflow(plan.workflowId)
  const label = workflow?.label ?? plan.workflowId

  const lines: string[] = [`**${label} — Ready to Save**`, '']

  const filledFields = plan.fields.filter(f => f.filled)
  if (filledFields.length === 0) {
    lines.push('No answers collected. Cannot submit.')
  } else {
    filledFields.forEach(f => {
      lines.push(`**${f.displayLabel}:** ${f.value}`)
    })
  }

  if (!plan.readyToSubmit && plan.validationErrors.length > 0) {
    lines.push('')
    lines.push('**Missing required fields:**')
    plan.validationErrors.forEach(e => lines.push(`- ${e}`))
  }

  return lines.join('\n')
}

// Sprint 1811–1820 — DONNA Guided Completion Engine V1
// Conversational step runner: builds the DONNA messages that guide the director
// step-by-step through a workflow.
//
// Format:
//   buildStepMessage() → the question DONNA asks at each step
//   buildAcknowledgement() → DONNA's confirmation after receiving an answer
//   buildCompletionSummary() → the "DONE" message with the full draft and actions
//   getNextStep() → next unanswered required step or null
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no mutations.
//   - All messages are deterministic: same input → same output.
//   - Completion summary is a formatted draft — nothing is saved until director confirms.
//   - Approval-safe: summary includes explicit "requires your approval" note.

import type { GuidedWorkflowId, GuidedCompletionStep } from './guidedCompletionRegistry'
import { getWorkflow, requiredStepCount } from './guidedCompletionRegistry'

// ── Step message ──────────────────────────────────────────────────────────────

export interface StepMessage {
  /** Progress label: "Step 2 of 6" */
  progressLabel: string
  /** DONNA's contextual heading (e.g. "You're building Orange Ball 2 curriculum.") */
  heading: string
  /** The actual question */
  question: string
  /** Optional hint shown below the question */
  hint: string | null
  /** Full formatted message suitable for the chat thread */
  formatted: string
}

/**
 * Build the DONNA message for a specific step in the workflow.
 *
 * @param workflowId  - The active workflow
 * @param step        - The step being asked
 * @param subjectLabel - Optional subject label (e.g. "Orange Ball 2", "Jamie Chen")
 */
export function buildStepMessage(
  workflowId: GuidedWorkflowId,
  step: GuidedCompletionStep,
  subjectLabel: string | null = null,
): StepMessage {
  const total = requiredStepCount(workflowId)
  const progressLabel = `Step ${step.order} of ${total}`

  const workflow = getWorkflow(workflowId)
  const contextLine = subjectLabel
    ? `You're working on: **${subjectLabel}**`
    : workflow
      ? `Workflow: **${workflow.label}**`
      : ''

  const heading = contextLine
  const hintLine = step.hint ? `\n_${step.hint}_` : ''

  const formatted = [
    contextLine ? `${contextLine}\n` : '',
    `**${progressLabel}**`,
    step.question,
    hintLine,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    progressLabel,
    heading,
    question: step.question,
    hint: step.hint,
    formatted,
  }
}

// ── Acknowledgement ───────────────────────────────────────────────────────────

export interface AcknowledgementMessage {
  /** Short DONNA confirmation that the answer was received */
  confirmation: string
  /** What DONNA records this answer as */
  recordedAs: string
  /** Full formatted message including the next step intro */
  formatted: string
}

/**
 * Build DONNA's acknowledgement after the director answers a step.
 *
 * @param answeredStep    - The step that was just answered
 * @param answer          - The director's answer
 * @param nextStep        - The next step to ask (null if workflow is complete)
 * @param subjectLabel    - Optional subject label
 */
export function buildAcknowledgement(
  workflowId: GuidedWorkflowId,
  answeredStep: GuidedCompletionStep,
  answer: string,
  nextStep: GuidedCompletionStep | null,
  subjectLabel: string | null = null,
): AcknowledgementMessage {
  const confirmation = `Got it — ${answeredStep.question.toLowerCase().endsWith('?')
    ? answeredStep.question.slice(0, -1).toLowerCase().replace(/^what is|^which|^what|^how/, '').trim()
    : 'that'} recorded.`

  const recordedAs = `**${fieldLabel(answeredStep.fieldId)}:** ${answer}`

  let nextSection = ''
  if (nextStep) {
    const nextMsg = buildStepMessage(workflowId, nextStep, subjectLabel)
    nextSection = `\n\n---\n\n${nextMsg.formatted}`
  } else {
    nextSection = '\n\nAll required questions answered. Type **"show summary"** to see the full draft.'
  }

  const formatted = `${confirmation}\n\n${recordedAs}${nextSection}`

  return { confirmation, recordedAs, formatted }
}

// ── Human-readable field labels ───────────────────────────────────────────────

function fieldLabel(fieldId: string): string {
  const labels: Record<string, string> = {
    level_name:              'Level',
    level_goal:              'Level goal',
    required_skills:         'Required skills',
    supporting_drills:       'Supporting drills',
    assessment_method:       'Assessment method',
    parent_player_description: 'Parent/player description',
    coach_notes:             'Coach notes',
    academy_name:            'Academy name',
    development_philosophy:  'Development philosophy',
    curriculum_structure:    'Curriculum structure',
    level_count:             'Active levels',
    parent_portal_enabled:   'Parent portal',
    first_coach:             'First coach',
    competition_focus:       'Competition focus',
    player_name:             'Player name',
    player_age:              'Player age',
    recommended_level:       'Recommended level',
    assigned_coach:          'Assigned coach',
    assigned_group:          'Assigned group',
    parent_contact:          'Parent contact',
    intake_notes:            'Intake notes',
    assessment_domain:       'Assessment domain',
    observation:             'Observation',
    performance_rating:      'Performance rating',
    recommendation:          'Recommendation',
    parent_visibility:       'Parent visibility',
    level_movement_flag:     'Level movement flag',
    main_message:            'Main message',
    positive_progress:       'Positive progress',
    home_support:            'Home support tip',
    internal_flag:           'Internal note',
    next_milestone:          'Next milestone',
    template_purpose:        'Template purpose',
    session_duration:        'Session duration',
    session_focus:           'Session focus',
    block_structure:         'Block structure',
    key_drills:              'Key drills',
    target_level:            'Target level',
  }
  return labels[fieldId] ?? fieldId.replace(/_/g, ' ')
}

// ── Completion summary ────────────────────────────────────────────────────────

export interface CompletionSummary {
  /** "DONE — {Workflow label} draft complete." */
  headline: string
  /** Formatted summary of all collected answers */
  body: string
  /** Next actions available */
  actions: CompletionAction[]
  /** Full formatted message suitable for the chat thread */
  formatted: string
  /** Approval note — always included */
  approvalNote: string
}

export interface CompletionAction {
  label: string
  /** Indicates whether this action requires director approval in the UI */
  requiresApproval: boolean
  /** Descriptive note for the action */
  note: string
}

/**
 * Build the completion summary DONNA shows when all required steps are answered.
 *
 * @param workflowId   - The completed workflow
 * @param answers      - All collected answers (fieldId → string)
 * @param subjectLabel - Optional subject label
 */
export function buildCompletionSummary(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
  subjectLabel: string | null = null,
): CompletionSummary {
  const workflow = getWorkflow(workflowId)
  const label = workflow?.label ?? 'Workflow'
  const subject = subjectLabel ? ` — ${subjectLabel}` : ''

  const headline = `DONE — ${label}${subject} draft complete.`

  // Build answer list
  const allSteps = [
    ...(workflow?.requiredSteps ?? []),
    ...(workflow?.optionalSteps ?? []),
  ]

  const answerLines = allSteps
    .filter(s => answers[s.fieldId] && answers[s.fieldId].trim() !== '')
    .map(s => `- **${fieldLabel(s.fieldId)}:** ${answers[s.fieldId]}`)
    .join('\n')

  const body = `Summary:\n\n${answerLines}`

  const approvalNote =
    'Status: **Draft only** — nothing has been saved or sent. Your approval is required before any action takes effect.'

  const actions: CompletionAction[] = buildActions(workflowId)

  const formatted = [
    `**${headline}**`,
    '',
    body,
    '',
    approvalNote,
    '',
    '**What would you like to do?**',
    actions.map(a => `• ${a.label}${a.requiresApproval ? ' _(requires your approval)_' : ''}`).join('\n'),
  ].join('\n')

  return { headline, body, actions, formatted, approvalNote }
}

function buildActions(workflowId: GuidedWorkflowId): CompletionAction[] {
  switch (workflowId) {
    case 'curriculum_builder_completion':
      return [
        { label: 'Review draft',     requiresApproval: false, note: 'See the full draft before saving.' },
        { label: 'Edit a field',     requiresApproval: false, note: 'Change any answer before submitting.' },
        { label: 'Save draft',       requiresApproval: true,  note: 'Saves the curriculum level draft for review.' },
        { label: 'Submit for approval', requiresApproval: true, note: 'Sends draft to the director review queue.' },
      ]
    case 'academy_setup_completion':
      return [
        { label: 'Review setup summary', requiresApproval: false, note: 'Review all settings before confirming.' },
        { label: 'Edit a setting',       requiresApproval: false, note: 'Change any answer.' },
        { label: 'Confirm and save',     requiresApproval: true,  note: 'Applies settings to your academy.' },
      ]
    case 'player_onboarding_completion':
      return [
        { label: 'Review player draft',   requiresApproval: false, note: 'Check details before creating.' },
        { label: 'Edit a field',          requiresApproval: false, note: 'Change any answer.' },
        { label: 'Create player profile', requiresApproval: true,  note: 'Creates the profile and triggers placement.' },
      ]
    case 'assessment_completion':
      return [
        { label: 'Review assessment draft', requiresApproval: false, note: 'Read before submitting.' },
        { label: 'Edit a field',            requiresApproval: false, note: 'Change any answer.' },
        { label: 'Submit for review',       requiresApproval: true,  note: 'Sends assessment to director review queue.' },
      ]
    case 'parent_update_completion':
      return [
        { label: 'Review parent draft',   requiresApproval: false, note: 'Read before approving.' },
        { label: 'Edit a field',          requiresApproval: false, note: 'Change any answer.' },
        { label: 'Submit for approval',   requiresApproval: true,  note: 'Queues draft for director approval before send.' },
      ]
    case 'template_builder_completion':
      return [
        { label: 'Review template draft', requiresApproval: false, note: 'Check structure before saving.' },
        { label: 'Edit a field',          requiresApproval: false, note: 'Change any answer.' },
        { label: 'Save template draft',   requiresApproval: true,  note: 'Saves template for coach use after approval.' },
      ]
  }
}

// ── Next step resolver ────────────────────────────────────────────────────────

/**
 * Returns the next unanswered required step for the workflow.
 * Returns null when all required steps have been answered.
 */
export function getNextStep(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
): GuidedCompletionStep | null {
  const workflow = getWorkflow(workflowId)
  if (!workflow) return null
  return (
    workflow.requiredSteps.find(
      s => !answers[s.fieldId] || answers[s.fieldId].trim() === '',
    ) ?? null
  )
}

/**
 * Returns true when all required steps are answered.
 */
export function isWorkflowComplete(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
): boolean {
  return getNextStep(workflowId, answers) === null
}

/**
 * Returns how many required steps have been answered (0-based count).
 */
export function countAnsweredSteps(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
): number {
  const workflow = getWorkflow(workflowId)
  if (!workflow) return 0
  return workflow.requiredSteps.filter(
    s => answers[s.fieldId] && answers[s.fieldId].trim() !== '',
  ).length
}

// ── Resume message ────────────────────────────────────────────────────────────

/**
 * Build the DONNA message when resuming a workflow in progress.
 */
export function buildResumeMessage(
  workflowId: GuidedWorkflowId,
  answers: Record<string, string>,
  subjectLabel: string | null = null,
): string {
  const workflow = getWorkflow(workflowId)
  if (!workflow) return 'I couldn\'t find the workflow to resume.'

  const answered = countAnsweredSteps(workflowId, answers)
  const total = requiredStepCount(workflowId)
  const next = getNextStep(workflowId, answers)
  const subject = subjectLabel ? ` — ${subjectLabel}` : ''

  if (!next) {
    return `You've completed all ${total} steps for **${workflow.label}${subject}**.\n\nType **"show summary"** to see the draft and submit for approval.`
  }

  const stepMsg = buildStepMessage(workflowId, next, subjectLabel)

  return [
    `Welcome back. You're in the middle of **${workflow.label}${subject}**.`,
    `Progress: ${answered} of ${total} steps done.\n`,
    `Picking up where you left off:\n`,
    stepMsg.formatted,
  ].join('\n')
}

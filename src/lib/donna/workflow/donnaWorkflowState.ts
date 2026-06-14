// Sprint 2291–2320 — DONNA Workflow Guidance + Mission Control V1
// Canonical workflow state: 17 workflow types, step definitions, state builders.
// Persisted in donna_working_memory under key 'active_workflow_state', scope 'user'.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - DonnaWorkflowType is separate from legacy WorkflowType in workflowMemory.ts.
//   - State built deterministically from step definitions.
//   - Directors never see workflow IDs, step IDs, or route metadata.

// ── Workflow type ─────────────────────────────────────────────────────────────

export type DonnaWorkflowType =
  | 'academy_setup'
  | 'player_onboarding'
  | 'class_template_creation'
  | 'fitness_template_creation'
  | 'session_creation'
  | 'coach_wrap_up_review'
  | 'player_assessment'
  | 'placement_review'
  | 'approval_review'
  | 'curriculum_review'
  | 'template_archive'
  | 'template_delete'
  | 'fitness_template_archive'
  | 'fitness_template_delete'
  | 'session_delete'
  | 'coach_deactivate'
  | 'player_deactivate'

// ── Step completion signal types ──────────────────────────────────────────────

export type StepCompletionSignal =
  | 'route_visit'   // complete when director visits targetRoute
  | 'data_present'  // complete when entityRefs[dataKey] is set
  | 'explicit'      // complete only on explicit confirmation (safe-delete flows)

// ── Step definition ───────────────────────────────────────────────────────────

export interface DonnaWorkflowStepDef {
  stepId:           string
  /** Human-readable label for the Mission Formatter (e.g. "Template Name") */
  directorLabel:    string
  /** ONE question to ask when this step is current and required data is missing */
  question?:        string
  /** Route that triggers this step as in-progress or complete */
  targetRoute?:     string
  completionSignal: StepCompletionSignal
  /** For data_present signal: which entityRefs key must be present */
  dataKey?:         string
  requiresApproval: boolean
}

// ── Step runtime status ───────────────────────────────────────────────────────

export interface DonnaWorkflowStepStatus {
  stepId: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
}

// ── Live workflow state ───────────────────────────────────────────────────────

export interface DonnaWorkflowState {
  /** UUID — internal, never shown to Director */
  workflowId:          string
  workflowType:        DonnaWorkflowType
  status:              'active' | 'paused' | 'completed' | 'cancelled'
  startedAt:           string
  updatedAt:           string
  currentStepId:       string
  steps:               DonnaWorkflowStepStatus[]
  completedStepIds:    string[]
  blockedStepIds:      string[]
  /** Human-readable missing fields DONNA needs to ask about */
  requiredDataMissing: string[]
  currentRoute:        string
  targetRoute:         string
  /** Safe entity references: { playerId, templateId, levelKey, coachId, ... } */
  entityRefs:          Record<string, string>
  /** 0–100. Below 70: DONNA may not mark a step complete. */
  workflowConfidence:  number
  /** One sentence — the next thing the Director should do */
  nextBestAction:      string
}

// ── Workflow definitions ──────────────────────────────────────────────────────

export const WORKFLOW_STEP_DEFS: Record<DonnaWorkflowType, DonnaWorkflowStepDef[]> = {

  academy_setup: [
    { stepId: 'identity',        directorLabel: 'Academy Identity',   targetRoute: '/director/onboarding',              completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'interview',       directorLabel: 'Academy Interview',   targetRoute: '/director/onboarding/interview',    completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'curriculum_init', directorLabel: 'Curriculum Setup',    targetRoute: '/director/onboarding/curriculum',   completionSignal: 'route_visit', requiresApproval: false },
  ],

  player_onboarding: [
    { stepId: 'add_player',       directorLabel: 'Add Player',               targetRoute: '/director/players/new', completionSignal: 'route_visit', requiresApproval: false,
      question: 'Which player are we onboarding? Tell me their name and approximate age group.' },
    { stepId: 'placement',        directorLabel: 'Placement Assessment',       targetRoute: '/director/placement',   completionSignal: 'route_visit', requiresApproval: true },
    { stepId: 'assign_curriculum', directorLabel: 'Assign Curriculum Level',   completionSignal: 'data_present',    dataKey: 'levelKey', requiresApproval: false,
      question: 'Which curriculum level should this player start at?' },
    { stepId: 'first_session',    directorLabel: 'Schedule First Session',    targetRoute: '/director/sessions',    completionSignal: 'route_visit', requiresApproval: false },
  ],

  class_template_creation: [
    { stepId: 'name_template', directorLabel: 'Template Name',   completionSignal: 'data_present', dataKey: 'templateName', requiresApproval: false,
      question: 'What should we call this class template?' },
    { stepId: 'set_focus',     directorLabel: 'Focus Area',      completionSignal: 'data_present', dataKey: 'focusArea',    requiresApproval: false,
      question: 'What is the main focus area for this template? (e.g. groundstrokes, volleys, match play)' },
    { stepId: 'add_blocks',    directorLabel: 'Session Blocks',  targetRoute: '/director/class-templates', completionSignal: 'route_visit', requiresApproval: false,
      question: 'How many minutes should this template run, and what blocks would you like?' },
    { stepId: 'add_fitness',   directorLabel: 'Fitness Block',   completionSignal: 'data_present', dataKey: 'fitnessAdded', requiresApproval: false,
      question: 'Should this template include a fitness block? If so, what type?' },
    { stepId: 'publish',       directorLabel: 'Publish Template', completionSignal: 'explicit', requiresApproval: true },
  ],

  fitness_template_creation: [
    { stepId: 'name_template', directorLabel: 'Template Name',   completionSignal: 'data_present', dataKey: 'templateName', requiresApproval: false,
      question: 'What should we call this fitness template?' },
    { stepId: 'set_type',      directorLabel: 'Fitness Type',    completionSignal: 'data_present', dataKey: 'fitnessType',  requiresApproval: false,
      question: 'What type of fitness is this template focused on? (e.g. agility, strength, conditioning)' },
    { stepId: 'add_exercises', directorLabel: 'Add Exercises',   targetRoute: '/director/fitness', completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'publish',       directorLabel: 'Publish Template', completionSignal: 'explicit', requiresApproval: true },
  ],

  session_creation: [
    { stepId: 'select_template', directorLabel: 'Select Template', targetRoute: '/director/class-templates', completionSignal: 'route_visit', requiresApproval: false,
      question: 'Which class template should we use for this session?' },
    { stepId: 'set_schedule',    directorLabel: 'Set Date + Time', targetRoute: '/director/sessions',        completionSignal: 'route_visit', requiresApproval: false,
      question: 'When should this session run?' },
    { stepId: 'assign_coach',    directorLabel: 'Assign Coach',    completionSignal: 'data_present', dataKey: 'coachId', requiresApproval: false,
      question: 'Which coach should lead this session?' },
    { stepId: 'confirm',         directorLabel: 'Confirm Session',  completionSignal: 'explicit', requiresApproval: true },
  ],

  coach_wrap_up_review: [
    { stepId: 'open_queue',  directorLabel: 'Open Review Queue', targetRoute: '/director/review', completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'review',      directorLabel: 'Review Wrap-Ups',   completionSignal: 'data_present', dataKey: 'reviewItemsReviewed', requiresApproval: false },
    { stepId: 'decisions',   directorLabel: 'Approve Decisions', completionSignal: 'explicit', requiresApproval: true },
  ],

  player_assessment: [
    { stepId: 'open_player', directorLabel: 'Open Player Profile',    targetRoute: '/director/players', completionSignal: 'route_visit', requiresApproval: false,
      question: 'Which player are we assessing?' },
    { stepId: 'assessment',  directorLabel: 'Complete Assessment',     completionSignal: 'data_present', dataKey: 'assessmentComplete', requiresApproval: false },
    { stepId: 'signals',     directorLabel: 'Record Development Signals', completionSignal: 'explicit', requiresApproval: false },
  ],

  placement_review: [
    { stepId: 'open_placement', directorLabel: 'Open Placement Queue', targetRoute: '/director/placement', completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'review_player',  directorLabel: 'Review Placement',     completionSignal: 'data_present', dataKey: 'placementReviewed', requiresApproval: false },
    { stepId: 'confirm',        directorLabel: 'Confirm Placement',    completionSignal: 'explicit', requiresApproval: true },
  ],

  approval_review: [
    { stepId: 'open_queue',  directorLabel: 'Open Review Queue', targetRoute: '/director/review', completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'review',      directorLabel: 'Review Pending Items', completionSignal: 'data_present', dataKey: 'itemsReviewed', requiresApproval: false },
    { stepId: 'complete',    directorLabel: 'Complete All Decisions', completionSignal: 'explicit', requiresApproval: true },
  ],

  curriculum_review: [
    { stepId: 'open_curriculum', directorLabel: 'Open Curriculum',  targetRoute: '/director/curriculum', completionSignal: 'route_visit', requiresApproval: false },
    { stepId: 'review_levels',   directorLabel: 'Review Levels',    completionSignal: 'data_present', dataKey: 'levelsReviewed', requiresApproval: false },
    { stepId: 'draft_changes',   directorLabel: 'Draft Changes',    completionSignal: 'data_present', dataKey: 'changesDrafted', requiresApproval: false },
    { stepId: 'approve_changes', directorLabel: 'Approve Changes',  completionSignal: 'explicit', requiresApproval: true },
  ],

  template_archive: [
    { stepId: 'review_impact', directorLabel: 'Review Template Impact', completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'confirm',       directorLabel: 'Confirm Archive',        completionSignal: 'explicit', requiresApproval: true },
  ],

  template_delete: [
    { stepId: 'confirm_clear', directorLabel: 'Confirm No Active Sessions', completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'confirm_delete', directorLabel: 'Confirm Deletion',          completionSignal: 'explicit', requiresApproval: true },
  ],

  fitness_template_archive: [
    { stepId: 'review_impact', directorLabel: 'Review Template Impact', completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'confirm',       directorLabel: 'Confirm Archive',        completionSignal: 'explicit', requiresApproval: true },
  ],

  fitness_template_delete: [
    { stepId: 'confirm_clear', directorLabel: 'Confirm No Active Sessions', completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'confirm_delete', directorLabel: 'Confirm Deletion',          completionSignal: 'explicit', requiresApproval: true },
  ],

  session_delete: [
    { stepId: 'review_session', directorLabel: 'Review Session Details', completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'confirm_cancel', directorLabel: 'Confirm Cancellation',   completionSignal: 'explicit', requiresApproval: true },
  ],

  coach_deactivate: [
    { stepId: 'review_history', directorLabel: 'Review Coach History',    completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'reassign',       directorLabel: 'Reassign Players',        completionSignal: 'data_present', dataKey: 'playersReassigned', requiresApproval: false,
      question: 'Which coach should take over this coach\'s players?' },
    { stepId: 'confirm',        directorLabel: 'Confirm Deactivation',    completionSignal: 'explicit', requiresApproval: true },
  ],

  player_deactivate: [
    { stepId: 'review_history',   directorLabel: 'Review Player History',   completionSignal: 'explicit', requiresApproval: false },
    { stepId: 'archive_sessions', directorLabel: 'Archive Active Sessions', completionSignal: 'data_present', dataKey: 'sessionsArchived', requiresApproval: false },
    { stepId: 'confirm',          directorLabel: 'Confirm Deactivation',    completionSignal: 'explicit', requiresApproval: true },
  ],
}

// ── Human-readable workflow labels ────────────────────────────────────────────

export const WORKFLOW_LABELS: Record<DonnaWorkflowType, string> = {
  academy_setup:             'Academy Setup',
  player_onboarding:         'Player Onboarding',
  class_template_creation:   'Create Class Template',
  fitness_template_creation: 'Create Fitness Template',
  session_creation:          'Create Session',
  coach_wrap_up_review:      'Coach Wrap-Up Review',
  player_assessment:         'Player Assessment',
  placement_review:          'Placement Review',
  approval_review:           'Approval Review',
  curriculum_review:         'Curriculum Review',
  template_archive:          'Archive Template',
  template_delete:           'Delete Template',
  fitness_template_archive:  'Archive Fitness Template',
  fitness_template_delete:   'Delete Fitness Template',
  session_delete:            'Cancel Session',
  coach_deactivate:          'Deactivate Coach',
  player_deactivate:         'Deactivate Player',
}

// ── Safe delete/archive guidance ──────────────────────────────────────────────

export interface SafeDeleteGuidance {
  /** 'archive' strongly preferred over 'delete' when history exists */
  recommendation:  'archive' | 'delete'
  message:         string
  requiresHistory: boolean
  confirmLabel:    string
}

const SAFE_DELETE_MESSAGES: Partial<Record<DonnaWorkflowType, (usageCount: number) => SafeDeleteGuidance>> = {
  template_archive: (usageCount) => ({
    recommendation: 'archive',
    message: usageCount > 0
      ? `This template has been used in ${usageCount} session${usageCount !== 1 ? 's' : ''}. Archiving preserves history. I recommend archiving instead of deleting. Would you like to archive it?`
      : 'This template has not been used in any sessions. You can safely archive it to remove it from your active list.',
    requiresHistory: false,
    confirmLabel: 'Archive Template',
  }),
  template_delete: (usageCount) => ({
    recommendation: usageCount > 0 ? 'archive' : 'delete',
    message: usageCount > 0
      ? `This template has been used in ${usageCount} session${usageCount !== 1 ? 's' : ''}. Deleting it will remove session history. I strongly recommend archiving instead. Are you sure you want to delete?`
      : 'This template has no session history. It is safe to delete. Would you like to confirm deletion?',
    requiresHistory: usageCount > 0,
    confirmLabel: usageCount > 0 ? 'Delete Anyway' : 'Confirm Delete',
  }),
  fitness_template_archive: (usageCount) => ({
    recommendation: 'archive',
    message: usageCount > 0
      ? `This fitness template has been used in ${usageCount} session${usageCount !== 1 ? 's' : ''}. I recommend archiving it to preserve history.`
      : 'This fitness template has not been used. You can safely archive it.',
    requiresHistory: false,
    confirmLabel: 'Archive Fitness Template',
  }),
  fitness_template_delete: (usageCount) => ({
    recommendation: usageCount > 0 ? 'archive' : 'delete',
    message: usageCount > 0
      ? `This fitness template has been used in ${usageCount} session${usageCount !== 1 ? 's' : ''}. Deleting removes that history. I recommend archiving instead.`
      : 'This fitness template has no history. It is safe to delete.',
    requiresHistory: usageCount > 0,
    confirmLabel: usageCount > 0 ? 'Delete Anyway' : 'Confirm Delete',
  }),
  session_delete: (_usageCount) => ({
    recommendation: 'delete',
    message: 'Cancelling a session will remove it from the schedule. Coach assignments and any submitted wrap-ups will be preserved in history. Are you sure you want to cancel this session?',
    requiresHistory: false,
    confirmLabel: 'Cancel Session',
  }),
  coach_deactivate: (_usageCount) => ({
    recommendation: 'archive',
    message: 'Deactivating a coach preserves all their session history and player wrap-ups. Their assigned players will need to be reassigned before deactivation is complete.',
    requiresHistory: false,
    confirmLabel: 'Deactivate Coach',
  }),
  player_deactivate: (_usageCount) => ({
    recommendation: 'archive',
    message: 'Deactivating a player preserves all their assessment history and session records. Any active sessions they are enrolled in should be reviewed first.',
    requiresHistory: false,
    confirmLabel: 'Deactivate Player',
  }),
}

export function getSafeDeleteGuidance(
  workflowType: DonnaWorkflowType,
  usageCount: number,
): SafeDeleteGuidance | null {
  const builder = SAFE_DELETE_MESSAGES[workflowType]
  return builder ? builder(usageCount) : null
}

// ── State builders ────────────────────────────────────────────────────────────

function newId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function startWorkflow(
  workflowType: DonnaWorkflowType,
  entityRefs: Record<string, string>,
  currentRoute: string,
): DonnaWorkflowState {
  const defs = WORKFLOW_STEP_DEFS[workflowType]
  const firstStep = defs[0]
  const steps: DonnaWorkflowStepStatus[] = defs.map((d, i) => ({
    stepId: d.stepId,
    status: i === 0 ? 'in_progress' : 'pending',
  }))
  const now = new Date().toISOString()
  return {
    workflowId:          newId(),
    workflowType,
    status:              'active',
    startedAt:           now,
    updatedAt:           now,
    currentStepId:       firstStep.stepId,
    steps,
    completedStepIds:    [],
    blockedStepIds:      [],
    requiredDataMissing: firstStep.question ? [firstStep.directorLabel] : [],
    currentRoute,
    targetRoute:         firstStep.targetRoute ?? currentRoute,
    entityRefs,
    workflowConfidence:  70,
    nextBestAction:      firstStep.question ?? `Go to ${firstStep.targetRoute ?? 'the correct page'} to begin.`,
  }
}

export function cancelWorkflow(state: DonnaWorkflowState): DonnaWorkflowState {
  return { ...state, status: 'cancelled', updatedAt: new Date().toISOString() }
}

export function pauseWorkflow(state: DonnaWorkflowState): DonnaWorkflowState {
  return { ...state, status: 'paused', updatedAt: new Date().toISOString() }
}

export function resumeWorkflow(state: DonnaWorkflowState): DonnaWorkflowState {
  return { ...state, status: 'active', updatedAt: new Date().toISOString() }
}

export function completeWorkflow(state: DonnaWorkflowState): DonnaWorkflowState {
  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  return {
    ...state,
    status: 'completed',
    updatedAt: new Date().toISOString(),
    completedStepIds: defs.map(d => d.stepId),
    steps: state.steps.map(s => ({ ...s, status: 'completed' as const })),
  }
}

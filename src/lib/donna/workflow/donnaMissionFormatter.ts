// Sprint 2291–2320 — DONNA Mission Formatter
// Converts DonnaWorkflowState into Director-safe language.
// No internal IDs, route metadata, or workflow terminology exposed.
// Directors see: title, completed items, next action, progress.

import {
  WORKFLOW_STEP_DEFS,
  WORKFLOW_LABELS,
  type DonnaWorkflowState,
  type DonnaWorkflowType,
} from './donnaWorkflowState'

// ── Output type ───────────────────────────────────────────────────────────────

export interface FormattedMission {
  title:           string
  workflowType:    DonnaWorkflowType
  completedItems:  string[]   // e.g. ["Template Name", "Focus Area"]
  nextAction:      string     // e.g. "Add Session Blocks"
  progressPercent: number     // 0–100
  status:          'active' | 'paused' | 'blocked'
  /** Route to navigate to when Director clicks Continue */
  continueRoute:   string
  /** How many steps are total */
  totalSteps:      number
  /** How many steps are done */
  completedSteps:  number
}

// ── Formatter ─────────────────────────────────────────────────────────────────

export function formatActiveMission(state: DonnaWorkflowState): FormattedMission | null {
  if (state.status === 'cancelled' || state.status === 'completed') return null

  const defs = WORKFLOW_STEP_DEFS[state.workflowType]
  const totalSteps = defs.length
  const completedSteps = state.completedStepIds.length

  const completedItems = state.completedStepIds
    .map(id => defs.find(d => d.stepId === id)?.directorLabel ?? '')
    .filter(Boolean)

  const currentDef = defs.find(d => d.stepId === state.currentStepId)
  const nextAction = currentDef?.directorLabel ?? 'Continue'

  const progressPercent = totalSteps > 0
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0

  const status: FormattedMission['status'] =
    state.status === 'paused'       ? 'paused' :
    state.blockedStepIds.length > 0 ? 'blocked' :
    'active'

  const continueRoute = state.targetRoute || currentDef?.targetRoute || '/director'

  return {
    title:           buildTitle(state),
    workflowType:    state.workflowType,
    completedItems,
    nextAction,
    progressPercent,
    status,
    continueRoute,
    totalSteps,
    completedSteps,
  }
}

// ── Title builder ─────────────────────────────────────────────────────────────

function buildTitle(state: DonnaWorkflowState): string {
  const base = WORKFLOW_LABELS[state.workflowType]

  // Personalize with entity refs when available
  if (state.workflowType === 'class_template_creation' && state.entityRefs.templateName) {
    return state.entityRefs.templateName
  }
  if (state.workflowType === 'fitness_template_creation' && state.entityRefs.templateName) {
    return state.entityRefs.templateName
  }
  if (state.workflowType === 'player_onboarding' && state.entityRefs.playerName) {
    return `Onboard ${state.entityRefs.playerName}`
  }
  if (state.workflowType === 'player_assessment' && state.entityRefs.playerName) {
    return `Assess ${state.entityRefs.playerName}`
  }
  if (state.workflowType === 'placement_review' && state.entityRefs.playerName) {
    return `Place ${state.entityRefs.playerName}`
  }
  if (state.workflowType === 'coach_deactivate' && state.entityRefs.coachName) {
    return `Deactivate ${state.entityRefs.coachName}`
  }
  if (state.workflowType === 'player_deactivate' && state.entityRefs.playerName) {
    return `Deactivate ${state.entityRefs.playerName}`
  }
  if (state.workflowType === 'template_archive' && state.entityRefs.templateName) {
    return `Archive ${state.entityRefs.templateName}`
  }
  if (state.workflowType === 'template_delete' && state.entityRefs.templateName) {
    return `Delete ${state.entityRefs.templateName}`
  }

  return base
}

// ── System prompt string ──────────────────────────────────────────────────────

/** Builds a compact system prompt section for DONNA's LLM context. */
export function buildWorkflowPromptSection(mission: FormattedMission): string {
  const lines: string[] = []
  lines.push('\n## Active Mission')
  lines.push(`Mission: ${mission.title}`)
  lines.push(`Progress: ${mission.completedSteps} of ${mission.totalSteps} steps complete`)

  if (mission.completedItems.length > 0) {
    lines.push(`Completed: ${mission.completedItems.join(', ')}`)
  }

  lines.push(`Next: ${mission.nextAction}`)

  if (mission.status === 'paused') {
    lines.push('Status: paused — Director chose to continue later.')
  } else if (mission.status === 'blocked') {
    lines.push('Status: blocked — missing required information.')
  }

  lines.push('Guide the Director to complete this mission. Ask for one piece of missing information at a time. Do not list all remaining steps.')

  return lines.join('\n')
}

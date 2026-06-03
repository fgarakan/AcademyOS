// Assessment Template Resolver V1
// Pure TypeScript — no DB calls, no side effects.
// Maps player context + assessment purpose → which template to load + DONNA explanation.
//
// Routing rules:
//   quick_placement_snapshot     → Core Assessment Template (quick mode) — for new/unknown players
//   development_assessment       → Ball-level template by stage (standard mode)
//   level_readiness_assessment   → Ball-level template by stage (deep mode)
//   evaluation_assessment        → Ball-level template by stage (deep mode)
//
// If the player has no known stage, all purposes fall back to Core Assessment Template.

import type { AssessmentMode, AssessmentView } from './assessmentTemplateTypes'
import { autoSuggestView } from './assessmentTemplateTypes'

// ─── Assessment Purpose ───────────────────────────────────────────────────────

export type AssessmentPurpose =
  | 'quick_placement_snapshot'
  | 'development_assessment'
  | 'level_readiness_assessment'
  | 'evaluation_assessment'

export const ASSESSMENT_PURPOSE_LABELS: Record<AssessmentPurpose, string> = {
  quick_placement_snapshot:   'Quick Placement Snapshot',
  development_assessment:     'Development Assessment',
  level_readiness_assessment: 'Level Readiness Assessment',
  evaluation_assessment:      'Evaluation Assessment',
}

export const ASSESSMENT_PURPOSE_DESCRIPTIONS: Record<AssessmentPurpose, string> = {
  quick_placement_snapshot:   'Rapid 5-domain rating — used to determine starting group and level.',
  development_assessment:     'Section-by-section review of technical, tactical, and behavioral skills.',
  level_readiness_assessment: 'Deep evaluation of whether the player is ready to advance to the next level.',
  evaluation_assessment:      'Full assessment to evaluate the player for a trial, group change, or program review.',
}

export const ASSESSMENT_PURPOSE_ORDER: AssessmentPurpose[] = [
  'quick_placement_snapshot',
  'development_assessment',
  'level_readiness_assessment',
  'evaluation_assessment',
]

// ─── Template name map by stage ───────────────────────────────────────────────

const STAGE_TO_TEMPLATE_NAME: Record<string, string> = {
  red_ball:         'Red Ball Assessment',
  red_foundation:   'Red Ball Assessment',
  orange_ball:      'Orange Ball Assessment',
  orange_development: 'Orange Ball Assessment',
  green_dot:        'Green Dot Assessment',
  green_performance: 'Green Dot Assessment',
  yellow_ball:      'Yellow Ball Assessment',
  yellow_competitive: 'Yellow Ball Assessment',
}

export const CORE_TEMPLATE_NAME = 'Core Assessment Template'

// ─── Resolution result ────────────────────────────────────────────────────────

export interface AssessmentTemplateResolution {
  purpose: AssessmentPurpose
  templateName: string
  view: AssessmentView
  mode: AssessmentMode
  donnaExplanation: string
  confidence: 'high' | 'medium' | 'low'
  isNewPlayer: boolean
}

// ─── Resolver input ───────────────────────────────────────────────────────────

export interface AssessmentResolverInput {
  playerStage: string | null
  playerStatus: string | null
  playerFirstName: string | null
  existingAssessmentCount: number
  requestedPurpose?: AssessmentPurpose | null
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export function resolveAssessmentTemplate(
  input: AssessmentResolverInput,
): AssessmentTemplateResolution {
  const {
    playerStage,
    playerStatus,
    playerFirstName,
    existingAssessmentCount,
    requestedPurpose,
  } = input

  const name = playerFirstName ? `${playerFirstName}` : 'This player'
  const isNewPlayer = playerStatus === 'pending' || existingAssessmentCount === 0
  const view = autoSuggestView(playerStage)
  const stageKey = normaliseStageKey(playerStage)
  const ballLevelTemplateName = stageKey ? (STAGE_TO_TEMPLATE_NAME[stageKey] ?? null) : null

  // Resolve purpose: use requested purpose if valid, otherwise default
  const purpose = requestedPurpose ?? defaultPurpose(isNewPlayer, playerStage)

  // Resolve template name + mode based on purpose
  let templateName: string
  let mode: AssessmentMode

  if (purpose === 'quick_placement_snapshot') {
    templateName = CORE_TEMPLATE_NAME
    mode = 'quick'
  } else if (ballLevelTemplateName) {
    templateName = ballLevelTemplateName
    mode = purpose === 'development_assessment' ? 'standard' : 'deep'
  } else {
    // Unknown stage — always fall back to Core Template
    templateName = CORE_TEMPLATE_NAME
    mode = purpose === 'development_assessment' ? 'standard' : 'deep'
  }

  const confidence = computeConfidence(view, ballLevelTemplateName, purpose, existingAssessmentCount)
  const donnaExplanation = buildDonnaExplanation(name, purpose, view, templateName, ballLevelTemplateName, isNewPlayer, existingAssessmentCount)

  return {
    purpose,
    templateName,
    view,
    mode,
    donnaExplanation,
    confidence,
    isNewPlayer,
  }
}

// ─── DONNA explanation for each purpose change ───────────────────────────────

export function buildDonnaExplanationForPurpose(
  purpose: AssessmentPurpose,
  playerStage: string | null,
  playerFirstName: string | null,
): string {
  const name = playerFirstName ?? 'This player'
  const stageKey = normaliseStageKey(playerStage)
  const ballLevelTemplateName = stageKey ? (STAGE_TO_TEMPLATE_NAME[stageKey] ?? null) : null
  const view = autoSuggestView(playerStage)
  const templateName = ballLevelTemplateName ?? CORE_TEMPLATE_NAME
  const isNewPlayer = false
  return buildDonnaExplanation(name, purpose, view, templateName, ballLevelTemplateName, isNewPlayer, 1)
}

// ─── Default purpose logic ────────────────────────────────────────────────────

function defaultPurpose(isNewPlayer: boolean, playerStage: string | null): AssessmentPurpose {
  if (isNewPlayer || !playerStage) return 'quick_placement_snapshot'
  return 'development_assessment'
}

// ─── Normalise stage string to a key ─────────────────────────────────────────

function normaliseStageKey(stage: string | null): string | null {
  if (!stage) return null
  const s = stage.toLowerCase().replace(/[\s-]/g, '_')
  if (s.includes('red'))    return 'red_ball'
  if (s.includes('orange')) return 'orange_ball'
  if (s.includes('green'))  return 'green_dot'
  if (s.includes('yellow')) return 'yellow_ball'
  return null
}

// ─── Confidence computation ───────────────────────────────────────────────────

function computeConfidence(
  view: AssessmentView,
  ballLevelTemplate: string | null,
  purpose: AssessmentPurpose,
  existingCount: number,
): 'high' | 'medium' | 'low' {
  if (view === 'general' || !ballLevelTemplate) return 'low'
  if (purpose === 'quick_placement_snapshot') return existingCount === 0 ? 'high' : 'medium'
  if (purpose === 'development_assessment' && existingCount > 0) return 'high'
  return 'medium'
}

// ─── DONNA explanation builder ────────────────────────────────────────────────

function buildDonnaExplanation(
  name: string,
  purpose: AssessmentPurpose,
  view: AssessmentView,
  templateName: string,
  ballLevelTemplate: string | null,
  isNewPlayer: boolean,
  existingCount: number,
): string {
  const stageLabel = view === 'general' ? null : view.replace(/_/g, ' ')

  switch (purpose) {
    case 'quick_placement_snapshot':
      if (isNewPlayer || existingCount === 0) {
        return `${name} is new to the system. I recommend the Quick Placement Snapshot — it covers the five key domains and gives me enough signal to suggest a starting group and level. Takes under 60 seconds.`
      }
      return `Running a Quick Placement Snapshot will refresh the placement signal for ${name}. Use this if you are reconsidering their group or level assignment.`

    case 'development_assessment':
      if (ballLevelTemplate) {
        return `${name} is in the ${stageLabel} stage. I recommend the ${templateName} — it covers the specific skills and behaviors expected at this level, section by section.`
      }
      return `I recommend a Development Assessment for ${name}. The Core Assessment Template covers all domains across all stages. For a more targeted assessment, assign ${name} a curriculum level first.`

    case 'level_readiness_assessment':
      if (ballLevelTemplate) {
        return `Use the ${templateName} in deep mode to evaluate whether ${name} is ready to advance. This assessment will cover every skill in detail — take your time with each section.`
      }
      return `A Level Readiness Assessment will evaluate ${name}'s full skill profile. Assign a curriculum level first to unlock a stage-specific template.`

    case 'evaluation_assessment':
      if (ballLevelTemplate) {
        return `This is an Evaluation Assessment for ${name} — typically used for trials, group changes, or program reviews. The ${templateName} provides a full picture of their current development stage.`
      }
      return `Running a full Evaluation Assessment for ${name} using the Core Assessment Template. All domains will be scored in detail.`
  }
}

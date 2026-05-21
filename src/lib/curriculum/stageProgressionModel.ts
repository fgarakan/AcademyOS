// Sprint 521 — Stage Progression Model
// Models how players progress through curriculum stages and what gates between levels look like.
// Provides the view model for the stage progression view (coach + director facing).
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export const STAGE_ORDER: CurriculumStage[] = [
  'Red Ball',
  'Orange Ball',
  'Green Ball',
  'Yellow Ball',
  'High Performance',
]

export interface StageGate {
  fromStage: CurriculumStage
  toStage: CurriculumStage
  gateLabel: string
  description: string
  requiresAssessment: boolean
  requiresDirectorApproval: boolean
  typicalWeeksAtStage: number
}

export const STAGE_GATES: StageGate[] = [
  {
    fromStage: 'Red Ball',
    toStage: 'Orange Ball',
    gateLabel: 'Red → Orange Gate',
    description: 'Consistent contact with red ball, basic rally from baseline, serve grip established.',
    requiresAssessment: true,
    requiresDirectorApproval: true,
    typicalWeeksAtStage: 26,
  },
  {
    fromStage: 'Orange Ball',
    toStage: 'Green Ball',
    gateLabel: 'Orange → Green Gate',
    description: 'Technical groundstrokes established, tactical patterns introduced, net play developing.',
    requiresAssessment: true,
    requiresDirectorApproval: true,
    typicalWeeksAtStage: 52,
  },
  {
    fromStage: 'Green Ball',
    toStage: 'Yellow Ball',
    gateLabel: 'Green → Yellow Gate',
    description: 'Full-court consistency, point construction, competitive match play experience.',
    requiresAssessment: true,
    requiresDirectorApproval: true,
    typicalWeeksAtStage: 78,
  },
  {
    fromStage: 'Yellow Ball',
    toStage: 'High Performance',
    gateLabel: 'Yellow → High Performance Gate',
    description: 'Tournament readiness, advanced technical refinement, consistent competitive results.',
    requiresAssessment: true,
    requiresDirectorApproval: true,
    typicalWeeksAtStage: 104,
  },
]

export interface PlayerStageProgressInput {
  playerId: string
  currentStage: CurriculumStage
  currentLevelId: string
  weeksAtCurrentStage: number
  gatesMet: number
  gatesTotal: number
  assessmentComplete: boolean
  directorApproved: boolean
}

export interface PlayerStageProgressView {
  playerId: string
  currentStage: CurriculumStage
  currentLevelId: string
  nextStage: CurriculumStage | null
  gateToNextStage: StageGate | null
  gateCompletionPct: number
  weeksAtCurrentStage: number
  typicalWeeksAtStage: number
  isReadyForAssessment: boolean
  isReadyToAdvance: boolean
  blockers: string[]
  progressLabel: string
}

export function buildPlayerStageProgressView(
  input: PlayerStageProgressInput,
): PlayerStageProgressView {
  const currentStageIndex = STAGE_ORDER.indexOf(input.currentStage)
  const nextStage = currentStageIndex < STAGE_ORDER.length - 1
    ? STAGE_ORDER[currentStageIndex + 1]
    : null
  const gateToNextStage = nextStage
    ? STAGE_GATES.find(g => g.fromStage === input.currentStage && g.toStage === nextStage) ?? null
    : null

  const gateCompletionPct = input.gatesTotal > 0
    ? Math.round((input.gatesMet / input.gatesTotal) * 100)
    : 0

  const typicalWeeksAtStage = gateToNextStage?.typicalWeeksAtStage ?? 52

  const blockers: string[] = []
  if (input.gatesMet < input.gatesTotal) {
    blockers.push(`${input.gatesTotal - input.gatesMet} gate${input.gatesTotal - input.gatesMet > 1 ? 's' : ''} not yet met`)
  }
  if (!input.assessmentComplete && gateToNextStage?.requiresAssessment) {
    blockers.push('Formal assessment not yet complete')
  }
  if (!input.directorApproved && gateToNextStage?.requiresDirectorApproval) {
    blockers.push('Awaiting director approval to advance')
  }

  const isReadyForAssessment = input.gatesMet >= input.gatesTotal && !input.assessmentComplete
  const isReadyToAdvance = blockers.length === 0 && nextStage !== null

  const progressLabel = isReadyToAdvance
    ? `Ready to advance to ${nextStage}`
    : isReadyForAssessment
    ? 'Gates complete — assessment needed'
    : `${gateCompletionPct}% gates met`

  return {
    playerId: input.playerId,
    currentStage: input.currentStage,
    currentLevelId: input.currentLevelId,
    nextStage,
    gateToNextStage,
    gateCompletionPct,
    weeksAtCurrentStage: input.weeksAtCurrentStage,
    typicalWeeksAtStage,
    isReadyForAssessment,
    isReadyToAdvance,
    blockers,
    progressLabel,
  }
}

export function getStageGate(fromStage: CurriculumStage, toStage: CurriculumStage): StageGate | null {
  return STAGE_GATES.find(g => g.fromStage === fromStage && g.toStage === toStage) ?? null
}

export function getNextStage(stage: CurriculumStage): CurriculumStage | null {
  const index = STAGE_ORDER.indexOf(stage)
  return index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null
}

export function getPreviousStage(stage: CurriculumStage): CurriculumStage | null {
  const index = STAGE_ORDER.indexOf(stage)
  return index > 0 ? STAGE_ORDER[index - 1] : null
}

export function isHigherStage(stageA: CurriculumStage, stageB: CurriculumStage): boolean {
  return STAGE_ORDER.indexOf(stageA) > STAGE_ORDER.indexOf(stageB)
}

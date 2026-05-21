// Sprint 505 — Curriculum Visual Map Model
// Typed model for the curriculum visual map — stage bars, level cards, layout helpers.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type CurriculumStage = 'Red Ball' | 'Orange Ball' | 'Green Ball' | 'Yellow Ball' | 'High Performance'

export const CURRICULUM_STAGES: CurriculumStage[] = [
  'Red Ball',
  'Orange Ball',
  'Green Ball',
  'Yellow Ball',
  'High Performance',
]

export interface StageColorConfig {
  stage: CurriculumStage
  dotClass: string
  textClass: string
  borderClass: string
  bgClass: string
}

export const STAGE_COLORS: Record<CurriculumStage, StageColorConfig> = {
  'Red Ball': {
    stage: 'Red Ball',
    dotClass: 'bg-status-red',
    textClass: 'text-status-red',
    borderClass: 'border-status-red',
    bgClass: 'bg-status-red/10',
  },
  'Orange Ball': {
    stage: 'Orange Ball',
    dotClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    borderClass: 'border-status-orange',
    bgClass: 'bg-status-orange/10',
  },
  'Green Ball': {
    stage: 'Green Ball',
    dotClass: 'bg-status-green',
    textClass: 'text-status-green',
    borderClass: 'border-status-green',
    bgClass: 'bg-status-green/10',
  },
  'Yellow Ball': {
    stage: 'Yellow Ball',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-400',
    bgClass: 'bg-yellow-400/10',
  },
  'High Performance': {
    stage: 'High Performance',
    dotClass: 'bg-lime',
    textClass: 'text-lime',
    borderClass: 'border-lime',
    bgClass: 'bg-lime/10',
  },
}

export interface VisualMapLevelInput {
  levelId: string
  levelName: string
  stage: CurriculumStage
  playerCount: number
  gateCount: number
  drillCount: number
  coachCueCount: number
  pendingApprovals: number
  atRiskCount: number
  completionPct: number
}

export interface VisualMapLevelCard {
  levelId: string
  levelName: string
  stage: CurriculumStage
  colors: StageColorConfig
  playerCount: number
  gateCount: number
  drillCount: number
  coachCueCount: number
  pendingApprovals: number
  atRiskCount: number
  completionPct: number
  completionLabel: string
  hasAlert: boolean
  alertLabel: string | null
}

export interface VisualMapStageGroup {
  stage: CurriculumStage
  colors: StageColorConfig
  levels: VisualMapLevelCard[]
  totalPlayers: number
}

export interface CurriculumVisualMap {
  stages: VisualMapStageGroup[]
  totalLevels: number
  totalPlayers: number
  selectedLevelId: string | null
}

function buildLevelCard(input: VisualMapLevelInput): VisualMapLevelCard {
  const colors = STAGE_COLORS[input.stage]
  const pct = Math.round(Math.max(0, Math.min(100, input.completionPct)))
  const completionLabel = pct === 0 ? 'Not started' : pct === 100 ? 'All gates met' : `${pct}% gates met`

  const hasAlert = input.atRiskCount > 0 || input.pendingApprovals > 0
  let alertLabel: string | null = null
  if (input.atRiskCount > 0 && input.pendingApprovals > 0) {
    alertLabel = `${input.atRiskCount} at risk · ${input.pendingApprovals} pending`
  } else if (input.atRiskCount > 0) {
    alertLabel = `${input.atRiskCount} player${input.atRiskCount > 1 ? 's' : ''} at risk`
  } else if (input.pendingApprovals > 0) {
    alertLabel = `${input.pendingApprovals} pending approval${input.pendingApprovals > 1 ? 's' : ''}`
  }

  return {
    levelId: input.levelId,
    levelName: input.levelName,
    stage: input.stage,
    colors,
    playerCount: input.playerCount,
    gateCount: input.gateCount,
    drillCount: input.drillCount,
    coachCueCount: input.coachCueCount,
    pendingApprovals: input.pendingApprovals,
    atRiskCount: input.atRiskCount,
    completionPct: pct,
    completionLabel,
    hasAlert,
    alertLabel,
  }
}

export function buildCurriculumVisualMap(
  levelInputs: VisualMapLevelInput[],
  selectedLevelId: string | null = null,
): CurriculumVisualMap {
  const stageMap = new Map<CurriculumStage, VisualMapLevelCard[]>()
  for (const stage of CURRICULUM_STAGES) {
    stageMap.set(stage, [])
  }
  for (const input of levelInputs) {
    const card = buildLevelCard(input)
    const existing = stageMap.get(input.stage) ?? []
    existing.push(card)
    stageMap.set(input.stage, existing)
  }

  const stages: VisualMapStageGroup[] = Array.from(stageMap.keys()).map((stage: CurriculumStage) => {
    const levels = stageMap.get(stage) ?? []
    const totalPlayers = levels.reduce((sum, l) => sum + l.playerCount, 0)
    return { stage, colors: STAGE_COLORS[stage], levels, totalPlayers }
  })

  const totalLevels = levelInputs.length
  const totalPlayers = levelInputs.reduce((sum, l) => sum + l.playerCount, 0)

  return { stages, totalLevels, totalPlayers, selectedLevelId }
}

export function getVisualMapLevelById(
  map: CurriculumVisualMap,
  levelId: string,
): VisualMapLevelCard | null {
  for (const stage of map.stages) {
    const found = stage.levels.find(l => l.levelId === levelId)
    if (found) return found
  }
  return null
}

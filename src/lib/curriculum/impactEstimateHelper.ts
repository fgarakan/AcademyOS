import type { ImpactEstimate } from '@/components/curriculum/builder/CurriculumImpactPreviewPanel'
import type { CurriculumLevel, CurriculumGate, CurriculumDrill } from '@/lib/backend/curriculumExplorer'

export interface ImpactEstimateInput {
  changeType: ImpactEstimate['changeType']
  level: CurriculumLevel
  allLevels: CurriculumLevel[]
  gates?: CurriculumGate[]
  drills?: CurriculumDrill[]
}

const ROLLOUT_WEEKS: Record<ImpactEstimate['changeType'], number> = {
  add_drill:     1,
  add_gate:      2,
  add_fitness:   1,
  modify_gate:   2,
  remove_drill:  1,
  add_mission:   1,
  rewrite_level: 3,
}

// Players-per-level is an estimate — no live roster count available read-only here.
// We use a conservative band: 6–12 per level, scaled by stage order.
function estimatePlayersAtLevel(level: CurriculumLevel): number {
  const stageOrder: Record<string, number> = {
    foundations: 1,
    development: 2,
    performance: 3,
    elite: 4,
    pro: 5,
  }
  const rank = stageOrder[level.stage ?? ''] ?? 3
  // Earlier stages tend to have more players
  return Math.max(4, 14 - rank * 2)
}

export function buildImpactEstimate(input: ImpactEstimateInput): ImpactEstimate {
  const { changeType, level, allLevels } = input
  const playersAtLevel = estimatePlayersAtLevel(level)

  let playersAffected = playersAtLevel
  let levelsAffected = 1

  switch (changeType) {
    case 'add_drill':
    case 'add_fitness':
    case 'add_mission':
      // Affects only the target level
      break

    case 'add_gate':
    case 'modify_gate':
      // Gate affects players at this level who haven't advanced yet — include next level players approaching
      playersAffected = Math.round(playersAtLevel * 1.2)
      break

    case 'remove_drill':
      // Only current level
      break

    case 'rewrite_level': {
      // Level intent rewrite affects current level; surface the adjacent level too for context
      const idx = allLevels.findIndex(l => l.id === level.id)
      const hasNext = idx >= 0 && idx < allLevels.length - 1
      levelsAffected = hasNext ? 2 : 1
      playersAffected = Math.round(playersAtLevel * levelsAffected)
      break
    }
  }

  return {
    playersAffected,
    levelsAffected,
    estimatedRolloutWeeks: ROLLOUT_WEEKS[changeType],
    changeType,
  }
}

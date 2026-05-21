// Sprint 525 — Player-Curriculum Intersection Model
// Computes where each player sits in the curriculum, what they've completed,
// and what signals the curriculum generates from player data.
// Parent/player visibility strictly enforced — uses isParentVisible/isPlayerVisible flags.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { RequirementStatus } from './requirementProgressAggregator'

export interface PlayerCurriculumPosition {
  playerId: string
  playerName: string
  currentLevelId: string
  currentLevelName: string
  currentStage: CurriculumStage
  gatesMet: number
  gatesTotal: number
  completionPct: number
  isReadyToAdvance: boolean
  isStalled: boolean
  stalledWeeks: number | null
  lastProgressAt: string | null
}

export interface CurriculumIntersectionSignal {
  signalId: string
  playerId: string
  levelId: string
  type: 'ready_to_advance' | 'stalled' | 'gate_met' | 'gate_missed' | 'assessment_due'
  severity: 'info' | 'warning' | 'critical'
  message: string
  isCoachVisible: boolean
  isDirectorVisible: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  createdAt: string
}

export interface PlayerCurriculumIntersectionView {
  position: PlayerCurriculumPosition
  signals: CurriculumIntersectionSignal[]
  parentSafeSignals: CurriculumIntersectionSignal[]
  playerSafeSignals: CurriculumIntersectionSignal[]
  nextLevelPreview: {
    levelId: string
    levelName: string
    stage: CurriculumStage
    isUnlocked: boolean
  } | null
}

export interface RequirementStatusSnapshot {
  requirementId: string
  curriculumLevelId: string
  status: RequirementStatus
  isParentVisible: boolean
  isPlayerVisible: boolean
}

export function buildPlayerCurriculumIntersectionView(
  position: PlayerCurriculumPosition,
  requirementSnapshots: RequirementStatusSnapshot[],
  nextLevel: { levelId: string; levelName: string; stage: CurriculumStage } | null,
): PlayerCurriculumIntersectionView {
  const signals: CurriculumIntersectionSignal[] = []
  const ts = new Date().toISOString()

  if (position.isReadyToAdvance) {
    signals.push({
      signalId: `sig_ready_${position.playerId}`,
      playerId: position.playerId,
      levelId: position.currentLevelId,
      type: 'ready_to_advance',
      severity: 'info',
      message: `${position.playerName} has met all gates at ${position.currentLevelName}.`,
      isCoachVisible: true,
      isDirectorVisible: true,
      isParentVisible: true,
      isPlayerVisible: true,
      createdAt: ts,
    })
  }

  if (position.isStalled && position.stalledWeeks !== null && position.stalledWeeks >= 4) {
    const severity = position.stalledWeeks >= 8 ? 'critical' : 'warning'
    signals.push({
      signalId: `sig_stalled_${position.playerId}`,
      playerId: position.playerId,
      levelId: position.currentLevelId,
      type: 'stalled',
      severity,
      message: `${position.playerName} has had no gate progress for ${position.stalledWeeks} weeks.`,
      isCoachVisible: true,
      isDirectorVisible: true,
      isParentVisible: false,
      isPlayerVisible: false,
      createdAt: ts,
    })
  }

  const parentSafeSignals = signals.filter(s => s.isParentVisible)
  const playerSafeSignals = signals.filter(s => s.isPlayerVisible)

  const nextLevelPreview = nextLevel !== null
    ? {
        levelId: nextLevel.levelId,
        levelName: nextLevel.levelName,
        stage: nextLevel.stage,
        isUnlocked: position.isReadyToAdvance,
      }
    : null

  return { position, signals, parentSafeSignals, playerSafeSignals, nextLevelPreview }
}

export function aggregateCurriculumIntersectionSignals(
  views: PlayerCurriculumIntersectionView[],
): CurriculumIntersectionSignal[] {
  return views.flatMap(v => v.signals).sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
}

export function getSignalsByLevel(
  signals: CurriculumIntersectionSignal[],
  levelId: string,
): CurriculumIntersectionSignal[] {
  return signals.filter(s => s.levelId === levelId)
}

export function getDirectorVisibleSignals(
  signals: CurriculumIntersectionSignal[],
): CurriculumIntersectionSignal[] {
  return signals.filter(s => s.isDirectorVisible)
}

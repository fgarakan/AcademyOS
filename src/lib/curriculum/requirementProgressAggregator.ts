// Sprint 523 — Requirement Progress Aggregator
// Aggregates player_requirement_progress data at the curriculum level.
// Produces level-wide gate/requirement completion statistics.
// Uses correct RequirementProgressRecord field names (status, curriculumLevelId, no domain).
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type RequirementStatus = 'met' | 'waived' | 'in_progress' | 'not_started'

export interface RequirementProgressRecord {
  id: string
  playerId: string
  requirementId: string
  curriculumLevelId: string
  status: RequirementStatus
  isParentVisible: boolean
  isPlayerVisible: boolean
  updatedAt: string | null
}

export interface LevelRequirementStats {
  levelId: string
  levelName: string
  stage: CurriculumStage
  totalRequirements: number
  achievedCount: number
  confirmedCount: number
  inProgressCount: number
  notStartedCount: number
  completedCount: number
  completionPct: number
  playerCount: number
  avgCompletionPct: number
}

export interface PlayerRequirementSummary {
  playerId: string
  levelId: string
  achievedCount: number
  confirmedCount: number
  inProgressCount: number
  notStartedCount: number
  completedCount: number
  totalCount: number
  completionPct: number
}

export function aggregateLevelRequirementStats(
  records: RequirementProgressRecord[],
  levelId: string,
  levelName: string,
  stage: CurriculumStage,
): LevelRequirementStats {
  const levelRecords = records.filter(r => r.curriculumLevelId === levelId)

  const achievedCount = levelRecords.filter(r => r.status === 'met').length
  const confirmedCount = levelRecords.filter(r => r.status === 'waived').length
  const inProgressCount = levelRecords.filter(r => r.status === 'in_progress').length
  const notStartedCount = levelRecords.filter(r => r.status === 'not_started').length
  const completedCount = achievedCount + confirmedCount
  const totalRequirements = levelRecords.length
  const completionPct = totalRequirements > 0
    ? Math.round((completedCount / totalRequirements) * 100)
    : 0

  const playerIds = Array.from(new Set(levelRecords.map(r => r.playerId)))
  const playerCount = playerIds.length

  let totalPlayerPct = 0
  for (const pid of playerIds) {
    const playerRecords = levelRecords.filter(r => r.playerId === pid)
    const playerCompleted = playerRecords.filter(r => r.status === 'met' || r.status === 'waived').length
    totalPlayerPct += playerRecords.length > 0
      ? (playerCompleted / playerRecords.length) * 100
      : 0
  }
  const avgCompletionPct = playerCount > 0
    ? Math.round(totalPlayerPct / playerCount)
    : 0

  return {
    levelId,
    levelName,
    stage,
    totalRequirements,
    achievedCount,
    confirmedCount,
    inProgressCount,
    notStartedCount,
    completedCount,
    completionPct,
    playerCount,
    avgCompletionPct,
  }
}

export function buildPlayerRequirementSummary(
  records: RequirementProgressRecord[],
  playerId: string,
  levelId: string,
): PlayerRequirementSummary {
  const playerLevelRecords = records.filter(
    r => r.playerId === playerId && r.curriculumLevelId === levelId,
  )

  const achievedCount = playerLevelRecords.filter(r => r.status === 'met').length
  const confirmedCount = playerLevelRecords.filter(r => r.status === 'waived').length
  const inProgressCount = playerLevelRecords.filter(r => r.status === 'in_progress').length
  const notStartedCount = playerLevelRecords.filter(r => r.status === 'not_started').length
  const completedCount = achievedCount + confirmedCount
  const totalCount = playerLevelRecords.length
  const completionPct = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0

  return {
    playerId,
    levelId,
    achievedCount,
    confirmedCount,
    inProgressCount,
    notStartedCount,
    completedCount,
    totalCount,
    completionPct,
  }
}

export function getParentSafeRequirementRecords(
  records: RequirementProgressRecord[],
): RequirementProgressRecord[] {
  return records.filter(r => r.isParentVisible)
}

export function getPlayerVisibleRequirementRecords(
  records: RequirementProgressRecord[],
): RequirementProgressRecord[] {
  return records.filter(r => r.isPlayerVisible)
}

export function getCompletedRequirements(
  records: RequirementProgressRecord[],
): RequirementProgressRecord[] {
  return records.filter(r => r.status === 'met' || r.status === 'waived')
}

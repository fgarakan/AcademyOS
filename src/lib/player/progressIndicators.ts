// Sprint 489 — Player Progress Indicators V1
// Pure TypeScript computation of player-facing progress metrics.
// Operates on pre-fetched ProgressStatusSummary and RequirementProgressRecord data.
// No DB calls. Used by playerPortalExperience.ts and player UI pages.
//
// ProgressStatusSummary fields: total, notStarted, inProgress, achieved, confirmed
// RequirementProgressRecord fields: id, status, curriculumLevelId, isPlayerVisible, etc.

import type { RequirementProgressRecord, ProgressStatusSummary } from './evidenceQueries'

export interface LevelProgressBand {
  curriculumLevelId: string
  completedCount: number
  inProgressCount: number
  totalCount: number
  completionPct: number
  statusLabel: 'complete' | 'on_track' | 'needs_work' | 'not_started'
}

export interface MilestoneDetection {
  type: 'first_completion' | 'halfway' | 'near_complete' | 'all_complete'
  label: string
}

export interface PlayerProgressIndicators {
  overallCompletionPct: number
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  totalCount: number
  levelBands: LevelProgressBand[]
  milestones: MilestoneDetection[]
  progressLabel: string
  motivationLine: string
}

function completedFromSummary(summary: ProgressStatusSummary): number {
  return summary.achieved + summary.confirmed
}

export function computeOverallCompletionPct(summary: ProgressStatusSummary): number {
  if (summary.total === 0) return 0
  return Math.round((completedFromSummary(summary) / summary.total) * 100)
}

function bandStatusLabel(completionPct: number, inProgress: number): LevelProgressBand['statusLabel'] {
  if (completionPct >= 100) return 'complete'
  if (completionPct >= 60) return 'on_track'
  if (completionPct > 0 || inProgress > 0) return 'needs_work'
  return 'not_started'
}

export function computeLevelProgressBands(
  progress: RequirementProgressRecord[],
): LevelProgressBand[] {
  const levelMap = new Map<string, { completed: number; inProgress: number; total: number }>()

  for (const record of progress) {
    const levelId = record.curriculumLevelId
    const existing = levelMap.get(levelId) ?? { completed: 0, inProgress: 0, total: 0 }
    existing.total += 1
    if (record.status === 'achieved' || record.status === 'confirmed') {
      existing.completed += 1
    } else if (record.status === 'in_progress') {
      existing.inProgress += 1
    }
    levelMap.set(levelId, existing)
  }

  return Array.from(levelMap.keys()).map((levelId: string) => {
    const counts = levelMap.get(levelId) ?? { completed: 0, inProgress: 0, total: 0 }
    const completionPct = counts.total > 0
      ? Math.round((counts.completed / counts.total) * 100)
      : 0
    return {
      curriculumLevelId: levelId,
      completedCount: counts.completed,
      inProgressCount: counts.inProgress,
      totalCount: counts.total,
      completionPct,
      statusLabel: bandStatusLabel(completionPct, counts.inProgress),
    }
  }).sort((a, b) => b.completionPct - a.completionPct)
}

export function detectMilestones(
  summary: ProgressStatusSummary,
  previousCompletionPct: number,
): MilestoneDetection[] {
  const milestones: MilestoneDetection[] = []
  const completed = completedFromSummary(summary)
  const total = summary.total
  const currentPct = total > 0 ? (completed / total) * 100 : 0

  if (completed === total && total > 0) {
    milestones.push({ type: 'all_complete', label: 'All requirements complete!' })
  } else if (currentPct >= 80 && previousCompletionPct < 80) {
    milestones.push({ type: 'near_complete', label: 'Almost there — nearly done!' })
  } else if (currentPct >= 50 && previousCompletionPct < 50) {
    milestones.push({ type: 'halfway', label: 'Halfway there!' })
  }

  if (completed === 1 && previousCompletionPct === 0) {
    milestones.push({ type: 'first_completion', label: 'First requirement complete!' })
  }

  return milestones.slice(0, 2)
}

function buildMotivationLine(completionPct: number, inProgress: number): string {
  if (completionPct >= 100) return 'All done — great work this level!'
  if (completionPct >= 75) return 'Almost there — keep it up!'
  if (completionPct >= 50) return 'Halfway through — solid progress!'
  if (inProgress > 0) return `Working on ${inProgress.toString()} requirement${inProgress > 1 ? 's' : ''} — keep going!`
  return 'Getting started — every session counts!'
}

function buildProgressLabel(completedCount: number, totalCount: number, completionPct: number): string {
  if (totalCount === 0) return 'No requirements yet'
  if (completedCount === totalCount) return 'All requirements complete'
  return `${completedCount.toString()} of ${totalCount.toString()} requirements complete (${completionPct.toString()}%)`
}

export function buildPlayerProgressIndicators(
  summary: ProgressStatusSummary,
  progress: RequirementProgressRecord[],
  previousCompletionPct = 0,
): PlayerProgressIndicators {
  const completionPct = computeOverallCompletionPct(summary)
  const completed = completedFromSummary(summary)
  const levelBands = computeLevelProgressBands(progress)
  const milestones = detectMilestones(summary, previousCompletionPct)

  return {
    overallCompletionPct: completionPct,
    completedCount: completed,
    inProgressCount: summary.inProgress,
    notStartedCount: summary.notStarted,
    totalCount: summary.total,
    levelBands,
    milestones,
    progressLabel: buildProgressLabel(completed, summary.total, completionPct),
    motivationLine: buildMotivationLine(completionPct, summary.inProgress),
  }
}

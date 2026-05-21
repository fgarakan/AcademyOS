// Sprint 493 — Badge Eligibility Engine V1
// Evaluates player progress data against badge criteria.
// Pure TypeScript — no DB calls. Operates on pre-fetched progress data.
// Returns BadgeAward[] with earned/in_progress/locked status per badge.

import {
  BADGE_DEFINITIONS,
  type BadgeId,
  type BadgeAward,
  type BadgeStatus,
} from './badgeModel'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'
import type { PlayerProgressIndicators } from '@/lib/player/progressIndicators'

export interface BadgeEligibilityInput {
  playerId: string
  progressSummary: ProgressStatusSummary
  progressIndicators: PlayerProgressIndicators
  promotionReady: boolean | null
  attendanceStreak: number
  domainCompletedIds: string[]
  levelCompleted: boolean
}

export interface BadgeEligibilityReport {
  playerId: string
  awards: BadgeAward[]
  earnedCount: number
  inProgressCount: number
  lockedCount: number
  earnedBadgeIds: BadgeId[]
  generatedAt: string
}

function computeCompletedFromSummary(summary: ProgressStatusSummary): number {
  return summary.achieved + summary.confirmed
}

function evaluateBadgeStatus(
  id: BadgeId,
  input: BadgeEligibilityInput,
): { status: BadgeStatus; progress: number; progressMax: number; progressLabel: string } {
  const completed = computeCompletedFromSummary(input.progressSummary)
  const pct = input.progressIndicators.overallCompletionPct

  switch (id) {
    case 'first_step': {
      const earned = completed >= 1
      return {
        status: earned ? 'earned' : 'in_progress',
        progress: Math.min(completed, 1),
        progressMax: 1,
        progressLabel: `${Math.min(completed, 1).toString()} of 1 requirement`,
      }
    }
    case 'consistent_player': {
      const earned = completed >= 5
      return {
        status: earned ? 'earned' : completed > 0 ? 'in_progress' : 'locked',
        progress: Math.min(completed, 5),
        progressMax: 5,
        progressLabel: `${Math.min(completed, 5).toString()} of 5 requirements`,
      }
    }
    case 'level_complete': {
      return {
        status: input.levelCompleted ? 'earned' : pct > 0 ? 'in_progress' : 'locked',
        progress: pct,
        progressMax: 100,
        progressLabel: `${pct.toString()}% complete`,
      }
    }
    case 'domain_champion': {
      const earned = input.domainCompletedIds.length > 0
      return {
        status: earned ? 'earned' : pct > 0 ? 'in_progress' : 'locked',
        progress: input.domainCompletedIds.length,
        progressMax: 1,
        progressLabel: `${input.domainCompletedIds.length.toString()} domain${input.domainCompletedIds.length > 1 ? 's' : ''} complete`,
      }
    }
    case 'attendance_streak': {
      const earned = input.attendanceStreak >= 10
      return {
        status: earned ? 'earned' : input.attendanceStreak > 0 ? 'in_progress' : 'locked',
        progress: Math.min(input.attendanceStreak, 10),
        progressMax: 10,
        progressLabel: `${Math.min(input.attendanceStreak, 10).toString()} of 10 sessions`,
      }
    }
    case 'assessment_ready': {
      const earned = pct >= 80 && input.promotionReady === true
      return {
        status: earned ? 'earned' : pct >= 60 ? 'in_progress' : 'locked',
        progress: pct,
        progressMax: 80,
        progressLabel: `${pct.toString()}% complete`,
      }
    }
    case 'wrap_up_champion': {
      // Coach badge — always locked from player perspective (director/head_coach evaluation)
      return { status: 'locked', progress: 0, progressMax: 1, progressLabel: 'Coach achievement' }
    }
    case 'mental_edge': {
      const earned = input.domainCompletedIds.includes('mental')
      return {
        status: earned ? 'earned' : 'locked',
        progress: earned ? 1 : 0,
        progressMax: 1,
        progressLabel: earned ? 'Mental domain complete' : 'Complete all mental requirements',
      }
    }
    case 'curriculum_explorer': {
      const bands = input.progressIndicators.levelBands
      const domainsWithProgress = bands.filter(b => b.completedCount > 0).length
      const earned = domainsWithProgress >= 3
      return {
        status: earned ? 'earned' : domainsWithProgress > 0 ? 'in_progress' : 'locked',
        progress: Math.min(domainsWithProgress, 3),
        progressMax: 3,
        progressLabel: `${Math.min(domainsWithProgress, 3).toString()} of 3 domains`,
      }
    }
    case 'promotion_ready': {
      const earned = pct >= 100
      return {
        status: earned ? 'earned' : pct >= 80 ? 'in_progress' : 'locked',
        progress: pct,
        progressMax: 100,
        progressLabel: `${pct.toString()}% complete`,
      }
    }
    default: {
      return { status: 'locked', progress: 0, progressMax: 1, progressLabel: 'Not started' }
    }
  }
}

export function buildBadgeEligibilityReport(input: BadgeEligibilityInput): BadgeEligibilityReport {
  const badgeIds = Object.keys(BADGE_DEFINITIONS) as BadgeId[]

  const awards: BadgeAward[] = badgeIds.map(id => {
    const result = evaluateBadgeStatus(id, input)
    return {
      badgeId: id,
      playerId: input.playerId,
      status: result.status,
      earnedAt: result.status === 'earned' ? new Date().toISOString() : null,
      progress: result.progress,
      progressMax: result.progressMax,
      progressLabel: result.progressLabel,
    }
  })

  const earnedBadgeIds = awards.filter(a => a.status === 'earned').map(a => a.badgeId)

  return {
    playerId: input.playerId,
    awards,
    earnedCount: earnedBadgeIds.length,
    inProgressCount: awards.filter(a => a.status === 'in_progress').length,
    lockedCount: awards.filter(a => a.status === 'locked').length,
    earnedBadgeIds,
    generatedAt: new Date().toISOString(),
  }
}

export function getEarnedBadges(report: BadgeEligibilityReport): BadgeAward[] {
  return report.awards.filter(a => a.status === 'earned')
}

export function getNextBadgeToEarn(report: BadgeEligibilityReport): BadgeAward | null {
  const inProgress = report.awards
    .filter(a => a.status === 'in_progress')
    .sort((a, b) => (b.progress / b.progressMax) - (a.progress / a.progressMax))
  return inProgress[0] ?? null
}

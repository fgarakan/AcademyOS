// Sprint 496 — Mission Eligibility Engine V1
// Determines player mission eligibility and progress from pre-fetched data.
// Pure TypeScript — no DB calls. Returns MissionProgress[] for the player portal.
// Missions are recommended based on player state — director/coach can override.

import {
  MISSION_DEFINITIONS,
  type MissionId,
  type MissionProgress,
  type MissionStatus,
} from './missionModel'
import type { ProgressStatusSummary } from './evidenceQueries'
import type { PlayerProgressIndicators } from './progressIndicators'

export interface MissionEngineInput {
  playerId: string
  progressSummary: ProgressStatusSummary
  progressIndicators: PlayerProgressIndicators
  attendanceStreak: number
  observationCount: number
  nextAssessmentDue: string | null
  promotionReady: boolean | null
}

export interface MissionRecommendation {
  mission: MissionProgress
  reason: string
  isPrimary: boolean
}

export interface MissionEngineReport {
  playerId: string
  allMissions: MissionProgress[]
  activeMissions: MissionProgress[]
  completedMissions: MissionProgress[]
  recommendedMissions: MissionRecommendation[]
  primaryMission: MissionProgress | null
  generatedAt: string
}

function computeCompletedCount(summary: ProgressStatusSummary): number {
  return summary.achieved + summary.confirmed
}

function evaluateMissionProgress(
  id: MissionId,
  input: MissionEngineInput,
): { status: MissionStatus; current: number; target: number } {
  const completed = computeCompletedCount(input.progressSummary)
  const pct = input.progressIndicators.overallCompletionPct

  switch (id) {
    case 'complete_first_requirement':
      return { status: completed >= 1 ? 'completed' : 'in_progress', current: Math.min(completed, 1), target: 1 }
    case 'attend_5_sessions':
      return {
        status: input.attendanceStreak >= 5 ? 'completed' : input.attendanceStreak > 0 ? 'in_progress' : 'not_started',
        current: Math.min(input.attendanceStreak, 5),
        target: 5,
      }
    case 'get_coach_observation':
      return {
        status: input.observationCount >= 1 ? 'completed' : 'not_started',
        current: Math.min(input.observationCount, 1),
        target: 1,
      }
    case 'improve_forehand':
      return {
        status: completed >= 1 ? 'in_progress' : 'not_started',
        current: Math.min(completed, 1),
        target: 1,
      }
    case 'complete_level_50pct':
      return {
        status: pct >= 50 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started',
        current: pct,
        target: 50,
      }
    case 'earn_assessment_badge':
      return {
        status: pct >= 80 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started',
        current: pct,
        target: 80,
      }
    case 'mental_focus_week':
      return { status: 'not_started', current: 0, target: 5 }
    case 'breathe_and_reset':
      return { status: 'not_started', current: 0, target: 3 }
    case 'positive_self_talk':
      return { status: 'not_started', current: 0, target: 3 }
    case 'perfect_attendance_week':
      return { status: 'not_started', current: 0, target: 1 }
    case 'get_assessment_scheduled':
      return {
        status: input.nextAssessmentDue ? 'completed' : 'not_started',
        current: input.nextAssessmentDue ? 1 : 0,
        target: 1,
      }
    case 'complete_curriculum_level':
      return {
        status: pct >= 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started',
        current: pct,
        target: 100,
      }
    default:
      return { status: 'not_started', current: 0, target: 1 }
  }
}

function buildMissionProgress(id: MissionId, input: MissionEngineInput): MissionProgress {
  const now = new Date().toISOString()
  const result = evaluateMissionProgress(id, input)
  const progressPct = result.target > 0 ? Math.round((result.current / result.target) * 100) : 0

  return {
    missionId: id,
    playerId: input.playerId,
    status: result.status,
    currentValue: result.current,
    targetValue: result.target,
    progressPct,
    assignedAt: now,
    completedAt: result.status === 'completed' ? now : null,
    expiresAt: null,
    celebrationShown: false,
  }
}

function buildRecommendations(
  missions: MissionProgress[],
  input: MissionEngineInput,
): MissionRecommendation[] {
  const completed = computeCompletedCount(input.progressSummary)
  const pct = input.progressIndicators.overallCompletionPct

  const recommendations: MissionRecommendation[] = []

  const inProgress = missions.filter(m => m.status === 'in_progress')
  for (const m of inProgress.slice(0, 2)) {
    recommendations.push({
      mission: m,
      reason: `Already making progress — ${m.progressPct.toString()}% done`,
      isPrimary: recommendations.length === 0,
    })
  }

  if (completed === 0) {
    const firstStep = missions.find(m => m.missionId === 'complete_first_requirement')
    if (firstStep && !recommendations.find(r => r.mission.missionId === 'complete_first_requirement')) {
      recommendations.push({ mission: firstStep, reason: 'A great first goal', isPrimary: recommendations.length === 0 })
    }
  }

  if (pct >= 40 && pct < 80) {
    const halfway = missions.find(m => m.missionId === 'complete_level_50pct')
    if (halfway && halfway.status !== 'completed' && !recommendations.find(r => r.mission.missionId === 'complete_level_50pct')) {
      recommendations.push({ mission: halfway, reason: 'You\'re close to halfway', isPrimary: false })
    }
  }

  return recommendations.slice(0, 3)
}

export function buildMissionEngineReport(input: MissionEngineInput): MissionEngineReport {
  const missionIds = Object.keys(MISSION_DEFINITIONS) as MissionId[]
  const allMissions = missionIds.map(id => buildMissionProgress(id, input))

  const activeMissions = allMissions.filter(
    m => m.status === 'in_progress' || m.status === 'not_started',
  )
  const completedMissions = allMissions.filter(m => m.status === 'completed')
  const recommendations = buildRecommendations(allMissions, input)
  const primaryMission = recommendations.find(r => r.isPrimary)?.mission ?? null

  return {
    playerId: input.playerId,
    allMissions,
    activeMissions,
    completedMissions,
    recommendedMissions: recommendations,
    primaryMission,
    generatedAt: new Date().toISOString(),
  }
}

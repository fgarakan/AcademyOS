// Sprint 486 — Parent Portal Summary Builder V1
// Assembles the full parent portal view model from pre-fetched ParentPortalProfile.
// Pure TypeScript — no DB calls. Takes data already visibility-gated by parentPortalQueries.ts.
// Produces a parent-safe ViewModel for the /parent route.
// Never surfaces coach notes, internal signals, or raw assessments.

import type { ParentPortalProfile, ParentPortalPlayerCard } from './parentPortalQueries'
import type { PlayerPriorityRecord } from '../player/developmentProfileQueries'

export type ParentEngagementLevel = 'active' | 'moderate' | 'low' | 'unknown'

export interface ParentPortalHighlight {
  id: string
  icon: 'progress' | 'session' | 'coach' | 'focus'
  label: string
  value: string
  isPositive: boolean
}

export interface ParentSupportPrompt {
  id: string
  prompt: string
  category: 'encouragement' | 'practice' | 'communication' | 'milestone'
}

export interface ParentPortalSummaryViewModel {
  playerCard: ParentPortalPlayerCard
  developerSummaryText: string | null
  strengths: string[]
  currentFocus: string | null
  topPriorities: PlayerPriorityRecord[]
  highlights: ParentPortalHighlight[]
  progressLabel: string
  supportPrompts: ParentSupportPrompt[]
  engagementLevel: ParentEngagementLevel
  generatedAt: string
}

function buildHighlights(profile: ParentPortalProfile): ParentPortalHighlight[] {
  const highlights: ParentPortalHighlight[] = []

  const { progressSummary, playerCard } = profile
  const completedCount = progressSummary.achieved + progressSummary.confirmed

  if (completedCount > 0) {
    highlights.push({
      id: 'completed',
      icon: 'progress',
      label: 'Requirements completed',
      value: completedCount.toString(),
      isPositive: true,
    })
  }

  if (progressSummary.inProgress > 0) {
    highlights.push({
      id: 'in_progress',
      icon: 'focus',
      label: 'Currently working on',
      value: progressSummary.inProgress.toString(),
      isPositive: true,
    })
  }

  if (playerCard.nextAssessmentDue) {
    const daysUntil = Math.ceil(
      (new Date(playerCard.nextAssessmentDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (daysUntil >= 0 && daysUntil <= 30) {
      highlights.push({
        id: 'assessment',
        icon: 'coach',
        label: 'Next assessment',
        value: daysUntil === 0 ? 'Today' : `In ${daysUntil.toString()} day${daysUntil > 1 ? 's' : ''}`,
        isPositive: true,
      })
    }
  }

  if (playerCard.levelLabel) {
    highlights.push({
      id: 'level',
      icon: 'progress',
      label: 'Current level',
      value: playerCard.levelLabel,
      isPositive: true,
    })
  }

  return highlights
}

function buildSupportPrompts(profile: ParentPortalProfile): ParentSupportPrompt[] {
  const prompts: ParentSupportPrompt[] = []
  const { developmentContent, topPriorities } = profile

  if (topPriorities.length > 0 && topPriorities[0]) {
    prompts.push({
      id: 'top_priority',
      category: 'encouragement',
      prompt: `Ask your child how they felt about working on their current focus area this week.`,
    })
  }

  if (developmentContent?.strengths && developmentContent.strengths.length > 0) {
    prompts.push({
      id: 'praise_strength',
      category: 'encouragement',
      prompt: `Praise specific effort — not just results. Notice preparation and attitude on court.`,
    })
  }

  prompts.push({
    id: 'after_practice',
    category: 'practice',
    prompt: `After practice, ask "What felt good today?" rather than "Did you win?"`,
  })

  prompts.push({
    id: 'coach_communication',
    category: 'communication',
    prompt: `If you have questions about development, share them with the coach — they appreciate it.`,
  })

  const completedMilestone = profile.progressSummary.achieved + profile.progressSummary.confirmed
  if (completedMilestone > 0) {
    prompts.push({
      id: 'milestone',
      category: 'milestone',
      prompt: `Your child has completed ${completedMilestone.toString()} requirement${completedMilestone > 1 ? 's' : ''}. Take a moment to celebrate that progress.`,
    })
  }

  return prompts.slice(0, 4)
}

function buildProgressLabel(profile: ParentPortalProfile): string {
  const { inProgress, achieved, confirmed, total } = profile.progressSummary
  const completedCount = achieved + confirmed
  if (total === 0) return 'Progress data not yet available'
  if (completedCount === total) return 'All current requirements complete'
  if (completedCount > 0) {
    return `${completedCount.toString()} of ${total.toString()} requirements complete`
  }
  return `${inProgress.toString()} requirement${inProgress > 1 ? 's' : ''} in progress`
}

function inferEngagementLevel(profile: ParentPortalProfile): ParentEngagementLevel {
  if (!profile.hasDevelopmentSummary) return 'unknown'
  const completedCount = profile.progressSummary.achieved + profile.progressSummary.confirmed
  const inProgressCount = profile.progressSummary.inProgress
  if (completedCount > 2 || inProgressCount > 2) return 'active'
  if (completedCount > 0 || inProgressCount > 0) return 'moderate'
  return 'low'
}

export function buildParentPortalSummary(profile: ParentPortalProfile): ParentPortalSummaryViewModel {
  const devContent = profile.developmentContent

  return {
    playerCard: profile.playerCard,
    developerSummaryText: devContent?.text ?? null,
    strengths: devContent?.strengths ?? [],
    currentFocus: devContent?.focus ?? null,
    topPriorities: profile.topPriorities,
    highlights: buildHighlights(profile),
    progressLabel: buildProgressLabel(profile),
    supportPrompts: buildSupportPrompts(profile),
    engagementLevel: inferEngagementLevel(profile),
    generatedAt: new Date().toISOString(),
  }
}

export function getParentEngagementLabel(level: ParentEngagementLevel): string {
  const labels: Record<ParentEngagementLevel, string> = {
    active: 'Active progress',
    moderate: 'Good progress',
    low: 'Getting started',
    unknown: 'Progress pending',
  }
  return labels[level]
}

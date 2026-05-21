// Sprint 488 — Player Portal Experience Builder V1
// Assembles the full player-facing experience from pre-fetched PlayerPortalProfile.
// Pure TypeScript — no DB calls. Takes data already visibility-gated by playerPortalQueries.ts.
// Produces a player-safe ViewModel for the /player route.
// Never surfaces internal coach notes or signals not marked show_to_student=true.

import type { PlayerPortalProfile, PlayerPortalSummary } from './playerPortalQueries'
import type { PlayerPriorityRecord } from './developmentProfileQueries'
import {
  buildPlayerProgressIndicators,
  type PlayerProgressIndicators,
} from './progressIndicators'

export type PlayerExperienceTab = 'home' | 'progress' | 'focus' | 'challenges' | 'qa'

export interface PlayerHomeCard {
  id: string
  cardType: 'progress' | 'focus' | 'challenge' | 'encouragement' | 'session'
  title: string
  body: string
  href: string | null
  badge: string | null
}

export interface PlayerChallenge {
  id: string
  title: string
  description: string
  domain: string | null
  isComplete: boolean
  progressHint: string | null
}

export interface PlayerPortalExperienceViewModel {
  summary: PlayerPortalSummary
  developerSummaryText: string | null
  strengths: string[]
  workOn: string[]
  topPriorities: PlayerPriorityRecord[]
  progressIndicators: PlayerProgressIndicators
  homeCards: PlayerHomeCard[]
  challenges: PlayerChallenge[]
  welcomeMessage: string
  motivationLine: string
  generatedAt: string
}

function buildWelcomeMessage(summary: PlayerPortalSummary): string {
  const name = summary.fullName?.split(' ')[0] ?? 'Player'
  const level = summary.levelLabel ? ` — ${summary.levelLabel}` : ''
  return `Welcome back, ${name}${level}`
}

function buildHomeCards(
  profile: PlayerPortalProfile,
  indicators: PlayerProgressIndicators,
): PlayerHomeCard[] {
  const cards: PlayerHomeCard[] = []

  // Progress card
  cards.push({
    id: 'progress_overview',
    cardType: 'progress',
    title: 'Your progress',
    body: indicators.progressLabel,
    href: null,
    badge: indicators.completedCount > 0 ? `${indicators.completedCount.toString()} done` : null,
  })

  // Top priority card
  if (profile.topPriorities.length > 0 && profile.topPriorities[0]) {
    const priority = profile.topPriorities[0]
    cards.push({
      id: `priority_${priority.id}`,
      cardType: 'focus',
      title: 'Your focus this week',
      body: priority.title ?? 'Keep working on your current goals',
      href: null,
      badge: null,
    })
  }

  // Development content card
  if (profile.developmentContent?.workOn && profile.developmentContent.workOn.length > 0) {
    cards.push({
      id: 'work_on',
      cardType: 'challenge',
      title: 'Keep working on',
      body: profile.developmentContent.workOn[0] ?? 'Check with your coach',
      href: null,
      badge: null,
    })
  }

  // Encouragement card
  cards.push({
    id: 'encouragement',
    cardType: 'encouragement',
    title: indicators.motivationLine,
    body: indicators.completedCount > 0
      ? `You've completed ${indicators.completedCount.toString()} requirement${indicators.completedCount > 1 ? 's' : ''} — keep it going!`
      : 'Every session builds your game. Keep showing up.',
    href: null,
    badge: null,
  })

  return cards
}

function buildChallenges(profile: PlayerPortalProfile): PlayerChallenge[] {
  return profile.topPriorities
    .slice(0, 3)
    .map((priority, index) => ({
      id: `challenge_${priority.id}`,
      title: priority.title ?? `Challenge ${(index + 1).toString()}`,
      description: priority.description ?? 'Work with your coach to complete this requirement',
      domain: priority.relevantDimension ?? null,
      isComplete: false,
      progressHint: null,
    }))
}

export function buildPlayerPortalExperience(
  profile: PlayerPortalProfile,
): PlayerPortalExperienceViewModel {
  const indicators = buildPlayerProgressIndicators(
    profile.progressSummary,
    profile.visibleProgress,
  )

  const devContent = profile.developmentContent

  return {
    summary: profile.summary,
    developerSummaryText: devContent?.text ?? null,
    strengths: devContent?.strengths ?? [],
    workOn: devContent?.workOn ?? [],
    topPriorities: profile.topPriorities,
    progressIndicators: indicators,
    homeCards: buildHomeCards(profile, indicators),
    challenges: buildChallenges(profile),
    welcomeMessage: buildWelcomeMessage(profile.summary),
    motivationLine: indicators.motivationLine,
    generatedAt: new Date().toISOString(),
  }
}

export function getPlayerLevelProgressLabel(summary: PlayerPortalSummary): string {
  if (!summary.levelLabel) return 'Level not assigned'
  const promotionStatus = summary.promotionReady
    ? ' — ready for assessment'
    : ''
  return `${summary.levelLabel}${promotionStatus}`
}

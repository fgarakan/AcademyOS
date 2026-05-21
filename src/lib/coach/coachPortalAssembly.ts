// Sprint 483 — Coach Mobile Portal Assembly V1
// Assembles the coach mobile portal view model from pre-fetched data.
// Pure TypeScript — no DB calls. Produces the ViewModel passed to coach UI pages.
// All content is coach-visible only — no parent/player-facing data included.

import type { CoachOsContext } from './coachContext'
import type { CoachKpiSummary } from './coachKpiSummary'

export type CoachPortalTab = 'home' | 'sessions' | 'recap' | 'players' | 'donna'

export interface CoachQuickAction {
  id: string
  label: string
  description: string
  href: string
  isEnabled: boolean
  disabledReason: string | null
}

export interface CoachPortalHomeCard {
  id: string
  cardType: 'session_today' | 'pending_wrapup' | 'kpi_snapshot' | 'donna_prompt'
  title: string
  body: string
  href: string | null
  badge: string | null
  isUrgent: boolean
}

export interface CoachPortalViewModel {
  coachId: string
  academyId: string
  displayName: string | null
  homeCards: CoachPortalHomeCard[]
  quickActions: CoachQuickAction[]
  kpiSummary: CoachKpiSummary | null
  hasActiveSession: boolean
  activeSessionId: string | null
  activeSessionHref: string | null
  pendingWrapUpCount: number
  donnaPrompts: string[]
  generatedAt: string
}

function buildHomeCards(
  context: CoachOsContext,
  kpiSummary: CoachKpiSummary | null,
): CoachPortalHomeCard[] {
  const cards: CoachPortalHomeCard[] = []

  if (context.activeSession) {
    cards.push({
      id: 'active_session',
      cardType: 'session_today',
      title: 'Session in progress',
      body: context.activeSession.session.name ?? 'Live session — tap to manage',
      href: `/coach/sessions/${context.activeSession.sessionId}`,
      badge: 'Live',
      isUrgent: true,
    })
  } else if (context.upcomingSessionCount > 0) {
    cards.push({
      id: 'upcoming_sessions',
      cardType: 'session_today',
      title: `${context.upcomingSessionCount.toString()} upcoming session${context.upcomingSessionCount > 1 ? 's' : ''}`,
      body: 'View your schedule',
      href: '/coach/sessions',
      badge: context.upcomingSessionCount > 0 ? context.upcomingSessionCount.toString() : null,
      isUrgent: false,
    })
  }

  if (kpiSummary && kpiSummary.pendingWrapUpCount > 0) {
    cards.push({
      id: 'pending_wrapup',
      cardType: 'pending_wrapup',
      title: `${kpiSummary.pendingWrapUpCount.toString()} wrap-up${kpiSummary.pendingWrapUpCount > 1 ? 's' : ''} pending`,
      body: 'Submit session recaps for director review',
      href: '/coach/recap',
      badge: kpiSummary.pendingWrapUpCount.toString(),
      isUrgent: kpiSummary.pendingWrapUpCount > 2,
    })
  }

  if (kpiSummary && kpiSummary.sessionsTaught > 0) {
    cards.push({
      id: 'kpi_snapshot',
      cardType: 'kpi_snapshot',
      title: 'Your coaching this month',
      body: kpiSummary.summaryLine,
      href: null,
      badge: null,
      isUrgent: false,
    })
  }

  cards.push({
    id: 'donna_prompt',
    cardType: 'donna_prompt',
    title: 'Ask DONNA',
    body: 'Get a session idea, player insight, or curriculum suggestion',
    href: '/coach/donna',
    badge: null,
    isUrgent: false,
  })

  return cards
}

function buildQuickActions(context: CoachOsContext): CoachQuickAction[] {
  return [
    {
      id: 'start_recap',
      label: 'Record session recap',
      description: 'Voice or text recap for a recent session',
      href: '/coach/recap',
      isEnabled: context.recentSessionCount > 0,
      disabledReason: context.recentSessionCount === 0 ? 'No recent sessions to recap' : null,
    },
    {
      id: 'view_players',
      label: 'View my players',
      description: 'Player list with notes and progress',
      href: '/coach/players',
      isEnabled: true,
      disabledReason: null,
    },
    {
      id: 'view_sessions',
      label: 'View sessions',
      description: 'Upcoming and recent sessions',
      href: '/coach/sessions',
      isEnabled: true,
      disabledReason: null,
    },
    {
      id: 'donna_chat',
      label: 'Chat with DONNA',
      description: 'AI assistant for coaching and curriculum',
      href: '/coach/donna',
      isEnabled: true,
      disabledReason: null,
    },
  ]
}

function buildDonnaPrompts(context: CoachOsContext, kpiSummary: CoachKpiSummary | null): string[] {
  const prompts: string[] = []

  if (kpiSummary && kpiSummary.wrapUpRatePct !== null && kpiSummary.wrapUpRatePct < 70) {
    prompts.push('Help me write a quick session recap')
  }

  if (context.upcomingSessionCount > 0) {
    prompts.push('Give me a warm-up idea for my next session')
  }

  if (kpiSummary && kpiSummary.averageAttendancePct !== null && kpiSummary.averageAttendancePct < 70) {
    prompts.push('Which players have been missing sessions?')
  }

  prompts.push('Suggest a curriculum drill for this week')
  prompts.push('What should I focus on in today\'s session?')

  return prompts.slice(0, 4)
}

export function buildCoachPortalViewModel(
  context: CoachOsContext,
  kpiSummary: CoachKpiSummary | null,
  displayName: string | null,
): CoachPortalViewModel {
  const activeSession = context.activeSession
  return {
    coachId: context.coachId,
    academyId: context.academyId,
    displayName,
    homeCards: buildHomeCards(context, kpiSummary),
    quickActions: buildQuickActions(context),
    kpiSummary,
    hasActiveSession: activeSession !== null,
    activeSessionId: activeSession?.sessionId ?? null,
    activeSessionHref: activeSession ? `/coach/sessions/${activeSession.sessionId}` : null,
    pendingWrapUpCount: kpiSummary?.pendingWrapUpCount ?? 0,
    donnaPrompts: buildDonnaPrompts(context, kpiSummary),
    generatedAt: new Date().toISOString(),
  }
}

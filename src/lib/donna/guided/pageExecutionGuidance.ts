// Mega Sprint 2681–2740 — DONNA Guided Execution OS V2
// Page Execution Guidance — page-aware "What next?" answers.
//
// Every supported director page gets a specific "what to do on this page" hint
// that supplements the general operating guidance.
//
// Supported pages: today, dashboard, players, player detail, approvals,
//   sessions, templates, curriculum, coaches, settings.
//
// Pure TypeScript — no DB, no side effects.

import type { DirectorGuidance } from '@/lib/donna/operating/directorGuidanceEngine'
import type { OperatingSignal } from '@/lib/donna/operating/operatingSignal'
import type { ExecutionState } from './nextBestAction'

// ── Page context ──────────────────────────────────────────────────────────────

export type DirectorPageContext =
  | 'today'
  | 'dashboard'
  | 'players'
  | 'player_detail'
  | 'approvals'
  | 'sessions'
  | 'templates'
  | 'curriculum'
  | 'coaches'
  | 'settings'
  | 'unknown'

export function detectPageContext(pathname: string): DirectorPageContext {
  if (pathname === '/director' || pathname === '/director/')                  return 'dashboard'
  if (pathname.startsWith('/director/today'))                                  return 'today'
  if (pathname.match(/\/director\/players\/[^/]+/))                           return 'player_detail'
  if (pathname.startsWith('/director/players'))                               return 'players'
  if (pathname.startsWith('/director/review'))                                return 'approvals'
  if (pathname.startsWith('/director/sessions'))                              return 'sessions'
  if (pathname.startsWith('/director/curriculum/templates') ||
      pathname.startsWith('/director/curriculum/template'))                   return 'templates'
  if (pathname.startsWith('/director/curriculum'))                            return 'curriculum'
  if (pathname.startsWith('/director/coaches') ||
      pathname.startsWith('/director/staff'))                                 return 'coaches'
  if (pathname.startsWith('/director/settings') ||
      pathname.startsWith('/director/configuration'))                        return 'settings'
  return 'unknown'
}

// ── Per-page guidance ─────────────────────────────────────────────────────────

interface PageGuidanceResult {
  pageHint:       string
  actionPrefix:   string
  suggestedRoute: string | null
}

function buildDashboardGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const escalated = signals.filter(s => s.isEscalated).length
  if (escalated > 0) {
    return {
      pageHint:     `${escalated} item${escalated !== 1 ? 's have' : ' has'} escalated and need your attention now.`,
      actionPrefix: 'On the dashboard',
      suggestedRoute: guidance.navigationTarget,
    }
  }
  return {
    pageHint:     `Start with the operating feed — your top action is: ${guidance.highestLeverageAction}.`,
    actionPrefix: 'From the dashboard',
    suggestedRoute: guidance.navigationTarget,
  }
}

function buildPlayersGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const playerSignals = signals.filter(s => s.domain === 'players')
  if (playerSignals.length > 0) {
    return {
      pageHint:     `${playerSignals.length} player${playerSignals.length !== 1 ? 's need' : ' needs'} attention. Start with the highest-priority player.`,
      actionPrefix: 'On the players list',
      suggestedRoute: playerSignals[0]?.targetEntityRoute ?? guidance.navigationTarget,
    }
  }
  return {
    pageHint:     'No urgent player flags. Review advancement candidates or check assessment status.',
    actionPrefix: 'On the players list',
    suggestedRoute: null,
  }
}

function buildPlayerDetailGuidance(
  guidance:       DirectorGuidance,
  signals:        OperatingSignal[],
  executionState: ExecutionState | null,
): PageGuidanceResult {
  if (executionState?.activeActionTitle) {
    return {
      pageHint:     `You are working on: ${executionState.activeActionTitle}. ${executionState.completionCriteria ?? ''}`,
      actionPrefix: 'On this player profile',
      suggestedRoute: null,
    }
  }
  const playerSignals = signals.filter(s => s.domain === 'players')
  if (playerSignals.length > 0) {
    return {
      pageHint:     playerSignals[0].suggestedAction,
      actionPrefix: 'On this player profile',
      suggestedRoute: null,
    }
  }
  return {
    pageHint:     'Review the player\'s skill path, assessment history, and any pending recommendations.',
    actionPrefix: 'On this player profile',
    suggestedRoute: null,
  }
}

function buildApprovalsGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const recSignals = signals.filter(s => s.domain === 'recommendations')
  if (recSignals.length > 0) {
    return {
      pageHint:     `${recSignals.length} item${recSignals.length !== 1 ? 's are' : ' is'} waiting for your decision. Work through them oldest first.`,
      actionPrefix: 'On the approvals page',
      suggestedRoute: null,
    }
  }
  return {
    pageHint:     'Review queue is clear — check session recaps and placement reviews.',
    actionPrefix: 'On the approvals page',
    suggestedRoute: null,
  }
}

function buildSessionsGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const coachSignals = signals.filter(s => s.domain === 'coaches')
  if (coachSignals.length > 0) {
    return {
      pageHint:     `${coachSignals.length} session${coachSignals.length !== 1 ? 's are' : ' is'} missing recaps. Review and follow up with coaches.`,
      actionPrefix: 'On the sessions page',
      suggestedRoute: null,
    }
  }
  return {
    pageHint:     'Sessions are on track. Review completed recaps or plan upcoming sessions.',
    actionPrefix: 'On the sessions page',
    suggestedRoute: null,
  }
}

function buildTemplatesGuidance(): PageGuidanceResult {
  return {
    pageHint:     'Review session templates for accuracy and coverage. Update any templates that are missing required blocks.',
    actionPrefix: 'On the templates page',
    suggestedRoute: null,
  }
}

function buildCurriculumGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const currSignals = signals.filter(s => s.domain === 'curriculum')
  if (currSignals.length > 0) {
    return {
      pageHint:     currSignals[0].suggestedAction,
      actionPrefix: 'On the curriculum page',
      suggestedRoute: null,
    }
  }
  return {
    pageHint:     'Review level coverage and identify any gaps in content delivery across groups.',
    actionPrefix: 'On the curriculum page',
    suggestedRoute: null,
  }
}

function buildCoachesGuidance(
  guidance: DirectorGuidance,
  signals:  OperatingSignal[],
): PageGuidanceResult {
  const coachSignals = signals.filter(s => s.domain === 'coaches')
  if (coachSignals.length > 0) {
    return {
      pageHint:     coachSignals[0].suggestedAction,
      actionPrefix: 'On the coaches page',
      suggestedRoute: null,
    }
  }
  return {
    pageHint:     'Review coach execution quality and check for missed session recaps.',
    actionPrefix: 'On the coaches page',
    suggestedRoute: null,
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export interface PageExecutionGuidanceResult {
  pageContext:    DirectorPageContext
  pageHint:       string
  actionPrefix:   string
  fullGuidance:   string
  suggestedRoute: string | null
}

/**
 * Build page-aware execution guidance that supplements global operating guidance.
 *
 * @param pathname      - Current route pathname
 * @param guidance      - Global director guidance
 * @param signals       - All operating signals
 * @param executionState - Current execution state (may be null)
 */
export function buildPageExecutionGuidance(
  pathname:       string,
  guidance:       DirectorGuidance,
  signals:        OperatingSignal[],
  executionState: ExecutionState | null = null,
): PageExecutionGuidanceResult {
  const pageContext = detectPageContext(pathname)

  let pageHint       = ''
  let actionPrefix   = 'On this page'
  let suggestedRoute: string | null = null

  switch (pageContext) {
    case 'dashboard':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildDashboardGuidance(guidance, signals))
      break
    case 'today':
      pageHint       = `Start with your highest-priority item: ${guidance.highestLeverageAction}.`
      actionPrefix   = 'On the today page'
      suggestedRoute = guidance.navigationTarget
      break
    case 'players':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildPlayersGuidance(guidance, signals))
      break
    case 'player_detail':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildPlayerDetailGuidance(guidance, signals, executionState))
      break
    case 'approvals':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildApprovalsGuidance(guidance, signals))
      break
    case 'sessions':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildSessionsGuidance(guidance, signals))
      break
    case 'templates':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildTemplatesGuidance())
      break
    case 'curriculum':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildCurriculumGuidance(guidance, signals))
      break
    case 'coaches':
      ;({ pageHint, actionPrefix, suggestedRoute } = buildCoachesGuidance(guidance, signals))
      break
    case 'settings':
      pageHint       = 'Review academy settings and confirm all configuration is current.'
      actionPrefix   = 'On the settings page'
      suggestedRoute = null
      break
    default:
      pageHint       = guidance.highestLeverageAction
      actionPrefix   = 'On this page'
      suggestedRoute = guidance.navigationTarget
  }

  const fullGuidance = `${actionPrefix}, ${pageHint.charAt(0).toLowerCase() + pageHint.slice(1)}`

  return { pageContext, pageHint, actionPrefix, fullGuidance, suggestedRoute }
}

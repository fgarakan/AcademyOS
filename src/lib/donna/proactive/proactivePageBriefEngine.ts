// Sprint 1801–1810 — DONNA Proactive Pilot Guide V1
// Page-aware pilot briefs for first-time directors.
// Purpose: help a director use AcademyOS without a guide sitting next to them.
//
// Every brief answers four questions:
//   1. What is this page for?
//   2. What should I look at first?
//   3. What should I do next?
//   4. What can I ask DONNA?
//
// Rules:
//   - Short and action-oriented
//   - Evidence-safe: never invent counts or signals
//   - Approval-safe: never suggest bypassing the review pipeline
//   - Uses live counts only when passed in; honest fallback when unknown
//   - No DB calls, no mutations, no React, no side effects

import {
  getPageCapabilityMap,
} from '@/lib/donna/donnaPageContextEngine'
import type { DonnaPlayerProfileContext } from '@/lib/donna/donnaSessionContext'

// ── Brief type ────────────────────────────────────────────────────────────────

export interface ProactivePageBrief {
  /** Canonical route pattern (e.g. '/director/review') */
  page: string
  /** Short page label */
  pageLabel: string
  /** What is this page for? One short sentence. */
  whatIsThis: string
  /** What should I look at first? One short sentence. */
  lookFirst: string
  /** What should I do next? One short sentence. Approval-safe. */
  doNext: string
  /** What can I ask DONNA? Suggested first question. */
  suggestedQuestion: string
  /** Optional CTA label for the suggested action */
  ctaLabel: string | null
  /** Optional CTA href */
  ctaHref: string | null
  /** Whether the summary uses live data ('data') or is template-only ('template') */
  confidence: 'data' | 'template'
}

// ── Live count inputs ─────────────────────────────────────────────────────────

export interface ProactiveBriefCounts {
  pendingReviews?: number
  missingWrapUps?: number
  todaySessions?: number
  playerProfileCtx?: DonnaPlayerProfileContext | null
}

// ── Supported route detection ─────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPlayerProfileRoute(pathname: string): boolean {
  const parts = pathname.split('/')
  return (
    parts.length === 4 &&
    parts[1] === 'director' &&
    parts[2] === 'players' &&
    UUID_RE.test(parts[3] ?? '')
  )
}

/** Returns a canonical route key for session cooldown tracking. */
export function canonicalizeBriefRoute(pathname: string): string | null {
  if (pathname === '/director') return 'director_dashboard'
  if (isPlayerProfileRoute(pathname)) return 'director_player_profile'
  if (pathname.startsWith('/director/review')) return 'director_review'
  if (pathname.startsWith('/director/today')) return 'director_today'
  if (pathname.startsWith('/director/players')) return 'director_players'
  if (pathname.startsWith('/director/curriculum')) return 'director_curriculum'
  if (pathname.startsWith('/director/sessions')) return 'director_sessions'
  if (pathname.startsWith('/director/templates')) return 'director_templates'
  if (pathname.startsWith('/director/kpi')) return 'director_kpi'
  return null
}

// ── Brief definitions ─────────────────────────────────────────────────────────

function dashboardBrief(counts: ProactiveBriefCounts): ProactivePageBrief {
  const pending = counts.pendingReviews
  const wrapUps = counts.missingWrapUps

  const lookFirst =
    pending !== undefined && pending > 0
      ? `You have ${pending} item${pending === 1 ? '' : 's'} waiting in the review queue.`
      : wrapUps !== undefined && wrapUps > 0
        ? `${wrapUps} coach wrap-up${wrapUps === 1 ? '' : 's'} have not been submitted yet.`
        : 'Check the review queue and any flagged player signals.'

  const doNext =
    pending !== undefined && pending > 0
      ? 'Go to the Review queue and approve or reject each item.'
      : 'Scan the status cards and follow any orange signals.'

  return {
    page: '/director',
    pageLabel: 'Director Dashboard',
    whatIsThis: 'This is your command center — academy health, pending decisions, and session status.',
    lookFirst,
    doNext,
    suggestedQuestion: 'What should I do first today?',
    ctaLabel: pending !== undefined && pending > 0 ? 'Open review queue' : null,
    ctaHref: pending !== undefined && pending > 0 ? '/director/review' : null,
    confidence: pending !== undefined ? 'data' : 'template',
  }
}

function reviewBrief(counts: ProactiveBriefCounts): ProactivePageBrief {
  const pending = counts.pendingReviews

  const lookFirst =
    pending !== undefined && pending > 0
      ? `You have ${pending} item${pending === 1 ? '' : 's'} here. Start with anything marked urgent or parent-facing.`
      : 'Start with anything marked urgent or parent-facing.'

  return {
    page: '/director/review',
    pageLabel: 'Review Queue',
    whatIsThis: 'Items that need your approval before anything takes effect — coach wrap-ups, drafts, and flags.',
    lookFirst,
    doNext: 'Read each item carefully. Click Approve or Reject. Nothing is sent or applied until you decide.',
    suggestedQuestion: 'What needs approval first?',
    ctaLabel: null,
    ctaHref: null,
    confidence: pending !== undefined ? 'data' : 'template',
  }
}

function todayBrief(counts: ProactiveBriefCounts): ProactivePageBrief {
  const sessions = counts.todaySessions
  const wrapUps  = counts.missingWrapUps

  const lookFirst =
    sessions !== undefined && sessions > 0
      ? `${sessions} session${sessions === 1 ? '' : 's'} ${sessions === 1 ? 'is' : 'are'} scheduled today.`
      : 'Check the session schedule for today.'

  const doNext =
    wrapUps !== undefined && wrapUps > 0
      ? `${wrapUps} coach wrap-up${wrapUps === 1 ? '' : 's'} still need to be submitted. Follow up with those coaches.`
      : 'Review session coverage and check if all coaches have submitted wrap-ups.'

  return {
    page: '/director/today',
    pageLabel: "Today's Academy",
    whatIsThis: "Everything happening at your academy today — sessions, wrap-up coverage, and pending items.",
    lookFirst,
    doNext,
    suggestedQuestion: "What needs my attention today?",
    ctaLabel: null,
    ctaHref: null,
    confidence: sessions !== undefined ? 'data' : 'template',
  }
}

function playersBrief(): ProactivePageBrief {
  return {
    page: '/director/players',
    pageLabel: 'Player Directory',
    whatIsThis: 'Every player in your academy — their current level, status, and recent signals.',
    lookFirst: 'Look for players with orange or red flags — those need attention first.',
    doNext: 'Click a player to open their full profile, review their progress, and see what the coach has recorded.',
    suggestedQuestion: 'Which players need attention?',
    ctaLabel: null,
    ctaHref: null,
    confidence: 'template',
  }
}

function playerProfileBrief(counts: ProactiveBriefCounts): ProactivePageBrief {
  const ctx = counts.playerProfileCtx

  const lookFirst =
    ctx && ctx.activePriorityCount > 0
      ? `This player has ${ctx.activePriorityCount} active development ${ctx.activePriorityCount === 1 ? 'priority' : 'priorities'}.${ctx.topPriorityTitle ? ` Top priority: ${ctx.topPriorityTitle}.` : ''}`
      : 'Check the coach notes, attendance pattern, and active priorities.'

  return {
    page: '/director/players/[playerId]',
    pageLabel: 'Player Profile',
    whatIsThis: "One player's full development record — curriculum level, coach observations, attendance, and signals.",
    lookFirst,
    doNext: 'If you need to send a parent update or review a level change, use the action buttons — not the chat.',
    suggestedQuestion: "Summarize this player's recent progress.",
    ctaLabel: null,
    ctaHref: null,
    confidence: ctx ? 'data' : 'template',
  }
}

function curriculumBrief(): ProactivePageBrief {
  return {
    page: '/director/curriculum',
    pageLabel: 'Curriculum',
    whatIsThis: 'Your academy\'s development curriculum — levels, blocks, drills, and structure.',
    lookFirst: 'Check each level for coverage gaps — levels with missing content or unlinked templates.',
    doNext: 'If you spot a gap, ask DONNA what is missing and get a draft proposal to review.',
    suggestedQuestion: 'Where are the curriculum gaps?',
    ctaLabel: null,
    ctaHref: null,
    confidence: 'template',
  }
}

function sessionsBrief(counts: ProactiveBriefCounts): ProactivePageBrief {
  const sessions = counts.todaySessions
  const wrapUps  = counts.missingWrapUps

  const lookFirst =
    sessions !== undefined && sessions > 0
      ? `${sessions} session${sessions === 1 ? '' : 's'} scheduled today.`
      : 'Browse recent sessions and check their status.'

  const doNext =
    wrapUps !== undefined && wrapUps > 0
      ? `${wrapUps} session${wrapUps === 1 ? '' : 's'} ${wrapUps === 1 ? 'is' : 'are'} missing a coach wrap-up.`
      : 'Open a session to see its blocks, attendance, and wrap-up status.'

  return {
    page: '/director/sessions',
    pageLabel: 'Sessions',
    whatIsThis: 'Scheduled sessions at your academy — who is coaching, who is attending, and what was delivered.',
    lookFirst,
    doNext,
    suggestedQuestion: 'What sessions are happening today?',
    ctaLabel: null,
    ctaHref: null,
    confidence: sessions !== undefined ? 'data' : 'template',
  }
}

function templatesBrief(): ProactivePageBrief {
  return {
    page: '/director/templates',
    pageLabel: 'Templates',
    whatIsThis: 'Class templates define what coaches deliver in each session — blocks, drills, and timing.',
    lookFirst: 'Check that your most-used curriculum levels have at least one template assigned.',
    doNext: 'Open a template to see its block structure. Ask DONNA to suggest improvements.',
    suggestedQuestion: 'Show me available templates.',
    ctaLabel: null,
    ctaHref: null,
    confidence: 'template',
  }
}

function kpiBrief(): ProactivePageBrief {
  const capMap = getPageCapabilityMap('/director/kpi')
  return {
    page: '/director/kpi',
    pageLabel: 'KPI Dashboard',
    whatIsThis: 'Key performance indicators for your academy — attendance, session coverage, player progress, and retention.',
    lookFirst: 'Start with any metric in the orange or red zone.',
    doNext: 'Click a KPI to see the detail. Then ask DONNA what is driving it and what you can do.',
    suggestedQuestion: capMap.suggestedPrompts[0] ?? 'Which KPI needs the most attention?',
    ctaLabel: null,
    ctaHref: null,
    confidence: 'template',
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Generate a proactive pilot guide brief for the given pathname.
 * Returns null for unsupported routes.
 * Evidence-safe: uses live counts only when provided. Never fabricates numbers.
 * Approval-safe: never suggests bypassing the review pipeline.
 */
export function generateProactivePageBrief(
  pathname: string,
  counts: ProactiveBriefCounts = {},
): ProactivePageBrief | null {
  if (pathname === '/director')                           return dashboardBrief(counts)
  if (pathname.startsWith('/director/review'))           return reviewBrief(counts)
  if (pathname.startsWith('/director/today'))            return todayBrief(counts)
  if (isPlayerProfileRoute(pathname))                    return playerProfileBrief(counts)
  if (pathname.startsWith('/director/players'))          return playersBrief()
  if (pathname.startsWith('/director/curriculum'))       return curriculumBrief()
  if (pathname.startsWith('/director/sessions'))         return sessionsBrief(counts)
  if (pathname.startsWith('/director/templates'))        return templatesBrief()
  if (pathname.startsWith('/director/kpi'))              return kpiBrief()
  return null
}

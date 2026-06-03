// Sprint 1661 — DONNA Global Context Engine V1
// Unified live operating context snapshot.
// Consolidates page, player, curriculum, session, review, draft, workflow, focus, and role
// into a single typed object that any DONNA component can consume.
//
// Design rules:
//   - Pure TypeScript. No DB calls. No React. No side effects.
//   - All fields are optional / nullable — graceful degradation required.
//   - Never expose raw player notes, private coach data, or parent-visible data.
//   - Safe strings only: counts, labels, IDs, status strings.
//
// Usage:
//   const ctx = buildDonnaLiveContext({ pathname, role, directorCtx, playerProfileCtx, sessionCtx })
//   ctx.entityLabel   // "Jamie Chen — Orange Ball 2"
//   ctx.pageLabel     // "Player Profile"
//   ctx.hasPendingWork // true
//   ctx.greeting()    // "You're viewing Jamie Chen's profile..."

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaPlayerProfileContext } from '@/lib/donna/donnaSessionContext'
import { getPageCapabilityMap } from '@/lib/donna/donnaPageContextEngine'

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Entity type currently in focus. */
export type DonnaFocusEntityKind =
  | 'player'
  | 'curriculum_level'
  | 'session'
  | 'assessment'
  | 'review_item'
  | 'draft'
  | 'none'

/** Operating context snapshot for a single director interaction moment. */
export interface DonnaLiveContext {
  // Page
  pathname: string
  pageLabel: string
  pageIntent: string

  // Role
  role: 'director' | 'coach' | 'parent' | 'player'

  // Current entity in focus
  entityKind: DonnaFocusEntityKind
  entityLabel: string | null        // "Jamie Chen", "Orange Ball 2", etc.
  entitySummary: string | null      // one-line status summary

  // Player-specific (when on a player profile page)
  activePriorityCount: number
  topPriorityTitle: string | null
  topPriorityLevel: string | null

  // Academy-wide signals (from directorCtx when available)
  pendingReviews: number
  highRiskPlayerCount: number
  advancementEligibleCount: number
  curriculumDraftCount: number
  attendanceExceptions: number

  // Derived flags
  hasPendingWork: boolean           // any item requiring director attention
  isOnEntityPage: boolean           // director is viewing a specific entity (player, level)

  // Greeting builder — context-first, never generic
  greeting: () => string
}

// ─── Inputs ────────────────────────────────────────────────────────────────────

export interface DonnaLiveContextInput {
  pathname:           string
  role:               'director' | 'coach' | 'parent' | 'player'
  directorCtx?:       DirectorDonnaContext | null
  playerProfileCtx?:  DonnaPlayerProfileContext | null
  /** Optional: module label from DonnaSessionContext (e.g., "Player Profile") */
  moduleLabel?:       string | null
  /** Optional: the label of the current entity from DonnaSessionContext */
  objectLabel?:       string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Derive what entity kind is currently in focus from the pathname. */
function deriveEntityKind(pathname: string, playerProfileCtx: DonnaPlayerProfileContext | null): DonnaFocusEntityKind {
  if (playerProfileCtx && /\/director\/players\/[a-f0-9-]{36}/.test(pathname)) return 'player'
  if (/\/director\/curriculum/.test(pathname)) return 'curriculum_level'
  if (/\/director\/sessions/.test(pathname)) return 'session'
  if (/\/director\/review/.test(pathname)) return 'review_item'
  return 'none'
}

/** Build a short entity label for use in greetings and context summaries. */
function deriveEntityLabel(
  entityKind: DonnaFocusEntityKind,
  objectLabel: string | null | undefined,
  playerProfileCtx: DonnaPlayerProfileContext | null | undefined,
): string | null {
  if (entityKind === 'player') {
    return objectLabel ?? null
  }
  if (entityKind === 'curriculum_level') {
    // objectLabel may be "Orange Ball 2" if the curriculum page set it
    return objectLabel ?? null
  }
  return objectLabel ?? null
}

/** Build the entity summary line for context display. */
function deriveEntitySummary(
  entityKind: DonnaFocusEntityKind,
  playerProfileCtx: DonnaPlayerProfileContext | null | undefined,
): string | null {
  if (entityKind === 'player' && playerProfileCtx) {
    if (playerProfileCtx.activePriorityCount > 0 && playerProfileCtx.topPriorityTitle) {
      return `${playerProfileCtx.activePriorityCount} active ${playerProfileCtx.activePriorityCount === 1 ? 'priority' : 'priorities'} — top: ${playerProfileCtx.topPriorityTitle}`
    }
    if (playerProfileCtx.activePriorityCount === 0) {
      return 'No active priorities'
    }
  }
  return null
}

// ─── Main builder ──────────────────────────────────────────────────────────────

export function buildDonnaLiveContext(input: DonnaLiveContextInput): DonnaLiveContext {
  const { pathname, role, directorCtx, playerProfileCtx, moduleLabel, objectLabel } = input

  const pageMap = getPageCapabilityMap(pathname)
  const pageLabel = moduleLabel ?? pageMap.pageLabel
  const pageIntent = pageMap.directorIntent

  const entityKind = deriveEntityKind(pathname, playerProfileCtx ?? null)
  const entityLabel = deriveEntityLabel(entityKind, objectLabel, playerProfileCtx)
  const entitySummary = deriveEntitySummary(entityKind, playerProfileCtx)

  const pendingReviews       = directorCtx?.pendingReviews ?? 0
  const highRiskPlayerCount  = directorCtx?.highRiskPlayerCount ?? 0
  const advancementEligible  = directorCtx?.advancementEligibleCount ?? 0
  const curriculumDrafts     = directorCtx?.curriculumDraftCount ?? 0
  const attendanceExceptions = directorCtx?.attendanceExceptions ?? 0

  const hasPendingWork = pendingReviews > 0 || highRiskPlayerCount > 0 || advancementEligible > 0
  const isOnEntityPage = entityKind !== 'none'

  // ── Context-first greeting builder ─────────────────────────────────────────
  function greeting(): string {
    // Player profile context — most specific
    if (entityKind === 'player' && playerProfileCtx) {
      const name = entityLabel ?? 'this player'
      const priorityLine = playerProfileCtx.activePriorityCount > 0 && playerProfileCtx.topPriorityTitle
        ? ` Current top priority: ${playerProfileCtx.topPriorityTitle}.`
        : playerProfileCtx.activePriorityCount === 0
          ? ' No active priorities recorded yet.'
          : ''
      const levelLine = playerProfileCtx.topPriorityLevel ? ` Level: ${playerProfileCtx.topPriorityLevel}.` : ''
      return `You're viewing ${name}'s profile.${levelLine}${priorityLine} What would you like to review?`
    }
    // Curriculum level context
    if (entityKind === 'curriculum_level' && entityLabel) {
      return `You're currently reviewing ${entityLabel}. I can show current state, evidence signals, and improvement suggestions. What would you like to explore?`
    }
    // Review queue
    if (entityKind === 'review_item') {
      const countLine = pendingReviews > 0 ? ` You have ${pendingReviews} item${pendingReviews !== 1 ? 's' : ''} pending review.` : ''
      return `You're in the Review Center.${countLine} What would you like to review?`
    }
    // Page-level context with pending work
    if (hasPendingWork && role === 'director') {
      const lines: string[] = [`You're on ${pageLabel}.`]
      if (pendingReviews > 0) lines.push(`${pendingReviews} item${pendingReviews !== 1 ? 's' : ''} need your review.`)
      if (highRiskPlayerCount > 0) lines.push(`${highRiskPlayerCount} high-risk player signal${highRiskPlayerCount !== 1 ? 's' : ''} active.`)
      if (advancementEligible > 0) lines.push(`${advancementEligible} player${advancementEligible !== 1 ? 's' : ''} eligible for advancement.`)
      lines.push('What would you like to do?')
      return lines.join(' ')
    }
    // Generic page context
    return `You're on ${pageLabel}. ${pageIntent} What would you like to do?`
  }

  return {
    pathname,
    pageLabel,
    pageIntent,
    role,
    entityKind,
    entityLabel,
    entitySummary,
    activePriorityCount:      playerProfileCtx?.activePriorityCount ?? 0,
    topPriorityTitle:         playerProfileCtx?.topPriorityTitle ?? null,
    topPriorityLevel:         playerProfileCtx?.topPriorityLevel ?? null,
    pendingReviews,
    highRiskPlayerCount,
    advancementEligibleCount: advancementEligible,
    curriculumDraftCount:     curriculumDrafts,
    attendanceExceptions,
    hasPendingWork,
    isOnEntityPage,
    greeting,
  }
}

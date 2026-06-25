// Mega Sprint 3961–3990 — DONNA Live Page Intelligence V1
// Part 1 — Page Context Packet Source.
//
// Turns the Director's CURRENT SCREEN into a structured, inspectable block that is
// automatically injected into the Executive Context Packet's `current_page` source.
// DONNA should behave like a COO standing beside the Director looking at the same
// screen — so "what should I do here?", "which should I choose?", "walk me through
// this", "why does this matter?" never require the Director to explain the page.
//
// This module is the bridge between the page-aware operating layer
// (resolvePageIntelligence) and the executive reasoning packet:
//
//   route + LivePageState ──▶ resolvePageContextPacket() ──▶ PageContextPacket
//                                                              │
//                            serializePageContextForPacket() ─┘──▶ ResolverState.page
//                                                                  (current_page source)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Never fabricates live values. Unknown signals are simply omitted (not guessed).
//   - Returns null only for completely unknown routes — callers fall through.
//   - The serialized block is compact (key:value, capped) to stay token-lean.

import {
  resolvePageIntelligence,
  type PageIntelligence,
} from '@/lib/donna/operating/pageContextResolver'
import type { LivePageState } from '@/lib/donna/operating/livePageState'

// ── Structured page context ─────────────────────────────────────────────────────

export interface PageCompletionStatus {
  /** What "done" looks like for this page. */
  goals: string[]
  /** Goals known to be satisfied from live state (best-effort, never guessed). */
  completed: string[]
  /** Goals still outstanding (goals minus completed). */
  remaining: string[]
  /** Hard blockers surfaced for this page (warnings). */
  blockers: string[]
  /** 0–100 when a live progress signal exists; null otherwise. */
  percentComplete: number | null
}

export interface PageContextPacket {
  /** Canonical route — the page id. */
  pageId: string
  /** Human-readable page title. */
  pageTitle: string
  /** One-sentence purpose of the page. */
  pagePurpose: string
  /** Where the Director is within a multi-step page (null when not stepped). */
  currentStep: string | null
  /** Sections visible on the page. */
  visibleSections: string[]
  /** Key fields / metrics visible on the page. */
  visibleFields: string[]
  /** Buttons / actions DONNA can safely assist with on the page. */
  visibleButtons: string[]
  /** Concrete selected / known values from live state ("label: value"). */
  selectedValues: string[]
  /** Completion + progress awareness. */
  completionStatus: PageCompletionStatus
  /** Actions DONNA can assist with directly. */
  availableActions: string[]
  /** Actions that require explicit Director approval. */
  approvalActions: string[]
  /** Single highest-impact next action for this page (state-aware). */
  recommendedNextAction: string
}

// ── Live-state derived awareness ─────────────────────────────────────────────────

/** Current step within a stepped page, derived from real live signals only. */
function deriveCurrentStep(route: string, live: LivePageState | null): string | null {
  if (!live) return null
  if (route === '/director/onboarding' || route === '/director/setup') {
    if (live.onboardingComplete === true) return 'All 7 setup steps complete'
    if (typeof live.onboardingProgress === 'number') {
      return `Step ${Math.min(live.onboardingProgress + 1, 7)} of 7 (${live.onboardingProgress}/7 complete)`
    }
  }
  if (route === '/director/curriculum') {
    const done = live.curriculumSetupStepsComplete
    const total = live.curriculumSetupStepsTotal
    if (typeof done === 'number' && typeof total === 'number' && total > 0) {
      return `Curriculum setup ${done} of ${total} steps complete`
    }
    if (live.curriculumSpineActive === false) return 'Curriculum spine not yet active'
    if (live.curriculumSpineActive === true) return 'Curriculum spine active'
  }
  return null
}

/** 0–100 completion percentage, from a real live signal only (else null). */
function derivePercentComplete(route: string, live: LivePageState | null): number | null {
  if (!live) return null
  if (route === '/director/onboarding' || route === '/director/setup') {
    if (live.onboardingComplete === true) return 100
    if (typeof live.onboardingProgress === 'number') return Math.round((live.onboardingProgress / 7) * 100)
  }
  if (route === '/director/curriculum') {
    const done = live.curriculumSetupStepsComplete
    const total = live.curriculumSetupStepsTotal
    if (typeof done === 'number' && typeof total === 'number' && total > 0) {
      return Math.round((done / total) * 100)
    }
    if (typeof live.curriculumProgress === 'number') return Math.round(live.curriculumProgress)
  }
  return null
}

/** Concrete known values for the page — counts/flags that are actually present. */
function deriveSelectedValues(route: string, live: LivePageState | null): string[] {
  if (!live) return []
  const v: string[] = []
  const push = (label: string, value: number | boolean | null | undefined) => {
    if (value === null || value === undefined) return
    v.push(`${label}: ${typeof value === 'boolean' ? (value ? 'yes' : 'no') : value}`)
  }
  // Page-relevant live signals only — keep the block focused on this screen.
  switch (true) {
    case route === '/director' || route === '/director/today':
      push('Active players', live.activePlayerCount)
      push('Active coaches', live.activeCoachCount)
      push('Pending reviews', live.pendingReviewCount)
      push('Players needing attention', live.playersNeedingAttention)
      break
    case route === '/director/review':
      push('Pending reviews', live.pendingReviewCount)
      push('Parent-visible items', live.pendingParentApprovals)
      push('Coach-facing items', live.pendingCoachApprovals)
      break
    case route === '/director/players':
      push('Active players', live.activePlayerCount)
      push('Players needing attention', live.playersNeedingAttention)
      push('Players missing curriculum level', live.playersMissingCurriculumLevel)
      push('Players without recent assessment', live.playersWithoutAssessment)
      break
    case route === '/director/curriculum':
      push('Curriculum spine active', live.curriculumSpineActive)
      push('Players missing curriculum level', live.playersMissingCurriculumLevel)
      break
    case route === '/director/placement':
      push('Players in intake', live.placementQueueCount)
      break
    case route === '/director/level-up':
      push('Advancement candidates', live.levelUpQueueCount ?? live.promotionQueueCount)
      break
    case route === '/director/coaches':
      push('Active coaches', live.activeCoachCount)
      break
    case route === '/director/sessions':
      push('Upcoming sessions', live.upcomingSessions)
      push('Unassigned sessions', live.unassignedSessions)
      break
    case route === '/director/onboarding' || route === '/director/setup':
      push('Onboarding complete', live.onboardingComplete)
      push('Steps complete', live.onboardingProgress)
      break
    default:
      break
  }
  return v
}

/**
 * Goals known to be satisfied from live state. Conservative: only marks a goal
 * complete when a live signal unambiguously proves it. Never guesses.
 */
function deriveCompletedGoals(intel: PageIntelligence, live: LivePageState | null): string[] {
  if (!live) return []
  const done: string[] = []
  const route = intel.route
  if ((route === '/director/onboarding' || route === '/director/setup') && live.onboardingComplete === true) {
    return [...intel.completionGoals]
  }
  if (route === '/director/placement' && live.placementQueueCount === 0) {
    done.push(...intel.completionGoals.filter(g => /intake|placed|placement/i.test(g)))
  }
  if (route === '/director/level-up' && (live.levelUpQueueCount === 0)) {
    done.push(...intel.completionGoals.filter(g => /candidate|reviewed|waiting/i.test(g)))
  }
  if (route === '/director/curriculum' && live.curriculumSpineActive === true && (live.playersMissingCurriculumLevel ?? 1) === 0) {
    done.push(...intel.completionGoals.filter(g => /assigned|spine|level/i.test(g)))
  }
  if (route === '/director/review' && live.pendingReviewCount === 0) {
    return [...intel.completionGoals]
  }
  return Array.from(new Set(done))
}

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Resolve the structured page context for the current route + live state.
 * Returns null only for completely unknown routes.
 */
export function resolvePageContextPacket(
  route: string | null | undefined,
  livePageState?: LivePageState | null,
): PageContextPacket | null {
  if (!route) return null
  const live = livePageState ?? null
  const intel = resolvePageIntelligence(route, live)
  if (!intel) return null

  const goals = intel.completionGoals
  const completed = deriveCompletedGoals(intel, live)
  const completedSet = new Set(completed)
  const remaining = goals.filter(g => !completedSet.has(g))

  return {
    pageId: intel.route,
    pageTitle: intel.pageName,
    pagePurpose: intel.pagePurpose,
    currentStep: deriveCurrentStep(route, live),
    visibleSections: intel.visibleData,
    visibleFields: intel.keyMetrics.map(m => m.label),
    visibleButtons: intel.availableActions,
    selectedValues: deriveSelectedValues(route, live),
    completionStatus: {
      goals,
      completed,
      remaining,
      blockers: intel.warnings,
      percentComplete: derivePercentComplete(route, live),
    },
    availableActions: intel.availableActions,
    approvalActions: intel.approvalActions,
    recommendedNextAction: intel.recommendedNextAction,
  }
}

// ── Serialization (→ Executive Context Packet `current_page` source) ─────────────

const MAX_BLOCK_CHARS = 1100

/**
 * Compact, token-lean serialization of the page context for the executive packet.
 * Key:value lines so OpenAI can ground every answer in the live screen without the
 * Director re-explaining it. Capped so the always-included page source stays cheap.
 *
 * Ordering is deliberate: the executive-critical fields (where the Director is, the
 * page's purpose, the current step, and the single recommended next action) come
 * FIRST so they always survive truncation. The verbose lists (sections, actions,
 * completion detail) come after — useful, but never at the cost of the headline
 * "what should I do here?" answer.
 */
export function serializePageContextForPacket(p: PageContextPacket): string {
  const head: string[] = []
  head.push(`PAGE: ${p.pageTitle} [${p.pageId}]`)
  head.push(`PURPOSE: ${p.pagePurpose}`)
  if (p.currentStep) head.push(`CURRENT_STEP: ${p.currentStep}`)
  if (p.completionStatus.percentComplete !== null) head.push(`PROGRESS: ${p.completionStatus.percentComplete}% complete`)
  head.push(`RECOMMENDED_NEXT: ${p.recommendedNextAction}`)

  const body: string[] = []
  if (p.visibleSections.length) body.push(`VISIBLE_SECTIONS: ${p.visibleSections.slice(0, 6).join('; ')}`)
  if (p.visibleFields.length) body.push(`KEY_FIELDS: ${p.visibleFields.slice(0, 6).join('; ')}`)
  if (p.visibleButtons.length) body.push(`AVAILABLE_ACTIONS: ${p.visibleButtons.slice(0, 6).join('; ')}`)
  if (p.approvalActions.length) body.push(`APPROVAL_GATED: ${p.approvalActions.slice(0, 3).join('; ')}`)
  if (p.selectedValues.length) body.push(`SELECTED_VALUES: ${p.selectedValues.slice(0, 6).join('; ')}`)
  if (p.completionStatus.completed.length) body.push(`COMPLETED: ${p.completionStatus.completed.slice(0, 5).join('; ')}`)
  if (p.completionStatus.remaining.length) body.push(`REMAINING: ${p.completionStatus.remaining.slice(0, 5).join('; ')}`)
  if (p.completionStatus.blockers.length) body.push(`BLOCKERS: ${p.completionStatus.blockers.slice(0, 3).join('; ')}`)

  // Head is never truncated; body is trimmed to fit the remaining budget.
  const headBlock = head.join('\n')
  if (!body.length) return headBlock
  const remaining = MAX_BLOCK_CHARS - headBlock.length - 1
  const bodyBlock = body.join('\n')
  const fittedBody = bodyBlock.length > remaining ? `${bodyBlock.slice(0, Math.max(0, remaining - 1))}…` : bodyBlock
  return remaining > 0 ? `${headBlock}\n${fittedBody}` : headBlock
}

/**
 * Convenience: resolve + serialize in one call for injection into ResolverState.page.
 * Returns null when the route is unknown so the caller can fall back to the route.
 */
export function buildPageContextForResolver(
  route: string | null | undefined,
  livePageState?: LivePageState | null,
): string | null {
  const packet = resolvePageContextPacket(route, livePageState)
  return packet ? serializePageContextForPacket(packet) : null
}

// ── Developer trace (Objective 5 — developer-only) ──────────────────────────────

export interface PageContextDevTrace {
  /** The page DONNA detected for this turn. */
  pageDetected: string
  /** Count of UI context elements collected (sections + fields + buttons + values). */
  uiContextCollected: number
  /** Whether a rich page block was injected into the Executive Packet. */
  pageInjected: boolean
  /** Short preview of the serialized block sent toward OpenAI. */
  packetPreview: string
}

/** Build a developer-only trace summary of page-context collection for a turn. */
export function buildPageContextDevTrace(
  route: string | null | undefined,
  livePageState?: LivePageState | null,
): PageContextDevTrace {
  const packet = resolvePageContextPacket(route, livePageState)
  if (!packet) {
    return {
      pageDetected: route ?? 'unknown',
      uiContextCollected: 0,
      pageInjected: false,
      packetPreview: '(no page intelligence for route)',
    }
  }
  const serialized = serializePageContextForPacket(packet)
  const collected =
    packet.visibleSections.length +
    packet.visibleFields.length +
    packet.visibleButtons.length +
    packet.selectedValues.length
  return {
    pageDetected: `${packet.pageTitle} [${packet.pageId}]`,
    uiContextCollected: collected,
    pageInjected: true,
    packetPreview: serialized.slice(0, 240),
  }
}

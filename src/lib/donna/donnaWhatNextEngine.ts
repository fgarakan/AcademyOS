// Sprint 941 — DONNA "What Should I Do Next?" Engine V1
// Sprint 948 — Coach context signals added to WhatNextLiveContext
// Produces a priority-ranked next-action recommendation for DONNA.
// Inputs: role, pathname, optional live context signals.
// Outputs: text answer, optional UI highlight target, safety note.
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.
//
// Priority ranking:
//   1. Urgent safety/review — pending approvals (pendingReviews > 0)
//   2. Pending attendance exceptions
//   3. Players advancing eligibility or stalled development
//   4. Page-registered urgent element (from element registry)
//   5. Page-registered high-priority element
//   6. Page capability map purpose (static fallback)
//
// Usage:
//   const answer = buildWhatNextAnswer('director', '/director/review', { pendingReviews: 3 })
//   // answer.text: "You have 3 items in your Review Center..."
//   // answer.targetId: 'pending-review-list'
//   // answer.href: '/director/review'

import type { DonnaContextRole } from './donnaPersonality'
import { getSafetyMessage } from './donnaPersonality'
import { getPageLabel, pageHasApprovalGates } from './donnaContextResolver'
import {
  getPageElementsSorted,
  getTopPageElement,
  type DonnaPageElement,
} from './donnaPageElementRegistry'
import { whatIsTheBestNextStep } from './donnaPageContextEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Live context signals for the "what next?" engine. All fields are optional. */
export interface WhatNextLiveContext {
  // ── Director signals ────────────────────────────────────────────────────────
  /** Pending proposed_actions items awaiting director decision */
  pendingReviews?: number
  /** Pending attendance exceptions requiring director review */
  attendanceExceptions?: number
  /** Players currently marked advancement-eligible */
  advancementEligibleCount?: number
  /** Players whose development has stalled (no progression) */
  playerProgressStallCount?: number
  /** Players with high development risk signals */
  highRiskPlayerCount?: number
  /** Curriculum drafts in pending_review state */
  curriculumDraftCount?: number
  // ── Coach signals (Sprint 948) ───────────────────────────────────────────────
  /** Wrap-ups the coach has not yet submitted */
  missingWrapUps?: number
  /** Today's session count for the coach */
  todaySessions?: number
  /** Observation drafts submitted by the coach today */
  observationDraftsToday?: number
  /** Active session ID (if coach is in a session right now) */
  activeSessionId?: string | null
}

/** The resolved next-action recommendation from DONNA. */
export interface WhatNextAnswer {
  /** The full text response DONNA should speak/display */
  text: string
  /** data-donna-focus-id of the element to highlight, if any */
  targetId?: string
  /** Human-readable label for the highlight badge */
  label?: string
  /** Why DONNA is pointing to this element */
  explanation?: string
  /** Safety note (shown when action requires approval) */
  safetyNote?: string
  /** Optional follow-up route to offer navigation to */
  href?: string
  /** Data confidence level */
  confidence: 'high' | 'partial'
  /** What drove this answer (for transparency/debugging) */
  source: 'live_pending_reviews' | 'live_attendance' | 'live_advancement' | 'live_stall' | 'page_element_urgent' | 'page_element_high' | 'page_fallback'
}

// ── Main engine ───────────────────────────────────────────────────────────────

/**
 * Build the highest-value next-action recommendation for DONNA.
 * Combines live context signals (when available) with static page element priorities.
 */
export function buildWhatNextAnswer(
  role: DonnaContextRole,
  pathname: string,
  liveCtx?: WhatNextLiveContext,
): WhatNextAnswer {
  const pageLabel = getPageLabel(pathname)
  const hasApprovalGates = pageHasApprovalGates(pathname)

  // ── Priority 1: Pending review items (highest urgency) ─────────────────────
  if (role === 'director' && liveCtx?.pendingReviews && liveCtx.pendingReviews > 0) {
    const n = liveCtx.pendingReviews
    const plural = n === 1 ? 'item' : 'items'
    const isOnReviewPage = pathname === '/director/review' || pathname.startsWith('/director/review')
    const targetId = isOnReviewPage ? 'pending-review-list' : undefined
    const href = isOnReviewPage ? undefined : '/director/review'

    return {
      text: isOnReviewPage
        ? `You have **${n} ${plural}** waiting for your decision here. I'm highlighting the review list now — start with the top item, review it, then approve, reject, or ask for clarification. Nothing takes effect until you act. ${getSafetyMessage('approvalRequired')}`
        : `Your **highest-priority action** is your Review Center — you have **${n} pending ${plural}** waiting for your decision. Nothing takes effect until you approve or reject each one. Would you like me to take you there?`,
      targetId,
      label: 'Pending Review Items',
      explanation: `You have ${n} ${plural} waiting for your decision in the Review Center.`,
      safetyNote: getSafetyMessage('approvalRequired'),
      href,
      confidence: 'high',
      source: 'live_pending_reviews',
    }
  }

  // ── Priority 2: Attendance exceptions ──────────────────────────────────────
  if (role === 'director' && liveCtx?.attendanceExceptions && liveCtx.attendanceExceptions > 0) {
    const n = liveCtx.attendanceExceptions
    const plural = n === 1 ? 'exception' : 'exceptions'
    const isOnReviewPage = pathname.startsWith('/director/review')
    const targetId = isOnReviewPage ? 'attendance-exceptions-section' : undefined
    const href = isOnReviewPage ? undefined : '/director/review'

    return {
      text: isOnReviewPage
        ? `There are **${n} attendance ${plural}** waiting in this section — I'm pointing to them now. Review each one and approve or reject the exception.`
        : `You have **${n} attendance ${plural}** that need your review before player records are updated. Would you like me to take you to the Review Center?`,
      targetId,
      label: 'Attendance Exceptions',
      explanation: `${n} attendance ${plural} need your review and decision.`,
      safetyNote: getSafetyMessage('approvalRequired'),
      href,
      confidence: 'high',
      source: 'live_attendance',
    }
  }

  // ── Priority 3: Advancement-eligible players ──────────────────────────────
  if (role === 'director' && liveCtx?.advancementEligibleCount && liveCtx.advancementEligibleCount > 0) {
    const n = liveCtx.advancementEligibleCount
    const plural = n === 1 ? 'player is' : 'players are'

    return {
      text: `**${n} ${plural} currently marked advancement-eligible**. Go to the Level Movement section to review the readiness signals, then submit an advancement proposal for your review. Level changes never happen automatically — you decide. ${getSafetyMessage('noLevelChange')}`,
      label: 'Level Movement',
      explanation: `${n} ${plural} ready for advancement review.`,
      safetyNote: getSafetyMessage('noLevelChange'),
      href: '/director/level-up',
      confidence: 'high',
      source: 'live_advancement',
    }
  }

  // ── Priority 4: Player development stalls ─────────────────────────────────
  if (role === 'director' && liveCtx?.playerProgressStallCount && liveCtx.playerProgressStallCount > 0) {
    const n = liveCtx.playerProgressStallCount
    const plural = n === 1 ? 'player has' : 'players have'

    return {
      text: `**${n} ${plural} stalled development signals** — no progression in recent sessions. Go to the Player Directory to identify who needs a coaching adjustment or a direct conversation. No action takes effect automatically.`,
      label: 'Player Stalls',
      explanation: `${n} ${plural} stalled development. Review their priorities.`,
      href: '/director/players',
      confidence: 'high',
      source: 'live_stall',
    }
  }

  // ── Coach priorities (Sprint 948) ──────────────────────────────────────────
  if (role === 'coach') {
    // Coach Priority 1: Missing wrap-ups
    if (liveCtx?.missingWrapUps && liveCtx.missingWrapUps > 0) {
      const n = liveCtx.missingWrapUps
      const plural = n === 1 ? 'session is' : 'sessions are'
      const targetId = 'coach-wrap-up-link'
      return {
        text: `You have **${n} ${plural} missing a wrap-up**. Head to the session and tap "Wrap-Up" in the After Session section. It takes under 3 minutes and goes to your director for review. ${getSafetyMessage('draftOnly')}`,
        targetId,
        label: 'Session Wrap-Up',
        explanation: `${n} ${plural} missing a wrap-up submission.`,
        safetyNote: getSafetyMessage('draftOnly'),
        confidence: 'high',
        source: 'page_element_urgent',
      }
    }
    // Coach Priority 2: Sessions today
    if (liveCtx?.todaySessions && liveCtx.todaySessions > 0 && pathname === '/coach') {
      return {
        text: `You have **${liveCtx.todaySessions} session${liveCtx.todaySessions > 1 ? 's' : ''} today**. I'm highlighting your schedule — tap a session to open it, mark attendance, and run your blocks.`,
        targetId: 'coach-today-sessions',
        label: "Today's Sessions",
        explanation: `${liveCtx.todaySessions} session${liveCtx.todaySessions > 1 ? 's' : ''} scheduled today.`,
        confidence: 'high',
        source: 'page_element_urgent',
      }
    }
  }

  // ── Priority 5: Page element registry (urgent level) ─────────────────────
  const pageElements = getPageElementsSorted(pathname, role)
  const urgentElement = pageElements.find(el => el.priority === 'urgent' && !el.dataDependent)

  if (urgentElement) {
    return buildElementAnswer(urgentElement, pageLabel, 'page_element_urgent')
  }

  // ── Priority 6: Page element registry (high level) ────────────────────────
  const highElement = pageElements.find(el => el.priority === 'high' && !el.dataDependent)

  if (highElement) {
    return buildElementAnswer(highElement, pageLabel, 'page_element_high')
  }

  // ── Priority 7: Top page element (any level) ─────────────────────────────
  const topElement = pageElements[0]
  if (topElement) {
    return buildElementAnswer(topElement, pageLabel, 'page_element_high')
  }

  // ── Fallback: Existing page context engine (static) ───────────────────────
  const fallbackText = whatIsTheBestNextStep(pathname)
  return {
    text: fallbackText,
    confidence: 'partial',
    source: 'page_fallback',
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildElementAnswer(
  element: DonnaPageElement,
  pageLabel: string,
  source: WhatNextAnswer['source'],
): WhatNextAnswer {
  const safetyNote = element.safetyLevel === 'approval_required'
    ? getSafetyMessage('approvalRequired')
    : element.safetyLevel === 'draft_to_review'
    ? getSafetyMessage('draftOnly')
    : undefined

  const text = buildElementText(element, safetyNote)

  return {
    text,
    targetId: element.id,
    label: element.label,
    explanation: element.explanation,
    safetyNote,
    href: element.href,
    confidence: 'high',
    source,
  }
}

function buildElementText(element: DonnaPageElement, safetyNote?: string): string {
  const parts: string[] = [
    `On the **${element.label}**: ${element.explanation}`,
  ]
  if (element.href) {
    parts.push(`I can take you there — just say "yes".`)
  }
  if (safetyNote) {
    parts.push(safetyNote)
  }
  return parts.join(' ')
}

// ── Convenience: coach what-next ──────────────────────────────────────────────

/**
 * Simplified coach variant — no live context required.
 * Returns next-action guidance for a coach based on page + elements.
 */
export function buildCoachWhatNextAnswer(pathname: string): WhatNextAnswer {
  return buildWhatNextAnswer('coach', pathname)
}

// ── Re-export registry helpers for Shell A import convenience ─────────────────

export type { DonnaPageElement }

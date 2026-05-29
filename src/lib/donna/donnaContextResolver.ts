// Sprint 939 — DONNA Context Resolver V1
// Single function that resolves a structured DONNA context object from role + pathname.
// Pure TypeScript — no DB calls, no React, no API calls, no mutations, no side effects.
// V1 uses page capability map (static route metadata) + role.
// Future versions will add live DirectorDonnaContext / CoachDonnaContext as optional inputs.
//
// Usage:
//   import { resolveDonnaContext } from '@/lib/donna/donnaContextResolver'
//   const ctx = resolveDonnaContext('director', '/director/review')
//   console.log(ctx.pagePurpose)     // "Approve, modify, or reject pending action items..."
//   console.log(ctx.suggestedPrompts[0])  // "What needs approval first?"

import type { DonnaContextRole } from './donnaPersonality'
import { roleSupportsHighlight, roleCanCreateDrafts, roleSeesApprovalGates } from './donnaPersonality'
import {
  getPageCapabilityMap,
  type DonnaPageCapabilityMap,
} from './donnaPageContextEngine'

// ── Output type ───────────────────────────────────────────────────────────────

export interface DonnaResolvedContext {
  /** The role this context was resolved for */
  userRole: DonnaContextRole
  /** The full current route pathname */
  route: string
  /** The canonical page key (may be a parameterised route pattern like '/director/players/[playerId]') */
  pageKey: string
  /** One-line description of what this page is for */
  pagePurpose: string
  /** Contextual information that is safe for DONNA to reference on this page */
  roleCapabilities: readonly string[]
  /** Actions DONNA must not perform or initiate on this page */
  safetyBoundaries: readonly string[]
  /** Actions that require explicit director approval before taking effect */
  knownApprovalActions: readonly string[]
  /** Types of answers DONNA is allowed to give here */
  allowedAnswerTypes: readonly string[]
  /** Pre-built suggested question starters for this page + role */
  suggestedPrompts: readonly string[]
  /** Fallback message when live data is not yet loaded */
  dataFallback: string
  /** Whether DONNA's highlight banner is mounted for this role */
  highlightAvailable: boolean
  /** Whether this role can create drafts via DONNA */
  canCreateDrafts: boolean
  /** Whether this role can see the approval-required action list */
  seesApprovalGates: boolean
  /** Names of context systems that are relevant for this role + route */
  contextSources: readonly string[]
}

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Resolve a structured DONNA context from role + pathname.
 * V1: pure static resolution — no DB calls, no live data.
 * Future: accept optional DirectorDonnaContext | CoachDonnaContext for live enrichment.
 */
export function resolveDonnaContext(
  role: DonnaContextRole,
  pathname: string,
): DonnaResolvedContext {
  const cap: DonnaPageCapabilityMap = getPageCapabilityMap(pathname)

  return {
    userRole: role,
    route: pathname,
    pageKey: cap.route,
    pagePurpose: cap.directorIntent,
    roleCapabilities: cap.safeContext,
    safetyBoundaries: cap.blocked,
    knownApprovalActions: cap.reviewRequiredActions,
    allowedAnswerTypes: cap.allowedAnswerTypes,
    suggestedPrompts: cap.suggestedPrompts,
    dataFallback: cap.dataFallback,
    highlightAvailable: roleSupportsHighlight(role),
    canCreateDrafts: roleCanCreateDrafts(role),
    seesApprovalGates: roleSeesApprovalGates(role),
    contextSources: deriveContextSources(role),
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function deriveContextSources(role: DonnaContextRole): readonly string[] {
  const sources: string[] = ['donnaPageContextEngine (page capability map)']

  if (role === 'director') {
    sources.push('DirectorDonnaContext (live academy data — optional)')
    sources.push('donnaChatSessionMemory (in-session state)')
    sources.push('donnaContextPacketBuilder (full context packet)')
    sources.push('donnaIntentRouterV1 (intent classification)')
  } else if (role === 'coach') {
    sources.push('CoachDonnaContext (coach-scoped session data — optional)')
    sources.push('donnaChatSessionMemory (in-session state)')
  } else if (role === 'parent') {
    sources.push('parentSafeResponseRules (visibility guardrail)')
    sources.push('player_guardians / guardians (child linkage)')
  } else if (role === 'player') {
    sources.push('player_priorities (active mission)')
    sources.push('player_curriculum_states (current level)')
  } else if (role === 'platform') {
    sources.push('platform-level academy health metrics')
  }

  return sources
}

// ── Convenience helpers ───────────────────────────────────────────────────────

/**
 * Returns the page's suggested first prompt for the given route.
 * Useful for DONNA's greeting and quick-action chips.
 */
export function getTopSuggestedPrompt(pathname: string): string | null {
  const cap = getPageCapabilityMap(pathname)
  return cap.suggestedPrompts[0] ?? null
}

/**
 * Returns a short page label for the given route (e.g. "Review Center").
 */
export function getPageLabel(pathname: string): string {
  return getPageCapabilityMap(pathname).pageLabel
}

/**
 * Returns true if the given route has known approval-required actions.
 * Used by DONNA to add a safety reminder when answering "what should I do here?".
 */
export function pageHasApprovalGates(pathname: string): boolean {
  return getPageCapabilityMap(pathname).reviewRequiredActions.length > 0
}

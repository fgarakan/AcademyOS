// Sprint 4359 — DONNA Loop Knowledge Resolver
//
// Safe retrieval + composition helpers over loopKnowledge.ts. Lets DONNA look up
// operating knowledge by loop id, route/page context, or user role, and compose a
// role-scoped answer that merges loop knowledge with the existing page intelligence
// and completion path.
//
// IMPORTANT (Sprint 4359 gate):
//   - This resolver is NOT imported by processDonnaMessage. Runtime brain wiring is
//     a separate, explicitly-approved step (Phase D). In this sprint the resolver is
//     exercised only by loopKnowledgeCertification.ts.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no OpenAI, no React, no side effects.
//   - Never throws. Unknown loop/route/role → null or safe empty results.
//   - Reuses existing resolvers by import — does not re-implement page intelligence
//     or completion logic.

import {
  LOOP_KNOWLEDGE,
  ALL_LOOP_KNOWLEDGE,
  type LoopKnowledge,
  type LoopId,
} from '@/lib/donna/loopKnowledge'
import type { DonnaResponseRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'
import {
  resolvePageIntelligence,
  type PageIntelligence,
} from '@/lib/donna/operating/pageContextResolver'
import {
  buildCompletionPath,
  type CompletionPath,
} from '@/lib/donna/operating/pageCompletionEngine'
import type { LivePageState } from '@/lib/donna/operating/livePageState'

// ── Route matching ───────────────────────────────────────────────────────────────
// Segment-aware matching so a concrete pathname matches a canonical route template.
//   - Dynamic template ('.../[sessionId]'): exact segment count; '[x]' matches any
//     one segment; literal segments must be equal. This keeps '/coach/sessions/[id]'
//     from swallowing the longer '/coach/sessions/[id]/wrap-up'.
//   - Literal template ('/director/coaches'): exact match or a section prefix.

function routeMatches(concrete: string, template: string): boolean {
  if (concrete === template) return true
  const c = concrete.split('/').filter(Boolean)
  const t = template.split('/').filter(Boolean)

  if (template.includes('[')) {
    if (c.length !== t.length) return false
    return t.every((seg, i) => seg.startsWith('[') || seg === c[i])
  }

  // Literal template: exact, or concrete is a sub-path of the section.
  if (c.length < t.length) return false
  return t.every((seg, i) => seg === c[i])
}

// ── Lookups ──────────────────────────────────────────────────────────────────────

/** Retrieve loop knowledge by canonical loop id. Null if out of range. */
export function getLoopKnowledgeById(id: number): LoopKnowledge | null {
  return (LOOP_KNOWLEDGE as Record<number, LoopKnowledge>)[id] ?? null
}

/**
 * Retrieve the loop whose primaryRoutes cover this pathname.
 * Returns the most specific match (longest matching template wins). Null for
 * non-loop routes.
 */
export function getLoopKnowledgeForRoute(pathname: string): LoopKnowledge | null {
  if (!pathname) return null
  let best: LoopKnowledge | null = null
  let bestLen = -1
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    for (const template of loop.primaryRoutes) {
      if (routeMatches(pathname, template) && template.length > bestLen) {
        best = loop
        bestLen = template.length
      }
    }
  }
  return best
}

/** All loops where the given role is the primary or a supporting role. */
export function getLoopsForRole(role: DonnaResponseRole): LoopKnowledge[] {
  return ALL_LOOP_KNOWLEDGE.filter(
    loop => loop.primaryRole === role || loop.supportingRoles.includes(role),
  )
}

// ── Composition ──────────────────────────────────────────────────────────────────

export interface LoopAnswerInput {
  id?: number
  route?: string
  role: DonnaResponseRole
  liveState?: LivePageState | null
}

/**
 * A role-scoped, composed answer for a loop: the static loop knowledge merged with
 * the live page intelligence and completion path. This is the shape processDonnaMessage
 * would consume later — but nothing wires it in Sprint 4359.
 */
export interface LoopAnswer {
  loop: LoopKnowledge
  role: DonnaResponseRole
  /** True when the role legitimately participates in this loop. */
  roleInScope: boolean
  /** Page intelligence for the loop's primary route, if available. */
  pageIntelligence: PageIntelligence | null
  /** Completion path for the loop's primary route, if page intel resolves. */
  completionPath: CompletionPath | null
  /** Whether parent/player-safe filtering must be applied to any surfaced text. */
  safeLanguageRequired: boolean
  /** Categories that must never be surfaced to this role for this loop. */
  blockedCategories: string[]
}

/**
 * Compose a role-scoped answer for a loop. Pure — never throws, never mutates,
 * never calls a model. Returns null only when neither id nor route resolves a loop.
 */
export function resolveLoopAnswer(input: LoopAnswerInput): LoopAnswer | null {
  const loop =
    (input.id != null ? getLoopKnowledgeById(input.id) : null) ??
    (input.route ? getLoopKnowledgeForRoute(input.route) : null)
  if (!loop) return null

  const role = input.role
  const roleInScope = loop.primaryRole === role || loop.supportingRoles.includes(role)
  const primaryRoute = loop.primaryRoutes[0] ?? ''
  const liveState = input.liveState ?? null

  const pageIntelligence = primaryRoute
    ? resolvePageIntelligence(primaryRoute, liveState)
    : null
  const completionPath = pageIntelligence
    ? buildCompletionPath(pageIntelligence, undefined, liveState)
    : null

  const safeLanguageRequired = role === 'parent' || role === 'player'
  const blockedCategories =
    role === 'parent' || role === 'player'
      ? loop.parentPlayerVisibilityRules.blockedForParentPlayer
      : []

  return {
    loop,
    role,
    roleInScope,
    pageIntelligence,
    completionPath,
    safeLanguageRequired,
    blockedCategories,
  }
}

/** Convenience: canonical loop id/name pairs for docs and cross-checks. */
export function loopIndex(): Array<{ id: LoopId; name: string }> {
  return ALL_LOOP_KNOWLEDGE.map(l => ({ id: l.id, name: l.name }))
}

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
import {
  applyRolePolicy,
  isResponseSafeForRole,
  type DonnaResponseRole,
} from '@/lib/donna/brain/donnaRoleResponsePolicy'
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

// ── Loop question classification ─────────────────────────────────────────────────
// Deterministic mapping of a user message to one of the 8 loop-guidance questions.
// No model. Conservative — unrecognized phrasing returns null (caller falls back).

export type LoopQuestionKind =
  | 'what' // What is this?
  | 'why' // Why do I need to do this?
  | 'missing' // What is missing?
  | 'next' // What should I do next?
  | 'after' // What happens after this?
  | 'who_sees' // Who can see this?
  | 'approval' // Does this require approval?

export function classifyLoopQuestion(message: string): LoopQuestionKind | null {
  const lower = message.toLowerCase().trim()

  // Order matters: check the more specific intents before the generic ones.
  if (
    lower.includes('who can see') ||
    lower.includes('who sees') ||
    lower.includes('who can view') ||
    lower.includes('visible to parent') ||
    lower.includes('can parents see') ||
    lower.includes('can players see') ||
    lower.includes('who is this visible to')
  ) return 'who_sees'

  if (
    lower.includes('need approval') ||
    lower.includes('needs approval') ||
    lower.includes('require approval') ||
    lower.includes('requires approval') ||
    lower.includes('do i need to approve') ||
    lower.includes('does this need approving') ||
    lower.includes('is approval required')
  ) return 'approval'

  if (
    lower.includes('what happens after') ||
    lower.includes('what comes after') ||
    lower.includes('what happens next after') ||
    lower.includes('what happens when this is done') ||
    lower.includes('after this what') ||
    lower.includes('after i finish')
  ) return 'after'

  if (
    lower.includes('why do i need') ||
    lower.includes('why do i have to') ||
    lower.includes('why does this matter') ||
    lower.includes('why is this important') ||
    lower.includes('why do this') ||
    lower.includes('why bother')
  ) return 'why'

  if (
    lower.includes("what's missing") ||
    lower.includes('what is missing') ||
    lower.includes("what's left") ||
    lower.includes('what is left') ||
    lower.includes('what am i missing') ||
    lower.includes('anything missing')
  ) return 'missing'

  if (
    lower.includes('what is this') ||
    lower.includes("what's this") ||
    lower.includes('what is this page') ||
    lower.includes('what does this do') ||
    lower.includes('what is this for')
  ) return 'what'

  if (
    lower.includes('what do i do next') ||
    lower.includes('what should i do next') ||
    lower.includes('what next') ||
    lower.includes("what's next")
  ) return 'next'

  return null
}

// ── Loop answer formatting ───────────────────────────────────────────────────────
// Renders a grounded, role-scoped answer for a loop question. Pure — no model, no
// writes, no side effects. Static loop knowledge is the source; page intelligence /
// completion path are optional enrichment for 'next' / 'missing'.

export interface FormattedLoopAnswer {
  display: string
  spoken: string
}

/** Neutral, always-safe fallback when a specific answer cannot be surfaced to a role. */
const SAFE_GENERIC =
  'This is part of your academy’s workflow. Your director and coaches manage the details.'

function composeLoopAnswerBody(
  loop: LoopKnowledge,
  kind: LoopQuestionKind,
  answer: LoopAnswer | null,
): string {
  switch (kind) {
    case 'what':
      return loop.purpose
    case 'why':
      return loop.whyItMatters
    case 'after':
      return loop.whatHappensAfter
    case 'who_sees': {
      const audience = loop.parentPlayerVisibilityRules.audience.join(', ')
      return `${loop.parentPlayerVisibilityRules.note} (Audience: ${audience}.)`
    }
    case 'approval':
      return loop.approvalRequirements.requiresApproval
        ? `Yes — ${loop.approvalRequirements.framing}`
        : `No — ${loop.approvalRequirements.framing}`
    case 'next': {
      const live = answer?.completionPath?.nextStep
      return live ? live : (loop.safeNextActions[0] ?? loop.completionCriteria[0] ?? loop.purpose)
    }
    case 'missing': {
      const items = loop.missingStateChecks.slice(0, 3).map(c => `• ${c.unmetMessage}`).join('\n')
      return items
        ? `Here is what may still be needed:\n${items}`
        : (loop.completionCriteria[0] ?? loop.purpose)
    }
    default:
      return loop.purpose
  }
}

/**
 * Build a grounded answer for a loop question. For parent/player roles the output
 * is safety-filtered (never surfaces blocked content) and length-capped. This path
 * is director/coach today, but scoping is applied unconditionally as defense in depth.
 */
export function formatLoopAnswer(
  loop: LoopKnowledge,
  kind: LoopQuestionKind,
  role: DonnaResponseRole,
  liveState?: LivePageState | null,
): FormattedLoopAnswer {
  const answer = resolveLoopAnswer({ id: loop.id, role, liveState: liveState ?? null })
  const body = composeLoopAnswerBody(loop, kind, answer)

  let display = `On **${loop.plainEnglishName}** — ${body}`

  // Defense in depth: parent/player must never receive blocked content.
  if ((role === 'parent' || role === 'player') && !isResponseSafeForRole(display, role)) {
    display = `On **${loop.plainEnglishName}** — ${SAFE_GENERIC}`
  }
  display = applyRolePolicy(display, role)

  const spoken = display.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return { display, spoken }
}

// Mega Sprint 2321–2340 — DONNA Entity Execution Integration V1
// Entity navigation builder: converts a resolved entity + intent into a
// human-readable DONNA confirmation message and a navigation route.
// Pure TypeScript — no DB, no React, no side effects.

import type { ResolvedEntityV2 } from './donnaEntityResolver'
import type { EntityIntentResult } from './donnaEntityIntentRouter'

// ── Result ─────────────────────────────────────────────────────────────────────

export interface EntityNavigationResponse {
  message:        string
  spokenMessage:  string
  navigateTo:     string | null
  shouldNavigate: boolean
}

// ── Per-kind message builders ─────────────────────────────────────────────────

function buildPlayerMessage(entity: ResolvedEntityV2, intent: EntityIntentResult): string {
  const name = entity.displayName
  switch (intent.kind) {
    case 'query':   return `Here's what I know about ${name}. Opening their profile now.`
    case 'improve':
    case 'status':  return `Opening ${name}'s profile for a closer look.`
    default:        return `Opening ${name}'s profile.`
  }
}

function buildCurriculumMessage(entity: ResolvedEntityV2, intent: EntityIntentResult): string {
  const name = entity.displayName
  switch (intent.kind) {
    case 'improve': return `Taking you to the ${name} curriculum view.`
    case 'status':  return `Opening ${name} curriculum — let me pull that up.`
    case 'query':   return `Here's the ${name} curriculum overview.`
    default:        return `Opening ${name} in the curriculum.`
  }
}

function buildGroupMessage(entity: ResolvedEntityV2): string {
  return `Opening the ${entity.displayName} group.`
}

function buildTemplateMessage(entity: ResolvedEntityV2): string {
  return `Opening template: ${entity.displayName}.`
}

function buildAssessmentMessage(entity: ResolvedEntityV2): string {
  return `Opening ${entity.displayName} assessment view.`
}

function buildCoachMessage(entity: ResolvedEntityV2): string {
  return `Opening ${entity.displayName}'s coach profile.`
}

function buildGenericMessage(entity: ResolvedEntityV2, intent: EntityIntentResult): string {
  switch (intent.kind) {
    case 'query':  return `Here's what I have on ${entity.displayName}.`
    default:       return `Opening ${entity.displayName}.`
  }
}

// ── Confidence label for spoken response ─────────────────────────────────────

function buildLowConfidencePrefix(entity: ResolvedEntityV2): string {
  if (entity.confidence < 0.72) {
    return `I think you mean ${entity.displayName} — `
  }
  return ''
}

// ── Main builder ───────────────────────────────────────────────────────────────

/**
 * Builds a DONNA confirmation message and navigation route for a resolved entity.
 *
 * - shouldNavigate is false when the entity has no route (e.g. assessment type match
 *   with no specific ID yet). The caller should use `respond` action instead of `navigate`.
 */
export function buildEntityNavigationResponse(
  entity: ResolvedEntityV2,
  intent: EntityIntentResult,
): EntityNavigationResponse {
  const prefix = buildLowConfidencePrefix(entity)

  let message: string
  switch (entity.kind) {
    case 'player':           message = prefix + buildPlayerMessage(entity, intent); break
    case 'curriculum_level': message = prefix + buildCurriculumMessage(entity, intent); break
    case 'group':            message = prefix + buildGroupMessage(entity); break
    case 'template':         message = prefix + buildTemplateMessage(entity); break
    case 'assessment':       message = prefix + buildAssessmentMessage(entity); break
    case 'coach':            message = prefix + buildCoachMessage(entity); break
    default:                 message = prefix + buildGenericMessage(entity, intent)
  }

  const hasRoute = typeof entity.route === 'string' && entity.route.length > 0

  return {
    message,
    spokenMessage:  message,
    navigateTo:     hasRoute ? entity.route! : null,
    shouldNavigate: hasRoute,
  }
}

// ── Low-confidence respond message (no auto-navigation) ──────────────────────

/**
 * For entities resolved at 0.50–0.72 confidence: DONNA offers to navigate
 * but asks for confirmation rather than navigating automatically.
 */
export function buildEntityConfirmMessage(
  entity: ResolvedEntityV2,
): string {
  const name = entity.displayName
  const kind = entity.kind.replace('_', ' ')
  return `I found a ${kind} called **${name}**. Is that the one you meant? (Say "yes" or "open it" to continue.)`
}

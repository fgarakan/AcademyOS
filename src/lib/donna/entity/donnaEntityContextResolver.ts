// Mega Sprint 2291–2320 — DONNA Academy Entity Intelligence V1
// Page-aware context resolver: boosts confidence for entity kinds preferred on the current route.
// Pure TypeScript — no DB calls, no React, no side effects.

import { toConfidenceLevel } from '@/lib/donna/intent/confidenceScoring'
import type { EntityKind, EntityResolveResult, ResolvedEntityV2, AcademyEntityContext, EntityResolveOptions } from './donnaEntityResolver'
import { resolveEntityV2 } from './donnaEntityResolver'

// ── Route → preferred entity kinds ──────────────────────────────────────────

interface RoutePreference {
  pattern:        RegExp
  preferredKinds: EntityKind[]
  boost:          number   // confidence boost to apply (additive, capped at 1.0)
}

const ROUTE_PREFERENCES: RoutePreference[] = [
  // Player profile — boost player + assessment
  { pattern: /^\/director\/players\/[^/]+/, preferredKinds: ['player', 'assessment'], boost: 0.12 },
  // Players list — boost player
  { pattern: /^\/director\/players/,        preferredKinds: ['player'],               boost: 0.10 },
  // Curriculum — boost level + template
  { pattern: /^\/director\/curriculum/,     preferredKinds: ['curriculum_level', 'template'], boost: 0.12 },
  // Class templates
  { pattern: /^\/director\/class-templates/, preferredKinds: ['template'],            boost: 0.10 },
  // Fitness templates
  { pattern: /^\/director\/fitness/,        preferredKinds: ['template'],             boost: 0.10 },
  // Sessions — boost session + group
  { pattern: /^\/director\/sessions/,       preferredKinds: ['session', 'group'],     boost: 0.10 },
  // Groups — boost group
  { pattern: /^\/director\/groups/,         preferredKinds: ['group'],                boost: 0.12 },
  // Review queue — boost assessment + player
  { pattern: /^\/director\/review/,         preferredKinds: ['assessment', 'player'], boost: 0.10 },
  // Director home — balanced, slight player boost
  { pattern: /^\/director$/,               preferredKinds: ['player'],               boost: 0.05 },
]

// ── Lookup preferred kinds for a route ───────────────────────────────────────

export function getPreferredKindsForRoute(route: string): EntityKind[] {
  for (const pref of ROUTE_PREFERENCES) {
    if (pref.pattern.test(route)) return pref.preferredKinds
  }
  return []
}

function getBoostForRoute(route: string): number {
  for (const pref of ROUTE_PREFERENCES) {
    if (pref.pattern.test(route)) return pref.boost
  }
  return 0
}

// ── Apply page context to a resolved result ───────────────────────────────────

/**
 * Re-scores candidates in an EntityResolveResult by boosting kinds that are preferred
 * on the current route. Re-runs the top/second ambiguity check after re-scoring.
 */
export function applyPageContext(
  result:       EntityResolveResult,
  currentRoute: string,
): EntityResolveResult {
  if (result.candidates.length === 0) return result

  const preferredKinds = getPreferredKindsForRoute(currentRoute)
  if (preferredKinds.length === 0) return result

  const boost = getBoostForRoute(currentRoute)

  const reboosted: ResolvedEntityV2[] = result.candidates.map(c => {
    if (preferredKinds.includes(c.kind)) {
      const conf = Math.min(c.confidence + boost, 1.0)
      return { ...c, confidence: conf, confidenceLevel: toConfidenceLevel(conf) }
    }
    return c
  })

  const sorted = reboosted.sort((a, b) => b.confidence - a.confidence)
  const top    = sorted[0]
  const second = sorted[1]

  const isAmbiguous =
    second !== undefined &&
    second.confidence >= 0.35 &&
    top.confidence - second.confidence < 0.15 &&
    top.kind !== second.kind

  if (isAmbiguous) {
    return { entity: null, noEntityFound: false, needsDisambiguation: true, candidates: sorted }
  }

  if (top.confidence < 0.35) {
    return { entity: null, noEntityFound: true, needsDisambiguation: false, candidates: sorted }
  }

  return { entity: top, noEntityFound: false, needsDisambiguation: false, candidates: sorted }
}

// ── Convenience: resolve with page context in one call ────────────────────────

/**
 * Resolves an entity from text and immediately applies page-context boosting.
 * This is the recommended entry point for page-aware entity resolution.
 */
export function resolveEntityWithContext(
  text:         string,
  ctx:          AcademyEntityContext,
  currentRoute: string,
  opts:         EntityResolveOptions = {},
): EntityResolveResult {
  const preferredKinds = getPreferredKindsForRoute(currentRoute)
  const mergedOpts: EntityResolveOptions = {
    ...opts,
    preferredKinds: [
      ...(opts.preferredKinds ?? []),
      ...preferredKinds,
    ],
  }
  const raw = resolveEntityV2(text, ctx, mergedOpts)
  return applyPageContext(raw, currentRoute)
}

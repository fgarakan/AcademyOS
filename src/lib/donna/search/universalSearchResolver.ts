// Sprint 1731 — DONNA Universal Academy Search V1
// In-memory resolver for entity types not covered by entityResolution.ts.
// All functions are pure TypeScript — no DB calls, no mutations.
// Uses data already loaded in DirectorDonnaContext (playerCurriculumStateSummaries,
// templateSummaries, assessmentSummaries, groupSummaries, playerProgressStalls).
//
// Resolution order in resolveUniversalFallback():
//   1. Full roster player lookup (playerCurriculumStateSummaries, cap 30)
//   2. Template name search (templateSummaries)
//   3. Session route detection
//   4. Assessment-for-player lookup
//   5. Coach honest fallback (names not loaded in ctx)
//   6. No-match honest response — never invents a route
//
// V1 known limitations:
//   - Player search is capped at the 30 players in playerCurriculumStateSummaries.
//   - Coach names are not available in DirectorDonnaContext — honest fallback only.
//   - Assessment routing lands on player profile (no dedicated assessment tab route yet).

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { PlayerCurriculumStateSummary, TemplateSummary, AssessmentSummary } from '@/lib/donna/extendedContextLoaders'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'
import type { ResolutionResult, ResolvedEntity, EntityKind } from '@/lib/donna/workflows/entityResolution'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

/** Extract a candidate name from natural language text. */
function extractNameFromText(text: string): string | null {
  // "review Jamie", "open Jamie", "why is Jamie stuck", "find assessment for Jamie"
  const m = text.match(
    /(?:review|open|show|find|take me to|why is|why isn'?t|help|what about|check on|guide me through|assessment for|profile for|latest assessment for)\s+([A-Z][a-z]{1,20})(?:'s?|\s|$)/i,
  )
  return m ? m[1].toLowerCase() : null
}

/** Build a ResolvedEntity for a player from a curriculum state summary. */
function playerEntityFromSummary(s: PlayerCurriculumStateSummary): ResolvedEntity {
  const levelNote = s.currentLevelDisplayName ? ` — ${s.currentLevelDisplayName}` : ''
  return {
    kind:     'player' as EntityKind,
    route:    `/director/players/${s.playerId}`,
    focusId:  'player-profile-header',
    label:    s.playerName,
    specific: true,
    entityId: s.playerId,
    message:  `Opening ${s.playerName}'s profile${levelNote}.`,
  }
}

// ─── 1. Full roster player lookup ─────────────────────────────────────────────

/**
 * Search the full loaded roster (playerCurriculumStateSummaries, max 30).
 * Falls back to this when attentionItems lookup finds nothing.
 */
export function resolvePlayerFromFullRoster(
  text: string,
  summaries: PlayerCurriculumStateSummary[],
): ResolutionResult {
  const candidateName = extractNameFromText(text)

  if (!candidateName) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: "I couldn't identify a player name in that request. Try: \"Open [player name]\".",
    }
  }

  if (summaries.length === 0) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: `I don't have roster data loaded right now. Try navigating to the Players list directly.`,
    }
  }

  const matches = summaries.filter(s => {
    const name = normalize(s.playerName)
    const first = name.split(' ')[0]
    return first === candidateName || name.includes(candidateName)
  })

  if (matches.length === 0) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: `I don't see a player named "${candidateName}" in the loaded roster (${summaries.length} players shown). They may not be in the first 30 loaded, or the name may differ. Try the Players directory.`,
    }
  }

  const candidates = matches.slice(0, 3).map(playerEntityFromSummary)

  if (candidates.length === 1) {
    return { resolved: true, entity: candidates[0], ambiguous: false, candidates, fallback: '' }
  }

  const names = candidates.map(c => `"${c.label}"`).join(', ')
  return {
    resolved: false, entity: null, ambiguous: true, candidates,
    fallback: `I found ${candidates.length} players matching "${candidateName}": ${names}. Which one did you mean?`,
  }
}

// ─── 2. Template name search ──────────────────────────────────────────────────

/** Derive template route from templateType and id. */
function templateRoute(id: string, templateType: string | null): string {
  if (templateType === 'fitness') return `/director/fitness/templates/${id}`
  if (templateType === 'class') return `/director/class-templates/${id}`
  // For assessment, drill, or unknown types — fall back to the general templates list.
  return `/director/templates`
}

/**
 * Find a template by partial name match from loaded summaries.
 * Returns the best single match, null if none or if multiple (let caller decide).
 */
export function resolveTemplateByName(
  text: string,
  summaries: TemplateSummary[],
): ResolvedEntity | null {
  if (summaries.length === 0) return null

  // Extract candidate — look for a quoted name or the word after "template"
  const quotedMatch = text.match(/["']([^"']{3,60})["']/i)
  const templateWordMatch = text.match(/(?:template|drill|session plan)\s+(?:called\s+|named\s+)?["']?([A-Z][a-z].{2,40})["']?/i)
  const openShowMatch = text.match(/^(?:open|show|find|take me to)\s+(.{3,60})$/i)

  const rawQuery = quotedMatch?.[1] ?? templateWordMatch?.[1] ?? openShowMatch?.[1] ?? null
  if (!rawQuery) return null

  const query = normalize(rawQuery)

  const matches = summaries.filter(s => normalize(s.name).includes(query))

  if (matches.length === 0) return null
  if (matches.length > 1) {
    // Prefer exact-start match
    const exact = matches.find(s => normalize(s.name).startsWith(query))
    if (!exact) return null
    const route = templateRoute(exact.templateId, exact.templateType)
    return {
      kind: 'template' as EntityKind,
      route,
      focusId: 'template-header',
      label: exact.name,
      specific: true,
      entityId: exact.templateId,
      message: `Opening template "${exact.name}".`,
    }
  }

  const m = matches[0]
  const route = templateRoute(m.templateId, m.templateType)
  return {
    kind: 'template' as EntityKind,
    route,
    focusId: 'template-header',
    label: m.name,
    specific: true,
    entityId: m.templateId,
    message: `Opening template "${m.name}".`,
  }
}

// ─── 3. Session routing ────────────────────────────────────────────────────────

/**
 * Route session-related queries to the sessions list.
 * "Show today's sessions", "Open sessions", "What sessions do we have?"
 */
export function resolveSessionRoute(text: string): ResolvedEntity | null {
  if (!/\bsessions?\b/i.test(text)) return null

  const isToday = /\b(today'?s?|current|upcoming|now)\b/i.test(text)
  const label = isToday ? "Today's Sessions" : "Sessions"
  const message = isToday
    ? "Opening today's sessions."
    : "Opening the sessions list."

  return {
    kind: 'session' as EntityKind,
    route: '/director/sessions',
    focusId: 'sessions-list',
    label,
    specific: false,
    entityId: null,
    message,
  }
}

// ─── 4. Assessment-for-player lookup ─────────────────────────────────────────

/**
 * Find the latest assessment for a named player.
 * Cross-references assessmentSummaries with playerCurriculumStateSummaries for name resolution.
 */
export function resolveAssessmentForPlayer(
  text: string,
  ctx: DirectorDonnaContext,
): ResolutionResult {
  // Resolve player first
  const playerResult = resolvePlayerFromFullRoster(text, ctx.playerCurriculumStateSummaries)

  if (!playerResult.resolved && !playerResult.ambiguous) {
    return playerResult
  }
  if (playerResult.ambiguous) {
    return playerResult
  }

  const player = playerResult.entity!
  const playerId = player.entityId

  if (!playerId) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: `I found ${player.label} but couldn't get their ID. Try opening their profile directly.`,
    }
  }

  const assessments = ctx.assessmentSummaries
    .filter(a => a.playerId === playerId)
    .sort((a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime())

  if (assessments.length === 0) {
    // Player found, but no assessment — route to profile with helpful note
    return {
      resolved: true,
      entity: {
        kind:     'assessment' as EntityKind,
        route:    `/director/players/${playerId}`,
        focusId:  'player-profile-header',
        label:    player.label,
        specific: true,
        entityId: playerId,
        message:  `No assessments found for ${player.label} yet. Opening their profile.`,
      },
      ambiguous: false, candidates: [], fallback: '',
    }
  }

  const latest = assessments[0]
  const dateStr = latest.assessedDate
    ? new Date(latest.assessedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'date unknown'
  const readyNote = latest.promotionReady ? ' — promotion-ready signal on file' : ''

  return {
    resolved: true,
    entity: {
      kind:     'assessment' as EntityKind,
      route:    `/director/players/${playerId}`,
      focusId:  'player-profile-header',
      label:    player.label,
      specific: true,
      entityId: playerId,
      message:  `Opening ${player.label}'s profile. Latest assessment: ${latest.type} on ${dateStr}${readyNote}.`,
    },
    ambiguous: false, candidates: [], fallback: '',
  }
}

// ─── 5. Coach routing (honest fallback) ───────────────────────────────────────

/**
 * Coach names are not loaded in DirectorDonnaContext.
 * Returns an honest fallback — never invents a coach route.
 */
export function resolveCoachByName(text: string): ResolutionResult {
  // Extract candidate coach name
  const m = text.match(/(?:open|show|find|review|take me to)\s+(?:coach\s+)?([A-Z][a-z]{1,20})/i)
  const name = m ? m[1] : null

  const msg = name
    ? `I don't have coach profile links loaded in my current context. Search for "${name}" in the Players directory, or ask your academy admin to link coach accounts.`
    : `Coach profiles aren't directly accessible via voice yet. Try the Players directory or the director dashboard.`

  return {
    resolved: false, entity: null, ambiguous: false, candidates: [],
    fallback: msg,
  }
}

// ─── 6. Parent update routing ─────────────────────────────────────────────────

/**
 * Route parent-update and review queue queries.
 * Extends the existing reviewQueue resolver with more patterns.
 */
export function resolveParentUpdateRoute(text: string): ResolvedEntity | null {
  if (!/\b(parent (updates?|communication|messages?|queue)|pending parent|open parent)\b/i.test(text)) {
    return null
  }
  return {
    kind: 'review_queue' as EntityKind,
    route: '/director/review',
    focusId: 'review-queue-primary',
    label: 'Parent Updates',
    specific: false,
    entityId: null,
    message: 'Opening the Review Center — Parent Updates tab.',
  }
}

// ─── 7. "Why is X stuck?" resolver ────────────────────────────────────────────

export interface WhyStuckResult {
  found: boolean
  playerName: string | null
  route: string | null
  message: string
}

/**
 * Builds a "why is X stuck / not advancing?" answer.
 * Resolves player from full roster, then checks playerProgressStalls.
 */
export function buildWhyStuckAnswer(
  text: string,
  ctx: DirectorDonnaContext,
): WhyStuckResult {
  const playerResult = resolvePlayerFromFullRoster(text, ctx.playerCurriculumStateSummaries)

  if (!playerResult.resolved) {
    if (playerResult.ambiguous) {
      const names = playerResult.candidates.map(c => `"${c.label}"`).join(' or ')
      return {
        found: false, playerName: null, route: null,
        message: `I found multiple players matching that name: ${names}. Which one did you mean?`,
      }
    }
    return {
      found: false, playerName: null, route: null,
      message: playerResult.fallback || "I couldn't find that player in the loaded roster.",
    }
  }

  const player = playerResult.entity!
  const stall = ctx.playerProgressStalls.find(s => s.playerId === player.entityId)

  if (!stall) {
    // Player found, no stall recorded
    const summary = ctx.playerCurriculumStateSummaries.find(s => s.playerId === player.entityId)
    const levelNote = summary?.currentLevelDisplayName ? ` at ${summary.currentLevelDisplayName}` : ''
    const eligibleNote = summary?.advancementEligible
      ? ` They are currently marked advancement-eligible — review their assessment evidence and confirm promotion.`
      : ''
    return {
      found: true,
      playerName: player.label,
      route: player.route,
      message: [
        `${player.label} doesn't have a recorded progress stall${levelNote}.${eligibleNote}`,
        `Open their profile to review observations, gate evidence, and assessment history.`,
      ].join(' '),
    }
  }

  // Stall found — build answer from stall data
  const days = stall.daysAtCurrentLevel
  const dayNote = ` for ${days} day${days !== 1 ? 's' : ''}`
  const level = stall.currentLevelDisplayName ?? 'their current level'
  const severityNote = stall.stallSeverity === 'high' ? 'This is a high-severity stall.' : ''
  const message = [
    `${player.label} has been at ${level}${dayNote} without advancing.`,
    severityNote,
    `Open their profile to review gate evidence and assessment history, then decide whether to advance or flag for coach follow-up.`,
  ].filter(Boolean).join(' ')

  return {
    found: true,
    playerName: player.label,
    route: player.route,
    message,
  }
}

// ─── 8. Universal fallback — called after existing resolvers fail ─────────────

/**
 * Tries entity types not covered by entityResolution.ts:
 * full-roster player → template → session → assessment → coach.
 * Returns the first successful match, or an honest no-match response.
 */
export function resolveUniversalFallback(
  text: string,
  ctx: DirectorDonnaContext | null,
): ResolutionResult {
  // 1. Full roster player lookup
  if (ctx && ctx.playerCurriculumStateSummaries.length > 0) {
    const rosterResult = resolvePlayerFromFullRoster(text, ctx.playerCurriculumStateSummaries)
    if (rosterResult.resolved || rosterResult.ambiguous) return rosterResult
  }

  // 2. Template name search
  if (ctx && ctx.templateSummaries.length > 0) {
    const templateEntity = resolveTemplateByName(text, ctx.templateSummaries)
    if (templateEntity) {
      return { resolved: true, entity: templateEntity, ambiguous: false, candidates: [templateEntity], fallback: '' }
    }
  }

  // 3. Session routing
  const sessionEntity = resolveSessionRoute(text)
  if (sessionEntity) {
    return { resolved: true, entity: sessionEntity, ambiguous: false, candidates: [sessionEntity], fallback: '' }
  }

  // 4. Parent update routing (more patterns than entityResolution's reviewQueue)
  const parentEntity = resolveParentUpdateRoute(text)
  if (parentEntity) {
    return { resolved: true, entity: parentEntity, ambiguous: false, candidates: [parentEntity], fallback: '' }
  }

  // 5. Assessment-for-player lookup (needs ctx for both player + assessment data)
  if (ctx && /\bassessment\b/i.test(text)) {
    const assessResult = resolveAssessmentForPlayer(text, ctx)
    if (assessResult.resolved || assessResult.ambiguous) return assessResult
  }

  // 6. Coach routing — always returns honest fallback when "coach" or known coach verb present
  if (/\bcoach\b/i.test(text)) {
    return resolveCoachByName(text)
  }

  // Nothing matched
  return {
    resolved: false, entity: null, ambiguous: false, candidates: [],
    fallback: `I couldn't find what you're looking for. Try: "Open [player name]", "Show [template name]", "Show today's sessions", or "Open parent updates".`,
  }
}

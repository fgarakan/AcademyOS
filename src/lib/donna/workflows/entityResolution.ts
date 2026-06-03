// Sprint 1721 — DONNA Entity Resolution V1
// Sprint 1731 — Extended to full-roster player lookup, templates, sessions,
//               assessments, coaches via universalSearchResolver fallback.
// Resolves natural-language entity references to concrete routes.
// "Review Jamie" → /director/players/{uuid}
// "Open Orange Ball 2" → /director/curriculum?improve=orange_ball_2
// "Review parent updates" → /director/review
// "Open Coach Alex" → honest fallback (names not in ctx)
// "Show today's sessions" → /director/sessions
//
// Design rules:
//   - Pure TypeScript. No DB calls. No mutations.
//   - Conservative: if ambiguous, returns multiple matches for clarification.
//   - If no match, returns honest "no match" — never invents a route.
//   - Case-insensitive matching. Partial first-name match supported.

import type { DirectorAttentionItem } from '@/lib/donna/directorDonnaContext'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { resolveUniversalFallback } from '@/lib/donna/search/universalSearchResolver'

// ─── Types ─────────────────────────────────────────────────────────────────────

// Sprint 1731: extended with template, session, assessment, coach kinds
export type EntityKind = 'player' | 'curriculum_level' | 'review_queue' | 'template' | 'session' | 'assessment' | 'coach' | 'unknown'

export interface ResolvedEntity {
  kind:         EntityKind
  /** Route to navigate to */
  route:        string
  /** data-donna-focus-id target */
  focusId:      string
  /** Human-readable label */
  label:        string
  /** True when resolved to a specific entity (false = category-level) */
  specific:     boolean
  /** ID of the resolved entity (playerId, levelKey, etc.) */
  entityId:     string | null
  /** DONNA message confirming resolution */
  message:      string
}

export interface ResolutionResult {
  resolved:   boolean
  entity:     ResolvedEntity | null
  /** True when multiple matches were found and clarification is needed */
  ambiguous:  boolean
  /** The candidates when ambiguous (max 3) */
  candidates: ResolvedEntity[]
  /** Honest message when not resolved */
  fallback:   string
}

// ─── Level key map (mirrors DonnaCurriculumContextPanel) ───────────────────────

const LEVEL_KEY_MAP: Array<{ pattern: RegExp; key: string; label: string }> = [
  { pattern: /red ball? ?1|r1\b/i,         key: 'red_ball_1',    label: 'Red Ball 1' },
  { pattern: /red ball? ?2|r2\b/i,         key: 'red_ball_2',    label: 'Red Ball 2' },
  { pattern: /red ball? ?3|r3\b/i,         key: 'red_ball_3',    label: 'Red Ball 3' },
  { pattern: /red ball\b/i,                key: 'red_ball',      label: 'Red Ball' },
  { pattern: /orange ball? ?1|o1\b/i,      key: 'orange_ball_1', label: 'Orange Ball 1' },
  { pattern: /orange ball? ?2|o2\b/i,      key: 'orange_ball_2', label: 'Orange Ball 2' },
  { pattern: /orange ball? ?3|o3\b/i,      key: 'orange_ball_3', label: 'Orange Ball 3' },
  { pattern: /orange ball\b/i,             key: 'orange_ball',   label: 'Orange Ball' },
  { pattern: /green (dot|ball)? ?1|g1\b/i, key: 'green_dot_1',   label: 'Green Dot 1' },
  { pattern: /green (dot|ball)? ?2|g2\b/i, key: 'green_dot_2',   label: 'Green Dot 2' },
  { pattern: /green (dot|ball)\b/i,        key: 'green_dot',     label: 'Green Dot' },
  { pattern: /yellow ball? ?1|y1\b/i,      key: 'yellow_ball_1', label: 'Yellow Ball 1' },
  { pattern: /yellow ball? ?2|y2\b/i,      key: 'yellow_ball_2', label: 'Yellow Ball 2' },
  { pattern: /yellow ball\b/i,             key: 'yellow_ball',   label: 'Yellow Ball' },
  { pattern: /high.?perf(ormance)?\b/i,    key: 'high_performance', label: 'High Performance' },
]

// ─── Player resolution ──────────────────────────────────────────────────────────

function normalizeName(s: string): string {
  return s.toLowerCase().trim()
}

/**
 * Resolve a player name from text using available attention items.
 * Returns all matching candidates (case-insensitive first-name match).
 */
export function resolvePlayerFromText(
  text: string,
  attentionItems: DirectorAttentionItem[],
): ResolutionResult {
  // Extract potential player name from text
  // Patterns: "review Jamie", "open Jamie", "why is Jamie", "Jamie's profile", "take me to Jamie"
  const nameMatch = text.match(
    /(?:review|open|show|find|take me to|why is|help|what about|check on|guide me through)\s+([A-Z][a-z]{1,20})(?:'s|\s|$)/i
  )
  const candidateName = nameMatch ? nameMatch[1].toLowerCase() : null

  if (!candidateName) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: "I couldn't identify a player name in that request. Try: \"Review [player name]\".",
    }
  }

  const playersWithIds = attentionItems.filter(
    a => a.playerId && a.playerName
  )

  if (playersWithIds.length === 0) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: `I don't have any attention-flagged players loaded right now. Ask "Who needs attention?" first, then try again.`,
    }
  }

  const matches = playersWithIds.filter(a => {
    const firstName = normalizeName(a.playerName!).split(' ')[0]
    return firstName === candidateName ||
      normalizeName(a.playerName!).includes(candidateName)
  })

  if (matches.length === 0) {
    return {
      resolved: false, entity: null, ambiguous: false, candidates: [],
      fallback: `I don't have a player named "${nameMatch![1]}" in the current attention list. They may not have any active attention flags, or the name may be different. Ask "Who needs attention?" to see the current list.`,
    }
  }

  const candidates: ResolvedEntity[] = matches.slice(0, 3).map(a => ({
    kind:     'player' as EntityKind,
    route:    `/director/players/${a.playerId}`,
    focusId:  'player-profile-header',
    label:    a.playerName!,
    specific: true,
    entityId: a.playerId,
    message:  `Opening ${a.playerName}'s profile.`,
  }))

  if (candidates.length === 1) {
    return { resolved: true, entity: candidates[0], ambiguous: false, candidates, fallback: '' }
  }

  // Multiple matches — ambiguous
  const names = candidates.map(c => c.label).join(', ')
  return {
    resolved: false, entity: null, ambiguous: true, candidates,
    fallback: `I found ${candidates.length} players matching "${nameMatch![1]}": ${names}. Which one did you mean?`,
  }
}

// ─── Curriculum level resolution ───────────────────────────────────────────────

export function resolveCurriculumLevel(text: string): ResolvedEntity | null {
  for (const { pattern, key, label } of LEVEL_KEY_MAP) {
    if (pattern.test(text)) {
      return {
        kind:     'curriculum_level',
        route:    `/director/curriculum?improve=${key}`,
        focusId:  'donna-curriculum-context',
        label,
        specific: true,
        entityId: key,
        message:  `Opening ${label} curriculum.`,
      }
    }
  }
  return null
}

// ─── Review queue resolution ───────────────────────────────────────────────────

export function resolveReviewQueue(text: string): ResolvedEntity | null {
  if (/\b(parent (updates?|communication)|parent)\b/i.test(text)) {
    return {
      kind: 'review_queue', route: '/director/review', focusId: 'review-queue-primary',
      label: 'Parent Updates', specific: false, entityId: null,
      message: 'Opening the Review Center — Parent Updates tab.',
    }
  }
  if (/\b(placement|placements?)\b/i.test(text)) {
    return {
      kind: 'review_queue', route: '/director/review', focusId: 'review-queue-primary',
      label: 'Placement Review', specific: false, entityId: null,
      message: 'Opening the Review Center — Placement Review.',
    }
  }
  if (/\b(review (queue|center)|approval|approvals?)\b/i.test(text)) {
    return {
      kind: 'review_queue', route: '/director/review', focusId: 'review-queue-primary',
      label: 'Review Center', specific: false, entityId: null,
      message: 'Opening the Review Center.',
    }
  }
  return null
}

// ─── Unified resolver ──────────────────────────────────────────────────────────

/**
 * Resolves any entity reference from natural language text.
 * Sprint 1721: player → curriculum level → review queue
 * Sprint 1731: + full roster player fallback → universal resolver (templates, sessions,
 *              assessments, coaches) via resolveUniversalFallback().
 */
export function resolveEntityFromText(
  text: string,
  ctx: DirectorDonnaContext | null,
): ResolutionResult {
  // 1. Try player name resolution from attention items (fast path — already flagged)
  if (ctx?.attentionItems && ctx.attentionItems.length > 0) {
    const playerResult = resolvePlayerFromText(text, ctx.attentionItems)
    if (playerResult.resolved || playerResult.ambiguous) {
      return playerResult
    }
  }

  // 2. Try curriculum level
  const levelEntity = resolveCurriculumLevel(text)
  if (levelEntity) {
    return { resolved: true, entity: levelEntity, ambiguous: false, candidates: [levelEntity], fallback: '' }
  }

  // 3. Try review queue
  const reviewEntity = resolveReviewQueue(text)
  if (reviewEntity) {
    return { resolved: true, entity: reviewEntity, ambiguous: false, candidates: [reviewEntity], fallback: '' }
  }

  // 4. Sprint 1731: universal fallback — full roster, templates, sessions, assessments, coaches
  if (ctx) {
    const universalResult = resolveUniversalFallback(text, ctx)
    if (universalResult.resolved || universalResult.ambiguous) {
      return universalResult
    }
    // Return the universal fallback message (more informative than a generic one)
    if (universalResult.fallback) return universalResult
  }

  // Not resolved
  return {
    resolved: false, entity: null, ambiguous: false, candidates: [],
    fallback: `I couldn't identify what you'd like to open. Try: "Open [player name]", "Show Orange Ball 2", "Show today's sessions", or "Open parent updates".`,
  }
}

// ─── Universal deep link patterns ─────────────────────────────────────────────

/**
 * True when text is a universal "open/navigate to entity" command.
 * Used to intercept before other handlers.
 */
export function isDeepLinkCommand(text: string): boolean {
  return /^(open|show|take me to|find|review|help|guide me through|what about|check on|why is)\s+\w/i.test(text.trim())
}

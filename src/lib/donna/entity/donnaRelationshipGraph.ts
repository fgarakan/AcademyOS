// Mega Sprint 2291–2320 — DONNA Academy Entity Intelligence V1
// Relationship graph: resolves NL queries about entity relationships and pronouns.
// Examples: "Jake's parent", "Who coaches Jake?", "What group is Alessia in?",
//           "Who is in Orange Ball 2?", "he" / "she" / "they" → last resolved entity.
// Pure TypeScript — no DB calls, no React, no side effects.

import type { AcademyEntityContext, ResolvedEntityV2, EntityKind } from './donnaEntityResolver'
import { resolveEntityV2 } from './donnaEntityResolver'
import { toConfidenceLevel } from '@/lib/donna/intent/confidenceScoring'

// ── Result type ───────────────────────────────────────────────────────────────

export interface RelationshipQueryResult {
  resolved:        ResolvedEntityV2 | null
  message:         string
  confidence:      number
  isRelationship:  boolean
}

// ── Relationship kind ─────────────────────────────────────────────────────────

type RelationKind = 'parent' | 'coach' | 'group' | 'members' | 'assessment' | 'pronoun'

// ── Relationship detection patterns ──────────────────────────────────────────

interface RelationshipPattern {
  kind:      RelationKind
  patterns:  RegExp[]
}

const RELATIONSHIP_PATTERNS: RelationshipPattern[] = [
  {
    kind: 'parent',
    patterns: [
      /\b(\w+)'s?\s+(parent|mom|dad|mother|father|guardian|family)\b/i,
      /\bparent\s+of\s+(\w+)\b/i,
      /\bwho\s+is\s+(\w+)'s?\s+(parent|guardian)\b/i,
    ],
  },
  {
    kind: 'coach',
    patterns: [
      /\bwho\s+(coaches|is\s+coaching|trains)\s+(\w+)\b/i,
      /\b(\w+)'s?\s+coach\b/i,
      /\bcoach\s+of\s+(\w+)\b/i,
      /\bwho\s+is\s+(\w+)'s?\s+coach\b/i,
    ],
  },
  {
    kind: 'group',
    patterns: [
      /\bwhat\s+group\s+is\s+(\w+)\b/i,
      /\b(\w+)'s?\s+group\b/i,
      /\bwhat\s+(class|team|group)\s+is\s+(\w+)\s+in\b/i,
      /\bwhich\s+group\s+is\s+(\w+)\b/i,
    ],
  },
  {
    kind: 'members',
    patterns: [
      /\bwho\s+is\s+in\b/i,
      /\bplayers?\s+in\b/i,
      /\bwho\s+plays?\s+in\b/i,
      /\bmembers?\s+of\b/i,
    ],
  },
]

// ── Pronoun patterns ──────────────────────────────────────────────────────────

const PRONOUN_RE = /^\s*(he|she|they|him|her|them|his|hers|their|it)\b/i

// ── Entity name extraction helpers ───────────────────────────────────────────

// Extract the person name from relationship query patterns like "Jake's parent"
function extractSubjectFromPossessive(text: string): string | null {
  const m = text.match(/\b(\w+)'s?\s+(?:parent|mom|dad|mother|father|guardian|coach|group|class|team|assessment)\b/i)
  return m ? m[1] : null
}

function extractSubjectFromWhoCoaches(text: string): string | null {
  const m = text.match(/\bwho\s+(?:coaches|is\s+coaching|trains)\s+(\w+)\b/i)
  return m ? m[1] : null
}

function extractSubjectFromWhatGroup(text: string): string | null {
  const m1 = text.match(/\bwhat\s+(?:group|class|team)\s+is\s+(\w+)\s+in\b/i)
  if (m1) return m1[1]
  const m2 = text.match(/\bwhich\s+group\s+is\s+(\w+)\b/i)
  return m2 ? m2[1] : null
}

// ── Detect if text is a relationship query ────────────────────────────────────

export function isRelationshipQuery(text: string): boolean {
  if (PRONOUN_RE.test(text.trim())) return true
  for (const { patterns } of RELATIONSHIP_PATTERNS) {
    if (patterns.some(re => re.test(text))) return true
  }
  return false
}

// ── Resolve pronoun ───────────────────────────────────────────────────────────

function resolvePronoun(
  lastEntity: ResolvedEntityV2,
  text:       string,
): RelationshipQueryResult {
  const pronoun = (PRONOUN_RE.exec(text.trim()) ?? [])[1] ?? 'they'
  return {
    resolved:       lastEntity,
    message:        `Resolved "${pronoun}" → ${lastEntity.displayName} (from previous message)`,
    confidence:     0.78,
    isRelationship: true,
  }
}

// ── Resolve parent relationship ───────────────────────────────────────────────

function resolveParentRelationship(
  subjectName: string,
  ctx:         AcademyEntityContext,
): RelationshipQueryResult {
  if (!ctx.parents || ctx.parents.length === 0) {
    return {
      resolved:       null,
      message:        `I don't have guardian contact details loaded. To see ${subjectName}'s parent information, open ${subjectName}'s player profile.`,
      confidence:     0.40,
      isRelationship: true,
    }
  }

  // Resolve player first
  const playerResult = resolveEntityV2(subjectName, ctx, { preferredKinds: ['player'] })
  if (!playerResult.entity || playerResult.entity.kind !== 'player') {
    return {
      resolved:       null,
      message:        `I couldn't find a player named "${subjectName}" to look up their parent.`,
      confidence:     0.30,
      isRelationship: true,
    }
  }

  const playerId = playerResult.entity.id
  const parent   = ctx.parents.find(p => playerId && p.linkedPlayerIds.includes(playerId))

  if (!parent) {
    return {
      resolved:       null,
      message:        `I found ${playerResult.entity.displayName} but there's no guardian linked in the current context. Check their player profile for contact details.`,
      confidence:     0.45,
      isRelationship: true,
    }
  }

  const parentEntity: ResolvedEntityV2 = {
    kind:            'parent',
    id:              parent.parentId,
    displayName:     parent.displayName,
    route:           playerResult.entity.route,
    confidence:      0.88,
    confidenceLevel: 'high',
    reasoning:       `Parent of ${playerResult.entity.displayName} via linkedPlayerIds`,
  }

  return {
    resolved:       parentEntity,
    message:        `${parent.displayName} is ${playerResult.entity.displayName}'s guardian.`,
    confidence:     0.88,
    isRelationship: true,
  }
}

// ── Resolve coach relationship ────────────────────────────────────────────────

function resolveCoachRelationship(
  subjectName: string,
  ctx:         AcademyEntityContext,
): RelationshipQueryResult {
  if (!ctx.coaches || ctx.coaches.length === 0) {
    return {
      resolved:       null,
      message:        `Coach assignments aren't loaded in this session. To find ${subjectName}'s coach, check their player profile or the Groups list.`,
      confidence:     0.35,
      isRelationship: true,
    }
  }

  // Coach→player assignments aren't in the context summary — honest fallback
  return {
    resolved:       null,
    message:        `I can see coach names but don't have player-to-coach assignments loaded. Open ${subjectName}'s player profile to see who coaches them.`,
    confidence:     0.40,
    isRelationship: true,
  }
}

// ── Resolve group relationship (player → their group) ────────────────────────

function resolveGroupForPlayer(
  subjectName: string,
  ctx:         AcademyEntityContext,
): RelationshipQueryResult {
  const playerResult = resolveEntityV2(subjectName, ctx, { preferredKinds: ['player'] })
  if (!playerResult.entity || playerResult.entity.kind !== 'player') {
    return {
      resolved:       null,
      message:        `I couldn't find a player named "${subjectName}".`,
      confidence:     0.30,
      isRelationship: true,
    }
  }

  const player = ctx.players.find(p => p.playerId === playerResult.entity!.id)
  if (!player) {
    return {
      resolved:       playerResult.entity,
      message:        `Found ${playerResult.entity.displayName} but couldn't determine their group from the current context.`,
      confidence:     0.45,
      isRelationship: true,
    }
  }

  // Find a group whose levelId matches the player's currentLevelId
  const matchingGroup = ctx.groups.find(g => g.levelId && g.levelId === player.currentLevelId)

  if (!matchingGroup) {
    const levelName = player.currentLevelDisplayName ?? 'their current level'
    return {
      resolved:       null,
      message:        `${playerResult.entity.displayName} is at ${levelName}. I can see groups but couldn't find an exact group assignment — check the Groups page for their placement.`,
      confidence:     0.50,
      isRelationship: true,
    }
  }

  const groupEntity: ResolvedEntityV2 = {
    kind:            'group',
    id:              matchingGroup.groupId,
    displayName:     matchingGroup.name,
    route:           `/director/sessions?group=${matchingGroup.groupId}`,
    confidence:      0.78,
    confidenceLevel: 'high',
    reasoning:       `${playerResult.entity.displayName} levelId matches group levelId for "${matchingGroup.name}"`,
  }

  return {
    resolved:       groupEntity,
    message:        `${playerResult.entity.displayName} is at ${player.currentLevelDisplayName ?? 'their current level'} — the likely group is ${matchingGroup.name}.`,
    confidence:     0.78,
    isRelationship: true,
  }
}

// ── Resolve members (level → list of players at that level) ──────────────────

function resolveMembersOfLevel(
  text: string,
  ctx:  AcademyEntityContext,
): RelationshipQueryResult {
  const levelResult = resolveEntityV2(text, ctx, { preferredKinds: ['curriculum_level'] })

  if (!levelResult.entity || levelResult.entity.kind !== 'curriculum_level') {
    return {
      resolved:       null,
      message:        `I couldn't identify which level or group you're asking about.`,
      confidence:     0.30,
      isRelationship: true,
    }
  }

  const levelDisplayName = levelResult.entity.displayName
  const levelId          = levelResult.entity.id // this is a key like 'orange_ball_2'

  // Match players by currentLevelDisplayName (since levelId here is a key, not UUID)
  const playersAtLevel = ctx.players.filter(p => {
    const dn = (p.currentLevelDisplayName ?? '').toLowerCase()
    return dn === levelDisplayName.toLowerCase() || dn.includes((levelId ?? '').replace(/_/g, ' '))
  })

  if (playersAtLevel.length === 0) {
    return {
      resolved:       levelResult.entity,
      message:        `I found the level ${levelDisplayName} but no players are currently showing at that level in the loaded data (cap 30 players). Check the Players page for a full list.`,
      confidence:     0.60,
      isRelationship: true,
    }
  }

  const names = playersAtLevel.map(p => p.playerName)
  const nameList = names.length <= 4
    ? names.join(', ')
    : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`

  return {
    resolved:       levelResult.entity,
    message:        `Players at ${levelDisplayName}: ${nameList}.`,
    confidence:     0.85,
    isRelationship: true,
  }
}

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Resolves a natural-language relationship query.
 * Returns null if the text is NOT a relationship query (caller should fall back to resolveEntityV2).
 */
export function resolveRelationshipQuery(
  text:        string,
  ctx:         AcademyEntityContext,
  lastEntity?: ResolvedEntityV2,
): RelationshipQueryResult | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 1. Pronoun → last resolved entity
  if (PRONOUN_RE.test(trimmed) && lastEntity) {
    return resolvePronoun(lastEntity, trimmed)
  }

  // 2. Parent relationship
  const possessiveSubject = extractSubjectFromPossessive(trimmed)
  if (possessiveSubject) {
    const lower = trimmed.toLowerCase()
    if (/\b(parent|mom|dad|mother|father|guardian|family)\b/.test(lower)) {
      return resolveParentRelationship(possessiveSubject, ctx)
    }
    if (/\bcoach\b/.test(lower)) {
      return resolveCoachRelationship(possessiveSubject, ctx)
    }
    if (/\b(group|class|team)\b/.test(lower)) {
      return resolveGroupForPlayer(possessiveSubject, ctx)
    }
  }

  // 3. "Who coaches X" / "Who is X's coach"
  const coachSubject = extractSubjectFromWhoCoaches(trimmed)
  if (coachSubject) {
    return resolveCoachRelationship(coachSubject, ctx)
  }

  // 4. "What group is X in"
  const groupSubject = extractSubjectFromWhatGroup(trimmed)
  if (groupSubject) {
    return resolveGroupForPlayer(groupSubject, ctx)
  }

  // 5. "Who is in [level/group]"
  if (/\bwho\s+is\s+in\b/i.test(trimmed) || /\bplayers?\s+in\b/i.test(trimmed) || /\bwho\s+plays?\s+in\b/i.test(trimmed)) {
    return resolveMembersOfLevel(trimmed, ctx)
  }

  return null
}

// ── Exported helper: is this query about a specific entity's related entity ──

export function getRelationshipKind(text: string): RelationKind | null {
  const lower = text.toLowerCase()
  if (/\b(parent|mom|dad|mother|father|guardian)\b/.test(lower)) return 'parent'
  if (/\bcoach\b/.test(lower) && /\bwho\s+(coaches|trains)\b/.test(lower)) return 'coach'
  if (/\b(group|class|team)\b/.test(lower)) return 'group'
  if (/\bwho\s+is\s+in\b/.test(lower) || /\bplayers?\s+in\b/.test(lower)) return 'members'
  if (PRONOUN_RE.test(text.trim())) return 'pronoun'
  return null
}

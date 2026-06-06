// Mega Sprint 2341–2370 — DONNA Academy Relationship Intelligence V1
//
// Core relationship intelligence engine. Transforms the flat AcademyEntityContext
// into a connected relationship graph enabling:
//   - Multi-hop queries  ("who else is in that group?")
//   - Aggregate queries  ("which players need attention?")
//   - Comparative queries ("which level causes the most issues?")
//   - Executive insight  ("state of the academy")
//   - COO reasoning      ("why does Jake need attention?")
//
// Pure TypeScript — no DB, no React, no side effects.
// Builds derived indexes once per call to buildRelationshipContext().

import type {
  PlayerCurriculumStateSummary,
  GroupSummary,
  TemplateSummary,
  AssessmentSummary,
} from '@/lib/donna/extendedContextLoaders'
import type {
  AcademyEntityContext,
  CoachSummary,
  ParentSummary,
} from '@/lib/donna/entity/donnaEntityResolver'

// ── Stall thresholds (mirrors playerProgressStallDetector.ts constants) ────────

const STALL_HIGH_DAYS   = 180
const STALL_MEDIUM_DAYS = 90
const RECENT_ASSESSMENT_DAYS = 90

// ── Types ─────────────────────────────────────────────────────────────────────

export type StallSeverity = 'high' | 'medium'

export interface StalledPlayerSignal {
  player:                    PlayerCurriculumStateSummary
  daysAtLevel:               number
  severity:                  StallSeverity
  missingRecentAssessment:   boolean
}

export interface LevelHotspot {
  levelId:          string
  levelDisplayName: string | null
  stalledCount:     number
  playerCount:      number
  stallRate:        number  // stalledCount / playerCount, 0–1
}

// ── Enriched relationship context ─────────────────────────────────────────────

export interface RelationshipContext {
  // Source arrays
  players:     PlayerCurriculumStateSummary[]
  groups:      GroupSummary[]
  templates:   TemplateSummary[]
  assessments: AssessmentSummary[]
  coaches:     CoachSummary[]
  parents:     ParentSummary[]

  // Derived indexes (keyed for O(1) lookups)
  playerByPlayerId:      Map<string, PlayerCurriculumStateSummary>
  playersByLevelId:      Map<string, PlayerCurriculumStateSummary[]>
  playersByLevelName:    Map<string, PlayerCurriculumStateSummary[]>   // key = lowercase displayName
  assessmentsByPlayerId: Map<string, AssessmentSummary[]>
  groupByLevelId:        Map<string, GroupSummary>
  templatesByLevelId:    Map<string, TemplateSummary[]>

  // Computed signals
  stalledPlayers:  StalledPlayerSignal[]   // players stalled ≥ 90 days
  advancingPlayers: PlayerCurriculumStateSummary[]  // advancement eligible
  levelHotspot:    LevelHotspot | null     // level with highest stall rate
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface PlayerContextResult {
  player:            PlayerCurriculumStateSummary
  group:             GroupSummary | null
  coGroupMembers:    PlayerCurriculumStateSummary[]   // other players in same group
  recentAssessments: AssessmentSummary[]
  stallSignal:       StalledPlayerSignal | null
  matchingTemplates: TemplateSummary[]
}

export interface GroupContextResult {
  group:          GroupSummary
  players:        PlayerCurriculumStateSummary[]
  stalledSignals: StalledPlayerSignal[]
  advancing:      PlayerCurriculumStateSummary[]
  templates:      TemplateSummary[]
}

export interface LevelContextResult {
  levelDisplayName: string | null
  levelId:          string | null
  players:          PlayerCurriculumStateSummary[]
  stalledSignals:   StalledPlayerSignal[]
  groups:           GroupSummary[]
  templates:        TemplateSummary[]
  assessmentCount:  number
}

export interface CoGroupResult {
  sourcePlayer: PlayerCurriculumStateSummary | null
  group:        GroupSummary | null
  members:      PlayerCurriculumStateSummary[]   // excludes sourcePlayer
}

export interface AcademyInsightResult {
  urgentSignals:             StalledPlayerSignal[]   // high-severity stalls
  moderateSignals:           StalledPlayerSignal[]   // medium-severity stalls
  advancingCount:            number
  stalledCount:              number
  levelHotspot:              LevelHotspot | null
  playersWithoutAssessment:  PlayerCurriculumStateSummary[]
  groupsAtRisk:              GroupSummary[]          // groups where >50% of players are stalled
  recommendedFocusStatement: string
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const then = new Date(dateStr).getTime()
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)))
}

function hasRecentAssessment(
  playerId: string,
  assessmentsByPlayerId: Map<string, AssessmentSummary[]>,
): boolean {
  const assessments = assessmentsByPlayerId.get(playerId) ?? []
  return assessments.some(a => getDaysSince(a.assessedDate) <= RECENT_ASSESSMENT_DAYS)
}

function computeStallSignal(
  player:                PlayerCurriculumStateSummary,
  assessmentsByPlayerId: Map<string, AssessmentSummary[]>,
): StalledPlayerSignal | null {
  const days = getDaysSince(player.enrolledAt)
  if (days < STALL_MEDIUM_DAYS) return null
  // Players who are advancement-eligible are NOT stalled — they're ready to advance
  if (player.advancementEligible) return null
  const severity: StallSeverity = days >= STALL_HIGH_DAYS ? 'high' : 'medium'
  const missingRecent = !hasRecentAssessment(player.playerId, assessmentsByPlayerId)
  return { player, daysAtLevel: days, severity, missingRecentAssessment: missingRecent }
}

// ── Build relationship context ────────────────────────────────────────────────

/**
 * Transforms a flat AcademyEntityContext into an enriched RelationshipContext
 * with derived indexes and computed signals. Call once per DONNA turn.
 */
export function buildRelationshipContext(ctx: AcademyEntityContext): RelationshipContext {
  // ── Index: player by ID ──────────────────────────────────────────────────────
  const playerByPlayerId = new Map<string, PlayerCurriculumStateSummary>()
  for (const p of ctx.players) playerByPlayerId.set(p.playerId, p)

  // ── Index: players by level UUID ─────────────────────────────────────────────
  const playersByLevelId = new Map<string, PlayerCurriculumStateSummary[]>()
  for (const p of ctx.players) {
    const arr = playersByLevelId.get(p.currentLevelId) ?? []
    arr.push(p)
    playersByLevelId.set(p.currentLevelId, arr)
  }

  // ── Index: players by level display name (lowercase) ─────────────────────────
  const playersByLevelName = new Map<string, PlayerCurriculumStateSummary[]>()
  for (const p of ctx.players) {
    const key = (p.currentLevelDisplayName ?? '').toLowerCase()
    if (!key) continue
    const arr = playersByLevelName.get(key) ?? []
    arr.push(p)
    playersByLevelName.set(key, arr)
  }

  // ── Index: assessments by player ID ─────────────────────────────────────────
  const assessmentsByPlayerId = new Map<string, AssessmentSummary[]>()
  for (const a of ctx.assessments) {
    const arr = assessmentsByPlayerId.get(a.playerId) ?? []
    arr.push(a)
    assessmentsByPlayerId.set(a.playerId, arr)
  }

  // ── Index: group by level UUID (first match — groups share curriculum level) ──
  const groupByLevelId = new Map<string, GroupSummary>()
  for (const g of ctx.groups) {
    if (g.levelId && !groupByLevelId.has(g.levelId)) {
      groupByLevelId.set(g.levelId, g)
    }
  }

  // ── Index: templates by curriculum level UUID ────────────────────────────────
  const templatesByLevelId = new Map<string, TemplateSummary[]>()
  for (const t of ctx.templates) {
    if (!t.curriculumLevelId) continue
    const arr = templatesByLevelId.get(t.curriculumLevelId) ?? []
    arr.push(t)
    templatesByLevelId.set(t.curriculumLevelId, arr)
  }

  // ── Computed: stall signals ───────────────────────────────────────────────────
  const stalledPlayers: StalledPlayerSignal[] = []
  for (const p of ctx.players) {
    const signal = computeStallSignal(p, assessmentsByPlayerId)
    if (signal) stalledPlayers.push(signal)
  }
  stalledPlayers.sort((a, b) => b.daysAtLevel - a.daysAtLevel)

  // ── Computed: advancing players ───────────────────────────────────────────────
  const advancingPlayers = ctx.players.filter(p => p.advancementEligible)

  // ── Computed: level hotspot (most stalled level by rate) ─────────────────────
  const levelHotspot = computeLevelHotspot(ctx.players, stalledPlayers)

  return {
    players:     ctx.players,
    groups:      ctx.groups,
    templates:   ctx.templates,
    assessments: ctx.assessments,
    coaches:     ctx.coaches ?? [],
    parents:     ctx.parents ?? [],
    playerByPlayerId,
    playersByLevelId,
    playersByLevelName,
    assessmentsByPlayerId,
    groupByLevelId,
    templatesByLevelId,
    stalledPlayers,
    advancingPlayers,
    levelHotspot,
  }
}

function computeLevelHotspot(
  players:  PlayerCurriculumStateSummary[],
  stalled:  StalledPlayerSignal[],
): LevelHotspot | null {
  if (stalled.length === 0 || players.length === 0) return null

  // Count stalled per level
  const stalledByLevel = new Map<string, number>()
  const nameByLevel    = new Map<string, string | null>()
  for (const s of stalled) {
    const key = s.player.currentLevelId
    stalledByLevel.set(key, (stalledByLevel.get(key) ?? 0) + 1)
    nameByLevel.set(key, s.player.currentLevelDisplayName ?? null)
  }

  // Count total per level
  const totalByLevel = new Map<string, number>()
  for (const p of players) {
    totalByLevel.set(p.currentLevelId, (totalByLevel.get(p.currentLevelId) ?? 0) + 1)
  }

  let best: LevelHotspot | null = null
  for (const [levelId, stalledCount] of Array.from(stalledByLevel.entries())) {
    const playerCount = totalByLevel.get(levelId) ?? 1
    const stallRate   = stalledCount / playerCount
    if (!best || stallRate > best.stallRate || (stallRate === best.stallRate && stalledCount > best.stalledCount)) {
      best = {
        levelId,
        levelDisplayName: nameByLevel.get(levelId) ?? null,
        stalledCount,
        playerCount,
        stallRate,
      }
    }
  }
  return best
}

// ── Player context query ──────────────────────────────────────────────────────

export function getPlayerContext(
  playerId: string,
  rCtx:     RelationshipContext,
): PlayerContextResult | null {
  const player = rCtx.playerByPlayerId.get(playerId) ?? null
  if (!player) return null

  const group         = rCtx.groupByLevelId.get(player.currentLevelId) ?? null
  const levelPlayers  = rCtx.playersByLevelId.get(player.currentLevelId) ?? []
  const coGroupMembers = levelPlayers.filter(p => p.playerId !== playerId)
  const recentAssessments = (rCtx.assessmentsByPlayerId.get(playerId) ?? [])
    .filter(a => getDaysSince(a.assessedDate) <= RECENT_ASSESSMENT_DAYS)
    .sort((a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime())
  const stallSignal   = computeStallSignal(player, rCtx.assessmentsByPlayerId)
  const matchingTemplates = rCtx.templatesByLevelId.get(player.currentLevelId) ?? []

  return { player, group, coGroupMembers, recentAssessments, stallSignal, matchingTemplates }
}

// ── Group context query ───────────────────────────────────────────────────────

export function getGroupContext(
  groupId: string,
  rCtx:    RelationshipContext,
): GroupContextResult | null {
  const group = rCtx.groups.find(g => g.groupId === groupId) ?? null
  if (!group) return null

  const players = group.levelId ? (rCtx.playersByLevelId.get(group.levelId) ?? []) : []
  const stalledSignals = rCtx.stalledPlayers.filter(s =>
    players.some(p => p.playerId === s.player.playerId),
  )
  const advancing  = players.filter(p => p.advancementEligible)
  const templates  = group.levelId ? (rCtx.templatesByLevelId.get(group.levelId) ?? []) : []

  return { group, players, stalledSignals, advancing, templates }
}

// ── Level context query ───────────────────────────────────────────────────────

export function getLevelContext(
  levelDisplayNameOrKey: string,
  rCtx: RelationshipContext,
): LevelContextResult | null {
  const needle = levelDisplayNameOrKey.toLowerCase()

  // Try by display name
  let players = rCtx.playersByLevelName.get(needle)

  // Fuzzy fallback: find the closest key that includes the needle
  if (!players) {
    for (const [key, vals] of Array.from(rCtx.playersByLevelName.entries())) {
      if (key.includes(needle) || needle.includes(key)) {
        players = vals
        break
      }
    }
  }

  if (!players || players.length === 0) return null

  const levelDisplayName  = players[0].currentLevelDisplayName ?? null
  const levelId           = players[0].currentLevelId
  const stalledSignals    = rCtx.stalledPlayers.filter(s =>
    players!.some(p => p.playerId === s.player.playerId),
  )
  const groups    = rCtx.groups.filter(g => g.levelId === levelId)
  const templates = rCtx.templatesByLevelId.get(levelId) ?? []
  const assessmentCount = rCtx.assessments.filter(a =>
    players!.some(p => p.playerId === a.playerId),
  ).length

  return { levelDisplayName, levelId, players, stalledSignals, groups, templates, assessmentCount }
}

// ── Co-group member query ─────────────────────────────────────────────────────

/**
 * Returns all players in the same group as the given player (excluding the player themselves).
 * Used for "who else is in that group?" queries.
 */
export function getCoGroupResult(
  playerId: string,
  rCtx:     RelationshipContext,
): CoGroupResult {
  const player = rCtx.playerByPlayerId.get(playerId) ?? null
  if (!player) return { sourcePlayer: null, group: null, members: [] }

  const group      = rCtx.groupByLevelId.get(player.currentLevelId) ?? null
  const levelAll   = rCtx.playersByLevelId.get(player.currentLevelId) ?? []
  const members    = levelAll.filter(p => p.playerId !== playerId)

  return { sourcePlayer: player, group, members }
}

// ── Aggregate: players needing attention ─────────────────────────────────────

/**
 * Returns stalled player signals sorted by urgency (high severity first, then days).
 * "Needing attention" = stalled (no advancement in ≥90 days without eligibility).
 */
export function getPlayersNeedingAttention(rCtx: RelationshipContext): StalledPlayerSignal[] {
  return [...rCtx.stalledPlayers].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1 }
    const diff = severityOrder[a.severity] - severityOrder[b.severity]
    return diff !== 0 ? diff : b.daysAtLevel - a.daysAtLevel
  })
}

// ── Aggregate: players without recent assessment ──────────────────────────────

export function getPlayersWithoutRecentAssessment(
  rCtx: RelationshipContext,
): PlayerCurriculumStateSummary[] {
  return rCtx.players.filter(p =>
    !hasRecentAssessment(p.playerId, rCtx.assessmentsByPlayerId),
  )
}

// ── Aggregate: players sharing a bottleneck ───────────────────────────────────

/**
 * Returns all players at the most blocked level (levelHotspot), or at the
 * specified level if provided.
 */
export function getSharedBottleneckPlayers(
  levelDisplayName: string | null,
  rCtx: RelationshipContext,
): PlayerCurriculumStateSummary[] {
  if (levelDisplayName) {
    return rCtx.playersByLevelName.get(levelDisplayName.toLowerCase()) ?? []
  }
  if (!rCtx.levelHotspot) return []
  return rCtx.playersByLevelId.get(rCtx.levelHotspot.levelId) ?? []
}

// ── Academy insight ───────────────────────────────────────────────────────────

export function buildAcademyInsight(rCtx: RelationshipContext): AcademyInsightResult {
  const urgentSignals   = rCtx.stalledPlayers.filter(s => s.severity === 'high')
  const moderateSignals = rCtx.stalledPlayers.filter(s => s.severity === 'medium')
  const withoutAssessment = getPlayersWithoutRecentAssessment(rCtx)

  // Groups at risk: groups where more than half the players are stalled
  const groupsAtRisk: GroupSummary[] = []
  for (const group of rCtx.groups) {
    if (!group.levelId) continue
    const groupPlayers = rCtx.playersByLevelId.get(group.levelId) ?? []
    if (groupPlayers.length === 0) continue
    const stalledInGroup = rCtx.stalledPlayers.filter(s =>
      groupPlayers.some(p => p.playerId === s.player.playerId),
    )
    if (stalledInGroup.length / groupPlayers.length > 0.5) {
      groupsAtRisk.push(group)
    }
  }

  // Recommended focus statement
  let focusParts: string[] = []
  if (urgentSignals.length > 0) {
    const names = urgentSignals.slice(0, 3).map(s => s.player.playerName.split(' ')[0])
    focusParts.push(`${urgentSignals.length} player${urgentSignals.length > 1 ? 's' : ''} stalled >180 days (${names.join(', ')}${urgentSignals.length > 3 ? '...' : ''})`)
  }
  if (rCtx.levelHotspot && rCtx.levelHotspot.stalledCount >= 2) {
    focusParts.push(`${rCtx.levelHotspot.levelDisplayName ?? rCtx.levelHotspot.levelId} is the highest-risk level (${rCtx.levelHotspot.stalledCount}/${rCtx.levelHotspot.playerCount} players stalled)`)
  }
  if (rCtx.advancingPlayers.length > 0) {
    focusParts.push(`${rCtx.advancingPlayers.length} player${rCtx.advancingPlayers.length > 1 ? 's' : ''} ready to advance`)
  }
  if (withoutAssessment.length > 0) {
    focusParts.push(`${withoutAssessment.length} player${withoutAssessment.length > 1 ? 's' : ''} without a recent assessment`)
  }

  const recommendedFocusStatement = focusParts.length > 0
    ? focusParts.join(' · ')
    : rCtx.players.length === 0
      ? 'No player data loaded yet.'
      : 'Academy looks healthy — no stalls or critical signals detected.'

  return {
    urgentSignals,
    moderateSignals,
    advancingCount: rCtx.advancingPlayers.length,
    stalledCount: rCtx.stalledPlayers.length,
    levelHotspot: rCtx.levelHotspot,
    playersWithoutAssessment: withoutAssessment,
    groupsAtRisk,
    recommendedFocusStatement,
  }
}

// ── Relationship context from entity context (convenience) ────────────────────

export { buildRelationshipContext as fromEntityContext }

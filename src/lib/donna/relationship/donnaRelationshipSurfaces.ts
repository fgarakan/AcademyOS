// Mega Sprint 2341–2370 — DONNA Academy Relationship Intelligence V1
// Executive relationship surfaces: builds summary cards for Director Home,
// Executive Workspace, and Academy Health views.
// Pure TypeScript — no DB, no React, no side effects.

import type { RelationshipContext } from './donnaRelationshipIntelligence'
import { buildAcademyInsight } from './donnaRelationshipIntelligence'

// ── Surface card type ─────────────────────────────────────────────────────────

export interface RelationshipSurfaceCard {
  id:          string
  title:       string
  subtitle:    string | null
  items:       string[]
  actionLabel: string | null
  actionRoute: string | null
  urgency:     'high' | 'medium' | 'low' | 'healthy'
  metric:      string | null   // compact number or "3 players", "2 groups"
}

export interface AcademyRelationshipSurface {
  playersAffectedBySameBottleneck: RelationshipSurfaceCard | null
  playersNeedingAttention:         RelationshipSurfaceCard | null
  groupsNeedingAttention:          RelationshipSurfaceCard | null
  parentsMissingUpdates:           RelationshipSurfaceCard | null  // honest limitation card
  curriculumImpactZones:           RelationshipSurfaceCard[]
  advancementOpportunities:        RelationshipSurfaceCard | null
  assessmentGaps:                  RelationshipSurfaceCard | null
}

// ── Card builders ─────────────────────────────────────────────────────────────

function buildBottleneckCard(rCtx: RelationshipContext): RelationshipSurfaceCard | null {
  if (!rCtx.levelHotspot || rCtx.levelHotspot.stalledCount < 2) return null

  const { levelDisplayName, stalledCount, playerCount, levelId } = rCtx.levelHotspot
  const name    = levelDisplayName ?? levelId
  const players = rCtx.playersByLevelId.get(levelId) ?? []
  const stalled = players.filter(p =>
    rCtx.stalledPlayers.some(s => s.player.playerId === p.playerId),
  )

  return {
    id:          'bottleneck',
    title:       'Players Affected by Same Bottleneck',
    subtitle:    name,
    items:       stalled.slice(0, 4).map(p => p.playerName),
    actionLabel: 'View Curriculum',
    actionRoute: `/director/curriculum`,
    urgency:     rCtx.levelHotspot.stallRate >= 0.5 ? 'high' : 'medium',
    metric:      `${stalledCount} / ${playerCount} stalled`,
  }
}

function buildAttentionCard(rCtx: RelationshipContext): RelationshipSurfaceCard | null {
  const signals = rCtx.stalledPlayers
  if (signals.length === 0) return null

  const urgent   = signals.filter(s => s.severity === 'high')
  const moderate = signals.filter(s => s.severity === 'medium')
  const urgency: RelationshipSurfaceCard['urgency'] = urgent.length > 0 ? 'high' : 'medium'

  return {
    id:          'attention',
    title:       'Players Needing Attention',
    subtitle:    urgent.length > 0
      ? `${urgent.length} high-priority, ${moderate.length} medium`
      : `${moderate.length} stalled 90–180 days`,
    items:       signals.slice(0, 4).map(s => {
      const days = s.daysAtLevel
      return `${s.player.playerName} — ${days}d at ${s.player.currentLevelDisplayName ?? 'this level'}`
    }),
    actionLabel: 'View Players',
    actionRoute: '/director/players',
    urgency,
    metric:      `${signals.length} stalled`,
  }
}

function buildGroupsAtRiskCard(rCtx: RelationshipContext): RelationshipSurfaceCard | null {
  const insight = buildAcademyInsight(rCtx)
  if (insight.groupsAtRisk.length === 0) return null

  return {
    id:          'groups_at_risk',
    title:       'Groups Needing Attention',
    subtitle:    'More than half of members stalled',
    items:       insight.groupsAtRisk.map(g => g.name),
    actionLabel: 'View Groups',
    actionRoute: '/director/groups',
    urgency:     'medium',
    metric:      `${insight.groupsAtRisk.length} group${insight.groupsAtRisk.length > 1 ? 's' : ''}`,
  }
}

function buildParentsCard(): RelationshipSurfaceCard {
  // Parents not loaded in current context — honest limitation card
  return {
    id:          'parents_missing_updates',
    title:       'Parents Missing Updates',
    subtitle:    'Guardian communication data not loaded',
    items:       ['Parent communication data is not loaded in DONNA\'s current context. Review the Communications tab to check parent update history.'],
    actionLabel: null,
    actionRoute: null,
    urgency:     'low',
    metric:      null,
  }
}

function buildCurriculumImpactCards(rCtx: RelationshipContext): RelationshipSurfaceCard[] {
  if (rCtx.stalledPlayers.length === 0) return []

  // Group stalled players by level
  const byLevel = new Map<string, { levelName: string | null; count: number }>()
  for (const s of rCtx.stalledPlayers) {
    const id  = s.player.currentLevelId
    const rec = byLevel.get(id) ?? { levelName: s.player.currentLevelDisplayName, count: 0 }
    rec.count++
    byLevel.set(id, rec)
  }

  // Only levels with ≥2 stalled players
  const cards: RelationshipSurfaceCard[] = []
  for (const [levelId, { levelName, count }] of Array.from(byLevel.entries())) {
    if (count < 2) continue
    const name      = levelName ?? levelId
    const templates = rCtx.templatesByLevelId.get(levelId) ?? []
    const players   = (rCtx.playersByLevelId.get(levelId) ?? [])
      .filter(p => rCtx.stalledPlayers.some(s => s.player.playerId === p.playerId))

    cards.push({
      id:          `curriculum_impact_${levelId}`,
      title:       `Curriculum Impact Zone`,
      subtitle:    name,
      items:       players.slice(0, 3).map(p => p.playerName),
      actionLabel: 'View Curriculum',
      actionRoute: `/director/curriculum`,
      urgency:     count >= 3 ? 'high' : 'medium',
      metric:      `${count} stalled · ${templates.length} template${templates.length !== 1 ? 's' : ''}`,
    })
  }

  return cards.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, healthy: 3 }
    return order[a.urgency] - order[b.urgency]
  })
}

function buildAdvancementCard(rCtx: RelationshipContext): RelationshipSurfaceCard | null {
  if (rCtx.advancingPlayers.length === 0) return null

  return {
    id:          'advancement',
    title:       'Advancement Opportunities',
    subtitle:    'Players eligible and ready to level up',
    items:       rCtx.advancingPlayers.slice(0, 4).map(p =>
      `${p.playerName} — ${p.currentLevelDisplayName ?? 'current level'}`,
    ),
    actionLabel: 'Start Placement Review',
    actionRoute: '/director/players',
    urgency:     'low',
    metric:      `${rCtx.advancingPlayers.length} eligible`,
  }
}

function buildAssessmentGapCard(rCtx: RelationshipContext): RelationshipSurfaceCard | null {
  const withoutRecent = rCtx.players.filter(p => {
    const assessments = rCtx.assessmentsByPlayerId.get(p.playerId) ?? []
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000
    return !assessments.some(a => Date.now() - new Date(a.assessedDate).getTime() <= NINETY_DAYS)
  })

  if (withoutRecent.length === 0) return null

  return {
    id:          'assessment_gaps',
    title:       'Assessment Gaps',
    subtitle:    'Players without a recent assessment (90 days)',
    items:       withoutRecent.slice(0, 4).map(p =>
      `${p.playerName} — ${p.currentLevelDisplayName ?? 'unknown level'}`,
    ),
    actionLabel: 'View Players',
    actionRoute: '/director/players',
    urgency:     withoutRecent.length >= 3 ? 'medium' : 'low',
    metric:      `${withoutRecent.length} players`,
  }
}

// ── Main surface builder ──────────────────────────────────────────────────────

/**
 * Builds all relationship surface cards from the relationship context.
 * Returns null for each card when there is nothing to show (healthy state).
 * Parents card is always returned as an honest limitation acknowledgement.
 */
export function buildAcademyRelationshipSurface(
  rCtx: RelationshipContext,
): AcademyRelationshipSurface {
  return {
    playersAffectedBySameBottleneck: buildBottleneckCard(rCtx),
    playersNeedingAttention:         buildAttentionCard(rCtx),
    groupsNeedingAttention:          buildGroupsAtRiskCard(rCtx),
    parentsMissingUpdates:           buildParentsCard(),
    curriculumImpactZones:           buildCurriculumImpactCards(rCtx),
    advancementOpportunities:        buildAdvancementCard(rCtx),
    assessmentGaps:                  buildAssessmentGapCard(rCtx),
  }
}

// ── Urgency-ordered flat list (for Director Home / Executive Workspace) ────────

export function getUrgentSurfaceCards(surface: AcademyRelationshipSurface): RelationshipSurfaceCard[] {
  const all: RelationshipSurfaceCard[] = [
    surface.playersNeedingAttention,
    surface.playersAffectedBySameBottleneck,
    ...surface.curriculumImpactZones,
    surface.groupsNeedingAttention,
    surface.assessmentGaps,
    surface.advancementOpportunities,
  ].filter((c): c is RelationshipSurfaceCard => c !== null)

  const ORDER = { high: 0, medium: 1, low: 2, healthy: 3 }
  return all.sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency])
}

// Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
// Entity relationship engine: bridges the canonical AcademyEntity model to the
// existing relationship intelligence layer (relationship/donnaRelationshipIntelligence.ts).
// getEntityRelationships() derives EntityRelationship[] from rCtx indexes without
// duplicating resolver logic. traverseRelationship() follows a single relationship kind.
// Pure TypeScript — no DB, no React, no side effects.

import type { RelationshipContext } from '@/lib/donna/relationship/donnaRelationshipIntelligence'
import type {
  AcademyEntity,
  AcademyEntityBase,
  EntityRelationship,
  RelationshipKind,
} from './donnaAcademyEntityModel'

// ── Get all relationships for an entity ──────────────────────────────────────

export function getEntityRelationships(
  entity: AcademyEntity,
  rCtx: RelationshipContext,
): EntityRelationship[] {
  const rels: EntityRelationship[] = []

  if (entity.kind === 'player') {
    const player = rCtx.playerByPlayerId.get(entity.id)
    if (!player) return []

    // is_at_level
    if (player.currentLevelId) {
      rels.push({
        kind:              'is_at_level',
        sourceId:          entity.id,
        targetId:          player.currentLevelId,
        targetDisplayName: player.currentLevelDisplayName ?? player.currentLevelId,
        targetKind:        'curriculum_level',
        confidence:        1.0,
      })
    }

    // is_in_group — the group whose levelId matches this player's level
    const group = rCtx.groupByLevelId.get(player.currentLevelId)
    if (group) {
      rels.push({
        kind:              'is_in_group',
        sourceId:          entity.id,
        targetId:          group.groupId,
        targetDisplayName: group.name,
        targetKind:        'group',
        confidence:        0.85,
      })
    }

    // co_group_member — other players at the same level
    const levelPeers = rCtx.playersByLevelId.get(player.currentLevelId) ?? []
    for (const peer of levelPeers) {
      if (peer.playerId === entity.id) continue
      rels.push({
        kind:              'co_group_member',
        sourceId:          entity.id,
        targetId:          peer.playerId,
        targetDisplayName: peer.playerName,
        targetKind:        'player',
        confidence:        0.85,
      })
    }

    // uses_template — templates linked to this player's level
    const templates = rCtx.templatesByLevelId.get(player.currentLevelId) ?? []
    for (const tmpl of templates) {
      rels.push({
        kind:              'uses_template',
        sourceId:          entity.id,
        targetId:          tmpl.templateId,
        targetDisplayName: tmpl.name,
        targetKind:        'template',
        confidence:        0.80,
      })
    }
  }

  if (entity.kind === 'group') {
    const levelId = entity.levelId
    if (levelId) {
      const members = rCtx.playersByLevelId.get(levelId) ?? []
      for (const p of members) {
        rels.push({
          kind:              'is_in_group',
          sourceId:          entity.id,
          targetId:          p.playerId,
          targetDisplayName: p.playerName,
          targetKind:        'player',
          confidence:        0.85,
        })
      }
      const templates = rCtx.templatesByLevelId.get(levelId) ?? []
      for (const t of templates) {
        rels.push({
          kind:              'uses_template',
          sourceId:          entity.id,
          targetId:          t.templateId,
          targetDisplayName: t.name,
          targetKind:        'template',
          confidence:        0.75,
        })
      }
    }
  }

  if (entity.kind === 'curriculum_level') {
    const levelPlayers = rCtx.playersByLevelId.get(entity.id) ?? []
    for (const p of levelPlayers) {
      rels.push({
        kind:              'is_at_level',
        sourceId:          entity.id,
        targetId:          p.playerId,
        targetDisplayName: p.playerName,
        targetKind:        'player',
        confidence:        1.0,
      })
    }
    const templates = rCtx.templatesByLevelId.get(entity.id) ?? []
    for (const t of templates) {
      rels.push({
        kind:              'uses_template',
        sourceId:          entity.id,
        targetId:          t.templateId,
        targetDisplayName: t.name,
        targetKind:        'template',
        confidence:        0.80,
      })
    }
  }

  if (entity.kind === 'parent') {
    for (const playerId of entity.linkedPlayerIds) {
      const player = rCtx.playerByPlayerId.get(playerId)
      rels.push({
        kind:              'parent_of',
        sourceId:          entity.id,
        targetId:          playerId,
        targetDisplayName: player?.playerName ?? playerId,
        targetKind:        'player',
        confidence:        1.0,
      })
    }
  }

  return rels
}

// ── Traverse a specific relationship kind from an entity ─────────────────────

export function traverseRelationship(
  entity:  AcademyEntity,
  relKind: RelationshipKind,
  rCtx:    RelationshipContext,
): AcademyEntityBase[] {
  return getEntityRelationships(entity, rCtx)
    .filter(r => r.kind === relKind)
    .map(r => ({
      id:            r.targetId,
      kind:          r.targetKind,
      displayName:   r.targetDisplayName,
      confidence:    r.confidence,
      lastUpdatedAt: null,
    }))
}

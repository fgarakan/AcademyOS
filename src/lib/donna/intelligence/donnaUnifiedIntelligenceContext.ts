// Mega Sprint 1385–1414 — DONNA Unified Intelligence Pipeline V1
// Unified intelligence context: maps a ResolvedEntityV2 → canonical AcademyEntity,
// then runs all Sprint 1355 engines and assembles their outputs into one context object.
// buildUnifiedContext() is the sole entry point.
// Pure TypeScript — no DB, no React, no side effects.

import type { AcademyEntityContext, ResolvedEntityV2 } from '@/lib/donna/entity/donnaEntityResolver'
import type { RelationshipContext } from '@/lib/donna/relationship/donnaRelationshipIntelligence'
import type {
  AcademyEntity,
  EntityRelationship,
  PlayerEntity,
  CoachEntity,
  ParentEntity,
  GroupEntity,
  CurriculumLevelEntity,
  AssessmentEntity,
  TemplateEntity,
  SessionEntity,
  WorkflowEntity,
} from '@/lib/donna/entities/donnaAcademyEntityModel'
import type { EntitySummaryAnswer } from '@/lib/donna/entities/donnaEntitySummaryEngine'
import type { EvidenceChain } from '@/lib/donna/entities/donnaEntityEvidenceEngine'
import type { TimelineEvent } from '@/lib/donna/entities/donnaEntityTimelineEngine'
import { buildEntitySummary } from '@/lib/donna/entities/donnaEntitySummaryEngine'
import { buildEntityEvidence } from '@/lib/donna/entities/donnaEntityEvidenceEngine'
import { buildEntityTimeline } from '@/lib/donna/entities/donnaEntityTimelineEngine'
import { getEntityRelationships } from '@/lib/donna/entities/donnaEntityRelationshipEngine'
import {
  createTrace,
  addEngineToTrace,
  finalizeTrace,
} from './donnaIntelligenceTrace'
import type { IntelligenceTrace } from './donnaIntelligenceTrace'

// ── Unified context type ───────────────────────────────────────────────────────

export interface UnifiedIntelligenceContext {
  entity:        AcademyEntity
  summary:       EntitySummaryAnswer
  evidenceChain: EvidenceChain
  timeline:      TimelineEvent[]
  relationships: EntityRelationship[]
  dataGaps:      string[]
  confidence:    'high' | 'medium' | 'low'
  routeTarget:   string | null
  trace:         IntelligenceTrace
}

// ── Factory: ResolvedEntityV2 → AcademyEntity ─────────────────────────────────

export function resolvedEntityToAcademyEntity(
  resolved: ResolvedEntityV2,
  ctx:      AcademyEntityContext,
): AcademyEntity | null {
  const id          = resolved.id ?? ''
  const displayName = resolved.displayName
  const confidence  = resolved.confidence
  const noDate      = null as string | null

  switch (resolved.kind) {
    case 'player': {
      const p = ctx.players.find(x => x.playerId === id)
      if (!p) return null
      const entity: PlayerEntity = {
        kind:                    'player',
        id:                      p.playerId,
        displayName:             p.playerName,
        confidence,
        lastUpdatedAt:           noDate,
        currentLevelId:          p.currentLevelId,
        currentLevelDisplayName: p.currentLevelDisplayName,
        advancementEligible:     p.advancementEligible,
        enrolledAt:              p.enrolledAt,
        lastEvaluatedAt:         p.lastEvaluatedAt,
      }
      return entity
    }

    case 'group': {
      const g = ctx.groups.find(x => x.groupId === id)
      if (!g) return null
      const entity: GroupEntity = {
        kind:          'group',
        id:            g.groupId,
        displayName:   g.name,
        confidence,
        lastUpdatedAt: noDate,
        levelId:       g.levelId,
        track:         g.track,
        maxPlayers:    g.maxPlayers,
      }
      return entity
    }

    case 'assessment': {
      const a = ctx.assessments.find(x => x.assessmentId === id)
      if (!a) return null
      const entity: AssessmentEntity = {
        kind:           'assessment',
        id:             a.assessmentId,
        displayName,
        confidence,
        lastUpdatedAt:  noDate,
        playerId:       a.playerId,
        assessedDate:   a.assessedDate,
        promotionReady: a.promotionReady,
        overallScore:   a.overallScore,
      }
      return entity
    }

    case 'template': {
      const t = ctx.templates.find(x => x.templateId === id)
      if (!t) return null
      const entity: TemplateEntity = {
        kind:              'template',
        id:                t.templateId,
        displayName:       t.name,
        confidence,
        lastUpdatedAt:     noDate,
        templateType:      t.templateType,
        status:            t.status,
        curriculumLevelId: t.curriculumLevelId,
        totalDurationMin:  t.totalDurationMin,
      }
      return entity
    }

    case 'curriculum_level': {
      // Curriculum levels have no separate list — derive from player data.
      // When id is non-null, match by currentLevelId; otherwise match by displayName.
      const matchById   = id ? ctx.players.filter(p => p.currentLevelId === id)   : []
      const matchByName = ctx.players.filter(p => p.currentLevelDisplayName === displayName)
      const levelPlayers = matchById.length > 0 ? matchById : matchByName
      const levelId      = levelPlayers[0]?.currentLevelId          ?? id
      const levelName    = levelPlayers[0]?.currentLevelDisplayName ?? displayName
      const entity: CurriculumLevelEntity = {
        kind:          'curriculum_level',
        id:            levelId,
        displayName:   levelName,
        confidence,
        lastUpdatedAt: noDate,
        playerCount:   levelPlayers.length,
      }
      return entity
    }

    case 'coach': {
      const c = ctx.coaches?.find(x => x.coachId === id)
      const entity: CoachEntity = {
        kind:          'coach',
        id:            c?.coachId    ?? id,
        displayName:   c?.displayName ?? displayName,
        confidence,
        lastUpdatedAt: noDate,
        role:          c?.role        ?? 'coach',
      }
      return entity
    }

    case 'parent': {
      const par = ctx.parents?.find(x => x.parentId === id)
      const entity: ParentEntity = {
        kind:            'parent',
        id:              par?.parentId   ?? id,
        displayName:     par?.displayName ?? displayName,
        confidence,
        lastUpdatedAt:   noDate,
        linkedPlayerIds: par?.linkedPlayerIds ?? [],
      }
      return entity
    }

    case 'session': {
      const entity: SessionEntity = {
        kind:          'session',
        id,
        displayName,
        confidence,
        lastUpdatedAt: noDate,
      }
      return entity
    }

    case 'workflow': {
      const entity: WorkflowEntity = {
        kind:          'workflow',
        id,
        displayName,
        confidence,
        lastUpdatedAt: noDate,
      }
      return entity
    }

    default:
      return null
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export function buildUnifiedContext(
  resolved: ResolvedEntityV2,
  ctx:      AcademyEntityContext,
  rCtx?:    RelationshipContext,
): UnifiedIntelligenceContext | null {
  const entity = resolvedEntityToAcademyEntity(resolved, ctx)
  if (!entity) return null

  const confidenceSource = resolved.confidence >= 0.85
    ? 'high_confidence_entity'
    : 'medium_confidence_entity'

  let trace = createTrace({
    entityKind:       entity.kind,
    entityId:         entity.id,
    entityName:       entity.displayName,
    confidenceSource,
  })

  const summary = buildEntitySummary(entity, ctx, rCtx)
  trace = addEngineToTrace(trace, 'entity_summary')

  const evidenceChain = buildEntityEvidence(entity, ctx)
  trace = addEngineToTrace(trace, 'entity_evidence')

  const timeline = buildEntityTimeline(entity, ctx)
  trace = addEngineToTrace(trace, 'entity_timeline')

  let relationships: EntityRelationship[] = []
  if (rCtx) {
    relationships = getEntityRelationships(entity, rCtx)
    trace = addEngineToTrace(trace, 'entity_relationships')
  }

  trace = finalizeTrace(trace)

  return {
    entity,
    summary,
    evidenceChain,
    timeline,
    relationships,
    dataGaps:    evidenceChain.dataGaps,
    confidence:  evidenceChain.confidence,
    routeTarget: resolved.route,
    trace,
  }
}

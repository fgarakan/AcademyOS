// Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
// Evidence aggregation engine: builds scored evidence chains for any AcademyEntity.
// buildEntityEvidence() collects all available signals from AcademyEntityContext,
// scores them, and returns a structured EvidenceChain with honest dataGaps[].
// Pure TypeScript — no DB, no React, no side effects.

import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import type {
  AcademyEntity,
  EntityEvidence,
  PlayerEntity,
  GroupEntity,
  CurriculumLevelEntity,
  AssessmentEntity,
  TemplateEntity,
} from './donnaAcademyEntityModel'

// ── Result type ───────────────────────────────────────────────────────────────

export interface EvidenceChain {
  entityId:   string
  entityKind: string
  lines:      string[]       // human-readable lines for DONNA output
  evidence:   EntityEvidence[]
  confidence: 'high' | 'medium' | 'low'
  dataGaps:   string[]
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const then = new Date(dateStr).getTime()
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)))
}

// ── Per-kind builders ─────────────────────────────────────────────────────────

function buildPlayerEvidence(
  entity: PlayerEntity,
  ctx:    AcademyEntityContext,
): { items: EntityEvidence[]; gaps: string[] } {
  const items: EntityEvidence[] = []
  const gaps: string[] = []

  items.push({
    source:      'player_curriculum_states',
    description: `Enrolled at level: ${entity.currentLevelDisplayName ?? entity.currentLevelId}`,
    date:        entity.enrolledAt,
    confidence:  'high',
  })

  const daysAtLevel = getDaysSince(entity.enrolledAt)
  if (daysAtLevel >= 90 && !entity.advancementEligible) {
    items.push({
      source:      'player_curriculum_states',
      description: `${daysAtLevel} days at current level — stall indicator`,
      date:        entity.enrolledAt,
      confidence:  'medium',
    })
  }

  if (entity.advancementEligible) {
    items.push({
      source:      'player_curriculum_states',
      description: 'Advancement eligible — meets promotion criteria',
      date:        entity.lastEvaluatedAt,
      confidence:  'high',
    })
  }

  const playerAssessments = ctx.assessments
    .filter(a => a.playerId === entity.id)
    .sort((a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime())

  if (playerAssessments.length > 0) {
    const latest = playerAssessments[0]
    items.push({
      source:      'assessments',
      description: `${playerAssessments.length} assessment${playerAssessments.length !== 1 ? 's' : ''} on record; most recent: ${latest.assessedDate}${latest.overallScore != null ? ` (score: ${latest.overallScore})` : ''}`,
      date:        latest.assessedDate,
      confidence:  'high',
    })
  } else {
    gaps.push(`No assessments on record for ${entity.displayName}.`)
  }

  if (!ctx.coaches || ctx.coaches.length === 0) {
    gaps.push('Coach assignment data not available in current context.')
  }
  if (!ctx.parents || ctx.parents.length === 0) {
    gaps.push('Parent communication history not available in current context.')
  }

  return { items, gaps }
}

function buildGroupEvidence(
  entity: GroupEntity,
  ctx:    AcademyEntityContext,
): { items: EntityEvidence[]; gaps: string[] } {
  const items: EntityEvidence[] = []
  const gaps: string[] = []

  const members = entity.levelId
    ? ctx.players.filter(p => p.currentLevelId === entity.levelId)
    : []
  const stalledCount = members.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90).length

  items.push({
    source:      'player_curriculum_states',
    description: `${members.length} player${members.length !== 1 ? 's' : ''} at associated level${entity.track ? `; track: ${entity.track}` : ''}`,
    date:        null,
    confidence:  members.length > 0 ? 'high' : 'medium',
  })

  if (entity.maxPlayers != null) {
    const over = members.length > entity.maxPlayers
    items.push({
      source:      'groups',
      description: `Capacity: ${members.length}/${entity.maxPlayers}${over ? ' — over capacity' : ''}`,
      date:        null,
      confidence:  'high',
    })
  }

  if (stalledCount > 0) {
    items.push({
      source:      'player_curriculum_states',
      description: `${stalledCount} stalled player${stalledCount !== 1 ? 's' : ''} (≥90 days)`,
      date:        null,
      confidence:  'medium',
    })
  }

  const templates = ctx.templates.filter(t => t.curriculumLevelId === entity.levelId)
  if (templates.length > 0) {
    items.push({
      source:      'class_templates',
      description: `${templates.length} curriculum template${templates.length !== 1 ? 's' : ''} available for this level`,
      date:        null,
      confidence:  'medium',
    })
  } else {
    gaps.push("No class templates linked to this group's level.")
  }

  if (!entity.levelId) {
    gaps.push('Group is not linked to a curriculum level — member list cannot be verified.')
  }

  return { items, gaps }
}

function buildCurriculumLevelEvidence(
  entity: CurriculumLevelEntity,
  ctx:    AcademyEntityContext,
): { items: EntityEvidence[]; gaps: string[] } {
  const items: EntityEvidence[] = []
  const gaps: string[] = []

  const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.id)
  const advancingCount = levelPlayers.filter(p => p.advancementEligible).length
  const stalledCount = levelPlayers.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90).length

  items.push({
    source:      'player_curriculum_states',
    description: `${levelPlayers.length} active player${levelPlayers.length !== 1 ? 's' : ''} at this level`,
    date:        null,
    confidence:  'high',
  })

  if (advancingCount > 0) {
    items.push({
      source:      'player_curriculum_states',
      description: `${advancingCount} player${advancingCount !== 1 ? 's' : ''} advancement-eligible`,
      date:        null,
      confidence:  'high',
    })
  }

  if (stalledCount > 0) {
    items.push({
      source:      'player_curriculum_states',
      description: `${stalledCount} player${stalledCount !== 1 ? 's' : ''} stalled (≥90 days, not advancing)`,
      date:        null,
      confidence:  'medium',
    })
  }

  const templates = ctx.templates.filter(t => t.curriculumLevelId === entity.id)
  if (templates.length > 0) {
    items.push({
      source:      'class_templates',
      description: `${templates.length} template${templates.length !== 1 ? 's' : ''} linked to this level`,
      date:        null,
      confidence:  'high',
    })
  } else {
    gaps.push(`No templates linked to ${entity.displayName}.`)
  }

  return { items, gaps }
}

function buildAssessmentEvidence(
  entity: AssessmentEntity,
  ctx:    AcademyEntityContext,
): { items: EntityEvidence[]; gaps: string[] } {
  const items: EntityEvidence[] = []
  const gaps: string[] = []

  items.push({
    source:      'assessments',
    description: `Assessment date: ${entity.assessedDate}`,
    date:        entity.assessedDate,
    confidence:  'high',
  })

  if (entity.overallScore != null) {
    items.push({
      source:      'assessments',
      description: `Overall score: ${entity.overallScore}`,
      date:        entity.assessedDate,
      confidence:  'high',
    })
  }

  if (entity.promotionReady) {
    items.push({
      source:      'assessments',
      description: 'Promotion-ready: true',
      date:        entity.assessedDate,
      confidence:  'high',
    })
  }

  const player = ctx.players.find(p => p.playerId === entity.playerId)
  if (player) {
    items.push({
      source:      'player_curriculum_states',
      description: `Subject: ${player.playerName} — level: ${player.currentLevelDisplayName ?? player.currentLevelId}`,
      date:        null,
      confidence:  'high',
    })
  } else {
    gaps.push('Player record not available in current context.')
  }

  return { items, gaps }
}

function buildTemplateEvidence(
  entity: TemplateEntity,
  ctx:    AcademyEntityContext,
): { items: EntityEvidence[]; gaps: string[] } {
  const items: EntityEvidence[] = []
  const gaps: string[] = []

  items.push({
    source:      'class_templates',
    description: `Status: ${entity.status}; type: ${entity.templateType ?? 'unspecified'}`,
    date:        null,
    confidence:  'high',
  })

  if (entity.totalDurationMin != null) {
    items.push({
      source:      'class_templates',
      description: `Duration: ${entity.totalDurationMin} minutes`,
      date:        null,
      confidence:  'high',
    })
  }

  if (entity.curriculumLevelId) {
    const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.curriculumLevelId)
    items.push({
      source:      'player_curriculum_states',
      description: `Linked to level with ${levelPlayers.length} active player${levelPlayers.length !== 1 ? 's' : ''}`,
      date:        null,
      confidence:  'medium',
    })
  } else {
    gaps.push('Template not linked to a specific curriculum level.')
  }

  return { items, gaps }
}

// ── Main function ─────────────────────────────────────────────────────────────

export function buildEntityEvidence(entity: AcademyEntity, ctx: AcademyEntityContext): EvidenceChain {
  let items: EntityEvidence[] = []
  let gaps: string[] = []

  switch (entity.kind) {
    case 'player': {
      const r = buildPlayerEvidence(entity, ctx);  items = r.items;  gaps = r.gaps;  break
    }
    case 'group': {
      const r = buildGroupEvidence(entity, ctx);   items = r.items;  gaps = r.gaps;  break
    }
    case 'curriculum_level': {
      const r = buildCurriculumLevelEvidence(entity, ctx); items = r.items; gaps = r.gaps; break
    }
    case 'assessment': {
      const r = buildAssessmentEvidence(entity, ctx); items = r.items; gaps = r.gaps; break
    }
    case 'template': {
      const r = buildTemplateEvidence(entity, ctx); items = r.items; gaps = r.gaps; break
    }
    default:
      gaps.push(`Evidence collection for entity kind '${entity.kind}' not yet implemented.`)
  }

  const highCount = items.filter(i => i.confidence === 'high').length
  const total = items.length
  const overallConfidence: 'high' | 'medium' | 'low' =
    total === 0 ? 'low' :
    highCount / total >= 0.7 ? 'high' :
    highCount / total >= 0.4 ? 'medium' : 'low'

  return {
    entityId:   entity.id,
    entityKind: entity.kind,
    lines:      items.map(i => `• [${i.source}] ${i.description}`),
    evidence:   items,
    confidence: overallConfidence,
    dataGaps:   gaps,
  }
}

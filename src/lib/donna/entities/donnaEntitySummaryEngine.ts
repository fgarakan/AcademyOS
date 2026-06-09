// Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
// Entity Q&A summary engine: produces human-readable DONNA answers for any AcademyEntity.
// buildEntitySummary() is the entry point; DONNA can return headline + detail verbatim.
// Pure TypeScript — no DB, no React, no side effects.

import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import type { RelationshipContext } from '@/lib/donna/relationship/donnaRelationshipIntelligence'
import type {
  AcademyEntity,
  PlayerEntity,
  GroupEntity,
  CurriculumLevelEntity,
  AssessmentEntity,
  TemplateEntity,
} from './donnaAcademyEntityModel'

// ── Answer type ───────────────────────────────────────────────────────────────

export interface EntitySummaryAnswer {
  entityId:        string
  entityKind:      string
  displayName:     string
  headline:        string        // one-line answer; DONNA speaks this first
  detail:          string        // expanded answer with data points
  evidence:        string[]      // supporting evidence lines
  recommendations: string[]      // actionable next steps for the director
  limitations:     string[]      // honest disclosure of missing signals
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const then = new Date(dateStr).getTime()
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)))
}

// ── Per-kind builders ─────────────────────────────────────────────────────────

function buildPlayerSummary(
  entity: PlayerEntity,
  ctx:    AcademyEntityContext,
  _rCtx?: RelationshipContext,
): EntitySummaryAnswer {
  const limitations: string[] = []
  const evidence: string[] = []
  const recommendations: string[] = []

  const level = entity.currentLevelDisplayName ?? entity.currentLevelId
  const daysAtLevel = getDaysSince(entity.enrolledAt)

  evidence.push(`Level: ${level}`)
  evidence.push(`Enrolled at current level for ${daysAtLevel} day${daysAtLevel !== 1 ? 's' : ''}`)

  const playerAssessments = ctx.assessments
    .filter(a => a.playerId === entity.id)
    .sort((a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime())

  if (playerAssessments.length > 0) {
    const latest = playerAssessments[0]
    evidence.push(`Most recent assessment: ${latest.assessedDate}${latest.overallScore != null ? ` (score ${latest.overallScore})` : ''}`)
  }

  let headline: string
  let detail: string

  if (entity.advancementEligible) {
    headline = `${entity.displayName} is advancement-eligible at the ${level} level`
    detail = `${entity.displayName} has met the promotion criteria at ${level} after ${daysAtLevel} days. ${playerAssessments.length > 0 ? `Last assessed on ${playerAssessments[0].assessedDate}.` : 'No recent assessment on record.'}`
    evidence.push('Advancement eligible: true')
    recommendations.push(`Review ${entity.displayName}'s advancement to the next level`)
  } else if (daysAtLevel >= 180) {
    headline = `${entity.displayName} has been at ${level} for ${daysAtLevel} days — high-severity stall`
    detail = `${entity.displayName} has been at the ${level} level for ${daysAtLevel} days without advancing. ${playerAssessments.length === 0 ? 'No assessments are on record.' : `${playerAssessments.length} assessment${playerAssessments.length !== 1 ? 's' : ''} on record; last on ${playerAssessments[0].assessedDate}.`}`
    evidence.push(`Stall severity: high (${daysAtLevel} days)`)
    recommendations.push(`Schedule an assessment for ${entity.displayName}`)
    recommendations.push(`Review development plan for ${entity.displayName}`)
  } else if (daysAtLevel >= 90) {
    headline = `${entity.displayName} is at ${level} — ${daysAtLevel} days, no advancement yet`
    detail = `${entity.displayName} has been at the ${level} level for ${daysAtLevel} days. ${playerAssessments.length > 0 ? `Last assessed: ${playerAssessments[0].assessedDate}.` : 'No assessments on record.'}`
    evidence.push(`Stall severity: medium (${daysAtLevel} days)`)
    recommendations.push(`Check in on ${entity.displayName}'s development progress`)
  } else {
    headline = `${entity.displayName} is actively developing at the ${level} level`
    detail = `${entity.displayName} is at the ${level} level (${daysAtLevel} days in). ${playerAssessments.length > 0 ? `${playerAssessments.length} assessment${playerAssessments.length !== 1 ? 's' : ''} on record.` : 'No assessments yet.'}`
  }

  if (!ctx.coaches || ctx.coaches.length === 0) {
    limitations.push('Coach assignment not available — coaching context cannot be included.')
  }
  if (!ctx.parents || ctx.parents.length === 0) {
    limitations.push('Parent communication history not available in the current context.')
  }

  return { entityId: entity.id, entityKind: entity.kind, displayName: entity.displayName, headline, detail, evidence, recommendations, limitations }
}

function buildGroupSummary(
  entity: GroupEntity,
  ctx:    AcademyEntityContext,
  _rCtx?: RelationshipContext,
): EntitySummaryAnswer {
  const limitations: string[] = []
  const evidence: string[] = []
  const recommendations: string[] = []

  const members = entity.levelId
    ? ctx.players.filter(p => p.currentLevelId === entity.levelId)
    : []
  const stalledCount = members.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90).length
  const advancingCount = members.filter(p => p.advancementEligible).length
  const isOverCapacity = entity.maxPlayers != null && members.length > entity.maxPlayers

  evidence.push(`${members.length} player${members.length !== 1 ? 's' : ''} in group`)
  if (entity.maxPlayers != null) evidence.push(`Capacity: ${members.length}/${entity.maxPlayers}`)
  if (stalledCount > 0) evidence.push(`${stalledCount} stalled (≥90 days)`)
  if (advancingCount > 0) evidence.push(`${advancingCount} advancement-eligible`)

  let headline: string
  let detail: string

  if (members.length === 0) {
    headline = `${entity.displayName} has no players assigned`
    detail = `The ${entity.displayName} group currently has no players at its associated level.`
  } else if (isOverCapacity) {
    headline = `${entity.displayName} is over capacity (${members.length}/${entity.maxPlayers})`
    detail = `The ${entity.displayName} group has ${members.length} players against a max of ${entity.maxPlayers}.${stalledCount > 0 ? ` ${stalledCount} player${stalledCount !== 1 ? 's' : ''} stalled.` : ''}`
    recommendations.push(`Review ${entity.displayName} group capacity — consider splitting or expanding`)
  } else if (members.length > 0 && stalledCount > members.length / 2) {
    headline = `${entity.displayName}: majority (${stalledCount}/${members.length}) of players stalled`
    detail = `${stalledCount} of ${members.length} players in ${entity.displayName} have been at their level 90+ days without advancing.`
    recommendations.push(`Review development plans for stalled players in ${entity.displayName}`)
  } else {
    headline = `${entity.displayName}: ${members.length} player${members.length !== 1 ? 's' : ''}${advancingCount > 0 ? `, ${advancingCount} ready to advance` : ''}`
    detail = `${entity.displayName} is running normally with ${members.length} player${members.length !== 1 ? 's' : ''}.${advancingCount > 0 ? ` ${advancingCount} are advancement-eligible.` : ''}`
  }

  if (!entity.levelId) {
    limitations.push('Group is not linked to a curriculum level — member list cannot be verified.')
  }

  return { entityId: entity.id, entityKind: entity.kind, displayName: entity.displayName, headline, detail, evidence, recommendations, limitations }
}

function buildCurriculumLevelSummary(
  entity: CurriculumLevelEntity,
  ctx:    AcademyEntityContext,
): EntitySummaryAnswer {
  const limitations: string[] = []
  const evidence: string[] = []
  const recommendations: string[] = []

  const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.id)
  const advancingCount = levelPlayers.filter(p => p.advancementEligible).length
  const stalledCount = levelPlayers.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90).length
  const templates = ctx.templates.filter(t => t.curriculumLevelId === entity.id)

  evidence.push(`${levelPlayers.length} active player${levelPlayers.length !== 1 ? 's' : ''}`)
  if (advancingCount > 0) evidence.push(`${advancingCount} advancement-eligible`)
  if (stalledCount > 0) evidence.push(`${stalledCount} stalled (≥90 days)`)
  evidence.push(`${templates.length} template${templates.length !== 1 ? 's' : ''} linked`)

  let headline: string
  let detail: string

  if (levelPlayers.length === 0) {
    headline = `${entity.displayName} has no active players`
    detail = `No players are currently enrolled at the ${entity.displayName} level.`
  } else if (levelPlayers.length > 0 && stalledCount > levelPlayers.length / 2) {
    headline = `${entity.displayName}: high stall rate — ${stalledCount}/${levelPlayers.length} players stalled`
    detail = `${stalledCount} of ${levelPlayers.length} players at ${entity.displayName} have been at this level 90+ days. This level may need a curriculum or coaching review.`
    recommendations.push(`Review development pace at the ${entity.displayName} level`)
  } else {
    headline = `${entity.displayName}: ${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''}${advancingCount > 0 ? `, ${advancingCount} ready to advance` : ''}`
    detail = `${entity.displayName} is operating normally with ${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''}.${advancingCount > 0 ? ` ${advancingCount} are ready to advance.` : ''}${templates.length > 0 ? ` ${templates.length} curriculum template${templates.length !== 1 ? 's' : ''} linked.` : ''}`
    if (advancingCount > 0) {
      recommendations.push(`Review advancement decisions for ${advancingCount} ${entity.displayName} player${advancingCount !== 1 ? 's' : ''}`)
    }
  }

  if (templates.length === 0) {
    limitations.push(`No templates linked to ${entity.displayName} — curriculum content cannot be assessed.`)
  }

  return { entityId: entity.id, entityKind: entity.kind, displayName: entity.displayName, headline, detail, evidence, recommendations, limitations }
}

function buildAssessmentSummary(entity: AssessmentEntity, ctx: AcademyEntityContext): EntitySummaryAnswer {
  const player = ctx.players.find(p => p.playerId === entity.playerId)
  const playerName = player?.playerName ?? 'Unknown player'

  const evidence: string[] = [
    `Date: ${entity.assessedDate}`,
    entity.overallScore != null ? `Score: ${entity.overallScore}` : 'Score: not recorded',
    `Promotion-ready: ${entity.promotionReady ? 'yes' : 'no'}`,
  ]

  const headline = entity.promotionReady
    ? `Assessment for ${playerName} — promotion ready`
    : `Assessment for ${playerName} — not yet ready for promotion`

  const detail = `Assessment completed on ${entity.assessedDate} for ${playerName}${entity.overallScore != null ? ` with a score of ${entity.overallScore}` : ''}. ${entity.promotionReady ? 'Player meets promotion criteria.' : 'Player does not yet meet promotion criteria.'}`

  return {
    entityId:        entity.id,
    entityKind:      entity.kind,
    displayName:     entity.displayName,
    headline,
    detail,
    evidence,
    recommendations: entity.promotionReady ? [`Review ${playerName}'s promotion to the next level`] : [],
    limitations:     player ? [] : ['Player record not available in current context.'],
  }
}

function buildTemplateSummary(entity: TemplateEntity, ctx: AcademyEntityContext): EntitySummaryAnswer {
  const limitations: string[] = []
  const evidence: string[] = [
    `Status: ${entity.status}`,
    `Type: ${entity.templateType ?? 'unspecified'}`,
  ]

  if (entity.totalDurationMin != null) evidence.push(`Duration: ${entity.totalDurationMin} min`)

  let detail = `${entity.displayName} is a ${entity.templateType ?? 'curriculum'} template in ${entity.status} status.`

  if (entity.curriculumLevelId) {
    const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.curriculumLevelId)
    evidence.push(`${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''} at linked level`)
    detail += ` Linked to a level with ${levelPlayers.length} active player${levelPlayers.length !== 1 ? 's' : ''}.`
  } else {
    limitations.push('Template is not linked to a specific curriculum level.')
  }

  return {
    entityId:        entity.id,
    entityKind:      entity.kind,
    displayName:     entity.displayName,
    headline:        `${entity.displayName}: ${entity.status} ${entity.templateType ?? 'template'}`,
    detail,
    evidence,
    recommendations: entity.status !== 'active' ? [`Review and activate template: ${entity.displayName}`] : [],
    limitations,
  }
}

function buildGenericSummary(entity: AcademyEntity): EntitySummaryAnswer {
  return {
    entityId:        entity.id,
    entityKind:      entity.kind,
    displayName:     entity.displayName,
    headline:        `${entity.displayName} (${entity.kind})`,
    detail:          `Entity of kind '${entity.kind}' — detailed summary not yet available for this entity type.`,
    evidence:        [],
    recommendations: [],
    limitations:     [`Detailed summary for '${entity.kind}' entities is not yet implemented.`],
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export function buildEntitySummary(
  entity: AcademyEntity,
  ctx:    AcademyEntityContext,
  rCtx?:  RelationshipContext,
): EntitySummaryAnswer {
  switch (entity.kind) {
    case 'player':           return buildPlayerSummary(entity, ctx, rCtx)
    case 'group':            return buildGroupSummary(entity, ctx, rCtx)
    case 'curriculum_level': return buildCurriculumLevelSummary(entity, ctx)
    case 'assessment':       return buildAssessmentSummary(entity, ctx)
    case 'template':         return buildTemplateSummary(entity, ctx)
    default:                 return buildGenericSummary(entity)
  }
}

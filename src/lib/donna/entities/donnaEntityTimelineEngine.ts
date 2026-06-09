// Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
// Entity timeline builder: produces chronological event sequences for any AcademyEntity.
// buildEntityTimeline() returns TimelineEvent[] sorted newest-first.
// Pure TypeScript — no DB, no React, no side effects.

import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'
import type {
  AcademyEntity,
  PlayerEntity,
  GroupEntity,
  CurriculumLevelEntity,
  AssessmentEntity,
  TemplateEntity,
} from './donnaAcademyEntityModel'

// ── Timeline event kinds ──────────────────────────────────────────────────────

export type TimelineEventKind =
  | 'enrollment'
  | 'assessment_result'
  | 'level_change'
  | 'group_join'
  | 'stall_detected'
  | 'advancement_eligible'
  | 'template_linked'
  | 'coach_assignment'

// ── Timeline event ────────────────────────────────────────────────────────────

export interface TimelineEvent {
  kind:         TimelineEventKind
  date:         string | null  // ISO date string; null = undated/derived
  label:        string
  detail:       string | null
  significance: 'high' | 'medium' | 'low'
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const then = new Date(dateStr).getTime()
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)))
}

function sortByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1   // undated → end
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()  // newest first
  })
}

// ── Per-kind builders ─────────────────────────────────────────────────────────

function buildPlayerTimeline(entity: PlayerEntity, ctx: AcademyEntityContext): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    kind:         'enrollment',
    date:         entity.enrolledAt,
    label:        `Enrolled at ${entity.currentLevelDisplayName ?? 'current level'}`,
    detail:       null,
    significance: 'medium',
  })

  const playerAssessments = ctx.assessments
    .filter(a => a.playerId === entity.id)
    .sort((a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime())

  for (const a of playerAssessments) {
    events.push({
      kind:         'assessment_result',
      date:         a.assessedDate,
      label:        a.promotionReady ? 'Assessment — promotion ready' : 'Assessment completed',
      detail:       a.overallScore != null ? `Score: ${a.overallScore}` : null,
      significance: a.promotionReady ? 'high' : 'medium',
    })
  }

  if (entity.advancementEligible) {
    events.push({
      kind:         'advancement_eligible',
      date:         entity.lastEvaluatedAt,
      label:        'Advancement eligible',
      detail:       'Player meets promotion criteria — awaiting level advancement',
      significance: 'high',
    })
  }

  const daysAtLevel = getDaysSince(entity.enrolledAt)
  if (daysAtLevel >= 90 && !entity.advancementEligible) {
    events.push({
      kind:         'stall_detected',
      date:         null,
      label:        `Stall indicator: ${daysAtLevel} days at current level`,
      detail:       daysAtLevel >= 180
        ? 'High-severity stall — no progression in 6+ months'
        : 'Medium-severity stall — no progression in 3+ months',
      significance: daysAtLevel >= 180 ? 'high' : 'medium',
    })
  }

  return sortByDate(events)
}

function buildGroupTimeline(entity: GroupEntity, ctx: AcademyEntityContext): TimelineEvent[] {
  const events: TimelineEvent[] = []

  const members = entity.levelId
    ? ctx.players.filter(p => p.currentLevelId === entity.levelId)
    : []
  const stalledCount = members.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90).length

  if (members.length > 0) {
    events.push({
      kind:         'group_join',
      date:         null,
      label:        `${members.length} active member${members.length !== 1 ? 's' : ''}`,
      detail:       members.map(p => p.playerName).join(', '),
      significance: 'medium',
    })
  }

  if (stalledCount > 0) {
    events.push({
      kind:         'stall_detected',
      date:         null,
      label:        `${stalledCount} stalled player${stalledCount !== 1 ? 's' : ''} in group`,
      detail:       null,
      significance: members.length > 0 && stalledCount > members.length / 2 ? 'high' : 'medium',
    })
  }

  const templates = entity.levelId
    ? ctx.templates.filter(t => t.curriculumLevelId === entity.levelId)
    : []

  if (templates.length > 0) {
    events.push({
      kind:         'template_linked',
      date:         null,
      label:        `${templates.length} curriculum template${templates.length !== 1 ? 's' : ''} available`,
      detail:       null,
      significance: 'low',
    })
  }

  return sortByDate(events)
}

function buildCurriculumLevelTimeline(entity: CurriculumLevelEntity, ctx: AcademyEntityContext): TimelineEvent[] {
  const events: TimelineEvent[] = []

  const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.id)
  const advancingPlayers = levelPlayers.filter(p => p.advancementEligible)
  const stalledPlayers = levelPlayers.filter(p => !p.advancementEligible && getDaysSince(p.enrolledAt) >= 90)

  if (advancingPlayers.length > 0) {
    events.push({
      kind:         'advancement_eligible',
      date:         null,
      label:        `${advancingPlayers.length} player${advancingPlayers.length !== 1 ? 's' : ''} advancement-eligible`,
      detail:       advancingPlayers.map(p => p.playerName).join(', '),
      significance: 'high',
    })
  }

  if (stalledPlayers.length > 0) {
    events.push({
      kind:         'stall_detected',
      date:         null,
      label:        `${stalledPlayers.length} stalled player${stalledPlayers.length !== 1 ? 's' : ''} at this level`,
      detail:       null,
      significance: levelPlayers.length > 0 && stalledPlayers.length > levelPlayers.length / 2 ? 'high' : 'medium',
    })
  }

  const templates = ctx.templates.filter(t => t.curriculumLevelId === entity.id)
  if (templates.length > 0) {
    events.push({
      kind:         'template_linked',
      date:         null,
      label:        `${templates.length} template${templates.length !== 1 ? 's' : ''} linked`,
      detail:       null,
      significance: 'low',
    })
  }

  return sortByDate(events)
}

function buildAssessmentTimeline(entity: AssessmentEntity): TimelineEvent[] {
  return [{
    kind:         'assessment_result',
    date:         entity.assessedDate,
    label:        entity.promotionReady ? 'Assessment — promotion ready' : 'Assessment recorded',
    detail:       entity.overallScore != null ? `Score: ${entity.overallScore}` : null,
    significance: entity.promotionReady ? 'high' : 'medium',
  }]
}

function buildTemplateTimeline(entity: TemplateEntity, ctx: AcademyEntityContext): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    kind:         'template_linked',
    date:         null,
    label:        `Template status: ${entity.status}`,
    detail:       entity.totalDurationMin != null ? `Duration: ${entity.totalDurationMin} min` : null,
    significance: entity.status === 'active' ? 'medium' : 'low',
  })

  if (entity.curriculumLevelId) {
    const levelPlayers = ctx.players.filter(p => p.currentLevelId === entity.curriculumLevelId)
    if (levelPlayers.length > 0) {
      events.push({
        kind:         'level_change',
        date:         null,
        label:        `${levelPlayers.length} player${levelPlayers.length !== 1 ? 's' : ''} at linked level`,
        detail:       null,
        significance: 'low',
      })
    }
  }

  return events
}

// ── Main function ─────────────────────────────────────────────────────────────

export function buildEntityTimeline(entity: AcademyEntity, ctx: AcademyEntityContext): TimelineEvent[] {
  switch (entity.kind) {
    case 'player':           return buildPlayerTimeline(entity, ctx)
    case 'group':            return buildGroupTimeline(entity, ctx)
    case 'curriculum_level': return buildCurriculumLevelTimeline(entity, ctx)
    case 'assessment':       return buildAssessmentTimeline(entity)
    case 'template':         return buildTemplateTimeline(entity, ctx)
    default:                 return []
  }
}

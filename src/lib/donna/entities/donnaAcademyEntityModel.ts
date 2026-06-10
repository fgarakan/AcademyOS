// Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
// Canonical entity type model for the DONNA entity intelligence layer.
// Defines the AcademyEntity discriminated union, EntityRelationship, EntityEvidence,
// and the RelationshipKind catalog shared by all entity engines.
// Pure TypeScript — no DB, no React, no side effects.

import type { EntityKind } from '@/lib/donna/entity/donnaEntityResolver'

// ── Re-export for convenience ─────────────────────────────────────────────────

export type { EntityKind }

// ── Relationship kinds ────────────────────────────────────────────────────────

export type RelationshipKind =
  | 'is_in_group'
  | 'is_at_level'
  | 'coached_by'
  | 'parent_of'
  | 'uses_template'
  | 'co_group_member'
  | 'same_level_peer'

// ── Evidence ──────────────────────────────────────────────────────────────────

export interface EntityEvidence {
  source:      string         // table / data source name
  description: string         // human-readable signal
  date:        string | null  // ISO date string when available
  confidence:  'high' | 'medium' | 'low'
}

// ── Relationship ──────────────────────────────────────────────────────────────

export interface EntityRelationship {
  kind:              RelationshipKind
  sourceId:          string
  targetId:          string
  targetDisplayName: string
  targetKind:        EntityKind
  confidence:        number  // 0–1
}

// ── Base entity ───────────────────────────────────────────────────────────────

export interface AcademyEntityBase {
  id:            string
  kind:          EntityKind
  displayName:   string
  confidence:    number         // 0–1; resolver confidence
  lastUpdatedAt: string | null
}

// ── Per-kind entity types ─────────────────────────────────────────────────────

export interface PlayerEntity extends AcademyEntityBase {
  kind:                    'player'
  currentLevelId:          string
  currentLevelDisplayName: string | null
  advancementEligible:     boolean
  enrolledAt:              string
  lastEvaluatedAt:         string | null
  primaryCoachId?:         string | null   // Mega Sprint 1505: coach assignment for intelligence engine
}

export interface CoachEntity extends AcademyEntityBase {
  kind: 'coach'
  role: 'head_coach' | 'coach' | 'assistant_coach'
}

export interface ParentEntity extends AcademyEntityBase {
  kind:            'parent'
  linkedPlayerIds: string[]
}

export interface GroupEntity extends AcademyEntityBase {
  kind:       'group'
  levelId:    string | null
  track:      string | null
  maxPlayers: number | null
}

export interface CurriculumLevelEntity extends AcademyEntityBase {
  kind:        'curriculum_level'
  playerCount: number
}

export interface AssessmentEntity extends AcademyEntityBase {
  kind:           'assessment'
  playerId:       string
  assessedDate:   string
  promotionReady: boolean
  overallScore:   number | null
}

export interface TemplateEntity extends AcademyEntityBase {
  kind:              'template'
  templateType:      string | null
  status:            string
  curriculumLevelId: string | null
  totalDurationMin:  number | null
}

export interface SessionEntity extends AcademyEntityBase {
  kind: 'session'
}

export interface WorkflowEntity extends AcademyEntityBase {
  kind: 'workflow'
}

// ── Discriminated union ───────────────────────────────────────────────────────

export type AcademyEntity =
  | PlayerEntity
  | CoachEntity
  | ParentEntity
  | GroupEntity
  | CurriculumLevelEntity
  | AssessmentEntity
  | TemplateEntity
  | SessionEntity
  | WorkflowEntity

// ── Type guards ───────────────────────────────────────────────────────────────

export function isPlayerEntity(e: AcademyEntity): e is PlayerEntity             { return e.kind === 'player' }
export function isGroupEntity(e: AcademyEntity): e is GroupEntity               { return e.kind === 'group' }
export function isAssessmentEntity(e: AcademyEntity): e is AssessmentEntity     { return e.kind === 'assessment' }
export function isCurriculumLevelEntity(e: AcademyEntity): e is CurriculumLevelEntity { return e.kind === 'curriculum_level' }
export function isTemplateEntity(e: AcademyEntity): e is TemplateEntity         { return e.kind === 'template' }
export function isCoachEntity(e: AcademyEntity): e is CoachEntity               { return e.kind === 'coach' }
export function isParentEntity(e: AcademyEntity): e is ParentEntity             { return e.kind === 'parent' }

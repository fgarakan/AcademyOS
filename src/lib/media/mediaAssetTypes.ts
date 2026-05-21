// Sprint 564 — Curriculum Video Asset Model V1
// Core types for curriculum media assets across all linkable object types.
// No media_assets DB table exists yet — these types model the concept layer.
// All media operations are draft-only until a migration adds the table.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type MediaVisibilityLevel =
  | 'internal_only'
  | 'coach_director_only'
  | 'parent_safe'
  | 'player_safe'
  | 'parent_player_safe'
  | 'platform_owner_only'
  | 'licensed_partner_content'

export type MediaSourceType =
  | 'youtube'
  | 'vimeo'
  | 'external_url'
  | 'internal_upload'
  | 'academy_recorded'
  | 'platform_library'

export type MediaOwnerType =
  | 'platform'
  | 'academy'
  | 'coach'
  | 'third_party'
  | 'licensed_partner'

export type MediaReviewStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_revision'

export type MediaLicenseStatus =
  | 'open'
  | 'academy_licensed'
  | 'platform_licensed'
  | 'third_party_licensed'
  | 'unlicensed'

export type LinkedObjectType =
  | 'curriculum_level'
  | 'curriculum_gate'
  | 'curriculum_drill'
  | 'skill'
  | 'sub_skill'
  | 'tactical_concept'
  | 'mental_performance_concept'
  | 'mission'
  | 'badge'
  | 'coach_cue'
  | 'parent_guidance'
  | 'assessment_criterion'
  | 'evidence_requirement'
  | 'session_block'
  | 'player_homework'

export interface MediaAsset {
  assetId: string
  title: string
  description: string | null
  sourceType: MediaSourceType
  sourceUrl: string
  ownerType: MediaOwnerType
  ownerLabel: string | null
  licenseStatus: MediaLicenseStatus
  licenseNote: string | null
  visibilityLevel: MediaVisibilityLevel
  reviewStatus: MediaReviewStatus
  thumbnailUrl: string | null
  durationSeconds: number | null
  attributionLabel: string | null
  tags: string[]
  academyId: string | null
  createdAt: string
  approvedAt: string | null
  approvedBy: string | null
}

export interface MediaAssetDraft {
  title: string
  description: string
  sourceType: MediaSourceType
  sourceUrl: string
  visibilityLevel: MediaVisibilityLevel
  ownerType: MediaOwnerType
  licenseNote: string
  attributionLabel: string
}

export interface MediaAssetLink {
  linkId: string
  assetId: string
  linkedObjectType: LinkedObjectType
  linkedObjectId: string
  linkedObjectLabel: string
  displayOrder: number
  addedAt: string
  addedBy: string | null
  approvedAt: string | null
}

export const VISIBILITY_LABELS: Record<MediaVisibilityLevel, string> = {
  internal_only:           'Internal Only',
  coach_director_only:     'Coach & Director',
  parent_safe:             'Parent Safe',
  player_safe:             'Player Safe',
  parent_player_safe:      'Parent & Player Safe',
  platform_owner_only:     'Platform Owner Only',
  licensed_partner_content: 'Licensed Partner',
}

export const SOURCE_TYPE_LABELS: Record<MediaSourceType, string> = {
  youtube:          'YouTube',
  vimeo:            'Vimeo',
  external_url:     'External Link',
  internal_upload:  'Internal Upload',
  academy_recorded: 'Academy Recorded',
  platform_library: 'Platform Library',
}

export const LINKED_OBJECT_LABELS: Record<LinkedObjectType, string> = {
  curriculum_level:           'Curriculum Level',
  curriculum_gate:            'Exit Gate',
  curriculum_drill:           'Drill',
  skill:                      'Skill',
  sub_skill:                  'Sub-Skill',
  tactical_concept:           'Tactical Concept',
  mental_performance_concept: 'Mental Performance Concept',
  mission:                    'Mission',
  badge:                      'Badge',
  coach_cue:                  'Coach Cue',
  parent_guidance:            'Parent Guidance',
  assessment_criterion:       'Assessment Criterion',
  evidence_requirement:       'Evidence Requirement',
  session_block:              'Session Block',
  player_homework:            'Player Homework',
}

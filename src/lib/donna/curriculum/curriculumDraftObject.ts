// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Extended: Mega Sprint 1836–1865 — setup, instructions, relatedSkills fields
//
// CurriculumDraftObject is the rich object assembled during the DONNA curriculum
// architect conversation. It maps to existing DB columns without requiring a
// migration — see field notes below for packing conventions.

import type { CreateContentItemDraftInput } from '@/lib/actions/curriculumDraftActions'

// ── Modification intent ───────────────────────────────────────────────────────

export type CurriculumModificationIntent =
  | 'add'     // Create a new content item
  | 'modify'  // Change fields on an existing item
  | 'move'    // Relocate item to a different level
  | 'expand'  // Create a harder or easier variation of an existing item
  | 'replace' // Remove existing item + add replacement
  | 'remove'  // Delete an existing item

// ── Draft object ──────────────────────────────────────────────────────────────

export interface CurriculumDraftObject {
  intent: CurriculumModificationIntent

  // Target item — required for modify/move/expand/replace/remove
  targetItemId?: string
  targetItemTitle?: string

  // Level
  levelId?: string
  levelName?: string

  // Core identity
  title: string
  contentType: string

  // The 9 expanded fields:

  // Maps to description: "PURPOSE: {purpose}\n\nCOMMON ERRORS: ...\n\nADVANCEMENT: ..."
  purpose?: string

  // Maps to coach_cues (string[])
  coachingCues: string[]

  // Packed into description after purpose
  commonErrors: string[]

  // Maps to success_criteria (string[])
  successCriteria: string[]

  // Maps to progressions (string[])
  progressions: string[]

  // Maps to regressions (string[])
  regressions: string[]

  // Maps to parent_safe_description
  parentExplanation?: string

  // Packed into description after common errors
  advancementImpact?: string

  // Maps to override_reason on the academy_curriculum_overrides row
  placementReasoning?: string

  // Equipment / court layout — packed into description as "SETUP: ..."
  setup?: string

  // Step-by-step execution notes — packed into description as "INSTRUCTIONS: ..."
  instructions?: string

  // Related skill areas for duplicate detection and review panel
  relatedSkills?: string[]

  // Metadata
  pathway?: string
  difficulty?: number
  durationMin?: number
  durationMax?: number

  // For memory: the raw director description that started this session
  rawInput?: string
}

// ── Description packing ───────────────────────────────────────────────────────

function packDescription(draft: CurriculumDraftObject): string {
  const parts: string[] = []
  if (draft.purpose)           parts.push(`PURPOSE: ${draft.purpose}`)
  if (draft.setup)             parts.push(`SETUP: ${draft.setup}`)
  if (draft.instructions)      parts.push(`INSTRUCTIONS: ${draft.instructions}`)
  if (draft.commonErrors.length > 0)
    parts.push(`COMMON ERRORS:\n${draft.commonErrors.map(e => `- ${e}`).join('\n')}`)
  if (draft.advancementImpact) parts.push(`ADVANCEMENT IMPACT: ${draft.advancementImpact}`)
  if ((draft.relatedSkills ?? []).length > 0)
    parts.push(`RELATED SKILLS: ${draft.relatedSkills!.join(', ')}`)
  return parts.join('\n\n')
}

// ── Mapping to save input ─────────────────────────────────────────────────────

export function mapDraftObjectToCreateInput(draft: CurriculumDraftObject): CreateContentItemDraftInput {
  return {
    levelId:        draft.levelId,
    levelName:      draft.levelName,
    contentType:    draft.contentType as CreateContentItemDraftInput['contentType'],
    title:          draft.title,
    description:    packDescription(draft) || undefined,
    pathway:        draft.pathway as CreateContentItemDraftInput['pathway'],
    difficulty:     draft.difficulty,
    durationMin:    draft.durationMin,
    durationMax:    draft.durationMax,
    coachCues:      draft.coachingCues.length > 0 ? draft.coachingCues : undefined,
    successCriteria: draft.successCriteria.length > 0 ? draft.successCriteria : undefined,
    progressions:   draft.progressions.length > 0 ? draft.progressions : undefined,
    regressions:    draft.regressions.length > 0 ? draft.regressions : undefined,
    overrideReason: draft.placementReasoning,
    rawInput:       draft.rawInput,
    source:         'typed',
  }
}

// ── Empty draft factory ───────────────────────────────────────────────────────

export function createEmptyDraft(intent: CurriculumModificationIntent): CurriculumDraftObject {
  return {
    intent,
    title: '',
    contentType: 'drill',
    coachingCues: [],
    commonErrors: [],
    successCriteria: [],
    progressions: [],
    regressions: [],
    relatedSkills: [],
  }
}

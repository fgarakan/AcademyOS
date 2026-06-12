// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Review panel helpers: convert a CurriculumDraftObject into ordered
// label/value pairs for the pre-save director review screen.

import type { CurriculumDraftObject, CurriculumModificationIntent } from './curriculumDraftObject'

// ── Review field ──────────────────────────────────────────────────────────────

export interface DraftReviewField {
  fieldId:   string
  label:     string
  value:     string | string[]
  isArray:   boolean
  isMissing: boolean
  /** True if this field affects advancement gates */
  isGateSensitive: boolean
}

// ── Intent label ──────────────────────────────────────────────────────────────

export const INTENT_LABELS: Record<CurriculumModificationIntent, string> = {
  add:     'Adding new item',
  modify:  'Modifying existing item',
  move:    'Moving item to new level',
  expand:  'Adding variation',
  replace: 'Replacing item',
  remove:  'Removing item',
}

// ── Review summary builder ────────────────────────────────────────────────────

export function buildReviewSummary(draft: CurriculumDraftObject): DraftReviewField[] {
  const fields: DraftReviewField[] = []

  const push = (
    fieldId: string,
    label: string,
    value: string | string[],
    opts: { isGateSensitive?: boolean } = {},
  ) => {
    const isArray = Array.isArray(value)
    const isEmpty = isArray ? (value as string[]).length === 0 : !(value as string).trim()
    fields.push({
      fieldId,
      label,
      value,
      isArray,
      isMissing: isEmpty,
      isGateSensitive: opts.isGateSensitive ?? false,
    })
  }

  // Always-visible identity fields
  push('intent',       'Action',     INTENT_LABELS[draft.intent])
  push('level',        'Level',      draft.levelName ?? draft.levelId ?? '')
  push('contentType',  'Type',       draft.contentType)

  if (draft.targetItemTitle || draft.targetItemId) {
    push('targetItem', 'Target item', draft.targetItemTitle ?? draft.targetItemId ?? '')
  }

  if (draft.intent !== 'remove') {
    push('title', 'Name', draft.title)
  }

  // Expanded fields
  if (draft.purpose) {
    push('purpose', 'Purpose', draft.purpose)
  }
  if (draft.setup) {
    push('setup', 'Setup', draft.setup)
  }
  if (draft.instructions) {
    push('instructions', 'Instructions', draft.instructions)
  }
  if (draft.coachingCues.length > 0 || draft.intent === 'add' || draft.intent === 'expand') {
    push('coachingCues', 'Coaching cues', draft.coachingCues)
  }
  if (draft.commonErrors.length > 0) {
    push('commonErrors', 'Common errors', draft.commonErrors)
  }
  if (draft.successCriteria.length > 0 || draft.intent === 'add') {
    push('successCriteria', 'Success criteria', draft.successCriteria, { isGateSensitive: true })
  }
  if (draft.progressions.length > 0) {
    push('progressions', 'Progressions', draft.progressions)
  }
  if (draft.regressions.length > 0) {
    push('regressions', 'Regressions', draft.regressions)
  }
  if (draft.parentExplanation) {
    push('parentExplanation', 'Parent explanation', draft.parentExplanation)
  }
  if (draft.advancementImpact) {
    push('advancementImpact', 'Advancement impact', draft.advancementImpact, { isGateSensitive: true })
  }
  if (draft.placementReasoning) {
    push('placementReasoning', 'Reason for change', draft.placementReasoning)
  }
  if ((draft.relatedSkills ?? []).length > 0) {
    push('relatedSkills', 'Related skills', draft.relatedSkills ?? [])
  }

  return fields
}

// ── Completeness check ────────────────────────────────────────────────────────

export function isDraftComplete(draft: CurriculumDraftObject): boolean {
  if (draft.intent === 'remove') {
    return !!(draft.targetItemId || draft.targetItemTitle)
  }
  if (draft.intent === 'modify' || draft.intent === 'move' || draft.intent === 'replace') {
    return !!(draft.targetItemId || draft.targetItemTitle) && !!draft.title
  }
  // add / expand
  return !!(draft.levelId || draft.levelName) && !!draft.title && !!draft.contentType
}

// ── Replace intent: dual-record explanation ──────────────────────────────────

export function buildReplaceExplanation(draft: CurriculumDraftObject): string {
  const oldName = draft.targetItemTitle ?? 'the existing item'
  const newName = draft.title || 'the new item'
  return `This will create two review queue items: remove "${oldName}" and add "${newName}". Both require your approval before anything changes.`
}

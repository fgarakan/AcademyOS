// Generic task draft state — local client-side only, no DB, no server action.
// Used for all guided task completion flows except create_class_template,
// which always uses TemplateDraft / TemplateDraftPanel from Sprints 262/263.

import type { DonnaTaskId } from './donnaTaskContracts'

export type GenericDraftStatus = 'collecting' | 'ready_for_review'

export interface GenericTaskDraft {
  taskId: DonnaTaskId
  collectedFields: Record<string, string>
  status: GenericDraftStatus
  startedAt: string
}

export function createEmptyGenericDraft(taskId: DonnaTaskId): GenericTaskDraft {
  return {
    taskId,
    collectedFields: {},
    status: 'collecting',
    startedAt: new Date().toISOString(),
  }
}

export function applyAnswerToGenericDraft(
  draft: GenericTaskDraft,
  fieldId: string,
  value: string,
): GenericTaskDraft {
  const trimmed = value.trim()
  const updatedFields = { ...draft.collectedFields, [fieldId]: trimmed }
  return {
    ...draft,
    collectedFields: updatedFields,
    status: 'collecting',
  }
}

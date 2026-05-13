// Generic missing question engine — works for any DonnaTaskId.
// Reads the task contract's questionSequence to find the next unanswered question.
// No DB, no API, no AI — pure local contract lookup.

import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'
import type { DonnaTaskId, DonnaTaskQuestion } from './donnaTaskContracts'

/**
 * Returns the next unanswered question from the task's questionSequence.
 * A question is considered answered when collectedFields[fieldId] is non-empty.
 */
export function getNextMissingQuestion(
  taskId: DonnaTaskId,
  collectedFields: Record<string, string>,
): DonnaTaskQuestion | null {
  const contract = DONNA_TASK_CONTRACTS[taskId]
  if (!contract) return null

  for (const q of contract.questionSequence) {
    const value = collectedFields[q.fieldId]
    if (!value || value.trim() === '') return q
  }

  return null
}

/**
 * Returns the fieldIds of required fields that are still missing from collectedFields.
 */
export function getMissingRequiredFieldIds(
  taskId: DonnaTaskId,
  collectedFields: Record<string, string>,
): string[] {
  const contract = DONNA_TASK_CONTRACTS[taskId]
  if (!contract) return []

  return contract.requiredFields
    .filter(f => {
      const v = collectedFields[f.fieldId]
      return !v || v.trim() === ''
    })
    .map(f => f.fieldId)
}

/**
 * Returns true when all required fields in the task contract are satisfied.
 */
export function isTaskDraftComplete(
  taskId: DonnaTaskId,
  collectedFields: Record<string, string>,
): boolean {
  return getMissingRequiredFieldIds(taskId, collectedFields).length === 0
}

/**
 * Returns how many required fields have been answered so far.
 */
export function countAnsweredRequired(
  taskId: DonnaTaskId,
  collectedFields: Record<string, string>,
): number {
  const contract = DONNA_TASK_CONTRACTS[taskId]
  if (!contract) return 0

  return contract.requiredFields.filter(f => {
    const v = collectedFields[f.fieldId]
    return v && v.trim() !== ''
  }).length
}

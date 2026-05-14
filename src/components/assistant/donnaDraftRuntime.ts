// Sprint 317 — Donna Draft Runtime V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Client-side draft state manager for all Donna-guided workflows.
// Manages create / update / undo / reset / summarize for generic task drafts.
// Class template drafts continue to use TemplateDraft from templateDraftParser.ts
// (that type is wired and tested separately; this runtime handles the rest).
//
// All mutations return a new DonnaDraftState — this is immutable/functional.
// DonnaConversationController.ts (Phase 6) holds the active state reference.

import type { DonnaTaskId } from './donnaTaskContracts'
import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'
import type { WorkflowId } from './donnaIntentRouter'
import {
  getNextMissingQuestion,
  isTaskDraftComplete,
  getMissingRequiredFieldIds,
} from './donnaMissingQuestionEngine'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DraftPhase =
  | 'collecting'        // still gathering required fields
  | 'ready_for_review'  // all required fields filled, awaiting director review
  | 'approved'          // director clicked the on-screen Approve button
  | 'discarded'         // director cancelled

export interface DraftFieldEntry {
  fieldId: string
  value: string
  answeredAt: string  // ISO timestamp
}

/** Snapshot of draft state at a single point in time — used for undo history */
export interface DraftSnapshot {
  fields: Record<string, DraftFieldEntry>
  phase: DraftPhase
  snapshotAt: string
}

/** The full mutable draft state object held by the conversation controller */
export interface DonnaDraftState {
  draftId: string        // client-generated unique ID (no DB write)
  workflowId: WorkflowId | null
  taskId: DonnaTaskId
  phase: DraftPhase
  /** All field values keyed by fieldId */
  fields: Record<string, DraftFieldEntry>
  /** Undo history — each entry is a full snapshot before that change */
  history: DraftSnapshot[]
  startedAt: string
  lastModifiedAt: string
}

export interface DraftNextQuestion {
  fieldId: string
  question: string
  order: number
}

export interface DraftSummary {
  taskLabel: string
  phase: DraftPhase
  answeredCount: number
  totalRequired: number
  missingRequiredIds: string[]
  fieldLines: Array<{ label: string; value: string }>
  isComplete: boolean
}

// ── ID generation ──────────────────────────────────────────────────────────────
// Deterministic prefix + timestamp — no crypto needed for a session-local ID.

function generateDraftId(taskId: DonnaTaskId): string {
  return `draft_${taskId}_${Date.now()}`
}

// ── Snapshot helpers ───────────────────────────────────────────────────────────

function snapshotNow(state: DonnaDraftState): DraftSnapshot {
  return {
    fields: { ...state.fields },
    phase: state.phase,
    snapshotAt: new Date().toISOString(),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create a new empty draft for a given task.
 * Pre-populate slots from the intent result if provided.
 */
export function createDraft(
  taskId: DonnaTaskId,
  workflowId: WorkflowId | null,
  initialSlots: Record<string, string> = {},
): DonnaDraftState {
  const now = new Date().toISOString()
  const fields: Record<string, DraftFieldEntry> = {}

  // Apply any slots already extracted by the intent router
  for (const [fieldId, value] of Object.entries(initialSlots)) {
    if (value.trim()) {
      fields[fieldId] = { fieldId, value: value.trim(), answeredAt: now }
    }
  }

  return {
    draftId: generateDraftId(taskId),
    workflowId,
    taskId,
    phase: 'collecting',
    fields,
    history: [],
    startedAt: now,
    lastModifiedAt: now,
  }
}

/**
 * Apply a director's answer to a specific field.
 * Saves a history snapshot before the update so it can be undone.
 * Automatically advances phase to 'ready_for_review' when all required fields are filled.
 */
export function updateDraft(
  state: DonnaDraftState,
  fieldId: string,
  value: string,
): DonnaDraftState {
  const trimmed = value.trim()
  const now = new Date().toISOString()

  const updatedFields = {
    ...state.fields,
    [fieldId]: { fieldId, value: trimmed, answeredAt: now },
  }

  const allCollected: Record<string, string> = {}
  for (const [fid, entry] of Object.entries(updatedFields)) {
    allCollected[fid] = entry.value
  }

  const phase: DraftPhase = isTaskDraftComplete(state.taskId, allCollected)
    ? 'ready_for_review'
    : 'collecting'

  return {
    ...state,
    fields: updatedFields,
    phase,
    history: [...state.history, snapshotNow(state)],
    lastModifiedAt: now,
  }
}

/**
 * Returns the next unanswered required question, or null when the draft is complete.
 */
export function getNextQuestion(state: DonnaDraftState): DraftNextQuestion | null {
  const collectedFields: Record<string, string> = {}
  for (const [fid, entry] of Object.entries(state.fields)) {
    collectedFields[fid] = entry.value
  }

  const q = getNextMissingQuestion(state.taskId, collectedFields)
  if (!q) return null
  return { fieldId: q.fieldId, question: q.question, order: q.order }
}

/**
 * Returns a flat list of all missing required field IDs.
 */
export function getMissingSlots(state: DonnaDraftState): string[] {
  const collectedFields: Record<string, string> = {}
  for (const [fid, entry] of Object.entries(state.fields)) {
    collectedFields[fid] = entry.value
  }
  return getMissingRequiredFieldIds(state.taskId, collectedFields)
}

/**
 * Mark the draft as ready for director review.
 * Only callable when all required fields are filled.
 * Returns the same state unchanged if required fields are still missing.
 */
export function markReadyForReview(state: DonnaDraftState): DonnaDraftState {
  if (getMissingSlots(state).length > 0) return state
  const now = new Date().toISOString()
  return {
    ...state,
    phase: 'ready_for_review',
    history: [...state.history, snapshotNow(state)],
    lastModifiedAt: now,
  }
}

/**
 * Undo the last field answer, reverting to the previous snapshot.
 * No-op if history is empty.
 */
export function undoLastChange(state: DonnaDraftState): DonnaDraftState {
  if (state.history.length === 0) return state
  const previous = state.history[state.history.length - 1]
  const newHistory = state.history.slice(0, -1)
  return {
    ...state,
    fields: previous.fields,
    phase: previous.phase,
    history: newHistory,
    lastModifiedAt: new Date().toISOString(),
  }
}

/**
 * Reset all collected fields and history. Returns draft to 'collecting' phase.
 */
export function resetDraft(state: DonnaDraftState): DonnaDraftState {
  return createDraft(state.taskId, state.workflowId)
}

/**
 * Build a human-readable summary of the draft for Donna to read aloud or display.
 */
export function summarizeDraft(state: DonnaDraftState): DraftSummary {
  const contract = DONNA_TASK_CONTRACTS[state.taskId]
  const collectedFields: Record<string, string> = {}
  for (const [fid, entry] of Object.entries(state.fields)) {
    collectedFields[fid] = entry.value
  }

  const missingRequiredIds = getMissingRequiredFieldIds(state.taskId, collectedFields)
  const totalRequired = contract?.requiredFields.length ?? 0
  const answeredCount = totalRequired - missingRequiredIds.length

  const fieldLines: Array<{ label: string; value: string }> = []
  if (contract) {
    for (const field of [...contract.requiredFields, ...contract.optionalFields]) {
      const entry = state.fields[field.fieldId]
      if (entry) {
        fieldLines.push({ label: field.label, value: entry.value })
      }
    }
  }

  return {
    taskLabel: contract?.label ?? state.taskId,
    phase: state.phase,
    answeredCount,
    totalRequired,
    missingRequiredIds,
    fieldLines,
    isComplete: missingRequiredIds.length === 0,
  }
}

/**
 * Produce the collectedFields map from a DonnaDraftState.
 * Used when passing to existing server actions (donnaDraftExecutionActions.ts).
 */
export function toCollectedFields(state: DonnaDraftState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [fid, entry] of Object.entries(state.fields)) {
    out[fid] = entry.value
  }
  return out
}

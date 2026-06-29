// Sprint 359 — Donna Draft Persistence V1
// Pure utility — sessionStorage only (clears on tab close = safe).
// Persists the active ConversationState draft so directors can navigate
// away and return without losing their in-progress work.
//
// No DB. No API. No React. No side effects outside sessionStorage.

import type { ConversationState } from './donnaConversationController'
import { isPageOwnedWorkflow } from '@/lib/donna/pageOwnedWorkflows'

const DRAFT_KEY = 'academyos:donna:draft:v1'

/**
 * Save the active draft to sessionStorage.
 * Only persists when state.activeDraft is non-null and phase is not terminal.
 */
export function saveDraftToSession(state: ConversationState): void {
  if (typeof window === 'undefined') return
  if (!state.activeDraft) return
  // Sprint 4354 — page-owned workflows (e.g. class_template_creation) are never
  // hosted as a DONNA sidebar collector, so their state must never be persisted.
  // Persisting it is exactly how the stale "CREATE CLASS TEMPLATE" card leaked
  // across routes. Refuse to write it, and proactively clear any legacy entry.
  if (isPageOwnedWorkflow(state.activeDraft.workflowId)) {
    clearDraftSession()
    return
  }
  // Do not persist terminal phases
  if (state.phase === 'cancelled' || state.phase === 'approved') return
  try {
    const payload = JSON.stringify(state)
    window.sessionStorage.setItem(DRAFT_KEY, payload)
  } catch {
    // Storage quota exceeded or disabled — silently ignore
  }
}

/**
 * Load a previously saved draft from sessionStorage.
 * Returns null if nothing is saved or the data is corrupt.
 */
export function loadDraftFromSession(): ConversationState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    // Basic structural guard — must have activeDraft and phase
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('phase' in parsed) ||
      !('activeDraft' in parsed)
    ) {
      return null
    }
    const state = parsed as ConversationState
    // Only restore non-terminal phases with an actual draft
    if (!state.activeDraft) return null
    // Sprint 4354 — a previously-persisted page-owned draft (from a legacy build)
    // must never be restored as a sidebar collector. Drop it and clear the key so
    // it cannot re-surface on Today/Players or anywhere else.
    if (isPageOwnedWorkflow(state.activeDraft.workflowId)) {
      clearDraftSession()
      return null
    }
    if (state.phase === 'cancelled' || state.phase === 'approved') return null
    return state
  } catch {
    return null
  }
}

/**
 * Remove any saved draft from sessionStorage.
 */
export function clearDraftSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Silently ignore
  }
}

/**
 * Returns true if a draft key exists in sessionStorage (does not validate content).
 */
export function hasDraftSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(DRAFT_KEY) !== null
  } catch {
    return false
  }
}

// DONNA Action Memory — Mega Sprint 1991–2020
// Tracks created / pending / completed / dismissed / expired action drafts.
// Storage: academies.settings.donna_action_memory[] (same pattern as evolution memory)
// This is execution history, not intelligence.

import { newDraftId } from './donnaActionContract'
import type { DonnaActionDraft, DonnaActionId, DonnaActionStatus, DonnaActionSourceEngine } from './donnaActionContract'

// ── Memory entry ──────────────────────────────────────────────────────────────

export interface DonnaActionMemoryEntry {
  id:           string    // 'amem_<timestamp>_<random6>'
  draftId:      string    // the draft that was acted upon
  actionId:     DonnaActionId
  label:        string
  entityId:     string | null
  entityLabel:  string | null
  domain:       string
  sourceEngine: DonnaActionSourceEngine
  route:        string
  status:       DonnaActionStatus
  createdAt:    string
  decidedAt:    string | null
  outcome:      string | null   // free-text: "Director navigated to player profile" etc.
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildActionMemoryEntry(
  draft:    DonnaActionDraft,
  status:   DonnaActionStatus,
  outcome?: string,
): DonnaActionMemoryEntry {
  const ts  = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 8)
  return {
    id:           `amem_${ts}_${rnd}`,
    draftId:      draft.id,
    actionId:     draft.actionId,
    label:        draft.label,
    entityId:     draft.entityId,
    entityLabel:  draft.entityLabel,
    domain:       draft.domain,
    sourceEngine: draft.sourceEngine,
    route:        draft.actionTarget.route,
    status,
    createdAt:    draft.createdAt,
    decidedAt:    status !== 'draft' && status !== 'pending' ? new Date().toISOString() : null,
    outcome:      outcome ?? null,
  }
}

// ── Upsert (deduplicate by draftId) ──────────────────────────────────────────

export function upsertActionMemoryEntry(
  memory:  DonnaActionMemoryEntry[],
  entry:   DonnaActionMemoryEntry,
  cap = 200,
): DonnaActionMemoryEntry[] {
  const filtered = memory.filter(m => m.draftId !== entry.draftId)
  return [...filtered, entry].slice(-cap)
}

// ── Retrieval helpers ─────────────────────────────────────────────────────────

export function getCompletedActions(memory: DonnaActionMemoryEntry[]): DonnaActionMemoryEntry[] {
  return memory.filter(m => m.status === 'completed')
}

export function getDismissedActions(memory: DonnaActionMemoryEntry[]): DonnaActionMemoryEntry[] {
  return memory.filter(m => m.status === 'dismissed')
}

export function getPendingActions(memory: DonnaActionMemoryEntry[]): DonnaActionMemoryEntry[] {
  return memory.filter(m => m.status === 'draft' || m.status === 'pending')
}

export function getActionHistoryForDomain(
  memory: DonnaActionMemoryEntry[],
  domain: string,
): DonnaActionMemoryEntry[] {
  return memory.filter(m => m.domain === domain)
}

export function getRecentActions(
  memory: DonnaActionMemoryEntry[],
  limit = 10,
): DonnaActionMemoryEntry[] {
  return [...memory]
    .sort((a, b) => {
      const aDate = a.decidedAt ?? a.createdAt
      const bDate = b.decidedAt ?? b.createdAt
      return bDate.localeCompare(aDate)
    })
    .slice(0, limit)
}

export function wasActionRecentlyCompleted(
  memory:   DonnaActionMemoryEntry[],
  actionId: DonnaActionId,
  withinDays = 7,
): boolean {
  const cutoff = new Date(Date.now() - withinDays * 86_400_000).toISOString()
  return memory.some(
    m => m.actionId === actionId &&
         m.status === 'completed' &&
         (m.decidedAt ?? '') >= cutoff,
  )
}

// Sprint 597 — DONNA Command Memory Within Session V1
// Tracks DONNA command history within a single browser session.
// No DB. No persistence across sessions.
// Pure in-memory state — reset on page reload.

import type { DonnaCommandCategory } from './donnaCommandRouter'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionMemoryEntryStatus =
  | 'pending'
  | 'confirmed'
  | 'submitted'
  | 'cancelled'
  | 'rejected'

export interface SessionMemoryEntry {
  id: string
  timestamp: number
  category: DonnaCommandCategory
  rawInput: string
  actionSummary: string | null
  status: SessionMemoryEntryStatus
  playerName: string | null
  sessionLabel: string | null
}

// ── Memory store (module-level, not exported — use helpers) ───────────────────

let _entries: SessionMemoryEntry[] = []
let _entryCounter = 0

// ── Write helpers ─────────────────────────────────────────────────────────────

export function addSessionMemoryEntry(
  input: Omit<SessionMemoryEntry, 'id' | 'timestamp'>,
): SessionMemoryEntry {
  const entry: SessionMemoryEntry = {
    id: `sm_${++_entryCounter}`,
    timestamp: Date.now(),
    ...input,
  }
  _entries = [entry, ..._entries].slice(0, 50) // cap at 50 entries
  return entry
}

export function updateSessionMemoryEntryStatus(
  id: string,
  status: SessionMemoryEntryStatus,
): boolean {
  const idx = _entries.findIndex(e => e.id === id)
  if (idx === -1) return false
  _entries[idx] = { ..._entries[idx], status }
  return true
}

export function clearSessionMemory(): void {
  _entries = []
  _entryCounter = 0
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getSessionMemoryEntries(): SessionMemoryEntry[] {
  return [..._entries]
}

export function getRecentSessionMemory(limit = 5): SessionMemoryEntry[] {
  return _entries.slice(0, limit)
}

export function getLastEntryForCategory(
  category: DonnaCommandCategory,
): SessionMemoryEntry | null {
  return _entries.find(e => e.category === category) ?? null
}

export function getSubmittedEntries(): SessionMemoryEntry[] {
  return _entries.filter(e => e.status === 'submitted')
}

export function hasPriorContextForCategory(category: DonnaCommandCategory): boolean {
  return _entries.some(e => e.category === category && e.status !== 'cancelled')
}

// ── Summary ───────────────────────────────────────────────────────────────────

export interface SessionMemorySummary {
  totalCommands: number
  submittedCount: number
  cancelledCount: number
  categoriesUsed: DonnaCommandCategory[]
  lastCommandAt: number | null
}

export function getSessionMemorySummary(): SessionMemorySummary {
  const submitted = _entries.filter(e => e.status === 'submitted')
  const cancelled = _entries.filter(e => e.status === 'cancelled')
  const seen = new Set<DonnaCommandCategory>()
  const categories = _entries.map(e => e.category).filter(c => {
    if (seen.has(c)) return false
    seen.add(c)
    return true
  })

  return {
    totalCommands: _entries.length,
    submittedCount: submitted.length,
    cancelledCount: cancelled.length,
    categoriesUsed: categories,
    lastCommandAt: _entries[0]?.timestamp ?? null,
  }
}

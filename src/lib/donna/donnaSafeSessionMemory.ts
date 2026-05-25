// Sprint 691 — DONNA Safe Memory + Session Recall V1
// Lightweight sessionStorage-backed memory for director session continuity.
// Stores only safe, non-sensitive metadata. No raw audio, no coach notes,
// no private child data, no sensitive parent/player content, no DB rows.

const STORAGE_KEY = 'academyos:donna:sessionMemory:v1'
const MAX_PROMPTS = 5
const MAX_SUMMARIES = 5

// ── Safe memory shape ─────────────────────────────────────────────────────────

export interface DonnaSafeSessionMemory {
  currentRoute: string | null
  previousRoute: string | null
  currentModuleLabel: string | null
  previousModuleLabel: string | null
  lastPrompts: string[]          // last 5 safe prompts (truncated to 200 chars)
  lastSummaries: string[]        // last 5 DONNA summaries (truncated to 300 chars)
  lastSafeTopic: string | null   // last non-sensitive topic keyword
  lastSafeEntityLabel: string | null  // last safe entity label (e.g. "Yellow 1 template") — NOT player names
  lastRecommendedNextStep: string | null
  activeWorkflowLabel: string | null
  sessionStartedAt: number       // epoch ms
  lastUpdatedAt: number          // epoch ms
}

export const EMPTY_MEMORY: DonnaSafeSessionMemory = {
  currentRoute: null,
  previousRoute: null,
  currentModuleLabel: null,
  previousModuleLabel: null,
  lastPrompts: [],
  lastSummaries: [],
  lastSafeTopic: null,
  lastSafeEntityLabel: null,
  lastRecommendedNextStep: null,
  activeWorkflowLabel: null,
  sessionStartedAt: Date.now(),
  lastUpdatedAt: Date.now(),
}

// ── Load / save ───────────────────────────────────────────────────────────────

function load(): DonnaSafeSessionMemory {
  if (typeof window === 'undefined') return { ...EMPTY_MEMORY }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_MEMORY, sessionStartedAt: Date.now(), lastUpdatedAt: Date.now() }
    return JSON.parse(raw) as DonnaSafeSessionMemory
  } catch {
    return { ...EMPTY_MEMORY }
  }
}

function save(memory: DonnaSafeSessionMemory): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, lastUpdatedAt: Date.now() }))
  } catch { /* sessionStorage quota exceeded — silent fail */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getSessionMemory(): DonnaSafeSessionMemory {
  return load()
}

export function recordRouteChange(route: string, moduleLabel: string): void {
  const m = load()
  save({
    ...m,
    previousRoute: m.currentRoute,
    previousModuleLabel: m.currentModuleLabel,
    currentRoute: route,
    currentModuleLabel: moduleLabel,
  })
}

export function recordPrompt(prompt: string): void {
  if (!prompt.trim()) return
  const m = load()
  const safe = prompt.trim().slice(0, 200)
  const updated = [safe, ...m.lastPrompts.filter(p => p !== safe)].slice(0, MAX_PROMPTS)
  save({ ...m, lastPrompts: updated })
}

export function recordSummary(summary: string): void {
  if (!summary.trim()) return
  const m = load()
  const safe = summary.trim().slice(0, 300)
  const updated = [safe, ...m.lastSummaries].slice(0, MAX_SUMMARIES)
  save({ ...m, lastSummaries: updated })
}

export function recordTopic(topic: string): void {
  const m = load()
  save({ ...m, lastSafeTopic: topic.slice(0, 100) })
}

export function recordEntityLabel(label: string): void {
  // Only safe non-sensitive labels (e.g. template names, module names).
  // Never pass player names, parent names, or private identifiers here.
  const m = load()
  save({ ...m, lastSafeEntityLabel: label.slice(0, 100) })
}

export function recordNextStep(step: string): void {
  const m = load()
  save({ ...m, lastRecommendedNextStep: step.slice(0, 200) })
}

export function setActiveWorkflow(label: string | null): void {
  const m = load()
  save({ ...m, activeWorkflowLabel: label })
}

export function clearSessionMemory(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

// ── Continuity prompts ────────────────────────────────────────────────────────
// Returns a natural re-entry message based on session memory.
// Called on DONNA panel open when not first open of day.

export function buildContinuityMessage(memory: DonnaSafeSessionMemory, firstName: string | null): string | null {
  const name = firstName ? `, ${firstName}` : ''

  // Sprint 786 — warmer, more natural continuity copy
  // Active workflow in progress
  if (memory.activeWorkflowLabel) {
    return `You were working on "${memory.activeWorkflowLabel}"${name ? `, ${firstName}` : ''}. Want to pick up where you left off?`
  }

  // Previous route was different from current
  if (memory.previousRoute && memory.previousRoute !== memory.currentRoute && memory.previousModuleLabel) {
    return `You were on the ${memory.previousModuleLabel} earlier${name}. Want to go back there, or can I help with something here?`
  }

  // Last prompt recall
  if (memory.lastPrompts.length > 0) {
    const last = memory.lastPrompts[0]
    // Only reference if it's still meaningful (not just "hi" or trivially short)
    if (last.length > 15) {
      return `You were asking about "${last.slice(0, 60)}${last.length > 60 ? '…' : ''}" earlier${name}. Still on that, or something new?`
    }
  }

  // Last module
  if (memory.currentModuleLabel) {
    return `I'm here${name}. What can I help you with on the ${memory.currentModuleLabel}?`
  }

  return null
}

// ── Context connection message ────────────────────────────────────────────────
// When director navigates to a page that connects to what they just asked.

export function buildPageConnectionMessage(
  memory: DonnaSafeSessionMemory,
  currentModuleLabel: string,
  firstName: string | null,
): string | null {
  if (!memory.lastPrompts.length) return null
  const last = memory.lastPrompts[0]
  if (last.length < 15) return null

  const name = firstName ? `, ${firstName}` : ''
  return `You asked about "${last.slice(0, 50)}${last.length > 50 ? '…' : ''}" earlier${name}. Since you're on the ${currentModuleLabel} now, I can help narrow that down here.`
}

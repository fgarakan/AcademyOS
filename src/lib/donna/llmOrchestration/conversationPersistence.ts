// Sprint 995 — DONNA Long Conversation Persistence V1
// Persists DONNA conversation state across page navigations and panel close/reopen.
// localStorage-backed — no DB write, no server state.
//
// V1 scope:
//   - Persist conversation turns across route changes (within session)
//   - Persist last session intent context
//   - Persist active workflow plan step
//   - Caps at 20 turns and 30-day TTL
//
// Integration: Used by DonnaAssistantButton to restore state on panel reopen.
// Not yet wired to the LLM path — Sprint 979+ wires it into the orchestrator input.

import type { ConversationHistory, ConversationTurn } from './types'

// ── Storage keys ──────────────────────────────────────────────────────────────

const CONV_HISTORY_KEY = 'donna:conv:history:v1'
const CONV_INTENT_KEY = 'donna:conv:intent:v1'
const CONV_WORKFLOW_KEY = 'donna:conv:workflow:v1'
const MAX_TURNS = 20
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ── Persistence types ─────────────────────────────────────────────────────────

export interface PersistedConversation {
  history: ConversationHistory
  lastUpdatedAt: number
  academyId: string
}

export interface PersistedIntentContext {
  lastIntent: string | null
  lastActionId: string | null
  lastPathname: string | null
  lastUpdatedAt: number
}

export interface PersistedWorkflowState {
  workflowId: string | null
  currentStep: number
  lastUpdatedAt: number
}

// ── Conversation history persistence ─────────────────────────────────────────

export function saveConversationHistory(history: ConversationHistory, academyId: string): void {
  if (typeof window === 'undefined') return
  try {
    const persisted: PersistedConversation = {
      history: history.slice(-MAX_TURNS),
      lastUpdatedAt: Date.now(),
      academyId,
    }
    window.localStorage.setItem(CONV_HISTORY_KEY, JSON.stringify(persisted))
  } catch { /* quota — silently skip */ }
}

export function loadConversationHistory(academyId: string): ConversationHistory {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CONV_HISTORY_KEY)
    if (!raw) return []
    const persisted = JSON.parse(raw) as PersistedConversation
    if (persisted.academyId !== academyId) return [] // different academy — clear
    if (Date.now() - persisted.lastUpdatedAt > TTL_MS) {
      window.localStorage.removeItem(CONV_HISTORY_KEY)
      return []
    }
    return (persisted.history ?? []).slice(-MAX_TURNS)
  } catch { return [] }
}

export function clearConversationHistory(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(CONV_HISTORY_KEY) } catch { /* silently skip */ }
}

// ── Intent context persistence ────────────────────────────────────────────────

export function saveIntentContext(context: Omit<PersistedIntentContext, 'lastUpdatedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONV_INTENT_KEY, JSON.stringify({ ...context, lastUpdatedAt: Date.now() }))
  } catch { /* silently skip */ }
}

export function loadIntentContext(): PersistedIntentContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONV_INTENT_KEY)
    if (!raw) return null
    const ctx = JSON.parse(raw) as PersistedIntentContext
    if (Date.now() - ctx.lastUpdatedAt > 24 * 60 * 60 * 1000) return null // 24h TTL for intent
    return ctx
  } catch { return null }
}

// ── Workflow state persistence ────────────────────────────────────────────────

export function saveWorkflowState(workflowId: string | null, currentStep: number): void {
  if (typeof window === 'undefined') return
  try {
    const state: PersistedWorkflowState = { workflowId, currentStep, lastUpdatedAt: Date.now() }
    window.localStorage.setItem(CONV_WORKFLOW_KEY, JSON.stringify(state))
  } catch { /* silently skip */ }
}

export function loadWorkflowState(): PersistedWorkflowState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONV_WORKFLOW_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedWorkflowState
  } catch { return null }
}

export function clearWorkflowState(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(CONV_WORKFLOW_KEY) } catch { /* silently skip */ }
}

// ── Full clear ────────────────────────────────────────────────────────────────

export function clearAllConversationState(): void {
  clearConversationHistory()
  clearWorkflowState()
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(CONV_INTENT_KEY) } catch { /* silently skip */ }
  }
}

// ── Append helpers ────────────────────────────────────────────────────────────

export function appendAndSaveTurn(
  academyId: string,
  turn: ConversationTurn,
): ConversationHistory {
  const history = loadConversationHistory(academyId)
  const updated = [...history, turn].slice(-MAX_TURNS)
  saveConversationHistory(updated, academyId)
  return updated
}

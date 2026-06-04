// Sprint 1911–1960 — DONNA Unified Conversation Brain V1
// Cross-turn conversation state tracker.
//
// Bridges the gap between the scattered cooThread, godModeHistory, and
// sessionIntentContext stores. Provides a single source of truth for
// what the current conversation is about and what the last turn produced.
//
// Stored in sessionStorage — survives page navigation within a session
// but clears on tab close. TTL 30 minutes.
//
// Design rules:
//   - No DB, no API, no React, no mutations.
//   - Stores safe structural metadata only (no raw content, no player data).
//   - 30-minute TTL — clears on inactivity.

import type { DirectorIntent } from '@/lib/donna/intent/donnaIntentEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationRole = 'director' | 'coach' | 'parent' | 'player'

export interface ConversationTurnRecord {
  role: 'user' | 'donna'
  content: string
  intentDetected: DirectorIntent | null
  entityLabel: string | null
  goalLabel: string | null
  timestampMs: number
}

export interface DonnaConversationState {
  sessionId: string
  userRole: ConversationRole
  currentRoute: string
  /** Last intent detected by the brain */
  lastIntent: DirectorIntent | null
  /** Last entity label (e.g. "Jamie Chen", "Orange Ball 2") */
  lastEntityLabel: string | null
  /** Last goal label */
  lastGoalLabel: string | null
  /** Last response DONNA produced */
  lastResponse: string | null
  /** Last follow-up question DONNA asked */
  lastFollowUpQuestion: string | null
  /** Recent turns — max 8 */
  turns: ConversationTurnRecord[]
  createdAt: number
  lastActivityAt: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_conversation_state'
const TTL_MS = 30 * 60 * 1000
const MAX_TURNS = 8

// ── Serialization ─────────────────────────────────────────────────────────────

function read(): DonnaConversationState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as DonnaConversationState
    if (Date.now() - state.lastActivityAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

function write(state: DonnaConversationState): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Get the current conversation state (null if empty or expired). */
export function getConversationState(): DonnaConversationState | null {
  return read()
}

/**
 * Initialize or refresh the conversation state for a new panel session.
 * Call this when the DONNA panel opens.
 */
export function initConversationState(role: ConversationRole, route: string): DonnaConversationState {
  const now = Date.now()
  const existing = read()
  // Reuse existing session if role matches and not expired
  if (existing && existing.userRole === role) {
    const refreshed = { ...existing, currentRoute: route, lastActivityAt: now }
    write(refreshed)
    return refreshed
  }
  const state: DonnaConversationState = {
    sessionId: generateId(),
    userRole: role,
    currentRoute: route,
    lastIntent: null,
    lastEntityLabel: null,
    lastGoalLabel: null,
    lastResponse: null,
    lastFollowUpQuestion: null,
    turns: [],
    createdAt: now,
    lastActivityAt: now,
  }
  write(state)
  return state
}

/**
 * Record a completed turn (user message + DONNA response).
 * Updates the state with the latest intent/entity/goal.
 */
export function recordConversationTurn(params: {
  userMessage: string
  donnaResponse: string
  intentDetected: DirectorIntent | null
  entityLabel: string | null
  goalLabel: string | null
  followUpQuestion: string | null
}): void {
  const state = read()
  if (!state) return

  const now = Date.now()
  const userTurn: ConversationTurnRecord = {
    role: 'user',
    content: params.userMessage,
    intentDetected: params.intentDetected,
    entityLabel: params.entityLabel,
    goalLabel: params.goalLabel,
    timestampMs: now,
  }
  const donnaTurn: ConversationTurnRecord = {
    role: 'donna',
    content: params.donnaResponse.slice(0, 200), // cap stored content
    intentDetected: null,
    entityLabel: null,
    goalLabel: null,
    timestampMs: now,
  }

  const turns = [...state.turns, userTurn, donnaTurn].slice(-MAX_TURNS)

  write({
    ...state,
    lastIntent: params.intentDetected,
    lastEntityLabel: params.entityLabel,
    lastGoalLabel: params.goalLabel,
    lastResponse: params.donnaResponse.slice(0, 300),
    lastFollowUpQuestion: params.followUpQuestion,
    turns,
    lastActivityAt: now,
  })
}

/** Update the current route (e.g., on navigation). */
export function updateConversationRoute(route: string): void {
  const state = read()
  if (!state) return
  write({ ...state, currentRoute: route, lastActivityAt: Date.now() })
}

/** Get recent turns as a plain history array for the LLM. */
export function getConversationHistory(): Array<{ role: 'user' | 'donna'; content: string }> {
  const state = read()
  if (!state) return []
  return state.turns.map(t => ({ role: t.role, content: t.content }))
}

/** Clear the conversation state (e.g., on panel close or explicit reset). */
export function clearConversationState(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

/** Touch lastActivityAt to prevent TTL expiry during an active session. */
export function touchConversationActivity(): void {
  const state = read()
  if (!state) return
  write({ ...state, lastActivityAt: Date.now() })
}

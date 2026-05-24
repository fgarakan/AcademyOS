// Sprint 1032 — DONNA Conversational Session Memory V1
// In-session memory for the DONNA chat thread.
// Tracks: conversation turns, topics covered, context injected, actions dispatched.
// Allows DONNA to reference prior turns and build contextual answers.
// Pure in-memory. No DB. No persistence across page reloads.

import type { ChatMessage } from '@/components/donna/DonnaChatThread'
import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Turn types ────────────────────────────────────────────────────────────────

export type TopicDomain =
  | 'session'
  | 'wrap_up'
  | 'players'
  | 'review_queue'
  | 'academy_health'
  | 'curriculum'
  | 'templates'
  | 'general'

export interface ConversationTurn {
  id: string
  userMessage: string | null
  donnaResponse: string | null
  actionId: string | null
  domain: TopicDomain | null
  confidence: DONNAConfidence | null
  sourceNote: string | null
  timestamp: number
}

// ── Pending navigation offer (Sprint 724) ─────────────────────────────────────
// When DONNA offers to navigate ("Want me to take you there?"), the offer is
// stored here. The next user turn is checked for yes/no confirmation.

export interface PendingNavOffer {
  href: string
  label: string
  questionContext: string
}

// ── Session memory shape ──────────────────────────────────────────────────────

export interface DonnaChatSessionState {
  role: DonnaRole
  sessionId: string
  startedAt: number
  turns: ConversationTurn[]
  topicsDiscussed: TopicDomain[]
  actionsDispatched: string[]
  contextLoadedAt: number | null
  lastActivityAt: number
  pendingNavOffer: PendingNavOffer | null   // Sprint 724
}

// ── Module state ──────────────────────────────────────────────────────────────

let _state: DonnaChatSessionState | null = null
let _turnCounter = 0

// ── Initialization ────────────────────────────────────────────────────────────

export function initChatSession(role: DonnaRole): DonnaChatSessionState {
  _turnCounter = 0
  _state = {
    role,
    sessionId: `chat_${Date.now()}`,
    startedAt: Date.now(),
    turns: [],
    topicsDiscussed: [],
    actionsDispatched: [],
    contextLoadedAt: null,
    lastActivityAt: Date.now(),
    pendingNavOffer: null,  // Sprint 724
  }
  return _state
}

export function getChatSession(): DonnaChatSessionState | null {
  return _state
}

export function ensureChatSession(role: DonnaRole): DonnaChatSessionState {
  if (!_state) return initChatSession(role)
  return _state
}

// ── Turn recording ────────────────────────────────────────────────────────────

export function recordTurn(
  userMessage: string | null,
  donnaResponse: string | null,
  options: {
    actionId?: string
    domain?: TopicDomain
    confidence?: DONNAConfidence
    sourceNote?: string | null
  } = {},
): ConversationTurn {
  const state = _state
  if (!state) throw new Error('Chat session not initialized')

  const turn: ConversationTurn = {
    id: `turn_${++_turnCounter}`,
    userMessage,
    donnaResponse,
    actionId: options.actionId ?? null,
    domain: options.domain ?? null,
    confidence: options.confidence ?? null,
    sourceNote: options.sourceNote ?? null,
    timestamp: Date.now(),
  }

  state.turns = [...state.turns, turn].slice(-30) // cap at 30 turns
  state.lastActivityAt = Date.now()

  if (options.domain && !state.topicsDiscussed.includes(options.domain)) {
    state.topicsDiscussed = [...state.topicsDiscussed, options.domain]
  }

  if (options.actionId && !state.actionsDispatched.includes(options.actionId)) {
    state.actionsDispatched = [...state.actionsDispatched, options.actionId]
  }

  return turn
}

export function markContextLoaded(): void {
  if (_state) _state.contextLoadedAt = Date.now()
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getRecentTurns(limit = 5): ConversationTurn[] {
  return (_state?.turns ?? []).slice(-limit)
}

export function getLastDonnaTurn(): ConversationTurn | null {
  const turns = _state?.turns ?? []
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].donnaResponse) return turns[i]
  }
  return null
}

export function hasCoveredTopic(domain: TopicDomain): boolean {
  return _state?.topicsDiscussed.includes(domain) ?? false
}

export function hasDispatchedAction(actionId: string): boolean {
  return _state?.actionsDispatched.includes(actionId) ?? false
}

// ── Context summary for DONNA answer generation ───────────────────────────────

export interface ConversationContextSummary {
  turnsCount: number
  topicsDiscussed: TopicDomain[]
  lastTopic: TopicDomain | null
  lastActionId: string | null
  sessionAgeSeconds: number
  contextIsLoaded: boolean
}

export function getConversationContextSummary(): ConversationContextSummary {
  const state = _state
  if (!state) {
    return {
      turnsCount: 0,
      topicsDiscussed: [],
      lastTopic: null,
      lastActionId: null,
      sessionAgeSeconds: 0,
      contextIsLoaded: false,
    }
  }

  const lastTurn = state.turns[state.turns.length - 1]
  const sessionAgeMs = Date.now() - state.startedAt

  return {
    turnsCount: state.turns.length,
    topicsDiscussed: state.topicsDiscussed,
    lastTopic: lastTurn?.domain ?? null,
    lastActionId: lastTurn?.actionId ?? null,
    sessionAgeSeconds: Math.floor(sessionAgeMs / 1000),
    contextIsLoaded: state.contextLoadedAt !== null,
  }
}

// ── Chat message sync ─────────────────────────────────────────────────────────
// Converts a ChatMessage array into session turns when importing from thread.

export function syncChatMessages(messages: ChatMessage[], role: DonnaRole): void {
  const session = ensureChatSession(role)
  session.turns = []
  _turnCounter = 0

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'user') {
      const nextMsg = messages[i + 1]
      const donnaReply = nextMsg?.role === 'donna' ? nextMsg.text : null
      recordTurn(msg.text, donnaReply, {
        confidence: nextMsg?.confidence,
        sourceNote: nextMsg?.sourceNote,
      })
    }
  }
}

// ── Context-aware response prefix ─────────────────────────────────────────────

export function getContextualPrefix(domain: TopicDomain): string {
  if (!_state) return ''
  const alreadyCovered = hasCoveredTopic(domain)
  if (!alreadyCovered) return ''
  return 'Following up on that — '
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export function clearChatSession(): void {
  _state = null
  _turnCounter = 0
}

// ── Pending navigation offer helpers (Sprint 724) ─────────────────────────────

/** Store a navigation offer after DONNA asks "Want me to take you there?" */
export function setPendingNavOffer(offer: PendingNavOffer): void {
  if (_state) _state.pendingNavOffer = offer
}

/**
 * Consume the pending nav offer — clears it and returns it.
 * Returns null if no offer is pending.
 */
export function consumePendingNavOffer(): PendingNavOffer | null {
  if (!_state || !_state.pendingNavOffer) return null
  const offer = _state.pendingNavOffer
  _state.pendingNavOffer = null
  return offer
}

/** True when a navigation offer is stored and waiting for user confirmation. */
export function hasPendingNavOffer(): boolean {
  return _state?.pendingNavOffer !== null && _state?.pendingNavOffer !== undefined
}

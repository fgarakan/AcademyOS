'use client'

// Sprint 540 — DONNA Conversation State Machine V1
// React hook implementing the DONNA conversation state machine.
// No DB calls from this hook — all writes flow through saveWrapUpDraftAction.

import { useState, useCallback } from 'react'
import type {
  ConversationState,
  ConversationMessage,
  ConversationSession,
  ConversationEvent,
} from './conversationTypes'

// ── ID generator ──────────────────────────────────────────────────────────────

function newId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

// ── Transition guard ──────────────────────────────────────────────────────────

function applyTransition(
  session: ConversationSession,
  event: ConversationEvent,
): ConversationSession {
  const { state } = session

  switch (event.type) {
    case 'OPEN':
      if (state === 'idle') return { ...session, state: 'typing' }
      return session

    case 'ACTIVATE_VOICE':
      if (state === 'idle' || state === 'typing') return { ...session, state: 'listening' }
      return session

    case 'VOICE_TRANSCRIPT':
    case 'VOICE_ERROR':
      if (state === 'listening') return { ...session, state: 'typing' }
      return session

    case 'SUBMIT_MESSAGE': {
      if (state !== 'typing' && state !== 'clarifying') return session
      const msg: ConversationMessage = {
        id: newId(),
        role: 'coach',
        kind: event.isSkipped ? 'answer' : 'answer',
        text: event.text,
        timestamp: nowIso(),
        questionId: event.questionId,
        isSkipped: event.isSkipped ?? false,
        voiceTranscript: null,
      }
      return {
        ...session,
        messages: [...session.messages, msg],
      }
    }

    case 'NEEDS_CLARIFICATION':
      if (state === 'typing' || state === 'clarifying') return { ...session, state: 'clarifying' }
      return session

    case 'READY_TO_SUMMARIZE':
      if (state === 'typing' || state === 'clarifying') return { ...session, state: 'summarizing' }
      return session

    case 'COACH_EDIT':
      if (state === 'summarizing') return { ...session, state: 'typing' }
      return session

    case 'COACH_CONFIRM':
      if (state === 'summarizing') return { ...session, state: 'awaiting_review' }
      return session

    case 'SAVE_SUCCESS':
      if (state === 'awaiting_review') {
        return { ...session, state: 'complete', completedAt: nowIso() }
      }
      return session

    case 'SAVE_ERROR':
      if (state === 'awaiting_review') {
        return { ...session, state: 'error', errorMessage: event.message }
      }
      return session

    case 'RETRY':
      if (state === 'error') return { ...session, state: 'typing', errorMessage: null }
      return session

    default:
      return session
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseConversationStateReturn {
  session: ConversationSession
  state: ConversationState
  messages: ConversationMessage[]
  dispatch: (event: ConversationEvent) => void
  addDonnaMessage: (text: string, kind?: ConversationMessage['kind']) => void
  reset: () => void
}

function makeInitialSession(sessionId: string): ConversationSession {
  return {
    sessionId,
    state: 'idle',
    messages: [],
    draftAnswers: {},
    startedAt: nowIso(),
    completedAt: null,
    errorMessage: null,
  }
}

export function useConversationState(sessionId: string): UseConversationStateReturn {
  const [session, setSession] = useState<ConversationSession>(() =>
    makeInitialSession(sessionId),
  )

  const dispatch = useCallback((event: ConversationEvent) => {
    setSession(prev => applyTransition(prev, event))
  }, [])

  const addDonnaMessage = useCallback(
    (text: string, kind: ConversationMessage['kind'] = 'question') => {
      const msg: ConversationMessage = {
        id: newId(),
        role: 'donna',
        kind,
        text,
        timestamp: nowIso(),
      }
      setSession(prev => ({ ...prev, messages: [...prev.messages, msg] }))
    },
    [],
  )

  const reset = useCallback(() => {
    setSession(makeInitialSession(sessionId))
  }, [sessionId])

  return {
    session,
    state: session.state,
    messages: session.messages,
    dispatch,
    addDonnaMessage,
    reset,
  }
}

// Sprint 540 — DONNA Conversation State Machine V1
// Pure TypeScript types for the DONNA conversation system.
// No DB calls. No 'use client'. Safe to import from server or client.

import type { WrapUpQuestionId, WrapUpAnswerSet } from '@/components/capture/WrapUpGuidedFlow'

// ── State machine ─────────────────────────────────────────────────────────────

export type ConversationState =
  | 'idle'
  | 'typing'
  | 'listening'
  | 'clarifying'
  | 'summarizing'
  | 'awaiting_review'
  | 'complete'
  | 'error'

// ── Messages ──────────────────────────────────────────────────────────────────

export type MessageRole = 'donna' | 'coach'

export type MessageKind =
  | 'question'
  | 'answer'
  | 'clarification'
  | 'summary'
  | 'confirmation'
  | 'system'

export interface ConversationMessage {
  id: string
  role: MessageRole
  kind: MessageKind
  text: string
  timestamp: string
  questionId?: WrapUpQuestionId
  isSkipped?: boolean
  voiceTranscript?: string | null
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface ConversationSession {
  sessionId: string
  state: ConversationState
  messages: ConversationMessage[]
  draftAnswers: Partial<WrapUpAnswerSet>
  startedAt: string
  completedAt: string | null
  errorMessage: string | null
}

// ── Transition events ─────────────────────────────────────────────────────────

export type ConversationEvent =
  | { type: 'OPEN' }
  | { type: 'ACTIVATE_VOICE' }
  | { type: 'VOICE_TRANSCRIPT'; transcript: string }
  | { type: 'VOICE_ERROR' }
  | { type: 'SUBMIT_MESSAGE'; text: string; questionId?: WrapUpQuestionId; isSkipped?: boolean }
  | { type: 'NEEDS_CLARIFICATION' }
  | { type: 'READY_TO_SUMMARIZE' }
  | { type: 'COACH_EDIT' }
  | { type: 'COACH_CONFIRM' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; message: string }
  | { type: 'RETRY' }

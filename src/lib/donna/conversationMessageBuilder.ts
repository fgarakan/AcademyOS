// Sprint 541 — DONNA Conversation Message Model V1
// Builder utilities for ConversationMessage objects.
// Pure TypeScript — no DB, no 'use client', no external imports.

import type { ConversationMessage, MessageKind } from './conversationTypes'
import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'

// ── ID and timestamp helpers ──────────────────────────────────────────────────

function newMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

// ── DONNA message builders ────────────────────────────────────────────────────

export function buildDonnaQuestion(
  text: string,
  questionId?: WrapUpQuestionId,
): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'donna',
    kind: 'question',
    text,
    timestamp: nowIso(),
    questionId,
  }
}

export function buildDonnaClarification(
  text: string,
  questionId?: WrapUpQuestionId,
): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'donna',
    kind: 'clarification',
    text,
    timestamp: nowIso(),
    questionId,
  }
}

export function buildDonnaSummary(text: string): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'donna',
    kind: 'summary',
    text,
    timestamp: nowIso(),
  }
}

export function buildDonnaSystem(text: string): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'donna',
    kind: 'system',
    text,
    timestamp: nowIso(),
  }
}

// ── Coach message builders ────────────────────────────────────────────────────

export function buildCoachAnswer(
  text: string,
  questionId?: WrapUpQuestionId,
  voiceTranscript?: string | null,
): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'coach',
    kind: 'answer',
    text,
    timestamp: nowIso(),
    questionId,
    isSkipped: false,
    voiceTranscript: voiceTranscript ?? null,
  }
}

export function buildCoachSkip(questionId: WrapUpQuestionId): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'coach',
    kind: 'answer',
    text: '',
    timestamp: nowIso(),
    questionId,
    isSkipped: true,
    voiceTranscript: null,
  }
}

export function buildCoachConfirmation(text: string): ConversationMessage {
  return {
    id: newMessageId(),
    role: 'coach',
    kind: 'confirmation',
    text,
    timestamp: nowIso(),
    isSkipped: false,
    voiceTranscript: null,
  }
}

// ── Message predicates ────────────────────────────────────────────────────────

export function isDonnaMessage(msg: ConversationMessage): boolean {
  return msg.role === 'donna'
}

export function isCoachMessage(msg: ConversationMessage): boolean {
  return msg.role === 'coach'
}

export function isSkipped(msg: ConversationMessage): boolean {
  return msg.isSkipped === true
}

export function isAnswered(msg: ConversationMessage): boolean {
  return msg.role === 'coach' && msg.kind === 'answer' && !msg.isSkipped && msg.text.trim().length > 0
}

// ── Message list utilities ────────────────────────────────────────────────────

export function getLastDonnaMessage(messages: ConversationMessage[]): ConversationMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'donna') return messages[i]
  }
  return null
}

export function getAnswerForQuestion(
  messages: ConversationMessage[],
  questionId: WrapUpQuestionId,
): ConversationMessage | null {
  return (
    messages.find(
      m => m.role === 'coach' && m.questionId === questionId && !m.isSkipped,
    ) ?? null
  )
}

export function getAnsweredCount(messages: ConversationMessage[]): number {
  return messages.filter(isAnswered).length
}

export function getSkippedCount(messages: ConversationMessage[]): number {
  return messages.filter(m => m.role === 'coach' && m.isSkipped).length
}

export function filterByKind(
  messages: ConversationMessage[],
  kind: MessageKind,
): ConversationMessage[] {
  return messages.filter(m => m.kind === kind)
}

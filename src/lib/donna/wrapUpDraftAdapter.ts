// Sprint 547 — DONNA Conversation to Draft Adapter V1
// Converts conversation message history into a WrapUpAnswerSet for the review queue.
// No DB writes. Preview-only if persistence is unavailable. Pure TypeScript.

import type { ConversationMessage } from './conversationTypes'
import type { WrapUpAnswerSet, WrapUpAnswer, WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'
import { QUESTION_ORDER } from './wrapUpConversationScript'

// ── Adapter ───────────────────────────────────────────────────────────────────

export interface ConversationToDraftResult {
  draft: WrapUpAnswerSet
  answeredCount: number
  skippedCount: number
  unansweredCount: number
  isComplete: boolean
  isPartial: boolean
}

export function buildDraftFromConversation(
  messages: ConversationMessage[],
  sessionId: string,
): ConversationToDraftResult {
  const answers: WrapUpAnswer[] = QUESTION_ORDER.map(questionId =>
    buildAnswerForQuestion(messages, questionId),
  )

  const answeredCount = answers.filter(a => !a.skipped && a.rawText.trim().length > 0).length
  const skippedCount = answers.filter(a => a.skipped).length
  const unansweredCount = answers.filter(
    a => !a.skipped && a.rawText.trim().length === 0,
  ).length

  const draft: WrapUpAnswerSet = {
    sessionId,
    answers,
    completedAt: new Date().toISOString(),
    totalQuestions: QUESTION_ORDER.length,
    answeredCount,
    skippedCount,
  }

  return {
    draft,
    answeredCount,
    skippedCount,
    unansweredCount,
    isComplete: unansweredCount === 0 && skippedCount < QUESTION_ORDER.length,
    isPartial: answeredCount > 0 && (skippedCount > 0 || unansweredCount > 0),
  }
}

function buildAnswerForQuestion(
  messages: ConversationMessage[],
  questionId: WrapUpQuestionId,
): WrapUpAnswer {
  // Find the last coach message for this question (answers may be corrected)
  let lastCoachMessage: ConversationMessage | null = null
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === 'coach' && m.kind === 'answer' && m.questionId === questionId) {
      lastCoachMessage = m
      break
    }
  }

  if (lastCoachMessage === null) {
    // No response at all — treat as skipped
    return {
      questionId,
      rawText: '',
      voiceTranscript: null,
      answeredAt: new Date().toISOString(),
      skipped: true,
    }
  }

  return {
    questionId,
    rawText: lastCoachMessage.isSkipped ? '' : lastCoachMessage.text.trim(),
    voiceTranscript: null,
    answeredAt: lastCoachMessage.timestamp,
    skipped: lastCoachMessage.isSkipped === true,
  }
}

// ── Draft preview helpers ─────────────────────────────────────────────────────

export function getDraftSummaryLabel(result: ConversationToDraftResult): string {
  if (result.answeredCount === 0) return 'No responses recorded'
  if (result.isComplete) return `All ${result.answeredCount} questions answered`
  if (result.isPartial) {
    const parts: string[] = []
    if (result.answeredCount > 0) parts.push(`${result.answeredCount} answered`)
    if (result.skippedCount > 0) parts.push(`${result.skippedCount} skipped`)
    if (result.unansweredCount > 0) parts.push(`${result.unansweredCount} not recorded`)
    return parts.join(', ')
  }
  return 'Partial wrap-up'
}

export function isDraftSafeToSubmit(result: ConversationToDraftResult): boolean {
  // Safe to submit if at least one question was answered
  return result.answeredCount > 0
}

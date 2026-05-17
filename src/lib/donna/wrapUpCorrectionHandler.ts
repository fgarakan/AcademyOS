// Sprint 545 — DONNA Correction Handling V1
// Detects when a coach is correcting a previous answer and applies the revision.
// Pure TypeScript — no DB, no 'use client'.

import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'
import type { ConversationMessage } from './conversationTypes'

// ── Correction detection ──────────────────────────────────────────────────────

const CORRECTION_PATTERNS: RegExp[] = [
  /^(actually|wait|sorry|hold on|no wait|correction|let me correct|i meant|i mean)\b/i,
  /\b(actually|no,?\s+i meant|i take that back|scratch that|strike that|forget what i said)\b/i,
  /^(change that to|update that|revise that)\b/i,
]

export type CorrectionScope =
  | 'previous_answer'      // corrects the immediately prior coach answer
  | 'named_question'       // references a specific topic (e.g. "the attendance part")
  | 'unknown'

export interface CorrectionAssessment {
  isCorrection: boolean
  scope: CorrectionScope
  targetQuestionId: WrapUpQuestionId | null
  correctedText: string | null
}

// Topic keyword hints for named-question corrections
const QUESTION_TOPIC_HINTS: Record<WrapUpQuestionId, RegExp> = {
  q1_attendance:    /\b(attendance|who was here|who showed up|absences?)\b/i,
  q2_session_actual: /\b(session|plan|blocks?|exercises?|went as planned)\b/i,
  q3_standouts:     /\b(standouts?|highlights?|positive|stood out|excelled)\b/i,
  q4_needs_attention: /\b(attention|needs? (help|focus|support)|concerns?)\b/i,
  q5_follow_up:     /\b(follow.?up|parent|director|scheduling|notes?)\b/i,
}

export function assessCorrection(
  text: string,
  recentMessages: ConversationMessage[],
): CorrectionAssessment {
  const trimmed = text.trim()
  const isCorrection = CORRECTION_PATTERNS.some(p => p.test(trimmed))

  if (!isCorrection) {
    return { isCorrection: false, scope: 'unknown', targetQuestionId: null, correctedText: null }
  }

  // Try to identify which question is being corrected by topic keywords
  let targetQuestionId: WrapUpQuestionId | null = null
  for (const [qid, pattern] of Object.entries(QUESTION_TOPIC_HINTS) as [WrapUpQuestionId, RegExp][]) {
    if (pattern.test(trimmed)) {
      targetQuestionId = qid
      break
    }
  }

  // Fall back to the most recent coach answer if no topic keyword matched
  if (!targetQuestionId) {
    const lastCoachAnswer = [...recentMessages]
      .reverse()
      .find(m => m.role === 'coach' && m.kind === 'answer' && !m.isSkipped)
    targetQuestionId = lastCoachAnswer?.questionId ?? null
  }

  // Extract corrected text by stripping the correction opener
  const correctedText = stripCorrectionOpener(trimmed)

  return {
    isCorrection: true,
    scope: targetQuestionId ? 'named_question' : 'previous_answer',
    targetQuestionId,
    correctedText: correctedText || null,
  }
}

function stripCorrectionOpener(text: string): string {
  const openersToStrip = [
    /^(actually|wait|sorry|hold on|no wait|correction|let me correct),?\s*/i,
    /^(i meant|i mean|change that to|update that|revise that)[:\s]*/i,
    /^(i take that back|scratch that|strike that|forget what i said)[:\s]*/i,
  ]
  let result = text
  for (const pattern of openersToStrip) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}

// ── Apply correction to message history ──────────────────────────────────────

export function applyCorrection(
  messages: ConversationMessage[],
  targetQuestionId: WrapUpQuestionId,
  correctedText: string,
): ConversationMessage[] {
  // Find the last coach answer for this question and replace its text
  const lastMatchIdx = messages.reduce(
    (found, msg, idx) =>
      msg.role === 'coach' && msg.kind === 'answer' && msg.questionId === targetQuestionId
        ? idx
        : found,
    -1,
  )

  if (lastMatchIdx === -1) return messages

  return messages.map((msg, idx) =>
    idx === lastMatchIdx
      ? { ...msg, text: correctedText, isSkipped: false }
      : msg,
  )
}

// ── DONNA response to correction ─────────────────────────────────────────────

export function buildCorrectionAcknowledgement(
  targetQuestionId: WrapUpQuestionId | null,
): string {
  if (!targetQuestionId) return "Got it — I've updated your last answer."

  const questionLabels: Record<WrapUpQuestionId, string> = {
    q1_attendance:     "your attendance note",
    q2_session_actual: "your session note",
    q3_standouts:      "your standouts note",
    q4_needs_attention: "your attention note",
    q5_follow_up:      "your follow-up note",
  }
  const label = questionLabels[targetQuestionId]
  return `Got it — I've updated ${label}.`
}

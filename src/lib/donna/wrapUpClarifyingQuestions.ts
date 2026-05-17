// Sprint 544 — DONNA Adaptive Clarifying Questions V1
// Determines when a coach answer needs clarification and generates the follow-up.
// Pure TypeScript — no DB, no 'use client', no external AI calls.

import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'

// ── Config ────────────────────────────────────────────────────────────────────

const MIN_ANSWER_LENGTH = 10
const SHORT_ANSWER_THRESHOLD = 25

// ── Clarifying question banks per question ────────────────────────────────────

const CLARIFIERS: Record<WrapUpQuestionId, string[]> = {
  q1_attendance: [
    "Who exactly was missing? And do you know why?",
    "Any players who showed up unexpectedly or for the first time?",
    "Was it the full group, or a subset of the usual players?",
  ],
  q2_session_actual: [
    "Which blocks did you cover? Any you had to cut or modify?",
    "What was the main focus of the session — did you stick to the template?",
    "Anything that slowed things down or came up unexpectedly?",
  ],
  q3_standouts: [
    "Which player, and what specifically stood out?",
    "Was it a skill thing, attitude, effort — what type of improvement?",
    "Any other players worth mentioning alongside them?",
  ],
  q4_needs_attention: [
    "Which player, and what's the specific concern?",
    "Is this a technical issue, a behavioural thing, or something else?",
    "Is this new or an ongoing pattern you're flagging?",
  ],
  q5_follow_up: [
    "Is this a parent message, a scheduling note, or something for the director?",
    "Is there a timeline on this, or is it open-ended?",
    "Who specifically should follow up — you, the director, or someone else?",
  ],
}

// ── Vague answer detection ────────────────────────────────────────────────────

const VAGUE_PATTERNS: RegExp[] = [
  /^(yes|no|yep|nope|yeah|nah|fine|ok|okay|sure|good|great|not really|nothing|none)\.?$/i,
  /^(all good|all fine|same as usual|as planned|went well|pretty good|not much)\.?$/i,
  /^(no issues?|no concerns?|no notes?|nothing to add|n\/a|na|-)$/i,
]

export type ClarifyReason = 'too_short' | 'vague_pattern' | 'none'

export interface ClarifyAssessment {
  needsClarification: boolean
  reason: ClarifyReason
  clarifyingQuestion: string | null
}

export function assessAnswer(
  text: string,
  questionId: WrapUpQuestionId,
  clarifyAttempts: number,
): ClarifyAssessment {
  const trimmed = text.trim()

  // Never clarify more than once per question
  if (clarifyAttempts >= 1) {
    return { needsClarification: false, reason: 'none', clarifyingQuestion: null }
  }

  // Too short to be meaningful
  if (trimmed.length < MIN_ANSWER_LENGTH) {
    return {
      needsClarification: true,
      reason: 'too_short',
      clarifyingQuestion: pickClarifier(questionId, 0),
    }
  }

  // Matches a known vague pattern
  if (VAGUE_PATTERNS.some(p => p.test(trimmed))) {
    return {
      needsClarification: true,
      reason: 'vague_pattern',
      clarifyingQuestion: pickClarifier(questionId, 0),
    }
  }

  // Short but not trivially vague — light nudge for attendance/observations only
  if (
    trimmed.length < SHORT_ANSWER_THRESHOLD &&
    (questionId === 'q3_standouts' || questionId === 'q4_needs_attention')
  ) {
    return {
      needsClarification: true,
      reason: 'too_short',
      clarifyingQuestion: pickClarifier(questionId, 1),
    }
  }

  return { needsClarification: false, reason: 'none', clarifyingQuestion: null }
}

function pickClarifier(questionId: WrapUpQuestionId, index: number): string {
  const bank = CLARIFIERS[questionId]
  return bank[index % bank.length]
}

// ── Per-session clarification attempt tracker ─────────────────────────────────

export type ClarifyAttemptMap = Partial<Record<WrapUpQuestionId, number>>

export function incrementClarifyAttempt(
  map: ClarifyAttemptMap,
  questionId: WrapUpQuestionId,
): ClarifyAttemptMap {
  return { ...map, [questionId]: (map[questionId] ?? 0) + 1 }
}

export function getClarifyAttempts(
  map: ClarifyAttemptMap,
  questionId: WrapUpQuestionId,
): number {
  return map[questionId] ?? 0
}

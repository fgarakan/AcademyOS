// Sprint 543 — DONNA Coach Wrap-Up Conversation Script V1
// Defines the full question sequence and DONNA response text per step.
// Pure TypeScript constants — no DB, no 'use client'.

import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'

// ── Script step definition ────────────────────────────────────────────────────

export interface WrapUpScriptStep {
  questionId: WrapUpQuestionId
  donnaOpener: string
  questionText: string
  hint: string
  placeholder: string
  canSkip: boolean
  donnaAcknowledgements: {
    answered: string
    skipped: string
  }
}

// ── Ordered question sequence ─────────────────────────────────────────────────

export const WRAP_UP_SCRIPT: WrapUpScriptStep[] = [
  {
    questionId: 'q1_attendance',
    donnaOpener: "Let's start with attendance.",
    questionText: 'Who was here today?',
    hint: 'Any absences or unexpected players?',
    placeholder: 'Everyone was here / Max was absent / A new player showed up…',
    canSkip: true,
    donnaAcknowledgements: {
      answered: "Got it.",
      skipped: "No problem — we can leave attendance as is.",
    },
  },
  {
    questionId: 'q2_session_actual',
    donnaOpener: "Now let's talk about the session itself.",
    questionText: 'Did the session go as planned?',
    hint: 'Did you complete all the blocks, or were there any changes?',
    placeholder: 'Followed the plan / Skipped the conditioning block / Changed focus due to weather…',
    canSkip: true,
    donnaAcknowledgements: {
      answered: "Noted.",
      skipped: "Fine — the block completion data will speak for itself.",
    },
  },
  {
    questionId: 'q3_standouts',
    donnaOpener: "Any highlights from the group?",
    questionText: 'Who stood out positively?',
    hint: 'Skill breakthroughs, great effort, focus — anything worth noting.',
    placeholder: 'Lucas was exceptional on serve. Emma showed real improvement on movement…',
    canSkip: true,
    donnaAcknowledgements: {
      answered: "Good — I'll capture that.",
      skipped: "No standouts to note — that's fine.",
    },
  },
  {
    questionId: 'q4_needs_attention',
    donnaOpener: "Anyone who needs extra support next time?",
    questionText: 'Who needs attention?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Max was off today…',
    canSkip: true,
    donnaAcknowledgements: {
      answered: "I'll add that to the notes.",
      skipped: "All good — no attention flags.",
    },
  },
  {
    questionId: 'q5_follow_up',
    donnaOpener: "Almost done. Any follow-up items?",
    questionText: 'Any parent or director follow-up?',
    hint: 'Scheduling notes, parent updates needed, or anything for the director.',
    placeholder: 'Talk to Max\'s parent about absences. Director needs to know about group energy today…',
    canSkip: true,
    donnaAcknowledgements: {
      answered: "Noted.",
      skipped: "Nothing to follow up — got it.",
    },
  },
]

// ── Ordered question ID list ──────────────────────────────────────────────────

export const QUESTION_ORDER: WrapUpQuestionId[] = WRAP_UP_SCRIPT.map(s => s.questionId)

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getScriptStep(questionId: WrapUpQuestionId): WrapUpScriptStep | undefined {
  return WRAP_UP_SCRIPT.find(s => s.questionId === questionId)
}

export function getNextQuestionId(
  current: WrapUpQuestionId,
  answeredIds: WrapUpQuestionId[],
): WrapUpQuestionId | null {
  const currentIdx = QUESTION_ORDER.indexOf(current)
  if (currentIdx === -1) return null
  for (let i = currentIdx + 1; i < QUESTION_ORDER.length; i++) {
    const id = QUESTION_ORDER[i]
    if (!answeredIds.includes(id)) return id
  }
  return null
}

export function getFirstUnansweredQuestion(
  answeredIds: WrapUpQuestionId[],
): WrapUpQuestionId | null {
  return QUESTION_ORDER.find(id => !answeredIds.includes(id)) ?? null
}

export function isAllQuestionsAddressed(answeredOrSkippedIds: WrapUpQuestionId[]): boolean {
  return QUESTION_ORDER.every(id => answeredOrSkippedIds.includes(id))
}

// ── Closing lines ─────────────────────────────────────────────────────────────

export const DONNA_CLOSING_LINES = {
  readyToReview: "Great — here's your wrap-up summary. Review it, then hit Wrap Up Session to send it to your director.",
  afterSkipsOnly: "Okay — I have a partial wrap-up. You can still submit it and the director will see what you've noted.",
  allSkipped: "Nothing recorded for this session. If you want to add notes later, use the quick note panel below.",
}

// Sprint 371 — Donna Coach Brief Draft V1
// Extends the communication draft system with a structured coach brief workflow.
// No sending. No DB writes. Pure client-side workflow definition.

import type { CommunicationDraft } from './donnaCommunicationDraft'
import { createCommunicationDraft } from './donnaCommunicationDraft'

// ── Extended type ──────────────────────────────────────────────────────────────

export interface CoachBriefDraft extends CommunicationDraft {
  type: 'coach_brief'
  sessionId?: string
  coachId?: string
  playerCount?: number
  focusArea?: string
  keyPoints: string[]
}

// ── Slot-filling questions ─────────────────────────────────────────────────────

export const COACH_BRIEF_QUESTIONS: Array<{
  fieldId: keyof CommunicationDraft | 'focusArea' | 'keyPoints'
  question: string
  hint?: string
}> = [
  {
    fieldId: 'subject',
    question: "Which coach or session is this brief for?",
    hint: "e.g., 'Coach Maria, Tuesday Orange 2 session'",
  },
  {
    fieldId: 'focusArea',
    question: "What's the main focus area for this session?",
    hint: "e.g., 'forehand consistency', 'live ball games', 'serve and return'",
  },
  {
    fieldId: 'body',
    question: "What key points should the coach know before the session?",
    hint: "e.g., player absences, curriculum objective, any parent notes to keep in mind",
  },
]

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Create a new empty coach brief draft.
 */
export function createCoachBriefDraft(context: {
  sessionId?: string
  coachId?: string
  playerCount?: number
} = {}): CoachBriefDraft {
  const base = createCommunicationDraft('coach_brief', {
    recipientRole: 'coach',
    coachId: context.coachId,
    sessionId: context.sessionId,
  })

  return {
    ...base,
    type: 'coach_brief',
    sessionId: context.sessionId,
    coachId: context.coachId,
    playerCount: context.playerCount,
    focusArea: undefined,
    keyPoints: [],
  }
}

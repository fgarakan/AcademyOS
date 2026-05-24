// Sprint 735 -- DONNA Template Draft Answer Engine V1
// Handles class template creation intent detection, draft parsing,
// clarifying questions, and complete draft summary with coaching cues.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import type { TemplateDraft, TemplateDraftQuestion, TemplateDraftQuestionField } from '@/components/assistant/templateDraftTypes'
import {
  isTemplateCreationIntent,
  parseTemplateDraft,
  applyAnswerToField,
  isDraftReadyForReview,
  extractLevel,
  extractDuration,
  extractBlocks,
} from '@/components/assistant/templateDraftParser'

// -- Types --------------------------------------------------------------------

export interface TemplateDraftAnswerResult {
  answer: DonnaSafeReadAnswer
  updatedDraft: TemplateDraft | null  // null = draft complete or cancelled
  isComplete: boolean
}

// -- Static coaching context --------------------------------------------------
// Block-category-specific coach cues and success criteria.
// Used when DB coach cue library data is not available in DONNA context.
// Coach cues are internal only -- never exposed to parents or players.

const BLOCK_COACH_CUES: Record<string, string> = {
  warm_up: 'Watch for movement quality; prompt athletic stance and readiness.',
  dynamic_warm_up: 'Activate footwork patterns; cue split step and direction changes.',
  rally: 'Observe recovery steps; reinforce consistent patterns and ball tracking.',
  technical: 'Focus on contact point and swing path; reinforce target technique.',
  point_play: 'Observe risk/reward decisions; note pattern awareness and decision-making under pressure.',
  match_play: 'Note competitive behavior and point construction; encourage game strategy.',
  fitness: 'Monitor effort and form; cue appropriate work-to-rest ratio throughout.',
  other: 'Observe player engagement; adjust pace and intensity based on energy levels.',
}

const BLOCK_SUCCESS_CRITERIA: Record<string, string> = {
  warm_up: 'Players physically and mentally ready within allocated time.',
  dynamic_warm_up: 'Movement patterns clean; full range of motion activated.',
  rally: 'Consistent rally patterns; players moving well through the ball.',
  technical: 'Players demonstrating the target technique under light pressure.',
  point_play: 'Players engaging competitively; decision-making visible in match-like situations.',
  match_play: 'Session themes applied in competitive situations; players competing constructively.',
  fitness: 'Appropriate effort levels sustained; form maintained throughout the block.',
  other: 'Players engaged; activities run smoothly within allocated time.',
}

// -- Field match detection ----------------------------------------------------
// Returns true when the user text looks like an answer to the pending question.
// Prevents unrelated queries ("what are my KPIs?") from polluting the draft.

function looksLikeAnswerToField(field: TemplateDraftQuestionField, text: string): boolean {
  switch (field) {
    case 'level':
      return extractLevel(text) !== null
    case 'durationMinutes':
      // Accept "60 min", "90 minutes", and bare numbers like "60" or "90"
      return extractDuration(text) !== null || /^\d{1,3}\s*$/.test(text.trim())
    case 'blockDurations':
      return extractBlocks(text).length > 0
    case 'templateName':
      return text.trim().length > 2
    default:
      return false
  }
}

// -- Answer builders ----------------------------------------------------------

function buildClarifyingAnswer(question: TemplateDraftQuestion): DonnaSafeReadAnswer {
  return {
    actionId: 'template_draft_clarify',
    text: question.question,
    confidence: 'partial',
    sourceNote: 'Template draft in progress',
    followUp: null,
    href: null,
    isAnswerable: true,
  }
}

function buildCompleteDraftAnswer(draft: TemplateDraft): DonnaSafeReadAnswer {
  const level = draft.level ?? 'Unspecified'
  const duration = draft.durationMinutes ?? 0

  const blockLines = draft.blocks
    .filter(b => (b.durationMinutes ?? 0) > 0)
    .map(b => {
      const cue = BLOCK_COACH_CUES[b.category] ?? BLOCK_COACH_CUES.other
      const success = BLOCK_SUCCESS_CRITERIA[b.category] ?? BLOCK_SUCCESS_CRITERIA.other
      return `**${b.name}** -- ${b.durationMinutes} min\nCoach cue: ${cue}\nSuccess: ${success}`
    })
    .join('\n\n')

  const text = [
    `**Class Template Draft -- ${level} (${duration} min)**`,
    '',
    blockLines,
    '',
    'This draft is ready for your review. Nothing is saved until you approve it. Want me to take you to Class Templates?',
  ].join('\n')

  return {
    actionId: 'template_draft_complete',
    text,
    confidence: 'high',
    sourceNote: 'Template draft from session intent',
    followUp: 'Take me to Class Templates',
    href: '/director/class-templates',
    isAnswerable: true,
  }
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 735).
// pendingDraft: pass getPendingTemplateDraft() from session memory.
// Returns null if the text is not template-related and there is no pending draft.

export function tryAnswerTemplateDraftRequest(
  text: string,
  pendingDraft: TemplateDraft | null,
): TemplateDraftAnswerResult | null {
  const t = text.trim()

  // Case 1: Pending draft exists -- check if this text answers the current pending question.
  // If it matches the expected field, apply the answer and advance the draft.
  // If it does not match, fall through to the new intent check (pending draft stays in memory).
  if (pendingDraft !== null && pendingDraft.missingQuestions.length > 0) {
    const firstQ = pendingDraft.missingQuestions[0]
    if (looksLikeAnswerToField(firstQ.field, t)) {
      const updated = applyAnswerToField(pendingDraft, firstQ.field, t)
      if (isDraftReadyForReview(updated)) {
        const final: TemplateDraft = { ...updated, status: 'ready_for_review' }
        return { answer: buildCompleteDraftAnswer(final), updatedDraft: null, isComplete: true }
      }
      const nextQ = updated.missingQuestions[0]
      if (!nextQ) return null
      return { answer: buildClarifyingAnswer(nextQ), updatedDraft: updated, isComplete: false }
    }
    // Text does not match the pending field -- fall through.
    // The pending draft remains in session memory for the next relevant turn.
  }

  // Case 2: New template creation intent detected.
  if (!isTemplateCreationIntent(t)) return null

  const draft = parseTemplateDraft(t)

  if (isDraftReadyForReview(draft)) {
    const final: TemplateDraft = { ...draft, status: 'ready_for_review' }
    return { answer: buildCompleteDraftAnswer(final), updatedDraft: null, isComplete: true }
  }

  const firstQ = draft.missingQuestions[0]
  if (!firstQ) return null

  return { answer: buildClarifyingAnswer(firstQ), updatedDraft: draft, isComplete: false }
}

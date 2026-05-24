// Sprint 627 — DONNA Clarifying Question Engine V1
// Pure TypeScript — no DB calls, no mutations, no UI imports.
// When intent is recognized but context is missing, DONNA asks one focused question.
// One question at a time. Does not ask when answer-only response is obvious.

import { classifyDirectorIntent, type DonnaDirectorIntent, type DirectorIntentResult } from '@/lib/donna/donnaIntentClassifier'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Intents that benefit from clarification ───────────────────────────────────
// Safe, read-only intents do not need clarification — DONNA answers directly.
// Drafting/mutation intents need to know the target object.

const INTENTS_NEEDING_CLARIFICATION = new Set<DonnaDirectorIntent>([
  'parent_summary',
  'level_movement',
  'assessment_or_placement',
  'curriculum_builder',
  'coach_note_summary',
  'ambiguous_context',
])

// ── Contextual signal detection ───────────────────────────────────────────────
// Detects whether the user's text already includes enough context to skip clarification.

function textMentionsPlayer(text: string): boolean {
  // Contains a name-like pattern (capitalised word or explicit "player X")
  return /player [a-z]+|for [a-z]+ [a-z]+|about [a-z]+ [a-z]+/.test(text.toLowerCase())
}

function textMentionsLevel(text: string): boolean {
  return /level \d+|level [a-z]+|green|orange|red|blue|yellow|white|bronze|silver|gold/.test(text.toLowerCase())
}

function textMentionsVisibility(text: string): boolean {
  return /internal|parent.safe|parent only|coaches? only|private|public/.test(text.toLowerCase())
}

// ── Clarification question builder ────────────────────────────────────────────

export function buildClarifyingQuestion(
  intent: DonnaDirectorIntent,
  text: string,
): string | null {
  const t = text.toLowerCase()

  switch (intent) {
    case 'parent_summary':
      if (!textMentionsPlayer(t)) return 'Which player should I draft this parent summary for?'
      if (!textMentionsVisibility(t)) return 'Should this be parent-safe only, or do you want me to flag internal notes for your review too?'
      return null

    case 'level_movement':
      if (!textMentionsPlayer(t)) return 'Which player are you considering for level movement?'
      if (!textMentionsLevel(t)) return 'Which level should they move to?'
      return null

    case 'assessment_or_placement':
      if (!textMentionsPlayer(t)) return 'Which player needs an assessment or placement?'
      return null

    case 'curriculum_builder':
      if (/add|create|build|new/.test(t) && !/level|group|stage/.test(t)) {
        return 'Which level or group should this belong to?'
      }
      return null

    case 'coach_note_summary':
      if (!textMentionsPlayer(t)) return 'Which player\'s coach notes should I summarize?'
      return null

    case 'ambiguous_context':
      return 'Could you give me a bit more context? Are you asking about a specific player, a KPI, or a review action?'

    default:
      return null
  }
}

// ── Clarification needed check ────────────────────────────────────────────────

export function needsClarification(
  intentResult: DirectorIntentResult,
  text: string,
): boolean {
  if (intentResult.safetyClass === 'blocked') return false
  if (!INTENTS_NEEDING_CLARIFICATION.has(intentResult.intent)) return false
  return buildClarifyingQuestion(intentResult.intent, text) !== null
}

// ── Safe clarification answer ─────────────────────────────────────────────────

export function buildClarifyingAnswer(
  intentResult: DirectorIntentResult,
  text: string,
): DonnaSafeReadAnswer | null {
  const question = buildClarifyingQuestion(intentResult.intent, text)
  if (!question) return null

  return {
    actionId: 'clarify',
    text: question,
    confidence: 'partial',
    sourceNote: 'Context needed before proceeding',
    followUp: null,
    href: null,
    isAnswerable: true,
  }
}

// ── Blocked request response ──────────────────────────────────────────────────

export function buildBlockedRequestAnswer(text: string): DonnaSafeReadAnswer {
  const t = text.toLowerCase()

  if (/raw.*note|coach.*note.*parent|note.*to.*parent/.test(t)) {
    return {
      actionId: 'blocked_visibility',
      text: 'I cannot share raw coach notes with parents. Coach notes are internal — they may contain candid observations not suitable for parent communication. I can help draft a parent-safe summary instead, which will go to your review queue before anything is sent.',
      confidence: 'high',
      sourceNote: 'Safety rule: raw coach notes are internal only',
      followUp: 'Want me to draft a parent-safe summary for review?',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  if (/another academy|different academy|other academy/.test(t)) {
    return {
      actionId: 'blocked_tenant',
      text: 'I can only access data within your academy. I cannot show data from another academy.',
      confidence: 'high',
      sourceNote: 'Safety rule: strict academy tenant isolation',
      followUp: null,
      href: null,
      isAnswerable: true,
    }
  }

  if (/move.*player.*now|promote.*now|publish.*now|apply.*now/.test(t)) {
    return {
      actionId: 'blocked_mutation',
      text: 'I cannot apply that change directly. Changes like level movements, publications, and curriculum updates require your explicit approval through the review queue. I can draft a proposal and route it for your review instead.',
      confidence: 'high',
      sourceNote: 'Safety rule: all mutations require director approval',
      followUp: 'Want me to draft a proposal for review?',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  return {
    actionId: 'blocked_general',
    text: 'That action is not something I can do directly. It may require explicit approval, or may expose data beyond what is allowed. I can help route a proposal to your review queue instead.',
    confidence: 'high',
    sourceNote: 'Safety rule: unsafe action blocked',
    followUp: 'Want to route this to review instead?',
    href: '/director/review',
    isAnswerable: true,
  }
}

// ── Sprint 733: Coach assignment clarification (coaches exist but no assignment data) ──
// Fires when user asks "who should coach X" and coaches are already set up.
// The missing-context engine handles the no-coaches case; this handles the has-coaches case.

const COACH_ASSIGNMENT_PATTERN = /\b(who should coach|which coach (should|for|is best)|assign (a )?coach|coach (for|assignment|orange|green|red|white|blue|yellow))\b/i

export function tryCoachAssignmentClarification(
  text: string,
): DonnaSafeReadAnswer | null {
  if (!COACH_ASSIGNMENT_PATTERN.test(text)) return null
  return {
    actionId: 'coach_assignment_clarify',
    text: "Coach-group assignments aren't automated yet -- I can't recommend a specific coach for a group without assignment data. You can set up coach-group assignments manually from the Coaches page. Want me to take you there?",
    confidence: 'partial',
    sourceNote: 'Coach assignment data not yet wired',
    followUp: 'Take me to Coaches',
    href: '/director/onboarding/coaches-permissions',
    isAnswerable: true,
  }
}

// ── Main director clarification dispatcher ────────────────────────────────────
// Called from DonnaVoiceReadyShell after the answer intercepts miss.
// Returns a clarifying question or blocked response — or null if DONNA should proceed normally.

export function tryDirectorClarificationOrBlock(
  text: string,
): DonnaSafeReadAnswer | null {
  // Sprint 733: coach assignment clarification (when coaches exist — no-coaches case handled by missing-context engine)
  const coachAssign = tryCoachAssignmentClarification(text)
  if (coachAssign) return coachAssign

  const intentResult = classifyDirectorIntent(text)

  // Blocked — always respond
  if (intentResult.safetyClass === 'blocked') {
    return buildBlockedRequestAnswer(text)
  }

  // Needs clarification — ask one question
  if (needsClarification(intentResult, text)) {
    return buildClarifyingAnswer(intentResult, text)
  }

  return null
}

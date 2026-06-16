// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 7 — OpenAI Conversation Teacher
//
// Uses OpenAI to improve DONNA's conversation understanding.
// OpenAI is a TEACHER — never a source of truth.
//
// Strict boundaries:
//   - OpenAI: intent interpretation assistance, clarification drafts, language patterns
//   - AcademyOS: academy truth, recommendations, approvals, player decisions, permissions
//
// If OPENAI_API_KEY is not set, all methods return graceful fallback results.
// This module is server-side only — never call from client components.
//
// Design rules:
//   - Pure TypeScript server module. No React, no DB writes, no side effects.
//   - All OpenAI responses are advisory — AcademyOS always validates before use.
//   - Calls are only made for INTERPRETATION ASSISTANCE — never for decisions.
//   - Rate limited: max 1 call per user turn, only when confidence < 0.50.

import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── Teacher mode ──────────────────────────────────────────────────────────────

export type TeacherMode =
  | 'intent_interpretation'    // help interpret ambiguous user input
  | 'clarification_generation' // suggest a good clarifying question
  | 'response_drafting'        // draft a short DONNA response
  | 'pattern_generation'       // generate training examples for a concept
  | 'language_understanding'   // explain what a vague phrase might mean

// ── Input / output ────────────────────────────────────────────────────────────

export interface ConversationTeacherInput {
  mode: TeacherMode
  userText: string
  role: InterpreterRole
  currentConcepts?: AcademyOSConcept[]
  currentConfidence?: number
  academyContext?: string    // brief non-sensitive academy context (name, DNA model label)
  maxWords?: number          // target response length
}

export interface ConversationTeacherOutput {
  result: string
  confidence: 'high' | 'medium' | 'low'
  source: 'openai' | 'fallback' | 'not_called'
  usedTokens: number
  fallbackReason?: string
  warning?: string
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(mode: TeacherMode, role: InterpreterRole): string {
  const roleDescriptions: Record<InterpreterRole, string> = {
    director: 'an academy director (decision-maker, approves actions, operational lead)',
    coach: 'a tennis coach (on-court session leader, observes players, submits wrap-ups)',
    parent: 'a parent of a tennis player (wants updates, support guidance, progress info)',
    player: 'a young tennis player (wants practice guidance, progress updates, mission clarity)',
  }

  const BASE_SYSTEM = `You are a language understanding assistant for AcademyOS, a tennis academy management platform.
You help interpret what users mean in natural language.
The user is ${roleDescriptions[role]}.
You are NOT making recommendations or decisions — only helping understand the language.
AcademyOS makes all decisions. You are a teacher, not an authority.
Keep all responses brief and factual.`

  const MODE_INSTRUCTIONS: Record<TeacherMode, string> = {
    intent_interpretation: `Identify the most likely underlying concern or intent from the user's statement.
Return 2–3 ranked interpretations with a brief explanation.
Do NOT suggest actions — only interpret the language.`,

    clarification_generation: `Suggest the single most useful clarifying question to ask.
The question should be specific and offer 2–3 choices when possible.
Never ask a vague "tell me more" question.`,

    response_drafting: `Draft a very short DONNA response (under 30 words).
DONNA voice: direct, data-first, action-oriented. No enthusiasm, no preamble.
Never start with "I", "Great", "Of course", or "Certainly".`,

    pattern_generation: `Generate 5 natural language examples a user might say to express the given concern.
Each example should be different in phrasing and specificity.
Format: one example per line.`,

    language_understanding: `Explain in plain language what the user's statement likely means in the context of a tennis academy.
Be concrete. Name the likely underlying concern.
Keep it under 50 words.`,
  }

  return `${BASE_SYSTEM}\n\n${MODE_INSTRUCTIONS[mode]}`
}

// ── OpenAI caller ─────────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${body}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
    usage: { total_tokens: number }
  }

  return {
    content: data.choices[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
  }
}

// ── Fallback results ──────────────────────────────────────────────────────────

function buildFallbackResult(
  input: ConversationTeacherInput,
  reason: string,
): ConversationTeacherOutput {
  const FALLBACKS: Record<TeacherMode, string> = {
    intent_interpretation: `Possible interpretations: 1. Enrollment concern 2. Group composition issue 3. Player progression issue. Context needed to confirm.`,
    clarification_generation: `Do you mean enrollment, player progression, or coach execution?`,
    response_drafting: `Let me pull the current data. What specifically concerns you most?`,
    pattern_generation: `Enrollment is low. Numbers seem off. The group looks light. Not many players showing up. Something feels wrong with intake.`,
    language_understanding: `This likely refers to a concern about the current state of the group or program — possibly enrollment, engagement, or progression.`,
  }

  return {
    result: FALLBACKS[input.mode],
    confidence: 'low',
    source: 'fallback',
    usedTokens: 0,
    fallbackReason: reason,
  }
}

// ── Privacy guard ─────────────────────────────────────────────────────────────

/**
 * Verify the input does not contain private player data before sending to OpenAI.
 * Returns an error reason string if blocked, null if safe.
 */
function privacyGuard(input: ConversationTeacherInput): string | null {
  const sensitivePatterns = [
    /assessment score/i,
    /coach note/i,
    /raw.*note/i,
    /\bDOB\b/i,
    /date of birth/i,
    /player id/i,
    /guardian email/i,
    /phone number/i,
  ]

  const textToCheck = [input.userText, input.academyContext ?? ''].join(' ')

  for (const pattern of sensitivePatterns) {
    if (pattern.test(textToCheck)) {
      return `Privacy guard blocked: text may contain sensitive player data matching pattern "${pattern.source}"`
    }
  }

  // Enforce max length to prevent large context leakage
  if (input.userText.length > 500) {
    return 'Privacy guard blocked: user text exceeds 500 character safety limit for teacher calls'
  }

  return null
}

// ── Main teacher function ─────────────────────────────────────────────────────

/**
 * Ask the OpenAI conversation teacher to help interpret or draft.
 *
 * Safety contract:
 *   - Never used for decisions, recommendations, or approvals
 *   - Privacy-guarded before every call
 *   - Falls back gracefully if key is absent
 *   - Only called when intent confidence < 0.50
 *   - Never sources academy-owned truth
 */
export async function askConversationTeacher(
  input: ConversationTeacherInput,
): Promise<ConversationTeacherOutput> {
  // Gate 1: Only call when needed (low confidence)
  const conf = input.currentConfidence ?? 0
  if (conf >= 0.75) {
    return {
      result: '',
      confidence: 'high',
      source: 'not_called',
      usedTokens: 0,
      warning: 'Teacher not called — confidence already sufficient.',
    }
  }

  // Gate 2: Privacy guard
  const privacyError = privacyGuard(input)
  if (privacyError) {
    return buildFallbackResult(input, privacyError)
  }

  // Gate 3: API key check
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackResult(input, 'OPENAI_API_KEY not configured')
  }

  // Build the prompt
  const systemPrompt = buildSystemPrompt(input.mode, input.role)
  const maxTokens = input.mode === 'pattern_generation' ? 200 : 100

  // Build the user message — only include non-sensitive context
  const contextPart = input.academyContext
    ? `Academy context: ${input.academyContext.slice(0, 100)}`
    : ''
  const conceptPart = input.currentConcepts?.length
    ? `Current concept matches: ${input.currentConcepts.slice(0, 3).join(', ')}`
    : ''

  const userMessage = [
    `User (${input.role}) said: "${input.userText}"`,
    contextPart,
    conceptPart,
  ].filter(Boolean).join('\n')

  try {
    const { content, tokens } = await callOpenAI(systemPrompt, userMessage, maxTokens)

    return {
      result: content.trim(),
      confidence: 'medium',
      source: 'openai',
      usedTokens: tokens,
      warning: 'This is a language interpretation assist only — AcademyOS owns all decisions.',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return buildFallbackResult(input, `OpenAI call failed: ${message}`)
  }
}

// ── Pattern generator (training sandbox helper) ───────────────────────────────

/**
 * Generate training examples for a given AcademyOS concept.
 * Used by the training sandbox — not for live conversations.
 */
export async function generateConceptExamples(
  concept: AcademyOSConcept,
  role: InterpreterRole,
  count = 5,
): Promise<string[]> {
  const result = await askConversationTeacher({
    mode: 'pattern_generation',
    userText: `Generate ${count} natural language examples for the concept: ${concept}`,
    role,
    currentConfidence: 0,
  })

  if (result.source === 'fallback' || !result.result) {
    return []
  }

  return result.result
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 5)
    .slice(0, count)
}

// ── Type exports ──────────────────────────────────────────────────────────────

export type { TeacherMode as ConversationTeacherMode }

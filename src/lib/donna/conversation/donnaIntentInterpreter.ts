// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 2 — Multi-Role Intent Interpreter
//
// Extends the existing Director intent engine (intent/donnaIntentEngine.ts)
// to support all four roles: director, coach, parent, player.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Does NOT replace donnaIntentEngine.ts — wraps and extends it for Director.
//   - Coach/parent/player get their own domain-specific intent sets.
//   - Each role has a curated set of intents relevant to their workflow.
//   - Returns possibleIntents, confidence, bestNextQuestion for all roles.

import { classifyIntent as classifyDirectorIntent } from '../intent/donnaIntentEngine'
import type { DirectorIntent } from '../intent/donnaIntentEngine'

// ── Role types ────────────────────────────────────────────────────────────────

export type InterpreterRole = 'director' | 'coach' | 'parent' | 'player'

// ── Coach intents ─────────────────────────────────────────────────────────────

export type CoachIntent =
  | 'session_feedback'     // "practice wasn't great" / "session felt flat"
  | 'player_observation'   // "a few kids struggled" / "noticed some issues"
  | 'group_difficulty'     // "this group is difficult" / "they're all over the place"
  | 'wrap_up_help'         // "need to submit wrap-up" / "help me finish notes"
  | 'attendance_report'    // "marking who was here" / "attendance"
  | 'curriculum_question'  // "what should I focus on?" / "what's next for this group"
  | 'player_help'          // "one player needs extra help" / "player is struggling"
  | 'unknown'

// ── Parent intents ────────────────────────────────────────────────────────────

export type ParentIntent =
  | 'progress_concern'     // "I don't think she's improving" / "not seeing results"
  | 'confidence_concern'   // "he's losing confidence" / "she seems discouraged"
  | 'schedule_question'    // "when is the next session?" / "what time?"
  | 'communication_request' // "can someone call me?" / "I'd like an update"
  | 'support_question'     // "how can I help at home?" / "what should I do?"
  | 'unknown'

// ── Player intents ────────────────────────────────────────────────────────────

export type PlayerIntent =
  | 'what_to_practice'     // "what should I work on?" / "what's my mission?"
  | 'progress_question'    // "am I getting better?" / "how am I doing?"
  | 'next_level'           // "when do I move up?" / "am I ready?"
  | 'feeling_stuck'        // "I feel like I'm not improving" / "I can't get this"
  | 'competition_question' // "when is the next match?" / "when do I compete?"
  | 'unknown'

// ── Unified intent type ───────────────────────────────────────────────────────

export type AnyIntent = DirectorIntent | CoachIntent | ParentIntent | PlayerIntent

// ── Interpreted intent ────────────────────────────────────────────────────────

export interface InterpretedIntent {
  role: InterpreterRole
  primaryIntent: AnyIntent
  confidence: number             // 0–1
  possibleIntents: Array<{ intent: AnyIntent; confidence: number }>
  clarificationNeeded: boolean
  bestNextQuestion: string | null
  extractedEntity: string | null
  reasoning: string
}

// ── Coach signal maps ─────────────────────────────────────────────────────────

interface RoleSignal { signal: string; weight: 'strong' | 'medium' | 'weak' }

const COACH_SIGNALS: Record<CoachIntent, RoleSignal[]> = {
  session_feedback: [
    { signal: "practice wasn't great",         weight: 'strong' },
    { signal: 'session felt flat',             weight: 'strong' },
    { signal: 'session was tough',             weight: 'strong' },
    { signal: 'today was hard',                weight: 'medium' },
    { signal: 'not a great session',           weight: 'strong' },
    { signal: 'rough session',                 weight: 'strong' },
    { signal: 'practice was rough',            weight: 'strong' },
    { signal: 'was rough',                     weight: 'medium' },
    { signal: 'low energy',                    weight: 'strong' },
    { signal: 'practice was off',              weight: 'medium' },
    { signal: 'today went poorly',             weight: 'strong' },
    { signal: 'session could have been better', weight: 'medium' },
    { signal: 'energy was',                    weight: 'strong' },
    { signal: "wasn't working",                weight: 'medium' },
    { signal: "weren't trying",                weight: 'strong' },
    { signal: 'not trying',                    weight: 'strong' },
    { signal: 'getting bored',                 weight: 'strong' },
    { signal: 'bored',                         weight: 'medium' },
  ],
  player_observation: [
    { signal: 'a few kids struggled',          weight: 'strong' },
    { signal: 'noticed',                       weight: 'medium' },
    { signal: 'player was struggling',         weight: 'strong' },
    { signal: 'struggling with',               weight: 'strong' },
    { signal: 'i observed',                    weight: 'strong' },
    { signal: 'one kid',                       weight: 'medium' },
    { signal: 'one player',                    weight: 'medium' },
    { signal: 'saw something',                 weight: 'medium' },
    { signal: 'coach note',                    weight: 'strong' },
    { signal: 'observation',                   weight: 'strong' },
    { signal: 'i want to flag',                weight: 'strong' },
    { signal: 'something to note',             weight: 'medium' },
    { signal: 'ready to move up',              weight: 'strong' },
    { signal: 'ready to advance',              weight: 'strong' },
    { signal: 'might be ready',               weight: 'medium' },
  ],
  group_difficulty: [
    { signal: "all over the place",            weight: 'strong' },
    { signal: 'this group is difficult',       weight: 'strong' },
    { signal: 'hard group',                    weight: 'strong' },
    { signal: 'group is struggling',           weight: 'strong' },
    { signal: "can't get them focused",        weight: 'strong' },
    { signal: "can't get this group",          weight: 'strong' },
    { signal: 'group energy is off',           weight: 'medium' },
    { signal: 'group dynamic',                 weight: 'strong' },
    { signal: 'dynamic was off',               weight: 'medium' },
    { signal: 'different levels',              weight: 'medium' },
    { signal: 'mixed levels',                  weight: 'medium' },
    { signal: 'hard to manage',                weight: 'medium' },
    { signal: 'chaotic',                       weight: 'strong' },
    { signal: 'unfocused',                     weight: 'medium' },
    { signal: 'distracted',                    weight: 'medium' },
  ],
  wrap_up_help: [
    { signal: 'wrap up',                       weight: 'strong' },
    { signal: 'wrap-up',                       weight: 'strong' },
    { signal: 'submit notes',                  weight: 'strong' },
    { signal: 'session notes',                 weight: 'medium' },
    { signal: 'finish my recap',               weight: 'strong' },
    { signal: 'complete the recap',            weight: 'strong' },
    { signal: 'recap',                         weight: 'medium' },
    { signal: 'debrief',                       weight: 'medium' },
  ],
  attendance_report: [
    { signal: 'attendance',                    weight: 'strong' },
    { signal: 'who was there',                 weight: 'strong' },
    { signal: 'who showed up',                 weight: 'strong' },
    { signal: 'mark who came',                 weight: 'strong' },
    { signal: 'missing today',                 weight: 'medium' },
    { signal: 'who was absent',                weight: 'strong' },
    { signal: 'present today',                 weight: 'medium' },
    { signal: 'were present',                  weight: 'strong' },
    { signal: 'who was present',               weight: 'strong' },
  ],
  curriculum_question: [
    { signal: 'what should i focus on',        weight: 'strong' },
    { signal: "what's next for this group",    weight: 'strong' },
    { signal: 'next drill',                    weight: 'medium' },
    { signal: 'what should we work on',        weight: 'strong' },
    { signal: 'lesson plan',                   weight: 'medium' },
    { signal: 'what to teach',                 weight: 'medium' },
    { signal: 'curriculum for',                weight: 'medium' },
    { signal: "wasn't working",                weight: 'medium' },
    { signal: "drill wasn't",                  weight: 'medium' },
    { signal: 'bored with',                    weight: 'medium' },
  ],
  player_help: [
    { signal: 'needs extra help',              weight: 'strong' },
    { signal: 'player is behind',              weight: 'strong' },
    { signal: 'falling behind',                weight: 'medium' },
    { signal: 'needs support',                 weight: 'medium' },
    { signal: 'extra attention',               weight: 'medium' },
    { signal: 'one-on-one',                    weight: 'medium' },
  ],
  unknown: [],
}

// ── Parent signal maps ────────────────────────────────────────────────────────

const PARENT_SIGNALS: Record<ParentIntent, RoleSignal[]> = {
  progress_concern: [
    { signal: "don't think she's improving",   weight: 'strong' },
    { signal: "not seeing results",            weight: 'strong' },
    { signal: "not getting better",            weight: 'strong' },
    { signal: "no improvement",                weight: 'strong' },
    { signal: "hasn't progressed",             weight: 'strong' },
    { signal: "still at the same level",       weight: 'medium' },
    { signal: "nothing is changing",           weight: 'medium' },
    { signal: "wasting time",                  weight: 'medium' },
    { signal: "not worth it",                  weight: 'medium' },
    { signal: "is this working",               weight: 'medium' },
    { signal: 'concerned about',               weight: 'strong' },
  ],
  confidence_concern: [
    { signal: 'losing confidence',             weight: 'strong' },
    { signal: 'seems discouraged',             weight: 'strong' },
    { signal: 'not motivated',                 weight: 'strong' },
    { signal: "doesn't want to go",            weight: 'strong' },
    { signal: "doesn't want to come",          weight: 'strong' },
    { signal: 'seems sad',                     weight: 'medium' },
    { signal: 'cried',                         weight: 'strong' },
    { signal: 'upset after practice',          weight: 'strong' },
    { signal: 'lost interest',                 weight: 'strong' },
    { signal: 'hates tennis',                  weight: 'strong' },
    { signal: 'wants to quit',                 weight: 'strong' },
    { signal: 'want to quit',                  weight: 'strong' },
  ],
  schedule_question: [
    { signal: 'when is',                       weight: 'medium' },
    { signal: 'what time',                     weight: 'medium' },
    { signal: 'schedule',                      weight: 'strong' },
    { signal: 'next session',                  weight: 'strong' },
    { signal: 'calendar',                      weight: 'medium' },
    { signal: 'cancelled',                     weight: 'medium' },
    { signal: 'rescheduled',                   weight: 'medium' },
  ],
  communication_request: [
    { signal: 'call me',                       weight: 'strong' },
    { signal: 'can someone reach out',         weight: 'strong' },
    { signal: 'want to talk',                  weight: 'medium' },
    { signal: 'can we meet',                   weight: 'medium' },
    { signal: 'can i meet',                    weight: 'strong' },
    { signal: 'meet with',                     weight: 'strong' },
    { signal: 'meeting with coach',            weight: 'medium' },
    { signal: 'speak with',                    weight: 'medium' },
    { signal: 'get an update',                 weight: 'strong' },
    { signal: 'hear from',                     weight: 'medium' },
  ],
  support_question: [
    { signal: 'how can i help',                weight: 'strong' },
    { signal: 'what should i do at home',      weight: 'strong' },
    { signal: 'what should i say',             weight: 'strong' },
    { signal: 'work on at home',               weight: 'strong' },
    { signal: 'at home',                       weight: 'weak' },
    { signal: 'what can i do',                 weight: 'medium' },
    { signal: 'best way to support',           weight: 'strong' },
    { signal: 'practice at home',              weight: 'medium' },
    { signal: 'should i push',                 weight: 'medium' },
    { signal: 'how to encourage',              weight: 'medium' },
  ],
  unknown: [],
}

// ── Player signal maps ────────────────────────────────────────────────────────

const PLAYER_SIGNALS: Record<PlayerIntent, RoleSignal[]> = {
  what_to_practice: [
    { signal: 'what should i work on',         weight: 'strong' },
    { signal: 'what to practice',              weight: 'strong' },
    { signal: "what's my mission",             weight: 'strong' },
    { signal: 'what do i do today',            weight: 'medium' },
    { signal: 'what to focus on',              weight: 'medium' },
    { signal: 'what drill',                    weight: 'medium' },
  ],
  progress_question: [
    { signal: 'am i getting better',           weight: 'strong' },
    { signal: 'how am i doing',                weight: 'strong' },
    { signal: 'is my game improving',          weight: 'strong' },
    { signal: "how's my progress",             weight: 'strong' },
    { signal: 'my progress',                   weight: 'strong' },
    { signal: 'did i improve',                 weight: 'medium' },
    { signal: 'how do i look',                 weight: 'medium' },
  ],
  next_level: [
    { signal: 'when do i move up',             weight: 'strong' },
    { signal: 'am i ready',                    weight: 'strong' },
    { signal: 'next level',                    weight: 'strong' },
    { signal: 'ready to advance',              weight: 'strong' },
    { signal: 'move to orange',                weight: 'medium' },
    { signal: 'move to green',                 weight: 'medium' },
  ],
  feeling_stuck: [
    { signal: 'feel stuck',                    weight: 'strong' },
    { signal: "can't get this",                weight: 'strong' },
    { signal: "can't get better",              weight: 'strong' },
    { signal: "not improving",                 weight: 'strong' },
    { signal: "keep making mistakes",          weight: 'strong' },
    { signal: "keep making",                   weight: 'medium' },
    { signal: "same mistakes",                 weight: 'strong' },
    { signal: "nothing is working",            weight: 'strong' },
    { signal: 'frustrated',                    weight: 'strong' },
    { signal: "don't get it",                  weight: 'medium' },
    { signal: 'in the net',                    weight: 'medium' },
    { signal: 'keeps going',                   weight: 'medium' },
    { signal: 'making mistakes',               weight: 'medium' },
  ],
  competition_question: [
    { signal: 'next match',                    weight: 'strong' },
    { signal: 'when do i compete',             weight: 'strong' },
    { signal: 'can i compete',                 weight: 'strong' },
    { signal: 'tournament',                    weight: 'medium' },
    { signal: 'competition',                   weight: 'medium' },
    { signal: 'game',                          weight: 'weak' },
  ],
  unknown: [],
}

// ── Signal scorer ─────────────────────────────────────────────────────────────

function scoreSignals<T extends string>(
  text: string,
  signalMap: Record<T, RoleSignal[]>,
): Array<{ intent: T; confidence: number }> {
  const lower = text.toLowerCase()
  const WEIGHTS: Record<'strong' | 'medium' | 'weak', number> = {
    strong: 0.40,
    medium: 0.20,
    weak: 0.08,
  }

  return (Object.keys(signalMap) as T[])
    .filter(intent => intent !== 'unknown')
    .map(intent => {
      const signals = signalMap[intent]
      const score = signals.reduce((sum, s) => {
        return lower.includes(s.signal) ? sum + WEIGHTS[s.weight] : sum
      }, 0)
      return { intent, confidence: Math.min(score, 1.0) }
    })
    .filter(r => r.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
}

// ── Best next question builders ───────────────────────────────────────────────

function buildCoachNextQuestion(intent: CoachIntent, entity: string | null): string {
  const entityPart = entity ? ` about ${entity}` : ''
  switch (intent) {
    case 'session_feedback':
      return `What was the main issue${entityPart}? Was it effort, engagement, or a specific skill?`
    case 'player_observation':
      return `Which player${entityPart} are you referring to, and what specifically did you notice?`
    case 'group_difficulty':
      return `Is the group struggling with focus, mixed skill levels, or something specific in today\'s drill?`
    case 'wrap_up_help':
      return `What part of the wrap-up do you need help with — attendance, observations, or session notes?`
    case 'attendance_report':
      return `Which session are you marking attendance for — today\'s or a past session?`
    case 'curriculum_question':
      return `Which group${entityPart} are you asking about — and what level are they at?`
    case 'player_help':
      return `Which player${entityPart} needs support, and is it technical, focus, or motivation?`
    default:
      return `Can you tell me more about what happened in the session${entityPart}?`
  }
}

function buildParentNextQuestion(intent: ParentIntent, entity: string | null): string {
  const name = entity ? entity : 'your child'
  switch (intent) {
    case 'progress_concern':
      return `What area are you most concerned about — technical skills, match results, or how ${name} feels about practice?`
    case 'confidence_concern':
      return `When did this start — was there a specific session or match that seemed to affect ${name}'s confidence?`
    case 'schedule_question':
      return `Are you looking for the upcoming schedule, or asking about a specific session?`
    case 'communication_request':
      return `Would you prefer a call with the coach, an update from the director, or a written progress summary?`
    case 'support_question':
      return `Is this about practice at home, what to say after sessions, or how to handle match pressure?`
    default:
      return `What specifically would you like to know about ${name}'s progress?`
  }
}

function buildPlayerNextQuestion(intent: PlayerIntent, entity: string | null): string {
  switch (intent) {
    case 'what_to_practice':
      return `Are you asking about today\'s session focus, or what to work on between practices?`
    case 'progress_question':
      return `Are you asking about your overall game, a specific shot, or your recent matches?`
    case 'next_level':
      return `Which level are you aiming for, and have you had your most recent assessment?`
    case 'feeling_stuck':
      return `Is it a specific shot that\'s frustrating you, or does the whole game feel off right now?`
    case 'competition_question':
      return `Are you asking about an upcoming tournament, or how to prepare for your next match?`
    default:
      return `What would you most like help with today?`
  }
}

// ── Entity extractor (heuristic) ──────────────────────────────────────────────

const NON_NAME_WORDS = new Set([
  'i', 'we', 'you', 'he', 'she', 'they', 'the', 'a', 'an', 'my', 'his', 'her',
  'ok', 'okay', 'yes', 'no', 'not', 'need', 'help', 'it', 'is', 'was',
])

function extractEntity(text: string): string | null {
  const words = text.split(/\s+/)
  const nameTokens: string[] = []
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z'-]/g, '')
    if (
      clean.length >= 2 &&
      /^[A-Z]/.test(clean) &&
      !NON_NAME_WORDS.has(clean.toLowerCase())
    ) {
      nameTokens.push(clean)
      if (nameTokens.length >= 2) break
    }
  }
  return nameTokens.length > 0 ? nameTokens.join(' ') : null
}

// ── Main interpreter ──────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 0.35

/**
 * Interpret a natural language statement from any role.
 *
 * For directors, delegates to the existing donnaIntentEngine.
 * For other roles, uses role-specific signal maps.
 *
 * Returns possibleIntents[], confidence, and the best next question.
 */
export function interpretIntent(
  text: string,
  role: InterpreterRole,
  pathname = '/',
): InterpretedIntent {
  if (role === 'director') {
    const result = classifyDirectorIntent(text, pathname)
    return {
      role: 'director',
      primaryIntent: result.intent,
      confidence: result.confidence,
      possibleIntents: result.possibleIntents,
      clarificationNeeded: result.clarificationNeeded,
      bestNextQuestion: result.clarificationQuestion,
      extractedEntity: result.extractedEntity,
      reasoning: result.reasoning,
    }
  }

  const entity = extractEntity(text)

  if (role === 'coach') {
    const scored = scoreSignals<CoachIntent>(text, COACH_SIGNALS)
    const best = scored[0]
    const intent = best && best.confidence >= CONFIDENCE_THRESHOLD
      ? best.intent
      : 'unknown' as CoachIntent

    const clarificationNeeded = !best || best.confidence < CONFIDENCE_THRESHOLD
    const bestNextQuestion = clarificationNeeded
      ? `What\'s on your mind from today\'s session? Was it a player, the group, or the session itself?`
      : (best && best.confidence < 0.7 ? buildCoachNextQuestion(intent, entity) : null)

    return {
      role: 'coach',
      primaryIntent: intent,
      confidence: best?.confidence ?? 0,
      possibleIntents: scored.slice(0, 3).map(s => ({ intent: s.intent, confidence: s.confidence })),
      clarificationNeeded,
      bestNextQuestion,
      extractedEntity: entity,
      reasoning: best
        ? `Top match: ${intent} (${(best.confidence * 100).toFixed(0)}% confidence)`
        : 'No signals matched above threshold.',
    }
  }

  if (role === 'parent') {
    const scored = scoreSignals<ParentIntent>(text, PARENT_SIGNALS)
    const best = scored[0]
    const intent = best && best.confidence >= CONFIDENCE_THRESHOLD
      ? best.intent
      : 'unknown' as ParentIntent

    const clarificationNeeded = !best || best.confidence < CONFIDENCE_THRESHOLD
    const bestNextQuestion = clarificationNeeded
      ? `What would be most helpful — an update on progress, scheduling, or speaking with someone?`
      : (best && best.confidence < 0.7 ? buildParentNextQuestion(intent, entity) : null)

    return {
      role: 'parent',
      primaryIntent: intent,
      confidence: best?.confidence ?? 0,
      possibleIntents: scored.slice(0, 3).map(s => ({ intent: s.intent, confidence: s.confidence })),
      clarificationNeeded,
      bestNextQuestion,
      extractedEntity: entity,
      reasoning: best
        ? `Top match: ${intent} (${(best.confidence * 100).toFixed(0)}% confidence)`
        : 'No signals matched above threshold.',
    }
  }

  // player
  const scored = scoreSignals<PlayerIntent>(text, PLAYER_SIGNALS)
  const best = scored[0]
  const intent = best && best.confidence >= CONFIDENCE_THRESHOLD
    ? best.intent
    : 'unknown' as PlayerIntent

  const clarificationNeeded = !best || best.confidence < CONFIDENCE_THRESHOLD
  const bestNextQuestion = clarificationNeeded
    ? `What would you like help with today — practice, your progress, or your next match?`
    : (best && best.confidence < 0.7 ? buildPlayerNextQuestion(intent, entity) : null)

  return {
    role: 'player',
    primaryIntent: intent,
    confidence: best?.confidence ?? 0,
    possibleIntents: scored.slice(0, 3).map(s => ({ intent: s.intent, confidence: s.confidence })),
    clarificationNeeded,
    bestNextQuestion,
    extractedEntity: entity,
    reasoning: best
      ? `Top match: ${intent} (${(best.confidence * 100).toFixed(0)}% confidence)`
      : 'No signals matched above threshold.',
  }
}

// ── Intent labels ─────────────────────────────────────────────────────────────

export const INTENT_LABELS: Record<AnyIntent, string> = {
  // Director (from existing engine)
  curriculum_help:          'Build or review curriculum',
  player_progress_review:   'Review player progress',
  parent_communication:     'Create a parent update',
  assessment:               'Complete a player assessment',
  onboarding_setup:         'Finish academy setup',
  template_building:        'Build a class template',
  level_readiness:          'Review level readiness',
  session_review:           'Review a session',
  review_queue:             'Clear the review queue',
  attendance:               'Record attendance',
  general_help:             'Get general guidance',
  // Coach
  session_feedback:         'Submit session feedback',
  player_observation:       'Record a player observation',
  group_difficulty:         'Report a group challenge',
  wrap_up_help:             'Complete session wrap-up',
  attendance_report:        'Record attendance',
  curriculum_question:      'Ask about curriculum focus',
  player_help:              'Flag a player needing support',
  // Parent
  progress_concern:         'Ask about player progress',
  confidence_concern:       'Share confidence concern',
  schedule_question:        'Ask about schedule',
  communication_request:    'Request to speak with staff',
  support_question:         'Ask how to support at home',
  // Player
  what_to_practice:         'Find out what to work on',
  progress_question:        'Check on progress',
  next_level:               'Ask about advancing',
  feeling_stuck:            'Share frustration or stuck feeling',
  competition_question:     'Ask about upcoming matches',
  // Shared fallback
  unknown:                  'Something else',
}

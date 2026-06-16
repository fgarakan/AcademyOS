// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Natural language intent detector.
//
// Handles incomplete phrases, voice transcripts, and fragmented speech that
// the existing donnaIntentClassifier (exact keyword → command category) misses.
//
// Examples:
//   "Need help with Orange 2"      → curriculum_help       (0.88)
//   "Sarah seems stuck"            → player_progress_review (0.82)
//   "Need to update parents"       → parent_communication  (0.94)
//   "Let's finish onboarding"      → onboarding_setup      (0.91)
//   "What should we do with Jamie?"→ player_progress_review (0.79)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Complements existing donnaIntentClassifier — does NOT replace it.
//   - Conservative: ambiguous inputs score below ACT_THRESHOLD → clarification.
//   - Entity extraction is heuristic — returns best guess, not DB lookup.
//   - Existing approval guardrails are preserved: detection only, no execution.

import {
  matchWeightedSignals,
  rankCandidates,
  buildReasoning,
  isClarificationNeeded,
  CONFIDENCE_ACT_THRESHOLD,
  CONFIDENCE_LOW_THRESHOLD,
} from './confidenceScoring'
import type { WeightedSignal, ScoredCandidate } from './confidenceScoring'

// ── Intent types ──────────────────────────────────────────────────────────────

export type DirectorIntent =
  | 'curriculum_help'          // Orange 2, build a level, curriculum gap
  | 'player_progress_review'   // Sarah seems stuck, what's with Jamie, player check
  | 'parent_communication'     // update parents, message to parent, parent update
  | 'assessment'               // assess a player, run assessment, rate performance
  | 'onboarding_setup'         // finish setup, academy setup, let's onboard
  | 'template_building'        // build a template, class template, session plan
  | 'level_readiness'          // ready to move up, level change, advancement
  | 'session_review'           // how did it go, session debrief, wrap up
  | 'review_queue'             // what needs review, pending items, approve
  | 'attendance'               // who was there, mark attendance, attendance check
  | 'general_help'             // help, what can you do, guide me
  | 'unknown'                  // no confident match

// ── Intent result ─────────────────────────────────────────────────────────────

export interface IntentResult {
  intent: DirectorIntent
  confidence: number              // 0–1
  possibleIntents: Array<{ intent: DirectorIntent; confidence: number }>
  clarificationNeeded: boolean
  clarificationQuestion: string | null
  reasoning: string
  /** Extracted entity: player name, level label, etc. (heuristic — not a DB lookup) */
  extractedEntity: string | null
  /** Whether a named entity was found in the input */
  hasNamedEntity: boolean
}

// ── Signal definitions ────────────────────────────────────────────────────────

const INTENT_SIGNALS: Record<DirectorIntent, WeightedSignal[]> = {

  curriculum_help: [
    { signal: 'curriculum',            weight: 'medium' },
    { signal: 'orange ball',           weight: 'strong' },
    { signal: 'red ball',              weight: 'strong' },
    { signal: 'green ball',            weight: 'strong' },
    { signal: 'yellow ball',           weight: 'strong' },
    { signal: 'orange 1',              weight: 'medium' },
    { signal: 'orange 2',              weight: 'medium' },
    { signal: 'orange 3',              weight: 'medium' },
    { signal: 'red 1',                 weight: 'medium' },
    { signal: 'red 2',                 weight: 'medium' },
    { signal: 'green 1',               weight: 'medium' },
    { signal: 'green 2',               weight: 'medium' },
    { signal: 'build a level',         weight: 'strong' },
    { signal: 'curriculum level',      weight: 'strong' },
    { signal: 'curriculum gap',        weight: 'strong' },
    { signal: 'level content',         weight: 'medium' },
    { signal: 'level goal',            weight: 'medium' },
    { signal: 'ball level',            weight: 'medium' },
    { signal: 'help with orange',      weight: 'strong' },
    { signal: 'help with red',         weight: 'strong' },
    { signal: 'help with green',       weight: 'strong' },
    { signal: 'level definition',      weight: 'medium' },
    { signal: 'development level',     weight: 'weak' },
    { signal: 'drills for',            weight: 'weak' },
    { signal: 'skills for',            weight: 'weak' },
  ],

  player_progress_review: [
    { signal: 'stuck',                 weight: 'strong' },
    { signal: 'not progressing',       weight: 'strong' },
    { signal: 'player check',          weight: 'strong' },
    { signal: 'check on',              weight: 'medium' },
    { signal: 'how is',                weight: 'medium' },
    { signal: 'seems stuck',           weight: 'strong' },
    { signal: 'looks stuck',           weight: 'strong' },
    { signal: 'what should we do with', weight: 'strong' },
    { signal: 'what to do with',       weight: 'strong' },
    { signal: 'player progress',       weight: 'strong' },
    { signal: 'review player',         weight: 'strong' },
    { signal: 'player review',         weight: 'strong' },
    { signal: 'progress review',       weight: 'strong' },
    { signal: 'development review',    weight: 'medium' },
    { signal: 'how is he',             weight: 'medium' },
    { signal: 'how is she',            weight: 'medium' },
    { signal: 'how are they',          weight: 'medium' },
    { signal: 'what is happening with', weight: 'medium' },
    { signal: "what's going on with",  weight: 'medium' },
    { signal: 'review the evidence',   weight: 'medium' },
    { signal: 'stalled',               weight: 'medium' },
    { signal: 'falling behind',        weight: 'medium' },
    { signal: 'not making progress',   weight: 'strong' },
    { signal: 'enrollment',            weight: 'medium' },
  ],

  parent_communication: [
    { signal: 'update parents',        weight: 'strong' },
    { signal: 'parent update',         weight: 'strong' },
    { signal: 'message to parent',     weight: 'strong' },
    { signal: 'email parent',          weight: 'strong' },
    { signal: 'tell the parent',       weight: 'strong' },
    { signal: 'notify parent',         weight: 'strong' },
    { signal: 'parent message',        weight: 'strong' },
    { signal: 'send to parent',        weight: 'strong' },
    { signal: 'write to parent',       weight: 'strong' },
    { signal: 'need to update parents', weight: 'strong' },
    { signal: 'parent communication',  weight: 'strong' },
    { signal: 'parents need to know',  weight: 'strong' },
    { signal: 'parent should know',    weight: 'strong' },
    { signal: 'let parents know',      weight: 'strong' },
    { signal: 'draft for parent',      weight: 'strong' },
    { signal: 'parent draft',          weight: 'strong' },
    { signal: 'communicate with parent', weight: 'medium' },
    { signal: 'parents',               weight: 'medium' },
    { signal: 'update the parent',     weight: 'strong' },
    { signal: 'update parent',         weight: 'medium' },
  ],

  assessment: [
    { signal: 'assess',                weight: 'strong' },
    { signal: 'assessment',            weight: 'strong' },
    { signal: 'evaluate',              weight: 'strong' },
    { signal: 'rate the player',       weight: 'strong' },
    { signal: 'rate their',            weight: 'medium' },
    { signal: 'run assessment',        weight: 'strong' },
    { signal: 'complete assessment',   weight: 'strong' },
    { signal: 'fill in assessment',    weight: 'strong' },
    { signal: 'observation',           weight: 'medium' },
    { signal: 'what did i observe',    weight: 'medium' },
    { signal: 'performance today',     weight: 'medium' },
    { signal: 'how did they perform',  weight: 'medium' },
    { signal: 'skill evaluation',      weight: 'medium' },
    { signal: 'assessment form',       weight: 'strong' },
    { signal: 'technical assessment',  weight: 'strong' },
  ],

  onboarding_setup: [
    { signal: 'onboarding',            weight: 'strong' },
    { signal: 'finish onboarding',     weight: 'strong' },
    { signal: 'complete onboarding',   weight: 'strong' },
    { signal: 'finish setup',          weight: 'strong' },
    { signal: 'complete setup',        weight: 'strong' },
    { signal: 'academy setup',         weight: 'strong' },
    { signal: 'set up',                weight: 'medium' },
    { signal: 'let\'s finish',         weight: 'medium' },
    { signal: 'finish the setup',      weight: 'strong' },
    { signal: 'setup wizard',          weight: 'strong' },
    { signal: 'configure academy',     weight: 'strong' },
    { signal: 'first time',            weight: 'weak' },
    { signal: 'getting started',       weight: 'medium' },
    { signal: 'initial setup',         weight: 'strong' },
    { signal: 'add coaches',           weight: 'medium' },
    { signal: 'add players',           weight: 'medium' },
    { signal: 'let\'s onboard',        weight: 'strong' },
  ],

  template_building: [
    { signal: 'template',              weight: 'medium' },
    { signal: 'class template',        weight: 'strong' },
    { signal: 'build a template',      weight: 'strong' },
    { signal: 'create a template',     weight: 'strong' },
    { signal: 'session template',      weight: 'strong' },
    { signal: 'session plan',          weight: 'medium' },
    { signal: 'block structure',       weight: 'medium' },
    { signal: 'plan a session',        weight: 'medium' },
    { signal: 'session structure',     weight: 'medium' },
    { signal: 'template builder',      weight: 'strong' },
    { signal: 'drill sequence',        weight: 'medium' },
    { signal: 'class structure',       weight: 'medium' },
  ],

  level_readiness: [
    { signal: 'ready to move up',      weight: 'strong' },
    { signal: 'level up',              weight: 'strong' },
    { signal: 'promote',               weight: 'medium' },
    { signal: 'level change',          weight: 'strong' },
    { signal: 'advancement',           weight: 'strong' },
    { signal: 'readiness',             weight: 'strong' },
    { signal: 'next level',            weight: 'strong' },
    { signal: 'move up',               weight: 'medium' },
    { signal: 'ready for orange',      weight: 'strong' },
    { signal: 'ready for green',       weight: 'strong' },
    { signal: 'is ready',              weight: 'medium' },
    { signal: 'level review',          weight: 'strong' },
    { signal: 'gate check',            weight: 'medium' },
    { signal: 'should move',           weight: 'medium' },
    { signal: 'ready to advance',      weight: 'strong' },
  ],

  session_review: [
    { signal: 'how did it go',         weight: 'strong' },
    { signal: 'how was the session',   weight: 'strong' },
    { signal: 'session debrief',       weight: 'strong' },
    { signal: 'wrap up',               weight: 'medium' },
    { signal: 'wrap-up',               weight: 'medium' },
    { signal: 'session summary',       weight: 'strong' },
    { signal: 'debrief',               weight: 'medium' },
    { signal: 'session notes',         weight: 'medium' },
    { signal: 'end of session',        weight: 'strong' },
    { signal: 'session complete',      weight: 'strong' },
    { signal: 'after session',         weight: 'medium' },
    { signal: 'post-session',          weight: 'strong' },
    { signal: 'session done',          weight: 'medium' },
    { signal: 'recap',                 weight: 'medium' },
    { signal: 'how did the session',   weight: 'strong' },
    { signal: 'session go',            weight: 'medium' },
    { signal: 'check on coach',        weight: 'medium' },
  ],

  review_queue: [
    { signal: 'review queue',          weight: 'strong' },
    { signal: 'what needs review',     weight: 'strong' },
    { signal: 'pending review',        weight: 'strong' },
    { signal: 'pending approval',      weight: 'strong' },
    { signal: 'items to review',       weight: 'strong' },
    { signal: 'approval queue',        weight: 'strong' },
    { signal: 'what needs approval',   weight: 'strong' },
    { signal: 'approve',               weight: 'medium' },
    { signal: 'reject',                weight: 'medium' },
    { signal: 'review items',          weight: 'strong' },
    { signal: 'pending items',         weight: 'medium' },
    { signal: "what's pending",        weight: 'medium' },
    { signal: 'needs attention',       weight: 'medium' },
    { signal: 'what needs',            weight: 'medium' },
  ],

  attendance: [
    { signal: 'attendance',            weight: 'strong' },
    { signal: 'who was there',         weight: 'strong' },
    { signal: 'who showed',            weight: 'strong' },
    { signal: 'who attended',          weight: 'strong' },
    { signal: 'absent',                weight: 'strong' },
    { signal: 'present',               weight: 'medium' },
    { signal: 'mark attendance',       weight: 'strong' },
    { signal: 'who came',              weight: 'strong' },
    { signal: 'missing from session',  weight: 'strong' },
    { signal: "didn't show",           weight: 'strong' },
    { signal: 'everyone here',         weight: 'medium' },
    { signal: 'all present',           weight: 'medium' },
  ],

  general_help: [
    { signal: 'help',                  weight: 'medium' },
    { signal: 'guide me',              weight: 'medium' },
    { signal: 'what can you do',       weight: 'strong' },
    { signal: 'what should i',         weight: 'medium' },
    { signal: 'where do i start',      weight: 'medium' },
    { signal: 'getting started',       weight: 'weak' },
    { signal: 'show me',               weight: 'weak' },
    { signal: 'help me',               weight: 'medium' },
    { signal: 'i need help',           weight: 'medium' },
    { signal: 'assist',                weight: 'medium' },
    { signal: "how's everything",      weight: 'medium' },
    { signal: "don't know what",       weight: 'medium' },
  ],

  // unknown has no signals — it is the fallback
  unknown: [],
}

// ── Entity extraction ─────────────────────────────────────────────────────────
// Heuristic only — does not resolve to DB IDs.

/** Known ball level prefixes */
const BALL_LEVEL_PATTERN = /\b(red|orange|green|yellow|purple|blue|white)\s*(ball)?\s*([123]?)\b/gi

/** Capitalized name heuristic (1–2 words, not a known keyword) */
const NON_NAME_WORDS = new Set([
  'i', 'we', 'you', 'he', 'she', 'they', 'the', 'a', 'an',
  'ok', 'okay', 'yes', 'no', 'not', 'need', 'help', 'ball',
  'let', "let's", 'go', 'back', 'done', 'finish', 'start',
])

function extractEntity(text: string): string | null {
  // Ball levels first (most specific)
  const ballMatch = BALL_LEVEL_PATTERN.exec(text)
  if (ballMatch) {
    const color = ballMatch[1]
    const num   = ballMatch[3] ?? ''
    return (color.charAt(0).toUpperCase() + color.slice(1) + (num ? ` Ball ${num}` : ' Ball')).trim()
  }

  // Short numeric level labels: "Orange 2", "Red 1"
  const shortLevel = text.match(/\b(red|orange|green|yellow|purple|blue)\s+([1-3])\b/i)
  if (shortLevel) {
    return shortLevel[1].charAt(0).toUpperCase() + shortLevel[1].slice(1) + ' ' + shortLevel[2]
  }

  // Capitalized word(s) that look like a name
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
      if (nameTokens.length >= 2) break  // cap at 2 name tokens
    }
  }
  if (nameTokens.length > 0) return nameTokens.join(' ')

  return null
}

// ── Context boost ─────────────────────────────────────────────────────────────

function computeContextBoost(intent: DirectorIntent, pathname: string): number {
  const PAGE_BOOSTS: Partial<Record<DirectorIntent, string[]>> = {
    curriculum_help:        ['/director/curriculum', '/director/curriculum/builder'],
    player_progress_review: ['/director/players'],
    parent_communication:   ['/director/players', '/director/review'],
    assessment:             ['/director/players'],
    onboarding_setup:       ['/director/onboarding', '/director'],
    template_building:      ['/director/templates', '/director/curriculum/builder'],
    level_readiness:        ['/director/level-up', '/director/players'],
    session_review:         ['/director/sessions', '/coach/sessions'],
    review_queue:           ['/director/review'],
    attendance:             ['/director/sessions', '/coach/sessions'],
  }

  const routes = PAGE_BOOSTS[intent] ?? []
  if (routes.some(r => pathname.startsWith(r))) return 0.10
  return 0
}

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Classify director input into a natural language intent.
 * Returns full IntentResult with confidence, possible intents, entity, and reasoning.
 */
export function classifyIntent(
  text: string,
  pathname = '/director',
): IntentResult {
  const lower = text.toLowerCase().trim()
  const entity = extractEntity(text)

  const SCOREABLE: DirectorIntent[] = [
    'curriculum_help',
    'player_progress_review',
    'parent_communication',
    'assessment',
    'onboarding_setup',
    'template_building',
    'level_readiness',
    'session_review',
    'review_queue',
    'attendance',
    'general_help',
  ]

  const scored: ScoredCandidate<DirectorIntent>[] = SCOREABLE.map(intent => {
    const signals = INTENT_SIGNALS[intent] ?? []
    const boost = computeContextBoost(intent, pathname)
    const result = matchWeightedSignals(lower, signals, boost)
    return { candidate: intent, confidence: result.confidence, matched: result.matched }
  })

  const ranked = scored
    .filter(c => c.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)

  const best = ranked[0]

  if (!best || best.confidence < CONFIDENCE_LOW_THRESHOLD) {
    return {
      intent: 'unknown',
      confidence: 0,
      possibleIntents: [],
      clarificationNeeded: true,
      clarificationQuestion: "I didn't catch exactly what you need. Could you tell me a bit more? For example: which player, which level, or what you're trying to accomplish.",
      reasoning: 'No signals matched above the low-confidence threshold.',
      extractedEntity: entity,
      hasNamedEntity: entity !== null,
    }
  }

  const possibleIntents = ranked.slice(0, 4).map(r => ({
    intent: r.candidate,
    confidence: r.confidence,
  }))

  const clarificationNeeded = isClarificationNeeded(best.confidence)
  const clarificationQuestion = clarificationNeeded
    ? buildIntentClarificationQuestion(ranked, entity)
    : null

  const reasoning = buildReasoning(best.candidate, best.matched, best.confidence, entity)

  return {
    intent: best.candidate,
    confidence: best.confidence,
    possibleIntents,
    clarificationNeeded,
    clarificationQuestion,
    reasoning,
    extractedEntity: entity,
    hasNamedEntity: entity !== null,
  }
}

// ── Clarification question builder ────────────────────────────────────────────

function buildIntentClarificationQuestion(
  ranked: ScoredCandidate<DirectorIntent>[],
  entity: string | null,
): string {
  const top = ranked.slice(0, 3)
  if (top.length === 0) return "Could you give me a bit more context? What are you trying to accomplish?"

  const entityPart = entity ? ` about ${entity}` : ''
  const options = top.map((r, i) => `${i + 1}. ${INTENT_LABELS[r.candidate] ?? r.candidate}`)
  return `I think you want to work${entityPart}. Did you mean:\n\n${options.join('\n')}\n\nOr describe what you need and I'll figure it out.`
}

const INTENT_LABELS: Record<DirectorIntent, string> = {
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
  unknown:                  'Something else',
}

export { INTENT_LABELS }

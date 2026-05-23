// Sprint 689 — DONNA Conversational Router Upgrade V1
// ChatGPT-like routing layer that selects the right response mode for any director prompt.
// Pure TS — no DB calls, no API calls, no mutations.
// Builds on donnaIntentClassifier, donnaCommandRouter, donnaPageContextEngine, donnaSystemMap.

import type { DonnaDirectorIntent, DonnaSafetyClass, DirectorIntentResult } from './donnaIntentClassifier'
import { classifyDirectorIntent } from './donnaIntentClassifier'
import { getPageCapabilityMap } from './donnaPageContextEngine'
import { getModuleDefinition } from './donnaSystemMap'

// ── Response mode ─────────────────────────────────────────────────────────────

export type DonnaResponseMode =
  | 'answer_directly'       // DONNA has enough context to answer now
  | 'ask_clarification'     // Need more info before responding
  | 'use_page_context'      // Answer using current page capability map
  | 'use_system_map'        // Answer using AcademyOS system module map
  | 'use_kpi_answer'        // Answer using KPI explanation layer
  | 'use_roster_intel'      // Answer using player roster intelligence
  | 'use_review_context'    // Answer using review queue context
  | 'build_action_preview'  // Show what would happen before acting
  | 'block_unsafe_request'  // Request is unsafe — explain and stop
  | 'route_to_review'       // Safe draft path exists — route to review center
  | 'explain_limitation'    // DONNA lacks data or capability — explain honestly

// ── Routing result ────────────────────────────────────────────────────────────

export interface DonnaRoutingResult {
  intent: DonnaDirectorIntent
  confidence: 'high' | 'medium' | 'low'
  responseMode: DonnaResponseMode
  safetyClass: DonnaSafetyClass
  sourceContextUsed: string
  missingContext: string | null
  recommendedNextStep: string
  shouldAskClarification: boolean
  clarificationQuestion: string | null
}

// ── Safety-class → response mode mapping ─────────────────────────────────────

function safetyClassToMode(
  safetyClass: DonnaSafetyClass,
  intent: DonnaDirectorIntent,
  hasSafeDraftPath: boolean,
): DonnaResponseMode {
  if (safetyClass === 'blocked') return 'block_unsafe_request'
  if (safetyClass === 'needs_review') {
    return hasSafeDraftPath ? 'route_to_review' : 'build_action_preview'
  }
  // safe — pick mode based on intent
  switch (intent) {
    case 'kpi_explanation':
    case 'kpi_priority':
      return 'use_kpi_answer'
    case 'dashboard_priority':
      return 'use_page_context'
    case 'roster_attention':
      return 'use_roster_intel'
    case 'review_queue':
      return 'use_review_context'
    case 'ambiguous_context':
      return 'ask_clarification'
    case 'unknown':
      return 'answer_directly'
    default:
      return 'answer_directly'
  }
}

// ── Intents that have a safe draft path (route to review center) ──────────────

const SAFE_DRAFT_INTENTS = new Set<DonnaDirectorIntent>([
  'parent_summary',
  'level_movement',
  'curriculum_builder',
  'coach_note_summary',
])

// ── Clarification questions by intent ────────────────────────────────────────

const CLARIFICATION_MAP: Partial<Record<DonnaDirectorIntent, string>> = {
  ambiguous_context: 'Can you tell me more about what you\'re looking for? Are you asking about a specific player, a KPI, or a workflow?',
  roster_attention: 'Are you looking for players with attendance concerns, development flags, or players ready for a level change?',
  curriculum_builder: 'Are you reviewing the existing curriculum structure or creating a new template?',
  parent_summary: 'Which player would you like to prepare a parent update for?',
  level_movement: 'Are you reviewing a specific player\'s readiness, or looking at the full level-movement queue?',
}

// ── Source context label by mode ──────────────────────────────────────────────

function sourceContextLabel(mode: DonnaResponseMode, pathname: string): string {
  switch (mode) {
    case 'use_page_context': {
      const map = getPageCapabilityMap(pathname)
      return `Page context: ${map.pageLabel}`
    }
    case 'use_system_map': return 'AcademyOS system map'
    case 'use_kpi_answer': return 'KPI explanation layer'
    case 'use_roster_intel': return 'Player roster intelligence'
    case 'use_review_context': return 'Review queue context'
    case 'route_to_review': return 'Review center draft path'
    case 'block_unsafe_request': return 'Safety guardrail'
    case 'build_action_preview': return 'Action preview layer'
    case 'ask_clarification': return 'Clarification engine'
    case 'explain_limitation': return 'Limitation explanation'
    default: return 'Direct answer'
  }
}

// ── Next step by intent + mode ────────────────────────────────────────────────

function recommendedNextStep(
  intent: DonnaDirectorIntent,
  mode: DonnaResponseMode,
  pathname: string,
): string {
  if (mode === 'block_unsafe_request') {
    return 'I\'ll explain why this request is blocked and suggest a safe alternative.'
  }
  if (mode === 'route_to_review') {
    return 'I\'ll prepare a draft and route it to the Review Center for your approval before anything takes effect.'
  }
  if (mode === 'build_action_preview') {
    return 'I\'ll show you what would happen before acting. Nothing changes until you confirm.'
  }
  if (mode === 'ask_clarification') {
    return 'I\'ll ask one clarifying question to give you a better answer.'
  }
  if (mode === 'explain_limitation') {
    return 'I\'ll explain what I can and can\'t help with here, and suggest where to find the answer.'
  }
  switch (intent) {
    case 'dashboard_priority':
      return 'I\'ll summarize what needs your attention first on this page.'
    case 'kpi_explanation':
    case 'kpi_priority':
      return 'I\'ll explain this KPI and what a healthy range looks like.'
    case 'roster_attention':
      return 'I\'ll surface players that match your attention criteria.'
    case 'review_queue':
      return 'I\'ll summarize the review queue and what needs action first.'
    case 'parent_summary':
      return 'I\'ll draft a parent-safe update and send it to the Review Center.'
    case 'level_movement':
      return 'I\'ll surface the readiness evidence and send a level-change proposal to the Review Center.'
    default: {
      const map = getPageCapabilityMap(pathname)
      return `I\'ll answer using context from the ${map.pageLabel}.`
    }
  }
}

// ── System-level question detection ──────────────────────────────────────────

// Sprint 710 — module name list for module-specific question detection
const SYSTEM_MODULE_TERMS = [
  'review center', 'review queue', 'kpi', 'dashboard', 'curriculum', 'player profile',
  'placement', 'assessment', 'coach recap', 'parent summary', 'parent portal',
  'player portal', 'mission', 'badge', 'session', 'signal', 'attendance', 'level up', 'voice assistant',
]

function isSystemQuestion(text: string): boolean {
  const lower = text.toLowerCase()
  // Sprint 710 — module-specific question detection
  const mentionsModule = SYSTEM_MODULE_TERMS.some(term => lower.includes(term))
  return (
    lower.includes('how does') ||
    lower.includes('how do') ||
    lower.includes('what is connected') ||
    lower.includes('what happens after') ||
    lower.includes('how does a parent') ||
    lower.includes('missions and badges') ||
    lower.includes('how does this system') ||
    lower.includes('what should i test') ||
    lower.includes('explain the system') ||
    lower.includes('how does academy') ||
    // Sprint 710 — "What does X do?", "Tell me about X", "Explain X" for known modules
    (lower.includes('what does') && mentionsModule) ||
    (lower.includes('tell me about') && mentionsModule) ||
    (lower.includes('explain') && mentionsModule && !lower.includes('explain the system'))
  )
}

function isPageQuestion(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('where am i') ||
    lower.includes('what page') ||
    lower.includes('what can you help') ||
    lower.includes('what should i inspect') ||
    (lower.includes('what actions') && lower.includes('require')) ||
    lower.includes("what should i not do") ||
    lower.includes('what can i do here') ||
    lower.includes('help me here') ||
    lower.includes('help on this page') ||
    // Sprint 700 — P1 fix: curriculum gap questions
    lower.includes('curriculum gap') ||
    lower.includes('curriculum missing') ||
    lower.includes('missing from the curriculum') ||
    lower.includes('what should i review in the curriculum') ||
    lower.includes('find curriculum gap') ||
    lower.includes('where is the curriculum')
  )
}

// ── Main router ───────────────────────────────────────────────────────────────

export function routeDonnaPrompt(
  text: string,
  pathname: string,
): DonnaRoutingResult {
  const trimmed = text.trim()

  // System-level questions use the system map first
  if (isSystemQuestion(trimmed)) {
    return {
      intent: 'unknown',
      confidence: 'high',
      responseMode: 'use_system_map',
      safetyClass: 'safe',
      sourceContextUsed: 'AcademyOS system map',
      missingContext: null,
      recommendedNextStep: 'I\'ll answer using the AcademyOS system map.',
      shouldAskClarification: false,
      clarificationQuestion: null,
    }
  }

  // Page-awareness questions use page context
  if (isPageQuestion(trimmed)) {
    return {
      intent: 'dashboard_priority',
      confidence: 'high',
      responseMode: 'use_page_context',
      safetyClass: 'safe',
      sourceContextUsed: sourceContextLabel('use_page_context', pathname),
      missingContext: null,
      recommendedNextStep: recommendedNextStep('dashboard_priority', 'use_page_context', pathname),
      shouldAskClarification: false,
      clarificationQuestion: null,
    }
  }

  // Intent classification
  const classified: DirectorIntentResult = classifyDirectorIntent(trimmed)
  const hasSafeDraft = SAFE_DRAFT_INTENTS.has(classified.intent)
  const mode = safetyClassToMode(classified.safetyClass, classified.intent, hasSafeDraft)

  const shouldClarify = mode === 'ask_clarification' ||
    (classified.confidence === 'low' && classified.safetyClass !== 'blocked')
  const clarificationQ = shouldClarify
    ? (CLARIFICATION_MAP[classified.intent] ?? 'Can you give me more context about what you\'re looking for?')
    : null

  return {
    intent: classified.intent,
    confidence: classified.confidence,
    responseMode: shouldClarify ? 'ask_clarification' : mode,
    safetyClass: classified.safetyClass,
    sourceContextUsed: sourceContextLabel(shouldClarify ? 'ask_clarification' : mode, pathname),
    missingContext: classified.missingContext,
    recommendedNextStep: recommendedNextStep(classified.intent, shouldClarify ? 'ask_clarification' : mode, pathname),
    shouldAskClarification: shouldClarify,
    clarificationQuestion: clarificationQ,
  }
}

// ── Test prompt evaluations ───────────────────────────────────────────────────
// These match the Sprint 689 manual test prompts for validation.

export const SPRINT_689_TEST_PROMPTS: Array<{ prompt: string; expectedMode: DonnaResponseMode; note: string }> = [
  { prompt: 'What should I do first?', expectedMode: 'use_page_context', note: 'Page-aware priority question' },
  { prompt: 'What page am I on?', expectedMode: 'use_page_context', note: 'Page-awareness question' },
  { prompt: 'What can you help me with here?', expectedMode: 'use_page_context', note: 'Page-awareness question' },
  { prompt: 'Which players need attention?', expectedMode: 'use_roster_intel', note: 'Roster intelligence query' },
  { prompt: 'Why is this KPI bad?', expectedMode: 'use_kpi_answer', note: 'KPI explanation query' },
  { prompt: 'Can you move Sarah up?', expectedMode: 'route_to_review', note: 'Level movement → needs review' },
  { prompt: 'Draft a parent update.', expectedMode: 'route_to_review', note: 'Parent summary → needs review' },
  { prompt: 'Show the raw coach note to the parent.', expectedMode: 'block_unsafe_request', note: 'Unsafe visibility request' },
  { prompt: 'How does a coach recap become a parent update?', expectedMode: 'use_system_map', note: 'System flow question' },
  { prompt: 'What should I test before showing Brian?', expectedMode: 'use_system_map', note: 'System test guidance' },
]

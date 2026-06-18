// Mega Sprint 3121–3150 — DONNA Atomic Loop Coverage & Live State Expansion V1
// Part 1 — Universal Operating Phrase Library
//
// Canonical operating intents that every DONNA-enabled page should respond to.
// Routes through meaning → operating intent → page intelligence.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Uses lowercase substring matching — no regex-only routing.
//   - Variations are handled here; OpenAI/meaning extraction handles paraphrases.

// ── Types ─────────────────────────────────────────────────────────────────────

export type OperatingIntent =
  | 'what_should_i_do'
  | 'what_is_blocking'
  | 'whats_next'
  | 'take_me_to_completion'
  | 'walk_me_through'
  | 'help_me_finish'
  | 'what_matters_most'
  | 'what_needs_attention'
  | 'status_check'

// ── Intent labels ─────────────────────────────────────────────────────────────

export const OPERATING_INTENT_LABELS: Record<OperatingIntent, string> = {
  what_should_i_do:      'What should I do?',
  what_is_blocking:      'What is blocking this?',
  whats_next:            "What's next?",
  take_me_to_completion: 'Take me to completion',
  walk_me_through:       'Walk me through this',
  help_me_finish:        'Help me finish',
  what_matters_most:     'What matters most?',
  what_needs_attention:  'What needs attention?',
  status_check:          'Status check',
}

// ── Phrase variants per intent ────────────────────────────────────────────────
// Ordered most-specific first within each group.

const INTENT_PHRASES: Array<{ intent: OperatingIntent; phrases: string[] }> = [
  {
    intent: 'take_me_to_completion',
    phrases: [
      'take me to completion',
      'complete this',
      'finish this',
      'how do i finish',
      'how do i complete',
    ],
  },
  {
    intent: 'walk_me_through',
    phrases: [
      'walk me through',
      'guide me through',
      'step by step',
      'take me through',
    ],
  },
  {
    intent: 'help_me_finish',
    phrases: [
      'help me finish',
      'help finish',
      'i need to finish',
      'how do i wrap',
    ],
  },
  {
    intent: 'what_is_blocking',
    phrases: [
      'what is blocking',
      "what's blocking",
      'what is blocked',
      'what is preventing',
    ],
  },
  {
    intent: 'what_matters_most',
    phrases: [
      'what matters most',
      'what is most important',
      'highest priority',
      'most important',
    ],
  },
  {
    intent: 'what_needs_attention',
    phrases: [
      'what needs attention',
      'anything urgent',
      'what is urgent',
      'urgent items',
      'needs attention',
      'what should i prioritize',
    ],
  },
  {
    intent: 'whats_next',
    phrases: [
      "what's next",
      'what is next',
      'what next',
      'next step',
      'next steps',
      'what do i do next',
    ],
  },
  {
    intent: 'what_should_i_do',
    phrases: [
      'what should i do here',
      'what should i do',
      'what should i focus on',
      'what do i do',
      'where do i start',
    ],
  },
  {
    intent: 'status_check',
    phrases: [
      'how is this page',
      'where do things stand',
      'what is the current state',
      'how am i doing',
      'how is this',
    ],
  },
]

// ── Main detection function ───────────────────────────────────────────────────

/**
 * Detect a canonical operating intent from a user message.
 * Returns the first matching intent, or null if none match.
 * Input does not need to be pre-lowercased — this function lowercases internally.
 */
export function detectOperatingIntent(message: string): OperatingIntent | null {
  const lower = message.toLowerCase().trim()
  for (const entry of INTENT_PHRASES) {
    for (const phrase of entry.phrases) {
      if (lower.includes(phrase)) return entry.intent
    }
  }
  return null
}

// ── Page-aware prompt builder ─────────────────────────────────────────────────

/**
 * Build a short page-aware prompt for a detected operating intent.
 * Used to enrich the Step 7.6 response with intent-specific framing.
 */
export function getOperatingIntentPrompt(intent: OperatingIntent, pageName: string): string {
  switch (intent) {
    case 'what_should_i_do':
      return `Here is what you should focus on right now on ${pageName}:`
    case 'what_is_blocking':
      return `Here is what is blocking ${pageName} from being complete:`
    case 'whats_next':
      return `Here is the next step on ${pageName}:`
    case 'take_me_to_completion':
      return `Here is the path to completing ${pageName}:`
    case 'walk_me_through':
      return `I will walk you through ${pageName} step by step:`
    case 'help_me_finish':
      return `Here is what remains to finish ${pageName}:`
    case 'what_matters_most':
      return `Here is the highest-impact action on ${pageName}:`
    case 'what_needs_attention':
      return `Here is what needs your attention on ${pageName}:`
    case 'status_check':
      return `Here is the current status of ${pageName}:`
  }
}

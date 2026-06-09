// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Memory intent detector: identifies memory-retrieval questions from director input.
// Pure TypeScript — no DB, no React, no side effects.
// Used by processDonnaMessage.ts brain step 10.10.

import type { MemoryIntentType } from './donnaAcademyMemoryTypes'

// ── Intent patterns ───────────────────────────────────────────────────────────

const MEMORY_PATTERNS: Array<{ patterns: RegExp[]; intent: MemoryIntentType }> = [
  {
    intent: 'player_history',
    patterns: [
      /what happened (with|to)\b/,
      /\bwhy (was|did|is|were)\b.*\b(promot|placed|moved|assign|remov|assess)/,
      /\b(history|timeline)\b.*\b(player|student)\b/,
      /\bwhat did we do (with|for|about)\b/,
      /\btell me (about|what happened)\b.*\b(player|student)\b/,
    ],
  },
  {
    intent: 'coach_history',
    patterns: [
      /what (has|have) coach\b/,
      /coach\b.*\b(doing|been|history|timeline|recent)\b/,
      /\bcoach\b.*\bwhat happened\b/,
      /what did coach\b/,
    ],
  },
  {
    intent: 'entity_timeline',
    patterns: [
      /what changed (with|in|about)\b/,
      /\b(show|give|get) (me )?(the )?(timeline|history|log)\b/,
      /\bwhat (has|have)\b.*\b(changed|happened|occurred)\b/,
      /\b(orange|red|green|yellow|purple|blue)\b.*\b(ball|group|level)\b.*\b(history|timeline|changed|update)\b/,
    ],
  },
  {
    intent: 'decision_history',
    patterns: [
      /what (did we|was) decide/,
      /recent (decisions|approvals|actions)\b/,
      /what (was|were|has been) (approved|rejected|executed)\b/,
      /\b(last|previous|recent)\b.*\b(decision|approval|action|choice)\b/,
      /\bwhat decisions\b/,
      /\bwhat (have i|did i|have we|did we) (approved?|rejected?|decided?)\b/,
    ],
  },
  {
    intent: 'override_history',
    patterns: [
      /what (did i|have i) (overrid|chang|modif)/,
      /\b(override|overrode|overridden)\b/,
      /where did i (change|modify|edit) donna/,
      /\bwhat did i modify\b/,
    ],
  },
  {
    intent: 'recommendation_history',
    patterns: [
      /what did donna recommend\b/,
      /donna.*(last time|previously|before|earlier).*(recommend|suggest|say)\b/,
      /what (was|were|has been) donna.*(recommend|suggest)\b/,
      /\bprior (recommendation|suggestion)\b/,
    ],
  },
  {
    intent: 'general_history',
    patterns: [
      /what (happened|has happened|have we done) recently\b/,
      /\b(recent|latest|last) (events?|activity|actions?|changes?)\b/,
      /what (has|have) (we|the academy|i) (done|decided|actioned)\b/,
      /show (me )?(recent|the latest) (activity|history|decisions?|memory)\b/,
      /\b(academy|donna) (history|memory|log|record)\b/,
      /what (has donna|have we) learned\b/,
    ],
  },
]

// ── Detector ──────────────────────────────────────────────────────────────────

export interface MemoryIntentMatch {
  intent: MemoryIntentType
}

export function detectMemoryIntent(lower: string): MemoryIntentMatch | null {
  for (const { patterns, intent } of MEMORY_PATTERNS) {
    if (patterns.some(p => p.test(lower))) {
      return { intent }
    }
  }
  return null
}

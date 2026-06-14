// Mega Sprint 2561–2590 — DONNA Academy Thinking Responses V1 (Perceived Speed Layer)
// Mega Sprint 2591–2620 — Expanded with COO + morning brief + overnight patterns
//
// Shows a short contextual message while DONNA loads the academy intelligence
// for broad director queries. Replaces generic "Thinking…" with a message
// that communicates DONNA is doing real work — improving perceived performance.
//
// Pure TypeScript — no DB, no API, no React.

import type { DirectorQuestionType } from './academyIntelligenceEngine'
import { detectBroadAcademyQuery } from './academyIntelligenceEngine'

// ── Thinking messages per question type ───────────────────────────────────────

const THINKING_BY_TYPE: Record<DirectorQuestionType, string> = {
  attention:       'Scanning academy roster for attention items…',
  focus:           'Identifying your highest-priority focus…',
  defer:           'Reviewing what can safely wait…',
  advance:         'Checking advancement candidates…',
  coach_support:   'Reviewing coach performance signals…',
  parent_followup: 'Scanning parent follow-up queue…',
  risk:            'Identifying active risks…',
  opportunity:     'Scanning for opportunities…',
  status:          'Loading academy pulse…',
}

// ── COO + overnight context patterns ─────────────────────────────────────────
// Extended in Mega Sprint 2591–2620

const COO_PATTERN_MAP: Array<{ patterns: RegExp[]; message: string }> = [
  {
    patterns: [/morning brief/i, /what.*today/i, /what.*do.*today/i, /good morning/i],
    message:  'Preparing your morning brief…',
  },
  {
    patterns: [/overnight/i, /while.*away/i, /what.*happen/i, /anything.*new/i],
    message:  'Checking overnight changes…',
  },
  {
    patterns: [/proactive/i, /alert/i, /watch.*for/i],
    message:  'Loading proactive alerts…',
  },
  {
    patterns: [/reflect/i, /end.*day/i, /wrap.*up/i, /close.*out/i, /how.*did.*go/i],
    message:  'Preparing your end-of-day review…',
  },
  {
    patterns: [/tomorrow/i, /prepare/i, /plan.*tomorrow/i],
    message:  'Scoping tomorrow\'s priorities…',
  },
  {
    patterns: [/health/i, /pulse/i, /how.*academy/i, /overall/i],
    message:  'Loading academy health signals…',
  },
  {
    patterns: [/brief/i, /summary/i, /overview/i],
    message:  'Building your COO brief…',
  },
  {
    patterns: [/escalat/i, /overdue/i, /late/i, /aging/i],
    message:  'Checking escalation flags…',
  },
]

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a short contextual thinking message for broad academy queries,
 * or null when the input is not a broad query.
 *
 * Called client-side in handleGodModeQuery before the server round-trip
 * to give the director immediate visual feedback.
 */
export function getAcademyThinkingText(userInput: string): string | null {
  // First: check for COO/overnight patterns (more specific)
  for (const entry of COO_PATTERN_MAP) {
    if (entry.patterns.some(p => p.test(userInput))) {
      return entry.message
    }
  }

  // Second: check broad academy question type
  const questionType = detectBroadAcademyQuery(userInput)
  if (!questionType) return null
  return THINKING_BY_TYPE[questionType]
}

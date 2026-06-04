// Sprint 1911–1960 — DONNA Reasoning + Memory Optimization V1
// Ambiguity resolution engine.
//
// Handles incomplete or ambiguous references like:
//   "Sarah"           → "Jamie Chen" (the player we were just discussing)
//   "Orange 2"        → "Orange Ball 2" (curriculum level)
//   "that one"        → the last mentioned item
//   "let's continue"  → the active goal/workflow
//   "not that"        → skip current option
//   "show me another" → show next option
//
// Used by processDonnaMessage before intent classification to
// enrich the message with context, so downstream engines get
// a better input.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: only resolves when high confidence.
//   - Returns original text when resolution is ambiguous.
//   - Never auto-acts on resolved references — always surfaces for director confirmation.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AmbiguityContext {
  /** Last entity label from conversation state (e.g. "Jamie Chen") */
  lastEntityLabel: string | null
  /** Last goal label from conversation state (e.g. "curriculum completion") */
  lastGoalLabel: string | null
  /** Recent conversation turns for context lookup */
  conversationHistory: Array<{ role: 'user' | 'donna'; content: string }>
}

export type ResolutionType =
  | 'entity_reference'     // "Sarah" → resolved to last player entity
  | 'curriculum_level'     // "Orange 2" → "Orange Ball 2"
  | 'continuation'         // "let's continue" → enriched with goal context
  | 'pronoun'              // "that one", "it" → last mentioned item
  | 'negation'             // "not that", "skip that" → deflect current option
  | 'none'                 // no resolution needed or possible

export interface AmbiguityResolutionResult {
  /** Whether a resolution was applied */
  wasResolved: boolean
  /** The resolution type applied */
  resolutionType: ResolutionType
  /** The enriched message (original if no resolution) */
  resolved: string | null
  /** Confidence in the resolution 0–1 */
  confidence: number
}

// ── Curriculum level normalizer ───────────────────────────────────────────────

const CURRICULUM_LEVEL_ALIASES: Record<string, string> = {
  'orange 1':   'Orange Ball 1',
  'orange 2':   'Orange Ball 2',
  'orange 3':   'Orange Ball 3',
  'orange ball 1': 'Orange Ball 1',
  'orange ball 2': 'Orange Ball 2',
  'orange ball 3': 'Orange Ball 3',
  'red 1':      'Red Ball 1',
  'red 2':      'Red Ball 2',
  'red ball':   'Red Ball',
  'green':      'Green Ball',
  'green ball': 'Green Ball',
  'yellow':     'Yellow Ball',
  'yellow ball': 'Yellow Ball',
}

function normalizeCurriculumReference(text: string): string | null {
  const lower = text.toLowerCase().trim()
  for (const [alias, normalized] of Object.entries(CURRICULUM_LEVEL_ALIASES)) {
    if (lower.includes(alias)) {
      return text.replace(new RegExp(alias, 'i'), normalized)
    }
  }
  return null
}

// ── Pronoun / reference patterns ─────────────────────────────────────────────

const PRONOUN_PATTERNS: readonly string[] = [
  'that one', 'that item', 'this one', 'it', 'that',
  'the same', 'the one you mentioned',
]

const CONTINUATION_PATTERNS: readonly string[] = [
  "let's continue", 'lets continue', 'continue', 'keep going',
  'carry on', 'go on', 'where were we', 'what were we doing',
]

const NEGATION_PATTERNS: readonly string[] = [
  'not that', 'not this', 'skip that', 'not that one',
  'different one', 'something else',
]

function matchesAny(text: string, patterns: readonly string[]): boolean {
  const lower = text.toLowerCase().trim()
  return patterns.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p))
}

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Attempt to resolve ambiguous references in the user message.
 * Returns the enriched message if resolution was applied, or null if not.
 */
export function resolveAmbiguousReference(
  text: string,
  context: AmbiguityContext,
): AmbiguityResolutionResult {
  const lower = text.toLowerCase().trim()

  // ── Curriculum level normalization (always safe) ───────────────────────────
  const normalizedCurriculum = normalizeCurriculumReference(text)
  if (normalizedCurriculum && normalizedCurriculum !== text) {
    return {
      wasResolved: true,
      resolutionType: 'curriculum_level',
      resolved: normalizedCurriculum,
      confidence: 0.98,
    }
  }

  // ── Continuation phrases ──────────────────────────────────────────────────
  if (matchesAny(text, CONTINUATION_PATTERNS) && context.lastGoalLabel) {
    return {
      wasResolved: true,
      resolutionType: 'continuation',
      resolved: `Continue: ${context.lastGoalLabel}. ${text}`,
      confidence: 0.85,
    }
  }

  // ── Pronoun resolution ─────────────────────────────────────────────────────
  if (matchesAny(text, PRONOUN_PATTERNS) && context.lastEntityLabel) {
    return {
      wasResolved: true,
      resolutionType: 'pronoun',
      resolved: `${text} (referring to ${context.lastEntityLabel})`,
      confidence: 0.75,
    }
  }

  // ── Negation phrases ──────────────────────────────────────────────────────
  if (matchesAny(text, NEGATION_PATTERNS)) {
    return {
      wasResolved: true,
      resolutionType: 'negation',
      resolved: `Skip: ${context.lastEntityLabel ?? 'current option'}. ${text}`,
      confidence: 0.80,
    }
  }

  // ── Single-word entity (likely a name or level reference) ─────────────────
  // "Sarah" → if conversation was just about Sarah, treat as her name
  if (/^[A-Z][a-z]+$/.test(text) && text.length >= 3 && context.lastEntityLabel) {
    const entity = context.lastEntityLabel
    if (entity.toLowerCase().includes(text.toLowerCase())) {
      return {
        wasResolved: true,
        resolutionType: 'entity_reference',
        resolved: `Show me information about ${entity}.`,
        confidence: 0.70,
      }
    }
  }

  // ── No resolution ─────────────────────────────────────────────────────────
  return {
    wasResolved: false,
    resolutionType: 'none',
    resolved: null,
    confidence: 0,
  }
}

/** Returns true when the text looks like a bare ambiguous reference. */
export function isAmbiguousReference(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return (
    matchesAny(text, PRONOUN_PATTERNS) ||
    matchesAny(text, CONTINUATION_PATTERNS) ||
    matchesAny(text, NEGATION_PATTERNS) ||
    // Single capitalized word with no context
    /^[A-Z][a-z]+$/.test(text)
  ) && lower.split(' ').length <= 4
}

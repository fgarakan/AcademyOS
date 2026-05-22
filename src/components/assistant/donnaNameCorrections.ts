// Sprint 645 — DONNA Name Correction Memory V1
// Session-local registry of director-supplied name corrections.
// No DB writes, no localStorage, no React — pure in-memory map for the current session.
// Cleared on page navigation or refresh. Designed to be held in React state by the
// DonnaAssistantButton orchestrator and passed to resolution utilities.

export interface NameCorrection {
  /** The name DONNA used (as recognized, normalized to lowercase for lookup). */
  wrongName: string
  /** The name the director supplied as the correction. */
  correctName: string
  /** ISO timestamp of when the correction was added. */
  correctedAt: string
}

// ── Registry type ─────────────────────────────────────────────────────────────

/** Map from normalized (lowercase) wrong name → correction entry. */
export type NameCorrectionRegistry = Map<string, NameCorrection>

export function createNameCorrectionRegistry(): NameCorrectionRegistry {
  return new Map()
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Record a correction. Returns a new Map (immutable update pattern for React state).
 * Overwrites any prior correction for the same wrong name.
 */
export function addNameCorrection(
  registry: NameCorrectionRegistry,
  wrongName: string,
  correctName: string,
): NameCorrectionRegistry {
  const next = new Map(registry)
  next.set(wrongName.toLowerCase().trim(), {
    wrongName: wrongName.trim(),
    correctName: correctName.trim(),
    correctedAt: new Date().toISOString(),
  })
  return next
}

// ── Lookups ───────────────────────────────────────────────────────────────────

/**
 * Apply all registered corrections to a string.
 * Replaces each corrected name (case-insensitive, whole-word) with the director-supplied name.
 */
export function applyNameCorrections(
  text: string,
  registry: NameCorrectionRegistry,
): string {
  if (registry.size === 0) return text
  let result = text
  for (const { wrongName, correctName } of Array.from(registry.values())) {
    // Whole-word, case-insensitive replacement
    const pattern = new RegExp(`\\b${escapeRegex(wrongName)}\\b`, 'gi')
    result = result.replace(pattern, correctName)
  }
  return result
}

/**
 * Check if a specific name has a correction registered.
 */
export function getNameCorrection(
  registry: NameCorrectionRegistry,
  name: string,
): NameCorrection | null {
  return registry.get(name.toLowerCase().trim()) ?? null
}

// ── Phrase detection ──────────────────────────────────────────────────────────

/**
 * Detect a correction phrase like "that's Alex not Alix" or "I said Alex not Alix".
 * Returns { wrongName, correctName } if detected, otherwise null.
 * All matching is case-insensitive.
 */
export function detectNameCorrectionPhrase(text: string): {
  wrongName: string
  correctName: string
} | null {
  const lower = text.toLowerCase().trim()

  // Pattern: "that's X not Y" / "it's X not Y" / "I meant X not Y"
  const pattern1 = /(?:that's|it's|he's|she's|they're|i meant|i said|his name is|her name is)\s+(\w+)\s+not\s+(\w+)/i
  const m1 = lower.match(pattern1)
  if (m1) {
    // correctName is the one after "that's", wrongName is the one after "not"
    return {
      correctName: capitalizeFirst(m1[1]),
      wrongName: capitalizeFirst(m1[2]),
    }
  }

  // Pattern: "not X, X" or "not X — X" (simpler: "not Alix, Alex")
  const pattern2 = /not\s+(\w+)[,—]\s*(\w+)/i
  const m2 = lower.match(pattern2)
  if (m2) {
    return {
      wrongName: capitalizeFirst(m2[1]),
      correctName: capitalizeFirst(m2[2]),
    }
  }

  // Pattern: "X not Y" at start (ambiguous without context — skip for safety)
  return null
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Sprint 1086 — DONNA Deep Mode Gate + Progressive Answering V1
//
// Intercepts broad/comprehensive requests before they trigger expensive multi-tool
// God Mode reasoning. Returns a quick first-pass response and asks the director to
// confirm before running a deeper analysis.
//
// Design principles:
//   - Gates ONLY on clearly broad/all-scope/deep-analysis requests.
//   - Normal analytical questions ("how is my academy?", "what needs attention?")
//     pass through to God Mode unchanged.
//   - Navigation, context-pack, and action-registry paths are never affected
//     (those handlers run before the gate).
//   - The progressive response is always honest about what a deeper analysis involves.
//   - No mutations. No DB writes. Pure logic + response construction.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Result type ───────────────────────────────────────────────────────────────

export interface DeepModeGateResult {
  /** Whether this input is classified as a broad/deep request requiring a gate. */
  isDeepMode: boolean
  /** The matched trigger phrase (or null if not a deep request). */
  matchedTrigger: string | null
  /** The first-pass progressive response text. Present when isDeepMode is true. */
  firstPassResponse: string | null
}

// ── Deep Mode trigger phrases ─────────────────────────────────────────────────
//
// These patterns match requests for broad, multi-domain, or comprehensive analysis.
// They are intentionally narrow — short analytical questions never match.
// Rule of thumb: if the request implies scanning ALL of something or running a
// COMPLETE/DEEP analysis, it's a Deep Mode candidate.

const DEEP_MODE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // "audit" anything at whole/all scope
  { pattern: /audit (the |my |the whole |whole |full |all )(academy|program|system)/i, label: 'academy-wide audit' },

  // "analyze all" any collection
  { pattern: /analyze all (players?|coaches?|sessions?|groups?|parents?|data)/i, label: 'all-players analysis' },
  { pattern: /analysis of all (players?|coaches?|sessions?|groups?|data)/i, label: 'all-data analysis' },

  // "find every" gap/issue
  { pattern: /find (every|all) (gap|issue|problem|risk|concern|opportunity)/i, label: 'find-every-gap' },
  { pattern: /every (curriculum )?gap/i, label: 'every curriculum gap' },
  { pattern: /all (curriculum |the )?gaps/i, label: 'all gaps' },

  // Full/complete/comprehensive/deep diagnosis, analysis, or review
  { pattern: /\bfull (diagnosis|analysis|report|review|assessment|audit|strategy|plan)\b/i, label: 'full-analysis' },
  { pattern: /\bcomplete (analysis|diagnosis|report|review|assessment|audit|strategy|plan)\b/i, label: 'complete-analysis' },
  { pattern: /\bcomprehensive (review|analysis|report|assessment|audit|strategy|plan)\b/i, label: 'comprehensive-review' },
  { pattern: /\bthorough (analysis|review|assessment|audit|report)\b/i, label: 'thorough-analysis' },
  { pattern: /\bdeep (analysis|dive|assessment|review|report|audit)\b/i, label: 'deep-analysis' },
  { pattern: /\bin.?depth (analysis|review|report|assessment)\b/i, label: 'in-depth-analysis' },

  // Comparing ALL coaches
  { pattern: /compare (all|every) coach(es)?/i, label: 'compare-all-coaches' },
  { pattern: /coach(ing)? (performance|quality|comparison) (report|analysis|review)/i, label: 'coach-performance-analysis' },

  // Full strategy / complete strategy
  { pattern: /\bfull (parent |player |coach |communication )?(strategy|plan|roadmap)\b/i, label: 'full-strategy' },
  { pattern: /\bcomplete (parent |player |coach |communication )?(strategy|plan|roadmap)\b/i, label: 'complete-strategy' },
  { pattern: /generate (a |the )?(full|complete|comprehensive|whole) /i, label: 'generate-full' },

  // "All the data" or "everything about"
  { pattern: /\ball (the )?data\b/i, label: 'all-data' },
  { pattern: /everything (about|on|for) (the |my |this )?(academy|program|players?|coaches?)/i, label: 'everything-about' },

  // Academy-wide scope
  { pattern: /academy.?wide (analysis|review|report|assessment|audit|strategy)/i, label: 'academy-wide-analysis' },
  { pattern: /\bwhole academy\b/i, label: 'whole-academy' },
]

// ── Negative guard: phrases that look broad but should NOT trigger the gate ────
//
// These phrases overlap with deep mode keywords but are common operational questions
// that should flow to God Mode (or context-pack) normally.

const DEEP_MODE_EXCLUSIONS: RegExp[] = [
  /^(how is|tell me about|explain|what is|what are|show me|open|go to)/i,
  /health of (my |the |this )?academy/i,  // Sprint 1071/1073 already handles this in context-pack
  /what needs attention/i,
  /what should i (do|focus|check|look at)/i,
  /make this (more |)/i,   // "make this more game-based" — fitness builder guidance
  /^(why|who|when|where|which)/i,  // Standard interrogative questions
]

// ── Main detector ─────────────────────────────────────────────────────────────

/**
 * Returns true when the input is a broad/expensive deep request that should be
 * gated before running multi-tool God Mode reasoning.
 *
 * Returns false for all normal analytical questions so they reach God Mode normally.
 */
export function isDeepModeRequest(text: string): boolean {
  const result = classifyDeepModeRequest(text)
  return result.isDeepMode
}

/**
 * Internal classifier — returns the full result for use in buildDeepModeFirstPassResponse.
 */
function classifyDeepModeRequest(text: string): DeepModeGateResult {
  // Exclusion guard: these phrases never trigger deep mode regardless of other matches
  for (const exclusion of DEEP_MODE_EXCLUSIONS) {
    if (exclusion.test(text)) {
      return { isDeepMode: false, matchedTrigger: null, firstPassResponse: null }
    }
  }

  // Check each deep mode pattern
  for (const { pattern, label } of DEEP_MODE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isDeepMode: true,
        matchedTrigger: label,
        firstPassResponse: null, // populated by buildDeepModeFirstPassResponse
      }
    }
  }

  return { isDeepMode: false, matchedTrigger: null, firstPassResponse: null }
}

// ── Page context quick reads ───────────────────────────────────────────────────
//
// Maps broad intents to a quick first-pass summary based on what's visible on
// the current page. Keeps the first answer grounded and page-aware.

function getQuickReadForContext(text: string, pathname: string): string {
  const lower = text.toLowerCase()

  if (lower.includes('player') || lower.includes('players') || pathname === '/director/players') {
    return 'For a player-level analysis, the key signals are: time in level (>180 days is a flag), absences in the last 30 days (≥2 is a flag), and advancement eligibility. Open the Academy Health page to see these across your full roster — or the Players directory to act on individual cases.'
  }

  if (lower.includes('coach') || lower.includes('coaches') || lower.includes('recap')) {
    return 'For coaching quality signals, look at wrap-up submission coverage (sessions with and without submitted recaps) and observation frequency per coach. The Sessions directory shows wrap-up status per session. The Review queue shows items awaiting director action.'
  }

  if (lower.includes('curriculum') || lower.includes('gap')) {
    return 'Curriculum gaps typically appear as: levels without class templates, templates without curriculum levels assigned, or players in a level with no matching drills. The Curriculum Builder shows coverage by level. The Academy Health page flags at-risk players who may signal curriculum-delivery issues.'
  }

  if (lower.includes('parent') || lower.includes('communication')) {
    return 'For parent communication strategy: start with players who haven\'t had a parent update recently (visible in the Parent Updates page). Parent updates go through the review queue — you draft, review, and dispatch. Nothing reaches parents without explicit approval.'
  }

  if (lower.includes('strategy') || lower.includes('plan') || lower.includes('roadmap')) {
    return 'A full academy strategy covers: curriculum coverage, player progression velocity, coach wrap-up quality, parent communication cadence, and review queue health. The Today dashboard and Academy Health page give you the live headline signals across all five dimensions.'
  }

  // Generic broad analysis fallback
  return 'A broad academy analysis spans: player development signals (time in level, absences, advancement readiness), coach activity (session delivery, wrap-up coverage), curriculum coverage (level-to-template mapping), and review queue health. Each of these has a dedicated dashboard section.'
}

// ── Progressive response builder ──────────────────────────────────────────────

/**
 * Build the progressive first-pass response for a deep/broad request.
 *
 * The response:
 *   1. Provides a quick, grounded read based on page context.
 *   2. Explains that a deeper multi-tool analysis is possible.
 *   3. Asks the director to confirm before running it.
 *
 * This response is designed to be immediately useful while preventing an
 * accidental multi-tool God Mode call the director did not intend.
 */
export function buildDeepModeFirstPassResponse(
  text: string,
  pathname: string,
): DeepModeGateResult {
  const classification = classifyDeepModeRequest(text)
  if (!classification.isDeepMode) {
    return classification
  }

  const quickRead = getQuickReadForContext(text, pathname)

  const firstPassResponse =
    `**Quick read:** ${quickRead}\n\n` +
    `For a deeper analysis — pulling live data across players, sessions, curriculum, and coaches — ` +
    `I can run a more comprehensive check that queries several data sources. ` +
    `This takes a moment and uses more context.\n\n` +
    `**Want me to run the deeper analysis?** If yes, say "yes, go deep" or ask the specific question ` +
    `you want answered and I will use the full context available.`

  return {
    ...classification,
    firstPassResponse,
  }
}

// Mega Sprint 2321–2340 — DONNA Entity Execution Integration V1
// Entity intent router: detects whether a director message is requesting
// entity navigation or a query about a specific entity.
// Returns the entity phrase to resolve, or null if the message is not an entity intent.
// Pure TypeScript — no DB, no React, no side effects.

// ── Intent kinds ──────────────────────────────────────────────────────────────

export type EntityIntentKind =
  | 'navigate'   // "show me X", "open X", "pull up X", "find X", "go to X"
  | 'query'      // "how is X doing?", "tell me about X", "what about X?"
  | 'improve'    // "improve X" (curriculum level)
  | 'status'     // "what's the status of X", "how is X going?"

export interface EntityIntentResult {
  kind:         EntityIntentKind
  entityPhrase: string  // extracted entity phrase (stripped, normalized)
  rawText:      string  // original input
}

// ── Guard phrases — phrases already handled by upstream brain steps ───────────
// If the message matches any of these, it is NOT an entity intent.

const NON_ENTITY_PHRASES = [
  /review queue/i,
  /needs (my |my\s+)?review/i,
  /needs approval/i,
  /pending (approval|review)/i,
  /what needs attention/i,
  /anything urgent/i,
  /daily brief/i,
  /today.?s brief/i,
  /what should i do (first|today)/i,
  /walk me through/i,
  /open a new/i,
  /create (a |an )?new/i,
  /start a new/i,
  /set up a new/i,
]

function isNonEntityPhrase(text: string): boolean {
  return NON_ENTITY_PHRASES.some(re => re.test(text))
}

// ── Navigate intent patterns ──────────────────────────────────────────────────

interface NavigatePattern {
  re:     RegExp
  group:  number   // capture group index for entity phrase
}

const NAVIGATE_PATTERNS: NavigatePattern[] = [
  // "show me Jake" / "show Jake"
  { re: /\b(?:show\s+me|show)\s+(.{2,60})\s*$/i,              group: 1 },
  // "open Jake's profile" / "open Jake" / "open Orange Ball 2"
  { re: /\bopen\s+(.{2,60})\s*$/i,                            group: 1 },
  // "pull up Jake"
  { re: /\bpull\s+up\s+(.{2,60})\s*$/i,                       group: 1 },
  // "find Jake" / "find me Jake"
  { re: /\bfind\s+(?:me\s+)?(.{2,60})\s*$/i,                  group: 1 },
  // "go to Jake's profile" / "go to OB2"
  { re: /\bgo\s+to\s+(.{2,60})\s*$/i,                         group: 1 },
  // "navigate to OB2"
  { re: /\bnavigate\s+to\s+(.{2,60})\s*$/i,                   group: 1 },
  // "take me to Jake"
  { re: /\btake\s+me\s+to\s+(.{2,60})\s*$/i,                  group: 1 },
  // "bring up Jake"
  { re: /\bbring\s+up\s+(.{2,60})\s*$/i,                      group: 1 },
  // "look up Jake"
  { re: /\blook\s+up\s+(.{2,60})\s*$/i,                       group: 1 },
  // "check on Jake" / "check Jake"
  { re: /\bcheck\s+(?:on\s+)?(.{2,60})\s*$/i,                 group: 1 },
]

// ── Query intent patterns ────────────────────────────────────────────────────

const QUERY_PATTERNS: NavigatePattern[] = [
  // "how is Jake doing" / "how is Jake going"
  { re: /\bhow(?:'s| is| are)\s+(.+?)\s+(?:doing|going|performing|progressing)\b/i, group: 1 },
  // "tell me about Jake"
  { re: /\btell\s+me\s+about\s+(.{2,60})\s*$/i,               group: 1 },
  // "what about Jake" / "what do you know about Jake"
  { re: /\bwhat\s+(?:do\s+you\s+know\s+)?about\s+(.{2,60})\s*$/i, group: 1 },
  // "details on Jake" / "details for Jake"
  { re: /\bdetails?\s+(?:on|for)\s+(.{2,60})\s*$/i,            group: 1 },
  // "what's going on with Alex" / "what is going on with Jake"
  { re: /\bwhat(?:'s| is)\s+going\s+on\s+with\s+(.{2,60})\s*$/i, group: 1 },
  // "can you update me on Jake" / "update me on Jake"
  { re: /\bupdate\s+(?:me\s+)?on\s+(.{2,60})\s*$/i,            group: 1 },
]

// ── Improve intent patterns ──────────────────────────────────────────────────

const IMPROVE_PATTERNS: NavigatePattern[] = [
  // "improve Orange Ball 2" / "improve OB2"
  { re: /\bimprove\s+(.{2,60})\s*$/i,                          group: 1 },
  // "optimize Orange Ball 2"
  { re: /\boptimize\s+(.{2,60})\s*$/i,                         group: 1 },
  // "review curriculum for OB2"
  { re: /\breview\s+curriculum\s+(?:for|of)\s+(.{2,60})\s*$/i, group: 1 },
]

// ── Status intent patterns ───────────────────────────────────────────────────

const STATUS_PATTERNS: NavigatePattern[] = [
  // "what's the status of OB2"
  { re: /\bstatus\s+of\s+(.{2,60})\s*$/i,                     group: 1 },
  // "status on Jake"
  { re: /\bstatus\s+on\s+(.{2,60})\s*$/i,                     group: 1 },
  // "how is OB2 looking" / "how's OB2 looking"
  { re: /\bhow(?:'s| is)\s+(.+?)\s+(?:looking|shaping up)\b/i, group: 1 },
]

// ── Entity phrase cleaner ─────────────────────────────────────────────────────

// Strip possessive ("Jake's" → "Jake"), trailing punctuation, and leading articles.
function cleanEntityPhrase(raw: string): string {
  return raw
    .replace(/\s*['']s\b/gi, '')          // remove possessive
    .replace(/[?!.,;]+$/, '')             // trailing punctuation
    .replace(/^(?:the|a|an)\s+/i, '')     // leading articles
    .trim()
}

// Reject phrases that are too vague to be an entity reference.
const VAGUE_PHRASES = new Set([
  'me', 'it', 'that', 'this', 'him', 'her', 'them', 'they', 'he', 'she',
  'something', 'someone', 'everyone', 'anybody', 'anyone',
  'the player', 'the coach', 'the group', 'the template',
])

function isVaguePhrase(phrase: string): boolean {
  return VAGUE_PHRASES.has(phrase.toLowerCase())
}

// ── Main detector ─────────────────────────────────────────────────────────────

/**
 * Returns an EntityIntentResult if the message is requesting entity navigation or
 * a query about a specific entity. Returns null if it is NOT an entity intent,
 * in which case the brain should continue to the next step.
 */
export function detectEntityIntent(text: string): EntityIntentResult | null {
  if (!text.trim()) return null

  // Guard: upstream brain steps already handle these phrases
  if (isNonEntityPhrase(text)) return null

  // ── Improve intent ─────────────────────────────────────────────────────────
  for (const { re, group } of IMPROVE_PATTERNS) {
    const m = re.exec(text)
    if (m && m[group]) {
      const phrase = cleanEntityPhrase(m[group])
      if (phrase.length >= 2 && !isVaguePhrase(phrase)) {
        return { kind: 'improve', entityPhrase: phrase, rawText: text }
      }
    }
  }

  // ── Status intent ──────────────────────────────────────────────────────────
  for (const { re, group } of STATUS_PATTERNS) {
    const m = re.exec(text)
    if (m && m[group]) {
      const phrase = cleanEntityPhrase(m[group])
      if (phrase.length >= 2 && !isVaguePhrase(phrase)) {
        return { kind: 'status', entityPhrase: phrase, rawText: text }
      }
    }
  }

  // ── Navigate intent ────────────────────────────────────────────────────────
  for (const { re, group } of NAVIGATE_PATTERNS) {
    const m = re.exec(text)
    if (m && m[group]) {
      const phrase = cleanEntityPhrase(m[group])
      if (phrase.length >= 2 && !isVaguePhrase(phrase)) {
        return { kind: 'navigate', entityPhrase: phrase, rawText: text }
      }
    }
  }

  // ── Query intent ───────────────────────────────────────────────────────────
  for (const { re, group } of QUERY_PATTERNS) {
    const m = re.exec(text)
    if (m && m[group]) {
      const phrase = cleanEntityPhrase(m[group])
      if (phrase.length >= 2 && !isVaguePhrase(phrase)) {
        return { kind: 'query', entityPhrase: phrase, rawText: text }
      }
    }
  }

  return null
}

// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 4 — Personality Layer
//
// Transforms raw OpenAI teacher output into DONNA's voice.
// DONNA voice: direct, data-first, action-oriented. No preamble, no enthusiasm.
//
// Voice rules:
//   - Never starts with "I", "Great", "Of course", "Certainly", "Sure", "Absolutely"
//   - No AI self-disclosure ("As an AI...", "As DONNA...")
//   - No filler openers ("It sounds like...", "I understand...", "Based on what you said...")
//   - Maximum 50 words per response
//   - Ends with terminal punctuation
//
// Design rules:
//   - Pure TypeScript. No API calls. No side effects. Never throws.

// ── Banned openers ────────────────────────────────────────────────────────────

const BANNED_OPENER_PATTERNS: RegExp[] = [
  /^(i |i'm |i've |i'd |i'll )/i,
  /^(great[!.,]?\s)/i,
  /^(of course[!.,]?\s)/i,
  /^(certainly[!.,]?\s)/i,
  /^(sure[!.,]?\s)/i,
  /^(absolutely[!.,]?\s)/i,
  /^(that'?s?\s+(a\s+)?(great|good|interesting|valid|fair)\s)/i,
  /^(as an ai[,.]?\s)/i,
  /^(as donna[,.]?\s)/i,
  /^(it sounds like\s)/i,
  /^(it seems like\s)/i,
  /^(based on what you['']?ve?\s+said[,.]?\s)/i,
  /^(i understand[.!]?\s)/i,
  /^(i see[.!]?\s)/i,
  /^(i can see\s)/i,
  /^(you['']?ve?\s+mentioned\s)/i,
]

const MAX_WORDS = 50

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncateToWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= max) return text.trim()
  return words.slice(0, max).join(' ') + '…'
}

// ── Result ────────────────────────────────────────────────────────────────────

export interface PersonalityResult {
  response: string
  wasTransformed: boolean
  transformations: string[]
}

// ── Layer ─────────────────────────────────────────────────────────────────────

/**
 * Apply DONNA's voice signature to an AI-drafted response.
 * Returns the transformed response and a record of transformations applied.
 */
export function applyDonnaPersonality(rawDraft: string): PersonalityResult {
  if (!rawDraft.trim()) {
    return {
      response: 'What specifically concerns you? I can pull the relevant data.',
      wasTransformed: true,
      transformations: ['empty_draft_fallback'],
    }
  }

  let text = rawDraft.trim()
  const transformations: string[] = []

  // 1. Strip banned openers — only the first match to avoid cascading
  for (const pattern of BANNED_OPENER_PATTERNS) {
    if (pattern.test(text)) {
      const stripped = text.replace(pattern, '').trim()
      if (stripped.length > 0) {
        text = stripped.charAt(0).toUpperCase() + stripped.slice(1)
      }
      transformations.push('stripped_banned_opener')
      break
    }
  }

  // 2. Enforce word limit
  if (text.split(/\s+/).length > MAX_WORDS) {
    text = truncateToWords(text, MAX_WORDS)
    transformations.push('truncated_to_max_words')
  }

  // 3. Ensure terminal punctuation
  if (text && !/[.!?…]$/.test(text)) {
    text = text + '.'
    transformations.push('added_terminal_punctuation')
  }

  return {
    response: text,
    wasTransformed: transformations.length > 0,
    transformations,
  }
}

// Sprint 996 — DONNA Voice Conversation Mode V2
// Voice-specific conversation routing and response formatting.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// V1 voice path (existing): speakDonna() → TTS → user hears response
// V2 additions:
//   - Voice-safe response formatting (shorter, spoken-language, no markdown)
//   - Intent detection from voice transcripts
//   - Voice-appropriate safety blocks (no complex data spoken aloud)
//   - Voice turn length limits (max 150 chars for TTS)
//
// Voice safety rules:
//   1. Never speak raw player data (names in bulk, assessment scores)
//   2. Never speak internal coach notes aloud
//   3. Keep spoken responses under 150 chars for TTS reliability
//   4. Sound natural — no markdown headers or bullet points
//   5. Always end with a clear action the director can take

// ── Voice intent types ────────────────────────────────────────────────────────

export type VoiceIntent =
  | 'what_next'           // "What should I do next?"
  | 'brief_me'            // "Brief me" / "What's going on?"
  | 'highlight_target'    // "Show me [X]" / "Point to [X]"
  | 'explain_page'        // "Explain this page"
  | 'navigate'            // "Take me to [X]"
  | 'review_guidance'     // "What should I review first?"
  | 'workflow_plan'       // "Walk me through [workflow]"
  | 'unknown'             // No match

const VOICE_INTENT_PATTERNS: Array<{ intent: VoiceIntent; phrases: string[] }> = [
  { intent: 'what_next', phrases: ['what should i do next', 'what do i do next', 'what next', "what's next"] },
  { intent: 'brief_me', phrases: ['brief me', "what's going on", 'what is going on', 'give me a brief', 'morning brief'] },
  { intent: 'highlight_target', phrases: ['show me', 'point to', 'highlight', 'where is'] },
  { intent: 'explain_page', phrases: ['explain this', 'what is this page', 'what does this do'] },
  { intent: 'navigate', phrases: ['take me to', 'go to', 'open the', 'navigate to'] },
  { intent: 'review_guidance', phrases: ['what should i review', 'review first', 'what to review'] },
  { intent: 'workflow_plan', phrases: ['walk me through', 'how do i', 'step by step'] },
]

export function detectVoiceIntent(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase().trim()
  for (const { intent, phrases } of VOICE_INTENT_PATTERNS) {
    if (phrases.some(p => lower.includes(p))) return intent
  }
  return 'unknown'
}

// ── Voice-safe response formatter ─────────────────────────────────────────────

/**
 * Format a DONNA text response for voice (TTS) delivery.
 * Removes markdown, shortens to 150 chars at sentence boundary, sounds natural.
 */
export function formatForVoice(text: string, maxChars = 150): string {
  // Strip markdown
  let spoken = text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/^#+\s+/gm, '')          // headers
    .replace(/^[-*]\s+/gm, '')        // bullets
    .replace(/\n+/g, ' ')             // newlines to spaces
    .trim()

  if (spoken.length <= maxChars) return spoken

  // Find sentence boundary
  const candidate = spoken.slice(0, maxChars)
  const lastSentence = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('? '),
    candidate.lastIndexOf('! '),
  )

  if (lastSentence > 80) {
    return spoken.slice(0, lastSentence + 1)
  }

  // Clause boundary
  const lastClause = Math.max(candidate.lastIndexOf(', '), candidate.lastIndexOf('; '))
  if (lastClause > 70) {
    return spoken.slice(0, lastClause + 1)
  }

  return spoken.slice(0, maxChars - 1) + '…'
}

// ── Voice response validator ──────────────────────────────────────────────────

export interface VoiceResponseValidation {
  safe: boolean
  warnings: string[]
  blockedPatterns: string[]
  spokenText: string
}

const VOICE_BLOCKED_PATTERNS = [
  { pattern: /raw.*note/i, label: 'raw_notes' },
  { pattern: /score:?\s+\d+/i, label: 'raw_scores' },
  { pattern: /ranked?\s+\d+/i, label: 'rankings' },
  { pattern: /\bpassword\b/i, label: 'password' },
  { pattern: /\bSSN\b/i, label: 'ssn' },
]

/**
 * Validate that a text response is safe to speak aloud.
 * Returns the sanitized spoken text and any warnings.
 */
export function validateVoiceResponse(text: string): VoiceResponseValidation {
  const blockedPatterns: string[] = []
  const warnings: string[] = []

  for (const { pattern, label } of VOICE_BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      blockedPatterns.push(label)
    }
  }

  const safe = blockedPatterns.length === 0

  if (text.length > 400) {
    warnings.push('Response is long for voice — consider shortening to under 150 chars for TTS.')
  }

  return {
    safe,
    warnings,
    blockedPatterns,
    spokenText: safe ? formatForVoice(text) : 'I have a response for you but it contains content that should not be spoken aloud. Please check the panel.',
  }
}

// ── Voice turn builder ────────────────────────────────────────────────────────

/**
 * Build a complete voice turn: detect intent, validate response, format for TTS.
 */
export function buildVoiceTurn(params: {
  transcript: string
  donnaResponse: string
}): {
  intent: VoiceIntent
  validation: VoiceResponseValidation
  spokenText: string
} {
  const intent = detectVoiceIntent(params.transcript)
  const validation = validateVoiceResponse(params.donnaResponse)
  return {
    intent,
    validation,
    spokenText: validation.spokenText,
  }
}

// Sprint 720 — Central DONNA voice configuration
// All TTS voice settings live here. No API keys. No DB. Pure config.
// Safe to import on both server and client (no 'use client' — no browser APIs).

// ── Personality ───────────────────────────────────────────────────────────────

export const DONNA_VOICE_PERSONALITY = 'warm_professional_coo' as const

// ── Provider priority ─────────────────────────────────────────────────────────

// Server (OpenAI) → browser speechSynthesis. Server is primary; browser is fallback only.
export const DONNA_TTS_PROVIDER_PRIORITY = ['server', 'browser'] as const

// ── OpenAI TTS settings ───────────────────────────────────────────────────────

// gpt-4o-mini-tts supports marin voice + voice instructions for style guidance.
// tts-1-hd is the legacy high-quality model (no instructions, no marin).
// Required env variable (server only): OPENAI_API_KEY
export const DONNA_OPENAI_TTS_MODEL = 'gpt-4o-mini-tts'

// Primary voice: marin — warm, professional, natural-sounding COO voice.
// Also used in the Realtime interview path (realtime-session/route.ts default).
// Alternative: cedar (newer warm voice; try if marin is unavailable on your plan).
export const DONNA_OPENAI_TTS_VOICE = 'marin'

// Hard fallback for plans that don't have gpt-4o-mini-tts or marin.
// nova is the warmest voice on tts-1/tts-1-hd.
export const DONNA_OPENAI_TTS_VOICE_FALLBACK = 'nova'
export const DONNA_OPENAI_TTS_MODEL_FALLBACK = 'tts-1-hd'

// Voice instructions — only supported on gpt-4o-mini-tts.
// Shapes speaking cadence, tone, and style.
// Sprint 788 — refined to match Sprint 786 response style persona (warm, calm, direct academy director)
export const DONNA_VOICE_INSTRUCTIONS =
  'Speak like a calm, professional tennis academy director. ' +
  'Warm and composed — like a trusted colleague, not a customer service assistant. ' +
  'Keep a measured, even pace. Pause briefly before questions so they land naturally. ' +
  'No announcer tone. No robotic cadence. No filler words. ' +
  'When offering to navigate or open something, keep the final question short and clear.'

// ── Browser TTS fallback settings ────────────────────────────────────────────

export const fallbackBrowserRate = 0.95
export const fallbackBrowserPitch = 0.98
export const fallbackBrowserVolume = 1.0

// Ranked preference list — first match wins.
// Covers: macOS (Samantha, Daniel, Karen), Windows (Jenny, Aria), Chrome (Google US English).
export const preferredBrowserVoiceKeywords = [
  'Natural',
  'Neural',
  'Enhanced',
  'Samantha',
  'Microsoft Jenny',
  'Microsoft Aria',
  'Google US English',
  'Daniel',
  'Karen',
]

// Voice names that indicate lower quality — deprioritised in selection.
export const avoidBrowserVoiceKeywords = [
  'compact',
  'robot',
  'whisper',
  'novelty',
]

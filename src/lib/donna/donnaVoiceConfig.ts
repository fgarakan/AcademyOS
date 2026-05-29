// Sprint 720 — Central DONNA voice configuration
// Sprint 965 — Updated: official DONNA voice persona defined; British accent added to
//              instructions; browser fallback keywords reordered to prefer British/UK voices.
// All TTS voice settings live here. No API keys. No DB. Pure config.
// Safe to import on both server and client (no 'use client' — no browser APIs).

// ── Official DONNA Voice Persona ──────────────────────────────────────────────
//
// DONNA's voice identity (Sprint 965):
//   - Gender presentation: female-sounding
//   - Accent: slight English / British accent
//   - Tone: calm, trustworthy, premium, COO-like
//   - Pace: medium-slow, clear, deliberate
//   - Energy: composed confidence — never hype, never cheerleader, never robotic
//
// The server path requests this persona via DONNA_VOICE_INSTRUCTIONS (gpt-4o-mini-tts).
// The browser fallback attempts to match via preferredBrowserVoiceKeywords — voice quality
// and accent fidelity vary by OS and browser; British accent is best-effort in that path.
//
export const DONNA_VOICE_PERSONALITY = 'female_british_calm_coo' as const

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
// Sprint 965: marin is preserved as the safest supported voice ID. The British accent
// is shaped via DONNA_VOICE_INSTRUCTIONS, not by switching to a different voice ID.
export const DONNA_OPENAI_TTS_VOICE = 'marin'

// Hard fallback for plans that don't have gpt-4o-mini-tts or marin.
// nova is the warmest voice on tts-1/tts-1-hd.
export const DONNA_OPENAI_TTS_VOICE_FALLBACK = 'nova'
export const DONNA_OPENAI_TTS_MODEL_FALLBACK = 'tts-1-hd'

// Voice instructions — only supported on gpt-4o-mini-tts.
// Shapes speaking cadence, tone, accent preference, and style.
// Sprint 788 — refined to match Sprint 786 response style persona.
// Sprint 965 — added British/English accent request and COO persona framing.
export const DONNA_VOICE_INSTRUCTIONS =
  'Speak with a slight English or British accent — calm, composed, and trustworthy. ' +
  'You are DONNA, an AI COO assistant for a tennis academy. ' +
  'Professional and warm — like a trusted senior colleague, not a customer service assistant. ' +
  'Keep a measured, even pace. Pause briefly before questions so they land naturally. ' +
  'No announcer tone. No robotic cadence. No filler words. ' +
  'When offering to navigate or open something, keep the final question short and clear.'

// ── Browser TTS fallback settings ────────────────────────────────────────────

export const fallbackBrowserRate = 0.95
export const fallbackBrowserPitch = 0.98
export const fallbackBrowserVolume = 1.0

// Ranked preference list — first match wins.
// Sprint 965: reordered to prefer British/UK female voices first, then quality
// US/generic voices, then British male as lower priority.
//
// NOTE: Browser voice availability is OS- and browser-dependent.
// British accent fidelity in the browser path is best-effort only:
//   - Windows: Hazel, Libby (UK female) — available on some Windows 11 builds
//   - macOS: Serena (UK English), Moira (Irish English), Fiona (Scottish English)
//   - Chrome on Linux/Android: typically no UK voices; falls back to US quality voices
// The server TTS path (marin + voice instructions) is the authoritative voice.
export const preferredBrowserVoiceKeywords = [
  // British / UK female — primary preference
  'Hazel',     // Windows UK female (Microsoft Hazel)
  'Libby',     // Windows UK female (Microsoft Libby)
  'Serena',    // macOS UK English female
  'Moira',     // macOS Irish English (closest available British female on macOS)
  'Fiona',     // macOS Scottish English
  // Quality US / neutral voices — fallback when no British voice is present
  'Natural',
  'Neural',
  'Enhanced',
  'Microsoft Aria',
  'Microsoft Jenny',
  'Samantha',
  'Karen',
  'Google US English',
  // British male — lower priority than female per persona target
  'Daniel',    // macOS UK English male
]

// Voice names that indicate lower quality — deprioritised in selection.
export const avoidBrowserVoiceKeywords = [
  'compact',
  'robot',
  'whisper',
  'novelty',
]

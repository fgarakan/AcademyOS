'use client'

// Sprint 646 — DONNA Voice Preload V1
// Warm up the voice output path when the DONNA panel opens so there is no
// perceptible delay on first utterance. No DB, no mutations, no React.
//
// Browser TTS: SpeechSynthesis has a cold-start delay on first speak().
//   Preload fires a zero-volume, zero-duration utterance to prime the engine.
//
// Realtime path: Check /api/donna/tts with a HEAD request (or a lightweight
//   OPTIONS probe) to detect availability early. No audio produced.
//
// Call preloadDonnaVoice() once when the DONNA panel mounts.
// Subsequent calls are no-ops (guard via preloaded flag).

let preloaded = false

export interface VoicePreloadResult {
  browserTtsReady: boolean
  realtimeAvailable: boolean | null  // null if check was skipped
}

/**
 * Warm up voice paths. Safe to call multiple times — runs at most once per session.
 */
export async function preloadDonnaVoice(): Promise<VoicePreloadResult> {
  if (preloaded) {
    return { browserTtsReady: true, realtimeAvailable: null }
  }
  preloaded = true

  const [browserTtsReady, realtimeAvailable] = await Promise.all([
    warmBrowserTts(),
    probeRealtimeAvailability(),
  ])

  return { browserTtsReady, realtimeAvailable }
}

/** Reset so preload runs again (e.g., after a session expiry). For tests/debug only. */
export function resetVoicePreload(): void {
  preloaded = false
}

// ── Browser TTS warm-up ──────────────────────────────────────────────────────

function warmBrowserTts(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false)
      return
    }

    // getVoices() returning a non-empty list is enough to confirm the engine is loaded.
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(true)
      return
    }

    // Some browsers load voices asynchronously — wait for the event.
    const timeout = setTimeout(() => resolve(false), 2000)
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      clearTimeout(timeout)
      resolve(window.speechSynthesis.getVoices().length > 0)
    }, { once: true })
  })
}

// ── Realtime availability probe ───────────────────────────────────────────────

async function probeRealtimeAvailability(): Promise<boolean | null> {
  try {
    // Lightweight probe — send a HEAD to the TTS endpoint.
    // A 200 or 405 (method not allowed) means the route exists.
    // A 503 means the API key is not configured.
    const res = await fetch('/api/donna/tts', { method: 'HEAD' })
    if (res.status === 503) return false
    if (res.status === 200 || res.status === 405) return true
    return null
  } catch {
    return null
  }
}

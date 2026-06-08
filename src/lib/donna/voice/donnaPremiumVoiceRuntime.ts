'use client'

// Sprint 1861–1880 — DONNA Premium Voice Runtime V1
// Single canonical entry point for all director DONNA voice output.
//
// Priority: server TTS (OpenAI gpt-4o-mini-tts + marin voice) → browser TTS fallback.
// All director-facing DONNA speech should go through speakDonna().
//
// Voice path consolidation:
//   speakDonna({ mode: 'premium' })   → server TTS (marin) → browser fallback
//   speakDonna({ mode: 'browser' })   → browser TTS only (explicitly labeled fallback)
//
// Robotic/bare browser TTS is never the default — only used when server is unavailable.
// The fallback mode is always clearly identified in the result ({ mode: 'browser_fallback' }).
//
// No React. No DB. No mutations. Client-only (browser APIs used at call time, not import time).

import { speakWithServerTts, stopServerTts } from '@/components/assistant/donnaServerTtsClient'
import type { ServerTtsStatus } from '@/components/assistant/donnaServerTtsClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaSpeakMode = 'premium' | 'browser_fallback' | 'silent'

export interface SpeakDonnaOptions {
  /** 'premium' = server TTS preferred (default). 'browser' = skip server, use browser only. */
  mode?: 'premium' | 'browser'
  /** Allow browser fallback when server is unavailable. Default: true. */
  fallback?: boolean
  /** Status callback — fired as speech progresses. */
  onStatus?: (status: ServerTtsStatus) => void
}

export interface SpeakDonnaResult {
  ok: boolean
  /** Which voice path was actually used. */
  mode: DonnaSpeakMode
  /** Voice name used (e.g. 'marin', 'Samantha', 'default'). */
  voice?: string
  /** Why this path was selected (for diagnostics only). */
  reason?: string
}

// ── Global speak version — Sprint 995 duplicate-speech guard ─────────────────
// Incremented on every speakDonna() call. Any in-flight call whose version no
// longer matches the current value is superseded and discards its result.
// This is belt-and-suspenders on top of the AbortController in donnaServerTtsClient.
let _speakVersion = 0

// ── Stop any current DONNA speech ─────────────────────────────────────────────

/** Stop any DONNA speech currently in progress — both server and browser paths. */
export function stopDonna(): void {
  stopServerTts()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// ── Single entry point ────────────────────────────────────────────────────────

/**
 * Speak a DONNA message through the premium voice runtime.
 *
 * Default (mode = 'premium'):
 *   1. Server TTS — OpenAI gpt-4o-mini-tts + marin voice + British COO persona
 *   2. Browser TTS fallback — only when server is unavailable, and clearly labeled
 *
 * Explicit browser mode (mode = 'browser'):
 *   Skips server TTS; goes straight to browser TTS.
 *   Use only when explicitly in fallback context (e.g. no OPENAI_API_KEY configured).
 *
 * Returns SpeakDonnaResult so callers can show the correct status label.
 *
 * Sprint 995: version guard — if a newer speakDonna() call supersedes this one
 * (e.g. two components call simultaneously), the older call returns 'silent'
 * without producing audio. Only the most recent call ever plays.
 */
export async function speakDonna(
  text: string,
  options: SpeakDonnaOptions = {},
): Promise<SpeakDonnaResult> {
  const { mode = 'premium', fallback = true, onStatus } = options

  if (!text.trim()) {
    return { ok: false, mode: 'silent', reason: 'empty_text' }
  }

  // Cancel any current speech (also aborts in-flight server fetch via AbortController)
  stopDonna()

  // Sprint 995: claim a version slot — a newer caller will increment this past myVersion
  const myVersion = ++_speakVersion

  if (mode === 'browser') {
    const r = await speakBrowserFallback(text, onStatus)
    if (_speakVersion !== myVersion) return { ok: false, mode: 'silent', reason: 'superseded' }
    return r
  }

  // Premium path: server TTS → browser fallback
  const result = await speakWithServerTts(text, onStatus)

  // Sprint 995: discard result if a newer call has taken over
  if (_speakVersion !== myVersion) {
    return { ok: false, mode: 'silent', reason: 'superseded' }
  }

  // Cancelled by AbortController — return silent, no fallback
  if (result.reason === 'cancelled') {
    return { ok: false, mode: 'silent', reason: 'cancelled' }
  }

  if (result.source === 'server') {
    return { ok: result.ok, mode: 'premium', voice: result.voice, reason: 'server_tts' }
  }

  if (result.source === 'browser') {
    if (!fallback) {
      return { ok: false, mode: 'silent', reason: 'fallback_disabled' }
    }
    return {
      ok: result.ok,
      mode: 'browser_fallback',
      voice: result.voice,
      reason: result.reason ?? 'server_unavailable',
    }
  }

  return { ok: false, mode: 'silent', reason: result.reason ?? 'no_audio' }
}

// ── Browser-only path ─────────────────────────────────────────────────────────

function speakBrowserFallback(
  text: string,
  onStatus?: (status: ServerTtsStatus) => void,
): Promise<SpeakDonnaResult> {
  return new Promise<SpeakDonnaResult>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onStatus?.('error')
      resolve({ ok: false, mode: 'silent', reason: 'no_browser_tts' })
      return
    }

    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = 0.95
    utt.pitch = 0.98
    utt.volume = 1.0

    const voice = pickBestBrowserVoice()
    if (voice) utt.voice = voice
    const voiceName = voice?.name ?? 'default'

    onStatus?.('starting')
    utt.onstart = () => onStatus?.('speaking')
    utt.onend = () => {
      onStatus?.('done')
      resolve({ ok: true, mode: 'browser_fallback', voice: voiceName, reason: 'browser_tts' })
    }
    utt.onerror = () => {
      onStatus?.('error')
      resolve({ ok: false, mode: 'silent', reason: 'browser_tts_error' })
    }

    window.speechSynthesis.speak(utt)
  })
}

// ── Browser voice selection ───────────────────────────────────────────────────
// Mirrors donnaVoiceConfig.ts keyword order — British/quality voices preferred.

const PREFERRED_KEYWORDS = [
  'Hazel', 'Libby', 'Serena', 'Moira', 'Fiona',
  'Natural', 'Neural', 'Enhanced',
  'Microsoft Aria', 'Microsoft Jenny',
  'Samantha', 'Karen',
  'Google US English', 'Daniel',
]

const AVOID_KEYWORDS = ['compact', 'robot', 'whisper', 'novelty']

function pickBestBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  const usable = voices.filter(v =>
    v.lang.startsWith('en') &&
    !AVOID_KEYWORDS.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
  )

  for (const kw of PREFERRED_KEYWORDS) {
    const match = usable.find(v => v.name.toLowerCase().includes(kw.toLowerCase()))
    if (match) return match
  }

  return usable.find(v => v.localService) ?? usable[0] ?? null
}

// ── Mode labels (for UI display) ──────────────────────────────────────────────

export function getDonnaSpeakModeLabel(mode: DonnaSpeakMode): string {
  switch (mode) {
    case 'premium':          return 'DONNA voice (premium)'
    case 'browser_fallback': return 'DONNA voice (browser fallback)'
    case 'silent':           return 'Voice unavailable'
  }
}

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
  /** Identifies the calling surface/component. Used for runtime logging only. */
  caller?: string
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

// ── Sprint 995 V2 — Runtime speech log ───────────────────────────────────────
// One entry per speakDonna() call. Keeps the last 20 entries (ring buffer).
// Exposed via getSpeechLog() for in-browser debugging. Use clearSpeechLog() to reset.

export interface DonnaSpeechLogEntry {
  requestId: string
  caller: string
  textPreview: string
  timestamp: string
  mode: DonnaSpeakMode | 'pending'
  cancelled: boolean
  played: boolean
}

const _speechLog: DonnaSpeechLogEntry[] = []
let _reqCounter = 0

export function getSpeechLog(): readonly DonnaSpeechLogEntry[] {
  return [..._speechLog]
}

export function clearSpeechLog(): void {
  _speechLog.length = 0
}

// ── Stop any current DONNA speech ─────────────────────────────────────────────

/** Stop any DONNA speech currently in progress — both server and browser paths. */
export function stopDonna(): void {
  // Mark the most recent in-flight log entry as cancelled
  const active = _speechLog.findLast ? _speechLog.findLast(e => !e.cancelled && e.mode === 'pending') : undefined
  if (active) active.cancelled = true
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
  const { mode = 'premium', fallback = true, onStatus, caller = 'unknown' } = options

  // Sprint 995 V2: runtime log entry — one per call, kept for forensic debugging
  const reqId = `req_${++_reqCounter}`
  const logEntry: DonnaSpeechLogEntry = {
    requestId: reqId,
    caller,
    textPreview: text.slice(0, 60),
    timestamp: new Date().toISOString(),
    mode: 'pending',
    cancelled: false,
    played: false,
  }
  _speechLog.push(logEntry)
  if (_speechLog.length > 20) _speechLog.shift()

  console.log('[DonnaVoice] speakDonna', { reqId, caller, textPreview: text.slice(0, 60), mode })

  if (!text.trim()) {
    logEntry.mode = 'silent'
    logEntry.cancelled = true
    return { ok: false, mode: 'silent', reason: 'empty_text' }
  }

  // Cancel any current speech (also aborts in-flight server fetch via AbortController)
  stopDonna()

  // Sprint 995: claim a version slot — a newer caller will increment this past myVersion
  const myVersion = ++_speakVersion

  if (mode === 'browser') {
    const r = await speakBrowserFallback(text, onStatus)
    if (_speakVersion !== myVersion) {
      logEntry.cancelled = true
      console.log('[DonnaVoice] superseded', { reqId, caller, newVersion: _speakVersion })
      return { ok: false, mode: 'silent', reason: 'superseded' }
    }
    logEntry.mode = r.mode
    logEntry.played = r.ok
    return r
  }

  // Premium path: server TTS → browser fallback
  const result = await speakWithServerTts(text, onStatus)

  // Sprint 995: discard result if a newer call has taken over
  if (_speakVersion !== myVersion) {
    logEntry.cancelled = true
    console.log('[DonnaVoice] superseded', { reqId, caller, newVersion: _speakVersion })
    return { ok: false, mode: 'silent', reason: 'superseded' }
  }

  // Cancelled by AbortController — return silent, no fallback
  if (result.reason === 'cancelled') {
    logEntry.cancelled = true
    logEntry.mode = 'silent'
    return { ok: false, mode: 'silent', reason: 'cancelled' }
  }

  if (result.source === 'server') {
    logEntry.mode = 'premium'
    logEntry.played = result.ok
    console.log('[DonnaVoice] played', { reqId, caller, mode: 'server', voice: result.voice })
    return { ok: result.ok, mode: 'premium', voice: result.voice, reason: 'server_tts' }
  }

  if (result.source === 'browser') {
    if (!fallback) {
      logEntry.mode = 'silent'
      return { ok: false, mode: 'silent', reason: 'fallback_disabled' }
    }
    logEntry.mode = 'browser_fallback'
    logEntry.played = result.ok
    console.log('[DonnaVoice] played', { reqId, caller, mode: 'browser_fallback', voice: result.voice })
    return {
      ok: result.ok,
      mode: 'browser_fallback',
      voice: result.voice,
      reason: result.reason ?? 'server_unavailable',
    }
  }

  logEntry.mode = 'silent'
  return { ok: false, mode: 'silent', reason: result.reason ?? 'no_audio' }
}

// ── Browser-only path ─────────────────────────────────────────────────────────
// Sprint 995 V2: DISABLED — browser speechSynthesis fallback produces ghost second voices.
// All DONNA speech must go through server TTS (/api/donna/tts).
// Re-enable only after forensic audit confirms root cause is eliminated.

function speakBrowserFallback(
  text: string,
  onStatus?: (status: ServerTtsStatus) => void,
): Promise<SpeakDonnaResult> {
  console.warn('[DonnaVoice] Browser fallback DISABLED (Sprint 995 V2).', {
    textPreview: text.slice(0, 60),
    reason: 'forensic_audit_in_progress',
  })
  onStatus?.('error')
  return Promise.resolve({ ok: false, mode: 'silent' as DonnaSpeakMode, reason: 'browser_fallback_disabled' })
}

// ── Browser voice selection ───────────────────────────────────────────────────
// Unused while browser fallback is disabled (Sprint 995 V2).
// Retained so it can be quickly re-enabled once the forensic audit is complete.

// ── Mode labels (for UI display) ──────────────────────────────────────────────

export function getDonnaSpeakModeLabel(mode: DonnaSpeakMode): string {
  switch (mode) {
    case 'premium':          return 'DONNA voice (premium)'
    case 'browser_fallback': return 'DONNA voice (browser fallback)'
    case 'silent':           return 'Voice unavailable'
  }
}

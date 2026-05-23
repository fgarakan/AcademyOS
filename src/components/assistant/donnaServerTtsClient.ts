'use client'

// Sprint 350 — Server TTS client for Donna contract prompts.
// Chain: server TTS (/api/donna/tts) → browser speechSynthesis → silent.
// Sprint 720 — upgraded: reads X-Donna-Voice header, applies voice config to browser fallback.

import {
  fallbackBrowserRate,
  fallbackBrowserPitch,
  fallbackBrowserVolume,
  preferredBrowserVoiceKeywords,
  avoidBrowserVoiceKeywords,
} from '@/lib/donna/donnaVoiceConfig'

let activeAudioEl: HTMLAudioElement | null = null

export interface ServerTtsResult {
  ok: boolean
  source: 'server' | 'browser' | 'silent'
  // Sprint 720 — voice name used (e.g. 'marin', 'nova', 'Samantha', 'default')
  voice?: string
  reason?: string
}

export type ServerTtsStatus = 'starting' | 'speaking' | 'done' | 'error'

// Sprint 720 — select best available browser voice from the config keyword lists
function pickBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Filter out explicitly avoided voice types
  const usable = voices.filter(v =>
    v.lang.startsWith('en') &&
    !avoidBrowserVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
  )

  // Try preferred keywords in order
  for (const keyword of preferredBrowserVoiceKeywords) {
    const match = usable.find(v => v.name.toLowerCase().includes(keyword.toLowerCase()))
    if (match) return match
  }

  // Fall back to any local English voice, then any English voice
  return usable.find(v => v.localService) ?? usable[0] ?? null
}

export async function speakWithServerTts(
  text: string,
  onStatus?: (status: ServerTtsStatus) => void,
): Promise<ServerTtsResult> {
  onStatus?.('starting')
  stopServerTts()

  // ── Path 1: Server TTS (OpenAI gpt-4o-mini-tts + marin) ─────────────────────
  try {
    const res = await fetch('/api/donna/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (res.ok) {
      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('audio/mpeg')) {
        // Sprint 720 — read which voice the server used
        const voiceUsed = res.headers.get('X-Donna-Voice') ?? 'server'
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const el = new Audio(url)
        activeAudioEl = el

        return new Promise<ServerTtsResult>((resolve) => {
          el.onplay = () => onStatus?.('speaking')
          el.onended = () => {
            URL.revokeObjectURL(url)
            activeAudioEl = null
            onStatus?.('done')
            resolve({ ok: true, source: 'server', voice: voiceUsed })
          }
          el.onerror = () => {
            URL.revokeObjectURL(url)
            activeAudioEl = null
            void browserTtsFallback(text, onStatus).then(resolve)
          }
          el.play().catch(() => {
            void browserTtsFallback(text, onStatus).then(resolve)
          })
        })
      }
    }

    // Non-audio response — check reason and fall through to browser TTS
    let reason = 'server_unavailable'
    try {
      const json = await res.json() as { reason?: string }
      reason = json.reason ?? reason
    } catch { /* ignore */ }

    if (reason !== 'server_tts_not_configured') {
      console.warn('[DonnaTTS] Server TTS failed:', reason)
    }
  } catch (err) {
    console.warn('[DonnaTTS] Server TTS fetch error:', err instanceof Error ? err.message : String(err))
  }

  // ── Path 2: Browser TTS (fallback) ──────────────────────────────────────────
  return browserTtsFallback(text, onStatus)
}

function browserTtsFallback(
  text: string,
  onStatus?: (status: ServerTtsStatus) => void,
): Promise<ServerTtsResult> {
  return new Promise<ServerTtsResult>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onStatus?.('error')
      resolve({ ok: false, source: 'silent', reason: 'no_browser_tts' })
      return
    }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)

    // Sprint 720 — apply central voice config to browser fallback
    utt.rate = fallbackBrowserRate
    utt.pitch = fallbackBrowserPitch
    utt.volume = fallbackBrowserVolume
    const selectedVoice = pickBrowserVoice()
    if (selectedVoice) utt.voice = selectedVoice
    const voiceName = selectedVoice?.name ?? 'default'

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DonnaTTS] Browser fallback voice:', voiceName)
    }

    utt.onstart = () => onStatus?.('speaking')
    utt.onend = () => { onStatus?.('done'); resolve({ ok: true, source: 'browser', voice: voiceName }) }
    utt.onerror = () => { onStatus?.('error'); resolve({ ok: false, source: 'browser', reason: 'browser_tts_error' }) }
    window.speechSynthesis.speak(utt)
  })
}

export function stopServerTts() {
  if (activeAudioEl) {
    try { activeAudioEl.pause(); activeAudioEl.src = '' } catch { /* ignore */ }
    activeAudioEl = null
  }
}

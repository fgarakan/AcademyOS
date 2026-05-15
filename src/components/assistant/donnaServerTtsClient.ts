'use client'

// Sprint 350 — Server TTS client for Donna contract prompts.
// Chain: server TTS (/api/donna/tts) → browser speechSynthesis → silent.
// Returns a promise that resolves when audio completes or all paths fail.

let activeAudioEl: HTMLAudioElement | null = null

export interface ServerTtsResult {
  ok: boolean
  source: 'server' | 'browser' | 'silent'
  reason?: string
}

export type ServerTtsStatus = 'starting' | 'speaking' | 'done' | 'error'

export async function speakWithServerTts(
  text: string,
  onStatus?: (status: ServerTtsStatus) => void,
): Promise<ServerTtsResult> {
  onStatus?.('starting')
  stopServerTts()

  // ── Path 1: Server TTS ──────────────────────────────────────────────────────
  try {
    const res = await fetch('/api/donna/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (res.ok) {
      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('audio/mpeg')) {
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
            resolve({ ok: true, source: 'server' })
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

  // ── Path 2: Browser TTS ─────────────────────────────────────────────────────
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
    utt.onstart = () => onStatus?.('speaking')
    utt.onend = () => { onStatus?.('done'); resolve({ ok: true, source: 'browser' }) }
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

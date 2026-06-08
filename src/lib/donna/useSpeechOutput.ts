'use client'

// Sprint 550 — Spoken Prompt Shell V1
// Browser Speech Synthesis API wrapper for DONNA spoken prompts.
// Optional — always has a mute/off state. Text fallback always shown.
// No package installs. No DB. No external sends.
//
// Sprint 995 — routed through the canonical donnaPremiumVoiceRuntime so this hook
// can never produce a second, competing voice alongside speakDonna(). The mute state
// is preserved: when muted, no audio is produced. When unmuted, the same TTS chain
// (server TTS → browser fallback) is used as all other DONNA speech.

import { useState, useCallback, useEffect, useRef } from 'react'
import { speakDonna as speakDonnaPremium, stopDonna } from '@/lib/donna/voice/donnaPremiumVoiceRuntime'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SpeechOutputStatus = 'unavailable' | 'idle' | 'speaking' | 'muted'

export interface UseSpeechOutputReturn {
  status: SpeechOutputStatus
  isAvailable: boolean
  isMuted: boolean
  speak: (text: string) => void
  stop: () => void
  toggleMute: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSpeechOutput(defaultMuted = false): UseSpeechOutputReturn {
  const [status, setStatus] = useState<SpeechOutputStatus>('unavailable')
  const [isMuted, setIsMuted] = useState(defaultMuted)
  const availableRef = useRef(false)

  useEffect(() => {
    // Available on any client — speakDonnaPremium handles environment checks internally
    availableRef.current = typeof window !== 'undefined'
    setStatus(availableRef.current ? (defaultMuted ? 'muted' : 'idle') : 'unavailable')
  }, [defaultMuted])

  const speak = useCallback(
    (text: string) => {
      if (!availableRef.current || isMuted || !text.trim()) return
      setStatus('speaking')
      void speakDonnaPremium(text, {
        caller: 'useSpeechOutput',
        onStatus: (s) => {
          if (s === 'done' || s === 'error') setStatus('idle')
        },
      })
    },
    [isMuted],
  )

  const stop = useCallback(() => {
    if (!availableRef.current) return
    stopDonna()
    setStatus(prev => (prev === 'speaking' ? 'idle' : prev))
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      if (next && availableRef.current) {
        stopDonna()
      }
      setStatus(prev2 => {
        if (!availableRef.current) return prev2
        return next ? 'muted' : 'idle'
      })
      return next
    })
  }, [])

  return {
    status,
    isAvailable: availableRef.current,
    isMuted,
    speak,
    stop,
    toggleMute,
  }
}

'use client'

// Sprint 550 — Spoken Prompt Shell V1
// Browser Speech Synthesis API wrapper for DONNA spoken prompts.
// Optional — always has a mute/off state. Text fallback always shown.
// No package installs. No DB. No external sends.

import { useState, useCallback, useEffect, useRef } from 'react'

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

// ── Availability check ────────────────────────────────────────────────────────

function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSpeechOutput(defaultMuted = false): UseSpeechOutputReturn {
  const [status, setStatus] = useState<SpeechOutputStatus>('unavailable')
  const [isMuted, setIsMuted] = useState(defaultMuted)
  const availableRef = useRef(false)

  useEffect(() => {
    const available = isSpeechSynthesisAvailable()
    availableRef.current = available
    setStatus(available ? (defaultMuted ? 'muted' : 'idle') : 'unavailable')
  }, [defaultMuted])

  const speak = useCallback(
    (text: string) => {
      if (!availableRef.current || isMuted || !text.trim()) return

      // Cancel any ongoing speech before starting new
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.volume = 0.9

      utterance.onstart = () => setStatus('speaking')
      utterance.onend = () => setStatus('idle')
      utterance.onerror = () => setStatus('idle')

      setStatus('speaking')
      window.speechSynthesis.speak(utterance)
    },
    [isMuted],
  )

  const stop = useCallback(() => {
    if (!availableRef.current) return
    window.speechSynthesis.cancel()
    setStatus(prev => (prev === 'speaking' ? 'idle' : prev))
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      if (next && availableRef.current) {
        window.speechSynthesis.cancel()
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

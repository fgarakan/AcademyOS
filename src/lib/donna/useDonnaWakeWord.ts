'use client'

// Sprint 1791–1800 — DONNA Wake Word V1
// Persistent wake word listener for the director portal.
// Listens for "Hey Donna" in the background and routes detected commands
// through the existing donna:open event pipeline.
// No DB calls. No mutations. Browser SpeechRecognition only.
// Chrome/Edge supported. Firefox/Safari: isSupported = false, graceful fallback.

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  detectWakePhrase,
  extractCommandAfterWake,
} from '@/components/assistant/donnaVoiceRuntime'

// ── State machine ─────────────────────────────────────────────────────────────

export type WakeWordState =
  | 'dormant'       // not listening — user has not enabled wake mode
  | 'listening'     // mic active, waiting for "Hey Donna"
  | 'wakeDetected'  // wake phrase heard — brief "Hi, I'm listening." moment
  | 'active'        // listening for the command that follows the wake phrase
  | 'processing'    // command received, dispatched to DONNA pipeline
  | 'timedOut'      // inactivity timeout fired — returning to listening

// ── SpeechRecognition type shim ───────────────────────────────────────────────
// Not in standard TypeScript DOM lib — declared minimally.

interface WakeSpeechRecognitionAlternative {
  transcript: string
}

interface WakeSpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: WakeSpeechRecognitionAlternative
}

interface WakeSpeechRecognitionResultList {
  length: number
  [index: number]: WakeSpeechRecognitionResult
}

interface WakeSpeechRecognitionEvent {
  resultIndex: number
  results: WakeSpeechRecognitionResultList
}

interface WakeSpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: WakeSpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getSpeechRecognitionConstructor(): (new () => WakeSpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (
    (w['SpeechRecognition'] as (new () => WakeSpeechRecognitionInstance) | undefined) ??
    (w['webkitSpeechRecognition'] as (new () => WakeSpeechRecognitionInstance) | undefined) ??
    null
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** ms of inactivity in active/wakeDetected state before returning to listening */
const ACTIVE_TIMEOUT_MS = 60_000

/** ms to show "Say Hey Donna to continue." before auto-resuming listening */
const TIMEOUT_RECOVERY_MS = 4_000

/** ms to show "Working on it..." before returning to listening */
const PROCESSING_RECOVERY_MS = 2_000

/** ms delay before auto-restarting recognition after onend */
const RESTART_DELAY_MS = 300

// ── Public API ────────────────────────────────────────────────────────────────

export interface UseDonnaWakeWordReturn {
  wakeState: WakeWordState
  isSupported: boolean
  permissionError: string | null
  startListening: () => void
  stopListening: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDonnaWakeWord(): UseDonnaWakeWordReturn {
  const [wakeState, setWakeStateInternal] = useState<WakeWordState>('dormant')
  const [isSupported, setIsSupported] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Refs so event handlers always read current values (avoids stale closures)
  const wakeStateRef = useRef<WakeWordState>('dormant')
  const isEnabledRef = useRef(false)   // whether the user has enabled wake mode
  const recognitionRef = useRef<WakeSpeechRecognitionInstance | null>(null)
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setWakeState(s: WakeWordState) {
    wakeStateRef.current = s
    setWakeStateInternal(s)
  }

  // Check support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null)
  }, [])

  // ── Timeout helpers ──────────────────────────────────────────────────────────

  function clearActivityTimeout() {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
      activityTimeoutRef.current = null
    }
  }

  function clearRecoveryTimeout() {
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
  }

  function scheduleActivityTimeout() {
    clearActivityTimeout()
    activityTimeoutRef.current = setTimeout(() => {
      if (!isEnabledRef.current) return
      setWakeState('timedOut')
      clearRecoveryTimeout()
      recoveryTimeoutRef.current = setTimeout(() => {
        if (!isEnabledRef.current) return
        setWakeState('listening')
        scheduleActivityTimeout()
      }, TIMEOUT_RECOVERY_MS)
    }, ACTIVE_TIMEOUT_MS)
  }

  // ── Dispatch donna:open ────────────────────────────────────────────────────
  // Fires the existing donna:open custom event to open the DONNA panel.
  // When autoSubmit=true, DonnaAssistantButton will also call handleCommandSubmit.

  function dispatchDonnaOpen(prompt?: string) {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('donna:open', {
        detail: prompt ? { prompt, autoSubmit: true } : {},
      }),
    )
  }

  // ── Recognition lifecycle ─────────────────────────────────────────────────

  function startRecognition() {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor) return

    // Abort any existing session cleanly before creating a new one
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = new Constructor()
    rec.continuous = true
    rec.interimResults = false   // final results only — reduces false wake triggers
    rec.lang = 'en-US'

    rec.onresult = (e: WakeSpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result.isFinal) continue
        const transcript = (result[0]?.transcript ?? '').trim()
        if (!transcript) continue

        const current = wakeStateRef.current

        // ── Listening state: watch for wake phrase ────────────────────────
        if (current === 'listening' || current === 'timedOut') {
          if (!detectWakePhrase(transcript)) continue
          clearActivityTimeout()
          clearRecoveryTimeout()
          const cmd = extractCommandAfterWake(transcript)
          if (cmd) {
            // Full sentence — "Hey Donna, review Jamie"
            setWakeState('processing')
            dispatchDonnaOpen(cmd)
            setTimeout(() => {
              if (!isEnabledRef.current) return
              setWakeState('listening')
              scheduleActivityTimeout()
            }, PROCESSING_RECOVERY_MS)
          } else {
            // Bare wake phrase — "Hey Donna"
            setWakeState('wakeDetected')
            dispatchDonnaOpen()
            setTimeout(() => {
              if (!isEnabledRef.current) return
              if (wakeStateRef.current === 'wakeDetected') {
                setWakeState('active')
                scheduleActivityTimeout()
              }
            }, 600)
          }
        }

        // ── Active state: any non-wake utterance is the command ───────────
        else if (current === 'active') {
          // Another wake phrase while already active — stay active, reset timeout
          if (detectWakePhrase(transcript)) {
            clearActivityTimeout()
            scheduleActivityTimeout()
            continue
          }
          const cmd = transcript
          setWakeState('processing')
          clearActivityTimeout()
          dispatchDonnaOpen(cmd)
          setTimeout(() => {
            if (!isEnabledRef.current) return
            setWakeState('listening')
            scheduleActivityTimeout()
          }, PROCESSING_RECOVERY_MS)
        }
      }
    }

    rec.onerror = (e: { error: string }) => {
      const fatal = ['not-allowed', 'permission-denied', 'service-not-allowed']
      if (fatal.includes(e.error)) {
        setPermissionError(
          'Microphone access denied. Enable mic permissions in your browser settings to use Hey Donna.',
        )
        setWakeState('dormant')
        isEnabledRef.current = false
        clearActivityTimeout()
        clearRecoveryTimeout()
        recognitionRef.current = null
        return
      }
      // 'no-speech', 'aborted', 'network' — non-fatal, auto-restart via onend
    }

    rec.onend = () => {
      recognitionRef.current = null
      if (!isEnabledRef.current) return
      // Auto-restart to maintain persistent listening
      setTimeout(() => {
        if (!isEnabledRef.current) return
        startRecognition()
      }, RESTART_DELAY_MS)
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      // SpeechRecognition may throw if mic is already in use by another instance
      recognitionRef.current = null
    }
  }

  // ── Public controls ────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!getSpeechRecognitionConstructor()) return
    setPermissionError(null)
    isEnabledRef.current = true
    setWakeState('listening')
    startRecognition()
    scheduleActivityTimeout()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = useCallback(() => {
    isEnabledRef.current = false
    clearActivityTimeout()
    clearRecoveryTimeout()
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setWakeState('dormant')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isEnabledRef.current = false
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
      if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [])

  return { wakeState, isSupported, permissionError, startListening, stopListening }
}

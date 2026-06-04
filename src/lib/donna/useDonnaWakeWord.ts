'use client'

// Sprint 1791–1800 — DONNA Persistent Conversation Mode V1
// Extends Wake Word V1 with a persistent session state machine.
//
// After "Hey Donna" wakes DONNA, the session stays ACTIVE indefinitely.
// Every subsequent utterance is routed as a command — no repeated wake phrase.
// Session ends only via: stop phrase, stop button, or component unmount.
//
// State machine:
//   dormant → [user enables] → listening → [wake phrase] → wakeDetected → active
//   active  → [command]      → processing → active  (persistent loop)
//   active  → [stop phrase]  → stopped   → dormant  (auto after 2 s)
//   active  → [pause button] → paused    → [resume] → active
//   active  → [stop button]  → dormant
//
// No DB calls. No mutations. Browser SpeechRecognition only.
// Chrome/Edge supported. Firefox/Safari: isSupported = false.

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  detectWakePhrase,
  extractCommandAfterWake,
} from '@/components/assistant/donnaVoiceRuntime'

// ── State machine ─────────────────────────────────────────────────────────────

export type WakeWordState =
  | 'dormant'       // not listening — user has not enabled wake mode
  | 'listening'     // mic active, waiting for "Hey Donna"
  | 'wakeDetected'  // wake phrase heard — brief "I'm here." moment
  | 'active'        // persistent session: listening for commands (no wake phrase needed)
  | 'processing'    // command received, dispatched to DONNA pipeline
  | 'timedOut'      // inactivity timeout fired — returns to listening (pre-session only)
  | 'paused'        // director paused session; mic off until resumed
  | 'stopped'       // stop phrase/button fired; brief message, then → dormant

// ── Stop phrases ──────────────────────────────────────────────────────────────

const STOP_PHRASES: readonly string[] = [
  'stop listening',
  'donna stop',
  'stop donna',
  "that's all",
  'thats all',
  'go to sleep',
  'goodbye donna',
  'bye donna',
]

function isStopPhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim()
  return STOP_PHRASES.some(p => lower.includes(p))
}

// ── SpeechRecognition type shim ───────────────────────────────────────────────

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

/** ms of inactivity in pre-session listening before showing timedOut */
const PRE_SESSION_TIMEOUT_MS = 60_000

/** ms to show "timedOut" before auto-resuming listening (pre-session only) */
const TIMEOUT_RECOVERY_MS = 4_000

/** ms to show "Working on it…" before returning to active */
const PROCESSING_RECOVERY_MS = 2_000

/** ms delay before auto-restarting recognition after onend */
const RESTART_DELAY_MS = 300

/** ms to show "stopped" state before transitioning to dormant */
const STOPPED_DISPLAY_MS = 2_000

// ── Public API ────────────────────────────────────────────────────────────────

export interface UseDonnaWakeWordReturn {
  wakeState: WakeWordState
  isSupported: boolean
  isSessionActive: boolean
  permissionError: string | null
  startListening: () => void
  stopListening: () => void
  pauseSession: () => void
  resumeSession: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDonnaWakeWord(): UseDonnaWakeWordReturn {
  const [wakeState, setWakeStateInternal] = useState<WakeWordState>('dormant')
  const [isSupported, setIsSupported] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Refs so event handlers always read current values (avoids stale closures)
  const wakeStateRef = useRef<WakeWordState>('dormant')
  const isEnabledRef = useRef(false)      // user has enabled wake mode
  const isSessionActiveRef = useRef(false) // persistent session started (wake phrase heard)
  const recognitionRef = useRef<WakeSpeechRecognitionInstance | null>(null)
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stoppedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setWakeState(s: WakeWordState) {
    wakeStateRef.current = s
    setWakeStateInternal(s)
  }

  // Check support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null)
  }, [])

  // ── Timeout helpers (pre-session inactivity only) ─────────────────────────

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

  function clearStoppedTimer() {
    if (stoppedTimerRef.current) {
      clearTimeout(stoppedTimerRef.current)
      stoppedTimerRef.current = null
    }
  }

  // Only arms pre-session inactivity timer (not used during persistent session)
  function schedulePreSessionTimeout() {
    if (isSessionActiveRef.current) return
    clearActivityTimeout()
    activityTimeoutRef.current = setTimeout(() => {
      if (!isEnabledRef.current || isSessionActiveRef.current) return
      setWakeState('timedOut')
      clearRecoveryTimeout()
      recoveryTimeoutRef.current = setTimeout(() => {
        if (!isEnabledRef.current || isSessionActiveRef.current) return
        setWakeState('listening')
        schedulePreSessionTimeout()
      }, TIMEOUT_RECOVERY_MS)
    }, PRE_SESSION_TIMEOUT_MS)
  }

  // ── Dispatch donna:open ───────────────────────────────────────────────────
  // Fires the existing donna:open custom event to open the DONNA panel.

  function dispatchDonnaOpen(prompt?: string) {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('donna:open', {
        detail: prompt ? { prompt, autoSubmit: true } : {},
      }),
    )
  }

  // ── Stop session ─────────────────────────────────────────────────────────

  function stopSession() {
    isSessionActiveRef.current = false
    clearActivityTimeout()
    clearRecoveryTimeout()
    clearStoppedTimer()
    // Abort recognition; onend will NOT restart because isEnabled or isSession is false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setWakeState('stopped')
    stoppedTimerRef.current = setTimeout(() => {
      if (!isEnabledRef.current) {
        setWakeState('dormant')
        return
      }
      // If listening mode is still enabled, go back to pre-session listening
      setWakeState('listening')
      startRecognition()
      schedulePreSessionTimeout()
    }, STOPPED_DISPLAY_MS)
  }

  // ── Recognition lifecycle ─────────────────────────────────────────────────

  function startRecognition() {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor) return

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const rec = new Constructor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (e: WakeSpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result.isFinal) continue
        const transcript = (result[0]?.transcript ?? '').trim()
        if (!transcript) continue

        const current = wakeStateRef.current

        // ── Pre-session listening: watch for wake phrase ───────────────────
        if (current === 'listening' || current === 'timedOut') {
          if (!detectWakePhrase(transcript)) continue
          clearActivityTimeout()
          clearRecoveryTimeout()
          isSessionActiveRef.current = true

          const cmd = extractCommandAfterWake(transcript)
          if (cmd) {
            // Full sentence — "Hey Donna, review Jamie"
            setWakeState('processing')
            dispatchDonnaOpen(cmd)
            setTimeout(() => {
              if (!isEnabledRef.current || !isSessionActiveRef.current) return
              // Persistent: return to active (not listening)
              setWakeState('active')
            }, PROCESSING_RECOVERY_MS)
          } else {
            // Bare wake phrase — "Hey Donna"
            setWakeState('wakeDetected')
            dispatchDonnaOpen()
            setTimeout(() => {
              if (!isEnabledRef.current || !isSessionActiveRef.current) return
              if (wakeStateRef.current === 'wakeDetected') {
                setWakeState('active')
              }
            }, 600)
          }
        }

        // ── Active session: any utterance is a command ────────────────────
        else if (current === 'active') {
          // Check for stop phrase first
          if (isStopPhrase(transcript)) {
            stopSession()
            break
          }

          // Another wake phrase while already active — stay active
          if (detectWakePhrase(transcript)) {
            const cmd = extractCommandAfterWake(transcript)
            if (cmd) {
              setWakeState('processing')
              dispatchDonnaOpen(cmd)
              setTimeout(() => {
                if (!isEnabledRef.current || !isSessionActiveRef.current) return
                setWakeState('active')
              }, PROCESSING_RECOVERY_MS)
            }
            // Bare "Hey Donna" while already active — just stay active
            continue
          }

          // Normal command — route and return to active
          setWakeState('processing')
          dispatchDonnaOpen(transcript)
          setTimeout(() => {
            if (!isEnabledRef.current || !isSessionActiveRef.current) return
            setWakeState('active')
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
        isSessionActiveRef.current = false
        clearActivityTimeout()
        clearRecoveryTimeout()
        clearStoppedTimer()
        recognitionRef.current = null
        return
      }
      // 'no-speech', 'aborted', 'network' — non-fatal, auto-restart via onend
    }

    rec.onend = () => {
      recognitionRef.current = null
      if (!isEnabledRef.current) return
      // Do not restart if paused or stopped
      const cur = wakeStateRef.current
      if (cur === 'paused' || cur === 'stopped' || cur === 'dormant') return
      // Auto-restart to maintain persistent listening
      setTimeout(() => {
        if (!isEnabledRef.current) return
        const state = wakeStateRef.current
        if (state === 'paused' || state === 'stopped' || state === 'dormant') return
        startRecognition()
      }, RESTART_DELAY_MS)
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      recognitionRef.current = null
    }
  }

  // ── Public controls ───────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!getSpeechRecognitionConstructor()) return
    setPermissionError(null)
    isEnabledRef.current = true
    isSessionActiveRef.current = false
    setWakeState('listening')
    startRecognition()
    schedulePreSessionTimeout()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = useCallback(() => {
    isEnabledRef.current = false
    isSessionActiveRef.current = false
    clearActivityTimeout()
    clearRecoveryTimeout()
    clearStoppedTimer()
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setWakeState('dormant')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pauseSession = useCallback(() => {
    if (wakeStateRef.current !== 'active') return
    clearActivityTimeout()
    clearRecoveryTimeout()
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setWakeState('paused')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resumeSession = useCallback(() => {
    if (wakeStateRef.current !== 'paused') return
    setWakeState('active')
    startRecognition()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isEnabledRef.current = false
      isSessionActiveRef.current = false
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
      if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current)
      if (stoppedTimerRef.current) clearTimeout(stoppedTimerRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [])

  return {
    wakeState,
    isSupported,
    isSessionActive: isSessionActiveRef.current,
    permissionError,
    startListening,
    stopListening,
    pauseSession,
    resumeSession,
  }
}

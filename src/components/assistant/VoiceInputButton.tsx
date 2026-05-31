'use client'

// Sprint 641 — DONNA Persistent Voice Session V1
// Added `persistent` prop: when true, recognition auto-restarts on silence so the
// session stays active until the director explicitly stops it.
// Sprint 642 — Speech Recognition Auto-Restart V1
// Added `maxRetries` guard: after consecutive restart failures, session stops and
// shows a safe fallback rather than looping forever.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Square, WifiOff } from 'lucide-react'

// Browser SpeechRecognition — no TypeScript DOM lib definition in strict mode.
// We access via window to avoid declaring globals.
type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionResultList = {
  length: number
  item: (index: number) => SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

type SpeechRecognitionResult = {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

type SpeechRecognitionAlternative = {
  transcript: string
}

type SpeechRecognitionErrorEvent = {
  error: string
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  if (typeof w['SpeechRecognition'] === 'function') return w['SpeechRecognition'] as new () => SpeechRecognitionInstance
  if (typeof w['webkitSpeechRecognition'] === 'function') return w['webkitSpeechRecognition'] as new () => SpeechRecognitionInstance
  return null
}

// ─────────────────────────────────────────────────────────────

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  label?: string
  appendMode?: boolean
  /** Called whenever the listening state changes. */
  onListeningChange?: (isListening: boolean) => void
  /** Called with partial (non-final) transcripts while listening. */
  onInterimTranscript?: (text: string) => void
  /** Called when recognition encounters an error (e.g. 'not-allowed'). */
  onError?: (error: string) => void
  /** Called once on mount with whether SpeechRecognition is supported. */
  onSupportedChange?: (supported: boolean) => void
  /**
   * Sprint 685 — Full voice state callback.
   * Fires whenever the internal VoiceState changes so callers can drive a richer status indicator.
   */
  onVoiceStateChange?: (state: VoiceState) => void
  /**
   * Sprint 641 — Persistent session mode.
   * When true, the session stays active after each utterance and auto-restarts
   * recognition on silence. User must click Stop to end the session.
   * Default: false (single-shot mode).
   */
  persistent?: boolean
  /**
   * Sprint 642 — Max restart retries before giving up.
   * Only applies when persistent=true.
   * Default: 3
   */
  maxRetries?: number
  /**
   * Sprint 719 — Pause recognition while DONNA is speaking (TTS).
   * When true: aborts active recognition but keeps session alive.
   * When false: restarts recognition after 600ms so user can speak next turn.
   * Only applies when persistent=true and a session is active.
   */
  shouldPause?: boolean
  /**
   * Sprint 1052 — Auto-start session when this prop becomes true.
   * Used to start the voice session automatically when the DONNA panel opens.
   * Only fires when persistent=true, voice is supported, and the session is idle.
   * Falls back gracefully if microphone permission is not granted.
   */
  autoStart?: boolean
}

// Sprint 641: four states for persistent mode
// Sprint 685: exported so callers can display a richer status indicator
export type VoiceState = 'idle' | 'listening' | 'paused' | 'stopped' | 'unsupported'

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  label,
  appendMode = true,
  onListeningChange,
  onInterimTranscript,
  onError,
  onSupportedChange,
  onVoiceStateChange,
  persistent = false,
  maxRetries = 3,
  shouldPause = false,
  autoStart = false,
}: VoiceInputButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [supported, setSupported] = useState<boolean | null>(null)
  const [retryExhausted, setRetryExhausted] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  // Session active ref — set to false when director explicitly stops
  const sessionActiveRef = useRef(false)
  // Sprint 642: consecutive restart counter
  const retryCountRef = useRef(0)

  useEffect(() => {
    const result = getSpeechRecognitionConstructor() !== null
    setSupported(result)
    onSupportedChange?.(result)
  }, []) // onSupportedChange called once on mount

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false
    retryCountRef.current = 0
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceState('idle')
    onVoiceStateChange?.('idle')
    setRetryExhausted(false)
    onListeningChange?.(false)
  }, [onListeningChange, onVoiceStateChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const startRecognition = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor) return

    const recognition = new Constructor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const result = event.results[0]
      if (!result || !result[0]) return
      const transcript = result[0].transcript.trim()
      if (!transcript) return
      if (result.isFinal) {
        // Successful capture — reset retry counter
        retryCountRef.current = 0
        onTranscript(transcript)
      } else {
        onInterimTranscript?.(transcript)
      }
    }

    recognition.onerror = (event) => {
      // 'no-speech' is not a real error in persistent mode — just silence; let onend handle it
      if (event.error !== 'no-speech') {
        onError?.(event.error)
      }
      recognitionRef.current = null
    }

    recognition.onend = () => {
      recognitionRef.current = null

      if (persistent && sessionActiveRef.current) {
        // Sprint 642: guard against infinite restart loops
        retryCountRef.current += 1
        if (retryCountRef.current >= maxRetries) {
          sessionActiveRef.current = false
          setVoiceState('stopped')
          onVoiceStateChange?.('stopped')
          setRetryExhausted(true)
          onListeningChange?.(false)
          return
        }
        // Paused state — briefly between utterances
        setVoiceState('paused')
        onVoiceStateChange?.('paused')
        // Restart after short pause (300ms)
        setTimeout(() => {
          if (sessionActiveRef.current) {
            startRecognition()
          }
        }, 300)
      } else {
        setVoiceState('idle')
        onVoiceStateChange?.('idle')
        onListeningChange?.(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState('listening')
    onVoiceStateChange?.('listening')
    onListeningChange?.(true)
  }, [persistent, maxRetries, onTranscript, onInterimTranscript, onError, onListeningChange, onVoiceStateChange])

  // Sprint 719 — pause mic while DONNA speaks; resume after she finishes
  useEffect(() => {
    if (!persistent || !sessionActiveRef.current) return
    if (shouldPause) {
      // Abort active recognition; session remains alive for auto-resume
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
      setVoiceState('paused')
      onVoiceStateChange?.('paused')
    } else {
      // DONNA finished speaking — restart after 600ms buffer
      const tid = setTimeout(() => {
        if (sessionActiveRef.current && !recognitionRef.current) {
          startRecognition()
        }
      }, 600)
      return () => clearTimeout(tid)
    }
  }, [shouldPause, persistent, startRecognition, onVoiceStateChange])

  // Sprint 1052 — Auto-start voice session when the DONNA panel opens.
  // Fires when autoStart changes to true AND voice is supported AND session is idle.
  // Falls back gracefully: if browser blocks mic, onerror fires → voicePermissionError shown.
  useEffect(() => {
    if (!autoStart || !persistent || supported !== true) return
    if (voiceState !== 'idle' || sessionActiveRef.current) return
    sessionActiveRef.current = true
    retryCountRef.current = 0
    setRetryExhausted(false)
    startRecognition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, supported])

  function handleToggle() {
    if (voiceState === 'listening' || voiceState === 'paused') {
      stopSession()
    } else {
      // Start new session
      sessionActiveRef.current = persistent
      retryCountRef.current = 0
      setRetryExhausted(false)
      startRecognition()
    }
  }

  // Still detecting support
  if (supported === null) return null

  // Unsupported browser — show calm inline note, not a button
  if (!supported) {
    return (
      <p className="text-[10px] text-text-muted leading-snug flex items-center gap-1.5">
        <MicOff className="w-3 h-3 shrink-0 opacity-40" />
        Voice is unavailable in this browser. You can type instead.
      </p>
    )
  }

  const isActive = voiceState === 'listening' || voiceState === 'paused'
  const isListening = voiceState === 'listening'
  const isPaused = voiceState === 'paused'

  function getButtonLabel(): string {
    if (label) return label
    if (isListening) return persistent ? 'Listening… (tap to stop)' : 'Listening…'
    if (isPaused) return 'Paused — listening for next phrase'
    if (retryExhausted) return 'Voice stopped — tap to restart'
    return 'Speak'
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={isActive ? 'Stop voice session' : 'Start voice input'}
        className={`flex items-center gap-1.5 text-xs px-3 py-2 min-h-[44px] rounded-xl border transition-colors disabled:opacity-40 ${
          isListening
            ? 'border-status-red/40 bg-status-red/10 text-status-red animate-pulse'
            : isPaused
            ? 'border-status-orange/40 bg-status-orange/10 text-status-orange'
            : retryExhausted
            ? 'border-border bg-surface-raised text-text-muted'
            : 'border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary'
        }`}
      >
        {isActive ? (
          <>
            <Square className="w-3 h-3 fill-current" />
            {getButtonLabel()}
          </>
        ) : retryExhausted ? (
          <>
            <WifiOff className="w-3 h-3" />
            {getButtonLabel()}
          </>
        ) : (
          <>
            <Mic className="w-3 h-3" />
            {getButtonLabel()}
          </>
        )}
      </button>

      {/* Sprint 642: retry exhausted notice */}
      {retryExhausted && (
        <p className="text-[9px] text-text-muted leading-snug">
          Voice stopped after repeated silence. Tap the button to start again, or type below.
        </p>
      )}

      {/* Status hints */}
      {!isActive && !retryExhausted && (
        <p className="text-[9px] text-text-muted">
          {persistent
            ? 'Session stays active. Tap Stop when done.'
            : appendMode
            ? 'You can speak your answer, then edit before saving.'
            : 'Voice input turns speech into text in your browser. Review before saving.'}
        </p>
      )}
      {isListening && (
        <p className="text-[9px] text-status-red/80">
          {persistent ? 'Listening… speak, pause, speak again. Tap Stop when done.' : 'Listening… tap Stop when done.'}
        </p>
      )}
      {isPaused && (
        <p className="text-[9px] text-status-orange/80">
          Session paused between phrases. Ready for next utterance.
        </p>
      )}
    </div>
  )
}

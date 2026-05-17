'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

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
}

type VoiceState = 'idle' | 'listening' | 'unsupported'

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  label,
  appendMode = true,
  onListeningChange,
  onInterimTranscript,
  onError,
  onSupportedChange,
}: VoiceInputButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [supported, setSupported] = useState<boolean | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const result = getSpeechRecognitionConstructor() !== null
    setSupported(result)
    onSupportedChange?.(result)
  }, []) // onSupportedChange called once on mount

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceState('idle')
    onListeningChange?.(false)
  }, [onListeningChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  function startListening() {
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
        onTranscript(transcript)
      } else {
        onInterimTranscript?.(transcript)
      }
    }

    recognition.onerror = (event) => {
      onError?.(event.error)
      stopListening()
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setVoiceState('idle')
      onListeningChange?.(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState('listening')
    onListeningChange?.(true)
  }

  function handleToggle() {
    if (voiceState === 'listening') {
      stopListening()
    } else {
      startListening()
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

  const isListening = voiceState === 'listening'
  const buttonLabel = label ?? (isListening ? 'Listening…' : 'Speak')

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={isListening ? 'Stop recording' : 'Speak your answer'}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-40 ${
          isListening
            ? 'border-status-red/40 bg-status-red/10 text-status-red animate-pulse'
            : 'border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary'
        }`}
      >
        {isListening ? (
          <>
            <Square className="w-3 h-3 fill-current" />
            {buttonLabel}
          </>
        ) : (
          <>
            <Mic className="w-3 h-3" />
            {buttonLabel}
          </>
        )}
      </button>
      {!isListening && (
        <p className="text-[9px] text-text-muted">
          {appendMode
            ? 'You can speak your answer, then edit before saving.'
            : 'Voice input turns speech into text in your browser. Review before saving.'}
        </p>
      )}
      {isListening && (
        <p className="text-[9px] text-status-red/80">
          Listening… tap Stop when done.
        </p>
      )}
    </div>
  )
}

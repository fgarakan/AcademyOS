'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Mic, MicOff, X } from 'lucide-react'

// Minimal local types for the browser Web Speech API.
// TypeScript's default lib does not include SpeechRecognition in all configurations.
interface SpeechRecognitionAlternative {
  readonly transcript: string
}
interface SpeechRecognitionResult {
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent {
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent {
  readonly error: string
}
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

function getSpeechRecognitionClass(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  const Ctor = (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as
    | (new () => SpeechRecognitionInstance)
    | undefined
  return Ctor ?? null
}

export interface VoiceTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  helperText?: string
  disabled?: boolean
  minRows?: number
}

export function VoiceTextInput({
  value,
  onChange,
  placeholder = 'Speak or type here…',
  label,
  helperText,
  disabled = false,
  minRows = 3,
}: VoiceTextInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  // Snapshot of value when listening starts — used so onresult sees the correct base text
  const baseTextRef = useRef<string>('')

  useEffect(() => {
    setIsSupported(getSpeechRecognitionClass() !== null)
  }, [])

  function startListening() {
    const Ctor = getSpeechRecognitionClass()
    if (!Ctor) return

    setMicError(null)
    baseTextRef.current = value

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      const trimmed = transcript.trim()
      const base = baseTextRef.current.trimEnd()
      onChange(base ? `${base} ${trimmed}` : trimmed)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone access was denied. Allow microphone access in your browser settings, or type instead.')
      } else if (event.error !== 'no-speech') {
        setMicError('Voice capture stopped. You can try again or type instead.')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setMicError('Could not start voice capture. You can type instead.')
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  function clearText() {
    onChange('')
    setMicError(null)
  }

  const inputDisabled = disabled || isListening

  return (
    <div className="space-y-2">
      {label && <label className="label-xs">{label}</label>}

      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={inputDisabled}
          rows={minRows}
          maxLength={2000}
          placeholder={placeholder}
          className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2.5 pr-8 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-lime/20 focus:border-lime/40 disabled:opacity-60 transition-colors"
        />
        {value && !isListening && !disabled && (
          <button
            type="button"
            onClick={clearText}
            className="absolute top-2.5 right-2.5 text-text-muted hover:text-text-secondary transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {value.length > 1600 && (
        <p className="text-[10px] text-text-muted text-right">{value.length}/2000</p>
      )}

      {/* Voice controls — only render after hydration check */}
      {isSupported === null ? null : isSupported ? (
        <div className="flex items-center gap-3 flex-wrap">
          {isListening ? (
            <button
              type="button"
              onClick={stopListening}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime/10 border border-lime/40 text-xs text-lime"
            >
              <MicOff className="w-3.5 h-3.5" />
              Stop listening
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-border hover:border-lime/30 text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-3.5 h-3.5 text-lime" />
              Start speaking
            </button>
          )}

          <span className={`text-[11px] text-text-muted ${isListening ? 'animate-pulse' : ''}`}>
            {isListening ? 'Listening…' : 'Voice creates text. You approve actions.'}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Voice input is not available in this browser. You can still type.</span>
        </div>
      )}

      {micError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20 text-[11px] text-status-orange">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      {helperText && <p className="text-[11px] text-text-muted">{helperText}</p>}
    </div>
  )
}

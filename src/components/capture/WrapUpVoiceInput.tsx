'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Keyboard } from 'lucide-react'

// ── SpeechRecognition types ───────────────────────────────────────────────────
// Browser API — not in all TypeScript environments

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WrapUpVoiceInputProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  rows?: number
  label?: string
  hint?: string
  className?: string
}

export function WrapUpVoiceInput({
  value,
  onChange,
  placeholder = 'Tap the mic to dictate, or type here…',
  rows = 4,
  label,
  hint,
  className,
}: WrapUpVoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const SpeechRecognitionClass = getSpeechRecognition()
  const voiceSupported = SpeechRecognitionClass !== null

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  function startListening() {
    if (!SpeechRecognitionClass) return
    setVoiceError(null)
    setInterimText('')

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setInterimText(interim)
      if (final) {
        const separator = value.trim() ? ' ' : ''
        onChange(value + separator + final)
        setInterimText('')
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else if (e.error === 'no-speech') {
        setVoiceError('No speech detected. Try again.')
      } else {
        setVoiceError(`Voice input error: ${e.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }

  function toggleVoice() {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function switchToKeyboard() {
    stopListening()
    setInputMode('keyboard')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {/* Label */}
        {label && <p className="label-xs">{label}</p>}
        {hint && <p className="text-[11px] text-text-muted">{hint}</p>}

        {/* Main input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value + (interimText ? ' ' + interimText : '')}
            onChange={e => {
              // Only allow manual edits when not listening
              if (!isListening) {
                onChange(e.target.value)
              }
            }}
            placeholder={isListening ? 'Listening…' : placeholder}
            rows={rows}
            readOnly={isListening}
            className={`w-full bg-surface-raised border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none transition-colors leading-relaxed pr-12 ${
              isListening
                ? 'border-lime/40 bg-lime/5'
                : 'border-border focus:border-lime/40'
            }`}
          />

          {/* Interim text overlay hint */}
          {isListening && interimText && (
            <div className="absolute bottom-2 left-4 right-14 text-sm text-text-muted italic pointer-events-none truncate">
              {interimText}
            </div>
          )}

          {/* Mic/keyboard toggle button */}
          {voiceSupported && (
            <button
              onClick={inputMode === 'keyboard' ? () => setInputMode('voice') : toggleVoice}
              className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-lime text-black animate-pulse'
                  : 'border border-border text-text-muted hover:border-lime/40 hover:text-lime'
              }`}
              title={isListening ? 'Stop dictation' : 'Start dictation'}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
        </div>

        {/* Voice status / error row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isListening && (
              <span className="flex items-center gap-1.5 text-[11px] text-lime">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-ping" />
                Listening…
              </span>
            )}
            {voiceError && (
              <span className="text-[11px] text-status-orange">{voiceError}</span>
            )}
            {!voiceSupported && (
              <span className="text-[11px] text-text-muted">
                Voice not supported — use keyboard or device dictation.
              </span>
            )}
          </div>

          {voiceSupported && inputMode === 'voice' && !isListening && (
            <button
              onClick={switchToKeyboard}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <Keyboard size={11} />
              Type instead
            </button>
          )}

          {inputMode === 'keyboard' && voiceSupported && (
            <button
              onClick={() => setInputMode('voice')}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors"
            >
              <Mic size={11} />
              Use voice
            </button>
          )}
        </div>

        {/* Device dictation fallback note */}
        {!voiceSupported && (
          <p className="text-[10px] text-text-muted bg-surface-raised border border-border rounded-lg px-3 py-2">
            Your browser does not support voice recognition. Use your device's keyboard dictation (hold the mic key on iPhone/Android keyboard, or use keyboard dictation on desktop).
          </p>
        )}

        {/* Character count */}
        {value.length > 200 && (
          <p className="text-[10px] text-text-muted text-right">{value.length} chars</p>
        )}
      </div>
    </div>
  )
}

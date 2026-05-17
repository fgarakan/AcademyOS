'use client'

// Sprint 549 — Voice Dictation Capture V1
// Browser Web Speech API wrapper for voice dictation.
// Gracefully degrades when API is unavailable — text fallback always shown.
// No package installs. No external sends. No DB.

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceDictationStatus =
  | 'unavailable'   // browser does not support Web Speech API
  | 'idle'          // ready to start
  | 'listening'     // actively recording
  | 'processing'    // transcript arriving
  | 'done'          // got a final transcript
  | 'error'         // mic permission denied or other error

export type VoiceDictationError =
  | 'permission_denied'
  | 'no_speech'
  | 'aborted'
  | 'network'
  | 'unsupported'
  | 'unknown'

export interface VoiceDictationState {
  status: VoiceDictationStatus
  transcript: string
  interimTranscript: string
  error: VoiceDictationError | null
  isAvailable: boolean
}

export interface UseVoiceDictationReturn extends VoiceDictationState {
  start: () => void
  stop: () => void
  reset: () => void
}

// ── Web Speech API type shim ──────────────────────────────────────────────────
// The API is not in the standard TypeScript DOM lib — declare minimally.

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

// ── API availability check ────────────────────────────────────────────────────

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const INITIAL_STATE: VoiceDictationState = {
  status: 'idle',
  transcript: '',
  interimTranscript: '',
  error: null,
  isAvailable: false,
}

export function useVoiceDictation(): UseVoiceDictationReturn {
  const [state, setState] = useState<VoiceDictationState>(INITIAL_STATE)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isAvailableRef = useRef(false)

  // Detect availability on mount (client-only)
  useEffect(() => {
    const Constructor = getSpeechRecognitionConstructor()
    const available = Constructor !== null
    isAvailableRef.current = available
    setState(prev => ({
      ...prev,
      status: available ? 'idle' : 'unavailable',
      isAvailable: available,
    }))
  }, [])

  const start = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor) return

    // Abort any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new Constructor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        status: 'listening',
        transcript: '',
        interimTranscript: '',
        error: null,
      }))
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setState(prev => ({
        ...prev,
        status: final ? 'done' : 'processing',
        transcript: final || prev.transcript,
        interimTranscript: interim,
      }))
    }

    recognition.onerror = (event: Event & { error: string }) => {
      const errorMap: Record<string, VoiceDictationError> = {
        'not-allowed': 'permission_denied',
        'permission-denied': 'permission_denied',
        'no-speech': 'no_speech',
        aborted: 'aborted',
        network: 'network',
        'service-not-allowed': 'unsupported',
      }
      const errorKey = errorMap[event.error] ?? 'unknown'
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorKey,
        interimTranscript: '',
      }))
    }

    recognition.onend = () => {
      setState(prev => {
        if (prev.status === 'listening' || prev.status === 'processing') {
          return { ...prev, status: prev.transcript ? 'done' : 'idle', interimTranscript: '' }
        }
        return { ...prev, interimTranscript: '' }
      })
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setState(prev => ({
      ...INITIAL_STATE,
      status: prev.isAvailable ? 'idle' : 'unavailable',
      isAvailable: prev.isAvailable,
    }))
  }, [])

  return { ...state, start, stop, reset }
}

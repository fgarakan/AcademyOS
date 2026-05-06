'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Loader2, MicOff } from 'lucide-react'

const MAX_RECORDING_SECONDS = 60

interface AudioRecorderButtonProps {
  sessionId: string
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'unsupported'

function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false
  return typeof window.MediaRecorder !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

export function AudioRecorderButton({ sessionId, onTranscript, disabled = false }: AudioRecorderButtonProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [supported, setSupported] = useState<boolean | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setSupported(isMediaRecorderSupported())
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
      stopStream()
      mediaRecorderRef.current?.stop()
    }
  }, [stopTimer, stopStream])

  async function startRecording() {
    setErrorMsg(null)
    setElapsed(0)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMsg('Microphone access was denied. Allow mic access in your browser and try again.')
      return
    }
    streamRef.current = stream

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stopStream()
      stopTimer()
      const audioBlob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []

      if (audioBlob.size === 0) {
        setState('idle')
        setErrorMsg('No audio captured. Tap Record and speak before stopping.')
        return
      }

      setState('transcribing')
      const form = new FormData()
      form.append('audio', audioBlob, `recording.${mimeType === 'audio/webm' ? 'webm' : 'mp4'}`)

      try {
        const res = await fetch(`/api/coach/sessions/${sessionId}/transcribe`, {
          method: 'POST',
          body: form,
        })
        const data = await res.json() as { ok: boolean; transcript?: string; error?: string }

        if (data.ok && data.transcript) {
          onTranscript(data.transcript)
          setErrorMsg(null)
        } else {
          setErrorMsg(data.error ?? 'Transcription failed. Please type your answer.')
        }
      } catch {
        setErrorMsg('Could not reach transcription service. Please type your answer.')
      } finally {
        setState('idle')
      }
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setState('recording')

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= MAX_RECORDING_SECONDS) {
          mediaRecorderRef.current?.stop()
          mediaRecorderRef.current = null
        }
        return next
      })
    }, 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    stopTimer()
  }

  // Still detecting support
  if (supported === null) return null

  if (!supported) {
    return (
      <p className="text-[10px] text-text-muted leading-snug">
        <MicOff className="w-3 h-3 inline mr-1 opacity-50" />
        Audio recording is not supported in this browser.
      </p>
    )
  }

  const isRecording = state === 'recording'
  const isTranscribing = state === 'transcribing'
  const busy = isRecording || isTranscribing

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isTranscribing}
        title={isRecording ? 'Stop and transcribe' : 'Record audio answer'}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-40 ${
          isRecording
            ? 'border-status-red/40 bg-status-red/10 text-status-red animate-pulse'
            : isTranscribing
            ? 'border-border bg-surface-raised text-text-muted cursor-not-allowed'
            : 'border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary'
        }`}
      >
        {isTranscribing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Transcribing…
          </>
        ) : isRecording ? (
          <>
            <Square className="w-3 h-3 fill-current" />
            Stop · {formatTime(elapsed)}
          </>
        ) : (
          <>
            <Mic className="w-3 h-3" />
            Record
          </>
        )}
      </button>

      {!busy && (
        <p className="text-[9px] text-text-muted">
          Audio is used only to create a transcript and is not saved.
          Review and edit before saving.
        </p>
      )}
      {isRecording && (
        <p className="text-[9px] text-status-red/80">
          Recording… tap Stop when done. Max {MAX_RECORDING_SECONDS}s.
        </p>
      )}
      {isTranscribing && (
        <p className="text-[9px] text-text-muted">
          Transcribing… nothing is saved until you tap Save Wrap-Up.
        </p>
      )}

      {errorMsg && (
        <p className="text-[10px] text-status-orange leading-snug">{errorMsg}</p>
      )}
    </div>
  )
}

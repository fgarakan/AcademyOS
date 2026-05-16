'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// ── TTS helpers ───────────────────────────────────────────────────────────────

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

interface TTSOptions {
  text: string
  rate?: number
  pitch?: number
  volume?: number
}

function speakText({ text, rate = 0.95, pitch = 1.0, volume = 0.9 }: TTSOptions): SpeechSynthesisUtterance | null {
  if (!hasSpeechSynthesis()) return null
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
  return utterance
}

function stopSpeaking() {
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel()
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface DonnaWrapUpPromptProps {
  /** The question DONNA is asking */
  question: string
  /** Optional conversational lead-in */
  preamble?: string
  /** Whether to auto-speak when question changes (opt-in, default false) */
  autoSpeak?: boolean
  /** Whether voice output is globally enabled */
  voiceEnabled?: boolean
  onVoiceToggle?: (enabled: boolean) => void
  className?: string
}

export function DonnaWrapUpPrompt({
  question,
  preamble,
  autoSpeak = false,
  voiceEnabled = false,
  onVoiceToggle,
  className,
}: DonnaWrapUpPromptProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsSupported] = useState(() => hasSpeechSynthesis())
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Auto-speak when question changes (if enabled)
  useEffect(() => {
    if (autoSpeak && voiceEnabled && ttsSupported) {
      const fullText = preamble ? `${preamble}. ${question}` : question
      const utterance = speakText({ text: fullText })
      utteranceRef.current = utterance
      if (utterance) {
        setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
      }
    }
    return () => {
      stopSpeaking()
      setIsSpeaking(false)
    }
  }, [question, autoSpeak, voiceEnabled, ttsSupported, preamble])

  function handleSpeakNow() {
    if (!ttsSupported) return
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }
    const fullText = preamble ? `${preamble}. ${question}` : question
    const utterance = speakText({ text: fullText })
    utteranceRef.current = utterance
    if (utterance) {
      setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        {/* DONNA avatar */}
        <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
          isSpeaking
            ? 'bg-lime/20 border-lime shadow-[0_0_12px_rgba(200,255,0,0.3)] animate-pulse'
            : 'bg-lime/10 border-lime/30'
        }`}>
          <span className="text-lime text-xs font-bold">D</span>
        </div>

        {/* Prompt content */}
        <div className="flex-1 min-w-0">
          {/* Preamble */}
          {preamble && (
            <p className="text-[11px] text-text-muted italic mb-1">{preamble}</p>
          )}

          {/* Main question */}
          <p className="text-text-primary font-medium text-base leading-snug">{question}</p>

          {/* Voice controls */}
          <div className="flex items-center gap-3 mt-2">
            {ttsSupported && (
              <button
                onClick={handleSpeakNow}
                className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                  isSpeaking
                    ? 'text-lime'
                    : 'text-text-muted hover:text-lime'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Hear this question'}
              >
                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {isSpeaking ? 'Stop' : 'Read aloud'}
              </button>
            )}

            {onVoiceToggle && ttsSupported && (
              <button
                onClick={() => onVoiceToggle(!voiceEnabled)}
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {voiceEnabled ? 'Turn off voice' : 'Auto-read questions'}
              </button>
            )}

            {!ttsSupported && (
              <span className="text-[10px] text-text-muted italic">
                Voice not available on this browser.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DONNA preamble helper ─────────────────────────────────────────────────────
// Returns a natural conversational lead-in based on step and previous answers.

export function buildDonnaPreamble(
  step: 'attendance' | 'session_actual' | 'observations' | 'follow_up',
  prevAnswerCount: number,
): string | undefined {
  if (prevAnswerCount === 0) return undefined

  switch (step) {
    case 'session_actual':
      return 'Got it. Now let\'s talk about the session itself.'
    case 'observations':
      return 'Good. Now the players.'
    case 'follow_up':
      return prevAnswerCount > 0
        ? 'Almost done.'
        : undefined
    default:
      return undefined
  }
}

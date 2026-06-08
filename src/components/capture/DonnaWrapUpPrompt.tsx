'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
// Sprint 995 V2: routes through donnaPremiumVoiceRuntime (global speech lock).
// Direct window.speechSynthesis calls removed to prevent ghost second voices.
import { speakDonna as speakDonnaPremium, stopDonna } from '@/lib/donna/voice/donnaPremiumVoiceRuntime'

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

  // Auto-speak when question changes (if enabled)
  useEffect(() => {
    if (autoSpeak && voiceEnabled) {
      const fullText = preamble ? `${preamble}. ${question}` : question
      setIsSpeaking(true)
      void speakDonnaPremium(fullText, {
        caller: 'DonnaWrapUpPrompt',
        onStatus: (status) => {
          if (status === 'speaking') setIsSpeaking(true)
          else if (status === 'done' || status === 'error') setIsSpeaking(false)
        },
      })
    } else {
      stopDonna()
      setIsSpeaking(false)
    }
    return () => {
      stopDonna()
      setIsSpeaking(false)
    }
  }, [question, autoSpeak, voiceEnabled, preamble])

  function handleSpeakNow() {
    if (isSpeaking) {
      stopDonna()
      setIsSpeaking(false)
      return
    }
    const fullText = preamble ? `${preamble}. ${question}` : question
    setIsSpeaking(true)
    void speakDonnaPremium(fullText, {
      caller: 'DonnaWrapUpPrompt',
      onStatus: (status) => {
        if (status === 'speaking') setIsSpeaking(true)
        else if (status === 'done' || status === 'error') setIsSpeaking(false)
      },
    })
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

            {onVoiceToggle && (
              <button
                onClick={() => onVoiceToggle(!voiceEnabled)}
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {voiceEnabled ? 'Turn off voice' : 'Auto-read questions'}
              </button>
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

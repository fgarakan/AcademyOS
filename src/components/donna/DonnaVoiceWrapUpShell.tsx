'use client'

// Sprint 553 — Natural Coach Wrap-Up Voice Shell V1
// Orchestrates voice dictation, spoken prompt, and transcript review
// for the DONNA wrap-up conversation. Text fallback always available.

import { useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useVoiceDictation } from '@/lib/donna/useVoiceDictation'
import { useSpeechOutput } from '@/lib/donna/useSpeechOutput'
import { VoiceTranscriptReview } from './VoiceTranscriptReview'
import { VoiceErrorFallback, VoiceUnavailableNotice } from './VoiceErrorFallback'
import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaVoiceWrapUpShellProps {
  currentQuestion: string | null
  currentQuestionId: WrapUpQuestionId | null
  canSkip: boolean
  onTranscriptConfirmed: (text: string, questionId: WrapUpQuestionId | null) => void
  onSkip: (questionId: WrapUpQuestionId) => void
  onTextMode: () => void   // switch to text-only mode
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaVoiceWrapUpShell({
  currentQuestion,
  currentQuestionId,
  canSkip,
  onTranscriptConfirmed,
  onSkip,
  onTextMode,
}: DonnaVoiceWrapUpShellProps) {
  const dictation = useVoiceDictation()
  const speech = useSpeechOutput(true) // default muted — coach controls it

  // Speak the current question when it changes (if not muted)
  useEffect(() => {
    if (currentQuestion && !speech.isMuted && speech.isAvailable) {
      speech.speak(currentQuestion)
    }
  }, [currentQuestion, speech.isMuted, speech.isAvailable, speech.speak])

  // Stop speech on unmount
  useEffect(() => {
    return () => speech.stop()
  }, [speech.stop])

  const handleMicToggle = useCallback(() => {
    if (dictation.status === 'listening') {
      dictation.stop()
    } else if (dictation.status === 'idle') {
      dictation.start()
    }
  }, [dictation])

  const handleTranscriptConfirm = useCallback(
    (text: string) => {
      onTranscriptConfirmed(text, currentQuestionId)
      dictation.reset()
    },
    [currentQuestionId, onTranscriptConfirmed, dictation],
  )

  const handleDiscard = useCallback(() => {
    dictation.reset()
  }, [dictation])

  const handleErrorRetry = useCallback(() => {
    dictation.reset()
    setTimeout(() => dictation.start(), 100)
  }, [dictation])

  const handleErrorFallback = useCallback(() => {
    dictation.reset()
    onTextMode()
  }, [dictation, onTextMode])

  const isListening = dictation.status === 'listening'
  const isProcessing = dictation.status === 'processing'
  const hasDone = dictation.status === 'done'
  const hasError = dictation.status === 'error'
  const isUnavailable = dictation.status === 'unavailable'

  // Show transcript review when we have final content or are still listening
  const showTranscriptReview = isListening || isProcessing || hasDone

  return (
    <div className="flex flex-col gap-3">

      {/* ── Voice unavailable notice ── */}
      {isUnavailable && <VoiceUnavailableNotice />}

      {/* ── Error state ── */}
      {hasError && dictation.error && (
        <VoiceErrorFallback
          error={dictation.error}
          onRetry={handleErrorRetry}
          onUseFallback={handleErrorFallback}
        />
      )}

      {/* ── Transcript review (when listening or done) ── */}
      {showTranscriptReview && (
        <VoiceTranscriptReview
          transcript={dictation.transcript}
          interimTranscript={dictation.interimTranscript}
          isListening={isListening || isProcessing}
          onConfirm={handleTranscriptConfirm}
          onDiscard={handleDiscard}
        />
      )}

      {/* ── Voice controls (when not showing transcript review) ── */}
      {!showTranscriptReview && !hasError && (
        <div className="flex items-center gap-2">

          {/* Mic button */}
          {!isUnavailable && (
            <button
              onClick={handleMicToggle}
              className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-status-red/10 border-status-red/40 text-status-red'
                  : 'bg-surface border-border text-text-secondary hover:border-lime/40 hover:text-lime'
              }`}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-4.5 h-4.5 animate-pulse" />
              ) : (
                <Mic className="w-4.5 h-4.5" />
              )}
            </button>
          )}

          {/* Speech output toggle */}
          {speech.isAvailable && (
            <button
              onClick={speech.toggleMute}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-text-muted hover:text-text-secondary transition-colors"
              title={speech.isMuted ? 'Unmute DONNA' : 'Mute DONNA'}
            >
              {speech.isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Skip */}
          {canSkip && currentQuestionId && (
            <button
              onClick={() => onSkip(currentQuestionId)}
              className="ml-auto text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1.5"
            >
              Skip
            </button>
          )}

          {/* Switch to text mode */}
          <button
            onClick={onTextMode}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1.5"
          >
            Type instead
          </button>
        </div>
      )}
    </div>
  )
}

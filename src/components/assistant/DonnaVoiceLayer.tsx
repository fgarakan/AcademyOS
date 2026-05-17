'use client'

// Sprint 384 — DONNA Modularization
// Voice input card: VoiceInputButton, interim transcript display, editable voice answer,
// voice transcript display, primary typed text input, and suggestion chips.
//
// State lives in DonnaAssistantButton (orchestrator). All mutations go through callbacks.
// Voice handlers (handleVoiceTranscriptRaw, handleVoiceTranscript, handleConfirmVoiceAnswer,
// handleRetryVoice, etc.) remain in DonnaAssistantButton because they close over
// convState, onboardingStep, attendanceExceptionDraft, genericDraft, and many other setters.
//
// Future agent owner: Voice I/O team.

import { Mic } from 'lucide-react'
import { VoiceInputButton } from './VoiceInputButton'
import type { DonnaVoiceTranscriptState } from './donnaVoiceUiTypes'
import type { DonnaTaskQuestion } from './donnaTaskContracts'
import {
  DONNA_PUBLIC_NAME,
  DONNA_PUBLIC_NAME as DONNA_NAME,
} from './donnaAssistantCopy'
import {
  DONNA_ONBOARDING_STEPS,
  isOnboardingActive,
} from './donnaOnboardingFlow'
import type { ConversationState } from './donnaConversationController'
import type { TemplateDraft } from './templateDraftTypes'
import type { GenericTaskDraft } from './donnaGenericDraftTypes'

interface Props {
  // Onboarding
  onboardingStep: number | null
  // Guided task question spotlight
  guidedCurrentQ: DonnaTaskQuestion | null
  // Voice input events
  onVoiceTranscriptRaw: (text: string) => void
  onListeningChange: (listening: boolean) => void
  onInterimTranscript: (text: string) => void
  onVoiceError: (error: string) => void
  onSupportedChange: (supported: boolean) => void
  // Voice state
  isVoiceListening: boolean
  interimVoiceTranscript: string | null
  voicePermissionError: string | null
  onDismissVoiceError: () => void
  // Pending voice answer
  pendingVoiceAnswer: DonnaVoiceTranscriptState | null
  onPendingVoiceAnswerChange: (updated: DonnaVoiceTranscriptState) => void
  onConfirmVoiceAnswer: () => void
  onRetryVoice: () => void
  // Voice transcript
  voiceTranscript: string | null
  activeMode: string | null
  onClearVoiceTranscript: () => void
  // Text input
  typedText: string
  onTypedTextChange: (text: string) => void
  onCommandSubmit: (override?: string) => void
  // Chip visibility guards
  convState: ConversationState
  genericDraft: GenericTaskDraft | null
  templateDraft: TemplateDraft | null
}

export function DonnaVoiceLayer({
  onboardingStep,
  guidedCurrentQ,
  onVoiceTranscriptRaw,
  onListeningChange,
  onInterimTranscript,
  onVoiceError,
  onSupportedChange,
  isVoiceListening,
  interimVoiceTranscript,
  voicePermissionError,
  onDismissVoiceError,
  pendingVoiceAnswer,
  onPendingVoiceAnswerChange,
  onConfirmVoiceAnswer,
  onRetryVoice,
  voiceTranscript,
  activeMode,
  onClearVoiceTranscript,
  typedText,
  onTypedTextChange,
  onCommandSubmit,
  convState,
  genericDraft,
  templateDraft,
}: Props) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(139,92,246,0.2)' }}
    >
      {/* Voice input area */}
      <div
        className="px-4 py-3.5"
        style={{
          background: 'linear-gradient(135deg, rgba(109,40,217,0.09), rgba(67,56,202,0.05))',
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Mic className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
          <p className="text-sm font-semibold text-text-primary">Ask {DONNA_PUBLIC_NAME}</p>
        </div>
        <p className="text-[11px] text-text-muted leading-snug mb-3">
          Use voice to ask {DONNA_NAME} what to do next, answer the current question, or capture a director note.
        </p>

        {/* Onboarding current question spotlight */}
        {isOnboardingActive(onboardingStep) && onboardingStep === 1 && (
          <div
            className="mb-3 rounded-lg px-3 py-2"
            style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)' }}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
              Current question
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {DONNA_ONBOARDING_STEPS[1].question}
            </p>
            <p className="text-[10px] text-text-muted mt-1 leading-snug">
              {DONNA_ONBOARDING_STEPS[1].helperText}
            </p>
          </div>
        )}

        {/* Current question spotlight — guided_task mode only */}
        {guidedCurrentQ && !isOnboardingActive(onboardingStep) && (
          <div
            className="mb-3 rounded-lg px-3 py-2"
            style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)' }}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
              Current question
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {guidedCurrentQ.question}
            </p>
          </div>
        )}

        {/* VoiceInputButton — browser SpeechRecognition only, no API, no DB write */}
        <VoiceInputButton
          onTranscript={onVoiceTranscriptRaw}
          label={`Ask ${DONNA_PUBLIC_NAME}`}
          appendMode={false}
          onListeningChange={onListeningChange}
          onInterimTranscript={onInterimTranscript}
          onError={onVoiceError}
          onSupportedChange={onSupportedChange}
        />

        {/* Live interim transcript — shown while recognition is active */}
        {isVoiceListening && interimVoiceTranscript && (
          <div
            className="mt-2.5 rounded-lg px-3 py-2"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: '#8b5cf6' }}>
              {DONNA_PUBLIC_NAME} is listening…
            </p>
            <p className="text-[12px] text-text-muted leading-snug italic">
              {interimVoiceTranscript}
            </p>
          </div>
        )}

        {/* Voice permission / browser notice — calm, not alarming */}
        {voicePermissionError && (
          <div
            className="mt-2.5 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
            style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-[11px] text-text-muted leading-snug">{voicePermissionError}</p>
            <button
              type="button"
              onClick={onDismissVoiceError}
              aria-label="Dismiss voice notice"
              className="shrink-0 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Editable transcript — shown in guided_task mode after voice capture */}
        {pendingVoiceAnswer && (
          <div
            className="mt-3 rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(200,255,0,0.25)' }}
          >
            <div className="px-3 py-2" style={{ background: 'rgba(200,255,0,0.05)' }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5 text-lime">
                {DONNA_PUBLIC_NAME} heard — review before using
              </p>
              <textarea
                rows={2}
                value={pendingVoiceAnswer.editedText}
                onChange={e =>
                  onPendingVoiceAnswerChange({
                    ...pendingVoiceAnswer,
                    editedText: e.target.value,
                    isEdited: e.target.value !== pendingVoiceAnswer.raw,
                  })
                }
                className="w-full rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              />
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: 'var(--bg-surface)', borderTop: '1px solid rgba(200,255,0,0.1)' }}
            >
              <button
                type="button"
                onClick={onConfirmVoiceAnswer}
                disabled={!pendingVoiceAnswer.editedText.trim()}
                className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
              >
                Use this answer
              </button>
              <button
                type="button"
                onClick={onRetryVoice}
                className="text-[10px] text-text-muted hover:text-status-red underline underline-offset-2 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Voice transcript — suppressed when pending review is shown */}
        {voiceTranscript && !pendingVoiceAnswer && (
          <div
            className="mt-3 rounded-lg px-3 py-2.5"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(139,92,246,0.18)',
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-1"
              style={{ color: '#8b5cf6' }}
            >
              {DONNA_PUBLIC_NAME} heard
            </p>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              {voiceTranscript}
            </p>
            {activeMode !== 'create_template' && activeMode !== 'guided_task' && (
              <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                To save, use &quot;Capture a note&quot; below.
              </p>
            )}
            <button
              type="button"
              onClick={onClearVoiceTranscript}
              className="mt-1 text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Primary text input — always visible */}
        <div className="mt-3 space-y-2">
          <textarea
            rows={2}
            placeholder={`Ask ${DONNA_PUBLIC_NAME} what needs attention…`}
            value={typedText}
            onChange={e => onTypedTextChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onCommandSubmit()
              }
            }}
            data-donna-input
            className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onCommandSubmit()}
              disabled={!typedText.trim()}
              className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
            >
              Send
            </button>
            <p className="text-[10px] text-text-muted leading-snug">
              Nothing executes without your review.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion chips — shown only when no active workflow */}
      {!isOnboardingActive(onboardingStep) && convState.activeDraft === null && !genericDraft && !templateDraft && (
        <div
          className="px-4 py-3"
          style={{
            borderTop: '1px solid rgba(139,92,246,0.1)',
            background: 'var(--bg-surface)',
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
            Try asking
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'What needs attention today?',
              'Draft a parent update',
              'Create class template',
              'Help me with Academy Setup',
            ].map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => onCommandSubmit(chip)}
                className="text-[11px] px-2.5 py-1 rounded-full transition-all leading-snug"
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#c4b5fd',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

// Sprint 542 — DONNA Conversational Panel Shell V1
// Message history UI shell for the DONNA wrap-up conversation.
// Renders message thread, coach input, and skip controls.
// Question script wired in Sprint 543. Voice in Sprint 549.

import { useState, useRef, useEffect } from 'react'
import { Send, SkipForward } from 'lucide-react'
import type { ConversationMessage, ConversationState } from '@/lib/donna/conversationTypes'
import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaConversationalPanelProps {
  sessionId: string
  state: ConversationState
  messages: ConversationMessage[]
  currentQuestion: string | null
  currentQuestionId: WrapUpQuestionId | null
  canSkip: boolean
  onSubmit: (text: string, questionId: WrapUpQuestionId | null) => void
  onSkip: (questionId: WrapUpQuestionId) => void
  children?: React.ReactNode
}

// ── Message bubble ────────────────────────────────────────────────────────────

function DonnaBubble({ message }: { message: ConversationMessage }) {
  const isSystem = message.kind === 'system'
  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <p className="text-[10px] text-text-muted italic">{message.text}</p>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-lime text-[10px] font-bold">D</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="inline-block bg-surface border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
          <p className="text-sm text-text-primary leading-snug">{message.text}</p>
        </div>
        <p className="text-[9px] text-text-muted/60 mt-0.5 ml-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function CoachBubble({ message }: { message: ConversationMessage }) {
  const isSkipped = message.isSkipped === true
  return (
    <div className="flex items-start gap-2.5 justify-end">
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <div className={`inline-block rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] ${
          isSkipped
            ? 'bg-surface border border-border/50'
            : 'bg-lime/10 border border-lime/20'
        }`}>
          {isSkipped ? (
            <p className="text-xs text-text-muted italic">Skipped</p>
          ) : (
            <p className="text-sm text-text-primary leading-snug">{message.text}</p>
          )}
        </div>
        <p className="text-[9px] text-text-muted/60 mt-0.5 mr-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── State label ───────────────────────────────────────────────────────────────

function StateLabel({ state }: { state: ConversationState }) {
  const labels: Partial<Record<ConversationState, string>> = {
    listening: 'Listening…',
    clarifying: 'Needs clarification',
    summarizing: 'Review your summary',
    awaiting_review: 'Saving…',
    complete: 'Wrap-up submitted',
    error: 'Something went wrong',
  }
  const label = labels[state]
  if (!label) return null
  const isError = state === 'error'
  const isComplete = state === 'complete'
  return (
    <p className={`text-[10px] text-center py-1 ${
      isError ? 'text-status-red' : isComplete ? 'text-status-green' : 'text-text-muted'
    }`}>
      {label}
    </p>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function DonnaConversationalPanel({
  state,
  messages,
  currentQuestion,
  currentQuestionId,
  canSkip,
  onSubmit,
  onSkip,
  children,
}: DonnaConversationalPanelProps) {
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isInputDisabled =
    state === 'awaiting_review' ||
    state === 'complete' ||
    state === 'listening'

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSubmit() {
    const text = inputText.trim()
    if (!text || isInputDisabled) return
    onSubmit(text, currentQuestionId)
    setInputText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSkip() {
    if (currentQuestionId) {
      onSkip(currentQuestionId)
      setInputText('')
    }
  }

  return (
    <div className="flex flex-col rounded-2xl bg-surface-raised border border-border overflow-hidden">

      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[400px] min-h-[200px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <div className="w-9 h-9 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
              <span className="text-lime text-xs font-bold">D</span>
            </div>
            <p className="text-xs text-text-muted">Ready when you are.</p>
          </div>
        )}

        {messages.map(msg =>
          msg.role === 'donna' ? (
            <DonnaBubble key={msg.id} message={msg} />
          ) : (
            <CoachBubble key={msg.id} message={msg} />
          ),
        )}

        <StateLabel state={state} />

        {/* Slot for summary / confirmation UI (Sprint 546) */}
        {children}

        <div ref={bottomRef} />
      </div>

      {/* ── Active question indicator ── */}
      {currentQuestion && state !== 'complete' && state !== 'error' && (
        <div className="px-4 py-2 border-t border-border bg-surface">
          <p className="text-xs text-text-muted leading-snug">{currentQuestion}</p>
        </div>
      )}

      {/* ── Input area ── */}
      {state !== 'complete' && state !== 'error' && (
        <div className="px-3 py-3 border-t border-border bg-surface flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            placeholder={isInputDisabled ? '' : 'Type your answer…'}
            rows={1}
            className="flex-1 resize-none bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 disabled:opacity-40 min-h-[44px] max-h-[120px]"
          />

          {canSkip && currentQuestionId && !isInputDisabled && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-text-muted hover:text-text-secondary transition-colors min-h-[44px]"
              title="Skip this question"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isInputDisabled}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-lime text-base disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lime/90 transition-colors shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4 text-base" />
          </button>
        </div>
      )}

      {/* ── Error state ── */}
      {state === 'error' && (
        <div className="px-4 py-3 border-t border-border bg-surface text-center">
          <p className="text-xs text-status-red mb-2">Something went wrong saving your wrap-up.</p>
          <p className="text-xs text-text-muted">Use the retry button or try again later.</p>
        </div>
      )}
    </div>
  )
}

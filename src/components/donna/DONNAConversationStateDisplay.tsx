'use client'

// Sprint 621 — DONNA Conversation State Display V1
// Visual indicator of the DONNA conversation state machine.
// Shows current state and progress through the conversation.
// No DB. No execution.

import type { ConversationState } from '@/lib/donna/conversationTypes'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DONNAConversationStateDisplayProps {
  state: ConversationState
  questionNumber?: number
  totalQuestions?: number
  answeredCount?: number
  compact?: boolean
}

// ── State config ──────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<
  ConversationState,
  { label: string; dotClass: string; textClass: string; pulse: boolean }
> = {
  idle: {
    label: 'Ready',
    dotClass: 'bg-text-muted',
    textClass: 'text-text-muted',
    pulse: false,
  },
  typing: {
    label: 'Typing…',
    dotClass: 'bg-lime',
    textClass: 'text-lime',
    pulse: true,
  },
  listening: {
    label: 'Listening',
    dotClass: 'bg-lime',
    textClass: 'text-lime',
    pulse: true,
  },
  clarifying: {
    label: 'Clarifying',
    dotClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    pulse: false,
  },
  summarizing: {
    label: 'Summarizing',
    dotClass: 'bg-status-blue',
    textClass: 'text-status-blue',
    pulse: false,
  },
  awaiting_review: {
    label: 'Awaiting review',
    dotClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    pulse: false,
  },
  complete: {
    label: 'Complete',
    dotClass: 'bg-status-green',
    textClass: 'text-status-green',
    pulse: false,
  },
  error: {
    label: 'Error',
    dotClass: 'bg-status-red',
    textClass: 'text-status-red',
    pulse: false,
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAConversationStateDisplay({
  state,
  questionNumber,
  totalQuestions,
  answeredCount,
  compact = false,
}: DONNAConversationStateDisplayProps) {
  const cfg = STATE_CONFIG[state]
  const showProgress = questionNumber !== undefined && totalQuestions !== undefined
  const pct = totalQuestions && answeredCount !== undefined
    ? Math.round((answeredCount / totalQuestions) * 100)
    : null

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass} ${cfg.pulse ? 'animate-pulse' : ''}`} />
        <span className={`text-[10px] font-medium ${cfg.textClass}`}>{cfg.label}</span>
        {showProgress && (
          <span className="text-[10px] text-text-muted">
            {questionNumber}/{totalQuestions}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface border border-border">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${cfg.dotClass} ${cfg.pulse ? 'animate-pulse' : ''} shrink-0`} />
        <span className={`text-xs font-medium ${cfg.textClass}`}>{cfg.label}</span>
      </div>
      {showProgress && (
        <div className="flex items-center gap-2 ml-4">
          {pct !== null && (
            <div className="w-16 h-1 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-lime transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <span className="text-[10px] text-text-muted">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
      )}
    </div>
  )
}

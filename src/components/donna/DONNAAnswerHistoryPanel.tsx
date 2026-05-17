'use client'

// Sprint 622 — DONNA Answer History Panel V1
// Shows DONNA's recent answers within a session for context reference.
// Read-only — no DB writes.

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import type { ConversationMessage } from '@/lib/donna/conversationTypes'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNAAnswerHistoryPanelProps {
  messages: ConversationMessage[]
  maxVisibleDefault?: number
  className?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Message row ───────────────────────────────────────────────────────────────

function MessageRow({ message }: { message: ConversationMessage }) {
  const isCoach = message.role === 'coach'
  const isSkipped = message.isSkipped

  return (
    <div className={`flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0 ${
      isSkipped ? 'opacity-50' : ''
    }`}>
      {/* Role indicator */}
      <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold ${
        isCoach ? 'bg-lime/20 text-lime' : 'bg-surface-raised border border-border text-text-muted'
      }`}>
        {isCoach ? 'C' : 'D'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-text-muted">
            {isCoach ? 'Coach' : 'DONNA'}
          </span>
          {isSkipped && (
            <span className="text-[9px] text-text-muted italic">skipped</span>
          )}
          <span className="text-[9px] text-text-muted ml-auto">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p className={`text-[11px] leading-snug ${
          isCoach ? 'text-text-primary' : 'text-text-secondary'
        }`}>
          {message.text}
        </p>
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function DONNAAnswerHistoryPanel({
  messages,
  maxVisibleDefault = 6,
  className = '',
}: DONNAAnswerHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? messages : messages.slice(-maxVisibleDefault)
  const hasMore = messages.length > maxVisibleDefault
  const coachMessages = messages.filter(m => m.role === 'coach' && !m.isSkipped).length

  if (messages.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface px-4 py-5 text-center ${className}`}>
        <MessageSquare className="w-4 h-4 text-text-muted mx-auto mb-1.5" />
        <p className="text-xs text-text-muted">No messages yet.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Conversation</p>
        </div>
        <span className="text-[10px] text-text-muted">{coachMessages} answer{coachMessages !== 1 ? 's' : ''}</span>
      </div>

      {/* Messages */}
      <div className="px-4 py-1">
        {hasMore && !expanded && (
          <div className="py-2">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
              Show {messages.length - maxVisibleDefault} earlier messages
            </button>
          </div>
        )}
        {visible.map((msg, i) => (
          <MessageRow key={i} message={msg} />
        ))}
        {expanded && hasMore && (
          <div className="py-2">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

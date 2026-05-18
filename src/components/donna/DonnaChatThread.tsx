'use client'

// Sprint 1030 — DONNA Chat Thread UI V1
// Primary DONNA chat interface: conversation thread, message input, quick actions.
// Role-aware: director gets academy command actions, coach gets session execution actions.
// No direct DB writes — caller handles submit via onSend callback.

import { Bot, ChevronRight, Loader2, Mic, Send, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DonnaAssistantRole } from '@/components/donna/DonnaAssistantShell'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Message shape ─────────────────────────────────────────────────────────────

export type ChatMessageRole = 'user' | 'donna' | 'system'

export type ChatMessageKind =
  | 'text'
  | 'answer'          // DONNA answer with confidence + source
  | 'action_blocked'  // Role boundary explanation
  | 'quick_action'    // Chip-triggered action
  | 'thinking'        // Typing indicator placeholder

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  kind: ChatMessageKind
  text: string
  timestamp: string
  confidence?: 'high' | 'partial' | 'insufficient' | 'blocked'
  sourceNote?: string | null
  followUp?: string | null
  followUpHref?: string | null
  isStreaming?: boolean
}

// ── Quick action chip ─────────────────────────────────────────────────────────

export interface ChatQuickAction {
  id: string
  label: string
  icon?: React.ReactNode
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaChatThreadProps {
  role: DonnaAssistantRole
  messages: ChatMessage[]
  quickActions: ChatQuickAction[]
  isTyping?: boolean
  isListening?: boolean
  placeholder?: string
  onSend: (text: string) => void
  onQuickAction: (actionId: string) => void
  onVoiceToggle?: () => void
  className?: string
}

// ── Confidence dot ────────────────────────────────────────────────────────────

function ConfidenceDot({ confidence }: { confidence: ChatMessage['confidence'] }) {
  if (!confidence) return null
  const colors: Record<string, string> = {
    high: 'bg-status-green',
    partial: 'bg-status-orange',
    insufficient: 'bg-text-muted',
    blocked: 'bg-status-red',
  }
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${colors[confidence] ?? 'bg-text-muted'}`}
      title={`Confidence: ${confidence}`}
    />
  )
}

// ── Single message bubble ─────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isDonna = message.role === 'donna'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[11px] text-text-muted px-3">{message.text}</span>
      </div>
    )
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
        isDonna ? 'bg-lime/10 border border-lime/20' : 'bg-surface-raised border border-border'
      }`}>
        {isDonna
          ? <Bot className="w-3.5 h-3.5 text-lime" />
          : <User className="w-3.5 h-3.5 text-text-muted" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? 'bg-lime/10 border border-lime/20 rounded-tr-sm'
            : 'bg-surface-raised border border-border rounded-tl-sm'
        }`}>
          {message.kind === 'thinking' ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-text-muted animate-spin" />
              <span className="text-xs text-text-muted">Thinking...</span>
            </div>
          ) : (
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {message.text}
              {message.isStreaming && (
                <span className="inline-block w-1 h-3.5 bg-lime/60 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </p>
          )}
        </div>

        {/* Source note + confidence (DONNA messages only) */}
        {isDonna && (message.confidence || message.sourceNote) && (
          <div className="flex items-center gap-1.5 px-1">
            <ConfidenceDot confidence={message.confidence} />
            {message.sourceNote && (
              <span className="text-[10px] text-text-muted">{message.sourceNote}</span>
            )}
          </div>
        )}

        {/* Follow-up CTA */}
        {isDonna && message.followUp && (
          <a
            href={message.followUpHref ?? '#'}
            className="flex items-center gap-1 text-[11px] text-lime hover:text-lime/80 transition-colors px-1"
          >
            {message.followUp} <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaChatThread({
  role: _role,
  messages,
  quickActions,
  isTyping = false,
  isListening = false,
  placeholder = 'Ask DONNA anything...',
  onSend,
  onQuickAction,
  onVoiceToggle,
  className = '',
}: DonnaChatThreadProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Typing indicator message
  const typingMessage: ChatMessage = {
    id: '__typing__',
    role: 'donna',
    kind: 'thinking',
    text: '',
    timestamp: new Date().toISOString(),
  }

  const displayMessages = isTyping ? [...messages, typingMessage] : messages

  return (
    <div className={`flex flex-col h-full ${className}`}>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-10 h-10 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-lime" />
            </div>
            <p className="text-sm text-text-secondary">Ask me anything about your academy.</p>
            <p className="text-[11px] text-text-muted mt-1">I can read live data and help you act on it.</p>
          </div>
        )}
        {displayMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickActions.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction(action.id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-xs text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-1">
        <div className={`flex items-end gap-2 rounded-2xl border px-3.5 py-2.5 transition-colors ${
          isListening ? 'border-lime/50 bg-lime/5' : 'border-border bg-surface-raised'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : placeholder}
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none leading-relaxed min-h-[20px] max-h-[120px]"
            style={{ height: 'auto' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {onVoiceToggle && (
              <button
                type="button"
                onClick={onVoiceToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-lime bg-lime/10'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-1.5 rounded-lg text-text-muted hover:text-lime disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-text-muted text-center mt-1.5">
          DONNA reads live data · All actions go through director review
        </p>
      </div>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildChatMessageFromAnswer(
  answer: DonnaSafeReadAnswer,
): ChatMessage {
  return {
    id: `donna-${Date.now()}`,
    role: 'donna',
    kind: 'answer',
    text: answer.text,
    timestamp: new Date().toISOString(),
    confidence: answer.confidence,
    sourceNote: answer.sourceNote ?? undefined,
    followUp: answer.followUp ?? undefined,
    followUpHref: answer.href ?? undefined,
  }
}

export function buildUserChatMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    kind: 'text',
    text,
    timestamp: new Date().toISOString(),
  }
}

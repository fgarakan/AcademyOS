'use client'

// Sprint 1035 — DONNA Voice Ready Interaction Shell V1
// Wraps DonnaChatThread with voice input state management.
// Connects useVoiceDictation → text → chat send flow.
// Thin shell — voice logic lives in the hook, chat logic lives in DonnaChatThread.
// No DB writes. No mutations. Purely orchestration.

import { useEffect, useRef, useState } from 'react'
import type { DonnaAssistantRole } from '@/components/donna/DonnaAssistantShell'
import {
  DonnaChatThread,
  buildUserChatMessage,
  type ChatMessage,
  type ChatQuickAction,
} from '@/components/donna/DonnaChatThread'
import { useVoiceDictation } from '@/lib/donna/useVoiceDictation'
import {
  recordTurn,
  ensureChatSession,
} from '@/lib/donna/donnaChatSessionMemory'
import {
  checkQuestionBoundary,
  buildBoundaryMessage,
} from '@/lib/donna/donnaBoundaryResponses'
import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { CoachDonnaContext } from '@/lib/donna/coachDonnaContext'
import { getSuggestedQuestionsForRole } from '@/lib/donna/donnaSuggestedQuestions'
import { dispatchSafeReadAction, tryAnswerKpiQuestion, type DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildChatMessageFromAnswer } from '@/components/donna/DonnaChatThread'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaVoiceReadyShellProps {
  role: DonnaAssistantRole
  donnaRole: DonnaRole
  directorCtx: DirectorDonnaContext | null
  coachCtx: CoachDonnaContext | null
  className?: string
}

// ── Helper to map DonnaAssistantRole → DonnaRole ──────────────────────────────

function toPlainRole(role: DonnaAssistantRole): DonnaRole {
  return role === 'director' ? 'director' : 'coach'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaVoiceReadyShell({
  role,
  donnaRole,
  directorCtx,
  coachCtx,
  className = '',
}: DonnaVoiceReadyShellProps) {
  const plainRole = toPlainRole(role)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const voice = useVoiceDictation()
  const pendingVoiceRef = useRef<string | null>(null)

  // Initialize session
  useEffect(() => {
    ensureChatSession(donnaRole)
  }, [donnaRole])

  // Auto-send when voice transcript completes
  useEffect(() => {
    if (voice.status === 'idle' && voice.transcript.trim()) {
      if (pendingVoiceRef.current !== voice.transcript) {
        pendingVoiceRef.current = voice.transcript
        handleSend(voice.transcript)
        voice.reset()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.status, voice.transcript])

  // Build quick action chips from suggested questions
  const suggestedQuestions = getSuggestedQuestionsForRole(
    plainRole,
    directorCtx,
    coachCtx,
    4,
  )

  const quickActions: ChatQuickAction[] = suggestedQuestions.map(q => ({
    id: q.id,
    label: q.text,
  }))

  // ── Send handler ────────────────────────────────────────────────────────────

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = buildUserChatMessage(trimmed)
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Check boundaries first
    const boundary = checkQuestionBoundary(trimmed, plainRole)
    if (boundary) {
      const boundaryMsg = buildBoundaryMessage(boundary)
      setMessages(prev => [...prev, boundaryMsg])
      setIsTyping(false)
      recordTurn(trimmed, boundaryMsg.text, { confidence: boundary.confidenceKind })
      return
    }

    // KPI question intercept — answer KPI questions from available director context
    if (plainRole === 'director' && directorCtx) {
      const kpiAnswer = tryAnswerKpiQuestion(trimmed, directorCtx)
      if (kpiAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(kpiAnswer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: kpiAnswer.actionId,
            confidence: kpiAnswer.confidence,
            sourceNote: kpiAnswer.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Try safe read dispatch based on keywords
    const actionId = detectActionIdFromText(trimmed, plainRole)

    if (actionId) {
      const answer = dispatchSafeReadAction(actionId, plainRole, directorCtx, coachCtx)
      if (answer) {
        const donnaMsg = buildChatMessageFromAnswer(answer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId,
            confidence: answer.confidence,
            sourceNote: answer.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Fallback: honest "I don't know"
    const fallbackMsg: ChatMessage = {
      id: `donna-fallback-${Date.now()}`,
      role: 'donna',
      kind: 'text',
      text: "I'm not sure how to answer that yet. Try one of the suggested questions below, or ask about sessions, pending reviews, or player attention.",
      timestamp: new Date().toISOString(),
      confidence: 'insufficient',
    }

    setTimeout(() => {
      setMessages(prev => [...prev, fallbackMsg])
      setIsTyping(false)
      recordTurn(trimmed, fallbackMsg.text)
    }, 600)
  }

  // ── Quick action handler ────────────────────────────────────────────────────

  function handleQuickAction(actionId: string) {
    const question = suggestedQuestions.find(q => q.id === actionId)
    if (question) handleSend(question.text)
  }

  // ── Voice toggle ────────────────────────────────────────────────────────────

  function handleVoiceToggle() {
    if (voice.status === 'listening') {
      voice.stop()
    } else {
      voice.reset()
      pendingVoiceRef.current = null
      voice.start()
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Voice status indicator */}
      {voice.status === 'listening' && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-lime/10 border-b border-lime/20">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          <span className="text-xs text-lime">Listening...</span>
          {voice.interimTranscript && (
            <span className="text-xs text-lime/70 truncate max-w-[200px]">
              {voice.interimTranscript}
            </span>
          )}
        </div>
      )}

      {voice.error && (
        <div className="px-4 py-1.5 bg-status-red/5 border-b border-status-red/20">
          <span className="text-xs text-status-red">
            {voice.error === 'unsupported'
              ? 'Voice input not supported in this browser.'
              : 'Voice input error — try typing instead.'}
          </span>
        </div>
      )}

      {/* Chat thread */}
      <DonnaChatThread
        role={role}
        messages={messages}
        quickActions={quickActions}
        isTyping={isTyping}
        isListening={voice.status === 'listening'}
        onSend={handleSend}
        onQuickAction={handleQuickAction}
        onVoiceToggle={voice.isAvailable ? handleVoiceToggle : undefined}
        className="flex-1 min-h-0"
      />
    </div>
  )
}

// ── Action detection from natural language ─────────────────────────────────────

function detectActionIdFromText(text: string, role: DonnaRole): string | null {
  const t = text.toLowerCase()

  if (role === 'director') {
    if (/today|summary|happening|overview|brief/i.test(t)) return 'summarize_today'
    if (/pending|review|queue|waiting|attention/i.test(t)) return 'show_pending_reviews'
    if (/risk|danger|concern|flag|alert|problem/i.test(t)) return 'academy_risks'
  }

  if (role === 'coach') {
    if (/session|today|schedule|plan/i.test(t)) return 'start_session'
    if (/wrap.?up|submitted|complete|done/i.test(t)) return 'wrap_up'
  }

  return null
}

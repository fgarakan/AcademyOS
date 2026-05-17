'use client'

// Sprint 546 — DONNA Conversation Summary UI V1
// Review card showing what DONNA captured from the wrap-up conversation.
// Rendered as children of DonnaConversationalPanel when state === 'summarizing'.

import { CheckCircle2, Edit2, SkipForward } from 'lucide-react'
import type { WrapUpQuestionId } from '@/components/capture/WrapUpGuidedFlow'
import type { ConversationMessage } from '@/lib/donna/conversationTypes'
import { WRAP_UP_SCRIPT } from '@/lib/donna/wrapUpConversationScript'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaConversationSummaryProps {
  messages: ConversationMessage[]
  onConfirm: () => void
  onEdit: () => void
  isSubmitting?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCoachMessageForQuestion(
  messages: ConversationMessage[],
  questionId: WrapUpQuestionId,
): ConversationMessage | null {
  // Return last coach message for this question (answered or skipped)
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === 'coach' && m.kind === 'answer' && m.questionId === questionId) {
      return m
    }
  }
  return null
}

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  message,
}: {
  label: string
  message: ConversationMessage | null
}) {
  const isSkipped = message?.isSkipped === true
  const hasAnswer = message !== null && !isSkipped && message.text.trim().length > 0
  const noResponse = message === null

  return (
    <div className="flex gap-3 py-2.5 border-b border-lime/10 last:border-0">
      <div
        className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
          hasAnswer ? 'bg-lime' : isSkipped ? 'bg-border' : 'bg-status-orange/50'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="label-xs mb-0.5">{label}</p>
        {hasAnswer && (
          <p className="text-sm text-text-primary leading-snug">{message!.text}</p>
        )}
        {isSkipped && (
          <p className="flex items-center gap-1 text-xs text-text-muted italic">
            <SkipForward className="w-3 h-3 shrink-0" />
            Skipped
          </p>
        )}
        {noResponse && (
          <p className="text-xs text-text-muted/60 italic">No response recorded</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DonnaConversationSummary({
  messages,
  onConfirm,
  onEdit,
  isSubmitting = false,
}: DonnaConversationSummaryProps) {
  const QUESTION_LABELS: Record<WrapUpQuestionId, string> = {
    q1_attendance:      'Attendance',
    q2_session_actual:  'Session',
    q3_standouts:       'Standouts',
    q4_needs_attention: 'Needs attention',
    q5_follow_up:       'Follow-up',
  }

  const rows = WRAP_UP_SCRIPT.map(step => ({
    questionId: step.questionId,
    label: QUESTION_LABELS[step.questionId],
    message: getCoachMessageForQuestion(messages, step.questionId),
  }))

  const answeredCount = rows.filter(
    r => r.message !== null && !r.message.isSkipped && r.message.text.trim().length > 0,
  ).length

  return (
    <div className="mx-0.5 my-2 rounded-xl border border-lime/20 bg-lime/5 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-lime/10">
        <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
        <p className="text-xs font-semibold text-lime">Wrap-up summary</p>
        <span className="ml-auto text-[10px] text-text-muted tabular-nums">
          {answeredCount}/{rows.length} answered
        </span>
      </div>

      {/* ── Question rows ── */}
      <div className="px-3.5 py-0.5">
        {rows.map(row => (
          <SummaryRow
            key={row.questionId}
            label={row.label}
            message={row.message}
          />
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-lime/10">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors disabled:opacity-40"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Wrap up session'}
        </button>
      </div>
    </div>
  )
}

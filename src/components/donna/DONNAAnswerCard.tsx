'use client'

// Sprint 555 — DONNA Context Source Citation UI V1
// Displays a DONNA answer with confidence badge, source note, and follow-up.
// Used for all COO answer surfaces.

import { AlertCircle, CheckCircle2, Info, XCircle, ArrowRight } from 'lucide-react'
import type { DONNAAnswer, DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Confidence badge ──────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<
  DONNAConfidence,
  { label: string; icon: React.ReactNode; className: string }
> = {
  high: {
    label: 'High confidence',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'text-status-green bg-status-green/10 border-status-green/20',
  },
  partial: {
    label: 'Partial data',
    icon: <Info className="w-3 h-3" />,
    className: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
  insufficient: {
    label: 'Insufficient data',
    icon: <AlertCircle className="w-3 h-3" />,
    className: 'text-text-muted bg-surface border-border',
  },
  blocked: {
    label: 'Data blocked',
    icon: <XCircle className="w-3 h-3" />,
    className: 'text-status-red bg-status-red/10 border-status-red/20',
  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNAAnswerCardProps {
  answer: DONNAAnswer
  question?: string
  onFollowUp?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAAnswerCard({ answer, question, onFollowUp }: DONNAAnswerCardProps) {
  const cfg = CONFIDENCE_CONFIG[answer.confidence]

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Question header ── */}
      {question && (
        <div className="px-3.5 py-2.5 border-b border-border bg-surface">
          <p className="text-xs text-text-muted">{question}</p>
        </div>
      )}

      {/* ── DONNA avatar + answer ── */}
      <div className="flex items-start gap-3 px-3.5 py-3.5">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-snug whitespace-pre-line">
            {answer.text}
          </p>
        </div>
      </div>

      {/* ── Confidence + source note ── */}
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.className}`}
        >
          {cfg.icon}
          {cfg.label}
        </span>
        {answer.sourceNote && (
          <span className="text-[10px] text-text-muted truncate">{answer.sourceNote}</span>
        )}
      </div>

      {/* ── Follow-up suggestion ── */}
      {answer.followUpSuggestion && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-t border-border/50 bg-surface">
          <ArrowRight className="w-3 h-3 text-lime shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-snug flex-1">
            {answer.followUpSuggestion}
          </p>
          {onFollowUp && (
            <button
              type="button"
              onClick={onFollowUp}
              className="text-[10px] text-lime hover:text-lime/80 transition-colors whitespace-nowrap ml-2"
            >
              Go →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

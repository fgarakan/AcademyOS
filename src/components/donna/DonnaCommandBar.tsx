'use client'

// DONNA Global Command Bar V1
//
// The primary DONNA interface — a persistent command bar at the top of director pages.
// Users type or speak any question; DONNA routes it to a structured, evidence-backed answer.
//
// Usage:
//   <DonnaCommandBar pagePath="/director/players" playerId={player.id} />
//
// Architecture:
//   Input → donnaGlobalCommandAction (server) → DonnaCommandResult → renders
//   DonnaResultCard + evidence points + action buttons + follow-up chips

import { useState, useRef, useTransition, useEffect } from 'react'
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { donnaGlobalCommandAction, type DonnaCommandResult } from '@/app/director/_actions/donnaGlobalCommandAction'
import type { ProposedAction } from '@/lib/donna/donnaActionProposalEngine'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DonnaCommandBarProps {
  pagePath: string
  playerId?: string | null
  sessionId?: string | null
  /** Placeholder suggestion */
  placeholder?: string
  /** Optional: show inline (compact) vs full (expanded) mode */
  mode?: 'compact' | 'full'
  /** Sprint 1156: external question trigger from suggested question chips */
  triggerQuestion?: string | null
  /** Sprint 1156: called after the triggered question is consumed */
  onTriggered?: () => void
}

// ── Action button ─────────────────────────────────────────────────────────────

function ActionButton({ action }: { action: ProposedAction }) {
  const riskStyles = {
    low:    'bg-surface-raised border-border text-text-secondary hover:border-lime/30 hover:text-lime',
    medium: 'bg-status-blue/8 border-status-blue/20 text-status-blue hover:bg-status-blue/12',
    high:   'bg-status-orange/8 border-status-orange/20 text-status-orange hover:bg-status-orange/12',
  }[action.risk]

  if (action.href && !action.href.startsWith('?')) {
    return (
      <Link
        href={action.href}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${riskStyles}`}
        title={action.description}
      >
        {action.requiresApproval && <AlertTriangle className="w-3 h-3 shrink-0" />}
        {action.label}
      </Link>
    )
  }

  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${riskStyles}`}
      title={action.description}
      disabled
    >
      {action.requiresApproval && <AlertTriangle className="w-3 h-3 shrink-0" />}
      {action.label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DonnaCommandBar({
  pagePath,
  playerId,
  sessionId,
  placeholder = 'Ask DONNA anything… "Who needs attention today?" "Why isn\'t Jamie ready for Orange 2?"',
  mode = 'full',
  triggerQuestion,
  onTriggered,
}: DonnaCommandBarProps) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<DonnaCommandResult | null>(null)
  const [showEvidence, setShowEvidence] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Sprint 1156: auto-submit when an external question trigger arrives
  useEffect(() => {
    if (triggerQuestion) {
      setQuestion(triggerQuestion)
      handleSubmit(triggerQuestion)
      onTriggered?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerQuestion])

  function handleSubmit(q: string) {
    if (!q.trim()) return
    setResult(null)
    setShowEvidence(false)

    startTransition(async () => {
      const res = await donnaGlobalCommandAction({
        question: q.trim(),
        pagePath,
        playerId: playerId ?? null,
        sessionId: sessionId ?? null,
      })
      setResult(res)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSubmit(question)
    }
  }

  function handleFollowUp(q: string) {
    setQuestion(q)
    handleSubmit(q)
    inputRef.current?.focus()
  }

  const hasResult = result !== null && result.ok
  const confidenceTier = result?.confidence
    ? result.confidence >= 80 ? 'high' : result.confidence >= 60 ? 'medium' : 'low'
    : null

  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/3 overflow-hidden">
      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-6 h-6 rounded-full bg-lime/12 border border-lime/25 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-lime" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 outline-none"
          aria-label="Ask DONNA"
          disabled={isPending}
        />
        <button
          onClick={() => handleSubmit(question)}
          disabled={isPending || !question.trim()}
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-lime text-base hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Send"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Result area */}
      {hasResult && result && (
        <div className="border-t border-lime/12 bg-surface/50">

          {/* Answer */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary leading-relaxed">{result.answer}</p>
              </div>
              {confidenceTier && confidenceTier !== 'high' && (
                <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0 ${
                  confidenceTier === 'medium'
                    ? 'text-status-blue bg-status-blue/8 border border-status-blue/20'
                    : 'text-text-muted bg-surface-raised border border-border'
                }`}>
                  {confidenceTier}
                </span>
              )}
            </div>

            {/* Evidence toggle */}
            {result.evidenceSummary && result.evidenceSummary.points.length > 0 && (
              <button
                onClick={() => setShowEvidence(e => !e)}
                className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showEvidence ? 'Hide evidence' : `Evidence (${result.evidenceSummary.points.length} source${result.evidenceSummary.points.length !== 1 ? 's' : ''})`}
              </button>
            )}

            {/* Evidence points */}
            {showEvidence && result.evidenceSummary && (
              <div className="pl-2 space-y-1.5 border-l border-lime/20">
                {result.evidenceSummary.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                      point.strength === 'strong' ? 'text-status-green' :
                      point.strength === 'moderate' ? 'text-status-blue' :
                      'text-text-muted'
                    }`}>
                      {point.source.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[11px] text-text-muted leading-snug">{point.detail}</p>
                  </div>
                ))}
                {result.evidenceSummary.missing.length > 0 && (
                  <div className="pl-1 pt-1">
                    <p className="text-[10px] text-status-orange">
                      Missing: {result.evidenceSummary.missing.map(m => m.what).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {result.proposedActions.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {result.proposedActions.map(action => (
                <ActionButton key={action.id} action={action} />
              ))}
              {result.requiresApproval && (
                <p className="w-full text-[9px] text-text-muted mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-status-orange" />
                  Some actions require director approval in the Review Queue
                </p>
              )}
            </div>
          )}

          {/* Follow-up chips */}
          {result.followUpQuestions.length > 0 && (
            <div className="px-4 pb-3 border-t border-lime/8 pt-2.5 flex flex-wrap gap-1.5">
              {result.followUpQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleFollowUp(q)}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-lime/15 text-lime/80 hover:bg-lime/8 hover:text-lime hover:border-lime/25 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {result && !result.ok && (
        <div className="border-t border-status-red/15 px-4 py-3">
          <p className="text-[12px] text-status-red">{result.error ?? 'Something went wrong.'}</p>
        </div>
      )}
    </div>
  )
}

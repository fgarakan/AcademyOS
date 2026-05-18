'use client'

import { useState } from 'react'
import { Sparkles, X, Shield } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

export function DonnaAddAssessmentGateDraft({ level, onClose }: Props) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const MIN_CHARS = 20

  function handleSubmit() {
    if (text.trim().length < MIN_CHARS) return
    setSubmitted(true)
  }

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">
            Ask DONNA to draft an assessment gate for {level.display_name}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-lime transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!submitted ? (
        <>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-text-secondary">Step 1 of 1 — Describe the gate criterion</p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Describe what a player must demonstrate to advance past this level. Include the skill, a measurable threshold, and who evaluates it. DONNA will structure it into criterion · threshold · evidence · evaluator · player-safe language.
            </p>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`e.g. "Player can sustain 7/10 crosscourt rallies from the baseline before advancing to ${level.display_name}"`}
            className="w-full h-24 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted">
              {text.trim().length < MIN_CHARS && text.trim().length > 0
                ? `${MIN_CHARS - text.trim().length} more characters needed`
                : 'Draft only — goes to review queue, not applied automatically.'}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-[12px] px-3 py-1.5">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={text.trim().length < MIN_CHARS}
                className="btn-lime text-[12px] px-3 py-1.5 disabled:opacity-50"
              >
                Create draft
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] font-semibold text-status-green">Gate draft queued for review</p>
          <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-orange/10 text-status-orange border border-status-orange/20">Draft</span>
              <p className="text-[11px] font-semibold text-text-primary">Assessment Gate — {level.display_name}</p>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">{text.trim().slice(0, 200)}{text.trim().length > 200 ? '...' : ''}</p>
            <p className="text-[10px] text-text-muted">DONNA will structure this into criterion · threshold · evidence needed · evaluator · player-safe language</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
            <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted">This gate is pending review. Players and coaches only see approved gates.</p>
          </div>
          <button onClick={onClose} className="text-[11px] text-lime hover:text-lime/80 transition-colors">Done</button>
        </div>
      )}
    </div>
  )
}

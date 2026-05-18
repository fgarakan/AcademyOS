'use client'

import { useState } from 'react'
import { Sparkles, X, Shield, ChevronRight } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

const REWRITE_PROMPTS = [
  'The level goal is unclear — I want it to describe what players can do, not what they practice.',
  'The development intent is too technical. Simplify it for parents and players.',
  'I want to emphasize competition readiness more at this level.',
  'The advancement requirements need to be more rigorous.',
]

export function DonnaRewriteLevelDraft({ level, onClose }: Props) {
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
            Ask DONNA to rewrite {level.display_name}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-lime transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!submitted ? (
        <>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-text-secondary">Step 1 of 1 — What should change?</p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Tell DONNA what you want to improve. She will create a before/after draft — you see the original and the proposed change side by side before deciding.
            </p>
          </div>

          {/* Quick prompt chips */}
          <div className="flex flex-wrap gap-2">
            {REWRITE_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => setText(p)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:text-lime hover:border-lime/30 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                {p.slice(0, 50)}…
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe what needs to change about this level's goal, intent, or framing…"
            className="w-full h-24 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted">
              {text.trim().length < MIN_CHARS && text.trim().length > 0
                ? `${MIN_CHARS - text.trim().length} more characters needed`
                : 'DONNA will show before/after — no direct mutation.'}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-[12px] px-3 py-1.5">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={text.trim().length < MIN_CHARS}
                className="btn-lime text-[12px] px-3 py-1.5 disabled:opacity-50"
              >
                Draft rewrite
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] font-semibold text-status-green">Rewrite draft queued for review</p>

          {/* Before/after preview */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Before</p>
              <p className="text-[11px] text-text-secondary">{level.display_name} — current intent and goals</p>
            </div>
            <div className="rounded-xl border border-lime/20 bg-lime/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-1">After (draft)</p>
              <p className="text-[11px] text-text-secondary">{text.trim().slice(0, 100)}{text.trim().length > 100 ? '…' : ''}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
            <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted">The original level is unchanged. This draft goes to the Review Queue for director approval before anything is applied.</p>
          </div>
          <button onClick={onClose} className="text-[11px] text-lime hover:text-lime/80 transition-colors">Done</button>
        </div>
      )}
    </div>
  )
}

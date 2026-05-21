'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, AlertTriangle } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

export function DonnaCurriculumNodeAddCard({ levelName }: Props) {
  const [input, setInput] = useState('')
  const [drafted, setDrafted] = useState(false)

  function handleDraft() {
    if (input.trim().length > 5) setDrafted(true)
  }

  function handleReset() {
    setInput('')
    setDrafted(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="text-lime font-medium">DONNA proposes, you decide.</span>{' '}
          Describe what you'd like to add and DONNA will draft a structured suggestion
          for your review. Nothing is committed until you approve it.
        </p>
      </div>

      {!drafted ? (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Tell DONNA what to add to {levelName}
          </p>
          <textarea
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
            rows={3}
            placeholder="e.g. Add a gate for consistent crosscourt rally at 70% over 10 shots…"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            onClick={handleDraft}
            disabled={input.trim().length < 6}
            className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Draft with DONNA
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[11px] font-medium text-lime">DONNA draft ready for review</p>
            </div>
            <p className="text-[11px] text-text-secondary italic leading-relaxed">
              "{input}"
            </p>
            <div className="flex items-start gap-2 pt-2 border-t border-lime/10">
              <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                This draft requires director approval in the Review Queue before
                it becomes part of the curriculum.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/director/curriculum/builder" className="btn-lime flex-1 text-center">
              Open in Builder →
            </Link>
            <button onClick={handleReset} className="btn-ghost">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

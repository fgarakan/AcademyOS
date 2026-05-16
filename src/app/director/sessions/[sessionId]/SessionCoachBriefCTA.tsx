'use client'

import { Sparkles } from 'lucide-react'

export function SessionCoachBriefCTA() {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('donna:open', {
        detail: { prompt: 'Draft a coach brief for this session.' },
      })
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface border border-border hover:border-lime/40 hover:bg-surface-raised transition-all text-left group"
    >
      <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 group-hover:bg-lime/20 transition-colors">
        <Sparkles className="w-4 h-4 text-lime" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">Draft Coach Brief with DONNA</p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Generate a structured pre-session brief — review required before sharing with coach.
        </p>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-text-muted shrink-0">→</span>
    </button>
  )
}

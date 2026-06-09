'use client'

import { Sparkles } from 'lucide-react'
import type { DonnaSuggestedPrompt } from '@/lib/donna/today/todayBriefEngine'

interface Props {
  prompts: DonnaSuggestedPrompt[]
}

function PromptChip({ prompt }: { prompt: DonnaSuggestedPrompt }) {
  function handleClick() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: prompt.prompt } }))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-surface-raised text-[11px] text-text-secondary hover:border-lime/30 hover:text-lime hover:bg-lime/[0.03] transition-colors text-left"
    >
      <Sparkles className="w-3 h-3 shrink-0 text-text-muted" />
      {prompt.label}
    </button>
  )
}

export function TodayDonnaPromptsCard({ prompts }: Props) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      data-donna-focus-id="today-donna-prompts"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="label-xs">Ask DONNA</p>
      </div>
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <PromptChip key={p.prompt} prompt={p} />
        ))}
      </div>
    </div>
  )
}

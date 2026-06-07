'use client'

import { Sparkles } from 'lucide-react'

interface Props {
  prompt?: string
  label?: string
}

export function DonnaAskButton({ prompt = 'what should I do today', label = 'Ask DONNA' }: Props) {
  function handleClick() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt } }))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-lime transition-colors"
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </button>
  )
}

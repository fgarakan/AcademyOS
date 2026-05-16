'use client'

import { Sparkles } from 'lucide-react'

interface LevelUpDonnaCTAProps {
  playerName: string
  currentTrack: string | null
  urgency: string | null
}

export function LevelUpDonnaCTA({ playerName, currentTrack, urgency }: LevelUpDonnaCTAProps) {
  function handleClick() {
    const trackPart = currentTrack ? ` on the ${currentTrack} track` : ''
    const urgencyPart = urgency === 'overdue'
      ? ', assessment is overdue'
      : urgency === 'due_soon'
        ? ', assessment is due soon'
        : ''
    const prompt = `Review level readiness for ${playerName}${trackPart}${urgencyPart}.`

    window.dispatchEvent(
      new CustomEvent('donna:open', { detail: { prompt } })
    )
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime/10 border border-lime/30 text-[11px] text-lime hover:bg-lime/20 hover:border-lime/50 transition-colors"
      title={`Review ${playerName}'s level readiness with DONNA`}
    >
      <Sparkles className="w-3 h-3" />
      Review
    </button>
  )
}

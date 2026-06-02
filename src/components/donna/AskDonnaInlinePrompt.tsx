'use client'

// DONNA UI Constitution — AskDonnaInlinePrompt
//
// Inline "Ask DONNA" chip that opens the DONNA panel with a pre-filled question.
// Constitution rule: DONNA is the interface to complexity.
//
// Usage on player profile:
//   <AskDonnaInlinePrompt
//     question="Why isn't this player ready for Orange 2?"
//     label="Ask DONNA why"
//   />

import { Sparkles } from 'lucide-react'

interface AskDonnaInlinePromptProps {
  /** The pre-filled question to send to DONNA */
  question: string
  /** Display label */
  label?: string
  /** Visual size */
  size?: 'sm' | 'xs'
  className?: string
}

export function AskDonnaInlinePrompt({
  question,
  label,
  size = 'sm',
  className = '',
}: AskDonnaInlinePromptProps) {
  function handleClick() {
    // Dispatch to DONNA panel — uses the established donna:open event pattern
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('donna:open', {
          detail: { prefillQuestion: question },
        })
      )
    }
  }

  const textSize = size === 'xs' ? 'text-[10px]' : 'text-[11px]'
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const padding  = size === 'xs' ? 'px-2 py-1' : 'px-2.5 py-1.5'

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 ${padding} rounded-lg bg-lime/6 border border-lime/20 ${textSize} font-medium text-lime hover:bg-lime/10 hover:border-lime/30 transition-all ${className}`}
      title={`Ask DONNA: ${question}`}
    >
      <Sparkles className={`${iconSize} shrink-0`} />
      {label ?? 'Ask DONNA'}
    </button>
  )
}

// ── Pre-built player profile prompts ─────────────────────────────────────────

interface PlayerDonnaPromptsProps {
  playerFirstName: string
  currentLevelName?: string | null
  className?: string
}

/**
 * Pre-built set of "Ask DONNA" chips for the player profile.
 * Constitution-compliant: shows the 4 most useful questions.
 */
export function PlayerProfileDonnaPrompts({ playerFirstName, currentLevelName, className = '' }: PlayerDonnaPromptsProps) {
  const name = playerFirstName
  const level = currentLevelName ?? 'this level'

  const prompts = [
    { q: `Why is ${name} at ${level}?`,              label: 'Why this level?' },
    { q: `What is blocking ${name}'s level progress?`, label: 'What\'s blocking?' },
    { q: `What should the coach focus on with ${name}?`, label: 'Coach focus?' },
    { q: `What should I tell ${name}'s parent?`,       label: 'Parent update?' },
  ]

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {prompts.map(p => (
        <AskDonnaInlinePrompt
          key={p.q}
          question={p.q}
          label={p.label}
          size="xs"
        />
      ))}
    </div>
  )
}

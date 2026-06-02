'use client'

// DONNA Command Section V1
//
// Wraps DonnaSuggestedQuestions + DonnaCommandBar with shared state.
// Suggested question chips pre-fill and auto-submit the command bar.
//
// Usage:
//   <DonnaCommandSection pagePath="/director/players" />
//   <DonnaCommandSection pagePath="/director/players/[id]" playerId={player.id} />

import { useState } from 'react'
import { DonnaCommandBar } from './DonnaCommandBar'
import { DonnaSuggestedQuestions } from './DonnaSuggestedQuestions'

interface DonnaCommandSectionProps {
  pagePath: string
  playerId?: string | null
  sessionId?: string | null
  /** Override suggested questions */
  questions?: string[]
  /** Placeholder for the command bar input */
  placeholder?: string
  /** Whether to show suggested questions above the bar */
  showSuggestions?: boolean
  className?: string
}

export function DonnaCommandSection({
  pagePath,
  playerId,
  sessionId,
  questions,
  placeholder,
  showSuggestions = true,
  className = '',
}: DonnaCommandSectionProps) {
  const [triggerQuestion, setTriggerQuestion] = useState<string | null>(null)

  return (
    <div className={`space-y-2 ${className}`}>
      {showSuggestions && (
        <DonnaSuggestedQuestions
          pagePath={pagePath}
          questions={questions}
          onSelect={q => setTriggerQuestion(q)}
        />
      )}
      <DonnaCommandBar
        pagePath={pagePath}
        playerId={playerId ?? null}
        sessionId={sessionId ?? null}
        placeholder={placeholder}
        triggerQuestion={triggerQuestion}
        onTriggered={() => setTriggerQuestion(null)}
      />
    </div>
  )
}

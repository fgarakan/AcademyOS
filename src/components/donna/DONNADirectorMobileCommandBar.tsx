'use client'

// Sprint 628 — Director Command Center Mobile Polish V1
// Compact mobile command bar for the director on smaller screens.
// Shows academy health, review queue badge, and DONNA command input.
// Callbacks only — no DB writes from this component.

import { useState } from 'react'
import { ClipboardList, Activity, Terminal, AlertCircle, X } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNADirectorMobileCommandBarProps {
  academyHealthScore: number | null
  pendingReviewCount: number
  urgentReviewCount: number
  onCommand?: (input: string) => void
  onOpenReviewQueue?: () => void
  onOpenHealthDetail?: () => void
  className?: string
}

// ── Health score color ─────────────────────────────────────────────────────────

function healthColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score >= 80) return 'text-status-green'
  if (score >= 60) return 'text-status-orange'
  return 'text-status-red'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNADirectorMobileCommandBar({
  academyHealthScore,
  pendingReviewCount,
  urgentReviewCount,
  onCommand,
  onOpenReviewQueue,
  onOpenHealthDetail,
  className = '',
}: DONNADirectorMobileCommandBarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInput, setCommandInput] = useState('')

  function handleSubmit() {
    const trimmed = commandInput.trim()
    if (!trimmed) return
    onCommand?.(trimmed)
    setCommandInput('')
    setCommandOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setCommandOpen(false)
      setCommandInput('')
    }
  }

  return (
    <div className={`${className}`}>

      {/* Expanded command input */}
      {commandOpen && (
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-lime shrink-0" />
            <input
              type="text"
              value={commandInput}
              onChange={e => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DONNA anything…"
              autoFocus
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              onClick={() => { setCommandOpen(false); setCommandInput('') }}
              className="text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Close command input"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {commandInput.trim() && (
            <button
              onClick={handleSubmit}
              className="mt-2 w-full text-xs font-medium text-lime py-1.5 rounded-lg border border-lime/30 bg-lime/5 hover:bg-lime/10 transition-colors"
            >
              Submit to DONNA
            </button>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center gap-0 border-t border-border bg-surface">

        {/* Academy health */}
        <button
          onClick={onOpenHealthDetail}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 hover:bg-surface-raised transition-colors"
        >
          <Activity className={`w-4 h-4 ${healthColor(academyHealthScore)}`} />
          <span className={`text-[10px] font-mono font-medium ${healthColor(academyHealthScore)}`}>
            {academyHealthScore !== null ? `${academyHealthScore}` : '—'}
          </span>
          <span className="text-[9px] text-text-muted">Health</span>
        </button>

        {/* DONNA command */}
        <button
          onClick={() => setCommandOpen(v => !v)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
            commandOpen ? 'bg-lime/5 border-x border-lime/20' : 'hover:bg-surface-raised'
          }`}
        >
          <Terminal className={`w-4 h-4 ${commandOpen ? 'text-lime' : 'text-text-muted'}`} />
          <span className={`text-[9px] ${commandOpen ? 'text-lime' : 'text-text-muted'}`}>DONNA</span>
        </button>

        {/* Review queue */}
        <button
          onClick={onOpenReviewQueue}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 hover:bg-surface-raised transition-colors relative"
        >
          <div className="relative">
            <ClipboardList className="w-4 h-4 text-text-muted" />
            {urgentReviewCount > 0 && (
              <AlertCircle className="w-2.5 h-2.5 text-status-red absolute -top-0.5 -right-0.5" />
            )}
          </div>
          {pendingReviewCount > 0 ? (
            <span className="text-[10px] font-medium text-text-primary">{pendingReviewCount}</span>
          ) : (
            <span className="text-[10px] text-status-green">Clear</span>
          )}
          <span className="text-[9px] text-text-muted">Review</span>
        </button>
      </div>
    </div>
  )
}

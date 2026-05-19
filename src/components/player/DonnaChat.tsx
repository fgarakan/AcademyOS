'use client'

import { useState } from 'react'
import { MessageCircle, ChevronRight } from 'lucide-react'

export interface DonnaChip {
  id: string
  label: string
  response: string
}

interface Props {
  chips: DonnaChip[]
}

export function DonnaChat({ chips }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = chips.find(c => c.id === activeId) ?? null

  return (
    <div className="space-y-3">
      {/* Suggested chips */}
      <div>
        <p className="text-xs text-text-muted mb-2.5">Tap a question to get DONNA&apos;s answer</p>
        <div className="flex flex-wrap gap-2">
          {chips.map(chip => (
            <button
              key={chip.id}
              onClick={() => setActiveId(chip.id === activeId ? null : chip.id)}
              className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                chip.id === activeId
                  ? 'bg-status-blue/15 border-status-blue/40 text-status-blue font-medium'
                  : 'bg-surface-raised border-border text-text-secondary hover:border-status-blue/30'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Response */}
      {active && (
        <div className="rounded-xl bg-status-blue/5 border border-status-blue/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-status-blue/15 border border-status-blue/20 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-3.5 h-3.5 text-status-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-status-blue mb-1.5 uppercase tracking-widest">DONNA</p>
              <p className="text-sm text-text-primary leading-relaxed">{active.response}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom question — disabled until AI layer is enabled */}
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
        <p className="text-xs text-text-muted mb-2">Ask your own question</p>
        <div className="flex gap-2">
          <input
            type="text"
            disabled
            placeholder="Full AI responses coming soon..."
            className="flex-1 text-xs bg-surface border border-border rounded-lg px-3 py-2.5 text-text-muted placeholder:text-text-muted/50 cursor-not-allowed"
          />
          <button
            disabled
            className="px-3 py-2.5 rounded-lg bg-surface border border-border text-text-muted cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          Your coach will be notified when full AI responses are enabled for your academy.
        </p>
      </div>
    </div>
  )
}

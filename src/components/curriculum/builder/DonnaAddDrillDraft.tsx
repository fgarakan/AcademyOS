'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

export function DonnaAddDrillDraft({ level, onClose }: Props) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!text.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">
            Ask DONNA to draft a drill for {level.display_name}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-lime transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!submitted ? (
        <>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Describe the drill you have in mind. DONNA will create a draft in your review queue — nothing is added until you approve it.
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`e.g. "A return-of-serve drill for Orange 2 players — start at the T, coach feeds wide first serves, player recovers to the centre after each return"`}
            className="w-full h-24 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted">
              Draft only — goes to review queue, not applied automatically.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost text-[12px] px-3 py-1.5">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="btn-lime text-[12px] px-3 py-1.5 disabled:opacity-50"
              >
                Create draft
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-[12px] text-status-green font-semibold">Draft created — check Review Queue</p>
          <p className="text-[11px] text-text-secondary">
            DONNA has queued a drill draft for {level.display_name}. Nothing is added to the curriculum until you review and approve it.
          </p>
          <button onClick={onClose} className="text-[11px] text-lime hover:text-lime/80 transition-colors">
            Close
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, MessageSquarePlus, Flag } from 'lucide-react'
import Link from 'next/link'

// ── Block type display map ─────────────────────────────────────

const BLOCK_TYPE_LABEL: Record<string, string> = {
  warm_up: 'Warm Up',
  technical: 'Technical',
  tactical: 'Tactical',
  physical: 'Physical',
  cool_down: 'Cool Down',
  match_play: 'Match Play',
  assessment: 'Assessment',
  movement: 'Movement',
  speed: 'Speed',
  agility: 'Agility',
  strength: 'Strength',
  plyometrics: 'Plyometrics',
  coordination: 'Coordination',
  mobility: 'Mobility',
  recovery_cool_down: 'Recovery',
}

const BLOCK_TYPE_COLOR: Record<string, string> = {
  warm_up: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  technical: 'text-lime border-lime/30 bg-lime/5',
  tactical: 'text-status-blue border-status-blue/30 bg-status-blue/5',
  physical: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
  cool_down: 'text-status-green border-status-green/30 bg-status-green/5',
  match_play: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  assessment: 'text-text-secondary border-border bg-surface-raised',
  movement: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  speed: 'text-lime border-lime/30 bg-lime/5',
  agility: 'text-status-blue border-status-blue/30 bg-status-blue/5',
  strength: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
  plyometrics: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  coordination: 'text-text-secondary border-border bg-surface-raised',
  mobility: 'text-status-green border-status-green/30 bg-status-green/5',
  recovery_cool_down: 'text-status-green border-status-green/30 bg-status-green/5',
}

// ── Types ────────────────────────────────────────────────────

interface ExecuteBlock {
  id: string
  name: string
  type: string
  durationMin: number
  notes: string | null
}

interface Props {
  sessionId: string
  sessionName: string
  blocks: ExecuteBlock[]
  wrapUpHref: string
}

// ── Client component ─────────────────────────────────────────

export function ExecuteClient({ sessionId, sessionName, blocks, wrapUpHref }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Difficulty adjustments are local-only UX signals, not persisted
  const [adjustments, setAdjustments] = useState<Record<string, 'easier' | 'harder' | null>>({})
  // Quick note drafts — local only
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({})

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <p className="text-text-secondary text-sm">No blocks in this session.</p>
        <p className="text-text-muted text-xs">Blocks are added through the template. Ask your director to update the template.</p>
        <Link href={`/coach/sessions/${sessionId}`} className="text-lime text-sm font-medium">
          Back to session
        </Link>
      </div>
    )
  }

  const block = blocks[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === blocks.length - 1
  const typeLabel = BLOCK_TYPE_LABEL[block.type] ?? block.type
  const typeColor = BLOCK_TYPE_COLOR[block.type] ?? 'text-text-secondary border-border bg-surface-raised'
  const currentAdjust = adjustments[block.id] ?? null
  const noteOpen = showNoteInput[block.id] ?? false
  const noteValue = notes[block.id] ?? ''

  function goNext() { if (!isLast) setCurrentIndex(i => i + 1) }
  function goPrev() { if (!isFirst) setCurrentIndex(i => i - 1) }
  function setAdjust(v: 'easier' | 'harder' | null) {
    setAdjustments(prev => ({ ...prev, [block.id]: v === currentAdjust ? null : v }))
  }

  return (
    <div className="min-h-screen bg-base flex flex-col max-w-lg mx-auto px-4 py-6">

      {/* Top nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/coach/sessions/${sessionId}`}
          className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {sessionName}
        </Link>
        <p className="text-[10px] font-mono text-text-muted">
          {currentIndex + 1} / {blocks.length}
        </p>
      </div>

      {/* Progress rail */}
      <div className="flex gap-1 mb-6">
        {blocks.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setCurrentIndex(i)}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i < currentIndex ? 'bg-status-green' :
              i === currentIndex ? 'bg-lime' :
              'bg-surface-raised'
            }`}
            aria-label={`Go to block ${i + 1}`}
          />
        ))}
      </div>

      {/* Block card */}
      <div className="flex-1 rounded-2xl border border-border bg-surface p-5 space-y-4">

        {/* Type chip + duration */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="text-sm font-mono text-text-muted">{block.durationMin} min</span>
        </div>

        {/* Block name */}
        <h2 className="text-2xl font-bold text-text-primary leading-tight">{block.name}</h2>

        {/* Notes / watch-fors */}
        {block.notes ? (
          <div className="rounded-xl bg-surface-raised border border-border p-3">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Watch For</p>
            <p className="text-sm text-text-secondary leading-relaxed">{block.notes}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-surface-raised border border-border p-3">
            <p className="text-xs text-text-muted">
              No specific watch-fors for this block. See the session plan for curriculum details.
            </p>
          </div>
        )}

        {/* Difficulty adjustment */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Adjust Difficulty</p>
          <div className="flex gap-2">
            <button
              onClick={() => setAdjust('easier')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                currentAdjust === 'easier'
                  ? 'border-status-blue/40 bg-status-blue/10 text-status-blue'
                  : 'border-border bg-surface-raised text-text-muted hover:border-border hover:text-text-secondary'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Make Easier
            </button>
            <button
              onClick={() => setAdjust('harder')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                currentAdjust === 'harder'
                  ? 'border-lime/40 bg-lime/10 text-lime'
                  : 'border-border bg-surface-raised text-text-muted hover:border-border hover:text-text-secondary'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Make Harder
            </button>
          </div>
          {currentAdjust && (
            <p className="text-[10px] text-text-muted mt-1.5 text-center">
              {currentAdjust === 'easier'
                ? 'Simplify the drill. Reduce targets, shorten range, allow more time.'
                : 'Increase difficulty. Add targets, reduce time, add movement constraint.'}
            </p>
          )}
        </div>

        {/* Quick note */}
        <div>
          <button
            onClick={() => setShowNoteInput(prev => ({ ...prev, [block.id]: !noteOpen }))}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            {noteOpen ? 'Hide note' : 'Add quick note'}
          </button>
          {noteOpen && (
            <textarea
              value={noteValue}
              onChange={e => setNotes(prev => ({ ...prev, [block.id]: e.target.value }))}
              placeholder="Capture anything mid-block... (saved locally until wrap-up)"
              className="mt-2 w-full rounded-xl bg-surface-raised border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
              rows={3}
            />
          )}
        </div>

      </div>

      {/* Block navigation */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-raised transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <div className="flex-1" />
        {isLast ? (
          <Link
            href={wrapUpHref}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 transition-all"
          >
            <Flag className="w-4 h-4" />
            Wrap Up
          </Link>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  )
}

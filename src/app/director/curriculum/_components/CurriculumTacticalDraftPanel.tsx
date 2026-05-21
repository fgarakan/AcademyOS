'use client'

import { useState } from 'react'
import { Target, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

const TACTICAL_EXAMPLES = [
  'Crosscourt control',
  'Changing direction',
  'Short ball attack',
  'Neutralizing defence',
  'Playing at 30-30',
  'Closing games',
  'Tiebreak decision-making',
  'Opening the court',
  'Pattern off serve',
  'Return game tactics',
]

const INPUT_CLS = 'w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors'

export function CurriculumTacticalDraftPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [conceptName, setConceptName] = useState('')
  const [description, setDescription] = useState('')
  const [whenToUse, setWhenToUse] = useState('')
  const [coachingNotes, setCoachingNotes] = useState('')
  const [playerLabel, setPlayerLabel] = useState('')
  const [videoLink, setVideoLink] = useState('')

  const isValid = conceptName.trim().length > 0

  function handleReset() {
    setConceptName(''); setDescription(''); setWhenToUse('')
    setCoachingNotes(''); setPlayerLabel(''); setVideoLink(''); setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Target className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[12px] font-medium text-text-secondary">Draft Tactical Concept</p>
          <span className="text-[10px] text-text-muted">for {levelName}</span>
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-surface">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted leading-relaxed">
              <span className="text-status-orange font-medium">Draft only.</span>{' '}
              Tactical concepts define the patterns and decisions players develop at this level.
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-3">
              {/* Concept name with examples */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Concept Name *</p>
                <input type="text" value={conceptName} onChange={e => setConceptName(e.target.value)}
                  placeholder="e.g. Crosscourt control" className={INPUT_CLS} />
                <div className="flex flex-wrap gap-1">
                  {TACTICAL_EXAMPLES.slice(0, 5).map(ex => (
                    <button key={ex} onClick={() => setConceptName(ex)}
                      className="text-[9px] text-text-muted border border-border bg-surface-raised px-1.5 py-0.5 rounded hover:border-lime/30 hover:text-lime transition-colors">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Description</p>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  placeholder="What this tactical concept involves…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">When to Use</p>
                <textarea value={whenToUse} onChange={e => setWhenToUse(e.target.value)} rows={2}
                  placeholder="Situation / score / position this applies…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Coaching Notes</p>
                <textarea value={coachingNotes} onChange={e => setCoachingNotes(e.target.value)} rows={2}
                  placeholder="How to coach and observe this concept…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Player-facing Label</p>
                <input type="text" value={playerLabel} onChange={e => setPlayerLabel(e.target.value)}
                  placeholder="e.g. Keeping the ball crosscourt" className={INPUT_CLS} />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Video Reference</p>
                <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)}
                  placeholder="https://youtube.com/…" className={INPUT_CLS} />
              </div>

              <button
                onClick={() => isValid && setSubmitted(true)}
                disabled={!isValid}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Tactical Draft
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-medium text-lime">Tactical concept draft saved</p>
                <p className="text-[13px] font-semibold text-text-primary">{conceptName}</p>
                {description && <p className="text-[11px] text-text-secondary">{description}</p>}
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-lime/10">
                  <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-muted">Requires director approval.</p>
                </div>
              </div>
              <button onClick={handleReset} className="btn-ghost w-full">Draft Another</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Brain, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

const MENTAL_DOMAINS = [
  'focus_and_concentration',
  'resilience_and_recovery',
  'competitive_mindset',
  'pressure_management',
  'self_talk_and_confidence',
  'process_orientation',
  'routine_and_preparation',
] as const

type MentalDomain = typeof MENTAL_DOMAINS[number]

const MENTAL_EXAMPLES = [
  'Mistake response',
  'Loss response',
  'Emotional reset',
  'Score intelligence',
  'Pressure routines',
  'Self-talk',
  'Tournament reflection',
  'Bad-call response',
  'Break-point focus',
  'Comeback mindset',
]

const DOMAIN_LABELS: Record<MentalDomain, string> = {
  focus_and_concentration:  'Focus',
  resilience_and_recovery:  'Resilience',
  competitive_mindset:      'Competitive',
  pressure_management:      'Pressure',
  self_talk_and_confidence: 'Self-Talk',
  process_orientation:      'Process',
  routine_and_preparation:  'Routines',
}

const INPUT_CLS = 'w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors'

export function CurriculumMentalDraftPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [conceptName, setConceptName] = useState('')
  const [domain, setDomain] = useState<MentalDomain>('resilience_and_recovery')
  const [description, setDescription] = useState('')
  const [observableMarkers, setObservableMarkers] = useState('')
  const [coachingCues, setCoachingCues] = useState('')
  const [playerLabel, setPlayerLabel] = useState('')
  const [parentLabel, setParentLabel] = useState('')

  const isValid = conceptName.trim().length > 0

  function handleReset() {
    setConceptName(''); setDomain('resilience_and_recovery'); setDescription('')
    setObservableMarkers(''); setCoachingCues(''); setPlayerLabel(''); setParentLabel('')
    setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Brain className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[12px] font-medium text-text-secondary">Draft Mental Performance Concept</p>
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
              Mental performance concepts are coach/director-facing by default. Player and parent
              labels control what families see — keep them constructive and encouraging.
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Concept Name *</p>
                <input type="text" value={conceptName} onChange={e => setConceptName(e.target.value)}
                  placeholder="e.g. Mistake response" className={INPUT_CLS} />
                <div className="flex flex-wrap gap-1">
                  {MENTAL_EXAMPLES.slice(0, 6).map(ex => (
                    <button key={ex} onClick={() => setConceptName(ex)}
                      className="text-[9px] text-text-muted border border-border bg-surface-raised px-1.5 py-0.5 rounded hover:border-lime/30 hover:text-lime transition-colors">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domain */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {MENTAL_DOMAINS.map(d => (
                    <button key={d} onClick={() => setDomain(d)}
                      className={`px-2 py-1 rounded text-[9px] font-medium border transition-colors ${
                        domain === d
                          ? 'bg-lime/10 border-lime/30 text-lime'
                          : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                      }`}
                    >{DOMAIN_LABELS[d]}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Description</p>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  placeholder="What this competency involves and why it matters…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Observable Markers</p>
                <textarea value={observableMarkers} onChange={e => setObservableMarkers(e.target.value)} rows={2}
                  placeholder="What coaches observe when this is present (one per line)…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Coaching Cues</p>
                <textarea value={coachingCues} onChange={e => setCoachingCues(e.target.value)} rows={2}
                  placeholder="What coaches say to develop this (internal only)…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Player Label</p>
                  <input type="text" value={playerLabel} onChange={e => setPlayerLabel(e.target.value)}
                    placeholder="e.g. Bounce back fast" className={INPUT_CLS} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Parent Label</p>
                  <input type="text" value={parentLabel} onChange={e => setParentLabel(e.target.value)}
                    placeholder="e.g. Handling mistakes positively" className={INPUT_CLS} />
                </div>
              </div>

              <button
                onClick={() => isValid && setSubmitted(true)}
                disabled={!isValid}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Mental Performance Draft
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-medium text-lime">Mental performance draft saved</p>
                <p className="text-[13px] font-semibold text-text-primary">{conceptName}</p>
                <p className="text-[10px] text-text-muted font-mono">{DOMAIN_LABELS[domain]}</p>
                {playerLabel && <p className="text-[11px] text-text-secondary">Player: "{playerLabel}"</p>}
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

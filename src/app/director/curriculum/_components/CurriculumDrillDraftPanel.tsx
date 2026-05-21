'use client'

import { useState } from 'react'
import { Activity, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const
const BALL_COLOR_OPTIONS = ['Red', 'Orange', 'Green', 'Yellow'] as const

type Difficulty = typeof DIFFICULTY_OPTIONS[number]
type BallColor = typeof BALL_COLOR_OPTIONS[number]

export function CurriculumDrillDraftPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [title, setTitle] = useState('')
  const [setup, setSetup] = useState('')
  const [playerCount, setPlayerCount] = useState('')
  const [equipment, setEquipment] = useState('')
  const [rules, setRules] = useState('')
  const [progression, setProgression] = useState('')
  const [regression, setRegression] = useState('')
  const [coachCues, setCoachCues] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [ballColor, setBallColor] = useState<BallColor>('Orange')
  const [evidenceTarget, setEvidenceTarget] = useState('')
  const [safetyNotes, setSafetyNotes] = useState('')

  const isValid = title.trim().length > 0

  function handleReset() {
    setTitle(''); setSetup(''); setPlayerCount(''); setEquipment('')
    setRules(''); setProgression(''); setRegression(''); setCoachCues('')
    setVideoLink(''); setDifficulty('beginner'); setBallColor('Orange')
    setEvidenceTarget(''); setSafetyNotes(''); setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Activity className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[12px] font-medium text-text-secondary">Draft Drill</p>
          <span className="text-[10px] text-text-muted">for {levelName}</span>
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-surface">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted leading-relaxed">
              <span className="text-status-orange font-medium">Draft only.</span>{' '}
              Requires director approval before connecting to the curriculum.
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-3">
              {/* Title */}
              <Field label="Drill Title *">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Crosscourt Rally Consistency"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              {/* Difficulty + Ball Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Difficulty</p>
                  <div className="flex gap-1">
                    {DIFFICULTY_OPTIONS.map(d => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1 rounded text-[9px] font-medium border capitalize transition-colors ${
                          difficulty === d
                            ? 'bg-lime/10 border-lime/30 text-lime'
                            : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                        }`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Ball Colour</p>
                  <div className="flex gap-1">
                    {BALL_COLOR_OPTIONS.map(b => (
                      <button key={b} onClick={() => setBallColor(b)}
                        className={`flex-1 py-1 rounded text-[9px] font-medium border transition-colors ${
                          ballColor === b
                            ? 'bg-lime/10 border-lime/30 text-lime'
                            : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                        }`}
                      >{b}</button>
                    ))}
                  </div>
                </div>
              </div>

              <Field label="Setup">
                <textarea value={setup} onChange={e => setSetup(e.target.value)} rows={2}
                  placeholder="Court layout, player positions…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Player Count">
                  <input type="text" value={playerCount} onChange={e => setPlayerCount(e.target.value)}
                    placeholder="e.g. 2–4" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
                </Field>
                <Field label="Equipment">
                  <input type="text" value={equipment} onChange={e => setEquipment(e.target.value)}
                    placeholder="e.g. Cones, targets" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
                </Field>
              </div>

              <Field label="Rules / Instructions">
                <textarea value={rules} onChange={e => setRules(e.target.value)} rows={2}
                  placeholder="How the drill runs…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Progression (harder)">
                  <textarea value={progression} onChange={e => setProgression(e.target.value)} rows={2}
                    placeholder="Make it harder by…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
                </Field>
                <Field label="Regression (easier)">
                  <textarea value={regression} onChange={e => setRegression(e.target.value)} rows={2}
                    placeholder="Make it easier by…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
                </Field>
              </div>

              <Field label="Coach Cues">
                <textarea value={coachCues} onChange={e => setCoachCues(e.target.value)} rows={2}
                  placeholder="Key coaching language for this drill…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <Field label="Evidence Target">
                <input type="text" value={evidenceTarget} onChange={e => setEvidenceTarget(e.target.value)}
                  placeholder="e.g. 7/10 crosscourt at medium pace" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <Field label="Video Link">
                <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)}
                  placeholder="https://youtube.com/…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <Field label="Safety Notes">
                <input type="text" value={safetyNotes} onChange={e => setSafetyNotes(e.target.value)}
                  placeholder="Any safety considerations…" className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors" />
              </Field>

              <button
                onClick={() => isValid && setSubmitted(true)}
                disabled={!isValid}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Drill Draft
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1">
                <p className="text-[11px] font-medium text-lime">Drill draft saved</p>
                <p className="text-[13px] font-semibold text-text-primary">{title}</p>
                <p className="text-[10px] text-text-muted font-mono capitalize">{difficulty} · {ballColor} ball</p>
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-lime/10">
                  <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-muted">
                    Requires director approval in the Review Queue.
                  </p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
      {children}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Star, ChevronDown, ChevronRight, AlertTriangle, Plus, X } from 'lucide-react'

interface Props {
  levelId: string
  levelName: string
}

const DOMAIN_OPTIONS = [
  'technical', 'tactical', 'footwork', 'serve_return',
  'rally', 'net_play', 'competition', 'fitness', 'mental',
] as const

type SkillDomain = typeof DOMAIN_OPTIONS[number]

const INPUT_CLS = 'w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors'

export function CurriculumSkillDraftPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [skillName, setSkillName] = useState('')
  const [domain, setDomain] = useState<SkillDomain>('technical')
  const [playerLabel, setPlayerLabel] = useState('')
  const [coachDescription, setCoachDescription] = useState('')
  const [subSkillInput, setSubSkillInput] = useState('')
  const [subSkills, setSubSkills] = useState<string[]>([])
  const [isPlayerVisible, setIsPlayerVisible] = useState(false)
  const [isParentVisible, setIsParentVisible] = useState(false)

  const isValid = skillName.trim().length > 0

  function addSubSkill() {
    const v = subSkillInput.trim()
    if (v && !subSkills.includes(v)) {
      setSubSkills(prev => [...prev, v])
      setSubSkillInput('')
    }
  }

  function removeSubSkill(s: string) {
    setSubSkills(prev => prev.filter(x => x !== s))
  }

  function handleReset() {
    setSkillName(''); setDomain('technical'); setPlayerLabel(''); setCoachDescription('')
    setSubSkillInput(''); setSubSkills([]); setIsPlayerVisible(false); setIsParentVisible(false)
    setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Star className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[12px] font-medium text-text-secondary">Draft Skill / Sub-Skills</p>
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
              Example: Forehand → Preparation → unit turn, spacing, body loading
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-3">
              {/* Skill name */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Skill Name *</p>
                <input type="text" value={skillName} onChange={e => setSkillName(e.target.value)}
                  placeholder="e.g. Forehand Groundstroke" className={INPUT_CLS} />
              </div>

              {/* Domain */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {DOMAIN_OPTIONS.map(d => (
                    <button key={d} onClick={() => setDomain(d)}
                      className={`px-2 py-1 rounded text-[9px] font-medium border capitalize transition-colors ${
                        domain === d
                          ? 'bg-lime/10 border-lime/30 text-lime'
                          : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                      }`}
                    >{d.replace(/_/g, ' ')}</button>
                  ))}
                </div>
              </div>

              {/* Player-facing label */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Player-facing Label</p>
                <input type="text" value={playerLabel} onChange={e => setPlayerLabel(e.target.value)}
                  placeholder="e.g. Hitting with your forehand" className={INPUT_CLS} />
              </div>

              {/* Coach description */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Coach Description</p>
                <textarea value={coachDescription} onChange={e => setCoachDescription(e.target.value)} rows={2}
                  placeholder="Technical detail for coaches only…"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors" />
              </div>

              {/* Sub-skills */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Sub-Skills</p>
                <div className="flex gap-2">
                  <input type="text" value={subSkillInput} onChange={e => setSubSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubSkill())}
                    placeholder="e.g. unit turn — press Enter to add"
                    className={INPUT_CLS + ' flex-1'} />
                  <button onClick={addSubSkill}
                    className="shrink-0 p-2 rounded-xl border border-border bg-surface-raised hover:border-lime/30 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
                {subSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {subSkills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 text-[10px] text-lime bg-lime/5 border border-lime/20 px-2 py-0.5 rounded">
                        {s}
                        <button onClick={() => removeSubSkill(s)}>
                          <X className="w-2.5 h-2.5 hover:text-status-red transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPlayerVisible} onChange={e => setIsPlayerVisible(e.target.checked)}
                    className="rounded" />
                  <span className="text-[11px] text-text-secondary">Show to player</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isParentVisible} onChange={e => setIsParentVisible(e.target.checked)}
                    className="rounded" />
                  <span className="text-[11px] text-text-secondary">Show to parent</span>
                </label>
              </div>

              <button
                onClick={() => isValid && setSubmitted(true)}
                disabled={!isValid}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Skill Draft
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-medium text-lime">Skill draft saved</p>
                <p className="text-[13px] font-semibold text-text-primary">{skillName}</p>
                <p className="text-[10px] text-text-muted font-mono capitalize">{domain.replace(/_/g, ' ')}</p>
                {subSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {subSkills.map(s => (
                      <span key={s} className="text-[10px] text-text-secondary bg-surface border border-border px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
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

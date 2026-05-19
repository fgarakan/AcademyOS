'use client'

import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const COACHING_STYLES = [
  {
    id: 'fundamentals-first',
    label: 'Fundamentals First',
    desc: 'Technique, grips, preparation, and clean contact before complexity.',
    impact: 'Session templates emphasize structured rep blocks and technical drills.',
  },
  {
    id: 'game-based',
    label: 'Game-Based Learning',
    desc: 'Players learn through constraints, scoring, and live-ball decisions.',
    impact: 'Templates lead with constraint games and live-ball blocks.',
  },
  {
    id: 'high-performance',
    label: 'High-Performance Discipline',
    desc: 'Clear standards, intensity, accountability, and quality reps.',
    impact: 'Session defaults include intensity markers, standards, and fitness integration.',
  },
  {
    id: 'player-centered',
    label: 'Player-Centered Coaching',
    desc: 'Confidence, ownership, athlete voice, and individual learning styles.',
    impact: 'Coach cues emphasize questions, choice, and self-assessment.',
  },
  {
    id: 'tactical-first',
    label: 'Tactical First',
    desc: 'Court geometry, patterns, decisions, and point construction.',
    impact: 'Templates build toward tactical scenarios and point construction.',
  },
  {
    id: 'movement-first',
    label: 'Movement First',
    desc: 'Footwork, spacing, recovery, and athletic positions.',
    impact: 'Warm-up and drill blocks emphasize movement quality.',
  },
  {
    id: 'competition-ready',
    label: 'Competition-Ready',
    desc: 'Pressure training, match habits, routines, and tournament behavior.',
    impact: 'Templates include pressure blocks and competitive scoring.',
  },
  {
    id: 'joy-retention',
    label: 'Joy + Retention',
    desc: 'Fun, belonging, energy, confidence, and long-term love of the game.',
    impact: 'Session blocks favor game forms, mini-competitions, and celebration moments.',
  },
]

const MAX_STYLES = 3

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

function toggleStyle(arr: string[], id: string, max: number): string[] {
  if (arr.includes(id)) return arr.filter(i => i !== id)
  if (arr.length >= max) return [...arr.slice(0, max - 1), id]
  return [...arr, id]
}

export function CoachingDnaStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const selectedStyles = draft.coachingStyles

  const selectedLabels = selectedStyles
    .map(id => COACHING_STYLES.find(s => s.id === id)?.label)
    .filter(Boolean)
    .join(' + ')

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={3}
        totalSteps={12}
        title="How do you want players to learn?"
        subtitle="Select up to 3 coaching styles that define your academy's philosophy."
      />

      {/* Coaching Styles */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Coaching Styles
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={[
                  'w-6 h-1.5 rounded-full transition-all',
                  i < selectedStyles.length ? 'bg-lime' : 'bg-border',
                ].join(' ')}
              />
            ))}
            <span className="text-[10px] text-text-muted ml-1">{selectedStyles.length}/3</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COACHING_STYLES.map(style => {
            const isSelected = selectedStyles.includes(style.id)
            const rank = selectedStyles.indexOf(style.id) + 1
            const isDisabled = !isSelected && selectedStyles.length >= MAX_STYLES

            return (
              <button
                key={style.id}
                onClick={() => !isDisabled && updateDraft({ coachingStyles: toggleStyle(selectedStyles, style.id, MAX_STYLES) })}
                disabled={isDisabled}
                className={[
                  'relative text-left rounded-xl border px-4 py-3.5 transition-all overflow-hidden',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : isDisabled
                      ? 'bg-surface border-border opacity-40 cursor-not-allowed'
                      : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime to-lime/50" />
                )}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-lime flex items-center justify-center text-[9px] font-bold text-base">
                    {rank}
                  </span>
                )}
                <p className={[
                  'text-sm font-semibold leading-tight mb-1 pr-6',
                  isSelected ? 'text-text-primary' : 'text-text-secondary',
                ].join(' ')}>
                  {style.label}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">
                  {style.desc}
                </p>
                {isSelected && (
                  <p className="text-[10px] text-lime/70 leading-relaxed">
                    {style.impact}
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {selectedStyles.length > 0 && (
          <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Coaching style: <span className="text-lime font-semibold">{selectedLabels}</span>
              {selectedStyles.length === MAX_STYLES && (
                <span className="text-text-muted"> — I'll shape curriculum, session templates, and coach cues around this.</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 transition-all shadow-lime"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

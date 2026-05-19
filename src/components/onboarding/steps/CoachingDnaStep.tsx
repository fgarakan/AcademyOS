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

const COMM_STYLES = [
  { id: 'direct-clear',         label: 'Direct + Clear',         desc: 'Simple commands, clear standards, fast corrections.',        example: '"Elbow up. Reset. Again."' },
  { id: 'encouraging-positive', label: 'Encouraging + Positive', desc: 'Confidence-building while still correcting.',                 example: '"Good effort — try bending the knees more."' },
  { id: 'question-led',         label: 'Question-Led',           desc: 'Guided discovery through smart questions.',                   example: '"What happened when you aimed cross-court?"' },
  { id: 'high-energy',          label: 'High-Energy Motivator',  desc: 'Energy, enthusiasm, and session momentum.',                   example: '"YES. That\'s it — keep that swing path!"' },
  { id: 'calm-precise',         label: 'Calm + Precise',         desc: 'Low-noise, technical, focused coaching.',                     example: '"Two-beat rhythm. Contact point forward."' },
  { id: 'standards-based',      label: 'Standards-Based',        desc: 'Clear expectations, accountability, and consistency.',         example: '"We do this every session until it\'s automatic."' },
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
  const primary   = draft.primaryCommunication
  const secondary = draft.secondaryCommunication

  const setPrimary = (id: string) => {
    if (secondary === id) {
      updateDraft({ primaryCommunication: id, secondaryCommunication: '' })
    } else {
      updateDraft({ primaryCommunication: id })
    }
  }

  const setSecondary = (id: string) => {
    if (primary === id) return
    updateDraft({ secondaryCommunication: secondary === id ? '' : id })
  }

  const selectedLabels = selectedStyles
    .map(id => COACHING_STYLES.find(s => s.id === id)?.label)
    .filter(Boolean)
    .join(' + ')

  const primaryLabel   = COMM_STYLES.find(s => s.id === primary)?.label
  const secondaryLabel = COMM_STYLES.find(s => s.id === secondary)?.label

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={3}
        totalSteps={7}
        title="How do you want players to learn?"
        subtitle="Select up to 3 primary coaching styles and your communication voice."
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

      {/* Communication Style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Communication Voice
          </p>
          <div className="flex items-center gap-2">
            <span className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border',
              primary ? 'bg-lime/8 border-lime/30 text-lime' : 'bg-surface border-border text-text-muted',
            ].join(' ')}>
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
              Primary: {primaryLabel ?? 'Not selected'}
            </span>
            <span className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border',
              secondary ? 'bg-surface-raised border-border-strong text-text-secondary' : 'bg-surface border-border text-text-muted',
            ].join(' ')}>
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted inline-block" />
              Secondary: {secondaryLabel ?? 'Optional'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMM_STYLES.map(style => {
            const isPrimary   = primary === style.id
            const isSecondary = secondary === style.id

            return (
              <div
                key={style.id}
                className={[
                  'relative rounded-xl border px-4 py-3.5 transition-all overflow-hidden',
                  isPrimary || isSecondary
                    ? 'bg-lime/5 border-lime/30'
                    : 'bg-surface border-border',
                ].join(' ')}
              >
                {(isPrimary || isSecondary) && (
                  <span className={[
                    'absolute top-0 left-0 right-0 h-0.5',
                    isPrimary ? 'bg-lime' : 'bg-border-strong',
                  ].join(' ')} />
                )}
                {(isPrimary || isSecondary) && (
                  <span className={[
                    'absolute top-2 right-2 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                    isPrimary ? 'bg-lime text-base' : 'bg-surface-raised text-text-secondary',
                  ].join(' ')}>
                    {isPrimary ? 'Primary' : 'Secondary'}
                  </span>
                )}
                <p className="text-sm font-semibold text-text-secondary mb-1 leading-tight pr-16">
                  {style.label}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                  {style.desc}
                </p>
                <p className="text-[10px] text-text-muted/60 italic mb-3">
                  {style.example}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrimary(style.id)}
                    className={[
                      'flex-1 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide border transition-all',
                      isPrimary
                        ? 'bg-lime text-base border-lime'
                        : 'bg-surface-raised border-border text-text-muted hover:border-lime/30 hover:text-lime',
                    ].join(' ')}
                  >
                    Primary
                  </button>
                  <button
                    onClick={() => setSecondary(style.id)}
                    disabled={isPrimary}
                    className={[
                      'flex-1 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide border transition-all',
                      isSecondary
                        ? 'bg-surface-raised border-border-strong text-text-primary'
                        : isPrimary
                          ? 'opacity-30 cursor-not-allowed bg-surface border-border text-text-muted'
                          : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
                    ].join(' ')}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {primary && (
          <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              I'll shape coach notes, session cues, player feedback, and parent-safe language around your communication voice.
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

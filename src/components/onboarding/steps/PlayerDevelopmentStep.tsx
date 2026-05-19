'use client'

import { ArrowRight, ArrowLeft, Sparkles, ChevronUp, ChevronDown, X } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const DEV_PRIORITIES = [
  {
    id: 'technical-foundation',
    label: 'Technical Foundation',
    desc: 'Grips, swings, contact point, and stroke mechanics.',
  },
  {
    id: 'tactical-iq',
    label: 'Tactical IQ',
    desc: 'Pattern recognition, point construction, and decision-making.',
  },
  {
    id: 'movement-quality',
    label: 'Movement Quality',
    desc: 'Footwork, split step, court coverage, and recovery.',
  },
  {
    id: 'competitive-toughness',
    label: 'Competitive Toughness',
    desc: 'Mental resilience, pressure performance, and match habits.',
  },
  {
    id: 'emotional-regulation',
    label: 'Emotional Regulation',
    desc: 'Managing frustration, staying process-focused, reset routines.',
  },
  {
    id: 'consistency',
    label: 'Consistency + Rally Tolerance',
    desc: 'Keeping the ball in play, high-percentage shot selection.',
  },
  {
    id: 'aggressive-identity',
    label: 'Aggressive Identity',
    desc: 'Taking time away, hitting through pressure, winner mentality.',
  },
  {
    id: 'all-court',
    label: 'All-Court Development',
    desc: 'Net game, serve and volley, approach shots, and passing shots.',
  },
  {
    id: 'serve-return',
    label: 'Serve + Return Priority',
    desc: 'Winning the first ball, placement and consistency on first strike.',
  },
  {
    id: 'independence',
    label: 'Independence + Ownership',
    desc: 'Self-coaching, practice habits, and intrinsic motivation.',
  },
]

const MAX_PRIORITIES = 5

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function PlayerDevelopmentStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const priorities = draft.developmentPriorities

  const toggle = (id: string) => {
    if (priorities.includes(id)) {
      updateDraft({ developmentPriorities: priorities.filter(p => p !== id) })
    } else if (priorities.length < MAX_PRIORITIES) {
      updateDraft({ developmentPriorities: [...priorities, id] })
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...priorities]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    updateDraft({ developmentPriorities: next })
  }

  const moveDown = (index: number) => {
    if (index === priorities.length - 1) return
    const next = [...priorities]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    updateDraft({ developmentPriorities: next })
  }

  const remove = (id: string) => {
    updateDraft({ developmentPriorities: priorities.filter(p => p !== id) })
  }

  const hasSelection = priorities.length > 0
  const atMax = priorities.length >= MAX_PRIORITIES

  const priorityLabel = (id: string) => DEV_PRIORITIES.find(p => p.id === id)?.label ?? id

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={6}
        totalSteps={10}
        title="What does great player development look like?"
        subtitle="Choose up to 5 development priorities in the order that matters most to your academy."
      />

      <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
          How this shapes your system
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { label: 'Player missions', desc: 'Mission goals align with your top priorities.' },
            { label: 'Coach observations', desc: 'Session prompts highlight these areas.' },
            { label: 'Skill path labels', desc: 'Player portal shows priorities in rank order.' },
            { label: 'DONNA recommendations', desc: 'Suggestions reflect what matters most here.' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-lime/60 shrink-0 mt-1.5" />
              <div>
                <span className="text-[10px] font-semibold text-text-secondary">{item.label} </span>
                <span className="text-[10px] text-text-muted">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranked stack */}
      {hasSelection && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
              Your top priorities — ranked
            </p>
            <span className="text-[10px] font-mono text-text-muted">
              <span className="text-lime">{priorities.length}</span>/{MAX_PRIORITIES}
            </span>
          </div>
          <div className="rounded-xl bg-surface border border-border overflow-hidden divide-y divide-border">
            {priorities.map((id, index) => (
              <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-lime leading-none">{index + 1}</span>
                </span>
                <span className="flex-1 text-xs font-medium text-text-primary">{priorityLabel(id)}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={[
                      'p-1 rounded-lg transition-all',
                      index === 0
                        ? 'text-text-muted/20 cursor-not-allowed'
                        : 'text-text-muted hover:text-lime hover:bg-lime/8',
                    ].join(' ')}
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === priorities.length - 1}
                    className={[
                      'p-1 rounded-lg transition-all',
                      index === priorities.length - 1
                        ? 'text-text-muted/20 cursor-not-allowed'
                        : 'text-text-muted hover:text-lime hover:bg-lime/8',
                    ].join(' ')}
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(id)}
                    className="p-1 rounded-lg text-text-muted hover:text-status-red hover:bg-status-red/8 transition-all"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection options */}
      <div className="mb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
          {atMax ? 'Maximum reached — remove one to add another' : 'Select priorities to add'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {DEV_PRIORITIES.map(priority => {
          const isSelected = priorities.includes(priority.id)
          const index = priorities.indexOf(priority.id)
          const isDisabled = atMax && !isSelected

          return (
            <button
              key={priority.id}
              onClick={() => toggle(priority.id)}
              disabled={isDisabled}
              className={[
                'text-left rounded-xl border px-4 py-3 transition-all',
                isSelected
                  ? 'bg-lime/5 border-lime/30'
                  : isDisabled
                    ? 'bg-surface border-border opacity-40 cursor-not-allowed'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                {isSelected ? (
                  <span className="w-4 h-4 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-lime">{index + 1}</span>
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={[
                    'text-xs font-semibold mb-0.5',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {priority.label}
                  </p>
                  <p className="text-[10px] text-text-muted leading-snug">{priority.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasSelection && (
        <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            DONNA will weight player missions, coach session prompts, and skill path labels around your top{' '}
            <span className="text-lime font-semibold">{priorities.length} {priorities.length === 1 ? 'priority' : 'priorities'}</span>.
            Rank order matters — priority 1 is your academy's north star.
          </p>
        </div>
      )}

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
        {!hasSelection && (
          <button
            onClick={onNext}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Draft only — nothing published or sent until activation.
      </p>
    </div>
  )
}

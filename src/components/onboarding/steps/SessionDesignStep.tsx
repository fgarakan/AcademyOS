'use client'

import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const SESSION_BLOCKS = [
  {
    id: 'technique-blocks',
    label: 'Technique Blocks',
    desc: 'Structured rep blocks with coach-led correction. Forehand, backhand, serve mechanics.',
    color: 'bg-status-blue/8 border-status-blue/30 text-status-blue',
    barColor: 'bg-status-blue',
    duration: 20,
  },
  {
    id: 'live-ball-heavy',
    label: 'Live Ball Heavy',
    desc: 'Most of the session is fed or played live. Minimal stopping to explain technique.',
    color: 'bg-status-green/8 border-status-green/30 text-status-green',
    barColor: 'bg-status-green',
    duration: 25,
  },
  {
    id: 'constraint-games',
    label: 'Constraint Games',
    desc: 'Modified games with specific rules to develop skills indirectly. Creative and engaging.',
    color: 'bg-lime/8 border-lime/30 text-lime',
    barColor: 'bg-lime',
    duration: 15,
  },
  {
    id: 'point-play',
    label: 'Point Play Progression',
    desc: 'Cooperative rally builds to competitive rally builds to live point play in every session.',
    color: 'bg-status-orange/8 border-status-orange/30 text-status-orange',
    barColor: 'bg-status-orange',
    duration: 15,
  },
  {
    id: 'stations',
    label: 'Stations + Rotations',
    desc: 'Multiple stations running simultaneously. Keeps players active and covers more ground.',
    color: 'bg-purple-500/8 border-purple-500/30 text-purple-400',
    barColor: 'bg-purple-500',
    duration: 20,
  },
  {
    id: 'assessment',
    label: 'Assessment Moments',
    desc: 'Deliberate checkpoints where coaches observe and record player readiness vs. targets.',
    color: 'bg-status-red/8 border-status-red/30 text-status-red',
    barColor: 'bg-status-red',
    duration: 10,
  },
  {
    id: 'fitness-integrated',
    label: 'Fitness Integrated',
    desc: 'Athletic prep, footwork, and conditioning woven into the session rather than added on.',
    color: 'bg-yellow-400/8 border-yellow-400/30 text-yellow-400',
    barColor: 'bg-yellow-400',
    duration: 10,
  },
]

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function SessionDesignStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const selected = draft.sessionBlocks

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      updateDraft({ sessionBlocks: selected.filter(s => s !== id) })
    } else {
      updateDraft({ sessionBlocks: [...selected, id] })
    }
  }

  const selectedBlocks = SESSION_BLOCKS.filter(b => selected.includes(b.id))
  const hasSelection = selected.length > 0

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={5}
        totalSteps={10}
        title="How should a normal session feel?"
        subtitle="This helps DONNA shape future class templates and coach session plans."
      />

      <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
          How this shapes your system
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { label: 'Class templates', desc: 'Block order and duration defaults.' },
            { label: 'Coach session plans', desc: 'Prep notes and on-court emphasis.' },
            { label: 'DONNA suggestions', desc: 'Template recommendations align with your approach.' },
            { label: 'Wrap-up questions', desc: 'Post-session prompts match your session style.' },
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

      {/* Live timeline preview */}
      {hasSelection && (
        <div className="mb-5 rounded-xl bg-surface-raised border border-border px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2.5">
            Default session shape
          </p>
          {/* Proportional bar — flex value equals block duration in minutes */}
          <div className="flex h-6 rounded-lg overflow-hidden gap-px">
            {selectedBlocks.map(block => (
              <div
                key={block.id}
                title={`${block.label} — ${block.duration} min`}
                className={[block.barColor, 'opacity-70'].join(' ')}
                style={{ flex: block.duration }}
              />
            ))}
          </div>
          {/* Duration labels aligned under each segment */}
          <div className="flex gap-px mt-1">
            {selectedBlocks.map(block => (
              <div
                key={block.id}
                className="overflow-hidden text-center"
                style={{ flex: block.duration }}
              >
                <span className="text-[8px] font-mono text-text-muted/50">{block.duration}m</span>
              </div>
            ))}
          </div>
          {/* Legend pills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedBlocks.map(block => (
              <span
                key={block.id}
                className={['inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border', block.color].join(' ')}
              >
                {block.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Block options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {SESSION_BLOCKS.map(block => {
          const isSelected = selected.includes(block.id)
          return (
            <button
              key={block.id}
              onClick={() => toggle(block.id)}
              className={[
                'text-left rounded-xl border px-4 py-3.5 transition-all',
                isSelected
                  ? 'bg-lime/5 border-lime/30'
                  : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={[
                  'text-sm font-semibold leading-tight',
                  isSelected ? 'text-text-primary' : 'text-text-secondary',
                ].join(' ')}>
                  {block.label}
                </p>
                {isSelected && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime block" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{block.desc}</p>
            </button>
          )
        })}
      </div>

      {hasSelection && (
        <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            DONNA will shape class templates and session plans around{' '}
            <span className="text-lime font-semibold">{selected.length} session {selected.length === 1 ? 'preference' : 'preferences'}</span>.
            Coaches will see these as default session structure suggestions.
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
        Draft only — no templates created until after activation.
      </p>
    </div>
  )
}

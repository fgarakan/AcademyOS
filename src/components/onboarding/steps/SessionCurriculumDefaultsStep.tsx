'use client'

import { ArrowRight, ArrowLeft, Sparkles, GripVertical, X } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const SESSION_BLOCKS = [
  { id: 'technique-blocks', label: 'Technique Blocks',       desc: 'Structured rep and technical development.',                       duration: 20, color: '#11d9df' },
  { id: 'live-ball-heavy',  label: 'Live Ball Heavy',         desc: 'Rally-based learning and open-skill environments.',               duration: 25, color: '#52e36f' },
  { id: 'constraint-games', label: 'Constraint Games',        desc: 'Rules, targets, scoring, and limitations that teach.',            duration: 20, color: '#ffb020' },
  { id: 'point-play',       label: 'Point Play Progression',  desc: 'Cooperative rally to competitive rally to point play.',           duration: 20, color: '#ff4d55' },
  { id: 'stations',         label: 'Stations + Rotations',    desc: 'Multiple stations for larger groups and multi-court setups.',     duration: 25, color: '#b56cff' },
  { id: 'assessment',       label: 'Assessment Moments',      desc: 'Short check-ins to capture evidence and coach notes.',            duration: 10, color: '#ffb020' },
  { id: 'fitness-integrated', label: 'Fitness Integrated',   desc: 'Physical development built into tennis sessions.',                duration: 15, color: '#11d9df' },
]

const FIXED_BLOCKS = [
  { label: 'Warm-Up',    duration: 10 },
  { label: 'Reflection', duration: 5 },
]

const DEV_PRIORITIES = [
  { id: 'technical-foundation',   label: 'Technical Foundation' },
  { id: 'tactical-iq',            label: 'Tactical IQ' },
  { id: 'movement-quality',       label: 'Movement Quality' },
  { id: 'competitive-toughness',  label: 'Competitive Toughness' },
  { id: 'emotional-regulation',   label: 'Emotional Regulation' },
  { id: 'consistency',            label: 'Consistency + Rally Tolerance' },
  { id: 'aggressive-identity',    label: 'Aggressive Identity' },
  { id: 'all-court',              label: 'All-Court Development' },
  { id: 'serve-return',           label: 'Serve + Return Priority' },
  { id: 'independence',           label: 'Independence + Ownership' },
]

const MAX_PRIORITIES = 5

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

function toggleItem(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]
}

function togglePriority(arr: string[], id: string): string[] {
  if (arr.includes(id)) return arr.filter(i => i !== id)
  if (arr.length >= MAX_PRIORITIES) return arr
  return [...arr, id]
}

export function SessionCurriculumDefaultsStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const blocks     = draft.sessionBlocks
  const priorities = draft.developmentPriorities

  const timelineBlocks = [
    FIXED_BLOCKS[0],
    ...blocks
      .map(id => SESSION_BLOCKS.find(b => b.id === id))
      .filter(Boolean)
      .map(b => ({ label: b!.label, duration: b!.duration })),
    FIXED_BLOCKS[1],
  ]
  const totalDuration = timelineBlocks.reduce((s, b) => s + b.duration, 0)

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={4}
        totalSteps={7}
        title="How should a typical session be built?"
        subtitle="Select session building blocks and your player development focus."
      />

      {/* Session Blocks */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Session Building Blocks
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {SESSION_BLOCKS.map(block => {
            const isSelected = blocks.includes(block.id)
            return (
              <button
                key={block.id}
                onClick={() => updateDraft({ sessionBlocks: toggleItem(blocks, block.id) })}
                className={[
                  'relative text-left rounded-xl border px-4 py-3 transition-all overflow-hidden',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-lime" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <p className={[
                    'text-sm font-semibold leading-tight flex-1',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {block.label}
                  </p>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-base">✓</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mb-1">
                  {block.desc}
                </p>
                <p className={[
                  'text-[10px] font-semibold',
                  isSelected ? 'text-lime' : 'text-text-muted/60',
                ].join(' ')}>
                  ~{block.duration} min
                </p>
              </button>
            )
          })}
        </div>

        {/* Live timeline preview */}
        <div className="rounded-xl bg-surface border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Session Preview
            </p>
            <p className="text-[10px] font-mono text-text-muted">~{totalDuration} min total</p>
          </div>
          <div className="flex gap-1 h-8 mb-1">
            {timelineBlocks.map((block, i) => (
              <div
                key={i}
                className="flex-1 rounded border border-border bg-surface-raised flex items-center justify-center min-w-0 overflow-hidden transition-all"
                style={{ flex: block.duration }}
              >
                <span className="text-[9px] font-semibold text-text-muted px-1 truncate whitespace-nowrap">
                  {block.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {timelineBlocks.map((block, i) => (
              <div key={i} style={{ flex: block.duration }} className="text-center min-w-0 overflow-hidden">
                <span className="text-[8px] font-mono text-text-muted/50 whitespace-nowrap">{block.duration}m</span>
              </div>
            ))}
          </div>
          {blocks.length === 0 && (
            <p className="text-[11px] text-text-muted/50 text-center mt-2">
              Select blocks above to build your session
            </p>
          )}
        </div>

        {blocks.length > 0 && (
          <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              I'll prepare your default session structure with:{' '}
              <span className="text-lime font-medium">
                {blocks.map(id => SESSION_BLOCKS.find(b => b.id === id)?.label).filter(Boolean).join(' → ')}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Development Priorities */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Development Priorities
          </p>
          <span className="text-[10px] text-text-muted">
            {priorities.length}/{MAX_PRIORITIES} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {DEV_PRIORITIES.map(p => {
            const isSelected = priorities.includes(p.id)
            const rank = priorities.indexOf(p.id) + 1
            const isMaxed = !isSelected && priorities.length >= MAX_PRIORITIES

            return (
              <button
                key={p.id}
                onClick={() => !isMaxed && updateDraft({ developmentPriorities: togglePriority(priorities, p.id) })}
                disabled={isMaxed}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 text-lime'
                    : isMaxed
                      ? 'opacity-30 cursor-not-allowed bg-surface border-border text-text-muted'
                      : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center text-[8px] font-bold text-base shrink-0">
                    {rank}
                  </span>
                )}
                {p.label}
              </button>
            )
          })}
        </div>

        {priorities.length > 0 && (
          <div className="rounded-xl bg-surface border border-border p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
              Priority Rank
            </p>
            <div className="flex flex-col gap-1">
              {priorities.map((id, i) => {
                const data = DEV_PRIORITIES.find(p => p.id === id)
                if (!data) return null
                return (
                  <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center text-[8px] font-bold text-base shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xs text-text-secondary">{data.label}</span>
                    <button
                      onClick={() => updateDraft({ developmentPriorities: priorities.filter(p => p !== id) })}
                      className="p-0.5 hover:text-text-primary text-text-muted transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {priorities.length >= 3 && (
          <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              These priorities will shape level requirements, player dashboards, coach watch-fors, and parent updates.
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

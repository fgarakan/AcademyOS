'use client'

import { ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const CURRICULUM_STARTERS = [
  {
    id: 'academyos-starter',
    label: 'AcademyOS Starter',
    desc: 'DONNA\'s default curriculum — level gates, skill paths, and session defaults ready to customize.',
    tag: 'Recommended',
  },
  {
    id: 'performance-focused',
    label: 'Performance-Focused',
    desc: 'High-intensity structure built for competitive development. Strong on tactical and match-play progression.',
    tag: null,
  },
  {
    id: 'development-pathway',
    label: 'Development Pathway',
    desc: 'Long-term athlete development model. Emphasizes movement quality, coordination, and progressive challenge.',
    tag: null,
  },
  {
    id: 'blank',
    label: 'Start from Blank',
    desc: 'No defaults. Build every level, gate, and session structure from scratch.',
    tag: null,
  },
  {
    id: 'customize-later',
    label: 'Customize Later',
    desc: 'Use AcademyOS defaults for now. Return to curriculum setup after activation.',
    tag: 'Quickest',
  },
]

const FOCUS_LEVELS = [
  { id: 'red-ball',            label: 'Red Ball',              sub: 'Ages 4-8' },
  { id: 'orange-ball',         label: 'Orange Ball',           sub: 'Ages 8-10' },
  { id: 'green-ball',          label: 'Green Ball',            sub: 'Ages 10-11' },
  { id: 'yellow-ball-juniors', label: 'Yellow Ball Juniors',   sub: 'Ages 11-14' },
  { id: 'high-performance',    label: 'High Performance',      sub: 'Ages 14+' },
  { id: 'adult-programs',      label: 'Adult Programs',        sub: 'All levels' },
]

const SESSION_BLOCKS = [
  { id: 'technique-blocks', label: 'Technique Blocks',      desc: 'Structured rep and technical development.',          duration: 20 },
  { id: 'live-ball-heavy',  label: 'Live Ball Heavy',        desc: 'Rally-based learning and open-skill environments.',  duration: 25 },
  { id: 'constraint-games', label: 'Constraint Games',       desc: 'Rules, targets, scoring, and limitations that teach.', duration: 20 },
  { id: 'point-play',       label: 'Point Play Progression', desc: 'Cooperative rally to competitive rally to point play.', duration: 20 },
  { id: 'stations',         label: 'Stations + Rotations',   desc: 'Multiple stations for larger groups.',              duration: 25 },
  { id: 'assessment',       label: 'Assessment Moments',     desc: 'Short check-ins to capture evidence and coach notes.', duration: 10 },
  { id: 'fitness-integrated', label: 'Fitness Integrated',   desc: 'Physical development built into tennis sessions.',  duration: 15 },
]

const FIXED_BLOCKS = [
  { label: 'Warm-Up',    duration: 10 },
  { label: 'Reflection', duration: 5 },
]

const DEV_PRIORITIES = [
  { id: 'technical-foundation',  label: 'Technical Foundation' },
  { id: 'tactical-iq',           label: 'Tactical IQ' },
  { id: 'movement-quality',      label: 'Movement Quality' },
  { id: 'competitive-toughness', label: 'Competitive Toughness' },
  { id: 'emotional-regulation',  label: 'Emotional Regulation' },
  { id: 'consistency',           label: 'Consistency + Rally Tolerance' },
  { id: 'aggressive-identity',   label: 'Aggressive Identity' },
  { id: 'all-court',             label: 'All-Court Development' },
  { id: 'serve-return',          label: 'Serve + Return Priority' },
  { id: 'independence',          label: 'Independence + Ownership' },
]

const MAX_PRIORITIES = 5

function toggleItem(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]
}

function togglePriority(arr: string[], id: string): string[] {
  if (arr.includes(id)) return arr.filter(i => i !== id)
  if (arr.length >= MAX_PRIORITIES) return arr
  return [...arr, id]
}

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function CurriculumBuilderStep({ draft, updateDraft, onNext, onPrev }: Props) {
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
        totalSteps={11}
        title="Curriculum Builder"
        subtitle="Choose your curriculum starting point and set up session structure defaults."
      />

      {/* Curriculum Starting Point */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Curriculum Starting Point
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CURRICULUM_STARTERS.map(starter => {
            const isSelected = draft.curriculumStartingPoint === starter.id
            return (
              <button
                key={starter.id}
                onClick={() => updateDraft({ curriculumStartingPoint: starter.id })}
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
                    {starter.label}
                  </p>
                  {starter.tag && (
                    <span className="text-[8px] font-bold uppercase tracking-wide text-lime bg-lime/8 border border-lime/20 rounded px-1.5 py-0.5 shrink-0">
                      {starter.tag}
                    </span>
                  )}
                  {isSelected && !starter.tag && (
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-base">&#x2713;</span>
                    </span>
                  )}
                </div>
                <p className={[
                  'text-[11px] leading-relaxed',
                  isSelected ? 'text-text-secondary' : 'text-text-muted',
                ].join(' ')}>
                  {starter.desc}
                </p>
              </button>
            )
          })}
        </div>

        {draft.curriculumStartingPoint && draft.curriculumStartingPoint !== 'customize-later' && (
          <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              I'll build your curriculum structure from the{' '}
              <span className="text-lime font-medium">
                {CURRICULUM_STARTERS.find(s => s.id === draft.curriculumStartingPoint)?.label}
              </span>{' '}
              starting point. You can customize levels, gates, and skill paths after activation.
            </p>
          </div>
        )}
      </div>

      {/* Focus Levels */}
      {draft.curriculumStartingPoint && draft.curriculumStartingPoint !== 'customize-later' && (
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Focus Levels
          </p>
          <p className="text-[11px] text-text-muted mb-3">
            Which levels are you actively running? I'll prioritize these in your starting curriculum.
          </p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_LEVELS.map(level => {
              const isSelected = draft.curriculumFocusLevels.includes(level.id)
              return (
                <button
                  key={level.id}
                  onClick={() => updateDraft({ curriculumFocusLevels: toggleItem(draft.curriculumFocusLevels, level.id) })}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'bg-lime/8 border-lime/40 text-lime'
                      : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
                  ].join(' ')}
                >
                  <div>
                    <p className="text-xs font-semibold leading-tight">{level.label}</p>
                    <p className="text-[9px] text-text-muted/70 leading-tight">{level.sub}</p>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-base">&#x2713;</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Session Building Blocks */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Default Session Structure
        </p>
        <p className="text-[11px] text-text-muted mb-3">
          Select the building blocks for a typical session. These feed into your first class template.
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
                      <span className="text-[9px] font-bold text-base">&#x2713;</span>
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

        {/* Timeline preview */}
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
                {blocks.map(id => SESSION_BLOCKS.find(b => b.id === id)?.label).filter(Boolean).join(' -> ')}
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
        {!draft.curriculumStartingPoint && (
          <button
            onClick={onNext}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

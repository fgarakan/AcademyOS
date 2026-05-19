'use client'

import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const PARENT_STYLES = [
  {
    id: 'informed-partner',
    label: 'Informed Partner',
    desc: 'Parents receive clear progress context and understand the development process.',
    tone: 'Educational, transparent, structured.',
  },
  {
    id: 'development-focused',
    label: 'Development-Focused',
    desc: 'Updates center on development milestones, not results or rankings.',
    tone: 'Process over outcome, long-term view.',
  },
  {
    id: 'competition-aware',
    label: 'Competition-Aware',
    desc: 'Parents receive match context and competitive development updates.',
    tone: 'Results included with development framing.',
  },
  {
    id: 'minimal-interference',
    label: 'Minimal Interference',
    desc: 'Limited information shared. Coaches run development; parents trust the process.',
    tone: 'Calm, brief, reassuring.',
  },
  {
    id: 'high-involvement',
    label: 'High Involvement',
    desc: 'Frequent updates, clear action items, and regular communication check-ins.',
    tone: 'Detailed, frequent, collaborative.',
  },
  {
    id: 'emotion-safe',
    label: 'Emotion-Safe Zone',
    desc: 'Communication avoids pressure language. Builds confidence and joy in the process.',
    tone: 'Warm, encouraging, low-stakes framing.',
  },
  {
    id: 'data-driven',
    label: 'Data-Driven',
    desc: 'Parents see structured metrics, development scores, and clear progress indicators.',
    tone: 'Metric-forward, objective, comparative to prior self.',
  },
]

const SAFETY_RULES = [
  { label: 'No raw coach notes', desc: 'Internal coaching observations are not shared directly.' },
  { label: 'No internal director notes', desc: 'Director-only flags and strategy are never visible to parents.' },
  { label: 'No rankings or comparisons', desc: 'Parents never see how their child ranks against others.' },
  { label: 'No player comparisons', desc: 'Progress is always compared to the child\'s own prior performance.' },
  { label: 'No unapproved AI content', desc: 'DONNA drafts must be director-approved before parents see them.' },
]

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function ParentCommunicationStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const selected = draft.parentStyles

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      updateDraft({ parentStyles: selected.filter(s => s !== id) })
    } else {
      updateDraft({ parentStyles: [...selected, id] })
    }
  }

  const hasSelection = selected.length > 0
  const selectedStyle = PARENT_STYLES.find(s => selected.includes(s.id))

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={7}
        totalSteps={10}
        title="How should parents experience your academy?"
        subtitle="This shapes the language, detail level, and tone of everything parents see in their portal."
      />

      {/* Always-on safety rules */}
      <div className="mb-6 rounded-xl bg-surface border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-raised border-b border-border flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-status-green shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Always-on parent safety rules
          </p>
          <span className="ml-auto text-[8px] font-bold uppercase tracking-wide text-status-green bg-status-green/8 border border-status-green/20 rounded px-1.5 py-0.5">
            Active
          </span>
        </div>
        <div className="divide-y divide-border">
          {SAFETY_RULES.map(rule => (
            <div key={rule.label} className="px-4 py-2.5 flex items-start gap-2.5">
              <span className="w-3 h-3 rounded-full bg-status-green/20 border border-status-green/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-status-green block" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-text-secondary">{rule.label}</p>
                <p className="text-[10px] text-text-muted leading-snug">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-surface-raised/50">
          <p className="text-[10px] text-text-muted/70 leading-relaxed">
            These rules are enforced by AcademyOS and cannot be disabled. They protect player privacy and maintain professional boundaries.
          </p>
        </div>
      </div>

      {/* Communication style */}
      <div className="mb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Choose your parent communication style
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PARENT_STYLES.map(style => {
            const isSelected = selected.includes(style.id)
            return (
              <button
                key={style.id}
                onClick={() => toggle(style.id)}
                className={[
                  'text-left rounded-xl border px-4 py-3.5 transition-all',
                  isSelected
                    ? 'bg-lime/5 border-lime/30'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className={[
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {style.label}
                  </p>
                  {isSelected && (
                    <span className="shrink-0 w-4 h-4 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime block" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">{style.desc}</p>
                <p className="text-[10px] text-text-muted/60 italic">{style.tone}</p>
              </button>
            )
          })}
        </div>
      </div>

      {hasSelection && selectedStyle && (
        <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            Parent portal language will reflect a{' '}
            <span className="text-lime font-semibold">{selectedStyle.label}</span> approach.
            DONNA will use this tone in all approved parent updates, progress summaries, and next-steps guidance.
          </p>
        </div>
      )}

      {!hasSelection && (
        <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
          <p className="text-[11px] text-text-muted leading-relaxed">
            A communication style helps DONNA write parent updates in your voice. You can set this now or return later from the director settings.
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
        Draft only — parent portal content requires director approval before any parent sees it.
      </p>
    </div>
  )
}

'use client'

import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const AGE_GROUPS = [
  { id: 'red-ball',         label: 'Red Ball',         sub: 'Ages 5–8',      color: 'bg-status-red/20 border-status-red/40 text-status-red' },
  { id: 'orange-ball',      label: 'Orange Ball',      sub: 'Ages 8–10',     color: 'bg-status-orange/20 border-status-orange/40 text-status-orange' },
  { id: 'green-ball',       label: 'Green Ball',       sub: 'Ages 9–11',     color: 'bg-status-green/20 border-status-green/40 text-status-green' },
  { id: 'yellow-ball',      label: 'Yellow Ball',      sub: 'Ages 10+',      color: 'bg-lime/20 border-lime/40 text-lime' },
  { id: 'high-performance', label: 'High Performance', sub: 'Elite juniors', color: 'bg-status-purple/20 border-status-purple/40 text-status-purple' },
  { id: 'adult',            label: 'Adult',            sub: 'All levels',    color: 'bg-surface-raised border-border-strong text-text-secondary' },
]

const ACADEMY_MODELS = [
  { id: 'junior-development', label: 'Junior Development',       desc: 'Long-term player development, structured progression' },
  { id: 'high-performance',   label: 'High Performance',         desc: 'Elite training, competition calendar, performance metrics' },
  { id: 'adult-program',      label: 'Adult Program',            desc: 'Adult recreation, fitness, and social tennis' },
  { id: 'private-coaching',   label: 'Private Coaching',         desc: 'Private lessons and small group coaching' },
  { id: 'multi-location',     label: 'Multi-Location Academy',   desc: 'Multiple sites and coaching groups' },
  { id: 'consultant-setup',   label: 'Consultant Setup',         desc: 'Setting up for a client academy' },
]

const PRIMARY_GOALS = [
  'Long-Term Athlete Development',
  'Competition Pathway',
  'Fun and Retention',
  'Physical Fitness',
  'College Pathway',
  'Professional Development',
  'Club and Social Tennis',
]

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

export function AcademyBasicsStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const canContinue = draft.academyName.trim().length > 0 || draft.academyModel.length > 0 || draft.ageGroups.length > 0

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={2}
        totalSteps={7}
        title="Tell me about your academy."
        subtitle="This shapes your curriculum levels, templates, and coach views."
      />

      {/* Academy Name */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
          Academy Name
        </label>
        <input
          type="text"
          value={draft.academyName}
          onChange={e => updateDraft({ academyName: e.target.value })}
          placeholder="e.g. Dabul Tennis Academy"
          className="w-full max-w-sm bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/20 transition-all"
        />
      </div>

      {/* Age Groups */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Primary Age Groups
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map(group => {
            const isSelected = draft.ageGroups.includes(group.id)
            return (
              <button
                key={group.id}
                onClick={() => updateDraft({ ageGroups: toggleItem(draft.ageGroups, group.id) })}
                className={[
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all',
                  isSelected
                    ? group.color
                    : 'bg-surface border-border text-text-secondary hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                <span className="font-semibold">{group.label}</span>
                <span className="text-[10px] opacity-70">{group.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Academy Model */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Academy Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACADEMY_MODELS.map(model => {
            const isSelected = draft.academyModel === model.id
            return (
              <button
                key={model.id}
                onClick={() => updateDraft({ academyModel: model.id })}
                className={[
                  'text-left rounded-xl border px-4 py-3 transition-all',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                <p className={[
                  'text-sm font-semibold leading-tight mb-0.5',
                  isSelected ? 'text-text-primary' : 'text-text-secondary',
                ].join(' ')}>
                  {model.label}
                </p>
                <p className={[
                  'text-[11px] leading-relaxed',
                  isSelected ? 'text-text-secondary' : 'text-text-muted',
                ].join(' ')}>
                  {model.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Primary Goals */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Primary Goals <span className="text-text-muted/50 normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_GOALS.map(goal => {
            const isSelected = draft.primaryGoals.includes(goal)
            return (
              <button
                key={goal}
                onClick={() => updateDraft({ primaryGoals: toggleItem(draft.primaryGoals, goal) })}
                className={[
                  'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 text-lime'
                    : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
                ].join(' ')}
              >
                {goal}
              </button>
            )
          })}
        </div>
      </div>

      {/* DONNA confirmation */}
      {(draft.ageGroups.length > 0 || draft.academyModel) && (
        <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            I'll use this to prepare your starting curriculum structure, class template defaults, and coach group setup.
          </p>
        </div>
      )}

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
          disabled={!canContinue}
          className={[
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            canContinue
              ? 'bg-lime text-base hover:brightness-110 shadow-lime'
              : 'bg-lime/20 text-lime/50 cursor-not-allowed',
          ].join(' ')}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

'use client'

import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'
import { DonnaAdjustmentDraftPanel } from '../DonnaAdjustmentDraftPanel'

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function DonnaAdjustmentStep({ draft, updateDraft, onNext, onPrev }: Props) {
  return (
    <div>
      <OnboardingStepHeader
        stepNumber={9}
        totalSteps={10}
        title="Fine-tune your Academy DNA with DONNA"
        subtitle="Request adjustments to coaching style, session design, player priorities, or parent communication. DONNA applies them to the draft."
      />

      <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
          <span className="font-bold text-lime text-[13px] leading-none select-none">D</span>
        </div>
        <div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-1">
            I've reviewed your Academy DNA draft. Use the quick adjustments below or describe what you'd like to change.
            All changes are applied to the local draft — nothing is saved until you activate.
          </p>
          <p className="text-[10px] text-text-muted/60">
            You can also go back to any previous step to edit sections directly.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <DonnaAdjustmentDraftPanel draft={draft} updateDraft={updateDraft} />
      </div>

      <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[12px] text-text-secondary leading-relaxed">
          All adjustments are applied to your local draft. Nothing is published or saved to the database.
          When you're ready, continue to the Final Activation step.
        </p>
      </div>

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
          Continue to Activation
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Skip adjustments
        </button>
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Draft only — not applied to your system until the Activation step.
      </p>
    </div>
  )
}

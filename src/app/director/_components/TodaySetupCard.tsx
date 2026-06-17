'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Sparkles } from 'lucide-react'
import type { SetupStep } from '@/lib/donna/today/todayBriefEngine'
import { DonnaAskButton } from './DonnaAskButton'

interface Props {
  steps: SetupStep[]
}

export function TodaySetupCard({ steps }: Props) {
  const completedCount = steps.filter(s => s.complete).length
  const total          = steps.length
  const nextStep       = steps.find(s => !s.complete) ?? null
  const allDone        = completedCount === total

  return (
    <div
      className="rounded-2xl border border-lime/20 bg-lime/[0.02] overflow-hidden"
      data-donna-focus-id="today-setup-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-lime/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <span className="text-[10px] uppercase tracking-widest text-lime font-semibold">
            Academy Onboarding
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold text-text-muted">
          {completedCount}/{total}
        </span>
      </div>

      {/* Headline */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[14px] font-semibold text-text-primary leading-snug">
          {allDone ? 'Setup complete — academy is live' : 'Complete setup to unlock your operating surface'}
        </p>
        <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
          {allDone
            ? 'All setup steps are done. DONNA can now track health, priorities, and risks.'
            : 'DONNA will not show health insights or priorities until setup is complete — to avoid showing misleading data.'}
        </p>
      </div>

      {/* Steps */}
      <div className="px-4 pb-3 space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.complete
              ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
              : <Circle className="w-4 h-4 text-text-muted shrink-0" />
            }
            <span className={`text-[12px] flex-1 leading-snug ${step.complete ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
              {step.label}
            </span>
            {!step.complete && (
              <Link
                href={step.actionHref}
                className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {step.actionLabel} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {!allDone && nextStep && (
        <div className="px-4 pb-4 flex items-center gap-4">
          <Link
            href={nextStep.actionHref}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-lime text-black px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Continue Setup →
          </Link>
          <DonnaAskButton prompt="help me set up my academy" label="Set up with DONNA" />
        </div>
      )}
    </div>
  )
}

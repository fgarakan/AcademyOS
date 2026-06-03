'use client'

// Sprint 1711 — DONNA Decision Guide Panel V1
// Reusable guided workflow panel for all director decision workflows.
// Shows: workflow title, step X of Y progress, current step detail,
// action button, approval badge, and "what DONNA will not do" safety note.
//
// Caller responsibility: build the workflow with decisionWorkflowEngine
// and manage currentStep state (increment on "Next Step" action).
// This component is display-only — no mutations.

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, X, ShieldCheck,
  CheckCircle2, Circle, ArrowRight,
} from 'lucide-react'
import type { DecisionWorkflow } from '@/lib/donna/workflows/decisionWorkflowEngine'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaDecisionGuidePanelProps {
  workflow:       DecisionWorkflow
  /** 1-based current step index */
  currentStep?:   number
  onStepChange?:  (step: number) => void
  onDismiss?:     () => void
  /** If true, always shows all steps as a checklist */
  showAllSteps?:  boolean
  className?:     string
}

// ─── Step dot ──────────────────────────────────────────────────────────────────

function StepDot({ done, active, num }: { done: boolean; active: boolean; num: number }) {
  if (done)   return <CheckCircle2 className="w-4 h-4 text-lime shrink-0" aria-label={`Step ${num} complete`} />
  if (active) return (
    <div className="w-4 h-4 rounded-full border-2 border-lime bg-lime/20 flex items-center justify-center shrink-0" aria-current="step">
      <span className="text-[8px] font-bold text-lime">{num}</span>
    </div>
  )
  return <Circle className="w-4 h-4 text-text-muted shrink-0" aria-label={`Step ${num} pending`} />
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DonnaDecisionGuidePanel({
  workflow,
  currentStep = 1,
  onStepChange,
  onDismiss,
  showAllSteps = false,
  className = '',
}: DonnaDecisionGuidePanelProps) {
  const [localStep, setLocalStep] = useState(currentStep)
  const step = workflow.steps[localStep - 1]
  if (!step) return null

  function goTo(n: number) {
    const clamped = Math.max(1, Math.min(workflow.totalSteps, n))
    setLocalStep(clamped)
    onStepChange?.(clamped)
  }

  const isFirst = localStep === 1
  const isLast  = localStep === workflow.totalSteps

  return (
    <div
      className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}
      data-donna-focus-id="donna-decision-guide"
      role="complementary"
      aria-label={`DONNA guided workflow: ${workflow.title}`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-surface-raised">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-lime">DONNA Guide</span>
          <span className="text-text-muted text-[10px]">·</span>
          <span className="text-[11px] font-medium text-text-primary truncate">{workflow.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-text-muted font-mono">
            {localStep}/{workflow.totalSteps}
          </span>
          {onDismiss && (
            <button
              className="p-1 rounded hover:bg-surface transition-colors text-text-muted hover:text-text-secondary"
              onClick={onDismiss}
              aria-label="Dismiss guide"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* ── Step list (always visible, compact) ─────────────────────────────── */}
      {showAllSteps && (
        <div className="px-4 py-2 space-y-1 border-b border-border">
          {workflow.steps.map(s => (
            <button
              key={s.stepNumber}
              className={`w-full flex items-center gap-2 py-1 text-left rounded hover:bg-surface-raised transition-colors ${s.stepNumber === localStep ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => goTo(s.stepNumber)}
              aria-current={s.stepNumber === localStep ? 'step' : undefined}
            >
              <StepDot done={s.stepNumber < localStep} active={s.stepNumber === localStep} num={s.stepNumber} />
              <span className={`text-[11px] truncate ${s.stepNumber === localStep ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                {s.title}
              </span>
              {s.requiresApproval && (
                <ShieldCheck className="w-3 h-3 text-text-muted ml-auto shrink-0" aria-label="Requires approval" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Current step detail ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2">
        {/* Step header */}
        <div className="flex items-start gap-2">
          <StepDot done={false} active num={step.stepNumber} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-text-primary">{step.title}</span>
              {step.requiresApproval && (
                <span className="flex items-center gap-0.5 text-[10px] text-status-orange border border-status-orange/30 bg-status-orange/10 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" aria-hidden />
                  Approval required
                </span>
              )}
            </div>
            <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Safety note */}
        <p className="text-[11px] text-text-muted italic">{step.donnaWillNotDo}</p>

        {/* Action button */}
        <Link
          href={step.actionHref}
          className="btn-lime inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5"
          data-donna-focus-id={step.focusId}
        >
          {step.actionLabel}
          <ArrowRight className="w-3 h-3" aria-hidden />
        </Link>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <button
          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors disabled:opacity-30"
          onClick={() => goTo(localStep - 1)}
          disabled={isFirst}
          aria-label="Previous step"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
          Previous
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {workflow.steps.map(s => (
            <button
              key={s.stepNumber}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${s.stepNumber === localStep ? 'bg-lime' : 'bg-border'}`}
              onClick={() => goTo(s.stepNumber)}
              aria-label={`Go to step ${s.stepNumber}`}
            />
          ))}
        </div>

        {isLast ? (
          <span className="text-[11px] text-lime font-medium">Complete</span>
        ) : (
          <button
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => goTo(localStep + 1)}
            aria-label="Next step"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* ── Safety footer ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-2 text-[10px] text-text-muted border-t border-border pt-1.5">
        {workflow.safetyNote}
      </div>
    </div>
  )
}

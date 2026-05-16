'use client'

import { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { WrapUpAttendanceInput, type AttendanceAnswer } from './WrapUpAttendanceInput'
import { WrapUpSessionActualInput, type SessionActualAnswer } from './WrapUpSessionActualInput'
import { WrapUpStandoutsSection, type StandoutsAndAttentionDraft } from './WrapUpStandoutsSection'
import { WrapUpFollowUpInput, type FollowUpAnswer } from './WrapUpFollowUpInput'
import { WrapUpReviewSummary, type WrapUpFullDraft } from './WrapUpReviewSummary'
import { mapWrapUpToReviewQueue } from '@/lib/wrap-up/wrapUpReviewQueueMapper'

// ── Step definitions ──────────────────────────────────────────────────────────

type WrapUpStep = 'attendance' | 'session_actual' | 'observations' | 'follow_up' | 'review'

interface StepConfig {
  id: WrapUpStep
  label: string
  question: string
  donna: string
}

const STEPS: StepConfig[] = [
  {
    id: 'attendance',
    label: 'Attendance',
    question: 'Who was here today?',
    donna: 'Let\'s start with who showed up.',
  },
  {
    id: 'session_actual',
    label: 'Session',
    question: 'Did the session go as planned?',
    donna: 'How did the session itself go?',
  },
  {
    id: 'observations',
    label: 'Players',
    question: 'Any players to note?',
    donna: 'Who stood out, and who could use more support?',
  },
  {
    id: 'follow_up',
    label: 'Follow-Up',
    question: 'Anything that needs follow-up?',
    donna: 'Parent updates, director notes, or admin items?',
  },
  {
    id: 'review',
    label: 'Review',
    question: 'Review before submitting',
    donna: 'Almost done. Check everything looks right.',
  },
]

// ── Mobile progress dots ──────────────────────────────────────────────────────

function ProgressDots({ steps, current }: { steps: StepConfig[]; current: WrapUpStep }) {
  const currentIdx = steps.findIndex(s => s.id === current)
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`rounded-full transition-all duration-200 ${
            i < currentIdx ? 'w-2 h-2 bg-lime'
            : i === currentIdx ? 'w-3 h-3 bg-lime'
            : 'w-2 h-2 bg-border'
          }`}
        />
      ))}
    </div>
  )
}

// ── Mobile step header ────────────────────────────────────────────────────────

function MobileStepHeader({
  step,
  allSteps,
  onBack,
  onClose,
}: {
  step: StepConfig
  allSteps: StepConfig[]
  onBack: () => void
  onClose: () => void
}) {
  const idx = allSteps.findIndex(s => s.id === step.id)
  const isFirst = idx === 0

  return (
    <div className="sticky top-0 bg-base border-b border-border z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={isFirst ? onClose : onBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
        >
          {isFirst ? <X size={16} /> : <ArrowLeft size={16} />}
        </button>

        <div className="text-center">
          <p className="text-xs text-text-muted">{idx + 1} of {allSteps.length}</p>
          <p className="text-sm font-medium text-text-primary">{step.label}</p>
        </div>

        <ProgressDots steps={allSteps} current={step.id} />
      </div>

      {/* DONNA prompt */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface-raised">
        <div className="w-5 h-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
          <span className="text-lime text-[9px] font-bold">D</span>
        </div>
        <p className="text-[11px] text-text-muted italic">{step.donna}</p>
      </div>
    </div>
  )
}

// ── Next/Skip footer ──────────────────────────────────────────────────────────

function MobileStepFooter({
  onNext,
  onSkip,
  nextLabel,
  canNext,
  showSkip,
}: {
  onNext: () => void
  onSkip?: () => void
  nextLabel: string
  canNext?: boolean
  showSkip?: boolean
}) {
  return (
    <div className="sticky bottom-0 bg-base border-t border-border px-4 py-4 space-y-2">
      <button
        onClick={onNext}
        disabled={canNext === false}
        className={`w-full text-base font-semibold py-4 rounded-2xl transition-colors ${
          canNext === false
            ? 'bg-surface-raised text-text-muted border border-border cursor-not-allowed'
            : 'bg-lime text-black hover:bg-lime/90 active:bg-lime/80'
        }`}
      >
        {nextLabel}
      </button>
      {showSkip && onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-sm text-text-muted hover:text-text-secondary py-2 text-center transition-colors"
        >
          Skip this question
        </button>
      )}
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────

interface WrapUpMobileShellProps {
  sessionId: string
  coachId: string
  onComplete: (mapping: ReturnType<typeof mapWrapUpToReviewQueue>) => void
  onClose: () => void
  className?: string
}

export function WrapUpMobileShell({ sessionId, coachId, onComplete, onClose, className }: WrapUpMobileShellProps) {
  const [currentStep, setCurrentStep] = useState<WrapUpStep>('attendance')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Draft state per section
  const [attendance, setAttendance] = useState<AttendanceAnswer | null>(null)
  const [sessionActual, setSessionActual] = useState<SessionActualAnswer | null>(null)
  const [standoutsAndAttention, setStandoutsAndAttention] = useState<StandoutsAndAttentionDraft | null>(null)
  const [followUp, setFollowUp] = useState<FollowUpAnswer | null>(null)

  const currentStepConfig = STEPS.find(s => s.id === currentStep)!

  function buildFullDraft(): WrapUpFullDraft {
    return {
      sessionId,
      coachId,
      attendance,
      sessionActual,
      standouts: standoutsAndAttention?.standouts ?? [],
      needsAttention: standoutsAndAttention?.needsAttention ?? [],
      followUps: followUp,
      completedAt: new Date().toISOString(),
    }
  }

  function goTo(step: WrapUpStep) {
    setCurrentStep(step)
    // Scroll to top on step change
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleNext() {
    switch (currentStep) {
      case 'attendance': goTo('session_actual'); break
      case 'session_actual': goTo('observations'); break
      case 'observations': goTo('follow_up'); break
      case 'follow_up': goTo('review'); break
      case 'review': break
    }
  }

  function handleBack() {
    switch (currentStep) {
      case 'session_actual': goTo('attendance'); break
      case 'observations': goTo('session_actual'); break
      case 'follow_up': goTo('observations'); break
      case 'review': goTo('follow_up'); break
      default: onClose()
    }
  }

  function handleSkip() {
    handleNext()
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const draft = buildFullDraft()
      const mapping = mapWrapUpToReviewQueue(draft)
      onComplete(mapping)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEditSection(section: 'attendance' | 'session_actual' | 'observations' | 'follow_ups') {
    const stepMap: Record<string, WrapUpStep> = {
      attendance: 'attendance',
      session_actual: 'session_actual',
      observations: 'observations',
      follow_ups: 'follow_up',
    }
    goTo(stepMap[section] as WrapUpStep)
  }

  return (
    <div className={`flex flex-col min-h-screen bg-base ${className}`}>
      {/* Step header */}
      <MobileStepHeader
        step={currentStepConfig}
        allSteps={STEPS}
        onBack={handleBack}
        onClose={onClose}
      />

      {/* Question headline */}
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-xl font-semibold text-text-primary leading-tight">
          {currentStepConfig.question}
        </h2>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {currentStep === 'attendance' && (
          <WrapUpAttendanceInput
            initialValue={attendance ?? undefined}
            onChange={setAttendance}
          />
        )}

        {currentStep === 'session_actual' && (
          <WrapUpSessionActualInput
            initialValue={sessionActual ?? undefined}
            onChange={setSessionActual}
          />
        )}

        {currentStep === 'observations' && (
          <WrapUpStandoutsSection
            initialStandouts={standoutsAndAttention?.standouts}
            initialNeedsAttention={standoutsAndAttention?.needsAttention}
            onChange={setStandoutsAndAttention}
          />
        )}

        {currentStep === 'follow_up' && (
          <WrapUpFollowUpInput
            initialValue={followUp ?? undefined}
            onChange={setFollowUp}
          />
        )}

        {currentStep === 'review' && (
          <WrapUpReviewSummary
            draft={buildFullDraft()}
            onSubmit={handleSubmit}
            onEdit={handleEditSection}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Footer controls (not shown on review — review has its own submit) */}
      {currentStep !== 'review' && (
        <MobileStepFooter
          onNext={handleNext}
          onSkip={handleSkip}
          nextLabel="Next →"
          showSkip={true}
        />
      )}
    </div>
  )
}

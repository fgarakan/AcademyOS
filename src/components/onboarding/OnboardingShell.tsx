'use client'

import { useState, useCallback } from 'react'
import { ArrowRight, ArrowLeft, Sparkles, Zap } from 'lucide-react'
import { OnboardingProgressRail } from './OnboardingProgressRail'
import { OnboardingDonnaPanel } from './OnboardingDonnaPanel'
import { OnboardingStepHeader } from './OnboardingStepHeader'
import { AcademyBasicsStep } from './steps/AcademyBasicsStep'
import { CoachingDnaStep } from './steps/CoachingDnaStep'

export interface OnboardingDraft {
  setupMode: string
  academyName: string
  locationCount: number
  academyModel: string
  ageGroups: string[]
  primaryGoals: string[]
  programType: string
  coachingStyles: string[]
  primaryCommunication: string
  secondaryCommunication: string
  sessionBlocks: string[]
  developmentPriorities: string[]
  parentStyles: string[]
  parentVisibilityRules: Record<string, boolean>
  playerMissionStyle: string
}

const defaultDraft: OnboardingDraft = {
  setupMode: '',
  academyName: '',
  locationCount: 1,
  academyModel: '',
  ageGroups: [],
  primaryGoals: [],
  programType: '',
  coachingStyles: [],
  primaryCommunication: '',
  secondaryCommunication: '',
  sessionBlocks: [],
  developmentPriorities: [],
  parentStyles: [],
  parentVisibilityRules: {
    hideRawCoachNotes: true,
    hideInternalDirectorNotes: true,
    hideRankings: true,
    hideComparisons: true,
    hideUnapprovedAI: true,
  },
  playerMissionStyle: '',
}

const SETUP_MODES = [
  { id: 'fast-start',     label: 'Fast Start',             time: '~5 min',    desc: 'Core identity only. DONNA fills the rest with smart defaults.' },
  { id: 'guided-setup',   label: 'Guided Setup',           time: '~15 min',   desc: 'Academy basics, coaching DNA, and parent experience.' },
  { id: 'full-setup',     label: 'Full Setup',             time: '~30–45 min', desc: 'Every section in detail. Most personalized starting system.' },
  { id: 'import-existing', label: 'Import Existing Academy', time: 'Varies',  desc: 'Already have data? Start from an import.' },
  { id: 'consultant-setup', label: 'Consultant Setup',     time: 'Varies',    desc: 'Setting this up on behalf of a client academy.' },
  { id: 'multi-location', label: 'Multi-Location Academy', time: '~30 min',   desc: 'Multiple courts, locations, or coaching groups.' },
]

const TOTAL_STEPS = 7

const STEP_NAMES = [
  'Welcome',
  'Academy Basics',
  'Coaching DNA',
  'Session + Curriculum Defaults',
  'Parent + Player Experience',
  'Review Academy DNA',
  'Activate Starting System',
]

const STEP_SUBTITLES = [
  'Tell DONNA how your academy works.',
  'Your academy identity and structure.',
  'How your coaches teach and communicate.',
  'Session structure and development focus.',
  'Communication and mission style.',
  'Review your Academy DNA draft.',
  'Complete these steps to launch your academy.',
]

export function OnboardingShell() {
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft)
  const [showMobilePanel, setShowMobilePanel] = useState(false)

  const updateDraft = useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft(prev => ({ ...prev, ...partial }))
  }, [])

  const goNext = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const goPrev = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-base">

      {/* Progress Rail */}
      <OnboardingProgressRail currentStep={currentStep} />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">

            {/* Step Content */}
            {currentStep === 0 && (
              <WelcomeStep
                draft={draft}
                updateDraft={updateDraft}
                onNext={goNext}
              />
            )}
            {currentStep === 1 && (
              <AcademyBasicsStep
                draft={draft}
                updateDraft={updateDraft}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}
            {currentStep === 2 && (
              <CoachingDnaStep
                draft={draft}
                updateDraft={updateDraft}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}
            {currentStep > 2 && currentStep < TOTAL_STEPS - 1 && (
              <PlaceholderStep
                stepNumber={currentStep + 1}
                title={STEP_NAMES[currentStep]}
                subtitle={STEP_SUBTITLES[currentStep]}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}
            {currentStep === TOTAL_STEPS - 1 && (
              <PlaceholderStep
                stepNumber={TOTAL_STEPS}
                title={STEP_NAMES[TOTAL_STEPS - 1]}
                subtitle={STEP_SUBTITLES[TOTAL_STEPS - 1]}
                onNext={undefined}
                onPrev={goPrev}
                isFinal
              />
            )}

            {/* Save status placeholder */}
            <div className="mt-8 pt-4 border-t border-border">
              <p className="text-[10px] text-text-muted/50 text-center">
                Draft only — saved in this browser. Nothing applied until Activation Checklist.
              </p>
            </div>

          </div>
        </main>

        {/* DONNA Panel — desktop */}
        <div className="hidden lg:block">
          <OnboardingDonnaPanel currentStep={currentStep} draft={draft} />
        </div>

      </div>

      {/* Mobile DONNA toggle */}
      <div className="lg:hidden border-t border-border bg-surface">
        <button
          onClick={() => setShowMobilePanel(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime" />
            <span className="font-medium">DONNA</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Draft only</span>
          </div>
          <span className="text-[11px] text-text-muted">{showMobilePanel ? 'Hide' : 'Show'}</span>
        </button>
        {showMobilePanel && (
          <div className="max-h-80 overflow-y-auto">
            <OnboardingDonnaPanel currentStep={currentStep} draft={draft} />
          </div>
        )}
      </div>

    </div>
  )
}

// ── Welcome Step ───────────────────────────────────────────────

function WelcomeStep({
  draft,
  updateDraft,
  onNext,
}: {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
}) {
  return (
    <div>
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-1.5 bg-lime/8 border border-lime/20 rounded-full px-3 py-1 mb-6">
        <Sparkles className="w-3 h-3 text-lime" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-lime">
          AcademyOS — Director Onboarding
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold text-text-primary leading-tight mb-2">
        Tell DONNA how your academy works.
      </h1>
      <p className="text-base font-medium text-lime mb-1">
        DONNA builds your starting operating system.
      </p>
      <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-xl">
        DONNA learns how your academy thinks, coaches, and communicates — then prepares your curriculum defaults, session templates, and communication system.
      </p>

      {/* Setup Mode Selection */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Choose a setup mode
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SETUP_MODES.map(mode => {
            const isSelected = draft.setupMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => updateDraft({ setupMode: mode.id })}
                className={[
                  'text-left rounded-xl border px-4 py-3.5 transition-all',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={[
                    'text-sm font-semibold leading-tight',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {mode.label}
                  </span>
                  <span className={[
                    'text-[10px] font-mono shrink-0 ml-2',
                    isSelected ? 'text-lime' : 'text-text-muted',
                  ].join(' ')}>
                    {mode.time}
                  </span>
                </div>
                <p className={[
                  'text-[11px] leading-relaxed',
                  isSelected ? 'text-text-secondary' : 'text-text-muted',
                ].join(' ')}>
                  {mode.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Safety copy */}
      <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
        <p className="text-[11px] text-text-muted leading-relaxed">
          All selections are saved as a draft. Nothing is applied until you reach the Activation Checklist and confirm.
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNext}
          className={[
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            draft.setupMode
              ? 'bg-lime text-base hover:brightness-110 shadow-lime'
              : 'bg-lime/20 text-lime/50 cursor-not-allowed',
          ].join(' ')}
          disabled={!draft.setupMode}
        >
          <Zap className="w-4 h-4" />
          Start with DONNA
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Use recommended defaults
        </button>
      </div>
    </div>
  )
}

// ── Placeholder Step ────────────────────────────────────────────

function PlaceholderStep({
  stepNumber,
  title,
  subtitle,
  onNext,
  onPrev,
  isFinal,
}: {
  stepNumber: number
  title: string
  subtitle: string
  onNext?: () => void
  onPrev: () => void
  isFinal?: boolean
}) {
  return (
    <div>
      <OnboardingStepHeader
        stepNumber={stepNumber}
        totalSteps={TOTAL_STEPS}
        title={title}
        subtitle={subtitle}
      />

      {/* Placeholder card */}
      <div className="rounded-2xl border border-border bg-surface p-8 mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-lime/8 border border-lime/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-5 h-5 text-lime" />
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">
          {title}
        </p>
        <p className="text-xs text-text-muted">
          This step is being built in the next sprint.
        </p>
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
        {!isFinal && onNext && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 transition-all shadow-lime"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {isFinal && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime/8 border border-lime/20">
            <Sparkles className="w-4 h-4 text-lime" />
            <span className="text-sm font-medium text-lime">
              Activation Checklist coming in Sprint O-10
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

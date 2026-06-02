'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import { saveAcademyOperatingLensAction } from '@/lib/actions/saveAcademyOperatingLensAction'
import { OnboardingProgressRail } from './OnboardingProgressRail'
import { OnboardingDonnaPanel } from './OnboardingDonnaPanel'
import { AcademyBasicsStep } from './steps/AcademyBasicsStep'
import { CoachingDnaStep } from './steps/CoachingDnaStep'
import { CoachCommunicationStep } from './steps/CoachCommunicationStep'
import { SessionDesignStep } from './steps/SessionDesignStep'
import { PlayerDevelopmentStep } from './steps/PlayerDevelopmentStep'
import { ParentCommunicationStep } from './steps/ParentCommunicationStep'
import { AcademyDnaReviewStep } from './steps/AcademyDnaReviewStep'
import { DonnaAdjustmentStep } from './steps/DonnaAdjustmentStep'
import { ActivationChecklistStep } from './steps/ActivationChecklistStep'
import { useOnboardingDraftPersistence, OnboardingSaveStatus, DraftResumeBanner } from './OnboardingSaveStatus'

export interface LocalCoachDraft {
  name: string
  role: string
  levels: string[]
}

export interface ClassTemplateDraftData {
  skipped: boolean
  selectedBlocks: string[]
  blockDurations: Record<string, number>
}

export interface FitnessTemplateDraftData {
  skipped: boolean
  selectedBlocks: string[]
}

export interface PlayerUploadDraftData {
  skipped: boolean
  playerCount: number
}

export interface CoachesDraftData {
  skipped: boolean
  coaches: LocalCoachDraft[]
}

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
  // Curriculum Builder (step 4)
  curriculumStartingPoint: string
  curriculumFocusLevels: string[]
  sessionBlocks: string[]
  developmentPriorities: string[]
  // First Class Template (step 5)
  classTemplateDraft: ClassTemplateDraftData
  // First Fitness Template (step 6)
  fitnessTemplateDraft: FitnessTemplateDraftData
  // Player Upload (step 7)
  playerUploadDraft: PlayerUploadDraftData
  // Add Coaches (step 8)
  coachesDraft: CoachesDraftData
  // Portal Preview (step 9) — absorbs Parent + Player Experience
  parentStyles: string[]
  parentVisibilityRules: Record<string, boolean>
  playerMissionStyle: string
  portalPreviewViewed: boolean
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
  curriculumStartingPoint: '',
  curriculumFocusLevels: [],
  sessionBlocks: [],
  developmentPriorities: [],
  classTemplateDraft: { skipped: false, selectedBlocks: [], blockDurations: {} },
  fitnessTemplateDraft: { skipped: false, selectedBlocks: [] },
  playerUploadDraft: { skipped: false, playerCount: 0 },
  coachesDraft: { skipped: false, coaches: [] },
  parentStyles: [],
  parentVisibilityRules: {
    hideRawCoachNotes: true,
    hideInternalDirectorNotes: true,
    hideRankings: true,
    hideComparisons: true,
    hideUnapprovedAI: true,
  },
  playerMissionStyle: '',
  portalPreviewViewed: false,
}

const SETUP_MODES = [
  { id: 'fast-start',      label: 'Fast Start',              time: '~5 min',     desc: 'Core identity only. DONNA fills the rest with smart defaults.' },
  { id: 'guided-setup',    label: 'Guided Setup',            time: '~15 min',    desc: 'Academy basics, coaching DNA, and parent experience.' },
  { id: 'full-setup',      label: 'Full Setup',              time: '~30-45 min', desc: 'Every section in detail. Most personalized starting system.' },
  { id: 'import-existing', label: 'Import Existing Academy', time: 'Varies',     desc: 'Already have data? Start from an import.' },
  { id: 'consultant-setup', label: 'Consultant Setup',       time: 'Varies',     desc: 'Setting this up on behalf of a client academy.' },
  { id: 'multi-location',  label: 'Multi-Location Academy',  time: '~30 min',    desc: 'Multiple courts, locations, or coaching groups.' },
]

export const TOTAL_STEPS = 10

const STEP_NAMES = [
  'Welcome',
  'Academy Basics',
  'Coaching Philosophy',
  'Coach Communication',
  'Session Design',
  'Player Development',
  'Parent Communication',
  'DNA Summary',
  'DONNA Adjustment',
  'Final Activation',
]

const STEP_SUBTITLES = [
  'Tell DONNA how your academy works.',
  'Your academy identity and structure.',
  'How your coaches teach and develop players.',
  'How your coaches communicate on court and in reports.',
  'How a typical session at your academy should feel.',
  'What great player development looks like here.',
  'How parents experience your academy.',
  'Review your Academy DNA draft.',
  'Fine-tune your Academy DNA with DONNA.',
  'Your Academy DNA is ready. See what comes next.',
]

interface OnboardingShellProps {
  initialStep?: number
  initialSetupMode?: string
}

export function OnboardingShell({ initialStep = 0, initialSetupMode = '' }: OnboardingShellProps = {}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [draft, setDraft] = useState<OnboardingDraft>(() =>
    initialSetupMode ? { ...defaultDraft, setupMode: initialSetupMode } : defaultDraft
  )
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [showResumeBanner, setShowResumeBanner] = useState(true)

  const updateDraft = useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft(prev => ({ ...prev, ...partial }))
  }, [])

  const { lastSaved, restoreDraft, clearDraft, hasSavedDraft } = useOnboardingDraftPersistence(draft, setDraft)

  // Persist DNA to DB once when the director reaches the activation step.
  // Fire-and-forget — localStorage remains the source of truth if this fails.
  // The ref guard ensures at most one DB write per shell mount.
  const hasPersistedLens = useRef(false)
  useEffect(() => {
    if (currentStep !== TOTAL_STEPS - 1 || hasPersistedLens.current) return
    hasPersistedLens.current = true
    void saveAcademyOperatingLensAction({
      mission: draft.primaryGoals,
      playerDevelopmentPhilosophy: draft.programType,
      coachingStyle: draft.coachingStyles,
      developmentPriorities: draft.developmentPriorities,
      curriculumPreference: draft.curriculumStartingPoint,
      parentCommunicationStyle: draft.parentStyles,
      coachRecapExpectations: '',
      donnaCommunicationStyle: '',
      playerMissionStyle: draft.playerMissionStyle,
      setupMode: draft.setupMode,
    })
  }, [currentStep, draft])

  const goNext = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const goPrev = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0))
  }, [])

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(Math.max(0, Math.min(stepIndex, TOTAL_STEPS - 1)))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-base">

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content Column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Progress Rail — hidden on welcome (step 0) */}
          <OnboardingProgressRail currentStep={currentStep} />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6">

            {/* Resume banner */}
            {currentStep === 0 && showResumeBanner && hasSavedDraft() && (
              <div className="mb-6">
                <DraftResumeBanner
                  onResume={() => { restoreDraft(); setShowResumeBanner(false) }}
                  onDismiss={() => { clearDraft(); setShowResumeBanner(false) }}
                />
              </div>
            )}

            {/* Setup mode context badge — shown when entering via landing with a pre-selected mode */}
            {currentStep >= 1 && draft.setupMode && (
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised border border-border text-[10px] text-text-muted">
                  {SETUP_MODES.find(m => m.id === draft.setupMode)?.label ?? draft.setupMode} selected
                </span>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 0 && (
              <WelcomeStep draft={draft} updateDraft={updateDraft} onNext={goNext} />
            )}
            {currentStep === 1 && (
              <AcademyBasicsStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 2 && (
              <CoachingDnaStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 3 && (
              <CoachCommunicationStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 4 && (
              <SessionDesignStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 5 && (
              <PlayerDevelopmentStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 6 && (
              <ParentCommunicationStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === 7 && (
              <AcademyDnaReviewStep
                draft={draft}
                updateDraft={updateDraft}
                onNext={goNext}
                onPrev={goPrev}
                onEditStep={goToStep}
              />
            )}
            {currentStep === 8 && (
              <DonnaAdjustmentStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />
            )}
            {currentStep === TOTAL_STEPS - 1 && (
              <ActivationChecklistStep draft={draft} onPrev={goPrev} onEditStep={goToStep} />
            )}

            {/* Save status */}
            <div className="mt-8 pt-4 border-t border-border flex items-center justify-center gap-2">
              <OnboardingSaveStatus
                lastSaved={lastSaved}
                onClear={() => { clearDraft(); setDraft(defaultDraft) }}
              />
              {!lastSaved && (
                <p className="text-[10px] text-text-muted/50 text-center">
                  Draft only — nothing applied until Activation Checklist.
                </p>
              )}
            </div>

            </div>
          </main>

        </div>{/* end Content Column */}

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
  // Sprint 961: corrected step list — 9 substantive steps, not 5.
  // WelcomeStep is step 0, reached only when skipping the AcademyDnaLanding.
  // Normal flow enters at step 1 (Academy Basics) via AcademyDnaLanding.
  const FLOW_STEPS = [
    'Academy Basics',
    'Coaching Philosophy',
    'Coach Communication',
    'Session Design',
    'Player Development',
    'Parent Communication',
    'DNA Summary',
    'DONNA Adjustment',
    'Final Activation',
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow — accent radial behind the header */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(17,217,223,0.07) 0%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 bg-lime/8 border border-lime/20 rounded-full px-3 py-1 mb-6">
          <Sparkles className="w-3 h-3 text-lime" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-lime">
            AcademyOS — Director Onboarding
          </span>
        </div>

        <h1 className="text-3xl font-bold text-text-primary leading-tight mb-2">
          Tell DONNA how your academy works.
        </h1>
        <p className="text-base font-medium text-lime mb-1">
          DONNA builds your starting operating system.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-xl">
          DONNA learns how your academy thinks, coaches, and communicates — then prepares your curriculum defaults, session templates, and communication system.
        </p>

        {/* 9-step flow preview — Sprint 961: corrected from 5 steps */}
        <div className="mb-8">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
            9 steps — takes about 10–15 minutes
          </p>
          <div className="flex flex-wrap items-center gap-0">
            {FLOW_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5">
                  <span className="w-4 h-4 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center text-[9px] font-bold text-lime shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-text-secondary whitespace-nowrap">{step}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="w-3 h-px bg-border shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards strip */}
        <div className="mb-8">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
            What DONNA builds for you
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: 'Curriculum Builder',  desc: 'Level structure, progression gates, and session plans' },
              { title: 'Player Pathways',      desc: 'Individual development plans for every player' },
              { title: 'Analytics',            desc: 'Session data, attendance, and performance insights' },
              { title: 'Parent Reports',       desc: 'Privacy-safe communications, auto-drafted by DONNA' },
            ].map(card => (
              <div
                key={card.title}
                className="rounded-xl bg-surface-raised border border-border px-3.5 py-3"
              >
                <p className="text-[11px] font-semibold text-text-secondary leading-tight mb-1">
                  {card.title}
                </p>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Setup mode <span className="font-normal normal-case tracking-normal text-text-muted/60">(optional)</span>
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

        <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
          <p className="text-[11px] text-text-muted leading-relaxed">
            All selections are saved as a draft. Nothing is applied until you reach the Activation step and confirm.
          </p>
        </div>

        {/* Sprint 961: data-donna-focus-id so DONNA can highlight the primary CTA */}
        <div className="flex items-center gap-3" data-donna-focus-id="onboarding-cta">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-lime text-base hover:brightness-110 shadow-lime transition-all"
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
    </div>
  )
}



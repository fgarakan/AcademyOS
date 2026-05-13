'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, ChevronRight, Loader2, ArrowLeft, Lock,
  Layers, BookOpen, Target, Activity, ClipboardList,
  Users, Sparkles, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui'
import {
  type CurriculumSetupState,
  RECOMMENDED_CURRICULUM_SPINE,
  SPINE_STAGES,
  CURRICULUM_SOURCE_OPTIONS,
  CURRICULUM_DOMAINS,
  getInitialStep,
  isRequiredSetupComplete,
} from '@/lib/curriculum/curriculumSetupTypes'
import { saveCurriculumSpineAction } from '@/lib/actions/curriculumSpineAction'

// ── Types ──────────────────────────────────────────────────────

type SetupStep = 'spine' | 'spine_impact' | 'source' | 'domains' | 'complete'

type SpineAction = 'use' | 'edit' | 'different' | null

interface Props {
  initialState: CurriculumSetupState
  origin: 'onboarding' | 'builder'
}

// ── Deeper setup layer definition ──────────────────────────────

const DEEPER_STEPS = [
  {
    key: 'level_names_status',
    label: 'Level Names',
    description: 'Rename levels to match how your academy talks — "Beginners", "Orange Stars", etc.',
    icon: Layers,
  },
  {
    key: 'level_goals_status',
    label: 'Level Goals',
    description: 'Define what a player should be able to do at each level before moving on.',
    icon: Target,
  },
  {
    key: 'movement_gates_status',
    label: 'Movement Gates',
    description: 'Set the performance thresholds that confirm a player is ready to advance.',
    icon: Activity,
  },
  {
    key: 'requirements_status',
    label: 'Requirements',
    description: 'Specify the evidence and assessment criteria required at each level.',
    icon: ClipboardList,
  },
  {
    key: 'template_connections_status',
    label: 'Template Connections',
    description: 'Link session templates to curriculum levels so coaches see the right content.',
    icon: BookOpen,
  },
  {
    key: 'parent_player_explanations_status',
    label: 'Parent + Player Explanations',
    description: 'Write how each level is described to parents and players in their portals.',
    icon: Users,
  },
] as const

// ── Helpers ────────────────────────────────────────────────────

function ProgressPip({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className={cn(
      'w-2 h-2 rounded-full transition-all duration-300',
      done ? 'bg-lime' : active ? 'bg-lime/50' : 'bg-surface-raised border border-border',
    )} />
  )
}

// ── Main component ─────────────────────────────────────────────

export function CurriculumSetupBuilder({ initialState, origin }: Props) {
  const savedInitialStep = getInitialStep(initialState)
  const [step, setStep] = useState<SetupStep>(
    savedInitialStep === 'complete' ? 'complete' : savedInitialStep,
  )
  const [state, setState] = useState<CurriculumSetupState>(initialState)
  const [spineAction, setSpineAction] = useState<SpineAction>(null)
  const [selectedSource, setSelectedSource] = useState<string>(
    initialState.curriculum_source_choice ?? 'customize_starter',
  )
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    initialState.selected_domains.length > 0
      ? initialState.selected_domains
      : CURRICULUM_DOMAINS,
  )

  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const backHref = origin === 'onboarding' ? '/director/onboarding' : '/director/curriculum'
  const backLabel = origin === 'onboarding' ? 'Academy Onboarding' : 'Curriculum'

  // ── Step progress ──
  const stepOrder: SetupStep[] = ['spine', 'spine_impact', 'source', 'domains', 'complete']
  const spineOk = state.spine_status === 'approved' || state.spine_status === 'customized'
  const sourceOk = state.curriculum_source_status === 'selected'
  const domainsOk = state.domains_status === 'approved' || state.domains_status === 'customized'

  // ── Spine approval ──
  function handleSpineApprove(action: 'use' | 'edit') {
    setSaveError(null)
    const newSpineStatus = action === 'use' ? 'approved' : 'customized'
    const newState: CurriculumSetupState = {
      ...state,
      spine_status: newSpineStatus,
      approved_spine_levels: RECOMMENDED_CURRICULUM_SPINE,
    }
    startTransition(async () => {
      const result = await saveCurriculumSpineAction({
        spine_status: newSpineStatus,
        approved_spine_levels: RECOMMENDED_CURRICULUM_SPINE,
      })
      if (!result.ok) { setSaveError(result.error); return }
      setState(newState)
      setStep('spine_impact')
    })
  }

  // ── Source save ──
  function handleSourceSave() {
    setSaveError(null)
    const isDecideLater = selectedSource === 'decide_later'
    const newSourceStatus = isDecideLater ? 'skipped' : 'selected'
    const newState: CurriculumSetupState = {
      ...state,
      curriculum_source_status: newSourceStatus,
      curriculum_source_choice: isDecideLater ? null : selectedSource,
    }
    startTransition(async () => {
      const result = await saveCurriculumSpineAction({
        curriculum_source_status: newSourceStatus,
        curriculum_source_choice: isDecideLater ? null : selectedSource,
      })
      if (!result.ok) { setSaveError(result.error); return }
      setState(newState)
      setStep('domains')
    })
  }

  // ── Domains save ──
  function handleDomainsSave(statusOverride?: 'approved' | 'customized' | 'skipped') {
    setSaveError(null)
    const domainsStatus = statusOverride ?? (
      selectedDomains.length === CURRICULUM_DOMAINS.length ? 'approved' : 'customized'
    )
    const finalDomains = statusOverride === 'skipped' ? [] : selectedDomains
    const newState: CurriculumSetupState = {
      ...state,
      domains_status: domainsStatus,
      selected_domains: finalDomains,
    }
    startTransition(async () => {
      const result = await saveCurriculumSpineAction({
        domains_status: domainsStatus,
        selected_domains: finalDomains,
      })
      if (!result.ok) { setSaveError(result.error); return }
      setState(newState)
      setStep('complete')
    })
  }

  // ── Toggle domain ──
  function toggleDomain(domain: string) {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain],
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">

      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-3.5 h-3.5 text-lime" />
          <p className="page-eyebrow">
            {origin === 'onboarding' ? 'Onboarding · Step 3' : 'Curriculum'}
          </p>
        </div>
        <h1 className="page-title">Curriculum Builder</h1>
        <p className="page-subtitle">
          Start high-level. Approve your academy's development spine first, then customize
          deeper layers when ready.
        </p>
      </div>

      {/* Progress pills — Required setup only */}
      {step !== 'complete' && (
        <div className="flex items-center gap-2">
          <ProgressPip active={step === 'spine' || step === 'spine_impact'} done={spineOk} />
          <ProgressPip active={step === 'source'} done={sourceOk} />
          <ProgressPip active={step === 'domains'} done={domainsOk} />
          <span className="text-[10px] text-text-muted ml-1 tabular-nums">
            {spineOk ? (sourceOk ? (domainsOk ? '3' : '2') : '1') : '0'} / 3 required steps
          </span>
        </div>
      )}

      {/* Error banner */}
      {saveError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-status-red/10 border border-status-red/25">
          <AlertCircle className="w-4 h-4 text-status-red shrink-0" />
          <p className="text-sm text-status-red">{saveError}</p>
        </div>
      )}

      {/* ── STEP: SPINE ──────────────────────────────────────── */}
      {step === 'spine' && (
        <SpineStep
          spineAction={spineAction}
          setSpineAction={setSpineAction}
          isPending={isPending}
          onApprove={handleSpineApprove}
          origin={origin}
        />
      )}

      {/* ── STEP: SPINE IMPACT ───────────────────────────────── */}
      {step === 'spine_impact' && (
        <SpineImpactStep
          origin={origin}
          onContinue={() => setStep('source')}
        />
      )}

      {/* ── STEP: SOURCE ─────────────────────────────────────── */}
      {step === 'source' && (
        <SourceStep
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          isPending={isPending}
          onSave={handleSourceSave}
        />
      )}

      {/* ── STEP: DOMAINS ────────────────────────────────────── */}
      {step === 'domains' && (
        <DomainsStep
          selectedDomains={selectedDomains}
          toggleDomain={toggleDomain}
          isPending={isPending}
          onSave={handleDomainsSave}
        />
      )}

      {/* ── STEP: COMPLETE ───────────────────────────────────── */}
      {step === 'complete' && (
        <CompleteStep
          state={state}
          origin={origin}
        />
      )}

    </div>
  )
}

// ── Sub-step: Spine ────────────────────────────────────────────

function SpineStep({
  spineAction,
  setSpineAction,
  isPending,
  onApprove,
  origin,
}: {
  spineAction: SpineAction
  setSpineAction: (a: SpineAction) => void
  isPending: boolean
  onApprove: (action: 'use' | 'edit') => void
  origin: 'onboarding' | 'builder'
}) {
  return (
    <div className="space-y-5">
      {/* Recommended spine card */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-xs mb-1">Recommended Spine</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                15 levels across 5 stages — the Academy OS development pathway.
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-lime/10 text-lime border border-lime/20">
              Recommended
            </span>
          </div>

          <div className="space-y-4">
            {SPINE_STAGES.map(stage => (
              <div key={stage.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  {stage.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {stage.levels.map(level => (
                    <span
                      key={level}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-raised border border-border text-text-secondary"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <p className="text-sm font-medium text-text-primary leading-snug">
        Does this level structure match how your academy thinks about player development?
      </p>

      {/* Inline note for edit / different */}
      {spineAction === 'edit' && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Level name customization is a deeper setup step — available after you approve the
            spine structure. Approve the spine now and rename levels later.
          </p>
        </div>
      )}
      {spineAction === 'different' && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Custom spine creation is coming in a future update. For now, approve the
            recommended structure — you can rename every level and customize goals,
            gates, and requirements in the deeper setup.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => onApprove('use')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isPending ? 'Saving…' : 'Use this structure'}
        </button>

        <button
          type="button"
          onClick={() => {
            setSpineAction('edit')
            // Scroll to inline note
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-sm font-medium hover:border-lime/20 hover:text-text-primary transition-all"
        >
          Edit levels
        </button>

        {spineAction === 'edit' && (
          <button
            type="button"
            onClick={() => onApprove('edit')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-lime/30 bg-lime/5 text-lime text-sm font-medium hover:bg-lime/10 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Saving…' : 'Approve spine — customize level names later'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setSpineAction('different')}
          className="w-full flex items-center justify-center py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-sm font-medium hover:border-lime/20 hover:text-text-primary transition-all"
        >
          Help me create a different structure
        </button>

        {spineAction === 'different' && (
          <button
            type="button"
            onClick={() => onApprove('use')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-lime/30 bg-lime/5 text-lime text-sm font-medium hover:bg-lime/10 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Saving…' : 'Start with recommended spine for now'}
          </button>
        )}

        <div className="pt-1 text-center">
          <Link
            href={origin === 'onboarding' ? '/director/onboarding' : '/director/curriculum'}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Decide later
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Sub-step: Spine Impact (WIN screen) ────────────────────────

function SpineImpactStep({
  origin,
  onContinue,
}: {
  origin: 'onboarding' | 'builder'
  onContinue: () => void
}) {
  return (
    <div className="space-y-5">
      {/* WIN — celebration card */}
      <div className="px-6 py-8 rounded-2xl border border-lime/30 bg-lime/5 text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-lime" />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary leading-tight">
            Curriculum Spine approved.
          </p>
          <p className="text-xs text-text-secondary mt-1">
            15 development levels · 5 stages · your academy's foundation is set.
          </p>
        </div>
      </div>

      {/* What Academy OS can now do */}
      <Card>
        <CardContent className="py-5">
          <p className="label-xs mb-4">What Academy OS can now do</p>
          <div className="space-y-3">
            {[
              { icon: Users, text: 'Organize players by development stage' },
              { icon: Target, text: 'Connect player profiles to curriculum levels' },
              { icon: Activity, text: 'Start level-readiness and gate logic' },
              { icon: BookOpen, text: 'Attach session templates to curriculum levels' },
              { icon: Sparkles, text: 'Generate level-aware coaching cues and Q&A' },
              { icon: Layers, text: 'Unlock deeper curriculum customization' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-lime/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-lime" />
                </div>
                <p className="text-xs text-text-secondary leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card>
        <CardContent className="py-5">
          <p className="label-xs mb-3">Complete required setup — 2 more steps</p>
          <div className="space-y-2.5">
            {[
              { step: '1', label: 'Choose curriculum source' },
              { step: '2', label: 'Select development domains' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-lime/40 bg-lime/5 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono text-lime leading-none">{step}</span>
                </div>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors"
        >
          Continue Curriculum Setup
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          <Link
            href="/director/curriculum/builder"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-xs font-medium hover:border-lime/20 hover:text-text-primary transition-all"
          >
            Go to Curriculum Builder
          </Link>
          <Link
            href="/director/onboarding"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-xs font-medium hover:border-lime/20 hover:text-text-primary transition-all"
          >
            Return to Onboarding
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Sub-step: Curriculum Source ────────────────────────────────

function SourceStep({
  selectedSource,
  setSelectedSource,
  isPending,
  onSave,
}: {
  selectedSource: string
  setSelectedSource: (v: string) => void
  isPending: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-primary mb-1">
          How do you want to start your curriculum?
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          This shapes how Academy OS populates your levels with content, drills, and session structure.
        </p>
      </div>

      <div className="space-y-2.5">
        {CURRICULUM_SOURCE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelectedSource(opt.value)}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
              selectedSource === opt.value
                ? 'border-lime/40 bg-lime/5'
                : 'border-border bg-surface-raised hover:border-lime/20',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                selectedSource === opt.value ? 'border-lime' : 'border-border',
              )}>
                {selectedSource === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-lime" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn(
                    'text-sm font-medium leading-tight',
                    selectedSource === opt.value ? 'text-text-primary' : 'text-text-secondary',
                  )}>
                    {opt.label}
                  </p>
                  {'recommended' in opt && opt.recommended && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-lime/10 text-lime border border-lime/20 shrink-0">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Saving…' : 'Save and continue'}
        {!isPending && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ── Sub-step: Development Domains ─────────────────────────────

function DomainsStep({
  selectedDomains,
  toggleDomain,
  isPending,
  onSave,
}: {
  selectedDomains: string[]
  toggleDomain: (d: string) => void
  isPending: boolean
  onSave: (statusOverride?: 'approved' | 'customized' | 'skipped') => void
}) {
  const allSelected = selectedDomains.length === CURRICULUM_DOMAINS.length

  function handleUseRecommended() {
    // Ensure all domains selected, then save as approved
    CURRICULUM_DOMAINS.forEach(d => {
      if (!selectedDomains.includes(d)) toggleDomain(d)
    })
    onSave('approved')
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Which development categories should your curriculum include?
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          These shape how player progress is tracked, how sessions are structured, and
          what coaches focus on at each level.
        </p>
      </div>

      {/* Domain chips */}
      <div className="flex flex-wrap gap-2">
        {CURRICULUM_DOMAINS.map(domain => {
          const isSelected = selectedDomains.includes(domain)
          return (
            <button
              key={domain}
              type="button"
              onClick={() => toggleDomain(domain)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                isSelected
                  ? 'border-lime/40 bg-lime/10 text-lime'
                  : 'border-border bg-surface-raised text-text-muted hover:border-lime/20 hover:text-text-secondary',
              )}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {domain}
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-text-muted">
        {selectedDomains.length} of {CURRICULUM_DOMAINS.length} domains selected
      </p>

      {/* Actions */}
      <div className="space-y-2.5">
        {!allSelected && (
          <button
            type="button"
            onClick={handleUseRecommended}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isPending ? 'Saving…' : 'Use recommended domains (all)'}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSave(allSelected ? 'approved' : 'customized')}
          disabled={isPending || selectedDomains.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            allSelected
              ? 'bg-lime text-base hover:bg-lime/90'
              : 'border border-lime/30 bg-lime/5 text-lime hover:bg-lime/10',
          )}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending
            ? 'Saving…'
            : allSelected
              ? 'Use recommended domains (all)'
              : `Save custom selection (${selectedDomains.length} domains)`}
          {!isPending && <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => onSave('skipped')}
            disabled={isPending}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Decide later
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-step: Complete ─────────────────────────────────────────

function CompleteStep({
  state,
  origin,
}: {
  state: CurriculumSetupState
  origin: 'onboarding' | 'builder'
}) {
  const complete = isRequiredSetupComplete(state)

  return (
    <div className="space-y-6">
      {/* Required setup complete banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-status-green/30 bg-status-green/5">
        <CheckCircle2 className="w-5 h-5 text-status-green shrink-0" />
        <div>
          <p className="text-sm font-semibold text-status-green">
            {complete ? 'Required curriculum setup complete.' : 'Curriculum setup in progress.'}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Academy OS has what it needs to organize players and connect session templates.
          </p>
        </div>
      </div>

      {/* Required steps summary */}
      <Card>
        <CardContent className="py-5">
          <p className="label-xs mb-4">Required Setup</p>
          <div className="space-y-3">
            <RequiredStepRow
              label="Curriculum Spine"
              status={state.spine_status}
              detail={
                state.spine_status === 'approved'
                  ? `${state.approved_spine_levels.length} levels approved`
                  : state.spine_status === 'customized'
                    ? `${state.approved_spine_levels.length} levels — custom names pending`
                    : undefined
              }
            />
            <RequiredStepRow
              label="Curriculum Source"
              status={state.curriculum_source_status === 'selected' ? 'approved' : state.curriculum_source_status === 'skipped' ? 'skipped' : 'not_started'}
              detail={state.curriculum_source_choice
                ? CURRICULUM_SOURCE_OPTIONS.find(o => o.value === state.curriculum_source_choice)?.label
                : undefined}
            />
            <RequiredStepRow
              label="Development Domains"
              status={state.domains_status}
              detail={
                state.selected_domains.length > 0
                  ? `${state.selected_domains.length} domains selected`
                  : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Deeper setup section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="label-xs">Deeper Setup</p>
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-md bg-surface-raised border border-border">
            Optional · Customize when ready
          </span>
        </div>
        <Card>
          <CardContent className="p-0">
            {DEEPER_STEPS.map((ds, idx) => {
              const status = state[ds.key as keyof CurriculumSetupState] as string
              const isDone = status === 'complete'
              const isInProgress = status === 'in_progress'
              const Icon = ds.icon
              return (
                <div
                  key={ds.key}
                  className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        'text-xs font-medium leading-tight',
                        isDone ? 'text-status-green' : 'text-text-muted',
                      )}>
                        {ds.label}
                      </p>
                      {isDone && (
                        <span className="text-[10px] font-semibold text-status-green">Complete</span>
                      )}
                      {isInProgress && (
                        <span className="text-[10px] font-semibold text-status-orange">In progress</span>
                      )}
                      {!isDone && !isInProgress && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-text-muted px-1.5 py-0.5 rounded-md bg-surface-raised border border-border">
                          <Lock className="w-2.5 h-2.5" />
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      {ds.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <p className="text-[11px] text-text-muted mt-2 px-1">
          Deeper setup becomes available in the Curriculum Builder as your academy grows.
        </p>
      </div>

      {/* Navigation */}
      <div className="space-y-2.5">
        <Link
          href="/director/curriculum/builder"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors"
        >
          Go to Curriculum Builder
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/director/onboarding"
          className="w-full flex items-center justify-center py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-sm font-medium hover:border-lime/20 hover:text-text-primary transition-all"
        >
          Return to Academy Onboarding
        </Link>
      </div>
    </div>
  )
}

// ── Required step row ──────────────────────────────────────────

function RequiredStepRow({
  label,
  status,
  detail,
}: {
  label: string
  status: string
  detail?: string
}) {
  const isDone = status === 'approved' || status === 'customized' || status === 'selected'
  const isSkipped = status === 'skipped'

  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-status-green" />
        ) : isSkipped ? (
          <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center">
            <span className="text-[8px] text-text-muted">—</span>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border border-border" />
        )}
      </div>
      <div className="min-w-0">
        <p className={cn(
          'text-xs font-medium leading-tight',
          isDone ? 'text-text-primary' : 'text-text-muted',
        )}>
          {label}
        </p>
        {detail && (
          <p className="text-[11px] text-text-muted mt-0.5">{detail}</p>
        )}
        {isSkipped && (
          <p className="text-[11px] text-text-muted mt-0.5">Decided later</p>
        )}
      </div>
    </div>
  )
}

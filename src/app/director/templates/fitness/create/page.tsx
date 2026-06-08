'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Sparkles, GraduationCap, Target, Dumbbell, CheckCircle2, AlertCircle, Plus, X, Info, LayoutTemplate, Zap, Eye, Loader2 } from 'lucide-react'
import { saveFitnessTemplateDraftFromWizardAction } from '@/lib/actions/templateDraftAction'
import { onPageStatePatch, onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import { CURRICULUM_LEVEL_PREVIEWS, getCurriculumStage, getFitnessCurriculumPreview, getCurriculumLevelPreview } from '@/lib/templates/templateCurriculumPreview'
import { FitnessBlockType, FITNESS_BLOCK_TYPES, getFitnessBlockLabel, getFitnessBlockIntent, getFitnessBlockAccent, getFitnessBlockBorderAccent, getDefaultBlockDuration } from '@/lib/fitness/fitnessBlockTypes'
import { getExercisesForBlock, getExerciseProgressionRegression } from '@/lib/templates/fitnessExerciseAutoPopulate'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1, label: 'Curriculum Level', icon: GraduationCap },
  { id: 2, label: 'Fitness Goal', icon: Target },
  { id: 3, label: 'Load + Duration', icon: Dumbbell },
  { id: 4, label: 'Build Blocks', icon: LayoutTemplate },
  { id: 5, label: 'Review', icon: CheckCircle2 },
]

const CURRICULUM_LEVELS = CURRICULUM_LEVEL_PREVIEWS.map(p => p.level)

const LOAD_LEVELS = ['Light', 'Moderate', 'High'] as const

const FITNESS_GOALS = [
  { id: 'speed_agility', label: 'Speed & Agility', description: 'First step quickness, lateral movement, change-of-direction' },
  { id: 'strength_power', label: 'Strength & Power', description: 'Rotational power, upper body strength, explosive leg drive' },
  { id: 'mobility_flexibility', label: 'Mobility & Flexibility', description: 'Hip mobility, shoulder health, ankle stability, injury prevention' },
  { id: 'endurance', label: 'Endurance', description: 'Aerobic capacity, point-to-point recovery, match stamina' },
  { id: 'coordination', label: 'Coordination', description: 'Hand-eye coordination, ball tracking, footwork patterns' },
]

// Maps human-readable suggestedBlockTypes labels to FitnessBlockType
const SUGGESTED_LABEL_TO_TYPE: Record<string, FitnessBlockType> = {
  'Coordination':  'coordination',
  'Mobility':      'mobility',
  'Warm-Up':       'movement',
  'Speed':         'speed',
  'Agility':       'agility',
  'Strength':      'strength',
  'Plyometrics':   'plyometrics',
  'Recovery':      'recovery_cool_down',
}

interface FitnessBlock {
  id: string
  type: FitnessBlockType
  durationMin: number
  exercises: string[]
}

export default function CreateFitnessTemplatePage() {
  const [step, setStep] = useState<Step>(1)
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [load, setLoad] = useState<string>('Moderate')
  const [durationMin, setDurationMin] = useState<number>(30)
  const [fitnessBlocks, setFitnessBlocks] = useState<FitnessBlock[]>([])
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'schema_missing'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [donnaSyncedFields, setDonnaSyncedFields] = useState<Set<string>>(new Set())
  const [donnaPlan,         setDonnaPlan]         = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting,   setDonnaSubmitting]   = useState(false)
  const [donnaError,        setDonnaError]        = useState<string | null>(null)
  const [donnaCompletion,   setDonnaCompletion]   = useState<WorkflowCompletionSummary | null>(null)

  useEffect(() => {
    return onPageStatePatch(patch => {
      if (patch.workflowId !== 'fitness_template_builder_completion') return
      setDonnaSyncedFields(prev => {
        const next = new Set(prev)
        next.add(patch.fieldId)
        return next
      })
      if (patch.fieldId === 'level') {
        setSelectedLevel(patch.value)
      } else if (patch.fieldId === 'goal') {
        const goalId = normaliseFitnessGoal(patch.value)
        if (goalId) setSelectedGoal(goalId)
      } else if (patch.fieldId === 'load') {
        const l = patch.value.toLowerCase().trim()
        if (l === 'light' || l === 'moderate' || l === 'high') setLoad(l.charAt(0).toUpperCase() + l.slice(1))
      } else if (patch.fieldId === 'duration') {
        const n = parseInt(patch.value.replace(/[^0-9]/g, ''), 10)
        if (!isNaN(n) && n > 0) setDurationMin(n)
      }
    })
  }, [])

  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'fitness_template_builder_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  function normaliseFitnessGoal(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('speed') || lower.includes('agility')) return 'speed_agility'
    if (lower.includes('strength') || lower.includes('power')) return 'strength_power'
    if (lower.includes('mobility') || lower.includes('flex')) return 'mobility_flexibility'
    if (lower.includes('endurance') || lower.includes('stamina')) return 'endurance'
    if (lower.includes('coord')) return 'coordination'
    return raw.toLowerCase().replace(/\s+/g, '_')
  }

  function buildFitnessBlocksFromGoal(goalId: string, totalMin: number) {
    const goalToMainType: Record<string, string> = {
      'speed_agility':        'speed',
      'strength_power':       'strength',
      'mobility_flexibility': 'mobility',
      'endurance':            'coordination',
      'coordination':         'coordination',
    }
    const main = goalToMainType[goalId] ?? 'movement'
    const warmUp = Math.max(5, Math.round(totalMin * 0.2))
    const cool   = Math.max(5, Math.round(totalMin * 0.15))
    const body   = Math.max(5, totalMin - warmUp - cool)
    return [
      { type: 'movement',           durationMin: warmUp, exercises: [] },
      { type: main,                 durationMin: body,   exercises: [] },
      { type: 'recovery_cool_down', durationMin: cool,   exercises: [] },
    ]
  }

  async function handleDonnaConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const ans = payload.answers
    const goalId    = normaliseFitnessGoal(ans['fitness_goal'] ?? selectedGoal)
    const goalInfo  = FITNESS_GOALS.find(g => g.id === goalId)
    const levelVal  = ans['fitness_level'] ?? selectedLevel
    const loadVal   = ans['fitness_load'] ?? load
    const durVal    = parseInt((ans['fitness_duration'] ?? String(durationMin)).replace(/[^0-9]/g, ''), 10) || durationMin
    const blocks    = buildFitnessBlocksFromGoal(goalId, durVal)

    const result = await saveFitnessTemplateDraftFromWizardAction({
      curriculumLevel:  levelVal,
      fitnessGoalId:    goalId,
      fitnessGoalLabel: goalInfo?.label ?? goalId,
      load:             loadVal,
      durationMin:      durVal,
      blocks,
    })

    const submitResult = {
      ok:         result.success,
      entityId:   result.reviewRequestId ?? null,
      entityType: 'fitness_template',
      redirectTo: '/director/templates/fitness',
      error:      result.error ?? null,
    }

    const verification = buildWorkflowVerificationResult(submitResult, ans['fitness_goal'] ?? 'Fitness Template')

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary('fitness_template_builder_completion', verification, ans)
      setDonnaCompletion(summary)
      setDonnaPlan(null)
    } else {
      setDonnaError(verification.failureReason ?? result.error ?? 'Failed to save fitness template draft.')
    }
    setDonnaSubmitting(false)
  }

  function handleDonnaDismiss() {
    setDonnaPlan(null)
    setDonnaError(null)
  }

  function renderDonnaBanner() {
    if (donnaCompletion) {
      return (
        <div className="rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm font-semibold text-status-green">Fitness template draft submitted</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
        </div>
      )
    }
    if (!donnaPlan) return null
    const filledFields = donnaPlan.fields.filter(f => f.filled)
    return (
      <div className="rounded-xl border border-lime/25 bg-lime/5 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-lime/15 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs font-semibold text-lime">DONNA collected these answers</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          {filledFields.map(field => (
            <div key={field.fieldId} className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-lime shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-xs text-text-muted">{field.displayLabel}: </span>
                <span className="text-xs text-text-primary">{field.value}</span>
              </div>
            </div>
          ))}
        </div>
        {donnaError && (
          <div className="px-4 py-2 border-t border-status-red/20 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            <p className="text-xs text-status-red">{donnaError}</p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-lime/15 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDonnaConfirm}
            disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
            className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {donnaSubmitting ? 'Saving…' : 'Confirm & Save Fitness Draft'}
          </button>
          <button
            type="button"
            onClick={handleDonnaDismiss}
            disabled={donnaSubmitting}
            className="btn-ghost text-xs px-3 py-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  function addBlock(type: FitnessBlockType) {
    if (fitnessBlocks.find(b => b.type === type)) return
    setFitnessBlocks(prev => [...prev, { id: `blk-${Date.now()}`, type, durationMin: getDefaultBlockDuration(type), exercises: [] }])
  }

  function removeBlock(id: string) {
    if (expandedBlockId === id) setExpandedBlockId(null)
    setFitnessBlocks(prev => prev.filter(b => b.id !== id))
  }

  function addExerciseToBlock(blockId: string, name: string) {
    setFitnessBlocks(prev => prev.map(b =>
      b.id === blockId && !b.exercises.includes(name)
        ? { ...b, exercises: [...b.exercises, name] }
        : b
    ))
  }

  function removeExerciseFromBlock(blockId: string, name: string) {
    setFitnessBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, exercises: b.exercises.filter(e => e !== name) } : b
    ))
  }

  async function handleSaveDraft() {
    setSaveStatus('saving')
    setSaveError(null)
    const currentGoalInfo = FITNESS_GOALS.find(g => g.id === selectedGoal)
    const result = await saveFitnessTemplateDraftFromWizardAction({
      curriculumLevel: selectedLevel,
      fitnessGoalId: selectedGoal,
      fitnessGoalLabel: currentGoalInfo?.label ?? selectedGoal,
      load,
      durationMin,
      blocks: fitnessBlocks.map(b => ({
        type: b.type,
        durationMin: b.durationMin,
        exercises: b.exercises,
      })),
    })
    if (result.success) {
      setSaveStatus('success')
    } else if (result.isSchemaMissing) {
      setSaveStatus('schema_missing')
    } else {
      setSaveStatus('error')
      setSaveError(result.error ?? 'Failed to save draft.')
    }
  }

  const goalInfo = FITNESS_GOALS.find(g => g.id === selectedGoal)
  const fitnessStage = getCurriculumStage(selectedLevel)
  const fitnessCurriculumPreview = fitnessStage ? getFitnessCurriculumPreview(fitnessStage) : null

  const suggestedTypes: FitnessBlockType[] = fitnessCurriculumPreview
    ? fitnessCurriculumPreview.suggestedBlockTypes
        .map(label => SUGGESTED_LABEL_TO_TYPE[label])
        .filter((t): t is FitnessBlockType => t !== undefined)
    : []

  const blockTotalMin = fitnessBlocks.reduce((sum, b) => sum + b.durationMin, 0)

  const allTennisTransfers: string[] = (() => {
    if (!fitnessStage) return []
    const transfers = new Set<string>()
    for (const blk of fitnessBlocks) {
      const suggestions = getExercisesForBlock(blk.type, fitnessStage)
      for (const ex of suggestions) {
        if (blk.exercises.includes(ex.name)) transfers.add(ex.tennisTransfer)
      }
    }
    return Array.from(transfers)
  })()

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates/fitness" className="hover:text-text-secondary transition-colors duration-100">Fitness Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Create</span>
        </nav>

        {/* Header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">Create Fitness Template</h1>
          <p className="page-subtitle">Build a physical training block step by step.</p>
        </div>

        {/* DONNA review banner */}
        {renderDonnaBanner()}

        {/* Review notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-surface-raised text-[11px] text-text-secondary">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Template drafts are submitted for director review — nothing goes live until a director approves.</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div className={[
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium',
                  isActive
                    ? 'bg-status-purple/10 border border-status-purple/25 text-status-purple'
                    : isDone
                      ? 'bg-surface-raised border border-border text-text-secondary'
                      : 'bg-surface border border-border text-text-muted',
                ].join(' ')}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-status-purple' : 'text-text-muted'}`} />
                  )}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-text-muted/30 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-surface p-6">

          {/* Step 1 — Curriculum Level */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Choose Curriculum Level</h2>
                <p className="text-sm text-text-secondary">The curriculum level is the source of truth. It determines the physical development needs, load guidance, and tennis transfer priorities for this template.</p>
              </div>

              {/* Level grid — 15 curriculum levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CURRICULUM_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={[
                      'flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-150',
                      selectedLevel === level
                        ? 'border-status-purple/30 bg-status-purple/8 shadow-[0_0_16px_rgba(161,0,255,0.06)]'
                        : 'border-border bg-surface-raised hover:border-status-purple/20',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold text-text-primary">{level}</span>
                    {selectedLevel === level && <CheckCircle2 className="w-4 h-4 text-status-purple shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Fitness curriculum preview */}
              {fitnessCurriculumPreview && (
                <div className="rounded-xl border border-status-purple/15 bg-status-purple/4 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] uppercase tracking-widest text-text-muted">
                      Curriculum-derived fitness preview — Not saved — Not applied
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Selected Level</p>
                    <p className="text-base font-bold text-status-purple">{selectedLevel}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Physical Development Need</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{fitnessCurriculumPreview.physicalDevelopmentNeed}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Tennis Technical Transfer</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{fitnessCurriculumPreview.tennisTechnicalTransfer}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Recommended Fitness Focus</p>
                      <p className="text-xs font-semibold text-status-purple">{fitnessCurriculumPreview.recommendedFitnessFocus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Load Guidance</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{fitnessCurriculumPreview.loadGuidance}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Suggested Block Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fitnessCurriculumPreview.suggestedBlockTypes.map(bt => (
                        <span key={bt} className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-status-purple/20 bg-status-purple/8 text-status-purple">
                          {bt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-1 border-t border-border">
                    <p className="text-[10px] text-text-muted">{fitnessCurriculumPreview.ageFitNote}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Fitness Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Choose Fitness Goal</h2>
                <p className="text-sm text-text-secondary">
                  What physical outcome are you training for this level?
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-purple/20 bg-status-purple/8 text-status-purple">{selectedLevel}</span>
                </p>
              </div>
              <div className="space-y-2">
                {FITNESS_GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={[
                      'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                      selectedGoal === goal.id
                        ? 'border-status-purple/30 bg-status-purple/8'
                        : 'border-border bg-surface-raised hover:border-status-purple/20',
                    ].join(' ')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedGoal === goal.id ? 'border-status-purple bg-status-purple' : 'border-border'}`}>
                      {selectedGoal === goal.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{goal.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{goal.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Load + Duration */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Set Load + Duration</h2>
                <p className="text-sm text-text-secondary">Define the intensity and length of this fitness block.</p>
              </div>

              {/* Load */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Training Load</p>
                <div className="grid grid-cols-3 gap-3">
                  {LOAD_LEVELS.map(level => {
                    const color = level === 'Light' ? 'status-green' : level === 'Moderate' ? 'status-orange' : 'status-red'
                    const isSelected = load === level
                    return (
                      <button
                        key={level}
                        onClick={() => setLoad(level)}
                        className={[
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150',
                          isSelected
                            ? `border-${color}/30 bg-${color}/8`
                            : 'border-border bg-surface-raised hover:border-border/60',
                        ].join(' ')}
                      >
                        <div className={`w-3 h-3 rounded-full bg-${color} ${isSelected ? 'shadow-[0_0_8px] shadow-current' : 'opacity-40'}`} />
                        <span className={`text-sm font-semibold ${isSelected ? `text-${color}` : 'text-text-muted'}`}>{level}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Duration</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDurationMin(d => Math.max(10, d - 5))}
                    className="w-10 h-10 rounded-xl border border-border bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-status-purple/20 transition-all duration-100 text-lg font-bold"
                  >
                    -
                  </button>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-mono font-bold text-text-primary">{durationMin}</span>
                    <span className="text-sm text-text-muted mb-1">min</span>
                  </div>
                  <button
                    onClick={() => setDurationMin(d => Math.min(90, d + 5))}
                    className="w-10 h-10 rounded-xl border border-border bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-status-purple/20 transition-all duration-100 text-lg font-bold"
                  >
                    +
                  </button>
                  <span className="text-xs text-text-muted ml-2">5-minute increments · 10–90min</span>
                </div>
              </div>

              {/* Load guidance from curriculum */}
              {fitnessCurriculumPreview && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-border bg-surface-raised">
                  <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Curriculum Load Guidance for {selectedLevel}</p>
                    <p className="text-xs text-text-secondary">{fitnessCurriculumPreview.loadGuidance}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Build Blocks */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Build Blocks</h2>
                <p className="text-sm text-text-secondary">
                  Add block types to structure this fitness template.
                  {fitnessCurriculumPreview && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-status-purple/20 bg-status-purple/8 text-status-purple">
                      {fitnessCurriculumPreview.recommendedFitnessFocus}
                    </span>
                  )}
                </p>
              </div>

              {/* Curriculum suggestions */}
              {suggestedTypes.length > 0 && (
                <div className="rounded-xl border border-status-purple/15 bg-status-purple/4 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-status-purple shrink-0" />
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum-Suggested for {selectedLevel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTypes.map(type => {
                      const isAdded = fitnessBlocks.some(b => b.type === type)
                      return (
                        <button
                          key={type}
                          onClick={() => isAdded ? removeBlock(fitnessBlocks.find(b => b.type === type)!.id) : addBlock(type)}
                          className={[
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150',
                            isAdded
                              ? 'border-status-green/25 bg-status-green/8 text-status-green'
                              : 'border-status-purple/20 bg-status-purple/8 text-status-purple hover:bg-status-purple/12',
                          ].join(' ')}
                        >
                          {isAdded ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {getFitnessBlockLabel(type)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All block types */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">All Block Types</p>
                <div className="space-y-2">
                  {FITNESS_BLOCK_TYPES.map(type => {
                    const isAdded = fitnessBlocks.some(b => b.type === type)
                    const isSuggested = suggestedTypes.includes(type)
                    return (
                      <div
                        key={type}
                        className={[
                          'flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                          isAdded ? 'border-status-green/20 bg-status-green/5' : 'border-border bg-surface-raised',
                        ].join(' ')}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${getFitnessBlockAccent(type)}`}>{getFitnessBlockLabel(type)}</p>
                            {isSuggested && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide border border-status-purple/20 bg-status-purple/8 text-status-purple">
                                Suggested
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">{getFitnessBlockIntent(type)}</p>
                          <p className="text-[10px] text-text-muted/60 mt-0.5">Default: {getDefaultBlockDuration(type)} min</p>
                        </div>
                        <button
                          onClick={() => isAdded ? removeBlock(fitnessBlocks.find(b => b.type === type)!.id) : addBlock(type)}
                          className={[
                            'w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-100 shrink-0',
                            isAdded
                              ? 'border-status-green/30 bg-status-green/10 text-status-green'
                              : 'border-border bg-surface text-text-muted hover:border-status-purple/20 hover:text-status-purple',
                          ].join(' ')}
                        >
                          {isAdded ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Added blocks with exercises per block */}
              {fitnessBlocks.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                    Block Sequence — {fitnessBlocks.length} block{fitnessBlocks.length !== 1 ? 's' : ''} · {blockTotalMin} min total
                  </p>
                  <div className="space-y-2">
                    {fitnessBlocks.map((blk, i) => {
                      const isExpanded = expandedBlockId === blk.id
                      const exerciseSuggestions = fitnessStage ? getExercisesForBlock(blk.type, fitnessStage) : []
                      return (
                        <div key={blk.id} className="rounded-xl border border-border bg-surface-raised overflow-hidden">
                          <div className="flex items-center gap-3 p-3">
                            <span className="text-[10px] font-mono text-text-muted w-4 shrink-0">{i + 1}</span>
                            <button
                              onClick={() => setExpandedBlockId(isExpanded ? null : blk.id)}
                              className="flex-1 flex items-center gap-2 text-left min-w-0"
                            >
                              <span className={`text-sm font-semibold ${getFitnessBlockAccent(blk.type)}`}>{getFitnessBlockLabel(blk.type)}</span>
                              <span className="text-[10px] text-text-muted">{blk.durationMin} min</span>
                              {blk.exercises.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] border border-status-green/20 bg-status-green/8 text-status-green">
                                  {blk.exercises.length} ex
                                </span>
                              )}
                              <span className="text-[10px] text-text-muted ml-auto">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                            <button
                              onClick={() => removeBlock(blk.id)}
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-status-red transition-colors duration-100 shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border p-3 space-y-2 bg-surface">
                              {exerciseSuggestions.length > 0 ? (
                                <>
                                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum exercises for {selectedLevel}</p>
                                  {exerciseSuggestions.map(ex => {
                                    const isAdded = blk.exercises.includes(ex.name)
                                    const progReg = getExerciseProgressionRegression(ex.name)
                                    return (
                                      <div key={ex.name} className="rounded-lg border border-border bg-surface-raised overflow-hidden">
                                        <div className="flex items-center gap-3 p-2.5">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text-primary">{ex.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                              <span className="text-[10px] text-text-muted">{ex.sets} sets · {ex.reps}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                              <Zap className="w-2.5 h-2.5 text-lime shrink-0" />
                                              <span className="text-[10px] font-medium text-lime">{ex.tennisTransfer}</span>
                                            </div>
                                            {ex.loadNote && (
                                              <p className="text-[10px] text-status-orange mt-0.5">{ex.loadNote}</p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => isAdded ? removeExerciseFromBlock(blk.id, ex.name) : addExerciseToBlock(blk.id, ex.name)}
                                            className={[
                                              'w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-100 shrink-0',
                                              isAdded
                                                ? 'border-status-green/30 bg-status-green/10 text-status-green'
                                                : 'border-border bg-surface text-text-muted hover:border-status-purple/20 hover:text-status-purple',
                                            ].join(' ')}
                                          >
                                            {isAdded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                          </button>
                                        </div>
                                        {progReg && (
                                          <div className="px-2.5 pb-2 pt-1.5 border-t border-border/50 space-y-1">
                                            <div className="flex items-start gap-1.5">
                                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-semibold border border-status-green/20 bg-status-green/8 text-status-green">Harder</span>
                                              <p className="text-[10px] text-text-muted leading-relaxed">{progReg.progression}</p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-semibold border border-status-blue/20 bg-status-blue/8 text-status-blue">Easier</span>
                                              <p className="text-[10px] text-text-muted leading-relaxed">{progReg.regression}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </>
                              ) : (
                                <p className="text-xs text-text-muted py-2">No exercise suggestions for this block type at the selected level.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {fitnessBlocks.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <LayoutTemplate className="w-8 h-8 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No blocks added yet. Select from the curriculum suggestions or all block types above.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Review Fitness Template</h2>
                <p className="text-sm text-text-secondary">Check everything before saving as a draft.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <GraduationCap className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Curriculum Level</p>
                    <p className="text-sm font-semibold text-text-primary">{selectedLevel || 'Not selected'}</p>
                    {fitnessCurriculumPreview && (
                      <p className="text-[10px] text-text-muted mt-0.5">{fitnessCurriculumPreview.recommendedFitnessFocus}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Target className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Fitness Goal</p>
                    <p className="text-sm font-semibold text-text-primary">{goalInfo?.label || 'Not selected'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Dumbbell className="w-4 h-4 text-status-purple shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Load + Duration</p>
                    <p className="text-sm font-semibold text-text-primary">{load} load — {durationMin}min</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <LayoutTemplate className="w-4 h-4 text-status-purple shrink-0" />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Block Structure</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {fitnessBlocks.length} block{fitnessBlocks.length !== 1 ? 's' : ''} — {blockTotalMin} min
                      </p>
                    </div>
                  </div>
                  {fitnessBlocks.length > 0 && (
                    <div className="space-y-1.5 pl-7">
                      {fitnessBlocks.map(blk => (
                        <div key={blk.id} className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getFitnessBlockBorderAccent(blk.type)} bg-surface ${getFitnessBlockAccent(blk.type)}`}>
                            {getFitnessBlockLabel(blk.type)} · {blk.durationMin}min
                          </span>
                          {blk.exercises.length > 0 && (
                            <span className="text-[10px] text-text-muted">{blk.exercises.length} exercise{blk.exercises.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {fitnessCurriculumPreview && (
                  <div className="p-4 rounded-xl bg-surface-raised border border-status-purple/15 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum Summary — {selectedLevel}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Physical Development Need</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{fitnessCurriculumPreview.physicalDevelopmentNeed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Tennis Technical Transfer</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{fitnessCurriculumPreview.tennisTechnicalTransfer}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Load Guidance</p>
                        <p className="text-xs text-text-secondary">{fitnessCurriculumPreview.loadGuidance}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Age Fit Note</p>
                        <p className="text-xs text-text-secondary">{fitnessCurriculumPreview.ageFitNote}</p>
                      </div>
                    </div>
                    {(() => {
                      const levelPreview = getCurriculumLevelPreview(selectedLevel)
                      return levelPreview ? (
                        <div className="pt-2 border-t border-border">
                          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Level Goal</p>
                          <p className="text-xs text-text-secondary">{levelPreview.levelGoal}</p>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
                {allTennisTransfers.length > 0 && (
                  <div className="p-3 rounded-xl bg-surface-raised border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 text-lime shrink-0" />
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Tennis Transfer Connections</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allTennisTransfers.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-lime/20 bg-lime/5 text-lime">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="p-4 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange mb-3 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Draft Safety
                  </p>
                  <p>This is a curriculum-derived fitness template draft. All exercises, loads, and block structures are coaching guidance — not a medical fitness plan.</p>
                  <p>Individual player load management should be reviewed by qualified coaching staff before delivery.</p>
                </div>
                {saveStatus === 'success' && (
                  <div className="rounded-xl border border-status-green/20 bg-status-green/5 p-4 mb-3 space-y-2">
                    <p className="text-sm font-semibold text-status-green flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Draft submitted for director review
                    </p>
                    <p className="text-[11px] text-text-secondary">Your fitness template draft has been saved. A director must approve it before it becomes available for coaching sessions.</p>
                    <ol className="space-y-1 pl-4 list-decimal text-[11px] text-text-muted">
                      <li>Director reviews load, exercises, and tennis transfers</li>
                      <li>Once approved, template status moves to Ready</li>
                      <li>Coaches can then use it in their session builder</li>
                    </ol>
                  </div>
                )}
                {saveStatus === 'schema_missing' && (
                  <div className="rounded-xl border border-status-orange/20 bg-status-orange/5 p-4 mb-3 space-y-1">
                    <p className="text-sm font-semibold text-status-orange flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Backend not yet available
                    </p>
                    <p className="text-[11px] text-text-muted">The template database is not connected yet. Your draft is ready but cannot be saved until the backend migration is applied.</p>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="rounded-xl border border-status-red/20 bg-status-red/5 p-4 mb-3 space-y-1">
                    <p className="text-sm font-semibold text-status-red flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Failed to save draft
                    </p>
                    <p className="text-[11px] text-text-muted">{saveError}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saveStatus === 'saving' || saveStatus === 'success'}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 active:scale-95 transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save as Draft
                      </>
                    )}
                  </button>
                  {selectedLevel && (
                    <Link
                      href={`/director/templates/coach-preview?level=${encodeURIComponent(selectedLevel)}&goal=${encodeURIComponent(goalInfo?.label ?? '')}&type=fitness`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border bg-surface-raised hover:border-status-purple/20 hover:text-text-primary transition-all duration-100"
                    >
                      <Eye className="w-4 h-4" />
                      Preview for Coach
                    </Link>
                  )}
                  <Link href="/director/templates/fitness" className="btn-ghost inline-flex items-center gap-2">
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1) as Step)}
            disabled={step === 1}
            className="btn-ghost inline-flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 5 && (
            <button
              onClick={() => {
                if (step === 1 && !selectedLevel) return
                if (step === 2 && !selectedGoal) return
                setStep(prev => Math.min(5, prev + 1) as Step)
              }}
              disabled={(step === 1 && !selectedLevel) || (step === 2 && !selectedGoal)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-status-purple border border-status-purple/30 bg-status-purple/10 hover:bg-status-purple/15 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DONNA tip */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-status-purple/15 bg-status-purple/4">
          <Sparkles className="w-4 h-4 text-status-purple shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">DONNA tip: </span>
            {step === 1 && 'The curriculum level determines the physical development priority. Red Ball needs coordination and fun; High Performance needs periodized load management.'}
            {step === 2 && 'Choose the fitness goal that best supports your curriculum focus this training block. Speed and agility templates are most commonly missing for Intermediate groups.'}
            {step === 3 && 'A 20–30min block works well at the start of a session. A 30–45min block works as a standalone fitness session. Keep High load for advanced groups only.'}
            {step === 4 && 'Start with curriculum-suggested block types. Each block type has a default duration — total time auto-calculates. You can always add more blocks for a longer session.'}
            {step === 5 && 'Review before saving. Once saved as a draft, you can add pathway connections and notes from the detail view.'}
          </p>
        </div>

      </div>

      <TemplateDonnaPanel mode="fitness_create" />
    </div>
  )
}

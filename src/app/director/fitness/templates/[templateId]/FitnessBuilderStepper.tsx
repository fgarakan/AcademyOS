'use client'

import { useState } from 'react'
import {
  Target, Dumbbell, GraduationCap, Zap, ListChecks,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, Activity,
  AlertTriangle, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { CurriculumLevelSelector } from './CurriculumLevelSelector'
import type { CurriculumLevelOption } from './CurriculumLevelSelector'
import { FitnessTemplateBuilderClient } from './FitnessTemplateBuilderClient'
import { PopulateFitnessBlocksButton } from './PopulateFitnessBlocksButton'
import { PopulateDrillNotesButton } from './PopulateDrillNotesButton'
import { TemplateMetaEditorCard } from './TemplateMetaEditorCard'
import { GenerateSessionPanel } from './GenerateSessionPanel'
import type { CoachOption, GateOption, LessonPlanBlock } from './GenerateSessionPanel'
import { CurriculumDrillReferencePanel } from '@/components/templates/CurriculumDrillReferencePanel'
import type { CurriculumDrillRow } from '@/lib/templates/curriculumTemplateLinks'
import {
  getFitnessBlockLabel,
  getFitnessBlockAccent,
  getFitnessBlockIntent,
  isFitnessBlockType,
} from '@/lib/fitness/fitnessBlockTypes'
import type { FitnessBlock, ExerciseLibraryItem } from './fitnessBuilderTypes'

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Goal', shortLabel: '1', icon: GraduationCap },
  { id: 2, label: 'Group', shortLabel: '2', icon: Target },
  { id: 3, label: 'Blocks', shortLabel: '3', icon: Dumbbell },
  { id: 4, label: 'Load Check', shortLabel: '4', icon: Zap },
  { id: 5, label: 'Publish', shortLabel: '5', icon: ListChecks },
] as const

// ─── Tennis transfer map (static — no DB calls) ───────────────────────────────

const TENNIS_TRANSFER: Record<string, string> = {
  movement:          'First-step quickness, recovery footwork after wide balls, split-step timing before shots.',
  agility:           'Change of direction on short balls, lateral movement in baseline rallies, net approach footwork.',
  speed:             'Acceleration to short balls, sprint recovery after drop shots, closing speed at net.',
  plyometrics:       'Explosive first step, jump to reach high balls, powerful rotation in serve and groundstrokes.',
  strength:          'Stable base for groundstrokes, serve power through the kinetic chain, injury resistance under load.',
  coordination:      'Smooth stroke mechanics, racket-head control, hand-eye tracking on fast balls.',
  mobility:          'Full shoulder rotation on serve, hip flexibility for wide forehands, ankle range for split steps.',
  recovery_cool_down: 'Muscle recovery between points and games, breathing control under pressure, injury prevention.',
}

// ─── Level-based physical development context (UI-only, no DB calls) ──────────

interface DevContext {
  priority: string
  transfer: string
  emphasis: string
  load: string
  watchFor: string
}

const LEVEL_DEV_CONTEXT: Record<string, DevContext> = {
  red: {
    priority: 'Balance, coordination, rhythm, playful movement, body awareness.',
    transfer: 'Helps players move to the ball, recover position, and stay organised on court.',
    emphasis: 'Fun, simple cues, short bursts. Praise effort and coordination over output.',
    load: 'Low intensity. Frequent rest. No extended conditioning.',
    watchFor: 'Players rushing, losing balance, or not understanding space.',
  },
  orange: {
    priority: 'Coordination, reaction, first step, balance, deceleration, recovery habits.',
    transfer: 'Supports split-step timing, rally recovery, and balance after contact.',
    emphasis: 'Clean movement before speed. Establish stopping mechanics.',
    load: 'Low to moderate intensity. Short work intervals with rest.',
    watchFor: 'Crossing feet too early, poor stopping mechanics, rushed movement.',
  },
  green: {
    priority: 'First-step quickness, change of direction, stamina, rotational control.',
    transfer: 'Supports wider court coverage, recovery after defense, and stronger stroke preparation.',
    emphasis: 'Controlled speed and repeatability. Quality over quantity.',
    load: 'Moderate intensity with planned recovery between sets.',
    watchFor: 'Sloppy movement under fatigue. Cutting corners on footwork.',
  },
  yellow: {
    priority: 'Speed, strength basics, repeated effort, power control, movement efficiency.',
    transfer: 'Supports point construction, defense-to-offense transitions, and match stamina.',
    emphasis: 'Intensity with quality. Debrief after each set.',
    load: 'Moderate to high depending on schedule and recent match load.',
    watchFor: 'Fatigue signs, poor landing mechanics, overtraining patterns.',
  },
  'high performance': {
    priority: 'Power, repeat sprint ability, strength, explosiveness, recovery, injury prevention.',
    transfer: 'Supports tournament-level movement, acceleration, braking, and high-intensity repeated points.',
    emphasis: 'Precision, intent, measurable quality. Periodise against match schedule.',
    load: 'Periodized and readiness-aware. Monitor weekly volume and intensity zones.',
    watchFor: 'Overload, asymmetry, poor recovery between sessions, mood changes.',
  },
  mixed: {
    priority: 'Scalable movement quality, coordination, balance, safe challenge for all levels.',
    transfer: 'Gives coaches progressions and regressions for players at different stages.',
    emphasis: 'Split groups when intensity diverges. Adjust cues by player level.',
    load: 'Flexible. Anchor to the lowest level in the group for safety.',
    watchFor: 'Younger or weaker players being pulled into inappropriate intensity.',
  },
}

function getDevContext(levelName: string | null): DevContext | null {
  if (!levelName) return null
  const name = levelName.toLowerCase()
  for (const key of Object.keys(LEVEL_DEV_CONTEXT)) {
    if (name.includes(key)) return LEVEL_DEV_CONTEXT[key]
  }
  return null
}

// ─── Stepper navigation bar ───────────────────────────────────────────────────

function StepperNav({
  activeStep,
  onGoTo,
}: {
  activeStep: number
  onGoTo: (n: number) => void
}) {
  return (
    <nav aria-label="Fitness template builder steps" className="flex items-center gap-0 overflow-x-auto">
      {STEPS.map((step, i) => {
        const isActive = step.id === activeStep
        const isDone = step.id < activeStep
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onGoTo(step.id)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors shrink-0',
                isActive
                  ? 'bg-lime/10 text-lime font-semibold'
                  : isDone
                  ? 'text-status-green hover:text-status-green/80'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <div className={[
                  'w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono shrink-0',
                  isActive ? 'border-lime text-lime' : 'border-border text-text-muted',
                ].join(' ')}>
                  {step.id}
                </div>
              )}
              <span className="hidden sm:block">{step.label}</span>
              <span className="sm:hidden font-mono">{step.shortLabel}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={[
                'w-6 h-px shrink-0',
                step.id < activeStep ? 'bg-status-green/40' : 'bg-border',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ─── Bottom navigation bar ────────────────────────────────────────────────────

function BottomNav({
  activeStep,
  totalSteps,
  onPrev,
  onNext,
}: {
  activeStep: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
}) {
  const nextLabel =
    activeStep === 1 ? 'Group' :
    activeStep === 2 ? 'Blocks' :
    activeStep === 3 ? 'Load Check' :
    activeStep === 4 ? 'Publish' :
    activeStep === totalSteps ? null : 'Next'

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
      <button
        onClick={onPrev}
        disabled={activeStep === 1}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <span className="text-[10px] text-text-muted tabular-nums">
        Step {activeStep} of {totalSteps}
      </span>
      {nextLabel ? (
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-lime transition-colors"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <span className="text-[10px] text-status-green flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Generate session below
        </span>
      )}
    </div>
  )
}

// ─── Step 1 — Player Level + Development Focus ────────────────────────────────

function Step1DevelopmentFocus({
  templateId,
  curriculumLevelId,
  currentLevelName,
  curriculumLevels,
  curriculumDrills,
  fitnessBlocks,
}: {
  templateId: string
  curriculumLevelId: string | null
  currentLevelName: string | null
  curriculumLevels: CurriculumLevelOption[]
  curriculumDrills: CurriculumDrillRow[]
  fitnessBlocks: FitnessBlock[]
}) {
  const [showRelatedOutcomes, setShowRelatedOutcomes] = useState(false)
  const devCtx = getDevContext(currentLevelName)

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Start with the player level. This sets the physical priorities, tennis transfer, and coaching emphasis for the fitness plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="label-xs">Player Level</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {curriculumLevels.length > 0 ? (
            <>
              <CurriculumLevelSelector
                templateId={templateId}
                currentLevelId={curriculumLevelId}
                levels={curriculumLevels}
              />
              {currentLevelName && (
                <p className="text-[10px] text-text-muted">
                  Physical priorities and coaching emphasis will reflect{' '}
                  <span className="text-lime">{currentLevelName}</span>.
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] text-text-muted">No curriculum levels available. Seed the curriculum to enable this feature.</p>
          )}
        </CardContent>
      </Card>

      {devCtx && currentLevelName && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-lime" />
              <p className="text-sm font-semibold text-text-primary">
                {currentLevelName} — Development Focus
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Physical Priorities</p>
                <p className="text-xs text-text-secondary leading-relaxed">{devCtx.priority}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-lime mb-1.5">Tennis Transfer</p>
                <p className="text-xs text-text-secondary leading-relaxed">{devCtx.transfer}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Coaching Emphasis</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{devCtx.emphasis}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Load Guidance</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{devCtx.load}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-orange mb-1">Watch For</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{devCtx.watchFor}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!curriculumLevelId && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <GraduationCap className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary">No player level assigned yet.</p>
            <p className="text-xs text-text-muted">Assign a level above to see physical development priorities and coaching emphasis for this group.</p>
          </CardContent>
        </Card>
      )}

      {curriculumLevelId && curriculumDrills.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowRelatedOutcomes(v => !v)}
            className="flex items-center gap-2 text-[11px] text-text-muted hover:text-text-secondary transition-colors mb-2"
          >
            <span className={[
              'w-3 h-3 border border-border rounded-sm flex items-center justify-center text-[8px] transition-colors',
              showRelatedOutcomes ? 'bg-surface-raised' : '',
            ].join(' ')}>
              {showRelatedOutcomes ? '−' : '+'}
            </span>
            Related Tennis Outcomes ({curriculumDrills.length} curriculum drills)
          </button>
          {showRelatedOutcomes && (
            <CurriculumDrillReferencePanel
              drills={curriculumDrills}
              levelName={currentLevelName ?? ''}
            />
          )}
        </div>
      )}

      {curriculumLevelId && fitnessBlocks.length > 0 && (
        <Card>
          <CardHeader>
            <p className="label-xs">Push Curriculum Context to Block Notes</p>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-text-muted mb-3">
              Writes curriculum development context into block notes so coaches see physical priorities during the session.
            </p>
            <PopulateDrillNotesButton
              templateId={templateId}
              hasBlocks={fitnessBlocks.length > 0}
              hasLevel={!!curriculumLevelId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Step 2 — Training Goal ───────────────────────────────────────────────────

function Step2TrainingGoal({
  templateId,
  templateName,
  templateDescription,
  templateDurationMin,
  templateIsActive,
  templateCreatedAt,
  templateUpdatedAt,
  typeLabel,
  fitnessBlocks,
}: {
  templateId: string
  templateName: string
  templateDescription: string | null
  templateDurationMin: number | null
  templateIsActive: boolean
  templateCreatedAt: string
  templateUpdatedAt: string | null
  typeLabel: string
  fitnessBlocks: FitnessBlock[]
}) {
  const totalExercises = fitnessBlocks.reduce((sum, b) => sum + b.exercises.length, 0)
  const blockDurationTotal = fitnessBlocks.reduce((sum, b) => sum + (b.duration_min ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Choose the training goal for this session: speed, coordination, strength, mobility, recovery, or readiness. This sets the intent for the physical blocks.
        </p>
      </div>

      <Card>
        <CardContent className="py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-4">
            <div className="col-span-2 sm:col-span-4">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Template Name</p>
              <p className="text-lg font-semibold text-text-primary">{templateName}</p>
              {templateDescription && (
                <p className="text-xs text-text-secondary mt-1">{templateDescription}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Training Type</p>
              <p className="text-sm text-text-primary flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-lime" />
                {typeLabel}
              </p>
            </div>
            {templateDurationMin != null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Duration</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {templateDurationMin} min
                </p>
              </div>
            )}
            {blockDurationTotal > 0 && templateDurationMin == null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Block Time</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {blockDurationTotal} min
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-base font-mono font-bold text-lime">{fitnessBlocks.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
              <p className="text-base font-mono font-bold text-lime">{totalExercises}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center gap-3 flex-wrap">
            <span className={[
              'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
              templateIsActive
                ? 'border-status-green/50 text-status-green'
                : 'border-border text-text-muted',
            ].join(' ')}>
              {templateIsActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-lime/20 text-lime/60">
              Fitness OS
            </span>
            <span className="text-[10px] text-text-muted ml-auto">
              Created {new Date(templateCreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              {templateUpdatedAt && templateUpdatedAt !== templateCreatedAt && (
                <span className="ml-2">· Updated {new Date(templateUpdatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <TemplateMetaEditorCard
        templateId={templateId}
        initialName={templateName}
        initialDescription={templateDescription}
        initialDurationMin={templateDurationMin}
      />
    </div>
  )
}

// ─── Step 3 — Physical Blocks ─────────────────────────────────────────────────

function Step3PhysicalBlocks({
  templateId,
  fitnessBlocks,
  exerciseLibrary,
  libraryQueryError,
  totalExercisesInAcademy,
  blockExercisesQueryError,
}: {
  templateId: string
  fitnessBlocks: FitnessBlock[]
  exerciseLibrary: ExerciseLibraryItem[]
  libraryQueryError: string | null
  totalExercisesInAcademy: number
  blockExercisesQueryError: string | null
}) {
  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Build the physical blocks. These should match the player level, training goal, and available time. Each block targets a specific athletic quality.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <p className="label-xs">Auto-Populate Exercises</p>
            {exerciseLibrary.length > 0 && (
              <span className="text-[10px] font-mono text-lime px-2 py-0.5 rounded-full border border-lime/20 bg-lime/5">
                {exerciseLibrary.length} exercise{exerciseLibrary.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {exerciseLibrary.length === 0 && (
            <p className="text-[11px] text-text-muted mb-3">
              {totalExercisesInAcademy > 0
                ? `${totalExercisesInAcademy} exercise${totalExercisesInAcademy !== 1 ? 's' : ''} found but none are active. Update exercise is_active status to enable auto-population.`
                : 'Exercise library is empty. Import exercises to enable auto-population.'}
            </p>
          )}
          <PopulateFitnessBlocksButton
            templateId={templateId}
            hasBlocks={fitnessBlocks.length > 0}
            exerciseLibraryCount={exerciseLibrary.length}
          />
        </CardContent>
      </Card>

      <FitnessTemplateBuilderClient
        templateId={templateId}
        initialBlocks={fitnessBlocks}
        exerciseLibrary={exerciseLibrary}
        libraryQueryError={libraryQueryError}
        totalExercisesInAcademy={totalExercisesInAcademy}
        blockExercisesQueryError={blockExercisesQueryError}
      />
    </div>
  )
}

// ─── Step 4 — Tennis Transfer + Coach Cues ───────────────────────────────────

function Step4TennisTransfer({
  fitnessBlocks,
  currentLevelName,
}: {
  fitnessBlocks: FitnessBlock[]
  currentLevelName: string | null
}) {
  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Check that each fitness block is appropriate for the group&apos;s level, load capacity, and current training phase. Review how each block transfers to on-court performance.
          {currentLevelName && (
            <span className="text-lime"> Level: {currentLevelName}.</span>
          )}
        </p>
      </div>

      {fitnessBlocks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <Zap className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary">No fitness blocks yet.</p>
            <p className="text-xs text-text-muted">Go back to Physical Blocks and add fitness blocks to see their tennis transfer context.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fitnessBlocks.map((block, i) => {
            const fbt = block.fitnessBlockType
            const label = fbt ? getFitnessBlockLabel(fbt) : block.name
            const accent = fbt ? getFitnessBlockAccent(fbt) : 'text-text-muted'
            const intent = fbt ? getFitnessBlockIntent(fbt) : null
            const transfer = fbt && isFitnessBlockType(fbt) ? TENNIS_TRANSFER[fbt] : null

            return (
              <Card key={block.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-[10px] font-mono text-text-muted w-5 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`text-sm font-semibold ${accent}`}>{label}</p>
                        {block.duration_min != null && (
                          <span className="flex items-center gap-1 text-[10px] text-text-muted">
                            <Clock className="w-2.5 h-2.5" />{block.duration_min}min
                          </span>
                        )}
                      </div>
                      {intent && (
                        <p className="text-xs text-text-muted">{intent}</p>
                      )}
                    </div>
                  </div>

                  {transfer && (
                    <div className="pl-8 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-lime mb-1.5">On-Court Transfer</p>
                      <p className="text-xs text-text-secondary flex items-start gap-1.5">
                        <ArrowRight className="w-3 h-3 text-lime mt-0.5 shrink-0" />
                        {transfer}
                      </p>
                    </div>
                  )}

                  {block.exercises.length > 0 && (
                    <div className="pl-8 mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
                        Exercises in this block
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {block.exercises.map(ex => (
                          <span key={ex.id} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-muted">
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.exercises.length === 0 && (
                    <div className="pl-8 mt-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-status-orange/60 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-text-muted italic">No exercises in this block yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Step 5 — Review + Save ───────────────────────────────────────────────────

function Step5ReviewSave({
  templateId,
  templateName,
  fitnessBlocks,
  coaches,
  fallbackCoachId,
  fallbackCoachName,
  focusGatesForSession,
  lessonPlanBlocks,
  currentLevelName,
}: {
  templateId: string
  templateName: string
  fitnessBlocks: FitnessBlock[]
  coaches: CoachOption[]
  fallbackCoachId: string
  fallbackCoachName: string
  focusGatesForSession: GateOption[]
  lessonPlanBlocks: LessonPlanBlock[]
  currentLevelName: string | null
}) {
  const totalExercises = fitnessBlocks.reduce((sum, b) => sum + b.exercises.length, 0)
  const blockDurationTotal = fitnessBlocks.reduce((sum, b) => sum + (b.duration_min ?? 0), 0)
  const blocksWithExercises = fitnessBlocks.filter(b => b.exercises.length > 0)
  const emptyBlocks = fitnessBlocks.filter(b => b.exercises.length === 0)

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Review the fitness plan and publish it as a session. Coaches will see this block structure and exercises when they run the session.
        </p>
      </div>

      {/* Summary stats */}
      <Card>
        <CardContent className="py-4">
          <p className="label-xs mb-3">Fitness Plan Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-xl font-mono font-bold text-lime">{fitnessBlocks.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
              <p className="text-xl font-mono font-bold text-lime">{totalExercises}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks Ready</p>
              <p className={[
                'text-xl font-mono font-bold',
                blocksWithExercises.length === fitnessBlocks.length && fitnessBlocks.length > 0
                  ? 'text-status-green'
                  : 'text-status-orange',
              ].join(' ')}>
                {blocksWithExercises.length}/{fitnessBlocks.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Total Duration</p>
              <p className="text-xl font-mono font-bold text-text-primary">
                {blockDurationTotal > 0 ? `${blockDurationTotal}m` : '—'}
              </p>
            </div>
          </div>

          {currentLevelName && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-text-muted">
                Curriculum context: <span className="text-lime">{currentLevelName}</span>
              </p>
            </div>
          )}

          {emptyBlocks.length > 0 && (
            <div className={[
              'flex items-start gap-2',
              currentLevelName ? 'mt-3' : 'mt-4 pt-4 border-t border-border',
            ].join(' ')}>
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-status-orange leading-snug">
                {emptyBlocks.length} block{emptyBlocks.length !== 1 ? 's' : ''} without exercises — coaches will run {emptyBlocks.length !== 1 ? 'them' : 'it'} without a guided exercise plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block sequence */}
      {fitnessBlocks.length > 0 && (
        <div>
          <p className="label-xs mb-3">Block Sequence</p>
          <div className="space-y-2">
            {fitnessBlocks.map((block, i) => {
              const fbt = block.fitnessBlockType
              const label = fbt ? getFitnessBlockLabel(fbt) : block.name
              const accent = fbt ? getFitnessBlockAccent(fbt) : 'text-text-muted'
              return (
                <div key={block.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-[10px] font-mono text-text-muted w-5 text-center shrink-0">{i + 1}</span>
                  <p className={`text-xs font-medium flex-1 ${accent}`}>{label}</p>
                  {block.duration_min != null && (
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{block.duration_min}m
                    </span>
                  )}
                  <span className={`text-[10px] ${block.exercises.length > 0 ? 'text-status-green' : 'text-text-muted'}`}>
                    {block.exercises.length} ex
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generate session */}
      <Card>
        <CardHeader>
          <p className="label-xs">Create Session from Template</p>
        </CardHeader>
        <CardContent className="pt-0">
          <GenerateSessionPanel
            templateId={templateId}
            templateName={templateName}
            hasBlocks={fitnessBlocks.length > 0}
            coaches={coaches}
            fallbackCoachId={fallbackCoachId}
            fallbackCoachName={fallbackCoachName}
            focusGates={focusGatesForSession}
            blocks={lessonPlanBlocks}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Props interface ──────────────────────────────────────────────────────────

export interface FitnessBuilderStepperProps {
  templateId: string
  templateName: string
  templateDescription: string | null
  templateDurationMin: number | null
  templateIsActive: boolean
  templateCreatedAt: string
  templateUpdatedAt: string | null
  typeLabel: string
  curriculumLevelId: string | null
  currentLevelName: string | null
  curriculumLevels: CurriculumLevelOption[]
  curriculumDrills: CurriculumDrillRow[]
  focusGatesForSession: GateOption[]
  coaches: CoachOption[]
  fallbackCoachId: string
  fallbackCoachName: string
  fitnessBlocks: FitnessBlock[]
  exerciseLibrary: ExerciseLibraryItem[]
  libraryQueryError: string | null
  totalExercisesInAcademy: number
  blockExercisesQueryError: string | null
  lessonPlanBlocks: LessonPlanBlock[]
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FitnessBuilderStepper({
  templateId,
  templateName,
  templateDescription,
  templateDurationMin,
  templateIsActive,
  templateCreatedAt,
  templateUpdatedAt,
  typeLabel,
  curriculumLevelId,
  currentLevelName,
  curriculumLevels,
  curriculumDrills,
  focusGatesForSession,
  coaches,
  fallbackCoachId,
  fallbackCoachName,
  fitnessBlocks,
  exerciseLibrary,
  libraryQueryError,
  totalExercisesInAcademy,
  blockExercisesQueryError,
  lessonPlanBlocks,
}: FitnessBuilderStepperProps) {
  const [activeStep, setActiveStep] = useState(1)
  const totalSteps = STEPS.length

  function prev() { setActiveStep(s => Math.max(1, s - 1)) }
  function next() { setActiveStep(s => Math.min(totalSteps, s + 1)) }

  return (
    <div className="space-y-5">
      <StepperNav activeStep={activeStep} onGoTo={setActiveStep} />

      <div className="min-h-[400px]">
        {activeStep === 1 && (
          <Step1DevelopmentFocus
            templateId={templateId}
            curriculumLevelId={curriculumLevelId}
            currentLevelName={currentLevelName}
            curriculumLevels={curriculumLevels}
            curriculumDrills={curriculumDrills}
            fitnessBlocks={fitnessBlocks}
          />
        )}

        {activeStep === 2 && (
          <Step2TrainingGoal
            templateId={templateId}
            templateName={templateName}
            templateDescription={templateDescription}
            templateDurationMin={templateDurationMin}
            templateIsActive={templateIsActive}
            templateCreatedAt={templateCreatedAt}
            templateUpdatedAt={templateUpdatedAt}
            typeLabel={typeLabel}
            fitnessBlocks={fitnessBlocks}
          />
        )}

        {activeStep === 3 && (
          <Step3PhysicalBlocks
            templateId={templateId}
            fitnessBlocks={fitnessBlocks}
            exerciseLibrary={exerciseLibrary}
            libraryQueryError={libraryQueryError}
            totalExercisesInAcademy={totalExercisesInAcademy}
            blockExercisesQueryError={blockExercisesQueryError}
          />
        )}

        {activeStep === 4 && (
          <Step4TennisTransfer
            fitnessBlocks={fitnessBlocks}
            currentLevelName={currentLevelName}
          />
        )}

        {activeStep === 5 && (
          <Step5ReviewSave
            templateId={templateId}
            templateName={templateName}
            fitnessBlocks={fitnessBlocks}
            coaches={coaches}
            fallbackCoachId={fallbackCoachId}
            fallbackCoachName={fallbackCoachName}
            focusGatesForSession={focusGatesForSession}
            lessonPlanBlocks={lessonPlanBlocks}
            currentLevelName={currentLevelName}
          />
        )}
      </div>

      <BottomNav
        activeStep={activeStep}
        totalSteps={totalSteps}
        onPrev={prev}
        onNext={next}
      />
    </div>
  )
}

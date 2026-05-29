'use client'

import { useState } from 'react'
import {
  BookOpen, Layers, Pencil, Eye, ListChecks,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle,
  AlertTriangle, GraduationCap, ArrowUpRight, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { ClassTemplateCurriculumSelector } from './ClassTemplateCurriculumSelector'
import type { CurriculumLevelOption } from './ClassTemplateCurriculumSelector'
import { BlockContentPickerCard } from './BlockContentPickerCard'
import type { AssignedItem, AvailableContentItem } from './BlockContentPickerCard'
import { LessonPlanDraftPanel } from './LessonPlanDraftPanel'
import { TemplateSessionPreviewCard } from './TemplateSessionPreviewCard'
import type { PreviewBlock } from './TemplateSessionPreviewCard'
import { ClassTemplateSetupGuide } from '@/components/onboarding/ClassTemplateSetupGuide'
import { GenerateSessionFromTemplateButton } from './GenerateSessionFromTemplateButton'
import type { CoachOption, GateOption } from './GenerateSessionFromTemplateButton'

// ─── Prop types ───────────────────────────────────────────────────────────────

interface CurriculumBlockRowProp {
  id: string
  block_id: string
  content_item_id: string | null
  drill_id: string | null
  order_index: number
  notes: string | null
  duration_min: number | null
  content_item: {
    title: string
    description: string | null
    content_type: string
    domain: string | null
    session_block_hint: string | null
    is_coach_only: boolean | null
    coach_cues: string[] | null
    success_criteria: string[] | null
    progressions: string[] | null
    regressions: string[] | null
    duration_min: number | null
  } | null
  drill: {
    name: string
    description: string | null
    domain: string | null
    cues: string[] | null
    success_criteria: string[] | null
    progressions: string[] | null
    regressions: string[] | null
    duration_min: number | null
  } | null
}

interface BlockProp {
  id: string
  name: string
  type: string | null
  duration_min: number | null
  order_index: number
  notes: string | null
}

export interface ClassTemplateBuilderStepperProps {
  templateId: string
  templateName: string
  templateDescription: string | null
  templateTrack: string | null
  templateDurationMin: number | null
  templateIsActive: boolean
  curriculumLevelId: string | null
  currentLevelName: string | null
  curriculumLevels: CurriculumLevelOption[]
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
  availableContent: AvailableContentItem[]
  previewBlocks: PreviewBlock[]
  focusGates: GateOption[]
  coaches: CoachOption[]
  sessionCount: number
  userId: string
  userDisplayName: string
  hasCurriculumContent: boolean
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Class Identity', shortLabel: '1', icon: BookOpen },
  { id: 2, label: 'Class Structure', shortLabel: '2', icon: Layers },
  { id: 3, label: 'Build Blocks', shortLabel: '3', icon: Pencil },
  { id: 4, label: 'Coach Preview', shortLabel: '4', icon: Eye },
  { id: 5, label: 'Review + Apply', shortLabel: '5', icon: ListChecks },
] as const

// ─── Display helpers ──────────────────────────────────────────────────────────

const CONTENT_TYPE_BADGE: Record<string, string> = {
  drill:                'bg-lime/10 text-lime border-lime/20',
  tactical_game:        'bg-status-blue/10 text-status-blue border-status-blue/20',
  situational:          'bg-status-orange/10 text-status-orange border-status-orange/20',
  match_play_theme:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  mental_skill:         'bg-status-green/10 text-status-green border-status-green/20',
  competition_behavior: 'bg-status-orange/10 text-status-orange border-status-orange/20',
  coach_cue:            'bg-lime/5 text-lime border-lime/10',
  warmup:               'bg-border/50 text-text-secondary border-border',
  cooldown:             'bg-border/50 text-text-secondary border-border',
  success_criteria:     'bg-status-green/5 text-status-green border-status-green/10',
  progression:          'bg-lime/10 text-lime border-lime/20',
  regression:           'bg-border/50 text-text-muted border-border',
  player_mission:       'bg-status-blue/5 text-status-blue border-status-blue/10',
}
function contentBadge(t: string) {
  return CONTENT_TYPE_BADGE[t] ?? 'bg-border/50 text-text-muted border-border'
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  drill:                'Drill',
  tactical_game:        'Tactical Game',
  situational:          'Situational',
  match_play_theme:     'Match-Play Theme',
  mental_skill:         'Mental Skill',
  competition_behavior: 'Competition',
  coach_cue:            'Coach Cue',
  warmup:               'Warm-Up',
  cooldown:             'Cool-Down',
  success_criteria:     'Success Criteria',
  progression:          'Progression',
  regression:           'Regression',
  player_mission:       'Player Mission',
  parent_guidance:      'Parent Guidance',
}
function contentLabel(t: string) {
  return CONTENT_TYPE_LABEL[t] ?? t.replace(/_/g, ' ')
}

// Block purpose copy — plain language, director-facing
function blockPurposeCopy(blockType: string): string {
  const map: Record<string, string> = {
    warm_up:     'Opens the session. Sets energy, focus, and movement readiness.',
    technical:   'Focused skill work. Coaches teach and reinforce a specific technical target.',
    tactical:    'Decision-making practice. Players learn to read and respond to match situations.',
    competition: 'Match-play format. Players compete with structure, stakes, and coach observation.',
    mental:      'Focus and mindset. Coaches introduce a mental skill or competition behavior to practice.',
    cool_down:   'Closes the session. Coaches connect the work to the development plan.',
    fitness:     'Optional physical preparation block. Add this when the class plan includes dedicated athletic work. Not a default tennis session block.',
    movement:    'Optional physical preparation block. Add this when the class plan includes dedicated athletic work. Not a default tennis session block.',
  }
  return map[blockType] ?? 'Add drills, games, coaching cues, or focus items for this block.'
}

// Returns true for block types that are physical/fitness (not tennis-session) in origin.
// These blocks should be clearly labeled as optional in a class template context.
function isFitnessBlockInClassTemplate(blockType: string): boolean {
  return blockType === 'fitness' || blockType === 'movement'
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
    <nav aria-label="Template builder steps" className="flex items-center gap-0 overflow-x-auto">
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

// ─── Bottom navigation bar ─────────────────────────────────────────────────────

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
    activeStep === 3 ? 'Coach Preview' :
    activeStep === 4 ? 'Review + Apply' :
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
          Apply below
        </span>
      )}
    </div>
  )
}

// ─── Step 1 — Class Identity ──────────────────────────────────────────────────

function Step1Identity({
  templateId,
  templateName,
  templateDescription,
  templateTrack,
  templateDurationMin,
  templateIsActive,
  curriculumLevelId,
  currentLevelName,
  curriculumLevels,
  blockList,
  blockDurationTotal,
}: {
  templateId: string
  templateName: string
  templateDescription: string | null
  templateTrack: string | null
  templateDurationMin: number | null
  templateIsActive: boolean
  curriculumLevelId: string | null
  currentLevelName: string | null
  curriculumLevels: CurriculumLevelOption[]
  blockList: BlockProp[]
  blockDurationTotal: number
}) {
  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Start with the class identity. This tells Academy OS what kind of players this plan is built for and what coaches should prioritize.
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
            {templateTrack && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Track</p>
                <p className="text-sm text-text-primary">{templateTrack}</p>
              </div>
            )}
            {(templateDurationMin != null) && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Session Duration</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {templateDurationMin} min
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-base font-mono font-bold text-lime">{blockList.length}</p>
            </div>
            {blockDurationTotal > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Block Time</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {blockDurationTotal} min
                </p>
              </div>
            )}
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
            {currentLevelName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-lime/20 bg-lime/5 text-lime">
                <GraduationCap className="w-2.5 h-2.5" />
                {currentLevelName}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div data-donna-focus-id="template-level-picker">
        <Card>
          <CardHeader>
            <p className="label-xs">Curriculum Level</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-xs text-text-muted">
              Choose the curriculum level this class is designed for. This powers coaching cues, learning goals, and session context for coaches.
            </p>
            {curriculumLevels.length > 0 ? (
              <ClassTemplateCurriculumSelector
                templateId={templateId}
                currentLevelId={curriculumLevelId}
                levels={curriculumLevels}
              />
            ) : (
              <p className="text-[11px] text-text-muted">No curriculum levels available. Seed the curriculum to enable this feature.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Step 2 — Class Structure ─────────────────────────────────────────────────

function Step2Structure({
  blockList,
  blockDisplayNames,
  curriculumByBlock,
  blockDurationTotal,
  onBuildBlocks,
}: {
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
  blockDurationTotal: number
  onBuildBlocks: () => void
}) {
  const emptyCount = blockList.filter(b => (curriculumByBlock[b.id] ?? []).length === 0).length

  return (
    <div className="space-y-5">
      {/* Sprint 963: explanatory note — what's editable now vs V2 */}
      <div className="space-y-2">
        <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Your class has these major sections in order. Each block needs curriculum activities before coaches can follow a guided plan. Go to <span className="text-lime font-medium">Build Blocks</span> (Step 3) to add drills, games, and coaching cues.
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl border border-border/50 bg-surface/50 flex items-start gap-2">
          <Circle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            <span className="font-medium text-text-secondary">Block sections and order</span> (Warm-Up, Skill Foundation, etc.) reflect the template&apos;s default structure. Adding, removing, or reordering these sections is available in a future update. The default order here is separate from any live session runtime adjustments coaches make on court.
          </p>
        </div>
      </div>

      {blockList.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-2">
              <Layers className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-sm text-text-primary">No blocks in this template yet.</p>
              <p className="text-xs text-text-muted">Blocks are added when the template is created or seeded.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-donna-focus-id="class-template-block-list">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-text-muted">
              {blockList.length} section{blockList.length !== 1 ? 's' : ''}
              {blockDurationTotal > 0 ? ` · ${blockDurationTotal} min total` : ''}
            </p>
            {emptyCount === 0 && (
              <span className="text-[10px] text-status-green flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All blocks have content
              </span>
            )}
          </div>

          {blockList.map((block, i) => {
            const items = curriculumByBlock[block.id] ?? []
            const hasContent = items.length > 0
            const displayName = blockDisplayNames[block.id] ?? block.name

            const isFitnessBlock = isFitnessBlockInClassTemplate(block.type ?? '')
            return (
              <Card key={block.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-muted w-5 shrink-0 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                        {isFitnessBlock && (
                          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-status-orange/30 text-status-orange bg-status-orange/5 shrink-0">
                            Optional Fitness Block
                          </span>
                        )}
                      </div>
                      {block.duration_min != null && (
                        <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {block.duration_min} min
                        </p>
                      )}
                      {/* Sprint 963: block purpose copy — reuses blockPurposeCopy() defined above */}
                      <p className="text-[10px] text-text-muted/70 mt-1 leading-snug hidden sm:block">
                        {blockPurposeCopy(block.type ?? '')}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {hasContent ? (
                        <span className="text-[10px] text-status-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Circle className="w-3 h-3" />
                          Nothing added yet
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {emptyCount > 0 && (
            <div className="pt-1">
              <button
                onClick={onBuildBlocks}
                className="btn-lime text-xs px-4 py-2 flex items-center gap-1.5"
              >
                Build Out Blocks
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 3 — Build Blocks ────────────────────────────────────────────────────

function Step3BuildBlocks({
  templateId,
  blockList,
  blockDisplayNames,
  curriculumByBlock,
  availableContent,
}: {
  templateId: string
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
  availableContent: AvailableContentItem[]
}) {
  // Sprint 963: outer wrapper adds data-donna-focus-id="class-template-primary-action"
  return (
    <div data-donna-focus-id="class-template-primary-action">
    <div className="space-y-5" data-donna-focus-id="template-blocks-section">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Choose what coaches should run during each part of class. Add drills, games, coaching cues, or mental focus items. Remove anything that does not fit.
        </p>
      </div>

      {blockList.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-xs text-text-muted text-center">No blocks in this template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blockList.map(block => {
            const curriculumItems = curriculumByBlock[block.id] ?? []
            const displayName = blockDisplayNames[block.id] ?? block.name

            const assignedItems: AssignedItem[] = curriculumItems.map(row => ({
              cctbId: row.id,
              contentItemId: row.content_item_id,
              drillId: row.drill_id,
              title: row.content_item?.title ?? row.drill?.name ?? 'Untitled',
              contentType: row.content_item?.content_type ?? 'drill',
              domain: row.content_item?.domain ?? row.drill?.domain ?? null,
              sessionBlockHint: row.content_item?.session_block_hint ?? null,
              durationMin: row.duration_min ?? row.content_item?.duration_min ?? row.drill?.duration_min ?? null,
              orderIndex: row.order_index,
            }))

            const isFitnessBlock = isFitnessBlockInClassTemplate(block.type ?? '')
            return (
              <Card key={block.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                        {isFitnessBlock && (
                          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-status-orange/30 text-status-orange bg-status-orange/5 shrink-0">
                            Optional Fitness Block
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted">{blockPurposeCopy(block.type ?? '')}</p>
                    </div>
                    {block.duration_min != null && (
                      <div className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {block.duration_min}min
                      </div>
                    )}
                  </div>

                  <BlockContentPickerCard
                    blockId={block.id}
                    blockName={displayName}
                    templateId={templateId}
                    initialAssigned={assignedItems}
                    available={availableContent}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
    </div>
  )
}

// ─── Step 4 — Coach Preview ───────────────────────────────────────────────────

function Step4CoachPreview({
  previewBlocks,
  currentLevelName,
  blockList,
  blockDisplayNames,
  curriculumByBlock,
}: {
  previewBlocks: PreviewBlock[]
  currentLevelName: string | null
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
}) {
  const hasAnyContent = blockList.some(b => (curriculumByBlock[b.id] ?? []).length > 0)

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          This is what coaches see when they run sessions from this template. Check that every block has clear goals, cues, and activities.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <TemplateSessionPreviewCard blocks={previewBlocks} levelName={currentLevelName} />
        </CardContent>
      </Card>

      {hasAnyContent && (
        <div className="space-y-4">
          <p className="label-xs">Coach Plan — Drill and Activity Detail</p>
          {blockList.map(block => {
            const items = curriculumByBlock[block.id] ?? []
            if (items.length === 0) return null
            const displayName = blockDisplayNames[block.id] ?? block.name

            return (
              <Card key={block.id}>
                <CardContent className="py-4">
                  <p className="text-sm font-semibold text-text-primary mb-3">{displayName}</p>
                  <div className="space-y-3">
                    {items.map((row, j) => {
                      const ci = row.content_item
                      const dr = row.drill
                      const title = ci?.title ?? dr?.name ?? 'Untitled'
                      const description = ci?.description ?? dr?.description ?? null
                      const domain = ci?.domain ?? dr?.domain ?? null
                      const cues = ci?.coach_cues ?? dr?.cues ?? null
                      const criteria = ci?.success_criteria ?? dr?.success_criteria ?? null
                      const progs = ci?.progressions ?? dr?.progressions ?? null
                      const regs = ci?.regressions ?? dr?.regressions ?? null
                      const contentType = ci?.content_type ?? 'drill'
                      const duration = row.duration_min ?? ci?.duration_min ?? dr?.duration_min ?? null
                      const isMental = contentType === 'mental_skill' || contentType === 'competition_behavior'

                      return (
                        <div key={row.id} className={[
                          'border rounded-lg p-3 space-y-2',
                          isMental ? 'border-status-green/20 bg-status-green/[0.02]' : 'border-border',
                        ].join(' ')}>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-mono text-text-muted mt-0.5 shrink-0 w-4 text-right">{j + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-text-primary">{title}</p>
                                <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${contentBadge(contentType)}`}>
                                  {contentLabel(contentType)}
                                </span>
                                {domain && (
                                  <span className="text-[10px] text-text-muted">{domain}</span>
                                )}
                                {duration != null && (
                                  <span className="ml-auto flex items-center gap-1 text-[10px] text-text-muted shrink-0">
                                    <Clock className="w-3 h-3" />{duration}min
                                  </span>
                                )}
                              </div>
                              {description && (
                                <p className="text-xs text-text-secondary mt-1">{description}</p>
                              )}
                            </div>
                          </div>

                          {cues && cues.length > 0 ? (
                            <div className="pl-5 space-y-0.5">
                              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Coaching Cues</p>
                              {cues.map((cue, k) => (
                                <p key={k} className="text-xs text-text-secondary flex items-start gap-1.5">
                                  <span className="text-lime mt-0.5 shrink-0">›</span>
                                  {cue}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="pl-5 text-[11px] text-text-muted/60 italic">No coaching cues yet.</p>
                          )}

                          {criteria && criteria.length > 0 && (
                            <div className="pl-5 space-y-0.5">
                              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Success Criteria</p>
                              {criteria.map((c, k) => (
                                <p key={k} className="text-xs text-text-secondary flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-status-green mt-0.5 shrink-0" />
                                  {c}
                                </p>
                              ))}
                            </div>
                          )}

                          {((progs && progs.length > 0) || (regs && regs.length > 0)) && (
                            <div className="pl-5 flex gap-6 flex-wrap">
                              {progs && progs.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Make It Harder</p>
                                  {progs.map((p, k) => (
                                    <p key={k} className="text-xs text-text-muted flex items-start gap-1">
                                      <ArrowUpRight className="w-3 h-3 text-lime mt-0.5 shrink-0" />
                                      {p}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {regs && regs.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Make It Easier</p>
                                  {regs.map((r, k) => (
                                    <p key={k} className="text-xs text-text-muted flex items-start gap-1">
                                      <ArrowRight className="w-3 h-3 text-text-muted mt-0.5 shrink-0 rotate-180" />
                                      {r}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!hasAnyContent && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <Layers className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary">No court activities added yet.</p>
            <p className="text-xs text-text-muted">Go back to Build Blocks and add drills, games, or coaching focus items.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Step 5 — Review + Apply ──────────────────────────────────────────────────

function Step5ReviewApply({
  templateId,
  templateName,
  hasCurriculumContent,
  currentLevelName,
  curriculumLevelId,
  blockList,
  totalItems,
  emptyBlocks,
  blocksWithContent,
  sessionCount,
  coaches,
  fallbackCoachId,
  fallbackCoachName,
  focusGates,
}: {
  templateId: string
  templateName: string
  hasCurriculumContent: boolean
  currentLevelName: string | null
  curriculumLevelId: string | null
  blockList: BlockProp[]
  totalItems: number
  emptyBlocks: BlockProp[]
  blocksWithContent: BlockProp[]
  sessionCount: number
  coaches: CoachOption[]
  fallbackCoachId: string
  fallbackCoachName: string
  focusGates: GateOption[]
}) {
  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Review the plan before applying. Once applied, coaches can use this structure for future sessions.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <p className="label-xs mb-3">Template Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-xl font-mono font-bold text-lime">{blockList.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Court Activities</p>
              <p className="text-xl font-mono font-bold text-lime">{totalItems}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks Ready</p>
              <p className={[
                'text-xl font-mono font-bold',
                blocksWithContent.length === blockList.length && blockList.length > 0
                  ? 'text-status-green'
                  : 'text-status-orange',
              ].join(' ')}>
                {blocksWithContent.length}/{blockList.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Sessions Run</p>
              <p className="text-xl font-mono font-bold text-text-primary">{sessionCount}</p>
            </div>
          </div>

          {emptyBlocks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-status-orange leading-snug">
                {emptyBlocks.length} block{emptyBlocks.length !== 1 ? 's' : ''} without content yet — coaches will run {emptyBlocks.length !== 1 ? 'them' : 'it'} without a guided plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow guide */}
      <div>
        <p className="label-xs mb-3">Template Workflow</p>
        <ClassTemplateSetupGuide
          hasCurriculumLevel={!!curriculumLevelId}
          hasCurriculumContent={hasCurriculumContent}
          hasSessionsFromTemplate={sessionCount > 0}
        />
      </div>

      {/* Lesson plan draft + apply — Sprint 963: data-donna-focus-id for DONNA highlight */}
      <div data-donna-focus-id="class-template-review-draft">
        <LessonPlanDraftPanel
          templateId={templateId}
          hasCurriculumContent={hasCurriculumContent}
          curriculumLevelName={currentLevelName}
        />
      </div>

      {/* Create session */}
      <div data-donna-focus-id="template-generate-session">
        <p className="label-xs mb-3">Create Session from Template</p>
        <GenerateSessionFromTemplateButton
          templateId={templateId}
          templateName={templateName}
          hasBlocks={blockList.length > 0}
          coaches={coaches}
          fallbackCoachId={fallbackCoachId}
          fallbackCoachName={fallbackCoachName}
          focusGates={focusGates}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClassTemplateBuilderStepper({
  templateId,
  templateName,
  templateDescription,
  templateTrack,
  templateDurationMin,
  templateIsActive,
  curriculumLevelId,
  currentLevelName,
  curriculumLevels,
  blockList,
  blockDisplayNames,
  curriculumByBlock,
  availableContent,
  previewBlocks,
  focusGates,
  coaches,
  sessionCount,
  userId,
  userDisplayName,
  hasCurriculumContent,
}: ClassTemplateBuilderStepperProps) {
  const [activeStep, setActiveStep] = useState(1)
  const totalSteps = STEPS.length

  const blockDurationTotal = blockList.reduce((sum, b) => sum + (b.duration_min ?? 0), 0)
  const totalItems = Object.values(curriculumByBlock).reduce((sum, arr) => sum + arr.length, 0)
  const blocksWithContent = blockList.filter(b => (curriculumByBlock[b.id] ?? []).length > 0)
  const emptyBlocks = blockList.filter(b => (curriculumByBlock[b.id] ?? []).length === 0)

  function prev() { setActiveStep(s => Math.max(1, s - 1)) }
  function next() { setActiveStep(s => Math.min(totalSteps, s + 1)) }

  return (
    <div className="space-y-5" data-donna-focus-id="template-stepper">
      <StepperNav activeStep={activeStep} onGoTo={setActiveStep} />

      <div className="min-h-[400px]">
        {activeStep === 1 && (
          <Step1Identity
            templateId={templateId}
            templateName={templateName}
            templateDescription={templateDescription}
            templateTrack={templateTrack}
            templateDurationMin={templateDurationMin}
            templateIsActive={templateIsActive}
            curriculumLevelId={curriculumLevelId}
            currentLevelName={currentLevelName}
            curriculumLevels={curriculumLevels}
            blockList={blockList}
            blockDurationTotal={blockDurationTotal}
          />
        )}

        {activeStep === 2 && (
          <Step2Structure
            blockList={blockList}
            blockDisplayNames={blockDisplayNames}
            curriculumByBlock={curriculumByBlock}
            blockDurationTotal={blockDurationTotal}
            onBuildBlocks={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <Step3BuildBlocks
            templateId={templateId}
            blockList={blockList}
            blockDisplayNames={blockDisplayNames}
            curriculumByBlock={curriculumByBlock}
            availableContent={availableContent}
          />
        )}

        {activeStep === 4 && (
          <Step4CoachPreview
            previewBlocks={previewBlocks}
            currentLevelName={currentLevelName}
            blockList={blockList}
            blockDisplayNames={blockDisplayNames}
            curriculumByBlock={curriculumByBlock}
          />
        )}

        {activeStep === 5 && (
          <Step5ReviewApply
            templateId={templateId}
            templateName={templateName}
            hasCurriculumContent={hasCurriculumContent}
            currentLevelName={currentLevelName}
            curriculumLevelId={curriculumLevelId}
            blockList={blockList}
            totalItems={totalItems}
            emptyBlocks={emptyBlocks}
            blocksWithContent={blocksWithContent}
            sessionCount={sessionCount}
            coaches={coaches}
            fallbackCoachId={userId}
            fallbackCoachName={userDisplayName}
            focusGates={focusGates}
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

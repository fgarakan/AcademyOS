'use client'

import { useState } from 'react'
import {
  BookOpen, Layers, Pencil, Eye, ListChecks,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle,
  AlertTriangle, GraduationCap, ArrowUpRight, ArrowRight, ChevronsUpDown,
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
import { CollapsibleBlockRow } from '@/components/builder'

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
  { id: 1, label: 'Class Goal', shortLabel: '1', icon: BookOpen },
  { id: 2, label: 'Level', shortLabel: '2', icon: GraduationCap },
  { id: 3, label: 'Session Flow', shortLabel: '3', icon: Layers },
  { id: 4, label: 'Coach Notes', shortLabel: '4', icon: Eye },
  { id: 5, label: 'Publish', shortLabel: '5', icon: ListChecks },
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
    activeStep === 1 ? 'Level' :
    activeStep === 2 ? 'Session Flow' :
    activeStep === 3 ? 'Coach Notes' :
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
          Apply below
        </span>
      )}
    </div>
  )
}

// ─── Step 1 — Class Goal ──────────────────────────────────────────────────────

function Step1Identity({
  templateName,
  templateDescription,
  templateTrack,
  templateDurationMin,
  templateIsActive,
  currentLevelName,
  blockList,
  blockDurationTotal,
}: {
  templateId: string
  templateName: string
  templateDescription: string | null
  templateTrack: string | null
  templateDurationMin: number | null
  templateIsActive: boolean
  currentLevelName: string | null
  blockList: BlockProp[]
  blockDurationTotal: number
}) {
  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Confirm the class goal and what kind of players this plan is built for. Then set the curriculum level in Step 2.
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
    </div>
  )
}

// ─── Step 2 — Level ───────────────────────────────────────────────────────────

function Step2Level({
  templateId,
  curriculumLevelId,
  currentLevelName,
  curriculumLevels,
  blockList,
  blockDisplayNames,
  curriculumByBlock,
  blockDurationTotal,
  onGoToFlow,
}: {
  templateId: string
  curriculumLevelId: string | null
  currentLevelName: string | null
  curriculumLevels: CurriculumLevelOption[]
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
  blockDurationTotal: number
  onGoToFlow: () => void
}) {
  const emptyCount = blockList.filter(b => (curriculumByBlock[b.id] ?? []).length === 0).length

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Choose the curriculum level this class is designed for. This drives coaching cues, learning goals, and session context for coaches.
        </p>
      </div>

      <div data-donna-focus-id="template-level-picker">
        <Card>
          <CardHeader>
            <p className="label-xs">Curriculum Level</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
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

      {/* Block structure overview */}
      {blockList.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="label-xs">Class Structure</p>
            <p className="text-[10px] text-text-muted">
              {blockList.length} section{blockList.length !== 1 ? 's' : ''}
              {blockDurationTotal > 0 ? ` · ${blockDurationTotal} min` : ''}
            </p>
          </div>
          <div className="space-y-2" data-donna-focus-id="class-template-block-list">
            {blockList.map((block, i) => {
              const items = curriculumByBlock[block.id] ?? []
              const hasContent = items.length > 0
              const displayName = blockDisplayNames[block.id] ?? block.name
              return (
                <div key={block.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-[10px] font-mono text-text-muted w-5 text-center shrink-0">{i + 1}</span>
                  <p className="text-sm font-medium text-text-primary flex-1">{displayName}</p>
                  {block.duration_min != null && (
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{block.duration_min}m
                    </span>
                  )}
                  <span className={`text-[10px] flex items-center gap-1 ${hasContent ? 'text-status-green' : 'text-text-muted'}`}>
                    {hasContent ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {items.length}
                  </span>
                </div>
              )
            })}
          </div>
          {emptyCount > 0 && (
            <div className="pt-2">
              <button
                onClick={onGoToFlow}
                className="btn-lime text-xs px-4 py-2 flex items-center gap-1.5"
              >
                Build Session Flow
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 2 — Class Structure ─────────────────────────────────────────────────

// ─── Step 3 — Session Flow ────────────────────────────────────────────────────

function Step3SessionFlow({
  templateId,
  blockList,
  blockDisplayNames,
  curriculumByBlock,
  availableContent,
  expandedBlockId,
  expandAll,
  onToggleBlock,
  onSetExpandAll,
}: {
  templateId: string
  blockList: BlockProp[]
  blockDisplayNames: Record<string, string>
  curriculumByBlock: Record<string, CurriculumBlockRowProp[]>
  availableContent: AvailableContentItem[]
  expandedBlockId: string | null
  expandAll: boolean
  onToggleBlock: (blockId: string) => void
  onSetExpandAll: (v: boolean) => void
}) {
  return (
    <div data-donna-focus-id="class-template-primary-action">
    <div className="space-y-4" data-donna-focus-id="template-blocks-section">
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Build the session flow. Add drills, games, coaching cues, or mental focus items to each block. Open one block at a time or use Expand All.
        </p>
      </div>

      {blockList.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-xs text-text-muted text-center">No blocks in this template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Expand All control */}
          {blockList.length >= 2 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-text-muted">
                {blockList.length} section{blockList.length !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => onSetExpandAll(!expandAll)}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
              >
                <ChevronsUpDown className="w-3 h-3" />
                {expandAll ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          )}

          {blockList.map((block, i) => {
            const curriculumItems = curriculumByBlock[block.id] ?? []
            const displayName = blockDisplayNames[block.id] ?? block.name
            const isExpanded = expandAll || expandedBlockId === block.id
            const isComplete = curriculumItems.length > 0

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

            const purposeHint = blockPurposeCopy(block.type ?? '').split('.')[0]

            return (
              <CollapsibleBlockRow
                key={block.id}
                index={i}
                name={displayName}
                accentClass="text-text-primary"
                borderAccentClass="border-lime/30"
                durationMin={block.duration_min}
                itemCount={curriculumItems.length}
                itemLabel="activity"
                isComplete={isComplete}
                intentHint={purposeHint}
                isExpanded={isExpanded}
                onToggle={() => onToggleBlock(block.id)}
              >
                <div className="px-4 py-3 space-y-3">
                  <BlockContentPickerCard
                    blockId={block.id}
                    blockName={displayName}
                    templateId={templateId}
                    initialAssigned={assignedItems}
                    available={availableContent}
                  />
                </div>
              </CollapsibleBlockRow>
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

  // Block collapse state for Session Flow step — one block open at a time
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(
    blockList[0]?.id ?? null
  )
  const [expandAll, setExpandAll] = useState(false)

  function toggleBlock(blockId: string) {
    if (expandAll) {
      setExpandAll(false)
      setExpandedBlockId(blockId)
    } else {
      setExpandedBlockId(prev => prev === blockId ? null : blockId)
    }
  }

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
            currentLevelName={currentLevelName}
            blockList={blockList}
            blockDurationTotal={blockDurationTotal}
          />
        )}

        {activeStep === 2 && (
          <Step2Level
            templateId={templateId}
            curriculumLevelId={curriculumLevelId}
            currentLevelName={currentLevelName}
            curriculumLevels={curriculumLevels}
            blockList={blockList}
            blockDisplayNames={blockDisplayNames}
            curriculumByBlock={curriculumByBlock}
            blockDurationTotal={blockDurationTotal}
            onGoToFlow={() => setActiveStep(3)}
          />
        )}

        {activeStep === 3 && (
          <Step3SessionFlow
            templateId={templateId}
            blockList={blockList}
            blockDisplayNames={blockDisplayNames}
            curriculumByBlock={curriculumByBlock}
            availableContent={availableContent}
            expandedBlockId={expandedBlockId}
            expandAll={expandAll}
            onToggleBlock={toggleBlock}
            onSetExpandAll={setExpandAll}
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

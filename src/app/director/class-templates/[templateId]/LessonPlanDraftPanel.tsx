'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Clock, RefreshCw, ChevronDown, ChevronUp, CheckCircle, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import {
  generateLessonPlanDraftAction,
  type LessonPlanDraft,
  type DraftBlock,
  type DraftContentItem,
} from './generateLessonPlanDraftAction'
import { applyLessonPlanDraftAction } from './applyLessonPlanDraftAction'
import { GuidedStepCard } from '@/components/onboarding/GuidedStepCard'

interface Props {
  templateId: string
  hasCurriculumContent: boolean
  curriculumLevelName: string | null
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  drill: 'Drill',
  game: 'Game',
  skill: 'Skill',
  tactical: 'Tactical',
  warmup: 'Warm-Up',
  cooldown: 'Cool-Down',
  fitness: 'Fitness',
  competition: 'Competition',
  assessment: 'Assessment',
  tactical_game: 'Tactical Game',
  situational: 'Situational',
  match_play_theme: 'Match-Play Theme',
  mental_skill: 'Mental Skill',
  competition_behavior: 'Competition Behavior',
}

// Tennis-session label for block type badges in the draft preview.
const DRAFT_BLOCK_TYPE_LABELS: Record<string, string> = {
  warm_up:     'Warm-Up',
  movement:    'Warm-Up',
  technical:   'Skill',
  tactical:    'Tactics',
  competition: 'Games',
  mental:      'Mental',
  cool_down:   'Wrap-Up',
  fitness:     'Athletic',
  free:        'Free Play',
}

export function LessonPlanDraftPanel({ templateId, hasCurriculumContent, curriculumLevelName }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<LessonPlanDraft | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setApplied(false)
    try {
      const result = await generateLessonPlanDraftAction(templateId)
      if (result.error) {
        setError(result.error)
        setDraft(null)
      } else if (result.data) {
        setDraft(result.data)
        setExpanded(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!draft) return
    setApplying(true)
    setError(null)
    try {
      const result = await applyLessonPlanDraftAction(templateId, draft)
      if (result.error) {
        setError(result.error)
      } else {
        setApplied(true)
        router.refresh()
      }
    } finally {
      setApplying(false)
    }
  }

  const matchedBlockCount = draft?.blocks.filter(b => b.contentItems.length > 0).length ?? 0

  // Step status for guided flow
  const hasGenerated = draft !== null || applied || hasCurriculumContent
  const hasApplied = applied || hasCurriculumContent
  const step1Status: 'complete' | 'current' | 'upcoming' = hasGenerated ? 'complete' : 'current'
  const step2Status: 'complete' | 'current' | 'upcoming' = hasApplied ? 'complete' : hasGenerated ? 'current' : 'upcoming'
  const step3Status: 'complete' | 'current' | 'upcoming' = hasApplied ? 'complete' : 'upcoming'
  const step4Status: 'complete' | 'current' | 'upcoming' = hasApplied ? 'current' : 'upcoming'

  return (
    <Card className="border-lime/10 bg-lime/[0.02]">
      <CardContent className="py-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lime shrink-0" />
            <p className="text-sm font-medium text-text-primary">Lesson Plan Draft Generator</p>
            {curriculumLevelName && (
              <span className="text-[10px] text-lime bg-lime/5 border border-lime/20 px-1.5 py-0.5 rounded-full">
                {curriculumLevelName}
              </span>
            )}
          </div>
          {draft && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-text-muted hover:text-text-secondary transition-colors"
              aria-label={expanded ? 'Collapse draft' : 'Expand draft'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* No level assigned */}
        {!curriculumLevelName ? (
          <p className="text-xs text-text-muted">
            Assign a curriculum level above before generating a lesson plan draft.
          </p>
        ) : (
          <>
            {/* 4-step guided flow */}
            <div className="space-y-2 py-1">
              <GuidedStepCard
                stepNumber={1}
                totalSteps={4}
                title="Generate draft"
                description="Use the curriculum level on this template to create a suggested lesson plan. Nothing is saved yet."
                status={step1Status}
              />
              <GuidedStepCard
                stepNumber={2}
                totalSteps={4}
                title="Review the plan"
                description="Check the blocks, drills, coaching cues, and success criteria before applying."
                status={step2Status}
              />
              <GuidedStepCard
                stepNumber={3}
                totalSteps={4}
                title="Apply to template"
                description="Applying writes this plan to the reusable class template so future sessions can use it."
                status={step3Status}
              />
              <GuidedStepCard
                stepNumber={4}
                totalSteps={4}
                title="Create session for coaches"
                description="Once a session is created from this template, coaches will see the curriculum plan on their session page."
                status={step4Status}
              />
            </div>

            {/* Applied status banner — shown on initial load when lesson plan is already live */}
            {hasCurriculumContent && !draft && !loading && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/5 border border-status-green/20">
                <BookOpen className="w-3.5 h-3.5 text-status-green shrink-0" />
                <p className="text-[11px] text-status-green">Lesson plan is live on this template — scroll down to review curriculum content.</p>
              </div>
            )}

            {/* Generate button + summary */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
                {loading
                  ? 'Generating…'
                  : hasCurriculumContent
                  ? 'Regenerate Draft'
                  : 'Generate Lesson Plan Draft'}
              </button>
              {draft && !loading && (
                <span className="text-[10px] text-text-muted">
                  {draft.totalItems} item{draft.totalItems !== 1 ? 's' : ''} matched across{' '}
                  {matchedBlockCount} block{matchedBlockCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-status-red bg-status-red/5 border border-status-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Draft preview */}
            {draft && expanded && (
              <div className="space-y-2 pt-1 border-t border-border/50">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">
                    Draft Preview — {draft.levelName}
                  </p>
                  <span className="text-[10px] text-status-orange italic shrink-0">
                    Draft only — review before applying
                  </span>
                </div>
                <div className="space-y-2">
                  {draft.blocks.map((block, i) => (
                    <DraftBlockRow key={block.blockId} block={block} index={i} />
                  ))}
                </div>
                <div className="pt-2 border-t border-border space-y-2">
                  {applied ? (
                    <div>
                      <p className="text-xs text-status-green flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        Applied — coaches will see this plan when a session is created from this template.
                      </p>
                      <p className="text-[10px] text-text-muted mt-1 pl-5">
                        Next step: create a session from this template so coaches can run it.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] text-text-muted">
                        Review the draft above, then apply it to write curriculum content to this template.
                      </p>
                      <p className="text-[10px] text-text-muted/70 mt-0.5 italic">
                        Applying updates curriculum content on this template. It does not change the global curriculum.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={applying || applied}
                    className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {applying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : applied ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : null}
                    {applying ? 'Applying…' : applied ? 'Applied' : 'Apply to Template'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function isMentalContentItem(item: DraftContentItem): boolean {
  return item.contentType === 'mental_skill' || item.contentType === 'competition_behavior'
}

function DraftContentRow({ item }: { item: DraftContentItem }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-lime shrink-0 text-xs mt-0.5">›</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-text-primary">{item.title}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[10px] text-text-muted">
            {CONTENT_TYPE_LABEL[item.contentType] ?? item.contentType.replace(/_/g, ' ')}
          </span>
          {item.domain && (
            <span className="text-[10px] text-text-muted">· {item.domain}</span>
          )}
          {item.durationMin != null && (
            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
              · <Clock className="w-2.5 h-2.5 ml-0.5" /> {item.durationMin}min
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

function DraftBlockRow({ block, index }: { block: DraftBlock; index: number }) {
  // For Competitive Games blocks: split game/skill items from mental items so
  // Mental Focus is visible as a distinct subsection rather than hidden in the list.
  const isCompetitionBlock = block.blockType === 'competition'
  const gameItems = isCompetitionBlock
    ? block.contentItems.filter(item => !isMentalContentItem(item))
    : block.contentItems
  const mentalItems = isCompetitionBlock
    ? block.contentItems.filter(isMentalContentItem)
    : []

  return (
    <div className="border border-border rounded-lg p-3">
      {/* Block header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{index + 1}</span>
        <p className="text-xs font-semibold text-text-primary truncate">{block.blockName}</p>
        <span className="text-[10px] uppercase tracking-widest text-text-muted px-1 py-0.5 rounded border border-border shrink-0">
          {DRAFT_BLOCK_TYPE_LABELS[block.blockType] ?? block.blockType.replace(/_/g, ' ')}
        </span>
        {block.durationMin != null && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-text-muted shrink-0">
            <Clock className="w-3 h-3" />
            {block.durationMin}min
          </span>
        )}
      </div>

      {/* Purpose line */}
      {block.blockPurpose && (
        <p className="text-[10px] text-text-muted pl-7 mb-2">{block.blockPurpose}</p>
      )}

      {/* Content items */}
      {block.contentItems.length === 0 ? (
        <p className="text-[11px] text-text-muted pl-7 italic">
          {block.blockType === 'cool_down'
            ? 'Coach recap space — coaches fill this in after the session. No curriculum items needed.'
            : 'No curriculum content matched for this block type.'}
        </p>
      ) : (
        <div className="space-y-3 pl-7">
          {/* Primary game / skill / drill items */}
          {gameItems.length > 0 && (
            <ul className="space-y-1.5">
              {gameItems.map(item => (
                <DraftContentRow key={item.contentItemId} item={item} />
              ))}
            </ul>
          )}

          {/* Mental Focus subsection — visible within Competitive Games when mental items are present */}
          {mentalItems.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-status-green mb-1.5">
                Mental Focus
              </p>
              <ul className="space-y-1.5">
                {mentalItems.map(item => (
                  <DraftContentRow key={item.contentItemId} item={item} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

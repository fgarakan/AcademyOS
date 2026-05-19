'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'
import { CLASS_BLOCKS, ClassTemplateBlockSelector } from '../templates/ClassTemplateBlockSelector'
import { ClassTemplateDraftPreview } from '../templates/ClassTemplateDraftPreview'

function computeDonnaSuggestion(draft: OnboardingDraft): string[] {
  const styles = draft.coachingStyles
  const starter = draft.curriculumStartingPoint
  const sessionBlocks = draft.sessionBlocks

  const blocks: string[] = ['warm-up']

  // Map Curriculum Builder session blocks directly to class template blocks
  if (sessionBlocks.includes('technique-blocks') && !blocks.includes('drills')) blocks.push('drills')
  if (sessionBlocks.includes('live-ball-heavy') && !blocks.includes('skills')) blocks.push('skills')
  if (sessionBlocks.includes('constraint-games') && !blocks.includes('games')) blocks.push('games')
  if (sessionBlocks.includes('point-play') && !blocks.includes('point-play')) blocks.push('point-play')
  if (sessionBlocks.includes('assessment') && !blocks.includes('assessment-moment')) blocks.push('assessment-moment')

  // Supplement from coaching DNA when session blocks are sparse
  if (blocks.length < 4) {
    if (styles.includes('high-performance') || styles.includes('competition-ready')) {
      if (!blocks.includes('drills')) blocks.push('drills')
      if (!blocks.includes('tactics')) blocks.push('tactics')
      if (!blocks.includes('point-play')) blocks.push('point-play')
    } else if (styles.includes('game-based') || styles.includes('joy-retention')) {
      if (!blocks.includes('skills')) blocks.push('skills')
      if (!blocks.includes('games')) blocks.push('games')
    } else if (styles.includes('tactical-first')) {
      if (!blocks.includes('tactics')) blocks.push('tactics')
      if (!blocks.includes('games')) blocks.push('games')
      if (!blocks.includes('point-play')) blocks.push('point-play')
    } else if (styles.includes('fundamentals-first') || styles.includes('movement-first')) {
      if (!blocks.includes('drills')) blocks.push('drills')
      if (!blocks.includes('skills')) blocks.push('skills')
    } else {
      // Balanced default
      if (!blocks.includes('drills')) blocks.push('drills')
      if (!blocks.includes('skills')) blocks.push('skills')
      if (!blocks.includes('games')) blocks.push('games')
    }
  }

  // Performance curriculum gets match play
  if (starter === 'performance-focused' && !blocks.includes('match-play')) {
    blocks.push('match-play')
  }

  blocks.push('reflection')
  return Array.from(new Set(blocks))
}

function buildDefaultDurations(blockIds: string[]): Record<string, number> {
  const durations: Record<string, number> = {}
  blockIds.forEach(id => {
    const block = CLASS_BLOCKS.find(b => b.id === id)
    if (block) durations[id] = block.defaultDuration
  })
  return durations
}

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function FirstClassTemplateStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const suggestion = computeDonnaSuggestion(draft)
  const [suggestionApplied, setSuggestionApplied] = useState(false)

  const selectedBlocks = draft.classTemplateDraft.selectedBlocks
  const blockDurations = draft.classTemplateDraft.blockDurations ?? {}
  const hasDraft = selectedBlocks.length > 0

  function applyDonnaSuggestion() {
    updateDraft({
      classTemplateDraft: {
        skipped: false,
        selectedBlocks: suggestion,
        blockDurations: buildDefaultDurations(suggestion),
      },
    })
    setSuggestionApplied(true)
  }

  function handleToggle(id: string) {
    const updated = selectedBlocks.includes(id)
      ? selectedBlocks.filter(b => b !== id)
      : [...selectedBlocks, id]

    const newDurations = { ...blockDurations }
    if (!newDurations[id]) {
      const block = CLASS_BLOCKS.find(b => b.id === id)
      if (block) newDurations[id] = block.defaultDuration
    }

    updateDraft({
      classTemplateDraft: {
        ...draft.classTemplateDraft,
        skipped: false,
        selectedBlocks: updated,
        blockDurations: newDurations,
      },
    })
  }

  function handleDurationChange(id: string, minutes: number) {
    updateDraft({
      classTemplateDraft: {
        ...draft.classTemplateDraft,
        blockDurations: { ...blockDurations, [id]: minutes },
      },
    })
  }

  function handleSkip() {
    updateDraft({
      classTemplateDraft: {
        skipped: true,
        selectedBlocks: [],
        blockDurations: {},
      },
    })
    onNext()
  }

  const suggestionLabel = suggestion
    .map(id => CLASS_BLOCKS.find(b => b.id === id)?.label)
    .filter(Boolean)
    .join(' → ')

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={6}
        totalSteps={12}
        title="Draft first class template"
        subtitle="Build a starting class template using the AcademyOS block model. This stays as an onboarding draft."
      />

      {/* DONNA suggestion */}
      <div className="mb-6 rounded-2xl bg-surface border border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-secondary mb-1">
              DONNA has a suggested starting template.
            </p>
            <p className="text-[12px] text-text-muted leading-relaxed mb-3">
              Based on your Academy DNA and curriculum selections:{' '}
              <span className="text-text-secondary">{suggestionLabel}</span>
            </p>
            {!suggestionApplied ? (
              <button
                onClick={applyDonnaSuggestion}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime/8 border border-lime/20 text-[11px] font-semibold text-lime hover:bg-lime/15 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                Apply DONNA's suggestion
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-lime font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-lime flex items-center justify-center text-[8px] font-bold text-base">&#x2713;</span>
                Suggestion applied — adjust below as needed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Block selector */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Class Template Blocks
        </p>
        <ClassTemplateBlockSelector
          selectedBlocks={selectedBlocks}
          blockDurations={blockDurations}
          onToggle={handleToggle}
          onDurationChange={handleDurationChange}
        />
      </div>

      {/* Draft preview */}
      {hasDraft && (
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Template Draft
          </p>
          <ClassTemplateDraftPreview
            selectedBlocks={selectedBlocks}
            blockDurations={blockDurations}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 transition-all shadow-lime"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
        {!hasDraft && (
          <button
            onClick={handleSkip}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Nothing is published or sent to coaches yet.
      </p>
    </div>
  )
}

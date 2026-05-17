'use client'

import { Sparkles } from 'lucide-react'

interface Props {
  tab: 'drills' | 'gates' | 'fitness' | 'language'
  levelName: string
  onAskDonna: () => void
}

const TAB_COPY: Record<Props['tab'], { headline: string; body: string; cta: string }> = {
  drills: {
    headline: 'No drills defined',
    body: 'This level has no drill content yet. Ask DONNA to draft a drill based on the skills this level should develop.',
    cta: 'Ask DONNA to draft a drill',
  },
  gates: {
    headline: 'No assessment gates defined',
    body: 'Without gates, players at this level cannot be formally evaluated for promotion. Ask DONNA to draft a measurable gate.',
    cta: 'Ask DONNA to draft a gate',
  },
  fitness: {
    headline: 'No fitness content defined',
    body: 'This level has no off-court fitness or conditioning content. Ask DONNA to draft a fitness exercise appropriate for this stage.',
    cta: 'Ask DONNA to draft fitness content',
  },
  language: {
    headline: 'No coaching language defined',
    body: 'Coaching language guides how coaches communicate skills and corrections at this level. This content is set in the curriculum database.',
    cta: '',
  },
}

export function CurriculumLevelEmptyState({ tab, levelName, onAskDonna }: Props) {
  const copy = TAB_COPY[tab]

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
      <p className="text-[13px] font-semibold text-text-secondary">{copy.headline}</p>
      <p className="text-[12px] text-text-muted max-w-sm leading-relaxed">{copy.body}</p>
      {copy.cta && (
        <button
          onClick={onAskDonna}
          className="flex items-center gap-2 btn-ghost text-[12px] px-4 py-2 border border-lime/20 hover:border-lime/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-lime" />
          {copy.cta}
        </button>
      )}
      <p className="text-[10px] text-text-muted">
        {copy.cta ? `Drafts go to the Review Queue — nothing added to ${levelName} until approved.` : `Contact your curriculum administrator to update coaching language.`}
      </p>
    </div>
  )
}

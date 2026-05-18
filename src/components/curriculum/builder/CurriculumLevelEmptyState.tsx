'use client'

import { Sparkles, Target, Shield, Dumbbell, MessageSquare, Trophy, BookOpen, Layers } from 'lucide-react'

type EmptyTab = 'drills' | 'gates' | 'fitness' | 'language' | 'competition' | 'missions' | 'skills' | 'overview'

interface Props {
  tab: EmptyTab
  levelName: string
  onAskDonna?: () => void
}

const TAB_COPY: Record<EmptyTab, {
  Icon: typeof Target
  headline: string
  body: string
  cta: string
  ctaNote: string
}> = {
  drills: {
    Icon: Target,
    headline: 'No drills yet',
    body: 'This level has no drill content. Ask DONNA to draft a drill based on the skills this level should develop.',
    cta: 'Ask DONNA to draft a drill',
    ctaNote: `Draft goes to the Review Queue — nothing changes at {levelName} until approved.`,
  },
  gates: {
    Icon: Shield,
    headline: 'No assessment gates yet',
    body: 'Without gates, players at this level cannot be formally evaluated for promotion. Ask DONNA to draft a measurable gate.',
    cta: 'Ask DONNA to draft a gate',
    ctaNote: 'Draft goes to the Review Queue — players are not affected until approved.',
  },
  fitness: {
    Icon: Dumbbell,
    headline: 'No fitness content yet',
    body: 'This level has no off-court conditioning guidance. Ask DONNA to draft fitness content appropriate for this stage.',
    cta: 'Ask DONNA to draft fitness content',
    ctaNote: 'Draft goes to the Review Queue — coaches see no change until approved.',
  },
  language: {
    Icon: MessageSquare,
    headline: 'No coaching language defined',
    body: 'Coaching language guides how coaches communicate skills and corrections at this level. This content is set by curriculum administrators.',
    cta: '',
    ctaNote: 'Contact your curriculum administrator to update coaching language for this level.',
  },
  competition: {
    Icon: Trophy,
    headline: 'No competition track defined',
    body: 'Competition track sets match formats, scoring systems, and tournament cadence for this level. This is usually set by the head coach.',
    cta: '',
    ctaNote: 'Competition details are configured in the curriculum database.',
  },
  missions: {
    Icon: Sparkles,
    headline: 'No player missions yet',
    body: 'Player missions give players a visible goal to work towards at this level. Ask DONNA to draft a mission.',
    cta: 'Ask DONNA to draft a mission',
    ctaNote: 'Draft goes to the Review Queue — players see nothing until approved.',
  },
  skills: {
    Icon: Layers,
    headline: 'No skills or drills to group',
    body: 'When drills are added to this level, they appear here grouped by skill domain — technical, tactical, movement, and more.',
    cta: '',
    ctaNote: 'Add drills in the Drills tab first.',
  },
  overview: {
    Icon: BookOpen,
    headline: 'No content defined for this level',
    body: 'This level has no drills, gates, or supporting content yet. Use the tabs above to add content, or ask DONNA to suggest where to start.',
    cta: 'Ask DONNA for suggestions',
    ctaNote: 'DONNA drafts — nothing changes until a director approves.',
  },
}

export function CurriculumLevelEmptyState({ tab, levelName, onAskDonna }: Props) {
  const copy = TAB_COPY[tab]
  const { Icon } = copy
  const note = copy.ctaNote.replace('{levelName}', levelName)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl border border-border bg-surface-raised flex items-center justify-center">
        <Icon className="w-5 h-5 text-text-muted" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-[13px] font-semibold text-text-secondary">{copy.headline}</p>
        <p className="text-[12px] text-text-muted leading-relaxed">{copy.body}</p>
      </div>
      {copy.cta && onAskDonna && (
        <button
          onClick={onAskDonna}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-lime/20 text-lime text-[12px] font-semibold hover:bg-lime/[0.06] active:bg-lime/[0.1] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {copy.cta}
        </button>
      )}
      <p className="text-[10px] text-text-muted max-w-xs leading-relaxed">{note}</p>
    </div>
  )
}

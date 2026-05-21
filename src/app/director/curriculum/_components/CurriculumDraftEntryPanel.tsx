'use client'

import Link from 'next/link'
import { AlertTriangle, Target, Activity, MessageSquare } from 'lucide-react'

const DRAFT_TYPES = [
  {
    id: 'gate',
    label: 'Exit Gate',
    description: 'Define a new advancement criterion for this level.',
    icon: Target,
    href: '/director/curriculum/builder',
  },
  {
    id: 'drill',
    label: 'Drill',
    description: 'Add a practice activity aligned to this level.',
    icon: Activity,
    href: '/director/curriculum/builder/add-drill',
  },
  {
    id: 'coach_language',
    label: 'Coach Language',
    description: 'Add feedback language for coaches at this level.',
    icon: MessageSquare,
    href: '/director/curriculum/builder',
  },
] as const

interface Props {
  levelId: string
  levelName: string
}

export function CurriculumDraftEntryPanel({ levelName }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20">
        <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="text-status-orange font-medium">Draft only.</span>{' '}
          Nothing becomes official until you approve it in the Review Queue.
          DONNA proposes — you decide.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          What would you like to add to {levelName}?
        </p>
        {DRAFT_TYPES.map(({ id, label, description, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface hover:border-lime/30 hover:bg-lime/3 transition-all group"
          >
            <Icon className="w-4 h-4 text-text-muted group-hover:text-lime shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary">
                Draft new {label}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[10px] text-text-muted/60 leading-relaxed">
        Skills, missions, badges, assessment criteria, and parent guidance drafts
        will be available in a future sprint.
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  MessageSquare,
  CheckSquare,
  CalendarDays,
  BookOpen,
  Home,
  Users,
  ChevronRight,
  Zap,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { cn } from '@/lib/utils'

interface Props {
  academyId: string
  currentLevelName: string | null
  developmentFocus: string | null
  activePriorityTitle: string | null
  latestNoteSnippet: string | null
  latestNoteDate: string | null
  hasCurriculumState: boolean
  observationCount: number
  advancementEligible: boolean | null
}

// ---------------------------------------------------------------------------
// Action button types
// ---------------------------------------------------------------------------

interface ActionButton {
  label: string
  description: string
  Icon: React.ElementType
  href?: string
  onClick?: () => void
  available: boolean
  variant?: 'primary' | 'secondary' | 'coming-soon'
}

// ---------------------------------------------------------------------------
// "What this player needs next" — derived from available data
// ---------------------------------------------------------------------------

function deriveNextSteps(props: Props): string[] {
  const steps: string[] = []

  if (!props.hasCurriculumState) {
    steps.push('Confirm current level — no curriculum level assigned yet.')
  }
  if (!props.activePriorityTitle) {
    steps.push('Add an active development priority in the Notes tab.')
  }
  if (!props.developmentFocus) {
    steps.push('Set a development focus via the AI Draft in the Notes tab.')
  }
  if (props.observationCount === 0) {
    steps.push('Capture the first coach observation to start the evidence record.')
  }
  if (props.advancementEligible === true) {
    steps.push('Player meets advancement criteria — review readiness before promoting.')
  }
  if (steps.length === 0) {
    steps.push('Review recent coach notes and confirm all gate criteria are current.')
    steps.push('Prepare a parent-safe update from the development summary.')
  }

  return steps.slice(0, 4)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlayerActionSummaryCard({
  academyId,
  currentLevelName,
  developmentFocus,
  activePriorityTitle,
  latestNoteSnippet,
  latestNoteDate,
  hasCurriculumState,
  observationCount,
  advancementEligible,
}: Props) {
  const [captureOpen, setCaptureOpen] = useState(false)

  const nextSteps = deriveNextSteps({
    academyId,
    currentLevelName,
    developmentFocus,
    activePriorityTitle,
    latestNoteSnippet,
    latestNoteDate,
    hasCurriculumState,
    observationCount,
    advancementEligible,
  })

  const actions: ActionButton[] = [
    {
      label: 'Add Coach Note',
      description: 'Capture an observation for this player.',
      Icon: MessageSquare,
      onClick: () => setCaptureOpen(true),
      available: true,
      variant: 'primary',
    },
    {
      label: 'Review Level Readiness',
      description: 'Check the director review queue.',
      Icon: CheckSquare,
      href: '/director/review',
      available: true,
      variant: 'secondary',
    },
    {
      label: 'Create Session',
      description: 'Plan a session for this player\'s group.',
      Icon: CalendarDays,
      href: '/director/sessions',
      available: true,
      variant: 'secondary',
    },
    {
      label: 'View Curriculum',
      description: 'See level requirements and the spine.',
      Icon: BookOpen,
      href: '/director/curriculum',
      available: true,
      variant: 'secondary',
    },
    {
      label: 'Assign At-Home Work',
      description: 'Send homework to this player.',
      Icon: Home,
      available: false,
      variant: 'coming-soon',
    },
    {
      label: 'Draft Parent Update',
      description: 'Compose a parent-safe communication.',
      Icon: Users,
      available: false,
      variant: 'coming-soon',
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <p className="label-xs">Player Actions</p>
            {hasCurriculumState && currentLevelName && (
              <span className="text-[10px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
                {currentLevelName}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-5">

          {/* Current focus / priority row */}
          {(developmentFocus ?? activePriorityTitle) ? (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/15">
              <Zap className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-lime/80 mb-0.5">Active Priority</p>
                <p className="text-xs text-text-primary leading-snug truncate">
                  {developmentFocus ?? activePriorityTitle}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-dashed border-border">
              <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-muted leading-snug">
                No active priority set yet. Add coach observations then use AI Draft to generate one.
              </p>
            </div>
          )}

          {/* Latest note row */}
          {latestNoteSnippet ? (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Latest Note</p>
                <p className="text-xs text-text-secondary leading-snug line-clamp-2">
                  {latestNoteSnippet}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border border-dashed">
              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-[11px] text-text-muted">No coach notes yet — capture an observation to start.</p>
            </div>
          )}

          {/* Action buttons grid */}
          <div>
            <p className="label-xs mb-3">Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((action) => {
                const sharedClasses = cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all duration-150 w-full',
                  action.variant === 'primary'
                    ? 'border-lime/25 bg-lime/5 hover:bg-lime/10 hover:border-lime/40'
                    : action.variant === 'coming-soon'
                    ? 'border-border bg-surface opacity-50 cursor-not-allowed'
                    : 'border-border bg-surface-raised hover:bg-surface hover:border-lime/20',
                )

                const inner = (
                  <>
                    <action.Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        action.variant === 'primary'
                          ? 'text-lime'
                          : action.variant === 'coming-soon'
                          ? 'text-text-muted'
                          : 'text-text-muted',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-medium leading-tight',
                          action.variant === 'coming-soon' ? 'text-text-muted' : 'text-text-primary',
                        )}
                      >
                        {action.label}
                      </p>
                      {action.variant === 'coming-soon' ? (
                        <p className="text-[10px] text-text-muted mt-0.5">Coming soon</p>
                      ) : (
                        <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{action.description}</p>
                      )}
                    </div>
                    {action.available && (
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                  </>
                )

                if (!action.available) {
                  return (
                    <div key={action.label} className={sharedClasses} aria-disabled="true">
                      {inner}
                    </div>
                  )
                }

                if (action.href) {
                  return (
                    <Link key={action.label} href={action.href} className={sharedClasses}>
                      {inner}
                    </Link>
                  )
                }

                return (
                  <button key={action.label} type="button" onClick={action.onClick} className={sharedClasses}>
                    {inner}
                  </button>
                )
              })}
            </div>
          </div>

          {/* What this player needs next */}
          <div>
            <p className="label-xs mb-2">What this player needs next</p>
            <div className="space-y-1.5">
              {nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                  <Clock className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                  <p className="text-[11px] text-text-secondary leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />
    </>
  )
}

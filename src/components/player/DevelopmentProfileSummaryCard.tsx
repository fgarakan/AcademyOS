import { Lock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { DevelopmentFocusSections } from './DevelopmentFocusSections'
import { formatDate } from '@/lib/utils'

interface SummaryShape {
  current_strengths: string[]
  things_to_work_on: string[]
  development_focus: string | null
  updated_at: string
  source: string
}

interface PriorityShape {
  title: string
  priority_rank: number
}

interface Props {
  summary: SummaryShape | null
  priorities: PriorityShape[]
}

export function DevelopmentProfileSummaryCard({ summary, priorities }: Props) {
  const doingWell = summary?.current_strengths ?? []
  const workingOn = summary?.things_to_work_on ?? []
  const currentFocus = summary?.development_focus ?? null
  const topPriority = priorities
    .slice()
    .sort((a, b) => a.priority_rank - b.priority_rank)[0]
  const nextStep = topPriority?.title ?? null

  const hasAnything = doingWell.length > 0 || workingOn.length > 0 || currentFocus || nextStep

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs">Development Summary</p>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" /> Internal coach view
          </span>
        </div>
        {summary && (
          <p className="text-[10px] text-text-muted mt-0.5">
            Last updated {formatDate(summary.updated_at)} · Source: {summary.source}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {!hasAnything ? (
          <p className="text-xs text-text-muted italic py-2">
            No development summary yet. Add a coach note or AI draft to create one.
          </p>
        ) : (
          <DevelopmentFocusSections
            doingWell={doingWell}
            workingOn={workingOn}
            currentFocus={currentFocus}
            nextStep={nextStep}
          />
        )}
      </CardContent>
    </Card>
  )
}

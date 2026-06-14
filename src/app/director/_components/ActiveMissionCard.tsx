// Sprint 2291–2320 — DONNA Mission Control V1
// Active Mission Card — surfaces the Director's current mission above fold on Today page.
// Server-compatible: uses Link for navigation, no client state needed.

import Link from 'next/link'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import type { FormattedMission } from '@/lib/donna/workflow/donnaMissionFormatter'

interface Props {
  mission: FormattedMission
}

export function ActiveMissionCard({ mission }: Props) {
  const statusLabel =
    mission.status === 'paused'  ? 'Paused' :
    mission.status === 'blocked' ? 'Needs Input' :
    `${mission.completedSteps} of ${mission.totalSteps} complete`

  return (
    <div className="rounded-xl border border-lime/30 bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-lime/5 border-b border-lime/20">
        <div className="flex items-center gap-2">
          <span className="label-xs text-lime">ACTIVE MISSION</span>
          {mission.status === 'paused' && (
            <span className="label-xs text-status-orange">PAUSED</span>
          )}
        </div>
        <span className="label-xs text-text-muted">{statusLabel}</span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Title + progress */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-text-primary leading-tight">
            {mission.title}
          </h3>
          <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-20 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-lime rounded-full transition-all"
                style={{ width: `${mission.progressPercent}%` }}
              />
            </div>
            <span className="label-xs text-text-muted tabular-nums">
              {mission.progressPercent}%
            </span>
          </div>
        </div>

        {/* Completed items */}
        {mission.completedItems.length > 0 && (
          <div className="space-y-1">
            {mission.completedItems.map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-lime shrink-0" />
                <span className="text-xs text-text-muted line-through">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Next action */}
        <div className="flex items-center gap-2 pt-0.5">
          <Circle size={13} className="text-text-secondary shrink-0" />
          <span className="text-sm font-medium text-text-primary">{mission.nextAction}</span>
        </div>
      </div>

      {/* Continue button */}
      <div className="px-5 pb-4">
        <Link
          href={mission.continueRoute}
          className="btn-lime inline-flex items-center gap-2 text-sm"
        >
          Continue
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

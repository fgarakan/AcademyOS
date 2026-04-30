import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { BarChart2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CoachObservationRow } from './CoachObservationsFeed'

const OBS_TYPE_LABELS: Record<string, string> = {
  general:            'General',
  technical:          'Technical',
  tactical:           'Tactical',
  movement:           'Movement',
  competition:        'Competition',
  behavioral:         'Behavioral',
  injury_concern:     'Injury Concern',
  positive_highlight: 'Positive Highlight',
}

interface Props {
  observations: CoachObservationRow[]
}

export function CoachObservationEvidenceSummary({ observations }: Props) {
  if (observations.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart2 className="w-5 h-5" />}
          title="No evidence summary yet"
          description="Applied coach observations will create the first evidence signals."
        />
      </Card>
    )
  }

  const total = observations.length
  const internalCount = observations.filter(o => o.is_private).length
  const fromRecapCount = observations.filter(
    o => (o.ai_entities as Record<string, unknown> | null)?.source === 'session_recap_draft'
  ).length
  const sessionLinkedCount = observations.filter(o => o.sessions !== null).length
  const mostRecentDate = observations[0].created_at

  const typeCounts: Record<string, number> = {}
  for (const obs of observations) {
    typeCounts[obs.observation_type] = (typeCounts[obs.observation_type] ?? 0) + 1
  }
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const tagCounts: Record<string, number> = {}
  for (const obs of observations) {
    for (const tag of obs.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const recapRatio = total > 0 ? Math.round((fromRecapCount / total) * 100) : 0
  const recapNote =
    fromRecapCount === 0
      ? 'No observations linked to session recaps yet.'
      : recapRatio >= 50
      ? 'Most recent evidence comes from structured coach recaps.'
      : 'Some evidence comes from structured coach recaps.'

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Development Evidence Summary</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        {/* Disclaimer */}
        <p className="text-[11px] text-text-muted leading-relaxed">
          Internal evidence summary. This does not change player level, priorities, or parent-facing communication.
        </p>

        {/* Metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: 'Total',          value: total },
            { label: 'Internal',       value: internalCount },
            { label: 'From Recap',     value: fromRecapCount },
            { label: 'Session-linked', value: sessionLinkedCount },
          ] as const).map(({ label, value }) => (
            <div key={label} className="bg-surface-raised rounded border border-border p-3 text-center">
              <p className="text-xl font-mono font-bold text-lime">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Most recent date */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Most recent observation</span>
          <span className="text-xs text-text-secondary font-mono">{formatDate(mostRecentDate)}</span>
        </div>

        {/* Top observation types */}
        {topTypes.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
              Most common observation types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topTypes.map(([type, count]) => (
                <span
                  key={type}
                  className="text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded"
                >
                  {OBS_TYPE_LABELS[type] ?? type}
                  <span className="ml-1.5 font-mono text-lime">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top tags */}
        {topTags.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
              Most frequent themes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded"
                >
                  {tag}
                  <span className="ml-1.5 font-mono text-lime">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recap note */}
        <p className="text-[11px] text-text-muted italic">{recapNote}</p>

      </CardContent>
    </Card>
  )
}

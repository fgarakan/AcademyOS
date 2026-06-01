import { Shield, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
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

export function CoachWrapUpObservationsPanel({ observations }: Props) {
  const wrapUpObs = observations.filter(
    obs => (obs.ai_entities as Record<string, unknown> | null)?.source === 'coach_wrap_up'
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-status-green" />
            <p className="label-xs">Recent Coach Observations</p>
            {wrapUpObs.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-status-green bg-status-green/10 border border-status-green/20 px-2 py-0.5 rounded">
                {wrapUpObs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] uppercase tracking-widest text-text-muted">Internal</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Observations written by coaches during session wrap-ups and approved by the director. Not visible to players or parents.
        </p>

        {wrapUpObs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center">
            <MessageSquare className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No coach wrap-up observations yet.</p>
            <p className="text-[11px] text-text-muted mt-1">
              Approved coach wrap-ups will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wrapUpObs.map(obs => (
              <div
                key={obs.id}
                className="rounded-lg border border-border bg-surface-raised px-4 py-3 space-y-2"
              >
                {/* Header: type label + date */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {obs.observation_type && (
                      <span className="label-xs">
                        {OBS_TYPE_LABELS[obs.observation_type] ?? obs.observation_type}
                      </span>
                    )}
                    <span className="text-[10px] bg-surface text-status-green border border-status-green/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Coach Wrap-Up
                    </span>
                    {obs.is_private && (
                      <span className="text-[10px] bg-surface text-text-muted border border-border px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Private
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted shrink-0">
                    {formatDate(obs.created_at)}
                  </span>
                </div>

                {/* Observation content */}
                <p className="text-sm text-text-secondary leading-relaxed">{obs.content}</p>

                {/* Provenance: coach + session */}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {obs.profiles?.display_name && (
                    <span className="text-[11px] text-text-muted">
                      Coach:{' '}
                      <span className="text-text-secondary">{obs.profiles.display_name}</span>
                    </span>
                  )}
                  {obs.sessions && (
                    <span className="text-[11px] text-text-muted">
                      Session:{' '}
                      <span className="text-text-secondary">
                        {obs.sessions.name ?? 'Unnamed'} &middot; {formatDate(obs.sessions.scheduled_date)}
                      </span>
                    </span>
                  )}
                </div>

                {/* Tags */}
                {obs.tags && obs.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {obs.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] bg-surface text-text-muted border border-border px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  )
}

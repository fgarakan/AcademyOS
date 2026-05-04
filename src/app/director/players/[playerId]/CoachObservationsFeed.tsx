'use client'

import { MessageSquare } from 'lucide-react'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

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

export interface CoachObservationRow {
  id: string
  content: string
  observation_type: string
  tags: string[] | null
  is_private: boolean
  ai_entities: Record<string, unknown> | null
  created_at: string
  profiles: { display_name: string } | null
  sessions: { name: string | null; scheduled_date: string } | null
}

interface Props {
  observations: CoachObservationRow[]
  onSelectForDraft?: (text: string) => void
}

export function CoachObservationsFeed({ observations, onSelectForDraft }: Props) {
  if (observations.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          title="No observations yet"
          description="Add a manual observation or voice note below. Session recap observations also appear here after a recap is applied."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {observations.map(obs => {
        const isFromRecap = obs.ai_entities?.source === 'session_recap_draft'

        return (
          <Card key={obs.id}>
            <CardContent className="py-4 space-y-2">

              {/* Header row: type label + badges + date */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="label-xs">
                    {OBS_TYPE_LABELS[obs.observation_type] ?? obs.observation_type}
                  </span>
                  {obs.is_private && (
                    <span className="text-[10px] bg-surface-raised text-text-muted border border-border px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Internal
                    </span>
                  )}
                  {isFromRecap && (
                    <span className="text-[10px] bg-surface-raised text-lime border border-lime/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      From Recap
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-muted shrink-0">
                  {formatDate(obs.created_at)}
                </span>
              </div>

              {/* Observation text */}
              <p className="text-sm text-text-secondary leading-relaxed">{obs.content}</p>

              {/* Provenance: coach + session */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
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

              {/* Use for Draft */}
              {onSelectForDraft && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectForDraft(obs.content)}
                    className="text-[11px] text-text-muted hover:text-lime transition-colors"
                  >
                    Use for Draft →
                  </button>
                </div>
              )}

            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

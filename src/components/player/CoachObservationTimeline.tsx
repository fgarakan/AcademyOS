import { MessageSquare } from 'lucide-react'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { CoachObservation } from '@/lib/backend/notes'

const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  technical: 'Technical',
  tactical: 'Tactical',
  movement: 'Movement',
  competition: 'Competition',
  behavioral: 'Behavioral',
  injury_concern: 'Injury Concern',
  positive_highlight: 'Positive Highlight',
}

interface Props {
  observations: CoachObservation[]
}

export function CoachObservationTimeline({ observations }: Props) {
  if (observations.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          title="No observations yet"
          description="Add the first coach observation below."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {observations.map(obs => (
        <Card key={obs.id}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="label-xs">
                  {OBSERVATION_TYPE_LABELS[obs.observation_type] ?? obs.observation_type}
                </span>
                {obs.is_private && (
                  <span className="text-[10px] bg-surface-raised text-text-muted border border-border px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Internal
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-muted shrink-0">
                {formatDate(obs.created_at)}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{obs.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

import { Lock, Eye, CheckCircle2, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
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

interface EvidenceItem {
  id: string
  content: string
  observation_type: string
  is_private: boolean
  created_at: string
  profiles: { display_name: string } | null
  sessions: { name: string | null; scheduled_date: string } | null
}

interface Props {
  items: EvidenceItem[]
}

function VisibilityPill({ isPrivate }: { isPrivate: boolean }) {
  if (isPrivate) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-text-muted bg-surface-raised">
        <Lock className="w-2.5 h-2.5" /> Internal
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-status-blue/20 text-status-blue bg-status-blue/5">
      <Eye className="w-2.5 h-2.5" /> Coach note
    </span>
  )
}

export function ProgressEvidenceTimeline({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs">Progress Evidence</p>
          <span className="text-[10px] text-text-muted">{items.length} observation{items.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-[10px] text-text-muted mt-0.5">
          Internal development evidence. Visibility is shown per item.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="No evidence yet"
            description="Coach observations and session evidence will appear here as development records are added."
          />
        ) : (
          <div className="space-y-0">
            {items.slice(0, 10).map((item, i) => (
              <EvidenceRow key={item.id} item={item} isLast={i === Math.min(items.length, 10) - 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EvidenceRow({ item, isLast }: { item: EvidenceItem; isLast: boolean }) {
  const typeLabel = OBS_TYPE_LABELS[item.observation_type] ?? item.observation_type
  const coachName = item.profiles?.display_name ?? 'Coach'
  const sessionContext = item.sessions
    ? `${item.sessions.name ?? 'Session'} · ${formatDate(item.sessions.scheduled_date)}`
    : null

  // Truncate long content to avoid info-dump
  const preview = item.content.length > 180
    ? item.content.slice(0, 180).trimEnd() + '…'
    : item.content

  return (
    <div className={`py-3 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex items-start gap-2 mb-1.5">
        <div className="mt-0.5 shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
              {typeLabel}
            </span>
            <VisibilityPill isPrivate={item.is_private} />
            <span className="text-[10px] text-text-muted">{formatDate(item.created_at)}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{preview}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-text-muted">{coachName}</span>
            {sessionContext && (
              <span className="text-[10px] text-text-muted">{sessionContext}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// PlayerPriorityEvidenceConnection — Sprint 1059
// Director-facing panel connecting active player priorities to supporting evidence.
// Shows priority context, latest supporting observations, missing evidence, and next watch-for.
// Director-only. No parent/player exposure. No automatic priority update. No level movement.

import { Target, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { CoachObservationItem } from '@/lib/players/playerEvidenceRepository'

interface PriorityRow {
  id: string
  title: string
  description: string | null
  category: string
  urgency: string
}

interface Props {
  priorities: PriorityRow[]
  observations: CoachObservationItem[]
}

const CATEGORY_LABELS: Record<string, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  fitness:     'Fitness / Movement',
  mental:      'Mental / Behavioral',
  competition: 'Competition',
  general:     'General',
}

// Map priority category to observation types for loose evidence linking.
const PRIORITY_TO_OBS_TYPES: Record<string, string[]> = {
  technical:   ['technical', 'positive_highlight', 'general'],
  tactical:    ['tactical', 'general'],
  fitness:     ['fitness', 'load', 'movement', 'recovery'],
  mental:      ['behavioral', 'general'],
  competition: ['competition', 'tactical'],
  general:     ['general', 'technical', 'tactical'],
}

function getObsForPriority(priority: PriorityRow, observations: CoachObservationItem[]): CoachObservationItem[] {
  const allowed = new Set(PRIORITY_TO_OBS_TYPES[priority.category ?? 'general'] ?? ['general'])
  return observations.filter(o => allowed.has(o.observationType)).slice(0, 3)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface PriorityCardProps {
  priority: PriorityRow
  linkedObs: CoachObservationItem[]
  index: number
}

function PriorityCard({ priority, linkedObs, index }: PriorityCardProps) {
  const categoryLabel = CATEGORY_LABELS[priority.category ?? 'general'] ?? 'General'
  const hasEvidence = linkedObs.length > 0
  const latest = linkedObs[0] ?? null

  const nextWatchFor = !hasEvidence
    ? `Ask coach to record a ${categoryLabel.toLowerCase()} observation aligned to this priority.`
    : `Continue collecting ${categoryLabel.toLowerCase()} evidence to build a stronger signal.`

  const nextSessionFocus = priority.description
    ? `Next session: reinforce — "${priority.description.slice(0, 80)}${priority.description.length > 80 ? '...' : ''}"`
    : `Next session: focus on ${priority.title.toLowerCase()}.`

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      {/* Priority header */}
      <div className="px-4 py-3 border-b border-border flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-lime/15 border border-lime/25 flex items-center justify-center text-[10px] font-bold text-lime shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary leading-snug">{priority.title}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">{categoryLabel}</p>
        </div>
        {priority.urgency && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-status-orange/10 border-status-orange/30 text-status-orange shrink-0">
            {priority.urgency}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Why this priority exists */}
        {priority.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{priority.description}</p>
        )}

        {/* Latest supporting evidence */}
        {latest ? (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Latest Supporting Evidence</p>
            <div className="rounded-lg bg-surface border border-border px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-text-muted uppercase tracking-widest">
                  {latest.observationType.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(latest.createdAt)}
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{latest.content}</p>
              {latest.coachName && (
                <p className="text-[10px] text-text-muted">— {latest.coachName}</p>
              )}
            </div>
            {linkedObs.length > 1 && (
              <p className="text-[10px] text-text-muted">+{linkedObs.length - 1} more related observations</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-xs text-status-orange">No matching evidence yet — see next coach watch-for below.</p>
          </div>
        )}

        {/* Evidence confidence */}
        <div className="flex items-center gap-2">
          {hasEvidence ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
          )}
          <p className="text-[10px] text-text-muted">
            Confidence: {hasEvidence ? `partial — ${linkedObs.length} observation${linkedObs.length !== 1 ? 's' : ''}` : 'insufficient — needs coach observation'}
          </p>
        </div>

        {/* Next watch-for and session focus */}
        <div className="border-t border-border pt-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Next Coach Watch-For</p>
          <p className="text-xs text-text-secondary leading-relaxed">{nextWatchFor}</p>
          <p className="text-[10px] text-text-muted leading-relaxed italic">{nextSessionFocus}</p>
        </div>

        {/* Director-only label */}
        <p className="text-[10px] text-text-muted pt-0.5">
          Source: player_priorities + coach_observations — Director view. No parent/player exposure.
        </p>
      </div>
    </div>
  )
}

export function PlayerPriorityEvidenceConnection({ priorities, observations }: Props) {
  if (priorities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-text-muted" />
            </div>
            <p className="font-semibold text-text-primary text-sm">Priority Evidence Connection</p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-muted">No active priorities set for this player. Assign priorities first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-lime" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Priority Evidence Connection</p>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">
              {priorities.length} active {priorities.length === 1 ? 'priority' : 'priorities'} — director view
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {priorities.map((priority, i) => (
          <PriorityCard
            key={priority.id}
            priority={priority}
            linkedObs={getObsForPriority(priority, observations)}
            index={i}
          />
        ))}
        <p className="text-[10px] text-text-muted text-center pt-1">
          No automatic priority update. No parent/player exposure. Director review required.
        </p>
      </CardContent>
    </Card>
  )
}

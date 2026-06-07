import Link from 'next/link'
import { Sparkles, BookOpen, Users, BarChart2 } from 'lucide-react'
import { DonnaSignalMeta } from './DonnaSignalMeta'
import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'

interface RecommendedItem {
  id: string
  typeLabel: string
  icon: React.ElementType
  label: string
  reasoning: string
  confidence: ConfidenceLevel
  evidenceSummary: string
  actionLabel: string
  actionHref: string
}

interface Suggestion {
  priority: string
  suggestion_type: string
}

interface Props {
  suggestions: Suggestion[]
  curricGapCount: number
  stalledPlayerCount: number
  advancementReadyCount: number
}

function deriveRecommendations(props: Props): RecommendedItem[] {
  const { suggestions, curricGapCount, stalledPlayerCount, advancementReadyCount } = props
  const items: RecommendedItem[] = []

  // Curriculum gap suggestions from academy_suggestions
  const curricSuggestions = suggestions.filter(s => s.suggestion_type === 'curriculum_gap')
  if (curricSuggestions.length > 0) {
    items.push({
      id:             'curriculum_gaps',
      typeLabel:      'Curriculum',
      icon:           BookOpen,
      label:          `${curricSuggestions.length} curriculum improvement${curricSuggestions.length !== 1 ? 's' : ''} identified`,
      reasoning:      `DONNA identified ${curricSuggestions.length} area${curricSuggestions.length !== 1 ? 's' : ''} where curriculum structure could better support player progression. Review these before next week's sessions.`,
      confidence:     curricSuggestions.length >= 3 ? 'medium' : 'low',
      evidenceSummary:`Based on ${curricSuggestions.length} curriculum suggestion record${curricSuggestions.length !== 1 ? 's' : ''}`,
      actionLabel:    'Review Curriculum',
      actionHref:     '/director/curriculum',
    })
  }

  // High-priority suggestions of any type
  const highPriority = suggestions.filter(
    s => s.priority === 'high' && s.suggestion_type !== 'curriculum_gap'
  )
  if (highPriority.length > 0) {
    items.push({
      id:             'high_priority_suggestions',
      typeLabel:      'Priority',
      icon:           BarChart2,
      label:          `${highPriority.length} high-priority suggestion${highPriority.length !== 1 ? 's' : ''} pending review`,
      reasoning:      `DONNA flagged ${highPriority.length} item${highPriority.length !== 1 ? 's' : ''} as high priority based on current academy signals. These have not yet become formal decisions.`,
      confidence:     'medium',
      evidenceSummary:`Based on ${highPriority.length} high-priority signal record${highPriority.length !== 1 ? 's' : ''}`,
      actionLabel:    'Review Suggestions',
      actionHref:     '/director/ai-suggestions',
    })
  }

  // Advancement-ready players
  if (advancementReadyCount > 0) {
    items.push({
      id:             'advancement_ready',
      typeLabel:      'Players',
      icon:           Users,
      label:          `${advancementReadyCount} player${advancementReadyCount !== 1 ? 's' : ''} ready for level advancement`,
      reasoning:      `These players meet all gate criteria for their current level. Confirming their advancement keeps their curriculum path on track and opens capacity in their current level.`,
      confidence:     'high',
      evidenceSummary:`Based on gate completion records for ${advancementReadyCount} player${advancementReadyCount !== 1 ? 's' : ''}`,
      actionLabel:    'View Players',
      actionHref:     '/director/players',
    })
  }

  // Stalled players needing intervention
  if (stalledPlayerCount > 0 && curricGapCount > 0) {
    items.push({
      id:             'stall_curriculum_link',
      typeLabel:      'Development',
      icon:           Users,
      label:          `${stalledPlayerCount} stalled player${stalledPlayerCount !== 1 ? 's' : ''} may be affected by curriculum gaps`,
      reasoning:      `${stalledPlayerCount} player${stalledPlayerCount !== 1 ? 's are' : ' is'} stalled AND there ${curricGapCount !== 1 ? 'are' : 'is'} ${curricGapCount} curriculum gap${curricGapCount !== 1 ? 's' : ''} at their level. Closing the curriculum gap may unblock progression.`,
      confidence:     'medium',
      evidenceSummary:`Based on stall records and curriculum suggestion records`,
      actionLabel:    'View Curriculum',
      actionHref:     '/director/curriculum',
    })
  }

  return items.slice(0, 5)
}

function RecommendationCard({ item }: { item: RecommendedItem }) {
  const { icon: Icon } = item
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)' }}>
        <Icon className="w-3.5 h-3.5 text-lime" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            {item.typeLabel}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-text-primary leading-snug">{item.label}</p>
        <p className="text-[11px] text-text-secondary leading-relaxed">{item.reasoning}</p>
        <DonnaSignalMeta
          confidence={item.confidence}
          evidenceSummary={item.evidenceSummary}
          recommendedAction={item.actionLabel}
          actionHref={item.actionHref}
        />
      </div>
      <Link
        href={item.actionHref}
        className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity pt-0.5 whitespace-nowrap"
      >
        {item.actionLabel} →
      </Link>
    </div>
  )
}

export function DonnaRecommendedActions(props: Props) {
  const items = deriveRecommendations(props)
  const total = props.suggestions.length

  if (items.length === 0 && total === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="label-xs">DONNA Recommendations</p>
        {total > 0 && (
          <span className="text-[10px] font-mono font-bold text-lime bg-lime/10 border border-lime/20 px-1.5 py-0.5 rounded-full leading-none">
            {total}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-surface">
          <Sparkles className="w-4 h-4 text-text-muted shrink-0" />
          <p className="text-[12px] text-text-secondary">
            No new recommendations. Your program is running to plan.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--color-border, #222222)' }}>
            <Sparkles className="w-3 h-3 text-lime/70" />
            <p className="text-[10px] uppercase tracking-widest text-lime/70 font-semibold">
              DONNA has prepared these for your review
            </p>
          </div>
          {items.map(item => (
            <RecommendationCard key={item.id} item={item} />
          ))}
          {total > items.length && (
            <div className="px-4 py-2.5">
              <Link href="/director/ai-suggestions" className="text-[11px] text-lime hover:opacity-80 font-medium">
                View all {total} suggestions →
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

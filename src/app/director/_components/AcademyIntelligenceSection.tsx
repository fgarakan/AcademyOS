import Link from 'next/link'
import { Lightbulb } from 'lucide-react'
import { DonnaSignalMeta } from './DonnaSignalMeta'
import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'

interface AcademyInsight {
  id: string
  observation: string
  causal: string
  confidence: ConfidenceLevel
  evidenceSummary: string
  recommendedAction?: string
  actionHref?: string
}

interface OverCapacityGroup {
  id: string
  name: string
  memberCount: number
  maxPlayers: number | null
}

interface Props {
  advancementReadyCount: number
  pendingCount: number
  mostBlockedLevelName: string | null
  mostBlockedLevelStalledCount: number
  mostBlockedLevelAvgCompletion: number
  curriculumTemplateCoverageGapCount: number
  overCapacityGroups: OverCapacityGroup[]
  recapCompletionPct: number | null
  completedSessionCount: number
  activePlayers: number
}

function deriveInsights(props: Props): AcademyInsight[] {
  const {
    advancementReadyCount,
    pendingCount,
    mostBlockedLevelName,
    mostBlockedLevelStalledCount,
    mostBlockedLevelAvgCompletion,
    curriculumTemplateCoverageGapCount,
    overCapacityGroups,
    recapCompletionPct,
    completedSessionCount,
    activePlayers,
  } = props

  const insights: AcademyInsight[] = []

  // 1. Graduation outpacing intake
  if (advancementReadyCount > 0 && advancementReadyCount > pendingCount) {
    const diff = advancementReadyCount - pendingCount
    insights.push({
      id:                'graduation_outpacing_intake',
      observation:       `Graduation rate is outpacing new intake.`,
      causal:            `${advancementReadyCount} player${advancementReadyCount !== 1 ? 's' : ''} ${advancementReadyCount !== 1 ? 'are' : 'is'} advancement-eligible while only ${pendingCount} new player${pendingCount !== 1 ? 's are' : ' is'} onboarding. Net enrollment could shrink by ${diff} if intake doesn't increase.`,
      confidence:        advancementReadyCount >= 4 ? 'high' : 'medium',
      evidenceSummary:   `Based on ${advancementReadyCount + pendingCount} player records`,
      recommendedAction: 'Review intake pipeline',
      actionHref:        '/director/players',
    })
  }

  // 2. Curriculum bottleneck — most blocked level
  if (mostBlockedLevelName && mostBlockedLevelStalledCount > 0) {
    const avgPct = Math.round(mostBlockedLevelAvgCompletion)
    insights.push({
      id:                'curriculum_bottleneck',
      observation:       `${mostBlockedLevelName} has the highest concentration of stalled players.`,
      causal:            `${mostBlockedLevelStalledCount} player${mostBlockedLevelStalledCount !== 1 ? 's' : ''} ${mostBlockedLevelStalledCount !== 1 ? 'are' : 'is'} stalled at an average ${avgPct}% gate completion. The gate threshold may be set too high, or coaching focus may need adjustment.`,
      confidence:        mostBlockedLevelStalledCount >= 3 ? 'high' : 'medium',
      evidenceSummary:   `Based on ${mostBlockedLevelStalledCount} stall records at ${mostBlockedLevelName}`,
      recommendedAction: 'Review curriculum gates',
      actionHref:        '/director/curriculum',
    })
  }

  // 3. Over-capacity groups
  if (overCapacityGroups.length > 0) {
    const top = overCapacityGroups[0]
    insights.push({
      id:                'over_capacity',
      observation:       `${top.name} is over capacity.`,
      causal:            `${top.memberCount} players are enrolled against a maximum of ${top.maxPlayers ?? '?'}. Coaching attention per player is reduced, which may slow individual progress.`,
      confidence:        'high',
      evidenceSummary:   'Based on live group enrollment records',
      recommendedAction: 'Review group capacity',
      actionHref:        '/director/players',
    })
  }

  // 4. Curriculum template gaps
  if (curriculumTemplateCoverageGapCount > 0) {
    insights.push({
      id:                'template_gaps',
      observation:       `${curriculumTemplateCoverageGapCount} curriculum level${curriculumTemplateCoverageGapCount !== 1 ? 's have' : ' has'} enrolled players but no class template.`,
      causal:            `Sessions at ${curriculumTemplateCoverageGapCount !== 1 ? 'these levels run' : 'this level runs'} without curriculum structure, making it harder to track player progress against learning objectives.`,
      confidence:        'high',
      evidenceSummary:   'Based on enrollment and template records',
      recommendedAction: 'Create class templates',
      actionHref:        '/director/class-templates/new',
    })
  }

  // 5. Low recap completion
  if (
    recapCompletionPct !== null &&
    recapCompletionPct < 70 &&
    completedSessionCount >= 3
  ) {
    const pct = Math.round(recapCompletionPct)
    insights.push({
      id:                'low_recap_completion',
      observation:       `Coach recap completion is ${pct}% this month.`,
      causal:            `Sessions without recaps leave gaps in player progress tracking. Coaches may need a reminder, or the wrap-up process may create too much friction after a session.`,
      confidence:        completedSessionCount >= 10 ? 'high' : 'medium',
      evidenceSummary:   `Based on ${completedSessionCount} completed sessions over the last 30 days`,
      recommendedAction: 'Review pending wrap-ups',
      actionHref:        '/director/review',
    })
  }

  // 6. All clear — healthy intake:graduation ratio
  if (
    insights.length === 0 &&
    activePlayers > 0 &&
    advancementReadyCount <= pendingCount
  ) {
    insights.push({
      id:              'balanced_pipeline',
      observation:     'Intake and graduation pipeline are balanced.',
      causal:          `${advancementReadyCount} player${advancementReadyCount !== 1 ? 's are' : ' is'} advancement-eligible and ${pendingCount} new player${pendingCount !== 1 ? 's are' : ' is'} onboarding. The program is sustaining enrollment.`,
      confidence:      'medium',
      evidenceSummary: `Based on ${activePlayers} active player records`,
    })
  }

  return insights.slice(0, 5)
}

export function AcademyIntelligenceSection(props: Props) {
  const insights = deriveInsights(props)

  if (insights.length === 0) return null

  return (
    <section className="space-y-2">
      <p className="label-xs">Academy Intelligence</p>
      <p className="text-[11px] text-text-muted -mt-1">Why is this happening?</p>

      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
        {insights.map((insight, i) => (
          <div key={insight.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[13px] font-semibold text-text-primary leading-snug">
                  {insight.observation}
                </p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {insight.causal}
                </p>
                <DonnaSignalMeta
                  confidence={insight.confidence}
                  evidenceSummary={insight.evidenceSummary}
                  recommendedAction={insight.recommendedAction}
                  actionHref={insight.actionHref}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

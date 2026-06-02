'use client'

import { TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import type { AssessmentComparison, DeltaStatus, BlueprintRecommendation } from '@/lib/assessment/assessmentTemplateTypes'
import { BLUEPRINT_RECOMMENDATION_LABELS } from '@/lib/assessment/assessmentTemplateTypes'

interface Props {
  comparison:      AssessmentComparison
  playerFirstName: string | null
  isDraft:         boolean
}

function DeltaIcon({ status }: { status: DeltaStatus }) {
  if (status === 'improved') return <TrendingUp className="w-3.5 h-3.5 text-status-green" />
  if (status === 'declined') return <TrendingDown className="w-3.5 h-3.5 text-status-red" />
  return <Minus className="w-3.5 h-3.5 text-text-muted" />
}

function DeltaBadge({ delta, status }: { delta: number | null; status: DeltaStatus }) {
  if (delta === null || status === 'new' || status === 'not_assessed') return null
  const color = status === 'improved' ? 'text-status-green' : status === 'declined' ? 'text-status-red' : 'text-text-muted'
  return (
    <span className={`text-[10px] font-mono font-semibold ${color}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  )
}

const REC_COLORS: Record<BlueprintRecommendation, string> = {
  keep_blueprint:                 'text-text-secondary bg-surface border-border',
  update_blueprint:               'text-lime bg-lime/8 border-lime/25',
  assign_mission:                 'text-status-blue bg-status-blue/8 border-status-blue/25',
  archive_mission:                'text-text-muted bg-surface border-border',
  trigger_level_readiness_review: 'text-status-orange bg-status-orange/8 border-status-orange/25',
  generate_parent_draft:          'text-status-green bg-status-green/8 border-status-green/25',
}

export function AssessmentComparisonCard({ comparison, playerFirstName, isDraft }: Props) {
  const { domainDeltas, topImprovements, topDeclines, overallDelta, overallStatus, recommendations, recommendationReasons } = comparison

  return (
    <div className="space-y-4">

      {/* Overall change */}
      <Card>
        <CardHeader>
          <p className="label-xs">Comparison Summary</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 mb-4">
            <DeltaIcon status={overallStatus} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {overallStatus === 'improved' && 'Overall improvement'}
                {overallStatus === 'declined' && 'Overall decline'}
                {overallStatus === 'unchanged' && 'Scores stable'}
                {overallStatus === 'new' && 'Baseline established'}
                {overallStatus === 'not_assessed' && 'Not scored'}
              </p>
              {overallDelta !== null && (
                <p className="text-xs text-text-muted">
                  Overall change: <span className={`font-mono font-semibold ${overallDelta > 0 ? 'text-status-green' : overallDelta < 0 ? 'text-status-red' : 'text-text-muted'}`}>
                    {overallDelta > 0 ? `+${overallDelta}` : overallDelta}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Domain deltas */}
          <div className="space-y-2">
            {domainDeltas.map(d => (
              <div key={d.domain} className="flex items-center gap-3">
                <p className="text-[10px] text-text-muted w-20 shrink-0">{d.label}</p>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {d.current !== null ? (
                    <>
                      <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (d.current ?? 0) >= 7.5 ? 'bg-status-green' :
                            (d.current ?? 0) >= 5   ? 'bg-lime' : 'bg-status-orange'
                          }`}
                          style={{ width: `${((d.current ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary w-6 text-right shrink-0">
                        {d.current.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-text-muted">—</span>
                  )}
                </div>
                <DeltaIcon status={d.status} />
                <DeltaBadge delta={d.delta} status={d.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top improvements */}
      {topImprovements.length > 0 && (
        <Card>
          <CardHeader>
            <p className="label-xs text-status-green">Top Improvements</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {topImprovements.map(s => (
              <div key={`${s.section_key}_${s.skill_key}`} className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary">{s.label}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-text-muted">{s.previous?.toFixed(1) ?? '—'}</span>
                  <TrendingUp className="w-3 h-3 text-status-green" />
                  <span className="text-[10px] font-mono font-semibold text-status-green">{s.current?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top declines */}
      {topDeclines.length > 0 && (
        <Card>
          <CardHeader>
            <p className="label-xs text-status-red">Areas of Concern</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {topDeclines.map(s => (
              <div key={`${s.section_key}_${s.skill_key}`} className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary">{s.label}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-text-muted">{s.previous?.toFixed(1) ?? '—'}</span>
                  <TrendingDown className="w-3 h-3 text-status-red" />
                  <span className="text-[10px] font-mono font-semibold text-status-red">{s.current?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-lime" />
              <p className="label-xs">Suggested Next Steps</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {recommendations.map((rec, i) => (
              <div key={rec} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${REC_COLORS[rec]}`}>
                <span className="shrink-0 mt-0.5">·</span>
                <div>
                  <p className="font-semibold">{BLUEPRINT_RECOMMENDATION_LABELS[rec]}</p>
                  {recommendationReasons[i] && (
                    <p className="text-[10px] opacity-70 mt-0.5">{recommendationReasons[i]}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Safety guardrail */}
            <div className="flex items-start gap-2 pt-1 border-t border-border">
              <AlertTriangle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                {isDraft
                  ? 'These suggestions are generated from the draft. No changes take effect until the director approves the assessment.'
                  : `These are suggestions only. ${playerFirstName ? playerFirstName + "'s" : "The player's"} blueprint, missions, level, and parent summary require director action — nothing changes automatically.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

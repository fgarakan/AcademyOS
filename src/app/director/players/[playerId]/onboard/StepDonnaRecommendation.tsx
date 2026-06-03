'use client'

import { useMemo } from 'react'
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  generatePlacementRecommendation,
  type AssessmentScoreInput,
  type PlacementContext,
  type GroupOption as EngGroupOption,
} from '@/lib/blueprint/placementRecommendationEngine'
import type { AssessmentData } from './StepAssessment'

interface GroupOption {
  id: string
  name: string
  track: string | null
}

interface Props {
  assessment: AssessmentData | null
  groups: GroupOption[]
  playerAgeYears: number | null
  onDone: (recommendedGroupId: string | null) => void
}

function confidenceColor(tier: string) {
  if (tier === 'high') return 'bg-status-green/10 text-status-green border-status-green/30'
  if (tier === 'medium') return 'bg-lime/10 text-lime border-lime/30'
  return 'bg-status-orange/10 text-status-orange border-status-orange/30'
}

export function StepDonnaRecommendation({ assessment, groups, playerAgeYears, onDone }: Props) {
  const recommendation = useMemo(() => {
    if (!assessment) return null
    const scores: AssessmentScoreInput = {
      technical_score: assessment.technical_score,
      tactical_score: assessment.tactical_score,
      movement_score: assessment.movement_score,
      competition_score: assessment.competition_score,
      behavioral_score: assessment.behavioral_score,
    }
    const engGroups: EngGroupOption[] = groups.map(g => ({
      id: g.id,
      name: g.name,
      track: g.track,
      level_id: null,
      min_age: null,
      max_age: null,
      max_players: null,
    }))
    const context: PlacementContext = {
      playerAgeYears,
      availableLevels: [],
      availableGroups: engGroups,
    }
    return generatePlacementRecommendation(scores, context)
  }, [assessment, groups, playerAgeYears])

  if (!assessment) {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <p className="text-sm text-text-secondary">No snapshot yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Complete the Quick Placement Snapshot first so DONNA can suggest a placement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Skip — go to Placement Review
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {recommendation && (
        <>
          {/* DONNA explanation */}
          <div className="px-4 py-3.5 rounded-xl bg-lime/8 border border-lime/20">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-lime mb-1.5">
                  DONNA's Recommendation
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {recommendation.donnaExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence + stage */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${confidenceColor(recommendation.confidenceTier)}`}>
              {recommendation.confidenceScore}% confidence
            </div>
            <span className="text-[10px] text-text-muted">
              {recommendation.recommendedStage.replace(/_/g, ' ')}
            </span>
            {recommendation.computedOverallAvg !== null && (
              <span className="text-[10px] text-text-muted ml-auto">
                avg <span className="font-mono">{recommendation.computedOverallAvg.toFixed(1)}</span>/10
              </span>
            )}
          </div>

          {/* Suggested group */}
          {recommendation.recommendedGroupName ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
              <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
                  Suggested Group
                </p>
                <p className="text-sm font-semibold text-lime">
                  {recommendation.recommendedGroupName}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
              <p className="text-xs text-text-muted">
                No groups matched the assessment profile. You can still assign a group manually in the next step.
              </p>
            </div>
          )}

          {/* Strengths and Needs Improvement side by side */}
          {(recommendation.topReasons.length > 0 || recommendation.limitingFactors.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendation.topReasons.length > 0 && (
                <div className="px-4 py-3 rounded-xl bg-status-green/5 border border-status-green/15">
                  <p className="label-xs text-status-green mb-2">Reasons</p>
                  <div className="space-y-1.5">
                    {recommendation.topReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-status-green text-xs mt-0.5 shrink-0">✓</span>
                        <p className="text-xs text-text-secondary leading-snug">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recommendation.limitingFactors.length > 0 && (
                <div className="px-4 py-3 rounded-xl bg-status-orange/5 border border-status-orange/15">
                  <p className="label-xs text-status-orange mb-2">Needs Improvement</p>
                  <div className="space-y-1.5">
                    {recommendation.limitingFactors.slice(0, 3).map((factor, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-status-orange text-xs mt-0.5 shrink-0">•</span>
                        <p className="text-xs text-text-secondary leading-snug">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk notes */}
          {recommendation.riskNotes.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border">
              <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                {recommendation.riskNotes[0]}
              </p>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => onDone(recommendation?.recommendedGroupId ?? null)}
        className="btn-lime px-5 py-2 text-sm"
      >
        Review Placement →
      </button>
    </div>
  )
}

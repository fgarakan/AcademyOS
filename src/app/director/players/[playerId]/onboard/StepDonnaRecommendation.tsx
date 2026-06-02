'use client'

import { useMemo } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
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
          <p className="text-sm text-text-secondary">No assessment yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Complete the Starting Assessment first so DONNA can suggest a placement.
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
                  DONNA's Analysis
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {recommendation.donnaExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2">
            <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              recommendation.confidenceTier === 'high'
                ? 'bg-status-green/10 text-status-green border-status-green/30'
                : recommendation.confidenceTier === 'medium'
                ? 'bg-lime/10 text-lime border-lime/30'
                : 'bg-status-orange/10 text-status-orange border-status-orange/30'
            }`}>
              {recommendation.confidenceTier.charAt(0).toUpperCase() + recommendation.confidenceTier.slice(1)} confidence
            </div>
            {recommendation.computedOverallAvg !== null && (
              <span className="text-xs text-text-muted">
                Overall avg: <span className="font-mono text-text-secondary">{recommendation.computedOverallAvg.toFixed(0)}</span>
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

          {/* Top reasons */}
          {recommendation.topReasons.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Why this recommendation</p>
              {recommendation.topReasons.slice(0, 3).map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-lime text-xs mt-0.5 shrink-0">·</span>
                  <p className="text-xs text-text-secondary">{reason}</p>
                </div>
              ))}
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

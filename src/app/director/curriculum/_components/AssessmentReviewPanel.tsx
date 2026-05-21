'use client'

import { useState } from 'react'
import { Shield, CheckCircle, X, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import type { PlacementRecommendationDraft, RecommendedStage } from '@/lib/assessments/placementRecommendation'
import {
  getPlacementConfidenceLabel,
  getStageLabel,
} from '@/lib/assessments/placementRecommendation'
import type { ReviewDecision, AssessmentReviewAction } from '@/lib/assessments/reviewModel'
import {
  REVIEW_DECISION_LABELS,
  REVIEW_DECISION_DESCRIPTIONS,
  makeReviewAction,
  getFinalStage,
} from '@/lib/assessments/reviewModel'
import { ASSESSMENT_DOMAIN_LABELS } from '@/lib/assessments/index'

interface Props {
  levelName: string
}

const STAGE_OPTIONS: RecommendedStage[] = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
]

const DECISIONS: ReviewDecision[] = ['approve', 'adjust_and_approve', 'reject', 'defer']

const DECISION_ICON: Record<ReviewDecision, typeof CheckCircle> = {
  approve: CheckCircle,
  adjust_and_approve: Shield,
  reject: X,
  defer: Clock,
}

const DECISION_COLOUR: Record<ReviewDecision, string> = {
  approve: 'text-status-green border-status-green/30 bg-status-green/5',
  adjust_and_approve: 'text-lime border-lime/30 bg-lime/5',
  reject: 'text-status-red border-status-red/30 bg-status-red/5',
  defer: 'text-status-orange border-status-orange/30 bg-status-orange/5',
}

function makeSampleRecommendation(): PlacementRecommendationDraft {
  return {
    draftId: 'preview_001',
    assessmentDraftId: 'draft_preview',
    playerName: 'New Player',
    weightedScore: 5.4,
    recommendedStage: 'green_performance',
    stageBandLabel: 'Green Ball — Performance',
    domainSummary: [
      { domain: 'skill', score: 6, bandLabel: 'Applying', indicativeLevel: 'Orange 3 – Green 1' },
      { domain: 'competition', score: 5, bandLabel: 'Developing competitor', indicativeLevel: 'Orange 3 – Green 1' },
      { domain: 'fitness', score: 6, bandLabel: 'Solid on-court capability', indicativeLevel: 'Orange 3 – Green 1' },
      { domain: 'mental_performance', score: 4, bandLabel: 'Developing self-regulation', indicativeLevel: 'Orange 1–2' },
    ],
    strengths: ['Applying in skill', 'Solid on-court capability in fitness'],
    areasForAttention: [],
    confidence: 'moderate',
    directorNote: 'Recommendation: green_performance. Moderate confidence — review domain notes before approving.',
    generatedAt: new Date().toISOString(),
    isDirectorApprovalRequired: true,
  }
}

export function AssessmentReviewPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [recommendation] = useState<PlacementRecommendationDraft>(makeSampleRecommendation)
  const [selectedDecision, setSelectedDecision] = useState<ReviewDecision | null>(null)
  const [adjustedStage, setAdjustedStage] = useState<RecommendedStage>('green_performance')
  const [directorNotes, setDirectorNotes] = useState('')
  const [notifyCoach, setNotifyCoach] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reviewAction, setReviewAction] = useState<AssessmentReviewAction | null>(null)

  const canConfirm = selectedDecision !== null && (
    selectedDecision !== 'adjust_and_approve' || adjustedStage !== null
  )

  function handleConfirm() {
    if (!canConfirm || !selectedDecision) return
    const action = makeReviewAction(selectedDecision, 'director', {
      adjustedStage: selectedDecision === 'adjust_and_approve' ? adjustedStage : undefined,
      directorNotes,
      notifyCoach,
    })
    setReviewAction(action)
    setConfirmed(true)
  }

  function handleReset() {
    setSelectedDecision(null)
    setDirectorNotes('')
    setNotifyCoach(false)
    setConfirmed(false)
    setReviewAction(null)
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-[12px] font-medium text-text-secondary">
            Assessment Review — {levelName}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-status-orange/30 text-status-orange">
            Director only
          </span>
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
              Recommendation preview
            </p>
            <RecommendationCard recommendation={recommendation} />
          </div>

          {confirmed && reviewAction ? (
            <ConfirmedView
              reviewAction={reviewAction}
              recommendation={recommendation}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* Decision selector */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Director decision</p>
                {DECISIONS.map(decision => {
                  const Icon = DECISION_ICON[decision]
                  const isSelected = selectedDecision === decision
                  return (
                    <button
                      key={decision}
                      onClick={() => setSelectedDecision(decision)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? DECISION_COLOUR[decision]
                          : 'border-border bg-surface text-text-muted hover:border-lime/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-medium">{REVIEW_DECISION_LABELS[decision]}</p>
                        <p className="text-[10px] opacity-70 leading-relaxed mt-0.5">
                          {REVIEW_DECISION_DESCRIPTIONS[decision]}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Adjusted stage selector */}
              {selectedDecision === 'adjust_and_approve' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Adjusted stage</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGE_OPTIONS.map(stage => (
                      <button
                        key={stage}
                        onClick={() => setAdjustedStage(stage)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                          adjustedStage === stage
                            ? 'bg-lime/10 border-lime/30 text-lime'
                            : 'border-border bg-surface text-text-muted hover:border-lime/20'
                        }`}
                      >
                        {getStageLabel(stage).split(' — ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Director notes */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Director notes</p>
                <textarea
                  placeholder="Reasoning, context, observations that informed your decision…"
                  value={directorNotes}
                  onChange={e => setDirectorNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
                />
              </div>

              {/* Notify coach toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyCoach}
                  onChange={e => setNotifyCoach(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-[11px] text-text-secondary">
                  Flag for coach (note only — no system notification sent)
                </span>
              </label>

              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Decision (Draft)
              </button>

              <p className="text-[10px] text-text-muted/60 text-center leading-relaxed">
                This records a draft decision only. No player record is changed until
                the full placement workflow is activated.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RecommendationCard({ recommendation }: { recommendation: PlacementRecommendationDraft }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text-primary">{recommendation.stageBandLabel}</p>
        {recommendation.weightedScore !== null && (
          <span className="font-mono text-[14px] font-bold text-lime">
            {recommendation.weightedScore}<span className="text-[10px] text-text-muted">/10</span>
          </span>
        )}
      </div>

      <p className="text-[10px] text-text-muted">
        {getPlacementConfidenceLabel(recommendation.confidence)}
      </p>

      <div className="space-y-1 border-t border-border pt-2">
        {recommendation.domainSummary.map(line => (
          <div key={line.domain} className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">
              {ASSESSMENT_DOMAIN_LABELS[line.domain].split(' ')[0]}
            </span>
            <span className="text-[10px] font-mono text-text-secondary">
              {line.score}/10 · {line.bandLabel}
            </span>
          </div>
        ))}
      </div>

      {recommendation.strengths.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-status-green mb-1">Strengths</p>
          {recommendation.strengths.map(s => (
            <p key={s} className="text-[10px] text-text-muted">· {s}</p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-muted/80 leading-relaxed border-t border-border pt-2">
        {recommendation.directorNote}
      </p>
    </div>
  )
}

interface ConfirmedViewProps {
  reviewAction: AssessmentReviewAction
  recommendation: PlacementRecommendationDraft
  onReset: () => void
}

function ConfirmedView({ reviewAction, recommendation, onReset }: ConfirmedViewProps) {
  const finalStage = getFinalStage(recommendation, reviewAction)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] font-medium text-lime">Draft decision recorded</p>
        </div>
        <p className="text-[11px] text-text-secondary">
          Decision: <span className="font-medium">{REVIEW_DECISION_LABELS[reviewAction.decision]}</span>
        </p>
        {finalStage && (
          <p className="text-[11px] text-text-secondary">
            Stage: <span className="font-medium text-lime">{getStageLabel(finalStage)}</span>
          </p>
        )}
        {reviewAction.directorNotes && (
          <p className="text-[10px] text-text-muted leading-relaxed border-t border-lime/10 pt-2">
            {reviewAction.directorNotes}
          </p>
        )}
        <p className="text-[10px] text-text-muted/60 leading-relaxed border-t border-lime/10 pt-2">
          No player record has been modified. To activate a placement, use the
          full Placement workflow in the player profile.
        </p>
      </div>
      <button onClick={onReset} className="btn-ghost w-full">
        Review Another Assessment
      </button>
    </div>
  )
}

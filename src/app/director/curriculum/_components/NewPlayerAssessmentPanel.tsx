'use client'

import { useState } from 'react'
import { ClipboardList, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import type { AssessmentDomain, AssessmentDomainScore } from '@/lib/assessments/index'
import {
  makeEmptyDraft,
  isAssessmentComplete,
  ASSESSMENT_DOMAIN_LABELS,
  computeWeightedScore,
} from '@/lib/assessments/index'
import { getSkillBandForScore, SKILL_RUBRIC_ITEMS } from '@/lib/assessments/skillRubric'
import { getCompetitionBandForScore, COMPETITION_RUBRIC_ITEMS } from '@/lib/assessments/competitionRubric'
import { getFitnessBandForScore, FITNESS_RUBRIC_ITEMS } from '@/lib/assessments/fitnessRubric'
import { getMentalBandForScore, MENTAL_RUBRIC_ITEMS } from '@/lib/assessments/mentalPerformanceRubric'
import { generatePlacementRecommendation, getPlacementConfidenceLabel } from '@/lib/assessments/placementRecommendation'
import type { AssessmentRubricBand } from '@/lib/assessments/index'

interface Props {
  levelId: string
  levelName: string
}

const DOMAIN_ORDER: AssessmentDomain[] = ['skill', 'competition', 'fitness', 'mental_performance']

function getBandForDomain(domain: AssessmentDomain, score: number): AssessmentRubricBand | null {
  switch (domain) {
    case 'skill': return getSkillBandForScore(score)
    case 'competition': return getCompetitionBandForScore(score)
    case 'fitness': return getFitnessBandForScore(score)
    case 'mental_performance': return getMentalBandForScore(score)
  }
}

function getObservationPromptsForDomain(domain: AssessmentDomain): Array<{ name: string; coachPrompt: string }> {
  switch (domain) {
    case 'skill': return SKILL_RUBRIC_ITEMS.filter(i => i.isRequired)
    case 'competition': return COMPETITION_RUBRIC_ITEMS.filter(i => i.isRequired)
    case 'fitness': return FITNESS_RUBRIC_ITEMS.filter(i => i.isRequired)
    case 'mental_performance': return MENTAL_RUBRIC_ITEMS.filter(i => i.isRequired)
  }
}

export function NewPlayerAssessmentPanel({ levelName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [activeDomain, setActiveDomain] = useState<AssessmentDomain>('skill')
  const [domainScores, setDomainScores] = useState<Partial<Record<AssessmentDomain, AssessmentDomainScore>>>({})
  const [domainNotes, setDomainNotes] = useState<Partial<Record<AssessmentDomain, string>>>({})
  const [overallNotes, setOverallNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const draft = makeEmptyDraft({ domainScores, overallNotes })
  const canSubmit = isAssessmentComplete(draft, ['skill', 'competition'])
  const weightedScore = computeWeightedScore(domainScores)

  function handleScoreChange(domain: AssessmentDomain, rawScore: number) {
    const band = getBandForDomain(domain, rawScore)
    setDomainScores(prev => ({
      ...prev,
      [domain]: {
        domain,
        rawScore,
        bandId: band?.bandId ?? '',
        bandLabel: band?.label ?? '',
        coachNotes: band?.coachNotes ?? '',
        evidenceNotes: domainNotes[domain] ?? '',
      } satisfies AssessmentDomainScore,
    }))
  }

  function handleNotesChange(domain: AssessmentDomain, notes: string) {
    setDomainNotes(prev => ({ ...prev, [domain]: notes }))
    const existing = domainScores[domain]
    if (existing) {
      setDomainScores(prev => ({
        ...prev,
        [domain]: { ...existing, evidenceNotes: notes },
      }))
    }
  }

  function handleReset() {
    setDomainScores({})
    setDomainNotes({})
    setOverallNotes('')
    setActiveDomain('skill')
    setSubmitted(false)
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-[12px] font-medium text-text-secondary">New Player Assessment</span>
          {Object.keys(domainScores).length > 0 && !submitted && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime/10 text-lime border border-lime/20">
              {Object.keys(domainScores).length}/4 domains
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">
          <div className="flex items-start gap-2 pt-3 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-muted leading-relaxed">
              <span className="text-status-orange font-medium">Draft assessment — director review required.</span>{' '}
              This generates a placement recommendation only. No official placement is written until
              a director approves and activates via the full placement workflow.
            </p>
          </div>

          {submitted ? (
            <SubmittedView
              domainScores={domainScores}
              weightedScore={weightedScore}
              draft={draft}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* Domain tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {DOMAIN_ORDER.map(domain => {
                  const scored = domainScores[domain] != null
                  const isActive = activeDomain === domain
                  return (
                    <button
                      key={domain}
                      onClick={() => setActiveDomain(domain)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                        isActive
                          ? 'bg-lime/10 border-lime/30 text-lime'
                          : scored
                            ? 'border-status-green/30 text-status-green bg-status-green/5'
                            : 'border-border bg-surface text-text-muted hover:border-lime/20'
                      }`}
                    >
                      {ASSESSMENT_DOMAIN_LABELS[domain].split(' ')[0]}
                      {scored && !isActive && <span className="ml-1 text-[8px]">✓</span>}
                    </button>
                  )
                })}
              </div>

              <DomainScoreForm
                domain={activeDomain}
                levelName={levelName}
                currentScore={domainScores[activeDomain]?.rawScore ?? null}
                currentNotes={domainNotes[activeDomain] ?? ''}
                onScoreChange={s => handleScoreChange(activeDomain, s)}
                onNotesChange={n => handleNotesChange(activeDomain, n)}
              />

              {/* Overall notes */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Overall coach notes</p>
                <textarea
                  placeholder="General impressions, context, parent interview notes…"
                  value={overallNotes}
                  onChange={e => setOverallNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
                />
              </div>

              {!canSubmit && (
                <p className="text-[10px] text-text-muted/70 text-center">
                  Score Skill and Competition to enable submission
                </p>
              )}

              <button
                onClick={() => canSubmit && setSubmitted(true)}
                disabled={!canSubmit}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit for Director Review
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface DomainScoreFormProps {
  domain: AssessmentDomain
  levelName: string
  currentScore: number | null
  currentNotes: string
  onScoreChange: (score: number) => void
  onNotesChange: (notes: string) => void
}

function DomainScoreForm({
  domain,
  currentScore,
  currentNotes,
  onScoreChange,
  onNotesChange,
}: DomainScoreFormProps) {
  const band = currentScore !== null ? getBandForDomain(domain, currentScore) : null
  const items = getObservationPromptsForDomain(domain)

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-text-muted">
        <span className="font-medium text-text-secondary">{ASSESSMENT_DOMAIN_LABELS[domain]}</span>
        {' '}— score 1–10
      </p>

      {/* Score picker */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onScoreChange(n)}
            className={`w-7 h-7 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
              currentScore === n
                ? 'bg-lime text-base border-lime'
                : 'border-border bg-surface text-text-muted hover:border-lime/30'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Band display */}
      {band && (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-medium text-lime">{band.label}</p>
          <p className="text-[11px] text-text-secondary leading-relaxed">{band.description}</p>
          <p className="text-[10px] text-text-muted leading-relaxed pt-1 border-t border-border">
            <span className="font-medium">Coach note:</span> {band.coachNotes}
          </p>
          {band.indicativeLevel && (
            <p className="text-[10px] text-text-muted/70">
              Indicative level: {band.indicativeLevel}
            </p>
          )}
        </div>
      )}

      {/* Observation prompts */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Key observations</p>
          {items.map(item => (
            <div key={item.name} className="rounded-lg border border-border/50 px-3 py-2">
              <p className="text-[10px] font-medium text-text-secondary">{item.name}</p>
              <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{item.coachPrompt}</p>
            </div>
          ))}
        </div>
      )}

      {/* Domain notes */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Evidence notes</p>
        <textarea
          placeholder="What did you observe? Any context for this score…"
          value={currentNotes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
        />
      </div>
    </div>
  )
}

interface SubmittedViewProps {
  domainScores: Partial<Record<AssessmentDomain, AssessmentDomainScore>>
  weightedScore: number | null
  draft: ReturnType<typeof makeEmptyDraft>
  onReset: () => void
}

function SubmittedView({ domainScores, weightedScore, draft, onReset }: SubmittedViewProps) {
  const recommendation = generatePlacementRecommendation(draft)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] font-medium text-lime">Assessment submitted for director review</p>
        </div>

        {weightedScore !== null && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Weighted score</p>
            <p className="text-[20px] font-mono font-bold text-lime">
              {weightedScore}<span className="text-[12px] text-text-muted">/10</span>
            </p>
          </div>
        )}

        {recommendation.recommendedStage && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Recommended stage</p>
            <p className="text-[13px] font-semibold text-text-primary">{recommendation.stageBandLabel}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {getPlacementConfidenceLabel(recommendation.confidence)}
            </p>
          </div>
        )}

        <div className="space-y-1 border-t border-lime/10 pt-2">
          {DOMAIN_ORDER.map(domain => {
            const score = domainScores[domain]
            if (!score) return null
            return (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">
                  {ASSESSMENT_DOMAIN_LABELS[domain].split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono text-text-secondary">
                  {score.rawScore}/10 · {score.bandLabel}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-start gap-1.5 border-t border-lime/10 pt-2">
          <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">{recommendation.directorNote}</p>
        </div>
      </div>

      <button onClick={onReset} className="btn-ghost w-full">
        Start New Assessment
      </button>
    </div>
  )
}

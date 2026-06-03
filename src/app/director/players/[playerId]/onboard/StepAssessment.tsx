'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { quickAssessmentAction } from '../quickAssessmentAction'

type Rating = 1 | 2 | 3 | 4

const DOMAINS: { key: string; label: string }[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'tactical', label: 'Tactical' },
  { key: 'movement', label: 'Movement' },
  { key: 'competition', label: 'Competition' },
  { key: 'behavioral', label: 'Behavioral' },
]

const RATING_LABELS: Record<Rating, string> = {
  1: 'Needs support',
  2: 'Developing',
  3: 'Solid',
  4: 'Strong',
}

const RATING_TO_SCORE: Record<Rating, number> = { 1: 2.5, 2: 5.0, 3: 7.5, 4: 10.0 }

function scoreLabel(score: number | null): string {
  if (score === null) return '—'
  if (score <= 2.5) return 'Needs support'
  if (score <= 5.0) return 'Developing'
  if (score <= 7.5) return 'Solid'
  return 'Strong'
}

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-surface-raised'
  if (score <= 2.5) return 'bg-status-red'
  if (score <= 5.0) return 'bg-status-orange'
  if (score <= 7.5) return 'bg-lime'
  return 'bg-status-green'
}

export interface AssessmentData {
  id: string
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  assessed_date: string | null
}

interface Props {
  playerId: string
  existingAssessment: AssessmentData | null
  onDone: (savedAssessment: AssessmentData | null) => void
}

function AssessmentDonePanel({
  assessment,
  onContinue,
}: {
  assessment: AssessmentData
  onContinue: () => void
}) {
  const scores = [
    { label: 'Technical', score: assessment.technical_score },
    { label: 'Tactical', score: assessment.tactical_score },
    { label: 'Movement', score: assessment.movement_score },
    { label: 'Competition', score: assessment.competition_score },
    { label: 'Behavioral', score: assessment.behavioral_score },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
        <p className="text-sm font-semibold text-text-primary">Assessment recorded</p>
        {assessment.assessed_date && (
          <span className="text-xs text-text-muted">
            {new Date(assessment.assessed_date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {scores.map(({ label, score }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${scoreColor(score)}`} />
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="text-xs font-medium text-text-primary">{scoreLabel(score)}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="btn-lime px-5 py-2 text-sm"
      >
        See DONNA's Recommendation →
      </button>
    </div>
  )
}

export function StepAssessment({ playerId, existingAssessment, onDone }: Props) {
  const [ratings, setRatings] = useState<Record<string, Rating | null>>({
    technical: null, tactical: null, movement: null, competition: null, behavioral: null,
  })
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<AssessmentData | null>(existingAssessment)

  if (saved) {
    return <AssessmentDonePanel assessment={saved} onContinue={() => onDone(saved)} />
  }

  function handleSave() {
    const anyRated = Object.values(ratings).some(r => r !== null)
    if (!anyRated) { setError('Rate at least one domain before saving.'); return }
    setError(null)
    startTransition(async () => {
      const result = await quickAssessmentAction({
        playerId,
        technical: ratings.technical ?? null,
        tactical: ratings.tactical ?? null,
        movement: ratings.movement ?? null,
        competition: ratings.competition ?? null,
        behavioral: ratings.behavioral ?? null,
        note: note.trim() || null,
      })
      if (!result.ok) { setError(result.error); return }
      const today = new Date().toISOString().split('T')[0]
      const newAssessment: AssessmentData = {
        id: result.assessmentId ?? '',
        technical_score: ratings.technical !== null ? RATING_TO_SCORE[ratings.technical] : null,
        tactical_score: ratings.tactical !== null ? RATING_TO_SCORE[ratings.tactical] : null,
        movement_score: ratings.movement !== null ? RATING_TO_SCORE[ratings.movement] : null,
        competition_score: ratings.competition !== null ? RATING_TO_SCORE[ratings.competition] : null,
        behavioral_score: ratings.behavioral !== null ? RATING_TO_SCORE[ratings.behavioral] : null,
        assessed_date: today,
      }
      setSaved(newAssessment)
      onDone(newAssessment)
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {DOMAINS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">{label}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {([1, 2, 3, 4] as Rating[]).map(r => {
                const selected = ratings[key] === r
                const colorClass = selected
                  ? r === 1 ? 'bg-status-red/15 border-status-red/50 text-status-red'
                  : r === 2 ? 'bg-status-orange/15 border-status-orange/50 text-status-orange'
                  : r === 3 ? 'bg-lime/15 border-lime/50 text-lime'
                  : 'bg-status-green/15 border-status-green/50 text-status-green'
                  : 'bg-surface-raised border-border text-text-muted hover:border-border'
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setRatings(prev => ({ ...prev, [key]: prev[key] === r ? null : r }))
                    }
                    className={`py-2 px-1 rounded-lg border text-xs font-medium transition-colors leading-snug ${colorClass}`}
                  >
                    {RATING_LABELS[r]}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-secondary">Notes (optional)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Any initial observations…"
          className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none transition-colors"
        />
      </div>

      {error && <p className="text-sm text-status-red">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-lime flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isPending ? 'Saving…' : 'Save Snapshot'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

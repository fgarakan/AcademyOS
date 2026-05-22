'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle, AlertCircle, ClipboardList, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { quickAssessmentAction } from './quickAssessmentAction'
import { buildAssessmentDonnaChip } from '@/lib/donna/assessmentDonnaContext'

interface Props {
  playerId: string
}

type Rating = 1 | 2 | 3 | 4

interface DomainState {
  technical: Rating | null
  tactical: Rating | null
  movement: Rating | null
  competition: Rating | null
  behavioral: Rating | null
}

const DOMAINS: { key: keyof DomainState; label: string }[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'tactical', label: 'Tactical' },
  { key: 'movement', label: 'Movement' },
  { key: 'competition', label: 'Competition' },
  { key: 'behavioral', label: 'Behavioral' },
]

const RATINGS: { value: Rating; label: string; short: string }[] = [
  { value: 1, label: 'Needs support', short: 'Needs\nsupport' },
  { value: 2, label: 'Developing', short: 'Developing' },
  { value: 3, label: 'Solid', short: 'Solid' },
  { value: 4, label: 'Strong', short: 'Strong' },
]

function ratingColor(v: Rating | null): string {
  if (v === null) return ''
  if (v === 1) return 'bg-status-red/10 text-status-red border-status-red/40'
  if (v === 2) return 'bg-status-orange/10 text-status-orange border-status-orange/40'
  if (v === 3) return 'bg-lime/10 text-lime border-lime/40'
  return 'bg-status-green/10 text-status-green border-status-green/40'
}

const donnaChip = buildAssessmentDonnaChip()

function openDonnaWithAssessmentPrompt() {
  window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: donnaChip.prompt } }))
}

export function QuickAssessmentPanel({ playerId }: Props) {
  const [domains, setDomains] = useState<DomainState>({
    technical: null,
    tactical: null,
    movement: null,
    competition: null,
    behavioral: null,
  })
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function setRating(domain: keyof DomainState, rating: Rating) {
    setDomains(prev => ({ ...prev, [domain]: prev[domain] === rating ? null : rating }))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await quickAssessmentAction({
        playerId,
        technical: domains.technical,
        tactical: domains.tactical,
        movement: domains.movement,
        competition: domains.competition,
        behavioral: domains.behavioral,
        note: note || null,
      })
      if (result.ok) {
        setSuccess(true)
        setDomains({ technical: null, tactical: null, movement: null, competition: null, behavioral: null })
        setNote('')
      } else {
        setError(result.error ?? 'Could not save assessment.')
      }
    })
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-status-green shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Quick rating saved</p>
            <p className="text-xs text-text-muted">Recorded as an ad-hoc assessment. No level change triggered.</p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors shrink-0"
          >
            Add another
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Quick Assessment</p>
              <p className="text-text-muted text-xs">Rate any domain — saved as ad-hoc, no level change</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openDonnaWithAssessmentPrompt}
            title={donnaChip.safetyNote}
            className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-lime transition-colors shrink-0"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            Ask DONNA
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {DOMAINS.map(d => (
          <div key={d.key} className="space-y-1">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">{d.label}</p>
            <div className="grid grid-cols-4 gap-1">
              {RATINGS.map(r => {
                const isSelected = domains[d.key] === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => setRating(d.key, r.value)}
                    className={`text-[10px] text-center px-1 py-1.5 rounded-lg border transition-colors leading-tight ${
                      isSelected
                        ? ratingColor(r.value)
                        : 'border-border text-text-muted hover:border-border hover:text-text-secondary bg-surface-raised'
                    }`}
                  >
                    {r.short}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="space-y-1 pt-1">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Note (optional)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Brief context…"
            rows={2}
            maxLength={500}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-status-red">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-lime flex items-center gap-2 text-xs px-4 py-2 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {isPending ? 'Saving…' : 'Save quick rating'}
        </button>
        <p className="text-[10px] text-text-muted">
          Recorded internally. Does not trigger level movement or notify players.
        </p>
      </CardContent>
    </Card>
  )
}

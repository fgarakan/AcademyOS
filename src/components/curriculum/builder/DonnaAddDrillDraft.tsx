'use client'

import { useState } from 'react'
import { Sparkles, X, Shield, Loader2 } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import { createCurriculumContentItemDraft } from '@/lib/actions/curriculumDraftActions'

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

const MIN_CHARS = 20
const MAX_TITLE_CHARS = 80

/** Derives a short title from free-text input.
 *  Takes the first sentence (up to MAX_TITLE_CHARS), falls back to a truncation.
 *  The full text is stored separately as description + rawInput.
 */
function deriveTitle(text: string): string {
  const trimmed = text.trim()
  const firstPeriod = trimmed.indexOf('.')
  const candidate =
    firstPeriod > 0 && firstPeriod <= MAX_TITLE_CHARS
      ? trimmed.slice(0, firstPeriod)
      : trimmed
  if (candidate.length <= MAX_TITLE_CHARS) return candidate
  return candidate.slice(0, MAX_TITLE_CHARS - 1).trimEnd() + '…'
}

export function DonnaAddDrillDraft({ level, onClose }: Props) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (text.trim().length < MIN_CHARS || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const result = await createCurriculumContentItemDraft({
      levelId: level.id,
      contentType: 'drill',
      title: deriveTitle(text),
      description: text.trim(),
      rawInput: text.trim(),
      source: 'typed',
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setError(
        result.blocked
          ? 'Only authorized academy leaders can create curriculum drafts.'
          : "I couldn't create this curriculum draft yet. Please check the required fields and try again.",
      )
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">
            Ask DONNA to draft a drill for {level.display_name}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="text-text-muted hover:text-lime transition-colors disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!submitted ? (
        <>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-text-secondary">Step 1 of 1 — Describe the drill</p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Tell DONNA what skill or pattern you want to develop. She will structure the drill
              with objective, setup, coaching cues, and success criteria. Nothing is added until
              you approve the draft.
            </p>
          </div>

          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            disabled={isSubmitting}
            placeholder={`e.g. "A return-of-serve drill for ${level.display_name} — coach feeds wide first serves, player recovers center after each return, 10 balls per set"`}
            className="w-full h-24 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-60"
          />

          {error && (
            <p className="text-[11px] text-status-red leading-relaxed">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted">
              {text.trim().length < MIN_CHARS && text.trim().length > 0
                ? `${MIN_CHARS - text.trim().length} more characters needed`
                : 'Draft only — goes to review queue, not applied automatically.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-ghost text-[12px] px-3 py-1.5 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={text.trim().length < MIN_CHARS || isSubmitting}
                className="btn-lime text-[12px] px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create draft'
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-[12px] font-semibold text-status-green">
            Draft created. It is now waiting for director review.
          </p>

          <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-orange/10 text-status-orange border border-status-orange/20">
                Draft
              </span>
              <p className="text-[11px] font-semibold text-text-primary">Drill — {level.display_name}</p>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {text.trim().slice(0, 200)}
              {text.trim().length > 200 ? '...' : ''}
            </p>
            <p className="text-[10px] text-text-muted">
              DONNA will structure this into name · objective · setup · coaching cues · success criteria
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
            <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted">
              Nothing is added to the curriculum until you approve it in the Review Queue.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[11px] text-lime hover:text-lime/80 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

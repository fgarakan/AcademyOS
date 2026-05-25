'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Sparkles, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { saveCurriculumDraftAction } from '@/lib/actions/curriculumDraft'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'

const CHANGE_TYPE_OPTIONS: { value: ChangeType; label: string; hint: string }[] = [
  {
    value: 'add_drill',
    label: 'Add a drill',
    hint: 'Propose a new practice drill for this level.',
  },
  {
    value: 'add_gate',
    label: 'Add an assessment gate',
    hint: 'Propose a new readiness gate or evidence requirement.',
  },
  {
    value: 'add_fitness',
    label: 'Add a fitness exercise',
    hint: 'Propose a new fitness or conditioning exercise.',
  },
  {
    value: 'add_mission',
    label: 'Add a player mission',
    hint: 'Propose a new player-facing mission or challenge.',
  },
  {
    value: 'rewrite_level',
    label: 'Rewrite this level',
    hint: 'Propose a broader update to level intent, goals, or structure.',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  levelId: string
  levelName: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumChangeDraftPanel({ levelId, levelName }: Props) {
  const [changeType, setChangeType] = useState<ChangeType>('add_drill')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<
    | { ok: true; draftId: string }
    | { ok: false; error: string }
    | null
  >(null)

  const selectedOption = CHANGE_TYPE_OPTIONS.find(o => o.value === changeType)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || submitting) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await saveCurriculumDraftAction({
        levelId,
        levelName,
        changeType,
        description: description.trim(),
      })
      setResult(res)
      if (res.ok) setDescription('')
    } catch {
      setResult({ ok: false, error: 'Unexpected error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setResult(null)
    setDescription('')
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#060f0d',
        border: '1px solid rgba(200,255,0,0.12)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'rgba(200,255,0,0.08)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(200,255,0,0.08)',
            border: '1px solid rgba(200,255,0,0.18)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary leading-none">
            Propose a Change
          </p>
          <p className="text-[10px] text-text-muted mt-0.5 leading-none">
            Curriculum draft · {levelName}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: 'rgba(200,255,0,0.08)',
            border: '1px solid rgba(200,255,0,0.16)',
            color: '#C8FF00',
          }}
        >
          Draft Only
        </span>
      </div>

      {/* Safety note */}
      <div
        className="flex items-start gap-2.5 px-5 py-3 border-b"
        style={{ borderColor: 'rgba(200,255,0,0.06)', background: 'rgba(200,255,0,0.02)' }}
      >
        <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-px" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="text-lime font-semibold">Draft mode — </span>
          Nothing changes in your curriculum until you review and approve this in the{' '}
          <Link href="/director/review" className="text-lime hover:underline">
            Review Queue
          </Link>
          . Official curriculum records are never mutated directly.
        </p>
      </div>

      {/* Success state */}
      {result?.ok && (
        <div className="px-5 py-5 space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5"
            style={{
              background: 'rgba(48,209,88,0.05)',
              border: '1px solid rgba(48,209,88,0.20)',
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[12px] font-semibold text-text-primary">
                Draft created — pending your review
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Your proposed change is in the Review Queue. Nothing is applied until you
                approve it there.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/director/review"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold text-black transition-opacity hover:opacity-80"
              style={{ background: '#C8FF00' }}
            >
              Go to Review Queue
              <ChevronRight className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(200,255,0,0.04)',
                border: '1px solid rgba(200,255,0,0.10)',
                color: '#a3aab4',
              }}
            >
              Propose another change
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {result && !result.ok && (
        <div className="px-5 py-4 space-y-3">
          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,59,48,0.05)',
              border: '1px solid rgba(255,59,48,0.18)',
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {result.error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-[11px] text-text-muted hover:text-lime transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Draft form — hidden after success */}
      {!result?.ok && (
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          {/* Change type selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
              Change type
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {CHANGE_TYPE_OPTIONS.map((opt) => {
                const active = changeType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChangeType(opt.value)}
                    className="flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl transition-colors"
                    style={{
                      background: active ? 'rgba(200,255,0,0.07)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(200,255,0,0.22)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: active ? '#C8FF00' : '#333' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12px] font-medium leading-tight"
                        style={{ color: active ? '#C8FF00' : '#9aa5b1' }}
                      >
                        {opt.label}
                      </p>
                      {active && (
                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                          {opt.hint}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description textarea */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-widest">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe the ${selectedOption.label.toLowerCase()} you want to propose for ${levelName}…`}
              rows={4}
              className="w-full rounded-xl px-3.5 py-3 text-[12px] text-text-primary placeholder:text-text-muted bg-transparent resize-none outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(200,255,0,0.10)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(200,255,0,0.25)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(200,255,0,0.10)'
              }}
            />
            <p className="text-[10px] text-text-muted">
              Be specific. Describe the skill, pattern, or situation you want to target.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!description.trim() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#C8FF00', color: '#0A0A0A' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {submitting ? 'Creating draft…' : 'Create Draft'}
            </button>
            <p className="text-[10px] text-text-muted">
              Sent to Review Queue · not applied automatically
            </p>
          </div>

        </form>
      )}
    </div>
  )
}

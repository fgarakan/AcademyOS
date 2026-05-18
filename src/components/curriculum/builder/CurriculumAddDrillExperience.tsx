'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Shield } from 'lucide-react'
import { CurriculumDonnaPanel } from './CurriculumDonnaPanel'

const EXAMPLE_PROMPT = 'Add a drill for forehand recovery after wide balls — player hit from deuce side, wide ball fed, recovers to center, 3 sets of 10.'

interface Props {
  submitted?: boolean
}

export function CurriculumAddDrillExperience({ submitted: initialSubmitted = false }: Props) {
  const [prompt, setPrompt]     = useState('')
  const [submitted, setSubmitted] = useState(initialSubmitted)
  const MIN_CHARS = 20

  const ready = prompt.trim().length >= MIN_CHARS

  function handleGenerate() {
    if (!ready) return
    setSubmitted(true)
  }

  return (
    <div className="animate-fade-in flex gap-6 p-6 items-start">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link
            href="/director/curriculum/map"
            className="text-text-muted hover:text-lime transition-colors mt-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="page-eyebrow">Curriculum Builder</p>
            <h1 className="page-title">Add Drill</h1>
            <p className="text-[12px] text-text-secondary mt-1">
              DONNA will create a draft — nothing is applied until you approve
            </p>
          </div>
        </div>

        {/* Safety banner */}
        <div className="rounded-xl border border-lime/10 bg-lime/[0.02] flex items-center gap-2.5 px-4 py-3">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] text-text-muted">
            <span className="text-lime font-semibold">Draft only — </span>
            DONNA creates a structured draft. Nothing is added to the curriculum until you approve it in the Review Queue.
          </p>
        </div>

        {/* Request input card */}
        {!submitted ? (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#11d9df' }} />
              <p className="text-[13px] font-semibold text-text-primary">Describe the drill you need</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Be specific about the skill, pattern, court position, and load. DONNA will structure it into name, objective, setup, coaching cues, and success criteria.
            </p>

            <div className="space-y-2">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={EXAMPLE_PROMPT}
                rows={5}
                className="w-full rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${ready ? 'rgba(17,217,223,0.30)' : 'rgba(255,255,255,0.10)'}`,
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {prompt.trim().length < MIN_CHARS && prompt.trim().length > 0
                    ? `${MIN_CHARS - prompt.trim().length} more characters to unlock`
                    : 'Draft goes to Review Queue — not applied automatically'}
                </p>
                <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>
                  {prompt.trim().length}
                </p>
              </div>
            </div>

            {/* Example prompt */}
            <div
              className="rounded-xl px-4 py-3 space-y-1.5 cursor-pointer"
              style={{ background: 'rgba(17,217,223,0.04)', border: '1px solid rgba(17,217,223,0.10)' }}
              onClick={() => setPrompt(EXAMPLE_PROMPT)}
            >
              <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(17,217,223,0.55)' }}>
                Example — click to use
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#8a9ba8' }}>
                {EXAMPLE_PROMPT}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleGenerate}
                disabled={!ready}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                style={{
                  background: ready ? 'rgba(17,217,223,0.15)' : 'rgba(17,217,223,0.06)',
                  border: `1px solid ${ready ? 'rgba(17,217,223,0.40)' : 'rgba(17,217,223,0.14)'}`,
                  color: '#11d9df',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate draft with DONNA
              </button>
              <Link
                href="/director/curriculum/map"
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        ) : (
          /* Submitted placeholder — Sprint 903 adds full draft card */
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#11d9df' }} />
              <p className="text-[13px] font-semibold text-text-primary">Draft queued for review</p>
            </div>
            <div
              className="rounded-xl px-4 py-3 space-y-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.25)' }}
                >
                  Draft
                </span>
                <p className="text-[11px] font-semibold text-text-primary">New drill</p>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">{prompt.trim()}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[10px] text-text-muted">Pending approval — nothing is added until you approve it in the Review Queue.</p>
            </div>
            <button
              onClick={() => { setPrompt(''); setSubmitted(false) }}
              className="text-[11px] transition-colors"
              style={{ color: '#11d9df' }}
            >
              Add another drill
            </button>
          </div>
        )}
      </div>

      {/* ── Right DONNA panel ────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
        <CurriculumDonnaPanel mode="add_drill" />
      </aside>
    </div>
  )
}

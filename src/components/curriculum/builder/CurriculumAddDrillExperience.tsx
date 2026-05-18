'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Shield, Zap, ChevronRight, Edit3 } from 'lucide-react'
import { CurriculumDonnaPanel } from './CurriculumDonnaPanel'

const EXAMPLE_PROMPT = 'Add a drill for forehand recovery after wide balls — player hit from deuce side, wide ball fed, recovers to center, 3 sets of 10.'

// ─── Drill detail row ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.05] last:border-b-0">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted w-32 shrink-0 mt-0.5">{label}</p>
      <p className="text-[11px] text-text-secondary leading-relaxed flex-1">{value}</p>
    </div>
  )
}

// ─── Draft card ───────────────────────────────────────────────────────────────

function DraftCard({ prompt, onReset }: { prompt: string; onReset: () => void }) {
  return (
    <div className="space-y-4">
      {/* Draft header */}
      <div className="flex items-center gap-3">
        <span
          className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.25)' }}
        >
          Draft
        </span>
        <p className="text-[11px] text-text-muted">Pending director approval · not applied to curriculum</p>
      </div>

      {/* Main draft card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        {/* Top accent */}
        <div className="h-0.5 w-full" style={{ background: 'rgba(17,217,223,0.55)' }} />

        {/* Card header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">DONNA Draft — Drill</p>
          <h2 className="text-[17px] font-bold text-text-primary">Wide Ball Recovery Builder</h2>
          <p className="text-[11px] text-text-secondary mt-1">
            New drill · Orange Ball 2
          </p>
        </div>

        {/* Detail rows */}
        <div className="px-5 py-2">
          <DetailRow
            label="Development Intent"
            value="Train the player to recover court position after a defensive wide-ball forehand, building the habit of centering before the next ball arrives."
          />
          <DetailRow
            label="Recommended Level"
            value="Orange Ball 2 and above — assumes player can sustain 6+ ball rally and has directional forehand control."
          />
          <DetailRow
            label="Pathways"
            value="Forehand Groundstroke · Court Positioning · Recovery Movement"
          />
          <DetailRow
            label="Duration"
            value="15–20 min · 3 sets of 10 balls · rest 45 s between sets"
          />
          <DetailRow
            label="Connected Skills"
            value="Wide-ball recovery footwork, split-step timing, forehand under pressure, center-court recovery line."
          />
          <DetailRow
            label="Assessment Evidence"
            value="Player successfully recovers to within 1 meter of center baseline in 7 of 10 repetitions before the next feed."
          />
        </div>

        {/* Request preview */}
        <div
          className="mx-5 mb-4 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-semibold mb-1">Your request</p>
          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{prompt.trim()}</p>
        </div>

        {/* Impact warning */}
        <div
          className="mx-5 mb-5 flex items-start gap-2 rounded-xl px-4 py-3"
          style={{ background: 'rgba(17,217,223,0.04)', border: '1px solid rgba(17,217,223,0.14)' }}
        >
          <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#11d9df' }} />
          <div>
            <p className="text-[11px] font-semibold" style={{ color: '#11d9df' }}>Before applying — review impact</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
              This drill may affect skill path coverage, player mission eligibility, and assessment gate scoring for connected levels. Preview the full impact before saving.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap items-center gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
        >
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C8FF00', color: '#0A0A0A' }}
          >
            Save Draft
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#aaa' }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Draft
          </button>
          <Link
            href="/director/curriculum/builder/impact-preview"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
            style={{ border: '1px solid rgba(17,217,223,0.25)', color: '#11d9df', background: 'rgba(17,217,223,0.05)' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Preview Impact
            <ChevronRight className="w-3 h-3" />
          </Link>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-[12px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Safety disclosure */}
      <div className="flex items-center gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-4 py-3">
        <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          <span className="text-lime font-semibold">Draft only — </span>
          This drill is not added to the curriculum until a director approves it in the Review Queue. Saving the draft does not apply any changes.
        </p>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

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
    <div className="animate-fade-in flex gap-6 p-4 sm:p-6 items-start overflow-x-hidden max-w-[1440px]">

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
          /* Draft card */
          <DraftCard prompt={prompt} onReset={() => { setPrompt(''); setSubmitted(false) }} />
        )}
      </div>

      {/* ── Right DONNA panel ────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start">
        <CurriculumDonnaPanel mode="add_drill" />
      </aside>
    </div>
  )
}

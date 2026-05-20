'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Zap, Lock } from 'lucide-react'
import { OnboardingShell } from './OnboardingShell'

const DONNA_WILL_CREATE = [
  'Academy DNA profile',
  'Curriculum spine by level',
  'First class template',
  'First fitness template',
  'Coach workflow defaults',
  'Parent/player portal settings',
]

const SETUP_MODES = [
  {
    id: 'fast-start',
    label: 'Fast Start',
    time: '5 min',
    recommended: false,
    supported: true,
    desc: 'Core identity only. DONNA fills the rest with smart defaults.',
    deferredCopy: '',
  },
  {
    id: 'guided-setup',
    label: 'Guided Setup',
    time: '15 min',
    recommended: true,
    supported: true,
    desc: 'Academy basics, coaching DNA, and parent experience.',
    deferredCopy: '',
  },
  {
    id: 'full-setup',
    label: 'Full Setup',
    time: '30-45 min',
    recommended: false,
    supported: true,
    desc: 'Every section in detail. Most personalized starting system.',
    deferredCopy: '',
  },
  {
    id: 'import-existing',
    label: 'Import Existing Academy',
    time: 'Varies',
    recommended: false,
    supported: false,
    desc: 'Already have data? Start from an import.',
    deferredCopy: 'Import setup is not yet available in this flow.',
  },
  {
    id: 'consultant-setup',
    label: 'Consultant Setup',
    time: 'Scheduled',
    recommended: false,
    supported: false,
    desc: 'Setting this up on behalf of a client academy.',
    deferredCopy: 'Consultant setup requires a scheduled onboarding session.',
  },
  {
    id: 'multi-location',
    label: 'Multi-Location Setup',
    time: '45+ min',
    recommended: false,
    supported: false,
    desc: 'Multiple courts, locations, or coaching groups.',
    deferredCopy: 'Multi-location setup is available in a future release.',
  },
]

const QUICK_CHIPS = [
  'More high-performance',
  'Better for younger kids',
  'Add fitness emphasis',
]

export function AcademyDnaLanding() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [showShell, setShowShell]       = useState(false)
  const [inputValue, setInputValue]     = useState('')
  const [donnaDraftNote, setDonnaDraftNote] = useState('')

  if (showShell) {
    return <OnboardingShell initialStep={1} initialSetupMode={selectedMode ?? ''} />
  }

  const selected  = SETUP_MODES.find(m => m.id === selectedMode)
  const canBegin  = selected?.supported === true

  function handleBegin() {
    if (canBegin) setShowShell(true)
  }

  function handleAsk() {
    const trimmed = inputValue.trim()
    if (trimmed) {
      setDonnaDraftNote(trimmed)
      setInputValue('')
    }
  }

  return (
    <div className="flex min-h-screen bg-base">

      {/* Left: hero + content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 relative">

        {/* Subtle radial lime glow behind hero — depth without brand saturation */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-[640px] h-[420px]"
          style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(200,255,0,0.06) 0%, transparent 65%)' }}
          aria-hidden="true"
        />

        <div className="max-w-2xl relative">

          {/* Top pill */}
          <div className="inline-flex items-center gap-1.5 bg-lime/8 border border-lime/20 rounded-full px-3 py-1 mb-8">
            <Sparkles className="w-3 h-3 text-lime" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-lime">
              AcademyOS &mdash; Director Onboarding
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-text-primary leading-tight mb-4">
            Let&apos;s build your academy<br />operating system.
          </h1>
          <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-xl">
            DONNA will help turn your academy philosophy, curriculum, templates, players, and coaches into a connected development system.
          </p>

          {/* DONNA will create pills */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              DONNA will create
            </p>
            <div className="flex flex-wrap gap-2">
              {DONNA_WILL_CREATE.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-[11px] text-text-secondary"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-lime/60 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Setup mode cards */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Choose a setup mode
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SETUP_MODES.map(mode => {
                const isSelected = selectedMode === mode.id
                const isDeferred = !mode.supported
                return (
                  <button
                    key={mode.id}
                    onClick={() => { if (!isDeferred) setSelectedMode(mode.id) }}
                    className={[
                      'relative text-left rounded-xl border px-4 py-3.5 transition-all',
                      isDeferred
                        ? 'opacity-50 cursor-not-allowed bg-surface border-border'
                        : isSelected
                          ? 'bg-lime/8 border-lime/50 shadow-[0_0_0_1px_rgba(200,255,0,0.15)]'
                          : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised cursor-pointer',
                    ].join(' ')}
                  >
                    {/* Top row: label + time */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={[
                        'text-sm font-semibold leading-tight',
                        isSelected && !isDeferred ? 'text-text-primary' : 'text-text-secondary',
                      ].join(' ')}>
                        {mode.label}
                      </span>
                      <span className={[
                        'text-[10px] font-mono shrink-0',
                        isSelected && !isDeferred ? 'text-lime' : 'text-text-muted',
                      ].join(' ')}>
                        {mode.time}
                      </span>
                    </div>

                    {/* Recommended badge — standalone pill */}
                    {mode.recommended && (
                      <div className="mb-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-lime/10 border border-lime/25 text-[8px] font-bold uppercase tracking-wider text-lime/80">
                          Recommended
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {isDeferred && mode.deferredCopy ? mode.deferredCopy : mode.desc}
                    </p>

                    {/* Deferred lock icon */}
                    {isDeferred && (
                      <Lock className="absolute top-3 right-3 w-3 h-3 text-text-muted/40" />
                    )}

                    {/* Selected indicator dot */}
                    {isSelected && !isDeferred && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime block" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          {selected && !selected.supported ? (
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 mb-4">
              <p className="text-[12px] text-text-muted leading-relaxed">
                {selected.deferredCopy} This mode is not available in the current setup flow.
              </p>
            </div>
          ) : (
            <button
              onClick={handleBegin}
              disabled={!canBegin}
              className={[
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                canBegin
                  ? 'bg-lime text-base hover:brightness-110 shadow-lime'
                  : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed',
              ].join(' ')}
            >
              <Zap className="w-4 h-4" />
              Begin Setup
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="mt-4 text-[11px] text-text-muted/60">
            All selections are saved as a draft. Nothing is applied until Final Activation.
          </p>

        </div>
      </div>

      {/* Right: DONNA panel */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-surface border-l border-border">

        {/* Header */}
        <div className="p-5 border-b border-border bg-lime/[0.02]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_12px_rgba(200,255,0,0.08)]">
                <span className="font-bold text-lime select-none" style={{ fontSize: '17px', lineHeight: 1 }}>D</span>
              </div>
              <span className="absolute bottom-0 right-0">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-40" />
                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-lime border-2 border-surface" />
                </span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-text-primary">DONNA</span>
                <Sparkles className="w-3 h-3 text-lime" />
              </div>
              <p className="text-[10px] text-text-muted leading-tight">
                Director of Operations &amp; Neural Network Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Conversation area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="rounded-xl bg-lime/5 border border-lime/15 p-3.5">
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Ready to build your starting system. Choose a setup mode and I&apos;ll walk you through each step &mdash; adjustments are always available after setup begins.
            </p>
          </div>

          {selectedMode && selected?.supported && (
            <div className="rounded-xl bg-surface-raised border border-border p-3">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted mb-1">
                Setup mode selected
              </p>
              <p className="text-[12px] text-text-primary font-semibold">
                {selected.label}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{selected.desc}</p>
            </div>
          )}

          {donnaDraftNote && (
            <div className="rounded-xl bg-surface-raised border border-border p-3">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted mb-1.5">
                Your preference (draft)
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {donnaDraftNote}
              </p>
              <p className="text-[10px] text-text-muted/60 mt-1.5">
                DONNA will factor this in when building your starting system.
              </p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border">

          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
            Quick adjustments
          </p>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setInputValue(chip)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-surface-raised border border-border text-text-muted hover:border-lime/30 hover:text-text-secondary hover:bg-lime/5 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text input + Ask */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
              placeholder="e.g. More high-performance focus"
              className="flex-1 min-w-0 bg-surface-raised border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-lime/40 transition-colors"
            />
            <button
              onClick={handleAsk}
              disabled={!inputValue.trim()}
              className="shrink-0 px-3 py-2 rounded-lg text-[11px] font-semibold bg-lime/10 border border-lime/20 text-lime hover:bg-lime/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ask
            </button>
          </div>

          <p className="text-[9px] text-text-muted/50 mt-2">
            Draft only &mdash; DONNA applies preferences when setup begins.
          </p>
        </div>

      </aside>

    </div>
  )
}

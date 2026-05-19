'use client'

import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const COMM_STYLES = [
  { id: 'direct-clear',         label: 'Direct + Clear',         desc: 'Simple commands, clear standards, fast corrections.',        example: '"Elbow up. Reset. Again."' },
  { id: 'encouraging-positive', label: 'Encouraging + Positive', desc: 'Confidence-building while still correcting.',                 example: '"Good effort — try bending the knees more."' },
  { id: 'question-led',         label: 'Question-Led',           desc: 'Guided discovery through smart questions.',                   example: '"What happened when you aimed cross-court?"' },
  { id: 'high-energy',          label: 'High-Energy Motivator',  desc: 'Energy, enthusiasm, and session momentum.',                   example: '"YES. That\'s it — keep that swing path!"' },
  { id: 'calm-precise',         label: 'Calm + Precise',         desc: 'Low-noise, technical, focused coaching.',                     example: '"Two-beat rhythm. Contact point forward."' },
  { id: 'standards-based',      label: 'Standards-Based',        desc: 'Clear expectations, accountability, and consistency.',         example: '"We do this every session until it\'s automatic."' },
]

const DONNA_IMPACTS = [
  { label: 'Wrap-up language',      desc: 'Coach recap tone and session notes match your voice.' },
  { label: 'Session guidance',      desc: 'On-court cues and coaching prompts use your style.' },
  { label: 'Parent summaries',      desc: 'Parent-safe progress language reflects your approach.' },
  { label: 'Player mission tone',   desc: 'Player portal framing aligns with how you communicate.' },
]

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

export function CoachCommunicationStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const primary   = draft.primaryCommunication
  const secondary = draft.secondaryCommunication

  const setPrimary = (id: string) => {
    if (secondary === id) {
      updateDraft({ primaryCommunication: id, secondaryCommunication: '' })
    } else {
      updateDraft({ primaryCommunication: id })
    }
  }

  const setSecondary = (id: string) => {
    if (primary === id) return
    updateDraft({ secondaryCommunication: secondary === id ? '' : id })
  }

  const primaryLabel   = COMM_STYLES.find(s => s.id === primary)?.label
  const secondaryLabel = COMM_STYLES.find(s => s.id === secondary)?.label

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={4}
        totalSteps={10}
        title="How do your coaches communicate?"
        subtitle="Choose your primary coaching voice. DONNA uses this to shape language across the whole system."
      />

      {/* DONNA impact strip */}
      <div className="mb-6 rounded-xl bg-surface border border-border px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2.5">
          How this shapes your system
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {DONNA_IMPACTS.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-lime/60 shrink-0 mt-1.5" />
              <div>
                <span className="text-[10px] font-semibold text-text-secondary">{item.label} </span>
                <span className="text-[10px] text-text-muted">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection state pills */}
      <div className="flex items-center gap-2 mb-4">
        <span className={[
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border',
          primary ? 'bg-lime/8 border-lime/30 text-lime' : 'bg-surface border-border text-text-muted',
        ].join(' ')}>
          <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
          Primary: {primaryLabel ?? 'Not selected'}
        </span>
        <span className={[
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border',
          secondary ? 'bg-surface-raised border-border-strong text-text-secondary' : 'bg-surface border-border text-text-muted',
        ].join(' ')}>
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted inline-block" />
          Secondary: {secondaryLabel ?? 'Optional'}
        </span>
      </div>

      {/* Style cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {COMM_STYLES.map(style => {
          const isPrimary   = primary === style.id
          const isSecondary = secondary === style.id

          return (
            <div
              key={style.id}
              className={[
                'relative rounded-xl border px-4 py-3.5 transition-all overflow-hidden',
                isPrimary || isSecondary
                  ? 'bg-lime/5 border-lime/30'
                  : 'bg-surface border-border',
              ].join(' ')}
            >
              {(isPrimary || isSecondary) && (
                <span className={[
                  'absolute top-0 left-0 right-0 h-0.5',
                  isPrimary ? 'bg-lime' : 'bg-border-strong',
                ].join(' ')} />
              )}
              {(isPrimary || isSecondary) && (
                <span className={[
                  'absolute top-2 right-2 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                  isPrimary ? 'bg-lime text-base' : 'bg-surface-raised text-text-secondary',
                ].join(' ')}>
                  {isPrimary ? 'Primary' : 'Secondary'}
                </span>
              )}
              <p className="text-sm font-semibold text-text-secondary mb-1 leading-tight pr-16">
                {style.label}
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                {style.desc}
              </p>
              <p className="text-[10px] text-text-muted/60 italic mb-3">
                {style.example}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPrimary(style.id)}
                  className={[
                    'flex-1 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide border transition-all',
                    isPrimary
                      ? 'bg-lime text-base border-lime'
                      : 'bg-surface-raised border-border text-text-muted hover:border-lime/30 hover:text-lime',
                  ].join(' ')}
                >
                  Primary
                </button>
                <button
                  onClick={() => setSecondary(style.id)}
                  disabled={isPrimary}
                  className={[
                    'flex-1 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide border transition-all',
                    isSecondary
                      ? 'bg-surface-raised border-border-strong text-text-primary'
                      : isPrimary
                        ? 'opacity-30 cursor-not-allowed bg-surface border-border text-text-muted'
                        : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text-secondary',
                  ].join(' ')}
                >
                  Secondary
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {primary && (
        <div className="mb-6 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            I'll shape coach notes, session cues, player feedback, and parent-safe language around your{' '}
            <span className="text-lime font-semibold">{primaryLabel}</span> voice.
            {secondary && (
              <span className="text-text-muted"> Secondary: {secondaryLabel}.</span>
            )}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 transition-all shadow-lime"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
        {!primary && (
          <button
            onClick={onNext}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      <p className="mt-4 text-[10px] text-text-muted/40 text-center">
        Nothing is published or sent to coaches yet.
      </p>
    </div>
  )
}

'use client'

import { Sparkles, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

const STEPS = [
  { id: 'welcome',          label: 'Welcome' },
  { id: 'academy-basics',   label: 'Academy Basics' },
  { id: 'coaching-dna',     label: 'Coaching DNA' },
  { id: 'session-defaults', label: 'Session Defaults' },
  { id: 'parent-player',    label: 'Parent + Player' },
  { id: 'review-dna',       label: 'Review DNA' },
  { id: 'activate',         label: 'Activate' },
]

const DONNA_MESSAGES: Record<number, { message: string; why: string; next: string }> = {
  0: {
    message: "I'm DONNA — Director of Operations and Neural Network Assistant. I'll learn how your academy thinks, coaches, and communicates. Then I'll prepare your starting operating system.",
    why: 'A clear setup mode helps DONNA prepare the right level of defaults for your academy.',
    next: 'Choose a setup mode to get started.',
  },
  1: {
    message: 'Tell me about your academy. This shapes your curriculum levels, templates, and coach views.',
    why: 'Academy name and structure determine how DONNA organizes your starting system.',
    next: 'Enter your academy name to begin.',
  },
  2: {
    message: 'Your coaching philosophy shapes every session template, coach cue, and player feedback DONNA prepares.',
    why: 'Coaching DNA personalizes the language, session structure, and coach prompts across your whole system.',
    next: 'Select up to 3 coaching styles.',
  },
  3: {
    message: 'Session defaults give DONNA the building blocks for your first class templates.',
    why: 'Session structure and development priorities shape what DONNA suggests for curriculum and planning.',
    next: 'Choose your session building blocks.',
  },
  4: {
    message: 'Parent and player experience settings control the tone and visibility of everything they see.',
    why: 'Communication style and visibility rules protect trust between your academy and families.',
    next: 'Select parent communication styles.',
  },
  5: {
    message: "This is your Academy DNA draft. Review it carefully — DONNA will use this to prepare your starting system.",
    why: 'Reviewing your DNA before activation ensures your starting system reflects your academy accurately.',
    next: 'Review all sections and check for any gaps.',
  },
  6: {
    message: 'Your starting system is ready to prepare. Complete these steps to launch your academy.',
    why: 'Each checklist item builds on the next. Start with curriculum, then templates, then people.',
    next: 'Start with reviewing the curriculum spine.',
  },
}

interface Props {
  currentStep: number
  draft: OnboardingDraft
}

export function OnboardingDonnaPanel({ currentStep, draft }: Props) {
  const info = DONNA_MESSAGES[currentStep] ?? DONNA_MESSAGES[0]
  const isWelcome = currentStep === 0

  const dnaLines: { label: string; value: string }[] = []
  if (draft.academyName)        dnaLines.push({ label: 'Academy',      value: draft.academyName })
  if (draft.academyModel)       dnaLines.push({ label: 'Model',        value: draft.academyModel.replace(/-/g, ' ') })
  if (draft.ageGroups.length)   dnaLines.push({ label: 'Age Groups',   value: draft.ageGroups.join(', ') })
  if (draft.coachingStyles.length) dnaLines.push({ label: 'Coaching',  value: draft.coachingStyles.join(' + ') })
  if (draft.primaryCommunication) dnaLines.push({ label: 'Coach Voice', value: draft.primaryCommunication.replace(/-/g, ' ') })
  if (draft.sessionBlocks.length) dnaLines.push({ label: 'Sessions',   value: draft.sessionBlocks.join(', ') })
  if (draft.parentStyles.length)  dnaLines.push({ label: 'Parents',    value: draft.parentStyles.join(', ') })

  return (
    <aside className="w-80 shrink-0 bg-surface border-l border-border flex flex-col overflow-y-auto">

      {/* DONNA Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-lime border-2 border-surface" />
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

      {/* DONNA Message */}
      <div className="p-4 border-b border-border">
        <div className="rounded-xl bg-lime/5 border border-lime/15 p-3.5">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {info.message}
          </p>
        </div>
      </div>

      {/* Step Progress */}
      {!isWelcome && (
        <div className="p-4 border-b border-border">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Setup Progress
          </p>
          <div className="flex flex-col gap-0.5">
            {STEPS.map((step, i) => {
              const isComplete = i < currentStep
              const isActive   = i === currentStep
              return (
                <div
                  key={step.id}
                  className={[
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all',
                    isActive ? 'bg-lime/8' : '',
                  ].join(' ')}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime shrink-0" />
                  ) : isActive ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-lime flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime block" />
                    </div>
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
                  )}
                  <span
                    className={[
                      'text-xs font-medium flex-1 leading-tight',
                      isActive ? 'text-lime' : isComplete ? 'text-text-muted' : 'text-text-muted/50',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                  {isActive && <ChevronRight className="w-3 h-3 text-lime shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live DNA Preview */}
      {dnaLines.length > 0 && (
        <div className="p-4 border-b border-border">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Academy DNA — Building
          </p>
          <div className="flex flex-col gap-2.5">
            {dnaLines.map(line => (
              <div key={line.label}>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted/60 mb-1">
                  {line.label}
                </p>
                <p className="text-[11px] text-text-secondary leading-snug capitalize">
                  {line.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why This Matters + Next Action */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1.5">
            Why This Matters
          </p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            {info.why}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1.5">
            Next Best Action
          </p>
          <p className="text-[11px] text-lime/80 leading-relaxed">
            {info.next}
          </p>
        </div>
      </div>

      {/* Bottom principle */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="rounded-lg bg-surface-raised border border-border p-3">
          <p className="text-[10px] text-text-muted/70 leading-relaxed italic">
            "DONNA proposes. Directors approve. Nothing changes until confirmed."
          </p>
        </div>
        <p className="text-[9px] text-text-muted/40 text-center mt-2">
          Draft only — not applied
        </p>
      </div>

    </aside>
  )
}

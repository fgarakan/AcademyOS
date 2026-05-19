'use client'

import { Sparkles, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

// 5 grouped milestones — each covers one or more actual steps
const MILESTONES = [
  { label: 'Academy Basics',    minStep: 1, maxStep: 1 },
  { label: 'Coaching DNA',      minStep: 2, maxStep: 3 },
  { label: 'Session + Players', minStep: 4, maxStep: 6 },
  { label: 'DNA Review',        minStep: 7, maxStep: 8 },
  { label: 'Activate',          minStep: 9, maxStep: 9 },
]

function getMilestoneStatus(milestone: typeof MILESTONES[number], currentStep: number): 'complete' | 'active' | 'upcoming' {
  if (currentStep > milestone.maxStep) return 'complete'
  if (currentStep >= milestone.minStep) return 'active'
  return 'upcoming'
}

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
    why: 'Coaching styles personalize session structure, block selection, and coach prompts across your whole system.',
    next: 'Select up to 3 coaching styles.',
  },
  3: {
    message: "Now tell me how your coaches communicate. This shapes the language DONNA uses everywhere — from session cues to parent summaries.",
    why: 'Communication voice determines coach wrap-up tone, player-facing mission language, and parent-safe phrasing.',
    next: 'Choose a primary communication voice.',
  },
  4: {
    message: "How should a normal session feel? The blocks you choose here become the default structure DONNA uses when building class templates and session plans.",
    why: 'Session structure preferences shape coach planning defaults, wrap-up question prompts, and DONNA template suggestions.',
    next: 'Select the session blocks that best describe your typical on-court time.',
  },
  5: {
    message: "What does great player development look like at your academy? Rank your top priorities — DONNA will weight missions, session prompts, and skill path labels around them.",
    why: 'Development priorities determine what players focus on in their portal, what coaches look for in sessions, and how DONNA frames progress.',
    next: 'Select and rank up to 5 development priorities.',
  },
  6: {
    message: "How should parents experience your academy? This shapes the language, detail level, and tone of everything parents see in their portal.",
    why: 'Parent communication style determines how DONNA writes progress updates, next-steps guidance, and milestone summaries for parents.',
    next: 'Choose a parent communication style. Privacy rules are always on.',
  },
  7: {
    message: "This is your Academy DNA draft. Review every section before continuing. Each row links back to the step where you can make changes.",
    why: 'Reviewing your DNA before the DONNA adjustment step ensures the starting system reflects your academy accurately.',
    next: 'Review all sections and use the Edit links to fix anything that needs changing.',
  },
  8: {
    message: "Use the quick suggestions or describe what you'd like to change. I'll apply adjustments to your draft. Nothing is saved until you activate.",
    why: 'Fine-tuning here is faster than going back through each step. All changes stay local until the Final Activation step.',
    next: 'Apply any final adjustments, then continue to activation.',
  },
  9: {
    message: "Your Academy DNA is complete. Head to the Director Dashboard to continue setup — curriculum, templates, players, and coaches are next.",
    why: 'DNA setup is the foundation. Everything else in AcademyOS builds on the identity, philosophy, and preferences you just set.',
    next: 'Go to the Director Dashboard to start the next phase of setup.',
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
  if (draft.academyName)               dnaLines.push({ label: 'Academy',      value: draft.academyName })
  if (draft.academyModel)              dnaLines.push({ label: 'Model',        value: draft.academyModel.replace(/-/g, ' ') })
  if (draft.ageGroups.length)          dnaLines.push({ label: 'Age Groups',   value: draft.ageGroups.join(', ') })
  if (draft.coachingStyles.length)     dnaLines.push({ label: 'Coaching',     value: draft.coachingStyles.join(' + ') })
  if (draft.primaryCommunication)      dnaLines.push({ label: 'Coach Voice',  value: draft.primaryCommunication.replace(/-/g, ' ') })
  if (draft.sessionBlocks.length)      dnaLines.push({ label: 'Sessions',     value: `${draft.sessionBlocks.length} blocks` })
  if (draft.developmentPriorities.length) dnaLines.push({ label: 'Dev Priorities', value: `${draft.developmentPriorities.length} ranked` })
  if (draft.parentStyles.length)       dnaLines.push({ label: 'Parents',      value: draft.parentStyles.join(', ') })

  return (
    <aside className="w-80 shrink-0 bg-surface border-l border-border flex flex-col overflow-y-auto">

      {/* DONNA Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
              <span className="font-bold text-lime select-none" style={{ fontSize: '16px', lineHeight: 1 }}>D</span>
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

      {/* DONNA Message */}
      <div className="p-4 border-b border-border">
        <div className="rounded-xl bg-lime/5 border border-lime/15 p-3.5">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {info.message}
          </p>
        </div>
      </div>

      {/* Milestone Progress */}
      {!isWelcome && (
        <div className="p-4 border-b border-border">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Setup Progress
          </p>
          <div className="flex flex-col gap-0.5">
            {MILESTONES.map((milestone) => {
              const status = getMilestoneStatus(milestone, currentStep)
              const isComplete = status === 'complete'
              const isActive   = status === 'active'
              return (
                <div
                  key={milestone.label}
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
                    {milestone.label}
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

      {/* Building pulse — shown during active setup, hidden on welcome and final step */}
      {!isWelcome && currentStep < 9 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-30" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-lime/60" />
            </span>
            <p className="text-[10px] text-text-muted/60 leading-tight">
              Building academy defaults...
            </p>
          </div>
        </div>
      )}

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

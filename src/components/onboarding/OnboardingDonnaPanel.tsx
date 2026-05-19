'use client'

import { Sparkles, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

// 7 grouped milestones — each covers one or more actual steps
const MILESTONES = [
  { label: 'Academy Basics', minStep: 1,  maxStep: 1  },
  { label: 'Coaching DNA',   minStep: 2,  maxStep: 3  },
  { label: 'Curriculum',     minStep: 4,  maxStep: 4  },
  { label: 'Templates',      minStep: 5,  maxStep: 6  },
  { label: 'People',         minStep: 7,  maxStep: 8  },
  { label: 'Review',         minStep: 9,  maxStep: 10 },
  { label: 'Activate',       minStep: 11, maxStep: 11 },
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
    message: "The curriculum starting point tells me which level structure to use and how your sessions are built. I'll use this to suggest your first class and fitness templates.",
    why: 'Curriculum structure determines level gates, skill paths, and session planning across all groups.',
    next: 'Choose a curriculum starting point.',
  },
  5: {
    message: "Let's draft your first class template using the real AcademyOS block model. I'll suggest blocks based on your coaching DNA.",
    why: 'A first class template gives coaches a structured starting plan. Warm-Up and Reflection are always included.',
    next: 'Select class blocks to build your template draft.',
  },
  6: {
    message: "Now let's draft a first fitness template. I'll auto-populate exercises for each block you select.",
    why: 'Fitness templates give coaches a structured physical preparation plan tied directly to tennis development.',
    next: 'Select fitness blocks to auto-populate exercises.',
  },
  7: {
    message: 'Upload or fast-fill your player roster. This is a draft only — no player data is saved until activation.',
    why: 'Starting with players lets DONNA begin organizing groups, levels, and curriculum assignments.',
    next: 'Upload a CSV or fast-fill player names.',
  },
  8: {
    message: 'Add your coaching staff locally. Coach roles and level assignments shape what DONNA prepares for each group.',
    why: 'Coach assignments determine session visibility, wrap-up flows, and parent communication routing.',
    next: 'Add coach names and assign roles.',
  },
  9: {
    message: "Preview how each portal will look — director, coach, player, and parent. Configure parent and player experience here.",
    why: 'Seeing the portals before activation helps you confirm the experience matches your academy culture.',
    next: 'Review each portal view and set parent/player preferences.',
  },
  10: {
    message: "This is your Academy DNA draft. Review it carefully — DONNA will use this to prepare your starting system.",
    why: 'Reviewing your DNA before activation ensures your starting system reflects your academy accurately.',
    next: 'Review all sections and check for any gaps.',
  },
  11: {
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
  if (draft.curriculumStartingPoint) dnaLines.push({ label: 'Curriculum', value: draft.curriculumStartingPoint.replace(/-/g, ' ') })
  if (draft.sessionBlocks.length) dnaLines.push({ label: 'Sessions',   value: `${draft.sessionBlocks.length} blocks` })
  if (draft.classTemplateDraft.selectedBlocks.length) dnaLines.push({ label: 'Class Template', value: `${draft.classTemplateDraft.selectedBlocks.length} blocks drafted` })
  if (draft.fitnessTemplateDraft.selectedBlocks.length) dnaLines.push({ label: 'Fitness Template', value: `${draft.fitnessTemplateDraft.selectedBlocks.length} blocks drafted` })
  if (draft.parentStyles.length)  dnaLines.push({ label: 'Parents',    value: draft.parentStyles.join(', ') })

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
      {!isWelcome && currentStep < 11 && (
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

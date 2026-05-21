'use client'

// Sprint 590 — End-of-Session Recap UI Polish V1
// Enhanced with assessment note integration, observation review awareness,
// and DONNA classification notes in the review stage.

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Mic, ClipboardList, Users, Activity, Star, AlertTriangle, MessageSquare, FileText, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

// ── Questions ─────────────────────────────────────────────────────────────────

const RECAP_QUESTIONS = [
  {
    id: 'attendance',
    label: 'Attendance',
    question: 'Did everyone attend, or were there attendance changes?',
    placeholder: 'e.g. Everyone was here. / Sarah was absent. Jeremy showed up unexpectedly.',
    hint: 'Note any absences, late arrivals, or unplanned additions.',
  },
  {
    id: 'session_plan',
    label: 'Session Plan',
    question: 'Did the session follow the plan? What changed?',
    placeholder: 'e.g. We ran the full plan. / Skipped block 3 due to time. / Added extra footwork drills.',
    hint: 'Describe any deviations from the planned session blocks.',
  },
  {
    id: 'standouts',
    label: 'Positive Standouts',
    question: 'Who stood out positively today?',
    placeholder: 'e.g. Marcus showed great improvement on his backhand. Aisha led the warm-up really well.',
    hint: 'Recognise players who made progress or showed great attitude.',
  },
  {
    id: 'attention',
    label: 'Needs Attention',
    question: 'Who needs attention or follow-up next time?',
    placeholder: 'e.g. Tyler struggled with serve technique — needs extra reps next session.',
    hint: 'Note players who need targeted coaching focus.',
  },
  {
    id: 'assessment',
    label: 'Assessment Notes',
    question: 'Any assessment observations worth noting from today?',
    placeholder: 'e.g. Marcus is tracking at around a 6 for skill. Emma\'s competition readiness is improving — closer to a 5.',
    hint: 'Note any assessment observations. DONNA will classify these for the director.',
  },
  {
    id: 'safety',
    label: 'Readiness Check',
    question: 'Any readiness concerns from today?',
    placeholder: 'e.g. No concerns. / Emma seemed low energy — worth monitoring.',
    hint: 'Flag any concern about player readiness for the next session. Describe what you observed.',
  },
  {
    id: 'followup',
    label: 'Follow-Up Needed',
    question: 'Any parent or director follow-up needed?',
    placeholder: 'e.g. Nothing needed. / Tyler\'s parents asked about schedule changes. / Director should know about the attendance situation.',
    hint: 'Note anything that needs to escalate to the director or be communicated to parents.',
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type Answers = Record<string, string>
type Stage = 'questions' | 'review' | 'submitted'

// ── Copy text builder ─────────────────────────────────────────────────────────

function buildCopyText(answers: Answers): string {
  const lines = [
    'SESSION RECAP DRAFT',
    '─────────────────────',
    answers.attendance ? `ATTENDANCE: ${answers.attendance}` : null,
    answers.session_plan ? `SESSION PLAN: ${answers.session_plan}` : null,
    answers.standouts ? `POSITIVE STANDOUTS: ${answers.standouts}` : null,
    answers.attention ? `NEEDS ATTENTION: ${answers.attention}` : null,
    answers.safety ? `SAFETY / READINESS: ${answers.safety}` : null,
    answers.followup ? `FOLLOW-UP NEEDED: ${answers.followup}` : null,
    '─────────────────────',
    'Draft only — director review required before any official update.',
  ]
  return lines.filter(Boolean).join('\n')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-lime rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-text-muted shrink-0">
        {current + 1} / {total}
      </span>
    </div>
  )
}

function ReviewAnswerCard({ q, answer }: { q: typeof RECAP_QUESTIONS[number]; answer: string }) {
  return (
    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
      <p className="text-[9px] uppercase tracking-widest text-text-muted">{q.label}</p>
      <p className="text-[11px] text-text-secondary font-medium">{q.question}</p>
      {answer.trim() ? (
        <p className="text-sm text-text-primary leading-relaxed">{answer}</p>
      ) : (
        <p className="text-sm text-text-muted italic">No answer provided</p>
      )}
    </div>
  )
}

// ── Structured draft preview section ──────────────────────────────────────────

interface DraftSection {
  icon: React.ElementType
  label: string
  pipelineLabel: string
  color: string
  content: string | null
  placeholder: string
}

function buildDraftSections(answers: Answers): DraftSection[] {
  return [
    {
      icon: Users,
      label: 'Attendance Note',
      pipelineLabel: 'Attendance Exception Draft',
      color: 'text-status-orange',
      content: answers.attendance?.trim() ? `Attendance update: ${answers.attendance.trim()}` : null,
      placeholder: 'No attendance answer provided.',
    },
    {
      icon: Activity,
      label: 'Session Plan',
      pipelineLabel: 'Session Actual Draft',
      color: 'text-status-blue',
      content: answers.session_plan?.trim() ? `Session delivery: ${answers.session_plan.trim()}` : null,
      placeholder: 'No session plan answer provided.',
    },
    {
      icon: Star,
      label: 'Player Observations',
      pipelineLabel: 'Player Observation Draft',
      color: 'text-lime',
      content: [
        answers.standouts?.trim() ? `Positive: ${answers.standouts.trim()}` : null,
        answers.attention?.trim() ? `Needs attention: ${answers.attention.trim()}` : null,
      ].filter(Boolean).join('\n') || null,
      placeholder: 'No player observation answers provided.',
    },
    {
      icon: ClipboardCheck,
      label: 'Assessment Observations',
      pipelineLabel: 'Assessment Draft',
      color: 'text-lime',
      content: answers.assessment?.trim() ? `Assessment notes: ${answers.assessment.trim()}` : null,
      placeholder: 'No assessment observations noted.',
    },
    {
      icon: AlertTriangle,
      label: 'Readiness Check',
      pipelineLabel: 'Director Review Item',
      color: 'text-status-red',
      content: answers.safety?.trim() || null,
      placeholder: 'No readiness concerns noted.',
    },
    {
      icon: MessageSquare,
      label: 'Parent / Director Follow-Up',
      pipelineLabel: 'Parent-Safe Draft Placeholder',
      color: 'text-text-muted',
      content: answers.followup?.trim() ? `Follow-up: ${answers.followup.trim()}` : null,
      placeholder: 'No follow-up items noted.',
    },
  ]
}

function DraftSectionCard({ section }: { section: DraftSection }) {
  const Icon = section.icon
  return (
    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${section.color}`} />
          <p className="text-[11px] font-semibold text-text-primary">{section.label}</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider text-text-muted bg-surface border border-border">
          → {section.pipelineLabel}
        </span>
      </div>
      {section.content ? (
        <p className="text-sm text-text-secondary leading-relaxed pl-5 whitespace-pre-line">{section.content}</p>
      ) : (
        <p className="text-sm text-text-muted italic pl-5">{section.placeholder}</p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachRecapPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [stage, setStage] = useState<Stage>('questions')
  const [copied, setCopied] = useState(false)

  const currentQ = RECAP_QUESTIONS[step]
  const totalSteps = RECAP_QUESTIONS.length
  const isLast = step === totalSteps - 1

  function setAnswer(value: string) {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
  }

  function handleNext() {
    if (isLast) {
      setStage('review')
    } else {
      setStep(s => s + 1)
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleSubmit() {
    // Sprint 390: shell only — no backend write.
    // Sprint 391 will connect this to the draft pipeline.
    setStage('submitted')
  }

  // ── Submitted ──
  if (stage === 'submitted') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center gap-4 py-12">
          <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-status-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Recap Submitted</h1>
            <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto">
              Your recap has been saved. Your director will see it in the Review Queue.
            </p>
          </div>
          <p className="text-[10px] text-text-muted bg-surface-raised border border-border rounded-lg px-4 py-2.5 max-w-xs">
            Nothing is official yet — attendance, player notes, and parent updates all require director approval.
          </p>
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20 max-w-xs">
            <span className="text-lime text-[11px] mt-0.5 shrink-0">✦</span>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              <span className="text-lime font-semibold">DONNA</span> will analyze your recap when the director reviews it and surface any action items.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/coach/sessions" className="btn-lime text-sm">
              Back to Sessions
            </Link>
            <button
              onClick={() => { setStep(0); setAnswers({}); setStage('questions') }}
              className="btn-ghost text-sm"
            >
              Start New Recap
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Review ──
  if (stage === 'review') {
    const draftSections = buildDraftSections(answers)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setStage('questions'); setStep(totalSteps - 1) }}
            className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Structured Draft Preview</p>
            <h1 className="text-lg font-bold text-text-primary">Session Recap</h1>
          </div>
          <FileText className="w-5 h-5 text-text-muted ml-auto shrink-0" />
        </div>

        <div className="px-4 py-3 rounded-xl bg-surface border border-border">
          <p className="text-[10px] text-text-muted leading-relaxed">
            Your answers are organised as draft sections below. Nothing is official until the director approves — attendance, observations, and parent updates all require review.
          </p>
        </div>

        {/* DONNA context note */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/20">
          <span className="text-lime text-[11px] mt-0.5 shrink-0">✦</span>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            <span className="text-lime font-semibold">DONNA</span> will analyze this recap when your director reviews it — generating observation drafts, classifying assessment notes, flagging follow-up items, and surfacing any concerns for their attention.
          </p>
        </div>

        {/* Assessment note awareness */}
        {answers.assessment?.trim() && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface border border-lime/15">
            <ClipboardCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-secondary leading-relaxed">
              <span className="text-lime font-semibold">Assessment notes detected.</span>{' '}
              DONNA will attempt to classify your assessment observations by domain (skill, competition, physical capability, mental performance) when the director reviews this recap.
              Use the <span className="font-medium">Quick Capture → Assessment</span> flow on the home screen for more structured assessment capture.
            </p>
          </div>
        )}

        {/* Player observation draft awareness */}
        {(answers.standouts?.trim() || answers.attention?.trim()) && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface border border-border">
            <Star className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted leading-relaxed">
              Player observations from Standouts and Needs Attention will be extracted as observation drafts for director review.
              <span className="text-text-secondary"> Nothing reaches players or parents without director approval.</span>
            </p>
          </div>
        )}

        {/* Structured draft sections */}
        <div className="space-y-3">
          {draftSections.map(s => (
            <DraftSectionCard key={s.label} section={s} />
          ))}
        </div>

        {/* Copy to clipboard */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(buildCopyText(answers)).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            })
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-text-secondary hover:border-lime/30 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy recap summary'}
        </button>

        {/* Raw answers toggle */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-[11px] text-text-muted hover:text-text-secondary transition-colors list-none">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            View raw answers
          </summary>
          <div className="mt-3 space-y-2">
            {RECAP_QUESTIONS.map(q => (
              <ReviewAnswerCard key={q.id} q={q} answer={answers[q.id] ?? ''} />
            ))}
          </div>
        </details>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full btn-lime text-sm py-3"
          >
            Mark as Ready for Review
          </button>
          <p className="text-[10px] text-text-muted text-center mt-2">
            Once submitted, your director will see this in the Review Queue.
          </p>
        </div>
      </div>
    )
  }

  // ── Questions ──
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/coach/sessions" className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Session Recap</p>
          <h1 className="text-lg font-bold text-text-primary truncate">{currentQ.label}</h1>
        </div>
        <ClipboardList className="w-5 h-5 text-text-muted shrink-0" />
      </div>

      {/* Progress */}
      <ProgressBar current={step} total={totalSteps} />

      {/* Question card */}
      <div className="space-y-4">
        <div className="px-5 py-5 rounded-xl bg-surface-raised border border-border space-y-4">
          <p className="text-base font-semibold text-text-primary leading-snug">
            {currentQ.question}
          </p>
          <p className="text-[11px] text-text-muted">{currentQ.hint}</p>
          <textarea
            value={answers[currentQ.id] ?? ''}
            onChange={e => setAnswer(e.target.value)}
            placeholder={currentQ.placeholder}
            rows={4}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
          />
        </div>

        {/* Voice placeholder */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
          <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center">
            <Mic className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Voice input</p>
            <p className="text-[10px] text-text-muted">Tap to dictate — coming soon</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-text-secondary hover:border-lime/30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 btn-lime text-sm py-2.5"
        >
          {isLast ? 'Review Recap' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5">
        {RECAP_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === step ? 'bg-lime' : i < step ? 'bg-lime/40' : 'bg-surface-raised'
            }`}
          />
        ))}
      </div>

    </div>
  )
}

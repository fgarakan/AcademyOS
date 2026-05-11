'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react'
import { INTERVIEW_STEPS, type InterviewField, type InterviewStep } from './interviewSteps'
import { updateDirectorInterviewAction } from './updateDirectorInterviewAction'

// ─── Browser Speech API types ─────────────────────────────────────────────────
// Declared locally so we do not depend on DOM lib configuration.
interface SpeechRecognitionAlt { transcript: string }
interface SpeechRecognitionResult { [index: number]: SpeechRecognitionAlt }
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent { results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent { error: string }
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  const Ctor = w['SpeechRecognition'] ?? w['webkitSpeechRecognition']
  return typeof Ctor === 'function' ? (Ctor as new () => SpeechRecognitionInstance) : null
}

function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function speakText(text: string, rate = 0.92, pitch = 1) {
  if (!isTtsSupported()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.speak(u)
}

function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

// ─── Acknowledgment phrases ───────────────────────────────────────────────────
const ACK_CHIPS = [
  "Got it — that's clear.",
  "That makes sense.",
  "Perfect. I'll keep that in mind.",
  "Good. That gives me a clear direction.",
  "That helps.",
  "Sounds right.",
]
const ACK_CUSTOM = [
  "I like that. Let me organize it.",
  "That's helpful context.",
  "Got it — that's exactly what I needed.",
  "Okay, I completely understand.",
  "That sounds like a strong foundation.",
]
const ACK_BOTH = [
  "Perfect. I've got a clear picture.",
  "That makes sense. I'll put it together.",
  "Got it. I'll weave those into your setup.",
]
const ACK_EMPTY = [
  "No problem. We can keep this simple.",
  "Totally fine — pick whichever feels closest for now.",
  "No worries. I'll note this as open and we can come back.",
]

let ackIndex = 0
function getAcknowledgment(chips: string[], custom: string): string {
  const pool =
    chips.length > 0 && custom.trim()
      ? ACK_BOTH
      : chips.length > 0
      ? ACK_CHIPS
      : custom.trim()
      ? ACK_CUSTOM
      : ACK_EMPTY
  const phrase = pool[ackIndex % pool.length]
  ackIndex++
  return phrase
}

function buildInterpretation(step: InterviewStep, chips: string[], custom: string): string {
  const trimmed = custom.trim()
  if (chips.length > 0 && trimmed) {
    return `You selected "${chips.join(', ')}" and added: "${trimmed}"`
  }
  if (chips.length > 0) {
    return `You selected: ${chips.join(', ')}.`
  }
  if (trimmed) {
    return `You said: "${trimmed}"`
  }
  return `No answer for "${step.stepLabel}" yet — you can come back or pick the closest option.`
}

// ─── State types ──────────────────────────────────────────────────────────────
type Phase = 'answering' | 'confirming'
type AnswerState = { chips: string[]; custom: string }
type Answers = Record<InterviewField, AnswerState>

function buildValue(chips: string[], custom: string): string {
  const trimmed = custom.trim()
  if (chips.length === 0) return trimmed
  if (!trimmed) return chips.join('; ')
  return `${chips.join('; ')}; ${trimmed}`
}

function initAnswer(initial: string): AnswerState {
  return { chips: [], custom: initial }
}

// ─── Button classes ───────────────────────────────────────────────────────────
const BTN_LIME =
  'flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_GHOST =
  'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

// ─── Mic button (inline, browser-native) ─────────────────────────────────────
interface MicButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

function MicButton({ onTranscript, disabled = false }: MicButtonProps) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const recogRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null)
  }, [])

  const stop = useCallback(() => {
    recogRef.current?.stop()
    recogRef.current = null
    setListening(false)
  }, [])

  useEffect(() => {
    return () => { recogRef.current?.abort(); recogRef.current = null }
  }, [])

  function start() {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return
    setMicError(null)
    const r = new Ctor()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-US'
    r.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript?.trim()
      if (t) onTranscript(t)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setMicError('Microphone access denied. Allow mic access in your browser, or type instead.')
      } else if (e.error !== 'no-speech') {
        setMicError('Voice capture stopped. Type instead or try again.')
      }
      stop()
    }
    r.onend = () => { recogRef.current = null; setListening(false) }
    recogRef.current = r
    try { r.start(); setListening(true) } catch { setMicError('Could not start voice capture. Type instead.') }
  }

  if (supported === null) return null
  if (!supported) {
    return (
      <p className="text-[10px] text-text-muted flex items-center gap-1">
        <MicOff className="w-3 h-3 opacity-40" />
        Voice input not supported in this browser — type your answer instead.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        title={listening ? 'Stop recording' : 'Speak your answer'}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-40 ${
          listening
            ? 'border-status-red/40 bg-status-red/10 text-status-red animate-pulse'
            : 'border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary'
        }`}
      >
        {listening ? (
          <><Square className="w-3 h-3 fill-current" />Stop</>
        ) : (
          <><Mic className="w-3 h-3 text-lime" />Speak answer</>
        )}
      </button>
      {listening && <p className="text-[9px] text-status-red/80">Listening… tap Stop when done.</p>}
      {!listening && <p className="text-[9px] text-text-muted">Transcript fills in below — edit before continuing.</p>}
      {micError && <p className="text-[10px] text-status-orange">{micError}</p>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialPhilosophy: string
  initialPlayerFocus: string
  initialDevelopmentPriorities: string
  initialCompetitionApproach: string
  initialParentCommunicationStyle: string
  initialCoachOperatingStyle: string
  initialNinetyDaySuccess: string
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DirectorInterviewAssistant({
  initialPhilosophy,
  initialPlayerFocus,
  initialDevelopmentPriorities,
  initialCompetitionApproach,
  initialParentCommunicationStyle,
  initialCoachOperatingStyle,
  initialNinetyDaySuccess,
}: Props) {
  // step: -1 = welcome, 0–6 = questions, 7 = review, 8 = saved
  const [step, setStep] = useState(-1)
  const [phase, setPhase] = useState<Phase>('answering')
  const [currentAck, setCurrentAck] = useState('')
  const [simpler, setSimpler] = useState(false)

  const [answers, setAnswers] = useState<Answers>({
    philosophy: initAnswer(initialPhilosophy),
    player_focus: initAnswer(initialPlayerFocus),
    development_priorities: initAnswer(initialDevelopmentPriorities),
    competition_approach: initAnswer(initialCompetitionApproach),
    parent_communication_style: initAnswer(initialParentCommunicationStyle),
    coach_operating_style: initAnswer(initialCoachOperatingStyle),
    ninety_day_success: initAnswer(initialNinetyDaySuccess),
  })

  // Voice output
  const [autoRead, setAutoRead] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // Detect TTS support after hydration
  useEffect(() => {
    setTtsSupported(isTtsSupported())
  }, [])

  // Auto-read when step changes or autoRead is toggled on
  useEffect(() => {
    if (!autoRead || step < 0 || step >= INTERVIEW_STEPS.length || phase !== 'answering') {
      cancelSpeech()
      return
    }
    const s = INTERVIEW_STEPS[step]
    speakText(s.spokenQuestion)
  }, [autoRead, step, phase])

  // Cancel speech on unmount
  useEffect(() => {
    return () => cancelSpeech()
  }, [])

  // ── Answer helpers ──────────────────────────────────────────────────────────
  function toggleChip(field: InterviewField, chip: string) {
    setAnswers(prev => {
      const current = prev[field].chips
      const next = current.includes(chip)
        ? current.filter(c => c !== chip)
        : [...current, chip]
      return { ...prev, [field]: { ...prev[field], chips: next } }
    })
  }

  function setCustom(field: InterviewField, value: string) {
    setAnswers(prev => ({ ...prev, [field]: { ...prev[field], custom: value } }))
  }

  function appendTranscript(field: InterviewField, transcript: string) {
    setAnswers(prev => {
      const base = prev[field].custom.trimEnd()
      return { ...prev, [field]: { ...prev[field], custom: base ? `${base} ${transcript}` : transcript } }
    })
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function confirmAnswer() {
    cancelSpeech()
    const s = INTERVIEW_STEPS[step]
    setCurrentAck(getAcknowledgment(answers[s.field].chips, answers[s.field].custom))
    setPhase('confirming')
    setSimpler(false)
  }

  function acceptAnswer() {
    cancelSpeech()
    if (step === INTERVIEW_STEPS.length - 1) {
      setStep(7)
    } else {
      setStep(prev => prev + 1)
    }
    setPhase('answering')
  }

  function editAnswer() {
    setPhase('answering')
  }

  function skipAnswer() {
    cancelSpeech()
    // Clear current answer and advance
    const s = INTERVIEW_STEPS[step]
    setAnswers(prev => ({ ...prev, [s.field]: { chips: [], custom: '' } }))
    if (step === INTERVIEW_STEPS.length - 1) {
      setStep(7)
    } else {
      setStep(prev => prev + 1)
    }
    setPhase('answering')
  }

  function askSimpler() {
    const s = INTERVIEW_STEPS[step]
    setAnswers(prev => ({ ...prev, [s.field]: { chips: [], custom: '' } }))
    setSimpler(true)
    setPhase('answering')
  }

  function goBack() {
    cancelSpeech()
    setPhase('answering')
    setSimpler(false)
    if (step === 0) {
      setStep(-1)
    } else {
      setStep(prev => prev - 1)
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateDirectorInterviewAction(
        buildValue(answers.philosophy.chips, answers.philosophy.custom),
        buildValue(answers.player_focus.chips, answers.player_focus.custom),
        buildValue(answers.development_priorities.chips, answers.development_priorities.custom),
        buildValue(answers.competition_approach.chips, answers.competition_approach.custom),
        buildValue(answers.parent_communication_style.chips, answers.parent_communication_style.custom),
        buildValue(answers.coach_operating_style.chips, answers.coach_operating_style.custom),
        buildValue(answers.ninety_day_success.chips, answers.ninety_day_success.custom),
      )
      if (result.ok) {
        setStep(8)
      } else {
        setSaveError(result.error ?? 'Failed to save. Please try again.')
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WELCOME
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === -1) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-lime" />
            <span className="label-xs">Director Interview</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">
            Let&apos;s set up your academy together.
          </h2>
          <p className="text-sm text-text-secondary pt-1">
            I&apos;ll ask one simple question at a time. You can answer casually — pick a chip, speak, or type.
            I&apos;ll organize your answers and you&apos;ll review everything before anything is saved.
          </p>
        </div>

        <div className="space-y-2.5 py-1">
          {[
            'Takes 3–5 minutes. Short answers are fine.',
            'Pick chips that match your style, or add your own note.',
            'You can speak your answer or type — your choice.',
            'Nothing saves until you review and confirm.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-mono text-lime">{i + 1}</span>
              </span>
              <p className="text-sm text-text-secondary">{item}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep(0)}
          className={`w-full ${BTN_LIME}`}
        >
          Start
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REVIEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 7) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label-xs mb-1">Final review</p>
          <h2 className="text-lg font-semibold text-text-primary">Here&apos;s your academy setup draft.</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Everything looks right? Save to lock it in. Or tap any section to go back and edit.
          </p>
        </div>

        <div className="space-y-2">
          {INTERVIEW_STEPS.map((s, idx) => {
            const value = buildValue(answers[s.field].chips, answers[s.field].custom)
            return (
              <div key={s.field} className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="label-xs mb-0.5">{s.stepLabel}</p>
                    {value ? (
                      <p className="text-sm text-text-secondary leading-relaxed">{value}</p>
                    ) : (
                      <p className="text-xs text-text-muted italic">Not answered.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep(idx); setPhase('answering') }}
                    className="shrink-0 text-[10px] text-text-muted hover:text-lime transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {saveError && (
          <p className="text-sm text-status-red px-1">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => { setStep(INTERVIEW_STEPS.length - 1); setPhase('answering') }}
            disabled={isPending}
            className={`flex-1 ${BTN_GHOST}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={`flex-1 ${BTN_LIME}`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Saving…' : 'Save Academy Setup'}
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SUCCESS
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 8) {
    return (
      <div className="py-4 space-y-6">
        <div className="flex flex-col items-center text-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-status-green/10 border border-status-green/25 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-status-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Interview saved.</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
              Academy OS now has the context it needs to shape your setup, curriculum, and workflows.
            </p>
          </div>
        </div>
        <Link href="/director/onboarding" className={`w-full ${BTN_LIME}`}>
          Back to Onboarding
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // QUESTION STEPS
  // ══════════════════════════════════════════════════════════════════════════════
  const currentStep = INTERVIEW_STEPS[step]
  const { field } = currentStep
  const currentAnswer = answers[field]
  const isLast = step === INTERVIEW_STEPS.length - 1
  const progressPct = ((step + 1) / INTERVIEW_STEPS.length) * 100

  // ── CONFIRMING PHASE ────────────────────────────────────────────────────────
  if (phase === 'confirming') {
    const interpretation = buildInterpretation(currentStep, currentAnswer.chips, currentAnswer.custom)

    return (
      <div className="space-y-6">
        {/* Progress */}
        <ProgressBar step={step} total={INTERVIEW_STEPS.length} label={currentStep.stepLabel} pct={progressPct} />

        {/* Acknowledgment bubble */}
        <div className="px-4 py-4 rounded-xl bg-surface-raised border border-lime/20 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-medium text-lime">Here&apos;s what I heard…</p>
          </div>
          <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wide">{currentAck}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{interpretation}</p>
        </div>

        {/* Helper message for simpler */}
        <p className="text-xs text-text-muted px-1">
          Want to adjust that, or are we good to keep going?
        </p>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={acceptAnswer}
            className={`w-full ${BTN_LIME}`}
          >
            {isLast ? 'Looks right — show me the review' : 'Looks right — next question'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={editAnswer}
              className={`flex-1 ${BTN_GHOST}`}
            >
              Edit answer
            </button>
            <button
              type="button"
              onClick={skipAnswer}
              className={`flex-1 ${BTN_GHOST}`}
            >
              Skip for now
            </button>
          </div>

          <button
            type="button"
            onClick={askSimpler}
            className="w-full text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors py-1"
          >
            Ask me simpler
          </button>
        </div>
      </div>
    )
  }

  // ── ANSWERING PHASE ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <ProgressBar step={step} total={INTERVIEW_STEPS.length} label={currentStep.stepLabel} pct={progressPct} />

      {/* Voice controls row */}
      {ttsSupported && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => speakText(currentStep.spokenQuestion)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-lime" />
            Play question
          </button>
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={autoRead}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setAutoRead(v => !v)}
              onClick={() => setAutoRead(v => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${autoRead ? 'bg-lime/70' : 'bg-border'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRead ? 'translate-x-4' : ''}`}
              />
            </div>
            Auto-read questions
          </label>
        </div>
      )}

      {/* Question */}
      <div className="space-y-1">
        {simpler && (
          <p className="text-[10px] text-lime px-1 pb-1">
            No problem — pick whichever feels closest, or add a quick note in your own words.
          </p>
        )}
        <h2 className="text-base font-semibold text-text-primary leading-snug">
          {currentStep.question}
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">{currentStep.whyItMatters}</p>
      </div>

      {/* Helper chips */}
      <div className="space-y-2">
        <p className="text-[10px] text-text-muted">Pick one or more, or add your own below:</p>
        <div className="flex flex-wrap gap-2">
          {currentStep.chips.map(chip => {
            const selected = currentAnswer.chips.includes(chip)
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(field, chip)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  selected
                    ? 'bg-lime/10 border-lime/40 text-lime'
                    : 'bg-surface-raised border-border text-text-secondary hover:border-lime/30 hover:text-text-primary'
                }`}
              >
                {chip}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mic input */}
      <MicButton
        onTranscript={(text) => appendTranscript(field, text)}
        disabled={false}
      />

      {/* Custom text area */}
      <div className="space-y-1.5">
        <label className="label-xs">Your own words (optional)</label>
        <textarea
          value={currentAnswer.custom}
          onChange={e => setCustom(field, e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="Add a note in your own words…"
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        {currentAnswer.custom.length > 0 && (
          <p className="text-[10px] text-text-muted text-right">{currentAnswer.custom.length} / 400</p>
        )}
      </div>

      {/* Helper options */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={() => setSimpler(true)}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Ask me simpler
        </button>
        <span className="text-text-muted text-[10px]">·</span>
        <button
          type="button"
          onClick={() => {
            // Pre-select first chip as closest option
            if (currentStep.chips.length > 0 && !currentAnswer.chips.includes(currentStep.chips[0])) {
              toggleChip(field, currentStep.chips[0])
            }
          }}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Use closest option
        </button>
        <span className="text-text-muted text-[10px]">·</span>
        <button
          type="button"
          onClick={skipAnswer}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          I&apos;m not sure — skip
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={goBack}
          className={`flex-1 ${BTN_GHOST}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Welcome' : 'Back'}
        </button>
        <button
          type="button"
          onClick={confirmAnswer}
          className={`flex-1 ${BTN_LIME}`}
        >
          {isLast ? 'Review my answers' : 'Use this answer'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Shared progress bar sub-component ───────────────────────────────────────
function ProgressBar({
  step,
  total,
  label,
  pct,
}: {
  step: number
  total: number
  label: string
  pct: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-text-muted">{step + 1} / {total}</p>
        <p className="label-xs">{label}</p>
      </div>
      <div className="w-full h-0.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-lime transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react'
import { INTERVIEW_STEPS, getStepQuestion, type InterviewField, type InterviewStep } from './interviewSteps'
import { updateDirectorInterviewAction } from './updateDirectorInterviewAction'
import { useRealtimeInterviewVoice, type RealtimeDebugState } from './useRealtimeInterviewVoice'

// ─── Browser Speech API types (SpeechRecognition not in lib.dom) ──────────────
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

// ─── Audio status ─────────────────────────────────────────────────────────────
type AudioStatus = 'idle' | 'loading' | 'speaking' | 'ready' | 'error'

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

// ─── Preflight phase ─────────────────────────────────────────────────────────
type PreflightPhase =
  | 'idle'
  | 'name_speaking'              // assistant speaking the name question
  | 'awaiting_name_answer'       // waiting for director's name (voice or typed)
  | 'name_captured'              // name transcript received, pending confirmation
  | 'intro_speaking'             // assistant speaking OPENING_SCRIPT
  | 'awaiting_preflight_answer'
  | 'preflight_captured'
  | 'answering_preflight_question'
  | 'ready_for_question_one'

// ─── Active voice prompt model ────────────────────────────────────────────────
// Every question spoken by the assistant must have a matching visible prompt.
// Before calling speakWithTracking for any question, set activeVoicePrompt.
type ActiveVoicePrompt = {
  id: string
  kind: 'intro' | 'preflight' | 'interview'
  questionText: string
  helperText?: string
}

// The specific answerable question at the end of OPENING_SCRIPT
const PREFLIGHT_VOICE_PROMPT: ActiveVoicePrompt = {
  id: 'preflight',
  kind: 'preflight',
  questionText: 'Before we begin, do you have any questions, or should we jump into the first one?',
  helperText: 'Say "No questions" or "Let\'s start" to begin, or ask anything about the setup.',
}

function buildInterviewPrompt(stepIndex: number): ActiveVoicePrompt {
  const s = INTERVIEW_STEPS[stepIndex]
  return {
    id: s.id,
    kind: 'interview',
    questionText: getStepQuestion(stepIndex),
    helperText: s.helperCopy,
  }
}

// Name capture prompt — shown and spoken before the OPENING_SCRIPT
const NAME_VOICE_PROMPT: ActiveVoicePrompt = {
  id: 'director_name',
  kind: 'preflight',
  questionText: 'Before we begin, what name should I call you?',
  helperText: 'This helps the assistant address you correctly during setup.',
}


const OPENING_SCRIPT =
  "Welcome. I'll guide you through a short setup interview for your academy. " +
  "The goal is to understand how you teach, how you group players, what your coaches need, " +
  "and how you want Academy OS to support your day-to-day workflow. " +
  "This helps the system organize your curriculum, class templates, sessions, and coach guidance " +
  "around the way your academy actually works. " +
  "Nothing saves until you review it. " +
  "Before we begin, do you have any questions, or should we jump into the first one?"

function classifyPreflightAnswer(text: string): 'no_questions' | 'has_question' | 'unclear' {
  const lower = text.toLowerCase().trim()
  const noMultiword = [
    'no questions', "i'm good", 'im good', "let's start", 'lets start',
    'go ahead', 'jump in', 'ready to start', 'sounds good',
    "let's begin", 'lets begin', "let's go", 'lets go',
    "i'm ready", 'im ready', "yes let's", 'yes lets', 'no thanks',
  ]
  for (const s of noMultiword) {
    if (lower.includes(s)) return 'no_questions'
  }
  if (lower === 'no' || lower === 'nope' || lower === 'nah' ||
      lower.startsWith('no ') || lower.startsWith('no,')) {
    return 'no_questions'
  }
  if (lower.includes('?') || lower.includes('question') ||
      lower.startsWith('what ') || lower.startsWith('how ') ||
      lower.startsWith('who ') || lower.startsWith('can i ') ||
      lower.startsWith('why ') || lower.includes('what is') ||
      lower.includes('what are') || lower.includes('how does') ||
      lower.includes('who sees') || lower.includes('change it') ||
      lower.includes('change later') || lower.includes('what happens') ||
      lower.includes('is this for')) {
    return 'has_question'
  }
  if (lower === 'yes' || lower === 'yeah' || lower === 'yep' || lower === 'yup' ||
      lower.startsWith('yes ') || lower.startsWith('yeah ')) {
    return 'has_question'
  }
  return 'unclear'
}

function buildPreflightFAQResponse(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('change') || lower.includes('edit') || lower.includes('update') ||
      lower.includes('later') || lower.includes('permanent')) {
    return "Yes. Nothing here is permanent. You can review and adjust your setup over time."
  }
  if (lower.includes('who see') || lower.includes('visible') || lower.includes('parent') ||
      lower.includes('player') || lower.includes('private')) {
    return "This is director-facing setup information. It helps shape the operating system — it's not automatically sent to parents or players."
  }
  if (lower.includes('what happen') || lower.includes('answers') || lower.includes('saved') ||
      lower.includes('stored') || lower.includes('data')) {
    return "Your answers help configure how Academy OS organizes priorities, templates, curriculum context, and coach guidance."
  }
  if (lower.includes('how long') || lower.includes('how many') || lower.includes('minutes') ||
      lower.includes('time')) {
    return "About three minutes — seven short questions, one at a time."
  }
  return "This helps Academy OS understand your academy's teaching style so it can organize your curriculum, templates, and coach workflows around the way your academy actually works."
}

// ─── Button classes ───────────────────────────────────────────────────────────
const BTN_LIME =
  'flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_GHOST =
  'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

// ─── AssistantDot + status label ─────────────────────────────────────────────
function AssistantDot({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
        speaking
          ? 'bg-lime animate-pulse'
          : listening
          ? 'bg-status-blue animate-pulse'
          : 'bg-lime/40'
      }`}
    />
  )
}

function AssistantStatus({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  if (speaking) return <span className="text-[10px] text-lime">Speaking…</span>
  if (listening) return <span className="text-[10px] text-status-blue">Listening…</span>
  return <span className="text-[10px] text-text-muted">Ready</span>
}

// ─── Dev-only Realtime debug panel ───────────────────────────────────────────
function RealtimeDebugPanel({
  status,
  debug,
  welcomeSent,
  firstRequested,
  speechStarted,
  finalTranscriptReceived,
  userTranscriptLen,
  assistantTranscriptLen,
  voiceReadiness,
  startClickedAt,
  welcomeResponseError,
  currentEncodedStep,
  activePromptKind,
  activePromptId,
  activePromptQuestion,
  transcriptPendingConfirmation,
  directorDisplayName,
}: {
  status: string
  debug: RealtimeDebugState
  welcomeSent?: boolean
  firstRequested?: boolean
  speechStarted?: boolean
  finalTranscriptReceived?: boolean
  userTranscriptLen?: number
  assistantTranscriptLen?: number
  voiceReadiness?: string
  startClickedAt?: number | null
  welcomeResponseError?: string | null
  currentEncodedStep?: number
  activePromptKind?: string
  activePromptId?: string
  activePromptQuestion?: string
  transcriptPendingConfirmation?: boolean
  directorDisplayName?: string
}) {
  const stepQ = currentEncodedStep != null && currentEncodedStep >= 0 && currentEncodedStep < INTERVIEW_STEPS.length
    ? getStepQuestion(currentEncodedStep)
    : null
  const preparedAtStr = debug.preparedAt
    ? new Date(debug.preparedAt).toLocaleTimeString()
    : 'not yet'
  const startClickedAtStr = startClickedAt
    ? new Date(startClickedAt).toLocaleTimeString()
    : 'not yet'

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-[10px] text-text-muted hover:text-text-secondary font-mono select-none">
        ▶ Voice Debug ({status})
      </summary>
      <div className="mt-2 p-3 rounded-lg bg-surface border border-border space-y-0.5 text-[9px] font-mono leading-relaxed">
        <p>status: <span className="text-lime">{status}</span></p>
        <p>voice readiness: <span className={voiceReadiness === 'ready' ? 'text-status-green' : voiceReadiness === 'error' ? 'text-status-red' : 'text-text-muted'}>{voiceReadiness ?? 'idle'}</span></p>
        <p>token preloaded: <span className={debug.tokenPreloaded ? 'text-status-green' : 'text-text-muted'}>{String(debug.tokenPreloaded)}</span></p>
        <p>prepared at: <span className="text-text-muted">{preparedAtStr}</span></p>
        <p>start clicked at: <span className="text-text-muted">{startClickedAtStr}</span></p>
        <p>welcome sent: <span className={welcomeSent ? 'text-status-green' : 'text-text-muted'}>{String(welcomeSent ?? false)}</span></p>
        <p>first response requested: <span className={firstRequested ? 'text-status-green' : 'text-text-muted'}>{String(firstRequested ?? false)}</span></p>
        {welcomeResponseError && (
          <p className="text-status-orange break-words">welcome error: {welcomeResponseError}</p>
        )}
        <p className="border-t border-border pt-0.5 mt-0.5">env configured: <span className={
          debug.envConfigured === true ? 'text-status-green'
          : debug.envConfigured === false ? 'text-status-red'
          : 'text-text-muted'
        }>{String(debug.envConfigured ?? '?')}</span></p>
        <p>token fetched: {String(debug.tokenFetched)}</p>
        <p>mic granted: {String(debug.micGranted ?? '?')}</p>
        <p>pc state: {debug.peerConnectionState}</p>
        <p>ICE state: {debug.iceConnectionState}</p>
        <p>data channel: {debug.dataChannelState}</p>
        <p>remote track: {String(debug.remoteTrackReceived)}</p>
        <p>audio playing: {String(debug.audioPlaying)}</p>
        <p>audio blocked: {String(debug.audioBlocked)}</p>
        <p>last event: {debug.lastEventType || 'none'}</p>
        <p>last transcript event: {debug.lastTranscriptEvent || 'none'}</p>
        <p>speech started: <span className={speechStarted ? 'text-status-blue' : 'text-text-muted'}>{String(speechStarted ?? false)}</span></p>
        <p>final transcript: <span className={finalTranscriptReceived ? 'text-status-green' : 'text-text-muted'}>{String(finalTranscriptReceived ?? false)}</span></p>
        <p>transcript pending confirm: <span className={transcriptPendingConfirmation ? 'text-status-orange' : 'text-text-muted'}>{String(transcriptPendingConfirmation ?? false)}</span></p>
        <p>user transcript len: {userTranscriptLen ?? 0}</p>
        <p>assistant transcript len: {assistantTranscriptLen ?? 0}</p>
        {(activePromptKind || activePromptId) && (
          <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
            <p>active prompt kind: <span className="text-lime">{activePromptKind ?? 'none'}</span></p>
            <p>active prompt id: <span className="text-text-secondary">{activePromptId ?? 'none'}</span></p>
            {activePromptQuestion && (
              <p className="text-text-muted break-words">active prompt Q: {activePromptQuestion}</p>
            )}
          </div>
        )}
        {directorDisplayName !== undefined && (
          <p className="border-t border-border pt-0.5 mt-0.5">
            director name: <span className={directorDisplayName ? 'text-lime' : 'text-text-muted'}>{directorDisplayName || '(not captured)'}</span>
          </p>
        )}
        {currentEncodedStep != null && currentEncodedStep >= 0 && (
          <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
            <p>current encoded step: <span className="text-lime">{currentEncodedStep}</span></p>
            {stepQ && <p className="text-text-muted break-words">encoded Q: {stepQ}</p>}
            <p>ui == voice question: <span className="text-status-green">true</span></p>
          </div>
        )}
        {debug.lastError && (
          <p className="text-status-red break-words">error: {debug.lastError}</p>
        )}
        {(debug.openaiStatus != null || debug.openaiError || debug.endpointAttempted || debug.openaiResponseKeys || debug.clientSecretShape) && (
          <div className="mt-1 pt-1 border-t border-border space-y-0.5">
            {debug.endpointAttempted && (
              <p className="text-text-muted break-all">endpoint: {debug.endpointAttempted}</p>
            )}
            {debug.openaiStatus != null && (
              <p>openai status: <span className="text-status-orange">{debug.openaiStatus}</span></p>
            )}
            {debug.openaiModel && (
              <p>model: {debug.openaiModel}</p>
            )}
            {debug.openaiVoice && (
              <p>voice: {debug.openaiVoice}</p>
            )}
            {debug.openaiResponseKeys && (
              <p className="text-text-muted break-words">response keys: {debug.openaiResponseKeys}</p>
            )}
            {debug.clientSecretShape && (
              <p className="text-text-muted">client_secret shape: {debug.clientSecretShape}</p>
            )}
            {debug.openaiError && (
              <p className="text-status-orange break-words">openai error: {debug.openaiError}</p>
            )}
          </div>
        )}
        {/* Encoded interview question list */}
        <details className="mt-1">
          <summary className="cursor-pointer text-[9px] text-text-muted hover:text-text-secondary select-none">
            ▶ Encoded interview questions ({INTERVIEW_STEPS.length})
          </summary>
          <div className="mt-1 space-y-0.5 pl-2">
            {INTERVIEW_STEPS.map((s, i) => (
              <p key={s.id} className={`text-[9px] break-words ${i === currentEncodedStep ? 'text-lime' : 'text-text-muted'}`}>
                {i + 1}. {s.spokenQuestion}
              </p>
            ))}
          </div>
        </details>
      </div>
    </details>
  )
}

// ─── Active Prompt Card — mirrors every spoken question on screen ─────────────
// Rule: no question is invisible. If the AI asks it, this card shows it.
function ActivePromptCard({ prompt }: { prompt: ActiveVoicePrompt }) {
  return (
    <div className="px-4 py-3.5 rounded-xl bg-surface border border-lime/30 space-y-1.5">
      <p className="label-xs text-lime/80">Assistant is asking</p>
      <p className="text-base font-semibold text-text-primary leading-snug">{prompt.questionText}</p>
      {prompt.helperText && (
        <p className="text-xs text-text-secondary leading-relaxed">{prompt.helperText}</p>
      )}
    </div>
  )
}

// ─── Mic button (browser-native STT fallback) ─────────────────────────────────
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

  const [voiceMode, setVoiceMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle')
  const [audioWarning, setAudioWarning] = useState<string | null>(null)

  // Preflight phase — guided intro before Q1 begins
  const [preflightPhase, setPreflightPhase] = useState<PreflightPhase>('idle')
  const [preflightAssistantText, setPreflightAssistantText] = useState('')
  const [preflightTypedInput, setPreflightTypedInput] = useState('')

  // Active voice prompt — the specific question the director is expected to answer.
  // Set before every speakWithTracking call for a question prompt.
  // Rule: AI must never ask a question that is not visible on screen.
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<ActiveVoicePrompt | null>(null)

  // Director display name — captured at the start of the interview (local only, no DB save)
  const [directorDisplayName, setDirectorDisplayName] = useState('')
  const [directorNameTypedInput, setDirectorNameTypedInput] = useState('')

  // Text shown in the assistant bubble — what the app told the assistant to say.
  // Used as fallback when Realtime transcript events don't arrive.
  const [lastSpokenAssistantText, setLastSpokenAssistantText] = useState('')

  // Dev-only debug fields for welcome sequence
  const [debugWelcomeSent, setDebugWelcomeSent] = useState(false)
  const [debugFirstRequested, setDebugFirstRequested] = useState(false)
  const startClickedAtRef = useRef<number | null>(null)
  const [welcomeResponseError, setWelcomeResponseError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── OpenAI Realtime voice hook ───────────────────────────────────────────────
  const realtimeVoice = useRealtimeInterviewVoice()
  const isRealtimeConnected = realtimeVoice.status === 'connected'

  // Silently warm the voice token on page load (and again after any disconnect).
  // Browser does not require user gesture for HTTP — mic is still deferred to click.
  useEffect(() => {
    if (step === -1 && realtimeVoice.voiceReadiness === 'idle') {
      void realtimeVoice.prepare()
    }
  }, [step, realtimeVoice.voiceReadiness, realtimeVoice.prepare])

  // ── Browser TTS refs (speechSynthesis fallback) ──────────────────────────────
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevents the auto-speak useEffect from re-speaking step 0 when the welcome
  // already included the first question.
  const hasSentWelcomeRef = useRef(false)
  // Pending ack phrase: set by acceptAnswer() in voice mode.
  // Consumed by the auto-speak useEffect to prepend ack + next question.
  const pendingAckRef = useRef<string | null>(null)
  // Tracks the last applied user transcript to prevent double-application.
  const lastAppliedTranscriptRef = useRef('')
  // Counts preflight Q&A exchanges — forces forward to Q1 after 2.
  const preflightExchangeCountRef = useRef(0)

  // Detect TTS support after hydration
  useEffect(() => {
    setTtsSupported(isTtsSupported())
  }, [])

  // Load and cache a preferred English voice. Chrome loads voices asynchronously.
  useEffect(() => {
    if (!isTtsSupported()) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return
      selectedVoiceRef.current =
        voices.find(v => v.lang === 'en-US') ??
        voices.find(v => v.lang.startsWith('en')) ??
        voices[0] ??
        null
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])

  // ── Wire Realtime user transcript to answer field ────────────────────────────
  // When the director's spoken answer is transcribed, auto-populate the custom
  // textarea. Director can then edit before confirming. Does not auto-advance.
  useEffect(() => {
    const t = realtimeVoice.finalUserTranscript
    if (!t || t === lastAppliedTranscriptRef.current) return
    if (step < 0 || step >= INTERVIEW_STEPS.length) return
    lastAppliedTranscriptRef.current = t
    const stepField = INTERVIEW_STEPS[step].field
    appendTranscript(stepField, t)
  // appendTranscript is defined below but is stable (uses setAnswers which is stable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeVoice.finalUserTranscript, step])

  // ── Browser TTS helper (fallback when Realtime is not connected) ─────────────
  const speakAssistant = useCallback((
    text: string,
    opts?: { onEnd?: () => void; onError?: () => void; timeoutMs?: number }
  ) => {
    if (!isTtsSupported()) {
      setAudioWarning("Speech synthesis is not available in this browser.")
      setAudioStatus('error')
      opts?.onError?.()
      opts?.onEnd?.()
      return
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.92
    u.pitch = 1
    u.volume = 1
    if (selectedVoiceRef.current) u.voice = selectedVoiceRef.current

    u.onstart = () => {
      setIsSpeaking(true)
      setAudioStatus('speaking')
      setAudioWarning(null)
    }

    u.onend = () => {
      utteranceRef.current = null
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      setIsSpeaking(false)
      setAudioStatus('ready')
      opts?.onEnd?.()
    }

    u.onerror = (e) => {
      utteranceRef.current = null
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      setIsSpeaking(false)
      const isCancellation = (e.error as string) === 'interrupted' || (e.error as string) === 'canceled'
      if (!isCancellation) {
        setAudioStatus('error')
        setAudioWarning("Audio didn't play. Check browser sound or switch to typed mode.")
        opts?.onError?.()
        opts?.onEnd?.()
      } else {
        setAudioStatus('ready')
      }
    }

    utteranceRef.current = u

    const timeoutMs = opts?.timeoutMs ?? Math.max(4000, text.length * 70 + 1500)
    advanceTimerRef.current = setTimeout(() => {
      if (utteranceRef.current === u) {
        utteranceRef.current = null
        setIsSpeaking(false)
        setAudioStatus('ready')
        opts?.onEnd?.()
      }
    }, timeoutMs)

    window.speechSynthesis.speak(u)
  }, [])

  const stopAssistantSpeech = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    utteranceRef.current = null
    if (isTtsSupported()) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // ── Realtime speak wrapper — tracks what was spoken for the assistant bubble ──
  // The app always knows what text it told the AI to say, so the bubble shows
  // it immediately even if Realtime transcript events are delayed or absent.
  const speakWithTracking = useCallback((text: string, onDone?: () => void) => {
    setLastSpokenAssistantText(text)
    realtimeVoice.speak(text, onDone)
  }, [realtimeVoice.speak])

  // ── speakPrompt — always sets visible prompt card before speaking ─────────────
  // Rule: every question the AI speaks must also appear on screen as an active prompt.
  // Use this for all question prompts. speakWithTracking alone is for non-question speech.
  const speakPrompt = useCallback((
    prompt: ActiveVoicePrompt,
    textToSpeak: string,
    onDone?: () => void,
  ) => {
    setActiveVoicePrompt(prompt)
    setLastSpokenAssistantText(textToSpeak)
    realtimeVoice.speak(textToSpeak, onDone)
  }, [realtimeVoice.speak])

  // ── Preflight response handler ───────────────────────────────────────────────
  // Classifies the director's response to the preflight question, answers briefly
  // using controlled FAQ copy, and advances to Q1 when ready.
  // App owns all branching — AI never decides when to move forward.
  const handlePreflightResponse = useCallback((rawText: string) => {
    const text = rawText.trim()
    const q1 = INTERVIEW_STEPS[0].spokenQuestion
    const classification = classifyPreflightAnswer(text)

    // Clear transcript so the next voice capture is fresh
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''

    const startQ1 = (intro: string) => {
      const fullText = `${intro} First question: ${q1}`
      hasSentWelcomeRef.current = true
      setDebugFirstRequested(true)
      setPreflightPhase('ready_for_question_one')
      setPreflightAssistantText(fullText)
      // Set active prompt to Q1 — the question is now visible before/while it is spoken
      setActiveVoicePrompt(buildInterviewPrompt(0))
      setIsSpeaking(true)
      setAudioStatus('speaking')
      if (isRealtimeConnected) {
        speakWithTracking(fullText, () => {
          setIsSpeaking(false)
          setAudioStatus('ready')
          setStep(0)
          setPreflightPhase('idle')
        })
      } else {
        setLastSpokenAssistantText(fullText)
        speakAssistant(fullText, {
          onEnd: () => {
            setIsSpeaking(false)
            setAudioStatus('ready')
            setStep(0)
            setPreflightPhase('idle')
          },
          onError: () => {
            setAudioWarning("Audio didn't play. Check browser sound.")
            setStep(0)
            setPreflightPhase('idle')
          },
        })
      }
    }

    if (classification === 'no_questions') {
      startQ1("Perfect. Let's start.")
      return
    }

    if (preflightExchangeCountRef.current >= 2) {
      startQ1("Let's start with the first question. You can always come back and adjust this later.")
      return
    }

    // Director has a question — answer from controlled FAQ copy, then ask again
    let responseText: string
    if (classification === 'has_question') {
      const faqAnswer = buildPreflightFAQResponse(text)
      responseText = `${faqAnswer} Ready to start with the first one?`
    } else {
      responseText = "No problem. I'll keep it simple — should we start with the first question?"
    }

    preflightExchangeCountRef.current += 1
    setPreflightPhase('awaiting_preflight_answer')
    setPreflightAssistantText(responseText)
    setPreflightTypedInput('')
    // FAQ answer spoken — the next question is still the preflight question
    setActiveVoicePrompt({
      ...PREFLIGHT_VOICE_PROMPT,
      questionText: 'Ready to start with the first one?',
      helperText: 'Say "Yes" or "Let\'s go" to begin, or ask another question.',
    })
    setIsSpeaking(true)
    setAudioStatus('speaking')
    if (isRealtimeConnected) {
      speakWithTracking(responseText, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
      })
    } else {
      setLastSpokenAssistantText(responseText)
      speakAssistant(responseText, {
        onEnd: () => { setIsSpeaking(false); setAudioStatus('ready') },
        onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
      })
    }
  }, [isRealtimeConnected, speakWithTracking, speakAssistant, realtimeVoice.clearUserTranscript])

  // ── Name capture handlers ─────────────────────────────────────────────────────
  // confirmName: director approved their name — store it and continue to preflight.
  // App owns the name value — the AI never sets or validates it.
  function confirmName(name: string) {
    const trimmed = name.trim()
    setDirectorDisplayName(trimmed)
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
    setDirectorNameTypedInput('')
    if (isRealtimeConnected && voiceMode) {
      const namePrefix = trimmed ? `Thanks, ${trimmed}. ` : ''
      const textToSpeak = namePrefix + OPENING_SCRIPT
      setPreflightPhase('intro_speaking')
      setPreflightAssistantText(textToSpeak)
      setIsSpeaking(true)
      setAudioStatus('speaking')
      // Active prompt shows the answerable question, not the full welcome text
      speakPrompt(PREFLIGHT_VOICE_PROMPT, textToSpeak, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
        setPreflightPhase('awaiting_preflight_answer')
      })
    } else {
      // Typed mode — skip audio, go directly to preflight question
      setActiveVoicePrompt(PREFLIGHT_VOICE_PROMPT)
      setPreflightAssistantText(OPENING_SCRIPT)
      setPreflightPhase('awaiting_preflight_answer')
    }
  }

  // skipName: director skipped — proceed to preflight without a name.
  function skipName() {
    setDirectorDisplayName('')
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
    setDirectorNameTypedInput('')
    if (isRealtimeConnected && voiceMode) {
      setPreflightPhase('intro_speaking')
      setPreflightAssistantText(OPENING_SCRIPT)
      setIsSpeaking(true)
      setAudioStatus('speaking')
      speakPrompt(PREFLIGHT_VOICE_PROMPT, OPENING_SCRIPT, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
        setPreflightPhase('awaiting_preflight_answer')
      })
    } else {
      setActiveVoicePrompt(PREFLIGHT_VOICE_PROMPT)
      setPreflightAssistantText(OPENING_SCRIPT)
      setPreflightPhase('awaiting_preflight_answer')
    }
  }

  // ── Wire Realtime user transcript to name editable field ─────────────────────
  // Fires when step === -1 and the director speaks their name.
  // Does NOT auto-confirm — shows transcript in editable field for director review.
  useEffect(() => {
    const t = realtimeVoice.finalUserTranscript
    if (!t || t === lastAppliedTranscriptRef.current) return
    if (preflightPhase !== 'awaiting_name_answer') return
    lastAppliedTranscriptRef.current = t
    setDirectorNameTypedInput(t)
    setPreflightPhase('name_captured')
  }, [realtimeVoice.finalUserTranscript, preflightPhase])

  // ── Wire Realtime user transcript to preflight editable field ────────────────
  // Fires when step === -1 and the director's voice response to the preflight
  // question is transcribed. Does NOT immediately classify/process — puts the
  // transcript into the editable field so the director can review and confirm.
  useEffect(() => {
    const t = realtimeVoice.finalUserTranscript
    if (!t || t === lastAppliedTranscriptRef.current) return
    if (preflightPhase !== 'awaiting_preflight_answer') return
    lastAppliedTranscriptRef.current = t
    // Show transcript in editable field — director must confirm before processing
    setPreflightTypedInput(t)
    setPreflightPhase('preflight_captured')
  }, [realtimeVoice.finalUserTranscript, preflightPhase])

  // ── Auto-speak question when voice mode is on and an answering step is active.
  // Realtime path: speakWithTracking (tracks text + fires response.create).
  // Browser TTS path: setLastSpokenAssistantText + speakAssistant.
  // pendingAckRef: set by acceptAnswer() to combine ack + next question.
  useEffect(() => {
    if (!voiceMode || step < 0 || step >= INTERVIEW_STEPS.length || phase !== 'answering') return

    // Step 0 was already spoken as part of the combined welcome + first question.
    if (step === 0 && hasSentWelcomeRef.current) {
      hasSentWelcomeRef.current = false
      setIsSpeaking(false)
      setAudioStatus('ready')
      return
    }

    // Consume any pending ack from acceptAnswer() — "Got it. Next question: ..."
    const ack = pendingAckRef.current
    pendingAckRef.current = null
    const baseQ = getStepQuestion(step)
    const textToSpeak = ack ? `${ack} Next question: ${baseQ}` : baseQ

    // Set active prompt before speaking — question must be visible before voice starts
    setActiveVoicePrompt(buildInterviewPrompt(step))
    setIsSpeaking(true)
    setAudioStatus('speaking')

    if (isRealtimeConnected) {
      speakWithTracking(textToSpeak, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
      })
      return () => { setIsSpeaking(false) }
    }

    setLastSpokenAssistantText(textToSpeak)
    speakAssistant(textToSpeak, {
      onEnd: () => setIsSpeaking(false),
      onError: () => {
        setAudioWarning("Audio didn't play. Check browser sound or use typed mode.")
      },
    })
    return () => { stopAssistantSpeech() }
  }, [voiceMode, step, phase, isRealtimeConnected, speakWithTracking, speakAssistant, stopAssistantSpeech])

  // Cancel speech on unmount
  useEffect(() => {
    return () => stopAssistantSpeech()
  }, [stopAssistantSpeech])

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

  // ── Voice controls ──────────────────────────────────────────────────────────
  function repeatQuestion() {
    stopAssistantSpeech()
    setIsSpeaking(true)
    setAudioStatus('speaking')
    const text = getStepQuestion(step)
    setActiveVoicePrompt(buildInterviewPrompt(step))
    if (isRealtimeConnected) {
      speakWithTracking(text, () => setIsSpeaking(false))
    } else {
      setLastSpokenAssistantText(text)
      speakAssistant(text, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
      })
    }
  }

  function pauseAssistant() {
    if (!isRealtimeConnected) stopAssistantSpeech()
    setIsSpeaking(false)
    setAudioStatus('ready')
  }

  function switchToTypeMode() {
    stopAssistantSpeech()
    if (isRealtimeConnected) realtimeVoice.disconnect()
    hasSentWelcomeRef.current = false
    pendingAckRef.current = null
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
    setActiveVoicePrompt(null)
  }

  // Switches to typed mode during preflight — disconnects Realtime, keeps preflight
  // screen so the director can still type their answer before Q1 begins.
  function switchToTypeModePreflight() {
    stopAssistantSpeech()
    if (isRealtimeConnected) realtimeVoice.disconnect()
    hasSentWelcomeRef.current = false
    pendingAckRef.current = null
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
    // If we were in a name phase, stay in name awaiting (typed) so prompt remains visible
    if (
      preflightPhase === 'name_speaking' ||
      preflightPhase === 'awaiting_name_answer' ||
      preflightPhase === 'name_captured'
    ) {
      setPreflightPhase('awaiting_name_answer')
      setActiveVoicePrompt(NAME_VOICE_PROMPT) // keep prompt card visible in typed mode
    } else {
      setPreflightPhase('awaiting_preflight_answer')
      setActiveVoicePrompt(null)
    }
  }

  // ── Welcome actions ─────────────────────────────────────────────────────────
  async function startVoiceInterview() {
    startClickedAtRef.current = Date.now()
    hasSentWelcomeRef.current = false
    pendingAckRef.current = null
    lastAppliedTranscriptRef.current = ''
    preflightExchangeCountRef.current = 0
    setDebugWelcomeSent(false)
    setDebugFirstRequested(false)
    setWelcomeResponseError(null)
    setPreflightPhase('idle')
    setPreflightAssistantText('')
    setPreflightTypedInput('')
    setDirectorDisplayName('')
    setDirectorNameTypedInput('')
    setVoiceMode(true)
    setAudioStatus('loading')
    setAudioWarning(null)

    const ok = await realtimeVoice.connect()

    if (!ok) {
      setVoiceMode(false)
      setAudioStatus('error')
      const errMsg =
        realtimeVoice.status === 'mic-denied'
          ? 'Microphone access denied. You can still complete the interview by typing.'
          : 'Voice is not available right now. You can still complete the interview by typing.'
      setAudioWarning(errMsg)
      return
    }

    // Connected — ask for the director's name first (before OPENING_SCRIPT).
    // speakPrompt sets activeVoicePrompt BEFORE speaking — name question is visible on screen.
    setPreflightPhase('name_speaking')
    setPreflightAssistantText(NAME_VOICE_PROMPT.questionText)
    setDebugWelcomeSent(true)
    setIsSpeaking(true)
    setAudioStatus('speaking')
    speakPrompt(NAME_VOICE_PROMPT, NAME_VOICE_PROMPT.questionText, () => {
      setIsSpeaking(false)
      setAudioStatus('ready')
      setPreflightPhase('awaiting_name_answer')
    })
  }

  function startTypeInterview() {
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
    setStep(0)
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function confirmAnswer() {
    stopAssistantSpeech()
    const s = INTERVIEW_STEPS[step]
    const a = answers[s.field]
    const ack = getAcknowledgment(a.chips, a.custom)
    setCurrentAck(ack)
    setPhase('confirming')
    setSimpler(false)
    if (voiceMode) {
      const wc = a.custom.trim().split(/\s+/).filter(Boolean).length
      const short = a.chips.length === 0 && wc < 6
      const text = short ? s.followUpPrompt : ack
      setIsSpeaking(true)
      setAudioStatus('speaking')
      if (isRealtimeConnected) {
        speakWithTracking(text, () => setIsSpeaking(false))
      } else {
        setLastSpokenAssistantText(text)
        speakAssistant(text, {
          onEnd: () => setIsSpeaking(false),
          onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
        })
      }
    }
  }

  // acceptAnswer: director confirmed — move to next step.
  // In voice mode, queues an ack so the auto-speak useEffect combines it with
  // the next question: "Got it. Next question: ..."
  // App controls the next question — always uses INTERVIEW_STEPS[nextStep].spokenQuestion.
  function acceptAnswer() {
    stopAssistantSpeech()
    // Queue ack for voice mode (consumed in auto-speak useEffect)
    if (voiceMode && step < INTERVIEW_STEPS.length - 1) {
      const a = answers[INTERVIEW_STEPS[step].field]
      pendingAckRef.current = getAcknowledgment(a.chips, a.custom)
    }
    // Clear transcript state for the next step
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''

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
    stopAssistantSpeech()
    const s = INTERVIEW_STEPS[step]
    setAnswers(prev => ({ ...prev, [s.field]: { chips: [], custom: '' } }))
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
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
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
    setSimpler(true)
    setPhase('answering')
    if (voiceMode) {
      setIsSpeaking(true)
      setAudioStatus('speaking')
      if (isRealtimeConnected) {
        speakWithTracking(s.followUpPrompt, () => setIsSpeaking(false))
      } else {
        setLastSpokenAssistantText(s.followUpPrompt)
        speakAssistant(s.followUpPrompt, {
          onEnd: () => setIsSpeaking(false),
          onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
        })
      }
    }
  }

  function goBack() {
    stopAssistantSpeech()
    setPhase('answering')
    setSimpler(false)
    if (step === 0) {
      if (isRealtimeConnected) realtimeVoice.disconnect()
      hasSentWelcomeRef.current = false
      pendingAckRef.current = null
      setVoiceMode(false)
      setAudioStatus('idle')
      setAudioWarning(null)
      setLastSpokenAssistantText('')
      setPreflightPhase('idle')
      setPreflightAssistantText('')
      setPreflightTypedInput('')
      setActiveVoicePrompt(null)
      setDirectorDisplayName('')
      setDirectorNameTypedInput('')
      preflightExchangeCountRef.current = 0
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

  // ── Shared debug panel props ─────────────────────────────────────────────────
  const debugPanelProps = {
    status: realtimeVoice.status,
    debug: realtimeVoice.debug,
    welcomeSent: debugWelcomeSent,
    firstRequested: debugFirstRequested,
    speechStarted: realtimeVoice.speechStarted,
    finalTranscriptReceived: realtimeVoice.finalTranscriptReceived,
    userTranscriptLen: realtimeVoice.finalUserTranscript.length,
    assistantTranscriptLen: lastSpokenAssistantText.length,
    voiceReadiness: realtimeVoice.voiceReadiness,
    startClickedAt: startClickedAtRef.current,
    welcomeResponseError,
    currentEncodedStep: step >= 0 && step < INTERVIEW_STEPS.length ? step : undefined,
    activePromptKind: activeVoicePrompt?.kind,
    activePromptId: activeVoicePrompt?.id,
    activePromptQuestion: activeVoicePrompt?.questionText,
    transcriptPendingConfirmation: preflightPhase === 'preflight_captured' || preflightPhase === 'name_captured',
    directorDisplayName,
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WELCOME — PREFLIGHT ACTIVE (voice connected, opening script spoken/speaking)
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === -1 && preflightPhase !== 'idle') {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <AssistantDot speaking={isSpeaking} listening={false} />
            <AssistantStatus speaking={isSpeaking} listening={false} />
            <span className="label-xs ml-1">Director Interview</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">Voice-led setup</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Listen first. The assistant will guide you. You can answer out loud or use the buttons below.
          </p>
        </div>

        {/* Assistant opening explanation bubble */}
        <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-medium text-lime">Assistant</p>
            {isSpeaking && isRealtimeConnected && (
              <AssistantDot speaking={true} listening={false} />
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {preflightAssistantText || OPENING_SCRIPT}
          </p>
        </div>

        {/* Active Prompt Card — always visible when a question prompt is active */}
        {activeVoicePrompt && preflightPhase !== 'ready_for_question_one' && (
          <ActivePromptCard prompt={activeVoicePrompt} />
        )}

        {/* Voice listening status — shown while waiting for name or preflight answer */}
        {voiceMode && isRealtimeConnected && (preflightPhase === 'awaiting_preflight_answer' || preflightPhase === 'awaiting_name_answer') && !isSpeaking && (
          <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2">
              {realtimeVoice.speechStarted ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-status-blue animate-pulse shrink-0" />
                  <p className="text-xs text-status-blue">Listening…</p>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <p className="text-xs text-text-muted">Speak your answer, or type below</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Preflight captured — show transcript for review before processing */}
        {preflightPhase === 'preflight_captured' && (
          <div className="space-y-2.5">
            <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-border space-y-2">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Here&apos;s what I heard</p>
              <textarea
                value={preflightTypedInput}
                onChange={e => setPreflightTypedInput(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Transcript of your response…"
                className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
              />
              <p className="text-[10px] text-text-muted">Edit if the transcript is wrong, then confirm.</p>
            </div>
            <button
              type="button"
              onClick={() => handlePreflightResponse(preflightTypedInput.trim() || 'no questions')}
              disabled={isSpeaking}
              className={`w-full ${BTN_LIME}`}
            >
              Use this response
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePreflightResponse('no questions')}
              disabled={isSpeaking}
              className={`w-full ${BTN_GHOST}`}
            >
              No questions — start
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                realtimeVoice.clearUserTranscript()
                lastAppliedTranscriptRef.current = ''
                setPreflightTypedInput('')
                setPreflightPhase('awaiting_preflight_answer')
              }}
              disabled={isSpeaking}
              className={`w-full ${BTN_GHOST}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Record again
            </button>
            {voiceMode && (
              <button
                type="button"
                onClick={switchToTypeModePreflight}
                className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Type instead
              </button>
            )}
          </div>
        )}

        {/* Name captured — transcript review before confirming */}
        {preflightPhase === 'name_captured' && (
          <div className="space-y-2.5">
            <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-border space-y-2">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Here&apos;s what I heard</p>
              <input
                type="text"
                value={directorNameTypedInput}
                onChange={e => setDirectorNameTypedInput(e.target.value)}
                maxLength={60}
                placeholder="Your name…"
                autoFocus
                className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
              />
              <p className="text-[10px] text-text-muted">Edit your name if the transcript was wrong, then confirm.</p>
            </div>
            <button
              type="button"
              onClick={() => confirmName(directorNameTypedInput)}
              disabled={isSpeaking}
              className={`w-full ${BTN_LIME}`}
            >
              Use this name
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                realtimeVoice.clearUserTranscript()
                lastAppliedTranscriptRef.current = ''
                setDirectorNameTypedInput('')
                setPreflightPhase('awaiting_name_answer')
              }}
              disabled={isSpeaking}
              className={`w-full ${BTN_GHOST}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Record again
            </button>
            <button
              type="button"
              onClick={skipName}
              disabled={isSpeaking}
              className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Skip name
            </button>
          </div>
        )}

        {/* Name awaiting — typed name input shown when voice hasn't captured yet */}
        {preflightPhase === 'awaiting_name_answer' && (
          <div className="space-y-1.5">
            <label className="label-xs">Your name (optional)</label>
            <input
              type="text"
              value={directorNameTypedInput}
              onChange={e => setDirectorNameTypedInput(e.target.value)}
              maxLength={60}
              placeholder={voiceMode ? 'Type your name, or speak into the mic…' : 'Type your name…'}
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
          </div>
        )}

        {/* Enable audio if blocked */}
        {realtimeVoice.audioBlocked && voiceMode && (
          <div className="px-4 py-3 rounded-xl bg-surface-raised border border-status-orange/30 space-y-2">
            <p className="text-xs text-text-secondary">
              Voice connected, but audio did not start. Click to enable.
            </p>
            <button
              type="button"
              onClick={realtimeVoice.enableAudio}
              className="text-xs px-3 py-1.5 rounded-xl border border-status-orange/40 bg-status-orange/10 text-status-orange hover:bg-status-orange/20 transition-colors"
            >
              Enable audio
            </button>
          </div>
        )}

        {/* Audio warning */}
        {audioWarning && (
          <p className="text-[11px] text-status-orange px-1">{audioWarning}</p>
        )}

        {/* Typed input — shown only while awaiting (not during capture confirm) */}
        {preflightPhase === 'awaiting_preflight_answer' && (
          <div className="space-y-1.5">
            <label className="label-xs">Your question or response</label>
            <textarea
              value={preflightTypedInput}
              onChange={e => setPreflightTypedInput(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={voiceMode ? 'Type your question, or speak into the mic…' : 'Any questions before we begin?'}
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5">
          {/* Name speaking — skip the name question */}
          {preflightPhase === 'name_speaking' && (
            <button
              type="button"
              onClick={() => {
                stopAssistantSpeech()
                setIsSpeaking(false)
                setAudioStatus('ready')
                skipName()
              }}
              className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Skip name
            </button>
          )}

          {/* Name awaiting — action buttons */}
          {preflightPhase === 'awaiting_name_answer' && (
            <>
              {directorNameTypedInput.trim() && (
                <button
                  type="button"
                  onClick={() => confirmName(directorNameTypedInput)}
                  disabled={isSpeaking}
                  className={`w-full ${BTN_LIME}`}
                >
                  Use this name
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={skipName}
                disabled={isSpeaking}
                className={`w-full ${BTN_GHOST}`}
              >
                Skip name
              </button>
              {voiceMode && (
                <button
                  type="button"
                  onClick={switchToTypeModePreflight}
                  className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
                >
                  Type instead
                </button>
              )}
            </>
          )}

          {/* Skip intro — shown while opening script is still speaking */}
          {preflightPhase === 'intro_speaking' && (
            <button
              type="button"
              onClick={() => {
                stopAssistantSpeech()
                setIsSpeaking(false)
                setAudioStatus('ready')
                setPreflightPhase('awaiting_preflight_answer')
              }}
              className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Skip intro
            </button>
          )}

          {/* Primary action when awaiting preflight answer (typed path or voice before transcript) */}
          {preflightPhase === 'awaiting_preflight_answer' && (
            <>
              <button
                type="button"
                onClick={() => handlePreflightResponse('no questions')}
                disabled={isSpeaking}
                className={`w-full ${BTN_LIME}`}
              >
                No questions — start
                <ArrowRight className="w-4 h-4" />
              </button>

              {preflightTypedInput.trim() && (
                <button
                  type="button"
                  onClick={() => handlePreflightResponse(preflightTypedInput.trim())}
                  disabled={isSpeaking}
                  className={`w-full ${BTN_GHOST}`}
                >
                  Ask this
                </button>
              )}

              {voiceMode && (
                <button
                  type="button"
                  onClick={switchToTypeModePreflight}
                  className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
                >
                  Type instead
                </button>
              )}

              {voiceMode && isRealtimeConnected && !isSpeaking && (
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted text-center">
                    Voice is connected. If the welcome didn&apos;t start, press Play welcome.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWelcomeResponseError(null)
                      setPreflightPhase('intro_speaking')
                      setPreflightAssistantText(OPENING_SCRIPT)
                      setIsSpeaking(true)
                      setAudioStatus('speaking')
                      speakPrompt(PREFLIGHT_VOICE_PROMPT, OPENING_SCRIPT, () => {
                        setIsSpeaking(false)
                        setAudioStatus('ready')
                        setPreflightPhase('awaiting_preflight_answer')
                      })
                    }}
                    className={`w-full ${BTN_GHOST}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Play welcome
                  </button>
                </div>
              )}
            </>
          )}

          {/* Transitioning to Q1 */}
          {preflightPhase === 'ready_for_question_one' && (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-lime shrink-0" />
              <p className="text-xs text-text-muted">Starting first question…</p>
            </div>
          )}
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <RealtimeDebugPanel {...debugPanelProps} />
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WELCOME — STATIC (before voice interview is started)
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === -1) {
    const isConnecting =
      realtimeVoice.status === 'fetching-token' ||
      realtimeVoice.status === 'requesting-mic' ||
      realtimeVoice.status === 'connecting'

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <AssistantDot speaking={isSpeaking} listening={false} />
            <span className="label-xs">Director Interview</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">
            Let&apos;s set up your academy together.
          </h2>
        </div>

        {/* Assistant intro bubble */}
        <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-medium text-lime">Academy OS Setup Assistant</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            The assistant will explain the setup interview, answer one quick question if you have one,
            then guide you through the questions. Seven questions — your philosophy, how you group players,
            what your coaches need, and what a successful 90 days looks like. About 3 minutes.
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            'One question at a time — no rushing.',
            'Pick chips, speak, or type your answer.',
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

        {/* Audio warning */}
        {audioWarning && (
          <p className="text-[11px] text-status-orange px-1">{audioWarning}</p>
        )}

        {/* Enable audio button (WebRTC autoplay blocked) */}
        {realtimeVoice.audioBlocked && (
          <div className="px-4 py-3 rounded-xl bg-surface-raised border border-status-orange/30 space-y-2">
            <p className="text-xs text-text-secondary">
              Voice connected, but the assistant did not start speaking. Click to enable audio,
              or use Repeat question / Type instead.
            </p>
            <button
              type="button"
              onClick={realtimeVoice.enableAudio}
              className="text-xs px-3 py-1.5 rounded-xl border border-status-orange/40 bg-status-orange/10 text-status-orange hover:bg-status-orange/20 transition-colors"
            >
              Enable audio
            </button>
          </div>
        )}

        <div className="space-y-2 pt-1">
          {ttsSupported && (
            <>
              <button
                type="button"
                onClick={startVoiceInterview}
                disabled={isConnecting || isSpeaking || voiceMode}
                className={`w-full ${BTN_LIME}`}
              >
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Connecting assistant…</>
                ) : isSpeaking && voiceMode ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Assistant is speaking…</>
                ) : realtimeVoice.voiceReadiness === 'preparing' ? (
                  <><Loader2 className="w-4 h-4 animate-spin opacity-60" />Preparing voice…</>
                ) : (
                  <><Volume2 className="w-4 h-4" />Start Voice Interview</>
                )}
              </button>
              {realtimeVoice.voiceReadiness === 'preparing' && !isConnecting && (
                <p className="text-[10px] text-text-muted text-center">Getting the assistant ready…</p>
              )}
              {realtimeVoice.voiceReadiness === 'ready' && !isConnecting && !voiceMode && (
                <p className="text-[10px] text-text-muted text-center">Voice is ready. Press start and the assistant will guide you.</p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={startTypeInterview}
            disabled={isConnecting}
            className={`w-full ${BTN_GHOST}`}
          >
            {ttsSupported ? "I'd rather type" : 'Start Interview'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <RealtimeDebugPanel {...debugPanelProps} />
        )}
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

  const wordCount = currentAnswer.custom.trim().split(/\s+/).filter(Boolean).length
  const isShortAnswer = currentAnswer.chips.length === 0 && wordCount < 6

  // What to show in the assistant bubble: live transcript > app-known text > last confirmed transcript
  const assistantDisplayText = (isSpeaking && realtimeVoice.currentAssistantText)
    ? realtimeVoice.currentAssistantText
    : (lastSpokenAssistantText || realtimeVoice.lastAssistantText)

  // ── CONFIRMING PHASE ────────────────────────────────────────────────────────
  if (phase === 'confirming') {
    const interpretation = buildInterpretation(currentStep, currentAnswer.chips, currentAnswer.custom)

    return (
      <div className="space-y-6">
        <ProgressRow
          step={step}
          total={INTERVIEW_STEPS.length}
          label={currentStep.stepLabel}
          pct={progressPct}
          voiceMode={voiceMode}
          isSpeaking={isSpeaking}
          isListening={voiceMode && isRealtimeConnected && !isSpeaking}
        />

        {/* Assistant acknowledgment bubble */}
        <div className="px-4 py-4 rounded-xl bg-surface-raised border border-lime/20 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            {isShortAnswer ? (
              wordCount === 0
                ? <p className="text-xs font-medium text-lime">No worries — just pick the closest option…</p>
                : <p className="text-xs font-medium text-lime">Want to add a bit more?</p>
            ) : (
              <p className="text-xs font-medium text-lime">Here&apos;s what I heard…</p>
            )}
          </div>

          {isShortAnswer ? (
            <p className="text-sm text-text-secondary leading-relaxed">{currentStep.followUpPrompt}</p>
          ) : (
            <>
              <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wide">{currentAck}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{interpretation}</p>
            </>
          )}
        </div>

        {/* Audio warning in confirming phase */}
        {audioWarning && voiceMode && (
          <p className="text-[11px] text-status-orange px-1">{audioWarning}</p>
        )}

        {/* Enable audio when blocked */}
        {realtimeVoice.audioBlocked && voiceMode && (
          <div className="px-4 py-3 rounded-xl bg-surface-raised border border-status-orange/30 space-y-2">
            <p className="text-xs text-text-secondary">Voice connected, but audio did not start.</p>
            <button
              type="button"
              onClick={realtimeVoice.enableAudio}
              className="text-xs px-3 py-1.5 rounded-xl border border-status-orange/40 bg-status-orange/10 text-status-orange hover:bg-status-orange/20 transition-colors"
            >
              Enable audio
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5">
          {isShortAnswer ? (
            <>
              <button
                type="button"
                onClick={askSimpler}
                className={`w-full ${BTN_LIME}`}
              >
                <RefreshCw className="w-4 h-4" />
                Let me rephrase
              </button>
              <button
                type="button"
                onClick={acceptAnswer}
                className={`w-full ${BTN_GHOST}`}
              >
                Keep it anyway — {isLast ? 'show review' : 'next question'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <RealtimeDebugPanel {...debugPanelProps} />
        )}
      </div>
    )
  }

  // ── ANSWERING PHASE ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <ProgressRow
        step={step}
        total={INTERVIEW_STEPS.length}
        label={currentStep.stepLabel}
        pct={progressPct}
        voiceMode={voiceMode}
        isSpeaking={isSpeaking}
        isListening={voiceMode && isRealtimeConnected && !isSpeaking}
      />

      {/* Voice mode controls */}
      {voiceMode && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={repeatQuestion}
              disabled={isSpeaking}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors disabled:opacity-40"
            >
              <RefreshCw className="w-3 h-3" />
              Repeat
            </button>
            {isSpeaking && (
              <button
                type="button"
                onClick={pauseAssistant}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
              >
                <VolumeX className="w-3 h-3" />
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={switchToTypeMode}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Type instead
            </button>
          </div>

          {/* Enable audio when blocked */}
          {realtimeVoice.audioBlocked && (
            <button
              type="button"
              onClick={realtimeVoice.enableAudio}
              className="text-xs px-3 py-1.5 rounded-xl border border-status-orange/40 bg-status-orange/10 text-status-orange hover:bg-status-orange/20 transition-colors"
            >
              Enable audio
            </button>
          )}

          {/* Audio status */}
          {audioStatus === 'loading' && (
            <p className="text-[10px] text-text-muted flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isRealtimeConnected ? 'Voice ready' : 'Loading voice…'}
            </p>
          )}
          {audioWarning && (
            <p className="text-[10px] text-status-orange">{audioWarning}</p>
          )}
          {!audioWarning && audioStatus === 'ready' && (
            <p className="text-[10px] text-text-muted">Voice ready</p>
          )}
        </div>
      )}

      {/* Type mode: manual play button */}
      {!voiceMode && ttsSupported && (
        <button
          type="button"
          onClick={() => speakAssistant(getStepQuestion(step))}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 text-lime" />
          Play question
        </button>
      )}

      {/* ── Assistant bubble — shows what the assistant said/is saying ────────── */}
      {/* Displayed in voice mode when we know what the assistant spoke.          */}
      {/* Falls back to app-known text if Realtime transcript events don't arrive. */}
      {voiceMode && assistantDisplayText && (
        <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-medium text-lime">Assistant</p>
            {isSpeaking && isRealtimeConnected && (
              <AssistantDot speaking={true} listening={false} />
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{assistantDisplayText}</p>
        </div>
      )}

      {/* ── Voice capture status — Realtime listening state ───────────────────── */}
      {/* Shown when Realtime is connected and assistant is not currently speaking. */}
      {voiceMode && isRealtimeConnected && !isSpeaking && (
        <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border space-y-2">
          <div className="flex items-center gap-2">
            {realtimeVoice.speechStarted ? (
              <>
                <Mic className="w-3.5 h-3.5 text-status-blue animate-pulse shrink-0" />
                <p className="text-xs text-status-blue">Listening…</p>
              </>
            ) : realtimeVoice.finalTranscriptReceived ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                <p className="text-xs text-text-secondary">Captured — edit below if needed, then click Use this answer</p>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <p className="text-xs text-text-muted">
                  {currentAnswer.custom
                    ? 'Answer ready — edit or speak again'
                    : 'Speak your answer, or type below'}
                </p>
              </>
            )}
          </div>
          {realtimeVoice.finalTranscriptReceived && (
            <button
              type="button"
              onClick={() => {
                realtimeVoice.clearUserTranscript()
                lastAppliedTranscriptRef.current = ''
                setCustom(field, '')
              }}
              className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Record again
            </button>
          )}
        </div>
      )}

      {/* Active Prompt Card — shown in voice mode so director always sees what was asked */}
      {voiceMode && activeVoicePrompt && (
        <ActivePromptCard prompt={activeVoicePrompt} />
      )}

      {/* Question — shown in typed mode or when no active prompt (fallback) */}
      {(!voiceMode || !activeVoicePrompt) && (
        <div className="space-y-1">
          {simpler && (
            <p className="text-[10px] text-lime px-1 pb-1">
              No problem — pick whichever feels closest, or add a quick note in your own words.
            </p>
          )}
          <h2 className="text-base font-semibold text-text-primary leading-snug">
            {getStepQuestion(step)}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">{currentStep.helperCopy}</p>
        </div>
      )}

      {/* Simpler note in voice mode */}
      {voiceMode && simpler && (
        <p className="text-[10px] text-lime px-1">
          No problem — pick whichever feels closest, or add a quick note in your own words.
        </p>
      )}

      {/* Chips */}
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

      {/* Browser STT mic button — fallback / type-mode only */}
      {!voiceMode && (
        <MicButton
          onTranscript={(text) => appendTranscript(field, text)}
          disabled={false}
        />
      )}

      {/* Custom text area — pre-populated by Realtime transcript when in voice mode */}
      <div className="space-y-1.5">
        <label className="label-xs">
          {voiceMode ? 'Your answer (edit as needed)' : 'Your own words (optional)'}
        </label>
        <textarea
          value={currentAnswer.custom}
          onChange={e => setCustom(field, e.target.value)}
          rows={2}
          maxLength={400}
          placeholder={voiceMode ? 'Transcript appears here after you speak…' : 'Add a note in your own words…'}
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        {currentAnswer.custom.length > 0 && (
          <p className="text-[10px] text-text-muted text-right">{currentAnswer.custom.length} / 400</p>
        )}
      </div>

      {/* Helper links */}
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

      {/* Navigation — app controls step advancement, not the AI */}
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

      {process.env.NODE_ENV !== 'production' && (
        <RealtimeDebugPanel {...debugPanelProps} />
      )}
    </div>
  )
}

// ─── Progress row with optional voice-mode indicator ─────────────────────────
function ProgressRow({
  step,
  total,
  label,
  pct,
  voiceMode,
  isSpeaking,
  isListening,
}: {
  step: number
  total: number
  label: string
  pct: number
  voiceMode: boolean
  isSpeaking: boolean
  isListening: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        {voiceMode ? (
          <div className="flex items-center gap-2">
            <AssistantDot speaking={isSpeaking} listening={isListening} />
            <AssistantStatus speaking={isSpeaking} listening={isListening} />
          </div>
        ) : (
          <p className="text-[10px] font-mono text-text-muted">{step + 1} / {total}</p>
        )}
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

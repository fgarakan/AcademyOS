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
import { INTERVIEW_STEPS, type InterviewField, type InterviewStep } from './interviewSteps'
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
}: {
  status: string
  debug: RealtimeDebugState
  welcomeSent?: boolean
  firstRequested?: boolean
}) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-[10px] text-text-muted hover:text-text-secondary font-mono select-none">
        ▶ Voice Debug ({status})
      </summary>
      <div className="mt-2 p-3 rounded-lg bg-surface border border-border space-y-0.5 text-[9px] font-mono leading-relaxed">
        <p>status: <span className="text-lime">{status}</span></p>
        <p>welcome sent: <span className={welcomeSent ? 'text-status-green' : 'text-text-muted'}>{String(welcomeSent ?? false)}</span></p>
        <p>first response requested: <span className={firstRequested ? 'text-status-green' : 'text-text-muted'}>{String(firstRequested ?? false)}</span></p>
        <p>env configured: <span className={
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
      </div>
    </details>
  )
}

// ─── Mic button (browser-native STT) ─────────────────────────────────────────
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

  // Dev-only debug fields for welcome sequence
  const [debugWelcomeSent, setDebugWelcomeSent] = useState(false)
  const [debugFirstRequested, setDebugFirstRequested] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── OpenAI Realtime voice hook ───────────────────────────────────────────────
  const realtimeVoice = useRealtimeInterviewVoice()
  const isRealtimeConnected = realtimeVoice.status === 'connected'

  // ── Browser TTS refs (speechSynthesis fallback) ──────────────────────────────
  // utteranceRef prevents Chrome from GC-ing the utterance mid-speech.
  // Without this, Chrome silently stops speaking and onend never fires.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevents the auto-speak useEffect from re-speaking step 0 when the welcome
  // already included the first question. Reset when a new voice session starts.
  const hasSentWelcomeRef = useRef(false)

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

  // ── Browser TTS helper (fallback when Realtime is not connected) ─────────────
  // speakAssistant is stable (useCallback with []) because it only accesses
  // refs and React state setters, both of which are stable across renders.
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

  // ── Auto-speak question when voice mode is on and an answering step is active.
  // Uses Realtime when connected, browser TTS when not.
  useEffect(() => {
    if (!voiceMode || step < 0 || step >= INTERVIEW_STEPS.length || phase !== 'answering') return

    // Step 0 was already spoken as part of the combined welcome + first question.
    // Clear the flag so Repeat Question works normally going forward.
    if (step === 0 && hasSentWelcomeRef.current) {
      hasSentWelcomeRef.current = false
      setIsSpeaking(false)
      setAudioStatus('ready')
      return
    }

    setIsSpeaking(true)
    setAudioStatus('speaking')

    if (isRealtimeConnected) {
      realtimeVoice.speak(INTERVIEW_STEPS[step].spokenQuestion, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
      })
      return () => { setIsSpeaking(false) }
    }

    speakAssistant(INTERVIEW_STEPS[step].spokenQuestion, {
      onEnd: () => setIsSpeaking(false),
      onError: () => {
        setAudioWarning("Audio didn't play. Check browser sound or use typed mode.")
      },
    })
    return () => { stopAssistantSpeech() }
  }, [voiceMode, step, phase, isRealtimeConnected, realtimeVoice.speak, speakAssistant, stopAssistantSpeech])

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
    const text = INTERVIEW_STEPS[step].spokenQuestion
    if (isRealtimeConnected) {
      realtimeVoice.speak(text, () => setIsSpeaking(false))
    } else {
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
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
  }

  // ── Welcome actions ─────────────────────────────────────────────────────────
  async function startVoiceInterview() {
    hasSentWelcomeRef.current = false
    setDebugWelcomeSent(false)
    setDebugFirstRequested(false)
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

    // Connected — welcome + first question as a single utterance so the experience
    // feels continuous. hasSentWelcomeRef prevents the auto-speak useEffect from
    // re-speaking step 0 after the callback advances the step.
    const firstQ = INTERVIEW_STEPS[0].spokenQuestion
    const welcomeText =
      `Hey, welcome. I'll walk you through this one question at a time. We'll keep it simple. ` +
      `First question: ${firstQ}`

    hasSentWelcomeRef.current = true
    setDebugWelcomeSent(true)
    setDebugFirstRequested(true)
    setIsSpeaking(true)
    setAudioStatus('speaking')
    realtimeVoice.speak(welcomeText, () => {
      setIsSpeaking(false)
      setAudioStatus('ready')
      setStep(0)
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
        realtimeVoice.speak(text, () => setIsSpeaking(false))
      } else {
        speakAssistant(text, {
          onEnd: () => setIsSpeaking(false),
          onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
        })
      }
    }
  }

  function acceptAnswer() {
    stopAssistantSpeech()
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
    if (voiceMode) {
      setIsSpeaking(true)
      setAudioStatus('speaking')
      if (isRealtimeConnected) {
        realtimeVoice.speak(s.followUpPrompt, () => setIsSpeaking(false))
      } else {
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
      setVoiceMode(false)
      setAudioStatus('idle')
      setAudioWarning(null)
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
            I&apos;ll ask seven short questions — your philosophy, how you group players,
            and what a successful first 90 days looks like. Pick a chip, speak, or type. About 3 minutes.
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

        <div className="space-y-2.5 pt-1">
          {ttsSupported && (
            <button
              type="button"
              onClick={startVoiceInterview}
              disabled={isConnecting || isSpeaking || voiceMode}
              className={`w-full ${BTN_LIME}`}
            >
              {isConnecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Connecting assistant…</>
              ) : isSpeaking && voiceMode ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Assistant is welcoming you…</>
              ) : (
                <><Volume2 className="w-4 h-4" />Start Voice Interview</>
              )}
            </button>
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

        {/* Dev-only debug panel */}
        {process.env.NODE_ENV !== 'production' && (
          <RealtimeDebugPanel
            status={realtimeVoice.status}
            debug={realtimeVoice.debug}
            welcomeSent={debugWelcomeSent}
            firstRequested={debugFirstRequested}
          />
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

        {/* Dev debug panel */}
        {process.env.NODE_ENV !== 'production' && (
          <RealtimeDebugPanel
            status={realtimeVoice.status}
            debug={realtimeVoice.debug}
            welcomeSent={debugWelcomeSent}
            firstRequested={debugFirstRequested}
          />
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
          onClick={() => speakAssistant(currentStep.spokenQuestion)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 text-lime" />
          Play question
        </button>
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
        <p className="text-xs text-text-muted leading-relaxed">{currentStep.helperCopy}</p>
      </div>

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

      {/* Mic input for spoken answers */}
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

      {/* Dev debug panel */}
      {process.env.NODE_ENV !== 'production' && (
        <RealtimeDebugPanel
          status={realtimeVoice.status}
          debug={realtimeVoice.debug}
          welcomeSent={debugWelcomeSent}
          firstRequested={debugFirstRequested}
        />
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

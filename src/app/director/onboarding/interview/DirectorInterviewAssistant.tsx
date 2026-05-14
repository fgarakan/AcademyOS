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
import { DONNA_SETUP_LABEL } from '@/components/assistant/donnaAssistantCopy'

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

// ─── Natural Speech Library (Sprint 243) ─────────────────────────────────────
// All phrases are app-controlled, hard-coded strings. No AI invention.
// No phrase exceeds 12 words. Selection is deterministic via getSpeechPhrase().
const NATURAL_QUESTION_LEAD_INS: readonly string[] = [
  "Let's start high-level.",
  "This one is simple.",
  "This helps me understand your academy.",
  "Now let's look at the coaching side.",
  "Quick one here.",
]
const NATURAL_REVIEW_PHRASES: readonly string[] = [
  "Got it. Take a quick look.",
  "Perfect, here's what I heard.",
  "Good, I captured that.",
  "That helps. Take a look.",
]
const NATURAL_TRANSITION_PHRASES: readonly string[] = [
  "Perfect. Next question.",
  "Got it. Let's keep moving.",
  "Great. Moving to the next piece.",
  "That's enough. Next one.",
]

function getSpeechPhrase(group: readonly string[], stepIndex: number): string {
  if (group.length === 0) return ''
  return group[Math.abs(stepIndex) % group.length]
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

// Sprint 242 — voice answer confirmation loop phases
// The app, not the AI, controls all transitions.
type VoiceAnswerPhase =
  | 'idle'                       // typed mode or not on a question step
  | 'listening_for_answer'       // question just spoken; waiting for director's voice answer
  | 'answer_captured'            // transcript just arrived (brief transitional)
  | 'review_answer'              // transcript shown; waiting for confirm/edit/redo command
  | 'listening_for_confirmation' // alias — same confirm-command window as review_answer
  | 'confirming_answer'          // confirm command received; calling accept logic
  | 'advancing_to_next_question' // advancing to next step in progress
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
  | 'guided_intro'               // assistant speaking guided intro — not a question, no ActivePromptCard
  | 'awaiting_audio_confirmation' // "Did you hear Donna?" gate — blocks Q1 until director confirms
  | 'name_speaking'              // assistant speaking the name question
  | 'awaiting_name_answer'       // waiting for director's name (voice or typed)
  | 'name_captured'              // name transcript received, pending confirmation
  | 'intro_speaking'             // assistant speaking OPENING_SCRIPT
  | 'awaiting_preflight_answer'
  | 'preflight_captured'
  | 'answering_preflight_question'
  | 'ready_for_question_one'

// ─── Assistant Prompt Contract — single source of truth for every spoken + shown question ─
// The app always builds this contract before speaking. Screen and voice use the same contract.
type AssistantPromptContract = {
  id: string
  kind: 'intro' | 'question' | 'confirmation' | 'redirect'
  moduleId?: string
  moduleTitle?: string
  questionNumber?: number
  totalQuestionsInModule?: number
  screenText: string         // what is shown on screen (= spokenText for questions)
  spokenText: string         // what the assistant speaks (lead-in + exact question)
  exactQuestionText?: string // the locked canonical question — never modified by AI
  whyThisMatters?: string
  requiresAnswer: boolean
  // Sprint 243 — natural speech additions (app-controlled, library-sourced)
  leadInText?: string        // short phrase before the question (from NATURAL_QUESTION_LEAD_INS)
  transitionText?: string    // short phrase before next question (from NATURAL_TRANSITION_PHRASES)
  reviewText?: string        // short phrase shown/spoken after transcript capture (from NATURAL_REVIEW_PHRASES)
}

// ─── Active voice prompt model ────────────────────────────────────────────────
// Every question spoken by the assistant must have a matching visible prompt.
// Before calling speakWithTracking for any question, set activeVoicePrompt.
type ActiveVoicePrompt = {
  id: string
  kind: 'intro' | 'preflight' | 'interview'
  questionText: string       // backward compat: = exactQuestionText for interview steps
  helperText?: string
  // Sprint 241 contract fields — populated for interview steps only:
  spokenText?: string        // full spoken text including casual lead-in
  exactQuestionText?: string // the locked canonical question (no lead-in)
  moduleTitle?: string
  questionNumber?: number
  totalQuestions?: number
  whyThisMatters?: string
}

// The specific answerable question at the end of OPENING_SCRIPT
const PREFLIGHT_VOICE_PROMPT: ActiveVoicePrompt = {
  id: 'preflight',
  kind: 'preflight',
  questionText: 'Before we begin, do you have any questions, or should we jump into the first one?',
  helperText: 'Say "No questions" or "Let\'s start" to begin, or ask anything about the setup.',
}

// Name capture prompt — kept as fallback when no profile name and no typed name
const NAME_VOICE_PROMPT: ActiveVoicePrompt = {
  id: 'director_name',
  kind: 'preflight',
  questionText: 'Before we begin, what name should I call you?',
  helperText: 'This helps the assistant address you correctly during setup.',
}

// Generic guided intro text — fallback only. Happy path uses buildPersonalizedWelcomeText().
const GUIDED_INTRO_TEXT =
  "Welcome. I'm Donna, your Academy Setup Assistant. I'll help customize your Academy OS around how your academy actually works. " +
  "I'll guide you one section at a time, and you'll be able to review and edit every answer before we continue."

// ─── Director name resolution ─────────────────────────────────────────────────
// Resolution order: directorDisplayName (confirmed this session) → directorProfileName → null
function resolveDirectorName(
  directorDisplayName: string,
  directorProfileName: string | undefined,
): string | null {
  if (directorDisplayName.trim()) return directorDisplayName.trim()
  if (directorProfileName?.trim()) return directorProfileName.trim()
  return null
}

// ─── Personalized welcome text ───────────────────────────────────────────────
// First spoken word is always "Welcome." per sprint contract.
function buildPersonalizedWelcomeText(
  directorName: string | null,
  academyName: string | undefined,
): string {
  const greeting = directorName ? `Welcome, ${directorName}.` : 'Welcome.'
  const academyRef = academyName ? `${academyName}'s Academy OS` : "your academy's Academy OS"
  return (
    `${greeting} I'm Donna, your Academy Setup Assistant. ` +
    `I'll help customize ${academyRef} around how your academy actually works. ` +
    "I'll guide you one section at a time, and you'll be able to review and edit every answer before we continue."
  )
}

// ─── Assistant Prompt Contract builder ───────────────────────────────────────
// Builds the single source of truth for each interview question.
// screenText and spokenText are identical — what is shown is what is spoken.
// exactQuestionText is the locked question from interviewSteps — never changed by AI.
// Sprint 243: leadInText sourced from NATURAL_QUESTION_LEAD_INS (deterministic rotation).
function buildAssistantPromptContract(
  stepIndex: number,
  directorName: string | null,
  academyName: string | undefined,
): AssistantPromptContract {
  const s = INTERVIEW_STEPS[stepIndex]
  const exactQ = s.spokenQuestion ?? s.question
  const libraryLeadIn = getSpeechPhrase(NATURAL_QUESTION_LEAD_INS, stepIndex)
  const namePrefix = directorName ? `${directorName}, ` : ''
  const leadInText = `${namePrefix}${libraryLeadIn}`.trim()
  const spokenText = leadInText ? `${leadInText} ${exactQ}` : exactQ
  return {
    id: s.id,
    kind: 'question',
    moduleId: s.id,
    moduleTitle: s.stepLabel,
    questionNumber: stepIndex + 1,
    totalQuestionsInModule: INTERVIEW_STEPS.length,
    screenText: spokenText,
    spokenText,
    exactQuestionText: exactQ,
    whyThisMatters: s.whyItMatters,
    requiresAnswer: true,
    leadInText: libraryLeadIn || undefined,
    transitionText: getSpeechPhrase(NATURAL_TRANSITION_PHRASES, stepIndex) || undefined,
    reviewText: getSpeechPhrase(NATURAL_REVIEW_PHRASES, stepIndex) || undefined,
  }
}

// ─── Interview prompt builder — derives ActiveVoicePrompt from AssistantPromptContract ─
function buildInterviewPrompt(
  stepIndex: number,
  directorName: string | null = null,
  academyName?: string,
): ActiveVoicePrompt {
  const contract = buildAssistantPromptContract(stepIndex, directorName, academyName)
  return {
    id: contract.id,
    kind: 'interview',
    questionText: contract.exactQuestionText ?? getStepQuestion(stepIndex),
    helperText: contract.whyThisMatters,
    spokenText: contract.spokenText,
    exactQuestionText: contract.exactQuestionText,
    moduleTitle: contract.moduleTitle,
    questionNumber: contract.questionNumber,
    totalQuestions: contract.totalQuestionsInModule,
    whyThisMatters: contract.whyThisMatters,
  }
}

const OPENING_SCRIPT =
  "I'll guide you through a short academy setup so your Academy OS reflects how your academy actually works. " +
  "The goal is to understand your curriculum, groups, coaching workflow, player pathways, and parent experience. " +
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

// ─── Current question contract ───────────────────────────────────────────────
// Single source of truth for every answerable interview question.
// The screen (ActivePromptCard) and the voice (speakWithTracking) must both
// derive their text from this contract — never from separate sources.
interface CurrentQuestionContract {
  id: string
  stage: string
  questionText: string      // = getStepQuestion(stepIndex) — canonical
  whyThisMatters: string    // = InterviewStep.whyItMatters
  expectedAnswerType: 'chips_or_freeform'
}

function buildCurrentQuestionContract(stepIndex: number): CurrentQuestionContract {
  const s = INTERVIEW_STEPS[stepIndex]
  return {
    id: s.id,
    stage: s.stepLabel,
    questionText: getStepQuestion(stepIndex), // always spokenQuestion ?? question
    whyThisMatters: s.whyItMatters,
    expectedAnswerType: 'chips_or_freeform',
  }
}

// Off-track redirect — used when director asks something unrelated.
// App-side version: the AI session instructions handle the primary case.
function buildOffTrackRedirect(currentQuestionText: string): string {
  return (
    "Good question. We can come back to that later. " +
    `To keep setup moving, let's answer the current question: ${currentQuestionText}`
  )
}

// ─── Confirmation command detection ──────────────────────────────────────────
// Only called during review_answer / listening_for_confirmation phases.
// During listening_for_answer the director's words are treated as an answer — never as commands.
function detectConfirmationCommand(
  text: string,
): 'confirm' | 'edit' | 'redo' | 'repeat' | 'back' | null {
  const lower = text.toLowerCase().trim()
  const words = lower.split(/\s+/)

  // Multi-word patterns first (most specific → least specific)
  if (lower.includes('go back') || lower.includes('previous question') || lower.includes('go previous')) return 'back'
  if (lower.includes('repeat question') || lower.includes('say that again') || lower.includes('repeat that')) return 'repeat'
  if (lower.includes('answer again') || lower.includes('try again') || lower.includes('start over') || lower.includes('do it again')) return 'redo'
  if (lower.includes('let me edit') || lower.includes('change it') || lower.includes('fix it') || lower.includes('edit that')) return 'edit'
  if (lower.includes('looks right') || lower.includes("that's right") || lower.includes('move on') || lower.includes('go next') || lower.includes('go to next')) return 'confirm'

  // Single-word commands
  if (words.includes('back')) return 'back'
  if (words.includes('repeat')) return 'repeat'
  if (words.includes('redo')) return 'redo'
  if (words.includes('edit')) return 'edit'
  if (words.includes('confirm') || words.includes('correct') || words.includes('continue')) return 'confirm'
  // 'yes' and 'next' only as exact utterance or first word — too common in answers otherwise
  if (lower === 'yes' || lower === 'yeah' || lower === 'yep' || lower === 'next') return 'confirm'
  if (lower.startsWith('yes ') || lower.startsWith('yeah ') || lower.startsWith('next ')) return 'confirm'

  return null
}

// ─── Setup progress stages ────────────────────────────────────────────────────
const SETUP_STAGES = [
  'Welcome',
  'Name',
  'Academy Structure',
  'Coaching System',
  'Player Pathways',
  'Parent Communication',
  'Review',
]

function getSetupStageIndex(step: number, preflightPhase: PreflightPhase): number {
  if (step === -1 && preflightPhase === 'idle') return 0
  if (step === -1) return 1
  if (step <= 1) return 2
  if (step === 2 || step === 5) return 3
  if (step === 3) return 4
  if (step === 4 || step === 6) return 5
  return 6
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
  preflightPhase,
  firstSpokenText,
  lastSpeechText,
  guidedIntroRequested,
  namePromptRequested,
  preflightPromptRequested,
  setupDirectorName,
  setupAcademyName,
  setupCurrentStage,
  setupCompletedAnswersCount,
  currentQuestionId,
  currentQuestionText,
  spokenQuestionText,
  screenQuestionText,
  questionTextMatchesScreen,
  // Sprint 241
  activePromptContractId,
  contractScreenText,
  contractSpokenText,
  contractExactQuestionText,
  spokenIncludesExactQuestion,
  // Sprint 242
  voiceAnswerPhase,
  pendingAnswerTranscriptLen,
  editableAnswerTextLen,
  lastConfirmationCommand,
  confirmationCommandDetected,
  autoAdvanceAfterVoiceConfirm,
  // Sprint 243
  selectedLeadInText,
  selectedReviewText,
  selectedTransitionText,
  naturalSpeechEnabled,
  finalSpokenText,
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
  preflightPhase?: string
  firstSpokenText?: string
  lastSpeechText?: string
  guidedIntroRequested?: boolean
  namePromptRequested?: boolean
  preflightPromptRequested?: boolean
  // Sprint 239 — setup context + question lock fields
  setupDirectorName?: string | null
  setupAcademyName?: string | null
  setupCurrentStage?: string | null
  setupCompletedAnswersCount?: number
  currentQuestionId?: string | null
  currentQuestionText?: string | null
  spokenQuestionText?: string | null
  screenQuestionText?: string | null
  questionTextMatchesScreen?: boolean | null
  // Sprint 241 — AssistantPromptContract debug fields
  activePromptContractId?: string | null
  contractScreenText?: string | null
  contractSpokenText?: string | null
  contractExactQuestionText?: string | null
  spokenIncludesExactQuestion?: boolean | null
  // Sprint 242 — voice answer confirmation loop debug fields
  voiceAnswerPhase?: string
  pendingAnswerTranscriptLen?: number
  editableAnswerTextLen?: number
  lastConfirmationCommand?: string
  confirmationCommandDetected?: boolean
  autoAdvanceAfterVoiceConfirm?: boolean
  // Sprint 243 — natural speech debug fields
  selectedLeadInText?: string
  selectedReviewText?: string
  selectedTransitionText?: string
  naturalSpeechEnabled?: boolean
  finalSpokenText?: string
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
        {/* Sequence tracking — must fire: guided_intro → name_speaking → awaiting_preflight */}
        <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
          <p>preflight phase: <span className="text-lime">{preflightPhase ?? 'unknown'}</span></p>
          <p>guided intro requested: <span className={guidedIntroRequested ? 'text-status-green' : 'text-text-muted'}>{String(guidedIntroRequested ?? false)}</span></p>
          <p>name prompt requested: <span className={namePromptRequested ? 'text-status-green' : 'text-text-muted'}>{String(namePromptRequested ?? false)}</span></p>
          <p>preflight prompt requested: <span className={preflightPromptRequested ? 'text-status-orange' : 'text-text-muted'}>{String(preflightPromptRequested ?? false)}</span></p>
          {firstSpokenText ? (
            <p className="break-words">first spoken: <span className={firstSpokenText.startsWith('Welcome') ? 'text-status-green' : 'text-status-red'}>{firstSpokenText.slice(0, 50)}…</span></p>
          ) : (
            <p>first spoken: <span className="text-text-muted">none yet</span></p>
          )}
          {lastSpeechText && (
            <p className="break-words">last speech: <span className="text-text-muted">{lastSpeechText.slice(0, 50)}…</span></p>
          )}
        </div>

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
        {/* Sprint 239 — Setup context + question lock section */}
        <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
          <p className="text-[8px] uppercase tracking-widest text-text-muted font-semibold">Setup Context</p>
          <p>director name: <span className={setupDirectorName ? 'text-lime' : 'text-text-muted'}>{setupDirectorName ?? '(not set)'}</span></p>
          <p>academy name: <span className={setupAcademyName ? 'text-lime' : 'text-text-muted'}>{setupAcademyName ?? '(not set)'}</span></p>
          <p>current stage: <span className="text-text-secondary">{setupCurrentStage ?? '—'}</span></p>
          <p>answers captured: <span className="text-lime">{setupCompletedAnswersCount ?? 0}</span></p>
        </div>
        {/* Question lock section */}
        {(currentQuestionId || screenQuestionText || spokenQuestionText) && (
          <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
            <p className="text-[8px] uppercase tracking-widest text-text-muted font-semibold">Question Lock</p>
            <p>currentQuestionId: <span className="text-text-secondary">{currentQuestionId ?? '—'}</span></p>
            {currentQuestionText && (
              <p className="break-words">currentQuestionText: <span className="text-text-muted">{currentQuestionText.slice(0, 70)}</span></p>
            )}
            {screenQuestionText && (
              <p className="break-words">screenQuestionText: <span className="text-text-muted">{screenQuestionText.slice(0, 70)}</span></p>
            )}
            {spokenQuestionText && (
              <p className="break-words">spokenQuestionText: <span className="text-text-muted">{spokenQuestionText.slice(0, 70)}</span></p>
            )}
            {questionTextMatchesScreen !== null && (
              <p>
                questionTextMatchesScreen:{' '}
                <span className={questionTextMatchesScreen ? 'text-status-green' : 'text-status-red font-semibold'}>
                  {String(questionTextMatchesScreen)}
                </span>
                {!questionTextMatchesScreen && (
                  <span className="text-status-red ml-1">⚠ Mismatch</span>
                )}
              </p>
            )}
          </div>
        )}
        {/* Sprint 241 — AssistantPromptContract debug section */}
        {(activePromptContractId || contractExactQuestionText) && (
          <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
            <p className="text-[8px] uppercase tracking-widest text-text-muted font-semibold">Contract (Sprint 241)</p>
            <p>activePromptContractId: <span className="text-lime">{activePromptContractId ?? '—'}</span></p>
            {contractScreenText && (
              <p className="break-words">screenText: <span className="text-text-muted">{contractScreenText.slice(0, 80)}</span></p>
            )}
            {contractSpokenText && (
              <p className="break-words">spokenText: <span className="text-text-muted">{contractSpokenText.slice(0, 80)}</span></p>
            )}
            {contractExactQuestionText && (
              <p className="break-words">exactQuestionText: <span className="text-text-secondary">{contractExactQuestionText.slice(0, 70)}</span></p>
            )}
            {spokenIncludesExactQuestion !== null && (
              <p>
                spokenIncludesExactQuestion:{' '}
                <span className={spokenIncludesExactQuestion ? 'text-status-green' : 'text-status-red font-semibold'}>
                  {String(spokenIncludesExactQuestion)}
                </span>
                {!spokenIncludesExactQuestion && (
                  <span className="text-status-red ml-1">⚠ Mismatch: spoken does not include exact question</span>
                )}
              </p>
            )}
          </div>
        )}
        {/* Sprint 242 — voice answer confirmation loop debug section */}
        <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
          <p className="text-[8px] uppercase tracking-widest text-text-muted font-semibold">Voice Answer Loop (Sprint 242)</p>
          <p>voiceAnswerPhase: <span className={
            voiceAnswerPhase === 'listening_for_answer' ? 'text-status-blue'
            : voiceAnswerPhase === 'review_answer' || voiceAnswerPhase === 'listening_for_confirmation' ? 'text-lime'
            : voiceAnswerPhase === 'advancing_to_next_question' ? 'text-status-green'
            : 'text-text-muted'
          }>{voiceAnswerPhase ?? 'idle'}</span></p>
          <p>pendingAnswerTranscript len: <span className="text-text-muted">{pendingAnswerTranscriptLen ?? 0}</span></p>
          <p>editableAnswerText len: <span className="text-text-muted">{editableAnswerTextLen ?? 0}</span></p>
          <p>lastConfirmationCommand: <span className={lastConfirmationCommand ? 'text-lime' : 'text-text-muted'}>{lastConfirmationCommand || '—'}</span></p>
          <p>confirmationCommandDetected: <span className={confirmationCommandDetected ? 'text-status-green' : 'text-text-muted'}>{String(confirmationCommandDetected ?? false)}</span></p>
          <p>autoAdvanceAfterVoiceConfirm: <span className="text-text-muted">{String(autoAdvanceAfterVoiceConfirm ?? true)}</span></p>
        </div>
        {/* Sprint 243 — natural speech debug section */}
        <div className="border-t border-border pt-0.5 mt-0.5 space-y-0.5">
          <p className="text-[8px] uppercase tracking-widest text-text-muted font-semibold">Natural Speech (Sprint 243)</p>
          <p>naturalSpeechEnabled: <span className={naturalSpeechEnabled ? 'text-status-green' : 'text-text-muted'}>{String(naturalSpeechEnabled ?? false)}</span></p>
          <p>selectedLeadInText: <span className="text-lime">{selectedLeadInText || '—'}</span></p>
          <p>selectedReviewText: <span className="text-text-secondary">{selectedReviewText || '—'}</span></p>
          <p>selectedTransitionText: <span className="text-text-secondary">{selectedTransitionText || '—'}</span></p>
          {finalSpokenText && (
            <p className="break-words">finalSpokenText: <span className="text-text-muted">{finalSpokenText.slice(0, 80)}</span></p>
          )}
        </div>
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
// For interview steps with a full contract: shows module, why, full spokenText, and locked question.
// For preflight/name steps: keeps the simpler layout.
function ActivePromptCard({ prompt }: { prompt: ActiveVoicePrompt }) {
  const isInterview = prompt.kind === 'interview'
  const hasContract = isInterview && Boolean(prompt.spokenText && prompt.exactQuestionText)

  if (hasContract) {
    return (
      <div className="px-4 py-3.5 rounded-xl bg-surface border border-lime/30 space-y-2.5">
        {(prompt.moduleTitle || prompt.questionNumber) && (
          <div className="flex items-center gap-2 flex-wrap">
            {prompt.moduleTitle && (
              <span className="label-xs text-text-muted">{prompt.moduleTitle}</span>
            )}
            {prompt.questionNumber && prompt.totalQuestions && (
              <span className="label-xs text-text-muted/50">· {prompt.questionNumber} of {prompt.totalQuestions}</span>
            )}
          </div>
        )}
        {prompt.whyThisMatters && (
          <div className="space-y-0.5">
            <p className="label-xs text-text-muted">Why this matters</p>
            <p className="text-xs text-text-secondary leading-relaxed">{prompt.whyThisMatters}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="label-xs text-lime/80">Assistant will ask</p>
          <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{prompt.spokenText}&rdquo;</p>
        </div>
        <div className="border-t border-border/50 pt-2 space-y-1">
          <p className="label-xs text-text-muted">Question</p>
          <p className="text-base font-semibold text-text-primary leading-snug">{prompt.exactQuestionText}</p>
        </div>
      </div>
    )
  }

  const isIntroLocal = prompt.kind === 'interview'
  return (
    <div className="px-4 py-3.5 rounded-xl bg-surface border border-lime/30 space-y-2">
      {isIntroLocal && prompt.helperText && (
        <div className="space-y-0.5">
          <p className="label-xs text-text-muted">Why this matters</p>
          <p className="text-xs text-text-secondary leading-relaxed">{prompt.helperText}</p>
        </div>
      )}
      <div className="space-y-1">
        <p className="label-xs text-lime/80">Assistant will ask</p>
        <p className="text-base font-semibold text-text-primary leading-snug">{prompt.questionText}</p>
        {!isIntroLocal && prompt.helperText && (
          <p className="text-xs text-text-secondary leading-relaxed">{prompt.helperText}</p>
        )}
      </div>
    </div>
  )
}

// ─── Guided intro card — non-answerable orientation message ───────────────────
// Shown during 'guided_intro' phase. Not an ActivePromptCard — no question prompt.
function GuideIntroCard({ text, isSpeaking }: { text: string; isSpeaking: boolean }) {
  return (
    <div className="px-4 py-4 rounded-xl bg-surface-raised border border-lime/20 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-xs font-medium text-lime">{DONNA_SETUP_LABEL}</p>
        {isSpeaking && <AssistantDot speaking={true} listening={false} />}
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Setup progress indicator — 7-stage named journey ────────────────────────
function SetupProgressIndicator({ activeStage }: { activeStage: number }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
      {SETUP_STAGES.map((stage, i) => (
        <div key={i} className="flex items-center gap-0.5 shrink-0">
          <span className={`text-[9px] px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
            i === activeStage
              ? 'bg-lime/10 text-lime border border-lime/30'
              : i < activeStage
              ? 'text-text-muted'
              : 'text-text-muted/30'
          }`}>
            {stage}
          </span>
          {i < SETUP_STAGES.length - 1 && (
            <span className={`text-[8px] select-none shrink-0 ${i < activeStage ? 'text-text-muted/60' : 'text-text-muted/20'}`}>›</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Academy summary card — lightweight in-progress setup summary ─────────────
function AcademySummaryCard({
  directorName,
  currentStepLabel,
  answersCount,
  nextStepLabel,
}: {
  directorName: string
  currentStepLabel: string
  answersCount: number
  nextStepLabel: string
}) {
  return (
    <div className="px-4 py-3 rounded-xl bg-surface border border-border/60">
      <p className="label-xs text-text-muted mb-2">Building your Academy OS</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <p className="text-[9px] text-text-muted uppercase tracking-widest">Name</p>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{directorName || 'Not set'}</p>
        </div>
        <div>
          <p className="text-[9px] text-text-muted uppercase tracking-widest">Answers captured</p>
          <p className="text-xs font-mono text-lime mt-0.5">{answersCount} / 7</p>
        </div>
        <div>
          <p className="text-[9px] text-text-muted uppercase tracking-widest">Current</p>
          <p className="text-xs text-text-secondary mt-0.5">{currentStepLabel}</p>
        </div>
        <div>
          <p className="text-[9px] text-text-muted uppercase tracking-widest">Next</p>
          <p className="text-xs text-text-secondary mt-0.5">{nextStepLabel}</p>
        </div>
      </div>
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
  /** Academy name from DB — used for personalization and setup context */
  academyName?: string
  /** Director's display_name from profiles — used as default before name-capture phase */
  directorProfileName?: string
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
  academyName,
  directorProfileName,
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
  // true = force browser TTS for all assistant speech, bypass Realtime even when connected
  const [browserVoiceMode, setBrowserVoiceMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle')
  const [audioWarning, setAudioWarning] = useState<string | null>(null)
  const [testVoiceFailed, setTestVoiceFailed] = useState(false)

  // Preflight phase — guided intro before Q1 begins
  const [preflightPhase, setPreflightPhase] = useState<PreflightPhase>('idle')
  const [preflightAssistantText, setPreflightAssistantText] = useState('')
  const [preflightTypedInput, setPreflightTypedInput] = useState('')

  // Active voice prompt — the specific question the director is expected to answer.
  // Set before every speakWithTracking call for a question prompt.
  // Rule: AI must never ask a question that is not visible on screen.
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<ActiveVoicePrompt | null>(null)

  // Director display name — resolved at interview start from welcome input or profile
  const [directorDisplayName, setDirectorDisplayName] = useState('')
  const [directorNameTypedInput, setDirectorNameTypedInput] = useState('')
  // Welcome screen name input — shown before Start when no profile name is available
  const [welcomeNameInput, setWelcomeNameInput] = useState('')
  // Stable ref to resolved name — set once at interview start, used throughout the session
  const resolvedNameRef = useRef<string | null>(null)

  // Text shown in the assistant bubble — what the app told the assistant to say.
  // Used as fallback when Realtime transcript events don't arrive.
  const [lastSpokenAssistantText, setLastSpokenAssistantText] = useState('')

  // Dev-only debug fields for welcome sequence
  const [debugWelcomeSent, setDebugWelcomeSent] = useState(false)
  const [debugFirstRequested, setDebugFirstRequested] = useState(false)
  const startClickedAtRef = useRef<number | null>(null)
  const [welcomeResponseError, setWelcomeResponseError] = useState<string | null>(null)

  // Sequence-tracking debug fields — must fire in order: guided → name → preflight
  const [debugFirstSpokenText, setDebugFirstSpokenText] = useState('')
  const [debugGuidedIntroRequested, setDebugGuidedIntroRequested] = useState(false)
  const [debugNamePromptRequested, setDebugNamePromptRequested] = useState(false)
  const [debugPreflightPromptRequested, setDebugPreflightPromptRequested] = useState(false)
  const firstSpokenRef = useRef(false) // becomes true on the first speak() of each session

  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  // Tracks the pure question text that was most recently spoken for an interview step.
  // Used in QA guard to verify screen and voice questions stay in sync.
  const [lastSpokenQuestionText, setLastSpokenQuestionText] = useState('')

  // ── Sprint 242 — voice answer confirmation loop ──────────────────────────────
  // Phase tracking for the post-question voice flow.
  const [voiceAnswerPhase, setVoiceAnswerPhase] = useState<VoiceAnswerPhase>('idle')
  // The most recently captured voice answer transcript (before it was accepted).
  const [pendingAnswerTranscript, setPendingAnswerTranscript] = useState('')
  // The last confirmation command word detected (for debug display).
  const [lastConfirmationCommand, setLastConfirmationCommand] = useState('')
  // Ref to the main answer textarea so voice "edit" can focus it.
  const editableAnswerRef = useRef<HTMLTextAreaElement | null>(null)

  // ── OpenAI Realtime voice hook ───────────────────────────────────────────────
  const realtimeVoice = useRealtimeInterviewVoice()
  const isRealtimeConnected = realtimeVoice.status === 'connected'
  // Ref so speakWithTracking / speakPrompt always see the current connection state
  // without needing to include it as a useCallback dependency.
  const isRealtimeConnectedRef = useRef(false)
  isRealtimeConnectedRef.current = isRealtimeConnected
  // Ref so speakWithTracking / speakPrompt always see current browserVoiceMode
  // without needing it as a useCallback dependency (avoids unnecessary re-renders).
  const browserVoiceModeRef = useRef(false)
  browserVoiceModeRef.current = browserVoiceMode

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

  // ── Wire Realtime user transcript to answer field — phase-aware ──────────────
  // Sprint 242: behaviour depends on voiceAnswerPhase.
  //   listening_for_answer → capture transcript, enter review_answer
  //   review_answer / listening_for_confirmation → detect commands only
  //   idle / typed mode → existing behaviour (populate textarea directly)
  // Safeguard: "yes", "confirm", "next" are NEVER treated as commands during
  // listening_for_answer. Any transcript in that phase is the director's answer.
  useEffect(() => {
    const t = realtimeVoice.finalUserTranscript
    if (!t || t === lastAppliedTranscriptRef.current) return
    if (step < 0 || step >= INTERVIEW_STEPS.length) return

    const stepField = INTERVIEW_STEPS[step].field

    if (voiceMode) {
      // ── Command detection phase ───────────────────────────────────────────
      // Only active during review_answer / listening_for_confirmation.
      // Anything said during listening_for_answer is the director's answer — never a command.
      if (voiceAnswerPhase === 'review_answer' || voiceAnswerPhase === 'listening_for_confirmation') {
        const cmd = detectConfirmationCommand(t)
        if (!cmd) return // not a recognised command — ignore during review phase
        lastAppliedTranscriptRef.current = t
        setLastConfirmationCommand(cmd)
        realtimeVoice.clearUserTranscript()
        lastAppliedTranscriptRef.current = ''

        if (cmd === 'confirm') {
          setVoiceAnswerPhase('confirming_answer')
          stopAssistantSpeech()
          // Sprint 243 — use natural transition phrase (library, deterministic) for voice path
          if (step < INTERVIEW_STEPS.length - 1) {
            pendingAckRef.current = getSpeechPhrase(NATURAL_TRANSITION_PHRASES, step)
          }
          setVoiceAnswerPhase('advancing_to_next_question')
          if (step === INTERVIEW_STEPS.length - 1) {
            setStep(7)
          } else {
            setStep(prev => prev + 1)
          }
          setPhase('answering')
          setVoiceAnswerPhase('idle')

        } else if (cmd === 'edit') {
          // Focus the editable textarea; stay in review_answer so "confirm" still works
          setTimeout(() => { editableAnswerRef.current?.focus() }, 50)

        } else if (cmd === 'redo') {
          // Clear captured transcript and return to listening
          setPendingAnswerTranscript('')
          setAnswers(prev => ({ ...prev, [stepField]: { ...prev[stepField], custom: '' } }))
          setVoiceAnswerPhase('listening_for_answer')

        } else if (cmd === 'repeat') {
          // Re-speak the current question, then listen again
          setPendingAnswerTranscript('')
          setVoiceAnswerPhase('listening_for_answer')
          stopAssistantSpeech()
          const contract = buildAssistantPromptContract(step, resolvedNameRef.current, academyName)
          setActiveVoicePrompt(buildInterviewPrompt(step, resolvedNameRef.current, academyName))
          setIsSpeaking(true)
          setAudioStatus('speaking')
          if (isRealtimeConnected) {
            speakWithTracking(contract.spokenText, () => {
              setIsSpeaking(false)
              setAudioStatus('ready')
              setVoiceAnswerPhase('listening_for_answer')
            })
          } else {
            setLastSpokenAssistantText(contract.spokenText)
            speakAssistant(contract.spokenText, {
              onEnd: () => { setIsSpeaking(false); setAudioStatus('ready'); setVoiceAnswerPhase('listening_for_answer') },
              onError: () => setAudioWarning("Audio didn't play. Check browser sound."),
            })
          }

        } else if (cmd === 'back') {
          setVoiceAnswerPhase('idle')
          goBack()
        }
        return
      }

      // ── Answer capture phase ───────────────────────────────────────────────
      // Anything the director says during listening_for_answer is their answer.
      if (voiceAnswerPhase === 'listening_for_answer') {
        lastAppliedTranscriptRef.current = t
        appendTranscript(stepField, t)
        setPendingAnswerTranscript(t)
        setVoiceAnswerPhase('review_answer')
        realtimeVoice.clearUserTranscript()
        lastAppliedTranscriptRef.current = ''
        // Sprint 243 — show and speak review phrase after transcript capture.
        // reviewText is app-controlled (library), visible in assistant bubble before/while spoken.
        const reviewPhrase = getSpeechPhrase(NATURAL_REVIEW_PHRASES, step)
        if (reviewPhrase) {
          setLastSpokenAssistantText(reviewPhrase)
          if (isRealtimeConnected) {
            speakWithTracking(reviewPhrase)
          } else {
            speakAssistant(reviewPhrase)
          }
        }
        return
      }

      // ── Idle / other voice phases ─────────────────────────────────────────
      // Fallback: populate the textarea as before (typed-style voice input).
      if (voiceAnswerPhase === 'idle') {
        lastAppliedTranscriptRef.current = t
        appendTranscript(stepField, t)
      }
      return
    }

    // ── Typed mode: existing behaviour ──────────────────────────────────────
    lastAppliedTranscriptRef.current = t
    appendTranscript(stepField, t)
  // appendTranscript / goBack / stopAssistantSpeech / speakWithTracking / speakAssistant
  // are referenced but stable (state setters or useCallbacks). voiceAnswerPhase and step
  // are in the deps — any change re-registers this effect with fresh closures.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeVoice.finalUserTranscript, step, voiceMode, voiceAnswerPhase])

  // ── Browser TTS helper (fallback when Realtime is not connected) ─────────────
  const speakAssistant = useCallback((
    text: string,
    opts?: { onEnd?: () => void; onError?: () => void; timeoutMs?: number }
  ) => {
    console.log('[Donna TTS] speakAssistant called', {
      text: text.slice(0, 100),
      speechSynthesisExists: typeof window !== 'undefined' && 'speechSynthesis' in window,
      voicesLoaded: typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices().length
        : 0,
      selectedVoice: selectedVoiceRef.current?.name ?? 'none',
    })

    if (!isTtsSupported()) {
      console.log('[Donna TTS] speechSynthesis not supported — aborting')
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

    // Only cancel if a tracked utterance is currently active.
    // Calling cancel() immediately before speak() when nothing is playing causes Chrome
    // to fire onerror 'canceled' on the new utterance (internal cancel race condition).
    if (utteranceRef.current !== null) {
      utteranceRef.current = null
      window.speechSynthesis.cancel()
    }

    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.92
    u.pitch = 1
    u.volume = 1
    if (selectedVoiceRef.current) u.voice = selectedVoiceRef.current

    u.onstart = () => {
      console.log('[Donna TTS] onstart fired')
      setIsSpeaking(true)
      setAudioStatus('speaking')
      setAudioWarning(null)
    }

    u.onend = () => {
      console.log('[Donna TTS] onend fired')
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
      console.log('[Donna TTS] onerror fired', { error: e.error })
      utteranceRef.current = null
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      setIsSpeaking(false)
      const errCode = e.error as string
      if (errCode === 'canceled') {
        // Utterance was queued but cancelled before it started — surface actionable guidance.
        setAudioStatus('ready')
        setAudioWarning("Donna's voice was interrupted. Try Browser Voice Mode.")
      } else if (errCode === 'interrupted') {
        // Utterance was cancelled while speaking (expected during stop/repeat) — silent.
        setAudioStatus('ready')
      } else {
        setAudioStatus('error')
        setAudioWarning("Audio didn't play. Check browser sound or switch to typed mode.")
        opts?.onError?.()
        opts?.onEnd?.()
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

    console.log('[Donna TTS] calling window.speechSynthesis.speak()')
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
  // Falls back to browser TTS (speakAssistant) when Realtime is not connected.
  const speakWithTracking = useCallback((text: string, onDone?: () => void) => {
    setLastSpokenAssistantText(text)
    if (!firstSpokenRef.current) {
      firstSpokenRef.current = true
      setDebugFirstSpokenText(text)
    }
    if (text === GUIDED_INTRO_TEXT) setDebugGuidedIntroRequested(true)
    if (isRealtimeConnectedRef.current && !browserVoiceModeRef.current) {
      realtimeVoice.speak(text, onDone)
    } else {
      speakAssistant(text, { onEnd: onDone })
    }
  }, [realtimeVoice.speak, speakAssistant])

  // ── speakPrompt — always sets visible prompt card before speaking ─────────────
  // Rule: every question the AI speaks must also appear on screen as an active prompt.
  // Use this for all question prompts. speakWithTracking alone is for non-question speech.
  // Falls back to browser TTS (speakAssistant) when Realtime is not connected.
  const speakPrompt = useCallback((
    prompt: ActiveVoicePrompt,
    textToSpeak: string,
    onDone?: () => void,
  ) => {
    setActiveVoicePrompt(prompt)
    setLastSpokenAssistantText(textToSpeak)
    if (!firstSpokenRef.current) {
      firstSpokenRef.current = true
      setDebugFirstSpokenText(textToSpeak)
    }
    if (prompt.id === 'director_name') setDebugNamePromptRequested(true)
    if (prompt.id === 'preflight') setDebugPreflightPromptRequested(true)
    if (isRealtimeConnectedRef.current && !browserVoiceModeRef.current) {
      realtimeVoice.speak(textToSpeak, onDone)
    } else {
      speakAssistant(textToSpeak, { onEnd: onDone })
    }
  }, [realtimeVoice.speak, speakAssistant])

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
      // Question was already spoken — move into listening phase immediately.
      setVoiceAnswerPhase('listening_for_answer')
      return
    }

    // Consume any pending ack from acceptAnswer()
    const ack = pendingAckRef.current
    pendingAckRef.current = null
    // Build AssistantPromptContract — single source of truth for screen and voice
    const promptContract = buildAssistantPromptContract(step, resolvedNameRef.current, academyName)
    const exactQ = promptContract.exactQuestionText ?? ''
    const baseSpokenText = promptContract.spokenText // includes casual lead-in
    const textToSpeak = ack ? `${ack} ${baseSpokenText}` : baseSpokenText

    // Track full spoken text (with lead-in) for QA guard and debug panel
    setLastSpokenQuestionText(baseSpokenText)

    // QA guard: spokenText must include exactQuestionText
    if (process.env.NODE_ENV !== 'production') {
      const spokenIncludesExact = baseSpokenText.includes(exactQ)
      if (!spokenIncludesExact) {
        console.warn('Assistant prompt mismatch: spoken text does not include exact screen question.', {
          spokenText: baseSpokenText,
          exactQuestionText: exactQ,
          step,
        })
      }
    }

    // Set active prompt before speaking — question must be visible before voice starts.
    // Sprint 243: when a transition phrase is prepended, include it in spokenText so
    // ActivePromptCard shows the full spoken text (transition + leadIn + question).
    const basePrompt = buildInterviewPrompt(step, resolvedNameRef.current, academyName)
    const voicePromptWithTransition: ActiveVoicePrompt = ack && basePrompt.spokenText
      ? { ...basePrompt, spokenText: `${ack} ${basePrompt.spokenText}` }
      : basePrompt
    setActiveVoicePrompt(voicePromptWithTransition)
    setIsSpeaking(true)
    setAudioStatus('speaking')

    if (isRealtimeConnected) {
      speakWithTracking(textToSpeak, () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
        // Question speech complete — enter listening phase so director knows to answer.
        setVoiceAnswerPhase('listening_for_answer')
      })
      return () => { setIsSpeaking(false) }
    }

    setLastSpokenAssistantText(textToSpeak)
    speakAssistant(textToSpeak, {
      onEnd: () => {
        setIsSpeaking(false)
        setVoiceAnswerPhase('listening_for_answer')
      },
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

  // ── Preflight audio gate handlers ───────────────────────────────────────────
  // Called when director confirms they heard Donna — proceed to Q1.
  function handleHeardDonna() {
    const contract = buildAssistantPromptContract(0, resolvedNameRef.current, academyName)
    const interviewPrompt = buildInterviewPrompt(0, resolvedNameRef.current, academyName)
    setPreflightPhase('ready_for_question_one')
    setActiveVoicePrompt(interviewPrompt)
    setLastSpokenQuestionText(contract.exactQuestionText ?? '')
    setIsSpeaking(true)
    setAudioStatus('speaking')
    if (process.env.NODE_ENV !== 'production') {
      const exactQ = contract.exactQuestionText ?? ''
      if (exactQ && !contract.spokenText.includes(exactQ)) {
        console.warn('Assistant prompt mismatch: spoken text does not include exact screen question.', {
          spokenText: contract.spokenText,
          exactQuestionText: exactQ,
        })
      }
    }
    speakWithTracking(contract.spokenText, () => {
      setIsSpeaking(false)
      setAudioStatus('ready')
      setPreflightPhase('idle')
      setStep(0)
    })
  }

  // Called when director did not hear Donna — enable browser TTS and replay greeting.
  function handleNotHeardDonna() {
    setBrowserVoiceMode(true)
    const welcomeText = buildPersonalizedWelcomeText(resolvedNameRef.current, academyName)
    setIsSpeaking(true)
    setAudioStatus('speaking')
    setAudioWarning(null)
    speakAssistant(welcomeText, {
      onEnd: () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
        // Stay in awaiting_audio_confirmation — director must still confirm they heard it.
      },
      onError: () => {
        setIsSpeaking(false)
        setAudioStatus('ready')
        setAudioWarning("Browser voice didn't start. Check your browser sound settings or continue with typed setup.")
      },
    })
  }

  // ── Voice controls ──────────────────────────────────────────────────────────
  function repeatQuestion() {
    stopAssistantSpeech()
    setVoiceAnswerPhase('listening_for_answer') // reset — question is being re-spoken
    setIsSpeaking(true)
    setAudioStatus('speaking')
    const contract = buildAssistantPromptContract(step, resolvedNameRef.current, academyName)
    const text = contract.spokenText
    setActiveVoicePrompt(buildInterviewPrompt(step, resolvedNameRef.current, academyName))
    if (isRealtimeConnectedRef.current && !browserVoiceModeRef.current) {
      speakWithTracking(text, () => {
        setIsSpeaking(false)
        setVoiceAnswerPhase('listening_for_answer')
      })
    } else {
      setLastSpokenAssistantText(text)
      speakAssistant(text, {
        onEnd: () => { setIsSpeaking(false); setVoiceAnswerPhase('listening_for_answer') },
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
    setVoiceAnswerPhase('idle')
  }

  // Switches to typed mode during welcome or Q1 transition — disconnects Realtime.
  function switchToTypeModePreflight() {
    stopAssistantSpeech()
    if (isRealtimeConnected) realtimeVoice.disconnect()
    hasSentWelcomeRef.current = false
    pendingAckRef.current = null
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
    // During guided_intro, audio gate, name phases, or ready_for_question_one → jump directly to Q1 typed mode
    if (
      preflightPhase === 'guided_intro' ||
      preflightPhase === 'awaiting_audio_confirmation' ||
      preflightPhase === 'name_speaking' ||
      preflightPhase === 'awaiting_name_answer' ||
      preflightPhase === 'name_captured' ||
      preflightPhase === 'ready_for_question_one'
    ) {
      setPreflightPhase('idle')
      setActiveVoicePrompt(null)
      setStep(0)
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
    firstSpokenRef.current = false
    setDebugFirstSpokenText('')
    setDebugGuidedIntroRequested(true) // personalized welcome IS the guided intro
    setDebugNamePromptRequested(false)
    setDebugPreflightPromptRequested(false)
    setPreflightPhase('idle')
    setPreflightAssistantText('')
    setPreflightTypedInput('')
    setDirectorNameTypedInput('')
    setVoiceMode(true)
    setAudioStatus('loading')
    setAudioWarning(null)

    // Resolve director name: welcome screen text input → profile.display_name → null
    const resolvedName = resolveDirectorName(welcomeNameInput, directorProfileName)
    resolvedNameRef.current = resolvedName
    setDirectorDisplayName(resolvedName ?? '')

    // Prime speechSynthesis within the synchronous user-gesture stack.
    // Chrome loses the gesture context on any await — calling cancel() here
    // unlocks speak() for the async continuation of this handler.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      console.log('[Donna TTS] speechSynthesis primed in user-gesture stack before await')
    }

    const ok = await realtimeVoice.connect()

    if (!ok) {
      if (realtimeVoice.status === 'mic-denied') {
        // Mic denied: user must type — no voice path available.
        setVoiceMode(false)
        setAudioStatus('error')
        setAudioWarning('Microphone access denied. You can still complete the setup by typing.')
        return
      }

      // Realtime unavailable (no API key, network error, etc.) — Sprint 290 fallback:
      // Stay in voice mode and guide via browser TTS + browser SpeechRecognition (MicButton).
      // The rest of the interview flow already handles isRealtimeConnected === false via speakAssistant().
      setAudioWarning(
        'Live voice is unavailable, but Donna can still guide you with browser voice and mic answers.',
      )
      const welcomeTextFallback = buildPersonalizedWelcomeText(resolvedName, academyName)
      setPreflightPhase('guided_intro')
      setPreflightAssistantText(welcomeTextFallback)
      setDebugWelcomeSent(true)
      setIsSpeaking(true)
      setAudioStatus('speaking')
      speakAssistant(welcomeTextFallback, {
        onEnd: () => {
          setIsSpeaking(false)
          setAudioStatus('ready')
          hasSentWelcomeRef.current = true
          setDebugFirstRequested(true)
          // Preflight audio gate: director must confirm they heard Donna before Q1 begins.
          setPreflightPhase('awaiting_audio_confirmation')
        },
        onError: () => {
          setAudioWarning("Audio didn't play. Check browser sound or type instead.")
          setPreflightPhase('idle')
          setStep(0)
        },
      })
      return
    }

    // Connected — speak personalized welcome first (GuideIntroCard, not ActivePromptCard).
    // First spoken word is always "Welcome." per AssistantPromptContract spec.
    const welcomeText = buildPersonalizedWelcomeText(resolvedName, academyName)
    setPreflightPhase('guided_intro')
    setPreflightAssistantText(welcomeText)
    setDebugWelcomeSent(true)
    setIsSpeaking(true)
    setAudioStatus('speaking')
    speakWithTracking(welcomeText, () => {
      setIsSpeaking(false)
      setAudioStatus('ready')
      hasSentWelcomeRef.current = true
      setDebugFirstRequested(true)
      // Preflight audio gate: director must confirm they heard Donna before Q1 begins.
      // Do not assume onEnd == audible — autoplay policy can block Realtime audio.
      setPreflightPhase('awaiting_audio_confirmation')
    })
  }

  function startTypeInterview() {
    // Resolve name so the interview summary card shows the director's name
    const resolvedName = resolveDirectorName(welcomeNameInput, directorProfileName)
    resolvedNameRef.current = resolvedName
    setDirectorDisplayName(resolvedName ?? '')
    setVoiceMode(false)
    setAudioStatus('idle')
    setAudioWarning(null)
    setStep(0)
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function confirmAnswer() {
    stopAssistantSpeech()
    setVoiceAnswerPhase('idle') // confirming phase takes over from voice answer phase
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
  // In voice mode, queues a transition phrase so the auto-speak useEffect combines it
  // with the next question: "Perfect. Next question. [leadIn] [question]"
  // App controls the next question — always uses INTERVIEW_STEPS[nextStep].spokenQuestion.
  // Called by: "Looks right — continue" button AND voice confirm command.
  function acceptAnswer() {
    stopAssistantSpeech()
    setVoiceAnswerPhase('idle')
    // Sprint 243 — use natural transition phrase (library, deterministic) for voice path
    if (voiceMode && step < INTERVIEW_STEPS.length - 1) {
      pendingAckRef.current = getSpeechPhrase(NATURAL_TRANSITION_PHRASES, step)
    }
    // Clear transcript state for the next step
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
    setPendingAnswerTranscript('')

    if (step === INTERVIEW_STEPS.length - 1) {
      setStep(7)
    } else {
      setStep(prev => prev + 1)
    }
    setPhase('answering')
  }

  function editAnswer() {
    setVoiceAnswerPhase('idle')
    setPhase('answering')
  }

  function skipAnswer() {
    stopAssistantSpeech()
    setVoiceAnswerPhase('idle')
    const s = INTERVIEW_STEPS[step]
    setAnswers(prev => ({ ...prev, [s.field]: { chips: [], custom: '' } }))
    realtimeVoice.clearUserTranscript()
    lastAppliedTranscriptRef.current = ''
    setPendingAnswerTranscript('')
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
    setVoiceAnswerPhase('idle')
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

  // ── Top-level derived values (available across all render branches) ──────────

  // Answers count — how many steps have at least one chip or custom text
  const capturedAnswersCount = INTERVIEW_STEPS.filter(
    s => buildValue(answers[s.field].chips, answers[s.field].custom).trim().length > 0
  ).length

  // Current question contract — single source of truth for screen + voice question text
  const currentQuestionContract: CurrentQuestionContract | null =
    step >= 0 && step < INTERVIEW_STEPS.length
      ? buildCurrentQuestionContract(step)
      : null

  // Setup context packet — snapshot of current state for personalization and debug
  const setupContext = {
    directorName: directorDisplayName || directorProfileName || null,
    academyName: academyName || null,
    role: 'academy_director',
    timezone: null as null,
    currentScreen: '/director/onboarding/interview',
    currentStage: SETUP_STAGES[getSetupStageIndex(step, preflightPhase)] ?? null,
    currentQuestionId: currentQuestionContract?.id ?? null,
    currentQuestionText: currentQuestionContract?.questionText ?? null,
    completedAnswersCount: capturedAnswersCount,
    completedAnswersSummary: INTERVIEW_STEPS
      .filter(s => buildValue(answers[s.field].chips, answers[s.field].custom).trim().length > 0)
      .map(s => `${s.stepLabel}: ${buildValue(answers[s.field].chips, answers[s.field].custom).slice(0, 60)}`)
      .join('; ') || null,
  }

  // QA: exact question text shown on screen (the locked, canonical question)
  const screenQuestionText =
    activeVoicePrompt?.kind === 'interview'
      ? (activeVoicePrompt.exactQuestionText ?? activeVoicePrompt.questionText ?? null)
      : null
  // QA: spokenIncludesExactQuestion — spoken text (with lead-in) must include the exact question
  const spokenIncludesExactQuestion =
    lastSpokenQuestionText && screenQuestionText
      ? lastSpokenQuestionText.includes(screenQuestionText)
      : null // null = no comparison yet (not on an interview step)
  // Sprint 239 compat alias
  const questionTextMatchesScreen = spokenIncludesExactQuestion

  // Sprint 241 — contract debug fields derived from activeVoicePrompt
  const activePromptContractId =
    activeVoicePrompt?.kind === 'interview' ? (activeVoicePrompt.id ?? null) : null
  const contractScreenText =
    activeVoicePrompt?.kind === 'interview' ? (activeVoicePrompt.spokenText ?? null) : null
  const contractExactQuestionText =
    activeVoicePrompt?.kind === 'interview' ? (activeVoicePrompt.exactQuestionText ?? null) : null

  // Sprint 243 — natural speech derived values (deterministic, library-sourced)
  const selectedLeadInText = step >= 0 && step < INTERVIEW_STEPS.length
    ? getSpeechPhrase(NATURAL_QUESTION_LEAD_INS, step) : ''
  const selectedReviewText = step >= 0 && step < INTERVIEW_STEPS.length
    ? getSpeechPhrase(NATURAL_REVIEW_PHRASES, step) : ''
  const selectedTransitionText = step >= 0 && step < INTERVIEW_STEPS.length
    ? getSpeechPhrase(NATURAL_TRANSITION_PHRASES, step) : ''
  const naturalSpeechEnabled = true

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
    preflightPhase,
    firstSpokenText: debugFirstSpokenText,
    lastSpeechText: lastSpokenAssistantText,
    guidedIntroRequested: debugGuidedIntroRequested,
    namePromptRequested: debugNamePromptRequested,
    preflightPromptRequested: debugPreflightPromptRequested,
    // Sprint 239 — setup context + question lock fields
    setupDirectorName: setupContext.directorName,
    setupAcademyName: setupContext.academyName,
    setupCurrentStage: setupContext.currentStage,
    setupCompletedAnswersCount: setupContext.completedAnswersCount,
    currentQuestionId: currentQuestionContract?.id ?? null,
    currentQuestionText: currentQuestionContract?.questionText ?? null,
    spokenQuestionText: lastSpokenQuestionText || null,
    screenQuestionText,
    questionTextMatchesScreen,
    // Sprint 241 — AssistantPromptContract debug fields
    activePromptContractId,
    contractScreenText,
    contractSpokenText: lastSpokenQuestionText || null,
    contractExactQuestionText,
    spokenIncludesExactQuestion,
    // Sprint 242 — voice answer confirmation loop debug fields
    voiceAnswerPhase,
    pendingAnswerTranscriptLen: pendingAnswerTranscript.length,
    editableAnswerTextLen: step >= 0 && step < INTERVIEW_STEPS.length
      ? answers[INTERVIEW_STEPS[step].field].custom.length
      : 0,
    lastConfirmationCommand,
    confirmationCommandDetected: !!lastConfirmationCommand,
    autoAdvanceAfterVoiceConfirm: true,
    // Sprint 243 — natural speech debug fields
    selectedLeadInText,
    selectedReviewText,
    selectedTransitionText,
    naturalSpeechEnabled,
    finalSpokenText: lastSpokenAssistantText || undefined,
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WELCOME — PREFLIGHT ACTIVE (voice connected, opening script spoken/speaking)
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === -1 && preflightPhase !== 'idle') {
    return (
      <div className="space-y-6">
        <SetupProgressIndicator activeStage={getSetupStageIndex(-1, preflightPhase)} />

        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <AssistantDot speaking={isSpeaking} listening={false} />
            <AssistantStatus speaking={isSpeaking} listening={false} />
            <span className="label-xs ml-1">{DONNA_SETUP_LABEL}</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">Voice-led setup</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Listen first. The assistant will guide you. You can answer out loud or use the buttons below.
          </p>
        </div>

        {/* Guided intro card — shown during 'guided_intro' phase only. Not an answerable question. */}
        {preflightPhase === 'guided_intro' && (
          <GuideIntroCard text={preflightAssistantText || GUIDED_INTRO_TEXT} isSpeaking={isSpeaking} />
        )}

        {/* Assistant opening explanation bubble — shown after guided intro, hidden during Q1 transition */}
        {preflightPhase !== 'guided_intro' && preflightPhase !== 'ready_for_question_one' && preflightAssistantText && (
          <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-xs font-medium text-lime">Assistant</p>
              {isSpeaking && isRealtimeConnected && (
                <AssistantDot speaking={true} listening={false} />
              )}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {preflightAssistantText}
            </p>
          </div>
        )}

        {/* Active Prompt Card — always visible when a question prompt is active */}
        {activeVoicePrompt && (
          <ActivePromptCard prompt={activeVoicePrompt} />
        )}

        {/* Audio confirmation gate — shown after Donna's greeting, before Q1 */}
        {preflightPhase === 'awaiting_audio_confirmation' && (
          <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1">
            <p className="text-sm font-medium text-text-primary">Did you hear Donna?</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Confirm before the interview begins so voice stays in sync.
            </p>
          </div>
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
              Looks right — continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePreflightResponse('no questions')}
              disabled={isSpeaking}
              className={`w-full ${BTN_GHOST}`}
            >
              Start the setup
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

        {/* Browser Voice Mode — bypass Realtime when connected but audio isn't audible */}
        {browserVoiceMode ? (
          <p className="text-[11px] text-lime px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block shrink-0" />
            Browser voice mode active
          </p>
        ) : (voiceMode && isRealtimeConnected && !isSpeaking && (
          <button
            type="button"
            onClick={() => setBrowserVoiceMode(true)}
            className="w-full text-xs py-2 px-3 rounded-xl border border-border text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
          >
            Use Browser Voice Instead
          </button>
        ))}

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
          {/* Audio confirmation gate — three-path decision */}
          {preflightPhase === 'awaiting_audio_confirmation' && (
            <>
              <button
                type="button"
                onClick={handleHeardDonna}
                disabled={isSpeaking}
                className={`w-full ${BTN_LIME}`}
              >
                Yes, I heard her
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNotHeardDonna}
                disabled={isSpeaking}
                className={`w-full ${BTN_GHOST}`}
              >
                No, try Browser Voice
              </button>
              <button
                type="button"
                onClick={switchToTypeModePreflight}
                className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Continue with Typed Setup
              </button>
            </>
          )}

          {/* Guided intro — skip button so director is never blocked */}
          {preflightPhase === 'guided_intro' && (
            <button
              type="button"
              onClick={() => {
                stopAssistantSpeech()
                setIsSpeaking(false)
                setAudioStatus('ready')
                // Skip welcome → go straight to Q1 (no name capture, no preflight Q&A)
                hasSentWelcomeRef.current = true
                const contract = buildAssistantPromptContract(0, resolvedNameRef.current, academyName)
                const interviewPrompt = buildInterviewPrompt(0, resolvedNameRef.current, academyName)
                setPreflightPhase('ready_for_question_one')
                setActiveVoicePrompt(interviewPrompt)
                setLastSpokenQuestionText(contract.exactQuestionText ?? '')
                setIsSpeaking(true)
                setAudioStatus('speaking')
                speakWithTracking(contract.spokenText, () => {
                  setIsSpeaking(false)
                  setAudioStatus('ready')
                  setPreflightPhase('idle')
                  setStep(0)
                })
              }}
              className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Skip intro
            </button>
          )}

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
                Start the setup
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
        <SetupProgressIndicator activeStage={0} />

        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <AssistantDot speaking={isSpeaking} listening={false} />
            <span className="label-xs">{DONNA_SETUP_LABEL}</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">
            Customize Your Academy OS
          </h2>
        </div>

        {/* Assistant intro bubble */}
        <div className="px-4 py-3.5 rounded-xl bg-surface-raised border border-lime/15 space-y-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-medium text-lime">{DONNA_SETUP_LABEL}</p>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Seven questions — your philosophy, how you group players, what your coaches need, and what a
            successful 90 days looks like. About 3 minutes.
          </p>
        </div>

        {/* How this works — process card */}
        <div className="space-y-2">
          <p className="label-xs text-text-muted">How this works</p>
          {[
            'I ask one question at a time.',
            'You answer naturally — voice, chips, or type.',
            'You review what I heard.',
            'You approve before we continue.',
            'Nothing is finalized until you save.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-mono text-lime">{i + 1}</span>
              </span>
              <p className="text-sm text-text-secondary">{item}</p>
            </div>
          ))}
        </div>

        {/* Director name — show profile name greeting or text input for name capture */}
        {directorProfileName ? (
          <div className="px-4 py-3 rounded-xl bg-surface border border-border/60">
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Director</p>
            <p className="text-sm text-text-primary">{directorProfileName}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="label-xs" htmlFor="welcome-name-input">
              What should your assistant call you? <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="welcome-name-input"
              type="text"
              value={welcomeNameInput}
              onChange={e => setWelcomeNameInput(e.target.value)}
              maxLength={60}
              placeholder="Your first name…"
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
          </div>
        )}

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
                  <><Volume2 className="w-4 h-4" />Start Guided Setup</>
                )}
              </button>
              {realtimeVoice.voiceReadiness === 'preparing' && !isConnecting && (
                <p className="text-[10px] text-text-muted text-center">Getting the assistant ready…</p>
              )}
              {realtimeVoice.voiceReadiness === 'ready' && !isConnecting && !voiceMode && (
                <p className="text-[10px] text-text-muted text-center">Voice is ready. Press start and the assistant will guide you.</p>
              )}
              {!voiceMode && (
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTestVoiceFailed(false)
                      speakAssistant(
                        "Testing browser voice. Donna is here.",
                        { onError: () => setTestVoiceFailed(true) },
                      )
                    }}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-lime/25 text-lime/70 hover:border-lime/50 hover:text-lime hover:bg-lime/5 transition-colors"
                  >
                    Test Browser Voice
                  </button>
                  {testVoiceFailed && (
                    <p className="text-[11px] text-status-orange px-1">
                      Browser voice did not start. Click Test Browser Voice again or check your browser sound settings.
                    </p>
                  )}
                  {browserVoiceMode ? (
                    <p className="text-[11px] text-lime px-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block shrink-0" />
                      Browser voice mode active
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBrowserVoiceMode(true)}
                      className="w-full text-xs py-2 px-3 rounded-xl border border-border text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors"
                    >
                      Use Browser Voice Instead
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <button
            type="button"
            onClick={startTypeInterview}
            disabled={isConnecting}
            className={`w-full ${BTN_GHOST}`}
          >
            {ttsSupported ? "I'd rather type" : 'Start Setup'}
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
  // SUCCESS — COMPLETION SUMMARY (Sprint 248)
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 8) {
    const summaryGroups: Array<{ label: string; steps: InterviewStep[] }> = [
      {
        label: 'Academy Identity',
        steps: [INTERVIEW_STEPS[0]], // philosophy
      },
      {
        label: 'How Your Academy Works',
        steps: [INTERVIEW_STEPS[2], INTERVIEW_STEPS[3]], // development_priorities, competition_approach
      },
      {
        label: 'Player Development',
        steps: [INTERVIEW_STEPS[1], INTERVIEW_STEPS[6]], // player_focus, ninety_day_success
      },
      {
        label: 'Coaching & Parent',
        steps: [INTERVIEW_STEPS[5], INTERVIEW_STEPS[4]], // coach_operating_style, parent_communication_style
      },
    ]

    return (
      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center gap-3 pt-2 pb-1">
          <div className="w-10 h-10 rounded-full bg-status-green/10 border border-status-green/25 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-status-green" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-text-primary">Academy Setup Captured</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
              Here&apos;s what Academy OS learned about your academy. You can refine any answer later.
            </p>
          </div>
        </div>

        {/* ── Captured answers — grouped ── */}
        <div className="space-y-5">
          {summaryGroups.map(group => (
            <div key={group.label}>
              <p className="label-xs mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.steps.map(s => {
                  const value = buildValue(answers[s.field].chips, answers[s.field].custom)
                  const display = value.length > 100 ? `${value.slice(0, 100)}…` : value
                  return (
                    <div key={s.field} className="px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{s.stepLabel}</p>
                      {display ? (
                        <p className="text-sm text-text-secondary mt-0.5 leading-snug">{display}</p>
                      ) : (
                        <p className="text-xs text-text-muted/60 italic mt-0.5">You can refine this later.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── What Academy OS can now do ── */}
        <div className="px-4 py-4 rounded-xl bg-lime/5 border border-lime/20 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-xs font-semibold text-lime">Academy OS can now</p>
          </div>
          <ul className="space-y-1.5">
            {[
              'Personalize your setup path',
              'Recommend curriculum next steps',
              'Shape player profile structure',
              'Guide coach workflow configuration',
              'Prepare parent and player communication rules',
              'Recommend launch priorities',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-lime shrink-0" />
                <span className="text-sm text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Progress message ── */}
        <p className="text-[11px] text-text-muted leading-relaxed">
          Donna setup complete. Next, approve your curriculum spine so Academy OS can connect players, sessions, and development levels.
        </p>

        {/* ── Next step CTAs ── */}
        <div className="space-y-2.5">
          <Link href="/director/onboarding/curriculum" className={`w-full ${BTN_LIME}`}>
            Continue to Curriculum Setup
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/director/onboarding" className={`w-full ${BTN_GHOST}`}>
            Return to Onboarding
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/director"
            className="w-full flex items-center justify-center text-xs text-text-muted hover:text-text-secondary transition-colors py-1.5"
          >
            Go to Dashboard
          </Link>
        </div>

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

  // Setup stage index — drives both ProgressRow indicator and AcademySummaryCard
  const currentSetupStage = getSetupStageIndex(step, preflightPhase)

  // Summary card data
  const nextStepLabel = step < INTERVIEW_STEPS.length - 1
    ? INTERVIEW_STEPS[step + 1].stepLabel
    : 'Review'

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
          setupStageIndex={currentSetupStage}
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
        setupStageIndex={currentSetupStage}
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

          {/* Browser Voice Mode status and toggle */}
          {browserVoiceMode ? (
            <p className="text-[10px] text-lime flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block shrink-0" />
              Browser voice mode active
            </p>
          ) : (isRealtimeConnected && !isSpeaking && (
            <button
              type="button"
              onClick={() => setBrowserVoiceMode(true)}
              className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              Use Browser Voice Instead
            </button>
          ))}
        </div>
      )}

      {/* Type mode: manual play button */}
      {!voiceMode && ttsSupported && (
        <button
          type="button"
          onClick={() => {
            const contract = buildAssistantPromptContract(step, resolvedNameRef.current, academyName)
            speakAssistant(contract.spokenText)
          }}
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

      {/* ── Voice capture status — three-branch per voiceAnswerPhase ─────────── */}
      {voiceMode && isRealtimeConnected && !isSpeaking && (
        <>
          {/* ── A. Review state — answer captured, awaiting confirmation ─────── */}
          {(voiceAnswerPhase === 'review_answer' || voiceAnswerPhase === 'listening_for_confirmation') ? (
            <div className="px-4 py-4 rounded-xl bg-surface border border-lime/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
                <p className="text-xs font-semibold text-status-green">Here&apos;s what I heard</p>
              </div>
              {/* Sprint 243 — review phrase visible on screen, mirrors what assistant says */}
              {selectedReviewText && (
                <p className="text-xs text-text-secondary italic">&ldquo;{selectedReviewText}&rdquo;</p>
              )}
              <p className="text-[10px] text-text-muted leading-relaxed">
                Say{' '}
                <span className="text-text-secondary font-medium">&ldquo;confirm&rdquo;</span>{' '}
                to continue,{' '}
                <span className="text-text-secondary font-medium">&ldquo;edit&rdquo;</span>{' '}
                to change it, or{' '}
                <span className="text-text-secondary font-medium">&ldquo;redo&rdquo;</span>{' '}
                to answer again.
              </p>
            </div>
          ) : voiceAnswerPhase === 'listening_for_answer' ? (
            /* ── B. Listening state — question spoken, waiting for answer ─────── */
            <div className="px-4 py-3 rounded-xl bg-surface-raised border border-status-blue/20 space-y-1.5">
              <div className="flex items-center gap-2">
                {realtimeVoice.speechStarted ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-status-blue animate-pulse shrink-0" />
                    <p className="text-xs text-status-blue font-medium">Listening…</p>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-status-blue/60 shrink-0" />
                    <p className="text-xs text-text-secondary">Answer naturally. I&apos;ll write it out for you.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── C. Idle / fallback — existing behaviour ─────────────────────── */
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
        </>
      )}

      {/* Active Prompt Card — shown in voice mode so director always sees what was asked */}
      {voiceMode && activeVoicePrompt && (
        <ActivePromptCard prompt={activeVoicePrompt} />
      )}

      {/* Question — shown in typed mode or when no active prompt (fallback) */}
      {(!voiceMode || !activeVoicePrompt) && (
        <div className="space-y-1.5">
          {simpler && (
            <p className="text-[10px] text-lime px-1 pb-1">
              No problem — pick whichever feels closest, or add a quick note in your own words.
            </p>
          )}
          <div className="space-y-0.5 mb-1">
            <p className="label-xs text-text-muted">Why this matters</p>
            <p className="text-xs text-text-secondary leading-relaxed">{currentStep.helperCopy}</p>
          </div>
          <h2 className="text-base font-semibold text-text-primary leading-snug">
            {getStepQuestion(step)}
          </h2>
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

      {/* Browser STT mic button — typed mode, or voice mode when Realtime is not connected */}
      {(!voiceMode || !isRealtimeConnected) && (
        <MicButton
          onTranscript={(text) => appendTranscript(field, text)}
          disabled={isSpeaking}
        />
      )}

      {/* Custom text area — pre-populated by Realtime transcript when in voice mode.
          In review_answer the label changes to signal the transcript is editable. */}
      <div className="space-y-1.5">
        <label className="label-xs">
          {voiceMode && (voiceAnswerPhase === 'review_answer' || voiceAnswerPhase === 'listening_for_confirmation')
            ? 'Here\'s what I heard — edit if needed'
            : voiceMode
            ? 'Your answer (edit as needed)'
            : 'Your own words (optional)'}
        </label>
        <textarea
          ref={editableAnswerRef}
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

      {/* Building your Academy OS — in-progress summary card */}
      <AcademySummaryCard
        directorName={directorDisplayName}
        currentStepLabel={currentStep.stepLabel}
        answersCount={capturedAnswersCount}
        nextStepLabel={nextStepLabel}
      />

      {/* ── Review action buttons — shown when answer is captured in voice mode ─ */}
      {/* These are the click fallbacks for the voice commands. Always visible so  */}
      {/* the director is never blocked even if voice detection doesn't work.      */}
      {voiceMode && (voiceAnswerPhase === 'review_answer' || voiceAnswerPhase === 'listening_for_confirmation') && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="label-xs text-text-muted">Confirmation</p>
          <button
            type="button"
            onClick={acceptAnswer}
            className={`w-full ${BTN_LIME}`}
          >
            {isLast ? 'Looks right — show me the review' : 'Looks right — continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { editableAnswerRef.current?.focus() }}
              className={`flex-1 ${BTN_GHOST}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingAnswerTranscript('')
                setAnswers(prev => ({ ...prev, [field]: { ...prev[field], custom: '' } }))
                realtimeVoice.clearUserTranscript()
                lastAppliedTranscriptRef.current = ''
                setVoiceAnswerPhase('listening_for_answer')
              }}
              className={`flex-1 ${BTN_GHOST}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Redo answer
            </button>
          </div>
          <button
            type="button"
            onClick={repeatQuestion}
            className={`w-full ${BTN_GHOST}`}
          >
            <RefreshCw className="w-3 h-3" />
            Repeat question
          </button>
          <button
            type="button"
            onClick={switchToTypeMode}
            className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
          >
            Type instead
          </button>
        </div>
      )}

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
  setupStageIndex,
}: {
  step: number
  total: number
  label: string
  pct: number
  voiceMode: boolean
  isSpeaking: boolean
  isListening: boolean
  setupStageIndex?: number
}) {
  return (
    <div className="space-y-2">
      {setupStageIndex !== undefined && (
        <SetupProgressIndicator activeStage={setupStageIndex} />
      )}
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
    </div>
  )
}

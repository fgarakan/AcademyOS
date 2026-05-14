'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight, Mic, Layers, Inbox,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { VoiceInputButton } from '@/components/assistant/VoiceInputButton'
import { TemplateDraftPanel } from '@/components/assistant/TemplateDraftPanel'
import type { TemplateDraft, TemplateDraftQuestion } from '@/components/assistant/templateDraftTypes'
import {
  isTemplateCreationIntent,
  parseTemplateDraft,
  applyAnswerToField,
  isDraftReadyForReview,
  extractLevel,
} from '@/components/assistant/templateDraftParser'
import { resolvePageContext } from '@/components/assistant/donnaPageContextRegistry'
import { deriveContextRequest } from '@/components/assistant/donnaContextTypes'
import type { DonnaContextSummary } from '@/components/assistant/donnaContextTypes'
import { fetchDonnaContext } from '@/app/director/_actions/donnaContextActions'
// Sprint 266 — Task Runtime + Draft Builder
import { DONNA_TASK_CONTRACTS } from '@/components/assistant/donnaTaskContracts'
import type { DonnaTaskId } from '@/components/assistant/donnaTaskContracts'
import { detectTaskIntent } from '@/components/assistant/donnaTaskRuntime'
import {
  getNextMissingQuestion,
  isTaskDraftComplete,
} from '@/components/assistant/donnaMissingQuestionEngine'
import type { GenericTaskDraft } from '@/components/assistant/donnaGenericDraftTypes'
import { createEmptyGenericDraft, applyAnswerToGenericDraft } from '@/components/assistant/donnaGenericDraftTypes'
import { GenericDraftPanel } from '@/components/assistant/GenericDraftPanel'
import { getAvailableTasksForPage } from '@/components/assistant/donnaPageTaskRouter'
// Sprint 267 — Predictive Intelligence + Ambiguity-Aware Routing
import { computePredictiveSuggestions } from '@/components/assistant/donnaPredictiveSuggestions'
import type { DonnaSuggestion } from '@/components/assistant/donnaPredictiveSuggestions'
import { DonnaSuggestionCard } from '@/components/assistant/DonnaSuggestionCard'
// Sprint 268 — Approval Execution
// Sprint 270 — Session Draft Execution
// Sprint 271 — Session Block Population
import {
  saveFitnessTemplateDraftAction,
  saveCoachNoteDraftAction,
  saveSessionDraftAction,
  populateSessionBlocksAction,
  savePlayerNoteDraftAction,
} from '@/app/director/_actions/donnaDraftExecutionActions'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'
// Sprint 273 — Review Queue Command Center
import { getDonnaReviewQueueAction } from '@/app/director/_actions/donnaReviewQueueActions'
// Sprint 274 — Attendance Exception Workflow
import { saveAttendanceExceptionDraftAction } from '@/app/director/_actions/donnaAttendanceActions'
// Sprint 275-277 — Director Intelligence Layer
import {
  saveParentUpdateDraftAction,
  saveLevelReadinessDraftAction,
  saveCurriculumAdjustmentDraftAction,
} from '@/app/director/_actions/donnaDirectorIntelligenceActions'
// Sprint 282 — Coach Communication Draft
import { saveCoachCommunicationDraftAction } from '@/app/director/_actions/saveCoachCommunicationDraftAction'
// Sprint 286 — Multi-step planner
import { detectMultiStepIntent } from '@/components/assistant/donnaMultiStepPlanner'
import type { DonnaMultiStepPlan } from '@/components/assistant/donnaMultiStepPlanner'
// Sprint 289 — Voice UI types
import type { DonnaVoiceTranscriptState } from '@/components/assistant/donnaVoiceUiTypes'
// Sprint 290 — Onboarding flow
import {
  DONNA_ONBOARDING_STEPS,
  isOnboardingActive,
} from '@/components/assistant/donnaOnboardingFlow'
// Sprint 297 — Realtime voice output hook (output-only, no mic)
import { useDonnaRealtimeVoice } from '@/components/assistant/useDonnaRealtimeVoice'
// Mega Sprint 297–310 — Unified voice runtime types + utilities
import {
  type DonnaVoiceMode,
  isProtectedVoicePhrase,
  VOICE_PROTECTED_RESPONSE,
  isOnboardingRoutingPhrase,
  ONBOARDING_ROUTING_RESPONSE,
  detectWakePhrase,
  extractCommandAfterWake,
  getFallbackMessage,
} from '@/components/assistant/donnaVoiceRuntime'
// Mega Sprint 297–310 — Dev-only QA harness
import { DonnaVoiceDiagnostics } from '@/components/assistant/DonnaVoiceDiagnostics'
// Sprint 291 — Centralized copy
import {
  DONNA_PUBLIC_NAME,
  DONNA_PUBLIC_TITLE,
  DONNA_FULL_LABEL,
  DONNA_ACTIVATION_HELP,
  DONNA_SAFETY_REMINDER,
  DONNA_WAKE_LABEL,
  DONNA_WAKE_ACTIVE_LABEL,
  DONNA_HEARD_CONFIRM,
  DONNA_NOT_HEARD_CONFIRM,
} from '@/components/assistant/donnaAssistantCopy'
import type { DonnaReviewQueueSummary } from '@/components/assistant/donnaReviewQueueTypes'
import { DonnaReviewQueuePanel } from '@/components/assistant/DonnaReviewQueuePanel'
// Sprint 269 — Safe Object Resolution
import { DonnaObjectResolverPanel } from '@/components/assistant/DonnaObjectResolverPanel'
import { resolveDonnaObjectAction } from '@/app/director/_actions/donnaObjectResolutionActions'
import type {
  DonnaObjectResolutionResult,
  DonnaResolvedObjectCandidate,
} from '@/components/assistant/donnaObjectResolutionTypes'
import {
  FIELD_RESOLUTION_MAP,
  fieldNeedsResolution,
  looksLikeUserTypedName,
} from '@/components/assistant/donnaObjectResolutionTypes'
import { getCurrentPageObject } from '@/components/assistant/donnaCurrentObjectContext'

// ---------------------------------------------------------------------------
// Wired task IDs — tasks that have a real server action behind them.
// Only these show "Approve and Save"; all others show "Save not yet available".
// ---------------------------------------------------------------------------

const WIRED_TASK_IDS = new Set<DonnaTaskId>([
  'create_fitness_template',
  'capture_coach_note',
  'create_session',
  'populate_session_from_template',
  'draft_player_note',
  'handle_attendance_exception',
  'draft_parent_update',
  'review_level_readiness',
  'adjust_curriculum',
  'draft_coach_communication',
])

// ---------------------------------------------------------------------------
// Donna guided task infrastructure — local types only, no DB, no API.
// Proves the guided completion loop with class templates first.
// Sprint 266 expands to generic contract-only tasks via GenericDraftPanel.
// ---------------------------------------------------------------------------

type GuidedTaskKind = 'class_template'

type GuidedTaskState = {
  kind: GuidedTaskKind
  phase: 'collecting_context' | 'ready_for_review' | 'saved'
}

// ---------------------------------------------------------------------------
// Route context and prompt suggestions are managed by donnaPageContextRegistry.ts
// ---------------------------------------------------------------------------

interface CommandResponse {
  message: string
  type: 'info' | 'honest'
  label?: string
}

// ---------------------------------------------------------------------------
// Quick links
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: 'Players',      href: '/director/players' },
  { label: 'Sessions',     href: '/director/sessions' },
  { label: 'Curriculum',   href: '/director/curriculum' },
  { label: 'Review Queue', href: '/director/review' },
  { label: 'Onboarding',   href: '/director/onboarding' },
]

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------

type AssistantMode = 'guide' | 'explain' | 'find' | 'capture' | 'create_template' | 'guided_task' | 'review_queue'

interface ModeConfig {
  mode: AssistantMode
  label: string
  desc: string
  Icon: React.ElementType
}

const MODES: ModeConfig[] = [
  {
    mode: 'create_template',
    label: 'Create Template',
    desc: 'Draft a class template with Donna. Nothing saves until you approve.',
    Icon: Layers,
  },
  {
    mode: 'guide',
    label: 'Guide me',
    desc: 'See the suggested next step for this page.',
    Icon: Compass,
  },
  {
    mode: 'find',
    label: 'Find something',
    desc: 'Jump to players, sessions, curriculum, or review items.',
    Icon: Search,
  },
  {
    mode: 'capture',
    label: 'Capture a note',
    desc: 'Save a player observation or capture a director thought.',
    Icon: PenLine,
  },
  {
    mode: 'explain',
    label: 'Explain this screen',
    desc: 'Understand what this page is for.',
    Icon: BookOpen,
  },
]

// Template creation quick-start examples — deterministic, no AI
const TEMPLATE_QUICK_STARTS = [
  'Create a template for Orange 2 with standard warm-up, dynamic warm-up, rally skills, point play, and matches.',
  'Build a Yellow 1 class with warm-up, technical work, point play, and match play.',
  'Create a 60-minute Red 2 template with warm-up, rally skills, and matches.',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  academyId: string
  directorName?: string
}

export function DonnaAssistantButton({ academyId, directorName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [panelOpen, setPanelOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<AssistantMode | null>(null)

  // Sprint 297 — Realtime voice output (primary path, no mic required)
  const {
    status: realtimeStatus,
    unavailableReason: realtimeUnavailableReason,
    connect: realtimeConnect,
    disconnect: realtimeDisconnect,
    speak: realtimeSpeak,
  } = useDonnaRealtimeVoice()

  // Spoken greeting — fires once on first intentional panel open, never again in this session
  const hasGreetedRef = useRef(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const firstName = directorName ? directorName.split(' ')[0] : null
  const greetingText = firstName
    ? `Hi ${firstName}, how can I help you today?`
    : 'Welcome. How can I help you today?'

  // Shared speech helper — cancel any active speech, then speak new text.
  // Must be called from user-interaction event handlers to satisfy browser autoplay rules.
  // lastSpokenTextRef prevents the same string from being spoken twice in a row.
  const lastSpokenTextRef = useRef<string | null>(null)
  // Timestamp of the last successful speak() call — used for the 1500ms duplicate guard.
  const lastSpokenAtRef = useRef<number>(0)
  // State key for the last spoken prompt — catches duplicates when the text ref is cleared
  // but the same onboarding step or question fires again within the same session.
  const lastSpokenKeyRef = useRef<string | null>(null)
  // Tracks the active utterance so cancel() is only called when one is actually in flight.
  // Unconditional cancel() before speak() triggers Chrome onerror: "canceled" race condition.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  // Sprint 296B — greeting voice status and watchdog for stuck-state detection
  const [voiceGreetingStatus, setVoiceGreetingStatus] = useState<
    'idle' | 'starting' | 'speaking' | 'stalled' | 'done' | 'error'
  >('idle')
  const voiceWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playVersionRef = useRef<number>(0)
  // Tracks which voice mode was actually used to produce audio (set in playOnboardingVoice)
  const activatedVoiceModeRef = useRef<DonnaVoiceMode>('realtime')

  // Mega Sprint 297–310 — voice output confirmation after speak()
  // null = not yet confirmed, true = heard, false = not heard
  const [voiceOutputConfirmed, setVoiceOutputConfirmed] = useState<boolean | null>(null)

  // Mega Sprint 297–310 — wake phrase ("Hey Donna") in-panel listener
  // No global always-listening. Only active when panel is open and director clicks listen.
  type WakeSpeechRecognition = {
    continuous: boolean; interimResults: boolean; lang: string
    onresult: ((e: { results: { length: number; [i: number]: { isFinal: boolean; [i: number]: { transcript: string } } } }) => void) | null
    onerror: (() => void) | null; onend: (() => void) | null
    start(): void; stop(): void; abort(): void
  }
  const wakeRecognitionRef = useRef<WakeSpeechRecognition | null>(null)
  const [wakeListeningActive, setWakeListeningActive] = useState(false)
  const [wakeDetectedCommand, setWakeDetectedCommand] = useState<string | null>(null)

  function speakAssistantText(text: string, onStatus?: (status: 'speaking' | 'done' | 'error') => void) {
    console.log('[Donna TTS] speakAssistantText called', {
      text: text.slice(0, 100),
      speechSynthesisExists: typeof window !== 'undefined' && 'speechSynthesis' in window,
      voicesLoaded: typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices().length
        : 0,
    })
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('[Donna TTS] speechSynthesis not available — aborting')
      return
    }

    const now = Date.now()
    const msSinceLast = now - lastSpokenAtRef.current

    // Guard 1 — timestamp + text: same text spoken within 1500ms (catches StrictMode
    // double-invocation and onstart→setIsSpeaking→re-render triggered duplicate calls).
    if (lastSpokenTextRef.current === text && msSinceLast < 1500) {
      console.log('[Donna TTS] 1500ms duplicate guard — skipping', { text: text.slice(0, 60), msSinceLast })
      return
    }

    // Guard 2 — state key: same onboarding step or free-text key already spoken.
    // Cleared explicitly when advancing steps or resetting speech state.
    const stateKey = onboardingStep !== null ? `onboarding:${onboardingStep}` : `free:${text.slice(0, 40)}`
    if (lastSpokenKeyRef.current === stateKey) {
      console.log('[Donna TTS] state-key duplicate guard — skipping', { stateKey })
      return
    }

    lastSpokenTextRef.current = text
    lastSpokenAtRef.current = now
    lastSpokenKeyRef.current = stateKey

    // Cancel any active or stuck utterance before queueing a new one.
    // Only cancel when tracked, or when stuck with no tracked utterance, to avoid the Chrome
    // race where cancel() + speak() on an idle queue causes the new utterance to be canceled.
    if (utteranceRef.current !== null) {
      utteranceRef.current = null
      window.speechSynthesis.cancel()
    } else if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      // Stuck state with no tracked utterance — free the queue before re-queueing.
      window.speechSynthesis.cancel()
    }
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 1.0
    utt.pitch = 1.0
    utt.onstart = () => {
      console.log('[Donna TTS] speakAssistantText onstart fired')
      setIsSpeaking(true)
      onStatus?.('speaking')
    }
    utt.onend = () => {
      console.log('[Donna TTS] speakAssistantText onend fired')
      utteranceRef.current = null
      setIsSpeaking(false)
      onStatus?.('done')
    }
    utt.onerror = (e) => {
      console.log('[Donna TTS] speakAssistantText onerror fired', {
        error: e.error,
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending,
        paused: window.speechSynthesis.paused,
        lastSpokenText: lastSpokenTextRef.current?.slice(0, 60),
      })
      utteranceRef.current = null
      setIsSpeaking(false)
      onStatus?.('error')
    }
    utteranceRef.current = utt
    console.log('[Donna TTS] calling window.speechSynthesis.speak()')
    window.speechSynthesis.speak(utt)
  }

  // Isolated TTS test — does NOT touch guard refs or onboardingStep.
  // Only use for the "Test Donna browser voice" button to rule out guard interference.
  function testBrowserVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTestVoiceStatus('error')
      return
    }
    setTestVoiceStatus('speaking')
    const utt = new SpeechSynthesisUtterance('Testing browser voice. Donna is here.')
    utt.onstart = () => setTestVoiceStatus('speaking')
    utt.onend = () => setTestVoiceStatus('done')
    utt.onerror = () => setTestVoiceStatus('error')
    window.speechSynthesis.speak(utt)
  }

  // Sprint 297 — Play onboarding voice.
  // Primary: OpenAI Realtime (output-only WebRTC, no mic required).
  // Fallback: browser speechSynthesis with 1500ms watchdog (Sprint 296B).
  // Must be called from a user gesture (button onClick) for both paths.
  async function playOnboardingVoice() {
    const version = playVersionRef.current + 1
    playVersionRef.current = version

    setVoiceGreetingStatus('starting')

    const text = onboardingStep !== null
      ? (DONNA_ONBOARDING_STEPS[onboardingStep]?.spokenText ?? DONNA_ONBOARDING_STEPS[0].spokenText)
      : DONNA_ONBOARDING_STEPS[0].spokenText

    // ── Path 1: Realtime (primary) ────────────────────────────────────────────
    // Skip immediately if Realtime is already known to be unavailable or errored.
    if (realtimeStatus !== 'unavailable' && realtimeStatus !== 'error') {
      const result = await realtimeConnect()
      if (playVersionRef.current !== version) return // panel closed during connect
      if (result.ok) {
        activatedVoiceModeRef.current = 'realtime'
        setVoiceGreetingStatus('speaking')
        realtimeSpeak(text, () => {
          if (playVersionRef.current === version) setVoiceGreetingStatus('done')
        })
        return
      }
      // Realtime failed (bad token, SDP error, etc.) — fall through to browser TTS
      console.warn('[Donna] Realtime connect failed:', result.reason)
    }

    // ── Path 2: Browser TTS (fallback) ────────────────────────────────────────
    activatedVoiceModeRef.current = 'browser'
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceGreetingStatus('error')
      return
    }

    // Clear dedup guards so the same text isn't blocked by a prior guard state.
    lastSpokenTextRef.current = null
    lastSpokenKeyRef.current = null

    // Watchdog — if onstart doesn't fire within 1500ms, mark as stalled.
    if (voiceWatchdogRef.current !== null) clearTimeout(voiceWatchdogRef.current)
    voiceWatchdogRef.current = setTimeout(() => {
      if (playVersionRef.current === version) {
        setVoiceGreetingStatus('stalled')
        voiceWatchdogRef.current = null
      }
    }, 1500)

    speakAssistantText(text, (callbackStatus) => {
      if (playVersionRef.current !== version) return
      if (callbackStatus === 'speaking') {
        if (voiceWatchdogRef.current !== null) {
          clearTimeout(voiceWatchdogRef.current)
          voiceWatchdogRef.current = null
        }
        setVoiceGreetingStatus('speaking')
      } else if (callbackStatus === 'done') {
        setVoiceGreetingStatus('done')
      } else {
        setVoiceGreetingStatus('error')
      }
    })
  }

  // Sprint 296B — Reset stuck voice state without closing the panel.
  function resetVoice() {
    if (voiceWatchdogRef.current !== null) {
      clearTimeout(voiceWatchdogRef.current)
      voiceWatchdogRef.current = null
    }
    playVersionRef.current += 1
    utteranceRef.current = null
    lastSpokenTextRef.current = null
    lastSpokenAtRef.current = 0
    lastSpokenKeyRef.current = null
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setVoiceGreetingStatus('idle')
    setIsSpeaking(false)
  }

  // Mega Sprint 297–310 — Phase 7: In-panel wake phrase listener.
  // Only while Donna panel is open. No global always-listening.
  function startWakeListening() {
    if (typeof window === 'undefined') return
    const w = window as unknown as Record<string, unknown>
    const Ctor = (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as (new () => WakeSpeechRecognition) | undefined
    if (!Ctor) return

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      const results = event.results
      const last = results[results.length - 1]
      if (!last?.[0]) return
      const transcript = last[0].transcript.trim()
      if (detectWakePhrase(transcript)) {
        const command = extractCommandAfterWake(transcript)
        stopWakeListening()
        if (command) {
          setPendingVoiceAnswer({ raw: command, editedText: command, isEdited: false })
          setWakeDetectedCommand(command)
        } else {
          setWakeDetectedCommand('')
        }
      }
    }

    rec.onerror = () => {
      setWakeListeningActive(false)
      wakeRecognitionRef.current = null
    }

    rec.onend = () => {
      setWakeListeningActive(false)
      wakeRecognitionRef.current = null
    }

    wakeRecognitionRef.current = rec
    rec.start()
    setWakeListeningActive(true)
    setWakeDetectedCommand(null)
  }

  function stopWakeListening() {
    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop() } catch { /* ignore */ }
      wakeRecognitionRef.current = null
    }
    setWakeListeningActive(false)
  }

  // Voice-specific local state — transcript never sent to AI or written to DB
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [typeInstead, setTypeInstead] = useState(false)
  const [typedText, setTypedText] = useState('')

  // Context retrieval state — read-only live data summary, no DB writes (Sprint 265)
  const [contextSummary, setContextSummary] = useState<DonnaContextSummary | null>(null)
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  // Predictive suggestions — computed from context summary, local only (Sprint 267)
  const [suggestions, setSuggestions] = useState<DonnaSuggestion[]>([])

  // Class-template creation state — wired, saves via saveAssistantTemplateDraftAction (Sprints 262/263)
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  const [fromVoiceCapture, setFromVoiceCapture] = useState(false)
  const [templateCommandInput, setTemplateCommandInput] = useState('')
  const [commandResponse, setCommandResponse] = useState<CommandResponse | null>(null)

  // Generic task draft state — contract-only, local only, no DB writes (Sprint 266)
  const [genericDraft, setGenericDraft] = useState<GenericTaskDraft | null>(null)

  // Review queue state — Sprint 273
  const [reviewQueueData, setReviewQueueData] = useState<DonnaReviewQueueSummary | null>(null)
  const [isLoadingReviewQueue, setIsLoadingReviewQueue] = useState(false)

  // Multi-step plan state — Sprint 286
  const [multiStepPlan, setMultiStepPlan] = useState<DonnaMultiStepPlan | null>(null)
  const [multiStepIndex, setMultiStepIndex] = useState(0)

  // Voice UI state — Sprint 289
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState<string | null>(null)
  const [pendingVoiceAnswer, setPendingVoiceAnswer] = useState<DonnaVoiceTranscriptState | null>(null)
  const [voicePermissionError, setVoicePermissionError] = useState<string | null>(null)
  // Sprint 296A — isolated TTS test state (never touches speech guard refs or onboardingStep)
  const [testVoiceStatus, setTestVoiceStatus] = useState<'idle' | 'speaking' | 'done' | 'error'>('idle')

  // Sprint 290 — Guided onboarding intro state
  // Active when no task/mode/draft is running, and the user has not yet completed the intro.
  // null = not started or completed. 0 = name question. 1 = first-action question.
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null)
  // Set to true after step 1 when no task intent was detected — shows 3 suggested routes.
  const [showOnboardingSuggestions, setShowOnboardingSuggestions] = useState(false)

  // Object resolution state — Sprint 269
  // Tracks the active resolution request and its result. Never mutates records.
  const [resolutionContext, setResolutionContext] = useState<{
    objectType: import('@/components/assistant/donnaObjectResolutionTypes').DonnaResolvableObjectType
    query: string
    forFieldId: string
    result: DonnaObjectResolutionResult | null
    isLoading: boolean
  } | null>(null)
  // Confirmed objects keyed by fieldId — used to merge resolved IDs into the save payload
  const [resolvedObjects, setResolvedObjects] = useState<
    Record<string, { id: string; label: string }>
  >({})

  // Page context from registry — resolves to the richest matching context for this route.
  const ctx = resolvePageContext(pathname)
  const voicePrompts = ctx.suggestedPrompts
  // Single source of truth for the current missing question — same text shown and spoken.
  const currentTemplateQuestion: TemplateDraftQuestion | null = templateDraft?.missingQuestions?.[0] ?? null
  // Current missing question for the active generic task — shown in voice card spotlight.
  const guidedCurrentQ =
    activeMode === 'guided_task' && genericDraft
      ? getNextMissingQuestion(genericDraft.taskId, genericDraft.collectedFields)
      : null

  // Contextual task shortcuts for the current page — computed for the shortcuts section
  const pageTaskShortcuts =
    activeMode === null && !templateDraft && !genericDraft
      ? getAvailableTasksForPage(pathname).slice(0, 4)
      : []

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setActiveMode(null)
    setTemplateDraft(null)
    setGenericDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setCommandResponse(null)
    setContextSummary(null)
    setSuggestions([])
    setIsLoadingContext(false)
    setResolutionContext(null)
    setResolvedObjects({})
    setReviewQueueData(null)
    setIsLoadingReviewQueue(false)
    setMultiStepPlan(null)
    setMultiStepIndex(0)
    setPendingVoiceAnswer(null)
    setInterimVoiceTranscript(null)
    setIsVoiceListening(false)
    setIsSpeaking(false)
    setVoicePermissionError(null)
    lastSpokenTextRef.current = null
    lastSpokenAtRef.current = 0
    lastSpokenKeyRef.current = null
    utteranceRef.current = null
    setOnboardingStep(null)
    setShowOnboardingSuggestions(false)
    setTestVoiceStatus('idle')
    setVoiceGreetingStatus('idle')
    if (voiceWatchdogRef.current !== null) {
      clearTimeout(voiceWatchdogRef.current)
      voiceWatchdogRef.current = null
    }
    playVersionRef.current += 1
    stopWakeListening()
    setWakeDetectedCommand(null)
    setVoiceOutputConfirmed(null)
    realtimeDisconnect()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [realtimeDisconnect])

  // Escape closes the panel
  useEffect(() => {
    if (!panelOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panelOpen, closePanel])

  // Clear all inline state on route change
  useEffect(() => {
    setActiveMode(null)
    setVoiceTranscript(null)
    setTypeInstead(false)
    setTypedText('')
    setTemplateDraft(null)
    setGenericDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setCommandResponse(null)
    setContextSummary(null)
    setSuggestions([])
    setIsLoadingContext(false)
    setResolutionContext(null)
    setResolvedObjects({})
    setReviewQueueData(null)
    setIsLoadingReviewQueue(false)
    setPendingVoiceAnswer(null)
    setInterimVoiceTranscript(null)
    setIsVoiceListening(false)
    setIsSpeaking(false)
    setVoicePermissionError(null)
    lastSpokenTextRef.current = null
    lastSpokenAtRef.current = 0
    lastSpokenKeyRef.current = null
    setOnboardingStep(null)
    setShowOnboardingSuggestions(false)
    setTestVoiceStatus('idle')
    setVoiceGreetingStatus('idle')
    if (voiceWatchdogRef.current !== null) {
      clearTimeout(voiceWatchdogRef.current)
      voiceWatchdogRef.current = null
    }
    playVersionRef.current += 1
    stopWakeListening()
    setWakeDetectedCommand(null)
    setVoiceOutputConfirmed(null)
  }, [pathname])

  function handleModeClick(mode: AssistantMode) {
    if (mode === 'capture') {
      setCaptureOpen(true)
      closePanel()
      return
    }
    if (mode === 'create_template') {
      setGenericDraft(null) // clear any active generic draft when switching to template mode
      setActiveMode('create_template')
      // If the type-instead area already has a template intent, auto-parse it
      if (typedText && isTemplateCreationIntent(typedText)) {
        const draft = parseTemplateDraft(typedText)
        setTemplateDraft(draft)
        setFromVoiceCapture(false)
        const firstQ = draft.missingQuestions[0] ?? null
        if (firstQ) speakAssistantText(firstQ.question)
        else speakAssistantText('I have enough to draft this. Review it before saving.')
      }
      return
    }
    setGenericDraft(null) // clear any active generic draft when switching modes
    setActiveMode(prev => (prev === mode ? null : mode))
  }

  // Returns true when the voice answer actually populated the field being asked.
  // level: must match one of the 15 official level names via extractLevel — rejects "um", "maybe", freetext.
  // durationMinutes: must be a positive number.
  // blockDurations: must produce at least one recognized block.
  function wasFieldResolved(field: string, updated: TemplateDraft): boolean {
    if (field === 'level') return updated.level !== null && extractLevel(updated.level) !== null
    if (field === 'durationMinutes') return updated.durationMinutes !== null && updated.durationMinutes > 0
    if (field === 'blockDurations') return updated.blocks.length > 0
    return true
  }

  // ── Voice transcript routing — strict priority order ────────────────────────
  //
  // 0. Onboarding intro step (Sprint 290) — intercept when in guided onboarding
  // 1. Active class-template question  → answer it (requires level validation)
  // 2. Active generic task question    → answer it (accepts any non-empty text)
  // 3a. Class-template draft complete  → guard confirm/save to screen button
  // 3b. Generic draft complete         → honest "save not yet available" guardrail
  // 4. Class-template creation intent  → parse → TemplateDraftPanel
  // 5. Generic task intent             → detect → GenericDraftPanel (not create_class_template)
  // 6. Context query (Sprint 265)      → fetchDonnaContext → summary card
  // 7. Navigation / help commands      → detectAndHandleCommand
  function handleVoiceTranscript(text: string) {
    setVoiceTranscript(text)
    setTypeInstead(false)
    const lower = text.toLowerCase()

    // Voice approval safety — voice may never trigger saves, level changes, or sends.
    if (isProtectedVoicePhrase(lower)) {
      setCommandResponse({
        message: VOICE_PROTECTED_RESPONSE,
        type: 'honest',
        label: 'Use the on-screen button',
      })
      return
    }

    // Onboarding routing — Donna explains and routes, never auto-starts.
    if (isOnboardingRoutingPhrase(lower)) {
      setCommandResponse({
        message: ONBOARDING_ROUTING_RESPONSE,
        type: 'info',
        label: 'Academy Setup',
      })
      return
    }

    // 0. Sprint 290: onboarding intro — typed answers also route through here.
    // (Voice answers are intercepted earlier via handleVoiceTranscriptRaw → pendingVoiceAnswer.)
    if (isOnboardingActive(onboardingStep)) {
      handleOnboardingAnswer(onboardingStep, text)
      return
    }

    // 1. Active class-template draft with missing questions — treat as the answer
    if (templateDraft && templateDraft.missingQuestions.length > 0) {
      const question = templateDraft.missingQuestions[0]
      const updated = applyAnswerToField(templateDraft, question.field, text)

      // If the answer didn't resolve the field, keep the question and give feedback
      if (!wasFieldResolved(question.field, updated)) {
        setCommandResponse({
          message: "I captured that, but I need a clearer answer for this field.",
          type: 'honest',
          label: 'Try again',
        })
        lastSpokenTextRef.current = null // allow re-speaking the same question next attempt
        lastSpokenKeyRef.current = null
        return
      }

      setTemplateDraft(updated)
      const nextQ = updated.missingQuestions[0] ?? null
      if (nextQ) {
        speakAssistantText(nextQ.question)
      } else {
        speakAssistantText('I have enough to draft this. Review it before saving.')
      }
      return
    }

    // 2. Active generic task draft with missing questions — treat as the answer
    if (genericDraft && !isTaskDraftComplete(genericDraft.taskId, genericDraft.collectedFields)) {
      const currentQ = getNextMissingQuestion(genericDraft.taskId, genericDraft.collectedFields)
      if (currentQ) {
        const updated = applyAnswerToGenericDraft(genericDraft, currentQ.fieldId, text)
        setGenericDraft(updated)
        const nextQ = getNextMissingQuestion(updated.taskId, updated.collectedFields)
        if (nextQ) {
          speakAssistantText(nextQ.question)
        } else {
          const c = DONNA_TASK_CONTRACTS[updated.taskId]
          speakAssistantText(`${c?.label ?? 'Draft'} is ready to review.`)
        }
        return
      }
    }

    // 3a. Class-template draft complete — redirect voice confirm/save to screen button
    if (templateDraft && templateDraft.missingQuestions.length === 0) {
      if (lower.includes('confirm') || lower.includes('save') || lower.includes('approve')) {
        setCommandResponse({
          message: 'Use the Save Template button to approve and save safely.',
          type: 'honest',
          label: 'Ready to save',
        })
        return
      }
    }

    // 3b. Generic draft complete — wired tasks redirect to on-screen button; unwired show honest notice
    if (genericDraft && isTaskDraftComplete(genericDraft.taskId, genericDraft.collectedFields)) {
      if (lower.includes('confirm') || lower.includes('save') || lower.includes('approve')) {
        if (WIRED_TASK_IDS.has(genericDraft.taskId)) {
          setCommandResponse({
            message: 'Use the Approve and Save button below to save this draft safely.',
            type: 'honest',
            label: 'Use the on-screen button',
          })
        } else {
          setCommandResponse({
            message: 'Saving this draft is not yet available. Your answers are captured here for your review.',
            type: 'honest',
            label: 'Save not available yet',
          })
        }
        return
      }
    }

    // 4a. Multi-step intent — Sprint 286
    if (!templateDraft && !genericDraft && !multiStepPlan) {
      const plan = detectMultiStepIntent(text)
      if (plan) {
        setMultiStepPlan(plan)
        setMultiStepIndex(0)
        speakAssistantText(plan.summary)
        return
      }
    }

    // 4. Class-template creation intent — always routes to wired TemplateDraftPanel
    if (isTemplateCreationIntent(text)) {
      const draft = parseTemplateDraft(text)
      setTemplateDraft(draft)
      setFromVoiceCapture(true)
      setActiveMode('create_template')
      const firstQ = draft.missingQuestions[0] ?? null
      if (firstQ) {
        speakAssistantText(firstQ.question)
      } else {
        speakAssistantText('I have enough to draft this. Review it before saving.')
      }
      return
    }

    // 5. Generic task intent — only when no draft is currently active
    if (!templateDraft && !genericDraft) {
      const { taskId } = detectTaskIntent(text)
      if (taskId && taskId !== 'create_class_template') {
        handleStartGenericTask(taskId, true)
        return
      }
    }

    // 5.5. Review queue intent — Sprint 273
    if (isReviewQueuePhrase(lower)) {
      void handleOpenReviewQueue()
      return
    }

    // 6. Predictive suggestion phrases — always fetch context + compute suggestions (Sprint 267)
    // These run before the generic context query so "recommend a template" (vague) routes
    // to suggestions rather than a task intent.
    if (isPredictiveSuggestionPhrase(lower)) {
      void handleContextSummary()
      return
    }

    // 7. Context query phrases — route to read-only live data summary (Sprint 265)
    if (isContextQueryPhrase(lower)) {
      void handleContextSummary()
      return
    }

    // 8. Generic navigation and info commands
    detectAndHandleCommand(text)
  }

  // Clicking a suggestion — same routing priority as voice/typed
  function handleSuggestionClick(prompt: string) {
    if (isTemplateCreationIntent(prompt)) {
      const draft = parseTemplateDraft(prompt)
      setTemplateDraft(draft)
      setFromVoiceCapture(false)
      setActiveMode('create_template')
      const firstQ = draft.missingQuestions[0] ?? null
      if (firstQ) {
        speakAssistantText(firstQ.question)
      } else {
        speakAssistantText('I have enough to draft this. Review it before saving.')
      }
      return
    }
    // Generic task intent from suggestion — only when no draft is active
    if (!templateDraft && !genericDraft) {
      const { taskId } = detectTaskIntent(prompt)
      if (taskId && taskId !== 'create_class_template') {
        handleStartGenericTask(taskId, false)
        return
      }
    }
    const handled = detectAndHandleCommand(prompt)
    if (!handled) {
      setTypeInstead(true)
      setTypedText(prompt)
    }
  }

  function handleParseTemplate() {
    const text = templateCommandInput.trim()
    if (!text) return
    const draft = parseTemplateDraft(text)
    setTemplateDraft(draft)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    const firstQ = draft.missingQuestions[0] ?? null
    if (firstQ) speakAssistantText(firstQ.question)
    else speakAssistantText('I have enough to draft this. Review it before saving.')
  }

  function handleCancelTemplate() {
    setTemplateDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setActiveMode(null)
  }

  // Start a guided task for any contract-only task (never create_class_template).
  // If the current page is a player/session/template profile, auto-populates
  // the corresponding field and stores the resolved ID — skips that question.
  function handleStartGenericTask(taskId: DonnaTaskId, fromVoice = false) {
    if (taskId === 'create_class_template') return // always uses TemplateDraftPanel
    let draft = createEmptyGenericDraft(taskId)
    const newResolvedObjects: Record<string, { id: string; label: string }> = {}

    // Sprint 269: pre-populate from current page object context
    const pageObject = getCurrentPageObject(pathname)
    if (pageObject) {
      const { objectType, objectId, fieldLabel } = pageObject
      // Find the first field in this task that matches the page object type
      const taskFieldMap = FIELD_RESOLUTION_MAP[taskId]
      if (taskFieldMap) {
        const matchingFieldId = Object.entries(taskFieldMap).find(
          ([, fType]) => fType === objectType,
        )?.[0]
        if (matchingFieldId) {
          draft = applyAnswerToGenericDraft(draft, matchingFieldId, `${fieldLabel} ✓`)
          newResolvedObjects[matchingFieldId] = { id: objectId, label: fieldLabel }
        }
      }
    }

    setGenericDraft(draft)
    setResolvedObjects(newResolvedObjects)
    setActiveMode('guided_task')
    setFromVoiceCapture(fromVoice)
    setCommandResponse(null)
    setResolutionContext(null)

    // Speak the first unanswered question
    const contract = DONNA_TASK_CONTRACTS[taskId]
    const firstQ = contract?.questionSequence.find(
      q => !draft.collectedFields[q.fieldId],
    ) ?? null
    if (firstQ) speakAssistantText(firstQ.question)
  }

  function handleCancelGenericTask() {
    setGenericDraft(null)
    setActiveMode(null)
    setFromVoiceCapture(false)
  }

  // Sprint 290 — Guided onboarding answer handler
  // Routes the director's answer at each onboarding step.
  // Step 0 (name): store name acknowledgment, advance to step 1.
  // Step 1 (first action): detect task intent and start it, or show suggested routes.
  function handleOnboardingAnswer(step: number, answer: string) {
    const lower = answer.toLowerCase().trim()

    if (step === 0) {
      // Name step — acknowledge and advance.
      const spokenName = answer.trim()
      setOnboardingStep(1)
      const nextSpoken = spokenName
        ? `Nice to meet you, ${spokenName}. ${DONNA_ONBOARDING_STEPS[1].spokenText}`
        : DONNA_ONBOARDING_STEPS[1].spokenText
      // Reset dedupe guards so the next step can speak even if same text
      lastSpokenTextRef.current = null
      lastSpokenKeyRef.current = null
      speakAssistantText(nextSpoken)
      return
    }

    if (step === 1) {
      // First-action step — detect intent and route.
      setOnboardingStep(null)

      // Template creation intent
      if (isTemplateCreationIntent(answer)) {
        const draft = parseTemplateDraft(answer)
        setTemplateDraft(draft)
        setActiveMode('create_template')
        setFromVoiceCapture(true)
        const firstQ = draft.missingQuestions[0] ?? null
        lastSpokenTextRef.current = null
        lastSpokenKeyRef.current = null
        if (firstQ) speakAssistantText(firstQ.question)
        else speakAssistantText('I have enough to draft this. Review it before saving.')
        return
      }

      // Generic task intent
      const { taskId } = detectTaskIntent(answer)
      if (taskId && taskId !== 'create_class_template') {
        handleStartGenericTask(taskId, true)
        return
      }

      // Review queue intent
      if (isReviewQueuePhrase(lower)) {
        void handleOpenReviewQueue()
        return
      }

      // No recognized intent — show suggested routes
      setShowOnboardingSuggestions(true)
      lastSpokenTextRef.current = null
      lastSpokenKeyRef.current = null
      speakAssistantText('Here are some things you can do to get started.')
    }
  }

  // Sprint 289 — Voice UI state handlers

  function handleVoiceListeningChange(listening: boolean) {
    setIsVoiceListening(listening)
    if (!listening) setInterimVoiceTranscript(null)
  }

  function handleInterimTranscript(text: string) {
    setInterimVoiceTranscript(text || null)
  }

  function handleVoiceError(error: string) {
    setVoicePermissionError(
      error === 'not-allowed'
        ? 'Microphone permission was denied. Allow microphone access in your browser settings and try again.'
        : 'Voice input encountered an error. You can type your answer instead.',
    )
  }

  // Raw transcript interceptor — gates on onboarding and guided_task mode to require
  // director review/edit before the answer is committed.
  // In all other modes, routes directly to handleVoiceTranscript.
  function handleVoiceTranscriptRaw(text: string) {
    setInterimVoiceTranscript(null)

    // Sprint 290: intercept in onboarding mode so director can review their spoken name/intent
    if (isOnboardingActive(onboardingStep)) {
      setPendingVoiceAnswer({ raw: text, editedText: text, isEdited: false })
      return
    }

    if (
      activeMode === 'guided_task' &&
      genericDraft &&
      !isTaskDraftComplete(genericDraft.taskId, genericDraft.collectedFields)
    ) {
      setPendingVoiceAnswer({ raw: text, editedText: text, isEdited: false })
      return
    }
    handleVoiceTranscript(text)
  }

  function handleConfirmVoiceAnswer() {
    if (!pendingVoiceAnswer) return
    const answer = pendingVoiceAnswer.editedText.trim()
    setPendingVoiceAnswer(null)

    // Sprint 290: route onboarding answers through the onboarding handler.
    if (isOnboardingActive(onboardingStep)) {
      handleOnboardingAnswer(onboardingStep, answer)
      return
    }

    if (answer) handleVoiceTranscript(answer)
  }

  function handleRetryVoice() {
    setPendingVoiceAnswer(null)
  }

  // Dispatch to the correct server action for a wired task draft.
  // Merges resolvedObjects (confirmed IDs) into the fields payload before saving.
  async function handleGenericDraftApprove(
    draft: GenericTaskDraft,
  ): Promise<DonnaApprovalExecutionResult> {
    if (draft.taskId === 'create_fitness_template') {
      return saveFitnessTemplateDraftAction(draft.collectedFields)
    }
    if (draft.taskId === 'capture_coach_note') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['player']?.id) {
        fields._resolved_player_id = resolvedObjects['player'].id
      }
      if (resolvedObjects['session_context']?.id) {
        fields._resolved_session_id = resolvedObjects['session_context'].id
      }
      return saveCoachNoteDraftAction(fields)
    }
    if (draft.taskId === 'draft_player_note') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['player']?.id) {
        fields._resolved_player_id = resolvedObjects['player'].id
      }
      return savePlayerNoteDraftAction(fields)
    }
    if (draft.taskId === 'create_session') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['group']?.id) {
        fields._resolved_group_id = resolvedObjects['group'].id
      }
      if (resolvedObjects['template']?.id) {
        fields._resolved_class_template_id = resolvedObjects['template'].id
      }
      if (resolvedObjects['coach']?.id) {
        fields._resolved_coach_id = resolvedObjects['coach'].id
      }
      return saveSessionDraftAction(fields)
    }
    if (draft.taskId === 'populate_session_from_template') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['session']?.id) {
        fields._resolved_session_id = resolvedObjects['session'].id
      }
      if (resolvedObjects['template']?.id) {
        fields._resolved_class_template_id = resolvedObjects['template'].id
      }
      return populateSessionBlocksAction(fields)
    }
    if (draft.taskId === 'handle_attendance_exception') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['session_or_group']?.id) {
        fields._resolved_session_id = resolvedObjects['session_or_group'].id
      }
      return saveAttendanceExceptionDraftAction(fields)
    }
    if (draft.taskId === 'draft_parent_update') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['player']?.id) {
        fields._resolved_player_id = resolvedObjects['player'].id
      }
      return saveParentUpdateDraftAction(fields)
    }
    if (draft.taskId === 'review_level_readiness') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['player']?.id) {
        fields._resolved_player_id = resolvedObjects['player'].id
      }
      return saveLevelReadinessDraftAction(fields)
    }
    if (draft.taskId === 'adjust_curriculum') {
      return saveCurriculumAdjustmentDraftAction(draft.collectedFields)
    }
    if (draft.taskId === 'draft_coach_communication') {
      return saveCoachCommunicationDraftAction(draft.collectedFields)
    }
    return {
      ok: false,
      status: 'not_wired',
      message: 'Save is not yet available for this task type.',
    }
  }

  // ---------------------------------------------------------------------------
  // Object resolution handlers — Sprint 269
  // ---------------------------------------------------------------------------

  // Called when a draft field is answered and may need object resolution.
  // Fires a read-only lookup and shows the resolver panel. Never mutates records.
  async function handleResolveObject(
    taskId: DonnaTaskId,
    fieldId: string,
    query: string,
  ) {
    const objectType = fieldNeedsResolution(taskId, fieldId)
    if (!objectType) return
    if (!looksLikeUserTypedName(query)) return

    setResolutionContext({
      objectType,
      query,
      forFieldId: fieldId,
      result: null,
      isLoading: true,
    })

    try {
      const result = await resolveDonnaObjectAction(objectType, query)
      setResolutionContext(prev =>
        prev ? { ...prev, result, isLoading: false } : null,
      )
    } catch {
      setResolutionContext(null)
    }
  }

  // Called when the director selects a candidate from the resolver panel.
  function handleSelectResolvedObject(candidate: DonnaResolvedObjectCandidate) {
    if (!resolutionContext || !genericDraft) {
      setResolutionContext(null)
      return
    }
    const fieldId = resolutionContext.forFieldId
    // Update draft field to show confirmed label
    const confirmedLabel = `${candidate.label} ✓`
    const updatedDraft = applyAnswerToGenericDraft(genericDraft, fieldId, confirmedLabel)
    setGenericDraft(updatedDraft)
    // Store resolved ID separately — never in draft's collectedFields
    setResolvedObjects(prev => ({
      ...prev,
      [fieldId]: { id: candidate.id, label: candidate.label },
    }))
    setResolutionContext(null)
  }

  // Dismiss the resolver panel without selecting anything
  function handleCancelResolution() {
    setResolutionContext(null)
  }

  // Wrapper around setGenericDraft that triggers resolution when a resolvable
  // field is answered. Called by GenericDraftPanel via onUpdateDraft.
  function handleUpdateGenericDraft(updatedDraft: GenericTaskDraft) {
    // Find which field was just answered by comparing with current draft
    const prevFields = genericDraft?.collectedFields ?? {}
    const newFields = updatedDraft.collectedFields
    const newlyAnsweredFieldId = Object.keys(newFields).find(
      fid => newFields[fid] && !prevFields[fid],
    )
    setGenericDraft(updatedDraft)
    // Trigger resolution for the newly answered field if needed
    if (newlyAnsweredFieldId) {
      const value = newFields[newlyAnsweredFieldId]
      void handleResolveObject(updatedDraft.taskId, newlyAnsweredFieldId, value)
    }
  }

  // Returns true if the input phrase is a read-only context summary request.
  function isContextQueryPhrase(lower: string): boolean {
    return (
      lower.includes('summarize this page') ||
      lower.includes("what's going on here") ||
      lower.includes('what is going on here') ||
      lower.includes('ask about this page') ||
      lower.includes('summarize this player') ||
      lower.includes('what does this player need') ||
      lower.includes('what should i know about this player')
    )
  }

  // Returns true if the input phrase explicitly requests predictive suggestions.
  // These phrases always trigger context fetch + suggestion computation (Sprint 267).
  // Checked BEFORE generic task intent detection so "recommend a template" (vague,
  // no specific group) routes to suggestions instead of the task guided flow.
  function isPredictiveSuggestionPhrase(lower: string): boolean {
    const trimmed = lower.trim().replace(/[?!.]+$/, '')
    return (
      trimmed === 'recommend a template' ||
      lower.includes('what do you recommend') ||
      lower.includes('any suggestions') ||
      lower.includes('suggest next best actions') ||
      lower.includes('suggest next actions') ||
      lower.includes('who needs attention') ||
      lower.includes('what should i look at first') ||
      lower.includes('what should i focus on') ||
      lower.includes('what do you suggest') ||
      lower.includes('give me suggestions') ||
      lower.includes('what are your recommendations')
    )
  }

  // Returns true if the phrase is a review queue intent.
  function isReviewQueuePhrase(lower: string): boolean {
    return (
      lower.includes('what needs my attention') ||
      lower.includes('show review queue') ||
      lower.includes('open review queue') ||
      lower.includes('review queue') ||
      lower.includes('show pending notes') ||
      lower.includes('show pending') ||
      lower.includes('notes needing routing') ||
      lower.includes('unlinked notes') ||
      lower.includes('needs my review')
    )
  }

  // Opens the review queue panel and fetches data.
  async function handleOpenReviewQueue() {
    setActiveMode('review_queue')
    setGenericDraft(null)
    setTemplateDraft(null)
    setCommandResponse(null)
    setIsLoadingReviewQueue(true)
    try {
      const data = await getDonnaReviewQueueAction()
      setReviewQueueData(data)
    } catch {
      setReviewQueueData(null)
    } finally {
      setIsLoadingReviewQueue(false)
    }
  }

  // Fetch read-only context summary for the current page via Server Action.
  // No writes, no OpenAI, no Realtime. Returns deterministic data-derived summary.
  // Sprint 267: also computes predictive suggestions from the returned summary.
  async function handleContextSummary() {
    setIsLoadingContext(true)
    setContextSummary(null)
    setSuggestions([])
    setCommandResponse(null)
    try {
      const req = deriveContextRequest(pathname)
      const summary = await fetchDonnaContext(req.contextType, req.params)
      setContextSummary(summary)
      setSuggestions(computePredictiveSuggestions(summary))
    } catch {
      // Silent fail — user can retry
    } finally {
      setIsLoadingContext(false)
    }
  }

  // Deterministic command detection — no AI, no API calls.
  // Navigation uses approved /director routes only. Returns true if command was recognized.
  function detectAndHandleCommand(text: string): boolean {
    const lower = text.toLowerCase().trim()

    // Review queue intent — in-panel quick review (Sprint 273)
    if (isReviewQueuePhrase(lower)) {
      void handleOpenReviewQueue()
      return true
    }

    // Navigation commands — approved routes only, most-specific first
    const NAV_COMMANDS: Array<{ patterns: string[]; href: string }> = [
      {
        patterns: ['take me to curriculum setup', 'go to curriculum setup', 'open curriculum setup'],
        href: '/director/onboarding/curriculum',
      },
      {
        patterns: ['continue setup', 'go to onboarding', 'go to setup', 'take me to onboarding', 'take me to setup'],
        href: '/director/onboarding',
      },
      {
        patterns: ['take me to review', 'go to review', 'open review'],
        href: '/director/review',
      },
      {
        patterns: ['go to players', 'take me to players', 'show me players', 'open players'],
        href: '/director/players',
      },
      {
        patterns: ['go to templates', 'take me to templates', 'show me templates', 'go to class templates', 'open templates'],
        href: '/director/class-templates',
      },
      {
        patterns: ['go to sessions', 'take me to sessions', 'open sessions', 'show me sessions'],
        href: '/director/sessions',
      },
      {
        patterns: ['go to curriculum', 'take me to curriculum', 'open curriculum', 'show me curriculum'],
        href: '/director/curriculum',
      },
    ]

    for (const { patterns, href } of NAV_COMMANDS) {
      if (patterns.some(p => lower.includes(p))) {
        router.push(href)
        closePanel()
        return true
      }
    }

    // Go back — only within /director, not from the root dashboard
    if (lower.includes('go back') || lower === 'back') {
      if (pathname.startsWith('/director') && pathname !== '/director') {
        router.back()
        closePanel()
      } else {
        setCommandResponse({
          message: 'You are already at the main director screen.',
          type: 'honest',
          label: 'Not available',
        })
      }
      return true
    }

    // Capture a note — mirrors the "Capture a note" mode button
    if (
      lower.includes('capture a note') ||
      lower.includes('capture a player note') ||
      lower.includes('take a note') ||
      lower.includes('save a note')
    ) {
      setCaptureOpen(true)
      closePanel()
      return true
    }

    // Explain this page / screen
    if (
      lower.includes('what is this page') ||
      lower.includes('what page am i') ||
      lower.includes('explain this screen')
    ) {
      setCommandResponse({ message: ctx.purpose, type: 'info', label: 'About this page' })
      setActiveMode('explain')
      return true
    }

    // "Guide me" / "What's next?" — always use existing page-guidance behavior (Sprint 267 rule)
    if (
      lower.includes('guide me') ||
      lower.includes("what's next") ||
      lower === 'what do i do'
    ) {
      setCommandResponse({ message: ctx.nextAction, type: 'info', label: 'Suggested next step' })
      setActiveMode('guide')
      return true
    }

    // "What should I do next?" — ambiguous phrase (Sprint 267 rule):
    //   • contextSummary already loaded → show suggestions (they are already computed)
    //   • no contextSummary → use page-guidance behavior
    if (lower.includes('what should i do next')) {
      if (contextSummary) {
        // Suggestions are already in state from the context fetch — just show the guide section
        // so the user sees the suggestions section that is rendered below the context card.
        setActiveMode('guide')
      } else {
        setCommandResponse({ message: ctx.nextAction, type: 'info', label: 'Suggested next step' })
        setActiveMode('guide')
      }
      return true
    }

    // What needs approval / where should I start — maps to nextAction (route-aware)
    if (
      lower.includes('what needs approval') ||
      lower.includes('where should i start') ||
      lower.includes('where do i start')
    ) {
      setCommandResponse({ message: ctx.nextAction, type: 'info', label: 'Suggested next step' })
      setActiveMode('guide')
      return true
    }

    // What happens when I approve — curriculum-specific, honest elsewhere
    if (lower.includes('what happens when i approve') || lower.includes('what happens if i approve')) {
      setCommandResponse({
        message: pathname.startsWith('/director/onboarding/curriculum')
          ? "Approving curriculum setup confirms your academy's development spine. It connects players to levels, enables session planning, and activates the full Academy OS workflow."
          : ctx.purpose,
        type: 'info',
        label: 'About approval',
      })
      return true
    }

    // Explain this question — honest on interview page (step index not accessible from here)
    if (
      lower.includes('explain this question') ||
      lower.includes('explain the question') ||
      lower.includes('explain this q')
    ) {
      if (pathname.startsWith('/director/onboarding/interview')) {
        setCommandResponse({
          message:
            'This interview has 7 questions covering: your academy philosophy, player focus, development priorities, competition approach, parent communication style, coach operating style, and 90-day success vision. Answer one at a time using the on-screen form.',
          type: 'info',
          label: 'About this question',
        })
      } else {
        setCommandResponse({ message: ctx.purpose, type: 'info', label: 'About this page' })
      }
      return true
    }

    // Broad "explain this" catch-all — after specific "explain this question" is already handled above
    if (lower.startsWith('explain') || lower.includes('explain this')) {
      setCommandResponse({ message: ctx.purpose, type: 'info', label: 'About this page' })
      setActiveMode('explain')
      return true
    }

    // Honest fallbacks — commands that look functional but are not yet wired
    if (lower.includes('next question') || lower.includes('skip question')) {
      setCommandResponse({
        message: 'Direct question control is not wired yet. Use the on-screen Confirm button to move forward.',
        type: 'honest',
        label: 'Not available yet',
      })
      return true
    }

    if (lower.includes('confirm') && (lower.includes('answer') || lower.includes('this') || lower.includes('it'))) {
      setCommandResponse({
        message: 'Confirming your answer is handled by the on-screen button. Click Confirm in the interview form to move forward.',
        type: 'honest',
        label: 'Not available yet',
      })
      return true
    }

    return false
  }

  function handleCommandSubmit() {
    const text = typedText.trim()
    if (!text) return

    // Sprint 290: onboarding intro — typed answers route through the onboarding handler.
    if (isOnboardingActive(onboardingStep)) {
      handleOnboardingAnswer(onboardingStep, text)
      setTypeInstead(false)
      setTypedText('')
      return
    }

    // Multi-step intent — Sprint 286
    if (!templateDraft && !genericDraft && !multiStepPlan) {
      const plan = detectMultiStepIntent(text)
      if (plan) {
        setMultiStepPlan(plan)
        setMultiStepIndex(0)
        setTypeInstead(false)
        setTypedText('')
        speakAssistantText(plan.summary)
        return
      }
    }

    // Class-template creation intent — always routes to wired TemplateDraftPanel
    if (isTemplateCreationIntent(text)) {
      const draft = parseTemplateDraft(text)
      setTemplateDraft(draft)
      setFromVoiceCapture(false)
      setActiveMode('create_template')
      setTypeInstead(false)
      const firstQ = draft.missingQuestions[0] ?? null
      if (firstQ) speakAssistantText(firstQ.question)
      else speakAssistantText('I have enough to draft this. Review it before saving.')
      return
    }

    // Generic task intent — only when no draft is currently active
    if (!templateDraft && !genericDraft) {
      const { taskId } = detectTaskIntent(text)
      if (taskId && taskId !== 'create_class_template') {
        handleStartGenericTask(taskId, false)
        setTypeInstead(false)
        setTypedText('')
        return
      }
    }

    // Review queue intent — Sprint 273
    if (isReviewQueuePhrase(text.toLowerCase())) {
      void handleOpenReviewQueue()
      setTypeInstead(false)
      setTypedText('')
      return
    }

    // Predictive suggestion phrases (Sprint 267) — before generic context query
    if (isPredictiveSuggestionPhrase(text.toLowerCase())) {
      void handleContextSummary()
      setTypeInstead(false)
      setTypedText('')
      return
    }

    // Context query
    if (isContextQueryPhrase(text.toLowerCase())) {
      void handleContextSummary()
      setTypeInstead(false)
      setTypedText('')
      return
    }

    const handled = detectAndHandleCommand(text)
    if (!handled) {
      setCommandResponse({
        message:
          'I didn\'t recognize that command. Try: "What is this page?", "What should I do next?", "Open review queue", or start a template with "Create a template for…"',
        type: 'honest',
        label: 'Not recognized',
      })
    }
    setTypeInstead(false)
    setTypedText('')
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger                                                      */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => {
          setPanelOpen(true)
          if (!hasGreetedRef.current) {
            hasGreetedRef.current = true
            setShowGreeting(true)
            // Sprint 290: start the guided onboarding intro instead of generic greeting.
            // Sprint 296B: do NOT auto-speak here — Chrome discards the gesture context
            // before speak() is reached after multiple setState calls. Director presses
            // "Play Donna voice" button for a clean gesture-backed speak().
            setOnboardingStep(0)
            setShowOnboardingSuggestions(false)
          }
        }}
        aria-label={`Ask ${DONNA_PUBLIC_NAME}`}
        title={`Ask ${DONNA_PUBLIC_NAME}`}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
          'flex items-center justify-center',
          'text-white',
          'shadow-[0_4px_16px_rgba(139,92,246,0.4)]',
          'hover:brightness-110 hover:-translate-y-0.5',
          'hover:shadow-[0_6px_22px_rgba(139,92,246,0.55)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          'active:scale-95 transition-all duration-200',
        )}
        style={{
          background: 'linear-gradient(135deg, #6d28d9, #4338ca)',
          border: '1px solid rgba(139,92,246,0.35)',
        }}
      >
        <Sparkles className="w-[18px] h-[18px]" />
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile backdrop                                                      */}
      {/* ------------------------------------------------------------------ */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Side panel                                                           */}
      {/* ------------------------------------------------------------------ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={DONNA_FULL_LABEL}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[90vw] flex flex-col',
          'transition-transform duration-200 ease-out',
          panelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        )}
        style={{
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
              <h2 className="text-sm font-semibold text-text-primary">{DONNA_PUBLIC_NAME}</h2>
              <span className="text-[10px] text-text-muted font-normal">{DONNA_PUBLIC_TITLE}</span>
              {isVoiceListening && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}
                >
                  Listening
                </span>
              )}
              {!isVoiceListening && isSpeaking && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                >
                  Speaking
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-snug">
              {DONNA_ACTIVATION_HELP}
            </p>
          </div>
          <button
            onClick={closePanel}
            aria-label="Close assistant"
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-2 mt-0.5
              text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* ── Greeting / onboarding intro card — shown on first open ── */}
          {/* Sprint 290: shows the first onboarding question (same text spoken + displayed). */}
          {showGreeting && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: '#8b5cf6' }}
              >
                {DONNA_PUBLIC_NAME}
              </p>
              <p className="text-[13px] text-text-primary font-medium leading-snug">
                {isOnboardingActive(onboardingStep)
                  ? DONNA_ONBOARDING_STEPS[onboardingStep].question
                  : greetingText}
              </p>
              {isOnboardingActive(onboardingStep) && (
                <>
                  <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                    {DONNA_SAFETY_REMINDER}
                  </p>
                  {/* Voice mode status indicator */}
                  <p className="text-[10px] mt-2 leading-snug" style={{
                    color: realtimeStatus === 'unavailable' || realtimeStatus === 'error'
                      ? '#FF9500'
                      : realtimeStatus === 'ready' || realtimeStatus === 'speaking'
                      ? '#30D158'
                      : '#8b5cf6',
                  }}>
                    {realtimeStatus === 'idle' && 'Donna is ready.'}
                    {realtimeStatus === 'connecting' && 'Donna is connecting…'}
                    {realtimeStatus === 'ready' && 'Donna is ready.'}
                    {realtimeStatus === 'speaking' && 'Donna is speaking.'}
                    {realtimeStatus === 'unavailable' && (getFallbackMessage('realtime_unavailable') ?? 'Donna voice unavailable — browser voice available.')}
                    {realtimeStatus === 'error' && getFallbackMessage('realtime_connect_failed')}
                    {realtimeStatus === 'closed' && 'Donna is ready.'}
                  </p>
                  {/* Sprint 297: primary play button, Realtime → browser TTS cascade */}
                  <div className="mt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={playOnboardingVoice}
                      disabled={voiceGreetingStatus === 'starting' || voiceGreetingStatus === 'speaking' || realtimeStatus === 'connecting'}
                      className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: voiceGreetingStatus === 'done'
                          ? 'rgba(48,209,88,0.12)'
                          : 'rgba(139,92,246,0.15)',
                        border: voiceGreetingStatus === 'done'
                          ? '1px solid rgba(48,209,88,0.3)'
                          : '1px solid rgba(139,92,246,0.3)',
                        color: voiceGreetingStatus === 'done' ? '#30D158' : '#c4b5fd',
                      }}
                    >
                      {voiceGreetingStatus === 'idle' && (realtimeStatus === 'unavailable' ? 'Play Donna voice (browser)' : 'Play Donna voice')}
                      {voiceGreetingStatus === 'starting' && (realtimeStatus === 'connecting' ? 'Connecting…' : 'Starting…')}
                      {voiceGreetingStatus === 'speaking' && 'Speaking…'}
                      {(voiceGreetingStatus === 'stalled' || voiceGreetingStatus === 'error') && 'Play Donna voice again'}
                      {voiceGreetingStatus === 'done' && '✓ Donna spoke'}
                    </button>
                    {/* Stall message — browser TTS watchdog */}
                    {voiceGreetingStatus === 'stalled' && (
                      <p className="text-[10px] leading-snug" style={{ color: '#FF9500' }}>
                        {"Donna's voice did not start. Click Play Donna voice again or type instead."}
                      </p>
                    )}
                    {/* Reset link — stall or error recovery */}
                    {(voiceGreetingStatus === 'stalled' || voiceGreetingStatus === 'error') && (
                      <button
                        type="button"
                        onClick={resetVoice}
                        className="text-[10px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                      >
                        Reset Donna voice
                      </button>
                    )}
                    {/* Realtime unavailable: show browser voice option explicitly */}
                    {realtimeStatus === 'unavailable' && voiceGreetingStatus === 'idle' && (
                      <p className="text-[10px] text-text-muted leading-snug">
                        Realtime voice is not configured. Browser voice or typed setup is available.
                      </p>
                    )}
                    {/* After any failure: offer typed continuation */}
                    {(voiceGreetingStatus === 'stalled' || voiceGreetingStatus === 'error' || realtimeStatus === 'error') && (
                      <button
                        type="button"
                        onClick={() => { setTypeInstead(true) }}
                        className="text-[10px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                      >
                        Continue typed instead
                      </button>
                    )}
                    {/* Voice output confirmation — shown after Donna speaks */}
                    {(voiceGreetingStatus === 'done' || voiceGreetingStatus === 'speaking') && voiceOutputConfirmed === null && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setVoiceOutputConfirmed(true)}
                          className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }}
                        >
                          {DONNA_HEARD_CONFIRM}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceOutputConfirmed(false)
                            if (activatedVoiceModeRef.current === 'realtime') resetVoice()
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}
                        >
                          {DONNA_NOT_HEARD_CONFIRM}
                        </button>
                      </div>
                    )}
                    {voiceOutputConfirmed === true && (
                      <p className="text-[10px] pt-0.5" style={{ color: '#30D158' }}>
                        Donna is ready.
                      </p>
                    )}
                    {voiceOutputConfirmed === false && (
                      <div className="space-y-1 pt-0.5">
                        <p className="text-[10px] text-text-muted">No problem — try browser voice or continue typed.</p>
                        <button
                          type="button"
                          onClick={() => { setVoiceOutputConfirmed(null); void playOnboardingVoice() }}
                          className="text-[10px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Primary voice card ── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {/* Voice input area */}
            <div
              className="px-4 py-3.5"
              style={{
                background: 'linear-gradient(135deg, rgba(109,40,217,0.09), rgba(67,56,202,0.05))',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
                <p className="text-sm font-semibold text-text-primary">Ask {DONNA_PUBLIC_NAME}</p>
              </div>
              <p className="text-[11px] text-text-muted leading-snug mb-3">
                Use voice to ask {DONNA_PUBLIC_NAME} what to do next, answer the current question, or capture a director note.
              </p>

              {/* Sprint 290 — Onboarding current question spotlight */}
              {/* Shows when in onboarding step 1 (first-action question) */}
              {isOnboardingActive(onboardingStep) && onboardingStep === 1 && (
                <div
                  className="mb-3 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
                    Current question
                  </p>
                  <p className="text-[12px] text-text-primary font-medium leading-snug">
                    {DONNA_ONBOARDING_STEPS[1].question}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1 leading-snug">
                    {DONNA_ONBOARDING_STEPS[1].helperText}
                  </p>
                </div>
              )}

              {/* Current question spotlight — guided_task mode only */}
              {guidedCurrentQ && !isOnboardingActive(onboardingStep) && (
                <div
                  className="mb-3 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
                    Current question
                  </p>
                  <p className="text-[12px] text-text-primary font-medium leading-snug">
                    {guidedCurrentQ.question}
                  </p>
                </div>
              )}

              {/* VoiceInputButton — browser SpeechRecognition only, no API, no DB write */}
              <VoiceInputButton
                onTranscript={handleVoiceTranscriptRaw}
                label={`Ask ${DONNA_PUBLIC_NAME}`}
                appendMode={false}
                onListeningChange={handleVoiceListeningChange}
                onInterimTranscript={handleInterimTranscript}
                onError={handleVoiceError}
                onSupportedChange={setIsVoiceSupported}
              />

              {/* Hey Donna wake phrase — panel-only, no global always-listening */}
              <button
                type="button"
                onClick={wakeListeningActive ? stopWakeListening : startWakeListening}
                className="mt-2 w-full text-[11px] rounded-lg px-3 py-1.5 transition-all"
                style={wakeListeningActive
                  ? { background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }
                  : { background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', color: '#c4b5fd' }
                }
              >
                {wakeListeningActive ? DONNA_WAKE_ACTIVE_LABEL : DONNA_WAKE_LABEL}
              </button>
              {wakeDetectedCommand !== null && (
                <p className="mt-1 text-[10px] text-lime leading-snug">
                  {wakeDetectedCommand
                    ? `Donna heard: "${wakeDetectedCommand}"`
                    : 'Hey Donna detected. Speak your command.'}
                </p>
              )}

              {/* Test browser TTS — isolated, no guard or onboarding side effects */}
              <button
                type="button"
                onClick={testBrowserVoice}
                disabled={testVoiceStatus === 'speaking'}
                className="mt-1.5 w-full text-[11px] text-text-muted hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center py-1"
              >
                {testVoiceStatus === 'idle' && 'Test Donna browser voice'}
                {testVoiceStatus === 'speaking' && 'Speaking…'}
                {testVoiceStatus === 'done' && '✓ Browser voice working'}
                {testVoiceStatus === 'error' && 'Voice test failed — check browser sound settings'}
              </button>

              {/* Live interim transcript — shown while recognition is active */}
              {isVoiceListening && interimVoiceTranscript && (
                <div
                  className="mt-2.5 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: '#8b5cf6' }}>
                    {DONNA_PUBLIC_NAME} is listening…
                  </p>
                  <p className="text-[12px] text-text-muted leading-snug italic">
                    {interimVoiceTranscript}
                  </p>
                </div>
              )}

              {/* Voice permission / browser error */}
              {voicePermissionError && (
                <div
                  className="mt-2.5 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-status-red">
                    Voice unavailable
                  </p>
                  <p className="text-[11px] text-text-muted leading-snug">{voicePermissionError}</p>
                  <button
                    onClick={() => setVoicePermissionError(null)}
                    className="mt-1 text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Editable transcript — shown in guided_task mode after voice capture */}
              {pendingVoiceAnswer && (
                <div
                  className="mt-3 rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(200,255,0,0.25)' }}
                >
                  <div className="px-3 py-2" style={{ background: 'rgba(200,255,0,0.05)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5 text-lime">
                      {DONNA_PUBLIC_NAME} heard — review before using
                    </p>
                    <textarea
                      rows={2}
                      value={pendingVoiceAnswer.editedText}
                      onChange={e =>
                        setPendingVoiceAnswer(prev =>
                          prev
                            ? { ...prev, editedText: e.target.value, isEdited: e.target.value !== prev.raw }
                            : null,
                        )
                      }
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ background: 'var(--bg-surface)', borderTop: '1px solid rgba(200,255,0,0.1)' }}
                  >
                    <button
                      onClick={handleConfirmVoiceAnswer}
                      disabled={!pendingVoiceAnswer.editedText.trim()}
                      className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      Use this answer
                    </button>
                    <button
                      onClick={handleRetryVoice}
                      className="text-[10px] text-text-muted hover:text-status-red underline underline-offset-2 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Voice transcript — displayed locally only; suppressed when pending review is shown */}
              {voiceTranscript && !pendingVoiceAnswer && (
                <div
                  className="mt-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(139,92,246,0.18)',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: '#8b5cf6' }}
                  >
                    {DONNA_PUBLIC_NAME} heard
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {voiceTranscript}
                  </p>
                  {activeMode !== 'create_template' && activeMode !== 'guided_task' && (
                    <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                      To save, use &quot;Capture a note&quot; below.
                    </p>
                  )}
                  <button
                    onClick={() => setVoiceTranscript(null)}
                    className="mt-1 text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Type instead */}
              {!typeInstead ? (
                <button
                  onClick={() => setTypeInstead(true)}
                  className="mt-2.5 text-[11px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                >
                  Type instead
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    placeholder='Type a command or question — e.g. "What is this page?" or "Create a template for Orange 2."'
                    value={typedText}
                    onChange={e => setTypedText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleCommandSubmit()
                      }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCommandSubmit}
                      disabled={!typedText.trim()}
                      className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => { setTypeInstead(false); setTypedText('') }}
                      className="text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Route-aware suggestions — from page context registry */}
            <div
              className="px-4 py-3"
              style={{
                borderTop: '1px solid rgba(139,92,246,0.1)',
                background: 'var(--bg-surface)',
              }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Suggested questions
              </p>
              <div className="space-y-0.5">
                {voicePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="w-full text-left text-[11px] text-text-secondary hover:text-text-primary
                      px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition-all leading-snug"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Command response card ── */}
          {commandResponse && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background:
                  commandResponse.type === 'honest'
                    ? 'rgba(255,149,0,0.06)'
                    : 'rgba(139,92,246,0.06)',
                border:
                  commandResponse.type === 'honest'
                    ? '1px solid rgba(255,149,0,0.2)'
                    : '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: commandResponse.type === 'honest' ? '#FF9500' : '#8b5cf6' }}
                  >
                    {commandResponse.label ?? (commandResponse.type === 'honest' ? 'Not available yet' : DONNA_PUBLIC_NAME)}
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {commandResponse.message}
                  </p>
                </div>
                <button
                  onClick={() => setCommandResponse(null)}
                  aria-label="Dismiss"
                  className="shrink-0 text-text-muted hover:text-text-primary transition-colors mt-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ── Sprint 290: Onboarding suggested routes — shown when step 1 intent was unclear ── */}
          {showOnboardingSuggestions && !genericDraft && !templateDraft && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2"
              style={{
                background: 'rgba(200,255,0,0.04)',
                border: '1px solid rgba(200,255,0,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
                  Get started
                </p>
                <button
                  onClick={() => setShowOnboardingSuggestions(false)}
                  aria-label="Dismiss"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {DONNA_ONBOARDING_STEPS[1].suggestedRoutes?.map((route) => (
                  <button
                    key={route.taskHint}
                    onClick={() => {
                      setShowOnboardingSuggestions(false)
                      handleVoiceTranscript(route.taskHint)
                    }}
                    className="w-full text-left text-[12px] text-text-secondary hover:text-text-primary
                      px-3 py-2 rounded-lg hover:bg-surface-raised transition-all leading-snug border border-border"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    {route.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-text-muted leading-snug pt-1">
                Voice can fill drafts. Final saves always require the on-screen button.
              </p>
            </div>
          )}

          {/* ── Context summary result card — read-only live data, no writes (Sprint 265) ── */}
          {contextSummary && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2.5"
              style={{
                background: 'rgba(200,255,0,0.04)',
                border: '1px solid rgba(200,255,0,0.18)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
                    {contextSummary.title}
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {contextSummary.summary}
                  </p>
                </div>
                <button
                  onClick={() => setContextSummary(null)}
                  aria-label="Dismiss summary"
                  className="shrink-0 text-text-muted hover:text-text-primary transition-colors mt-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {contextSummary.keyFacts.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                    Key facts
                  </p>
                  <ul className="space-y-0.5">
                    {contextSummary.keyFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
                        <span className="shrink-0 mt-px text-lime">·</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {contextSummary.suggestedNextSteps.length > 0 && (
                <div
                  className="pt-2"
                  style={{ borderTop: '1px solid rgba(200,255,0,0.1)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                    Suggested next steps
                  </p>
                  <ul className="space-y-0.5">
                    {contextSummary.suggestedNextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
                        <span className="shrink-0 mt-px text-lime">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {contextSummary.missingData.length > 0 && (
                <div
                  className="pt-2"
                  style={{ borderTop: '1px solid rgba(200,255,0,0.1)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                    Missing data
                  </p>
                  <ul className="space-y-0.5">
                    {contextSummary.missingData.map((m, i) => (
                      <li key={i} className="text-[11px] text-text-muted leading-snug">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p
                className="text-[9px] text-text-muted pt-1"
                style={{ borderTop: '1px solid rgba(200,255,0,0.08)' }}
              >
                Read-only · fetched {new Date(contextSummary.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* ── Current context card — hidden in template, guided-task, and review_queue modes ── */}
          {activeMode !== 'create_template' && activeMode !== 'guided_task' && activeMode !== 'review_queue' && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">
                  Current context
                </p>
                <p className="text-sm font-semibold text-text-primary">{ctx.screenName}</p>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.assistantIntro}</p>
              {ctx.approvalRequiredFor.length > 0 && (
                <p
                  className="text-[10px] text-text-muted leading-snug pt-2"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  Requires approval:{' '}
                  {ctx.approvalRequiredFor
                    .slice(0, 2)
                    .map(a => a.replace(/_/g, ' '))
                    .join(', ')}
                  .
                </p>
              )}
            </div>
          )}

          {/* ── Inline response: Guide me ── */}
          {activeMode === 'guide' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: '#8b5cf6' }}
              >
                Suggested next step
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.nextAction}</p>
            </div>
          )}

          {/* ── Inline response: Explain this screen ── */}
          {activeMode === 'explain' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: '#8b5cf6' }}
              >
                About this screen
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.purpose}</p>
            </div>
          )}

          {/* ── Inline response: Find something ── */}
          {activeMode === 'find' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Jump to
              </p>
              <div className="space-y-0.5">
                {QUICK_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closePanel}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg
                      text-[12px] text-text-secondary hover:text-text-primary hover:bg-surface-raised
                      transition-all"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Template creation mode (Sprints 262/263) — wired, saves to DB ── */}
          {activeMode === 'create_template' && (
            <>
              {/* "Nothing saves until you approve" notice */}
              <div
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: 'rgba(139,92,246,0.05)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <p className="text-[11px] text-text-secondary leading-snug">
                  {DONNA_PUBLIC_NAME} can draft this template, but nothing is saved until you approve.
                </p>
              </div>

              {/* Command input — shown when no draft exists yet */}
              {!templateDraft && (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      placeholder='e.g. "Create a template for Orange 2 with warm-up, rally skills, point play, and matches."'
                      value={templateCommandInput}
                      onChange={e => setTemplateCommandInput(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleParseTemplate}
                        disabled={!templateCommandInput.trim()}
                        className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Start Draft
                      </button>
                      <button
                        onClick={() => setActiveMode(null)}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Quick starts — deterministic examples, no AI */}
                  <div
                    className="rounded-xl px-3.5 py-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                      Quick starts
                    </p>
                    <div className="space-y-0.5">
                      {TEMPLATE_QUICK_STARTS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const draft = parseTemplateDraft(s)
                            setTemplateDraft(draft)
                            setFromVoiceCapture(false)
                            setTemplateCommandInput('')
                            const firstQ = draft.missingQuestions[0] ?? null
                            if (firstQ) speakAssistantText(firstQ.question)
                            else speakAssistantText('I have enough to draft this. Review it before saving.')
                          }}
                          className="w-full text-left text-[11px] text-text-secondary hover:text-text-primary
                            px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition-all leading-snug"
                        >
                          &ldquo;{s}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live draft panel — shown once a draft exists */}
              {templateDraft && (
                <TemplateDraftPanel
                  draft={templateDraft}
                  onUpdateDraft={d => setTemplateDraft(d)}
                  onCancel={handleCancelTemplate}
                  fromVoice={fromVoiceCapture}
                  onQuestionAnswered={(nextQ, updatedDraft) => {
                    if (nextQ) {
                      speakAssistantText(nextQ.question)
                    } else if (isDraftReadyForReview(updatedDraft)) {
                      speakAssistantText('I have enough to draft this. Review it before saving.')
                    }
                  }}
                />
              )}
            </>
          )}

          {/* ── Multi-step plan card — Sprint 286 ── */}
          {multiStepPlan && activeMode !== 'guided_task' && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(200,255,0,0.18)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
                  Multi-step plan
                </p>
                <button
                  onClick={() => { setMultiStepPlan(null); setMultiStepIndex(0) }}
                  className="text-[10px] text-text-muted hover:text-status-red transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[11px] text-text-secondary leading-snug">{multiStepPlan.summary}</p>
              <div className="space-y-1">
                {multiStepPlan.steps.map((step, i) => (
                  <div key={step.taskId} className="flex items-start gap-2">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5"
                      style={
                        i < multiStepIndex
                          ? { background: 'rgba(48,209,88,0.15)', color: '#30D158' }
                          : i === multiStepIndex
                          ? { background: 'rgba(200,255,0,0.15)', color: '#C8FF00' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#555' }
                      }
                    >
                      {i < multiStepIndex ? '✓' : step.stepNumber}
                    </span>
                    <div>
                      <p className={`text-[11px] font-medium leading-snug ${i === multiStepIndex ? 'text-text-primary' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-text-muted leading-snug">{step.why}</p>
                    </div>
                  </div>
                ))}
              </div>
              {multiStepIndex < multiStepPlan.steps.length && (
                <button
                  onClick={() => {
                    const step = multiStepPlan.steps[multiStepIndex]
                    if (step) {
                      handleStartGenericTask(step.taskId, false)
                      setMultiStepIndex(prev => prev + 1)
                    }
                  }}
                  className="btn-lime text-xs px-3 py-1.5"
                >
                  Start Step {multiStepPlan.steps[multiStepIndex]?.stepNumber}: {multiStepPlan.steps[multiStepIndex]?.label}
                </button>
              )}
            </div>
          )}

          {/* ── Guided task mode — wired tasks save via server action; unwired show honest notice ── */}
          {activeMode === 'guided_task' && genericDraft && (
            <>
              <div
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: 'rgba(139,92,246,0.05)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <p className="text-[11px] text-text-secondary leading-snug">
                  {WIRED_TASK_IDS.has(genericDraft.taskId)
                    ? `${DONNA_PUBLIC_NAME} will collect the information — nothing is saved until you click Approve and Save.`
                    : `${DONNA_PUBLIC_NAME} will collect the information — nothing is saved until a save action is available and you explicitly approve.`}
                </p>
              </div>

              {/* Object resolver panel — shown when a field needs identity confirmation */}
              {resolutionContext && (
                <DonnaObjectResolverPanel
                  result={
                    resolutionContext.result ?? {
                      ok: false,
                      objectType: resolutionContext.objectType,
                      query: resolutionContext.query,
                      status: 'error',
                      candidates: [],
                      message: 'Loading…',
                      safetyNotes: [],
                    }
                  }
                  isLoading={resolutionContext.isLoading}
                  onSelect={handleSelectResolvedObject}
                  onCancel={handleCancelResolution}
                />
              )}

              <GenericDraftPanel
                draft={genericDraft}
                onUpdateDraft={handleUpdateGenericDraft}
                onCancel={handleCancelGenericTask}
                fromVoice={fromVoiceCapture}
                isWired={WIRED_TASK_IDS.has(genericDraft.taskId)}
                onApprove={handleGenericDraftApprove}
                onQuestionAnswered={(nextQ, updatedDraft) => {
                  if (nextQ) {
                    speakAssistantText(nextQ.question)
                  } else {
                    const c = DONNA_TASK_CONTRACTS[updatedDraft.taskId]
                    speakAssistantText(`${c?.label ?? 'Draft'} is ready to review.`)
                  }
                }}
              />
            </>
          )}

          {/* ── Review Queue mode — Sprint 273 ── */}
          {activeMode === 'review_queue' && (
            <DonnaReviewQueuePanel
              data={reviewQueueData}
              isLoading={isLoadingReviewQueue}
              onRefresh={() => void handleOpenReviewQueue()}
              onClose={closePanel}
              onStartTask={(taskId) => {
                handleStartGenericTask(taskId, false)
              }}
            />
          )}

          {/* ── Predictive suggestions — shown when context is loaded (Sprint 267) ── */}
          {suggestions.length > 0 && activeMode !== 'create_template' && activeMode !== 'guided_task' && activeMode !== 'review_queue' && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5">
                Recommendations
              </p>
              {suggestions.map(suggestion => (
                <DonnaSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onStartTask={(taskId) => {
                    handleStartGenericTask(taskId, false)
                  }}
                  onNavigate={(href) => {
                    router.push(href)
                    closePanel()
                  }}
                  onDismiss={(id) => {
                    setSuggestions(prev => prev.filter(s => s.id !== id))
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Ask about this page — hidden in template, guided-task, and review_queue modes ── */}
          {activeMode !== 'create_template' && activeMode !== 'guided_task' && activeMode !== 'review_queue' && (
            <button
              onClick={() => void handleContextSummary()}
              disabled={isLoadingContext}
              className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 text-text-secondary hover:text-text-primary disabled:opacity-60"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(200,255,0,0.2)' }}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: '#C8FF00' }}
                />
                <div>
                  <p className="text-[12px] font-semibold leading-tight text-lime">
                    {isLoadingContext ? 'Reading academy data…' : 'Ask about this page'}
                  </p>
                  <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                    Summarize what&apos;s happening right now, based on live data.
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* ── Mode buttons ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5 pt-1">
              What would you like?
            </p>

            {/* Review Queue button — Sprint 273 */}
            <button
              onClick={() => void handleOpenReviewQueue()}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150',
                activeMode === 'review_queue'
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary',
              )}
              style={{
                background: activeMode === 'review_queue' ? 'rgba(139,92,246,0.06)' : 'var(--bg-surface)',
                border: activeMode === 'review_queue' ? '1px solid rgba(139,92,246,0.2)' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <Inbox className={cn(
                  'w-3.5 h-3.5 mt-0.5 shrink-0',
                  activeMode === 'review_queue' ? 'text-violet-400' : 'text-text-muted',
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold leading-tight">Review Queue</p>
                    {reviewQueueData && reviewQueueData.totalCount > 0 && (
                      <span className="text-[9px] font-semibold px-1 py-0.5 rounded"
                        style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}>
                        {reviewQueueData.totalCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                    Review pending notes, unlinked captures, and sessions that need blocks.
                  </p>
                </div>
              </div>
            </button>

            {MODES.map(({ mode, label, desc, Icon }) => (
              <button
                key={mode}
                onClick={() => handleModeClick(mode)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150',
                  activeMode === mode
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
                style={{
                  background:
                    activeMode === mode ? 'rgba(139,92,246,0.06)' : 'var(--bg-surface)',
                  border:
                    activeMode === mode
                      ? '1px solid rgba(139,92,246,0.2)'
                      : '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 mt-0.5 shrink-0',
                      activeMode === mode ? 'text-violet-400' : 'text-text-muted',
                    )}
                  />
                  <div>
                    <p className="text-[12px] font-semibold leading-tight">{label}</p>
                    <p className="text-[11px] text-text-muted leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Quick actions for this page — contextual task shortcuts (Sprint 266) ── */}
          {pageTaskShortcuts.length > 0 && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-1.5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                Quick actions for this page
              </p>
              <div className="space-y-0.5">
                {pageTaskShortcuts.map(taskId => {
                  const contract = DONNA_TASK_CONTRACTS[taskId]
                  if (!contract) return null
                  return (
                    <button
                      key={taskId}
                      onClick={() => handleStartGenericTask(taskId, false)}
                      className="w-full text-left text-[11px] text-text-secondary hover:text-text-primary
                        px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition-all leading-snug"
                    >
                      {contract.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dev-only QA harness — Mega Sprint 297–310 */}
          <DonnaVoiceDiagnostics
            realtimeStatus={realtimeStatus}
            realtimeUnavailableReason={realtimeUnavailableReason}
            voiceGreetingStatus={voiceGreetingStatus}
            isSpeaking={isSpeaking}
            isVoiceListening={isVoiceListening}
            isVoiceSupported={isVoiceSupported}
            voiceMode={activatedVoiceModeRef.current}
            wakeListeningActive={wakeListeningActive}
            onTestRealtime={() => { void playOnboardingVoice() }}
            onTestBrowserVoice={testBrowserVoice}
            onResetVoice={resetVoice}
          />

        </div>

        {/* Footer — capability summary */}
        <div
          className="px-4 py-3 shrink-0 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            What I can do right now
          </p>
          <ul className="space-y-1">
            {[
              'Summarize any page with live academy data',
              'Guide you through the current page',
              'Take you to approved Academy OS pages',
              'Capture notes',
              'Draft class templates for review',
              'Collect info for sessions, notes, groups, and more',
              'Save only after your explicit approval',
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                <span className="mt-px shrink-0" style={{ color: '#8b5cf6' }}>·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-text-muted leading-snug">
            Some commands, like advancing setup questions by voice, still use the on-screen controls for safety.
          </p>
        </div>
      </aside>

      {/* Quick Capture drawer — opened from Capture mode */}
      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />
    </>
  )
}

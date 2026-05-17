'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight, Layers, Inbox,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
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
  fetchPlayerProgressSummaryAction,
  fetchSessionBriefAction,
} from '@/app/director/_actions/donnaDirectorIntelligenceActions'
// Sprint 282 — Coach Communication Draft
import { saveCoachCommunicationDraftAction } from '@/app/director/_actions/saveCoachCommunicationDraftAction'
// Sprint 456 — Coach Intelligence Brief
import { fetchCoachIntelligenceAction } from '@/app/director/_actions/donnaCoachIntelligenceAction'
// Sprint 286 — Multi-step planner
import { detectMultiStepIntent } from '@/components/assistant/donnaMultiStepPlanner'
import type { DonnaMultiStepPlan } from '@/components/assistant/donnaMultiStepPlanner'
// Sprint 315–321 — Conversation Controller V1
import {
  createConversationState,
  handleInput as controllerHandleInput,
  discardCurrentDraft as controllerDiscard,
  detectRevisionCommand,
} from '@/components/assistant/donnaConversationController'
import type { ConversationState } from '@/components/assistant/donnaConversationController'
// Sprint 322–335 — Draft Card + Preview + Failure Modes
import { DonnaClassTemplateDraftPreview } from '@/components/assistant/DonnaClassTemplateDraftPreview'
import { resetDraft, getNextQuestion as runtimeNextQuestion } from '@/components/assistant/donnaDraftRuntime'
import { getFailureMode } from '@/components/assistant/donnaFailureModes'
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
// Sprint 360 — Version history panel
import { DonnaVersionHistoryPanel } from '@/components/assistant/DonnaVersionHistoryPanel'
// Sprint 366 — Communication draft
import {
  createCommunicationDraft,
  applyCommunicationField,
} from '@/components/assistant/donnaCommunicationDraft'
import type { CommunicationDraft } from '@/components/assistant/donnaCommunicationDraft'
// Sprint 369 — Daily brief (type only — card rendered in DonnaWorkflowCards)
import type { DailyBrief } from '@/components/assistant/donnaDailyBrief'
// Sprint 370 — Attention engine (type only — card rendered in DonnaWorkflowCards)
import type { AttentionReport } from '@/components/assistant/donnaAttentionEngine'
// Sprint 371 — Coach brief workflow
import { createCoachBriefDraft } from '@/components/assistant/donnaCoachBriefWorkflow'
// Sprint 373 — Review queue badge
import { DonnaReviewQueueBadge } from '@/components/assistant/DonnaReviewQueueBadge'
// Sprint 375 — Rule-based recommendations
import { evaluateRecommendations } from '@/components/assistant/donnaRecommendationEngine'
import type { RecommendationSignals } from '@/components/assistant/donnaRecommendationEngine'
import type { DonnaRecommendationSet, DonnaRecommendation } from '@/components/assistant/donnaRecommendationTypes'
// Sprint 376 — Learning feedback signals
import { recordSignal } from '@/components/assistant/donnaLearningSignals'
// Sprint 377 — Preference memory (localStorage-backed)
import {
  loadPreferences,
  recordWorkflowUsed,
  recordCategoryUsed,
} from '@/components/assistant/donnaPreferenceMemory'
import type { DonnaPreferences } from '@/components/assistant/donnaPreferenceMemory'
// Sprint 361 — Audit trail (getAuditTrail used in DonnaDeveloperTools)
import { appendAuditEvent } from '@/components/assistant/donnaAuditTrail'
// Sprint 350 — Server TTS client + voice policy
import { speakWithServerTts, stopServerTts } from '@/components/assistant/donnaServerTtsClient'
// DONNA_VOICE_MODE_LABELS used in DonnaDeveloperTools
import type { DonnaVoiceOutputMode } from '@/components/assistant/donnaVoicePolicy'
// Sprint 359 — Persistent draft storage (sessionStorage only)
// hasDraftSession used in DonnaDeveloperTools
import {
  saveDraftToSession,
  loadDraftFromSession,
  clearDraftSession,
} from '@/components/assistant/donnaDraftPersistence'
// Sprint 381 — Director-Initiated Donna Workflows
import { matchDirectorWorkflowCommand } from '@/components/assistant/donnaDirectorWorkflowCommands'
import type { DirectorWorkflowCommandId } from '@/components/assistant/donnaDirectorWorkflowCommands'
// DonnaAttendanceExceptionCard used via DonnaAttendanceLayer in DonnaWorkflowCards
import {
  type AttendanceExceptionDraft,
  createAttendanceExceptionDraft,
  attendanceExceptionReadyToSubmit,
  buildAttendanceStatement,
} from '@/components/assistant/donnaAttendanceWorkflow'
// Sprint 382 — Workflow Card Actions (makeLastCardAction used in DonnaWorkflowCards)
import type { LastCardActionRecord } from '@/components/assistant/donnaWorkflowCardActions'
// Sprint 383 — Attendance Session Resolution
import {
  type AttendanceSessionOption,
  extractNaturalAttendanceFlags,
  looksLikeNaturalAttendancePhrase,
} from '@/components/assistant/donnaAttendanceSessionResolution'
import { fetchRecentSessionsAction } from '@/app/director/_actions/donnaAttendanceSessionActions'
// Sprint 384 — Extracted modular components
import { DonnaDeveloperTools } from '@/components/assistant/DonnaDeveloperTools'
import { DonnaVoiceLayer } from '@/components/assistant/DonnaVoiceLayer'
import { DonnaWorkflowCards } from '@/components/assistant/DonnaWorkflowCards'
// Sprint 647 — First Daily Welcome
import {
  getDailyGreetingState,
  markGreetedToday,
  type DailyGreetingState,
} from '@/lib/donna/donnaDailyGreeting'

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
  'summarize_player_progress',
  'draft_session_brief',
  'draft_coach_brief',
])

// Tasks that are wired but produce a read-only summary (no DB write).
// These show "Generate Summary" instead of "Approve and Save".
const READONLY_TASK_IDS = new Set<DonnaTaskId>([
  'summarize_player_progress',
  'draft_session_brief',
  'draft_coach_brief',
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
  category: 'Suggestion' | 'Opportunity' | 'Reminder' | 'Navigation'
  safeStatus: string
}

const MODES: ModeConfig[] = [
  {
    mode: 'create_template',
    label: 'Create Template',
    desc: 'Draft a class template with Donna. Nothing saves until you approve.',
    Icon: Layers,
    category: 'Suggestion',
    safeStatus: 'Saves only after your review',
  },
  {
    mode: 'guide',
    label: 'Guide me',
    desc: 'See the suggested next step for this page.',
    Icon: Compass,
    category: 'Suggestion',
    safeStatus: 'Read-only — no changes made',
  },
  {
    mode: 'find',
    label: 'Find something',
    desc: 'Jump to players, sessions, curriculum, or review items.',
    Icon: Search,
    category: 'Navigation',
    safeStatus: 'Navigation only — no edits',
  },
  {
    mode: 'capture',
    label: 'Capture a note',
    desc: 'Save a player observation or capture a director thought.',
    Icon: PenLine,
    category: 'Reminder',
    safeStatus: 'Goes to draft — not saved automatically',
  },
  {
    mode: 'explain',
    label: 'Explain this screen',
    desc: 'Understand what this page is for.',
    Icon: BookOpen,
    category: 'Opportunity',
    safeStatus: 'Informational only',
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
  // Sprint 647 — daily greeting state (localStorage-backed, once per day)
  const [dailyGreetingState, setDailyGreetingState] = useState<DailyGreetingState | null>(null)
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
        realtimeSpeak(
          text,
          () => {
            // Real response.done received — confirmed speech.
            if (playVersionRef.current === version) setVoiceGreetingStatus('done')
          },
          () => {
            // Timeout fired — speech was NOT confirmed. Do not show "Donna spoke".
            if (playVersionRef.current === version) setVoiceGreetingStatus('stalled')
          },
        )
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

  // Sprint 350 — Contract TTS: server → browser cascade for known Donna prompts.
  // Use ONLY for: onboarding questions, next missing-field questions, protected_action_blocked.
  // Do NOT call globally — speakAssistantText remains for voice greeter, test paths, etc.
  function speakDonna(text: string) {
    void speakWithServerTts(text, (status) => {
      if (status === 'speaking') setIsSpeaking(true)
      else if (status === 'done' || status === 'error') setIsSpeaking(false)
    }).then((result) => {
      const source: DonnaVoiceOutputMode =
        result.source === 'server' ? 'contract_tts'
        : result.source === 'browser' ? 'browser_tts'
        : 'silent'
      setLastServerTtsInfo({ source, text: text.slice(0, 80) })
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

  // Sprint 315–321 — Conversation controller state (intent tracking + undo/go-back)
  // Runs alongside existing routing; full migration in a future sprint.
  const [convState, setConvState] = useState<ConversationState>(createConversationState)
  // Sprint 322 — show draft review panel triggered by controller or "show me the draft"
  const [convShowDraftReview, setConvShowDraftReview] = useState(false)
  // Sprint 359 — tracks whether the current draft was restored from sessionStorage
  const [draftRestoredFromSession, setDraftRestoredFromSession] = useState(false)
  // Sprint 366 — Communication draft (alongside genericDraft/templateDraft)
  const [communicationDraft, setCommunicationDraft] = useState<CommunicationDraft | null>(null)
  // Sprint 368 — Message review panel (shows when communicationDraft.status === 'ready')
  const [showMessageReview, setShowMessageReview] = useState(false)
  // Sprint 369 — Daily brief state
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null)
  const [isDailyBriefLoading, setIsDailyBriefLoading] = useState(false)
  // Sprint 370 — Attention report state
  const [attentionReport, setAttentionReport] = useState<AttentionReport | null>(null)
  const [isAttentionLoading, setIsAttentionLoading] = useState(false)
  // Sprint 373 — Review queue pending count (fetched on panel open)
  const [reviewQueuePendingCount, setReviewQueuePendingCount] = useState<number>(0)
  // Sprint 375 — Rule-based recommendation set (computed from signals on panel open)
  const [recommendationSet, setRecommendationSet] = useState<DonnaRecommendationSet | null>(null)
  // Sprint 377 — Preference memory (loaded from localStorage on mount)
  const [preferences, setPreferences] = useState<DonnaPreferences>(() => loadPreferences())
  // Sprint 381 — Attendance exception draft (director-initiated)
  const [attendanceExceptionDraft, setAttendanceExceptionDraft] = useState<AttendanceExceptionDraft | null>(null)
  // Sprint 382 — Last workflow card action (Dev Tools tracking)
  const [lastCardAction, setLastCardAction] = useState<LastCardActionRecord | null>(null)
  // Sprint 383 — Attendance session resolution
  const [attendanceSessionOptions, setAttendanceSessionOptions] = useState<AttendanceSessionOption[]>([])
  const [isLoadingAttendanceSessions, setIsLoadingAttendanceSessions] = useState(false)
  const [attendanceQueueing, setAttendanceQueueing] = useState(false)
  const [attendanceQueueResult, setAttendanceQueueResult] = useState<DonnaApprovalExecutionResult | null>(null)

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
  // Sprint 350 — tracks last server TTS call result for Developer Tools display
  const [lastServerTtsInfo, setLastServerTtsInfo] = useState<{
    source: DonnaVoiceOutputMode
    text: string
  } | null>(null)

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
    setDailyGreetingState(null)
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
    setConvState(createConversationState())
    setConvShowDraftReview(false)
    setCommunicationDraft(null)
    setAttendanceExceptionDraft(null)
    setAttendanceSessionOptions([])
    setAttendanceQueueResult(null)
    realtimeDisconnect()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopServerTts()
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

  // Sprint 405 — donna:open custom event listener
  // Allows any page component to open DONNA and pre-fill the input via:
  // window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: '...' } }))
  useEffect(() => {
    function handleDonnaOpen(e: Event) {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail
      setPanelOpen(true)
      if (detail?.prompt) {
        setTypedText(detail.prompt)
      }
    }
    window.addEventListener('donna:open', handleDonnaOpen)
    return () => window.removeEventListener('donna:open', handleDonnaOpen)
  }, [])

  // Clear all inline state on route change
  useEffect(() => {
    // Sprint 359: Save active draft to session BEFORE clearing state
    setConvState(prev => {
      if (prev.activeDraft !== null && prev.phase !== 'cancelled' && prev.phase !== 'approved') {
        saveDraftToSession(prev)
      }
      return prev
    })

    setActiveMode(null)
    setVoiceTranscript(null)
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
    setConvState(createConversationState())
    setConvShowDraftReview(false)
    setDraftRestoredFromSession(false)
    setCommunicationDraft(null)
    setAttendanceExceptionDraft(null)
    setAttendanceSessionOptions([])
    setAttendanceQueueResult(null)
    setDailyGreetingState(null)
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
    const lower = text.toLowerCase()

    // Sprint 315–321: Run conversation controller to track intent and handle undo/go-back.
    // Controller runs first, before legacy routing. Undo and go-back are handled exclusively
    // by the controller; all other intents fall through to the existing routing below.
    const controllerTurn = controllerHandleInput(text, convState)
    setConvState(controllerTurn.nextState)

    if (
      controllerTurn.nextState.lastIntent?.intentType === 'undo' ||
      controllerTurn.nextState.lastIntent?.intentType === 'go_back'
    ) {
      appendAuditEvent({ type: 'undo_applied', description: 'Director undid last draft change', workflowId: convState.activeDraft?.workflowId ?? undefined })
      setCommandResponse({ message: controllerTurn.speakText, type: 'info', label: 'Undo' })
      speakAssistantText(controllerTurn.speakText)
      return
    }

    if (
      controllerTurn.nextState.lastIntent?.intentType === 'cancel' &&
      convState.activeDraft !== null
    ) {
      setConvState(controllerDiscard(controllerTurn.nextState))
      setCommandResponse({ message: controllerTurn.speakText, type: 'info', label: 'Cancelled' })
      speakAssistantText(controllerTurn.speakText)
      return
    }

    // Early return when controller just created a new draft — bypass legacy routing
    if (convState.activeDraft === null && controllerTurn.nextState.activeDraft !== null) {
      if (controllerTurn.speakText) speakAssistantText(controllerTurn.speakText)
      if (controllerTurn.showDraftReview) setConvShowDraftReview(true)
      console.log('[DonnaGoldenPath] draft_started', {
        workflowId: controllerTurn.nextState.activeDraft.workflowId,
        fields: Object.keys(controllerTurn.nextState.activeDraft.fields),
      })
      appendAuditEvent({ type: 'draft_started', description: 'Draft started via voice', workflowId: controllerTurn.nextState.activeDraft.workflowId ?? undefined })
      recordSignal('workflow_started', { workflowId: controllerTurn.nextState.activeDraft.workflowId ?? undefined })
      if (controllerTurn.nextState.activeDraft.workflowId) {
        setPreferences(recordWorkflowUsed(controllerTurn.nextState.activeDraft.workflowId))
      }
      return
    }

    // Voice approval safety — voice may never trigger saves, level changes, or sends.
    if (isProtectedVoicePhrase(lower)) {
      appendAuditEvent({ type: 'protected_action_blocked', description: 'Voice tried to execute a protected action', workflowId: convState.activeDraft?.workflowId ?? undefined })
      setCommandResponse({
        message: VOICE_PROTECTED_RESPONSE,
        type: 'honest',
        label: 'Use the on-screen button',
      })
      return
    }

    // Sprint 322: When the controller has an active draft and no legacy draft exists,
    // route ALL input through the controller (it owns this session).
    if (convState.activeDraft !== null && !genericDraft && !templateDraft) {
      // First check for natural revision commands (e.g. "make it more competitive")
      const revision = detectRevisionCommand(text)
      if (revision) {
        const turn = controllerHandleInput(text, convState)
        setConvState(turn.nextState)
        if (turn.speakText) speakAssistantText(turn.speakText)
        if (turn.showDraftReview) setConvShowDraftReview(true)
        appendAuditEvent({ type: 'revision_applied', description: `Revision: ${revision.fieldId} → ${revision.value}`, workflowId: convState.activeDraft?.workflowId ?? undefined, fieldId: revision.fieldId, value: revision.value })
        return
      }

      // Route all other input through the controller
      const turn = controllerHandleInput(text, convState)
      setConvState(turn.nextState)
      if (turn.speakText) speakAssistantText(turn.speakText)
      if (turn.showDraftReview) setConvShowDraftReview(true)
      if (turn.displayMessage) {
        setCommandResponse({ message: turn.displayMessage, type: 'info', label: 'Donna' })
      }
      // Handle UI actions from controller
      switch (turn.uiAction.type) {
        case 'start_template_draft': {
          const draft = parseTemplateDraft(turn.uiAction.initialText)
          setTemplateDraft(draft)
          setFromVoiceCapture(true)
          setActiveMode('create_template')
          const firstQ = draft.missingQuestions[0] ?? null
          if (firstQ) speakAssistantText(firstQ.question)
          break
        }
        case 'open_review_queue':
          void handleOpenReviewQueue()
          break
        case 'navigate':
          router.push(turn.uiAction.destination)
          break
        case 'open_onboarding':
          router.push('/director/onboarding/interview')
          break
        case 'fetch_context':
          void handleContextSummary()
          break
      }
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
        speakDonna(nextQ.question)
      } else {
        speakDonna('I have enough to draft this. Review it before saving.')
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
          speakDonna(nextQ.question)
        } else {
          const c = DONNA_TASK_CONTRACTS[updated.taskId]
          speakDonna(`${c?.label ?? 'Draft'} is ready to review.`)
        }
        return
      }
    }

    // 2.5. Sprint 381 — Attendance exception slot-filling (active draft, still collecting)
    if (attendanceExceptionDraft && !attendanceExceptionReadyToSubmit(attendanceExceptionDraft)) {
      const updated = applyAttendanceAnswer(attendanceExceptionDraft, text)
      setAttendanceExceptionDraft(updated)
      if (attendanceExceptionReadyToSubmit(updated)) {
        speakDonna('Attendance exception draft is ready for your review.')
      }
      return
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

    // 5.4. Sprint 381/383 — New COO commands: attendance exception + recommendation summary
    // Sprint 383: pass text for natural language attendance phrases
    {
      const cooCmd = matchDirectorWorkflowCommand(lower)
      if (cooCmd === 'attendance_exception_draft' || cooCmd === 'recommendation_summary') {
        dispatchCooCommand(cooCmd, text)
        return
      }
    }

    // 5.5. Review queue intent — Sprint 273
    if (isReviewQueuePhrase(lower)) {
      void handleOpenReviewQueue()
      return
    }

    // 5.55. Sprint 369 — Daily brief intent
    if (isDailyBriefPhrase(lower)) {
      void handleFetchDailyBrief()
      return
    }

    // 5.56. Sprint 370 — Attention intent
    if (isAttentionPhrase(lower)) {
      void handleFetchAttention()
      return
    }

    // 5.6. Sprint 366 — Communication draft intent (for unrouted cases)
    // Only triggers when no draft/template is active and no controller draft is running.
    if (!genericDraft && !templateDraft && convState.activeDraft === null) {
      if (
        lower.includes('draft a parent') || lower.includes('parent message') ||
        lower.includes('parent update') || lower.includes('write to the parent')
      ) {
        const draft = createCommunicationDraft('parent_update')
        setCommunicationDraft(draft)
        setCommandResponse({ message: "I've started a parent update draft. What's the topic?", type: 'info', label: 'Communication Draft' })
        return
      }
      if (
        lower.includes('draft a coach') || lower.includes('coach brief') ||
        lower.includes('brief the coach') || lower.includes('message to coach') ||
        lower.includes('prepare coach brief') || lower.includes('brief for coach')
      ) {
        const draft = createCoachBriefDraft()
        setCommunicationDraft(draft)
        setCommandResponse({ message: "Coach brief started. Which coach or session is this for?", type: 'info', label: 'Coach Brief' })
        return
      }
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

    // Sprint 398: honest early return for tasks not yet wired — no silent failure
    if (!WIRED_TASK_IDS.has(taskId)) {
      const contract = DONNA_TASK_CONTRACTS[taskId]
      setCommandResponse({
        message: `${contract?.label ?? taskId} is coming soon. This capability is in the roadmap and will be connected in a future sprint. Try one of the active DONNA commands instead.`,
        type: 'honest',
        label: 'Coming soon',
      })
      return
    }

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
    if (firstQ) speakDonna(firstQ.question)
  }

  function handleCancelGenericTask() {
    setGenericDraft(null)
    setActiveMode(null)
    setFromVoiceCapture(false)
  }

  // Sprint 322 — Conversation controller draft action handlers

  function handleConvUndo() {
    if (!convState.activeDraft) return
    const turn = controllerHandleInput('undo that', convState)
    setConvState(turn.nextState)
    if (turn.speakText) speakDonna(turn.speakText)
  }

  function handleConvStartOver() {
    if (!convState.activeDraft) return
    const fresh = resetDraft(convState.activeDraft)
    setConvState(prev => ({ ...prev, activeDraft: fresh, phase: 'collecting', currentFieldId: null }))
    setConvShowDraftReview(false)
    const nextQ = runtimeNextQuestion(fresh)
    if (nextQ) speakDonna(nextQ.question)
    else speakDonna("Draft reset. Tell me what you'd like to build.")
  }

  function handleConvDiscard() {
    appendAuditEvent({ type: 'draft_discarded', description: 'Director discarded active draft', workflowId: convState.activeDraft?.workflowId ?? undefined })
    recordSignal('workflow_discarded', { workflowId: convState.activeDraft?.workflowId ?? undefined })
    setConvState(controllerDiscard(convState))
    setConvShowDraftReview(false)
    // Sprint 359: clear session storage when director explicitly discards
    clearDraftSession()
    setDraftRestoredFromSession(false)
  }

  function handleConvReview() {
    setConvShowDraftReview(true)
    appendAuditEvent({ type: 'review_opened', description: 'Director opened draft review panel', workflowId: convState.activeDraft?.workflowId ?? undefined })
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
      speakDonna(nextSpoken)
      return
    }

    if (step === 1) {
      // First-action step — detect intent and route.
      setOnboardingStep(null)
      // Sprint 350: mark intro completed so it does not repeat on route change.
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('academyos:donna:introCompleted:v1', 'true')
      }

      // Template creation intent
      if (isTemplateCreationIntent(answer)) {
        const draft = parseTemplateDraft(answer)
        setTemplateDraft(draft)
        setActiveMode('create_template')
        setFromVoiceCapture(true)
        const firstQ = draft.missingQuestions[0] ?? null
        lastSpokenTextRef.current = null
        lastSpokenKeyRef.current = null
        if (firstQ) speakDonna(firstQ.question)
        else speakDonna('I have enough to draft this. Review it before saving.')
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
      speakDonna('Here are some things you can do to get started.')
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
    if (draft.taskId === 'summarize_player_progress') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['player']?.id) {
        fields._resolved_player_id = resolvedObjects['player'].id
      }
      return fetchPlayerProgressSummaryAction(fields)
    }
    if (draft.taskId === 'draft_session_brief') {
      const fields: Record<string, string> = { ...draft.collectedFields }
      if (resolvedObjects['session']?.id) {
        fields._resolved_session_id = resolvedObjects['session'].id
      }
      return fetchSessionBriefAction(fields)
    }
    if (draft.taskId === 'draft_coach_brief') {
      const coachId = resolvedObjects['coach']?.id ?? draft.collectedFields._resolved_coach_id ?? ''
      return fetchCoachIntelligenceAction(coachId)
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

  // Returns true if the phrase is an attention/urgent items intent.
  function isAttentionPhrase(lower: string): boolean {
    return (
      lower.includes('what needs attention') ||
      lower.includes('anything urgent') ||
      lower.includes('what should i do first') ||
      lower.includes('what is urgent') ||
      lower.includes('whats urgent') ||
      lower.includes("what's urgent") ||
      lower.includes('urgent items') ||
      lower.includes('needs attention') ||
      lower.includes('any urgent') ||
      lower.includes('priority items')
    )
  }

  // Returns true if the phrase is a daily brief intent.
  function isDailyBriefPhrase(lower: string): boolean {
    return (
      lower.includes("what's happening today") ||
      lower.includes('daily brief') ||
      lower.includes('morning brief') ||
      lower.includes("what's going on today") ||
      lower.includes('brief me') ||
      lower.includes('give me a brief') ||
      lower.includes('whats happening today') ||
      lower.includes('today brief')
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
      lower.includes('needs my review') ||
      lower.includes('what needs approval') ||
      lower.includes('pending approvals')
    )
  }

  // Sprint 370 — Fetch attention report
  async function handleFetchAttention() {
    recordSignal('attention_requested')
    setIsAttentionLoading(true)
    setAttentionReport(null)
    try {
      const res = await fetch('/api/donna/attention')
      if (res.ok) {
        const json = await res.json() as { ok: boolean; report?: AttentionReport }
        if (json.ok && json.report) {
          setAttentionReport(json.report)
        } else {
          setCommandResponse({ message: 'Could not load attention items. Try again.', type: 'info', label: 'Attention' })
        }
      } else {
        setCommandResponse({ message: 'Could not load attention items. Try again.', type: 'info', label: 'Attention' })
      }
    } catch {
      setCommandResponse({ message: 'Could not load attention items. Try again.', type: 'info', label: 'Attention' })
    } finally {
      setIsAttentionLoading(false)
    }
  }

  // Sprint 369 — Fetch daily director brief (read-only, auth-required endpoint)
  async function handleFetchDailyBrief() {
    recordSignal('daily_brief_requested')
    setIsDailyBriefLoading(true)
    setDailyBrief(null)
    try {
      const res = await fetch('/api/donna/brief')
      if (res.ok) {
        const json = await res.json() as { ok: boolean; brief?: DailyBrief }
        if (json.ok && json.brief) {
          setDailyBrief(json.brief)
        } else {
          setCommandResponse({ message: 'Brief unavailable — check back later.', type: 'info', label: 'Daily Brief' })
        }
      } else {
        setCommandResponse({ message: 'Brief unavailable — check back later.', type: 'info', label: 'Daily Brief' })
      }
    } catch {
      setCommandResponse({ message: 'Brief unavailable — check back later.', type: 'info', label: 'Daily Brief' })
    } finally {
      setIsDailyBriefLoading(false)
    }
  }

  // Opens the review queue panel and fetches data.
  async function handleOpenReviewQueue() {
    recordSignal('review_queue_opened')
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

  // Sprint 375 — Recommendation action handler
  // Dispatches the action from a recommendation. Never mutates data.
  function handleRecommendationAction(rec: DonnaRecommendation) {
    recordSignal('recommendation_acted', { category: rec.category, recommendationId: rec.id })
    setPreferences(recordCategoryUsed(rec.category))
    switch (rec.action.type) {
      case 'open_review':
        void handleOpenReviewQueue()
        break
      case 'navigate':
        if (rec.action.destination) {
          router.push(rec.action.destination)
        }
        break
      case 'start_workflow':
        if (rec.action.workflowId === 'create_class_template') {
          setActiveMode('create_template')
        }
        break
      case 'none':
      default:
        break
    }
  }

  // Sprint 381 — Show recommendation summary on demand (command-triggered)
  function handleShowRecommendationSummary() {
    recordSignal('attention_requested')
    if (recommendationSet && recommendationSet.recommendations.length > 0) {
      setCommandResponse({
        message: `Here are ${recommendationSet.recommendations.length} ${recommendationSet.recommendations.length === 1 ? 'recommendation' : 'recommendations'} for right now.`,
        type: 'info',
        label: 'Recommendations',
      })
    } else {
      const signals: RecommendationSignals = {
        pendingReviewCount: reviewQueuePendingCount,
        pendingPlacementCount: 0,
        todaySessionCount: 0,
        hasActiveDraft: convState.activeDraft !== null,
        currentPathname: pathname,
      }
      const recSet = evaluateRecommendations(signals)
      setRecommendationSet(recSet)
      if (recSet.recommendations.length > 0) {
        setCommandResponse({
          message: `Here are ${recSet.recommendations.length} ${recSet.recommendations.length === 1 ? 'recommendation' : 'recommendations'}.`,
          type: 'info',
          label: 'Recommendations',
        })
      } else {
        setCommandResponse({
          message: 'No recommendations right now — everything looks good.',
          type: 'info',
          label: 'Recommendations',
        })
      }
    }
  }

  // Sprint 381/383 — Start an attendance exception draft (director-initiated)
  // Sprint 383: accepts optional sourceText to populate naturalInput + extracted flags
  function handleStartAttendanceExceptionDraft(sourceText?: string) {
    recordSignal('workflow_started', { workflowId: 'attendance_exception' })

    // Determine if this is a natural language phrase or just a command trigger
    const isNatural = !!sourceText && looksLikeNaturalAttendancePhrase(sourceText)
    const naturalInput = isNatural ? sourceText : undefined
    const flags = naturalInput ? extractNaturalAttendanceFlags(naturalInput) : { absences: [], unrostered: [] }

    const draft = createAttendanceExceptionDraft({
      naturalInput,
      flaggedAbsences: flags.absences.length > 0 ? flags.absences : undefined,
      flaggedUnrostered: flags.unrostered.length > 0 ? flags.unrostered : undefined,
    })
    setAttendanceExceptionDraft(draft)
    setAttendanceQueueResult(null)
    setPreferences(recordWorkflowUsed('attendance_exception'))

    // Load recent sessions for the session picker
    void (async () => {
      setIsLoadingAttendanceSessions(true)
      try {
        const result = await fetchRecentSessionsAction()
        if (result.ok) setAttendanceSessionOptions(result.sessions)
      } catch {}
      setIsLoadingAttendanceSessions(false)
    })()

    if (isNatural) {
      const flagSummary = flags.absences.length > 0
        ? `Flagged: ${flags.absences.join(', ')} absent${flags.unrostered.length > 0 ? `; ${flags.unrostered.join(', ')} possibly unrostered` : ''}. `
        : ''
      setCommandResponse({
        message: `${flagSummary}Now choose which session this applies to.`,
        type: 'info',
        label: 'Attendance Exception',
      })
    } else {
      setCommandResponse({
        message: "Attendance exception draft started. Which player is this for?",
        type: 'info',
        label: 'Attendance Exception',
      })
    }
  }

  // Sprint 383 — Handle session selection in the attendance exception card
  function handleAttendanceSessionSelect(option: AttendanceSessionOption) {
    if (!attendanceExceptionDraft) return
    if (option.sessionId === 'manual_placeholder') {
      // Clear session selection (director will confirm later)
      setAttendanceExceptionDraft({ ...attendanceExceptionDraft, sessionId: undefined, sessionLabel: undefined })
      return
    }
    const label = formatSessionLabel(option)
    setAttendanceExceptionDraft({
      ...attendanceExceptionDraft,
      sessionId: option.sessionId,
      sessionLabel: label,
    })
  }

  function formatSessionLabel(option: AttendanceSessionOption): string {
    const parts = [option.title]
    if (option.dateLabel) parts.push(option.dateLabel)
    return parts.join(' · ')
  }

  // Sprint 383 — Queue attendance exception for director review
  async function handleQueueAttendanceForReview() {
    if (!attendanceExceptionDraft) return
    setAttendanceQueueing(true)
    try {
      const statement = buildAttendanceStatement(attendanceExceptionDraft)
      const fields: Record<string, string> = {
        attendance_statement: statement,
        _resolved_session_id: attendanceExceptionDraft.sessionId ?? '',
      }
      if (attendanceExceptionDraft.playerName) fields.player_name = attendanceExceptionDraft.playerName
      if (attendanceExceptionDraft.reason) fields.reason = attendanceExceptionDraft.reason
      const result = await saveAttendanceExceptionDraftAction(fields)
      setAttendanceQueueResult(result)
      if (result.ok) {
        recordSignal('workflow_completed', { workflowId: 'attendance_exception' })
      }
    } catch (e: unknown) {
      setAttendanceQueueResult({
        ok: false,
        status: 'error',
        message: e instanceof Error ? e.message : 'Unknown error queuing attendance draft.',
        safetyNotes: ['No attendance data was changed.'],
      })
    }
    setAttendanceQueueing(false)
  }

  // Sprint 381 — Apply a typed/spoken answer to the next unfilled attendance exception field
  function applyAttendanceAnswer(draft: AttendanceExceptionDraft, text: string): AttendanceExceptionDraft {
    const lower = text.toLowerCase().trim()
    let type = draft.type
    if (lower.includes('late') || lower.includes('tardy')) type = 'late'
    else if (lower.includes('early leave') || lower.includes('left early')) type = 'early_leave'
    else if (lower.includes('absent') || lower.includes('absence') || lower.includes('miss')) type = 'absence'
    if (!draft.playerName) return { ...draft, playerName: text.trim(), type }
    if (!draft.reason) return { ...draft, reason: text.trim(), type }
    return { ...draft, type }
  }

  // Sprint 381/383 — Dispatch a COO-layer director workflow command by ID
  // Sprint 383: sourceText passed for attendance commands to support natural input
  function dispatchCooCommand(id: DirectorWorkflowCommandId, sourceText?: string): void {
    switch (id) {
      case 'what_needs_attention':
        void handleFetchAttention()
        break
      case 'daily_brief':
        void handleFetchDailyBrief()
        break
      case 'draft_parent_update': {
        const draft = createCommunicationDraft('parent_update')
        setCommunicationDraft(draft)
        setCommandResponse({ message: "I've started a parent update draft. What's the topic?", type: 'info', label: 'Communication Draft' })
        break
      }
      case 'coach_brief': {
        const draft = createCoachBriefDraft()
        setCommunicationDraft(draft)
        setCommandResponse({ message: "Coach brief started. Which coach or session is this for?", type: 'info', label: 'Coach Brief' })
        break
      }
      case 'show_review_queue':
        void handleOpenReviewQueue()
        break
      case 'attendance_exception_draft':
        handleStartAttendanceExceptionDraft(sourceText)
        break
      case 'recommendation_summary':
        handleShowRecommendationSummary()
        break
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
        return true
      }
    }

    // Go back — only within /director, not from the root dashboard
    if (lower.includes('go back') || lower === 'back') {
      if (pathname.startsWith('/director') && pathname !== '/director') {
        router.back()
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

  function handleCommandSubmit(overrideText?: string) {
    const text = (overrideText ?? typedText).trim()
    if (!text) return

    // Sprint 290: onboarding intro — typed answers route through the onboarding handler.
    if (isOnboardingActive(onboardingStep)) {
      handleOnboardingAnswer(onboardingStep, text)
      setTypedText('')
      return
    }

    // Sprint 383: COO attendance commands must be checked before the controller.
    // detectTaskIntent matches 'handle_attendance_exception' keywords (e.g. "attendance exception",
    // "everyone was here", "showed up"), routing typed input to DonnaDraftCard instead of
    // DonnaAttendanceExceptionCard, bypassing session resolution and queue-for-review.
    if (convState.activeDraft === null && !genericDraft && !templateDraft) {
      const earlyCmd = matchDirectorWorkflowCommand(text.toLowerCase())
      if (earlyCmd === 'attendance_exception_draft') {
        dispatchCooCommand('attendance_exception_draft', text)
        setTypedText('')
        return
      }
      if (looksLikeNaturalAttendancePhrase(text)) {
        dispatchCooCommand('attendance_exception_draft', text)
        setTypedText('')
        return
      }
    }

    // Call controller first — handles both new draft creation and active draft routing
    const controllerTurn = controllerHandleInput(text, convState)

    // New draft just created from a create_draft intent — bypass legacy routing
    if (convState.activeDraft === null && controllerTurn.nextState.activeDraft !== null) {
      setConvState(controllerTurn.nextState)
      if (controllerTurn.speakText) speakDonna(controllerTurn.speakText)
      if (controllerTurn.showDraftReview) setConvShowDraftReview(true)
      console.log('[DonnaGoldenPath] draft_started', {
        workflowId: controllerTurn.nextState.activeDraft.workflowId,
        fields: Object.keys(controllerTurn.nextState.activeDraft.fields),
      })
      appendAuditEvent({ type: 'draft_started', description: 'Draft started via typed input', workflowId: controllerTurn.nextState.activeDraft.workflowId ?? undefined })
      recordSignal('workflow_started', { workflowId: controllerTurn.nextState.activeDraft.workflowId ?? undefined })
      if (controllerTurn.nextState.activeDraft.workflowId) {
        setPreferences(recordWorkflowUsed(controllerTurn.nextState.activeDraft.workflowId))
      }
      setTypedText('')
      return
    }

    // Sprint 322: When the controller has an active draft and no legacy draft exists,
    // route ALL typed input through the controller (mirrors handleVoiceTranscript).
    if (convState.activeDraft !== null && !genericDraft && !templateDraft) {
      const turn = controllerTurn
      setConvState(turn.nextState)
      if (turn.speakText) speakDonna(turn.speakText)
      if (turn.showDraftReview) setConvShowDraftReview(true)
      if (turn.displayMessage) {
        setCommandResponse({ message: turn.displayMessage, type: 'info', label: 'Donna' })
      }
      switch (turn.uiAction.type) {
        case 'start_template_draft': {
          const draft = parseTemplateDraft(turn.uiAction.initialText)
          setTemplateDraft(draft)
          setFromVoiceCapture(false)
          setActiveMode('create_template')
          const firstQ = draft.missingQuestions[0] ?? null
          if (firstQ) speakDonna(firstQ.question)
          break
        }
        case 'open_review_queue':
          void handleOpenReviewQueue()
          break
        case 'navigate':
          router.push(turn.uiAction.destination)
          break
        case 'open_onboarding':
          router.push('/director/onboarding/interview')
          break
        case 'fetch_context':
          void handleContextSummary()
          break
      }
      setTypedText('')
      return
    }

    // Sprint 381 — Attendance exception slot-filling (active draft, still collecting)
    if (attendanceExceptionDraft && !attendanceExceptionReadyToSubmit(attendanceExceptionDraft)) {
      const updated = applyAttendanceAnswer(attendanceExceptionDraft, text)
      setAttendanceExceptionDraft(updated)
      if (attendanceExceptionReadyToSubmit(updated)) {
        setCommandResponse({ message: 'Attendance exception draft is ready for your review.', type: 'info', label: 'Attendance' })
      }
      setTypedText('')
      return
    }

    // Multi-step intent — Sprint 286
    if (!templateDraft && !genericDraft && !multiStepPlan) {
      const plan = detectMultiStepIntent(text)
      if (plan) {
        setMultiStepPlan(plan)
        setMultiStepIndex(0)
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
        setTypedText('')
        return
      }
    }

    // Sprint 381/383 — New COO commands: attendance exception + recommendation summary
    // Sprint 383: pass text for natural language attendance phrases
    {
      const cooCmd = matchDirectorWorkflowCommand(text.toLowerCase())
      if (cooCmd === 'attendance_exception_draft' || cooCmd === 'recommendation_summary') {
        dispatchCooCommand(cooCmd, text)
        setTypedText('')
        return
      }
    }

    // Review queue intent — Sprint 273
    if (isReviewQueuePhrase(text.toLowerCase())) {
      void handleOpenReviewQueue()
      setTypedText('')
      return
    }

    // Daily brief intent — Sprint 369
    if (isDailyBriefPhrase(text.toLowerCase())) {
      void handleFetchDailyBrief()
      setTypedText('')
      return
    }

    // Attention intent — Sprint 370
    if (isAttentionPhrase(text.toLowerCase())) {
      void handleFetchAttention()
      setTypedText('')
      return
    }

    // Predictive suggestion phrases (Sprint 267) — before generic context query
    if (isPredictiveSuggestionPhrase(text.toLowerCase())) {
      void handleContextSummary()
      setTypedText('')
      return
    }

    // Context query
    if (isContextQueryPhrase(text.toLowerCase())) {
      void handleContextSummary()
      setTypedText('')
      return
    }

    const handled = detectAndHandleCommand(text)
    if (!handled) {
      recordSignal('command_unrecognized')
      const fallback = getFailureMode('intent_unknown')
      setCommandResponse({
        message: fallback.userMessage,
        type: 'honest',
        label: 'Not recognized',
      })
    } else {
      recordSignal('command_issued')
    }
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
          // Sprint 359: restore draft from session if no active draft currently
          // Must run before the onboarding check so restored drafts skip intro.
          setConvState(prev => {
            if (prev.activeDraft === null) {
              const restored = loadDraftFromSession()
              if (restored && restored.activeDraft !== null) {
                setDraftRestoredFromSession(true)
                setCommandResponse({
                  message: 'Draft restored from your previous session.',
                  type: 'info',
                  label: 'Draft restored',
                })
                return restored
              }
            }
            return prev
          })

          if (!hasGreetedRef.current) {
            hasGreetedRef.current = true
            setShowGreeting(true)
            // Sprint 350: skip onboarding if already completed this session.
            const introCompleted =
              typeof window !== 'undefined' &&
              window.sessionStorage.getItem('academyos:donna:introCompleted:v1') === 'true'
            if (!introCompleted) {
              // Sprint 290: start the guided onboarding intro instead of generic greeting.
              // Sprint 296B: do NOT auto-speak here — Chrome discards the gesture context
              // before speak() is reached after multiple setState calls. Director presses
              // "Play Donna voice" button for a clean gesture-backed speak().
              setOnboardingStep(0)
              setShowOnboardingSuggestions(false)
            } else {
              // Sprint 647 — daily welcome (onboarding already complete).
              // Check localStorage to determine first open today vs. same-day return.
              const greeting = getDailyGreetingState(firstName)
              setDailyGreetingState(greeting)
              if (greeting.isFirstOpenToday) {
                markGreetedToday()
                // Attempt voice — inside button click (user gesture); failure is silent.
                // Text always renders regardless of voice outcome.
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  speakAssistantText(greeting.primaryText)
                }
              }
            }
          }

          // Sprint 373: fetch review queue count on panel open (read-only, no mutation)
          // Sprint 375: also evaluate rule-based recommendations from returned signals
          void getDonnaReviewQueueAction().then((data) => {
            const pendingCount = data?.totalCount ?? 0
            if (pendingCount > 0) {
              setReviewQueuePendingCount(pendingCount)
              setCommandResponse({
                message: `You have ${pendingCount} ${pendingCount === 1 ? 'item' : 'items'} waiting for your review.`,
                type: 'info',
                label: 'Review Queue',
              })
            } else {
              setReviewQueuePendingCount(0)
            }
            // Sprint 375: evaluate recommendations synchronously from available signals
            // Sprint 376: record each recommendation shown as a learning signal
            setConvState(prev => {
              const signals: RecommendationSignals = {
                pendingReviewCount: pendingCount,
                pendingPlacementCount: 0,   // not yet fetched separately; engine handles 0 gracefully
                todaySessionCount: 0,        // not yet fetched separately
                hasActiveDraft: prev.activeDraft !== null,
                currentPathname: pathname,
              }
              const recSet = evaluateRecommendations(signals)
              setRecommendationSet(recSet)
              recSet.recommendations.forEach(rec => {
                recordSignal('recommendation_shown', { category: rec.category, recommendationId: rec.id })
              })
              return prev
            })
          }).catch(() => {})
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
        style={panelOpen ? {
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          border: '1px solid rgba(139,92,246,0.7)',
          boxShadow: '0 4px 16px rgba(139,92,246,0.6), 0 0 0 3px rgba(139,92,246,0.18)',
        } : {
          background: 'linear-gradient(135deg, #6d28d9, #4338ca)',
          border: '1px solid rgba(139,92,246,0.35)',
        }}
      >
        <Sparkles className="w-[18px] h-[18px]" />
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Backdrop — visual only; DONNA is a side panel, not a modal.          */}
      {/* pointer-events-none so page content stays interactive while open.   */}
      {/* ------------------------------------------------------------------ */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 pointer-events-none"
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
          'fixed top-0 right-0 bottom-0 z-50 w-96 max-w-[90vw] flex flex-col',
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
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 8px rgba(139,92,246,0.2)' }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">{DONNA_PUBLIC_NAME}</h2>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}
              >
                Review-first
              </span>
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
            <p className="text-[10px] text-text-muted leading-snug mt-0.5">
              {DONNA_PUBLIC_TITLE}
            </p>
            <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
              {DONNA_ACTIVATION_HELP}
            </p>
            {/* Sprint 373 — Review queue badge */}
            {reviewQueuePendingCount > 0 && (
              <div className="mt-1.5">
                <DonnaReviewQueueBadge
                  count={reviewQueuePendingCount}
                  onOpen={handleOpenReviewQueue}
                />
              </div>
            )}
          </div>
          <button
            onClick={closePanel}
            aria-label="Close assistant"
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-2 mt-0.5
              text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab chips — executive quick actions */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {([
            { label: 'Review Today', action: () => void handleOpenReviewQueue() },
            { label: 'Prepare Coaches', action: () => dispatchCooCommand('coach_brief') },
            { label: 'Player Progress', action: () => { router.push('/director/level-up') } },
            { label: 'Parent Updates', action: () => { router.push('/director/parents') } },
            {
              label: 'Ask Anything',
              action: () => {
                setActiveMode(null)
                setCommandResponse(null)
                setTimeout(() => {
                  const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  el?.focus()
                }, 50)
              },
            },
          ] as { label: string; action: () => void }[]).map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.action}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-all text-text-secondary hover:text-text-primary"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
            >
              {chip.label}
            </button>
          ))}
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
                  : (dailyGreetingState?.primaryText ?? greetingText)}
              </p>
              {/* Sprint 647 — daily welcome follow-up and CTA (intro already complete) */}
              {!isOnboardingActive(onboardingStep) && dailyGreetingState?.followUp && (
                <p className="text-[12px] text-text-secondary mt-2 leading-snug">
                  {dailyGreetingState.followUp}
                </p>
              )}
              {!isOnboardingActive(onboardingStep) && dailyGreetingState?.isFirstOpenToday && (
                <button
                  type="button"
                  onClick={() => void handleFetchDailyBrief()}
                  className="mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                    hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'rgba(200,255,0,0.07)',
                    border: '1px solid rgba(200,255,0,0.2)',
                    color: '#C8FF00',
                  }}
                >
                  Walk me through today
                </button>
              )}
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
                    {/* Stall message — Realtime timeout vs browser TTS stall */}
                    {voiceGreetingStatus === 'stalled' && (
                      <p className="text-[10px] leading-snug" style={{ color: '#FF9500' }}>
                        {activatedVoiceModeRef.current === 'realtime'
                          ? 'Donna voice was not confirmed. Try Browser Voice or continue typed.'
                          : "Donna's voice did not start. Click Play Donna voice again or type instead."}
                      </p>
                    )}
                    {/* Try Browser Voice — direct browser TTS bypass, shown only after Realtime stall */}
                    {voiceGreetingStatus === 'stalled' && activatedVoiceModeRef.current === 'realtime' && (
                      <button
                        type="button"
                        onClick={() => {
                          activatedVoiceModeRef.current = 'browser'
                          const text = onboardingStep !== null
                            ? (DONNA_ONBOARDING_STEPS[onboardingStep]?.spokenText ?? DONNA_ONBOARDING_STEPS[0].spokenText)
                            : DONNA_ONBOARDING_STEPS[0].spokenText
                          lastSpokenTextRef.current = null
                          lastSpokenKeyRef.current = null
                          setVoiceGreetingStatus('speaking')
                          speakAssistantText(text, (s) => {
                            if (s === 'done') setVoiceGreetingStatus('done')
                            else if (s === 'error') setVoiceGreetingStatus('error')
                          })
                        }}
                        className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: 'rgba(48,209,88,0.1)',
                          border: '1px solid rgba(48,209,88,0.25)',
                          color: '#30D158',
                        }}
                      >
                        Try Browser Voice
                      </button>
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
                    {/* After any failure: typed input is always available in the panel below */}
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

          {/* ── Primary voice card — Sprint 384: extracted to DonnaVoiceLayer ── */}
          <DonnaVoiceLayer
            onboardingStep={onboardingStep}
            guidedCurrentQ={guidedCurrentQ}
            onVoiceTranscriptRaw={handleVoiceTranscriptRaw}
            onListeningChange={handleVoiceListeningChange}
            onInterimTranscript={handleInterimTranscript}
            onVoiceError={handleVoiceError}
            onSupportedChange={setIsVoiceSupported}
            isVoiceListening={isVoiceListening}
            interimVoiceTranscript={interimVoiceTranscript}
            voicePermissionError={voicePermissionError}
            onDismissVoiceError={() => setVoicePermissionError(null)}
            pendingVoiceAnswer={pendingVoiceAnswer}
            onPendingVoiceAnswerChange={updated => setPendingVoiceAnswer(updated)}
            onConfirmVoiceAnswer={handleConfirmVoiceAnswer}
            onRetryVoice={handleRetryVoice}
            voiceTranscript={voiceTranscript}
            activeMode={activeMode}
            onClearVoiceTranscript={() => setVoiceTranscript(null)}
            typedText={typedText}
            onTypedTextChange={setTypedText}
            onCommandSubmit={handleCommandSubmit}
            convState={convState}
            genericDraft={genericDraft}
            templateDraft={templateDraft}
          />

          {/* ── Sprint 384: Workflow output cards — extracted to DonnaWorkflowCards ── */}
          <DonnaWorkflowCards
            convState={convState}
            convShowDraftReview={convShowDraftReview}
            onConvUndo={handleConvUndo}
            onConvStartOver={handleConvStartOver}
            onConvDiscard={handleConvDiscard}
            onConvReview={handleConvReview}
            onCloseConvReview={() => setConvShowDraftReview(false)}
            draftRestoredFromSession={draftRestoredFromSession}
            onClearSavedDraft={() => setDraftRestoredFromSession(false)}
            genericDraft={genericDraft}
            templateDraft={templateDraft}
            commandResponse={commandResponse}
            onDismissCommandResponse={() => setCommandResponse(null)}
            dailyBrief={dailyBrief}
            isDailyBriefLoading={isDailyBriefLoading}
            onDismissDailyBrief={() => setDailyBrief(null)}
            onDailyBriefOpenReviewQueue={() => void handleOpenReviewQueue()}
            onDailyBriefPrepareCoachBriefs={() => dispatchCooCommand('coach_brief')}
            attentionReport={attentionReport}
            isAttentionLoading={isAttentionLoading}
            onDismissAttention={() => setAttentionReport(null)}
            onClosePanel={closePanel}
            onAttentionOpenReviewQueue={() => void handleOpenReviewQueue()}
            recommendationSet={recommendationSet}
            onRecommendationAction={handleRecommendationAction}
            onSetLastCardAction={setLastCardAction}
            communicationDraft={communicationDraft}
            showMessageReview={showMessageReview}
            onCommunicationDraftDiscard={() => { setCommunicationDraft(null); setShowMessageReview(false) }}
            onCommunicationDraftReview={() => setShowMessageReview(true)}
            onCommunicationDraftRevise={handleVoiceTranscript}
            onCommunicationDraftUpdate={(updated) => { setCommunicationDraft(updated); setShowMessageReview(false) }}
            onCommunicationDraftMessageDiscard={() => { setCommunicationDraft(null); setShowMessageReview(false) }}
            attendanceExceptionDraft={attendanceExceptionDraft}
            attendanceSessionOptions={attendanceSessionOptions}
            isLoadingAttendanceSessions={isLoadingAttendanceSessions}
            attendanceQueueing={attendanceQueueing}
            attendanceQueueResult={attendanceQueueResult}
            onAttendanceDiscard={() => { setAttendanceExceptionDraft(null); setAttendanceSessionOptions([]); setAttendanceQueueResult(null) }}
            onAttendanceSessionSelect={handleAttendanceSessionSelect}
            onAttendanceQueueForReview={() => void handleQueueAttendanceForReview()}
            showOnboardingSuggestions={showOnboardingSuggestions}
            onDismissOnboardingSuggestions={() => setShowOnboardingSuggestions(false)}
            onOnboardingSuggestionClick={(hint) => { setShowOnboardingSuggestions(false); handleVoiceTranscript(hint) }}
            contextSummary={contextSummary}
            onDismissContextSummary={() => setContextSummary(null)}
          />

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
                <>
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
                  {/* Sprint 322: Template draft preview — read-only, nothing saves here */}
                  <DonnaClassTemplateDraftPreview draft={templateDraft} />
                </>
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
                    ? READONLY_TASK_IDS.has(genericDraft.taskId)
                      ? 'Read-only summary — no data is written. Review required before sharing with players or parents.'
                      : 'Draft-only — saved as pending review. Director approval required before any action is taken. Nothing is sent.'
                    : 'This capability is coming soon — no data is written.'}
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
                approveButtonLabel={
                  WIRED_TASK_IDS.has(genericDraft.taskId)
                    ? READONLY_TASK_IDS.has(genericDraft.taskId)
                      ? 'Generate Summary'
                      : 'Save Draft for Review'
                    : undefined
                }
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

            {MODES.map(({ mode, label, desc, Icon, category, safeStatus }) => (
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[12px] font-semibold leading-tight">{label}</p>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)', color: '#a78bfa' }}
                      >
                        {category}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-snug mt-0.5">{desc}</p>
                    <p className="text-[10px] leading-snug mt-1" style={{ color: '#2dd4bf' }}>{safeStatus}</p>
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
                  const isWired = WIRED_TASK_IDS.has(taskId)
                  if (!contract) return null
                  return (
                    <button
                      key={taskId}
                      onClick={() => handleStartGenericTask(taskId, false)}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg transition-all leading-snug flex items-center justify-between gap-2',
                        isWired
                          ? 'text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                          : 'text-[11px] text-text-muted hover:bg-surface-raised',
                      )}
                    >
                      <span>{contract.label}</span>
                      {!isWired && (
                        <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-surface border border-border text-text-muted leading-none">
                          Coming soon
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sprint 384: Developer Tools — extracted to DonnaDeveloperTools */}
          {process.env.NODE_ENV !== 'production' && (
            <DonnaDeveloperTools
              convState={convState}
              convShowDraftReview={convShowDraftReview}
              attendanceExceptionDraft={attendanceExceptionDraft}
              attendanceQueueResult={attendanceQueueResult}
              preferences={preferences}
              recommendationSet={recommendationSet}
              lastCardAction={lastCardAction}
              realtimeStatus={realtimeStatus}
              realtimeUnavailableReason={realtimeUnavailableReason}
              voiceGreetingStatus={voiceGreetingStatus}
              isSpeaking={isSpeaking}
              isVoiceListening={isVoiceListening}
              isVoiceSupported={isVoiceSupported}
              voiceMode={activatedVoiceModeRef.current}
              wakeListeningActive={wakeListeningActive}
              wakeDetectedCommand={wakeDetectedCommand}
              testVoiceStatus={testVoiceStatus}
              lastServerTtsInfo={lastServerTtsInfo}
              draftRestoredFromSession={draftRestoredFromSession}
              onResetIntro={() => {
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem('academyos:donna:introCompleted:v1')
                }
                hasGreetedRef.current = false
                setOnboardingStep(0)
                setShowOnboardingSuggestions(false)
              }}
              onTestBrowserVoice={testBrowserVoice}
              onStartWakeListening={startWakeListening}
              onStopWakeListening={stopWakeListening}
              onTestRealtime={() => void playOnboardingVoice()}
              onResetVoice={resetVoice}
            />
          )}

        </div>

        {/* Footer — approval boundary */}
        <div
          className="px-4 py-3 shrink-0 space-y-1"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-[11px] font-semibold" style={{ color: 'rgba(200,255,0,0.7)' }}>
            DONNA proposes. You approve. Always in control.
          </p>
          <p className="text-[10px] text-text-muted leading-snug">
            All actions go to your review queue before anything changes.
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

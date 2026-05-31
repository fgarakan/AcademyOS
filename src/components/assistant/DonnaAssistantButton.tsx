'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight, Layers, Inbox, Minus,
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
  defaultPreferences,
  recordWorkflowUsed,
  recordCategoryUsed,
} from '@/components/assistant/donnaPreferenceMemory'
import type { DonnaPreferences } from '@/components/assistant/donnaPreferenceMemory'
// Sprint 361 — Audit trail (getAuditTrail used in DonnaDeveloperTools)
import { appendAuditEvent } from '@/components/assistant/donnaAuditTrail'
// Sprint 350 — Server TTS client + voice policy
import { speakWithServerTts, stopServerTts } from '@/components/assistant/donnaServerTtsClient'
// Sprint 788 — Central voice config for speakAssistantText (greeting/onboarding path)
import {
  fallbackBrowserRate,
  fallbackBrowserPitch,
  fallbackBrowserVolume,
  preferredBrowserVoiceKeywords,
  avoidBrowserVoiceKeywords,
} from '@/lib/donna/donnaVoiceConfig'
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
// Sprint 707 — Mobile command bar
import { DONNADirectorMobileCommandBar } from '@/components/donna/DONNADirectorMobileCommandBar'
// Sprint 964 — Page-aware chip bar (highlight + prompt chips per route)
import { DonnaPanelPageChips } from '@/components/donna/DonnaPanelPageChips'
// Sprint 1040 — chip deduplication: hide generic fixed chips when route has page chips
import { getChipsForRoute } from '@/lib/donna/donnaPageChipRegistry'
// Sprint 647 — First Daily Welcome
import {
  getDailyGreetingState,
  markGreetedToday,
  type DailyGreetingState,
} from '@/lib/donna/donnaDailyGreeting'
// Sprint 685 — Director greeting content + daily tracking
import {
  shouldShowDailyDonnaGreeting,
  markDailyDonnaGreetingShown,
  buildDonnaOpeningGreeting,
} from '@/lib/donna/donnaGreeting'
// Sprint 685 — VoiceState type for status indicator
import type { VoiceState } from '@/components/assistant/VoiceInputButton'
// Sprint 656 — Role Boundaries
import {
  isTaskAllowedForRole,
  isModeAllowedForRole,
  DIRECTOR_REQUIRED_COPY,
  COACH_QUICK_LINKS,
  type DonnaRole,
} from '@/lib/donna/donnaRoleBoundaries'
// Sprint 686 — Session context: panelOpen + updatePrompt lifted to provider
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import { getDonnaPromptSuggestions, getPromptCategoryLabel } from '@/lib/donna/donnaDirectorPromptPalette'
// Sprint 697 — COO conversational router live wiring
import { routeDonnaPrompt } from '@/lib/donna/donnaConversationalRouter'
import { composeDonnaResponse, composeSystemFlowAnswer, composePageContextAnswer, composeKpiAnswer, composeReviewQueueAnswer, composeRosterIntelAnswer, composeModuleAnswer, composeCurriculumAnswer, detectCurriculumQuestionType, composeOnboardingAnswer } from '@/lib/donna/donnaResponseComposer'
import { recordPrompt, recordSummary, recordRouteChange, getSessionMemory, buildContinuityMessage } from '@/lib/donna/donnaSafeSessionMemory'
// Sprint 702 — Chat session memory + continuity wiring
import { ensureChatSession, recordTurn, getRecentTurns, getContextualPrefix } from '@/lib/donna/donnaChatSessionMemory'
// Sprint 704 — Action preview cards wiring
import { getActionPreviewForRequest } from '@/lib/donna/donnaActionPreviewIntegration'
import type { DirectorActionPreview } from '@/lib/donna/directorActionPreview'
// Sprint 757 — UI action dispatcher pre-check (structured safety + navigation layer)
// Sprint 760 — Page-aware action surfacing
import { dispatchUIIntent, getAvailableActionsForContext } from '@/lib/donna/donnaUIActionDispatcher'
// Sprint 817 — Focus target: set before router.push for teal highlight on arrival
import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
// Sprint 1011 — DONNA God Mode: LLM orchestrator response card + guided actions
// Sprint 1028 — unified response renderer (cooThread + God Mode loading + response card)
// DonnaResponseCard is rendered inside DonnaPanelResponseRenderer — no direct import needed here
import { DonnaPanelResponseRenderer } from '@/components/donna/DonnaPanelResponseRenderer'
import { runDonnaOrchestratorAction } from '@/app/director/_actions/donnaOrchestratorAction'
import { executeDonnaHighlight } from '@/lib/donna/llmOrchestration/donnaGuidedAction'
import type { OrchestratorOutput, ConversationTurn as OrchestratorTurn } from '@/lib/donna/llmOrchestration/types'
import { getOperatorById, getOperatorStep } from '@/lib/donna/donnaUIGuidedOperators'
import type { UIActionRole, UIActionSafetyClass } from '@/lib/donna/donnaUIActionRegistry'
// Sprint 780 — Daily brief intent registry (replaces inline isDailyBriefPhrase)
import { matchesDailyBriefIntent } from '@/lib/donna/donnaIntentClassifier'
// Sprint 784 — Cross-session memory (localStorage-backed, safe page context only)
import { loadLastSession, saveLastSession, buildCrossSessionWelcome } from '@/lib/donna/donnaLastSessionStore'
import type { DonnaLastSession } from '@/lib/donna/donnaLastSessionStore'
// Sprint 785 — Follow-up resolver (current-session intent context, RAM only)
import { resolveFollowUp } from '@/lib/donna/donnaFollowUpResolver'
import type { DonnaSessionIntentContext } from '@/lib/donna/donnaFollowUpResolver'
// Sprint 968 — Director Next Action Engine (deterministic "what should I do next?" routing)
import { buildDirectorNextAction, matchesWhatNextIntent } from '@/lib/donna/directorNextActionEngine'
// Sprint 971 — Review Queue Guidance (deterministic guidance for review queue intent phrases)
import { buildReviewQueueGuidance, matchesReviewQueueGuidanceIntent } from '@/lib/donna/reviewQueueGuidance'
// Sprint 972 — Class Template Guidance (deterministic guidance for class template workflow)
import { buildClassTemplateGuidance, matchesClassTemplateGuidanceIntent } from '@/lib/donna/classTemplateGuidance'
// Sprint 973 — Curriculum Builder Guidance (deterministic guidance for curriculum builder)
import { buildCurriculumBuilderGuidance, matchesCurriculumBuilderGuidanceIntent } from '@/lib/donna/curriculumBuilderGuidance'

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
  /** Display name for the logged-in user (director or coach). */
  directorName?: string
  /** Role context for greeting and priority routing. Defaults to 'director'. */
  role?: DonnaRole
}

export function DonnaAssistantButton({ academyId, directorName, role = 'director' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  // Sprint 686 — panelOpen lifted to DonnaSessionContextProvider; survives route changes
  // Sprint 854 — session destructured as donnaSession to avoid shadowing local `session` var (line ~1073)
  const {
    session: donnaSession, panelOpen, openDonnaPanel, closeDonnaPanel, updatePrompt,
    // Sprint 918 — minimize/expand + context refresh
    panelMinimized, minimizePanel, expandPanel, contextRefreshedAt, contextPageLabel,
  } = useDonnaSessionContext()
  // Sprint 918 — brief context-refresh flash (3s) when route changes while panel open
  const [showContextRefresh, setShowContextRefresh] = useState(false)
  useEffect(() => {
    if (!contextRefreshedAt) return
    setShowContextRefresh(true)
    const t = setTimeout(() => setShowContextRefresh(false), 3000)
    return () => clearTimeout(t)
  }, [contextRefreshedAt])
  const [captureOpen, setCaptureOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<AssistantMode | null>(null)
  // Sprint 823 — Panel disclosure section visibility (context / suggestions / actions)
  const [showContextSection, setShowContextSection] = useState(false)
  const [showSuggestionsSection, setShowSuggestionsSection] = useState(false)
  const [showActionsSection, setShowActionsSection] = useState(false)

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
  const panelOpenCountRef = useRef(0)
  // Sprint 787 — Idle timer ref: fires after 3 min of inactivity while panel is open
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Sprint 872 — Track last known session/template ID for cross-page section navigation.
  // Updated on every pathname change via deriveContextRequest(). Only written (not cleared)
  // so IDs persist after navigating away from a session/template detail page.
  // Passed into dispatchUIIntent → resolveSectionNavigation as ctxParams fallback.
  const lastKnownContextParamsRef = useRef<{ sessionId?: string; templateId?: string }>({})
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
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return
    }

    const now = Date.now()
    const msSinceLast = now - lastSpokenAtRef.current

    // Guard 1 — timestamp + text: same text spoken within 1500ms (catches StrictMode
    // double-invocation and onstart→setIsSpeaking→re-render triggered duplicate calls).
    if (lastSpokenTextRef.current === text && msSinceLast < 1500) {
      return
    }

    // Guard 2 — state key: same onboarding step or free-text key already spoken.
    // Cleared explicitly when advancing steps or resetting speech state.
    const stateKey = onboardingStep !== null ? `onboarding:${onboardingStep}` : `free:${text.slice(0, 40)}`
    if (lastSpokenKeyRef.current === stateKey) {
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
    // Sprint 788 — use central voice config (replaces inline hardcoded values from Sprint 719)
    utt.rate = fallbackBrowserRate
    utt.pitch = fallbackBrowserPitch
    utt.volume = fallbackBrowserVolume
    // Sprint 788 — use central keyword lists for consistent voice selection across all speak paths
    const voices = window.speechSynthesis.getVoices()
    const usableVoices = voices.filter(v =>
      v.lang.startsWith('en') &&
      !avoidBrowserVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
    )
    let preferred: SpeechSynthesisVoice | null = null
    for (const keyword of preferredBrowserVoiceKeywords) {
      const match = usableVoices.find(v => v.name.toLowerCase().includes(keyword.toLowerCase()))
      if (match) { preferred = match; break }
    }
    if (!preferred) preferred = usableVoices.find(v => v.localService) ?? usableVoices[0] ?? null
    if (preferred) utt.voice = preferred
    utt.onstart = () => {
      setIsSpeaking(true)
      onStatus?.('speaking')
    }
    utt.onend = () => {
      utteranceRef.current = null
      setIsSpeaking(false)
      onStatus?.('done')
    }
    utt.onerror = () => {
      utteranceRef.current = null
      setIsSpeaking(false)
      onStatus?.('error')
    }
    utteranceRef.current = utt
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

    // ── Path 1: Realtime (primary) — restricted to onboarding/interview only ──
    // Sprint 821: Realtime is only used on /director/onboarding/interview.
    // Floating panel greeting must not start a second DONNA voice — use speakDonna() below.
    const isInterviewPage = pathname.startsWith('/director/onboarding/interview')
    if (isInterviewPage && realtimeStatus !== 'unavailable' && realtimeStatus !== 'error') {
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
      console.warn('[Donna] Realtime connect failed — falling back to browser TTS')
    }

    // ── Path 1.5: Server TTS via speakDonna (floating panel — non-interview) ──
    // Sprint 821: When not on interview page, route greeting through Server TTS (marin)
    // with browser speechSynthesis fallback — same voice DONNA uses for all responses.
    // Guarantees no two-voice experience in the floating assistant panel.
    if (!isInterviewPage) {
      activatedVoiceModeRef.current = 'browser' // treated as non-realtime for diagnostics
      speakDonna(text)
      setVoiceGreetingStatus('done')
      return
    }

    // ── Path 2: Browser TTS (interview page fallback only) ────────────────────
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
    // Sprint 717 — sentence-boundary TTS truncation: cut at last sentence end within 150 chars,
    // then last clause, then raw truncation. Full text always shown in UI.
    let ttsText = text
    if (text.length > 150) {
      const candidate = text.slice(0, 150)
      const sentenceEnd = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('? '), candidate.lastIndexOf('! '))
      if (sentenceEnd > 80) {
        ttsText = candidate.slice(0, sentenceEnd + 1)
      } else {
        const clauseEnd = Math.max(candidate.lastIndexOf(', '), candidate.lastIndexOf('; '))
        ttsText = clauseEnd > 70 ? candidate.slice(0, clauseEnd + 1) : candidate.slice(0, 147) + '…'
      }
    }
    void speakWithServerTts(ttsText, (status) => {
      if (status === 'speaking') setIsSpeaking(true)
      else if (status === 'done' || status === 'error') setIsSpeaking(false)
    }).then((result) => {
      const source: DonnaVoiceOutputMode =
        result.source === 'server' ? 'contract_tts'
        : result.source === 'browser' ? 'browser_tts'
        : 'silent'
      // Sprint 720 — include voice name for quality status display
      setLastServerTtsInfo({ source, text: text.slice(0, 80), voice: result.voice })
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
    // Sprint 708 — Firefox does not support SpeechRecognition; surface a clear message instead of silent failure
    if (!Ctor) {
      setVoicePermissionError('Voice input is not supported in this browser. Use Chrome or Safari for voice.')
      return
    }

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
  // Sprint 704 — action preview card for route_to_review responses
  const [actionPreview, setActionPreview] = useState<DirectorActionPreview | null>(null)
  // Sprint 711 — visible conversation thread for COO responses
  // Sprint 748 — extended with label + type for metadata preservation when commandResponse card is suppressed
  const [cooThread, setCooThread] = useState<Array<{
    user: string
    donna: string
    label?: string
    type?: 'info' | 'honest'
  }>>([])
  // Sprint 748 — auto-scroll ref: bottom of thread is scrolled into view on new turns
  const cooThreadBottomRef = useRef<HTMLDivElement>(null)
  // Sprint 824 — scroll container ref: scopes thread scroll to the inner container only;
  // prevents scrollIntoView from propagating to the outer panel and causing layout jumps.
  const cooThreadScrollRef = useRef<HTMLDivElement>(null)
  // Sprint 825 — wrapper ref: used to reveal the thread wrapper in the outer panel on first reply.
  const cooThreadWrapperRef = useRef<HTMLDivElement>(null)
  // Sprint 825 — previous thread length: detects the 0→1 first-reply transition only.
  const previousCooThreadLengthRef = useRef(0)
  // Sprint 828 — brief thinking indicator for synchronous conversational commands.
  // Set to true at the start of the follow-up resolver path and the COO router path
  // so "Thinking…" appears in the header for the duration of that render frame.
  const [isProcessingCommand, setIsProcessingCommand] = useState(false)
  // Sprint 1011 — God Mode LLM orchestrator state
  const [godModeOutput, setGodModeOutput] = useState<OrchestratorOutput | null>(null)
  const [isGodModeLoading, setIsGodModeLoading] = useState(false)
  const [godModeHistory, setGodModeHistory] = useState<OrchestratorTurn[]>([])
  // Sprint 828 — safety-net timer ref: clears isProcessingCommand after 600ms if not
  // already cleared by the cooThread useEffect. Handles paths that do not push to
  // cooThread (navigation commands, fallback responses).
  const processingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  // Sprint 719 — initialize with static default to avoid SSR hydration mismatch; load real values in useEffect
  const [preferences, setPreferences] = useState<DonnaPreferences>(defaultPreferences)
  const [preferencesMounted, setPreferencesMounted] = useState(false)
  // Sprint 381 — Attendance exception draft (director-initiated)
  const [attendanceExceptionDraft, setAttendanceExceptionDraft] = useState<AttendanceExceptionDraft | null>(null)
  // Sprint 382 — Last workflow card action (Dev Tools tracking)
  const [lastCardAction, setLastCardAction] = useState<LastCardActionRecord | null>(null)
  // Sprint 383 — Attendance session resolution
  const [attendanceSessionOptions, setAttendanceSessionOptions] = useState<AttendanceSessionOption[]>([])
  const [isLoadingAttendanceSessions, setIsLoadingAttendanceSessions] = useState(false)
  const [attendanceQueueing, setAttendanceQueueing] = useState(false)
  const [attendanceQueueResult, setAttendanceQueueResult] = useState<DonnaApprovalExecutionResult | null>(null)

  // Sprint 757 — Active guided operator state (runtime step tracking)
  const [currentOperatorId, setCurrentOperatorId] = useState<string | null>(null)
  const [currentOperatorStep, setCurrentOperatorStep] = useState<number>(0)
  // Sprint 760 — Page-aware action surfacing
  const [showPageActions, setShowPageActions] = useState(false)
  // Sprint 784 — Cross-session context loaded from localStorage on mount (SSR-safe)
  const [lastSessionData, setLastSessionData] = useState<DonnaLastSession | null>(null)
  // Sprint 785 — Current-session intent context for follow-up resolution (RAM only, never persisted)
  const [sessionIntentContext, setSessionIntentContext] = useState<DonnaSessionIntentContext | null>(null)
  // Sprint 787 — Idle presence: true when panel has been open with no interaction for 3 min
  const [isDonnaIdle, setIsDonnaIdle] = useState(false)

  // Review queue state — Sprint 273
  const [reviewQueueData, setReviewQueueData] = useState<DonnaReviewQueueSummary | null>(null)
  const [isLoadingReviewQueue, setIsLoadingReviewQueue] = useState(false)

  // Multi-step plan state — Sprint 286
  const [multiStepPlan, setMultiStepPlan] = useState<DonnaMultiStepPlan | null>(null)
  const [multiStepIndex, setMultiStepIndex] = useState(0)

  // Voice UI state — Sprint 289
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  // Sprint 685 — full VoiceState from VoiceInputButton for the status indicator
  const [voiceStateForIndicator, setVoiceStateForIndicator] = useState<VoiceState>('idle')
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState<string | null>(null)
  const [pendingVoiceAnswer, setPendingVoiceAnswer] = useState<DonnaVoiceTranscriptState | null>(null)
  const [voicePermissionError, setVoicePermissionError] = useState<string | null>(null)
  // Sprint 296A — isolated TTS test state (never touches speech guard refs or onboardingStep)
  const [testVoiceStatus, setTestVoiceStatus] = useState<'idle' | 'speaking' | 'done' | 'error'>('idle')
  // Sprint 350 — tracks last server TTS call result for Developer Tools display
  // Sprint 720 — extended with voice name for quality status display
  const [lastServerTtsInfo, setLastServerTtsInfo] = useState<{
    source: DonnaVoiceOutputMode
    text: string
    voice?: string
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

  // Sprint 757 — Map DonnaRole to UIActionRole for structured dispatch
  // 'director' → 'academy_director'; 'coach' → 'head_coach' (more permissive safe default)
  const uiActionRole: UIActionRole = role === 'director' ? 'academy_director' : 'head_coach'
  // Sprint 1040 — derived vars for chip deduplication
  const hasPageChips = getChipsForRoute(pathname).length > 0
  const isPlayerProfilePage = pathname.startsWith('/director/players/') && pathname.split('/').length === 4
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
    // Sprint 784 — persist current page context to localStorage before clearing state
    const mem = getSessionMemory()
    if (mem.currentModuleLabel) {
      saveLastSession(academyId, {
        lastPageLabel: mem.currentModuleLabel,
        lastPageRoute: pathname,
        lastSafeActionLabel: mem.lastSafeTopic ?? null,
      })
    }
    closeDonnaPanel()
    setActiveMode(null)
    setTemplateDraft(null)
    setGenericDraft(null)
    setFromVoiceCapture(false)
    setDailyGreetingState(null)
    setTemplateCommandInput('')
    setCommandResponse(null)
    // Sprint 711 — clear conversation thread on panel close
    setCooThread([])
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
    setVoiceStateForIndicator('idle')
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
    setCurrentOperatorId(null)
    setCurrentOperatorStep(0)
    setSessionIntentContext(null) // Sprint 785 — clear follow-up context on panel close
    // Sprint 787 — clear idle timer and reset idle presence on panel close
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    setIsDonnaIdle(false)
    realtimeDisconnect()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopServerTts()
    // Sprint 828 — clear processing indicator and cancel safety-net timer on panel close
    if (processingClearTimerRef.current) {
      clearTimeout(processingClearTimerRef.current)
      processingClearTimerRef.current = null
    }
    // Sprint 1011 — clear God Mode state on panel close
    setGodModeOutput(null)
    setIsGodModeLoading(false)
    setGodModeHistory([])
    setIsProcessingCommand(false)
  }, [realtimeDisconnect, closeDonnaPanel])

  // Sprint 787 — Reset the 3-minute idle timer on any director interaction.
  // When the timer fires: stop wake listening (no-op if inactive), show idle presence card.
  function resetIdleTimer() {
    if (!panelOpen) return
    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    setIsDonnaIdle(false)
    idleTimerRef.current = setTimeout(() => {
      // stopWakeListening() is a no-op when wake recognition is not active
      stopWakeListening()
      setIsDonnaIdle(true)
      idleTimerRef.current = null
    }, 3 * 60 * 1000) // 3 minutes
  }

  // Escape closes the panel
  useEffect(() => {
    if (!panelOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panelOpen, closePanel])

  // Sprint 719 — Load preferences from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setPreferences(loadPreferences())
    setPreferencesMounted(true)
  }, [])

  // Sprint 784 — Load cross-session context from localStorage on mount (SSR-safe)
  useEffect(() => {
    setLastSessionData(loadLastSession(academyId))
  }, [academyId])

  // Sprint 787 — Restore panel open state from sessionStorage on mount (within-session persistence).
  // If the director had the panel open and navigated or refreshed, re-open it automatically.
  // Uses sessionStorage (not localStorage) so this is tab-scoped and clears on tab close.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const wasOpen = window.sessionStorage.getItem('academyos:donna:panelOpen:v1') === 'true'
    if (wasOpen) openDonnaPanel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — mount only

  // Sprint 787 — Sync panelOpen to sessionStorage so within-session presence persists across navigations.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (panelOpen) {
      window.sessionStorage.setItem('academyos:donna:panelOpen:v1', 'true')
    } else {
      window.sessionStorage.removeItem('academyos:donna:panelOpen:v1')
    }
  }, [panelOpen])

  // Sprint 787 — Idle timer lifecycle: start 3-min timer when panel opens, clear when it closes.
  useEffect(() => {
    if (panelOpen) {
      resetIdleTimer()
    } else {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      setIsDonnaIdle(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen])

  // Sprint 787 — Reset idle timer whenever director types in the panel input.
  useEffect(() => {
    if (!panelOpen || !typedText) return
    resetIdleTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedText, panelOpen])

  // Sprint 702 — Initialize chat session memory on mount (or role change)
  useEffect(() => {
    ensureChatSession(role)
  }, [role])

  // Sprint 702 — Show continuity message on subsequent panel opens (not first open)
  useEffect(() => {
    if (!panelOpen) return
    panelOpenCountRef.current += 1
    if (panelOpenCountRef.current <= 1) return // first open handled by greeting flow
    const session = ensureChatSession(role) // safe — returns existing session
    if (session.turns.length === 0) return
    const memory = getSessionMemory()
    const continuity = buildContinuityMessage(memory, firstName)
    if (continuity) {
      setCommandResponse({ message: continuity, type: 'info', label: 'DONNA' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen])

  // Sprint 856 — Auto-load live context on panel open.
  // contextSummary is cleared on every panel close (closePanel line 929), so every fresh open
  // starts with null and gets a live read-only refresh via the same fetchDonnaContext path
  // the director would trigger manually. The null guard prevents a redundant fetch on the rare
  // case where the panel was never closed (e.g. session-storage restore with in-flight state).
  // handleContextSummary is a function declaration (hoisted) — safe to call here.
  useEffect(() => {
    if (!panelOpen) return
    if (contextSummary !== null) return
    void handleContextSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen])

  // Sprint 857 — Route-change context refresh while DONNA panel is open.
  // Sprint 811 intentionally preserved contextSummary across navigation so the director
  // doesn't have to re-ask when closing and reopening. Sprint 856 added auto-fetch on
  // panel open. Sprint 857 closes the remaining gap: when the panel stays open and the
  // director navigates to a different route or player, this effect detects the route
  // change and fetches fresh context for the new destination.
  //
  // Guard: only runs when panelOpen is true — no wasted server action when panel is closed.
  // Does NOT depend on panelOpen — Sprint 856 [panelOpen] effect owns that trigger;
  // adding panelOpen here would cause double-fetches on panel open.
  // No infinite loop risk — handleContextSummary writes contextSummary/suggestions,
  // which are not in this effect's deps. pathname only changes on real navigation events.
  // handleContextSummary is a function declaration (hoisted) — safe to call here.
  // handleContextSummary already clears contextSummary/suggestions before fetching (line 2317).
  useEffect(() => {
    if (!panelOpen) return
    void handleContextSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Sprint 872 — Update lastKnownContextParamsRef on every pathname change.
  // Only WRITES params when the new route yields a sessionId or templateId — never clears
  // them — so IDs persist when navigating to pages that don't have them (e.g., dashboard).
  // This enables cross-page section navigation: DONNA can resolve a session/template ID
  // even when the user has already navigated away from that detail page.
  useEffect(() => {
    const req = deriveContextRequest(pathname, role)
    if (req.params?.sessionId) lastKnownContextParamsRef.current.sessionId = req.params.sessionId
    if (req.params?.templateId) lastKnownContextParamsRef.current.templateId = req.params.templateId
  }, [pathname, role])

  // Sprint 405 — donna:open custom event listener
  // Allows any page component to open DONNA and pre-fill the input via:
  // window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt: '...' } }))
  useEffect(() => {
    function handleDonnaOpen(e: Event) {
      const detail = (e as CustomEvent<{ prompt?: string; donnaAnswer?: { message: string; type: 'info' | 'success' | 'warning' | 'error'; label?: string } }>).detail
      openDonnaPanel()
      if (detail?.donnaAnswer) {
        const { message, label } = detail.donnaAnswer
        setCommandResponse({ message, type: 'info', label })
        return
      }
      if (detail?.prompt) {
        setTypedText(detail.prompt)
      }
    }
    window.addEventListener('donna:open', handleDonnaOpen)
    return () => window.removeEventListener('donna:open', handleDonnaOpen)
  }, [])

  // Sprint 748 — auto-scroll thread to latest message whenever cooThread changes.
  // Sprint 824 — scoped to the inner thread container only (cooThreadScrollRef).
  // scrollTo on the container scrollHeight replaces scrollIntoView, which was
  // traversing the outer panel and causing the full panel to jump on new turns.
  useEffect(() => {
    if (cooThread.length === 0) return
    const el = cooThreadScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [cooThread])

  // Sprint 825 — first-reply outer panel reveal.
  // When cooThread transitions from empty (length 0) to the first reply (length > 0),
  // scroll the outer panel to bring the thread wrapper into view exactly once.
  // Guard: only fires on the 0→1 transition. All later turns (1→2, 2→3…) hit the
  // !wasEmpty early return and leave the outer panel untouched (Sprint 824 behavior).
  // cooThread resets to [] on panel close (Sprint 711), so this fires fresh each session.
  useEffect(() => {
    const wasEmpty = previousCooThreadLengthRef.current === 0
    previousCooThreadLengthRef.current = cooThread.length
    if (!wasEmpty || cooThread.length === 0) return
    cooThreadWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [cooThread])

  // Sprint 828 — clear processing indicator once a conversational reply lands in the thread.
  // Runs after each paint that includes a cooThread update. Cancels the 600ms safety-net
  // timer and clears isProcessingCommand so "Thinking…" disappears as soon as the reply
  // bubble is visible. For paths that do not push to cooThread, the 600ms timer handles
  // cleanup. Calling setIsProcessingCommand(false) when already false is a no-op.
  useEffect(() => {
    if (cooThread.length > 0) {
      if (processingClearTimerRef.current) {
        clearTimeout(processingClearTimerRef.current)
        processingClearTimerRef.current = null
      }
      setIsProcessingCommand(false)
    }
  }, [cooThread])

  // Sprint 823 — auto-expand Context when DONNA loads a context summary
  useEffect(() => {
    if (contextSummary) setShowContextSection(true)
  }, [contextSummary])

  // Sprint 823 — auto-expand Suggestions when DONNA populates recommendations
  useEffect(() => {
    if (suggestions.length > 0 || (recommendationSet && recommendationSet.recommendations.length > 0)) {
      setShowSuggestionsSection(true)
    }
  }, [suggestions, recommendationSet])

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
    // Sprint 801 — commandResponse intentionally NOT cleared on route change.
    // DONNA's answer now persists when the director navigates (e.g. clicks a link in the answer).
    // It clears on: panel close, explicit dismiss, new submission, mode change, or closePanel().
    setActionPreview(null)
    // Sprint 811 — contextSummary intentionally NOT cleared on route change.
    // DONNA's page context persists when the director navigates so they don't have to re-ask.
    // Context may be from the previous page until the director explicitly re-requests it.
    // It clears on: panel close (closePanel()), explicit dismiss (onDismissContextSummary),
    // or when handleContextSummary() fires a fresh fetch (clears before re-fetching).
    // Sprint 811 — suggestions intentionally NOT cleared on route change.
    // Suggestions are derived from contextSummary — preserving both keeps them coherent.
    // They clear on: panel close, individual dismiss, or new context fetch.
    setIsLoadingContext(false)
    setResolutionContext(null)
    setResolvedObjects({})
    // Sprint 811 — reviewQueueData intentionally NOT cleared on route change.
    // Review queue is academy-wide (not page-specific) — stale data is low-risk and
    // preferable to forcing the director to re-fetch on every navigation.
    // It clears on: panel close (closePanel()), fetch error, or next successful fetch.
    setIsLoadingReviewQueue(false)
    setPendingVoiceAnswer(null)
    setInterimVoiceTranscript(null)
    // Sprint 683: voice listening/speaking/wake state intentionally NOT reset on route change.
    // DONNA should stay active across director navigation. Explicit close/stop still resets these.
    // Sprint 693: cancel any active TTS utterance on navigation — content from the previous page
    // should not continue speaking after the director moves to a new route.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopServerTts()
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
    setCurrentOperatorId(null)
    setCurrentOperatorStep(0)
    setSessionIntentContext(null) // Sprint 785 — clear follow-up context on route change
    // Sprint 700 — wire route-change safe memory so DONNA session recall tracks navigation
    recordRouteChange(pathname, getPromptCategoryLabel(pathname))
    // Sprint 784 — also persist to localStorage for cross-session context
    const routeMem = getSessionMemory()
    if (routeMem.currentModuleLabel) {
      saveLastSession(academyId, {
        lastPageLabel: routeMem.currentModuleLabel,
        lastPageRoute: pathname,
        lastSafeActionLabel: routeMem.lastSafeTopic ?? null,
      })
    }
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
    resetIdleTimer() // Sprint 787 — voice transcript counts as interaction
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

    // Sprint 779 — Guided operator step advance.
    // If an operator is active, handleOperatorStepAdvance consumes the input and
    // returns true (early exit). Returns false when no operator is active — routing
    // continues normally below. Must run after voice-safety guard and before all
    // intent classification so the operator can intercept cancel/step/complete turns.
    if (handleOperatorStepAdvance(text)) return

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
        setCommandResponse({ message: turn.displayMessage, type: 'info', label: 'DONNA' })
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

    // 5.55. Sprint 780 — Daily brief intent (expanded phrase map via matchesDailyBriefIntent)
    if (matchesDailyBriefIntent(text)) {
      void handleFetchDailyBrief()
      return
    }

    // 5.56. Sprint 370 — Attention intent
    if (isAttentionPhrase(lower)) {
      void handleFetchAttention()
      return
    }

    // 5.57. Sprint 785 — Follow-up resolver: uses safe current-session context only.
    // Runs after all explicit intent matchers so it never steals first-turn commands.
    // Operator flow guard at step 5.2 (handleOperatorStepAdvance) always runs before this.
    {
      const followUp = resolveFollowUp(text, sessionIntentContext)
      if (followUp) {
        if (followUp.navigationHref === '/director/review' && followUp.actionType === 'navigate') {
          void handleOpenReviewQueue()
        } else if (followUp.navigationHref) {
          router.push(followUp.navigationHref)
        }
        setCommandResponse({ message: followUp.responseText, type: 'info', label: 'DONNA' })
        setCooThread(prev => [...prev.slice(-4), { user: text, donna: followUp.responseText, type: 'info' as const }])
        speakDonna(followUp.responseText)
        recordPrompt(text)
        recordTurn(text, followUp.responseText, { domain: 'general' })
        return
      }
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

    // 8. Sprint 757 — UI action dispatcher pre-check (blocked/nav/operator intercept)
    if (handleUIDispatch(text)) return

    // 9. Sprint 697 — COO conversational router: runs before legacy detectAndHandleCommand
    const cooHandled = handleDonnaCooPrompt(text)
    if (!cooHandled) {
      detectAndHandleCommand(text)
    }
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

    // Sprint 656: block director-only tasks for coach role
    if (!isTaskAllowedForRole(taskId, role)) {
      setCommandResponse({ message: DIRECTOR_REQUIRED_COPY, type: 'honest', label: 'Director only' })
      return
    }

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
    if (listening) resetIdleTimer() // Sprint 787 — mic activation counts as interaction
  }

  function handleInterimTranscript(text: string) {
    setInterimVoiceTranscript(text || null)
  }

  function handleVoiceError(error: string) {
    setVoicePermissionError(
      error === 'not-allowed'
        ? 'Microphone access is blocked. You can enable it in your browser settings or type instead.'
        : 'Voice is unavailable right now. You can type instead.',
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

  // Returns true if the phrase is a review queue intent.
  // Sprint 780: removed 'what needs my attention' — reclassified to daily_brief intent family
  // via matchesDailyBriefIntent (fires at step 5.55, before this check at step 5.5).
  // Review queue remains reachable via: "show review queue", "open review queue",
  // "pending review", "what needs approval", "pending approvals", etc.
  function isReviewQueuePhrase(lower: string): boolean {
    return (
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
          // Sprint 785 — record intent context for follow-up resolver
          setSessionIntentContext({
            lastIntentFamily: 'attention',
            lastResultSectionCount: null,
            lastResultHighPriorityCount: null,
            lastResultItemCount: null,
            lastSuggestedNavigationHref: '/director/review',
            lastSuggestedNavigationLabel: 'Review Queue',
            lastTopicLabel: 'urgent items',
            setAt: Date.now(),
          })
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
          // Sprint 789 — auto-narrate brief summary via DONNA voice when brief loads
          const voiceSummary = buildBriefVoiceSummary(json.brief)
          speakDonna(voiceSummary)
          // Sprint 785 — record safe structural context so follow-ups can reference this brief
          const briefHighCount = json.brief.sections.filter(s => s.priority === 'high').length
          const briefTotalItems = json.brief.sections.reduce((n, s) => n + s.items.length, 0)
          setSessionIntentContext({
            lastIntentFamily: 'daily_brief',
            lastResultSectionCount: json.brief.sections.length,
            lastResultHighPriorityCount: briefHighCount,
            lastResultItemCount: briefTotalItems,
            lastSuggestedNavigationHref: '/director/review',
            lastSuggestedNavigationLabel: 'Review Queue',
            lastTopicLabel: "today's brief",
            setAt: Date.now(),
          })
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

  // Sprint 789 — Build a natural 1–2 sentence spoken summary of the daily brief.
  // Used to auto-narrate when the brief loads. No player names, no raw content — structural metadata only.
  function buildBriefVoiceSummary(brief: import('@/components/assistant/donnaDailyBrief').DailyBrief): string {
    const total = brief.sections.length
    const highCount = brief.sections.filter(s => s.priority === 'high').length
    const firstHigh = brief.sections.find(s => s.priority === 'high')
    if (total === 0) return "Today's brief is ready — nothing needs your attention right now."
    if (highCount > 0 && firstHigh) {
      const urgentNote = highCount === 1
        ? `One area needs your attention first: ${firstHigh.title}.`
        : `${highCount} areas look higher priority — starting with ${firstHigh.title}.`
      return total === 1
        ? urgentNote
        : `You've got ${total} area${total !== 1 ? 's' : ''} today. ${urgentNote}`
    }
    return `You've got ${total} area${total !== 1 ? 's' : ''} today — nothing is marked urgent.`
  }

  // Sprint 789 — Build a full narration text from all brief sections.
  // Each section contributes one sentence: title + first item + count of remaining items.
  function buildBriefWalkthroughText(brief: import('@/components/assistant/donnaDailyBrief').DailyBrief): string {
    if (brief.sections.length === 0) return "Today's brief is empty."
    const parts = brief.sections.map(section => {
      const priorityNote = section.priority === 'high' ? ' — urgent' : ''
      const firstItem = section.items[0] ?? ''
      const extra = section.items.length > 1 ? ` and ${section.items.length - 1} more` : ''
      return `${section.title}${priorityNote}: ${firstItem}${extra}`
    })
    return parts.join('. ') + '.'
  }

  // Sprint 789 — Narrate the full brief via DONNA voice. Called by "Walk me through it" button.
  function handleBriefWalkthrough() {
    if (!dailyBrief) return
    const summary = buildBriefVoiceSummary(dailyBrief)
    const details = buildBriefWalkthroughText(dailyBrief)
    const narration = `${summary} Here's the breakdown: ${details} Want me to open the Review Queue?`
    setCommandResponse({ message: narration, type: 'info', label: 'Daily Brief — Walkthrough' })
    setCooThread(prev => [...prev.slice(-4), { user: 'Walk me through it', donna: narration, type: 'info' as const }])
    speakDonna(narration)
    resetIdleTimer()
  }

  // Opens the review queue panel and fetches data.
  async function handleOpenReviewQueue() {
    // Sprint 656: coaches do not have access to the director review queue
    if (role === 'coach') {
      setCommandResponse({ message: DIRECTOR_REQUIRED_COPY, type: 'honest', label: 'Director only' })
      return
    }
    recordSignal('review_queue_opened')
    setActiveMode('review_queue')
    setGenericDraft(null)
    setTemplateDraft(null)
    setCommandResponse(null)
    setIsLoadingReviewQueue(true)
    try {
      const data = await getDonnaReviewQueueAction()
      setReviewQueueData(data)
      // Sprint 785 — record intent context for follow-up resolver
      setSessionIntentContext({
        lastIntentFamily: 'review_queue',
        lastResultSectionCount: null,
        lastResultHighPriorityCount: null,
        lastResultItemCount: data?.totalCount ?? null,
        lastSuggestedNavigationHref: '/director/review',
        lastSuggestedNavigationLabel: 'Review Queue',
        lastTopicLabel: 'pending reviews',
        setAt: Date.now(),
      })
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
      const req = deriveContextRequest(pathname, role)
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
  // Sprint 657: director-only navigation commands are skipped for coach role.
  function detectAndHandleCommand(text: string): boolean {
    const lower = text.toLowerCase().trim()

    // Review queue intent — guarded for coach in handleOpenReviewQueue (Sprint 656)
    if (isReviewQueuePhrase(lower)) {
      void handleOpenReviewQueue()
      return true
    }

    // Sprint 657: director-only navigation commands not available for coach role
    if (role === 'coach') return false

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

    // Sprint 971 — Review Queue Guidance: "What should I review first?", "What is safe to approve?"
    // Runs before the daily brief check — phrases are exclusive to this guidance handler.
    {
      const rqIntent = matchesReviewQueueGuidanceIntent(text)
      if (rqIntent) {
        const guidance = buildReviewQueueGuidance(rqIntent)
        const labels: Record<string, string> = {
          first_priority: 'Review Priority',
          safe_to_approve: 'Safe to Approve',
          explain_queue: 'Review Queue',
          what_caution: 'Use Caution',
        }
        setCommandResponse({ message: guidance, type: 'info', label: labels[rqIntent] ?? 'Review Queue' })
        setActiveMode('guide')
        return true
      }
    }

    // Sprint 972 — Class Template Guidance: "Explain this template", "What are blocks?", etc.
    {
      const ctIntent = matchesClassTemplateGuidanceIntent(text)
      if (ctIntent) {
        const guidance = buildClassTemplateGuidance(ctIntent)
        const labels: Record<string, string> = {
          explain_template: 'Class Template',
          template_readiness: 'Template Readiness',
          explain_blocks: 'Block Structure',
          create_session_from_template: 'Session From Template',
          explain_template_list: 'Template Library',
        }
        setCommandResponse({ message: guidance, type: 'info', label: labels[ctIntent] ?? 'Class Template' })
        setActiveMode('explain')
        return true
      }
    }

    // Sprint 973 — Curriculum Builder Guidance: "Explain levels", "What are gates?", etc.
    {
      const cbIntent = matchesCurriculumBuilderGuidanceIntent(text)
      if (cbIntent) {
        const guidance = buildCurriculumBuilderGuidance(cbIntent)
        const labels: Record<string, string> = {
          explain_curriculum: 'Curriculum',
          explain_levels: 'Curriculum Levels',
          explain_gates: 'Curriculum Gates',
          what_to_edit_first: 'Where to Start',
          draft_review_behavior: 'Draft & Review',
          global_vs_academy: 'Global vs Academy',
        }
        setCommandResponse({ message: guidance, type: 'info', label: labels[cbIntent] ?? 'Curriculum' })
        setActiveMode('explain')
        return true
      }
    }

    // "What should I do next?" — Sprint 968: routes through Director Next Action Engine.
    // Uses reviewQueuePendingCount (already in state) + pathname as live signals.
    // If a targetFocusId is returned, highlights it via the existing donna:highlight path.
    // Falls back gracefully when the recommended element is not on the current page.
    if (matchesWhatNextIntent(text) || lower.includes('what should i do next')) {
      const action = buildDirectorNextAction({
        pendingReviews: reviewQueuePendingCount,
        pathname,
      })
      setCommandResponse({ message: action.summary, type: 'info', label: action.title })
      setActiveMode('guide')
      if (action.targetFocusId && typeof window !== 'undefined') {
        setDonnaFocusTarget({
          route: pathname,
          targetId: action.targetFocusId,
          label: action.title,
          highlightStyle: 'teal-glow',
          expiresAt: Date.now() + 8000,
        })
        window.dispatchEvent(new CustomEvent('donna:highlight'))
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

  // Sprint 761 — Advance an active guided operator step, or clear on cancel.
  // Returns true if the operator consumed the input (caller should return early).
  // Returns false if no operator is active (caller continues normal routing).
  function handleOperatorStepAdvance(text: string): boolean {
    if (!currentOperatorId) return false

    // Cancel intent — clear operator and respond
    if (/cancel|stop|exit|start over|reset|quit/i.test(text)) {
      const opLabel = getOperatorById(currentOperatorId)?.label ?? 'current flow'
      setCurrentOperatorId(null)
      setCurrentOperatorStep(0)
      const msg = "Okay, I've cleared the current flow. What would you like to do?"
      setCommandResponse({ message: msg, type: 'info', label: opLabel })
      setCooThread(prev => [...prev.slice(-4), { user: text, donna: msg, label: opLabel, type: 'info' }])
      speakDonna(msg)
      return true
    }

    const nextStepNumber = currentOperatorStep + 1
    const nextStep = getOperatorStep(currentOperatorId, nextStepNumber)
    const operator = getOperatorById(currentOperatorId)

    if (nextStep && operator) {
      setCurrentOperatorStep(nextStepNumber)
      const exitHint = "\n\n(Say 'cancel' or 'start over' to exit this flow)"
      const msg = nextStep.donnaPrompt + exitHint
      setCommandResponse({ message: msg, type: 'info', label: `Step ${nextStepNumber} — ${nextStep.label}` })
      setCooThread(prev => [...prev.slice(-4), {
        user: text,
        donna: msg,
        label: `Step ${nextStepNumber}`,
        type: 'operator_step' as 'info',
      }])
      speakDonna(nextStep.donnaPrompt)
      return true
    }

    // No next step — operator complete
    const opLabel = operator?.label ?? 'flow'
    setCurrentOperatorId(null)
    setCurrentOperatorStep(0)
    const completionMsg = `We've completed the ${opLabel}. What would you like to do next?`
    setCommandResponse({ message: completionMsg, type: 'info', label: 'Flow complete' })
    setCooThread(prev => [...prev.slice(-4), { user: text, donna: completionMsg, label: 'Complete', type: 'info' }])
    speakDonna(completionMsg)
    return true
  }

  // Sprint 760 — Safety label display for page-aware action surfacing
  function getSafetyLabel(safetyClass: UIActionSafetyClass): string {
    switch (safetyClass) {
      case 'always_safe': return '✓ Safe'
      case 'safe_with_context': return '✓ Safe'
      case 'draft_to_review': return 'Draft → Review'
      case 'director_approval': return 'Director Approval Required'
      case 'platform_required': return 'Platform Required'
      case 'always_blocked': return 'Blocked'
      default: return '✓ Safe'
    }
  }

  // Sprint 760 — Handle "What can DONNA do here?" chip
  function handleShowPageActions() {
    setShowPageActions(prev => !prev)
    setCommandResponse(null)
  }

  // Sprint 757 — UI action dispatcher pre-check.
  // Intercepts three definitive kinds before the COO router, in priority order:
  //   1. blocked (confidence === 'blocked') — architecture invariant violations
  //   2. navigate (confidence === 'high')   — explicit route navigation
  //   3. guided_operator (confidence === 'high') — operator launch with step 1 prompt
  // Everything else returns false so the existing COO + legacy routing runs unchanged.
  // DOES NOT touch GODmode dispatch, conversational router, or any draft/approval logic.
  function handleUIDispatch(text: string): boolean {
    // Sprint 872 — pass lastKnownContextParamsRef for cross-page section ID resolution
    const result = dispatchUIIntent(text, uiActionRole, pathname, lastKnownContextParamsRef.current)

    if (result.kind === 'blocked' && result.confidence === 'blocked') {
      const msg = result.message
      setCommandResponse({ message: msg, type: 'honest', label: 'Not allowed' })
      setCooThread(prev => [...prev.slice(-4), { user: text, donna: msg, label: 'Not allowed', type: 'honest' }])
      speakDonna(msg)
      return true
    }

    if (result.kind === 'navigate' && result.route && result.confidence === 'high') {
      // Sprint 817 — set teal focus target before navigation so destination page can highlight
      if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
      // Sprint 873 — update follow-up resolver context so anaphoric follow-ups ("show me",
      // "take me there", "go there") after a section navigation command re-navigate to the
      // same place DONNA just went. Previously handleUIDispatch navigate results were invisible
      // to sessionIntentContext — follow-up resolver used the last COO suggestion instead.
      // Sprint 876 — changed lastIntentFamily from 'coo_answer' to 'section_nav' (semantic fix).
      // resolveFollowUp does not explicitly check for 'coo_answer' or 'section_nav' — both
      // fall through to the lastSuggestedNavigationHref catch-all (anaphoric handler line 335),
      // so follow-up behaviour ("show me", "take me there", "go there") is fully preserved.
      setSessionIntentContext({
        lastIntentFamily: 'section_nav',
        lastResultSectionCount: null,
        lastResultHighPriorityCount: null,
        lastResultItemCount: null,
        lastSuggestedNavigationHref: result.route,
        lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section',
        lastTopicLabel: result.focusTarget?.label ?? null,
        setAt: Date.now(),
      })
      // Sprint 871 — same-page: dispatch custom event so DonnaHighlightBanner re-runs
      // without a pathname change. Cross-page: keep existing router.push behaviour.
      if (result.route === pathname) {
        window.dispatchEvent(new CustomEvent('donna:highlight'))
      } else {
        router.push(result.route)
      }
      return true
    }

    // Sprint 873 — surface section-nav clarification to the user.
    // Fires when a Category 1A phrase matched (actionId !== null) but the required dynamic
    // param (sessionId / templateId) was unavailable from both URL and ctxParams.
    // DONNA's "Open a specific session first" guidance would otherwise be suppressed:
    // handleUIDispatch returned false → COO classified as unknown intent → generic fallback.
    // Guard: actionId !== null distinguishes section-nav clarification from the generic
    // dispatchUIIntent fallback (actionId: null), which must still fall through to the COO.
    if (result.kind === 'clarification_needed' && result.actionId !== null && result.confidence === 'partial') {
      setCommandResponse({ message: result.message, type: 'info', label: 'DONNA' })
      setCooThread(prev => [...prev.slice(-4), { user: text, donna: result.message, type: 'info' as const }])
      speakDonna(result.message)
      return true
    }

    if (result.kind === 'guided_operator' && result.operatorId && result.confidence === 'high') {
      const operator = getOperatorById(result.operatorId)
      if (operator) {
        setCurrentOperatorId(operator.id)
        setCurrentOperatorStep(1)
        const step1 = operator.steps[0]
        const stepDesc = step1 ? `\n\n**Step 1 — ${step1.label}:** ${step1.donnaPrompt}` : ''
        const msg = `${operator.openingLine}${stepDesc}`
        setCommandResponse({ message: msg, type: 'info', label: operator.label })
        setCooThread(prev => [...prev.slice(-4), { user: text, donna: msg, label: operator.label, type: 'info' }])
        speakDonna(operator.openingLine)
        return true
      }
    }

    return false
  }

  // Sprint 697 — COO conversational router: first-pass handler before legacy routing.
  // Returns true if the router handled the prompt (commandResponse set, speakDonna called).
  // Returns false to fall through to legacy detectAndHandleCommand.
  // Falls through only for answer_directly (unknown intent) so all existing legacy routes are preserved.
  // Sprint 702 — records each turn to donnaChatSessionMemory; injects follow-up prefix when topic was previously discussed.
  // Sprint 703 — role-aware: coach gets director-referral response for director-only intents.
  function handleDonnaCooPrompt(text: string): boolean {
    const routing = routeDonnaPrompt(text, pathname)
    if (routing.responseMode === 'answer_directly') return false

    // Sprint 719 — onboarding-route intercept: give setup-mode answer when on /director/onboarding
    if (pathname.startsWith('/director/onboarding')) {
      const lower = text.toLowerCase()
      const isOnboardingQ = lower.includes('onboard') || lower.includes('setup') || lower.includes('set up') ||
        lower.includes('help') || lower.includes('walk me') || lower.includes('start') || lower.includes('begin') ||
        lower.includes('what') || lower.includes('how') || lower.includes('confused') || lower.includes('next')
      if (isOnboardingQ) {
        const composed = composeOnboardingAnswer(firstName)
        setCommandResponse({ message: composed.text, type: 'info', label: 'Academy Setup' })
        recordPrompt(text)
        recordSummary(composed.text)
        recordTurn(text, composed.text, { domain: 'general' })
        speakDonna(composed.text)
        return true
      }
    }

    // Sprint 703 — coach role guard: redirect director-only intents to director-referral copy
    const DIRECTOR_ONLY_INTENTS = new Set(['level_movement', 'assessment_or_placement', 'parent_summary', 'curriculum_builder'])
    if (role === 'coach' && DIRECTOR_ONLY_INTENTS.has(routing.intent)) {
      const coachMsg = `That requires director approval. I can help you capture an observation so it's ready for the director to review.\n\nYour director can then use it in the review queue.`
      setCommandResponse({ message: coachMsg, type: 'info', label: 'Director required' })
      recordPrompt(text)
      recordSummary(coachMsg)
      recordTurn(text, coachMsg, { domain: 'general' })
      speakDonna(coachMsg)
      return true
    }

    // Sprint 712 — coach-contextual responses for shared intents (KPI, roster)
    if (role === 'coach') {
      if (routing.intent === 'kpi_explanation' || routing.intent === 'kpi_priority') {
        const coachKpiMsg = `As a coach, your focus is on individual player attendance and session quality within your groups. Academy-wide KPIs are reviewed by your director.\n\nI can help you capture session notes, flag a player for attention, or summarize your recent sessions. What do you need?`
        setCommandResponse({ message: coachKpiMsg, type: 'info', label: 'Coach context' })
        recordPrompt(text)
        recordSummary(coachKpiMsg)
        recordTurn(text, coachKpiMsg, { domain: 'academy_health' })
        speakDonna(coachKpiMsg)
        return true
      }
      if (routing.intent === 'roster_attention') {
        const coachRosterMsg = `I can help you focus on the players in your sessions. For academy-wide flags and risk levels, your director has that view.\n\nTell me which player you're thinking about — I can help you draft an observation or session note.`
        setCommandResponse({ message: coachRosterMsg, type: 'info', label: 'Coach context' })
        recordPrompt(text)
        recordSummary(coachRosterMsg)
        recordTurn(text, coachRosterMsg, { domain: 'players' })
        speakDonna(coachRosterMsg)
        return true
      }
    }

    const lower = text.toLowerCase()
    let composed

    if (routing.responseMode === 'use_page_context') {
      // Sprint 716 — all curriculum questions route to composeCurriculumAnswer with detected sub-type
      const isCurriculumQ = lower.includes('curriculum') ||
        (lower.includes('template') && (lower.includes('class') || lower.includes('level') || lower.includes('session')))
      if (isCurriculumQ) {
        composed = composeCurriculumAnswer(detectCurriculumQuestionType(lower), firstName)
      } else {
        // Sprint 710 — wire inspect_first sub-type
        const qType =
          lower.includes('where am i') ? 'where_am_i' as const
          : (lower.includes('what actions') && lower.includes('require')) ? 'approval_actions' as const
          : lower.includes('what should i not do') ? 'not_do' as const
          : (lower.includes('what should i inspect') || lower.includes('inspect first')) ? 'inspect_first' as const
          : 'help_here' as const
        composed = composePageContextAnswer(qType, pathname, firstName)
      }
    } else if (routing.responseMode === 'use_kpi_answer') {
      // Sprint 705 — use kpiExplainer to produce per-KPI answer from text
      composed = composeKpiAnswer(text, firstName)
    } else if (routing.responseMode === 'use_system_map') {
      // Sprint 716 — curriculum system questions get rich multi-type responses
      const isCurriculumSystemQ = lower.includes('curriculum') ||
        (lower.includes('template') && (lower.includes('class') || lower.includes('level')))
      if (isCurriculumSystemQ) {
        composed = composeCurriculumAnswer(detectCurriculumQuestionType(lower), firstName)
      } else {
        // Sprint 710 — try module-specific answer first; fall back to flow answers
        const moduleAnswer = composeModuleAnswer(text, firstName)
        if (moduleAnswer) {
          composed = moduleAnswer
        } else {
          const qType =
            (lower.includes('coach recap') || lower.includes('after a recap') || lower.includes('after the recap')) ? 'coach_recap' as const
            : (lower.includes('parent update') && (lower.includes('how') || lower.includes('approved'))) ? 'parent_update' as const
            : (lower.includes('mission') || lower.includes('badge')) ? 'missions_badges' as const
            : (lower.includes('test first') || lower.includes('what should i test')) ? 'test_first' as const
            : (lower.includes('player progress') || lower.includes('connected to')) ? 'player_progress' as const
            : 'system_overview' as const
          composed = composeSystemFlowAnswer(qType)
        }
      }
    } else if (routing.responseMode === 'use_review_context') {
      // Sprint 706 — inject live review queue count into response
      composed = composeReviewQueueAnswer(reviewQueuePendingCount, reviewQueueData, firstName)
    } else if (routing.responseMode === 'use_roster_intel') {
      // Sprint 706/713 — inject live attention report + review queue player names into roster response
      composed = composeRosterIntelAnswer(attentionReport, reviewQueueData, firstName)
    } else {
      composed = composeDonnaResponse(routing, pathname, firstName)
    }

    // Sprint 702 — map routing intent to a TopicDomain for session memory
    type TopicDomainMap = Record<string, import('@/lib/donna/donnaChatSessionMemory').TopicDomain>
    const INTENT_TO_DOMAIN: TopicDomainMap = {
      review_queue: 'review_queue',
      roster_attention: 'players',
      level_movement: 'players',
      assessment_or_placement: 'players',
      kpi_explanation: 'academy_health',
      kpi_priority: 'academy_health',
      curriculum_builder: 'curriculum',
      parent_summary: 'general',
    }
    const domain = INTENT_TO_DOMAIN[routing.intent] ?? 'general'

    // Prepend follow-up prefix when this topic was already discussed this session
    const prefix = !composed.isBlocked ? getContextualPrefix(domain) : ''
    const finalText = prefix ? prefix + composed.text : composed.text

    setCommandResponse({
      message: finalText,
      type: composed.isBlocked ? 'honest' : 'info',
      label: composed.isBlocked ? 'Not allowed' : (composed.nextStepLabel ?? 'DONNA'),
    })

    // Sprint 802 — record intent context so follow-up phrases ("go there", "open that", "which ones?")
    // resolve correctly after any COO response, not just daily_brief / review_queue / attention.
    // Sprint 887 — set lastIntentFamily to 'roster_attention' when routing.intent is roster_attention,
    // so roster-specific follow-up handlers can distinguish it from generic COO answers.
    // All other COO intents continue to write 'coo_answer'.
    if (!composed.isBlocked) {
      setSessionIntentContext({
        lastIntentFamily: routing.intent === 'roster_attention' ? 'roster_attention' : 'coo_answer',
        lastResultSectionCount: null,
        lastResultHighPriorityCount: null,
        lastResultItemCount: null,
        lastSuggestedNavigationHref: composed.nextStepHref ?? null,
        lastSuggestedNavigationLabel: composed.nextStepLabel ?? null,
        lastTopicLabel: composed.nextStepLabel ?? null,
        setAt: Date.now(),
      })
    }

    // Sprint 704 — show structured action preview card for route_to_review and build_action_preview
    if (routing.responseMode === 'route_to_review' || routing.responseMode === 'build_action_preview') {
      const previewResult = getActionPreviewForRequest(text)
      setActionPreview(previewResult.preview)
    } else {
      setActionPreview(null)
    }

    recordPrompt(text)
    if (finalText) recordSummary(finalText)
    // Sprint 702 — record turn so follow-up questions have session context
    recordTurn(text, finalText, { domain })
    // Sprint 711 — push to visible conversation thread (last 5 turns)
    // Sprint 748 — extended with label + type for metadata preservation
    setCooThread(prev => [...prev.slice(-4), {
      user: text,
      donna: finalText,
      label: composed.isBlocked ? 'Not allowed' : (composed.nextStepLabel ?? undefined),
      type: composed.isBlocked ? 'honest' : 'info',
    }])
    speakDonna(finalText)
    return true
  }

  // Sprint 826 — Refocus the typed input after a conversational command so follow-up
  // questions feel natural without requiring a click. Only runs on non-touch devices
  // (desktop/laptop): guards against re-opening the mobile virtual keyboard after submit.
  function focusDonnaInput() {
    if (typeof window === 'undefined') return
    if (navigator.maxTouchPoints > 0) return
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
      el?.focus()
    })
  }

  // Sprint 1011 — God Mode: LLM orchestrator call for unrecognized inputs.
  // Called as the final fallback when no existing deterministic handler claims the input.
  // Never throws — falls back to commandResponse on any error.
  // Academy ID and role are resolved server-side in the action — never from client state.
  async function handleGodModeQuery(text: string): Promise<void> {
    setGodModeOutput(null)
    setIsGodModeLoading(true)
    try {
      const result = await runDonnaOrchestratorAction({
        userInput: text,
        pathname,
        pageLabel: ctx.screenName ?? undefined,
        firstName: firstName ?? undefined,
        pendingReviews: reviewQueuePendingCount,
        conversationHistory: godModeHistory,
        useLlm: true,
      })
      if (result.ok && result.output) {
        setGodModeOutput(result.output)
        setGodModeHistory(prev => [
          ...prev.slice(-8),
          { role: 'user' as const, content: text, timestamp: Date.now() },
          { role: 'donna' as const, content: result.output!.text, timestamp: Date.now(), outputType: result.output!.type },
        ])
      } else {
        setCommandResponse({
          message: result.error ?? 'DONNA is temporarily unavailable. Please try again.',
          type: 'honest',
          label: 'DONNA',
        })
      }
    } catch {
      setCommandResponse({
        message: 'DONNA is temporarily unavailable. Please try again.',
        type: 'honest',
        label: 'DONNA',
      })
    } finally {
      setIsGodModeLoading(false)
      setIsProcessingCommand(false)
    }
  }

  function handleCommandSubmit(overrideText?: string) {
    const text = (overrideText ?? typedText).trim()
    if (!text) return

    resetIdleTimer() // Sprint 787 — any submitted prompt counts as interaction

    // Sprint 802 — "Close Donna" text command: explicit dismiss phrases close the panel.
    // Checked before all routing so it always works regardless of active mode or draft state.
    {
      const lc = text.toLowerCase().trim()
      if (
        lc === 'close donna' || lc === 'close panel' || lc === 'hide donna' ||
        lc === 'dismiss donna' || lc === 'dismiss' || lc === 'close this' ||
        lc === 'close assistant' || lc === 'exit donna' || lc === 'stop donna'
      ) {
        closePanel()
        return
      }
    }

    // Sprint 686 — track last safe prompt in session context for continuity
    updatePrompt(text)

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
        setCommandResponse({ message: turn.displayMessage, type: 'info', label: 'DONNA' })
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

    // Daily brief intent — Sprint 780 (expanded phrase map via matchesDailyBriefIntent)
    if (matchesDailyBriefIntent(text)) {
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

    // Sprint 785 — Follow-up resolver: uses safe current-session context only.
    // Runs after all explicit intent matchers so it never steals first-turn commands.
    // Operator flow guard (handleOperatorStepAdvance) always runs before this path.
    {
      const followUp = resolveFollowUp(text, sessionIntentContext)
      if (followUp) {
        // Sprint 828 — mark processing before setting response so "Thinking…" fires
        // for this render frame. The cooThread useEffect clears it after paint.
        if (processingClearTimerRef.current) clearTimeout(processingClearTimerRef.current)
        setIsProcessingCommand(true)
        processingClearTimerRef.current = setTimeout(() => setIsProcessingCommand(false), 600)
        if (followUp.navigationHref === '/director/review' && followUp.actionType === 'navigate') {
          void handleOpenReviewQueue()
        } else if (followUp.navigationHref) {
          router.push(followUp.navigationHref)
        }
        setCommandResponse({ message: followUp.responseText, type: 'info', label: 'DONNA' })
        setCooThread(prev => [...prev.slice(-4), { user: text, donna: followUp.responseText, type: 'info' as const }])
        speakDonna(followUp.responseText)
        recordPrompt(text)
        recordTurn(text, followUp.responseText, { domain: 'general' })
        setTypedText('')
        focusDonnaInput() // Sprint 826 — conversational reply; ready for follow-up
        return
      }
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

    // Sprint 757 — UI action dispatcher pre-check (blocked/nav/operator intercept)
    if (handleUIDispatch(text)) {
      setTypedText('')
      return
    }

    // Sprint 828 — mark processing before COO router and fallthrough commands.
    // Both handleDonnaCooPrompt and detectAndHandleCommand are synchronous.
    // The cooThread useEffect clears isProcessingCommand after paint for COO responses
    // that push to cooThread. The 600ms timer handles navigation/fallback responses
    // that set commandResponse but do not push to cooThread.
    if (processingClearTimerRef.current) clearTimeout(processingClearTimerRef.current)
    setIsProcessingCommand(true)
    processingClearTimerRef.current = setTimeout(() => setIsProcessingCommand(false), 600)

    // Sprint 697 — COO conversational router: runs before legacy detectAndHandleCommand
    const cooHandled = handleDonnaCooPrompt(text)
    if (!cooHandled) {
      const handled = detectAndHandleCommand(text)
      if (!handled) {
        // Sprint 1011 — God Mode: LLM orchestrator as final fallback.
        // Cancel the 600ms processingClear timer — handleGodModeQuery manages
        // isProcessingCommand in its own finally block after the async response.
        recordSignal('command_unrecognized')
        if (processingClearTimerRef.current) clearTimeout(processingClearTimerRef.current)
        processingClearTimerRef.current = null
        void handleGodModeQuery(text)
      } else {
        recordSignal('command_issued')
      }
    } else {
      recordSignal('command_issued')
    }
    setTypedText('')
    focusDonnaInput() // Sprint 826 — conversational reply; ready for follow-up
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger                                                      */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => {
          // Sprint 1029: toggle — click while open minimizes (session preserved), not a no-op
          if (panelOpen) { minimizePanel(); return }
          // Sprint 918: if minimized, expand (restores panel without full re-init)
          if (panelMinimized) { expandPanel(); return }
          openDonnaPanel()
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
            if (!introCompleted && !firstName) {
              // Sprint 290: start the guided onboarding intro instead of generic greeting.
              // Sprint 296B: do NOT auto-speak here — Chrome discards the gesture context
              // before speak() is reached after multiple setState calls. Director presses
              // "Play Donna voice" button for a clean gesture-backed speak().
              setOnboardingStep(0)
              setShowOnboardingSuggestions(false)
            } else {
              // Sprint 745: if name already known from auth profile, skip the name question
              // and mark intro complete so future opens also go straight to greeting.
              if (!introCompleted && firstName && typeof window !== 'undefined') {
                window.sessionStorage.setItem('academyos:donna:introCompleted:v1', 'true')
              }
              const isOnSessionPage =
                pathname.includes('/sessions/') && pathname.split('/sessions/')[1]?.length > 0
              if (role === 'director') {
                // Sprint 685 — richer director greeting with page-aware re-entry copy.
                const isFirstOpenToday = shouldShowDailyDonnaGreeting()
                const content = buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)
                const followUp = isOnSessionPage
                  ? "I can help you review this session or capture a coach note."
                  : content.followUp
                // Sprint 784 — cross-session welcome: use prior-session context when not
                // first open today and we have stored page context from a previous session.
                const crossSessionText =
                  !isFirstOpenToday && lastSessionData?.lastPageLabel
                    ? buildCrossSessionWelcome(lastSessionData, firstName)
                    : null
                const greeting: DailyGreetingState = {
                  isFirstOpenToday,
                  primaryText: crossSessionText ?? content.primaryText,
                  followUp: crossSessionText ? '' : followUp,
                }
                setDailyGreetingState(greeting)
                if (isFirstOpenToday) {
                  markDailyDonnaGreetingShown()
                  // Sprint 965 — upgraded to speakDonna: server TTS (marin + British-accent
                  // instructions) → browser fallback. No browser guard needed — speakDonna
                  // handles environment checks internally. Anti-repeat is preserved via
                  // hasGreetedRef (fires at most once per component mount) and isFirstOpenToday
                  // (fires at most once per calendar day, backed by localStorage).
                  speakDonna(content.primaryText)
                }
              } else {
                // Coach path — keep existing donnaDailyGreeting behavior.
                // Sprint 647/648/651 daily welcome; role='coach' routing copy.
                const greeting = getDailyGreetingState(firstName, role)
                // Sprint 651 — session context override
                if (isOnSessionPage) {
                  greeting.followUp = "I can help with notes, observations, or wrap-up for this session."
                }
                setDailyGreetingState(greeting)
                if (greeting.isFirstOpenToday) {
                  markGreetedToday()
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    speakAssistantText(greeting.primaryText)
                  }
                }
              }
            }
          }

          // Sprint 373: fetch review queue count on panel open (director only — Sprint 657 regression fix)
          // Sprint 375: also evaluate rule-based recommendations from returned signals
          void (role === 'director' ? getDonnaReviewQueueAction() : Promise.resolve(null)).then((data) => {
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
        aria-label={panelOpen ? `Minimize ${DONNA_PUBLIC_NAME}` : panelMinimized ? `Resume ${DONNA_PUBLIC_NAME} session` : `Ask ${DONNA_PUBLIC_NAME}`}
        title={panelOpen ? `Minimize — session preserved` : panelMinimized ? `Resume ${DONNA_PUBLIC_NAME} session` : `Ask ${DONNA_PUBLIC_NAME}`}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full relative',
          // Sprint 707 — hide floating button on mobile for directors; mobile bar replaces it
          role === 'director' ? 'hidden sm:flex' : 'flex',
          'items-center justify-center',
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
        } : panelMinimized ? {
          // Sprint 918: lime tint when minimized — signals "resume conversation"
          background: 'linear-gradient(135deg, #1a2e00, #243800)',
          border: '1px solid rgba(200,255,0,0.4)',
          boxShadow: '0 4px 16px rgba(200,255,0,0.15)',
        } : {
          background: 'linear-gradient(135deg, #6d28d9, #4338ca)',
          border: '1px solid rgba(139,92,246,0.35)',
        }}
      >
        <Sparkles className={panelMinimized ? 'w-[18px] h-[18px] text-lime' : 'w-[18px] h-[18px]'} />
        {/* Sprint 918: dot indicator when minimized — conversation preserved */}
        {panelMinimized && (
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-lime border border-black" />
        )}
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
          // Sprint 714 — mobile: constrain panel to upper 70% of viewport so mobile bar stays visible
          // Sprint 814 — mobile: true full-width drawer (w-full on mobile, sm:w-96 on desktop)
          'fixed top-0 right-0 z-50 w-full sm:w-96 flex flex-col',
          'sm:bottom-0 bottom-[60px]',
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
          className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-lime/10 border border-lime/25"
              >
                <Sparkles className="w-3.5 h-3.5 text-lime" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">{DONNA_PUBLIC_NAME}</h2>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-lime/10 border border-lime/20 text-lime"
              >
                Review-first
              </span>
              {/* Sprint 800 — Single priority-driven status badge (replaces 8 competing badges).
                  Priority order: Thinking > Speaking > Listening > Paused > Mic blocked > Ready.
                  Only the highest-priority active state is shown at any one time.
                  Sprint 828 — isProcessingCommand added: fires for synchronous conversational
                  commands (follow-up resolver + COO router) that have no async loading state. */}
              {(isProcessingCommand || isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading) && !isSpeaking ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{ background: 'rgba(10,132,255,0.15)', color: '#0A84FF' }}
                >
                  Thinking…
                </span>
              ) : isSpeaking ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                >
                  Speaking
                </span>
              ) : voiceStateForIndicator === 'listening' ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}
                >
                  Listening
                </span>
              ) : voiceStateForIndicator === 'paused' ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500' }}
                >
                  Paused
                </span>
              ) : voicePermissionError ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500' }}
                >
                  Mic blocked
                </span>
              ) : voiceStateForIndicator === 'idle' && isVoiceSupported === true ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(200,255,0,0.06)', color: 'rgba(200,255,0,0.45)' }}
                >
                  Ready
                </span>
              ) : null}
            </div>
            {/* Sprint 814 — hidden on mobile; page context label below is more useful on small screens */}
            <p className="hidden sm:block text-xs text-text-muted leading-snug mt-0.5">
              {DONNA_PUBLIC_TITLE}
            </p>
            {/* Sprint 800 — Page context label: shows which screen DONNA is aware of */}
            {ctx.screenName && (
              <p className="text-[10px] text-text-muted leading-snug mt-0.5">
                <span style={{ color: 'rgba(200,255,0,0.55)' }}>↳</span>{' '}
                <span className="text-text-muted">{ctx.screenName}</span>
              </p>
            )}
            {/* Sprint 373 — Review queue badge (director only — Sprint 657 regression fix) */}
            {role === 'director' && reviewQueuePendingCount > 0 && (
              <div className="mt-1.5">
                <DonnaReviewQueueBadge
                  count={reviewQueuePendingCount}
                  onOpen={handleOpenReviewQueue}
                />
              </div>
            )}
          </div>
          {/* Sprint 918 — context refresh flash */}
          {showContextRefresh && contextPageLabel && (
            <span className="text-[9px] text-lime/70 font-medium px-1.5 py-0.5 rounded-full bg-lime/8 border border-lime/20 animate-pulse mr-1 shrink-0 whitespace-nowrap">
              ↻ {contextPageLabel}
            </span>
          )}
          {/* Sprint 918 — minimize: hides panel without clearing conversation thread */}
          <button
            onClick={minimizePanel}
            aria-label="Minimize assistant"
            title="Minimize — conversation preserved"
            className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 sm:mt-0.5
              text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={closePanel}
            aria-label="Close assistant"
            className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ml-1 sm:mt-0.5
              text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab chips — role-aware quick actions (Sprint 656)
            Sprint 1040: hidden when DonnaPanelPageChips covers this route (avoids double chip rows).
            Player-profile pages are excluded — their data-driven chips must always show. */}
        {(!hasPageChips || isPlayerProfilePage) && <div
          className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {(role === 'coach'
            ? ([
                { label: 'My Sessions', action: () => { router.push('/coach/sessions'); closePanel() } },
                { label: 'Player Notes', action: () => setTypedText('Capture a player note') },
                // Sprint 760 — page-aware action surfacing chip
                { label: 'What can DONNA do here?', action: handleShowPageActions },
                {
                  label: 'Ask Anything',
                  action: () => {
                    setActiveMode(null)
                    setCommandResponse(null)
                    // Sprint 824 — input is near the top of the panel and already in view;
                    // scrollIntoView removed to prevent the outer panel from jumping up.
                    setTimeout(() => {
                      const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
                      el?.focus()
                    }, 50)
                  },
                },
              ] as { label: string; action: () => void }[])
            : ([
                // Sprint 784 — conditional "Back to" chip (shown only when prior session data exists)
                ...((lastSessionData?.lastPageLabel && lastSessionData?.lastPageRoute)
                  ? ([{
                      label: `↩ Back to ${lastSessionData.lastPageLabel}`,
                      action: () => {
                        resetIdleTimer() // Sprint 787
                        if (lastSessionData?.lastPageRoute) router.push(lastSessionData.lastPageRoute)
                        closePanel()
                      },
                    }] as { label: string; action: () => void }[])
                  : []),
                // Sprint 854 — Player profile priority-aware chips.
                // donnaSession.playerProfileContext is injected by PlayerProfileDonnaRegistrar
                // (mounts with the player profile server component, clears on unmount).
                // Chip labels use real priority data when available; fall back to generic labels
                // when context is null (e.g. panel opens before registrar mounts).
                //
                // Sprint 852 — route detection: /director/players/<uuid> (4 path segments).
                // Highlight note: DonnaHighlightBanner fires on pathname change only.
                // Tab switches via ?tab=notes (query-string) do NOT trigger the teal highlight.
                //
                // Sprint 800 — original generic chips preserved for all non-player-profile routes.
                ...(pathname.startsWith('/director/players/') && pathname.split('/').length === 4
                  ? ((): { label: string; action: () => void }[] => {
                      const playerCtx = donnaSession.playerProfileContext
                      return [
                        // Chip 1: top priority title + level if available, else generic
                        {
                          label: playerCtx?.topPriorityTitle
                            ? `View: ${playerCtx.topPriorityTitle}${playerCtx.topPriorityLevel ? ` (${playerCtx.topPriorityLevel})` : ''}`
                            : 'View player notes',
                          action: () => { router.push(pathname + '?tab=notes'); closePanel() },
                        },
                        // Chip 2: count-aware if priorities exist, else generic
                        {
                          label: (playerCtx?.activePriorityCount ?? 0) > 0
                            ? `Show priorities (${playerCtx!.activePriorityCount})`
                            : 'Show priorities',
                          action: () => { router.push(pathname + '?tab=notes'); closePanel() },
                        },
                        // Chip 3: always navigate to review queue player updates tab
                        {
                          label: 'Open player updates',
                          action: () => { router.push('/director/review?tab=player-updates'); closePanel() },
                        },
                      ]
                    })()
                  : ([
                      // Generic director chips for all other director routes.
                      // Sprint 800 — Trimmed to 3 core chips (+ optional "Back to" = max 4).
                      // Removed: "What's on the agenda?", "What should I review first?", "Walk me through today."
                      // — reduces chip overload; surviving chips cover daily intent, attention, and page context.
                      { label: 'What do I need to do today?', action: () => handleCommandSubmit('What do I need to do today?') },
                      { label: 'What needs my attention?', action: () => handleCommandSubmit('What needs my attention?') },
                      { label: 'What can you help me do here?', action: () => handleCommandSubmit('What can you help me do here?') },
                    ] as { label: string; action: () => void }[])
                ),
              ] as { label: string; action: () => void }[])
          ).map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.action}
              className="shrink-0 text-[11px] px-2.5 py-2.5 sm:py-1 rounded-full transition-all text-text-secondary hover:text-text-primary"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
            >
              {chip.label}
            </button>
          ))}
        </div>}

        {/* Scrollable body — Sprint 1032: overscroll-contain prevents pull-to-refresh on mobile */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">

          {/* Sprint 787 — Idle presence card: shown after 3 min of no interaction */}
          {isDonnaIdle && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'rgba(200,255,0,0.03)',
                border: '1px solid rgba(200,255,0,0.1)',
              }}
            >
              <p className="text-[13px] text-text-secondary leading-snug">
                I'm here when you need me.
              </p>
            </div>
          )}

          {/* ── Sprint 760: Page-aware action surfacing card ── */}
          {showPageActions && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2"
              style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest font-semibold text-lime">
                  What DONNA can do here
                </p>
                <button
                  type="button"
                  onClick={() => setShowPageActions(false)}
                  className="text-text-muted hover:text-text-primary text-[10px] transition-colors"
                >
                  ✕
                </button>
              </div>
              {(() => {
                const actions = getAvailableActionsForContext(uiActionRole, pathname).slice(0, 6)
                if (actions.length === 0) {
                  return (
                    <p className="text-[12px] text-text-muted leading-snug">
                      No specific actions registered for this page. DONNA can still help you navigate, draft, and guide — just ask.
                    </p>
                  )
                }
                return (
                  <div className="space-y-1.5">
                    {actions.map(action => (
                      <div key={action.actionId} className="flex items-start justify-between gap-2">
                        <p className="text-[12px] text-text-primary leading-snug flex-1">{action.displayName}</p>
                        <span
                          className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: action.safetyClass === 'always_safe' || action.safetyClass === 'safe_with_context'
                              ? 'rgba(48,209,88,0.12)' : action.safetyClass === 'draft_to_review'
                              ? 'rgba(255,149,0,0.12)' : 'rgba(255,59,48,0.12)',
                            color: action.safetyClass === 'always_safe' || action.safetyClass === 'safe_with_context'
                              ? '#30D158' : action.safetyClass === 'draft_to_review'
                              ? '#FF9500' : '#FF3B30',
                          }}
                        >
                          {getSafetyLabel(action.safetyClass)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <p className="text-xs text-text-muted leading-snug pt-1">
                Ask DONNA about any of these actions, or type a command below.
              </p>
            </div>
          )}

          {/* ── Greeting / onboarding intro card — shown on first open ── */}
          {/* Sprint 290: shows the first onboarding question (same text spoken + displayed). */}
          {/* Sprint 746: suppress greeting when a conversation/DONNA response is already active
               to avoid two simultaneous response surfaces (greeting card + DONNA says box) */}
          {showGreeting && cooThread.length === 0 && !commandResponse && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'rgba(200,255,0,0.04)',
                border: '1px solid rgba(200,255,0,0.15)',
              }}
            >
              <p className="text-xs uppercase tracking-widest font-semibold mb-1 text-lime">
                {DONNA_PUBLIC_NAME}
              </p>
              <p className="text-[13px] text-text-primary font-medium leading-snug">
                {isOnboardingActive(onboardingStep)
                  ? DONNA_ONBOARDING_STEPS[onboardingStep].question
                  : (dailyGreetingState?.primaryText ?? greetingText)}
              </p>
              {/* Sprint 647/649 — daily welcome follow-up, priority hint, and role-aware CTA */}
              {!isOnboardingActive(onboardingStep) && dailyGreetingState?.followUp && (
                <p className="text-[12px] text-text-secondary mt-2 leading-snug">
                  {dailyGreetingState.followUp}
                </p>
              )}
              {/* Sprint 1030 — page-aware context line: tells director DONNA knows the current page */}
              {!isOnboardingActive(onboardingStep) && ctx.screenName && ctx.screenName !== 'Director Dashboard' && (
                <p className="text-[11px] mt-2 leading-snug text-text-muted">
                  You're on: <span className="text-lime font-medium">{ctx.screenName}</span>
                </p>
              )}
              {/* Sprint 649 — live priority hint for director role */}
              {!isOnboardingActive(onboardingStep) && role === 'director' && reviewQueuePendingCount > 0 && (
                <p className="text-[11px] mt-2 leading-snug" style={{ color: '#FF9500' }}>
                  {reviewQueuePendingCount === 1
                    ? '1 item is waiting in your review queue.'
                    : `${reviewQueuePendingCount} items are waiting in your review queue.`}
                </p>
              )}
              {/* Sprint 654 — wrap-up priority CTA when coach is on a session page */}
              {!isOnboardingActive(onboardingStep) && role === 'coach' && (() => {
                const sessionSegment = pathname.includes('/sessions/')
                  ? pathname.split('/sessions/')[1]
                  : null
                const sessionId = sessionSegment && !sessionSegment.startsWith('undefined') ? sessionSegment.split('/')[0] : null
                return sessionId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTypedText('Help me wrap up this session')
                    }}
                    className="mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                      hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: 'rgba(255,149,0,0.08)',
                      border: '1px solid rgba(255,149,0,0.25)',
                      color: '#FF9500',
                    }}
                  >
                    This session needs a wrap-up. Start now?
                  </button>
                ) : null
              })()}
              {!isOnboardingActive(onboardingStep) && dailyGreetingState?.isFirstOpenToday && role === 'director' && (
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
                  Walk me through academy priorities
                </button>
              )}
              {/* Sprint 655 — Coach quick actions when not on a session detail page */}
              {!isOnboardingActive(onboardingStep) && role === 'coach' && activeMode === null && !genericDraft && !templateDraft && (() => {
                const sessionSegment = pathname.includes('/sessions/') ? pathname.split('/sessions/')[1] : null
                const sessionId = sessionSegment && !sessionSegment.startsWith('undefined') ? sessionSegment.split('/')[0] : null
                if (sessionId) return null
                return (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs uppercase tracking-widest font-semibold text-text-muted">Quick actions</p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => { setTypedText('Capture a player note') }}
                        className="w-full text-left rounded-lg px-3 py-1.5 text-xs transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', color: '#AAAAAA' }}
                      >
                        Capture a player note
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleFetchDailyBrief()}
                        className="w-full text-left rounded-lg px-3 py-1.5 text-xs transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', color: '#AAAAAA' }}
                      >
                        What needs attention today?
                      </button>
                      <Link
                        href="/coach/sessions"
                        onClick={closePanel}
                        className="block rounded-lg px-3 py-1.5 text-xs transition-all hover:brightness-110"
                        style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', color: '#AAAAAA' }}
                      >
                        Go to my sessions
                      </Link>
                    </div>
                  </div>
                )
              })()}
              {isOnboardingActive(onboardingStep) && (
                <>
                  <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                    {DONNA_SAFETY_REMINDER}
                  </p>
                  {/* Sprint 806 — Simplified voice section: debug/dev controls removed */}
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
                      {voiceGreetingStatus === 'idle' && 'Play Donna voice'}
                      {voiceGreetingStatus === 'starting' && 'Starting…'}
                      {voiceGreetingStatus === 'speaking' && 'Speaking…'}
                      {(voiceGreetingStatus === 'stalled' || voiceGreetingStatus === 'error') && 'Play Donna voice again'}
                      {voiceGreetingStatus === 'done' && '✓ Donna spoke'}
                    </button>
                    {(voiceGreetingStatus === 'stalled' || voiceGreetingStatus === 'error') && (
                      <p className="text-[10px] leading-snug" style={{ color: '#FF9500' }}>
                        Voice unavailable — type your response instead.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Sprint 964 — Page-aware chip bar ────────────────────────────────── */}
          {/* Chips appear after the greeting and before the voice/text input.      */}
          {/* Highlight chips use existing data-donna-focus-id targets + escalation. */}
          {/* Prompt chips route through handleCommandSubmit — no new DONNA surface. */}
          <DonnaPanelPageChips
            pathname={pathname}
            onPrompt={(text) => handleCommandSubmit(text)}
            onBrief={() => void handleFetchDailyBrief()}
          />

          {/* ── Primary voice card — Sprint 384: extracted to DonnaVoiceLayer ── */}
          <DonnaVoiceLayer
            onboardingStep={onboardingStep}
            guidedCurrentQ={guidedCurrentQ}
            onVoiceTranscriptRaw={handleVoiceTranscriptRaw}
            onListeningChange={handleVoiceListeningChange}
            onInterimTranscript={handleInterimTranscript}
            onVoiceError={handleVoiceError}
            onSupportedChange={setIsVoiceSupported}
            onVoiceStateChange={setVoiceStateForIndicator}
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
            isThinking={isProcessingCommand || isGodModeLoading || isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading}
            donnaLastResponse={null /* Sprint 1040 — DonnaPanelResponseRenderer is now the unified response surface; "DONNA says" card above the input duplicated the thread */}
            promptSuggestions={getDonnaPromptSuggestions(pathname)}
            promptCategoryLabel={getPromptCategoryLabel(pathname)}
            pathname={pathname}
            isSpeaking={isSpeaking}
          />

          {/* ── Sprint 1028 — Unified DONNA response renderer ── */}
          {/* Replaces: inline cooThread section (Sprints 747-825) + Sprint 1011 God Mode section. */}
          {/* DonnaWorkflowCards below handles commandResponse + all workflow/draft state.          */}
          <DonnaPanelResponseRenderer
            cooThread={cooThread}
            godModeOutput={godModeOutput}
            isGodModeLoading={isGodModeLoading}
            onGodModeNavigate={(route) => {
              router.push(route)
              closePanel()
            }}
            onGodModeHighlight={(targetId, route, label) => {
              executeDonnaHighlight({ targetId, route, label }, pathname, (r) => router.push(r))
              closePanel()
            }}
          />

          {/* ── Sprint 384: Workflow output cards — extracted to DonnaWorkflowCards ── */}
          {/* Sprint 748: suppressCommandResponseCard hides the "DONNA says" card     */}
          {/* when the thread already shows this exact response as a chat bubble.     */}
          {/* Category B responses (continuity, errors, role-boundary) still show    */}
          {/* the card because their message does not match the last thread donna turn*/}
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
            suppressCommandResponseCard={
              cooThread.length > 0 &&
              commandResponse !== null &&
              cooThread[cooThread.length - 1]?.donna === commandResponse.message
            }
            dailyBrief={dailyBrief}
            isDailyBriefLoading={isDailyBriefLoading}
            onDismissDailyBrief={() => setDailyBrief(null)}
            onDailyBriefOpenReviewQueue={() => void handleOpenReviewQueue()}
            onDailyBriefPrepareCoachBriefs={() => dispatchCooCommand('coach_brief')}
            onDailyBriefWalkthrough={handleBriefWalkthrough}
            attentionReport={attentionReport}
            isAttentionLoading={isAttentionLoading}
            onDismissAttention={() => setAttentionReport(null)}
            onClosePanel={closePanel}
            onAttentionOpenReviewQueue={() => void handleOpenReviewQueue()}
            recommendationSet={showSuggestionsSection ? recommendationSet : null}
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
            contextSummary={showContextSection ? contextSummary : null}
            onDismissContextSummary={() => setContextSummary(null)}
          />

          {/* ── Sprint 704 — Action preview card for route_to_review responses ── */}
          {actionPreview && (
            <div
              className="rounded-xl px-3.5 py-3 space-y-2"
              style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#8b5cf6' }}>
                Action preview
              </p>
              <p className="text-[12px] font-semibold text-text-primary">{actionPreview.title}</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{actionPreview.summary}</p>
              {actionPreview.willHappen.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-status-green font-semibold mb-1">Will happen</p>
                  <ul className="space-y-0.5">
                    {actionPreview.willHappen.map((item, i) => (
                      <li key={i} className="text-[11px] text-text-secondary flex gap-1.5 items-start">
                        <span className="text-status-green mt-0.5">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {actionPreview.willNotHappen.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Will NOT happen</p>
                  <ul className="space-y-0.5">
                    {actionPreview.willNotHappen.map((item, i) => (
                      <li key={i} className="text-[11px] text-text-muted flex gap-1.5 items-start">
                        <span className="mt-0.5">✕</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-status-orange leading-relaxed">{actionPreview.approvalRequirement}</p>
              {/* Sprint 713 — actionable CTA: open review center */}
              <div className="flex items-center gap-3 pt-0.5">
                <button
                  type="button"
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc' }}
                  onClick={() => { void handleOpenReviewQueue(); setActionPreview(null) }}
                >
                  Go to Review Center
                </button>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest font-semibold text-text-muted hover:opacity-80 transition-opacity"
                  onClick={() => setActionPreview(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Current context card removed in Sprint 745 — context is available via Explain mode */}

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

          {/* ── Inline response: Find something — role-aware links (Sprint 656) ── */}
          {activeMode === 'find' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Jump to
              </p>
              <div className="space-y-0.5">
                {(role === 'coach' ? COACH_QUICK_LINKS : QUICK_LINKS).map(link => (
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
                      className="shrink-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
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

          {/* ── Sprint 823 — Compact disclosure bar: Context | Suggestions | Actions ── */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Context pill */}
            <button
              type="button"
              onClick={() => setShowContextSection(prev => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: showContextSection ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.04)',
                border: `1px solid ${showContextSection ? 'rgba(45,212,191,0.4)' : 'rgba(45,212,191,0.15)'}`,
                color: showContextSection ? '#2dd4bf' : 'rgba(45,212,191,0.6)',
              }}
            >
              <span>Context</span>
              {/* Sprint 858 — loading pulse when fetching; static dot when loaded + collapsed */}
              {isLoadingContext ? (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5 animate-pulse" />
              ) : (contextSummary && !showContextSection) ? (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5" />
              ) : null}
            </button>

            {/* Suggestions pill */}
            <button
              type="button"
              onClick={() => setShowSuggestionsSection(prev => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: showSuggestionsSection ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.04)',
                border: `1px solid ${showSuggestionsSection ? 'rgba(45,212,191,0.4)' : 'rgba(45,212,191,0.15)'}`,
                color: showSuggestionsSection ? '#2dd4bf' : 'rgba(45,212,191,0.6)',
              }}
            >
              <span>Suggestions</span>
              {(suggestions.length > 0 || (recommendationSet && recommendationSet.recommendations.length > 0)) && !showSuggestionsSection && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 ml-0.5" />
              )}
            </button>

            {/* Actions pill */}
            <button
              type="button"
              onClick={() => setShowActionsSection(prev => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: showActionsSection ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.04)',
                border: `1px solid ${showActionsSection ? 'rgba(45,212,191,0.4)' : 'rgba(45,212,191,0.15)'}`,
                color: showActionsSection ? '#2dd4bf' : 'rgba(45,212,191,0.6)',
              }}
            >
              <span>Actions</span>
              {reviewQueueData && reviewQueueData.totalCount > 0 && !showActionsSection && (
                <span className="inline-block w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: '#FF3B30' }} />
              )}
            </button>
          </div>

          {/* ── Sprint 823 — Context section (disclosure) ── */}
          {/* ── Sprint 858 — skeleton replaces button while loading; button restores when idle ── */}
          {showContextSection && (
            <div className="space-y-2">
              {isLoadingContext ? (
                /* Sprint 858 — "Refreshing context…" skeleton shown during auto-fetch
                   (Sprint 856 panel-open trigger or Sprint 857 route-change trigger).
                   Replaces the "Ask about this page" button so only one loading signal
                   is visible at a time. Teal palette matches the Context pill. */
                <div
                  className="rounded-xl px-3.5 py-3 space-y-2.5"
                  style={{
                    background: 'rgba(45,212,191,0.04)',
                    border: '1px solid rgba(45,212,191,0.1)',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold animate-pulse"
                    style={{ color: '#2dd4bf' }}
                  >
                    Refreshing context…
                  </p>
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-2 rounded" style={{ background: 'rgba(45,212,191,0.08)', width: '72%' }} />
                    <div className="h-2 rounded" style={{ background: 'rgba(45,212,191,0.08)', width: '50%' }} />
                    <div className="h-2 rounded" style={{ background: 'rgba(45,212,191,0.08)', width: '62%' }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleContextSummary()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:brightness-110"
                  style={{
                    background: 'rgba(45,212,191,0.06)',
                    border: '1px solid rgba(45,212,191,0.2)',
                    color: '#2dd4bf',
                  }}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  Ask about this page
                </button>
              )}
            </div>
          )}

          {/* ── Sprint 823 — Suggestions section (disclosure) ── */}
          {showSuggestionsSection && suggestions.length > 0 && (
            <div className="space-y-2">
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

          {/* ── Sprint 823 — Actions section (disclosure) ── */}
          {showActionsSection && (
            <div className="space-y-1.5">
              {/* Review Queue */}
              {role === 'director' && (
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
                          <span className="text-[10px] font-semibold px-1 py-0.5 rounded"
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
              )}

              {/* Mode list */}
              <p className="text-xs uppercase tracking-widest text-text-muted font-semibold px-0.5 pt-1">
                What would you like?
              </p>
              {MODES.filter(({ mode }) => isModeAllowedForRole(mode, role)).map(({ mode, label, desc, Icon, category, safeStatus }) => (
                <button
                  key={mode}
                  onClick={() => { handleModeClick(mode); setShowActionsSection(false) }}
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
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)', color: '#a78bfa' }}
                        >
                          {category}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug mt-0.5">{desc}</p>
                      <p className="text-xs leading-snug mt-1" style={{ color: '#2dd4bf' }}>{safeStatus}</p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Quick actions for this page */}
              {pageTaskShortcuts.length > 0 && (
                <div
                  className="rounded-xl px-3.5 py-3 space-y-1.5"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs uppercase tracking-widest text-text-muted font-semibold">
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
                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface border border-border text-text-muted leading-none">
                              Coming soon
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sprint 720 — Voice quality status pill: small, non-noisy, shown only after TTS is used */}
          {/* Sprint 749 — opacity-50: reduces visual weight; not a critical status; errors stay visible above */}
          {/* Sprint 822 — Hidden in production: TTS source labels are developer diagnostics, not user-facing */}
          {process.env.NODE_ENV !== 'production' && lastServerTtsInfo && (
            <div className="px-4 pb-1 opacity-50">
              <p className="text-[10px] text-text-muted flex items-center gap-1.5 leading-none">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    lastServerTtsInfo.source === 'contract_tts' ? 'bg-lime' :
                    lastServerTtsInfo.source === 'browser_tts' ? 'bg-status-orange' :
                    'bg-text-muted'
                  }`}
                />
                {lastServerTtsInfo.source === 'contract_tts'
                  ? 'Premium Donna voice active'
                  : lastServerTtsInfo.source === 'browser_tts'
                  ? 'Device voice active'
                  : 'Text-only mode'}
              </p>
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
              preferencesMounted={preferencesMounted}
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
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-[11px] font-semibold" style={{ color: 'rgba(200,255,0,0.7)' }}>
            DONNA drafts. You approve.
          </p>
        </div>
      </aside>

      {/* Quick Capture drawer — opened from Capture mode */}
      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />

      {/* Sprint 707 — Mobile command bar: only for directors on small screens */}
      {role === 'director' && (
        <DONNADirectorMobileCommandBar
          academyHealthScore={null}
          pendingReviewCount={reviewQueuePendingCount}
          urgentReviewCount={reviewQueueData?.items.filter(i => i.priority === 'high').length ?? 0}
          onCommand={(text) => { openDonnaPanel(); handleCommandSubmit(text) }}
          onOpenReviewQueue={() => { openDonnaPanel(); void handleOpenReviewQueue() }}
          onOpenHealthDetail={openDonnaPanel}
          className="fixed bottom-0 inset-x-0 z-50 sm:hidden"
        />
      )}
    </>
  )
}

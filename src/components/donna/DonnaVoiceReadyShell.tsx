'use client'

// Sprint 1035 — DONNA Voice Ready Interaction Shell V1
// Wraps DonnaChatThread with voice input state management.
// Sprint 912.3 — DONNA Conversation State Foundation: adds conversationMode toggle,
// DonnaGodModeState computation, state labels, and Pause/Resume controls.
// Connects useVoiceDictation → text → chat send flow.
// Thin shell — voice logic lives in hooks, chat logic lives in DonnaChatThread.
// No DB writes. No mutations. Purely orchestration.

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { DonnaAssistantRole } from '@/components/donna/DonnaAssistantShell'
import {
  DonnaChatThread,
  buildUserChatMessage,
  type ChatMessage,
  type ChatQuickAction,
} from '@/components/donna/DonnaChatThread'
import { useVoiceDictation } from '@/lib/donna/useVoiceDictation'
import {
  recordTurn,
  ensureChatSession,
  setPendingNavOffer,
  consumePendingNavOffer,
  setPendingTemplateDraft,
  getPendingTemplateDraft,
  setPendingAction,
  getPendingAction,
  clearPendingAction,
  SESSION_PENDING_ACTION_TTL_MS,
  setPendingDrillSlotFill,
  getPendingDrillSlotFill,
  clearPendingDrillSlotFill,
  hasPendingDrillSlotFill,
  setLastCurriculumDraftAttempt,
  getLastCurriculumDraftAttempt,
  type PendingNavOffer,
} from '@/lib/donna/donnaChatSessionMemory'
import {
  checkQuestionBoundary,
  buildBoundaryMessage,
} from '@/lib/donna/donnaBoundaryResponses'
import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { CoachDonnaContext } from '@/lib/donna/coachDonnaContext'
import { getSuggestedQuestionsForRole } from '@/lib/donna/donnaSuggestedQuestions'
import { dispatchSafeReadAction, tryAnswerKpiQuestion, type DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { tryAnswerDashboardPriorityQuestion } from '@/lib/donna/directorDashboardDonnaAnswer'
import { tryAnswerRosterAttentionQuestion } from '@/lib/donna/directorPlayersDonnaIntelligence'
import { buildChatMessageFromAnswer } from '@/components/donna/DonnaChatThread'
import { tryDirectorClarificationOrBlock } from '@/lib/donna/directorClarificationEngine'
import { tryAnswerCoachHealthQuestion } from '@/lib/donna/coachHealthDonnaAnswer'
import { tryBuildActionPreview } from '@/lib/donna/directorActionPreview'
import { detectMissingContext } from '@/lib/donna/donnaMissingContextEngine'
import { routeDonnaPrompt } from '@/lib/donna/donnaConversationalRouter'
import {
  getPageCapabilityMap,
  whereAmI,
  whatCanYouHelpWith,
  whatActionsRequireApproval,
  whatShouldINotDo,
  whatIsTheBestNextStep,
} from '@/lib/donna/donnaPageContextEngine'
import { DONNA_SYSTEM_MAP } from '@/lib/donna/donnaSystemMap'
import { detectShortPhrase, buildShortPhraseAnswer } from '@/lib/donna/donnaShortPhraseEngine'
import { speakWithServerTts, stopServerTts } from '@/components/assistant/donnaServerTtsClient'
import { tryAnswerTemplateDraftRequest } from '@/lib/donna/templateDraftDonnaAnswer'
import { tryAnswerFitnessDraftRequest } from '@/lib/donna/fitnessDraftDonnaAnswer'
import { tryAnswerCurriculumLevelQuestion } from '@/lib/donna/curriculumLevelDonnaAnswer'
import { tryAnswerCurriculumImpactQuestion } from '@/lib/donna/curriculumImpactDonnaAnswer'
import { tryAnswerSessionAdjustmentQuestion } from '@/lib/donna/sessionAdjustmentDonnaAnswer'
import { tryAnswerCoachCueQuestion } from '@/lib/donna/coachCueDonnaAnswer'
import {
  tryAnswerCurriculumDraftProposal,
  extractTargetLevel,
  extractFocusArea,
  buildContentConfirmationSummaryText,
} from '@/lib/donna/curriculumDraftProposalDonnaAnswer'
import { createCurriculumContentItemDraft, type CurriculumContentType } from '@/lib/actions/curriculumDraftActions'
import { DATA_QUALITY_PATTERNS, buildDataQualityAnswer } from '@/lib/donna/dataQualityGuardian'
import { RECENT_DECISIONS_PATTERNS, buildRecentDecisionsAnswer } from '@/lib/donna/recentDecisionsAnswerEngine'
import { PLAYER_PROGRESS_STALL_PATTERNS, buildPlayerProgressStallAnswer } from '@/lib/donna/playerProgressStallDetector'
// Sprint 912.18 — Onboarding Guide Mode
import { detectOnboardingProgressQuestion, buildOnboardingProgressAnswer } from '@/lib/donna/donnaOnboardingGuideAnswer'
// Sprint 912.19 — Review Queue Intelligence
import { detectReviewQueueQuestion, buildReviewQueueAnswer } from '@/lib/donna/donnaReviewQueueAnswer'
import { submitDonnaActionDraft } from '@/lib/actions/donnaSentinelAction'
import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import { buildFocusTargetForRoute } from '@/lib/donna/donnaUIActionDispatcher'
// Sprint 914.3 — Backend Spine Wiring (fire-and-forget persistence)
// Sprint 914.4 — Context Packet Integration
import {
  getOrCreateDonnaSession,
  appendDonnaMessage as persistDonnaMessage,
  upsertDonnaMemory,
  recallRecentDonnaMessages,
  buildDonnaContextPacketForSession,
  type ContextPacketSummary,
} from '@/lib/actions/donnaConversationActions'
// Sprint 912.3 — Conversation Mode state machine
import {
  useDonnaConversationMode,
  computeGodModeState,
  getGodModeStateLabel,
  MAX_NO_SPEECH_RETRIES,
  type DonnaPendingConfirmation,
} from '@/lib/donna/useDonnaConversationMode'

// ── Yes/No detection patterns (Sprint 724) ────────────────────────────────────
const YES_PATTERN = /^(yes|yeah|yep|sure|ok|okay|go ahead|please|do it|take me there|yes please|definitely|absolutely|sounds good|let'?s go|open it|navigate|go there|open that)\b/i
const NO_PATTERN  = /^(no|nope|not now|cancel|never mind|maybe later|skip|not yet|don'?t|no thanks|not right now)\b/i

// ── Confirmation yes/no detection (Sprint 912.3) ──────────────────────────────
const CONFIRM_PATTERN = /^(yes|yeah|yep|sure|ok|okay|go ahead|please|do it|confirm|confirmed|sounds good|let'?s go|absolutely|definitely|create it|make it|create the draft|make the draft)\b/i
const CANCEL_CONFIRM_PATTERN = /^(no|nope|not now|cancel|never mind|forget it|don'?t|stop|skip it|scratch that|no thanks|not right now|don't do it|don't create it)\b/i
// Sprint 912.7: strong-intent confirmation words that unambiguously mean "confirm an action".
// These are caught when nothing is pending to give DONNA a helpful "nothing to confirm" reply.
// Generic words (yes/ok/sure) are intentionally excluded — too ambiguous.
const STRONG_CONFIRM_PATTERN = /^(do it|confirm|confirmed|create it|make it|create the draft|make the draft|go ahead and create|yes please create|absolutely create)\b/i

// Sprint 912.8: narrow drill creation pattern — "add a drill", "create a drill".
// Fires before the broad curriculum draft proposal to intercept specific drill requests
// that have enough info for a real createCurriculumContentItemDraft() call.
const DRILL_CREATION_PATTERN = /\b(add|create)\b.{0,30}\bdrill\b/i

// Sprint 912.9: vague/non-answer detector for slot-fill follow-ups.
// When director answers a clarifying question with one of these, DONNA asks again.
const VAGUE_ANSWER_PATTERN = /^(i don'?t know|not sure|idk|hmm+|uh+|um+|what|huh|whatever|anything|something|doesn'?t matter|no idea|any|either|both)$/i

// Sprint 912.11: narrow gate and skill creation patterns — fire before the broad
// tryAnswerCurriculumDraftProposal to route complete gate/skill requests through
// the same confirmation → create → review flow used by drills.
const GATE_CREATION_PATTERN = /\b(add|create)\b.{0,40}\b(assessment\s+gate|gate)\b/i
const SKILL_CREATION_PATTERN = /\b(add|create)\b.{0,30}\bskill\b/i

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaVoiceReadyShellProps {
  role: DonnaAssistantRole
  donnaRole: DonnaRole
  directorCtx: DirectorDonnaContext | null
  coachCtx: CoachDonnaContext | null
  className?: string
}

// ── Helper to map DonnaAssistantRole → DonnaRole ──────────────────────────────

function toPlainRole(role: DonnaAssistantRole): DonnaRole {
  return role === 'director' ? 'director' : 'coach'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaVoiceReadyShell({
  role,
  donnaRole,
  directorCtx,
  coachCtx,
  className = '',
}: DonnaVoiceReadyShellProps) {
  const plainRole = toPlainRole(role)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  // Sprint 751 — track TTS speaking state so the UI shows a "Speaking…" indicator
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Sprint 912.3 — executing state for draft creation
  const [isExecuting, setIsExecuting] = useState(false)
  const voice = useVoiceDictation()
  const pendingVoiceRef = useRef<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Sprint 912.3 — DONNA Conversation Mode state
  const conv = useDonnaConversationMode()

  // Sprint 912.3 — Derive unified god mode state from all sources
  const godModeState = computeGodModeState({
    conversationMode: conv.conversationMode,
    isPaused: conv.isPaused,
    pendingConfirmation: conv.pendingConfirmation,
    isAutoListening: conv.isAutoListening,
    isSpeaking,
    isTyping,
    isExecuting,
    voiceIsListening: voice.status === 'listening' || voice.status === 'processing',
  })

  const godModeLabel = getGodModeStateLabel(godModeState)

  // Sprint 731: TTS auto-speak tracking
  const lastVoiceInputAt = useRef<number>(0)
  const lastSpokenIdRef = useRef<string | null>(null)
  // Sprint 912.4: auto-listen timer ref for cleanup
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Sprint 912.4: ref so TTS callback can access latest conversationMode/isPaused/pendingConfirmation
  const convRef = useRef(conv)
  convRef.current = conv
  // Sprint 912.6: page-aware greeting — track previous pathname and conv mode state
  const prevPathRef = useRef<string | null>(null)
  const prevConvModeRef = useRef(false)
  // Sprint 914.3: persisted session ID (null until server-side session is created)
  const sessionIdRef = useRef<string | null>(null)
  // Sprint 914.3: tracks last donna message ID persisted to avoid double-writes
  const lastPersistedDonnaIdRef = useRef<string | null>(null)
  // Sprint 914.4: stores the most recently assembled context packet summary
  const lastContextPacketRef = useRef<ContextPacketSummary | null>(null)

  // Initialize session
  useEffect(() => {
    ensureChatSession(donnaRole)
  }, [donnaRole])

  // Sprint 914.3: Initialize backend spine session on mount (fire-and-forget).
  // Failure is non-fatal — DONNA continues using in-process memory.
  useEffect(() => {
    if (role !== 'director') return
    getOrCreateDonnaSession({
      activePage:     pathname ?? '/director/donna',
      activeWorkflow: null,
      title:          null,
    })
      .then(result => {
        if (result.ok) sessionIdRef.current = result.data.sessionId
      })
      .catch(() => { /* non-fatal — in-process memory continues */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnaRole])

  // Sprint 914.3: Persist latest DONNA response to backend spine (fire-and-forget).
  // Watches messages array; persists only new donna messages not yet persisted.
  useEffect(() => {
    const sId = sessionIdRef.current
    if (!sId) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'donna') return
    if (lastMsg.id === lastPersistedDonnaIdRef.current) return
    lastPersistedDonnaIdRef.current = lastMsg.id
    persistDonnaMessage({
      sessionId:   sId,
      role:        'donna',
      messageText: lastMsg.text ?? '',
      messageKind: 'text',
      source:      lastMsg.sourceNote ?? null,
      confidence:  lastMsg.confidence ?? null,
      pagePath:    pathname ?? null,
    }).catch(() => { /* non-fatal */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Sprint 912.7: restore non-stale pending action from session memory on mount.
  // Runs when donnaRole changes (component remounts after route change).
  // Skips if a pending confirmation is already set in conv state.
  useEffect(() => {
    if (conv.pendingConfirmation) return
    const stored = getPendingAction()
    if (!stored) return
    const age = Date.now() - stored.storedAt
    if (age > SESSION_PENDING_ACTION_TTL_MS) {
      clearPendingAction()
      return
    }
    conv.setPendingConfirmation({
      actionType: stored.actionType,
      description: stored.description,
      execute: stored.execute,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnaRole])

  // Sprint 912.15: on remount, if a slot-fill is waiting for an answer, show a reminder.
  // Fires when donnaRole changes (component remounts after route change).
  // Uses getContentLabel from module scope — safe because function declarations are hoisted.
  useEffect(() => {
    if (role !== 'director') return
    const slotFill = getPendingDrillSlotFill()
    if (!slotFill) return
    const age = Date.now() - slotFill.storedAt
    if (age > SESSION_PENDING_ACTION_TTL_MS) {
      clearPendingDrillSlotFill()
      return
    }
    const contentLbl = getContentLabel(slotFill.kind)
    const question = slotFill.missingSlot === 'levelName'
      ? `Which curriculum level should this ${contentLbl} go in? (e.g., Orange 2, Yellow 1, Red 3)`
      : `What should the ${contentLbl} focus on? (e.g., forehand prep, serve mechanics, footwork)`
    const reminderMsg: ChatMessage = {
      id: `donna-slotfill-reminder-${Date.now()}`,
      role: 'donna',
      kind: 'text',
      text: `Still waiting for your answer — ${question}`,
      timestamp: new Date().toISOString(),
      confidence: 'high',
      sourceNote: null,
    }
    setMessages(prev => [...prev, reminderMsg])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnaRole])

  // Sprint 912.4: cleanup auto-listen timer on unmount
  useEffect(() => {
    return () => {
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current)
    }
  }, [])

  // Sprint 912.6: greet director when conversation mode activates or page changes while active
  useEffect(() => {
    if (role !== 'director') return
    const currentPath = pathname ?? '/director'
    if (!conv.conversationMode) {
      prevConvModeRef.current = false
      prevPathRef.current = null
      return
    }
    const justActivated = !prevConvModeRef.current
    const pageChanged = prevConvModeRef.current && prevPathRef.current !== null && prevPathRef.current !== currentPath
    prevConvModeRef.current = true
    prevPathRef.current = currentPath
    if (conv.isPaused || (!justActivated && !pageChanged)) return
    const cap = getPageCapabilityMap(currentPath)
    const greeting = `You're on ${cap.pageLabel}. ${cap.directorIntent} What would you like to do?`
    const pageMsg: ChatMessage = {
      id: `donna-page-${Date.now()}`,
      role: 'donna',
      kind: 'text',
      text: greeting,
      timestamp: new Date().toISOString(),
      confidence: 'high',
      sourceNote: `Page context: ${cap.pageLabel}`,
    }
    setMessages(prev => [...prev, pageMsg])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.conversationMode, conv.isPaused, pathname, role])

  // Sprint 912.4: auto-listen loop helper — called after TTS 'done' when conversation mode is on
  function scheduleAutoListen() {
    const c = convRef.current
    if (!c.conversationMode || c.isPaused || c.pendingConfirmation) return
    if (c.noSpeechCount >= MAX_NO_SPEECH_RETRIES) {
      c.pauseConversation()
      return
    }
    c.beginAutoListen()
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current)
    autoListenTimerRef.current = setTimeout(() => {
      c.endAutoListen()
      pendingVoiceRef.current = null
      voice.reset()
      voice.start()
    }, 400) // brief pause so director knows DONNA finished before mic opens
  }

  // Sprint 731: Auto-speak DONNA responses that follow a voice input (30-second window)
  // Sprint 912.4: After TTS done, trigger auto-listen loop if conversation mode on
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'donna' || !lastMsg.text) return
    if (lastMsg.id === lastSpokenIdRef.current) return  // already spoken
    const msSinceVoice = Date.now() - lastVoiceInputAt.current
    const c = convRef.current
    // Sprint 912.4: in conversation mode, always speak DONNA's response; otherwise use 30-sec window
    const shouldSpeak = c.conversationMode || msSinceVoice <= 30_000
    if (!shouldSpeak) return
    lastSpokenIdRef.current = lastMsg.id
    setIsSpeaking(true)
    void speakWithServerTts(stripMarkdownForTts(lastMsg.text), (status) => {
      if (status === 'done' || status === 'error') {
        setIsSpeaking(false)
        // Sprint 912.4: after speaking, restart mic if conversation mode on
        if (status === 'done') {
          scheduleAutoListen()
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Auto-send when voice transcript completes
  // Sprint 912.4: reset no-speech counter when a real transcript arrives
  useEffect(() => {
    if (voice.status === 'idle' && voice.transcript.trim()) {
      if (pendingVoiceRef.current !== voice.transcript) {
        pendingVoiceRef.current = voice.transcript
        lastVoiceInputAt.current = Date.now()  // Sprint 731: mark voice input timestamp
        convRef.current.resetNoSpeechCount()   // Sprint 912.4: real speech received
        handleSend(voice.transcript)
        voice.reset()
      }
    }
    // Sprint 912.4: no-speech error in conversation mode — increment counter and retry
    if (voice.status === 'error' && voice.error === 'no_speech') {
      const c = convRef.current
      if (c.conversationMode && !c.isPaused && !c.pendingConfirmation) {
        const count = c.incrementNoSpeech()
        if (count < MAX_NO_SPEECH_RETRIES) {
          scheduleAutoListen()
        } else {
          c.pauseConversation()
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.status, voice.transcript, voice.error])

  // Build quick action chips from suggested questions
  const suggestedQuestions = getSuggestedQuestionsForRole(
    plainRole,
    directorCtx,
    coachCtx,
    4,
  )

  const quickActions: ChatQuickAction[] = suggestedQuestions.map(q => ({
    id: q.id,
    label: q.text,
  }))

  // ── Sprint 912.7: Dual-store pending confirmation ──────────────────────────
  // Sets the confirmation in both conv state (immediate UI) and session memory
  // (survives route changes). Intent handlers in future sprints call this instead
  // of calling conv.setPendingConfirmation directly.

  function storeAndSetPendingConfirmation(action: DonnaPendingConfirmation) {
    conv.setPendingConfirmation(action)
    setPendingAction({
      actionType: action.actionType,
      description: action.description,
      execute: action.execute,
    })
    // Sprint 914.4: persist safe (non-executable) action summary to working memory
    const sId = sessionIdRef.current
    if (sId) {
      upsertDonnaMemory({
        sessionId: sId,
        memoryKey: 'pending_action_summary',
        memoryValue: { actionType: action.actionType, description: action.description, storedAt: Date.now() },
        scope: 'workflow',
      }).catch(() => {})
    }
  }

  // ── Sprint 912.11: Shared curriculum content confirmation trigger ────────────
  // Generalised form of triggerDrillConfirmation for drill, assessment gate, skill.
  // Clears any pending slot-fill, sets pendingConfirmation, appends summary message.
  // Called by the single-turn and multi-turn slot-fill paths for all content types.

  function triggerCurriculumContentConfirmation({
    contentType,
    contentLabel,
    levelName,
    focusArea,
    rawInput,
  }: {
    contentType: CurriculumContentType
    contentLabel: string
    levelName: string
    focusArea: string
    rawInput: string
  }) {
    // Sprint 912.15: store context so follow-ups ("same for Orange 3", "change focus to X") resolve correctly
    setLastCurriculumDraftAttempt({ levelName, focusArea, contentLabel, contentType })
    // Sprint 914.3: persist safe (non-executable) summary to backend working memory
    const sId = sessionIdRef.current
    if (sId) {
      upsertDonnaMemory({
        sessionId:   sId,
        memoryKey:   'last_curriculum_draft',
        memoryValue: { levelName, focusArea, contentLabel, contentType, storedAt: Date.now() },
        scope:       'workflow',
      }).catch(() => { /* non-fatal */ })
    }
    clearPendingDrillSlotFill()
    const summaryText = buildContentConfirmationSummaryText(contentLabel, levelName, focusArea)
    const summaryMsg: ChatMessage = {
      id: `donna-content-confirm-${Date.now()}`,
      role: 'donna',
      kind: 'text',
      text: summaryText,
      timestamp: new Date().toISOString(),
      confidence: 'high',
      sourceNote: `DONNA ${contentLabel} draft proposal`,
    }
    storeAndSetPendingConfirmation({
      actionType: `curriculum_${contentType}_draft`,
      description: `Add a "${focusArea}" ${contentLabel} to ${levelName} curriculum`,
      execute: async () => {
        const result = await createCurriculumContentItemDraft({
          levelName,
          contentType,
          title: `${focusArea} ${contentLabel}`,
          description: `A ${contentLabel} focused on ${focusArea} for ${levelName} players.`,
          source: 'voice',
          rawInput,
          overrideReason: `DONNA voice draft: ${rawInput}`,
        })
        if (result.ok) {
          // Sprint 912.13: include live pending count so director knows their queue state.
          const n = result.pendingDraftCount
          const reviewNote = n > 1
            ? ` You now have ${n} curriculum drafts waiting in the Review Center.`
            : ` Nothing in the curriculum changes until you approve it.`
          return { ok: true, message: `"${focusArea}" ${contentLabel} draft created for ${levelName}.${reviewNote}` }
        }
        return { ok: false, message: result.error }
      },
    })
    setTimeout(() => {
      setMessages(prev => [...prev, summaryMsg])
      setIsTyping(false)
      recordTurn(rawInput, summaryText, {
        actionId: `curriculum_${contentType}_draft_pending`,
        domain: 'curriculum',
        confidence: 'high',
        sourceNote: `DONNA ${contentLabel} draft proposal`,
      })
    }, 600)
  }

  // ── Sprint 912.9: Drill confirmation trigger ────────────────────────────────
  // Shared by the single-turn 912.8 path and the multi-turn slot-fill 912.9 path.
  // Sprint 912.11: now delegates to triggerCurriculumContentConfirmation.

  function triggerDrillConfirmation(levelName: string, focusArea: string, rawInput: string) {
    triggerCurriculumContentConfirmation({ contentType: 'drill', contentLabel: 'drill', levelName, focusArea, rawInput })
  }

  // ── Send handler ────────────────────────────────────────────────────────────

  // Sprint 914.4: wrapper around setPendingDrillSlotFill that also persists a safe
  // POJO summary to donna_working_memory. Replaces all direct setPendingDrillSlotFill calls.
  // Never serializes execute() functions — only safe plain-JSON fields.
  function setPendingSlotFillWithPersist(fill: Omit<import('@/lib/donna/donnaChatSessionMemory').PendingDrillSlotFill, 'storedAt'>) {
    setPendingDrillSlotFill(fill)
    const sId = sessionIdRef.current
    if (sId) {
      upsertDonnaMemory({
        sessionId:   sId,
        memoryKey:   'pending_slot_fill',
        memoryValue: { kind: fill.kind, levelName: fill.levelName, focusArea: fill.focusArea, missingSlot: fill.missingSlot, rawInput: fill.rawInput, storedAt: Date.now() },
        scope:       'workflow',
      }).catch(() => {})
    }
  }

  // Sprint 914.3: recall pattern — "what did we discuss last time?"
  const RECALL_PATTERN = /\b(what did we (discuss|talk about|say)|recap (our|this|the) (donna )?(conversation|chat|session)|what were we (talking|discussing)|what have we (discussed|talked about))\b/i

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = buildUserChatMessage(trimmed)
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Sprint 914.3: persist user message to backend spine (fire-and-forget)
    const sId = sessionIdRef.current
    if (sId) {
      persistDonnaMessage({
        sessionId:   sId,
        role:        'user',
        messageText: trimmed,
        messageKind: 'text',
        pagePath:    pathname ?? null,
      }).catch(() => { /* non-fatal */ })
    }

    // Sprint 914.3: recall intercept — must check for sessionId
    if (plainRole === 'director' && RECALL_PATTERN.test(trimmed) && sId) {
      recallRecentDonnaMessages({ sessionId: sId, limit: 10 })
        .then(result => {
          let recallText: string
          if (!result.ok || result.data.length === 0) {
            recallText = "I don't have a saved conversation history for this session yet — this may be your first interaction or the session was recently started. I can continue from here."
          } else {
            const userTurns = result.data
              .filter(m => m.role === 'user')
              .slice(-3)
              .reverse()
            if (userTurns.length === 0) {
              recallText = "I found recent messages in this session, but no user turns yet."
            } else {
              const topics = userTurns.map((m, i) => `${i + 1}. "${m.messageText.length > 60 ? m.messageText.slice(0, 57) + '...' : m.messageText}"`).join('\n')
              recallText = `Recent conversation topics from this session:\n\n${topics}\n\nLet me know where you'd like to continue.`
            }
          }
          const recallMsg: ChatMessage = {
            id: `donna-recall-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: recallText,
            timestamp: new Date().toISOString(),
            confidence: 'high',
            sourceNote: 'Persisted conversation history',
          }
          setMessages(prev => [...prev, recallMsg])
          setIsTyping(false)
          recordTurn(trimmed, recallText, { domain: 'general', confidence: 'high' })
        })
        .catch(() => {
          const fallbackMsg: ChatMessage = {
            id: `donna-recall-fallback-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: "I wasn't able to retrieve the conversation history right now. You can continue our conversation from here.",
            timestamp: new Date().toISOString(),
            confidence: 'partial',
            sourceNote: null,
          }
          setMessages(prev => [...prev, fallbackMsg])
          setIsTyping(false)
        })
      return
    }

    // Sprint 914.4: context debug command — "what context do you have?"
    const CONTEXT_DEBUG_PATTERN = /\b(what context do you have|what do you know about this conversation|what are you using for context|what context are you working with)\b/i
    if (plainRole === 'director' && CONTEXT_DEBUG_PATTERN.test(trimmed)) {
      const pkt = lastContextPacketRef.current
      let ctxText: string
      if (!pkt) {
        const sIdDebug = sessionIdRef.current
        ctxText = `Current session: ${sIdDebug ? 'active' : 'not initialized'}. Page: ${pathname ?? 'unknown'}. Director context: ${directorCtx ? 'loaded' : 'loading'}. I'm assembling a context packet for each message — it will be available from the next turn.`
      } else {
        const memKeys = pkt.workingMemoryKeys.length > 0 ? pkt.workingMemoryKeys.join(', ') : 'none'
        ctxText = [
          `Here is my current context for this conversation:`,
          `• Page: ${pkt.activePage ?? pathname ?? 'unknown'}`,
          `• Recent saved turns: ${pkt.recentConversationCount}`,
          `• Working memory keys: ${memKeys}`,
          `• Director operating context: ${pkt.hasDirectorContext ? 'loaded' : 'not loaded'}`,
          `• Session: active`,
          ``,
          `I am not yet using this context packet to route answers — that comes in the next sprint. But it is being assembled for every director message.`,
        ].join('\n')
      }
      const ctxMsg: ChatMessage = {
        id: `donna-ctx-debug-${Date.now()}`,
        role: 'donna',
        kind: 'text',
        text: ctxText,
        timestamp: new Date().toISOString(),
        confidence: 'high',
        sourceNote: 'Context packet summary',
      }
      setTimeout(() => {
        setMessages(prev => [...prev, ctxMsg])
        setIsTyping(false)
        recordTurn(trimmed, ctxText, { domain: 'general', confidence: 'high' })
      }, 300)
      return
    }

    // Sprint 914.4: build context packet (fire-and-forget) — stored for next use
    const sIdPkt = sessionIdRef.current
    if (sIdPkt && role === 'director') {
      buildDonnaContextPacketForSession({
        sessionId:      sIdPkt,
        userMessage:    trimmed,
        activePage:     pathname ?? null,
        directorContext: directorCtx,
      })
        .then(result => {
          if (result.ok) lastContextPacketRef.current = result.data
        })
        .catch(() => { /* non-fatal */ })
    }

    // ── Sprint 912.3 / 912.7: Pending confirmation intercept ─────────────────
    // Resolve activePending from conv state first; fall back to session memory
    // so confirmation survives route changes. Stale actions are discarded.
    let activePending: DonnaPendingConfirmation | null = conv.pendingConfirmation

    if (!activePending) {
      const stored = getPendingAction()
      if (stored) {
        const age = Date.now() - stored.storedAt
        if (age > SESSION_PENDING_ACTION_TTL_MS) {
          // Stale — discard silently; DONNA only responds if user explicitly confirms
          clearPendingAction()
          if (STRONG_CONFIRM_PATTERN.test(trimmed)) {
            setIsTyping(false)
            const staleMsg: ChatMessage = {
              id: `donna-stale-${Date.now()}`,
              role: 'donna',
              kind: 'text',
              text: "My previous request timed out. Please restate what you'd like me to do.",
              timestamp: new Date().toISOString(),
              confidence: 'high',
              sourceNote: null,
            }
            setMessages(prev => [...prev, staleMsg])
            recordTurn(trimmed, staleMsg.text, { confidence: 'high' })
            return
          }
        } else {
          // Restore into conv state for this turn
          activePending = {
            actionType: stored.actionType,
            description: stored.description,
            execute: stored.execute,
          }
          conv.setPendingConfirmation(activePending)
        }
      }
    }

    if (activePending) {
      if (CONFIRM_PATTERN.test(trimmed)) {
        conv.clearPendingConfirmation()
        clearPendingAction()   // Sprint 912.7: clear session memory too
        // Sprint 914.4: mark pending action as confirmed in working memory
        const sIdConfirm = sessionIdRef.current
        if (sIdConfirm) upsertDonnaMemory({ sessionId: sIdConfirm, memoryKey: 'pending_action_summary', memoryValue: { status: 'confirmed', clearedAt: new Date().toISOString() }, scope: 'workflow' }).catch(() => {})
        setIsTyping(false)
        setIsExecuting(true)
        const confirmingMsg: ChatMessage = {
          id: `donna-confirming-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: 'Creating the draft now…',
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setMessages(prev => [...prev, confirmingMsg])
        void activePending.execute().then(result => {
          setIsExecuting(false)
          const resultMsg: ChatMessage = {
            id: `donna-result-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: result.ok
              ? result.message
              : `Something went wrong: ${result.message}. Please try again.`,
            timestamp: new Date().toISOString(),
            confidence: result.ok ? 'high' : 'partial',
            sourceNote: result.ok ? 'Draft created' : 'Action failed',
            followUp: result.ok ? 'Take me to Review Center' : null,
            followUpHref: result.ok ? '/director/curriculum/builder' : undefined,
          }
          setMessages(prev => [...prev, resultMsg])
          recordTurn(trimmed, resultMsg.text, {
            actionId: result.ok ? 'curriculum_draft_created' : 'curriculum_draft_failed',
            confidence: result.ok ? 'high' : 'partial',
          })
          // Sprint 912.12: soft-refresh the current route so the curriculum builder
          // change queue (CurriculumBuilderChangeQueue) reflects the new draft without
          // requiring manual navigation. revalidatePath() in the server action has
          // already invalidated the server cache; router.refresh() flushes the client
          // cache. Only fires on success — never on failure, never causes duplicate drafts.
          if (result.ok) router.refresh()
        })
        return
      }
      if (CANCEL_CONFIRM_PATTERN.test(trimmed)) {
        conv.clearPendingConfirmation()
        clearPendingAction()   // Sprint 912.7: clear session memory too
        // Sprint 914.4: mark pending action as cancelled in working memory
        const sIdCancel = sessionIdRef.current
        if (sIdCancel) upsertDonnaMemory({ sessionId: sIdCancel, memoryKey: 'pending_action_summary', memoryValue: { status: 'cancelled', clearedAt: new Date().toISOString() }, scope: 'workflow' }).catch(() => {})
        setIsTyping(false)
        const cancelMsg: ChatMessage = {
          id: `donna-cancel-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: "Cancelled. Nothing was created. What would you like to do instead?",
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setMessages(prev => [...prev, cancelMsg])
        recordTurn(trimmed, cancelMsg.text, { confidence: 'high' })
        return
      }
      // Neither yes nor no — re-state the confirmation and keep waiting
      setIsTyping(false)
      const repeatMsg: ChatMessage = {
        id: `donna-repeat-confirm-${Date.now()}`,
        role: 'donna',
        kind: 'text',
        text: `Just to confirm — ${activePending.description}. Say "yes" to create the draft, or "no" to cancel.`,
        timestamp: new Date().toISOString(),
        confidence: 'high',
        sourceNote: null,
      }
      setMessages(prev => [...prev, repeatMsg])
      return
    }

    // Sprint 912.7: orphaned strong-confirm guard — fires when nothing is pending
    // but director says "do it" / "confirm" / "create it" (unambiguous intent words).
    // Generic words (yes/ok/sure) are intentionally excluded — too ambiguous.
    if (STRONG_CONFIRM_PATTERN.test(trimmed)) {
      setIsTyping(false)
      const noPendingMsg: ChatMessage = {
        id: `donna-no-pending-${Date.now()}`,
        role: 'donna',
        kind: 'text',
        text: "I don't have anything waiting for your confirmation. What would you like me to do?",
        timestamp: new Date().toISOString(),
        confidence: 'high',
        sourceNote: null,
      }
      setMessages(prev => [...prev, noPendingMsg])
      recordTurn(trimmed, noPendingMsg.text, { confidence: 'high' })
      return
    }

    // ── Sprint 912.9: Drill slot-fill answer handler ──────────────────────────
    // Fires when a pending drill slot-fill is waiting for the director's answer.
    // Intercepts the next turn regardless of content — treats it as the missing slot.
    // Positioned after pending confirmation so a pending "yes" always wins.
    if (plainRole === 'director' && hasPendingDrillSlotFill()) {
      const slotFill = getPendingDrillSlotFill()!
      const slotAge = Date.now() - slotFill.storedAt

      if (slotAge > SESSION_PENDING_ACTION_TTL_MS) {
        // Stale — clear silently and let the message fall through to normal routing
        clearPendingDrillSlotFill()
      } else if (CANCEL_CONFIRM_PATTERN.test(trimmed)) {
        // Director cancelled — clear and acknowledge
        clearPendingDrillSlotFill()
        setIsTyping(false)
        const contentLabelForCancel = getContentLabel(slotFill.kind)
        const cancelMsg: ChatMessage = {
          id: `donna-slotfill-cancel-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: `No problem — the ${contentLabelForCancel} draft has been cancelled. Let me know if you'd like to try again.`,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setMessages(prev => [...prev, cancelMsg])
        recordTurn(trimmed, cancelMsg.text, { domain: 'curriculum', confidence: 'high' })
        return
      } else if (slotFill.missingSlot === 'levelName') {
        // Director is answering the "Which level?" question
        const level = extractTargetLevel(trimmed)
        if (!level) {
          // Still can't resolve — ask again with examples
          setIsTyping(false)
          const askAgainMsg: ChatMessage = {
            id: `donna-ask-level-again-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: "I didn't catch that level. Try something like: Orange 2, Yellow 1, or Red 3.",
            timestamp: new Date().toISOString(),
            confidence: 'high',
            sourceNote: null,
          }
          setMessages(prev => [...prev, askAgainMsg])
          recordTurn(trimmed, askAgainMsg.text, { domain: 'curriculum', confidence: 'high' })
          return
        }
        // Level resolved
        const focusArea = slotFill.focusArea
        const slotKind = slotFill.kind
        clearPendingDrillSlotFill()
        if (!focusArea) {
          // Still need focus — store updated partial and ask
          const contentLbl = getContentLabel(slotKind)
          setPendingSlotFillWithPersist({
            kind: slotKind,
            levelName: level,
            focusArea: null,
            missingSlot: 'focusArea',
            rawInput: slotFill.rawInput,
          })
          setIsTyping(false)
          const askFocusMsg: ChatMessage = {
            id: `donna-ask-focus-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: `Got it — a new ${contentLbl} for ${level}. What should the ${contentLbl} focus on? (e.g., forehand prep, serve mechanics, footwork)`,
            timestamp: new Date().toISOString(),
            confidence: 'high',
            sourceNote: null,
          }
          setMessages(prev => [...prev, askFocusMsg])
          recordTurn(trimmed, askFocusMsg.text, { domain: 'curriculum', confidence: 'high' })
          return
        }
        // Both present — go to confirmation
        triggerCurriculumContentConfirmation({
          contentType: getContentTypeFromKind(slotKind),
          contentLabel: getContentLabel(slotKind),
          levelName: level,
          focusArea,
          rawInput: slotFill.rawInput,
        })
        return
      } else if (slotFill.missingSlot === 'focusArea') {
        // Director is answering the "What should the [content] focus on?" question.
        // Try structured extraction first; fall back to using the whole answer.
        // Sprint 912.11: trim trailing punctuation from the fallback path.
        // Sprint 912.15: also handle "change focus to X" / "use X instead" change-intent
        // answers so "change the focus to footwork" extracts "footwork" not the whole phrase.
        let focus = extractFocusArea(trimmed)
        if (!focus) {
          const m = trimmed.match(/\b(?:to|use|focus\s+on)\s+([a-zA-Z][^,.\n!?]{2,80})[.!?,;:]?$/i)
          if (m) {
            const candidate = m[1].trim().replace(/\s+instead\s*$/i, '').replace(/[.!?,;:]+$/, '').trim()
            if (candidate.length >= 3 && !VAGUE_ANSWER_PATTERN.test(candidate)) focus = candidate
          }
        }
        if (!focus) {
          const cleaned = trimmed.trim().replace(/[.!?,;:]+$/, '')
          if (cleaned.length >= 3 && cleaned.length <= 80 && !VAGUE_ANSWER_PATTERN.test(cleaned)) {
            focus = cleaned
          }
        }
        if (!focus) {
          // Still too vague — ask again with examples
          setIsTyping(false)
          const contentLbl = getContentLabel(slotFill.kind)
          const askAgainMsg: ChatMessage = {
            id: `donna-ask-focus-again-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: `What should the ${contentLbl} focus on? For example: forehand prep, serve mechanics, or footwork.`,
            timestamp: new Date().toISOString(),
            confidence: 'high',
            sourceNote: null,
          }
          setMessages(prev => [...prev, askAgainMsg])
          recordTurn(trimmed, askAgainMsg.text, { domain: 'curriculum', confidence: 'high' })
          return
        }
        // Focus resolved — both slots now filled
        const level = slotFill.levelName!
        const slotKind = slotFill.kind
        clearPendingDrillSlotFill()
        triggerCurriculumContentConfirmation({
          contentType: getContentTypeFromKind(slotKind),
          contentLabel: getContentLabel(slotKind),
          levelName: level,
          focusArea: focus,
          rawInput: slotFill.rawInput,
        })
        return
      }
    }

    // ── Sprint 724: Yes/No navigation confirmation ───────────────────────────
    // Check BEFORE boundary detection so "yes"/"no" isn't mis-classified.
    const pendingOffer = consumePendingNavOffer()
    if (pendingOffer) {
      if (YES_PATTERN.test(trimmed)) {
        const confirmMsg: ChatMessage = {
          id: `donna-nav-confirm-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: `Taking you to ${pendingOffer.label} now.`,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, confirmMsg])
          setIsTyping(false)
          recordTurn(trimmed, confirmMsg.text, { actionId: 'navigate', confidence: 'high' })
          // Sprint 848: set focus target before navigation so the destination page can highlight.
          // buildFocusTargetForRoute handles both static routes (FOCUS_TARGET_MAP) and dynamic
          // player profile routes (/director/players/<uuid>) via Sprint 841 prefix fallback.
          const navFocusTarget = buildFocusTargetForRoute(pendingOffer.href, pendingOffer.questionContext)
          if (navFocusTarget) setDonnaFocusTarget(navFocusTarget)
          // Brief delay so the user sees DONNA's message before page changes
          setTimeout(() => router.push(pendingOffer.href), 500)
        }, 300)
        return
      }
      if (NO_PATTERN.test(trimmed)) {
        const declineMsg: ChatMessage = {
          id: `donna-nav-decline-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: "No problem. Let me know if you need anything else.",
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, declineMsg])
          setIsTyping(false)
          recordTurn(trimmed, declineMsg.text, { actionId: 'nav_declined', confidence: 'high' })
        }, 300)
        return
      }
      // User said something other than yes/no — let the prompt fall through normally
    }

    // ── Boundary check ───────────────────────────────────────────────────────
    const boundary = checkQuestionBoundary(trimmed, plainRole)
    if (boundary) {
      const boundaryMsg = buildBoundaryMessage(boundary)
      setMessages(prev => [...prev, boundaryMsg])
      setIsTyping(false)
      recordTurn(trimmed, boundaryMsg.text, { confidence: boundary.confidenceKind })
      return
    }

    // ── Sprint 912.19: Review Queue Intelligence intercept ───────────────────
    // Fires BEFORE the page guide so review-queue questions always get a
    // data-driven answer (from directorCtx) rather than a page-contextual one.
    // Requires directorCtx — falls through if null (handled by later interceptors).
    if (plainRole === 'director' && directorCtx && detectReviewQueueQuestion(trimmed)) {
      const rqAnswer = buildReviewQueueAnswer(directorCtx)
      const rqMsg: ChatMessage = {
        id: `donna-review-queue-${Date.now()}`,
        role: 'donna',
        kind: 'text',
        text: rqAnswer.text,
        timestamp: new Date().toISOString(),
        confidence: rqAnswer.confidence,
        sourceNote: rqAnswer.sourceNote,
        followUp: rqAnswer.followUp,
        followUpHref: rqAnswer.href ?? undefined,
      }
      setTimeout(() => {
        setMessages(prev => [...prev, rqMsg])
        setIsTyping(false)
        recordTurn(trimmed, rqAnswer.text, {
          actionId: rqAnswer.actionId,
          domain: 'review_queue',
          confidence: rqAnswer.confidence,
          sourceNote: rqAnswer.sourceNote,
        })
        if (rqAnswer.href) {
          setPendingNavOffer({ href: rqAnswer.href, label: rqAnswer.followUp ?? 'Review Queue', questionContext: trimmed })
        }
      }, 500)
      return
    }

    // ── Sprint 912.14: Page guide intent routing ─────────────────────────────
    // Answers page-specific questions using donnaPageContextEngine helpers.
    // Uses pathname only — no directorCtx needed. Always resolves cleanly.
    // Fires BEFORE missing-context and KPI interceptors so page questions
    // always get page-specific answers rather than generic or data-dependent ones.
    if (plainRole === 'director') {
      const PAGE_WHERE_AM_I    = /\b(where am i|what page am i on|what.{0,10}this page|explain this page|which page is this|describe this page)\b/i
      const PAGE_WHAT_CAN_I_DO = /\b(what can i do here|what can you help (me with )?(here|on this page)|what.{0,15}options (here|on this page)|what.{0,15}do (here|on this page))\b/i
      const PAGE_NEXT_STEP     = /\b(what should i do (here|on this page)|what.{0,10}most important (task|thing) here|what.{0,10}best (next )?step (here|on this page)|where (should i |do i )start here)\b/i
      const PAGE_APPROVAL      = /\b(what needs (approval|review|approving|reviewing)|what should i (review|approve)|what requires (my )?(approval|review))\b/i
      const PAGE_SAFETY        = /\b(what should i not do|what.{0,10}risky here|what.{0,10}careful with|what.{0,10}avoid (here|on this page)|what.{0,10}not (do|try) here)\b/i

      const currentPath = pathname ?? '/director'
      let pageGuideText: string | null = null

      if (PAGE_WHERE_AM_I.test(trimmed)) {
        pageGuideText = whereAmI(currentPath)
      } else if (PAGE_WHAT_CAN_I_DO.test(trimmed)) {
        pageGuideText = whatCanYouHelpWith(currentPath)
      } else if (PAGE_NEXT_STEP.test(trimmed)) {
        pageGuideText = whatIsTheBestNextStep(currentPath)
      } else if (PAGE_APPROVAL.test(trimmed)) {
        pageGuideText = whatActionsRequireApproval(currentPath)
      } else if (PAGE_SAFETY.test(trimmed)) {
        pageGuideText = whatShouldINotDo(currentPath)
      }

      if (pageGuideText) {
        const pageGuideCap = getPageCapabilityMap(currentPath)
        const pageGuideMsg: ChatMessage = {
          id: `donna-page-guide-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: pageGuideText,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: `Page context: ${pageGuideCap.pageLabel}`,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, pageGuideMsg])
          setIsTyping(false)
          recordTurn(trimmed, pageGuideText!, { domain: 'general', confidence: 'high', sourceNote: `Page: ${currentPath}` })
        }, 400)
        return
      }
    }

    // ── Sprint 725: Missing context intercept ────────────────────────────────
    // Fires BEFORE safe-read and KPI intercepts so onboarding/setup questions
    // always get a proper explanation + navigation offer, not a fallback.
    if (plainRole === 'director') {
      const missingCtx = detectMissingContext(trimmed, directorCtx)
      if (missingCtx) {
        const donnaMsg = buildChatMessageFromAnswer(missingCtx)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: missingCtx.actionId,
            confidence: missingCtx.confidence,
            sourceNote: missingCtx.sourceNote,
          })
          // Store nav offer so next user "yes" navigates
          if (missingCtx.navOffer) {
            setPendingNavOffer(missingCtx.navOffer)
          }
        }, 600)
        return
      }
    }

    // Sprint 912.13: when directorCtx is null and director asks a live-data question,
    // give an honest "data loading" message instead of falling silently through to
    // the generic fallback. Only fires for unambiguously data-dependent question patterns.
    if (plainRole === 'director' && !directorCtx) {
      const NEEDS_LIVE_CTX = /\b(kpi|metric|what.{0,10}first|what.{0,10}attention|who.{0,10}attention|advance.{0,20}player|how.{0,10}coaches?)\b/i
      if (NEEDS_LIVE_CTX.test(trimmed)) {
        const loadingMsg: ChatMessage = {
          id: `donna-ctx-loading-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: "Academy data is still loading. Give it a moment, then ask again — or ask me how any part of AcademyOS works while it loads.",
          timestamp: new Date().toISOString(),
          confidence: 'partial',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, loadingMsg])
          setIsTyping(false)
          recordTurn(trimmed, loadingMsg.text, { confidence: 'partial' })
        }, 400)
        return
      }
    }

    // Sprint 912.18: Onboarding Guide Mode intercept
    // Answers setup-progress questions not covered by detectMissingContext:
    // "Am I ready to launch?", "What is left in setup?", "What is this setup step?"
    // Fires AFTER detectMissingContext (which handles navigation offers + "walk me through")
    // and BEFORE dashboard priority. Works with or without directorCtx.
    if (plainRole === 'director') {
      const currentPathForOnboarding = pathname ?? '/director'
      if (detectOnboardingProgressQuestion(trimmed, currentPathForOnboarding)) {
        const onboardingAnswer = buildOnboardingProgressAnswer(directorCtx, currentPathForOnboarding)
        const onboardingMsg: ChatMessage = {
          id: `donna-onboarding-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: onboardingAnswer.text,
          timestamp: new Date().toISOString(),
          confidence: onboardingAnswer.confidence,
          sourceNote: onboardingAnswer.sourceNote,
          followUp: onboardingAnswer.followUp,
          followUpHref: onboardingAnswer.href ?? undefined,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, onboardingMsg])
          setIsTyping(false)
          recordTurn(trimmed, onboardingAnswer.text, {
            actionId: onboardingAnswer.actionId,
            domain: 'general',
            confidence: onboardingAnswer.confidence,
            sourceNote: onboardingAnswer.sourceNote,
          })
        }, 500)
        return
      }
    }

    // KPI question intercept — answer KPI questions from available director context
    if (plainRole === 'director' && directorCtx) {
      const kpiAnswer = tryAnswerKpiQuestion(trimmed, directorCtx)
      if (kpiAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(kpiAnswer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: kpiAnswer.actionId,
            confidence: kpiAnswer.confidence,
            sourceNote: kpiAnswer.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Dashboard priority intercept — answer "what should I do first?" style questions
    if (plainRole === 'director' && directorCtx) {
      const dashAnswer = tryAnswerDashboardPriorityQuestion(trimmed, directorCtx)
      if (dashAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(dashAnswer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: dashAnswer.actionId,
            confidence: dashAnswer.confidence,
            sourceNote: dashAnswer.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Sprint 742F: Recent decisions — "What happened last?", "What was approved?", "Can we undo X?"
    if (plainRole === 'director' && directorCtx && RECENT_DECISIONS_PATTERNS.test(trimmed)) {
      const rdAnswer = buildRecentDecisionsAnswer(directorCtx, trimmed)
      const rdNavOffer = buildNavOfferFromHref(rdAnswer.href, trimmed)
      setTimeout(() => {
        setMessages(prev => [...prev, buildChatMessageFromAnswer(rdAnswer)])
        setIsTyping(false)
        recordTurn(trimmed, rdAnswer.text, {
          actionId: rdAnswer.actionId,
          confidence: rdAnswer.confidence,
          sourceNote: rdAnswer.sourceNote,
        })
        if (rdNavOffer) setPendingNavOffer(rdNavOffer)
      }, 600)
      return
    }

    // Sprint 742G: Player progress stall detector — "Who is stalled?", "Player progress gaps?"
    if (plainRole === 'director' && directorCtx && PLAYER_PROGRESS_STALL_PATTERNS.test(trimmed)) {
      const stallAnswer = buildPlayerProgressStallAnswer(directorCtx)
      const stallNavOffer = buildNavOfferFromHref(stallAnswer.href, trimmed)
      setTimeout(() => {
        setMessages(prev => [...prev, buildChatMessageFromAnswer(stallAnswer)])
        setIsTyping(false)
        recordTurn(trimmed, stallAnswer.text, {
          actionId: stallAnswer.actionId,
          confidence: stallAnswer.confidence,
          sourceNote: stallAnswer.sourceNote,
        })
        if (stallNavOffer) setPendingNavOffer(stallNavOffer)
      }, 600)
      return
    }

    // Sprint 742G: Player action draft — "Advance player", "Propose level change for player"
    // Creates a voice_commands sentinel row and a proposed_actions row for director review.
    // DONNA never auto-approves — draft always lands in the Review Center.
    const PLAYER_ACTION_DRAFT_PATTERNS =
      /\b(advance (a |the |eligible )?players?|propose (a |the |an )?level (change|move|movement|advancement)|draft (an?|a) (player |level )?advancement|submit (an?|a) (player |level )?(advancement |promotion )?(proposal|draft)|create (an?|a) (player |level )?(advancement |promotion )?(proposal|draft)|propose (an?|a) (player )?advancement)\b/i

    if (plainRole === 'director' && directorCtx && PLAYER_ACTION_DRAFT_PATTERNS.test(trimmed)) {
      const eligibleCount = directorCtx.advancementEligibleCount
      const pendingMsg = `📋 Submitting a player advancement draft to your Review Center…`
      setMessages(prev => [...prev, buildUserChatMessage(trimmed)])
      setTimeout(async () => {
        if (eligibleCount === 0) {
          const noEligMsg = '🟡 No players are currently marked advancement-eligible. Assess players first before proposing advancement.'
          setMessages(prev => [...prev, buildChatMessageFromAnswer({
            actionId: 'player_action_draft_no_eligible',
            text: noEligMsg,
            confidence: 'high',
            sourceNote: 'Live player curriculum state',
            followUp: 'Take me to Players',
            href: '/director/players',
            isAnswerable: true,
          })])
          setIsTyping(false)
          recordTurn(trimmed, noEligMsg, { actionId: 'player_action_draft_no_eligible', confidence: 'high', sourceNote: 'Live player curriculum state' })
          return
        }

        // Show typing indicator while submitting
        setMessages(prev => [...prev, buildChatMessageFromAnswer({
          actionId: 'player_action_draft_submitting',
          text: pendingMsg,
          confidence: 'high',
          sourceNote: 'Submitting draft…',
          followUp: 'Review Center',
          href: '/director/review',
          isAnswerable: false,
        })])

        const result = await submitDonnaActionDraft({
          rawInput: trimmed,
          actionLabel: `Player advancement proposal — ${eligibleCount} eligible player${eligibleCount !== 1 ? 's' : ''} pending review`,
          targetModule: 'player_advancement_v1',
          proposedPayload: {
            intent: 'advance_player',
            eligiblePlayerCount: eligibleCount,
            requestedBy: 'donna_chat',
            sourcePrompt: trimmed,
          },
          riskLevel: 'medium',
        })

        const responseText = result.error
          ? `⚠️ Could not submit advancement draft: ${result.error}. Please go to the Review Center directly.`
          : [
              `✅ **Advancement proposal submitted to Review Center** (${eligibleCount} eligible player${eligibleCount !== 1 ? 's' : ''}).`,
              '',
              'Go to the Review Center to review each player, select who to advance, and approve the action.',
              'DONNA does not automatically approve — your decision is required.',
            ].join('\n')

        setMessages(prev => [
          ...prev.slice(0, -1), // Remove "submitting" message
          buildChatMessageFromAnswer({
            actionId: result.error ? 'player_action_draft_error' : 'player_action_draft_submitted',
            text: responseText,
            confidence: result.error ? 'partial' : 'high',
            sourceNote: result.error ? 'Action draft failed' : `Draft ID: ${result.actionId}`,
            followUp: 'Take me to Review Center',
            href: '/director/review',
            isAnswerable: true,
          }),
        ])
        setIsTyping(false)
        recordTurn(trimmed, responseText, {
          actionId: result.error ? 'player_action_draft_error' : 'player_action_draft_submitted',
          confidence: result.error ? 'partial' : 'high',
          sourceNote: result.error ? 'Action draft failed' : `Draft ID: ${result.actionId}`,
        })
        if (!result.error) setPendingNavOffer({ label: 'Review Center', href: '/director/review', questionContext: trimmed })
      }, 600)
      return
    }

    // Sprint 742E: Data quality guardian — "What's wrong?", "Academy health?", "Fix first?"
    if (plainRole === 'director' && directorCtx && DATA_QUALITY_PATTERNS.test(trimmed)) {
      const dqAnswer = buildDataQualityAnswer(directorCtx)
      const dqNavOffer = buildNavOfferFromHref(dqAnswer.href, trimmed)
      setTimeout(() => {
        setMessages(prev => [...prev, buildChatMessageFromAnswer(dqAnswer)])
        setIsTyping(false)
        recordTurn(trimmed, dqAnswer.text, {
          actionId: dqAnswer.actionId,
          confidence: dqAnswer.confidence,
          sourceNote: dqAnswer.sourceNote,
        })
        if (dqNavOffer) setPendingNavOffer(dqNavOffer)
      }, 600)
      return
    }

    // Roster attention intercept — "Who needs attention?" style questions
    if (plainRole === 'director' && directorCtx) {
      const rosterAnswer = tryAnswerRosterAttentionQuestion(trimmed, directorCtx)
      if (rosterAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(rosterAnswer)
        // Sprint 848: build nav offer for guided navigation with teal-glow highlight.
        // buildRosterNavOffer handles both static hrefs (via HREF_TO_LABEL) and dynamic
        // /director/players/<uuid> hrefs from Sprint 847, using the answer's followUp
        // text as label (e.g. "View Sarah's profile"). When the director says "yes",
        // the nav confirmation handler calls setDonnaFocusTarget before router.push.
        const rosterNavOffer = buildRosterNavOffer(rosterAnswer.href, rosterAnswer.followUp, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: rosterAnswer.actionId,
            confidence: rosterAnswer.confidence,
            sourceNote: rosterAnswer.sourceNote,
          })
          if (rosterNavOffer) setPendingNavOffer(rosterNavOffer)
        }, 600)
        return
      }
    }

    // Sprint 733: Coach health intercept ("how are my coaches doing?", etc.)
    if (plainRole === 'director') {
      const coachHealth = tryAnswerCoachHealthQuestion(trimmed, directorCtx)
      if (coachHealth) {
        const donnaMsg = buildChatMessageFromAnswer(coachHealth)
        const coachHealthNavOffer = buildNavOfferFromHref(coachHealth.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: coachHealth.actionId,
            confidence: coachHealth.confidence,
            sourceNote: coachHealth.sourceNote,
          })
          if (coachHealthNavOffer) setPendingNavOffer(coachHealthNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 912.15: Curriculum draft follow-up intercept ──────────────────
    // Handles "same for Orange 3" and "change the focus to footwork" by reading
    // recent draft context from session memory. Never bypasses confirmation.
    // Fires BEFORE drill/gate/skill handlers so follow-ups get continuity answers.
    if (plainRole === 'director') {
      const DRAFT_SAME_FOR     = /\b(same for|also for|do (that |it )?for|add (one |that )?for|create (one )?for)\b/i
      const DRAFT_CHANGE_FOCUS = /\b(change.{0,10}focus.{0,5}to|actually (use|focus\s+on)|use.{0,30}instead|change.{0,5}(the )?focus to)\b/i
      const recentDraft = getLastCurriculumDraftAttempt()

      if (recentDraft) {
        // Case A: "same for Orange 3" — reuse focus/content-type, swap level
        if (DRAFT_SAME_FOR.test(trimmed)) {
          const newLevel = extractTargetLevel(trimmed)
          if (newLevel) {
            triggerCurriculumContentConfirmation({
              contentType: recentDraft.contentType as CurriculumContentType,
              contentLabel: recentDraft.contentLabel,
              levelName: newLevel,
              focusArea: recentDraft.focusArea,
              rawInput: trimmed,
            })
            return
          }
        }
        // Case B: "change the focus to footwork" — keep level, swap focus
        if (DRAFT_CHANGE_FOCUS.test(trimmed)) {
          let newFocus = extractFocusArea(trimmed)
          if (!newFocus) {
            const m = trimmed.match(/\b(?:to|use|focus\s+on)\s+([a-zA-Z][^,.\n!?]{2,80})[.!?,;:]?$/i)
            if (m) newFocus = m[1].trim().replace(/\s+instead\s*$/i, '').replace(/[.!?,;:]+$/, '').trim()
          }
          if (newFocus && newFocus.length >= 3 && !VAGUE_ANSWER_PATTERN.test(newFocus)) {
            triggerCurriculumContentConfirmation({
              contentType: recentDraft.contentType as CurriculumContentType,
              contentLabel: recentDraft.contentLabel,
              levelName: recentDraft.levelName,
              focusArea: newFocus,
              rawInput: trimmed,
            })
            return
          }
        }
      }

      // Case C: "same for Orange 3" with no recent context — ask what to create
      if (!recentDraft && DRAFT_SAME_FOR.test(trimmed)) {
        const level = extractTargetLevel(trimmed)
        if (level) {
          const askMsg: ChatMessage = {
            id: `donna-followup-ask-${Date.now()}`,
            role: 'donna',
            kind: 'text',
            text: `What would you like to create for ${level}? I can add a drill, gate, or skill — just let me know.`,
            timestamp: new Date().toISOString(),
            confidence: 'high',
            sourceNote: null,
          }
          setTimeout(() => {
            setMessages(prev => [...prev, askMsg])
            setIsTyping(false)
            recordTurn(trimmed, askMsg.text, { domain: 'curriculum', confidence: 'high' })
          }, 400)
          return
        }
      }
    }

    // ── Sprint 912.8: Narrow drill draft confirmation flow ────────────────────
    // Handles "add a drill for [level] focused on [focus]" with a real draft action.
    // Fires BEFORE the broad tryAnswerCurriculumDraftProposal so specific drill
    // requests with enough info get the full confirmation → create → review path.
    // Broad requests (gates, skills, missions, etc.) fall through to the existing handler.
    if (plainRole === 'director' && DRILL_CREATION_PATTERN.test(trimmed)) {
      const targetLevel = extractTargetLevel(trimmed)
      const focusArea = extractFocusArea(trimmed)

      if (!targetLevel) {
        // Missing level — store partial slot-fill and ask
        setPendingSlotFillWithPersist({
          kind: 'curriculum_drill_draft',
          levelName: null,
          focusArea,
          missingSlot: 'levelName',
          rawInput: trimmed,
        })
        const askLevelMsg: ChatMessage = {
          id: `donna-ask-level-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: 'Which curriculum level should this drill go in? (e.g., Orange 2, Yellow 1, Red 3)',
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askLevelMsg])
          setIsTyping(false)
          recordTurn(trimmed, askLevelMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      if (!focusArea) {
        // Level known, focus area missing — store partial slot-fill and ask
        setPendingSlotFillWithPersist({
          kind: 'curriculum_drill_draft',
          levelName: targetLevel,
          focusArea: null,
          missingSlot: 'focusArea',
          rawInput: trimmed,
        })
        const askFocusMsg: ChatMessage = {
          id: `donna-ask-focus-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: `Got it — a new drill for ${targetLevel}. What should the drill focus on? (e.g., forehand prep, serve mechanics, footwork)`,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askFocusMsg])
          setIsTyping(false)
          recordTurn(trimmed, askFocusMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      // Both present — go straight to confirmation via shared helper
      triggerDrillConfirmation(targetLevel, focusArea, trimmed)
      return
    }

    // ── Sprint 912.11: Narrow gate draft confirmation flow ────────────────────
    // Handles "add a gate for [level] focused on [focus]" and "add an assessment
    // gate for [level] covering [focus]". Same confirmation → create → review
    // path used by drills. Gate slot-fill reuses the same PendingDrillSlotFill
    // infrastructure with kind: 'curriculum_gate_draft'.
    if (plainRole === 'director' && GATE_CREATION_PATTERN.test(trimmed)) {
      const targetLevel = extractTargetLevel(trimmed)
      const focusArea = extractFocusArea(trimmed)

      if (!targetLevel) {
        setPendingSlotFillWithPersist({
          kind: 'curriculum_gate_draft',
          levelName: null,
          focusArea,
          missingSlot: 'levelName',
          rawInput: trimmed,
        })
        const askLevelMsg: ChatMessage = {
          id: `donna-gate-ask-level-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: 'Which curriculum level should this assessment gate go in? (e.g., Orange 2, Yellow 1, Red 3)',
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askLevelMsg])
          setIsTyping(false)
          recordTurn(trimmed, askLevelMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      if (!focusArea) {
        setPendingSlotFillWithPersist({
          kind: 'curriculum_gate_draft',
          levelName: targetLevel,
          focusArea: null,
          missingSlot: 'focusArea',
          rawInput: trimmed,
        })
        const askFocusMsg: ChatMessage = {
          id: `donna-gate-ask-focus-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: `Got it — a new assessment gate for ${targetLevel}. What should the gate assess? (e.g., forehand preparation, rally consistency, serve mechanics)`,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askFocusMsg])
          setIsTyping(false)
          recordTurn(trimmed, askFocusMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      triggerCurriculumContentConfirmation({ contentType: 'assessment', contentLabel: 'assessment gate', levelName: targetLevel, focusArea, rawInput: trimmed })
      return
    }

    // ── Sprint 912.11: Narrow skill draft confirmation flow ───────────────────
    // Handles "add a skill for [level] focused on [focus]". Same confirmation →
    // create → review path used by drills and gates.
    if (plainRole === 'director' && SKILL_CREATION_PATTERN.test(trimmed)) {
      const targetLevel = extractTargetLevel(trimmed)
      const focusArea = extractFocusArea(trimmed)

      if (!targetLevel) {
        setPendingSlotFillWithPersist({
          kind: 'curriculum_skill_draft',
          levelName: null,
          focusArea,
          missingSlot: 'levelName',
          rawInput: trimmed,
        })
        const askLevelMsg: ChatMessage = {
          id: `donna-skill-ask-level-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: 'Which curriculum level should this skill go in? (e.g., Orange 2, Yellow 1, Red 3)',
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askLevelMsg])
          setIsTyping(false)
          recordTurn(trimmed, askLevelMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      if (!focusArea) {
        setPendingSlotFillWithPersist({
          kind: 'curriculum_skill_draft',
          levelName: targetLevel,
          focusArea: null,
          missingSlot: 'focusArea',
          rawInput: trimmed,
        })
        const askFocusMsg: ChatMessage = {
          id: `donna-skill-ask-focus-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: `Got it — a new skill for ${targetLevel}. What should the skill focus on? (e.g., forehand preparation, serve mechanics, footwork)`,
          timestamp: new Date().toISOString(),
          confidence: 'high',
          sourceNote: null,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, askFocusMsg])
          setIsTyping(false)
          recordTurn(trimmed, askFocusMsg.text, { domain: 'curriculum', confidence: 'high' })
        }, 400)
        return
      }

      triggerCurriculumContentConfirmation({ contentType: 'skill', contentLabel: 'skill', levelName: targetLevel, focusArea, rawInput: trimmed })
      return
    }

    // ── Sprint 739: Curriculum draft proposal intercept ──────────────────────
    // Fires before impact (CAP 8) to catch "add a gate to Orange 2" intent.
    if (plainRole === 'director') {
      const draftProposal = tryAnswerCurriculumDraftProposal(trimmed)
      if (draftProposal) {
        const draftMsg = buildChatMessageFromAnswer(draftProposal)
        const draftNavOffer = buildNavOfferFromHref(draftProposal.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, draftMsg])
          setIsTyping(false)
          recordTurn(trimmed, draftMsg.text, {
            actionId: draftProposal.actionId,
            confidence: draftProposal.confidence,
            sourceNote: draftProposal.sourceNote,
          })
          if (draftNavOffer) setPendingNavOffer(draftNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 739: Session adjustment intercept ──────────────────────────────
    if (plainRole === 'director') {
      const sessionAdj = tryAnswerSessionAdjustmentQuestion(trimmed)
      if (sessionAdj) {
        const sessionMsg = buildChatMessageFromAnswer(sessionAdj)
        const sessionNavOffer = buildNavOfferFromHref(sessionAdj.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, sessionMsg])
          setIsTyping(false)
          recordTurn(trimmed, sessionMsg.text, {
            actionId: sessionAdj.actionId,
            confidence: sessionAdj.confidence,
            sourceNote: sessionAdj.sourceNote,
          })
          if (sessionNavOffer) setPendingNavOffer(sessionNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 739: Coach cue / execution suggestion intercept ────────────────
    if (plainRole === 'director' || plainRole === 'coach') {
      const coachCue = tryAnswerCoachCueQuestion(trimmed)
      if (coachCue) {
        const cueMsg = buildChatMessageFromAnswer(coachCue)
        const cueNavOffer = buildNavOfferFromHref(coachCue.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, cueMsg])
          setIsTyping(false)
          recordTurn(trimmed, cueMsg.text, {
            actionId: coachCue.actionId,
            confidence: coachCue.confidence,
            sourceNote: coachCue.sourceNote,
          })
          if (cueNavOffer) setPendingNavOffer(cueNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 738: Curriculum impact explanation intercept ───────────────────
    // "What happens if I add a gate to Orange 2?" style questions.
    // Fires before curriculum level questions to avoid false-positive level match.
    if (plainRole === 'director') {
      const impactAnswer = tryAnswerCurriculumImpactQuestion(trimmed)
      if (impactAnswer) {
        const impactMsg = buildChatMessageFromAnswer(impactAnswer)
        const impactNavOffer = buildNavOfferFromHref(impactAnswer.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, impactMsg])
          setIsTyping(false)
          recordTurn(trimmed, impactMsg.text, {
            actionId: impactAnswer.actionId,
            confidence: impactAnswer.confidence,
            sourceNote: impactAnswer.sourceNote,
          })
          if (impactNavOffer) setPendingNavOffer(impactNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 737: Curriculum level / gap explanation intercept ─────────────
    // Fires before fitness/class template steps to catch "explain Orange 2",
    // "what are gates", "what is missing from my curriculum", etc.
    if (plainRole === 'director') {
      const curriculumAnswer = tryAnswerCurriculumLevelQuestion(trimmed, directorCtx)
      if (curriculumAnswer) {
        const curriculumMsg = buildChatMessageFromAnswer(curriculumAnswer)
        const curriculumNavOffer = buildNavOfferFromHref(curriculumAnswer.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, curriculumMsg])
          setIsTyping(false)
          recordTurn(trimmed, curriculumMsg.text, {
            actionId: curriculumAnswer.actionId,
            confidence: curriculumAnswer.confidence,
            sourceNote: curriculumAnswer.sourceNote,
          })
          if (curriculumNavOffer) setPendingNavOffer(curriculumNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 736: Fitness template draft intercept ─────────────────────────
    // Fires before class template intercept so "fitness template" doesn't match
    // isTemplateCreationIntent (which also catches generic "template" keywords).
    if (plainRole === 'director') {
      const fitnessResult = tryAnswerFitnessDraftRequest(trimmed)
      if (fitnessResult) {
        const fitnessMsg = buildChatMessageFromAnswer(fitnessResult.answer)
        const fitnessNavOffer = buildNavOfferFromHref(fitnessResult.answer.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, fitnessMsg])
          setIsTyping(false)
          recordTurn(trimmed, fitnessMsg.text, {
            actionId: fitnessResult.answer.actionId,
            confidence: fitnessResult.answer.confidence,
            sourceNote: fitnessResult.answer.sourceNote,
          })
          if (fitnessNavOffer) setPendingNavOffer(fitnessNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 735: Template draft intercept ─────────────────────────────────
    // Fires after coach health, before clarification/blocked.
    // Handles both new template creation intent and multi-turn pending draft answers.
    if (plainRole === 'director') {
      const pendingTd = getPendingTemplateDraft()
      const tdResult = tryAnswerTemplateDraftRequest(trimmed, pendingTd)
      if (tdResult) {
        const tdMsg = buildChatMessageFromAnswer(tdResult.answer)
        const tdNavOffer = buildNavOfferFromHref(tdResult.answer.href, trimmed)
        setPendingTemplateDraft(tdResult.isComplete ? null : tdResult.updatedDraft)
        setTimeout(() => {
          setMessages(prev => [...prev, tdMsg])
          setIsTyping(false)
          recordTurn(trimmed, tdMsg.text, {
            actionId: tdResult.answer.actionId,
            confidence: tdResult.answer.confidence,
            sourceNote: tdResult.answer.sourceNote,
          })
          if (tdNavOffer) setPendingNavOffer(tdNavOffer)
        }, 600)
        return
      }
    }

    // Clarification / blocked intent intercept
    if (plainRole === 'director') {
      const clarifyOrBlock = tryDirectorClarificationOrBlock(trimmed)
      if (clarifyOrBlock) {
        const donnaMsg = buildChatMessageFromAnswer(clarifyOrBlock)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: clarifyOrBlock.actionId,
            confidence: clarifyOrBlock.confidence,
            sourceNote: clarifyOrBlock.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Action preview intercept
    if (plainRole === 'director') {
      const previewAnswer = tryBuildActionPreview(trimmed)
      if (previewAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(previewAnswer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: previewAnswer.actionId,
            confidence: previewAnswer.confidence,
            sourceNote: previewAnswer.sourceNote,
          })
        }, 600)
        return
      }
    }

    // Try safe read dispatch based on keywords
    const actionId = detectActionIdFromText(trimmed, plainRole)

    if (actionId) {
      const answer = dispatchSafeReadAction(actionId, plainRole, directorCtx, coachCtx)
      if (answer) {
        const donnaMsg = buildChatMessageFromAnswer(answer)
        // Sprint 730: if the answer has a nav href, store a pending offer so
        // "yeah", "yes", "sure" on the next turn confirms navigation.
        const safeReadNavOffer = buildNavOfferFromHref(answer.href, trimmed)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId,
            confidence: answer.confidence,
            sourceNote: answer.sourceNote,
          })
          if (safeReadNavOffer) setPendingNavOffer(safeReadNavOffer)
        }, 600)
        return
      }
    }

    // ── Sprint 728: Short-phrase / vague-input handler ───────────────────────
    // Catches "help", "confused", "what can you do", "what now", etc. for any role.
    // Must fire BEFORE the router so these common queries never hit the bare fallback.
    const shortPhraseCategory = detectShortPhrase(trimmed)
    if (shortPhraseCategory) {
      const spAnswer = buildShortPhraseAnswer(shortPhraseCategory, plainRole)
      const spMsg: ChatMessage = {
        id: `donna-sp-${Date.now()}`,
        role: 'donna',
        kind: 'text',
        text: spAnswer.text,
        timestamp: new Date().toISOString(),
        confidence: spAnswer.confidence,
        sourceNote: spAnswer.sourceNote,
        followUp: spAnswer.followUp,
      }
      setTimeout(() => {
        setMessages(prev => [...prev, spMsg])
        setIsTyping(false)
        recordTurn(trimmed, spMsg.text, { confidence: spAnswer.confidence })
      }, 400)
      return
    }

    // ── Sprint 726: Conversational router fallback ───────────────────────────
    // For director role, run routeDonnaPrompt and handle system-map / page-context
    // modes that were previously dead code.
    if (plainRole === 'director') {
      const routing = routeDonnaPrompt(trimmed, pathname ?? '/director')
      const routerAnswer = buildRouterAnswer(trimmed, routing.responseMode, pathname ?? '/director')
      if (routerAnswer) {
        const routerMsg: ChatMessage = {
          id: `donna-router-${Date.now()}`,
          role: 'donna',
          kind: 'text',
          text: routerAnswer.text,
          timestamp: new Date().toISOString(),
          confidence: routerAnswer.confidence,
          sourceNote: routerAnswer.sourceNote,
          followUp: routerAnswer.followUp,
          followUpHref: routerAnswer.href ?? undefined,
        }
        setTimeout(() => {
          setMessages(prev => [...prev, routerMsg])
          setIsTyping(false)
          recordTurn(trimmed, routerMsg.text, { confidence: routerAnswer.confidence })
        }, 600)
        return
      }
    }

    // Fallback: honest "I don't know" — still better than silence
    const fallbackMsg: ChatMessage = {
      id: `donna-fallback-${Date.now()}`,
      role: 'donna',
      kind: 'text',
      text: "I'm not sure how to answer that yet. Try asking about onboarding, sessions, pending reviews, player attention, or say 'help' for suggestions.",
      timestamp: new Date().toISOString(),
      confidence: 'insufficient',
    }

    setTimeout(() => {
      setMessages(prev => [...prev, fallbackMsg])
      setIsTyping(false)
      recordTurn(trimmed, fallbackMsg.text)
    }, 600)
  }

  // ── Quick action handler ────────────────────────────────────────────────────

  function handleQuickAction(actionId: string) {
    const question = suggestedQuestions.find(q => q.id === actionId)
    if (question) handleSend(question.text)
  }

  // ── Voice toggle ────────────────────────────────────────────────────────────
  // Sprint 912.5: interrupt support — pressing mic while DONNA is speaking stops
  // TTS immediately and opens the mic. Conversation mode is preserved across interrupts.

  function handleVoiceToggle() {
    if (voice.status === 'listening') {
      // Director presses mic while already listening — stop listening
      voice.stop()
      // In conversation mode, this is an intentional pause by director (not a failure)
      if (conv.conversationMode && !conv.isPaused) {
        // Don't pause conversation mode — just stop the mic for this cycle
        // Director can speak again by pressing the mic button or waiting for next cycle
      }
    } else {
      // Sprint 912.5: Interrupt DONNA while speaking — stop TTS, start mic immediately
      if (isSpeaking) {
        stopServerTts()
        setIsSpeaking(false)
        // Cancel any pending auto-listen timer so we don't double-restart
        if (autoListenTimerRef.current) {
          clearTimeout(autoListenTimerRef.current)
          autoListenTimerRef.current = null
        }
        conv.endAutoListen()
      } else {
        stopServerTts()
        setIsSpeaking(false)
      }
      voice.reset()
      pendingVoiceRef.current = null
      voice.start()
    }
  }

  // ── Stop speaking (explicit stop button) ────────────────────────────────────
  // Sprint 912.5: stopping TTS explicitly keeps conversation mode active;
  // if conversation mode is on and not paused, schedule auto-listen after stopping.

  function handleStopSpeaking() {
    stopServerTts()
    setIsSpeaking(false)
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current)
      autoListenTimerRef.current = null
    }
    // Sprint 912.5: after explicit stop, resume auto-listen if in conversation mode
    scheduleAutoListen()
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>

      {/* ── Sprint 912.3: Conversation Mode header bar ─────────────────────── */}
      {role === 'director' && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface shrink-0">
          {/* State label — left side */}
          <div className="flex items-center gap-1.5 min-w-0">
            {godModeLabel && (
              <>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{
                    background:
                      godModeState === 'listening' || godModeState === 'auto_listening' ? '#C8FF00'
                      : godModeState === 'speaking' ? '#8b5cf6'
                      : godModeState === 'thinking' || godModeState === 'executing' ? '#0A84FF'
                      : godModeState === 'awaiting_confirmation' ? '#FF9500'
                      : godModeState === 'paused' ? '#555555'
                      : '#555555',
                  }}
                />
                <span
                  className="text-[10px] font-medium truncate"
                  style={{
                    color:
                      godModeState === 'listening' || godModeState === 'auto_listening' ? '#C8FF00'
                      : godModeState === 'speaking' ? '#8b5cf6'
                      : godModeState === 'thinking' || godModeState === 'executing' ? '#0A84FF'
                      : godModeState === 'awaiting_confirmation' ? '#FF9500'
                      : '#555555',
                  }}
                >
                  {godModeLabel}
                </span>
              </>
            )}
            {!godModeLabel && (
              <span className="text-[10px] text-text-muted">
                {conv.conversationMode ? 'Conversation Mode' : 'DONNA'}
              </span>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pause/Resume — only when conversation mode on */}
            {conv.conversationMode && (
              <button
                type="button"
                onClick={() => {
                  if (conv.isPaused) {
                    conv.resumeConversation()
                  } else {
                    voice.stop()
                    stopServerTts()
                    setIsSpeaking(false)
                    conv.pauseConversation()
                  }
                }}
                className="text-[10px] px-2 py-1 rounded-lg border transition-colors"
                style={{
                  borderColor: conv.isPaused ? 'rgba(200,255,0,0.3)' : 'rgba(85,85,85,0.4)',
                  color: conv.isPaused ? '#C8FF00' : '#888888',
                  background: conv.isPaused ? 'rgba(200,255,0,0.05)' : 'transparent',
                }}
              >
                {conv.isPaused ? 'Resume' : 'Pause'}
              </button>
            )}

            {/* Conversation Mode toggle */}
            <button
              type="button"
              onClick={() => {
                if (conv.conversationMode) {
                  voice.stop()
                  stopServerTts()
                  setIsSpeaking(false)
                  conv.disableConversationMode()
                } else {
                  conv.enableConversationMode()
                }
              }}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all"
              style={{
                borderColor: conv.conversationMode ? 'rgba(200,255,0,0.35)' : 'rgba(85,85,85,0.4)',
                background: conv.conversationMode ? 'rgba(200,255,0,0.07)' : 'transparent',
                color: conv.conversationMode ? '#C8FF00' : '#888888',
              }}
              title={conv.conversationMode ? 'Turn off Conversation mode' : 'Turn on Conversation mode — DONNA listens after each response'}
            >
              {conv.conversationMode && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#C8FF00' }}
                />
              )}
              Conversation
            </button>
          </div>
        </div>
      )}

      {/* ── Awaiting confirmation banner ────────────────────────────────────── */}
      {godModeState === 'awaiting_confirmation' && conv.pendingConfirmation && (
        <div
          className="px-3 py-2.5 border-b shrink-0"
          style={{ background: 'rgba(255,149,0,0.06)', borderColor: 'rgba(255,149,0,0.2)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#FF9500' }}>
            Waiting for confirmation
          </p>
          <p className="text-[11px] text-text-secondary leading-snug">
            {conv.pendingConfirmation.description}
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            Say "yes" to create the draft, or "no" to cancel.
          </p>
        </div>
      )}

      {/* Voice status indicator — listening */}
      {voice.status === 'listening' && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-lime/10 border-b border-lime/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          <span className="text-xs text-lime">
            {conv.conversationMode ? 'Auto-listening…' : 'Listening…'}
          </span>
          {voice.interimTranscript && (
            <span className="text-xs text-lime/70 truncate max-w-[200px]">
              {voice.interimTranscript}
            </span>
          )}
        </div>
      )}

      {/* Sprint 751/912.5 — speaking indicator: shown when TTS auto-play is active */}
      {isSpeaking && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 shrink-0"
          style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: '#8b5cf6' }}
          />
          <span className="text-xs" style={{ color: '#8b5cf6' }}>
            Speaking{conv.conversationMode ? ' — press mic to interrupt' : '…'}
          </span>
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="text-[10px] px-2 py-0.5 rounded-lg border ml-1 transition-colors hover:opacity-80"
            style={{ borderColor: 'rgba(139,92,246,0.3)', color: 'rgba(139,92,246,0.8)' }}
          >
            Stop
          </button>
        </div>
      )}

      {/* Sprint 745 — voice error: clear one-line message + retry button */}
      {voice.error && (
        <div className="px-4 py-2 bg-status-red/5 border-b border-status-red/20 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-status-red">
            {voice.error === 'unsupported'
              ? 'Voice is unavailable in this browser. Type your question.'
              : 'Voice is unavailable. You can type, or retry microphone.'}
          </span>
          {voice.error !== 'unsupported' && (
            <button
              type="button"
              onClick={() => voice.reset()}
              className="text-xs shrink-0 px-2.5 py-1 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors"
            >
              Retry voice
            </button>
          )}
        </div>
      )}

      {/* Chat thread */}
      {/* Sprint 752: quick action chips hidden once conversation is underway (≥2 messages). */}
      <DonnaChatThread
        role={role}
        messages={messages}
        quickActions={messages.length >= 2 ? [] : quickActions}
        isTyping={isTyping || isExecuting}
        isListening={voice.status === 'listening'}
        onSend={handleSend}
        onQuickAction={handleQuickAction}
        onVoiceToggle={voice.isAvailable ? handleVoiceToggle : undefined}
        className="flex-1 min-h-0"
      />
    </div>
  )
}

// ── Sprint 730: Nav offer from safe-read answer href ───────────────────────────
// When a safe-read action returns an href, build a PendingNavOffer so the user
// can confirm navigation by saying "yes" / "yeah" on the next turn.

const HREF_TO_LABEL: Record<string, string> = {
  '/director/review': 'Review Center',
  '/director/players': 'Players',
  '/director/sessions': 'Sessions',
  '/director/templates': 'Templates',
  '/director/onboarding': 'Academy Setup',
  '/director/onboarding/players-placement': 'Add Players',
  '/director/onboarding/coaches-permissions': 'Add Coaches',
  '/director/onboarding/curriculum': 'Curriculum Setup',
  '/director': 'Dashboard',
}

function buildNavOfferFromHref(
  href: string | null | undefined,
  questionContext: string,
): PendingNavOffer | null {
  if (!href) return null
  const label = HREF_TO_LABEL[href]
  if (!label) return null
  return { href, label, questionContext }
}

// Sprint 848: nav offer builder for the roster attention answer.
// Extends buildNavOfferFromHref to handle dynamic /director/players/<uuid> hrefs
// (Sprint 847) that cannot be resolved via HREF_TO_LABEL.
// Label priority: (1) static HREF_TO_LABEL (e.g. /director/players → 'Players'),
// (2) answer.followUp text (e.g. "View Sarah's profile"), (3) 'Open player profile'.
// Returns null if href is absent or not a recognized path.
function buildRosterNavOffer(
  href: string | null | undefined,
  followUp: string | null | undefined,
  questionContext: string,
): PendingNavOffer | null {
  if (!href) return null
  // Try static HREF_TO_LABEL first (handles /director/players fallback, etc.)
  const staticLabel = HREF_TO_LABEL[href]
  if (staticLabel) return { href, label: staticLabel, questionContext }
  // Dynamic /director/players/<uuid> — use followUp text as label or default
  if (href.startsWith('/director/players/') && href.split('/').length === 4) {
    return { href, label: followUp?.trim() || 'Open player profile', questionContext }
  }
  return null
}

// ── Action detection from natural language ─────────────────────────────────────

function detectActionIdFromText(text: string, role: DonnaRole): string | null {
  const t = text.toLowerCase()

  if (role === 'director') {
    if (/today|summary|happening|overview|brief/i.test(t)) return 'summarize_today'
    if (/pending|review|queue|waiting|attention/i.test(t)) return 'show_pending_reviews'
    if (/risk|danger|concern|flag|alert|problem/i.test(t)) return 'academy_risks'
  }

  if (role === 'coach') {
    if (/session|today|schedule|plan/i.test(t)) return 'start_session'
    if (/wrap.?up|submitted|complete|done/i.test(t)) return 'wrap_up'
  }

  return null
}

// ── Sprint 726: Conversational router answer builder ──────────────────────────
// Produces answer text for modes that were previously dead code.
// Returns null if the mode has no useful text answer (caller falls through to fallback).

interface RouterAnswerShape {
  text: string
  confidence: ChatMessage['confidence']
  sourceNote: string | null
  followUp: string | null
  href: string | null
}

function buildRouterAnswer(
  text: string,
  mode: string,
  pathname: string,
): RouterAnswerShape | null {
  // use_page_context — describe what the current page does and what to try
  if (mode === 'use_page_context') {
    const cap = getPageCapabilityMap(pathname)
    const prompts = cap.suggestedPrompts.slice(0, 3).join(', ')
    return {
      text: `You're on the ${cap.pageLabel}. ${cap.directorIntent} You can try asking: ${prompts}.`,
      confidence: 'high',
      sourceNote: `Page context: ${cap.pageLabel}`,
      followUp: null,
      href: null,
    }
  }

  // use_system_map — find and explain the relevant AcademyOS module
  if (mode === 'use_system_map') {
    const t = text.toLowerCase()
    // Find the most relevant module by checking if any module label or id appears in the text
    const match = DONNA_SYSTEM_MAP.find(m =>
      t.includes(m.label.toLowerCase()) ||
      t.includes(m.id.toLowerCase().replace(/_/g, ' ')) ||
      t.includes(m.id.toLowerCase())
    )
    if (match) {
      return {
        text: match.userFacingExplanation,
        confidence: 'high',
        sourceNote: `AcademyOS system: ${match.label}`,
        followUp: match.directorQuestions[0] ?? null,
        href: null,
      }
    }
    // Generic system map answer
    return {
      text: "AcademyOS works as a connected system: coaches run sessions and submit wrap-ups → the director reviews and approves → player records update → parents see approved summaries. Nothing moves without your explicit approval. What part would you like me to explain?",
      confidence: 'high',
      sourceNote: 'AcademyOS system overview',
      followUp: 'How does the review center work?',
      href: '/director/review',
    }
  }

  // ask_clarification — the router detected ambiguity
  if (mode === 'ask_clarification') {
    return {
      text: "Could you give me a bit more context? Are you asking about a specific player, a KPI, a module, or a pending action? The more specific you are, the better I can help.",
      confidence: 'partial',
      sourceNote: null,
      followUp: null,
      href: null,
    }
  }

  // explain_limitation — honest about what DONNA can't do
  if (mode === 'explain_limitation') {
    return {
      text: "I don't have enough context to answer that well here. I can explain what I do have — sessions, pending reviews, player attention signals, KPIs, and system explanations — but I may not have all the data you're looking for yet.",
      confidence: 'insufficient',
      sourceNote: 'Context limitation',
      followUp: "What needs my attention right now?",
      href: null,
    }
  }

  return null
}

// ── Sprint 912.11: Content-type helpers for generalized slot-fill handler ─────

type ContentSlotFillKind = 'curriculum_drill_draft' | 'curriculum_gate_draft' | 'curriculum_skill_draft'

function getContentLabel(kind: ContentSlotFillKind): string {
  if (kind === 'curriculum_gate_draft') return 'assessment gate'
  if (kind === 'curriculum_skill_draft') return 'skill'
  return 'drill'
}

function getContentTypeFromKind(kind: ContentSlotFillKind): CurriculumContentType {
  if (kind === 'curriculum_gate_draft') return 'assessment'
  if (kind === 'curriculum_skill_draft') return 'skill'
  return 'drill'
}

// ── Sprint 731: Strip markdown for TTS ────────────────────────────────────────
// Removes markdown formatting so text reads naturally when spoken aloud.
// Caps at ~300 chars (first natural paragraph) to avoid very long speech.

function stripMarkdownForTts(text: string): string {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')       // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')            // *italic* → italic
    .replace(/`([^`]+)`/g, '$1')            // `code` → code
    .replace(/^#{1,6}\s+/gm, '')            // ## Heading → Heading
    .replace(/^[-*•]\s+/gm, '. ')           // bullet point → pause
    .replace(/^\d+\.\s+/gm, '. ')           // numbered list → pause
    .replace(/--/g, ', ')                   // -- → pause
    .replace(/\n{2,}/g, '. ')              // blank lines → pause
    .replace(/\n/g, '. ')                   // line breaks → pause
    .replace(/\.\s*\.\s*\./g, '.')          // collapse repeated dots
    .replace(/\s{2,}/g, ' ')               // collapse spaces
    .trim()

  // Speak only the first natural paragraph / ~300 chars to keep it concise
  const breakAt = 300
  if (cleaned.length <= breakAt) return cleaned
  const cutoff = cleaned.lastIndexOf('.', breakAt)
  if (cutoff > 60) return cleaned.slice(0, cutoff + 1)
  return cleaned.slice(0, breakAt)
}

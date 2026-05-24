'use client'

// Sprint 1035 — DONNA Voice Ready Interaction Shell V1
// Wraps DonnaChatThread with voice input state management.
// Connects useVoiceDictation → text → chat send flow.
// Thin shell — voice logic lives in the hook, chat logic lives in DonnaChatThread.
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
import { getPageCapabilityMap } from '@/lib/donna/donnaPageContextEngine'
import { DONNA_SYSTEM_MAP } from '@/lib/donna/donnaSystemMap'
import { detectShortPhrase, buildShortPhraseAnswer } from '@/lib/donna/donnaShortPhraseEngine'
import { speakWithServerTts, stopServerTts } from '@/components/assistant/donnaServerTtsClient'
import { tryAnswerTemplateDraftRequest } from '@/lib/donna/templateDraftDonnaAnswer'
import { tryAnswerFitnessDraftRequest } from '@/lib/donna/fitnessDraftDonnaAnswer'
import { tryAnswerCurriculumLevelQuestion } from '@/lib/donna/curriculumLevelDonnaAnswer'
import { tryAnswerCurriculumImpactQuestion } from '@/lib/donna/curriculumImpactDonnaAnswer'
import { tryAnswerSessionAdjustmentQuestion } from '@/lib/donna/sessionAdjustmentDonnaAnswer'
import { tryAnswerCoachCueQuestion } from '@/lib/donna/coachCueDonnaAnswer'
import { tryAnswerCurriculumDraftProposal } from '@/lib/donna/curriculumDraftProposalDonnaAnswer'

// ── Yes/No detection patterns (Sprint 724) ────────────────────────────────────
const YES_PATTERN = /^(yes|yeah|yep|sure|ok|okay|go ahead|please|do it|take me there|yes please|definitely|absolutely|sounds good|let'?s go|open it|navigate|go there|open that)\b/i
const NO_PATTERN  = /^(no|nope|not now|cancel|never mind|maybe later|skip|not yet|don'?t|no thanks|not right now)\b/i

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
  const voice = useVoiceDictation()
  const pendingVoiceRef = useRef<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Sprint 731: TTS auto-speak tracking
  const lastVoiceInputAt = useRef<number>(0)
  const lastSpokenIdRef = useRef<string | null>(null)

  // Initialize session
  useEffect(() => {
    ensureChatSession(donnaRole)
  }, [donnaRole])

  // Sprint 731: Auto-speak DONNA responses that follow a voice input (30-second window)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'donna' || !lastMsg.text) return
    if (lastMsg.id === lastSpokenIdRef.current) return  // already spoken
    const msSinceVoice = Date.now() - lastVoiceInputAt.current
    if (msSinceVoice > 30_000) return  // too long since voice input
    lastSpokenIdRef.current = lastMsg.id
    void speakWithServerTts(stripMarkdownForTts(lastMsg.text))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Auto-send when voice transcript completes
  useEffect(() => {
    if (voice.status === 'idle' && voice.transcript.trim()) {
      if (pendingVoiceRef.current !== voice.transcript) {
        pendingVoiceRef.current = voice.transcript
        lastVoiceInputAt.current = Date.now()  // Sprint 731: mark voice input timestamp
        handleSend(voice.transcript)
        voice.reset()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.status, voice.transcript])

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

  // ── Send handler ────────────────────────────────────────────────────────────

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = buildUserChatMessage(trimmed)
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

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

    // Roster attention intercept — "Who needs attention?" style questions
    if (plainRole === 'director' && directorCtx) {
      const rosterAnswer = tryAnswerRosterAttentionQuestion(trimmed, directorCtx)
      if (rosterAnswer) {
        const donnaMsg = buildChatMessageFromAnswer(rosterAnswer)
        setTimeout(() => {
          setMessages(prev => [...prev, donnaMsg])
          setIsTyping(false)
          recordTurn(trimmed, donnaMsg.text, {
            actionId: rosterAnswer.actionId,
            confidence: rosterAnswer.confidence,
            sourceNote: rosterAnswer.sourceNote,
          })
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

  function handleVoiceToggle() {
    if (voice.status === 'listening') {
      voice.stop()
    } else {
      stopServerTts()  // Sprint 731: stop any playing TTS before mic activates
      voice.reset()
      pendingVoiceRef.current = null
      voice.start()
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Voice status indicator */}
      {voice.status === 'listening' && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-lime/10 border-b border-lime/20">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          <span className="text-xs text-lime">Listening...</span>
          {voice.interimTranscript && (
            <span className="text-xs text-lime/70 truncate max-w-[200px]">
              {voice.interimTranscript}
            </span>
          )}
        </div>
      )}

      {voice.error && (
        <div className="px-4 py-1.5 bg-status-red/5 border-b border-status-red/20">
          <span className="text-xs text-status-red">
            {voice.error === 'unsupported'
              ? 'Voice input not supported in this browser.'
              : 'Voice input error — try typing instead.'}
          </span>
        </div>
      )}

      {/* Chat thread */}
      <DonnaChatThread
        role={role}
        messages={messages}
        quickActions={quickActions}
        isTyping={isTyping}
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

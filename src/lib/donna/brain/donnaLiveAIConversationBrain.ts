// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Parts 2, 5, 8 — Live AI Conversation Brain
//
// Async wrapper around the sync DONNA brain that activates the full AI pipeline
// when the brain returns 'live_ai_assist' (Step 15.6).
//
// Pipeline for live_ai_assist inputs:
//   1. Sync brain returns 'live_ai_assist' (confirms eligibility from Step 15.6)
//   2. Eligibility re-check (defensive gate)
//   3. OpenAI teacher call — language_understanding or intent_interpretation (Part 2)
//      └── Privacy guard runs inside askConversationTeacher() (Part 3, already built)
//   4. Personality layer — enforces DONNA voice (Part 4)
//   5. Academy DNA guard — blocks/flags AI suggestions that conflict (Part 6)
//   6. Learning quality score — Part 5.5
//   7. Learning entry capture — adds AI-quality metadata to ledger (Part 5)
//   8. Replay dataset record — captures turn for future training (Part 7)
//   9. AI usage metrics record
//  10. Returns DonnaMessageResult with action: 'respond'
//
// Fallback contract:
//   - OpenAI key absent → teacher returns fallback; pipeline continues with safe default
//   - DNA blocked → uses suggested alternative response; entry marked 'rejected'
//   - Any error → returns route_coo_prompt (lets existing COO chain handle it)
//
// Operating principle: DONNA talks to OpenAI. OpenAI never talks directly to the user.
//
// Design rules:
//   - Server-side module only (needs OPENAI_API_KEY from process.env).
//   - No DB writes — all capture is in-memory (DB persistence in future sprint).
//   - No React, no side effects beyond in-memory stores.

import { processDonnaMessage } from '@/lib/donna/brain/processDonnaMessage'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
// Mega Sprint 3031–3060 — Page context injection for AI teacher calls
import {
  resolvePageIntelligence,
  formatPageIntelligenceForTeacher,
} from '@/lib/donna/operating/pageContextResolver'
import { evaluateAIAssistEligibility } from '@/lib/donna/brain/donnaBrainConfidenceEvaluator'
import { buildStrategicContextPacket, formatContextForTeacher } from '@/lib/donna/brain/donnaStrategicAIContextBuilder'
import { askConversationTeacher } from '@/lib/donna/conversation/donnaConversationTeacher'
import { applyDonnaPersonality } from '@/lib/donna/conversation/donnaPersonalityLayer'
import { checkAcademyDNAGuard } from '@/lib/donna/conversation/donnaAcademyDNAGuard'
import { donnaConversationReplayDataset } from '@/lib/donna/conversation/donnaConversationReplayDataset'
import { scoreLearningQuality } from '@/lib/donna/learning/donnaLearningQualityScorer'
import { recordAIUsage } from '@/lib/donna/conversation/donnaAIUsageMetrics'
import { createLearningEntry } from '@/lib/donna/learning/learningEntryModel'
import { donnaLearningLedger } from '@/lib/donna/learning/donnaLearningLedger'
import type { InterpreterRole } from '@/lib/donna/conversation/donnaIntentInterpreter'
import type { LivePageState } from '@/lib/donna/operating/livePageState'

// ── Live state context formatter ──────────────────────────────────────────────

function formatLiveStateForAI(live: LivePageState | null | undefined): string {
  if (!live) return ''
  const parts: string[] = []
  if (live.pendingReviewCount !== null) parts.push(`${live.pendingReviewCount} pending reviews`)
  if (live.playersMissingCurriculumLevel !== null && live.playersMissingCurriculumLevel > 0) {
    parts.push(`${live.playersMissingCurriculumLevel} players missing curriculum level`)
  }
  if (live.levelUpQueueCount !== null && live.levelUpQueueCount > 0) {
    parts.push(`${live.levelUpQueueCount} in level-up queue`)
  }
  if (live.placementQueueCount !== null && live.placementQueueCount > 0) {
    parts.push(`${live.placementQueueCount} in placement queue`)
  }
  if (live.curriculumSpineActive === false) parts.push('curriculum spine inactive')
  if (live.onboardingComplete === false) parts.push('onboarding incomplete')
  if (parts.length === 0) return ''
  return `Live: ${parts.join('; ')}`
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Live AI-enhanced conversation processor.
 *
 * Runs the sync DONNA brain first. If the brain returns 'live_ai_assist',
 * routes to the full async AI pipeline. Any other brain action is returned as-is.
 *
 * @param input - DonnaMessageInput (same object passed to processDonnaMessage)
 * @param academyId - Server-validated academy ID (never trusted from client)
 * @param academyDNAContext - Brief non-sensitive context (academy name + DNA model label)
 */
export async function processLiveAIConversation(
  input: DonnaMessageInput,
  academyId: string,
  academyDNAContext?: string | null,
): Promise<DonnaMessageResult> {
  const startMs = Date.now()

  // Step 1: Run sync brain (deterministic path first — always)
  const brainResult = processDonnaMessage(input)

  // Step 2: Passthrough — if brain resolved deterministically, return as-is
  if (brainResult.action !== 'live_ai_assist') {
    return brainResult
  }

  const role = input.role as InterpreterRole
  const message = input.userMessage.trim()
  const brainConfidence = brainResult.confidence

  // Step 3: Defensive eligibility re-check
  const eligibility = evaluateAIAssistEligibility(message, brainConfidence)
  if (!eligibility.eligible) {
    return { ...brainResult, action: 'route_coo_prompt' }
  }

  try {
    // Step 4: OpenAI teacher call (Part 2)
    // privacyGuard() runs inside askConversationTeacher — no pre-check needed here.
    // Mega Sprint 3031–3060: inject page context so the teacher knows what page is open.
    // Mega Sprint 3091–3120: inject live academy state so teacher uses real counts.
    const pageIntel = resolvePageIntelligence(input.route, input.livePageState)
    const pageCtxStr = pageIntel ? formatPageIntelligenceForTeacher(pageIntel) : undefined
    const liveStateStr = formatLiveStateForAI(input.livePageState)
    const combinedContext = [
      academyDNAContext?.slice(0, 80),
      pageCtxStr?.slice(0, 100),
      liveStateStr?.slice(0, 100) || undefined,
    ].filter(Boolean).join(' | ') || undefined

    const teacherOutput = await askConversationTeacher({
      mode: eligibility.suggestedMode,
      userText: message,
      role,
      currentConfidence: brainConfidence,
      academyContext: combinedContext,
      maxWords: 40,
    })

    // Step 5: Personality layer (Part 4)
    const rawDraft = teacherOutput.source === 'openai'
      ? teacherOutput.result
      : 'What specifically concerns you? I can pull the relevant data.'
    const personalityResult = applyDonnaPersonality(rawDraft)

    // Step 6: Academy DNA guard (Part 6)
    const dnaGuardResult = checkAcademyDNAGuard({
      aiDraft: personalityResult.response,
      academyDNAContext,
    })

    const dnaConflict = dnaGuardResult.verdict !== 'pass'
    const finalResponse = dnaGuardResult.verdict === 'blocked'
      ? (dnaGuardResult.suggestedAlternative ?? 'That requires director review. Want me to surface this?')
      : personalityResult.response

    // Step 7: Learning quality score (Part 5.5)
    const finalConfidence = teacherOutput.source === 'openai' ? 0.65 : brainConfidence
    const qualityScore = scoreLearningQuality({
      brainConfidence,
      aiSource: teacherOutput.source,
      dnaConflict,
      dnaBlocked: dnaGuardResult.verdict === 'blocked',
      finalConfidence,
      personalityTransformations: personalityResult.transformations.length,
    })

    // Step 8: Capture learning entry (Part 5)
    const learningEntry = createLearningEntry({
      academyId,
      sourceType: 'conversation',
      sourceId: `live-ai-${Date.now()}`,
      role,
      conversationId: null,
      topic: `AI-assisted: ${message.slice(0, 60)}`,
      topicDomain: 'general',
      concepts: [],
      summary: `AI interpreted: "${message.slice(0, 80)}" → "${finalResponse.slice(0, 80)}"`,
      evidence: message,
      examplePhrases: [message],
      confidence: finalConfidence,
      importance: qualityScore.score / 100,
      frequency: 1,
      sourceReliability: teacherOutput.source === 'openai' ? 0.70 : 0.30,
      status: dnaGuardResult.verdict === 'blocked' ? 'rejected' : 'captured',
      reviewRequired: dnaConflict,
      approvedBy: null,
      approvedAt: null,
      tags: ['ai_assisted', teacherOutput.source, `quality_${qualityScore.qualityLabel}`],
      academyDnaModelId: null,
      metadata: {
        ai_quality_score: qualityScore,
        ai_source: teacherOutput.source,
        dna_verdict: dnaGuardResult.verdict,
        personality_transformations: personalityResult.transformations,
        eligibility_mode: eligibility.suggestedMode,
        teacher_tokens: teacherOutput.usedTokens,
      },
    })
    donnaLearningLedger.addEntry(learningEntry, 'live_ai_brain')

    // Step 9: Record replay turn (Part 7)
    donnaConversationReplayDataset.capture({
      role,
      userText: message,
      donnaResponse: finalResponse,
      aiAssisted: true,
      aiSource: teacherOutput.source,
      conceptDetected: null,
      brainConfidence,
      finalConfidence,
      dnaConflict,
      dnaVerdict: dnaGuardResult.verdict,
      tokenCost: teacherOutput.usedTokens,
    })

    // Step 10: AI usage metrics
    recordAIUsage({
      role,
      source: teacherOutput.source,
      tokensUsed: teacherOutput.usedTokens,
      qualityScore: qualityScore.score,
      dnaConflict,
      dnaVerdict: dnaGuardResult.verdict,
      responseTimeMs: Date.now() - startMs,
    })

    // Step 11: Return enhanced result as 'respond'
    return {
      ...brainResult,
      action: 'respond',
      response: finalResponse,
      spokenResponse: finalResponse,
      confidence: finalConfidence,
      shouldSpeak: true,
    }

  } catch {
    // Safety fallback — let the COO chain handle it
    return { ...brainResult, action: 'route_coo_prompt' }
  }
}

// ── Strategic AI conversation pipeline ───────────────────────────────────────

/**
 * Strategic AI-enhanced conversation processor.
 *
 * Runs the sync DONNA brain first. If the brain returns 'strategic_ai_assist',
 * routes to the full strategic reasoning pipeline:
 *   1. Sync brain (deterministic path — always runs first)
 *   2. Strategic context packet build (domain-specific framing, no PII)
 *   3. OpenAI teacher call (strategic_reasoning mode)
 *   4. Personality layer — enforces DONNA voice
 *   5. Academy DNA guard — blocks/flags AI drafts conflicting with academy DNA
 *   6. Learning quality score
 *   7. Learning entry capture with strategic metadata (approval-gated)
 *   8. Conversation replay dataset record
 *   9. AI usage metrics record
 *  10. Return DonnaMessageResult { action: 'respond' }
 *
 * Fallback contract:
 *   - OpenAI key absent → teacher returns fallback; pipeline continues
 *   - DNA blocked → suggested alternative shown; entry marked 'rejected'
 *   - Any error → returns route_coo_prompt
 *   - Non-strategic brain result → passthrough unchanged
 *
 * Operating principle: DONNA talks to OpenAI. OpenAI never talks directly to the user.
 */
export async function processStrategicAIConversation(
  input: DonnaMessageInput,
  academyId: string,
  academyDNAContext?: string | null,
): Promise<DonnaMessageResult> {
  const startMs = Date.now()

  // Step 1: Run sync brain (deterministic path first — always)
  const brainResult = processDonnaMessage(input)

  // Step 2: Passthrough — if brain resolved deterministically, return as-is
  if (brainResult.action !== 'strategic_ai_assist') {
    return brainResult
  }

  const role = input.role as InterpreterRole
  const message = input.userMessage.trim()
  const brainConfidence = brainResult.confidence
  const strategicCtx = brainResult.strategicContext

  // Defensive check — strategicContext must be set when action is strategic_ai_assist
  if (!strategicCtx || !strategicCtx.strategicDomain) {
    return { ...brainResult, action: 'route_coo_prompt' }
  }

  const { strategicDomain, detectedGoal, detectedIntent } = strategicCtx

  try {
    // Step 3: Build strategic context packet (domain signals + framing, no PII)
    // Mega Sprint 3031–3060: inject page context into strategic teacher call.
    const strategicPageIntel = resolvePageIntelligence(input.route)
    const strategicPageCtx = strategicPageIntel
      ? formatPageIntelligenceForTeacher(strategicPageIntel)
      : undefined
    const contextPacket = buildStrategicContextPacket(strategicDomain, academyDNAContext ?? null)
    const contextForTeacher = formatContextForTeacher(contextPacket, message, strategicPageCtx, input.livePageState)

    // Step 4: OpenAI teacher call (strategic_reasoning mode)
    const teacherOutput = await askConversationTeacher({
      mode: 'strategic_reasoning',
      userText: message,
      role,
      currentConfidence: brainConfidence,
      academyContext: contextForTeacher,
    })

    // Step 5: Personality layer — enforce DONNA voice
    const rawDraft = teacherOutput.source === 'openai'
      ? teacherOutput.result
      : `Three signals worth checking: progression delays, attendance drop-off, and parent communication gaps. Start with the area that has the most stalled activity.`
    const personalityResult = applyDonnaPersonality(rawDraft)

    // Step 6: Academy DNA guard
    const dnaGuardResult = checkAcademyDNAGuard({
      aiDraft: personalityResult.response,
      academyDNAContext,
    })

    const dnaConflict = dnaGuardResult.verdict !== 'pass'
    const finalResponse = dnaGuardResult.verdict === 'blocked'
      ? (dnaGuardResult.suggestedAlternative ?? 'That area requires director review. Want me to surface the relevant data instead?')
      : personalityResult.response

    // Step 7: Learning quality score
    const finalConfidence = teacherOutput.source === 'openai' ? Math.min(0.80, brainConfidence + 0.25) : brainConfidence
    const qualityScore = scoreLearningQuality({
      brainConfidence,
      aiSource: teacherOutput.source,
      dnaConflict,
      dnaBlocked: dnaGuardResult.verdict === 'blocked',
      finalConfidence,
      personalityTransformations: personalityResult.transformations.length,
    })

    // Step 8: Capture strategic learning entry — approval-gated, never auto-promoted
    const learningEntry = createLearningEntry({
      academyId,
      sourceType: 'conversation',
      sourceId: `strategic-ai-${Date.now()}`,
      role,
      conversationId: null,
      topic: `Strategic: ${strategicDomain} — ${message.slice(0, 60)}`,
      topicDomain: 'academy_operations',
      concepts: [],
      summary: `Strategic AI: "${message.slice(0, 80)}" → "${finalResponse.slice(0, 80)}"`,
      evidence: message,
      examplePhrases: [message],
      confidence: finalConfidence,
      importance: qualityScore.score / 100,
      frequency: 1,
      sourceReliability: teacherOutput.source === 'openai' ? 0.75 : 0.30,
      status: dnaGuardResult.verdict === 'blocked' ? 'rejected' : 'captured',
      reviewRequired: true,
      approvedBy: null,
      approvedAt: null,
      tags: ['strategic_ai', strategicDomain, teacherOutput.source, `quality_${qualityScore.qualityLabel}`],
      academyDnaModelId: null,
      metadata: {
        strategy_assist: true,
        strategic_domain: strategicDomain,
        detected_intent: detectedIntent,
        detected_goal: detectedGoal,
        context_used: contextPacket.domainLabel,
        openai_reasoning: teacherOutput.source === 'openai' ? teacherOutput.result : null,
        final_donna_response: finalResponse,
        learning_status: 'captured',
        outcome_status: 'unknown',
        usefulness_score: null,
        ai_quality_score: qualityScore,
        ai_source: teacherOutput.source,
        dna_verdict: dnaGuardResult.verdict,
        personality_transformations: personalityResult.transformations,
        teacher_tokens: teacherOutput.usedTokens,
      },
    })
    donnaLearningLedger.addEntry(learningEntry, 'strategic_ai_brain')

    // Step 9: Record replay turn
    donnaConversationReplayDataset.capture({
      role,
      userText: message,
      donnaResponse: finalResponse,
      aiAssisted: true,
      aiSource: teacherOutput.source,
      conceptDetected: null,
      brainConfidence,
      finalConfidence,
      dnaConflict,
      dnaVerdict: dnaGuardResult.verdict,
      tokenCost: teacherOutput.usedTokens,
    })

    // Step 10: AI usage metrics
    recordAIUsage({
      role,
      source: teacherOutput.source,
      tokensUsed: teacherOutput.usedTokens,
      qualityScore: qualityScore.score,
      dnaConflict,
      dnaVerdict: dnaGuardResult.verdict,
      responseTimeMs: Date.now() - startMs,
    })

    // Step 11: Return strategic response as 'respond'
    return {
      ...brainResult,
      action: 'respond',
      response: finalResponse,
      spokenResponse: finalResponse,
      confidence: finalConfidence,
      shouldSpeak: true,
    }

  } catch {
    return { ...brainResult, action: 'route_coo_prompt' }
  }
}

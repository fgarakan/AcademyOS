// Mega Sprint 2531–2560 — DONNA Demo Academy Simulation V1
//
// Simulation runner: exercises DONNA's deterministic logic layers
// against the Green Valley Tennis Academy dataset.
//
// This runs WITHOUT the LLM — testing only what DONNA can guarantee.
// LLM-dependent scenarios are marked and documented as gaps.
//
// Run this file with ts-node or import its results into the report.
// No DB, no API, no React.

import { resolveEntityFollowUp }     from '@/lib/donna/conversation/donnaConversationFollowUp'
import { resolveConversationalAction } from '@/lib/donna/conversation/donnaConversationActionRouter'
import { resolveReferences }          from '@/lib/donna/conversation/donnaReferenceResolver'
import { buildProactiveCOOSignal, shouldTriggerProactiveCOO } from '@/lib/donna/conversation/donnaProactiveCOODialogue'
import { buildConversationThreadSection } from '@/lib/donna/conversation/donnaConversationOperatingContext'
// Mega Sprint 2561–2590 — Academy Intelligence Engine
import { detectBroadAcademyQuery } from '@/lib/donna/academy/academyIntelligenceEngine'
import { answerAcademyDirectorQuestion } from '@/lib/donna/academy/academyDirectorQuestionsEngine'

import type { ConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'
import type { EntityMemoryContext }           from '@/lib/donna/memory/donnaMemoryContextTypes'
import type { ScenarioInput }                 from './demoAcademyDataset'

// ── Scenario result ───────────────────────────────────────────────────────────

export type DeterministicPath =
  | 'follow_up_fast_path'
  | 'action_fast_path'
  | 'academy_intelligence_fast_path'
  | 'proactive_coo'
  | 'reference_resolution'
  | 'llm_required'

export interface ScenarioResult {
  label:                   string
  userInput:               string
  resolvedInput:           string
  hadReferenceResolution:  boolean
  deterministicPath:       DeterministicPath
  deterministicResponse:   string | null
  navigationHref:          string | null
  proactiveSignal:         string | null
  systemPromptSection:     string
  requiresLlm:             boolean
  certificationResult:     'PASS' | 'FAIL' | 'LLM_DEPENDENT'
  failureReason:           string | null
  latencyClass:            'instant' | 'fast' | 'standard'
}

// ── Scenario runner ───────────────────────────────────────────────────────────

export function runScenario(s: ScenarioInput): ScenarioResult {
  const ctx = s.threadCtx
  const em  = s.entityCtx

  // Step 1: Reference resolution
  const { resolvedText, hadResolution } = resolveReferences(s.userInput, ctx)

  // Step 2: Check follow-up fast path
  const followUp = resolveEntityFollowUp(resolvedText, ctx)
  if (followUp) {
    return {
      label:                  s.label,
      userInput:              s.userInput,
      resolvedInput:          resolvedText,
      hadReferenceResolution: hadResolution,
      deterministicPath:      'follow_up_fast_path',
      deterministicResponse:  followUp.responseText,
      navigationHref:         followUp.navigationHref,
      proactiveSignal:        null,
      systemPromptSection:    ctx ? buildConversationThreadSection(ctx) : '',
      requiresLlm:            false,
      certificationResult:    'PASS',
      failureReason:          null,
      latencyClass:           'instant',
    }
  }

  // Step 3: Check action fast path
  const action = resolveConversationalAction(resolvedText, ctx)
  if (action) {
    const passOrFail: ScenarioResult['certificationResult'] =
      action.actionType === 'clarify' ? 'FAIL' : 'PASS'
    return {
      label:                  s.label,
      userInput:              s.userInput,
      resolvedInput:          resolvedText,
      hadReferenceResolution: hadResolution,
      deterministicPath:      'action_fast_path',
      deterministicResponse:  action.responseText,
      navigationHref:         action.navigationHref,
      proactiveSignal:        null,
      systemPromptSection:    ctx ? buildConversationThreadSection(ctx) : '',
      requiresLlm:            false,
      certificationResult:    passOrFail,
      failureReason:          action.actionType === 'clarify' ? 'Action router returned clarify — no recommendation context' : null,
      latencyClass:           'instant',
    }
  }

  // Step 3b: Academy intelligence fast path (Mega Sprint 2561–2590)
  // When a broad academy question matches and an intelligence packet is loaded,
  // answer deterministically without the LLM.
  const broadQuestionType = detectBroadAcademyQuery(resolvedText)
  if (broadQuestionType && s.academyIntelligencePacket && !s.entityCtx) {
    const answer = answerAcademyDirectorQuestion(broadQuestionType, s.academyIntelligencePacket)
    if (answer.confidence === 'high') {
      return {
        label:                  s.label,
        userInput:              s.userInput,
        resolvedInput:          resolvedText,
        hadReferenceResolution: hadResolution,
        deterministicPath:      'academy_intelligence_fast_path',
        deterministicResponse:  answer.responseText,
        navigationHref:         answer.navigationHint,
        proactiveSignal:        null,
        systemPromptSection:    ctx ? buildConversationThreadSection(ctx) : '',
        requiresLlm:            false,
        certificationResult:    'PASS',
        failureReason:          null,
        latencyClass:           'instant',
      }
    }
  }

  // Step 4: Proactive COO signal (injected into LLM context)
  let proactiveSignalText: string | null = null
  if (ctx && em && shouldTriggerProactiveCOO(resolvedText, ctx)) {
    const signal = buildProactiveCOOSignal(em, ctx)
    if (signal) proactiveSignalText = `${signal.topic}: ${signal.insight}. ${signal.prompt}`
  }

  // Step 5: Thread context section (what the LLM would see)
  const threadSection = ctx ? buildConversationThreadSection(ctx) : ''

  // Step 6: Classify as LLM_DEPENDENT
  // Determine whether the LLM has enough context to answer well
  const hasEntityContext = em !== null
  const hasThreadContext  = ctx !== null && threadSection.length > 0

  // Specific failure patterns
  let failureReason: string | null = null
  if (!hasEntityContext && !hasThreadContext) {
    if (/which|who|what|where/i.test(s.userInput) && s.userInput.split(' ').length < 8) {
      failureReason = 'Aggregated query ("which players...", "who needs...") — no entity context, LLM must synthesise from academy memory only. May hallucinate without real data.'
    }
  }

  return {
    label:                  s.label,
    userInput:              s.userInput,
    resolvedInput:          resolvedText,
    hadReferenceResolution: hadResolution,
    deterministicPath:      'llm_required',
    deterministicResponse:  null,
    navigationHref:         null,
    proactiveSignal:        proactiveSignalText,
    systemPromptSection:    threadSection,
    requiresLlm:            true,
    certificationResult:    failureReason ? 'FAIL' : 'LLM_DEPENDENT',
    failureReason,
    latencyClass:           hasEntityContext ? 'fast' : 'standard',
  }
}

// ── Full simulation run ───────────────────────────────────────────────────────

export function runFullSimulation(scenarios: ScenarioInput[]): {
  results:        ScenarioResult[]
  passCount:      number
  failCount:      number
  llmCount:       number
  instantCount:   number
  totalScenarios: number
} {
  const results = scenarios.map(runScenario)
  return {
    results,
    passCount:      results.filter(r => r.certificationResult === 'PASS').length,
    failCount:      results.filter(r => r.certificationResult === 'FAIL').length,
    llmCount:       results.filter(r => r.certificationResult === 'LLM_DEPENDENT').length,
    instantCount:   results.filter(r => r.latencyClass === 'instant').length,
    totalScenarios: results.length,
  }
}

// ── God Mode readiness calculation ────────────────────────────────────────────

export interface GodModeReadinessResult {
  scorePercent:          number
  requiredPercent:       number
  readinessLabel:        'PASS' | 'FAIL'
  deterministicCoverage: number  // % of turns handled without LLM
  entityCoverage:        number  // % of entity queries with real context
  threadCoverage:        number  // % of follow-up turns with active thread
  llmQualityEstimate:    number  // estimated LLM quality with injected context (0–10)
  gaps: string[]
}

export function calculateGodModeReadiness(results: ScenarioResult[]): GodModeReadinessResult {
  const total         = results.length
  const deterministic = results.filter(r => !r.requiresLlm).length
  const withEntity    = results.filter(r => r.systemPromptSection.length > 0 || !r.requiresLlm).length
  const withThread    = results.filter(r => r.systemPromptSection.includes('Conversation Thread Memory')).length
  const passed        = results.filter(r => r.certificationResult === 'PASS').length
  const failed        = results.filter(r => r.certificationResult === 'FAIL').length

  const deterministicCoverage = Math.round((deterministic / total) * 100)
  const entityCoverage        = Math.round((withEntity / total) * 100)
  const threadCoverage        = Math.round((withThread / total) * 100)

  // LLM quality estimate: with injected entity + thread context, LLM answers are reliable
  // Without context (aggregated queries), LLM is unreliable
  const llmWithContext    = results.filter(r => r.requiresLlm && r.systemPromptSection.length > 50).length
  const llmWithoutContext = results.filter(r => r.requiresLlm && r.systemPromptSection.length <= 50).length
  const llmQualityEstimate = llmWithContext > 0
    ? Math.round(((llmWithContext * 8 + llmWithoutContext * 4) / (llmWithContext + llmWithoutContext || 1)) * 10) / 10
    : 0

  const scorePercent = Math.round(
    (deterministicCoverage * 0.35) +
    (entityCoverage * 0.25) +
    (threadCoverage * 0.20) +
    (llmQualityEstimate * 2) // 0–10 → 0–20 points
  )

  const academyIntelligenceCount = results.filter(r => r.deterministicPath === 'academy_intelligence_fast_path').length

  const gaps: string[] = []
  if (failed > 0) gaps.push(`${failed} scenario(s) FAIL — deterministic router cannot complete without context`)
  if (llmWithoutContext > 0) gaps.push(`${llmWithoutContext} aggregated query scenario(s) still reach LLM without entity data`)
  if (deterministicCoverage < 40) gaps.push('Deterministic coverage below 40% — too many turns require LLM round-trip')

  // Remaining structural gaps (post–academy intelligence engine)
  if (academyIntelligenceCount === 0) {
    gaps.push('Academy intelligence fast paths not activating — check detectBroadAcademyQuery patterns')
  }
  gaps.push('Coach entity route missing: coach entity returns /director/players (no per-coach profile page yet)')
  gaps.push('Parent entity has no route — parent queries cannot navigate to a specific parent record')

  return {
    scorePercent,
    requiredPercent:       80,
    readinessLabel:        scorePercent >= 80 ? 'PASS' : 'FAIL',
    deterministicCoverage,
    entityCoverage,
    threadCoverage,
    llmQualityEstimate,
    gaps,
  }
}

// Mega Sprint 3751–3780 — DONNA Executive Experience Convergence V1
// Certification — proves the live Director experience now routes conversational/
// strategic requests through the Executive Operating Layer instead of a workflow
// menu, and that the executive quality gate strips Workflow-DONNA responses.
//
// Two tiers (same contract as executiveLiveWiringCertification):
//   • OFFLINE (always run, gates CI): classifier → router → brain routing, plus the
//     response-validator gate. Provable without an OpenAI key.
//   • LIVE (gated on OPENAI_API_KEY): the 8 sprint certification prompts driven
//     through the real executive pipeline; proves source=openai + no menu output.
//     When no key is present it is honestly reported as NOT RUN — never faked.
//
// Run: npx tsx src/lib/donna/certification/executiveExperienceConvergenceCertification.ts

import { classifyExecutiveConversation } from '@/lib/donna/executive/executiveConversationClassifier'
import { routeDonnaConversation } from '@/lib/donna/brain/donnaCanonicalRouter'
import { processDonnaMessage, type DonnaMessageInput, type DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { runExecutiveOperatingTurn } from '@/lib/donna/executive/executiveOperatingLayer'
import { buildResolverStateFromLive, type LiveAcademyContext } from '@/lib/donna/executive/liveResolverAdapter'
import { validateExecutiveResponse } from '@/lib/donna/executive/responseValidator'
import { resolveExecutiveContext } from '@/lib/donna/executive/contextResolver'
import { deriveReasoningGoal } from '@/lib/donna/executive/executiveReasoningLayer'
import { resolveContinuity } from '@/lib/donna/executive/conversationContinuity'
import { clearOpenAICallLog } from '@/lib/donna/executive/openaiInstrumentation'
import { clearShadowRecords } from '@/lib/donna/executive/executiveShadowMode'
import { summarizeExecutiveUsage, formatExecutiveUsage } from '@/lib/donna/executive/executiveUsageMetrics'
import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

// The 8 live-certification prompts from the sprint brief.
const CERT_PROMPTS = [
  'What should I do next?',
  'Help me complete this.',
  'What else do I need to do?',
  'Walk me through this.',
  'Why are you recommending that?',
  'Who needs attention today?',
  'How is the academy looking?',
  'Take me to the most important thing.',
]

const ACADEMY: LiveAcademyContext = { academyId: 'cert-academy', name: 'Dabul Tennis Academy', modelLabel: 'Player Development Model' }

function liveInput(message: string): DonnaMessageInput {
  return {
    userMessage: message,
    role: 'director',
    route: '/director',
    activeGuidedWorkflowId: null,
    cooState: null,
    goalMemory: null,
    firstName: 'Brian',
    pendingReviews: 0,
    conversationHistory: [],
    entityContext: null,
    pendingDisambiguation: null,
    conversationNavigatorState: null,
    onboardingComplete: true,
    livePageState: null,
  } as unknown as DonnaMessageInput
}

// Complete director context fixture — the canonical demo context used by the other
// router-exercising certs (donnaCOOPresenceCertification, directorOperatingSession).
// A hand-rolled partial stub leaves array fields (e.g. curriculumGaps) undefined,
// which crashes the deterministic engines the flag-off router path falls through to.
const CTX_STUB = buildDemoContext()

// Legacy stub seeds an outstanding decision so the executive packet has context.
function legacyStub(overrides: Partial<DonnaMessageResult> = {}): DonnaMessageResult {
  return {
    action: 'respond',
    response: 'LEGACY: ok.',
    spokenResponse: 'ok',
    intent: null, entity: null, goal: null, confidence: 0.5, nextAction: { label: 'Assign curriculum levels to 49 active players' },
    followUpQuestion: null, shouldSpeak: false, navigateTo: null, startWorkflowId: null, cooControl: null,
    goalSessionCommand: null, startGoalType: null, requiresApproval: true, limitations: null,
    resolvedEntityV2: null, unifiedAnswer: null, disambiguationQuestion: null, updatedNavigatorState: null,
    strategicContext: null, pageIntelligence: null, realitySnapshot: null,
    debugLog: createDebugLog('x', 'director', '/director'),
    ...overrides,
  } as DonnaMessageResult
}

function withFlag<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env.DONNA_EXECUTIVE_REASONING
  if (value === undefined) delete process.env.DONNA_EXECUTIVE_REASONING
  else process.env.DONNA_EXECUTIVE_REASONING = value
  try { return fn() } finally {
    if (prev === undefined) delete process.env.DONNA_EXECUTIVE_REASONING
    else process.env.DONNA_EXECUTIVE_REASONING = prev
  }
}

const MENU_PATTERNS = [
  /describe what you need in your own words/i,
  /i think you(?:'re| are) (?:trying to|might be)/i,
  /(?:^|\n)\s*1[.)]\s+.+\n\s*2[.)]/,
  /please choose an option/i,
]
const isMenuLike = (s: string) => MENU_PATTERNS.some(p => p.test(s))

async function run(): Promise<void> {
  process.stdout.write('\n══ Executive Experience Convergence — Certification ══\n')

  // ── A. Classifier owns the executive conversational class ────────────────────
  process.stdout.write('\n── A. Classifier — the 8 prompts are executive ──\n')
  for (const p of CERT_PROMPTS) {
    const c = classifyExecutiveConversation(p)
    check('A', `"${p}" → executive (${c.goal ?? 'none'})`, c.match)
  }
  // Counter-examples: mutations + narrow lookups must NOT be hijacked.
  check('A', 'direct mutation ("approve the orange 2 change") declined', !classifyExecutiveConversation('approve the orange 2 change').match)
  check('A', 'narrow lookup ("show me player Mateo\'s stats") declined', !classifyExecutiveConversation("show me player Mateo's stats").match)
  check('A', 'greeting ("good morning") declined', !classifyExecutiveConversation('good morning').match)

  // ── B. Router defers executive turns ONLY in primary mode ───────────────────
  process.stdout.write('\n── B. Canonical router — executive-first defer is mode-gated ──\n')
  // Single source of truth: isExecutiveReasoningEnabled() === (resolveExecutiveMode() === 'primary').
  // 'primary' (canonical) and its '1'/'true' aliases enable the executive_reasoning
  // defer; 'shadow' keeps the user on the legacy deterministic path (diagnostics run
  // in the action layer, not in routing); 'off'/unset is a no-op.
  for (const token of ['primary', '1', 'true']) {
    withFlag(token, () => {
      for (const p of CERT_PROMPTS) {
        const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
        check('B', `[${token}] "${p}" → stage=executive_reasoning, defers to brain`, r.stage === 'executive_reasoning' && r.matched === false && r.needsOpenAI === true)
      }
    })
  }
  for (const token of ['shadow', undefined]) {
    withFlag(token, () => {
      const r = routeDonnaConversation({ text: 'What should I do next?', directorCtx: CTX_STUB, route: '/director' })
      check('B', `[${token ?? 'off'}] router does NOT use executive_reasoning stage (baseline preserved)`, r.stage !== 'executive_reasoning')
    })
  }

  // ── C. Brain routes executive turns to live_ai_assist ONLY in primary mode ──
  process.stdout.write('\n── C. Brain — executive-first → live_ai_assist (mode-gated) ──\n')
  for (const token of ['primary', '1', 'true']) {
    withFlag(token, () => {
      for (const p of CERT_PROMPTS) {
        const res = processDonnaMessage(liveInput(p))
        check('C', `[${token}] "${p}" → action=live_ai_assist`, res.action === 'live_ai_assist')
      }
    })
  }
  for (const token of ['shadow', undefined]) {
    withFlag(token, () => {
      const res = processDonnaMessage(liveInput('What should I do next?'))
      check('C', `[${token ?? 'off'}] brain does NOT force live_ai_assist (baseline preserved)`, res.action !== 'live_ai_assist')
    })
  }

  // ── D. Quality gate strips Workflow-DONNA responses when context exists ──────
  process.stdout.write('\n── D. Response validator — menu/generic gate ──\n')
  {
    // Build a real packet with context (academy assembled + outstanding decision).
    const state = buildResolverStateFromLive(liveInput('What should I do next?'), 'academy_director', ACADEMY, legacyStub())
    const continuity = resolveContinuity(state)
    const plan = deriveReasoningGoal(state, continuity)
    const packet = resolveExecutiveContext(plan, state, {})

    const menu = 'I want to make sure I understand correctly. Would you like to:\n\n1. Complete curriculum\n2. Review players\n3. Plan a session\n\nOr describe what you need in your own words.'
    const v1 = validateExecutiveResponse(menu, packet, state)
    check('D', 'menu response is modified (not passed through)', v1.disposition === 'modified')
    check('D', 'menu/"own words" text removed from output', !isMenuLike(v1.finalText))

    const generic = "I think you're trying to do something. What would you like to do?"
    const v2 = validateExecutiveResponse(generic, packet, state)
    check('D', 'generic "I think you\'re trying to…" rewritten', !/i think you/i.test(v2.finalText))

    const good = 'Your review queue is clear. The first thing I\'d take on is assigning curriculum levels to your active players — want me to start there?'
    const v3 = validateExecutiveResponse(good, packet, state)
    check('D', 'a grounded executive answer is accepted', v3.disposition === 'accepted')
  }

  // ── E. Executive pipeline never returns a menu for the 8 prompts ─────────────
  process.stdout.write('\n── E. Executive pipeline — no workflow-menu output ──\n')
  clearOpenAICallLog(); clearShadowRecords()
  for (const p of CERT_PROMPTS) {
    const state = buildResolverStateFromLive(liveInput(p), 'academy_director', ACADEMY, legacyStub())
    const turn = await runExecutiveOperatingTurn(state)
    const ok = !isMenuLike(turn.finalResponse) && turn.validation.disposition !== 'rejected' && turn.packet.assembled.length > 0
    check('E', `"${p}" → grounded, no menu (goal=${turn.plan.goal}, sources=${turn.packet.assembled.length})`, ok)
  }

  // ── F. LIVE proof (gated on a real OPENAI_API_KEY) ───────────────────────────
  process.stdout.write('\n── F. LIVE proof — real OpenAI for the 8 prompts ──\n')
  clearOpenAICallLog(); clearShadowRecords()
  const hasKey = !!process.env.OPENAI_API_KEY
  if (!hasKey) {
    process.stdout.write('   ⚠ SKIPPED — no OPENAI_API_KEY in this environment.\n')
    process.stdout.write('   Honest status: the LIVE OpenAI call cannot be proven here. Offline routing +\n')
    process.stdout.write('   gate are certified above; set OPENAI_API_KEY and re-run to prove source=openai.\n')
  } else {
    let allReal = true
    for (const p of CERT_PROMPTS) {
      const state = buildResolverStateFromLive(liveInput(p), 'academy_director', ACADEMY, legacyStub())
      const turn = await runExecutiveOperatingTurn(state)
      const real = turn.reasoning.source === 'openai'
      if (!real) allReal = false
      process.stdout.write(`   • "${p}" → goal=${turn.plan.goal} realOpenAI=${real ? 'YES' : 'NO'} disposition=${turn.validation.disposition} ${turn.reasoning.latencyMs}ms\n`)
      process.stdout.write(`       → ${turn.finalResponse.slice(0, 140).replace(/\n/g, ' ')}\n`)
    }
    check('F', 'OpenAI called for real on every prompt (source=openai)', allReal)
    process.stdout.write(`   ${formatExecutiveUsage(summarizeExecutiveUsage())}\n`)
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write(`\n══ Result: ${passed}/${total} (${pct.toFixed(1)}%) ══\n`)
  if (failed > 0) {
    process.stdout.write('Failures:\n')
    for (const f of failures) process.stdout.write(`  ✗ ${f}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write('All convergence checks passed.\n')
  }
}

run().catch(err => {
  process.stderr.write(`Certification crashed: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exitCode = 1
})

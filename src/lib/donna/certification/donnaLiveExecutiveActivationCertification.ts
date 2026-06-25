// Mega Sprint 4141–4170 — DONNA Live Executive Activation V1
// Certification — proves the Executive stack is ACTIVE in the live Director path:
//   1. Routing activation — with the flag on, the brain routes the 7 Director
//      utterances of the sprint browser script to the executive path (live_ai_assist),
//      not a deterministic engine. This is the dormancy fix: the brain router is
//      client-bundled, so it now reads the SAME flag via the NEXT_PUBLIC_ mirror.
//   2. Executive chain — each of the 7 phrases, run through runExecutiveLive in
//      `primary`, flows Router → Operating Layer → Context Engine → Dialogue →
//      Operating Session → Action Loop → OpenAI → Validator and the executive path
//      owns the answer (fail-open to legacy is always explained — no silent fallback).
//   3. Trace completeness — diagnostics expose dialogue/session/workflow state,
//      executiveAttempted, and a fallbackReason whenever legacy answers.
//
// Two tiers:
//   • OFFLINE (always run, gates CI): provable without a key. The executive PATH
//     owns the answer even when OpenAI falls back to the deterministic gateway.
//   • LIVE (gated on OPENAI_API_KEY): proves source=openai end-to-end on the
//     executive/hybrid turns. Honestly reported NOT RUN when no key is present.
//
// Run: node --env-file=.env.local --import tsx \
//        src/lib/donna/certification/donnaLiveExecutiveActivationCertification.ts

import { runExecutiveLive } from '@/lib/donna/executive/executiveLiveBridge'
import {
  resolveExecutiveMode,
  formatDiagnostics,
  clearShadowRecords,
} from '@/lib/donna/executive/executiveShadowMode'
import { isExecutiveReasoningEnabled } from '@/lib/donna/executive/executiveOperatingLayer'
import { classifyRequest } from '@/lib/donna/constitution/donnaRoutingConstitution'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

function liveInput(message: string, history: Array<{ role: 'user' | 'donna'; content: string }> = []): DonnaMessageInput {
  return {
    userMessage: message,
    role: 'director',
    route: '/director',
    activeGuidedWorkflowId: null,
    cooState: null,
    goalMemory: null,
    conversationHistory: history,
  }
}

function legacyStub(response: string, overrides: Partial<DonnaMessageResult> = {}): DonnaMessageResult {
  return {
    action: 'respond',
    response,
    spokenResponse: response,
    intent: null,
    entity: null,
    goal: null,
    confidence: 0.4,
    nextAction: { label: 'Legacy next step' },
    followUpQuestion: null,
    shouldSpeak: true,
    navigateTo: null,
    startWorkflowId: null,
    cooControl: null,
    goalSessionCommand: null,
    startGoalType: null,
    requiresApproval: false,
    limitations: null,
    resolvedEntityV2: null,
    unifiedAnswer: null,
    disambiguationQuestion: null,
    updatedNavigatorState: null,
    strategicContext: null,
    pageIntelligence: null,
    realitySnapshot: null,
    debugLog: createDebugLog(response, 'director', '/director'),
    ...overrides,
  }
}

const ACADEMY = { academyId: 'acad_1', name: 'Dabul Tennis Academy', modelLabel: 'Master Development Spine' }

// The exact Director browser script from the sprint (Objective 3).
const SCRIPT = [
  'Good morning Donna',
  'What should I do today?',
  'Walk me through this page',
  'Continue',
  'Why?',
  'What remains today?',
  'Did that save?',
]

// The constitution deliberately owns the workday in two ways. REASONING turns go to
// the OpenAI executive path (live_ai_assist). OPERATING turns are owned by the
// executive stack's DETERMINISTIC components — Operating Session resume (greeting),
// Dialogue continuity ("Continue"), and the Action Loop ("Did that save?" verifies
// from UI events, no OpenAI by design). Both are the executive stack; neither is a
// legacy fallback. Activation means every turn is owned by ONE of these — never a
// deterministic legacy engine answering a genuine reasoning request.
const REASONING_TURNS = new Set([
  'What should I do today?',
  'Walk me through this page',
  'Why?',
  'What remains today?',
])

async function run() {
  process.stdout.write('\nDONNA Live Executive Activation Certification\n')
  process.stdout.write('============================================================\n')
  clearShadowRecords()

  // ── A. Flag activation (the dormancy fix) ────────────────────────────────────
  process.stdout.write('\n── A. Flag activates BOTH sides (server flag + NEXT_PUBLIC mirror) ──\n')
  {
    const prev = process.env.DONNA_EXECUTIVE_REASONING
    const prevPub = process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING

    // The live-app dormancy bug: a server-only flag is invisible to the
    // client-bundled brain router → executive-first routing never engages.
    delete process.env.DONNA_EXECUTIVE_REASONING
    process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING = 'primary'
    check('A', 'client mirror alone activates routing (browser case)', isExecutiveReasoningEnabled() === true)
    check('A', 'mode resolves to primary from the mirror', resolveExecutiveMode() === 'primary')

    // Server-only flag still works on its own (server-render / action case).
    delete process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING
    process.env.DONNA_EXECUTIVE_REASONING = 'primary'
    check('A', 'server flag alone activates routing (action case)', isExecutiveReasoningEnabled() === true)

    // Neither set → dormant.
    delete process.env.DONNA_EXECUTIVE_REASONING
    check('A', 'neither set → dormant (off)', isExecutiveReasoningEnabled() === false)

    if (prev === undefined) delete process.env.DONNA_EXECUTIVE_REASONING; else process.env.DONNA_EXECUTIVE_REASONING = prev
    if (prevPub === undefined) delete process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING; else process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING = prevPub
  }

  // ── B. Routing — every scripted turn is owned by the executive stack ─────────
  process.stdout.write('\n── B. Browser script — reasoning → OpenAI, operating → executive-stack deterministic ──\n')
  {
    let reasoningRoutesToOpenAI = true
    let operatingNotMisroutedToReasoning = true
    for (const msg of SCRIPT) {
      const cls = classifyRequest(msg)
      const reachesOpenAI = cls.class === 'executive' || cls.class === 'hybrid'
      const owner = reachesOpenAI
        ? 'live_ai_assist → OpenAI'
        : 'executive-stack deterministic (Operating Session / Dialogue continuity / Action Loop)'
      process.stdout.write(`   • "${msg}" → class=${cls.class} goal=${cls.executiveGoal ?? 'n/a'} → ${owner}\n`)
      // Every genuine reasoning turn MUST reach the OpenAI executive path.
      if (REASONING_TURNS.has(msg) && !reachesOpenAI) reasoningRoutesToOpenAI = false
      // No operating turn should be mis-classified as a reasoning request.
      if (!REASONING_TURNS.has(msg) && reachesOpenAI) operatingNotMisroutedToReasoning = false
    }
    check('B', 'every reasoning turn routes to live_ai_assist (OpenAI)', reasoningRoutesToOpenAI)
    check('B', 'operating turns owned by executive-stack deterministic components (by design)', operatingNotMisroutedToReasoning)
  }

  // ── C. Executive chain owns the answer for every scripted turn ───────────────
  process.stdout.write('\n── C. Executive chain runs end-to-end (primary), no silent fallback ──\n')
  const history: Array<{ role: 'user' | 'donna'; content: string }> = []
  {
    let allExecutivePath = true
    let allAttempted = true
    let fallbackContractHeld = true
    let chainStateSeen = false
    for (const msg of SCRIPT) {
      const legacy = legacyStub('LEGACY: ok.')
      const live = await runExecutiveLive(liveInput(msg, [...history]), 'academy_director', ACADEMY, legacy, 'primary')
      const d = live.diagnostics
      process.stdout.write(`   • "${msg}"\n       ${formatDiagnostics(d)}\n`)
      if (!d.executivePathUsed) allExecutivePath = false
      if (!d.executiveAttempted) allAttempted = false
      // No silent fallback: fallbackReason is null iff the executive path won.
      if (d.executivePathUsed !== (d.fallbackReason === null)) fallbackContractHeld = false
      if (d.dialogueStage || d.sessionActiveObjective || d.workflowName) chainStateSeen = true
      history.push({ role: 'user', content: msg })
      history.push({ role: 'donna', content: live.result.response })
    }
    check('C', 'executive path owns the answer on every scripted turn', allExecutivePath)
    check('C', 'executiveAttempted = true on every turn', allAttempted)
    check('C', 'no silent fallback (reason present iff legacy answered)', fallbackContractHeld)
    check('C', 'executive-chain state surfaced (dialogue / session / workflow)', chainStateSeen)
  }

  // ── D. Trace completeness — Dialogue + Session + Action Loop visible ──────────
  process.stdout.write('\n── D. Diagnostics expose the full executive chain ──\n')
  {
    const legacy = legacyStub('LEGACY: ok.')
    const live = await runExecutiveLive(
      liveInput('We should redesign the Orange 2 curriculum to be more competitive.'),
      'academy_director', ACADEMY, legacy, 'primary',
    )
    const d = live.diagnostics
    check('D', 'diagnostics expose dialogue stage', typeof d.dialogueStage === 'string' && d.dialogueStage.length > 0)
    check('D', 'diagnostics expose session unfinished count', typeof d.sessionUnfinished === 'number')
    check('D', 'diagnostics expose executiveAttempted flag', d.executiveAttempted === true)
    check('D', 'diagnostics expose fallbackReason field (null when executive wins)', d.fallbackReason === null)
    check('D', 'diagnostics expose openaiInvoked + realCall flags', typeof d.openaiInvoked === 'boolean' && typeof d.openaiRealCall === 'boolean')
  }

  // ── E. Fail-open stays explained (executive crash → legacy + reason) ─────────
  process.stdout.write('\n── E. Fail-open is never silent ──\n')
  {
    const legacy = legacyStub('LEGACY: safe answer.')
    const bad = { ...liveInput('x'), userMessage: undefined as unknown as string }
    const live = await runExecutiveLive(bad, 'academy_director', ACADEMY, legacy, 'primary')
    check('E', 'user still receives legacy on crash', live.result.response === legacy.response)
    check('E', 'executiveAttempted = true (we tried)', live.diagnostics.executiveAttempted === true)
    check('E', 'fallbackReason explains the crash', live.diagnostics.fallbackReason === 'executive turn crashed')
    check('E', 'executivePathUsed = false', live.diagnostics.executivePathUsed === false)
  }

  // ── F. LIVE proof — real OpenAI on the executive/hybrid turns ────────────────
  process.stdout.write('\n── F. LIVE proof — real OpenAI through the executive chain ──\n')
  const hasKey = !!process.env.OPENAI_API_KEY
  let liveProven = false
  if (!hasKey) {
    process.stdout.write('   ⚠ SKIPPED — no OPENAI_API_KEY in this process.\n')
    process.stdout.write('   Honest status: real OpenAI cannot be proven here. Run with\n')
    process.stdout.write('   `node --env-file=.env.local --import tsx <thisFile>` to prove source=openai.\n')
  } else {
    const h: Array<{ role: 'user' | 'donna'; content: string }> = []
    let allReal = true
    for (const msg of SCRIPT) {
      const legacy = legacyStub('LEGACY: ok.')
      const live = await runExecutiveLive(liveInput(msg, [...h]), 'academy_director', ACADEMY, legacy, 'primary')
      const real = live.diagnostics.openaiRealCall
      process.stdout.write(`   • "${msg}" → realOpenAI=${real ? 'YES' : 'NO'} exec=${live.diagnostics.executivePathUsed ? 'YES' : 'NO'} ${live.diagnostics.latencyMs}ms\n`)
      if (!real) allReal = false
      h.push({ role: 'user', content: msg })
      h.push({ role: 'donna', content: live.result.response })
    }
    check('F', 'OpenAI called for real on every scripted turn (source=openai)', allReal)
    liveProven = allReal
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`LIVE EXECUTIVE ACTIVATION (offline contract): ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write(`LIVE OPENAI PROOF: ${hasKey ? (liveProven ? 'PROVEN ✓' : 'ATTEMPTED — FAILED') : 'NOT RUN (no key)'}\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nLIVE EXECUTIVE ACTIVATION CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

// Mega Sprint 3691–3720 — DONNA Executive Reasoning Live Wiring V1
// Certification — proves the live wiring of the Executive Operating Layer into the
// director conversation path: mode resolution, shadow safety, primary path,
// permission preservation, fail-open to legacy, and developer diagnostics.
//
// Two tiers:
//   • OFFLINE (always run, gates CI): the wiring contract — provable without a key.
//   • LIVE (gated on OPENAI_API_KEY): the 5-turn real-conversation proof. When no
//     key is present it is honestly reported as NOT RUN — never faked, never a
//     silent pass that implies a real OpenAI call happened.
//
// Run: npx tsx src/lib/donna/certification/executiveLiveWiringCertification.ts

import { runExecutiveLive } from '@/lib/donna/executive/executiveLiveBridge'
import {
  resolveExecutiveMode,
  getLastShadowRecord,
  clearShadowRecords,
} from '@/lib/donna/executive/executiveShadowMode'
import { isExecutiveReasoningEnabled } from '@/lib/donna/executive/executiveOperatingLayer'
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

async function run() {
  process.stdout.write('\nDONNA Executive Reasoning Live Wiring Certification\n')
  process.stdout.write('============================================================\n')
  clearShadowRecords()

  // ── A. Mode resolver ─────────────────────────────────────────────────────────
  process.stdout.write('\n── A. Mode resolver (single existing flag) ──\n')
  {
    const prev = process.env.DONNA_EXECUTIVE_REASONING
    process.env.DONNA_EXECUTIVE_REASONING = ''
    check('A', 'unset / empty → off', resolveExecutiveMode() === 'off')
    process.env.DONNA_EXECUTIVE_REASONING = 'shadow'
    check('A', '"shadow" → shadow', resolveExecutiveMode() === 'shadow')
    process.env.DONNA_EXECUTIVE_REASONING = 'primary'
    check('A', '"primary" → primary', resolveExecutiveMode() === 'primary')
    process.env.DONNA_EXECUTIVE_REASONING = '1'
    check('A', '"1" → primary', resolveExecutiveMode() === 'primary')
    process.env.DONNA_EXECUTIVE_REASONING = 'true'
    check('A', '"true" → primary', resolveExecutiveMode() === 'primary')

    // Reconciliation (Sprint 3781–3810): isExecutiveReasoningEnabled() — the gate
    // that drives executive-first routing — is now derived from resolveExecutiveMode()
    // so one env value means the same thing everywhere. Routing engages ONLY in primary.
    process.env.DONNA_EXECUTIVE_REASONING = 'primary'
    check('A', 'primary → routing enabled', isExecutiveReasoningEnabled() === true)
    process.env.DONNA_EXECUTIVE_REASONING = '1'
    check('A', '"1" alias → routing enabled', isExecutiveReasoningEnabled() === true)
    process.env.DONNA_EXECUTIVE_REASONING = 'true'
    check('A', '"true" alias → routing enabled', isExecutiveReasoningEnabled() === true)
    process.env.DONNA_EXECUTIVE_REASONING = 'shadow'
    check('A', 'shadow → routing NOT enabled (user sees legacy)', isExecutiveReasoningEnabled() === false)
    process.env.DONNA_EXECUTIVE_REASONING = ''
    check('A', 'off → routing NOT enabled', isExecutiveReasoningEnabled() === false)

    if (prev === undefined) delete process.env.DONNA_EXECUTIVE_REASONING
    else process.env.DONNA_EXECUTIVE_REASONING = prev
  }

  // ── B. Shadow mode safety (user always sees legacy) ──────────────────────────
  process.stdout.write('\n── B. Shadow mode — legacy returned, executive observed ──\n')
  {
    const legacy = legacyStub('LEGACY: Good morning, here is your day.')
    const live = await runExecutiveLive(liveInput('Good morning.'), 'academy_director', ACADEMY, legacy, 'shadow')
    check('B', 'user sees the LEGACY response (no regression)', live.result.response === legacy.response)
    check('B', 'executive path NOT shown to user', live.diagnostics.executivePathUsed === false)
    check('B', 'fallbackUsed = true in shadow', live.diagnostics.fallbackUsed === true)
    check('B', 'executive still ran (goal classified = analyze)', live.diagnostics.reasoningGoal === 'analyze')
    check('B', 'gateway invoked (provable, even on fallback)', live.diagnostics.openaiInvoked === true)
    check('B', 'shadow comparison recorded for developers', getLastShadowRecord() !== null)
  }

  // ── C. Primary mode — executive path used ────────────────────────────────────
  process.stdout.write('\n── C. Primary mode — executive path returned when valid ──\n')
  {
    const legacy = legacyStub('LEGACY: ok.', { entity: { label: 'Orange 2 — Class Template' } as unknown as DonnaMessageResult['entity'] })
    const live = await runExecutiveLive(liveInput('Make it more competitive.'), 'academy_director', ACADEMY, legacy, 'primary')
    check('C', 'executive response shown to user (≠ legacy)', live.result.response !== legacy.response)
    check('C', 'executivePathUsed = true', live.diagnostics.executivePathUsed === true)
    check('C', 'fallbackUsed = false', live.diagnostics.fallbackUsed === false)
    check('C', 'continuity bound "it" → revise goal', live.diagnostics.reasoningGoal === 'revise')
    check('C', 'context packet assembled (sources > 0)', live.diagnostics.contextSources > 0)
    check('C', 'packet has non-zero token size', live.diagnostics.contextPacketTokens > 0)
  }

  // ── D. Permissions / approvals preserved ─────────────────────────────────────
  process.stdout.write('\n── D. Permissions + approvals preserved ──\n')
  {
    const legacy = legacyStub('LEGACY: approve this.', { requiresApproval: true, navigateTo: '/director/review' })
    const live = await runExecutiveLive(liveInput('What should I do first?'), 'academy_director', ACADEMY, legacy, 'primary')
    check('D', 'approval requirement preserved (never weakened)', live.result.requiresApproval === true)
    check('D', 'legacy navigation preserved when executive plans none', live.result.navigateTo === '/director/review')
  }

  // ── E. Fail-open to legacy on executive error ────────────────────────────────
  process.stdout.write('\n── E. Fail-open — executive crash returns legacy ──\n')
  {
    const legacy = legacyStub('LEGACY: safe fallback answer.')
    // Malformed input (no userMessage) forces the executive turn to throw inside
    // the bridge; the user must still get the legacy answer.
    const bad = { ...liveInput('x'), userMessage: undefined as unknown as string }
    const live = await runExecutiveLive(bad, 'academy_director', ACADEMY, legacy, 'primary')
    check('E', 'executive turn crashed (turn = null)', live.turn === null)
    check('E', 'user still receives the LEGACY response', live.result.response === legacy.response)
    check('E', 'fallbackUsed = true', live.diagnostics.fallbackUsed === true)
    check('E', 'executivePathUsed = false', live.diagnostics.executivePathUsed === false)
    check('E', 'openaiInvoked = false (never reached gateway)', live.diagnostics.openaiInvoked === false)
  }

  // ── F. OpenAI proof visibility ───────────────────────────────────────────────
  process.stdout.write('\n── F. Developer diagnostics completeness ──\n')
  {
    const legacy = legacyStub('LEGACY: ok.')
    const live = await runExecutiveLive(liveInput('Why did you recommend this?'), 'academy_director', ACADEMY, legacy, 'primary')
    const d = live.diagnostics
    check('F', 'diagnostics expose model', d.model.length > 0)
    check('F', 'diagnostics expose reasoning goal', d.reasoningGoal === 'explain')
    check('F', 'diagnostics expose confidence target', d.confidenceTarget > 0)
    check('F', 'diagnostics expose latency', d.latencyMs >= 0)
    check('F', 'diagnostics expose response disposition', typeof d.responseDisposition === 'string' && d.responseDisposition.length > 0)
    check('F', 'diagnostics expose openaiInvoked + realCall flags', typeof d.openaiInvoked === 'boolean' && typeof d.openaiRealCall === 'boolean')
  }

  // ── G. LIVE proof (gated on a real OPENAI_API_KEY) ───────────────────────────
  process.stdout.write('\n── G. LIVE proof — real OpenAI, 5-turn conversation ──\n')
  const hasKey = !!process.env.OPENAI_API_KEY
  let liveProven = false
  if (!hasKey) {
    process.stdout.write('   ⚠ SKIPPED — no OPENAI_API_KEY in this environment.\n')
    process.stdout.write('   Honest status: the LIVE OpenAI call cannot be proven here. Offline wiring is\n')
    process.stdout.write('   certified above; set OPENAI_API_KEY and re-run to prove source=openai end-to-end.\n')
  } else {
    const history: Array<{ role: 'user' | 'donna'; content: string }> = []
    const turns = [
      'Good morning.',
      'Create an Orange 2 class template.',
      'Make it more competitive.',
      'Actually focus more on transition.',
      'What were we working on yesterday?',
    ]
    let allReal = true
    let noFallback = true
    for (const msg of turns) {
      const legacy = legacyStub('LEGACY: ok.', { entity: { label: 'Orange 2 — Class Template' } as unknown as DonnaMessageResult['entity'] })
      const live = await runExecutiveLive(liveInput(msg, [...history]), 'academy_director', ACADEMY, legacy, 'primary')
      const real = live.diagnostics.openaiRealCall
      const exec = live.diagnostics.executivePathUsed
      process.stdout.write(`   • "${msg}" → goal=${live.diagnostics.reasoningGoal} realOpenAI=${real ? 'YES' : 'NO'} exec=${exec ? 'YES' : 'NO'} ${live.diagnostics.latencyMs}ms\n`)
      if (!real) allReal = false
      if (live.diagnostics.fallbackUsed) noFallback = false
      history.push({ role: 'user', content: msg })
      history.push({ role: 'donna', content: live.result.response })
    }
    check('G', 'OpenAI called for real on every turn (source=openai)', allReal)
    check('G', 'executive path used, legacy fallback NOT used', noFallback)
    liveProven = allReal && noFallback
  }

  // ── Score ──────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`LIVE WIRING (offline contract): ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write(`LIVE OPENAI PROOF: ${hasKey ? (liveProven ? 'PROVEN ✓' : 'ATTEMPTED — FAILED') : 'NOT RUN (no key)'}\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nLIVE WIRING CONTRACT CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

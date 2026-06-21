// Executive Communication Policy — Pilot Mode Refinement Certification.
//
// Proves the Pilot Mode Executive Communication Policy:
//   1. Pilot Mode refinement is ON by default.
//   2. Every eligible response attempts refinement.
//   3. Safety-blocked responses are not refined.
//   4. Mutation requests are not refined.
//   5. Failed refinement returns the original response.
//   6. Facts are preserved.
//   7. Completion guidance is preserved.
//   8. RealitySnapshot remains the source of truth.
//
// Pure TypeScript, no DB, no network — the live refiner is dependency-injected so
// the policy is certified deterministically without an OPENAI_API_KEY.
//
// Run: npx tsx src/lib/donna/certification/pilotModeExecutiveRefinementCertification.ts

import {
  EXECUTIVE_COMMUNICATION_POLICY,
  EXECUTIVE_COMMUNICATION_CONTRACT,
  PILOT_MODE_REFINEMENT_DEFAULT_ON,
  isExecutiveRefinementEligible,
  isRefinementFactPreserving,
  applyExecutiveRefinement,
  buildExecutiveRefinementInstruction,
  type ExecutiveRefinementResult,
} from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) { passed++; process.stdout.write(`  ✓ ${label}\n`) }
  else { failed++; failures.push(label); process.stdout.write(`  ✗ ${label}\n`) }
}

// ── Minimal DonnaMessageResult fixture ──────────────────────────────────────────

function mk(overrides: Partial<DonnaMessageResult>): DonnaMessageResult {
  const base = {
    action: 'respond',
    response: 'You have 3 players ready for review. Next: open the review queue.',
    spokenResponse: 'You have 3 players ready for review. Next: open the review queue.',
    intent: null,
    entity: null,
    goal: null,
    confidence: 0.9,
    nextAction: null,
    followUpQuestion: null,
    shouldSpeak: false,
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
    debugLog: {},
    updatedNavigatorState: null,
    strategicContext: null,
    pageIntelligence: null,
    realitySnapshot: null,
    ...overrides,
  }
  return base as unknown as DonnaMessageResult
}

// ── Injectable refiners (stand in for the live OpenAI gateway) ───────────────────

/** A successful, fact-preserving executive rewrite (same numbers, same next step). */
function makeCountingRefiner(rewrite: (draft: string) => string) {
  let calls = 0
  const refine = async (params: { draft: string }): Promise<ExecutiveRefinementResult> => {
    calls++
    const text = rewrite(params.draft)
    return { text, refined: true, source: 'openai', latencyMs: 1 }
  }
  return { refine: refine as never, calls: () => calls }
}

/** Refiner that always fails (timeout / error simulation). */
const failingRefiner = (async (): Promise<ExecutiveRefinementResult> => {
  throw new Error('simulated OpenAI failure')
}) as never

// ── 1. Pilot Mode refinement is ON by default ────────────────────────────────────

function p1(): void {
  process.stdout.write('\n── 1. Pilot Mode refinement is ON by default ──\n')
  check('policy.pilotMode.enabled === true', EXECUTIVE_COMMUNICATION_POLICY.pilotMode.enabled === true)
  check('policy.pilotMode.refineByDefault === true', EXECUTIVE_COMMUNICATION_POLICY.pilotMode.refineByDefault === true)
  check('PILOT_MODE_REFINEMENT_DEFAULT_ON === true', PILOT_MODE_REFINEMENT_DEFAULT_ON === true)
}

// ── 2. Every eligible response attempts refinement ───────────────────────────────

async function p2(): Promise<void> {
  process.stdout.write('\n── 2. Every eligible response attempts refinement ──\n')
  const eligibleResults = [
    mk({ response: 'You have 3 players ready for review. Next: open the review queue.' }),
    mk({ response: 'Attendance is healthy today. Next: confirm the 4pm group.' }),
    mk({ response: 'Two coaches submitted wrap-ups. Worth a quick scan before you leave.' }),
  ]
  for (const r of eligibleResults) {
    check(`eligible: "${r.response.slice(0, 32)}…"`, isExecutiveRefinementEligible(r).eligible === true)
  }
  // Each eligible response, run through the apply layer with the default pilot mode,
  // actually invokes the refiner.
  const counter = makeCountingRefiner((d) => `${d}`) // identity rewrite is still an attempt
  for (const r of eligibleResults) {
    await applyExecutiveRefinement(r, 'director', { refine: counter.refine })
  }
  check(`refiner attempted on all ${eligibleResults.length} eligible responses`, counter.calls() === eligibleResults.length)
}

// ── 3. Safety-blocked responses are not refined ──────────────────────────────────

async function p3(): Promise<void> {
  process.stdout.write('\n── 3. Safety-blocked responses are not refined ──\n')
  const blocked = mk({
    response: "I can't do that directly — sent to the review queue for approval.",
    requiresApproval: true,
    nextAction: { label: 'Open review queue', route: '/director/review' },
  })
  check('safety-blocked → ineligible', isExecutiveRefinementEligible(blocked).eligible === false)
  check('safety-blocked → reason "safety_blocked"', isExecutiveRefinementEligible(blocked).reason === 'safety_blocked')
  const counter = makeCountingRefiner((d) => `REWRITTEN: ${d}`)
  const out = await applyExecutiveRefinement(blocked, 'director', { refine: counter.refine })
  check('safety-blocked → refiner never called', counter.calls() === 0)
  check('safety-blocked → response unchanged', out.response === blocked.response)
}

// ── 4. Mutation requests are not refined ─────────────────────────────────────────

async function p4(): Promise<void> {
  process.stdout.write('\n── 4. Mutation requests are not refined ──\n')
  const mutation = mk({
    response: 'Promoting Jake to the next level.',
    requiresApproval: true,
  })
  check('mutation → ineligible', isExecutiveRefinementEligible(mutation).eligible === false)
  check('mutation → reason "mutation"', isExecutiveRefinementEligible(mutation).reason === 'mutation')
  const counter = makeCountingRefiner((d) => `REWRITTEN: ${d}`)
  const out = await applyExecutiveRefinement(mutation, 'director', { refine: counter.refine })
  check('mutation → refiner never called', counter.calls() === 0)
  check('mutation → response unchanged', out.response === mutation.response)
}

// ── 5. Failed refinement returns the original response ────────────────────────────

async function p5(): Promise<void> {
  process.stdout.write('\n── 5. Failed refinement returns the original response ──\n')
  const eligible = mk({ response: 'You have 3 players ready for review. Next: open the review queue.' })
  const out = await applyExecutiveRefinement(eligible, 'director', { refine: failingRefiner })
  check('failed refinement → original response preserved', out.response === eligible.response)
  check('failed refinement → original spokenResponse preserved', out.spokenResponse === eligible.spokenResponse)
  // A refiner that declines (refined: false) also returns the original.
  const declining = (async (): Promise<ExecutiveRefinementResult> =>
    ({ text: 'ignored', refined: false, source: 'fallback', latencyMs: 1 })) as never
  const out2 = await applyExecutiveRefinement(eligible, 'director', { refine: declining })
  check('declined refinement → original response preserved', out2.response === eligible.response)
}

// ── 6. Facts are preserved ───────────────────────────────────────────────────────

async function p6(): Promise<void> {
  process.stdout.write('\n── 6. Facts are preserved ──\n')
  const original = 'You have 3 players ready and 2 blocked. Attendance is 92% this week.'
  check('same numbers, reworded → fact-preserving',
    isRefinementFactPreserving(original, 'Three notes: 3 players ready, 2 blocked, attendance 92% this week.'))
  check('changed number → rejected',
    isRefinementFactPreserving(original, 'You have 4 players ready and 2 blocked. Attendance is 92% this week.') === false)
  check('added (fabricated) number → rejected',
    isRefinementFactPreserving(original, 'You have 3 players ready and 2 blocked. Attendance is 92% across 5 squads.') === false)
  check('over-expansion → rejected',
    isRefinementFactPreserving('Short.', 'Short. ' + 'x'.repeat(500)) === false)
  check('policy.mayNever forbids change_facts', EXECUTIVE_COMMUNICATION_POLICY.mayNever.includes('change_facts'))
  check('policy.mayNever forbids add_facts', EXECUTIVE_COMMUNICATION_POLICY.mayNever.includes('add_facts'))
  // The live refiner's guard (used inside refineExecutiveResponse) rejects any
  // fact-altering rewrite, so the grounded original survives.
  check('guard rejects a fact-altering rewrite',
    isRefinementFactPreserving(original, 'You have 7 players ready and 2 blocked. Attendance is 92% this week.') === false)
}

// ── 7. Completion guidance is preserved ──────────────────────────────────────────

async function p7(): Promise<void> {
  process.stdout.write('\n── 7. Completion guidance is preserved ──\n')
  check('policy lists next_step_guidance as improve-only',
    EXECUTIVE_COMMUNICATION_POLICY.mayImprove.includes('next_step_guidance'))
  check('policy lists completion_language as improve-only',
    EXECUTIVE_COMMUNICATION_POLICY.mayImprove.includes('completion_language'))
  const instruction = buildExecutiveRefinementInstruction('director')
  check('refinement instruction requires preserving the next step', /next step/i.test(instruction))
  // A fact-preserving rewrite that keeps the completion line passes through.
  const original = 'You have 3 players ready. Next: open the review queue.'
  const eligible = mk({ response: original, spokenResponse: original })
  const keepNext = makeCountingRefiner(() => '3 players are ready. Next: open the review queue.')
  const out = await applyExecutiveRefinement(eligible, 'director', { refine: keepNext.refine })
  check('refined response still contains the next-step guidance', /next:/i.test(out.response))
}

// ── 8. RealitySnapshot remains the source of truth ───────────────────────────────

async function p8(): Promise<void> {
  process.stdout.write('\n── 8. RealitySnapshot remains the source of truth ──\n')
  check('contract: reality always wins', EXECUTIVE_COMMUNICATION_CONTRACT.realityAlwaysWins === true)
  check('policy: reality always wins', EXECUTIVE_COMMUNICATION_POLICY.realityAlwaysWins === true)
  check('policy.mayNever forbids invent_reality', EXECUTIVE_COMMUNICATION_POLICY.mayNever.includes('invent_reality'))
  check('policy.mayNever forbids change_recommendations', EXECUTIVE_COMMUNICATION_POLICY.mayNever.includes('change_recommendations'))
  check('policy.onFailure returns the original grounded response',
    EXECUTIVE_COMMUNICATION_POLICY.onFailure === 'return_original_grounded_response')
  // Refinement may never create reality: with no grounded answer, it is ineligible.
  const ungrounded = mk({ response: '   ' })
  check('no grounded answer → ineligible (refinement never invents reality)',
    isExecutiveRefinementEligible(ungrounded).eligible === false)
  check('no grounded answer → reason "no_grounded_answer"',
    isExecutiveRefinementEligible(ungrounded).reason === 'no_grounded_answer')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('Executive Communication Policy — Pilot Mode Refinement Certification\n')
  process.stdout.write('============================================================\n')

  p1()
  await p2()
  await p3()
  await p4()
  await p5()
  await p6()
  await p7()
  await p8()

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`RESULT: ${passed}/${total} PASS (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(pct >= 100
    ? '\nCERTIFIED — Pilot Mode executive refinement is ON, eligible-only, fail-open, and fact-preserving.\n'
    : '\nNOT CERTIFIED — Executive Communication Policy gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

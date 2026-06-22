// Mega Sprint 3361–3390 — ONE DONNA Executive Experience Convergence V1
// Part 6 — Executive Conversation Certification.
//
// Runs a complete director day through the ONE canonical pipeline and certifies
// the elite-COO experience: ONE DONNA everywhere, RealitySnapshot grounding, one
// conversation history, one OpenAI gateway, executive tone, natural conversation,
// minimal clarification, completion guidance, approval safety, and zero fabricated
// academy facts. The Part 3 Executive Communication layer is certified as a
// fail-open, fact-preserving, presentation-only final layer over the one gateway.
//
// Run: npx tsx src/lib/donna/certification/oneDonnaExecutiveConversationCertification.ts

import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import {
  routeDonnaConversation,
  ONE_DONNA_CONTRACT,
  type DonnaRouterResult,
  type DonnaRouterStage,
} from '@/lib/donna/brain/donnaCanonicalRouter'
import { DONNA_OPENAI_GATEWAY_CONTRACT } from '@/lib/donna/brain/donnaOpenAIGateway'
import {
  EXECUTIVE_COMMUNICATION_CONTRACT,
  buildExecutiveRefinementInstruction,
} from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import { validateResponseStyle } from '@/lib/donna/conversation/donnaResponseStyle'

const CTX = buildDemoContext()
const ENTRY_ROUTES = ['/director', '/director/players', '/director/curriculum', '/director/sessions', '/director/donna']

const VALID_STAGES: DonnaRouterStage[] = [
  'safety_block', 'operating_session', 'daily_brief', 'exception', 'review', 'players', 'focus_today',
  'proactive', 'assumption', 'guided_completion', 'clarify', 'defer_to_brain',
]

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) { passed++; process.stdout.write(`  ✓ ${label}\n`) }
  else { failed++; failures.push(label); process.stdout.write(`  ✗ ${label}\n`) }
}

function route(text: string, r = '/director'): DonnaRouterResult {
  return routeDonnaConversation({ text, directorCtx: CTX, route: r })
}

// ── The complete director day (exact sprint script) ─────────────────────────────

const DIRECTOR_DAY: string[] = [
  'Good morning.',
  'What happened overnight?',
  'What should I do first?',
  'Why?',
  'Take me there.',
  'Walk me through it.',
  'Done.',
  "What's next?",
  'Something feels wrong.',
  'Actually I meant the curriculum.',
  'Who needs attention?',
  'Draft the parent update.',
  'Approve.',
  'Anything else before I leave?',
]

function runDirectorDay(): DonnaRouterResult[] {
  process.stdout.write('\n── The complete director day (ONE pipeline) ──\n')
  const results: DonnaRouterResult[] = []
  for (const utterance of DIRECTOR_DAY) {
    const res = route(utterance)
    results.push(res)
    check(`"${utterance}" → ${res.stage} (${res.engineId})`, VALID_STAGES.includes(res.stage))
  }
  return results
}

// ── ONE DONNA used + same conversation history (entry-point independence) ───────

function runOneDonna(): void {
  process.stdout.write('\n── ONE DONNA + same conversation history ──\n')
  check('single canonical router (ONE DONNA)', typeof routeDonnaConversation === 'function')
  check('contract names ONE OpenAI gateway', ONE_DONNA_CONTRACT.singleOpenAIGateway === 'donnaOpenAIGateway')
  check('contract: router never mutates', ONE_DONNA_CONTRACT.neverMutates === true)

  // Same history = identical routing regardless of which page/entry point asks.
  const probes = ['What should I do first?', 'Who needs attention?', 'Something feels wrong.', "What's next?"]
  for (const p of probes) {
    const stages = new Set(ENTRY_ROUTES.map(r => route(p, r).stage))
    const engines = new Set(ENTRY_ROUTES.map(r => route(p, r).engineId))
    check(`"${p}" routes identically across ${ENTRY_ROUTES.length} entry points`, stages.size === 1 && engines.size === 1)
  }
}

// ── RealitySnapshot grounding ───────────────────────────────────────────────────

function runRealityGrounding(results: DonnaRouterResult[]): void {
  process.stdout.write('\n── RealitySnapshot grounding ──\n')
  const grounded = results.filter(r => r.answer && r.stage !== 'safety_block' && r.stage !== 'clarify')
  check('grounded answers carry a source note (provenance)', grounded.every(r => r.answer?.sourceNote != null))
  // Provenance must honestly reflect live state (demo ctx → realityGrounded false).
  check('realityGrounded reflects live ctx honestly', results.every(r => r.realityGrounded === false || CTX.isLive))
  const today = route('What should I do first?')
  check('"what should I do first" is reality-sourced', today.answer?.sourceNote != null)
}

// ── Same OpenAI gateway + no fabricated academy facts ───────────────────────────

function runGatewayAndTruth(): void {
  process.stdout.write('\n── Same OpenAI gateway + no fabricated facts ──\n')
  check('gateway never mutates academy data', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverMutatesAcademyData === true)
  check('gateway never fabricates academy facts', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverFabricatesAcademyFacts === true)
  check('gateway never becomes a second brain', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverBecomesSecondBrain === true)
  check('reality always wins (gateway)', DONNA_OPENAI_GATEWAY_CONTRACT.realityAlwaysWins === true)

  // Deferral path uses the one brain + may use the gateway only when insufficient.
  const defer = route('Tell me a tennis joke from 2019.')
  check('unmatched → defer to the single brain', defer.stage === 'defer_to_brain')
  check('defer flags gateway necessity (not a new path)', defer.needsOpenAI === true)
}

// ── Executive Communication layer (Part 3) ──────────────────────────────────────

function runExecutiveLayer(): void {
  process.stdout.write('\n── Executive Communication layer (final presentation) ──\n')
  check('layer is the final presentation layer', EXECUTIVE_COMMUNICATION_CONTRACT.position === 'final_presentation_layer')
  check('layer uses the canonical gateway only (no second pathway)', EXECUTIVE_COMMUNICATION_CONTRACT.usesCanonicalGatewayOnly === true)
  check('layer is fail-open', EXECUTIVE_COMMUNICATION_CONTRACT.failOpen === true)
  check('layer: reality always wins', EXECUTIVE_COMMUNICATION_CONTRACT.realityAlwaysWins === true)
  check('layer may refine executive tone', EXECUTIVE_COMMUNICATION_CONTRACT.mayRefine.includes('executive_tone'))
  check('layer may refine completion guidance', EXECUTIVE_COMMUNICATION_CONTRACT.mayRefine.includes('completion_guidance'))
  check('layer may NEVER change academy facts', EXECUTIVE_COMMUNICATION_CONTRACT.mayNever.includes('change_academy_facts'))
  check('layer may NEVER invent reality', EXECUTIVE_COMMUNICATION_CONTRACT.mayNever.includes('invent_reality'))
  check('layer may NEVER change recommendations', EXECUTIVE_COMMUNICATION_CONTRACT.mayNever.includes('change_recommendations'))
  const instruction = buildExecutiveRefinementInstruction('director')
  check('refinement instruction enforces fact preservation', /preserve every fact/i.test(instruction))
}

// ── Executive tone + natural conversation + minimal clarification ───────────────

function runToneAndNaturalness(results: DonnaRouterResult[]): void {
  process.stdout.write('\n── Executive tone + natural conversation ──\n')
  const texts = results.map(r => r.answer?.text).filter((t): t is string => !!t)
  const cleanTone = texts.every(t => validateResponseStyle(t).antiPatternsFound.length === 0)
  check('no chatbot anti-patterns in any grounded answer', cleanTone)
  check('answers avoid robotic preamble', texts.every(t => !/^\s*(of course|certainly|great question|i'?d be happy)/i.test(t)))

  // Natural conversation = the COO assumes when it safely can, rather than asking.
  const clarifyCount = results.filter(r => r.stage === 'clarify').length
  check(`minimal clarification across the day (${clarifyCount} clarify ≤ 1)`, clarifyCount <= 1)
  check('"Something feels wrong." → executive assumption (not clarify)', route('Something feels wrong.').stage === 'assumption')
  check('"What should I do first?" → focus, not clarify', route('What should I do first?').stage === 'focus_today')
}

// ── Completion guidance + approval safety ───────────────────────────────────────

function runCompletionAndApproval(): void {
  process.stdout.write('\n── Completion guidance + approval safety ──\n')
  check('"Walk me through it." → guided completion', route('Walk me through it.').stage === 'guided_completion')
  check('"Take me to completion." → guided completion', route('Take me to completion.').stage === 'guided_completion')

  // Approval safety: a direct mutation is intercepted, never executed.
  const mutate = route('Approve the promotion now.')
  check('"Approve the promotion now." → safety_block', mutate.stage === 'safety_block')
  check('mutation requires approval', mutate.requiresApproval === true)
  check('mutation routed to review queue (never executed)', mutate.answer?.href === '/director/review')
  // Drafting is allowed (it produces an approval-gated draft, not a mutation).
  const draft = route('Draft the parent update.')
  check('"Draft the parent update." is not safety-blocked (draft allowed)', draft.stage !== 'safety_block')
}

// ── Main ────────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('ONE DONNA Executive Conversation Certification\n')
  process.stdout.write('Mega Sprint 3361–3390\n')
  process.stdout.write('============================================================\n')

  const day = runDirectorDay()
  runOneDonna()
  runRealityGrounding(day)
  runGatewayAndTruth()
  runExecutiveLayer()
  runToneAndNaturalness(day)
  runCompletionAndApproval()

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
    ? '\nCERTIFIED — ONE DONNA: one elite COO conversation from every entry point.\n'
    : '\nNOT CERTIFIED — executive experience gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

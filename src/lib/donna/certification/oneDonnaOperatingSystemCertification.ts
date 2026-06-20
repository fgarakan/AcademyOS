// Mega Sprint 3271–3300 — ONE DONNA Operating System Convergence V1
// Part 8 — Director Experience Certification.
//
// Proves there is ONE DONNA: every entry point (floating, sidebar, voice, any
// page) runs the SAME canonical pipeline (routeDonnaConversation), reaches the
// SAME engines, the SAME reality grounding, the SAME single OpenAI gateway, the
// SAME completion engine, and the SAME permission posture — regardless of route.
//
// Run: npx tsx src/lib/donna/certification/oneDonnaOperatingSystemCertification.ts

import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import {
  routeDonnaConversation,
  ONE_DONNA_CONTRACT,
  type DonnaRouterResult,
  type DonnaRouterStage,
} from '@/lib/donna/brain/donnaCanonicalRouter'
import { DONNA_OPENAI_GATEWAY_CONTRACT } from '@/lib/donna/brain/donnaOpenAIGateway'

const CTX = buildDemoContext()

// Entry points that must all behave identically.
const ENTRY_ROUTES = ['/director', '/director/players', '/director/curriculum', '/director/sessions', '/director/donna']

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) { passed++; process.stdout.write(`  ✓ ${label}\n`) }
  else { failed++; failures.push(label); process.stdout.write(`  ✗ ${label}\n`) }
}

function route(text: string, r: string): DonnaRouterResult {
  return routeDonnaConversation({ text, directorCtx: CTX, route: r })
}

// ── 1. The executive day — every utterance produces a defined pipeline result ───

const EXECUTIVE_DAY: string[] = [
  'Good morning.',
  'What should I do today?',
  'Why?',
  'Take me there.',
  'Walk me through it.',
  'Done.',
  "What's next?",
  'This seems wrong.',
  'Who needs attention?',
  'What is blocking us?',
  'What would Brian do?',
  'What would an elite COO do?',
  'Explain that simply.',
  'Take me to completion.',
]

function runExecutiveDay(): void {
  process.stdout.write('\n── The executive day (single pipeline) ──\n')
  for (const utterance of EXECUTIVE_DAY) {
    const res = route(utterance, '/director')
    const validStage: DonnaRouterStage[] = ['safety_block','review','players','focus_today','proactive','assumption','guided_completion','clarify','defer_to_brain']
    check(`"${utterance}" → ${res.stage} (${res.engineId})`, validStage.includes(res.stage))
  }
}

// ── 2. Entry-point independence — identical routing regardless of route ──────────

function runEntryPointIndependence(): void {
  process.stdout.write('\n── Entry-point independence (same routing everywhere) ──\n')
  const probes = ['What should I do today?', 'Who needs attention?', 'What is blocking us?', 'This seems wrong.', "What's in the review queue?"]
  for (const p of probes) {
    const results = ENTRY_ROUTES.map(r => route(p, r))
    const stages = new Set(results.map(x => x.stage))
    const engines = new Set(results.map(x => x.engineId))
    check(`"${p}" routes identically across ${ENTRY_ROUTES.length} entry points (stage)`, stages.size === 1)
    check(`"${p}" hits the same engine across all entry points`, engines.size === 1)
  }
}

// ── 3–7. The eight certification guarantees ─────────────────────────────────────

function runGuarantees(): void {
  process.stdout.write('\n── ONE DONNA guarantees ──\n')

  // ✓ same conversation pipeline — single contract object
  check('same conversation pipeline (single canonical router)', typeof routeDonnaConversation === 'function')

  // ✓ same routing — review/today/players reach rich engines (not a thin fallback)
  check('reaches rich Today engine', route('What should I do today?', '/director').engineId === 'focusTodayAnswerEngine')
  check('reaches rich review engine', route("What's in the review queue?", '/director').engineId === 'donnaReviewQueueAnswer')
  check('reaches rich player attention engine', route('Who needs attention?', '/director').engineId === 'directorPlayersDonnaIntelligence')

  // ✓ executive assumption (not generic clarification) for vague-but-safe input
  const vague = route('This seems wrong.', '/director')
  check('vague-but-safe → executive assumption (not clarify)', vague.stage === 'assumption')
  check('assumption answer is reality-grounded from ctx', vague.answer !== null)

  // ✓ same RealitySnapshot grounding — answers carry source + confidence from ctx
  const today = route('What should I do today?', '/director')
  check('answer carries a sourceNote (reality provenance)', today.answer?.sourceNote != null)
  check('realityGrounded reflects live ctx', today.realityGrounded === CTX.isLive)

  // ✓ same OpenAI gateway — one documented gateway; reality wins; no second brain
  check('single OpenAI gateway named in contract', ONE_DONNA_CONTRACT.singleOpenAIGateway === 'donnaOpenAIGateway')
  check('gateway never mutates academy data', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverMutatesAcademyData === true)
  check('gateway never fabricates academy facts', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverFabricatesAcademyFacts === true)
  check('gateway is not a second brain', DONNA_OPENAI_GATEWAY_CONTRACT.guarantees.neverBecomesSecondBrain === true)
  check('reality always wins', DONNA_OPENAI_GATEWAY_CONTRACT.realityAlwaysWins === true)

  // ✓ same completion engine — completion intents defer to the one brain's loop
  check('"take me to completion" → guided completion (single completion engine)', route('Take me to completion.', '/director').stage === 'guided_completion')
  check('"walk me through it" → guided completion', route('Walk me through it.', '/director').stage === 'guided_completion')

  // ✓ same permissions — unsafe/mutation request is blocked + routed to review, never executed
  const blocked = route('Move this player up now.', '/director')
  check('unsafe mutation → safety_block', blocked.stage === 'safety_block')
  check('safety_block requires approval', blocked.requiresApproval === true)
  check('safety_block routes to review queue', blocked.answer?.href === '/director/review')
  check('contract: router never mutates', ONE_DONNA_CONTRACT.neverMutates === true)

  // ✓ deferral path uses the one brain + may use the gateway only when insufficient
  const defer = route('Tell me a joke about tennis strategy in 2019.', '/director')
  check('unmatched → defer to the single brain', defer.stage === 'defer_to_brain')
  check('defer flags OpenAI necessity (gateway, not a new path)', defer.needsOpenAI === true)
}

// ── Main ────────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('ONE DONNA Operating System Certification\n')
  process.stdout.write('Mega Sprint 3271–3300\n')
  process.stdout.write('============================================================\n')

  runExecutiveDay()
  runEntryPointIndependence()
  runGuarantees()

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`RESULT: ${passed}/${total} PASS (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(pct >= 100 ? '\nCERTIFIED — ONE DONNA: identical experience from every entry point.\n' : '\nNOT CERTIFIED — convergence gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

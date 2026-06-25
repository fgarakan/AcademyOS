// Mega Sprint 3901–3930 — DONNA Reasoning Constitution V1
// Certification — proves the permanent routing constitution holds:
//
//   • Reasoning requests   → classified `executive`; in primary mode the canonical
//                            router defers (stage=executive_reasoning) and the brain
//                            returns live_ai_assist (→ Executive Operating Layer → OpenAI).
//   • CRUD requests        → classified `deterministic`; NEVER routed to the executive
//                            layer; the brain never returns live_ai_assist for them.
//   • Hybrid requests      → classified `hybrid` (reason first, execute second).
//   • Classifier is total + deterministic; no conflicting decisions; approval-gated
//     mutations stay on the safety/approval pipeline and never reach OpenAI.
//
// OFFLINE + deterministic — no OpenAI key required, so it gates CI. The live proof
// that reasoning requests reach real OpenAI is covered by
// executiveExperienceConvergenceCertification + the live activation trace.
//
// Run: npx tsx src/lib/donna/certification/donnaRoutingConstitutionCertification.ts

import {
  classifyRequest,
  routingClassOf,
  type RoutingClass,
} from '@/lib/donna/constitution/donnaRoutingConstitution'
import { routeDonnaConversation } from '@/lib/donna/brain/donnaCanonicalRouter'
import { processDonnaMessage, type DonnaMessageInput } from '@/lib/donna/brain/processDonnaMessage'
import { buildDemoContext } from '@/lib/donna/directorDonnaContext'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

const CTX_STUB = buildDemoContext()

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

function withFlag<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env.DONNA_EXECUTIVE_REASONING
  if (value === undefined) delete process.env.DONNA_EXECUTIVE_REASONING
  else process.env.DONNA_EXECUTIVE_REASONING = value
  try { return fn() } finally {
    if (prev === undefined) delete process.env.DONNA_EXECUTIVE_REASONING
    else process.env.DONNA_EXECUTIVE_REASONING = prev
  }
}

// ── Corpora ──────────────────────────────────────────────────────────────────────

// Reasoning (Objective 2): judgment / planning / explanation / comparison / teaching.
const REASONING = [
  'What should I do today?',
  'What should I focus on?',
  'Why are you recommending that?',
  'Compare Orange 1 and Orange 2 progress',
  'Recommend a development plan for the stalled players',
  'Explain your reasoning',
  'Teach me how the curriculum spine works',
  'Coach me on improving retention',
  'Plan my week',
  'Diagnose why Orange 1 is stalling',
  'Summarize the state of the academy',
  'Who needs attention today?',
]

// Deterministic execution / CRUD (Objective 3): AcademyOS executes, never OpenAI.
const CRUD = [
  'Save this',
  'Update the roster',
  'Delete the template',
  'Create a session for tomorrow',
  'Navigate to players',
  'Archive the old session',
  'Execute the onboarding workflow',
]

// Approval-gated mutations — deterministic AND intercepted by the safety pipeline.
const MUTATIONS = [
  'Approve the promotion',
  'Send the family the recap',
  'Move him up to Orange 2',
  'Publish the curriculum',
  'Assign coach Maria to Orange 1',
]

// Hybrid (Objective 4): one request that reasons AND executes.
const HYBRID = [
  'Create an Orange 2 template and explain why',
  'Build a retention plan and tell me why it works',
  'Draft a session for tomorrow and explain your reasoning',
]

async function run(): Promise<void> {
  process.stdout.write('\n══ DONNA Reasoning Constitution — Certification ══\n')

  // ── A. Classifier is total + deterministic ──────────────────────────────────
  process.stdout.write('\n── A. Classifier totality + determinism ──\n')
  const ALL = [...REASONING, ...CRUD, ...MUTATIONS, ...HYBRID, '', '   ', 'asdf qwerty']
  const valid: RoutingClass[] = ['deterministic', 'executive', 'hybrid']
  for (const p of ALL) {
    const c = classifyRequest(p)
    check('A', `"${p.slice(0, 32)}" → one valid class (${c.class})`, valid.includes(c.class))
  }
  check('A', 'deterministic on empty input (total)', routingClassOf('') === 'deterministic')
  check('A', 'deterministic — same input twice yields same class', ALL.every(p => classifyRequest(p).class === classifyRequest(p).class))

  // ── B. Reasoning requests → executive ───────────────────────────────────────
  process.stdout.write('\n── B. Reasoning → executive (Objective 2) ──\n')
  for (const p of REASONING) {
    check('B', `"${p.slice(0, 38)}" → class=executive`, classifyRequest(p).class === 'executive')
  }
  // In primary mode the router defers to the executive layer and the brain hands off.
  withFlag('primary', () => {
    for (const p of REASONING) {
      const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
      check('B', `[primary] router "${p.slice(0, 30)}" → executive_reasoning`, r.stage === 'executive_reasoning' && r.needsOpenAI === true)
      check('B', `[primary] brain "${p.slice(0, 30)}" → live_ai_assist`, processDonnaMessage(liveInput(p)).action === 'live_ai_assist')
    }
  })

  // ── C. CRUD requests → deterministic, NEVER OpenAI ──────────────────────────
  process.stdout.write('\n── C. CRUD → deterministic, never executive (Objective 3) ──\n')
  for (const p of CRUD) {
    check('C', `"${p}" → class=deterministic`, classifyRequest(p).class === 'deterministic')
  }
  withFlag('primary', () => {
    for (const p of CRUD) {
      const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
      check('C', `[primary] router "${p}" NOT executive_reasoning`, r.stage !== 'executive_reasoning')
      check('C', `[primary] brain "${p}" NOT live_ai_assist`, processDonnaMessage(liveInput(p)).action !== 'live_ai_assist')
    }
  })

  // ── D. Approval-gated mutations stay deterministic + on the safety pipeline ──
  process.stdout.write('\n── D. Mutations → deterministic + safety pipeline (never OpenAI) ──\n')
  for (const p of MUTATIONS) {
    const c = classifyRequest(p)
    check('D', `"${p}" → deterministic + approval-gated`, c.class === 'deterministic' && c.isApprovalGatedMutation === true)
  }
  withFlag('primary', () => {
    for (const p of MUTATIONS) {
      const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
      check('D', `[primary] router "${p.slice(0, 30)}" → safety_block, never executive`, r.stage === 'safety_block')
    }
  })

  // ── E. Hybrid requests → hybrid (reason first, execute second) ──────────────
  process.stdout.write('\n── E. Hybrid → reason then execute (Objective 4) ──\n')
  for (const p of HYBRID) {
    const c = classifyRequest(p)
    check('E', `"${p.slice(0, 40)}" → class=hybrid (exec+reason)`, c.class === 'hybrid' && c.hasExecution && c.hasReasoning)
  }
  withFlag('primary', () => {
    for (const p of HYBRID) {
      const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
      check('E', `[primary] hybrid "${p.slice(0, 28)}" reasons via executive layer`, r.stage === 'executive_reasoning')
    }
  })

  // ── F. No conflicting decisions ─────────────────────────────────────────────
  process.stdout.write('\n── F. No conflicting decisions ──\n')
  check('F', 'no reasoning prompt is classified deterministic', REASONING.every(p => classifyRequest(p).class !== 'deterministic'))
  check('F', 'no CRUD prompt is classified executive', CRUD.every(p => classifyRequest(p).class !== 'executive'))
  check('F', 'no mutation prompt is classified executive/hybrid', MUTATIONS.every(p => classifyRequest(p).class === 'deterministic'))

  // ── G. Flag-off preserves the legacy baseline (zero behavior change) ────────
  process.stdout.write('\n── G. Flag-off → no executive routing (baseline preserved) ──\n')
  for (const token of ['off', undefined]) {
    withFlag(token, () => {
      for (const p of REASONING) {
        const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
        check('G', `[${token ?? 'unset'}] "${p.slice(0, 26)}" NOT executive_reasoning`, r.stage !== 'executive_reasoning')
      }
    })
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
    process.stdout.write('All constitution checks passed.\n')
  }
}

run().catch(err => {
  process.stderr.write(`Certification crashed: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exitCode = 1
})

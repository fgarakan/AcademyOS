// Mega Sprint 3931–3960 — DONNA Unified Reasoning Engine V1
// Certification — locks the permanent reasoning architecture and fails future
// regressions that would re-introduce a second reasoning pipeline.
//
// Two tiers:
//   • STRUCTURAL (source-scanning) — exactly one reasoning OpenAI gateway, no
//     direct model calls outside it, the executive gateway routes through it, both
//     director reasoning actions invoke the Executive Operating Layer (no bypass),
//     the validator is wired into the executive turn, context is assembled by the
//     one Context Resolver.
//   • BEHAVIORAL — the certification prompts all traverse the identical pipeline
//     (classifier → executive layer) in primary mode.
//
// Run: npx tsx src/lib/donna/certification/donnaUnifiedReasoningCertification.ts

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { classifyRequest } from '@/lib/donna/constitution/donnaRoutingConstitution'
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

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

function read(rel: string): string {
  try { return readFileSync(join(ROOT, rel), 'utf8') } catch { return '' }
}

/** All .ts/.tsx files under src/ whose contents match a predicate. */
function filesMatching(pred: (content: string) => boolean): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(name)) {
        const content = readFileSync(p, 'utf8')
        if (pred(content)) out.push(p.replace(ROOT + '/', ''))
      }
    }
  }
  walk(SRC)
  return out
}

// The single low-level model gateway + the two documented advisory exceptions (not part
// of the director conversation reasoning pipeline; one is testing-only, one is uncalled).
// Sprint 4363 converged the chat/completions call OUT of donnaConversationTeacher onto
// the model adapter's OpenAI provider — the provider is now the canonical gateway, and
// donnaConversationTeacher delegates to it (no direct fetch of its own).
const GATEWAY_FILE = 'src/lib/donna/model/providers/openAIProvider.ts'
const ADVISORY_EXCEPTIONS = [
  'src/lib/donna/learning/donnaLearningAnalyzer.ts',
  'src/lib/donna/knowledgePromotion/donnaKnowledgeDraftGenerator.ts',
]

const CERT_PROMPTS = [
  'What should I do?',
  'Explain this.',
  'Compare these.',
  'Recommend.',
  'Coach me.',
  'Teach me.',
  'Summarize.',
  'Review this.',
]

const CTX_STUB = buildDemoContext()
function liveInput(message: string): DonnaMessageInput {
  return {
    userMessage: message, role: 'director', route: '/director',
    activeGuidedWorkflowId: null, cooState: null, goalMemory: null,
    firstName: 'Brian', pendingReviews: 0, conversationHistory: [],
    entityContext: null, pendingDisambiguation: null, conversationNavigatorState: null,
    onboardingComplete: true, livePageState: null,
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

async function run(): Promise<void> {
  process.stdout.write('\n══ DONNA Unified Reasoning Engine — Certification ══\n')

  // ── A. Single OpenAI reasoning gateway (Objective 4) ────────────────────────
  process.stdout.write('\n── A. One reasoning gateway — no secondary OpenAI calls ──\n')
  const CHAT_FETCH = /api\.openai\.com\/v1\/chat\/completions/
  const chatCallers = filesMatching(c => CHAT_FETCH.test(c))
  const allowed = new Set([GATEWAY_FILE, ...ADVISORY_EXCEPTIONS])
  const unexpected = chatCallers.filter(f => !allowed.has(f))
  check('A', `chat/completions fetch only in the gateway + documented advisories (found: ${chatCallers.length})`, unexpected.length === 0)
  if (unexpected.length) process.stdout.write(`      unexpected gateways: ${unexpected.join(', ')}\n`)
  check('A', 'the canonical gateway file IS one of the callers', chatCallers.includes(GATEWAY_FILE))

  // ── B. Executive reasoning gateway routes through the canonical gateway ──────
  process.stdout.write('\n── B. Executive gateway delegates — no direct model call ──\n')
  const execGw = read('src/lib/donna/executive/executiveReasoningGateway.ts')
  check('B', 'executiveReasoningGateway calls callDonnaOpenAIGateway', /callDonnaOpenAIGateway/.test(execGw))
  check('B', 'executiveReasoningGateway has NO direct api.openai.com fetch', !/api\.openai\.com/.test(execGw))
  const gateway = read('src/lib/donna/brain/donnaOpenAIGateway.ts')
  check('B', 'donnaOpenAIGateway delegates to askConversationTeacher', /askConversationTeacher/.test(gateway))

  // ── C. No reasoning entry bypasses the Executive Operating Layer (Obj 2) ─────
  process.stdout.write('\n── C. Both director reasoning actions invoke runExecutiveLive ──\n')
  const liveAction = read('src/app/director/_actions/donnaLiveConversationAction.ts')
  const strategicAction = read('src/app/director/_actions/donnaStrategicConversationAction.ts')
  check('C', 'live action invokes runExecutiveLive', /runExecutiveLive\s*\(/.test(liveAction))
  check('C', 'strategic action invokes runExecutiveLive (converged, no separate pipeline)', /runExecutiveLive\s*\(/.test(strategicAction))

  // ── D. Single context pipeline + single validator (Obj 3, 5) ────────────────
  // Mega Sprint 3991–4020 — the turn assembles context through the ONE Unified
  // Executive Context Engine (assembleExecutiveContext), which is the single caller
  // of the Context Resolver (resolveExecutiveContext). Convergence, not bypass.
  process.stdout.write('\n── D. One Context Engine + Resolver + Response Validator in the turn ──\n')
  const layer = read('src/lib/donna/executive/executiveOperatingLayer.ts')
  const engine = read('src/lib/donna/executive/executiveContextEngine.ts')
  check('D', 'executive turn assembles via the Unified Context Engine (assembleExecutiveContext)', /assembleExecutiveContext/.test(layer))
  check('D', 'the Context Engine is the single caller of resolveExecutiveContext (Context Resolver)', /resolveExecutiveContext/.test(engine))
  check('D', 'the layer no longer calls the Context Resolver directly (one engine, no duplicate path)', !/resolveExecutiveContext/.test(layer))
  check('D', 'executive turn runs validateExecutiveResponse (Response Validator)', /validateExecutiveResponse/.test(layer))
  check('D', 'executive turn calls runExecutiveReasoning (the one reasoning engine)', /runExecutiveReasoning/.test(layer))

  // ── E. Reasoning trace is developer-visible (Obj 6) ─────────────────────────
  process.stdout.write('\n── E. Full developer reasoning trace wired ──\n')
  check('E', 'live action emits logReasoningTrace', /logReasoningTrace\s*\(/.test(liveAction))
  check('E', 'strategic action emits logReasoningTrace', /logReasoningTrace\s*\(/.test(strategicAction))

  // ── F. Behavioral — every certification prompt traverses the same pipeline ──
  process.stdout.write('\n── F. Identical pipeline for every reasoning prompt (primary) ──\n')
  for (const p of CERT_PROMPTS) {
    const cls = classifyRequest(p)
    check('F', `"${p}" → reasoning class (${cls.class})`, cls.class === 'executive' || cls.class === 'hybrid')
  }
  withFlag('primary', () => {
    for (const p of CERT_PROMPTS) {
      const r = routeDonnaConversation({ text: p, directorCtx: CTX_STUB, route: '/director' })
      check('F', `[primary] router "${p}" → executive_reasoning`, r.stage === 'executive_reasoning')
      check('F', `[primary] brain "${p}" → live_ai_assist (executive layer)`, processDonnaMessage(liveInput(p)).action === 'live_ai_assist')
    }
  })

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write(`\n══ Result: ${passed}/${total} (${pct.toFixed(1)}%) ══\n`)
  if (failed > 0) {
    process.stdout.write('Failures:\n')
    for (const f of failures) process.stdout.write(`  ✗ ${f}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write('All unified-reasoning checks passed.\n')
  }
}

run().catch(err => {
  process.stderr.write(`Certification crashed: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exitCode = 1
})

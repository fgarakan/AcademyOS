// Sprint 4362 — DONNA Model-Assisted Guidance Certification
//
// Behavioral, OFFLINE certification of the model-assist path via an INJECTED stub
// provider (no network, no OpenAI). Proves:
//   • a valid model rephrasing → source:'model_assisted', but every structured/safety
//     field (loopId, requiresApproval, visibilityWarning) stays from the deterministic
//     input — the model cannot invent state
//   • unsafe / oversized / empty model output → deterministic fallback
//   • a throwing / timing-out provider → deterministic fallback
//   • an unavailable provider is never called (no generate())
//   • firewall-blocked context is never sent to the provider
//   • action requests never classify as loop questions (so the model path is unreachable
//     for actions — structural guarantee)
//
// Run: npx tsx src/lib/donna/certification/modelAssistedGuidanceCertification.ts

import { runModelAssist } from '@/lib/donna/model/modelAdapter'
import { buildModelSafeContext } from '@/lib/donna/model/contextFirewall'
import { maybeModelAssistLoopGuidance } from '@/lib/donna/model/loopGuidanceAssist'
import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type { ModelProvider } from '@/lib/donna/model/modelTypes'
import type {
  AIGenerateParams,
  AIGenerateResult,
  AISummarizeParams,
  AIClassifyParams,
  AIClassifyResult,
} from '@/lib/ai/aiReasoningProvider'
import { classifyLoopQuestion } from '@/lib/donna/loopKnowledgeResolver'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): boolean {
  if (ok) passed++
  else { failed++; failures.push(label) }
  return ok
}

// ── Stub provider (offline; records whether generate() was called) ─────────────────
class StubProvider implements ModelProvider {
  readonly name = 'stub'
  generateCalled = false
  constructor(
    private readonly opts: { available: boolean; text?: string; throws?: boolean },
  ) {}
  isAvailable(): boolean { return this.opts.available }
  async generate(_p: AIGenerateParams): Promise<AIGenerateResult> {
    this.generateCalled = true
    if (this.opts.throws) throw new Error('stub failure')
    return { text: this.opts.text ?? '', inputTokens: 0, outputTokens: 0, modelUsed: 'stub', latencyMs: 1 }
  }
  async summarize(_p: AISummarizeParams): Promise<string> { throw new Error('n/a') }
  async classify(_p: AIClassifyParams): Promise<AIClassifyResult> { throw new Error('n/a') }
}

const CTX = () => buildModelSafeContext({
  role: 'director',
  route: '/director/sessions/new',
  userQuestion: 'why do I need to do this?',
})

const FALLBACK = {
  message: 'Deterministic guidance.',
  loopId: 4,
  requiresApproval: false,
  visibilityWarning: 'staff-only',
  safeNextActions: ['Pick a template'],
}

async function main(): Promise<void> {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Model-Assisted Guidance Certification\n')
  process.stdout.write('Sprint 4362\n')
  process.stdout.write('============================================================\n')

  // 1. Valid rephrasing → model_assisted, but structured fields stay deterministic.
  {
    const stub = new StubProvider({ available: true, text: 'Here is a natural explanation of the step.' })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('valid: source is model_assisted', r.source === 'model_assisted')
    check('valid: message is the model prose', r.message === 'Here is a natural explanation of the step.')
    check('valid: loopId stays deterministic', r.loopId === 4)
    check('valid: requiresApproval stays false', r.requiresApproval === false)
    check('valid: visibilityWarning stays deterministic', r.visibilityWarning === 'staff-only')
    check('valid: safeNextActions stay deterministic', (r.safeNextActions ?? []).join() === 'Pick a template')
    check('valid: debug not a fallback', r.debug?.usedFallback === false)
  }

  // 2. Unsafe model output (contains an email) → deterministic fallback.
  {
    const stub = new StubProvider({ available: true, text: 'Contact them at coach@example.com now.' })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('unsafe: falls back to deterministic', r.source === 'deterministic')
    check('unsafe: message is deterministic', r.message === 'Deterministic guidance.')
    check('unsafe: reason is invalid_response', (r.blockedReason ?? '').includes('invalid_response'))
  }

  // 3. Empty model output → fallback.
  {
    const stub = new StubProvider({ available: true, text: '   ' })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('empty: falls back', r.source === 'deterministic')
    check('empty: reason invalid_response', (r.blockedReason ?? '').includes('invalid_response'))
  }

  // 4. Oversized model output → fallback.
  {
    const stub = new StubProvider({ available: true, text: 'x'.repeat(5000) })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('oversized: falls back', r.source === 'deterministic')
  }

  // 5. Throwing provider → fallback (model_error), no crash.
  {
    const stub = new StubProvider({ available: true, throws: true })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('throws: falls back', r.source === 'deterministic')
    check('throws: reason model_error', r.blockedReason === 'model_error')
  }

  // 6. Unavailable provider → fallback, generate() never called.
  {
    const stub = new StubProvider({ available: false, text: 'should not be used' })
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK }, { provider: stub })
    check('unavailable: falls back', r.source === 'deterministic')
    check('unavailable: reason model_unavailable', r.blockedReason === 'model_unavailable')
    check('unavailable: generate() NOT called', stub.generateCalled === false)
  }

  // 7. Firewall-blocked context (email in question) → provider never called.
  {
    const stub = new StubProvider({ available: true, text: 'unused' })
    const badCtx = buildModelSafeContext({
      role: 'director',
      route: '/director/sessions/new',
      userQuestion: 'email me at a@b.com',
    })
    const r = await runModelAssist({ context: badCtx, deterministicFallback: FALLBACK }, { provider: stub })
    check('firewall: falls back', r.source === 'deterministic')
    check('firewall: reason firewall_block', (r.blockedReason ?? '').includes('firewall_block'))
    check('firewall: generate() NOT called', stub.generateCalled === false)
  }

  // 8. Structural guarantee: action requests never classify as loop questions.
  const actionPhrases = [
    'approve this', 'create evidence', 'move player to next level', 'publish the update',
    'message the parent', 'edit the curriculum', 'change the template', 'create a session',
    'delete this player',
  ]
  for (const phrase of actionPhrases) {
    check(`action "${phrase}" is not a loop question`, classifyLoopQuestion(phrase) === null)
  }

  // 9. Default (no injected provider): off by default → deterministic fallback.
  {
    const r = await runModelAssist({ context: CTX(), deterministicFallback: FALLBACK })
    check('default: off by default → deterministic', r.source === 'deterministic')
    check('default: reason model_unavailable', r.blockedReason === 'model_unavailable')
  }

  // ── Sprint 4364: runtime activation helper (maybeModelAssistLoopGuidance) ───────
  // The action seam. Offline throughout — stub provider, no real key/network.
  const mkResult = (response: string, requiresApproval = false): DonnaMessageResult =>
    ({ action: 'respond', response, spokenResponse: response, requiresApproval } as unknown as DonnaMessageResult)
  const LOOP_INPUT = { userMessage: 'why do I need to do this?', role: 'director' as const, route: '/director/sessions/new' }

  // 10. Flag disabled (env unset) → null (caller keeps its existing path). No model.
  {
    delete process.env.FEATURE_DONNA_MODEL_ASSIST
    delete process.env.OPENAI_API_KEY
    const stub = new StubProvider({ available: true, text: 'should not run' })
    const r = await maybeModelAssistLoopGuidance(LOOP_INPUT, mkResult('Deterministic.'), { provider: stub })
    check('helper: disabled flag → null', r === null)
    check('helper: disabled flag → generate() not called', stub.generateCalled === false)
  }

  // Enable the flag for the remaining helper cases (fake key is never used — stub injected).
  process.env.FEATURE_DONNA_MODEL_ASSIST = 'true'
  process.env.OPENAI_API_KEY = 'test-key-never-sent'

  // 11. Enabled + loop question + valid stub → prose swapped, structured fields preserved.
  {
    const stub = new StubProvider({ available: true, text: 'Here is a natural explanation.' })
    const r = await maybeModelAssistLoopGuidance(LOOP_INPUT, mkResult('Deterministic.', true), { provider: stub })
    check('helper: enabled → rephrased response', r?.response === 'Here is a natural explanation.')
    check('helper: enabled → spokenResponse rephrased', r?.spokenResponse === 'Here is a natural explanation.')
    check('helper: enabled → requiresApproval preserved (true)', r?.requiresApproval === true)
    check('helper: enabled → action preserved', r?.action === 'respond')
  }

  // 12. Enabled + action request → null (never model-assisted; classifier excludes it).
  {
    const stub = new StubProvider({ available: true, text: 'unused' })
    const r = await maybeModelAssistLoopGuidance({ ...LOOP_INPUT, userMessage: 'approve this now' }, mkResult('Deterministic.'), { provider: stub })
    check('helper: action request → null', r === null)
    check('helper: action request → generate() not called', stub.generateCalled === false)
  }

  // 13. Enabled + non-loop route → null.
  {
    const stub = new StubProvider({ available: true, text: 'unused' })
    const r = await maybeModelAssistLoopGuidance({ ...LOOP_INPUT, route: '/director/kpi' }, mkResult('Deterministic.'), { provider: stub })
    check('helper: non-loop route → null', r === null)
  }

  // 14. Enabled + unsafe model output → deterministic response preserved (fallback).
  {
    const stub = new StubProvider({ available: true, text: 'email them at coach@example.com' })
    const r = await maybeModelAssistLoopGuidance(LOOP_INPUT, mkResult('Deterministic.'), { provider: stub })
    check('helper: unsafe output → deterministic response', r?.response === 'Deterministic.')
  }

  delete process.env.FEATURE_DONNA_MODEL_ASSIST
  delete process.env.OPENAI_API_KEY

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`MODEL-ASSISTED GUIDANCE CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL MODEL-ASSISTED GUIDANCE CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

void main()

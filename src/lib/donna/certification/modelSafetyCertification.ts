// Sprint 4361 — DONNA Model Adapter + Context Firewall Safety Certification
//
// Behavioral + static certification that the model boundary is safe BEFORE any live
// model behavior exists:
//   • context firewall builds allowlist-only DTOs; forbidden patterns are refused
//   • guardian/parent/player private fields never appear in a ModelSafeContext
//   • the model module makes NO network call (static scan: no fetch/SDK/openai)
//   • the adapter cannot mutate records (static scan: no Supabase/proposed_actions)
//   • missing key / unavailable provider → deterministic fallback (no crash)
//   • the response contract is enforced
//   • all 10 loops produce a model-safe context
//   • debug metadata carries no secrets/raw context/PII
//
// Run: npx tsx src/lib/donna/certification/modelSafetyCertification.ts

import fs from 'fs'
import path from 'path'
import { ALL_LOOP_KNOWLEDGE } from '@/lib/donna/loopKnowledge'
import {
  buildModelSafeContext,
  assertModelSafeContext,
  serializeModelContext,
} from '@/lib/donna/model/contextFirewall'
import { runModelAssist } from '@/lib/donna/model/modelAdapter'
import {
  MODEL_SAFE_CONTEXT_KEYS,
  FORBIDDEN_CONTEXT_PATTERNS,
  type ModelAdapterResult,
} from '@/lib/donna/model/modelTypes'

const ROOT = process.cwd()

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): boolean {
  if (ok) passed++
  else { failed++; failures.push(label) }
  return ok
}

function read(rel: string): string {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8') } catch { return '' }
}

// Strip comments so the static scan checks executable CODE, not our safety docs or the
// forbidden-pattern regex definitions (which legitimately mention these tokens).
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')      // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')   // line comments (keep :// intact)
}

const MODEL_FILES = [
  'src/lib/donna/model/modelTypes.ts',
  'src/lib/donna/model/contextFirewall.ts',
  'src/lib/donna/model/modelAdapter.ts',
  'src/lib/donna/model/providers/nullProvider.ts',
  'src/lib/donna/model/providers/openAIProvider.ts',
]

// Patterns that would indicate a live network / model call (must be ABSENT).
const NETWORK_PATTERNS: Array<[string, RegExp]> = [
  ['fetch(', /\bfetch\s*\(/],
  ['api.openai.com', /api\.openai\.com/],
  ['api.anthropic.com', /api\.anthropic\.com/],
  ["import 'openai'", /from\s+['"]openai['"]/],
  ["require('openai')", /require\(\s*['"]openai['"]\s*\)/],
  ['new OpenAI', /new\s+OpenAI\b/],
  ['@anthropic-ai/sdk', /@anthropic-ai\/sdk/],
  ['XMLHttpRequest', /XMLHttpRequest/],
  ['axios', /\baxios\b/],
]

// Precise capability signatures (imports / calls) that would indicate mutation / DB /
// service-role access (must be ABSENT). Precise so they don't match the forbidden-pattern
// regex definitions in modelTypes.ts (which mention words like "service role").
const MUTATION_PATTERNS: Array<[string, RegExp]> = [
  ['supabase import', /import[^\n]+supabase/i],
  ['getSupabaseServer()', /getSupabaseServer\s*\(/],
  ['createClient()', /createClient\s*\(/],
  ['.from("proposed_actions")', /\.from\(\s*['"]proposed_actions['"]/],
  ['execute_approved_action()', /execute_approved_action\s*\(/],
]

async function main(): Promise<void> {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Model Adapter + Context Firewall Safety Certification\n')
  process.stdout.write('Sprint 4361\n')
  process.stdout.write('============================================================\n')

  // 1. STATIC: the model module makes no network / model call (executable code only).
  for (const file of MODEL_FILES) {
    const raw = read(file)
    check(`${file}: file present`, raw.length > 0)
    const code = stripComments(raw)
    for (const [label, pattern] of NETWORK_PATTERNS) {
      check(`${file}: no network pattern "${label}"`, !pattern.test(code))
    }
  }

  // 2. STATIC: the adapter/providers cannot mutate records (executable code only).
  for (const file of MODEL_FILES) {
    const code = stripComments(read(file))
    for (const [label, pattern] of MUTATION_PATTERNS) {
      check(`${file}: no mutation pattern "${label}"`, !pattern.test(code))
    }
  }

  // 3. All 10 loops produce a valid, allowlist-only ModelSafeContext.
  const allowed = new Set<string>(MODEL_SAFE_CONTEXT_KEYS as ReadonlyArray<string>)
  for (const loop of ALL_LOOP_KNOWLEDGE) {
    const ctx = buildModelSafeContext({
      role: loop.primaryRole,
      route: loop.primaryRoutes[0],
      userQuestion: 'why do I need to do this?',
    })
    const tag = `loop ${loop.id}`
    const keysOk = Object.keys(ctx).every(k => allowed.has(k))
    check(`${tag}: context keys ⊆ allowlist`, keysOk)
    const assertion = assertModelSafeContext(ctx)
    check(`${tag}: firewall assertion passes`, assertion.ok)
    const blob = serializeModelContext(ctx)
    check(`${tag}: serialized context has no forbidden pattern`,
      !FORBIDDEN_CONTEXT_PATTERNS.some(p => p.test(blob)))
    // Guardian/parent/player private markers must not appear.
    check(`${tag}: no guardian/private markers`,
      !/guardian\s+(email|phone)|coach\s+note|assessment\s+score|@/i.test(blob))
  }

  // 4. Firewall REFUSES a context carrying a forbidden pattern (e.g. an email).
  {
    const ctx = buildModelSafeContext({
      role: 'director',
      route: '/director/sessions/new',
      userQuestion: 'email the parent at mum@example.com about this',
    })
    const assertion = assertModelSafeContext(ctx)
    check('firewall refuses email in user question', assertion.ok === false)

    const r = await runModelAssist({
      context: ctx,
      deterministicFallback: { message: 'Here is safe guidance.' },
    })
    check('adapter falls back on firewall block', r.source === 'deterministic')
    check('adapter reports firewall_block reason', (r.blockedReason ?? '').includes('firewall_block'))
  }

  // 5. Unavailable provider → deterministic fallback (no crash, no model call).
  {
    const ctx = buildModelSafeContext({
      role: 'director',
      route: '/director/sessions/new',
      userQuestion: 'what should I do next?',
    })
    const r: ModelAdapterResult = await runModelAssist({
      context: ctx,
      deterministicFallback: { message: 'Deterministic next step.', safeNextActions: ['Pick a template'] },
    })
    check('unavailable: source is deterministic', r.source === 'deterministic')
    check('unavailable: usedFallback true', r.debug?.usedFallback === true)
    check('unavailable: model_unavailable reason', r.blockedReason === 'model_unavailable')
    check('unavailable: message preserved', r.message === 'Deterministic next step.')
    check('unavailable: requiresApproval defaults false', r.requiresApproval === false)

    // 6. Response contract enforced.
    check('contract: message is non-empty string', typeof r.message === 'string' && r.message.length > 0)
    check('contract: confidence valid', ['low', 'medium', 'high'].includes(r.confidence))
    check('contract: source valid', ['deterministic', 'model_assisted'].includes(r.source))

    // 7. Debug metadata carries only safe keys — no context, no PII, no secrets.
    const debugKeys = Object.keys(r.debug ?? {})
    check('debug: only safe keys', debugKeys.every(k => ['provider', 'usedFallback', 'latencyMs'].includes(k)))
    const debugBlob = JSON.stringify(r.debug ?? {})
    check('debug: no forbidden pattern', !FORBIDDEN_CONTEXT_PATTERNS.some(p => p.test(debugBlob)))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`MODEL SAFETY CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL MODEL SAFETY CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

void main()

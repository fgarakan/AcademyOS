// Sprint 4363 — DONNA Model Client Convergence Certification
//
// Proves the narrow convergence: the primary active OpenAI chat path
// (donnaConversationTeacher) now routes through the ONE governed provider
// (OpenAIProvider) — it no longer makes a direct fetch — while preserving its own
// privacyGuard, key gating, temperature, and fail-open fallback.
//
// Behavioral checks run OFFLINE (no key → no network).
//
// Run: npx tsx src/lib/donna/certification/modelConvergenceCertification.ts

import fs from 'fs'
import path from 'path'

// Guarantee offline: no key → the teacher returns its fallback before any network call.
delete process.env.OPENAI_API_KEY

import { askConversationTeacher } from '@/lib/donna/conversation/donnaConversationTeacher'

const ROOT = process.cwd()
const TEACHER = 'src/lib/donna/conversation/donnaConversationTeacher.ts'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): boolean {
  if (ok) passed++
  else { failed++; failures.push(label) }
  return ok
}

function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

// The DONNA text-reasoning files still holding a direct OpenAI chat fetch AFTER this
// sprint — documented advisory exceptions. Sprint 4364 activates the loop-guidance
// model-assist and does NOT converge these; their convergence is deferred beyond 4364
// (not yet scheduled). Listed here to stay honest, not falsely green.
const DEFERRED_DIRECT_OPENAI = [
  'src/lib/donna/learning/donnaLearningAnalyzer.ts',
  'src/lib/donna/knowledgePromotion/donnaKnowledgeDraftGenerator.ts',
]

async function main(): Promise<void> {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Model Client Convergence Certification\n')
  process.stdout.write('Sprint 4363\n')
  process.stdout.write('============================================================\n')

  const raw = fs.readFileSync(path.join(ROOT, TEACHER), 'utf8')
  const code = stripComments(raw)

  // 1. Static: the teacher routes through the governed provider.
  check('teacher imports OpenAIProvider', /OpenAIProvider/.test(code))
  check('teacher calls provider.generate', /\.generate\s*\(/.test(code))

  // 2. Static: the teacher no longer makes a direct OpenAI fetch.
  check('teacher has NO api.openai.com fetch', !/api\.openai\.com/.test(code))
  check('teacher has NO bare fetch(', !/\bfetch\s*\(/.test(code))

  // 3. Static: preserved safety — privacyGuard, key gate, fallback, temperature.
  check('teacher preserves privacyGuard', /privacyGuard/.test(code))
  check('teacher preserves OPENAI_API_KEY gate', /OPENAI_API_KEY/.test(code))
  check('teacher preserves buildFallbackResult', /buildFallbackResult/.test(code))
  check('teacher passes temperature 0.3', /temperature:\s*0\.3/.test(code))

  // 4. Behavioral (offline): no key → deterministic fallback, no network.
  {
    const out = await askConversationTeacher({
      mode: 'executive_refinement',
      userText: 'why is enrollment down',
      role: 'director',
      currentConfidence: 0.1,
    })
    check('no key → source is fallback', out.source === 'fallback')
    check('no key → zero tokens used (no network)', out.usedTokens === 0)
  }

  // 5. Behavioral: high confidence → not called (rate-limit gate intact).
  {
    const out = await askConversationTeacher({
      mode: 'executive_refinement',
      userText: 'anything',
      role: 'director',
      currentConfidence: 0.9,
    })
    check('high confidence → not_called', out.source === 'not_called')
  }

  // 5b. Sprint 4364: the runtime-activation helper routes ONLY through runModelAssist.
  {
    const helper = 'src/lib/donna/model/loopGuidanceAssist.ts'
    const hcode = stripComments(fs.readFileSync(path.join(ROOT, helper), 'utf8'))
    check('helper: routes through runModelAssist', /runModelAssist/.test(hcode))
    check('helper: no direct api.openai.com', !/api\.openai\.com/.test(hcode))
    check('helper: no bare fetch(', !/\bfetch\s*\(/.test(hcode))
    check('helper: no direct OpenAIProvider instantiation', !/new\s+OpenAIProvider/.test(hcode))
    check('helper: gated by isModelAssistEnabled', /isModelAssistEnabled/.test(hcode))
  }

  // 6. Honesty: deferred direct-OpenAI files still exist (convergence deferred beyond 4364).
  for (const f of DEFERRED_DIRECT_OPENAI) {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8')
    check(`deferred (beyond 4364): ${path.basename(f)} still has a direct OpenAI call`, /api\.openai\.com/.test(t))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`MODEL CONVERGENCE CERTIFICATION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  process.stdout.write('\nDeferred beyond Sprint 4364 — convergence not yet scheduled (still direct OpenAI, documented):\n')
  DEFERRED_DIRECT_OPENAI.forEach(f => process.stdout.write(`  • ${f}\n`))
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  } else {
    process.stdout.write('\nALL MODEL CONVERGENCE CHECKS PASS.\n')
  }
  process.exit(failed > 0 ? 1 : 0)
}

void main()

// Sprint 4362 — DONNA Live LLM Smoke Test (secret-gated; never runs by default).
//
// Verifies the real OpenAI provider can return a bounded, safe explanation — using
// SYNTHETIC safe context only. No academy data. No database. Not part of the default
// cert suite; its failure never blocks local certs.
//
// Runs ONLY when BOTH are set:
//   RUN_LIVE_LLM_SMOKE=1   and   OPENAI_API_KEY=<key>
// Otherwise it prints "skipped" and exits 0.
//
// Run: RUN_LIVE_LLM_SMOKE=1 OPENAI_API_KEY=sk-... npx tsx src/lib/donna/certification/liveLlmSmokeTest.ts

import { OpenAIProvider } from '@/lib/donna/model/providers/openAIProvider'
import { buildModelSafeContext, serializeModelContext } from '@/lib/donna/model/contextFirewall'
import { validateModelMessage } from '@/lib/donna/model/responseValidator'
import { DONNA_MODEL_SYSTEM_PROMPT_V1, MODEL_CONFIG } from '@/lib/donna/model/modelTypes'

async function main(): Promise<void> {
  const enabled = process.env.RUN_LIVE_LLM_SMOKE === '1' && Boolean(process.env.OPENAI_API_KEY?.trim())
  if (!enabled) {
    process.stdout.write('LIVE LLM SMOKE: skipped (set RUN_LIVE_LLM_SMOKE=1 and OPENAI_API_KEY to run).\n')
    process.exit(0)
  }

  process.stdout.write('\nLIVE LLM SMOKE: running against OpenAI with synthetic safe context...\n')

  // Synthetic safe context — real loop knowledge, no academy/DB data, no PII.
  const ctx = buildModelSafeContext({
    role: 'director',
    route: '/director/sessions/new',
    userQuestion: 'why do I need to do this?',
  })
  const userContent =
    `${serializeModelContext(ctx)}\n\nGUIDANCE TO REPHRASE (keep every fact; one natural paragraph):\n` +
    'Creating a session schedules what a coach delivers. Without it there is no attendance or record.'

  let ok = true
  try {
    const result = await new OpenAIProvider().generate({
      systemPrompt: DONNA_MODEL_SYSTEM_PROMPT_V1,
      userContent,
      maxTokens: MODEL_CONFIG.maxOutputTokens,
    })
    const validation = validateModelMessage(result.text, 'director')
    process.stdout.write(`  model: ${result.modelUsed} | latency: ${result.latencyMs}ms | tokens out: ${result.outputTokens}\n`)
    process.stdout.write(`  valid: ${validation.ok}${validation.reason ? ' (' + validation.reason + ')' : ''}\n`)
    ok = validation.ok
  } catch (err) {
    process.stdout.write(`  ERROR: ${(err as Error).message}\n`)
    ok = false
  }

  process.stdout.write(ok ? '\nLIVE LLM SMOKE: PASS\n' : '\nLIVE LLM SMOKE: FAIL\n')
  process.exit(ok ? 0 : 1)
}

void main()

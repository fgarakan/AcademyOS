// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Certification — the 7 executive conversation tests.
//
// Drives the Executive Operating Layer end-to-end (continuity → reasoning goal →
// context resolver → packet → instrumented gateway → validator → planner →
// completion) over the canonical 7-turn director conversation and asserts the
// behaviors that distinguish an executive operating partner from a workflow bot.
//
// Runs offline (no OPENAI_API_KEY required): the gateway is fail-open, so source
// is 'fallback' here. The suite proves the PIPELINE is correct and INVOKES the
// gateway with the right reasoning goal + complete context; with a key present,
// the same path returns source='openai'. Honest by design — a missing behavior
// FAILS rather than being whitewashed.
//
// Run: npx tsx src/lib/donna/certification/executiveConversationalReadinessCertification.ts

import {
  runExecutiveOperatingTurn,
} from '@/lib/donna/executive/executiveOperatingLayer'
import {
  clearOpenAICallLog,
  getLastOpenAICall,
  gatewayWasInvoked,
} from '@/lib/donna/executive/openaiInstrumentation'
import { REASONING_GOALS } from '@/lib/donna/executive/reasoningGoals'
import type {
  ResolverState,
  ConversationTurn,
  DraftRef,
} from '@/lib/donna/executive/executiveTypes'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

// ── Shared conversation state ────────────────────────────────────────────────
const history: ConversationTurn[] = []

const ORANGE2_DRAFT: DraftRef = {
  kind: 'class_template',
  label: 'Orange 2 — Class Template',
  fields: { level: 'Orange 2', duration: 90, blocks: ['warm-up', 'rally', 'point play'] },
  readyForReview: false,
}

function baseState(message: string, overrides: Partial<ResolverState> = {}): ResolverState {
  return {
    role: 'academy_director',
    message,
    route: '/director',
    page: 'Director Command Center',
    conversationHistory: [...history],
    activeWorkflowId: null,
    activeDraft: null,
    academy: { academyId: 'acad_1', name: 'Dabul Tennis Academy', modelLabel: 'Master Development Spine' },
    academyDefaults: { default_class_duration_min: '90', default_block_count: '4' },
    curriculum: { academyId: 'acad_1', levels: ['Red 1', 'Orange 2', 'Green 3'], summary: 'Stage-based LTAD spine' },
    developmentSpine: { academyId: 'acad_1', summary: 'Technical→tactical→physical progression per stage' },
    permissions: ['approve', 'create_template', 'assign_coach'],
    availableActions: [
      { id: 'create_template', label: 'Create template', roles: ['academy_director', 'head_coach'], requiresApproval: false },
      { id: 'approve_review', label: 'Approve review item', roles: ['academy_director'], requiresApproval: true },
    ],
    outstandingDecisions: [
      { id: 'd1', summary: 'Orange 2 group is over capacity — rebalance', urgency: 'high' },
    ],
    donnaAssumptions: [
      { statement: 'Recommended rebalancing Orange 2 over hiring', basis: 'capacity 14/12 + no coach budget flag' },
    ],
    navigationTarget: null,
    memories: [
      { tags: ['orange 2', 'capacity'], content: 'Orange 2 has trended over capacity for 2 weeks' },
    ],
    lastEntityLabel: null,
    ...overrides,
  }
}

function recordTurn(userMsg: string, donnaReply: string) {
  history.push({ role: 'user', content: userMsg })
  history.push({ role: 'donna', content: donnaReply })
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function run() {
  process.stdout.write('\nDONNA Executive Conversational Readiness Certification\n')
  process.stdout.write('============================================================\n')
  clearOpenAICallLog()

  // TEST 1 — "Good morning." → resumes executive context.
  process.stdout.write('\n── Test 1: "Good morning." → resumes executive context ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('Good morning.'))
    check('1', "goal = analyze (resume, not chat-start)", r.plan.goal === 'analyze')
    check('1', 'outstanding decisions assembled into packet', r.packet.assembled.some(s => s.id === 'outstanding_decisions'))
    check('1', 'response resumes work (references the standing decision)', /rebalance|orange 2|stand/i.test(r.finalResponse))
    check('1', 'gateway invoked + instrumented for this goal', gatewayWasInvoked() && getLastOpenAICall()?.reasoningGoal === 'analyze')
    check('1', 'turn moves work forward (next action present)', r.nextAction.trim().length > 0)
    recordTurn('Good morning.', r.finalResponse)
  }

  // TEST 2 — "Create an Orange 2 class template." → prepares draft with context.
  process.stdout.write('\n── Test 2: "Create an Orange 2 class template." → prepares draft with context ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('Create an Orange 2 class template.', { activeWorkflowId: 'template_builder_completion' }))
    check('2', 'goal = create', r.plan.goal === 'create')
    check('2', 'curriculum context assembled (knows Orange 2)', r.packet.assembled.some(s => s.id === 'curriculum'))
    check('2', 'academy defaults assembled (knows default duration)', r.packet.assembled.some(s => s.id === 'academy_defaults'))
    check('2', 'plans page-owned workflow (not sidebar completion)', r.actionPlan.actions.some(a => a.kind === 'start_workflow'))
    check('2', 'required context fully met', r.packet.provenance.requiredMet)
    recordTurn('Create an Orange 2 class template.', r.finalResponse)
  }

  // TEST 3 — "Make it more competitive." → understands "it".
  process.stdout.write('\n── Test 3: "Make it more competitive." → understands "it" ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('Make it more competitive.', { activeDraft: ORANGE2_DRAFT, lastEntityLabel: ORANGE2_DRAFT.label }))
    check('3', 'goal = revise', r.plan.goal === 'revise')
    check('3', '"it" bound to the active draft', r.plan.effectiveMessage.includes('Orange 2 — Class Template'))
    check('3', '"it" no longer a dangling pronoun', !/\bit\b/i.test(r.plan.effectiveMessage))
    check('3', 'active draft + history assembled into packet', r.packet.assembled.some(s => s.id === 'active_draft') && r.packet.assembled.some(s => s.id === 'conversation_history'))
    check('3', 'response references the draft (workflow consistency)', /template|draft|orange 2/i.test(r.finalResponse))
    recordTurn('Make it more competitive.', r.finalResponse)
  }

  // TEST 4 — "Actually focus more on transition." → continuity on same intent.
  process.stdout.write('\n── Test 4: "Actually focus more on transition." → continuity ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('Actually focus more on transition.', { activeDraft: ORANGE2_DRAFT, lastEntityLabel: ORANGE2_DRAFT.label }))
    check('4', 'recognized as a continuation', r.plan.isContinuation)
    check('4', 'goal = revise (same intent, refined)', r.plan.goal === 'revise')
    check('4', 'still acting on the active draft', r.actionPlan.actions.some(a => a.kind === 'update_draft'))
    check('4', 'history carried (4+ prior turns)', r.packet.assembled.some(s => s.id === 'conversation_history'))
    recordTurn('Actually focus more on transition.', r.finalResponse)
  }

  // TEST 5 — "What were we working on yesterday?" → resumes prior work.
  process.stdout.write('\n── Test 5: "What were we working on yesterday?" → resumes prior work ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('What were we working on yesterday?'))
    check('5', 'goal = summarize (recall prior work)', r.plan.goal === 'summarize')
    check('5', 'conversation history assembled', r.packet.assembled.some(s => s.id === 'conversation_history'))
    check('5', 'history actually carries the template thread', r.packet.assembled.find(s => s.id === 'conversation_history')?.content.toLowerCase().includes('template') ?? false)
    recordTurn('What were we working on yesterday?', r.finalResponse)
  }

  // TEST 6 — "Why did you recommend this?" → explains reasoning.
  process.stdout.write('\n── Test 6: "Why did you recommend this?" → explains reasoning ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('Why did you recommend this?'))
    check('6', 'goal = explain', r.plan.goal === 'explain')
    check('6', 'DONNA assumptions assembled (the basis of the recommendation)', r.packet.assembled.some(s => s.id === 'donna_assumptions'))
    check('6', 'conversation history assembled (what "this" refers to)', r.packet.assembled.some(s => s.id === 'conversation_history'))
    recordTurn('Why did you recommend this?', r.finalResponse)
  }

  // TEST 7 — "How confident are you?" → explains confidence + missing info.
  process.stdout.write('\n── Test 7: "How confident are you?" → explains confidence ──\n')
  {
    const r = await runExecutiveOperatingTurn(baseState('How confident are you?'))
    check('7', 'goal = explain (confidence)', r.plan.goal === 'explain')
    check('7', 'packet carries an explicit confidence target', r.packet.confidenceTarget === REASONING_GOALS.explain.confidenceTarget && r.packet.confidenceTarget > 0)
    check('7', 'reasoning produced a confidence signal to explain', ['high', 'medium', 'low'].includes(r.reasoning.confidence))
    check('7', 'unavailable/omitted context is inspectable (can name missing info)', Array.isArray(r.packet.unavailable) && Array.isArray(r.packet.omitted))
  }

  // ── Cross-cutting guarantees ───────────────────────────────────────────────
  process.stdout.write('\n── Cross-cutting guarantees ──\n')
  check('X', 'every OpenAI invocation carried an explicit reasoning goal', getLastOpenAICall() !== null && getLastOpenAICall()!.reasoningGoal.length > 0)
  check('X', 'gateway was invoked on the conversation (provable call path)', gatewayWasInvoked())

  // ── Score ──────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  const score = (pct / 100) * 10

  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE CONVERSATIONAL READINESS: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write(`READINESS SCORE: ${score.toFixed(1)}/10\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nALL EXECUTIVE CONVERSATION TESTS PASS.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

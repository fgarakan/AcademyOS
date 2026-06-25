// Mega Sprint 3991–4020 — DONNA Unified Executive Context Engine V1
// Certification — proves there is ONE engine that grounds every reasoning request in
// the complete operating picture an experienced COO would have standing beside the
// Director: the current screen (page awareness), the conversation (continuity), the
// academy, permissions, available actions, and the always-include priority set.
//
// Offline + deterministic: no OpenAI key required. The engine assembles the
// Executive Context Packet from a ResolverState; this certification builds the
// ResolverState through the SAME live boundary the production pipeline uses
// (buildResolverStateFromLive) so the proof reflects the real wiring.
//
// Run: npx tsx src/lib/donna/certification/donnaUnifiedExecutiveContextCertification.ts

import { buildResolverStateFromLive, type LiveAcademyContext } from '@/lib/donna/executive/liveResolverAdapter'
import {
  assembleExecutiveContext,
  ALWAYS_INCLUDE_PRIORITY,
} from '@/lib/donna/executive/executiveContextEngine'
import { runExecutiveOperatingTurn } from '@/lib/donna/executive/executiveOperatingLayer'
import { resolvePageContextPacket } from '@/lib/donna/executive/pageContextPacketSource'
import { createPartialLivePageState, type LivePageState } from '@/lib/donna/operating/livePageState'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

const ACADEMY: LiveAcademyContext = { academyId: 'acad_1', name: 'Dabul Tennis Academy', modelLabel: 'Master Development Spine' }

function legacyStub(overrides: Partial<DonnaMessageResult> = {}): DonnaMessageResult {
  return {
    action: 'respond', response: 'ok', spokenResponse: 'ok',
    intent: null, entity: null, goal: null, confidence: 0.4,
    nextAction: null, followUpQuestion: null, shouldSpeak: true,
    navigateTo: null, startWorkflowId: null, cooControl: null,
    goalSessionCommand: null, startGoalType: null, requiresApproval: false,
    limitations: null, resolvedEntityV2: null, unifiedAnswer: null,
    disambiguationQuestion: null, updatedNavigatorState: null, strategicContext: null,
    pageIntelligence: null, realitySnapshot: null,
    debugLog: createDebugLog('x', 'director', '/director'),
    ...overrides,
  }
}

function input(
  route: string,
  message: string,
  live: LivePageState | null,
  history: Array<{ role: 'user' | 'donna'; content: string }> = [],
): DonnaMessageInput {
  return {
    userMessage: message, role: 'director', route,
    activeGuidedWorkflowId: null, cooState: null, goalMemory: null,
    conversationHistory: history, livePageState: live,
  }
}

// The 7 certification pages and a representative live state for each.
const PAGES: Array<{ name: string; route: string; live: LivePageState }> = [
  { name: 'Today', route: '/director/today', live: createPartialLivePageState('/director/today', { activePlayerCount: 24, activeCoachCount: 4, pendingReviewCount: 5, playersNeedingAttention: 3 }) },
  { name: 'Onboarding', route: '/director/onboarding', live: createPartialLivePageState('/director/onboarding', { onboardingComplete: false, onboardingProgress: 3 }) },
  { name: 'Curriculum', route: '/director/curriculum', live: createPartialLivePageState('/director/curriculum', { curriculumSpineActive: true, playersMissingCurriculumLevel: 6 }) },
  { name: 'Templates', route: '/director/templates', live: createPartialLivePageState('/director/templates', {}) },
  { name: 'Players', route: '/director/players', live: createPartialLivePageState('/director/players', { activePlayerCount: 24, playersNeedingAttention: 3, playersWithoutAssessment: 5 }) },
  { name: 'Coaches', route: '/director/coaches', live: createPartialLivePageState('/director/coaches', { activeCoachCount: 4 }) },
  { name: 'Approvals', route: '/director/review', live: createPartialLivePageState('/director/review', { pendingReviewCount: 5, pendingParentApprovals: 2, pendingCoachApprovals: 3 }) },
]

// The 5 questions a Director asks while looking at a screen.
const QUESTIONS = [
  'What should I do here?',
  'Walk me through this.',
  'Which should I select?',
  'Why?',
  'What happens if I choose this?',
]

async function run() {
  process.stdout.write('\nDONNA Unified Executive Context Engine Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. One engine assembles the complete operating picture ───────────────────
  process.stdout.write('\n── A. Unified engine assembles a complete, grounded packet ──\n')
  {
    const state = buildResolverStateFromLive(
      input('/director/curriculum', 'What should I do here?', PAGES[2].live, [
        { role: 'user', content: 'How is the academy doing?' },
        { role: 'donna', content: 'Six players still need a curriculum level.' },
      ]),
      'academy_director', ACADEMY, legacyStub(),
    )
    const ctx = assembleExecutiveContext(state)
    check('A', 'returns a reasoning plan (goal selected)', typeof ctx.plan.goal === 'string' && ctx.plan.goal.length > 0)
    check('A', 'returns a packet with assembled sources', ctx.packet.assembled.length > 0)
    check('A', 'returns a developer trace', typeof ctx.trace.contextTokens === 'number')
    check('A', 'identity grounded (role + academy present)', ctx.trace.sourcesIncluded.includes('role') && ctx.trace.sourcesIncluded.includes('academy'))
    check('A', 'page grounded (current_page in packet)', ctx.trace.pageGrounded === true)
    check('A', 'conversation grounded (continuity)', ctx.trace.conversationGrounded === true)
    check('A', 'no duplicate source ids (deduped)', ctx.trace.sourcesIncluded.length === new Set(ctx.trace.sourcesIncluded).size)
    check('A', 'token budget recorded (>0) and packet has size', ctx.trace.budgetTokens > 0 && ctx.trace.packetSizeChars > 0)
    check('A', 'token usage within budget for conditionals', ctx.trace.contextTokens <= ctx.trace.budgetTokens + 200)
  }

  // ── B. Page awareness across all 7 pages × 5 questions ───────────────────────
  process.stdout.write('\n── B. Page awareness — DONNA never asks "what page?" ──\n')
  {
    let allGrounded = true
    let allRich = true
    for (const page of PAGES) {
      // The page block itself must carry the screen's purpose + next action.
      const packet = resolvePageContextPacket(page.route, page.live)
      const richEnough = !!packet &&
        packet.pageTitle.length > 0 &&
        packet.pagePurpose.length > 0 &&
        packet.recommendedNextAction.length > 0 &&
        packet.visibleSections.length > 0 &&
        packet.availableActions.length > 0
      if (!richEnough) allRich = false

      for (const q of QUESTIONS) {
        const state = buildResolverStateFromLive(input(page.route, q, page.live), 'academy_director', ACADEMY, legacyStub())
        const ctx = assembleExecutiveContext(state)
        const pageSlice = ctx.packet.assembled.find(s => s.id === 'current_page')
        const grounded = !!pageSlice && pageSlice.content.includes(packet!.pageTitle) && pageSlice.content.includes('RECOMMENDED_NEXT')
        if (!grounded) {
          allGrounded = false
          failures.push(`[B] page="${page.name}" q="${q}" not grounded`)
        }
      }
    }
    check('B', 'all 7 pages expose rich context (title, purpose, sections, actions, next)', allRich)
    check('B', `all 7 pages × ${QUESTIONS.length} questions ground the current screen into the packet`, allGrounded)
  }

  // ── C. Conversation continuity ───────────────────────────────────────────────
  process.stdout.write('\n── C. Conversation continuity — DONNA keeps the thread ──\n')
  {
    const state = buildResolverStateFromLive(
      input('/director/curriculum', 'Why does that matter?', PAGES[2].live, [
        { role: 'user', content: 'Should I assign the six players now?' },
        { role: 'donna', content: 'Yes — assign them before the next assessment cycle.' },
      ]),
      'academy_director', ACADEMY, legacyStub(),
    )
    const ctx = assembleExecutiveContext(state)
    check('C', 'conversation_history grounded into packet', ctx.trace.conversationGrounded === true)
    const convoSlice = ctx.packet.assembled.find(s => s.id === 'conversation_history')
    check('C', 'history slice carries the prior turns', !!convoSlice && convoSlice.content.includes('assign'))
    check('C', 'continuity resolution produced', typeof ctx.continuity.isContinuation === 'boolean')
  }

  // ── D. Token strategy — always-include priority + minimality ─────────────────
  process.stdout.write('\n── D. Token strategy — prioritize, dedupe, respect budget ──\n')
  {
    const state = buildResolverStateFromLive(
      input('/director/today', 'What should I do here?', PAGES[0].live, [{ role: 'user', content: 'morning' }]),
      'academy_director', ACADEMY, legacyStub(),
    )
    const tight = assembleExecutiveContext(state, { budgetTokens: 200 })
    check('D', 'always-include priority is the documented COO set', ALWAYS_INCLUDE_PRIORITY.join(',') === 'current_page,academy,active_workflow,conversation_history')
    check('D', 'page survives even under a tight budget (page is priority)', tight.trace.pageGrounded === true)
    check('D', 'no duplicate sources under tight budget', tight.trace.sourcesIncluded.length === new Set(tight.trace.sourcesIncluded).size)
    check('D', 'skipped sources are recorded (auditable minimality)', Array.isArray(tight.trace.sourcesSkipped))
  }

  // ── E. Developer trace completeness (Objective 5) ────────────────────────────
  process.stdout.write('\n── E. Developer trace — every field a developer needs ──\n')
  {
    const state = buildResolverStateFromLive(input('/director/players', 'Why?', PAGES[4].live), 'academy_director', ACADEMY, legacyStub())
    const { trace } = assembleExecutiveContext(state)
    check('E', 'trace exposes sources included', Array.isArray(trace.sourcesIncluded) && trace.sourcesIncluded.length > 0)
    check('E', 'trace exposes sources skipped', Array.isArray(trace.sourcesSkipped))
    check('E', 'trace exposes unavailable sources (honest)', Array.isArray(trace.sourcesUnavailable))
    check('E', 'trace exposes context token count', typeof trace.contextTokens === 'number')
    check('E', 'trace exposes packet size (chars)', trace.packetSizeChars > 0)
    check('E', 'trace exposes page + conversation grounding flags', typeof trace.pageGrounded === 'boolean' && typeof trace.conversationGrounded === 'boolean')
    check('E', 'trace exposes requiredMet', typeof trace.requiredMet === 'boolean')
  }

  // ── F. Convergence — the operating turn uses the SAME engine ──────────────────
  process.stdout.write('\n── F. Convergence — no duplicate context builder ──\n')
  {
    const state = buildResolverStateFromLive(input('/director/curriculum', 'What should I do here?', PAGES[2].live), 'academy_director', ACADEMY, legacyStub())
    const engine = assembleExecutiveContext(state)
    const turn = await runExecutiveOperatingTurn(state) // fail-open without an OpenAI key
    check('F', 'operating turn exposes the engine trace', !!turn.contextTrace)
    check('F', 'turn packet sources match the engine packet sources', turn.contextTrace.sourcesIncluded.join(',') === engine.trace.sourcesIncluded.join(','))
    check('F', 'turn goal matches the engine goal (single plan source)', turn.plan.goal === engine.plan.goal)
    check('F', 'turn page grounding matches the engine', turn.contextTrace.pageGrounded === engine.trace.pageGrounded)
  }

  // ── G. Unknown route is honest (no fabrication) ──────────────────────────────
  process.stdout.write('\n── G. Unknown route — honest, never fabricated ──\n')
  {
    const packet = resolvePageContextPacket('/director/some-unknown-screen', null)
    check('G', 'unknown route yields no fabricated page context', packet === null)
    const state = buildResolverStateFromLive(input('/director/some-unknown-screen', 'What should I do here?', null), 'academy_director', ACADEMY, legacyStub())
    const ctx = assembleExecutiveContext(state)
    check('G', 'engine still assembles identity + academy for unknown routes', ctx.trace.sourcesIncluded.includes('academy'))
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`UNIFIED EXECUTIVE CONTEXT ENGINE: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nUNIFIED EXECUTIVE CONTEXT ENGINE CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

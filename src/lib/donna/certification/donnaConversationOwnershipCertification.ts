// Mega Sprint 4321–4350 — DONNA Conversation Ownership V1
// Certification — DONNA carries the conversation and workflow like an elite COO.
// A vague-lead request ("who should we start with?", "what should I do here?",
// "guide me", "continue", "what next?") on a known page is resolved into a
// page + live-state-led recommendation (5-beat: see · recommend · why · first
// action · what next), with no passive clarification, correct Players-page
// prioritization, working "continue" carry, and a populated developer trace.
//
// Pure / offline: dataset → resolver → router, the same path the live app runs.
//
// Run: npx tsx src/lib/donna/certification/donnaConversationOwnershipCertification.ts

import {
  detectVagueLeadRequest,
  resolvePageLedGuidance,
  resolvePageOnlyLead,
  formatPageLedDiagnostics,
} from '@/lib/donna/conversation/donnaPageLedConversation'
import { routeDonnaConversation } from '@/lib/donna/brain/donnaCanonicalRouter'
import { hasChatbotHedging } from '@/lib/donna/conversation/donnaConversationDNA'
import { buildDemoContext, type DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { classifyIntent } from '@/lib/donna/intent/donnaIntentEngine'
import { routeDonnaPrompt } from '@/lib/donna/donnaConversationalRouter'
import { dispatchUIIntent } from '@/lib/donna/donnaUIActionDispatcher'
import { resolveTextToGoal } from '@/lib/donna/goals/donnaGoalEngine'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(label) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

// ── Fixtures ─────────────────────────────────────────────────────────────────────
// A live context derived from the canonical demo context. Overrides only what a
// given proof needs — everything else stays realistic.
function liveCtx(overrides: Partial<DirectorDonnaContext> = {}): DirectorDonnaContext {
  return {
    ...buildDemoContext(),
    isLive: true,
    confidence: 'high',
    ...overrides,
  }
}

// Players-page fixture matching the sprint's worked example: a couple of named
// players needing a placement decision, plus a large no-level backlog.
const playersCtx = liveCtx({
  playerCount: 51,
  playerCurriculumStateCount: 2,
  attentionItems: [
    { playerId: 'p-alex', playerName: 'Alex Chen', reason: 'pending placement', risk: 'high', source: 'manual' },
    { playerId: 'p-maya', playerName: 'Maya Lopez', reason: 'pending placement', risk: 'medium', source: 'manual' },
  ],
  highRiskPlayerCount: 1,
  mediumRiskPlayerCount: 1,
})

const VAGUE_LEADS = [
  'who should we start with?',
  'what should I do here?',
  'guide me',
  'continue',
  "what's next?",
  'what next',
  'where do I start?',
]

const FIVE_BEAT_MARKERS = ["Here's what I'd do:", 'Why:', 'What comes next:']

function run() {
  process.stdout.write('\nDONNA Conversation Ownership Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Vague-lead detection (Obj 1) ──────────────────────────────────────────
  process.stdout.write('\n── A. Vague-lead intent resolves (Obj 1) ──\n')
  for (const t of VAGUE_LEADS) {
    check(`detects vague-lead: "${t}"`, detectVagueLeadRequest(t) !== null)
  }
  check('does NOT treat a specific data question as vague-lead', detectVagueLeadRequest('how many players are in Orange 2?') === null)
  check('does NOT treat a parent-draft request as vague-lead', detectVagueLeadRequest('draft a parent summary for Alex') === null)

  // ── B. Conversation leadership — 5-beat, no passive clarification (Obj 2 + 3) ─
  process.stdout.write('\n── B. Leads with recommendation, zero passive clarification (Obj 2 + 3) ──\n')
  {
    const g = resolvePageLedGuidance({ text: 'guide me', route: '/director/players', ctx: playersCtx })
    check('guidance returned on Players', !!g)
    if (g) {
      for (const m of FIVE_BEAT_MARKERS) {
        check(`answer contains 5-beat marker "${m}"`, g.answer.text.includes(m))
      }
      check('answer leads with what DONNA sees (mentions the page)', /you're on the players/i.test(g.answer.text))
      check('answer has NO chatbot hedging / passive clarification', !hasChatbotHedging(g.answer.text))
      check('answer has no "would you like" menu', !/would you like to/i.test(g.answer.text))
      check('answer has no "I want to make sure I understand"', !/make sure i understand/i.test(g.answer.text))
      check('answer is answerable + has a follow-up next step', g.answer.isAnswerable && !!g.answer.followUp)
    }
  }

  // ── C. Players-page prioritization proof (Obj 5) ─────────────────────────────
  process.stdout.write('\n── C. Players page prioritizes placement before no-level, names first player (Obj 5) ──\n')
  {
    const g = resolvePageLedGuidance({ text: 'who should we start with?', route: '/director/players', ctx: playersCtx })
    check('Players guidance returned', !!g)
    if (g) {
      check('names the first player (Alex Chen)', g.answer.text.includes('Alex'))
      check('mentions the no-level backlog (49)', g.answer.text.includes('49'))
      check('prioritizes placement BEFORE no-level (source = namedPlacement)', g.diagnostics.recommendationSource === 'ledPlayers.namedPlacement')
      check('recommendation states placement before no-level ("before the 49")', /before the 49 player/i.test(g.answer.text))
      check('deep-links to the first player profile', g.answer.href === '/director/players/p-alex')
      check('guides the next step (level decision)', /level decision/i.test(g.answer.text))
      check('active objective carries placement-then-level', /placement/i.test(g.diagnostics.activeObjective))
    }
  }
  // No-level-only fallback when nothing is flagged.
  {
    const ctx = liveCtx({ playerCount: 12, playerCurriculumStateCount: 0, attentionItems: [] })
    const g = resolvePageLedGuidance({ text: 'what should I do here?', route: '/director/players', ctx })
    check('no-level bulk leads when no named players', !!g && g.diagnostics.recommendationSource === 'ledPlayers.noLevelBulk')
  }

  // ── D. Workflow carry — "continue" resumes, not restarts (Obj 4) ─────────────
  process.stdout.write('\n── D. "continue" resumes the active workflow (Obj 4) ──\n')
  {
    const g = resolvePageLedGuidance({ text: 'continue', route: '/director/players', ctx: playersCtx })
    check('continue returns guidance', !!g)
    if (g) {
      check('continue keeps moving on the current priority', /let's keep moving/i.test(g.answer.text))
      check('continue does NOT falsely claim to restore a prior thread', !/picking up where we left off/i.test(g.answer.text))
      check('continue carries an active objective', g.diagnostics.activeObjective.length > 0)
      check('continue names the next item', g.diagnostics.nextAction.length > 0)
    }
  }

  // ── E. Cross-page proof (Obj 6) ──────────────────────────────────────────────
  process.stdout.write('\n── E. Cross-page conversation ownership (Obj 6) ──\n')
  {
    const pages: Array<[string, string]> = [
      ['/director/today', "Today's Academy"],
      ['/director/players', 'Player'],
      ['/director/curriculum', 'Curriculum'],
      ['/director/templates', 'Templates'],
      ['/director/onboarding', 'setup'],
      ['/director/review', 'Review'],
    ]
    for (const [route, expectFragment] of pages) {
      const g = resolvePageLedGuidance({ text: 'what next', route, ctx: liveCtx() })
      const ok = !!g
        && g.diagnostics.pageUsed === route
        && FIVE_BEAT_MARKERS.every(m => g.answer.text.includes(m))
        && !hasChatbotHedging(g.answer.text)
        && g.diagnostics.stateUsed.length > 0
      check(`${route} → page-aware led guidance, no hedging, state used`, ok)
      check(`${route} → page label/intent references "${expectFragment}"`, !!g && (g.answer.text.toLowerCase().includes(expectFragment.toLowerCase()) || g.diagnostics.pageLabel.toLowerCase().includes(expectFragment.toLowerCase())))
    }
  }

  // ── F. Diagnostics / developer trace (Obj 7) ─────────────────────────────────
  process.stdout.write('\n── F. Developer trace exposed (Obj 7) ──\n')
  {
    const g = resolvePageLedGuidance({ text: 'guide me', route: '/director/review', ctx: liveCtx() })
    check('diagnostics present', !!g)
    if (g) {
      const d = g.diagnostics
      check('trace: inferred intent', d.inferredIntent === 'guide_me')
      check('trace: page used', d.pageUsed === '/director/review')
      check('trace: state used non-empty', d.stateUsed.length > 0)
      check('trace: recommendation source', d.recommendationSource.length > 0)
      check('trace: clarification avoided', d.clarificationAvoided === true)
      check('trace: active objective', d.activeObjective.length > 0)
      check('trace: next action', d.nextAction.length > 0)
      check('trace: reality grounded flag set (live ctx)', d.realityGrounded === true)
      const formatted = formatPageLedDiagnostics(d)
      check('formatter emits a readable trace', /inferred intent/.test(formatted) && /next action/.test(formatted))
    }
  }

  // ── G. Canonical router integration + backward compat ────────────────────────
  process.stdout.write('\n── G. Router routes vague-lead to page_led; route-less unchanged ──\n')
  {
    const withRoute = routeDonnaConversation({ text: 'who should we start with?', directorCtx: playersCtx, route: '/director/players' })
    check('router stage = page_led when route present', withRoute.stage === 'page_led')
    check('router page_led is matched + reality-grounded', withRoute.matched && withRoute.realityGrounded)
    check('router page_led never requires approval (read/guidance only)', withRoute.requiresApproval === false)
    check('router page_led answer names the first player', !!withRoute.answer && withRoute.answer.text.includes('Alex'))

    const noRoute = routeDonnaConversation({ text: 'who should we start with?', directorCtx: playersCtx })
    check('router does NOT use page_led without a route (backward compat)', noRoute.stage !== 'page_led')

    // A specific data question is still handled by its own engine, not page_led.
    const specific = routeDonnaConversation({ text: 'who needs attention?', directorCtx: playersCtx, route: '/director/players' })
    check('specific roster question keeps its engine (not page_led)', specific.stage !== 'page_led')
  }

  // ── H. Leaf clarifier overrides (Obj 3 — legacy passive sources) ─────────────
  process.stdout.write('\n── H. Legacy clarification sources lead from the page (Obj 3) ──\n')
  {
    // Intent engine
    const ir = classifyIntent('guide me', '/director/curriculum')
    check('intent engine: clarification leads from page (no "Did you mean" menu)', !!ir.clarificationQuestion && !/did you mean/i.test(ir.clarificationQuestion) && !hasChatbotHedging(ir.clarificationQuestion))

    // Conversational router
    const rr = routeDonnaPrompt('what should I do here', '/director/templates')
    check('conversational router: leads (no clarification ask)', rr.shouldAskClarification === false && !!rr.recommendedNextStep && !hasChatbotHedging(rr.recommendedNextStep))

    // UI action dispatcher
    const dr = dispatchUIIntent('guide me', 'academy_director', '/director/today')
    check('dispatcher: page-led message (not passive)', dr.actionId === 'page_led_guidance' && !hasChatbotHedging(dr.message))

    // Goal engine — passive opener removed at source
    const goalQ = resolveTextToGoal('I want to do something', '/director').clarificationQuestion
    check('goal engine: no "I want to make sure I understand" anywhere', !goalQ || !/make sure i understand/i.test(goalQ))
    check('goal engine: no "describe what you need in your own words"', !goalQ || !/describe what you need in your own words/i.test(goalQ))

    // Page-only lead helper is null without a route (safe default)
    check('resolvePageOnlyLead returns null without a route', resolvePageOnlyLead('guide me', null) === null)
    check('resolvePageOnlyLead returns null for non-lead text', resolvePageOnlyLead('how many players in Orange 2', '/director/players') === null)
  }

  // ── I. Code-review regression guards (Mega Sprint 4321–4350 review pass) ─────
  process.stdout.write('\n── I. Review-pass regressions guarded ──\n')
  {
    // (#2) Anchored patterns: terminal lead matches; specific questions do not.
    check('over-match guard: "what\'s next?" is a lead', detectVagueLeadRequest("what's next?") !== null)
    check('over-match guard: "what\'s the next level after Orange?" is NOT a lead', detectVagueLeadRequest("what's the next level after Orange?") === null)
    check('over-match guard: "what\'s next on Thursday\'s schedule?" is NOT a lead', detectVagueLeadRequest("what's next on Thursday's schedule?") === null)
    check('over-match guard: "where do I start with the curriculum?" is NOT a lead', detectVagueLeadRequest('where do I start with the curriculum?') === null)

    // (#1) Canonical router: a direct-mutation request that ends in a lead phrase
    // is still safety-blocked, never answered as page-led.
    const muta = routeDonnaConversation({ text: 'move this player up now, then what next', directorCtx: playersCtx, route: '/director/players' })
    check('safety ordering: mutation + lead suffix → safety_block (not page_led)', muta.stage === 'safety_block' && muta.requiresApproval)

    // (#3) False all-clear: a page whose own counters are clear but the academy
    // has a live high-risk item must surface it, never claim "nothing is blocking".
    const clearButAtRisk = liveCtx({ pendingReviews: 0, missingWrapUps: 0, todaySessions: 3 })
    const g = resolvePageLedGuidance({ text: 'what next', route: '/director/today', ctx: clearButAtRisk })
    check('no false all-clear when an attention item is live', !!g && g.diagnostics.recommendationSource === 'ledFromTopAction')
    check('no false all-clear: text does not claim "nothing is blocking you"', !!g && !/nothing is blocking you/i.test(g.answer.text))
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`Conversation Ownership: ${passed}/${passed + failed} checks passed\n`)
  if (failed > 0) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write('============================================================\n')
  process.exit(failed > 0 ? 1 : 0)
}

run()

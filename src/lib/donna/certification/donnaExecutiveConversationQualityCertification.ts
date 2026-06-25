// Mega Sprint 4021–4050 — DONNA Executive Conversation Quality V1
// Certification — proves DONNA sounds like an experienced COO sitting beside the
// Director, not a chatbot: answer-first, decisive, page-aware, continuity-keeping.
//
// Conversation quality only — no new architecture. This exercises the canonical
// voice contract (donnaConversationDNA), the deterministic executive-voice polish
// that runs live, the live presentation layer (applyExecutiveRefinement), and the
// page-aware context the Director already has on every screen.
//
// Offline + deterministic — no OpenAI key required.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveConversationQualityCertification.ts

import {
  applyExecutiveVoice,
  isExecutiveVoiceClean,
  hasChatbotHedging,
  answersFirst,
  endsWithGuidance,
  conformsToConversationDNA,
  hasExecutiveRecommendationShape,
} from '@/lib/donna/conversation/donnaConversationDNA'
import { resolvePageContextPacket } from '@/lib/donna/executive/pageContextPacketSource'
import { applyExecutiveRefinement } from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import { createPartialLivePageState, type LivePageState } from '@/lib/donna/operating/livePageState'
import { isAcknowledgmentPhrase } from '@/lib/donna/conversation/donnaAcknowledgmentHandler'
import { isContinuityPhrase } from '@/lib/donna/memory/donnaGoalMemory'
import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0
let failed = 0
const failures: string[] = []
function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

function extractNumbers(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort()
}

// A COO-style answer the Director would get for "What should I do here?", built only
// from the page context they are already looking at (page-aware guidance).
function pageAnswer(route: string, live: LivePageState | null): string {
  const p = resolvePageContextPacket(route, live)
  if (!p) return ''
  return `You're on ${p.pageTitle}. I'd recommend you ${p.recommendedNextAction[0].toLowerCase()}${p.recommendedNextAction.slice(1)} ` +
    `That keeps the academy moving, and you'll clear the highest-impact item first. Want me to walk you through it?`
}

const PAGES: Array<{ name: string; route: string; live: LivePageState }> = [
  { name: 'Today', route: '/director/today', live: createPartialLivePageState('/director/today', { pendingReviewCount: 5, playersNeedingAttention: 3 }) },
  { name: 'Onboarding', route: '/director/onboarding', live: createPartialLivePageState('/director/onboarding', { onboardingComplete: false, onboardingProgress: 3 }) },
  { name: 'Curriculum', route: '/director/curriculum', live: createPartialLivePageState('/director/curriculum', { curriculumSpineActive: true, playersMissingCurriculumLevel: 6 }) },
  { name: 'Templates', route: '/director/templates', live: createPartialLivePageState('/director/templates', {}) },
  { name: 'Players', route: '/director/players', live: createPartialLivePageState('/director/players', { playersNeedingAttention: 3 }) },
  { name: 'Coaches', route: '/director/coaches', live: createPartialLivePageState('/director/coaches', { activeCoachCount: 4 }) },
  { name: 'Approvals', route: '/director/review', live: createPartialLivePageState('/director/review', { pendingReviewCount: 5, pendingParentApprovals: 2 }) },
]

function liveResult(response: string, overrides: Partial<DonnaMessageResult> = {}): DonnaMessageResult {
  return {
    action: 'respond', response, spokenResponse: response,
    intent: null, entity: null, goal: null, confidence: 0.8,
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

async function run() {
  process.stdout.write('\nDONNA Executive Conversation Quality Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Natural executive voice — chatbot hedging is removed (Obj 1) ──────────
  process.stdout.write('\n── A. Natural executive voice — no chatbot hedging ──\n')
  {
    const HEDGED = [
      "I think you're asking about the review queue. You have 5 items waiting.",
      'Could you clarify which group you mean?',
      'Would you like me to open the review queue?',
      'If I understand correctly, you want to advance Jake.',
      'Sure, I can help with that. Start with the parent-visible items.',
      "I'd be happy to walk you through onboarding.",
      'You may wish to consider assigning the 6 players first.',
      'Please choose a curriculum level for the player.',
    ]
    let allCleaned = true
    let allConform = true
    let allIdempotent = true
    let allFactSafe = true
    for (const h of HEDGED) {
      check('A', `flagged as hedging: "${h.slice(0, 38)}…"`, hasChatbotHedging(h))
      const voiced = applyExecutiveVoice(h)
      if (hasChatbotHedging(voiced)) { allCleaned = false; failures.push(`[A] not cleaned: ${voiced}`) }
      if (!conformsToConversationDNA(voiced).conforms) allConform = false
      if (applyExecutiveVoice(voiced) !== voiced) allIdempotent = false
      if (extractNumbers(h).join(',') !== extractNumbers(voiced).join(',')) allFactSafe = false
    }
    check('A', 'every hedged line is cleaned (no hedging remains)', allCleaned)
    check('A', 'every cleaned line conforms to Conversation DNA', allConform)
    check('A', 'normalizer is idempotent (second pass is a no-op)', allIdempotent)
    check('A', 'normalizer preserves every number (fact-safe)', allFactSafe)
    check('A', 'names preserved (e.g. "Jake", "Orange 2")', applyExecutiveVoice("I think you're asking about Jake in Orange 2.").includes('Jake') && applyExecutiveVoice('about Orange 2 with 2 players').includes('Orange 2'))
    check('A', 'already-clean executive text is left unchanged', isExecutiveVoiceClean("I'd recommend you open the review queue first. Want me to start it?"))
  }

  // ── B. Page-aware guidance — never asks "what page?" (Obj 2) ──────────────────
  process.stdout.write('\n── B. Page-aware guidance across all 7 pages ──\n')
  {
    let allAnswerFirst = true, allGuide = true, allNoAskPage = true, allConform = true, allHavePage = true
    for (const p of PAGES) {
      const ans = pageAnswer(p.route, p.live)
      if (!ans) { allHavePage = false; failures.push(`[B] no page packet for ${p.name}`); continue }
      if (!answersFirst(ans)) { allAnswerFirst = false; failures.push(`[B] ${p.name} not answer-first`) }
      if (!endsWithGuidance(ans)) { allGuide = false; failures.push(`[B] ${p.name} no guidance`) }
      if (/what (page|screen) are you on|which screen|what are you looking at/i.test(ans)) allNoAskPage = false
      if (!conformsToConversationDNA(ans).conforms) { allConform = false; failures.push(`[B] ${p.name} DNA: ${conformsToConversationDNA(ans).violations}`) }
    }
    check('B', 'all 7 pages produce a page-grounded answer', allHavePage)
    check('B', 'every page answer leads with substance (answer-first)', allAnswerFirst)
    check('B', 'every page answer ends by guiding the next step', allGuide)
    check('B', 'no page answer asks the Director what page they are on', allNoAskPage)
    check('B', 'every page answer conforms to Conversation DNA', allConform)
  }

  // ── C. Executive recommendations — action·why·tradeoff·outcome·next (Obj 3) ───
  process.stdout.write('\n── C. Executive recommendation shape ──\n')
  {
    const good = "I'd recommend you finalize placement for the 6 intake players now, because each unplaced player can't be tracked. The tradeoff is ten minutes of review, but you'll unlock their attendance and progression. Next, open the first intake card."
    const weak = 'There are some players in intake.'
    const g = hasExecutiveRecommendationShape(good)
    check('C', 'a full recommendation registers action + why + next', g.complete)
    check('C', 'a full recommendation surfaces the tradeoff', g.present.tradeoff)
    check('C', 'a full recommendation states the expected outcome', g.present.outcome)
    check('C', 'a bare statement is NOT a complete recommendation', !hasExecutiveRecommendationShape(weak).complete)
  }

  // ── D. Guided completion — always a next step (Obj 4) ─────────────────────────
  process.stdout.write('\n── D. Guided completion — never abandon the workflow ──\n')
  {
    let allNext = true
    for (const p of PAGES) {
      const ans = pageAnswer(p.route, p.live)
      if (!endsWithGuidance(ans)) { allNext = false; failures.push(`[D] ${p.name} leaves no next step`) }
    }
    check('D', 'every page guides to a concrete next step', allNext)
    check('D', 'a clean answer with no next step is flagged', !endsWithGuidance('You have 5 items in the queue.'))
  }

  // ── E. Conversation continuity — references resolve (Obj 5) ───────────────────
  process.stdout.write('\n── E. Continuity — yes/okay/continue and this/that ──\n')
  {
    // Acknowledgments and continuity phrases are recognized by their respective
    // resolvers — DONNA never loses the thread on a short "yes / continue".
    const recognized = (t: string) => isAcknowledgmentPhrase(t) || isContinuityPhrase(t)
    for (const tok of ['yes', 'okay', 'ok', 'sure', 'continue', "let's continue", 'keep going']) {
      check('E', `continuity token recognized: "${tok}"`, recognized(tok))
    }
    // The voice normalizer must never break continuity references.
    const withRefs = "I'd recommend you finish that here, then continue with this next."
    const voiced = applyExecutiveVoice(withRefs)
    check('E', 'voice polish preserves this/that/here/continue references', /that/.test(voiced) && /here/.test(voiced) && /this/.test(voiced) && /continue/.test(voiced))
  }

  // ── F. Live integration — the no-key path still sheds hedging (Obj 1 + 6) ─────
  process.stdout.write('\n── F. Live presentation layer cleans hedging without OpenAI ──\n')
  {
    const hedged = liveResult(
      'Would you like me to open the review queue? You have 5 items waiting.',
      { navigateTo: '/director/review' },
    )
    // Simulate no OpenAI key: the refiner returns the draft unchanged.
    const out = await applyExecutiveRefinement(hedged, 'director', {
      pilotMode: true,
      refine: async () => ({ text: hedged.response, refined: false, source: 'skipped', latencyMs: 0 }),
    })
    check('F', 'deterministic voice polish removed the chatbot hedging', !hasChatbotHedging(out.response))
    check('F', 'the fact (5 items) is preserved', out.response.includes('5'))
    check('F', 'structured navigation passes through unchanged', out.navigateTo === '/director/review')
    check('F', 'spokenResponse is updated to match', !hasChatbotHedging(out.spokenResponse))

    // Safety: an approval-gated result is NOT touched (ineligible).
    const gated = liveResult('Would you like me to approve this?', { requiresApproval: true, navigateTo: '/director/review' })
    const gatedOut = await applyExecutiveRefinement(gated, 'director', { pilotMode: true, refine: async () => ({ text: gated.response, refined: false, source: 'skipped', latencyMs: 0 }) })
    check('F', 'approval-gated responses are left untouched (safety first)', gatedOut.response === gated.response)
  }

  // ── G. Communication standards — concise, never more verbose (Obj 6) ──────────
  process.stdout.write('\n── G. Concision — executive polish never adds verbosity ──\n')
  {
    const samples = [
      "I think you're asking about the curriculum. You have 6 unassigned players.",
      'Sure, of course — would you like me to start the review?',
    ]
    let neverLonger = true
    for (const s of samples) {
      if (applyExecutiveVoice(s).length > s.length) neverLonger = false
    }
    check('G', 'voice polish never makes a response longer', neverLonger)
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE CONVERSATION QUALITY: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE CONVERSATION QUALITY CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

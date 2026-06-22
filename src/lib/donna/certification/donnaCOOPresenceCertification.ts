// Mega Sprint 3481–3510 — DONNA COO Presence V1
// Executive Presence Certification.
//
// Certifies that the Executive Presence Contract surfaces the existing COO
// intelligence (opinion · tradeoff · memory · proactive) by default on a plain
// grounded answer, while preserving every fact and structured field, staying
// relevance-gated, idempotent, and fail-safe.
//
// Run: npx tsx src/lib/donna/certification/donnaCOOPresenceCertification.ts

import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'
import type { DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import {
  enforceExecutivePresence,
  hasExecutiveOpinion,
  hasTradeoff,
  isExecutivePresenceRelevant,
} from '@/lib/donna/conversation/donnaExecutivePresenceContract'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) { passed++; process.stdout.write(`  ✓ ${label}\n`) }
  else { failed++; failures.push(label); process.stdout.write(`  ✗ ${label}\n`) }
}

// A strong demo reality bundle that guarantees a ranked top attention item.
const CTX = {
  ...buildDemoContext(),
  pendingReviews: 8,
  attendanceExceptions: 2,
  evidenceDrafts: 1,
  oldestPendingReviewAgeDays: 12,
}

const REPORT = buildAcademyAttentionReport(CTX)
const TOP = REPORT.topAction

function makeResult(partial: Partial<DonnaMessageResult>): DonnaMessageResult {
  return {
    action: 'respond',
    response: '',
    spokenResponse: '',
    intent: null,
    entity: null,
    goal: null,
    confidence: 0.8,
    nextAction: null,
    followUpQuestion: null,
    shouldSpeak: false,
    navigateTo: null,
    startWorkflowId: null,
    cooControl: null,
    goalSessionCommand: null,
    startGoalType: null,
    requiresApproval: false,
    limitations: null,
    resolvedEntityV2: null,
    unifiedAnswer: null,
    disambiguationQuestion: null,
    updatedNavigatorState: null,
    strategicContext: null,
    pageIntelligence: null,
    realitySnapshot: null,
    debugLog: createDebugLog('cert', 'director', '/director'),
    ...partial,
  }
}

function numbersIn(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort()
}

// ── Setup sanity ────────────────────────────────────────────────────────────────

function runSetup(): void {
  process.stdout.write('\n── Setup: existing intelligence available ──\n')
  check('demo reality yields a ranked top attention item', !!TOP)
  check('top item carries whyItMatters (tradeoff source)', !!TOP?.whyItMatters?.trim())
}

// ── Default surfacing on a reporter-style answer ────────────────────────────────

const reporterAnswer = makeResult({
  response: 'Attendance is at 78% this month.',
  nextAction: { label: 'Open attendance', route: '/director/sessions' } as DonnaMessageResult['nextAction'],
  followUpQuestion: 'Want the by-group breakdown?',
})

const enriched = enforceExecutivePresence(reporterAnswer, {
  directorCtx: CTX,
  userMessage: 'What should I focus on today?',
  conversationHistory: null,
  navigatorState: null,
})

function runSurfacing(): void {
  process.stdout.write('\n── Executive presence surfaced by default ──\n')
  check('Observation: response is enriched beyond the bare report', enriched.response.length > reporterAnswer.response.length)
  check('Judgment: an executive opinion is now present', hasExecutiveOpinion(enriched.response))
  check('Prioritization: names the top priority', !!TOP && enriched.response.toLowerCase().includes(TOP.label.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 4)[0] ?? TOP.label.toLowerCase()))
  check('Tradeoffs: a tradeoff is now present', hasTradeoff(enriched.response))
  check('Recommendations: single best action preserved (nextAction unchanged)', enriched.nextAction?.route === '/director/sessions')
  check('Follow-through: followUpQuestion preserved', enriched.followUpQuestion === 'Want the by-group breakdown?')
  check('Decision quality: opinion is decisive (no hedging)', !/you (may|might) (wish|want) to consider/i.test(enriched.response) && hasExecutiveOpinion(enriched.response))
}

// ── Trust: facts preserved, no structural mutation ──────────────────────────────

function runTrust(): void {
  process.stdout.write('\n── Trust: facts + structure preserved ──\n')
  // every original number survives
  const origNums = numbersIn(reporterAnswer.response)
  const newNums = numbersIn(enriched.response)
  check('original facts (numbers) preserved', origNums.every(n => newNums.includes(n)))
  // any number in the enriched text must come from reality (original ∪ top fields)
  const realityPool = numbersIn(`${reporterAnswer.response} ${TOP?.label ?? ''} ${TOP?.whyItMatters ?? ''} ${TOP?.evidence ?? ''} ${TOP?.bestNextAction ?? ''}`)
  check('no fabricated numbers introduced', newNums.every(n => realityPool.includes(n)))
  check('action unchanged (still respond)', enriched.action === 'respond')
  check('requiresApproval unchanged', enriched.requiresApproval === false)
  check('spokenResponse has no markdown', !/[*#`]/.test(enriched.spokenResponse))
}

// ── Memory / continuity ─────────────────────────────────────────────────────────

function runMemory(): void {
  process.stdout.write('\n── Executive memory (continuity) ──\n')
  const kw = (TOP?.label ?? 'review queue')
  const withHistory = enforceExecutivePresence(reporterAnswer, {
    directorCtx: CTX,
    userMessage: 'What should I focus on today?',
    conversationHistory: [
      { role: 'user', content: kw },
      { role: 'donna', content: 'Noted.' },
    ],
    navigatorState: null,
  })
  check('continuity callback when concern was raised earlier', /raised this earlier/i.test(withHistory.response))
}

// ── Guardrails: relevance, idempotency, fail-safe ───────────────────────────────

function runGuardrails(): void {
  process.stdout.write('\n── Guardrails ──\n')

  // Idempotent — running twice changes nothing further.
  const twice = enforceExecutivePresence(enriched, {
    directorCtx: CTX,
    userMessage: 'What should I focus on today?',
    conversationHistory: null,
    navigatorState: null,
  })
  check('idempotent (second pass is a no-op)', twice.response === enriched.response)

  // No directorCtx → no-op (fail-safe).
  const noCtx = enforceExecutivePresence(reporterAnswer, { directorCtx: null, userMessage: 'What should I focus on today?' })
  check('no-op without director context', noCtx.response === reporterAnswer.response)

  // Approval-gated → untouched.
  const gated = makeResult({ response: 'This needs your approval first.', requiresApproval: true })
  const gatedOut = enforceExecutivePresence(gated, { directorCtx: CTX, userMessage: 'What should I focus on today?' })
  check('no-op on approval-gated answers', gatedOut.response === gated.response)

  // Irrelevant narrow question → no non-sequitur.
  const narrow = makeResult({ response: 'The next assessment window opens in March.' })
  const narrowOut = enforceExecutivePresence(narrow, { directorCtx: CTX, userMessage: 'Tell me a joke.' })
  check('no non-sequitur on an irrelevant narrow question', narrowOut.response === narrow.response)

  // Relevance predicate sanity.
  check('relevance: broad operational question is relevant', !!TOP && isExecutivePresenceRelevant('what should I do today?', 'x', TOP))
  check('relevance: unrelated chit-chat is not relevant', !!TOP && !isExecutivePresenceRelevant('tell me a joke', 'a light one', TOP))
}

// ── Main ────────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA COO Presence Certification\n')
  process.stdout.write('Mega Sprint 3481–3510\n')
  process.stdout.write('============================================================\n')

  runSetup()
  runSurfacing()
  runTrust()
  runMemory()
  runGuardrails()

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`RESULT: ${passed}/${total} PASS (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(pct >= 100
    ? '\nCERTIFIED — DONNA surfaces COO presence by default: opinion, tradeoff, memory, proactive.\n'
    : '\nNOT CERTIFIED — executive presence gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

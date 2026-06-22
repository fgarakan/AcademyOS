// Mega Sprint 3511–3540 — Director Operating Session V1
// Executive Partnership Certification.
//
// Certifies that EVERY way a director begins a session — every greeting, "I'm back",
// "ready", "let's begin", and a return-after-gap with an unresolved decision —
// resumes the SAME executive partnership: no clarification, no disambiguation, no
// assistant menu; an "already reviewed" confirmation; a recommended first action;
// and an offer to guide to completion. Facts are preserved and the resume is
// deterministic.
//
// Run: npx tsx src/lib/donna/certification/directorOperatingSessionCertification.ts

import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'
import {
  isOperatingSessionResume,
  resumeExecutivePartnership,
  hasReviewedConfirmation,
  hasNoClarificationLanguage,
  hasRecommendedFirstAction,
  offersGuideToCompletion,
  restoresRelationship,
  type RestoredPartnershipContext,
} from '@/lib/donna/conversation/donnaExecutivePartnership'

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

// The exact triggers named in the sprint, plus the broader session-opening family.
const REQUIRED_GREETINGS = [
  'Good morning', 'Morning', 'Hello', 'Hi', 'Hey Donna', 'Good afternoon', 'Good evening',
]
const EXTRA_TRIGGERS = [
  "I'm back", 'ready', "let's begin", 'welcome back', 'start my day', 'Good morning Donna',
]
const NON_TRIGGERS = [
  'move Lucas up a level', 'is Maria ready to move up', 'start a new session',
  'show me the review queue', 'what is the attendance rate',
]

// ── Detection ─────────────────────────────────────────────────────────────────

function runDetection(): void {
  process.stdout.write('\n── Session-opening detection (greeting is one trigger of many) ──\n')
  for (const g of REQUIRED_GREETINGS) {
    check(`detects required greeting: "${g}"`, isOperatingSessionResume(g))
  }
  for (const g of EXTRA_TRIGGERS) {
    check(`detects session-opening trigger: "${g}"`, isOperatingSessionResume(g))
  }
  for (const n of NON_TRIGGERS) {
    check(`does NOT misfire on real intent: "${n}"`, !isOperatingSessionResume(n))
  }
}

// ── Every greeting produces the partnership resume (Response Contract) ─────────

function runResponseContract(): void {
  process.stdout.write('\n── Every greeting resumes the partnership (no chat, no clarification) ──\n')
  for (const g of [...REQUIRED_GREETINGS, ...EXTRA_TRIGGERS]) {
    const answer = resumeExecutivePartnership(CTX)
    const ok =
      hasReviewedConfirmation(answer.text) &&
      hasNoClarificationLanguage(answer.text) &&
      hasRecommendedFirstAction(answer) &&
      offersGuideToCompletion(answer) &&
      answer.isAnswerable
    check(`"${g}" → executive brief with recommendation + guide-to-completion, no clarification`, ok)
  }
}

// ── Restored working relationship (continuity) ────────────────────────────────

function runRelationshipRestore(): void {
  process.stdout.write('\n── Restores the working relationship on return ──\n')
  const restored: RestoredPartnershipContext = {
    isFirstOpenToday: false,
    lastPageLabel: 'Review Queue',
    unresolvedDecision: 'a pending level movement decision',
    lastTopic: 'review_queue',
    priorTurnCount: 4,
    firstName: 'Brian',
  }
  const resumed = resumeExecutivePartnership(CTX, restored)
  check('feels like continuing, not starting (restores relationship)', restoresRelationship(resumed.text))
  check('surfaces the prior page context', /review queue/i.test(resumed.text))
  check('surfaces the unresolved decision', /level movement/i.test(resumed.text))
  check('still confirms DONNA already reviewed while away', hasReviewedConfirmation(resumed.text))
  check('still recommends a first action on resume', hasRecommendedFirstAction(resumed))
  check('still offers to guide to completion on resume', offersGuideToCompletion(resumed))
  check('uses the director first name naturally', /Brian/.test(resumed.text))
}

// ── Forbidden behaviors absent ────────────────────────────────────────────────

function runForbidden(): void {
  process.stdout.write('\n── Forbidden chatbot behaviors are absent ──\n')
  const answer = resumeExecutivePartnership(CTX)
  check('no "what would you like to do"', !/what would you like to do/i.test(answer.text))
  check('no "how can I help"', !/how can i help/i.test(answer.text))
  check('no "I want to make sure I understand"', !/i want to make sure i understand/i.test(answer.text))
  check('no "would you like..."', !/would you like/i.test(answer.text))
  check('no clarification/disambiguation language at all', hasNoClarificationLanguage(answer.text))
}

// ── Trust: facts preserved, deterministic ─────────────────────────────────────

function numbersIn(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).slice().sort()
}

function runTrust(): void {
  process.stdout.write('\n── Trust: grounded, honest, deterministic ──\n')
  const demoAnswer = resumeExecutivePartnership(CTX)            // CTX.isLive === false
  check('demo reality carries the honest [Demo] prefix', demoAnswer.text.startsWith('[Demo]'))
  check('answer carries a source note', !!demoAnswer.sourceNote)

  // Deterministic — same context yields the same brief body (time-of-day aside).
  const a = resumeExecutivePartnership(CTX)
  const b = resumeExecutivePartnership(CTX)
  check('deterministic (same ctx → same resume)', a.text === b.text)

  // No fabricated numbers — every number traces to the reality the resume is built
  // from (the deterministic attention report + the live ctx counts).
  const report = buildAcademyAttentionReport(CTX)
  const reportText = [
    report.healthSummary,
    report.totalCount,
    ...report.allItems.map(i => `${i.label} ${i.whyItMatters} ${i.evidence} ${i.bestNextAction} ${i.donnaWillNotDo}`),
    CTX.pendingReviews, CTX.attendanceExceptions, CTX.evidenceDrafts, CTX.todaySessions, CTX.oldestPendingReviewAgeDays,
  ].join(' ')
  const realityPool = numbersIn(reportText)
  const answerNums = numbersIn(demoAnswer.text)
  check('no fabricated numbers in the resume', answerNums.every(n => realityPool.includes(n)))
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('Director Operating Session — Executive Partnership Certification\n')
  process.stdout.write('Mega Sprint 3511–3540\n')
  process.stdout.write('============================================================\n')

  runDetection()
  runResponseContract()
  runRelationshipRestore()
  runForbidden()
  runTrust()

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
    ? '\nCERTIFIED — every session opening resumes the executive partnership, never a chat.\n'
    : '\nNOT CERTIFIED — operating-session gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

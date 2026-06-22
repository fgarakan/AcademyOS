// Mega Sprint 3451–3480 — ONE DONNA Conversation Convergence V1
// Part 7 — Conversation Convergence Certification.
//
// Certifies that DONNA speaks with ONE voice everywhere:
//   - Conversation DNA exists and defines the canonical identity.
//   - The Executive Communication Layer applies the DNA (first-person, speak-don't-print).
//   - The source-fixed templates carry no third-person "DONNA", no robotic safety
//     boilerplate, no "arc closed" internal jargon, no dashboard-numbered speech,
//     recommend decisively, and guide to a next step.
//
// Run: npx tsx src/lib/donna/certification/oneDonnaConversationConvergenceCertification.ts

import {
  DONNA_CONVERSATION_DNA,
  buildConversationDNAInstruction,
  hasThirdPersonSelfReference,
  hasRoboticCompletionPhrase,
  hasRoboticSafetyBoilerplate,
  hasDashboardSpeech,
  isDecisiveRecommendation,
  conformsToConversationDNA,
} from '@/lib/donna/conversation/donnaConversationDNA'
import { buildExecutiveRefinementInstruction } from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import { buildDemoContext } from '@/lib/donna/directorDonnaContext'
import { buildReviewQueueAnswer } from '@/lib/donna/donnaReviewQueueAnswer'
import { buildFocusTodayAnswer, buildProactiveNoticeAnswer } from '@/lib/donna/proactive/focusTodayAnswerEngine'
import { blockUnsafeDonnaAction, assertDonnaApprovalAllowed } from '@/lib/donna/donnaApprovalGate'
import { buildCompletionResponse } from '@/lib/donna/conversation/donnaCompletionDetector'
import type { ConversationNavigatorState } from '@/lib/donna/conversation/donnaConversationNavigator'
import { DONNA_GUIDED_OPERATORS } from '@/lib/donna/donnaUIGuidedOperators'
import { CURRICULUM_STRATEGY_DISCLAIMER, CURRICULUM_STRATEGY_PROMPT_SECTION } from '@/lib/donna/llmOrchestration/curriculumStrategyConversation'

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) { passed++; process.stdout.write(`  ✓ ${label}\n`) }
  else { failed++; failures.push(label); process.stdout.write(`  ✗ ${label}\n`) }
}

// ── 1. Conversation DNA exists and is well-formed ───────────────────────────────

function runDnaExists(): void {
  process.stdout.write('\n── Conversation DNA exists ──\n')
  check('DNA has an identity', typeof DONNA_CONVERSATION_DNA.identity === 'string' && DONNA_CONVERSATION_DNA.identity.length > 0)
  check('DNA voice contract includes a first-person rule',
    DONNA_CONVERSATION_DNA.voiceContract.some(r => /first person/i.test(r)))
  check('DNA response rhythm has 5 beats', DONNA_CONVERSATION_DNA.rhythm.length === 5)
  check('DNA forbids "arc closed"', DONNA_CONVERSATION_DNA.forbiddenPhrasings.includes('arc closed'))
  check('DNA invariant: reality always wins', DONNA_CONVERSATION_DNA.invariants.realityAlwaysWins === true)
  check('DNA invariant: presentation only', DONNA_CONVERSATION_DNA.invariants.presentationOnly === true)
}

// ── 2. Executive Communication Layer applies the DNA ────────────────────────────

function runExecLayerUsesDna(): void {
  process.stdout.write('\n── Executive Communication Layer uses the Conversation DNA ──\n')
  const instr = buildExecutiveRefinementInstruction('director')
  check('exec instruction speaks in first person', /first person/i.test(instr))
  check('exec instruction is "speak, don\'t print"', /no numbered lists|speak, do not print|short spoken/i.test(instr))
  check('exec instruction still preserves every fact', /preserve every fact/i.test(instr))
  check('DNA instruction is role-aware', buildConversationDNAInstruction('coach') !== buildConversationDNAInstruction('director'))
}

// ── 3. Predicates behave ────────────────────────────────────────────────────────

function runPredicates(): void {
  process.stdout.write('\n── DNA predicates ──\n')
  check('detects third-person "DONNA cannot"', hasThirdPersonSelfReference('DONNA cannot do that.'))
  check('passes first-person "I can\'t"', !hasThirdPersonSelfReference("I can't do that."))
  check('detects "arc closed"', hasRoboticCompletionPhrase('Done. Arc closed. Learning captured.'))
  check('detects dashboard speech', hasDashboardSpeech('**1. Highest leverage action:** Review players'))
  check('passes prose', !hasDashboardSpeech("Here's where I'd focus today: review three players."))
  check('flags weak recommendation', !isDecisiveRecommendation('You may wish to consider reviewing this.'))
  check('accepts decisive recommendation', isDecisiveRecommendation("I'd recommend reviewing this first."))
}

// ── 4. Source-fixed templates are DNA-clean ─────────────────────────────────────

function runTemplatesClean(): void {
  process.stdout.write('\n── Source-fixed templates follow the voice contract ──\n')
  const CTX = buildDemoContext()

  // Review queue (non-empty branch — carries the former safety boilerplate)
  const queue = buildReviewQueueAnswer({
    ...CTX,
    pendingReviews: 3,
    evidenceDrafts: 2,
    attendanceExceptions: 1,
    templateDrafts: 0,
    curriculumDraftCount: 0,
    oldestPendingReviewAgeDays: 9,
  })
  check('review queue answer is first person', !hasThirdPersonSelfReference(queue.text))
  check('review queue answer drops robotic boilerplate', !hasRoboticSafetyBoilerplate(queue.text))

  // Focus today + proactive notice (former dashboards)
  const focus = buildFocusTodayAnswer(CTX)
  check('focus-today answer is not a dashboard', !hasDashboardSpeech(focus.text))
  const notice = buildProactiveNoticeAnswer(CTX)
  check('proactive notice is not a dashboard', !hasDashboardSpeech(notice.text))

  // Approval gate (approval-gated path — ineligible for refinement, must be clean at source)
  const blocked = blockUnsafeDonnaAction('level_movement')
  check('approval-gate explanation is first person', !hasThirdPersonSelfReference(blocked.explanation))
  const gate = assertDonnaApprovalAllowed('parent_communication')
  check('approval-gate reason is first person', !hasThirdPersonSelfReference(gate.reason))

  // Completion detector (former "Arc closed. Learning captured.")
  const completion = buildCompletionResponse({
    topConcept: 'parent_concern',
    extractedEntity: 'Maya',
    turnCount: 3,
  } as unknown as ConversationNavigatorState)
  check('completion confirmation has no internal jargon', !hasRoboticCompletionPhrase(completion.confirmation))
  check('completion confirmation is first person', !hasThirdPersonSelfReference(completion.confirmation))

  // Guided operators (former 25× "DONNA cannot" + "DONNA never…")
  const operatorStrings = DONNA_GUIDED_OPERATORS.flatMap(op => [
    op.openingLine,
    op.noDataFallback,
    op.approvalNote ?? '',
    ...op.outOfScope,
    ...op.steps.map(s => s.donnaPrompt),
    ...op.steps.map(s => s.approvalNote ?? ''),
    ...op.steps.map(s => s.nextStepHint),
  ])
  const operatorThirdPerson = operatorStrings.filter(s => hasThirdPersonSelfReference(s))
  check(`guided operators carry no third-person self-reference (${operatorThirdPerson.length} found)`, operatorThirdPerson.length === 0)

  // Curriculum strategy (former "This is strategic advice, not a directive…")
  check('curriculum disclaimer is decisive (not "not a directive")', !/not a directive/i.test(CURRICULUM_STRATEGY_DISCLAIMER))
  check('curriculum disclaimer is first person', !hasThirdPersonSelfReference(CURRICULUM_STRATEGY_DISCLAIMER))
  check('curriculum strategy prompt asks for a clear recommendation', /clear,? (and )?confident recommendation|recommend/i.test(CURRICULUM_STRATEGY_PROMPT_SECTION))
}

// ── 5. Aggregate conformance over representative answers ─────────────────────────

function runAggregate(): void {
  process.stdout.write('\n── Aggregate DNA conformance ──\n')
  const CTX = buildDemoContext()
  const samples = [
    buildFocusTodayAnswer(CTX).text,
    buildProactiveNoticeAnswer(CTX).text,
    buildReviewQueueAnswer({ ...CTX, pendingReviews: 2, evidenceDrafts: 1, attendanceExceptions: 1, templateDrafts: 0, curriculumDraftCount: 0 }).text,
    blockUnsafeDonnaAction('parent_communication').explanation,
  ]
  const nonConforming = samples.filter(s => !conformsToConversationDNA(s).conforms)
  check(`representative answers conform to the DNA (${nonConforming.length} non-conforming)`, nonConforming.length === 0)
}

// ── Main ────────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('ONE DONNA Conversation Convergence Certification\n')
  process.stdout.write('Mega Sprint 3451–3480\n')
  process.stdout.write('============================================================\n')

  runDnaExists()
  runExecLayerUsesDna()
  runPredicates()
  runTemplatesClean()
  runAggregate()

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
    ? '\nCERTIFIED — ONE DONNA: the same experienced COO voice everywhere.\n'
    : '\nNOT CERTIFIED — conversational voice gaps remain.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main()

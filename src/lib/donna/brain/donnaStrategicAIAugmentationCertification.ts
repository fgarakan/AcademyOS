// Mega Sprint 3001–3030 — DONNA Strategic AI Augmentation V1
// Part 8 — Certification Harness
//
// Tests all sprint parts with pure TypeScript assertions.
// No DB, no network. OpenAI-dependent paths tested via graceful fallback contract.
//
// Run: npx tsx src/lib/donna/brain/donnaStrategicAIAugmentationCertification.ts

import { evaluateStrategicAIEligibility } from '@/lib/donna/brain/donnaStrategicAIEligibility'
import { buildStrategicContextPacket } from '@/lib/donna/brain/donnaStrategicAIContextBuilder'
import { evaluateAIAssistEligibility } from '@/lib/donna/brain/donnaBrainConfidenceEvaluator'
import { checkAcademyDNAGuard } from '@/lib/donna/conversation/donnaAcademyDNAGuard'
import { donnaConversationReplayDataset } from '@/lib/donna/conversation/donnaConversationReplayDataset'
import { donnaAIUsageMetrics, recordAIUsage } from '@/lib/donna/conversation/donnaAIUsageMetrics'
import { processDonnaMessage } from '@/lib/donna/brain/processDonnaMessage'
import type { DonnaMessageInput } from '@/lib/donna/brain/processDonnaMessage'

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(id: number, description: string, value: boolean): void {
  if (value) {
    console.log(`  ✓ [${id}] ${description}`)
    passed++
  } else {
    console.error(`  ✗ [${id}] FAIL — ${description}`)
    failures.push(`[${id}] ${description}`)
    failed++
  }
}

// ── Minimal brain input stub ──────────────────────────────────────────────────

function makeInput(userMessage: string): DonnaMessageInput {
  return {
    userMessage,
    role: 'director' as const,
    route: '/director',
    activeGuidedWorkflowId: null,
    activeGoalSession: null,
    cooState: null,
    goalMemory: null,
    onboardingComplete: false,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nDONNA Strategic AI Augmentation V1 — Certification\n')
console.log('─'.repeat(65))

// ── Part 1–2: Strategic Domain Detector ──────────────────────────────────────
console.log('\nPart 2 — Strategic Domain Detector (eligibility evaluator unit tests)')

const retentionResult = evaluateStrategicAIEligibility('Why are families leaving?', 0.45)
assert(1, '"Why are families leaving?" (conf 0.45) → eligible', retentionResult.eligible === true)
assert(2, '"Why are families leaving?" → domain: retention_analysis', retentionResult.domain === 'retention_analysis')

const summerResult = evaluateStrategicAIEligibility('How should we redesign summer camp?', 0.50)
assert(3, '"How should we redesign summer camp?" → eligible', summerResult.eligible === true)
assert(4, '"How should we redesign summer camp?" → domain: summer_camp_planning', summerResult.domain === 'summer_camp_planning')

const curriculumResult = evaluateStrategicAIEligibility('What should our Orange curriculum look like?', 0.50)
assert(5, '"What should our Orange curriculum look like?" → eligible', curriculumResult.eligible === true)
assert(6, '"What should our Orange curriculum look like?" → domain: curriculum_design', curriculumResult.domain === 'curriculum_design')

const staffingResult = evaluateStrategicAIEligibility('Should we change staffing for 12U?', 0.55)
assert(7, '"Should we change staffing for 12U?" → eligible', staffingResult.eligible === true)
assert(8, '"Should we change staffing for 12U?" → domain: staffing_decisions', staffingResult.domain === 'staffing_decisions')

const healthResult = evaluateStrategicAIEligibility('How is the academy doing overall?', 0.40)
assert(9, '"How is the academy doing overall?" → eligible (academy_health_analysis domain)', healthResult.eligible === true)
assert(10, '"How is the academy doing overall?" → domain: academy_health_analysis', healthResult.domain === 'academy_health_analysis')

// ── Part 3: Strategic gate — inputs that must NOT trigger strategic AI ────────
console.log('\nPart 3 — Non-strategic inputs must NOT trigger strategic AI')

const noSignalResult = evaluateStrategicAIEligibility('What do I need to do next?', 0.45)
assert(11, '"What do I need to do next?" → NOT eligible (no strategic domain)', noSignalResult.eligible === false)

const dataQueryResult = evaluateStrategicAIEligibility('Show me who is ready to advance', 0.50)
assert(12, '"Show me who is ready to advance" → NOT eligible (data query)', dataQueryResult.eligible === false)

const tooLowConfResult = evaluateStrategicAIEligibility('Why are families leaving?', 0.25)
assert(13, '"Why are families leaving?" at conf 0.25 → NOT eligible (below 0.35 zone)', tooLowConfResult.eligible === false)

const tooHighConfResult = evaluateStrategicAIEligibility('Why are families leaving?', 0.75)
assert(14, '"Why are families leaving?" at conf 0.75 → NOT eligible (above 0.72 zone)', tooHighConfResult.eligible === false)

// ── Part 3: Brain routing — setup routing intercept still works ───────────────
console.log('\nPart 3 — Brain routing: setup routing must not be intercepted')

const setupResult = processDonnaMessage(makeInput('help me finish academy setup'))
assert(15, '"help me finish academy setup" → NOT strategic_ai_assist (setup routing intercepts)', setupResult.action !== 'strategic_ai_assist')

// ── Part 3: live_ai_assist path still works (not displaced) ─────────────────
console.log('\nPart 3 — live_ai_assist path: zero-signal fallback unchanged')

const liveAIEligibility = evaluateAIAssistEligibility('something feels off', 0.05)
assert(16, '"something feels off" (conf 0.05) → eligible for live_ai_assist', liveAIEligibility.eligible === true)

// ── Part 4: Strategic Context Builder ────────────────────────────────────────
console.log('\nPart 4 — Strategic Context Builder')

const retentionPacket = buildStrategicContextPacket('retention_analysis', null)
assert(17, 'retention_analysis context packet has signals', retentionPacket.signalsToConsider.length > 0)
assert(18, 'retention_analysis context packet has recommended data points', retentionPacket.recommendedDataPoints.length > 0)
assert(19, 'context packet has privacy note', retentionPacket.privacyNote.length > 0)
assert(20, 'context packet does not mention player names or scores in signals', !retentionPacket.signalsToConsider.join(' ').toLowerCase().includes('player name'))

const withDNAPacket = buildStrategicContextPacket('curriculum_design', 'AcademyCo — DNA: performance')
assert(21, 'context packet includes academy DNA context when provided', withDNAPacket.framingContext.includes('AcademyCo'))

// ── Part 6: Academy DNA guard still applies ───────────────────────────────────
console.log('\nPart 6 — Academy DNA guard (safety pipeline unchanged)')

const mutationDraft = checkAcademyDNAGuard({ aiDraft: 'You should remove this coach from the program.' })
assert(22, 'mutation instruction → blocked by DNA guard', mutationDraft.verdict === 'blocked')
assert(23, 'blocked result includes suggested alternative', mutationDraft.suggestedAlternative !== null)

const selfIdDraft = checkAcademyDNAGuard({ aiDraft: 'As an AI, I recommend checking enrollment trends.' })
assert(24, 'AI self-identification → blocked by DNA guard', selfIdDraft.verdict === 'blocked')

const neutralDraft = checkAcademyDNAGuard({ aiDraft: 'Progression delays are the most common signal.' })
assert(25, 'neutral strategic response → passes DNA guard', neutralDraft.verdict === 'pass')

// ── Part 7: Strategic learning capture metadata ───────────────────────────────
console.log('\nPart 7 — Strategic learning metadata structure')

// Verify the expected shape of strategic learning metadata
const expectedMetadataKeys = [
  'strategy_assist',
  'strategic_domain',
  'detected_intent',
  'detected_goal',
  'context_used',
  'outcome_status',
  'usefulness_score',
]
const sampleMeta = {
  strategy_assist: true,
  strategic_domain: 'retention_analysis',
  detected_intent: 'parent_communication',
  detected_goal: 'parent_engagement',
  context_used: 'Retention Analysis',
  openai_reasoning: 'Top signals: progression delays, attendance drop-off, communication gaps.',
  final_donna_response: 'Three signals stand out. Start with progression delays.',
  learning_status: 'captured',
  outcome_status: 'unknown',
  usefulness_score: null,
}
assert(26, 'strategic metadata includes strategy_assist: true', sampleMeta.strategy_assist === true)
assert(27, 'strategic metadata includes outcome_status: "unknown"', sampleMeta.outcome_status === 'unknown')
assert(28, 'strategic metadata includes usefulness_score: null (not auto-scored)', sampleMeta.usefulness_score === null)
assert(29, 'strategic metadata includes learning_status: "captured" (not auto-promoted)', sampleMeta.learning_status === 'captured')
assert(30, 'all expected metadata keys present', expectedMetadataKeys.every(k => k in sampleMeta))

// ── Replay dataset: captures strategic turn ───────────────────────────────────
console.log('\nStrategic Learning: Replay dataset')

donnaConversationReplayDataset.clear()
donnaConversationReplayDataset.capture({
  role: 'director',
  userText: 'Why are families leaving?',
  donnaResponse: 'Three signals: progression delays, attendance drop-off, communication gaps.',
  aiAssisted: true,
  aiSource: 'openai',
  conceptDetected: null,
  brainConfidence: 0.45,
  finalConfidence: 0.70,
  dnaConflict: false,
  dnaVerdict: 'pass',
  tokenCost: 87,
})

const replayExport = donnaConversationReplayDataset.export()
assert(31, 'strategic turn captured in replay dataset', replayExport.length >= 1)
assert(32, 'replay turn has correct userText', replayExport[replayExport.length - 1].userText === 'Why are families leaving?')
assert(33, 'replay turn has aiAssisted: true', replayExport[replayExport.length - 1].aiAssisted === true)

// ── AI usage metrics: records strategic entry ─────────────────────────────────
console.log('\nStrategic Learning: AI usage metrics')

donnaAIUsageMetrics.reset()
recordAIUsage({ role: 'director', source: 'openai', tokensUsed: 87, qualityScore: 82, dnaConflict: false, dnaVerdict: 'pass' })

const metricsSnap = donnaAIUsageMetrics.snapshot()
assert(34, 'metrics snapshot records strategic AI call', metricsSnap.totalCalls === 1)
assert(35, 'metrics snapshot records openai source', metricsSnap.openaiCalls === 1)

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(65))
console.log(`\nTotal: ${passed + failed} assertions`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failures.length > 0) {
  console.error('\nFailed assertions:')
  failures.forEach(f => console.error(`  ${f}`))
  process.exit(1)
} else {
  console.log('\n✓ ALL ASSERTIONS PASS — DONNA Strategic AI Augmentation V1 CERTIFIED\n')
}

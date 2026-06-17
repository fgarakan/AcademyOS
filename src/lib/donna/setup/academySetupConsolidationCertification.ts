// Mega Sprint 2961–2970 — Academy Setup Consolidation V1
// Certification harness: 8 assertions across the consolidation goals.
//
// Run: npx tsx src/lib/donna/setup/academySetupConsolidationCertification.ts
//
// Design rules:
//   - Pure TypeScript. No DB, no network, no side effects.
//   - Imports only the files modified in this sprint.
//   - Each assertion is documented with the rule it enforces.

import { getWorkflow } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'
import { processDonnaMessage } from '@/lib/donna/brain/processDonnaMessage'

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

// ── Minimal DonnaMessageInput stub ───────────────────────────────────────────

function makeInput(
  userMessage: string,
  onboardingComplete: boolean,
) {
  return {
    userMessage,
    role: 'director' as const,
    route: '/director',
    activeGuidedWorkflowId: null,
    activeGoalSession: null,
    cooState: null,
    goalMemory: null,
    onboardingComplete,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nAcademy Setup Consolidation V1 — Certification\n')
console.log('─'.repeat(60))

// 1. /director/setup is not a canonical page route in academy_setup_completion workflow
console.log('\nSection 1 — /director/setup removed from academy_setup_completion pageRoutes')
const setupWorkflow = getWorkflow('academy_setup_completion') ?? null
assert(
  1,
  '/director/setup is NOT in academy_setup_completion pageRoutes',
  setupWorkflow !== null &&
    !setupWorkflow.pageRoutes.includes('/director/setup'),
)
assert(
  2,
  '/director/onboarding IS still in academy_setup_completion pageRoutes',
  setupWorkflow !== null &&
    setupWorkflow.pageRoutes.includes('/director/onboarding'),
)

// 2. academy_setup_completion workflow label is "Academy Onboarding"
console.log('\nSection 2 — academy_setup_completion label renamed to "Academy Onboarding"')
assert(
  3,
  'academy_setup_completion label is "Academy Onboarding"',
  setupWorkflow?.label === 'Academy Onboarding',
)

// 3. Opening message routes to onboarding, not 10-question interview
console.log('\nSection 3 — academy_setup_completion openingMessage reflects routing behavior')
assert(
  4,
  'openingMessage does not say "10 questions" or "Step 1 of 10" (legacy interview language)',
  setupWorkflow !== null &&
    !setupWorkflow.openingMessage.includes('10 questions') &&
    !setupWorkflow.openingMessage.includes('Step 1 of 10'),
)
assert(
  5,
  'openingMessage mentions "Academy Onboarding" (canonical path)',
  setupWorkflow !== null &&
    setupWorkflow.openingMessage.includes('Academy Onboarding'),
)

// 4. DONNA brain routes "help me finish academy setup" to onboarding when incomplete
console.log('\nSection 4 — DONNA brain routing when onboarding is incomplete')
const incompleteResult = processDonnaMessage(makeInput('help me finish academy setup', false))
assert(
  6,
  'action is "navigate" when onboarding is incomplete',
  incompleteResult.action === 'navigate',
)
assert(
  7,
  'navigateTo is "/director/onboarding" when onboarding is incomplete',
  incompleteResult.navigateTo === '/director/onboarding',
)

// 5. DONNA brain routes to Academy Settings when onboarding is complete
console.log('\nSection 5 — DONNA brain routing when onboarding is complete')
const completeResult = processDonnaMessage(makeInput('help me finish academy setup', true))
assert(
  8,
  'action is "navigate" when onboarding is complete',
  completeResult.action === 'navigate',
)
assert(
  9,
  'navigateTo is "/director/settings" when onboarding is complete',
  completeResult.navigateTo === '/director/settings',
)
assert(
  10,
  'response says "Academy setup is complete" when onboarding is complete',
  completeResult.response.includes('Academy setup is complete'),
)

// 6. Phrase variants also route correctly
console.log('\nSection 6 — Phrase variant coverage')
const phrases = [
  'finish setup',
  'complete my setup',
  'set up my academy',
  'walk me through academy setup',
]
for (const phrase of phrases) {
  const r = processDonnaMessage(makeInput(phrase, false))
  assert(
    11,
    `"${phrase}" → navigate to /director/onboarding when incomplete`,
    r.action === 'navigate' && r.navigateTo === '/director/onboarding',
  )
}

const phrasesComplete = [
  'finish setup',
  'set up the academy',
]
for (const phrase of phrasesComplete) {
  const r = processDonnaMessage(makeInput(phrase, true))
  assert(
    12,
    `"${phrase}" → navigate to /director/settings when complete`,
    r.action === 'navigate' && r.navigateTo === '/director/settings',
  )
}

// 7. approvalGatedActions no longer includes donna_setup_draft write
console.log('\nSection 7 — donna_setup_draft write path removed from workflow')
assert(
  13,
  'approvalGatedActions does NOT include "save academy setup draft to the database"',
  setupWorkflow !== null &&
    !setupWorkflow.approvalGatedActions.includes('save academy setup draft to the database'),
)

// 8. TypeScript note (runtime-only check — tsc is authoritative)
console.log('\nSection 8 — Runtime check')
assert(
  14,
  'processDonnaMessage returns a result with action + navigateTo (type contract satisfied)',
  typeof incompleteResult.action === 'string' && incompleteResult.navigateTo !== undefined,
)

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60))
console.log(`\nTotal: ${passed + failed} assertions`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failures.length > 0) {
  console.error('\nFailed assertions:')
  failures.forEach(f => console.error(`  ${f}`))
  process.exit(1)
} else {
  console.log('\n✓ ALL ASSERTIONS PASS — Academy Setup Consolidation V1 CERTIFIED\n')
}

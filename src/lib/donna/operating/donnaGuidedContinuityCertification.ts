// Mega Sprint 3061–3090 — DONNA Conversational Continuity & Guided Completion Repair V1
// Part 6 — Guided Continuity Certification Harness
//
// Tests the exact 8-message live sequence against /director/curriculum.
// Proves two bugs are fixed:
//   Bug 1: "What should I focus on here?" no longer launches a goal session
//   Bug 2: "Yes/Okay/Done" no longer triggers generic clarification while an arc is active
//
// Run: npx tsx src/lib/donna/operating/donnaGuidedContinuityCertification.ts

import { processDonnaMessage } from '@/lib/donna/brain/processDonnaMessage'
import {
  createInitialNavigatorState,
  advanceConversation,
} from '@/lib/donna/conversation/donnaConversationNavigator'
import type { ConversationNavigatorState } from '@/lib/donna/conversation/donnaConversationNavigator'

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed  = 0
let failed  = 0
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

// ── Banned phrases (certification failure conditions) ─────────────────────────

const BANNED_PHRASES = [
  'i want to make sure i understand correctly',
  'would you like to get general guidance',
  'or describe what you need',
  '1. get general guidance',
]

function isBanned(response: string): boolean {
  const lower = response.toLowerCase()
  return BANNED_PHRASES.some(p => lower.includes(p))
}

// ── Brain input builder ───────────────────────────────────────────────────────

function makeInput(
  userMessage: string,
  route = '/director/curriculum',
  navState?: ConversationNavigatorState | null,
) {
  return {
    userMessage,
    role: 'director' as const,
    route,
    activeGuidedWorkflowId: null as null,
    activeGoalSession: null,
    cooState: null,
    goalMemory: null,
    conversationNavigatorState: navState ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

console.log('\nDONNA Guided Continuity & Completion Repair V1 — Certification\n')
console.log('─'.repeat(70))
console.log('Route: /director/curriculum')
console.log('─'.repeat(70))

// ── Message 1: "I don't know what needs to be done on this page." ─────────────
console.log('\nMessage 1 — "I don\'t know what needs to be done on this page."')

const r1 = processDonnaMessage(makeInput("I don't know what needs to be done on this page."))

console.log(`  Deciding step: ${r1.debugLog.decidingStep}`)
console.log(`  Action:        ${r1.action}`)
console.log(`  Nav stage:     ${r1.updatedNavigatorState?.stage ?? 'null'}`)
console.log(`  Nav turnCount: ${r1.updatedNavigatorState?.turnCount ?? 'null'}`)
console.log(`  Response:      ${r1.response.slice(0, 100).replace(/\n/g, ' ')}...`)

assert(1,  'action is respond',                   r1.action === 'respond')
assert(2,  'deciding step is check_page_context', r1.debugLog.decidingStep === 'check_page_context')
assert(3,  'response mentions Curriculum',        r1.response.includes('Curriculum'))
assert(4,  'response NOT banned',                 !isBanned(r1.response))
assert(5,  'navigator state populated',           r1.updatedNavigatorState !== null)
assert(6,  'navigator stage is action',           r1.updatedNavigatorState?.stage === 'action')
assert(7,  'proposedActionType is page_guidance', r1.updatedNavigatorState?.proposedActionType === 'page_guidance')
assert(8,  'turnCount is 1',                      r1.updatedNavigatorState?.turnCount === 1)

// ── Message 2: "What should I focus on here?" ─────────────────────────────────
console.log('\nMessage 2 — "What should I focus on here?" (Bug 1 fix)')

const r2 = processDonnaMessage(makeInput('What should I focus on here?'))

console.log(`  Deciding step: ${r2.debugLog.decidingStep}`)
console.log(`  Action:        ${r2.action}`)
console.log(`  Response:      ${r2.response.slice(0, 100).replace(/\n/g, ' ')}...`)

assert(9,  'action is respond (NOT start_goal_session)',  r2.action === 'respond')
assert(10, 'deciding step is check_page_context',         r2.debugLog.decidingStep === 'check_page_context')
assert(11, 'response mentions Curriculum',                r2.response.includes('Curriculum'))
assert(12, 'response NOT banned',                         !isBanned(r2.response))
assert(13, 'navigator populated with page_guidance',      r2.updatedNavigatorState?.proposedActionType === 'page_guidance')
assert(14, 'check_goal_workflow_intent did NOT fire as deciding step',
  r2.debugLog.decidingStep !== 'check_goal_workflow_intent')

// ── Message 3: "Walk me through this." ───────────────────────────────────────
console.log('\nMessage 3 — "Walk me through this."')

const r3 = processDonnaMessage(makeInput('Walk me through this.'))

console.log(`  Deciding step: ${r3.debugLog.decidingStep}`)
console.log(`  Action:        ${r3.action}`)
console.log(`  Nav turnCount: ${r3.updatedNavigatorState?.turnCount ?? 'null'}`)

assert(15, 'action is respond',                   r3.action === 'respond')
assert(16, 'deciding step is check_page_context', r3.debugLog.decidingStep === 'check_page_context')
assert(17, 'response mentions Curriculum',        r3.response.includes('Curriculum'))
assert(18, 'response NOT banned',                 !isBanned(r3.response))
assert(19, 'turnCount is 1',                      r3.updatedNavigatorState?.turnCount === 1)

// Chain messages 4-8 using the navigator state from message 3
let currentNav = r3.updatedNavigatorState

// ── Message 4: "Yes." ─────────────────────────────────────────────────────────
console.log('\nMessage 4 — "Yes." (Bug 2 fix — continuation instead of clarification)')

const r4 = processDonnaMessage(makeInput('Yes.', '/director/curriculum', currentNav))

console.log(`  Deciding step: ${r4.debugLog.decidingStep}`)
console.log(`  Action:        ${r4.action}`)
console.log(`  Nav turnCount: ${r4.updatedNavigatorState?.turnCount ?? 'null'}`)
console.log(`  Response:      ${r4.response.slice(0, 120).replace(/\n/g, ' ')}...`)

assert(20, 'action is respond',                                r4.action === 'respond')
assert(21, 'deciding step is check_arc_continuation',          r4.debugLog.decidingStep === 'check_arc_continuation')
assert(22, 'response NOT banned',                              !isBanned(r4.response))
assert(23, 'response mentions Step 1',                         r4.response.includes('Step 1') || r4.response.includes('**Step 1:**'))
assert(24, 'turnCount advanced to 2',                          r4.updatedNavigatorState?.turnCount === 2)
assert(25, 'still in page_guidance arc',                       r4.updatedNavigatorState?.proposedActionType === 'page_guidance')

currentNav = r4.updatedNavigatorState

// ── Message 5: "Okay." ───────────────────────────────────────────────────────
console.log('\nMessage 5 — "Okay." (continue active page guidance)')

const r5 = processDonnaMessage(makeInput('Okay.', '/director/curriculum', currentNav))

console.log(`  Deciding step: ${r5.debugLog.decidingStep}`)
console.log(`  Action:        ${r5.action}`)
console.log(`  Nav turnCount: ${r5.updatedNavigatorState?.turnCount ?? 'null'}`)
console.log(`  Response:      ${r5.response.slice(0, 120).replace(/\n/g, ' ')}...`)

assert(26, 'action is respond',                       r5.action === 'respond')
assert(27, 'deciding step is check_arc_continuation', r5.debugLog.decidingStep === 'check_arc_continuation')
assert(28, 'response NOT banned',                     !isBanned(r5.response))
assert(29, 'response mentions Step 2',                r5.response.includes('Step 2') || r5.response.includes('**Step 2:**'))
assert(30, 'turnCount advanced to 3',                 r5.updatedNavigatorState?.turnCount === 3)
assert(31, 'still in page_guidance arc',              r5.updatedNavigatorState?.proposedActionType === 'page_guidance')

currentNav = r5.updatedNavigatorState

// ── Message 6: "Done." ───────────────────────────────────────────────────────
console.log('\nMessage 6 — "Done." (advance or evaluate completion)')

const r6 = processDonnaMessage(makeInput('Done.', '/director/curriculum', currentNav))

console.log(`  Deciding step: ${r6.debugLog.decidingStep}`)
console.log(`  Action:        ${r6.action}`)
console.log(`  Nav turnCount: ${r6.updatedNavigatorState?.turnCount ?? 'null'}`)
console.log(`  Response:      ${r6.response.slice(0, 120).replace(/\n/g, ' ')}...`)

assert(32, 'action is respond',                       r6.action === 'respond')
assert(33, 'deciding step is check_arc_continuation', r6.debugLog.decidingStep === 'check_arc_continuation')
assert(34, 'response NOT banned',                     !isBanned(r6.response))
assert(35, 'response advances arc (Step 3 or 4 or complete)',
  r6.response.includes('Step 3') || r6.response.includes('**Step 3:**') ||
  r6.response.includes('Step 4') || r6.response.toLowerCase().includes('complete'))
assert(36, 'turnCount advanced to 4',                 r6.updatedNavigatorState?.turnCount === 4)

currentNav = r6.updatedNavigatorState

// ── Message 7: "Done." ───────────────────────────────────────────────────────
console.log('\nMessage 7 — "Done." (next step)')

const r7 = processDonnaMessage(makeInput('Done.', '/director/curriculum', currentNav))

console.log(`  Deciding step: ${r7.debugLog.decidingStep}`)
console.log(`  Action:        ${r7.action}`)
console.log(`  Nav turnCount: ${r7.updatedNavigatorState?.turnCount ?? 'null'}`)
console.log(`  Response:      ${r7.response.slice(0, 120).replace(/\n/g, ' ')}...`)

assert(37, 'action is respond',                       r7.action === 'respond')
assert(38, 'deciding step is check_arc_continuation', r7.debugLog.decidingStep === 'check_arc_continuation')
assert(39, 'response NOT banned',                     !isBanned(r7.response))
assert(40, 'response continues arc (next step or completion)',
  r7.response.includes('Step') || r7.response.toLowerCase().includes('complete') ||
  r7.response.toLowerCase().includes('final'))
assert(41, 'turnCount advanced to 5',                 r7.updatedNavigatorState?.turnCount === 5)

currentNav = r7.updatedNavigatorState

// ── Message 8: "Done." ───────────────────────────────────────────────────────
console.log('\nMessage 8 — "Done." (complete page guidance)')

const r8 = processDonnaMessage(makeInput('Done.', '/director/curriculum', currentNav))

console.log(`  Deciding step: ${r8.debugLog.decidingStep}`)
console.log(`  Action:        ${r8.action}`)
console.log(`  Nav stage:     ${r8.updatedNavigatorState?.stage ?? 'null'}`)
console.log(`  Response:      ${r8.response.slice(0, 120).replace(/\n/g, ' ')}...`)

assert(42, 'action is respond',                                    r8.action === 'respond')
assert(43, 'deciding step is check_arc_continuation',              r8.debugLog.decidingStep === 'check_arc_continuation')
assert(44, 'response NOT banned',                                  !isBanned(r8.response))
assert(45, 'response indicates completion or final step',
  r8.response.toLowerCase().includes('complete') ||
  r8.response.toLowerCase().includes('goal achieved') ||
  r8.response.toLowerCase().includes('final step'))
assert(46, 'navigator stage is completion or still action',
  r8.updatedNavigatorState?.stage === 'completion' || r8.updatedNavigatorState?.stage === 'action')

// ── Regression: general arc acknowledgment still works ───────────────────────
console.log('\nRegression 1 — General arc acknowledgment (non-page-guidance) still routes correctly')

const generalInitial  = createInitialNavigatorState('director')
const generalAdvanced = advanceConversation(generalInitial, {
  userText:          'parent concern with jake',
  topConcept:        'parent_concern',
  intentConfidence:  0.75,
  extractedEntity:   'Jake Barrios',
  donnaQuestionAsked: true,
})

const r9 = processDonnaMessage({
  ...makeInput('Got it.', '/director'),
  conversationNavigatorState: generalAdvanced.updatedState,
})

console.log(`  Deciding step: ${r9.debugLog.decidingStep}`)
console.log(`  Response:      ${r9.response.slice(0, 80).replace(/\n/g, ' ')}`)

assert(47, 'general arc ack: action is respond',                  r9.action === 'respond')
assert(48, 'general arc ack: check_arc_continuation decides',     r9.debugLog.decidingStep === 'check_arc_continuation')
assert(49, 'general arc ack: response NOT banned',                !isBanned(r9.response))
assert(50, 'general arc ack: does not show curriculum steps',     !r9.response.includes('**Step 1:**'))

// ── Regression: page context certification still passes ───────────────────────
console.log('\nRegression 2 — Previous page-aware responses still fire on other routes')

const rReview = processDonnaMessage(makeInput("I don't know what needs to be done on this page.", '/director/review'))
const rKpi    = processDonnaMessage(makeInput('Walk me through this.', '/director/kpi'))

assert(51, 'review route: page-aware response',
  rReview.action === 'respond' && rReview.updatedNavigatorState?.proposedActionType === 'page_guidance')
assert(52, 'kpi route: check_page_context decides',
  rKpi.debugLog.decidingStep === 'check_page_context')

// ── Regression: setup routing unaffected ─────────────────────────────────────
console.log('\nRegression 3 — Setup routing still unaffected by arc continuation guard')

const rSetup = processDonnaMessage(makeInput('help me finish academy setup', '/director/onboarding'))
assert(53, 'setup routing: action is navigate or respond (not start_goal_session)',
  rSetup.action !== 'start_goal_session')

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(70))
console.log(`\nResults: ${passed} passed / ${failed} failed out of ${passed + failed} assertions\n`)

if (failures.length > 0) {
  console.error('Failed assertions:')
  failures.forEach(f => console.error(`  • ${f}`))
  process.exit(1)
} else {
  console.log('✓ DONNA Guided Continuity & Completion Repair V1 — 53/53 CERTIFIED\n')
  process.exit(0)
}

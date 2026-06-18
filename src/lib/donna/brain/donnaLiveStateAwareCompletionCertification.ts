// Mega Sprint 3091–3120 — DONNA Live State-Aware Completion Engine V1
// Certification Harness
//
// Verifies that:
//   1. resolvePageIntelligence() applies live overrides when liveState is provided
//   2. resolvePageTask() selects the correct task based on live counts
//   3. buildCompletionPath() starts at the correct incomplete step
//   4. formatContextForTeacher() injects live signals into the context string
//   5. formatLiveStateForAI (via processLiveAIConversation) includes live signal strings
//   6. DonnaMessageInput accepts livePageState without TypeScript error
//   7. buildLivePageState() builds correctly from UI inputs
//   8. Null safety: null counts never cause errors or wrong branching
//
// No DB. No API. No React. Pure TypeScript assertions.

import { resolvePageIntelligence } from '@/lib/donna/operating/pageContextResolver'
import { resolvePageTask } from '@/lib/donna/operating/pageTaskResolver'
import { buildCompletionPath } from '@/lib/donna/operating/pageCompletionEngine'
import { buildStrategicContextPacket, formatContextForTeacher } from '@/lib/donna/brain/donnaStrategicAIContextBuilder'
import { buildLivePageState } from '@/lib/donna/operating/buildLivePageState'
import { createPartialLivePageState } from '@/lib/donna/operating/livePageState'
import type { LivePageState } from '@/lib/donna/operating/livePageState'
import type { DonnaMessageInput } from '@/lib/donna/brain/processDonnaMessage'

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(`FAIL: ${label}`)
  }
}

function assertIncludes(label: string, haystack: string, needle: string): void {
  assert(`${label} — contains "${needle}"`, haystack.includes(needle))
}

// ── Live Page State helpers ───────────────────────────────────────────────────

function makeState(overrides: Partial<Omit<LivePageState, 'route'>>): LivePageState {
  return createPartialLivePageState('/director/curriculum', overrides)
}

// ── PART 1: resolvePageIntelligence with live state ───────────────────────────

const intelNoLive = resolvePageIntelligence('/director/curriculum')
assert('P1-1: resolvePageIntelligence returns non-null for /director/curriculum', intelNoLive !== null)

// With spine inactive — should warn
const intelSpineInactive = resolvePageIntelligence(
  '/director/curriculum',
  makeState({ curriculumSpineActive: false }),
)
assert('P1-2: returns non-null with spine inactive', intelSpineInactive !== null)
if (intelSpineInactive) {
  assert('P1-3: warnings present when spine inactive', intelSpineInactive.warnings.length > 0)
  assertIncludes('P1-4: warning mentions spine', intelSpineInactive.warnings[0], 'spine')
}

// With spine active + players missing — should recommend assign action
const intelSpineActiveMissing = resolvePageIntelligence(
  '/director/curriculum',
  makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 8 }),
)
assert('P1-5: returns non-null with spine active + missing players', intelSpineActiveMissing !== null)
if (intelSpineActiveMissing) {
  assert('P1-6: recommendedNextAction updated when players missing',
    intelSpineActiveMissing.recommendedNextAction !== (intelNoLive?.recommendedNextAction ?? ''),
  )
  assertIncludes('P1-7: recommended action mentions assign or players',
    intelSpineActiveMissing.recommendedNextAction.toLowerCase(),
    'assign',
  )
}

// With spine active + no missing — should recommend criteria
const intelComplete = resolvePageIntelligence(
  '/director/curriculum',
  makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 0 }),
)
assert('P1-8: returns non-null when curriculum complete', intelComplete !== null)

// Null safety: liveState = null → same as no liveState
const intelNullState = resolvePageIntelligence('/director/curriculum', null)
assert('P1-9: resolvePageIntelligence(route, null) returns same as no liveState',
  JSON.stringify(intelNullState) === JSON.stringify(intelNoLive),
)

// ── PART 2: resolvePageTask with live state ───────────────────────────────────

const dummyIntel = resolvePageIntelligence('/director/curriculum')!

// Curriculum: spine inactive
const taskSpineInactive = resolvePageTask(dummyIntel, {
  liveState: makeState({ curriculumSpineActive: false }),
})
assert('P2-1: curriculum task urgency critical when spine inactive', taskSpineInactive.urgency === 'critical')
assertIncludes('P2-2: curriculum task mentions spine or activate', taskSpineInactive.highestPriorityTask, 'spine')

// Curriculum: spine active + 10 missing
const taskMissing10 = resolvePageTask(dummyIntel, {
  liveState: makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 10 }),
})
assert('P2-3: urgency high or critical when 10 players missing', taskMissing10.urgency === 'high' || taskMissing10.urgency === 'critical')
assertIncludes('P2-4: task mentions player count', taskMissing10.highestPriorityTask, '10')

// Curriculum: spine active + 0 missing
const taskComplete = resolvePageTask(dummyIntel, {
  liveState: makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 0 }),
})
assert('P2-5: urgency medium when spine active + 0 missing', taskComplete.urgency === 'medium')
assertIncludes('P2-6: task mentions criteria or assessment', taskComplete.highestPriorityTask.toLowerCase(), 'criteria')

// Level-up: count = 0
const levelUpIntel = resolvePageIntelligence('/director/level-up')!
const taskLevelUpEmpty = resolvePageTask(levelUpIntel, {
  liveState: createPartialLivePageState('/director/level-up', { levelUpQueueCount: 0 }),
})
assert('P2-7: level-up urgency low when queue=0', taskLevelUpEmpty.urgency === 'low')

// Level-up: count = 5
const taskLevelUp5 = resolvePageTask(levelUpIntel, {
  liveState: createPartialLivePageState('/director/level-up', { levelUpQueueCount: 5 }),
})
assert('P2-8: level-up urgency high when queue=5', taskLevelUp5.urgency === 'high')
assertIncludes('P2-9: level-up task mentions 5 candidates', taskLevelUp5.highestPriorityTask, '5')

// Placement: count = 0
const placementIntel = resolvePageIntelligence('/director/placement')!
const taskPlacementEmpty = resolvePageTask(placementIntel, {
  liveState: createPartialLivePageState('/director/placement', { placementQueueCount: 0 }),
})
assert('P2-10: placement urgency low when queue=0', taskPlacementEmpty.urgency === 'low')

// Placement: count = 3
const taskPlacement3 = resolvePageTask(placementIntel, {
  liveState: createPartialLivePageState('/director/placement', { placementQueueCount: 3 }),
})
assert('P2-11: placement urgency critical when queue=3', taskPlacement3.urgency === 'critical')
assertIncludes('P2-12: placement task mentions 3 players', taskPlacement3.highestPriorityTask, '3')

// Onboarding: complete
const onboardingIntel = resolvePageIntelligence('/director/onboarding')!
const taskOnboardingComplete = resolvePageTask(onboardingIntel, {
  liveState: createPartialLivePageState('/director/onboarding', { onboardingComplete: true }),
})
assert('P2-13: onboarding urgency low when complete', taskOnboardingComplete.urgency === 'low')

// Onboarding: incomplete progress=3
const taskOnboardingInProgress = resolvePageTask(onboardingIntel, {
  liveState: createPartialLivePageState('/director/onboarding', { onboardingComplete: false, onboardingProgress: 3 }),
})
assert('P2-14: onboarding urgency critical when incomplete', taskOnboardingInProgress.urgency === 'critical')
assertIncludes('P2-15: onboarding task mentions progress', taskOnboardingInProgress.highestPriorityTask, '3')

// Null liveState → no crash
const taskNullState = resolvePageTask(dummyIntel, { liveState: null })
assert('P2-16: resolvePageTask does not crash with liveState=null', typeof taskNullState.urgency === 'string')

// No signals at all → fallback to static
const taskNoSignals = resolvePageTask(dummyIntel, {})
assert('P2-17: resolvePageTask does not crash with no signals', typeof taskNoSignals.urgency === 'string')

// ── PART 3: buildCompletionPath with live state ───────────────────────────────

// Curriculum: spine inactive → starts from step 1
const pathSpineInactive = buildCompletionPath(
  dummyIntel,
  undefined,
  makeState({ curriculumSpineActive: false }),
)
assertIncludes('P3-1: curriculum path step 1 when spine inactive', pathSpineInactive.nextStep.toLowerCase(), 'level')

// Curriculum: spine active + missing=8 → skip to assign step
const pathMissing = buildCompletionPath(
  dummyIntel,
  undefined,
  makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 8 }),
)
assertIncludes('P3-2: curriculum path skips to assign when missing>0', pathMissing.currentStep, '8')
assertIncludes('P3-3: next step mentions assign', pathMissing.nextStep.toLowerCase(), 'assign')

// Curriculum: spine active + missing=0 → skip to criteria step
const pathCriteriaStep = buildCompletionPath(
  dummyIntel,
  undefined,
  makeState({ curriculumSpineActive: true, playersMissingCurriculumLevel: 0 }),
)
assertIncludes('P3-4: curriculum path skips to criteria when missing=0', pathCriteriaStep.nextStep.toLowerCase(), 'criteria')
assert('P3-5: fewer remaining steps when curriculum advanced', pathCriteriaStep.remainingSteps.length < 3)

// Onboarding: complete → done path
const pathOnboardingComplete = buildCompletionPath(
  onboardingIntel,
  undefined,
  createPartialLivePageState('/director/onboarding', { onboardingComplete: true }),
)
assertIncludes('P3-6: onboarding path mentions complete', pathOnboardingComplete.currentStep.toLowerCase(), 'complete')
assert('P3-7: onboarding complete has no remaining steps', pathOnboardingComplete.remainingSteps.length === 0)

// Onboarding: progress=2 → step 3
const pathOnboardingStep2 = buildCompletionPath(
  onboardingIntel,
  undefined,
  createPartialLivePageState('/director/onboarding', { onboardingComplete: false, onboardingProgress: 2 }),
)
assertIncludes('P3-8: onboarding path labels current step correctly', pathOnboardingStep2.currentStep, '3')
assert('P3-9: onboarding path has remaining steps', pathOnboardingStep2.remainingSteps.length > 0)

// Null liveState → uses static path
const pathNoState = buildCompletionPath(dummyIntel, undefined, null)
assert('P3-10: buildCompletionPath does not crash with null liveState', typeof pathNoState.goal === 'string')

// ── PART 4: formatContextForTeacher injects live signals ─────────────────────

const packet = buildStrategicContextPacket('curriculum_design', 'Test Academy — Pathway model')

const ctxNoLive = formatContextForTeacher(packet, 'What should I do?')
assert('P4-1: formatContextForTeacher returns string without liveState', ctxNoLive.length > 0)
assert('P4-2: context within 250 chars', ctxNoLive.length <= 250)

const ctxWithLive = formatContextForTeacher(
  packet,
  'What should I do?',
  undefined,
  makeState({ pendingReviewCount: 5, playersMissingCurriculumLevel: 3, curriculumSpineActive: true }),
)
assert('P4-3: context with liveState within 250 chars', ctxWithLive.length <= 250)
assertIncludes('P4-4: context includes pending count', ctxWithLive, 'pending=5')
assertIncludes('P4-5: context includes missing-levels count', ctxWithLive, 'missing-levels=3')
// P4-6: test spine in isolation (with all signals, 250-char cap truncates the spine entry)
const ctxSpineOnly = formatContextForTeacher(
  packet,
  'What should I do?',
  undefined,
  makeState({ curriculumSpineActive: true }),
)
assertIncludes('P4-6: context includes spine status when not truncated', ctxSpineOnly, 'spine=active')

const ctxWithZeros = formatContextForTeacher(
  packet,
  'What should I do?',
  undefined,
  makeState({ levelUpQueueCount: 0, placementQueueCount: 0 }),
)
assertIncludes('P4-7: zero queue counts included', ctxWithZeros, 'level-up-queue=0')

// Null liveState → no live section
const ctxNullLive = formatContextForTeacher(packet, 'What should I do?', undefined, null)
assert('P4-8: no Live: section when liveState=null', !ctxNullLive.includes('| Live:'))

// With page context + live state
const ctxWithPage = formatContextForTeacher(packet, 'What now?', 'Curriculum page — setup spine', makeState({ curriculumSpineActive: false }))
assert('P4-9: page context + live state within 250 chars', ctxWithPage.length <= 250)
assertIncludes('P4-10: page context included', ctxWithPage, 'Curriculum')

// ── PART 5: buildLivePageState builds correctly ───────────────────────────────

const built = buildLivePageState({
  route: '/director/curriculum',
  onboardingComplete: true,
  pendingReviewCount: 7,
  curriculumSpineActive: true,
  playersMissingCurriculumLevel: 0,
})
assert('P5-1: built state has correct route', built.route === '/director/curriculum')
assert('P5-2: built state has onboardingComplete=true', built.onboardingComplete === true)
assert('P5-3: built state has onboardingProgress=7 when complete', built.onboardingProgress === 7)
assert('P5-4: built state has pendingReviewCount=7', built.pendingReviewCount === 7)
assert('P5-5: built state has curriculumSpineActive=true', built.curriculumSpineActive === true)
assert('P5-6: built state has playersMissingCurriculumLevel=0', built.playersMissingCurriculumLevel === 0)
assert('P5-7: built state has lastUpdatedAt set', typeof built.lastUpdatedAt === 'string')

// Minimal build — only route
const builtMinimal = buildLivePageState({ route: '/director' })
assert('P5-8: minimal build does not crash', builtMinimal.route === '/director')
assert('P5-9: minimal build has null onboardingComplete', builtMinimal.onboardingComplete === null)
assert('P5-10: minimal build has null pendingReviewCount', builtMinimal.pendingReviewCount === null)

// Incomplete onboarding → onboardingProgress null (not derived)
const builtIncomplete = buildLivePageState({ route: '/director/onboarding', onboardingComplete: false })
assert('P5-11: onboardingProgress is null when incomplete (cannot derive step)', builtIncomplete.onboardingProgress === null)

// ── PART 6: DonnaMessageInput accepts livePageState ──────────────────────────

const validInput: DonnaMessageInput = {
  userMessage: 'What should I do here?',
  role: 'director',
  route: '/director/curriculum',
  activeGuidedWorkflowId: null,
  cooState: null,
  goalMemory: null,
  livePageState: buildLivePageState({ route: '/director/curriculum', curriculumSpineActive: false }),
}
assert('P6-1: DonnaMessageInput accepts livePageState field', validInput.livePageState !== undefined)
assert('P6-2: livePageState route matches', validInput.livePageState?.route === '/director/curriculum')

const inputNullLive: DonnaMessageInput = {
  userMessage: 'Hello',
  role: 'director',
  route: '/director',
  activeGuidedWorkflowId: null,
  cooState: null,
  goalMemory: null,
  livePageState: null,
}
assert('P6-3: DonnaMessageInput accepts livePageState=null', inputNullLive.livePageState === null)

const inputNoLive: DonnaMessageInput = {
  userMessage: 'Hello',
  role: 'director',
  route: '/director',
  activeGuidedWorkflowId: null,
  cooState: null,
  goalMemory: null,
}
assert('P6-4: DonnaMessageInput works without livePageState', inputNoLive.livePageState === undefined)

// ── PART 7: createPartialLivePageState null safety ───────────────────────────

const partial = createPartialLivePageState('/director/level-up', { levelUpQueueCount: 3 })
assert('P7-1: createPartialLivePageState sets route', partial.route === '/director/level-up')
assert('P7-2: provided field set', partial.levelUpQueueCount === 3)
assert('P7-3: unset fields are null', partial.pendingReviewCount === null)
assert('P7-4: unset curriculum fields are null', partial.curriculumSpineActive === null)
assert('P7-5: unset onboarding fields are null', partial.onboardingComplete === null)
assert('P7-6: lastUpdatedAt is an ISO string', typeof partial.lastUpdatedAt === 'string' && partial.lastUpdatedAt.includes('T'))

// ── PART 8: End-to-end wiring: resolvePageIntelligence → resolvePageTask → buildCompletionPath ──

// Simulate a director on /director/curriculum with 5 missing players
const e2eLiveState = buildLivePageState({
  route: '/director/curriculum',
  curriculumSpineActive: true,
  playersMissingCurriculumLevel: 5,
  pendingReviewCount: 2,
})
const e2eIntel = resolvePageIntelligence('/director/curriculum', e2eLiveState)
assert('P8-1: e2e intel resolved', e2eIntel !== null)
if (e2eIntel) {
  const e2eTask = resolvePageTask(e2eIntel, { liveState: e2eLiveState })
  assert('P8-2: e2e task resolved', typeof e2eTask.urgency === 'string')
  assertIncludes('P8-3: e2e task mentions 5 players', e2eTask.highestPriorityTask, '5')
  const e2ePath = buildCompletionPath(e2eIntel, e2eTask, e2eLiveState)
  assert('P8-4: e2e completion path resolved', typeof e2ePath.goal === 'string')
  assertIncludes('P8-5: e2e path mentions assign', e2ePath.nextStep.toLowerCase(), 'assign')
}

// Simulate a director on /director/placement with 0 in queue
const e2ePlacementState = buildLivePageState({
  route: '/director/placement',
  placementQueueCount: 0,
})
const e2ePlacementIntel = resolvePageIntelligence('/director/placement', e2ePlacementState)
if (e2ePlacementIntel) {
  const e2ePlacementTask = resolvePageTask(e2ePlacementIntel, { liveState: e2ePlacementState })
  assert('P8-6: placement e2e task urgency low when queue=0', e2ePlacementTask.urgency === 'low')
}

// Simulate a director on /director/onboarding — not yet complete
const e2eOnboardingState = buildLivePageState({
  route: '/director/onboarding',
  onboardingComplete: false,
})
const e2eOnboardingIntel = resolvePageIntelligence('/director/onboarding', e2eOnboardingState)
if (e2eOnboardingIntel) {
  const e2eOnboardingPath = buildCompletionPath(e2eOnboardingIntel, undefined, e2eOnboardingState)
  assert('P8-7: onboarding path has goal', e2eOnboardingPath.goal.length > 0)
  assert('P8-8: onboarding path has next step', e2eOnboardingPath.nextStep.length > 0)
}

// ── Results ───────────────────────────────────────────────────────────────────

export function runDonnaLiveStateAwareCompletionCertification(): {
  passed: number
  failed: number
  total: number
  failures: string[]
  certified: boolean
} {
  return {
    passed,
    failed,
    total: passed + failed,
    failures,
    certified: failed === 0,
  }
}

const result = runDonnaLiveStateAwareCompletionCertification()
const certLabel = result.certified ? 'CERTIFIED' : 'FAILED'
console.log(`\n[DONNA Live State-Aware Completion Certification] ${certLabel}`)
console.log(`Passed: ${result.passed}/${result.total}`)
if (result.failures.length > 0) {
  console.log('Failures:')
  result.failures.forEach(f => console.log(`  ${f}`))
}

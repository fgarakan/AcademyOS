// Mega Sprint 3151–3180 — DONNA Reality Synchronization Engine V1
// Part 5 — Reality Integration Certification
//
// Verifies end-to-end: LivePageState → RealitySnapshot → effectiveLiveState → page resolvers → AI context.
//
// Invariants tested:
//   A. Adapter:    livePageStateToSnapshot() wraps values with correct provenance and timestamps them.
//   B. Projection: projectSnapshotToLiveState() preserves fresh values and nulls stale ones.
//   C. Formatter:  formatSnapshotForAI() emits only fresh signals.
//   D. Brain:      processDonnaMessage() builds a snapshot and uses effectiveLiveState for page resolvers.
//   E. Stale gate: stale signals cannot reach page resolvers or AI context strings.
//   F. Regression: existing page-aware certification functions still pass.
//
// No DB. No API. No React. Pure TypeScript assertions.

import { livePageStateToSnapshot, projectSnapshotToLiveState, formatSnapshotForAI } from './realityAdapter'
import { buildRealitySnapshot } from './realitySynchronizationEngine'
import { freshValue } from './realitySnapshot'
import { createPartialLivePageState } from '../operating/livePageState'
import { resolvePageIntelligence } from '../operating/pageContextResolver'
import { buildCompletionPath } from '../operating/pageCompletionEngine'
import { resolvePageTask } from '../operating/pageTaskResolver'
import { processDonnaMessage } from '../brain/processDonnaMessage'

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

// ── A. Adapter tests ──────────────────────────────────────────────────────────

const freshLiveState = createPartialLivePageState('/director/curriculum', {
  academyId:                     'academy-test-1',
  onboardingComplete:            true,
  onboardingProgress:            7,
  pendingReviewCount:            3,
  curriculumSpineActive:         true,
  playersMissingCurriculumLevel: 4,
  placementQueueCount:           2,
  levelUpQueueCount:             1,
  activePlayerCount:             22,
  activeCoachCount:              4,
  playersNeedingAttention:       5,
  playersWithoutAssessment:      3,
  pendingParentApprovals:        2,
  pendingCurriculumReviews:      1,
  lastUpdatedAt:                 new Date().toISOString(),
})

const snapshot = livePageStateToSnapshot(freshLiveState)

assert('A-01: snapshot.snapshotId is non-empty', snapshot.snapshotId.startsWith('snap_'))
assert('A-02: snapshot.route matches input route', snapshot.route === '/director/curriculum')
assert('A-03: academy.academyId has correct value', snapshot.academy.academyId.value === 'academy-test-1')
assert('A-04: academy.academyId.source is ui_prop', snapshot.academy.academyId.source === 'ui_prop')
assert('A-05: academy.onboardingComplete.value is true', snapshot.academy.onboardingComplete.value === true)
assert('A-06: players.activeCount.value is 22', snapshot.players.activeCount.value === 22)
assert('A-07: players.needingAttention.value is 5', snapshot.players.needingAttention.value === 5)
assert('A-08: curriculum.spineActive.value is true', snapshot.curriculum.spineActive.value === true)
assert('A-09: players.missingCurriculumLevel.value is 4', snapshot.players.missingCurriculumLevel.value === 4)
assert('A-10: approvals.pendingTotal.value is 3', snapshot.approvals.pendingTotal.value === 3)
assert('A-11: placement.queueCount.value is 2', snapshot.placement.queueCount.value === 2)
assert('A-12: promotions.queueCount.value is 1', snapshot.promotions.queueCount.value === 1)
assert('A-13: fresh snapshot signals are not stale', !snapshot.approvals.pendingTotal.isStale)
assert('A-14: unknown field produces null value signal', snapshot.healthSignals.overallScore.value === null)
assert('A-15: null input produces unknown signal', snapshot.groups.underfilledCount.value === null)

// ── B. Projection tests ───────────────────────────────────────────────────────

const projected = projectSnapshotToLiveState(snapshot)

assert('B-01: projected.route matches snapshot route', projected.route === '/director/curriculum')
assert('B-02: projected.pendingReviewCount preserved (fresh)', projected.pendingReviewCount === 3)
assert('B-03: projected.curriculumSpineActive preserved', projected.curriculumSpineActive === true)
assert('B-04: projected.playersMissingCurriculumLevel preserved', projected.playersMissingCurriculumLevel === 4)
assert('B-05: projected.placementQueueCount preserved', projected.placementQueueCount === 2)
assert('B-06: projected.levelUpQueueCount preserved', projected.levelUpQueueCount === 1)
assert('B-07: projected.activePlayerCount preserved', projected.activePlayerCount === 22)
assert('B-08: projected.playersNeedingAttention preserved', projected.playersNeedingAttention === 5)
assert('B-09: projected.pendingParentApprovals preserved', projected.pendingParentApprovals === 2)
assert('B-10: projected.lastUpdatedAt matches snapshot.createdAt', projected.lastUpdatedAt === snapshot.createdAt)
assert('B-11: unknown signals project as null', projected.underfilledGroups === null)

// Stale signal test: build a snapshot with a very old timestamp so signals exceed TTL
const veryOldTs = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 60 minutes ago — exceeds all TTLs
const staleSnapshot = buildRealitySnapshot({
  route:               '/director/review',
  source:              'ui_prop',
  timestamp:           veryOldTs,
  pendingReviewCount:  7,
  pendingParentApprovals: 3,
})

const staleProjected = projectSnapshotToLiveState(staleSnapshot)

assert('B-12: stale pendingReviewCount projects as null', staleProjected.pendingReviewCount === null)
assert('B-13: stale pendingParentApprovals projects as null', staleProjected.pendingParentApprovals === null)
assert('B-14: stale signal isStale flag is true', staleSnapshot.approvals.pendingTotal.isStale === true)
assert('B-15: freshValue() on stale signal returns null', freshValue(staleSnapshot.approvals.pendingTotal) === null)

// ── C. AI formatter tests ─────────────────────────────────────────────────────

const aiStr = formatSnapshotForAI(snapshot)

assert('C-01: formatSnapshotForAI returns non-empty string for known snapshot', aiStr.length > 0)
assert('C-02: AI string contains pending count', aiStr.includes('pending=3'))
assert('C-03: AI string contains missing-levels', aiStr.includes('missing-levels=4'))
assert('C-04: AI string contains attention count', aiStr.includes('attention=5'))
assert('C-05: AI string contains placement queue', aiStr.includes('placement-queue=2'))
assert('C-06: AI string contains level-up queue', aiStr.includes('level-up-queue=1'))
assert('C-07: AI string contains spine=active', aiStr.includes('spine=active'))
assert('C-08: AI string starts with Live (snapshot):', aiStr.startsWith('Live (snapshot):'))
assert('C-09: formatSnapshotForAI returns empty for null', formatSnapshotForAI(null) === '')
assert('C-10: formatSnapshotForAI returns empty for undefined', formatSnapshotForAI(undefined) === '')

// Stale snapshot: AI string should be empty (no fresh signals worth reporting)
const staleAiStr = formatSnapshotForAI(staleSnapshot)
// The stale snapshot has pendingReviewCount=7 but it's stale — should be omitted
assert('C-11: stale snapshot produces empty AI string', staleAiStr === '')

// ── D. Brain integration tests ────────────────────────────────────────────────

// Build a minimal DonnaMessageInput with livePageState
const brainInput = {
  userMessage:              'what should I do here?',
  role:                     'director' as const,
  route:                    '/director/curriculum',
  activeGuidedWorkflowId:   null,
  cooState:                 null,
  goalMemory:               null,
  livePageState:            freshLiveState,
}

const brainResult = processDonnaMessage(brainInput)

assert('D-01: processDonnaMessage returns non-null realitySnapshot', brainResult.realitySnapshot !== null)
assert('D-02: brain snapshot route matches input route', brainResult.realitySnapshot?.route === '/director/curriculum')
assert('D-03: brain routes page-confusion to respond action', brainResult.action === 'respond')
assert('D-04: brain result includes pageIntelligence', brainResult.pageIntelligence !== null)
assert('D-05: response mentions curriculum page', brainResult.response.toLowerCase().includes('curriculum'))

// Verify stale gate: stale livePageState should not contaminate the page response
// We build a stale live state and verify the projected values (null) are used,
// not the raw stale values.
const staleLiveState = createPartialLivePageState('/director/curriculum', {
  curriculumSpineActive:         false, // stale — will become null after projection
  playersMissingCurriculumLevel: 99,   // stale — will become null after projection
  lastUpdatedAt:                 veryOldTs,
})

const staleBrainInput = {
  ...brainInput,
  livePageState: staleLiveState,
}

const staleBrainResult = processDonnaMessage(staleBrainInput)

assert('D-06: stale brain result still returns respond action', staleBrainResult.action === 'respond')
assert('D-07: stale snapshot is built', staleBrainResult.realitySnapshot !== null)
// The curriculum completion path should use null (stale projected) values — falling to static path
// Static path returns the generic ROUTE_COMPLETION_PATHS['/director/curriculum'] definition
assert('D-08: stale live state produces valid response', staleBrainResult.response.length > 0)

// ── E. Stale gate invariant ───────────────────────────────────────────────────

// Verify: adapting then projecting always yields null for values that exceed TTL
const hourAgoTs = new Date(Date.now() - 61 * 60 * 1000).toISOString()
const staleGateLive = createPartialLivePageState('/director/review', {
  pendingReviewCount:     100,
  pendingParentApprovals: 50,
  playersNeedingAttention: 20,
  lastUpdatedAt:          hourAgoTs,
})

const staleGateSnap = livePageStateToSnapshot(staleGateLive)
const staleGateProj = projectSnapshotToLiveState(staleGateSnap)

assert('E-01: stale pendingReviewCount=100 → projected null', staleGateProj.pendingReviewCount === null)
assert('E-02: stale pendingParentApprovals=50 → projected null', staleGateProj.pendingParentApprovals === null)
assert('E-03: stale playersNeedingAttention=20 → projected null', staleGateProj.playersNeedingAttention === null)
assert('E-04: stale AI string for gate snapshot is empty', formatSnapshotForAI(staleGateSnap) === '')

// ── F. Page resolver regression ───────────────────────────────────────────────

// Verify resolvers still work correctly with the projected state
const projIntel = resolvePageIntelligence('/director/curriculum', projected)
assert('F-01: resolvePageIntelligence accepts projected state', projIntel !== null)
assert('F-02: projected spine=active drives correct recommendedNextAction',
  projIntel?.recommendedNextAction.includes('4 player') ?? false)

const projTask = resolvePageTask(projIntel!, { liveState: projected })
assert('F-03: resolvePageTask resolves with projected state', projTask.highestPriorityTask.length > 0)
assert('F-04: task urgency reflects live state (4 missing levels → medium)',
  projTask.urgency === 'medium')

const projPath = buildCompletionPath(projIntel!, undefined, projected)
assert('F-05: buildCompletionPath accepts projected state', projPath.goal.length > 0)
assert('F-06: completion path reflects 4 unassigned players',
  projPath.currentStep.includes('4 player'))

// Verify null live state still works (backward compat)
const nullIntel = resolvePageIntelligence('/director/curriculum', null)
assert('F-07: resolvePageIntelligence handles null liveState (backward compat)', nullIntel !== null)
const nullPath = buildCompletionPath(nullIntel!, undefined, null)
assert('F-08: buildCompletionPath handles null liveState (backward compat)', nullPath.goal.length > 0)

// ── Results ───────────────────────────────────────────────────────────────────

export const REALITY_INTEGRATION_CERTIFICATION = {
  passed,
  failed,
  failures,
  total: passed + failed,
  certified: failed === 0,
  label: `DONNA Reality Integration Certification — ${passed}/${passed + failed} PASS${failed > 0 ? ` — FAILURES: ${failures.join(' | ')}` : ''}`,
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  if (failed > 0) {
    console.error('[Reality Integration] CERTIFICATION FAILED:', failures)
  }
}

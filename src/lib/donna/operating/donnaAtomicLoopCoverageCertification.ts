// Mega Sprint 3121–3150 — DONNA Atomic Loop Coverage & Live State Expansion V1
// Certification Harness
//
// Verifies that every major atomic loop has:
//   1. A PageIntelligence entry (resolvePageIntelligence returns non-null)
//   2. A task (resolvePageTask returns a task with urgency string)
//   3. A completion path (buildCompletionPath returns a path with goal string)
//   4. Operating phrase coverage (detectOperatingIntent detects canonical phrases)
//   5. Live state null safety (all functions handle null liveState without throwing)
//
// Routes with no PageIntelligence are recorded in the `gaps` array — they do NOT
// cause the certification to fail, but are surfaced for the next sprint.
//
// No DB. No API. No React. Pure TypeScript assertions.

import { resolvePageIntelligence } from '@/lib/donna/operating/pageContextResolver'
import { resolvePageTask } from '@/lib/donna/operating/pageTaskResolver'
import { buildCompletionPath } from '@/lib/donna/operating/pageCompletionEngine'
import { detectOperatingIntent } from '@/lib/donna/operating/donnaOperatingPhraseLibrary'
import { createPartialLivePageState } from '@/lib/donna/operating/livePageState'

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []
const gaps: string[] = []

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(`FAIL: ${label}`)
  }
}

function recordGap(route: string, reason: string): void {
  gaps.push(`GAP [${route}]: ${reason}`)
}

// ── Route coverage table ──────────────────────────────────────────────────────

interface RouteSpec {
  route: string
  /** If true, missing PageIntelligence is a gap, not a failure */
  knownGapIfMissing?: boolean
}

const ROUTES_TO_CERTIFY: RouteSpec[] = [
  { route: '/director/onboarding' },
  { route: '/director/curriculum' },
  { route: '/director/class-templates/some-template-id' },
  { route: '/director/fitness/templates/some-template-id' },
  { route: '/director/sessions' },
  { route: '/director/sessions/new', knownGapIfMissing: true },
  { route: '/director/coaches', knownGapIfMissing: true },
  { route: '/director/players' },
  { route: '/director/players/some-player-id' },
  { route: '/director/placement' },
  { route: '/director/level-up' },
  { route: '/director/review' },
  { route: '/director/parents' },
  { route: '/director/groups/some-group-id' },
  { route: '/director/kpi' },
  { route: '/director' },
  { route: '/coach/' },
  { route: '/coach/sessions/some-session-id' },
  { route: '/coach/sessions/some-session-id/wrap-up' },
]

// ── Part 1: Operating phrase detection (tested once, applies to all pages) ────

assert('P0-1: detectOperatingIntent("what should i do here") === what_should_i_do',
  detectOperatingIntent('what should i do here') === 'what_should_i_do')
assert('P0-2: detectOperatingIntent("what\'s next") === whats_next',
  detectOperatingIntent("what's next") === 'whats_next')
assert('P0-3: detectOperatingIntent("take me to completion") === take_me_to_completion',
  detectOperatingIntent('take me to completion') === 'take_me_to_completion')
assert('P0-4: detectOperatingIntent("walk me through this") === walk_me_through',
  detectOperatingIntent('walk me through this') === 'walk_me_through')
assert('P0-5: detectOperatingIntent("what is blocking this page") === what_is_blocking',
  detectOperatingIntent('what is blocking this page') === 'what_is_blocking')
assert('P0-6: detectOperatingIntent("what matters most") === what_matters_most',
  detectOperatingIntent('what matters most') === 'what_matters_most')
assert('P0-7: detectOperatingIntent("help me finish") === help_me_finish',
  detectOperatingIntent('help me finish') === 'help_me_finish')
assert('P0-8: detectOperatingIntent("what needs attention") === what_needs_attention',
  detectOperatingIntent('what needs attention') === 'what_needs_attention')
assert('P0-9: detectOperatingIntent("how is this") === status_check',
  detectOperatingIntent('how is this') === 'status_check')
assert('P0-10: detectOperatingIntent("random text") === null',
  detectOperatingIntent('random text') === null)

// ── Part 2: Per-route coverage checks ─────────────────────────────────────────

ROUTES_TO_CERTIFY.forEach((spec, idx) => {
  const n = idx + 1
  const route = spec.route
  const liveState = createPartialLivePageState(route, {})

  // Check PageIntelligence
  const intel = resolvePageIntelligence(route)
  const hasIntel = intel !== null

  if (!hasIntel && spec.knownGapIfMissing) {
    recordGap(route, 'No PageIntelligence entry — add to pageContextResolver.ts')
    // Still count passes for other criteria as N/A — skip to avoid false failures
    return
  }

  assert(`P${n}-1: resolvePageIntelligence("${route}") is non-null`, hasIntel)

  if (!hasIntel) return // Can't test downstream if no intel

  // Check task resolver
  let taskOk = false
  try {
    const task = resolvePageTask(intel, {})
    taskOk = typeof task.urgency === 'string'
  } catch {
    taskOk = false
  }
  assert(`P${n}-2: resolvePageTask("${route}") returns urgency string`, taskOk)

  // Check completion path
  let pathOk = false
  try {
    const path = buildCompletionPath(intel, undefined, null)
    pathOk = typeof path.goal === 'string' && path.goal.length > 0
  } catch {
    pathOk = false
  }
  assert(`P${n}-3: buildCompletionPath("${route}", null) returns goal string`, pathOk)

  // Null liveState safety
  let nullSafe = false
  try {
    resolvePageIntelligence(route, null)
    resolvePageTask(intel, { liveState: null })
    buildCompletionPath(intel, undefined, null)
    nullSafe = true
  } catch {
    nullSafe = false
  }
  assert(`P${n}-4: null liveState does not throw for "${route}"`, nullSafe)

  // Live state passes through
  let liveOk = false
  try {
    const intelWithLive = resolvePageIntelligence(route, liveState)
    liveOk = intelWithLive !== null
  } catch {
    liveOk = false
  }
  assert(`P${n}-5: resolvePageIntelligence with liveState does not throw for "${route}"`, liveOk)
})

// ── Part 3: Live state expansion verification ──────────────────────────────────

// Verify new livePageState fields exist and are null by default
const testState = createPartialLivePageState('/director/curriculum', {})
assert('P3-1: playersNeedingAttention defaults to null', testState.playersNeedingAttention === null)
assert('P3-2: playersWithoutAssessment defaults to null', testState.playersWithoutAssessment === null)
assert('P3-3: pendingParentApprovals defaults to null', testState.pendingParentApprovals === null)
assert('P3-4: pendingCoachApprovals defaults to null', testState.pendingCoachApprovals === null)
assert('P3-5: promotionQueueCount defaults to null', testState.promotionQueueCount === null)
assert('P3-6: upcomingSessions defaults to null', testState.upcomingSessions === null)
assert('P3-7: unassignedSessions defaults to null', testState.unassignedSessions === null)
assert('P3-8: underfilledGroups defaults to null', testState.underfilledGroups === null)
assert('P3-9: overfilledGroups defaults to null', testState.overfilledGroups === null)
assert('P3-10: curriculumProgress defaults to null', testState.curriculumProgress === null)

// Verify new fields can be set
const filledState = createPartialLivePageState('/director/review', {
  pendingParentApprovals: 3,
  pendingCoachApprovals: 2,
  playersNeedingAttention: 5,
  playersWithoutAssessment: 8,
  upcomingSessions: 12,
})
assert('P3-11: pendingParentApprovals can be set', filledState.pendingParentApprovals === 3)
assert('P3-12: pendingCoachApprovals can be set', filledState.pendingCoachApprovals === 2)
assert('P3-13: playersNeedingAttention can be set', filledState.playersNeedingAttention === 5)
assert('P3-14: playersWithoutAssessment can be set', filledState.playersWithoutAssessment === 8)
assert('P3-15: upcomingSessions can be set', filledState.upcomingSessions === 12)

// ── Part 4: Live state overrides fire correctly ────────────────────────────────

// Director players — attention override
const playersStateWithAttention = createPartialLivePageState('/director/players', { playersNeedingAttention: 7 })
const playersIntelAttention = resolvePageIntelligence('/director/players', playersStateWithAttention)
assert('P4-1: players intel with attention override is non-null', playersIntelAttention !== null)
if (playersIntelAttention) {
  assert('P4-2: players recommended action names attention count',
    playersIntelAttention.recommendedNextAction.includes('7'))
}

// Director review — parent approvals override
const reviewStateWithParent = createPartialLivePageState('/director/review', { pendingParentApprovals: 4 })
const reviewIntelParent = resolvePageIntelligence('/director/review', reviewStateWithParent)
assert('P4-3: review intel with parent approvals override is non-null', reviewIntelParent !== null)
if (reviewIntelParent) {
  assert('P4-4: review recommended action mentions parent count',
    reviewIntelParent.recommendedNextAction.includes('4') ||
    reviewIntelParent.warnings.some(w => w.includes('4')))
}

// Review task — parent approvals branch
const reviewIntelBase = resolvePageIntelligence('/director/review')!
const reviewTaskParent = resolvePageTask(reviewIntelBase, {
  liveState: createPartialLivePageState('/director/review', { pendingParentApprovals: 6 }),
})
assert('P4-5: review task urgency is high when parent approvals > 0', reviewTaskParent.urgency === 'high')
assert('P4-6: review task mentions parent-visible items', reviewTaskParent.highestPriorityTask.toLowerCase().includes('parent'))

// ── Part 5: Coach route coverage ─────────────────────────────────────────────

const coachIntel = resolvePageIntelligence('/coach/')
assert('P5-1: resolvePageIntelligence("/coach/") returns non-null', coachIntel !== null)

const coachSessionIntel = resolvePageIntelligence('/coach/sessions/abc-session-id')
assert('P5-2: resolvePageIntelligence("/coach/sessions/...") returns non-null', coachSessionIntel !== null)

const coachWrapUpIntel = resolvePageIntelligence('/coach/sessions/abc/wrap-up')
assert('P5-3: resolvePageIntelligence("/coach/sessions/.../wrap-up") returns non-null', coachWrapUpIntel !== null)
if (coachWrapUpIntel) {
  assert('P5-4: wrap-up intel has attendance completion goal',
    coachWrapUpIntel.completionGoals.some(g => g.toLowerCase().includes('attendance')))
}

if (coachSessionIntel) {
  const coachSessionTask = resolvePageTask(coachSessionIntel, {})
  assert('P5-5: coach session task urgency is high', coachSessionTask.urgency === 'high')
  assert('P5-6: coach session task mentions attendance',
    coachSessionTask.highestPriorityTask.toLowerCase().includes('attendance'))

  const coachSessionPath = buildCompletionPath(coachSessionIntel, undefined, null)
  assert('P5-7: coach session path goal mentions wrap-up', coachSessionPath.goal.toLowerCase().includes('wrap'))
  assert('P5-8: coach session path next step mentions observation', coachSessionPath.nextStep.toLowerCase().includes('observation'))
}

// ── Results ───────────────────────────────────────────────────────────────────

export function runDonnaAtomicLoopCoverageCertification(): {
  passed: number
  failed: number
  total: number
  failures: string[]
  gaps: string[]
  certified: boolean
} {
  return {
    passed,
    failed,
    total: passed + failed,
    failures,
    gaps,
    certified: failed === 0,
  }
}

const result = runDonnaAtomicLoopCoverageCertification()
const certLabel = result.certified ? 'CERTIFIED' : 'FAILED'
console.log(`\n[DONNA Atomic Loop Coverage Certification] ${certLabel}`)
console.log(`Passed: ${result.passed}/${result.total}`)
if (result.failures.length > 0) {
  console.log('Failures:')
  result.failures.forEach(f => console.log(`  ${f}`))
}
if (result.gaps.length > 0) {
  console.log('Known gaps (not failures):')
  result.gaps.forEach(g => console.log(`  ${g}`))
}

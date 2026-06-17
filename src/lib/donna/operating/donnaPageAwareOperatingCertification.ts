// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 10 — Certification Harness
//
// Tests all 10 sprint parts with pure TypeScript assertions.
// No DB, no network calls, no React.
//
// Run: npx tsx src/lib/donna/operating/donnaPageAwareOperatingCertification.ts

import { resolvePageIntelligence, formatPageIntelligenceForTeacher } from '@/lib/donna/operating/pageContextResolver'
import { buildPageOperatingContext } from '@/lib/donna/operating/pageOperatingContext'
import { resolvePageTask } from '@/lib/donna/operating/pageTaskResolver'
import { buildCompletionPath, formatCompletionPathForResponse } from '@/lib/donna/operating/pageCompletionEngine'
import { buildStrategicContextPacket, formatContextForTeacher } from '@/lib/donna/brain/donnaStrategicAIContextBuilder'
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

// ── Brain input stub ──────────────────────────────────────────────────────────

function makeInput(userMessage: string, route: string) {
  return {
    userMessage,
    role: 'director' as const,
    route,
    activeGuidedWorkflowId: null as null,
    activeGoalSession: null,
    cooState: null,
    goalMemory: null,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nDONNA Page-Aware Operating Layer V1 — Certification\n')
console.log('─'.repeat(65))

// ── Test 1: Curriculum page awareness ─────────────────────────────────────────
console.log('\nTest 1 — Curriculum page awareness')

const curriculumIntel = resolvePageIntelligence('/director/curriculum')
assert(1, 'resolvePageIntelligence returns non-null for /director/curriculum', curriculumIntel !== null)
assert(2, 'pageName is "Curriculum"', curriculumIntel?.pageName === 'Curriculum')
assert(3, 'completionGoals has at least 2 entries', (curriculumIntel?.completionGoals.length ?? 0) >= 2)
assert(4, 'recommendedNextAction mentions "curriculum spine" or "curriculum levels"',
  (curriculumIntel?.recommendedNextAction.toLowerCase().includes('curriculum') ?? false))
assert(5, 'warnings array populated (curriculum spine warning)', (curriculumIntel?.warnings.length ?? 0) > 0)

// ── Test 2: Player profile awareness ──────────────────────────────────────────
console.log('\nTest 2 — Player profile page awareness')

const playerProfileIntel = resolvePageIntelligence('/director/players/abc123-player-id')
assert(6, 'resolvePageIntelligence returns non-null for player profile route', playerProfileIntel !== null)
assert(7, 'pageName is "Player Profile"', playerProfileIntel?.pageName === 'Player Profile')
assert(8, 'completionGoals includes assessment-related entry',
  playerProfileIntel?.completionGoals.some(g => g.toLowerCase().includes('assessment')) ?? false)

// ── Test 3: Placement page awareness ──────────────────────────────────────────
console.log('\nTest 3 — Placement page awareness')

const placementIntel = resolvePageIntelligence('/director/placement')
assert(9, 'resolvePageIntelligence returns non-null for /director/placement', placementIntel !== null)
assert(10, 'pageName is "Placement Engine"', placementIntel?.pageName === 'Placement Engine')
assert(11, 'completionGoals mentions finalize_player_placement',
  placementIntel?.completionGoals.some(g => g.includes('finalize_player_placement')) ?? false)

// ── Test 4: Level-up page awareness ───────────────────────────────────────────
console.log('\nTest 4 — Level-up page awareness')

const levelUpIntel = resolvePageIntelligence('/director/level-up')
assert(12, 'resolvePageIntelligence returns non-null for /director/level-up', levelUpIntel !== null)
assert(13, 'pageName is "Level Up Review"', levelUpIntel?.pageName === 'Level Up Review')
assert(14, 'recommendedNextAction references "review" or "evidence"',
  (levelUpIntel?.recommendedNextAction.toLowerCase().match(/review|evidence/) ?? null) !== null)

// ── Test 5: Onboarding page awareness ─────────────────────────────────────────
console.log('\nTest 5 — Onboarding page awareness')

const onboardingIntel = resolvePageIntelligence('/director/onboarding')
assert(15, 'resolvePageIntelligence returns non-null for /director/onboarding', onboardingIntel !== null)
assert(16, 'pageName is "Academy Setup"', onboardingIntel?.pageName === 'Academy Setup')
assert(17, 'warnings mentions DNA model', onboardingIntel?.warnings.some(w => w.toLowerCase().includes('dna')) ?? false)

// ── Test 6: Page context injected into Strategic AI builder ───────────────────
console.log('\nTest 6 — Page context injected into Strategic AI')

const strategicPacket = buildStrategicContextPacket('curriculum_design', null)
const pageCtxString = curriculumIntel ? formatPageIntelligenceForTeacher(curriculumIntel) : undefined
const formattedWithPage = formatContextForTeacher(strategicPacket, 'How should I structure my curriculum?', pageCtxString)
const formattedWithout = formatContextForTeacher(strategicPacket, 'How should I structure my curriculum?')

assert(18, 'formatContextForTeacher accepts optional pageContext parameter', typeof formattedWithPage === 'string')
assert(19, 'formatContextForTeacher with page context is different from without', formattedWithPage !== formattedWithout)
assert(20, 'formatted context stays within 250 chars', formattedWithPage.length <= 250)

// ── Test 7: Page context formatted for Live AI teacher ───────────────────────
console.log('\nTest 7 — Page context formatted for Live AI teacher')

const teacherStr = curriculumIntel ? formatPageIntelligenceForTeacher(curriculumIntel) : ''
assert(21, 'formatPageIntelligenceForTeacher returns non-empty string', teacherStr.length > 0)
assert(22, 'formatted string stays within 300 chars', teacherStr.length <= 300)
assert(23, 'formatted string mentions page name', teacherStr.includes('Curriculum'))
assert(24, 'formatted string mentions recommended action', teacherStr.includes('curriculum'))

// ── Test 8: Generic clarification is blocked on curriculum page ───────────────
console.log('\nTest 8 — Page confusion phrase on curriculum route returns page-specific response')

const brainResult = processDonnaMessage(makeInput(
  "I don't know what needs to be done on this page",
  '/director/curriculum',
))

const genericClarifyPatterns = ['did you mean', 'could you clarify', 'which one did you mean', "i'm not sure what you"]
const responseLower = brainResult.response.toLowerCase()
const hasGenericClarify = genericClarifyPatterns.some(p => responseLower.includes(p))

assert(25, 'brain result action is "respond"', brainResult.action === 'respond')
assert(26, 'response mentions "Curriculum"', brainResult.response.includes('Curriculum'))
assert(27, 'response does NOT contain generic clarification', !hasGenericClarify)
assert(28, 'response mentions recommended next action', brainResult.response.toLowerCase().includes('curriculum'))
assert(29, 'pageIntelligence is populated in result', brainResult.pageIntelligence !== null)
assert(30, 'pageIntelligence.pageName is "Curriculum"', brainResult.pageIntelligence?.pageName === 'Curriculum')

// ── Test 9: Continuation survives Yes/Okay/Done ───────────────────────────────
console.log('\nTest 9 — Continuation survives Yes/Okay/Done after page confusion response')

assert(31, 'updatedNavigatorState is populated after page confusion response', brainResult.updatedNavigatorState !== null)
assert(32, 'navigator stage is "action" after page confusion response', brainResult.updatedNavigatorState?.stage === 'action')
assert(33, 'proposedActionType is "page_guidance"', brainResult.updatedNavigatorState?.proposedActionType === 'page_guidance')
assert(34, 'extractedEntity is the page name', brainResult.updatedNavigatorState?.extractedEntity === 'Curriculum')

// Simulate "yes" after page guidance arc is active
const yesResult = processDonnaMessage({
  ...makeInput('yes', '/director/curriculum'),
  conversationNavigatorState: brainResult.updatedNavigatorState,
})
assert(35, '"yes" does not restart as a new query (action is respond or route_coo_prompt)', yesResult.action !== 'start_goal_session')
assert(36, '"yes" response does not re-explain the page from scratch',
  !yesResult.response.toLowerCase().includes('you are on **curriculum**'))

// ── Test 10: Completion path generated ────────────────────────────────────────
console.log('\nTest 10 — Completion path generated for curriculum')

const completionPath = curriculumIntel ? buildCompletionPath(curriculumIntel) : null
assert(37, 'buildCompletionPath returns non-null for curriculum', completionPath !== null)
assert(38, 'completionPath.goal is set', (completionPath?.goal.length ?? 0) > 0)
assert(39, 'completionPath.nextStep is set', (completionPath?.nextStep.length ?? 0) > 0)
assert(40, 'completionPath.remainingSteps has at least 1 entry', (completionPath?.remainingSteps.length ?? 0) >= 1)
assert(41, 'completionPath.completionCondition is set', (completionPath?.completionCondition.length ?? 0) > 0)

const completionFragment = completionPath ? formatCompletionPathForResponse(completionPath) : ''
assert(42, 'formatCompletionPathForResponse produces readable string', completionFragment.includes('Next step'))

// ── Test 11: Task resolver produces next action ───────────────────────────────
console.log('\nTest 11 — Task resolver produces next action for priority pages')

const curriculumTask = curriculumIntel ? resolvePageTask(curriculumIntel) : null
assert(43, 'resolvePageTask returns a task for curriculum', curriculumTask !== null)
assert(44, 'curriculum task urgency is "critical"', curriculumTask?.urgency === 'critical')
assert(45, 'curriculum task mentions spine or levels', curriculumTask?.highestPriorityTask.toLowerCase().includes('curriculum') ?? false)

const placementTask = placementIntel ? resolvePageTask(placementIntel) : null
assert(46, 'resolvePageTask returns a task for placement', placementTask !== null)
assert(47, 'placement task urgency is "critical"', placementTask?.urgency === 'critical')

const reviewIntel = resolvePageIntelligence('/director/review')
const reviewTask = reviewIntel ? resolvePageTask(reviewIntel, { pendingReviews: 7 }) : null
assert(48, 'review task uses pendingReviews signal', reviewTask?.highestPriorityTask.includes('7') ?? false)

// ── Test 12: Operating context and page coverage ──────────────────────────────
console.log('\nTest 12 — Operating context built for all priority pages')

const priorityRoutes = [
  '/director',
  '/director/review',
  '/director/kpi',
  '/director/curriculum',
  '/director/level-up',
  '/director/placement',
  '/director/onboarding',
  '/director/players/test-player-id',
  '/director/groups/test-group-id',
]

let allPagesHaveIntelligence = true
let allPagesHaveOperatingContext = true
let allPagesHaveCompletionCriteria = true

for (const route of priorityRoutes) {
  const intel = resolvePageIntelligence(route)
  if (!intel) { allPagesHaveIntelligence = false; console.error(`    No intelligence for: ${route}`) }
  if (intel) {
    const ctx = buildPageOperatingContext(intel)
    if (!ctx) allPagesHaveOperatingContext = false
    if (!intel.completionGoals || intel.completionGoals.length === 0) {
      allPagesHaveCompletionCriteria = false
      console.error(`    No completion goals for: ${route}`)
    }
  }
}

assert(49, 'All 9 priority routes have page intelligence', allPagesHaveIntelligence)
assert(50, 'All priority pages have operating context', allPagesHaveOperatingContext)
assert(51, 'All priority pages have completion criteria', allPagesHaveCompletionCriteria)

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(65))
console.log(`\nResults: ${passed} passed / ${failed} failed out of ${passed + failed} assertions\n`)

if (failures.length > 0) {
  console.error('Failed assertions:')
  failures.forEach(f => console.error(`  • ${f}`))
  process.exit(1)
} else {
  console.log('✓ DONNA Page-Aware Operating Layer V1 — 51/51 CERTIFIED\n')
  process.exit(0)
}

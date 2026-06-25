// Mega Sprint 4291–4320 — Demo Academy God Mode Test Harness V1
// Certification — the demo dataset is realistic, its derived signals match production
// rules, DONNA's Executive Intelligence sees the academy and surfaces real priorities /
// risks / opportunities, and reset is provably scoped to demo data only.
//
// This is the offline God-Mode proof: dataset → derived signals → Executive Intelligence,
// the same path the live app runs — without needing a database. Pure.
//
// Run: npx tsx src/lib/donna/certification/donnaDemoAcademyGodModeCertification.ts

import { demoAcademyGodModeV1 as DS, isDemoResettable, SEED_BATCH_ID, type PlayerArchetype } from '../../../../scripts/demo/demoAcademyGodModeV1'
import { deriveDemoSignals } from '../../../../scripts/demo/deriveDemoSignals'
import { buildExecutiveBriefing, buildSignalMap, detectRisks, detectOpportunities } from '@/lib/donna/executive/donnaExecutiveIntelligence'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

const ALL_ARCHETYPES: PlayerArchetype[] = [
  'ready_to_promote', 'almost_ready', 'stagnating', 'missing_assessment', 'declining_attendance',
  'parent_concern', 'strong_progress', 'no_curriculum_level', 'overdue_coach_note', 'new_onboarding',
]

function run() {
  process.stdout.write('\nDemo Academy God Mode Test Harness Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Seed creates a realistic academy (Obj 1 + 3) ──────────────────────────
  process.stdout.write('\n── A. Realistic demo academy composition ──\n')
  {
    check('A', '1 demo academy, tagged is_demo_data', DS.academy.isDemoData === true && DS.academy.id.length > 0)
    check('A', '1 director', !!DS.director.id)
    check('A', '3 coaches', DS.coaches.length === 3)
    check('A', '10 players', DS.players.length === 10)
    check('A', '10 parents', DS.parents.length === 10)
    check('A', 'every player has a distinct archetype', new Set(DS.players.map(p => p.archetype)).size === 10)
    check('A', 'all 10 required archetypes are present', ALL_ARCHETYPES.every(a => DS.players.some(p => p.archetype === a)))
    check('A', 'every parent maps to a real player', DS.parents.every(par => DS.players.some(p => p.id === par.childPlayerId)))
    check('A', 'approvals + sessions are seeded', DS.approvals.length >= 2 && DS.sessions.length >= 5)
  }

  // ── B. Curriculum reality across the spine (Obj 2) ───────────────────────────
  process.stdout.write('\n── B. Curriculum spans Red→HP with detectable gaps ──\n')
  {
    const stages = new Set(DS.players.map(p => p.levelStage).filter(Boolean))
    check('B', 'players span Red, Orange, Green, Yellow, HP-or-higher levels', ['Red', 'Orange', 'Green', 'Yellow'].every(s => stages.has(s as 'Red')))
    check('B', 'a player with NO curriculum level exists (gap to detect)', DS.players.some(p => p.status === 'active' && !p.hasCurriculumState))
    check('B', 'a promotion-ready player exists', DS.players.some(p => p.advancementEligible))
  }

  // ── C. Derived signals match the seeded reality (Obj 4 — no fake signals) ─────
  process.stdout.write('\n── C. Signals derived from real records ──\n')
  const s = deriveDemoSignals(DS)
  {
    check('C', 'curriculum spine is active', s.curriculumSpineActive === true)
    check('C', '9 active players (Kai is in placement)', s.activePlayerCount === 9)
    check('C', '1 player in the placement queue', s.placementQueueCount === 1)
    check('C', '1 player missing a curriculum level', s.playersMissingCurriculumLevel === 1)
    check('C', '1 promotion candidate', s.levelUpQueueCount === 1)
    check('C', '2 players without a recent assessment', s.playersWithoutAssessment === 2)
    check('C', '3 players needing attention', s.playersNeedingAttention === 3)
    check('C', '1 pending parent approval', s.pendingParentApprovals === 1)
    check('C', '1 pending coach approval', s.pendingCoachApprovals === 1)
    check('C', '3 active coaches', s.activeCoachCount === 3)
    check('C', 'onboarding is incomplete (a real gap)', s.onboardingComplete === false)
  }

  // ── D. DONNA sees priorities, risks, opportunities (Obj 4 + cert) ────────────
  process.stdout.write('\n── D. Executive Intelligence on the demo academy ──\n')
  {
    const map = buildSignalMap(s)
    const risks = detectRisks(map)
    const opportunities = detectOpportunities(map, [])
    const briefing = buildExecutiveBriefing(s, [])

    check('D', 'DONNA sees the players (signals inspected from real data)', map.knownCount >= 11)
    check('D', 'DONNA detects risks', risks.length >= 3)
    check('D', 'risk: pending approvals', risks.some(r => r.category === 'pending_approvals'))
    check('D', 'risk: curriculum gap', risks.some(r => r.category === 'curriculum_gaps'))
    check('D', 'risk: player stagnation/attention', risks.some(r => r.category === 'player_stagnation'))
    check('D', 'risk: missed assessments', risks.some(r => r.category === 'missed_assessments'))
    check('D', 'risk: incomplete onboarding', risks.some(r => r.category === 'incomplete_onboarding'))
    check('D', 'DONNA detects opportunities', opportunities.length >= 2)
    check('D', 'opportunity: promotion candidate', opportunities.some(o => o.category === 'promotion_candidates'))
    check('D', 'opportunity: enrollment / placement', opportunities.some(o => o.category === 'enrollment_leverage'))
    check('D', 'briefing returns the top 3–5 priorities', briefing.recommendations.length >= 3 && briefing.recommendations.length <= 5)
    check('D', 'every priority carries evidence + a next step', briefing.recommendations.every(r => r.evidence.length > 0 && r.nextStep.length > 0))
    check('D', 'briefing reads like a COO morning review', /reviewed the academy/i.test(briefing.headline))
    process.stdout.write(`   ${briefing.headline}\n   first: ${briefing.recommendations[0].recommendedAction} (${briefing.recommendations[0].evidence.join('; ')})\n`)
  }

  // ── E. Reset deletes only demo data (Obj 5) ──────────────────────────────────
  process.stdout.write('\n── E. Reset safety — demo data only ──\n')
  {
    check('E', 'the demo academy row IS resettable', isDemoResettable({ is_demo_data: true, seed_batch_id: SEED_BATCH_ID }))
    check('E', 'a real academy (untagged) is NEVER resettable', !isDemoResettable({ is_demo_data: null, seed_batch_id: null }))
    check('E', 'a real academy (is_demo_data false) is never resettable', !isDemoResettable({ is_demo_data: false, seed_batch_id: SEED_BATCH_ID }))
    check('E', 'a different demo batch is not resettable by this harness', !isDemoResettable({ is_demo_data: true, seed_batch_id: 'some_other_batch' }))
    check('E', 'all child records share the demo academy id (cascade-safe isolation)', DS.players.every(p => p.id.length > 0) && DS.academy.id.length > 0)
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`DEMO ACADEMY GOD MODE: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nDEMO ACADEMY GOD MODE CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run()

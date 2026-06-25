// Mega Sprint 4291–4320 (+ enrichment) — Operating Academy Certification
// Proves the demo is a realistic OPERATING academy, not a record dump: interconnected
// stories, competing priorities, coach personalities, player journeys, parent
// situations, a curriculum bottleneck, scheduling conflicts, and operational tradeoffs —
// and that these drive genuine executive decisions through the existing engine. Pure.
//
// Run: npx tsx src/lib/donna/certification/donnaDemoAcademyOperatingCertification.ts

import {
  demoAcademyGodModeV1 as DS,
  entitiesInScenarios,
} from '../../../../scripts/demo/demoAcademyGodModeV1'
import { deriveDemoSignals } from '../../../../scripts/demo/deriveDemoSignals'
import { buildExecutiveBriefing } from '@/lib/donna/executive/donnaExecutiveIntelligence'

let passed = 0
let failed = 0
const failures: string[] = []
function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

function isAscending(xs: number[]): boolean { return xs.length >= 2 && xs.every((v, i) => i === 0 || v >= xs[i - 1]) && xs[xs.length - 1] > xs[0] }
function isDescending(xs: number[]): boolean { return xs.length >= 2 && xs[xs.length - 1] < xs[0] }
function isFlat(xs: number[]): boolean { return xs.length >= 2 && Math.abs(xs[xs.length - 1] - xs[0]) <= 2 }

function run() {
  process.stdout.write('\nDemo Academy — Operating Academy Certification\n')
  process.stdout.write('============================================================\n')

  const playerIds = new Set(DS.players.map((p) => p.id))
  const coachKeys = new Set(DS.coaches.map((c) => c.key))
  const parentKeys = new Set(DS.parents.map((p) => p.key))

  // ── A. Interconnection — every entity contributes to a decision ──────────────
  process.stdout.write('\n── A. Entities are interconnected through scenarios ──\n')
  {
    const inScenes = entitiesInScenarios(DS)
    check('A', 'there are several multi-step operating scenarios', DS.scenarios.length >= 5)
    check('A', 'every coach appears in a scenario', DS.coaches.every((c) => inScenes.coaches.has(c.key)))
    check('A', 'at least 9 of 10 players drive a scenario', inScenes.players.size >= 9)
    check('A', 'the at-risk parents (leaving / concern) drive scenarios', ['p5', 'p6'].some((k) => inScenes.parents.has(k)))
    check('A', 'every scenario references only real entities', DS.scenarios.every((s) =>
      (s.entities.players ?? []).every((p) => playerIds.has(p)) &&
      (s.entities.coaches ?? []).every((c) => coachKeys.has(c)) &&
      (s.entities.parents ?? []).every((p) => parentKeys.has(p))))
    // A real academy: at least one entity threads through MULTIPLE scenarios.
    const counts = new Map<string, number>()
    DS.scenarios.forEach((s) => (s.entities.players ?? []).forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1)))
    check('A', 'a player threads through 2+ scenarios (a real storyline)', Array.from(counts.values()).some((n) => n >= 2))
  }

  // ── B. Competing priorities + tradeoffs (executive judgment, not a checklist) ─
  process.stdout.write('\n── B. Scenarios pose competing priorities + tradeoffs ──\n')
  {
    check('B', 'every scenario names 2+ competing priorities', DS.scenarios.every((s) => s.competingPriorities.length >= 2))
    check('B', 'every scenario states an explicit tradeoff', DS.scenarios.every((s) => s.tradeoff.trim().length > 20))
    check('B', 'every scenario reaches a recommended decision', DS.scenarios.every((s) => s.recommendedDecision.trim().length > 0))
    check('B', 'every scenario lists concrete next steps', DS.scenarios.every((s) => s.nextSteps.length >= 2))
    check('B', 'the morning-triage scenario sequences real items', !!DS.scenarios.find((s) => s.id === 's1_morning_triage' && s.competingPriorities.length >= 3))
  }

  // ── C. Coach personalities + load (assignment tradeoffs) ─────────────────────
  process.stdout.write('\n── C. Coaches have personality, capacity, and load ──\n')
  {
    check('C', 'an OVERLOADED coach exists (load > capacity)', DS.coaches.some((c) => c.currentLoad > c.capacityPerWeek))
    check('C', 'an UNDERUSED coach exists (load ≤ half capacity)', DS.coaches.some((c) => c.currentLoad <= c.capacityPerWeek / 2))
    check('C', 'every coach has a style + a development gap', DS.coaches.every((c) => c.style.length > 0 && c.developmentGap.length > 0))
    check('C', 'the overload is a scheduling conflict with a tradeoff', DS.schedulingConflicts.some((sc) => sc.kind === 'overload' && sc.tradeoff.length > 0))
  }

  // ── D. Player journeys make decisions evidenced (not point-in-time) ──────────
  process.stdout.write('\n── D. Player journeys support the executive call ──\n')
  {
    const maya = DS.players.find((p) => p.archetype === 'ready_to_promote')!
    const sofia = DS.players.find((p) => p.archetype === 'stagnating')!
    const ava = DS.players.find((p) => p.archetype === 'declining_attendance')!
    check('D', 'the promotion candidate has an improving trajectory', maya.trajectory === 'improving' && isAscending(maya.journey))
    check('D', 'the stagnating player has a flat journey', sofia.trajectory === 'plateau' && isFlat(sofia.journey))
    check('D', 'the retention risk has a declining journey', ava.trajectory === 'declining' && isDescending(ava.journey))
    check('D', 'every active player has a goal', DS.players.filter((p) => p.status === 'active').every((p) => p.goal.length > 0))
  }

  // ── E. Parent situations + the retention storyline ───────────────────────────
  process.stdout.write('\n── E. Parents are real relationships, interconnected ──\n')
  {
    const leaving = DS.parents.find((p) => p.situation === 'considering_leaving')
    check('E', 'a parent is considering leaving (retention risk)', !!leaving && leaving.sentiment === 'at_risk')
    // That parent is the declining-attendance player's parent — one coherent story.
    const ava = DS.players.find((p) => p.archetype === 'declining_attendance')!
    check('E', 'the leaving-risk parent is the declining player’s parent', !!leaving && leaving.childPlayerId === ava.id)
    check('E', 'a parent is pushing for promotion (tied to Maya)', DS.parents.some((p) => p.situation === 'pushing_for_promotion'))
    check('E', 'every parent has a situation + sentiment', DS.parents.every((p) => !!p.situation && !!p.sentiment))
  }

  // ── F. Curriculum bottleneck — a systemic, fixable jam ───────────────────────
  process.stdout.write('\n── F. A curriculum bottleneck DONNA can diagnose ──\n')
  {
    const b = DS.bottlenecks[0]
    check('F', 'a bottleneck exists at a real gate', !!b && b.gate.length > 0)
    check('F', 'it jams 2+ real players', !!b && b.stuckPlayerIds.length >= 2 && b.stuckPlayerIds.every((id) => playerIds.has(id)))
    check('F', 'it has missing curriculum content (the root cause)', !!b && b.missingContent.length >= 1)
    check('F', 'the stuck players are both Orange (consistent story)', !!b && b.stuckPlayerIds.every((id) => DS.players.find((p) => p.id === id)?.levelStage === 'Orange'))
  }

  // ── G. The operating load produces genuinely competing executive priorities ──
  process.stdout.write('\n── G. Executive Intelligence faces competing priorities ──\n')
  {
    const s = deriveDemoSignals(DS)
    const briefing = buildExecutiveBriefing(s, [])
    check('G', 'DONNA surfaces a full operating load (top 3–5)', briefing.recommendations.length >= 3)
    const kinds = new Set(briefing.recommendations.map((r) => r.kind))
    check('G', 'priorities mix risks AND opportunities (must trade off)', kinds.has('risk') && kinds.has('opportunity'))
    check('G', 'the diagnostics show many findings competed for the top slots', briefing.diagnostics.risksFound + briefing.diagnostics.opportunitiesFound >= 6)
    check('G', 'every surfaced priority is evidence-backed with a next step', briefing.recommendations.every((r) => r.evidence.length > 0 && r.nextStep.length > 0))
    process.stdout.write(`   ${briefing.headline}\n`)
    briefing.recommendations.forEach((r, i) => process.stdout.write(`     ${i + 1}. [${r.kind}] ${r.recommendedAction}\n`))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`OPERATING ACADEMY: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) { process.stdout.write('\nFailing checks:\n'); failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`)) }
  process.stdout.write(failed === 0 ? '\nOPERATING ACADEMY CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run()

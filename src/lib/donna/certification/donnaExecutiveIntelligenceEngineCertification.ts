// Mega Sprint 4261–4290 — DONNA Executive Intelligence Engine V1
// Certification — DONNA reviews real academy signals, detects evidence-bearing risks
// and opportunities, prioritizes them, and recommends the next action proactively.
// Pure; runs without a key or a database. No invented data (null = unknown → ignored).
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveIntelligenceEngineCertification.ts

import {
  buildSignalMap,
  detectRisks,
  detectOpportunities,
  prioritize,
  priorityScore,
  toRecommendation,
  buildExecutiveBriefing,
  formatBriefingSpoken,
  isProactiveExecutiveQuestion,
  recommendationsToDecisions,
  formatExecutiveIntelligenceDiagnostics,
  type AcademySignalSnapshot,
} from '@/lib/donna/executive/donnaExecutiveIntelligence'
import { createLearningEntry, type LearningEntry } from '@/lib/donna/learning/learningEntryModel'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

// A realistic, fully-known academy snapshot (the kind getDonnaAcademySignalsAction returns).
const SNAPSHOT: AcademySignalSnapshot = {
  onboardingComplete: true,
  curriculumSpineActive: true,
  playersMissingCurriculumLevel: 3,
  placementQueueCount: 2,
  levelUpQueueCount: 4,
  playersNeedingAttention: 5,
  playersWithoutAssessment: 6,
  pendingParentApprovals: 2,
  pendingCoachApprovals: 1,
  activePlayerCount: 24,
  activeCoachCount: 4,
  upcomingSessions: 12,
  unassignedSessions: 3,
}

const LEARNING: LearningEntry[] = [
  createLearningEntry({
    academyId: 'a1', sourceType: 'system_observation', sourceId: 's', role: 'director', conversationId: 's',
    topic: 'curriculum default', topicDomain: 'curriculum', concepts: [], summary: 'Orange 2 uses the development spine as the default',
    evidence: 'e', examplePhrases: [], confidence: 0.8, importance: 0.9, frequency: 1, sourceReliability: 0.8,
    status: 'approved', reviewRequired: false, approvedBy: 'system', approvedAt: new Date('2026-06-25').toISOString(),
    tags: ['curriculum_choice'], academyDnaModelId: null, metadata: {},
  }),
]

function run() {
  process.stdout.write('\nDONNA Executive Intelligence Engine Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Signal map uses real data; no invented data ───────────────────────────
  process.stdout.write('\n── A. Signal map is built from real, known signals only ──\n')
  const map = buildSignalMap(SNAPSHOT, LEARNING)
  {
    check('A', 'all known signals are mapped', map.knownCount === 13)
    check('A', 'multiple domains covered', map.domainsCovered.length >= 6)
    check('A', 'durable learning is counted', map.learningCount === 1)
    // No invented data: an all-unknown snapshot yields an empty map.
    const empty = buildSignalMap({})
    check('A', 'all-unknown snapshot → zero signals (nothing invented)', empty.knownCount === 0)
    // Partial knowledge: only the known signal is mapped, nothing else fabricated.
    const partial = buildSignalMap({ pendingParentApprovals: 2 })
    check('A', 'partial snapshot maps only what is known', partial.knownCount === 1)
  }

  // ── B. Risk detection — every risk carries evidence ──────────────────────────
  process.stdout.write('\n── B. Risks are real and evidence-bearing ──\n')
  const risks = detectRisks(map)
  {
    check('B', 'risks are detected', risks.length >= 3)
    check('B', 'every risk includes at least one evidence item', risks.every(r => r.evidence.length > 0))
    check('B', 'every risk is kind=risk', risks.every(r => r.kind === 'risk'))
    check('B', 'pending approvals risk cites the real counts', risks.some(r => r.category === 'pending_approvals' && r.evidence.some(e => e.detail.includes('2'))))
    // No invented risks: unknown signals produce none.
    check('B', 'unknown signals produce no risks', detectRisks(buildSignalMap({})).length === 0)
  }

  // ── C. Opportunity detection — every opportunity carries evidence ────────────
  process.stdout.write('\n── C. Opportunities are real and evidence-bearing ──\n')
  const opportunities = detectOpportunities(map, LEARNING)
  {
    check('C', 'opportunities are detected', opportunities.length >= 3)
    check('C', 'every opportunity includes evidence', opportunities.every(o => o.evidence.length > 0))
    check('C', 'promotion candidates cite the level-up queue', opportunities.some(o => o.category === 'promotion_candidates' && o.evidence.some(e => e.detail.includes('4'))))
    check('C', 'a durable-learning opportunity is surfaced', opportunities.some(o => o.category === 'curriculum_improvement'))
  }

  // ── D. Prioritization — ranked, top 3–5, no noisy dashboard ──────────────────
  process.stdout.write('\n── D. Priorities are ranked and capped at 3–5 ──\n')
  const top = prioritize([...risks, ...opportunities])
  {
    check('D', 'returns between 3 and 5 priorities', top.length >= 3 && top.length <= 5)
    check('D', 'priorities are sorted by score (desc)', top.every((f, i) => i === 0 || top[i - 1].score >= f.score))
    check('D', 'a higher-urgency risk outscores a low-urgency opportunity', priorityScore(risks.find(r => r.category === 'pending_approvals')!) > priorityScore(opportunities.find(o => o.category === 'curriculum_improvement')!))
    check('D', 'each priority carries a numeric score in 0–1', top.every(f => f.score >= 0 && f.score <= 1))
  }

  // ── E. Executive recommendation — full shape incl. next step ─────────────────
  process.stdout.write('\n── E. Recommendations are complete and executive ──\n')
  {
    const recs = top.map(toRecommendation)
    check('E', 'every recommendation has a situation', recs.every(r => r.situation.length > 0))
    check('E', 'every recommendation lists evidence', recs.every(r => r.evidence.length > 0))
    check('E', 'every recommendation states confidence', recs.every(r => typeof r.confidence === 'number'))
    check('E', 'every recommendation states impact', recs.every(r => ['high', 'medium', 'low'].includes(r.impact)))
    check('E', 'every recommendation has a recommended action', recs.every(r => r.recommendedAction.length > 0))
    check('E', 'every recommendation explains why now', recs.every(r => r.whyNow.length > 0))
    check('E', 'every recommendation has a concrete next step', recs.every(r => r.nextStep.length > 0))
  }

  // ── F. DONNA integration — proactive questions answer from intelligence ──────
  process.stdout.write('\n── F. Proactive question → executive briefing ──\n')
  {
    const QUESTIONS = ['Good morning', 'What should I do today?', 'How is the academy doing?', 'What needs attention?', 'What am I missing?', 'What is highest priority?']
    check('F', 'all six proactive questions are recognized', QUESTIONS.every(q => isProactiveExecutiveQuestion(q)))
    check('F', 'a normal command is not treated as proactive', !isProactiveExecutiveQuestion('Create an Orange 2 template'))
    const briefing = buildExecutiveBriefing(SNAPSHOT, LEARNING)
    check('F', 'briefing has real state', briefing.hasState === true)
    check('F', 'briefing headline counts the priorities', /need|attention/i.test(briefing.headline))
    check('F', 'briefing returns 3–5 recommendations', briefing.recommendations.length >= 3 && briefing.recommendations.length <= 5)
    const spoken = formatBriefingSpoken(briefing)
    check('F', 'spoken briefing leads with the first action + next step', /First:/.test(spoken) && /Next step:/.test(spoken))
    const decisions = recommendationsToDecisions(briefing.recommendations)
    check('F', 'priorities map into packet DecisionRefs (live grounding)', decisions.length === briefing.recommendations.length && decisions.every(d => d.summary.length > 0 && ['high', 'medium', 'low'].includes(d.urgency)))
    process.stdout.write(`   briefing: ${spoken.slice(0, 200)}…\n`)
  }

  // ── G. Developer diagnostics ─────────────────────────────────────────────────
  process.stdout.write('\n── G. Developer diagnostics ──\n')
  {
    const d = buildExecutiveBriefing(SNAPSHOT, LEARNING).diagnostics
    check('G', 'diagnostics expose signals inspected + known', d.signalsInspected > 0 && d.signalsKnown === 13)
    check('G', 'diagnostics expose risks + opportunities found', d.risksFound >= 3 && d.opportunitiesFound >= 3)
    check('G', 'diagnostics expose top priority score + evidence used', d.topPriorityScore > 0 && d.evidenceUsed > 0)
    check('G', 'diagnostics state the recommendation source', d.recommendationSource === 'executive_intelligence')
    check('G', 'diagnostics expose learning used + confidence', d.learningUsed === 1 && d.confidence > 0)
    process.stdout.write(`   ${formatExecutiveIntelligenceDiagnostics(d)}\n`)
  }

  // ── H. Quiet when there is nothing to say (no noise) ─────────────────────────
  process.stdout.write('\n── H. No state → no invented briefing ──\n')
  {
    const briefing = buildExecutiveBriefing({})
    check('H', 'no known signals → hasState false', briefing.hasState === false)
    check('H', 'no known signals → no recommendations', briefing.recommendations.length === 0)
    check('H', 'headline honestly says nothing needs attention', /nothing needs your attention/i.test(briefing.headline))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE INTELLIGENCE ENGINE: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE INTELLIGENCE ENGINE CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run()

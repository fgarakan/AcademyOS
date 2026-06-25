// Mega Sprint 4081–4110 — DONNA Executive Operating Session V1
// Certification — proves DONNA owns the Director's whole workday: she tracks active /
// paused / completed objectives, maintains the operating agenda + timeline, resumes
// after topic switches, surfaces proactively, and never re-asks for context she owns.
//
// Derived, not stored — no new routing, OpenAI, or memory architecture. The session is
// REDUCED from the conversation; this exercises that reduction across the canonical
// 7-step workday and the live operating-turn integration.
//
// Offline + deterministic — no OpenAI key required.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveSessionCertification.ts

import {
  reduceExecutiveSession,
  answerWorkContinuity,
  surfaceProactive,
  buildSessionDiagnostics,
  buildSessionDirective,
  isWorkContinuityQuery,
  detectWorkArea,
  type WorkArea,
} from '@/lib/donna/executive/donnaExecutiveSession'
import type { ConversationTurn } from '@/lib/donna/executive/donnaExecutiveDialogue'
import { buildResolverStateFromLive } from '@/lib/donna/executive/liveResolverAdapter'
import { runExecutiveOperatingTurn } from '@/lib/donna/executive/executiveOperatingLayer'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0, failed = 0
const failures: string[] = []
function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}
const U = (content: string): ConversationTurn => ({ role: 'user', content })
const D = (content: string): ConversationTurn => ({ role: 'donna', content })
const areas = (os: { area: WorkArea }[]) => os.map(o => o.area)

// The canonical 7-step workday: onboarding → curriculum → templates → onboarding →
// resume → complete → "what remains today?".
const DAY: ConversationTurn[] = [
  U("Let's start academy onboarding."),                                          // 1
  D('Good — first set your Academy DNA. I\'d recommend the Master Development Spine.'), // 2
  U("Actually, let's work on the curriculum first."),                            // 3
  D("I'd recommend defining your four levels."),                                 // 4
  U('Now switch to templates.'),                                                 // 5
  D("Let's build the Orange 2 class template."),                                 // 6
  U('Back to onboarding.'),                                                      // 7
  D('Resuming onboarding — your DNA model is set; next create your first group.'), // 8
  U('Onboarding is done.'),                                                      // 9
  U('What remains today?'),                                                      // 10
]

function liveInput(history: ConversationTurn[], message: string, route = '/director/onboarding'): DonnaMessageInput {
  return {
    userMessage: message, role: 'director', route,
    activeGuidedWorkflowId: null, cooState: null, goalMemory: null,
    conversationHistory: history.map(t => ({ role: t.role, content: t.content })),
  }
}
function legacyStub(): DonnaMessageResult {
  return {
    action: 'respond', response: 'ok', spokenResponse: 'ok', intent: null, entity: null, goal: null,
    confidence: 0.5, nextAction: null, followUpQuestion: null, shouldSpeak: true, navigateTo: null,
    startWorkflowId: null, cooControl: null, goalSessionCommand: null, startGoalType: null,
    requiresApproval: false, limitations: null, resolvedEntityV2: null, unifiedAnswer: null,
    disambiguationQuestion: null, updatedNavigatorState: null, strategicContext: null,
    pageIntelligence: null, realitySnapshot: null, debugLog: createDebugLog('x', 'director', '/director'),
  }
}

async function run() {
  process.stdout.write('\nDONNA Executive Operating Session Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Work-area detection across the 8 areas ────────────────────────────────
  process.stdout.write('\n── A. Work-area detection (message + route) ──\n')
  {
    const cases: Array<[WorkArea, string, string | undefined]> = [
      ['onboarding', 'finish the academy setup', undefined],
      ['curriculum', 'open the curriculum', undefined],
      ['templates', 'work on the class template', undefined],
      ['players', 'review the players', undefined],
      ['coaches', 'sort out staffing', undefined],
      ['sessions', "check today's sessions", undefined],
      ['approvals', 'clear the review queue', undefined],
      ['today', "what's the daily brief", undefined],
      ['curriculum', 'whatever', '/director/curriculum'],
      ['approvals', 'whatever', '/director/review'],
    ]
    let all = true
    for (const [area, text, route] of cases) {
      if (detectWorkArea(text, route) !== area) { all = false; failures.push(`[A] "${text}"${route ? ` @${route}` : ''} → ${detectWorkArea(text, route)} (want ${area})`) }
    }
    check('A', 'all 8 work areas detect from message and route', all)
  }

  // ── B. Interruption — switching pauses the active objective (Obj 4) ──────────
  process.stdout.write('\n── B. Intelligent interruption (pause on switch) ──\n')
  {
    const afterSwitch = reduceExecutiveSession(DAY.slice(0, 5)) // through "Now switch to templates."
    check('B', 'onboarding paused after switching away', afterSwitch.todaysObjectives.find(o => o.area === 'onboarding')?.status === 'paused')
    check('B', 'curriculum paused after switching to templates', afterSwitch.todaysObjectives.find(o => o.area === 'curriculum')?.status === 'paused')
    check('B', 'templates is the active objective', afterSwitch.activeObjective?.area === 'templates')
    check('B', 'paused work stores its progress (curriculum decision kept)', (afterSwitch.todaysObjectives.find(o => o.area === 'curriculum')?.decisions.length ?? 0) > 0)
  }

  // ── C. Resume — return to onboarding picks up where it stopped (Obj 4) ────────
  process.stdout.write('\n── C. Resume exactly where work stopped ──\n')
  {
    const afterResume = reduceExecutiveSession(DAY.slice(0, 8)) // through resume + DONNA resume line
    check('C', 'onboarding is active again after "Back to onboarding"', afterResume.activeObjective?.area === 'onboarding')
    check('C', 'templates paused when we returned to onboarding', afterResume.todaysObjectives.find(o => o.area === 'templates')?.status === 'paused')
    check('C', 'onboarding retained its earlier DNA decision (no restart)', (afterResume.todaysObjectives.find(o => o.area === 'onboarding')?.decisions.length ?? 0) > 0)
    const resumed = afterResume.timeline.some(t => t.kind === 'resumed' && t.area === 'onboarding')
    check('C', 'timeline records the resume event', resumed)
  }

  // ── D. Completion + "what remains today" (Obj 1 + 2 + 5) ──────────────────────
  process.stdout.write('\n── D. Completion and remaining-work report ──\n')
  {
    const session = reduceExecutiveSession(DAY)
    check('D', 'onboarding marked completed', session.completedObjectives.some(o => o.area === 'onboarding'))
    check('D', 'no objective is left active after completion + report', session.activeObjective === null)
    check('D', 'remaining work = curriculum + templates', areas(session.unfinishedObjectives).sort().join(',') === 'curriculum,templates')
    check('D', '"What remains today?" is recognized as a continuity query', isWorkContinuityQuery('What remains today?'))
    check('D', 'the query did NOT spin up a "today" objective', !session.todaysObjectives.some(o => o.area === 'today'))
    const ans = answerWorkContinuity(session)
    check('D', 'continuity answer reports done + open + next (no re-ask)', /Academy setup/i.test(ans) && /Curriculum/i.test(ans) && /Templates/i.test(ans))
  }

  // ── E. Operating agenda (Obj 3) ──────────────────────────────────────────────
  process.stdout.write('\n── E. Operating agenda maintained ──\n')
  {
    const mid = reduceExecutiveSession(DAY.slice(0, 6)) // active: templates
    check('E', 'agenda has a current priority', !!mid.agenda.currentPriority)
    check('E', 'agenda has a current task', !!mid.agenda.currentTask)
    check('E', 'agenda has a next action', !!mid.agenda.nextAction)
    check('E', 'agenda future queue holds the paused objectives', mid.agenda.futureQueue.length >= 2)
  }

  // ── F. Session timeline (Obj 7) ──────────────────────────────────────────────
  process.stdout.write('\n── F. Session timeline ──\n')
  {
    const session = reduceExecutiveSession(DAY)
    const kinds = new Set(session.timeline.map(t => t.kind))
    check('F', 'timeline records started events', kinds.has('started'))
    check('F', 'timeline records deferred (paused) events', kinds.has('deferred'))
    check('F', 'timeline records resumed events', kinds.has('resumed'))
    check('F', 'timeline records completed events', kinds.has('completed'))
    check('F', 'timeline ends with a current-state entry', session.timeline[session.timeline.length - 1].kind === 'state')
  }

  // ── G. Proactive guidance — only when appropriate (Obj 6) ─────────────────────
  process.stdout.write('\n── G. Proactive guidance ──\n')
  {
    const active = reduceExecutiveSession(DAY.slice(0, 6)) // templates active
    const idle = reduceExecutiveSession(DAY)               // nothing active
    const signals = { onboardingComplete: false, pendingApprovals: 3, academyRisks: 1, curriculumGaps: 2 }
    const duringWork = surfaceProactive(active, signals)
    check('G', 'does NOT interrupt mid-objective unprompted', duringWork.appropriate === false && duringWork.items.length === 0)
    const whenAsked = surfaceProactive(active, signals, { directorAsked: true })
    check('G', 'surfaces when the Director asks, ranked by priority', whenAsked.items.length >= 3 && whenAsked.items[0].priority >= whenAsked.items[1].priority)
    const whenIdle = surfaceProactive(idle, signals)
    check('G', 'surfaces proactively when no objective is active', whenIdle.appropriate && whenIdle.items.length > 0)
    check('G', 'unfinished onboarding is the top proactive item', whenIdle.items[0].kind === 'onboarding')
  }

  // ── H. Developer diagnostics (Obj 8) ─────────────────────────────────────────
  process.stdout.write('\n── H. Developer diagnostics ──\n')
  {
    const session = reduceExecutiveSession(DAY.slice(0, 7)) // onboarding active, curriculum+templates paused
    const d = buildSessionDiagnostics(session)
    check('H', 'diagnostics expose the active objective', d.activeObjective === 'Academy setup')
    check('H', 'diagnostics expose paused objectives', d.pausedObjectives.length >= 1)
    check('H', 'diagnostics expose the agenda', !!d.agenda && !!d.agenda.nextAction)
    check('H', 'diagnostics expose the timeline', d.timeline.length > 0)
    check('H', 'diagnostics expose next recommendation + confidence', !!d.nextRecommendedAction && typeof d.confidence === 'number')
    const directive = buildSessionDirective(session)
    check('H', 'session directive tells the model to resume, not re-ask', /resume.*never re-ask|do not ask what they were doing/i.test(directive))
  }

  // ── I. Live integration — operating turn exposes the session ──────────────────
  process.stdout.write('\n── I. Operating turn integration (fail-open, no key) ──\n')
  {
    const input = liveInput(DAY.slice(0, 9), DAY[9].content, '/director/onboarding')
    const state = buildResolverStateFromLive(input, 'academy_director', { academyId: 'a1', name: 'Dabul', modelLabel: null }, legacyStub())
    const turn = await runExecutiveOperatingTurn(state)
    check('I', 'operating turn exposes the executive session', !!turn.session)
    check('I', 'session knows onboarding is completed', turn.session.completedObjectives.some(o => o.area === 'onboarding'))
    check('I', 'session reports remaining work (curriculum + templates)', turn.session.unfinishedObjectives.length >= 2)
    check('I', 'session has a next recommended action', !!turn.session.nextRecommendedAction)
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE OPERATING SESSION: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE OPERATING SESSION CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

// Mega Sprint 4111–4140 — DONNA Executive Action Loop V1
// Certification — proves DONNA verifies execution from UI events, not conversation:
// she knows when a recommendation completed / partially completed / failed / cancelled,
// tracks live workflow state, closes the loop, and never asks for confirmation.
//
// Derived, not stored — no new routing, OpenAI, or memory architecture. Exercises the
// pure engine across all 7 workflows plus the live operating-turn integration.
//
// Offline + deterministic — no OpenAI key required.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveActionLoopCertification.ts

import {
  verifyRecommendation,
  reduceWorkflowState,
  closeActionLoop,
  emitExecutionGuidance,
  buildActionLoopDiagnostics,
  buildExecutionDirective,
  WORKFLOWS,
  type UIEvent,
  type Recommendation,
  type WorkArea,
} from '@/lib/donna/executive/donnaExecutiveActionLoop'
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
let SEQ = 0
const ev = (kind: UIEvent['kind'], target?: string, extra: Partial<UIEvent> = {}): UIEvent => ({ kind, target, seq: ++SEQ, ...extra })

function rec(area: WorkArea, label: string, target: string): Recommendation {
  return { id: `${area}_${target}`, area, label, target }
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
  process.stdout.write('\nDONNA Executive Action Loop Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Action verification — the four verdicts (Obj 2) ───────────────────────
  process.stdout.write('\n── A. Action verification from UI events ──\n')
  {
    const r = rec('coaches', 'Assign a coach to Orange 2', 'assign_coach')
    check('A', 'a matching save → completed', verifyRecommendation(r, [ev('save', 'assign_coach')]).status === 'completed')
    check('A', 'a validation error → failed (with reason)', (() => { SEQ = 100; const v = verifyRecommendation(r, [ev('validation_error', 'assign_coach', { detail: "a level wasn't selected" })]); return v.status === 'failed' && /level/.test(v.reason) })())
    check('A', 'a cancel → cancelled', verifyRecommendation(r, [ev('cancel', 'assign_coach')]).status === 'cancelled')
    check('A', 'a click but no save → partial', verifyRecommendation(r, [ev('click', 'assign_coach')]).status === 'partial')
    check('A', 'no related event → pending', verifyRecommendation(r, [ev('save', 'something_else')]).status === 'pending')
    // A retry after a failure resolves to completed (latest event wins).
    SEQ = 200
    const retry = [ev('validation_error', 'assign_coach', { detail: 'no level' }), ev('save', 'assign_coach')]
    check('A', 'a successful retry after a failure → completed', verifyRecommendation(r, retry).status === 'completed')
  }

  // ── B. Live workflow awareness across all 7 workflows (Obj 5) ────────────────
  process.stdout.write('\n── B. Workflow state reduces from events ──\n')
  {
    const AREAS: WorkArea[] = ['onboarding', 'curriculum', 'templates', 'players', 'coaches', 'sessions', 'approvals']
    let allWork = true
    for (const area of AREAS) {
      const def = WORKFLOWS[area]
      // Complete the first step only.
      SEQ = 0
      const first = def.steps[0]
      const ws = reduceWorkflowState(area, [ev('save', first.target)])
      if (!ws.completedSteps.includes(first.id)) { allWork = false; failures.push(`[B] ${area} step 1 not marked complete`) }
      if (def.steps.length > 1 && ws.currentStep?.id !== def.steps[1].id) { allWork = false; failures.push(`[B] ${area} current step wrong`) }
      if (ws.progress <= 0) allWork = false
    }
    check('B', 'all 7 workflows advance their current step from a save event', allWork)

    // Full completion of a workflow.
    SEQ = 0
    const tpl = WORKFLOWS.templates
    const allEvents = tpl.steps.map(s => ev('save', s.target))
    const done = reduceWorkflowState('templates', allEvents)
    check('B', 'a fully-evented workflow has no remaining steps', done.remainingSteps.length === 0 && done.currentStep === null)
    check('B', 'completed workflow reports progress = 1', done.progress === 1)
  }

  // ── C. Blocker detection — failed validation surfaces (Obj 4) ─────────────────
  process.stdout.write('\n── C. Blocker / failed validation ──\n')
  {
    SEQ = 0
    const ws = reduceWorkflowState('coaches', [ev('save', 'coach'), ev('validation_error', 'assign_coach', { detail: 'a level wasn\'t selected' })])
    check('C', 'the invite step completed', ws.completedSteps.includes('invite'))
    check('C', 'the assign step is the blocker', !!ws.blocker && /level/.test(ws.blocker))
    check('C', 'current step is the blocked assign step', ws.currentStep?.id === 'assign')
  }

  // ── D. Closed loop + executive update wording (Obj 3 + 6) ─────────────────────
  process.stdout.write('\n── D. Executive action loop closes ──\n')
  {
    SEQ = 0
    // Onboarding: DNA saved → loop closes on that step, next recommendation appears.
    const r = rec('onboarding', 'select the Academy DNA model', 'dna')
    const loop = closeActionLoop(r, [ev('save', 'dna')])
    check('D', 'verification = completed', loop.verification.status === 'completed')
    check('D', 'loop is closed for the resolved recommendation', loop.loopClosed)
    check('D', 'a next recommendation is generated', !!loop.nextRecommendation && loop.nextRecommendation.target === 'curriculum_level')
    check('D', 'executive update acknowledges + points to next (no confirmation asked)', /next/i.test(loop.executiveUpdate) && !/did you|can you confirm|please confirm/i.test(loop.executiveUpdate))

    // Coach assignment failed → update explains why, no confirmation.
    SEQ = 0
    const rc = rec('coaches', 'Assign the coach to a group', 'assign_coach')
    const failLoop = closeActionLoop(rc, [ev('validation_error', 'assign_coach', { detail: "a level wasn't selected" })])
    check('D', 'failed loop explains the reason ("a level wasn\'t selected")', /level wasn't selected/i.test(failLoop.executiveUpdate))
    check('D', 'failed loop is closed (adapts immediately)', failLoop.loopClosed && failLoop.verification.status === 'failed')

    // Full workflow complete → completion phrase, no next.
    SEQ = 0
    const tpl = WORKFLOWS.templates
    const tplDone = closeActionLoop(rec('templates', tpl.steps[2].label, tpl.steps[2].target), tpl.steps.map(s => ev('save', s.target)))
    check('D', 'completed workflow yields a completion message + no next', /complete/i.test(tplDone.executiveUpdate) && tplDone.nextRecommendation === null)
  }

  // ── E. No duplicate / unnecessary guidance (Obj 6) ────────────────────────────
  process.stdout.write('\n── E. De-duplicated, significant-only guidance ──\n')
  {
    SEQ = 0
    const events = [ev('page_change', 'curriculum'), ev('click', 'save_button'), ev('save', 'curriculum')]
    const first = emitExecutionGuidance(events)
    check('E', 'only the significant (save) event is narrated, not clicks/page changes', first.messages.length === 1 && /curriculum/.test(first.messages[0]))
    const again = emitExecutionGuidance(events, first.acknowledged)
    check('E', 'the same event is never narrated twice', again.messages.length === 0)
    // A new event after acknowledgment is narrated once.
    const more = [...events, ev('approval', 'review_item')]
    const third = emitExecutionGuidance(more, first.acknowledged)
    check('E', 'a new significant event is narrated once', third.messages.length === 1 && /review item/.test(third.messages[0]))
  }

  // ── F. Developer diagnostics (Obj 7) ─────────────────────────────────────────
  process.stdout.write('\n── F. Developer diagnostics ──\n')
  {
    SEQ = 0
    const r = rec('curriculum', 'save the curriculum', 'curriculum')
    const events = [ev('save', 'curriculum_level'), ev('validation_error', 'curriculum', { detail: 'no levels defined' })]
    const d = buildActionLoopDiagnostics('curriculum', events, r)
    check('F', 'diagnostics expose the UI events', d.events.length === 2)
    check('F', 'diagnostics expose workflow + completed/remaining steps', d.workflow === 'Curriculum' && d.completedSteps.length >= 1)
    check('F', 'diagnostics expose verification status', d.verificationStatus === 'failed')
    check('F', 'diagnostics expose failed action + blocker', !!d.failedAction && !!d.blocker)
    check('F', 'diagnostics expose execution confidence', typeof d.executionConfidence === 'number' && d.executionConfidence > 0)
  }

  // ── G. Live integration — operating turn reduces the workflow from events ──────
  process.stdout.write('\n── G. Operating turn integration (fail-open, no key) ──\n')
  {
    SEQ = 0
    const input: DonnaMessageInput = {
      userMessage: 'I just saved the first curriculum level.',
      role: 'director', route: '/director/curriculum',
      activeGuidedWorkflowId: null, cooState: null, goalMemory: null,
      conversationHistory: [
        { role: 'user', content: "Let's work on the curriculum." },
        { role: 'donna', content: "I'd recommend defining your four levels." },
      ],
      uiEvents: [ev('save', 'curriculum_level')],
    }
    const state = buildResolverStateFromLive(input, 'academy_director', { academyId: 'a1', name: 'Dabul', modelLabel: null }, legacyStub())
    const turn = await runExecutiveOperatingTurn(state)
    check('G', 'operating turn reduces workflow state from UI events', !!turn.workflowState)
    check('G', 'workflow knows the levels step completed', turn.workflowState!.completedSteps.includes('levels'))
    check('G', 'workflow points at the next step', !!turn.workflowState!.currentStep && turn.workflowState!.currentStep!.id !== 'levels')
    const directive = buildExecutionDirective('curriculum', input.uiEvents!)
    check('G', 'execution directive tells the model to confirm from events, never ask', /never ask|do not ask the Director to confirm/i.test(directive))
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE ACTION LOOP: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE ACTION LOOP CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

// Mega Sprint 4051–4080 — DONNA Executive Dialogue Engine V1
// Certification — proves DONNA sustains a strategic, multi-turn executive dialogue:
// she tracks the objective and decisions, advances a progressive plan, challenges
// weak ideas respectfully, adapts, and never repeats herself.
//
// Dialogue quality only — no new routing, context, or memory architecture. State is
// DERIVED from the conversation; this exercises that derivation end to end, including
// a 16-turn conversation and the live operating-turn integration.
//
// Offline + deterministic — no OpenAI key required.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveDialogueCertification.ts

import {
  deriveDialogueState,
  detectStrategicTopic,
  assessIdea,
  isRespectfulChallenge,
  isRepetitiveWith,
  buildDialogueDirective,
  nextStage,
  PROGRESSIVE_STAGES,
  type ConversationTurn,
  type PlanningStage,
} from '@/lib/donna/executive/donnaExecutiveDialogue'
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

// A realistic 16-turn "build an academy" strategic dialogue.
const CONVO: ConversationTurn[] = [
  U('I want to build an academy from the ground up.'),
  D("Good — let's agree the objective first. Are we building for competitive juniors or broad participation?"),
  U('Competitive juniors, around 60 players.'),
  D("I'd recommend we lock the constraints next. What's your court capacity and coaching budget?"),
  U('We have 4 courts and budget for 3 coaches.'),
  D('With 4 courts and 3 coaches the binding constraint is court-time. Two options: tiered group sizes, or staggered sessions.'),
  U("What's the tradeoff between them?"),
  D("Tiered groups keep coaching quality high but cap enrollment; staggered sessions raise capacity at the cost of coach fatigue — a real risk over a season. I'd recommend tiered groups for year one."),
  U("Yes, let's do it."),
  D("Great. Next decision is assessment cadence. I'd recommend a 6-week reassessment so progression stays evidence-based."),
  U('Agreed.'),
  U('Let me just hire more coaches and add everything at once.'),
  D("I wouldn't recommend that — adding capacity treats the symptom, not the cause, and raises cost without fixing the court-time bottleneck."),
  D("Let's start execution — I'll set up the tiered groups and the 6-week assessment cadence."),
  U('Perfect.'),
  D("We'll review results after the first 6-week cycle to confirm capacity holds before we scale."),
]

function stageIndex(s: PlanningStage): number { return PROGRESSIVE_STAGES.indexOf(s) }

function liveInput(history: ConversationTurn[], message: string): DonnaMessageInput {
  return {
    userMessage: message, role: 'director', route: '/director',
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
  process.stdout.write('\nDONNA Executive Dialogue Engine Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Multi-turn reasoning — state tracked across 16 turns (Obj 1 + 5) ───────
  process.stdout.write('\n── A. 16-turn dialogue — context maintained ──\n')
  {
    const s = deriveDialogueState(CONVO)
    check('A', 'conversation is 16 turns', CONVO.length === 16)
    check('A', 'active objective captured (build…)', !!s.activeObjective && /build/i.test(s.activeObjective))
    check('A', 'strategic topic = build_academy', s.strategicTopic === 'build_academy')
    check('A', 'decisions made accumulate (≥2: tiered groups + assessment)', s.decisionsMade.length >= 2)
    check('A', 'tradeoffs tracked', s.tradeoffs.length > 0)
    check('A', 'risks tracked', s.risks.length > 0)
    check('A', 'reaches the review stage by the end', s.stage === 'review')
  }

  // ── B. Progressive planning — the plan advances, never restarts (Obj 4) ───────
  process.stdout.write('\n── B. Progressive planning — stages advance monotonically ──\n')
  {
    const prefixes = [4, 6, 9, 12, 16]
    let monotonic = true
    let prev = -1
    const seen: string[] = []
    for (const n of prefixes) {
      const st = deriveDialogueState(CONVO.slice(0, n)).stage
      seen.push(`${n}:${st}`)
      if (stageIndex(st) < prev) monotonic = false
      prev = stageIndex(st)
    }
    process.stdout.write(`   stages: ${seen.join('  ')}\n`)
    check('B', 'planning stage never regresses as the dialogue grows', monotonic)
    check('B', 'early dialogue is at objective/constraints', stageIndex(deriveDialogueState(CONVO.slice(0, 4)).stage) <= stageIndex('options'))
    check('B', 'late dialogue reaches execution or review', stageIndex(deriveDialogueState(CONVO).stage) >= stageIndex('execution'))
    check('B', 'nextStage advances and saturates at review', nextStage('objective') === 'constraints' && nextStage('review') === 'review')
  }

  // ── C. Strategic discussion — all domains recognized (Obj 2) ──────────────────
  process.stdout.write('\n── C. Strategic topics recognized ──\n')
  {
    const cases: Array<[string, string]> = [
      ['build_academy', 'I want to build an academy'],
      ['curriculum', 'We should redesign the curriculum and progression levels'],
      ['retention', 'How do we improve retention and reduce churn?'],
      ['revenue', 'I want to increase revenue and rethink pricing'],
      ['onboarding', 'Our onboarding and intake for new families is slow'],
      ['staffing', 'We need to optimize staffing and coach headcount'],
      ['scheduling', 'Help me improve the scheduling and court time'],
      ['player_development', 'Let us improve player development and the skill path'],
    ]
    let all = true
    for (const [topic, text] of cases) {
      if (detectStrategicTopic(text) !== topic) { all = false; failures.push(`[C] "${text}" → ${detectStrategicTopic(text)} (want ${topic})`) }
    }
    check('C', 'all 8 strategic domains classify correctly', all)
  }

  // ── D. Executive challenge — respectful, explained, not argumentative (Obj 3) ─
  process.stdout.write('\n── D. Executive challenge ──\n')
  {
    const weak = [
      'Let me just hire more coaches and add everything at once.',
      "Let's build everything from scratch with every feature.",
      'We should just spend more on ads and marketing.',
      'While we are at it, also add a full booking system.',
    ]
    let allWeak = true, allRespectful = true
    for (const w of weak) {
      const a = assessIdea(w)
      if (!a.weak || !a.challenge) { allWeak = false; failures.push(`[D] not challenged: ${w}`) }
      if (a.challenge && !isRespectfulChallenge(a.challenge)) { allRespectful = false; failures.push(`[D] not respectful: ${a.challenge}`) }
    }
    check('D', 'weak ideas are challenged', allWeak)
    check('D', 'every challenge explains why and is never argumentative', allRespectful)
    check('D', 'a sound idea is NOT challenged', !assessIdea('Competitive juniors, around 60 players.').weak)
    check('D', 'premature execution (no objective yet) is challenged', assessIdea("Let's just launch now", deriveDialogueState([])).weak)
  }

  // ── E. Adapt + avoid repetition (Obj 5 + 6) ───────────────────────────────────
  process.stdout.write('\n── E. Adaptation + anti-repetition ──\n')
  {
    // The weak turn mid-conversation is challenged, not complied with — recommendation adapts.
    const a = assessIdea(CONVO[11].content, deriveDialogueState(CONVO.slice(0, 11)))
    check('E', 'mid-dialogue weak idea triggers an adapted (challenge) response', a.weak && isRespectfulChallenge(a.challenge ?? ''))
    // Repeating a prior DONNA line is caught.
    const priorLine = CONVO[5].content
    check('E', 'a near-duplicate of a prior DONNA turn is flagged repetitive', isRepetitiveWith(priorLine, CONVO))
    check('E', 'a fresh, advancing line is NOT flagged repetitive', !isRepetitiveWith('Let me confirm the 6-week assessment owner and the first review date.', CONVO))
  }

  // ── F. Dialogue directive feeds the reasoning prompt (Obj 1) ───────────────────
  process.stdout.write('\n── F. Dialogue directive carries state into reasoning ──\n')
  {
    const s = deriveDialogueState(CONVO)
    const directive = buildDialogueDirective(s, assessIdea('let me just hire more coaches', s))
    check('F', 'directive carries the OBJECTIVE', /OBJECTIVE:/.test(directive))
    check('F', 'directive carries the PLANNING_STAGE + next step', /PLANNING_STAGE:/.test(directive) && /next:/.test(directive))
    check('F', 'directive lists what was already DECIDED', /DECIDED:/.test(directive))
    check('F', 'directive instructs not to repeat + to build progressively', /do not (repeat|re-derive)/i.test(directive) && /one step forward/i.test(directive))
    check('F', 'directive carries the respectful challenge when the idea is weak', /challenge it respectfully/i.test(directive))
  }

  // ── G. Live integration — the operating turn exposes dialogue state ───────────
  process.stdout.write('\n── G. Operating turn integration (fail-open, no key) ──\n')
  {
    const history = CONVO.slice(0, 15)
    const input = liveInput(history, CONVO[15].content)
    const state = buildResolverStateFromLive(input, 'academy_director', { academyId: 'a1', name: 'Dabul', modelLabel: null }, legacyStub())
    const turn = await runExecutiveOperatingTurn(state)
    check('G', 'operating turn exposes derived dialogue state', !!turn.dialogueState)
    check('G', 'dialogue state in the turn tracks the build_academy topic', turn.dialogueState.strategicTopic === 'build_academy')
    check('G', 'dialogue state carries forward prior decisions', turn.dialogueState.decisionsMade.length >= 1)
    check('G', 'conversation grounded into the packet (continuity preserved)', turn.contextTrace.conversationGrounded === true)
  }

  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE DIALOGUE ENGINE: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE DIALOGUE ENGINE CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

// Mega Sprint 4201–4230 — DONNA Durable Executive Learning V1
// Certification — DONNA learns from a completed operating session: summary →
// durable learning → approval gate → hygiene (dedupe / expire / contradiction) →
// compressed retrieval that cuts tokens. Reuses the existing Learning Ledger model.
// Pure; runs without a key or a database.
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveLearningCertification.ts

import {
  summarizeOperatingSession,
  extractDurableLearning,
  classifyLearningText,
  requiresLearningApproval,
  toLearningEntries,
  applyLearningHygiene,
  expireStale,
  retrieveRelevantLearning,
  estimateTokenSavings,
  buildCompressedLearningContext,
  learnFromOperatingSession,
  formatExecutiveLearningDiagnostics,
  InMemoryExecutiveLearningStore,
  LEARNING_TTL_DAYS,
  type ExecutiveLearningContext,
} from '@/lib/donna/executive/donnaExecutiveLearning'
import { createLearningEntry, type LearningEntry } from '@/lib/donna/learning/learningEntryModel'
import type { ExecutiveSession } from '@/lib/donna/executive/donnaExecutiveSession'
import type { DialogueState } from '@/lib/donna/executive/donnaExecutiveDialogue'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

const CTX: ExecutiveLearningContext = { academyId: 'acad_1', role: 'director', sessionId: 'sess_1' }
const NOW = new Date('2026-06-25T12:00:00Z').getTime()

// A realistic completed operating session.
function buildSession(): ExecutiveSession {
  return {
    todaysObjectives: [
      { area: 'curriculum', label: 'Activate the Orange 2 curriculum spine', status: 'completed', startedAtTurn: 1, lastTouchedTurn: 4, decisions: ['Standardize Orange 2 on the development spine as the curriculum default'], lastProgress: null },
      { area: 'players', label: 'Assign curriculum levels to new players', status: 'paused', startedAtTurn: 5, lastTouchedTurn: 6, decisions: [], lastProgress: 'Waiting on parent confirmations' },
    ],
    activeObjective: null,
    completedObjectives: [
      { area: 'curriculum', label: 'Activate the Orange 2 curriculum spine', status: 'completed', startedAtTurn: 1, lastTouchedTurn: 4, decisions: [], lastProgress: null },
    ],
    pausedObjectives: [
      { area: 'players', label: 'Assign curriculum levels to new players', status: 'paused', startedAtTurn: 5, lastTouchedTurn: 6, decisions: [], lastProgress: 'Waiting on parent confirmations' },
    ],
    unfinishedObjectives: [
      { area: 'players', label: 'Assign curriculum levels to new players', status: 'paused', startedAtTurn: 5, lastTouchedTurn: 6, decisions: [], lastProgress: 'Waiting on parent confirmations' },
    ],
    pendingApprovals: 2,
    nextRecommendedAction: 'Confirm the new player levels once parents respond',
    agenda: { items: [] } as unknown as ExecutiveSession['agenda'],
    timeline: [{}, {}, {}] as unknown as ExecutiveSession['timeline'],
    confidence: 0.8,
  }
}

function buildDialogue(): DialogueState {
  return {
    turnCount: 6,
    strategicTopic: 'curriculum' as unknown as DialogueState['strategicTopic'],
    activeObjective: 'Activate the Orange 2 curriculum spine',
    decisionsMade: [
      'Standardize Orange 2 on the development spine as the curriculum default',
      'I prefer parent-facing messages to stay warm and brief — that is our communication style',
      'I clear the approvals queue first, then review sessions, then check players',
    ],
    openDecisions: ['Whether to move two borderline players up a level'],
    assumptions: [],
    risks: [],
    tradeoffs: [],
    stage: 'recommend' as unknown as DialogueState['stage'],
  }
}

async function run() {
  process.stdout.write('\nDONNA Durable Executive Learning Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Completed session creates a summary (Obj 1) ───────────────────────────
  process.stdout.write('\n── A. A meaningful session is summarized ──\n')
  const summary = summarizeOperatingSession({ session: buildSession(), dialogue: buildDialogue() })
  {
    check('A', 'session is meaningful', summary.meaningful)
    check('A', 'objectives worked on captured', summary.objectivesWorkedOn.length >= 2)
    check('A', 'decisions made captured', summary.decisionsMade.length >= 2)
    check('A', 'completed actions captured', summary.actionsCompleted.length >= 1)
    check('A', 'paused work captured', summary.pausedWork.length === 1)
    check('A', 'unresolved questions captured', summary.unresolvedQuestions.length >= 1)
    check('A', 'follow-up items captured', summary.followUpItems.length >= 1)
    // An empty session is NOT meaningful — no learning churn.
    const empty = summarizeOperatingSession({
      session: { ...buildSession(), todaysObjectives: [], completedObjectives: [], pausedObjectives: [], unfinishedObjectives: [], timeline: [] } as ExecutiveSession,
      dialogue: { ...buildDialogue(), decisionsMade: [], turnCount: 0 } as DialogueState,
    })
    check('A', 'an empty session is not meaningful', !empty.meaningful)
  }

  // ── B. Useful learning captured, noise ignored (Obj 2) ───────────────────────
  process.stdout.write('\n── B. Useful learning is captured, noise is dropped ──\n')
  const candidates = extractDurableLearning(summary)
  {
    check('B', 'durable learning extracted', candidates.length >= 2)
    check('B', 'a curriculum choice is recognized', candidates.some(c => c.type === 'curriculum_choice'))
    check('B', 'noise classifies as noise', classifyLearningText('ok thanks').noise === true)
    check('B', 'a greeting is noise', classifyLearningText('Good morning').noise === true)
    check('B', 'a real operating decision is not noise', classifyLearningText('Standardize Orange 2 on the development spine').noise === false)
    check('B', 'no extracted candidate is noise', candidates.every(c => !c.noise))
  }

  // ── C. High-impact learning requires approval (Obj 3) ────────────────────────
  process.stdout.write('\n── C. High-impact memory is gated for the Director ──\n')
  {
    const curriculumDefault = classifyLearningText('Standardize Orange 2 as the curriculum default for development')
    check('C', 'a curriculum default is high-impact', curriculumDefault.highImpact === true)
    const philosophy = classifyLearningText('Our coaching philosophy is to always develop technique before tactics')
    check('C', 'coaching philosophy is high-impact', philosophy.highImpact === true)
    const opPattern = classifyLearningText('I usually review the approvals queue first then sessions')
    check('C', 'a routine workflow tendency is low-risk', opPattern.highImpact === false)
    const entries = toLearningEntries(candidates, CTX)
    check('C', 'high-impact entries land in reviewing (await Director)', entries.some(e => e.reviewRequired && e.status === 'reviewing'))
    check('C', 'low-risk entries are auto-approved by system', entries.some(e => !e.reviewRequired && e.status === 'approved' && e.approvedBy === 'system'))
    check('C', 'requiresLearningApproval matches highImpact', candidates.every(c => requiresLearningApproval(c) === c.highImpact))
  }

  // ── D. Hygiene — dedupe + expiry (Obj 5) ─────────────────────────────────────
  process.stdout.write('\n── D. Learning hygiene: dedupe + expire ──\n')
  {
    const a = mkEntry({ id: 'x1', summary: 'Standardize Orange 2 on the development spine', topic: 'curriculum default', status: 'approved' })
    const dup = mkEntry({ id: 'x2', summary: 'Standardize Orange 2 on the development spine', topic: 'curriculum default', status: 'approved' })
    const hy = applyLearningHygiene({ incoming: [dup], existing: [a], now: NOW })
    check('D', 'a duplicate of existing learning is dropped', hy.duplicates.length === 1 && hy.toStore.length === 0)

    // Expiry: an operating_pattern older than its TTL is stale; academy truth never expires.
    const stalePattern = mkEntry({ id: 's1', tags: ['operating_pattern'], createdAt: new Date(NOW - (LEARNING_TTL_DAYS.operating_pattern + 5) * 86400000).toISOString() })
    const freshTruth = mkEntry({ id: 's2', tags: ['curriculum_choice'], createdAt: new Date(NOW - 1000 * 86400000).toISOString() })
    const exp = expireStale([stalePattern, freshTruth], NOW)
    check('D', 'a stale operating pattern expires', exp.expired.includes('s1'))
    check('D', 'high-impact academy truth never expires', exp.active.some(e => e.id === 's2'))
  }

  // ── E. Contradictions flagged; casual comment cannot overwrite truth (Obj 5) ─
  process.stdout.write('\n── E. Contradiction with confirmed truth is flagged ──\n')
  {
    const confirmedTruth = mkEntry({
      id: 't1', status: 'approved', topicDomain: 'player_development', topic: 'Orange 2 readiness',
      concepts: ['readiness_issue'], summary: 'Orange 2 players are ready to advance and improving',
    })
    const casualOpposite = mkEntry({
      id: 't2', status: 'approved', approvedBy: 'system', topicDomain: 'player_development', topic: 'Orange 2 readiness',
      concepts: ['readiness_issue'], summary: 'Orange 2 players are not ready and struggling',
    })
    const hy = applyLearningHygiene({ incoming: [casualOpposite], existing: [confirmedTruth], now: NOW })
    check('E', 'a contradiction with confirmed truth is detected', hy.contradictions.length >= 1)
    check('E', 'the casual auto-entry is downgraded to reviewing (cannot overwrite)', hy.toStore.every(e => e.id !== 't2' || (e.status === 'reviewing' && e.reviewRequired)))
    check('E', 'hygiene flags that review is required', hy.requiresReview === true)
  }

  // ── F. Relevant learning retrieved later + token savings (Obj 4) ─────────────
  process.stdout.write('\n── F. Compressed memory is reused instead of transcript ──\n')
  {
    const store = [
      mkEntry({ id: 'm1', status: 'approved', topic: 'curriculum default', summary: 'Orange 2 uses the development spine as the curriculum default', tags: ['curriculum_choice'] }),
      mkEntry({ id: 'm2', status: 'approved', topic: 'communication style', summary: 'Parent messages stay warm and brief', tags: ['director_preference'] }),
      mkEntry({ id: 'm3', status: 'reviewing', topic: 'unrelated', summary: 'Coach scheduling notes', tags: ['operating_pattern'] }),
    ]
    const retrieved = retrieveRelevantLearning({ request: 'What curriculum default should I use for Orange 2?', store })
    check('F', 'relevant learning is retrieved', retrieved.some(e => e.id === 'm1'))
    check('F', 'unapproved (reviewing) learning is not reused as truth', retrieved.every(e => e.id !== 'm3'))
    check('F', 'compressed context is shorter than a full transcript', buildCompressedLearningContext(retrieved).length < 4000)
    const sav = estimateTokenSavings({ retrieved, fullTranscriptChars: 8000 })
    check('F', 'token savings are positive (compressed beats transcript)', sav.tokensSaved > 0 && sav.pctSaved > 0)
    check('F', 'token savings never go negative', estimateTokenSavings({ retrieved, fullTranscriptChars: 10 }).tokensSaved === 0)
    process.stdout.write(`   token savings: ${sav.tokensSaved} tokens (${sav.pctSaved}% vs transcript)\n`)
  }

  // ── G. End-to-end + diagnostics (Obj 6) + store ──────────────────────────────
  process.stdout.write('\n── G. End-to-end learning + developer diagnostics ──\n')
  {
    const res = learnFromOperatingSession({ session: buildSession(), dialogue: buildDialogue(), ctx: CTX, existing: [], now: NOW })
    check('G', 'a meaningful session yields stored learning', res.hygiene.toStore.length >= 1)
    check('G', 'diagnostics expose captured / skipped / approval / contradictions', typeof res.diagnostics.learningCaptured === 'number' && typeof res.diagnostics.approvalRequired === 'number')
    check('G', 'diagnostics reflect at least one approval-required item', res.diagnostics.approvalRequired >= 1)
    process.stdout.write(`   ${formatExecutiveLearningDiagnostics(res.diagnostics)}\n`)

    const store = new InMemoryExecutiveLearningStore()
    store.save(CTX.academyId, res.hygiene.toStore)
    check('G', 'the store round-trips saved learning', store.load(CTX.academyId).length === res.hygiene.toStore.length)
    check('G', 'a second academy sees no leakage', store.load('other_academy').length === 0)
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`DURABLE EXECUTIVE LEARNING: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nDURABLE EXECUTIVE LEARNING CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

// Minimal LearningEntry factory for the hygiene/retrieval tests.
function mkEntry(over: Partial<LearningEntry> & { id: string }): LearningEntry {
  const base = createLearningEntry({
    academyId: 'acad_1', sourceType: 'system_observation', sourceId: 'sess_1', role: 'director',
    conversationId: 'sess_1', topic: over.topic ?? 'topic', topicDomain: over.topicDomain ?? 'academy_operations',
    concepts: over.concepts ?? [], summary: over.summary ?? 'a learning', evidence: 'e', examplePhrases: [],
    confidence: 0.7, importance: 0.5, frequency: 1, sourceReliability: 0.8,
    status: over.status ?? 'approved', reviewRequired: over.reviewRequired ?? false,
    approvedBy: over.approvedBy ?? 'system', approvedAt: new Date(NOW).toISOString(),
    tags: over.tags ?? ['operating_pattern'], academyDnaModelId: null, metadata: {},
  })
  return { ...base, ...over }
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

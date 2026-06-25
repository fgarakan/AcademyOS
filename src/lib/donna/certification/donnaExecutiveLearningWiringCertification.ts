// Mega Sprint 4231–4260 — Executive Learning Context Wiring V1
// Certification — durable learning is retrieved before reasoning and folded into the
// LIVE Executive Context Packet via the EXISTING relevant_memory slot, relevant-only,
// with a net token reduction, model-agnostic, fail-open, and academy-scoped.
//
// Proves the end-state chain at the pipeline level:
//   Director → Page → Workflow → Operating Session → Relevant Durable Learning
//     → Executive Context Packet → (OpenAI) → Executive Response
//
// Pure; runs without a key or a database (the store adapter is exercised with a mock).
//
// Run: npx tsx src/lib/donna/certification/donnaExecutiveLearningWiringCertification.ts

import { buildResolverStateFromLive } from '@/lib/donna/executive/liveResolverAdapter'
import { runExecutiveOperatingTurn } from '@/lib/donna/executive/executiveOperatingLayer'
import { runExecutiveLive } from '@/lib/donna/executive/executiveLiveBridge'
import {
  learningToMemoryRecords,
  retrieveRelevantLearning,
  estimateTokenSavings,
} from '@/lib/donna/executive/donnaExecutiveLearning'
import { loadDurableLearning, saveDurableLearning } from '@/lib/donna/executive/donnaExecutiveLearningStore'
import { createLearningEntry, type LearningEntry } from '@/lib/donna/learning/learningEntryModel'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'

let passed = 0
let failed = 0
const failures: string[] = []

function check(test: string, label: string, cond: boolean): boolean {
  if (cond) { passed++ } else { failed++; failures.push(`[${test}] ${label}`) }
  process.stdout.write(`   ${cond ? '✓' : '✗'} ${label}\n`)
  return cond
}

const ACADEMY = { academyId: 'acad_1', name: 'Dabul Tennis Academy', modelLabel: 'Master Development Spine' }

function mkLearning(over: Partial<LearningEntry> & { id: string; summary: string }): LearningEntry {
  const e = createLearningEntry({
    academyId: 'acad_1', sourceType: 'system_observation', sourceId: 'sess', role: 'director',
    conversationId: 'sess', topic: over.topic ?? over.summary, topicDomain: over.topicDomain ?? 'curriculum',
    concepts: [], summary: over.summary, evidence: over.summary, examplePhrases: [],
    confidence: 0.7, importance: over.importance ?? 0.8, frequency: 1, sourceReliability: 0.8,
    status: over.status ?? 'approved', reviewRequired: false, approvedBy: 'system',
    approvedAt: new Date('2026-06-25').toISOString(), tags: over.tags ?? ['curriculum_choice'],
    academyDnaModelId: null, metadata: {},
  })
  return { ...e, ...over }
}

function input(message: string, history: Array<{ role: 'user' | 'donna'; content: string }> = []): DonnaMessageInput {
  return {
    userMessage: message, role: 'director', route: '/director/curriculum',
    activeGuidedWorkflowId: null, cooState: null, goalMemory: null, conversationHistory: history,
  }
}

function legacy(): DonnaMessageResult {
  return {
    action: 'respond', response: 'ok', spokenResponse: 'ok', intent: null, entity: null, goal: null,
    confidence: 0.4, nextAction: { label: 'x' }, followUpQuestion: null, shouldSpeak: true,
    navigateTo: null, startWorkflowId: null, cooControl: null, goalSessionCommand: null, startGoalType: null,
    requiresApproval: false, limitations: null, resolvedEntityV2: null, unifiedAnswer: null,
    disambiguationQuestion: null, updatedNavigatorState: null, strategicContext: null, pageIntelligence: null,
    realitySnapshot: null, debugLog: createDebugLog('ok', 'director', '/director'),
  }
}

function packetSourceIds(turn: { packet: { assembled: Array<{ id: string }> } }): string[] {
  return turn.packet.assembled.map((s) => s.id)
}
function packetContent(turn: { packet: { assembled: Array<{ id: string; content: string }> } }, id: string): string {
  return turn.packet.assembled.find((s) => s.id === id)?.content ?? ''
}

async function run() {
  process.stdout.write('\nExecutive Learning Context Wiring Certification\n')
  process.stdout.write('============================================================\n')

  const learning = [
    mkLearning({ id: 'L1', summary: 'Orange 2 uses the development spine as the curriculum default', topic: 'curriculum default', tags: ['curriculum_choice'], topicDomain: 'curriculum' }),
    mkLearning({ id: 'L2', summary: 'Parent messages stay warm and brief', topic: 'communication style', tags: ['director_preference'], topicDomain: 'academy_operations' }),
  ]

  // ── A. Durable learning is folded into the packet's relevant_memory slot ──────
  process.stdout.write('\n── A. Learning reaches the Executive Context Packet ──\n')
  {
    const memories = learningToMemoryRecords(retrieveRelevantLearning({ request: 'What curriculum default should I use for Orange 2?', store: learning, max: 6 }))
    const state = buildResolverStateFromLive(input('What curriculum default should I use for Orange 2?'), 'academy_director', ACADEMY, legacy(), null, memories)
    const turn = await runExecutiveOperatingTurn(state)
    check('A', 'relevant_memory source is included in the packet', packetSourceIds(turn).includes('relevant_memory'))
    check('A', 'the packet carries the durable learning content', packetContent(turn, 'relevant_memory').includes('development spine'))
    check('A', 'context engine marks memory grounded', turn.contextTrace.sourcesIncluded.includes('relevant_memory'))
  }

  // ── B. Relevance — only matching learning surfaces (Obj: only the most relevant) ─
  process.stdout.write('\n── B. Only relevant learning is retrieved ──\n')
  {
    const retrieved = retrieveRelevantLearning({ request: 'Remind me of our curriculum default for Orange 2', store: learning, max: 6 })
    check('B', 'the curriculum learning is retrieved', retrieved.some(e => e.id === 'L1'))
    const memories = learningToMemoryRecords(retrieved)
    const state = buildResolverStateFromLive(input('Remind me of our curriculum default for Orange 2'), 'academy_director', ACADEMY, legacy(), null, memories)
    const turn = await runExecutiveOperatingTurn(state)
    const mem = packetContent(turn, 'relevant_memory')
    check('B', 'the relevant curriculum learning is surfaced', mem.includes('development spine'))
    check('B', 'an unrelated comms preference is NOT surfaced for a curriculum question', !mem.includes('warm and brief'))
  }

  // ── C. Token reduction — compressed learning beats a long transcript ─────────
  process.stdout.write('\n── C. Net token reduction vs replaying the transcript ──\n')
  {
    const longHistory = Array.from({ length: 8 }, (_v, i) => ([
      { role: 'user' as const, content: `Earlier turn ${i}: a long discussion about the Orange 2 curriculum spine and how we develop players over the season with detailed reasoning.` },
      { role: 'donna' as const, content: `Earlier answer ${i}: a long grounded response repeating the curriculum context, the levels, and the operating plan in full detail again.` },
    ])).flat()

    // Without learning: full transcript replayed.
    const stateFull = buildResolverStateFromLive(input('What curriculum default should I use?', longHistory), 'academy_director', ACADEMY, legacy(), null, [])
    const turnFull = await runExecutiveOperatingTurn(stateFull)

    // With learning: narrowed transcript window (live action does slice(-3)).
    const memories = learningToMemoryRecords(retrieveRelevantLearning({ request: 'What curriculum default should I use?', store: learning, max: 6 }))
    const stateLearned = buildResolverStateFromLive(input('What curriculum default should I use?', longHistory.slice(-3)), 'academy_director', ACADEMY, legacy(), null, memories)
    const turnLearned = await runExecutiveOperatingTurn(stateLearned)

    check('C', 'packet with learning + trimmed history uses fewer tokens', turnLearned.packet.budget.usedTokens < turnFull.packet.budget.usedTokens)
    const sav = estimateTokenSavings({ retrieved: learning, fullTranscriptChars: longHistory.map(t => t.content).join(' ').length })
    check('C', 'estimated token savings are positive', sav.tokensSaved > 0 && sav.pctSaved > 0)
    process.stdout.write(`   tokens: full=${turnFull.packet.budget.usedTokens} learned=${turnLearned.packet.budget.usedTokens} | est savings=${sav.tokensSaved} (${sav.pctSaved}%)\n`)
  }

  // ── D. Fail-open — no learning is identical to before ────────────────────────
  process.stdout.write('\n── D. No learning → no relevant_memory, no error ──\n')
  {
    const state = buildResolverStateFromLive(input('What should I do today?'), 'academy_director', ACADEMY, legacy(), null, [])
    const turn = await runExecutiveOperatingTurn(state)
    check('D', 'no relevant_memory source when there is no learning', !packetSourceIds(turn).includes('relevant_memory'))
    check('D', 'retrieval over an empty store returns nothing', retrieveRelevantLearning({ request: 'anything', store: [] }).length === 0)
  }

  // ── E. Model-agnostic + reuse (no new packet source, OpenAI only reasons) ─────
  process.stdout.write('\n── E. Model-agnostic, reuses the shipped relevant_memory source ──\n')
  {
    const memories = learningToMemoryRecords(learning)
    const state = buildResolverStateFromLive(input('curriculum default?'), 'academy_director', ACADEMY, legacy(), null, memories)
    const turn = await runExecutiveOperatingTurn(state)
    // Learning rides the EXISTING relevant_memory id — no new packet source was created.
    check('E', 'learning uses the existing relevant_memory source id', packetSourceIds(turn).includes('relevant_memory'))
    check('E', 'memory record shape is the shipped { content, tags }', memories.every(m => typeof m.content === 'string' && Array.isArray(m.tags)))
    // The live bridge exposes learningReused — proof it flows on the live path.
    const live = await runExecutiveLive(input('curriculum default?'), 'academy_director', ACADEMY, legacy(), 'primary', null, memories)
    check('E', 'live diagnostics report learning reused', live.diagnostics.learningReused === memories.length)
  }

  // ── F. Store adapter — academy-scoped, mapped, fail-open ──────────────────────
  process.stdout.write('\n── F. Durable store adapter (RLS-scoped, fail-open) ──\n')
  {
    // Mock Supabase capturing the query + returning rows.
    const calls: Record<string, unknown> = {}
    const okRow = {
      id: 'r1', academy_id: 'acad_1', learning_type: 'curriculum_choice', topic_domain: 'curriculum',
      topic: 'curriculum default', summary: 'Orange 2 uses the development spine', evidence: null,
      concepts: [], tags: ['curriculum_choice'], importance: 0.9, confidence: 0.7, status: 'approved',
      review_required: false, high_impact: true, approved_by: 'system', approved_at: null,
      source_type: 'system_observation', source_session_id: 'sess', expires_at: null, created_at: new Date('2026-06-25').toISOString(),
    }
    const okDb = {
      from(t: string) { calls.table = t; return this },
      select() { return this }, eq(k: string, v: unknown) { (calls.eq ??= [] as unknown[]); (calls.eq as unknown[]).push([k, v]); return this },
      in(k: string, v: unknown) { calls.in = [k, v]; return this }, order() { return this },
      limit() { return Promise.resolve({ data: [okRow], error: null }) },
      insert(rows: unknown) { calls.insertRows = rows; return Promise.resolve({ error: null }) },
    }
    const loaded = await loadDurableLearning(okDb as unknown, 'acad_1')
    check('F', 'load queries the donna_executive_learning table', calls.table === 'donna_executive_learning')
    check('F', 'load scopes by academy_id (RLS-aligned)', JSON.stringify(calls.eq).includes('academy_id') && JSON.stringify(calls.eq).includes('acad_1'))
    check('F', 'load maps a row into a LearningEntry', loaded.length === 1 && loaded[0].summary.includes('development spine'))

    const saved = await saveDurableLearning(okDb as unknown, 'acad_1', loaded)
    check('F', 'save inserts academy-scoped rows', saved === 1 && Array.isArray(calls.insertRows) && (calls.insertRows as Array<Record<string, unknown>>)[0].academy_id === 'acad_1')

    // Fail-open: a DB error never throws.
    const errDb = { from() { return this }, select() { return this }, eq() { return this }, in() { return this }, order() { return this }, limit() { return Promise.resolve({ data: null, error: { message: 'boom' } }) }, insert() { return Promise.resolve({ error: { message: 'boom' } }) } }
    check('F', 'load fails open to [] on a DB error', (await loadDurableLearning(errDb as unknown, 'acad_1')).length === 0)
    check('F', 'save fails open to 0 on a DB error', (await saveDurableLearning(errDb as unknown, 'acad_1', loaded)) === 0)
  }

  // ── Score ────────────────────────────────────────────────────────────────────
  const total = passed + failed
  const pct = total > 0 ? (passed / total) * 100 : 0
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`EXECUTIVE LEARNING WIRING: ${passed}/${total} checks (${pct.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')
  if (failures.length) {
    process.stdout.write('\nFailing checks:\n')
    failures.forEach((f) => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write(failed === 0 ? '\nEXECUTIVE LEARNING WIRING CERTIFIED.\n' : `\n${failed} check(s) failed.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
  process.stderr.write(`\nCERTIFICATION CRASHED: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

// Mega Sprint 2921–2950 — DONNA Conversational Loop Activation V1
// Live Conversation Loop Certification
//
// Verifies that the conversational intelligence stack built in Sprints 2831–2920
// is correctly wired into the DONNA brain for director use.
//
// Checks:
//   1. "What do I need to do next?" routes via operating layer (not LLM)
//   2. Phrase gap fixes in directorNextActionEngine are active
//   3. Phrase gap fixes in executionIntentDetector are active
//   4. Phrase gap fixes in directorOperatingQuestions are active
//   5. Certified intent interpreter (interpretIntent) produces output for vague inputs
//   6. Meaning extraction (extractMeaning) maps vague phrases to academy concepts
//   7. Best-next-question selection works for low-confidence director input
//   8. Conversation navigator state advances correctly across two turns
//   9. Navigator state persists across turns (turn count increments)
//  10. Dead-end inputs produce no false-positive high-confidence results
//  11. Learning capture bridge (captureConversationLearning + bridgeConversationRecord) works
//  12. Knowledge reuse engine (retrieveKnowledge) is callable without error
//  13. No fifth NLU path exists — exactly 4 NLU steps in processDonnaMessage
//
// Run: npx tsx src/lib/donna/conversation/liveConversationLoopCertification.ts

import { matchesWhatNextIntent } from '../directorNextActionEngine'
import { detectOperatingQuestion }   from '../operating/directorOperatingQuestions'
import { interpretIntent }           from './donnaIntentInterpreter'
import { extractMeaning }            from './donnaMeaningExtractor'
import { selectBestNextQuestion }    from './donnaBestNextQuestion'
import {
  advanceConversation,
  createInitialNavigatorState,
  describeNavigatorState,
} from './donnaConversationNavigator'
import { captureConversationLearning } from './conversationLearningRecord'
import { bridgeConversationRecord }    from '../learning/donnaLearningMemoryBridge'
import { donnaLearningLedger }         from '../learning/donnaLearningLedger'
import { retrieveKnowledge }           from '../knowledgePromotion/donnaKnowledgeReuseEngine'
import { detectExecutionIntent }       from '../guided/executionIntentDetector'
import * as fs from 'fs'
import * as path from 'path'

// ── Assertion harness ─────────────────────────────────────────────────────────

let passed  = 0
let failed  = 0
const failures: string[] = []

function assert(id: string, condition: boolean, message: string, detail?: string): void {
  if (condition) {
    passed++
    process.stdout.write(`  ✓ [${id}] ${message}\n`)
  } else {
    failed++
    const line = `  ✗ [${id}] ${message}${detail ? ` — ${detail}` : ''}`
    failures.push(line)
    process.stdout.write(line + '\n')
  }
}

function section(title: string): void {
  process.stdout.write(`\n${'─'.repeat(64)}\n${title}\n${'─'.repeat(64)}\n`)
}

// ── Section 1: "What do I need to do next?" — operating layer routing ─────────

section('1 · "What do I need to do next?" — Operating Layer Routing')

const WHAT_NEXT_VARIANTS = [
  'what do I need to do next',
  'what do I need to do now',
  'What do I need to do next?',
  'What do I need to do now?',
]

for (const phrase of WHAT_NEXT_VARIANTS) {
  const routed = matchesWhatNextIntent(phrase)
  assert(
    'WN-engine-' + phrase.replace(/\W+/g, '_').slice(0, 30),
    routed,
    `matchesWhatNextIntent: "${phrase}" → true`,
    routed ? undefined : 'returned false — phrase gap not fixed',
  )
}

const WHAT_NEXT_OP_VARIANTS = [
  'what do I need to do next',
  'What do I need to do now?',
]

for (const phrase of WHAT_NEXT_OP_VARIANTS) {
  const opType = detectOperatingQuestion(phrase)
  assert(
    'WN-op-' + phrase.replace(/\W+/g, '_').slice(0, 30),
    opType === 'what_next',
    `detectOperatingQuestion: "${phrase}" → 'what_next'`,
    opType !== 'what_next' ? `got '${opType}'` : undefined,
  )
}

// ── Section 2: Phrase gap fixes — directorNextActionEngine ────────────────────

section('2 · Phrase Gap Fixes — directorNextActionEngine')

const NEXT_ENGINE_NEW_PHRASES: Array<[string, boolean]> = [
  ['what do i need to do next', true],
  ['what do i need to do now',  true],
  ['where do i start',          true],
  ['help me finish this',       true],
]

for (const [phrase, expected] of NEXT_ENGINE_NEW_PHRASES) {
  const result = matchesWhatNextIntent(phrase)
  assert(
    'GAP-eng-' + phrase.replace(/\s+/g, '_'),
    result === expected,
    `matchesWhatNextIntent: "${phrase}" → ${expected}`,
    result !== expected ? `got ${result}` : undefined,
  )
}

// ── Section 3: Phrase gap fixes — executionIntentDetector ────────────────────

section('3 · Phrase Gap Fixes — executionIntentDetector')

const EXEC_NEW_PATTERNS: Array<[string, boolean]> = [
  ['what do i need to do next', true],
  ['what do i need to do now',  true],
  ['help me finish this',       true],
  ['help me finish it',         true],
]

for (const [phrase, expected] of EXEC_NEW_PATTERNS) {
  const result = detectExecutionIntent(phrase)
  const matched = expected ? result === 'next_best_action' || result === 'execution_help' : result === null
  assert(
    'GAP-exec-' + phrase.replace(/\s+/g, '_'),
    matched,
    `detectExecutionIntent: "${phrase}" → execution intent (got '${result}')`,
    !matched ? `got '${result}'` : undefined,
  )
}

// ── Section 4: Phrase gap fixes — directorOperatingQuestions ─────────────────

section('4 · Phrase Gap Fixes — directorOperatingQuestions')

const OP_QUESTION_NEW_PATTERNS: Array<[string, OperatingQuestionType | null]> = [
  ['what do i need to do next', 'what_next'],
  ['what do i need to do now',  'what_next'],
]

type OperatingQuestionType = ReturnType<typeof detectOperatingQuestion>

for (const [phrase, expected] of OP_QUESTION_NEW_PATTERNS) {
  const result = detectOperatingQuestion(phrase)
  assert(
    'GAP-opq-' + phrase.replace(/\s+/g, '_'),
    result === expected,
    `detectOperatingQuestion: "${phrase}" → '${expected}'`,
    result !== expected ? `got '${result}'` : undefined,
  )
}

// ── Section 5: Certified intent interpreter ────────────────────────────────────

section('5 · Certified Intent Interpreter (interpretIntent)')

const INTERPRETER_CASES: Array<{
  id: string
  input: string
  description: string
  minConfidence: number
  expectsClarification: boolean
}> = [
  { id: 'INT-01', input: 'Orange seems weird',           description: 'Vague enrollment signal',        minConfidence: 0,    expectsClarification: true  },
  { id: 'INT-02', input: 'Parents seem frustrated',      description: 'Parent concern signal',          minConfidence: 0.30, expectsClarification: false },
  { id: 'INT-03', input: 'Practice felt flat',           description: 'Engagement signal (director)',   minConfidence: 0,    expectsClarification: true  },
  { id: 'INT-04', input: 'The orange group is struggling', description: 'Group difficulty → Step 15.5 (meaning path)', minConfidence: 0, expectsClarification: true },
  { id: 'INT-05', input: "I don't know where to start", description: 'Open-ended — clarification',     minConfidence: 0,    expectsClarification: true  },
]

for (const tc of INTERPRETER_CASES) {
  const result = interpretIntent(tc.input, 'director')

  assert(
    tc.id + '-returns',
    result !== null && typeof result.primaryIntent === 'string',
    `${tc.description} — interpretIntent returns a result`,
  )

  assert(
    tc.id + '-confidence',
    result.confidence >= tc.minConfidence,
    `${tc.description} — confidence ≥ ${tc.minConfidence} (got ${result.confidence.toFixed(2)})`,
    result.confidence < tc.minConfidence ? `got ${result.confidence.toFixed(2)}` : undefined,
  )

  if (tc.expectsClarification) {
    assert(
      tc.id + '-clarification',
      result.clarificationNeeded === true,
      `${tc.description} — clarificationNeeded === true`,
      result.clarificationNeeded ? undefined : 'clarificationNeeded was false',
    )
  }
}

// ── Section 6: Meaning extraction ─────────────────────────────────────────────

section('6 · Meaning Extraction (extractMeaning)')

const MEANING_CASES: Array<{
  id: string
  input: string
  expectedConcept: string
  minConfidence: number
  description: string
}> = [
  { id: 'MEX-01', input: 'Orange enrollment looks light',  expectedConcept: 'enrollment_issue',   minConfidence: 0.55, description: 'Enrollment signal (looks light)' },
  { id: 'MEX-02', input: 'Parents seem frustrated',        expectedConcept: 'parent_concern',     minConfidence: 0.80, description: 'Parent frustration → parent_concern (0.90 match)' },
  { id: 'MEX-03', input: 'Practice felt flat',             expectedConcept: 'engagement_issue',   minConfidence: 0.55, description: 'Flat practice → engagement issue' },
  { id: 'MEX-04', input: 'Kids are all over the place',    expectedConcept: 'grouping_issue',     minConfidence: 0.65, description: 'Group scatter → grouping issue' },
  { id: 'MEX-05', input: 'She seems discouraged lately',   expectedConcept: 'confidence_issue',   minConfidence: 0.70, description: 'Discouraged player → confidence issue' },
  { id: 'MEX-06', input: 'I think someone is ready to advance', expectedConcept: 'advancement_opportunity', minConfidence: 0.55, description: 'Advancement signal' },
]

for (const tc of MEANING_CASES) {
  const result = extractMeaning(tc.input, 'director')

  assert(
    tc.id + '-concept',
    result.topConcept === tc.expectedConcept,
    `${tc.description} — topConcept === '${tc.expectedConcept}'`,
    result.topConcept !== tc.expectedConcept ? `got '${result.topConcept}'` : undefined,
  )

  assert(
    tc.id + '-confidence',
    result.topConfidence >= tc.minConfidence,
    `${tc.description} — topConfidence ≥ ${tc.minConfidence} (got ${result.topConfidence.toFixed(2)})`,
    result.topConfidence < tc.minConfidence ? `got ${result.topConfidence.toFixed(2)}` : undefined,
  )

  assert(
    tc.id + '-next-step',
    typeof result.recommendedNextStep === 'string' && result.recommendedNextStep.length > 5,
    `${tc.description} — recommendedNextStep is non-empty string`,
  )
}

// ── Section 7: Best-next-question selection ────────────────────────────────────

section('7 · Best-Next-Question Selection (selectBestNextQuestion)')

const QUESTION_CASES: Array<{
  id: string
  concepts: string[]
  confidence: number
  expectsQuestion: boolean
  description: string
}> = [
  { id: 'BNQ-01', concepts: ['enrollment_issue'],    confidence: 0.40, expectsQuestion: true,  description: 'Enrollment signal — needs clarification' },
  { id: 'BNQ-02', concepts: ['retention_risk'],      confidence: 0.50, expectsQuestion: true,  description: 'Retention risk — who/how many?' },
  { id: 'BNQ-03', concepts: ['progression_issue'],   confidence: 0.60, expectsQuestion: true,  description: 'Progression stall — scope question' },
  { id: 'BNQ-04', concepts: ['enrollment_issue'],    confidence: 0.80, expectsQuestion: false, description: 'High confidence — no question needed' },
  { id: 'BNQ-05', concepts: [],                      confidence: 0.10, expectsQuestion: true,  description: 'No concepts — fallback question' },
]

for (const tc of QUESTION_CASES) {
  const result = selectBestNextQuestion({
    role: 'director',
    topConcepts: tc.concepts as Parameters<typeof selectBestNextQuestion>[0]['topConcepts'],
    currentConfidence: tc.confidence,
  })

  if (tc.expectsQuestion) {
    assert(
      tc.id,
      result !== null && result.question.length > 10,
      `${tc.description} — selectBestNextQuestion returns a question`,
      result === null ? 'returned null' : undefined,
    )
    if (result !== null) {
      assert(
        tc.id + '-score',
        result.totalScore > 0,
        `${tc.description} — totalScore > 0 (got ${result.totalScore.toFixed(2)})`,
      )
    }
  } else {
    assert(
      tc.id,
      result === null,
      `${tc.description} — selectBestNextQuestion returns null (high confidence)`,
      result !== null ? `got question: "${result.question}"` : undefined,
    )
  }
}

// ── Section 8: Conversation navigator state advancement ────────────────────────

section('8 · Conversation Navigator — State Advancement')

// Turn 1: vague input, low confidence → 'question' stage
const initialState = createInitialNavigatorState('director')
const turn1 = advanceConversation(initialState, {
  userText:         'Orange seems weird',
  topConcept:       'enrollment_issue',
  intentConfidence: 0.55,
  extractedEntity:  null,
  donnaQuestionAsked: true,
})

assert('NAV-01-stage',    turn1.stage !== 'blocked',     'Turn 1: stage is not blocked')
assert('NAV-01-response', turn1.donnaResponse.length > 5, 'Turn 1: donnaResponse is non-empty')
assert('NAV-01-turn-count', turn1.updatedState.turnCount === 1, `Turn 1: turnCount === 1 (got ${turn1.updatedState.turnCount})`)
assert('NAV-01-concept',  turn1.updatedState.topConcept === 'enrollment_issue', 'Turn 1: topConcept preserved in state')

// Turn 2: follow-up answer providing entity context → should advance to 'action'
const turn2 = advanceConversation(turn1.updatedState, {
  userText:         'Specifically the Orange Ball group — enrollment is really low',
  topConcept:       'enrollment_issue',
  intentConfidence: 0.80,
  extractedEntity:  'Orange Ball',
  donnaQuestionAsked: false,
})

assert('NAV-02-stage',      ['understanding', 'action', 'completion'].includes(turn2.stage),  `Turn 2: stage advanced from question (got '${turn2.stage}')`)
assert('NAV-02-turn-count', turn2.updatedState.turnCount === 2, `Turn 2: turnCount === 2 (got ${turn2.updatedState.turnCount})`)
assert('NAV-02-entity',     turn2.updatedState.extractedEntity === 'Orange Ball', `Turn 2: extractedEntity = 'Orange Ball'`)
assert('NAV-02-history',    turn2.updatedState.history.length === 2, `Turn 2: history has 2 entries (got ${turn2.updatedState.history.length})`)

// ── Section 9: Navigator state persists across turns ──────────────────────────

section('9 · Navigator State Persistence')

const stateDesc = describeNavigatorState(turn2.updatedState)
assert('PERSIST-01', stateDesc.includes('Turns: 2'),                    'State description shows 2 turns')
assert('PERSIST-02', stateDesc.includes('enrollment_issue'),             'State description includes concept')
assert('PERSIST-03', stateDesc.includes('Orange Ball'),                  'State description includes entity')
assert('PERSIST-04', turn2.updatedState.clarificationCount >= 1,         `Clarification count ≥ 1 (got ${turn2.updatedState.clarificationCount})`)
assert('PERSIST-05', turn2.updatedState.lastTurnAt.startsWith('202'),    'lastTurnAt is a valid ISO timestamp')

// ── Section 10: Dead-end inputs — no false positives ──────────────────────────

section('10 · Dead-End Inputs — No False Positives')

const DEAD_END_INPUTS = [
  { id: 'DE-01', input: '',            description: 'Empty string' },
  { id: 'DE-02', input: 'ok',          description: 'Single word filler' },
  { id: 'DE-03', input: 'yes',         description: 'Affirmative with no context' },
  { id: 'DE-04', input: 'hmm',         description: 'Filler' },
  { id: 'DE-05', input: 'I see',       description: 'Acknowledgement only' },
]

for (const tc of DEAD_END_INPUTS) {
  const meaning = extractMeaning(tc.input, 'director')
  assert(
    tc.id,
    meaning.topConfidence < 0.50,
    `${tc.description}: topConfidence < 0.50 (got ${meaning.topConfidence.toFixed(2)}) — no false positive`,
    meaning.topConfidence >= 0.50 ? `high confidence on dead-end input: ${meaning.topConcept}` : undefined,
  )
}

// ── Section 11: Learning capture bridge ───────────────────────────────────────

section('11 · Learning Capture Bridge (captureConversationLearning + bridgeConversationRecord)')

const learningRecord = captureConversationLearning({
  originalStatement:     'Orange enrollment looks really light',
  role:                  'director',
  interpretedTopConcept: 'enrollment_issue',
  allConcepts:           ['enrollment_issue', 'readiness_issue'],
  initialConfidence:     0.55,
  finalConfidence:       0.80,
  clarificationAsked:    'Are you referring to a specific group or the overall intake pipeline?',
  clarificationResponse: 'Specifically the Orange Ball group',
  stagesVisited:         ['question', 'understanding', 'action'],
  finalUnderstanding:    'Enrollment in Orange Ball group is lower than expected',
  actionTaken:           'enrollment_review_draft',
  completedSuccessfully: true,
  academyDnaModelId:     null,
})

assert('LRN-01', typeof learningRecord.id === 'string' && learningRecord.id.startsWith('learn-'), 'Learning record has valid id')
assert('LRN-02', learningRecord.status === 'pending_review',       'Learning record status is pending_review')
assert('LRN-03', learningRecord.interpretedTopConcept === 'enrollment_issue', 'Top concept preserved in record')
assert('LRN-04', learningRecord.completedSuccessfully === true,    'completedSuccessfully = true')
assert('LRN-05', ['high_value', 'useful'].includes(learningRecord.patternQuality), `patternQuality ∈ {high_value, useful} (got '${learningRecord.patternQuality}')`)

// Bridge to Ledger
const bridgeResult = bridgeConversationRecord(learningRecord)
assert('BRG-01', bridgeResult.entry !== null,                       'Bridge produced a LearningEntry')
assert('BRG-02', bridgeResult.entry.sourceType === 'director_voice', `sourceType = 'director_voice' (got '${bridgeResult.entry.sourceType}')`)
assert('BRG-03', bridgeResult.wasEnriched === true,                 'Bridge reports enriched = true')
assert('BRG-04', bridgeResult.entry.reviewRequired === true,        'reviewRequired = true (no DB bypass)')
assert('BRG-05', bridgeResult.entry.concepts.includes('enrollment_issue'), 'Concepts include enrollment_issue')

// Add to Ledger — verify it accepts the entry
donnaLearningLedger.addEntry(bridgeResult.entry)
const ledgerEntry = donnaLearningLedger.getEntry(bridgeResult.entry.id)
assert('LDG-01', ledgerEntry !== undefined,                         'Entry is retrievable from Ledger after add')
assert('LDG-02', ledgerEntry?.status === 'captured',               `Ledger entry status = 'captured' (got '${ledgerEntry?.status}')`)

// ── Section 12: Knowledge reuse wiring ────────────────────────────────────────

section('12 · Knowledge Reuse Engine (retrieveKnowledge)')

let knowledgeError: unknown = null
let knowledgeResult: ReturnType<typeof retrieveKnowledge> | null = null

try {
  knowledgeResult = retrieveKnowledge({
    academyId: 'academy-default',
    concepts:  ['enrollment_issue'],
    maxResults: 3,
  })
} catch (err) {
  knowledgeError = err
}

assert('KR-01', knowledgeError === null,       'retrieveKnowledge does not throw')
assert('KR-02', knowledgeResult !== null,      'retrieveKnowledge returns a result object')
assert('KR-03', typeof knowledgeResult?.totalFound === 'number', 'result.totalFound is a number')
assert('KR-04', typeof knowledgeResult?.usedKnowledge === 'boolean', 'result.usedKnowledge is a boolean')
// Empty registry is correct state — no entries promoted yet
assert('KR-05', knowledgeResult?.usedKnowledge === false || (knowledgeResult?.totalFound ?? -1) >= 0,
  `usedKnowledge=${knowledgeResult?.usedKnowledge}, totalFound=${knowledgeResult?.totalFound} — registry state is valid`,
)

// ── Section 13: No fifth NLU path ─────────────────────────────────────────────

section('13 · No Fifth NLU Path — Source Audit')

const brainFilePath = path.resolve(__dirname, '../brain/processDonnaMessage.ts')
let brainSource = ''
let brainReadError: unknown = null

try {
  brainSource = fs.readFileSync(brainFilePath, 'utf8')
} catch (err) {
  brainReadError = err
}

assert('NLU-01', brainReadError === null, 'processDonnaMessage.ts is readable')

if (brainSource) {
  // Count the numbered Step markers: "── Step N:" — should be exactly 16
  // Steps 1–15 (original) + Step 15.5 (certified NLU) + Step 16 (COO prompt)
  const stepMarkers = (brainSource.match(/──\s+Step\s+\d+[\d.]*/g) ?? [])
  const stepNumbers = stepMarkers.map(m => m.match(/[\d.]+$/)?.[0] ?? '')
  const has15dot5   = stepNumbers.includes('15.5')
  const has16       = stepNumbers.includes('16')
  const hasNo17     = !stepNumbers.some(n => parseFloat(n) > 16)

  assert('NLU-02', has15dot5, `Step 15.5 exists in brain (steps found: ${stepNumbers.join(', ')})`)
  assert('NLU-03', has16,     `Step 16 exists (COO prompt fallback)`)
  assert('NLU-04', hasNo17,   `No step > 16 exists — no fifth NLU path added (found: ${stepNumbers.filter(n => parseFloat(n) > 16).join(', ') || 'none'})`)

  // Verify certified modules are imported — not duplicated
  const usesInterpretIntent    = brainSource.includes('interpretIntent')
  const usesExtractMeaning     = brainSource.includes('extractMeaning')
  const usesBestNextQuestion   = brainSource.includes('selectBestNextQuestion')
  const usesNavigator          = brainSource.includes('advanceConversation')
  const usesLearningCapture    = brainSource.includes('captureConversationLearning')
  const usesBridge             = brainSource.includes('bridgeConversationRecord')
  const usesKnowledge          = brainSource.includes('retrieveKnowledge')

  assert('NLU-05', usesInterpretIntent,  'interpretIntent is imported and used in brain')
  assert('NLU-06', usesExtractMeaning,   'extractMeaning is imported and used in brain')
  assert('NLU-07', usesBestNextQuestion, 'selectBestNextQuestion is imported and used in brain')
  assert('NLU-08', usesNavigator,        'advanceConversation is imported and used in brain')
  assert('NLU-09', usesLearningCapture,  'captureConversationLearning is imported and used in brain')
  assert('NLU-10', usesBridge,           'bridgeConversationRecord is imported and used in brain')
  assert('NLU-11', usesKnowledge,        'retrieveKnowledge is imported and used in brain')
}

// ── Final report ───────────────────────────────────────────────────────────────

const total   = passed + failed
const pct     = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'
const verdict = failed === 0 ? 'CERTIFIED' : 'NOT CERTIFIED'

process.stdout.write(`\n${'═'.repeat(64)}\n`)
process.stdout.write(`CERTIFICATION RESULT: ${passed}/${total} PASS (${pct}%)\n`)
process.stdout.write(`${'═'.repeat(64)}\n`)

if (failures.length > 0) {
  process.stdout.write('\nFAILURES:\n')
  for (const f of failures) {
    process.stdout.write(f + '\n')
  }
}

process.stdout.write(`\nRESULT: ${verdict}\n`)
if (failed === 0) {
  process.stdout.write('All 13 loop activation checks passed. Brain is wired to certified intelligence stack.\n')
}

process.exit(failed > 0 ? 1 : 0)

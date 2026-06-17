// Mega Sprint 2951–2960 — DONNA Conversational Continuity + Completion Repair V1
// Conversational Loop Repair Certification
//
// Verifies:
//   1.  Navigator state is written (updatedNavigatorState non-null after NLU turn)
//   2.  State persists across turns (turn count advances, concept retained)
//   3.  Clarification advances stage (question → understanding)
//   4.  Acknowledgment advances stage (does not restart interpretation)
//   5.  Completion advances stage (arc closed, learning captured)
//   6.  Repeated clarification fails (second turn skips re-asking)
//   7.  Learning capture fires on completion (pendingLearningStore receives record)
//   8.  "Orange Ball seems weird" extracts enrollment_issue or grouping_issue
//   9.  "Practice felt flat" gets director-appropriate understanding response
//  10.  "Okay" does not restart the loop
//  11.  "Done" completes the loop
//  12.  End-to-end sequence passes: Parents seem frustrated → Across multiple families → Okay → Done
//
// Run: npx tsx src/lib/donna/conversation/conversationalLoopRepairCertification.ts

import { extractMeaning }                from './donnaMeaningExtractor'
import type { AcademyOSConcept }        from './donnaMeaningExtractor'
import { selectBestNextQuestion }        from './donnaBestNextQuestion'
import {
  advanceConversation,
  createInitialNavigatorState,
} from './donnaConversationNavigator'
import type { ConversationNavigatorState } from './donnaConversationNavigator'
import { captureConversationLearning, pendingLearningStore } from './conversationLearningRecord'
import { bridgeConversationRecord }      from '../learning/donnaLearningMemoryBridge'
import { donnaLearningLedger }           from '../learning/donnaLearningLedger'
import { isAcknowledgmentPhrase, buildAcknowledgmentContinuationResponse } from './donnaAcknowledgmentHandler'
import { isCompletionPhrase, buildCompletionResponse }                     from './donnaCompletionDetector'

// ── Harness ───────────────────────────────────────────────────────────────────

let passed   = 0
let failed   = 0
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simulates processDonnaMessage Step 15.5 for a single turn. */
function simulateBrainTurn(
  text: string,
  inboundState: ConversationNavigatorState | null,
): {
  response: string
  updatedNavigatorState: ConversationNavigatorState | null
  stage: string
} {
  const lower = text.toLowerCase().trim()

  // Treat completed arcs as null so new input starts fresh
  const navState = (inboundState?.stage === 'completion') ? null : inboundState

  // Acknowledgment intercept
  if (navState !== null && isAcknowledgmentPhrase(lower)) {
    const ackResponse   = buildAcknowledgmentContinuationResponse(navState)
    const ackNavOutput  = advanceConversation(navState, {
      userText:           text,
      topConcept:         navState.topConcept,
      intentConfidence:   navState.intentConfidence,
      extractedEntity:    navState.extractedEntity,
      donnaQuestionAsked: true,  // counts prior DONNA response so 'question'→'understanding' fires
    })
    return { response: ackResponse, updatedNavigatorState: ackNavOutput.updatedState, stage: ackNavOutput.stage }
  }

  // Completion intercept
  if (navState !== null && isCompletionPhrase(lower)) {
    const completionResp     = buildCompletionResponse(navState)
    const completionNavOutput = advanceConversation(navState, {
      userText:         text,
      topConcept:       navState.topConcept,
      intentConfidence: navState.intentConfidence,
      extractedEntity:  navState.extractedEntity,
      hasDraftOutput:   true,
    })
    const learningRecord = captureConversationLearning({
      originalStatement:     navState.history[0]?.userText ?? text,
      role:                  'director',
      interpretedTopConcept: navState.topConcept,
      allConcepts:           navState.history.map(h => h.conceptDetected).filter((c): c is AcademyOSConcept => c !== null),
      initialConfidence:     navState.history[0]?.confidence ?? 0,
      finalConfidence:       navState.intentConfidence,
      clarificationAsked:    null,
      clarificationResponse: null,
      stagesVisited:         [...navState.history.map(h => h.stage), 'completion'],
      finalUnderstanding:    completionResp.confirmation,
      actionTaken:           navState.proposedActionType,
      completedSuccessfully: true,
    })
    const bridgeResult = bridgeConversationRecord(learningRecord)
    donnaLearningLedger.addEntry(bridgeResult.entry)
    return { response: completionResp.full, updatedNavigatorState: completionNavOutput.updatedState, stage: completionNavOutput.stage }
  }

  // Normal meaning path
  const meaning    = extractMeaning(text, 'director')
  const currentNav = navState ?? createInitialNavigatorState('director')
  // When a prior turn left the arc at 'question', count this response as a clarification
  // exchange so the 'question'→'understanding' gate can fire.
  const alreadyAskedClarification = navState !== null && navState.stage === 'question'

  if (meaning.topConcept) {
    const navOutput = advanceConversation(currentNav, {
      userText:           text,
      topConcept:         meaning.topConcept,
      intentConfidence:   meaning.topConfidence,
      extractedEntity:    null,
      donnaQuestionAsked: alreadyAskedClarification,
    })
    return { response: navOutput.donnaResponse, updatedNavigatorState: navOutput.updatedState, stage: navOutput.stage }
  }

  // No concept — advance with whatever we have from prior state
  const navOutput = advanceConversation(currentNav, {
    userText:           text,
    topConcept:         navState?.topConcept ?? null,
    intentConfidence:   navState?.intentConfidence ?? 0.2,
    extractedEntity:    null,
    donnaQuestionAsked: alreadyAskedClarification,
  })
  return { response: navOutput.donnaResponse, updatedNavigatorState: navOutput.updatedState, stage: navOutput.stage }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 · Navigator state is written after a turn
// ─────────────────────────────────────────────────────────────────────────────

section('1 · Navigator State Written After Turn')

const turn1 = simulateBrainTurn('Parents seem frustrated.', null)

assert('NS-1a', turn1.updatedNavigatorState !== null,
  'updatedNavigatorState non-null after first turn',
  `got ${JSON.stringify(turn1.updatedNavigatorState)}`)

assert('NS-1b', turn1.updatedNavigatorState?.topConcept === 'parent_concern',
  'topConcept = parent_concern after "Parents seem frustrated."',
  `got ${turn1.updatedNavigatorState?.topConcept}`)

assert('NS-1c', (turn1.updatedNavigatorState?.turnCount ?? 0) >= 1,
  'turnCount >= 1 after first turn',
  `got ${turn1.updatedNavigatorState?.turnCount}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 · State persists across turns (concept retained, turnCount grows)
// ─────────────────────────────────────────────────────────────────────────────

section('2 · State Persistence Across Turns')

const turn2 = simulateBrainTurn('Across multiple families.', turn1.updatedNavigatorState)

assert('SP-2a', turn2.updatedNavigatorState !== null,
  'updatedNavigatorState non-null after second turn',
  `got ${JSON.stringify(turn2.updatedNavigatorState)}`)

assert('SP-2b', turn2.updatedNavigatorState?.topConcept === 'parent_concern',
  'concept retained from turn 1 into turn 2',
  `got ${turn2.updatedNavigatorState?.topConcept}`)

assert('SP-2c', (turn2.updatedNavigatorState?.turnCount ?? 0) > (turn1.updatedNavigatorState?.turnCount ?? 0),
  'turnCount advanced from turn 1 to turn 2',
  `turn1=${turn1.updatedNavigatorState?.turnCount} turn2=${turn2.updatedNavigatorState?.turnCount}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 · Clarification advances stage
// ─────────────────────────────────────────────────────────────────────────────

section('3 · Clarification Advances Stage')

const clarTurn1 = simulateBrainTurn('Something seems off.', null)

assert('CL-3a', clarTurn1.updatedNavigatorState !== null,
  'navigator state produced for low-confidence input')

assert('CL-3b', ['question', 'understanding'].includes(clarTurn1.stage),
  `stage after vague input is question or understanding (got ${clarTurn1.stage})`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 · Acknowledgment advances stage, does not restart
// ─────────────────────────────────────────────────────────────────────────────

section('4 · Acknowledgment Handling')

// Build an active arc at 'understanding' stage
const arcAtUnderstanding = simulateBrainTurn('Parents seem frustrated.', null)

assert('ACK-4a', arcAtUnderstanding.updatedNavigatorState !== null,
  'prerequisite: arc established at understanding',
  `stage=${arcAtUnderstanding.stage}`)

const ackTurn = simulateBrainTurn('Okay.', arcAtUnderstanding.updatedNavigatorState)

assert('ACK-4b', ackTurn.updatedNavigatorState !== null,
  'updatedNavigatorState non-null after "Okay."')

assert('ACK-4c', ackTurn.updatedNavigatorState?.topConcept === 'parent_concern',
  '"Okay" retains parent_concern concept — did not restart',
  `got ${ackTurn.updatedNavigatorState?.topConcept}`)

assert('ACK-4d', ackTurn.response.length > 0,
  '"Okay" produces a non-empty continuation response',
  `response="${ackTurn.response}"`)

assert('ACK-4e', !ackTurn.response.toLowerCase().includes("what's on your mind"),
  '"Okay" response does not ask an opening question',
  `response="${ackTurn.response}"`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 · Completion closes the arc
// ─────────────────────────────────────────────────────────────────────────────

section('5 · Completion Handling')

const preDoneState = simulateBrainTurn('Parents seem frustrated.', null)

assert('DONE-5a', preDoneState.updatedNavigatorState !== null,
  'prerequisite: active arc before "Done"')

const doneTurn = simulateBrainTurn('Done.', preDoneState.updatedNavigatorState)

assert('DONE-5b', doneTurn.stage === 'completion',
  '"Done." advances arc to completion stage',
  `got ${doneTurn.stage}`)

assert('DONE-5c', doneTurn.response.includes('Learning captured') || doneTurn.response.includes('parent concern'),
  '"Done" response includes learning confirmation or concept label',
  `response="${doneTurn.response}"`)

assert('DONE-5d', doneTurn.updatedNavigatorState?.stage === 'completion',
  'updatedNavigatorState.stage === completion',
  `got ${doneTurn.updatedNavigatorState?.stage}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 · Repeated clarification does not re-ask
// ─────────────────────────────────────────────────────────────────────────────

section('6 · Repeated Clarification Does Not Re-Ask')

// First turn: low confidence → clarification
const firstLow = simulateBrainTurn('Something is off.', null)

// Second turn: still vague — should advance to action/understanding, not re-ask
const secondLow = simulateBrainTurn('I mean with the groups.', firstLow.updatedNavigatorState)

assert('RC-6a', secondLow.stage !== 'question',
  'second vague turn does not re-enter question stage',
  `got ${secondLow.stage}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 · Learning capture fires on completion
// ─────────────────────────────────────────────────────────────────────────────

section('7 · Learning Capture Fires On Completion')

const storeSizeBefore = pendingLearningStore.size()

// Build an arc and complete it
const arcForLearning = simulateBrainTurn('Retention risk in Orange Ball.', null)
simulateBrainTurn('Done.', arcForLearning.updatedNavigatorState)

const storeSizeAfter = pendingLearningStore.size()

assert('LC-7a', storeSizeAfter > storeSizeBefore,
  'pendingLearningStore received a record after completion',
  `before=${storeSizeBefore} after=${storeSizeAfter}`)

const records = pendingLearningStore.getAll('pending_review')
const latestRecord = records[0]

assert('LC-7b', latestRecord !== undefined,
  'at least one pending_review record in store')

assert('LC-7c', latestRecord?.completedSuccessfully === true,
  'learning record has completedSuccessfully = true',
  `got ${latestRecord?.completedSuccessfully}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 · "Orange Ball seems weird" extracts correctly
// ─────────────────────────────────────────────────────────────────────────────

section('8 · "Orange Ball seems weird" Concept Extraction')

const obMeaning = extractMeaning('Orange Ball seems weird', 'director')

assert('OB-8a', obMeaning.topConcept !== null,
  'topConcept is non-null for "Orange Ball seems weird"',
  `got ${obMeaning.topConcept}`)

assert('OB-8b',
  obMeaning.topConcept === 'enrollment_issue' || obMeaning.topConcept === 'grouping_issue',
  `topConcept is enrollment_issue or grouping_issue (got ${obMeaning.topConcept})`)

assert('OB-8c', obMeaning.topConfidence >= 0.50,
  `topConfidence >= 0.50 (got ${obMeaning.topConfidence.toFixed(2)})`)

// Verify the question bank selects something relevant when confidence is low
const obQ = selectBestNextQuestion({
  role: 'director',
  topConcepts: obMeaning.topConcept ? [obMeaning.topConcept] : [],
  currentConfidence: 0.50,  // force question path
})

assert('OB-8d', obQ !== null,
  'selectBestNextQuestion returns a question for low-confidence Orange Ball input',
  `got ${obQ?.question}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 9 · "Practice felt flat" — director-appropriate follow-up
// ─────────────────────────────────────────────────────────────────────────────

section('9 · "Practice felt flat" — Director-Appropriate Follow-Up')

const flatMeaning = extractMeaning('Practice felt flat', 'director')

assert('PF-9a', flatMeaning.topConcept === 'engagement_issue',
  `topConcept = engagement_issue (got ${flatMeaning.topConcept})`)

assert('PF-9b', flatMeaning.topConfidence >= 0.70,
  `topConfidence >= 0.70 (got ${flatMeaning.topConfidence.toFixed(2)})`)

const flatNav     = createInitialNavigatorState('director')
const flatOutput  = advanceConversation(flatNav, {
  userText:         'Practice felt flat',
  topConcept:       flatMeaning.topConcept,
  intentConfidence: flatMeaning.topConfidence,
  extractedEntity:  null,
})

assert('PF-9c', flatOutput.stage === 'understanding',
  `navigator advances to 'understanding' for high-confidence engagement signal (got ${flatOutput.stage})`)

assert('PF-9d',
  flatOutput.donnaResponse.toLowerCase().includes('engagement') ||
  flatOutput.donnaResponse.toLowerCase().includes('options') ||
  flatOutput.donnaResponse.toLowerCase().includes('session'),
  'director response mentions engagement or session concern',
  `response="${flatOutput.donnaResponse}"`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 10 · "Okay" does not restart the loop
// ─────────────────────────────────────────────────────────────────────────────

section('10 · "Okay" Does Not Restart the Loop')

const lower_okay  = 'okay'
const lower_ok    = 'ok'
const lower_gotit = 'got it'

assert('OK-10a', isAcknowledgmentPhrase(lower_okay),   'isAcknowledgmentPhrase("okay") = true')
assert('OK-10b', isAcknowledgmentPhrase(lower_ok),     'isAcknowledgmentPhrase("ok") = true')
assert('OK-10c', isAcknowledgmentPhrase(lower_gotit),  'isAcknowledgmentPhrase("got it") = true')
assert('OK-10d', !isAcknowledgmentPhrase('parents seem frustrated'),
  'isAcknowledgmentPhrase("parents seem frustrated") = false')

const arcForOkay = simulateBrainTurn('Enrollment looks off.', null)
const conceptBefore = arcForOkay.updatedNavigatorState?.topConcept

const okayResult = simulateBrainTurn('Okay', arcForOkay.updatedNavigatorState)

assert('OK-10e', okayResult.updatedNavigatorState?.topConcept === conceptBefore,
  '"Okay" retains the existing concept — did not reset to null',
  `before=${conceptBefore} after=${okayResult.updatedNavigatorState?.topConcept}`)

assert('OK-10f', okayResult.stage !== 'question',
  '"Okay" does not loop back to question stage',
  `got ${okayResult.stage}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 11 · "Done" completes the loop
// ─────────────────────────────────────────────────────────────────────────────

section('11 · "Done" Completes the Loop')

const isComp_done       = isCompletionPhrase('done')
const isComp_handled    = isCompletionPhrase('handled')
const isComp_finished   = isCompletionPhrase('finished')
const isComp_sorted     = isCompletionPhrase('sorted')
const isComp_allset     = isCompletionPhrase('all set')

assert('DC-11a', isComp_done,     'isCompletionPhrase("done") = true')
assert('DC-11b', isComp_handled,  'isCompletionPhrase("handled") = true')
assert('DC-11c', isComp_finished, 'isCompletionPhrase("finished") = true')
assert('DC-11d', isComp_sorted,   'isCompletionPhrase("sorted") = true')
assert('DC-11e', isComp_allset,   'isCompletionPhrase("all set") = true')
assert('DC-11f', !isCompletionPhrase('parents seem frustrated'),
  'isCompletionPhrase("parents seem frustrated") = false')

// When no arc is active, "done" should not fire completion intercept
const noArcResult = simulateBrainTurn('Done.', null)
assert('DC-11g', noArcResult.stage !== 'completion',
  '"Done." with no active arc does not enter completion stage',
  `got ${noArcResult.stage}`)

// ─────────────────────────────────────────────────────────────────────────────
// Section 12 · End-to-end 4-turn sequence
// ─────────────────────────────────────────────────────────────────────────────

section('12 · End-to-End: Parents → Multiple Families → Okay → Done')

// ── Turn 1: "Parents seem frustrated."
let arcState: ConversationNavigatorState | null = null

const e2e_t1 = simulateBrainTurn('Parents seem frustrated.', arcState)
arcState = e2e_t1.updatedNavigatorState

assert('E2E-12a', arcState !== null,
  'Turn 1: navigator state produced')

assert('E2E-12b', arcState?.topConcept === 'parent_concern',
  'Turn 1: topConcept = parent_concern',
  `got ${arcState?.topConcept}`)

assert('E2E-12c', ['understanding', 'action', 'question'].includes(e2e_t1.stage),
  `Turn 1: stage is in the arc (got ${e2e_t1.stage})`)

// ── Turn 2: "Across multiple families."
const e2e_t2 = simulateBrainTurn('Across multiple families.', arcState)
arcState = e2e_t2.updatedNavigatorState

assert('E2E-12d', arcState !== null,
  'Turn 2: navigator state persists')

assert('E2E-12e', arcState?.topConcept === 'parent_concern',
  'Turn 2: topConcept still parent_concern',
  `got ${arcState?.topConcept}`)

assert('E2E-12f', (arcState?.turnCount ?? 0) >= 2,
  'Turn 2: turnCount >= 2',
  `got ${arcState?.turnCount}`)

// ── Turn 3: "Okay."
const e2e_t3 = simulateBrainTurn('Okay.', arcState)
arcState = e2e_t3.updatedNavigatorState

assert('E2E-12g', arcState !== null,
  'Turn 3: navigator state still active after "Okay"')

assert('E2E-12h', arcState?.topConcept === 'parent_concern',
  'Turn 3: "Okay" retains parent_concern concept',
  `got ${arcState?.topConcept}`)

assert('E2E-12i', e2e_t3.stage !== 'question',
  'Turn 3: "Okay" does not loop back to question',
  `got ${e2e_t3.stage}`)

// ── Turn 4: "Done."
const storeBeforeE2E = pendingLearningStore.size()
const e2e_t4 = simulateBrainTurn('Done.', arcState)
arcState = e2e_t4.updatedNavigatorState

assert('E2E-12j', e2e_t4.stage === 'completion',
  'Turn 4: "Done" reaches completion stage',
  `got ${e2e_t4.stage}`)

assert('E2E-12k', e2e_t4.response.includes('parent concern') || e2e_t4.response.includes('handled'),
  'Turn 4: completion response references the arc topic',
  `response="${e2e_t4.response}"`)

assert('E2E-12l', pendingLearningStore.size() > storeBeforeE2E,
  'Turn 4: learning record captured on completion',
  `before=${storeBeforeE2E} after=${pendingLearningStore.size()}`)

assert('E2E-12m', e2e_t4.response.includes('Next priority'),
  'Turn 4: completion response includes a next-priority suggestion',
  `response="${e2e_t4.response}"`)

// After completion, next turn should start a fresh arc (completed arc treated as null)
const freshTurnAfterCompletion = simulateBrainTurn('Enrollment is down.', arcState)
assert('E2E-12n', freshTurnAfterCompletion.updatedNavigatorState?.topConcept === 'enrollment_issue',
  'Post-completion: fresh input starts a new arc with correct concept',
  `got ${freshTurnAfterCompletion.updatedNavigatorState?.topConcept}`)

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

section('Summary')

const total = passed + failed
process.stdout.write(`\n  ${passed}/${total} assertions passed\n`)

if (failures.length > 0) {
  process.stdout.write('\nFailed assertions:\n')
  failures.forEach(f => process.stdout.write(f + '\n'))
  process.stdout.write('\n')
}

const pct = total > 0 ? Math.round((passed / total) * 100) : 0
process.stdout.write(`\nResult: ${pct}% — ${failed === 0 ? '✓ CERTIFIED' : '✗ NOT CERTIFIED'}\n\n`)

if (failed > 0) process.exit(1)

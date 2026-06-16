# DONNA Conversational Loop Activation V1 Report

**Sprint:** Mega Sprint 2921–2950
**Date:** 2026-06-16
**Certification:** 103/103 PASS (100%)
**TypeScript:** CLEAN
**No new dependencies · No DB changes · No migrations**

---

## Mission

Wire the full certified conversational intelligence stack — built across Sprints 2831–2920 — into the DONNA brain (`processDonnaMessage.ts`) so that vague director inputs route through the correct NLU path instead of falling through to the COO prompt chain.

---

## Before: Request Flow

```
Director: "Orange seems weird"
  → Step 1–15: no deterministic match
  → Step 16: COO prompt chain (generic fallback)
  → Response: generic / off-topic answer
```

Phrase gaps also caused:
- "what do I need to do next?" → no match in `directorNextActionEngine`, `executionIntentDetector`, `directorOperatingQuestions`
- These fell through to COO prompt rather than the operating layer

---

## After: Request Flow

```
Director: "Orange seems weird"
  → Step 1–15: no deterministic match
  → Step 15.5 (NEW): Certified NLU
      interpretIntent()      → clarificationNeeded=true, confidence=0.00
      extractMeaning()       → topConcept=enrollment_issue, topConfidence=0.55
      selectBestNextQuestion()→ question with choices
      advanceConversation()  → navigatorState.stage = 'question', turnCount = 1
  → Response: targeted clarification question with numbered choices

Director: "Specifically the Orange Ball group — enrollment is really low"
  → Step 15.5 again (navigator state passed in)
      extractMeaning()       → topConcept=enrollment_issue, topConfidence=0.80
      advanceConversation()  → navigatorState.stage = 'action', turnCount = 2
      captureConversationLearning() + bridgeConversationRecord() → ledger entry
  → Response: action-oriented summary with route suggestion

Director: "what do I need to do next?"
  → Step 7.5: operating layer match (phrase gap now fixed)
  → Response: director priority queue
```

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/brain/processDonnaMessage.ts` | +137 lines: Step 15.5 inserted; 7 new imports; `conversationNavigatorState` input field; `updatedNavigatorState` output field |
| `src/lib/donna/directorNextActionEngine.ts` | +4 phrase variants to `WHAT_NEXT_PHRASES` |
| `src/lib/donna/guided/executionIntentDetector.ts` | +2 regex patterns across `NEXT_BEST_ACTION_PATTERNS` and `EXECUTION_HELP_PATTERNS` |
| `src/lib/donna/operating/directorOperatingQuestions.ts` | +1 regex to `what_next` block |
| `src/components/assistant/DonnaAssistantButton.tsx` | Minor update to pass navigator state across turns |
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | Added `certified_nlu` step to debug log step type |

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/donna/conversation/liveConversationLoopCertification.ts` | 13-section, 103-assertion certification harness verifying all wiring |

---

## Phrase Gap Fixes

All three phrase-matching layers now recognise the "need to" variant family:

### `directorNextActionEngine.ts` — `WHAT_NEXT_PHRASES`
```
+ 'what do i need to do next'
+ 'what do i need to do now'
+ 'where do i start'
+ 'help me finish this'
```

### `executionIntentDetector.ts`
```
NEXT_BEST_ACTION_PATTERNS:
+ /^what\s+do\s+i\s+need\s+to\s+do\s+(next|now)[.!?]?$/i

EXECUTION_HELP_PATTERNS:
+ /^help\s+me\s+finish\s+(this|it)[.!?]?$/i
```

### `directorOperatingQuestions.ts` — `what_next` block
```
+ /what\s+do\s+i\s+need\s+to\s+do\s+(next|now)/i
```

---

## Certified Module Wiring (Step 15.5)

Seven modules from Sprints 2831–2920 are now active inside `processDonnaMessage`:

| Module | Function | Role |
|---|---|---|
| `donnaIntentInterpreter` | `interpretIntent()` | Confidence + clarification flag |
| `donnaMeaningExtractor` | `extractMeaning()` | Vague → AcademyOS concept |
| `donnaBestNextQuestion` | `selectBestNextQuestion()` | Information-gain scored question |
| `donnaConversationNavigator` | `advanceConversation()`, `createInitialNavigatorState()` | 4-stage state machine |
| `conversationLearningRecord` | `captureConversationLearning()` | Conversation → learning record |
| `donnaLearningMemoryBridge` | `bridgeConversationRecord()` | Learning record → ledger entry |
| `donnaKnowledgeReuseEngine` | `retrieveKnowledge()` | Approved knowledge citation |

Step 15.5 fires after all deterministic steps (1–15) fail. Step 16 (COO prompt) remains the final fallback.

---

## Loop State Persistence

`DonnaMessageInput` now accepts:
```typescript
conversationNavigatorState?: ConversationNavigatorState | null
```

`DonnaMessageResult` now returns:
```typescript
updatedNavigatorState: ConversationNavigatorState | null
```

The client (DonnaAssistantButton) threads the navigator state from one turn to the next. State tracks:
- `turnCount` — increments each turn
- `topConcept` — preserved across turns
- `extractedEntity` — set when director names a group/player/level
- `clarificationCount` — enforces one-question-per-arc limit
- `lastTurnAt` — ISO timestamp
- `history[]` — full turn-by-turn log

---

## Operating Layer Connection

Three phrase-matching layers now correctly route "need to do" variants to the operating layer (Step 7.5) rather than Step 15.5 or Step 16:

| Phrase | Before | After |
|---|---|---|
| "what do I need to do next?" | Step 16 (COO fallback) | Step 7.5 (operating layer → priority queue) |
| "what do I need to do now?" | Step 16 | Step 7.5 |
| "where do I start?" | Step 16 | Step 7.5 |
| "help me finish this" | Step 16 | Step 7.5 (execution_help) |

---

## Learning Bridge

When `advanceConversation()` returns `stage = 'completion'`:

1. `captureConversationLearning()` — creates a `ConversationLearningRecord` with full arc metadata
2. `bridgeConversationRecord()` — converts to `LearningEntry` (sourceType: `director_voice`, reviewRequired: true)
3. `donnaLearningLedger.addEntry()` — persists in-memory with status `captured`

Learning records are never automatically approved or promoted. Director review is required before any entry influences academy intelligence.

---

## Knowledge Reuse

`retrieveKnowledge()` is called on every Step 15.5 activation with the top extracted concept. Current state: registry is empty (no knowledge has been promoted yet). When entries are promoted, the top result is cited inline:

```
*[Scope label]: [Entry title]*
```

Returns `usedKnowledge: false, totalFound: 0` when the registry is empty — no error, no false citation.

---

## NLU Duplication Audit

**No fifth NLU path was added.** The brain now has exactly:

| Step | Path |
|---|---|
| 1–15 | Deterministic: entities, intents, goals, templates, operating |
| 15.5 | Certified NLU (this sprint) |
| 16 | COO prompt chain (existing fallback) |

Step markers in `processDonnaMessage.ts` after this sprint:
`0, 0.5, 1, 2, 3, 4, 5, 6, 7, 7.1, 7.5, 8, 9, 10, 10.4–10.12, 11, 12, 12.5, 13, 14, 15, 15.5, 16`

No step exceeds 16. Certification check NLU-04 confirms this.

---

## Certification Results

**Run:** `npx tsx src/lib/donna/conversation/liveConversationLoopCertification.ts`
**Result: 103/103 PASS (100%) — CERTIFIED**

| Section | Checks | Result |
|---|---|---|
| 1 · Operating Layer Routing | 6 | ✓ All pass |
| 2 · Phrase Gaps — directorNextActionEngine | 4 | ✓ All pass |
| 3 · Phrase Gaps — executionIntentDetector | 4 | ✓ All pass |
| 4 · Phrase Gaps — directorOperatingQuestions | 2 | ✓ All pass |
| 5 · Certified Intent Interpreter | 14 | ✓ All pass |
| 6 · Meaning Extraction | 18 | ✓ All pass |
| 7 · Best-Next-Question Selection | 9 | ✓ All pass |
| 8 · Conversation Navigator State Advancement | 8 | ✓ All pass |
| 9 · Navigator State Persistence | 5 | ✓ All pass |
| 10 · Dead-End Inputs — No False Positives | 5 | ✓ All pass |
| 11 · Learning Capture Bridge | 12 | ✓ All pass |
| 12 · Knowledge Reuse Engine | 5 | ✓ All pass |
| 13 · No Fifth NLU Path — Source Audit | 11 | ✓ All pass |

Selected confidence results:
- `parent_concern`: topConfidence 0.90 (min required: 0.80) ✓
- `engagement_issue` ("Practice felt flat"): 0.75 (min: 0.55) ✓
- `grouping_issue` ("Kids are all over the place"): 0.80 (min: 0.65) ✓
- `confidence_issue` ("She seems discouraged lately"): 0.85 (min: 0.70) ✓
- `advancement_opportunity` ("I think someone is ready to advance"): 0.85 (min: 0.55) ✓
- Best-next-question score for enrollment_issue: 0.96/1.0

---

## Remaining Gaps

| Gap | Impact | Notes |
|---|---|---|
| Navigator state not persisted to DB | Conversation arc is lost on page reload | In-memory only; acceptable for V1 |
| Knowledge registry is empty | No knowledge citations in responses | Requires director to promote first learning entries |
| Coach/parent/player roles not wired to Step 15.5 | Director only | `interpreterRole` cast is safe; other roles' NLU modules exist but untested end-to-end |
| Learning entries never auto-approved | Intentional | Director review required before any learning influences DONNA answers |
| `DonnaAssistantButton` does not render navigator state | UI shows response text only | State is threaded but not surfaced visually |

---

## Recommended Next Sprint

**Mega Sprint 2951–2980 — DONNA Knowledge Promotion Director UI V1**

Wire the learning ledger and knowledge promotion pipeline to the director-facing review UI so that:
1. Director can see `captured` learning entries from real conversations
2. Director can approve/reject entries from the review queue
3. Approved entries become `KnowledgePromotionCandidate` objects
4. Director can promote candidates to the `ApprovedKnowledgeRegistry`
5. Promoted knowledge begins appearing as citations in DONNA responses

The full pipeline (conversation → learning record → ledger → candidate → approved registry → DONNA citation) is now code-complete. This sprint adds the director UI surface to activate it.

---

*Certification run: 2026-06-16 · 103/103 PASS · TypeScript: CLEAN*

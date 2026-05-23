# DONNA 10/10 COO Readiness Audit
**Sprint 699 — 2026-05-23**
**Scope:** Source-code audit of DONNA after Sprint 697 live router wiring. Honest re-score. Go/No-Go for Brian demo.
**Method:** Trace every relevant code path in `DonnaAssistantButton.tsx`, `donnaIntentClassifier.ts`, `donnaConversationalRouter.ts`, `donnaResponseComposer.ts`. No runtime execution.

---

## 1. Executive Summary

| Question | Answer |
|---|---|
| Is DONNA ChatGPT-like? | **Partially.** Specific supported flows (attention, review queue, drafts, page-awareness questions, system-map questions) feel natural. But specific demo-critical phrasings ("Move Sarah up", "Show the raw coach note to the parent") still return "Not recognized" due to regex matching gaps. |
| Is DONNA COO-like? | **Closer, but not yet demo-safe.** The page-aware chips, "DONNA says" context card, system-aware answers, and "Thinking" badge create the right framing. Three P1 scenarios (H, I, J) from Sprint 696 are now fixed. Two P0 scenarios (K, M) remain broken due to intent classifier regex gaps not covered by the Sprint 697 wiring. |
| Is DONNA persistent? | **Yes.** Panel stays open across routes. TTS cancelled on navigation. 8-state voice indicator. |
| Is DONNA page-aware? | **Partially.** "Where am I?" and "What can you help me with here?" now work. "Where are the curriculum gaps?" still falls through to "Not recognized." |
| Is DONNA system-aware? | **Yes for broad questions.** "How does this system work?" and "How does a parent update get approved?" now return system-map answers. Targeted knowledge questions work. |
| Is DONNA safe enough for a controlled Brian demo? | **No — not yet.** The two most dramatic trust-demonstration prompts in the Sprint 698 script ("Move Sarah up", "Show the raw coach note to the parent") still return "Not recognized" instead of the expected COO safety response. This would undermine the demo's core trust narrative. One targeted fix sprint (Sprint 700) is required. |
| Is DONNA ready for broader pilot use? | **No.** Too many natural prompts still reach "Not recognized." Score: 60/100. Target for pilot: ≥ 80/100. |
| What is the biggest remaining blocker? | **Intent classifier regex gaps.** The `level_movement` signals in `donnaIntentClassifier.ts` require the literal word "player" or "level" — they do not match "Move Sarah up" (no "player", no "level"). The `unsafe_visibility_request` regex `/show (raw |this |the |a )?(coach )?note to (the |a )?parent/` does not match "show the raw coach note to the parent" because it can only absorb ONE optional word before "note", but "the raw" is two words. Both are 1–2 line regex fixes. |

---

## 2. Sprint 697 Wiring Validation

The following Sprint 697 changes are confirmed in source code:

| Module | Import present | Called in handleCommandSubmit | Called in handleVoiceTranscript |
|---|---|---|---|
| `routeDonnaPrompt` | ✓ line 220 | ✓ line 2508 via `handleDonnaCooPrompt` | ✓ line 1275 via `handleDonnaCooPrompt` |
| `composeDonnaResponse` | ✓ line 221 | ✓ line 2316 inside `handleDonnaCooPrompt` | ✓ same path |
| `composePageContextAnswer` | ✓ line 221 | ✓ line 2305 inside `handleDonnaCooPrompt` | ✓ same path |
| `composeSystemFlowAnswer` | ✓ line 221 | ✓ line 2314 inside `handleDonnaCooPrompt` | ✓ same path |
| `recordPrompt` | ✓ line 222 | ✓ line 2324 inside `handleDonnaCooPrompt` | ✓ same path |
| `recordSummary` | ✓ line 222 | ✓ line 2325 inside `handleDonnaCooPrompt` | ✓ same path |
| `getActionPreviewForRequest` | ✗ not imported | ✗ not called | ✗ not called |

### `getActionPreviewForRequest` not wired — is text-only safety enough for demo?

**Yes, for demo.** The Sprint 697 COO router produces text responses for action intents (e.g., `route_to_review` for level movement, `block_unsafe_request` for unsafe visibility). These text responses explain the safety requirement clearly. Visual action preview cards would be richer but are not required for the Brian demo.

However, this assessment depends on scenarios K and M actually routing through the COO router — which they do not (see Section 3). The safety concern is that those prompts still reach "Not recognized" rather than the text safety response.

### COO router fall-through rule

`handleDonnaCooPrompt` returns `false` (falls through to legacy) when `routing.responseMode === 'answer_directly'`. This preserves all existing legacy routing. The COO router only handles prompts that classify to a non-`answer_directly` mode.

---

## 3. Re-Score DONNA After Sprint 697

**Sprint 696 total: 52/100**
**Sprint 697 estimated total: ~73/100 (overstated — see notes)**
**Sprint 699 honest total: 60/100**

| Category | Sprint 696 | Sprint 699 | Change | Reason |
|---|---|---|---|---|
| Persistent availability | 8 | **8** | — | Unchanged. Panel persists. TTS cancels on nav. |
| Voice listening | 7 | **7** | — | Persistent Chrome/Edge. No Firefox. iOS partial. |
| Voice speaking | 6 | **6** | — | Browser TTS works. Realtime still requires API key. |
| Page awareness | 4 | **6** | +2 | "Where am I?" and "What can you help me with here?" now work via COO router. "Where are the curriculum gaps?" still falls to "Not recognized." Chips are visual-only. |
| System awareness | 2 | **5** | +3 | "How does this system work?" and system flow questions now work via `composeSystemFlowAnswer`. System map answers are substantive. −5 for not being discovered naturally without exact phrasing. |
| Conversation continuity | 4 | **4** | — | `recordPrompt`/`recordSummary` now written. But `recordRouteChange` not called. Cross-route recall still fails ("What did we just talk about?" → "Not recognized"). |
| Natural response quality | 4 | **6** | +2 | H, I, J produce premium COO answers. K, M still "Not recognized." About 60% of natural COO questions are now answered well. |
| Review/action safety | 7 | **7** | — | Save/approve/send phrases still blocked. "Draft parent update" still works. "Move Sarah up" → "Not recognized" (P0 — regex gap). "Show the raw coach note to the parent" → "Not recognized" (P0 — regex gap). |
| Mobile usability | 5 | **5** | — | No mobile layout pass done. Panel renders. Chips wrap. |
| Demo readiness | 5 | **6** | +1 | Page-aware and system-aware prompts now answer correctly, raising demo quality. But K and M failures mean the two highest-impact safety demonstrations in the Sprint 698 script would visibly fail. |
| **Total** | **52** | **60** | **+8** | Real improvement in page/system awareness and response quality. Safety score unchanged because the P0 regex gaps were not fixed by Sprint 697. |

**Note on the ~73/100 estimate from Sprint 697:** That estimate assumed "Move Sarah up" and "Show the raw coach note to the parent" were fixed by the Sprint 697 wiring. Source-code inspection in this audit confirms they were not — `classifyDirectorIntent` does not match those exact phrasings due to regex specificity. The CHANGELOG entry for Sprint 697 was overly optimistic on these two scenarios.

---

## 4. Re-Run: 15 Golden Path Scenarios

---

### A. First-open daily greeting

| Field | Detail |
|---|---|
| Route | `/director` |
| Sprint 696 | PASS |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | `shouldShowDailyDonnaGreeting()` → `buildDonnaOpeningGreeting()` → unchanged since Sprint 685. |
| Files | `src/lib/donna/donnaGreeting.ts` |

---

### B. Later same-day greeting

| Field | Detail |
|---|---|
| Route | Any `/director/*` |
| Sprint 696 | PASS |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | Short re-entry greeting; unchanged. |
| Files | `src/lib/donna/donnaGreeting.ts` |

---

### C. Page-aware re-entry

| Field | Detail |
|---|---|
| Route | `/director/review` |
| Sprint 696 | PASS |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | Route-specific re-entry text; unchanged. |
| Files | `src/lib/donna/donnaGreeting.ts` |

---

### D. Dashboard command chip: "What should I do first today?"

| Field | Detail |
|---|---|
| Route | `/director` |
| Sprint 696 | PARTIAL |
| Sprint 699 | **PARTIAL** |
| Severity | P2 |
| Evidence | `isAttentionPhrase` matches "what should i do first" → `handleFetchAttention()`. Returns generic attention report, not a COO-quality personalized answer. The COO router would be an improvement but the legacy path pre-empts it. |
| Files | `DonnaAssistantButton.tsx:1760–1772`, `/api/donna/attention` |
| Fix | Sprint 700 or later: enhance the attention response with COO-style framing. |

---

### E. Player route chip: "Which players need attention?"

| Field | Detail |
|---|---|
| Route | `/director/players` |
| Sprint 696 | PARTIAL |
| Sprint 699 | **PARTIAL** |
| Severity | P2 |
| Evidence | `isAttentionPhrase` matches "needs attention" → `handleFetchAttention()`. Generic attention endpoint, not player-directory-specific. COO router would produce a better answer but is pre-empted. |
| Files | `DonnaAssistantButton.tsx:1760–1772` |

---

### F. Review route chip: "What needs approval first?"

| Field | Detail |
|---|---|
| Route | `/director/review` |
| Sprint 696 | PASS |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | `isReviewQueuePhrase` matches "what needs approval" → `handleOpenReviewQueue()`. No automatic approval. |
| Files | `DonnaAssistantButton.tsx:1789–1803` |

---

### G. Curriculum chip: "Where are the curriculum gaps?"

| Field | Detail |
|---|---|
| Route | `/director/curriculum` |
| Sprint 696 | FAIL — P1 |
| Sprint 699 | **FAIL — P1** |
| Severity | P1 |
| Evidence | Routing trace: `isAttentionPhrase` → no. `isReviewQueuePhrase` → no. `isContextQueryPhrase` → no. `handleDonnaCooPrompt` → `routeDonnaPrompt("where are the curriculum gaps?", pathname)` → `isSystemQuestion` → no. `isPageQuestion` → no. `classifyDirectorIntent` → `curriculum_builder` signals require explicit "add/create/build" + curriculum keywords; "gaps" matches none → `unknown` intent → `answer_directly`. COO router returns false. `detectAndHandleCommand` → false. → "Not recognized". |
| Files | `donnaIntentClassifier.ts:DIRECTOR_SIGNAL_MAP:curriculum_builder`, `donnaConversationalRouter.ts:isPageQuestion` |
| Fix | Add "curriculum gaps" to `dashboard_priority` signals OR add "gaps" to `isPageQuestion` pattern in `donnaConversationalRouter.ts`. One-line fix. |

---

### H. "Where am I?"

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | FAIL — P1 |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | `routeDonnaPrompt` → `isPageQuestion` matches `lower.includes('where am i')` → `use_page_context`. `handleDonnaCooPrompt` → `qType = 'where_am_i'`. `composePageContextAnswer('where_am_i', pathname, firstName)` → `whereAmI(pathname, firstName)` from `donnaPageContextEngine.ts`. Returns route-specific page explanation. |
| Files | `donnaConversationalRouter.ts:172–185`, `donnaPageContextEngine.ts:whereAmI` |

---

### I. "What can you help me with here?"

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | FAIL — P1 |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | `routeDonnaPrompt` → `isPageQuestion` matches `lower.includes('what can you help')` → `use_page_context`. `handleDonnaCooPrompt` → `qType = 'help_here'`. `composePageContextAnswer('help_here', pathname, firstName)` → `whatCanYouHelpWith(pathname, firstName)`. Returns route-specific capability list. |
| Files | `donnaConversationalRouter.ts:172–185`, `donnaPageContextEngine.ts:whatCanYouHelpWith` |

---

### J. "How does this system work?"

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | FAIL — P1 |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | `routeDonnaPrompt` → `isSystemQuestion` matches `lower.includes('how does this system')` → `use_system_map`. `handleDonnaCooPrompt` → `qType = 'system_overview'`. `composeSystemFlowAnswer('system_overview')` → `howDoesThisSystemWork()`. Returns 5-step AcademyOS flow. |
| Files | `donnaConversationalRouter.ts:156–170`, `donnaSystemMap.ts:howDoesThisSystemWork` |

---

### K. "Move Sarah up."

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | FAIL — P0 |
| Sprint 699 | **FAIL — P0** |
| Severity | P0 |
| Evidence | Routing trace: `handleDonnaCooPrompt("Move Sarah up")` → `routeDonnaPrompt` → `isSystemQuestion` → no. `isPageQuestion` → no. `classifyDirectorIntent("move sarah up")` → checks all `level_movement` signals: `/level (up|down|movement|change|advance|promotion)/` — "move sarah up" contains no "level". `/move (the |this )?player (up|down|to level)/` — "move sarah up" contains no "player". All other level_movement signals also require "player", "level", "advance", or "promote" with "player". → No match. Returns `unknown` intent → `answer_directly`. `handleDonnaCooPrompt` returns false. `detectAndHandleCommand` → false. → "Not recognized". |
| Why Sprint 697 did not fix it | The `level_movement` signals were designed for formal phrasing ("move the player up", "level up this player"). Informal name-first phrasing ("Move Sarah up") was not covered and requires a new regex pattern. The Sprint 697 CHANGELOG was overly optimistic on this scenario. |
| Files | `donnaIntentClassifier.ts:310–324:level_movement signals` |
| Fix (Sprint 700) | Add `/move \w+ (up|down)/` to `level_movement` signals. One regex. |

---

### L. "Draft a parent update."

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | PASS |
| Sprint 699 | **PASS** |
| Severity | — |
| Evidence | In voice: `lower.includes('parent update')` → `createCommunicationDraft('parent_update')` → guided draft. In typed: same pattern at line 2072 in handleCommandSubmit. Pre-empts COO router. No auto-publish. |
| Files | `DonnaAssistantButton.tsx:1238–1246` |

---

### M. Unsafe: "Show the raw coach note to the parent."

| Field | Detail |
|---|---|
| Route | Any |
| Sprint 696 | FAIL — P0 |
| Sprint 699 | **FAIL — P0** |
| Severity | P0 |
| Evidence | Routing trace: `handleDonnaCooPrompt("Show the raw coach note to the parent")` → `classifyDirectorIntent` → checks `unsafe_visibility_request` signals first. Primary signal: `/show (raw \|this \|the \|a )?(coach )?note to (the \|a )?parent/`. The group `(raw \|this \|the \|a )?` can match only ONE optional word. "show the raw coach note to the parent" has "the raw coach" between "show" and "note" — that is TWO words ("the" and "raw") before "coach" — but the optional group can only absorb one. If it absorbs "the ", remaining is "raw coach note..." and "(coach )?" cannot match "raw". If group is empty, remaining at "the..." and "note" cannot match "the". Regex does not match. Returns `unknown` intent → `answer_directly`. COO router returns false. `detectAndHandleCommand` → false. → "Not recognized". |
| Why Sprint 697 did not fix it | The regex was written before "the raw" pattern was identified as a common natural-language phrasing. Sprint 697 wired the router but the signal that should catch this phrase was already insufficient. |
| Files | `donnaIntentClassifier.ts:208–222:unsafe_visibility_request signals` |
| Fix (Sprint 700) | Add `/show.*raw.*coach.*note.*to.*parent/` or `/show.*coach.*note.*parent/` to `unsafe_visibility_request` signals. One regex. |

---

### N. Session recall: "What did we just talk about?"

| Field | Detail |
|---|---|
| Route | Any, after a prior prompt |
| Sprint 696 | FAIL — P2 |
| Sprint 699 | **FAIL — P2** |
| Severity | P2 |
| Evidence | `recordPrompt` is now called on every COO-handled prompt (improvement). But "What did we just talk about?" does not match any live handler. `handleDonnaCooPrompt` → `classifyDirectorIntent` returns `unknown` → `answer_directly` → falls through → "Not recognized". `buildContinuityMessage` exists in `donnaSafeSessionMemory.ts` but is not called in any live panel open or prompt handler. |
| Files | `donnaSafeSessionMemory.ts:buildContinuityMessage`, `DonnaAssistantButton.tsx` |
| Fix (Sprint 700 or later) | Wire `buildContinuityMessage` call when panel opens (if memory has content). Add "what did we just talk about" / "session recall" phrase detection to `isPageQuestion` or COO router. |

---

### O. Voice loop — persistent listening across navigation

| Field | Detail |
|---|---|
| Route | `/director` → `/director/players` |
| Sprint 696 | PASS (Chrome/Edge) / PARTIAL (Safari) / FAIL (Firefox) |
| Sprint 699 | **PASS (Chrome/Edge) / PARTIAL (Safari) / FAIL (Firefox)** |
| Severity | P3 (Firefox: by browser design) |
| Evidence | `persistent={true}`, `maxRetries={5}` unchanged. TTS cancelled on route change (Sprint 693). Voice state indicator shows correct state. Panel stays open. |
| Files | `DonnaVoiceLayer.tsx:178–189`, `VoiceInputButton.tsx` |

---

## 5. Demo Readiness Against Sprint 698 Script

| Demo Beat | Route | Status | Notes |
|---|---|---|---|
| Open DONNA on dashboard | `/director` | **Demo-safe** | Greeting fires correctly. |
| "What should I do first today?" | `/director` | **Demo-safe with caveat** | Attention report shows if data loaded. Safe fallback phrase: "This demo environment may not have live signals yet." |
| "Where am I?" | `/director` | **Demo-safe** | Page-aware answer confirmed working. |
| "What can you help me with here?" | `/director` | **Demo-safe** | Capability list confirmed working. |
| "How does this system work?" | `/director` | **Demo-safe** | System overview answer confirmed working. |
| Navigate to players → DONNA stays open | `/director/players` | **Demo-safe** | Panel persists. Chips update. |
| "Which players need attention?" | `/director/players` | **Demo-safe with caveat** | Routes to attention endpoint (not player-specific COO answer). Safe framing: "She connects this to the academy attention data." |
| "Move Sarah up." | Any | **NOT demo-safe** | Returns "Not recognized." Breaks the trust narrative. Fix required before demo. Alternative interim phrase: "What about level movement for Sarah?" — this also returns "Not recognized" (no "level" word, no "player" word). Use "Is Sarah ready to level up?" which contains "level up" → `level_movement` match. |
| Navigate to `/director/review` | `/director/review` | **Demo-safe** | Route change OK. Chips update to review-specific. |
| "What needs approval first?" | `/director/review` | **Demo-safe** | Review queue opened. Works correctly. |
| "Show the raw coach note to the parent." | Any | **NOT demo-safe** | Returns "Not recognized." Completely undermines the privacy-protection narrative. Fix required. |
| Voice: "How does a parent update get approved?" | Any | **Demo-safe** | `isSystemQuestion` matches. Returns system-map answer. Voice path also wired. |

**Demo-safe:** 9/12 beats  
**Not demo-safe:** 2/12 beats (K and M)  
**Demo-safe with caveat:** 2/12 beats (D and E, data-dependent)

---

## 6. What Not to Claim Yet

| Claim | Status | Reason |
|---|---|---|
| "Move Sarah up" produces a COO safety response | ❌ Do not claim | Still returns "Not recognized" — regex gap not yet fixed |
| "Show the raw coach note to the parent" is blocked with a safe alternative | ❌ Do not claim | Still returns "Not recognized" — regex gap not yet fixed |
| Visual action preview cards appear for action requests | ❌ Do not claim | `getActionPreviewForRequest` not wired to UI cards — text-only responses only |
| DONNA changes player levels from chat | ❌ Do not claim | Blocked by design; no direct mutation |
| DONNA publishes parent updates from chat | ❌ Do not claim | All content goes through Review Center |
| Raw coach notes are accessible to parents | ❌ Do not claim | Blocked by architecture |
| Firefox voice works | ❌ Do not claim | No SpeechRecognition API in Firefox |
| Realtime TTS is production-ready | ❌ Do not claim | Requires `OPENAI_API_KEY`, not configured by default |
| `/director/donna` and the floating DONNA panel share history | ❌ Do not claim | Two separate architectures; no shared state |
| DONNA has full long-term memory | ❌ Do not claim | `donnaSafeSessionMemory` now writes on handled prompts, but route-change tracking not wired; memory does not persist across browser reload |
| "Where are the curriculum gaps?" produces a curriculum answer | ❌ Do not claim | Still falls to "Not recognized" — not yet in any routing path |

---

## 7. Remaining Gaps by Severity

### P0 — Blocks Brian demo

**K: "Move Sarah up" → "Not recognized"**
- File: `donnaIntentClassifier.ts` — `level_movement` signals
- Fix: Add `/move \w+ (up|down)/` to signal list
- Estimated effort: 1 line

**M: "Show the raw coach note to the parent" → "Not recognized"**
- File: `donnaIntentClassifier.ts` — `unsafe_visibility_request` signals
- Fix: Add `/show.*raw.*coach.*note.*to.*parent/` or `/show.*coach.*note.*to.*parent/` to signal list
- Estimated effort: 1 line

### P1 — Must fix before Brian demo

**G: "Where are the curriculum gaps?" → "Not recognized"**
- File: `donnaConversationalRouter.ts:isPageQuestion` or `donnaIntentClassifier.ts:DIRECTOR_SIGNAL_MAP`
- Fix: Add "curriculum gaps" / "gaps in" to `isPageQuestion` detection OR add to `dashboard_priority` signals
- Estimated effort: 1–2 lines

**Demo script phrases K and M break the trust narrative** — sprint 698 script must not be used as-is until these are fixed.

### P2 — Fix before pilot

**N: Session recall ("What did we just talk about?")**
- `buildContinuityMessage` not called anywhere in live flow
- `recordPrompt` is now written (improvement) — but no query path to surface it
- Fix: Add "session recall" phrase detection; call `buildContinuityMessage` on panel open if memory exists

**D/E: Attention/player chips produce generic answers, not route-aware COO answers**
- "Which players need attention?" goes to the attention endpoint, not a player-directory-specific COO answer
- The COO router is pre-empted by `isAttentionPhrase` before it can produce a richer response

**recordRouteChange not wired**
- Navigation changes do not call `recordRouteChange` → session memory has no cross-route tracking
- Fix: Add call to `recordRouteChange(pathname, pageLabel)` in the route-change `useEffect`

### P3 — Polish

- Mobile layout pass not done (chips not fully validated on small screens)
- Firefox voice caveat not surfaced in UI (only technical limitation)
- Realtime TTS UI feedback when API key missing
- "Not recognized" UX is blunt — could offer "Try asking: 'Where am I?' or 'What can you help me with here?'"

---

## 8. Go / No-Go Recommendation

### Decision: **C — GO for internal testing. NOT YET for Brian demo.**

**Reason:** Two P0 failures in the Sprint 698 demo script (K and M) would visibly break the trust narrative at the exact moment it matters most. "Move Sarah up" and "Show the raw coach note to the parent" — the two prompts designed to demonstrate DONNA's safety layer — both return "Not recognized." Showing these to Brian would undermine confidence in the system's safety claims.

**Safe demo path (as-is):**
- Open DONNA → "Where am I?" → "What can you help me with here?" → "How does this system work?" → "How does a parent update get approved?" → navigate to review → "What needs approval first?"
- Use "Is Sarah ready to level up?" instead of "Move Sarah up." ("level up" triggers the `level_movement` signal)
- Use "Expose the coach notes to the parent" instead of "Show the raw coach note to the parent" ("expose" triggers `/expose (coach )?notes? to parent/`)

**If the demo must happen before Sprint 700:** Use the interim phrases above and reframe verbally: "I'm using a slightly more formal phrasing — in the next version this will catch the natural shorthand too."

**Exact caveats:**
1. "Move Sarah up" → "Not recognized" (regex gap — 1-line fix pending)
2. "Show the raw coach note to the parent" → "Not recognized" (regex gap — 1-line fix pending)
3. "Where are the curriculum gaps?" → "Not recognized" (P1 — routing gap pending)
4. Data-dependent responses (attention report, player intelligence) require seeded Supabase

**Fallback plan:**
- Prepare alternative phrasings for K and M (above)
- Have the Sprint 698 fallback script ready
- Do not promise Realtime voice unless tested

**Whether to stop building and test:** Stop building new features now. Run Sprint 700 (targeted fixes only), then test. No new feature expansion until ≥ 80/100.

---

## 9. Recommended Sprint 700

### Sprint 700 — DONNA Final COO Hardening V1

**Type:** Targeted fix sprint. No new features. No refactoring.

**Exact fixes (5 items):**

1. **Fix "Move Sarah up" (P0)**
   - File: `src/lib/donna/donnaIntentClassifier.ts`
   - Change: Add to `level_movement` signals: `/move \w+ (up|down)/` to catch "move [name] up/down" phrasing
   - Validates: Scenario K

2. **Fix "Show the raw coach note to the parent" (P0)**
   - File: `src/lib/donna/donnaIntentClassifier.ts`
   - Change: Add to `unsafe_visibility_request` signals: `/show.*raw.*coach.*note.*to.*parent/` or the broader `/show.*coach.*note.*to.*parent/`
   - Validates: Scenario M

3. **Fix "Where are the curriculum gaps?" (P1)**
   - File: `src/lib/donna/donnaConversationalRouter.ts`
   - Change: Add `lower.includes('curriculum gap') || lower.includes('gaps in the curriculum')` to `isPageQuestion`
   - Validates: Scenario G

4. **Wire recordRouteChange (P2)**
   - File: `src/components/assistant/DonnaAssistantButton.tsx`
   - Change: In the route-change `useEffect` (Sprint 683 block, ~line 966), call `recordRouteChange(pathname, getPageCapabilityMap(pathname).pageLabel)` from `donnaSafeSessionMemory`
   - Validates: Cross-route session continuity

5. **Re-run all 15 QA scenarios** from Sprint 696 after the above fixes
   - Target: All P0s and P1s resolved
   - Target score: ≥ 75/100 before Brian demo
   - Create `docs/DONNA_SPRINT_700_QA_RESULTS.md` with results

**What Sprint 700 must NOT do:**
- No new COO features
- No additional intelligence modules
- No mobile layout changes
- No Realtime TTS wiring
- No additional memory modules
- No new routes or pages

After Sprint 700: **Brian demo is ready.**

---

## 10. Files Inspected (Read Only)

| File | Purpose |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Live command routing, Sprint 697 wiring verification, handleCommandSubmit/handleVoiceTranscript full trace |
| `src/components/assistant/DonnaVoiceLayer.tsx` | Voice input layer, chips, transcript display |
| `src/lib/donna/donnaConversationalRouter.ts` | isSystemQuestion, isPageQuestion, routeDonnaPrompt logic |
| `src/lib/donna/donnaResponseComposer.ts` | composeDonnaResponse, composePageContextAnswer, composeSystemFlowAnswer |
| `src/lib/donna/donnaIntentClassifier.ts` | classifyDirectorIntent, level_movement signals, unsafe_visibility_request signals |
| `src/lib/donna/donnaPageContextEngine.ts` | whereAmI, whatCanYouHelpWith, whatActionsRequireApproval, whatShouldINotDo |
| `src/lib/donna/donnaSystemMap.ts` | howDoesThisSystemWork, howDoesParentUpdateGetApproved, all system answers |
| `src/lib/donna/donnaSafeSessionMemory.ts` | recordPrompt, recordSummary, buildContinuityMessage |
| `src/lib/donna/donnaActionPreviewIntegration.ts` | getActionPreviewForRequest — confirmed not wired |
| `src/lib/donna/donnaDirectorPromptPalette.ts` | getDonnaPromptSuggestions, route-aware chips |
| `docs/DONNA_GOLDEN_CONVERSATION_QA_696.md` | Sprint 696 QA baseline |
| `docs/DONNA_BRIAN_DEMO_COO_SCRIPT_698.md` | Demo script against which demo-safety was evaluated |
| `docs/CHANGELOG.md` | Sprint history |

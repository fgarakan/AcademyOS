# DONNA Golden Path Conversation QA
**Sprint 696 — 2026-05-23**
**Scope:** Honest assessment of DONNA live experience after Sprints 682–695.
**Method:** Source-code inspection of all DONNA routing, command handling, and COO intelligence modules. No runtime execution.

---

## 1. Executive Summary

### What is now working
- Daily greeting fires once per day with page-aware re-entry copy (Sprint 685). ✓
- 8-state header indicator: Speaking / Listening / Paused — active / Stopped / Ready / Mic blocked / Voice unavailable / Thinking (Sprints 685, 694). ✓
- Persistent voice listening in Chrome/Edge: `persistent={true}`, `maxRetries={5}` (Sprint 684). ✓
- Route changes no longer kill voice state or DONNA panel (Sprint 683). ✓
- `panelOpen` state lives in layout-level context (Sprint 686). ✓
- Attention report: `isAttentionPhrase` → `/api/donna/attention` endpoint (Sprint 370). ✓
- Review queue: `isReviewQueuePhrase` → `handleOpenReviewQueue()`. ✓
- Daily brief: `isDailyBriefPhrase` → `/api/donna/brief` endpoint (Sprint 369). ✓
- "Draft a parent update" → `setCommunicationDraft()` → guided draft flow. ✓
- Protected phrases blocked: save/approve/send/execute (Sprint 346). ✓
- "What page am I on?" (exact phrase) → `ctx.purpose` response. ✓
- Route-aware prompt chips update per route (Sprint 695). ✓
- TTS cancelled on route change (Sprint 693). ✓
- "DONNA says" context card, Thinking badge (Sprint 694). ✓
- Template creation intent → guided draft. ✓

### What is partially working
- Page-aware answers: chips ARE page-specific visually, but answers route through legacy keyword matching, not through `donnaPageContextEngine`. Phrases like "Where am I?" fall through if they don't match the exact `what page am i` substring.
- Session continuity: `updatePrompt` stores in React context (in-memory), not in `donnaSafeSessionMemory` sessionStorage. Context is lost on panel close and full reload.
- Voice speaking: browser TTS works; Realtime TTS requires `OPENAI_API_KEY` — absent by default.
- Unsafe request blocking: explicit approval/save phrases are blocked, but "Move Sarah up" and "Show the raw coach note to the parent" fall through to "Not recognized" rather than an explicit COO-style block.

### What is NOT yet wired
The following modules were built in Sprints 687–692 but are **not called** in any live command path:

| Module | Sprint | Used in live flow? |
|---|---|---|
| `routeDonnaPrompt` | 689 | ❌ Not called in `handleCommandSubmit` / `handleVoiceTranscript` |
| `composeDonnaResponse` | 690 | ❌ Not called anywhere in live flow |
| `getActionPreviewForRequest` | 692 | ❌ Not called in live flow |
| `donnaSafeSessionMemory` | 691 | ❌ `updatePrompt` routes to React context, not sessionStorage |
| `donnaPageContextEngine` (answers) | 687 | ❌ Used only as chip label source; `whatCanYouHelpWith`, `whereAmI` not called live |
| `donnaSystemMap` (answers) | 688 | ❌ Never called in live flow |

### Does DONNA feel ChatGPT-like?
**Partially.** Specific supported flows (attention, review queue, drafts) feel functional. Natural free-text questions ("How does this system work?", "Which academy signal matters most?") currently return "Not recognized" — the opposite of ChatGPT.

### Does DONNA feel COO-like?
**Not yet at 10/10.** The page-aware chips, greeting, and "DONNA says" context card create the right visual framing. But the answer quality for natural COO questions is limited until the conversational router is wired.

### What blocks 10/10 experience
1. **Conversational router not wired** — `routeDonnaPrompt` + `composeDonnaResponse` not connected to `handleCommandSubmit`. Most natural language falls through to "Not recognized."
2. **COO intelligence dead code** — Sprints 687–692 built strong modules; none are in the live call path.
3. **Unsafe request gaps** — "Move Sarah up" and "Show the raw coach note" reach "Not recognized" instead of a COO-style block with a safe alternative.
4. **Session memory not used** — `donnaSafeSessionMemory` built; `updatePrompt` routes to React context only.

---

## 2. Test Environment Assumptions

- **Browser:** Chrome or Edge required for SpeechRecognition. Firefox: voice input unavailable, typed chat works. Safari: partial, may behave inconsistently.
- **Unsupported browsers:** DONNA shows "Voice unavailable" badge; typed input always available.
- **Voice:** `persistent={true}` active in Chrome/Edge. Realtime TTS requires `OPENAI_API_KEY` on the server. Browser TTS (`speechSynthesis`) is the fallback — works in Chrome/Edge/Safari.
- **localStorage:** Greeting key `academyos:donna:lastDonnaGreetingDate:v1` persists across browser sessions. No sensitive data in localStorage.
- **sessionStorage:** `donnaSafeSessionMemory` key present in module but not actively written by live flow.
- **Demo data:** Attention and daily brief endpoints return data only if Supabase is connected with seeded academy data. In cold demo mode these may return "Could not load."
- **No SQL/migration changes:** This sprint is QA-only. No schema, RLS, or seed changes.

---

## 3. Golden Path Test Matrix

### A. First-open daily greeting

| Field | Detail |
|---|---|
| Route | `/director` |
| Input | Clear localStorage key → Open `/director` → Click DONNA |
| Expected | Full time-of-day greeting, director name if available, no auto-mic |
| Actual | `shouldShowDailyDonnaGreeting()` → `buildDonnaOpeningGreeting(firstName, pathname, true)` → sets `dailyGreetingState`, marks greeting shown. Name used if `firstName` prop is populated. `speakAssistantText` called if `speechSynthesis` available. Mic does NOT auto-start. |
| **Result** | **PASS** |
| Severity | — |
| Notes | No sensitive data stored. localStorage key stores only a date string. |

---

### B. Later same-day re-entry

| Field | Detail |
|---|---|
| Route | Any `/director/*` |
| Input | Close DONNA → Reopen same day |
| Expected | Short contextual re-entry message, no repeat of full greeting |
| Actual | `shouldShowDailyDonnaGreeting()` returns false → `buildDonnaOpeningGreeting(firstName, pathname, false)` → returns route-specific re-entry text (8 route patterns defined in `donnaGreeting.ts`) |
| **Result** | **PASS** |
| Severity | — |
| Notes | Re-entry copy varies by route. `/director/review` returns "There are items waiting for your review." |

---

### C. Page-aware re-entry

| Field | Detail |
|---|---|
| Route | `/director/review` |
| Input | Navigate to review page → Open DONNA |
| Expected | Review-specific contextual greeting |
| Actual | `buildDonnaOpeningGreeting` checks pathname. `/director/review` maps to re-entry text: "There are items waiting for your review. Start with the ones marked urgent." |
| **Result** | **PASS** |
| Severity | — |
| Notes | 8 specific routes mapped; others fall through to generic "I'm here. What do you need?" |

---

### D. Dashboard command chip — "What should I do first today?"

| Field | Detail |
|---|---|
| Route | `/director` |
| Input | Click chip "What should I do first today?" |
| Expected | Routes through command flow; shows academy attention items or useful answer |
| Actual | `onCommandSubmit("What should I do first today?")` → `handleCommandSubmit` → `isAttentionPhrase` matches `what should i do first` → `handleFetchAttention()` → `/api/donna/attention` → renders `AttentionReport` card |
| **Result** | **PARTIAL** |
| Severity | P2 |
| Notes | The response is functional (shows attention report) but is not a COO-style natural language answer. In demo mode with seed data the card shows real content. Without data it shows "Could not load attention items. Try again." The COO conversational router would produce a richer, contextual answer. |
| Likely sprint to fix | Sprint 697 — wire conversational router |

---

### E. Player route chip — "Which players need attention?"

| Field | Detail |
|---|---|
| Route | `/director/players` |
| Input | Navigate to `/director/players` → Click chip "Which players need attention?" |
| Expected | Player-specific, page-aware answer |
| Actual | `isAttentionPhrase` matches `needs attention` → `handleFetchAttention()` → renders same generic `AttentionReport` card. NOT a player-directory-specific response. |
| **Result** | **PARTIAL** |
| Severity | P2 |
| Notes | The chip correctly shows on the players page (Sprint 695 ✓). The response is the generic attention endpoint, not a player-specific COO answer. `getPageCapabilityMap('/director/players')` and `whatCanYouHelpWith` are not used in the answer path. |
| Likely sprint to fix | Sprint 697 — wire conversational router |

---

### F. Review route chip — "What needs approval first?"

| Field | Detail |
|---|---|
| Route | `/director/review` |
| Input | Click chip "What needs approval first?" |
| Expected | Review-specific answer; no automatic approval |
| Actual | `isReviewQueuePhrase` matches `what needs approval` → `handleOpenReviewQueue()` → renders review queue card with pending items list. No automatic approval applied. |
| **Result** | **PASS** |
| Severity | — |
| Notes | Functional and safe. Review queue shows live data or "0 pending" in demo. |

---

### G. Curriculum chip — "Where are the curriculum gaps?"

| Field | Detail |
|---|---|
| Route | `/director/curriculum` |
| Input | Click chip "Where are the curriculum gaps?" |
| Expected | Curriculum-specific answer |
| Actual | Does not match `isAttentionPhrase`, `isReviewQueuePhrase`, `isDailyBriefPhrase`, `isPredictiveSuggestionPhrase`, `isContextQueryPhrase`, `detectTaskIntent`, or `detectAndHandleCommand` nav patterns → falls through to `getFailureMode('intent_unknown')` → "Not recognized" |
| **Result** | **FAIL** |
| Severity | P1 |
| Notes | P1: "Not recognized" on a chip DONNA itself suggested is a visible UX failure. Must be fixed before demo. |
| Likely sprint to fix | Sprint 697 — wire conversational router. `routeDonnaPrompt("Where are the curriculum gaps?", "/director/curriculum")` would correctly return `use_page_context` mode with a curriculum-specific answer via `composeDonnaResponse`. |
| Files | `src/components/assistant/DonnaAssistantButton.tsx:handleCommandSubmit`, `src/lib/donna/donnaConversationalRouter.ts`, `src/lib/donna/donnaResponseComposer.ts` |

---

### H. "Where am I?"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type or speak: "Where am I?" |
| Expected | Should use page context engine; return current page label and purpose |
| Actual | `detectAndHandleCommand` checks `lower.includes('what page am i')` → NOT matched by "where am i" → falls through → "Not recognized" |
| **Result** | **FAIL** |
| Severity | P1 |
| Notes | "What page am I on?" (exact) DOES work → returns `ctx.purpose`. But "where am I" does not. The page context engine has `whereAmI(pathname, firstName)` ready but unused. |
| Likely sprint to fix | Sprint 697 — add phrase to `detectAndHandleCommand` or wire router which already detects this pattern |
| Files | `src/components/assistant/DonnaAssistantButton.tsx:2173-2182`, `src/lib/donna/donnaPageContextEngine.ts:whereAmI` |

---

### I. "What can you help me with here?"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type: "What can you help me with here?" |
| Expected | Should return page-specific DONNA capability list |
| Actual | Does not match any intent handler → "Not recognized" |
| **Result** | **FAIL** |
| Severity | P1 |
| Notes | `donnaConversationalRouter.ts` has `isPageQuestion` that explicitly matches this phrase. `whatCanYouHelpWith(pathname)` exists in `donnaPageContextEngine.ts`. Both are ready but not connected. |
| Likely sprint to fix | Sprint 697 |
| Files | `src/lib/donna/donnaConversationalRouter.ts:isPageQuestion`, `src/lib/donna/donnaPageContextEngine.ts:whatCanYouHelpWith` |

---

### J. "How does this system work?"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type: "How does this system work?" |
| Expected | Should use `donnaSystemMap`; return AcademyOS flow explanation |
| Actual | Does not match any live handler → "Not recognized" |
| **Result** | **FAIL** |
| Severity | P1 |
| Notes | `donnaConversationalRouter.ts` has `isSystemQuestion` that matches this phrase. `howDoesThisSystemWork()` in `donnaSystemMap.ts` returns a clean 3-sentence explanation. Both ready but not connected. |
| Likely sprint to fix | Sprint 697 |
| Files | `src/lib/donna/donnaConversationalRouter.ts:isSystemQuestion`, `src/lib/donna/donnaSystemMap.ts:howDoesThisSystemWork` |

---

### K. "Move Sarah up"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type or speak: "Move Sarah up" |
| Expected | Should route to review, not directly mutate. Should explain review path. |
| Actual | Does not match `VOICE_PROTECTED_PHRASES` (which only blocks "approve it", "save it" etc.) → falls through `detectAndHandleCommand` → "Not recognized" |
| **Result** | **FAIL** |
| Severity | P0 |
| Notes | P0: This must produce a COO-safe response ("I can prepare that for review, I won't move the player directly") not "Not recognized." The action preview integration (`getActionPreviewForRequest`) and conversational router (`level_movement` intent → `route_to_review`) are ready but not wired. "Not recognized" on a level-movement request is an incorrect safety signal — it neither blocks nor explains. |
| Likely sprint to fix | Sprint 697 |
| Files | `src/lib/donna/donnaActionPreviewIntegration.ts`, `src/lib/donna/donnaConversationalRouter.ts`, `src/lib/donna/donnaResponseComposer.ts:reviewRouteResponse` |

---

### L. "Draft a parent update"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type: "Draft a parent update" |
| Expected | Explain review/publish safety; start guided draft; no auto-publish |
| Actual | `lower.includes('parent update')` → `setCommunicationDraft(createCommunicationDraft('parent_update'))` → `setCommandResponse("I've started a parent update draft. What's the topic?")` → guided draft UI |
| **Result** | **PASS** |
| Severity | — |
| Notes | No parent update is published automatically. Director must fill the draft and explicitly approve. |

---

### M. Unsafe request — "Show the raw coach note to the parent"

| Field | Detail |
|---|---|
| Route | Any |
| Input | Type or speak: "Show the raw coach note to the parent" |
| Expected | Must block explicitly; explain safe alternative; never expose raw note |
| Actual | NOT in `VOICE_PROTECTED_PHRASES` (which only blocks approval/save commands). Falls through `detectAndHandleCommand` → "Not recognized." |
| **Result** | **FAIL** |
| Severity | P0 |
| Notes | P0: "Not recognized" is wrong here — it neither blocks nor explains. The correct response is the `unsafe_visibility_request` path in `donnaResponseComposer.ts:blockedResponse`. The `donnaConversationalRouter` would classify this as `unsafe_visibility_request` → `block_unsafe_request` mode. Must be wired before demo. |
| Likely sprint to fix | Sprint 697 |
| Files | `src/lib/donna/donnaConversationalRouter.ts`, `src/lib/donna/donnaIntentClassifier.ts`, `src/lib/donna/donnaResponseComposer.ts:blockedResponse` |

---

### N. Session recall — "What did we just talk about?"

| Field | Detail |
|---|---|
| Route | `/director/players` (after asking a question on `/director`) |
| Input | Ask a question on dashboard → Navigate to players → Type: "What did we just talk about?" |
| Expected | Safe memory should surface last prompt for continuity |
| Actual | `updatePrompt(text)` stores last prompt in React context (`lastPrompt: string`). This is in-memory only — not `donnaSafeSessionMemory` sessionStorage. "What did we just talk about?" does not match any handler → "Not recognized." |
| **Result** | **FAIL** |
| Severity | P2 |
| Notes | `donnaSafeSessionMemory.ts` has `buildContinuityMessage(memory, firstName)` and `buildPageConnectionMessage` ready. `recordPrompt()` just needs to be called from `handleCommandSubmit`. |
| Likely sprint to fix | Sprint 697 or 698 |
| Files | `src/lib/donna/donnaSafeSessionMemory.ts`, `src/components/donna/DonnaSessionContextProvider.tsx` |

---

### O. Voice loop — persistent listening across navigation

| Field | Detail |
|---|---|
| Route | `/director` → `/director/players` |
| Input | Start voice → Speak → Pause → Speak again → Navigate → Confirm DONNA stays open |
| Expected | Persistent listening active, paused/listening/thinking/speaking visible, no auto-mic, DONNA stays open after navigation |
| Actual | `persistent={true}`, `maxRetries={5}` wired in `DonnaVoiceLayer`. `VoiceInputButton` handles silence → pause → restart cycle (Sprint 684). Route change does NOT close panel (Sprint 683). TTS cancelled on navigation (Sprint 693). `voiceStateForIndicator` updates header badge correctly (Sprint 685/694). Mic NEVER starts without user click. |
| **Result** | **PASS** (Chrome/Edge) / **PARTIAL** (Safari) / **FAIL** (Firefox) |
| Severity | P3 (Firefox: no SpeechRecognition by design) |
| Notes | iOS Safari: may auto-stop due to OS constraints; `maxRetries=5` guard prevents infinite loop but session still ends. |

---

## 4. DONNA Score vs. 10/10 COO Target

| Category | Score | Reason |
|---|---|---|
| Persistent availability | **8/10** | Panel stays open across routes, session context preserved in React memory, TTS cancelled on navigation. −2 for no sessionStorage persistence across full reload. |
| Voice listening | **7/10** | Persistent works in Chrome/Edge with maxRetries guard. −3 for no Firefox/iOS support (by browser constraint), intermittent Safari behavior. |
| Voice speaking | **6/10** | Browser TTS functional; 8-state indicator clear; Realtime TTS requires unconfigured API key; long text can stall. |
| Page awareness | **4/10** | Chips are page-aware (Sprint 695). Greeting is page-aware. But command answers are NOT page-routed through context engine. "Where am I" fails. "What can you help with" fails. −6 for non-functioning COO answers. |
| System awareness | **2/10** | `donnaSystemMap` built and complete. Zero integration with live command flow. "How does this system work?" returns "Not recognized." |
| Conversation continuity | **4/10** | Last prompt stored in React context. "DONNA says" shows last response. No cross-route memory. No session recall. |
| Natural response quality | **4/10** | Attention/review/brief/draft parent work well. ~50% of natural COO questions return "Not recognized." |
| Review/action safety | **7/10** | Save/approve/send phrases blocked. Draft parent safe. But "Move Sarah up" and "Show raw coach note" reach "Not recognized" — neither blocked nor routed to review. |
| Mobile usability | **5/10** | Panel renders on mobile. Chips wrap. No mobile-specific layout pass done yet. |
| Demo readiness | **5/10** | Core flows (attention, review queue, drafts) work. COO conversational flows do not. P0/P1 gaps visible to any live demo audience. |
| **Total** | **52/100** | — |

---

## 5. Exact Remaining Wiring Gaps

### Are `routeDonnaPrompt` and `composeDonnaResponse` used in live `handleCommandSubmit`?

**No.** These functions exist in `donnaConversationalRouter.ts` and `donnaResponseComposer.ts` but are not imported by `DonnaAssistantButton.tsx`. `handleCommandSubmit` and `handleVoiceTranscript` use legacy keyword matching exclusively.

**Required change:** In `handleCommandSubmit`, after the controller check and before the legacy routing tree, add:
```typescript
const routing = routeDonnaPrompt(text, pathname)
const composed = composeDonnaResponse(routing, pathname, firstName)
// If handled by COO router, show composed.text and stop
```

### Is `getActionPreviewForRequest` used in live action requests?

**No.** `donnaActionPreviewIntegration.ts` is not imported by `DonnaAssistantButton`. Phrases like "Move Sarah up" reach "Not recognized" instead of the action preview path.

### Is `donnaSafeSessionMemory` used in live flow?

**No.** `donnaSafeSessionMemory.ts` exports are not imported in `DonnaAssistantButton`, `DonnaSessionContextProvider`, or any live component. `updatePrompt` in `DonnaSessionContextProvider` stores last prompt in React `useState` only — in-memory, not persisted to sessionStorage, not using `donnaSafeSessionMemory`.

### Are page-aware prompts only visual chips or actually answered by page context engine?

**Visual only.** Chips show page-specific prompts (Sprint 695). When clicked, the prompts route through `handleCommandSubmit` → legacy keyword matching. Only prompts that happen to match existing phrase matchers (attention, review queue, brief) produce functional answers. Others ("Where are the curriculum gaps?") return "Not recognized."

### Is `/director/donna` unified with the floating DONNA panel?

**No.** Two separate architectures remain:
- **Floating panel** (`DonnaAssistantButton`) — always-mounted in layout, persistent across routes, voice + typed
- **DONNA page** (`/director/donna` → `DonnaVoiceReadyShell`) — full-page chat, text-only, messages lost on navigation

Neither shares message history, conversation state, or session context with the other.

---

## 6. Recommended Next Sprints

### Sprint 697 — DONNA Conversational Router Live Wiring V1 (CRITICAL)

**Goal:** Wire `routeDonnaPrompt` + `composeDonnaResponse` into `handleCommandSubmit` as the first-pass handler before the legacy routing tree.

**Exact change:** After the controller check in `handleCommandSubmit`, add a COO router pass. If the router classifies the intent as `block_unsafe_request`, `route_to_review`, `use_page_context`, `use_system_map`, or `use_kpi_answer`, return the composed response and skip legacy routing. If `answer_directly` or `ask_clarification`, fall through to legacy routing as a supplement.

**P0 fixes this sprint includes:**
- "Move Sarah up" → `level_movement` → `route_to_review` → "I can prepare a proposal for your review"
- "Show raw coach note to parent" → `unsafe_visibility_request` → `block_unsafe_request` → explicit block message
- "How does this system work?" → `use_system_map` → `howDoesThisSystemWork()` answer
- "What can you help me with here?" → `use_page_context` → `whatCanYouHelpWith(pathname)` answer

**Files:** `src/components/assistant/DonnaAssistantButton.tsx`, `src/lib/donna/donnaConversationalRouter.ts`, `src/lib/donna/donnaResponseComposer.ts`

---

### Sprint 698 — DONNA Demo Mode COO Script V1

Create `docs/DONNA_BRIAN_DEMO_COO_SCRIPT_698.md` with an exact 5-minute demo script for the Brian/director demo. Covers the golden path: greeting → attention → player profile → draft parent update → review queue → voice demonstration. Covers what to say, what DONNA says, which chips to click. Also includes fallback instructions if any step fails.

---

### Sprint 699 — DONNA Mobile Voice + Chat COO Pass V1 (if Sprint 697 is clean)

Mobile layout pass: panel padding, chip wrapping on small screens, transcript display, voice button touch targets. Fix any mobile P1 issues surfaced by Sprint 697 integration.

---

### Sprint 700 — DONNA Final COO Hardening + Demo Go/No-Go V1

Re-run this QA matrix after Sprint 697 and 699. Re-score all 10 categories. Create `docs/DONNA_FINAL_COO_GO_NO_GO_700.md` with a binary go/no-go per P0/P1 criteria. Ship if P0s resolved and score ≥ 80/100.

---

## 7. Files Inspected (Read Only)

| File | Purpose |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Live command routing, state, TTS, greeting |
| `src/components/assistant/DonnaVoiceLayer.tsx` | Voice input layer, chips, transcript display |
| `src/components/assistant/donnaVoiceRuntime.ts` | Protected phrases, fallback messages |
| `src/lib/donna/donnaConversationalRouter.ts` | COO router (built, not wired) |
| `src/lib/donna/donnaResponseComposer.ts` | COO response templates (built, not wired) |
| `src/lib/donna/donnaPageContextEngine.ts` | Page capability maps (partial: chips only) |
| `src/lib/donna/donnaSystemMap.ts` | System module map (built, not wired) |
| `src/lib/donna/donnaActionPreviewIntegration.ts` | Action preview (built, not wired) |
| `src/lib/donna/donnaSafeSessionMemory.ts` | Session memory (built, not wired) |
| `src/lib/donna/donnaDirectorPromptPalette.ts` | Prompt chips (wired, visual-only answers) |
| `src/components/donna/DonnaSessionContextProvider.tsx` | Panel state, route context, last prompt |
| `docs/DONNA_FULL_VOICE_PERSISTENCE_AUDIT_682.md` | Prior audit baseline |
| `docs/CHANGELOG.md` | Sprint history |

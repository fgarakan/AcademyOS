# DONNA Sprint 701 — Post-700 Full Reaudit and 10/10 Gap Map

**Date:** 2026-05-23
**Sprint:** 701 — Post-700 DONNA Reaudit and 10/10 Gap Map
**Audit basis:** Full code inspection of live command path, all donna lib modules, response composers, UI wiring
**Prior audit:** Sprint 699 (60/100 across 10 categories); Sprint 700 added P0/P1 fixes
**Scoring scale:** 10 = works as well as can be done without live DB data; 9 = minor gaps only; ≤8 = actionable gap exists

---

## Executive Summary

After Sprints 697–700, DONNA's safety architecture is solid and the two P0 failures are fixed. However, honest re-scoring across 17 certification categories reveals **8 categories still below 5/10**. The core problem: dozens of intelligence modules (KPI explainer, roster intel, chat session memory, action preview cards, continuity messages) exist as complete TypeScript code but are not imported or called in the live command path (`handleDonnaCooPrompt` → `composeDonnaResponse`). DONNA's answers are structurally safe but informationally shallow because the right data is never injected.

**Current certification verdict: NOT CERTIFIED — exact blockers documented below.**

---

## Full 17-Category Re-Score

| # | Category | Score | Status |
|---|---|---|---|
| 1 | Conversational quality | 7/10 | Blocked by context awareness |
| 2 | Persistent availability | 8/10 | One gap: mobile panel UX |
| 3 | Page awareness | 7/10 | Good routing; shallow answers |
| 4 | Context awareness | 4/10 | P0 — chat session memory not wired |
| 5 | Role awareness | 6/10 | P1 — COO router ignores role |
| 6 | System awareness | 7/10 | Good routing; `getModuleDefinition` unused |
| 7 | Action preview safety | 4/10 | P0 — preview cards not rendered |
| 8 | Review queue intelligence | 6/10 | P1 — static text, no live count |
| 9 | KPI intelligence | 3/10 | P0 — `kpiExplainer` not wired |
| 10 | Roster/player intelligence | 4/10 | P0 — `tryAnswerRosterAttentionQuestion` not wired |
| 11 | Curriculum intelligence | 3/10 | P0 — dataFallback only, no curriculum data |
| 12 | Parent-safe communication | 9/10 | PASS — Sprint 700 fixes confirmed |
| 13 | Voice input reliability | 6/10 | P1 — Firefox unsupported, no fallback messaging |
| 14 | Voice output reliability | 6/10 | P1 — long answers spoken untruncated |
| 15 | Mobile usability | 3/10 | P0 — no mobile layout, 90vw drawer on phone |
| 16 | Demo readiness | 7/10 | Good; action preview cards still missing |
| 17 | Pilot readiness | 5/10 | Blocked by tiers 1-3 gaps |

**Overall: 98/170 (58%). Certification target: ≥9/10 in every category.**

---

## Category-by-Category Evidence

### 1. Conversational quality — 7/10

**What works:**
- `composeDonnaResponse` produces warm, direct, COO-quality text for all 11 routing modes
- `blockedResponse`, `reviewRouteResponse`, `clarificationResponse` are well-written
- System map answers (coach recap → parent update flow) are substantive
- Sprint 700 "Move Sarah up" and "Show the raw coach note" now produce correct responses

**Gaps:**
- No follow-up memory: each prompt is stateless. "You asked me about Sarah earlier" is impossible.
- `donnaChatSessionMemory.ts` (Sprint 1032) tracks `ConversationTurn[]` but is never imported in `DonnaAssistantButton.tsx`.
- `commandResponse` is a single-message slot — prior responses are not displayed in a thread. The director cannot see what DONNA said 2 turns ago.
- The ChatGPT-like multi-turn feel requires visible conversation history.

**Fix in:** Sprint 702 (context awareness / chat session memory wiring)

---

### 2. Persistent availability — 8/10

**What works:**
- Panel always-mounted in director layout via `DonnaAssistantButton`
- `panelOpen` survives route changes via `DonnaSessionContextProvider` (Sprint 686)
- Voice stays active across director navigation (Sprint 683)
- `recordRouteChange` now fires on every navigation (Sprint 700)
- `donna:open` custom event dispatch from page-level "Ask DONNA" buttons

**Gaps:**
- Mobile: panel is a right-side drawer (`w-96 max-w-[90vw]`). On a 375px phone, this is a 338px overlay covering nearly the full screen with no bottom-sheet alternative.
- `DONNADirectorMobileCommandBar` component exists at `/src/components/donna/DONNADirectorMobileCommandBar.tsx` but is never imported or rendered from `DonnaAssistantButton.tsx`.

**Fix in:** Sprint 707 (mobile usability)

---

### 3. Page awareness — 7/10

**What works:**
- `isPageQuestion()` detects 13+ patterns and routes to `use_page_context`
- Sprint 700 added curriculum gap patterns with operator precedence fix
- `getPageCapabilityMap` covers 13 routes with pageLabel, directorIntent, suggestedPrompts, reviewRequiredActions, blocked, dataFallback
- "Where am I?" → `whereAmI(pathname)` produces correct page-contextual answer
- "What can you help me with here?" → `whatCanYouHelpWith(pathname)` produces correct page-contextual answer

**Gaps:**
- "What should I do first today?" routes to `dashboard_priority` → `use_page_context`, but `composeDonnaResponse` for this mode calls `whatCanYouHelpWith()` (generic) rather than a priority-specific answer. The director gets a capability list, not a prioritized action.
- `handleDonnaCooPrompt` dispatches `use_page_context` to `composePageContextAnswer` with 4 sub-types (`where_am_i`, `help_here`, `approval_actions`, `not_do`); `inspect_first` sub-type exists in `donnaPageContextEngine.ts` but is not wired.
- On KPI page, "What is causing this KPI to be low?" correctly classifies as `kpi_explanation` but the answer is static (score depressed in category 9).

**Fix in:** Sprint 704 (page awareness / priority answer depth)

---

### 4. Context awareness — 4/10

**What works:**
- `recordPrompt(text)` called on every COO-handled response (Sprint 697)
- `recordSummary(text)` called on every COO-handled response (Sprint 697)
- `recordRouteChange(pathname, moduleLabel)` called on every navigation (Sprint 700)
- `donnaSafeSessionMemory` sessionStorage is being written for first time this sprint series

**Gaps (critical):**
- `buildContinuityMessage(memory, firstName)` exists but is NOT called anywhere in the panel-open path. The director gets a generic greeting every time — no "you were working on X earlier" re-entry.
- `buildPageConnectionMessage` similarly exists but is never called.
- `donnaChatSessionMemory.ts` (Sprint 1032) defines `ConversationTurn[]`, `initChatSession`, `recordTurn`, `getLastTurns`. It is never imported in `DonnaAssistantButton.tsx` — confirmed by grep.
- Prior conversation turns are invisible to `handleDonnaCooPrompt`. A director asking "what about the attendance KPI specifically?" after "explain the KPIs" gets a context-free response.
- `getSessionMemory()` is never called to hydrate `handleDonnaCooPrompt` with prior prompts.

**Fix in:** Sprint 702 (chat session memory + continuity message wiring) — **highest-impact sprint**

---

### 5. Role awareness — 6/10

**What works:**
- `role = 'director' | 'coach'` prop exists and is used throughout `DonnaAssistantButton.tsx`
- Coach gets reduced task set: `capture_coach_note`, `draft_player_note` only
- `isModeAllowedForRole` gates mode display in the mode selector
- Coach sees `COACH_QUICK_LINKS` vs director `QUICK_LINKS`
- `role === 'coach'` prevents review queue loading, daily brief, KPI loading
- Daily greeting copy branches on role

**Gaps:**
- `handleDonnaCooPrompt(text)` does NOT receive `role`. The COO router processes all prompts identically for director and coach.
- A coach saying "Move Sarah up" gets the same `route_to_review` response as a director — but coaches cannot approve level movements. The response should say "that requires director approval" for coaches.
- `routeDonnaPrompt(text, pathname)` has no `role` parameter — the entire conversational router is role-blind.
- `donnaRoleBoundaries.ts` defines role logic but is not used in the COO router path.

**Fix in:** Sprint 703 (role-aware COO router)

---

### 6. System awareness — 7/10

**What works:**
- `isSystemQuestion()` detects 10 patterns and routes to `use_system_map`
- `composeSystemFlowAnswer` covers 6 question types with substantive answers
- `donnaSystemMap.ts` covers 11 modules with purpose, safe actions, blocked actions, downstream effects
- "How does a parent update get approved?" → correct system flow answer
- "How does this system work?" → correct system overview

**Gaps:**
- `getModuleDefinition(id)` is imported in `donnaConversationalRouter.ts` but never actually called in routing logic — it was imported at Sprint 689 but the calling code was never written.
- "What is connected to the player profile?" does not match `isSystemQuestion()` — needs "what is connected" added. Currently matches because "what is connected" IS in `isSystemQuestion()` — actually it IS: `lower.includes('what is connected')`. Let me re-check...

Actually looking at the code again:
```
return (
    lower.includes('how does') ||
    lower.includes('how do') ||
    lower.includes('what is connected') ||  // ← YES, this is there
    ...
```

So "what is connected to the player profile?" DOES match. Let me re-check the gap.

The real gap is:
- `getModuleDefinition` is imported but never called in the routing or response composition
- Questions like "What does the review center do?" would need to match `isSystemQuestion()` — "what does" is not in the patterns
- Questions like "Tell me about the KPI module" don't match any pattern

**Fix in:** Sprint 705 (system awareness depth)

---

### 7. Action preview safety — 4/10

**What works:**
- `build_action_preview` mode produces a text response: "Before I do anything, here's what would happen..."
- `route_to_review` correctly routes to Review Center with safe text
- Safety guardrails prevent DB mutations
- `donnaActionPreviewIntegration.ts` is a complete implementation of `getActionPreviewForRequest` → `ActionPreviewResult`
- `DonnaActionPreviewCard` component exists at `/src/components/donna/DonnaActionPreviewCard.tsx`

**Gaps (critical):**
- `getActionPreviewForRequest` is never imported or called from `DonnaAssistantButton.tsx` — confirmed by grep.
- `DonnaActionPreviewCard` is never rendered from `DonnaAssistantButton.tsx` — confirmed by grep.
- Director asks "Move Sarah up" and gets text-only response. They cannot see "What will happen: level proposal added to review queue. What will NOT happen: no level change, no parent notification. Approval required: YES."
- Visual preview cards are the core UX that makes DONNA feel like a COO rather than a chatbot.

**Fix in:** Sprint 704 (action preview cards wiring)

---

### 8. Review queue intelligence — 6/10

**What works:**
- `getDonnaReviewQueueAction` is called on panel open; `reviewQueuePendingCount` is shown in the UI badge
- "What needs approval first?" routes to `use_review_context` → clear explanation of review center
- The review center explanation correctly states "nothing is live until you approve it"

**Gaps:**
- `use_review_context` response is completely static — it doesn't include the actual pending count, categories, or priority items
- The director asks "What needs approval first?" and gets a generic explanation rather than "You have 3 items: 1 parent update (highest risk), 1 level change, 1 curriculum draft"
- `reviewQueuePendingCount` is available in component state but NOT passed to `handleDonnaCooPrompt`
- `approvalCenterQueries.ts` and `reviewQueueContextPackage.ts` exist but are not connected to the COO answer path

**Fix in:** Sprint 706 (review queue live count injection)

---

### 9. KPI intelligence — 3/10

**What works:**
- `kpiExplainer.ts` exists with per-KPI templates for `healthy / warning / critical` states
- `isSystemQuestion()` catches "what is attendance rate" and routes to `use_system_map`
- `kpi_explanation` and `kpi_priority` intents are classified correctly by `classifyDirectorIntent`

**Gaps (critical):**
- `use_kpi_answer` response is a hard-coded generic string: "KPI data reflects real activity in your academy — attendance records, coach sessions, and assessment results. A low KPI usually means either the data pipeline isn't yet populated, or there's a real gap to address."
- `kpiExplainer` is NEVER called from `composeDonnaResponse` or `handleDonnaCooPrompt`. The rich per-KPI templates are completely unused in the live path.
- Live KPI values are not available in `handleDonnaCooPrompt` — only `pathname` and text are passed.
- "Why is attendance low?" gets the same response as "Why is level readiness low?" — no differentiation.

**Fix in:** Sprint 705 (KPI explainer wiring)

---

### 10. Roster/player intelligence — 4/10

**What works:**
- `roster_attention` intent is classified correctly
- `use_roster_intel` mode returns directional guidance
- "Which players need attention?" correctly routes to `use_roster_intel`

**Gaps (critical):**
- `use_roster_intel` response is static: "I can help identify players who need attention... Navigate to the player directory."
- `tryAnswerRosterAttentionQuestion` in `directorPlayersDonnaIntelligence.ts` is never called from the live command path.
- `playerAttentionRiskLoader.ts` exists but is not connected to COO answers.
- Director gets navigation guidance rather than actual "Sarah missed 3 sessions, Emma's coach notes are overdue."

**Fix in:** Sprint 706 (roster intel live injection)

---

### 11. Curriculum intelligence — 3/10

**What works:**
- Sprint 700 added curriculum gap routing to `isPageQuestion()`
- Curriculum page questions now return the curriculum page capability map answer (not "Not recognized")
- The `dataFallback` is honest: "Curriculum data may not be fully loaded. I can explain how the curriculum system is structured."

**Gaps (critical):**
- All curriculum answers use `dataFallback` — no actual curriculum data is surfaced
- `curriculumBuilderDonnaContext.ts` and `curriculumBottleneckLoader.ts` exist but are not connected
- "Where are the curriculum gaps?" produces an honest limitation answer but not an actual gap analysis

**Fix in:** Sprint 706 (curriculum intel routing) — lower priority than KPI and roster

---

### 12. Parent-safe communication — 9/10

**What works:**
- Sprint 700 P0 fix confirmed: "Show the raw coach note to the parent" → `block_unsafe_request`
- `unsafe_visibility_request` is checked FIRST before all other intent scoring
- 6 new broad-match regex patterns catch all natural variants
- `blockedResponse` provides explicit blocking text + safe alternative
- `parent_summary` → `route_to_review` correctly gates all parent content behind director approval
- No path from DONNA chat to direct parent communication

**Remaining gap (minor):**
- "Email the parent directly" pattern not covered in `unsafe_visibility_request`. But "send to parent" IS covered via existing `parent_draft` category → `route_to_review`. Safe enough for 9/10.

---

### 13. Voice input reliability — 6/10

**What works:**
- `handleVoiceTranscript` is wired to COO router (Sprint 697)
- Voice input follows same command path as typed input — parity achieved
- Voice watchdog (`voiceWatchdogRef`) handles stuck states
- `VoiceInputButton` manages `MediaRecorder`/`SpeechRecognition` abstraction
- Wake word detection implemented

**Gaps:**
- Firefox: browser `SpeechRecognition` API is not supported — no user-facing message explaining this limitation
- Voice transcript confidence display is complex; interim transcript may confuse users during long pauses
- No "voice not available" graceful degradation to text-only mode with a clear explanation

**Fix in:** Sprint 708 (voice input reliability messaging)

---

### 14. Voice output reliability — 6/10

**What works:**
- `speakDonna` cascades: server TTS (OpenAI) → browser synthesis → silent
- Sprint 693 cancels active TTS on navigation (no stale voice after route change)
- `isSpeaking` state updates correctly; `setIsSpeaking(false)` on done/error
- TTS triggered on all COO router responses

**Gaps:**
- System map answers (e.g., `howDoesThisSystemWork()`) are ~200 words — spoken in full with no truncation
- Long TTS responses take 30+ seconds at browser synthesis speed; directors abandon the panel
- No max-character limit before `speakDonna` is called
- OpenAI TTS requires env key — in demo environments without it, browser synthesis quality is inconsistent

**Fix in:** Sprint 708 (voice output truncation + reliability)

---

### 15. Mobile usability — 3/10

**What works:**
- Panel width is `max-w-[90vw]` — technically fits on mobile
- Text input and voice button are accessible on mobile
- The panel is scrollable

**Gaps (critical):**
- `w-96 max-w-[90vw]` is a right-side drawer on all screen sizes. On a 375px phone it covers 338px — nearly the full viewport. No bottom sheet alternative.
- `DONNADirectorMobileCommandBar` component exists at `/src/components/donna/DONNADirectorMobileCommandBar.tsx` but is never imported or rendered from `DonnaAssistantButton.tsx`.
- No responsive breakpoints — the component renders identically on 1440px desktop and 375px mobile.
- Director dashboard on mobile with DONNA panel open leaves ~37px of the underlying page visible — unusable.

**Fix in:** Sprint 707 (mobile usability — bottom sheet + mobile command bar)

---

### 16. Demo readiness — 7/10

**What works:**
- Sprint 698 demo script is complete and accurate
- All 12 demo prompts route safely (K and M now fixed by Sprint 700)
- Demo scorecard (10 binary checks) exists
- Fallback script documented for "Not recognized", voice failure, empty data
- Brian demo path: 5-minute flow confirmed safe

**Remaining gaps:**
- "Move Sarah up" during demo shows text-only response. No visual preview card showing "What will happen / What won't happen / Approval required." This is the moment when DONNA needs to look like a COO system — text alone is less impressive.
- "Which players need attention?" returns navigation guidance rather than surfacing actual at-risk players (Score 10 gap)
- "What needs approval first?" returns static text rather than live pending count

**Fix in:** Resolves after Sprint 704 (action preview) and Sprint 706 (live data injection)

---

### 17. Pilot readiness — 5/10

**What works:**
- Safety architecture is solid (no mutations from chat, all sensitive actions blocked or gated)
- Role awareness gates coach vs director capabilities
- Session memory is now being written
- All safety regression prompts produce correct responses

**Gaps:**
- Context awareness gap (4/10) means DONNA cannot reference prior conversation — fails "ChatGPT-like" requirement
- Mobile usability gap (3/10) means pilot users on phones have a poor experience
- KPI/roster/curriculum intelligence gaps mean DONNA cannot answer substantive operational questions
- No continuity message on panel open — every session feels like the first

**Certification requires:** Sprints 702–708 minimum

---

## Exact 10/10 Gap Map — Prioritized Sprint Plan

### Priority 1 (certification blockers — ship first)

**Sprint 702 — Context Awareness + Chat Session Memory**
- Wire `donnaChatSessionMemory.ts` into `handleCommandSubmit` and `handleVoiceTranscript`
- Record each turn as `ConversationTurn` with userMessage, donnaResponse, domain
- Pass last 3 turns to `handleDonnaCooPrompt` for follow-up context
- Wire `buildContinuityMessage` to panel-open path
- Target: Context awareness 4/10 → 8/10; Conversational quality 7/10 → 9/10

**Sprint 703 — Role-Aware COO Router**
- Add `role: DonnaRole` parameter to `handleDonnaCooPrompt`, `routeDonnaPrompt`, `composeDonnaResponse`
- For `coach` role: level_movement → "That requires director approval. I can help you capture an observation."; unsafe_visibility → same block; review queue items → explain director-only
- Target: Role awareness 6/10 → 9/10

**Sprint 704 — Action Preview Cards Wiring**
- Import `getActionPreviewForRequest` from `donnaActionPreviewIntegration`
- Render `DonnaActionPreviewCard` for `route_to_review` and `build_action_preview` modes
- Wire into `DonnaWorkflowCards` alongside existing `commandResponse` display
- Target: Action preview safety 4/10 → 9/10; Demo readiness 7/10 → 9/10

**Sprint 705 — KPI + System Awareness Depth**
- Wire `kpiExplainer` to `use_kpi_answer` mode: detect which KPI is being asked about (attendance, recap, curriculum coverage, etc.) and return the per-KPI template
- Add "what does" and "tell me about" patterns to `isSystemQuestion()` 
- Call `getModuleDefinition` for module-specific questions
- Target: KPI intelligence 3/10 → 8/10; System awareness 7/10 → 9/10

### Priority 2 (pilot readiness blockers)

**Sprint 706 — Live Data Injection (Review Queue + Roster)**
- Pass `reviewQueuePendingCount` + category breakdown into `use_review_context` response
- Wire `tryAnswerRosterAttentionQuestion` to `use_roster_intel` mode
- Target: Review queue intelligence 6/10 → 9/10; Roster/player intelligence 4/10 → 8/10

**Sprint 707 — Mobile Usability**
- Add responsive breakpoints: `<640px` → render bottom sheet instead of side drawer
- Import and conditionally render `DONNADirectorMobileCommandBar` on small screens
- Target: Mobile usability 3/10 → 8/10; Persistent availability 8/10 → 9/10

**Sprint 708 — Voice Reliability**
- Add Firefox detection and graceful "voice not supported in this browser — text works great" message
- Add TTS text truncation: max 150 characters before `speakDonna` call (with full text shown in UI)
- Target: Voice input reliability 6/10 → 8/10; Voice output reliability 6/10 → 8/10

### Priority 3 (certification audit)

**Sprint 709 — Full Regression + Certification Audit**
- Re-run all 17 categories
- Re-run all 15 golden path scenarios
- Create `docs/DONNA_10_OUT_OF_10_COO_CERTIFICATION.md`
- Issue final certification verdict

---

## Remaining P0/P1/P2/P3 Gap Registry

### P0 — Certification blockers (must fix before certification)
| ID | Description | Sprint |
|---|---|---|
| P0-A | Chat session memory not wired — DONNA is stateless between turns | 702 |
| P0-B | Action preview cards not rendered — text-only for `route_to_review` | 704 |
| P0-C | `kpiExplainer` not wired — `use_kpi_answer` returns generic text | 705 |
| P0-D | Mobile usability: 90vw drawer on phones, no bottom sheet | 707 |

### P1 — Significant gaps (must fix for pilot)
| ID | Description | Sprint |
|---|---|---|
| P1-A | COO router ignores `role` — coach gets director-level routing | 703 |
| P1-B | Review queue response is static — no live pending count | 706 |
| P1-C | `tryAnswerRosterAttentionQuestion` not wired — roster answer is navigation-only | 706 |
| P1-D | `buildContinuityMessage` not wired — no re-entry context on panel open | 702 |

### P2 — Notable gaps (improve quality)
| ID | Description | Sprint |
|---|---|---|
| P2-A | `getModuleDefinition` imported but never called | 705 |
| P2-B | Firefox voice: no user-facing explanation | 708 |
| P2-C | TTS speaks full long answers — no truncation before `speakDonna` | 708 |
| P2-D | Curriculum intelligence: dataFallback only, no structure data | 706 |
| P2-E | `inspect_first` sub-type not wired in `handleDonnaCooPrompt` | 704 |

### P3 — Polish items (nice to have)
| ID | Description | Sprint |
|---|---|---|
| P3-A | "Email the parent directly" not explicitly blocked (currently routes to parent_draft → review) | — |
| P3-B | `donnaChatSessionMemory` domain classification is generic | 702 |
| P3-C | Page awareness for `/director/support-diagnostics` is minimal | — |

---

## Sprint 702 Scope (immediate next sprint)

**Goal:** Wire `donnaChatSessionMemory` so DONNA can reference prior turns; wire `buildContinuityMessage` for panel-open re-entry.

**Files to modify:**
- `src/components/assistant/DonnaAssistantButton.tsx` — import `donnaChatSessionMemory`; call `initChatSession(role)` on mount; call `recordTurn(turn)` after each COO response; pass last N turns into `handleDonnaCooPrompt`; call `buildContinuityMessage` on panel open
- `src/lib/donna/donnaChatSessionMemory.ts` — verify `recordTurn` and `getLastTurns` API is sufficient; add `getLastTurns(n)` if missing
- `src/lib/donna/donnaSafeSessionMemory.ts` — no changes needed

**Files to create:** None (Sprint 702 is implementation only)

**Migration:** No

**Expected score gain:** Context awareness 4→8, Conversational quality 7→9, Pilot readiness 5→7

---

## Certification Status

**Current:** NOT CERTIFIED — 8 categories below 5/10  
**Blocking categories (below 9/10):** All 17 categories  
**Categories passing (≥9/10):** Parent-safe communication (9/10) only  
**Estimated sprints to certification:** 702 through 709 (7 more sprints)  
**Certification document:** Will be created in Sprint 709

---

*This document supersedes Sprint 699 audit scoring. All prior scoring is deprecated.*

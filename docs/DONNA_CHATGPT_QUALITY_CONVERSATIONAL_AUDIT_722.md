# Sprint 722 — DONNA ChatGPT-Quality Conversational Audit V1

**Date:** 2026-05-23
**Scope:** Full conversational intelligence audit against ChatGPT-quality operating assistant goal.
**Method:** Static code trace + 40-prompt mental regression + gap analysis.
**Goal verdict required:** CERTIFIED / DEMO-READY / PILOT-READY / NOT CERTIFIED

---

## How the current DONNA conversation loop works

```
User text/voice
    ↓
DonnaVoiceReadyShell.handleSend()
    ├── 1. checkQuestionBoundary()         [out-of-scope, role block, schema gap]
    ├── 2. tryAnswerKpiQuestion()           [KPI explanations]
    ├── 3. tryAnswerDashboardPriorityQuestion()  ["what should I do first?"]
    ├── 4. tryAnswerRosterAttentionQuestion()    ["who needs attention?"]
    ├── 5. tryDirectorClarificationOrBlock()    [clarify / block unsafe]
    ├── 6. tryBuildActionPreview()              [action preview for needs_review]
    ├── 7. detectActionIdFromText()             [keyword → safe read action]
    │      └── dispatchSafeReadAction()
    └── 8. Fallback: "I'm not sure how to answer that yet."
```

Key observations:
- All dispatch is deterministic — no LLM inference, no API calls
- No pending-action memory (each turn is stateless)
- No yes/no interpretation of previous DONNA offers
- Navigation is `<a href>` only — no active `router.push()`
- `DirectorDonnaContext` has: session counts, review counts, attention items, risks — but NO player count, coach count, or onboarding status

---

## 40-Prompt Regression

### Category 1: Onboarding / Setup

| # | Prompt | Expected behavior | Actual behavior | PASS/FAIL |
|---|---|---|---|---|
| 1 | "Can you help me with onboarding?" | Offer to navigate to onboarding | `detectActionIdFromText` returns null → fallback | **FAIL** |
| 2 | "How do I set up the academy?" | Explain onboarding flow + offer navigate | Fallback "I'm not sure how to answer that yet" | **FAIL** |
| 3 | "Walk me through getting started" | Step-by-step guidance + nav offer | Fallback | **FAIL** |
| 4 | "What's the first thing I should configure?" | Explain setup sequence | Fallback | **FAIL** |
| 5 | "I'm new to this, where do I start?" | Welcome + setup guidance | Fallback | **FAIL** |

**Category score: 0/5 pass**

---

### Category 2: Players

| # | Prompt | Context | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|---|
| 6 | "Which players need attention?" | Players exist, attention items | Lists flagged players | `tryAnswerRosterAttentionQuestion` → correct | **PASS** |
| 7 | "Which players need attention?" | No players in academy | "No player data — want me to take you to Add Players?" | `buildRosterHubAnswer` returns "No players flagged" (incorrect for no-data state) | **FAIL** |
| 8 | "Show me at-risk players" | Players exist | Lists by risk level | `tryAnswerRosterAttentionQuestion` → correct | **PASS** |
| 9 | "Who should I focus on today?" | No players | Explain player setup needed | Fallback | **FAIL** |
| 10 | "How many players do I have?" | Any | Count from context | Context has no playerCount → fallback | **FAIL** |

**Category score: 2/5 pass**

---

### Category 3: Coaches

| # | Prompt | Context | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|---|
| 11 | "Who should coach Orange Ball?" | No coaches | "Need coach setup — want me to take you to Add Coaches?" | `detectActionIdFromText` returns null → fallback | **FAIL** |
| 12 | "Who should coach Orange Ball?" | Coaches exist | Explain no assignment data available yet | Fallback (no coach assignment logic) | **FAIL** |
| 13 | "Which coaches need to wrap up?" | Live data | Mentions missingWrapUps | `tryAnswerRosterAttentionQuestion` misses this; `summarize_today` catches it | **PARTIAL** |
| 14 | "How are my coaches doing?" | Any | Coach health summary | Fallback | **FAIL** |
| 15 | "Add a coach" | Any | Navigate to Add Coaches | Fallback | **FAIL** |

**Category score: 0/5 pass** (1 partial)

---

### Category 4: Curriculum

| # | Prompt | Context | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|---|
| 16 | "Are there curriculum bottlenecks?" | Live | Curriculum gaps list | `detectActionIdFromText` → `academy_risks` → shows risks | **PARTIAL** |
| 17 | "Set up my curriculum" | Early setup | Explain curriculum setup + navigate | Boundary catch (`schema_gap`) for "curriculum" keyword | **FAIL** |
| 18 | "What curriculum levels do I have?" | Live | Level list | Fallback | **FAIL** |
| 19 | "How does curriculum coverage work?" | Any | System explanation | `isSystemQuestion()` → `use_system_map` → but `donnaConversationalRouter` not yet wired into `DonnaVoiceReadyShell` | **FAIL** |
| 20 | "What's missing from my curriculum?" | Any | Curriculum gap analysis | `checkQuestionBoundary` catches `curriculum.gap` pattern → schema_gap response | **PARTIAL** |

**Note:** `donnaConversationalRouter.ts` (Sprint 689) exists but is NOT imported or used in `DonnaVoiceReadyShell.tsx`. All 11 routing modes defined there (including `use_system_map`, `use_page_context`) are dead code in the live shell.

**Category score: 0/5 pass** (2 partial)

---

### Category 5: Missing data / context explanation

| # | Prompt | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| 21 | "Why can't you answer that?" | Explain missing dependency clearly | Fallback | **FAIL** |
| 22 | "What data do you need?" | Explain what's missing in context | Fallback | **FAIL** |
| 23 | "What information are you missing?" | Explain gaps | Fallback | **FAIL** |
| 24 | "I don't have any data yet — what do I do?" | Guide through data collection sequence | Fallback | **FAIL** |
| 25 | "Why is my review queue empty?" | Explain why — no coaches/sessions yet | Fallback | **FAIL** |

**Category score: 0/5 pass**

---

### Category 6: Navigation

| # | Prompt | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| 26 | "Take me to onboarding" | Navigate to /director/onboarding | Fallback | **FAIL** |
| 27 | "Open the review center" | Navigate to /director/review | Fallback (no nav action) | **FAIL** |
| 28 | "Show me the players page" | Navigate to /director/players | Fallback | **FAIL** |
| 29 | "Yes" (after DONNA offers navigation) | Execute navigation | Treated as new unknown prompt → fallback | **FAIL** |
| 30 | "No" (after DONNA offers navigation) | Acknowledge + stay | Treated as new unknown prompt → fallback | **FAIL** |

**Category score: 0/5 pass**

---

### Category 7: Yes/No follow-up handling

| # | Prompt | Context | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|---|
| 31 | User: "Can you help me with onboarding?" DONNA: "Yes, I can guide you. Want me to open it?" User: "Yes" | Pending nav offer | DONNA navigates to /director/onboarding | No pending offer stored, "Yes" → fallback | **FAIL** |
| 32 | User: "Which players need attention?" DONNA: "No data — want me to take you to Add Players?" User: "Sure" | Pending nav offer | DONNA navigates to /director/onboarding/players-placement | "Sure" → fallback | **FAIL** |
| 33 | User: "Want to go to review queue?" DONNA: "Yes, want me to take you there?" User: "Yeah" | Review context | Navigation | Fallback | **FAIL** |

**Category score: 0/3 pass**

---

### Category 8: Safety blocking

| # | Prompt | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| 34 | "Show the raw coach note to the parent" | Block + explain + safe alternative | `checkQuestionBoundary` catches it → `blocked` response | **PASS** |
| 35 | "Move this player up now" | Block direct mutation + offer review queue | `tryDirectorClarificationOrBlock` catches `move.*player.*now` | **PASS** |
| 36 | "Publish the parent update automatically" | Block + offer review | `tryDirectorClarificationOrBlock` catches `publish.*now` | **PASS** |
| 37 | "Access data from another academy" | Block + tenant isolation explanation | `tryDirectorClarificationOrBlock` catches `another academy` | **PASS** |
| 38 | "Expose coach notes to the parent" | Block | `donnaIntentClassifier` → unsafe_visibility_request | **PASS** |

**Category score: 5/5 pass**

---

### Category 9: KPI and dashboard

| # | Prompt | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| 39 | "What should I do first today?" | Priority summary from context | `tryAnswerDashboardPriorityQuestion` → correct answer with data | **PASS** |
| 40 | "What's the current attendance rate KPI?" | KPI explanation | `tryAnswerKpiQuestion` intercept → KPI answer | **PASS** |

**Category score: 2/2 pass**

---

### Additional prompts tested

| # | Prompt | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| 41 | "Draft a parent update for Lucas" | Clarify + route to review | `tryDirectorClarificationOrBlock` → `buildClarifyingAnswer` for parent_summary | **PASS** |
| 42 | "What pending items are in review?" | Review count + link | `detectActionIdFromText` → `show_pending_reviews` → correct | **PASS** |
| 43 | "What's my academy health score?" | Health summary | `detectActionIdFromText` → `academy_risks` → correct | **PASS** |
| 44 | "What is the review center?" | System explanation | `isSystemQuestion()` → router selects `use_system_map` — but router not wired | **FAIL** |
| 45 | "Help" (single word) | Offer guidance | `checkQuestionBoundary` returns null, falls through to fallback | **FAIL** |

---

## Pass/Fail Summary

| Category | Pass | Fail | Partial | Total |
|---|---|---|---|---|
| Onboarding/setup | 0 | 5 | 0 | 5 |
| Players | 2 | 3 | 0 | 5 |
| Coaches | 0 | 4 | 1 | 5 |
| Curriculum | 0 | 3 | 2 | 5 |
| Missing data explanation | 0 | 5 | 0 | 5 |
| Navigation | 0 | 5 | 0 | 5 |
| Yes/No follow-up | 0 | 3 | 0 | 3 |
| Safety blocking | 5 | 0 | 0 | 5 |
| KPI / dashboard | 2 | 0 | 0 | 2 |
| Additional | 3 | 2 | 0 | 5 |
| **Total** | **12** | **30** | **3** | **45** |

---

## 10-Dimension Score

| Dimension | Score | Rationale |
|---|---|---|
| Conversational intelligence | 3/10 | Handles safety, KPI, dashboard priority, roster attention. Fails on onboarding, coaches, navigation, missing data, "why can't you" |
| Missing-context explanation | 1/10 | Never explains what's missing for onboarding, coaches, curriculum. Only schema-gap boundary catches some cases |
| Onboarding guidance | 0/10 | Zero onboarding question handling. All fall through to fallback |
| Setup-state awareness | 1/10 | `DirectorDonnaContext` has no `playerCount`, `coachCount`, `isFirstTimeSetup`. Stubs added but queries deferred (Sprint 721 incomplete) |
| Pending-action memory | 0/10 | `donnaChatSessionMemory` has no `pendingNavOffer` state. Yes/no context is impossible |
| Yes/No follow-up handling | 0/10 | No yes/no pattern detection. "Yes" always falls through to fallback |
| Safe navigation | 1/10 | `followUpHref` renders an `<a>` tag — user can click links. No `router.push()` active navigation. Navigation intent not detected |
| Role awareness | 7/10 | Coach role blocks solid. Director intent classifier covers 10 intent types. Missing: parent/player role coverage in shell |
| Safety blocking | 9/10 | Raw note blocking, mutation blocking, tenant isolation, approval-required flows all working. Slight deduction: "show me player salary" type novel phrases may miss |
| Voice conversational UX | 4/10 | Voice input works (SpeechRecognition). TTS via browser speechSynthesis or server TTS. But conversation answers aren't "spoken as DONNA" — they're displayed. No greeting/intro response. Fallback is stilted. |

**Total: 26/100**

---

## Dead Code Found

### `donnaConversationalRouter.ts` — Sprint 689 — NEVER WIRED

The `routeDonnaPrompt()` function was built in Sprint 689 with 11 response modes:
- `answer_directly`, `ask_clarification`, `use_page_context`, `use_system_map`, `use_kpi_answer`, `use_roster_intel`, `use_review_context`, `build_action_preview`, `block_unsafe_request`, `route_to_review`, `explain_limitation`

**This module is NEVER imported by `DonnaVoiceReadyShell.tsx`.** All 11 routing modes are dead code.

Impact: DONNA cannot answer "What does the review center do?", "How does the system work?", "What page am I on?", "What can I do here?" — all of which route through `use_system_map` or `use_page_context`.

### `donnaMissingContextEngine.ts` — Sprint 721 — CREATED BUT NOT WIRED

The missing context engine was written in Sprint 721 but:
- `DonnaVoiceReadyShell.tsx` does NOT import it
- `DirectorDonnaContext` does NOT have live `playerCount`/`coachCount` queries
- The session memory does NOT have `pendingNavOffer` state

---

## Root Cause Analysis

### Gap 1: Stateless turn processing (P0)
Each `handleSend()` call is completely stateless. No memory of what DONNA asked last. This makes yes/no follow-up, navigation confirmation, and multi-turn flows impossible. Fix: add `pendingNavOffer` to session memory + detect yes/no in the shell.

### Gap 2: No onboarding intent (P0)
The intent classifier has no `onboarding` intent. No route in `handleSend` catches onboarding questions. Fix: add `donnaMissingContextEngine.detectMissingContext()` to the dispatch chain.

### Gap 3: `donnaConversationalRouter` never wired (P0)
Sprint 689 built a complete routing layer but it was never connected to the shell. This means `use_page_context`, `use_system_map`, `explain_limitation` modes never execute. Fix: wire `routeDonnaPrompt()` into the fallback path.

### Gap 4: No setup-state context (P1)
`DirectorDonnaContext` has no `playerCount` or `coachCount`. DONNA cannot detect early-setup state. Fix: add queries in `loadDirectorDonnaContext`.

### Gap 5: No active navigation (P1)
`followUpHref` renders as `<a>` tag — passive link only. DONNA cannot navigate programmatically after user confirms. Fix: add `useRouter` + `router.push()` when user confirms navigation via yes/no.

### Gap 6: Router system map never used (P1)
`donnaSystemMap.ts`, `donnaPageContextEngine.ts`, `donnaSystemMap.ts` exist but are not connected. "How does the system work?" and "What page am I on?" always fall through to fallback. Fix: wire `donnaConversationalRouter.ts`.

---

## Required Sprint Sequence to Certification

### Sprint 723 — Setup State Context + Player/Coach Count Queries (P0/P1)
**Files:** `src/lib/donna/directorDonnaContext.ts`
**What:** Add live `playerCount` and `coachCount` queries. These are the prerequisite for the missing context engine to work correctly.
**Risk:** None — additive queries, follows AI_BACKEND_RULES.md pattern.

### Sprint 724 — Pending Nav Offer Memory + Yes/No Interpretation (P0)
**Files:** `src/lib/donna/donnaChatSessionMemory.ts`, `src/components/donna/DonnaVoiceReadyShell.tsx`
**What:** Add `pendingNavOffer` state to session memory. Wire yes/no patterns in `handleSend` to consume and execute navigation.
**Risk:** None — additive to session memory, additive intercept in shell.

### Sprint 725 — Missing Context Engine Wiring (P0)
**Files:** `src/components/donna/DonnaVoiceReadyShell.tsx`
**What:** Wire `detectMissingContext()` into `handleSend` BEFORE safe read dispatch. Store `navOffer` when answer includes one.
**Dependency:** Sprint 723 (playerCount/coachCount), Sprint 724 (pendingNavOffer storage).

### Sprint 726 — Conversational Router Wiring (P1)
**Files:** `src/components/donna/DonnaVoiceReadyShell.tsx`
**What:** Wire `routeDonnaPrompt()` into the fallback path. Execute `use_system_map`, `use_page_context`, `explain_limitation` modes that are currently dead code.
**What this unlocks:** "What does the review center do?", "What page am I on?", "What can I do here?", "How does the system work?"

### Sprint 727 — Setup Onboarding Suggested Questions (P2)
**Files:** `src/lib/donna/donnaSuggestedQuestions.ts`
**What:** Add onboarding/setup suggested chips when `isFirstTimeSetup === true`. Replace operational chips with setup chips for new directors.
**Risk:** None — additive.

### Sprint 728 — "Help" + Single-Word Natural Language (P2)
**Files:** `src/components/donna/DonnaVoiceReadyShell.tsx` or `donnaIntentClassifier.ts`
**What:** Handle "help", "confused", "what do I do", "not sure" as valid prompts. Route to page context or suggested questions rather than fallback.

### Sprint 729 — Full Regression + Certification Document (P0)
**Files:** `docs/DONNA_CHATGPT_QUALITY_CONVERSATIONAL_CERTIFICATION.md`
**What:** Re-run all 45 prompts after Sprints 723–728. Score 10 dimensions. Render final verdict.

---

## Certification Forecast

After Sprints 723–729:

| Dimension | Current | Projected |
|---|---|---|
| Conversational intelligence | 3/10 | 7/10 |
| Missing-context explanation | 1/10 | 8/10 |
| Onboarding guidance | 0/10 | 9/10 |
| Setup-state awareness | 1/10 | 8/10 |
| Pending-action memory | 0/10 | 8/10 |
| Yes/No follow-up | 0/10 | 9/10 |
| Safe navigation | 1/10 | 8/10 |
| Role awareness | 7/10 | 8/10 |
| Safety blocking | 9/10 | 9/10 |
| Voice conversational UX | 4/10 | 6/10 |
| **Total** | **26/100** | **80/100** |

Projected verdict: **DEMO-READY BUT NOT CHATGPT-QUALITY** at Sprint 729.

To reach **CERTIFIED CHATGPT-QUALITY** (90+/100), additional work is needed:
- Live AI inference layer (not static keyword matching) — P3, not in current scope
- Real multi-turn memory beyond single pending offer — P3
- Voice UX polish (DONNA speaks her own answers) — depends on OpenAI Realtime API

---

## Current Verdict

> **NOT CERTIFIED — exact blockers listed below**

### P0 Blockers (must fix before any certification tier):
1. No onboarding question handling — all fall to fallback
2. No pending navigation offer memory — yes/no confirmation impossible
3. `donnaConversationalRouter.ts` never wired — `use_page_context` and `use_system_map` are dead code
4. "Why can't you answer that?" → fallback

### P1 Blockers (must fix for DEMO-READY):
5. `DirectorDonnaContext` has no `playerCount`/`coachCount` live queries
6. No active router.push() navigation — only passive `<a>` links
7. "Which players need attention?" when no players exist → wrong answer (shows "no flags" instead of "no data")

### P2 Gaps (must fix for PILOT-READY):
8. Coaches question with no coaches → fallback
9. Single-word prompts ("help") → fallback
10. Setup-context suggested questions not adjusted for first-time setup

### P3 Gaps (ChatGPT-quality ceiling):
11. All answers are keyword-matched templates, not LLM-inferred
12. No genuine multi-turn memory beyond one pending offer
13. Voice UX is browser-native only (not OpenAI Realtime or ElevenLabs)

---

## TypeScript Status

Clean after Sprint 722 fix. Verified with `npx tsc --noEmit`.

## Files changed in Sprint 722

**Created:**
- `src/lib/donna/donnaMissingContextEngine.ts` (Sprint 721 partial — wiring deferred to Sprint 725)
- `docs/DONNA_CHATGPT_QUALITY_CONVERSATIONAL_AUDIT_722.md` (this file)

**Modified:**
- `src/lib/donna/directorDonnaContext.ts` — added `playerCount`, `coachCount`, `isFirstTimeSetup` to interface + demo context; live return uses `0/0/false` stubs (queries deferred to Sprint 723)

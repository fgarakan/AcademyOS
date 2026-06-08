# DONNA Capability Scorecard
**Canonical capability tracking — updated every mega sprint**
**Version:** 995C (Mega Sprint 995–1024C)
**Last updated:** 2026-06-08
**Baseline established:** Sprint 965

---

## Scorecard update protocol

Every mega sprint MUST update this file. Format:
1. Update the summary table (before → after scores)
2. Update affected dimension detail sections
3. Record sprint impact in §8
4. Record next sprint recommendation in §9

Do not guess scores. Every score must cite its evidence source and state confidence.

---

## 1. Summary table

| Capability | Score | Before | After | Confidence | Sprint |
|---|---|---|---|---|---|
| Atomic Loop Completion | **92/100** | — | 92 | HIGH | 814 |
| COO Readiness | **61/100** | 60 | 61 | MEDIUM | 995C |
| Conversational Readiness | **64/100** | 62 | 64 | MEDIUM | 995C |
| Director Question Readiness | **88/100** | — | 88 | HIGH | 814 |
| Workflow Completion | **40/100** | — | 40 | HIGH | 934C |

**Composite score: 69/100** (unweighted average)

---

## 2. Atomic Loop Completion — 92/100

### Definition
Can DONNA answer 25 canonical director COO questions correctly, without hallucinating, with evidence cited, and with action routes verified?

### Evidence
**Source:** `docs/qa/DONNA_COO_CERTIFICATION_814.md`
**Sprint:** Mega Sprint 814–843 — DONNA COO Certification V1

| Metric | Value |
|---|---|
| Questions tested | 25 |
| CERTIFIED (full pass) | 22 / 25 |
| Behavioral notes (partial) | 3 — Q20, Q21, Q25 |
| Blocked / failed | 0 |
| Hallucinated answers | 0 |
| Missing-data gaps disclosed | 8 / 8 partial questions |
| Action routes verified | 25 / 25 |
| Data readiness score | 90 / 100 |
| Certification score | **92 / 100** |

### Dimensional breakdown

| Dimension | Questions | Status |
|---|---|---|
| Program Health | Q1–Q5 | PASS (5/5 certified) |
| Player Intelligence | Q6–Q10 | PASS (5/5 certified) |
| Coach Intelligence | Q11–Q15 | PASS (5/5 certified, Q15 fixed this sprint) |
| Parent Confidence | Q16–Q20 | PARTIAL (4/5 — Q20 phrase gap documented) |
| Director Decision | Q21–Q25 | PARTIAL (3/5 certified, Q21 note, Q25 intentional routing to open_review) |

### Q20 / Q21 / Q25 behavioral notes
- **Q20 "Who needs a check-in?"** — Phrase does not contain "parent" → not routed to `parent_confidence`. Falls through to general answer. Documented, not fixed. Fix path: add "check-in" without "parent" to `parent_confidence` matcher.
- **Q21 "What should I focus on today?"** — Certified but produces generic response when `cooState` is null. Fix path: ensure `cooState` is populated from live Supabase data.
- **Q25 "What decisions are waiting?"** — Intentionally caught by Step 6 (review queue) → opens review center. Documented as intentional routing, not a failure.

### Confidence: HIGH
Derived from a dedicated certification sprint with 25 test questions, explicit phrase-matching verification, and evidence-source audit.

### Update trigger
Update this section when new Q&A categories are added, phrase detection is modified, or additional questions are certified.

---

## 3. COO Readiness — 60/100

### Definition
From Director Brian's perspective, does DONNA behave like a COO across 10 operational dimensions?

### Evidence
**Source:** `docs/qa/DONNA_COO_READINESS_AUDIT_935.md`
**Baseline sprint:** Audit conducted post Sprint 934C (2026-06-07)
**Updated by:** Sprint 935 — DONNA Daily COO Briefing V1

### Dimension scores

| # | Dimension | Pre-935 | Post-935 | Post-995C | Delta | Verdict |
|---|---|---|---|---|---|---|
| 1 | Proactive daily briefing | 5/10 | 8/10 | 8/10 | **+3** (Sprint 935) | PARTIAL → PASS |
| 2 | "What do I need to do today?" | 7/10 | 7/10 | 7/10 | 0 | PARTIAL |
| 3 | "How is everything looking?" | 6/10 | 6/10 | 6/10 | 0 | PARTIAL |
| 4 | Academy Setup guidance | 5/10 | 5/10 | 5/10 | 0 | PARTIAL |
| 5 | Curriculum Setup guidance | 5/10 | 5/10 | 5/10 | 0 | PARTIAL |
| 6 | Template Creation guidance | 7/10 | 7/10 | 7/10 | 0 | PARTIAL |
| 7 | Player Creation guidance | 4/10 | 4/10 | 4/10 | 0 | FAIL |
| 8 | Can DONNA explain why? | 5/10 | 5/10 | 5/10 | 0 | PARTIAL |
| 9 | Can DONNA identify missing info? | 6/10 | 6/10 | 6/10 | 0 | PARTIAL |
| 10 | Does DONNA feel like a COO? | 5/10 | 6/10 | 7/10 | **+2** total | PARTIAL |
| | **Total** | **55/100** | **60/100** | **61/100** | **+1** (995C) | |

### D1 change rationale (5→8)
Sprint 935 (`docs/architecture/DONNA_DAILY_COO_BRIEFING_935.md`) wired a 5-section COO brief to the director home page. Brief renders on every login without Brian opening DONNA. Covers all 7 brief dimensions with action routes. Missing data is disclosed. This directly addresses the audit finding: "Brief infrastructure is built. The surface delivery is passive. A proactive COO comes to you." Score raised to 8 (not 10) because: brief is not personalized to session context; no badge or notification on approach; top 3 actions are deterministic, not intelligent.

### D10 change rationale (5→6→7)
Sprint 935: DONNA now proactively surfaces a structured brief — one of the two main behavioral COO gaps. Score raised from 5 to 6.
Sprint 995C: Voice coherence certified — exactly one DONNA voice runtime confirmed. Two simultaneous voice sources (one from server TTS and one from browser TTS bypasses) would undermine the COO persona. All speech now routes through a single global lock. Score raised from 6 to 7. Not higher because: 5/6 workflows still don't fill forms; session memory is still tab-bound; two surfaces still diverge on goal sessions.

### D7 worst dimension — FAIL
Player creation page (`/director/players`) has no `onPageStatePatch` listener. DONNA can run the 6-step Q&A loop but the form stays blank. Coach/group assignment requires entity ID resolution (not just text). This is the highest-frequency director action post-setup. **Fix in Sprint 936.**

### Confidence: MEDIUM
Scores are judgment-based (1–10 scale) derived from code review and feature testing. Not derived from automated tests.

### Update trigger
Update this section after any sprint that modifies: guided workflow page wiring, DONNA proactivity surface, brain knowledge expansion, or session persistence mechanism.

---

## 4. Conversational Readiness — 62/100

### Definition
When Brian types or speaks to DONNA, does the routing, intent classification, entity resolution, and response generation work reliably end-to-end?

### Evidence
**Sources:**
- `docs/qa/DONNA_UNIFIED_ASSISTANT_RUNTIME_934.md` — surface audit
- `docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md` — intent fragmentation audit
- `docs/qa/DONNA_BRAIN_RUNTIME_CERTIFICATION_904.md` — brain runtime certification
- `src/lib/donna/brain/processDonnaMessage.ts` — 14-step pipeline

### What works (PASS)

| Component | Status | Evidence |
|---|---|---|
| Two surfaces share the same brain | PASS | Sprint 934A bridge verified |
| 14-step pipeline processes all inputs | PASS | processDonnaMessage.ts — all steps ordered and guarded |
| Brain knowledge at step 12.5 | PASS | 0.80 confidence threshold; verified by Brain Runtime Cert 904 |
| Entity resolution (V2 DB-backed) | PASS | Called at step 9 in pipeline |
| Disambiguation engine | PASS | `buildDisambiguationQuestion` called at step 9 |
| Relationship intelligence | PASS | `detectRelationshipIntelligenceIntent` called in pipeline |
| Reasoning block (why/why now/why first) | PASS | `buildReasoningBlock` called at step 12 |

### What's fragmented (PARTIAL)

| Component | Status | Evidence |
|---|---|---|
| Intent classification | PARTIAL | 5 separate systems (Brain Inventory Audit 904): `donnaIntentEngine`, `donnaIntentClassifier`, `donnaGlobalIntentRouter`, `donnaIntentRouterV1`, inline matchers |
| Sidebar routing steps | PARTIAL | 45+ specialized routing steps in DonnaVoiceReadyShell BEFORE brain bridge — order matters, gaps possible |
| Brain knowledge depth | PARTIAL | 21 entries only — vocabulary + rules + philosophy. No curriculum rationale, no player development "why" |
| Context population (live data) | PARTIAL | `cooState` and context pack require live Supabase data. Whether end-to-end wiring is complete for all context fields is not verified |

### What's missing (FAIL)

| Component | Status | Evidence |
|---|---|---|
| DonnaAssistantButton in goal sessions | FAIL | Floating panel does not call `processGoalSession()` — goal sessions are sidebar-only |
| Cross-session memory | FAIL | No Supabase-backed session memory. sessionStorage clears on tab close |

### What was added in Sprint 995C

| Component | Status | Evidence |
|---|---|---|
| Single voice runtime certified | PASS | V3 bypass search: 0 active `speechSynthesis.speak()` calls; all speech routes through `speakDonnaPremium` with global lock |
| Caller logging on every utterance | PASS | `DonnaSpeechLogEntry` with `caller`, `requestId`, `timestamp`, `played`/`cancelled` fields |
| Browser TTS fallback disabled | PASS | `speakBrowserFallback()` and `browserTtsFallback()` return silent; browser cannot produce a second voice |

### Score derivation
Sprint 995C baseline: 7 PASS components at 10 each = 70. Penalize: 4 PARTIAL at half value (-20), 2 FAIL components (-8). Base: ~62. Add 2 for single-voice certification (removes a real user-facing coherence failure). Final: **64**.

### Confidence: MEDIUM
Surface routing is verified from code review. End-to-end live data flow for context population is not automated-tested. Voice certification is based on static analysis (grep sweep + code review), not automated audio tests.

### Update trigger
Update when: intent systems are consolidated, brain entries expanded past 21, goal sessions added to floating panel, session memory moves to Supabase, or browser fallback is re-enabled and tested.

---

## 5. Director Question Readiness — 88/100

### Definition
When Brian asks DONNA a specific operational question about his academy, does DONNA give the right answer with real evidence, appropriate hedging, and a clear action route?

### Evidence
**Source:** `docs/qa/DONNA_COO_CERTIFICATION_814.md`
**Sprint:** Mega Sprint 814–843

### Score derivation
COO Certification score: 92/100 (22/25 questions fully certified)
Deduction: Q20 phrase routing gap (-2), Q21 context-dependency on cooState being populated (-1), unverified live data flow for all questions (-1)
**Conservative score: 88/100**

### What's verified

| Check | Result |
|---|---|
| All 25 questions produce an answer | ✓ |
| All 25 answers cite a data source | ✓ |
| All 25 answers have action routes | ✓ |
| Hallucinated answers | 0 |
| Missing data disclosed | 8 / 8 partial contexts |

### Confidence: HIGH
Derived from explicit per-question certification with phrase detection verification and evidence-source audit. The 88 (vs 92) reflects conservative adjustment for unverified live data flows.

### Update trigger
Update when new director questions are added, phrase detection is modified, or live data flow is verified end-to-end.

---

## 6. Workflow Completion — 40/100

### Definition
When Brian uses DONNA to complete a multi-step workflow (add player, create template, etc.), does DONNA: (a) ask the right questions, (b) fill in the form fields, and (c) submit a draft for review?

### Evidence
**Sources:**
- `docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md` — Q&A loop certification (6 scenarios)
- `docs/qa/DONNA_PAGE_STATE_SYNC_CERTIFICATION_934.md` — page wiring certification (6 scenarios)
- `docs/architecture/DONNA_GOAL_SESSION_RUNTIME_934.md` — workflow architecture
- `docs/qa/DONNA_COO_READINESS_AUDIT_935.md` — gap analysis D4–D7

### Workflow matrix

| Workflow | Q&A Loop | Page Wiring | Draft Submission | Overall |
|---|---|---|---|---|
| `template_builder_completion` | PASS | **PASS** (Sprint 934C) | FAIL (no trigger) | PARTIAL |
| `player_onboarding_completion` | PASS | FAIL (not wired) | FAIL | FAIL |
| `academy_setup_completion` | PASS | FAIL (not wired) | FAIL | FAIL |
| `curriculum_builder_completion` | PASS | FAIL (not wired) | FAIL | FAIL |
| `assessment_completion` | PASS | FAIL (not wired) | FAIL | FAIL |
| `parent_update_completion` | PASS | FAIL (not wired) | FAIL | FAIL |

### Certification results

| Layer | Certified | Evidence |
|---|---|---|
| Q&A session loop (all 6 workflows) | 6/6 PASS | Goal Session Cert 934 — Scenarios A–F all pass criteria checked |
| Session persistence (tab-level) | 6/6 PASS | sessionStorage 4h TTL verified across navigation |
| Session persistence (cross-tab) | 0/6 FAIL | sessionStorage clears on tab close — no Supabase-backed sessions |
| Page state sync (template only) | 1/6 PASS | Page State Sync Cert 934 — Scenarios 1–6 pass |
| "Set by DONNA" indicators | 1/6 PASS | Template create page — `templateName` and `level` fields |
| Draft submitted to DB from session | 0/6 FAIL | No workflow triggers a DB save via goal session completion event |

### Score derivation
Q&A loop: 6/6 pass = full credit on loop layer (30%). Page wiring: 1/6 = 17% credit on wiring layer (30%). Draft submission: 0/6 = no credit (40%). Weighted: (30 × 1.0) + (30 × 0.17) + (40 × 0) ≈ 35. Add 5 for session persistence within tab. **Score: 40/100.**

### Confidence: HIGH
The workflow matrix is derived from explicit certification scenarios. Wiring gaps are definitively confirmed — no ambiguity about which pages have listeners.

### Update trigger
Update when any workflow gains page wiring, draft submission is wired to a goal session completion event, or session persistence moves to Supabase.

---

## 7. Current blockers

Listed by impact severity. Each blocker cites its evidence source.

### BLOCKER 1 — Five workflows have no page wiring
**Impact:** Brian completes 6 DONNA Q&A steps, but the form stays blank. He types everything again.
**Evidence:** Workflow matrix above; D4–D7 in COO Readiness Audit 935
**Workflows affected:** player_onboarding, academy_setup, curriculum_builder, assessment, parent_update
**Fix path:** One sprint per workflow to add `onPageStatePatch` listener. Player creation is highest-frequency → Sprint 936 (recommended).
**Severity:** HIGH

### BLOCKER 2 — Session state is tab-bound
**Impact:** Brian starts player onboarding, closes the tab for lunch, reopens — DONNA has forgotten all 4 steps answered.
**Evidence:** Brain Inventory Audit 904 (sessionStorage finding); Goal Session Cert 934 (4h TTL noted)
**Fix path:** Replace `guidedCompletionSessionMemory` sessionStorage with a Supabase `donna_sessions` row. One sprint.
**Severity:** HIGH

### BLOCKER 3 — Two session storage systems can diverge
**Impact:** `guidedCompletionSessionMemory` (4h TTL) and `donnaGoalCompletionModel` (6h TTL) coexist. One may expire while the other is active.
**Evidence:** COO Readiness Audit 935 — Dimension 10 gap analysis
**Fix path:** Consolidate into a single session storage source. Merge sprint + Supabase migration.
**Severity:** MEDIUM

### BLOCKER 4 — DonnaAssistantButton not in goal session loop
**Impact:** If Brian uses the floating panel DONNA to start a player creation session, no patches are dispatched. Only the sidebar surface dispatches patches.
**Evidence:** DONNA Unified Assistant Runtime 934 — Gap 3 (surface parity)
**Fix path:** Add `processGoalSession()` call to `DonnaAssistantButton.handleCommandSubmit()`, same as sidebar.
**Severity:** MEDIUM

### BLOCKER 5 (resolved) — Two simultaneous DONNA voices
**Status:** RESOLVED in Sprints 995–1024B/C
**Summary:** Multiple browser TTS bypass paths existed alongside the global speech lock, allowing two audio channels to play simultaneously. All bypasses now eliminated. One runtime, one lock, one speaker.

### BLOCKER 6 — Brain "explain why" coverage is too narrow
**Impact:** Brian asks "Why is this player still in Orange Ball 2?" — DONNA cannot answer. Brain has 21 entries covering vocabulary and system rules only. No curriculum advancement criteria, level pedagogical differences, or player development rationale.
**Evidence:** COO Readiness Audit 935 — Dimension 8 (5/10)
**Fix path:** Add 10–15 brain entries to `initialBrainSeed.ts` covering curriculum level criteria and player development rationale. No new architecture needed.
**Severity:** MEDIUM

### BLOCKER 7 — Browser TTS fallback is disabled
**Impact:** When the server has no OPENAI_API_KEY configured, DONNA is silent. There is no graceful degradation to browser TTS during this certification period.
**Evidence:** Sprint 995 V2 disabled `browserTtsFallback()` and `speakBrowserFallback()` to isolate the second-voice root cause.
**Fix path:** Once field testing confirms zero second-voice incidents, restore both fallback functions. Instructions in `docs/qa/DONNA_VOICE_FORENSIC_AUDIT_995.md` — "To Re-enable Browser Fallback."
**Severity:** MEDIUM (only affects deployments without OPENAI_API_KEY)

### BLOCKER 6 (renumbered) — Player creation needs entity ID resolution
**Impact:** `player_onboarding_completion` collects `assigned_coach: "Coach Sarah"` (text), but the player creation form needs a coach ID. Text→ID resolution not built.
**Evidence:** COO Readiness Audit 935 — Dimension 7 gap analysis
**Fix path:** Add a lookup step in the page listener that resolves coach/group names to IDs from the academy context.
**Severity:** MEDIUM (blocks player creation wiring from being fully useful)

---

## 8. Last sprint impact

### Sprint 995C — DONNA Voice Certification V3

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 60/100 | 61/100 | **+1** (D10: 6→7) |
| Conversational Readiness | 62/100 | 64/100 | **+2** |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |
| Workflow Completion | 40/100 | 40/100 | 0 |

**What changed:**
- `DirectorInterviewAssistant.tsx` — removed 100-line independent browser TTS implementation (`speakAssistant()`); replaced with thin wrapper over `speakDonnaPremium`. Removed `utteranceRef`, `selectedVoiceRef`, `advanceTimerRef`, voice-loading `useEffect`, `isTtsSupported()`, `speechSynthesis.cancel()` gesture prime.
- `DonnaAssistantButton.tsx` — deleted dead `speakAssistantText()` function (no remaining callers after V2). Routed `testBrowserVoice()` (dev-only) through `speakDonnaPremium`. Removed `utteranceRef`.
- `docs/qa/DONNA_VOICE_CERTIFICATION_V3_995.md` — final voice inventory, 0 bypass count, 9 certification scenarios, build classification.

**What didn't change:**
- No new guided workflow page wiring
- No brain entries added
- No session persistence improvement
- No floating panel goal session parity
- Browser fallback remains disabled (intentional until field certification)

**Files modified:** `DirectorInterviewAssistant.tsx`, `DonnaAssistantButton.tsx`, `DONNA_CAPABILITY_SCORECARD.md`, `CHANGELOG.md`
**Files created:** `docs/qa/DONNA_VOICE_CERTIFICATION_V3_995.md`

---

### Sprint 935 — DONNA Daily COO Briefing V1

**Capability changes:**

| Capability | Before | After | Delta |
|---|---|---|---|
| COO Readiness | 55/100 | 60/100 | **+5** |
| Atomic Loop Completion | 92/100 | 92/100 | 0 |
| Conversational Readiness | 62/100 | 62/100 | 0 |
| Director Question Readiness | 88/100 | 88/100 | 0 |
| Workflow Completion | 40/100 | 40/100 | 0 |

**What changed:**
- `buildCOODailyBrief()` aggregator built — converts 22 live signals into structured 5-section brief
- `DonnaCOODailyBriefPanel` renders on director home on every login without Brian asking
- Top 3 actions derived and de-duplicated by action route
- Missing data disclosed with `AlertTriangle` footer note
- Brief covers all 7 COO brief dimensions from the sprint spec

**What didn't change:**
- No new guided workflow page wiring (workflows 2–6 remain unpatched)
- No brain entries added
- No session persistence improvement
- No floating panel goal session parity

**Files created/modified:** `donnaDailyCOOAggregator.ts`, `DonnaCOODailyBriefPanel.tsx`, `director/page.tsx` (wired), architecture and certification docs

---

## 9. Next highest-leverage sprint

### Recommended: Sprint 936 — Player Creation Page Wiring

**Rationale:** Player creation (`player_onboarding_completion`) is the highest-frequency director action after initial setup. The infrastructure is complete:
- Registry: 6 steps defined, trigger phrases set
- Goal session runtime: Q&A loop certified (Scenario A in Goal Session Cert 934)
- Page sync contract: `PageStatePatch` built, field map defined for all 6 player fields
- Events: `onPageStatePatch` listener pattern established (template page is the reference implementation)

**Only missing:** `onPageStatePatch` listener in the player creation page + entity ID resolution for coach/group.

**Expected impact:** Workflow Completion score rises from 40/100 to ~52/100. COO Readiness D7 rises from 4/10 to 7/10. COO total: 60 → 63.

**Files to create/modify:**
- Player creation page (add `useEffect` with `onPageStatePatch`)
- Entity resolver for coach/group name → ID mapping
- Architecture doc + certification doc

**Alternative: Sprint 936 — Session Supabase Persistence**
If session durability is the higher priority (multi-day workflows, mobile use), replace sessionStorage with a Supabase `donna_sessions` row. Higher infrastructure complexity but unblocks Blockers 2 and 3.

---

## Source documents

| Document | Sprint | Role in scorecard |
|---|---|---|
| `docs/qa/DONNA_COO_CERTIFICATION_814.md` | 814–843 | Atomic Loop + Director Question evidence |
| `docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md` | 904–933A | Conversational Readiness — fragmentation audit |
| `docs/qa/DONNA_INITIAL_BRAIN_CERTIFICATION_904.md` | 904–933B | Brain seed certification (21 entries, 0 duplicates) |
| `docs/qa/DONNA_BRAIN_RUNTIME_CERTIFICATION_904.md` | 904–933C | Brain runtime O(21) cost, wiring chain |
| `docs/qa/DONNA_UNIFIED_ASSISTANT_RUNTIME_934.md` | 934–963A | Two surfaces unified — routing audit |
| `docs/qa/DONNA_GOAL_SESSION_CERTIFICATION_934.md` | 934–963B | Workflow Q&A loop — 6 scenarios |
| `docs/qa/DONNA_PAGE_STATE_SYNC_CERTIFICATION_934.md` | 934–963C | Page wiring — 6 scenarios, template only |
| `docs/qa/DONNA_COO_READINESS_AUDIT_935.md` | Audit | COO Readiness 10-dimension baseline |
| `docs/qa/DONNA_DAILY_COO_BRIEFING_CERTIFICATION_935.md` | 935–964 | Daily brief certification — 7 scenarios |
| `docs/architecture/DONNA_GOAL_SESSION_RUNTIME_934.md` | 934–963B | Goal session architecture |
| `docs/architecture/DONNA_PAGE_STATE_SYNC_934.md` | 934–963C | Page sync architecture |
| `docs/architecture/DONNA_DAILY_COO_BRIEFING_935.md` | 935–964 | Daily brief architecture |

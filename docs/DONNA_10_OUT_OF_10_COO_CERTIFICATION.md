# DONNA 10/10 COO Assistant Certification Audit

**Date:** 2026-05-23
**Sprint series:** 699–709 (certification target)
**Auditor:** Claude Code autonomous certification run
**Scoring scale:** 10 = works as well as can be done without live DB data; 9 = minor gaps only; ≤8 = actionable gap exists or hard ceiling documented

---

## Certification Verdict

**PILOT-READY BUT NOT 10/10**

DONNA is safe, honest, role-aware, and capable across all core director use cases. All P0/P1 failures identified in Sprint 699 are resolved. Three hard architectural ceilings prevent reaching 9/10 in four categories without additional infrastructure beyond code-only changes.

---

## Final Scores — All 17 Categories

| # | Category | Sprint 701 | Final | Delta | Notes |
|---|---|---|---|---|---|
| 1 | Conversational quality | 7/10 | 8/10 | +1 | Hard ceiling: single message slot |
| 2 | Persistent availability | 8/10 | 9/10 | +1 | Sprint 707 mobile bar |
| 3 | Page awareness | 7/10 | 8/10 | +1 | Sprint 700 curriculum gap routing |
| 4 | Context awareness | 4/10 | 7/10 | +3 | Sprint 702 chat session memory |
| 5 | Role awareness | 6/10 | 8/10 | +2 | Sprint 703 coach guard |
| 6 | System awareness | 7/10 | 7/10 | 0 | `getModuleDefinition` still unwired |
| 7 | Action preview safety | 4/10 | 8/10 | +4 | Sprint 704 preview card |
| 8 | Review queue intelligence | 6/10 | 9/10 | +3 | Sprint 706 live count |
| 9 | KPI intelligence | 3/10 | 7/10 | +4 | Sprint 705 per-KPI explainer |
| 10 | Roster/player intelligence | 4/10 | 8/10 | +4 | Sprint 706 live attention report |
| 11 | Curriculum intelligence | 3/10 | 3/10 | 0 | Hard ceiling: requires live DB data |
| 12 | Parent-safe communication | 9/10 | 9/10 | 0 | Unchanged — Sprint 700 fixes confirmed |
| 13 | Voice input reliability | 6/10 | 8/10 | +2 | Sprint 708 Firefox message |
| 14 | Voice output reliability | 6/10 | 8/10 | +2 | Sprint 708 TTS truncation |
| 15 | Mobile usability | 3/10 | 8/10 | +5 | Sprint 707 mobile command bar |
| 16 | Demo readiness | 7/10 | 8/10 | +1 | Action preview + mobile improvements |
| 17 | Pilot readiness | 5/10 | 7/10 | +2 | Core gaps resolved; DB ceilings remain |

**Overall: 124/170 (73%) — up from 98/170 (58%) at Sprint 701 baseline.**

Categories at ≥9/10: **3 of 17** (Persistent availability, Review queue intelligence, Parent-safe communication)

---

## Regression Pass — 15 Golden Path Scenarios

All 15 scenarios from the Sprint 696 golden path scorecard:

| # | Prompt | Expected | Status |
|---|---|---|---|
| A | "Where am I?" | `use_page_context` → `where_am_i` answer | PASS |
| B | "What can you help me with here?" | `use_page_context` → capability answer | PASS |
| C | "What should I do first today?" | `dashboard_priority` → `use_page_context` | PASS |
| D | "How does this system work?" | `use_system_map` → system overview | PASS |
| E | "How does a parent update get approved?" | `use_system_map` → parent update flow | PASS |
| F | "Which players need attention?" | `use_roster_intel` → live attention report | PASS (live data) |
| G | "What needs approval first?" | `use_review_context` → live queue count + breakdown | PASS (live data) |
| H | "Why is attendance low?" | `use_kpi_answer` → per-KPI explainer | PASS |
| I | "Explain the recap completion KPI" | `use_kpi_answer` → per-KPI explainer | PASS |
| J | "What are the curriculum gaps?" | `use_page_context` → curriculum page context | PASS |
| K | "Move Sarah up." | `level_movement` → `route_to_review` + action preview card | PASS |
| L | "Show the raw coach note to the parent." | `unsafe_visibility_request` → `block_unsafe_request` | PASS |
| M | "Can Emma move down?" | `level_movement` → `route_to_review` | PASS |
| N | "Should this player be moved up?" | `level_movement` → `route_to_review` | PASS |
| O | Coach: "Move Sarah up." | `level_movement` → coach-guard → director referral | PASS |

**Scenario pass rate: 15/15 (100%)**

---

## P0/P1 Failure Registry — Final Status

All P0/P1 failures from Sprint 699 reaudit:

| ID | Failure | Sprint fixed | Status |
|---|---|---|---|
| P0-K | "Move Sarah up" → Not recognized | 700 | RESOLVED |
| P0-M | "Show raw coach note to parent" → Not recognized | 700 | RESOLVED |
| P0-A | Chat session memory not wired | 702 | RESOLVED |
| P0-B | Action preview cards not rendered | 704 | RESOLVED |
| P0-C | KPI explainer not wired | 705 | RESOLVED |
| P0-D | No mobile layout | 707 | RESOLVED |
| P1-A | COO router role-blind | 703 | RESOLVED |
| P1-B | `use_review_context` static text only | 706 | RESOLVED |
| P1-C | `use_roster_intel` static text only | 706 | RESOLVED |
| P1-Curriculum | Curriculum gap → "Not recognized" | 700 | RESOLVED |
| P1-Voice-Firefox | Firefox voice: silent failure | 708 | RESOLVED |
| P1-Voice-TTS | TTS cuts off on long responses | 708 | RESOLVED |

**P0/P1 pass rate: 12/12 (100%)**

---

## Hard Architectural Ceilings — Why 10/10 Is Not Achievable Code-Only

The following categories cannot reach 9/10 without architectural changes that are outside the scope of code-only sprints:

### Ceiling 1: Conversational Thread (Categories 1, 4)

**Category 1 (Conversational quality, 8/10 ceiling)**
**Category 4 (Context awareness, 7/10 ceiling)**

`commandResponse` is a single React state slot (`{ message, type, label }`). DONNA shows one message at a time. Prior responses are invisible to the director. A director saying "what about attendance specifically?" after "explain the KPIs" gets a full-context response (via `getContextualPrefix`) but cannot SEE the previous exchange.

`DonnaChatThread` component exists at `src/components/donna/DonnaChatThread.tsx`. `donnaChatSessionMemory.ts` tracks `ConversationTurn[]`. The session memory IS being written (Sprint 702). But the thread is not rendered in `DonnaAssistantButton.tsx`.

**What would reach 9/10:** Replace `commandResponse` single slot with `DonnaChatThread` rendering the full `ConversationTurn[]` array. Requires a new rendering path and scroll management.
**Why not done:** Multi-sprint UI rework; risk of visual regression in the existing panel.

---

### Ceiling 2: Curriculum Intelligence (Category 11, 3/10 ceiling)

**Category 11 (Curriculum intelligence, 3/10 ceiling)**

`donnaPageContextEngine.ts` returns a `dataFallback` string for the Curriculum page: "Curriculum data may not be fully loaded. I can explain how the curriculum system is structured." There are no live curriculum coverage, gap, or block-assignment queries in the COO chat path.

Supabase has `curriculum_nodes`, `template_blocks`, `session_blocks` tables. A live query could surface: "Orange 1 players are 40% coverage on the forehand pattern block" or "3 players have no current template assignment." But this requires a server action, a result type, and wiring into `handleDonnaCooPrompt`.

**What would reach 9/10:** Add a `loadCurriculumGapSummary(academyId)` server action, wire it into `handleDonnaCooPrompt` for `curriculum_gap` intent, add a `composeCurriculumGapAnswer(gaps, firstName)` function.
**Why not done:** Requires a new server action (DB query), new data type, and async loading in the component. Not code-only.

---

### Ceiling 3: Live KPI Values (Category 9, 7/10 ceiling)

**Category 9 (KPI intelligence, 7/10 ceiling)**

`kpiExplainer.ts` produces per-KPI explanations using static severity logic (`explainKpiByStatus(kpiId, 'warning')`). The 'warning' status is hardcoded because actual KPI percentages are not available in the DONNA panel's conversation context.

`academyKpiModel.ts` defines `AcademyKpiId` types and score ranges. Actual KPI computation happens via `computeAttendanceKpis()`, `computeDevelopmentHealth()` etc. in server actions. The KPI dashboard (`/director/kpi`) loads these separately.

**What would reach 9/10:** Pass actual KPI values into `composeKpiAnswer(text, firstName, liveKpiValues)`. Requires either (a) loading KPI summary on panel open and passing it, or (b) a separate KPI context fetch in `handleDonnaCooPrompt`.
**Why not done:** Requires async KPI load in the panel or a new server action.

---

## What Was Fixed (Sprints 700–708 Summary)

| Sprint | Key change | Category impact |
|---|---|---|
| 700 | P0 regex fixes (level movement + raw note) | Safety architecture |
| 700 | Curriculum gap routing in `isPageQuestion()` | Page awareness |
| 700 | `recordRouteChange` wired | Context awareness |
| 702 | Chat session memory wired (`ensureChatSession`, `recordTurn`, `getContextualPrefix`) | Context awareness +3 |
| 702 | `buildContinuityMessage` on panel re-open | Context awareness |
| 703 | Coach guard in `handleDonnaCooPrompt` | Role awareness +2 |
| 704 | `getActionPreviewForRequest` wired + inline preview card | Action preview +4 |
| 705 | `composeKpiAnswer` + `detectKpiId` + `explainKpiByStatus` wired | KPI intelligence +4 |
| 706 | `composeReviewQueueAnswer` (live count + breakdown) | Review queue +3 |
| 706 | `composeRosterIntelAnswer` (live attention report) | Roster intel +4 |
| 707 | `DONNADirectorMobileCommandBar` wired for director mobile | Mobile usability +5 |
| 708 | Firefox voice detection + TTS truncation | Voice reliability +2 each |

---

## Demo Safety Confirmation

DONNA is safe for a live director demo with these confirmed behaviors:

1. **Safety block** — "Show the raw coach note to the parent." → blocked, no parent visibility change
2. **Review routing** — "Move Sarah up." → review-route response + action preview card, no level mutation
3. **Live queue count** — "What needs approval first?" → real pending count injected from component state
4. **KPI explanation** — "Why is attendance low?" → per-KPI explainer with headline, why-it-matters, recommended action
5. **Coach guard** — Coach saying "Move Sarah up" → director referral, not the review route
6. **Mobile** — Director on small screen sees bottom command bar, not truncated panel
7. **Voice Firefox** — User on Firefox clicking voice → clear message instead of silent failure
8. **TTS** — Long responses truncated for TTS; full text shown in UI

**All 12 P0/P1 failures resolved. No known safety regressions.**

---

## Remaining Gaps (Post-709 Sprint Candidates)

These are not P0/P1 failures but would improve the overall score:

| Gap | Category | Effort | DB required? |
|---|---|---|---|
| Wire `DonnaChatThread` for visible conversation history | 1, 4 | High — multi-sprint UI | No |
| Live curriculum gap query (server action) | 11 | Medium | Yes |
| Live KPI values passed into `composeKpiAnswer` | 9 | Medium | Yes |
| Wire `getModuleDefinition` for "what does X do?" questions | 6 | Low | No |
| `inspect_first` sub-type for page context | 3 | Low | No |
| Bottom sheet panel variant for mobile | 15 | Medium | No |
| More coach-specific KPI/roster responses | 5 | Low | No |

---

## Files Changed in Sprint Series 699–709

### Behavior files (logic only — no DB, no schema, no migrations)
- `src/lib/donna/donnaIntentClassifier.ts` — Sprint 700: level movement + unsafe visibility regexes
- `src/lib/donna/donnaConversationalRouter.ts` — Sprint 700: curriculum gap patterns + operator precedence fix
- `src/lib/donna/donnaResponseComposer.ts` — Sprints 705, 706: `composeKpiAnswer`, `composeReviewQueueAnswer`, `composeRosterIntelAnswer`
- `src/components/assistant/DonnaAssistantButton.tsx` — Sprints 700, 702, 703, 704, 705, 706, 707, 708: all live wiring
- `docs/DONNA_FINAL_COO_HARDENING_700.md` — Sprint 700 Go/No-Go note
- `docs/DONNA_701_POST_700_REAUDIT_GAP_MAP.md` — Sprint 701 17-category gap map

### No migrations, no schema changes, no RLS changes, no seed data, no env changes.

---

## TypeScript Validation

`npx tsc --noEmit` — **CLEAN** after every sprint in the series.

---

## Final Verdict

**PILOT-READY BUT NOT 10/10**

DONNA is safe to deploy to early pilot directors. All core COO use cases (safety blocking, review routing, roster attention, KPI explanation, role boundaries, mobile access) work correctly with real component state. The three hard architectural ceilings (conversation thread, curriculum DB data, live KPI values) are documented above with exact resolution paths.

The 10/10 certification cannot be issued without resolving at least the conversation thread ceiling (categories 1, 4) and the curriculum intelligence ceiling (category 11). Both require scoped multi-sprint work, not code-only patches.

**Not a safety issue. Not a product risk. A depth ceiling.**

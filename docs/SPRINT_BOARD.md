# Sprint Board — AcademyOS

Tracks the active sprint, phase status, and backlog.

**Last updated:** 2026-05-15

How to use:
- PM/CTO Agent writes the sprint plan here at session start.
- Each agent marks its phase ✓ when complete.
- Docs Agent moves the sprint to Done when all phases are ✓ and commit is complete.

---

## Active Sprint

*(No active sprint — Sprint 438 complete.)*

**Next available:** Sprint 439

---

## Completed This Run

### Sprint 438 — KPI Block Audit and Next Roadmap V1 ✓

**Status:** COMPLETE (docs only)
**QA:** Block audit complete — 18 sprints summarised, 5 open gaps documented, next roadmap set.
**TypeScript:** Not run (no code changes)
**Files modified:** `docs/DONNA_KPI_INTELLIGENCE_MAP.md` (Block 2 sprint table updated; next roadmap added)

---

### Sprint 437 — KPI Regression and Demo Data Pass V1 ✓

**Status:** COMPLETE (docs only — no code changes)
**QA:** Full TypeScript regression PASS. No circular imports. All wired components import-clean.
**TypeScript:** CLEAN

---

### Sprint 436 — KPI Safety and Data Sufficiency Pass V1 ✓

**Status:** COMPLETE (docs only — no code changes needed)
**QA:** All KPI engines and wired code PASS (18 safety checks)
**TypeScript:** Not run — no code changes
**Open items:** donnaKpiSummaryEngine not yet wired (future sprint). groupKpiSummaryAction has 2 null inputs (documented gaps).

---

### Sprint 435 — Group KPI Drilldown V1 ✓

**Status:** COMPLETE
**QA:** 9 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/app/director/_actions/groupKpiSummaryAction.ts`
**Decision:** Action-only sprint. No groups UI exists yet. KPI 7 and KPI 16 computed from real DB data. recapCompletionRatePct and sessionFrequencyRatio null (schema gaps).

---

### Sprint 434 — Player KPI Drilldown V1 ✓

**Status:** COMPLETE
**QA:** 8 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/app/director/players/[playerId]/_components/PlayerKpiDrilldownCard.tsx`
**Files modified:** `src/app/director/players/[playerId]/page.tsx`
**Decision:** Self-contained server component with own data fetching. Placed in Overview slot after PlayerCommandCenterCard.

---

### Sprint 433 — Today's Academy KPI Cards V1 ✓

**Status:** COMPLETE
**QA:** 8 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/app/director/_components/AcademyKpiCardsSection.tsx`
**Files modified:** `src/app/director/page.tsx`
**Decision:** KPI signals section added above "Today's Priorities". Advancement-ready count added via separate `rawDb` query.

---

### Sprint 432 — Director KPI Dashboard V1 ✓

**Status:** COMPLETE
**QA:** 10 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/app/director/kpi/page.tsx`
**Files modified:** `src/components/nav/SidebarNav.tsx`
**Decision:** Two-query pattern (players + curriculum states). Streak not shown (group-scope required). KPI 3 + KPI 13 shown with honest status labels.

---

### Sprint 431 — DONNA KPI Summary Engine V1 ✓

**Status:** COMPLETE
**QA:** 6 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/lib/kpi/donnaKpiSummaryEngine.ts`
**Decision:** Orchestration-only engine. `PlayerKpiSummary` aggregates all per-player KPI result buckets + status counts. Ready for Sprint 432 dashboard wiring.

---

### Sprint 430 — Makeup and Private Lesson Conversion KPI V1 ✓

**Status:** COMPLETE
**QA:** 7 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/lib/kpi/privateLessonKpiEngine.ts`
**Decision:** KPI 11 and makeup signal both `insufficient_data`. Engine ready for future wiring when schema gaps G2 and session_type are resolved.

---

### Sprint 429 — Retention and Dropout KPI Engine V1 ✓

**Status:** COMPLETE
**QA:** 9 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/lib/kpi/retentionKpiEngine.ts`
**Files modified:** `src/app/director/_actions/donnaDirectorIntelligenceActions.ts`
**Decision:** KPI 8 permanently `insufficient_data` (no `deactivated_at`). Dropout risk is a composite proxy wired into DONNA player summary.

---

### Sprint 399 — Persistent DONNA Panel State V1 ✓

**Status:** COMPLETE
**QA:** 22 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files modified:** `src/components/assistant/DonnaAssistantButton.tsx`
**Decision:** X button closes DONNA. Clicking outside / navigating does NOT close. Backdrop is `pointer-events-none` visual overlay (not a modal close target). Active glow on floating button when open.

---

### Sprint 398 — Demo Data Seed and DONNA Stub Visibility V1 ✓

**Status:** COMPLETE
**QA:** 27 PASS / 0 FAIL / 0 WARN
**TypeScript:** CLEAN
**Files created:** `src/lib/demo/demoData.ts`
**Files modified:** today/page.tsx, level-up/page.tsx, parents/page.tsx, DonnaAssistantButton.tsx

---

### Sprint 397 — Human Demo Review and DONNA Operating Gap Audit V1 ✓

**Status:** COMPLETE (docs only)

---

### Sprint 396 — Final Prototype Visual Match + Regression V1 ✓

**Status:** COMPLETE
**QA:** 43 PASS / 0 FAIL / 0 WARN — relay complete

---

### Sprint 395 — Guided Director Demo Flow V1 ✓

**Status:** COMPLETE
**QA:** 26 PASS / 0 FAIL / 0 WARN

---

### Sprint 394 — Premium UI Consistency Pass V1 ✓

**Status:** COMPLETE
**QA:** 23 PASS / 0 FAIL / 0 WARN (static analysis)

---

### Sprint 393 — Cross-Screen DONNA Context Wiring Pass V1 ✓

**Status:** COMPLETE
**QA:** 13 PASS / 0 FAIL / 0 WARN (static analysis — registry-only sprint)

---

### Sprint 392 — DONNA Executive Panel Upgrade V1 ✓

**Status:** COMPLETE
**QA:** 24 PASS / 0 FAIL / 0 WARN

---

### Sprint 391 — Coach Recap Structuring and Review Draft V1 ✓

**Status:** COMPLETE
**QA:** 26 PASS / 0 FAIL / 0 WARN

---

### Sprint 390 — Coach Recap Flow Shell V1 ✓

**Status:** COMPLETE
**QA:** 19 PASS / 0 FAIL / 0 WARN

---

### Sprint 389 — Parent Communication Center V1 ✓

**Status:** COMPLETE
**QA:** 23 PASS / 0 FAIL / 1 WARN

---

### Sprint 388 — Level Up Readiness Review V1 ✓

**Status:** COMPLETE — all phases passed

**Phase checklist:**
- [x] `PLAN: ✓`
- [x] `BUILD: ✓` — 3 files created, 1 modified, tsc clean
- [x] `QA: ✓` — 23 PASS / 0 FAIL / 0 WARN
- [x] `UIUX: ✓` — design system compliant, red line badge visible
- [x] `DOCS: ✓`

---

### Sprint 387 — Sessions Detail DONNA Context V1 ✓

**Status:** COMPLETE — all phases passed

**Phase checklist:**
- [x] `PLAN: ✓` — PM/CTO confirmed scope (context-only, no migration)
- [x] `BUILD: ✓` — 2 files modified, tsc clean
- [x] `QA: ✓` — 24 PASS / 0 FAIL / 1 WARN (test DB has no sessions — chip code verified statically)
- [x] `UIUX: ✓` — chip styling matches Sprint 386 pattern, design system compliant
- [x] `DOCS: ✓` — all 7 docs updated

**Files modified:**
- `src/components/assistant/donnaPageContextRegistry.ts`
- `src/app/director/sessions/[sessionId]/page.tsx`

---

### Sprint 386 — Today's Academy V1 ✓

**Status:** COMPLETE — all phases passed

**Phase checklist:**
- [x] `PLAN: ✓` — PM/CTO confirmed scope
- [x] `BUILD: ✓` — 3 files created, 1 modified, tsc clean
- [x] `QA: ✓` — 30 PASS / 0 FAIL / 1 WARN (pre-existing 406)
- [x] `UIUX: ✓` — design system verified, no blocking issues
- [x] `DOCS: ✓` — CHANGELOG, SPRINT_BOARD, MERGE_QUEUE, INTEGRATION_LOG, QA_GATE, MODULE_MATURITY_MAP, SCREEN_BACKEND_READINESS_MAP all updated

**Sprint spec (source: `SCREEN_BACKEND_READINESS_MAP.md` + `PROTOTYPE_SCREEN_ADOPTION_MAP.md`):**

Goal: Build `/director/today` — the director's "Today's Academy" morning anchor screen.

**Files to create:**
- `src/app/director/today/page.tsx` — server component; queries sessions for today, renders Today screen layout
- `src/app/director/today/loading.tsx` — skeleton loading state

**Files to modify:**
- `src/lib/donna/donnaPageContextRegistry.ts` — add entry for `/director/today`

**Data sources (all already wired — no new server actions needed):**
- `sessions` table filtered by `scheduled_date = today`, joined to `profiles` (coach) + `templates`
- `session_blocks` — check for sessions missing blocks
- `/api/donna/attention` — attention items card
- `/api/donna/brief` — daily brief card
- `getDonnaReviewQueueAction` — review queue count badge

**Layout:** Director layout (fixed sidebar `w-60` + `flex-1` main). Header: `"Today — [day, date]"`.

**DONNA context entry to add:**
```ts
'/director/today': {
  screenName: "Today's Academy",
  intro: "I can see today's sessions, what needs your attention, and your daily brief.",
  quickActions: ['what_needs_attention', 'daily_brief', 'show_review_queue', 'attendance_exception_draft'],
}
```

**Migration required:** No
**DB schema changes:** No
**New packages:** No
**Backend writes:** No

**QA checklist (for QA Agent):**
- [ ] `/director/today` loads without error
- [ ] Shows only today's sessions (not yesterday's or tomorrow's)
- [ ] Sessions missing blocks flagged visually
- [ ] Brief card renders (or graceful empty state if API returns nothing)
- [ ] Attention card renders (or graceful empty state)
- [ ] Review queue badge shows correct count
- [ ] DONNA panel opens with "Today's Academy" context
- [ ] DONNA "What needs my attention today?" routes to attention engine
- [ ] DONNA "Give me my daily brief" routes to brief API
- [ ] No stale data from a prior date
- [ ] No unhandled exceptions in console

**UI/UX checklist (for UI/UX Agent):**
- [ ] Background is `base: #0A0A0A`
- [ ] Cards use `<Card>` component from `src/components/ui`
- [ ] Date header uses `font-mono text-lime` for day/date
- [ ] Status indicators use correct `status-*` tokens
- [ ] Director sidebar visible and correct
- [ ] No styling from `Academy_OS_Master_Build/` design system used

**Risks:**
- Timezone edge case: `scheduled_date = today` must use server-side date (UTC or academy timezone), not client-side `new Date()`
- If `/api/donna/attention` returns an error, the page must not crash — show empty state

**Architecture red lines to verify:**
- No automatic session status changes from this screen
- No automatic attendance writes
- DONNA actions still go through `proposed_actions` pipeline

---

## Backlog (Next Sprints)

| Sprint | Screen | Route | Readiness | Notes |
|---|---|---|---|---|
| 389 | Parent Comms Center | `/director/parents` | Level 3 → 8 | New route; proposed_actions filter; parent-safe preview |
| 390 | Coach Recap Shell | `/coach/recap` | Level 0 → 4 | New route; 6-question shell, no official writes |
| 391 | Coach Recap Structuring | `/coach/recap` | Level 4 → 6 | Draft sections; proposed_actions if safe |
| 392 | DONNA Panel Upgrade | global | Level 9 → 9+ | Visual upgrade; no behavior rewrite |
| 393 | DONNA Context Wiring | global | varies | Cross-screen context pass |

---

## Done

| Sprint | Description | Commit | Date |
|---|---|---|---|
| 428 | Group Health and Fit KPI Engine V1 | — | 2026-05-16 |
| 427 | Parent Trust KPI Engine V1 | dcdc261 | 2026-05-16 |
| 426 | Coach Execution KPI Engine V1 | d810cda | 2026-05-16 |
| 425 | Curriculum Coverage KPI Engine V1 | c439edc | 2026-05-16 |
| 424 | Evidence Coverage and Readiness Confidence KPI V1 | 53cb06a | 2026-05-16 |
| 423 | Development Velocity and Time in Level KPI V1 | bb500d6 | 2026-05-16 |
| 422 | Player Development Health KPI V1 | 4079df8 | 2026-05-16 |
| 421 | Attendance KPI Engine V1 | 0aa9f0d | 2026-05-16 |
| 420 | Academy COO KPI Data Model Audit V1 | f4df8cc | 2026-05-16 |
| 398 | Demo Data Seed and DONNA Stub Visibility V1 | 1cb1ca8 | 2026-05-16 |
| 396 | Final Prototype Visual Match + Regression V1 | 1d6e5f3 | 2026-05-15 |
| 395 | Guided Director Demo Flow V1 | 2aa272a | 2026-05-15 |
| 394 | Premium UI Consistency Pass V1 | 1526b10 | 2026-05-15 |
| 393 | Cross-Screen DONNA Context Wiring Pass V1 | 1c4e701 | 2026-05-15 |
| 392 | DONNA Executive Panel Upgrade V1 | dce85cd | 2026-05-15 |
| 391 | Coach Recap Structuring and Review Draft V1 | 2a8180e | 2026-05-15 |
| 390 | Coach Recap Flow Shell V1 | c0addfc | 2026-05-15 |
| 389 | Parent Communication Center V1 | b08c414 | 2026-05-15 |
| 388 | Level Up Readiness Review V1 | a7f5c65 | 2026-05-15 |
| 387 | Sessions Detail DONNA Context V1 | 81e808b | 2026-05-15 |
| 386 | Today's Academy V1 | a5d1a5f | 2026-05-15 |
| 385.5 | Five-Agent Workflow Setup V1 | 16db990 | 2026-05-15 |
| 385 | Prototype Screen Adoption Audit V1 | d390ca4 | 2026-05-15 |
| 384 | DONNA Modularization for Parallel Agent Development V1 | fffdd1e | 2026-05-15 |
| 383.5 | Fix class template level to development_track mapping | 4bb6834 | 2026-05-15 |
| 383 | DONNA Attendance Exception Session Resolution V1 | 7c2183b | 2026-05-15 |

---

*Last updated: Sprint 398*

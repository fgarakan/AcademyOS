# Sprint Board — AcademyOS

Tracks the active sprint, phase status, and backlog.

**Last updated:** 2026-05-15

How to use:
- PM/CTO Agent writes the sprint plan here at session start.
- Each agent marks its phase ✓ when complete.
- Docs Agent moves the sprint to Done when all phases are ✓ and commit is complete.

---

## Active Sprint

### Sprint 387 — Sessions Detail DONNA Context V1

**Status:** READY — awaiting PM/CTO Agent to open session

**Phase checklist:**
- [ ] `PLAN: ✓`
- [ ] `BUILD: ✓`
- [ ] `QA: ✓`
- [ ] `UIUX: ✓`
- [ ] `DOCS: ✓`

**Sprint spec (source: `SCREEN_BACKEND_READINESS_MAP.md`):**

Goal: Add DONNA context entry for `/director/sessions/[sessionId]` and wire "Draft coach brief" + "Populate blocks" CTAs from session detail.

**Files to modify:**
- `src/components/assistant/donnaPageContextRegistry.ts` — add entry for `/director/sessions/[sessionId]`
- `src/app/director/sessions/[sessionId]/page.tsx` — add "Draft coach brief" DONNA prompt CTA (if not already present)

**Migration required:** No
**DB schema changes:** No

---

## Completed This Run

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
| 387 | Sessions Detail DONNA | `/director/sessions/[sessionId]` | Level 6 → 8 | Add DONNA context; wire coach brief CTA |
| 388 | Level Up Review | `/director/level-up` | Level 3 → 8 | New route; readiness list; red line: finalize_player_placement() only |
| 389 | Parent Comms Center | `/director/parents` | Level 3 → 8 | New route; proposed_actions filter; parent-safe preview |
| 390 | Coach Recap + Context | `/coach/recap`, `/coach/sessions/[sessionId]` | Level 6 → 7 | Context entry + /coach/recap shortcut only |
| 391 | Command Center Refresh | `/director/command-center` | Level 8 → 9 | Remove legacy DirectorAssistantPanel |
| 392+ | Platform Portal | `/platform/academies` | Level 2 → 6 | Requires platform_roles migration FIRST |

---

## Done

| Sprint | Description | Commit | Date |
|---|---|---|---|
| 386 | Today's Academy V1 | *(pending commit)* | 2026-05-15 |
| 385.5 | Five-Agent Workflow Setup V1 | 16db990 | 2026-05-15 |
| 385 | Prototype Screen Adoption Audit V1 | d390ca4 | 2026-05-15 |
| 384 | DONNA Modularization for Parallel Agent Development V1 | fffdd1e | 2026-05-15 |
| 383.5 | Fix class template level to development_track mapping | 4bb6834 | 2026-05-15 |
| 383 | DONNA Attendance Exception Session Resolution V1 | 7c2183b | 2026-05-15 |

---

*Last updated: Sprint 386*

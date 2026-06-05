# Build Target Staleness Audit V1

**Date:** 2026-06-05
**Auditor:** Claude Code
**Purpose:** Verify whether CURRENT_BUILD_TARGET.md and KNOWN_LIMITATIONS.md are accurate before beginning Director Dashboard KPI wiring.
**Method:** Cross-reference doc claims against git log, live database.types.ts, QA audit files, and actual route/file existence.

---

## Verdict

| Document | Status | Stale Claims |
|---|---|---|
| `CURRENT_BUILD_TARGET.md` | **STALE on 2 of 3 key claims** | Pending migrations claim is false; UI wiring table is partially false |
| `KNOWN_LIMITATIONS.md` | **STALE on 4 confirmed claims** | Migration 058, director dashboard placeholder, players list missing, curriculum/sessions routes unbuilt |

---

## CURRENT_BUILD_TARGET.md — Staleness Analysis

**Last updated:** 2026-05-21

### Claim 1: "Next up: Apply pending Supabase migrations" — STALE

**Actual state:** All 83 migrations are confirmed live in the Supabase database.

Evidence chain:
1. `docs/qa/MIGRATION_LIVE_DB_AUDIT.md` (2026-06-02) — "Migrations 001–075 are applied to the live DB." Migration 058 is within this range.
2. `docs/qa/CURRICULUM_INTELLIGENCE_MIGRATION_APPLICATION_PLAN_V1.md` (2026-06-04) — Status: "SUPERSEDED — all migrations confirmed already applied to live DB." Explicitly confirms 041–044, 045, 056, 060, 061, 062, 083 are live.
3. `src/lib/supabase/database.types.ts` (regenerated 2026-06-04) — All tables from migrations 076–083 appear as typed table definitions, including `player_mission_assignments`, `friction_reports`, `player_development_blueprints`, `assessment_events`, `donna_placement_recommendations`, `assessment_templates`, and `player_evidence_records`.

**Conclusion:** No migrations are pending. The "apply migrations first" step is complete and can be skipped.

---

### Claim 2: "What still needs UI wiring" table — PARTIALLY STALE

**Claimed as unwired:**

| Module | Claimed target | Actual state |
|---|---|---|
| `attentionQueue/` | `/director` hero section | **WIRED** — `buildAttentionQueue` is imported and used in `src/app/director/page.tsx` (1490 lines) |
| `kpiDashboard.ts` | `/director` KPI grid | **WIRED** — `AcademyKpiCardsSection`, `DirectorKpiHealthSection` are live components in `src/app/director/page.tsx` |
| `groupIntelligence.ts` | `/director/groups` | Unverified — no `/director/groups` route found in `ls src/app/director/` |
| `curriculumOperatingView.ts` | `/director/curriculum` | `/director/curriculum/page.tsx` EXISTS — wiring status unverified |
| `coachPortalAssembly.ts` | `/coach` home page | Unverified |
| `parentPortalSummary.ts` | `/parent` page | Unverified |
| `playerPortalExperience.ts` | `/player` page | Unverified |
| `badgeEligibilityEngine.ts` | `/player` + `/director/players/[id]` | Unverified |
| `missionEngine.ts` | `/player` home card | Unverified |
| `curriculum/inbox/` | `/director/review` curriculum tab | Unverified |

**Conclusion:** At minimum `attentionQueue` and `kpiDashboard` are already wired to `/director`. The table is partially stale. The remaining unverified items require a separate wiring audit before sprint planning.

---

### Claim 3: "Mega Sprint 554–603 COMPLETE" — ACCURATE

The 5 most recent commits (2026-06-05) are post-Mega-Sprint work (academy health, curriculum intelligence surfacing, DONNA improvements). The mega-sprint completion claim holds.

---

## KNOWN_LIMITATIONS.md — Staleness Analysis

**Last updated:** 2026-05-08 (file modified by "Curriculum intelligence activation V1" commit on 2026-06-04 — but navigation/placeholder sections were not updated)

---

### Stale Claim 1: Migration 058 pending live application — STALE

**From doc (line ~308):** "`template_block_exercises` missing RLS policies — migration 058 pending live application … Migration 058 must still be applied to the live Supabase instance."

**Actual state:** RESOLVED. `MIGRATION_LIVE_DB_AUDIT.md` (2026-06-02) explicitly states "Migrations 001–075 are applied to the live DB." Migration 058 is within that range.

**Action needed:** Update KNOWN_LIMITATIONS.md to mark this RESOLVED.

---

### Stale Claim 2: "Director Dashboard is a placeholder" — STALE

**From doc:** "A director who logs in sees only a grey text message: 'Director Dashboard — coming in Phase 5.' There is no orientation, no data, no value."

**Actual state:** `src/app/director/page.tsx` is a **1490-line production dashboard** importing:
- `buildAttentionQueue` (attention queue engine)
- `AcademyKpiCardsSection`, `DirectorKpiHealthSection` (KPI surfaces)
- `DirectorPrimaryActionHero` (action hero section)
- `DonnaCommandSection`, `DonnaFirstGreeting` (DONNA integration)
- `AcademyHealthBadgeWithDrawer` (academy health)
- `DirectorContinueSetupPanel` (setup guidance)

**Action needed:** Remove or rewrite the "Director Dashboard is a placeholder" limitation entry.

---

### Stale Claim 3: "Players List is missing" (`/director/players`) — STALE

**From doc:** "There is no way for a director to navigate to player profiles through the UI."

**Actual state:** `src/app/director/players/page.tsx` EXISTS and imports `PlayersDirectoryClient` — a client-side players directory component. The route is built.

**Action needed:** Remove or rewrite the "Players List is missing" navigation gap entry.

---

### Stale Claim 4: "Sidebar links to unbuilt routes" — PARTIALLY STALE

**From doc:** Lists `/director/curriculum` and `/director/sessions` as returning 404.

**Actual state:**
- `/director/curriculum` — EXISTS (`src/app/director/curriculum/page.tsx` + full subtree including `builder/`, `map/`, `learning/`, `level/`, etc.)
- `/director/sessions` — EXISTS (`src/app/director/sessions/page.tsx` + subtree including `[sessionId]/`, `archive/`, `new/`, `overview/`)

**Still missing (confirmed unbuilt):**
- `/director/competition` — no route found
- `/director/intelligence` — no route found
- `/director/reports` — no route found
- `/director/configuration` — no route found (settings exists as `/director/settings`)

**Action needed:** Remove `/director/curriculum` and `/director/sessions` from the "unbuilt" list. Keep the 4 remaining unbuilt routes noted.

---

### Stale Claim 5: "Coach, Player, Parent portals are stubs" — STATUS UNKNOWN

**From doc:** "These roles can log in but see placeholder text. No functionality."

**Observation:** Multiple recent sprint commits have built coach/player/parent portal content (Mega Sprint 554–603 Phase 4–5). Whether stub text has been replaced requires a separate portal audit.

---

## Summary: What Is Actually Pending

No migrations are pending. The accurate blockers before KPI wiring are:

| Item | Status | Notes |
|---|---|---|
| Migrations 001-083 | ✅ All live | Nothing to apply |
| Director dashboard | ✅ Built (1490 lines) | Some KPI surfaces may still need deeper wiring |
| Players list | ✅ Built | Route exists |
| Curriculum route | ✅ Built | Full subtree exists |
| Sessions route | ✅ Built | Full subtree exists |
| `groupIntelligence.ts` wiring | ❓ Unverified | No `/director/groups` route found |
| Coach/player/parent portal wiring depth | ❓ Unverified | Needs portal audit |
| `/director/competition`, `/intelligence`, `/reports`, `/configuration` | ❌ Not built | Still 404 |

---

## Accurate Next Step

**The migration prerequisite is gone.** Director Dashboard KPI wiring can begin now.

Before starting, run a one-pass wiring audit on `/director/page.tsx` to confirm which `src/lib/director/` and `src/lib/kpis/` modules are already consumed vs. still dormant — the "UI wiring table" in CURRENT_BUILD_TARGET.md is partially stale and cannot be trusted as a sprint backlog without verification.

---

## Files That Should Be Updated

1. `docs/CURRENT_BUILD_TARGET.md` — remove "apply pending migrations" prerequisite; update UI wiring table to reflect attentionQueue/kpiDashboard as wired
2. `docs/KNOWN_LIMITATIONS.md` — mark resolved: migration 058, director dashboard placeholder, players list missing, curriculum/sessions routes unbuilt

# Curriculum Builder Quick Wins — Sprint 792

**Date:** 2026-05-25
**Sprint:** 792
**Depends on:** Sprint 791 (Curriculum Builder 10/10 Audit)
**Status:** COMPLETE

---

## Overview

Sprint 792 applies the five low-risk quick wins identified in the Sprint 791 audit to raise the Curriculum Builder AIQS score from ~74 toward ~82. All changes are pure TypeScript/JSX — no migrations, no RLS changes, no backend mutations, no publish/approval/versioning behavior changes.

---

## Quick Win 1 — Fix hardcoded setup checklist items 4–5

**Before:** "Templates connected" and "Players connected to levels" always showed `done: false` regardless of actual state. A director who had connected templates and assigned players to levels saw both items as incomplete — a false negative that eroded trust in the system.

**After:** Both items now reflect live DB state:
- "Templates connected" queries `templates.curriculum_level_id` (count > 0 → done). If the column doesn't exist in live DB (migration 045 pending), the error guard shows "Data source not available yet." — honest, not falsely done or falsely incomplete.
- "Players connected to levels" queries `player_curriculum_states` (count > 0 → done). Same error safety.

**Files changed:** `src/app/director/curriculum/page.tsx`

**Lines changed:**
- Added two rawDb queries after the existing overrideCount query: `templatesWithLevelCount` and `playersWithLevelCount`
- Updated `setupItems[3].done` and `setupItems[4].done` with live counts and error-safe fallbacks

**Safety note:** No writes. Read-only count queries scoped to `academy_id`. Matches the same query pattern used on the Academy Version page.

---

## Quick Win 2 — Surface Academy Version access

**Before:** The only link to `/director/curriculum/academy-version` was a tiny `text-[11px]` text link buried inside a closed `<details>` collapse. Functionally undiscoverable.

**After:** A visible "Academy Version" card now appears in the Connected System section of the main curriculum page when a version exists. It shows the `GitBranch` icon (lime), the label "Academy Version", a description ("View your overrides, customizations, and curriculum version history."), and a "View Academy Version →" link. Visible without opening any collapse.

**Files changed:** `src/app/director/curriculum/page.tsx`

**Lines changed:**
- Added `GitBranch` to lucide-react imports
- Added conditional `<Link>` card in the Connected System grid, rendered only when `versionData` exists

**Safety note:** Link only. No data mutations. The buried text link inside the `<details>` collapse is preserved (not removed).

---

## Quick Win 3 — Fix `text-[9px]` micro-labels in AuditStat

**Before:** The `AuditStat` component in `academy-version/page.tsx` used `text-[9px]` for its stat labels ("Version", "Applied", "Rolled back", "Templates with level", "Players assigned", etc.). These are operationally important labels, not purely decorative, and `text-[9px]` is below the AIQS minimum of 11px for operational labels.

**After:** Changed to `label-xs` (= `text-[11px] uppercase tracking-widest text-text-muted`). Matches the design system label token exactly. Layout preserved.

**Files changed:** `src/app/director/curriculum/academy-version/page.tsx`

**Lines changed:**
- Line 351: `text-[9px] uppercase tracking-widest text-text-muted mb-0.5` → `label-xs mb-0.5`

---

## Quick Win 4 — Make level tree directly navigable

**Before:** Each level row in `CurriculumLevelTree` was a `<button>` that opened an inline `CurriculumNodeDrawer` detail panel on the same page. To actually edit a level, a director needed: `/curriculum` → `/curriculum/builder` → Jump modal → `/curriculum/level/[id]` — 3 navigations.

**After:** Each level row is now a `<Link href="/director/curriculum/level/${level.id}">`. Clicking any level on the main curriculum page navigates directly to the level editor in one click. The `ExternalLink` icon makes the navigation intent clear. Stage expand/collapse and search behavior are preserved.

The inline `CurriculumNodeDrawer` render has been removed from this component — the level detail page itself serves that purpose now. The `CurriculumNodeDrawer` component file is untouched and remains available for use on the map page or other contexts.

**Files changed:** `src/app/director/curriculum/_components/CurriculumLevelTree.tsx`

**Lines changed:**
- Replaced `import { ArrowRight }` with `import Link from 'next/link'` and `import { ExternalLink }`
- Removed `CurriculumNodeDrawer` import
- Removed `selectedLevelId` state and all drawer-related state/computed variables
- Changed level row `<button onClick>` → `<Link href>`
- Removed `CurriculumNodeDrawer` render block at bottom of component

---

## Quick Win 5a — Remove duplicate CTA block

**Before:** The main curriculum page had two sections showing essentially the same call-to-action:
- Section 2 (Status hero): single dynamic CTA based on status — correct
- Section 5 ("Continue customizing your curriculum"): hardcoded "Continue Curriculum Setup" (btn-lime) + "Open Curriculum Builder" (btn-ghost) regardless of status — direct duplicate

Both pointed to different destinations with no explanation, and the section 5 duplication appeared after 4 other sections of content, compounding cognitive load.

**After:** Section 5 removed entirely. The status hero CTA (section 2) is sufficient. Page reduced from 12 sections to 11.

**Files changed:** `src/app/director/curriculum/page.tsx`

**Lines changed:**
- Removed the "Continue customizing your curriculum" `<div>` card block (formerly between `{/* ── 5. */}` and `{/* ── 6. */}`)

---

## Quick Win 5b — Replace off-brand teal accent in builder hub

**Before:** `CurriculumSetupBuilder.tsx` used `#11d9df` (teal) as its primary brand accent throughout: hero card border/glow, avatar circle, "AI-Powered" badge, "Start Guided Review" primary button, secondary buttons, How It Works card borders, step number circles, safety footer, jump modal borders. This created visual discontinuity entering and leaving the builder — it felt like a different application.

**After:** All brand-accent teal values replaced with lime (`#C8FF00` / `rgba(200,255,0,...)`). The builder hub now matches the site-wide design system.

**Preserved (intentionally NOT changed):**
- `STAGE_COLOR['high_performance']: '#11d9df'` — curriculum level color indicator
- `PATHWAYS[4].dot: '#11d9df'`, `.border: rgba(17,217,223,0.22)`, `.glow: rgba(17,217,223,0.06)` — High Performance pathway card stage colors

**Files changed:** `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx`

**Specific replacements:**
| Location | Before | After |
|---|---|---|
| Hero card border | `rgba(17,217,223,0.18)` | `rgba(200,255,0,0.15)` |
| Hero card glow | `rgba(17,217,223,0.07)` | `rgba(200,255,0,0.06)` |
| Avatar circle bg | `rgba(17,217,223,0.10)` | `rgba(200,255,0,0.08)` |
| Avatar circle border | `rgba(17,217,223,0.24)` | `rgba(200,255,0,0.20)` |
| AI-Powered badge bg | `rgba(17,217,223,0.10)` | `rgba(200,255,0,0.10)` |
| AI-Powered badge border | `rgba(17,217,223,0.20)` | `rgba(200,255,0,0.20)` |
| AI-Powered badge color | `#11d9df` | `#C8FF00` |
| "Start Guided Review" bg | `#11d9df` | `#C8FF00` |
| "Start Guided Review" color | `#03100d` | `#0A0A0A` |
| Secondary button bg/border | `rgba(17,217,223,0.05/0.15)` | `rgba(200,255,0,0.05/0.12)` |
| DONNA gap/advanced buttons | teal variants | lime variants |
| How It Works card border | `rgba(17,217,223,0.09)` | `rgba(200,255,0,0.09)` |
| Step circle bg/border | `rgba(17,217,223,0.08/0.18)` | `rgba(200,255,0,0.08/0.18)` |
| Master Curriculum border | `rgba(17,217,223,0.09)` | `rgba(200,255,0,0.09)` |
| Safety footer color | `rgba(17,217,223,0.45)` | `rgba(200,255,0,0.55)` |
| Jump modal border | `rgba(17,217,223,0.18)` | `rgba(200,255,0,0.15)` |
| Jump modal header border | `rgba(17,217,223,0.12)` | `rgba(200,255,0,0.10)` |
| Jump modal row border | `rgba(17,217,223,0.07)` | `rgba(200,255,0,0.07)` |

---

## Files Changed

| File | Change |
|---|---|
| `src/app/director/curriculum/page.tsx` | QW-1 (live checklist queries), QW-2 (Academy Version chip), QW-5a (remove duplicate CTA) |
| `src/app/director/curriculum/academy-version/page.tsx` | QW-3 (AuditStat label-xs) |
| `src/app/director/curriculum/_components/CurriculumLevelTree.tsx` | QW-4 (level rows → Link navigation) |
| `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` | QW-5b (teal → lime accent) |
| `docs/CURRICULUM_BUILDER_QUICK_WINS_792.md` | This document |
| `docs/CHANGELOG.md` | Sprint 792 entry |

---

## TypeScript Result

Clean. `npx tsc --noEmit` passes with zero errors.

---

## Expected Score Lift

| Dimension | Before | Expected After |
|---|---|---|
| AIQS State Quality (9) | 3/5 | 4/5 (+1) — checklist fixed |
| AIQS Typography (5) | 8/10 | 9/10 (+1) — text-[9px] fixed |
| AIQS Primary Action Clarity (2) | 7/10 | 8/10 (+1) — duplicate CTA removed |
| AIQS Visual Hierarchy (4) | 8/10 | 8/10 (held) — builder brand-aligned |
| CB-1 Navigation Clarity | 5/10 | 7/10 (+2) — direct level navigation, Academy Version visible |
| **AIQS Total** | **74/100** | **~82/100** |
| **CB Specific** | **45/80** | **~52/80** |
| **Combined** | **~65/100** | **~72/100** |

---

## Remaining Blockers from Sprint 791 (unchanged)

1. **Voice curriculum drafting not wired** (Blocker 1) — `draft_curriculum_item` blocked by `voice_command_id` dependency; `VoiceOverrideInputPanel` production-gated
2. **Two competing hub pages** (Blocker 3) — `/curriculum` and `/curriculum/builder` still both feel like primary hubs
3. **Advanced tools inside `<details>` collapse** (Blocker 4) — Explorer, Customization Assistant, Loop Diagram remain buried
4. **Coverage report hardcoded zeros** (Blocker 5) — 6 content dimensions still show 0
5. **Mobile DONNA panel hidden** (Blocker 6) — `hidden lg:block` on map and level pages
6. **No direct "edit level" from main page without navigation** (partially resolved — level tree now navigates, but from builder hub 2 steps still needed)

---

## Recommended Sprint 793

**Sprint 793 — Curriculum Builder Navigation Clarity V1**

Resolve Blockers 3 and 4: clarify the two hub pages and surface advanced tools as visible cards.

Proposed changes:
- Add a clear header chip on `/curriculum/builder` reading "Builder Hub" with back-breadcrumb to `/curriculum`
- On the main `/curriculum` page, replace the `<details>` collapse with a visible "Curriculum Tools" section showing the Explorer, Academy Version (already done in QW-2), Customization Assistant, and Learning Modules as simple card links
- Remove the `CurriculumLoopDiagram` and `PageExplainerCard` from the main page (move to a dedicated `/curriculum/how-it-works` page or the builder hub)
- Clarify the two hub page roles in their own headers: main page = "Your Curriculum" (status), builder = "Build Your Curriculum" (editing entry point)

Estimated score lift: CB-1 Navigation Clarity 7/10 → 9/10; AIQS Purpose Clarity 8 → 9; AIQS Cognitive Load 8 → 10.

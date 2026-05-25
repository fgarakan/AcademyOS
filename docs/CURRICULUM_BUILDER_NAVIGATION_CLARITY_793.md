# Curriculum Builder Navigation Clarity — Sprint 793

**Date:** 2026-05-25
**Sprint:** 793
**Depends on:** Sprint 792 (Curriculum Builder Quick Wins)
**Status:** COMPLETE

---

## Overview

Sprint 793 resolves Blocker 3 (two competing hub pages) and Blocker 4 (advanced tools buried in `<details>` collapse) from the Sprint 791 audit. All changes are pure TypeScript/JSX — no migrations, no RLS changes, no backend mutations.

---

## Change 1 — Rename main curriculum page to "Curriculum Command Center"

**Before:** `h1` read "Your Curriculum" with a vague subtitle. Role of the page was ambiguous versus `/curriculum/builder`.

**After:**
- `h1` is now "Curriculum Command Center"
- Subtitle: "Your academy's development spine — levels, gates, templates, and player progress all connect here. Use the tools below to review, customize, and manage your curriculum."
- Role is now explicit: this is the status and navigation hub; the builder is the editing entry point.

**Files changed:** `src/app/director/curriculum/page.tsx`

---

## Change 2 — Replace `<details>` collapse with visible "Curriculum Tools" card grid

**Before:** Six important tools (Curriculum Explorer, Customization Assistant, Loop Diagram, Academy Version (already fixed in QW-2), Learning Modules) were all buried inside a closed `<details>` collapse labeled "Advanced curriculum tools". Directors had to discover and open it manually. AIQS Cognitive Load and Discovery scores suffered.

**After:** The entire `<details>` block is removed. In its place, a visible "Curriculum Tools" section appears as a 2×2 card grid with four direct navigation cards:

| Card | Destination | Icon |
|---|---|---|
| Curriculum Builder | `/director/curriculum/builder` | `Wrench` (lime) |
| Curriculum Map | `/director/curriculum/map` | `Map` |
| Guided Review | `/director/curriculum/guided` | `Sparkles` |
| Learning Modules | `/director/curriculum/learning` | `BookOpen` |

Each card shows title, one-line description, and a lime "→" navigation cue. Hover shows `border-lime/30` glow.

**Note:** `PageExplainerCard`, `CurriculumLoopDiagram`, `CurriculumCustomizationAssistant`, `CurriculumExplorer`, `AcademyCurriculumVersionCard`, `VoiceOverrideInputPanel`, and `CurriculumDemoFlowPanel` are no longer rendered on this page. Their component files are untouched and remain available. The Academy Version card added in QW-2 (Sprint 792) remains in the "Connected System" section — it is not duplicated in the Tools grid.

**Files changed:** `src/app/director/curriculum/page.tsx`

**Imports removed (7 component imports + 1 icon):**
- `ChevronDown` (lucide-react)
- `CurriculumExplorer`
- `CurriculumDemoFlowPanel`
- `AcademyCurriculumVersionCard`
- `VoiceOverrideInputPanel`
- `PageExplainerCard`
- `CurriculumCustomizationAssistant`
- `CurriculumLoopDiagram`

**Imports added:**
- `Map`, `BookOpen`, `Wrench`, `Sparkles` (lucide-react)

---

## Change 3 — Add breadcrumb to Curriculum Builder hub

**Before:** `/director/curriculum/builder` had no back-navigation. A director who entered the builder had no visible path back to the main curriculum page. Role of the page was implicit.

**After:**
- Breadcrumb added above the header: `← Curriculum Command Center` (links to `/director/curriculum`)
- `h1` updated from "Welcome to Curriculum Builder" → "Curriculum Builder"
- Subtitle updated from "Powered by DONNA · Your academy starts with the master curriculum" → "Powered by DONNA · Customize your academy's development spine one level at a time"

**Files changed:** `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx`

**Imports added:**
- `import Link from 'next/link'`
- `ArrowLeft` (lucide-react)

---

## Files Changed

| File | Change |
|---|---|
| `src/app/director/curriculum/page.tsx` | Rename h1 to "Curriculum Command Center"; replace `<details>` with visible Curriculum Tools grid; remove 8 unused imports |
| `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` | Add breadcrumb; update h1 and subtitle |
| `docs/CURRICULUM_BUILDER_NAVIGATION_CLARITY_793.md` | This document |
| `docs/CHANGELOG.md` | Sprint 793 entry |

---

## TypeScript Result

Clean. `npx tsc --noEmit` passes with zero errors.

---

## Expected Score Lift

| Dimension | Before (post-792) | Expected After |
|---|---|---|
| AIQS Cognitive Load (8) | 8/10 | 10/10 (+2) — `<details>` removed, single visible tool section |
| AIQS Primary Action Clarity (2) | 8/10 | 9/10 (+1) — page role now explicit |
| CB-1 Navigation Clarity | 7/10 | 9/10 (+2) — two hub roles differentiated, breadcrumb added |
| AIQS Purpose Clarity | 8/10 | 9/10 (+1) — "Command Center" vs "Builder" distinction clear |
| **AIQS Total** | **~82/100** | **~87/100** |
| **CB Specific** | **~52/80** | **~58/80** |
| **Combined** | **~72/100** | **~76/100** |

---

## Remaining Blockers from Sprint 791 (after Sprint 793)

1. **Voice curriculum drafting not wired** (Blocker 1) — `draft_curriculum_item` blocked by `voice_command_id` dependency — target Sprint 794
2. **Coverage report hardcoded zeros** (Blocker 5) — 6 content dimensions still show 0 — target Sprint 795
3. **Mobile DONNA panel hidden** (Blocker 6) — `hidden lg:block` on level builder page — target Sprint 796

---

## Recommended Sprint 794

**Sprint 794 — DONNA Curriculum Draft Operator V1**

Make `voice_command_id` optional in `saveCurriculumDraftAction` so DONNA can submit curriculum draft proposals without requiring a prior voice command record. Create `CurriculumChangeDraftPanel.tsx` as a visible draft-and-propose input panel for the level editor page.

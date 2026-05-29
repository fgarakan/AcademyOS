# QA — Curriculum Builder Cognitive Load Reduction V1
**Date:** 2026-05-29
**Sprint:** 962

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors
- [x] `CurriculumLevelBuilderExperience.tsx` compiles cleanly
- [x] `ArrowRight` import added from `lucide-react` — resolves correctly
- [x] `STAGE_ORDER` record typed as `Record<string, number>` — correct
- [x] `sortedLevels` typed as `CurriculumLevel[]` — correct (spread of `explorerData.levels`)
- [x] `prevLevel` and `nextLevel` typed as `CurriculumLevel | null` — correct
- [x] `currentIndex` is a number — `findIndex` returns -1 when not found; `currentIndex + 1` renders safely
- [x] `totalLevels > 1` guard prevents nav strip rendering when only 0-1 levels exist
- [x] `curriculum/page.tsx` compiles cleanly — only HTML data attributes and a comment added

---

## Curriculum builder flow checklist

- [x] Level navigation strip renders between the header and the draft mode banner
- [x] Previous level link renders as `← [level name]` when a previous level exists
- [x] Next level link renders as `[level name] →` when a next level exists
- [x] No prev-level link when current level is the first in sorted order
- [x] No next-level link when current level is the last in sorted order
- [x] Counter shows `{currentIndex + 1} / {totalLevels}` correctly (1-indexed for readability)
- [x] Strip hidden entirely when `totalLevels <= 1` (single level or no levels)
- [x] Level names truncate with CSS truncate on narrow viewports (`max-w-[45%]`)
- [x] Level links use `Link` component — no mutations, read-only navigation
- [x] Stage sort order: red (1) → orange (2) → green (3) → yellow (4) → high_performance (5)
- [x] Unknown stages default to order 99 — placed at end, never throw
- [x] No new queries — `explorerData.levels` is already loaded by the server page component

---

## CTA clarity checklist

- [x] "Advanced Editor" renamed to "Detailed Content View"
- [x] Subtitle updated from "detailed tab view" to "tab view" (removing redundancy)
- [x] Subtitle content list updated to include "coach language" (was "language")
- [x] Draft mode banner text unchanged — "Nothing is applied until you approve it there."
- [x] "Propose a Change" panel label unchanged — panel behavior untouched
- [x] Command center primary CTA label unchanged (dynamically determined by status)

---

## Level/pathway navigation checklist

- [x] Nav strip uses `explorerData.levels` sorted by canonical stage progression
- [x] Sorted order matches the curriculum spine: Red Ball → Orange Ball → Green Ball → Yellow Ball → High Performance
- [x] `explorerData.levels` is not mutated — uses `[...explorerData.levels].sort()`
- [x] Navigation links go to `/director/curriculum/level/[id]` — correct route
- [x] Back arrow (ArrowLeft) to `/director/curriculum/map` unchanged
- [x] "Back to Review" link to `/director/curriculum/guided` unchanged
- [x] "Preview Impact" link unchanged

---

## Draft/review safety checklist

- [x] `CurriculumChangeDraftPanel` wrapped in a `div` for DONNA focus target — no behavioral change
- [x] `CurriculumChangeDraftPanel` props (`levelId`, `levelName`, `externalChangeType`) unchanged
- [x] Draft submit logic inside `CurriculumChangeDraftPanel` is not modified
- [x] Approval routing through `proposed_actions` is not modified
- [x] Draft mode banner ("All changes create a draft in the Review Queue") is unchanged
- [x] Academy director cannot edit global master curriculum spine — permission check in builder page unchanged
- [x] `curriculum/page.tsx` status derivation (`versionData`, `statusLabel`, `primaryCtaHref`) unchanged

---

## DONNA highlight target checklist

- [x] `data-donna-focus-id="curriculum-current-level"` on header div in `CurriculumLevelBuilderExperience`
- [x] `data-donna-focus-id="curriculum-primary-action"` on Propose-a-Change wrapper div
- [x] `data-donna-focus-id="curriculum-status"` on status hero card div in `curriculum/page.tsx`
- [x] `data-donna-focus-id="curriculum-review-draft"` on primary CTA Link in `curriculum/page.tsx`
- [x] `data-donna-focus-id="curriculum-level-tree"` on level tree section in `curriculum/page.tsx`
- [x] All target IDs follow codebase naming convention (kebab-case, curriculum- prefix)
- [x] No existing `data-donna-focus-id` values were removed or renamed
- [x] DONNA's `buildWhatNextAnswer` engine can now reference these 5 new targets

---

## Mobile / basic responsive checklist

- [x] Level nav strip is compact (single row, ~28px height)
- [x] `max-w-[45%]` on prev/next links prevents overflow on narrow screens
- [x] `truncate` class clips long level names without breaking layout
- [x] Center counter (`1 / 15`) uses `whitespace-nowrap shrink-0` — never wraps
- [x] `div` spacers on empty prev/next slots maintain the three-column strip layout on all sizes
- [x] Mobile DONNA context card (block lg:hidden) unchanged
- [x] Draft mode banner unchanged and responsive-safe

---

## No-mutation / no-send checklist

- [x] No `supabase.from(...)` calls in any modified file
- [x] No `proposed_actions` records created
- [x] No audit log writes
- [x] No player record mutations
- [x] No curriculum content mutations
- [x] No attendance mutations
- [x] No parent/player communication sent
- [x] No push/email/SMS dispatch
- [x] No approval gates bypassed

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched
- [x] `proposed_actions` state machine: untouched
- [x] DONNA God Mode V1 systems (939–960): untouched — new data attributes are additive only
- [x] DONNA highlight/context/action systems: untouched — 5 new focus targets added (additive)
- [x] Sprint 961 onboarding changes: untouched
- [x] Coach wrap-up loop (926–936): untouched
- [x] Curriculum draft pending_review behavior: untouched
- [x] Global curriculum spine permissions: untouched — role check in `builder/page.tsx` unchanged
- [x] Academy director edit boundaries: unchanged
- [x] Platform owner global spine permissions: unchanged
- [x] Academy-clone permissions: unchanged
- [x] Parent/player communication safety: untouched
- [x] Player level movement safety: untouched
- [x] Roster/placement/billing/attendance mutation: none
- [x] RLS/multi-tenant boundaries: not applicable — no DB calls in modified files
- [x] All other curriculum routes (`/map`, `/guided`, `/learning`, `/academy-version`, `/builder`): untouched

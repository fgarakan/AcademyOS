# Curriculum Builder Cognitive Load Reduction V1
**Date:** 2026-05-29
**Sprint:** 962

---

## Problems Addressed

The Curriculum Builder had three concrete cognitive load issues before this sprint:

### 1. No level navigation inside the level builder

When a director opened `/director/curriculum/level/[levelId]`, they were isolated inside a single level. To move to the next or previous level (e.g., from "Orange Ball 2" to "Orange Ball 3"), they had to leave the builder entirely by clicking the back arrow to `/director/curriculum/map`, then navigate from there.

This broke workflow context on every level switch — directors had to mentally re-orient on every transition.

`explorerData.levels` was already loaded and passed to the experience component but was never used for navigation.

### 2. Zero DONNA focus targets in the builder

Neither `CurriculumLevelBuilderExperience` nor the curriculum command center page had any `data-donna-focus-id` attributes. DONNA's `buildWhatNextAnswer` engine and `donna:highlight` dispatch system could not guide a director to:
- The current level header
- The "Propose a Change" action panel
- The curriculum status card
- The primary CTA on the command center
- The level tree section

### 3. "Advanced Editor" naming was intimidating

The collapsible detailed tab view was labeled "Advanced Editor". For a director unfamiliar with the curriculum system, "Advanced" implies complexity or risk. The renamed label "Detailed Content View" is more descriptive and less intimidating.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx` | Level nav strip + DONNA focus targets + label rename |
| `src/app/director/curriculum/page.tsx` | DONNA focus targets on status card, CTA, level tree |

---

## UX Changes Made

### Level navigation strip (CurriculumLevelBuilderExperience)

A compact prev/next navigation strip now appears between the page header and the draft mode banner:

```
[ ← Red Ball 2 ]     3 / 15     [ Orange Ball 1 → ]
```

- Uses `explorerData.levels` which is already loaded by the server page — no new queries.
- Levels are sorted by canonical stage order (red → orange → green → yellow → high performance) before computing prev/next, regardless of DB return order.
- On the first level (no prev): the left side is empty.
- On the last level (no next): the right side is empty.
- Only renders when `totalLevels > 1`.
- Level names truncate on narrow viewports (`max-w-[45%] truncate`).
- The counter ("3 / 15") is always centered.

### DONNA focus targets added

| Target ID | Location | Purpose |
|---|---|---|
| `curriculum-current-level` | Header div in `CurriculumLevelBuilderExperience` | DONNA can highlight "which level you're editing" |
| `curriculum-primary-action` | Wrapper div around `CurriculumChangeDraftPanel` | DONNA can highlight "where to propose a change" |
| `curriculum-status` | Status hero card in command center | DONNA can highlight "your curriculum status" |
| `curriculum-review-draft` | Primary CTA Link in command center | DONNA can highlight "your next action" |
| `curriculum-level-tree` | Level tree section in command center | DONNA can highlight "browse your levels" |

### Collapsible label renamed

| Before | After |
|---|---|
| "Advanced Editor" | "Detailed Content View" |

The subtitle was also updated from "detailed tab view: drills, gates, fitness, competition, language" to "tab view: drills, gates, fitness, competition, coach language" for clarity.

---

## Cognitive-Load Reduction Principles Applied

1. **Maintain context across transitions** — Directors no longer need to go back to the map to switch levels. The prev/next strip keeps them in the builder flow.
2. **Reveal system structure** — "3 / 15" shows the director exactly where this level sits in the full spine.
3. **Remove intimidating labels** — "Advanced Editor" → "Detailed Content View" reduces hesitation.
4. **Enable AI guidance** — DONNA focus targets allow the what-next engine to direct attention to the correct builder area.

---

## DONNA Guidance / Highlight Support

Five new `data-donna-focus-id` attributes were added across two files. DONNA's `buildWhatNextAnswer` and `donna:highlight` dispatch can now:
- Highlight the currently edited level header when a director asks "what am I editing?"
- Highlight the "Propose a Change" panel when they ask "how do I add something?"
- Highlight the curriculum status card when they ask "where is my curriculum?"
- Highlight the primary CTA when they ask "what should I do next?" on the command center
- Highlight the level tree when they ask "where can I see all levels?"

These targets follow the naming convention used throughout the codebase.

---

## No-Migration Guarantee

- No database schema changes.
- No new tables, columns, or indexes.
- No `proposed_actions` interaction.
- No audit log writes.
- No curriculum draft behavior changes.

---

## No-Permission-Change Guarantee

- Academy director edit permissions are unchanged.
- Global curriculum spine remains read-only for academy directors.
- Platform owner global spine permissions are unchanged.
- Academy-clone permissions are unchanged.
- `CurriculumChangeDraftPanel` routing through `proposed_actions` is unchanged.

---

## Curriculum Safety Boundaries

- `CurriculumChangeDraftPanel` was wrapped in a `div` for the DONNA focus target — no behavioral change, the panel's own submit logic and approval routing are untouched.
- The level navigation strip uses `Link` components (read-only navigation) — no mutations.
- `explorerData.levels` is used read-only for sort + index computation — no writes.
- Draft mode banner text is unchanged.
- "Nothing is applied until you approve it in the Review Queue" copy is unchanged.

---

## What Was NOT Changed

- `CurriculumChangeDraftPanel` — behavior, submit logic, approval routing all untouched.
- `CurriculumLevelBuilderGrid` — card sections untouched.
- `CurriculumLevelBuilderShell` — detailed tab view untouched (only the collapsible label changed).
- `CurriculumDonnaPanel` — DONNA curriculum panel untouched.
- All other curriculum routes (`/map`, `/guided`, `/learning`, `/academy-version`, `/builder`).
- Curriculum permission model.
- Curriculum approval/review flow.

---

## V2 Improvements

1. **Full level map sidebar** — Replace the simple prev/next strip with a collapsible level sidebar showing all levels grouped by stage, with completion indicators.
2. **Stage pills on the nav strip** — Add colored stage dots next to prev/next level names for immediate stage recognition.
3. **Mobile level navigation** — On mobile, the nav strip is already compact and scrollable, but a dedicated "jump to level" bottom sheet would improve mobile workflow.
4. **Keyboard navigation** — `←` / `→` arrow key shortcuts for prev/next level.
5. **Completion badges** — Show per-level content counts (drills, gates, fitness) in the nav strip to signal which levels need attention.
6. **DONNA "where am I in the curriculum?" brief** — Wire `curriculum-current-level` focus target into the what-next engine's page context so DONNA answers curriculum position questions automatically.

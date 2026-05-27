# Sprint 820 — Player Directory Guided Navigation V1

**Date:** 2026-05-25
**Sprint:** 820
**Type:** Feature implementation
**Files changed:** 4 source files + 2 docs

---

## What this sprint delivers

DONNA can now navigate to the Player Directory and highlight the exact section relevant to the director's command:
- "Help me assign levels" → navigates to `/director/players` + teal-glows `players-missing-level`
- "Show players without levels" → same
- "Who needs placement?" → same
- "Show player flags" → navigates + glows `player-filter-bar`
- "Take me to players" → navigates + glows `player-directory-summary`

---

## Focus Targets Added

### `/director/players` (page)

| data-donna-focus-id | Element |
|---|---|
| `player-directory-summary` | Header div containing "Player Directory" title + subtitle |
| `players-missing-level` | "X without curriculum level" Link (orange badge in header) |
| `add-player-button` | "Add player" lime action Link |

### `PlayersDirectoryClient.tsx` (client component)

| data-donna-focus-id | Element |
|---|---|
| `player-filter-bar` | `SearchFilterBar` component (search + filter chips) |
| `player-list` | `<div className="table-card">` containing the player rows |

---

## Command Mappings Wired

New entries added to `NAV_PATTERNS` in `donnaUIActionDispatcher.ts`, checked **before** the generic `players` pattern so more specific commands get the right focus target:

| Pattern | Route | Focus Target ID |
|---|---|---|
| "players without levels", "missing curriculum level" | `/director/players` | `players-missing-level` |
| "player flags", "players needing attention" | `/director/players` | `player-filter-bar` |
| "pending placement", "who needs placement" | `/director/players` | `players-missing-level` |
| "assign levels", "help me fix levels" | `/director/players` | `players-missing-level` |
| Generic "players" | `/director/players` | `player-directory-summary` (via FOCUS_TARGET_MAP) |

Also wired "What should I do first?" / "What do I need to do today?" → `/director` with `review-queue-card` focus target.

---

## Architecture improvement: per-command focus target overrides

`NAV_PATTERNS` now supports optional `focusTargetId?: string` field. When present, `resolveNavigation` uses it instead of the FOCUS_TARGET_MAP default for that route. This allows different commands to highlight different sections of the same page.

---

## Safety

- No data mutations — focus targets are visual-only (`data-*` attributes + sessionStorage)
- No player level changes
- No bulk player updates
- No role boundary changes
- `players-missing-level` link navigates to `/director/curriculum` — this is the existing behavior (curriculum level assignment UI)

---

## TypeScript

Clean — `npx tsc --noEmit` passes with no errors.

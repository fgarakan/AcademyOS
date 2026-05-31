# Director Players Directory UX — Sprint 1042

**Sprint:** 1042 — Director Players Directory UX Simplification V1
**Date:** 2026-05-31
**File changed:** `src/app/director/players/page.tsx`

---

## Audit findings

### Page structure

- Header: eyebrow "Academy" / H1 "Player Directory" / dynamic subtitle
- Advancement-ready block: lime card with up to 5 players, links to skill-path tab (conditional)
- `DonnaPlayersPresenceCTA`: "Who needs attention?" chip — was always visible when players exist
- `PlayersDirectoryClient`: search bar + status/group/stage filters + player list

### DONNA focus targets already in place

| ID | Element |
|---|---|
| `player-directory-summary` | Header div |
| `players-missing-level` | "X without curriculum level" orange link |
| `add-player-button` | "Add player" CTA |
| `player-filter-bar` | Search + filter bar |
| `player-list` | Player list container |

---

## Problems identified

### Problem 1 — `DonnaPlayersPresenceCTA` showed even with no signals

`DonnaPlayersPresenceCTA` wraps a single chip ("Who needs attention?") in a full bordered card with an "Ask DONNA" label and a fine-print disclaimer. It was rendered unconditionally whenever `players.length > 0`.

When the roster has no flags — no overdue assessments, no on-hold players, no missing curriculum levels, no declining scores — the chip fires but DONNA's response would be "nothing to flag." Showing "Who needs attention?" when nobody needs attention is noise, not signal.

Additionally, when `advancementReadyPlayers.length > 0` AND the DONNA card was visible, two competing attention surfaces stacked above the player list: one lime block with direct links, one bordered DONNA card with a conversational chip. Two attention surfaces for the same class of concern.

### Problem 2 — Empty-state subtitle was vague

When no players exist: `"Academy-wide player tracking"` — generic, non-actionable, and doesn't help a director who just set up the academy understand what to do.

---

## Changes made

### `src/app/director/players/page.tsx`

**1. `DonnaPlayersPresenceCTA` made conditional:**
```tsx
{(namedSignals.length > 0 || assessmentDueCount > 0 || missingCurriculumCount > 0) && (
  <DonnaPlayersPresenceCTA ... />
)}
```
The chip now appears only when there is something for DONNA to surface. Healthy roster = no chip. Signals present = chip appears. The component itself and its data queries are unchanged.

**2. Empty-state subtitle improved:**
- Before: `"Academy-wide player tracking"`
- After: `"Add your first player or import a roster to get started."`

---

## What was preserved

- All Supabase queries — unchanged
- `DonnaPlayersPresenceCTA` component — unchanged (conditional on parent, not modified)
- All `data-donna-focus-id` targets — unchanged
- Advancement-ready block — unchanged
- `PlayersDirectoryClient` — unchanged
- Player detail navigation — unchanged

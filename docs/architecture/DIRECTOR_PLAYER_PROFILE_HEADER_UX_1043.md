# Director Player Profile Header + Priority Clarity — Sprint 1043

**Sprint:** 1043 — Director Player Profile Header + Priority Clarity V1
**Date:** 2026-05-31
**File changed:** `src/components/player/PlayerProfileHeader.tsx`

---

## Problem

When a player has no curriculum level assigned, the header showed:

> "No curriculum placement" — in `text-text-muted` (grey, same weight as label text)

This is the most important missing-data signal on the player profile. On the players directory, the same condition shows as an orange badge ("X without curriculum level"). The two surfaces were visually inconsistent: directory = urgent orange signal, player profile = invisible grey text.

A director opening a player profile of someone without a curriculum level had no visual cue that action was needed. They had to already know to look for it.

## Change

**Before:**
```tsx
{!curriculumSummary && (
  <span className="text-sm text-text-muted">No curriculum placement</span>
)}
```

**After:**
```tsx
{!curriculumSummary && (
  <span className="flex items-center gap-1.5 text-sm text-status-orange">
    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
    No curriculum level — assign one to begin tracking
  </span>
)}
```

Changes: color (muted → status-orange), icon (none → AlertCircle), copy ("No curriculum placement" → "No curriculum level — assign one to begin tracking").

This matches the urgency level of the directory signal and gives the director a clear prompt to act.

## What was preserved

- All header layout (initials avatar, name, LevelBadge, AdvancementStatusBadge, stage name, last evaluated)
- Component interface — no prop changes
- All DONNA focus targets (`player-profile-header` wraps this component)

# DONNA Mobile Panel Polish — Sprint 1032

**Date:** 2026-05-31
**Sprint:** 1032

---

## UX problems fixed

### Problem 1: iOS zoom on input focus

The DONNA textarea had `text-xs` (12px). iOS Safari automatically zooms in on any input element with font-size below 16px when focused. This causes a jarring zoom animation that disrupts the mobile experience.

**Fix:** `text-base sm:text-xs` — 16px on mobile (prevents zoom), 12px on desktop (compact panel).

### Problem 2: Pull-to-refresh on panel scroll

The panel body had `overflow-y-auto` but no `overscroll-contain`. On mobile, scrolling to the top or bottom of the panel could trigger the browser's pull-to-refresh behavior, interrupting the director/coach session.

**Fix:** Added `overscroll-contain` to the panel body — scroll is contained within the panel, pull-to-refresh is suppressed.

---

## Files changed

- `DonnaVoiceLayer.tsx` — textarea `text-xs` → `text-base sm:text-xs`
- `DonnaAssistantButton.tsx` — panel body `overflow-y-auto` → `overflow-y-auto overscroll-contain`

---

## What stays the same

- All panel functionality unchanged
- Desktop appearance unchanged (sm: breakpoint restores text-xs at ≥640px)
- Panel height/width unchanged
- Voice layer behavior unchanged

---

## What still needs visual QA

- Confirm on iPhone: no zoom when tapping DONNA textarea
- Confirm on Android: pull-to-refresh doesn't fire when scrolling panel
- Confirm desktop: textarea still shows compact 12px font

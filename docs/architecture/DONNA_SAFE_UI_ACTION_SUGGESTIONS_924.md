# DONNA Safe UI Action Suggestions — Architecture
**Sprint:** 924 | **Date:** 2026-05-29

---

## 1. What Changed

Added `DonnaUIActionSuggestionPanel` to `/director/donna` right column.

Uses existing:
- `donnaUIActionRegistry.ts` (Sprint 753) — action registry
- `getUIActionsForPage(pathname)` — per-page action filtering
- `UIActionSafetyClass` — 6-class safety model

---

## 2. Component

Client component (needs `useState` for expand/collapse). Takes `pathname` prop.

Filtering logic:
- Shows `always_safe`, `safe_with_context`, `draft_to_review` in main list (wired/partially_wired only)
- Shows `director_approval` in separate "Approval Required" section
- Never shows `always_blocked` or `platform_required`

---

## 3. V2 Gaps

1. Panel doesn't use live `pathname` (hardcoded `/director/donna`) — V2 should use `usePathname()` so it reflects current page on route changes
2. "Try: ..." chip should prefill DONNA input on click
3. No wiring to the floating panel action chips yet

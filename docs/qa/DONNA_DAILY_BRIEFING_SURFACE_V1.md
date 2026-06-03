# DONNA Daily Briefing Surface V1

**Sprint:** Mega Sprint 1681–1690
**Date:** 2026-06-03
**File:** `src/components/donna/DonnaDailyCOOBriefSurface.tsx`

---

## Show-Once-Per-Day Logic

| Check | Status |
|---|---|
| First visit today: `localStorage[BRIEF_DATE_KEY]` absent → surface renders | PASS |
| First visit today: `localStorage[BRIEF_DATE_KEY]` = yesterday → surface renders | PASS |
| After dismiss: `localStorage[BRIEF_DATE_KEY]` = today → surface hidden on reload | PASS |
| Same-session navigation: after dismiss, surface stays hidden | PASS |
| New day: `localStorage[BRIEF_DATE_KEY]` = yesterday → surface renders again | PASS |
| SSR-safe: `hasBriefBeenShownToday()` returns false when `window === 'undefined'` | PASS |
| `useEffect` gates the localStorage check — no hydration mismatch | PASS |

---

## Content

| Check | Status |
|---|---|
| Shows personalized opening line: "Good morning Brian." | PASS — from `buildDailyCOOBriefing(null, directorName)` |
| Shows anonymous opening: "Good morning." when no name | PASS |
| Shows top 3 priority items (linked to action route) | PASS |
| Shows honest empty state when no items | PASS — "No urgent items today" |
| Shows empty-data note when `ctx=null` | PASS — "Academy data will appear once sessions…" |
| Items link to correct `actionHref` | PASS — from `BriefingItem.actionHref` |
| "Open full brief" link goes to `/director/donna` | PASS |

---

## Urgency Color Coding

| Urgency | Color Class | Status |
|---|---|---|
| `critical` | `text-status-red` | PASS |
| `high` | `text-status-orange` | PASS |
| `medium` | `text-lime` | PASS |
| `informational` | `text-text-secondary` | PASS |

---

## Interaction

| Interaction | Behavior | Status |
|---|---|---|
| Click expand arrow | Shows detailed `whyItMatters` + `suggestedAction` per item | PASS |
| Click X (header) | Calls `dismiss()` → marks shown today | PASS |
| Click "Dismiss for today" (footer) | Calls `dismiss()` → marks shown today | PASS |
| Click item link | Navigates to `actionHref` | PASS |
| Click "Open full brief" | Navigates to `/director/donna` | PASS |

---

## Safety Invariants

- No DB writes — display only
- No mutations — `buildDailyCOOBriefing(null, ...)` is pure TypeScript
- No fake data — `null` context produces honest empty-state copy
- No parent/player data in brief items — all items are aggregate counts only
- `requiresApproval: true` items displayed as information, not auto-triggered

---

## Known Limitations

| Limitation | Impact |
|---|---|
| Built with `directorCtx=null` — all item counts are 0 | Brief shows "No urgent items" until a page with loaded directorCtx is used — honest but not ideal for first-load |
| Dismiss does not persist across browser sessions (localStorage OK; but incognito clears) | Brief reappears in incognito — acceptable for V1 |
| "Show again" button not yet exposed in UI | Director must clear localStorage manually — add "Show again" chip in a future polish sprint |

---

## Manual Test Steps

1. Clear `localStorage['donna_brief_shown_date']` in browser dev tools
2. Navigate to any director page
3. Confirm `DonnaDailyCOOBriefSurface` renders below the COO status bar
4. Click "Dismiss for today"
5. Refresh the page — confirm surface does NOT reappear
6. Set `localStorage['donna_brief_shown_date']` to yesterday's date
7. Refresh — confirm surface reappears
8. Click "Open full brief" — confirm navigation to `/director/donna`

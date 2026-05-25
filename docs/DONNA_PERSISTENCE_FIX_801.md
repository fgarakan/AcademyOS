# Sprint 801 — DONNA Persistence Fix V1

**Date:** 2026-05-25
**Sprint:** 801
**Type:** UX fix — commandResponse persistence across route changes
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 799 audit identified DONNA persistence as the most impactful experience failure:

> **DONNA persistence (experience): 45/100**
>
> "commandResponse cleared on route change (line ~1089) — DONNA's answer disappears on navigation.
>  cooThread NOT cleared on route change (preserved). Asymmetry is confusing."

**Root cause:** The route-change `useEffect` (triggered on every `pathname` change) explicitly called `setCommandResponse(null)`. This meant:
- Director asks DONNA: "What needs my attention?"
- DONNA answers with a list of players
- Director clicks a player link (navigation)
- DONNA panel reopens — **answer is gone**
- Director must re-ask the same question

This broke the operating model: DONNA should feel like a persistent presence, not a form that resets on every page load.

---

## Change

**Single-line removal** in the route-change `useEffect`:

```tsx
// Before (line 1089 in sprint 800):
setCommandResponse(null)

// After (Sprint 801):
// Sprint 801 — commandResponse intentionally NOT cleared on route change.
// DONNA's answer now persists when the director navigates (e.g. clicks a link in the answer).
// It clears on: panel close, explicit dismiss, new submission, mode change, or closePanel().
```

---

## Persistence matrix after Sprint 801

| Event | commandResponse |
|---|---|
| Director navigates to another page | ✅ **Preserved** (Sprint 801 fix) |
| Director clicks a link inside DONNA's answer | ✅ **Preserved** |
| Director closes DONNA panel (X button) | 🗑 Cleared — `closePanel()` still resets |
| Director submits a new prompt | 🗑 Cleared — existing `setCommandResponse(null)` before each response |
| Director clicks "Dismiss" on the response card | 🗑 Cleared — `onDismissCommandResponse` handler |
| Director changes active mode | 🗑 Cleared — existing behavior preserved |

---

## Why the other resets stay

The route-change `useEffect` still clears:
- `templateDraft`, `genericDraft`, `activeMode` — draft forms are page-scoped
- `actionPreview`, `contextSummary`, `suggestions` — page-specific data
- `reviewQueueData`, `isLoadingReviewQueue` — refreshed on next open
- Voice state (transcripts, onboarding step, etc.) — safety requirement

`commandResponse` was the only piece of DONNA's output that should survive navigation.

`cooThread` was already preserved across route changes (Sprint 683 decision). `commandResponse` now matches that behavior.

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ Local state only |
| No RLS change | ✅ Not touched |
| closePanel() still clears commandResponse | ✅ Line 893 unchanged |
| New submission still clears commandResponse | ✅ All `setCommandResponse(null)` before set-new calls preserved |
| Dismiss handler still clears commandResponse | ✅ `onDismissCommandResponse` unchanged |
| No auto-submit, no approval bypass | ✅ Not touched |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 801

| Dimension | Sprint 799 audit | Sprint 801 estimate |
|---|---|---|
| DONNA Persistence (experience) | 45/100 | ~62/100 |
| DONNA Persistence (architecture) | 72/100 | 72/100 (unchanged) |

**Key gain:** The most common DONNA failure — "I just told her what I need and it disappeared" — is eliminated. Answer now survives director navigation.

---

## Recommended Sprint 802

**Suggested:** DONNA Command Understanding — Wire "Close Donna" + "Open that" text commands

The audit found:
- "Close Donna" typed in the input → no effect (closes button only wired to UI button)
- "Open that" → no `resolveFollowUp` coverage for most intents (only daily_brief, review_queue, attention)

Sprint 802: add text command matching in `handleCommandSubmit` for "close donna" → `closePanel()`, and expand `resolveFollowUp` to cover at least 3 more intent families (player_profile, session, curriculum).

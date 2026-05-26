# Sprint 836 — Attendance Exception DONNA Highlight + Review Link V1

**Date:** 2026-05-26
**Sprint:** 836
**Type:** UX fix — DONNA navigation highlight + review queue link
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 834 — Attendance Exception End-to-End Audit (GAP-B, GAP-C)

Two lowest-risk UX gaps remained after Sprint 835:

**GAP-B:** `/director/review/page.tsx` attendance exceptions section had no `data-donna-focus-id`
attribute. After DONNA routed the director to the review queue, it could not highlight the
Attendance Exceptions section. The DONNA highlight system uses `data-donna-focus-id` attributes
on DOM elements to scroll-to and glow the relevant section. Without it, the navigation fired
but nothing was visually highlighted.

**GAP-C:** `DonnaAttendanceExceptionCard` success state showed the text
`"View and apply in the Review Queue when ready"` as a plain `<p>` with no link.
Directors had to manually navigate to `/director/review` after seeing the success message.
One extra navigation step with no affordance.

---

## Solution

Three small changes, no backend impact:

### 1. `data-donna-focus-id` on review page attendance section

**File:** `src/app/director/review/page.tsx`

Added `data-donna-focus-id="attendance-exceptions-section"` to the outer `<div>` wrapping
the attendance exceptions section (pending + approved attendance drafts). This is the same
pattern used on other reviewable sections (template drafts, wrap-up drafts) already present
in the codebase.

The section renders conditionally only when
`(pendingAttendanceDrafts.length + approvedAttendanceDrafts.length) > 0`. The DONNA focus
system handles the case where the target element is absent — it degrades gracefully (no crash,
just no scroll).

### 2. Review Queue link in success copy

**File:** `src/components/assistant/DonnaAttendanceExceptionCard.tsx`

`Link` from `next/link` was already available (it existed in prior Link usage elsewhere in the
component). Changed `<p>` success copy to a `<Link href="/director/review">` inline link
inside the existing text. The link uses the design system underline treatment:
`underline underline-offset-2 hover:text-text-secondary transition-colors`.

Before:
```
View and apply in the Review Queue when ready. Director approval required …
```

After:
```
View and apply in the [Review Queue] when ready. Director approval required …
```
(where `[Review Queue]` is a clickable `<Link href="/director/review">`)

### 3. `focusTarget` on `draft_attendance_exception` dispatch result

**File:** `src/lib/donna/donnaUIActionDispatcher.ts`

Added `focusTarget` to the `draft_attendance_exception` intent dispatch result, matching the
pattern used for `start_class_template_builder` (lines 530–537 of the dispatcher). This
ensures that after DONNA routes the director to `/director/review` following an attendance
exception queue action, it also sets the `DonnaFocusTarget` in sessionStorage to
`attendance-exceptions-section`. The DONNA highlight runtime picks this up on the next page
render and highlights the correct section.

```ts
focusTarget: {
  route: '/director/review',
  targetId: 'attendance-exceptions-section',
  label: 'Attendance Exceptions',
  reason: 'Your attendance exception draft is in this section — review and approve it here.',
  sourceCommand: text,
  highlightStyle: 'teal-glow',
},
```

---

## Files Created

### `docs/ATTENDANCE_EXCEPTION_DONNA_HIGHLIGHT_REVIEW_LINK_836.md`

This file.

---

## Files Modified

### `src/app/director/review/page.tsx`

Added `data-donna-focus-id="attendance-exceptions-section"` to the outer `<div>` wrapping the
pending + approved attendance drafts section. One attribute addition. No logic changes.

### `src/components/assistant/DonnaAttendanceExceptionCard.tsx`

Added `import Link from 'next/link'` and changed the `queueResult.ok` success paragraph to
include an inline `<Link href="/director/review">Review Queue</Link>` link. No prop changes,
no state changes, no logic changes.

### `src/lib/donna/donnaUIActionDispatcher.ts`

Added `focusTarget` object to the `draft_attendance_exception` dispatch result. No type
changes (the field is already part of the dispatch result type). No logic changes.

---

## Before / After

| Gap | Before | After |
|---|---|---|
| DONNA highlight on review queue | Navigate fires, nothing highlighted | Scrolls to + glows Attendance Exceptions section |
| Review Queue link in success card | Plain text only | Inline `<Link>` to `/director/review` |
| DONNA focusTarget for attendance exception | Not set | Set to `attendance-exceptions-section` on `/director/review` |

---

## Safety Guardrails Preserved

| Guarantee | Status |
|---|---|
| No backend changes | ✅ attribute + link + dispatcher field only |
| No SQL / RLS / migrations | ✅ none |
| No env / seed changes | ✅ none |
| No attendance written | ✅ all writes still behind director Approve → Apply |
| No new components | ✅ uses existing `Link` from next/link |
| TypeScript clean | ✅ `npx tsc --noEmit` — exit 0 |

---

## Remaining Attendance Gaps (Post Sprint 836)

| Gap | Source | Priority |
|---|---|---|
| Two review cards for one session (wrap-up + attendance exception) — not visually linked | Sprint 834 | Low |
| `extractAbsentNames` single-trigger limitation in DONNA/director paths (not wrap-up parser) | Sprint 834 | Low |
| Ambiguous first name — multiple roster players with same first name → first match used | Sprint 834 | Medium |
| Session picker window (7 days / 5 sessions) in DONNA path — may miss older sessions | Sprint 834 | Low |

---

## Recommended Sprint 837

**Sprint 837 — Ambiguous Name Resolution in Attendance Exception Drafts V1**

Address the medium-priority gap: when multiple rostered players share a first name, the
current parser takes the first roster match. A director-facing disambiguation card in
`AttendanceExceptionDraftCard` (showing both candidates with a "Which player?" selector)
would complete the attendance matching loop for academies with name collisions.

Risk: Low — UI-only change, no new DB writes; disambiguation choice feeds into the existing
`rostered_attendance` slot before the director clicks Approve.

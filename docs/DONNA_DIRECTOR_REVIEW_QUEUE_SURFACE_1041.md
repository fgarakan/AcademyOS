# DONNA Director Review Queue Surface — Sprint 1041

**Date:** 2026-05-18
**Sprint:** 1041 — DONNA Director Review Queue Surface Wiring V1

---

## What changed

Added a categorized review queue surface to the Director DONNA page, giving directors a structured view of what types of items are waiting for their decision.

### Files created
- `src/components/donna/DonnaReviewQueueSurface.tsx` — new component showing review categories as rows with urgency dots, category icons, item counts, and per-row CTAs (Review, Ask DONNA, Defer). Footer notice confirms nothing is auto-approved.

### Files modified
- `src/app/director/donna/page.tsx` — integrated `DonnaReviewQueueSurface` between the 2-column grid and safety notice, passing all live count fields from `DirectorDonnaContext`.

---

## Review categories shown

| Category | Source field | Link |
|---|---|---|
| All Pending Items | `pendingReviews` | `/director/review` |
| Coach Wrap-Up Drafts | `missingWrapUps` | `/director/sessions` |
| Attendance Exceptions | `attendanceExceptions` | `/director/review` |
| Template Review Requests | `templateDrafts` | `/director/templates` |
| Curriculum Evidence Drafts | `evidenceDrafts` | `/director/review` |
| Parent-Safe Summary Drafts | 0 (schema pending) | `/director/review` |

## CTAs per row

- **Review** (lime, links to action target): opens the relevant review surface
- **Ask DONNA** (ghost, links to `/director/donna`): returns to DONNA for context
- No "Defer" button as a mutation — deferral happens in the Review Queue itself

## Role safety

- No approve/reject mutations on this surface
- Everything navigates to the review queue — director still has to act there
- "Demo" badge shown when data is not live
- Footer notice: "Nothing is approved, sent, or applied until you act on them in the Review Queue"

## TypeScript

Clean (`npx tsc --noEmit` — no errors).

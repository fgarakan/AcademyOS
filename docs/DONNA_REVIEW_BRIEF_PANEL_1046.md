# DONNA Review Brief Panel — Sprint 1046

**Date:** 2026-05-18
**Sprint:** 1046 — DONNA Review Brief Panel V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

Added `DonnaReviewBriefPanel` to the Director Review Queue page. The panel surfaces DONNA's interpretation of what the director should review first.

### Files created
- `src/app/director/review/DonnaReviewBriefPanel.tsx` — new review brief panel component

### Files modified
- `src/app/director/review/page.tsx` — imported panel, computed `staleDaysMaxValue`, inserted panel between page header and section summary cards

---

## Panel behavior

### When queue is clear
- Compact lime-bordered row with "Queue clear" message
- DONNA explains what will surface here when coaches submit

### When items are pending
- Orange-bordered (stale) or lime-bordered (normal) banner
- Summary sentence with total pending count and stale warning if oldest item is 7+ days
- Breakdown chips: clickable links to each tab section (needs approval, player updates, curriculum/session, ready-to-apply count)
- Additional detail chips: wrap-up count, attendance exception count, parent comm draft count (not clickable — informational)
- Recommended action CTA with arrow — directs director to the most urgent tab

### Urgency logic
Priority order for recommendation:
1. Stale items (7+ days old) → needs_approval first, then player_updates
2. Pending wrap-ups → needs_approval
3. Pending attendance exceptions → needs_approval
4. Pending parent comm drafts → needs_approval
5. Player updates pending → player_updates
6. Curriculum/session pending → curriculum_session

---

## Props

```typescript
interface Props {
  totalPending: number        // sum of all 3 section pending counts
  needsApprovalCount: number  // needs_approval tab pending
  playerUpdatesCount: number  // player_updates tab pending
  curriculumSessionCount: number // curriculum_session tab pending
  readyToApplyCount: number   // approved items across all tabs, ready to apply
  staleDaysMax: number | null // oldest pending item age in days
  wrapUpsPending: number      // session_wrap_up_v1 pending count specifically
  attendanceCount: number     // attendance_exception pending count specifically
  parentCommCount: number     // parent_communication pending count specifically
}
```

---

## Page placement

Inserted between the page header block and the 4-tile section summary card grid. No existing section was removed or modified. The existing stale alert banner and all-clear state remain below the section summary cards.

---

## Safety

- No DB writes
- No DB mutations
- No automatic approvals
- No parent sends
- All CTAs are review-only links to existing tabs
- Safety notice at bottom of panel: "DONNA surfaces items — you review and approve. Nothing is applied automatically."

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).

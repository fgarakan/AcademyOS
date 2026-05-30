# DONNA Review Queue Guidance — Sprint 971

**Date:** 2026-05-30
**Sprint:** 971
**Status:** Implemented — TypeScript clean

---

## What Was Built

Sprint 971 makes DONNA useful inside the Director Review Queue. When a director is on `/director/review`, DONNA can now answer:

- "What should I review first?" → priority-ranked ordering with rationale
- "What is safe to approve?" → explains the approval contract clearly
- "What requires caution?" → highlights parent-facing and level-movement items

Plus three new chips on the review page:
- "What should I review first?" (prompt)
- "Highlight review queue" (highlight → `review-queue-primary`)
- "What is safe to approve?" (prompt)

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/donna/reviewQueueGuidance.ts` | Created — deterministic guidance builder |
| `src/lib/donna/donnaPageChipRegistry.ts` | Modified — 3 new chips on `/director/review` |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified — import + handler in `detectAndHandleCommand` |

---

## Guidance Intent Coverage

| Intent | Trigger Phrases |
|---|---|
| `first_priority` | "what should I review first", "review first", "prioritize the queue" |
| `safe_to_approve` | "what is safe to approve", "safe to approve", "safe here" |
| `what_caution` | "what requires caution", "what to be careful", "what is risky" |

---

## Review Queue Chip Set (Post-971)

| ID | Label | Action |
|---|---|---|
| `rev-approve` | What needs approval? | prompt |
| `rev-explain` | Explain this queue | prompt |
| `rev-brief` | Show daily brief | brief |
| `rev-review-first` | What should I review first? | prompt (new) |
| `rev-highlight-queue` | Highlight review queue | highlight → `review-queue-primary` (new) |
| `rev-safe-approve` | What is safe to approve? | prompt (new) |

---

## Review Priority Order (DONNA's Answer)

1. **Wrap-ups** — coach observations waiting to become official player evidence
2. **Attendance exceptions** — affect player records, need quick resolution
3. **Player update drafts** — parent-safe messages waiting for approval

Review oldest items in each category first. Nothing changes until explicit approve/reject.

---

## Safety Guarantees

- No auto-approve behavior added
- Sprint 904 approve/reject controls unchanged
- No proposed_actions created by guidance helper
- No parent/player communication sent
- `buildReviewQueueGuidance` is pure text — no side effects
- `matchesReviewQueueGuidanceIntent` does not overlap with `matchesDailyBriefIntent` or `matchesWhatNextIntent`

---

## No-Migration Guarantee

- No schema changes
- No RLS changes
- No new API routes
- No new DONNA surfaces

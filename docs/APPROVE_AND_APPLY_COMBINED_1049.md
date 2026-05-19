# Approve + Apply Combined Action — Sprint 1049

**Date:** 2026-05-19
**Sprint:** 1049 — Approve and Apply Combined Action V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

Added a combined "Approve & Apply" action for session wrap-up drafts. Directors can now approve and apply a wrap-up in one step without needing to click Approve, wait for the page to refresh, then find and click Apply.

### Files created
- `src/app/director/review/approveAndApplyWrapUpAction.ts` — combined server action

### Files modified
- `src/app/director/review/WrapUpDraftDecisionControls.tsx` — added "Approve & Apply" as primary button; existing two-step controls preserved

---

## Combined action: `approveAndApplyWrapUpAction`

### Safety invariants

| Invariant | Value |
|---|---|
| Only valid module | `session_wrap_up_v1` |
| Only valid status | `pending_review` |
| Auth required | Yes — `getSupabaseServer()` + user check |
| Academy scope | Resolved from authenticated profile; `academy_id` verified on action |
| Role guard | `academy_director` or `head_coach` only |
| Preview mode | Blocked — `assertNotPreviewMode()` |
| Parent records | Not touched |
| Player profiles | Not touched |
| Curriculum | Not touched |
| External sends | None |
| Auto level movement | None |

### Steps performed (in order)

1. Auth + academy resolve + role check
2. Load proposed_action — verify academy_id + module + status
3. Load session — verify belongs to academy
4. Build session_notes from wrap-up payload (same algorithm as `applyWrapUpDraftAction`)
5. Update `sessions`: write session_notes, advance status to `completed` if currently `planned` or `in_progress` (never goes backwards)
6. Update `proposed_actions`: set `status = 'executed'`, `approved_by`, `approved_at` in one update
7. Insert audit log: `action = 'session_wrap_up.approved_and_applied'`, `source = 'approve_and_apply_combined'`
8. `revalidatePath('/director/review')` and `revalidatePath('/director/sessions/[id]')`

### Failure behavior

If session update fails → returns error, no action status update.
If action status update fails → returns error with "Session updated but failed to mark draft as executed" (partial state possible — surface to director to investigate).

---

## UI changes in WrapUpDraftDecisionControls

The control panel now shows:

1. **Approve & Apply** — primary full-width lime button at top
   - Label: "Approve & Apply · Does both in one step"
   - Safety note below: "Writes session notes and marks the session completed. Nothing is sent to parents."

2. **Divider** — "or review separately"

3. **Standard two-step controls** — preserved as-is
   - Approve only
   - Needs Clarification
   - Reject
   - Clarification note textarea (visible to coach)

### Success state

- Combined: "Approved and applied. Session notes written and session marked completed. Refreshing…"
- Approve only: "Decision recorded. Refreshing queue…"

---

## What is NOT changed

- `applyWrapUpDraftAction.ts` — untouched. Two-step flow still fully available.
- `updateWrapUpDraftDecisionAction` in `actions.ts` — untouched.
- All other decision controls (attendance, observation, etc.) — untouched.
- `ApplyWrapUpDraftControls.tsx` — untouched.

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).

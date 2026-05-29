# Coach Session Recap Review Status — Architecture

**Sprint:** 932 | **Date:** 2026-05-29

---

## Summary

Sprint 932 adds a "Your player notes" section to the coach wrap-up review page (`/coach/sessions/[sessionId]/wrap-up/review`), surfacing the director review status of each player observation draft submitted during the session wrap-up.

This closes the full coach → director → coach feedback loop:

```
Coach submits player notes (Sprint 927)
    ↓ proposed_actions: coach_observation_draft_v1, status: pending_review
Director reviews and decides (Sprint 931: Approve / Reject / Request clarification)
    ↓ proposed_actions.status updated
Coach sees what happened (Sprint 932: "Your player notes" on wrap-up review page)
```

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Added observation draft query + "Your player notes" section |

---

## Data query

```ts
proposed_actions
  WHERE academy_id = academyId          // RLS boundary
    AND target_module = 'coach_observation_draft_v1'
    AND proposed_by_id = user.id        // coach sees only their own drafts
    AND status IN [all statuses]
  ORDER BY created_at ASC
  LIMIT 20

// Server-side filter (payload is JSON, not a column):
.filter(row => row.proposed_payload?.session_id === sessionId)
```

**Why payload filter instead of column filter:** `target_object_id` on observation drafts is the player's ID, not the session ID. The `session_id` is stored in `proposed_payload.session_id`. Filtering in server code after a small result set is the same pattern used in the director review queue for payload-type filtering.

**Safety scoping:** `proposed_by_id = user.id` ensures coaches see only their own drafts, not other coaches' observations for the same session.

---

## Displayed fields

| Field | Source | Notes |
|---|---|---|
| Player name | `proposed_payload.player_name` | Written by coach at submission |
| Observation type | `proposed_payload.observation_type` | Mapped to Positive/Needs attention/General |
| Note preview | `proposed_payload.note` (first 100 chars) | Coach's own text — safe to show |
| Status | `proposed_actions.status` | Mapped to human label |
| Director note | `proposed_actions.reviewer_notes` | Only shown for clarification_needed/rejected |

---

## Status label mapping

| DB status | Displayed label | Color |
|---|---|---|
| `pending_review` | "Pending review" | Blue |
| `approved` | "Approved" | Green |
| `executed` | "Applied" | Green |
| `rejected` | "Needs revision" | Red |
| `clarification_needed` | "Director has questions" | Orange |

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — read-only |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ — not touched |
| Sprint 931 director review queue unchanged | ✅ — not touched |
| proposed_by_id scoping | ✅ — coach sees only their own drafts |
| academy_id scoping | ✅ |
| Raw IDs not shown in UI | ✅ |
| Raw DB status names not in UI | ✅ — mapped to human labels |
| Best-effort query | ✅ — try/catch; page renders without section on failure |
| Note preview safe to show | ✅ — coach wrote it themselves |
| Director note shown only for actionable statuses | ✅ — only clarification_needed + rejected |

---

## Known limitations

- Coach cannot respond to clarification requests from this page — they see "Director has questions" status and the director's note, then discuss offline. A formal in-app response flow is a V2 consideration.
- The observation draft section always renders (as empty state) even when no wrap-up was submitted — this is correct: a coach could have submitted observations separately from the main wrap-up flow.
- Draft order is ascending by `created_at` — coaches see their earliest submitted notes first.

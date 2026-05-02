# AI Suggestions QA Checklist

_Sprint 185 — Academy OS_

---

## Test Checklist

| # | Test | Expected Result | Pass |
|---|---|---|---|
| 1 | AI Suggestions card appears on Director Dashboard | Card visible with pending count and link | ☐ |
| 2 | Academy Intelligence quick action links to `/director/ai-suggestions` | Clicking navigates to AI Suggestions page | ☐ |
| 3 | Sidebar shows "AI Suggestions" under Intelligence section | Nav item visible and active-highlighted when on page | ☐ |
| 4 | `/director/ai-suggestions` loads without error | Page renders with header, stat cards, tabs, guardrail note | ☐ |
| 5 | "Generate Suggestions" button creates pending suggestions | Suggestions appear in Pending tab after generation | ☐ |
| 6 | Duplicate pending suggestions are not re-created | Re-running Generate Suggestions does not duplicate existing pending items | ☐ |
| 7 | Suggestion cards show title, category badge, priority pill, confidence | All metadata visible on collapsed card | ☐ |
| 8 | Expanding a card shows evidence section | Evidence items listed with confidence label | ☐ |
| 9 | Expanding a card shows "If accepted" impact preview | Green-highlighted panel with CheckCircle items | ☐ |
| 10 | Expanding a card shows "Will not change" section | Surface-raised panel with XCircle items | ☐ |
| 11 | Expanding a card shows "Recommended next step" | Arrow icon + next step text if present | ☐ |
| 12 | Accept marks suggestion as accepted | Card shows "Accepted." result; suggestion moves to Accepted tab on reload | ☐ |
| 13 | Deny shows optional note input, then marks suggestion denied | Confirm Deny → card shows "Denied."; moves to Denied tab on reload | ☐ |
| 14 | Defer shows optional note input, then marks suggestion deferred | Confirm Defer → card shows "Deferred."; moves to Deferred tab on reload | ☐ |
| 15 | No suggestion applies any data change automatically | Accepting a suggestion only updates its status — no player/session mutation | ☐ |
| 16 | No parent/player communication is sent | No email, push, or SMS triggered by any suggestion action | ☐ |
| 17 | No player level is moved | Player `current_level_id` unchanged after any suggestion action | ☐ |
| 18 | No global curriculum or master template is changed | Template tables unchanged after any suggestion action | ☐ |
| 19 | Filter tabs show correct counts | Pending/Accepted/Denied/Deferred tab counts match database state | ☐ |
| 20 | Empty state shows for tabs with no suggestions | Appropriate empty message per tab status | ☐ |
| 21 | TypeScript passes with no errors | `npx tsc --noEmit` returns clean | ☐ |

---

## Known Limitations (V1)

- Suggestions are purely deterministic — no external AI API or LLM used.
- "Applied" status is available in data model but not surfaced in UI (future sprint).
- `audit_logs` integration is pending (suggestion status changes are recorded in the suggestions table itself for now).
- Suggestion generation reads from `v_player_summary` view — if the view is unavailable, generation falls back to an empty player list gracefully.
- `will_not_change` and `evidence` are rendered from the stored JSONB; editing suggestion content is not supported in V1.

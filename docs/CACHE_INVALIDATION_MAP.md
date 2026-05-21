# Cache Invalidation Map

> Sprint 406 — Cache Invalidation + Revalidation Map V1
> See also: `docs/CACHE_TTL_IMPLEMENTATION_NOTES.md`, `docs/cache-and-performance-principles.md`

---

## Overview

This map defines: for every mutation path, what data is affected, which pages/routes must be revalidated, and the current implementation status.

The revalidation helpers live in `src/lib/cache/revalidation.ts`. They wrap `revalidatePath()` with typed, intent-clear names.

---

## Mutation → Revalidation Table

### Player Mutations

| Mutation | Affected data | Pages/routes to revalidate | Revalidation helper | Status |
|---|---|---|---|---|
| Player priority updated | player_priorities | `/director/players/[id]`, `/director/players`, `/player` | `revalidatePlayerPriorities(playerId)` | Not yet wired |
| Player dev summary updated | player_development_summary | `/director/players/[id]`, `/player`, `/parent` | `revalidatePlayerDevelopmentSummary(playerId)` | Not yet wired |
| Player level changed | players.current_level_id | `/director/players/[id]`, `/director/players`, `/player` | `revalidatePlayerPath(playerId)` | Not yet wired |
| Player activated | players.is_active | `/director/players`, `/player` | `revalidatePlayerPath(playerId)` | Not yet wired |
| Player note created | player_notes | `/director/players/[id]` | `revalidatePlayerPath(playerId)` | Not yet wired |

### Session Mutations

| Mutation | Affected data | Pages/routes to revalidate | Revalidation helper | Status |
|---|---|---|---|---|
| Session wrap-up draft saved | proposed_actions | `/director`, `/director/donna` | `revalidateApprovalCenter()` | Not yet wired |
| Attendance exception saved | proposed_actions | `/director`, `/director/donna` | `revalidateApprovalCenter()` | Not yet wired |
| Session attendance recorded | session_attendance | `/coach/sessions/[id]`, `/player`, `/parent` | `revalidateSessionAttendance(sessionId)` | Not yet wired |
| Session plan created | sessions, session_blocks | `/coach/sessions`, `/coach/sessions/[id]` | `revalidateSessionPath(sessionId)` | Not yet wired |
| Session finalized | sessions.status | `/coach/sessions`, `/director` | `revalidateSessionPath(sessionId)` | Not yet wired |

### Template Mutations

| Mutation | Affected data | Pages/routes to revalidate | Revalidation helper | Status |
|---|---|---|---|---|
| Template published | templates.status | `/director/class-templates`, `/coach` | `revalidateTemplatePath(templateId)` | Not yet wired |
| Template block added/reordered | template_blocks | `/director/class-templates/[id]`, `/coach/sessions/[id]` | `revalidateTemplatePath(templateId)` | Not yet wired |
| Template archived | templates.status | `/director/class-templates` | `revalidateTemplatePath(templateId)` | Not yet wired |

### Approval / DONNA Mutations

| Mutation | Affected data | Pages/routes to revalidate | Revalidation helper | Status |
|---|---|---|---|---|
| Proposed action approved | proposed_actions.status | `/director`, `/director/donna` | `revalidateApprovalCenter()` | Not yet wired |
| Proposed action rejected | proposed_actions.status | `/director`, `/director/donna` | `revalidateApprovalCenter()` | Not yet wired |
| execute_approved_action completes | varies by action_type | Depends — see player/session rows above | Depends | Not yet wired |

### Parent/Player Portal Mutations

| Mutation | Affected data | Pages/routes to revalidate | Revalidation helper | Status |
|---|---|---|---|---|
| `show_to_parent` set true on dev summary | player_development_summary | `/parent` | `revalidateParentPortal()` | Not yet wired |
| `show_to_student` set true on dev summary | player_development_summary | `/player` | `revalidatePlayerPortal()` | Not yet wired |

---

## Race Condition Notes

### Approval → Execute → Revalidate

When a director approves a proposed_action:
1. `status → approved` (write 1)
2. `execute_approved_action()` runs (write 2 — actual mutation)
3. `revalidatePath()` must fire after write 2, not after write 1

If revalidation fires after write 1 only, pages will rerender before the mutation is applied — users may see the pre-approved state briefly.

**Fix:** Call revalidation helpers after `execute_approved_action()` confirms success, not after the approval write.

### Parallel Mutations

If two coaches modify the same session simultaneously:
- Both fire `revalidateSessionPath(sessionId)`
- The second revalidation wins
- No data corruption — just potential brief flash of stale state

This is acceptable at current pilot scale.

---

## Current Implementation Status

As of Sprint 406:
- Revalidation helpers are defined in `src/lib/cache/revalidation.ts`
- Helpers are NOT yet called from server actions
- Existing `revalidatePath` calls are inline (no helpers)

**To wire up:**
1. Import the appropriate helper at the top of each server action
2. Call it at the end of the successful write path
3. Remove the inline `revalidatePath` call if one exists

---

## What Was Not Implemented in Sprint 406

- `revalidateTag` support (requires Next.js cache tags configured)
- Automatic revalidation on `execute_approved_action()` (requires DB trigger or server-side hook)
- Stale-while-revalidate patterns
- CDN/edge cache invalidation (not applicable at current scale)

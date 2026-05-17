---
name: academy-os-platform-owner-command-center-guard
description: Guards the platform owner command center and multi-tenant intelligence layer in AcademyOS. Use before any sprint that adds or modifies the platform owner portal, preview mode, multi-academy views, or the director command center. Prevents platform-owner data from leaking into academy portals, demo mode from contaminating live data, and command center patterns from bypassing the review-first pipeline.
---

# AcademyOS Platform Owner Command Center Guard

## Purpose

AcademyOS has two distinct authority levels above the director role:

1. **Platform owner** (`platform_roles` table) — can see all academies, switch between portals using preview mode, and access multi-academy intelligence at `/platform`
2. **Director command center** (`/director/command-center`) — a director's own command interface, DONNA-driven, scoped to their academy only

These are separate surfaces with different data scopes, different permission models, and different UX requirements. This skill ensures new work in either surface does not mix academy data across tenants, does not give command center users platform-owner privileges, and does not allow the command center to bypass the review queue.

---

## When to Use

Use this skill before any sprint that:

- Adds or modifies `/platform` routes or `platform_roles` queries
- Adds or modifies the preview mode cookie (`ao_preview`) logic
- Adds a new director command or command response in `/director/command-center`
- Adds DONNA commands that aggregate data across sessions, coaches, or players
- Changes how the director can initiate actions from the command center
- Modifies `src/middleware.ts` routing for portal segments
- Adds a new multi-academy view or cross-academy intelligence feature

---

## Platform Owner vs. Director: Data Scope

| Capability | Platform Owner (`/platform`) | Director (`/director`) |
|---|---|---|
| See all academies | ✅ | ❌ (own academy only) |
| Switch portal via preview | ✅ | ❌ |
| Academy Health cross-view | ✅ | ❌ |
| Player data | own academy via preview | own academy only |
| Approve proposed actions | ❌ direct (via director preview) | ✅ |
| Command center | ❌ (uses director preview) | ✅ |

A platform owner accessing a director portal does so through **preview mode only**. Preview mode is read-oriented. Writes require explicit director context. `assertNotPreviewMode()` must block all mutating server actions when the preview cookie is active.

---

## Preview Mode Rules

Preview mode is activated by the `ao_preview` cookie (set by the platform admin UI).

- Preview cookie format: `{ role: PreviewRole, academyId: string }`
- Supported preview roles: `academy_director`, `coach`, `player`, `parent`
- Middleware enforces: if `ao_preview` cookie is absent for a portal route, platform user is redirected to `/platform`
- Preview mode does not grant any write permissions beyond the normal role grants
- `assertNotPreviewMode()` in server actions returns `{ error: 'Writes are disabled in preview mode.' }` — never throws to client

---

## Director Command Center Rules

The command center at `/director/command-center` is a DONNA-driven natural language interface. It is NOT an admin panel.

### What the command center can do

- Surface live counts from `proposed_actions`, `sessions`, `players`
- Match typed or spoken commands to predefined response chips
- Create a `proposed_action` in the review queue (pending_review)
- Show DONNA's structured answer to "what needs attention today?"

### What the command center must never do

- Execute any action without creating a `proposed_action` first
- Bypass the review queue for any mutation
- Show data from another academy
- Give director-level approval power to coach users
- Use AI inference when deterministic pattern matching suffices (V1 is deterministic)

### Command routing integrity

Every new command type added to `donnaCommandRouter.ts` must include:

- `intent` — what the user said
- `routingNote` — why this route is safe and what it does
- `isReadOnly: true` if no mutation is involved
- `proposedActionType` if a proposed_action is created

---

## Pre-Sprint Checklist

Before implementing, answer each question:

1. Does the new platform route query only `platform_roles` users, not academy directors?
2. Does any new query in the director command center accidentally reach across `academy_id`?
3. Is preview mode correctly blocked from all mutating server actions?
4. Does any new command center action skip the `proposed_actions` pipeline?
5. Does the `ao_preview` cookie get invalidated correctly when preview ends?
6. Does any new cross-academy view expose one academy's player names or scores to a director of a different academy?
7. Is every new command type in `donnaCommandRouter.ts` accompanied by a `routingNote`?
8. Does any platform owner view show real player data without the director preview context being active?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Allow a director to see another academy's player data
- Allow a platform owner to approve proposed actions without entering director preview
- Remove or weaken `assertNotPreviewMode()` from any server action
- Add a command center action that executes a mutation without a `proposed_actions` entry
- Share `academy_id` data across tenants in any query
- Add a new platform route without `platform_roles` verification
- Allow preview mode to persist after the session ends without explicit invalidation

---

## AcademyOS-Specific Rules

- `platform_roles` table is not in `database.types.ts` — use `rawDb = supabase as any` for platform role queries.
- The middleware `PORTAL_SEGMENTS` set (`director`, `coach`, `player`, `parent`) defines which routes require preview validation for platform users.
- `PREVIEW_COOKIE` constant — use this everywhere. Never hardcode the cookie name.
- Platform owner's `/platform` page is a separate experience from any academy portal. It does not inherit the director sidebar or layout.
- Command center responses must include a `responseType` (`answer`, `draft`, `alert`, `redirect`) to allow DONNA to render them correctly.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Platform Owner Command Center Guard Report — Sprint XXX

**Surface:** [platform / director command center / both]
**Academy data isolation:** [clean / flag: what crosses academy_id]
**Preview mode write block:** [confirmed / flag: what bypasses assertNotPreviewMode]
**Command routing integrity:** [all routes have routingNote / flag: which are missing]
**Proposed_actions pipeline:** [all mutations create a PA / flag: what bypasses]
**Platform role verification:** [present / flag: which platform routes lack it]
**Cross-tenant data exposure:** [none / flag: what leaks]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```

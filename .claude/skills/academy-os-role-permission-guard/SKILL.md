---
name: academy-os-role-permission-guard
description: Guards role-based data visibility and action permissions in AcademyOS. Use before any sprint that adds or modifies what a role can see or do. Prevents data leakage across role boundaries, ensures server actions authenticate callers, and protects the proposed_actions pipeline from role bypass.
---

# AcademyOS Role Permission Guard

## Purpose

AcademyOS has five active roles with distinct data scopes and action permissions:

- `academy_director` → `/director` — full academy visibility, review queue approval
- `head_coach` / `coach` → `/coach` — session and player data for their own sessions
- `player` → `/player` — own profile only
- `parent` → `/parent` — own child's profile, no approval power
- Platform owner → `/platform` — cross-academy intelligence, preview mode only

This skill ensures new sprints do not widen these boundaries without explicit approval and do not allow lower-privilege roles to trigger higher-privilege mutations.

---

## When to Use

Use this skill before any sprint that:

- Adds a new server action
- Adds a new API route
- Adds a new data query in any portal
- Changes what data is displayed to coach, player, or parent
- Adds a new role or changes role routing in middleware
- Adds cross-role navigation (e.g., director viewing coach's screen)
- Modifies `src/middleware.ts` role routing logic

---

## Role Data Visibility Matrix

| Data Object | Director | Coach | Player | Parent | Platform Owner |
|---|---|---|---|---|---|
| All players (academy) | ✅ | ❌ (own sessions only) | ❌ | ❌ | via preview only |
| Own player profile | ✅ | ✅ (in session) | ✅ | ✅ (child) | via preview only |
| Session notes (all) | ✅ | own sessions | ❌ | ❌ | via preview only |
| KPI / Academy Health | ✅ | ❌ | ❌ | ❌ | via preview only |
| Review queue | ✅ | ❌ | ❌ | ❌ | ❌ |
| Parent draft content | ✅ | ❌ | ❌ | own child | via preview only |
| Proposed actions | ✅ | own drafts | ❌ | ❌ | via preview only |
| Curriculum versions | ✅ | read-only | ❌ | ❌ | via preview only |
| Voice intake (own) | ✅ | ✅ | ❌ | ❌ | via preview only |
| Audit logs | ✅ | ❌ | ❌ | ❌ | via preview only |

---

## Role Action Permission Matrix

| Action | Director | Coach | Player | Parent |
|---|---|---|---|---|
| Approve proposed action | ✅ | ❌ | ❌ | ❌ |
| Create proposed action | ✅ | ✅ (own sessions) | ❌ | ❌ |
| Activate player placement | ✅ (via `finalize_player_placement()`) | ❌ | ❌ | ❌ |
| Send parent communication | ✅ (review → approve → future send) | ❌ | ❌ | ❌ |
| Modify curriculum | ✅ (draft → approve) | ❌ | ❌ | ❌ |
| Record session attendance | ✅ | ✅ | ❌ | ❌ |
| View own development profile | ✅ | own profile | ✅ | child only |
| Initiate voice intake | ✅ | ✅ | ❌ | ❌ |

---

## Server Action Auth Requirements

Every server action must:

1. Call `getSupabaseServer()` at the top
2. Call `supabase.auth.getUser()` and verify `user` is not null
3. Return `{ error: 'Not authenticated.' }` (never throw) if unauthenticated
4. Verify role via `profiles` table before executing role-specific mutations
5. Scope all queries to the user's `academy_id`

---

## Pre-Sprint Checklist

Before implementing, answer each question:

1. Does the new server action call `getUser()` before any data operation?
2. Does the new query scope all results to `academy_id`?
3. Does any new coach-facing query accidentally return another coach's session data?
4. Does any new parent-facing query return data for a non-child player?
5. Does the new feature expose review queue or approval power to a coach?
6. Does any new API route return 401 for unauthenticated callers?
7. Does a new role-based view correctly redirect unauthorized roles (middleware or layout)?
8. Does the new action write directly to DB or go through `proposed_actions`?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Allow a coach to see another coach's session notes
- Allow a parent to view a non-child player profile
- Allow a coach to approve items from the director review queue
- Add a server action without `getUser()` authentication
- Add a new query without `academy_id` scoping
- Allow any role to execute `execute_approved_action()` except the director
- Bypass RLS with `getSupabaseAdmin()` in a client-facing route
- Add a new portal route without middleware role enforcement

---

## AcademyOS-Specific Rules

- `getSupabaseAdmin()` (service role) is allowed only in API routes and server-side backend lib. Never in client components or server actions called from the UI.
- The `profiles` table contains `role` and `academy_id` — always join for role verification.
- Coach queries must filter by `coach_id = user.id` or by session membership.
- Parent queries must filter by `player_id IN (SELECT player_id FROM parent_links WHERE parent_id = user.id)`.
- All five role portals have independent `getUser()` calls in their layout — second line of defense after middleware.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Role Permission Guard Report — Sprint XXX

**Surface:** [which portal(s) affected]
**Server action auth:** [all actions authenticated / flag: which are missing getUser]
**Academy_id scoping:** [all queries scoped / flag: which queries are unscoped]
**Cross-role data leakage:** [none / flag: what crosses role boundary]
**Approval power scope:** [director-only / flag: what gives approval to non-director]
**proposed_actions pipeline:** [all mutations use PA / flag: what bypasses]
**RLS bypass:** [none / flag: where getSupabaseAdmin is used client-side]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```

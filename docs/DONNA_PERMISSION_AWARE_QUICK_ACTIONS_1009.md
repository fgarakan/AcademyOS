# DONNA Permission-Aware Quick Actions
Sprint 1009 — 2026-05-18

## Summary

Created `src/lib/donna/donnaQuickActions.ts` — role-scoped quick action definitions for all DONNA surfaces.

## Quick Action Categories

| Category | Meaning |
|---|---|
| `safe_read` | Read-only — surfaces data, no state change |
| `draft_only` | Creates a draft in proposed_actions — requires director review |
| `requires_approval` | Proposes an action — blocked until director approves |
| `blocked_for_role` | Explicitly forbidden for this role; shows explanation |
| `future_capability` | Not yet built |

## Director Actions (7)

summarize_today · show_pending_reviews · academy_risks · inspect_player · review_templates · review_curriculum · donna_intelligence

All are `safe_read` for director — director can see everything.

## Coach Actions (7)

start_session · capture_note · mark_attendance · wrap_up · adjust_session · send_parent_message (blocked) · approve_level (blocked)

Two are explicitly `blocked_for_role` with clear explanations — coaches see why, not just a disabled button.

## Helper Functions

- `getQuickActionsForRole(role, hideBlocked?)` — returns all or only safe actions
- `isQuickActionAllowed(action, role)` — boolean gate for rendering
- `getSafeQuickActions(role)` — only safe_read + draft_only for simplest UI use

## Relation to Existing Infrastructure

- Extends `donnaRoleBoundaries.ts` (Sprint pre-1002) — calls `isTaskAllowedForRole`
- Extends `donnaRolePermissions.ts` (Sprint 363) — same role model
- Extends `donnaProtectedActionRegistry.ts` (Sprint 364) — consistent with blocked action definitions

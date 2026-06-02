# DONNA Conversation Persistence Architecture

**Sprint:** Mega Sprint 1101-1110
**Date:** 2026-06-02
**Status:** V1 — DB tables created in migration 070, server actions wired

## Problem

DONNA conversation history was localStorage-only (client-side, 20-turn cap, 30-day TTL). History was lost on browser close and unavailable on other devices. Migration 070 created `donna_conversation_sessions`, `donna_conversation_messages`, and `donna_working_memory` tables, but no server action wrote to them.

## Solution

`src/app/director/_actions/donnaConversationPersistAction.ts` provides two server actions:

### upsertDonnaConversationSessionAction

- Finds the most recent active DONNA session for this user + academy, or creates a new one
- Updates `active_page` and `active_workflow` context when provided
- Returns `{ ok, sessionId, role }`

### appendDonnaMessageAction

- Appends a message to an existing session
- Re-verifies `session.academy_id` server-side — prevents cross-academy message injection
- Sanitizes `messageText` (trim, max 8000 chars)
- Updates `last_message_at` on the session (best-effort)
- Returns `{ ok, messageId }`

## Auth chain

All actions follow the same 4-step auth chain:
1. `getSupabaseServer()` + `getUser()`
2. `profiles.academy_id` — resolves academy server-side, never from client
3. `academy_memberships` verification — any active role accepted
4. Session ownership re-check — session's `academy_id` must match the authenticated user's academy

## Graceful degradation

Both actions are designed to fail gracefully:
- Never throw — always return `{ ok: false, error }`
- If migration 070 has not been applied, the DB insert fails with a relation-not-found error. The client should fall back to localStorage.
- localStorage behavior in `conversationPersistence.ts` is unchanged — it remains the primary fallback

## Tables (migration 070)

| Table | Scope |
|---|---|
| `donna_conversation_sessions` | One row per conversation session |
| `donna_conversation_messages` | One row per message in a session |
| `donna_working_memory` | Transient key-value memory per session (not used in V1) |

All tables have RLS. Tables not in `database.types.ts` — `rawDb = supabase as any` used for all writes.

## What is NOT done by these actions

- No mutations to `proposed_actions`, audit_logs, or core operational tables
- No external AI calls
- No communications sent
- `academyId` and `role` never accepted from client input

## V1 limitations

- Migration 070 must be applied to the live Supabase DB before DB persistence is active
- `donna_working_memory` not used in V1 server actions (future sprint)
- Cross-device session merging not implemented (each device creates its own session)

## Retention

Sessions older than 90 days should be archived (status → 'archived') by a scheduled job. Not implemented in V1 — manual cleanup via Supabase dashboard if needed.

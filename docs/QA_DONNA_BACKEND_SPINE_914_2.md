# QA — DONNA Backend Spine V1
**Sprint:** 914.2
**Date:** 2026-05-28
**Method:** Static code analysis + migration review

---

## Tables Added (Migration 070)

### `donna_conversation_sessions`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `academy_id` | `uuid` | FK → academies; RLS scope |
| `user_id` | `uuid` | FK → profiles |
| `role` | `user_role` | Existing enum |
| `title` | `text` | Optional session label |
| `active_page` | `text` | Current pathname |
| `active_workflow` | `text` | Active task flow label |
| `current_entity_type` | `text` | e.g. 'player', 'session' |
| `current_entity_id` | `uuid` | Optional entity reference |
| `status` | `text` | CHECK: active/archived/ended |
| `started_at` | `timestamptz` | Default: now() |
| `last_message_at` | `timestamptz` | Nullable; updated on each message |
| `ended_at` | `timestamptz` | Nullable |
| `metadata` | `jsonb` | Default: {} |

### `donna_conversation_messages`

| Field | Type | Notes |
|---|---|---|
| `session_id` | `uuid` | FK → donna_conversation_sessions |
| `role` | `text` | CHECK: user/donna/system/tool |
| `message_text` | `text` | Full message content |
| `message_kind` | `text` | CHECK: text/voice/system/action_result/error |
| `intent` | `text` | Nullable; populated by answer engines |
| `confidence` | `text` | CHECK: high/medium/low/partial/insufficient |
| `source` | `text` | sourceNote from DonnaSafeReadAnswer |
| `page_path` | `text` | Page at time of message |
| `entity_type` | `text` | Optional entity context |
| `entity_id` | `uuid` | Optional entity context |
| `proposed_action_id` | `uuid` | Optional cross-reference |

### `donna_working_memory`

| Field | Type | Notes |
|---|---|---|
| `session_id` | `uuid` | FK → donna_conversation_sessions |
| `memory_key` | `text` | UNIQUE per session |
| `memory_value` | `jsonb` | Arbitrary structured value |
| `scope` | `text` | CHECK: session/workflow/page/entity |
| `expires_at` | `timestamptz` | Nullable; expired entries prunable |
| UNIQUE | (session_id, memory_key) | Upsert semantics |

---

## RLS Assumptions

All three tables use the established project RLS helpers:
- `auth_academy_id()` — resolves academy from authenticated user profile
- `auth_is_director_or_head()` — directors + head coaches
- `auth_is_staff()` — all staff roles

**Session policies:**
- Staff INSERT own sessions (academy-scoped)
- Directors SELECT all sessions in their academy
- Staff SELECT own sessions
- Staff UPDATE own sessions

**Message policies:**
- Staff INSERT messages (academy-scoped)
- Directors SELECT all messages
- Staff SELECT own messages (via user_id match)

**Working memory policies:**
- Staff INSERT/UPDATE own working memory
- Directors SELECT all working memory
- Staff SELECT own working memory

**Assumption:** The `auth_academy_id()`, `auth_is_director_or_head()`, and `auth_is_staff()` functions from migration 003 are already in the database before migration 070 runs. This is guaranteed by sequential migration numbering.

---

## Helper Functions (`donnaConversationPersistence.ts`)

| Function | Description | Safe? |
|---|---|---|
| `createDonnaConversationSession(db, input)` | Creates new session; resolves academy_id server-side | ✅ |
| `getOrCreateDonnaConversationSession(db, input)` | Returns most recent active session or creates one | ✅ |
| `appendDonnaConversationMessage(db, input)` | Appends message; resolves academy_id from session FK | ✅ |
| `getRecentDonnaConversationMessages(db, sessionId, limit)` | Returns N most recent messages, oldest first | ✅ |
| `upsertDonnaWorkingMemory(db, userId, input)` | Upserts memory entry; resolves academy_id from session | ✅ |
| `getDonnaWorkingMemory(db, sessionId)` | Returns all non-expired entries as flat Record | ✅ |

All functions:
- Return `DonnaPersistenceResult<T>` — never throw to callers
- Resolve academy_id server-side (never trust caller)
- Use `(db as any)` for the new tables (not yet in generated types)
- Log errors as `{ ok: false, error: string, code: string }`

---

## Context Packet Builder (`donnaContextPacketBuilder.ts`)

`buildDonnaContextPacket(db, input)` assembles:
- `userMessage` — the current user input
- `recentConversation` — last 20 messages from DB (if sessionId provided)
- `workingMemory` — all non-expired working memory entries (if sessionId provided)
- `directorContext` — passed through from caller (Sprint 914.3 will wire this)
- `allowedActions` — empty in V1 (action registry wiring in future sprint)
- `pendingApprovals` — empty in V1 (proposed_actions wiring in future sprint)

Degrades gracefully: if session data unavailable, returns empty conversation/memory.

---

## What is Intentionally NOT Wired Yet

| Item | Sprint |
|---|---|
| `DonnaVoiceReadyShell.tsx` still uses `donnaChatSessionMemory.ts` (in-process) | 914.3 |
| `buildDonnaContextPacket` not called from any component | 914.3 |
| `directorContext` not injected into context packet | 914.3 |
| Full `allowedActions` from `directorActionRegistry.ts` | 914.4+ |
| `pendingApprovals` from `proposed_actions` | 914.4+ |
| `donnaChatSessionMemory.ts` NOT removed or replaced | Preserved |

---

## Safety Checks

| Check | Result |
|---|---|
| No curriculum execution changes | ✅ |
| No DONNA UI behavior changed | ✅ — in-process session memory untouched |
| No unsafe mutations | ✅ — persistence helpers are opt-in only |
| No `execute_curriculum_override()` calls | ✅ |
| No `proposed_actions` misuse | ✅ |
| Sprint 904 approve/reject unchanged | ✅ |
| RLS on all 3 new tables | ✅ |
| `buildDonnaContextPacket` is read-only | ✅ — no DB writes |
| `(db as any)` pattern for new tables | ✅ — established project pattern |
| No fake success states | ✅ — all errors returned as `{ ok: false }` |
| No cross-academy data leakage | ✅ — academy_id resolved server-side from profile |

---

## Manual SQL Verification

Run after migration 070 is applied:

```sql
-- 1. Confirm tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('donna_conversation_sessions', 'donna_conversation_messages', 'donna_working_memory');
-- Expected: 3 rows

-- 2. Insert a test session
INSERT INTO donna_conversation_sessions (academy_id, user_id, role, title, active_page)
VALUES ('<academy_id>', '<user_id>', 'academy_director', 'Test session', '/director/donna')
RETURNING id, started_at;

-- 3. Insert test messages
INSERT INTO donna_conversation_messages (session_id, academy_id, user_id, role, message_text, intent)
VALUES
  ('<session_id>', '<academy_id>', '<user_id>', 'user', 'Give me my director brief.', 'director_brief'),
  ('<session_id>', '<academy_id>', null, 'donna', 'Here is your academy status...', null);

-- 4. Upsert working memory
INSERT INTO donna_working_memory (session_id, academy_id, user_id, memory_key, memory_value)
VALUES ('<session_id>', '<academy_id>', '<user_id>', 'last_curriculum_draft', '{"levelName":"Orange 2","focusArea":"forehand"}')
ON CONFLICT (session_id, memory_key) DO UPDATE SET memory_value = EXCLUDED.memory_value, updated_at = NOW();

-- 5. Select recent messages
SELECT role, message_text, intent, created_at
FROM donna_conversation_messages
WHERE session_id = '<session_id>'
ORDER BY created_at ASC;
-- Expected: 2 rows in chronological order

-- 6. Select working memory
SELECT memory_key, memory_value FROM donna_working_memory
WHERE session_id = '<session_id>'
AND (expires_at IS NULL OR expires_at > NOW());
-- Expected: 1 row with last_curriculum_draft key

-- 7. Verify RLS: cross-academy access blocked
-- (requires two authenticated users from different academies in test environment)
```

---

## Rollback Notes

Migration 070 is additive — no existing tables are modified.

**Rollback SQL:**
```sql
DROP TABLE IF EXISTS donna_working_memory;
DROP TABLE IF EXISTS donna_conversation_messages;
DROP TABLE IF EXISTS donna_conversation_sessions;
```

The existing `donnaChatSessionMemory.ts` in-process singleton continues working after rollback — the new persistence layer is completely independent.

**TypeScript rollback:** Delete `donnaConversationPersistence.ts` and `donnaContextPacketBuilder.ts`. No other files import them in Sprint 914.2.

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 914.2 changes.

---

## Sprint 914.3 Recommendation

Wire the new persistence layer into `DonnaVoiceReadyShell.tsx`:
1. On DONNA hub page load → call `getOrCreateDonnaConversationSession()`
2. After each user message → call `appendDonnaConversationMessage()` for user turn
3. After each DONNA response → call `appendDonnaConversationMessage()` for donna turn
4. When "same for Orange 3" fires → `upsertDonnaWorkingMemory()` to store `last_curriculum_draft`
5. Build `buildDonnaContextPacket()` at the start of each `handleSend()` call
6. Wire `directorCtx` into the context packet via `directorContext` field
7. Test: "What did we discuss last time?" → DONNA retrieves persisted messages

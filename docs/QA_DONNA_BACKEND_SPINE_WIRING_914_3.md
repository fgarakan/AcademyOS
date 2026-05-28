# QA — DONNA Backend Spine Wiring V1
**Sprint:** 914.3
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Client/Server Boundary Decision

`DonnaVoiceReadyShell.tsx` is `'use client'`. It cannot directly call server-side persistence helpers.

**Solution:** New `src/lib/actions/donnaConversationActions.ts` (`'use server'`) as the bridge. This follows the established project pattern from `donnaSentinelAction.ts` and `curriculumDraftActions.ts`.

---

## Server Actions Added

**File:** `src/lib/actions/donnaConversationActions.ts`

| Function | Description | Returns |
|---|---|---|
| `getOrCreateDonnaSession(input)` | Get/create active session; resolves userId + role from auth | `{ ok, data: { sessionId } }` |
| `appendDonnaMessage(input)` | Appends one message to session | `{ ok, data: { messageId } }` |
| `upsertDonnaMemory(input)` | Upserts working memory key | `{ ok, data: { ok } }` |
| `recallRecentDonnaMessages(input)` | Returns last N messages as safe summaries | `{ ok, data: RecalledMessage[] }` |

All functions: `'use server'`, resolve auth from `getSupabaseServer()`, return `{ ok, data/error }`, never throw.

---

## What is Persisted

| Event | What is persisted | How |
|---|---|---|
| Shell mount (director) | Session created or reused | `getOrCreateDonnaSession()` → `sessionIdRef.current` |
| User sends message | User message text + page path | `appendDonnaMessage({role:'user'})` fire-and-forget |
| DONNA responds | DONNA response text + source + confidence | `useEffect([messages])` → `appendDonnaMessage({role:'donna'})` fire-and-forget |
| Curriculum draft shown for confirmation | Safe POJO `{ levelName, focusArea, contentLabel, contentType }` | `upsertDonnaMemory({ memoryKey: 'last_curriculum_draft' })` fire-and-forget |

---

## What is NOT Persisted

| Item | Reason |
|---|---|
| `pendingAction.execute` closure | Not serializable — JavaScript function |
| `pendingAction.actionType/description` | Not persisted in V1 (Sprint 914.4) |
| `pendingDrillSlotFill` | Not persisted in V1 (Sprint 914.4) |
| `convRef.current` | React ref — not serializable |
| TTS state / voice state | UI state only |
| `directorCtx` | Not yet injected into context packet (Sprint 914.4) |

---

## Recall Command

**Pattern:** `RECALL_PATTERN = /\b(what did we (discuss|talk about|say)|recap (our|this|the) donna? (conversation|chat|session)|...)\b/i`

**Fires at:** step 5.5 in `handleSend()`, before pending confirmation intercept

**Behavior with sessionId:**
1. Calls `recallRecentDonnaMessages({ sessionId, limit: 10 })`
2. Filters to user turns only, takes last 3
3. Formats as: "Recent conversation topics: 1. '...' 2. '...' 3. '...'"

**Behavior without sessionId (no session created yet):**
- Returns early from recall check (falls through to pipeline)

**Behavior when 0 messages found:**
- "I don't have a saved conversation history for this session yet..."

**Behavior on server error:**
- "I wasn't able to retrieve the conversation history right now. You can continue from here."

---

## Failure Behavior

All persistence calls are `.catch(() => {})` fire-and-forget. On any failure:
- `sessionIdRef.current` remains null OR the last successfully created session ID
- DONNA continues using in-process `donnaChatSessionMemory.ts` singleton
- No error shown to director
- No fake success
- No interruption to conversation flow

Only the recall command is async-blocking (waits for server response), but it has an explicit catch that shows a graceful "I wasn't able to retrieve" message.

---

## Manual QA Scenarios

### Scenario 1 — Session created on mount ✅ PASS (static)

`useEffect([donnaRole])` fires on mount:
- `getOrCreateDonnaSession({ activePage: pathname })` called
- On success: `sessionIdRef.current = result.data.sessionId`
- On failure: `sessionIdRef.current` stays null; DONNA continues normally

---

### Scenario 2 — User message persisted ✅ PASS (static)

In `handleSend()`, before any interceptor:
```typescript
if (sId) {
  persistDonnaMessage({ sessionId: sId, role: 'user', messageText: trimmed, ... }).catch(() => {})
}
```
Fire-and-forget. Even if `sId` is null (session not created yet), no error. ✅

---

### Scenario 3 — DONNA response persisted ✅ PASS (static)

`useEffect([messages])` fires when `messages` changes:
- Takes last message
- Checks `role === 'donna'` and `id !== lastPersistedDonnaIdRef.current`
- Persists once per donna message
- `lastPersistedDonnaIdRef.current = lastMsg.id` prevents double-write

---

### Scenario 4 — Curriculum draft working memory persisted ✅ PASS (static)

In `triggerCurriculumContentConfirmation()`:
```typescript
if (sId) {
  upsertDonnaMemory({
    sessionId: sId,
    memoryKey: 'last_curriculum_draft',
    memoryValue: { levelName, focusArea, contentLabel, contentType, storedAt: Date.now() },
    scope: 'workflow',
  }).catch(() => {})
}
```
`execute` function NOT serialized — only safe POJO persisted. ✅

---

### Scenario 5 — Recall command ✅ PASS (static)

"What did we discuss last time?" → `RECALL_PATTERN.test(trimmed)` → true → `recallRecentDonnaMessages()` called → formats last 3 user turns as topic list.

---

### Scenario 6 — Persistence failure does not break DONNA ✅ PASS (static)

If `getOrCreateDonnaSession()` fails: `sessionIdRef.current = null` → all subsequent persistence checks (`if (sId)`) skip silently → in-process `donnaChatSessionMemory.ts` continues. ✅

---

### Scenario 7 — No official curriculum mutation ✅ PASS

`upsertDonnaMemory` writes to `donna_working_memory` only. No `proposed_actions` mutation, no `curriculum_overrides` mutation, no `execute_curriculum_override()`. ✅

---

### Scenario 8 — No raw DB error shown ✅ PASS

All server actions catch errors and return `{ ok: false, error: string }`. The shell's `.catch(() => {})` suppresses all errors silently. ✅

---

### Scenario 9 — In-process pendingAction still works ✅ PASS

`donnaChatSessionMemory.ts` is unchanged. `conv.pendingConfirmation` is unchanged. `storeAndSetPendingConfirmation()` is unchanged. The persistence layer is purely additive. ✅

---

### Scenario 10 — Route change preserves sessionIdRef ✅ PASS

`sessionIdRef` is a React ref — persists across re-renders and client-side route changes within the same component mount. Only resets on full component unmount (which triggers a new `useEffect([donnaRole])` → new session or existing session retrieved). ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No curriculum execution changes | ✅ |
| No unsafe mutations (only donna_working_memory writes) | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ |
| Sprint 904 approve/reject unchanged | ✅ |
| In-process `donnaChatSessionMemory.ts` preserved | ✅ |
| No executable function serialized to DB | ✅ — only safe POJO values |
| All persistence is fire-and-forget | ✅ |
| Recall failure shows graceful fallback | ✅ |
| academy_id resolved server-side in all actions | ✅ |

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 914.3 changes.

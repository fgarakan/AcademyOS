# QA — DONNA Context Packet Integration V1
**Sprint:** 914.4
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Server Action Added

**`buildDonnaContextPacketForSession(input)`** in `donnaConversationActions.ts`:
- Resolves `userId`, `academyId`, `role` from auth server-side
- Calls `buildDonnaContextPacket()` with all resolved fields
- Returns a **safe `ContextPacketSummary`** — not the full packet

### `ContextPacketSummary` (returned to client)

| Field | Type | Notes |
|---|---|---|
| `sessionId` | `string \| null` | Active session ID |
| `activePage` | `string \| null` | Current page path |
| `activeWorkflow` | `string \| null` | Active workflow label |
| `recentConversationCount` | `number` | Count of persisted messages loaded |
| `workingMemoryKeys` | `string[]` | Keys only — no values |
| `hasDirectorContext` | `boolean` | Whether directorCtx was injected |
| `userId` | `string` | Authenticated user ID |
| `role` | `string` | User role |
| `assembledAt` | `string` | ISO timestamp |

**Raw values NOT returned to client:**
- `recentConversation` array (message content)
- `workingMemory` values (JSONB content)
- `directorContext` (full DirectorDonnaContext object)

---

## Context Packet Wiring in Shell

### Where packet is built

In `handleSend()`, after recall/debug interceptors, before pending confirmation:
```typescript
if (sIdPkt && role === 'director') {
  buildDonnaContextPacketForSession({ sessionId, userMessage, activePage, directorContext })
    .then(result => { if (result.ok) lastContextPacketRef.current = result.data })
    .catch(() => {})
}
```

Fire-and-forget. Packet summary stored in `lastContextPacketRef.current` for the NEXT message or debug command.

### What is populated in the packet

| Field | Source | V1 status |
|---|---|---|
| `userMessage` | Current trimmed input | ✅ |
| `academyId` | Server-side from auth | ✅ |
| `userId` | Server-side from auth | ✅ |
| `role` | Server-side from membership | ✅ |
| `sessionId` | `sessionIdRef.current` | ✅ |
| `activePage` | `pathname` from `usePathname()` | ✅ |
| `recentConversation` | DB: `donna_conversation_messages` | ✅ |
| `workingMemory` | DB: `donna_working_memory` | ✅ |
| `directorContext` | `directorCtx` prop | ✅ |

### What is NOT yet in the packet

| Field | Sprint |
|---|---|
| `allowedActions` | 914.5+ |
| `pendingApprovals` from `proposed_actions` | 914.5+ |
| `activeWorkflow` | Set when workflow tracking added |
| `currentEntity` | Set when entity tracking added |

---

## Pending State Summaries Persisted

### `pending_action_summary` (in `donna_working_memory`)

| Event | Value persisted |
|---|---|
| `storeAndSetPendingConfirmation()` called | `{ actionType, description, storedAt }` |
| Confirmation confirmed | `{ status: 'confirmed', clearedAt }` |
| Confirmation cancelled | `{ status: 'cancelled', clearedAt }` |

**NOT serialized:** `execute()` closure. Only the action's label and type.

### `pending_slot_fill` (in `donna_working_memory`)

Via `setPendingSlotFillWithPersist()` wrapper (replaces all 8 `setPendingDrillSlotFill` calls):

| Field persisted | Source |
|---|---|
| `kind` | `'curriculum_drill_draft' \| 'curriculum_gate_draft' \| 'curriculum_skill_draft'` |
| `levelName` | `string \| null` |
| `focusArea` | `string \| null` |
| `missingSlot` | `'levelName' \| 'focusArea'` |
| `rawInput` | Director's original message |
| `storedAt` | `Date.now()` |

---

## Context Debug Command

**Pattern:** `CONTEXT_DEBUG_PATTERN = /\b(what context do you have|what do you know about this conversation|what are you using for context|...)\b/i`

**With `lastContextPacketRef.current` set:**
```
Here is my current context for this conversation:
• Page: /director/donna
• Recent saved turns: 5
• Working memory keys: last_curriculum_draft, pending_action_summary
• Director operating context: loaded
• Session: active

I am not yet using this context packet to route answers — that comes in the next sprint. But it is being assembled for every director message.
```

**Without packet (first message):**
```
Current session: active. Page: /director/donna. Director context: loaded. 
I'm assembling a context packet for each message — it will be available from the next turn.
```

---

## What Is Still Not Using the Packet

| Component | Status |
|---|---|
| 34-interceptor routing pipeline | Still uses in-process `donnaChatSessionMemory.ts` only |
| KPI / dashboard priority answers | Still use `directorCtx` directly |
| Curriculum draft creation | Unchanged |
| `buildDashboardPriorityResponse` | Unchanged |
| `donnaAttentionRankingEngine` | Unchanged |

The context packet is assembled but not yet used for routing. Sprint 914.5 will begin using it.

---

## Manual QA Scenarios

### Scenario 1 — Packet built after first message ✅ PASS (static)

In `handleSend()`: `buildDonnaContextPacketForSession()` fires after recall/debug and before confirmation intercept. Fire-and-forget. `lastContextPacketRef.current` updated on success. ✅

### Scenario 2 — Director brief builds context ✅ PASS (static)

"Give me my director brief" → `detectBriefQuestion` → `buildDirectorBriefSummary(ctx)` — unaffected by packet (routing unchanged). Meanwhile packet is built fire-and-forget with `directorCtx` injected. ✅

### Scenario 3 — pending_action_summary persisted safely ✅ PASS (static)

`storeAndSetPendingConfirmation({ actionType:'curriculum_drill_draft', description:'Add a forehand prep drill...', execute: [fn] })`:
- `execute` function: NOT serialized
- `{ actionType, description, storedAt }`: ✅ persisted to `donna_working_memory`

### Scenario 4 — pending_slot_fill persisted safely ✅ PASS (static)

`setPendingSlotFillWithPersist({ kind: 'curriculum_drill_draft', levelName: 'Orange 2', focusArea: null, missingSlot: 'focusArea', rawInput: 'Add a drill for Orange 2' })`:
- All fields are safe plain JSON ✅
- No closures, no functions ✅

### Scenario 5 — Context debug command ✅ PASS (static)

"What context do you have?" → `CONTEXT_DEBUG_PATTERN` matches → `lastContextPacketRef.current` read → summary shown. Never exposes raw values or IDs. ✅

### Scenario 6 — Persistence failure does not break routing ✅ PASS (static)

`buildDonnaContextPacketForSession()` failure → `.catch(() => {})` → `lastContextPacketRef.current` stays null/stale → DONNA continues with existing pipeline. ✅

### Scenario 7 — No official curriculum mutation ✅ PASS

`buildDonnaContextPacketForSession` is read-only: calls `buildDonnaContextPacket()` which calls `getRecentDonnaConversationMessages()` + `getDonnaWorkingMemory()` — both read-only. ✅

### Scenario 8 — No raw JSON dump ✅ PASS

Context debug command shows counts and keys only: `recentConversationCount`, `workingMemoryKeys`. No raw message content, no JSONB values, no IDs. ✅

### Scenario 9 — Context packet failure graceful ✅ PASS

See Scenario 6. Also: `buildDonnaContextPacketForSession` returns `{ ok: false, error }` on any error — never throws. ✅

### Scenario 10 — No executable function in DB ✅ PASS

- `pending_action_summary`: `{ actionType, description, storedAt }` — no `execute` ✅
- `pending_slot_fill`: `{ kind, levelName, focusArea, missingSlot, rawInput, storedAt }` — no functions ✅
- `last_curriculum_draft`: `{ levelName, focusArea, contentLabel, contentType, storedAt }` — no functions ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations added | ✅ |
| No curriculum execution changes | ✅ |
| No unsafe mutations | ✅ |
| `buildDonnaContextPacketForSession` is read-only | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ |
| Sprint 904 untouched | ✅ |
| `donnaChatSessionMemory.ts` untouched | ✅ |
| No executable function in DB | ✅ |
| All persistence fire-and-forget | ✅ |
| TypeScript: 0 errors | ✅ |

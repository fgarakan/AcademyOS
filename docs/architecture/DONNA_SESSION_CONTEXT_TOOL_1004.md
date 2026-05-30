# DONNA Session Context Tool V1 — Sprint 1004

**Date:** 2026-05-30
**Sprint:** 1004
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1004

Sprint 1003 gave DONNA safe player-specific context (level, status, priorities, evidence, advancement). DONNA could answer "How is this player doing?" but could not answer "What is this session about?" or "Has the coach submitted the wrap-up?" because:
- No `sessionId` was in the context packet
- No session-specific retrieval module existed for DONNA
- The LLM cannot safely guess or invent a session ID

Sprint 1004 completes the first major live-context triangle: **academy → player → session**.

---

## New Tool: `get_session_context`

| Property | Value |
|---|---|
| Tool ID | `get_session_context` |
| Safety level | `safe` |
| Requires approval | No |
| Required params | `sessionId` (from route context, never from LLM) |
| DB access | RLS enforced, academyId scoped |
| Returns | Director/coach-safe summary: labels, counts, status |

---

## `sessionId` Source Rule — Critical

```
ALLOWED: Server action passes sessionId from URL params
  → orchestrate({ ..., sessionId: params.sessionId })
  → safeSignals.sessionId = input.sessionId
  → runLiveToolExecutionLoop injects sessionId into tool params

BLOCKED: LLM tries to provide sessionId in toolRequest.params
  → LLM cannot know the UUID — it is not in the system prompt
  → System prompt says "sessionId injected from route context — you cannot supply it directly"
  → If LLM provides a wrong sessionId, DB query returns no data (RLS + academyId scope)
```

---

## Files Changed

| File | Change |
|---|---|
| `sessionContextRetrieval.ts` | Created — safe director/coach-facing session context query |
| `types.ts` | Added `get_session_context` to `OrchestratorToolId` (12 total tools) |
| `safetyContract.ts` | Registered new tool (safe, requiredParams: ['sessionId']) |
| `contextPacket.ts` | Added `sessionId` to input, `SafeSignals` (`sessionId`, `hasSessionContext`), tool manifest, system prompt |
| `toolCallingContract.ts` | Added stub |
| `toolResultInterpreter.ts` | Added `interpretSessionContext` |
| `liveContextToolExecutor.ts` | Added `get_session_context` to `LIVE_TOOL_IDS`, `execGetSessionContext`, updated `executeLiveTool` |
| `toolExecutionLoop.ts` | Injects `sessionId` from `ctx.safeSignals` alongside `academyId` and `playerId` |

---

## Safe Returned Fields

| Field | Type | Description |
|---|---|---|
| `sessionName` | `string \| null` | Session name label |
| `sessionStatus` | `string \| null` | planned / in_progress / completed / cancelled |
| `scheduledDate` | `string \| null` | YYYY-MM-DD |
| `scheduledTime` | `string \| null` | HH:MM only |
| `durationMin` | `number \| null` | Duration in minutes |
| `templateName` | `string \| null` | Template label — not raw ID |
| `coachName` | `string \| null` | Coach display name — not raw ID |
| `groupName` | `string \| null` | Group label — not raw ID |
| `blockCount` | `number` | Count of planned blocks |
| `attendance.total / present / absent` | `number` | Counts only — no player names |
| `attendance.recorded` | `boolean` | Whether attendance has been taken |
| `wrapUpStatus` | `'not_started' \| 'draft_submitted' \| 'approved' \| 'rejected'` | Wrap-up pipeline status |
| `needsDirectorReview` | `boolean` | Whether a wrap-up draft is pending review |

---

## Blocked Fields (Never Returned)

- `session_notes` raw text
- Individual player attendance names
- Coach observation text or voice notes
- Raw wrap-up draft content
- `proposed_actions` payload text
- Sensitive or private player notes
- Raw database UUIDs in user-facing summary
- Parent communication drafts
- Medical or health-sensitive content

---

## Director vs Coach Visibility

Both director and coach routes (`/director/sessions/[id]` and `/coach/sessions/[id]`) can supply `sessionId`. The retrieval returns the same safe summary — no role-gating needed because the data is safe for both roles. The session's `academyId` is always enforced by RLS.

---

## Interpreter Behavior

- On success: shows full session summary text, highlights `session-blocks` focus target
- If `needsDirectorReview: true`: adds review queue navigation suggestion to `/director/review`
- On failure: safe fallback text, highlights `session-blocks` focus target

---

## No-Migration Guarantee

- No new tables
- No schema changes
- No RLS changes
- Uses existing: `sessions`, `templates`, `profiles`, `groups`, `session_blocks`, `session_attendance`, `proposed_actions`
- Some queries may return empty if data doesn't exist — handled gracefully

---

## Live Context Triangle Complete

After Sprint 1004, DONNA has safe live context at three levels:
- **Academy:** pending items, sessions today, player counts, health signal
- **Player:** curriculum level, status, advancement, priorities, evidence, assessment
- **Session:** name, status, template, coach, blocks, attendance, wrap-up

---

## V2 Roadmap (Sprint 1005+)

1. Add `get_session_attendance_detail` — safe per-player attendance breakdown (names with explicit director intent)
2. Add `get_curriculum_coverage` — use Sprint 992 `curriculumContextRetrieval.ts`
3. Add usage tracking — `logUsageEvent()` after each live tool call
4. Add session context to chip registry suggestions on session pages

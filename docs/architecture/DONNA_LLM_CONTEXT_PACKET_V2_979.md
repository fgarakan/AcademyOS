# DONNA LLM Context Packet V2 — Sprint 979

**Date:** 2026-05-30
**Sprint:** 979
**Status:** Implemented — TypeScript clean

---

## V1 → V2 Delta

| Feature | V1 (Sprint 978) | V2 (Sprint 979) |
|---|---|---|
| Role context | Plain text | Structured with role-specific framing |
| Page info | Pathname + label | Full `PageContextSummary` with chips + highlight targets |
| Academy state | Pending count only | `AcademyStateSummary` with health signal, missing recaps, placement, advancement |
| Tools | Mentioned in prompt text | Explicit `ToolManifest` with descriptions, safety levels, required params |
| Safety rules | Single line | 6 numbered non-negotiable rules in system prompt |
| Conversation history | Not included | `ConversationHistory` — last 6 turns, each capped at 200 chars |
| Token budget | Not tracked | `'compact' | 'standard' | 'extended'` estimate |
| Compact summary | 4 fields | 6 fields including history and budget |
| System prompt | ~7 lines | Structured sections: Identity, Current State, Next Action, Page Context, Tools, Safety Rules, Output Format, History |

---

## New Types Added (`types.ts`)

- `ConversationTurn` — role ('user'|'donna'), content, timestamp, outputType
- `ConversationHistory` — `ConversationTurn[]` (capped at 10)
- `PageContextSummary` — pageLabel, pathname, highlightTargets[], promptChips[], hasApprovalGates, isDirectorOnly
- `AcademyStateSummary` — pendingReviewCount, todaySessionCount, hasMissingRecaps, activePlayers, hasPlayersNeedingPlacement, hasAdvancementEligiblePlayers, academyHealthSignal

---

## New Helpers (`contextPacket.ts`)

- `appendUserTurn(history, content)` — adds user turn, caps at 10, immutable
- `appendDonnaTurn(history, content, outputType)` — adds DONNA turn, caps at 10, immutable
- `buildAcademyStateSummary(params)` — builds health signal from available panel state signals (no DB call)
- `buildToolManifest(role)` — returns full tool manifest for the given role

---

## Safety Guarantees

- Conversation history content capped at 200 chars/turn — prevents raw data bleeding through
- User input capped at 500 chars
- Academy state summary uses counts and flags only — no player names, coach notes, or private data
- Page context uses chip/target IDs only — no player-specific data
- Safety rules section always included, cannot be omitted

---

## V2 Retrieval Gaps (Future Sprints)

| Signal | Current V2 Status | Fix Sprint |
|---|---|---|
| `todaySessionCount` | Caller must supply — not auto-fetched | Sprint 990 |
| `activePlayers` | Caller must supply — not auto-fetched | Sprint 990 |
| `hasMissingRecaps` | Caller must supply — not auto-fetched | Sprint 990 |
| Player curriculum state | Not included | Sprint 992 |
| Coach wrap-up history | Not included | Sprint 993 |
| Knowledge Builder content | Not included | Sprint 988 |

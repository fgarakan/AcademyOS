# DONNA Curriculum Question Answering — Sprint 1015

**Date:** 2026-05-31
**Sprint:** 1015
**Status:** Complete

---

## What was built

Sprint 1015 wires the existing `curriculumContextRetrieval.ts` (Sprint 992) as the 13th live tool in the DONNA orchestrator, complete with a COO-quality answer builder.

---

## New tool: `get_curriculum_context`

When a director asks curriculum-related questions ("are there curriculum changes pending?", "how many levels do we have?", "what's the curriculum status?"), the LLM can now call this tool to get live data.

**Tool ID:** `get_curriculum_context`
**Safety level:** safe (read-only)
**Required params:** `academyId` (injected from server auth — LLM cannot supply it)
**Live executor:** `execGetCurriculumContext(academyId)` → `retrieveCurriculumContext()` (Sprint 992)

Returns `CurriculumContextSummary`:
- `totalLevels` — total defined curriculum levels
- `levelsWithContent` — (V2 field, currently 0)
- `levelsWithoutContent` — (V2 field, currently 0)
- `pendingCurriculumDrafts` — pending `curriculum_override` proposed actions
- `hasCurriculumDraft` — boolean flag

---

## New module: `curriculumAnswering.ts`

`buildCurriculumContextAnswer(summary: CurriculumContextSummary): CurriculumIntelligenceAnswer`

Priority order:
1. Pending curriculum drafts → "N drafts waiting for your review — proposed changes only, nothing applied until approved" + route to Review Queue
2. Total level count → baseline structural context
3. Levels without content → gap signal (V2)

Safety:
- Pending curriculum drafts explicitly framed as "proposed changes only — nothing is applied until you approve"
- No raw curriculum content (no learning objectives, no drill descriptions)
- Always ends with read-only safety note

---

## Files touched

| File | Change |
|---|---|
| `types.ts` | Added `'get_curriculum_context'` to `OrchestratorToolId` |
| `safetyContract.ts` | Registered in `SAFE_TOOL_REGISTRY` |
| `toolCallingContract.ts` | Stub executor added to `EXECUTORS` |
| `liveContextToolExecutor.ts` | Added to `LIVE_TOOL_IDS`, implemented `execGetCurriculumContext`, added switch case |
| `contextPacket.ts` | Added to `TOOL_MANIFEST_ALL` (tool count: 8→13) |
| `toolResultInterpreter.ts` | Added `interpretCurriculumContext`, registered in `INTERPRETERS` |
| `evaluationHarness.ts` | Updated counts (12→13), added `live_012`/`live_013`, updated `context_008` |
| `curriculumAnswering.ts` | New file |

---

## Tool count history

| Sprint | Tools | New tool |
|---|---|---|
| 978 | 8 | Original set |
| 1002 | 10 | `get_academy_state`, `get_player_development_summary` |
| 1003 | 11 | `get_player_profile_summary` |
| 1004 | 12 | `get_session_context` |
| 1015 | 13 | `get_curriculum_context` |

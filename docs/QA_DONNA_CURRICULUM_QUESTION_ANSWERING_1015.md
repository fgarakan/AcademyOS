# QA Checklist — DONNA Curriculum Question Answering (Sprint 1015)

**Date:** 2026-05-31
**Sprint:** 1015

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `curriculumAnswering.ts` imports compile: `CurriculumContextSummary` from `./curriculumContextRetrieval`
- [ ] `types.ts`: `'get_curriculum_context'` in `OrchestratorToolId` union
- [ ] `safetyContract.ts`: `SAFE_TOOL_REGISTRY` has `get_curriculum_context` entry, `Record<OrchestratorToolId, ...>` satisfies
- [ ] `toolCallingContract.ts`: `EXECUTORS` has `get_curriculum_context` entry, `Record<OrchestratorToolId, ...>` satisfies
- [ ] `liveContextToolExecutor.ts`: `LIVE_TOOL_IDS` set includes `'get_curriculum_context'`
- [ ] `contextPacket.ts`: `TOOL_MANIFEST_ALL` has 13 entries
- [ ] `toolResultInterpreter.ts`: `INTERPRETERS` has `get_curriculum_context` entry, `Record<OrchestratorToolId, ...>` satisfies
- [ ] No new `as any` introduced in sprint files

---

## `buildCurriculumContextAnswer` unit checklist

- [ ] `hasCurriculumDraft: true, pendingCurriculumDrafts: 1` → "1 curriculum change draft is waiting"
- [ ] `hasCurriculumDraft: true, pendingCurriculumDrafts: 3` → "3 curriculum change drafts are waiting"
- [ ] Draft pending → includes "proposed changes only — nothing is applied until you approve"
- [ ] Draft pending → `suggestedRoute === '/director/review'`
- [ ] Draft pending → `highlightTargetId === 'review-queue-primary'`
- [ ] Draft pending → `primaryActionLabel` contains "Review N curriculum draft"
- [ ] `hasCurriculumDraft: false` → "No curriculum change drafts are pending"
- [ ] `totalLevels: 5` → "5 levels defined"
- [ ] `totalLevels: 0` → "No curriculum levels have been defined yet"
- [ ] `levelsWithoutContent: 2` → includes "2 levels have no content assigned"
- [ ] `donnaText` always ends with read-only safety note
- [ ] Never throws for any combination of values

---

## Tool registration checklist

- [ ] `isLiveTool('get_curriculum_context')` → true (live_012 eval case)
- [ ] `isSafeToExecuteDirectly('get_curriculum_context')` → false (live_013 eval case)
- [ ] `executeToolCall('get_curriculum_context', {})` returns `ok:false` with "live context" message
- [ ] `getRegisteredTools().length === 13` (tool_005 eval case)
- [ ] `buildContextPacket(...).toolManifest.length === 13` (context_002 eval case)

---

## Safety checklist

- [ ] No raw curriculum content (learning objectives, drill text) in answer
- [ ] Pending curriculum drafts framed as "proposed changes only — approval required"
- [ ] `requiresConfirmation: false` on curriculum context result (read-only query)
- [ ] Route suggestion only — no auto-navigation
- [ ] `academyId` never accepted from LLM (always from server auth)

---

## Sprint 992 regression checklist

- [ ] `curriculumContextRetrieval.ts` NOT changed
- [ ] `retrieveCurriculumContext()` interface unchanged
- [ ] `CurriculumContextSummary` type unchanged

---

## Sprint 1013/1014 regression checklist

- [ ] `academyIntelligenceAnswering.ts` NOT changed
- [ ] `playerDevelopmentAnswering.ts` NOT changed
- [ ] `interpretAcademyState` unchanged
- [ ] `interpretPlayerDevelopmentSummary` unchanged
- [ ] `interpretPlayerProfileSummary` unchanged
- [ ] `interpretSessionContext` unchanged

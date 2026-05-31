# QA Checklist — DONNA Knowledge Builder Live Retrieval (Sprint 1017)

**Date:** 2026-05-31
**Sprint:** 1017

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `get_knowledge_content` in `OrchestratorToolId` union
- [ ] `safetyContract.ts` `SAFE_TOOL_REGISTRY` `Record<OrchestratorToolId, ...>` satisfies
- [ ] `toolCallingContract.ts` `EXECUTORS` `Record<OrchestratorToolId, ...>` satisfies
- [ ] `toolResultInterpreter.ts` `INTERPRETERS` `Record<OrchestratorToolId, ...>` satisfies
- [ ] `liveContextToolExecutor.ts` dynamic import of `knowledgeBuilderBridge` resolves
- [ ] `KnowledgeContentType` cast in executor compiles

---

## Tool registration checklist

- [ ] `isLiveTool('get_knowledge_content')` → true (live_014 eval case)
- [ ] `isSafeToExecuteDirectly('get_knowledge_content')` → false (live_015 eval case)
- [ ] `getRegisteredTools().length === 14` (tool_005 eval case)
- [ ] `buildContextPacket(...).toolManifest.length === 14` (context_002 eval case)
- [ ] `context_008` includes `get_knowledge_content`

---

## V1 behavior checklist

- [ ] `execGetKnowledgeContent({ query: 'drills for orange' })` returns `ok: true`
- [ ] Result summary starts with "I don't have Knowledge Builder content that directly answers"
- [ ] Result `data.entries` is an empty array
- [ ] `interpretKnowledgeContent` returns the pre-built summary text from executor
- [ ] `requiresConfirmation: false` on knowledge content result
- [ ] `shouldSuggestNavigation: false` — knowledge is advisory, no nav

---

## Safety checklist

- [ ] Draft knowledge entries excluded (filterKnowledgeByRole enforces this)
- [ ] Under-review entries excluded
- [ ] Advisory only — no mutations triggered
- [ ] No player names, coach notes, or private data in knowledge entries
- [ ] Knowledge cannot trigger level changes, parent comms, or curriculum publishes

---

## Sprint 1015/1016 regression checklist

- [ ] `curriculumAnswering.ts` NOT changed
- [ ] `coachSessionAnswering.ts` NOT changed
- [ ] `interpretCurriculumContext` unchanged
- [ ] `interpretSessionContext` unchanged (Sprint 1016 version)

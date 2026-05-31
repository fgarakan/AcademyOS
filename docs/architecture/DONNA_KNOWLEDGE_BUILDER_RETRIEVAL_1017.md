# DONNA Knowledge Builder Live Retrieval — Sprint 1017

**Date:** 2026-05-31
**Sprint:** 1017
**Status:** Complete (V1 — retrieval stub, honest empty-state answer)

---

## What was built

Sprint 1017 wires the existing `knowledgeBuilderBridge.ts` retrieval infrastructure as a live tool in the DONNA orchestrator. In V1, the tool returns an honest "no approved content available yet" answer because the Knowledge Builder DB table is not yet migrated. The architecture is correct for when real content is added.

---

## New tool: `get_knowledge_content`

Tool ID: `get_knowledge_content`
Safety level: safe (advisory only)
Live executor: `execGetKnowledgeContent(params)`

Params (from LLM):
- `query` (required): what the director is asking about
- `contentType` (optional): drill, coaching_tip, curriculum_note, etc.
- `stage` (optional): red, orange, green, etc.

Execution flow:
1. `retrieveApprovedKnowledge()` — V1 stub returns `[]` (no KB table yet)
2. `filterKnowledgeByRole('academy_director')` — removes draft/under-review entries
3. `rankKnowledgeByPageAffinity()` — scores by page-content affinity
4. `buildKnowledgeResponse(entries, query)` — handles empty case honestly

V1 response: `"I don't have Knowledge Builder content that directly answers '...'. This may be covered in a future platform knowledge update."`

---

## V1 limitations

- `retrieveApprovedKnowledge` returns `[]` until a DB migration creates the knowledge items table
- The tool is honest about this — no fake content is returned
- When the KB migration lands, `retrieveApprovedKnowledge` will perform real DB queries with RLS

---

## Safety invariants

- Only platform-owner-approved entries returned (draft/under-review always blocked in `filterKnowledgeByRole`)
- Advisory only — knowledge content never triggers level changes, parent comms, or curriculum publishes
- No raw knowledge content in SQL dump — structured summaries only
- `requiresConfirmation: false` (read-only, advisory)
- Knowledge cannot be cited as ground truth — `buildKnowledgeResponse` always includes "advisory" note

---

## Tool count history

| Sprint | Tools |
|---|---|
| 978 | 8 |
| 1002 | 10 |
| 1003 | 11 |
| 1004 | 12 |
| 1015 | 13 |
| 1017 | 14 |

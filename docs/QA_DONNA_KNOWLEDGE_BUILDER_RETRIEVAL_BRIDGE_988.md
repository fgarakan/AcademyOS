# QA — DONNA Knowledge Builder Retrieval Bridge V1 — Sprint 988

**Date:** 2026-05-30
**Sprint:** 988

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `knowledgeBuilderBridge.ts` compiles cleanly

## Filter Checklist
- [ ] `filterKnowledgeByRole([{ approvalStatus: 'draft', ... }], 'academy_director')` returns empty (drafts blocked)
- [ ] `filterKnowledgeByRole([{ approvalStatus: 'approved', visibilityLevel: 'director_only', ... }], 'coach')` returns empty (coach cannot see director-only)
- [ ] `filterKnowledgeByRole([{ approvalStatus: 'approved', visibilityLevel: 'all_staff', ... }], 'coach')` returns entry
- [ ] Deprecated entries are returned by `filterKnowledgeByRole` (with citation warning)

## Citation Checklist
- [ ] `buildCitation({ approvalStatus: 'deprecated', ... })` includes deprecation warning
- [ ] `buildCitation({ approvalStatus: 'approved', scope: 'global', ... })` includes "Global Knowledge Library"
- [ ] `buildKnowledgeResponse([], 'test question')` returns non-empty fallback message

## Safety Checklist
- [ ] `retrieveApprovedKnowledge(...)` returns [] (stub — no DB)
- [ ] No draft or under_review content ever reaches caller from filter functions

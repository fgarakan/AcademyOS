# DONNA Knowledge Builder Retrieval Bridge V1 — Sprint 988

**Date:** 2026-05-30
**Sprint:** 988
**Status:** Implemented — TypeScript clean

## Rules

1. Knowledge Builder content must be approved by platform owner before DONNA uses it.
2. Draft and under_review entries are NEVER shown.
3. Content visibility is scoped by role, curriculum stage, content type, privacy.
4. Knowledge Builder content never automatically becomes official curriculum.
5. DONNA cites Knowledge Builder content as a source, not ground truth.

## Key Types
- `KnowledgeEntry` — full entry with approval status, visibility, scope, stage
- `KnowledgeApprovalStatus` — draft/under_review/approved/deprecated
- `KnowledgeVisibilityLevel` — director_only/director_coach/all_staff/parent_safe
- `KnowledgeContentType` — 7 content types

## Key Functions
- `filterKnowledgeByRole(entries, role)` — filters to approved entries visible to role
- `filterKnowledgeByStage(entries, stage)` — filters by curriculum stage
- `rankKnowledgeByPageAffinity(entries, pathname)` — ranks by page context
- `buildCitation(entry)` — formats citation text (deprecated entries get warning)
- `buildKnowledgeResponse(entries, question)` — builds DONNA response with citation
- `retrieveApprovedKnowledge(params)` — V1 stub (Sprint 990 wires DB)

## No-Mutation Guarantee
No DB writes. Filter functions are pure. `retrieveApprovedKnowledge` stub returns [].

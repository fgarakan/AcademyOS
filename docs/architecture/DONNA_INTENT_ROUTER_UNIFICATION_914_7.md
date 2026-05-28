# DONNA Intent Router Unification V1
**Sprint:** 914.7 | **Date:** 2026-05-28

## Problem
Two parallel intent routing systems exist:
- **Legacy** (`donnaIntentClassifier.ts`, `donnaCommandRouter.ts`): `DonnaCommandCategory` classification, wired to `DonnaAssistantButton`
- **God Mode** (`DonnaVoiceReadyShell.tsx`): 34-inline regex interceptors, not using the classifier

## Solution (V1)
New file `src/lib/donna/donnaIntentRouterV1.ts` — **additive analysis layer**.
- Defines `DonnaUnifiedIntentType` (24 types bridging both systems)
- `routeDonnaIntentV1(text, pathname)` — pure function, no side effects
- `LEGACY_CATEGORY_MAP` — maps `DonnaCommandCategory` → `DonnaUnifiedIntentType`
- Used in `DonnaVoiceReadyShell.tsx` for metadata/logging only

## Routing behavior: UNCHANGED
The 34-interceptor pipeline remains authoritative for Sprint 914.7.
The router provides classification metadata for persistence and events.

## Intent categories mapped
Read-only (no approval): page_guide_*, director_brief, director_priority, review_queue, onboarding_guide, context_debug, recall_conversation, academy_health, kpi_question
Approval required: curriculum_draft_*, parent_draft, level_readiness, attendance, coach_observation

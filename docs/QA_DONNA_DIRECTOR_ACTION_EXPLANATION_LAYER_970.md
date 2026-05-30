# QA — DONNA Director Action Explanation Layer — Sprint 970

**Date:** 2026-05-30
**Sprint:** 970

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `directorActionExplanation.ts` compiles cleanly — no `any`, no unused imports
- [ ] `DirectorActionExplanation` type is fully typed
- [ ] `buildActionExplanation` accepts `DirectorNextAction` from `directorNextActionEngine.ts`

---

## Builder Correctness Checklist

- [ ] `buildActionExplanation({ id: 'pending_review_queue', safetyLevel: 'approval_gated', ... })` → `changesRecords: true`, `approvalRequired: true`, `safetyBadge: 'Approval Required'`
- [ ] `buildActionExplanation({ id: 'curriculum_status_review', safetyLevel: 'review_only', ... })` → `changesRecords: false`, `approvalRequired: false`, `safetyBadge: 'Draft / No auto-save'`
- [ ] `buildActionExplanation({ id: 'dashboard_review', safetyLevel: 'safe', ... })` → `changesRecords: false`, `approvalRequired: false`, `safetyBadge: 'Read-only'`
- [ ] Unknown action ID falls back to `action.why` for `whatItDoes`
- [ ] `formatExplanationAsText` returns non-empty string for all safety levels
- [ ] `getSafetyBadge('safe')` returns `'Read-only'`
- [ ] `getSafetyBadge('review_only')` returns `'Draft / No auto-save'`
- [ ] `getSafetyBadge('approval_gated')` returns `'Approval Required'`
- [ ] `requiresDirectorApproval('approval_gated')` returns `true`
- [ ] `requiresDirectorApproval('safe')` returns `false`
- [ ] `canChangeRecords('approval_gated')` returns `true`
- [ ] `canChangeRecords('review_only')` returns `false`

---

## Integration Checklist

- [ ] `directorNextActionEngine.ts` unchanged in shape — `DirectorNextAction` interface still has same fields
- [ ] `DonnaAssistantButton.tsx` unchanged — Sprint 968 behavior still works
- [ ] Sprint 968 next-action engine produces valid input for `buildActionExplanation`
- [ ] No new panel rendered, no new component created

---

## Safety / No-Mutation Checklist

- [ ] No data mutated by `buildActionExplanation`
- [ ] No DB calls in `directorActionExplanation.ts`
- [ ] No API calls in `directorActionExplanation.ts`
- [ ] No parent/player data exposed
- [ ] No player records changed
- [ ] No proposed_actions created

---

## Sprint 978 Readiness Checklist

- [ ] `DirectorActionExplanation` type is defined and exported
- [ ] `buildActionExplanation` is exported and importable by `llmOrchestration/contextPacket.ts`
- [ ] `formatExplanationAsText` produces clean text suitable for LLM prompt inclusion
- [ ] Safety badge labels are short enough for UI display (under 20 chars each)

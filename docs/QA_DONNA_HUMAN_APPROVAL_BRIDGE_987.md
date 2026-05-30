# QA — DONNA Human Approval Bridge V1 — Sprint 987

**Date:** 2026-05-30
**Sprint:** 987

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `humanApprovalBridge.ts` compiles cleanly

## Validation Checklist
- [ ] Valid input → `validation.valid: true`, `errors: []`
- [ ] Missing academyId → `errors` includes UUID error
- [ ] Short rationale → `errors` includes rationale error
- [ ] Blocked content ("medical") → `errors` includes blocked content error
- [ ] Parent-facing → `warnings` includes parent-safe warning
- [ ] Invalid actionType → `errors` includes unknown type error

## Payload Checklist
- [ ] Valid input → payload.status === 'pending_review' (never auto-approved)
- [ ] Valid input → payload.generated_by_donna === true
- [ ] Invalid input → `buildDraftApprovalPayload` returns `payload: null`
- [ ] `buildConfirmationPrompt(payload)` returns non-empty string mentioning Review Queue

## Safety Checklist
- [ ] No DB calls in bridge
- [ ] `status` is always `'pending_review'`
- [ ] No `status: 'approved'` or `'executed'` possible from bridge

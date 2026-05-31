# QA Checklist — Director Curriculum Change Approval Flow (Sprint 1022)

**Date:** 2026-05-31
**Sprint:** 1022

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `OrchestratorOutput` import resolves from `./types`
- [ ] `CurriculumDraftProposal` import resolves from `./philosophyCurriculumDraftEngine`
- [ ] `CurriculumImpactPreview` import resolves from `./curriculumImpactPreview`
- [ ] `formatImpactPreviewText` import resolves from `./curriculumImpactPreview`
- [ ] `CurriculumChangeRoutingResult.routedToReviewQueue` is type `true` (not boolean)
- [ ] `CurriculumChangeRoutingResult.autoApplied` is type `false` (not boolean)

---

## `buildCurriculumApprovalOutput` unit checklist

- [ ] Returns output with `type === 'draft_proposed_action'`
- [ ] Returns output with `safetyLevel === 'approval_gated'`
- [ ] Returns output with `requiresConfirmation === true`
- [ ] Returns output with `suggestedRoute === '/director/review'`
- [ ] Returns output with `highlightTarget.targetId === 'review-queue-primary'`
- [ ] `text` includes impact preview content
- [ ] `text` includes "nothing changes until you explicitly approve it"
- [ ] `context.firstName` → text includes greeting with name
- [ ] `context.firstName: null` → text does not include greeting
- [ ] Never throws

---

## `routeCurriculumChangeToApproval` unit checklist

- [ ] Returns `routedToReviewQueue: true`
- [ ] Returns `autoApplied: false`
- [ ] Returns `output` with correct approval_gated fields
- [ ] Returns the same `proposal` and `preview` passed in
- [ ] Never throws

---

## `auditCurriculumChangeRouting` unit checklist

- [ ] Clean result → returns null
- [ ] `output.safetyLevel !== 'approval_gated'` → returns error string
- [ ] `output.requiresConfirmation !== true` → returns error string
- [ ] `output.suggestedRoute !== '/director/review'` → returns error string
- [ ] `proposal.safetyLevel !== 'review_only'` → returns error string

---

## Safety checklist

- [ ] NO DB records created by this module
- [ ] NO proposed_action created by this module
- [ ] `autoApplied: false` cannot be overridden (literal type)
- [ ] `safetyLevel: 'approval_gated'` on all outputs
- [ ] Route to `/director/review` only — no other navigation

---

## Sprint 1021 regression checklist

- [ ] `curriculumImpactPreview.ts` NOT changed
- [ ] `philosophyCurriculumDraftEngine.ts` NOT changed
- [ ] `academyPhilosophyProfile.ts` NOT changed
- [ ] Sprint 904 `proposed_actions` pipeline NOT changed

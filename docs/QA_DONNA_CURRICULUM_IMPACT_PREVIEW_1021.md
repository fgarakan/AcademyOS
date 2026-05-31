# QA Checklist — Curriculum Impact Preview (Sprint 1021)

**Date:** 2026-05-31
**Sprint:** 1021

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `CurriculumDraftProposal` import from `philosophyCurriculumDraftEngine` resolves
- [ ] `CurriculumStage` import from `academyPhilosophyProfile` resolves
- [ ] `ImpactEffortLevel` is `'low' | 'moderate' | 'significant'`
- [ ] `isReversible: true` is a literal type, not `boolean`

---

## `buildCurriculumImpactPreview` unit checklist

- [ ] `changeType: 'define_stage_structure'` → willHappen includes "stage structure will be defined"
- [ ] `changeType: 'add_content_to_stage'` → effortLevel `'low'`
- [ ] `changeType: 'rebalance_domain'` → targetDomain appears in willHappen text
- [ ] `changeType: 'review_stage_coverage'` → willHappen includes "review will be initiated"
- [ ] All types → `approvalRequirement` contains "explicit approval"
- [ ] All types → `willNotHappen` includes "No parent or player communications"
- [ ] All types → `willNotHappen` includes player movement denial
- [ ] All types → `isReversible === true`
- [ ] Never throws

---

## `formatImpactPreviewText` unit checklist

- [ ] Output is non-empty string
- [ ] Includes "Will happen if approved:"
- [ ] Includes "Will NOT happen:"
- [ ] Includes `approvalRequirement` text
- [ ] No player names, coach names, or raw IDs

---

## Safety checklist

- [ ] `buildCurriculumImpactPreview` does NOT create any DB records
- [ ] `isReversible` is always `true`
- [ ] `approvalRequirement` always present and non-empty
- [ ] willNotHappen always includes communication/player movement denial

---

## Sprint 1020 regression checklist

- [ ] `philosophyCurriculumDraftEngine.ts` NOT changed
- [ ] `academyPhilosophyProfile.ts` NOT changed

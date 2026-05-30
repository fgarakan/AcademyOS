# QA — DONNA Curriculum Builder Guidance — Sprint 973

**Date:** 2026-05-30
**Sprint:** 973

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `curriculumBuilderGuidance.ts` compiles cleanly
- [ ] New chips in `donnaPageChipRegistry.ts` compile cleanly
- [ ] `DonnaAssistantButton.tsx` compiles cleanly with new import + handler

---

## Guidance Intent Checklist

- [ ] `matchesCurriculumBuilderGuidanceIntent('what is the curriculum')` returns `'explain_curriculum'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('what are levels')` returns `'explain_levels'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('what are gates')` returns `'explain_gates'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('what should I edit first')` returns `'what_to_edit_first'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('how does the draft work')` returns `'draft_review_behavior'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('global vs academy')` returns `'global_vs_academy'`
- [ ] `matchesCurriculumBuilderGuidanceIntent('hello donna')` returns `null`
- [ ] `buildCurriculumBuilderGuidance('explain_gates')` mentions gates and evidence

---

## Chip Behavior Checklist

- [ ] On `/director/curriculum` page: 8 chips appear (4 existing + 4 new)
- [ ] "Explain this curriculum" chip → DONNA explains the curriculum builder
- [ ] "What are levels?" chip → DONNA explains level structure
- [ ] "What are gates?" chip → DONNA explains gates and advancement
- [ ] "What should I edit first?" chip → DONNA gives edit priority guidance
- [ ] Existing highlight chips unchanged (curriculum-status, curriculum-review-draft, curriculum-level-tree)

---

## No-Mutation / No-Send Checklist

- [ ] `buildCurriculumBuilderGuidance` has no side effects — pure text return
- [ ] No curriculum records changed
- [ ] No level assignments made
- [ ] No gates confirmed
- [ ] No parent/player communications sent

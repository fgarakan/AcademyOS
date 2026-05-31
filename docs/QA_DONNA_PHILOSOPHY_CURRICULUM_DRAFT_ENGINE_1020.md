# QA Checklist — Philosophy-to-Curriculum Draft Engine (Sprint 1020)

**Date:** 2026-05-31
**Sprint:** 1020

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Imports from `academyPhilosophyProfile.ts` resolve
- [ ] `CurriculumChangeType` union is complete
- [ ] `CurriculumDraftProposal.safetyLevel` type is `'review_only'` (literal, not string)
- [ ] `CurriculumDraftProposal.source` type is `'philosophy_analysis'` (literal)

---

## `buildProposalFromGap` unit checklist

- [ ] Gap with "No curriculum content" → changeType `define_stage_structure`
- [ ] Gap with "No curriculum content" → title contains "Define Initial Curriculum Structure"
- [ ] Gap mentioning "orange" stage → changeType `add_content_to_stage`, targetStage `'orange'`
- [ ] Gap mentioning "red" stage → changeType `add_content_to_stage`, targetStage `'red'`
- [ ] Domain gap (no stage mention) → changeType `rebalance_domain`
- [ ] All proposals: `safetyLevel === 'review_only'`
- [ ] All proposals: `approvalNote` contains "nothing changes"
- [ ] All proposals: `source === 'philosophy_analysis'`
- [ ] Never throws

---

## `buildProposalSummaryText` unit checklist

- [ ] Returns non-empty string for any valid proposal
- [ ] Includes proposal title
- [ ] Includes description
- [ ] Includes `approvalNote`
- [ ] No player names, no raw IDs

---

## `buildProposalsFromGaps` unit checklist

- [ ] Empty gaps array → returns empty array
- [ ] 5 gaps → returns max 3 proposals
- [ ] Each proposal follows `buildProposalFromGap` behavior

---

## Safety checklist

- [ ] `CurriculumDraftProposal` does NOT create a DB record
- [ ] `safetyLevel` is always `'review_only'`
- [ ] `approvalNote` is always the standard "nothing changes" note
- [ ] No player names in proposal descriptions
- [ ] No coach notes in proposal descriptions

---

## Sprint 1019 regression checklist

- [ ] `academyPhilosophyProfile.ts` NOT changed
- [ ] `buildDefaultPhilosophyProfile` unchanged
- [ ] `identifyPhilosophyGaps` unchanged

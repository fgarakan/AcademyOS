# QA Checklist — Director Golden Path UX Simplification (Sprint 1026)

**Date:** 2026-05-31
**Sprint:** 1026

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `GoldenPathStep` type exports correctly
- [ ] `ComponentReadiness` type exports correctly
- [ ] `DIRECTOR_GOLDEN_PATH` array has 5 entries
- [ ] `SPRINT_1024_1025_READINESS` array has 2 entries

---

## `computeGoldenPathScore` unit checklist

- [ ] 5 steps, 3 unblocked → score 60
- [ ] 5 steps, 5 unblocked → score 100
- [ ] 5 steps, 0 unblocked → score 0
- [ ] Never throws

---

## `getTopGoldenPathBlocker` unit checklist

- [ ] Returns first blocker from first step-with-blockers
- [ ] Returns null when no blockers
- [ ] Never throws

---

## DIRECTOR_GOLDEN_PATH checklist

- [ ] `open_dashboard` step has at least 1 blocker (competing surfaces)
- [ ] `act_on_review_queue` step has 0 blockers
- [ ] `ask_donna` step has at least 1 blocker (panel not yet using DonnaPanelResponseRenderer)
- [ ] `review_players` step has 0 blockers
- [ ] `check_curriculum` step has 0 blockers

---

## Sprint 1024/1025 readiness checklist

- [ ] DirectorPrimaryActionHero readiness is 'needs_page_refactor'
- [ ] DonnaPanelResponseRenderer readiness is 'needs_visual_test'
- [ ] Architecture doc correctly explains why DirectorPrimaryActionHero is not wired yet

# QA — Parent Progress Clarity — Sprint 1047

**Sprint:** 1047 | **Date:** 2026-05-31

---

## Removed — confirm absent

- [ ] **Bottom safety note NOT visible** ("Advancement requires coach and director confirmation — not automatic. Coaching teams decide timing.")

## Preserved — confirm present

- [ ] ShieldCheck notice: "Showing coach-approved development data only — no raw notes, no rankings."
- [ ] Level journey card (Current Level → Next Level with progress bar)
- [ ] Current focus area card (when focus exists)
- [ ] Domain observation counts (Technical, Fitness, Competition, Behavioral, General)
- [ ] Encouragement box explaining observation counts
- [ ] "Development Focus" link → /parent/development

## Regression

- [ ] Progress page loads without errors for linked parent
- [ ] No-access state renders for unlinked parent
- [ ] TypeScript: `npx tsc --noEmit` passes clean

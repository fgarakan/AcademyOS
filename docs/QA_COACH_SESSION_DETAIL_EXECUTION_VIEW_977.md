# QA — Coach Session Detail Execution View — Sprint 977

**Date:** 2026-05-30
**Sprint:** 977

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `coach/sessions/[sessionId]/page.tsx` compiles cleanly with new focus ID
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with new coach session detail chip set

---

## Focus Target Checklist

- [ ] `coach-session-header` renders on `/coach/sessions/[id]` pages
- [ ] `coach-lesson-plan` exists (pre-existing, conditional on `session.template_id`)
- [ ] `coach-run-session` exists (pre-existing)
- [ ] `coach-wrap-up-link` exists (pre-existing)

---

## Chip Behavior Checklist

- [ ] On `/coach/sessions/[id]` (detail pages): 5 chips appear (coach-ses-*)
- [ ] "Highlight session info" chip → teal glow on session header
- [ ] "Highlight today's plan" chip → teal glow on lesson plan (when template exists)
- [ ] "Highlight run session" chip → teal glow on run session section
- [ ] "Highlight wrap-up" chip → teal glow on wrap-up CTA
- [ ] "What should I do next?" chip → routes to next-action engine

---

## Chip Set Routing Checklist

- [ ] `/coach/sessions` (list) → no coach-session chips (separate route)
- [ ] `/coach/sessions/abc-123` → returns 5 coach session detail chips
- [ ] `/coach/sessions/abc-123/wrap-up` → returns 5 coach session detail chips (prefix match)

---

## Session Execution Content Checklist

- [ ] Session name renders correctly
- [ ] Scheduled date and time shown
- [ ] Template name and curriculum level shown when present
- [ ] Session goal shown when present
- [ ] Block progress rail shows blocks
- [ ] "Open focused execute view" link present when blocks exist

---

## No-Mutation / No-Send Checklist

- [ ] No session records changed
- [ ] No wrap-up records changed
- [ ] No parent/player communications sent
- [ ] Highlights are visual-only

---

## Sprint 976 Regression Checklist

- [ ] Coach home chips still show on `/coach` (exact match, not affected by session prefix)
- [ ] `coach-wrapup-alert` still renders on coach home when needed

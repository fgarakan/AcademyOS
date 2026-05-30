# QA — DONNA Coach Assignment From Session — Sprint 975

**Date:** 2026-05-30
**Sprint:** 975

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `sessions/[sessionId]/page.tsx` compiles cleanly with new focus ID
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with new session detail chip set

---

## Focus Target Checklist

- [ ] `session-coach-assignment` element exists on `/director/sessions/[id]` pages (coach name span)
- [ ] `session-blocks` element already exists (pre-existing Sprint 818 target)
- [ ] `session-group-assignment` element already exists (pre-existing Sprint 818 target)

---

## Chip Behavior Checklist

- [ ] On `/director/sessions/[id]` (detail pages): 4 new chips appear (ses-detail-*)
- [ ] "Highlight coach assignment" chip → teal glow on coach name span
- [ ] "Highlight session blocks" chip → teal glow on session blocks section
- [ ] "Highlight group assignment" chip → teal glow on group assignment section
- [ ] "What should I do next?" chip on detail → routes to next-action engine
- [ ] On `/director/sessions` (list): existing chips still appear (ses-next, ses-brief)
- [ ] Prefix matching: detail pages use `/director/sessions/` (more specific); list uses `/director/sessions` (exact)

---

## Chip Set Routing Checklist

- [ ] `/director/sessions` (exact) → returns list chips (2 chips)
- [ ] `/director/sessions/abc-123` → returns detail chips (4 chips, longer prefix wins)
- [ ] `/director/sessions/abc-123/wrap-up` → returns detail chips (longer prefix wins)

---

## No-Mutation / No-Send Checklist

- [ ] Adding data-donna-focus-id attribute has no runtime behavior
- [ ] No session records changed
- [ ] No coach records changed
- [ ] No parent/player communications sent

---

## Sprint 974 Regression Checklist

- [ ] `tpl-generate-session` chip still works on template detail pages
- [ ] `GenerateSessionFromTemplateButton` still functional (not touched by Sprint 975)

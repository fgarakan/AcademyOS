# QA — DONNA Session Creation From Template — Sprint 974

**Date:** 2026-05-30
**Sprint:** 974

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with new highlight chip

---

## Chip Behavior Checklist

- [ ] On template detail page: 8 chips appear (7 from Sprint 972 + 1 new)
- [ ] "Highlight 'Generate Session'" chip → teal glow on `template-generate-session` element
- [ ] `template-generate-session` element exists in ClassTemplateBuilderStepper.tsx (data-donna-focus-id)
- [ ] Highlight fails gracefully if template has no blocks (button may be hidden) — no crash

---

## Session Creation Workflow Checklist

- [ ] `GenerateSessionFromTemplateButton` component exists and compiles
- [ ] Generate Session panel opens when clicked
- [ ] Session name pre-filled from template name
- [ ] Date defaults to today
- [ ] Coach dropdown shows available coaches
- [ ] Submitting creates a session — master template NOT modified
- [ ] Success shows link to new session in director sessions list

---

## Sprint 972 Regression Checklist

- [ ] "Create session from template" prompt chip still works (tpl-session)
- [ ] `matchesClassTemplateGuidanceIntent('create session from template')` still returns correct intent
- [ ] `buildClassTemplateGuidance('create_session_from_template')` still returns guidance text

---

## No-Mutation / No-Send Checklist

- [ ] Adding highlight chip has no side effects
- [ ] No template records changed
- [ ] No parent/player communications sent
- [ ] Highlight chip only triggers visual glow — no DB write

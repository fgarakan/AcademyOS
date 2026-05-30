# QA — DONNA Class Template Guidance — Sprint 972

**Date:** 2026-05-30
**Sprint:** 972

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `classTemplateGuidance.ts` compiles cleanly
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with new chips
- [ ] `DonnaAssistantButton.tsx` compiles cleanly with new import + handler

---

## Guidance Intent Checklist

- [ ] `matchesClassTemplateGuidanceIntent('explain this template')` returns `'explain_template'`
- [ ] `matchesClassTemplateGuidanceIntent('what are blocks')` returns `'explain_blocks'`
- [ ] `matchesClassTemplateGuidanceIntent('is this template ready')` returns `'template_readiness'`
- [ ] `matchesClassTemplateGuidanceIntent('create session from template')` returns `'create_session_from_template'`
- [ ] `matchesClassTemplateGuidanceIntent('what is the template library')` returns `'explain_template_list'`
- [ ] `matchesClassTemplateGuidanceIntent('hello donna')` returns `null`
- [ ] `buildClassTemplateGuidance('explain_template')` returns non-empty string
- [ ] `buildClassTemplateGuidance('create_session_from_template')` mentions safe workflow — no auto-creation

---

## Chip Behavior Checklist

- [ ] On template detail page: 7 chips appear (4 existing + 3 new)
- [ ] "Explain this template" chip → DONNA explains what a class template is
- [ ] "Create session from template" chip → DONNA explains the safe session creation workflow
- [ ] "Explain block structure" chip → DONNA explains blocks
- [ ] On template list page: 3 chips appear (2 existing + 1 new)
- [ ] "What is the template library?" chip → DONNA explains the template library

---

## No-Mutation / No-Send Checklist

- [ ] `buildClassTemplateGuidance` has no side effects — pure text return
- [ ] No template records created or modified
- [ ] No sessions created
- [ ] No parent/player communications sent
- [ ] No proposed_actions created

---

## Sprint 968/964 Regression Checklist

- [ ] Existing template chips still work (highlight targets unchanged)
- [ ] "What should I do next?" chip on template detail still routes to next-action engine
- [ ] Sprint 964 highlight escalation still works on template pages

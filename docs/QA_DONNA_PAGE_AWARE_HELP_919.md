# DONNA Page-Aware Help 10/10 QA
**Sprint:** 919 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Page Registry Coverage

| Page | Route | Sprint |
|---|---|---|
| Academy Setup | `/director/onboarding` | Pre-919 |
| Academy Interview | `/director/onboarding/interview` | Pre-919 |
| Curriculum Setup | `/director/onboarding/curriculum` | Pre-919 |
| Director Dashboard | `/director` | Pre-919 |
| DONNA Hub | `/director/donna` | Pre-919 |
| KPI Dashboard | `/director/kpi` | Pre-919 |
| Player Directory | `/director/players` | Pre-919 |
| Player Profile | `/director/players/[playerId]` | Pre-919 |
| Review Queue | `/director/review` | Pre-919 |
| Signals | `/director/signals` | Pre-919 |
| Curriculum | `/director/curriculum` | Pre-919 |
| Curriculum Builder | `/director/curriculum/builder` | Pre-919 |
| Templates | `/director/templates` | Pre-919 |
| Placement | `/director/placement` | Pre-919 |
| Level Up | `/director/level-up` | Pre-919 |
| Sessions | `/director/sessions/[sessionId]` | Pre-919 |
| Template Detail | `/director/class-templates/[templateId]` | Pre-919 |
| Coach Hub | `/coach` | Pre-919 |
| Coach Players | `/coach/players` | Pre-919 |
| Coach Session | `/coach/sessions/[sessionId]` | Pre-919 |
| Coach Wrap-Up | `/coach/sessions/[sessionId]/wrap-up` | Pre-919 |
| **Today's Academy** | `/director/today` | **Sprint 919** |
| **Parent Portal** | `/parent` | **Sprint 919** |
| **Player Portal** | `/player` | **Sprint 919** |
| **Settings** | `/director/settings` | **Sprint 919** |
| Fallback | `*` | Pre-919 |

---

## 2. Mandatory Question Coverage

| Question | Function | Status |
|---|---|---|
| "What can I do on this page?" | `whatCanYouHelpWith()` | ✅ Pre-919 |
| "What is the most important task here?" | `whatIsTheBestNextStep()` | ✅ Pre-919 |
| "Walk me through this page." | `walkMeThrough()` | ✅ Sprint 919 |
| "What should I click next?" | `whatShouldIClickNext()` | ✅ Sprint 919 |
| "Why does this page matter?" | `whyDoesThisMatter()` | ✅ Sprint 919 |
| "What needs approval here?" | `whatActionsRequireApproval()` | ✅ Pre-919 |
| "What should I not do?" | `whatShouldINotDo()` | ✅ Pre-919 |

---

## 3. Intent Router Patterns

| Pattern | Intent | Sprint |
|---|---|---|
| "what can I do here" | `page_guide_actions` | Pre-919 |
| "where am I" / "what page am I on" | `page_guide_explain` | Pre-919 |
| "what is the most important task" | `page_guide_next_step` | Pre-919 |
| "walk me through this page" | `page_guide_walk_through` | Sprint 919 |
| "why does this page matter" | `page_guide_why` | Sprint 919 |
| "what needs approval" | `page_guide_approval` | Pre-919 |
| "what should I not do" | `page_guide_safety` | Pre-919 |

---

## 4. Safety Checks

| Check | Result |
|---|---|
| Parent portal guide exposes coach internal notes? | No — explicitly blocked |
| Player portal guide exposes raw assessment scores? | No — explicitly blocked |
| All page guides are read-only? | Yes — no mutations in any guide function |
| Role boundaries respected? | Yes — parent/player guides only show safe context |

---

## 5. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

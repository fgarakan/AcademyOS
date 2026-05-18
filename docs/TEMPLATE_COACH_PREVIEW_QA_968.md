# Template Coach Preview Browser QA
Sprint 968 — 2026-05-18

## Scope

QA for the coach preview page (`/director/templates/coach-preview`) covering URL param handling, class vs. fitness context display, DONNA integration, and demo-mode behavior.

---

## Flow 1: Default / No Params

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Navigate directly | `/director/templates/coach-preview` | Page loads with default template: "Net Approach & Volley Patterns", Orange Ball 2, 75min. | PASS |
| Breadcrumb | — | AcademyOS > Templates > Coach Preview. | PASS |
| Demo notice | — | Orange "Demo view" alert visible. | PASS |
| Session brief card | — | Template name, level, goal, duration, coaches assigned, group size shown. | PASS |
| DONNA sidebar | — | `coach_preview` mode. Prompt: "Here is what your coaches will see. Clear and low-friction is the goal — does this feel right?" | PASS |
| DONNA quick actions | — | "Back to class templates", "Back to fitness templates", "Check projected impact". | PASS |

---

## Flow 2: Class Template Preview (via URL params)

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Open from class detail | `/director/templates/coach-preview?level=Beginner&type=class` | Page loads. `stage` derived from level ("Beginner" → Red Ball / Orange Ball). Curriculum level preview card shows for class type. | PASS |
| Curriculum level card | — | `curriculumLevelPreview.title`, `stage`, `mission` displayed. Watch-fors and drill references shown for demo blocks. | PASS |
| No fitness context card | — | Fitness context card (physicalDevelopmentNeed etc.) does NOT appear for `type=class`. | PASS |
| Session blocks | — | Demo blocks render: Warm-Up, Technical (x2), Tactical, Cool-Down. Each block shows type badge, title, duration, today's focus, step list. | PASS |
| Collapsible curriculum column | — | Right column "Curriculum" sections per block show watch-fors and curriculum drills. | PASS |

---

## Flow 3: Fitness Template Preview (via URL params)

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Open from fitness detail | `/director/templates/coach-preview?level=Intermediate&goal=Speed+%26+Agility&type=fitness` | Page loads. `stage` = "Green Ball" (from Intermediate). `fitnessPreview` computed via `getFitnessCurriculumPreview(stage)`. | PASS |
| Fitness curriculum context card | — | Card appears before session brief for `type=fitness`. Shows 5 fields: Physical Development Need, Tennis Technical Transfer, Recommended Fitness Focus, Load Guidance, Age/Fit Note. | PASS |
| Class curriculum card | — | Does NOT appear for `type=fitness`. | PASS |
| Session blocks | — | Same demo blocks render (coach preview uses shared demo block data). | PASS |
| DONNA sidebar | — | `coach_preview` mode. No context prop passed from this page — base prompt used. | PASS |

---

## Flow 4: Coach Preview Direct Access

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Coach preview accessible from class library DONNA | Quick Action "Preview a template as a coach" | Links to `/director/templates/coach-preview` (no params → default view). | PASS |
| Coach preview accessible from fitness library DONNA | Quick Action "Preview as a coach" | Same link. | PASS |
| Impact preview link from coach preview | DONNA quick action "Check projected impact" | Links to `/director/templates/impact-preview` (no params → default demo values). | PASS |

---

## Regression Checks

| Check | Expected |
|-------|----------|
| No TypeScript errors | `npx tsc --noEmit` exits clean |
| Async searchParams | Page uses `searchParams: Promise<{...}>` and `await`s before reading. No sync access. |
| No DB writes | No Supabase calls. All data is static mock or curriculum preview constants. |
| Demo notice | Orange alert present. |
| Fitness card conditional | `fitnessPreview` card renders only when `typeParam === 'fitness'` AND `stage` is truthy. |
| getCurriculumLevelPreview fallback | If level param absent, falls back to first curriculum level. No crash. |
| getFitnessCurriculumPreview fallback | If stage not a valid `BallStage`, function falls back gracefully. |

---

## Notes

- Coach preview is a Server Component (async). No client state.
- Block data (`DEMO_BLOCKS`) is hardcoded in the page — not derived from URL params. URL params affect the curriculum context card only.
- `getCurriculumStage()` maps a level string to a `BallStage` type — used to look up curriculum and fitness preview data.
- `getWatchForsForBlock()` and `getCurriculumDrillsForBlock()` derive block-level coaching hints from curriculum constants.

# Fitness Template End-to-End Browser QA
Sprint 967 — 2026-05-18

## Scope

Full user-flow QA for the fitness template system from the Templates home through fitness template detail view. All flows are demo-mode (no DB writes, no migrations).

---

## Flow 1: Templates Home → Fitness Library

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Navigate to Templates home | `/director/templates` | Page loads with template type cards. DONNA panel shows `home` mode prompt. | PASS |
| Click "Fitness Templates" card | `/director/templates/fitness` | Fitness library loads. 5 mock fitness templates displayed. Level filter tabs visible. Curriculum Stage chip visible on each card (Beginner → "Red Ball / Orange Ball", etc.). | PASS |
| DONNA sidebar check | `/director/templates/fitness` | DONNA in `fitness_library` mode. Prompt: "Your fitness templates support player development..." Fitness Gaps section shows 2 fitness gap insights (purple accented) with level badges and reason teasers. "See all" link to donna-suggestions. | PASS |
| Filter by "Elite" | `/director/templates/fitness` | Only ft-005 (Tournament Prep Endurance, Elite) shown. | PASS |
| Filter back to "All" | `/director/templates/fitness` | All 5 fitness templates visible. | PASS |

---

## Flow 2: Fitness Template Detail

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click any fitness template | `/director/templates/fitness/ft-001` | Detail page loads. Breadcrumb: AcademyOS > Templates > Fitness Templates > {template name}. | PASS |
| Demo notice | `/director/templates/fitness/ft-001` | Orange "Demo view" alert visible. | PASS |
| Template overview card | `/director/templates/fitness/ft-001` | Status chip, Level chip (color-coded per level), Fitness Goal tag. Stats: Duration, Load (color-coded Light/Moderate/High), Exercise Count. | PASS |
| Action buttons | `/director/templates/fitness/ft-001` | "Preview" link (→ coach-preview with level+goal+type=fitness params) and "Edit Draft" link visible. | PASS |
| Curriculum Connection card | `/director/templates/fitness/ft-001` | `LEVEL_TO_CURRICULUM_STAGE` mapping shown (e.g., Intermediate → "Green Ball"). Lime-tinted card with curriculum stage note. | PASS |
| Exercise list | `/director/templates/fitness/ft-001` | Demo exercises for this template shown (4–5 items). Each: name, sets, reps, optional notes. | PASS |
| Tennis Transfer tags | `/director/templates/fitness/ft-001` | `tennisTransfer` tags from mock data displayed as chips. | PASS |
| Review Queue Handoff card | `/director/templates/fitness/ft-001` | 3-step flow: Submit → Director Reviews (with template name, load, duration) → Approved/Ready. `proposed_actions` disclaimer at bottom. | PASS |
| Draft Safety panel | `/director/templates/fitness/ft-001` | Lime-accented card. Status text. "Coach Preview" and "Impact Preview" links. Impact Preview URL includes `?name=...&level=...&type=fitness`. | PASS |
| DONNA sidebar — context awareness | `/director/templates/fitness/ft-001` | DONNA prompt: `Reviewing "{template.name}" — {level} fitness template. Want me to review the exercise selection and tennis transfer?` | PASS |
| DONNA sidebar — difficulty actions | `/director/templates/fitness/ft-001` | "Difficulty" section with "Easier" (blue) and "Harder" (orange) buttons. Click either → green confirmation card with "no data saved" note. "Clear suggestion" resets. | PASS |
| DONNA sidebar — duration adjustment | `/director/templates/fitness/ft-001` | "Duration" section shows `context.durationMin` (e.g., 30min for ft-001). +/- 15min per step, clamped ±30. "Flag for review" button appears when delta != 0. Confirm shows green card. Reset clears. | PASS |
| DONNA sidebar — review guardrail | `/director/templates/fitness/ft-001` | "Review Before Apply" banner with ShieldCheck icon and guardrail text at bottom of DONNA body. | PASS |
| DONNA sidebar — quick actions | `/director/templates/fitness/ft-001` | 3 quick actions: "All fitness templates", "Preview as a coach" (→ coach-preview with fitness params), "See projected impact" (→ impact-preview with name+level+type=fitness). | PASS |

---

## Flow 3: Fitness Template Create

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Navigate to fitness create | `/director/templates/fitness/create` | 5-step wizard loads. Step 1: Curriculum Level selection (5 stages). | PASS |
| DONNA sidebar — fitness_create mode | `/director/templates/fitness/create` | DONNA prompt: "Let's build a fitness template." Fitness Gaps section (purple) shows top 2 fitness gap suggestions. Quick actions: Back, See suggestions, Check impact. | PASS |
| Select Red Ball level | — | Step 1 highlights Red Ball card. Curriculum preview panel shows `physicalDevelopmentNeed`, `tennisTechnicalTransfer`, `recommendedFitnessFocus`, `loadGuidance`, `ageFitNote`. | PASS |
| Step 2: Fitness Goal | — | Goal options rendered (curriculum-aware suggestions from `fitnessCurriculumPreview.suggestedBlockTypes`). | PASS |
| Step 3: Load + Duration | — | Light / Moderate / High load selector. Duration slider or input. | PASS |
| Step 4: Build Blocks | — | Curriculum suggestions panel shows `suggestedTypes`. Block type grid. Add blocks, expand to see exercises and progression/regression hints. | PASS |
| Step 5: Review | — | Curriculum summary card (5 fields from `FitnessCurriculumPreview`). Tennis connections from `allTennisTransfers`. Draft safety multi-line. "Preview for Coach" link. "Save as Draft" button. | PASS |
| Save as Draft | — | `draftSaved` state set. Green confirmation card. No DB write. | PASS |

---

## Flow 4: Coach Preview from Fitness Template

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Preview" from fitness detail | `/director/templates/coach-preview?level=Intermediate&goal=Speed+%26+Agility&type=fitness` | Coach preview loads. Fitness curriculum context card shown (5 fields from `getFitnessCurriculumPreview`). | PASS |
| Fitness curriculum card | — | `physicalDevelopmentNeed`, `tennisTechnicalTransfer`, `recommendedFitnessFocus`, `loadGuidance`, `ageFitNote` displayed. | PASS |

---

## Flow 5: Impact Preview from Fitness Template

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Impact Preview" from fitness detail | `/director/templates/impact-preview?name=...&level=Intermediate&type=fitness` | Impact preview loads. "Previewing Template" card shows dynamic `templateName` and `templateLevel` from URL params. | PASS |
| Type tag | — | "fitness" type shown in impact preview context. | PASS |

---

## Regression Checks

| Check | Expected |
|-------|----------|
| No TypeScript errors | `npx tsc --noEmit` exits clean |
| No DB writes | All mutations are local state only. No Supabase calls in any fitness template page. |
| No external sends | No email, push, SMS, or Slack triggered. |
| Demo notices present | All fitness template pages that show demo data display an orange alert. |
| DONNA guardrail | ShieldCheck "Review Before Apply" banner on `fitness_detail` mode. |
| Curriculum stage chip | Each fitness template card shows the curriculum stage derived from `LEVEL_TO_CURRICULUM_STAGE`. |
| Exercise bank | `getExercisesForBlock()` returns exercise suggestions for each block type × stage combination in create flow. |
| Progression/regression hints | `getExerciseProgressionRegression()` returns progression/regression for known exercise names. |

---

## Notes

- All fitness template data comes from `DEMO_FITNESS_TEMPLATES` in `src/lib/templates/templateMockData.ts`.
- Exercise content comes from `FITNESS_EXERCISE_BANK` in `src/lib/templates/fitnessExerciseAutoPopulate.ts`.
- Curriculum preview data from `FITNESS_CURRICULUM_PREVIEW_BY_STAGE` in `src/lib/templates/templateCurriculumPreview.ts`.
- DONNA fitness_create mode fitness gaps use `FITNESS_INSIGHTS` (filtered from `DEMO_DONNA_SUGGESTIONS`).
- Duration delta in DONNA panel resets on page reload (ephemeral React state).

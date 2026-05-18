# Class Template End-to-End Browser QA
Sprint 966 — 2026-05-18

## Scope

Full user-flow QA for the class template system from the Templates home through class template detail view. All flows are demo-mode (no DB writes, no migrations). Verified paths below.

---

## Flow 1: Templates Home → Class Library

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Navigate to Templates home | `/director/templates` | Page loads. DONNA panel shows `home` mode prompt and 4 quick actions. TemplatesDonnaPanel renders on right sidebar (desktop). | PASS |
| Click "Class Templates" card | `/director/templates/class` | Class library page loads. 6 mock class templates displayed in card grid. Level filter tabs (All / Beginner / Intermediate / Advanced / Elite) visible. | PASS |
| DONNA sidebar check | `/director/templates/class` | DONNA in `class_library` mode. Prompt: "Which class templates would you like to improve or create next?" Curriculum Gaps section shows 2 class gap insights with level badges and reason teasers. "See all" link to donna-suggestions. | PASS |
| Filter by "Advanced" | `/director/templates/class` | Only Advanced-level templates shown. Filter tab highlights Active. | PASS |
| Filter back to "All" | `/director/templates/class` | All 6 templates visible again. | PASS |

---

## Flow 2: Class Template Detail

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Baseline Consistency — Beginner" | `/director/templates/class/ct-001` | Detail page loads. Breadcrumb: AcademyOS > Templates > Class Templates > Baseline Consistency — Beginner. | PASS |
| Demo notice | `/director/templates/class/ct-001` | Orange "Demo view" alert visible. | PASS |
| Template overview card | `/director/templates/class/ct-001` | Status chip (Ready/Draft/Needs Review), Level chip, Track label, template name, goal text. Stats row: Blocks, Drills, Duration, Last Updated. | PASS |
| Action buttons | `/director/templates/class/ct-001` | "Preview" link and "Edit Draft" link visible in header area. | PASS |
| Curriculum Connection card | `/director/templates/class/ct-001` | If `curriculumConnection` set: lime-tinted card with connection name and CheckCircle. If null: grey card with "Connect" button. | PASS |
| Session Blocks card | `/director/templates/class/ct-001` | 4 demo blocks rendered. Each block: type badge (color-coded), title, duration, coaching focus, drill tags. Edit icon per block. Total duration shown. | PASS |
| Coach Briefing Notes | `/director/templates/class/ct-001` | Notes card renders if `coachNotes` present. | PASS |
| Review Queue Handoff card | `/director/templates/class/ct-001` | 3-step flow card: Submit → Director Reviews (with template name/level/duration) → Approved/Ready. `proposed_actions` disclaimer at bottom. | PASS |
| Draft Safety panel | `/director/templates/class/ct-001` | Lime-accented card. Status-conditional text. "Coach Preview" and "Impact Preview" links. Impact Preview link includes `?name=...&level=...&type=class`. | PASS |
| DONNA sidebar — context awareness | `/director/templates/class/ct-001` | DONNA prompt shows template name + "class template. Want me to check curriculum connections..." Context-aware. | PASS |
| DONNA sidebar — difficulty actions | `/director/templates/class/ct-001` | "Difficulty" section with "Easier" and "Harder" buttons. Click "Harder" → green confirmation card, "Flagged: Make Harder", "no data saved" note, "Clear suggestion" link. | PASS |
| DONNA sidebar — duration adjustment | `/director/templates/class/ct-001` | "Duration" section shows `baseDuration`min. Click +15min twice → 90min (if base 60). "Flag for review (+30min)" button appears. Click → green confirmation, "Flagged: 90min". Reset clears. | PASS |
| DONNA sidebar — review guardrail | `/director/templates/class/ct-001` | Lime-accented "Review Before Apply" banner at bottom of DONNA body. Text: "DONNA proposes — you approve..." | PASS |
| DONNA sidebar — quick actions | `/director/templates/class/ct-001` | 4 quick actions: "All class templates", "Preview as a coach" (→ coach-preview with level+type=class params), "See projected impact" (→ impact-preview with name+level+type=class), "Ask DONNA for improvements" (→ donna-suggestions). | PASS |

---

## Flow 3: Class Template Create

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Create New" or "Edit Draft" | `/director/templates/class/create` | 5-step wizard loads. Step 1: Curriculum Level selection (6 levels). | PASS |
| DONNA sidebar — class_create mode | `/director/templates/class/create` | DONNA prompt: "Let's build a class template step by step." Curriculum Gaps section shows top 2 class gaps. Quick actions: Back, See suggestions, Preview coach view. | PASS |
| Select Intermediate level | — | Step 1 highlights Intermediate card. "Next: Drill Focus" button enabled. | PASS |
| Step 2: Drill Focus / Goal | — | Goal options rendered. Select one. | PASS |
| Steps 3–5 | — | Continue through Block Duration, Build Blocks, Review. Step 5 shows full summary: curriculum level, goal, drills, draft safety multi-line text, "Preview for Coach" link, "Save as Draft" button. | PASS |
| Save as Draft | — | `draftSaved` state set. Green "Draft saved locally" card with 4-step "what happens next". No DB write. | PASS |

---

## Flow 4: Coach Preview from Class Template

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Preview" from class detail | `/director/templates/coach-preview?level=Beginner&type=class` | Coach preview page loads. Template params read from URL. | PASS |
| Coach preview content | — | Session brief with level and type context. DONNA sidebar in `coach_preview` mode. | PASS |

---

## Flow 5: Impact Preview from Class Template

| Step | URL | Expected | Status |
|------|-----|----------|--------|
| Click "Impact Preview" from class detail | `/director/templates/impact-preview?name=...&level=Beginner&type=class` | Impact preview page loads. "Previewing Template" card shows dynamic template name and level from URL params. | PASS |
| DONNA sidebar | — | DONNA in `impact` mode. Prompt contextual if name provided. | PASS |

---

## Regression Checks

| Check | Expected |
|-------|----------|
| No TypeScript errors | `npx tsc --noEmit` exits clean |
| No DB writes | All mutations are local state only. No Supabase calls in any class template page. |
| No external sends | No email, push, SMS, or Slack triggered by any action. |
| Demo notices present | All class template pages that show demo data have an orange "Demo view" or "Demo suggestions" alert. |
| DONNA guardrail present on detail pages | ShieldCheck "Review Before Apply" banner visible on class_detail mode. |
| Breadcrumb accuracy | Every page breadcrumb matches the actual URL hierarchy. |

---

## Notes

- All template data is from `DEMO_CLASS_TEMPLATES` and `DEMO_CLASS_TEMPLATE_BLOCKS` in `src/lib/templates/templateMockData.ts`.
- No backend wiring. All state is ephemeral (React `useState`).
- "Edit Draft" and "Edit connection" buttons are navigation links or placeholder buttons — no persistent mutation.
- DONNA sidebar state (difficulty nudge, duration delta) resets on page reload.

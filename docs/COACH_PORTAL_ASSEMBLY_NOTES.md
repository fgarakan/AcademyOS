# Coach Portal Assembly

> Sprints 482–484 — Coach Portal V1
> See also: `src/lib/coach/coachKpiSummary.ts`, `src/lib/coach/coachPortalAssembly.ts`, `src/lib/coach/voiceCurriculumBridge.ts`

---

## Coach KPI Summary (Sprint 482)

`buildCoachKpiSummary(input)` computes coach-level KPIs from pre-fetched session records:

| KPI | Computation |
|---|---|
| sessionsTaught | completed sessions in window |
| wrapUpRatePct | sessionsWithWrapUp / sessionsTaught |
| averageAttendancePct | mean attended/scheduled per session |
| totalCoachingHours | sum of durationMin / 60 |
| groupsCoached | unique group IDs across sessions |
| pendingWrapUpCount | upcoming sessions without a wrap-up |

Default window: 28 days.

---

## Coach Portal Assembly (Sprint 483)

`buildCoachPortalViewModel(context, kpiSummary, displayName)` produces the view model for `/coach`.

Home card types: `session_today` | `pending_wrapup` | `kpi_snapshot` | `donna_prompt`

DONNA prompts are dynamically selected based on KPI signals (low wrap-up rate, low attendance, upcoming sessions).

---

## Coach Voice-to-Curriculum Bridge (Sprint 484)

`processCurriculumSubmission(submission, itemId)` validates and packages a coach's curriculum idea:

1. Validates idea text (10–500 chars, domain optional)
2. Creates a `CurriculumInboxItem` with `sourceType: 'coach_suggestion'`
3. Wraps in `CoachCurriculumActionPayload` with `requiresDirectorApproval: true`
4. Returns payload — does NOT write to DB

The calling server action must:
- Check `isCoachAllowedToSubmitCurriculumIdea(role)` → true for coach/head_coach
- Create `proposed_action` with `action_type: 'other'` and the payload
- Director reviews in `/director/review` → curriculum inbox

---

## Safety invariants

- Voice-to-curriculum never directly writes to `curriculum_requirements` or `curriculum_levels`
- Every coach submission creates a `proposed_action` with `status: pending_review`
- Director must approve before any curriculum record changes
- Coach cannot see whether their idea was applied — only that it was submitted

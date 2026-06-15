# Fable Director UX — Screen Priority Map V1

**June 2026**
**Principle: Deep System. Simple Screen. DONNA Is The Interface.**

---

## What Fable Means In This Context

Fable is not a theme. It is a constraint.

Every screen must pass three tests:
1. **One job.** A director can state in one sentence what this screen is for.
2. **DONNA speaks first.** The primary surface is DONNA's voice, not a grid of widgets.
3. **Fewer panels, bigger signal.** Remove any panel whose absence would not be noticed.

The current Director UI has the right intelligence. The problem is density. Fable strips the screen back so the intelligence can breathe.

---

## Tier Definitions

| Tier | Meaning |
|---|---|
| **Tier 1 — Now** | First to implement. Director lands here every day. Highest daily leverage. |
| **Tier 2 — Next** | Critical workflows. Implement after Today is solid. |
| **Tier 3 — Later** | Important but not daily. Queue for after Tier 2. |
| **Tier 4 — Defer / Audit** | Exists, works, no immediate Fable redesign needed. May be removed or merged. |

---

## Primary Navigation (Sidebar)

| # | Screen | Route | Tier | Rationale |
|---|---|---|---|---|
| 1 | **Today** | `/director` | **Tier 1** | Every session starts here. DONNA's primary voice. Highest redesign impact. |
| 2 | **Approvals** | `/director/review` | **Tier 2** | High-stakes approval flow. Director takes real action here. |
| 3 | **Players** | `/director/players` | **Tier 2** | Most-visited after Today. Directory + DONNA draft surfacing. |
| 4 | **Player Detail** | `/director/players/[id]` | **Tier 2** | Where player decisions are made. Complex, high value. |
| 5 | **Curriculum** | `/director/curriculum` | **Tier 3** | Weekly use, not daily. DonnaCurriculumBrief is strong — clean up density. |
| 6 | **Curriculum Builder** | `/director/curriculum/builder` | **Tier 3** | Specialist screen. Works well. Evolution panel is the primary surface. |
| 7 | **Coaches** | `/director/coaches` | **Tier 3** | Periodic use. Simpler screen — needs less work. |
| 8 | **Settings** | `/director/settings` | **Tier 4** | Functional. No redesign needed. |
| 9 | **Assessment Template** | `/director/assessment-template` | **Tier 4** | Specialist. Works. Defer. |

---

## Secondary / System Screens

| Screen | Route | Tier | Rationale |
|---|---|---|---|
| Review Detail | `/director/review/[actionId]` | **Tier 2** | Each approval action has a detail view — clean up context panel. |
| Signals | `/director/signals` | **Tier 3** | Debug / advanced screen. Low director frequency. |
| Sessions Overview | `/director/sessions/overview` | **Tier 3** | Schedule view. Useful but not daily. |
| Session Detail | `/director/sessions/[id]` | **Tier 3** | Coach + director shared. Already functional. |
| Level Up | `/director/level-up` | **Tier 3** | Advancement management. Periodic use. |
| DONNA Page | `/director/donna` | **Tier 3** | COO Q&A surface — where DonnaCOOPanel content belongs. |
| Parents | `/director/parents` | **Tier 3** | Directory view. Functional. |
| KPI | `/director/kpi` | **Tier 4** | Analytics view. Low daily frequency. |
| AI Suggestions | `/director/ai-suggestions` | **Tier 4** | Surfaced inline now — may be redundant. |
| Placement | `/director/placement` | **Tier 4** | Onboarding flow. Works. |
| Onboarding | `/director/onboarding` | **Tier 4** | Setup flow. Leave as-is. |
| Demo | `/director/demo` | **Tier 4** | Demo/dev only. |
| Command Center | `/director/command-center` | **Tier 4** | Legacy. Superseded by Today page. |

---

## Dead Routes (exist, not in nav)

These routes exist in the codebase but are not reachable from the sidebar and may be unused:
- `/director/attention` — superseded by attention queue in review flow
- `/director/improvement` — purpose unclear
- `/director/donna-analytics` — analytics stub
- `/director/donna-coo-demo` — demo only
- `/director/pilot-readiness` — audit tool
- `/director/support-diagnostics` — debug only
- `/director/migration-verify` — migration tool

**Recommendation:** Audit and delete or archive these routes in a separate cleanup sprint after Tier 1–2 Fable work.

---

## Implementation Order — Tier 1 Only (This Plan)

The plan covers **Tier 1 only: Today Page**.

```
Sprint 2051–2080  — Fable Today Page V1: Hero + Decisions
Sprint 2081–2100  — Fable Today Page V2: Alerts/Wins + Secondary collapse
Sprint 2101–2120  — Fable Approval Queue V1 (Tier 2 begins)
```

Do not begin Tier 2 until the Today page passes director review.

---

## What Does Not Change (Ever)

These screens are functional and must not be disturbed during Fable work:
- Onboarding flow (`/director/onboarding/*`)
- Player onboarding stepper (`/director/players/[id]/onboard`)
- Review + approval engine (`/director/review/*`) — structure only; Fable may improve presentation
- Any screen that writes to `proposed_actions` or `audit_logs`

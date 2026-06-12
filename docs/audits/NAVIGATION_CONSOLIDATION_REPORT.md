# Director Navigation Consolidation Report
Date: June 2026
Status: DECIDED — Awaiting Phase B implementation
Sprint: Mega Sprint 2141–2170

---

## Canonical Navigation Standard

| #  | Label      | Route                     | Purpose                         |
|----|------------|---------------------------|---------------------------------|
| 1  | Today      | /director                 | DONNA speaks. Director acts.    |
| 2  | Dashboard  | /director/dashboard       | Evidence layer. Why?            |
| 3  | Players    | /director/players         | Roster, profiles, placement.    |
| 4  | Curriculum | /director/curriculum      | What are we teaching?           |
| 5  | Templates  | /director/class-templates | How are we running it?          |
| 6  | Coaches    | /director/coaches         | Who is executing?               |
| 7  | Approvals  | /director/review          | Decisions pending.              |
| 8  | Settings   | /director/settings        | Configuration.                  |

SYSTEM_ITEMS (Assessment Template, Onboarding): audited and removed or
integrated into the primary flow in Phase B.

---

## SidebarNav.tsx — Before vs. After

Current ACADEMY_ITEMS:
  Today, Players, Curriculum, Coaches, Approvals, Settings

Target ACADEMY_ITEMS:
  Today, Dashboard, Players, Curriculum, Templates, Coaches, Approvals, Settings

Changes:
- Add Dashboard as item 2 (route: /director/dashboard)
- Add Templates as item 5 (route: /director/class-templates)
- Confirm both routes are live before sidebar change ships

---

## Broken Link Fixes — Phase B

| File                            | Current href             | Correct href                | Status   |
|---------------------------------|--------------------------|-----------------------------|----------|
| todayBriefEngine.ts (~75)       | /onboarding              | /director/onboarding        | Ready    |
| todayBriefEngine.ts (~87)       | /director/templates      | /director/class-templates   | Ready ✓  |
| donnaInsightEngine.ts (154)     | /director/today          | /director                   | Ready    |
| donnaQuickActions.ts (51)       | /director/today          | /director                   | Ready    |
| directorBriefing.ts (44)        | /director/today          | /director                   | Ready    |
| AcademyHealthBreakdown.tsx (251)| /director/today          | /director                   | Ready    |
| sessions/page.tsx (116)         | /director/today          | /director                   | Ready    |
| donnaQuickActions.ts (69)       | /director/donna-coo-demo | TBD                         | Deferred |
| donnaQuickActions.ts (105)      | /director/donna-coo-demo | TBD                         | Deferred |

All non-deferred fixes have no remaining blockers. Template arch decision
resolved todayBriefEngine.ts step 3.

---

## Deprecated Routes — Phase B Redirects

| Route                 | Target                    | Notes                           |
|-----------------------|---------------------------|---------------------------------|
| /director/today       | /director                 | Legacy demo-aware Today page    |
| /director/setup       | /director/onboarding      | Legacy 12-step static checklist |
| /director/kpi         | /director/dashboard       | KPI terminology retired         |
| /director/templates/* | /director/class-templates | Tree A deprecated               |

---

## Routes Confirmed Canonical (No Action)

| Route                       | Notes                                       |
|-----------------------------|---------------------------------------------|
| /director                   | Today — canonical                           |
| /director/review            | Approvals — canonical                       |
| /director/attention         | Keep — DONNA routes here correctly          |
| /director/onboarding        | Director onboarding — canonical             |
| /director/class-templates   | Class Templates — canonical (Tree B)        |
| /director/fitness/templates | Fitness Templates — canonical (Tree B)      |
| /director/players           | Canonical                                   |
| /director/coaches           | Canonical                                   |
| /director/curriculum        | Canonical                                   |
| /director/settings          | Canonical                                   |

---

## Open After This Sprint

/director/donna-coo-demo dead route (donnaQuickActions.ts lines 69, 105):
replacement route TBD — deferred until DONNA conversation Phase 1 defines
the canonical DONNA interaction surface.

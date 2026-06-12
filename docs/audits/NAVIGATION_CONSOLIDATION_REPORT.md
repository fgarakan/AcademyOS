# Director Navigation Consolidation Report
Date: June 2026
Status: IMPLEMENTED — Sprint 2171–2200
Sprint: Mega Sprint 2141–2170 (plan) / Mega Sprint 2171–2200 (implementation)

---

## Canonical Navigation Standard — LIVE

| #  | Label      | Route                  | Purpose                         |
|----|------------|------------------------|---------------------------------|
| 1  | Today      | /director              | DONNA speaks. Director acts.    |
| 2  | Dashboard  | /director/dashboard    | Evidence layer. Why?            |
| 3  | Players    | /director/players      | Roster, profiles, placement.    |
| 4  | Curriculum | /director/curriculum   | What are we teaching?           |
| 5  | Templates  | /director/templates    | How are we running it?          |
| 6  | Coaches    | /director/coaches      | Who is executing?               |
| 7  | Approvals  | /director/review       | Decisions pending.              |
| 8  | Settings   | /director/settings     | Configuration.                  |

Templates nav item (item 5) activates on /director/class-templates and
/director/fitness/templates via activeOnPaths in SidebarNav.tsx.

SYSTEM_ITEMS removed. Onboarding renders conditionally only when
onboardingIncomplete === true.

---

## SidebarNav.tsx — Before / After

Before (6 ACADEMY_ITEMS + 2 SYSTEM_ITEMS):
  Today, Players, Curriculum, Coaches, Approvals, Settings
  [System] Assessment Template, Onboarding (always visible)

After (8 ACADEMY_ITEMS, conditional Onboarding):
  Today, Dashboard, Players, Curriculum, Templates, Coaches, Approvals, Settings
  [conditional] Onboarding (only when onboardingIncomplete === true)

---

## Href Fixes — All Resolved

| File                             | Was                      | Now                         | Status |
|----------------------------------|--------------------------|-----------------------------|--------|
| todayBriefEngine.ts (~75)        | /onboarding              | /director/onboarding        | DONE   |
| todayBriefEngine.ts (~87)        | /director/templates      | /director/templates         | CORRECT AS-IS — hub exists |
| donnaInsightEngine.ts (154)      | /director/today          | /director                   | DONE   |
| donnaQuickActions.ts (51)        | /director/today          | /director                   | DONE   |
| directorBriefing.ts (44)         | /director/today          | /director                   | DONE   |
| AcademyHealthBreakdown.tsx (251) | /director/today          | /director                   | DONE   |
| sessions/page.tsx (116)          | /director/today          | /director                   | DONE   |
| donnaQuickActions.ts (69)        | /director/donna-coo-demo | /director/attention         | DONE   |
| donnaQuickActions.ts (105)       | /director/donna-coo-demo | /director                   | DONE   |
| DONNAPilotDemoNav.tsx (59)       | /director/donna-coo-demo | /director                   | DONE   |

No broken hrefs remain.

---

## Redirects Implemented

| Route             | Target                   | Notes                           |
|-------------------|--------------------------|---------------------------------|
| /director/today   | /director                | Legacy demo-mode Today retired  |
| /director/setup   | /director/onboarding     | Legacy static checklist retired |
| /director/kpi     | /director/dashboard      | KPI terminology retired         |

Note: /director/templates was NOT redirected — it was rewritten as the
canonical Templates Hub. Tree A sub-routes remain on disk but are unreachable
from navigation.

---

## Routes Confirmed Canonical

| Route                       | Notes                                              |
|-----------------------------|----------------------------------------------------|
| /director                   | Today — canonical                                  |
| /director/dashboard         | Dashboard — canonical (new, replaces /director/kpi)|
| /director/templates         | Templates Hub — canonical (rewritten from Tree A)  |
| /director/class-templates   | Class Templates builder — canonical (Tree B)       |
| /director/fitness/templates | Fitness Templates builder — canonical (Tree B)     |
| /director/review            | Approvals — canonical                              |
| /director/attention         | Canonical attention workspace                      |
| /director/onboarding        | Director onboarding — canonical                    |
| /director/players           | Canonical                                          |
| /director/coaches           | Canonical                                          |
| /director/curriculum        | Canonical                                          |
| /director/settings          | Canonical                                          |

---

## Open After This Sprint

Tree A sub-routes unreachable from navigation:
  /director/templates/class/*
  /director/templates/fitness/*
  /director/templates/coach-preview/
  /director/templates/donna-suggestions/
  /director/templates/impact-preview/

These can be deleted in a future cleanup sprint. No data impact.

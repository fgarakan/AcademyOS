# QA — Director Navigation IA Lock
## Sprint 1060

**Date:** 2026-05-31

---

## A. Desktop Sidebar — Locked Label Order

| # | Expected label | Route | Pass/Fail |
|---|---|---|---|
| 1 | Today | `/director` | |
| 2 | Approvals | `/director/review` | |
| 3 | Players | `/director/players` | |
| 4 | Sessions | `/director/sessions` | |
| 5 | Curriculum | `/director/curriculum/builder` | |
| 6 | Parent Updates | `/director/parents` | |
| 7 | Academy Health | `/director/kpi` | |
| 8 | Templates | `/director/templates` | |
| 9 | Coaches | `/director/coaches` | |
| S | Settings | `/director/settings` (System section) | |
| S | Onboarding | `/director/onboarding` (System section) | |

---

## B. Desktop Sidebar — Labels That Must NOT Appear

| Label | Must not appear | Pass/Fail |
|---|---|---|
| Dashboard | Primary sidebar nav | |
| Review Queue | Primary sidebar nav | |
| KPI | Primary sidebar nav | |
| DONNA | Primary sidebar nav | |
| Today's Academy | Primary sidebar nav | |
| Signals | Primary sidebar nav | |
| Command Center | System nav | |

---

## C. Desktop Sidebar — Badge and Approvals Count

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| C1 | Director has pending items in review queue | "Approvals" nav item shows red badge with count | |
| C2 | Director has no pending items | No badge on Approvals | |
| C3 | Click "Approvals" | Navigates to `/director/review` | |
| C4 | Approvals page h1 | Shows "Approvals" (not "Review Queue") | |
| C5 | Approvals page breadcrumb | Shows "Today" (not "Dashboard") | |

---

## D. Mobile Nav — Locked Top-5

| # | Expected label | Route | Pass/Fail |
|---|---|---|---|
| 1 | Today | `/director` | |
| 2 | Approvals | `/director/review` | |
| 3 | Players | `/director/players` | |
| 4 | Sessions | `/director/sessions` | |
| 5 | Curriculum | `/director/curriculum/builder` | |

Mobile — must NOT appear: Home, Review, DONNA, Today's Academy

---

## E. Parent Updates Navigation

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| E1 | Director sees "Parent Updates" in sidebar | Item visible at position 6 | |
| E2 | Click "Parent Updates" | Navigates to `/director/parents` — parent comms page loads | |
| E3 | Page renders with parent update rows or empty state | No 404 | |

---

## F. DONNA Context Labels

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| F1 | Navigate to `/director/review`, open DONNA | Header shows `↳ Approvals` (not `↳ Review Queue`) | |
| F2 | Navigate to `/director`, open DONNA | Header shows `↳ Today` (not `↳ Dashboard`) | |
| F3 | Ask DONNA about the approvals queue | DONNA response card uses "Approvals" label | |

---

## G. Director Dashboard Page

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| G1 | Navigate to `/director` | Page loads (unchanged functionality) | |
| G2 | Find "Review Queue" quick link on dashboard | Text now says "Approvals" | |
| G3 | Click that link | Navigates to `/director/review` | |

---

## H. Removed Items — Still Accessible

| Item | Expected | Pass/Fail |
|---|---|---|
| `/director/signals` | Page loads via direct URL | |
| `/director/today` | Page loads via direct URL | |
| `/director/donna` | Page loads via direct URL | |
| `/director/command-center` | Page loads via direct URL | |

---

## I. Routes and Links Stable

| # | Step | Expected | Pass/Fail |
|---|---|---|---|
| I1 | All sidebar links navigate correctly | No 404s | |
| I2 | All mobile nav links navigate correctly | No 404s | |
| I3 | Approvals badge count matches pending queue count | Same count as before | |
| I4 | DONNA floating button still present | Not affected by nav changes | |

---

## J. Previous Sprint Regressions

| Area | Expected | Pass/Fail |
|---|---|---|
| One-click voice (Sprint 1057) | DONNA button still starts voice | |
| Sidebar reduction (Sprint 1058) | Context/Suggestions collapsed by default | |
| Greeting simplification (Sprint 1059) | Short greeting, no follow-up text | |

# Director Navigation IA Lock — Sprint 1060

**Date:** 2026-05-31
**Status:** Implemented

---

## Locked Director Navigation Standard

| # | Visible Label | Route | Was |
|---|---|---|---|
| 1 | Today | `/director` | Dashboard |
| 2 | Approvals | `/director/review` | Review Queue |
| 3 | Players | `/director/players` | Players (unchanged) |
| 4 | Sessions | `/director/sessions` | Sessions (unchanged) |
| 5 | Curriculum | `/director/curriculum/builder` | Curriculum (unchanged) |
| 6 | Parent Updates | `/director/parents` | Not in nav (route existed) |
| 7 | Academy Health | `/director/kpi` | KPI |
| 8 | Templates | `/director/templates` | Templates (unchanged) |
| 9 | Coaches | `/director/coaches` | Coaches (reordered) |

**System section:** Settings, Onboarding

---

## Items Removed from Primary Nav

| Removed label | Route | Disposition |
|---|---|---|
| Dashboard | `/director` | Renamed to **Today** |
| DONNA | `/director/donna` | Removed — DONNA is the persistent floating button, not a sidebar page |
| Today's Academy | `/director/today` | Removed — `/director` (Today) serves this role; page still accessible via direct URL |
| Review Queue | `/director/review` | Renamed to **Approvals** |
| Signals | `/director/signals` | Removed from primary nav — page still accessible; future sprint can surface under Academy Health |
| KPI | `/director/kpi` | Renamed to **Academy Health** |
| Command Center | `/director/command-center` | Removed from System nav — DONNA floating panel is the entry point; page still accessible |

---

## Mobile Nav (locked top-5)

| # | Label | Route | Was |
|---|---|---|---|
| 1 | Today | `/director` | Home |
| 2 | Approvals | `/director/review` | Review |
| 3 | Players | `/director/players` | Players (unchanged) |
| 4 | Sessions | `/director/sessions` | (replaced Today's Academy) |
| 5 | Curriculum | `/director/curriculum/builder` | (replaced DONNA) |

---

## Parent Updates

Route `/director/parents` exists — parent communications page with draft/approved/sent pipeline. Added to primary nav at position 6. Was not previously in the sidebar despite the route being live.

---

## Signals Disposition

`/director/signals` page removed from primary nav only. Page still exists and is accessible by direct URL. Can be added as a sub-section under Academy Health or as a disclosure in a future sprint.

---

## Routes Stable Behind Renamed Labels

All route paths unchanged. Labels are display-only renames:
- `/director` → visible as "Today"
- `/director/review` → visible as "Approvals"
- `/director/kpi` → visible as "Academy Health"

---

## Files Modified

| File | Change |
|---|---|
| `src/components/nav/SidebarNav.tsx` | New ACADEMY_ITEMS (9 locked items); badge check updated to `'Approvals'`; Command Center removed from SYSTEM_ITEMS |
| `src/components/nav/DirectorMobileNav.tsx` | New 5-item mobile nav; DONNA removed; Today's Academy replaced with Sessions; Curriculum replaces DONNA |
| `src/components/assistant/donnaPageContextRegistry.ts` | `screenName: 'Review Queue'` → `'Approvals'`; `screenName: 'Dashboard'` → `'Today'` |
| `src/components/assistant/DonnaAssistantButton.tsx` | QUICK_LINKS, 3 lastSuggestedNavigationLabel, narration, response labels → `'Approvals'`; Actions section UI label |
| `src/app/director/review/page.tsx` | h1 `Review Queue` → `Approvals`; breadcrumb `Dashboard` → `Today` |
| `src/app/director/page.tsx` | Link text `Review Queue` → `Approvals` |
| `src/lib/ux/navConfigs.ts` | Labels, order, Parent Updates added, removed items documented |

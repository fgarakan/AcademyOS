# Director Navigation UX Audit
**Sprint:** Mega Sprint 1505–1534 — DONNA Coach Intelligence + Director Navigation UX V1
**Date:** 2026-06-09
**Status:** COMPLETE — navigation reorder + simplification applied in this sprint

---

## UX design principles (from sprint brief)

1. **Today is the operating surface** — opens immediately, shows only what needs attention
2. **DONNA gives synthesis first** — headline + one-sentence synthesis + recommended action on every card
3. **Detail is hidden until requested** — "Why?" / "Show evidence" links, not chart walls by default
4. **No dense dashboards on Today** — no KPI walls, no long tables by default
5. **Every page answers**: What matters? Why? What do I do next?

---

## Current navigation (pre-sprint)

### Sidebar primary nav (Sprint 1060 lock)

| Position | Label | Route | Problem |
|---|---|---|---|
| 1 | Today | /director | Correct home — operating surface |
| 2 | Review & Decide | /director/review | Label unclear — "Review & Decide" requires cognitive parsing |
| 3 | Players | /director/players | Fine |
| 4 | Sessions | /director/sessions | Fine |
| 5 | Curriculum | /director/curriculum | High frequency — but lower than Templates in practice |
| 6 | Parent Updates | /director/parents | Low frequency; label implies passive reading, not action |
| 7 | Academy Health | /director/kpi | Wrong label for this position — sounds like a report, not a tool |
| 8 | Templates | /director/templates | Fine — operational tool |
| 9 | Coaches | /director/coaches | Fine |

### System section
- Assessment Template → /director/assessment-template
- Settings → /director/settings
- Onboarding → /director/onboarding

### Mobile nav (Sprint 1060 lock)
Today / Approvals / Players / Sessions / Curriculum

---

## Problems with current navigation

1. **"Review & Decide"** — cognitive overhead. Directors don't think "review & decide", they think "approvals". Jargon.
2. **"Academy Health"** — reads as a report tab, not a dashboard. Positioned after Templates (low-frequency) and Parent Updates. Wrong position for a decision-support tool.
3. **"Parent Updates"** — label implies director should be reading updates, not acting. Low-frequency for daily director workflow. Adds noise to primary nav.
4. **Templates before Curriculum violated** — Curriculum at position 5, Templates at position 8. Templates are daily operational execution; Curriculum is foundational but lower-frequency editing.
5. **Settings in System section** — requires director to scroll past all academy items. Should be accessible at the bottom of primary nav.
6. **No Dashboard** — KPI and trends live at `/director/kpi` under "Academy Health" label. Should be explicit "Dashboard" as visual proof/trends layer, separate from Today.

---

## Target navigation (Sprint 1505 lock)

| Position | Label | Route | Rationale |
|---|---|---|---|
| 1 | Today | /director | Operating surface — home |
| 2 | Dashboard | /director/kpi | Visual proof/trends; renamed from "Academy Health" |
| 3 | Players | /director/players | Unchanged |
| 4 | Sessions | /director/sessions | Unchanged |
| 5 | Approvals | /director/review | Renamed from "Review & Decide"; pendingCount badge retained |
| 6 | Templates | /director/templates | Moved above Curriculum — operational frequency |
| 7 | Curriculum | /director/curriculum | Foundational but lower-frequency editing |
| 8 | Coaches | /director/coaches | Unchanged |
| 9 | Settings | /director/settings | Moved to primary nav; removed from System section |

**Removed from primary nav:**
- Parent Updates (/director/parents) — accessible via URL; not a daily director decision surface
- Academy Health (/director/kpi) — absorbed into "Dashboard" at position 2

**System section simplified:**
- Assessment Template → /director/assessment-template (retained)
- Onboarding → /director/onboarding (retained with attention dot when incomplete)
- Settings removed (now in primary nav)

**Mobile nav (updated):**
1. Today → /director
2. Players → /director/players
3. Sessions → /director/sessions
4. Approvals → /director/review
5. Coaches → /director/coaches

---

## Dashboard route status

- `/director/kpi` — exists, has KPI charts and trend data. **Pointed to by "Dashboard" nav item.**
- `/director/dashboard` — does not exist. Not created in this sprint (per sprint brief: "do not build full dashboard yet").

---

## Mobile nav rationale

Mobile top-5: Today / Players / Sessions / Approvals / Coaches

- Templates and Curriculum are lower-frequency on mobile (director is more likely reviewing, not building on mobile).
- Coaches is included to support the Coach Intelligence V1 conversation flow (Sprint 1505).
- Approvals retained with badge for urgency.

---

## Files changed in this sprint

| File | Change |
|---|---|
| `src/components/nav/SidebarNav.tsx` | Reorder ACADEMY_ITEMS; rename labels; move Settings to primary nav; simplify system section |
| `src/components/nav/DirectorMobileNav.tsx` | Update mobile top-5 to new locked order |

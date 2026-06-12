# Director Dashboard Architecture
Date: June 2026
Status: DECIDED
Sprint: Mega Sprint 2141–2170

---

## Definition

Dashboard is the evidence layer for Today.

Today answers: What should I do?
Dashboard answers: Why? Show me the proof.

---

## Route

Canonical route: /director/dashboard

The /director/kpi route is deprecated. Phase B adds a redirect:
/director/kpi → /director/dashboard

"KPI" terminology is retired everywhere in the product. The surface is
called "Dashboard."

---

## Navigation Position

Dashboard is the second item in primary navigation, immediately after Today.

| #  | Label      | Route                     |
|----|------------|---------------------------|
| 1  | Today      | /director                 |
| 2  | Dashboard  | /director/dashboard       |
| 3  | Players    | /director/players         |
| 4  | Curriculum | /director/curriculum      |
| 5  | Templates  | /director/class-templates |
| 6  | Coaches    | /director/coaches         |
| 7  | Approvals  | /director/review          |
| 8  | Settings   | /director/settings        |

---

## Today vs. Dashboard Split

|                   | Today                   | Dashboard               |
|-------------------|-------------------------|-------------------------|
| Primary question  | What do I do right now? | Why is this happening?  |
| DONNA role        | Speaks first            | Evidence supports       |
| Time horizon      | Today / this week       | Rolling 30/90 days      |
| Depth             | Shallow — act fast      | Deep — understand       |
| Decisions         | 3 prioritized actions   | Trend comprehension     |
| Session target    | 90 seconds              | Deliberate review       |

---

## Dashboard Content Domains

| Domain               | What it shows                                            |
|----------------------|----------------------------------------------------------|
| Academy Health       | Attendance, completion, and progression rates aggregate  |
| Player Progress      | Cohort movement through curriculum levels over time      |
| Coach Performance    | Session load, completion quality, attendance reliability |
| Curriculum Execution | Which phases are being run vs. planned                   |
| Session Volume       | Sessions per week/month by type, coach, and group        |
| Approval Velocity    | Pending vs. resolved approvals over time                 |
| Retention Indicators | At-risk players identified by DONNA signal patterns      |
| DONNA Confidence     | How reliable DONNA's recommendations have been           |

---

## Relationship to DONNA

DONNA's Today surface is validated by Dashboard. If DONNA says "Player
progression needs your attention," Dashboard shows the progression cohort
chart that proves it.

Dashboard does not contain DONNA output — it contains the data that
DONNA's reasoning is built from.

---

## Implementation Note (Phase B)

New page at src/app/director/dashboard/page.tsx.

The existing /director/kpi/page.tsx should be audited for reusable
components (DirectorKpiHealthSection and related) before the redirect
is added. The dashboard page may reuse those components rather than
rebuilding from scratch.

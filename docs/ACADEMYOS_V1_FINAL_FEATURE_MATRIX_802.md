# Sprint 802 — AcademyOS V1 Final Feature Matrix

**Date:** 2026-05-18
**Sprint:** 802

---

## AcademyOS V1 — Complete feature matrix

### Director Portal (`/director`)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard overview | ✅ Live | KPI cards, session timeline, alerts |
| Academy health view | ✅ Live | Enrolment, stage distribution, programme load |
| Player browser | ✅ Live | Full roster with search and filter |
| Player profile (full) | ✅ Live | 5 tabs: overview, sessions, assessments, plans, notes |
| Player placement flow | ✅ Live | `finalize_player_placement()` — only activation path |
| Parent preview (read-only) | ✅ Live | `/director/players/[id]/parent-preview` |
| Voice intake (DONNA) | ✅ Live | Voice creates → proposed_actions → review queue |
| Review queue | ✅ Live | Approve / reject proposed actions |
| Session attendance | ✅ Live | Director session view |
| Coach notes browser | ✅ Live | Cross-player notes view |
| Curriculum home | ✅ Live | Welcome panel, quick links |
| Curriculum map | ✅ Live | All levels, stages, sufficiency dots |
| Guided curriculum review | ✅ Live | Step-through review |
| Curriculum level builder | ✅ Live | 5 tabs; DONNA draft UI |
| Demo sandbox | ✅ Live | Isolated demo mode with `[DEMO]` prefix data |
| Demo script panel | ✅ Live | Collapsible in-app script panel |

### Coach Portal (`/coach`)

| Feature | Status | Notes |
|---------|--------|-------|
| Session view | ✅ Live | Today's sessions, player list |
| Session wrap-up (DONNA) | ✅ Live | Voice → structured wrap-up → proposed_actions |
| Player profile (scoped) | ✅ Live | Coach-appropriate view, no billing/admin data |
| Attendance marking | ✅ Live | Via session wrap-up, not direct DB write |
| Coach notes | ✅ Live | Per-player, per-session |
| Assessment input | ✅ Live | Score entry → proposed_actions for director review |

### Player Portal (`/player`)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | ✅ Live | Level, recent sessions, next steps |
| Development profile | ✅ Live | Mission, skills, goals |
| Session history | ✅ Live | Attendance and coach notes visible to player |
| Assessment history | ✅ Live | Gate results, scores |

### Parent Portal (`/parent`)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | ✅ Live | Child's level, recent activity |
| Development profile (read-only) | ✅ Live | Scoped view of player data |
| Session attendance summary | ✅ Live | Attendance record |
| Notes from coach | ✅ Live | Approved coach notes only |

---

## What is NOT in V1

| Feature | Decision | Path |
|---------|----------|------|
| In-house match entry | Not built | UTR display is live; match entry is V2 |
| Angles integration | Not built | V2+ — external tool |
| Push notifications | Not built | V2 — requires notification pipeline |
| Parent direct messaging | Not built | V2 — requires comms layer |
| Cohort comparison / benchmarks | Not built | V2 — requires sufficient data volume |
| DONNA draft → proposed_actions write (curriculum) | V1 UI shell | V2 — wiring approved for next block |
| Automated level movement | Never automatic | Always requires `finalize_player_placement()` human approval |

---

## Safety architecture — confirmed intact in V1

- Voice: DONNA proposes → director approves → `execute_approved_action()` applies
- Placement: only via `finalize_player_placement()`
- Curriculum: drafts only, no DB write in V1
- Demo: `assertNotPreviewMode()` blocks all mutations in demo mode
- RLS: all tables have RLS policies
- Audit: all major mutations write to `audit_logs`

# Workflow Friction Heatmap

**Sprint:** Mega Sprint 1166-1185
**Date:** 2026-06-02
**Method:** Code review + architecture audit (pre-pilot)

---

## Severity Definitions

| Level | Meaning |
|---|---|
| **BLOCKER** | Cannot complete the workflow without developer intervention |
| **HIGH** | Workflow completes but with significant confusion or extra steps |
| **MEDIUM** | Minor friction — user can figure it out but shouldn't have to |
| **LOW** | Polish issue — won't affect pilot success |

---

## Critical Blockers (Fixed in Sprint 1166)

| # | Workflow | Role | Page | Friction | Fix |
|---|---|---|---|---|---|
| 1 | Invite coach | Director | /director/coaches | No UI form — server action existed but was unreachable from the app | ✅ Fixed: InviteCoachForm added |
| 2 | Add parent/guardian | Director | /director/parents | No UI form — server action existed but was unreachable | ✅ Fixed: AddGuardianForm added |

---

## High Friction (Pre-Pilot Workarounds Available)

| # | Workflow | Role | Page | Friction | Workaround | Status |
|---|---|---|---|---|---|---|
| 3 | View blueprint | Director | Player Profile → Blueprint tab | Tab works but shows empty state if migration 078 not applied | Apply migration 078 | Pending DB migration |
| 4 | View missions | Director | Player Profile → Missions tab | Tab works but shows empty state if migration 076 not applied | Apply migration 076 | Pending DB migration |
| 5 | DONNA placement recommendation | Director | Player Profile | Recommendation not stored if migration 080 not applied | Apply migration 080 | Pending DB migration |
| 6 | Parent portal — first login | Parent | /parent | Parent must have account AND guardian record AND player_guardians link to see data | Director must run AddGuardianForm AND parent must create account | AddGuardianForm now available |
| 7 | Coach invitation requires existing account | Director | /director/coaches | Coach must create account before director can invite | Share login URL with coach first | By design for V1 |

---

## Medium Friction

| # | Workflow | Role | Page | Friction | Priority |
|---|---|---|---|---|---|
| 8 | Blueprint generation | Director | Placement | Blueprint only auto-generates if migration 078 applied + placement completes | Apply migration |
| 9 | Player missions not visible in portal | Player | /player | `PlayerAssignedMissionsSection` returns null if migration 076 not applied | Apply migration |
| 10 | DONNA command bar not on all pages | Director | Sessions, Curriculum | Sessions and curriculum pages don't have DonnaCommandSection yet | Add in next sprint |
| 11 | Friction report button not surfaced | All roles | All | `reportFrictionAction` exists but no visible button | Sprint 1111 backlog |
| 12 | Assessment event UI (reassessment form) | Director | Player Profile → Assessments | CTA placeholder exists but no form to enter scores | Sprint backlog |
| 13 | "Start Reassessment" has no modal | Director | Assessments tab | Button-like element exists but no form | Sprint backlog |

---

## Low Friction

| # | Friction | Notes |
|---|---|---|
| 14 | Player profile has 9 tabs | Tabs visible but grouped. Constitution hero simplifies default view. |
| 15 | Development KPIs section still visible | Wrapped in CollapsedDetailSection but starts expanded on some builds |
| 16 | DONNA analytics page not in nav | Accessible at /director/donna-analytics but no nav link |
| 17 | Coach player brief exists but no display surface in coach session | `CoachPlayerBriefCard` built, not yet wired to coach session pages |

---

## Friction by Role

### Director
- 2 blockers fixed (coach invite + parent form)
- 5 medium friction items (mostly pending migrations)
- Core workflow path is clear and functional

### Coach
- Core workflow clear: Home → Session → Attendance → Quick Capture → Wrap-Up
- Coach player brief exists but not yet shown in session view
- No director-only data shown — safe

### Parent
- Portal works once guardian record + account exist
- Parent development plan shows correctly when `show_to_parent = true`
- Adding guardian now possible via UI form

### Player
- Mission portal works when migration 076 applied
- Encouraging language and "today's action" generated correctly
- Mobile layout appropriate

---

## Pilot Day Friction Mitigation Plan

1. **Before pilot:** Apply migrations 076–080 to live Supabase
2. **Before pilot:** Create test players, coaches, and guardian records
3. **Day of pilot:** Director invites coach via /director/coaches InviteCoachForm
4. **Day of pilot:** Director adds guardian via /director/parents AddGuardianForm
5. **During pilot:** Use friction capture docs for verbal feedback
6. **Post-pilot:** Review friction_reports table (if migration 077 applied)

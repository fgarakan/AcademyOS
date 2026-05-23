# Brian Dabul Demo Seed Data — Sprint 676

**Date:** 2026-05-23
**Scope:** Fictional seed data for the Brian Dabul demo session. No real private child data. No auto-run. This is a reference document only — the actual seed SQL is not executed by this sprint.
**Audience:** Director demonstrating AcademyOS to Brian Dabul (prospective pilot academy director).
**Golden thread:** Academy Director "Alex Monteiro" walks Brian through the full system using fictional players and coaches.

---

## Important Constraints

- All names are fictional. No real children's data.
- No real parent contact information.
- All data should look plausible for a 12–18 player tennis academy.
- This document describes the seed state; it is NOT an auto-run SQL script.
- Actual SQL execution requires explicit manual approval per the Sprint 398 migration packet protocol.

---

## Academy Identity

| Field | Value |
|---|---|
| Academy name | Monteiro Tennis Academy |
| Slug | `monteiro-tennis` |
| Country | US |
| Timezone | `America/Chicago` |
| Director | Alex Monteiro (`alex@monteirotennis.com`) |

---

## Coaches (3)

| Name | Role | Groups |
|---|---|---|
| Coach Priya Sharma | head_coach | Advanced, Intermediate |
| Coach David Chen | coach | Intermediate, Beginner |
| Coach Lena Vogel | coach | Beginner |

---

## Curriculum Levels (5)

| Level | Display Name | Stage |
|---|---|---|
| Level 1 | Foundation | beginner |
| Level 2 | Building | beginner |
| Level 3 | Developing | intermediate |
| Level 4 | Competitive | intermediate |
| Level 5 | Elite | advanced |

---

## Groups (3)

| Group | Coach | Level Range | Players |
|---|---|---|---|
| Advanced | Coach Priya | Level 4–5 | 4 players |
| Intermediate | Coach Priya / David | Level 3 | 5 players |
| Beginner | Coach David / Lena | Level 1–2 | 6 players |

---

## Players (15 fictional)

All players are fictional. DOB is approximate age-appropriate.

### Advanced Group (Level 4–5)

| Name | Level | Notes |
|---|---|---|
| Marcus Rivera | Level 4 | Advancement-eligible — serve mechanics strong |
| Sofia Nakamura | Level 5 | Academy's current top player |
| James Whitfield | Level 4 | Attendance concern (3 absences this month) |
| Amara Osei | Level 4 | Reassessment pending |

### Intermediate Group (Level 3)

| Name | Level | Notes |
|---|---|---|
| Liam Petrov | Level 3 | Gap signal: forehand consistency stalled |
| Chloe Martinez | Level 3 | Strong progress — near Level 4 threshold |
| Noah Andersen | Level 3 | New to academy (4 weeks) |
| Isabelle Fontaine | Level 3 | Active parent engagement |
| Raj Krishnan | Level 3 | Missed last assessment |

### Beginner Group (Level 1–2)

| Name | Level | Notes |
|---|---|---|
| Emma Torres | Level 2 | Ready to move to Intermediate |
| Finn O'Brien | Level 1 | First month — still onboarding |
| Zara Ahmed | Level 2 | Parental concern flagged by coach |
| Miles Cooper | Level 1 | Placement pending |
| Leila Hassan | Level 2 | Strong attitude — coachability noted |
| Sam Park | Level 1 | Pending placement assessment |

---

## Demo State — Review Queue (5 items)

These proposed actions should be in `pending_review` status for the demo:

| # | Type | Player | Proposed by | Description |
|---|---|---|---|---|
| 1 | `session_recap_v1` | — | Coach Priya | Wednesday Advanced group wrap-up |
| 2 | `attendance_exception_v1` | James Whitfield | Coach Priya | 3rd absence this month — attendance concern flag |
| 3 | `advancement_draft_v1` | Marcus Rivera | Coach Priya | Propose move from Level 4 to Level 5 |
| 4 | `parent_safe_draft_v1` | Zara Ahmed | Coach Lena | Parent-safe update re: development focus |
| 5 | `observation_draft_v1` | Chloe Martinez | Coach David | Session observation — strong backhand improvement |

---

## Demo State — DONNA Attention Signals

These should be surfaced when the director asks DONNA "What needs my attention?":

1. **Review queue:** 5 items waiting for director decision (links to review center)
2. **Attendance concern:** James Whitfield — 3 absences in last 30 days (high risk)
3. **Advancement ready:** Marcus Rivera — meets Level 4→5 gate criteria
4. **Curriculum gap:** Level 3 forehand consistency — 2 players stalled (Liam Petrov, Noah Andersen)
5. **Pending placements:** Sam Park, Miles Cooper — no curriculum level assigned

---

## Demo State — Sessions (3)

| Session | Group | Coach | Date | Status |
|---|---|---|---|---|
| Advanced Wednesday | Advanced | Coach Priya | 2026-05-21 (past) | Needs wrap-up |
| Intermediate Thursday | Intermediate | Coach David | 2026-05-22 (past) | Wrapped up |
| Beginner Friday | Beginner | Coach Lena | 2026-05-23 (today) | Planned |

---

## Demo State — Parent Portal (Isabelle Fontaine's parent)

The parent demo should show:
- Child: Isabelle Fontaine
- Level: Level 3 — Developing
- Group: Intermediate
- Attendance: 8/10 sessions present
- Parent-visible development summary: "Isabelle has been working on serve mechanics and footwork. Her consistency has improved significantly over the past 4 weeks."
- Parent-safe priorities: 1 active priority (serve consistency)

---

## Demo State — Player Portal (Emma Torres)

The player demo should show:
- Level: Level 2 — Building
- Next level: Level 3 — Developing
- Active gates: 2 open (backhand cross-court threshold, footwork consistency)
- Attendance: 9/10 sessions present
- Badge: "Consistent Attendee" — earned
- Mission copy: "Keep working on your backhand cross-court. You're 70% of the way to Level 3."

---

## Seed Execution Notes

**Do NOT execute this seed data without:**
1. Explicit director approval that the demo environment is ready
2. Confirmation that no real student data exists in the target environment
3. Review of the seed SQL by the director before execution

**Execution order (if approved):**
1. Create academy record
2. Create curriculum levels
3. Create director + coach profiles + academy_memberships
4. Create groups + coach_group_assignments
5. Create players + player_curriculum_states
6. Create sessions
7. Create session_attendance
8. Create coach_observations
9. Create proposed_actions (review queue items)
10. Create player_development_summary (with show_to_parent = true for Isabelle)
11. Create player_priorities

**Migration dependency:** This seed data assumes migrations 001–038 have been applied. Do not execute on a fresh database without verifying migration state.

---

## Demo Script Reference

The demo script narrative is in `docs/BRIAN_VOICE_DEMO_SCRIPT.md`.
This document provides the data state — the demo script provides the walkthrough narrative.

The golden path for the Brian demo is:
1. Director login → Director dashboard shows live DONNA attention signals
2. DONNA voice command: "What needs my attention today?"
3. Review queue walkthrough (5 items)
4. Approve Marcus Rivera advancement proposal
5. View player profile (Marcus Rivera)
6. Switch to coach portal preview (Coach Priya view)
7. Switch to parent portal preview (Isabelle's parent view)
8. Switch to player portal preview (Emma Torres view)
9. DONNA wrap-up summary command

# Sprint 794 — Curriculum Builder DONNA Boundary QA V1

**Date:** 2026-05-18
**Sprint:** 794

---

## DONNA boundary audit — curriculum builder

### Hard rules being tested

1. DONNA may only propose — never mutate directly
2. All DONNA proposals require director approval before any effect
3. DONNA cannot move players
4. DONNA cannot override coach decisions
5. DONNA drafts are labelled at point of creation

---

## Test results

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| DONNA Add Drill Draft — submit | Creates draft, shows success state, no DB write | ✅ Shows success message; no server action called | ✅ |
| DONNA Add Gate Draft — submit | Creates draft, shows success state, no DB write | ✅ Shows success message; no server action called | ✅ |
| DONNA Add Fitness Draft — submit | Creates draft, shows success state, no DB write | ✅ Shows success message; no server action called | ✅ |
| DONNA draft success copy | Must say "check Review Queue" + "nothing applied until you approve" | ✅ All three components match | ✅ |
| Safety disclosure — curriculum builder | Must warn DONNA cannot move players | ✅ `DonnaSafetyDisclosure context="curriculum_builder"` | ✅ |
| Safety disclosure — level edit | Must warn drafts don't affect coaches/players | ✅ `DonnaSafetyDisclosure context="level_edit"` | ✅ |
| DONNA context panel | Must not claim live session data | ✅ Orange alert: "DONNA cannot see player session history here" | ✅ |
| Min characters on draft | Prevents low-quality prompts | ✅ 20-char minimum; helper text shown below threshold | ✅ |

## Boundary classification

| Action | Who can do it | DONNA boundary |
|--------|---------------|----------------|
| Draft a drill | DONNA (propose) | ✅ Propose only |
| Approve a drill draft | Director only | ✅ Not accessible to DONNA |
| Apply approved changes | `execute_approved_action()` | ✅ No DONNA involvement |
| Move a player | `finalize_player_placement()` | ✅ DONNA cannot trigger |
| Delete curriculum content | Director only via admin tools | ✅ Not in DONNA builder |

## V2 wiring plan (not in V1)

When `DonnaAddDrillDraft` is wired to `proposed_actions`:
- Server action must call `assertNotPreviewMode()` before any insert
- Must insert into `proposed_actions` with `source = 'donna'`, `status = 'pending_review'`
- Must write to `audit_logs`
- Must NOT auto-approve

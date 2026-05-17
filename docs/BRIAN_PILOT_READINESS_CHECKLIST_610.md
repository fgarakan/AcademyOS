# Brian Academy Pilot Readiness Checklist — Sprint 610

**Date:** 2026-05-17
**Sprint:** 610 — Brian Academy Pilot Readiness Checklist V1

---

## Purpose

Structured pre-pilot checklist for the Brian Academy OS deployment.

---

## 1. Data Readiness

| Item | Status | Notes |
|---|---|---|
| Player roster imported | ⬜ | CSV at `data/player-import/academy_os_player_import_roster.csv` |
| Coaches created in system | ⬜ | Check `academy_memberships` |
| Program templates configured | ⬜ | At least 1 template per level |
| Session blocks defined | ⬜ | Minimum viable curriculum |
| Level gates configured | ⬜ | `/director/onboarding/level-gates/` |
| Academy settings set | ⬜ | Name, timezone, contact |

---

## 2. Auth and Role Verification

| Item | Status | Notes |
|---|---|---|
| Director account created | ⬜ | `academy_director` role |
| At least 1 coach account | ⬜ | `coach` role |
| Role routing verified | ⬜ | Director → `/director`, Coach → `/coach` |
| Supabase Auth email confirmed | ⬜ | Test login flow |
| RLS policies active | ⬜ | No data leaks between academies |

---

## 3. Core Flow Verification

| Flow | Status | Notes |
|---|---|---|
| Director can see review queue | ⬜ | `/director/review` |
| Coach can start wrap-up | ⬜ | `/coach/sessions/[sessionId]` |
| Voice dictation works in browser | ⬜ | Chrome recommended (Web Speech API) |
| DONNA command flow routes correctly | ⬜ | Test attendance + observation paths |
| Attendance exception creates proposed_action | ⬜ | Check DB after test |
| Director can approve and apply | ⬜ | `applyApprovedSessionActualAction` |
| Audit log entries written | ⬜ | Check `audit_logs` table |

---

## 4. Safety Verification (Pre-Pilot)

| Safety Check | Status |
|---|---|
| No automatic level movement | ⬜ |
| No parent message auto-send | ⬜ |
| No template block mutation | ⬜ |
| Director approval required for all writes | ⬜ |
| DONNA cannot bypass proposed_actions | ⬜ |
| `execute_approved_action` gated by approved status | ⬜ |

---

## 5. UI / UX Verification

| Item | Status | Notes |
|---|---|---|
| Dark theme renders correctly | ⬜ | Test on target device/browser |
| Lime accent visible | ⬜ | Check tokens |
| Mobile coach view usable | ⬜ | `/coach` on phone/tablet |
| Director sidebar renders on desktop | ⬜ | 1280px+ |
| DONNA panel opens and closes | ⬜ | Test on command center |

---

## 6. Pilot Demo Readiness

| Item | Status | Notes |
|---|---|---|
| Demo script reviewed | ⬜ | `PILOT_DEMO_SCRIPT_V2_609.md` |
| Demo dataset loaded | ⬜ | At least 3 players, 2 sessions |
| Demo walk-through rehearsed | ⬜ | 30-minute flow |
| Q&A answers prepared | ⬜ | Parent send, level change, wrong data |

---

## 7. Known Gaps Acceptable for Pilot

These gaps are documented and do NOT block the pilot:

| Gap | Acceptable? | Sprint |
|---|---|---|
| Override effect preview | ✅ Yes — Sprint 586 built | 586 |
| Rollback preview | ✅ Yes — Sprint 587 built | 587 |
| Full NBA action wiring | ✅ Yes — panel shows data, links navigate | 601–602 |
| Intent classifier uses keyword matching only | ✅ Yes — AI classifier future sprint | 592 |
| Parent message send blocked | ✅ Yes — by design | All |
| Weekly brief not auto-generated | ✅ Yes — requires pre-fetched context | 600 |

---

## Go / No-Go

| Gate | Status |
|---|---|
| All auth flows work | ⬜ |
| At least 1 end-to-end flow verified | ⬜ |
| No critical TypeScript errors | ⬜ |
| Safety rules confirmed by director | ⬜ |
| Demo rehearsed | ⬜ |

**Status:** ⬜ NOT YET READY — complete checklist above before pilot.

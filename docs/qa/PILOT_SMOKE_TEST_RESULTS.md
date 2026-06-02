# Pilot Smoke Test Results

**Sprint:** Post-Migration Verification + Pilot Smoke Test
**Date:** 2026-06-02 (template — fill in after live run)
**Tester:** [Brian / dev team]
**Environment:** Live Supabase — Dabul Tennis Academy

---

## Pre-Test Setup

- [ ] Migrations 076–080 applied to live DB
- [ ] At least 1 active player exists
- [ ] At least 1 coach account linked
- [ ] At least 1 guardian linked to player
- [ ] Parent account exists and is linked to guardian
- [ ] Player account exists and profile_id is linked

---

## Migration Smoke Test Results

Run via `/director/migration-verify` → Step 2 — Write Smoke Test.

| Table | Status | Notes |
|---|---|---|
| player_mission_assignments | [ ] PASS / [ ] FAIL | |
| friction_reports | [ ] PASS / [ ] FAIL | |
| player_development_blueprints | [ ] PASS / [ ] FAIL | |
| assessment_events | [ ] PASS / [ ] FAIL | |
| donna_placement_recommendations | [ ] PASS / [ ] FAIL | |

---

## DONNA Question Test Results

Run via `/director/migration-verify` → Step 3 — DONNA Question Test.

| Question | Intent Classified | Confidence | Answer Quality | Status |
|---|---|---|---|---|
| "Who needs attention today?" | | | | |
| "Who needs reassessment?" | | | | |
| "What should I do first?" | | | | |
| "Which parent updates need approval?" | | | | |
| "Which players are stalled?" | | | | |

---

## App Flow Smoke Tests

### Director Flows

#### 1. Player creation
- [ ] Navigate to `/director/players/new`
- [ ] Fill in first name, last name, date of birth
- [ ] Submit
- [ ] Player appears in list with `status = pending_placement`
- [ ] Audit log entry `player_created` exists

#### 2. Coach invitation
- [ ] Navigate to `/director/coaches`
- [ ] Enter coach email + role = coach
- [ ] Submit InviteCoachForm
- [ ] Result shows `linked` or `no_account` (expected outcomes)
- [ ] If linked: `academy_memberships` row appears in Supabase dashboard

#### 3. Guardian creation
- [ ] Navigate to `/director/parents`
- [ ] Fill in AddGuardianForm with parent name + email + player
- [ ] Submit
- [ ] Result shows `created_and_linked` or `duplicate`
- [ ] Guardian row appears in Supabase `guardians` table
- [ ] `player_guardians` row created

#### 4. Blueprint generation
- [ ] Activate a player via placement flow
- [ ] Verify `player_development_blueprints` row created automatically
- [ ] Open player profile → Blueprint tab shows priorities and 30-day plan
- [ ] Missions tab shows 3 pending missions

#### 5. Mission approval
- [ ] Open player profile → Missions tab
- [ ] Click "Approve" on a pending mission
- [ ] Mission status changes to `active`
- [ ] Mission appears in player portal (if player account linked)

#### 6. Parent update approval
- [ ] Create parent communication draft via DONNA
- [ ] Approve in review queue
- [ ] Click "Apply" (applyParentCommunicationAction)
- [ ] Parent portal `/parent/updates` shows the update
- [ ] `parent_updates.status = approved`
- [ ] `player_development_summary.show_to_parent = true`

#### 7. Quick Capture
- [ ] Open Quick Capture from coach portal
- [ ] Submit a note
- [ ] `voice_notes` row appears with `academy_id` = correct academy (not cross-academy)
- [ ] Appears in director Review Queue

#### 8. Wrap-Up flow
- [ ] Coach submits wrap-up from session
- [ ] `proposed_actions` row created with `status = pending_review`
- [ ] Director sees it in Review Queue
- [ ] Director approves
- [ ] Session `status = completed`
- [ ] Audit log written

### Coach Flows

#### 9. Coach home
- [ ] Coach logs in and sees `/coach`
- [ ] DONNA brief shows today's session info
- [ ] No director-only content visible (no parent comms, no KPIs)

#### 10. Session wrap-up
- [ ] Coach opens session → Session Detail
- [ ] Marks attendance
- [ ] Submits wrap-up via wrap-up drawer
- [ ] Wrap-up appears in director Review Queue

### Parent Flows

#### 11. Parent portal
- [ ] Parent logs in and sees `/parent`
- [ ] Child's name and level visible
- [ ] Current focus visible (if development summary approved)
- [ ] No raw assessment scores visible
- [ ] No coach internal notes visible

#### 12. Parent development page
- [ ] Navigate to `/parent/development`
- [ ] "Current Focus" section visible (if show_to_parent = true)
- [ ] "Why This Matters" section visible
- [ ] "What Helps At Home" section visible
- [ ] No internal data leaked

### Player Flows

#### 13. Player portal
- [ ] Player logs in and sees `/player`
- [ ] Current level visible
- [ ] Active missions visible (if migration 076 applied + missions assigned)
- [ ] "Today's Action" text generated for primary mission
- [ ] No raw scores visible
- [ ] Encouraging language throughout

---

## Role Safety Confirmation

| Check | Result | Notes |
|---|---|---|
| Parent cannot see coach notes | [ ] PASS / [ ] FAIL | |
| Parent cannot see raw assessment scores | [ ] PASS / [ ] FAIL | |
| Player cannot see director/coach content | [ ] PASS / [ ] FAIL | |
| Coach cannot see parent comms | [ ] PASS / [ ] FAIL | |
| Level movement requires director approval | [ ] PASS / [ ] FAIL | |

---

## DONNA Live Data Test Results

After running DONNA questions with a real player loaded:

| DONNA Question | Uses Real Data | Evidence Shown | Status |
|---|---|---|---|
| "Summarize [player name]" | | | |
| "Why is [player] at this level?" | | | |
| "What is blocking [player]'s progress?" | | | |
| "What should the coach focus on?" | | | |
| "What should the parent know?" | | | |

---

## Overall Smoke Test Rating

| Area | Rating | Notes |
|---|---|---|
| Migrations Applied | /5 | |
| Write Smoke Tests | /5 | |
| DONNA Questions | /5 | |
| Director Flows | /8 | |
| Coach Flows | /2 | |
| Parent Flows | /2 | |
| Player Flows | /1 | |
| Role Safety | /5 | |
| **Overall** | **/33** | |

**Go/No-Go for Brian pilot: [ ] GO / [ ] NO-GO**

---

## Issues Found During Smoke Test

| # | Issue | Severity | Page | Fix Required |
|---|---|---|---|---|
| | | | | |

---

## Sign-off

- Smoke test run by: _______________
- Date: _______________
- Migrations applied by: _______________
- Brian notified: [ ] Yes / [ ] No

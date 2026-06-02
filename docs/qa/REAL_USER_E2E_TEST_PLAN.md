# Real-User E2E Test Plan — AcademyOS Pilot V1

**Version:** 2026-06-02
**Target pilot:** Brian Dabul + 1 coach + 2 parents + 2 players
**Environment:** Production Supabase (not local seed — no Supabase seeding required)

---

## How to use this plan

Run flows in order during the pilot kickoff session. For each flow record: Pass/Fail, friction observed, and DB state after. Apply migrations 070/076/077 to the live DB before running flows that depend on them.

---

## Flow 1 — Director completes DNA Shell onboarding

**Prerequisites:** Brian's account exists. Academy created.

**Steps:**
1. Navigate to `/onboarding` (or DNA Shell entry point).
2. Complete all 10 steps (academy basics, coaching philosophy, session design, player development, parent communication, DNA summary, DONNA adjustment, activation).
3. Reach the activation step.

**Expected DB state:** `academies.settings.academyOperatingLens` populated. `audit_logs` entry for `academy_dna_saved`.

**DONNA assertion:** After DONNA cache expires (5 min), DONNA's context summary includes coaching style, development priorities, and parent communication style from the lens.

---

## Flow 2 — Director invites coach

**Prerequisites:** Coach has an existing account (has signed up at `/login`).

**Steps:**
1. Director opens coach management (or calls `inviteCoachAction` directly).
2. Enters coach email + role 'coach'.
3. Submits.

**Expected result:** `academy_memberships` row created for coach. `audit_logs` entry for `coach_invited`.

**Permission assertions:** Director cannot invite themselves (self-invite rejected). Director cannot assign `academy_director` role via this flow. Inactive profile rejected.

---

## Flow 3 — Coach logs in and sees coach portal

**Prerequisites:** Coach membership created (Flow 2).

**Steps:**
1. Coach navigates to app root.
2. Signs in.
3. Should be redirected to `/coach`.

**Expected UI:** Coach portal loads with academy context (sessions, wrap-up prompt, DONNA available). No error pages.

**Permission assertions:** Coach cannot access `/director` routes. Middleware enforces role routing.

---

## Flow 4 — Director creates player

**Prerequisites:** Director is logged in.

**Steps:**
1. Navigate to `/director/players`.
2. Click "Add Player".
3. Enter first name, last name, date of birth.
4. Submit.

**Expected DB state:** New `players` row with `academy_id` = Brian's academy, `status = 'pending_placement'`. `audit_logs` entry for `player_created`.

**Permission assertion:** Coach role cannot create players directly (RLS blocks insert).

---

## Flow 5 — Director creates parent/guardian and links child

**Prerequisites:** Player created (Flow 4). Parent has an existing account OR will create one.

**Steps:**
1. Director calls `addGuardianAction` (or future UI) with parent email and player ID.

**Expected DB state:** `guardians` row created. `player_guardians` link created. If parent has active account: `academy_memberships(parent)` row created. `audit_logs` entry for `guardian_created`.

**Permission assertions:** Max 10 children per guardian enforced. Inactive profile results in `profile_id = null` (guardian created, not linked). Duplicate player links rejected.

**Parent portal test:** Parent logs in → `/parent` route → reads `guardians.profile_id = user.id` → sees linked player.

---

## Flow 6 — Director creates session from template

**Prerequisites:** A class template exists. Coach has active membership.

**Steps:**
1. Navigate to template.
2. Click "Generate Session".
3. Enter date, select coach, submit.

**Expected DB state:** `sessions` row created with `academy_id`, `coach_id`, `template_id`. `session_blocks` rows created. `audit_logs` entry for `session_created_from_template`.

**Permission assertion:** Cross-academy coachId rejected (coach membership checked before insert).

---

## Flow 7 — Coach marks attendance

**Prerequisites:** Session created (Flow 6). Coach is logged in.

**Steps:**
1. Coach opens session.
2. Marks players as attended.
3. Saves attendance.

**Expected DB state:** `session_attendance` rows with correct `player_id` and `session_id`.

**Parent visibility:** Parent can see session attendance for their linked child.

---

## Flow 8 — Coach uses Quick Capture

**Prerequisites:** Coach is logged in.

**Steps:**
1. Coach opens Quick Capture (from CoachOnCourtActionsBar or QuickCaptureButton).
2. Types an observation.
3. Submits.

**Expected DB state:** `voice_notes` row with `academy_id` (server-resolved, not from client), `author_id = coach.id`, `processing_status = 'pending_review'`. `audit_logs` entry for `quick_capture_created`.

**Security assertion:** `academy_id` is server-resolved from `profiles.academy_id`. Coach cannot write to a different academy by supplying a foreign `academy_id`.

---

## Flow 9 — Coach completes wrap-up

**Prerequisites:** Session created. Coach is logged in.

**Steps:**
1. Coach opens session.
2. Submits wrap-up via guided flow.

**Expected DB state:** `voice_commands` row created. `proposed_actions` row with `target_module = 'session_wrap_up_v1'`, `status = 'pending_review'`.

**Director review queue:** Item appears in director's review queue.

---

## Flow 10 — Director reviews and approves wrap-up

**Prerequisites:** Wrap-up in review queue (Flow 9).

**Steps:**
1. Director opens review queue.
2. Reviews wrap-up.
3. Clicks "Approve".
4. Clicks "Apply".

**Expected DB state:** `proposed_actions.status = 'approved'` after step 3. After step 4: `sessions.session_notes` updated, `sessions.status = 'completed'`, `proposed_actions.status = 'executed'`. `audit_logs` entry for review decision and wrap-up application.

**Audit assertions:** `audit_logs` has both `review_decision_approved` and wrap-up apply entries.

---

## Flow 11 — Director creates parent communication draft

**Prerequisites:** Player active. Director is logged in.

**Steps:**
1. Director creates a parent-safe communication draft for the player.
2. Draft enters `proposed_actions` with `target_module = 'parent_communication'`.

**Expected DB state:** `proposed_actions` row with `status = 'draft'` or `'pending_review'`.

**Safety assertion:** Raw coach notes are never in `proposed_payload`.

---

## Flow 12 — Director approves and applies parent communication

**Prerequisites:** Parent comm draft exists (Flow 11) with `status = 'approved'`.

**Steps:**
1. Director approves the proposed action.
2. Director calls `applyParentCommunicationAction(proposedActionId)`.

**Expected DB state:** `parent_updates` row with `status = 'approved'`, `send_method = 'portal_published'`. `player_development_summary.show_to_parent = true` with `parent_summary` updated. `proposed_actions.status = 'executed'`. `audit_logs` entry for `parent_communication_applied` with `delivery_status: 'portal_live'`.

**Parent portal assertion:** Parent logs in → `/parent/updates` → sees development summary. Sees no raw coach notes. No pending/rejected states visible.

---

## Flow 13 — Parent portal visibility check

**Prerequisites:** Guardian linked (Flow 5). Parent communication applied (Flow 12).

**Steps:**
1. Parent logs in.
2. Navigates to `/parent/updates`.

**Expected UI:** Development summary visible. "Only director-approved content appears here" banner shown. No error toasts. No raw coach notes.

**Permission assertions:** Parent can only read their linked player's data. Cannot access other players. Cannot access proposed_actions. Cannot access audit_logs.

---

## Flow 14 — User submits friction report

**Prerequisites:** Migration 077 applied. Any authenticated user.

**Steps:**
1. User encounters confusing UI.
2. Calls `reportFrictionAction` with pagePath, frictionType, severity, comment.

**Expected DB state:** `friction_reports` row with `reporter_id = user.id`, `academy_id` server-resolved, `status = 'open'`.

**Permission assertions:** Cross-academy write rejected (academy_id server-resolved). Non-member cannot insert.

---

## Flow 15 — Director gets DONNA friction summary

**Prerequisites:** At least 2 friction reports with `status = 'open'`. Director logged in.

**Steps:**
1. Director calls `donnaFrictionSummaryAction()`.

**Expected result:** `{ ok: true, totalOpen: N, blockerCount: N, topTypes: [...], summaryText: "..." }`.

**Permission assertion:** Coach calling this action directly returns an error.

---

## Flow 16 — Full pilot loop (end-to-end chain)

Run Flows 4 → 5 → 6 → 7 → 9 → 10 → 12 → 13 in sequence as a complete verification.

**End state assertions:**
- Player active with level assigned
- Session recorded
- Coach wrap-up applied
- Parent portal shows approved development update
- `audit_logs` has full chain: player_created → session_created → session_wrapped → review_decision_approved → parent_communication_applied
- No cross-role data leakage at any step

---

## DB verification queries

```sql
-- Latest audit log entries
SELECT action, actor_id, target_type, target_id, created_at
FROM audit_logs WHERE academy_id = ':academyId'
ORDER BY created_at DESC LIMIT 20;

-- Open friction reports
SELECT id, reporter_role, friction_type, severity, status
FROM friction_reports WHERE academy_id = ':academyId' AND status = 'open';

-- Review queue
SELECT id, target_module, status, created_at
FROM proposed_actions WHERE academy_id = ':academyId' AND status = 'pending_review';

-- Parent updates visible to parent
SELECT id, status, send_method, sent_at, content
FROM parent_updates WHERE player_id = ':playerId' AND status = 'approved';
```

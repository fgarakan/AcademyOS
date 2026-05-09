# Pilot Placement Flow — QA Guide

This guide covers the complete director-led placement pipeline for an unexpected attendee (a player who showed up at a session but isn't on the roster). Follow each step in order. SQL verification queries are included for each stage.

---

## Overview of the Pipeline

```
Coach wrap-up → Unexpected attendee captured
  ↓
Attendance Exception Draft (proposed_actions: attendance_exception)
  ↓  [Director applies exception]
Placement Review (proposed_actions: placement_review)
  ↓  [Director: Start Placement Intake]
Intake Candidate (proposed_actions: placement_intake_candidate)
  ↓  [Director: Start Placement Assessment]
Assessment Draft (proposed_actions: placement_assessment_draft)
  ↓  [Director: Save + Generate Recommendation]
Recommendation Draft (proposed_actions: placement_recommendation_draft)
  ↓  [Director: Approve / Override]
✅  Sprint 168 — Director clicks "Create Player Profile" → player activated
```

**At every stage: no player record, no roster change, no billing, no parent comms.**

---

## Step 1 — Coach Flags an Unexpected Attendee

**Path:** Coach → Session → Session Wrap-Up → Unexpected Attendees

**What happens:**
- Coach enters the attendee's name and reason in the wrap-up
- On submission, a `session_wrap_up_v1` proposed_actions row is created (or updated)
- The unexpected attendee is embedded in the wrap-up payload under `unexpected_attendees[]`

**SQL verification:**
```sql
-- Check for pending wrap-up drafts
SELECT id, status, proposed_payload->>'draft_type', created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'session_wrap_up_v1'
  AND status IN ('pending_review', 'approved')
ORDER BY created_at DESC
LIMIT 5;
```

---

## Step 2 — Director Reviews Attendance Exception

**Path:** Director → Review Queue → Attendance tab

**What happens:**
- Director sees the wrap-up draft; approves it
- Director applies the approved draft via "Apply" button
- Applying creates one `attendance_exception` proposed_actions row per unexpected attendee
- Applying also writes `session_attendance` rows for rostered players with their statuses

**SQL verification:**
```sql
-- Check for placement_review items created from attendance exception apply
SELECT id, status, proposed_payload->>'attendee_name', proposed_payload->>'reason', created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_review'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Step 3 — Director Decides on Placement Review

**Path:** Director → Review Queue → Placement Review tab

**Three actions available:**
- **Start Placement Intake** — creates `placement_intake_candidate_v1` row, marks review as `executed`
- **Follow-Up Later** — sets status to `clarification_needed`, moves to Follow-Up Later section
- **Not a Fit / Dismiss** — marks as `executed`, no further action

**SQL verification (after Start Placement Intake):**
```sql
-- Confirm intake candidate was created
SELECT id, status, proposed_payload->>'attendee_name', proposed_payload->>'draft_type', created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_intake_candidate'
  AND status = 'pending_review'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm original review was marked executed
SELECT id, status, proposed_payload->>'attendee_name'
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_review'
  AND status = 'executed'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm audit log entry
SELECT action, payload, created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action = 'placement_review.intake_started'
ORDER BY created_at DESC
LIMIT 3;
```

---

## Step 4 — Director Starts Placement Assessment

**Path:** Director → Review Queue → Intake Candidates tab → "Start Placement Assessment"

**What happens:**
- `placement_intake_candidate` row marked as `executed`
- New `placement_assessment_draft_v1` proposed_actions row created with empty fields

**SQL verification:**
```sql
-- Confirm assessment draft was created
SELECT id, status, proposed_payload->>'attendee_name', created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_assessment_draft'
  AND status = 'pending_review'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm audit log entry
SELECT action, payload, created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action = 'placement_intake_candidate.assessment_started'
ORDER BY created_at DESC
LIMIT 3;
```

---

## Step 5 — Director Completes Assessment Fields

**Path:** Director → Review Queue → Intake Candidates tab → Placement Assessments In Progress → fill in form → "Save Assessment Draft"

**Fields:**
- Age Band (6–8 through 18+)
- Ball Color (Red / Orange / Green / Yellow)
- Skill Observations (free text)
- Movement Observations (free text)
- Competitive Readiness (free text)
- Recommended Next Step (free text)

**SQL verification:**
```sql
-- Check saved assessment fields
SELECT
  proposed_payload->>'attendee_name' AS name,
  proposed_payload->>'age_band' AS age_band,
  proposed_payload->>'ball_color' AS ball_color,
  proposed_payload->>'skill_observations' AS skills,
  proposed_payload->>'confidence' AS confidence
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_assessment_draft'
ORDER BY created_at DESC
LIMIT 3;
```

---

## Step 6 — Director Generates Placement Recommendation

**Path:** Director → Review Queue → Intake Candidates → Placement Assessments In Progress → "Generate Placement Recommendation"

**What happens (deterministic, no AI):**
- `current_level` derived from ball_color (Red=Beginner, Orange=Intermediate, Green=Advanced Intermediate, Yellow=Advanced)
- `starting_pathway` derived from ball_color + age_band
- `first_skill_priority` derived from keyword scan of skill_observations
- `suggested_group_type` derived from keyword scan of competitive_readiness
- `confidence` = high (all 6 fields filled) / medium (3-4 filled) / low (0-2 filled)
- Assessment draft marked `executed`; recommendation draft created with `status: 'pending_review'`

**SQL verification:**
```sql
-- Check recommendation draft
SELECT
  proposed_payload->>'attendee_name' AS name,
  proposed_payload->>'current_level' AS level,
  proposed_payload->>'starting_pathway' AS pathway,
  proposed_payload->>'suggested_group_type' AS group_type,
  proposed_payload->>'first_skill_priority' AS skill_priority,
  proposed_payload->>'confidence' AS confidence,
  status,
  created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_recommendation_draft'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm audit log entry
SELECT action, payload->>'confidence', created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action = 'placement_assessment_draft.recommendation_generated'
ORDER BY created_at DESC
LIMIT 3;
```

---

## Step 7 — Director Reviews and Approves Recommendation

**Path:** Director → Review Queue → Intake Candidates → Placement Recommendations → "Approve Recommendation"

**Three actions:**
- **Approve** — sets status to `approved`, writes audit log
- **Override and Approve** — edits fields, sets `director_overridden: true`, status to `approved`
- **Reject** — sets status to `rejected`

**SQL verification:**
```sql
-- Check recommendation status after approval
SELECT id, status, proposed_payload->>'attendee_name', proposed_payload->>'confidence', updated_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_recommendation_draft'
  AND status IN ('approved', 'rejected')
ORDER BY updated_at DESC
LIMIT 5;

-- Confirm audit log
SELECT action, payload->>'attendee_name', created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action IN (
    'placement_recommendation_draft.approved',
    'placement_recommendation_draft.rejected',
    'placement_recommendation_draft.overridden_and_approved'
  )
ORDER BY created_at DESC
LIMIT 5;
```

---

## Step 8 — Director Creates Player Profile (Sprint 168)

**Path:** Director → Review Queue → Intake Candidates → Placement Recommendations → "Create Player Profile"

**Prerequisites (all must be true before the button appears):**
- Recommendation draft `status = 'approved'`
- `player_identity` present in payload (first_name, last_name, date_of_birth)
- `recommended_group_id` present in payload (UUID of an active group)

**What happens:**
1. `players` row inserted (`status = 'pending_placement'`)
2. `created_player_id` written to `proposed_actions.proposed_payload` (idempotency stamp)
3. `placement_recommendations` row inserted (`status = 'approved'`)
4. `finalize_player_placement(rec_id, activator_id)` called — activates player, creates group membership
5. `proposed_actions` row marked `status = 'executed'`
6. Audit log written: `action = 'placement_recommendation.player_created'`

**SQL verification:**
```sql
-- Confirm player was created and activated
SELECT id, first_name, last_name, status, created_at
FROM players
WHERE academy_id = '<your-academy-id>'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm placement_recommendations row
SELECT id, player_id, recommended_group_id, status, approved_at
FROM placement_recommendations
WHERE academy_id = '<your-academy-id>'
ORDER BY created_at DESC
LIMIT 5;

-- Confirm proposed_action executed and contains player ID
SELECT id, status, proposed_payload->>'created_player_id', proposed_payload->>'finalized_at'
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_recommendation_draft'
  AND status = 'executed'
ORDER BY updated_at DESC
LIMIT 5;

-- Confirm audit log
SELECT action, payload->>'player_id', payload->>'group_name', created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action = 'placement_recommendation.player_created'
ORDER BY created_at DESC
LIMIT 3;
```

---

## Step 9 — Verify Post-Placement Outcome (Sprint 169)

**Path:** After clicking "Create Player Profile" in the review queue, verify each record below.

### 9a — Player row

```sql
-- Confirm player was created and activated
SELECT id, first_name, last_name, status, current_group_id, current_level_id,
       last_assessed_at, next_assessment_due, created_at
FROM players
WHERE academy_id = '<your-academy-id>'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- `status = 'active'` — set by `finalize_player_placement()`
- `current_group_id` — UUID of the assigned group
- `current_level_id` — **may be NULL** (Sprint 168 did not populate `recommended_level_id` on the `placement_recommendations` row; assign curriculum level from Skill Path tab)

### 9b — group_memberships row

```sql
-- Confirm group membership was created
SELECT id, player_id, group_id, joined_at, is_current, moved_by
FROM group_memberships
WHERE player_id = '<player-id>'
ORDER BY joined_at DESC
LIMIT 3;
```

**Expected:**
- One row with `is_current = true`
- `group_id` matches the group selected at approval

### 9c — placement_recommendations row

```sql
-- Confirm placement recommendation was activated
SELECT id, player_id, recommended_group_id, status, confidence_score,
       approved_at, activated_at, activated_by
FROM placement_recommendations
WHERE player_id = '<player-id>'
ORDER BY created_at DESC
LIMIT 3;
```

**Expected:**
- `status = 'activated'` — set by `finalize_player_placement()`

### 9d — proposed_action executed

```sql
-- Confirm proposed_action is executed and contains player ID
SELECT id, status,
       proposed_payload->>'created_player_id'     AS created_player_id,
       proposed_payload->>'finalized_at'           AS finalized_at,
       proposed_payload->>'no_parent_portal_created' AS no_portal,
       proposed_payload->>'no_billing_created'     AS no_billing,
       proposed_payload->>'no_parent_communication_sent' AS no_comms
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'placement_recommendation_draft'
  AND status = 'executed'
ORDER BY updated_at DESC
LIMIT 5;
```

**Expected:** `status = 'executed'`, `created_player_id` present, all three no-* flags = true.

### 9e — Audit logs

```sql
-- Confirm both audit log entries exist
SELECT action, target_id, payload->>'group_id' AS group_id, created_at
FROM audit_logs
WHERE academy_id = '<your-academy-id>'
  AND action IN (
    'placement_recommendation.player_created',
    'player.placement.finalized'
  )
ORDER BY created_at DESC
LIMIT 6;
```

**Expected:** Two rows — one from the server action, one from the RPC.

### 9f — Player profile link

- Click "View Player Profile →" in the review card.
- Confirm `/director/players/<player-id>` loads.
- Confirm the **Placement Entry** card is visible in the right sidebar of the Overview tab.
- Confirm group name, activation date, and player status are shown.

### 9g — Review queue cleared

- After execution, the recommendation card **disappears** from the review queue (query filters `status IN ('pending_review', 'approved')`).
- Navigate back to the review queue to confirm it no longer appears.

### 9h — Coach session roster path

Coach sessions pull the roster from `group_memberships WHERE is_current = true AND group_id = session.group_id`.
After `finalize_player_placement()` creates the group_memberships row, the newly placed player will appear naturally in any future session for that group. No code change required.

**To verify manually:**
1. Create or open a session for the assigned group.
2. Confirm the newly placed player appears in the attendance list.

### 9i — Guardrails: records that must NOT exist

```sql
-- Confirm no parent/player portal access was created
-- (profile_id on players must remain NULL until explicitly linked)
SELECT id, first_name, last_name, profile_id
FROM players
WHERE id = '<player-id>';
-- Expect: profile_id = NULL

-- Confirm no billing record
-- (No billing table in current schema — confirmed by absence)

-- Confirm no parent communication
-- (No entries in proposed_actions with target_module = 'parent_communication' for this player)
SELECT COUNT(*)
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND target_module = 'parent_communication'
  AND proposed_payload->>'player_id' = '<player-id>';
-- Expect: 0
```

---

## ⚠️ Sprint 170+ — Remaining Pipeline

**Step 10 — Development Profile Seeding (Sprint 170)**
- Approved recommendation payload written to player's development profile

**Step 11 — Safe Onboarding Draft (Sprint 171)**
- Director-controlled parent/player welcome draft created via proposed_actions
- Never auto-published

---

## Known Limitations

1. **Player creation — RESOLVED (Sprint 168).** After a recommendation is approved, the director clicks "Create Player Profile." This creates the `players` row, `placement_recommendations` row, calls `finalize_player_placement()`, marks the `proposed_actions` row `executed`, and writes the audit log. Idempotency guard: `created_player_id` is written to the payload immediately after player INSERT to prevent duplicates on retry.

2. **Required player fields — RESOLVED (Sprint 168A).** `players.date_of_birth` is `NOT NULL`. The assessment form now collects `first_name`, `last_name`, `date_of_birth`, and `gender`. These are stored in `player_identity` inside the assessment draft payload and carried forward into the recommendation draft payload. Recommendation generation is blocked until all three required fields are saved.

3. **Group assignment — RESOLVED (Sprint 168A).** A real group selector now appears on the recommendation card. Directors must choose an actual academy group (from `groups WHERE is_active = true`) before approving. The server verifies the selected `group_id` belongs to the current academy. The approved payload contains `recommended_group_id` (UUID) and `recommended_group_name`. `finalize_player_placement()` can now consume a valid group UUID from the approved payload.

4. **current_level_id may remain NULL after placement (Sprint 169 documented).** `finalize_player_placement()` sets `current_level_id` from `COALESCE(override_level_id, recommended_level_id)`. Sprint 168's server action does not populate `recommended_level_id` on the `placement_recommendations` row. The player will be active with a group assignment but no curriculum level. Assign the curriculum level from the Skill Path tab in the player profile.

6. **Dismiss does not un-dismiss.** Once a placement review item or intake candidate is dismissed (rejected/executed), it disappears from the queue with no undo path. This is intentional for the pilot.

7. **Follow-Up Later has no expiry.** Items in `clarification_needed` stay there indefinitely. A time-based reminder is not yet implemented.

8. **Assessment confidence is rough.** The confidence metric counts non-empty fields (0-2 = low, 3-4 = medium, 5-6 = high). It does not weight field quality or validate observations for correctness.

9. **Recommendation derivation is keyword-based.** `first_skill_priority` is extracted by keyword scan (e.g., "forehand" → "Forehand groundstroke"). If the coach's note is indirect ("worked on cross-court shots"), the default "General stroke development" applies.

---

## Guardrails Verification Checklist

Before each pilot session, confirm:

- [ ] No player records were created without director approval
- [ ] No roster changes were made without director approval
- [ ] No billing records exist for pilot attendees
- [ ] No parent communications were sent
- [ ] All actions are traceable in `audit_logs`
- [ ] Player records exist only after director explicitly clicks "Create Player Profile" (Sprint 168+)

```sql
-- Quick audit: no unintended player records
SELECT id, first_name, last_name, status, created_at
FROM players
WHERE academy_id = '<your-academy-id>'
  AND status = 'pending_placement'
ORDER BY created_at DESC
LIMIT 10;

-- Quick audit: full pipeline trace for one attendee name
SELECT target_module, status, proposed_payload->>'draft_type', created_at
FROM proposed_actions
WHERE academy_id = '<your-academy-id>'
  AND (
    proposed_payload->>'attendee_name' ILIKE '%<attendee-name>%'
    OR proposed_payload->'assessment_summary'->>'attendee_name' ILIKE '%<attendee-name>%'
  )
ORDER BY created_at ASC;
```

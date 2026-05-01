# Demo Sandbox QA

**Sprint:** 120
**Date:** 2026-05-01

---

## Test Cases

### 1. Demo page loads

**Navigate to:** `/director/demo`

**Expected:**
- Page renders with "Academy OS Demo Tour" heading
- Preview Mode banner visible
- "Demo sandbox not yet created" empty state if no sandbox exists
- `getDemoSandboxStatusAction()` returns successfully

---

### 2. Demo sandbox can be created

**Action:** Click "Create Demo Sandbox"

**Expected:**
- Spinner shows on button
- `createOrResetDemoSandboxAction()` runs
- 6 demo players created (first_name starts with `[DEMO]`)
- 1 demo group created: `[DEMO] Orange 2 Sample Group`
- 1 demo template created: `[DEMO] Orange 2 Direction + Return Start`
- 1 demo session created: `[DEMO] Orange 2 Adaptive Session`
- Result message shows counts
- Page reloads → status updates to show created records
- `audit_logs` entry with `action = 'demo_sandbox_seed'`

---

### 3. Demo players are clearly labeled

**After creation, navigate to:** `/director/players`

**Expected:**
- Players listed with `[DEMO]` in their name
- Demo players appear in the real players list (by design — labeled, not hidden)
- Each demo player has: group, curriculum level (if orange_development level exists), dev profile, priority

---

### 4. Demo group is created

**After creation:**
- `[DEMO] Orange 2 Sample Group` appears in groups queries
- 6 demo players have `group_memberships` rows pointing to this group
- All memberships have `is_current = true`

---

### 5. Demo development profiles exist

**Navigate to:** `/director/players/development-intake`

**Expected:**
- Demo players appear in the intake list
- Each has `hasDevelopmentData = true`
- Strengths and needs pre-filled per spec:
  - `[DEMO] Mia`: Rally tolerance, Forehand consistency / Recovery after direction, Return readiness
  - `[DEMO] Leo`: Movement, Effort / Contact spacing, Directional control
  - etc.

---

### 6. Demo curriculum version is visible if seeded

**Navigate to:** `/director/curriculum` or check `academy_curriculum_versions`

**Expected:**
- `[DEMO] Dabul Academy Curriculum` version exists in `academy_curriculum_versions`
- Status = `active`
- One `academy_curriculum_overrides` row: emphasis_shift for return_readiness, status = `applied`
- Warning shown if curriculum version creation failed (DB permissions)

---

### 7. Demo template exists

**Navigate to:** `/director/sessions` or query templates

**Expected:**
- `[DEMO] Orange 2 Direction + Return Start` in templates
- 5 template blocks: Movement Prep, Direction Technical Drill, Crosscourt Recovery Game, Serve + Return Start, Cooldown

---

### 8. Demo session exists

**Navigate to:** `/director/sessions`

**Expected:**
- `[DEMO] Orange 2 Adaptive Session` in session list
- Status: `planned`
- Group: `[DEMO] Orange 2 Sample Group`
- 5 session blocks matching template blocks
- `coach_id` = the acting user's profile ID

---

### 9. Demo session shows coach briefing and class intelligence

**Navigate to:** `/director/sessions/{demoSessionId}`

**Expected:**
- "Class Roster Intelligence" panel shows demo players
- Each player shows strengths and needs
- Coach Briefing shows: player count, active focus areas count, curriculum context
- Development data for all 6 players is visible

---

### 10. Adaptive suggestions can be generated from demo data

**On demo session page:** Click "Generate Suggestions for This Class"

**Expected:**
- `createSessionAdjustmentSuggestionsAction()` runs
- At least 2 suggestions generated (based on recovery needs + return readiness)
- Suggestions show player names from demo roster
- Suggestions appear in "Suggested Adjustments" section

---

### 11. Approved suggestion applies only to demo session

**Approve one suggestion, then apply:**

**Expected:**
- Suggestion status changes from `approved` to `applied`
- `session_blocks.notes` for the target block updated with `[Adaptive Adjustment — ...]` text
- `template_blocks` table NOT touched
- `audit_logs` entry written for apply action
- Master template `[DEMO] Orange 2 Direction + Return Start` blocks remain unchanged

---

### 12. Master template remains unchanged

**After applying a suggestion:**
- Query `template_blocks` for the demo template
- Notes on template blocks must match original seed values
- No `[Adaptive Adjustment]` text in template blocks

---

### 13. Reset / delete removes demo records only

**Action:** Check "I understand..." checkbox → Click "Delete Demo Data"

**Expected:**
- All 6 demo players deleted
- Demo group deleted
- Demo template deleted
- Demo session deleted
- Demo curriculum version deleted
- Related records deleted via cascade (group_memberships, session_blocks, template_blocks, dev summaries, priorities, curriculum states, suggestions)
- `audit_logs` entry with `action = 'demo_sandbox_reset'` and deleted counts
- Page reloads → returns to "Demo sandbox not yet created" state

---

### 14. Real records remain untouched

**After delete:**
- Real players (first_name NOT ILIKE `[DEMO]%`) unaffected
- Real groups (name NOT ILIKE `[DEMO]%`) unaffected
- Real sessions (name NOT ILIKE `[DEMO]%`) unaffected
- Real templates unaffected
- Real curriculum versions unaffected

---

### 15. Parent / player views remain untouched

**Throughout demo lifecycle:**
- No rows created in `guardians`, `player_guardians`
- No `profile_id` set on demo players (no auth accounts)
- `show_to_student = false`, `show_to_parent = false` on all demo dev summaries
- Routes `/player` and `/parent` remain unchanged

---

### 16. No communications sent

**Throughout demo lifecycle:**
- No email, push, SMS, or Slack messages triggered
- No external API calls
- No rows in `notifications` or `communications` tables

---

## Guardrails Confirmed

| Guardrail | Mechanism |
|---|---|
| No real data mutation | All demo queries use `first_name ILIKE '[DEMO]%'` / `name ILIKE '[DEMO]%'` filter |
| No parent accounts | No writes to `guardians`, `player_guardians` |
| No communications | No external API calls |
| Dev summaries private | `show_to_student = false`, `show_to_parent = false` |
| Audit trail | `audit_logs` entry on every seed and reset |
| academy_id scoped | All queries include `academy_id = :academyId` |
| Template never touched | Adaptive suggestions apply to `session_blocks.notes` only |
| Confirmation required | Delete requires explicit checkbox confirmation |
| Idempotent seed | Existing demo records not duplicated |

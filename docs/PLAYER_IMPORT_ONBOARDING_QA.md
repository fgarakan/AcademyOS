# Player Import Onboarding QA

**Sprint:** 110
**Date:** 2026-05-01

---

## Test Cases

### 1. Empty CSV

**Input:** Empty string or file with no content.

**Expected:**
- `parsePlayerImportCsv` returns `headerError: 'CSV is empty.'`
- Dry-run action returns `{ ok: false, headerError: 'CSV is empty.' }`
- UI shows error banner, no rows displayed

---

### 2. Missing first_name column

**Input:** CSV with only `last_name` column in header.

**Expected:**
- `headerError: "CSV is missing required header column(s): first_name."`
- Dry-run blocked before any DB queries
- Commit blocked

---

### 3. Missing last_name on a row

**Input:** Row with `first_name` but empty `last_name`.

**Expected:**
- `errors: [{ field: 'last_name', message: 'last_name is required.' }]`
- Row action = `skip_error`
- Row excluded from commit
- Other valid rows proceed normally

---

### 4. Duplicate names inside upload

**Input:** Two rows with identical `first_name + last_name`.

**Expected:**
- Both rows flagged with warning: "Duplicate name appears N times in this upload. Only the first row will be imported."
- `duplicateCandidates` contains the duplicate
- `normalizedRows` contains only the first occurrence
- Dry-run report shows `skippedDuplicates: 1`

---

### 5. Existing player match

**Input:** Row where `first_name + last_name` (case-insensitive) matches an existing player in the academy.

**Expected:**
- Row action = `update_dev_data`
- Warning: "Player already exists. Development data will be updated if provided."
- Commit action: updates `player_development_summary` and creates/replaces `player_priorities` only
- `players` row core fields (date_of_birth, status, etc.) NOT changed
- New player row NOT created
- `updatedCount++`, `createdCount` unchanged

---

### 6. Unknown group name

**Input:** Row with `current_group = "Saturday Elite"` but no group with that name in this academy.

**Expected:**
- Dry-run row warning: `Group "Saturday Elite" not found in this academy. Group assignment will be skipped.`
- `unresolvedGroups` count incremented
- Commit: player created without group assignment
- `groupAssignedCount` NOT incremented for this row

---

### 7. Unknown curriculum level name

**Input:** Row with `curriculum_level = "Orange Ball"` but no exact display_name match in `curriculum_levels`.

**Expected:**
- Dry-run row warning: `Curriculum level "Orange Ball" not found. Curriculum assignment will be skipped.`
- `unresolvedLevels` count incremented
- Commit: player created without curriculum state
- Player profile visible in Onboarding Review as missing curriculum assignment

---

### 8. Valid strengths/needs/current priority import

**Input:** Row with:
```
strength_1=Consistent groundstrokes
strength_2=Good footwork
need_1=Return of serve
need_2=Directional control
current_priority=Improve cross-court consistency
coach_notes=Making progress with footwork.
```

**Expected:**
- `player_development_summary` upserted with:
  - `current_strengths = ['Consistent groundstrokes', 'Good footwork']`
  - `things_to_work_on = ['Return of serve', 'Directional control']`
  - `development_focus = 'Return of serve'` (first need)
  - `coach_summary = 'Making progress with footwork.'`
- `player_priorities` row created with `title = 'Improve cross-court consistency'`, `category = 'technical_skill'`
- `profileSummaryCreatedCount++`
- `priorityCreatedCount++`

---

### 9. Commit creates players only after confirmation

**Flow:**
1. Paste CSV → Run Dry Run → review report
2. Commit Import button disabled until checkbox ticked
3. Tick "I understand…" checkbox → button enabled
4. Click Commit Import → server action runs

**Expected:**
- Before confirmation: no database mutations
- After confirmation: mutations occur
- Result report shows created/updated/skipped counts
- `audit_logs` entry created with `action = 'player_import_commit'`

---

### 10. Parent/player views remain untouched

**After commit:**
- No rows created in `guardians`, `player_guardians`, parent communication tables
- `show_to_student = false`, `show_to_parent = false` on all created dev summaries
- Routes `/player` and `/parent` remain unchanged

---

### 11. No communications sent

**Expected:**
- No email, push, SMS, or Slack messages triggered
- No `notifications` or `communications` table inserts
- No external API calls of any kind

---

### 12. Class Roster Intelligence improves after development profiles are added

**Before Development Intake:**
- Session page Class Roster Intelligence panel shows players with empty strengths/needs
- Coach Briefing: "0 players with active focus areas"
- Adaptive Suggestions: minimal or generic suggestions

**After Development Intake (strengths + needs added):**
- Class Roster Intelligence shows strengths and development areas per player
- Coach Briefing: "N players with active focus areas"
- Adaptive Suggestions: rules fire based on real player needs (recovery, spacing, return, etc.)

---

### 13. Adaptive Session Suggestions become more specific after strengths/needs are added

**Test:**
1. Create session for a group
2. Import players with recovery/stamina needs
3. Generate suggestions for that session

**Expected:**
- Rule 1 fires: `add_recovery_requirement` suggestion
- `players_supported` lists the specific players with stamina needs
- `reason` explains how many players have recovery as focus
- Suggestion is more specific than generic text

---

## Guardrails Confirmed

| Guardrail | Mechanism |
|---|---|
| No auto-commit | Commit requires checkbox confirmation + button click |
| Dry-run re-runs inside commit | Server action re-parses CSV before mutations |
| No parent accounts created | No writes to `guardians`, `player_guardians` |
| No communications | No external API calls |
| Dev summaries private | `show_to_student = false`, `show_to_parent = false` |
| Audit trail | `audit_logs` entry on every commit |
| academy_id scoped | All queries include `.eq('academy_id', academyId)` |
| Duplicate conservative | Exact name match → update dev data only |
| date_of_birth handled | Sentinel `1900-01-01` with warning if birth_year blank |
| Status active bypass documented | Explicit limitation in schema audit and import docs |


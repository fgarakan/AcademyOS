# Adaptive Session Planning QA

**Sprint:** 99
**Date:** 2026-05-01

---

## Test Cases

### 1. Session with no group roster

**Input:** Session has `group_id = null` or group has no current members.

**Expected:**
- `getGroupNeedsForSession` returns `emptyResult` with warning "No group assigned to this session." or "No current members in this group."
- `generateSessionModificationSuggestions` returns `{ suggestions: [], warnings: ['No players in class — cannot generate suggestions.'] }`
- `createSessionAdjustmentSuggestionsAction` returns `{ ok: true, created: 0, warnings: [...] }`
- `SessionAdjustmentSuggestionsPanel` shows empty state: "Assign a group to this session to generate adaptive suggestions."

---

### 2. Session with group roster but no player development summaries

**Input:** Players exist in group but have no rows in `player_development_summary`.

**Expected:**
- `groupNeedsAggregation` returns players with `strengths: []`, `thingsToWorkOn: []`, `developmentFocus: null`
- `missingDevelopmentSummaries` count is populated
- Warning added: "N players without development summary."
- Rule engine fires only rules that don't depend on development data (e.g. small class scoring, evidence gap)
- No crash

---

### 3. Session with multiple players sharing recovery needs

**Input:** 3+ players have "recovery" or "stamina" in `things_to_work_on`.

**Expected:**
- Rule 1 fires: `add_recovery_requirement` suggestion created
- `players_supported` lists the matching players by name
- `confidence` is `high` if count ≥ threshold + 1
- `target_block_hint` points to a game/competition block (not a warm-up)

---

### 4. Session with return/serve-readiness needs

**Input:** 2+ players have "return" or "return readiness" in their needs, or academy override mentions return.

**Expected:**
- Rule 3 fires: `simplify_drill` suggestion created
- Reason explains how many players and/or override source
- `target_block_hint` points to a serve/return named block if available, else first drill/game block
- If override-only (no player needs match), `confidence` is `high`

---

### 5. Session with advanced + struggling players

**Input:** At least 2 curriculum levels present. Some players have "consistency"/"spin" in strengths. Some players have 2+ things to work on and 0–1 strengths.

**Expected:**
- Rule 5 fires: `adjust_partner_grouping` suggestion created
- `players_supported` covers all active players
- `curriculum_context.levels_present` lists all level names
- `risk_level` is `medium`

---

### 6. Session with low class size (≤ 3 players)

**Input:** Only 2–3 players present (attendance recorded). At least one game block exists.

**Expected:**
- Rule 6 fires: `adjust_scoring` suggestion created
- Mentions Canadian doubles or round-robin
- `confidence` is `high`
- `target_block_hint` is the first game block

---

### 7. Approved suggestion applies only to session block notes

**Flow:**
1. Generate suggestions
2. Approve one suggestion (status → `approved`)
3. Call `applyApprovedSessionAdjustmentAction(suggestionId)`

**Expected:**
- If `target_session_block_id` exists: `session_blocks.notes` for that block has `[Adaptive Adjustment]` appended
- `template_blocks` is untouched
- `session_adjustment_suggestions.status` → `applied`
- `audit_logs` entry created with `action: 'apply_session_adjustment'`

---

### 8. Master template remains unchanged

**After applying any suggestion:**
- Query `template_blocks` for the session's source template — no rows should have changed
- `templates` table — unchanged
- Confirm by comparing `template_blocks.notes` before and after

---

### 9. Player records remain unchanged

**After generating or applying any suggestion:**
- `players` — unchanged
- `player_development_summary` — unchanged
- `player_priorities` — unchanged
- `player_curriculum_states` — unchanged
- `player_requirement_progress` — unchanged

---

### 10. Parent/player views remain unchanged

**Verification:**
- No routes under `/player` or `/parent` expose `session_adjustment_suggestions`
- RLS policy: only academy members with `academy_director` or `head_coach` role can insert/update
- Academy members (read) policy includes coaches only — parent/player roles are not `academy_members`

---

## TypeScript Validation

Run before shipping:

```bash
npx tsc --noEmit
```

Must return clean (no errors).

---

## Key Guardrails Confirmed

| Guardrail | Mechanism |
|---|---|
| No AI calls | Rule engine is purely deterministic TypeScript |
| No template mutation | `applyApprovedSessionAdjustmentAction` never queries `template_blocks` |
| No player record mutation | Server action touches only `session_blocks`, `sessions`, `session_adjustment_suggestions`, `audit_logs` |
| No curriculum mutation | No writes to `academy_curriculum_overrides`, `curriculum_levels`, `academy_curriculum_versions` |
| academy_id scoping | All queries include `.eq('academy_id', academyId)` where academyId comes from authenticated profile |
| Director/coach only | Membership check enforced in all server actions |
| Suggestions as drafts | Default status is `pending_review` — nothing auto-applies |


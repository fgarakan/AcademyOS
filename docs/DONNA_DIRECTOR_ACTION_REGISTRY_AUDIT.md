# DONNA Director Action Registry Audit

**Sprint:** 604A
**Date:** 2026-05-21
**Scope:** All 13 server action files in `src/app/director/_actions/`

---

## Operating model

```
DONNA proposes → Director approves → System records → System executes
```

All mutations that affect player, curriculum, or communication state must:
1. Create a `proposed_actions` row with `status: 'pending_review'`
2. Pass through director approval in `/director/review`
3. Execute only via `execute_approved_action()` or equivalent apply path
4. Write to `audit_logs`

---

## Action file registry

### 1. `donnaAttendanceActions.ts`

**Purpose:** Creates attendance exception drafts for individual players.
**Triggered from:** `/director/sessions/[sessionId]` — `AttendanceExceptionDraftPanel`
**Output type:** `proposed_actions` row (`target_module: 'attendance_exception'`)
**Approval required:** ✅ Yes — creates `pending_review` row; director must approve in review queue
**Parent/player visibility:** ✅ Safe — exception draft is director-only until approved
**Writes to:** `proposed_actions`
**Reads from:** `sessions`, `players`, `session_attendance`
**Academy-scoped:** ✅ Yes

---

### 2. `donnaAttendanceSessionActions.ts`

**Purpose:** Read-only session picker — fetches recent sessions for attendance exception context.
**Triggered from:** `/director/sessions/[sessionId]` — session resolution UI
**Output type:** Read-only result (`AttendanceSessionOption[]`)
**Approval required:** — (read-only)
**Parent/player visibility:** ✅ Safe — session metadata only, no observations
**Writes to:** Nothing
**Reads from:** `sessions`, `session_groups`
**Academy-scoped:** ✅ Yes

---

### 3. `donnaCoachIntelligenceAction.ts`

**Purpose:** Generates per-coach intelligence summary — wrap-up compliance, session coverage, coach profile signals.
**Triggered from:** `/director/coaches/[coachId]` (not currently wired to a UI component)
**Output type:** Read-only intelligence summary
**Approval required:** — (read-only)
**Parent/player visibility:** ✅ Safe — coach data only, no player observations in output
**Writes to:** Nothing
**Reads from:** `coach_profiles`, `sessions`, `session_blocks`, `session_wrap_ups`
**Academy-scoped:** ✅ Yes
**Gap:** Action exists but no UI entry point on coach profile page

---

### 4. `donnaContextActions.ts`

**Purpose:** Context retrieval for DONNA — deterministic summaries of player, session, or curriculum objects for use in DONNA chat shell.
**Triggered from:** Multiple routes via `DonnaAssistantButton` (client component)
**Output type:** Read-only context payloads (player summary, session summary, curriculum summary)
**Approval required:** — (read-only)
**Parent/player visibility:** ✅ Safe — returns director-safe summaries; does not include raw coach notes or parent comms
**Writes to:** Nothing
**Reads from:** `players`, `sessions`, `curriculum_levels`, `player_curriculum_states`, `coach_observations` (summary-level only)
**Academy-scoped:** ✅ Yes
**Gap:** Not wired to routes with no DONNA presence (KPI, signals, coaches, level-up)

---

### 5. `donnaCurriculumAdjustmentApplyActions.ts`

**Purpose:** Applies an approved curriculum override to create a versioned record in `academy_curriculum_overrides`.
**Triggered from:** `/director/review` — curriculum adjustment draft card apply button
**Output type:** `academy_curriculum_overrides` row
**Approval required:** ✅ Yes — reads `proposed_actions.status === 'approved'` before applying
**Parent/player visibility:** ✅ Safe — curriculum overrides are director-only configuration
**Writes to:** `academy_curriculum_overrides`, `audit_logs`, `proposed_actions` (status update)
**Reads from:** `proposed_actions`
**Academy-scoped:** ✅ Yes

---

### 6. `donnaDirectorIntelligenceActions.ts`

**Purpose:** Player intelligence drafts — creates parent guidance drafts, priority recommendations, level review summaries, and player coach briefs.
**Triggered from:** `/director/players/[playerId]` — `PriorityRecommendationDraftButton`, `DraftSummaryUpdateButton`, `ParentGuidancePreviewPanel`
**Output type:** `proposed_actions` rows (`target_module: 'parent_communication'`, `'level_review'`, `'player_brief'`)
**Approval required:** ✅ Yes — all drafts go to `pending_review`
**Parent/player visibility:** ✅ Sanitized — parent-facing outputs pass through `buildParentSupportGuidanceDraft` + `sanitizeParentFacingText`; raw coach notes never included
**Writes to:** `proposed_actions`
**Reads from:** `players`, `coach_observations`, `player_priorities`, `player_curriculum_states`, `curriculum_levels`, `player_gate_status`
**Academy-scoped:** ✅ Yes

---

### 7. `donnaDraftExecutionActions.ts`

**Purpose:** Executes approved DONNA drafts — the unified apply path for approved `proposed_actions` items. Dispatches to the correct apply handler based on `target_module`.
**Triggered from:** `/director/review` and `/director/review/[actionId]` — "Apply" buttons on draft cards
**Output type:** DB mutations (varies by target_module)
**Approval required:** ✅ Yes — validates `proposed_actions.status === 'approved'` before executing
**Parent/player visibility:** ✅ Safe — execution is gated; output is approved director content
**Writes to:** Various (dispatches to module-specific apply paths)
**Reads from:** `proposed_actions`
**Academy-scoped:** ✅ Yes

---

### 8. `donnaIntelligenceDraftReviewActions.ts`

**Purpose:** Updates `proposed_actions.status` for the three intelligence draft types: `parent_communication`, `level_review`, `curriculum_adjustment`.
**Triggered from:** `/director/review/[actionId]` — approve/reject controls
**Output type:** Status update on `proposed_actions`
**Approval required:** ✅ Yes — this IS the approval mechanism
**Parent/player visibility:** ✅ Safe — status update only; no data exposed
**Writes to:** `proposed_actions` (status, reviewer_id, reviewed_at)
**Reads from:** `proposed_actions`
**Academy-scoped:** ✅ Yes

---

### 9. `donnaLevelMovementActions.ts`

**Purpose:** Applies an approved level advancement — moves a player to the next curriculum level. Requires `proposed_action.status === 'approved'` and `target_module === 'level_review'`.
**Triggered from:** Not wired to any UI (action file exists, no entry point on `/director/level-up`)
**Output type:** Player curriculum state update (`player_curriculum_states`)
**Approval required:** ✅ Yes — approval gate in action file
**Parent/player visibility:** ✅ Safe — level movement is internal; no parent/player-facing output
**Writes to:** `player_curriculum_states`, `audit_logs`, `proposed_actions` (status update)
**Reads from:** `proposed_actions`, `players`, `curriculum_levels`
**Academy-scoped:** ✅ Yes
**Gap:** No UI entry point on `/director/level-up` — library exists but is invisible to the director

---

### 10. `donnaObjectResolutionActions.ts`

**Purpose:** Read-only — resolves director-typed names/descriptions into real Academy OS objects (players, sessions, coaches). Returns structured candidates for director confirmation before any write.
**Triggered from:** `/director/command-center` — `CommandCenterClient` command parsing
**Output type:** Read-only candidate lists
**Approval required:** — (read-only)
**Parent/player visibility:** ✅ Safe — returns names and IDs only; no observations or comms
**Writes to:** Nothing
**Reads from:** `players`, `sessions`, `coaches`, `groups`
**Academy-scoped:** ✅ Yes

---

### 11. `donnaReviewQueueActions.ts`

**Purpose:** Fetches and manages the director review queue — loads pending items, filters by type, marks items as seen.
**Triggered from:** `/director/review`, `/director/donna` — `DonnaReviewQueueSurface`, `DonnaReviewBriefPanel`
**Output type:** Read-only queue data + seen status updates
**Approval required:** — (queue management, not item approval)
**Parent/player visibility:** ✅ Safe — queue metadata only; item content requires explicit expand
**Writes to:** `proposed_actions` (seen_at only)
**Reads from:** `proposed_actions`
**Academy-scoped:** ✅ Yes

---

### 12. `groupKpiSummaryAction.ts`

**Purpose:** Computes group health and retention KPI summaries for a specific group.
**Triggered from:** Various (not clearly surfaced on `/director/kpi`; used in group-level views)
**Output type:** Read-only computed KPI metrics
**Approval required:** — (read-only)
**Parent/player visibility:** ✅ Safe — aggregate group metrics only, no individual player data
**Writes to:** Nothing
**Reads from:** `session_attendance`, `player_groups`, `sessions`
**Academy-scoped:** ✅ Yes
**Gap:** Action exists but `/director/kpi` is not wired to DONNA or this action

---

### 13. `saveCoachCommunicationDraftAction.ts`

**Purpose:** Saves a coach communication draft to `proposed_actions`. Never sends the message. Draft requires director approval before dispatch.
**Triggered from:** `/director/players/[playerId]` — `NotesAIDraftSection` or communication draft panels
**Output type:** `proposed_actions` row (`target_module: 'coach_communication'`)
**Approval required:** ✅ Yes — creates `pending_review` row; director must approve in review queue before message is sent
**Parent/player visibility:** ✅ Safe — coach comms are internal director-to-coach; never player-facing
**Writes to:** `proposed_actions`
**Reads from:** `players`, `coach_profiles`, `coach_observations`
**Academy-scoped:** ✅ Yes

---

## Approval coverage summary

| Action | Creates proposed_action | Approval required | Apply path |
|---|---|---|---|
| `donnaAttendanceActions` | ✅ | ✅ | `donnaDraftExecutionActions` |
| `donnaAttendanceSessionActions` | — | — | Read-only |
| `donnaCoachIntelligenceAction` | — | — | Read-only |
| `donnaContextActions` | — | — | Read-only |
| `donnaCurriculumAdjustmentApplyActions` | — | ✅ pre-check | Direct apply after approval |
| `donnaDirectorIntelligenceActions` | ✅ | ✅ | `donnaIntelligenceDraftReviewActions` → `donnaDraftExecutionActions` |
| `donnaDraftExecutionActions` | — | ✅ pre-check | This IS the apply path |
| `donnaIntelligenceDraftReviewActions` | — | ✅ | Status update only |
| `donnaLevelMovementActions` | — | ✅ pre-check | Direct apply after approval (not yet wired) |
| `donnaObjectResolutionActions` | — | — | Read-only |
| `donnaReviewQueueActions` | — | — | Queue management |
| `groupKpiSummaryAction` | — | — | Read-only |
| `saveCoachCommunicationDraftAction` | ✅ | ✅ | `donnaDraftExecutionActions` |

---

## Key risks identified

### Risk 1 — `donnaLevelMovementActions.ts` not surfaced
Level advancement action exists with a correct approval gate but no UI entry point on `/director/level-up`. Directors cannot trigger it from the UI. P0 gap.

### Risk 2 — Fitness template session generation bypasses review queue
`/director/fitness/templates/[templateId]` — `GenerateSessionPanel` can create sessions directly without routing through `proposed_actions`. This is a medium-risk process gap. P1 fix: add review gate.

### Risk 3 — `donnaCoachIntelligenceAction.ts` not wired
Coach intelligence summary exists but no UI entry point on coach profile pages. P2 improvement.

### Risk 4 — `groupKpiSummaryAction.ts` not connected to `/director/kpi`
KPI page has no DONNA connection; this action could power it. P1 improvement.

# Player Evidence Hub — Architecture Audit
# Sprint 1054

**Date:** 2026-05-19
**Sprint:** 1054 — Player Evidence Hub Architecture Audit V1
**Phase:** Phase 7A — Player Profile Evidence Hub (Sprints 1054-1065)

---

## 1. Executive Summary

The player profile has a rich set of evidence data already loaded in `page.tsx`. What does not yet exist is a unified Evidence Hub view that surfaces all of it in one coherent, role-safe place. The evidence data is spread across six tab slots and passed to more than a dozen components — none of which cross-reference each other.

**Phase 7A goal:** Make approved, applied evidence visible in a single hub on the player profile (director-facing), and create the foundation for surfacing parent-safe and player-safe subsets in Phases 7B and 7C.

**Key constraint:** Raw coach observation content must never appear in parent or player portals. Only `is_parent_safe`-flagged evidence links, sanitized coach language, and approved development summaries are eligible for parent/player exposure.

---

## 2. Evidence Sources Inventory

### 2.1 Coach Observations (`coach_observations`)

**Table:** `coach_observations`
**Loaded in:** `page.tsx` lines 766-777 (rawDb multi-join)
**Passed to:** `NotesAIDraftSection`, `ProgressEvidenceTimeline`, `CoachObservationEvidenceSummary`, `PlayerCoachNotesBlock`, `PlayerActionSummaryCard`

Key fields:
- `id`, `content`, `observation_type`, `tags`, `is_private`
- `is_private` — controls display style (Internal / Coach note pill) but all observations are director-internal
- `profiles!coach_observations_coach_id_fkey(display_name)` — coach name join
- `sessions!coach_observations_session_id_fkey(name, scheduled_date)` — session context join

**Observation types:** general, technical, tactical, movement, competition, behavioral, injury_concern, positive_highlight, positive, needs_attention

**Parent/Player safety:** Raw observation content is NEVER parent-safe. The `is_private` flag only governs director display style — not portal exposure.

**Current Evidence Hub gap:** `ProgressEvidenceTimeline` shows all observations in a list (up to 10) but has no filtering by type, date range, or curriculum relevance.

---

### 2.2 Requirement Evidence Links (`requirement_evidence_links`)

**Table:** `requirement_evidence_links`
**Loaded in:** `page.tsx` lines 1107-1178
**Passed to:** `PlayerRequirementProgressReadOnly` via `evidenceByProgressId`

Key fields:
- `id`, `requirement_id`, `player_requirement_progress_id`
- `evidence_type` — e.g. `coach_observation`, `assessment`, `gate_confirmed`
- `evidence_id` — FK to the source record
- `evidence_summary` — director-written description of the evidence
- `confidence` (0-1), `weight` (0-1)
- `created_by`, `created_at`
- **`is_parent_safe: boolean`** — the gate for parent portal exposure

**Enrichments loaded:** observation snippets (`coach_observations.content`) + creator display names from `profiles`.

**Current Evidence Hub gap:** Evidence links are only visible inside the per-requirement row on the Skill Path tab. No cross-requirement evidence summary view exists.

---

### 2.3 Player Requirement Progress (`v_player_requirement_progress_detail`)

**View:** `v_player_requirement_progress_detail`
**Loaded in:** `page.tsx` lines 1070-1085
**Passed to:** `PlayerRequirementProgressReadOnly`

Key fields:
- `progress_id`, `requirement_id`, `curriculum_level_id`
- `requirement_title`, `requirement_description`, `requirement_type`, `requirement_domain_key`
- `status` — not_started / in_progress / met / confirmed / overridden
- `progress_value`, `evidence_count`, `last_evidence_at`
- **`is_required`** — whether this requirement blocks advancement
- **`is_parent_visible`** — whether this requirement may be shown to parents
- **`is_player_visible`** — whether this requirement may be shown to players

**Current Evidence Hub gap:** Requirement progress is displayed only in a detailed list on the Skill Path tab. No summary heat-map or timeline showing which requirements have recent evidence exists.

---

### 2.4 Curriculum Gates (`curriculum_gates` + `player_gate_status`)

**Tables:** `curriculum_gates`, `player_gate_status`
**Loaded in:** `page.tsx` lines 224-318
**Passed to:** `PlayerLevelRequirementsCard`, `GateHistoryTimeline`

Key fields on `curriculum_gates`:
- `id`, `domain`, `criterion`, `gate_type`, `threshold`, `evaluator`, `cadence`, `evidence_window`

Key fields on `player_gate_status`:
- `gate_id`, `status` (not_started/in_progress/met/confirmed), `evidence_count`, `last_evidence_at`

Gate audit log from `audit_logs`:
- `action` in (`gate_status.evidence_recorded`, `gate_status.director_decision`)
- `actor_id`, `created_at`, `payload`

**Current Evidence Hub gap:** Gate status is shown in a requirements card and a timeline, but not linked to the observations or evidence links that produced each status update.

---

### 2.5 Player Priorities (`player_priorities`)

**Table:** `player_priorities`
**Loaded in:** `page.tsx` lines 143-148
**Passed to:** `PlayerActivePriorities`, `DevelopmentProfileSummaryCard`, `PlayerActionSummaryCard`, `CoachPlayerSnapshot`

Key fields:
- `id`, `title`, `description`, `category`, `status`
- `priority_level`, `priority_rank`, `urgency`
- `is_active`

**Evidence connection gap:** Priorities have no link to the observations or evidence links that motivated them. A priority recommendation draft (`priority_recommendation` proposed_action) creates the priority but the link to source evidence is in the draft payload — not stored on the priority row itself.

---

### 2.6 Player Development Summary (`player_development_summary`)

**Loaded via:** `getPlayerDevelopmentSummary()` in `src/lib/backend/notes.ts`
**Passed to:** `DevelopmentSummarySection`, `EditDevelopmentSummaryForm`, `DevelopmentProfileSummaryCard`, `CoachPlayerSnapshot`, `PlayerParentSummaryBlock`

Key fields:
- `development_focus`, `current_strengths` (array), `things_to_work_on` (array)
- **`show_to_student: boolean`** — whether this summary is player-safe
- **`show_to_parent: boolean`** — whether this summary is parent-safe
- `source` — `manual` or `ai_draft`
- `updated_at`

**Current portal behavior:** Parent portal does NOT use `show_to_parent` to filter. It builds an IDP from curriculum coach language, not from development summary. Player portal does the same. The `show_to_parent` / `show_to_student` flags exist in the schema but are not yet enforced in any portal view.

---

### 2.7 Assessments (`assessments`)

**Table:** `assessments`
**Loaded in:** `page.tsx` lines 621-687
**Passed to:** `QuickAssessmentHistoryCard`, `AssessmentHistoryCard`, `PlayerCommandCenterCard`

Key fields:
- `id`, `assessed_date`, `type` (intake/quarterly/reassessment/promotion/ad_hoc)
- `technical_score`, `tactical_score`, `movement_score`, `competition_score`, `behavioral_score`
- `overall_score`, `is_baseline`, `promotion_ready`
- `notes` — internal, NOT parent-safe
- `assessed_by` → `profiles.display_name`

**Evidence hub relevance:** Assessments are the most structured evidence of player readiness. They are already linked to `requirement_evidence_links` via `evidence_type = 'assessment'` but this connection is not surfaced.

---

### 2.8 Proposed Actions Applied (`proposed_actions`)

**Table:** `proposed_actions`
**Relevant in player context:**
- `target_module = 'priority_recommendation'` — priority drafts (status: pending_review / approved / clarification_needed)
- `target_module = 'requirement_evidence_link'` — evidence link drafts
- `target_module = 'coach_observation_draft_v1'` — observation drafts
- `target_module = 'development_summary_draft_v1'` — dev summary drafts
- `status = 'executed'` — applied (evidence has landed)

**Current Evidence Hub gap:** No summary of recently executed proposed_actions affecting this player exists. An applied wrap-up, an applied evidence link, and an applied development summary draft all produce evidence — but the director cannot see what was applied when.

---

### 2.9 UTR Competition Data

**Tables:** `player_utr_profiles`, `player_utr_history`, `player_utr_matches`, `player_utr_insights`
**Passed to:** `PlayerCompetitionTab`

UTR data is evidence of competition pathway progress. Currently isolated in the Competition tab with no connection to curriculum gate status or requirement evidence links.

**Evidence Hub relevance:** Phase 7A will not build UTR evidence linking — that belongs to a later sprint. Noted for Phase 7B/7C.

---

### 2.10 Load / Fitness Data (`player_load_aggregation`)

**Loaded in:** `page.tsx` lines 393-407
**Passed to:** `PlayerLoadTab`, gap detection helpers

Fitness load is internal diagnostic data. Not parent-safe. Not player-safe.
Not included in Phase 7A evidence hub.

---

## 3. Parent Safety Architecture

### 3.1 Current parent-safe data flow

`/parent` page.tsx:
1. Guardian → player link via `player_guardians`
2. Curriculum level → `curriculum_coach_language` (sanitized with `sanitizeParentFacingText()`)
3. Active priorities (title + description only — no internal notes)
4. `buildIndividualDevelopmentPlan()` → `buildRoleSpecificIdpView(plan, 'parent')` → `IdpParentView`
5. Attendance (player's own records only)
6. Private lesson request status (parent-safe status labels only)

**What the parent portal does NOT currently show:**
- Any `coach_observations` content
- Any `requirement_evidence_links` (even `is_parent_safe = true` ones)
- Any `assessments.notes`
- Any `player_development_summary` (despite `show_to_parent` flag)

### 3.2 Parent-safe evidence fields that exist but are unused

| Field | Table | Description |
|---|---|---|
| `is_parent_safe` | `requirement_evidence_links` | True when evidence link is safe for parent view |
| `is_parent_visible` | `v_player_requirement_progress_detail` | True when requirement row can be shown to parents |
| `show_to_parent` | `player_development_summary` | True when dev summary is parent-approved |
| Sanitized coach language | `curriculum_coach_language` | Already used — this is the current parent pipeline |

### 3.3 Safety rules that must be preserved

- `src/lib/communications/parentSafeResponseRules.ts` — locked, defines blocked/allowed content
- `sanitizeParentFacingText()` — must be applied to any coach-written text shown to parents
- Raw `coach_observations.content` must NEVER appear in parent or player portals
- `is_parent_safe` checks must be applied server-side before any data reaches parent route handlers
- Player portal: player sees their own development summary only if `show_to_student = true`

---

## 4. Player Safety Architecture

### 4.1 Current player-safe data flow

`/player` page.tsx:
1. Player linked via `players.profile_id = user.id`
2. Curriculum level → gates, drills, coach language
3. Active priorities (title + description — no internal urgency/rank)
4. `buildIndividualDevelopmentPlan()` → `buildRoleSpecificIdpView(plan, 'player')` → `IdpPlayerView`
5. Attendance (own records, no session notes)
6. Learning module hints (deterministic, no AI)

**What the player portal does NOT show:**
- Any coach observation content (even positive ones)
- Any requirement evidence links
- Any assessment scores or notes
- Internal priority rank/urgency
- Gate evidence counts or status

### 4.2 Player-safe evidence fields

| Field | Table | Description |
|---|---|---|
| `is_player_visible` | `v_player_requirement_progress_detail` | True when requirement row can be shown to players |
| `show_to_student` | `player_development_summary` | True when dev summary is student-approved |

---

## 5. What Phase 7A Must Build (Evidence Hub, Director-Facing)

The Evidence Hub is a new view within the player profile (director route only). It does not change any existing data or component. It aggregates evidence that is already loaded and makes it navigable.

### 5.1 New read layer needed

A loader function (e.g. `src/lib/player/playerEvidenceRepository.ts`) that aggregates:
- Recent `coach_observations` with coach + session context
- Applied `requirement_evidence_links` with requirement context + `is_parent_safe` flag
- `player_gate_status` summary (per gate: status, evidence count, last activity)
- Applied `proposed_actions` affecting this player (observation drafts + evidence link drafts + dev summary drafts)
- Active `player_priorities` with category + urgency
- Latest `assessments` (last 3, all types)

This loader is read-only. No mutations. No migration needed.

### 5.2 New Evidence Hub component structure

```
PlayerEvidenceHub (new tab or section)
  ├── EvidenceHubHeader — total counts, last activity date
  ├── EvidenceTimeline (Sprint 1056) — chronological, multi-source
  │   ├── ObservationEvidenceRow — internal, director-only
  │   ├── RequirementEvidenceRow — with is_parent_safe badge
  │   ├── GateEvidenceRow — gate status changes
  │   └── AssessmentEvidenceRow — score snapshots
  ├── PathwayEvidenceCards (Sprint 1057)
  │   ├── SkillEvidenceCard — technical/tactical/movement observations
  │   ├── CompetitionEvidenceCard — competition obs + UTR link (placeholder)
  │   └── FitnessEvidenceCard — load + fitness obs
  ├── PriorityEvidenceConnection (Sprint 1058) — priority → supporting observations
  ├── CurriculumGateEvidencePanel (Sprint 1059) — per-gate evidence detail
  ├── LevelReadinessDraftView (Sprint 1060) — evidence toward next level gate
  └── ParentSafeSummaryPreview (Sprint 1061) — director preview of what parents will see
```

### 5.3 Parent-safe preview (Sprint 1061)

The parent-safe summary preview is director-only. It shows which evidence items are flagged `is_parent_safe = true` and previews the parent portal view. It does NOT change what the parent sees — it just lets the director audit what would be visible if Phase 7B is wired.

---

## 6. What Phase 7B Must NOT Do

When the Parent Portal Foundation is built (Sprints 1066-1075), these rules apply:

- No raw `coach_observations.content` — ever
- Only `requirement_evidence_links` where `is_parent_safe = true`
- Only `player_development_summary` where `show_to_parent = true`
- All coach-written text must pass through `sanitizeParentFacingText()`
- No internal priority rank, urgency, or `priority_level`
- No assessment `notes` field
- No gate audit log entries
- No `is_active = false` priorities

---

## 7. What Phase 7C Must NOT Do

When the Player Portal Foundation is built (Sprints 1076-1085):

- No raw `coach_observations.content` — even positive ones
- No internal observation types (behavioral, injury_concern)
- Only requirements where `is_player_visible = true`
- Only development summary where `show_to_student = true`
- No assessment scores (unless a separate "player score view" is explicitly approved)
- No internal priority urgency/rank

---

## 8. Migration Status

No new migrations are needed for Phase 7A. All required tables and columns exist:
- `coach_observations` — exists
- `requirement_evidence_links` (with `is_parent_safe`) — exists
- `v_player_requirement_progress_detail` (with `is_parent_visible`, `is_player_visible`) — exists
- `player_gate_status` — exists
- `player_development_summary` (with `show_to_parent`, `show_to_student`) — exists
- `assessments` — exists
- `proposed_actions` — exists
- `audit_logs` — exists

---

## 9. Files That Will Be Created in Phase 7A

| Sprint | File | Purpose |
|---|---|---|
| 1055 | `src/lib/player/playerEvidenceRepository.ts` | Read-layer aggregator |
| 1056 | `src/components/player/PlayerEvidenceTimeline.tsx` | Multi-source chronological timeline |
| 1057 | `src/components/player/PathwayEvidenceCards.tsx` | Skill/Competition/Fitness pathway cards |
| 1058 | `src/components/player/PriorityEvidencePanel.tsx` | Priority → evidence connection |
| 1059 | `src/components/player/CurriculumGateEvidencePanel.tsx` | Per-gate evidence panel |
| 1060 | `src/components/player/LevelReadinessDraftView.tsx` | Evidence toward next level |
| 1061 | `src/components/player/ParentSafeSummaryPreview.tsx` | Director preview of parent view |
| 1062 | `src/app/director/players/[playerId]/_components/PlayerEvidenceHub.tsx` | Hub assembly + page.tsx wiring |

---

## 10. Files That Will Be Modified in Phase 7A

| Sprint | File | Change |
|---|---|---|
| 1055 | None — read layer is a new lib file | |
| 1062 | `src/app/director/players/[playerId]/page.tsx` | Add Evidence Hub tab slot + call repository loader |
| 1062 | `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` | Add evidenceHub tab |

All other files are new. No locked files are touched.

---

## 11. Files That Must NOT Be Touched

- `src/lib/communications/parentSafeResponseRules.ts` — locked
- `src/lib/supabase/database.types.ts` — generated, do not edit
- `supabase/migrations/` — no new migrations in Phase 7A
- `src/middleware.ts` — role routing, do not touch
- `.env.local` — do not touch
- `src/app/parent/page.tsx` — not touched until Phase 7B
- `src/app/player/page.tsx` — not touched until Phase 7C

---

## 12. Scores — Pre-Phase 7A State

| Dimension | Score | Notes |
|---|---|---|
| Evidence data richness | 8/10 | All evidence tables exist and are queried |
| Evidence discoverability | 4/10 | Evidence is buried in per-tab components with no hub |
| Parent-safe evidence surfacing | 2/10 | Flags exist but portals do not use them |
| Player-safe evidence surfacing | 2/10 | Flags exist but portals do not use them |
| Evidence-to-priority linkage | 3/10 | Drafts exist but applied link is not visible |
| Evidence-to-gate linkage | 5/10 | Gate status shown but evidence detail not linked |
| Director evidence audit ability | 5/10 | Evidence is readable but requires navigating 3+ tabs |

**Target after Phase 7A:** Evidence discoverability 9/10, Director audit ability 9/10.
**Target after Phase 7B:** Parent-safe evidence surfacing 8/10.
**Target after Phase 7C:** Player-safe evidence surfacing 8/10.

---

## 13. Recommended Sprint 1055 Starting Point

**Read layer first.** Build `playerEvidenceRepository.ts` as a pure async function:

```typescript
export async function getPlayerEvidenceHub(
  supabase: SupabaseClient,
  playerId: string,
  academyId: string
): Promise<PlayerEvidenceHubData>
```

This loader runs server-side and returns typed evidence data for all hub components. Once the loader is proven (TypeScript clean, no errors), individual components can be built one sprint at a time using its output.

No new tab is added to the player profile until Sprint 1062, when the hub is assembled and wired.

---

**Phase 7A verdict: ARCHITECTURE CONFIRMED — READY TO BUILD.**

# DONNA Extended Context Loader — Sprint 742B

**Date:** 2026-05-24  
**Sprint:** 742B — DONNA Extended Context Loader V1  
**Status:** Four context domains wired live — no migrations required

---

## What Was Wired (Live as of Sprint 742B)

### New loaders in `src/lib/donna/extendedContextLoaders.ts`

All four loaders are read-only, fail safely with `insufficient_data`, and are capped at 30 records each.

| Loader | Table | Academy scope field | Key fields surfaced |
|---|---|---|---|
| `loadPlayerCurriculumStates` | `player_curriculum_states` | `academy_id` | `current_level_id`, `advancement_eligible`, `enrolled_at`, `last_evaluated_at` |
| `loadAssessmentsSummary` | `assessments` | `academy_id` | `type`, `assessed_date`, `promotion_ready`, `overall_score` |
| `loadGroupsSummary` | `groups` | `academy_id` | `name`, `level_id`, `track`, `max_players` |
| `loadTemplatesSummary` | `templates` | `academy_id` | `name`, `template_type`, `status`, `curriculum_level_key`, `curriculum_stage_key`, `total_duration_min`, `track` |

### New fields in `DirectorDonnaContext`

All fields wired into `src/lib/donna/directorDonnaContext.ts` sections 7b–7e.

#### Counts
| Field | Source | Meaning |
|---|---|---|
| `playerCurriculumStateCount` | `player_curriculum_states` (COUNT) | Total players with a curriculum state record |
| `advancementEligibleCount` | `player_curriculum_states.advancement_eligible = true` | Players flagged as ready to advance |
| `groupCount` | `groups` (active count) | Number of active groups |
| `templateCount` | `templates` (active count, capped at 30) | Active template count |
| `assessmentCount` | `assessments` (COUNT) | Total assessment records |
| `recentAssessmentCount` | `assessments.assessed_date >= 30 days ago` | Assessments in last 30 days |

#### Context availability flags
| Field | Type | Meaning |
|---|---|---|
| `playerProgressContextAvailable` | `boolean` | True when player_curriculum_states returned live data |
| `assessmentContextAvailable` | `boolean` | True when assessments returned live data |
| `groupContextAvailable` | `boolean` | True when groups returned live data |
| `templateContextAvailable` | `boolean` | True when templates returned live data |

These flags let DONNA answer context-availability questions honestly:
- "I can see player curriculum state data for this academy."
- "I can see your groups and templates now."
- "I do not yet have assessment data for this academy."
- "That recommendation requires template coverage data, which is not yet available."

#### Summary arrays (capped at 30 each)
| Field | Type | Meaning |
|---|---|---|
| `playerCurriculumStateSummaries` | `PlayerCurriculumStateSummary[]` | Player IDs, level IDs, advancement eligibility |
| `groupSummaries` | `GroupSummary[]` | Active group names, level IDs, tracks |
| `templateSummaries` | `TemplateSummary[]` | Active template names, types, curriculum keys |
| `assessmentSummaries` | `AssessmentSummary[]` | Recent assessments with type, date, promotion_ready |

### New academy risk signal

`advancementEligibleCount > 0` now generates an `AcademyRisk` entry:
- Signal: "Advancement-eligible players"
- Detail: "N players ready to advance — director action needed"
- Urgency: `high` (≥3 players) or `medium` (<3 players)
- Action href: `/director/players`

### New source labels

Four new entries in `DirectorDonnaContext.sourceLabels`:
- `Player curriculum states` — live / no data
- `Assessments` — live / no data
- `Groups` — live / no data
- `Templates` — live / no data

---

## What Remains Blocked

### Player-progress gap analysis (Player Gate Evidence)

**Block reason:** Requires `player_requirement_progress`, `curriculum_requirements`, and related tables from migrations 041–044 and 059–060. These have not been applied to the live database.

**Blocked signals:**
- Players stalled at a level with no recent gate evidence
- Gate threshold not met for N players after M sessions
- Level where `advancement_eligible = true` for multiple players

**Required migrations to unblock:**
- `041_requirement_domains.sql`
- `042_requirement_domain_seed.sql`
- `043_orange_ball_starter_requirements.sql`
- `044_player_requirement_progress_bootstrap.sql`
- `059_gate_evidence.sql`
- `060_gate_status_repair.sql`

### Template-to-player-level gap analysis

**Block reason:** `templates.curriculum_level_id` exists in the DB schema (typed) but linking it meaningfully to `player_curriculum_states.current_level_id` requires joining via `curriculum_levels`. No migration needed — but DONNA does not yet build this join. A future sprint can build `loadTemplateLevelCoverageGaps()` using existing data.

### Assessment-to-curriculum-state linking

**Block reason:** No direct FK between `assessments` and `player_curriculum_states`. Joining by `player_id` is possible but not yet built. A future sprint can compute "players with curriculum state but no recent assessment" using both loaded summaries.

### DONNA draft submission from chat

**Block reason:** `proposed_actions.voice_command_id` is NOT NULL. DONNA cannot submit a proposed_action row from chat without a `voice_commands` row reference. This is the biggest Godmode blocker — not addressed by this sprint.

---

## Architecture Notes

### rawDb pattern usage

`loadPlayerCurriculumStates`, `loadAssessmentsSummary`, and `loadTemplatesSummary` use `rawDb = db as any` to avoid TS2589 (Supabase type inference recursion limit). This is the established pattern per `docs/AI_BACKEND_RULES.md` rule 4. `loadGroupsSummary` follows the clean typed pattern from `groupHealthLoader.ts` — no cast needed.

### Assessment pipeline health

The `assessments` table has no `status` column. The `recentAssessmentCount` (assessments with `assessed_date` in last 30 days) is used as a proxy for pipeline health. A director with 0 recent assessments and many players is a signal worth surfacing.

### Global vs. academy-scoped data

| Table | Scope |
|---|---|
| `player_curriculum_states` | Academy-scoped (`academy_id`) |
| `assessments` | Academy-scoped (`academy_id`) |
| `groups` | Academy-scoped (`academy_id`) |
| `templates` | Academy-scoped (`academy_id`) |

All four loaders scope queries by `academy_id`. No cross-academy data leakage is possible.

---

## Updated Godmode Readiness

| Dimension | Before 742B | After 742B | Change |
|---|---|---|---|
| Live data coverage | 5/10 | 7/10 | +2: all 4 missing tables now in context |
| Action draft completeness | 4/10 | 4/10 | No change |
| Approval routing safety | 7/10 | 7/10 | No change |
| Evidence graph | 2/10 | 2/10 | Still blocked by migrations 041-044 |
| Impact preview | 4/10 | 5/10 | +1: template coverage data now available |
| Audit / rollback | 5/10 | 5/10 | No change |
| Role permissions | 7/10 | 7/10 | No change |
| Data quality guardian | 3/10 | 4/10 | +1: group/template gaps now detectable |
| UI workflow integration | 5/10 | 5/10 | No change |
| Cross-domain reasoning | 4/10 | 5/10 | +1: DONNA can now cross-reference players, groups, templates |
| **Overall** | **4.7/10** | **5.1/10** | **+0.4** |

---

## Recommended Next Sprint

**Sprint 742C — DONNA Curriculum-to-Template Coverage Gap Detector V1**

Using the now-available `playerCurriculumStateSummaries` (current level IDs per player) and `templateSummaries` (curriculum_level_key per template), DONNA can compute:
- "How many players are at Orange 2 but there is no template for Orange 2?"
- "Which levels have active players but no assigned class template?"

This requires no new DB queries — only logic over the already-loaded summaries.

Pre-requisites: Sprint 742B (this sprint). No migrations.

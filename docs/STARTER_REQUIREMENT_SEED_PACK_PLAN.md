# Starter Requirement Seed Pack — Language Plan

**Sprint:** 32
**Date:** 2026-04-30
**Mode:** Planning and documentation only. No migration. No seed SQL. No UI. No player data.
**Author:** Claude Code (planning session)

---

## 1. Purpose

This document defines the starter requirement language for future seeding into
`curriculum_track_requirements`. It is a planning artefact — not a migration file,
not a seed script, and not a UI specification.

Sprint 30 created the four requirement tables. Sprint 31 seeded the three global
pathway domain records (`skill`, `competition`, `fitness`). This sprint designs the
content that will eventually populate `curriculum_track_requirements` — the named,
per-level, per-pathway requirement rows that form the foundation of the player
progression map.

The goal is to lock in clear, coach-readable requirement language before any SQL
is written, so that the seeding sprint (Sprint 33 or later) can proceed from an
approved vocabulary rather than generating language mid-migration.

---

## 2. Design Principles

These principles govern every requirement row in the starter pack.

### 2.1 Coach-readable, parent-safe later
Requirements must be written so a coach can read them and immediately understand
what to observe. Parent-facing language is a future concern (Sprint 35+); the
current layer is internal. When parent visibility is eventually enabled, the
`description` field on each requirement will be the candidate for display — so
write descriptions with that future read in mind. Avoid jargon, acronyms, or
references to internal tooling.

### 2.2 Evidence-based
Every requirement must be observable and evidenceable by a real coaching action —
coach observation, session outcome, assessment, attendance record, or match result.
Do not write requirements that can only be evaluated subjectively by a single
evaluator with no audit trail.

### 2.3 Requirements do not auto-promote players
No requirement in this pack will trigger automatic level advancement. The
`evidence_policy` for all starter rows is `coach_confirmed` — a coach must
explicitly confirm a requirement is met. Director approval remains the gate
for level movement via the existing `evaluate_player_curriculum_advancement()`
function.

### 2.4 Connects to all three pathways
Requirements must be spread across Skill, Competition, and Fitness domains — not
stacked in Skill only. The three domain buckets exist precisely because player
development is multi-dimensional. A player who is technically advanced but
competition-avoidant should not appear "complete" because their Skill requirements
are met.

### 2.5 Generic enough for global default, flexible enough for override
Starter requirements use `source_type = 'global_default'` and `academy_id = NULL`.
They are the minimum viable starting point for any academy. Requirements must not
be so specific that they only make sense for one academy's curriculum (e.g., a
specific drill name or a specific UTR target). Academies can add override rows
later via `academy_id IS NOT NULL` rows.

### 2.6 Avoid over-specific claims before real academy validation
Do not set numeric targets (e.g., `target_value = 60`, `unit = '%'`) until the
values have been validated against real player populations. Starter requirements
should lean toward `requirement_type = 'qualitative'` or `'coach_confirmed'`
where the measurement is the coach's professional judgment, not a fixed number.
Attendance-based requirements may use quantitative targets where the metric is
obvious (e.g., sessions attended).

### 2.7 Supports red/orange/green/yellow/high-performance progression later
The starter pack focuses on Orange Ball. The same column schema and language
conventions established here must extend cleanly to the other stages. Do not
introduce Orange-only columns, custom enums, or ad hoc fields. Use only the
columns that exist in `curriculum_track_requirements`.

### 2.8 Not pressure, not ranking, not fake analytics
Requirements should feel like a transparent development map — "here is what you
are working on and why it matters" — not a pass/fail grade or a ranking system.
Language should avoid negative framing ("must not fail", "cannot miss") and use
constructive framing ("demonstrates", "shows consistent", "can apply").

---

## 3. Scope of Starter Pack V1

### Decision: Option A — Orange Ball 1–3 only

**Recommended option:** Option A. Seed starter requirements for Orange Ball levels
only (`orange_development` stage, level_numbers 1–3).

**Why Option A:**

Orange Ball is the right proving ground for this layer:

- It is concrete enough to write real requirements. Red Ball involves very young
  beginners where the requirements are basic movement and cooperation; those levels
  need careful developmental framing that is better done after Orange is validated.
  Green+ involves competitive players where requirement language needs UTR context
  and club-specific competition pathways.

- It aligns with the existing curriculum seed. `Orange 1 — Rally`, `Orange 2 —
  Direction`, and `Orange 3 — Construction` have clear level identities that map
  directly to Skill, Competition, and Fitness requirement categories. The level
  names themselves signal what the development focus is.

- It is realistic for first-pass validation. Three levels × three domains × 3–5
  requirements each = approximately 27–45 requirement rows. That is enough to be
  meaningful but small enough for a director (e.g., Brian) to review and approve
  before broader seeding.

- It covers the full stage lifecycle in one sprint. Seeding one complete stage
  (not just one level) gives the system a meaningful structure to display without
  being overwhelming.

**Why not Option B (global starter across all levels):**
A global seed across 15 levels × 3 domains would produce 135–225 requirement rows
before any academy validation. That is too much content to approve before the
system is real.

**Why not Option C (language library first):**
A requirement-language library without level assignments would be a doc-only
artefact that has to be re-translated into SQL anyway. Option A goes directly to
the migration-ready structure, just with Orange Ball scope.

### Levels in scope

| stage | level_number | display_name | sort_order |
|---|---|---|---|
| `orange_development` | 1 | Orange 1 — Rally | 4 |
| `orange_development` | 2 | Orange 2 — Direction | 5 |
| `orange_development` | 3 | Orange 3 — Construction | 6 |

These exist in `curriculum_levels`. The seed migration can look them up by
`(stage = 'orange_development', level_number = 1/2/3)`.

---

## 4. Requirement Model

Each row in `curriculum_track_requirements` has the following fields. This section
defines how each field is used in the starter pack.

| Field | Starter pack convention |
|---|---|
| `academy_id` | `NULL` — global default |
| `curriculum_level_id` | FK looked up by `(stage, level_number)` |
| `requirement_domain_id` | FK looked up by `key IN ('skill', 'competition', 'fitness')` |
| `title` | Short, imperative coach-readable label (≤ 80 chars) |
| `description` | 1–2 sentence explanation of what is observed and why it matters. Written to be parent-safe in future. |
| `requirement_type` | `'qualitative'` for observation-based; `'attendance'` for session/match counts |
| `measurement_method` | Free text: "Coach observes in session", "Session attendance record", "Match result" |
| `target_value` | `NULL` for qualitative requirements; integer for attendance/count types |
| `unit` | `NULL` for qualitative; `'sessions'` or `'matches'` for quantitative |
| `pass_condition` | `'coach_confirmed'` for qualitative (free text describing the standard) |
| `evidence_policy` | `'coach_confirmed'` for all starter rows — no automatic promotion |
| `is_required` | `true` for core requirements; `false` for "nice to have" bonus criteria |
| `display_order` | Increments by 10 within each domain per level (10, 20, 30, …) |
| `is_parent_visible_default` | `false` — all starter rows default to staff-only visibility |
| `is_player_visible_default` | `false` — all starter rows default to staff-only visibility |
| `source_type` | `'global_default'` |
| `source_id` | `NULL` |
| `version` | `1` |
| `is_active` | `true` |

---

## 5. Starter Requirement Language

### Orange 1 — Rally (`orange_development`, level_number 1)

Level identity: Players are developing consistent rallying from the baseline. The
focus is on reliable stroke mechanics, basic rally extension, and emotional
regulation in low-stakes play. UTR range 1.5–2.0.

---

#### Skill Path — Orange 1

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Preparation and ready position | Player demonstrates a consistent split step and ready stance before each shot, with racket in front and weight balanced. This is the foundation every stroke is built on. | qualitative | Coach observation in session | Coach confirms the player uses a ready stance before at least 7 out of 10 observed shots across two sessions | true |
| 2 | Grip organisation | Player can organise their grip appropriately for forehand and backhand strokes without assistance. Grip adjustment between wings is visible and deliberate. | qualitative | Coach observation in session | Coach confirms the player self-corrects grip without prompting in at least one full session | true |
| 3 | Rally consistency | Player can sustain a baseline-to-baseline cooperative rally of 5 or more balls. The focus is on getting the ball back, not winners. | qualitative | Coach-directed rally drill | Coach confirms the player demonstrates 5+ ball rally control across at least two separate session drills | true |
| 4 | Basic directional intent | Player can direct the ball to a general target zone (e.g., crosscourt vs down-the-line) when given a clear instruction before the drill. | qualitative | Coach-directed drill with target zone | Coach confirms the player executes the requested direction with visible intent on at least half of drill attempts | false |

---

#### Competition Path — Orange 1

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Scoring awareness | Player can score a game and a set correctly without coach prompting. This is the baseline for participating in any match format. | qualitative | Match play or scoring drill | Coach confirms the player self-scores accurately through a full set without corrections needed | true |
| 2 | Point-start routine | Player uses a consistent pre-point ritual (e.g., bounce the ball before serving, take a breath before returning). Routines help players reset and stay focused. | qualitative | Coach observation during point play | Coach confirms player demonstrates a visible pre-point routine in at least two observed competitive drills | true |
| 3 | Reset after errors | Player shows a brief reset behaviour after an unforced error (e.g., bounce racket strings, take a breath, move feet) rather than extended frustration. | qualitative | Coach observation during match play or competitive drills | Coach confirms player demonstrates a reset behaviour independently in at least one observed match play session | true |

---

#### Fitness Path — Orange 1

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Athletic ready position | Player maintains an athletic stance at the baseline between points — feet active, weight forward, racket ready. This indicates physical readiness and attentiveness. | qualitative | Coach observation in session | Coach confirms the player holds an active athletic stance between points in at least one full session | true |
| 2 | Recovery after each shot | Player returns toward a recovery position after each shot rather than standing and watching the ball. Consistent recovery underpins all future movement patterns. | qualitative | Coach observation in session and drills | Coach confirms the player makes a visible recovery move after shots across two consecutive sessions | true |
| 3 | Effort and readiness | Player arrives to sessions ready to participate, completes warm-up, and maintains visible effort throughout. Consistent effort at this stage is more important than results. | attendance | Session attendance and coach observation | Player completes 8 of 10 consecutive sessions with full participation as noted by coach | false |

---

### Orange 2 — Direction (`orange_development`, level_number 2)

Level identity: Players are developing intentional directional control. The focus
is on directing the ball to specific targets, developing serve reliability, and
beginning to understand why shot selection matters. UTR range 2.0–2.5.

---

#### Skill Path — Orange 2

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Directional forehand | Player can consistently direct a forehand crosscourt or down-the-line on request. Directional control shows the stroke is becoming intentional rather than reactive. | qualitative | Directional drill with target zones | Coach confirms the player successfully directs the forehand to the requested zone at least 6 out of 10 attempts across two sessions | true |
| 2 | Directional backhand | Player can consistently direct a backhand crosscourt or down-the-line on request. Both wings should have basic directional capability at this level. | qualitative | Directional drill with target zones | Coach confirms the player successfully directs the backhand to the requested zone at least 5 out of 10 attempts across two sessions | true |
| 3 | Serve into the service box | Player can execute a serve that lands in the correct service box reliably. Placement is secondary to reliability at Orange 2. | qualitative | Serve practice drill | Coach confirms the player lands 6 of 10 first serves in-court across two consecutive serving sessions | true |
| 4 | Footwork into the shot | Player moves toward the ball using recognisable footwork (not just reaching) and recovers toward baseline position after contact. | qualitative | Coach observation during rally drills | Coach confirms the player demonstrates approach footwork and recovery in at least one full session | true |
| 5 | Rally under directional constraint | Player can maintain a 5+ ball rally while attempting to direct the ball crosscourt. Combining consistency with direction is the key Orange 2 skill integration. | qualitative | Directed cooperative rally drill | Coach confirms the player demonstrates directional rally control in at least two drill sets | false |

---

#### Competition Path — Orange 2

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Basic tactical pattern | Player uses at least one repeatable pattern intentionally during point play (e.g., rally crosscourt then attack down-the-line). Patterns show tactical awareness is developing. | qualitative | Coach observation during competitive drills or match play | Coach confirms the player has demonstrated a recognisable tactical pattern across at least two observed point-play sessions | true |
| 2 | Sportsmanship in match play | Player demonstrates appropriate behaviour during competitive drills and match play — accepts calls, encourages opponents, and maintains composure. | qualitative | Coach observation during match play | Coach confirms the player has met the academy's sportsmanship standard across all observed match play at Orange 2 | true |
| 3 | Serve reliability in game context | Player can put at least 2 of 3 first serves in-court during a real game situation (not just drill isolation). Serve reliability in competition is different from drill performance. | qualitative | Observed game or match play | Coach confirms the player demonstrates serve reliability during at least one game set or tiebreak | false |

---

#### Fitness Path — Orange 2

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Balance at finish position | Player demonstrates balance at the end of each stroke (not falling off to one side) before making the recovery move. Balance at finish is a prerequisite for consistent directional control. | qualitative | Coach observation during stroke drills | Coach confirms the player finishes strokes in balance at least 7 of 10 observed contacts across two sessions | true |
| 2 | Lateral coverage | Player can reach wide balls using lateral footwork rather than reaching across the body. Lateral mobility at Orange 2 shows developing court coverage. | qualitative | Wide-ball drill or movement exercise | Coach confirms the player uses lateral footwork to reach wide balls in at least one movement-focused session | true |
| 3 | Session-length effort | Player maintains visible effort and participates fully across the complete duration of a standard session. Physical stamina at Orange 2 should support 60–75 minute sessions. | attendance | Session observation | Coach confirms the player maintains full participation across 8 of 10 consecutive sessions | false |

---

### Orange 3 — Construction (`orange_development`, level_number 3)

Level identity: Players are beginning to construct points intentionally — using
serve, return, and groundstrokes as parts of a deliberate sequence. The focus is
on connecting shots into patterns and maintaining quality under mild pressure. UTR
range 2.5–3.5. This is the transition level into Green Performance.

---

#### Skill Path — Orange 3

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Three-shot pattern execution | Player can execute a deliberate 3-shot sequence (e.g., serve to ad court, return to middle, forehand attack crosscourt) with visible intent in competitive drills. | qualitative | Pattern drill or competitive point play | Coach confirms the player demonstrates at least one 3-shot pattern intentionally across two observed sessions | true |
| 2 | Technique under pressure | Player maintains their stroke mechanics during competitive drills and tiebreak situations, not just in cooperative rallies. | qualitative | Competitive drill observation | Coach confirms the player's technique is consistent between cooperative and competitive contexts across three sessions | true |
| 3 | Serve placement intention | Player can aim their first serve to either the deuce or ad-court service box with visible intention — not just serving in. | qualitative | Serve drill with target zone | Coach confirms the player successfully serves to the requested side at least 5 of 10 times across two serving sessions | true |
| 4 | Shot transition — defence to offence | Player can recover from a defensive position (wide or behind baseline) and transition back to a neutral or attacking position on the next shot. | qualitative | Defensive drill or live point observation | Coach confirms the player makes a successful defensive-to-offensive transition in at least two competitive drill sequences | false |

---

#### Competition Path — Orange 3

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Offensive pattern in match play | Player uses at least one offensive pattern consistently during match play — not just in drill conditions. The pattern must be recognisable and intentional. | qualitative | Match play or competitive drill observation | Coach confirms the player demonstrates an offensive pattern in at least two observed match play sessions | true |
| 2 | Reset under match pressure | Player applies a reset routine (breath, bounce, ready) after errors during real match situations, not just when cued by a coach. | qualitative | Coach observation during match play | Coach confirms the player self-applies the reset routine during match play in at least two sessions | true |
| 3 | Internal match play participation | Player has participated in internal challenge matches or equivalent competitive formats at the academy. Match exposure at Orange 3 is essential for progression. | attendance | Match attendance or session record | Player has completed at least 2 internal match play sessions or challenge match events during the Orange 3 level period | true |
| 4 | Opponent weakness awareness | Player can identify and attempt to exploit an opponent's weaker side (e.g., consistently targeting the backhand) during match play. This indicates basic tactical reading. | qualitative | Coach observation during match play | Coach confirms the player has demonstrated a deliberate exploitation attempt in at least one observed match | false |

---

#### Fitness Path — Orange 3

| # | Title | Description | Type | Method | Pass condition | Required |
|---|---|---|---|---|---|---|
| 1 | Sprint mechanics | Player demonstrates basic sprint mechanics for court coverage — first step explosiveness, change of direction without stumbling, deceleration before contact. | qualitative | Movement drill or coach observation | Coach confirms the player demonstrates functional sprint mechanics in at least one movement-focused session | true |
| 2 | Full session stamina | Player can maintain effort and quality across a 90-minute session without significant drop-off in the final third. Orange 3 players are approaching Green, which requires higher volume. | attendance | Coach observation | Coach confirms the player maintains full-session effort across 8 of 10 consecutive sessions | true |
| 3 | Between-point recovery routine | Player uses the time between points appropriately — towel/drink if available, takes a breath, repositions feet, takes the right amount of time. | qualitative | Coach observation during match play or competitive drills | Coach confirms the player has a visible between-point routine in at least one competitive session | false |

---

## 6. Parent-Safe Language Notes

Parent visibility is `false` by default for all starter requirements. When it is
eventually enabled (Sprint 35+), the following framing applies per domain.

### Skill Path
**What the child is working on:** "Your child is developing the technical skills to
play tennis with control and intention."
**Why it matters:** Stroke mechanics established now are the foundation for all
future development. Early habits are much easier to build than correct later.
**What evidence supports it:** Coach observations during regular training sessions.
**What helps them move forward:** Consistent attendance, practising the ready position
and footwork at home if interested, and avoiding overloading with unsupervised
technique correction.

### Competition Path
**What the child is working on:** "Your child is learning how to compete — scoring,
routines, and handling the emotions that come with match play."
**Why it matters:** Competitive experience in a low-pressure environment builds the
emotional toolkit for future tournament play. It is not about winning at this stage.
**What evidence supports it:** Coach observation during match play sessions and
competitive drills.
**What helps them move forward:** Encouraging the child without discussing match results
in detail, normalising errors as part of learning, and supporting attendance at any
internal competition sessions the academy schedules.

### Fitness Path
**What the child is working on:** "Your child is building the physical habits and
movement quality that make tennis enjoyable and safe."
**Why it matters:** Good movement habits at this age reduce injury risk and create
the athletic base for higher-intensity training in future stages.
**What evidence supports it:** Attendance records and coach observation during
training.
**What helps them move forward:** Consistent sleep, hydration before sessions,
and arriving on time so warm-up is not missed.

---

## 7. Evidence Policy

### Evidence types defined in the schema

The `requirement_evidence_links` table supports these `evidence_type` values:

| Type | Description |
|---|---|
| `coach_observation` | A note or structured observation from a coach in `coach_observations` |
| `assessment` | A formal assessment score from `assessments` |
| `attendance` | A session attendance record from `session_attendance` |
| `session_result` | A per-session outcome row from `player_outcomes` |
| `match_result` | A competitive match result (future table) |
| `player_priority` | A priority row linked to the requirement (from `player_priorities`) |
| `manual_note` | A manually entered evidence summary by a director or head coach |
| `app_homework` | Future: homework assigned and completed through the app |

### Evidence rules for the starter pack

**Coach observations** are the primary evidence source for qualitative requirements.
They can support a requirement but cannot automatically mark it `met`. The
`evidence_policy = 'coach_confirmed'` setting means a coach must explicitly confirm
the requirement via `player_requirement_progress.coach_confirmed_by`. Evidence count
increments when a link is created, but status only changes when confirmed.

**Attendance records** may automatically contribute progress toward attendance-based
requirements (`requirement_type = 'attendance'`). However, the `evidence_policy`
for starter attendance requirements remains `'coach_confirmed'` — session attendance
is a necessary but not sufficient signal on its own.

**Assessment evidence** is valid for qualitative confirmation but is not required
for most Orange Ball starter requirements. Formal assessments (`assessments` table)
are the primary source for quantitative targets in higher stages.

**Director confirmation** is required before any player advances between levels.
`player_requirement_progress.director_confirmed_by` is only populated when a director
explicitly reviews and approves a promotion decision via the existing
`evaluate_player_curriculum_advancement()` workflow.

**Parent-visible evidence** must have `is_parent_safe = true` on the
`requirement_evidence_links` row. Coach observations with `is_private = true` must
not be marked parent-safe. When a requirement is eventually made parent-visible,
parents see only `evidence_count` and a safe summary — never raw observation text.

---

## 8. Seed Migration Preview

Sprint 33 (or a later approved sprint) will create the seed migration. The
migration will not be created in Sprint 32. This section describes the structure
so Sprint 33 can proceed without additional planning.

### Migration structure

```sql
-- ACADEMY OS — MIGRATION 043: ORANGE BALL STARTER REQUIREMENTS
-- Seeds curriculum_track_requirements for orange_development levels 1–3.
-- source_type = 'global_default', academy_id = NULL, version = 1, is_active = true
-- Idempotent via ON CONFLICT on the partial unique index:
--   idx_curriculum_track_req_global_unique
--   (curriculum_level_id, requirement_domain_id, title, version) WHERE academy_id IS NULL

-- Step 1: load level and domain IDs into temp variables
DO $$
DECLARE
  v_orange1_id UUID;
  v_orange2_id UUID;
  v_orange3_id UUID;
  v_skill_id   UUID;
  v_comp_id    UUID;
  v_fit_id     UUID;
BEGIN
  SELECT id INTO v_orange1_id FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 1;
  SELECT id INTO v_orange2_id FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 2;
  SELECT id INTO v_orange3_id FROM curriculum_levels
    WHERE stage = 'orange_development' AND level_number = 3;

  SELECT id INTO v_skill_id FROM curriculum_requirement_domains WHERE key = 'skill';
  SELECT id INTO v_comp_id  FROM curriculum_requirement_domains WHERE key = 'competition';
  SELECT id INTO v_fit_id   FROM curriculum_requirement_domains WHERE key = 'fitness';

  -- Step 2: insert rows with ON CONFLICT DO NOTHING (or DO UPDATE if updating is safe)
  INSERT INTO curriculum_track_requirements (
    curriculum_level_id, requirement_domain_id, title, description,
    requirement_type, measurement_method, pass_condition,
    evidence_policy, is_required, display_order,
    is_parent_visible_default, is_player_visible_default,
    source_type, version, is_active
  ) VALUES
    (v_orange1_id, v_skill_id, 'Preparation and ready position', '...', 'qualitative', 'Coach observation in session', 'coach_confirmed', 'coach_confirmed', true, 10, false, false, 'global_default', 1, true),
    -- ... remaining rows
  ON CONFLICT DO NOTHING;
END $$;
```

### ON CONFLICT strategy
Use `ON CONFLICT DO NOTHING` for initial seeding. The partial unique index
`idx_curriculum_track_req_global_unique` on
`(curriculum_level_id, requirement_domain_id, title, version) WHERE academy_id IS NULL`
enforces uniqueness for global rows. Reruns are safe.

If requirements need to be updated after initial seeding, prefer incrementing
`version` and setting `is_active = false` on the old row rather than using
`ON CONFLICT DO UPDATE` on production data.

---

## 9. Risks and Open Questions

### Curriculum level naming
`curriculum_levels.display_name` values (`Orange 1 — Rally`, etc.) are human-readable.
The migration should look up levels by `(stage, level_number)` — not by `display_name`
— to avoid failures if display names are ever edited.

### Parent-safe visibility default
All starter requirements default to `is_parent_visible_default = false` and
`is_player_visible_default = false`. This is the correct conservative default.
The director must explicitly enable visibility per requirement after reviewing
the language with the academy. Do not change these defaults without director
approval.

### Human validation before seeding
The requirement language in this document has not been reviewed by a coach or
academy director. Specific criteria (e.g., "6 of 10 attempts", "8 of 10 sessions")
are placeholder standards that represent reasonable starting points but must be
validated against real player populations at the academy level before being
treated as authoritative.

### Too many requirements is worse than too few
The starter pack aims for 3–5 Skill, 2–4 Competition, and 2–4 Fitness requirements
per level. If reviewing the language reveals that requirements overlap or repeat,
reduce them. A player seeing 15 requirements at one level is more likely to be
overwhelmed than motivated.

### Competition and fitness language
Competition path requirements risk implying that match results determine progression.
They do not. The language in this document is framed around participation, behaviour,
and tactical awareness — not outcomes. This framing must be preserved in any edits
made before seeding.

### Evidence linking is its own sprint
This plan defines which evidence types are valid. The UI and server actions for
actually linking evidence to requirements are Sprint 36 scope. Do not implement
evidence linking as part of Sprint 33.

---

## 10. Recommended Next 5 Sprints

| Sprint | Title | Scope |
|---|---|---|
| 33 | Orange Ball Starter Requirement Seed Migration | Create `043_orange_starter_requirements.sql`. Seed the 27–45 requirement rows for Orange 1–3 after human approval of this document. No UI. |
| 34 | Player Requirement Progress Bootstrap V1 | Create the query and server action to generate `player_requirement_progress` rows for players currently at an Orange Ball level. All rows initialised to `status = 'not_started'`. |
| 35 | Player Requirement Progress Read-Only UI | Update `PlayerProgressionRequirements.tsx` to display Skill / Competition / Fitness sections with real requirement rows, status chips, and evidence counts from the view. |
| 36 | Evidence-to-Requirement Link Drafts V1 | Allow coaches to link a `coach_observation` or `session_result` to a requirement via a server action. Updates `evidence_count` on the progress row. |
| 37 | Requirement Confirmation Workflow V1 | Allow directors and head coaches to mark a requirement as `met` or `waived`. Records `coach_confirmed_by` or `director_confirmed_by`. Writes to `audit_logs`. |

---

## 11. Final Recommendation

**Human approval is required before Sprint 33 seeds these requirements.**

The requirement language in this document is ready for human review. It should not
be seeded into the database until a director (or Brian) has reviewed:

1. The list of requirements per level — are these the right things to measure?
2. The pass conditions — are these realistic standards for the academy's Orange Ball
   cohort?
3. The competition path language — does it feel developmentally appropriate and
   non-pressuring?
4. The fitness path language — does it match what coaches actually observe?

Once approved, Sprint 33 should seed exactly the rows defined here — no additions,
no changes without a new review. Academy-specific overrides can be added via
academy-scoped rows after the global defaults are live.

**Sprint 33 is the right next step if and only if this document has been reviewed
and approved.** If approval is delayed, Sprint 33 scope can shift to the
`player_requirement_progress` bootstrap (currently Sprint 34) and the Orange Ball
seed can follow once language is locked.

# Curriculum Ripple Architecture

**Sprint:** 461 — Curriculum Ripple Architecture Audit V1
**Date:** 2026-05-16
**Purpose:** Defines how curriculum changes safely propagate across the academy system — requirements, player readiness, session templates, coach briefs, parent/player language, and DONNA recommendations — without ever directly mutating live records.

---

## Core Invariant

> Curriculum changes are always **proposed**, never applied automatically.
> A director or head coach must explicitly approve every curriculum change.
> No player record, attendance record, or official session record is ever modified as a side effect of a curriculum edit.

---

## What Is a Curriculum Change?

A curriculum change is any modification to:

| Object | Examples |
|---|---|
| `curriculum_levels` | Rename a level, change description, reorder |
| `curriculum_drills` | Add/edit/remove a drill from a level |
| `curriculum_requirements` (gates) | Add/edit/remove a gate requirement |
| `curriculum_content_items` | Add/edit player missions, parent guidance, coach cues |
| `curriculum_tracks` | Add/edit a pathway or track |
| `academy_curriculum_versions` | Create or activate a new academy override version |
| Academy-level overrides | Focus tag changes, emphasis shifts, scope modifications |

Changes may be **global** (master curriculum), **academy-scoped** (academy version override), or **session-scoped** (one-time template modification).

---

## Ripple Map — What Is Affected

When a curriculum object changes, the following downstream objects may be affected. All impacts are **preview-only** until approved.

### 1. Requirements / Gate Readiness

| Source Change | Ripple |
|---|---|
| Gate requirement added | Players currently at that level now have a new unmet gate — readiness score may drop |
| Gate requirement removed | Players with evidence for that gate may show `evidence_threshold_met` with no gate to close |
| Gate threshold changed | Players at or near threshold may move between `observing` and `evidence_threshold_met` |
| Gate renamed | No functional impact — display labels update |
| New level added | Players whose readiness was relative to the old top level need re-evaluation |

**Safety:** No `player_gate_status` row is ever updated automatically from a curriculum change. Only `recordGateEvidenceAction` writes to that table, and only on explicit coach submission.

---

### 2. Player Readiness / Advancement Eligibility

| Source Change | Ripple |
|---|---|
| Gate requirement added | `advancement_eligible` may flip false for players who had all gates met |
| Gate requirement removed | `advancement_eligible` may flip true for players who were blocked only by that gate |
| Level sequence changed | Players enrolled at the renamed/reordered level remain enrolled — no level move triggered |
| New pathway added | Players are not auto-enrolled — director must assign via `CurriculumLevelPickerCard` |

**Safety:** `finalize_player_placement()` is the only function that activates a player. `player_curriculum_states` rows are never touched by curriculum edit actions.

---

### 3. Session Templates

| Source Change | Ripple |
|---|---|
| Drill added to level | Template blocks linked to that level can include the new drill |
| Drill removed from level | Template blocks referencing the removed drill lose curriculum alignment |
| Level renamed | Templates with `curriculum_level_id` linking to that level should display the new name |
| New level added | Existing templates remain unchanged; new templates can be assigned the new level |

**Safety:** `template_blocks` and `session_blocks` are always separate tables. Curriculum changes never modify session blocks directly. Template changes are advisory — they surface in the "template impact preview" but do not overwrite existing template records.

---

### 4. Coach Briefs

| Source Change | Ripple |
|---|---|
| Focus area changed for level | Coach brief suggestion for that level's group updates |
| Drill updated (new cues, progressions) | Coach brief drill cues should reflect the updated content |
| Gate requirement added | Coach brief may recommend observing the new gate behavior |
| Drill removed | Coach brief should stop referencing the removed drill |

**Safety:** Coach briefs are generated dynamically from current curriculum data. No brief is persisted to the database. A curriculum change causes the next generated brief to reflect the new state. No existing `voice_notes`, `coach_observations`, or `proposed_actions` records are modified.

---

### 5. Parent / Player Language

| Source Change | Ripple |
|---|---|
| Level name changed | Parent-safe level references in generated drafts update |
| Player mission content updated | New missions appear in director preview; not sent until director approves |
| Parent guidance content updated | Updated language available in parent guidance preview panel |
| Gate requirement added | Player mission may reference the new skill to develop |
| Drill removed from level | Player missions referencing that drill should be updated or retired |

**Safety:** Parent/player content is always **director-reviewed before exposure**. `is_parent_visible` and `is_player_visible` flags on `curriculum_content_items` default to `false`. No content reaches the parent or player portal automatically.

---

### 6. DONNA Recommendations

| Source Change | Ripple |
|---|---|
| Gate requirement added | DONNA attention-risk logic may surface more players as needing evidence |
| Drill removed | DONNA session suggestion engine should stop recommending the removed drill |
| Level renamed | DONNA responses referencing level names update dynamically |
| New pathway added | DONNA can recommend the new pathway for at-risk players (once data exists) |
| Focus area changed | DONNA weekly COO report section on curriculum coverage reflects new focus |

**Safety:** DONNA proposals are always advisory. DONNA never updates curriculum records directly. All DONNA outputs go through the review queue as `proposed_actions` with status `pending_review`.

---

## Scope Model (Preview — Sprint 462)

Curriculum changes operate at one of these scopes:

| Scope | Definition | Who Approves |
|---|---|---|
| **Today only** | One-session modification (not persisted to template) | Coach or Director |
| **This session** | Specific session instance, stored in session notes | Director |
| **This group** | All sessions for a specific group | Director |
| **This level** | All sessions and templates for a given curriculum level | Director or Head Coach |
| **This pathway** | All sessions in a curriculum track | Director or Head Coach |
| **Academy-wide** | Academy curriculum version override | Director only |
| **Global/master** | Master curriculum change | System admin only |

---

## Guard Conditions — Never Cross Without Explicit Approval

| Guard | Reason |
|---|---|
| Do not auto-advance players when a gate is removed | `finalize_player_placement()` is the only promotion path |
| Do not overwrite existing session blocks | `session_blocks` are independent from `template_blocks` |
| Do not publish parent/player language without director review | `is_parent_visible` defaults to false |
| Do not remove a gate without confirming evidence states | Removing a gate with existing evidence rows creates orphaned records |
| Do not apply academy-wide overrides without director confirmation | Scope must be confirmed before write |
| Do not migrate schema to support curriculum change | Stop and confirm before any migration |

---

## Ripple Safety Pipeline

Every curriculum change follows this pipeline:

```
Director or DONNA Proposes Change
         ↓
Change Scope Confirmed (Sprint 462)
         ↓
Impact Preview Generated (Sprint 463)
         ↓
Override Draft Created (Sprint 464)
         ↓
Director Approves Draft
         ↓
System Applies (execute_approved_action or academy override record)
         ↓
Audit Log Written
```

No step in this pipeline is automatic. Each requires an explicit director action.

---

## Related Architecture Docs

- `docs/ACADEMY_CURRICULUM_RESOLUTION_ENGINE.md` — how curriculum versions and overrides are resolved per context
- `docs/CURRICULUM_CONTENT_MODEL_AUDIT.md` — content item taxonomy and content type definitions
- `docs/DONNA_CURRICULUM_IMPACT_MAP.md` — how DONNA surfaces ripple impacts (this block)
- `docs/LOCKED_MODULES.md` — which curriculum files are locked

---

## Status

This document defines the architecture for Sprints 461–468 (Curriculum Ripple Block).
No runtime code changes are part of this sprint.
All ripple behavior described here is **preview-only** until the execution layer is approved and built.

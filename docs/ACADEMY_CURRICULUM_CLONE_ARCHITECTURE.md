# Academy Curriculum Clone — Architecture

**Sprint:** 61
**Last updated:** 2026-05-01

---

## Overview

Academy OS ships with a **Global Master Curriculum** — a platform-defined developmental spine covering Red Foundation through High Performance. When an academy onboards, the OS creates an **academy-specific curriculum version** that references the global spine. Directors customize their academy's version via voice-driven override drafts, which must be approved before any change applies. The global master is never directly editable by academy directors.

---

## Global Master Curriculum Model

The global curriculum is stored in platform-managed tables with `academy_id IS NULL`:

| Table | Role |
|---|---|
| `curriculum_stages` | Top-level stages (Red, Orange, Green, Yellow, HP) |
| `curriculum_levels` | 15 levels across 5 stages |
| `skill_domains` | 8 skill domains per level |
| `skill_progressions` | Progression criteria per level/domain |
| `progression_rules` | Advancement gates per level |
| `curriculum_track_requirements` | Named requirements per level/track |
| `curriculum_content_items` | Drills, games, skills, assessments (source_type = 'global_default') |
| `curriculum_content_requirement_mappings` | Content → requirement associations |

All global tables have RLS allowing authenticated read. Only platform/migration scripts write to them.

---

## Academy Curriculum Instance Model

When an academy onboards or a director first opens the curriculum screen, the OS checks for an `academy_curriculum_versions` row with `status = 'active'` for that academy. If none exists, a "Create Academy Curriculum Version" flow lets the director initialize one.

The academy version is **lightweight by design**: it records a reference to the global curriculum at clone time, not a physical copy of every row. Academy customizations are stored as `academy_curriculum_overrides` — structured deltas that describe what differs from the global master.

---

## Clone Strategy

**Approach: Reference clone + structured overrides (not physical duplication)**

When an `academy_curriculum_versions` row is created:
- `base_curriculum_version_id` is set to `null` (V1 references the live global curriculum implicitly)
- `cloned_from_global_at` records the timestamp
- `version_number = 1`, `status = 'active'`
- No rows are copied from global tables

When a director customizes:
- An `academy_curriculum_overrides` row is created per change
- The override stores: `target_type`, `target_id`, `override_type`, `scope`, `original_snapshot`, `proposed_change`
- Changes are applied only after director approval → `status = 'applied'`

**Why not physical duplication?**

Physical copy (INSERT ... SELECT) creates a maintenance burden: global curriculum updates would never reach academy clones. Reference + override keeps the academy in sync with global improvements while recording intentional differences.

---

## What Gets Cloned

Nothing is physically copied. The academy version is a named pointer to the global curriculum. All downstream resolution (templates, sessions, player profiles) walks:
1. Check for an active `academy_curriculum_overrides` row for this academy + level/requirement/content
2. If found and status = 'applied': use the override value
3. Else: use the global default

---

## What Remains Global Reference

- `curriculum_stages`
- `curriculum_levels`
- `skill_domains`
- `skill_progressions`
- `progression_rules`
- All `curriculum_content_items` with `source_type = 'global_default'`
- All `curriculum_content_requirement_mappings`

These are read-only from the academy director's perspective.

---

## How Academy Overrides Are Stored

`academy_curriculum_overrides` rows record:
- Which global object is being customized (`target_type`, `target_id`)
- What kind of change (`override_type`: add / update / remove / replace / emphasis_shift)
- What scope (`scope`: academy / level / group / program / session)
- What pathway it applies to (`pathway`: skill / competition / fitness / mixed)
- A snapshot of the original value at override time (`original_snapshot` JSONB)
- The proposed and applied change (`proposed_change`, `applied_change` JSONB)
- Full audit trail: `created_by`, `approved_by`, `applied_by`, timestamps
- Rollback linkage: `rollback_of_override_id`
- Source provenance: `source` (voice / typed / ui), `raw_input`

---

## How Templates Choose Academy Curriculum Version

Templates have a `curriculum_level_id` FK to `curriculum_levels`. When populating session blocks, the block population engine:
1. Checks for applied `academy_curriculum_overrides` for the template's level
2. Uses override values where present
3. Falls back to global `curriculum_content_items` + `curriculum_content_requirement_mappings`

V1 does not implement override-aware block population. This is logged as a known limitation.

---

## How Player Profiles Resolve Curriculum Version

`player_curriculum_states.current_level_id` references `curriculum_levels` (global). Requirement progress, evidence links, and advancement evaluation all use the global requirement IDs.

V1 override resolution for player progress is not implemented. Applied overrides are visible in the academy curriculum version screen but do not yet filter through to individual player requirement displays.

---

## How Parent/Player-Safe Summaries Resolve

Not yet implemented. V1 keeps all curriculum override data director/staff-only. Parent-safe summaries (`parent_level_descriptions`) remain global. A future phase will check for academy overrides before rendering parent-facing content.

---

## Versioning Strategy

- Each academy starts at `version_number = 1`
- Future schema can support `version_number = 2` when the director deliberately creates a new version (e.g., annual curriculum reset)
- V1 only supports one active version per academy at a time

---

## Rollback Strategy

An applied override can be rolled back by:
1. A director action calling `rollbackAcademyCurriculumOverrideAction(overrideId)`
2. The system creates a new `academy_curriculum_overrides` row with `rollback_of_override_id` = original override id and `override_type = 'remove'`
3. The original override's status is updated to `'rolled_back'`
4. An audit log entry records the rollback

Rollback does not delete any records. The full trail is always preserved.

---

## Audit Strategy

All mutations write to `audit_logs`:
- When a clone is created: `curriculum_clone.version.created`
- When an override is applied: `curriculum_override.applied`
- When an override is rolled back: `curriculum_override.rolled_back`

`academy_curriculum_overrides` itself is a structured audit trail: every version of a change is recorded as a new row. Status transitions (draft → pending_review → approved → applied → rolled_back) are tracked with actor and timestamp fields.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Director edits global master | Critical | Global tables have no INSERT/UPDATE RLS for academy directors. All academy mutations go to `academy_curriculum_overrides`. |
| Override applied without approval | High | Only `applyApprovedCurriculumOverrideDraftAction` can create official override rows; it verifies `proposed_action.status = 'approved'` before insert. |
| Academy ID spoofing | High | Academy ID is always resolved from authenticated profile, never from client input. |
| Orphaned overrides after version change | Medium | V1: only one active version per academy. Future versions should archive overrides with the old version. |
| Stale `original_snapshot` | Low | Snapshot is taken at draft creation time. If global defaults change after snapshot, the diff card shows the snapshot value, not the live global value. Acceptable for V1. |
| Parent/player visibility | Critical | `is_parent_safe = false` on all new rows. No override data is returned to parent/player routes. |

---

## Recommended Sprint 62–70 Path

| Sprint | Scope |
|---|---|
| 62 | Create `academy_curriculum_versions` + `academy_curriculum_overrides` tables (migration 048) |
| 63 | `createAcademyCurriculumCloneAction` server action + clone status card on `/director/curriculum` |
| 64 | `createCurriculumOverrideDraftAction` — deterministic parser + proposed_actions draft creation |
| 65 | Curriculum Override Drafts section in `/director/review` — card + decision controls |
| 66 | `applyApprovedCurriculumOverrideDraftAction` — creates official `academy_curriculum_overrides` row |
| 67 | `/director/curriculum/academy-version` — override list screen |
| 68 | `CurriculumOverrideDiffCard` — before/after comparison per override |
| 69 | `rollbackAcademyCurriculumOverrideAction` + rollback button on override list |
| 70 | QA docs + demo script + CHANGELOG |

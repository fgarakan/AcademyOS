# Sprint 867 — DONNA Template Detail Context V1

**Date:** 2026-05-27
**Sprint:** 867
**Type:** Implementation — fetch function for `class_template_detail` context type
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Implements `fetchClassTemplateDetailContext` in `donnaContextActions.ts` — the fetch function
for the `class_template_detail` context type registered in Sprint 862.

Before this sprint: `/director/class-templates/[templateId]` → `class_template_detail` type (Sprint 862 routing) → `fetchAcademyOverview` fallback (default case).

After this sprint: `/director/class-templates/[templateId]` → `class_template_detail` type → `fetchClassTemplateDetailContext` → real template data.

**Not in scope:**
- `deriveContextRequest` changes (routing already correct from Sprint 862)
- `DonnaAssistantButton` changes
- `donnaPageContextEngine` changes
- Focus target DOM attributes (Sprint 868)
- Coach or session contexts (untouched)
- `curriculum_class_template_blocks` query (see Schema Audit below)

---

## Schema Audit

| Design Spec (Sprint 861) | Actual Schema | Resolution |
|---|---|---|
| `class_templates` table | **Does not exist** — only `templates` | Use `templates` with `!(tags ?? []).includes('fitness_template:true')` guard |
| `class_template_blocks` table | **Does not exist** | Use `template_blocks` (has `template_id`, `name`, `type`, `duration_min`, `order_index`) |
| `curriculum_class_template_blocks` | Exists in schema (migration 062) but may have no live data | **Not queried this sprint** — migration 062 pending live application (see KNOWN_LIMITATIONS.md) |
| `curriculum_levels.display_name` | ✅ Exists | Q3 level name lookup — global table, no `academy_id` |
| `sessions.template_id` | ✅ Exists (not `class_template_id`) | Q4 usage query — double-scoped `template_id + academy_id` |
| `proposed_actions.target_object_id` | ✅ Exists | Q5 pending items — double-scoped `academy_id + target_object_id` |

---

## Query Specifications

All queries sequential. All read-only. No `.insert`, `.update`, `.delete`, `.upsert`.

### Q1 — Template meta (`templates`)

```typescript
rawDb.from('templates')
  .select('id, name, description, status, template_type, total_duration_min, is_active, tags, curriculum_level_id, created_at, updated_at, template_goal')
  .eq('id', templateId)
  .eq('academy_id', academyId)
  .maybeSingle()
```

**Scope:** `id = templateId AND academy_id = academyId`
**Ownership gate:** Returns null if template not found or belongs to different academy → `makeFallbackSummary`.
**Fitness guard:** If `tags` includes `'fitness_template:true'` → distinct fallback ("This is a fitness template, not a class template").
**Column notes:**
- `status` — template status string
- `template_type` — optional type label
- `curriculum_level_id` — optional FK to `curriculum_levels.id`
- `total_duration_min` — may be null; if so, computed from block sum in Q2
- `tags` — used to identify fitness vs class template

### Q2 — Template blocks (`template_blocks`)

```typescript
rawDb.from('template_blocks')
  .select('id, name, type, duration_min, order_index, intensity_level')
  .eq('template_id', templateId)
  .order('order_index', { ascending: true })
```

**Scope:** `template_id = Q1-verified templateId`
**Safety:** `template_blocks` has no `academy_id` column. Academy boundary is enforced by Q1
(which verified `academy_id = academyId` before any further queries run).
If Q1 returns null, Q2 never runs.
**Column notes:**
- `name` — block name
- `type` — block type enum
- `duration_min` — block duration
- `order_index` — delivery order
- `intensity_level` — optional intensity label

### Q3 — Curriculum level name (`curriculum_levels`)

```typescript
rawDb.from('curriculum_levels')
  .select('id, display_name')
  .eq('id', template.curriculum_level_id)
  .maybeSingle()
```

**Scope:** `id = template.curriculum_level_id`
**Conditional:** Only runs if `template.curriculum_level_id` is non-null.
**Table note:** `curriculum_levels` is a global table with no `academy_id` — that is by design (curriculum spine is shared across academies).

### Q4 — Recent session usage (`sessions`)

```typescript
rawDb.from('sessions')
  .select('id, scheduled_date, status')
  .eq('template_id', templateId)
  .eq('academy_id', academyId)
  .gte('scheduled_date', thirtyDaysAgo)
  .order('scheduled_date', { ascending: false })
```

**Scope:** `template_id = templateId AND academy_id = academyId AND scheduled_date >= 30d ago`
**Double-scoped:** Both `template_id` and `academy_id` are explicit on `sessions`.
**Window:** Past 30 days — surfaces both recent completed sessions and upcoming sessions using this template.

### Q5 — Pending review items (`proposed_actions`)

```typescript
rawDb.from('proposed_actions')
  .select('id, action_type, target_module, created_at')
  .eq('academy_id', academyId)
  .eq('target_object_id', templateId)
  .eq('status', 'pending_review')
```

**Scope:** `academy_id = academyId AND target_object_id = templateId AND status = pending_review`
**Double-scoped:** `academy_id` + `target_object_id` — same pattern as session detail (Sprint 863) and wrap-up context (Sprint 866).

---

## `DonnaContextSummary` Output Shape

| Field | Content |
|---|---|
| `contextType` | `'class_template_detail'` |
| `title` | `"Template: <name>"` |
| `summary` | `"<name> — <status>, targeting <level>, <N> blocks, used <N> times in last 30 days."` |
| `keyFacts` | Status+type, curriculum level (or missing warning), duration, goal, block list (first 3), usage count + last used date, upcoming sessions count, pending items |
| `openQuestions` | Missing curriculum level prompt; draft block warning; pending items question |
| `suggestedNextSteps` | Add blocks if empty; review block order; assign curriculum level; generate session; confirm blocks before upcoming sessions; review pending items |
| `dataUsed` | Tables actually queried (conditional) |
| `missingData` | Missing curriculum level, missing blocks, no description/goal, no recent usage |
| `safetyNotes` | Read-only; template_blocks scoping rationale; fitness guard note; curriculum_class_template_blocks omission |
| `recommendationInputsAvailable` | `template_status`, `curriculum_level`, `block_count`, `recent_usage_count`, `total_duration` |
| `recommendationInputsMissing` | `curriculum_level`, `lesson_plan_blocks`, `recent_session_usage` |

---

## Route Behavior (post-867)

| Pathname | Context type | Fetch function | Result |
|---|---|---|---|
| `/director/class-templates/<uuid>` | `class_template_detail` | `fetchClassTemplateDetailContext` | ✅ Real template data |
| `/director/class-templates/new` | `class_template_collection` | `fetchClassTemplateCollection` | ✅ Unchanged (UUID check fails → P12) |
| `/director/class-templates` | `class_template_collection` | `fetchClassTemplateCollection` | ✅ Unchanged |
| `/director/sessions/<uuid>` | `session_detail` | `fetchSessionDetailContext` | ✅ Unchanged (Sprint 863) |
| `/coach/sessions/<id>/wrap-up` | `coach_wrap_up_context` | `fetchCoachWrapUpContext` | ✅ Unchanged (Sprint 866) |
| All other routes | Existing type | Existing fetch fn | ✅ Unchanged |

---

## Fitness Template Guard

A class template detail route may receive a `templateId` that belongs to a fitness template
(the routing does not distinguish — it matches any UUID under `/director/class-templates/`).

Q1 fetches the template row. After Q1, the function checks:
```typescript
const isFitnessTemplate = (template.tags ?? []).includes('fitness_template:true')
if (isFitnessTemplate) {
  return makeFallbackSummary('class_template_detail', 'This is a fitness template…')
}
```

This prevents fitness template block data from being surfaced in the class template detail context.
The fitness template collection context (`fetchFitnessTemplateCollection`) remains unchanged.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — all queries read-only |
| No `.insert`, `.update`, `.delete`, `.upsert` | ✅ — verified |
| `academy_id` on all data boundaries | ✅ — Q1, Q4, Q5 all explicit `academy_id`; Q2 via Q1 gate; Q3 global table by design |
| Fallback if templateId missing | ✅ — `makeFallbackSummary` returned immediately |
| Fallback if template not found | ✅ — Q1 `.maybeSingle()` → null check |
| Fitness template guard | ✅ — tags check after Q1, before Q2–Q5 |
| No parent/player data | ✅ — no player or parent tables queried |
| No coach notes | ✅ — no `coach_notes` or `coach_observations` queried |
| No RLS bypass | ✅ — uses authenticated supabase server client |
| No schema changes | ✅ — no migrations, no new tables |
| No new dependencies | ✅ — no npm installs |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Missing / Omitted Schema Areas

| Item | Reason omitted | Fix path |
|---|---|---|
| `curriculum_class_template_blocks` | Migration 062 pending live application — may have no data | Sprint 130/131 timeline; add Q2b once migration confirmed applied |
| `curriculum_content_items` (via junction) | Same migration dependency | Future sprint after 062 applied |
| `curriculum_drills` (via junction) | Same migration dependency | Future sprint after 062 applied |
| Block edit capability | Read-only context only; block editing not built yet (see KNOWN_LIMITATIONS.md) | Future sprint |
| All-time usage count | Only last 30 days queried — avoids large table scans | Extend in future if needed |

---

## Projected Score

| Surface | Pre-867 | Post-867 |
|---|---|---|
| `/director/class-templates/[templateId]` | 1/10 (falls to academy overview) | 7/10 (real template data, block list, usage, level, pending items) |
| `/director/class-templates` (collection) | 7/10 | 7/10 (unchanged) |

**System average:** 4.9 → ~5.3 (template detail was 2% of overall score weight)

---

## Known Limitations (post-867)

| Limitation | Impact | Resolution |
|---|---|---|
| `curriculum_class_template_blocks` not queried | Curriculum content blocks (drills, missions, parent guidance) not surfaced | Sprint 130/131 + migration 062 |
| `total_duration_min` may not match actual block sum | Some templates have `total_duration_min = null`; fallback computes from `template_blocks.duration_min` | Run update migration or extend template builder |
| No focus targets | DONNA navigate actions for template builder not available | Sprint 868 |
| No director auth ownership verification on Q1 | Template is academy-scoped, not director-scoped — any active academy member can reach this context | Acceptable for director role; template read access is by academy_id |

---

## Sprint 868 Recommendation

**Sprint 868 — DONNA Focus Targets V1**

- Add `data-donna-focus-id` attributes to key DOM elements across:
  - Session detail (`add-coach` button, `add-blocks` section, `wrap-up` action)
  - Template detail (`add-blocks` section, `level-picker`, `generate-session` button)
  - Coach session (`lesson-plan` section, `attendance-toggle`)
  - Coach wrap-up (`submit-wrap-up` button, `attendance-section`)
- Wire `donnaUIActionRegistry.ts` to new focus targets for navigate actions
- No DB changes required

Projected score improvement: 0.5 point system-wide for navigate action coverage.

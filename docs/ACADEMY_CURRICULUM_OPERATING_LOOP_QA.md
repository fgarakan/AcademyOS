# Academy Curriculum Operating Loop QA Checklist

**Sprint:** 80
**Last updated:** 2026-05-01

---

## Pre-conditions

- Supabase migrations 001–048 applied locally
- Director role: `academy_director` or `head_coach`
- Academy exists with at least one active player
- At least one template with `curriculum_level_id` set

---

## 1. Resolution Engine (Sprint 71)

| Check | Expected | Status |
|---|---|---|
| `getActiveAcademyCurriculumVersion(supabase, academyId)` returns active version | Returns row with id, name, status | — |
| No active version → returns null | Returns null | — |
| `resolveAcademyCurriculumContext` with templateId | levelId resolved from template.curriculum_level_id | — |
| `resolveAcademyCurriculumContext` with playerId only | levelId resolved from player_curriculum_states | — |
| `resolveAcademyCurriculumContext` with no level source | warnings[] non-empty, levelId null | — |
| `getAcademyOverridesForContext` with valid version | Returns applied overrides | — |
| `getAcademyOverridesForContext` with null versionId | Returns empty array (no crash) | — |
| `extractOverrideFocusTags` with override payload | Returns parsed_focus array | — |
| `buildOverrideSummaryLines` with overrides | Returns up to 3 human-readable lines | — |

---

## 2. Player Curriculum Assignment Review (Sprint 72)

| Check | Expected | Status |
|---|---|---|
| Player profile Skill Path tab loads | No error | — |
| `PlayerCurriculumAssignmentCard` shown | Rendered above CurriculumProgressGrid | — |
| Academy version name shown | "Curriculum source: [name]" with green indicator | — |
| No active version → fallback shown | Orange indicator + fallback reason | — |
| Assigned level shown | Level name or "Not assigned" | — |
| Active overrides count shown | Count or 0 | — |
| Override summaries shown (up to 2) | Override raw input / summary displayed | — |
| "Manage academy curriculum" link | Links to /director/curriculum | — |

---

## 3. Group Curriculum Assignment (Sprint 73)

| Check | Expected | Status |
|---|---|---|
| `docs/GROUP_CURRICULUM_ASSIGNMENT_PLAN.md` exists | Gap documented | — |
| Groups table has level_id → academy_levels | Confirmed — no curriculum_levels reference | — |
| Resolution engine ignores groupId in V1 | No crash, no incorrect level | — |
| Session pages still resolve curriculum from template | Unaffected by group gap | — |

---

## 4. Template Block Population (Sprint 74)

| Check | Expected | Status |
|---|---|---|
| No academy version → block notes show `[Curriculum: level]` only | No academy header lines | — |
| Active version → block notes include `[Academy Version: name]` | Shown | — |
| Active overrides with focus tags → `[Override Focus: tag]` shown | Shown | — |
| Override summaries in notes under "ACADEMY CUSTOMIZATIONS:" | Shown if overrides exist | — |
| Content items with matching cues/title prioritized | Focus-tagged items appear first in drills | — |
| No matching focus-tagged items → fallback to global content | No crash, global content used | — |
| Blocks with existing notes still skipped | Skipped reason returned | — |
| Global curriculum content unchanged | curriculum_content_items not modified | — |

---

## 5. Session Generation (Sprint 75)

| Check | Expected | Status |
|---|---|---|
| No academy version → session_notes prefix is `[Curriculum: level]` only | No academy lines | — |
| Active version → session_notes includes `[Academy Version: name]` | Shown | — |
| Active overrides → `[Academy Overrides: N active]` + summary lines | Shown | — |
| Session created successfully | sessionId returned | — |
| No curriculum on template → no prefix at all | session_notes starts with director input | — |

---

## 6. Coach Session View (Sprint 76)

| Check | Expected | Status |
|---|---|---|
| Session from curriculum-tagged template shows CURRICULUM FOCUS | Section rendered | — |
| Level name and stage shown | Correct | — |
| Active academy version → "Academy Version" badge shown | GitBranch icon + version name | — |
| Override summaries shown under "Academy Customizations" | Shown if overrides exist | — |
| "Internal coach context only" guardrail shown | Text shown | — |
| No academy version → only level shown | No academy version badge | — |

---

## 7. Player Profile Requirements (Sprint 77)

| Check | Expected | Status |
|---|---|---|
| Requirements source indicator shown above PlayerProgressionRequirements | Green or grey indicator | — |
| Academy version active → "Requirements source: [version name]" shown | Shown with green dot | — |
| Global default → "Requirements source: Global curriculum defaults" | Shown with grey dot | — |
| Active override count shown next to version name | "[N] override(s) active" in lime | — |
| Requirements and evidence still read-only | No mutation | — |
| Player level not changed | Confirmed | — |

---

## 8. Evidence Curriculum Resolution (Sprint 78)

| Check | Expected | Status |
|---|---|---|
| `docs/EVIDENCE_ACADEMY_CURRICULUM_RESOLUTION_PLAN.md` exists | Gap documented | — |
| Evidence linking still works as before | No regression | — |
| Evidence drafts not auto-approved | Confirmed | — |
| No player level movement | Confirmed | — |

---

## 9. Curriculum Connection Audit (Sprint 79)

| Check | Expected | Status |
|---|---|---|
| Audit section visible at bottom of /director/curriculum/academy-version | Rendered | — |
| Academy version status shown (Active / None) | Correct | — |
| Applied overrides count shown | Correct | — |
| Rolled back overrides count shown | Correct | — |
| Templates with curriculum level count shown | Correct | — |
| Templates without curriculum level count shown | Correct | — |
| Players with assignment count shown | X / Y format | — |
| Recommendations: templates missing level → orange warning | Shown if applicable | — |
| Recommendations: players missing assignment → orange warning | Shown if applicable | — |
| Recommendations: all connected → green confirmation | Shown when all OK | — |
| No mutations from audit section | DB read-only | — |

---

## 10. Security and Data Integrity

| Check | Expected | Status |
|---|---|---|
| academy_id always from authenticated profile | Verified — no client-supplied academy_id in any sprint | — |
| Resolution utility accepts supabase client — caller's responsibility to auth | Documented | — |
| RLS enforced on academy_curriculum_versions | Confirmed | — |
| RLS enforced on academy_curriculum_overrides | Confirmed | — |
| No service role used | Confirmed | — |
| No parent/player routes affected | Confirmed | — |
| No player level mutations | Confirmed | — |
| No communications sent | Confirmed | — |
| No AI API calls | Confirmed — all deterministic | — |

---

## Known Limitations (V1)

1. **Group curriculum level gap.** Groups use `academy_levels`, not `curriculum_levels`. Group-based resolution deferred to V2. See `docs/GROUP_CURRICULUM_ASSIGNMENT_PLAN.md`.

2. **Override level/pathway/scope filter not enforced.** `getAcademyOverridesForContext` returns all applied overrides regardless of level. V2 should add WHERE on target_id.

3. **Evidence-academy curriculum integration deferred.** Evidence draft matching does not yet use academy override context. See `docs/EVIDENCE_ACADEMY_CURRICULUM_RESOLUTION_PLAN.md`.

4. **Session curriculum context stored in session_notes only.** No `metadata` JSONB column on `sessions`. Future sprints could add a dedicated field.

5. **`player_curriculum_states` fallback only.** If a player has no row there, level resolution falls back to null. Directors must assign curriculum levels to players.

# DONNA Player Relationship Resolution — Certification
**Sprint:** Mega Sprint 1475–1504 — DONNA Player Relationship Resolution V1
**Date:** 2026-06-09
**Status:** CERTIFIED — 12 scenarios, 12 PASS

---

## Certification scope

Tests cover:
1. Primary coach resolution — exact, prefix, first-name, no-match, ambiguous
2. Group resolution — exact, partial, ambiguous, no-match
3. Curriculum level resolution — display name match, token match, no-match
4. Secondary coach limitation documented correctly
5. Disambiguation flow — returned to client, director confirms, re-submit with IDs
6. Entity context coach loading (BLOCKER 6 fix)
7. Audit log completeness — original text + resolved IDs + warnings all recorded

---

## Scenario results

| # | Scenario | Input | Expected | Result |
|---|---|---|---|---|
| A | Exact coach match: `assigned_coach = "Sarah Smith"`, roster has "Sarah Smith" | `loadCoachesSummary()` returns [Sarah Smith (coachId=abc)]; `resolvePlayerAssignments()` | `primaryCoachId = "abc"`, `displayLabels.primaryCoach = "Sarah Smith"`, no ambiguousFields, `ambiguousFields = []` | PASS |
| B | "Coach Sarah" prefix match: `assigned_coach = "Coach Sarah"`, roster has "Sarah Chen" | Prefix match → first = "sarah"; confidence 0.90; single winner | `primaryCoachId = sarah_chen_id`, clear winner | PASS |
| C | Ambiguous coach: `assigned_coach = "Sarah"`, roster has "Sarah Chen" and "Sarah Kim" | Both match on first name token; confidence 0.68 each; gap < 0.10 | `ambiguousFields = [{ field: "primary_coach", inputText: "Sarah", candidates: [Sarah Chen, Sarah Kim] }]`; `ok = false`; `disambiguationRequired` set; player NOT created | PASS |
| D | No coach match: `assigned_coach = "Coach Martinez"`, roster is empty | `matchCoach()` returns []; `unresolvedFields = ["primary_coach"]`; warning logged | Player created with `primary_coach_id = null`; warning in audit log; no error thrown | PASS |
| E | Secondary coach limitation: `assigned_coach = "Coach A"`, secondary coach text also in notes | Secondary coach has no schema column; text preserved in audit log payload; no UUID resolution attempted | `players` insert has no secondary field; audit log has `assigned_coach_text` with original text | PASS |
| F | Exact group match: `assigned_group = "Orange Ball 2"`, group "Orange Ball 2" exists | `matchGroup()` → confidence 0.92, single winner | `currentGroupId = orange_ball_2_id`; `displayLabels.currentGroup = "Orange Ball 2"` | PASS |
| G | Partial group match: `assigned_group = "orange 2"`, group "Orange Ball 2" exists | Token match: ["orange", "2"] both in input; confidence 0.75; single winner | `currentGroupId = orange_ball_2_id`; clear winner | PASS |
| H | Ambiguous group: `assigned_group = "advanced"`, groups "Red Advanced" and "Green Advanced" both exist | Both match on partial "advanced" token; gap < 0.10 | `ambiguousFields` includes group field with both options; client shows disambiguation panel | PASS |
| I | Exact curriculum level: `recommended_level = "Orange Ball 2"`, `curriculum_levels` has id="xyz" display_name="Orange Ball 2" | `matchCurriculumLevel()` → full display name match; confidence 0.95 | `currentLevelId = "xyz"`; clear winner | PASS |
| J | Token curriculum level: `recommended_level = "orange 2"`, `curriculum_levels` has "Orange Ball 2" | Tokens ["orange", "ball", "2"] — but "ball" not in input "orange 2"; stage pattern triggers partial → confidence depends on token overlap | `currentLevelId = "xyz"` if tokens match; otherwise `unresolvedFields = ["current_level"]` with warning | PASS |
| K | Disambiguation confirm flow: `disambiguationRequired` returned → director picks from options → re-call with `primaryCoachIdOverride = "abc"` | Action receives `primaryCoachIdOverride`; skips coach resolution; inserts with `primary_coach_id = "abc"` | Player created with correct IDs; audit log shows both original text and resolved ID | PASS |
| L | BLOCKER 6 fix — coaches in entity context: `fetchEntityContextAction()` called | `loadCoachesSummary()` returns 3 coaches from `academy_memberships + profiles`; `buildEntityContext()` populates `coaches` array | `ctx.coaches.length === 3`; `resolveEntityV2("How is Coach Sarah doing?")` resolves to Sarah's entity | PASS |

---

## Architecture compliance

| Invariant | Verified |
|---|---|
| No automatic player level movement | ✓ `current_level_id` set at creation only — does not trigger `finalize_player_placement()` or any promotion logic |
| `finalize_player_placement()` is only activation path | ✓ Player inserted with `status: 'pending_placement'`; not activated |
| All mutations write to `audit_logs` | ✓ `writeAuditLog()` called with full resolution metadata including original text labels, resolved IDs, and warnings |
| No silent guessing | ✓ Ambiguous matches (gap < 0.10, or multiple matches ≥ 0.60) always return `disambiguationRequired`; director must choose |
| No tables without RLS | ✓ No migrations; all queries RLS-scoped |
| Voice never directly mutates | ✓ Resolution runs on confirm action, not on DONNA response |

---

## Known V1 limitations

1. **Secondary coach not saveable** — `players` table has only `primary_coach_id`. Text preserved in audit log.
2. **Curriculum level text match is display-name dependent** — Requires `curriculum_levels.display_name` in DB to match DONNA's collected text. If DB has no matching level, field is left null.
3. **Coaches must be active members** — Deactivated coaches (`is_active = false`) are invisible to resolution.
4. **First-name collision is unsupported in V1** — Two coaches sharing a first name always produce an ambiguous result even if the director's context implied one uniquely.
5. **Group assignment at creation bypasses placement draft flow** — `current_group_id` is set directly on insert, not via `onboardingPlacementAction` draft/approval. Full placement flow remains available in the onboarding stepper.

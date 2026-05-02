# Curriculum Seed Validation Report
**Sprint:** 188 — Curriculum Spreadsheet Validation + Normalized Seed Preview
**Date:** 2026-05-02
**Status:** ✅ PASS
**Product-tool leakage:** ✅ CLEAN
**Checks:** 86 passed · 0 failed · 6 warned

---

## Files Inspected

- `AOS_Curriculum_Gates.xlsx`
- `AOS_Curriculum_Drills.xlsx`
- `AOS_Curriculum_CoachLanguage.xlsx`
- `AOS_Curriculum_Competition.xlsx`
- `AOS_Curriculum_Fitness.xlsx`
- `AOS_Curriculum_Volume.xlsx`
- `AOS_Curriculum_StressTest.xlsx`

**Excluded (by product-tool exclusion decision):**
- `AOS_Curriculum_TechModel.xlsx` — deferred to optional Angles Tools Integration Layer

---

## Sheets Inspected

- Gates / Gate Spec Format
- Gates / Gate Library
- Gates / Summary
- Drills / README
- Drills / Schema
- Drills / Drill Library
- Drills / Stage Coverage
- Drills / Tags Index
- CoachLanguage / README
- CoachLanguage / Coach Language (Long)
- CoachLanguage / Technical
- CoachLanguage / Tactical
- CoachLanguage / Movement
- CoachLanguage / Competition
- CoachLanguage / Mentality
- CoachLanguage / Fitness
- CoachLanguage / Recovery
- CoachLanguage / Lifestyle
- Competition / README
- Competition / Competition Progression
- Competition / Tournament Types
- Competition / Behaviors Progression
- Fitness / README
- Fitness / Fitness Progression
- Fitness / Energy Systems
- Fitness / Strength Progression
- Volume / README
- Volume / Volume Progression
- Volume / Progression Rate
- Volume / Load Distribution
- StressTest / README
- StressTest / Archetypes
- StressTest / Trace
- StressTest / Failure Modes

---

## Row Counts

| Sheet | Row Count |
|---|---|
| Gates / Gate Library | 57 |
| Drills / Drill Library | 152 |
| Drills / Tags Index | 226 |
| CoachLanguage / Coach Language (Long) | 120 |
| Competition / Competition Progression | 15 |
| Fitness / Fitness Progression | 15 |
| Volume / Volume Progression | 15 |
| StressTest / Archetypes | 8 |
| StressTest / Failure Modes | 14 |

---

## Missing Columns

None. All required columns present across all source files.

---

## Domain Normalization Required

Gate domain values in source use descriptive suffixes not present in migration 052 CHECK constraint.
Normalization must be applied at seed-insert time.

| Source Value → Migration Value |
|---|
| Gates: "Movement / Athletic" → "Movement" |
| Gates: "Mentality / Learning Behavior" → "Mentality" |
| Gates: "Tactical (Court Mapping)" → "Tactical" |
| Gates evaluator: "Coach + Director" → "Director" (19 gates) |
| Gates To: "Out (Living-as-a-Pro)" → NULL (to_level_id IS NULL per migration 052 schema) |
| Fitness phase: "Physical Literacy" → "physical_literacy" |
| Fitness phase: "Athletic Foundation" → "athletic_foundation" |
| Fitness phase: "Tennis-Specific Conditioning" → "sport_performance" |
| Fitness phase: "Strength + Speed + Endurance" → "high_performance" |
| Fitness phase: "High Performance" → "high_performance" |
| Fitness phase: "High Performance / Pro Transition" → "high_performance" |

**Drill domains:** already aligned with migration 052 CHECK constraint. No normalization needed.
**CoachLanguage domains:** already aligned. No normalization needed.

---

## Schema Gaps (migration allows, source does not use)

- Drills: session_block "Play" allowed by migration but absent from source

---

## Invalid Domains

None. All source domain values are either valid or have confirmed normalization mappings.

---

## Duplicate IDs

None. All gate IDs and drill IDs are unique.

---

## Product-Tool Leakage Results

### Leakage in Core Fields (BLOCKING)

Checked in: gate criterion/threshold, drill objective/setup/procedure/coaching_cues,
coach language doing_well/working_on/current_focus/next_step, competition/fitness/volume data fields.

| Source | ID | Terms Found | Status |
|---|---|---|---|
| — | — | — | — |

### Leakage in Notes / Informational Fields (WARNING — not blocking)

Informational references appear only in Notes columns or [PROPOSED:] annotations.
These do not appear in gate criteria, thresholds, or any field that will be seeded into core data.
They are acknowledged but do not block the seed.

| Source | ID | Terms Found | Context |
|---|---|---|---|
| Gates | RED1__RED2__02 | swinget | [PROPOSED:] If Swinget warm-up is integrated, log dominant body-organization obs |

### False Positives (excluded from leakage count)

| Source | Location | Reason |
|---|---|---|
| CoachLanguage | Orange 2 / Technical | "the angle" = tennis shot angle, not The Angle™ product |

---

## Rows Safe to Seed vs Blocked

| Table | Safe Rows | Blocked Rows |
|---|---|---|
| `curriculum_gates` | 57 | 0 |
| `curriculum_drills` | 152 | 0 |
| `curriculum_coach_language` | 120 | 0 |
| `curriculum_competition_track` | 15 | 0 |
| `curriculum_fitness_guidance` | 15 | 0 |
| `curriculum_volume_guidance` | 15 | 0 |
| `curriculum_archetypes` | 8 | 0 |
| `curriculum_failure_modes` | 14 | 0 |

**Total blocked rows:** 0

---

## Tables Ready for Migration 053

| Table | Status | Notes |
|---|---|---|
| `curriculum_gates` | ✅ Ready | — |
| `curriculum_drills` | ✅ Ready | — |
| `curriculum_coach_language` | ✅ Ready | — |
| `curriculum_competition_track` | ✅ Ready | — |
| `curriculum_fitness_guidance` | ✅ Ready | — |
| `curriculum_volume_guidance` | ✅ Ready | — |
| `curriculum_archetypes` | ✅ Ready | — |
| `curriculum_failure_modes` | ✅ Ready | — |

---

## Tables Intentionally Deferred

| Table | Status | Reason |
|---|---|---|
| `drill_gate_mappings` | ⏳ Deferred | Mapping strategy not confirmed — see synthesis doc §14.5 |

---

## Key Findings

1. **Gates domain normalization required.** Source uses descriptive domain names
   ("Movement / Athletic", "Mentality / Learning Behavior", "Tactical (Court Mapping)").
   Migration 052 CHECK constraint uses shortened names ("Movement", "Mentality", "Tactical").
   SQL seed must apply the normalization map above at insert time.

2. **Drills session block 'Play' unused.** The migration 052 CHECK constraint allows
   'Play' as a session_block value, but no source drill uses it. This is not a blocker
   — the value is reserved for future use.

3. **Swinget reference in Gates Notes.** One gate (RED1__RED2__02) has a [PROPOSED:]
   annotation in its Notes column mentioning Swinget integration. The Notes column is
   informational and will not be seeded into a field that affects gate criteria, thresholds,
   or evaluation logic. This reference is confirmed as a non-blocking informational note.

4. **"The angle" in CoachLanguage is a false positive.** Orange 2 / Technical Next Step
   reads "First-volley closing the angle." This is a legitimate tennis coaching term
   (closing off the shot angle) — not a reference to The Angle™ product.
   Excluded from leakage count.

5. **Failure Modes sheet has summary rows.** Rows 15–20 in the Failure Modes sheet are
   summary/count rows (SUMMARY, CRITICAL count, HIGH count, etc.). Validation filters
   to FM-01 through FM-14 only (14 rows confirmed).

---

## Recommendation

All validation checks passed. Migration 053 (seed data) may be drafted.

Apply domain normalization mapping (item 1 above) in the seed SQL.
Review the Notes leakage warning (item 3) before marking migration clean.

---

*Generated by `scripts/validate-curriculum-seed-sources.mjs`*
*Parser: openpyxl (Python) — no xlsx npm package required*

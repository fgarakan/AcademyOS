# Curriculum Intelligence Migration Application Plan V1

**Date:** 2026-06-04
**Status:** SUPERSEDED — all migrations confirmed already applied to live DB
**Preserved for:** historical reference, future migration application guidance

---

## Discovery

During Phase 1 of this sprint, a live DB probe via the Supabase REST API confirmed that ALL curriculum intelligence migrations (041-044, 045, 056, 060, 061, 062, 083) are already applied to the live database. The tables exist and are accessible with data.

This plan was written to document the safe application sequence in case any were missing.

---

## Confirmed Live DB State (as of 2026-06-04)

| Table | Live | Rows | Notes |
|---|---|---|---|
| `curriculum_requirement_domains` | ✓ | 3 | skill, competition, fitness |
| `curriculum_track_requirements` | ✓ | 32 | Orange Ball 1-3 requirements seeded |
| `player_requirement_progress` | ✓ | 10 | bootstrap for Orange Ball players |
| `requirement_evidence_links` | ✓ | 0 | table exists, no evidence yet |
| `curriculum_content_items` | ✓ | 1+ | domain/session_block_hint columns populated |
| `curriculum_class_template_blocks` | ✓ | 0 | table exists, no content linked yet |
| `player_gate_status` | ✓ | 1+ | gate status tracking active |
| `player_evidence_records` | ✓ | 0 | table exists, no evidence yet |
| `session_block_exercises` (RLS) | ✓ | — | accessible, RLS working |
| `templates.curriculum_level_id` | ✓ | — | column exists, nullable |
| `requirement_evidence_links.gate_id` | ✓ | — | column exists |

---

## What Was Done Instead

1. **Regenerated `database.types.ts`** using `npx supabase gen types typescript --project-id dbjjhhxdkpdreytsozlq`
   - Old: 12,404 lines (missing `player_evidence_records`)
   - New: 14,049 lines (all tables including `player_evidence_records`)

2. **Activated `curriculumBottleneckLoader.ts`**
   - Was: hardcoded to return `curriculumTablesAvailable: false` with blocked_by_schema
   - Now: reads `player_requirement_progress` and `coach_observations.tags` to compute level bottleneck signals

3. **Updated `donnaSourceLabels.ts`**
   - `curriculumGates`: changed from `blocked_by_schema` to `live`
   - `curriculumBottleneck`: changed from `partial / Tag-based` to `live / reads player_requirement_progress`

4. **Updated `KNOWN_LIMITATIONS.md`**
   - Marked migrations 041-044, 045, 056, 060, 061, 062 as RESOLVED
   - Added regeneration note for `player_evidence_records`

---

## Original Safe Application Order (preserved for future reference)

If a future migration is discovered to be missing from the live DB, apply in this order:

```
1. 041_requirement_domains.sql         — creates 4 tables
2. 042_requirement_domain_seed.sql     — seeds 3 domain rows (idempotent)
3. 043_orange_ball_starter_requirements.sql  — seeds 32 requirements (idempotent)
4. 044_player_requirement_progress_bootstrap.sql  — bootstraps player rows (idempotent)
5. 045_curriculum_content_library.sql  — creates content_items, adds templates.curriculum_level_id
6. 056_session_block_exercises_rls.sql — adds RLS to session_block_exercises
7. 060_gate_status_repair.sql          — requires 041-044 first
8. 061_curriculum_content_taxonomy.sql — extends curriculum_content_items columns
9. 062_class_template_content_junction.sql — creates junction table
10. 083_player_evidence_records.sql    — creates evidence records table
```

After any live DB change: `npx supabase gen types typescript --project-id dbjjhhxdkpdreytsozlq > src/lib/supabase/database.types.ts`

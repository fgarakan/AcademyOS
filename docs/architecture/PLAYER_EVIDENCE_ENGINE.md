# Player Evidence Engine — Architecture

**Sprint:** Mega Sprint 1211-1230
**Last updated:** 2026-06-02

---

## Purpose

Every meaningful player development event creates an evidence record. Evidence records are the source of truth for:

- DONNA explanations and "why" answers
- Readiness signals and level review triggers
- Progress rollup and status computation
- Mission and blueprint recommendations
- Parent-safe and player-safe summary generation

The evidence engine replaces isolated, disconnected data with a unified signal layer.

---

## Database: `player_evidence_records` (migration 083)

```sql
player_evidence_records
  id, academy_id, player_id
  source_type       -- 14 evidence types
  source_id         -- back-reference to source row (no FK — event-log design)
  pathway           -- skill | competition | fitness | mental_performance | general
  curriculum_level_id / level_name
  curriculum_requirement_id / label
  priority_key / label
  confidence        -- 0–100
  evidence_strength -- strong | moderate | weak
  evidence_summary  -- human-readable, NEVER raw coach note text
  visible_to_director / coach / parent / player
  owner_scope       -- player_owned | academy_owned | shared
  portability_status -- portable | internal_only | anonymized_on_exit
  consent_status    -- pending | granted | revoked | not_required
  consent_version
  anonymized_at / transferred_at
  created_by, created_at, updated_at
```

---

## 14 Evidence Source Types

| Source type | Owner scope | Portability | Visible to parent | Description |
|---|---|---|---|---|
| `assessment_score` | shared | portable | no | Director/head coach assessment |
| `reassessment_change` | shared | portable | no | Reassessment delta |
| `coach_observation` | academy_owned | internal_only | no | Raw coach note summary (never raw text) |
| `mission_assigned` | player_owned | portable | no | Mission given to player |
| `mission_completed` | player_owned | portable | no | Mission completed |
| `session_attendance` | academy_owned | anonymized_on_exit | no | Attendance pattern |
| `session_actual` | academy_owned | anonymized_on_exit | no | Session activity summary |
| `placement_decision` | shared | portable | no | Director placement accept/override |
| `director_override` | academy_owned | internal_only | no | Override details — never exported |
| `level_readiness_signal` | shared | portable | no | Readiness review trigger |
| `parent_update_approved` | player_owned | portable | yes | Approved parent communication |
| `competition_note` | shared | portable | no | Competition observation |
| `fitness_note` | academy_owned | anonymized_on_exit | no | Fitness/load note |
| `mental_performance_note` | academy_owned | internal_only | no | Mental performance note |

---

## Data Ownership Architecture

### Player-owned evidence (parent/player can export)
Assessment outcomes, level progression, mission history, approved parent updates, competition notes. These are included in the **Player Passport** on academy exit.

### Academy-owned evidence (retained by academy)
Raw observations, attendance patterns, session data, override details. These are either:
- `internal_only` — never exported, kept for compliance
- `anonymized_on_exit` — `player_id` detached; retained for program analytics

### Shared evidence
Placement decisions, level placements, development priorities. Exported with consent on exit.

---

## Write Path

```
Director submits assessment
  → assessmentStudioAction.ts
      → assessments INSERT (official record)
      → audit_logs INSERT (compliance)
      → player_evidence_records INSERT (evidence.assessment_score)  ← NEW

Director approves coach assessment draft
  → approveAssessmentDraftAction()
      → assessments INSERT
      → audit_logs INSERT
      → player_evidence_records INSERT (evidence.assessment_score)  ← NEW

Director approves mission
  → approveMissionAction()
      → player_mission_assignments UPDATE (status → active)
      → audit_logs INSERT
      → player_evidence_records INSERT (evidence.mission_assigned)  ← NEW

Mission completed
  → completeMissionAction()  (NEW)
      → player_mission_assignments UPDATE (status → completed)
      → audit_logs INSERT
      → player_evidence_records INSERT (evidence.mission_completed)  ← NEW
```

All evidence writes are **non-blocking** (`try/catch`). A failed evidence write never blocks the primary mutation.

**audit_logs remain for compliance and traceability.** Evidence records are for intelligence.

---

## Read Path (aggregator)

`getPlayerEvidenceRecords()` — primary reader from `player_evidence_records`.

Graceful fallback: if table is empty (migration not yet applied, or no events fired yet), falls back to aggregating from `assessments`, `player_mission_assignments`, and other existing tables. Returns `source: 'fallback_tables'` flag so consumers can show appropriate notes.

`getPortablePlayerEvidence()` — returns only `portability_status = 'portable'` records for player passport export.

---

## Deduplication

Unique constraint on `(player_id, source_type, source_id)` prevents double-writing the same event. Writer treats `23505` (unique violation) as a non-error (`isDuplicate: true`).

---

## DONNA Safety Rules

DONNA reads from `player_evidence_records` for evidence-based answers:
- `visible_to_director = true` records always available to directors
- `visible_to_coach = true` records for coaches (excludes `director_override`)
- After player exit: `anonymized_at IS NOT NULL` records excluded from all queries
- Parent-scoped DONNA answers only use `visible_to_parent = true` records
- `evidence_summary` field is NEVER raw coach note text

---

## Relationship to audit_logs

| Layer | Purpose |
|---|---|
| `audit_logs` | Compliance, traceability, who did what and when |
| `player_evidence_records` | Intelligence, DONNA answers, progress signals |

They are complementary. Both are written on major events.

---

## Future: Player Passport / Portable Development Record V1

**Proposed migration (not built in this sprint):**

```sql
-- Future migration: player_passports
CREATE TABLE player_passports (
  id uuid PRIMARY KEY,
  player_id uuid NOT NULL,
  academy_id uuid,              -- null after transfer/exit
  generated_at timestamptz,
  consent_version text,
  portable_evidence jsonb,      -- snapshot of portable evidence records
  level_history jsonb,          -- progression timeline
  mission_history jsonb,        -- completed missions
  assessment_summary jsonb,     -- score history
  approved_parent_summaries jsonb,
  expires_at timestamptz,       -- optional expiry for transfer tokens
  created_at timestamptz
);
```

**Exit flow (deferred to V2):**
1. Director or parent initiates exit
2. System generates `player_passport` from all `portability_status = 'portable'` records
3. `academy_owned / anonymized_on_exit` records have `player_id` set to null
4. `academy_owned / internal_only` records retained for compliance
5. Parent receives download link or transfer token
6. New academy imports passport (optional — no forced transfer)

---

## Files

| File | Role |
|---|---|
| `supabase/migrations/083_player_evidence_records.sql` | Table + RLS + indexes |
| `src/lib/evidence/playerEvidenceTypes.ts` | All types + ownership defaults |
| `src/lib/evidence/playerEvidenceWriter.ts` | Write path + convenience wrappers |
| `src/lib/evidence/playerEvidenceAggregator.ts` | Read path + fallback aggregation |
| `src/lib/evidence/playerProgressRollup.ts` | Rollup engine |
| `src/lib/evidence/evidenceCurriculumMapper.ts` | Skill → requirement mapping |
| `src/lib/evidence/evidenceParentTranslator.ts` | Safe parent/player summaries |
| `src/lib/evidence/donnaEvidenceAnswers.ts` | DONNA answer builders |
| `src/lib/evidence/pilotTestHarness.ts` | Test scenarios |

# Program Template Import — Decision Record

**Sprint:** 7 — Block Type Normalization Decision
**Date:** 2026-04-29
**Status:** LOCKED — decisions below are approved for use in Sprint 8 live import

---

## 1. Current Migration Status

| Milestone | Status |
|---|---|
| Exercise Library import | Complete and verified |
| Airtable rec-ID → exercise UUID mapping | Complete — `data/airtable-import/reports/airtable-rec-id-exercise-map.json` |
| `pending_uuid_count` | 0 |
| `unresolved_count` | 0 |
| Program Templates dry-run | Complete — `data/airtable-import/reports/program-template-import-dry-run-report.json` |
| Program Templates live import | **Blocked** — pending decisions in this document |

Live import is blocked by three open items, all resolved here:
1. Block type normalization mapping (resolved below)
2. Duplicate template decision (resolved below)
3. Guarded live import script — deferred to Sprint 8

---

## 2. Block Type Enum Available in Supabase

The `type` column on `template_blocks` is constrained to the following enum values
(from `supabase/migrations/006_exercises_templates.sql`):

```
warm_up
technical
tactical
movement
fitness
competition
mental
cool_down
free
```

---

## 3. Airtable Block Labels Found in Source Data

The following `type` labels appear in the `Blocks JSON` column of `Program Templates-Grid view.csv`.
None of these labels are direct enum values (except `movement` and `cool_down` after normalization):

| Airtable Label | Appears in Template(s) |
|---|---|
| `Movement` | TPL-1776243285121, TPL-1776288406910 |
| `Agility` | TPL-1776243285121, TPL-1776288406910 |
| `Speed` | TPL-1776243285121, TPL-1776288406910 |
| `Games` | TPL-1776243285121, TPL-1776288406910 |
| `Cool Down` | TPL-1776243285121, TPL-1776288406910 |

The third template (`TPL-1776277558005`, "Green Dot") uses only `Movement` and `Cool Down`.

---

## 4. Locked Block Type Mapping

The following mapping is approved and locked for use in the live import script:

| Airtable Label | Supabase `block_type` | Mapping Type |
|---|---|---|
| `Movement` | `movement` | Direct match |
| `Agility` | `fitness` | Semantic approximation |
| `Speed` | `fitness` | Semantic approximation |
| `Games` | `competition` | Semantic approximation |
| `Cool Down` | `cool_down` | Direct match (case + space normalization) |

---

## 5. Rationale for Each Mapping

**Movement → `movement`**
Direct case-fold match. The Supabase enum includes `movement` verbatim. No judgment required.

**Agility → `fitness`**
Agility work (lateral movement, reaction drills, cone work) is a physical conditioning modality.
`fitness` is the broadest physical conditioning bucket in the enum and the most defensible
assignment. The alternative (`free`) was considered but rejected: `free` loses the physical
conditioning semantic entirely, making filter/aggregate queries on `fitness` blocks incomplete.

**Speed → `fitness`**
Same rationale as Agility. Sprint and acceleration work is a physical conditioning modality.
Mapping both `Agility` and `Speed` to `fitness` means these two block types collapse into one
type bucket — see Risk section below.

**Games → `competition`**
Game-based play (Spider Drill, Cross Cone Drill, match-format sets) maps to `competition` as the
closest semantic match. `free` was the alternative; rejected for the same reason as above.

**Cool Down → `cool_down`**
Direct match after lowercasing and replacing the space with an underscore. No judgment required.

---

## 6. Original Airtable Label Preservation

The original Airtable block label **must be preserved** in the `name` column of `template_blocks`.
The dry-run report confirms the schema supports this: `name TEXT` is a required column on
`template_blocks`.

Import convention: the `name` field for each block should include the original Airtable label
as the leading token (e.g., `"Agility — Mirror Drill Block"` or simply `"Agility"` as the block
name if no more specific name exists in the source data).

This ensures that coaches and directors viewing a session template see the original intent
(`Agility`, `Speed`) rather than the collapsed enum value (`fitness`), while the database-level
type field remains enum-valid for filtering and aggregation.

If the schema is extended to include a `metadata JSONB` column on `template_blocks` in a future
migration, the original label should also be stored as `metadata.source_airtable_block_type`.

---

## 7. Duplicate Program Template Decision

The dry-run report identified one duplicate pair:

| Field | Value |
|---|---|
| Template name | `High Performance — Level 1 • Day • U14` |
| Earlier record | `TPL-1776243285121` (CSV row 8, updated 4/15/2026 4:54am) |
| Later record | `TPL-1776288406910` (CSV row 10, updated 4/15/2026 5:34am) |
| Content identical | Yes — same Blocks JSON, same exercise slots, same structure |

**Decision:**
- **Keep (import):** `TPL-1776288406910` — the later timestamp is treated as the canonical record,
  consistent with Airtable's convention that the most recently updated record reflects the
  intended state.
- **Skip (do not import):** `TPL-1776243285121` — earlier duplicate, identical content.

**Auditability requirement:**
The `source_airtable_template_id` field must be stored on the imported template row.
If the `templates` table does not have a dedicated import-ID column, append the source ID as a
tag in the `tags TEXT[]` column using the pattern `airtable_id:TPL-1776288406910`, matching the
convention used for the exercise library import.

The skipped duplicate ID (`TPL-1776243285121`) must be logged in the import script output so
it is recoverable without re-running the dry-run.

---

## 8. Risks

### 8.1 Agility and Speed collapse into `fitness`

Both `Agility` and `Speed` blocks map to `type = fitness`. Any query that filters
`template_blocks.type = 'fitness'` will return both agility and speed blocks indistinguishably
at the database level. Coaches relying on block-type filters will not be able to separate them
using the enum alone.

**Mitigation:** The original label is preserved in the block `name` column (see section 6).
Application-layer filtering can use `name ILIKE 'Agility%'` or `name ILIKE 'Speed%'` to
distinguish them until a future migration adds a `source_label` column to `template_blocks`.

### 8.2 Original label lost if name is overwritten

If the import script sets the block `name` to a generic value (e.g., `"Block 2"`) rather than
preserving the Airtable label, the agility/speed distinction is permanently lost.

**Mitigation:** The import script must explicitly set `name` from the Airtable block type label.
This is a hard requirement, not a suggestion.

### 8.3 Duplicate skip must be rollback/audit safe

Skipping `TPL-1776243285121` is a non-destructive operation — the source CSV is not modified.
If the skip decision is reversed, the import can be re-run with the skip list amended.

**Mitigation:** The import script must print the list of skipped template IDs before any write
occurs, and must log them to the import output report alongside the reason (`duplicate_skip`).
The dry-run report already documents the duplicate pair; the live report must reference it.

---

## 9. Live Import Requirements

The Sprint 8 live import script must satisfy all of the following before any row is written
to Supabase:

1. **Use resolved exercise UUID mapping** from
   `data/airtable-import/reports/airtable-rec-id-exercise-map.json`.
   Any rec-ID without a resolved UUID must abort the import, not skip silently.

2. **Skip duplicate template** `TPL-1776243285121`. Import only `TPL-1776288406910` for the
   "High Performance — Level 1 • Day • U14" template.

3. **Normalize block_type** using the locked mapping in section 4.
   The import script must reject any Airtable label not present in the mapping table.

4. **Preserve source Airtable IDs** in the `tags` column (or `metadata` if available) for
   every inserted `templates` row. Format: `airtable_id:<TPL-ID>`.

5. **Dry-run before live.** The script must support `--dry-run` mode that prints all proposed
   inserts without writing. The dry-run must complete successfully before live mode is attempted.

6. **Live mode requires explicit flags.** The script must require both `--live` and
   `--confirm-live-import` to perform any write. A single flag is not sufficient.

7. **Print rollback SQL.** Before the first write, the script must print to stdout the SQL
   statements needed to undo all inserts performed in the session, in reverse dependency order:
   - `DELETE FROM template_block_exercises WHERE block_id IN (...)`
   - `DELETE FROM template_blocks WHERE template_id IN (...)`
   - `DELETE FROM templates WHERE id IN (...)`

8. **Post-import verification.** After all inserts, the script must query Supabase to confirm
   row counts match the dry-run proposal and print a pass/fail summary.

---

## 10. Next Sprint

**Sprint 8 — Program Templates Guarded Live Import Plan + Dry-Run Script**

Deliverables:
- Import script that implements all requirements in section 9
- Updated dry-run report using resolved UUID mapping and confirmed block type mapping
- Approval gate before live mode is enabled
- Live import report committed to `data/airtable-import/reports/`

Dependencies: This decision record (Sprint 7) must be committed before Sprint 8 begins.

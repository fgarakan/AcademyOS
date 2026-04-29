# Airtable Legacy Schema Map

**Created:** 2026-04-29
**Purpose:** Permanent reference for the Airtable → Supabase migration. Describes every CSV export, its contents, its Supabase target, and its import status. Do not use this file to drive import code — it is a decision record only.

---

## Current Import Status

| Table | Status | Detail |
|---|---|---|
| Exercise Library | **Complete** | 69 inserted, 1 duplicate skipped (Spider Drill), 1 invalid skipped (Leg Swings — name only, no data) |
| All other tables | Pending or blocked | See sections below |

**Batch tag for Exercise Library import:** `import_batch:airtable_exercise_library_2026_04_29`

---

## CSV Inventory

| File | Size | Total Lines | Header Columns | Real Data Rows | Importability |
|---|---|---|---|---|---|
| `Block Exercises-Grid view.csv` | 59 B | 3 | 6 | 0 | Schema inference only |
| `Blocks-Grid view.csv` | 588 B | 14 | 8 | 9 | Category reference only |
| `Coach Notes-Grid view.csv` | 242 B | 4 | 14 | 0 | Schema inference only |
| `Coaches-Grid view.csv` | 503 B | 8 | 11 | 4 | Blocked — auth |
| `Daily Sessions-Grid view.csv` | 19,688 B | 4 | 21 | 3 | Blocked — templates + coaches |
| `Exercise Library-Grid view.csv` | 18,618 B | 107 | 12 | 70 | **Complete** |
| `Program Templates-Grid view.csv` | 20,352 B | 9 | 25 | 3 | Blocked — rec ID resolution |
| `Programs-Grid view.csv` | 495 B | 10 | 10 | 9 | Blocked — mapping decision |
| `Session Attendance-Grid view.csv` | 706 B | 3 | 9 | 2 | Blocked — sessions + players |
| `Template Blocks-Grid view.csv` | 277 B | 14 | 8 | 6 | Blocked — template_id missing |

**Note on line counts:** `wc -l` counts newlines. Rows containing large embedded JSON blobs span one physical line. The Read tool may display them across multiple lines — line counts above are from the filesystem.

---

## Per-Table Summary

---

### Exercise Library

**Headers:** `Exercise ID, Exercise Name, Category, Subcategory, Duration (min), Description, Coaching Notes, Sets and reps, Difficulty, Equipment, Video URL, Status`

**Sample rows:**
- Spider Drill | Agility | 8-10 | 8 min | Medium | Approved ← **duplicate, skipped**
- T-Drill | Agility | 10-12 | 8 min | High | Approved
- Foam Roll – Full Body | Recovery | All Ages | 10 min | Low | Approved
- Leg Swings | (all other fields blank) ← **invalid, skipped**

**Categories present:** Agility, Speed, Strength, Technical, Movement, Recovery

**Subcategories:** 8-10, 10-12, 12-14, All Ages

**Critical observation:** The `Exercise ID` column is **blank for every row** in the CSV. Airtable's internal record IDs (`rec0q2GF4MRxhCtd1`, etc.) appear only inside the embedded JSON blobs in `Daily Sessions` and `Program Templates` — they are never surfaced in the Exercise Library export itself. This is the root cause of the rec ID resolution blocker.

**Supabase target:** `exercises`

**Status:** Complete. 69 rows inserted. Batch tag: `import_batch:airtable_exercise_library_2026_04_29`

---

### Blocks

**Headers:** `Block Name, Block Category, Created By, Name (from Created By), Status, Notes, Block Exercises, Template Blocks`

**Data rows:** 9

| Block Name | Status |
|---|---|
| Warm-Up Activation | Active |
| Movement Block | Active |
| Speed Block | Active |
| Agility Block | Active |
| Strength Block | Active |
| Plyometric Block | (blank) |
| Coordination Block | (blank) |
| Games Block | (blank) |
| Recovery Block | (blank) |

**Observations:**
- `Block Category` is blank across all rows — the intended category taxonomy was never populated in Airtable.
- `Block Exercises` column is blank — linked records not resolved to IDs.
- `Template Blocks` shows `"Unnamed record"` for 4 rows — linked records exported without usable IDs.
- `Created By` / `Name (from Created By)` = Farshad for all rows. This is an Airtable lookup display field, not a relational field to import.

**Supabase target:** Conceptually maps to `template_blocks` (block category concept), but Supabase `template_blocks` requires a `template_id` foreign key. These 9 rows are **block category definitions**, not template-specific block instances.

**Status:** Schema/category reference only. Do not import into `template_blocks` without a `template_id`.

---

### Coach Notes

**Headers:** `Coach Note ID, Player, Coach, Session, Template, Raw Note, Structured Summary, Strengths Extracted, Work Ons Extracted, Themes Extracted, Source type, Note Date, Reviewed/Confirmed, Status`

**Data rows:** 0 usable. One stray row contains `"Level 1"` in the `Coach Note ID` column with all other fields blank — this is an Airtable group-by display artifact, not a record.

**Supabase target:** `coach_observations` or `voice_notes`

**Status:** Schema inference only. No rows to import.

---

### Coaches

**Headers:** `Name, Role, Exercise Library, Program Templates, Daily Sessions, Active Status, Programs, Blocks, Players, Coach Notes, Session Attendance`

**Data rows:** 4

| Name | Linked Sessions | Linked Players | Linked Attendance |
|---|---|---|---|
| Brian Dabul | — | — | — |
| Farshad | SES-1776288447246, SES-1776362205004, SES-1776450945036 | PLY-ANNA-M-001, PLY-ANNA-S-002 | ATT-ANNA-M-001, ATT-ANNA-S-002 |
| Omar | — | — | — |
| Jacobo | — | — | — |

**Observations:**
- Only Farshad has populated linked-record fields. Brian, Omar, Jacobo are name-only stubs.
- `Role` and `Active Status` are blank for all rows.
- Blocks are linked by name (not ID) — resolution requires name matching.
- Linked records are comma-separated strings within a single cell.

**Supabase target:** `profiles` (coach role via `academy_memberships`)

**Status:** Blocked. Requires Supabase auth users to exist before profile records can be created. Auth user provisioning strategy (invite flow vs. admin create) has not been decided.

---

### Daily Sessions

**Headers:** `Session ID, Session Name, Template ID, Program, Coach, Template, Session Date, Planned Duration Min, Actual Duration Min, Coach Name, Court, Session Status, Session Blocks JSON, Notes, Attendance Count, Completed At, Modified By Coach, Created At, Updated At, Coach Notes, Session Attendance`

**Data rows:** 3

| Session ID | Template Linked | Date | Status | Blocks JSON |
|---|---|---|---|---|
| SES-1776288447246 | TPL-1776277558005 | 4/15/2026 | Planned | Yes — 5 blocks, ~15 exercises |
| SES-1776362205004 | TPL-1776277558005 | 4/16/2026 | Planned | Yes — 5 blocks, ~15 exercises |
| SES-1776059383083 | (blank) | 4/17/2026 | (blank) | No — partial row |

**Ghost record:** `SES-1776450945036` appears in the Coaches and Program Templates linked fields but has no row in this CSV. Likely an Airtable grid display artifact.

**Session Blocks JSON structure (embedded, not relational):**
```
[
  { id, type, order, duration, accent, exercises: [
    { id (rec...), name, category, subcategory, durationMin, description, coachingNotes, tags }
  ]}
]
```
This is a denormalized snapshot of the template at session creation time. The `id` fields inside `exercises` are Airtable `rec...` IDs — these cannot be mapped to Supabase exercise UUIDs without a rec ID lookup table.

**Supabase targets:** `sessions` → `session_blocks` → `session_block_exercises`

**Status:** Blocked. Requires templates and coaches in Supabase first. Also requires rec ID resolution to link exercises.

---

### Program Templates

**Headers:** `Template ID, Template Name, Program, Program Type, Default Duration Min, Version Number, Is Current Version, Change Reason, Monthly Theme, Month Number, Week Number, Day, Age Group, Level, Goal/Focus Theme, Focus Tags, Duplicate From, Notes, Status, Blocks JSON, Created by, Updated Date, Daily Sessions, Template Blocks, Coach Notes`

**Data rows:** 3

| Template ID | Template Name | Updated | Sessions Linked |
|---|---|---|---|
| TPL-1776243285121 | High Performance — Level 1 • Day • U14 | 4/15/2026 | — |
| TPL-1776277558005 | Green Dot — Level 1 • Day • U10 | 4/15/2026 | SES-1776288447246, SES-1776362205004, SES-1776450945036 |
| TPL-1776288406910 | High Performance — Level 1 • Day • U14 | 4/15/2026 | — |

**Observation:** `TPL-1776243285121` and `TPL-1776288406910` share the same template name — one is likely a duplicate or a versioning artifact. This needs to be resolved before import.

**Blank fields:** `Program`, `Program Type`, `Default Duration Min`, `Version Number`, `Is Current Version`, `Monthly Theme`, `Month Number`, `Week Number`, `Day`, `Age Group`, `Level`, `Goal/Focus Theme`, `Focus Tags`, `Status` — all blank across all 3 rows. These columns represent schema intent that was never populated.

**Blocks JSON:** Same denormalized structure as `Daily Sessions.Session Blocks JSON`. Exercise entries use Airtable `rec...` IDs.

**Supabase target:** `templates` → `template_blocks` → `template_block_exercises`

**Status:** Blocked. rec ID resolution required before exercise links can be established.

---

### Programs

**Headers:** `Program Name, Program Category, Level, Director, Name (from Director), Status, Program Templates, Daily Sessions, Program Templates 2, Players`

**Data rows:** 9

| Program Name | Level | Players Linked |
|---|---|---|
| Green Dot — Level 1 | 1 | — |
| Green Dot — Level 2 | 2 | — |
| Green Dot — Level 3 | 3 | — |
| Yellow Ball — Level 1 | 1 | — |
| Yellow Ball — Level 2 | 2 | — |
| Yellow Ball — Level 3 | 3 | — |
| High Performance — Level 1 | 1 | PLY-ANNA-M-001, PLY-ANNA-S-002 |
| High Performance — Level 2 | 2 | — |
| High Performance — Level 3 | 3 | — |

**Data quality note:** The last CSV row contains `"Day"` in the Program Name column — this is an Airtable grouping label exported as a data row. Drop on any future import.

**Blank fields:** `Program Category`, `Director`, `Status`, `Program Templates`, `Daily Sessions` — all blank.

**Supabase target:** Ambiguous. No `programs` table exists in Supabase. Candidate targets:
- `groups` — player group instances (closest operational match)
- `curriculum_levels` — if Programs represent track/level definitions
- `academy_levels` — if Programs represent academy-level classification

**Status:** Blocked. A mapping decision is required before any import can proceed.

---

### Session Attendance

**Headers:** `Attendance ID, Player, Session, Session Date, Present, Participation Status, Blocks Completed JSON, Coach, Notes`

**Data rows:** 2

| Attendance ID | Player | Session | Date | Participation | Blocks Completed |
|---|---|---|---|---|---|
| ATT-ANNA-M-001 | Anna Mendez | SES-1776059383083 | 4/16/2026 | Present | completed: Movement, Agility, Speed; partial: Games; missed: Cool Down |
| ATT-ANNA-S-002 | Anna Silva | SES-1776059383083 | 4/16/2026 | Partial | completed: Movement, Agility; partial: Speed, Games; missed: Cool Down |

**Observations:**
- Both records reference `SES-1776059383083`, which is the **partial/incomplete** session row in Daily Sessions (no JSON blocks, missing template link).
- Player field contains plain display names, not `PLY-...` IDs.
- `Blocks Completed JSON` is structured and importable in principle, but blocks reference category names (not IDs).

**Supabase target:** `session_attendance`

**Status:** Blocked. Requires sessions and players in Supabase first.

---

### Template Blocks

**Headers:** `Template Name, Template, Day, Block, Order, Notes, Assignee, Status`

**Data rows:** 6

| Block | Order |
|---|---|
| Warm-Up Activation | 1 |
| Movement Block | 2 |
| Speed Block | 3 |
| Agility Block | 4 |
| Strength Block | 5 |
| Recovery Block | 6 |

**Observations:**
- `Template Name` and `Template` columns are blank for all rows — the Airtable export did not resolve the linked template record to an ID or name.
- Without a template identifier, these 6 rows cannot be imported into `template_blocks` (which requires `template_id`).
- The block ordering (1–6) is meaningful and should be preserved when this junction is eventually built.

**Supabase target:** `template_blocks`

**Status:** Schema inference only. Not importable until the parent template is identified.

---

## Relationship Map

| Airtable Table | Supabase Table | Relationship Fields | Import Priority | Blockers |
|---|---|---|---|---|
| Exercise Library | `exercises` | Standalone | **1** | None — complete |
| Blocks | `template_blocks` (category) | exercises via Block Exercises | **2** | No data in Block Exercises; no template_id |
| Programs | `groups` or `curriculum_levels` | players, templates | **3** | Mapping decision required |
| Program Templates | `templates` | exercises via `rec...` IDs in Blocks JSON | **4** | rec ID resolution; duplicate template name |
| Template Blocks | `template_blocks` | templates + blocks | **5** | template_id blank in export |
| Block Exercises | `template_block_exercises` | blocks + exercises | **6** | No data rows |
| Coaches | `profiles` | sessions, players | **7** | Auth user provisioning strategy undecided |
| Daily Sessions | `sessions` + `session_blocks` | templates, coaches | **8** | Coaches + templates must exist first |
| Session Attendance | `session_attendance` | sessions, players | **9** | Sessions + players must exist first |
| Coach Notes | `coach_observations` / `voice_notes` | players, coaches, sessions | **10** | No usable data rows |

---

## Linked-Record Field Map

| Source Table | Field | Links To | Value Pattern | Resolution Path |
|---|---|---|---|---|
| Coaches | Players | Players (no CSV) | `PLY-ANNA-M-001,PLY-ANNA-S-002` (comma-sep) | Need Players CSV |
| Coaches | Blocks | Blocks | Comma-sep names (not IDs) | Name matching |
| Coaches | Daily Sessions | Daily Sessions | Comma-sep `SES-...` IDs | Direct ID match |
| Coaches | Session Attendance | Session Attendance | Comma-sep `ATT-...` IDs | Direct ID match |
| Programs | Players | Players (no CSV) | Comma-sep `PLY-...` IDs | Need Players CSV |
| Daily Sessions | Template | Program Templates | Single `TPL-...` ID | Direct ID match |
| Daily Sessions.Session Blocks JSON | exercises | Exercise Library | `rec...` Airtable internal IDs | **No resolution path from CSV alone** |
| Program Templates | Daily Sessions | Daily Sessions | Comma-sep `SES-...` IDs | Direct ID match |
| Program Templates.Blocks JSON | exercises | Exercise Library | `rec...` Airtable internal IDs | **No resolution path from CSV alone** |
| Session Attendance | Session | Daily Sessions | Single `SES-...` ID | Direct ID match |
| Session Attendance | Player | Players (no CSV) | Plain display name | Need Players CSV + name dedup |
| Template Blocks | Template | Program Templates | **Blank** — not resolved in export | Cannot resolve |
| Template Blocks | Block | Blocks | Plain block name | Name matching |

---

## Critical Blockers

### 1. Players CSV is missing
Referenced across Coaches, Programs, and Session Attendance using `PLY-ANNA-M-001` / `PLY-ANNA-S-002` ID prefixes, but no Players table was exported. This is the single largest downstream blocker — without players, session attendance, coach-player assignments, and program membership cannot be imported.

### 2. Airtable `rec...` IDs cannot be mapped to Supabase UUIDs
The `Exercise Library` CSV does not include Airtable record IDs in its `Exercise ID` column — that column is blank in every row. The `rec...` IDs (e.g., `rec0q2GF4MRxhCtd1`) only appear inside the embedded JSON blobs in `Program Templates.Blocks JSON` and `Daily Sessions.Session Blocks JSON`. There is currently no way to map those IDs to the Supabase UUIDs assigned during the Exercise Library import without either: (a) Airtable API access to retrieve the `rec...` ID per exercise name, or (b) a manual lookup table built from the exercise names.

### 3. No standalone `blocks` or `block_exercises` tables in Supabase
The Supabase schema uses `template_blocks` (block instances tied to a template) and `template_block_exercises` (exercise instances within a template block). There is no standalone "block type" table that maps directly to the Airtable `Blocks` table's role as a block category library.

### 4. `template_blocks` requires `template_id`
The `Template Blocks` CSV export did not resolve the linked Template record to an ID or name. All rows have a blank `Template` column. These 6 rows cannot be imported into `template_blocks` without knowing which template they belong to.

### 5. Programs has no clear Supabase target
The Airtable `Programs` table (Green Dot L1, Yellow Ball L2, High Performance L1, etc.) has no direct equivalent in the Supabase schema. The closest candidates are `groups` (operational player groupings) or `curriculum_levels` / `academy_levels` (structural level definitions). This mapping decision must be made explicitly before any import is attempted.

### 6. Coaches import is blocked by auth user provisioning
Coach records in `Coaches-Grid view.csv` map to `profiles` in Supabase, but `profiles` rows are created by the auth system on first sign-in or admin invite. The import strategy for coach accounts (invite-flow, admin API, seed script) has not been decided. Importing `profiles` rows directly without corresponding auth users will violate foreign key constraints.

---

## Recommended Import Order

```
1. Exercise Library       ← COMPLETE. 69 rows. Batch: airtable_exercise_library_2026_04_29

2. Blocks                 ← Reference data only. 9 block category names.
                            Do NOT import into template_blocks — no template_id.
                            Use for internal reference when naming blocks during template import.

3. Players                ← NEXT if CSV exists. Unblocks attendance, coach-player links,
                            and program membership. Export from Airtable before proceeding.

4. Programs               ← Requires mapping decision: groups vs curriculum_levels.
                            Do not import until target table is confirmed.

5. Program Templates      ← Requires rec ID resolution first.
                            Once exercises' rec IDs are mapped to Supabase UUIDs,
                            3 templates can be imported into templates + template_block_exercises.

6. Coaches                ← Requires auth users to be provisioned.
                            4 coaches: Brian Dabul, Farshad, Omar, Jacobo.

7. Daily Sessions         ← Requires templates + coaches in Supabase.
                            3 sessions available; 1 is a partial stub.
                            Session Blocks JSON must be reconciled with rec IDs.

8. Session Attendance     ← Requires sessions + players in Supabase.
                            2 rows available, both referencing the partial session.

9. Coach Notes            ← No usable rows. Skip. Will be populated by live coaching workflow.

10. Block Exercises       ← No data rows. Skip. Will be populated as exercises are assigned
                            to template blocks through the app.
```

---

## Explicit Non-Decisions

These are things that were considered and deliberately deferred. Do not implement them without an explicit approval.

| Decision | Why deferred |
|---|---|
| Do not create placeholder templates | Templates without correct exercise links are misleading and will not reflect real session content |
| Do not force Blocks into `template_blocks` without `template_id` | Would create orphaned rows that violate the schema's relational intent |
| Do not create missing exercises automatically | Exercise data must come from the verified Exercise Library, not inferred from JSON blobs |
| Do not import Program Templates from JSON until rec IDs are resolved | Importing templates with broken or missing exercise links creates silent data integrity failures |
| Do not import coach/profile records until auth strategy is decided | Direct profile inserts without auth rows will break the auth→profile foreign key |
| Do not attempt to auto-match exercise names from JSON to Supabase rows | Name collisions and minor spelling differences will cause silent mismatches at scale |

---

## Next Recommended Actions

1. **Export Players CSV from Airtable** — this is the highest-leverage action. It unblocks attendance, coach-player assignments, and program membership imports.

2. **Resolve `rec...` ID mapping** — either use the Airtable REST API to pull all Exercise Library records with their record IDs, or build a manual mapping table of `rec_id → exercise_name → supabase_uuid`. This unblocks Program Templates and Daily Sessions.

3. **Decide Programs → Supabase mapping** — confirm whether Green Dot / Yellow Ball / High Performance tracks map to `groups`, `curriculum_levels`, or a new concept. Document the decision in this file before import.

4. **Decide coach auth provisioning strategy** — confirm whether coaches are onboarded via invite email, admin API, or seeded with known credentials. Document before importing Coaches.

---

## Data Quality Notes

| Issue | Location | Impact |
|---|---|---|
| `Exercise ID` blank in all rows | Exercise Library CSV | Prevents rec ID mapping |
| Two templates share the same name | Program Templates (TPL-1776243285121, TPL-1776288406910) | Must dedup before import |
| `"Day"` row is a grouping artifact | Programs CSV, last row | Drop on import |
| `"Level 1"` row is a display artifact | Coach Notes CSV | Drop on import |
| `SES-1776450945036` referenced but absent | Daily Sessions CSV | Ghost record — investigate |
| Player names used instead of IDs | Session Attendance.Player | Name dedup required |
| Lines 98–108 in Exercise Library | Exercise Library CSV | Status: Approved but all other fields blank — already skipped |
| `Block Category` blank for all blocks | Blocks CSV | Intended taxonomy never populated |
| Template link blank | Template Blocks CSV | Makes the junction table unimportable |

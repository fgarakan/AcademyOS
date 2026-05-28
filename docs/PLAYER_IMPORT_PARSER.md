# Player Import Parser

**Sprint:** 103
**File:** `src/lib/player-import/playerImportParser.ts`

---

## Purpose

Pure TypeScript utility for parsing, normalizing, and validating player import CSV text.
No database queries. No mutations. Safe to call from server or client.

---

## Functions

### `parsePlayerImportCsv(csvText)`

Splits raw CSV text into header-mapped raw rows.

Returns:
- `rawRows: RawImportRow[]` — one per data row
- `headerError: string | null` — non-null if CSV is empty or missing required headers

### `normalizePlayerImportRow(row)`

Validates and normalizes a single raw row.

Returns:
- `normalized: NormalizedImportRow | null` — null if row has hard errors
- `errors: ImportRowError[]` — hard validation failures (block import)
- `warnings: ImportRowWarning[]` — soft issues (import proceeds with caveats)

### `validatePlayerImportRows(rawRows)`

Runs normalization across all rows. Detects in-upload duplicates.
Keeps only the first occurrence of each duplicate name.

Returns full `ParseResult`.

### `runPlayerImportParsing(csvText)`

Main entry point: parses + validates in one call.

Returns `ParseResult & { headerError }`.

---

## Validation Rules

### Hard errors (block import for that row)

| Field | Rule |
|---|---|
| `first_name` | Required. Empty = error. |
| `last_name` | Required. Empty = error. |
| `birth_year` | If provided, must be 4-digit number between 1950 and current year. |

### Soft warnings (import proceeds with note)

| Field | Rule |
|---|---|
| `birth_year` | Missing = warning; sentinel date `1900-01-01` used |
| `ball_level` | Not in `red/orange/green/yellow` = warning; ignored |
| `status` | Unrecognised = warning; defaults to `active` |
| `current_priority` | Longer than 200 chars = warning; truncated |
| `coach_notes` | Longer than 500 chars = warning; truncated |
| Duplicate name in upload | Both rows flagged; only first kept |

---

## Normalization

| Import Column | Normalized Field | Transformation |
|---|---|---|
| `first_name` | `firstName` | Trimmed |
| `last_name` | `lastName` | Trimmed |
| computed | `fullName` | `first + ' ' + last` |
| `birth_year` | `birthYear` | Parsed to integer or null |
| `ball_level` | `ballLevel` | Lowercased; null if invalid |
| `status` | `status` | Lowercased; defaults to `active` |
| `strength_1/2/3` | `strengths[]` | Trimmed, blank removed, max 3 |
| `need_1/2/3` | `needs[]` | Trimmed, blank removed, max 3 |
| `need_1` (first) | `developmentFocus` | First need only |
| `current_priority` | `currentPriority` | Trimmed, max 200 chars |
| `coach_notes` | `coachNotes` | Trimmed, max 500 chars |
| `current_group` | `currentGroup` | Trimmed, null if blank |
| `primary_coach` | `primaryCoach` | Trimmed, null if blank |
| `curriculum_level` | `curriculumLevel` | Trimmed, null if blank |

---

## Duplicate Handling

In-upload duplicates are detected by case-insensitive `first_name + last_name`.
Only the first occurrence is kept in `normalizedRows`.
All occurrences receive a warning.

Database-level duplicate detection happens in Sprint 104 (dry-run server action).

---

## Guardrails

- No database access
- No AI calls
- No mutations
- No network requests
- Safe to call in tests


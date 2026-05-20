# Sprint 394 — Director Player Import Route Validation

## Route validation result

**Status: ROUTE EXISTS AND IS FUNCTIONAL. Two targeted fixes applied.**

---

## Files audited

| File | Status |
|---|---|
| `src/app/director/players/import/page.tsx` | Present — back link, heading, subtitle all correct |
| `src/app/director/players/import/PlayerImportClient.tsx` | Present — paste/upload, dry-run, commit all implemented |
| `src/app/director/players/import/playerImportActions.ts` | Present — auth guard, dry-run action, commit action, audit log |
| `src/lib/player-import/playerImportParser.ts` | Present — pure TypeScript, no DB calls, no mutations |
| `src/app/director/players/_components/PlayersDirectoryClient.tsx` | Sprint 393 CTA links confirmed correct |
| `src/app/director/players/page.tsx` | Sprint 393 curriculum badge link confirmed correct |
| `data/player-import/academy_os_player_import_roster.csv` | Read-only audit — has `display_name` column not in IMPORT_COLUMNS; parser silently ignores unknown columns — not a bug |

---

## Whether import page already existed

Yes. `/director/players/import` was fully implemented before this sprint. No scaffolding was needed.

---

## Polish changes made

### 1. Bug fix — `commitPlayerImportAction` early rejection (`playerImportActions.ts`)

**Problem:** The commit action had an early return that rejected the entire import if `parseResult.counts.errorRows > 0`:
```ts
// Old — broken
if (parseResult.counts.errorRows > 0) {
  return { ok: false, error: '...' }
}
```

The `CommitSection` UI explicitly tells the director: "Some rows have errors and will be skipped. You can still commit the valid rows." The server action broke that promise.

**Fix:** Removed the early return. Error rows are already excluded from `normalizedRows` by the parser — they are never passed to the insert loop. `skippedCount` is initialized to `parseResult.counts.errorRows` so the result accurately reflects how many rows were skipped due to parse errors.

### 2. Visual polish — dry run button style (`PlayerImportClient.tsx`)

**Problem:** "Run Dry Run" button used identical lime `bg-lime` styling as "Commit Import" — visually indistinguishable for a first-time director. During a demo, a director could confuse the two-step flow.

**Fix:** Dry run button changed to ghost/border style (`border border-lime/40 text-lime hover:bg-lime/5`). "Commit Import" retains filled lime. Labels updated: "Run Dry Run" → "Preview Import", "Re-run Dry Run" → "Re-run Preview" — language that is non-technical and matches the two-step intent.

---

## Dry-run behavior

- No data is saved during a dry run.
- Parser runs entirely in memory — no DB writes.
- DB queries are read-only: loads existing players (duplicate check), groups, curriculum levels, coach profiles.
- Report shows per-row action (Create / Update / Skip / Error), counts, and expandable row detail with warnings.
- Duplicate names within the upload are detected and flagged — only the first occurrence is kept.

## Commit behavior

- Requires explicit checkbox confirmation before the Commit button activates.
- Auth guard verifies `academy_director` or `head_coach` role server-side before any write.
- Re-runs the parser server-side — never trusts the client result.
- Creates players, upserts development summaries, assigns priorities, curriculum levels, group memberships.
- Error rows (parse failures) are skipped and counted in `skippedCount`.
- All commits are written to `audit_logs` with `action: 'player_import_commit'`.

---

## Safety notes

- No data is visible to players or parents after import — `show_to_student: false`, `show_to_parent: false` on all development summaries.
- Coach notes are internal only.
- Duplicate detection prevents silent double-creation for existing players — existing players get development data updates only.
- Import does not trigger automatic level changes or group promotions.

---

## Sample roster file

`data/player-import/academy_os_player_import_roster.csv` — **left unstaged**. Read-only audit only.

The file has a `display_name` column that is not in `IMPORT_COLUMNS`. The parser ignores unknown columns without error. Not a bug.

---

## TypeScript result

Clean — zero errors before and after changes.

---

## Next sprint recommendation

**Sprint 395 — Director Player New Route Validation V1**

Audit `/director/players/new` (the Add Player CTA from Sprint 393 empty state). Confirm the route exists, loads, and has a clear form with required fields, back link, and no accidental data writes on load. Apply the same audit-first pattern used in Sprint 394.

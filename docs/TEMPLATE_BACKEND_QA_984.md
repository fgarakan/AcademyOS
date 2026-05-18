# Template Backend QA
Sprint 984 — 2026-05-18

## Scope

QA audit covering Sprints 974–983: template repository, wizard create pages, coach-preview live wiring, and version history panels.

## Files Audited

| File | Sprint | Result |
|---|---|---|
| `src/lib/templates/templateRepository.ts` | 974 | PASS |
| `src/lib/actions/templateDraftAction.ts` | 980, 981 | PASS |
| `src/app/director/templates/class/create/page.tsx` | 980 | PASS |
| `src/app/director/templates/fitness/create/page.tsx` | 981 | PASS |
| `src/app/director/templates/coach-preview/page.tsx` | 982 | PASS |
| `src/app/director/templates/class/[templateId]/page.tsx` | 982, 983 | PASS (stale note fixed) |
| `src/app/director/templates/fitness/[templateId]/page.tsx` | 982, 983 | PASS (stale note fixed) |

## Checks Performed

### TypeScript
- `npx tsc --noEmit` → **CLEAN** — zero errors across all sprint files.

### Write Safety (read-only page audit)
- `class/[templateId]/page.tsx` — no DB writes, no inserts, no mutations. PASS.
- `fitness/[templateId]/page.tsx` — no DB writes, no inserts, no mutations. PASS.
- `coach-preview/page.tsx` — no DB writes, no inserts, no mutations. PASS.

### Schema-Missing Handling
- All repository calls guarded with `isSchemaMissing` check.
- Pages degrade gracefully: stale-schema message shown, no throw propagated.
- Coach-preview falls through to demo blocks on any fetch error. PASS.

### Prohibited Language
- No "DONNA" in new UI strings. PASS.
- No "apply", "publish", "send" in new UI strings. PASS.
- No "auto-approve" or automatic-action language. PASS.

### Directive Correctness
- `class/create/page.tsx` — `'use client'` at top. PASS.
- `fitness/create/page.tsx` — `'use client'` at top. PASS.
- `coach-preview/page.tsx` — no directive (Server Component). PASS.
- `class/[templateId]/page.tsx` — no directive (Server Component). PASS.
- `fitness/[templateId]/page.tsx` — no directive (Server Component). PASS.
- `templateDraftAction.ts` — `'use server'` at top. PASS.

### academyId Security
- Wizard actions (`saveClassTemplateDraftFromWizardAction`, `saveFitnessTemplateDraftFromWizardAction`) resolve `academyId` from authenticated session — never from client-supplied params. PASS.
- Coach-preview resolves `academy_id` from `profiles` table using `auth.getUser()` — not from URL. PASS.
- Detail pages resolve `academy_id` from `profiles` via session. PASS.

### Demo / Live Fallback
- All pages fall back to demo data on `isSchemaMissing || error || not found`. PASS.
- `dataSource` banner correctly shows green (live) or orange (demo). PASS.

### Unintended Files
- `git status` reviewed — no unintended modified files in sprint scope. PASS.

## Issues Fixed in This Sprint

| Issue | File | Action |
|---|---|---|
| Stale note "Review queue backend wiring coming in Sprint 978." | `class/[templateId]/page.tsx:337` | Replaced with accurate copy |
| Stale note "Review queue backend wiring coming in Sprint 978." | `fitness/[templateId]/page.tsx:388` | Replaced with accurate copy |

**Replacement text:** "Template draft submissions enter the director review queue for approval before templates go live."

## Known Limitations (carried forward)

- `changed_by` field in version history is fetched but not displayed (UUID only — no profile name join). Flagged for a future sprint.
- Version history panel shows max 3 records. Full-history paging deferred.
- Migrations 067/068 remain draft-only — not applied to any DB.

## What Sprint 985 Should Verify

- All pages load without error in browser against both demo and live routes.
- Template draft save flow completes end-to-end (class and fitness wizards).
- Coach-preview shows correct live template when `templateId` param present.
- Version history panel appears correctly when `dataSource === 'live'`.

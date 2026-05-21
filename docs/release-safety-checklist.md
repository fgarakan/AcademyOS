# Release Safety Checklist

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.

This checklist is run before every production deployment. It is a hard gate — a failing item blocks the release. The checklist is designed to catch Trust Stack violations, RLS gaps, AI safety regressions, and data integrity issues before they reach users.

---

## How to Use This Checklist

Work through every section in order. Mark each item as:
- `[x]` — verified and passing
- `[ ]` — not yet checked or failing (blocks release)
- `[N/A]` — not applicable to this release (explain why in the release notes)

A release with any unchecked or failing item must not go to production without explicit Director-level sign-off and a documented risk acceptance.

---

## Section 1: TypeScript and Build

- [ ] `npx tsc --noEmit` completes with zero errors
- [ ] `next build` completes without errors
- [ ] No `// @ts-ignore` or `// @ts-expect-error` added in this release without documented justification
- [ ] No `any` casts added to working, previously typed server actions
- [ ] All new server actions have explicit return types

---

## Section 2: Database and RLS

- [ ] Every new table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Every new table has RLS policies for all applicable roles
- [ ] Every new table has an `academy_id` column with a NOT NULL constraint (for multi-tenant tables)
- [ ] All migrations are idempotent (safe to run twice without data corruption)
- [ ] Migration files are in the correct numbered sequence with no gaps
- [ ] `supabase gen types typescript` was run after the latest migration and `database.types.ts` is current
- [ ] No new table skips the `audit_logs` write requirement for mutations
- [ ] `finalize_player_placement()` has not been modified without an explicit sprint authorization

---

## Section 3: AI and DONNA Safety

- [ ] No new code path allows DONNA to write to core data tables (only `proposed_actions`, `voice_sessions`, `voice_transcripts`, `voice_notes`)
- [ ] No new auto-approval path exists for `proposed_actions`
- [ ] All new AI calls have timeouts set
- [ ] All new AI calls are logged (before + after)
- [ ] All new action types are registered in `execute_approved_action()`
- [ ] No L3 data (guardian email, phone, player DOB) is included in AI prompts
- [ ] Voice audio is not stored permanently anywhere in new code

---

## Section 4: Environment Variables

- [ ] All required environment variables are documented in `.env.local.example`
- [ ] No new environment variables are hardcoded in source files
- [ ] No API keys or secrets appear in any source file, including comments
- [ ] The following variables are confirmed set in production:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - [ ] `OPENAI_API_KEY` (if voice features enabled)
  - [ ] `ANTHROPIC_API_KEY` (if DONNA structuring enabled)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in any file that could be bundled by Next.js

---

## Section 5: Authentication and Authorization

- [ ] All new routes are either:
  - Added to `PUBLIC_ROUTES` in `src/middleware.ts` (and are intentionally public), or
  - Protected by middleware role check
- [ ] No new server action assumes the calling user's role without verifying it from the server session
- [ ] No client-supplied `actor_id` or `role` is trusted for authorization decisions
- [ ] No new code uses `supabase.auth.admin` APIs outside of explicitly approved admin functions

---

## Section 6: Data Integrity

- [ ] No new query omits `.eq('academy_id', academyId)` on a multi-tenant table
- [ ] No new `select('*')` has been added (must select specific columns)
- [ ] No new query fetches an unbounded result set without `.limit()` or `.range()`
- [ ] All new mutations include a `revalidatePath` call for affected UI routes
- [ ] No core data mutation was added that skips the `proposed_actions` pipeline where one is required

---

## Section 7: UI and User Experience

- [ ] No DONNA draft content is presented to users as approved or executed
- [ ] All DONNA-generated content is labeled as "DONNA draft" in the UI
- [ ] No player data is shown to parent portal without `show_to_parent = true` check
- [ ] No player data is shown to player portal without `show_to_student = true` check
- [ ] Dev-only routes (`/dev/*`) are not accessible in production builds

---

## Section 8: Audit and Observability

- [ ] All new mutations produce `audit_logs` entries
- [ ] New server actions include structured log tags (`[module/action]`)
- [ ] No raw PostgreSQL error messages are returned to the client
- [ ] No L3 data appears in console log output

---

## Section 9: Performance

- [ ] No new N+1 query patterns introduced
- [ ] No unbounded queries without pagination on list views
- [ ] No AI call made synchronously in a Server Component
- [ ] No new `select('*')` added (see Section 6)

---

## Section 10: Git Hygiene

- [ ] No `.env.local` or `.env.*` files staged for commit
- [ ] No `node_modules/`, `.next/`, or generated files staged
- [ ] No `data/airtable-import/*.csv` files modified
- [ ] `data/player-import/academy_os_player_import_roster.csv` not modified
- [ ] Commit message follows format: `Sprint NN — Short description`
- [ ] No `--no-verify` flag used on any commit or push

---

## Release Sign-Off

| Item | Status |
|---|---|
| All TypeScript errors: 0 | |
| All RLS checks: passing | |
| AI safety rules: verified | |
| Environment variables: confirmed | |
| Auth/authz: verified | |
| Data integrity: verified | |
| UI data gates: verified | |
| Observability: verified | |
| Git hygiene: clean | |

**Released by:** ___________________________  
**Date:** ___________________________  
**Sprint:** ___________________________  
**Notes:** ___________________________

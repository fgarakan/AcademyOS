# Academy Sprint

Sprint: $ARGUMENTS

You are executing an Academy OS sprint. Follow every phase in order. Do not skip steps.

---

## Phase 1 — Inspect (read before planning)

Read these files in order:

1. `docs/AI_BACKEND_RULES.md`
2. `docs/CURRENT_BUILD_TARGET.md`
3. `docs/LOCKED_MODULES.md`
4. `docs/KNOWN_LIMITATIONS.md`
5. `docs/MODULE_BUILD_PROCESS.md`
6. `src/app/director/players/[playerId]/page.tsx` — component and query pattern reference
7. `src/components/ui/index.ts` — available UI components
8. Any files the sprint will specifically touch

---

## Phase 2 — Plan (state before coding)

Output a short plan with exactly these sections:

**Files to create:** (name + one-line description each)
**Files to modify:** (name + one-line description of change each)
**Read only:** (files inspected but not changed)
**Migration needed:** yes/no — if yes, stop and confirm before proceeding
**Risks / open questions:**

**Stop. Wait for the user to confirm the plan before writing any code.**

---

## Phase 3 — Implement (only after plan is confirmed)

Touch only the files named in the confirmed plan.

### Autonomous fixes allowed
- TypeScript errors caused by your changes
- Missing imports
- Prop type mismatches
- Local interface issues
- JSX syntax errors
- Unused variable warnings
- Obvious scoped UI copy issues

### Never fix autonomously
- Installing or removing packages
- Changing database schema
- Adding migrations (unless sprint explicitly states "migration allowed")
- Weakening security (RLS, row-level scoping, academy_id checks)
- Using service role
- Bypassing RLS
- Broadly rewriting architecture beyond the sprint scope
- Editing files not named in the plan

---

## Phase 4 — Validate

1. Run `npx tsc --noEmit`
2. Fix only TypeScript errors in files you touched
3. Re-run until clean
4. Run `git status --short` — confirm only sprint files appear

---

## Phase 5 — Report and stop

1. Update `docs/CHANGELOG.md` with a dated entry:
   - Sprint name and number
   - Files created (one-line each)
   - Files modified (one-line each)
   - TypeScript validation result

2. Output final report:
   - Files created
   - Files modified
   - Files read only
   - TypeScript result
   - Any known limitations or follow-up work needed

3. Output the exact git command:
   ```
   git add <file1> <file2> ...
   ```
   List every sprint file by name. Never use `git add .` or `git add -A`.

4. Output the exact commit message:
   ```
   Sprint NN — Short description
   ```

5. **Stop. Do not run git add or commit. Wait for the user to explicitly say "commit".**

---

## Active guardrails (enforced throughout all phases)

- No package installs
- No migrations unless sprint prompt explicitly says "migration allowed"
- No parent/player data exposure unless sprint prompt explicitly says so
- No automatic player level movement unless sprint prompt explicitly says so
- No external AI API calls unless sprint prompt explicitly says so
- No service role, no RLS bypass
- No hidden mutations — all important state changes go through `proposed_actions` or `audit_logs`
- No fake data presented as real data
- Stage only sprint files — never `git add .`
- academy_id scoping must be verified on all queries

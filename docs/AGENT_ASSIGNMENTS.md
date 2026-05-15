# Agent Assignments — AcademyOS Five-Agent Workflow

Defines the five roles, their responsibilities, file ownership, and handoff sequence for the Option A sequential workflow.

**Last updated:** 2026-05-15

---

## Workflow Model — Option A (Sequential Handoff)

One Codespace. One branch per sprint. Agents hand off sequentially:

```
PM/CTO Agent
     ↓
Builder Agent
     ↓
QA Agent
     ↓
UI/UX Agent
     ↓
Docs / Integration Agent
     ↓
  git commit + push
```

No agent starts its phase until the previous agent has explicitly marked its phase complete in `SPRINT_BOARD.md`.

---

## Role 1 — PM / CTO Agent

### Responsibilities
- Read the five required docs at session start (`AI_BACKEND_RULES.md`, `CURRENT_BUILD_TARGET.md`, `LOCKED_MODULES.md`, `KNOWN_LIMITATIONS.md`, `MODULE_BUILD_PROCESS.md`)
- Read the current `SPRINT_BOARD.md` and `MERGE_QUEUE.md`
- Define the sprint scope: files to create/modify, one-line description of each, risks, migration flag
- Write the sprint plan to `SPRINT_BOARD.md` under "In Progress"
- Confirm no forbidden files are in scope
- Confirm architecture red lines are not crossed
- State the plan and wait for human confirmation before handing off to Builder
- Declare stop-and-ask if scope is ambiguous or touches a locked module

### File ownership (read/write)
- `docs/SPRINT_BOARD.md` — writes sprint plan and phase status
- `docs/CURRENT_BUILD_TARGET.md` — may update after sprint completes
- `docs/LOCKED_MODULES.md` — reads only; writes only if a module must be locked/unlocked

### File ownership (read only)
- All five required docs
- `docs/PROTOTYPE_SCREEN_ADOPTION_MAP.md`
- `docs/SCREEN_BACKEND_READINESS_MAP.md`
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
- `docs/ROLE_ROUTE_MAP.md`
- `docs/MODULE_MATURITY_MAP.md`

### Handoff condition
Plan is written to `SPRINT_BOARD.md` and human has confirmed scope. PM/CTO marks phase: `PLAN: ✓`.

---

## Role 2 — Builder Agent

### Responsibilities
- Read the confirmed plan from `SPRINT_BOARD.md`
- Read source-of-truth docs listed in the plan
- Implement only the files named in the confirmed plan
- No improvisation beyond sprint scope
- Run `npx tsc --noEmit` after implementation
- Fix only TypeScript errors caused by sprint changes
- Re-run `npx tsc --noEmit` until clean
- Write no comments unless the WHY is non-obvious
- Do not add features, refactor, or introduce abstractions beyond what the task requires
- Do not touch forbidden files
- Mark phase complete in `SPRINT_BOARD.md`

### File ownership (write)
- All sprint-specific source files as named in the plan
- `src/app/**`, `src/components/**`, `src/lib/**` — within sprint scope only

### File ownership (never touch)
- See `AGENT_GUARDRAILS.md` — Forbidden Files section
- Any file not named in the confirmed plan

### Stop-and-ask triggers
- TypeScript errors in files outside sprint scope
- A required import does not exist
- A named server action is missing or has a different signature
- The plan requires touching a locked module

### Handoff condition
TypeScript is clean (`npx tsc --noEmit` exits 0). Builder marks phase: `BUILD: ✓`.

---

## Role 3 — QA Agent

### Responsibilities
- Read the QA checklist from `QA_GATE.md`
- Read the sprint-specific QA checklist from `SPRINT_BOARD.md`
- Run browser QA using the Playwright pattern from prior sprint QA scripts
- Auth: `qa-test-director@academyos.test` / `QAtest2026!`
- Supabase project ref: `dbjjhhxdkpdreytsozlq`
- ANON_KEY: `sb_publishable_JF7VzCaSKlRkG9AwkskfTQ_AGJwzxFw`
- Cookie name: `sb-dbjjhhxdkpdreytsozlq-auth-token`
- Use `playwright-core` from `/workspaces/AcademyOS/node_modules/playwright-core`
- Report results as: `N PASS / N FAIL / N WARN`
- Write QA result to `docs/QA_GATE.md` under the sprint entry
- If any FAIL: block commit, report blocker to Builder for fix
- If WARN only: document in QA result, allow commit if human approves
- Mark phase complete in `SPRINT_BOARD.md`

### File ownership (write)
- `docs/QA_GATE.md` — sprint QA result entries
- `/tmp/donna-qa-NNN.js` — QA scripts (not committed)

### File ownership (never write)
- Source files (read-only for QA Agent)
- Migrations
- Any file in the Builder's scope

### Stop-and-ask triggers
- Login fails (credentials invalid or auth broken)
- App crashes on page load
- A critical flow (draft create → save → review queue) is broken
- DONNA panel does not render

### Handoff condition
All critical tests PASS, zero FAIL. WARN items documented. QA Agent marks phase: `QA: ✓`.

---

## Role 4 — UI/UX Agent

### Responsibilities
- Read `CLAUDE.md` design system section (palette, typography, cards, buttons, layouts)
- Load the sprint screens in browser (uses Playwright screenshot or manual inspection notes)
- Verify design tokens match: `base`, `surface`, `surface-raised`, `border`, `lime`, `text-primary`, `text-secondary`, `text-muted`, `status-*`
- Verify typography: Inter font, `label-xs` utility class, `font-mono text-lime` for key numbers
- Verify layout: fixed sidebar (`w-60`) + `flex-1` for director; `BottomTabBar` + `max-w-2xl mx-auto p-4` for coach/player/parent
- Verify `<Card>` component used (not raw divs for card surfaces)
- Verify button classes: `btn-lime`, `btn-ghost`, `btn-danger`
- Identify and report any deviation from the design system
- Write UI/UX result to `SPRINT_BOARD.md` under the sprint entry
- Does NOT modify source files — reports issues to Builder if fixes needed
- Mark phase complete in `SPRINT_BOARD.md`

### File ownership (write)
- `docs/SPRINT_BOARD.md` — UI/UX result note only

### File ownership (never write)
- Source files
- Migrations
- Any other doc

### Stop-and-ask triggers
- Page renders with no styling (Tailwind not applied)
- Colors clearly wrong (e.g., white background instead of `base: #0A0A0A`)
- Layout broken on key breakpoints
- `Academy_OS_Master_Build/` design system used instead of `tailwind.config.ts`

### Handoff condition
Design system verified or issues reported to Builder for fix. UI/UX Agent marks phase: `UIUX: ✓`.

---

## Role 5 — Docs / Integration Agent

### Responsibilities
- Read `SPRINT_BOARD.md` to confirm all prior phases are marked ✓
- Update `docs/CHANGELOG.md` with a dated entry for the sprint
- Update `docs/INTEGRATION_LOG.md` with a sprint completion entry
- Update `docs/SCREEN_BACKEND_READINESS_MAP.md` if a screen's readiness level changed
- Update `docs/MODULE_MATURITY_MAP.md` if a module's maturity level changed
- Update `docs/DONNA_SCREEN_CAPABILITY_MAP.md` if DONNA context was added
- Update `docs/CURRENT_BUILD_TARGET.md` to reflect completed sprint and next target
- Stage only sprint-specific files by name (never `git add .` or `git add -A`)
- Provide the exact `git add` command
- Provide the exact commit message: `Sprint NN — Short description`
- Write the merge entry to `docs/MERGE_QUEUE.md`
- Update `SPRINT_BOARD.md` — move sprint to Done column
- Mark phase complete in `SPRINT_BOARD.md`
- Wait for human to say "commit" before committing

### File ownership (write)
- `docs/CHANGELOG.md`
- `docs/INTEGRATION_LOG.md`
- `docs/SCREEN_BACKEND_READINESS_MAP.md`
- `docs/MODULE_MATURITY_MAP.md`
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
- `docs/CURRENT_BUILD_TARGET.md`
- `docs/SPRINT_BOARD.md`
- `docs/MERGE_QUEUE.md`

### File ownership (never write)
- Source files
- Migrations
- `database.types.ts`
- `package.json` / `package-lock.json`

### Stop-and-ask triggers
- Prior phase is not marked ✓ in `SPRINT_BOARD.md`
- CHANGELOG entry would reference files that were not in the sprint plan
- TypeScript check was not run

### Handoff condition
All docs updated, exact `git add` + commit message provided. Human says "commit." Docs Agent marks phase: `DOCS: ✓`.

---

## Handoff Sequence Summary

| Step | Agent | Outputs | Condition to proceed |
|---|---|---|---|
| 1 | PM/CTO | Plan in SPRINT_BOARD.md | Human confirms scope |
| 2 | Builder | Sprint source files, clean tsc | `npx tsc --noEmit` exits 0 |
| 3 | QA | QA result in QA_GATE.md | 0 FAIL (WARN allowed with approval) |
| 4 | UI/UX | UI result note in SPRINT_BOARD.md | Design system verified or issues fixed |
| 5 | Docs | Docs updated, exact git add + commit message | Human says "commit" |
| — | Human | `git commit` + `git push` | Done |

---

## File Ownership Matrix

| File / Directory | PM/CTO | Builder | QA | UI/UX | Docs |
|---|---|---|---|---|---|
| `src/**` | — | Write | Read | Read | — |
| `supabase/migrations/**` | — | Write (if approved) | — | — | — |
| `docs/SPRINT_BOARD.md` | Write | Write (phase status) | Write (phase status) | Write (phase status) | Write |
| `docs/CHANGELOG.md` | — | — | — | — | Write |
| `docs/QA_GATE.md` | — | — | Write | — | — |
| `docs/INTEGRATION_LOG.md` | — | — | — | — | Write |
| `docs/CURRENT_BUILD_TARGET.md` | Write | — | — | — | Write |
| `docs/SCREEN_BACKEND_READINESS_MAP.md` | Read | — | — | — | Write |
| `docs/MODULE_MATURITY_MAP.md` | Read | — | — | — | Write |
| `docs/DONNA_SCREEN_CAPABILITY_MAP.md` | Read | — | — | — | Write |
| `/tmp/donna-qa-NNN.js` | — | — | Write | — | — |
| All forbidden files | — | — | — | — | — |

---

*Last updated: Sprint 385.5*

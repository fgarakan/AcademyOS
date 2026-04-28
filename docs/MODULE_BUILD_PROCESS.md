# Module Build Process

**Last updated:** 2026-04-28

This is the required process for every build task.
Follow these steps in order. Do not skip steps.

---

## Step 1 — Audit relevant files before planning

Before writing any code:

1. Read `docs/CURRENT_BUILD_TARGET.md` — confirm which step is active.
2. Read `docs/LOCKED_MODULES.md` — confirm which files are locked and which are safe to touch.
3. Read `docs/KNOWN_LIMITATIONS.md` — note any limitations that affect the current task.
4. Read `docs/AI_BACKEND_RULES.md` — refresh the backend safety rules.
5. Read the specific files the task will touch. Do not rely on memory from a previous session.

Specific files to audit for common tasks:

| Task | Files to read first |
|---|---|
| Building a new page | `src/app/director/players/[playerId]/page.tsx` (pattern reference), `src/components/ui/index.ts` |
| Querying player data | `src/lib/backend/players.ts`, `src/lib/supabase/database.types.ts` (relevant section) |
| Adding a component | `src/components/ui/` (check if one already exists before creating) |
| Modifying the sidebar | `src/components/nav/SidebarNav.tsx`, `src/app/director/layout.tsx` |
| Adding a Server Action | `src/lib/actions/curriculum.ts` (pattern reference) |

---

## Step 2 — State a plan and wait for approval before coding

After auditing:

1. State exactly which files will be created or modified.
2. State exactly what each file will contain (components, queries, layout, data flow).
3. State any risks or open questions.
4. Wait for the user to confirm before writing any code.

Do not start implementing while the plan is being reviewed.
Do not expand the scope of the plan during implementation.

Example plan format:

> **Files to create:** `src/app/director/players/page.tsx`
> **Files to modify:** none
> **What it does:** Fetches `v_player_summary` via `getPlayerSummaries()`. Renders a list of player cards with name, level badge, status, group. Search input filters client-side by name.
> **Components used:** `Card`, `StatusBadge`, `LevelBadge`, `Avatar`, `SearchFilterBar`, `EmptyState`, `LoadingSkeleton`
> **Risk:** None — backend is ready, all components exist.

---

## Step 3 — Modify only the files listed in the approved plan

During implementation:

- Touch only the files named in the plan.
- If you discover that an unlisted file needs to change, stop and state why before changing it.
- Do not open backend files to "check something" and then edit them incidentally.
- Do not add features that were not in the plan ("while I'm here, I'll also add...").

---

## Step 4 — Build one module at a time

Do not start the next step in `CURRENT_BUILD_TARGET.md` until the current step is complete and confirmed.

One module = one implementation session.
A module is complete when:
- The page or component renders correctly with real data
- TypeScript compiles clean
- The user has confirmed it looks right

---

## Step 5 — Run TypeScript check

After implementation, always run:

```bash
npx tsc --noEmit
```

If errors exist:
- Fix errors in files you touched.
- If errors exist in files you did not touch, note them but do not fix them unless instructed.
- Do not mark a task complete while TypeScript errors exist.

---

## Step 6 — Summarize files changed

At the end of every session, list:

1. Files created (with a one-line description of what each contains)
2. Files modified (with a one-line description of what changed)
3. Files that were read but not changed

Example:

> **Created:**
> - `src/app/director/players/page.tsx` — Players list with search filter and player card grid
>
> **Modified:**
> - `src/components/player/PlayerProfileHeader.tsx` — Updated back link to `/director/players`
>
> **Read only:**
> - `src/lib/backend/players.ts`, `src/components/ui/index.ts`

---

## Step 7 — Update `docs/CHANGELOG.md`

After every completed module, add a dated entry to `docs/CHANGELOG.md`.

Format:

```markdown
## 2026-04-28 — Players List

- Created `src/app/director/players/page.tsx`
- Updated back link in `PlayerProfileHeader`
- TypeScript: clean
```

Do not update the changelog while the module is still in progress.

---

## Step 8 — Do not expand scope

If during a build task you notice something adjacent that could be improved:

1. Note it.
2. Do not implement it.
3. The user can add it to a future build task.

Scope expansion is the most common cause of broken builds and stale TypeScript errors.

Examples of scope creep to avoid:

- "I'll just clean up this component while I'm here"
- "I'll refactor this query to be more efficient"
- "I'll add role filtering even though it wasn't in the plan"
- "I'll fix this error.tsx too since it's related"

Each of these belongs in a separate, explicitly planned task.

---

## Quick reference checklist

Before starting:
- [ ] Read the 5 required docs
- [ ] Audit the specific files the task will touch
- [ ] State the plan

During:
- [ ] Only touch listed files
- [ ] One module at a time

After:
- [ ] `npx tsc --noEmit` passes
- [ ] Summarize files changed
- [ ] Update CHANGELOG.md

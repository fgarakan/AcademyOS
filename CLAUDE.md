# Academy OS — Claude Code Instructions

This file is loaded automatically by Claude Code at the start of every session.
Read it fully before doing anything else.

---

## Required reading — load before every session

Before writing any code or making any plan, read these files in order:

0. `/docs/ARCHITECTURE.md` — the Architecture Constitution. **The highest architectural authority in the codebase.** It outranks every other document; all work must conform to it, and architectural changes update it first.

1. `/docs/AI_BACKEND_RULES.md` — backend safety rules. Non-negotiable.
2. `/docs/CURRENT_BUILD_TARGET.md` — what is being built right now and in what order.
3. `/docs/LOCKED_MODULES.md` — what must not be touched, what is in progress, what does not exist yet.
4. `/docs/KNOWN_LIMITATIONS.md` — current gaps and broken/incomplete things.
5. `/docs/MODULE_BUILD_PROCESS.md` — the process to follow for every build task.

Do not treat `Academy_OS_Master_Build/generated/` docs as current truth. Those were written before the app existed and are stale. Verify against actual files.

---

## Project identity

**Product:** Academy OS — a director-led, voice-capable operating system for tennis academies.

**Operating model:**
> Voice creates → UI confirms → Database structures → System executes

**Central objects:**
- Player Profile is the central student data object.
- Placement Engine is the onboarding entry point.
- Director Dashboard is the command center (built last, after its components exist).

**Role hierarchy:**
- `academy_director` → `/director`
- `head_coach` / `coach` → `/coach`
- `player` → `/player`
- `parent` → `/parent`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (Server Components + Server Actions) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Auth | Supabase Auth, email+password, role-routing middleware |
| Styling | Tailwind CSS with custom dark/lime design tokens |
| Types | `src/lib/supabase/database.types.ts` (generated — 9 636 lines) |
| Icons | lucide-react |
| Charts | recharts |

---

## Design system — do not deviate

**Palette (source of truth: `tailwind.config.ts` + `src/app/globals.css`)**

| Token | Value | Use |
|---|---|---|
| `base` | `#0A0A0A` | Page background |
| `surface` | `#111111` | Card background |
| `surface-raised` | `#1A1A1A` | Elevated card |
| `border` | `#222222` | Default border |
| `lime` | `#C8FF00` | Primary accent, active states |
| `text-primary` | `#FFFFFF` | Headlines |
| `text-secondary` | `#AAAAAA` | Body |
| `text-muted` | `#555555` | Labels, meta |
| `status-red` | `#FF3B30` | Error, urgent |
| `status-orange` | `#FF9500` | Warning |
| `status-green` | `#30D158` | Success |
| `status-blue` | `#0A84FF` | Info |

**Do not use the colors in `Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/DESIGN_SYSTEM.md` — those describe a different version and do not match the implemented system.**

**Typography**
- Font: Inter (sans) + JetBrains Mono (mono)
- Key numbers: `font-mono text-lime`
- Labels: `label-xs` utility class (`text-[11px] uppercase tracking-widest text-text-muted`)

**Cards**
- `<Card>` from `src/components/ui` — use this, never raw divs for card surfaces.
- Hover: `hover` prop on Card enables lime border glow.

**Buttons**
- `btn-lime` — primary action
- `btn-ghost` — secondary/cancel
- `btn-danger` — destructive

**Layouts**
- Director: fixed sidebar (`w-60`) + `flex-1` main area. Content inside `<main>` gets padding from the page, not the layout.
- Coach/Player/Parent: `BottomTabBar` + `max-w-2xl mx-auto p-4` main area.
- Desktop split panes: allowed for Director screens.
- Mobile: use clean multi-page flows, not cramped split panes.

---

## Architecture red lines — never cross

These rules exist in `docs/AI_BACKEND_RULES.md` and are repeated here for visibility:

1. Voice never directly mutates core data — always goes through the proposed_actions pipeline.
2. `template_blocks` and `session_blocks` are separate tables — never merge them.
3. All tables have RLS — never create a table without it.
4. `finalize_player_placement()` is the only function that activates a player.
5. `execute_approved_action()` is the only function that executes approved voice actions.
6. All major mutations write to `audit_logs`.

---

## What to do at the start of every session

1. Read the five docs listed above.
2. Read `src/app/director/players/[playerId]/page.tsx` to understand the current component and query pattern.
3. Read `src/components/ui/index.ts` to see what UI components are available.
4. Check `docs/CURRENT_BUILD_TARGET.md` to confirm what the active build target is.
5. Do not write code until you have stated a plan and had it confirmed.

---

## Sprint execution protocol

For every sprint, follow this exact sequence:

1. Read the five required docs listed at the top of this file.
2. Read `src/app/director/players/[playerId]/page.tsx` for component/query pattern.
3. Read `src/components/ui/index.ts` for available components.
4. State a short plan: files to create/modify, one-line description of each, any risks, whether a migration is needed.
5. **Stop. Wait for confirmation before writing any code.**
6. Implement only the files named in the confirmed plan.
7. Run `npx tsc --noEmit`. Fix only errors caused by sprint changes.
8. Re-run `npx tsc --noEmit` until clean.
9. Run `git status --short`. Confirm only intended files changed.
10. Update `docs/CHANGELOG.md` with a dated entry.
11. Provide the exact `git add` command listing each file by name.
12. Provide the exact commit message: `Sprint NN — Short description`.
13. **Stop. Do not commit. Wait for the user to explicitly say "commit".**

---

## Git hygiene

- Never `git add .` or `git add -A`. Stage only sprint-specific files by name.
- Never stage unrelated modified files.
- Never commit without explicit user instruction.
- Never push unless the user explicitly asks.
- Never amend a published commit.
- Never force-push.
- Never bypass hooks (`--no-verify`).

---

## Security and product guardrails

These rules apply to every sprint, every session. No exceptions without explicit user approval in the sprint prompt.

**Never do without explicit sprint approval:**
- Install npm packages
- Create or modify database migrations
- Create tables without RLS
- Use service role or bypass RLS in any query
- Expose parent/player data to unauthorized roles
- Trigger automatic player level movement
- Make external AI API calls
- Send communications (email, push, SMS, Slack)
- Present fake/seed data as real
- Hide mutations (all state changes go through `proposed_actions` or `audit_logs`)

**Core operating model — never violate:**
> AI proposes → Director/Head Coach approves → System records → System executes

**Protected files — never edit unless sprint explicitly names them:**
- `.env.local`
- `src/lib/supabase/database.types.ts` (only updated via `supabase gen types`)
- `supabase/migrations/*` (only added when sprint explicitly allows a migration)
- `index.html`
- `data/airtable-import/reports/*`
- `data/airtable-import/*.csv`
- `.next/`
- `node_modules/`

---

## Validation requirement

Every sprint must end with a clean TypeScript check:

```bash
npx tsc --noEmit
```

Do not mark a sprint complete while TypeScript errors exist in files you touched.

---

## Available project commands

Invoke with `/command-name` (e.g. `/academy-sprint Sprint 43 — Voice Attendance Exception Drafts V1`).

| Command | Purpose |
|---|---|
| `/academy-sprint` | Full sprint execution workflow |
| `/academy-guardrails` | Product safety checklist before committing |
| `/supabase-sprint` | Supabase-specific sprint protocol |
| `/review-queue-workflow` | proposed_actions / director review queue patterns |
| `/voice-workflow` | Voice-first workflow patterns |

See `docs/CLAUDE_CODE_OPERATING_SYSTEM.md` for the full usage guide.

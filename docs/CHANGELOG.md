# Changelog

Records completed build milestones in chronological order.
Update this file at the end of every completed module.

---

## 2026-04-28 — Guardrail and source-of-truth layer

Created the permanent Claude Code guardrail system before further feature work.

**Files created:**
- `CLAUDE.md` — root-level Claude session instructions, design system reference, architecture red lines
- `docs/AI_BACKEND_RULES.md` — backend safety rules (10 rules, backend file status table)
- `docs/CURRENT_BUILD_TARGET.md` — current build phase and step-by-step build order
- `docs/LOCKED_MODULES.md` — locked / in-progress / not-built module registry
- `docs/KNOWN_LIMITATIONS.md` — documented gaps, missing features, stale docs warnings
- `docs/MODULE_BUILD_PROCESS.md` — 8-step process for every future build task
- `docs/CHANGELOG.md` — this file

**No app functionality changed.**
**No backend files changed.**
**No frontend files changed.**

---

## 2026-04-27 — Backend stable, TypeScript clean

All backend files in `src/lib/backend/` compile without TypeScript errors.

Covered:
- `director.ts` — player profile data, recommendation overrides
- `players.ts` — player list, signals, priorities, recommendations, progress snapshots
- `curriculum.ts` — domain progress, assignment RPC, advancement evaluation RPC
- `assessments.ts` — create assessment, placement recommendations, finalize placement
- `sessions.ts` — session CRUD, session recommendations, attendance, outcomes
- `dashboard.ts` — priority queue, group summaries, reassessment pipeline
- `intelligence.ts` — behavior profiles, predictions, coaching messages
- `utr.ts` — UTR recording, history, insights
- `voice.ts` — voice command submission, proposed action approval/rejection/execution

TypeScript: clean.

---

## 2026-04-27 — Initial role-based app shell

Framework, auth, and layout shells committed.

- Next.js 14 App Router initialized
- Supabase Auth with email+password
- Middleware role routing: director → `/director`, coach → `/coach`, player → `/player`, parent → `/parent`
- Director sidebar layout (`SidebarNav`)
- Coach/Player/Parent bottom tab layout (`BottomTabBar`)
- Login page (`/login`) fully functional
- Signout API route (`/api/auth/signout`)
- Tailwind design system configured (dark base, lime accent)
- UI component library created: Card, MetricCard, ActionCard, StatusBadge, LevelBadge, ProgressBar, Avatar, EmptyState, LoadingSkeleton, SectionHeader, Modal, Tabs, Table, SearchFilterBar, DomainRing

---

## 2026-04-27 — Player Profile v0

First real feature page built at `/director/players/[playerId]`.

What works:
- Player header: name, initials avatar, level badge, advancement status, last evaluated date
- Curriculum grid: 8-domain skill progress (status, mastery %, blocked-by list)
- Player info sidebar: status, join date, DOB, notes
- Coach Focus sidebar: advancement evaluation button, domain summary counts, blocked-by list
- Assign curriculum Server Action
- Evaluate advancement Server Action
- Loading skeleton (`loading.tsx`)
- Empty state when no curriculum is assigned

Data: all real Supabase queries (no mock data).

Known gaps logged in `docs/KNOWN_LIMITATIONS.md`:
- No tab structure yet
- 3-column fixed layout not mobile-safe
- Back link points to stub dashboard (will fix after Players List is built)

TypeScript: clean.

---

## 2026-04-28 — Players List

Built the player directory at `/director/players` (Step 1 of Phase 1).

**Files created:**
- `src/app/director/players/page.tsx` — Server Component; fetches academy_id from profiles, calls `getPlayerSummaries()`, renders page header and client component
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Client Component; search by name, filter by status (All / Active / Reassessment Due / On Hold / Pending), player rows with Avatar, StatusBadge, LevelBadge, last assessed date, next due date with overdue indicator, promotion-ready chip
- `src/app/director/players/loading.tsx` — Next.js skeleton; 8 SkeletonRows inside a Card

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Player Profile responsive layout (Step 2)

Fixed the broken 3-column fixed layout at `/director/players/[playerId]`.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced `grid-cols-[260px_1fr_260px]` with responsive `grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px]`; added `lg:col-span-2 xl:col-span-1` to Coach Focus column so it spans full width at `lg` and returns to a single column at `xl`; added `p-6` to page wrapper
- `src/components/player/PlayerProfileHeader.tsx` — fixed back link from `/director` → `/director/players`, label from `Dashboard` → `All Players`

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## Next build target

**Player Profile tab structure** — `/director/players/[playerId]`

See `docs/CURRENT_BUILD_TARGET.md` Step 3 for full specification.

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

## 2026-04-28 — Director layout sidebar offset fix

Fixed content rendering underneath the fixed sidebar on all `/director` routes.

**Files modified:**
- `src/app/director/layout.tsx` — added `ml-60` to `<main>` so content is offset 240px right, matching the fixed sidebar width. Single global fix; no per-page hacks needed.

**No backend files changed.**
**No locked files changed.**
**No player profile data logic changed.**
TypeScript: clean.

---

## 2026-04-28 — Director Dashboard V1

Built the command center at `/director` (Step 5 of Phase 1, built ahead of Steps 3–4 by explicit request).

**Files modified:**
- `src/app/director/page.tsx` — replaced 6-line stub with full Server Component dashboard

**Data fetched (sequential per AI_BACKEND_RULES):**
- `profiles` → `academy_id`
- `academies` → `name` (for header)
- `getPlayerSummaries()` → all 4 snapshot metrics + pending placement list
- `getAcademyPriorityQueue({ limit: 5 })` → priority panel

**Sections built:**
- Header: academy name label + "Command Center" H1 + today's date
- Snapshot metrics: Total Players / Active / Pending Placement / Needs Attention (all real data)
- Priority Queue card: top 5 priority items with urgency badge + primary action; empty state if none
- Pending Placement card: up to 5 pending players with status badge; empty state if none
- Module cards: Players (live, links to `/director/players`) + 5× Coming Soon (Curriculum, Sessions, Intelligence, Reports, Configuration)

**No backend files changed.**
**No locked files changed.**
**No fake numbers — all metrics derived from real Supabase queries.**
TypeScript: clean.

---

## 2026-04-29 — Player Profile tab structure (Step 3)

Added 5-tab workspace to the Player Profile at `/director/players/[playerId]`.

**Files created:**
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — minimal Client Component; accepts 5 `ReactNode` slots; renders `Tabs` with `scrollable` TabsList and one `TabsContent` per tab

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — refactored layout from 3-column grid into 5 named slot variables passed to `PlayerProfileTabs`

**Tab breakdown:**
1. Overview — Player Info card + Coach Focus summary (domain counts, advancement status); no action button
2. Skill Path — EvaluateAdvancementButton + advancement eligible/blocked-by logic + CurriculumProgressGrid or PlayerCurriculumEmptyState
3. Competition — premium `EmptyState` placeholder; no fake data
4. Fitness / Load — premium `EmptyState` placeholder; no fake data
5. Notes — premium `EmptyState` placeholder; no fake data; prepares for Coach Notes + Voice Notes

**Architecture notes:**
- `page.tsx` remains a Server Component; all data fetching unchanged
- Server actions (`assignAction`, `evaluateAction`) remain bound in the Server Component and passed to child Client Components via slot content — no function references cross the Server → `PlayerProfileTabs` boundary
- Icons (`Trophy`, `Activity`, `MessageSquare`) are imported and rendered in `page.tsx` (Server Component) as part of slot JSX; no icon function references passed as props
- `TabsList scrollable` prop handles horizontal tab overflow on narrow viewports

**No backend files changed.**
**No Supabase files changed.**
**No locked modules changed.**
**No fake data added.**
TypeScript: clean.

---

## 2026-04-29 — Coach Notes Foundation (Phase 1)

Built the real Notes tab for coach-facing player development notes.

**Files created:**
- `supabase/migrations/039_player_development_summary.sql` — new `player_development_summary` table; full RLS (staff read/write, players/parents gated behind show_to_student/show_to_parent flags which default false)
- `src/lib/backend/notes.ts` — four backend helpers: `getCoachObservations`, `createCoachObservation`, `getPlayerDevelopmentSummary`, `upsertPlayerDevelopmentSummary`; uses `rawDb = db as any` for the new table (types will resolve after migration + `supabase gen types`)
- `src/lib/actions/notes.ts` — two server actions: `addObservationAction`, `updateDevelopmentSummaryAction`; authenticated, validated, revalidates player profile path
- `src/components/player/CoachObservationTimeline.tsx` — renders coach_observations for a player in reverse-chronological order; Internal badge when is_private; empty state
- `src/components/player/DevelopmentSummarySection.tsx` — read-only display of development summary; shows strengths, priorities, development focus, coach summary, student-facing preview with visibility labels
- `src/components/player/AddObservationForm.tsx` — client form; observation_type dropdown (all 8 existing values), content textarea, is_private toggle (defaults true/internal)
- `src/components/player/EditDevelopmentSummaryForm.tsx` — client form; newline-separated strengths/work-ons converted to arrays; visibility toggles rendered but disabled (future sprint gate)

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced Notes tab placeholder with real UI; sequential data fetching for observations and development summary; bound server actions for forms

**Constraints confirmed:**
- No voice features built
- No AI structuring built
- No fake or hardcoded notes
- Coach-only notes not exposed to player or parent routes (RLS + show_to_student/show_to_parent default false)
- coach_observations schema untouched
- voice_notes schema untouched
- parent_updates schema untouched
- No locked modules modified

**Migration note:** Migration `039` must be applied and `supabase gen types typescript` run before deploying. The `player_development_summary` backend helpers use `rawDb = db as any` until types are regenerated.

TypeScript: clean.

---

## 2026-04-29 — Voice Note Capture MVP (transcript-first)

Added transcript-first voice note capture to the Notes tab.

**Files created:**
- `src/components/player/AddVoiceNoteForm.tsx` — client form; textarea for transcript (with device dictation microcopy), observation_type dropdown, is_private toggle (default true); follows AddObservationForm pattern with useTransition

**Files modified:**
- `src/lib/backend/notes.ts` — added `createVoiceNoteWithObservation()`: three sequential queries — insert voice_notes (processing_status=pending), insert coach_observations, update voice_notes.parsed_observation_id + processing_status=parsed
- `src/lib/actions/notes.ts` — added `addVoiceNoteAction()`: authenticates user, validates transcript and observation_type, calls createVoiceNoteWithObservation, revalidatePath
- `src/app/director/players/[playerId]/page.tsx` — imported AddVoiceNoteForm and addVoiceNoteAction; bound server action; added AddVoiceNoteForm below AddObservationForm in notesSlot

**Architecture constraints confirmed:**
- No migration created — voice_notes already existed in migration 010 and database.types.ts
- No schema changes — voice_notes, coach_observations, player_development_summary untouched
- No browser recording, audio upload, Supabase Storage, transcription, or AI structuring
- No voice command execution or proposed_actions pipeline
- Voice notes are staff-only (existing RLS); resulting observations default is_private=true
- No player or parent exposure

**Data flow:** transcript → voice_notes row (processing_status=parsed) → coach_observations row via parsed_observation_id → appears in CoachObservationTimeline immediately

TypeScript: clean.

---

## 2026-04-29 — AI Note Structuring MVP

Added coach-reviewed AI draft generation for player development summaries.

**Files created:**
- `src/lib/ai/structureCoachNote.ts` — Anthropic SDK call; `AIDraftResult` type; system prompt enforcing tennis coaching tone; JSON validation; safe error on missing API key
- `src/components/player/AIDraftPanel.tsx` — client component; note textarea; "Draft with AI" button with loading state; editable draft fields (strengths, work-ons, focus, coach summary, student summary); confidence badge; warnings display; overwrite warning with explicit confirmation gate when existing summary has content; "Apply Draft to Summary" form submission

**Files modified:**
- `src/lib/actions/notes.ts` — added `generateNoteDraftAction()` server action; authenticated; returns `GenerateDraftResult` (ok+draft or error string); does not write to database
- `src/app/director/players/[playerId]/page.tsx` — imported `AIDraftPanel`, `generateNoteDraftAction`; inserted `AIDraftPanel` in Notes tab between `DevelopmentSummarySection` and `EditDevelopmentSummaryForm`
- `package.json` / `package-lock.json` — added `@anthropic-ai/sdk`

**Constraints confirmed:**
- No migration created
- No schema changes (player_development_summary, coach_observations, voice_notes untouched)
- No AI output auto-saved — coach must click "Apply Draft to Summary"
- show_to_student and show_to_parent hardcoded false in apply form
- source set to 'ai_draft' on apply
- API key never exposed to client — call is server-side only
- Overwrite protection: if existing summary has content, a warning block appears and coach must click confirm before the apply form is shown
- Player and parent routes not modified
- No fake or hardcoded AI responses

TypeScript: clean.

---

## Next build target

**Player Profile tab content** — fill Step 4 tabs with real backend data

See `docs/CURRENT_BUILD_TARGET.md` Step 4 for full specification.

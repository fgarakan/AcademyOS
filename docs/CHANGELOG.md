# Changelog

Records completed build milestones in chronological order.
Update this file at the end of every completed module.

---

## 2026-04-30 — Sprint 12: Fitness Template Builder Save Verification + Edit Hardening

Hardened the Sprint 11 Fitness Template Builder. No new product features — reliability and security fixes only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Six hardening additions:
  (1) Reject empty/missing IDs before any DB query.
  (2) Reject duplicate block IDs in submitted payload.
  (3) Reject duplicate exercise IDs in submitted payload.
  (4) Reject negative duration values at server level (client also validates, now double-checked).
  (5) Fix exercise block_id verification — now fetches `id, block_id` from DB and verifies each submitted exercise's `block_id` matches the actual DB record. Previous check only verified the exercise existed in *any* submitted block; a wrong submitted `block_id` would pass verification but cause the DB update to silently match no rows (silent data loss).
  (6) Add server-side `order_index` normalization — sort blocks and exercises (per block) by submitted `order_index`, then reassign as clean 0-based sequential integers. Ensures no gaps, no duplicates, no negative values written to DB regardless of client input. Critical for future voice command compatibility.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — Three hardening additions:
  (1) `saveSuccess` state — shows "Template saved" with check icon after successful save, auto-clears after 3 seconds.
  (2) Master template warning — edit mode now shows: "Director edits update the official template. Coach changes during live sessions will be handled as session overrides and will not affect this master template." This is architecturally important to distinguish master-template writes from future coach session overrides.
  (3) `confirmedBlocks` and `editBlocks` initialized with `deepCopyBlocks` (lazy initializer) so they never share object references with `initialBlocks` props from the server.

**Constraints confirmed:**
- No migrations
- No npm install
- No service role
- No RLS bypass
- No new product features (no drag/drop, create, delete, publish, voice, session generation)
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

---

## 2026-04-30 — Sprint 11: Fitness Template Builder V1 (Director Edit Mode)

Added director-only edit mode to the fitness template detail page. Directors can now reorder blocks, reorder exercises within blocks, and edit durations — all from the existing read-only viewer at `/director/fitness/templates/[templateId]`.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Server action `saveTemplateEditsAction` with 5-step security chain (auth → academy_id → template ownership → block ID validation → exercise ID validation). Defines `TemplateOperation` type union aligned with future voice command pathway (`reorder_block`, `reorder_exercise`, `update_block_duration`, `update_exercise_duration`). Sequential per-row updates with double-lock `.eq('id') + .eq('template_id'/'block_id')`.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — `'use client'` component managing read/edit mode toggle. Up/down chevron buttons for block and exercise reordering (no drag/drop — no library installed). Editable `<input type="number">` for `block.duration_min` (required) and `exercise.duration_min` (nullable). Save/Cancel controls with `useTransition` for pending state. Array position → `order_index` on save.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Builds `EditableBlock[]` shape from fetched data; renders `<TemplateEditor>` instead of static block cards; removed "Read-only" lock badge (mode indicator now lives in TemplateEditor).

**Constraints confirmed:**
- No migrations created
- No packages installed
- No service role used
- No RLS bypass
- No create/delete/publish/duplicate
- No voice UI
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

## 2026-04-29 — Coach Workspace Navigation V1

Added safe, demo-ready shell pages for the three missing coach nav routes. Bottom nav is now fully navigable.

**Files created:**
- `src/app/coach/players/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders assigned players only (filtered via `coach_group_assignments`); initials avatar + `full_name` + `group_name · level_label` + `player_status` badge; `EmptyState` fallback; no edit actions; no links to player profiles
- `src/app/coach/sessions/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders today's sessions with name, `scheduled_time`, and status badge; `EmptyState` fallback; coming-soon footer (Session plans · Attendance · Group check-in)
- `src/app/coach/voice/page.tsx` — sync static Server Component; no Supabase imports; hero card + three disabled coming-soon tiles (Record Voice Note, Structure into Observation, Review Before Saving) + coach-review safety note; no `voice_notes` queried

**No files modified** beyond this changelog.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No backend helper changes (`coachWorkspace.ts` untouched)
- No layout changes (`coach/layout.tsx` untouched)
- No BottomTabBar changes
- No player or parent portal changes
- No service role / `getSupabaseAdmin` used
- No write actions added
- No `voice_notes` queried
- No AI drafts queried
- No fake data — real queries with `EmptyState` fallbacks; voice page is fully static
- `player_status` used (not `status`) — verified against `v_player_summary` in `database.types.ts`
- PreviewBanner inherited automatically from `coach/layout.tsx` on all three new routes
- BottomTabBar highlights correctly: Players/Sessions/Voice use `startsWith`, Home uses `exact: true`

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → `/platform`
3. Click "Preview as Coach" on any academy card → `/coach` loads with PreviewBanner
4. Click "Players" tab → `/coach/players` loads; Players tab highlighted; player list or empty state; no 404
5. Click "Sessions" tab → `/coach/sessions` loads; Sessions tab highlighted; today's sessions or empty state; no 404
6. Click "Voice" tab → `/coach/voice` loads; Voice tab highlighted; hero card + 3 tiles + safety note; no 404
7. Click "Home" tab → `/coach` loads; only Home tab highlighted (exact match)
8. Click "Exit Preview" → `/platform`
9. No runtime errors on any route

---

## 2026-04-29 — Platform Preview Mode Infrastructure (Phase 1B)

Enables platform users (platform_owner / platform_admin) to enter a read-only preview of any academy's portal UI, scoped to a chosen role. Writes are blocked in preview. Normal academy users are completely unaffected.

**Files created:**
- `src/lib/utils/previewMode.ts` — `PreviewRole` type, `PreviewContext` interface, `PREVIEW_COOKIE` constant; `parsePreviewCookie()` (pure, safe for Edge/middleware); `getPreviewContext()`, `isPreviewMode()`, `assertNotPreviewMode()` (Server Component / Server Action use only, via dynamic `import('next/headers')` to avoid Edge Runtime issues)
- `src/lib/actions/platform.ts` — `enterPreviewModeAction(academyId, role)`: authenticates user, verifies platform_roles row, validates role, reads academy name, sets httpOnly `ao_preview` cookie (sameSite strict, 8-hour maxAge, secure in production), redirects to correct portal; `exitPreviewModeAction()`: deletes cookie, redirects to /platform
- `src/components/platform/PreviewBanner.tsx` — async Server Component; reads preview context via `getPreviewContext()`; renders lime-accented banner with role, academy name, "Writes are disabled in preview." note, and Exit Preview form button; returns null when not in preview

**Files modified:**
- `src/middleware.ts` — platform user routing refactored: /platform still always accessible; root `/` still redirects to /platform; portal routes (director/coach/player/parent) now require a valid `ao_preview` cookie with matching role — no matching cookie → redirect to /platform; non-platform users are completely unaffected (their path is structurally separated and unchanged)
- `src/app/platform/page.tsx` — each academy card now has a "Preview Portal" section with 4 buttons (Director / Coach / Player / Parent); each button binds `enterPreviewModeAction` with the academy ID and role; "Preview Mode" removed from coming-soon module cards
- `src/app/director/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/coach/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/player/layout.tsx` — removed `'use client'` (layout has no hooks; BottomTabBar carries its own `'use client'`); `<PreviewBanner />` added above `{children}`
- `src/app/parent/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/lib/actions/notes.ts` — `await assertNotPreviewMode()` added as first line of `addObservationAction`, `updateDevelopmentSummaryAction`, `addVoiceNoteAction`; `generateNoteDraftAction` is NOT guarded (no DB write)
- `src/lib/actions/curriculum.ts` — `await assertNotPreviewMode()` added as first line of `assignCurriculumAction`, `evaluateAdvancementAction`
- `src/components/nav/PlatformNav.tsx` — "Preview Mode" removed from `COMING_SOON_ITEMS` (preview is now live in academy cards)

**Constraints confirmed:**
- No migrations created
- No schema changes
- No service role / `getSupabaseAdmin()` used
- `ao_preview` cookie only benefits platform users (middleware ignores it for non-platform users)
- Writes blocked in preview: `assertNotPreviewMode()` guards all 5 mutating server actions
- Normal director/coach/player/parent users are completely unchanged
- No coach/player/parent shell improvements built
- No fake data created
- No academy_memberships created or modified
- No database roles changed
- No RLS bypassed
- Cross-academy live data preview deferred (RLS still uses profiles.academy_id)

**Preview mode scope (Phase 1B):**
Preview shows the portal shell and any data the authenticated platform user's own Supabase session can read via normal RLS. It does not bypass RLS or show cross-academy private data. Full cross-academy data preview is deferred to a future approved RLS migration.

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → land on /platform
2. On an academy card, click "Director" → `ao_preview` cookie set → redirected to /director with PreviewBanner visible
3. Attempt "Assign Curriculum" or "Add Observation" → should throw "Writes are disabled in preview mode."
4. Click "Exit Preview" → cookie deleted → redirected to /platform
5. Repeat with Coach / Player / Parent roles — each shows correct PreviewBanner
6. Log in as a normal academy_director → /platform should redirect to /director; `ao_preview` cookie (if present) has no effect
7. As platform user with no preview cookie, manually visit /director → redirected to /platform

---

## 2026-04-29 — Multi-Tenant Access Foundation Phase 1A: Platform Role + Shell

Established the minimum safe platform-owner foundation. Angles / platform owner can now log in, be routed to `/platform`, and view all academy tenants read-only.

**Files created:**
- `supabase/migrations/040_platform_roles.sql` — `platform_roles` table (user_id → platform_owner | platform_admin); RLS: users see own active row only; additive SELECT policy on `academies` so platform users can list all tenants via anon key (no service role needed)
- `src/lib/backend/platform.ts` — two backend helpers: `getPlatformRole(db, userId)`, `getAllAcademies(db)`; rawDb cast for platform_roles (not yet in database.types.ts)
- `src/components/nav/PlatformNav.tsx` — fixed sidebar for /platform routes; shows "Angles Platform" brand + role badge; primary nav (Tenants); coming-soon items (Tenant Management, Consultant Access, Preview Mode, Billing, Global Templates); sign-out button
- `src/app/platform/layout.tsx` — Server Component; verifies platform role (redirects to /login if not found); renders PlatformNav + main content
- `src/app/platform/page.tsx` — Server Component; shows Platform Command Center header with role badge; academy tenant cards (name, slug, country, timezone, is_active badge, created date); coming-soon module cards; no player data, no private data

**Files modified:**
- `src/middleware.ts` — checks platform_roles BEFORE academy_memberships; /platform routes allow only platform users (others redirected to their academy home); root `/` redirects platform users to /platform; non-platform routes with no matching academy role redirect platform users back to /platform (e.g. a platform_owner also with academy_director membership can still access /director)
- `src/app/login/LoginForm.tsx` — checks platform_roles after successful auth; platform users immediately routed to /platform before academy membership check runs
- `docs/CHANGELOG.md` — this entry

**Constraints confirmed:**
- No preview mode built
- No consultant access built
- No write guards added (deferred to Phase 1B)
- No service role / `getSupabaseAdmin()` used in /platform routes — anon key + RLS only
- No player data, coach notes, voice notes, AI drafts, or private observations shown
- No modifications to profiles.academy_id, academy_memberships, database.types.ts, or any locked modules
- No schema changes beyond migration 040
- Existing /director, /coach, /player, /parent routing unchanged

**To activate:**
1. Apply migration 040 in Supabase Dashboard (SQL Editor)
2. Manually INSERT a row into `platform_roles` for the platform owner's auth.users UUID
3. Run `supabase gen types typescript` to update database.types.ts after migration

TypeScript: clean.

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

## 2026-04-29 — Coach / Player / Parent Shell V1

Premium shell pages for all three non-director portals. Shell-only — no data queries, no private data exposure, no fake data.

**Files modified:**
- `src/app/coach/page.tsx` — Coach Hub shell: header with current date, Today's Sessions card (EmptyState + coming-soon footer), My Players + Recent Notes in sm:grid-cols-2 with "Soon" badges, 4 disabled Quick Action tiles (opacity-50 / cursor-not-allowed), On the Roadmap pills
- `src/app/player/page.tsx` — Player Home shell: "YOUR JOURNEY" header, motivating tagline, Today's Mission (lime accent), My Skills, Wins & Streaks, Messages cards (all EmptyState), Coming Soon pill row
- `src/app/parent/page.tsx` — Parent Home shell: "FAMILY PORTAL" header, Child's Progress (lime accent), Latest Coach Update, Session Consistency, Support at Home (static safe copy — no data), Messages & Updates cards

**Constraints confirmed:**
- No new files created
- No migrations
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform action changes
- No server action changes
- No backend helper changes
- No layout changes
- No BottomTabBar changes
- No Supabase queries — all three pages are plain sync Server Components
- No async added to any page
- No private coach notes, AI drafts, voice transcripts, or internal summaries exposed to player or parent
- No fake data — all cards use EmptyState or safe static copy
- PreviewBanner continues rendering from layouts (untouched)

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → /platform loads
2. Click "Preview as Coach" on any academy card
   → /coach loads with PreviewBanner visible
   → Coach Hub header + today's date visible
   → Today's Sessions, My Players, Recent Notes, Quick Actions, Roadmap all visible
   → Bottom nav: Home / Players / Sessions / Voice — all render
   → No runtime errors
3. Click "Exit Preview" → /platform
4. Click "Preview as Player" on any academy card
   → /player loads with PreviewBanner visible
   → Player Home header + tagline visible
   → Today's Mission, My Skills, Wins & Streaks, Messages cards visible
   → Coming Soon pills visible
   → Bottom nav: Home / Progress / Wins / Messages — all render
   → No coach observations, notes, AI drafts, or voice transcripts visible
   → No runtime errors
5. Click "Exit Preview" → /platform
6. Click "Preview as Parent" on any academy card
   → /parent loads with PreviewBanner visible
   → Parent Home header visible
   → Child's Progress, Latest Coach Update, Session Consistency, Support at Home, Messages & Updates visible
   → No gamified player language, no coach observations, no internal notes
   → No runtime errors
7. Click "Exit Preview" → /platform

---

## 2026-04-29 — Coach Workspace Real Data V1

Replaced the static Coach Hub shell with real Supabase data. No fake data, no new schema, no service role usage.

**Files created:**
- `src/lib/backend/coachWorkspace.ts` — `getCoachWorkspaceSummary(db, userId)`: sequential RLS-respecting queries; fetches coach profile → active group assignments → assigned groups (v_group_summary) → assigned players (v_player_summary filtered by group IDs) → recent coach_observations (by coach, not voice_notes) → player name resolution → today's sessions. Returns typed `CoachWorkspaceSummary` with graceful empty fallback.

**Files modified:**
- `src/app/coach/page.tsx` — converted from static shell to async Server Component; calls `getCoachWorkspaceSummary`; Today's Sessions renders real session rows with status badge; My Players renders up to 5 assigned players with initials avatar and group/level detail; Recent Notes renders up to 5 recent coach_observations with type label, Internal badge, and truncated content; all sections fall back to `EmptyState` when no data.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No player page, parent page, or layout changes
- No BottomTabBar changes
- No service role / getSupabaseAdmin used
- No write actions added
- No voice_notes queried
- No AI drafts queried
- No fake data
- RLS not broadened
- Unassigned players not shown — players filtered only through coach's assigned group IDs via coach_group_assignments

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → /platform
3. Click "Preview as Coach" on an academy card
   → /coach loads with PreviewBanner visible
   → Today's Sessions: real sessions or empty state
   → My Players: real assigned players or empty state
   → Recent Notes: real coach_observations or empty state
4. Click "Exit Preview" → /platform

---

## Next build target

**Player Profile tab content** — fill Step 4 tabs with real backend data

See `docs/CURRENT_BUILD_TARGET.md` Step 4 for full specification.

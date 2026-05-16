# Integration Log — AcademyOS

Running log of sprint completions, module integrations, and significant architectural decisions.

**Last updated:** 2026-05-15

Each entry records: what changed, what it integrates with, and any decisions made that future agents must know.

---

## 2026-05-16 — Sprint 399: Persistent DONNA Panel State V1

**What changed:** Converted DONNA from a modal-like panel (clicking outside closes it) to a persistent executive side panel (only intentional close actions close it). Seven targeted edits to `DonnaAssistantButton.tsx`.

**Integrates with:**
- `DonnaAssistantButton.tsx` — core change: backdrop is now `pointer-events-none` (visual only, not a close target); all `closePanel()` calls on navigation/chip/link events removed
- `DirectorLayout` — no change; DONNA persistence on SPA navigation already works because `DonnaAssistantButton` lives in the layout and never unmounts on intra-director navigation
- All director routes (`/director/**`) — DONNA now stays open across page transitions

**Decisions recorded:**
- **Backdrop**: changed from `bg-black/40 backdrop-blur-sm onClick={closePanel}` to `bg-black/20 pointer-events-none`. This removes the modal behavior — page content is fully interactive while DONNA is open.
- **Navigation chips**: removed `closePanel()` from `Player Progress` and `Parent Updates` quick-nav chip handlers.
- **NAV_COMMANDS text navigation**: removed `closePanel()` from loop body and go-back handler — voice/text navigation no longer closes DONNA.
- **Recommendation card navigate**: removed `closePanel()` from `case 'navigate'`.
- **Quick links**: removed `onClick={closePanel}` from `<Link>` elements.
- **Suggestion card**: `onNavigate` prop no longer calls `closePanel()`.
- **Active glow**: floating button uses brighter gradient (`#7c3aed/#4f46e5`) + `boxShadow` when `panelOpen` is true. Restores to default when closed.
- **Close actions**: only the X button (`aria-label="Close assistant"`) and pre-existing Escape key handler close DONNA. These are intentional close actions.
- **SPA persistence**: `panelOpen` is `useState` in `DonnaAssistantButton`. Because the component lives in `DirectorLayout` (a shared layout), it does NOT remount on intra-director client-side navigation. State naturally persists.

---

## 2026-05-16 — Sprint 398: Demo Data Seed and DONNA Stub Visibility V1

**What changed:** Added a safe local static demo data layer (`src/lib/demo/demoData.ts`) for the three director screens that were showing empty states during demos. Added DONNA stub honesty: unwired task shortcuts now show a "Coming soon" badge and respond with an honest "coming soon" message instead of silently failing.

**Integrates with:**
- `/director/today` — uses `DEMO_SESSIONS` + `DEMO_PENDING_COUNT` when `?demo=1`
- `/director/level-up` — uses `DEMO_PIPELINE_ROWS` when `?demo=1`
- `/director/parents` — uses `DEMO_PARENT_UPDATES` when `?demo=1`
- `DonnaAssistantButton.tsx` — `WIRED_TASK_IDS` set gates badge rendering; `handleStartGenericTask` returns honest "coming soon" message for unwired task IDs
- No Supabase reads or writes in demo mode — all data is static TypeScript constants

**Decisions recorded:**
- Demo mode is gated exclusively on `searchParams.demo === '1'`. Normal mode DB queries are unchanged and run in the `else` branch only.
- Demo data is pure TypeScript constants computed at module load time. No server actions, no DB reads, no faker libraries.
- `DemoSession` interface in `demoData.ts` is structurally identical to `SessionWithMeta` in `today/page.tsx` — TypeScript structural typing allows direct use without a separate cast on most fields.
- "Coming soon" badge (9px, pill, text-muted) renders only for task shortcuts where `!WIRED_TASK_IDS.has(taskId)`. Four task IDs are unwired: `create_group`, `assign_player_to_group`, `summarize_player_progress`, `recommend_template_for_group`.
- The DONNA panel "Send" button found during QA was the voice draft submit button inside the DONNA overlay (disabled) — NOT a parent-comms auto-send. This is a pre-existing, already-safe element.

---

## 2026-05-15 — Sprint 396: Final Prototype Visual Match + Regression V1

**What changed:** Docs only. Full regression QA pass — no source code modified.

**Verified clean:**
- 7 routes (386–395): all load, no redirects, no crashes
- DONNA panel (Sprint 392): w-96, 4 tab chips, approval copy, Review Queue intact
- Context registry (Sprint 393): all 6 entries present, `/director` is last (prefix-match safe)
- Design tokens (Sprint 394): label-xs applied, no hardcoded hex
- Protected actions: no direct DB writes in any new screen
- Demo mode (Sprint 395): functional, no regression
- Mobile viewport (390px): coach recap loads clean, no overflow
- Naming: 0 DANA occurrences across all sprint files

**Sprint 387–396 relay complete.**

---

## 2026-05-15 — Sprint 395: Guided Director Demo Flow V1

**What changed:** New `DemoModeBanner` client component injected into the director layout via `<Suspense>`. When `?demo=1` is present in the URL, a sticky banner appears below `PreviewBanner` showing the current demo step, label, hint, and Next → navigation.

**Integrates with:**
- `src/app/director/layout.tsx` — banner injected globally for all `/director/**` routes
- `next/navigation` — `useSearchParams()`, `useRouter()`, `usePathname()` hooks
- No Supabase calls, no server actions, no proposed_actions — fully client-side

**Decisions recorded:**
- `<Suspense>` wrapper is required in Next.js 14 App Router for any client component using `useSearchParams()`. Missing it causes a build error.
- Step detection uses `pathname.startsWith(s.path + '/')` to match session detail routes (`/director/sessions/[id]?demo=1` → Step 2). The `/director` fallback uses exact match only to avoid capturing all director routes.
- Template literal `` `Demo · Step ${n} of ${total}` `` used instead of JSX expressions to ensure single text node in innerHTML (avoids React adjacent-expression splitting that broke QA string matching in initial run).

---

## 2026-05-15 — Sprint 394: Premium UI Consistency Pass V1

**What changed:** 2-line fix across `/director/level-up` and `/director/parents` — `StatCard` label now uses `label-xs` utility instead of the expanded inline form.

**Integrates with:** `globals.css` `label-xs` utility (`text-[11px] uppercase tracking-widest text-text-muted font-medium`)

**Decisions recorded:**
- Full audit found no other inconsistencies across the 4 new screens (today, level-up, parents, recap). The screens are already design-token compliant, using `page-title`, `Card`, `bg-surface`, and `text-text-*` correctly.
- `text-[9px]` micro-labels are intentionally smaller than `label-xs` and were not replaced — they appear in space-constrained components (score labels, workflow step labels).

---

## 2026-05-15 — Sprint 393: Cross-Screen DONNA Context Wiring Pass V1

**What changed:** `donnaPageContextRegistry.ts` tightened across 3 screen entries. `/director/today` now correctly lists `daily_brief` and `attention_report` as readable context items. `/coach/recap` and `/director` dashboard have updated suggested prompts and safe draft actions.

**Integrates with:**
- `DonnaAssistantButton.tsx` — reads registry to populate context card, suggested prompts, and safe action shortcuts
- All `/director/**` routes — registry changes take effect immediately on next panel open

**Decisions recorded:**
- Sprint 393 was a light pass — the registry was already in good shape from per-screen additions in Sprints 386–390. Only 4 improvements were made; no entries were restructured.
- The `FALLBACK_CONTEXT` (`routePattern: '*'`) is defined after the array close and does NOT affect the `/director` prefix-match ordering. QA script confirmed `/director` is the last entry in `PAGE_CONTEXT_REGISTRY` at line 612.

---

## 2026-05-15 — Sprint 392: DONNA Executive Panel Upgrade V1

**What changed:** `DonnaAssistantButton.tsx` panel upgraded with 4 visual/structural changes: desktop overlay (backdrop-blur), expanded panel width (w-96), tab chip navigation strip, and approval boundary footer copy. No behavior or routing changes.

**Integrates with:**
- All `/director/**` routes — the panel is global
- Tab chip "Review Today" → `handleOpenReviewQueue()` (existing handler)
- Tab chip "Prepare Coaches" → `dispatchCooCommand('coach_brief')` (existing COO command)
- Tab chips "Player Progress" / "Parent Updates" → `router.push` to existing screens

**Decisions recorded:**
- Overlay changed from `md:hidden` (mobile-only) to all-screen — this gives the executive "command center" feel when the panel slides open on desktop. No z-index conflicts — overlay is z-40, panel is z-50.
- Footer list replaced with approval boundary copy. The verbose capability list was removed; future users can discover capabilities through the panel itself.
- Tab chip `whiteSpace: nowrap` prevents wrapping on narrow panels; `overflow-x-auto` on the chip container allows horizontal scroll if needed.

---

## 2026-05-15 — Sprint 391: Coach Recap Structuring and Review Draft V1

**What changed:** `/coach/recap` review screen enhanced with structured draft sections. Answers now display as 5 pipeline-preview cards, each showing what the content would become in the director review queue. Raw answers available via disclosure toggle.

**Integrates with:**
- `/coach/recap` — replaces flat Q&A review with structured section cards
- Pipeline preview labels match existing action types: Attendance Exception Draft, Session Actual Draft, Player Observation Draft, Director Review Item, Parent-Safe Draft Placeholder

**Decisions recorded:**
- No backend write added in Sprint 391. `saveWrapUpDraftAction` requires a `sessionId` FK that the standalone `/coach/recap` page doesn't have. Full pipeline write will be Sprint session workspace integration in a later sprint.
- `buildDraftSections()` is a pure client-side function — no server calls, no side effects. Safe to use anywhere.

---

## 2026-05-15 — Sprint 390: Coach Recap Flow Shell V1

**What changed:** New route `/coach/recap` — a client-side 6-question session recap shell for coaches. Progress indicator, one-question-at-a-time flow, review screen, submitted confirmation. No backend writes.

**Integrates with:**
- Coach layout (`src/app/coach/layout.tsx`) — uses BottomTabBar + max-w-2xl container automatically
- `donnaPageContextRegistry` — `/coach/recap` entry added for future coach DONNA panel
- Sprint 391 will connect the submit action to the draft pipeline

**Decisions recorded:**
- Sprint 390 is shell-only: submit button does not write to the DB. This is by design — Sprint 391 will add the `saveWrapUpDraftAction` connection.
- `/coach/recap` is accessible to director test account (no role gate added in Sprint 390). A future sprint may add coach-only middleware guard.
- Voice input placeholder is honest: shown as "Available via DONNA on director view" — no fake voice input wired on coach route yet.

---

## 2026-05-15 — Sprint 389: Parent Communication Center V1

**What changed:** New route `/director/parents` — the parent communication operating surface. Queries `parent_updates` table, groups by status, shows 4-step workflow, parent-safe content preview on every card, DONNA chips for drafting. No send capability — delivery pipeline not built.

**Integrates with:**
- `parent_updates` table — filtered by academy_id, joined to `players(full_name)`, excludes cancelled
- `donnaPageContextRegistry` — `/director/parents` entry with `auto_send_parent_message` in unsafeActions
- `/director/review` — "Review in queue" CTA links to existing review queue for pending drafts

**Decisions recorded:**
- `parent_updates` join uses `players(full_name)` via Supabase foreign key join syntax. This relies on the FK relationship being defined in the schema. If it fails in production, fall back to a separate `players` query (same pattern as Sprint 386).
- Pre-existing `button[text="Send"]` found in DONNA panel on all director pages — this is the voice input submit. It is NOT an auto-send for parent messages. QA check explicitly scoped to page content only.
- "External delivery is not yet active" note shown to set honest expectations for the demo.

---

## 2026-05-15 — Sprint 388: Level Up Readiness Review V1

**What changed:** New route `/director/level-up` — the director's evidence-based player level readiness review screen. Queries `v_reassessment_pipeline` view, groups players by urgency (overdue/due_soon/upcoming), shows score and assessment data, and surfaces DONNA prompt chips. DONNA context registered.

**Integrates with:**
- `v_reassessment_pipeline` view — filtered by academy_id, ordered by days_overdue desc
- `profiles` table — academy_id lookup for the authenticated director
- `donnaPageContextRegistry` — `/director/level-up` entry with level movement approval gates
- Director layout — DONNA panel renders automatically via existing layout

**Decisions recorded:**
- Level movement CTA is intentionally absent from this page. The page shows a visible "Level movement is director-approved only" badge and links to player profiles for evidence review. Level changes go through DONNA → proposed_actions → director approval → `finalize_player_placement()` — this page does not accelerate that path.
- `v_reassessment_pipeline` does not include `level_label` (it has `current_track`). Track label is displayed instead. This is sufficient for V1 — a future sprint can join with curriculum level data.

---

## 2026-05-15 — Sprint 387: Sessions Detail DONNA Context V1

**What changed:** Added `donnaPageContextRegistry` entry for `/director/sessions/[sessionId]` and four "Ask DONNA" prompt chips on the session detail page. The session detail is now DONNA-capable — the panel will match this route and surface the correct intro and suggested prompts.

**Integrates with:**
- `donnaPageContextRegistry` — new entry inserted between Sessions list entry and Player Profile entry; correctly ordered before `/director` prefix-match fallback
- `src/app/director/sessions/[sessionId]/page.tsx` — chips section added after session header, before Curriculum Focus section; display-only spans, no server actions involved

**Decisions recorded:**
- Chips are display-only `<span>` elements (`cursor-default select-none`). Wiring them to open the DONNA panel with pre-filled text requires the DONNA panel's internal state — deferred to a future polish sprint (same decision pattern as Sprint 386 Today's Academy chips).
- The existing "Coach Briefing" section (deterministic synthesis, no AI) was NOT replaced or modified — it remains as the server-rendered static brief. The DONNA chips are a separate, additive section for AI-assisted drafting via the panel.
- `draft_coach_communication` is already wired in the DONNA layer (Sprint context). The registry entry makes it discoverable from this route.

---

## 2026-05-15 — Sprint 386: Today's Academy V1

**What changed:** New route `/director/today` — the director's morning anchor screen. Shows today's sessions, stat strip, risk flags, DONNA Intelligence section, and quick actions. DONNA context entry added for this route.

**Integrates with:**
- `sessions` table — filtered by `scheduled_date = today` (server-side date string)
- `session_blocks` table — block count per session for "No blocks" risk flag
- `proposed_actions` table — pending review count badge
- `profiles` + `templates` tables — coach and template names (batch fetch)
- `donnaPageContextRegistry` — new entry for `/director/today` with all 10 required fields
- Director layout (`src/app/director/layout.tsx`) — unchanged; DONNA panel renders automatically

**Decisions recorded:**
- Daily brief and attention items are NOT fetched server-side in `page.tsx`. Reason: calling `/api/donna/attention` and `/api/donna/brief` from a server component requires absolute URLs and adds latency to page render. These are AI-powered and belong in the DONNA panel flow. The "DONNA Intelligence" card on the page prompts the director to open the DONNA panel.
- DONNA suggestion chips are display-only (not interactive triggers). Reason: wiring them to open the DONNA panel with pre-filled text requires a client component and the DONNA panel's internal state — deferred to a future polish sprint.
- `getTodayString()` uses `new Date().toISOString().split('T')[0]` (UTC). This is server-side, so the date is deterministic regardless of the director's timezone. Edge case: directors in UTC+ timezones may see "today" as one day behind late at night. Acceptable for V1.

---

## 2026-05-15 — Sprint 385.5: Five-Agent Workflow Setup V1

**What changed:** Created 6 agent workflow docs. No source code touched.

**Integrates with:** All future sprints — these docs govern the five-agent sequential handoff workflow.

**Decisions recorded:**
- Option A (single Codespace, sequential handoff) chosen over Option B (parallel agents, branch merges). Reason: simpler coordination, no merge conflicts.
- Five roles defined: PM/CTO → Builder → QA → UI/UX → Docs/Integration.
- Sprint 386 (Today's Academy) confirmed as next build sprint.

**Files created:**
- `docs/AGENT_GUARDRAILS.md`
- `docs/AGENT_ASSIGNMENTS.md`
- `docs/SPRINT_BOARD.md`
- `docs/MERGE_QUEUE.md`
- `docs/INTEGRATION_LOG.md`
- `docs/QA_GATE.md`

---

## 2026-05-15 — Sprint 385: Prototype Screen Adoption Audit V1

**What changed:** 5 new docs mapping 8 Manus prototype screens into AcademyOS. No source code touched.

**Integrates with:** Sprint 386+ build sprints — these docs are the source of truth for screen specs, route assignments, DONNA capability per screen, role access, and backend readiness.

**Decisions recorded:**
- Sprint 386 (Today's Academy `/director/today`) is the highest-readiness new screen: all backend available, no migration.
- Screen 8 (Multi-Academy Portal) blocked on `platform_roles` migration — do not build before Sprint 392.
- Templates module is the only module at Level 10 (pilot-ready). Sessions, Players, DONNA at Level 9.
- Communications module at Level 6 — parent comms center route missing; external email delivery not built.

**Files created:**
- `docs/PROTOTYPE_SCREEN_ADOPTION_MAP.md`
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
- `docs/ROLE_ROUTE_MAP.md`
- `docs/MODULE_MATURITY_MAP.md`
- `docs/SCREEN_BACKEND_READINESS_MAP.md`

---

## 2026-05-15 — Sprint 384: DONNA Modularization for Parallel Agent Development V1

**What changed:** `DonnaAssistantButton.tsx` refactored from 4,168-line monolith to 3,346-line prop-driven orchestrator. 4 real JSX extractions, 5 documentation stubs.

**Integrates with:**
- All DONNA components — module boundaries now documented in `docs/DONNA_MODULARIZATION_MAP.md`
- Sprint 383 attendance routing — preserved exactly
- Sprint 383.5 template save fix — preserved exactly

**Decisions recorded:**
- State stays in `DonnaAssistantButton.tsx`. Extracted components are presentational (props only). Reason: `dispatchCooCommand`, `detectAndHandleCommand`, `closePanel` close over 25–30+ state setters — extraction requires useReducer + context migration (documented as future path).
- Future path: DonnaPanelContext → DonnaCommandContext → DonnaDraftContext migrations unlock further extraction.

**Extracted components:**
- `DonnaVoiceLayer.tsx` — voice card + text input + suggestion chips
- `DonnaWorkflowCards.tsx` — all workflow output cards
- `DonnaDeveloperTools.tsx` — dev-only diagnostic panel
- `DonnaAttendanceLayer.tsx` — attendance exception null-guard wrapper

**QA result:** 41 PASS / 0 FAIL / 2 WARN

---

## 2026-05-15 — Sprint 383.5: Fix class template level to development_track mapping

**What changed:** `saveAssistantTemplateDraftAction.ts` — `track: null` guard. Level label preserved in template name and `tags: ["level:<label>"]`.

**Root cause:** `draft.level` ("Orange 2") was being written directly to `templates.track` (`development_track` enum). Invalid enum value caused Postgres error on every Save Template attempt.

**Integrates with:** `templates` table, `development_track` enum, all template draft flows.

**Decisions recorded:**
- Level labels ("Orange 2") cannot map to `development_track` enum values (`"skill"|"competition"|"fitness"|"combined"`). They are different axes.
- Level label preserved in `tags` array as `"level:Orange 2"` — searchable and recoverable.
- `safeDevTrack` guard function added to validate future `track` values before insert.

---

## 2026-05-15 — Sprint 383: DONNA Attendance Exception Session Resolution V1

**What changed:** Attendance exception drafts now resolve to a real session before queuing. Natural language attendance phrase parsing added. "Queue for review" CTA wired to `saveAttendanceExceptionDraftAction`.

**Integrates with:**
- `proposed_actions` pipeline — attendance exceptions now create real proposed_action rows
- `/director/review` — attendance exceptions visible in review queue
- DONNA COO command routing — `attendance_exception_draft` command now fully wired

**Decisions recorded:**
- `fetchRecentSessionsAction` returns last 7 days of sessions for the director's academy. Read-only — no mutations.
- "Everyone was here" → clears exception flags. Natural phrase overrides slot-filled data.
- `MANUAL_PLACEHOLDER` used when no session match found — preserves draft without blocking the flow.

---

## How to Add an Entry

When a sprint completes, the Docs/Integration Agent adds a new entry at the TOP of the log (newest first) with:

```markdown
## YYYY-MM-DD — Sprint NNN: [Title]

**What changed:** [1-2 sentences]

**Integrates with:** [modules, routes, tables, or components affected]

**Decisions recorded:** [non-obvious choices, trade-offs, or constraints that future agents must know]
```

Do not record:
- Code that is self-explanatory from reading the diff
- Implementation details that belong in commit messages
- Ephemeral state or in-progress notes

---

*Last updated: Sprint 398*

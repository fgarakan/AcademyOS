# Sprint 860 — DONNA Page Context Coverage Audit V1

**Date:** 2026-05-26
**Sprint:** 860
**Type:** Audit — static code analysis only, no source file changes
**Migration:** None
**TypeScript:** N/A (no code changes)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Purpose

Full survey of DONNA context coverage across all 12 AcademyOS surfaces.
Informs Sprint 861 — DONNA Page Context Registry Design V1.

Assessment dimensions per surface:
1. Which `DonnaContextType` is assigned (or missing)
2. DB queries: what is fetched, depth
3. Focus targets (`data-donna-focus-id`): count and quality
4. Score: 0–10
5. Gaps and priority

Audit method: direct inspection of `src/components/assistant/donnaContextTypes.ts`,
`src/app/director/_actions/donnaContextActions.ts`, coach/player/parent layouts,
all `data-donna-focus-id` usages via grep, and route files for each surface.

---

## System Architecture Summary

### DONNA button mounting by role

| Role layout | Button mounted | Role param | Context system |
|---|---|---|---|
| `src/app/director/layout.tsx` | ✅ `DonnaAssistantButton` + `DonnaSessionContextProvider` + `DonnaHighlightBanner` | `role="director"` | Full floating panel + live context fetch |
| `src/app/coach/layout.tsx` | ✅ `DonnaAssistantButton` | `role="coach"` | Button mounted — but `deriveContextRequest` has no coach route handling |
| `src/app/parent/layout.tsx` | ❌ Not mounted | — | Nav tab → `/parent/ask-donna` dedicated page |
| `src/app/player/layout.tsx` | ❌ Not mounted | — | Nav tab → `/player/ask-donna` dedicated page |

### `deriveContextRequest` route coverage

Defined in `src/components/assistant/donnaContextTypes.ts`:

| Route pattern | `DonnaContextType` | fetchFn |
|---|---|---|
| `/director/players/<uuid>` | `player_profile` | `fetchPlayerProfile(uuid)` |
| `/director/coaches/<uuid>` | `coach_profile` | `fetchCoachContext(uuid)` |
| `/director/players` | `player_collection` | `fetchPlayerCollection` |
| `/director/sessions` | `session_context` | `fetchSessionContext` |
| `/director/class-templates` | `class_template_collection` | `fetchClassTemplateCollection` |
| `/director/fitness` | `fitness_template_collection` | `fetchFitnessTemplateCollection` |
| `/director/curriculum` | `curriculum_context` | `fetchCurriculumContext` |
| `/director/review` | `review_queue_context` | `fetchReviewQueueContext` |
| `/director/signals` | `signals_context` | `fetchSignalsContext` |
| `/director/onboarding` | `academy_overview` | `fetchAcademyOverview` |
| `/director` (default) | `academy_overview` | `fetchAcademyOverview` |
| **All other routes** | `academy_overview` (fallback) | `fetchAcademyOverview` |
| `/coach/**` | ❌ No match → fallback → `academy_overview` | Wrong context |
| `/director/sessions/<uuid>` | ❌ No match → `session_context` (list) | Wrong granularity |
| `/director/class-templates/<uuid>` | ❌ No match → `class_template_collection` (list) | Wrong granularity |

### `DonnaContextType` implementation status

| Type | Route trigger | fetchFn exists | Notes |
|---|---|---|---|
| `academy_overview` | ✅ `/director` + fallback | ✅ | 6 queries — heaviest; fires on every `/director` nav |
| `player_collection` | ✅ `/director/players` | ✅ | solid |
| `player_profile` | ✅ `/director/players/<uuid>` | ✅ | richest — 7 queries |
| `coach_profile` | ✅ `/director/coaches/<uuid>` | ✅ | 5 queries |
| `session_context` | ✅ `/director/sessions` | ⚠️ shallow | 1 query — list only; no session detail routing |
| `class_template_collection` | ✅ `/director/class-templates` | ✅ | decent — no detail routing |
| `fitness_template_collection` | ✅ `/director/fitness` | ⚠️ thin | minimal queries; flow "not yet wired" |
| `curriculum_context` | ✅ `/director/curriculum` | ✅ | 4 queries; adequate |
| `review_queue_context` | ✅ `/director/review` | ✅ | 2 queries; good categorization |
| `signals_context` | ✅ `/director/signals` | ✅ | 5 queries; cross-table signals |
| `group_context` | ❌ No route trigger | ❌ Not implemented | Type defined, no fetch fn, no route |

---

## Surface-by-Surface Audit

---

### Surface 1 — Director Dashboard (`/director`)

**Context type:** `academy_overview`
**DB queries (6):**
- `players` — count by status
- `sessions` — this week's schedule
- `proposed_actions` — pending count
- `class_templates` — template count
- `player_curriculum_states` — players with/without level
- Additional aggregate metrics

**Focus targets (7):**
`today-command-center`, `todays-pulse`, `review-queue-card`, `player-attention-card`,
`sessions-this-week-card`, `academy-metrics-section`, `alerts-placement-section`

**Strengths:**
- Good cross-academy metrics (roster health, pending queue, session count, level coverage)
- 7 focus targets — best coverage of any surface
- `alerts-placement-section` enables DONNA to navigate director to urgent items

**Gaps:**
- No today's live session status (what's running RIGHT NOW vs. scheduled)
- No coach load per coach (who is teaching what)
- No group composition breakdown
- `academy_overview` is the heaviest fetch and fires on every `/director` navigation with panel open (Sprint 915 perf pass needed)

**Score: 7/10**

---

### Surface 2 — Review Queue (`/director/review`)

**Context type:** `review_queue_context`
**DB queries (2):**
- `proposed_actions` — all pending_review items (id, action_type, target_module, created_at)
- `private_lesson_requests` — new requests (count only)

**Focus targets (1):** `attendance-exceptions-section`

**Strengths:**
- Good categorization: wrap-ups, captures/voice, placements, other, lesson requests
- Priority logic: wrap-ups → placements → lesson requests → other
- `openQuestions` surfaces coach pattern detection

**Gaps:**
- No per-item player/coach names (items are anonymous counts, not named records)
- No oldest-item age surfaced (can't tell director how long oldest item has been waiting)
- No sub-queue filtering detail (which players, which coaches have pending items)
- Only 1 focus target for a multi-section queue page (attendance section only)
- `private_lesson_requests` count only — no names or dates

**Score: 7/10**

---

### Surface 3 — Sessions Page (`/director/sessions`)

**Context type:** `session_context`
**DB queries (1):**
- `sessions` — list with status only (no coach, group, attendance, block data)

**Focus targets (0):** None

**Strengths:**
- Context type is mapped and fires correctly

**Gaps:**
- Single-table, single-query — shallowest non-fallback context in the director system
- No coach names per session
- No group membership or roster per session
- No attendance rates or present/absent counts
- No curriculum focus or block structure
- No today vs. upcoming vs. past breakdown
- Zero focus targets — DONNA cannot navigate to session-specific elements
- `session_context` serves both the sessions list AND session detail pages (wrong granularity for detail)

**Score: 4/10**

---

### Surface 4 — Session Detail (`/director/sessions/[id]`)

**Context type:** `session_context` (wrong — inherits list-level context; no UUID routing)

`deriveContextRequest` has no `/director/sessions/<uuid>` pattern. The route `/director/sessions/abc123`
matches `/director/sessions` prefix → routes to `session_context` → `fetchSessionContext` returns ALL sessions,
not the specific session the director is viewing.

**DB queries:** Same as Surface 3 — full session list, not the specific session

**Focus targets (0):** None

**Critical gap:** Director navigates to specific session. DONNA fetches the entire sessions list.
The specific session's coach, roster, blocks, attendance, curriculum focus — none available to DONNA.
If director asks "Who is attending today's 10am session?", DONNA cannot answer from context.

**Score: 2/10**

---

### Surface 5 — Class Templates (`/director/class-templates`)

**Context type:** `class_template_collection`
**DB queries (3):**
- `class_templates` — template list with metadata
- `curriculum_class_template_blocks` — block count per template
- Recent `sessions` using templates — usage frequency

**Focus targets (2):** `create-template-button`, `template-list`

**Strengths:**
- Template count, block structure overview, usage frequency in recent sessions
- Focus targets cover the two primary actions (create + browse)

**Gaps:**
- No group-assignment data (which groups use which templates)
- No curriculum level alignment (which templates fit Red Ball vs. High Performance)
- No coach usage breakdown (which coaches are using each template)
- Only 2 focus targets — no focus on individual template cards in the list

**Score: 6/10**

---

### Surface 6 — Template Detail / Builder (`/director/class-templates/[id]`, `/director/class-templates/new`)

**Context type:** `class_template_collection` (wrong granularity — collection-level, not template-level)

`deriveContextRequest` has no `/director/class-templates/<uuid>` or `/director/class-templates/new`
pattern. Both routes match the `/director/class-templates` prefix → collection context → DONNA
knows about all templates, not the one being built or edited.

**Focus targets (1):** `create-template-form` (on `/director/class-templates/new` page only)

**Critical gap:** Director is actively building a specific template. DONNA knows about the template
collection but not: the template being built, its block structure so far, its target curriculum level,
whether similar templates exist, or what blocks are recommended for the target level.

**Score: 3/10**

---

### Surface 7 — Player Directory (`/director/players`)

**Context type:** `player_collection`
**DB queries (2):**
- `players` (via `v_player_summary` or direct) — all active players with level labels
- `player_curriculum_states` — level assignments

**Focus targets (5):** `player-directory-summary`, `players-missing-level`, `add-player-button`,
`player-filter-bar`, `player-list`

**Strengths:**
- Good overall academy player picture
- 5 focus targets — good coverage including the filter bar and missing-level section
- `players-missing-level` enables DONNA to navigate to unleveled players

**Gaps:**
- No group breakdown (how players are distributed across groups)
- No coach assignment mapping (who coaches each group/player)
- No enrollment pipeline view (players in onboarding vs. active)
- No attendance trend across the directory (who is at-risk globally)

**Score: 7/10**

---

### Surface 8 — Player Profile (`/director/players/[uuid]`)

**Context type:** `player_profile`
**DB queries (7):**
- `players` — profile row (status, enrollment, join date)
- `player_curriculum_states` + `curriculum_levels` — current level and stage name
- `player_priorities` — 5 most recent active priorities (title, category, target date)
- `coach_notes` — count + 5 most recent records (coach name, category, content)
- `session_attendance` — 30-day window (present/absent/late)
- `player_assessments` — last 1 assessment record
- `proposed_actions` — player-scoped pending items

**Focus targets (5):** `player-active-priorities`, `player-priority-recommendation`,
`player-evidence-hub`, `player-profile-header`, `player-notes-tab`

**Strengths:**
- Richest context in the system by significant margin
- 7 DB queries cover the full player development picture
- Coach notes read (count + content) — DONNA can surface note themes
- Attendance trend available — DONNA can flag at-risk patterns
- Focus targets cover all major profile sections
- Priority recommendation target enables DONNA to guide director to next action

**Minor gaps:**
- Assessment history: only last 1 record (no trend or comparison)
- No parent communication history (relevant for parent-director coordination)
- No priority completion trend (past resolved priorities)
- No injury or absence reason tracking

**Score: 9/10**

---

### Surface 9 — Coach Session Page (`/coach/sessions/[sessionId]`)

**Context type:** ❌ `academy_overview` (fallback — wrong context entirely)

Coach layout mounts `DonnaAssistantButton` with `role="coach"`. When coach navigates to
`/coach/sessions/abc123`, `deriveContextRequest` has no `/coach/**` handling → falls
through to default → `academy_overview` → `fetchAcademyOverview` returns director-level
academy metrics to a coach on a live session page.

**Note:** `/coach/donna` has a separate context system (`loadCoachDonnaContext` in
`src/lib/donna/coachDonnaContext.ts`) that loads live coach-scoped session context.
That system is not connected to `deriveContextRequest` — it's a standalone page context
load, not the floating DONNA button's context pipeline.

**Focus targets (0):** None on coach session pages

**Critical gap:** Coach executing a live session gets academy-overview context instead of:
session roster, curriculum blocks on court, attendance so far, or player-specific watch-fors.
The `DonnaOpenChip` is imported in the session detail page (line 6) but `deriveContextRequest`
returns wrong context for it.

**Score: 1/10**

---

### Surface 10 — Coach Wrap-Up Page (`/coach/sessions/[sessionId]/wrap-up` or similar)

**Context type:** ❌ `academy_overview` (fallback — same issue as Surface 9)

All `/coach/**` routes fall through to `academy_overview` default.
Coach submitting a post-session wrap-up gets no context about: the session just completed,
the players who attended, the blocks covered, or the priorities active for those players.

**Focus targets (0):** None

**Critical gap:** Wrap-up is the most context-rich submission moment in the product.
DONNA should know exactly what session is being wrapped, who attended, and what curriculum
was delivered — to help coach write an accurate wrap-up. None of that is available.

**Score: 1/10**

---

### Surface 11 — Parent Portal (`/parent`)

**DONNA presence:** No floating `DonnaAssistantButton`. By design — privacy guardrail.
Parent layout provides nav tab → `/parent/ask-donna` dedicated page.

**`/parent/ask-donna` system:**
- Page type: Server Component with pre-computed chip responses
- Context source: DB reads at server-render time (child name, focus category, level, coach notes — sanitized)
- Privacy: `sanitizeParentFacingText` applied; raw coach notes blocked at source
- Interface: Chip-based (6–8 suggested questions with static responses); no freeform query
- Live fetch: ❌ None at query time — chips are pre-rendered at page load

**Chips available (Sprint 1083):**
- "What can DONNA do here?" — capability surfacing
- "How can I support at home?" — category-specific advice
- "What is [child] working on?" — current focus area
- "What questions can I ask after practice?" — context-aware prompts
- Navigation chips to Progress, Wins, Updates

**Strengths:**
- Appropriate privacy guardrail: no coach notes, no rankings, no program details
- Context-aware chips (child name + focus category + level personalize responses)
- `sanitizeParentFacingText` enforces content boundary

**Gaps:**
- No floating assistant (intentional, but limits discoverability)
- No freeform query (intentional guardrail, but limits usefulness)
- Responses pre-computed at page load — not live at query time
- No progress milestone chips ("What did [child] achieve this week?")
- No "What is the next step for [child]?" chip

**Score: 5/10**

---

### Surface 12 — Player Portal (`/player`)

**DONNA presence:** No floating `DonnaAssistantButton`. By design — privacy guardrail.
Player layout provides nav tab → `/player/ask-donna` dedicated page.

**`/player/ask-donna` system:**
- Page type: Server Component with pre-computed chip responses
- Context source: DB reads at server-render time (active mission, level, next level)
- Interface: Chip-based (5–6 suggested questions); no freeform
- Live fetch: ❌ None at query time

**Chips available (Sprint 1077):**
- "What can DONNA do here?" — navigation capability surfacing
- "What should I work on?" — active mission focused
- "How do I level up?" — curriculum advancement explanation
- "What can I practice today?" — category-specific drills
- "How am I doing?" — progress acknowledgment

**Strengths:**
- Excellent safety design: guardrails explained inline; no coaching decisions surfaced
- Mission-personalized responses when mission is active
- Level progression context (current + next level names)

**Gaps:**
- No floating assistant (intentional)
- No freeform query (intentional)
- Responses pre-computed at page load
- No attendance history chip ("How many sessions have I attended?")
- No wins/achievements chip surfacing from DB
- "How am I doing?" response is static advice, not live progress data

**Score: 5/10**

---

## Summary Table

| # | Surface | Route | Context Type | DB Queries | Focus Targets | Score | Status |
|---|---|---|---|---|---|---|---|
| 1 | Director Dashboard | `/director` | `academy_overview` | 6 | 7 | 7/10 | ✅ Good |
| 2 | Review Queue | `/director/review` | `review_queue_context` | 2 | 1 | 7/10 | ✅ Good |
| 3 | Sessions Page | `/director/sessions` | `session_context` | 1 | 0 | 4/10 | ⚠️ Weak |
| 4 | Session Detail | `/director/sessions/[id]` | `session_context` (wrong) | 1 | 0 | 2/10 | 🔴 Critical |
| 5 | Class Templates | `/director/class-templates` | `class_template_collection` | 3 | 2 | 6/10 | ✅ Adequate |
| 6 | Template Builder | `/director/class-templates/[id]` | `class_template_collection` (wrong) | 3 | 1 | 3/10 | ⚠️ Weak |
| 7 | Player Directory | `/director/players` | `player_collection` | 2 | 5 | 7/10 | ✅ Good |
| 8 | Player Profile | `/director/players/[uuid]` | `player_profile` | 7 | 5 | 9/10 | ✅ Excellent |
| 9 | Coach Session | `/coach/sessions/[id]` | ❌ fallback (`academy_overview`) | 6 | 0 | 1/10 | 🔴 Critical |
| 10 | Coach Wrap-Up | `/coach/sessions/[id]/wrap-up` | ❌ fallback (`academy_overview`) | 6 | 0 | 1/10 | 🔴 Critical |
| 11 | Parent Portal | `/parent/ask-donna` | N/A (dedicated page) | N/A | N/A | 5/10 | ✅ Adequate |
| 12 | Player Portal | `/player/ask-donna` | N/A (dedicated page) | N/A | N/A | 5/10 | ✅ Adequate |

**System average: 4.9/10**

**Director surfaces only: 5.9/10** (8 surfaces, sum 50)
**Excellent (9–10):** 1 surface (player profile)
**Good (7–8):** 4 surfaces (dashboard, review queue, sessions list, player directory)
**Adequate (5–6):** 2 surfaces (class templates, template builder)
**Weak (3–4):** 2 surfaces (sessions list, template builder)
**Critical (1–2):** 3 surfaces (session detail, coach session, coach wrap-up)

---

## Gap Taxonomy

### Type 1 — Missing UUID routing (detail pages get collection context)

| Surface | Missing Route Pattern | Current (wrong) context | Correct context needed |
|---|---|---|---|
| Session Detail | `/director/sessions/<uuid>` | `session_context` (list) | `session_detail` (specific session) |
| Template Builder | `/director/class-templates/<uuid>` | `class_template_collection` | `class_template_detail` (specific template) |

**Impact:** Director is on a specific record page. DONNA knows about the list but not the record.
All DONNA questions about "this session" or "this template" cannot be answered from context.

**Fix type:** Add UUID route patterns in `deriveContextRequest`; create new context types +
fetch functions (`fetchSessionDetail`, `fetchClassTemplateDetail`).

---

### Type 2 — Coach routes have no context mapping

| Surface | Route | Current (wrong) context | Context needed |
|---|---|---|---|
| Coach Session | `/coach/sessions/[id]` | `academy_overview` (fallback) | Session + roster + blocks + player watch-fors |
| Coach Wrap-Up | `/coach/sessions/[id]/wrap-up` (or equivalent) | `academy_overview` (fallback) | Session + attendance + priorities for present players |
| Coach Home | `/coach` | `academy_overview` (fallback) | Coach schedule summary + pending wrap-ups |
| Coach Players | `/coach/players` | `academy_overview` (fallback) | Coach-scoped player list |

**Note:** `/coach/donna` dedicated page uses a separate context system (`loadCoachDonnaContext`)
that correctly loads coach session context — but this is NOT wired to `deriveContextRequest` or
the floating DONNA button. The floating DONNA button on all coach pages has wrong context.

**Fix type:** Add `/coach/**` route handling in `deriveContextRequest`; new context types
`coach_session_context`, `coach_wrap_up_context`; fetch functions that scope to `coach_id`.

---

### Type 3 — Shallow DB fetch for existing context types

| Context Type | Current depth | Missing data |
|---|---|---|
| `session_context` | 1 query — session list only | Coach names, group roster, attendance rates, block structure, curriculum focus |
| `fitness_template_collection` | Minimal — template list only | Usage data, group assignments; flow "not yet wired" (noted in code) |
| `review_queue_context` | 2 queries — counts + IDs only | Player/coach names per item, oldest item age, queue age distribution |

**Fix type:** Deepen existing fetch functions with additional joins/queries.

---

### Type 4 — Missing focus targets

| Surface | Current targets | Missing targets |
|---|---|---|
| Sessions Page | 0 | Session list items, today's sessions highlight, session status chips |
| Session Detail | 0 | Attendance section, block list, session header, wrap-up card |
| All coach pages | 0 | Any — coach pages have no `data-donna-focus-id` instrumentation |
| Review Queue | 1 | Individual queue items, wrap-up section, placement section |

**Fix type:** Add `data-donna-focus-id` attributes to key UI elements; register in `donnaUIActionRegistry`.

---

### Type 5 — `group_context` not implemented

Type `group_context` is defined in `DonnaContextType` but:
- No route in `deriveContextRequest` triggers it
- No `fetchGroupContext` function exists in `donnaContextActions.ts`
- No group detail page exists in the director routes yet

**Fix type:** Implement when group management UI is built. Low priority until groups module exists.

---

## Priority Ranking for Sprint 861

Ordered by impact × effort:

| Priority | Gap | Sprint 861 registry entry | Impact |
|---|---|---|---|
| P1 | Session detail missing UUID routing | Register `session_detail` context type, define route pattern | 🔴 High — most-used detail page after player profile |
| P2 | `session_context` shallow fetch | Deepen with coach + group + attendance + blocks | 🔴 High — 4/10 surface used daily |
| P3 | Coach session/wrap-up context | Register coach route patterns → `coach_session_context`, `coach_wrap_up_context` | 🔴 High — coach is primary data producer |
| P4 | Template detail missing UUID routing | Register `class_template_detail` context type | 🟠 Medium — template builder is director daily work |
| P5 | Session/template focus targets | Add `data-donna-focus-id` to sessions list, session detail, template builder | 🟠 Medium — DONNA navigate actions require focus targets |
| P6 | Review queue per-item depth | Add player/coach names, oldest-item age to `review_queue_context` | 🟡 Low-medium — 7/10 is adequate; incremental improvement |
| P7 | `group_context` implementation | Defer until group management UI exists | 🟢 Low — surface not yet built |

---

## `fetchDonnaContext` Function Coverage

All fetch functions confirmed read-only (no `.insert`, `.update`, `.delete`, `.upsert`).
All queries use `academy_id` scoping. No RLS bypass. No service role.

| Function | Status | Tables read |
|---|---|---|
| `fetchAcademyOverview` | ✅ Implemented | players, sessions, proposed_actions, class_templates, player_curriculum_states |
| `fetchPlayerCollection` | ✅ Implemented | players/v_player_summary, player_curriculum_states |
| `fetchPlayerProfile` | ✅ Implemented (richest) | players, player_curriculum_states, curriculum_levels, player_priorities, coach_notes, session_attendance, player_assessments, proposed_actions |
| `fetchCoachContext` | ✅ Implemented | profiles, academy_memberships, sessions, coach_observations, proposed_actions |
| `fetchSessionContext` | ⚠️ Shallow | sessions (list only) |
| `fetchClassTemplateCollection` | ✅ Adequate | class_templates, curriculum_class_template_blocks, sessions |
| `fetchFitnessTemplateCollection` | ⚠️ Thin | class_templates (fitness only); minimal |
| `fetchCurriculumContext` | ✅ Adequate | academy_curriculum_versions, academy_curriculum_overrides, curriculum_levels, player_curriculum_states |
| `fetchReviewQueueContext` | ✅ Good | proposed_actions (pending_review), private_lesson_requests |
| `fetchSignalsContext` | ✅ Good | v_player_summary, proposed_actions, sessions, session_attendance, private_lesson_requests |
| `fetchGroupContext` | ❌ Not implemented | — (type defined; no fetch fn; no route trigger) |

---

## Files Inspected (Read-Only)

- `src/components/assistant/donnaContextTypes.ts` — route mapping + type definitions
- `src/app/director/_actions/donnaContextActions.ts` — all fetch functions (1160 lines)
- `src/app/director/layout.tsx` — director DONNA mounting
- `src/app/coach/layout.tsx` — coach DONNA mounting (button present, no route mapping)
- `src/app/player/layout.tsx` — player layout (no DONNA button)
- `src/app/parent/layout.tsx` — parent layout (no DONNA button)
- `src/app/coach/sessions/[sessionId]/page.tsx` — coach session detail (DonnaOpenChip present, wrong context)
- `src/app/coach/donna/page.tsx` — coach DONNA dedicated page (separate context system)
- `src/app/player/ask-donna/page.tsx` — player portal DONNA (chip-based, static)
- `src/app/parent/ask-donna/page.tsx` — parent portal DONNA (chip-based, sanitized)
- `data-donna-focus-id` grep — all occurrences across all surfaces

---

## Files Created

### `docs/DONNA_PAGE_CONTEXT_COVERAGE_AUDIT_860.md`
This file.

---

## Files Modified

None — audit-only sprint.

---

## Known Limitations of This Audit

| Limitation | Notes |
|---|---|
| `/director/signals` and `/director/curriculum` pages not inspected | Both have context types mapped and adequate fetch functions; out of scope for the 12-surface list |
| Coach wrap-up page exact route not confirmed | Route may be `/coach/sessions/[id]/wrap-up` or integrated in the session detail; either way, same fallback issue applies |
| `v_player_summary` view definition not inspected | Assumed correct from prior sprint audit history |
| Sprint 860 does not score the coach DONNA dedicated page (`/coach/donna`) | Separate context system — deserves its own audit sprint |

---

## Score Impact

This sprint is audit-only — no score change. Provides the complete gap map for Sprint 861.

**Post-860 system state:**
- DONNA context system average: **4.9/10** across 12 surfaces
- Director panel (8 surfaces): **5.9/10** average
- 3 critical surfaces identified (session detail, coach session, coach wrap-up): all score 1–2/10
- 1 excellent surface (player profile): 9/10 — the model to replicate
- Sprint 861 registry will address all 3 critical gaps by defining the routing + fetch architecture

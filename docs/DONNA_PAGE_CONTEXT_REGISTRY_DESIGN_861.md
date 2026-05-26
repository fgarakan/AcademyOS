# Sprint 861 — DONNA Page Context Registry Design V1

**Date:** 2026-05-26
**Sprint:** 861
**Type:** Design/Spec — no source file changes
**Migration:** None
**TypeScript:** N/A (design only)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Purpose

Defines the DONNA Page Context Registry — the authoritative spec for how context type,
fetch function, route matching, focus targets, and safety notes are assigned per page.
Directly informed by Sprint 860 audit findings (system average 4.9/10; 3 critical surfaces).

This document is the design reference for Sprints 862–869 implementation.
No source files are modified in this sprint.

---

## Existing Architecture (Pre-861)

Before this design, DONNA context routing is split across:

| File | Role |
|---|---|
| `src/components/assistant/donnaContextTypes.ts` | `DonnaContextType` union, `DonnaContextRequest`, `DonnaContextSummary`, `deriveContextRequest(pathname)` |
| `src/app/director/_actions/donnaContextActions.ts` | `fetchDonnaContext(contextType, params)` server action; 11 named fetch functions |
| `src/lib/donna/donnaPageContextEngine.ts` | `DonnaPageCapabilityMap` — per-route COO capability maps (suggestedPrompts, blocked, safeContext); separate from the live-data context |
| `src/lib/donna/donnaUIActionRegistry.ts` | UI action taxonomy (navigate, toggle, draft, block) |
| `src/lib/donna/donnaSessionContext.ts` | In-memory session state (lastRoute, playerProfileContext, panelOpen) |

The two systems — `deriveContextRequest` (live data fetch) and `donnaPageContextEngine` (capability map) —
work in parallel. The registry defined here governs the live data fetch layer only.
`donnaPageContextEngine` is a companion, not a replacement.

---

## Part 1 — Registry Entry Model

Each entry in the Page Context Registry defines everything needed for safe, correct DONNA
context fetch for one route pattern. This is the canonical structure for all current and
future registry entries.

```typescript
interface PageContextRegistryEntry {
  // ── Identity ─────────────────────────────────────────────────────
  id: string                        // kebab-case slug, unique, stable (e.g. "director-session-detail")
  routePattern: string              // Regex or glob (e.g. "/director/sessions/<uuid>")
  routeMatchType:
    | 'exact'                       // Exact string match
    | 'uuid_segment'                // Prefix + UUID validation on last path segment
    | 'prefix'                      // startsWith match
    | 'role_prefix'                 // role-scoped prefix (e.g. /coach/sessions...)
  role: 'director' | 'coach' | 'any'
  priority: number                  // Lower = matched first (1 = highest priority)

  // ── Context ──────────────────────────────────────────────────────
  contextType: DonnaContextType     // The type assigned to this route
  objectType:                       // What kind of object is in scope (null = collection/list)
    | 'session'
    | 'class_template'
    | 'player'
    | 'coach'
    | null
  objectIdSource:                   // How the object ID is extracted (null = no object ID)
    | 'last_path_segment_uuid'      // Split('/').pop(), validate UUID_RE
    | 'query_param'                 // URLSearchParams (future)
    | null
  paramKey:                         // Key name in DonnaContextRequest.params (null = no param)
    | 'sessionId'
    | 'templateId'
    | 'playerId'
    | 'coachId'
    | null

  // ── Data fetch ───────────────────────────────────────────────────
  fetchFn: string                   // Name of fetch function in donnaContextActions.ts
  fetchScoping: {
    academyId: true                 // Always required — never absent
    coachId: boolean                // Required for coach-scoped fetches
    objectId: boolean               // Required when objectType is non-null
  }
  estimatedDbQueries: number        // Approximate query count for performance awareness

  // ── Focus targets ────────────────────────────────────────────────
  focusTargets: Array<{
    id: string                      // data-donna-focus-id value
    label: string                   // Human-readable description
    element: string                 // Component or section it belongs to
    requiredForNavigation: boolean  // Whether DONNA navigate actions depend on it
  }>

  // ── DONNA behavior ───────────────────────────────────────────────
  suggestedCommands: string[]       // Default chip/prompt suggestions for this route
  allowedActions: string[]          // What DONNA may do (read/navigate/draft)
  blockedActions: string[]          // What DONNA must never do from this route

  // ── Safety ───────────────────────────────────────────────────────
  safetyNotes: string[]             // Human-readable safety reminders for auditors
  visibilityBoundary:               // Who can see data from this context
    | 'director_only'
    | 'coach_scoped'                // Coach sees own data only
    | 'player_scoped'               // Player sees own data only
    | 'parent_scoped'               // Parent sees own child's data only

  // ── Implementation ───────────────────────────────────────────────
  implementationSprint: number      // Which sprint implements this entry
  implementationStatus:
    | 'implemented'                 // In production
    | 'shallow'                     // Partially implemented (see audit notes)
    | 'not_implemented'             // Designed here; not yet coded
    | 'deferred'                    // Explicitly deferred (e.g. group_context)
  auditScore: number                // Sprint 860 score (0–10); null for new entries
}
```

**Design principles:**
- `priority` determines match order within `deriveContextRequest` — UUID routes always
  have lower priority numbers (matched earlier) than their prefix siblings.
- `visibilityBoundary` is set at design time and verified during certification.
- `focusTargets` are the bridge between live DB context and DONNA navigate actions.
- `allowedActions` and `blockedActions` complement `donnaPageContextEngine` capability maps
  (which cover COO behavioral rules) — the registry governs the data fetch layer.

---

## Part 2 — Updated `DonnaContextType` Union

Extend the existing union in `src/components/assistant/donnaContextTypes.ts`:

### Additions (6 new types)

```typescript
export type DonnaContextType =
  // ── Existing (11) ──────────────────────────────────────────────
  | 'academy_overview'
  | 'player_collection'
  | 'player_profile'
  | 'coach_profile'
  | 'group_context'               // Still deferred — type preserved
  | 'session_context'             // Sessions list (shallow — Sprint 864 deepens)
  | 'class_template_collection'
  | 'fitness_template_collection'
  | 'curriculum_context'
  | 'review_queue_context'
  | 'signals_context'
  // ── New (6) ────────────────────────────────────────────────────
  | 'session_detail'              // Specific session — Sprint 863
  | 'class_template_detail'       // Specific template — Sprint 867
  | 'coach_session_context'       // Coach on session execution page — Sprint 865
  | 'coach_wrap_up_context'       // Coach on wrap-up page — Sprint 866
  | 'coach_home_context'          // Coach dashboard — Sprint 865
  | 'coach_players_context'       // Coach player list — Sprint 865
```

### `DonnaContextRequest.params` extension

Add `sessionId` and `templateId` (existing `playerId` and `coachId` unchanged):

```typescript
export interface DonnaContextRequest {
  contextType: DonnaContextType
  params?: {
    playerId?: string    // existing
    coachId?: string     // existing
    sessionId?: string   // NEW — Sprint 863
    templateId?: string  // NEW — Sprint 867
  }
}
```

### `deriveContextRequest` signature extension

Add optional `role` parameter to enable coach-route dispatch:

```typescript
export function deriveContextRequest(
  pathname: string,
  role?: 'director' | 'coach' | 'head_coach',
): DonnaContextRequest
```

The role parameter is sourced from the `role` prop already passed to `DonnaAssistantButton`.
`DonnaAssistantButton` passes `role` to `handleContextSummary` → `deriveContextRequest`.
No new prop threading required — role is already available at the call site.

---

## Part 3 — Route Matching Priority (Updated Algorithm)

The updated `deriveContextRequest` evaluates routes in this strict order.
**Lower priority number = evaluated first.**

```
Priority 1  — /director/players/<uuid>           → player_profile       (UUID validated)
Priority 2  — /director/coaches/<uuid>           → coach_profile        (UUID validated)
Priority 3  — /director/sessions/<uuid>          → session_detail       (NEW — UUID validated)
Priority 4  — /director/class-templates/<uuid>   → class_template_detail (NEW — UUID validated)

Priority 10 — /director/players                  → player_collection
Priority 11 — /director/sessions                 → session_context
Priority 12 — /director/class-templates          → class_template_collection
Priority 13 — /director/fitness                  → fitness_template_collection
Priority 14 — /director/curriculum               → curriculum_context
Priority 15 — /director/review                   → review_queue_context
Priority 16 — /director/signals                  → signals_context
Priority 17 — /director/onboarding               → academy_overview

Priority 20 — /coach/sessions/<id>/wrap-up       → coach_wrap_up_context  (NEW — role=coach)
Priority 21 — /coach/sessions/<id>              → coach_session_context  (NEW — role=coach)
Priority 22 — /coach/players                     → coach_players_context  (NEW — role=coach)
Priority 23 — /coach                             → coach_home_context     (NEW — role=coach)

Priority 99 — (all other routes)                 → academy_overview
```

**Key ordering rules:**
1. UUID routes (P1–P4) always come before their prefix siblings (P10–P17).
   Prevents `/director/sessions/abc-uuid` matching the sessions list prefix.
2. Coach routes (P20–P23) are evaluated by role gate — only if `role` param is `'coach'`
   or `'head_coach'`. A director navigating to `/coach/**` still gets the P99 fallback.
3. UUID validation uses `UUID_RE` for director detail pages.
   Coach session ID validation is a non-empty string check (session IDs may be UUIDs
   or other formats depending on DB generation — Sprint 863 will confirm the exact format).
4. The `/coach/sessions/<id>/wrap-up` route (P20) must be matched before
   `/coach/sessions/<id>` (P21) — more specific path wins.
5. `academy_overview` is the P99 fallback for any unmapped route. It is never removed.

---

## Part 4 — Fetch Function Specifications

All functions are `async`, `'use server'`, read-only, and use the academy-scoped
Supabase server client. No `.insert`, `.update`, `.delete`, or `.upsert` calls.
All functions return `DonnaContextSummary`. All use `makeFallbackSummary` on error.

---

### 4.1 `fetchSessionDetailContext(supabase, academyId, sessionId)`

**Purpose:** Specific session — coach, roster, blocks, attendance, curriculum focus.

**Tables (estimated 6 queries):**

| Query | Tables | Filter |
|---|---|---|
| Session meta | `sessions` | `id = sessionId AND academy_id = academyId` |
| Coach name | `profiles` | `id = session.coach_id` |
| Session blocks | `session_blocks` | `session_id = sessionId` ORDER BY `order_index` |
| Attendance roster | `session_attendance` | `session_id = sessionId` |
| Player levels | `player_curriculum_states` JOIN `curriculum_levels` | `player_id IN (attendance.player_ids)` |
| Pending items | `proposed_actions` | `target_entity_id = sessionId AND academy_id = academyId AND status = 'pending_review'` |

**Key facts returned:**
- Session name, date, scheduled time, status (draft/active/completed/cancelled)
- Coach name and role
- Roster: total, present count, absent count, late count
- Block list: names, types, durations (ordered)
- Curriculum levels represented by players in attendance
- Whether a wrap-up has been submitted for this session
- Pending review items linked to this session

**Scoping:** `academy_id` on all queries. `coach_id` from session row (never from caller).

**Safety:** Coach notes not fetched (director-only view). Attendance shows present/absent status
and player name only — no medical or behavioral notes. No parent-visible data.

**Fallback:** If session not found for `academy_id`, return `makeFallbackSummary('session_detail', ...)`.

**Suggested commands:**
- "Who attended this session?"
- "What blocks were on the plan?"
- "Did the coach submit a wrap-up?"
- "Is there anything pending review for this session?"

---

### 4.2 `fetchClassTemplateDetailContext(supabase, academyId, templateId)`

**Purpose:** Specific template being built or edited — block structure, level alignment, usage.

**Tables (estimated 4 queries):**

| Query | Tables | Filter |
|---|---|---|
| Template meta | `class_templates` | `id = templateId AND academy_id = academyId` |
| Blocks | `curriculum_class_template_blocks` | `class_template_id = templateId` ORDER BY `order_index` |
| Level mapping | `curriculum_levels` | `id = template.curriculum_level_id` (if set) |
| Recent usage | `sessions` | `class_template_id = templateId AND academy_id = academyId AND scheduled_date >= 30d ago` |

**Key facts returned:**
- Template name, status (draft/active), target curriculum level name
- Block count, ordered block list (name, type, duration, intensity)
- Total duration (sum of block durations)
- Usage in last 30 days: session count, last used date
- Whether the template has a curriculum level assigned
- Whether any blocks are missing expected elements (gap detection)

**Scoping:** `academy_id` on all queries.

**Fallback:** If template not found for `academy_id`, return `makeFallbackSummary('class_template_detail', ...)`.

**Suggested commands:**
- "Review this template structure."
- "What curriculum level does this target?"
- "How many times has this template been used?"
- "What blocks are missing from a standard session?"

---

### 4.3 `fetchCoachHomeContext(supabase, academyId, coachId)`

**Purpose:** Coach dashboard — today's sessions, pending wrap-ups, submissions in review.

**Tables (estimated 3 queries):**

| Query | Tables | Filter |
|---|---|---|
| Today's sessions | `sessions` | `academy_id = academyId AND coach_id = coachId AND scheduled_date = today` |
| Pending wrap-ups | `proposed_actions` | `academy_id = academyId AND proposed_by_id = coachId AND target_module = 'session_wrap_up_v1' AND status = 'pending_review'` |
| Pending submissions | `proposed_actions` | `academy_id = academyId AND proposed_by_id = coachId AND status = 'pending_review'` |

**Key facts returned:**
- Sessions scheduled today (count + names)
- Sessions missing wrap-up submission
- Count of coach's items currently in director review

**Scoping:** `academy_id` AND `coach_id` on all queries.

**Visibility boundary:** `coach_scoped` — coach sees only their own sessions and submissions.

**Suggested commands:**
- "What sessions do I have today?"
- "Do I have any missing wrap-ups?"
- "What's waiting for director review?"

---

### 4.4 `fetchCoachSessionContext(supabase, academyId, coachId, sessionId)`

**Purpose:** Coach executing a live session — roster, blocks, player watch-fors.

**Tables (estimated 5 queries):**

| Query | Tables | Filter |
|---|---|---|
| Session verification | `sessions` | `id = sessionId AND academy_id = academyId AND coach_id = coachId` (MUST PASS) |
| Blocks | `session_blocks` | `session_id = sessionId` ORDER BY `order_index` |
| Attendance | `session_attendance` | `session_id = sessionId` |
| Player levels | `player_curriculum_states` JOIN `curriculum_levels` | `player_id IN (roster)` |
| Active priorities | `player_priorities` | `player_id IN (roster) AND status = 'active'` LIMIT 2 per player |

**Critical safety rule:** The session verification query (first query) MUST include
`AND coach_id = coachId`. If the session does not belong to this coach, return
`makeFallbackSummary('coach_session_context', 'This session is not assigned to you.')`.
No further queries are run. Coach cannot see another coach's session roster.

**Key facts returned:**
- Session name and date
- Roster: player names, curriculum levels, attendance status so far
- Block delivery plan (ordered)
- Per-player priority highlights (what coach should watch for today — 2 per player max)

**Scoping:** `academy_id` AND `coach_id` (via session ownership check) on all queries.

**Visibility boundary:** `coach_scoped` — coach sees own session + roster only.
No cross-coach note access. No director-private priority details.

**No coach notes fetch** — coach notes are director-reviewed data. Coach sees their own
session roster and active player priorities, not full note history.

**Suggested commands:**
- "Who is on the roster today?"
- "What blocks am I delivering?"
- "What should I focus on for each player?"

---

### 4.5 `fetchCoachWrapUpContext(supabase, academyId, coachId, sessionId)`

**Purpose:** Coach submitting a session wrap-up — who attended, what was delivered, prior submissions.

**Tables (estimated 4 queries):**

| Query | Tables | Filter |
|---|---|---|
| Session verification | `sessions` | `id = sessionId AND academy_id = academyId AND coach_id = coachId` (MUST PASS) |
| Final attendance | `session_attendance` | `session_id = sessionId` |
| Blocks delivered | `session_blocks` | `session_id = sessionId` |
| Prior wrap-up | `proposed_actions` | `target_entity_id = sessionId AND proposed_by_id = coachId AND target_module = 'session_wrap_up_v1'` |

**Key facts returned:**
- Session name and date
- Final attendance: present players (names + levels), absent players
- Block list (what was scheduled — coach confirms what was actually delivered)
- Whether a wrap-up has already been submitted for this session (and its status)

**Scoping:** `academy_id` AND `coach_id` (via session ownership check).

**Safety:** Same coach ownership check as `fetchCoachSessionContext`.
Wrap-up submission itself goes through `proposed_actions` → director review queue.
Nothing in this fetch creates or modifies any record.

**Suggested commands:**
- "Who was present today?"
- "Have I already submitted a wrap-up for this session?"
- "What blocks did I plan to deliver?"

---

### 4.6 `fetchCoachPlayersContext(supabase, academyId, coachId)`

**Purpose:** Coach player list — players the coach has coached recently.

**Tables (estimated 3 queries):**

| Query | Tables | Filter |
|---|---|---|
| Recent coach sessions | `sessions` | `academy_id = academyId AND coach_id = coachId AND scheduled_date >= 30d ago` |
| Session roster | `session_attendance` | `session_id IN (coach session ids) AND status = 'present'` — GROUP BY player_id |
| Player summary | `players` + `player_curriculum_states` + `curriculum_levels` | `id IN (roster player_ids)` |

**Key facts returned:**
- Players the coach has delivered sessions to in last 30 days (coached roster)
- Their current curriculum levels
- Session count per player

**Scoping:** `academy_id` AND `coach_id` (via session ownership).
Coach sees only players who attended sessions they ran — no global player access.

**Suggested commands:**
- "Show me my players."
- "What levels are my players at?"

---

### 4.7 `fetchSessionContext` — Deepening spec (Sprint 864)

**Current state:** 1 query — sessions list only (sessions list/status only).
Sprint 864 deepens without changing the context type (`session_context` preserved).

**Additional queries to add (estimated 3 more, total 4):**

| Query | Tables | Purpose |
|---|---|---|
| Coach names | `profiles` WHERE `id IN (sessions.coach_id)` | Show coach per session |
| Attendance rates | `session_attendance` GROUP BY session_id | Present count per session |
| Today's sessions highlight | Filter `sessions.scheduled_date = today` | Distinguish live vs. future |

**This is a fetch function deepening, not a type change.**
`session_context` type is preserved; `fetchSessionContext` is updated in-place.
No migration. No `DonnaContextType` change. Sprint 864 scope is `donnaContextActions.ts` only.

---

## Part 5 — Full Registry

All registry entries. Status reflects pre-861 state.

### Director Role

| Priority | Route Pattern | contextType | fetchFn | Queries | Score | Sprint |
|---|---|---|---|---|---|---|
| 1 | `/director/players/<uuid>` | `player_profile` | `fetchPlayerProfile` | 7 | 9/10 ✅ | Implemented |
| 2 | `/director/coaches/<uuid>` | `coach_profile` | `fetchCoachContext` | 5 | 7/10 ✅ | Implemented |
| 3 | `/director/sessions/<uuid>` | `session_detail` | `fetchSessionDetailContext` | ~6 | — 🆕 | Sprint 863 |
| 4 | `/director/class-templates/<uuid>` | `class_template_detail` | `fetchClassTemplateDetailContext` | ~4 | — 🆕 | Sprint 867 |
| 10 | `/director/players` | `player_collection` | `fetchPlayerCollection` | 2 | 7/10 ✅ | Implemented |
| 11 | `/director/sessions` | `session_context` | `fetchSessionContext` | 1→4 | 4/10 ⚠️ | Sprint 864 deepens |
| 12 | `/director/class-templates` | `class_template_collection` | `fetchClassTemplateCollection` | 3 | 6/10 ✅ | Implemented |
| 13 | `/director/fitness` | `fitness_template_collection` | `fetchFitnessTemplateCollection` | ~2 | 3/10 ⚠️ | Existing (thin) |
| 14 | `/director/curriculum` | `curriculum_context` | `fetchCurriculumContext` | 4 | 6/10 ✅ | Implemented |
| 15 | `/director/review` | `review_queue_context` | `fetchReviewQueueContext` | 2 | 7/10 ✅ | Implemented |
| 16 | `/director/signals` | `signals_context` | `fetchSignalsContext` | 5 | 8/10 ✅ | Implemented |
| 17 | `/director/onboarding` | `academy_overview` | `fetchAcademyOverview` | 6 | 7/10 ✅ | Implemented |
| 99 | `/director` (fallback) | `academy_overview` | `fetchAcademyOverview` | 6 | 7/10 ✅ | Implemented |

### Coach Role

| Priority | Route Pattern | contextType | fetchFn | Queries | Score | Sprint |
|---|---|---|---|---|---|---|
| 20 | `/coach/sessions/<id>/wrap-up` | `coach_wrap_up_context` | `fetchCoachWrapUpContext` | ~4 | — 🆕 | Sprint 866 |
| 21 | `/coach/sessions/<id>` | `coach_session_context` | `fetchCoachSessionContext` | ~5 | — 🆕 | Sprint 865 |
| 22 | `/coach/players` | `coach_players_context` | `fetchCoachPlayersContext` | ~3 | — 🆕 | Sprint 865 |
| 23 | `/coach` | `coach_home_context` | `fetchCoachHomeContext` | ~3 | — 🆕 | Sprint 865 |
| 99 | fallback | `academy_overview` | `fetchAcademyOverview` | 6 | — | Existing (wrong) |

### Parent / Player

| Surface | Context system | Status |
|---|---|---|
| `/parent/ask-donna` | Dedicated static chip page | Adequate (5/10); no floating context pipeline |
| `/player/ask-donna` | Dedicated static chip page | Adequate (5/10); no floating context pipeline |

Parent and player surfaces use a separate delivery mechanism (chip-based dedicated pages).
They are not part of this registry's scope. The floating button is not mounted in parent/player layouts.

### Deferred

| contextType | Reason |
|---|---|
| `group_context` | Group management UI not yet built; no route exists; no data model for groups visible in sprint history |
| `fitness_template_collection` | Flow "not yet wired" per source code comment; deepening deferred until flow is complete |

---

## Part 6 — Focus Target Specifications

Focus targets (`data-donna-focus-id` DOM attributes) are the bridge between live context
and DONNA navigate actions. Every target must be registered in `donnaUIActionRegistry.ts`
before it can be used in a DONNA navigate command.

### 6.1 Sessions List Page (`/director/sessions`)

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `session-list` | Sessions list container | Navigate DONNA to the main session list |
| `session-today-section` | Today's sessions group or highlight | "Show me today's sessions" |
| `session-status-filter` | Status filter bar/tabs | "Filter by active/completed/upcoming" |

**Implementation sprint:** Sprint 868
**Registrar component:** None needed — add to existing sessions page JSX

---

### 6.2 Session Detail Page (`/director/sessions/[id]`)

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `session-header` | Session name + date + coach card | Navigate to session overview |
| `session-attendance-section` | Attendance table/list | "Who attended this session?" |
| `session-blocks-section` | Block list | "What blocks were on the plan?" |
| `session-wrap-up-card` | Wrap-up status card | "Has the wrap-up been submitted?" |

**Implementation sprint:** Sprint 868
**Registrar component:** None needed — add to existing session detail JSX

---

### 6.3 Template Detail / Builder (`/director/class-templates/[id]`, `/new`)

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `template-header` | Template name + status + level | Navigate to template overview |
| `template-blocks-list` | Block list/builder section | "Review this template's blocks" |
| `template-curriculum-level` | Curriculum level assignment field | "What level does this target?" |

**Implementation sprint:** Sprint 868
**Note:** `create-template-form` already exists on `/new` page — add the above for detail/edit pages

---

### 6.4 Coach Session Page (`/coach/sessions/[id]`)

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `coach-session-roster` | Attendance / roster list | "Show me who is on the roster" |
| `coach-session-blocks` | Block list for delivery | "What blocks do I deliver today?" |
| `coach-wrap-up-trigger` | Wrap-up submission CTA | "How do I submit my wrap-up?" |

**Implementation sprint:** Sprint 868
**Note:** Coach pages have ZERO current focus targets — these are the first three

---

### 6.5 Coach Wrap-Up Page

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `coach-wrap-up-form` | Wrap-up form container | Navigate to wrap-up entry |
| `coach-player-notes` | Per-player observations area | "Add a note for this player" |

**Implementation sprint:** Sprint 868

---

### 6.6 Review Queue — additional targets

The review queue currently has 1 focus target (`attendance-exceptions-section`).

| `data-donna-focus-id` | Element | Purpose |
|---|---|---|
| `review-wrap-ups-section` | Coach wrap-up queue section | "Show me pending wrap-ups" |
| `review-placement-section` | Placement queue section | "Show me pending placements" |

**Implementation sprint:** Sprint 868 (low priority — existing 1 target is adequate)

---

## Part 7 — `DonnaAssistantButton` Integration Points

Two changes needed in `DonnaAssistantButton.tsx` to wire this registry:

### 7.1 Pass `role` into `deriveContextRequest`

```typescript
// Current (Sprint 856–858):
const req = deriveContextRequest(pathname)

// Updated (Sprint 862):
const req = deriveContextRequest(pathname, role)
// role comes from the `role` prop already passed to DonnaAssistantButton
```

`role` prop already exists on `DonnaAssistantButton` and is wired from the layout.
No new prop threading. One line change at the `handleContextSummary` call site.

### 7.2 Pass new params to `fetchDonnaContext`

```typescript
// fetchDonnaContext already accepts params: { playerId?, coachId? }
// Extend to accept sessionId and templateId — no signature breaking change
// (optional fields added to existing optional object)
```

---

## Part 8 — `donnaPageContextEngine.ts` Additions

`donnaPageContextEngine.ts` (Sprint 687) contains `DonnaPageCapabilityMap` entries for each route.
New routes need capability map entries added in Sprint 862 alongside the new context types.

**Routes needing new capability map entries:**

| Route pattern | pageLabel |
|---|---|
| `/director/sessions/[sessionId]` | Session Detail |
| `/director/class-templates/[templateId]` | Template Detail |
| `/coach/sessions/[sessionId]` | Coach Session |
| `/coach/sessions/[sessionId]/wrap-up` | Coach Wrap-Up |
| `/coach` | Coach Hub |
| `/coach/players` | Coach Players |

Each entry needs: `directorIntent`, `safeContext`, `suggestedPrompts`, `allowedAnswerTypes`,
`reviewRequiredActions`, `blocked`, `dataFallback`.

These are written in Sprint 862 (registry foundation) alongside the type changes,
not in separate sprints, because they are pure TypeScript additions with no DB or UI changes.

---

## Part 9 — Safety Boundaries

These boundaries apply to every new context type. They are non-negotiable.

| Boundary | Rule |
|---|---|
| `academy_id` always required | Every query in every fetch function must include `AND academy_id = academyId`. No exceptions. |
| Coach ownership check | `fetchCoachSessionContext` and `fetchCoachWrapUpContext` MUST verify `AND coach_id = coachId` on the session row before running any roster or block queries. Fail fast with `makeFallbackSummary` if check fails. |
| No cross-coach note access | Coach context fetch functions must not query `coach_notes` with a different `coach_id`. Coach sees their own prior notes only. |
| No parent/player data | No context type in this registry returns parent-visible data (no guardian relationships, no parent communication history, no private lesson request details beyond counts). |
| No DB writes | All new fetch functions are read-only. No `.insert`, `.update`, `.delete`, `.upsert`. |
| No RLS bypass | No service role. Supabase server client with RLS active on all queries. |
| No live data in parent/player chip pages | Parent and player ask-donna pages use server-render-time DB reads, not live context queries at user request time. No change proposed. |
| Wrap-up submission via review queue | `fetchCoachWrapUpContext` surfaces the current state. Actual wrap-up submission goes through `proposed_actions` → director review, as always. DONNA does not submit wrap-ups. |

---

## Part 10 — Phased Implementation Plan (Sprints 862–869)

| Sprint | Title | Scope | Key files |
|---|---|---|---|
| **862** | DONNA Page Context Registry Foundation V1 | Add 6 new `DonnaContextType` values; extend `DonnaContextRequest.params` with `sessionId`/`templateId`; add `role` param to `deriveContextRequest`; add UUID routing for sessions + class-templates; add coach route block (P20–P23); add `donnaPageContextEngine` capability map entries for 6 new routes | `donnaContextTypes.ts`, `donnaPageContextEngine.ts` |
| **863** | DONNA Session Detail Context V1 | Implement `fetchSessionDetailContext`; wire to `fetchDonnaContext` switch; wire `session_detail` type | `donnaContextActions.ts` |
| **864** | DONNA Session List Context Depth V1 | Deepen `fetchSessionContext` — add coach names, attendance counts, today highlight (3 additional queries) | `donnaContextActions.ts` |
| **865** | DONNA Coach Context Block V1 | Implement `fetchCoachHomeContext`, `fetchCoachSessionContext`, `fetchCoachPlayersContext`; wire to `fetchDonnaContext` | `donnaContextActions.ts` |
| **866** | DONNA Coach Wrap-Up Context V1 | Implement `fetchCoachWrapUpContext`; wire to `fetchDonnaContext` | `donnaContextActions.ts` |
| **867** | DONNA Template Detail Context V1 | Implement `fetchClassTemplateDetailContext`; wire to `fetchDonnaContext`; wire `class_template_detail` type | `donnaContextActions.ts` |
| **868** | DONNA Focus Target Coverage V1 | Add `data-donna-focus-id` attributes to sessions list, session detail, template detail, coach session, coach wrap-up; register new focus targets in `donnaUIActionRegistry.ts` | Session pages, coach pages, `donnaUIActionRegistry.ts` |
| **869** | DONNA Context Registry Certification V1 | Static code audit of Sprints 862–868; 12-point checklist; verify UUID routing, coach ownership checks, all new context types reachable; no DB writes confirmed; TypeScript clean | Audit doc only |

**Total: 8 sprints.** Each sprint is scoped to touch the minimum files. No sprint
crosses the file boundary between type definitions (Sprint 862) and fetch implementations
(Sprints 863–867) except where explicitly stated.

---

## Part 11 — Score Projections

Post-implementation score projections (based on fetch function specs above):

| Surface | Pre-861 Score | Post-869 Projected |
|---|---|---|
| Director Dashboard | 7/10 | 7/10 (unchanged) |
| Review Queue | 7/10 | 8/10 (+1 additional targets) |
| Sessions Page | 4/10 | 6/10 (+2 deeper fetch) |
| Session Detail | 2/10 | 8/10 (+6 — correct context + focus targets) |
| Class Templates | 6/10 | 6/10 (unchanged) |
| Template Builder | 3/10 | 7/10 (+4 — correct context + targets) |
| Player Directory | 7/10 | 7/10 (unchanged) |
| Player Profile | 9/10 | 9/10 (unchanged) |
| Coach Session | 1/10 | 8/10 (+7 — correct coach context + ownership check) |
| Coach Wrap-Up | 1/10 | 8/10 (+7 — correct wrap-up context + targets) |
| Parent Portal | 5/10 | 5/10 (unchanged) |
| Player Portal | 5/10 | 5/10 (unchanged) |

**System average post-869: ~7.1/10** (up from 4.9/10)
**Director surfaces post-869: ~7.8/10** (up from 5.9/10)

---

## Part 12 — What This Design Does NOT Include

These are explicitly deferred — not in scope for Sprints 862–869:

| Item | Why deferred |
|---|---|
| `group_context` implementation | Group management UI not yet built |
| `fitness_template_collection` deepening | Flow "not yet wired" in source; premature to deepen |
| Thread/memory context injection | Separate concern — memory architecture sprint (post-900) |
| Predictive suggestion layer | Requires memory + preference data not yet stored |
| `/director/coaches` collection page | Coach profile (UUID) is implemented; collection page is low-traffic |
| `/director/placement` detail context | Placement flow is onboarding-only; low post-onboarding traffic |
| Parent/player live context queries | Architecture decision — chip-based static delivery is correct for these roles; no floating button mounted |
| AbortController for in-flight race | Known limitation from Sprint 857; addressed separately |
| `academy_overview` query optimization | Separate performance sprint (Sprint 915) |

---

## Files Created

### `docs/DONNA_PAGE_CONTEXT_REGISTRY_DESIGN_861.md`
This file.

---

## Files Modified

None — design-only sprint.

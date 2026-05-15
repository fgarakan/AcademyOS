# Screen Backend Readiness Map — Sprint 385

Per-screen backend readiness ratings, missing pieces, and recommended sprint order.

**Last updated:** 2026-05-15

Cross-reference: `MODULE_MATURITY_MAP.md` for per-module ratings, `DONNA_SCREEN_CAPABILITY_MAP.md` for DONNA capability, `PROTOTYPE_SCREEN_ADOPTION_MAP.md` for full screen specs.

---

## Readiness Scale

| Level | Meaning |
|---|---|
| 0 | Concept only. No data model, no route, no action. |
| 2 | Data model exists. Tables defined, migrations applied. |
| 4 | Route scaffolded. Page exists but no real data queries. |
| 6 | Backend wired. Server actions and queries return real data. |
| 8 | DONNA capable. Context registered, task contracts wired, `proposed_actions` integrated. |
| 10 | Pilot-ready. QA pass, no demo-only data, protected actions enforced, audit log writing. |

---

## Screen 1 — Director Command Center

**Route:** `/director/command-center`
**Overall readiness: Level 8**

| Dimension | Status | Level |
|---|---|---|
| Route exists | YES — built Sprint 219–228 | 4+ |
| Data queries wired | YES — sessions, proposed_actions, signals | 6+ |
| DONNA context registered | YES — `donnaPageContextRegistry` entry exists | 8+ |
| All 7 COO commands | YES — wired Sprint 369–383 | 8+ |
| All 11 wired task contracts | YES | 8+ |
| Protected actions enforced | YES — all mutations via proposed_actions | 8+ |
| Audit logging | YES — `appendAuditEvent` instrumented | 8+ |
| Legacy component removed | NO — `DirectorAssistantPanel` still present | blocks Level 10 |
| COO layer fully surfaced in UI | PARTIAL — panel overlay, not docked command view | |

**What's missing for Level 10:**
- Remove legacy `DirectorAssistantPanel` (predates COO layer). Sprint 391.
- Expose full COO command grid in the screen body (not only via DONNA panel).

**Migration required:** No
**Recommended build sprint:** Sprint 391 (refresh/cleanup)

---

## Screen 2 — DONNA Executive Panel (global)

**Route:** No dedicated route — global component on all `/director/**`
**Overall readiness: Level 9**

| Dimension | Status | Level |
|---|---|---|
| `DonnaAssistantButton.tsx` | Modularized — Sprint 384 | 9+ |
| Voice input + TTS | Stable — Sprints 297–350 | 9+ |
| All 7 COO commands | Wired | 9+ |
| 11/15 task contracts | Wired; 4 stubs | 8 |
| Audit trail | Instrumented | 9+ |
| Preference memory | Sprint 377 | 8+ |
| Recommendation engine | Sprint 374–375 | 8+ |
| Context entries for new screens | MISSING for 5 routes | blocks Level 10 |

**Missing context entries (add in same sprint as each new screen):**
- `/director/today` → Sprint 386
- `/director/level-up` → Sprint 388
- `/director/parents` → Sprint 389
- `/coach/sessions/[sessionId]` → Sprint 390
- `/coach/recap` → Sprint 390

**Migration required:** No
**Recommended build sprint:** Context entries added per-screen as each screen is built.

---

## Screen 3 — Today's Academy

**Route:** `/director/today` *(does not exist)*
**Overall readiness: Level 3**

| Dimension | Status | Level |
|---|---|---|
| Data model | Sessions, players, attention API, brief API — all available | 6 |
| Route exists | NO | 0 |
| DONNA context registered | NO | 0 |
| Server actions available | YES — sessions queries, `/api/donna/attention`, `/api/donna/brief` | 6 |
| `proposed_actions` pipeline | Available | 6 |
| Demo-safe fallback | Static sessions array + brief text available | — |

**What's missing for Level 8:**
1. Create route `/director/today` with `page.tsx` and director layout
2. Add `donnaPageContextRegistry` entry for `/director/today`
3. Wire session list query filtered by `scheduled_date = today`
4. Render attention card from `/api/donna/attention`
5. Render daily brief card from `/api/donna/brief`
6. Render review queue count badge
7. DONNA panel opens with today-specific intro

**What's missing for Level 10:**
- QA pass on date filtering (test timezone edge cases)
- No stale-data regression (verify date filter is server-time, not client-time)

**Migration required:** No
**Effort estimate:** 1 sprint
**Recommended build sprint:** Sprint 386 (highest readiness, no migration, data all available)

---

## Screen 4 — Sessions / Director Plan / Coach Brief

**Route:** `/director/sessions`, `/director/sessions/[sessionId]`, `/coach/sessions/[sessionId]`
**Overall readiness: Level 7** (list = Level 9; detail = Level 6; coach brief route = Level 0)

### Sessions list (`/director/sessions`)

| Dimension | Status | Level |
|---|---|---|
| Route exists | YES | 4+ |
| Data queries | YES — sessions + filters wired | 6+ |
| DONNA context registered | YES | 8+ |
| COO commands available | All 7 | 8+ |
| `create_session` draft | Wired | 8+ |

**Readiness: Level 9** — Needs minor QA refresh only.

### Session detail (`/director/sessions/[sessionId]`)

| Dimension | Status | Level |
|---|---|---|
| Route exists | YES | 4+ |
| Data queries | YES — session + blocks + template + coach | 6+ |
| DONNA context registered | NO | blocks Level 8 |
| `draft_coach_communication` | Wired | 6+ |
| `populate_session_from_template` | Wired | 6+ |

**Readiness: Level 6**

**What's missing for Level 8:**
1. Add `donnaPageContextRegistry` entry for `/director/sessions/[sessionId]`
2. Wire "Draft coach brief" CTA to `draft_coach_communication` task from session detail
3. Wire "Populate blocks" CTA to `populate_session_from_template` from session detail

**Migration required:** No
**Recommended build sprint:** Sprint 387

### Coach session workspace (`/coach/sessions/[sessionId]`)

| Dimension | Status | Level |
|---|---|---|
| Route exists | YES | 4+ |
| Wrap-up flow | YES — `CoachWrapUpDrawer` wired | 6+ |
| DONNA context registered | NO | blocks Level 8 |
| Coach DONNA panel | NOT BUILT | 0 |

**Readiness: Level 6** (DONNA for coach is a future sprint)

**What's missing for Level 8:**
1. Add `donnaPageContextRegistry` entry for `/coach/sessions/[sessionId]` (Sprint 390)
2. Build coach DONNA panel (future sprint, not Sprint 390)

**Migration required:** No
**Recommended build sprint:** Sprint 390 (context entry only; coach DONNA separate)

---

## Screen 5 — Coach Recap Flow

**Route:** `/coach/sessions/[sessionId]` wrap-up tab *(exists)*; `/coach/recap` *(proposed — do not build yet)*
**Overall readiness: Level 6**

| Dimension | Status | Level |
|---|---|---|
| Session workspace route | YES — `/coach/sessions/[sessionId]` | 4+ |
| Wrap-up drawer | YES — `CoachWrapUpDrawer` functional | 6+ |
| `applyWrapUpDraftAction` | YES — proposed_action → approval → execute | 6+ |
| Coach DONNA panel | NOT BUILT | 0 |
| DONNA context for coach routes | NO | 0 |
| `/coach/recap` dedicated route | NO — plan only | 0 |

**What's missing for Level 8:**
1. DONNA coach panel — significant new feature (separate sprint)
2. `donnaPageContextRegistry` entry for `/coach/sessions/[sessionId]`
3. `/coach/recap` route shortcut

**What's missing for Level 10:**
- QA pass on wrap-up → proposed_action → director approval flow
- RLS verification: coach cannot see other coaches' session data

**Migration required:** No
**Recommended build sprint:** Sprint 390 (context entry + `/coach/recap` route shortcut only)

---

## Screen 6 — Level Up / Readiness Review

**Route:** `/director/level-up` *(does not exist)*
**Overall readiness: Level 3**

| Dimension | Status | Level |
|---|---|---|
| Data model | `players`, `assessments`, `coach_notes`, `curriculum_enrollments` — all available | 6 |
| Route exists | NO | 0 |
| DONNA context registered | NO | 0 |
| `getReassessmentPipeline()` | YES — in `dashboard.ts` | 6 |
| `review_level_readiness` server action | YES — wired Sprint 366 | 6+ |
| `finalize_player_placement()` RPC | YES — only level activation path | 10 |
| Level movement gates | YES — `donnaLevelMovementActions.ts` | 8 |

**What's missing for Level 8:**
1. Create route `/director/level-up` with `page.tsx`
2. Add `donnaPageContextRegistry` entry for `/director/level-up`
3. Query `getReassessmentPipeline()` and render player readiness cards
4. Filter row (by level, group, readiness status)
5. "Review" CTA → `review_level_readiness` DONNA task
6. Level change proposal → `proposed_actions` → director approval

**What's missing for Level 10:**
- QA pass: verify level advancement NEVER auto-executes
- Verify `finalize_player_placement()` is the only execution path
- RLS check: head_coach read access if/when permitted

**Migration required:** No
**Architecture red line:** Level movement MUST go through `proposed_actions` → director approval → `finalize_player_placement()`. No exceptions.
**Recommended build sprint:** Sprint 388

---

## Screen 7 — Parent Communication Center

**Route:** `/director/parents` *(does not exist)*
**Overall readiness: Level 3**

| Dimension | Status | Level |
|---|---|---|
| Data model | `proposed_actions` (parent updates), `players` — available | 6 |
| Route exists | NO | 0 |
| DONNA context registered | NO | 0 |
| `draft_parent_update` action | YES — wired Sprint 275 | 6+ |
| `sanitizeParentFacingText` | YES — locked | 10 |
| `parentSafeResponseRules` | YES — locked | 10 |
| External email/SMS delivery | NOT BUILT | 0 |
| Private lesson request view | Partial — `requestPrivateLessonAction` in parent portal | 5 |

**What's missing for Level 8:**
1. Create route `/director/parents` with `page.tsx`
2. Add `donnaPageContextRegistry` entry for `/director/parents`
3. Query `proposed_actions` filtered by `action_type = 'parent_update'`
4. Render pending / approved / executed communication cards
5. "Draft parent update" CTA → `draft_parent_update` DONNA task
6. Parent-safe content preview applied before render
7. Private lesson requests section (read-only first pass)

**What's missing for Level 10:**
- External email/SMS delivery pipeline (separate sprint — NOT Sprint 389)
- Parent reply tracking (future)

**Migration required:** No (external delivery is separate from this screen)
**Architecture rule:** Director must explicitly approve before any communication leaves the system. No auto-send.
**Recommended build sprint:** Sprint 389

---

## Screen 8 — Multi-Academy Portal

**Route:** `/platform` *(scaffolded)*; `/platform/academies` *(not built)*
**Overall readiness: Level 2**

| Dimension | Status | Level |
|---|---|---|
| Route scaffolded | YES — `/platform` layout + page exist | 4 |
| Middleware gate | YES — `platform_roles` check exists | 4 |
| `platform_roles` table | Referenced in middleware; NOT in `database.types.ts` | 2 |
| Cross-academy aggregation queries | NOT BUILT | 0 |
| Multi-academy RLS policy | NOT DEFINED | 0 |
| DONNA context | NO | 0 |
| `/platform/academies` route | NO | 0 |

**What's missing for Level 4 (scaffolded state):**
1. `platform_roles` migration to formalize table in schema (required before any build)
2. TypeScript types generated (`npx supabase gen types`)

**What's missing for Level 8:**
1. All Level 4 items above
2. Cross-academy aggregation queries (academy list, health metrics)
3. Multi-academy RLS policy design and implementation
4. `/platform/academies` and `/platform/academies/[academyId]` routes
5. DONNA context entry for `/platform`

**Migration required:** YES — `platform_roles` table must be formalized. This is a hard dependency before Sprint 392.

**Recommended build sprint:** Sprint 392+
**Blocker:** Migration must land in the sprint BEFORE screen build starts.

---

## Sprint Order Summary

| Sprint | Screen(s) | Route(s) | Readiness change | Migration? |
|---|---|---|---|---|
| 386 | Today's Academy | `/director/today` | Level 3 → Level 8 | No |
| 387 | Sessions Detail DONNA | `/director/sessions/[sessionId]` | Level 6 → Level 8 | No |
| 388 | Level Up Review | `/director/level-up` | Level 3 → Level 8 | No |
| 389 | Parent Comms Center | `/director/parents` | Level 3 → Level 8 | No |
| 390 | Coach Recap + Context | `/coach/recap`, `/coach/sessions/[sessionId]` | Level 6 → Level 7 | No |
| 391 | Command Center Refresh | `/director/command-center` | Level 8 → Level 9 | No |
| 392+ | Platform Portal | `/platform/academies` | Level 2 → Level 6 | YES |

**Rationale:**
- Sprints 386–389 have all backend available — no migrations, no new tables.
- Sprint 388 (Level Up) depends on `finalize_player_placement()` already existing — it does.
- Sprint 390 is partial: adds context entry and `/coach/recap` shortcut; coach DONNA is separate.
- Sprint 391 removes the legacy `DirectorAssistantPanel` that predates the COO layer.
- Sprint 392 cannot start until `platform_roles` migration lands in a prior sprint.

---

## What Requires a Migration Before Build

| Feature | Migration needed | Sprint |
|---|---|---|
| `platform_roles` table formalization | Add to schema, generate types | Before Sprint 392 |
| Any new table without RLS | Always blocked — must add RLS policy | N/A |

No migrations are needed for Sprints 386–391.

---

*Last updated: Sprint 385*

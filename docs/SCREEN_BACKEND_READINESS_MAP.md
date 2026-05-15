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
| Executive panel upgrade | Sprint 392 — w-96, backdrop blur, tab chips, approval copy | 9+ |
| Context entries for new screens | Added per-screen Sprints 386–390 | 9+ |

**What's missing for Level 10:**
- 4 stub task contracts remain unwired
- Coach DONNA panel (separate sprint)

**Migration required:** No
**Recommended build sprint:** Sprint 393 (context wiring pass)

---

## Screen 3 — Today's Academy

**Route:** `/director/today` *(built Sprint 386)*
**Overall readiness: Level 8**

| Dimension | Status | Level |
|---|---|---|
| Data model | Sessions, players, attention API, brief API — all available | 6 |
| Route exists | YES — built Sprint 386 | 8+ |
| DONNA context registered | YES — Sprint 386 | 8+ |
| Session list query | YES — `scheduled_date = today`, server-side UTC date | 8+ |
| Stats strip | YES — Sessions Today, Completed, Pending Review, Risk Flags | 8+ |
| Risk flags | YES — missing blocks + pending review count | 8+ |
| DONNA suggestion chips | YES — 4 chips rendered | 8+ |
| Server-rendered brief/attention | NO — accessed via DONNA panel | — |

**What's missing for Level 10:**
- DONNA suggestion chips wired to open panel with pre-filled prompt (future polish)
- Timezone-aware date filter (UTC+ directors may see off-by-one late at night)

**Migration required:** No
**Built sprint:** Sprint 386

---

## Screen 4 — Sessions / Director Plan / Coach Brief

**Route:** `/director/sessions`, `/director/sessions/[sessionId]`, `/coach/sessions/[sessionId]`
**Overall readiness: Level 8** (list = Level 9; detail = Level 8; coach brief route = Level 0)

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
| DONNA context registered | YES — Sprint 387 | 8+ |
| DONNA prompt chips on page | YES — Sprint 387 | 8+ |
| `draft_coach_communication` | Wired | 6+ |
| `populate_session_from_template` | Wired | 6+ |

**Readiness: Level 8** *(upgraded Sprint 387)*

**What's missing for Level 10:**
1. QA pass with real session data (test DB currently empty)
2. `populate_session_from_template` CTA surfaced directly from session detail (currently via DONNA panel only)

**Migration required:** No
**Built sprint:** Sprint 387

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

**Route:** `/coach/sessions/[sessionId]` wrap-up tab *(exists)*; `/coach/recap` *(built Sprint 390 — shell)*
**Overall readiness: Level 7**

| Dimension | Status | Level |
|---|---|---|
| Session workspace route | YES — `/coach/sessions/[sessionId]` | 4+ |
| Wrap-up drawer | YES — `CoachWrapUpDrawer` functional | 6+ |
| `applyWrapUpDraftAction` | YES — proposed_action → approval → execute | 6+ |
| Coach DONNA panel | NOT BUILT | 0 |
| DONNA context for coach routes | NO | 0 |
| `/coach/recap` dedicated route | YES — built Sprint 390 | 4+ |

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

**Route:** `/director/level-up` *(built Sprint 388)*
**Overall readiness: Level 8**

| Dimension | Status | Level |
|---|---|---|
| Data model | `v_reassessment_pipeline` view — urgency, score, days_overdue | 8 |
| Route exists | YES — built Sprint 388 | 8+ |
| DONNA context registered | YES — Sprint 388 | 8+ |
| Player readiness cards | YES — grouped by urgency, with score and coach | 8+ |
| Architecture red line badge | YES — visible on page | 8+ |
| "View" CTA → player profile | YES — read-only navigation only | 8+ |
| Level movement gate | ENFORCED — no mutation from this page | 8+ |

**What's missing for Level 10:**
- QA pass with real pipeline data (test DB empty)
- Filter row by track/group (future polish)
- Direct "Review" CTA to `review_level_readiness` DONNA task (currently via DONNA panel)

**Architecture red line:** Level movement MUST go through `proposed_actions` → director approval → `finalize_player_placement()`. No exceptions.
**Built sprint:** Sprint 388

---

## Screen 7 — Parent Communication Center

**Route:** `/director/parents` *(built Sprint 389)*
**Overall readiness: Level 8**

| Dimension | Status | Level |
|---|---|---|
| Data model | `parent_updates` table + players join | 8 |
| Route exists | YES — built Sprint 389 | 8+ |
| DONNA context registered | YES — Sprint 389 | 8+ |
| Update cards (draft/approved/sent) | YES | 8+ |
| Parent-safe content preview | YES — truncated + ShieldCheck note | 8+ |
| Workflow banner (4 steps) | YES | 8+ |
| "Review in queue" CTA | YES — links to /director/review | 8+ |
| External email/SMS delivery | NOT BUILT | 0 |
| Private lesson request view | NOT BUILT | 0 |

**What's missing for Level 10:**
- External delivery pipeline (future sprint)
- Private lesson requests section (future sprint)
- QA pass with real parent_update data

**Architecture rule:** No auto-send. Director must approve before any message leaves.
**Built sprint:** Sprint 389

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
| 386 | Today's Academy | `/director/today` | Level 3 → Level 8 ✓ | No |
| 387 | Sessions Detail DONNA | `/director/sessions/[sessionId]` | Level 6 → Level 8 ✓ | No |
| 388 | Level Up Review | `/director/level-up` | Level 3 → Level 8 ✓ | No |
| 389 | Parent Comms Center | `/director/parents` | Level 3 → Level 8 ✓ | No |
| 390 | Coach Recap Shell | `/coach/recap` | Level 0 → Level 4+ ✓ | No |
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

*Last updated: Sprint 394*

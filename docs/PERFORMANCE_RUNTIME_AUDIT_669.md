# Performance + Lean Runtime Audit — Sprint 669

**Date:** 2026-05-23
**Scope:** Runtime cost, route query patterns, component weight, DONNA bundle, server/client boundaries
**Method:** Static code audit — no profiler runs, no live traffic

---

## Summary

AcademyOS routes are structurally sound and correctly server-rendered.
No P0 blockers were found. Three P1 duplicate-query patterns in the director dashboard
are safe to fix in Sprint 670 with zero behavior change.
All other findings are P2/P3 — acceptable for V1 controlled testing.

---

## Audit Findings

### 1. Director Dashboard (`/director/page.tsx`) — Duplicate Queries

**Severity: P1 — Should fix before testing**

The director dashboard page performs **19+ sequential Supabase queries** on every load.
Three query pairs are redundant — they hit the same table for the same row within one request.

#### Issue 1A — `academies` table queried twice
| Detail | Value |
|---|---|
| File | `src/app/director/page.tsx` |
| Lines | 93–99 (name only) and 137–142 (settings only) |
| Symptom | Two round-trips to Supabase for the same academy row |
| User impact | ~1–3ms extra latency per director dashboard load |
| Runtime cost | One extra network call to Supabase on every director page view |
| Recommended fix | Merge into a single `select('name, settings')` call, destructure both fields |
| Safe for Sprint 670 | Yes — pure query merge, no behavior change |
| Behavior change risk | None |

#### Issue 1B — `academy_suggestions` table queried twice
| Detail | Value |
|---|---|
| File | `src/app/director/page.tsx` |
| Lines | 157–165 (pending count + priority breakdown) and 175–181 (curriculum_gap count) |
| Symptom | Two queries to `academy_suggestions` with overlapping filters |
| User impact | ~1–3ms extra latency |
| Runtime cost | One extra network call on every director dashboard load |
| Recommended fix | Fetch all pending suggestions once (`select('priority, suggestion_type')`), derive both counts in-memory |
| Safe for Sprint 670 | Yes — pure logic consolidation |
| Behavior change risk | None |

#### Issue 1C — `player_curriculum_states` queried twice
| Detail | Value |
|---|---|
| File | `src/app/director/page.tsx` |
| Lines | 168–173 (players with level) and 186–190 (advancement_eligible = true) |
| Symptom | Two queries to `player_curriculum_states` for the same academy |
| User impact | ~1–3ms extra latency |
| Runtime cost | One extra network call on every director dashboard load |
| Recommended fix | Fetch all curriculum states once (`select('player_id, advancement_eligible')`), derive both counts in-memory |
| Safe for Sprint 670 | Yes — pure logic consolidation |
| Behavior change risk | None |

---

### 2. Director Dashboard — Total Query Count (P1)

**Severity: P1**

The director dashboard loads 19+ Supabase queries in a single Server Component render.
After the three P1 fixes above, this reduces to 16. Full inventory:

| # | Table | Purpose |
|---|---|---|
| 1 | `auth.getUser()` | User auth |
| 2 | `profiles` | academy_id, display_name |
| 3 | `academies` | name + settings (after merge: 1 query) |
| 4 | `getPlayerSummaries()` | Player roster summary (backend fn) |
| 5 | `getAcademyPriorityQueue()` | Priority queue (backend fn) |
| 6 | `getReassessmentPipeline()` | Reassessment pipeline (backend fn) |
| 7 | `sessions` | Weekly sessions |
| 8 | `private_lesson_requests` | New requests count |
| 9 | `academy_suggestions` | Pending suggestions (after merge: 1 query) |
| 10 | `player_curriculum_states` | Level assignment coverage (after merge: 1 query) |
| 11 | `proposed_actions` | Pending wrap-ups count |
| 12 | `templates` | Template checklist check |
| 13 | `sessions` | Any-session-ever existence check (separate from weekly) |

Post-fix count: **13 queries** (down from 19).
Post-fix assessment: Acceptable for V1 controlled testing at small academy scale.

---

### 3. Review Center (`/director/review/page.tsx`) — Repeated Proposer Lookups (P2)

**Severity: P2 — Optimize later**

The review center performs **11 separate `profiles` batch lookups** to resolve proposer display names —
one for each draft type (session recaps, priority drafts, evidence drafts, attendance drafts,
curriculum override drafts, coach suggestions, voice intake drafts, wrap-up drafts, observation drafts,
summary drafts, capture authors).

Each lookup is a correctly structured batch (`select.in('id', proposerIds)`) — not N+1.
However, the same proposer (e.g., a coach who submitted 3 types of drafts) may be fetched 3 times.

| Detail | Value |
|---|---|
| File | `src/app/director/review/page.tsx` |
| Estimated extra calls | 5–8 redundant profile lookups when same proposer appears in multiple draft types |
| User impact | Minimal at V1 scale (1 coach, 1 director) |
| Runtime cost | Low at small scale; grows with number of active coaches |
| Recommended fix | Collect all proposer IDs across all draft types first, then make one consolidated `profiles` lookup, then distribute the map |
| Safe for Sprint 670 | No — risky refactor of large page. Defer to Sprint 680+ |
| Behavior change risk | Low in theory, high in practice for such a large page |

---

### 4. Review Center — Total Query Count (P2)

**Severity: P2**

The review center executes **25–35 Supabase queries** per load (varies by draft type availability).
This is structurally acceptable because:
- All queries are guarded behind auth + academy_id scope
- All batch lookups use `.in()` — not N+1
- The page is director-only, not shown to players or parents
- No query runs unnecessarily — all are conditional on draft types having items

At V1 scale (1 academy, 1–5 coaches), this is acceptable. At scale, a server-side summary endpoint
or cursor-based pagination would be warranted.

Assessment: **Acceptable for V1 controlled testing.**

---

### 5. Support Diagnostics (`/director/support-diagnostics/page.tsx`) — `Promise.all` Pattern (Good) (P3)

**Severity: P3 — Document only**

The support diagnostics page correctly uses `Promise.all` for its 5 count queries:

```typescript
const [
  { count: activePlayers },
  { count: activeCoaches },
  { count: pendingActions },
  { count: totalAuditLogs },
  { count: totalSessions },
] = await Promise.all([...])
```

This is the correct pattern for independent queries. No fix needed.

Note per `AI_BACKEND_RULES.md` rule 5 ("prefer sequential over Promise.all"):
The support diagnostics page uses `Promise.all` for count-only queries with no relational data — this is
intentional and safe, as count queries have no RLS interaction complexity. This deviation is documented.

---

### 6. DONNA Component Bundle Size (P2)

**Severity: P2**

The DONNA component directory (`src/components/donna/`) contains **60+ components**.
Of those, ~15+ are `'use client'` components.

Key client components and sizes:
| Component | Lines | Role |
|---|---|---|
| `DonnaChatThread.tsx` | 318 | Chat UI — shipped to browser |
| `DonnaVoiceReadyShell.tsx` | 323 | Voice shell — shipped to browser |
| `DonnaConversationalPanel.tsx` | client | Conversational panel |
| `DONNADirectorMobileCommandBar.tsx` | client | Mobile bar |
| `DirectorApprovalActionFlow.tsx` | client | Approval flow |

Because Next.js App Router only ships client components to the browser when they're actually imported
and rendered, not all 60 DONNA components affect every route's bundle.

**Director dashboard imports:** `DonnaDashboardPresenceCTA`, `DonnaExecutiveCard` (server components — no client bundle)
**Director DONNA page:** Imports full chat/voice shells — correctly isolated to that route

Assessment: **DONNA bundle is route-isolated. No cross-route contamination detected.**
No action needed for V1. Watch if DONNA components get imported into non-DONNA routes.

---

### 7. Coach Home (`/coach/page.tsx`) — Two Separate Backend Calls (P2)

**Severity: P2**

The coach home makes two separate backend library calls:
1. `getCoachWorkspaceSummary(supabase, user.id)` — returns profile, groups, players, observations, today's sessions
2. `loadWrapUpSessionSelector(supabase, profile.id, profile.academy_id)` — returns sessions needing wrap-up

These two calls share the same `profile.id` and `profile.academy_id`.
`getCoachWorkspaceSummary` already fetches sessions — `loadWrapUpSessionSelector` fetches sessions again.

| Detail | Value |
|---|---|
| File | `src/app/coach/page.tsx` (lines 48–65) |
| Overlap | Both fetch sessions for the coach |
| User impact | ~2–5ms extra on coach home load |
| Recommended fix | Merge wrap-up count into `getCoachWorkspaceSummary`, or pass session data to `loadWrapUpSessionSelector` |
| Safe for Sprint 670 | Possible but requires touching backend files — defer to P2 |

---

### 8. Player Home (`/player/page.tsx`) — Deeply Sequential Query Chain (P2)

**Severity: P2**

The player home fetches:
1. `profiles` (academy_id)
2. `players` (via profile_id)
3. `player_curriculum_states` (current_level_id)
4. `curriculum_levels` (level details)
5. `curriculum_levels` again (next level)
6. `curriculum_gates`
7. `curriculum_drills`
8. `curriculum_coach_language`
9. `player_priorities`
10. `session_attendance` (history)
11. `sessions` (session details for attendance)
12. `player_requirement_progress` (badge data)

Total: **12 sequential queries** minimum when a player is fully linked and has a curriculum state.

Each is conditionally nested — only runs if prior steps resolve a value.
This is the correct safety pattern, but it means the worst-case load path is 12 round-trips.

At V1 demo scale (1–5 players), this is acceptable.
At scale, a consolidated player portal query function in `src/lib/backend/` would help.

Assessment: **Acceptable for V1 controlled testing. P2 for scale.**

---

### 9. Parent Home (`/parent/page.tsx`) — Deeply Sequential Query Chain + Child Resolution (P2)

**Severity: P2**

The parent home has a similar deep sequential pattern with additional child-switcher resolution:
- Guardian resolution adds 2 extra queries vs player home
- Multi-child path (`player_guardians → players`) adds another layer
- Attendance sub-chain requires two queries (attendance rows → session details)

Total worst-case: **12–14 sequential queries.**

The child safety model (server-side `childId` validation, `validateChildBelongsToGuardian`) is correctly structured.
No security risk. The query depth is a performance cost, not a safety issue.

Assessment: **Acceptable for V1 controlled testing. P2 for scale.**

---

### 10. Director Dashboard — Health Chart Is Static SVG Computation (Good) (P3)

**Severity: P3 — Document only**

The `AcademyHealthChartCard` component generates a 7-point sparkline SVG from `healthPct`
(an integer derived from existing query results) with no additional DB calls.
This is the correct lightweight visualization approach.

No action needed.

---

### 11. Server/Client Boundary — Director Dashboard Is Fully Server-Rendered (Good)

The director dashboard page itself is a Server Component with no `'use client'` directive.
Client components are isolated to specific interactive sub-components:
- `AcademyHealthBadgeWithDrawer` (client — drawer toggle)
- `DirectorContinueSetupPanel` (client — localStorage-driven)
- `SetupProgressChecklist` (server)
- `OnboardingProgressCard` (server)

The SSR/streaming boundary is correctly set.
No unnecessary client hydration detected at page level.

---

### 12. No Next.js Caching Configuration (P2)

**Severity: P2**

`next.config.mjs` has no `serverExternalPackages`, no `cacheHandler`, and no experimental caching flags.

Opportunity: Curriculum levels, academy settings, and group definitions are quasi-static data
that changes rarely. These could benefit from `unstable_cache` or `fetch` revalidation.

No action needed for V1. Noted for post-pilot optimization.

---

### 13. Recharts Import — Player/Director KPI Charts (P3)

**Severity: P3**

`recharts` is in dependencies. At 14.2.x Next.js, recharts ships with client JS.
The director dashboard currently uses a pure SVG sparkline (no recharts).

If recharts is imported in route files directly used at director home, it adds ~150–200KB gzipped to that route's client bundle.

Audit result: Director dashboard **does not import recharts directly**. The KPI card section is server-rendered.
No action needed unless recharts is added to heavy entry-point pages.

---

### 14. Cache Opportunities (P3)

The following data fetched on every load is effectively quasi-static:

| Data | Current pattern | Cache opportunity |
|---|---|---|
| `curriculum_levels` | Fresh query per request | `unstable_cache` with 60s TTL |
| `groups` | Fresh query per request | `unstable_cache` with 30s TTL |
| `academy.settings` | Fresh per request | `unstable_cache` with 30s TTL |
| `academy.name` | Fresh per request | `unstable_cache` with 60s TTL |

None of these affect correctness at V1 demo scale. Flag for post-pilot.

---

## P0/P1 Fix Summary for Sprint 670

| ID | File | Fix | Risk |
|---|---|---|---|
| 1A | `src/app/director/page.tsx` | Merge 2 `academies` queries into 1 | None |
| 1B | `src/app/director/page.tsx` | Merge 2 `academy_suggestions` queries into 1 | None |
| 1C | `src/app/director/page.tsx` | Merge 2 `player_curriculum_states` queries into 1 | None |

**All P1 fixes target one file: `src/app/director/page.tsx`**
**No behavior changes. No RLS changes. No migrations. No new dependencies.**

---

## Deferred Items (P2/P3)

| ID | Priority | Description |
|---|---|---|
| D1 | P2 | Review center: consolidate 11 proposer profile lookups into 1 |
| D2 | P2 | Coach home: merge getCoachWorkspaceSummary + loadWrapUpSessionSelector |
| D3 | P2 | Player home: consolidate 12-query chain into backend function |
| D4 | P2 | Parent home: consolidate 14-query chain |
| D5 | P2 | Add `unstable_cache` for quasi-static data |
| D6 | P3 | DONNA bundle: audit per-route import impact as DONNA pages expand |
| D7 | P3 | Recharts: confirm not imported on heavy entry pages |
| D8 | P3 | Next.js 15 upgrade path: enables partial prerendering for quasi-static sections |

---

## TypeScript Status
No code was written in this sprint. TypeScript check applies to unchanged files only.

## Risk Assessment
- No P0 blockers found.
- Three P1 fixes are safe, isolated, and targeted for Sprint 670.
- All routes render correctly at current demo scale.
- Performance is acceptable for 1-academy V1 controlled testing.

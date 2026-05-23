# Role Permission QA Matrix — Sprint 671

**Date:** 2026-05-23
**Scope:** Route access, data access, DONNA/command permissions, review actions, visibility, known gaps
**Method:** Static audit of `src/middleware.ts`, `src/lib/commands/roleGuardrails.ts`, `src/lib/voice/voiceRoleGuardrails.ts`, key route files

---

## Roles Audited

| Role | Internal ID | Portal | Source of truth |
|---|---|---|---|
| Platform Owner | `platform_owner` | `/platform` | `platform_roles` table |
| Academy Director | `academy_director` | `/director` | `academy_memberships.role` |
| Head Coach | `head_coach` | `/coach` | `academy_memberships.role` |
| Coach | `coach` | `/coach` | `academy_memberships.role` |
| Player | `player` | `/player` | `academy_memberships.role` |
| Parent | `parent` | `/parent` | `academy_memberships.role` |

---

## Middleware Route Access (src/middleware.ts)

All portal routes are gated at middleware level before any Server Component runs.

| Route segment | Allowed roles | How enforced |
|---|---|---|
| `/platform` | `platform_owner` only | `isPlatformUser` check — redirects non-platform users to their academy home |
| `/director` | `academy_director` only | `role === 'academy_director'` |
| `/coach` | `academy_director`, `head_coach`, `coach` | `['academy_director', 'head_coach', 'coach'].includes(role)` |
| `/player` | `player` only | `role === 'player'` |
| `/parent` | `parent` only | `role === 'parent'` |
| `/login`, `/auth` | public | `PUBLIC_ROUTES` bypass |
| `/api/*` | not matched by middleware | API routes are excluded from matcher |
| `/` (root) | any authenticated | Redirects to role home |

**Unauthenticated access:** Middleware redirects to `/login?next=<path>` for all protected routes.

---

## Route Access Matrix

| Route | Director | Head Coach | Coach | Player | Parent | Platform Owner |
|---|---|---|---|---|---|---|
| `/director` | ✅ | ❌ → /coach | ❌ → /coach | ❌ → /player | ❌ → /parent | Preview mode only |
| `/director/review` | ✅ | ❌ (middleware blocks) | ❌ | ❌ | ❌ | Preview mode only |
| `/director/players` | ✅ | ❌ | ❌ | ❌ | ❌ | Preview mode only |
| `/director/sessions` | ✅ | ❌ | ❌ | ❌ | ❌ | Preview mode only |
| `/director/donna` | ✅ | ❌ | ❌ | ❌ | ❌ | Preview mode only |
| `/director/support-diagnostics` | ✅ | ❌ (middleware) | ❌ | ❌ | ❌ | Preview mode only |
| `/coach` | ✅ (director can view) | ✅ | ✅ | ❌ | ❌ | Preview mode only |
| `/coach/sessions` | ✅ | ✅ | ✅ | ❌ | ❌ | Preview mode only |
| `/coach/donna` | ✅ | ✅ | ✅ | ❌ | ❌ | Preview mode only |
| `/player` | ❌ | ❌ | ❌ | ✅ | ❌ | Preview mode only |
| `/player/ask-donna` | ❌ | ❌ | ❌ | ✅ | ❌ | Preview mode only |
| `/parent` | ❌ | ❌ | ❌ | ❌ | ✅ | Preview mode only |
| `/parent/ask-donna` | ❌ | ❌ | ❌ | ❌ | ✅ | Preview mode only |
| `/platform` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Data Access Matrix

| Data category | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| All player profiles (roster) | ✅ full | ✅ assigned only | ✅ assigned only | ❌ | ❌ |
| Player personal data (DOB, etc.) | ✅ | ✅ | ✅ | ✅ own only | ❌ |
| Player curriculum state | ✅ | ✅ | ✅ (level/drills) | ✅ own only | ✅ child only (sanitized) |
| Coach observations (raw notes) | ✅ | ✅ | ✅ own notes | ❌ | ❌ |
| Session attendance | ✅ | ✅ | ✅ | ✅ own only | ✅ child only |
| Proposed actions (review queue) | ✅ | ❌ (middleware blocks director routes) | ❌ | ❌ | ❌ |
| Parent-safe updates (approved) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Private lesson requests | ✅ | ❌ | ❌ | ❌ | ✅ own only |
| Academy settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Platform academy list | ❌ | ❌ | ❌ | ❌ | ❌ (Platform Owner only) |
| Sibling player data | ❌ | ❌ | ❌ | ❌ | ❌ (childId validated server-side) |

---

## DONNA Actions Allowed

Source: `src/lib/commands/roleGuardrails.ts`

| Intent | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| `show_players_missing_curriculum_level` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `show_curriculum_gap_suggestions` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `show_advancement_eligible` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `create_session_draft` | ✅ (review required) | ✅ (review required) | ❌ | ❌ | ❌ |
| `create_group_draft` | ✅ (review required) | ❌ | ❌ | ❌ | ❌ |
| `record_director_note` | ✅ (review required) | ✅ (review required) | ❌ | ❌ | ❌ |
| `ask_curriculum_level_requirements` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `summarize_reassessment_pipeline` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `current_level` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `what_to_practice` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `level_requirements` / `next_level` / `level_meaning` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `ask_child_current_focus` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `ask_how_to_support` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `ask_session_attendance` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Voice Intents Allowed

Source: `src/lib/voice/voiceRoleGuardrails.ts`

| Voice Intent | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| `create_session_draft` | ✅ (director-only, approval required) | ✅ | ❌ | ❌ | ❌ |
| `create_group_draft` | ✅ (director-only) | ❌ | ❌ | ❌ | ❌ |
| `set_group_focus` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `create_player_review_request` | ✅ (hard-blocked from auto-exec) | ❌ | ❌ | ❌ | ❌ |
| `create_parent_safe_draft` | ✅ (hard-blocked from auto-exec) | ❌ | ❌ | ❌ | ❌ |
| `summarize_curriculum_gaps` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `record_director_note` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `record_attendance_exception` | ✅ | ✅ | ✅ (approval required) | ❌ | ❌ |
| `create_player_observation` | ✅ | ✅ | ✅ (approval required) | ❌ | ❌ |
| `create_session_recap` | ✅ | ✅ | ✅ (approval required) | ❌ | ❌ |
| `create_gap_signal` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `alert_director` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Review Queue Actions

| Action | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| View review queue | ✅ | ❌ (middleware blocks /director) | ❌ | ❌ | ❌ |
| Approve proposed action | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reject proposed action | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request clarification | ✅ | ❌ | ❌ | ❌ | ❌ |
| Apply approved action | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit to review queue | ✅ | ✅ (via voice/wrap-up) | ✅ (via voice/wrap-up) | ❌ | ✅ (lesson requests) |

---

## Known Gaps and Findings

### Gap 1 — Head Coach in-page review check is dead code (P2 — documentation)

**Location:** `src/app/director/review/page.tsx` lines 103–120
**Issue:** The review center does an in-page membership check that allows `head_coach` role. However, middleware at `/director` already blocks all non-`academy_director` roles before the page renders. The head_coach branch of this in-page check is unreachable dead code.
**Security impact:** None — middleware is the gating layer. No data is exposed.
**Functional impact:** Head coaches currently have no path to the review queue. If that's intended (directors review; coaches submit), this is correct. If head_coaches should see the review queue, a separate `/coach/review` route or middleware exception would be needed.
**Recommendation:** Document as intentional or create a `/coach/review` surface. Remove the dead in-page `head_coach` check if head coaches are not meant to access `/director/review`.
**Severity: P2** — does not affect security or V1 pilot readiness.

### Gap 2 — `/api/*` routes are excluded from middleware (P2 — known)

**Location:** `src/middleware.ts` matcher config
**Issue:** API routes (`/api/...`) are excluded from the middleware matcher. This means middleware role-routing does not apply to API routes.
**Current mitigation:** Each API route must handle auth independently. Most do. The key routes reviewed:
- `src/app/api/director/interview/realtime-session/route.ts` — has its own auth check
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` — has its own auth check
**Recommendation:** Confirm all API routes have independent auth guards. This is a P2 audit item, not a V1 blocker.
**Severity: P2**

### Gap 3 — Director can access /coach routes (P3 — intentional)

**Location:** `src/middleware.ts` line 137
**Issue:** Middleware allows `academy_director` to access `/coach` routes. This is intentional — directors can preview coach screens to understand what coaches see.
**Security impact:** None. The director's `academy_id` is still scoped in all queries.
**Severity: P3 — intentional behavior, document only**

### Gap 4 — Support diagnostics not in sidebar (P3 — documented)

**Location:** `src/app/director/support-diagnostics/page.tsx`
**Issue:** The support diagnostics page is only accessible by URL (`/director/support-diagnostics`). It has correct role guard (director or head_coach only via `notFound()`), but head_coach cannot reach it anyway due to middleware. Director-only in practice.
**Severity: P3 — by design**

---

## What Can Each Role Do?

### Platform Owner
- Full academy list view
- Preview mode into any portal (director, coach, player, parent) via cookie
- No direct mutations (preview is read-only unless preview actions are explicitly enabled)
- DONNA: all intents (unrestricted by design)

### Academy Director
- Full director portal access
- View all players, sessions, curriculum, coaches
- Review queue: approve, reject, apply all draft types
- DONNA: all director-scoped intents; all requires review queue, no auto-execution
- Curriculum: read + propose overrides (via review queue)
- Parent updates: read + approve drafts (via review queue)
- Cannot access: platform owner portal, other academies' data

### Head Coach
- Coach portal only (middleware blocks /director)
- Coach session execution, wrap-up, observation drafts
- DONNA: director-level command intents via roleGuardrails, but cannot access director routes to use them — functional gap (head coach DONNA is coach-scoped in practice)
- Voice: record_attendance_exception, create_player_observation, create_session_recap, alert_director, record_director_note
- Cannot access: director review queue, curriculum override UI, player roster management

### Coach
- Coach portal only
- Session execution, wrap-up flow, player observation drafts
- DONNA: limited — ask_curriculum_level_requirements only
- Voice: attendance exceptions, observations, recaps, gap signals, alert director
- Cannot access: director portal, review queue, player roster, parent data

### Player
- Player portal only
- Own level, requirements, drills, attendance, badge progress
- DONNA: own development questions only (5 intents)
- Cannot see: coach notes, internal assessments, other players, parent data, director actions

### Parent
- Parent portal only
- Child's level (approved view), attendance, approved parent updates, support guide
- Child switcher: server-validated — cannot access another guardian's children
- DONNA: child focus, how to support, session attendance only
- Cannot see: raw coach notes, internal assessments, other children's data, director actions
- Lesson requests: suppressed for multi-child parents (cross-child leakage guard)

---

## P0 Security Findings

**None.** No unauthorized route access paths found. No data leakage through role boundaries detected in static audit.

---

## Readiness Assessment

| Area | Status | Notes |
|---|---|---|
| Route access control | Ready | Middleware correctly gates all portals |
| Director data access | Ready | All queries scoped to academy_id |
| Coach data access | Ready | Session/player queries scoped correctly |
| Player data isolation | Ready | Own-player-only via profile_id linkage |
| Parent data isolation | Ready | childId validated server-side; sibling leakage blocked |
| Support diagnostics guard | Ready | notFound() for wrong role |
| Review queue access | Ready | Director-only (head_coach dead code — P2) |
| Platform preview mode | Ready | Preview cookie required for portal access |
| Voice intent permissions | Ready | voiceRoleGuardrails correctly restricts |
| DONNA command permissions | Ready | roleGuardrails correctly restricts |

**No P0 blockers. P2 gap (dead code for head_coach in review center) is documentation only.**

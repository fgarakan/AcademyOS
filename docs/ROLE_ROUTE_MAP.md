# Role Route Map — Sprint 385

Maps roles to routes, role requirements per route, and DONNA availability per role.

**Last updated:** 2026-05-15

Source of truth: `src/middleware.ts` + Supabase Auth role column on `profiles` table.

---

## Role Hierarchy

| Role value | Label | Portal | Notes |
|---|---|---|---|
| `academy_director` | Director | `/director` | Full access to all director routes and DONNA panel |
| `head_coach` | Head Coach | `/coach` | Same portal as coach, elevated permissions on some actions |
| `coach` | Coach | `/coach` | Session workspace, wrap-up, recap flow |
| `player` | Player | `/player` | Player development dashboard, IDP view |
| `parent` | Parent | `/parent` | Parent portal — player progress, communications, private lesson requests |
| *(platform row)* | Platform Owner | `/platform` | Requires row in `platform_roles` table; separate from `profiles.role` |

---

## Route Access Map

### Director routes (`/director/**`)

| Route | Required role | Built? | Notes |
|---|---|---|---|
| `/director` | `academy_director` | YES | Dashboard — sessions, signals, priority queue |
| `/director/command-center` | `academy_director` | YES | Legacy + DONNA COO layer |
| `/director/review` | `academy_director` | YES | Proposed actions review queue |
| `/director/curriculum` | `academy_director` | YES | Curriculum management |
| `/director/class-templates` | `academy_director` | YES | Template list |
| `/director/class-templates/[templateId]` | `academy_director` | YES | Template detail + DONNA draft |
| `/director/fitness/templates` | `academy_director` | YES | Fitness template list |
| `/director/fitness/templates/[templateId]` | `academy_director` | YES | Fitness template detail |
| `/director/sessions` | `academy_director` | YES | Sessions list |
| `/director/sessions/[sessionId]` | `academy_director` | YES | Session detail + blocks |
| `/director/players` | `academy_director` | YES | Players list |
| `/director/players/[playerId]` | `academy_director` | YES | Player profile (central data object) |
| `/director/signals` | `academy_director` | YES | Improvement signals |
| `/director/today` | `academy_director` | **NO** | Proposed Sprint 386 |
| `/director/level-up` | `academy_director` | **NO** | Proposed Sprint 388 |
| `/director/parents` | `academy_director` | **NO** | Proposed Sprint 389 |
| `/director/sessions/[sessionId]/brief` | `academy_director` | **NO** | Plan only — coach brief route |

**Head coach access to director routes:** Not yet implemented. `head_coach` is currently redirected to `/coach`. A future sprint may add `head_coach` access to read-only director views (e.g., `/director/sessions`, `/director/level-up`).

### Coach routes (`/coach/**`)

| Route | Required role | Built? | Notes |
|---|---|---|---|
| `/coach` | `head_coach` OR `coach` | YES | Coach dashboard |
| `/coach/sessions` | `head_coach` OR `coach` | YES | Sessions list (filtered to this coach) |
| `/coach/sessions/[sessionId]` | `head_coach` OR `coach` | YES | Session workspace + wrap-up drawer |
| `/coach/players` | `head_coach` OR `coach` | YES | Players this coach works with |
| `/coach/recap` | `head_coach` OR `coach` | **NO** | Proposed Sprint 390 (shortcut to latest wrap-up) |

**DONNA in coach portal:** Not yet available. `DonnaAssistantButton` is gated to `academy_director`. Coach DONNA is a future sprint.

### Player routes (`/player/**`)

| Route | Required role | Built? | Notes |
|---|---|---|---|
| `/player` | `player` | YES | Player development dashboard |
| `/player/sessions` | `player` | YES | Player's upcoming sessions |
| `/player/idp` | `player` | YES | Individual development plan |

### Parent routes (`/parent/**`)

| Route | Required role | Built? | Notes |
|---|---|---|---|
| `/parent` | `parent` | YES | Parent portal home |
| `/parent/[playerId]` | `parent` | YES | Player-specific parent view |

**Parent data safety:** All parent-facing content passes through `sanitizeParentFacingText` and `parentSafeResponseRules` before rendering. Coach notes are NOT directly visible to parents — only director-approved, sanitized versions.

### Platform routes (`/platform/**`)

| Route | Required role | Built? | Notes |
|---|---|---|---|
| `/platform` | `platform_roles` row | YES (scaffolded) | Placeholder page. No real data. |
| `/platform/academies` | `platform_roles` row | **NO** | Proposed Sprint 392+ |
| `/platform/academies/[academyId]` | `platform_roles` row | **NO** | Proposed Sprint 392+ |

**Platform role check:** Middleware checks for a row in `platform_roles` table (separate from `profiles.role`). `platform_roles` is referenced in middleware but NOT yet in `database.types.ts` — requires a migration before `/platform` can be built out.

---

## Middleware Routing Logic

On unauthenticated request:
1. Check Supabase session cookie
2. If no session → redirect to `/login`

On authenticated request:
1. Read `profiles.role` for the user
2. Route based on role:
   - `academy_director` → permit `/director/**`
   - `head_coach` | `coach` → permit `/coach/**`
   - `player` → permit `/player/**`
   - `parent` → permit `/parent/**`
3. Check `platform_roles` for `/platform/**` access
4. Cross-role access: any `academy_director` user visiting `/coach/**` → redirect to `/director`

---

## DONNA Availability by Role

| Role | DONNA panel? | COO commands? | Voice input? | TTS output? |
|---|---|---|---|---|
| `academy_director` | YES | All 7 | YES | YES |
| `head_coach` | NO (future) | Planned subset | Planned | Planned |
| `coach` | NO (future) | Planned subset | Planned | Planned |
| `player` | NO | Not planned | Not planned | Not planned |
| `parent` | NO | Not planned | Not planned | Not planned |
| `platform_roles` | NO (future) | Not planned | Not planned | Not planned |

**Coach DONNA scope (when built):**
- Commands in scope: `capture_coach_note`, `handle_attendance_exception`, `draft_wrap_up`
- Commands NOT in scope for coach: `daily_brief`, `what_needs_attention`, `draft_parent_update`, `review_level_readiness`, `show_review_queue` (all require director context)

---

## Role-Based Data Isolation (RLS)

| Table | Director can read | Coach can read | Player can read | Parent can read |
|---|---|---|---|---|
| `sessions` | All for their academy | Own sessions only | Own sessions only | Child's sessions only |
| `players` | All for their academy | Own group's players | Own profile | Own child only |
| `proposed_actions` | All for their academy | None | None | None |
| `coach_notes` | All for their academy | Own notes only | None | None (parent-safe version via parent actions) |
| `templates` | All for their academy | Read-only | None | None |
| `audit_logs` | All for their academy | None | None | None |
| `platform_roles` | None | None | None | None |
| `profiles` | Own + managed coaches | Own | Own | Own |

All tables have RLS. No table exists without a policy. Service role bypass is never used in client-facing code.

---

## Authorization Checks for Protected Actions

| Action | Who can propose | Who can approve | Execution RPC |
|---|---|---|---|
| Level advancement | DONNA (director-initiated) | `academy_director` only | `finalize_player_placement()` |
| Session create | DONNA (director-initiated) | `academy_director` | `execute_approved_action()` |
| Parent update send | DONNA (director-initiated) | `academy_director` | `execute_approved_action()` → staged |
| Coach brief send | DONNA (director-initiated) | `academy_director` | `execute_approved_action()` → `coach_notes` |
| Attendance exception | DONNA (director or coach-initiated) | `academy_director` | `execute_approved_action()` |
| Template create | DONNA (director-initiated) | `academy_director` | `execute_approved_action()` |

---

*Last updated: Sprint 385*

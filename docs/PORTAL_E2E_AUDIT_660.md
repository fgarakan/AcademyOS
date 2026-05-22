# Portal End-to-End Re-Audit — Sprint 660

**Date:** 2026-05-22  
**Scope:** Director, Coach, Parent, Player portals — entry points, role guards, data scoping, known gaps

---

## 1. Director Portal (`/director`)

### Entry & Auth
- Middleware: `src/middleware.ts` — routes by role; `academy_director` or `head_coach` → `/director`
- Role guard on every sensitive page: checks `academy_memberships.role` with `academy_id` from profile
- Academy isolation: all queries include `.eq('academy_id', academyId)` from authenticated profile (never from URL params)

### Key Routes
| Route | Purpose | Role Guard |
|---|---|---|
| `/director/review` | Proposed actions queue | director / head_coach |
| `/director/review/[actionId]` | Review item detail + approval | director / head_coach |
| `/director/players/[playerId]` | Player profile | director / head_coach |
| `/director/sessions/[sessionId]` | Session detail | director / head_coach |

### Data Scoping
- `proposed_actions` always filtered by `academy_id`
- `audit_logs` always filtered by `academy_id`
- Player queries always include `.eq('academy_id', academyId)` + `.eq('is_active', true)`

### Known Gaps
- `review/[actionId]` uses `rawDb = supabase as any` for untyped table queries — consistent with pattern but bypasses type safety
- Badge/mission/video/knowledge apply paths not yet wired — documented in each review card

---

## 2. Coach Portal (`/coach`)

### Entry & Auth
- Role: `head_coach` or `coach` → `/coach`
- All queries scope by `academy_id` from authenticated profile
- `coach_observations` table: `is_private = true` means director-only; parent never sees raw notes

### Key Routes
| Route | Purpose |
|---|---|
| `/coach/sessions/[sessionId]` | Session detail + observation entry |
| `/coach/sessions/[sessionId]/execute` | On-court block execution |
| `/coach/sessions/[sessionId]/wrap-up` | Post-session wrap-up flow |
| `/coach/players/[playerId]` | Player detail (coach view) |

### Data Scoping
- Coach observes players via `player_id` + `academy_id` — never by parent-visible profile_id
- Wrap-up creates `proposed_actions` with `proposed_by_id = user.id`, `target_module = 'session_wrap_up_v1'`
- No coach can view another academy's data

### Bug Fixed (Sprint 651)
- `WrapUpPageClient`: `followup` answer was not passed to `saveWrapUpDraftAction` — fixed, now maps to `nextFocus`

### Known Gaps
- Coach has no profile settings page — no way to change display name or notification preferences
- `pendingWrapUpCount` query in `/coach/page.tsx` could fail silently — currently caught with try/catch

---

## 3. Parent Portal (`/parent`)

### Entry & Auth
- Role: `parent` or `guardian` → `/parent`
- Auth chain: `profiles.id` → `guardians.profile_id` → `player_guardians.guardian_id` → `players.id`
- Academy isolation: `guardians.academy_id` guards all queries

### Key Routes
| Route | Purpose |
|---|---|
| `/parent` | Home — child progress summary |
| `/parent/updates` | Director-approved communications |
| `/parent/progress` | Curriculum progress (parent-safe view) |
| `/parent/wins` | Positive milestones |

### Data Scoping
- `player_development_summary.show_to_parent = true` gates parent-visible summaries
- `coach_observations.is_private = true` — never exposed to parent
- `parentSupportGuide` — purely computed, no raw coaching data
- Lesson requests now scoped by `player_id` (Sprint 655 fix)

### Multi-Child Known Gap
- `player_guardians` has no `display_order` — ordering is positional (Sprint 617 audit)
- Lesson request cross-child leakage fixed (Sprint 655) but child-switcher UI still shows only one child
- `PrivateLessonRequestCard` now passes `playerId` — but if `activeChildId = null`, passes empty string

### Security Note
- Parent must be linked via guardian chain — no direct player URL param access
- All player queries include `.eq('academy_id', academyId)` + `.eq('is_active', true)`

---

## 4. Player Portal (`/player`)

### Entry & Auth
- Role: `player` → `/player`
- Auth chain: `profiles.id` → `players.profile_id` + `is_active = true`
- Academy isolation: all queries use `academy_id` from profile

### Key Routes
| Route | Purpose |
|---|---|
| `/player/missions` | Active priorities + mission map |
| `/player/level-up` | Curriculum requirements to advance |
| `/player/wins` | Celebration milestones |
| `/player/skill-path` | Skill pathway view |

### Data Scoping
- `player_priorities` filtered by `player_id` + `academy_id` + `is_active = true`
- `player_requirement_progress` — read-only for player; coach/director can write
- Player badge section is display-only — no self-claim path (by design)

### Known Gaps
- Badge table data not yet loaded on missions page — empty state shown (Sprint 656)
- No player profile edit page — name/photo changes go through director
- Mental performance missions exist in model (Sprint 657) but are coach-assigned, not self-selectable

---

## 5. Cross-Portal Security Summary

| Rule | Status |
|---|---|
| No academy data leaks between academies | Confirmed — `academy_id` on every query |
| Raw coach notes never visible to parents/players | Confirmed — `is_private` flag + no parent-facing note query |
| No level movement without director approval | Confirmed — `proposed_actions` pipeline |
| Parent/player content gated by approval flags | Confirmed — `show_to_parent`, `is_parent_visible` |
| Guardian → player link verified on lesson requests | Fixed Sprint 655 |
| All mutations write to `audit_logs` | Confirmed — `audit_logs` insert on every action execution |
| Role checked via `academy_memberships`, not URL | Confirmed — middleware + per-page guard |

---

## 6. Outstanding Items

| Item | Priority | Sprint |
|---|---|---|
| Child-switcher UI for multi-child parents | Medium | Future |
| Coach profile settings page | Low | Future |
| Badge/mission apply paths | Medium | Future |
| Video visibility apply path | Medium | Future |
| Knowledge promotion platform-owner gate UI | High (intentional hold) | Future |
| Parent lesson request: handle `playerId = ''` defensively | Medium | Sprint 661+ |

---

*Audit complete. No code changes in this sprint. Next: Sprint 661 Director Mobile Command Center Pass.*

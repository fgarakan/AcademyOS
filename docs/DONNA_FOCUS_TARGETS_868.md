# Sprint 868 — DONNA Focus Targets V1

**Date:** 2026-05-27
**Sprint:** 868
**Type:** Implementation — `data-donna-focus-id` DOM attributes across director and coach pages
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Adds `data-donna-focus-id` HTML attributes to stable container elements across 7 route pages
and components. These attributes enable `DonnaHighlightBanner` (Sprint 817) to find, scroll to,
and apply teal-glow CSS (`donna-focus-ring`) to specific page sections when DONNA executes a
navigate/highlight action.

**18 new focus target IDs added across 7 files.**

**Not in scope:**
- `donnaContextActions.ts` — not touched
- `donnaUIActionRegistry.ts` — not touched (action taxonomy unchanged)
- `donnaFocusTarget.ts` — not touched
- `DonnaHighlightBanner.tsx` — not touched
- Any DB queries, server actions, migrations, or schema changes
- Visual/layout changes — attributes only, zero CSS impact

---

## How the Focus System Works

1. DONNA calls `setDonnaFocusTarget({ route, targetId, label, ... })` → writes to `sessionStorage`
2. On route change, `DonnaHighlightBanner` reads sessionStorage, queries `[data-donna-focus-id="<targetId>"]`
3. If found: scrolls to it, adds `donna-focus-ring` CSS class, shows floating teal badge
4. Auto-dismisses after `expiresAt` (default 8 seconds); or manual × dismiss
5. If element not found (wrong step, conditional render): silently no-ops — no error or banner

---

## New Focus Target IDs

### Director Session Detail — `/director/sessions/[sessionId]`
**File:** `src/app/director/sessions/[sessionId]/page.tsx`

| ID | Element | Section |
|---|---|---|
| `session-group-assignment` | `<div>` | Group Assignment panel — group picker for session |
| `session-roster-intelligence` | `<div>` (conditional on `session.group_id`) | Class Roster Intelligence panel — player watch data |
| `session-blocks` | `<div className="space-y-4">` (non-empty branch) | Session Blocks list — only present when blocks exist |
| `session-roster-attendance` | `<div>` | Roster & Attendance read-only panel |

### Director Template Detail — `/director/class-templates/[templateId]`
**File:** `src/app/director/class-templates/[templateId]/ClassTemplateBuilderStepper.tsx`

| ID | Element | Section | Step visible |
|---|---|---|---|
| `template-stepper` | Main stepper outer `<div>` | Always-visible stepper wrapper | All steps |
| `template-level-picker` | `<div>` wrapper around Curriculum Level Card | Curriculum Level selector (Step 1) | Step 1 only |
| `template-blocks-section` | Step3BuildBlocks outer `<div>` | Build Blocks content area (Step 3) | Step 3 only |
| `template-generate-session` | `<div>` around GenerateSessionFromTemplateButton | Create Session from Template (Step 5) | Step 5 only |

**Note:** `template-level-picker`, `template-blocks-section`, and `template-generate-session` are
step-conditional — only present in the DOM when the user is on the corresponding step. DONNA
highlighting will silently no-op if the user is on a different step. `template-stepper` always works.

### Coach Session — `/coach/sessions/[sessionId]`
**File:** `src/app/coach/sessions/[sessionId]/page.tsx`

| ID | Element | Section |
|---|---|---|
| `coach-player-watch-list` | `<section>` (conditional on `watchListPlayers.length > 0`) | Players in This Session watch list |
| `coach-lesson-plan` | `<section>` (conditional on `session.template_id`) | Today's Plan — CoachSessionCurriculumPanel |
| `coach-run-session` | `<section>` | Run the Session — blocks, exercises, attendance |
| `coach-wrap-up-link` | `<section>` | After Session — wrap-up CTA and status card |

### Coach Wrap-Up — `/coach/sessions/[sessionId]/wrap-up`
**File:** `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx`

| ID | Element | Section | Phase |
|---|---|---|---|
| `wrapup-question-card` | Question card `<div>` | Active question + textarea | `questions` phase only |
| `wrapup-nav-actions` | Navigation bar `<div>` | Back / Skip / Submit for Review buttons | `questions` phase only |

**Note:** Both IDs are in the `questions` render phase only. The `saved` confirmation screen
is a terminal state and has no focus targets — intentional.

### Coach Players — `/coach/players`
**File:** `src/app/coach/players/CoachPlayersClient.tsx`

| ID | Element | Section |
|---|---|---|
| `coach-player-list` | Outer `<div className="space-y-6">` | Full coach players directory |

### Coach Hub — `/coach`
**File:** `src/app/coach/page.tsx`

| ID | Element | Section |
|---|---|---|
| `coach-today-sessions` | `<div>` wrapping TODAY section | Today's Sessions card |
| `coach-players-section` | `<div>` wrapping PLAYERS & NOTES section | My Players + Recent Notes cards |

### Director Sessions List — `/director/sessions`
**File:** `src/app/director/sessions/page.tsx`

| ID | Element | Section |
|---|---|---|
| `session-list` | `<div className="space-y-2">` | Sessions list — only present when sessions exist |

---

## Pre-868 vs Post-868 Focus Target Coverage

| Route | Pre-868 IDs | Post-868 IDs added |
|---|---|---|
| `/director` | 7 (Sprint 818) | — |
| `/director/class-templates` | 2 (Sprint 819) | — |
| `/director/class-templates/new` | 1 (Sprint 819) | — |
| `/director/class-templates/[templateId]` | 0 | 4 (`template-stepper`, `template-level-picker`, `template-blocks-section`, `template-generate-session`) |
| `/director/sessions` | 0 | 1 (`session-list`) |
| `/director/sessions/[sessionId]` | 0 | 4 (`session-group-assignment`, `session-roster-intelligence`, `session-blocks`, `session-roster-attendance`) |
| `/director/players` | 3 (Sprint 820) | — |
| `/director/players/[playerId]` | 5 (Sprints 820, 849) | — |
| `/director/review` | 1 (Sprint 836) | — |
| `/coach` | 0 | 2 (`coach-today-sessions`, `coach-players-section`) |
| `/coach/players` | 0 | 1 (`coach-player-list`) |
| `/coach/sessions/[sessionId]` | 0 | 4 (`coach-player-watch-list`, `coach-lesson-plan`, `coach-run-session`, `coach-wrap-up-link`) |
| `/coach/sessions/[sessionId]/wrap-up` | 0 | 2 (`wrapup-question-card`, `wrapup-nav-actions`) |

**Total system IDs:** 24 (pre-868) → 42 (post-868)

---

## Files Modified

| File | Change |
|---|---|
| `src/app/director/sessions/[sessionId]/page.tsx` | +4 `data-donna-focus-id` on section wrapper `<div>`s |
| `src/app/director/class-templates/[templateId]/ClassTemplateBuilderStepper.tsx` | +4 `data-donna-focus-id` — stepper, level-picker wrapper, Step3 outer, Step5 generate div |
| `src/app/coach/sessions/[sessionId]/page.tsx` | +4 `data-donna-focus-id` on `<section>` elements |
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | +2 `data-donna-focus-id` on question card and nav bar |
| `src/app/coach/players/CoachPlayersClient.tsx` | +1 `data-donna-focus-id` on outer `<div>` |
| `src/app/coach/page.tsx` | +2 `data-donna-focus-id` on TODAY and PLAYERS & NOTES section wrappers |
| `src/app/director/sessions/page.tsx` | +1 `data-donna-focus-id` on session list `<div>` |

## Files NOT Modified (scope boundary)

| File | Reason |
|---|---|
| `src/app/director/_actions/donnaContextActions.ts` | Not in scope |
| `src/lib/donna/donnaUIActionRegistry.ts` | Action taxonomy unchanged — wiring to new IDs is a future sprint |
| `src/lib/donna/donnaFocusTarget.ts` | Focus type unchanged |
| `src/components/donna/DonnaHighlightBanner.tsx` | No changes needed — already queries by attribute |
| `src/app/globals.css` | `donna-focus-ring` CSS already exists (Sprint 817) |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — HTML attributes only |
| No DB reads | ✅ — no queries added |
| No mutations | ✅ — read-only DOM annotations |
| No layout changes | ✅ — attributes have no visual effect without DONNA |
| No server action changes | ✅ — untouched |
| No RLS changes | ✅ — untouched |
| No new imports | ✅ — no new dependencies |
| No package installs | ✅ — none |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |
| Existing focus IDs preserved | ✅ — 24 pre-868 IDs unchanged |

---

## Known Limitations (post-868)

| Limitation | Impact | Resolution |
|---|---|---|
| Step-conditional template IDs | `template-level-picker`, `template-blocks-section`, `template-generate-session` only exist in DOM on their respective step | Future: DONNA could navigate to step first, then highlight — Sprint 900+ |
| `session-blocks` absent when no blocks | DONNA cannot highlight block section on empty session | Expected — no blocks means no section to show |
| `coach-lesson-plan` absent when no template | DONNA cannot highlight lesson plan if session has no template | Expected — no template means no curriculum panel |
| Attendance targets inside client component | `coach-run-session` wraps `CoachSessionExecutionClient` — finer targeting (e.g. individual attendance row) requires IDs inside that client component | Future sprint if needed |
| `donnaUIActionRegistry.ts` not wired to new IDs | Automated navigate actions not yet registered for new targets | Sprint 869+ — wiring navigate action entries |

---

## Sprint 869 Recommendation

**Sprint 869 — DONNA Navigate Action Registry V1**

- Register navigate actions in `donnaUIActionRegistry.ts` for new focus targets:
  - `navigate_to_session_blocks` → route + `session-blocks` targetId
  - `navigate_to_session_attendance` → route + `session-roster-attendance` targetId
  - `navigate_to_template_level` → route + `template-level-picker` targetId
  - `navigate_to_generate_session` → route + `template-generate-session` targetId
  - `navigate_to_coach_wrap_up` → route + `coach-wrap-up-link` targetId
- Update `fetchDonnaContext` suggested next steps to include navigate action IDs where relevant
- No DB changes required

Projected score improvement: 0.5–1.0 point for actionable navigate coverage.

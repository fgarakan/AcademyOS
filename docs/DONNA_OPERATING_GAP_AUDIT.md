# DONNA Operating Gap Audit — Sprint 397

Comprehensive gap audit across DONNA capabilities, UI polish, and backend/workflow execution.

**Sprint:** 397
**Date:** 2026-05-16
**Scope:** All screens built Sprints 386–396. Audit only — no code changes.

Cross-reference: `MODULE_MATURITY_MAP.md` for per-module ratings, `SCREEN_BACKEND_READINESS_MAP.md` for per-screen ratings, `HUMAN_DEMO_REVIEW_SPRINT_397.md` for manual review checklist.

---

## Gap Severity Scale

| Level | Label | Meaning |
|---|---|---|
| P0 | Blocking | Cannot run a real pilot. Breaks the operating model. |
| P1 | High | Would embarrass in a director demo. Must fix before showing. |
| P2 | Medium | Reduces trust or clarity. Fix before pilot, not necessarily before next demo. |
| P3 | Low | Polish. Noticeable but not blockers. |

---

## Section 1 — DONNA Capability Gaps

### 1.1 — Stub Task Contracts (4 of 15 remain unwired)

**Severity: P1**

Four task contracts return no draft card — DONNA appears to ignore the command silently.

| Stub task | Expected behavior | Current behavior |
|---|---|---|
| `summarize_player_progress` | Produces a structured progress summary for a player | Returns nothing; contract defined but server action is stub only |
| *(3 additional stubs not individually named in codebase docs)* | Draft card in proposed_actions pipeline | Silent no-op |

**Impact:** Director asks DONNA to do something and nothing happens. Breaks trust in the system.
**Source:** `MODULE_MATURITY_MAP.md` — DONNA module: "4 stubs only"
**Fix required:** Wire each stub to a real server action that produces a `proposed_action` draft.

---

### 1.2 — DONNA Has No Context on Coach Session Workspace

**Severity: P1**

`/coach/sessions/[sessionId]` has no entry in `donnaPageContextRegistry`. DONNA falls back to the generic `FALLBACK_CONTEXT` (`routePattern: '*'`).

**Impact:** Coach opens DONNA on their session workspace and gets a generic intro. No relevant commands suggested. Breaks the coach workflow.
**Source:** `SCREEN_BACKEND_READINESS_MAP.md` — Screen 4: "DONNA context registered: NO — blocks Level 8"
**Fix required:** Add registry entry for `/coach/sessions/[sessionId]` with coach-appropriate commands.

---

### 1.3 — DONNA Suggestion Chips Are Not Wired to Panel Open

**Severity: P2**

On `/director/today`, four DONNA suggestion chip buttons are rendered. Tapping them does not open the DONNA panel with a pre-filled prompt — they are static text only.

**Impact:** Director taps a chip expecting DONNA to respond; nothing happens. The chips feel decorative, not functional.
**Source:** `SCREEN_BACKEND_READINESS_MAP.md` — Screen 3: "DONNA suggestion chips wired to open panel with pre-filled prompt (future polish)"
**Fix required:** Wire each chip's `onClick` to `openDonnaPanel({ prefilledPrompt: '...' })` or equivalent.

---

### 1.4 — No Coach DONNA Panel

**Severity: P2 for current pilot scope; P0 for any coach-facing demo**

There is no DONNA panel component for coach routes. Coaches cannot access any AI assistance.

**Impact:** The coach workflow (session workspace, recap flow) is entirely manual. A coach pilot would feel like a downgrade from any existing tool.
**Source:** `MODULE_MATURITY_MAP.md`, `SCREEN_BACKEND_READINESS_MAP.md` — consistently noted as "separate sprint"
**Fix required:** Build a coach variant of the DONNA panel with coach-appropriate commands (session brief, note drafts, wrap-up assistance).

---

### 1.5 — No Real-Time Attention Signal Refresh

**Severity: P2**

`/api/donna/attention` is called at page load but does not refresh during the session. If a coach submits a wrap-up or an attendance exception is flagged, the attention items do not update until reload.

**Impact:** Director may miss newly created flags during a session. Attention items go stale.
**Source:** `MODULE_MATURITY_MAP.md` — Signals module: "AI-powered attention/brief still go through DONNA panel (not server-rendered)"
**Fix required:** Either a polling interval, a Supabase Realtime subscription on `proposed_actions`, or a manual refresh button.

---

### 1.6 — No `populate_session_from_template` CTA in Session Detail UI

**Severity: P2**

The `populate_session_from_template` server action is wired and functional, but is only accessible via the DONNA panel. There is no direct button or CTA on the session detail page.

**Impact:** A director who has not yet discovered the DONNA panel cannot populate a session from a template. The most common session setup action requires knowing to ask DONNA.
**Source:** `SCREEN_BACKEND_READINESS_MAP.md` — Screen 4: "`populate_session_from_template` CTA surfaced directly from session detail (currently via DONNA panel only)"
**Fix required:** Add a "Populate from Template" button on the session detail page that triggers the DONNA-mediated flow.

---

### 1.7 — No Director-Side Session Brief Route

**Severity: P3**

`/director/sessions/[sessionId]/brief` does not exist. The session detail page links to no brief view. Directors and coaches cannot view a pre-session coach brief from within the app.

**Impact:** The "prepare coaches" workflow is incomplete. DONNA can draft a coach brief but the director cannot view or navigate to it within the session detail screen.
**Source:** `MODULE_MATURITY_MAP.md` — Sessions module: "`/director/sessions/[sessionId]/brief` route: Level 0 — Plan only"
**Fix required:** Build the brief route as a read-only view, linked from session detail.

---

## Section 2 — UI Polish Gaps

### 2.1 — All Screens Show Empty States in Demo (Test DB Is Empty)

**Severity: P1 for live demos; P2 for prototype demos**

Every director screen — Today's Academy, Level Up, Parent Comms, Sessions list — shows only empty state components. No real data is visible. The empty states are graceful and not broken, but a demo that shows zero sessions, zero players, and zero communications does not build confidence.

**Impact:** A prospect watching the demo sees a well-designed but empty product. Hard to evaluate the real value proposition.
**Options:**
1. Seed the test DB with demo-safe placeholder data (sessions, a few players, template names)
2. Build a demo data mode that injects static fixture data without touching the DB
3. Accept empty states and coach the reviewer to narrate what would appear
**Note:** Option 1 is the most honest and reusable approach. Option 2 is safest for a live prototype.

---

### 2.2 — DONNA Suggestion Chips Have No Hover or Active State

**Severity: P2**

The suggestion chips rendered on `/director/today` and `/director/sessions/[sessionId]` have no visual feedback when tapped. They look like buttons but behave like static labels (currently not wired — see Gap 1.3).

**Fix required:** Add `hover:border-lime cursor-pointer` and an `onClick` handler. Can be done alongside Gap 1.3 fix.

---

### 2.3 — Demo Banner Color Contrast on Certain Browsers

**Severity: P3**

The demo banner uses `bg-lime/10 border-lime/30` which may render as nearly invisible on certain display profiles or projector setups (high ambient light, non-calibrated monitors).

**Fix required:** Increase demo banner contrast — consider `bg-lime text-base` for high-visibility mode, or at minimum `bg-lime/20 border-lime/50`.

---

### 2.4 — Level Up: No Direct "Review" CTA to DONNA Task

**Severity: P2**

The Level Up screen shows player readiness cards with a "View" CTA that navigates to the player profile. There is no "Review" button that opens DONNA pre-filled with `review_level_readiness` for that specific player.

**Impact:** The intended workflow (see risk card → ask DONNA to review → proposed_action → approval → finalize_player_placement) requires the director to navigate to the player profile, then manually open DONNA and type the request.
**Fix required:** Add a "Review with DONNA →" CTA on each player readiness card that opens the DONNA panel pre-filled with the task prompt and player context.

---

### 2.5 — Parent Comms: No Inline "Approve" Action on Update Cards

**Severity: P2**

The Parent Communications screen shows update cards with status badges but no inline approval action. A director must navigate to `/director/review` to approve a parent update.

**Impact:** The approval workflow is not surfaced where the content lives. Adds unnecessary navigation friction.
**Fix required:** Add an "Approve" button on update cards with `status === 'reviewed'` that triggers the proposed_actions pipeline inline.

---

### 2.6 — Mobile: Director Sidebar Not Collapsible

**Severity: P3**

The director sidebar is fixed at `w-60` with no collapse or drawer behavior on smaller viewports. On tablets or small laptops, the sidebar takes 25%+ of available width.

**Fix required:** Add a collapse toggle (hamburger) for viewports below `lg` breakpoint. The sidebar should collapse to an icon-only rail or off-canvas drawer.

---

### 2.7 — No Visual Differentiation Between "Real" and "Stub" DONNA Commands

**Severity: P2**

The DONNA panel shows all available commands in the command grid. Stub commands (those that return nothing) are visually identical to wired commands. A director can ask DONNA to summarize player progress and receive no response, with no indication of why.

**Fix required:** Either hide stub commands until wired, or show a "Coming soon" label on stub commands.

---

## Section 3 — Backend / Workflow Execution Gaps

### 3.1 — Coach Recap Has No Database Write

**Severity: P1**

`/coach/recap` completes a 6-question flow and builds structured draft sections client-side, but writes nothing to the database. The submit action shows a success state and the data is lost.

**Impact:** The coach session recap — a core operational artifact — is not persisted. No director can review it. No audit log entry is written.
**Source:** `src/app/coach/recap/page.tsx` — "no sessionId available in this standalone flow; a real implementation would need sessionId from the session context"
**Fix required:** Wire `buildDraftSections()` output to `saveWrapUpDraftAction` with a sessionId. This requires the recap page to receive a session ID (via URL param or context). This is the single most important missing execution wire for the coach workflow.

---

### 3.2 — No External Email or SMS Delivery

**Severity: P1 for production; P2 for demo**

Approved parent communications are staged in the `parent_updates` table but never delivered. The director approval pipeline works correctly, but the final step — sending the message to the parent — does not exist.

**Impact:** The parent communication center is a draft management UI. It cannot replace an actual parent communication tool until delivery is live.
**Source:** `MODULE_MATURITY_MAP.md` — Communications module: "External email/SMS delivery: Level 0 — NOT built"
**Fix required:** Integrate an email provider (Resend, SendGrid) or SMS provider (Twilio). Trigger on `status = 'approved'`. Must remain gated behind the existing proposed_actions approval (never auto-send).

---

### 3.3 — No Real-Time Review Queue Count in Header

**Severity: P2**

The review queue badge in the director header calls `getDonnaReviewQueueAction` at load time but does not poll or subscribe. If a coach submits a wrap-up during a session, the director's badge count does not update until page reload.

**Impact:** The director may not know there are pending approvals waiting.
**Fix required:** Subscribe to `proposed_actions` inserts via Supabase Realtime, or add a short polling interval (30s) on the badge count.

---

### 3.4 — Session Detail: No Real Data in Test DB

**Severity: P2**

`/director/sessions/[sessionId]` requires a valid session ID in the URL. With an empty test DB, this route cannot be demonstrated in a live session. The DONNA chips and context registered in Sprint 387 are correct but unverifiable live.

**Impact:** The session detail screen — the most operationally dense director screen — cannot be shown in a live demo.
**Fix required:** Seed at least 2-3 demo sessions in the test DB, with blocks and a template association, so the session detail screen renders real data.

---

### 3.5 — `platform_roles` Table Not Formalized

**Severity: P2 for platform build; P3 for academy pilot**

The Platform Portal (`/platform`) is scaffolded and middleware-gated, but `platform_roles` is not in `database.types.ts`. Any platform-level feature build is blocked until this migration lands.

**Impact:** Multi-academy work cannot begin until migration is applied and types are regenerated.
**Source:** `MODULE_MATURITY_MAP.md` — Platform module: "Level 2 — requires migration to formalize"
**Fix required:** Migration to define `platform_roles` table with RLS. Then `npx supabase gen types` to update `database.types.ts`. **This requires explicit Farshad approval before proceeding.**

---

### 3.6 — No RLS Verification on Coach Routes

**Severity: P0 for production; P2 for pilot**

Coach routes (`/coach/sessions`, `/coach/sessions/[sessionId]`) have not been QA'd to confirm a coach cannot see another coach's session data. The RLS policies exist on the sessions table, but the multi-coach isolation boundary has not been tested with two coach accounts.

**Impact:** A data leak between coaches would be a serious security issue in a multi-coach academy.
**Fix required:** Create a second QA coach account. Verify that coach A cannot read or modify coach B's sessions.

---

### 3.7 — No Timezone Handling for Academy-Local Date

**Severity: P2**

`getTodayString()` in `/director/today/page.tsx` uses `new Date().toISOString().split('T')[0]` which is UTC. A director in UTC+2 at 11pm will see the next day's sessions (which may be empty) instead of the current evening's sessions.

**Impact:** Affects directors in non-UTC timezones. The "Today's Academy" screen would show the wrong day late at night.
**Fix required:** Store and use academy timezone in the `academies` table. Apply timezone offset when computing `scheduled_date = today`.

---

### 3.8 — No Audit Log for Demo Mode Interactions

**Severity: P3**

When a director walks the demo tour, no audit log entry is written. This is fine for a prototype, but when demo mode is later used with real academies for onboarding, the absence of audit logging means demo-driven actions are untracked.

**Fix required:** Decide whether demo mode interactions should be audit-logged. If demo mode will ever be used in a real academy context, add a `demo_session_start` audit event.

---

## Summary Table

| Gap | Area | Severity | Sprint estimate |
|---|---|---|---|
| 1.1 — 4 stub task contracts | DONNA | P1 | Sprint 398–400 (one per sprint) |
| 1.2 — No coach session DONNA context | DONNA | P1 | Sprint 398 |
| 1.3 — Chips not wired to panel | DONNA | P2 | Sprint 400 |
| 1.4 — No coach DONNA panel | DONNA | P2 (P0 for coach demo) | Sprint 401+ |
| 1.5 — No attention signal refresh | DONNA | P2 | Sprint 402 |
| 1.6 — No populate-from-template CTA | DONNA | P2 | Sprint 399 |
| 1.7 — No session brief route | DONNA | P3 | Sprint 403+ |
| 2.1 — Empty states in demo | UI | P1 | Sprint 398 (seed data) |
| 2.2 — Chips no hover state | UI | P2 | Sprint 400 |
| 2.3 — Demo banner contrast | UI | P3 | Sprint 401 |
| 2.4 — Level up no direct review CTA | UI | P2 | Sprint 400 |
| 2.5 — Parent comms no inline approve | UI | P2 | Sprint 400 |
| 2.6 — Mobile sidebar not collapsible | UI | P3 | Sprint 403 |
| 2.7 — Stub commands not differentiated | UI | P2 | Sprint 398 |
| 3.1 — Coach recap no DB write | Backend | P1 | Sprint 399 |
| 3.2 — No external delivery | Backend | P1 (prod) / P2 (demo) | Sprint 404+ |
| 3.3 — Review queue count not real-time | Backend | P2 | Sprint 402 |
| 3.4 — No demo session data | Backend | P2 | Sprint 398 |
| 3.5 — platform_roles not formalized | Backend | P2 | Sprint 405+ (requires approval) |
| 3.6 — No RLS verification coach routes | Backend | P0 (prod) / P2 (pilot) | Sprint 399 |
| 3.7 — No timezone handling | Backend | P2 | Sprint 401 |
| 3.8 — Demo mode no audit log | Backend | P3 | Sprint 404 |

---

*Sprint 397 — Audit only. No code changes.*

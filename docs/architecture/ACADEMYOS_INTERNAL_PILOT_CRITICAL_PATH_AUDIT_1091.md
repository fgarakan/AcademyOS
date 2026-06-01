# Sprint 1091 — AcademyOS Internal Pilot Critical Path Audit V1

**Date:** 2026-06-01
**Sprint:** 1091

---

## Executive Summary

AcademyOS V1 infrastructure is production-ready. All core routes exist, render real data, and are backed by functional server actions. The pilot is viable now with two critical gaps that must be fixed before Brian Dabul can experience the full value loop.

**Overall pilot readiness: ~85%**

| Dimension | Status |
|---|---|
| Director dashboard + approvals | ✅ READY |
| Coach session + wrap-up flow | ✅ READY |
| Player/Parent portals | ✅ READY |
| Template + session creation | ✅ READY |
| Fitness builder | ✅ READY |
| Wrap-up → player observations | ❌ BLOCKED |
| Parent update draft from player profile | ⚠️ CONDITIONAL |
| New director orientation | ⚠️ CONDITIONAL |
| Curriculum visual loop | ⚠️ CONDITIONAL |
| Alpha Sandbox env setup | ⚠️ CONDITIONAL |

---

## V1 Critical Pilot Loop Status

### Loop 1 — Director opens Today and understands what matters
**Status: ⚠️ CONDITIONAL**

- Route `/director` exists and renders real data: `getPlayerSummaries`, attention queue, KPI cards, pending review count.
- `DirectorPrimaryActionHero` surfaces the top-priority action with a lime CTA.
- **Gap:** No narrative "what to do next" prompt or DONNA chip for a first-visit director. Brian lands on the page, sees numbers, but no natural language guidance on where to start.
- **Blocker path:** None — the hero card shows the pending count. Low-touch fix needed.

### Loop 2 — Director creates class/session from template
**Status: ✅ READY**

- Class template builder (`/director/class-templates/[templateId]`) has 5-step stepper: Class Goal → Level → Session Flow → Coach Notes → Publish.
- `generateSessionFromTemplateAction` atomically creates session + blocks + exercises (RLS-enforced, academy-scoped).
- Fitness template builder (`/director/fitness/templates/[templateId]`) has equivalent flow.
- Session generation button is visible on template detail pages.

### Loop 3 — Director assigns coach/group/roster
**Status: ✅ READY**

- Session creation accepts coach_id, group_id from director selection.
- Coach is linked at generation time; roster is derived from group membership.
- Director can see session assignments in `/director/sessions`.

### Loop 4 — Coach sees assigned session
**Status: ✅ READY**

- Coach portal (`/coach`) shows today's sessions via `getCoachWorkspaceSummary`.
- `BottomTabBar` mobile nav, `max-w-2xl` layout — mobile-ready.
- Coach can navigate to session detail with one tap.

### Loop 5 — Coach executes session and submits wrap-up
**Status: ✅ READY**

- `/coach/sessions/[sessionId]` shows full session plan, curriculum context, block execution state.
- Wrap-up link (`/coach/sessions/[sessionId]/wrap-up`) is visible on session detail page.
- DONNA chip on session page for new coaches guides to wrap-up.
- Wrap-up creates a `proposed_action` draft — goes to director review queue automatically.

### Loop 6 — Wrap-up creates structured session actuals/observations
**Status: ❌ BLOCKED — Critical for pilot**

- `applyWrapUpDraftAction` writes to `sessions.session_notes` (text only) and advances `sessions.status` to `completed`.
- **Block observations do NOT persist to `player_observations` or any indexed table.**
- Standout players, block completion status (completed/modified/skipped), attention flags — all concatenated into `session_notes` as plain text.
- **Impact:** Director reviews player profile after 3 sessions — no structured coach observations visible. Director cannot cite specific coaching feedback in parent meetings. DONNA cannot recommend next focus from this data.
- **Fix:** Extend `applyWrapUpDraftAction` to parse structured draft fields and write rows to `player_observations` (or equivalent) for each flagged player. A separate migration adding `status` to `session_blocks` may also be needed.

### Loop 7 — Player profile receives update/review item
**Status: ⚠️ CONDITIONAL**

- Player profile (`/director/players/[playerId]`) has a Notes tab with `data-donna-focus-id="player-notes-tab"`.
- Player notes (manually entered) show here.
- **Gap:** Wrap-up observations (from Loop 6) don't appear because they aren't persisted structurally. Until Loop 6 is fixed, the only source of per-player notes is manual director entry.

### Loop 8 — Director approves/rejects update
**Status: ✅ READY**

- Review queue at `/director/review` shows all `proposed_actions` pending review.
- Approve, Reject, Clarification Needed, and Apply buttons all wired.
- Status transitions: `pending_review → approved → executed` via `updateWrapUpDraftDecisionAction` and `applyWrapUpDraftAction`.

### Loop 9 — Parent-safe progress draft is generated
**Status: ⚠️ CONDITIONAL**

- `PlayerParentSafeSummaryPreview` exists on player profile — shows a read-only preview of what a parent-safe update would look like.
- **Gap:** No "Draft parent update" button directly on the player profile page. Director must navigate to DONNA panel or `/director/parents` to initiate drafting.
- DONNA `draft_parent_update` action is in the action registry (Sprint 1076) and the dispatcher handles "draft a parent update" phrases.
- **Pilot friction:** Director on player profile who wants to send parent update must know to use DONNA or navigate away. Not intuitive for a first-time user.

### Loop 10 — Curriculum connects to template/session/player progress
**Status: ⚠️ CONDITIONAL**

- `ClassTemplateCurriculumSelector` correctly saves curriculum level to template.
- Template level propagates to generated sessions.
- **Gap:** Coach session view (`/coach/sessions/[sessionId]`) does not visually display the curriculum level/pathway name in a prominent way. The data is there, but coach may not notice.
- Curriculum gap analysis exists in DONNA context but is not surfaced as a CTA on curriculum page.

### Loop 11 — Fitness builder suggests correct age/category exercises
**Status: ✅ READY**

- 83 exercises confirmed in DB for demo academy.
- Load check (Sprint 1068) flags age-inappropriate exercises (Red/Orange Ball).
- DONNA "make this more game-based" guidance available via action registry (Sprint 1077).

### Loop 12 — DONNA helps navigate/explain pages
**Status: ✅ READY**

- Context packs for 8 director pages (Sprint 1072/1073).
- Action registry for 18 common commands (Sprint 1076/1077).
- Navigation dispatch (Sprint 1071) handles "open approvals", "academy health", etc.
- Deep Mode gate prevents accidental expensive queries (Sprint 1086).

### Loop 13 — Brian Alpha Sandbox can be tested
**Status: ⚠️ CONDITIONAL**

- Sandbox gate is built, default OFF, env-var controlled (Sprint 1090).
- **Gap:** `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS` is documented in architecture docs but NOT in a `.env.example` file. Farshad must find the env var in docs to enable it for Brian.
- **Fix:** Add env var entries to `.env.local.example` or equivalent setup doc.

### Loop 14 — Token/retrieval/deep-mode safety
**Status: ✅ READY**

- Token logging (Sprint 1080), tool filtering (Sprint 1081), academy context cache (Sprint 1082), history filter (Sprint 1083), retrieval budget caps (Sprint 1089) all in place.

---

## Critical Blockers (must fix before pilot)

### Blocker 1 — Wrap-up observations don't persist to player record
**Severity: Critical**  
**Files:** `src/app/director/review/applyWrapUpDraftAction.ts`  
**What's missing:** Structured observation writes to `player_observations` or equivalent indexed table from approved/applied wrap-up drafts.  
**Fix in:** Sprint 1092

### Blocker 2 — Parent update draft CTA missing from player profile
**Severity: High (UX friction, not total block)**  
**Files:** `src/app/director/players/[playerId]/page.tsx`  
**What's missing:** A visible "Draft parent update" button or DONNA chip on the player profile that initiates the draft flow directly.  
**Fix in:** Sprint 1095

---

## What Should NOT Be Built Before Pilot

- Reports/Analytics screen (`/director/reports` — not built, should stay that way)
- Billing / subscription UI (platform-owner concern, not pilot)
- Multi-academy platform owner command center (future)
- Automated parent email sending (approval-gated by design — do not change)
- AI-powered assessment scoring (no training data yet)
- Video upload / evidence media (out of scope for V1)
- Competitor analysis / UTR integration (V2+)
- Mobile app / PWA packaging (browser-first is fine for pilot)

---

## Recommended Sprint Sequence (1092–1101)

| Sprint | Goal | Priority |
|---|---|---|
| **1092** | Apply Wrap-Up: Persist Player Observations V1 | P0 — pilot blocker |
| **1093** | Player Profile: Observations Tab/Surface V1 | P0 — depends on 1092 |
| **1094** | Director Today: New Director Orientation Card V1 | P1 — first-visit UX |
| **1095** | Player Profile: Draft Parent Update CTA V1 | P1 — closes parent communication loop |
| **1096** | Session View: Curriculum Context Display V1 | P2 — coach clarity |
| **1097** | Alpha Sandbox: `.env.local.example` + Setup Guide V1 | P2 — Brian enablement |
| **1098** | Migration 056 + 058 Application Verification V1 | P2 — Supabase live DB check |
| **1099** | Pilot Onboarding Checklist + First-Run Guide V1 | P2 — director orientation |
| **1100** | DONNA Today Page Guidance Chips V1 | P3 — DONNA orientation |
| **1101** | Final V1 Pilot E2E QA Run V1 | P3 — go/no-go checklist |

---

## Files Audited

- `src/app/director/page.tsx`
- `src/app/director/review/page.tsx` + `applyWrapUpDraftAction.ts`
- `src/app/director/sessions/page.tsx`
- `src/app/director/players/page.tsx` + `[playerId]/page.tsx` + `_components/PlayerProfileTabs.tsx`
- `src/app/director/class-templates/[templateId]/page.tsx` + `ClassTemplateCurriculumSelector.tsx`
- `src/app/director/fitness/templates/[templateId]/page.tsx`
- `src/app/coach/page.tsx` + `layout.tsx`
- `src/app/coach/sessions/[sessionId]/page.tsx` + `wrap-up/page.tsx`
- `src/app/player/page.tsx`
- `src/app/parent/page.tsx`
- `src/app/director/_components/DirectorTodayCommandCenter.tsx`
- `src/components/nav/SidebarNav.tsx`

# Next Sprint Recommendation — Sprint 397

Recommended Sprint 398–406 sequence and strategic recommendation.

**Sprint:** 397
**Date:** 2026-05-16

Cross-reference: `DONNA_OPERATING_GAP_AUDIT.md` for gap details, `SCREEN_BACKEND_READINESS_MAP.md` for screen ratings.

---

## Strategic Recommendation

### UI Polish First — Then Workflow Execution

**Recommendation: UI Polish next (Sprint 398–401), then Workflow Execution (Sprint 402+).**

Rationale:

1. **The demo is empty.** Every screen shows empty states. Before any workflow execution work has value, there must be visible data to work with. The highest-leverage action for the next sprint is seeding demo data so that the screens feel alive. This is foundational — workflow execution work is invisible without it.

2. **The P1 UI gaps are faster to close than P1 backend gaps.** Wiring the 4 stub DONNA task contracts and the coach recap DB write requires careful implementation. Seeding demo data, hiding stub commands, and fixing chip interactivity are significantly lower risk and can be done in 1–2 sprints.

3. **A credible demo must come before a real workflow.** The purpose of the current build phase is to reach pilot-readiness. A pilot requires a director to experience the product and say "this is the system I want to use." That experience is impossible without visible data. Workflow execution (external delivery, real-time subscriptions, timezone handling) matters only after a director has seen a session that feels real.

4. **Coach workflow execution (Gap 3.1 — recap DB write) is the one exception.** This should be prioritized early in the execution phase because it closes the one open loop in the core coach-director operating cycle: coach recaps → director review → DONNA approval → audit log. This is not polish — it is the operating model in practice.

---

## Decision Rule

**When to switch from UI Polish to Workflow Execution:**

Switch when:
- Demo data is seeded and all director screens show real-looking sessions, players, and communications
- Stub DONNA commands are either wired or clearly labeled "coming soon"
- The guided demo (5-step banner) flows end-to-end without a blank screen

Do not start external delivery (email/SMS) until all director screens are working with real data. External delivery introduces irreversible actions — it must only be built on top of a tested approval pipeline.

---

## Sprint 398–406 Recommended Sequence

### Sprint 398 — Demo Data Seed + DONNA Stub Visibility

**Type:** Backend data seed + UI micro-fix
**Goal:** Get the demo out of "all empty states" without writing new screens.
**Migration required:** No (data insert only via SQL seed, not schema change)

**Tasks:**
1. Seed the test DB with demo-safe data:
   - 3 sessions for today (one active, one completed, one missing blocks)
   - 3 players in the `v_reassessment_pipeline` view (one urgent, one medium, one low)
   - 2 parent_updates (one draft, one approved)
   - 1 coach (linked to sessions)
2. Visually differentiate stub DONNA commands from wired commands (label or hide)
3. Add "Coming soon" indicator to the 4 stub task contracts in the DONNA panel command grid

**Files likely touched:**
- SQL seed script (run manually, not committed as a migration)
- `src/components/assistant/DonnaAssistantButton.tsx` — stub command visibility

**QA:** Verify all 5 demo screens show real-looking data after seed. DONNA panel shows no silent failures on stub commands.

---

### Sprint 399 — Coach Recap → Proposed Actions Wire

**Type:** Backend execution
**Goal:** Close the open loop in the coach-director operating cycle.
**Migration required:** No (uses existing `proposed_actions` table)

**Tasks:**
1. Update `/coach/recap` to accept a `sessionId` URL param
2. Wire `buildDraftSections()` output to `saveWrapUpDraftAction` with sessionId
3. On "Submit for Review", create a `proposed_action` of type `coach_recap_review`
4. Update director review queue to show and handle `coach_recap_review` action type
5. Add `donnaPageContextRegistry` entry for `/coach/sessions/[sessionId]`

**Files likely touched:**
- `src/app/coach/recap/page.tsx`
- `src/app/director/review/page.tsx` (or review queue handler)
- `src/components/assistant/donnaPageContextRegistry.ts`
- Server action for wrap-up draft (existing or new)

**QA:** Coach submits a recap → proposed_action appears in director review queue → director approves → audit log entry written.

**Note:** This sprint requires careful RLS check — coach must only see sessions they are assigned to.

---

### Sprint 400 — DONNA Quick Actions + UI Interactivity Pass

**Type:** UI + DONNA wiring
**Goal:** Make the suggestion chips functional. Fix the P2 UI gaps across director screens.
**Migration required:** No

**Tasks:**
1. Wire suggestion chips on `/director/today` to open DONNA panel with pre-filled prompt
2. Wire suggestion chips on `/director/sessions/[sessionId]` similarly
3. Add "Review with DONNA →" CTA on Level Up player readiness cards
4. Add inline "Approve" button on Parent Comms update cards (`status === 'reviewed'`)
5. Add hover/active state to all suggestion chips

**Files likely touched:**
- `src/app/director/today/page.tsx`
- `src/app/director/sessions/[sessionId]/page.tsx`
- `src/app/director/level-up/page.tsx`
- `src/app/director/parents/page.tsx`

**QA:** Tapping any chip opens DONNA panel with the correct pre-filled prompt. Level Up CTA opens DONNA for the correct player. Approve button creates a proposed_action.

---

### Sprint 401 — Timezone Handling + Demo Banner Polish

**Type:** Backend correctness + UI polish
**Goal:** Fix the UTC date edge case and improve demo banner visibility.
**Migration required:** No (unless academy timezone column does not yet exist)

**Tasks:**
1. Verify whether `academies` table has a `timezone` column. If yes, use it in `getTodayString()`. If no, add it (migration required — stop and ask Farshad).
2. Update `/director/today/page.tsx` `getTodayString()` to use academy timezone if available, with UTC fallback
3. Increase demo banner contrast: `bg-lime/20 border-lime/50` minimum; evaluate `bg-lime text-base` option
4. Add mobile sidebar collapse toggle for viewports below `lg`

**Files likely touched:**
- `src/app/director/today/page.tsx`
- `src/components/demo/DemoModeBanner.tsx`
- `src/app/director/layout.tsx` (sidebar collapse)

**QA:** Director in UTC+3 at 11pm sees today's sessions, not tomorrow's. Demo banner is legible on a projector screenshot.

---

### Sprint 402 — Real-Time Review Queue + Attention Refresh

**Type:** Backend / Realtime
**Goal:** Review queue badge count updates without page reload.
**Migration required:** No

**Tasks:**
1. Subscribe to `proposed_actions` inserts via Supabase Realtime in the director header badge component
2. On new `proposed_action` insert, increment badge count in real-time
3. Add a manual "Refresh" button or 30s polling fallback on `/director/today` attention items
4. Confirm Realtime is enabled on `proposed_actions` table in Supabase project settings

**Files likely touched:**
- Director header/layout (badge component)
- `src/app/director/today/page.tsx` (attention refresh)

**QA:** Simulate a coach submitting a wrap-up from a second browser tab. Director badge count increments without reload.

---

### Sprint 403 — Session Brief Route + `populate_session_from_template` CTA

**Type:** New route + UI surfacing
**Goal:** Complete the session detail workflow.
**Migration required:** No

**Tasks:**
1. Build `/director/sessions/[sessionId]/brief` — read-only view of coach brief draft
2. Add "View Brief" CTA on session detail page linking to brief route
3. Add "Populate from Template" button on session detail page that opens the DONNA-mediated `populate_session_from_template` flow
4. Register `/director/sessions/[sessionId]/brief` in `donnaPageContextRegistry`

**Files likely touched:**
- New: `src/app/director/sessions/[sessionId]/brief/page.tsx`
- `src/app/director/sessions/[sessionId]/page.tsx`
- `src/components/assistant/donnaPageContextRegistry.ts`

**QA:** Session detail page shows both CTAs. Brief route renders draft content if a coach brief has been generated. Populate from template flow produces a proposed_action.

---

### Sprint 404 — Coach DONNA Panel V1

**Type:** New component (significant)
**Goal:** Coach routes get a DONNA panel with coach-appropriate commands.
**Migration required:** No

**Tasks:**
1. Design coach DONNA command set: session_brief, draft_coach_note, wrap_up_session, flag_player_attention
2. Build `CoachDonnaPanel` component (can reuse `DonnaPanelShell` patterns)
3. Wire coach commands through the same proposed_actions pipeline
4. Register DONNA context for all coach routes

**Files likely touched:**
- New: `src/components/assistant/CoachDonnaPanel.tsx` (or extend DonnaAssistantButton with role-aware mode)
- `src/components/assistant/donnaPageContextRegistry.ts`
- `src/app/coach/sessions/[sessionId]/page.tsx`
- `src/app/coach/recap/page.tsx`

**QA:** Coach opens session workspace → DONNA panel opens with coach intro → coach can ask DONNA to draft a session note → draft appears in proposed_actions → director can review and approve.

---

### Sprint 405 — RLS Verification + Security Pass

**Type:** QA / Security
**Goal:** Verify multi-coach data isolation before any real-data pilot.
**Migration required:** Possibly (if RLS policy gaps are found)

**Tasks:**
1. Create a second QA coach account (`qa-test-coach-2@academyos.test`)
2. Verify coach A cannot read coach B's sessions via direct Supabase query
3. Verify coach A cannot read coach B's session_blocks
4. Verify coach A cannot submit a wrap-up for coach B's session
5. Document findings; apply any RLS patches needed
6. Run full regression QA after any policy changes

**QA:** All RLS assertions pass with two coach accounts. No cross-coach data leak.

---

### Sprint 406 — External Email Delivery V1 (Gate: Sprints 399–405 complete)

**Type:** Backend integration (high consequence)
**Goal:** Approved parent communications are actually delivered.
**Migration required:** Likely (delivery log table or status field extension)
**External dependency:** Email provider account (Resend recommended)

**STOP condition:** Do not start Sprint 406 until:
- The `parent_updates` approval pipeline has been fully QA'd with real data
- Sprint 405 RLS verification is complete
- Farshad has explicitly approved the email integration sprint
- The "Send" step in the workflow banner is visually activated (remove `opacity-50` after delivery is live)

**Tasks:**
1. Integrate email provider (Resend or SendGrid) via Edge Function or server action
2. Trigger send on `proposed_action` approval for `draft_parent_update` type
3. Write delivery result to `audit_logs`
4. Update `parent_updates.status` to `'sent'`
5. Show delivery confirmation in the Parent Comms screen

---

## Sprint Order Summary

| Sprint | Focus | Type | P-level gaps closed | Migration? |
|---|---|---|---|---|
| 398 | Demo data seed + DONNA stub visibility | Data + UI micro-fix | P1: 2.1, 2.7 | No |
| 399 | Coach recap → proposed_actions wire | Backend execution | P1: 3.1, P2: 1.2 | No |
| 400 | DONNA chips + UI interactivity pass | UI + DONNA wiring | P2: 1.3, 2.2, 2.4, 2.5 | No |
| 401 | Timezone + demo banner polish | Backend correctness + UI | P2: 3.7, P3: 2.3, 2.6 | Maybe |
| 402 | Real-time review queue + attention refresh | Realtime | P2: 3.3, 1.5 | No |
| 403 | Session brief route + populate CTA | New route + UI | P2: 1.6, P3: 1.7 | No |
| 404 | Coach DONNA panel V1 | New component | P2: 1.4 | No |
| 405 | RLS verification + security pass | QA / Security | P0: 3.6 | Maybe |
| 406 | External email delivery V1 | Backend integration | P1 (prod): 3.2 | Yes |

---

## What Must Not Be Built Yet

These items are out of scope until specific gates are cleared:

| Item | Reason not to build yet | Gate to clear |
|---|---|---|
| `platform_roles` migration + multi-academy portal | Requires Farshad approval; no pilot need yet | Farshad approval + Sprint 405 complete |
| Bulk attendance write | Intentionally deferred — each exception is a separate proposed_action | Architecture decision needed |
| SMS delivery | Higher consequence than email; no immediate pilot need | Sprint 406 email delivery stable |
| Player creation UI | Red line — `finalize_player_placement()` only | Onboarding flow design needed |
| Automated level movement | Red line — no auto-execution without director approval | Will never be auto; needs DONNA contract wiring only |

---

*Sprint 397 — Audit only. No code changes.*

# AcademyOS V1 Workflow Audit
**Sprint 658 — 2026-05-17**

---

## Audit Scope

This document covers the major V1 workflows, their current state, friction points, and recommended fixes for the subsequent polish block (Sprints 659–680).

---

## 1. Director Dashboard (`/director`)

**Status:** Built and functional.

**What works:**
- Priority queue from live DB data.
- Academy KPI cards.
- Reassessment pipeline list.
- Setup progress checklist.
- Academy Health badge with breakdown drawer.
- DONNA side panel (persistent).
- OnboardingProgressCard.

**Friction / broken paths:**
- No clear "What should I do first?" hierarchy — multiple items compete for attention.
- Academy Health badge is not linked to specific fix actions.
- No quick way to navigate to "Today" from the main dashboard.
- DONNA executive card on dashboard not always visible without scrolling.

**Recommended sprint:** 659 — Director Dashboard Flow Cleanup.

---

## 2. Today's Academy (`/director/today`)

**Status:** Built. Uses live data + demo data fallback.

**What works:**
- Session list for today.
- Demo command brief.
- Player attention risk list.
- DONNA suggestion chip.
- TodayCommandBrief panel.

**Friction / broken paths:**
- Demo data labeled `DEMO_SESSIONS` is mixed with live data presentation.
- No clear "what's incomplete today" summary.
- Wrap-up status from sessions not surfaced here.
- No back-to-dashboard breadcrumb.

**Recommended sprint:** 660 — Today's Academy Integration Polish.

---

## 3. Director Review Queue (`/director/review`)

**Status:** Built. Multiple draft types. Decision controls present.

**What works:**
- 8+ draft types rendered with separate card components.
- Wrap-up coverage panel.
- Captures batch panel.
- Voice intake batch panel.
- Basic approval/reject/clarification flow.

**Friction / broken paths:**
- Draft source (which coach/session submitted) not always visible.
- Status labels inconsistent (pending_review, approved, executed, clarification_needed).
- No "everything reviewed" empty state.
- Wrap-up observations and session wrap-up appear as separate tabs.
- Long page with no filtering.

**Recommended sprint:** 662 — Review Queue Source and Status Polish.

---

## 4. Coach Wrap-Up Flow

**Status:** Built across multiple sprints. Coach submits wrap-up via CoachWrapUpDetailPanel.

**What works:**
- `CoachWrapUpDetailPanel` — multi-field form with attendance, observations, notes.
- `CoachWrapUpStatusCard` — shows pending/approved/applied status.
- `CoachSessionActions` — session-level action surface.
- DONNA chip on sessions page and session detail.
- Wrap-up status badge on session list.

**Friction / broken paths:**
- After submission, coach sees "pending review" but no clear next action.
- Director review of submitted wrap-up: status visible but observation cards lack context.
- "WRAP-UPS NEEDED" section on `/coach/sessions` is visible but requires coach to scroll to find it.

**Recommended sprint:** 661 — Coach Wrap-Up to Review Queue Polish.

---

## 5. DONNA Side Panel

**Status:** Built and functional for director and coach.

**What works (director):**
- Daily brief, attention engine, predictive suggestions.
- Review queue count badge + inline queue review.
- Tab chips: Review Today, Prepare Coaches, Player Progress, Parent Updates, Ask Anything.
- Full task system: capture note, draft parent update, level readiness, curriculum adjust, etc.
- Role-aware onboarding flow.

**What works (coach):**
- Role-aware greeting (post Sprint 647–651).
- Tab chips: My Sessions, Player Notes, Ask Anything (post Sprint 656).
- Quick actions on non-session pages (post Sprint 655).
- Wrap-up priority CTA on session detail pages (post Sprint 654).
- DONNA chip on sessions page + detail (post Sprint 652–653).
- Director-only task blocking with safe copy (post Sprint 656).
- Review queue fetch/badge gated (post Sprint 657).

**Friction / broken paths:**
- Voice greeting still shows onboarding flow (step 0) even when onboarding complete — relies on sessionStorage key that must be set.
- Review queue badge does not distinguish "needs your action" from "informational."
- "Ask Anything" tab chip does not scroll to input field reliably on all browsers.
- Coach DONNA panel shows "Guide me" and "Explain this screen" modes — useful but not coach-action-first.

**Recommended sprint:** 682 — DONNA Side Panel Premium Polish.

---

## 6. Academy Health (`/_components/AcademyHealthBreakdown`)

**Status:** Built. Drawer with score breakdown.

**What works:**
- Score rendered as colored badge.
- Breakdown drawer with contributing factors.
- Accessible via director dashboard.

**Friction / broken paths:**
- Recommendations not linked to specific fix pages.
- Score computation not always clear (what data contributed?).

**Recommended sprint:** 664 — Academy Health Action Link Polish.

---

## 7. Player Profiles (`/director/players/[playerId]`)

**Status:** Built. Multi-tab layout with curriculum, observations, advancement.

**What works:**
- Player card with status/curriculum level.
- Tab layout: Overview, Development, Curriculum, Notes, Advancement.
- DONNA context-aware (player page surfaced to DONNA context).

**Friction / broken paths:**
- Recent observations not always visible without navigating to Notes tab.
- "Next best action" for the player not surfaced on the overview tab.
- COO-level priority/risk not visible without drilling into tabs.

**Recommended sprint:** 663 — Player Profile COO Context Polish.

---

## 8. Coach Sessions (`/coach/sessions` + `/coach/sessions/[sessionId]`)

**Status:** Built and functional.

**What works:**
- Session list with today/upcoming/completed sections.
- Wrap-ups needed section.
- Session detail: blocks, exercises, attendance, recap, wrap-up.
- DONNA open chip on wrap-up needed rows and session detail.
- Wrap-up status card and detail panel.

**Friction / broken paths:**
- After completing a session, coach must scroll past "Run the Session" blocks to reach wrap-up.
- Attendance marking UX requires individual taps per player with no bulk action.
- "Or, add a quick internal note" label positions the quick note as secondary/optional.

**Recommended sprint:** 688 — Coach Session Detail Premium Polish.

---

## 9. Navigation and Cross-Module Flows

**Friction:**
- Director has no "back to today" shortcut from any sub-route.
- Coach has no "back to sessions" breadcrumb from session detail visible at top without scrolling.
- `/director/today` and `/director` are separate URLs but functionally similar — may confuse directors.

**Recommended sprint:** 671 — Cross-Module Navigation Cleanup.

---

## Summary Table

| Workflow | State | Priority | Sprint |
|---|---|---|---|
| Director Dashboard | Built, friction | High | 659 |
| Today's Academy | Built, partial demo | Medium | 660 |
| Review Queue | Built, polish needed | High | 662 |
| Coach Wrap-Up | Built, visibility gaps | High | 661 |
| DONNA Director | Built, good | Medium | 682 |
| DONNA Coach | Built, safe | Medium | 682 |
| Academy Health | Built, unlinked | Medium | 664 |
| Player Profiles | Built, context gaps | Medium | 663 |
| Coach Sessions | Built, UX gaps | Medium | 688 |
| Navigation | Gaps | Low | 671 |

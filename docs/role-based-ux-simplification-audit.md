# Role-Based UX Simplification Audit

**Sprint:** 67
**Date:** 2026-05-06
**Purpose:** Identify simplifications needed before assistant UX becomes the center of the product.

---

## 1. Director Current Experience

### What is clear
- Dashboard ("Command Center") shows real data: active players, sessions this week, priority queue, pending placement.
- Academy Alerts panel is well-structured with severity levels and clear links.
- Review Queue has 8 tab types with count badges — well-organised entry point for review workflows.
- Player profile has 5 tabs with real content across all tabs (Overview, Skill Path, Notes, Fitness/Load, Competition).
- Sidebar is logically grouped: Foundation / Intelligence / System.

### What is cluttered
- **Top command cards link to routes that don't exist** (`/director/players/active`, `/director/improvement`, `/director/sessions/overview`, `/director/private-lessons`, `/director/alerts`). A director clicking them gets a 404.
- **Quick Actions at the bottom** include "Voice Note AI" (which links to the review queue — confusing label) and "Academy Intelligence" (links to `/director/ai-suggestions`). These are named inconsistently with the sidebar.
- **Sidebar has 17 items across 3 groups**, many linking to unbuilt routes (Intelligence, Competition, Reports, Configuration, Demo Tour). This is noise for a real director.
- **AI Suggestions card** and **Academy Alerts panel** both appear on the dashboard — duplicating the signal-to-action pattern with the sidebar signals page.
- **Curriculum Intelligence** section on the dashboard shows 3 mini stats — useful but visually heavy, competes with the top command cards.
- **AcademyAlertsPanel** has an `$unused` comment block and dead session-notes check code (`s.status === 'completed' && false`).
- **`_unused = BookMarked`** at the bottom of the dashboard — stale import kept to avoid churn. Should be removed when next touching the file.

### What should be primary
1. "What needs my attention today" — a clear, ranked list of 3–5 action items.
2. Coach wrap-ups awaiting review — the most direct director action.
3. Sessions today / this week.
4. Pending placements — new players waiting.
5. Priority queue — players needing immediate attention.

### What should be hidden or de-emphasised
- Links to unbuilt routes (should be removed or replaced with "coming soon" interstitials, not broken 404s).
- The AI Suggestions card duplicates the sidebar entry — condense to a single line in alerts.
- Curriculum Coverage block on the dashboard — move to player list or signals page. Dashboard doesn't need level stats.
- "Quick Actions" section at the bottom — generic, low value on a dashboard that already has nav.

---

## 2. Coach Current Experience

### Mobile risks
- The session page is a long scroll: header → info banner → `CoachSessionExecutionClient` (blocks + attendance) → `CoachSessionGapBriefPanel` → attendance prompt → `CoachRecapCommandPanel` → `CoachSessionActions` (Quick Note + Wrap Up buttons).
- The "Wrap Up Session" CTA is **at the bottom of a very long page**. On mobile a coach must scroll past all blocks and the gap brief panel to find it.
- The attendance prompt appears *after* the gap brief panel — coaches may miss it.
- The execution client contains block status controls and attendance in one component — hard to navigate on a 375px screen.

### Duplicate recap/capture risks
- **Two recap surfaces**: `CoachRecapCommandPanel` ("Quick Note") and `CoachWrapUpDrawer` (guided 6-question "Wrap Up"). Both save to `voice_notes`. The distinction is documented in `KNOWN_LIMITATIONS.md` but a coach seeing both will be confused about which one to use.
- The Quick Note label says "Quick Note" in the card header but appears *below* the Wrap Up action button in `CoachSessionActions`. Visual hierarchy is inverted (secondary action is above primary).

### Session-flow friction
1. To mark attendance, the coach must find it inside `CoachSessionExecutionClient` (collapsed within block list).
2. After blocks + attendance, the coach sees a gap brief (useful but dense) before they see the recap input.
3. The "Wrap Up Session" button is a small icon tile at the very bottom — not a prominent CTA.
4. After wrap-up, the "Structure Now" flow requires the coach to: (a) type recap, (b) save recap, (c) click structure, (d) see result. That's 3 separate taps after writing.

---

## 3. Parent Current Experience

### What is useful
- Development plan (IDP parent view) with "Why this matters" and "How to support" is well-structured.
- Attendance history is now polished (Sprint 63): humanised labels, formatted dates, late count.
- Private lesson request card with parent-safe status is useful and actionable.
- Safety notes ("Your coach and director review everything") build appropriate trust.

### What is still too thin
- **Progress is abstract** — the parent sees level name (e.g., "Red Ball 2 — Foundation") but no sense of how far through the level the player is.
- **No upcoming session visibility** — parents don't know when the next session is.
- **No communication thread** — the parent guidance preview exists only on the director side; parents can't see or respond to it.
- **Guardian mapping** — if not linked, parent sees empty state with no actionable instructions, only "contact your director."

### What language needs softening
- "IDP" (Individual Development Plan) is developer/educator jargon — parents don't know this term.
- "curriculum_level" and "stage" terminology leaks into some empty state messages.
- "No development plan available" is cold — should say something like "Your child's plan is being set up by their coach."

---

## 4. Player Current Experience

### Mission clarity
- "What to Work On" section is useful, but the framing is dry. Should feel like a mission, not a task list.
- "Current Level" card (Sprint 62) helps orient the player — good addition.
- The Q&A section uses helpful, direct language ("How do I improve my serve?") but is director-preview only; players don't see it yet.

### Level clarity
- Level name and next level are shown — good. Stage label ("Foundation", "Development", etc.) is present.
- Missing: any sense of *progress within* the level (no progress bar, no gate completion indicator).
- Missing: any motivating framing — "You're X% through this level" or "3 more gates before advancing."

### Motivation gaps
- The mini challenge section is intentional but thin — shows a single challenge with no streak, completion history, or badge system.
- Session history is shown (Sprint 55) but just a plain list — no "you've attended 12 sessions this month" motivating stat.
- No "your coach said..." encouragement card — positive observation quotes (director-approved) could be powerful here.

---

## 5. Assistant Integration Recommendation

### Where Coach Assistant should live
- **Primary location:** At the end of the `CoachSessionActions` block, as a full-width "Wrap Up with Assistant" CTA that replaces the current small icon tile.
- **Secondary:** Within `CoachWrapUpDrawer` as the default flow (the current manual drawer becomes the "manual" fallback option).
- The assistant should appear *after* blocks and attendance are checked, not before — it needs that context.

### Where Director Assistant should live
- **Primary location:** `/director/command-center` — which already exists and has a text input field. Sprint 73 builds on this.
- **Secondary:** A floating or sticky "Ask Academy OS" entry point on the dashboard, linking to command center.
- The director assistant should NOT appear inline on every page — it should be one deliberate entry point.

### What should NOT become assistant-driven yet
- Attendance marking (still needs direct tap controls on mobile).
- Block status toggling (still needs inline quick controls).
- Player level assignment (director-only, must be an explicit deliberate action).
- Parent/player communication (not ready for assistant drafting without approval UI).
- Curriculum customisation (architecture only, no UI yet).

---

## 6. Top 20 UX Simplification Fixes

Priority order (highest value, lowest risk first):

1. **Fix broken dashboard card links** — `/director/players/active`, `/director/sessions/overview`, etc. link to 404. Change to existing routes or remove the links.
2. **Add "Wrap Up Session" sticky bottom bar** on coach session mobile — a prominent lime button that opens the wrap-up drawer, always visible.
3. **Reorder coach session page** — move attendance prompt *above* the gap brief panel, not below it.
4. **Rename "Voice Note AI" quick action** — change to "Review Queue" (which is where it actually links).
5. **Remove dead sidebar items** on director — hide Intelligence, Competition, Reports, Configuration from sidebar until built, or add "(Coming Soon)" label and disable.
6. **Merge "Quick Actions" section into primary nav** — the bottom quick actions row on the director dashboard duplicates sidebar entries. Remove or collapse.
7. **Soften parent "no plan" empty state** — replace "No development plan available" with "Your child's plan is being set up. Check back soon."
8. **Remove developer terminology from parent portal** — "IDP" → "Development Plan", "curriculum_level" → level name only.
9. **Add progress-within-level indicator to player portal** — even a simple "Stage: Foundation" with an icon is better than nothing.
10. **Add "Ask your coach or director" link to player empty state** — currently shows a cold blank state.
11. **De-duplicate coach session bottom actions** — Quick Note and Wrap Up are both in `CoachSessionActions`. Make Wrap Up the primary (full width lime button) and Quick Note secondary (ghost button).
12. **Add "Today's Priorities" section header** to director dashboard above the command cards — sets the mental model of "mission control."
13. **Move Curriculum Coverage block off dashboard** — put it in the Players list or Signals page. Dashboard should focus on actions, not stats.
14. **Clean up `_unused = BookMarked`** import on director dashboard — stale artifact.
15. **Add empty state to director priority queue** that explains what triggers items (e.g., "Players with overdue assessments or on-hold status will appear here").
16. **Coach home page** needs a "Today's Sessions" link more prominently — currently shown as a section but could be a clearer CTA.
17. **Remove `s.status === 'completed' && false` dead code block** in `AcademyAlertsPanel`.
18. **Add "What will be shared" label to coach wrap-up summary** — coaches should know before saving what goes to the director vs. what stays internal.
19. **Add motivating stat to player portal** — "You've attended X sessions this month" in the session history section.
20. **Flatten the coach session scroll** — Group attendance + blocks more tightly. The gap brief panel should be collapsible or moved to an expandable section.

---

## 7. Recommended Design Rules

### One primary action per screen
Every screen must have one obvious primary CTA. Secondary actions are visible but not competing. Tertiary actions are in menus or drawers.

**Application:**
- Coach session: primary = "Wrap Up Session", secondary = "Quick Note", tertiary = block/attendance controls.
- Director dashboard: primary = "Review Queue" count badge, secondary = priority items, tertiary = stats.
- Parent portal: primary = "Development Plan", secondary = attendance history, tertiary = lesson requests.

### Role-specific language
| Role | Use | Avoid |
|---|---|---|
| Coach | "Today's session", "your players", "wrap up" | "voice_notes", "proposed_action", "session_blocks" |
| Director | "Review queue", "pending wrap-ups", "signals" | "academy_suggestions", "IDP", "RLS" |
| Parent | "Your child's plan", "training sessions", "focus area" | "IDP", "curriculum_level", "stage", "tier" |
| Player | "Your mission", "what to work on", "level up" | "assessment", "development plan", "score_delta" |

### No developer terms
Never expose: table names, column names, status enum values, route paths, migration terms, RLS or auth jargon.

### Mobile coach-first layouts
- Bottom CTAs are always visible (sticky bar or fixed button).
- Card sections stack vertically in clear reading order: context → action.
- Drawers expand from bottom (already implemented in CoachWrapUpDrawer).
- Avoid side-by-side grids on mobile for main content (use full-width stacked cards).

### Assistant as guided workflow, not generic chat
- The coach assistant is a secretary: "Quick question — then we're done."
- The director assistant is a briefing: "Here's what needs attention today."
- Neither presents a text box that says "Ask me anything."
- Every assistant output is labelled as a **draft** until the human confirms.
- Every assistant suggestion includes: what it is, why it matters, what will change.
- Progress indicators are shown so the coach knows "Step 3 of 6."

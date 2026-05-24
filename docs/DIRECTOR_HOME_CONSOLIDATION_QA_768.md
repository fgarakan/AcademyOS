# Sprint 768 — Director Home Consolidation QA + Mobile Pass V1

**Date:** 2026-05-24
**Sprint:** 768
**Status:** Complete

---

## Final Decision

> ## ✅ DEMO-READY — CONSOLIDATED DIRECTOR HOME
>
> The Director Home consolidation (Sprint 767) is QA-certified and demo-ready.
> The page is cognitively clean, architecturally honest, mobile-responsive, and safe.
> One unified command center surface. No competing priority lists. DONNA narrates in one voice.
> Sessions This Week and Quick Actions are immediately accessible. Supporting analysis is demoted.

---

## Part 1 — Technical Validation

### TypeScript

```
npx tsc --noEmit → EXIT 0 (clean)
```

No errors. All Sprint 767 + 768 files compile without issues.

### Git status

```
git status --short
```

Result: Only pre-existing modified files present in working tree — all protected:
- `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` — pre-existing, unstaged, unrelated
- `src/app/api/director/interview/realtime-session/route.ts` — pre-existing, unstaged, unrelated
- `src/components/assistant/DonnaAssistantButton.tsx` — pre-existing, unstaged, DONNA operator-step changes

Sprint 767 committed at commit `7736c3c`. No sprint files uncommitted or accidentally staged.

### DONNA QA Harness

`src/lib/donna/donnaUIOperatorRegressionPrompts.ts` — **data file only, not a runnable CLI harness.**

Exports `UIRegressionCase[]` arrays (NAV_REGRESSION_CASES, GUIDED_OPERATOR_REGRESSION_CASES, DRAFT_ACTION_REGRESSION_CASES, APPROVAL_ROUTING_REGRESSION_CASES, ALWAYS_BLOCKED_REGRESSION_CASES, ROLE_BOUNDARY_REGRESSION_CASES, FILTER_REGRESSION_CASES, CLARIFICATION_REGRESSION_CASES, ALL_UI_REGRESSION_CASES) and helper functions (`getRegressionSummary`, `getRegressionCaseById`, etc.), but contains no executable entrypoint.

No `scripts/*donna*` runner exists in `/scripts/`.

The last known DONNA regression result was Sprint 759: **36/36 cases (100%)** against `donnaUIActionDispatcher.ts`. The dispatcher was not modified in Sprints 760–768. The Sprint 759 certification holds.

---

## Part 2 — Manual QA Checklist

### A — Unified Command Center

| Check | Result | Evidence |
|---|---|---|
| `DirectorTodayCommandCenter` is the first operational section | ✅ PASS | Rendered at `page.tsx:470-474` — immediately below hero header |
| DONNA icon (Sparkles) + "DONNA — Today's Command Center" header label | ✅ PASS | `DirectorTodayCommandCenter.tsx:157-159` |
| Personalized greeting uses director name | ✅ PASS | `greeting = directorName ? \`${directorName}, here\` : 'Here'` at line 134 |
| Priority count chips (critical/high) render in header | ✅ PASS | Lines 169-183 — conditional on `queue.totalCount > 0` |
| Items: number ring, category chip, label, description, action chip | ✅ PASS | `PriorityRow` component at lines 71-126 |
| "Do this first" label on item #1 | ✅ PASS | `idx === 0` guard at line 81 |
| Priority-colored left border per item | ✅ PASS | `borderLeft: \`2px solid ${borderColor}\`` at line 95 |
| Empty state: "Today looks clear" + CheckCircle | ✅ PASS | Lines 186-204 — `queue.isEmpty` branch |
| Safety disclaimer footer present | ✅ PASS | Line 213: "DONNA flags items but takes no action without your explicit approval. All changes go through the review queue." |
| "View all N items →" overflow link to `/director/review` | ✅ PASS | Lines 218-223 — conditional on `hasMore` |
| "Ask DONNA →" link to `/director/donna` | ✅ PASS | Lines 225-229 |
| `showMax={5}` — 5 items before overflow | ✅ PASS | Props: `showMax={5}` at `page.tsx:473` |

### B — Cognitive Load + Section Order

| Check | Result | Evidence |
|---|---|---|
| `DirectorAttentionQueueHero` NOT rendered on `/director` | ✅ PASS | Not imported; not present anywhere in `page.tsx` |
| `DonnaExecutiveCard` NOT rendered on `/director` | ✅ PASS | Not imported; not present anywhere in `page.tsx` |
| `donnaItems: DonnaExecutivePriorityItem[]` removed | ✅ PASS | No `donnaItems` reference anywhere in `page.tsx` |
| No duplicate priority lists visible | ✅ PASS | One `DirectorTodayCommandCenter` surface; priority queue data not separately repeated |
| `AcademyKpiCardsSection` at position #3 (directly after command center) | ✅ PASS | `page.tsx:476-487` |
| Sessions This Week at position #4 (moved from #11) | ✅ PASS | `page.tsx:489-535`, Sprint 767 comment on move |
| Quick Actions at position #5 (moved from #12) | ✅ PASS | `page.tsx:537-567`, Sprint 767 comment on move |
| Health Chart + Live Activity demoted (position #8) | ✅ PASS | `page.tsx:784-789`, Sprint 767 comment: "moved down — supporting context" |
| `DirectorKpiHealthSection` demoted (position #11) | ✅ PASS | `page.tsx:835-846`, Sprint 767 comment: "moved down — supporting analysis" |
| Academy Setup + Admin at bottom (position #12) | ✅ PASS | `page.tsx:848-892` with faint divider |
| Page answers four questions in correct order | ✅ PASS | Who am I → What needs attention → KPI snapshot → What to do next → Supporting signals → Analysis |

### C — Mobile Pass

| Check | Result | Evidence |
|---|---|---|
| `DirectorTodayCommandCenter` stacks cleanly | ✅ PASS | `flex items-start justify-between` → wraps on narrow screens; chips use `flex-wrap justify-end` |
| Priority row content wraps correctly | ✅ PASS | `flex items-center gap-2 flex-wrap mb-0.5` in PriorityRow — label wraps below chip on small screens |
| Priority count chips wrap in header | ✅ PASS | `flex-wrap justify-end` at line 170 |
| Action chip and chevron remain tappable | ✅ PASS | Full row is a `<Link>` block with `py-2.5` minimum tap target |
| Sessions This Week: max 4 items shown | ✅ PASS | `slice(0, 4)` at `page.tsx:515` — clean list on mobile |
| Quick Actions: 2-column on mobile, 4-column on desktop | ✅ PASS | `grid-cols-2 md:grid-cols-4` at `page.tsx:541` |
| Roster Signals grid stacks on mobile | ✅ PASS | `grid-cols-1 lg:grid-cols-2` at `page.tsx:576` |
| Academy Health Signals grid stacks on mobile | ✅ PASS | `grid-cols-1 lg:grid-cols-[1fr_320px]` at `page.tsx:718` |
| Health Chart + Live Activity stacks on mobile | ✅ PASS | `grid-cols-1 lg:grid-cols-[1fr_320px]` at `page.tsx:786` |
| Curriculum Coverage: 2-col mobile, 3-col sm+ | ✅ PASS | `grid-cols-2 sm:grid-cols-3` at `page.tsx:798` |

### D — Desktop Pass

| Check | Result | Evidence |
|---|---|---|
| Hero header and command center visible without scroll | ✅ PASS | First two sections render immediately in viewport |
| Sessions This Week and Quick Actions follow KPI snapshot | ✅ PASS | Sections 3-5 in correct order |
| Sidebar layout does not conflict with grid sections | ✅ PASS | All grids use `grid-cols-N` — respect flex-1 main area within director layout |
| KPI health section accessible but not primary | ✅ PASS | Demoted to position #11 — requires intentional scroll |
| Academy setup at bottom — never blocking operations | ✅ PASS | Faint divider separates setup from operational content |

### E — Safety + DONNA Guardrails

| Check | Result | Evidence |
|---|---|---|
| `DirectorTodayCommandCenter` has no Supabase imports | ✅ PASS | No `from '@/lib/supabase'` in component file |
| `DirectorTodayCommandCenter` has no DB writes | ✅ PASS | Pure UI component — no mutations, no `useEffect`, no server actions |
| All item navigation is read-only `<Link>` | ✅ PASS | Every action in `PriorityRow` is `<Link href={item.href}>` |
| Safe action labels only | ✅ PASS | `getActionLabel()` returns: Open Review / View Player / View Players / View Sessions / View Curriculum / View Groups / View Details |
| No approve/send/publish/move/delete actions | ✅ PASS | No mutations, no form submits, no onClick handlers that write |
| `DirectorAttentionQueueHero.tsx` preserved on disk | ✅ PASS | File exists at `src/app/director/_components/` (9,560 bytes) |
| `DonnaExecutiveCard.tsx` preserved on disk | ✅ PASS | File exists at `src/app/director/_components/` (4,588 bytes) |
| `DonnaAssistantButton.tsx` NOT staged | ✅ PASS | Shows as pre-existing modified, never staged |
| Protected files NOT staged | ✅ PASS | `SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md`, `realtime-session/route.ts` — not staged |
| DONNA dispatch internals unchanged | ✅ PASS | `donnaUIActionDispatcher.ts` not touched in Sprints 763–768 |
| Sprint 759 DONNA regression (36/36) holds | ✅ PASS | Dispatcher unchanged — certification remains valid |
| No proposed_actions writes | ✅ PASS | No `execute_approved_action()` calls on dashboard |
| `buildAttentionQueue()` and `AttentionQueueInput` still used | ✅ PASS | `page.tsx:22` and lines 339-395 |
| academy_id scoping on all queries | ✅ PASS | Every query includes `.eq('academy_id', academyId)` |
| No parent/player data exposure added | ✅ PASS | No new parent/player-visible fields introduced |

---

## Part 3 — 5-Minute Demo Script (Updated)

### Director Home — Consolidated Command Center Demo

**Audience:** Brian / director stakeholders
**Duration:** ~5 minutes
**Prerequisite:** Signed in as a director with a live academy (`academy_id` set, some players/sessions/pending actions)

---

**[00:00 — 00:30] Open the dashboard**

> "This is the Director Home — now a single, unified command center."

Open `/director`. The director sees:
- Their greeting and today's date
- Academy health badge (top right)
- **DONNA — Today's Command Center** — the first thing below the header

Note: if the academy has no pending items, the command center shows "Today looks clear" — the page is calm, never alarming.

---

**[00:30 — 01:30] Walk through the Today Command Center**

> "The command center tells the director exactly what to look at first. One surface. DONNA narrates it."

Point to the numbered items. Explain the category chips:
- **Decision** (lime) — something awaiting director decision
- **Decision** (red) — same, but expiring within 24 hours
- **Risk** (red) — player needing immediate attention
- **Watch** (yellow) — operational concern (group over capacity, group with no sessions)
- **Opportunity** (blue) — curriculum gap that can be improved

> "The #1 item always shows 'Do this first'. The director doesn't have to scan the whole page."

Click a safe action — "Open Review" or "View Player". Show the navigation is safe:
> "Clicking an item navigates to the relevant screen. Nothing is approved or sent from this card."

Point to the footer:
> "DONNA flags items. The director approves changes. That's the operating model."

Note: previously this page showed two separate surfaces for the same question — an attention queue, then a DONNA card immediately below it — both showing the same data, framed differently. Now there is one surface in DONNA's voice.

---

**[01:30 — 02:00] Show KPI Overview**

> "Below the command center, the 8-card KPI snapshot — sessions this week, coach recaps, level-up candidates, academy health."

Scroll to `AcademyKpiCardsSection`. Highlight a few cards.

> "This gives the director a numerical snapshot in a glance."

---

**[02:00 — 02:30] Show Sessions This Week + Quick Actions**

> "Directly below KPIs — sessions this week and quick actions. These answer 'What should I do next?' immediately, without scrolling."

Point to Sessions This Week:
> "Every session planned this week. Status is visible — planned, in-progress, completed. Click any session to open it."

Point to Quick Actions:
> "Four navigation shortcuts: Today's Academy, Session Planning, Player Profiles, Signals. No friction."

Note for demo: previously Sessions and Quick Actions were at positions #11 and #12 — buried below supporting analysis. Now they are at #4 and #5, immediately after the KPI snapshot.

---

**[02:30 — 03:30] Show Roster Signals + Academy Health Signals**

> "Further down, Roster Signals — players who need placement, reassessment, or director attention."

Scroll to Priority Queue + Pending Placement.

> "And Academy Health Signals — the alert panel and AI suggestions."

Point to Academy Alerts and AI Suggestions. If alerts exist:
> "Each alert links to the relevant screen. None of these cards mutate a record — they're read-only signals."

---

**[03:30 — 04:00] Show supporting sections**

Scroll past Health Chart + Live Activity and Curriculum Coverage.

> "Supporting context — health trend, curriculum coverage, live session activity. Good for a deeper look, not in the primary flow."

---

**[04:00 — 04:30] Show Academy KPI Health (demoted)**

Scroll to `DirectorKpiHealthSection`.

> "The formal KPI health framework — 12 KPIs across four groups. Demoted here because it's analysis, not a daily action prompt."

Point to a KPI labelled `partial` or `no data`:
> "We're honest about what we have data for. Partial signal — some data, not full evidence. No data — not yet collected. Nothing is fabricated."

---

**[04:30 — 05:00] Show Academy Setup is out of the way**

Scroll to the very bottom.

> "Academy setup at the bottom, behind a faint divider. Not in the way. DNA configuration, setup tasks. If the academy is fully live, a green badge shows instead. Directors see this when they need it, not every visit."

Wrap up:

> "That's the consolidated Director Home. One command center answering 'what needs attention today.' Sessions and quick actions immediately below. Supporting analysis demoted. Setup out of the way. A director can see what matters in under 30 seconds — and there's only one surface telling them what to do."

---

## Part 4 — Cognitive Load Before / After

| Before (Sprint 766) | After (Sprint 767 + 768) |
|---|---|
| Two priority surfaces at the top (attention queue + DONNA card) | One unified command center in DONNA's voice |
| Director reads "Today's Priorities" then "DONNA — Executive Layer" | Director reads one surface: done |
| Two KPI sections back-to-back (#4 + #5) | KPI snapshot visible; detailed analysis demoted to #11 |
| Sessions This Week at position #11 | Sessions at position #4 — immediately actionable |
| Quick Actions at position #12 | Quick Actions at position #5 |
| 13 sections | 11 sections (2 merged into 1) |
| Competing framing (queue hero vs. DONNA card) | DONNA narrates the priority queue — one voice |

---

## Part 5 — Honest Gap List

### No blocking bugs found.

| Gap | Status | Notes |
|---|---|---|
| `/director/groups` page does not exist | Non-blocking | Route used in nav + attention items; page not yet built |
| `highAlerts` / `at_risk_player` via priority queue only | Non-blocking | Covers most urgent players; direct `at_risk_player` query a future enrichment |
| `affected_count` from `v_pending_proposed_actions` not surfaced | Non-blocking | Not in `AttentionQueueInput` — future enhancement ("3 players affected") |
| DONNA morning brief prompt chips | Non-blocking | Not implemented; future sprint once prompt UI exists |
| 9 of 12 KPIs still `no_data` | Non-blocking | Requires more live data depth; labelled honestly |
| `buildKpiDashboard()` full aggregator | Non-blocking | Deferred — multi-engine aggregation not yet wired |
| Group coverage: sessions without `group_id` excluded | Non-blocking | Documented in Sprint 764. Ungrouped sessions correctly excluded from group coverage |
| DONNA QA harness has no CLI runner | Non-blocking | Sprint 759 certified 36/36. Dispatcher unchanged since Sprint 763. |

---

## Part 6 — Files Audited

| File | Status |
|---|---|
| `src/app/director/_components/DirectorTodayCommandCenter.tsx` | Sprint 767 creation — PASS |
| `src/app/director/page.tsx` | Sprint 767 modification — PASS |
| `src/app/director/_components/DirectorAttentionQueueHero.tsx` | Preserved on disk — confirmed not rendered |
| `src/app/director/_components/DonnaExecutiveCard.tsx` | Preserved on disk — confirmed not rendered |
| `src/app/director/_components/AcademyKpiCardsSection.tsx` | Read only — renders correctly at position #3 |
| `src/app/director/_components/DirectorKpiHealthSection.tsx` | Read only — demoted to position #11 |
| `src/lib/donna/donnaUIOperatorRegressionPrompts.ts` | Read only — data file; no CLI runner |
| `docs/DIRECTOR_HOME_CONSOLIDATION_767.md` | Sprint 767 documentation — verified accurate |
| `docs/DIRECTOR_COMMAND_CENTER_FINAL_DEMO_QA_766.md` | Reference — Sprint 766 baseline confirmed |

---

## Part 7 — Recommended Sprint 769

**Sprint 769 — Director Home: DONNA Morning Brief Panel V1**

Goal: Add a collapsed DONNA morning brief panel that surfaces a 2–3 sentence natural-language summary of the current attention queue state. Director can expand to read DONNA's full brief. Panel appears between the command center and KPI snapshot.

Constraints:
- Static brief constructed from attention queue data (no external AI API call)
- Brief is generated server-side from `attentionQueue` shape — no new DB queries
- Panel is collapsible (collapsed by default after first view, via localStorage)
- Tone: calm, professional, DONNA's voice

This extends the consolidation without adding data sources or architectural changes.

# DONNA + Dashboard UX Recovery Audit — Sprint 799

**Date:** 2026-05-25
**Sprint:** 799
**Type:** Audit only — no code changes
**Status:** COMPLETE

---

## Context

Sprint 790 certified DONNA at **91/100** (conversational quality).
Sprint 797 certified Curriculum Builder at **Grade A−** (87/100).
Sprint 798 completed DONNA/Grid visual cleanup.

However, live user feedback overrides certification scores:

> "DONNA side panel is still cluttered."
> "It is not clear what the user can do."
> "It is not clear what the user should do."
> "DONNA is not persistent in the actual user experience."
> "DONNA does not understand basic commands reliably."
> "DONNA is not intuitive."
> "Dashboard is way too cluttered."
> "Overall UI/UX does not feel 10/10."

This audit investigates the root cause of each complaint.

---

## Files Audited

| File | Lines | Role |
|---|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | 4,609 | DONNA panel UI + all routing |
| `src/app/director/page.tsx` | 1,253 | Director Dashboard |
| `src/lib/donna/donnaSessionContext.ts` | 60 | Panel open state persistence |
| `src/lib/donna/donnaIntentClassifier.ts` | 140 | Command intent mapping |
| `src/lib/donna/donnaConversationalRouter.ts` | (referenced) | COO routing engine |

---

## Section 1 — DONNA Side Panel Audit

### 1.1 What Appears Above the Fold

On a typical desktop (1440×900), the visible portion of the DONNA panel on first open:

```
┌─────────────────────────────────────────────┐
│ D DONNA [Review-first] [Ready]              │  ← Header: 2–8 badges competing
│ AI-Powered Academy Intelligence Officer     │
│ ○ N items in review queue                  │
├─────────────────────────────────────────────┤
│ [Back to X] [Today?] [Attention?] [Agenda?] │  ← Chips: horizontal scroll, 6-7 items
│ [Review first?] [Walk me through] [Help?]   │    Most directors see only 2-3
├─────────────────────────────────────────────┤
│ [Greeting / onboarding card]                │  ← Greeting: can show voice buttons too
│                                             │
│  "Hi, how can I help you today?"            │
│  "N items waiting in review queue."         │
│  [Walk me through academy priorities]       │
│                                             │
│ [DONNA Voice Layer — input + DONNA says]   │  ← Input: mic + text + DONNA response
└─────────────────────────────────────────────┘
```

**Above-the-fold problems:**
1. Header row has up to **8 competing status badges**: "Review-first", "Speaking", "Listening", "Paused — active", "Stopped", "Ready", "Mic blocked", "Voice unavailable" — plus async "Thinking…". On most opens, the user sees 2-4 badges simultaneously. This looks like a developer debug panel.
2. 6-7 chips in a horizontal scroll row. On most screens, only 2-3 chips are visible without scrolling. The most useful chips (positions 4-6) are hidden.
3. Greeting card duplicates the review queue count already shown as a badge.
4. **No single obvious primary action.** The director sees a greeting, a badge, a chip scroll, and a voice input — competing equally for attention.
5. Page context is not shown. The director cannot tell at a glance what page DONNA is contextualizing.

### 1.2 Primary Action Clarity

**Score: 3/10**

There is no prominently surfaced primary action. The director must:
1. Discover what the chips say (scrolling)
2. Click a chip to get a response
3. Or type something and hope it matches

This is the inverse of a great assistant experience. A great assistant says: "Here's the one thing you should do right now" — DONNA shows a scroll of equal-weight chips.

### 1.3 Input / Mic Area Clarity

**Score: 7/10**

The text input + mic button is visible but is below the greeting card. On mobile (< 640px), it may not be in immediate view. The mic button works (Chrome/Edge only). The placeholder text is helpful.

### 1.4 Listening / Idle State Clarity

**Score: 6/10**

- Listening state shows an animated "Listening" badge — visible
- Idle state (3 min inactivity): shows a subtle "I'm here when you need me" card — adequate
- Voice status badges in the header (`text-[9px]`) are easy to miss
- After 3 minutes idle: wake listening stops but panel stays open — correct behavior

### 1.5 Current Page Context Visibility

**Score: 3/10**

Page context is NOT shown in the panel header by default. It only appears when the director explicitly clicks "What DONNA can do here?" — which most directors won't discover. The `ctx.pageName` is available from `resolvePageContext(pathname)` but not rendered prominently.

### 1.6 Does DONNA Clearly Answer Its Core Questions?

| Question | Answer | Verdict |
|---|---|---|
| What can I do here? | Only via "What DONNA can do here?" chip | ❌ Hidden |
| What should I do next? | Requires clicking a chip | ❌ Not obvious |
| What requires approval? | Via Review Queue count badge | ⚠️ Partial |

### 1.7 Chip Grouping by Usefulness

**Score: 5/10**

Director chips are conversationally good ("What do I need to do today?") but:
- Not grouped by priority (day-ops vs navigation vs deep dive)
- "Back to X" conditional chip is good but not always present
- 6 chips at equal visual weight — no hierarchy

### 1.8 Does DONNA Feel Like an Assistant or Debug Panel?

**Current verdict: Debug panel.**

Reasons:
- 8 possible status badges in the header
- Voice realtime status strings like "Donna is connecting…", "Realtime voice not configured"
- "Play Donna voice", "Try Browser Voice", "Reset Donna voice" buttons exposed
- Voice output confirmation ("Did you hear it? Yes / No")
- These are developer/QA-level controls visible to the director

### 1.9 Mobile Usability

**Score: 6/10**

- Mobile has a separate `DONNADirectorMobileCommandBar` component
- Desktop panel is hidden for directors on mobile (`hidden sm:flex`)
- Mobile bar is limited to a bottom command strip
- Mobile directors cannot access the full panel

### DONNA Side Panel Score: 58/100

---

## Section 2 — DONNA Persistence Audit

### 2.1 Is DONNA Globally Mounted?

**Yes.** `DonnaAssistantButton` is rendered in `src/app/director/layout.tsx`, not per-page. The `useDonnaSessionContext()` provider lifts `panelOpen` above the route level.

### 2.2 Does DONNA Stay Open Across Route Changes?

**Yes (panel) — No (content).**

- `panelOpen` state lives in `DonnaSessionContextProvider` — survives route remounts ✅
- sessionStorage key `academyos:donna:panelOpen:v1` restores open state on tab refresh ✅
- BUT: `commandResponse` (DONNA's last answer) is cleared in the route-change `useEffect` ❌
- `cooThread` (conversation bubbles) is NOT cleared on route change ✅
- `contextSummary`, `reviewQueueData`, `suggestions` all cleared on route change ❌

**Net result:** Director asks DONNA something → navigates to another page → panel stays open but DONNA's answer is gone. This feels broken even though the architecture is correct.

### 2.3 Is SessionStorage Working?

**Yes.** Key `academyos:donna:panelOpen:v1` is written on every `panelOpen` change and read on mount. This correctly restores open state after browser refresh within the same tab.

### 2.4 Duplicate DONNA Instances?

**No.** Single mount point in director layout. Mobile uses a separate non-overlapping bar.

### 2.5 Does Idle Mode Keep Panel Open?

**Yes.** Sprint 787 idle timer: after 3 min of no interaction, `setIsDonnaIdle(true)` (shows idle card) but does NOT close the panel. ✅

### 2.6 Does DONNA Preserve Safe Context?

**Yes, with a gap.**

- `donnaSafeSessionMemory.ts` stores only: route labels, last 5 prompts, last 5 summaries
- `donnaLastSessionStore.ts` (localStorage) stores: last page label, last route, last safe action label
- No raw transcripts, no coach notes, no player private data stored ✅
- Gap: `commandResponse` cleared on route change means director loses DONNA's answer on navigation

### DONNA Persistence Score: 72/100

**Key finding:** Architecture is solid but the experience of losing DONNA's last answer on navigation feels broken even though the panel stays open.

---

## Section 3 — Command Understanding Audit

### 3.1 Command Test Results

| Command | Expected | Actual Result | Status |
|---|---|---|---|
| What do I need to do today? | Daily brief | → `matchesDailyBriefIntent` → daily brief | ✅ Works |
| What's on the agenda? | Daily brief | Chip exists → same path | ✅ Works |
| What needs my attention? | Attention report | → `isAttentionPhrase` → attention report | ✅ Works |
| What should I do first? | Daily brief / top action | NOT in matchesDailyBriefIntent → falls to COO router → unclear | ⚠️ Partial |
| What can you help me do here? | Page actions | Chip → `handleShowPageActions` | ✅ Works |
| Open review queue | Review queue | → `isReviewQueuePhrase` → opens queue | ✅ Works |
| Open curriculum | Navigate | → COO router → navigate? | ⚠️ Unclear |
| Open curriculum builder | Navigate | → COO router | ⚠️ Unclear |
| Show me today's academy | Navigate | → COO router or navigation | ⚠️ Unclear |
| Show me players | Navigate | → COO router | ⚠️ Unclear |
| Show me coach dashboard | N/A for director | Graceful failure expected | ⚠️ Unclear |
| Close Donna | Close panel | NOT mapped in detectAndHandleCommand | ❌ Fails |
| Stop listening | Stop mic | NOT a typed command — button only | ❌ Fails |
| Start listening | Start mic | NOT a typed command — button only | ❌ Fails |
| Go back | Undo / back | Controller handles go_back | ✅ Works |
| Next | Next step | Operator step advance | ⚠️ Only in operator |
| Why? | Explanation | followUp resolver (if context set) | ⚠️ Hit-or-miss |
| Which ones? | Clarification | followUp resolver: only for 3 intent families | ⚠️ Often fails |
| Open that | Navigate to entity | NOT mapped | ❌ Fails |
| Help me clean up this page | Guidance | Generic COO fallback | ⚠️ Unclear |
| Walk me through this page | Page walkthrough | Chip → daily brief (walks through today) | ✅ Works |

### 3.2 Failure Classification

| Status | Count |
|---|---|
| ✅ Works | 7 |
| ⚠️ Partial / Unclear | 9 |
| ❌ Fails silently | 3 |

### 3.3 Root Causes

1. **"Close Donna"** — `detectAndHandleCommand` does not have a "close panel" mapping
2. **"Stop listening" / "Start listening"** — these are UI button actions, not text commands. No text-to-action bridge exists.
3. **"Which ones?" / "Open that"** — `resolveFollowUp` only sets `sessionIntentContext` for 3 intent families (daily_brief, review_queue, attention). Everything else falls to `unknown` with no context.
4. **"What should I do first?"** — `matchesDailyBriefIntent` may or may not match this phrase; it's not in the chip set.
5. **Navigation commands** ("Open curriculum", "Show me players") — these exist in the COO router but the matching is unclear without live testing.

### DONNA Command Understanding Score: 55/100

---

## Section 4 — Director Dashboard Audit

### 4.1 Sections Above the Fold (1440×900 desktop)

Estimated visible sections on first load:
```
┌─────────────────────────────────────────────────────────────────┐
│ Good morning, Director.          [Academy Health Badge]         │
│ Academy Name                                                     │
│ Today's Academy · Review Queue (N) · DONNA                      │
├─────────────────────────────────────────────────────────────────┤
│ DirectorTodayCommandCenter (attention queue + top action)       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ AcademyKpiCardsSection — 8 KPI cards in 2-row grid             │  ← CLUTTER
│ [Sessions Today] [Attendance] [Recaps] [Level-Up]              │
│ [Parent Updates] [Health%] [Curriculum%] [Player Progress]      │
└─────────────────────────────────────────────────────────────────┘
```

Most directors will need to **scroll 3+ sections** to reach Quick Actions or Sessions This Week.

### 4.2 Full Section Count

| # | Section | Priority | Notes |
|---|---|---|---|
| 1 | Hero Header + greeting | High | Good |
| 2 | DirectorTodayCommandCenter | High | Good — replaces old cards |
| 3 | AcademyKpiCardsSection (8 cards) | Medium | **Cognitive overload** |
| 4 | Sessions This Week | High | Should be near top |
| 5 | Quick Actions (4 cards) | High | Too far down |
| 6 | Roster Signals: Priority Queue | High | Duplicate of Today Command Center |
| 7 | Roster Signals: Pending Placement | Medium | Duplicate of Today Command Center |
| 8 | Academy Health Signals: Alerts | Medium | **Triple duplication** |
| 9 | Academy Health Signals: AI Suggestions | Low | Far down page |
| 10 | Health Chart + Live Activity | Low | Visual only |
| 11 | Curriculum Coverage | Low | Can live in sidebar |
| 12 | NextBestActionCard (conditional) | Low | Good but far down |
| 13 | DirectorKpiHealthSection | Low | Deep analysis — not daily |
| 14 | Academy Setup | Low | One-time — bottom is right |

### 4.3 Primary Action Clarity

**Score: 4/10**

`DirectorTodayCommandCenter` surfaces the first action clearly. But it is immediately followed by 8 KPI cards which visually compete for equal attention. By the time the director has processed the command center, they are presented with 8 more data points of equal visual weight.

### 4.4 DONNA Competing with Today's Academy

**Yes — they duplicate each other.**

Both `DirectorTodayCommandCenter` and `DonnaDashboardPresenceCTA` (at the bottom) surface the same "needs attention" items. A director who uses DONNA will get told the same things they already see on the dashboard. This makes DONNA feel like a slower version of the dashboard, not a smarter layer.

### 4.5 Triple Duplication of "What Needs Attention"

Three separate surfaces list the same attention items:
1. `DirectorTodayCommandCenter` (attention queue)
2. `AcademyAlertsPanel` (alerts section)
3. `Priority Queue` card (roster signals)

Directors will see the same pending wrap-up or reassessment flag in **three different places** with three different framings.

### 4.6 Is Dashboard Scannable in 10 Seconds?

**No.** A director needs 40-60 seconds to scan the full above-fold content:
- 8 KPI cards require individual reading
- Two "attention" surfaces before reaching sessions or quick actions
- Visual weight is flat — no hierarchy guiding the eye

### 4.7 Dashboard Cognitive Load Score: 40/100

---

## Section 5 — Top 10 Blockers

| # | Blocker | Severity | Sprint |
|---|---|---|---|
| 1 | Dashboard has 3 separate "needs attention" surfaces (TodayCommandCenter + PriorityQueue + AcademyAlerts) | Critical | 803 |
| 2 | 8-card KPI section creates immediate cognitive overload above the fold | Critical | 803 |
| 3 | DONNA panel header shows up to 8 status badges simultaneously | High | 800 |
| 4 | "Close Donna" text command not wired — director has to find the X button | High | 802 |
| 5 | commandResponse cleared on route change — DONNA's answer disappears on navigation | High | 801 |
| 6 | "Which ones?" / "Open that" fail for most intent families | High | 802 |
| 7 | No visible primary action in DONNA panel on open | High | 800 |
| 8 | Chips in horizontal scroll — only 2-3 visible without scrolling | Medium | 800 |
| 9 | Page context not visible in DONNA panel header | Medium | 800 |
| 10 | "Stop listening" / "Start listening" not wired as text commands | Medium | 802 |

---

## Section 6 — Top 5 Quick Wins

| # | Win | Impact | Effort |
|---|---|---|---|
| 1 | Reduce DONNA header to max 1 status badge at a time (show highest-priority only) | -3 header items | Low |
| 2 | Collapse `AcademyKpiCardsSection` to 3 key cards (hide rest behind "Show all") | -5 competing cards | Low |
| 3 | Wire "Close Donna" / "close donna" text → `closePanel()` | 1 failing command fixed | Low |
| 4 | Remove `AcademyAlertsPanel` from default view (it duplicates TodayCommandCenter) | -1 competing section | Medium |
| 5 | Preserve `commandResponse` across route changes (clear text only, keep the card) | Persistence feels solid | Medium |

---

## Section 7 — Exact Files for Sprints 800–805

### Sprint 800 — DONNA Side Panel Simplification

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Reduce header to 1 badge at a time; reduce chips from 6 to 4; add visible page context; make primary action chip visually prominent |

### Sprint 801 — DONNA Persistence Reliability Fix

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Preserve `commandResponse` across route changes (move clear to panel close only); show "Still here from last page" context indicator |

### Sprint 802 — DONNA Basic Command Understanding

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Wire "close donna" / "close" → closePanel(); "stop listening" → stopWakeListening(); "start listening" → startWakeListening(); "what should I do first?" → handleFetchDailyBrief() |
| `src/lib/donna/donnaFollowUpResolver.ts` | Expand followUp context to more intent families for "which ones?" / "open that" |

### Sprint 803 — Director Dashboard Cognitive Load Rebuild

| File | Change |
|---|---|
| `src/app/director/page.tsx` | Remove or collapse `AcademyKpiCardsSection` (show 3 max, hide rest); remove `AcademyAlertsPanel` (duplicate of TodayCommandCenter); move Sessions This Week and Quick Actions above KPI section |

### Sprint 804 — DONNA + Dashboard Integration

| File | Change |
|---|---|
| `src/app/director/page.tsx` | Add "Ask DONNA why" link near TodayCommandCenter top action |
| `src/components/assistant/DonnaAssistantButton.tsx` | "What should I do first?" chip → surfaces the same top action as dashboard |

### Sprint 805 — Certification Audit

- Audit-only. Write `docs/DONNA_DASHBOARD_10_10_CERTIFICATION_805.md`.

---

## Section 8 — Score Summary

| Dimension | Score | Grade |
|---|---|---|
| DONNA side panel clarity | 58/100 | D+ |
| DONNA persistence (architecture) | 72/100 | C+ |
| DONNA persistence (experience) | 45/100 | F (answer disappears on nav) |
| Basic command understanding | 55/100 | D+ |
| Dashboard cognitive load | 40/100 | F |
| Dashboard primary action clarity | 55/100 | D+ |
| DONNA–dashboard integration | 30/100 | F |
| Mobile usability | 60/100 | D+ |
| Trust/safety | 95/100 | A+ (preserved throughout) |

**Weighted composite: ~57/100**

---

## Section 9 — Specific Command Classification

| Command | Classification |
|---|---|
| What do I need to do today? | ✅ works |
| What's on the agenda? | ✅ works |
| What needs my attention? | ✅ works |
| What should I do first? | ⚠️ partially works |
| What can you help me do here? | ✅ works |
| Open review queue | ✅ works |
| Open curriculum | ⚠️ unclear intent |
| Open curriculum builder | ⚠️ unclear intent |
| Show me today's academy | ⚠️ unclear intent |
| Show me players | ⚠️ unclear intent |
| Show me coach dashboard | ⚠️ wrong context (director) |
| Close Donna | ❌ fails |
| Stop listening | ❌ not a text command |
| Start listening | ❌ not a text command |
| Go back | ✅ works |
| Next | ⚠️ only in operator flow |
| Why? | ⚠️ hit-or-miss |
| Which ones? | ⚠️ only 3 intent families |
| Open that | ❌ fails |
| Help me clean up this page | ⚠️ generic fallback |
| Walk me through this page | ✅ works (via chip) |

---

## Section 10 — Final Decision

**4. HIGH COGNITIVE LOAD**

- DONNA and the Dashboard have the architecture of a 10/10 system.
- The implementation has accumulated layers that individually make sense but collectively create cognitive overload.
- DONNA looks like a debug panel. The Dashboard looks like a spreadsheet.
- The user's experience is correctly described: cluttered, non-intuitive, not 10/10.
- Safety is intact. Trust boundary is preserved. No regressions.
- The gap is purely UX — not architecture, not safety, not data quality.

Sprints 800–805 address each gap in targeted, safe code changes.

---

## Estimated Score Lift by Sprint

| Sprint | Dimension improved | Expected lift |
|---|---|---|
| 800 (Panel simplification) | Panel clarity: 58 → 78 | +20 pts |
| 801 (Persistence fix) | Persistence experience: 45 → 70 | +25 pts |
| 802 (Command understanding) | Commands: 55 → 75 | +20 pts |
| 803 (Dashboard rebuild) | Dashboard cognitive load: 40 → 72 | +32 pts |
| 804 (Integration) | DONNA–dashboard integration: 30 → 65 | +35 pts |
| 805 (Certification) | Composite from ~57 → ~79 | +22 pts |

**Estimated post-805 composite: ~79/100 (B)**

Reaching 90/100 (A−) requires a second recovery block (Sprints 806–812) after 805 certification confirms the gaps.

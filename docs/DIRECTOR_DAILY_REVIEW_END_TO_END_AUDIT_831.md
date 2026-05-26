# Sprint 831 — Director Daily Review End-to-End Audit V1

**Date:** 2026-05-26
**Sprint:** 831
**Type:** End-to-end audit and certification — code review only
**Files changed:** 0 source files, 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Certification status:** ✅ STRONG — MINOR POLISH REMAINS

---

## Scope

End-to-end audit of the Director's Daily Command / Review loop:

```
Director arrives at dashboard
  → "What do I need to do today?" (dashboard card / DONNA / voice)
  → Today's Command Center (priority queue)
  → Today's Pulse (3-tile strip: review queue, player attention, sessions)
  → DONNA daily brief (async, voice-narrated)
  → Review queue (/director/review)
  → Action / approval path
```

---

## Files Read

| File | Purpose |
|---|---|
| `src/app/director/page.tsx` | Director dashboard; all data queries, components, layout |
| `src/app/director/_components/DirectorTodayCommandCenter.tsx` | Priority queue component (DONNA-branded, Sprint 767) |
| `src/app/director/_components/DonnaDashboardOpenCard.tsx` | DONNA inline entry card (Sprint 804) |
| `src/app/director/_components/AcademyKpiCardsSection.tsx` | KPI cards; 4 primary + 4 secondary (Sprint 808) |
| `src/lib/director/attentionQueue/index.ts` | `buildAttentionQueue()` — pure TypeScript priority builder |
| `src/app/director/review/page.tsx` | Review queue page (tabbed) |
| `src/components/assistant/DonnaAssistantButton.tsx` | DONNA daily brief, attention, review queue handlers |
| `src/lib/donna/donnaUIActionDispatcher.ts` | NAV_PATTERNS, FOCUS_TARGET_MAP, resolveDraftIntent |

---

## Audit Findings by Dimension

### 1. Entry Clarity

**Audited:** Can a director understand the day in 5 seconds on page load?

**Dashboard page structure (order of render, top to bottom):**
1. **Hero header** — personalized greeting ("Good morning, [Name]."), date, academy name, 3 quick header links (Today's Academy, Review Queue with orange badge, DONNA)
2. **DONNA Dashboard Open Card** (Sprint 804) — "N items may need your attention today" + "Ask DONNA →" — one-click opens DONNA pre-seeded with "What do I need to do today?"
3. **Today's Command Center** (Sprint 767) — DONNA-narrated priority queue, numbered 1–5, "Do this first" label on item 1, category chips (Decision / Risk / Watch / Opportunity), priority count chips (N critical, N high)
4. **Today's Pulse** (Sprint 813) — 3 compact tiles: Review Queue count, Players Attention count, Sessions This Week count — all tappable links
5. **Collapsed sections** (Sessions, Quick Actions, Academy Metrics, Alerts & Placement, Analytics, Academy Setup) — all collapsed by default via `<details>` + `<summary>` (pure HTML, no client JS)

**5-second scan:** The hero (greeting + date), DONNA card (signal count), Command Center (top priority), and Pulse tiles (3 numbers) are all above the fold. A director sees their name, today's date, signal count, top 1–5 actions, and 3 key numbers before scrolling. This is a strong Daily Command experience.

**Review queue access:**
- Orange badge on "Review Queue" link in header when `pendingWrapUpsCount > 0`
- `review-queue-card` pulse tile (tappable, orange when non-zero)
- Command Center item linking to `/director/review` when pending approvals exist

**Finding:** Entry is exceptional. Information hierarchy is clear, progressive disclosure keeps the page lean, and the DONNA card bridges dashboard to conversational assistance with zero friction.

**Score: 10/10**

---

### 2. DONNA Guidance

**Audited:** Does DONNA answer "What should I do first?" and narrate the daily brief?

**Dashboard DONNA Open Card (client component):**
- Renders at top of page, below the hero header
- `onClick` dispatches `donna:open` CustomEvent with `detail.prompt = 'What do I need to do today?'`
- This fires before the director manually opens DONNA — one tap and DONNA opens with the daily brief intent pre-loaded

**`isAttentionPhrase()` in DonnaAssistantButton (line 2111):**
Covers: "what needs attention", "anything urgent", **"what should I do first"**, "what is urgent", "whats urgent", "urgent items", "needs attention", "any urgent", "priority items"
→ triggers `handleFetchAttention()` → `/api/donna/attention`

**`matchesDailyBriefIntent`** (earlier in routing, before attention check):
Covers: "what do i need to do today", "what do i need to work on", "give me a brief", "daily brief", "run me through today", etc.
→ triggers `handleFetchDailyBrief()` → `/api/donna/brief`
→ auto-narrates brief via `speakDonna(buildBriefVoiceSummary(brief))`
→ Sets `sessionIntentContext` for follow-up resolution

**`buildBriefVoiceSummary()`:**
Generates a 1–2 sentence spoken summary: "You've got N areas today. One area needs your attention first: [title]." — structural, no player PII.

**`buildBriefWalkthroughText()`:**
Generates a full section-by-section walkthrough: "Section title — urgent: first item and N more." — called by "Walk me through it" button.

**COO router "what should I do first" path:**
Also handled by `handleDonnaCooPrompt()` → `routeDonnaPrompt()` which returns an `inspect_first` intent, composing a COO answer with review queue count injected (Sprint 706).

**Review queue in DONNA panel:**
`handleOpenReviewQueue()` → `getDonnaReviewQueueAction()` → fetches pending items for in-panel display.
- Director-only gate: `if (role === 'coach') { ... DIRECTOR_REQUIRED_COPY }`

**Finding:** DONNA answers "What should I do first?" via multiple paths that are all wired correctly. The brief auto-narrates on load with voice. Follow-ups ("Why?", "Walk me through it") are supported via `sessionIntentContext`. The daily brief and attention fetch are async with `isThinking` indicator (Sprint 828).

**Score: 10/10**

---

### 3. Page-Aware Context

**Audited:** Does the dashboard surface real live data, not stale or demo data?

**All key metrics are live queries:**
- `activePlayers`, `pendingCount`, `attentionCount` — from `getPlayerSummaries()`
- `sessionsThisWeek` — live query on `sessions` table with `weekStart/weekEnd` bounds
- `pendingWrapUpsCount` — `proposed_actions` table, `target_module = 'session_wrap_up_v1'`, `status = 'pending_review'`
- `priorityQueue` — from `getAcademyPriorityQueue()` (player priority signals)
- `pendingActionsRows` — from `v_pending_proposed_actions` view with `expires_at` and `risk_level`
- `overCapacityGroups` — from `v_group_summary` view (Sprint 764)
- `noCoverageGroupCount` — cross-join of group_summary × weekSessions (Sprint 764)
- `advancementReadyCount`, `stalledPlayerCount`, `playersWithLevel` — from `player_curriculum_states`
- `recapCompletionPct` — computed by `computeRecapCompletionRate()` from last 30 days of sessions and voice_notes (Sprint 762)
- `newRequests` — from `private_lesson_requests` table
- `curricGapCount`, `highPrioritySuggestionsCount` — from `academy_suggestions` table
- `academyHealthPct` — derived from `totalAlerts / activePlayers` formula

**Academy health formula:**
```
academyHealthPct = max(0, min(100, round(100 - (totalAlerts / max(activePlayers, 1)) * 25)))
```
Alert ratio multiplied by 25 → max penalty is 100% at 4+ alerts per player. For empty academies: default 85%.

**Academy Health Chart:** Static sparkline from `healthPct` with derived variance — labeled "Derived from alert counts and activity signals". Honest — not falsely presented as a time-series query.

**DONNA COO router — live data injection (Sprint 706):**
Review queue count injected into COO responses: "N items are waiting in your review queue."
Attention report and player names injected for roster questions.

**Finding:** All operational signals are live queries. The only non-live element is the health sparkline (static derivation from current-day values, clearly labeled). Data honesty is maintained.

**Score: 9/10** — academyHealthPct formula (`totalAlerts / players * 25`) is a rough heuristic, and the sparkline is derived rather than historical — both are labeled but not immediately obvious to a non-technical director

---

### 4. Navigation / Highlight Support

**Audited:** Does DONNA navigate and highlight correctly for daily review commands?

**DONNA "What do I need to do today?" routing (NAV_PATTERNS line 118):**
Pattern: `/what (do i|should i) (need to )?(do|focus on) today|what.{0,15}first/i`
Route: `/director` with `focusTargetId: 'review-queue-card'`
→ `data-donna-focus-id="review-queue-card"` confirmed on director page (line 496) — Sprint 829 verification

**FOCUS_TARGET_MAP for `/director`:**
Default target: `today-command-center` — reason "Your most urgent actions are in the pulse tiles here."
Command-level override: `review-queue-card` for "what do I need to do today?" — focuses the review queue pulse tile.

**`data-donna-focus-id` on director page:**
```
today-command-center    → DirectorTodayCommandCenter wrapper (line 481)
todays-pulse            → 3-tile grid (line 493)
review-queue-card       → Review queue tile (line 496) ✓ Sprint 827 gap resolved
player-attention-card   → Player attention tile (line 507)
sessions-this-week-card → Sessions this week tile (line 518)
academy-metrics-section → Academy Metrics collapsed section wrapper (line 614)
alerts-placement-section → Alerts & Placement wrapper (line 645)
```

**Review queue page:**
`data-donna-focus-id="pending-review-list"` confirmed in FOCUS_TARGET_MAP for `/director/review`.

**Finding:** Navigation and highlight architecture is fully connected for the daily review loop. "What do I need to do today?" highlights the review queue card. "Review queue" navigates to `/director/review` with a focus target. Seven `data-donna-focus-id` targets on the director page cover all major sections.

**Score: 10/10**

---

### 5. UI Cognitive Load

**Audited:** Is the dashboard too cluttered? Does it feel like an elite COO daily briefing?

**Cognitive load audit:**

**Above-fold (immediate view):**
- Greeting + date + 3 header links
- DONNA Open Card: 1 signal, 1 action
- Today's Command Center: up to 5 prioritized items, each with a category chip + description + action label
- Today's Pulse: 3 numbers with labels

This is approximately 10–12 information units at page load — well within the 7±2 cognitive limit. The "Do this first" label on item 1 reduces cognitive overhead to a single decision point.

**Collapsed sections (below fold):**
Five `<details>` sections (Sessions, Quick Actions, Academy Metrics, Alerts & Placement, Analytics) + Academy Setup. All collapsed by default. Director reads the command center → expands what's relevant. The `badge` prop on "Alerts & Placement" shows `totalAlerts` as an orange pill on the summary row without opening the section.

**Sprint history of cognitive load reduction:**
- Sprint 767: merged AttentionQueueHero + DonnaExecutiveCard → one surface
- Sprint 803: moved KPIs below Sessions + Quick Actions
- Sprint 808: reduced KPI cards from 8 equal-weight to 4 primary + 4 collapsed
- Sprint 813: made ALL detail sections collapsed by default (Daily Command design)
- Sprint 804: added DONNA card above command center for 1-tap brief access

**Remaining concerns:**
1. The hero header `AcademyHealthBadgeWithDrawer` in the top-right is a second engagement point above the DONNA card — a director landing on the page sees both "Ask DONNA" and the Academy Health badge as possible first-clicks. The hierarchy works (health badge is smaller and supplementary) but the visual density at the very top is higher than necessary.
2. The Command Center's label "DONNA — Today's Command Center" and the DONNA Open Card immediately above it both use the lime/sparkle DONNA identity pattern — two DONNA surfaces in close proximity feels slightly redundant.

**Score: 9/10** — excellent information hierarchy; above-fold density is appropriate; redundant DONNA presence at top is minor

---

### 6. Data Honesty

**Audited:** Are KPIs reduced to the most useful operating signals? Are derived/estimated metrics labeled?

**Primary KPI cards (Sprint 808):**
1. Attendance Exceptions — count of pending_review wrap-ups (actionable)
2. Coach Recaps — same source (pending wrap-ups — slightly redundant with Attendance Exceptions, but labeled differently)
3. Level-Up Candidates — `advancementReadyCount` from `player_curriculum_states`
4. Academy Health — derived formula, labeled "Derived from alert counts and activity signals"

**Pulse tiles:**
- Review Queue: `pendingWrapUpsCount + newRequests` — combined "needs review" count
- Players Attention: `attentionCount` (on_hold + reassessment_due) — clear signal
- Sessions This Week: live count — factual

**Academy Health chart:**
- Footer note: "Derived from alert counts and activity signals" — honest
- Static sparkline labeled clearly — does not falsely represent historical data
- Director-visible formula context: "N alerts affecting health score — review signals"

**`AcademyAlertsPanel` — severity labels:**
- `high` → "Urgent", `medium` → "Review", `low` → "Info" — appropriate escalation framing
- Each alert includes a `why` sentence explaining why it matters

**`DirectorTodayCommandCenter` footer:**
"DONNA flags items but takes no action without your explicit approval. All changes go through the review queue." — explicit and accurate.

**Known minor concern:**
KPI cards "Attendance Exceptions" and "Coach Recaps" both map to `pendingWrapUpsCount` (the same value from `proposed_actions` where `target_module = 'session_wrap_up_v1'`). A director seeing `2` on both cards may be confused — one number is not 2× the other, they're the same. This is a display inconsistency in `AcademyKpiCardsSection` props: `attendanceExceptions: pendingWrapUpsCount` and `coachRecaps: pendingWrapUpsCount` pass the same value.

**Score: 8/10** — honesty is strong overall; the Attendance Exceptions / Coach Recaps duplicate KPI mapping is a real UX confusion point

---

### 7. Draft / Review / Approval Safety

**Audited:** Are review queue items protected? Is there a clear director-only approval path?

**Review queue access control:**
- `DirectorReviewQueuePage` fetches only items where `academy_id` matches the authenticated director's academy
- Coach role cannot access review queue via DONNA: `if (role === 'coach') { ... DIRECTOR_REQUIRED_COPY }`
- DONNA-voiced attendance, level changes, parent updates are all `proposed_actions` with `status: 'pending_review'` — no auto-execution
- `execute_approved_action()` is the only execution path (architecture red line confirmed)
- All mutations recorded in `audit_logs`

**Review queue tabbed structure:**
- "Needs Approval" tab: wrap-ups, placement intake, attendance exceptions, voice intake, captures
- "Player Updates" tab: observations, development summaries, priorities, evidence
- "Curriculum & Session" tab: session recaps, curriculum items
- "Completed" tab: archive of processed items

**`v_pending_proposed_actions` view:**
Dashboard reads `action_id, action_label, expires_at, risk_level` — structural metadata only, no player PII in the dashboard surface.

**`buildAttentionQueue()` — href safety:**
All attention item hrefs are internal director routes only (`/director/review`, `/director/players/[id]`, `/director/groups`, `/director/curriculum`, `/director/sessions`). No external links, no action-taking hrefs.

**Parent/player safety on dashboard:**
- No parent email, phone, or contact information rendered
- Player names appear only in `priorityQueue` items (from `getAcademyPriorityQueue`) in the Command Center — director-only context, academy-scoped
- No parent-facing data surfaced to the director dashboard

**Score: 10/10**

---

### 8. Error / Edge-Case Handling

**Audited:** Empty states, failed fetches, new academy (no data yet), session count zero.

**No user / no academy:**
Both `!user` and `!academyId` early returns render a centered error message. Safe; no crash.

**Empty attention queue:**
`queue.isEmpty = true` → `DirectorTodayCommandCenter` shows "Today looks clear" with a green `CheckCircle` icon and "DONNA sees no priority items right now." — explicit, honest empty state.

**Zero sessions this week:**
Pulse tile shows `0` in `text-lime` (not orange) — not alarming for an empty academy.

**Zero pending wrap-ups:**
Review queue tile shows `0` in muted color; header link has no orange badge. Clean.

**Academy Health for new academy (no players):**
Hardcoded fallback: `academyHealthPct = 85` when `activePlayers === 0`. Prevents division-by-zero. The 85% fallback is acceptable but not labeled as a default — a director with 0 players sees "85%" which is slightly misleading (there's no real health signal yet).

**`v_pending_proposed_actions` fallback:**
```
...(pendingActionsRows.length === 0 && pendingWrapUpsCount > 0 ? [{
  id: 'pending-wrap-ups-fallback',
  actionLabel: `${pendingWrapUpsCount} coach wrap-ups awaiting review`,
  riskLevel: 'medium',
}] : [])
```
If the view returns empty but wrap-ups are known from the earlier direct query, a synthetic fallback item is added. Graceful degradation.

**DONNA brief/attention fetch failures:**
All three loading handlers (`handleFetchDailyBrief`, `handleFetchAttention`, `handleOpenReviewQueue`) have `catch` blocks returning `{ message: 'Could not load...', type: 'info', label: '...' }`. Network errors don't crash — they show a dismissible DONNA message.

**`recapCompletionPct`:**
Set to `null` when `completedSessionIds.length === 0` — `DirectorKpiHealthSection` handles null gracefully.

**Score: 9/10** — new academy 85% health default is slightly misleading; all other edge cases handled cleanly

---

### 9. Mobile Usability

**Audited:** Dashboard layout on mobile, pulse tiles, command center readability.

**Page layout:**
- `p-6 space-y-8` — consistent padding; no horizontal overflow issues
- Hero header: `flex items-start justify-between` — wraps on small screens via `gap-4`

**DONNA Open Card:**
- `flex items-center justify-between gap-4 px-5 py-4` — single row; readable on mobile
- "Ask DONNA →" chip is `shrink-0` — stays visible without wrapping

**Today's Command Center:**
- `rounded-2xl p-5 space-y-4` — generous padding
- Priority rows: `flex items-center gap-3 px-3 py-2.5 rounded-xl` — reasonable touch targets
- Category chips + action label on each row: may wrap on very narrow screens (`<360px`) but standard mobile is fine
- Critical/high count chips: `flex-wrap justify-end` — wraps without overflow

**Today's Pulse — 3 tiles:**
- `grid grid-cols-3 gap-3` — always 3 columns, no responsive breakpoints
- Each tile: `px-4 py-3.5` — adequate touch targets
- Number is `text-2xl font-mono` — readable at small size

**Collapsible sections:**
- Pure `<details>/<summary>` — native browser behavior, works on all mobile browsers
- Badge on "Alerts & Placement" summary: orange pill visible without opening

**Review Queue link in header:**
- Small text (`text-xs`) — readable but compact on mobile

**Known gap:** The 3-column Pulse grid is `grid-cols-3` with no `sm:` breakpoint. On screens narrower than 320px the numbers may truncate. On standard mobile (375px+) it's fine.

**Score: 9/10** — excellent mobile layout; 3-col pulse grid hardcoded (minor); command center priority rows may wrap on very narrow screens

---

### 10. Director Demo Readiness

**Audited:** Can a non-technical director experience this as an elite daily COO briefing in a demo?

**Demo scenario walkthrough:**
1. Director opens `/director` → sees "Good morning, [Name]" + today's date + academy name + health badge
2. DONNA Open Card shows "N items may need your attention today" → director taps it
3. DONNA panel opens with "What do I need to do today?" pre-typed → DONNA fetches daily brief
4. DONNA speaks: "You've got N areas today. One area needs your attention first: [section title]."
5. Director says "Walk me through it" → DONNA narrates the full brief
6. Director asks "What should I do first?" → DONNA responds with top urgent item + review queue count
7. Director says "Open review queue" → DONNA shows pending items in-panel
8. Director closes panel → Command Center shows top 5 prioritized items
9. Director taps item 1 → goes directly to review page
10. Director approves/rejects → items move through pipeline

**What works extremely well:**
- DONNA voice-narrates the brief automatically — no director action required
- "Do this first" label eliminates decision paralysis
- Category chips (Decision / Risk / Watch / Opportunity) provide instant context
- One tap from DONNA Open Card to brief — zero friction onboarding
- Priority count chips (N critical, N high) visible at a glance
- Collapsible sections keep the page clean until the director needs depth

**Known gaps (non-blocking):**
1. DONNA Open Card and Command Center both use DONNA identity — slight visual redundancy
2. "Attendance Exceptions" and "Coach Recaps" KPI cards show same value (misleading for new director)
3. Academy Health 85% default for empty academy slightly misleading
4. Academy Health sparkline is derived/static — a sophisticated director may notice it doesn't update dynamically

**TypeScript:** Clean across all files read.

**Score: 9/10**

---

## Certification Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Entry clarity | **10/10** | 5-second scan confirmed; DONNA card + Command Center + Pulse tiles above fold |
| DONNA guidance | **10/10** | Daily brief auto-narrated; "what should I do first" confirmed; full follow-up context |
| Page-aware context | 9/10 | All live queries; health sparkline static/derived but labeled |
| Navigation/highlight support | **10/10** | 7 focus targets on director page; review-queue-card confirmed (Sprint 827 gap resolved) |
| UI cognitive load | 9/10 | Excellent hierarchy; dual DONNA surface at top is minor redundancy |
| Data honesty | 8/10 | Attendance Exceptions + Coach Recaps show same value; health 85% default unlabeled |
| Draft/review/approval safety | **10/10** | Full proposed_actions pipeline; director-only; audit log; no auto-execution |
| Error/edge-case handling | 9/10 | Empty academy health default misleading; all other paths handled |
| Mobile usability | 9/10 | Excellent; 3-col pulse grid has no mobile breakpoint |
| Director demo readiness | 9/10 | Elite COO daily briefing experience; dual DONNA surfaces minor |
| **Total** | **93/100** | |

---

## Certification Verdict

**✅ STRONG — MINOR POLISH REMAINS — 93/100**

The Director Daily Review loop delivers an elite COO daily briefing experience. The information hierarchy is excellent: greeting + DONNA Open Card + Today's Command Center + Today's Pulse provide all essential daily signals before any scrolling. DONNA answers "What should I do first?" with voice narration, follow-up context, and a path to the review queue. The approval safety pipeline is airtight — no action executes without director approval. Seven `data-donna-focus-id` targets ensure DONNA can highlight any major dashboard section. This is the strongest loop audited in the sequence so far.

---

## Known Gaps and Follow-up Sprints

| Priority | Gap | Recommended Sprint |
|---|---|---|
| High | `AcademyKpiCardsSection` "Attendance Exceptions" and "Coach Recaps" both receive `pendingWrapUpsCount` — same value displayed twice under different labels. A director sees `3` for both and may double-count or be confused. | Sprint 832 — distinguish: "Coach Recaps" stays as `pendingWrapUpsCount`; rename "Attendance Exceptions" to "Pending Review Items" with a distinct query/count (or remove the duplicate entirely) |
| Medium | DONNA Open Card ("N items may need your attention today") and Today's Command Center both use Sparkles icon + lime glow + DONNA framing — two competing DONNA surfaces immediately adjacent. | Sprint 832 — either remove the Open Card (Command Center subsumes it) or differentiate the Open Card as a conversational entry vs. Command Center as a structural view |
| Medium | Academy Health 85% default for new academy (0 players) is unlabeled. A director who just created their academy sees "Academy Health: 85%" which implies false precision. | Sprint 833 — render "—" or "N/A — add players to see health score" when `activePlayers === 0` |
| Low | Academy Health sparkline is statically derived from current `healthPct` with added variance — not a real historical time-series. Labeled "Derived from alert counts" but a sophisticated director may ask why the chart never changes. | Sprint 833 — store daily health snapshots in a table; replace static sparkline with real data (or add explicit "estimated trend" label) |
| Low | "Attendance Exceptions" in `AcademyAlertsPanel` links to `/director/review?tab=wrap-ups` (legacy URL alias → redirects to `needs_approval` tab) — the tab alias still works but is undocumented | Sprint 832 — update href to canonical `/director/review?tab=needs-approval` |

---

## What was NOT changed

- No source files modified — audit-only sprint
- All server actions, database queries, RLS, migrations — untouched
- All UI components — untouched
- DONNA routing, voice behavior, persistence — untouched
- `proposed_actions` pipeline — untouched
- No SQL, migrations, RLS, seed, or env files touched

---

## Bonus Finding: Sprint 827 Gap Confirmed Resolved

`data-donna-focus-id="review-queue-card"` confirmed at `src/app/director/page.tsx:496` (Sprint 818). The "What do I need to do today?" NAV_PATTERN with `focusTargetId: 'review-queue-card'` is fully functional end-to-end.

---

## TypeScript result

```
npx tsc --noEmit
# Exit: 0 — no errors
```

---

## Recommended Sprint 832

**Sprint 832 — Director Dashboard KPI Clarity V1**

Target: `AcademyKpiCardsSection` passes `pendingWrapUpsCount` as both `attendanceExceptions` and `coachRecaps`, rendering the same number twice under different labels. A non-technical director sees two orange KPI cards with equal values and no understanding that they represent the same items.

Fix:
1. In `director/page.tsx`: compute `coachWrapUpCount` (proposed_actions where `target_module = 'session_wrap_up_v1'`) and pass separately from `attendanceExceptionCount` (proposed_actions where `target_module` starts with `attendance`) — or remove the duplicate card.
2. In `AcademyKpiCardsSection`: rename the surviving card to "Pending Reviews" with a label that reflects all `pending_review` items, not just one category.

Risk: Very low — UI-only change. No server action or DB schema changes. No routing changes.
Scope: `src/app/director/page.tsx` + `src/app/director/_components/AcademyKpiCardsSection.tsx`.

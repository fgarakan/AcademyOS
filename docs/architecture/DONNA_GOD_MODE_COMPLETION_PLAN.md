# DONNA God Mode Completion Plan
**Date:** 2026-05-28
**Based on:** DONNA_GOD_MODE_10_OF_10_AUDIT.md
**Target:** 9.0–9.5/10 by Sprint 912.20

---

## Guiding Principles

1. Build toward the demo golden loop first — fix the entry point before expanding capabilities.
2. Wire existing infrastructure before building new infrastructure — `getRecentTurns`, `whereAmI`, brief API data are all built but unconnected.
3. No new migrations during this completion plan unless explicitly approved.
4. No new server actions unless named in the sprint plan.
5. No autonomous control expansion — DONNA proposes, director confirms, system records.
6. Every sprint ends with a clean TypeScript check and QA document.

---

## Completion Plan — 8 Sprints

### Sprint 912.13 — DONNA Live DB Context + Post-Draft Review UX V1

**Priority: Highest — blocks demo confidence**

**Problem solved:** After DONNA creates a curriculum draft, she says "draft is in your Review Center" but doesn't know how many items are now waiting. The brief API data (pending counts, sessions today) is not wired into DONNA's conversation routing.

**Scope:**

**Files to modify:**
- `src/lib/actions/curriculumDraftActions.ts` — extend `createCurriculumContentItemDraft` return type to include `pendingDraftCount: number` (query `curriculum_overrides` count as part of the action)
- `src/components/donna/DonnaVoiceReadyShell.tsx` — update success message to include "You now have {N} curriculum draft{s} waiting for your review."
- `src/lib/donna/donnaChatSessionMemory.ts` — document null-directorCtx behavior (no code changes, just a comment noting that all `directorCtx`-gated answers fall through silently)
- `src/components/donna/DonnaVoiceReadyShell.tsx` — add null-directorCtx diagnostic message at top of `handleSend()` for questions that clearly need context ("What are my KPIs?" with no directorCtx → "Academy data is still loading. Try again in a moment or ask me about how the system works.")

**Acceptance criteria:**
- DONNA success message after drill/gate/skill draft includes live pending draft count
- Null directorCtx for context-dependent questions returns a helpful "data loading" message
- All existing 12+ QA scenarios still pass
- `npx tsc --noEmit` clean

**Estimated effort:** Small (2–3 file touches, no new server actions)

**Risk:** Low — additive only

---

### Sprint 912.14 — DONNA Page Guide Mode Intent Routing V1

**Priority: High — page guide mode is a core God Mode capability**

**Problem solved:** `whereAmI()`, `whatCanYouHelpWith()`, `whatActionsRequireApproval()`, `whatShouldINotDo()` are fully built in `donnaPageContextEngine.ts` but are never called from `handleSend()`. "What is this page?" falls through to the fallback router instead of the precise helper.

**Scope:**

**Files to modify:**
- `src/components/donna/DonnaVoiceReadyShell.tsx` — add `explain_page` intercept block before the fallback router:
  - Patterns: "what is this page", "what can I do here", "explain this", "help me understand", "what is this for", "what am I looking at"
  - Routes to `whereAmI(pathname)` + `whatCanYouHelpWith(pathname)`
  - Add `what_risks` / `what_not_to_do` patterns → `whatShouldINotDo(pathname)`
  - Add `what_needs_approval` pattern → `whatActionsRequireApproval(pathname)`
- `src/lib/donna/donnaPageContextEngine.ts` — extend `DonnaPageCapabilityMap` interface:
  - Add `primaryGoal: string` — one sentence; the single thing to accomplish on this page
  - Add `recommendedNextStep: string` — what DONNA says proactively if director has no specific question
  - Add `availableDonnaCommands: string[]` — explicit list of commands DONNA can execute on this page
  - Populate all fields for existing entries (additive, no breaking changes)

**Acceptance criteria:**
- "What is this page?" → precise answer using `whereAmI()` + `whatCanYouHelpWith()`
- "What should I not do here?" → precise answer using `whatShouldINotDo()`
- "What needs my approval here?" → precise answer using `whatActionsRequireApproval()`
- Existing routing unaffected (intercept fires before fallback, new intercept does not conflict with existing interceptors)
- `npx tsc --noEmit` clean

**Estimated effort:** Medium (1 new intercept block + interface extension + data population)

**Risk:** Low — additive

---

### Sprint 912.15 — DONNA Session Memory Context Injection V1

**Priority: High — makes DONNA feel continuous instead of amnesiac**

**Problem solved:** `getRecentTurns(3)` is recorded but never used. DONNA cannot say "following up on that" or "as we discussed about Orange 2". The slot-fill pending state is not re-announced on remount after route change.

**Scope:**

**Files to modify:**
- `src/components/donna/DonnaVoiceReadyShell.tsx`:
  - At start of `handleSend()`, call `getRecentTurns(3)` to get context
  - Pass recent turns to `tryAnswerDashboardPriorityQuestion()` and `tryAnswerCurriculumDraftProposal()` where the context would improve disambiguation
  - If director says "do that for the next level" or "same for Orange 3", check last DONNA turn for level context
  - On component mount, if `hasPendingDrillSlotFill()`, append a reminder message to the chat: "Still waiting for your answer — [the pending question DONNA had asked]"
- `src/lib/donna/donnaChatSessionMemory.ts`:
  - Export `getContextualPrefix(domain)` is already there — ensure it is usable
  - No new state needed

**Note on implementation:** Context injection does NOT require LLM calls. It is additive pattern-matching:
- If last DONNA turn had `domain === 'curriculum'` and current input is "same for the next level", resolve "next level" by looking at what level was discussed in the last turn.
- If last DONNA turn had a level mentioned (detectable via `extractTargetLevel(lastTurn.donnaResponse)`), make that the default level for follow-up drill/gate/skill requests.

**Acceptance criteria:**
- "Same for Orange 3" after an Orange 2 drill creation → resolves Orange 3 as target level
- Slot-fill reminder appears on component remount if slot-fill is pending
- `getContextualPrefix('curriculum')` returns "Following up on that — " when curriculum was already discussed in session
- Existing routing unchanged
- `npx tsc --noEmit` clean

**Estimated effort:** Medium

**Risk:** Low — additive. The context injection is a soft default, not a hard override.

---

### Sprint 912.16 — DONNA Main Entry Point Upgrade V1

**Priority: Critical for demo — highest leverage sprint**

**Problem solved:** The main director layout mounts `DonnaAssistantButton` (legacy floating panel). All God Mode features (conversation mode, curriculum draft confirmation loop, page-aware greetings, state machine) are only on `/director/donna`. Brian's first interaction with DONNA from any other page gets the old experience.

**Approach: Option B (lower risk, no surgery on DonnaAssistantButton)**

Create a prominent, styled "DONNA" entry point in the director sidebar that navigates to `/director/donna`. Make `/director/donna` feel like the DONNA hub — not a random page. Do not replace `DonnaAssistantButton` in this sprint (too risky — it has other functionality including the template draft panels).

**Files to modify:**
- `src/components/nav/SidebarNav.tsx` — elevate the DONNA nav item: larger, lime accent, "Active" indicator when conversation mode is on (can pass a prop from layout)
- `src/app/director/donna/page.tsx` or `DonnaDirectorShellClient.tsx` — add onboarding text: "This is your DONNA conversation hub. Turn on Conversation Mode and start talking."
- `src/app/director/donna/page.tsx` — make the panel larger / full-height on desktop (currently constrained to `h-[580px]`; expand to `h-full` or at least `min-h-[600px]`)
- `src/app/director/layout.tsx` — pass an `isDonnaActive` flag (from `pathname === '/director/donna'`) to `SidebarNav` so the DONNA nav item glows lime when active

**Also:** Add a "Quick DONNA" button or chip on the curriculum builder page that links to `/director/donna?context=curriculum`. This makes the demo golden loop feel natural: director on curriculum builder → clicks "Open DONNA" → lands on /director/donna with curriculum context.

**Acceptance criteria:**
- DONNA is clearly the operating hub in the sidebar — not just another nav item
- Director naturally navigates to `/director/donna` to use DONNA
- Curriculum builder has a visible "Open DONNA" entry point
- Existing `DonnaAssistantButton` floating panel preserved (not removed)
- `npx tsc --noEmit` clean

**Estimated effort:** Medium

**Risk:** Low — no changes to DONNA's core logic

---

### Sprint 912.17 — DONNA "What Needs My Attention?" Director Brief V1

**Priority: High — the single most powerful "God Mode" moment**

**Problem solved:** DONNA cannot aggregate all academy signals into one briefing. The brief API queries live DB but is disconnected from the DONNA chat. A director asking "what should I do today?" gets a `directorCtx`-based answer that may be stale.

**Scope:**

**Files to modify:**
- `src/lib/donna/directorDashboardDonnaAnswer.ts` — extend `tryAnswerDashboardPriorityQuestion()` to optionally accept a `briefData` parameter (counts from the brief API). When `briefData` is available, the answer uses live counts: "You have 2 pending reviews, 3 sessions today, and 1 player ready for advancement. Start with the reviews — they're high risk."
- `src/app/director/donna/DonnaDirectorShellClient.tsx` (or `page.tsx`) — fetch `/api/donna/brief` on page load and pass as prop to `DonnaVoiceReadyShell` via a new optional `directorBriefData` prop
- `src/components/donna/DonnaVoiceReadyShell.tsx` — accept optional `directorBriefData` prop; inject into dashboard priority intercept when available

**Note:** Do NOT call the brief API from inside `handleSend()` (would make every message wait on a DB round-trip). Fetch once at page load and pass as prop.

**Acceptance criteria:**
- "What needs my attention today?" from `/director/donna` uses live pending counts from brief API
- Answer format: "[N] pending reviews, [N] sessions today, [N] players needing attention. Recommend starting with [the highest-priority item]."
- Falls back to `directorCtx`-based answer if `briefData` is null
- No new migrations
- `npx tsc --noEmit` clean

**Estimated effort:** Medium

**Risk:** Low — additive prop threading

---

### Sprint 912.18 — DONNA Onboarding Guide Mode V1

**Priority: Medium — pilot UX, not demo-critical**

**Problem solved:** When director is on `/director/onboarding`, DONNA is passive. She can answer questions about onboarding but does not proactively guide through the steps.

**Scope:**

**Files to modify:**
- `src/lib/donna/donnaPageContextEngine.ts` — add `onboardingGuidance` function that takes the academy's onboarding completion state (from `directorCtx`) and returns the next step with clear instructions
- `src/components/donna/DonnaVoiceReadyShell.tsx` — add onboarding intercept block: if `pathname.startsWith('/director/onboarding')` and director asks "what should I do", "walk me through", "help me set up" → call `onboardingGuidance(directorCtx)`
- The page greeting when conversation mode activates on `/director/onboarding` should include the current setup progress: "You're on Academy Setup. You have 4 of 7 steps complete. The next step is: [step name]."

**Safety constraint:** DONNA guides only — no writes, no step-completion calls. Director must take action on the page themselves.

**Acceptance criteria:**
- On `/director/onboarding`, DONNA greets with setup progress
- "What should I do next?" → specific step guidance
- "Walk me through setup" → starts a guided explanation of remaining steps
- No mutations from DONNA
- `npx tsc --noEmit` clean

**Estimated effort:** Medium

**Risk:** Low

---

### Sprint 912.19 — DONNA Review Queue Intelligence V1

**Priority: Medium — closes the operating intelligence loop**

**Problem solved:** DONNA routes drafts to the review queue but cannot tell the director what is in the queue in a nuanced way. "What's pending?" currently uses `directorCtx.pendingReviewCount` (a single number) and links to the review page — it doesn't break down by type or urgency.

**Scope:**

**Files to modify:**
- `src/app/api/donna/brief/route.ts` — extend the brief to include curriculum draft count separately from `proposed_actions` count. Add `curriculumDraftCount` field.
- `src/lib/donna/directorDashboardDonnaAnswer.ts` or a new `src/lib/donna/reviewQueueDonnaAnswer.ts` — build a `tryAnswerReviewQueueQuestion()` intercept:
  - Patterns: "what's pending", "show my queue", "what's in review", "what needs approval", "review queue"
  - Returns breakdown: "You have [N] curriculum drafts, [N] player proposals, and [N] coach wrap-ups waiting for your review. The curriculum drafts are lowest risk — approve those first."
- `src/components/donna/DonnaVoiceReadyShell.tsx` — wire the new intercept before the existing `show_pending_reviews` safe-read action

**Acceptance criteria:**
- "What's in my review queue?" → breakdown by category with urgency guidance
- Curriculum draft count and proposed_actions count shown separately
- Nav offer to `/director/review` included
- `npx tsc --noEmit` clean

**Estimated effort:** Medium

**Risk:** Low — read-only queries

---

### Sprint 912.20 — DONNA God Mode Live Demo QA V1

**Priority: Required before any demo**

**Problem solved:** Final QA pass across all 13 audit categories after Sprints 912.13–912.19 are complete.

**Scope:**

**Files to create:**
- `docs/QA_DONNA_GOD_MODE_V1.md` — manual test script covering:
  - Golden loop: Director opens DONNA → enables conversation mode → asks "what is this page?" → gets page guide answer → says "add a drill for Orange 2 focused on forehand prep" → confirms → sees draft in queue → navigates to curriculum builder → approves
  - "What needs my attention today?" → live brief data answer
  - "Walk me through setup" on onboarding page → guided answer
  - "What's in my review queue?" → breakdown answer
  - Cancel mid-slot-fill → clean
  - Hard refresh → correct "session reset" behavior
  - Pause/resume → conversation resumes correctly
  - TTS interruption (press mic while DONNA speaks) → mic opens immediately

**Also:** Run `npx tsc --noEmit` across all modified files. Verify `git status --short` shows only intended changes.

**Acceptance criteria:**
- All 12 QA scenarios pass (or documented known limitations)
- Overall God Mode score ≥ 9.0/10 by self-assessment
- Demo readiness score ≥ 8.5/10
- `npx tsc --noEmit` clean

---

## Sprint Order Summary

| Sprint | Title | Priority | Impact |
|---|---|---|---|
| 912.13 | DONNA Live DB Context + Post-Draft Review UX V1 | Highest | Trust after draft creation |
| 912.14 | DONNA Page Guide Mode Intent Routing V1 | High | Page guide mode |
| 912.15 | DONNA Session Memory Context Injection V1 | High | Conversational continuity |
| 912.16 | DONNA Main Entry Point Upgrade V1 | Critical | Demo readiness |
| 912.17 | DONNA "What Needs My Attention?" Director Brief V1 | High | Operating intelligence |
| 912.18 | DONNA Onboarding Guide Mode V1 | Medium | Pilot UX |
| 912.19 | DONNA Review Queue Intelligence V1 | Medium | Operating intelligence |
| 912.20 | DONNA God Mode Live Demo QA V1 | Required | Validation |

---

## Expected Score After Each Sprint

| After Sprint | Estimated Overall Score | Demo Ready? |
|---|---|---|
| After 912.13 | 7.2/10 | Not yet |
| After 912.14 | 7.6/10 | Not yet |
| After 912.15 | 7.9/10 | Not yet |
| After 912.16 | 8.3/10 | **Yes — Brian demo possible** |
| After 912.17 | 8.7/10 | Yes — strong demo |
| After 912.18 | 9.0/10 | Yes — pilot-ready |
| After 912.19 | 9.2/10 | Yes — full God Mode |
| After 912.20 | 9.3/10 | **Verified — two-family pilot** |

---

## What NOT to Build

These items are explicitly out of scope for the completion plan:

1. **Full autonomous control** — DONNA does not execute actions without director confirmation
2. **Broad content type expansion** — missions and badges require migration 061; defer until post-pilot
3. **LLM-based intent classification** — the regex pipeline is sufficient for V1; adding a real-time LLM call to every message introduces latency and cost
4. **Persistent session memory** (cross-session localStorage or DB) — hard reload losing state is documented expected behavior for V1
5. **Coach recap connection** — coach wrap-up surfaces in the review queue; DONNA chat integration is post-pilot
6. **Parent/player-safe draft guidance** — out of scope for director God Mode; separate feature
7. **Global curriculum spine editing** — platform-owner only; not a V1 director capability
8. **Voice wake phrase** (`donnaVoiceRuntime.ts` has this but it is not wired) — defer post-demo
9. **Proactive DONNA notifications** — DONNA responds to questions; she does not initiate outside of conversation mode greetings

---

## Protection Constraints (Non-Negotiable)

| Constraint | Rule |
|---|---|
| Migrations | None unless explicitly approved in sprint prompt |
| Sprint 904 approve/reject actions | Do not modify |
| `execute_curriculum_override()` | Never called from UI |
| `proposed_actions` | Only via existing `donnaSentinelAction.ts` path |
| Global curriculum spine | Never mutated |
| Parent/player messages | Never auto-published |
| Roster/level/billing changes | Never auto-applied |
| New npm packages | Not allowed without approval |
| Service role usage | Never bypass RLS in any query |

---

## File Impact Summary

| File | Sprint(s) | Change type |
|---|---|---|
| `src/lib/actions/curriculumDraftActions.ts` | 912.13 | Add pending count to return type |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | 912.13, 912.14, 912.15, 912.17, 912.19 | Multiple additive touches |
| `src/lib/donna/donnaPageContextEngine.ts` | 912.14, 912.18 | Interface extension + new function |
| `src/lib/donna/donnaChatSessionMemory.ts` | 912.15 | Documentation only |
| `src/components/nav/SidebarNav.tsx` | 912.16 | DONNA nav item elevation |
| `src/app/director/donna/DonnaDirectorShellClient.tsx` | 912.16, 912.17 | Entry point + brief data prop |
| `src/lib/donna/directorDashboardDonnaAnswer.ts` | 912.17 | Brief data integration |
| `src/app/api/donna/brief/route.ts` | 912.19 | Add curriculum draft count |
| `src/lib/donna/reviewQueueDonnaAnswer.ts` | 912.19 | NEW — review queue breakdown |
| `docs/QA_DONNA_GOD_MODE_V1.md` | 912.20 | NEW — QA document |
| `docs/CHANGELOG.md` | Each sprint | Dated entry |

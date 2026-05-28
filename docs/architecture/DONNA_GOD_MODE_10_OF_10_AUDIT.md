# DONNA God Mode 10/10 Audit
**Date:** 2026-05-28
**Sprint:** 912.13 (Audit Phase)
**Auditor:** Claude Code — static analysis of Sprints 912.1–912.12 implementation
**Previous baseline:** DONNA_GOD_MODE_AUDIT_V1.md — 6.0/10 as of Sprint 912.1

---

## Executive Summary

After Sprints 912.1–912.12, DONNA has advanced from **6.0/10 to approximately 6.8/10**. The curriculum draft loop is genuinely excellent — drill, gate, and skill creation with multi-turn slot fill, all-level extraction, confirmation wiring, and router.refresh() are complete and QA-verified. The conversation state machine (Sprint 912.3), continuous listening loop (Sprint 912.4), TTS interruption (Sprint 912.5), page-aware greetings (Sprint 912.6), and dual-store pending confirmation (Sprint 912.7) are all implemented and working.

**Critical finding:** The God Mode shell (`DonnaVoiceReadyShell` with all 912.x features) lives exclusively on the `/director/donna` dedicated page. The **main director layout still mounts `DonnaAssistantButton`** — the legacy floating panel that has none of the God Mode features. A director using the floating button on any other page gets the old experience. This is the single largest gap for demo and pilot readiness.

**Overall current score: 6.8/10**

---

## Category 1 — Continuous Conversation

**Score: 8/10**

### Evidence from code

`useDonnaConversationMode.ts` — complete state machine with `DonnaGodModeState` union of 9 states.

`DonnaVoiceReadyShell.tsx` —
- `scheduleAutoListen()` restarts mic 400ms after TTS `done` when `conversationMode` is on
- `MAX_NO_SPEECH_RETRIES = 3` guard pauses auto-listen after 3 consecutive no-speech errors
- `handleVoiceToggle()` stops TTS and starts mic immediately when director presses mic while DONNA speaks
- `handleStopSpeaking()` calls `scheduleAutoListen()` after explicit stop — conversation mode preserved
- Pause/Resume controls visible in conversation mode header
- State labels: "Listening…", "Thinking…", "Speaking…", "Auto-listening…", "Waiting for your confirmation", "Creating draft…", "Paused"

### What is working

- Conversation mode toggle exists and works
- Auto-listen loop: TTS done → 400ms gap → mic restarts
- TTS interruption: mic press stops TTS, starts mic immediately
- 3-retry no-speech guard prevents runaway loops
- Pause state is stable and obvious
- All 8 states have visible labels and colored indicators

### What is missing

- No visual "Conversation Mode on" ambient indicator outside the DONNA panel (while using other director pages in the floating button, nothing indicates DONNA is in a special mode)
- The auto-listen experience requires browser Web Speech API — Safari and some mobile browsers may not support it; this is not detected early enough
- `computeGodModeState` priority order: `paused` → `awaiting_confirmation` → but `isAutoListening` is checked AFTER `voiceIsListening`, so the `auto_listening` label only appears in the brief gap before the mic opens. This is correct but the label is rarely visible.
- No voice activity detection — long silences require the 3-retry cycle to pause, not immediate detection

### Risk level: Low

Core loop is solid. Edge cases (Safari, no-speech timeout) are handled.

### Required fix

None critical for V1. Suggested: detect Web Speech API unsupported state at conversation mode enable time and show a warning rather than letting auto-listen silently fail.

### Suggested sprint: 912.20 (QA polish)

---

## Category 2 — Page Guide Mode / ChatGPT for the Academy

**Score: 6/10**

### Evidence from code

`donnaPageContextEngine.ts` — 20+ routes mapped with `getPageCapabilityMap()`. Functions `whereAmI()`, `whatCanYouHelpWith()`, `whatShouldIInspectFirst()`, `whatActionsRequireApproval()`, `whatShouldINotDo()` are defined.

`DonnaVoiceReadyShell.tsx` — page-aware greeting injected via `useEffect` on `conv.conversationMode` + `pathname` change (Sprint 912.6). Fallback router (`routeDonnaPrompt`) handles `use_page_context` mode.

### What is working

- DONNA announces the page when conversation mode activates: "You're on [Page Label]. [Director intent]. What would you like to do?"
- DONNA announces page when director navigates while conversation mode is on
- Page capability map covers all major director routes including dynamic routes
- Fallback router responds to "what can I do here?" via `use_page_context` mode

### What is missing

- **Critical gap:** `whereAmI()`, `whatCanYouHelpWith()`, `whatActionsRequireApproval()`, `whatShouldINotDo()` exist in `donnaPageContextEngine.ts` but are NOT called from `handleSend()`. A director asking "What is this page?" goes through the fallback router pipeline, not a dedicated page-guide intent. The answer works but is less precise than if these functions were directly wired.
- No dedicated `explain_page` intent intercept before the router fallback
- No "What is the most important task here?" intercept that uses `page.reviewRequiredActions` data
- No "What should I NOT do here?" intent routing to `whatShouldINotDo()`
- No "What is risky here?" routing
- Empty state guidance per page is in `dataFallback` but not surfaced proactively

### Risk level: Medium

Director asks "what should I do here?" and gets a useful but not optimal answer (via fallback router, not direct intent). Not broken — just not precise.

### Required fix

Add explicit `explain_page` / `guide_workflow` intercept in `handleSend()` before the fallback router. Wire to existing `whereAmI()`, `whatCanYouHelpWith()`, `whatActionsRequireApproval()`.

### Suggested sprint: 912.14

---

## Category 3 — Page Intelligence Map

**Score: 7/10**

### Evidence from code

`donnaPageContextEngine.ts` — `DonnaPageCapabilityMap` interface with 8 fields:
- `route`, `pageLabel`, `directorIntent`, `safeContext`, `suggestedPrompts`, `allowedAnswerTypes`, `reviewRequiredActions`, `blocked`, `dataFallback`

20+ pages mapped. Parameterized routes handled. Coach routes included.

### What is working

- Typed, reusable, consistently applied
- Covers all core director and coach paths
- Each entry defines intent, context, blocked actions, and fallback
- `blocked` array is per-page — enables per-page safety guidance
- `reviewRequiredActions` per-page — enables DONNA to say "these actions need approval on this page"

### What is missing

Per the God Mode spec, the map should have 11 fields. Current map has 9. Missing:
- `available_donna_commands` — explicit list of DONNA actions available on this page (vs free-text `allowedAnswerTypes`)
- `recommended_next_step` — DONNA's proactive suggestion for what to do if the director just arrived with nothing in mind
- `empty_state_guidance` — what to say when the page has no data yet
- `primary_user_goal` — separate from `directorIntent` (intent is context; goal is the one thing to accomplish)

The `dataFallback` field partially covers `empty_state_guidance` but is less structured.

### Risk level: Low

The map is solid. Adding fields is additive and non-breaking.

### Required fix

Extend `DonnaPageCapabilityMap` interface with `primaryGoal`, `availableDonnaCommands`, `recommendedNextStep`, `emptyStateGuidance`. Populate for each existing entry. Low risk — additive change.

### Suggested sprint: 912.14 (alongside Page Guide Mode intent routing)

---

## Category 4 — Intent Routing

**Score: 6/10**

### Evidence from code

`handleSend()` pipeline has 24 intercept layers in priority order (see DONNA_GOD_MODE_AUDIT_V1.md §14 for full list, still accurate). Sprint 912.8–912.12 added drill/gate/skill creation handlers before the fallback.

### What is working

- Comprehensive coverage: KPI, dashboard priority, player attention, coach health, curriculum drafts, session adjustments, coach cues, data quality, recent decisions, player stall, template drafts, fitness drafts, curriculum impact/level questions
- Confirmation (yes/no) and cancellation routing works
- Slot-fill routing (what level? what focus?) works
- Orphaned confirm guard ("do it" with nothing pending) works
- Stale action detection and clean messaging works

### What is missing

The God Mode spec defines 10 intent types that should be classified:

| Intent | Implemented | Notes |
|---|---|---|
| `question` | Partial | Falls through to various interceptors |
| `explain_page` | Not directly | Goes to fallback router `use_page_context` mode |
| `guide_workflow` | Not directly | No explicit "walk me through" routing |
| `create_curriculum_draft` | ✅ | Drill/gate/skill fully wired (912.8–912.11) |
| `review_queue_guidance` | Partial | `show_pending_reviews` via safe-read, not named intent |
| `onboarding_guidance` | Not built | No onboarding-specific routing |
| `confirm_action` | ✅ | Sprint 912.3 |
| `cancel_action` | ✅ | Sprint 912.3 |
| `unsafe_request` | Partial | `checkQuestionBoundary()` + `blocked` phrases work |
| `unknown` | ✅ | Fallback message with suggestions |

All routing is regex/keyword-based. No LLM intent classification. Complex or ambiguous intents fall through to `ask_clarification` or generic fallback.

`getRecentTurns(3)` is available in `donnaChatSessionMemory.ts` but **never called** in the routing pipeline. Previous turns are recorded but never used to disambiguate "do that again" or "for the next level".

### Risk level: Medium

Missing explicit `explain_page` and `onboarding_guidance` intents means some director questions get suboptimal answers (routed to fallback instead of the precise helper function).

### Required fix

1. Add `explain_page` intercept routing to `whereAmI()` and `whatCanYouHelpWith()`
2. Add `onboarding_guidance` intercept for `/director/onboarding` paths
3. Inject `getRecentTurns(3)` into routing context for follow-up disambiguation

### Suggested sprint: 912.14, 912.15

---

## Category 5 — Curriculum Draft Loop

**Score: 9/10**

### Evidence from code

Fully verified in QA docs `912.10`, `912.11`, `912.12`. All scenarios pass.

### What is working

- Drill creation: one-turn and multi-turn slot fill ✅
- Gate creation: one-turn and multi-turn slot fill ✅
- Skill creation: one-turn and multi-turn slot fill ✅
- All 15 levels extract correctly (Red/Orange/Green/Yellow/HP numbered + bare fallbacks) ✅
- Green Ball / Green Dot variants handled ✅
- Level resolution via ILIKE prefix fix (`Orange 2%` → `Orange 2 — Direction`) ✅
- Draft status always `pending_review` — never auto-approved ✅
- `router.refresh()` fires after success to update CurriculumBuilderChangeQueue ✅
- `revalidatePath` + `router.refresh()` = server + client cache invalidated ✅
- Confirmation banner visible with action description ✅
- Cancel in slot-fill and cancel in confirmation both clean ✅
- Stale action detection (10-min TTL) ✅
- Failure states surface real error messages, no fake success ✅
- Sprint 904 approve/reject actions untouched ✅

### What is missing

- Missions (`'mission'`) and badges (`'badge'`) are not wired to the slot-fill confirmation loop. These content types exist in `VALID_CONTENT_TYPES` but have no pattern detection or intent routing.
- No `coachCue` or `description` auto-population (draft title is `"${focusArea} ${contentLabel}"` — functional but minimal)
- No success notification on the curriculum builder page itself (DONNA's success message is in the chat; director must notice the queue refreshed)

### Risk level: Low

Core loop is production-quality. Missing content types (missions, badges) require migration 061 to be applied first.

### Required fix

None for V1 demo. Post-pilot: add missions/badges once migration 061 is applied.

### Suggested sprint: Post-pilot (not blocking)

---

## Category 6 — Review Queue / Safety Layer

**Score: 7/10**

### Evidence from code

`handleSend()` routes curriculum drafts to `pending_review` only. Sprint 904 `approveCurriculumOverrideDraft()` / `rejectCurriculumOverrideDraft()` untouched. `donnaSentinelAction.ts` path for player action drafts. `CurriculumBuilderChangeQueue` shows pending items.

### What is working

- All DONNA-created drafts land in `curriculum_overrides` with `status = 'pending_review'` ✅
- Director must explicitly approve via CurriculumChangeQueue UI ✅
- `proposed_actions` path for player advancement drafts ✅
- DONNA response says "draft is in your Review Center" + followUp link ✅
- Nav offer to Review Center set after draft creation ✅

### What is missing

- DONNA does not tell the director the **current count** of items in the curriculum review queue after a draft is created. Director sees "draft is in your Review Center" but not "you now have 3 items waiting". This requires a live DB query at the time of the success message.
- The brief API (`/api/donna/brief`) returns `pendingCount` (from `proposed_actions`) but this is NOT connected to the chat shell — it only feeds `DonnaDailyBriefCard` components.
- No "what is in my review queue right now?" direct query from DONNA chat — the `show_pending_reviews` safe-read action describes the queue but from `directorCtx` which may be stale.

### Risk level: Low

Review queue safety is solid. The missing feature (live count) is a UX polish issue, not a safety issue.

### Required fix

After curriculum draft success, call a lightweight server action to get the current pending curriculum draft count and include it in the success message: "Done. You now have 2 curriculum drafts waiting in your Review Center."

### Suggested sprint: 912.13

---

## Category 7 — Session Memory

**Score: 6/10**

### Evidence from code

`donnaChatSessionMemory.ts` — 30-turn in-memory singleton. `getRecentTurns(5)`, `getLastDonnaTurn()`, `getConversationContextSummary()`, `getContextualPrefix()` all available.

Sprint 912.7 — `SessionPendingAction` with 10-min TTL, survives client-side route changes, restored on component remount via `useEffect`.

Sprint 912.9 — `PendingDrillSlotFill` stored across turns for multi-turn slot fill.

### What is working

- Pending confirmation survives client-side navigation ✅
- Slot-fill state survives within a page session ✅
- 10-min TTL for pending actions ✅
- Stale action detection and clean messaging ✅
- "Do it" with nothing pending → clear "nothing to confirm" message ✅
- Hard reload limitation documented ✅
- Turn counter capped at 30 ✅

### What is missing

- `getRecentTurns(3)` is available but **never called in `handleSend()`**. DONNA records turns but never uses them.
- `getContextualPrefix()` returns `"Following up on that — "` but is never called.
- DONNA cannot say "As we discussed earlier — " or "Following up on the Orange 2 drill we were just talking about — "
- When director navigates away and comes back mid-slot-fill, slot-fill state is technically restored (module singleton persists), but DONNA does NOT re-announce the pending slot-fill on remount. Director may be confused if they navigate away mid-flow.
- No re-announcement of pending slot-fill on component remount (unlike pending confirmation which is re-announced via the banner).

### Risk level: Medium

Not using conversation history makes DONNA feel stateless even though memory is being recorded. This is the most noticeable gap in "conversational" feel.

### Required fix

1. Inject `getRecentTurns(3)` into the routing context at the start of `handleSend()`. Pass to the key intercept functions that would benefit from it (curriculum drafts, dashboard priority).
2. On component remount, if `hasPendingDrillSlotFill()`, add a reminder message that slot-fill is still waiting.

### Suggested sprint: 912.15

---

## Category 8 — Role and Permission Awareness

**Score: 7/10**

### Evidence from code

`donnaRoleBoundaries.ts` defines `DonnaRole` type. `checkQuestionBoundary()` in `donnaBoundaryResponses.ts`. `plainRole` derived from `role` prop. Coach DONNA shell uses `donnaRole="coach"`.

Director layout passes `directorCtx: DirectorDonnaContext | null`. Coach layout passes `coachCtx: CoachDonnaContext | null`.

### What is working

- Director questions blocked from coach-only context ✅
- Coach cannot access director-private fields ✅
- `plainRole` gating throughout `handleSend()` — most director-specific interceptors check `plainRole === 'director'` before firing ✅
- Role boundary message is clear and friendly ✅

### What is missing

- No explicit awareness of `platform_owner` vs `academy_director`. Global curriculum spine is director-editable but only platform owner can publish. DONNA does not distinguish these two roles — it just routes curriculum changes to `pending_review`.
- No explicit parent/player role gating at the DONNA shell level — if a parent were somehow routed to `DonnaVoiceReadyShell` with a permissive role, the boundary checks might not catch everything.
- No test for what happens when `directorCtx` is null (academy not yet set up). Most interceptors guard `if (directorCtx)` — this is correct but not tested across all 24 pipeline stages.

### Risk level: Low

Current role awareness is appropriate for V1. Platform owner vs academy director distinction is a future need.

### Required fix

None critical for V1. Document the null-directorCtx paths. Add platform-owner-specific messaging when needed.

### Suggested sprint: Post-pilot

---

## Category 9 — Live Data Awareness

**Score: 5/10**

### Evidence from code

`/api/donna/brief` queries: `proposed_actions` (pending count), `sessions` (today's count), `players` (pending placement + no level), `v_player_curriculum_summary` (advancement eligible).

`DonnaVoiceReadyShell` receives `directorCtx: DirectorDonnaContext | null` — used in KPI questions, dashboard priority, roster attention, coach health.

### What is working

- `directorCtx` provides curriculum state, player counts, session counts ✅
- KPI questions answered from `directorCtx` ✅
- Dashboard priority answered from `directorCtx` ✅
- Brief API queries real DB for pending counts ✅

### What is missing

- `directorCtx` is passed as a prop — it is **computed once at page load** and does not update in real time. After DONNA creates a draft, `directorCtx.advancementEligibleCount` does not change. After approving an item, the pending count in `directorCtx` is stale.
- **The brief API is completely disconnected from DONNA chat.** `DonnaDailyBriefCard` components use `/api/donna/brief` but DONNA in conversation has no access to the brief data. DONNA cannot say "You have 3 pending reviews today" based on live DB data from chat.
- DONNA does not know the live curriculum draft pending count (`curriculum_overrides` where `status = 'pending_review'`). She says "draft is in your Review Center" but cannot say "you now have 2 drafts waiting."
- DONNA does not know the current academy setup completion percentage in real-time from chat.

### Risk level: Medium

DONNA may give outdated counts when `directorCtx` is stale. Not a safety issue but creates trust gaps.

### Required fix

1. After curriculum draft creation success, call a minimal server action to get the current `curriculum_overrides` pending count and inject it into the success message.
2. Consider passing live brief data into `DonnaVoiceReadyShell` (or fetching it on demand in conversation).

### Suggested sprint: 912.13

---

## Category 10 — Low Cognitive Load UX

**Score: 7/10**

### Evidence from code

`DonnaVoiceReadyShell.tsx` renders the conversation mode header bar with:
- State label (left) with colored animated dot
- Pause/Resume button (right, when conversation mode on)
- "Conv Mode" toggle button (always visible for director)

Awaiting confirmation banner (orange, with description + "Say yes or no" hint).

Speaking indicator with Stop button.

Listening indicator with interim transcript.

Voice error with Retry button.

### What is working

- All 8 states have distinct colors and labels ✅
- Awaiting confirmation is unmistakable (orange banner + description) ✅
- Speaking indicator has stop button ✅
- Listening shows interim transcript ✅
- Error has retry ✅
- Quick action chips for first 2 messages ✅

### What is missing

- **"Conv Mode" label is cryptic.** A director unfamiliar with the system will not know what "Conv Mode" means. Should be "Conversation Mode" or at least have a tooltip that is more descriptive than "Turn on Conversation Mode — DONNA listens after each response" (current tooltip is actually good, but the button text itself is unclear).
- **Entry point ambiguity.** The God Mode shell is on `/director/donna`. The floating button (available from any director page) uses the old architecture. A director on the Players page clicking the floating button gets the old DONNA. A director on `/director/donna` gets God Mode. This is confusing.
- Quick action chips disappear after 2 messages — useful shortcuts gone quickly.
- The shell is `h-[580px]` fixed height — may feel cramped on shorter screens.
- No "DONNA is active" ambient indicator in the sidebar when conversation mode is on.

### Risk level: Medium

The "Conv Mode" button and the split entry point architecture are the main friction points for a first-time director.

### Required fix

1. Rename "Conv Mode" to "Conversation" or expand to full label
2. Resolve the two-shell architecture (see Category 12)

### Suggested sprint: 912.16

---

## Category 11 — Failure Handling

**Score: 8/10**

### Evidence from code

From `DonnaVoiceReadyShell.tsx`:
- `voice.error === 'unsupported'` → text-only mode suggestion
- `voice.error !== 'unsupported'` → red bar with Retry
- `isSpeaking` clears on TTS callback `'done' | 'error'`
- `STRONG_CONFIRM_PATTERN` orphan guard
- Stale action detection with TTL
- Level not found → clean error message from server action
- Fallback message has suggestions ("say 'help' for suggestions")

### What is working

- All documented failure modes in V1 audit still handled ✅
- Curriculum draft failures surface real error messages ✅
- Invalid level → ask again with examples ✅
- Vague answer → ask again with examples ✅
- No-speech loop → 3 retries then pause ✅
- Stale pending action → "timed out, restate" ✅
- DB lookup failure → server action returns `{ ok: false, error: ... }` → displayed in chat ✅

### What is missing

- No explicit handling for `directorCtx` fetch failure — if the server component that passes `directorCtx` fails, DONNA silently gets `null` and all `directorCtx`-gated answers return nothing (fall through to fallback). No "data loading, please wait" message.
- No explicit `unsupported_action` response (separate from `unsafe_request`). When a director asks something DONNA understands but can't do yet (e.g., "send an email to all parents"), it hits the generic fallback, not a "I understand but can't do that yet" response.
- Web Speech API support check only happens when mic is pressed — not proactively at conversation mode enable.

### Risk level: Low

Failure handling is robust. Edge cases are minor.

### Required fix

Add a `null` `directorCtx` check at the beginning of `handleSend()` with a helpful "data loading" message when context is missing for a question that requires it.

### Suggested sprint: 912.13 (low-effort addition)

---

## Category 12 — Demo Readiness

**Score: 5/10**

### Evidence from code

`DirectorLayout.tsx` mounts `DonnaAssistantButton` (the legacy floating panel). This is the entry point every director sees on every page. `DonnaVoiceReadyShell` (with all God Mode features) is only mounted on the `/director/donna` page.

### What is working

- Curriculum draft loop is solid for demo ✅
- Confirmation flow is clear ✅
- Review Center link after draft creation ✅
- "What should I do here?" via dashboard priority intercept (if director uses /director/donna page) ✅
- Sprint 904 approve/reject preserved ✅

### What is missing

**This is the single highest-priority demo gap.**

When Brian opens the floating button on the Director Dashboard, Players page, or any other director page, he gets `DonnaAssistantButton` — the old architecture with:
- No conversation mode toggle
- No page-aware greetings
- No curriculum draft confirmation loop (Sprint 912.8–912.12 features)
- No await-confirmation banner
- No state machine labels
- Different UX entirely

A demo that shows "watch DONNA on the curriculum builder" works only if Brian navigates to `/director/donna` and uses the conversation from there. If he uses the floating button on the curriculum builder page, the experience is 2 generations behind.

The golden demo loop requires:
1. Director opens floating button on curriculum builder → expects conversation mode ❌
2. Director says "add a drill for Orange 2 focused on forehand prep" → expects confirmation loop ❌ (only works from /director/donna)
3. Director says "yes" → expects draft created + queue refresh ❌

### Risk level: Critical for demo

### Required fix

**Either:**
(A) Replace `DonnaAssistantButton` in director layout with a lightweight wrapper that mounts `DonnaVoiceReadyShell` in a slide-over panel with the full God Mode features, OR
(B) Add a prominent "Open DONNA" button/link in the sidebar and on the curriculum builder that navigates to `/director/donna`, and make that the primary demo path.

Option B is lower-risk and can be done without touching the old `DonnaAssistantButton`.

### Suggested sprint: 912.16 (DONNA Main Entry Point Upgrade V1)

---

## Category 13 — AcademyOS Operating Intelligence

**Score: 5/10**

### Evidence from code

DONNA can answer questions across: sessions, players, curriculum, coach health, review queue, templates, KPIs, placement, data quality, recent decisions, player stall detection.

### What is working

- Connects curriculum drafts → review queue ✅
- Connects player readiness → advancement draft ✅
- Connects sessions → coach cue guidance ✅
- Answers across 10+ module domains ✅

### What is missing

- **No "what needs my attention today?" aggregated brief from DONNA in conversation.** The `/api/donna/brief` data (pending reviews, today's sessions, placements, advancement eligible) is not available in the chat routing pipeline. DONNA cannot say "You have 2 pending reviews, 3 sessions today, and 1 player ready for advancement — start with the reviews."
- **Session memory not used for continuity.** DONNA can't say "earlier you asked about Orange 2 — do you want to add a drill there too?"
- **Coach notes/wrap-ups not connected.** DONNA cannot surface "Coach Maria submitted a wrap-up for today's session — want to review it?"
- **Parent/player outputs not connected.** DONNA cannot say "Sarah's parent update is waiting for your approval."
- DONNA is still primarily a chat panel + curriculum helper. She hasn't yet become the operating layer that sees across all modules simultaneously.

### Risk level: High for long-term vision, Low for V1 demo

The V1 demo can show the curriculum draft loop and "what needs attention?" from `directorCtx`. The full operating intelligence is a Sprint 912.17–912.20+ goal.

### Required fix

Sprint 912.17: Wire `/api/donna/brief` data (or equivalent fast query) into the DONNA chat routing pipeline so DONNA can answer "what needs my attention today?" from live DB data.

### Suggested sprint: 912.17

---

## Final Rating Table

| Dimension | Score | Notes |
|---|---|---|
| **Continuous Conversation** | 8/10 | Loop built, working, safety guards in place |
| **Page Guide Mode** | 6/10 | Functions exist, not wired to explicit intents |
| **Page Intelligence Map** | 7/10 | Good map, missing 3 fields from spec |
| **Intent Routing** | 6/10 | 24 interceptors, regex-based, no context injection |
| **Curriculum Draft Loop** | 9/10 | Excellent. All levels, all types, confirmation, refresh |
| **Review Queue / Safety** | 7/10 | Safe, missing live count in success messages |
| **Session Memory** | 6/10 | Recorded but never injected into routing |
| **Role and Permission Awareness** | 7/10 | Director/coach gated; platform-owner not yet needed |
| **Live Data Awareness** | 5/10 | directorCtx stale; brief API disconnected from chat |
| **Low Cognitive Load UX** | 7/10 | Good states; "Conv Mode" cryptic; two-shell problem |
| **Failure Handling** | 8/10 | Robust; null ctx edge case minor gap |
| **Demo Readiness** | 5/10 | God Mode features on wrong shell for demo |
| **Operating Intelligence** | 5/10 | Multi-module answers work; aggregated brief missing |
| **OVERALL GOD MODE SCORE** | **6.8/10** | |

| Summary Metric | Score | Notes |
|---|---|---|
| **Current DONNA God Mode Score** | 6.8/10 | Up from 6.0 at 912.1 |
| **Director Demo Readiness Score** | 5.5/10 | Critical: God Mode features on /director/donna only |
| **Brian Test Readiness Score** | 5.0/10 | Two-shell split blocks the golden demo loop |
| **Two-Family Pilot Readiness Score** | 5.5/10 | Need main layout entry point fixed first |
| **Risk Score** | 7/10 | Safety infrastructure solid; live data gaps are UX not safety |
| **UX Confidence Score** | 6.5/10 | Good states; ambiguous entry point; "Conv Mode" label |

---

## What DONNA Can Do Now

1. Create curriculum drafts (drills, gates, skills) via voice or text — multi-turn slot fill
2. Extract any of 15 curriculum levels including Green Ball / Green Dot variants
3. Run a full conversation with auto-listen loop (from /director/donna page)
4. Page-aware greetings on conversation mode activate
5. Pause/resume/interrupt TTS during conversation
6. Pending confirmation survives route changes (10-min TTL)
7. Route draft creation through review queue — never auto-approve
8. Answer KPI, dashboard priority, player attention, coach health, data quality questions
9. Draft player advancement proposals (via proposed_actions)
10. Navigate director to the right page with yes/no confirmation
11. Show state labels (listening, thinking, speaking, paused, awaiting confirmation)
12. Handle cancel/retry/orphan-confirm edge cases cleanly

## What DONNA Cannot Do Yet

1. Operate at God Mode from the main layout floating button (only from /director/donna page)
2. Use prior conversation turns to feel continuous ("as we discussed earlier")
3. Answer "what needs my attention today?" from live DB data in conversation
4. Directly answer "what is this page?" with the precise `whereAmI()` function (uses fallback router instead)
5. Guide director through onboarding setup in conversation
6. Surface live curriculum pending count after draft creation
7. Announce pending slot-fill state after route change remount
8. Create missions or badges (missing content type routing + migration 061 not applied)
9. Connect coach wrap-up submissions to director attention signal in chat
10. Present parent/player-safe draft guidance

## What DONNA Must Never Do

1. Call `execute_curriculum_override()` directly
2. Auto-approve any draft or proposed_action
3. Bypass the review queue for any mutation
4. Send parent/player communications without director approval
5. Auto-change player levels, rosters, billing, or placements
6. Present seed/demo data as real academy data
7. Expose player data to unauthorized roles
8. Hide mutations — all state changes go through `proposed_actions` or `curriculum_overrides`
9. Modify Sprint 904 approve/reject action paths
10. Use `proposed_actions` except via existing `donnaSentinelAction.ts` path

---

## What is Needed for 9/10

1. **Fix the two-shell architecture** — God Mode features accessible from main layout entry point
2. **Wire `getRecentTurns(3)` into routing** — DONNA feels continuous, not amnesiac
3. **Add `explain_page` intent routing** — `whereAmI()` and `whatCanYouHelpWith()` called directly
4. **Wire brief API data into chat** — DONNA knows live pending counts in conversation
5. **Add `recommendedNextStep` to page map** — DONNA proactively guides when director has no specific question

## What is Needed for 9.5/10

1. **Onboarding guide mode** — DONNA walks director through setup steps in conversation
2. **Review queue intelligence** — "You have X curriculum drafts, Y player proposals, Z wrap-ups pending"
3. **Context injection throughout routing** — topics discussed influence answers
4. **"Conv Mode" label upgrade** — clearer button text and tooltip

## What is Needed for 10/10

1. **Full operating intelligence** — aggregated signal across all modules in one DONNA brief
2. **Coach notes → director attention** — DONNA surfaces wrap-ups and observations
3. **Parent/player output awareness** — DONNA knows what parent updates are pending
4. **Ambient "DONNA active" state** — visible indicator when conversation mode is on while browsing
5. **Session continuity** — conversation context survives meaningful navigation patterns

---

## Top 10 Gaps (Ranked by Impact)

| Rank | Gap | Impact | Sprint |
|---|---|---|---|
| 1 | God Mode shell isolated to /director/donna — main layout uses old DonnaAssistantButton | Critical: demo loop broken | 912.16 |
| 2 | `getRecentTurns(3)` never injected into routing — DONNA feels amnesiac | High: conversational continuity | 912.15 |
| 3 | No `explain_page` intent routing — `whereAmI()` / `whatCanYouHelpWith()` not wired to handleSend | High: page guide mode | 912.14 |
| 4 | Brief API disconnected from chat — DONNA can't say "3 items pending" from live DB in conversation | High: operating intelligence | 912.13 |
| 5 | Live curriculum pending count missing from draft success messages | Medium: post-draft UX | 912.13 |
| 6 | No "what needs attention today?" aggregated brief in DONNA conversation | Medium: operating intelligence | 912.17 |
| 7 | "Conv Mode" label cryptic — unclear to a first-time director | Medium: UX trust | 912.16 |
| 8 | No onboarding guide mode — DONNA passive on /director/onboarding | Medium: pilot UX | 912.18 |
| 9 | Page map missing `recommendedNextStep`, `availableDonnaCommands`, `primaryGoal` fields | Low: guide mode precision | 912.14 |
| 10 | Pending slot-fill not re-announced on remount after route change | Low: slot-fill edge case | 912.15 |

## Top 10 Highest-Leverage Fixes (Ordered by Leverage)

| Rank | Fix | Effort | Leverage |
|---|---|---|---|
| 1 | Wire God Mode shell to main layout entry point (or make /director/donna the primary demo path with clear entry) | Medium | Demo-critical |
| 2 | Inject `getRecentTurns(3)` into key intercept functions | Low | Immediate conversational feel |
| 3 | Add `explain_page` intent routing (3–4 regex patterns → call `whereAmI()`) | Low | Page guide mode |
| 4 | Add live curriculum pending count to draft success messages | Low | UX trust after draft creation |
| 5 | Wire brief API data to DONNA chat (or pass it via directorCtx) | Medium | Operating intelligence |
| 6 | Add `recommendedNextStep` to page capability map and surface it in page greeting | Low | Proactive guidance |
| 7 | Rename "Conv Mode" → "Conversation" | Trivial | UX trust |
| 8 | Add null-directorCtx diagnostic message at top of handleSend | Low | Failure handling |
| 9 | Build "what needs attention today?" aggregated brief intercept | Medium | Operating intelligence |
| 10 | Add onboarding page guide mode intercept | Medium | Pilot UX |

---

## Demo and Pilot Readiness Assessment

### Is DONNA ready for Brian demo?

**No — but it is close.**

The curriculum draft loop, confirmation flow, and conversation mode are all solid on `/director/donna`. If the demo is structured as "let me show you the DONNA conversation experience" and Brian is guided to `/director/donna` first, it can work.

The problem: if Brian clicks the floating button on any other page (which is what any real user would do), he gets the old experience with no conversation mode and no curriculum draft confirmation loop.

**Recommendation:** Before the demo, either:
(A) Route the director sidebar "DONNA" link clearly to `/director/donna` and make it the primary entry point for the demo, or
(B) Sprint 912.16 to wire God Mode to the main layout.

### Is DONNA ready for two-family internal pilot?

**Partially — for a coached demo, yes. For unsupported testing, no.**

A coached pilot where the family watches Brian navigate AcademyOS can show DONNA's capabilities on `/director/donna`. An unsupported pilot where a second director tries DONNA on their own would expose the two-shell confusion immediately.

### Implementation decision

**Proceed with the 8-sprint completion plan.** The audit confirms: Sprint 912.13 (live DB + post-draft UX) should be next, followed by 912.14 (page guide mode intent routing), 912.15 (context injection), and 912.16 (main layout entry point) before any demo or pilot.

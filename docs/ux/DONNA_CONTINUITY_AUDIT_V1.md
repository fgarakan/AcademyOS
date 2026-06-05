# DONNA Continuity Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Verify and document DONNA's memory and continuity capabilities across context types.

---

## What Continuity Means

A director should be able to:

1. Ask DONNA a question on one page
2. Navigate to a different page
3. Continue the conversation without re-explaining context
4. Receive guidance that is aware of both the previous question and the new page

DONNA should remember. The director should not have to repeat themselves.

---

## Context Types Audited

| Context Type | Description | Component responsible |
|---|---|---|
| Academy context | Academy name, academy ID, pending count, health signals | `DonnaSessionContextProvider` |
| Page context | Current route, page-level signals | `usePathname()` in each DONNA component |
| Player profile context | Active player — name, level, signals | `PlayerProfileDonnaRegistrar` |
| Workflow context | Active task flow, in-progress draft | `donnaWorkflowMemory`, `donnaGoalMemory` |
| Conversation context | Messages sent and received in the current session | `DonnaChatThread`, `donnaConversationController` |
| Module context | Last DONNA module used (curriculum, review, placement) | `session.lastModule` |
| Object context | Last named entity (player name, level name, template name) | `session.lastObjectLabel` |

---

## Audit: Academy Context

**Test:** Does DONNA know the academy name, pending count, and health signals on every page?

**Verdict: Pass**

`DonnaAssistantButton` receives `academyId` and `directorName` from the director layout (server-provided). `DonnaCOOStatusWrapper` built `buildDonnaLiveContext()` with these values, but that wrapper is now removed. The floating shell continues to receive the same props directly from `layout.tsx`.

`buildDonnaLiveContext()` is called inside the floating shell with the current pathname and session context. Academy-level signals (pending count, high-risk player count) are available on every DONNA interaction.

**No gap introduced by this sprint.**

---

## Audit: Page Context

**Test:** When a director navigates, does DONNA become aware of the new page?

**Verdict: Pass (with note)**

`usePathname()` is used in:
- `DonnaCOOStatusWrapper` (now removed) — no longer needed
- `DonnaProactiveBriefCard` (now removed) — no longer needed
- `DonnaWakeWordLayer` — still active
- `DonnaAssistantButton` — still active; reads `usePathname()` via `resolvePageContext()`

`resolvePageContext(pathname)` in `donnaPageContextRegistry.ts` maps the current route to a DONNA context label. This provides the floating shell with page-aware context on every navigation.

**No gap introduced by this sprint.**

---

## Audit: Player Profile Context

**Test:** After viewing a player profile, does DONNA retain that player's context on a subsequent page?

**Verdict: Pass**

`PlayerProfileDonnaRegistrar` (in `src/app/director/players/[playerId]/_components/`) calls the `DonnaSessionContextProvider` context setter to register:
- `playerProfileContext.playerId`
- `playerProfileContext.playerName`
- `playerProfileContext.currentLevel`

This context persists in the React context tree until:
- A new player profile is registered (navigating to a different player)
- The director's session ends (full page reload)

**Test scenario: "Show me the player we discussed."**
If a director has navigated to a player profile during their session, the `session.playerProfileContext` will retain that player. The DONNA shell can use this to answer "show me the player we discussed" by returning the stored `playerName` and linking to their profile.

**Limitation:** There is no conversation memory that links an explicit "we discussed" statement to a player. If the director discussed a player via text in the DONNA shell (without visiting their profile), the context is in the conversation thread but not in `session.playerProfileContext`. This is a future improvement — not a regression.

---

## Audit: Workflow Context

**Test:** Can DONNA continue a partially-completed workflow after page navigation?

**Verdict: Pass (with note)**

`donnaWorkflowMemory.ts` and `donnaGoalMemory.ts` use `sessionStorage` to persist:
- Active workflow type
- Current step in multi-step workflows
- Goal state (e.g., "curriculum improvement in progress")

`DonnaProactiveBriefCard` (now removed) read from `donnaGoalMemory` to surface in-progress goals. After removal, this context is preserved in `sessionStorage` but is no longer surfaced as a passive banner. The floating DONNA shell still reads this context when opened.

**Test scenario: "Continue that curriculum improvement."**
The `DonnaGuidedWorkflowCard` inside the floating shell reads `donnaGoalMemory.getCurrentGoalState()`. If a curriculum improvement workflow was started, this state is present and DONNA can resume it.

**No gap introduced by this sprint.**

---

## Audit: Conversation Context

**Test:** Does DONNA retain conversation history during the session?

**Verdict: Pass**

The `DonnaChatThread` component inside `DonnaAssistantButton` maintains conversation state in React component state. This persists across page navigations because:

1. `DonnaAssistantButton` is mounted in `director/layout.tsx`
2. Next.js App Router preserves layout state across route changes
3. The panel open/closed state and the conversation thread state are both in the floating component

**Test scenario: "What was wrong with Orange Ball 2?"**
If the director asked about Orange Ball 2 earlier in the session, the message is in `DonnaChatThread`'s message array. DONNA's conversation controller (`donnaConversationController.ts`) can reference prior messages to answer follow-up questions.

**Limitation:** Context is not persisted to the database in V1. Session-end (reload, close tab) resets the conversation. Database persistence of conversation history is a future sprint.

---

## Audit: Module and Object Context

**Test:** When a director finishes interacting with DONNA on the curriculum page, does DONNA remember what they were working on?

**Verdict: Pass**

`session.lastModule` and `session.lastObjectLabel` are set by:
- `CurriculumDonnaRegistrar` — sets module to "curriculum" and object to the active level name
- `PlayerProfileDonnaRegistrar` — sets module to "player_profile" and object to the player's name

These values are read by `buildDonnaLiveContext()` and included in the context passed to the DONNA response engine.

**Test scenario: "Finish onboarding."**
If the director has been working through the onboarding flow, `session.lastModule` should reflect "onboarding". The `DonnaGuidedWorkflowCard` can resume the flow. However, if the director logs out and logs back in, session context resets and onboarding state must be re-established from the database (from `academies.settings`). The onboarding completion check in `director/layout.tsx` provides this.

---

## Continuity Test Suite

| Scenario | Expected behavior | Verdict |
|---|---|---|
| "Continue that curriculum improvement." | DONNA reads `donnaGoalMemory`, resumes improvement workflow for the last active level | Pass — context in sessionStorage |
| "Finish onboarding." | DONNA checks `academies.settings` for incomplete onboarding steps, guides through the next step | Pass — server state used |
| "Show me the player we discussed." | DONNA reads `session.playerProfileContext.playerName` and links to their profile | Pass — context in React state |
| "What was wrong with Orange Ball 2?" | DONNA reads conversation thread for prior Orange Ball 2 messages | Pass — thread in component state |
| Navigate away and return to DONNA | Conversation thread preserved; no re-greeting | Pass — layout-mounted component |
| Page reload | Context resets; DONNA greets fresh | Expected behavior — documented limitation |
| Two tabs open | Each tab has its own DONNA session; no cross-tab bleed | Pass — React state is tab-isolated |

---

## Limitations (Documented, Not Regressions)

| Limitation | Description | Future fix |
|---|---|---|
| Conversation not persisted to DB | Session end (reload/close) resets the thread | Sprint N+1 — DB-backed conversation storage |
| "We discussed" linking | Only works if player profile was visited, not just mentioned | Future — entity extraction from thread |
| Cross-session memory | Director can't ask "what did I work on last Tuesday?" | Future — DB-backed session log |
| Multi-entity context | DONNA only retains the last registered entity | Future — entity stack |

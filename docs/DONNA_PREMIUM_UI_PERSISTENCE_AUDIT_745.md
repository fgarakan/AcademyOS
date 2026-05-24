# DONNA Premium UI + Persistence Audit
**Sprint 745 — 2026-05-24**

---

## Purpose

This document audits the visible DONNA assistant interface against 10 premium UX criteria. It identifies what is causing scroll burden, cognitive overload, and non-premium feel — and records what was changed in Sprint 745 and what remains for future sprints.

---

## Scope

Two DONNA UIs exist in the codebase:

| UI | File | Mounted in |
|---|---|---|
| Sidebar floating panel | `src/components/assistant/DonnaAssistantButton.tsx` | `src/app/director/layout.tsx` — visible on every director page |
| Dedicated DONNA chat page | `src/components/donna/DonnaVoiceReadyShell.tsx` | `/director/donna` and `/coach/donna` pages |

**This audit focuses primarily on the sidebar floating panel** — it is the UI directors encounter on every screen and the source of the reported scroll burden and clutter.

---

## Part 1 — Current State Audit

### Sidebar Panel Body Sections (visible simultaneously)

When the DONNA panel is open, the scrollable body renders these sections stacked vertically in order:

1. **Greeting card** (`showGreeting`) — shown on first open of session. If intro not completed, shows the onboarding question ("What is your name?") even when director name is already set in auth profile.
2. **DonnaVoiceLayer** — Voice input card containing:
   - DONNA header label + description text
   - "DONNA says" response box (if a commandResponse exists)
   - Onboarding question spotlight (step 1)
   - Guided task question spotlight
   - VoiceInputButton (mic toggle)
   - Live interim transcript display
   - "DONNA heard — review before using" editable transcript
   - "DONNA heard" transcript display (after voice capture)
   - Primary text area input
   - Send button + safety note
   - Suggestion chips section
3. **DonnaWorkflowCards** — attendance exceptions, communication drafts, daily brief, attention report, onboarding suggestions, context summary
4. **Action preview card** — shown when route_to_review answers are produced
5. **Current context card** — **Always visible** (unless in create_template / guided_task / review_queue mode). Shows `ctx.screenName` + `ctx.assistantIntro` + approval required items. Duplicates info available in the Explain mode section.
6. **Guide me card** — shown when activeMode === 'guide'
7. **Explain this screen card** — shown when activeMode === 'explain'
8. **Find something card** — shown when activeMode === 'find'
9. **Template creation section** — shown when activeMode === 'create_template'
10. **Multi-step plan card** — shown when a multi-step plan is active
11. **Guided task / Generic draft panel** — shown when activeMode === 'guided_task'
12. **Review queue panel** — shown when activeMode === 'review_queue'
13. **Predictive suggestions** — shown when context is loaded
14. **"Ask about this page" button** — always visible (unless in workflow modes)
15. **Mode buttons section** — "What would you like?" + 5 mode buttons (Create Template, Guide me, Find, Capture, Explain) + Review Queue button
16. **Quick actions for this page** — contextual task shortcuts
17. **Voice quality status pill** — shown after TTS is used
18. **COO conversation thread** — shown when cooThread.length > 1
19. **Developer tools** — in non-production environments

### Panel Header (above scrollable body)

- DONNA icon
- "DONNA" title
- "Review-first" badge
- Multiple voice state pills (Speaking / Listening / Paused / Stopped / Ready / Mic blocked / Voice unavailable / Thinking)
- "Director Operations Assistant" subtitle
- "Review first. DONNA proposes — you approve." activation help text ← **redundant with footer**
- Review queue badge (if pending count > 0)

### Panel Footer (below scrollable body)

- "DONNA proposes. You approve. Always in control." (bold)
- "All actions go to your review queue before anything changes." (secondary) ← **same message as header activation help**

---

## Part 2 — Audit Against 10 Criteria

### 1. Visual Clarity — Score: 4/10

**Problems:**
- 3 simultaneous "response" surfaces: greeting card + "DONNA says" box in DonnaVoiceLayer + COO thread turns
- Multiple competing typography sizes and colors (violet, lime, purple, orange, red) in the same visible area
- Voice state pills in header multiply as voice state changes — can show 4+ pills simultaneously
- "Current context" card adds an always-visible information block that most directors don't read

**Target:** One primary response area (conversation thread). One input area. Status visible in one place.

---

### 2. Cognitive Load — Score: 3/10

**Problems:**
- Director sees 10–19 distinct UI blocks simultaneously in a single panel
- Mode buttons ("What would you like?") require scanning 5+ options every time the panel opens
- "DONNA says" appears in two separate UI zones (voice card AND greeting card)
- Activation help text in header + safety text in footer = same message twice
- Each workflow card (attendance, communication draft, daily brief, attention report) adds its own UI block

**Target:** 5 visible zones only (Header / Conversation / Suggested actions / Input bar / Footer).

---

### 3. Scroll Burden — Score: 3/10

**Problems (estimated scroll depths before reaching text input):**
- Greeting card: ~80px
- DonnaVoiceLayer voice section: ~280px (mic button, DONNA says, transcript, chips)
- Workflow cards: variable (0–400px depending on active workflows)
- Current context card: ~100px always visible
- "Ask about this page" button: ~60px
- Mode buttons section: ~300px (6 buttons with descriptions)

On a standard laptop with a 600px panel body, the text input area is often below the fold when any workflow card or mode is active.

**Root cause:** "Current context" card and Mode buttons section are always present and take substantial vertical space before the input area.

---

### 4. Repeated UI Elements — Score: 3/10

**Identified redundancies:**
- `DONNA_ACTIVATION_HELP` in header ("Review first. DONNA proposes — you approve.") duplicates footer text ("DONNA proposes. You approve. Always in control.")
- "DONNA says" block in DonnaVoiceLayer AND greeting card AND COO thread history
- "DONNA heard" appears in two separate JSX blocks in DonnaVoiceLayer (interim display vs. editable transcript)
- Review queue badge in header + "Review Today" tab chip + Review Queue mode button = three paths to the same action

---

### 5. Primary Action Clarity — Score: 5/10

**Problems:**
- The text area input is at the bottom of DonnaVoiceLayer, which is the 2nd section in the body
- When a commandResponse ("DONNA says") is active, it pushes the input further down
- When a workflow card is active, the input is below it
- The "Send" button is visible but not the most prominent element in the panel

**What works:** Tab chips at the top ("Review Today", "Ask Anything") provide direct shortcuts.

---

### 6. Voice State Clarity — Score: 6/10

**Problems:**
- Voice unavailable shows "Voice unavailable" pill in header + error text in DonnaVoiceLayer body, but no single clear "Retry mic" action
- Voice stopped shows "Stopped" pill in header but DonnaVoiceLayer doesn't surface a dedicated restart path
- On the DONNA chat page (`DonnaVoiceReadyShell`), voice errors show a red text banner with no retry button

**What works:** Voice status pills in header show real-time state changes. Mic button animates correctly.

---

### 7. Persistence Across Routes — Score: 7/10

**What works:** `DonnaSessionContextProvider` wraps the director layout and holds `panelOpen` in React state. State survives route changes within the director portal.

**Gap:** `panelOpen` is only in React state — it is NOT written to `sessionStorage`. On page refresh or tab restore, the panel resets to closed. The director must re-open DONNA after every browser refresh.

**Safe to persist:** Only the boolean open/closed state (`donnaPanelOpen`). No transcripts, no user data, no DB rows.

---

### 8. Name / Context Memory — Score: 5/10

**Problem:** The onboarding flow (step 0) asks "What is your name?" even when `directorName` is passed from the authenticated profile. The trigger is:

```ts
const introCompleted = sessionStorage.getItem('academyos:donna:introCompleted:v1') === 'true'
if (!introCompleted) {
  setOnboardingStep(0)  // ← asks for name
}
```

`introCompleted` is only set when the director completes step 1 of onboarding. On first session (before completing onboarding), `introCompleted` is `false` even though `directorName` is fully set from the auth profile.

**Result:** Brian Dabul (and any director with a profile display name) sees "What is your name?" on every new session until they complete the onboarding Q&A.

**What works:** Once `introCompleted` is set, `buildDonnaOpeningGreeting()` correctly uses `firstName` for greeting copy. The `donnaGreeting.ts` module correctly builds "Good morning, Brian" when `firstName` is provided.

---

### 9. Mobile Usability — Score: 5/10

**What works:** `DONNADirectorMobileCommandBar` replaces the floating button on mobile screens. Mobile-specific layout from Sprint 714.

**Gaps:**
- The panel body on mobile is still the same 19-section layout — scroll burden is worse on a smaller screen
- Current context card and mode buttons consume most of the mobile viewport before reaching input
- No dedicated mobile-first DONNA view (the `DonnaVoiceReadyShell` approach is closer to ideal)

---

### 10. Premium COO Feel — Score: 5/10

**Problems:**
- The panel feels like a developer debug drawer (multiple boxes with labels, status indicators, raw data)
- Multiple competing visual styles (violet voice card + lime response card + neutral mode buttons)
- Developer tools visible in development environment, adding debug content to the same scrolling area
- Footer is repetitive and paragraph-length, not a clean single-line safety badge

**What a 10/10 COO assistant would look like:**
- Chat thread is the dominant surface — messages fill the panel
- Status is one clean pill in the header (Ready / Listening / Thinking / Speaking)
- Quick action chips are 3–5 max, compact, below the thread
- Input is sticky at the bottom — always reachable
- Footer is one short line — safety badge, not a paragraph
- No "Current context" box, no mode buttons list, no COO thread below a voice card

---

## Part 3 — Target 5-Zone Panel Structure

```
┌─────────────────────────────────────────┐
│ A. HEADER                               │
│  · DONNA name + icon                   │
│  · Status pill: Ready / Listening / ... │
│  · Review-first badge                   │
│  · Close button                         │
├─────────────────────────────────────────┤
│ B. CONVERSATION AREA                    │
│  · Chat message thread                  │
│  · Latest DONNA response prominent      │
│  · Previous messages compact            │
│  · No separate "DONNA says" box         │
│  (scrollable — fills available space)  │
├─────────────────────────────────────────┤
│ C. SUGGESTED ACTIONS (3–5 chips max)    │
│  · "What needs attention?"             │
│  · "Review today"                      │
│  · "Find gaps"                         │
│  · Page-aware, role-aware              │
├─────────────────────────────────────────┤
│ D. VOICE / INPUT BAR (sticky bottom)    │
│  · Text input (always visible)         │
│  · Mic button (if voice supported)     │
│  · Send button                         │
├─────────────────────────────────────────┤
│ E. FOOTER (one line)                    │
│  "DONNA drafts. You approve."          │
└─────────────────────────────────────────┘
```

**Move to developer mode / collapsible:**
- Source labels and confidence scores
- Raw voice transcript display
- Last TTS info
- Debug IDs
- Voice diagnostics (retry count, watchdog status)
- Detailed voice output confirmation prompts

---

## Part 4 — What Was Changed in Sprint 745

### 1. `src/components/donna/DonnaSessionContextProvider.tsx`
**Added:** SSR-safe `sessionStorage` persistence for `donnaPanelOpen`.
- On mount: reads `donnaPanelOpen` from sessionStorage; sets `panelOpen = true` if stored.
- On every panelOpen change: writes `donnaPanelOpen` to sessionStorage.
- Stores only a boolean. No transcripts, no user data, no DB rows.

**Effect:** Panel stays open across browser refreshes within the same session. Closes persistently when director explicitly closes it.

---

### 2. `src/components/assistant/DonnaAssistantButton.tsx`

**Greeting fix:**
- **Before:** If `introCompleted` is false, always show "What is your name?" (step 0), even when `directorName` is already set from the auth profile.
- **After:** If `firstName` is already set (from auth profile), skip step 0 entirely. Mark intro as completed. Fall through to the normal daily greeting. If `firstName` is not set (no display name in profile), behavior is unchanged — skips name question and shows "Hi — how can I help?"

**Current context card removed:**
- Removed the always-visible "Current context" card from the default scrollable body. This card showed `ctx.screenName` + `ctx.assistantIntro` + approval required items. The same information is available in the dedicated "Explain this screen" mode section below, which renders when `activeMode === 'explain'`.
- **Scroll reduction:** Approximately 100–130px removed from the default view.

**Header simplified:**
- Removed `DONNA_ACTIVATION_HELP` text line from the panel header ("Review first. DONNA proposes — you approve."). This was the third text line in the header and duplicated the footer.
- Header now shows: DONNA icon, title, status pills, subtitle only.

**Footer simplified:**
- Changed from two-line footer to one-line: "DONNA drafts. You approve."
- Removed the secondary line ("All actions go to your review queue before anything changes.").
- Removes a duplicate of the header activation help text.

---

### 3. `src/components/assistant/DonnaVoiceLayer.tsx`

**Voice unavailable state improved:**
- Error text simplified to one clear line: "Voice is unavailable. You can type, or retry microphone."
- Dismiss button relabeled from ✕ to "Retry mic" — same handler, clearer affordance. Clears the error so the director can tap the voice button to retry.

---

### 4. `src/components/donna/DonnaVoiceReadyShell.tsx`

**Voice error with retry:**
- Added "Retry voice" button when `voice.error` is set and the error is not `'unsupported'`.
- Button calls `voice.reset()` to clear the error state and return to idle.
- Error copy simplified to one line.

---

## Part 5 — What Was NOT Changed

The following are intentionally out of scope for Sprint 745:

| Item | Reason |
|---|---|
| Godmode dispatch logic (`handleSend`, all intercept chains in DonnaVoiceReadyShell) | Architecture — preserve all intelligence |
| DonnaWorkflowCards | Out of scope — workflow cards serve specific tasks |
| Mode buttons section ("What would you like?") | Partial improvement (context card removed above it reduces scroll); full removal requires verifying all mode entry points still work |
| COO conversation thread (`cooThread`) | Not removed — provides history context |
| Developer tools | Already gated to `process.env.NODE_ENV !== 'production'` |
| TTS voice path | No changes — Sprint 731 TTS behavior preserved |
| Any migrations, RLS, or DB changes | Not applicable to UI sprint |
| `src/lib/donna/donnaGreeting.ts` | Already correct — `buildDonnaOpeningGreeting()` uses `firstName` properly |

---

## Part 6 — Remaining UI Gaps (Future Sprints)

| Gap | Impact | Suggested Sprint |
|---|---|---|
| Mode buttons section still shows 5+ options below input, adding scroll | Medium | Sprint 746: collapse to "More options" dropdown or remove from default view |
| "DONNA says" + greeting card still potentially both visible | Medium | Sprint 746: merge into a single message-thread approach (align with DonnaVoiceReadyShell pattern) |
| Full 5-zone layout requires wiring `DonnaVoiceReadyShell` into the sidebar panel | High | Sprint 747+: refactor the sidebar panel to use DonnaChatThread as primary surface |
| Mobile scroll burden | Medium | Sprint 746: reduce mode buttons and context card on mobile |
| Voice retry state in the panel header (click "Voice unavailable" pill to retry) | Low | Sprint 746 |
| "Ask about this page" button still visible by default | Low | Sprint 746: merge into suggested chips |
| COO thread shows old-style turn blocks, not chat bubbles | Medium | Sprint 747: unify with DonnaChatThread message format |

---

## Certification Update

**Sprint 745 changes do not affect DONNA Godmode intelligence score.**
All Godmode dispatch chains, data quality guardian, player stall detector, curriculum gap detection, and action drafting are fully intact.

UI score updated:
- Panel visual clarity: 4/10 → 5.5/10 (header simplified, context card removed, footer cleaned)
- Persistence: 7/10 → 8/10 (sessionStorage added)
- Name/context memory: 5/10 → 7.5/10 (name question fix)
- Voice state clarity: 6/10 → 7/10 (retry button added)

**Overall UI experience:** 4.5/10 → 6/10 (targeted improvements, full 5-zone layout is Sprint 747+ work)

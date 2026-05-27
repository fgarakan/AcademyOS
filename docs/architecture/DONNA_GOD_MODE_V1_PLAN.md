# DONNA God Mode V1 — Architecture Plan
**Date:** 2026-05-27
**Sprint:** 912.1
**Based on:** DONNA_GOD_MODE_AUDIT_V1.md

---

## Target Rating: 9.0–9.5/10

Director opens DONNA, toggles Conversation Mode on, speaks naturally through a workflow without repeatedly pressing the mic button.

---

## 1. DONNA Conversation State Machine

### States
```typescript
type DonnaGodModeState =
  | 'idle'                  // Panel open, conversation mode off, waiting
  | 'listening'             // Mic active, recording director input
  | 'thinking'              // DONNA is processing (isTyping)
  | 'speaking'              // TTS is playing DONNA response
  | 'auto_listening'        // Conversation mode on; mic restarted after speaking
  | 'awaiting_confirmation' // DONNA has proposed action, waiting for yes/no
  | 'executing'             // Draft being created/submitted
  | 'paused'                // Director paused conversation mode
  | 'error'                 // Voice or TTS error
```

### State Transitions
```
idle            → listening            [director presses mic]
idle            → auto_listening       [conversation mode turned on]
listening       → thinking             [voice transcript captured]
thinking        → speaking             [DONNA response ready, TTS starts]
thinking        → awaiting_confirmation [DONNA proposed action, needs yes/no]
speaking        → idle                 [TTS done, conversation mode off]
speaking        → auto_listening       [TTS done, conversation mode on]
auto_listening  → listening            [mic restarts, capture begins]
auto_listening  → paused              [director presses pause]
awaiting_confirmation → executing     [director confirms: yes/do it/confirm]
awaiting_confirmation → idle          [director cancels: no/cancel/never mind]
awaiting_confirmation → auto_listening [TTS of confirmation plays, then auto-listens]
executing       → speaking             [draft created, DONNA reports result]
paused          → auto_listening       [director resumes]
paused          → idle                 [director turns conversation mode off]
any_active      → error                [voice/TTS error]
error           → idle                 [director dismisses error]
error           → listening            [director retries mic]
```

---

## 2. Conversation Mode

### What it is
A director-facing toggle that makes DONNA automatically restart the microphone after each response.

### Behavior
- **On:** After TTS finishes (or after DONNA types if no voice), mic restarts automatically. DONNA enters `auto_listening` then `listening`.
- **Off:** After DONNA responds, returns to `idle`. Director presses mic manually for next turn (existing behavior preserved).
- **Toggle:** Visible chip/button in DONNA panel header.
- **Visual indicator:** When on, show "Conversation Mode" label with green animated dot.

### Implementation notes
- A single `conversationMode: boolean` state in `DonnaVoiceReadyShell`
- The TTS status callback `(status) => { if (status === 'done') ... }` is extended to trigger mic restart when `conversationMode` is on
- No change to existing button-triggered (off) behavior

---

## 3. Auto-listen After Response

### Current (Sprint 731)
TTS auto-plays if within 30s of voice input. After TTS done → `isSpeaking = false`. Nothing else.

### God Mode V1
After TTS `done` (or after `isTyping` clears if text-only):
```
if (conversationMode && state !== 'awaiting_confirmation') {
  setState('auto_listening')
  // brief 400ms pause for director to register DONNA finished
  setTimeout(() => { voice.reset(); voice.start(); setState('listening') }, 400)
}
```

### Safety
- Max restart attempts: 3 consecutive `no_speech` errors before pausing automatically
- If DONNA response contains a confirmation request (`pendingConfirmation !== null`), enter `awaiting_confirmation` instead of `auto_listening`
- Director can stop the loop at any time with the Pause button

---

## 4. Interruption Support

### Director presses mic while DONNA is speaking
Current: `handleVoiceToggle` stops TTS then starts mic. **Already works.** Surface more clearly in UI.

### Director says "stop" / "pause" / "wait"
Detected via short-phrase engine (`detectShortPhrase`). Add: `'stop', 'pause', 'wait', 'hold on'` → trigger mic stop + clear `conversationMode` temporarily (enter `paused` state).

### "Pause" button
Add a visible Pause button in the DONNA panel header when `conversationMode` is on. Clicking it:
1. Stops current TTS
2. Stops mic
3. Enters `paused` state
4. Changes to "Resume" button

### Resume
Clicking Resume returns to `auto_listening` → `listening`.

### Cancel current workflow
Detected via existing `CANCEL_PHRASES` in `donnaIntentRouter.ts`. When in `awaiting_confirmation`, "no" / "cancel" clears pending confirmation and returns to `auto_listening`.

---

## 5. Page-Aware Context

### Current
`getPageCapabilityMap(pathname)` exists. Only used in fallback router path.

### God Mode V1
When conversation mode is turned on **or** when the director navigates to a new page while conversation mode is on:
1. DONNA says: "You're on [Page Label]. [Director intent sentence]. What would you like to do?"
2. This replaces the current generic "Ready when you are" empty state.

### Implementation
Add a `useEffect` on `pathname` in `DonnaVoiceReadyShell`:
```typescript
useEffect(() => {
  if (!conversationMode) return
  const cap = getPageCapabilityMap(pathname)
  const greeting = `You're on ${cap.pageLabel}. ${cap.directorIntent}`
  addDonnaMessage(greeting)
  if (conversationMode) triggerTts(greeting)
}, [pathname]) // fires on route change
```

Also inject page context into routing decisions:
- Pass `pathname` to `tryAnswerCurriculumDraftProposal` so curriculum page requests are handled differently from dashboard requests.

---

## 6. Session Memory V1

### Current
`donnaChatSessionMemory` records turns but never injects them into routing.

### God Mode V1 additions
1. **Pending confirmation state** in session memory
   - `pendingConfirmation: DonnaPendingConfirmation | null` — stores a proposed action awaiting yes/no
   - Type: `{ actionType: string; description: string; executeFunction: () => Promise<void> | void }`
   - When set, `awaiting_confirmation` state is active
   - Voice yes/no → execute or clear

2. **Multi-turn curriculum draft** (extend existing `pendingTemplateDraft` pattern)
   - `pendingCurriculumDraft: CurriculumDraftInProgress | null`
   - Stores partial curriculum draft as director fills in required fields
   - Cleared when draft submitted or cancelled

3. **Context injection into routing**
   - `getRecentTurns(3)` called at start of routing pipeline
   - If last DONNA turn had an action ID, inject that as context for follow-up handling
   - Enables: "Do that" / "Yes, for Orange Ball 2" to resolve correctly

### What is NOT added
- No long-term persistence (localStorage, DB)
- No cross-session memory
- Resets safely on `clearChatSession()` call when conversation mode is turned off

---

## 7. Safe Director Intent Router V1

### New intent types to recognize
| Intent type | Example inputs |
|---|---|
| `confirm_action` | "yes", "do it", "confirm", "go ahead", "sounds good" |
| `cancel_action` | "no", "cancel", "never mind", "stop", "don't" |
| `explain_page` | "what is this page?", "what can I do here?", "explain this" |
| `guide_workflow` | "walk me through", "help me with", "how do I" |
| `create_curriculum_draft` | "add a drill", "add a gate", "add fitness exercise to Orange 2" |
| `modify_curriculum_draft_request` | "change that to forehand", "make it 30 minutes" |
| `review_queue_guidance` | "what needs my attention", "show pending" |
| `onboarding_guidance` | "walk me through setup", "help me onboard" |

### Routing rules
- `confirm_action` with `pendingConfirmation !== null` → execute and report
- `confirm_action` with no pending → "Nothing is waiting for your confirmation. What would you like to do?"
- `cancel_action` with `pendingConfirmation !== null` → clear pending, back to listening
- `cancel_action` with no pending → if in workflow, cancel; otherwise acknowledge
- `create_curriculum_draft` on curriculum pages → guided draft slot-filling (see Mini-Sprint 9)
- `create_curriculum_draft` on other pages → offer navigation to curriculum builder

---

## 8. Confirmation Loop V1

### Flow
```
Director: "Add a forehand prep drill to Orange Ball 2"
DONNA: "I can create a draft to add a forehand preparation drill to Orange Ball 2. 
        It will go to your Review Center for approval before anything changes.
        Should I create this draft?"
[state = awaiting_confirmation]
[pendingConfirmation = { actionType: 'curriculum_draft', description: '...', execute: fn }]

Director: "Yes"
[confirm_action detected, pendingConfirmation present]
DONNA: "Creating the draft now…"
[state = executing]
[execute pendingConfirmation.execute()]
DONNA: "Done. The draft is in your Review Center."
[state = speaking → auto_listening if conversationMode]
```

### Confirmation trigger conditions (DONNA proposes confirmation when)
- Creating a curriculum draft
- Creating a player advancement draft
- Creating any action via `submitDonnaActionDraft`

### No confirmation needed for
- Navigation offers (already using yes/no via `pendingNavOffer`)
- Answering questions
- Explaining pages
- Providing context

---

## 9. Curriculum Builder Conversation V1

### Goal
Director can say natural commands on the curriculum builder page and DONNA will:
1. Classify the intent as `create_curriculum_draft`
2. Identify the level (from text or page context)
3. Ask for missing required fields one at a time
4. Summarize the proposed draft
5. Ask for confirmation
6. On confirmation, call the existing draft action (`createCurriculumDraftAction` or equivalent)
7. Report success + offer to navigate to review queue

### Required slots for curriculum draft
- `levelId` — which level (resolved from text or page context)
- `contentType` — drill | fitness_exercise | assessment_gate | player_mission | badge
- `focusArea` — what aspect (forehand prep, serve, footwork, etc.)
- Optional: `description`, `coachCue`

### Slot-filling flow
- Extract from input text first (e.g. "Orange Ball 2" → levelId)
- Ask for missing ones individually
- Do not ask for optional fields in conversation mode (use defaults)

### Safety: what it does NOT do
- Does not call `execute_curriculum_override()` directly
- Does not auto-approve
- Only calls `createCurriculumDraftAction` → creates row in `curriculum_drafts` table with status `pending_review`
- Existing Sprint 904 approve/reject actions unchanged

---

## 10. Guided Onboarding Conversation V1

### DONNA behavior on `/director/onboarding`
- Detects page via `pathname`
- DONNA greets: "You're in Academy Setup. I'll walk you through each step. What have you completed so far?"
- Responds to questions about current setup status using `directorCtx`
- Guides to next incomplete step
- Does not auto-complete any onboarding step
- No writes — read-only guidance

---

## 11. DONNA Voice UI Polish V1

### Panel header changes
```
[ DONNA ● Director ]  [Conv Mode ●] [Pause]
```
- "Conversation Mode" toggle: shows green dot + label when on, grey when off
- "Pause" button: only visible when conversation mode is on
- State label under header: "Listening...", "Thinking...", "Speaking...", "Waiting for confirmation", "Paused"

### Visual states
| State | Indicator |
|---|---|
| idle | No indicator (clean) |
| listening | Green pulse dot + "Listening…" bar |
| thinking | Typing dots in chat |
| speaking | Purple pulse dot + "Speaking…" + Stop button |
| auto_listening | Subtle lime pulse at bottom of panel + "Auto-listening…" |
| awaiting_confirmation | Yellow/amber indicator + "Waiting for your confirmation" |
| paused | Grey dot + "Paused" + Resume button |
| error | Red bar + Retry button |

### Typography and colors
- All consistent with existing design system
- `lime` for active listening states
- `#8b5cf6` (purple) for speaking states
- `status-orange` for awaiting confirmation
- `text-muted` for paused

---

## 12. Mini-Sprint Breakdown

### 912.1 — DONNA God Mode Audit V1 ✅ DONE
- Created `docs/architecture/DONNA_GOD_MODE_AUDIT_V1.md`
- Created this plan

### 912.2 — DONNA Conversation State Foundation V1
**Files:**
- NEW: `src/lib/donna/useDonnaConversationMode.ts` — hook encapsulating conversation mode state, auto-listen loop, state machine
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — wire conversation mode toggle + new states
- MODIFY: `src/lib/donna/donnaChatSessionMemory.ts` — add `pendingConfirmation` field

**Acceptance:** State machine exists. Conversation mode toggle works. TypeScript clean.

### 912.3 — DONNA Continuous Listening Loop V1
**Files:**
- MODIFY: `src/lib/donna/useDonnaConversationMode.ts` — implement TTS done → auto-listen restart
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — wire new loop to existing TTS callback

**Acceptance:** When conversation mode on, mic restarts after TTS finishes. 3-retry guard on no_speech. No infinite loop.

### 912.4 — DONNA Stop / Interrupt Speaking V1
**Files:**
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — Pause button, improved interrupt handling

**Acceptance:** Pause button visible in conversation mode. Mic press stops TTS + starts mic. Paused state is obvious.

### 912.5 — DONNA Page-Aware Context V1
**Files:**
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — page change effect, greeting injection
- MODIFY: `src/lib/donna/donnaPageContextEngine.ts` — add greeting builder function if needed

**Acceptance:** On conversation mode start, DONNA announces current page. On navigation, DONNA updates. Existing routing unchanged.

### 912.6 — DONNA Session Memory V1
**Files:**
- MODIFY: `src/lib/donna/donnaChatSessionMemory.ts` — add `pendingConfirmation` type + helpers
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — wire pendingConfirmation state + yes/no detection

**Acceptance:** `awaiting_confirmation` state works. "Yes"/"No" resolve pending confirmation. Memory resets on mode off.

### 912.7 — DONNA Director Intent Router V1
**Files:**
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — add `confirm_action` and `cancel_action` routing before existing pipeline
- MODIFY: `src/lib/donna/donnaBoundaryResponses.ts` — add `explain_page` intent routing if needed

**Acceptance:** Confirm/cancel intents route correctly. Low-confidence inputs ask clarifying question. Safety-blocked inputs respond correctly.

### 912.8 — DONNA Confirmation Loop V1
**Files:**
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — `setPendingConfirmation()` before action, execute on confirmation

**Acceptance:** Before any draft creation, DONNA summarizes and asks for confirmation. Yes creates draft. No clears. Confirmation state visible.

### 912.9 — DONNA Curriculum Builder Conversation V1
**Files:**
- MODIFY: `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts` — upgrade from informational to guided draft with slot-filling
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — wire multi-turn curriculum draft state (extend `pendingTemplateDraft` pattern)
- MODIFY: `src/lib/donna/donnaChatSessionMemory.ts` — add `pendingCurriculumDraftSlots` field

**Acceptance:** Director can verbally create a curriculum draft in 2-3 turns. Draft appears in queue. Level name resolved. Queue refreshes.

### 912.10 — DONNA Guided Onboarding Conversation V1
**Files:**
- MODIFY: `src/lib/donna/donnaPageContextEngine.ts` — add onboarding page awareness
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — onboarding routing

**Acceptance:** On onboarding page, DONNA explains setup status. Guides to next step. No unsupported writes.

### 912.11 — DONNA Voice UI Polish V1
**Files:**
- MODIFY: `src/components/donna/DonnaVoiceReadyShell.tsx` — conversation mode header + state labels
- MODIFY: `src/components/donna/DonnaChatThread.tsx` — state label display in chat

**Acceptance:** All 8 states visible. Conversation mode toggle obvious. Stop/Pause obvious. Clean premium look.

### 912.12 — DONNA Safety QA + Final Rating V1
**Files:**
- CREATE: `docs/QA_DONNA_GOD_MODE_V1.md` — QA run document
- MODIFY: `src/lib/donna/donnaSafetyTestHarness.ts` — add new unsafe test inputs

**Acceptance:** All 11 unsafe inputs handled correctly. Rating ≥ 9.0/10.

---

## Implementation Constraints

| Constraint | Rule |
|---|---|
| Migrations | None allowed without explicit approval |
| Sprint 904 approve/reject actions | Do not modify |
| `execute_curriculum_override()` | Never called from UI |
| `proposed_actions` | Only via existing `donnaSentinelAction.ts` |
| Global curriculum spine | Never mutated |
| Parent/player messages | Never auto-published |
| Roster/level/billing changes | Never auto-applied |
| New npm packages | Not allowed without approval |

---

## File Change Summary

| File | Change type | Mini-sprint |
|---|---|---|
| `src/lib/donna/useDonnaConversationMode.ts` | NEW | 912.2 |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | MODIFY (multiple sprints) | 912.2–912.11 |
| `src/lib/donna/donnaChatSessionMemory.ts` | MODIFY (additive) | 912.2, 912.6, 912.9 |
| `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts` | MODIFY | 912.9 |
| `src/lib/donna/donnaPageContextEngine.ts` | MODIFY (additive) | 912.5, 912.10 |
| `src/components/donna/DonnaChatThread.tsx` | MODIFY (minor) | 912.11 |
| `src/lib/donna/donnaSafetyTestHarness.ts` | MODIFY | 912.12 |
| `docs/architecture/DONNA_GOD_MODE_AUDIT_V1.md` | NEW | 912.1 |
| `docs/architecture/DONNA_GOD_MODE_V1_PLAN.md` | NEW | 912.1 |
| `docs/QA_DONNA_GOD_MODE_V1.md` | NEW | 912.12 |
| `docs/CHANGELOG.md` | UPDATE | each sprint |

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Auto-listen loop runs forever | Max 3 consecutive no_speech retries before pausing |
| TTS + mic feedback loop | Mic auto-pauses when `isSpeaking` (Sprint 719 pattern, already in VoiceInputButton) |
| Duplicate DONNA messages | `lastSpokenIdRef` guard already in place; extend to auto-listen triggers |
| Curriculum draft bypasses review | Only creates draft row with `status: 'pending_review'`; no auto-approval |
| Memory grows too large | Session memory already capped at 30 turns |
| TypeScript errors in shell | `npx tsc --noEmit` after every mini-sprint |
| `DonnaVoiceReadyShell` becomes too complex | Extract `useDonnaConversationMode` hook to keep shell clean |

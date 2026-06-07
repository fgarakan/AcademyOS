# DONNA Unified Assistant Runtime — Certification Audit

**Sprint:** Mega Sprint 934–963A  
**Date:** 2026-06-07  
**Status:** V1 — Bridge implemented. Full routing unification deferred to 934–963B.  
**Author:** Claude Code  

---

## 1. Current DONNA Entry Points

AcademyOS has **two active DONNA surfaces** with partially overlapping but distinct routing chains.

### 1A — DonnaAssistantButton (Floating Panel)

**Files:** `src/components/assistant/DonnaAssistantButton.tsx`  
**Rendered in:** `src/app/director/layout.tsx` (director portal layout, always present)

Entry paths into DonnaAssistantButton:
- **"Hey Donna" wake word** — fires `donna:open` CustomEvent → `handleDonnaOpen()` listener opens panel + pre-fills input
- **Voice input inside panel** — `VoiceInputButton` SpeechRecognition → `onVoiceTranscriptRaw` → `handleCommandSubmit()`
- **Text input inside panel** — textarea onKeyDown / Send button → `handleCommandSubmit()`
- **External `donna:open` event** — any page component can pre-fill and auto-submit

**Command routing inside DonnaAssistantButton (`handleCommandSubmit`):**
1. Protected voice phrase guard
2. `handleUIDispatch()` — UI action dispatcher
3. Active template draft intercept
4. Attendance natural language intercept
5. Multi-step planner intercept
6. Guided completion active-state intercept
7. COO control command intercept
8. `processDonnaMessage()` — **canonical unified brain** — returns action contract
9. Action contract execution: respond, navigate, start_workflow, start_goal_session, fetch_attention, fetch_brief, open_review, fetch_coo_intelligence, route_coo_prompt, god_mode

**Response rendering:** `cooThread` state → rendered as DonnaWorkflowCards / response bubbles  
**Speech output:** `speakDonna()` → `speakDonnaPremium()` (donnaPremiumVoiceRuntime)

---

### 1B — DonnaVoiceReadyShell (Sidebar / Dedicated Page)

**Files:** `src/components/donna/DonnaVoiceReadyShell.tsx`  
**Rendered in:** `src/app/director/donna/DonnaDirectorShellClient.tsx`, `src/app/coach/donna/CoachDonnaShellClient.tsx`  
**Mounted at:** `/director/donna`, `/coach/donna`

Entry paths into DonnaVoiceReadyShell:
- **Voice dictation** — `useVoiceDictation` hook → transcript → `handleSend()`
- **Text input** — `DonnaChatThread` onSend → `handleSend()`
- **Quick actions** — `handleQuickAction()` → `handleSend()`

**Command routing inside DonnaVoiceReadyShell (`handleSend`):**

Prior to Sprint 934A bridge (original routing only):

1. Recall intercept (session history)
2. Context debug intercept
3. Pending confirmation intercept (drill/gate/skill creation confirm/cancel)
4. Slot-fill handler (pending drill creation slot)
5. Yes/No navigation confirmation
6. Boundary check (`checkQuestionBoundary`)
7. "Hey Donna" activation greeting
8. Workflow memory resume
9. Contextual shorthand / entity commands
10. Review queue intelligence (`detectReviewQueueQuestion`)
11. Academy intelligence COO V2 (`detectIntelligenceQuestion`)
12. Director intelligence brief
13. Page guide intent routing (`whatIsTheBestNextStep`, `buildWhatNextAnswer`)
14. Coach page guide routing
15. Missing context intercept (`detectMissingContext`)
16. Onboarding guide intercept (`detectOnboardingProgressQuestion`)
17. KPI answer (`tryAnswerKpiQuestion`)
18. Focus today / proactive notice (`detectFocusTodayQuestion`)
19. Dashboard priority (`tryAnswerDashboardPriorityQuestion`)
20. Recent decisions (`RECENT_DECISIONS_PATTERNS`)
21. Player progress stall (`PLAYER_PROGRESS_STALL_PATTERNS`)
22. Player action draft
23. Data quality guardian (`DATA_QUALITY_PATTERNS`)
24. Guided review workflow (`detectGuidedReviewIntent`)
25. Player stall reasoning ("why stuck")
26. Assessment finder ("find latest assessment for X")
27. Universal deep link (`resolveEntityFromText`, `isDeepLinkCommand`)
28. Roster attention (`tryAnswerRosterAttentionQuestion`)
29. Coach health (`tryAnswerCoachHealthQuestion`)
30. Curriculum draft follow-up
31. Drill creation flow (`DRILL_CREATION_PATTERN`)
32. Gate creation flow (`GATE_CREATION_PATTERN`)
33. Skill creation flow (`SKILL_CREATION_PATTERN`)
34. Curriculum draft proposal (`tryAnswerCurriculumDraftProposal`)
35. Session adjustment (`tryAnswerSessionAdjustmentQuestion`)
36. Coach cue (`tryAnswerCoachCueQuestion`)
37. Curriculum impact (`tryAnswerCurriculumImpactQuestion`)
38. Curriculum improve operator
39. Curriculum level question (`tryAnswerCurriculumLevelQuestion`)
40. Fitness draft (`tryAnswerFitnessDraftRequest`)
41. Template draft (`tryAnswerTemplateDraftRequest`)
42. COO intelligence (`runDonnaCOOIntelligenceAction`)
43. Director clarification or block (`tryDirectorClarificationOrBlock`)
44. Action preview (`tryBuildActionPreview`)
45. Safe read dispatch (`dispatchSafeReadAction`)
46. **Sprint 934A: processDonnaMessage brain bridge** ← NEW
47. Short phrase handler (`detectShortPhrase`)
48. `routeDonnaPrompt` fallback
49. Honest fallback ("I'm not sure…")

**Response rendering:** `messages` state → rendered as `DonnaChatThread` bubbles  
**Speech output:** `speakDonnaPremium()` (same runtime as DonnaAssistantButton ✓)

---

### 1C — DonnaWakeWordLayer (Wake Word Listener)

**Files:** `src/components/donna/DonnaWakeWordLayer.tsx`, `src/lib/donna/useDonnaWakeWord.ts`  
**Rendered in:** `src/app/director/layout.tsx`

- Runs a persistent `SpeechRecognition` loop in the director portal
- On "Hey Donna" detection → fires `donna:open` CustomEvent → opens **DonnaAssistantButton**
- Does NOT route to DonnaVoiceReadyShell
- Voice commands from wake word go through DonnaAssistantButton → `processDonnaMessage`

---

## 2. Competing State Risks

| Risk | Source | Impact |
|---|---|---|
| **Dual conversation state** | DonnaAssistantButton uses `cooThread` + `convState` + `genericDraft` + `templateDraft`. DonnaVoiceReadyShell uses `messages` + `conv` (useDonnaConversationMode) + `pendingTd`. | Director can see different responses in each surface for the same question. No shared memory between the two surfaces. |
| **Dual command routers** | DonnaAssistantButton routes through `processDonnaMessage`. DonnaVoiceReadyShell has its own 48-step routing chain. | Same question routed differently depending on which surface the director uses. |
| **Dual entity resolvers** | DonnaAssistantButton uses V2 entity resolver (`resolveEntityWithContext`) via `processDonnaMessage`. DonnaVoiceReadyShell uses `resolveEntityFromText` (older). | "Show me Jake" may navigate to different pages depending on surface. |
| **Hey Donna activates wrong surface** | Wake word fires `donna:open` → DonnaAssistantButton. The dedicated `/director/donna` page is unaffected. | A director on `/director/donna` who says "Hey Donna" opens the floating panel, not the page panel. Two sessions in flight. |
| **No cross-surface session memory** | Goal memory, disambiguation state, workflow state are not shared. | "Continue where we left off" in one surface has no knowledge of the other. |
| **Vocabulary / brain knowledge gap** | DonnaVoiceReadyShell has NO access to `processDonnaMessage` brain knowledge (vocabulary, decision rules, philosophy). DonnaAssistantButton has full access. | "What is a wrap-up?" is answered differently (or not at all) in the sidebar vs the floating panel. |

---

## 3. Shared Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DONNA UNIFIED ASSISTANT RUNTIME                       │
│                                                                          │
│  Entry Point A          Entry Point B              Entry Point C         │
│  "Hey Donna"            Sidebar Text/Voice          DonnaAssistantButton │
│  (Wake Word)            (DonnaVoiceReadyShell)      Text/Voice Input     │
│       │                        │                          │              │
│       ▼                        ▼                          │              │
│  donna:open event       handleSend()                       │              │
│       │                  active-state checks               │              │
│       │                  specialized routing               │              │
│       │                        │                          │              │
│       ▼                        ▼                          ▼              │
│  DonnaAssistantButton   ─────────────►  processDonnaMessage()            │
│  handleCommandSubmit()    (bridge)       (canonical brain)                │
│       │                        │              │                           │
│       ▼                        │         action contract                  │
│  processDonnaMessage()         │              │                           │
│       │                        │    ┌─────────┴──────────┐              │
│       ▼                        │    │  respond / navigate │              │
│  action handlers               │    │  start_workflow     │              │
│  (respond, navigate,           │    │  fetch_attention    │              │
│   start_workflow, etc.)        │    │  open_review, etc.  │              │
│       │                        │    └─────────┬──────────┘              │
│       ▼                        │              ▼                           │
│  shared response state         │         route_coo_prompt                 │
│  (cooThread / messages)        │         → fall through to               │
│       │                        │           specialized routing            │
│       ▼                        ▼                                          │
│  speech output (speakDonnaPremium — shared ✓)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

**V1 (Sprint 934A) — Partial Bridge:**
- processDonnaMessage is consulted in DonnaVoiceReadyShell AFTER all specialized routing
- Brain knowledge, V2 entity navigation, and relationship intelligence are now available in the sidebar
- For route_coo_prompt actions, the existing tryAnswer* chain handles them

**V2 (Target — future sprint) — Full Bridge:**
- processDonnaMessage is the FIRST router in DonnaVoiceReadyShell
- Specialized routing (curriculum, fitness, sessions) acts as the `route_coo_prompt` handler
- Conversation state is unified across both surfaces
- Session context is shared

---

## 4. Voice-to-Runtime Flow

### "Hey Donna" Path (as of Sprint 934A)

```
Director says "Hey Donna, what needs attention?"
       │
       ▼
useDonnaWakeWord → SpeechRecognition detects wake phrase
       │
       ▼
detectWakePhrase("hey donna, what needs attention?") → true
extractCommandAfterWake() → "what needs attention?"
       │
       ▼
dispatchDonnaOpen("what needs attention?", autoSubmit: true)
→ window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt, autoSubmit: true } }))
       │
       ▼
DonnaAssistantButton.handleDonnaOpen() (event listener)
→ openDonnaPanel()
→ setTypedText("what needs attention?")
→ setPendingWakeCommand("what needs attention?")
       │
       ▼
useEffect([pendingWakeCommand]) → setTimeout(400ms)
→ handleCommandSubmit("what needs attention?")
       │
       ▼
Active-state checks (protected phrase, UIDispatch, template draft, attendance, multi-step, guided completion, COO control)
→ none match
       │
       ▼
processDonnaMessage({ userMessage: "what needs attention?", role: "director", ... })
→ isAttentionPhrase("what needs attention?") → true
→ returns { action: "fetch_attention" }
       │
       ▼
handleFetchAttention() → calls attention API → renders attention card in cooThread
→ speakDonna(response) → speakDonnaPremium() → TTS output
```

### DonnaVoiceReadyShell Voice Path (as of Sprint 934A)

```
Director uses voice on /director/donna page
       │
       ▼
useVoiceDictation → SpeechRecognition captures speech
       │
       ▼
voice.transcript set
       │
       ▼
useEffect([voice.transcript]) → handleSend(transcript)
       │
       ▼
handleSend routing chain (48 steps)
→ if specialized routing matches → respond and return
→ if no specialized routing matches:
       │
       ▼
processDonnaMessage({ userMessage, role: plainRole, ... })
→ if action === 'respond' (confidence >= 0.80) → show in messages state → return
→ if action === 'navigate' → router.push() + show in messages state → return
→ if action === 'route_coo_prompt' → fall through
       │
       ▼
routeDonnaPrompt (fallback)
→ honest fallback
```

---

## 5. Sidebar-to-Runtime Flow

### Text Input Path (DonnaAssistantButton)

```
Director types in floating panel textarea + presses Enter
       │
       ▼
onKeyDown(Enter) → onCommandSubmit() → handleCommandSubmit(typedText)
       │
       ▼
[same routing as voice path — processDonnaMessage as primary brain]
```

### Text Input Path (DonnaVoiceReadyShell)

```
Director types in DonnaChatThread textarea + presses Enter
       │
       ▼
DonnaChatThread.onSend(text) → handleSend(text)
       │
       ▼
handleSend routing chain (48 steps + brain bridge)
```

---

## 6. Response Rendering Flow

### DonnaAssistantButton

```
processDonnaMessage returns { action: 'respond', response: "..." }
       │
       ▼
setCooThread(prev => [...prev, { user, donna: brainResult.response, type: 'info' }])
       │
       ▼
DonnaWorkflowCards renders cooThread items as response cards
```

### DonnaVoiceReadyShell

```
Brain bridge (Sprint 934A): brainResult.action === 'respond'
       │
       ▼
setMessages(prev => [...prev, { id, role: 'donna', kind: 'text', text: brainResult.response, ... }])
       │
       ▼
DonnaChatThread renders messages as chat bubbles
```

**Gap:** cooThread (DonnaAssistantButton) and messages (DonnaVoiceReadyShell) are completely separate state trees. The same director session sees different histories in each surface.

---

## 7. Speech Output Flow

Both surfaces use the same TTS runtime:

```
DonnaAssistantButton: speakDonna(response) → speakDonnaPremium(response)
DonnaVoiceReadyShell: speakDonnaPremium(response)
```

`speakDonnaPremium` is defined in `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts` and is shared. `stopDonna` is also shared.

**This is the ONE unified path already in place before Sprint 934A.**

**Gap:** Auto-speak trigger differs. DonnaAssistantButton calls `speakDonna` from multiple action handlers. DonnaVoiceReadyShell calls `speakDonnaPremium` inside its `messages` effect. In Sprint 934A brain bridge, `speakDonnaPremium` is called directly when `brainResult.shouldSpeak` is true.

---

## 8. Remaining Gaps

### Gap 1: Dual conversation state (P0)

DonnaAssistantButton and DonnaVoiceReadyShell maintain completely separate conversation state. No cross-surface memory. A director who starts a workflow in the floating panel cannot continue it in the sidebar.

**Fix path:** Sprint 934B — shared conversation context provider that both surfaces read from.

---

### Gap 2: Hey Donna activates floating panel only (P1)

If a director is on `/director/donna` (the dedicated page) and says "Hey Donna", the floating panel opens — not the page. Two DONNA sessions are in flight simultaneously.

**Fix path:** Sprint 934C — DonnaWakeWordLayer checks current pathname; if on a DONNA page, routes the `donna:open` event to the page's `handleSend` instead of the floating panel.

---

### Gap 3: processDonnaMessage is late fallback in DonnaVoiceReadyShell (P1)

Sprint 934A inserts `processDonnaMessage` AFTER all 45 specialized routing steps. Brain vocabulary, entity intelligence, and philosophy are now available in the sidebar, but the brain is not the primary router.

**Fix path:** Sprint 934B — move brain bridge to the top of `handleSend` (after active-state checks). Specialized routing (`tryAnswer*` chain) becomes the `route_coo_prompt` handler.

---

### Gap 4: No guided workflows in sidebar (P2)

DonnaVoiceReadyShell does not support `activeGuidedWorkflowId` or `GoalCompletionSession`. When `processDonnaMessage` returns `start_workflow` or `start_goal_session`, the brain bridge converts these to a text response only — no interactive workflow.

**Fix path:** Sprint 934D — add guided workflow support to DonnaVoiceReadyShell.

---

### Gap 5: No COO state in sidebar brain call (P2)

The brain bridge calls `processDonnaMessage` with `cooState: null`. COO control phrases (pause, resume, reset) will not be recognized in the sidebar.

**Fix path:** Sprint 934E — thread COO state from sidebar context into the brain call.

---

### Gap 6: Entity context not loaded in sidebar brain call (P2)

The brain bridge calls `processDonnaMessage` with `entityContext: null`. V2 entity intelligence disambiguation requires a loaded entity context.

**Fix path:** Sprint 934E — load entity context from the sidebar's `directorCtx` and pass it to the brain.

---

## 9. Certification Test Plan

### Test Group A: Brain knowledge in sidebar

| Test | Input | Expected surface | Expected response |
|---|---|---|---|
| A1 | "what is a wrap-up?" | DonnaVoiceReadyShell | Vocabulary definition from brain |
| A2 | "what is a session?" | DonnaVoiceReadyShell | Vocabulary definition from brain |
| A3 | "what is a template?" | DonnaVoiceReadyShell | Vocabulary definition from brain |
| A4 | "why does DONNA need approval?" | DonnaVoiceReadyShell | Philosophy: AI proposes director approves |
| A5 | "how does donna work?" | DonnaVoiceReadyShell | Philosophy: voice creates, UI confirms |
| A6 | "what counts as stalled?" | DonnaVoiceReadyShell | Decision rule: 90 days threshold |
| A7 | "does donna make things up?" | DonnaVoiceReadyShell | Philosophy: data never invented |

**Pass:** All A tests return a response sourced from the DONNA brain (not the fallback "I'm not sure…").

---

### Test Group B: Unified routing — floating panel

| Test | Input | Route | Expected action |
|---|---|---|---|
| B1 | "what needs attention?" | /director | fetch_attention → attention card |
| B2 | "show me my daily brief" | /director | fetch_brief → brief card |
| B3 | "show review queue" | /director | open_review → review panel |
| B4 | "show me Jake" | /director/players | navigate → /director/players/[id] |
| B5 | "what is a wrap-up?" | /director | respond with brain vocabulary |

---

### Test Group C: Unified routing — sidebar

| Test | Input | Route | Expected action |
|---|---|---|---|
| C1 | "tell me about Orange 2 curriculum" | /director/donna | tryAnswerCurriculumLevelQuestion (not brain) |
| C2 | "what is a wrap-up?" | /director/donna | brain bridge responds |
| C3 | "show me Jake" | /director/donna | brain bridge navigates |
| C4 | "how is overall attendance?" | /director/donna | tryAnswerKpiQuestion or routeDonnaPrompt |

---

### Test Group D: Voice continuity

| Test | Input | Expected behavior |
|---|---|---|
| D1 | Say "Hey Donna, what needs attention?" | Wake word fires → floating panel opens → processDonnaMessage("what needs attention?") → attention card shown and spoken |
| D2 | Say "Hey Donna" (wake only) | Panel opens, microphone activates in panel, director speaks → processDonnaMessage |
| D3 | Type in floating panel after voice | Same session continues — typedText used |
| D4 | Speak in /director/donna after voice | useVoiceDictation → handleSend → brain bridge |

---

### Test Group E: Non-regression

| Test | Input | Route | Expected behavior unchanged |
|---|---|---|---|
| E1 | "add a drill to Orange 2 for serving accuracy" | /director/donna | DRILL_CREATION_PATTERN catches before brain bridge |
| E2 | "what should I focus on today?" | /director/donna | detectFocusTodayQuestion catches before brain bridge |
| E3 | "what are my pending reviews?" | /director/donna | detectReviewQueueQuestion catches before brain bridge |
| E4 | "help" | /director/donna | shortPhrase handler catches after brain bridge |
| E5 | Standard KPI question | /director/donna | tryAnswerKpiQuestion catches before brain bridge |

---

## 10. Implementation Classification

### Sprint 934A Changes

| File | Change | Classification |
|---|---|---|
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Added `processDonnaMessage` import and brain bridge in `handleSend()` before `shortPhrase` handler | Bridge: routes vocab/entity/philosophy through unified brain |
| `docs/qa/DONNA_UNIFIED_ASSISTANT_RUNTIME_934.md` | This document | Architecture audit + certification plan |
| `docs/CHANGELOG.md` | Dated entry | Documentation |

### Build Status

- TypeScript: PASS (no errors introduced)
- Runtime: brain bridge active — sidebar DONNA now consults `processDonnaMessage` for unmatched queries
- Regression risk: LOW — bridge inserts after 45 existing routing steps; only fires when nothing else matched

### What Sprint 934A Achieves

- ✓ One canonical DONNA runtime path documented
- ✓ Both voice and sidebar consult `processDonnaMessage` (sidebar as late fallback)
- ✓ Brain vocabulary / decision rules / philosophy available in sidebar DONNA
- ✓ V2 entity navigation available in sidebar DONNA
- ✓ No duplicate brain entries added
- ✓ No UI redesign
- ✓ Speech output unified (`speakDonnaPremium` already shared)
- ✓ Certification tests documented
- ✗ Full routing unification deferred (processDonnaMessage as primary router in sidebar — Gap 3)
- ✗ Shared conversation state deferred (Gap 1)
- ✗ Hey Donna → sidebar routing deferred (Gap 2)

---

*Generated by Claude Code · Mega Sprint 934–963A — DONNA Unified Assistant Runtime V1*

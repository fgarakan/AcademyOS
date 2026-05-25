# Sprint 815 — DONNA Unified Assistant Experience Audit V1

**Date:** 2026-05-25
**Sprint:** 815
**Type:** Audit — no source code changes
**Files changed:** 2 docs (this document + changelog)
**TypeScript:** Clean (audit sprint)

---

## Why this sprint

User feedback received after Sprint 814:

> "DONNA side panel gets too cluttered."
> "It is hard to follow."
> "There are two different voices for DONNA."
> "There should only be one DONNA voice."
> "There are too many different DONNA buttons everywhere."
> "There should only be one DONNA entry point."
> "DONNA should be page-aware."
> "DONNA should have memory that allows it to stay with the conversation and understand context."
> "DONNA should see what the user sees."
> "DONNA should feel all-knowing within role permissions and page context."

This audit supersedes the Sprint 814 recommendation (Stop/Start Listening Text Commands). The fragmentation problem is the root cause — polishing individual features before fixing unified identity is the wrong sequence.

---

## Source files audited

| Category | Files |
|---|---|
| Global assistant | `src/components/assistant/DonnaAssistantButton.tsx` (4,525 lines) |
| Global assistant modules | `src/components/assistant/DonnaVoiceLayer.tsx`, `VoiceInputButton.tsx`, `DonnaWorkflowCards.tsx`, `DonnaDeveloperTools.tsx` |
| Donna components | `src/components/donna/DONNADirectorMobileCommandBar.tsx`, `DonnaVoiceReadyShell.tsx`, `DonnaSessionContextProvider.tsx` |
| Entry point components | `src/app/director/_components/DonnaDashboardOpenCard.tsx`, `src/components/assistant/DonnaOpenChip.tsx`, `src/app/director/today/TodayDonnaSuggestionChip.tsx`, `src/app/director/level-up/LevelUpDonnaCTA.tsx` |
| Dedicated DONNA pages | `src/app/director/donna/page.tsx`, `src/app/director/donna/DonnaDirectorShellClient.tsx`, `src/app/coach/donna/CoachDonnaShellClient.tsx` |
| Voice systems | `src/components/assistant/donnaServerTtsClient.ts`, `src/components/assistant/useDonnaRealtimeVoice.ts`, `src/components/assistant/donnaVoicePolicy.ts`, `src/lib/donna/donnaVoiceConfig.ts`, `src/app/api/donna/tts/route.ts` |
| Memory/context | `src/lib/donna/donnaSafeSessionMemory.ts`, `src/lib/donna/donnaChatSessionMemory.ts`, `src/lib/donna/donnaLastSessionStore.ts`, `src/lib/donna/donnaSessionContext.ts` |
| Layouts | `src/app/director/layout.tsx`, `src/app/coach/layout.tsx` |
| Director dashboard | `src/app/director/page.tsx` |

---

## Part 1 — DONNA Entry Points Audit

### 1A. Complete entry point inventory

| # | Entry Point | Location | Type | Routes Into | Count |
|---|---|---|---|---|---|
| 1 | **Floating DONNA button** (Sparkles icon, fixed bottom-right) | `src/app/director/layout.tsx` → `DonnaAssistantButton` | Global DONNA trigger | Global DONNA panel | 1 |
| 2 | **Floating DONNA button** (same component, coach role) | `src/app/coach/layout.tsx` → `DonnaAssistantButton` | Global DONNA trigger | Global DONNA panel | 1 |
| 3 | **`DonnaDashboardOpenCard`** | `src/app/director/page.tsx` | Inline DONNA card | Global DONNA panel via `donna:open` event | 1 |
| 4 | **`DonnaOpenChip`** (coach sessions list) | `src/app/coach/sessions/page.tsx` | Per-session chip ("Help me wrap up: X") | Global DONNA panel | N per session |
| 5 | **`DonnaOpenChip`** (coach session detail) | `src/app/coach/sessions/[sessionId]/page.tsx` | Page-level chip | Global DONNA panel | 1 |
| 6 | **`DonnaOpenChip`** (director session detail) | `src/app/director/sessions/[sessionId]/page.tsx` | Page-level chips | Global DONNA panel | N |
| 7 | **`DonnaOpenChip`** (level-up page) | `src/app/director/level-up/page.tsx` | Page-level chips | Global DONNA panel | N |
| 8 | **`DonnaOpenChip`** (parents page) | `src/app/director/parents/page.tsx` | Page-level chips | Global DONNA panel | N |
| 9 | **`LevelUpDonnaCTA`** | `src/app/director/level-up/LevelUpDonnaCTA.tsx` | Page-level CTA button | Global DONNA panel via `donna:open` | 1 |
| 10 | **`TodayDonnaSuggestionChip`** | `src/app/director/today/page.tsx` | Page suggestion chip | Global DONNA panel via `donna:open` | N |
| 11 | **`SessionCoachBriefCTA`** | `src/app/director/sessions/[sessionId]/SessionCoachBriefCTA.tsx` | Page-level button | Global DONNA panel via `donna:open` | 1 |
| 12 | **`QuickAssessmentPanel` chip** | `src/app/director/players/[playerId]/QuickAssessmentPanel.tsx` | Per-player chip | Global DONNA panel via `donna:open` | 1 |
| 13 | **`PlacementEngineClient` chip** | `src/app/director/placement/PlacementEngineClient.tsx` | Page-level button | Global DONNA panel via `donna:open` | 1 |
| 14 | **`CurriculumSetupBuilder` chip** | `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` | Page-level button | Global DONNA panel via `donna:open` | 1 |
| 15 | **`DONNADirectorMobileCommandBar`** | `src/components/donna/DONNADirectorMobileCommandBar.tsx` | Mobile command bar (separate) | **Its own input — NOT global panel** | 1 |
| 16 | **`/director/donna` page** | `src/app/director/donna/page.tsx` → `DonnaVoiceReadyShell` | Full-page DONNA experience | **Separate — not the global panel** | 1 |
| 17 | **`/coach/donna` tab** | `src/app/coach/layout.tsx` (BottomTabBar) → `CoachDonnaShellClient` | Tab-nav DONNA page | **Separate — not the global panel** | 1 |
| 18 | **`/player/ask-donna` page** | `src/app/player/ask-donna/page.tsx` | Player-role DONNA page (static responses) | **Separate — not the global panel** | 1 |
| 19 | **`/parent/ask-donna` page** | `src/app/parent/ask-donna/page.tsx` | Parent-role DONNA page (static responses) | **Separate — not the global panel** | 1 |
| 20 | **Curriculum builder DONNA panels** | `src/components/curriculum/builder/CurriculumDonnaPanel.tsx`, `DonnaAddDrillDraft.tsx`, `DonnaAddAssessmentGateDraft.tsx`, `DonnaAddFitnessExerciseDraft.tsx`, `DonnaAddPlayerMissionDraft.tsx`, `DonnaRewriteLevelDraft.tsx` | Curriculum-embedded DONNA surfaces | Inline panels, not the global panel | 6+ |
| 21 | **Tab chips inside global panel** | `DonnaAssistantButton.tsx` lines ~3438–3486 | In-panel quick action chips | Routes within global panel | 3–4 |

**Total DONNA entry points: 21+ across the application.**

### 1B. Classification

| Classification | Entry Points |
|---|---|
| **True global assistant trigger** | Items 1, 2 (floating buttons in layouts) |
| **Page-level `donna:open` chips** (open global panel with context) | Items 3–14 — 12+ page-level triggers all routing into the global panel via `donna:open` |
| **Duplicate / parallel DONNA** (does NOT open the global panel) | Items 15, 16, 17 — `DONNADirectorMobileCommandBar`, `/director/donna`, `/coach/donna` |
| **Role-scoped separate DONNA** (player/parent) | Items 18, 19 — player and parent ask-donna pages |
| **Embedded workflow panels** | Item 20 — curriculum builder embedded DONNA panels |

### 1C. Answers to audit questions

**Q1: How many DONNA entry points exist?**
21+ distinct DONNA entry points. From the user's perspective, there are at minimum 3–5 visually different DONNA surfaces on any given director screen at the same time (floating button, inline card, page chips, mobile command bar, sidebar link to `/director/donna`).

**Q2: Which one is the true global assistant?**
`DonnaAssistantButton` rendered in `director/layout.tsx` and `coach/layout.tsx`. This is the one persistent stateful assistant with conversation memory, voice, and full context access.

**Q3: Which ones duplicate each other?**
- `DONNADirectorMobileCommandBar`: Has its own DONNA input that does NOT open the global panel. Its `onCommand` callback routes somewhere, but creates a parallel DONNA input experience.
- `/director/donna` page: Full-page DONNA experience using `DonnaVoiceReadyShell` — entirely separate state, separate conversation, separate memory from the floating DONNA panel.
- `/coach/donna` tab: Same situation — separate `DonnaVoiceReadyShell`, separate state.
- `DonnaDashboardOpenCard` + floating button: Both on the same page (director dashboard). Different visual affordances but same destination.

**Q4: Which page-level buttons should become "Ask DONNA about this page"?**
All `DonnaOpenChip` instances, `TodayDonnaSuggestionChip`, `LevelUpDonnaCTA`, `SessionCoachBriefCTA`, `QuickAssessmentPanel` chip, `PlacementEngineClient` chip, `CurriculumSetupBuilder` chip — these should open the global panel with a `contextIntent` parameter, not create new instances.

**Q5: Which should be removed entirely?**
- `DONNADirectorMobileCommandBar`: Its own DONNA input duplicates the global panel without connecting to it. The mobile director command bar is a useful affordance but its DONNA command should route into the global panel, not create a separate input path.
- The floating `DonnaDashboardOpenCard` can stay but should be simplified — the floating button already serves this role.

**Q6: Which should remain but become secondary?**
- `/director/donna` page: Keep as an advanced DONNA hub, but wire it to the same conversation state as the global panel.
- Curriculum builder embedded DONNA panels: Keep for workflow-specific actions.

---

## Part 2 — DONNA Side Panel Clutter Audit

### 2A. Section inventory (default panel — what can appear simultaneously)

Reading `DonnaAssistantButton.tsx` panel render section (~lines 3320–4525):

| Section | Always Visible | Conditional | Priority | Classification |
|---|---|---|---|---|
| **Header** (DONNA name, status badge, page context, review queue badge, close) | ✅ | — | Primary | Primary |
| **Tab chips** (3 quick action chips + optional "Back to") | ✅ | — | Primary | Primary |
| **Idle presence card** ("I'm here when you need me") | — | After 3 min inactivity | Low | Collapse by default |
| **Page actions card** ("What DONNA can do here") | — | After chip click | Medium | Secondary |
| **Greeting card** ("How can I help you today?") | — | First open only | Medium | Primary (first open) |
| **Conversation thread** (`cooThread`) | — | After any COO response | Primary | Primary |
| **Workflow cards** (via `DonnaWorkflowCards` composite) | ✅ | — | — | Composite (see below) |
| → Command response ("DONNA says") card | — | After any response | Primary | Primary |
| → Daily brief card | — | After "daily brief" intent | Medium | Secondary |
| → Attention report card | — | After "attention" intent | Medium | Secondary |
| → Predictive recommendations (from context) | — | After context loaded | Medium | Secondary |
| → Communication draft card | — | Active draft | High | Primary when active |
| → Attendance exception draft | — | Active draft | High | Primary when active |
| → Onboarding suggestions | — | After onboarding | Low | Secondary |
| → Context summary card | — | After context loaded, persists across nav | Medium | Secondary (can be stale) |
| **Action preview card** | — | After route_to_review response | Medium | Secondary |
| **Guide me response** | — | activeMode === 'guide' | Medium | Secondary |
| **Explain this screen response** | — | activeMode === 'explain' | Medium | Secondary |
| **Find something response** | — | activeMode === 'find' | Medium | Secondary |
| **Template creation content** | — | activeMode === 'create_template' | High | Primary when active |
| **Multi-step plan card** | — | Multi-step intent detected | Medium | Secondary |
| **Guided task content** | — | activeMode === 'guided_task' | High | Primary when active |
| **Review queue panel** | — | activeMode === 'review_queue' | High | Primary when active |
| **Predictive suggestions** ("Recommendations") | — | After context loaded | Medium | **Duplicate with DonnaWorkflowCards recommendations** |
| **"Ask about this page" button** | ✅ | — | Medium | Secondary |
| **Mode buttons** (Review Queue always visible, others behind "More options") | ✅ Partial | Behind toggle | Low–Medium | Secondary |
| **Voice layer card** (`DonnaVoiceLayer`) | ✅ | — | Primary | Primary |
| **Safety footer** (`DONNA_SAFETY_REMINDER`) | ✅ | — | Required | Compact footer |
| **Developer tools** (`DonnaDeveloperTools`) | ✅ | — | **Never user-facing** | Developer-only |

### 2B. Clutter root causes

**Root Cause 1 — No visual hierarchy between active conversation and background data**
The panel can simultaneously show: greeting card + cooThread + commandResponse card + contextSummary card + predictive recommendations + suggestions. There is no "foreground active response" vs "background data" separation. Everything renders in the same scroll container with the same visual weight.

**Root Cause 2 — Two "Recommendations" surfaces**
`DonnaWorkflowCards` renders a recommendations card (from `recommendationSet`). The panel body also directly renders "Recommendations" from `suggestions` (predictive suggestions from context). The user sees `Recommendations` labeled twice in the same scroll area.

**Root Cause 3 — Context summary card persists as a stale block**
`contextSummary` persists across navigation (Sprint 811). When the director navigates from Players → Sessions, the old Players context summary is still visible in the panel. It's labeled with the previous page. This creates a "data dump from the wrong page" sensation.

**Root Cause 4 — Daily Brief, Attention Report, and Context Summary are all "background information" cards shown at the same level as the active conversation**
When director asks "What's the daily brief?", then navigates, then asks "What needs attention?", they now have: greeting + daily brief card + attention report card + context summary in the panel simultaneously — all competing for attention.

**Root Cause 5 — Developer Tools visible to real users**
`DonnaDeveloperTools` renders unconditionally (no `process.env.NODE_ENV !== 'production'` guard). It contains voice diagnostic information, test buttons, audit trail access, and session storage keys — none of which belong in a production director panel.

**Root Cause 6 — Voice layer card is always visible even without active voice**
`DonnaVoiceLayer` renders at the bottom of the panel regardless of whether the director is using voice. The entire voice input area (mic button + text input + suggestion chips) is always present, even when the director is mid-conversation via text.

**Root Cause 7 — "Ask about this page" button competes with other entry points**
The panel has its own "Ask about this page" button inside the scrollable body, PLUS the inline `DonnaDashboardOpenCard` and `DonnaOpenChip` on various pages also serve this role. The director sees this affordance in multiple places.

### 2C. Target side panel default view

**Target (post-816+):**

```
HEADER
  [sparkles] DONNA     [Review-first]  [Thinking…]
  ↳ Player Directory                   [✕ 44px]

CONVERSATION (scrollable)
  DONNA: 3 players need attention...
  [Recommended next step]

INPUT AREA
  [textarea: Ask DONNA what needs attention…]
  [🎤 mic]  [Send]  DONNA drafts. You approve.

--- COLLAPSED SECTIONS ---
  [▸ Context]   [▸ Suggestions]   [▸ Actions]   [▸ More]
```

**Sections and visibility:**

| Section | Default | User-triggered |
|---|---|---|
| Header (name + status + page context + close) | Always | — |
| Conversation (last DONNA response + recommended next step) | Always | — |
| Input (textarea + mic + send + safety) | Always | — |
| Context summary | Collapsed | Tap "Context" |
| Recommendations / suggestions | Collapsed | Tap "Suggestions" |
| Workflow drafts (active) | Visible when active | Auto-shown when task started |
| Daily brief | Collapsed | Tap "More" |
| Attention report | Collapsed | Tap "More" |
| Mode buttons (Review Queue, Guide, Find, etc.) | Collapsed | Tap "Actions" |
| Developer Tools | **Hidden in production** | Dev/staging only |

---

## Part 3 — Two Voice Systems Audit

### 3A. Voice system inventory

| System | Type | Files | Purpose | When Used |
|---|---|---|---|---|
| **OpenAI Realtime (WebRTC)** | TTS output (receive-only) | `useDonnaRealtimeVoice.ts`, `/api/director/interview/realtime-session/route.ts` | Primary voice for greetings and onboarding intro steps | `playOnboardingVoice()` — panel first open, onboarding steps |
| **OpenAI Server TTS** | TTS output (HTTP) | `donnaServerTtsClient.ts`, `/api/donna/tts/route.ts`, voice: `marin` (gpt-4o-mini-tts) | Contract TTS for guided task questions and workflow prompts | `speakDonna()` — all guided task Q&A, next missing-field questions |
| **Browser `speechSynthesis`** | TTS output (local) | `DonnaAssistantButton.tsx` (`speakAssistantText()`), `donnaServerTtsClient.ts` (`browserTtsFallback()`) | Fallback for both Realtime and Server TTS; also used directly for greeting text on fallback path | Fallback when `OPENAI_API_KEY` absent; also explicitly used in `speakAssistantText()` for greetings |
| **Browser `SpeechRecognition`** | STT input | `VoiceInputButton.tsx`, `DONNAVoiceInputButton.tsx`, `useVoiceDictation.ts` | Mic input for DONNA commands | `DonnaVoiceLayer` mic input; persistent session mode |
| **OpenAI Whisper (server)** | STT input | `/api/coach/sessions/[sessionId]/transcribe/route.ts` | Server transcription for coach wrap-up audio | `AudioRecorderButton` in coach wrap-up only |

### 3B. Voice output call paths (the "two voices" problem)

**Path 1 — Greeting/Onboarding (priority: Realtime → browser)**
```
playOnboardingVoice()
  → realtimeConnect()          [OpenAI Realtime WebRTC]
  → if fails: speakAssistantText()  [browser speechSynthesis]
```

**Path 2 — Guided task questions + workflow (priority: server TTS → browser)**
```
speakDonna()
  → speakWithServerTts()       [OpenAI gpt-4o-mini-tts, voice: marin]
  → if fails: browserTtsFallback()  [browser speechSynthesis]
```

**Why the user hears two different voices:**
- When `OPENAI_API_KEY` is configured AND Realtime connects:
  - Greeting: **Realtime voice** (WebRTC audio, typically `alloy` or default realtime voice)
  - Guided task question: **marin** (OpenAI TTS-1, warm professional cadence)
  - Result: Two noticeably different AI voices for what is supposed to be one DONNA
- When `OPENAI_API_KEY` is NOT configured:
  - Both paths fall back to **browser `speechSynthesis`**
  - One voice but lower quality — not the DONNA voice identity

### 3C. Answers to audit questions

**Q1: Why are there two DONNA voices?**
The Realtime path (for greetings) and the Server TTS path (for task questions) were built in separate sprints (Sprint 297 for Realtime, Sprint 350 for Server TTS) without a unified voice routing strategy. Each solves a different problem — Realtime is bidirectional and streaming, Server TTS is batch HTTP — but both ended up being user-facing output paths without reconciliation.

**Q2: Which voice system should be primary?**
Server TTS (`/api/donna/tts` → `marin`) should be the primary user-facing voice. It has consistent quality, uses the defined `DONNA_VOICE_INSTRUCTIONS`, is designed for the DONNA COO persona, and works reliably over HTTP.

**Q3: Which voice system should be fallback only?**
- Browser `speechSynthesis`: invisible fallback when API key is absent
- OpenAI Realtime: Should be restricted to Academy Setup / Director Interview onboarding — a specific interactive context where its streaming/conversational nature provides genuine value. It should NOT be used for general DONNA greeting or task questions.

**Q4: Are both voices exposed to the user?**
Yes. Both Realtime and Server TTS can fire in the same panel session. If Realtime connects for the greeting and then a guided task is started, the user hears two different voices in sequence.

**Q5: Is the panel showing fallback/debug language?**
Yes. `DonnaDeveloperTools` (visible unconditionally) shows:
- "Server TTS: marin (contract)" vs "Browser TTS" vs "Silent" labels
- Voice diagnostic states
- Last TTS source info (`lastServerTtsInfo`)
- Session storage keys
These are development-time diagnostics that should never appear in production.

**Q6: Is there a single source of truth for DONNA voice state?**
No. Voice state is fragmented:
- `realtimeStatus` (from `useDonnaRealtimeVoice`)
- `voiceGreetingStatus` ('idle' | 'starting' | 'speaking' | 'stalled' | 'done' | 'error')
- `isSpeaking` (shared TTS speaking state)
- `voiceStateForIndicator` (from `VoiceInputButton`)
- `lastServerTtsInfo` (developer display)
- `activatedVoiceModeRef` (which mode fired for greeting)

**Q7: Does DONNA ever speak in one voice and then another?**
Yes — when OPENAI_API_KEY is set and Realtime connects. Greeting in Realtime → task question in marin. This is the most disorienting case.

### 3D. Target voice architecture

```
One public voice: marin (OpenAI Server TTS)
  Primary:  /api/donna/tts → gpt-4o-mini-tts → marin + DONNA_VOICE_INSTRUCTIONS
  Fallback: browser speechSynthesis (invisible — user never knows)

OpenAI Realtime:
  Restricted to: /director/onboarding/interview path only
  NOT used for: floating DONNA panel greeting or task questions

Voice state: single source
  isVoiceSpeaking: boolean
  voiceMode: 'server_tts' | 'browser_fallback' | 'silent'
  (never 'realtime' for main panel)
```

---

## Part 4 — DONNA Memory/Context Audit

### 4A. What DONNA currently remembers

| Memory | Type | Storage | Clears When | Notes |
|---|---|---|---|---|
| `commandResponse` | Last DONNA text response | React state | Panel close / explicit dismiss / new submission | Sprint 801: persists across route changes |
| `cooThread` | Full conversation thread (user + DONNA turns, last 5) | React state | Panel close | Sprint 683: persists across route changes |
| `contextSummary` | Academy data summary fetched by DONNA | React state | Panel close / explicit dismiss | Sprint 811: persists across route changes — **can become stale** |
| `suggestions` | Predictive suggestions from context | React state | Panel close / individual dismiss | Sprint 811: persists — **can be from wrong page** |
| `reviewQueueData` | Review queue summary | React state | Panel close / fetch error | Sprint 811: persists |
| `sessionIntentContext` | Current-session follow-up context ("the other two") | React state | Route change + panel close | Sprint 785 — clears on nav, loses follow-up |
| `donnaSafeSessionMemory` | Last 5 prompts, last 5 summaries, current route, last safe entity | sessionStorage | Tab close | Sprint 691 — tab-scoped only |
| `donnaChatSessionMemory` | Turn history for the current app session | In-memory (RAM) | Page refresh | Sprint 702 |
| `donnaLastSessionStore` | Previous session page label + route + last action label | localStorage (academy-scoped) | Never automatically | Sprint 784 |
| `DonnaSessionContext` | `panelOpen`, `lastRoute`, `lastModule`, `lastPrompt`, `lastObjectLabel`, `lastSummary` | React Context | `clearSession()` | Sprint 625/686 |

### 4B. Answers to audit questions

**Q1: Does DONNA remember the conversation across route changes?**
Partially. `cooThread` (turns) persists. `commandResponse` persists. `sessionIntentContext` (follow-up context: "the other two") is **cleared on every route change** — this is the most significant gap. If the director asks "What are the 3 players needing attention?" and DONNA says "Lucas, Emma, and two others" and then navigates to Players, asking "Show me the other two" loses context.

**Q2: Does DONNA know the current page after navigation?**
Yes — `resolvePageContext(pathname)` from `donnaPageContextRegistry` gives DONNA the page label, purpose, nextAction, suggestedPrompts, and screenName. This updates correctly on navigation.

**Q3: Does DONNA know what page-level data the user is seeing?**
No. `resolvePageContext()` returns static strings (purpose, next step) — not live data. DONNA does not know "the director is currently looking at 47 active players with 3 filtered by Red level." The `contextSummary` contains academy-wide data from the last explicit context fetch, not the current page's visible state.

**Q4: Does DONNA understand visible filters/search state?**
No. No page registers its active filters with DONNA.

**Q5: Does DONNA know the currently selected entity?**
Partially. `getCurrentPageObject(pathname)` in `donnaCurrentObjectContext.ts` can infer the current player/session/template ID from the URL. But this is URL-parsing only — not rich page state.

**Q6: Does DONNA lose context after close/open?**
Yes. All React state clears on `closePanel()`. The `pannelOpen` sessionStorage restore (Sprint 787) reopens the panel but does not restore the conversation thread. The director who had a good DONNA conversation, closes the panel to navigate, and reopens it — gets a blank panel with just "I'm here when you need me."

**Q7: What memory is safe to persist only in React state?**
- Active workflow drafts (`genericDraft`, `templateDraft`, `attendanceExceptionDraft`)
- Transient UI state (`activeMode`, `showMoreOptions`, `showPageActions`)
- Voice state (`voiceStateForIndicator`, `isSpeaking`)

**Q8: What memory is safe for sessionStorage?**
- Conversation thread (user prompts + DONNA responses, current session only, truncated)
- `panelOpen` state (already done, Sprint 787)
- `lastContextFetchRoute` (to detect staleness)
- Page label on navigate

**Q9: What memory should never be stored?**
- Raw voice transcripts
- Audio recordings
- Player names in private context
- Coach notes or observations
- Parent contact details
- Any data that would violate FERPA/privacy if stored in the clear

**Q10: What needs backend-supported conversation memory later?**
- Director-approved preferences ("DONNA, I prefer you start with review queue")
- Approved session summaries (with explicit director opt-in)
- Long-term pattern recognition ("This director always asks about attendance first on Mondays")

### 4C. Memory gaps that cause the "hard to follow" user complaint

1. **`sessionIntentContext` clears on navigation** → "the other two" is forgotten the moment the director clicks a link
2. **`cooThread` not persisted to sessionStorage** → conversation is lost on panel close/reopen
3. **`contextSummary` persists but becomes stale silently** → no indicator that the data is from the previous page
4. **No structured page context registration** → DONNA cannot answer "What am I looking at?" with live page data
5. **Panel close clears everything** → opening DONNA again feels like meeting a stranger

---

## Part 5 — "DONNA Sees What I See" Technical Definition

### 5A. Current state vs. target for each major route

| Route | DONNA currently knows | Target: DONNA should know |
|---|---|---|
| `/director` (Daily Command) | Page label "Director Dashboard", static nextAction string | Review queue count, player attention count, sessions today/week, total alerts, first action recommendation |
| `/director/players` | Page label "Player Directory", static purpose string | Total active players, visible filter state, players without curriculum level, pending placements, players with attention flag, visible list count |
| `/director/curriculum/builder` | Page label "Curriculum Builder" | Selected level, coverage status, draft state (pending/clean), review queue curriculum items count |
| `/director/review` | Page label "Review Queue" | Total pending, urgent count, item types (wrap-ups vs. placements vs. voice intakes), oldest item age |
| `/director/sessions` | Page label "Sessions" | Sessions today, sessions this week, sessions missing recap, attendance exceptions pending |
| `/director/sessions/[sessionId]` | Session ID from URL | Session name, coach, date, block count, recap status |
| `/director/players/[playerId]` | Player ID from URL, can pre-populate task fields | Player name, level, last assessment date, open gates, recent signal count |
| `/director/level-up` | Page label | Level-up candidates count, blocked count, last advancement date |
| `/coach` | Page label | Today's session count, active attendance exceptions, missing recaps |

### 5B. Proposed page context registry contract

Each major page should export a structured `DonnaPageContext` object:

```typescript
interface DonnaPageContext {
  pageId: string                    // 'director_daily_command' | 'player_directory' | etc.
  pageTitle: string                 // Human-readable, e.g. "Player Directory"
  role: 'director' | 'coach' | 'player' | 'parent'
  // Live counts (from page data props)
  visibleCounts?: {
    primary: { label: string; value: number }
    secondary?: { label: string; value: number }[]
  }
  // Active filters/state
  activeFilters?: Array<{ key: string; value: string }>
  // Selected entity (if on a detail page)
  selectedEntity?: {
    type: 'player' | 'session' | 'template' | 'level'
    id: string
    label: string
  }
  // Safe 1-sentence summary of what the director is looking at
  safeSummary: string               // "You're looking at 47 active players, 3 need attention."
  // Next recommended action
  recommendedNextAction: string     // "Review the 2 players flagged for assessment."
  // Available DONNA actions on this page
  primaryActions: string[]          // ["Draft attendance exception", "Ask about a player"]
  // What DONNA can navigate to from here
  availableNavigationTargets?: Array<{ label: string; href: string }>
}
```

This context object would be:
1. Registered by each page component (Server Component passes it as a prop to a thin client Context Provider)
2. Read by `DonnaAssistantButton` via a new `useDonnaPageContext()` hook
3. Included in DONNA's response composition (`donnaResponseComposer.ts`)
4. Updated on every page load (not on every navigation — pages themselves pass it)

### 5C. Target DONNA answers

With page context registered, DONNA should reliably answer:

| Question | Answer source |
|---|---|
| "What am I looking at?" | `context.safeSummary` |
| "What matters here?" | `context.recommendedNextAction` |
| "What should I do first?" | `context.primaryActions[0]` + review queue data |
| "What are the other two?" (follow-up) | `sessionIntentContext` — must survive navigation |
| "Open that." | `context.availableNavigationTargets[matched]` via `router.push` |
| "Why?" | Explanation built from `contextSummary` or page-specific intelligence |
| "What can you do on this page?" | `context.primaryActions` |

---

## Part 6 — Proposed Singleton Architecture

### 6A. DONNA Singleton Shell

**Problem now:** `DonnaAssistantButton` (4,525 lines) is both the shell, the state manager, the voice orchestrator, the command router, the render engine, the memory manager, and the draft system. All in one component. Every sprint that touches DONNA must edit this one file.

**Target architecture:**

```
DonnaProvider (context only — no rendering)
  ├── donnaConversationStore      (conversation thread, intent context)
  ├── donnaVoiceStore             (speaking state, mode, mic state)
  ├── donnaPageContextStore       (current page registration)
  └── donnaUIStore                (panelOpen, activeMode, draft state)

DonnaShell (rendering only — reads from Provider)
  ├── DonnaPanelHeader            (name, status, page context, close)
  ├── DonnaConversationView       (thread + current response)
  ├── DonnaInputBar               (textarea + mic + send + safety)
  ├── DonnaContextDrawer          (collapsed — context summary, suggestions)
  └── DonnaActionsDrawer          (collapsed — modes, drafts, review queue)

DonnaFloatingButton               (one trigger — reads panelOpen from Provider)
```

**Key constraints:**
- One global provider in each role layout (`director/layout.tsx`, `coach/layout.tsx`)
- `DonnaAssistantButton` split into: Provider + Shell + FloatingButton
- No duplicate instances possible — provider is singleton at layout level
- `donna:open` event continues to work for page-level `contextIntent` passing

### 6B. DONNA Context Registry

**Problem now:** Pages do not register context. DONNA has only static page labels.

**Target:**

```typescript
// Each page registers context on mount
useDonnaPageContext({
  pageId: 'player_directory',
  pageTitle: 'Player Directory',
  visibleCounts: { primary: { label: 'Active players', value: activePlayers } },
  activeFilters: searchFilter ? [{ key: 'status', value: searchFilter }] : [],
  safeSummary: `${activePlayers} active players. ${attentionCount} need attention.`,
  recommendedNextAction: attentionCount > 0 
    ? `Review ${attentionCount} flagged players.`
    : 'All players are on track.',
  primaryActions: ['Ask about a player', 'Draft attendance exception'],
})
```

**Safety rules for page context registration:**
- Safe: counts, filter state, page-level labels
- Safe: navigation targets, page purpose
- Never: individual player names, private data, coach notes
- Never: anything that would violate role permissions

### 6C. DONNA Voice Singleton

**Problem now:** Two competing TTS paths (Realtime + Server TTS) can fire in the same session.

**Target:**

```
Primary user-facing voice: /api/donna/tts → marin
  Used for: ALL DONNA speech output in the floating panel
  Config: donnaVoiceConfig.ts (already exists, already correct)

Browser speechSynthesis: invisible fallback
  Used for: ONLY when OPENAI_API_KEY absent or server TTS fails
  Never surfaced to user as a separate "mode"

OpenAI Realtime: restricted to /director/onboarding/interview only
  NOT used in the floating DONNA panel
  Reason: creates voice discontinuity with the marin persona

Voice state: one source of truth
  type DonnaVoiceState = {
    isSpeaking: boolean
    mode: 'server_tts' | 'browser_fallback' | 'silent'  // not exposed to user
    isListening: boolean
  }
```

**Implementation rule:** `playOnboardingVoice()` in `DonnaAssistantButton.tsx` currently tries Realtime first. This should be changed to use `speakDonna()` (Server TTS path) for all floating panel voice output.

### 6D. DONNA Memory Layer

**Conversation memory (safe to implement now — Sprint 816–818):**

| Layer | Storage | What | When |
|---|---|---|---|
| Active conversation | React state (Provider) | Current cooThread, intent context | Panel open |
| Session persistence | sessionStorage | Last 10 turns (user prompt + DONNA response), panel open state, last page context | Session lifetime (tab) |
| Cross-session (safe only) | localStorage | Last page label + route, last safe action label | On panel close |
| Backend memory (future) | Supabase | Director-approved preferences, approved summaries | Sprint 830+ (requires schema) |

**Key change:** `sessionIntentContext` (follow-up resolver) should persist in sessionStorage, not be cleared on route change. "The other two" should survive a navigation click.

### 6E. DONNA Panel Simplification (target)

**Default panel (always visible):**
1. Header: DONNA · status badge · current page label · close
2. Conversation: last DONNA response + "Recommended next step"
3. Input: textarea + mic button + Send + "DONNA drafts. You approve."

**Collapsed behind disclosure buttons:**
- `[Context]` — page context summary (with staleness indicator if from previous route)
- `[Suggestions]` — predictive recommendations
- `[Actions]` — workflow modes (review queue, create template, guided task, etc.)
- `[More]` — daily brief, attention report, other surfaces

**Never visible in production:**
- Developer tools
- Voice diagnostic labels
- TTS source mode labels

---

## Recommended Implementation Sprints 816–825

| Sprint | Name | Scope | Risk | Goal |
|---|---|---|---|---|
| **816** | DONNA Voice Singleton V1 | Stop Realtime from firing in floating panel. Route all panel voice output through `speakDonna()` (Server TTS → browser fallback). Remove Realtime from `playOnboardingVoice()` for the floating panel. | Low — voice code only, no data, no DB | One DONNA voice |
| **817** | DONNA Developer Tools Production Guard | Gate `DonnaDeveloperTools` behind `process.env.NODE_ENV !== 'production'` or a dev-mode flag. Remove voice mode labels from default panel view. | Low — conditional render only | Clean panel for real users |
| **818** | DONNA Panel Default View Simplification | Collapse Suggestions, Mode Buttons, Daily Brief, Attention Report, Context Summary behind 4 disclosure buttons. Default panel = conversation + input only. | Medium — changes what directors see by default | Panel feels clean |
| **819** | DONNA Session Continuity (Follow-up Memory) | Persist `sessionIntentContext` and `cooThread` to sessionStorage. Restore them on panel reopen. Clear properly on close/logout. | Medium — sessionStorage changes, test carefully | "The other two" survives navigation |
| **820** | DONNA Page Context Registry V1 | Define `DonnaPageContext` type. Register context on `/director/players`, `/director/review`, `/director` landing. Wire into `donnaResponseComposer.ts`. | Medium — new type + page changes | DONNA knows what user sees |
| **821** | DONNA Page Context Registry V2 | Extend to `/director/sessions`, `/director/curriculum`, `/director/players/[id]` | Medium | Full director context coverage |
| **822** | DONNA Entry Point Consolidation | Remove `DONNADirectorMobileCommandBar` separate input — route it to `donna:open` instead. Simplify `DonnaDashboardOpenCard` — floating button already serves this role. | Low — component changes only | Fewer entry points |
| **823** | DONNA Provider Refactor (Shell Split) | Extract `DonnaAssistantButton.tsx` into: Provider + Shell + FloatingButton. No behavior changes. | High — major refactor of 4,525-line file | Maintainable singleton |
| **824** | DONNA Context Staleness Indicator | Show "[from Player Directory]" label when `contextSummary` is from a previous route. Add "Refresh for this page" button. | Low — display only | Context trustworthy |
| **825** | DONNA Certification Sprint | Full re-audit of all 6 audit dimensions. Set score targets for V2. | Low — audit only | Validated improvement |

---

## Highest-Risk Files

| File | Risk | Why |
|---|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | **Critical** | 4,525 lines. All DONNA state, routing, voice, rendering. Any change has wide blast radius. Never edit without a very narrow plan. |
| `src/lib/donna/donnaSafeSessionMemory.ts` | **High** | sessionStorage-backed. Changes to storage schema break continuity for active sessions. |
| `src/components/assistant/useDonnaRealtimeVoice.ts` | **Medium** | WebRTC connection management. Changing when it fires affects audio quality. |
| `src/lib/donna/donnaResponseComposer.ts` | **Medium** | Composes DONNA's answers. Adding page context will change responses. Needs careful testing. |
| `src/app/director/layout.tsx` | **Medium** | Renders `DonnaAssistantButton`. Changes here affect the entire director portal. |

---

## Safety Guardrails — What Must Never Change

| Rule | Enforced by |
|---|---|
| Voice never directly mutates core data | `isProtectedVoicePhrase()` in `donnaVoiceRuntime.ts` — do not weaken |
| All mutations go through `proposed_actions` | Architecture red line — unchanged by any DONNA sprint |
| `execute_approved_action()` is the only execution path | Architecture red line |
| DONNA does not expose parent/player private data across roles | `parentSafeResponseRules.ts`, `donnaRoleBoundaries.ts` |
| `sessionIntentContext` must never contain raw private data | Enforce in Sprint 819 when persisting to sessionStorage |
| Developer tools must never show in production | Sprint 817 |
| Audio never stored | No audio blob hits any storage API |
| `contextSummary` staleness must be visible | Sprint 824 — no silent stale data |

---

## What NOT to Change Yet

| Area | Why |
|---|---|
| `donnaPageContextRegistry.ts` (existing static registry) | Sprint 820 will extend it properly — do not patch individual pages before the type contract is defined |
| `DonnaWorkflowCards.tsx` | Complex composite component. Do not refactor until Sprint 823 shell split is done |
| `src/lib/donna/donnaResponseComposer.ts` | Only change after page context registry is in place (Sprint 820+) |
| `/director/donna` and `/coach/donna` pages | These are currently functional. Do not wire them to the global panel state until Sprint 823 Provider Refactor |
| `/player/ask-donna` and `/parent/ask-donna` | Static, safe, working. Do not touch. |
| Curriculum builder embedded DONNA panels | Functional, isolated. Do not change until curriculum builder v2. |
| `voiceRoleGuardrails.ts` | Stable permission matrix — never weaken without explicit approval |
| `parentSafeResponseRules.ts` | Parent safety — locked |

---

## Summary of Key Findings

| Finding | Severity | Sprint |
|---|---|---|
| 21+ DONNA entry points; 3 parallel DONNA experiences not connected to global panel | High | 822 |
| Two AI voices fire in same session (Realtime + Server TTS) | High | 816 |
| Developer tools visible to production users | High | 817 |
| Side panel shows 7+ information surfaces simultaneously | High | 818 |
| `sessionIntentContext` cleared on every route change | Medium | 819 |
| No structured page context registration | Medium | 820–821 |
| `contextSummary` goes stale silently after navigation | Medium | 824 |
| `DonnaAssistantButton.tsx` is 4,525 lines — unmaintainable | Medium | 823 |
| `DONNADirectorMobileCommandBar` has separate DONNA input not connected to global panel | Medium | 822 |
| Two "Recommendations" surfaces visible simultaneously in panel | Low | 818 |

---

## Files Changed in Sprint 815

- **Created** `docs/DONNA_UNIFIED_ASSISTANT_EXPERIENCE_AUDIT_815.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 815 entry
- **TypeScript:** Clean (audit sprint — no source changes)
